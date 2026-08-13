// ─── Edge worker logic ───────────────────────────────────────────────────────
//
// Ported from the standalone Cloudflare Worker that fronted the previous site.
// Runs inside SvelteKit's `handle` hook (see src/hooks.server.ts) ahead of
// routing, so it can short-circuit the request with its own Response.
//
// Two behaviours survive from the old worker:
//   • Social redirects  — /s/<brand>[.tld][/path] → that profile.
//   • The IP lookup — curl the site and you get your IP back, like
//     ifconfig.me, with optional WHOIS / abuse intelligence and UA easter eggs.
//
// Localized index serving and static asset serving from the old worker are
// intentionally dropped: Paraglide owns i18n now and the Cloudflare adapter
// owns asset serving.

import type { RequestEvent } from '@sveltejs/kit';

import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

// ─── Constants ───────────────────────────────────────────────────────────────

const SEPARATOR = '='.repeat(52);
const DIVIDER = '-'.repeat(52);
const GA4_ENDPOINT = 'https://www.google-analytics.com/mp/collect';
const GA_COOKIE_NAME = '_ga';
const GA_COOKIE_MAX_AGE = 60 * 60 * 24 * 730; // ~2 years, GA's own default
const encoder = new TextEncoder();
const NATIVE_UA =
	/MSIE|WebKit|WKWebView|safari|edge|chrom(e|ium)|firefox|html|khtml|gecko|anthropic-ai|Slurp|spider|bot|crawler|facebook|meta|externalagent|WhatsApp/i;
const CLI_UA =
	/xh|curl|wget|PowerShell|HTTPie|axios|got|python-requests|http-client|grpc-go|Unknown/i;

const easterEggs: Record<string, { reg: RegExp; msg: string }> = {
	WHY_POSTMAN: {
		reg: /PostmanRuntime|Insomnia|bruno-runtime|RapidAPI-Mac/i,
		msg: '# Why join the Navy when you can be a pirate?\n# cURL is better for your life — no subscriptions, no login just to fire a simple request.'
	},
	WHY_WINDOWS: {
		reg: /Windows/i,
		msg: '# Why pay for an OS that spies on you when you can sail free?\n# Linux is better for your life without the bloatware.'
	},
	WHY_CHROME: {
		reg: /Chrome/i,
		msg: '# Did you know they are watching?\n# Switch to Firefox and take back control of your data.'
	},
	WHY_BOT: {
		reg: /anthropic-ai|Slurp|spider|bot|crawler|facebook|meta|externalagent|WhatsApp/i,
		msg: "# Hello, fellow robot.\n# Just so you know, robots.txt is over there... (not that you're listening)"
	}
};
const GEOIP_FIELDS = [
	'status',
	'message',
	'continent',
	'continentCode',
	'country',
	'countryCode',
	'region',
	'regionName',
	'city',
	'district',
	'zip',
	'lat',
	'lon',
	'timezone',
	'offset',
	'isp',
	'org',
	'as',
	'asname',
	'mobile',
	'proxy',
	'hosting',
	'query'
] as const;

// ─── Types ─────────────────────────────────────────────────────────────────

interface GeoDataPayload {
	status: 'success' | 'fail';
	message: string;
	continent: string;
	continentCode: string;
	country: string;
	countryCode: string;
	region: string;
	regionName: string;
	city: string;
	district: string;
	zip: string;
	lat: number;
	lon: number;
	timezone: string;
	offset: number;
	currency: string;
	isp: string;
	org: string;
	as: string;
	asname: string;
	reverse: string;
	mobile: boolean;
	proxy: boolean;
	hosting: boolean;
	query: string;
}

type ActivedGeoDataKey = (typeof GEOIP_FIELDS)[number];

type GeoData = Pick<GeoDataPayload, ActivedGeoDataKey>;

// ─── Entry Point ─────────────────────────────────────────────────────────────

