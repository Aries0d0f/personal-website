<script lang="ts">
	import Icon from '@iconify/svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { useCRT } from '$lib/helpers/crt.svelte';
	import { useGameStore } from '$lib/store/game';
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	import Codex from './Codex.svelte';
	import { Abnormality } from '$lib/game/abnoramlity';

	const ACCELERATOR = { giveUp: 'G', backToGame: 'B', yes: 'Y', no: 'N' };

	const { promote } = useCRT();
	const { abnormality, giveUp } = useGameStore();

	let giveUpButton = $state<HTMLButtonElement>();
	let backToGameButton = $state<HTMLButtonElement>();
	let yesButton = $state<HTMLButtonElement>();
	let noButton = $state<HTMLButtonElement>();
	let isGivingUp = $state(false);

	function accelerate(
		event: KeyboardEvent,
		buttons: Record<string, HTMLButtonElement | undefined>
	) {
		if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;

		const button = buttons[event.key.toUpperCase()];
		if (!button) return;

		event.preventDefault();
		button.click();
	}

	async function handleGiveUp() {
		if (isGivingUp) return;
		isGivingUp = true;

		await giveUp();

		window.location.assign(`/${getLocale()}`);
	}

	function keepUnderGlass(event: ToggleEvent) {
		if (event.newState === 'open') promote();
	}
</script>

