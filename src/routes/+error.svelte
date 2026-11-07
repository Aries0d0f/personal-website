<script lang="ts">
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { errorTitleMap } from '#lib/error-titles.js';
	import { useGameKit, useGameStore } from '#lib/store/game.js';

	const { isGameMode } = useGameStore();
	const gameKit = useGameKit();

	const GameError = $derived(gameKit()?.GameError);

	const currentLang = $derived(getLocale());
	const headTitle = $derived([page.status, page.error?.message].filter(Boolean).join(' '));
	const title = $derived(
		errorTitleMap[page.status]
			? errorTitleMap[page.status]()
			: page.status >= 500
				? m.pages_error_5xx_title()
				: m.pages_error_general_title()
	);
	const description = $derived.by(() => {
		const messages = (
			page.status === 404
				? m.pages_error_404_description()
				: page.status >= 400 && page.status < 500
					? m.pages_error_general_title()
					: m.pages_error_general_description()
		)
			.split('|')
			.map((s) => s.trim());
		return messages[Math.floor(Math.random() * messages.length)];
	});
</script>

<svelte:head>
	{#if !($isGameMode && GameError)}
		<title>{headTitle} | {m.noun_general_name()}</title>
	{/if}
</svelte:head>

{#if $isGameMode && GameError}
	<GameError />
{:else}
	<div class="error-container">
		<div class="error-wrapper">
			<img src="/avatar.gif" alt="Avatar" />
			<article>
				<h1>{page.status}</h1>
				<h2>{title}</h2>
				<p>{description}</p>
			</article>
		</div>
		<a class="back" href="/{currentLang}" rel="external">
			<svg
				class="deco-vertical"
				width="10"
				height="147"
				viewBox="0 0 10 147"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M0.5 145.629V144.629M0.5 135.629L0.500488 0.129395L9.47679 33.6294"
					stroke="white"
					stroke-linecap="round"
				/>
			</svg>

			<svg
				class="deco-horizontal"
				width="93"
				height="10"
				viewBox="0 0 93 10"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M92.3911 9.47656L91.3911 9.47656M82.3911 9.47656L0.129395 9.47654L33.6294 0.50024"
					stroke="white"
					stroke-linecap="round"
				/>
			</svg>

			{m.pages_error_back_to_home()}
		</a>
	</div>
{/if}

<style lang="scss">
	@use '../lib/styles/error-page' as *;

	@include error-page;
</style>
