import type { RequestHandler } from './$types';
import { baseLocale, extractLocaleFromUrl } from '#lib/paraglide/runtime.js';
import { renderLlmsTxt } from '#lib/server/llms-txt.js';

// Bare /llms.txt always serves the base locale, never Accept-Language.
export const GET: RequestHandler = ({ url }) => {
	const locale = extractLocaleFromUrl(url) ?? baseLocale;

	return new Response(renderLlmsTxt(locale), {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'max-age=0, s-maxage=3600'
		}
	});
};
