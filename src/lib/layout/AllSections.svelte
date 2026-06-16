<script lang="ts">
	import type { Component, Snippet } from 'svelte';

	import { getLocale } from '$lib/paraglide/runtime';
	import { pageOrder } from '$lib/pages';
	import { loadContent } from '$lib/content';

	import HomeContent from '$lib/components/HomeContent.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import General from './General.svelte';
	import Timeline from './Timeline.svelte';
	import Bento from './Bento.svelte';

	const layouts: Record<
		string,
		Component<{ data: { metadata?: Record<string, unknown> }; children: Snippet }>
	> = {
		bento: Bento,
		timeline: Timeline,
		default: General
	};

	const lang = $derived(getLocale());
</script>

{#each pageOrder as key (key)}
	<section id="section-{key}" class="page-section">
		{#if key === 'home'}
			<HomeContent />
		{:else}
			{#await loadContent(key, lang) then loaded}
				{#if loaded}
					{@const Layout = layouts[loaded.metadata.layout ?? 'default'] ?? layouts.default}
					{@const Body = loaded.content}
					<Layout data={{ metadata: loaded.metadata }}>
						<Body />
					</Layout>
				{/if}
			{/await}
		{/if}
	</section>
{/each}

<Footer mobile={true} />

<style lang="scss">
	.page-section {
		width: 100%;
	}
</style>
