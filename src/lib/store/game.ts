import { getContext, hasContext, setContext } from 'svelte';
import { writable, derived, readable, get } from 'svelte/store';

import type { Writable } from 'svelte/store';

import { castAbnormalityCodeToEnum } from '#lib/game/abnoramlity.js';

import type { GameState } from '#lib/game/state.js';
import type { Abnormality, AbnormalityCode } from '#lib/game/abnoramlity.js';
import type { GameKit } from '#lib/game/kit.js';

export interface GameModel {
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
	clearedState: Writable<GameState | null>;
}

const STORE_KEY = Symbol.for('GAME_STORE');
const KIT_KEY = Symbol.for('GAME_KIT');

type GameKitGetter = () => GameKit | null;

export const provideGameKit = (kit: GameKitGetter) => setContext(KIT_KEY, kit);

export const useGameKit = (): GameKitGetter =>
	hasContext(KIT_KEY) ? getContext<GameKitGetter>(KIT_KEY) : () => null;

const createGameStore = () => {
	return setContext<GameModel>(STORE_KEY, {
		active: writable(false),
		stage: writable(0),
		caught: writable(false),
		clicked: writable(false),
		gameStartAt: writable(null),
		proofSeed: writable(null),
		lastMessageUpdatedAt: writable(null),
		backButtonClickedTimes: writable(0),
		abnormality: writable(false),
		discoveredAbnormalities: writable(new Set<AbnormalityCode>()),
		clearedState: writable<GameState | null>(null)
	});
};

export const getStoreContext = () => {
	if (hasContext(STORE_KEY)) {
		return getContext<GameModel>(STORE_KEY);
	} else {
		return createGameStore();
	}
};

export const adopt = (state: GameModel, server: GameState) => {
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
		abnormality: derived(state.abnormality, ($abnormality) => $abnormality),
		discoveredAbnormalities: derived(state.discoveredAbnormalities, ($discovered) => $discovered),
		isGameCleared: derived(state.clearedState, ($cleared) => $cleared !== null)
	};

	const actions = {
		syncFromServer: (server: GameState | undefined) => {
			if (!server) return;

			if (!server.active && get(state.active)) return;

			adopt(state, server);
		},

		// Lazy chunk.
		loadActions: () => import('./game-actions.js').then((m) => m.createGameActions(state))
	};

	return {
		...sharedState,
		...getters,
		...actions
	};
};
