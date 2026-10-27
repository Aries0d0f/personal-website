// Client-side reactive locale backing Paraglide's getLocale().

import { browser } from '$app/env';
import {
	getLocaleForUrl,
	getTextDirection,
	overwriteGetLocale,
	type Locale
} from '#lib/paraglide/runtime.js';

// Seed from the URL so the first hydration render matches the server.
let current = $state<Locale>(browser ? getLocaleForUrl(window.location.href) : 'en');

if (browser) {
	overwriteGetLocale(() => current);
}

/** Sync the reactive locale and `<html lang/dir>` to `url` on navigation. */
export function syncLocale(url: Pick<URL, 'href'>): void {
	const locale = getLocaleForUrl(url.href);
	current = locale;

	if (browser) {
		document.documentElement.lang = locale;
		document.documentElement.dir = getTextDirection(locale);
	}
}
