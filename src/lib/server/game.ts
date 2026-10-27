import { dev } from '$app/env';

import {
	GAME_CAUGHT_COOKIE,
	GAME_COOKIE,
	GAME_MAX_AGE_SECONDS,
	IDLE_GAME_STATE,
	type GameState
} from '#lib/game/state.js';
import type { Cookies, RequestEvent } from '@sveltejs/kit';

// Loaded on demand: most visitors carry no token, so cold starts skip semver.
const loadGameToken = () => import('#lib/server/game-token.js');

// httpOnly so page scripts can't read or swap the token.
const COOKIE_OPTIONS = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax',
	secure: !dev,
	maxAge: GAME_MAX_AGE_SECONDS
} as const;

// The flash lives only long enough to cross the redirect it is set on.
const CAUGHT_COOKIE_OPTIONS = { ...COOKIE_OPTIONS, maxAge: 60 } as const;

export function markCaught(cookies: Cookies): void {
	cookies.set(GAME_CAUGHT_COOKIE, '1', CAUGHT_COOKIE_OPTIONS);
}

/** Read-and-clear, so the accusation is shown on exactly one render. */
function takeCaught(cookies: Cookies): boolean {
	if (!cookies.get(GAME_CAUGHT_COOKIE)) return false;

	cookies.delete(GAME_CAUGHT_COOKIE, { path: '/' });

	return true;
}

/** Decode the cookie into game state, re-issuing it if we caught a forgery. */
export async function readGameState(event: RequestEvent): Promise<GameState> {
	const caught = takeCaught(event.cookies);
	const token = event.cookies.get(GAME_COOKIE);

	if (!token) return IDLE_GAME_STATE;

	const { getGameSecret, hashGameToken, verifyGameToken } = await loadGameToken();
	const result = await verifyGameToken(token, getGameSecret());

	if (result.ok) {
		// A parked token (`w`) is not an active run.
		const cleared = result.claims.w === true;

		return {
			active: !cleared,
			stage: result.claims.stage,
			caught,
			clicked: result.claims.c === true,
			startedAt: cleared ? null : result.claims.iat * 1000,
			proofSeed: await hashGameToken(token),
			currentAbnormality: result.claims.a ?? null,
			discoveredAbnormalities: result.claims.d ?? [],
			cleared,
			clearTimes: result.claims.n ?? 0
		};
	}

	// Genuine but expired or retired: end the run quietly, never accuse.
	if (result.reason === 'expired' || result.reason === 'stale') {
		event.cookies.delete(GAME_COOKIE, { path: '/' });
		return IDLE_GAME_STATE;
	}

	// Forged: reset to stage 0 and flag as caught.
	const reset: GameState = {
		active: true,
		stage: 0,
		caught: true,
		clicked: false,
		startedAt: Date.now(),
		proofSeed: null,
		currentAbnormality: null,
		discoveredAbnormalities: [],
		cleared: false,
		clearTimes: 0
	};
	reset.proofSeed = await writeGameState(event.cookies, reset);

	return reset;
}

/** Sign `state` into the cookie; returns the new token's hash as the next proofSeed. */
export async function writeGameState(cookies: Cookies, state: GameState): Promise<string> {
	const { getGameSecret, hashGameToken, signGameToken } = await loadGameToken();
	const token = await signGameToken(
		{
			stage: state.stage,
			clicked: state.clicked,
			currentAbnormality: state.currentAbnormality,
			discoveredAbnormalities: state.discoveredAbnormalities,
			cleared: state.cleared,
			clearTimes: state.clearTimes,
			issuedAt: state.startedAt ? Math.floor(state.startedAt / 1000) : undefined
		},
		getGameSecret()
	);

	cookies.set(GAME_COOKIE, token, COOKIE_OPTIONS);

	return hashGameToken(token);
}

/** Giving up: the token goes, and with it every trace of the run. */
export function clearGameState(cookies: Cookies): void {
	cookies.delete(GAME_COOKIE, { path: '/' });
	cookies.delete(GAME_CAUGHT_COOKIE, { path: '/' });
}
