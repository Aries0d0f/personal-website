// Reading and writing the game cookie. The hook reads it on every request; the
// API route is the only thing allowed to write it.

import { dev } from '$app/environment';

import {
	GAME_CAUGHT_COOKIE,
	GAME_COOKIE,
	GAME_MAX_AGE_SECONDS,
	IDLE_GAME_STATE,
	type GameState
} from '$lib/game/state';
import {
	getGameSecret,
	hashGameToken,
	signGameToken,
	verifyGameToken
} from '$lib/server/game-token';

import type { Cookies, RequestEvent } from '@sveltejs/kit';

// httpOnly, so page scripts can neither read the token nor swap it for one of
// their own making. It stays perfectly visible in DevTools → Application, which
// is the right amount of discoverable: the player can see the box, and can't
// pick the lock. `lax` because the game is entered by ordinary top-level
// navigation to /{lang}/game.
const COOKIE_OPTIONS = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax',
	secure: !dev,
	maxAge: GAME_MAX_AGE_SECONDS
} as const;

// The flash lives only long enough to cross the redirect it is set on.
const CAUGHT_COOKIE_OPTIONS = { ...COOKIE_OPTIONS, maxAge: 60 } as const;

/**
 * Leave a note for the next request saying we caught them. Used by the stage-0 trap,
 * which answers with a redirect and so has no page of its own to say it on.
 */
export function markCaught(cookies: Cookies): void {
	cookies.set(GAME_CAUGHT_COOKIE, '1', CAUGHT_COOKIE_OPTIONS);
}

/**
 * Read the note and tear it up. Read-and-clear is the whole point: the accusation is
 * delivered to exactly one render, so reloading the 404 afterwards shows the ordinary
 * script rather than pinning the player to the same line forever.
 */
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

	const secret = getGameSecret(event.platform);
	const result = await verifyGameToken(token, secret);

	if (result.ok) {
		return {
			active: true,
			stage: result.claims.stage,
			caught,
			clicked: result.claims.c === true,
			startedAt: result.claims.iat * 1000,
			proofSeed: await hashGameToken(token)
		};
	}

	// A genuine token, aged out or speaking a version we have retired. Either way it is
	// not their doing, so the run simply ends and they are let back onto the normal site
	// rather than accused of anything.
	if (result.reason === 'expired' || result.reason === 'stale') {
		event.cookies.delete(GAME_COOKIE, { path: '/' });
		return IDLE_GAME_STATE;
	}

	// Forged, mangled, or signed with a key we no longer hold. They were plainly in the
	// game, so keep them in it — but back at the start. This request renders the page
	// itself, so it can carry the accusation directly; no flash needed, and the freshly
	// signed token it leaves behind is clean, so the next reload says nothing.
	const reset: GameState = {
		active: true,
		stage: 0,
		caught: true,
		clicked: false,
		startedAt: Date.now(),
		proofSeed: null
	};
	reset.proofSeed = await writeGameState(event.cookies, event.platform, reset);

	return reset;
}

/**
 * Sign `state` into the cookie. The only path by which progress is recorded. Returns the
 * SHA-256 digest of the token just signed, for the caller to hand the client as its next
 * `proofSeed`.
 */
export async function writeGameState(
	cookies: Cookies,
	platform: Readonly<App.Platform> | undefined,
	state: GameState
): Promise<string> {
	const token = await signGameToken(
		{
			stage: state.stage,
			clicked: state.clicked,
			issuedAt: state.startedAt ? Math.floor(state.startedAt / 1000) : undefined
		},
		getGameSecret(platform)
	);

	cookies.set(GAME_COOKIE, token, COOKIE_OPTIONS);

	return hashGameToken(token);
}

/** Giving up: the token goes, and with it every trace of the run. */
export function clearGameState(cookies: Cookies): void {
	cookies.delete(GAME_COOKIE, { path: '/' });
	cookies.delete(GAME_CAUGHT_COOKIE, { path: '/' });
}
