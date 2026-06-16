// Shared markdown content loader so both the per-route page (`[slug]/+page.ts`)
// and the mobile combined view (`AllSections.svelte`) resolve content the same
// way, from a single glob.
import type { Component } from 'svelte';

const modules = import.meta.glob('/src/content/**/*.md');

export type LoadedContent = {
	content: Component;
	metadata: Record<string, unknown> & { title?: string; layout?: string };
};

export async function loadContent(slug: string, lang: string): Promise<LoadedContent | null> {
	const resolver =
		modules[`/src/content/${slug}/${lang}.md`] || modules[`/src/content/${slug}/en.md`];
	if (!resolver) return null;

	const post = (await resolver()) as {
		default: Component;
		metadata: LoadedContent['metadata'];
	};

	return { content: post.default, metadata: post.metadata };
}
