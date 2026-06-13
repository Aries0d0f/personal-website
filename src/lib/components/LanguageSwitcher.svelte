<script lang="ts">
	import { getLocale, locales, setLocale, type Locale } from '$lib/paraglide/runtime';

	// Native display names so each option reads in its own language.
	const labels: Record<Locale, string> = {
		en: 'EN',
		'zh-tw': '漢',
		ja: '日'
	};

	// `getLocale()` reads from the URL on the server and the URL/cookie on the
	// client. Switching triggers a full navigation, so reading it once is enough.
	const current = getLocale();
</script>

<nav class="language-switcher" aria-label="Language">
	{#each locales as locale (locale)}
		<button
			type="button"
			lang={locale}
			aria-current={locale === current ? 'true' : undefined}
			disabled={locale === current}
			onclick={() => setLocale(locale)}
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
