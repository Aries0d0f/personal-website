import { getContext, hasContext, setContext } from 'svelte';
import { writable, derived, readable, get } from 'svelte/store';

import type { Writable } from 'svelte/store';

import { computeStageProof } from '$lib/game/proof';
import { IDLE_GAME_STATE } from '$lib/game/state';
import { castAbnormalityCodeToEnum } from '$lib/game/abnoramlity';

import type { GameState } from '$lib/game/state';
import type { Abnormality, AbnormalityCode } from '$lib/game/abnoramlity';

interface Model {
	active: Writable<boolean>;
	stage: Writable<number>;
	caught: Writable<boolean>;
	clicked: Writable<boolean>;
	gameStartAt: Writable<Date | null>;
	proofSeed: Writable<string | null>;
	backButtonClickedTimes: Writable<number>;
	lastMessageUpdatedAt: Writable<Date | null>;
	abnormality: Writable<Abnormality | false>;
	discoveredAbnormalities: Writable<Set<AbnormalityCode>>;
}

const STORE_KEY = Symbol.for('GAME_STORE');

const createGameStore = () => {
	return setContext<Model>(STORE_KEY, {
		active: writable(false),
		stage: writable(0),
		caught: writable(false),
		clicked: writable(false),
		gameStartAt: writable(null),
		proofSeed: writable(null),
		lastMessageUpdatedAt: writable(null),
		backButtonClickedTimes: writable(0),
		abnormality: writable(false),
		discoveredAbnormalities: writable(new Set<AbnormalityCode>())
	});
};

const getStoreContext = () => {
	if (hasContext(STORE_KEY)) {
		return getContext<Model>(STORE_KEY);
	} else {
		return createGameStore();
	}
};

/** Ask the server to change the game state, and take its answer as the truth. */
const post = async (body: Record<string, unknown>): Promise<GameState | null> => {
	const response = await fetch('/api/game', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});

	if (!response.ok) return null;

	return response.json();
};

export const useGameStore = () => {
	const state = getStoreContext();

	const timer = readable(new Date(), (set) => {
		set(new Date());

		const interval = setInterval(() => {
			set(new Date());
		}, 1000);

		return () => clearInterval(interval);
	});

	const timeSecDeltaCalc = ([lastClickedAt, currentTime]: [Date | null, Date]) => {
		if (!lastClickedAt) return 0;
		return Math.floor((currentTime.getTime() - lastClickedAt.getTime()) / 1000);
	};

	const sharedState = {
		timer,
		lastMessageUpdatedAt: state.lastMessageUpdatedAt,
		backButtonClickedTimes: state.backButtonClickedTimes
	};

	const getters = {
		isGameMode: derived(state.active, ($active) => $active),
		stage: derived(state.stage, ($stage) => $stage),
		isCaught: derived(state.caught, ($caught) => $caught),
		hasClicked: derived(state.clicked, ($clicked) => $clicked),
		gameStartAt: derived(state.gameStartAt, ($gameStartAt) => $gameStartAt),
		gameStartSeconds: derived([state.gameStartAt, timer], timeSecDeltaCalc),
		lastMessageUpdateSeconds: derived([state.lastMessageUpdatedAt, timer], timeSecDeltaCalc),
		abnormality: derived(state.abnormality, ($abnormality) => $abnormality)
	};

	const adopt = (server: GameState) => {
		state.active.set(server.active);
		state.stage.set(server.stage);
		state.caught.set(server.caught);
		state.clicked.set(server.clicked);
		state.gameStartAt.set(server.startedAt ? new Date(server.startedAt) : null);
		state.proofSeed.set(server.proofSeed);
		state.abnormality.set(
			server.currentAbnormality ? castAbnormalityCodeToEnum(server.currentAbnormality) : false
		);
		state.discoveredAbnormalities.set(new Set(server.discoveredAbnormalities));
	};

	const actions = {
		syncFromServer: (server: GameState | undefined) => {
			if (!server) return;

			if (!server.active && get(state.active)) return;

			adopt(server);
		},

		clearStage: async (stage: number) => {
			const seed = get(state.proofSeed);
			const startedAt = get(state.gameStartAt);
			const token = seed && startedAt ? computeStageProof(seed, stage, startedAt.getTime()) : null;

			const next = await post({ intent: 'clear-stage', stage, token });
			if (next) {
				adopt(next);
			}
		},

		challengeStage: async (direction: 1 | -1) => {
			if (
				(direction === 1 && !get(state.abnormality)) ||
				(direction === -1 && get(state.abnormality))
			) {
				// Passing challenge, go to next stage.
				actions.clearStage(get(state.stage) + 1);
			} else {
				// Failing challenge, go back to stage 1.
				actions.clearStage(1);
			}
		},

		markClicked: () => {
			if (get(state.clicked)) return;

			state.clicked.set(true);
			void post({ intent: 'button-clicked' });
		},

		giveUp: async () => {
			await post({ intent: 'give-up' });

			adopt(IDLE_GAME_STATE);
			state.backButtonClickedTimes.set(0);
			state.lastMessageUpdatedAt.set(null);
			state.abnormality.set(false);
			state.discoveredAbnormalities.set(new Set());
		}
	};

	return {
		...sharedState,
		...getters,
		...actions
	};
};
