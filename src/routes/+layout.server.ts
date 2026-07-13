import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, url }) => {
	void url.pathname;

	return { game: locals.game };
};
