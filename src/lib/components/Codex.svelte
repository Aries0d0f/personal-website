<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { useCRT } from '$lib/helpers/crt.svelte';
	import { useGameStore } from '$lib/store/game';
	import { Abnormality, abnormalityCodeSet } from '$lib/game/abnoramlity';

	const { promote } = useCRT();
	const { abnormality, discoveredAbnormalities } = useGameStore();

	const messages = m as unknown as Record<string, () => string>;

	const entries = [...abnormalityCodeSet].map((code) => {
		const key = code.toLowerCase();
		return {
			code,
			name: messages[`game_components_codex_${key}_name`],
			description: messages[`game_components_codex_${key}_description`]
		};
	});

	function keepUnderGlass(event: ToggleEvent) {
		if (event.newState === 'open') promote();
	}
</script>

<button class="game-dialog-field-trigger" command="show-modal" commandfor="game-codex">
	{#if $abnormality === Abnormality.AN26}
		{m.game_components_options_give_up()}
	{:else}
		{m.game_components_codex_title()}
	{/if}
</button>

<dialog id="game-codex" class="game-dialog-container" ontoggle={keepUnderGlass}>
	<div class="game-dialog-window">
		<div class="game-dialog-title-bar">
			<button class="game-dialog-close" command="close" commandfor="game-codex" aria-label="Close"
			></button>
			<h1>
				{#if $abnormality === Abnormality.AN26}
					{m.game_components_options_give_up()}
				{:else}
					{m.game_components_codex_title()}
				{/if}
			</h1>
		</div>
		<div class="game-dialog-body">
			<p class="game-codex-summary">
				{#if $abnormality === Abnormality.AN26}
					{m.game_components_options_give_up()}
				{:else}
					{m.game_components_codex_description({
						discovered: $discoveredAbnormalities.size,
						total: abnormalityCodeSet.size
					})}
				{/if}
			</p>
			<ul class="game-codex-list">
				{#each entries as entry, index (entry.code)}
					{@const unlocked = $discoveredAbnormalities.has(entry.code)}
					<li class="game-codex-entry" class:is-locked={!unlocked}>
						<h1>{String(index + 1).padStart(2, '0')}</h1>
						<div>
							{#if $abnormality === Abnormality.AN26}
								<h2>{m.game_components_options_give_up()}</h2>
								<p>{m.game_components_options_give_up()}</p>
							{:else if unlocked}
								<h2>{entry.name()}</h2>
								<p>{entry.description()}</p>
							{:else}
								<h2>{m.game_components_codex_locked_name()}</h2>
								<p>{m.game_components_codex_locked_description()}</p>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		</div>
		<footer>
			<button class="is-default" command="close" commandfor="game-codex">
				{#if $abnormality === Abnormality.AN26}
					{m.game_components_options_give_up()}
				{:else}
					{m.game_components_codex_close()}
				{/if}
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

	.game-dialog-field-trigger {
		@include push-button;

		width: auto;
		height: auto;
		font-family: inherit;
		font-weight: 400;
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

			width: min(26rem, 100%);
			max-height: min(32rem, 90dvh);
			display: flex;
			flex-direction: column;
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
			flex: none;

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
			overflow-y: auto;
			scrollbar-width: 0.5rem;

			&::-webkit-scrollbar {
				width: 0.5rem;
				height: 0.5rem;
			}

			&::-webkit-scrollbar-track {
				background: #ccc;
				border: 1px solid $ink;
				border-top-width: 0;
				border-bottom-width: 0;
			}

			&::-webkit-scrollbar-thumb {
				background: $ink;
			}

			&::-webkit-scrollbar-button:decrement {
				width: 0.5rem;
				height: 0.5rem;
			}
		}
	}

	.game-codex {
		&-summary {
			margin: 0 0 0.75rem;
			font-size: 0.8125rem;
			line-height: 1.5;
			white-space: pre-line;
		}

		&-list {
			display: flex;
			flex-direction: column;
			gap: 0.625rem;
			margin: 0;
			padding: 0;
			list-style: none;
		}

		&-entry {
			@include plate;

			padding: 0.5rem 0.625rem;
			display: flex;
			flex-direction: row;
			gap: 0.625rem;
			place-items: center;

			> div {
				display: flex;
				place-content: center;
				flex-direction: column;
				gap: 0.25rem;
			}

			h1 {
				font-size: 1.5rem;
				height: 100%;
				font-variant-numeric: tabular-nums;
			}

			h2 {
				font-size: 1rem;
				font-weight: 700;
				line-height: 1.25;
			}

			p {
				font-size: 0.8125rem;
				line-height: 1.5;
			}

			&.is-locked {
				opacity: 0.5;
			}
		}
	}
</style>
