// ─── IP Lookup ───────────────────────────────────────────────────────────────
//
// curl the site and you get your IP back, like ifconfig.me, with optional
// WHOIS / abuse intelligence and UA easter eggs.

import { bool, DIVIDER, flag, head, row, SEPARATOR } from './cui.helpers';
import { CLI_UA, NATIVE_UA } from './user-agent.helpers';

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

export function isIPLookup({ pathname, hostname }: URL, userAgent: string): boolean {
	return (
		pathname.startsWith('/ip') ||
		hostname === 'ip.aries0d0f.me' ||
		CLI_UA.test(userAgent) ||
		(/^\/(whois|abuse|geo).?(whois|abuse|geo)?$/.test(pathname) && !NATIVE_UA.test(userAgent))
	);
}

export async function handleIPLookup(
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

// ─── Query Extraction ────────────────────────────────────────────────────────

function extractQuery({ pathname, search }: URL): string | null {
	if (search) return search;

	const pathMatch = pathname.match(/.*\/([\w@#?=+]+)$/);
	if (pathMatch) return pathMatch[1];

	return null;
}

// ─── Parsers ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseWhois(entries: any[]): Record<string, any>[] {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const result: Record<string, any>[] = [];

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

		result.push(obj);
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
			head(lines, `[${entry.objectType}]  ${entry.primaryKey}`);

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

	const lines: string[] = [];

	lines.push(SEPARATOR, '  IP Intelligence Report', SEPARATOR);

	head(lines, 'Identity');
	row(lines, 'IP Address', ip);
	row(lines, 'RIR', rir);
	row(lines, 'Bogon', flag(is_bogon));
	row(lines, 'Mobile', flag(is_mobile));
	row(lines, 'Satellite', flag(is_satellite));
	row(lines, 'Crawler', flag(is_crawler));
	row(lines, 'Datacenter', flag(is_datacenter));
	row(lines, 'Tor Exit Node', flag(is_tor));
	row(lines, 'Proxy', flag(is_proxy));
	row(lines, 'VPN', flag(is_vpn));
	row(lines, 'Known Abuser', flag(is_abuser));

	if (company) {
		head(lines, 'Company');
		row(lines, 'Name', company.name);
		row(lines, 'Abuse Score', company.abuser_score);
		row(lines, 'Domain', company.domain);
		row(lines, 'Type', company.type);
		row(lines, 'Network', company.network);
		row(lines, 'WHOIS', company.whois);
	}

	if (abuse) {
		head(lines, 'Abuse Contact');
		row(lines, 'Name', abuse.name);
		row(lines, 'Address', abuse.address);
		row(lines, 'Email', abuse.email);
		row(lines, 'Phone', abuse.phone);
	}

	if (asn) {
		head(lines, 'ASN');
		row(lines, 'ASN', `AS${asn.asn}`);
		row(lines, 'Abuse Score', asn.abuser_score);
		row(lines, 'Route', asn.route);
		row(lines, 'Description', asn.descr);
		row(lines, 'Country', asn.country?.toUpperCase());
		row(lines, 'Active', bool(asn.active));
		row(lines, 'Organization', asn.org);
		row(lines, 'Domain', asn.domain);
		row(lines, 'Abuse Email', asn.abuse);
		row(lines, 'Type', asn.type);
		row(lines, 'Updated', asn.updated);
		row(lines, 'RIR', asn.rir);
		row(lines, 'WHOIS', asn.whois);
	}

	if (location) {
		head(lines, 'Location');
		row(lines, 'Country', `${location.country} (${location.country_code})`);
		row(lines, 'State', location.state);
		row(lines, 'City', location.city);
		row(lines, 'Continent', location.continent);
		row(lines, 'Coordinates', `${location.latitude}, ${location.longitude}`);
		row(lines, 'ZIP', location.zip);
		row(lines, 'Timezone', location.timezone);
		row(lines, 'UTC Offset', location.utcoffset);
		row(lines, 'DST', bool(location.is_dst));
		row(lines, 'Local Time', location.local_time);
		row(lines, 'Calling Code', `+${location.calling_code}`);
		row(lines, 'Currency', location.currency_code);
		row(lines, 'EU Member', bool(location.is_eu_member));
		row(lines, 'Accuracy', location.accuracy);
	}

	lines.push(
		DIVIDER,
		elapsed_ms == null ? '  Query completed' : `  Query completed in ${elapsed_ms} ms`,
		SEPARATOR
	);

	return lines.join('\n');
}

function formatGeo(data: GeoData): string | null {
	if (!data) return null;

	const lines: string[] = [];

	lines.push(SEPARATOR, '  GeoIP Report', SEPARATOR);

	head(lines, 'Location');
	row(lines, 'Status', data.status);
	row(lines, 'Message', data.message);
	row(lines, 'Continent', `${data.continent} (${data.continentCode})`);
	row(lines, 'Country', `${data.country} (${data.countryCode})`);
	row(lines, 'Region', `${data.region} (${data.regionName})`);
	row(lines, 'City', data.city);
	row(lines, 'District', data.district);
	row(lines, 'ZIP', data.zip);
	row(lines, 'Coordinates', `${data.lat}, ${data.lon}`);
	row(lines, 'Timezone', data.timezone);
	row(lines, 'UTC Offset', data.offset);

	head(lines, 'Network');
	row(lines, 'ISP', data.isp);
	row(lines, 'Organization', data.org);
	row(lines, 'AS', data.as);
	row(lines, 'AS Name', data.asname);
	row(lines, 'Mobile', bool(data.mobile));
	row(lines, 'Proxy', bool(data.proxy));
	row(lines, 'Hosting', bool(data.hosting));
	row(lines, 'Query IP', data.query);

	lines.push(DIVIDER, `  Query completed`, SEPARATOR);

	return lines.join('\n');
}
