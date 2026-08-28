import type { RequestHandler } from '@sveltejs/kit';
import { baseLocale, locales, localizeHref } from '$lib/paraglide/runtime';

const ORIGIN = 'https://aries0d0f.me';

// Content slugs are the directory names under /src/content/web (e.g. `experience`,
// `community`, `skill`). Deriving them from the same glob the page loader uses
// keeps the sitemap in sync automatically when content is added or removed.
const slugs = [
	...new Set(
		Object.keys(import.meta.glob('/src/content/web/*/*.md')).map((path) => path.split('/')[4])
	)
];

// The un-prefixed routes Paraglide localizes. `''` is the index; the rest are
// the dynamic [slug] pages.
const basePaths = ['', ...slugs.map((slug) => `/${slug}`)];

// super-sitemap can't model this site: it assumes the default locale is
// un-prefixed (/about, /zh/about), but Paraglide prefixes *every* locale
// (/en, /ja, /zh-tw). So we build the sitemap from Paraglide's runtime — the
// real source of truth for canonical URLs — including hreflang alternates so
// search engines see each page's language variants.
const localizePath = (path: string, locale: (typeof locales)[number]) =>
	// localizeHref("/", …) yields a trailing slash (e.g. "/en/"); strip it so the
	// canonical loc matches what the app serves without a redirect.
	ORIGIN + localizeHref(path || '/', { locale }).replace(/\/$/, '');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${basePaths
	.flatMap((path) =>
		locales.map((locale) => {
			const alternates = locales
				.map(
					(alt) =>
						`    <xhtml:link rel="alternate" hreflang="${alt}" href="${localizePath(path, alt)}" />`
				)
				.concat(
					`    <xhtml:link rel="alternate" hreflang="x-default" href="${localizePath(path, baseLocale)}" />`
				)
				.join('\n');

			return `  <url>\n    <loc>${localizePath(path, locale)}</loc>\n${alternates}\n  </url>`;
		})
	)
	.join('\n')}
</urlset>`;

export const GET: RequestHandler = () =>
	new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=0, s-maxage=3600'
		}
	});
