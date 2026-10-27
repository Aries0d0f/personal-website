// Shared by client and server: keep this free of server-only imports.

import type { AbnormalityCode } from './abnoramlity';

/** Name of the cookie carrying the signed game token. */
export const GAME_COOKIE = 'game';

/** One-shot "caught" flag; not a token claim, so it does not survive reloads. */
export const GAME_CAUGHT_COOKIE = 'game_caught';

/** Semver; only the major is enforced (see verifyGameToken). */
export const GAME_TOKEN_VERSION = '1.2.0';

/** A game session outlives the browser session, but not by much. */
export const GAME_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/** Highest stage; the server refuses to record anything beyond it. */
export const MAX_STAGE = 7;

export interface GameState {
	/** Whether the player is inside the game. Giving up or clearing the game turns this off. */
	active: boolean;
	/** Highest stage cleared so far. 0 while the game is running but unbeaten. */
	stage: number;
	/** Caught cheating; true for the one render that follows only. */
	caught: boolean;
	/** Decoy button clicked this run; persisted so a reload can't replay the reveal. */
	clicked: boolean;
	/** When the run began, in epoch ms. Survives reloads via the token's `iat`. */
	startedAt: number | null;
	/** SHA-256 of the signed token; seeds the client's next stage proof. */
	proofSeed: string | null;
	currentAbnormality: AbnormalityCode | null;
	discoveredAbnormalities: AbnormalityCode[];
	/** Run won; the token is parked (inactive) to carry the collection forward. */
	cleared: boolean;
	/** Lifetime game clears; giving up resets it. */
	clearTimes: number;
}

export const IDLE_GAME_STATE: GameState = {
	active: false,
	stage: 0,
	caught: false,
	clicked: false,
	startedAt: null,
	proofSeed: null,
	currentAbnormality: null,
	discoveredAbnormalities: [],
	cleared: false,
	clearTimes: 0
};
