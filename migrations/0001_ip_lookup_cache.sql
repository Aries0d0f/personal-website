-- Upstream IP lookup responses, keyed by source + IP; expiry derives from TTL.
CREATE TABLE IF NOT EXISTS ip_lookup_cache (
	source TEXT NOT NULL,
	ip TEXT NOT NULL,
	payload TEXT NOT NULL,
	created_at INTEGER NOT NULL,
	PRIMARY KEY (source, ip)
);

CREATE INDEX IF NOT EXISTS idx_ip_lookup_cache_created_at ON ip_lookup_cache (created_at);
