<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin="anonymous" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
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

<div class="viewport-container">
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
			font-family: 'Zilla Slab', sans-serif;
		}
	}

	.viewport-container {
		width: 100%;
		min-height: 100vh;
	}
</style>
