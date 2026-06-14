<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { syncLocale } from '$lib/i18n.svelte';

	let { children } = $props();

	// Reactive: `getLocale()` is backed by a $state on the client (see
	// $lib/i18n.svelte), so this re-evaluates when the locale changes.
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

	// Keep the reactive locale aligned with the URL after client-side switches.
	$effect(() => {
		syncLocale(page.url);
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin="anonymous" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	{#if currentLang === 'zh-tw'}
		<link href="https://fonts.googleapis.com/css2?family=Huninn&display=swap" rel="stylesheet" />
	{:else if currentLang === 'ja'}
		<link
			href="https://fonts.googleapis.com/css2?family=Kosugi+Maru&display=swap"
			rel="stylesheet"
		/>
	{/if}
	<link
		href="https://fonts.googleapis.com/css2?family=Zilla+Slab:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap"
		rel="stylesheet"
	/>

	<meta name="viewport" content="width=device-width,initial-scale=1" />
	<meta http-equiv="x-ua-compatible" content="ie=edge" />
	<meta property="og:url" content="https://aries0d0f.me" />
	<meta property="og:image" content="https://aries0d0f.me/avatar.gif" />
	<meta property="og:description" content={m.og_description({ name: m.noun_general_name() })} />
	<meta name="description" content={m.og_description({ name: m.noun_general_name() })} />
	<title>{m.noun_general_name()}</title>
	<link rel="icon" type="image/gif" href="/avatar.gif" />
</svelte:head>

<div class="viewport-container" style="--accent-fill: {accentFill}">
	{@render children()}
</div>

<style lang="scss">
	:global {
		*,
		*::before,
		*::after {
			box-sizing: border-box;
			margin: 0;
			padding: 0;
		}

		:root {
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
