<script lang="ts">
	import { ParaglideMessage } from '@inlang/paraglide-js-svelte';
	import { m } from '$lib/paraglide/messages.js';

	import { useGameStore } from '$lib/store/game';

	const { isGameMode } = useGameStore();
</script>

<article>
	{#if $isGameMode}
		<ol>
			<ParaglideMessage message={m.game_pages_home_profile_intro} inputs={{}}>
				{#snippet li({ children })}
					<li>
						{@render children?.()}
					</li>
				{/snippet}
				{#snippet strong({ children })}
					<strong>
						{@render children?.()}
					</strong>
				{/snippet}
				{#snippet keyCode({ children })}
					<kbd>
						{@render children?.()}
					</kbd>
				{/snippet}
			</ParaglideMessage>
		</ol>
	{:else}
		<ParaglideMessage message={m.pages_home_profile_intro} inputs={{}}>
			{#snippet strong({ children, options })}
				<strong {...options}>
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

		kbd {
			font-size: 0.875rem;
			padding: 0.075rem 0.35rem;
			border-radius: 0.25rem;
			margin: 0 0.125rem;
			background-color: #f5f5f5;
			border: 1px solid #ccc;
		}
	}
</style>
