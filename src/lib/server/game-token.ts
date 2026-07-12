// ─── The game token ──────────────────────────────────────────────────────────
//
// The player's progress lives in an HS256 JWT in an httpOnly cookie, and the
// signature is the whole point: the client can read its progress out of the
// token, but it cannot write a new one. Every state change goes through the
// server (src/routes/api/game/+server.ts), which re-signs.
//
// HS256 over Web Crypto rather than a JWT library — Workers ships SubtleCrypto,
// and the alternative is a dependency for ~40 lines of base64url.

import * as semver from 'semver';

import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

import { GAME_TOKEN_VERSION, GAME_MAX_AGE_SECONDS } from '$lib/game/state';
import { abnormalityCodeSet } from '$lib/game/abnoramlity';

import type { AbnormalityCode } from '$lib/game/abnoramlity';

const encoder = new TextEncoder();

/**
 * The signed half of the game state: what the player has *done*, and nothing else.
 * `iat`/`exp` are in seconds, per RFC 7519.
 *
 * `c` (clicked) is here rather than in a plain readable cookie so it cannot be flipped
 * back to false to re-watch the one-time reveal it suppresses. Omitted while false, to
 * keep the token short.
 *
 * `a` (current abnormality) and `d` (discovered abnormalities) drive the challenge
 * stages the same way `stage` does — the client could otherwise reroll its own
 * abnormality by editing a plain cookie, so they are signed in rather than kept
 * alongside the token. Both omitted while empty, to keep the token short.
 *
 * Getting caught cheating is deliberately *not* a claim. It is an event, not a property
 * of the player, and signing it in would make it survive every reload — pinning them to
 * the same accusation for the rest of the run. It lives in a one-shot cookie instead
 * (GAME_CAUGHT_COOKIE).
 */
export interface GameClaims {
	/** Semver string, e.g. `"1.0.0"`. See GAME_TOKEN_VERSION. */
	v: string;
	stage: number;
	c?: boolean;
	a?: AbnormalityCode;
	d?: AbnormalityCode[];
	iat: number;
	exp: number;
}

export type VerifyResult =
	| { ok: true; claims: GameClaims }
	| { ok: false; reason: 'expired' | 'stale' | 'forged' };

// ─── Secret ──────────────────────────────────────────────────────────────────

// Local dev has no Cloudflare secret store. This key is public by definition,
// so anything it signs is forgeable — which is fine, because in dev there is
// nothing to protect. In production a missing secret is a hard failure rather
// than a silent downgrade to this one.
const DEV_SECRET = 'dev-only-game-secret-not-used-in-production';

/**
 * Resolve the signing key. Prefers the Workers binding; falls back to the
 * dynamic private env so `vite dev` and `wrangler dev` both work.
 */
export function getGameSecret(platform: Readonly<App.Platform> | undefined): string {
	const fromPlatform = (platform?.env as Record<string, string | undefined> | undefined)
		?.GAME_SECRET;
	const secret = fromPlatform ?? env.GAME_SECRET;

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

// TextEncoder is typed as writing into an ArrayBufferLike, which SubtleCrypto's
// BufferSource won't accept. It is always a plain ArrayBuffer in practice.
const bytes = (value: string) => encoder.encode(value) as Uint8Array<ArrayBuffer>;

const encodeSegment = (value: unknown) => toBase64Url(encoder.encode(JSON.stringify(value)));

// ─── Signing ─────────────────────────────────────────────────────────────────

// Importing the key is not free, and the secret never changes within an
// isolate's lifetime, so hold onto it.
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
		iat,
		exp: iat + GAME_MAX_AGE_SECONDS
	};

	const body = `${encodeSegment({ alg: 'HS256', typ: 'JWT' })}.${encodeSegment(claims)}`;
	const signature = await crypto.subtle.sign('HMAC', await getKey(secret), bytes(body));

	return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

/**
 * SHA-256 hex digest of a signed token, safe to hand to the client: it is one-way, so
 * it cannot be turned back into the token or the key that signed it. The client uses it
 * as the seed for its next stage-clear proof (see `$lib/game/proof`).
 */
export async function hashGameToken(token: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', bytes(token));

	return Array.from(new Uint8Array(digest))
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');
}

/**
 * Verify and decode a token.
 *
 * Three ways to fail, and the distinction matters because one of them gets the player
 * accused of cheating:
 *
 * - `forged` — not something we signed: bad signature, mangled base64, nonsense claims.
 * - `expired` — genuinely ours, just old. An honest player who wandered off.
 * - `stale` — genuinely ours, but speaks a token version we have retired. This happens
 *   to innocent people whenever the claim shape changes, so it must never be mistaken
 *   for forgery: the signature verified, and only we can produce that.
 */
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

	// Only the major half is enforced. A mismatched major is a shape we no longer speak —
	// the signature already proved we minted this, so that is our doing, not theirs. The
	// minor half is reserved for a future migration to key off; it is not compared here.
	if (
		!semver.valid(claims?.v) ||
		semver.major(claims.v) !== semver.major(GAME_TOKEN_VERSION)
	) {
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

	if (!Number.isFinite(claims.exp) || claims.exp * 1000 <= Date.now()) {
		return { ok: false, reason: 'expired' };
	}

	return { ok: true, claims };
}
