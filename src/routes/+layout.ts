import type { LayoutLoad } from './$types';

// Game modules only during a run.
export const load: LayoutLoad = async ({ data }) => {
	const gameKit = data.game.active
		? await import('#lib/game/kit.js').then((m) => m.loadGameKit())
		: null;

	return { ...data, gameKit };
};
