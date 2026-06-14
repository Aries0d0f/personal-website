import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import {
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

// Google indexed the previous BCP-47 casing of the Chinese locale (/zh-TW), but
// Paraglide's routes are lowercase (/zh-tw). Permanently redirect the old casing
// — and any path beneath it — to the canonical lowercase form so indexed links
// keep working. Runs before handleLocaleRedirect, which would otherwise treat
// /zh-TW as un-prefixed and send it to the visitor's preferred locale instead of
// Chinese. Matched case-insensitively; the already-canonical form is skipped to
// avoid a redirect loop, and the lookahead keeps /zh-tw from matching.
const handleLegacyLocaleCasing: Handle = ({ event, resolve }) => {
	const { pathname } = event.url;
	const match = pathname.match(/^\/zh-tw(?=\/|$)/i);

	if (match && match[0] !== '/zh-tw') {
		redirect(301, '/zh-tw' + pathname.slice(match[0].length) + event.url.search);
	}

	return resolve(event);
};

// Every locale now carries a path prefix (/en, /ja, /zh-tw), so an un-prefixed
// path matches no localized pattern — extractLocaleFromUrl returns undefined.
// Redirect those requests to the canonical, prefixed URL for the visitor's
// preferred locale (Accept-Language, falling back to the base locale). Explicit
// /en, /ja and /zh-tw links already carry a locale and skip this entirely.
const handleLocaleRedirect: Handle = ({ event, resolve }) => {
	const wantsHtml = event.request.headers.get('accept')?.includes('text/html');

	if (wantsHtml && extractLocaleFromUrl(event.url) === undefined) {
		const preferred = extractLocaleFromRequestWithStrategies(event.request, [
			'preferredLanguage',
			'baseLocale'
		]);

		// localizeUrl("/") yields a trailing slash (e.g. "/en/"); strip it so the
		// canonical target is "/en" and we avoid a second trailing-slash redirect.
		const path = localizeUrl(event.url, { locale: preferred }).pathname.replace(/\/$/, '');
		redirect(307, path + event.url.search);
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

export const handle: Handle = sequence(
	handleWorker,
	handleLegacyLocaleCasing,
	handleLocaleRedirect,
	handleParaglide
);