<button class="game-dialog" command="show-modal" commandfor="game-options">
	{#if $abnormality === Abnormality.AN24}
		<Icon class="icon" icon="fa7-solid:eye" />
	{:else}
		<Icon class="icon" icon="fa7-solid:gear" />
	{/if}
</button>

<dialog
	id="game-options"
	class="game-dialog-container"
	ontoggle={keepUnderGlass}
	onkeydown={(event) =>
		accelerate(event, {
			[ACCELERATOR.giveUp]: giveUpButton,
			[ACCELERATOR.backToGame]: backToGameButton
		})}
>
	<div class="game-dialog-window">
		<div class="game-dialog-title-bar">
			<button class="game-dialog-close" command="close" commandfor="game-options" aria-label="Close"
			></button>
			<h1>
				{#if $abnormality === Abnormality.AN26}
					{m.game_components_options_give_up()}
				{:else}
					{m.game_components_options_title()}
				{/if}
			</h1>
		</div>
		<div class="game-dialog-body">
			<h2>
				{#if $abnormality === Abnormality.AN26}
					{m.game_components_options_give_up()}
				{:else}
					{m.game_components_options_language()}
				{/if}
			</h2>
			<div class="game-dialog-field">
				<LanguageSwitcher fullLangName abnormal={$abnormality} />
			</div>
			<h2>
				{#if $abnormality === Abnormality.AN26}
					{m.game_components_options_give_up()}
				{:else}
					{m.game_components_codex_title()}
				{/if}
			</h2>
			<div class="game-dialog-field">
				<Codex />
			</div>
		</div>
		<footer>
			<button bind:this={giveUpButton} command="show-modal" commandfor="game-confirm-give-up">
				{m.game_components_options_give_up()}
				<i>({ACCELERATOR.giveUp})</i>
			</button>
			<button
				bind:this={backToGameButton}
				class="is-default"
				command="close"
				commandfor="game-options"
			>
				{#if $abnormality === Abnormality.AN26}
					{m.game_components_options_give_up()}
					<i>({ACCELERATOR.giveUp})</i>
				{:else}
					{m.game_components_options_back_to_game()}
					<i>({ACCELERATOR.backToGame})</i>
				{/if}
			</button>
		</footer>
	</div>
</dialog>

<dialog
	id="game-confirm-give-up"
	class="game-dialog-container"
	ontoggle={keepUnderGlass}
	onkeydown={(event) =>
		accelerate(event, { [ACCELERATOR.yes]: yesButton, [ACCELERATOR.no]: noButton })}
>
	<div class="game-dialog-window">
		<div class="game-dialog-title-bar">
			<button
				class="game-dialog-close"
				command="close"
				commandfor="game-confirm-give-up"
				aria-label="Close"
			></button>
			<h1>{m.game_components_options_give_up_confirm_title()}</h1>
		</div>
		<div class="game-dialog-body">
			<p>{m.game_components_options_give_up_confirm_description()}</p>
		</div>
		<footer>
			<button bind:this={yesButton} onclick={handleGiveUp} disabled={isGivingUp}>
				{m.game_components_options_give_up_confirm_yes()}
				<i>({ACCELERATOR.yes})</i>
			</button>
			<button
				bind:this={noButton}
				class="is-default"
				command="close"
				commandfor="game-confirm-give-up"
			>
				{m.game_components_options_give_up_confirm_no()}
				<i>({ACCELERATOR.no})</i>
			</button>
		</footer>
	</div>
</dialog>

<style lang="scss">
	$ink: #000;
	$paper: #fff;

	@mixin dither($a: $ink, $b: transparent, $size: 2px) {
		background-image: repeating-conic-gradient($a 0% 25%, $b 0% 50%);
		background-size: $size $size;
	}

	@mixin plate($radius: 0) {
		border: 1px solid $ink;
		border-radius: $radius;
		background: $paper;
		box-shadow: 1px 1px 0 $ink;
	}

	@mixin push-button {
		@include plate(6px);

		appearance: none;
		min-width: 5.25rem;
		padding: 0.25rem 0.9rem;
		color: $ink;
		line-height: 1.2;
		cursor: pointer;

		&:active:not(:disabled) {
			background: $ink;
			color: $paper;
		}

		&:focus-visible {
			outline: 2px dotted $ink;
			outline-offset: -4px;
		}
	}

	.game-dialog {
		&-container {
			padding: 0;
			background: transparent;
			border: none;
			outline: none;

			&[open] {
				height: 100dvh;
				width: 100dvw;
				max-height: none;
				max-width: none;
				display: flex;
				place-items: center;
				place-content: center;
			}

			&::backdrop {
				@include dither(rgba(0, 0, 0, 0.55));

				background-color: rgba(0, 0, 0, 0.2);
			}
		}

		&-window {
			@include plate;

			width: min(24rem, 100%);
			color: $ink;
			font-family:
				'Chicago', 'ChiKareGo2', 'Charcoal', 'Geneva', 'Lucida Grande', system-ui, sans-serif;
			font-size: 0.8125rem;

			> footer {
				display: flex;
				justify-content: flex-end;
				gap: 0.75rem;
				padding: 0 1rem 1rem;

				> button {
					@include push-button;

					&.is-default {
						box-shadow:
							1px 1px 0 $ink,
							0 0 0 2px $paper,
							0 0 0 5px $ink;
						margin: 3px;
						font-weight: 700;
					}
				}
			}

			button {
				font-family: inherit;

				> i {
					text-transform: uppercase;
					font-style: normal;
					font-weight: 400;
					text-decoration: underline;
				}
			}
		}

		&-title-bar {
			position: relative;
			display: flex;
			align-items: center;
			gap: 0.5rem;
			height: 1.25rem;
			padding: 0 0.375rem;
			border-bottom: 1px solid $ink;
			background: repeating-linear-gradient(to bottom, $ink 0 1px, $paper 1px 2px);
			background-position: 0 3px;
			background-size: 100% 12px;
			background-repeat: no-repeat;

			> h1 {
				position: absolute;
				left: 50%;
				transform: translateX(-50%);
				max-width: calc(100% - 3rem);
				margin: 0;
				padding: 0 0.375rem;
				background: $paper;
				color: $ink;
				font-size: 0.8125rem;
				font-weight: 700;
				line-height: 1.25;
				letter-spacing: 0;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
		}

		// An empty square on the left. No glyph — the ✕ is a much later idea; the classic
		// box only filled in while you held the mouse down on it.
		&-close {
			@include plate(0);

			appearance: none;
			flex: none;
			width: 11px;
			height: 11px;
			padding: 0;
			margin: 0;
			box-shadow: none;
			cursor: pointer;

			&:active {
				background: $ink;
				box-shadow: inset 0 0 0 2px $paper;
			}

			&:focus-visible {
				outline: 1px dotted $ink;
				outline-offset: 2px;
			}
		}

		&-body {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
			padding: 1rem;

			> h2 {
				font-size: 0.8125rem;
				font-weight: 700;
				line-height: 1.25;
			}

			> p {
				margin: 0;
				font-size: 0.8125rem;
				line-height: 1.5;
				white-space: pre-line;
			}
		}

		&-field {
			margin-bottom: 1rem;
		}

		mix-blend-mode: plus-lighter;
		appearance: none;
		background: none;
		border: none;
		padding: 0.5rem;
		margin: 0;
		cursor: pointer;
		position: absolute;
		top: 4rem;
		left: 4rem;
		font-size: 4rem;
		color: #aaa;
		z-index: 1000;
		transform-origin: center;
		transform: matrix(1.2, -0.6, 0.45, 1.1, 10, 0);
		outline: none;

		&.hide {
			opacity: 0;
		}
	}

	.game-dialog-body .game-dialog-field {
		:global(.language-switcher) {
			display: flex;
			flex-wrap: wrap;
			gap: 0.75rem;
			width: auto;
		}

		:global(.language-switcher button) {
			@include push-button;

			width: auto;
			height: auto;
			min-width: 4.5rem;
			font-family: inherit;
			font-weight: 400;
			opacity: 1;
		}

		:global(.language-switcher button:focus-visible) {
			outline: 2px dotted $ink;
			outline-offset: -4px;
		}

		// Selection on a 1-bit screen is inversion — the current language is the button
		// left turned inside out, and it is no longer a target.
		:global(.language-switcher button[aria-current='true']) {
			background: $ink;
			color: $paper;
			font-weight: 700;
			cursor: default;
		}
	}
</style>
