// ─── Social Redirects ────────────────────────────────────────────────────────
//
// /s/<brand>[.tld][/path] → that profile, with a GA4 hit fired alongside.

import type { RequestEvent } from '@sveltejs/kit';

import { resolveGA4ClientId, reportSocialRedirect } from './ga4.helpers';

export function isSocialRedirect({ pathname }: URL): boolean {
	return /^\/s\/(@?)(\w+)(\.\w+)?(\/\w+)?/.test(pathname);
}

export async function handleSocialRedirect(
	event: RequestEvent,
	clientIP: string | null
): Promise<Response> {
	const [, atMark, brand, tld = '.com', path = ''] = event.url.pathname.match(
		/^\/s\/(@?)(\w+)(\.\w+)?(\/\w+)?/
	)!;
	const target = `https://${brand}${tld}${path}/${atMark ? '@' : ''}aries0d0f`;

	const { clientId, mintedCookie } = await resolveGA4ClientId(event, clientIP);
	reportSocialRedirect(event, {
		brand,
		tld: tld.slice(1),
		path: path || '/',
		target,
		clientId,
		clientIP
	});

	const headers = new Headers({ Location: target });
	if (mintedCookie) headers.append('Set-Cookie', mintedCookie);

	return new Response(null, { status: 301, headers });
}
