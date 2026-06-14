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

// ─── Constants ───────────────────────────────────────────────────────────────

const SEPARATOR = '='.repeat(52);
const DIVIDER = '-'.repeat(52);
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
		return handleSocialRedirect(url);
	}

	if (isIPLookup(url, userAgent)) {
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
	return /^\/s\/(\w+)(\.\w+)?/.test(pathname);
}

function isIPLookup({ pathname, hostname }: URL, userAgent: string): boolean {
	return (
		pathname.startsWith('/ip') ||
		hostname === 'ip.aries0d0f.me' ||
		CLI_UA.test(userAgent) ||
		(/^\/(whois|abuse)?.?(whois|abuse)?$/.test(pathname) && !NATIVE_UA.test(userAgent))
	);
}

// ─── Route Handlers ──────────────────────────────────────────────────────────

function handleSocialRedirect({ pathname }: URL): Response {
	const [, atMark, brand, tld = '.com', path = ''] = pathname.match(/^\/s\/(@?)(\w+)(\.\w+)?(\/\w+)?/)!;
	return Response.redirect(`https://${brand}${tld}${path}/${atMark ? '@' : ''}aries0d0f`, 301);
}

async function handleIPLookup(
	request: Request,
	url: URL,
	clientIP: string | null,
	fromCLI = false,
	easterEggMessage: string | null = null
): Promise<Response> {
	const query = extractQuery(url);
	const wantsJSON = /json/i.test(request.headers.get('Accept') ?? '');
	const protocol = clientIP?.includes(':') ? 'IPv6' : 'IPv4';

	const needsAbuse = query && /abuse/i.test(query);
	const needsWhois = query && /whois/i.test(query);

	const [abuseData, whoisRaw] = await Promise.all([
		needsAbuse ? fetchAbuse(clientIP) : null,
		needsWhois ? fetchWhois(clientIP) : null
	]);

	const whoisData = whoisRaw ? parseWhois(whoisRaw) : null;

	if (wantsJSON) {
		return Response.json({
			...(easterEggMessage && {
				$comment: easterEggMessage.replaceAll('# ', '').replaceAll('\n', ' ')
			}),
			ip: clientIP,
			protocol,
			...(abuseData && { abuse: abuseData }),
			...(whoisData && { whois: whoisData })
		});
	}

	const lines = [
		`IP:       ${clientIP}`,
		`Protocol: ${protocol}`,
		abuseData || whoisData ? '\r' : null,
		abuseData ? formatAbuse(abuseData) : null,
		abuseData && whoisData ? '\r' : null,
		whoisData ? formatWhois(whoisRaw) : null,
		easterEggMessage ? `\n\n${easterEggMessage}` : '\n'
	].filter(Boolean);

	return new Response(!fromCLI || query || easterEggMessage ? lines.join('\n') : clientIP, {
		status: 200,
		headers: { 'Content-Type': 'text/plain' }
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
	const pathMatch = pathname.match(/.*\/([\w+]+)$/);
	if (pathMatch) return pathMatch[1];

	const params = new URLSearchParams(search);
	return params.get('q') ?? null;
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
