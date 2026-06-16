<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData & { metadata?: { layout?: string } } } = $props();

	const viewport: Record<
		string,
		() => Promise<{ default: Component<{ data: PageData; children: Snippet }> }>
	> = {
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
</script>

{#if ViewportLayout}
	{#await ViewportLayout then { default: Layout }}
		<Layout {data}>
			<Content />
		</Layout>
	{/await}
{/if}
