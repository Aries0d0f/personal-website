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

import { MAX_STAGE, type GameState } from '$lib/game/state';
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

interface GiveUpRequest {
	intent: 'give-up';
}

interface ButtonClickedRequest {
	intent: 'button-clicked';
}

type GameRequest = ClearStageRequest | GiveUpRequest | ButtonClickedRequest;

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
	if (discoveredSet.size < 2) {
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
			discoveredAbnormalities: []
		} satisfies GameState);
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

	if (body?.intent !== 'clear-stage') {
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

	// Anti-cheat
	if (stage > current.stage + 1) {
		return json({ ...current, caught: true } satisfies GameState);
	}

	const expected =
		current.proofSeed && current.startedAt
			? computeStageProof(current.proofSeed, stage, current.startedAt)
			: null;

	if (!expected || typeof token !== 'string' || token !== expected) {
		return json({ ...current, caught: true } satisfies GameState);
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
