import { getContext, hasContext, setContext } from 'svelte';
import { writable, derived, readable, get } from 'svelte/store';

import { computeStageProof } from '$lib/game/proof';
import { IDLE_GAME_STATE, type GameState } from '$lib/game/state';

import type { Writable } from 'svelte/store';

interface Model {
	active: Writable<boolean>;
	stage: Writable<number>;
	caught: Writable<boolean>;
	clicked: Writable<boolean>;
	gameStartAt: Writable<Date | null>;
	proofSeed: Writable<string | null>;
	backButtonClickedTimes: Writable<number>;
	lastMessageUpdatedAt: Writable<Date | null>;
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
		backButtonClickedTimes: writable(0)
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
		lastMessageUpdateSeconds: derived([state.lastMessageUpdatedAt, timer], timeSecDeltaCalc)
	};

	const adopt = (server: GameState) => {
		state.active.set(server.active);
		state.stage.set(server.stage);
		state.caught.set(server.caught);
		state.clicked.set(server.clicked);
		state.gameStartAt.set(server.startedAt ? new Date(server.startedAt) : null);
		state.proofSeed.set(server.proofSeed);
	};

	const actions = {
		/**
		 * Take the state the server decoded out of the signed cookie. Called from the
		 * root layout on every navigation, so the URL no longer has any say in this.
		 */
		syncFromServer: (server: GameState | undefined) => {
			// A route with no match renders the error page without running layout loads,
			// so there is no server state to sync. Sit tight rather than reading the
			// absence as "the game is over" and dropping the player out mid-run.
			if (!server) return;

			// Nor does a stale load get to end the game. Only giving up does that, and
			// it says so directly.
			if (!server.active && get(state.active)) return;

			adopt(server);
		},

		/**
		 * Bank a cleared stage. The server re-signs; a skipped stage is refused, and so is
		 * one submitted without the proof code derived from the current `proofSeed`.
		 */
		clearStage: async (stage: number) => {
			const seed = get(state.proofSeed);
			const startedAt = get(state.gameStartAt);
			const token = seed && startedAt ? computeStageProof(seed, stage, startedAt.getTime()) : null;

			const next = await post({ intent: 'clear-stage', stage, token });
			if (next) adopt(next);
		},

		/**
		 * Record that the decoy home button has been clicked, so the reveal it triggers is
		 * never replayed on a later visit.
		 *
		 * The local flag is set first and the server is told in the background: this fires
		 * on a click in the middle of a typing animation, and nothing on screen should wait
		 * on a round trip. Losing the request costs the player nothing but a repeated line.
		 */
		markClicked: () => {
			if (get(state.clicked)) return;

			state.clicked.set(true);
			void post({ intent: 'button-clicked' });
		},

		/**
		 * Give up: the server drops the cookie, and the run is gone — progress, timers,
		 * the lot. The caller is expected to follow this with a full document load, so
		 * the CRT overlay and the navigation lock die with the page rather than
		 * lingering over a site that is supposed to look untouched.
		 */
		giveUp: async () => {
			await post({ intent: 'give-up' });

			adopt(IDLE_GAME_STATE);
			state.backButtonClickedTimes.set(0);
			state.lastMessageUpdatedAt.set(null);
		}
	};

	return {
		...sharedState,
		...getters,
		...actions
	};
};
