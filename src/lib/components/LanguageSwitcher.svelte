<script lang="ts">
	import gsap from 'gsap';

	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ResolvedPathname } from '$app/types';
	import { getLocale, locales, localizeHref, type Locale } from '$lib/paraglide/runtime';

	const labels: Record<Locale, string> = {
		en: 'EN',
		'zh-tw': '漢',
		ja: '日'
	};

	const current = $derived(getLocale());

	async function switchTo(locale: Locale) {
		if (locale === current) return;
		const target = localizeHref(page.url.pathname + page.url.search, {
			locale
		}) as ResolvedPathname;

		await gsap.to('menu', { opacity: 0, duration: 0.25, ease: 'power2.in' });
		await goto(target, { keepFocus: true, noScroll: false });
		gsap.to('menu', { opacity: 1, duration: 0.4, ease: 'power3.out' });
	}
</script>

<nav class="language-switcher" aria-label="Language">
	{#each locales as locale (locale)}
		<button
			type="button"
			lang={locale}
			aria-current={locale === current ? 'true' : undefined}
			disabled={locale === current}
			onclick={() => switchTo(locale)}
		>
			{labels[locale]}
		</button>
	{/each}
</nav>

<style lang="scss">
	.language-switcher {
		display: inline-flex;
		gap: 0.25rem;
		align-items: center;

		button {
			appearance: none;
			font: inherit;
			color: inherit;
			background: none;
			border: none;
			cursor: pointer;
			opacity: 0.6;
			transition: opacity 0.15s ease;

			&:hover {
				opacity: 1;
			}

			&[aria-current='true'] {
				font-weight: 600;
				cursor: default;
				opacity: 1;
			}
		}
	}
</style>
