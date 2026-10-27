import type { Locale } from '#lib/paraglide/runtime.js';

const BASE_FONT =
	'https://fonts.googleapis.com/css2?family=Zilla+Slab:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap';

const LOCALE_FONTS: Partial<Record<Locale, string>> = {
	'zh-tw': 'https://fonts.googleapis.com/css2?family=Huninn&display=swap',
	ja: 'https://fonts.googleapis.com/css2?family=Kosugi+Maru&display=swap'
};

export const localeFontHref = (locale: Locale) => LOCALE_FONTS[locale];

// Outside hydration lifecycle injection for Cloudflare Fonts rewrite
export const renderFontLinks = (locale: Locale) =>
	[
		'<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin="anonymous" />',
		'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />',
		...[localeFontHref(locale), BASE_FONT]
			.filter(Boolean)
			.map((href) => `<link href="${href}" rel="stylesheet" />`)
	].join('\n\t\t');
