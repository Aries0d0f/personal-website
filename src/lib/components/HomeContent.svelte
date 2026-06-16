<script lang="ts">
	import { ParaglideMessage } from '@inlang/paraglide-js-svelte';
	import { m } from '$lib/paraglide/messages.js';
</script>

<article>
	<ParaglideMessage message={m.pages_home_profile_intro} inputs={{}}>
		{#snippet strong({ children })}
			<strong>
				{@render children?.()}
			</strong>
		{/snippet}
	</ParaglideMessage>
</article>

<style lang="scss">
	article {
		font-size: 1rem;
		color: #4d4d4d;

		strong {
			font-weight: 700;
			color: #000;
		}
	}
</style>
