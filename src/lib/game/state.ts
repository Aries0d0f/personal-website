// The game's shared vocabulary — imported by both the client store and the
// server that signs the token, so it must stay free of any server-only import.

import type { AbnormalityCode } from './abnoramlity';

/** Name of the cookie carrying the signed game token. */
export const GAME_COOKIE = 'game';

/**
 * A one-shot flag, set when the player is caught trying to leave stage 0 by editing
 * the path. It rides the redirect that drags them back and is eaten by the request
 * that renders the 404, so the taunt is delivered exactly once per attempt.
 *
 * Deliberately *not* a claim in the game token: progress belongs in the token, but
 * being caught is a thing that just happened, not a thing that is true about you.
 * Signed into the token it would survive every reload, and the player would be stuck
 * reading the same accusation forever.
 */
export const GAME_CAUGHT_COOKIE = 'game_caught';

/**
 * The claim shape's version, a semver string checked with the `semver` package. Only
 * the major half is enforced — a token whose major we no longer speak is retired
 * rather than rejected, quietly ending the run instead of accusing the player of
 * forgery (see verifyGameToken). The minor half is carried but not yet checked against
 * anything; it exists so a future migration can distinguish "old but compatible"
 * tokens from "old and needs upgrading" without another round of retiring everyone's
 * progress. Patch is unused and always 0.
 */
export const GAME_TOKEN_VERSION = '1.1.0';

/** A game session outlives the browser session, but not by much. */
export const GAME_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/**
 * The highest stage that exists. Stage 0 is "in the game, nothing cleared yet";
 * stage 1 is the 404 page whose status code the player rewrites to 200. Raise
 * this as stages are added — the server refuses to record anything beyond it.
 */
export const MAX_STAGE = 7;

export interface GameState {
	/** Whether the player is inside the game. Giving up or clearing the game turns this off. */
	active: boolean;
	/** Highest stage cleared so far. 0 while the game is running but unbeaten. */
	stage: number;
	/**
	 * We just caught them cheating — editing the path out of stage 0, or presenting a
	 * token we never signed. True for the one render that follows, and false again on
	 * the next; the game says its piece and moves on.
	 */
	caught: boolean;
	/**
	 * Whether the decoy home button has ever been clicked, in this run, on any visit.
	 *
	 * The click counter itself is in-memory and resets on reload — that is fine, it only
	 * feeds the escalating chatter. This does not reset, because the first two lines of
	 * that chatter are a one-time reveal (the button admitting it is not a way home), and
	 * a reload must not rewind the joke and play it again.
	 */
	clicked: boolean;
	/** When the run began, in epoch ms. Survives reloads via the token's `iat`. */
	startedAt: number | null;
	/**
	 * SHA-256 hex digest of the currently signed token, handed to the client so it can
	 * derive the proof code for its next `clear-stage` request (see `$lib/game/proof`).
	 * One-way, so publishing it cannot leak the token or the key that signed it.
	 */
	proofSeed: string | null;
	currentAbnormality: AbnormalityCode | null;
	discoveredAbnormalities: AbnormalityCode[];
	/**
	 * The run ended in victory. Unlike giving up, clearing does not tear the token up —
	 * it parks it: inactive, progress zeroed, but still carrying `discoveredAbnormalities`
	 * so the collection is waiting when the player comes back for the next challenge
	 * (via the `restart` intent or the front door).
	 */
	cleared: boolean;
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
	cleared: false
};
