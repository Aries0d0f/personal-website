<script lang="ts">
	import http from '@aries0d0f/fetch-worker';

	import type { Component, Snippet } from 'svelte';
	import type { PageData } from './$types';

	import { useGameStore } from '$lib/store/game';
	import { Abnormality } from '$lib/game/abnoramlity';
	import { dev } from '$app/env';

	const { abnormality } = useGameStore();

	let { data }: { data: PageData & { metadata?: { layout?: string } } } = $props();

	const viewport: Record<
		string,
		() => Promise<{ default: Component<{ data: PageData; children: Snippet }> }>
	> = {
		bento: () => import('$lib/layout/Bento.svelte'),
		timeline: () => import('$lib/layout/Timeline.svelte'),
		default: () => import('$lib/layout/General.svelte')
	};

	const ViewportLayout = $derived(
		data.metadata?.layout && viewport[data.metadata.layout]
			? viewport[data.metadata?.layout]()
			: viewport.default()
	);

	// mdsvex's default export is a Svelte component — render it directly.
	const Content = $derived(data.content);
	const currentAbnormality = $derived($abnormality);
	const lookupInfo = $derived.by(async () => {
		if (currentAbnormality === Abnormality.AN04) {
			return await http
				.get('/ip?q=geo', {
					headers: {
						Accept: 'application/json'
					}
				})
				.then((res) => res.json())
				.then((data) => {
					return data;
				});
		}
		return null;
	});
</script>

{#if ViewportLayout}
	{#await ViewportLayout then { default: Layout }}
		{#if dev}
			{currentAbnormality}
		{/if}
		<Layout {data}>
			<Content {currentAbnormality} {lookupInfo} />
		</Layout>
	{/await}
{/if}
