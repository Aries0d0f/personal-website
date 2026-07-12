// The game's shared vocabulary — imported by both the client store and the
// server that signs the token, so it must stay free of any server-only import.

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
 * Bumped whenever the claim shape changes. Older tokens are then retired rather than
 * rejected — a version we no longer speak is our fault, not the player's, so it ends
 * the run quietly instead of accusing them of forgery. See verifyGameToken.
 *
 * v2 added `c` (the decoy button has been clicked).
 */
export const GAME_TOKEN_VERSION = 2;

/** A game session outlives the browser session, but not by much. */
export const GAME_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/**
 * The highest stage that exists. Stage 0 is "in the game, nothing cleared yet";
 * stage 1 is the 404 page whose status code the player rewrites to 200. Raise
 * this as stages are added — the server refuses to record anything beyond it.
 */
export const MAX_STAGE = 1;

export interface GameState {
	/** Whether the player is inside the game. Only giving up turns this off. */
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
}

export const IDLE_GAME_STATE: GameState = {
	active: false,
	stage: 0,
	caught: false,
	clicked: false,
	startedAt: null
};
