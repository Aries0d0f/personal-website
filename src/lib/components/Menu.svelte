<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { pageOrder, pageHref } from '$lib/pages';
	import Footer from './Footer.svelte';

	import type { PageKey } from '$lib/pages';

	const titles: Record<Exclude<PageKey, 'blank'>, () => string> = {
		home: m.pages_home_title,
		experience: m.pages_experience_title,
		community: m.pages_community_title,
		skill: m.pages_skills_title
	};

	const currentLang = $derived(getLocale());
	const menuItems = $derived(
		pageOrder
			.filter((key) => key !== 'blank')
			.map((key) => ({
				name: key,
				title: titles[key](),
				href: pageHref(key, currentLang)
			}))
	);
</script>

<menu>
	<Footer sideMode={true} />
	<ul>
		{#each menuItems as item (item.name)}
			<li class:active={page.url.pathname === item.href}>
				<a href={resolve(item.href)}>
					{item.title}
				</a>
			</li>
		{/each}
	</ul>
</menu>

<style lang="scss">
	menu {
		position: fixed;
		display: flex;
		height: 100dvh;
		top: 0;
		left: calc(100dvw - 36px);
		place-items: center;
		place-content: center;
		width: fit-content;
		writing-mode: vertical-rl;
		text-orientation: mixed;

		@media (max-height: 768px) and (orientation: landscape) {
			place-content: start;
			padding: 1rem 0;
		}

		ul {
			display: flex;
			flex-direction: row;
			gap: 3rem;
			list-style: none;
			margin: 0;
			padding: 0 0.5rem;
			z-index: 10;
			font-size: 1rem;

			li {
				color: #aaa;
				transition: color 0.3s ease;

				&.active {
					color: #4d4d4d;
				}

				&:hover {
					color: #000;
				}

				a {
					font-size: inherit;
					color: inherit;
					text-decoration: none;
				}
			}

			@media (max-height: 860px) and (orientation: landscape) {
				gap: 1.5rem;
			}

			@media (max-height: 600px) and (orientation: landscape) {
				gap: 1rem;
				font-size: 0.875rem;
			}
		}
	}
</style>
