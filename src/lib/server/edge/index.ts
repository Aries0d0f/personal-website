// ─── Edge worker logic ───────────────────────────────────────────────────────
//
// Ported from the standalone Cloudflare Worker that fronted the previous site.
// Runs inside SvelteKit's `handle` hook (see src/hooks.server.ts) ahead of
// routing, so it can short-circuit the request with its own Response.
//
// Two behaviours survive from the old worker:
//   - Social redirects  — /s/<brand>[.tld][/path] → that profile.
//   - The IP lookup — curl the site and you get your IP back, like
//     ifconfig.me, with optional WHOIS / abuse intelligence and UA easter eggs.
//

import type { RequestEvent } from '@sveltejs/kit';

import { handleIPLookup, isIPLookup } from './helpers/ip-lookup.helpers';
import { handleSocialRedirect, isSocialRedirect } from './helpers/social-redirect.helpers';
import { checkEasterEggs, CLI_UA } from './helpers/user-agent.helpers';

/**
 * Inspect an incoming request and, if it matches the social-redirect or
 * IP-lookup behaviour, return a Response to serve. Returns `null` to let
 * SvelteKit handle the request normally.
 */
export async function handleEdge(event: RequestEvent): Promise<Response | null> {
	const { url } = event;
	const userAgent = event.request.headers.get('User-Agent') ?? 'Unknown';
	const clientIP = event.request.headers.get('CF-Connecting-IP');

	if (isSocialRedirect(url)) {
		return handleSocialRedirect(event, clientIP);
	}

	if (isIPLookup(url, userAgent)) {
		if (event.request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': '*',
					'Access-Control-Allow-Methods': 'GET, OPTIONS'
				}
			});
		}

		return handleIPLookup(
			event.request,
			url,
			clientIP,
			CLI_UA.test(userAgent),
			checkEasterEggs(userAgent)
		);
	}

	return null;
}
