<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// mdsvex's default export is a Svelte component — render it directly.
	const Content = $derived(data.content);
</script>

<Content />
