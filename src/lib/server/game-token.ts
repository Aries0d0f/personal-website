// ─── The game token ──────────────────────────────────────────────────────────

import * as semver from 'semver';

import { dev } from '$app/env';
import { GAME_SECRET } from '$app/env/private';

import { GAME_TOKEN_VERSION, GAME_MAX_AGE_SECONDS } from '#lib/game/state.js';
import { abnormalityCodeSet } from '#lib/game/abnoramlity.js';

import type { AbnormalityCode } from '#lib/game/abnoramlity.js';

const encoder = new TextEncoder();

/** Signed progress claims: anything a plain cookie would let the client tamper with. */
export interface GameClaims {
	/** Semver string, e.g. `"1.0.0"`. See GAME_TOKEN_VERSION. */
	v: string;
	stage: number;
	c?: boolean;
	a?: AbnormalityCode;
	d?: AbnormalityCode[];
	w?: boolean;
	n?: number;
	iat: number;
	exp: number;
}

export type VerifyResult =
	| { ok: true; claims: GameClaims }
	| { ok: false; reason: 'expired' | 'stale' | 'forged' };

// ─── Secret ──────────────────────────────────────────────────────────────────

// Public, dev-only key; production throws if GAME_SECRET is missing.
const DEV_SECRET = 'dev-only-game-secret-not-used-in-production';

export function getGameSecret(): string {
	const secret = GAME_SECRET;

	if (secret) return secret;
	if (dev) return DEV_SECRET;

	throw new Error('GAME_SECRET is not set. Run `wrangler secret put GAME_SECRET`.');
}

// ─── base64url ───────────────────────────────────────────────────────────────

function toBase64Url(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);

	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
	const padded = value
		.replace(/-/g, '+')
		.replace(/_/g, '/')
		.padEnd(Math.ceil(value.length / 4) * 4, '=');

	return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

// Cast: SubtleCrypto's BufferSource rejects ArrayBufferLike.
const bytes = (value: string) => encoder.encode(value) as Uint8Array<ArrayBuffer>;

const encodeSegment = (value: unknown) => toBase64Url(encoder.encode(JSON.stringify(value)));

// ─── Signing ─────────────────────────────────────────────────────────────────

const keyCache = new Map<string, Promise<CryptoKey>>();

function getKey(secret: string): Promise<CryptoKey> {
	let key = keyCache.get(secret);

	if (!key) {
		key = crypto.subtle.importKey('raw', bytes(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
			'sign',
			'verify'
		]);
		keyCache.set(secret, key);
	}

	return key;
}

/** Mint a token recording the player's progress. */
export async function signGameToken(
	input: {
		stage: number;
		clicked?: boolean;
		currentAbnormality?: AbnormalityCode | null;
		discoveredAbnormalities?: AbnormalityCode[];
		cleared?: boolean;
		clearTimes?: number;
		issuedAt?: number;
	},
	secret: string
): Promise<string> {
	const iat = input.issuedAt ?? Math.floor(Date.now() / 1000);
	const claims: GameClaims = {
		v: GAME_TOKEN_VERSION,
		stage: input.stage,
		...(input.clicked ? { c: true } : {}),
		...(input.currentAbnormality ? { a: input.currentAbnormality } : {}),
		...(input.discoveredAbnormalities?.length ? { d: input.discoveredAbnormalities } : {}),
		...(input.cleared ? { w: true } : {}),
		...(input.clearTimes ? { n: input.clearTimes } : {}),
		iat,
		exp: iat + GAME_MAX_AGE_SECONDS
	};

	const body = `${encodeSegment({ alg: 'HS256', typ: 'JWT' })}.${encodeSegment(claims)}`;
	const signature = await crypto.subtle.sign('HMAC', await getKey(secret), bytes(body));

	return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

/** SHA-256 hex of a token; one-way, so safe to send to the client as proof seed. */
export async function hashGameToken(token: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', bytes(token));

	return Array.from(new Uint8Array(digest))
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');
}

/** Verify and decode a token. `stale` is ours (signature valid): never treat as forgery. */
export async function verifyGameToken(token: string, secret: string): Promise<VerifyResult> {
	const parts = token.split('.');
	if (parts.length !== 3) return { ok: false, reason: 'forged' };

	const [header, payload, signature] = parts;

	let valid: boolean;
	try {
		valid = await crypto.subtle.verify(
			'HMAC',
			await getKey(secret),
			fromBase64Url(signature),
			bytes(`${header}.${payload}`)
		);
	} catch {
		return { ok: false, reason: 'forged' };
	}

	// Bail before parsing: an unverified payload is attacker-controlled bytes.
	if (!valid) return { ok: false, reason: 'forged' };

	let claims: GameClaims;
	try {
		claims = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
	} catch {
		return { ok: false, reason: 'forged' };
	}

	// Only the major version is enforced; minor is reserved for future migrations.
	if (!semver.valid(claims?.v) || semver.major(claims.v) !== semver.major(GAME_TOKEN_VERSION)) {
		return { ok: false, reason: 'stale' };
	}

	if (!Number.isInteger(claims.stage) || claims.stage < 0) {
		return { ok: false, reason: 'forged' };
	}

	if (claims.a !== undefined && !abnormalityCodeSet.has(claims.a)) {
		return { ok: false, reason: 'forged' };
	}

	if (
		claims.d !== undefined &&
		(!Array.isArray(claims.d) || !claims.d.every((code) => abnormalityCodeSet.has(code)))
	) {
		return { ok: false, reason: 'forged' };
	}

	// We only ever sign `w` as literally true; anything else is not our writing.
	if (claims.w !== undefined && claims.w !== true) {
		return { ok: false, reason: 'forged' };
	}

	if (claims.n !== undefined && (!Number.isInteger(claims.n) || claims.n < 0)) {
		return { ok: false, reason: 'forged' };
	}

	if (!Number.isFinite(claims.exp) || claims.exp * 1000 <= Date.now()) {
		return { ok: false, reason: 'expired' };
	}

	return { ok: true, claims };
}
