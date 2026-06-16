import { error } from '@sveltejs/kit';
import { getLocale } from '$lib/paraglide/runtime';

import type { Component } from 'svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const lang = getLocale();
	const { slug } = params;

	const modules = import.meta.glob('/src/content/**/*.md');
	const resolver =
		modules[`/src/content/${slug}/${lang}.md`] || modules[`/src/content/${slug}/en.md`];
	if (!resolver) throw error(404, 'Not found');

	const post = (await resolver()) as {
		default: Component;
		metadata: Record<string, unknown>;
	};

	return { content: post.default, metadata: post.metadata, lang, slug };
};
