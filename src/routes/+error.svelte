<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { useGameScript } from '$lib/helpers/game-script.svelte';
	import { useGameStore } from '$lib/store/game';

	const { isGameMode, backButtonClickedTimes, detectGameMode } = useGameStore();

	const currentLang = $derived(getLocale());
	const headTitle = $derived(
		$isGameMode ? m.game_mode_title() : [page.status, page.error?.message].filter(Boolean).join(' ')
	);
	const title = $derived(
		page.status === 404
			? m.pages_error_404_title()
			: page.status >= 500
				? m.pages_error_5xx_title()
				: m.pages_error_general_title()
	);
	const description = $derived.by(() => {
		const messages = (
			page.status === 404 ? m.pages_error_404_description() : m.pages_error_general_description()
		)
			.split('|')
			.map((s) => s.trim());
		return messages[Math.floor(Math.random() * messages.length)];
	});

	//#region Game Mode Only Logic
	let gameStatus = $state(page.status);
	const isFirstStageClear = $derived(gameStatus === 200);

	const { gameDescription, gameBackButton, firstStageClearTitle, firstStageClearDescription } =
		useGameScript({
			isFirstStageClear: () => isFirstStageClear,
			onFirstStageClear: nextGameStage
		});

	function handleGameButtonClick() {
		if (gameDescription.isTyping) {
			// Only skip the typing effect if the user has clicked the back button 3 or more times
			// (Stage performing necessary)
			if ($backButtonClickedTimes >= 3) {
				gameDescription.skip();
			}
			return;
		} else {
			backButtonClickedTimes.update((n) => n + 1);
		}
	}

	function nextGameStage() {
		goto(resolve(`/${currentLang}`));
	}
	//#endregion

	$effect(() => {
		detectGameMode(page);
	});
</script>

<svelte:head>
	<title>{headTitle} | {m.noun_general_name()}</title>
</svelte:head>

<div class="error-container">
	<div class="error-wrapper" data-game-mode={$isGameMode}>
		<img src="/avatar.gif" alt="Avatar" />
		<article>
			{#if isFirstStageClear}
				<h1>200</h1>
				<h2>{firstStageClearTitle.current}</h2>
				<p>{firstStageClearDescription.current}</p>
			{:else}
				{#if $isGameMode}
					<input bind:value={gameStatus} type="number" />
				{:else}
					<h1>{page.status}</h1>
				{/if}
				<h2>{title}</h2>
				{#if $isGameMode}
					<p>{gameDescription.current}</p>
				{:else}
					<p>{description}</p>
				{/if}
			{/if}
		</article>
	</div>
	{#if $isGameMode}
		<button class="link" onclick={handleGameButtonClick}>
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

			{gameBackButton.current}
		</button>
	{:else}
		<a href="/{currentLang}" rel="external">
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
	{/if}
</div>

<style lang="scss">
	:global {
		body:has(.error-container) {
			background-color: #000;
		}
	}

	.error {
		&-container {
			display: flex;
			place-items: center;
			place-content: center;
			width: 100%;
			min-height: 100dvh;
			background-color: #000;
			color: #fff;
			gap: 4rem;

			> a,
			> button {
				display: flex;
				flex-direction: row;
				place-items: center;
				place-content: center;
				gap: 1rem;
				color: #fff;
				text-decoration: none;
				writing-mode: vertical-rl;
				text-orientation: mixed;
				font-size: 0.8125rem;
				padding: 2rem;
				position: absolute;
				opacity: 0.75;
				right: 0;
				white-space: nowrap;
				transition:
					gap 0.3s cubic-bezier(0.4, 0, 0.2, 1.9),
					opacity 0.3s ease;

				&:hover {
					gap: 2rem;
					opacity: 1;
				}

				> .deco-horizontal {
					display: none;
				}
			}

			> button {
				appearance: none;
				font-family: inherit;
				cursor: pointer;
				margin: 0;
				background: none;
				border: none;
			}

			@media (max-width: 700px) {
				flex-direction: column;
				gap: 0rem;

				> a,
				> button {
					writing-mode: horizontal-tb;
					text-orientation: initial;
					position: relative;

					> .deco-vertical {
						display: none;
					}

					> .deco-horizontal {
						display: block;
					}
				}
			}

			@media (max-width: 375px) {
				height: 100%;
				overflow: hidden;
			}
		}

		&-wrapper {
			display: flex;
			flex-direction: row;
			place-items: center;
			place-content: center;
			gap: 2rem;
			padding: 2rem;

			&[data-game-mode='true'] {
				background-color: #000;
				border-radius: 100rem;

				> img {
					border-radius: 100rem;
				}

				> article {
					width: 40rem;
					max-width: 100%;

					> p {
						font-family: 'Courier New', Courier, monospace;
						white-space: pre-wrap;
						height: 1rem;
					}
				}
			}

			> img {
				filter: brightness(150%);
				height: 16rem;
				width: 16rem;

				&::selection {
					background: none !important;
					color: unset !important;
				}
			}

			article {
				display: flex;
				flex-direction: column;
				gap: 1rem;
				line-height: 1;
				border-left: 1px solid rgba(255, 255, 255, 0.2);
				padding: 0 4rem;

				h1,
				input {
					font-size: 8rem;
					font-weight: 500;
					font-variant-numeric: tabular-nums;
				}

				input {
					appearance: none;
					background: none;
					border: none;
					padding: 0;
					margin: 0;
					outline: none;
					color: inherit;
					font-family: inherit;
					&::-webkit-outer-spin-button,
					&::-webkit-inner-spin-button {
						-webkit-appearance: none;
						margin: 0;
					}
				}

				h2 {
					font-size: 2rem;
					font-weight: 500;
				}

				p {
					line-height: 1.6;
					font-size: 1.2rem;
					margin-bottom: 2rem;
				}
			}

			@media (max-width: 700px) {
				flex-direction: column;
				gap: 0rem;

				> article {
					text-align: center;
					border: none;
					padding: 0;

					> h2 {
						font-size: 1.8rem;
					}

					> p {
						font-size: 0.9rem;
						margin-bottom: 0;
					}
				}
			}

			@media (max-width: 375px) {
				padding: 0rem 1rem;

				> img {
					height: 12rem;
					width: 12rem;
				}
			}
		}
	}
</style>
