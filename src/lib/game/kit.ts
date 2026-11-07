export const loadGameKit = async () => {
	const [{ default: GameLayer }, { default: GameError }, { default: CrtScreen }] =
		await Promise.all([
			import('#lib/components/GameLayer.svelte'),
			import('#lib/components/GameError.svelte'),
			import('#lib/components/CrtScreen.svelte'),
			import('#lib/store/game-actions.js')
		]);

	return { GameLayer, GameError, CrtScreen };
};

export type GameKit = Awaited<ReturnType<typeof loadGameKit>>;
