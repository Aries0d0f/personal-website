<script lang="ts">
	import gsap from 'gsap';

	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { getLocale, locales, localizeHref, type Locale } from '$lib/paraglide/runtime';

	import type { ResolvedPathname } from '$app/types';

	let { mobile, fullLangName }: { mobile?: boolean; fullLangName?: boolean } = $props();

	const labels: Record<Locale, string> = $derived({
		en: fullLangName ? 'English' : 'EN',
		'zh-tw': fullLangName ? '繁體中文' : '漢',
		ja: fullLangName ? '日本語' : '日'
	});

	const current = $derived(getLocale());

	async function switchTo(locale: Locale) {
		if (locale === current) return;

		if (mobile) {
			const target = localizeHref(
				`${page.url.pathname.replace(/\/(experience|community)/, '')}${page.url.search}`,
				{
					locale
				}
			) as ResolvedPathname;

			window.location.href = target;
		} else {
			const target = localizeHref(`${page.url.pathname}${page.url.search}`, {
				locale
			}) as ResolvedPathname;

			// The fade is the menu's, and the switcher is no longer only in the menu — the game
			// options dialog has one too, on a page with no <menu> to fade. Awaiting a tween
			// that found no target never settles, which would strand the navigation below it.
			const menu = document.querySelector('menu');

			if (menu) {
				await gsap.to(menu, { opacity: 0, duration: 0.25, ease: 'power2.in' });
			}

			await goto(target, { keepFocus: true, noScroll: true });

			if (menu) {
				gsap.to(menu, { opacity: 1, duration: 0.4, ease: 'power3.out' });
			}
		}
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
			width: 1.5rem;
			height: 1.5rem;

			@media (max-height: 600px) and (orientation: landscape) {
				width: 1rem;
				height: 1rem;
			}

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
