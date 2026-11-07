<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { errorTitleMap } from '#lib/error-titles.js';
	import { useCRT } from '#lib/helpers/crt.svelte.js';
	import { useGameScript } from '#lib/helpers/game-script.svelte.js';
	import { useGameStore } from '#lib/store/game.js';
	import { useGameActions } from '#lib/store/game-actions.js';

	const { isCaught, backButtonClickedTimes } = useGameStore();
	const { clearStage, markClicked } = useGameActions();
	const { interference } = useCRT();

	const currentLang = $derived(getLocale());

	let gameStatus = $state(page.status);
	let sequence: string[] = $state([]);
	let sequenceTimer = $state<ReturnType<typeof setTimeout>>();
	const isFirstStageClear = $derived(gameStatus === 200);

	const {
		gameTitle,
		gameDescription,
		gameBackButton,
		firstStageClearTitle,
		firstStageClearDescription,
		immediateFireMessage
	} = useGameScript({
		gameStatus: () => gameStatus,
		isFirstStageClear: () => isFirstStageClear,
		onFirstStageClear: nextGameStage
	});

	const VIM_EXIT_CODE = ['Escape', 'Shift', ':', 'q'];
	const isPrefix = (keys: string[]) => keys.every((key, i) => key === VIM_EXIT_CODE[i]);

	function vimExitConsumes(event: KeyboardEvent) {
		const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

		const next = [...sequence, key];
		while (next.length && !isPrefix(next)) next.shift();
		sequence = next;

		if (sequenceTimer) clearTimeout(sequenceTimer);
		sequenceTimer = setTimeout(() => {
			sequence = [];
		}, 1500);

		if (sequence.length === VIM_EXIT_CODE.length) {
			clearTimeout(sequenceTimer);
			sequence = [];
			return true;
		}

		return sequence.length >= 3;
	}

	function handleKeyEvent(event: KeyboardEvent) {
		if (vimExitConsumes(event)) {
			immediateFireMessage(m.game_mode_description_script_after_vim_quit);
			return;
		}

		if (event.ctrlKey && event.key === 'c') {
			immediateFireMessage(m.game_mode_description_script_after_ctrl_c);
			return;
		}
	}

	function handleGameButtonClick() {
		if (gameDescription.isTyping) {
			// Only skip the typing effect after 3+ back-button clicks (stage performing)
			if ($backButtonClickedTimes >= 3) {
				gameDescription.skip();
			}
			return;
		} else {
			backButtonClickedTimes.update((n) => n + 1);

			markClicked();
		}
	}

	async function nextGameStage() {
		await clearStage(1);

		goto(resolve(currentLang), { replace: true });
	}

	$effect(() => {
		if (!$isCaught) return;

		const twitch = setTimeout(() => interference(), 750);
		return () => clearTimeout(twitch);
	});
</script>

<svelte:window on:keydown={handleKeyEvent} />

<svelte:head>
	<title>{m.game_mode_title()} | {m.noun_general_name()}</title>
</svelte:head>

<div class="error-container">
	<div class="error-wrapper">
		{#if errorTitleMap[gameStatus] && gameStatus !== 404}
			<img src="/favicon.gif" class="no-clip status-{gameStatus}" alt="Avatar" />
		{:else}
			<img src="/avatar.gif" alt="Avatar" />
		{/if}
		<article>
			{#if isFirstStageClear}
				<h1>200</h1>
				<h2>{firstStageClearTitle.current}</h2>
				<p>{firstStageClearDescription.current}</p>
			{:else}
				<input bind:value={gameStatus} type="number" step="1" />
				<h2>{gameTitle.current}</h2>
				<p>{gameDescription.current}</p>
			{/if}
		</article>
	</div>
	<button class="back link" onclick={handleGameButtonClick}>
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
</div>

<style lang="scss">
	@use '../styles/error-page' as *;

	@include error-page;

	.error-container > button {
		appearance: none;
		font-family: inherit;
		cursor: pointer;
		margin: 0;
		background: none;
		border: none;
	}

	.error-wrapper {
		background-color: #000;
		border-radius: 100rem;

		> img {
			&.status-410 {
				opacity: 0.05;
			}

			&:not(.no-clip) {
				border-radius: 100rem;
			}
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

		article input {
			font-size: 8rem;
			font-weight: 500;
			font-variant-numeric: tabular-nums;
			width: 40rem;
			appearance: none;
			background: none;
			border: none;
			padding: 0;
			margin: 0;
			outline: none;
			color: inherit;
			caret-color: rgba(255, 255, 255, 0.05);
			font-family: inherit;
			-moz-appearance: textfield;

			&::-webkit-outer-spin-button,
			&::-webkit-inner-spin-button {
				appearance: none;
				margin: 0;
			}
		}

		@media (max-width: 700px) {
			article input {
				text-align: center;
			}
		}
	}
</style>
