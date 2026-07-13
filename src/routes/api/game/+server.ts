// The only place the game cookie is ever written after the initial mint.
//
// The client cannot sign a token, so it cannot promote itself: it can only ask
// the server to record a stage, and the server decides whether that request
// makes any sense. What it cannot do is verify that the player *actually solved*
// stage N — that puzzle lives in the browser, and a determined cheat can always
// POST the request the honest client would have sent. What it can do, and does,
// is enforce that stages fall in order, one at a time, from a token we signed.
// Skipping ahead is the tell, and it gets recorded.

import { error, json } from '@sveltejs/kit';

import { IDLE_GAME_STATE, MAX_STAGE, type GameState } from '$lib/game/state';
import { computeStageProof } from '$lib/game/proof';
import { clearGameState, writeGameState } from '$lib/server/game';
import {
	abnormalityCodeSet,
	isGameOptionsAbnormality,
	isScreenAbnormality
} from '$lib/game/abnoramlity';

import type { RequestHandler } from './$types';
import type { AbnormalityCode } from '$lib/game/abnoramlity';

interface ClearStageRequest {
	intent: 'clear-stage';
	stage: number;
	/** Proof code derived client-side from the current `proofSeed` (see `$lib/game/proof`). */
	token: string;
}

interface GameClearRequest {
	intent: 'game-clear';
	/** The stage the player is standing on — the exit only opens from the last rooms. */
	stage: number;
	/** Proof code for that stage, same scheme as `clear-stage`. */
	token: string;
}

interface RestartRequest {
	intent: 'restart';
}

interface GiveUpRequest {
	intent: 'give-up';
}

interface ButtonClickedRequest {
	intent: 'button-clicked';
}

type GameRequest =
	| ClearStageRequest
	| GameClearRequest
	| RestartRequest
	| GiveUpRequest
	| ButtonClickedRequest;

const randomFromSet = <T>(set: Set<T>): T | null => {
	const arr = Array.from(set);
	if (arr.length === 0) return null;

	const randomIndex = Math.floor(Math.random() * arr.length);
	return arr[randomIndex];
};

const abnormalityLottery = (
	discovered: AbnormalityCode[],
	previous: AbnormalityCode | null
): AbnormalityCode | null => {
	const discoveredSet = new Set(discovered);

	// Never deal the same abnormality twice in a row, never chain two screen
	// effects back-to-back (consecutive screen glitches blur into one long one),
	// and hold the subtle game-options ones until the player has found a couple.
	const excluded = new Set<AbnormalityCode>();
	if (previous) {
		excluded.add(previous);
		if (isScreenAbnormality(previous)) {
			for (const code of abnormalityCodeSet) {
				if (isScreenAbnormality(code)) excluded.add(code);
			}
		}
	}
	if (discoveredSet.size < 10) {
		for (const code of abnormalityCodeSet) {
			if (isGameOptionsAbnormality(code)) excluded.add(code);
		}
	}
	const undiscovered = abnormalityCodeSet.difference(discoveredSet).difference(excluded);
	const rediscoverable = discoveredSet.difference(excluded);

	const randomSeed = Math.random();

	if (randomSeed < 0.1) {
		return null;
	} else if (
		randomSeed < 0.99 - 0.15 * (discoveredSet.size / abnormalityCodeSet.size) &&
		undiscovered.size > 0
	) {
		return randomFromSet(undiscovered);
	} else {
		return randomFromSet(rediscoverable);
	}
};

export const POST: RequestHandler = async ({ request, cookies, platform, locals }) => {
	let body: GameRequest;
	try {
		body = await request.json();
	} catch {
		error(400, 'Malformed request');
	}

	if (body?.intent === 'give-up') {
		clearGameState(cookies);

		return json({
			active: false,
			stage: 0,
			caught: false,
			clicked: false,
			startedAt: null,
			proofSeed: null,
			currentAbnormality: null,
			discoveredAbnormalities: [],
			cleared: false
		} satisfies GameState);
	}

	// Starting the next round from the victory screen. Only a parked token — one that
	// actually cleared the game — may drop straight into stage 1 with its abnormality
	// collection intact. Everyone else walks in through the front door, /{lang}/game.
	if (body?.intent === 'restart') {
		if (locals.game.active || !locals.game.cleared) {
			error(403, 'Nothing to continue');
		}

		const next: GameState = {
			...IDLE_GAME_STATE,
			active: true,
			stage: 1,
			startedAt: Date.now(),
			discoveredAbnormalities: locals.game.discoveredAbnormalities
		};
		next.proofSeed = await writeGameState(cookies, platform, next);

		return json(next satisfies GameState);
	}

	// The player has now seen the decoy button admit what it is. Remember it, so a reload
	// does not rewind that reveal and play it at them a second time. One-way: nothing
	// un-clicks it short of giving up.
	if (body?.intent === 'button-clicked') {
		if (!locals.game.active) {
			error(403, 'Not playing');
		}

		if (locals.game.clicked) {
			return json(locals.game satisfies GameState);
		}

		const next: GameState = { ...locals.game, clicked: true, caught: false };
		next.proofSeed = await writeGameState(cookies, platform, next);

		return json(next satisfies GameState);
	}

	if (body?.intent !== 'clear-stage' && body?.intent !== 'game-clear') {
		error(400, 'Unknown intent');
	}

	// No token, no game. Nothing to clear.
	if (!locals.game.active) {
		error(403, 'Not playing');
	}

	const { stage, token } = body;
	if (!Number.isInteger(stage) || stage < 0 || stage > MAX_STAGE) {
		error(400, 'No such stage');
	}

	const current = locals.game;

	// Anti-cheat. For game-clear the claimed stage is the one being stood on, not the
	// one being reached, so it must match the token exactly — and the exit only opens
	// from the last rooms (the footer keeps it locked below stage 6).
	if (
		body.intent === 'game-clear'
			? stage !== current.stage || current.stage < MAX_STAGE - 1
			: stage > current.stage + 1
	) {
		return json({ ...current, caught: true } satisfies GameState);
	}

	const expected =
		current.proofSeed && current.startedAt
			? computeStageProof(current.proofSeed, stage, current.startedAt)
			: null;

	if (!expected || typeof token !== 'string' || token !== expected) {
		return json({ ...current, caught: true } satisfies GameState);
	}

	if (body.intent === 'game-clear') {
		const next: GameState = {
			...IDLE_GAME_STATE,
			cleared: true,
			discoveredAbnormalities: current.discoveredAbnormalities ?? []
		};
		next.proofSeed = await writeGameState(cookies, platform, next);

		return json(next satisfies GameState);
	}

	const abnormals: Pick<GameState, 'currentAbnormality' | 'discoveredAbnormalities'> =
		stage > 1
			? {
					currentAbnormality: abnormalityLottery(
						current.discoveredAbnormalities ?? [],
						current.currentAbnormality ?? null
					),
					discoveredAbnormalities: current.currentAbnormality
						? Array.from(new Set(current.discoveredAbnormalities).add(current.currentAbnormality))
						: (current.discoveredAbnormalities ?? [])
				}
			: {
					currentAbnormality: null,
					discoveredAbnormalities: current.discoveredAbnormalities ?? []
				};

	const next: GameState = { ...current, ...abnormals, stage, caught: false };
	next.proofSeed = await writeGameState(cookies, platform, next);

	return json(next satisfies GameState);
};
