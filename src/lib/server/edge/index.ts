// ─── Edge worker logic ───────────────────────────────────────────────────────
// Runs in the `handle` hook: social redirects and the curl-able IP lookup.

import type { RequestEvent } from '@sveltejs/kit';

import { isIPLookup, isSocialRedirect } from './helpers/matchers.helpers';
import { checkEasterEggs, CLI_UA } from './helpers/user-agent.helpers';

// Handlers load on demand.

/** Returns a Response for social-redirect/IP-lookup requests, else `null`. */
export async function handleEdge(event: RequestEvent): Promise<Response | null> {
	const { url } = event;
	const userAgent = event.request.headers.get('User-Agent') ?? 'Unknown';
	const clientIP = event.request.headers.get('CF-Connecting-IP');

	if (isSocialRedirect(url)) {
		const { handleSocialRedirect } = await import('./helpers/social-redirect.helpers');
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

		const { handleIPLookup } = await import('./helpers/ip-lookup.helpers');
		return handleIPLookup(event, url, clientIP, CLI_UA.test(userAgent), checkEasterEggs(userAgent));
	}

	return null;
}
