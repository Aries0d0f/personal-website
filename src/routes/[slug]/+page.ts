import { error } from '@sveltejs/kit';
import { getLocaleForUrl } from '$lib/paraglide/runtime';
import { loadContent } from '$lib/content';

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, url }) => {
	const lang = getLocaleForUrl(url.href);
	const { slug } = params;

	const loaded = await loadContent(slug, lang);
	if (!loaded) throw error(404, 'Not found');

	return { content: loaded.content, metadata: loaded.metadata, lang, slug };
};
