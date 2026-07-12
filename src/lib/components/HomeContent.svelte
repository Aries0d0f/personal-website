<script lang="ts">
	import { ParaglideMessage } from '@inlang/paraglide-js-svelte';
	import { m } from '$lib/paraglide/messages.js';

	import { useGameStore } from '$lib/store/game';

	const { isGameMode } = useGameStore();
</script>

<article>
	{#if $isGameMode}
		{const rules = m.game_pages_home_profile_intro().split('\n')}
		<ol>
			{#each rules as rule, index (index)}
				<li>{rule}</li>
			{/each}
		</ol>
	{:else}
		<ParaglideMessage message={m.pages_home_profile_intro} inputs={{}}>
			{#snippet strong({ children })}
				<strong>
					{@render children?.()}
				</strong>
			{/snippet}
		</ParaglideMessage>
	{/if}
</article>

<style lang="scss">
	article {
		font-size: 1rem;
		color: #4d4d4d;

		strong {
			font-weight: 700;
			color: #000;
		}

		ol {
			padding-left: 1rem;

			> li {
				padding-left: 0.5rem;
				font-weight: 600;
				margin-bottom: 0.5rem;
			}
		}
	}
</style>
