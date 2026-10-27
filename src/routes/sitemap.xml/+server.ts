import type { RequestHandler } from '@sveltejs/kit';
import { baseLocale, locales, localizeHref } from '#lib/paraglide/runtime.js';

const ORIGIN = 'https://aries0d0f.me';

// Derive slugs from the content glob so the sitemap stays in sync.
const slugs = [
	...new Set(
		Object.keys(import.meta.glob('/src/content/web/*/*.md')).map((path) => path.split('/')[4])
	)
];

// `''` is the index; the rest are the [slug] pages.
const basePaths = ['', ...slugs.map((slug) => `/${slug}`)];

// Built from Paraglide: super-sitemap assumes an un-prefixed default locale.
const localizePath = (path: string, locale: (typeof locales)[number]) =>
	// Strip the trailing slash so loc matches the served URL without a redirect.
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
