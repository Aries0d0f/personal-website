<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	const currentLang = $derived(getLocale());
	const menuItems = $derived([
		{
			name: 'Home',
			title: m.pages_home_title(),
			href: `/${currentLang}`
		},
		{
			name: 'Experience',
			title: m.pages_experience_title(),
			href: `/${currentLang}/experience`
		},
		{
			name: 'Community',
			title: m.pages_community_title(),
			href: `/${currentLang}/community`
		}
	] as const);
</script>

<menu>
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
		right: 0;
		place-items: center;
		place-content: center;
		width: fit-content;
		writing-mode: vertical-rl;
		text-orientation: mixed;

		ul {
			display: flex;
			flex-direction: row;
			gap: 3rem;
			list-style: none;
			margin: 0;
			padding: 0 0.5rem;

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
					color: inherit;
					text-decoration: none;
				}
			}
		}
	}
</style>
