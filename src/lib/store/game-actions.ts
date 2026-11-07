import { get } from 'svelte/store';
import http from '@aries0d0f/fetch-worker';

import { computeStageProof } from '#lib/game/proof.js';
import { IDLE_GAME_STATE } from '#lib/game/state.js';
import { adopt, getStoreContext } from '#lib/store/game.js';

import type { GameState } from '#lib/game/state.js';
import type { GameModel } from '#lib/store/game.js';

/** Ask the server to change the game state, and take its answer as the truth. */
const post = async (body: Record<string, unknown>): Promise<GameState | null> => {
	return http
		.post<GameState, Record<string, unknown>>('/api/game', body, {
			headers: {
				'Content-Type': 'application/json'
			}
		})
		.then((res) => res.json())
		.catch(() => null);
};

export const createGameActions = (state: GameModel) => {
	const actions = {
		clearStage: async (stage: number) => {
			const seed = get(state.proofSeed);
			const startedAt = get(state.gameStartAt);
			const token = seed && startedAt ? computeStageProof(seed, stage, startedAt.getTime()) : null;

			const next = await post({ intent: 'clear-stage', stage, token });
			if (next) {
				adopt(state, next);
			}
		},

		gameClear: async () => {
			const seed = get(state.proofSeed);
			const startedAt = get(state.gameStartAt);
			const stage = get(state.stage);
			const token = seed && startedAt ? computeStageProof(seed, stage, startedAt.getTime()) : null;

			const next = await post({ intent: 'game-clear', stage, token });
			if (!next) return;

			// Refused — caught, or demoted back to stage 1 — is an ordinary state change.
			if (next.active) {
				adopt(state, next);
				return;
			}

			// Hold the parked state so game mode stays on under the GameClear dialog.
			state.discoveredAbnormalities.set(new Set(next.discoveredAbnormalities));
			state.clearedState.set(next);
		},

		/** Adopt the parked state; navigation is the caller's job. */
		leaveClearedGame: () => {
			const parked = get(state.clearedState);
			if (!parked) return;

			state.clearedState.set(null);
			adopt(state, parked);
			state.backButtonClickedTimes.set(0);
			state.lastMessageUpdatedAt.set(null);
		},

		/** Straight into the next round at stage 1, abnormality collection intact. */
		continueChallenge: async () => {
			const next = await post({ intent: 'restart' });
			if (!next) return;

			state.clearedState.set(null);
			adopt(state, next);
			state.backButtonClickedTimes.set(0);
			state.lastMessageUpdatedAt.set(null);
		},

		challengeStage: async (direction: 1 | -1) => {
			if (
				(direction === 1 && !get(state.abnormality)) ||
				(direction === -1 && get(state.abnormality))
			) {
				if (get(state.stage) === 7) {
					// Game clear
					actions.gameClear();
				} else {
					// Passing challenge, go to next stage.
					actions.clearStage(get(state.stage) + 1);
				}
			} else {
				// Failing challenge, go back to stage 1.
				actions.clearStage(1);
			}
		},

		markClicked: async () => {
			if (get(state.clicked)) return;

			state.clicked.set(true);

			const next = await post({ intent: 'button-clicked' });
			if (next) adopt(state, next);
		},

		giveUp: async () => {
			await post({ intent: 'give-up' });

			adopt(state, IDLE_GAME_STATE);
			state.backButtonClickedTimes.set(0);
			state.lastMessageUpdatedAt.set(null);
			state.abnormality.set(false);
			state.discoveredAbnormalities.set(new Set());
		}
	};

	return actions;
};

// Call during component init.
export const useGameActions = () => createGameActions(getStoreContext());
