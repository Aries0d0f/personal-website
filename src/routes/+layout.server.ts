import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, url }) => {
	// Track URL only mid-game.
	if (locals.game.active) void url.pathname;

	return { game: locals.game };
};
