<script lang="ts">
	let { data, children } = $props();
</script>

<article class="general-container">
	<h1>{data.metadata?.title}</h1>

	{@render children?.()}
</article>
