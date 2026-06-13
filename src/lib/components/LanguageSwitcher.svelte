<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ResolvedPathname } from '$app/types';
	import { getLocale, locales, localizeHref, type Locale } from '$lib/paraglide/runtime';

	// Native display names so each option reads in its own language.
	const labels: Record<Locale, string> = {
		en: 'EN',
		'zh-tw': '漢',
		ja: '日'
	};

	// Reactive (getLocale() is $state-backed on the client), so the active button
	// updates in place after a switch.
	const current = $derived(getLocale());

	// Client-side navigation to the localized URL — no full reload, so the page
	// (and its intro animation) stays mounted and the text swaps in place.
	// `localizeHref` already returns a final, locale-prefixed path, so it stands
	// in for a `resolve()`d pathname (this app configures no `base`).
	function switchTo(locale: Locale) {
		if (locale === current) return;
		const target = localizeHref(page.url.pathname + page.url.search, {
			locale
		}) as ResolvedPathname;
		goto(target, { keepFocus: true, noScroll: true });
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
