<script lang="ts">
	import Icon from '@iconify/svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { useCRT } from '$lib/helpers/crt.svelte';
	import LanguageSwitcher from './LanguageSwitcher.svelte';

	const ACCELERATOR = { giveUp: 'G', backToGame: 'B', yes: 'Y', no: 'N' };

	const { promote } = useCRT();

	let giveUpButton = $state<HTMLButtonElement>();
	let backToGameButton = $state<HTMLButtonElement>();
	let yesButton = $state<HTMLButtonElement>();
	let noButton = $state<HTMLButtonElement>();

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

	function handleGiveUp() {
		// Implement the logic for giving up the game here
	}

	function keepUnderGlass(event: ToggleEvent) {
		if (event.newState === 'open') promote();
	}
</script>

<button class="game-dialog" command="show-modal" commandfor="game-options">
	<Icon class="icon" icon="fa7-solid:gear" />
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
			<h1>{m.game_components_options_title()}</h1>
		</div>
		<div class="game-dialog-body">
			<h2>{m.game_components_options_language()}</h2>
			<div class="game-dialog-field">
				<LanguageSwitcher fullLangName />
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
				{m.game_components_options_back_to_game()}
				<i>({ACCELERATOR.backToGame})</i>
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
			<button bind:this={yesButton} onclick={handleGiveUp}>
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
	// Classic Macintosh chrome is 1-bit: everything is a hairline of pure black on pure
	// white, and the only "colour" the toolbox ever had was a 50% dither of the two.
	$ink: #000;
	$paper: #fff;

	// The Mac never anti-aliased its greys — it alternated pixels. Anything that reads as
	// grey here (a dimmed desktop, a latched control) is really this checkerboard.
	@mixin dither($a: $ink, $b: transparent, $size: 2px) {
		background-image: repeating-conic-gradient($a 0% 25%, $b 0% 50%);
		background-size: $size $size;
	}

	// Windows sat on the desktop with a hard 1px shadow — an offset copy, never a blur.
	@mixin plate($radius: 0) {
		border: 1px solid $ink;
		border-radius: $radius;
		background: $paper;
		box-shadow: 1px 1px 0 $ink;
	}

	// Rounded rect, black hairline, label in Chicago. Pressing it inverts the whole
	// button rather than moving it — there was no bevel to ride down.
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

		// Focus is the same dotted frame the Finder drew, kept inside the hairline.
		&:focus-visible {
			outline: 1px dotted $ink;
			outline-offset: -4px;
		}
	}

	.game-dialog {
		&-container {
			padding: 0;
			background: transparent;
			border: none;
			outline: none;

			// The UA hides a closed dialog; a plain `display: flex` here would outrank it.
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

					// The default button wore a second, thicker ring — the Return key made
					// visible. Drawn outward so the button keeps its own 1px hairline.
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

		// Six hairlines running the width of the bar: the Mac's grip texture, and the only
		// thing that told you a window was frontmost.
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
				// Centred over the stripes, in the bar's own width — not in what the close
				// box leaves behind, or the title would sit off-centre by half a close box.
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
			padding: 1rem;

			> h2 {
				margin: 0 0 0.625rem;
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

		appearance: none;
		background: none;
		border: none;
		padding: 0.5rem;
		margin: 0;
		cursor: pointer;
		position: absolute;
		top: 4rem;
		right: 4rem;
		font-size: 4rem;
		color: #aaa;
		z-index: 1000;
		transform-origin: center;
		transform: matrix(1.1, -0.2, 0.6, 1.2, 0, 0);
		outline: none;
	}

	// The switcher belongs to the menu, where each locale is a bare 1.5rem glyph, dimmed
	// until hovered. In here it has to read as a row of push buttons instead, so those
	// rules have to be beaten inside the child's own scope. Selected two classes deep on
	// purpose: a bare `:global(.language-switcher button)` ties the switcher's own scoped
	// rule on specificity and would win or lose on source order alone.
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
			outline: 1px dotted $ink;
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
