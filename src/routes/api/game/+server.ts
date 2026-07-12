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
import { clearGameState, writeGameState } from '$lib/server/game';

import type { RequestHandler } from './$types';

interface ClearStageRequest {
	intent: 'clear-stage';
	stage: number;
}

interface GiveUpRequest {
	intent: 'give-up';
}

interface ButtonClickedRequest {
	intent: 'button-clicked';
}

type GameRequest = ClearStageRequest | GiveUpRequest | ButtonClickedRequest;

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
			startedAt: null
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
		await writeGameState(cookies, platform, next);

		return json(next satisfies GameState);
	}

	if (body?.intent !== 'clear-stage') {
		error(400, 'Unknown intent');
	}

	// No token, no game. Nothing to clear.
	if (!locals.game.active) {
		error(403, 'Not playing');
	}

	const { stage } = body;
	if (!Number.isInteger(stage) || stage < 1 || stage > MAX_STAGE) {
		error(400, 'No such stage');
	}

	const current = locals.game;

	// Re-clearing a stage already banked. A double-submit, a replayed animation,
	// a back button — honest, and idempotent.
	if (stage <= current.stage) {
		return json(current satisfies GameState);
	}

	// Cleared a stage they were never standing in front of. Progress does not move, and
	// the client is told it was noticed — for this answer only. The token stays clean,
	// so a reload gets on with the game instead of replaying the accusation.
	if (stage > current.stage + 1) {
		return json({ ...current, caught: true } satisfies GameState);
	}

	const next: GameState = { ...current, stage, caught: false };
	await writeGameState(cookies, platform, next);

	return json(next satisfies GameState);
};
