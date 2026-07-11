import { getContext, hasContext, setContext } from 'svelte';
import { writable, derived, readable } from 'svelte/store';

import type { Page } from '@sveltejs/kit';
import type { Writable } from 'svelte/store';

interface Model {
	active: Writable<boolean>;
	gameStartAt: Writable<Date | null>;
	backButtonClickedTimes: Writable<number>;
	lastBackButtonClickedAt: Writable<Date | null>;
}

const STORE_KEY = Symbol.for('GAME_STORE');

const createGameStore = () => {
	return setContext<Model>(STORE_KEY, {
		active: writable(false),
		gameStartAt: writable(null),
		lastBackButtonClickedAt: writable(null),
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
		backButtonClickedTimes: state.backButtonClickedTimes
	};

	const getters = {
		isGameMode: derived(state.active, ($active) => $active),
		gameStartAt: derived(state.gameStartAt, ($gameStartAt) => $gameStartAt),
		gameStartSeconds: derived([state.gameStartAt, timer], timeSecDeltaCalc),
		lastBackButtonClickedSeconds: derived([state.lastBackButtonClickedAt, timer], timeSecDeltaCalc)
	};

	const actions = {
		detectGameMode: (page: Page) => {
			state.active.set(page.params.slug === 'game');
			state.gameStartAt.set(page.params.slug === 'game' ? new Date() : null);
		}
	};

	state.backButtonClickedTimes.subscribe(
		() => {
			state.lastBackButtonClickedAt.set(new Date());
		},
		() => {
			state.lastBackButtonClickedAt.set(null);
		}
	);

	return {
		...sharedState,
		...getters,
		...actions
	};
};
