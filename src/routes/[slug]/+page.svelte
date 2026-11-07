<script lang="ts">
	import { onMount, type Component, type Snippet } from 'svelte';
	import type { PageData } from './$types';

	import { useGameStore } from '#lib/store/game.js';
	import { Abnormality } from '#lib/game/abnoramlity.js';
	import { dev } from '$app/env';

	const { abnormality, isGameMode } = useGameStore();

	let { data }: { data: PageData & { metadata?: { layout?: string } } } = $props();

	const viewport: Record<
		string,
		() => Promise<{ default: Component<{ data: PageData; children: Snippet }> }>
	> = {
		bento: () => import('#lib/layout/Bento.svelte'),
		timeline: () => import('#lib/layout/Timeline.svelte'),
		default: () => import('#lib/layout/General.svelte')
	};

	const ViewportLayout = $derived(
		data.metadata?.layout && viewport[data.metadata.layout]
			? viewport[data.metadata?.layout]()
			: viewport.default()
	);

	// mdsvex's default export is a Svelte component — render it directly.
	const Content = $derived(data.content);
	const currentAbnormality = $derived($abnormality);

	const loadHttp = () => import('@aries0d0f/fetch-worker');

	const lookupInfo = $derived.by(async () => {
		if (currentAbnormality === Abnormality.AN04) {
			const { default: http } = await loadHttp();
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

	onMount(() => {
		// Fetch only.
		const preload = () => void loadHttp().catch(() => {});
		if ('requestIdleCallback' in window) {
			const id = requestIdleCallback(preload, { timeout: 3000 });
			return () => cancelIdleCallback(id);
		}
		const id = setTimeout(preload, 1000);
		return () => clearTimeout(id);
	});
</script>

{#if ViewportLayout}
	{#await ViewportLayout then { default: Layout }}
		{#if dev && $isGameMode}
			{currentAbnormality}
		{/if}
		<Layout {data}>
			<Content {currentAbnormality} {lookupInfo} />
		</Layout>
	{/await}
{/if}
