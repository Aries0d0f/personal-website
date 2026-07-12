import { redirect, type Handle, type RequestEvent } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import {
	baseLocale,
	deLocalizeUrl,
	extractLocaleFromRequestWithStrategies,
	extractLocaleFromUrl,
	getTextDirection,
	localizeUrl
} from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { handleEdge } from '$lib/server/edge';
import { markCaught, readGameState, writeGameState } from '$lib/server/game';

// Routes that exist outside the i18n tree and must be served verbatim by
// SvelteKit. They have no locale-prefixed variant, and they must bypass the
// edge worker too: isIPLookup() matches any CLI/unknown User-Agent, so without
// this guard `curl /sitemap.xml` (or a crawler sending no UA) would get the
// IP-lookup response instead of the sitemap.
const NON_LOCALIZED_PATHS = new Set(['/sitemap.xml', '/robots.txt', '/api/game']);

// Ported Cloudflare Worker logic (social redirects + IP lookup). Runs first so
// it can short-circuit the request before routing/i18n; falls through to
// SvelteKit when it returns null. Reserved paths skip the worker so they reach
// their real handlers regardless of User-Agent.
const handleWorker: Handle = async ({ event, resolve }) => {
	if (NON_LOCALIZED_PATHS.has(event.url.pathname)) return resolve(event);

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

	if (
		wantsHtml &&
		!NON_LOCALIZED_PATHS.has(event.url.pathname) &&
		extractLocaleFromUrl(event.url) === undefined
	) {
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

// The game used to live in the URL — /{lang}/game, or a ?game flag that had to be
// dragged along by every link. It lives in a signed cookie now, so the player can
// wander anywhere and stay in it, and so their cleared stages survive a reload.
//
// /{lang}/game is still the front door, and still 404s: [slug] has no content for
// it. That is the joke. The player arrives at an error page, assumes the path put
// them there, and spends a while trying to leave by editing the path. The cookie
// is already set; the only way out is Give Up.
//
// The token is minted here rather than in a load function so it is issued by the
// same response that serves the error page, on the document request and on the
// __data.json request the Konami-code goto() makes.
const GAME_ENTRY = '/game';

// Only navigations get bounced. Assets, the API and the edge worker's own routes
// have to pass through, or the error page would come back without its stylesheet
// and the give-up request would be redirected instead of answered.
const isNavigation = (event: RequestEvent) =>
	event.isDataRequest || (event.request.headers.get('accept')?.includes('text/html') ?? false);

const handleGame: Handle = async ({ event, resolve }) => {
	const state = await readGameState(event);
	const path = deLocalizeUrl(event.url).pathname;

	// The front door. No token yet, and they knocked on /{lang}/game.
	if (!state.active && path === GAME_ENTRY) {
		event.locals.game = {
			active: true,
			stage: 0,
			caught: false,
			clicked: false,
			startedAt: Date.now(),
			proofSeed: null
		};
		event.locals.game.proofSeed = await writeGameState(
			event.cookies,
			event.platform,
			event.locals.game
		);

		return resolve(event);
	}

	event.locals.game = state;

	// Stage 0 is a locked room, and the lock is here rather than in the client, because
	// the escape being attempted *is* a client bypass — typing a new path into the
	// address bar. The player has not rewritten the status code yet, so as far as the
	// game is concerned the site does not exist for them: every navigation lands back
	// on the 404 they were trying to leave.
	//
	// Once stage 1 is banked the room unlocks and they can roam the site freely — that
	// is the reward, and `state.stage === 0` is what draws the line.
	//
	// This response is a redirect, so it has no page on which to say it noticed. It
	// leaves the note in a one-shot cookie instead, and the 404 it bounces them to eats
	// the note and delivers the line. Nothing is written into the signed token: the
	// player is caught *this once*, not branded for the rest of the run.
	if (state.active && state.stage === 0 && path !== GAME_ENTRY && isNavigation(event)) {
		markCaught(event.cookies);

		const locale = extractLocaleFromUrl(event.url) ?? baseLocale;
		redirect(307, `/${locale}${GAME_ENTRY}`);
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
	handleGame,
	handleParaglide
);
