import { redirect, type RequestEvent } from '@sveltejs/kit';
import { sequence, type Handle } from '@sveltejs/kit/hooks';
import {
	baseLocale,
	deLocalizeUrl,
	extractLocaleFromRequestWithStrategies,
	extractLocaleFromUrl,
	getTextDirection,
	locales,
	localizeUrl
} from '#lib/paraglide/runtime.js';
import { paraglideMiddleware } from '#lib/paraglide/server.js';
import { renderFontLinks } from '#lib/fonts.js';
import { handleEdge } from '#lib/server/edge/index.js';
import { markCaught, readGameState, writeGameState } from '#lib/server/game.js';

// Skip locale redirect and edge worker (isIPLookup matches any CLI/unknown UA).
const NON_LOCALIZED_PATHS = new Set(['/sitemap.xml', '/robots.txt', '/llms.txt', '/api/game']);
const LOCALIZED_LLMS_TXT_PATHS = new Set(locales.map((locale) => `/${locale}/llms.txt`));
const isNonLocalizedPath = (pathname: string) =>
	NON_LOCALIZED_PATHS.has(pathname) || LOCALIZED_LLMS_TXT_PATHS.has(pathname);

// CVE-2026-111497 (Brotli OOB write): refuse compressed request bodies.
const handleRequestEncoding: Handle = ({ event, resolve }) => {
	const encoding = event.request.headers.get('content-encoding')?.trim().toLowerCase();

	if (encoding && encoding !== 'identity') {
		return new Response('Unsupported Content-Encoding', { status: 415 });
	}

	return resolve(event);
};

const handleWorker: Handle = async ({ event, resolve }) => {
	if (isNonLocalizedPath(event.url.pathname)) return resolve(event);

	const response = await handleEdge(event);
	if (response) return response;

	return resolve(event);
};

// Legacy /zh-TW -> /zh-tw. Must run before handleLocaleRedirect.
const handleLegacyLocaleCasing: Handle = ({ event, resolve }) => {
	const { pathname } = event.url;
	const match = pathname.match(/^\/zh-tw(?=\/|$)/i);

	if (match && match[0] !== '/zh-tw') {
		redirect(301, '/zh-tw' + pathname.slice(match[0].length) + event.url.search);
	}

	return resolve(event);
};

const handleLocaleRedirect: Handle = ({ event, resolve }) => {
	const wantsHtml = event.request.headers.get('accept')?.includes('text/html');

	if (
		wantsHtml &&
		!isNonLocalizedPath(event.url.pathname) &&
		extractLocaleFromUrl(event.url) === undefined
	) {
		const preferred = extractLocaleFromRequestWithStrategies(event.request, [
			'preferredLanguage',
			'baseLocale'
		]);

		// Strip the trailing slash to avoid a second redirect.
		const path = localizeUrl(event.url, { locale: preferred }).pathname.replace(/\/$/, '');
		redirect(307, path + event.url.search);
	}

	return resolve(event);
};

// /{lang}/game 404s on purpose; the token is minted on that same response.
const GAME_ENTRY = '/game';

// Only navigations get bounced, or assets and the API would be redirected.
const isNavigation = (event: RequestEvent) =>
	event.isDataRequest || (event.request.headers.get('accept')?.includes('text/html') ?? false);

const handleGame: Handle = async ({ event, resolve }) => {
	const state = await readGameState(event);
	const path = deLocalizeUrl(event.url).pathname;

	// Front door. A parked (cleared) token carries its collection into the new run.
	if (!state.active && path === GAME_ENTRY) {
		event.locals.game = {
			active: true,
			stage: 0,
			caught: false,
			clicked: false,
			startedAt: Date.now(),
			proofSeed: null,
			currentAbnormality: null,
			discoveredAbnormalities: state.discoveredAbnormalities,
			cleared: false,
			clearTimes: state.clearTimes
		};
		event.locals.game.proofSeed = await writeGameState(event.cookies, event.locals.game);

		return resolve(event);
	}

	event.locals.game = state;

	// Stage-0 lock lives server-side: the escape being attempted is a client bypass.
	if (state.active && state.stage === 0 && path !== GAME_ENTRY && isNavigation(event)) {
		markCaught(event.cookies);

		const locale = extractLocaleFromUrl(event.url) ?? baseLocale;
		redirect(307, `/${locale}${GAME_ENTRY}`);
	}

	return resolve(event);
};

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		return resolve(
			{ ...event, request },
			{
				transformPageChunk: ({ html }) =>
					html
						.replace('%paraglide.lang%', locale)
						.replace('%paraglide.dir%', getTextDirection(locale))
						.replace('%app.fonts%', renderFontLinks(locale))
			}
		);
	});

export const handle: Handle = sequence(
	handleRequestEncoding,
	handleWorker,
	handleLegacyLocaleCasing,
	handleLocaleRedirect,
	handleGame,
	handleParaglide
);
