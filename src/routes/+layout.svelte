<script lang="ts">
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { syncLocale } from '#lib/i18n.svelte.js';
	import { useCRT } from '#lib/helpers/crt.svelte.js';
	import { localeFontHref } from '#lib/fonts.js';
	import { provideGameKit, useGameStore } from '#lib/store/game.js';
	import Viewport from '#lib/layout/Viewport.svelte';
	import { onMount, type Component } from 'svelte';
	import type { GameKit } from '#lib/game/kit.js';

	let { children, data } = $props();

	let screenEl = $state<HTMLDivElement>();

	const { isGameMode, isGameCleared, syncFromServer } = useGameStore();
	const crt = useCRT();

	syncFromServer(data?.game);

	// Held until the player leaves.
	let heldKit: GameKit | null = null;
	const gameKit = $derived.by(() => {
		if (data.gameKit) return (heldKit = data.gameKit);
		if (!$isGameMode && !$isGameCleared) heldKit = null;
		return heldKit;
	});

	provideGameKit(() => gameKit);

	const GameLayer = $derived(gameKit?.GameLayer);

	// Same module ref, no remount.
	let summonedCrt = $state<Component<{ screen?: HTMLElement; active?: boolean }>>();
	const CrtScreen = $derived(gameKit?.CrtScreen ?? summonedCrt);

	const loadCrt = () => import('#lib/components/CrtScreen.svelte');

	$effect(() => {
		if (!crt.wanted || summonedCrt) return;

		loadCrt().then((m) => (summonedCrt = m.default));
	});

	const currentLang = $derived(getLocale());
	const accentFill = $derived.by(() => {
		switch (currentLang) {
			case 'zh-tw':
				return '#FCA302';
			case 'ja':
				return '#BC002D';
			default:
				return '#F00';
		}
	});

	// Post-hydration only, so the head never mismatches Cloudflare's rewritten fonts.
	const ssrLang = getLocale();
	let hydrated = $state(false);
	const switchedFontHref = $derived(
		hydrated && currentLang !== ssrLang ? localeFontHref(currentLang) : undefined
	);

	$effect(() => {
		syncLocale(page.url);
		syncFromServer(data?.game);
	});

	onMount(() => {
		hydrated = true;

		// Fetch only; mounted on demand.
		const preload = () => void loadCrt().catch(() => {});
		if ('requestIdleCallback' in window) {
			const id = requestIdleCallback(preload, { timeout: 3000 });
			return () => cancelIdleCallback(id);
		}
		const id = setTimeout(preload, 1000);
		return () => clearTimeout(id);
	});
</script>

<svelte:head>
	<!-- SSR fonts live in app.html; this only covers client-side locale switches. -->
	{#if switchedFontHref}
		<link href={switchedFontHref} rel="stylesheet" />
	{/if}

	<meta name="viewport" content="width=device-width,initial-scale=1" />
	<meta http-equiv="x-ua-compatible" content="ie=edge" />
	<meta property="og:url" content="https://aries0d0f.me" />
	<meta property="og:image" content="https://aries0d0f.me/favicon.png" />
	<meta property="og:description" content={m.og_description({ name: m.noun_general_name() })} />
	<meta name="description" content={m.og_description({ name: m.noun_general_name() })} />
	<title>{m.noun_general_name()}</title>
	<link rel="apple-touch-icon" sizes="48x48" href="/favicon-48x48.png" />
	<link rel="apple-touch-icon" sizes="72x72" href="/favicon-72x72.png" />
	<link rel="apple-touch-icon" sizes="96x96" href="/favicon-96x96.png" />
	<link rel="apple-touch-icon" sizes="256x256" href="/favicon-256x256.png" />
	<link rel="apple-touch-icon" sizes="384x384" href="/favicon-384x384.png" />
	<link rel="apple-touch-icon" sizes="512x512" href="/favicon-512x512.png" />
	<link rel="manifest" href="/manifest.webmanifest" crossorigin="anonymous" />
	<link rel="icon" type="image/png" href="/favicon-32x32.png" />
	<link rel="icon" type="image/gif" href="/favicon.gif" />
</svelte:head>

<div class="viewport-container" bind:this={screenEl} style="--accent-fill: {accentFill}">
	{#if page.status >= 400}
		{@render children()}
	{:else}
		<Viewport>
			{@render children()}
		</Viewport>
	{/if}
	{#if GameLayer}
		<GameLayer />
	{/if}
</div>

<!-- Sibling, not child, so the overlay skips the collapse transform. -->
{#if CrtScreen}
	<CrtScreen screen={screenEl} active={$isGameMode} />
{/if}

<style lang="scss">
	:global {
		*,
		*::before,
		*::after {
			box-sizing: border-box;
			margin: 0;
			padding: 0;
		}

		html,
		body {
			background-color: #fff;
			color: #000;

			@media (width > 840px) {
				// Kill the macOS/iOS rubber-band overscroll bounce at the edges.
				overscroll-behavior: none;
			}
		}

		:root {
			color-scheme: light dark;
			font-family:
				'Zilla Slab',
				'Kosugi Maru',
				'Huninn',
				-apple-system,
				BlinkMacSystemFont,
				'Segoe UI',
				Roboto,
				Oxygen,
				Ubuntu,
				Cantarell,
				'Open Sans',
				'Helvetica Neue',
				sans-serif;

			&:lang(zh-tw) {
				font-family:
					'Zilla Slab',
					'Huninn',
					'Kosugi Maru',
					-apple-system,
					BlinkMacSystemFont,
					'Segoe UI',
					Roboto,
					Oxygen,
					Ubuntu,
					Cantarell,
					'Open Sans',
					'Helvetica Neue',
					sans-serif;
			}
		}

		::selection {
			background-color: color-mix(in srgb, var(--accent-fill), transparent 0%);
		}

		article,
		article *,
		p,
		p *,
		a,
		text,
		textPath {
			&::selection {
				color: #fff;
				fill: #fff;
			}
		}
	}

	.viewport-container {
		width: 100%;
		min-height: 100dvh;
		opacity: 0;
		animation: fadeIn 0.3s ease-out 0.1s forwards;
	}

	@keyframes fadeIn {
		to {
			opacity: 1;
		}
	}
</style>
