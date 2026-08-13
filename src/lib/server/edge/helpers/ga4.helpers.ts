// ─── GA4 Reporting ───────────────────────────────────────────────────────────
//
// Server-side Measurement Protocol reporting for the social-redirect flow —
// client ID resolution/minting, device/geo enrichment, and the fire-and-forget
// hit itself.

import type { RequestEvent } from '@sveltejs/kit';

import { UAParser } from 'ua-parser-js';

import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

const GA4_ENDPOINT = 'https://www.google-analytics.com/mp/collect';
const GA_COOKIE_NAME = '_ga';
const GA_COOKIE_MAX_AGE = 60 * 60 * 24 * 730; // ~2 years, GA's own default
const encoder = new TextEncoder();

// UN M49 continent groupings (developers.google.com/analytics/devguides/collection/protocol/ga4/reference#payload_geo_info).
// Only the continent level: M49 splits the Americas into Northern/Latin
// America+Caribbean at the sub-region level, which needs a per-country lookup
// Cloudflare's continent code alone can't provide, so subcontinent_id is left unset.
const UN_M49_CONTINENT: Partial<Record<ContinentCode, string>> = {
	AF: '002',
	AS: '142',
	EU: '150',
	NA: '019',
	SA: '019',
	OC: '009'
};

function getGA4Credentials(
	platform: Readonly<App.Platform> | undefined
): { measurementId: string; apiSecret: string } | null {
	const fromPlatform = platform?.env as Record<string, string | undefined> | undefined;
	const measurementId = fromPlatform?.GA4_MEASUREMENT_ID ?? env.GA4_MEASUREMENT_ID;
	const apiSecret = fromPlatform?.GA4_API_SECRET ?? env.GA4_API_SECRET;

	if (!measurementId || !apiSecret) return null;

	return { measurementId, apiSecret };
}

// Reuses the existing `_ga` cookie's client_id when present; otherwise mints
// one and writes it back as `_ga`, so a later real pageview inherits it too.
export async function resolveGA4ClientId(
	event: RequestEvent,
	clientIP: string | null
): Promise<{ clientId: string; mintedCookie: string | null }> {
	const existing = event.cookies.get(GA_COOKIE_NAME);
	const clientId = existing?.match(/^GA\d\.\d\.(\d+\.\d+)$/)?.[1];

	if (clientId) return { clientId, mintedCookie: null };

	const minted = await deriveDeviceClientId(clientIP, event.request.headers.get('User-Agent'));
	const mintedCookie = event.cookies.serialize(GA_COOKIE_NAME, `GA1.1.${minted}`, {
		path: '/',
		maxAge: GA_COOKIE_MAX_AGE,
		sameSite: 'lax',
		secure: !dev
	});

	return { clientId: minted, mintedCookie };
}

async function deriveDeviceClientId(
	clientIP: string | null,
	userAgent: string | null
): Promise<string> {
	const digest = await crypto.subtle.digest(
		'SHA-256',
		encoder.encode(`${clientIP ?? ''}::${userAgent ?? ''}`)
	);
	const view = new DataView(digest);

	// Deterministic per IP+UA, so cookie-less repeats from the same device still match.
	return `${view.getUint32(0) % 2147483647}.${view.getUint32(4) % 2147483647}`;
}

export function reportSocialRedirect(
	event: RequestEvent,
	data: {
		brand: string;
		tld: string;
		path: string;
		target: string;
		clientId: string;
		clientIP: string | null;
	}
): void {
	// Skip if GA4 credentials are missing
	const credentials = getGA4Credentials(event.platform);
	if (!credentials) return;

	const endpoint = new URL(GA4_ENDPOINT);
	endpoint.searchParams.set('measurement_id', credentials.measurementId);
	endpoint.searchParams.set('api_secret', credentials.apiSecret);

	// Cloudflare already resolves the visitor's real geo per request.
	const geo = event.platform?.cf;
	const continent = geo?.continent as ContinentCode | undefined;
	const referer = event.request.headers.get('Referer');
	const { source, medium } = resolveReferralSource(referer);
	const sessionId = `${Math.floor(Date.now() / 1000)}`;
	const device = buildDeviceInfo(event);

	const report = fetch(endpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			client_id: data.clientId,
			// MP fields, not headers: developers.google.com/analytics/devguides/collection/protocol/ga4/reference
			device,
			ip_override: data.clientIP ?? undefined,
			user_location: geo?.country
				? {
						country_id: geo.country,
						region_id: geo.regionCode ? `${geo.country}-${geo.regionCode}` : undefined,
						city: geo.city,
						continent_id: continent && UN_M49_CONTINENT[continent]
					}
				: undefined,
			events: [
				// Sets source/medium for this session; must precede social_redirect.
				{ name: 'campaign_details', params: { session_id: sessionId, source, medium } },
				{
					name: 'page_view',
					params: {
						session_id: sessionId,
						engagement_time_msec: 1,
						page_location: event.url.toString(),
						page_referrer: referer ?? undefined,
						page_title: `Social Redirect · ${data.brand}.${data.tld}`
					}
				},
				{
					name: 'social_redirect',
					params: {
						session_id: sessionId,
						engagement_time_msec: 1,
						brand: data.brand,
						tld: data.tld,
						path: data.path,
						destination: data.target
					}
				}
			]
		})
	}).catch(() => {
		// Analytics must never surface as an error on the redirect it's reporting.
	});

	event.platform?.ctx.waitUntil(report);
}

function resolveReferralSource(referer: string | null): { source: string; medium: string } {
	if (!referer) return { source: '(direct)', medium: '(none)' };

	try {
		return { source: new URL(referer).hostname, medium: 'referral' };
	} catch {
		return { source: '(direct)', medium: '(none)' };
	}
}

function buildDeviceInfo(event: RequestEvent) {
	const { browser, os, device } = UAParser(
		event.request.headers.get('User-Agent') ?? '',
		event.request.headers
	);

	return {
		category: device.type === 'tablet' || device.type === 'mobile' ? device.type : 'desktop',
		language: primaryLanguage(event.request.headers.get('Accept-Language')),
		operating_system: os.name,
		operating_system_version: os.version,
		browser: browser.name,
		browser_version: browser.version,
		model: device.model,
		brand: device.vendor
	};
}

// "en-US,en;q=0.9,zh-TW;q=0.8" -> "en-us"
function primaryLanguage(acceptLanguage: string | null): string | undefined {
	return acceptLanguage?.split(',')[0]?.trim().toLowerCase() || undefined;
}
