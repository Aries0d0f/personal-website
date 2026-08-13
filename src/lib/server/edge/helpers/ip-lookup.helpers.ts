// ─── IP Lookup ───────────────────────────────────────────────────────────────
//
// curl the site and you get your IP back, like ifconfig.me, with optional
// WHOIS / abuse intelligence and UA easter eggs.

import { CLI_UA, NATIVE_UA } from './user-agent.helpers';

const SEPARATOR = '='.repeat(52);
const DIVIDER = '-'.repeat(52);

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
