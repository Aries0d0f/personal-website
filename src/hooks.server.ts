import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import {
	baseLocale,
	extractLocaleFromRequestWithStrategies,
	extractLocaleFromUrl,
	getTextDirection,
	localizeUrl
} from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { handleEdge } from '$lib/server/edge';

// Ported Cloudflare Worker logic (social redirects + IP lookup). Runs first so
// it can short-circuit the request before routing/i18n; falls through to
// SvelteKit when it returns null.
const handleWorker: Handle = async ({ event, resolve }) => {
	const response = await handleEdge(event);
	if (response) return response;

	return resolve(event);
};

// The `url` strategy treats an un-prefixed path as the base locale, so it never
// redirects `/`. To welcome visitors in their own language we look past the URL:
// if the path carries no locale prefix but the browser's Accept-Language points
// elsewhere, redirect to the localized URL. Explicit /ja/ or /zh-tw/ links skip
// this entirely and are always honored.
const handleLocaleRedirect: Handle = ({ event, resolve }) => {
	const wantsHtml = event.request.headers.get('accept')?.includes('text/html');

	if (wantsHtml && extractLocaleFromUrl(event.url) === baseLocale) {
		const preferred = extractLocaleFromRequestWithStrategies(event.request, [
			'preferredLanguage',
			'baseLocale'
		]);

		if (preferred !== baseLocale) {
			redirect(307, localizeUrl(event.url, { locale: preferred }).pathname + event.url.search);
		}
	}

	return resolve(event);
};

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html
					.replace('%paraglide.lang%', locale)
					.replace('%paraglide.dir%', getTextDirection(locale))
		});
	});

export const handle: Handle = sequence(handleWorker, handleLocaleRedirect, handleParaglide);
