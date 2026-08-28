import type { RequestHandler } from './$types';
import { baseLocale, extractLocaleFromUrl } from '$lib/paraglide/runtime';
import { renderLlmsTxt } from '$lib/server/llms-txt';

// An explicit /{locale}/llms.txt prefix (e.g. /ja/llms.txt) already resolves
// to this same route — Paraglide's URL matching applies to every path, not
// just page routes — so extracting the locale from the request URL is enough
// to serve the right language. A bare /llms.txt has no prefix to extract, and
// falls back to the base locale rather than the visitor's Accept-Language: it
// must stay a stable, English default regardless of who's asking. See
// NON_LOCALIZED_PATHS in src/hooks.server.ts, which keeps that bare path from
// being redirected to a locale-prefixed URL the way an ordinary page would be.
export const GET: RequestHandler = ({ url }) => {
	const locale = extractLocaleFromUrl(url) ?? baseLocale;

	return new Response(renderLlmsTxt(locale), {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'max-age=0, s-maxage=3600'
		}
	});
};
