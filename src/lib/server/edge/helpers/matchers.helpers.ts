// ─── Request Matchers ────────────────────────────────────────────────────────

import { CLI_UA, NATIVE_UA } from './user-agent.helpers';

export const SOCIAL_REDIRECT_PATTERN = /^\/s\/(@?)(\w+)(\.\w+)?(\/\w+)?/;

export function isSocialRedirect({ pathname }: URL): boolean {
	return SOCIAL_REDIRECT_PATTERN.test(pathname);
}

export function isIPLookup({ pathname, hostname }: URL, userAgent: string): boolean {
	return (
		pathname.startsWith('/ip') ||
		hostname === 'ip.aries0d0f.me' ||
		CLI_UA.test(userAgent) ||
		(/^\/(whois|abuse|geo).?(whois|abuse|geo)?$/.test(pathname) && !NATIVE_UA.test(userAgent))
	);
}