/**
 * Inspect an incoming request and, if it matches the social-redirect or
 * IP-lookup behaviour, return a Response to serve. Returns `null` to let
 * SvelteKit handle the request normally.
 */
export async function handleEdge(event: RequestEvent): Promise<Response | null> {
	const url = event.url;
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

// ─── Route Predicates ────────────────────────────────────────────────────────

function isSocialRedirect({ pathname }: URL): boolean {
	return /^\/s\/(@?)(\w+)(\.\w+)?(\/\w+)?/.test(pathname);
}

function isIPLookup({ pathname, hostname }: URL, userAgent: string): boolean {
	return (
		pathname.startsWith('/ip') ||
		hostname === 'ip.aries0d0f.me' ||
		CLI_UA.test(userAgent) ||
		(/^\/(whois|abuse|geo).?(whois|abuse|geo)?$/.test(pathname) && !NATIVE_UA.test(userAgent))
	);
}

// ─── Route Handlers ──────────────────────────────────────────────────────────

async function handleSocialRedirect(
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

// ─── GA4 Reporting ───────────────────────────────────────────────────────────

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
async function resolveGA4ClientId(
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

function reportSocialRedirect(
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
	const referer = event.request.headers.get('Referer');
	const { source, medium } = resolveReferralSource(referer);
	const sessionId = `${Math.floor(Date.now() / 1000)}`;

	const report = fetch(endpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			client_id: data.clientId,
			// MP fields, not headers: developers.google.com/analytics/devguides/collection/protocol/ga4/reference
			user_agent: event.request.headers.get('User-Agent') ?? undefined,
			ip_override: data.clientIP ?? undefined,
			user_location: geo?.country
				? {
						country_id: geo.country,
						region_id: geo.regionCode ? `${geo.country}-${geo.regionCode}` : undefined,
						city: geo.city
					}
				: undefined,
			events: [
				// Sets source/medium for this session; must precede social_redirect.
				{ name: 'campaign_details', params: { session_id: sessionId, source, medium } },
				{
					name: 'social_redirect',
					params: {
						session_id: sessionId,
						engagement_time_msec: 1,
						brand: data.brand,
						tld: data.tld,
						path: data.path,
						destination: data.target,
						page_location: event.url.toString(),
						page_referrer: referer ?? undefined,
						page_title: `Social Redirect · ${data.brand}.${data.tld}`
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

async function handleIPLookup(
	request: Request,
	url: URL,
	clientIP: string | null,
	fromCLI = false,
	easterEggMessage: string | null = null
): Promise<Response> {
	const headers = new Headers({
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': '*',
		'Cache-Control': 'no-cache',
		'Access-Control-Allow-Methods': 'GET, OPTIONS'
	});
	const query = extractQuery(url);
	const wantsJSON = /json/i.test(request.headers.get('Accept') ?? '');
	const protocol = clientIP?.includes(':') ? 'IPv6' : 'IPv4';

	const needsAbuse = query && /abuse/i.test(query);
	const needsWhois = query && /whois/i.test(query);
	const needsGeo = query && /geo/i.test(query);

	const [abuseData, whoisRaw, geoData] = await Promise.all([
		needsAbuse ? fetchAbuse(clientIP) : null,
		needsWhois ? fetchWhois(clientIP) : null,
		needsGeo ? fetchGeo(clientIP) : null
	]);

	const whoisData = whoisRaw ? parseWhois(whoisRaw) : null;

	if (wantsJSON) {
		return Response.json(
			{
				...(easterEggMessage && {
					$comment: easterEggMessage.replaceAll('# ', '').replaceAll('\n', ' ')
				}),
				ip: clientIP,
				protocol,
				...(abuseData && { abuse: abuseData }),
				...(whoisData && { whois: whoisData }),
				...(geoData && { geo: geoData })
			},
			{ headers: headers }
		);
	}

	const lines = [
		`IP:       ${clientIP}`,
		`Protocol: ${protocol}`,
		abuseData || whoisData || geoData ? '\r' : null,
		[
			abuseData ? formatAbuse(abuseData) : null,
			whoisData ? formatWhois(whoisRaw) : null,
			geoData ? formatGeo(geoData) : null,
			easterEggMessage
		]
			.filter(Boolean)
			.join('\n\n'),
		'\n'
	].filter(Boolean);

	headers.set('Content-Type', 'text/plain');

	return new Response(!fromCLI || query || easterEggMessage ? lines.join('\n') : clientIP, {
		status: 200,
		headers
	});
}

// ─── Fetch Helpers ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fetchAbuse(ip: string | null): Promise<any> {
	return fetch(`https://api.ipapi.is/?q=${ip}`).then((r) => r.json());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fetchWhois(ip: string | null): Promise<any> {
	return fetch(`https://wq.apnic.net/query?searchtext=${ip}`).then((r) => r.json());
}

function fetchGeo(ip: string | null): Promise<GeoData> {
	return fetch(`http://ip-api.com/json/${ip}?fields=${GEOIP_FIELDS.join(',')}`).then((r) =>
		r.json()
	);
}

// ─── Easter Egg Handler ──────────────────────────────────────────────────────

function checkEasterEggs(userAgent: string): string | null {
	for (const { reg, msg } of Object.values(easterEggs)) {
		if (reg.test(userAgent)) {
			return msg;
		}
	}
	return null;
}

// ─── Query Extraction ────────────────────────────────────────────────────────

function extractQuery({ pathname, search }: URL): string | null {
	if (search) return search;

	const pathMatch = pathname.match(/.*\/([\w@#?=+]+)$/);
	if (pathMatch) return pathMatch[1];

	return null;
}

// ─── Parsers ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseWhois(entries: any[]): Record<string, any> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const result: Record<string, any> = {};

	for (const entry of entries) {
		if (entry.type !== 'object') continue;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const obj: Record<string, any> = { _type: entry.objectType, _key: entry.primaryKey };

		for (const attr of entry.attributes) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const vals = attr.values ?? attr.links?.map((l: any) => l.text) ?? [];
			if (!vals.length) continue;

			if (attr.name in obj) {
				obj[attr.name] = [obj[attr.name]].flat().concat(vals);
			} else {
				obj[attr.name] = vals.length === 1 ? vals[0] : vals;
			}
		}

		result[entry.primaryKey] = obj;
	}

	return result;
}

// ─── Formatters ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatWhois(entries: any[]): string {
	const ATTR_PAD = 20;
	const lines = [SEPARATOR, '  WHOIS Report', SEPARATOR];

	for (const entry of entries) {
		if (entry.type === 'comments') {
			lines.push(...entry.comments);
			continue;
		}

		if (entry.type === 'object') {
			lines.push(DIVIDER, `  [${entry.objectType}]  ${entry.primaryKey}`, DIVIDER);

			for (const attr of entry.attributes) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const vals = attr.values ?? attr.links?.map((l: any) => l.text) ?? [];
				for (const val of vals) {
					lines.push(`${attr.name.padEnd(ATTR_PAD)} ${val}`);
				}
			}
		}
	}

	lines.push(SEPARATOR);
	return lines.join('\n');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatAbuse(data: any): string | null {
	if (!data) return null;

	const {
		ip,
		rir,
		is_bogon,
		is_mobile,
		is_satellite,
		is_crawler,
		is_datacenter,
		is_tor,
		is_proxy,
		is_vpn,
		is_abuser,
		company,
		abuse,
		asn,
		location,
		elapsed_ms
	} = data;

	const PAD = 24;
	const lines: string[] = [];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const row = (label: string, value: any) => {
		if (value == null || value === '') return;
		lines.push(`${(label + ':').padEnd(PAD)} ${value}`);
	};
	const bool = (v: unknown) => (v ? 'Yes' : 'No');
	const flag = (v: unknown) => (v ? 'YES' : 'No');
	const head = (title: string) => {
		lines.push(DIVIDER, `  ${title}`, DIVIDER);
	};

	lines.push(SEPARATOR, '  IP Intelligence Report', SEPARATOR);

	head('Identity');
	row('IP Address', ip);
	row('RIR', rir);
	row('Bogon', flag(is_bogon));
	row('Mobile', flag(is_mobile));
	row('Satellite', flag(is_satellite));
	row('Crawler', flag(is_crawler));
	row('Datacenter', flag(is_datacenter));
	row('Tor Exit Node', flag(is_tor));
	row('Proxy', flag(is_proxy));
	row('VPN', flag(is_vpn));
	row('Known Abuser', flag(is_abuser));

	if (company) {
		head('Company');
		row('Name', company.name);
		row('Abuse Score', company.abuser_score);
		row('Domain', company.domain);
		row('Type', company.type);
		row('Network', company.network);
		row('WHOIS', company.whois);
	}

	if (abuse) {
		head('Abuse Contact');
		row('Name', abuse.name);
		row('Address', abuse.address);
		row('Email', abuse.email);
		row('Phone', abuse.phone);
	}

	if (asn) {
		head('ASN');
		row('ASN', `AS${asn.asn}`);
		row('Abuse Score', asn.abuser_score);
		row('Route', asn.route);
		row('Description', asn.descr);
		row('Country', asn.country?.toUpperCase());
		row('Active', bool(asn.active));
		row('Organization', asn.org);
		row('Domain', asn.domain);
		row('Abuse Email', asn.abuse);
		row('Type', asn.type);
		row('Updated', asn.updated);
		row('RIR', asn.rir);
		row('WHOIS', asn.whois);
	}

	if (location) {
		head('Location');
		row('Country', `${location.country} (${location.country_code})`);
		row('State', location.state);
		row('City', location.city);
		row('Continent', location.continent);
		row('Coordinates', `${location.latitude}, ${location.longitude}`);
		row('ZIP', location.zip);
		row('Timezone', location.timezone);
		row('UTC Offset', location.utcoffset);
		row('DST', bool(location.is_dst));
		row('Local Time', location.local_time);
		row('Calling Code', `+${location.calling_code}`);
		row('Currency', location.currency_code);
		row('EU Member', bool(location.is_eu_member));
		row('Accuracy', location.accuracy);
	}

	lines.push(DIVIDER, `  Query completed in ${elapsed_ms} ms`, SEPARATOR);

	return lines.join('\n');
}

function formatGeo(data: GeoData): string | null {
	if (!data) return null;

	const PAD = 24;
	const lines: string[] = [];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const row = (label: string, value: any) => {
		if (value == null || value === '') return;
		lines.push(`${(label + ':').padEnd(PAD)} ${value}`);
	};
	const bool = (v: unknown) => (v ? 'Yes' : 'No');
	const head = (title: string) => {
		lines.push(DIVIDER, `  ${title}`, DIVIDER);
	};

	lines.push(SEPARATOR, '  GeoIP Report', SEPARATOR);

	head('Location');
	row('Status', data.status);
	row('Message', data.message);
	row('Continent', `${data.continent} (${data.continentCode})`);
	row('Country', `${data.country} (${data.countryCode})`);
	row('Region', `${data.region} (${data.regionName})`);
	row('City', data.city);
	row('District', data.district);
	row('ZIP', data.zip);
	row('Coordinates', `${data.lat}, ${data.lon}`);
	row('Timezone', data.timezone);
	row('UTC Offset', data.offset);

	head('Network');
	row('ISP', data.isp);
	row('Organization', data.org);
	row('AS', data.as);
	row('AS Name', data.asname);
	row('Mobile', bool(data.mobile));
	row('Proxy', bool(data.proxy));
	row('Hosting', bool(data.hosting));
	row('Query IP', data.query);

	lines.push(DIVIDER, `  Query completed`, SEPARATOR);

	return lines.join('\n');
}
