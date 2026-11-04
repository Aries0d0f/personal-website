// ─── IP Lookup Cache ─────────────────────────────────────────────────────────
// D1-backed cache for successful upstream IP lookups.

import { env, waitUntil } from 'cloudflare:workers';

export type CacheSource = 'abuse' | 'whois' | 'geo';

const DEFAULT_TTL_SECS = 3600;

function getTTL(): number {
	const ttl = Number(env.IP_LOOKUP_CACHE_TTL);
	return Number.isFinite(ttl) && ttl > 0 ? ttl : DEFAULT_TTL_SECS;
}

function getDB(): D1Database | null {
	return env.IP_LOOKUP_DB ?? null;
}

export interface Cached<T> {
	data: T;
	cachedAt: number | null;
}

export async function withIPCache<T>(
	source: CacheSource,
	ip: string | null,
	fetcher: () => Promise<T>,
	isSuccess: (v: T) => boolean
): Promise<Cached<T>> {
	const db = getDB();
	if (!db || !ip) return { data: await fetcher(), cachedAt: null };

	const now = Math.floor(Date.now() / 1000);
	const cutoff = now - getTTL();

	try {
		const row = await db
			.prepare(
				'SELECT payload, created_at FROM ip_lookup_cache WHERE source = ? AND ip = ? AND created_at > ?'
			)
			.bind(source, ip, cutoff)
			.first<{ payload: string; created_at: number }>();
		if (row) return { data: JSON.parse(row.payload) as T, cachedAt: row.created_at };
	} catch (e) {
		console.error('[ip-cache] read failed', e);
	}

	const result = await fetcher();
	if (!isSuccess(result)) return { data: result, cachedAt: null };

	waitUntil(
		db
			.batch([
				db
					.prepare(
						`INSERT INTO ip_lookup_cache (source, ip, payload, created_at) VALUES (?, ?, ?, ?)
						ON CONFLICT (source, ip) DO UPDATE SET payload = excluded.payload, created_at = excluded.created_at`
					)
					.bind(source, ip, JSON.stringify(result), now),
				db.prepare('DELETE FROM ip_lookup_cache WHERE created_at <= ?').bind(cutoff)
			])
			.catch((e) => console.error('[ip-cache] write failed', e))
	);

	return { data: result, cachedAt: null };
}
