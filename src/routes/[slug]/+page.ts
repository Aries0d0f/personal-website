import { error } from '@sveltejs/kit';
import { getLocaleForUrl } from '#lib/paraglide/runtime.js';
import { loadContent } from '#lib/content.js';

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, url, parent }) => {
	const lang = getLocaleForUrl(url.href);
	const { slug } = params;
	const { game } = await parent();

	const loaded = await loadContent(slug, lang, game?.active ?? false);
	if (!loaded) throw error(404, 'Not found');

	return { content: loaded.content, metadata: loaded.metadata, lang, slug };
};
