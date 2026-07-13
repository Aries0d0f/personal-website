<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { useCRT } from '$lib/helpers/crt.svelte';
	import { useGameStore } from '$lib/store/game';
	import { abnormalityCodeSet } from '$lib/game/abnoramlity';

	const ACCELERATOR = { continue: 'C', leave: 'B' };

	const { promote } = useCRT();
	const { discoveredAbnormalities, continueChallenge, leaveClearedGame } = useGameStore();

	let dialog = $state<HTMLDialogElement>();
	let continueButton = $state<HTMLButtonElement>();
	let leaveButton = $state<HTMLButtonElement>();
	let isChoosing = $state(false);

	// Being mounted is the victory: the dialog opens itself, no trigger button.
	$effect(() => {
		if (dialog && !dialog.open) dialog.showModal();
	});

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

	async function handleContinue() {
		if (isChoosing) return;
		isChoosing = true;

		await continueChallenge();
	}

	function handleLeave() {
		if (isChoosing) return;
		isChoosing = true;

		leaveClearedGame();
		window.location.assign(`/${getLocale()}`);
	}

	function keepUnderGlass(event: ToggleEvent) {
		if (event.newState === 'open') promote();
	}
</script>

<dialog
	bind:this={dialog}
	class="game-dialog-container"
	ontoggle={keepUnderGlass}
	oncancel={(event) => event.preventDefault()}
	onkeydown={(event) =>
		accelerate(event, {
			[ACCELERATOR.continue]: continueButton,
			[ACCELERATOR.leave]: leaveButton
		})}
>
	<div class="game-dialog-window">
		<div class="game-dialog-title-bar">
			<h1>{m.game_components_clear_title()}</h1>
		</div>
		<div class="game-dialog-body">
			<p>
				{m.game_components_clear_description({
					discovered: $discoveredAbnormalities.size,
					total: abnormalityCodeSet.size
				})}
			</p>
		</div>
		<footer>
			<button bind:this={continueButton} onclick={handleContinue} disabled={isChoosing}>
				{m.game_components_clear_continue()}
				<i>({ACCELERATOR.continue})</i>
			</button>
			<button
				bind:this={leaveButton}
				class="is-default"
				onclick={handleLeave}
				disabled={isChoosing}
			>
				{m.game_components_clear_back_to_normal()}
				<i>({ACCELERATOR.leave})</i>
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
			padding: 1rem;

			> p {
				margin: 0;
				font-size: 0.8125rem;
				line-height: 1.5;
				white-space: pre-line;
			}
		}
	}
</style>
