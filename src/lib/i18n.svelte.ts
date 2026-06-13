// Client-side reactive locale.
//
// Paraglide messages resolve their text through `getLocale()`. On the server
// that reads per-request AsyncLocalStorage (set by paraglideMiddleware), which
// is correct and must stay untouched. On the client `getLocale()` normally
// reads `window.location` — a plain, non-reactive read, so messages never
// update when the URL changes via client-side navigation.
//
// To get SPA-style language switching (no full reload, no flash, no GSAP
// replay) we back `getLocale()` with a `$state` rune and overwrite it on the
// client only. Calling `syncLocale()` after each navigation updates that state,
// which transparently re-runs every `m.*()` call and the `<ParaglideMessage>`
// derivations in place.

import { browser } from '$app/environment';
import {
	getLocaleForUrl,
	getTextDirection,
	overwriteGetLocale,
	type Locale
} from '$lib/paraglide/runtime';

// Seed from the current URL at module load so the first hydration render matches
// what the server produced for this URL (avoids a hydration mismatch).
let current = $state<Locale>(browser ? getLocaleForUrl(window.location.href) : 'en');

if (browser) {
	overwriteGetLocale(() => current);
}

/**
 * Point the reactive locale at `url`. Call this on every client navigation
 * (e.g. from an `$effect` watching `page.url`). Also keeps the document's
 * `lang`/`dir` attributes in sync, since those are otherwise only set during
 * the server render.
 */
export function syncLocale(url: URL): void {
	const locale = getLocaleForUrl(url.href);
	current = locale;

	if (browser) {
		document.documentElement.lang = locale;
		document.documentElement.dir = getTextDirection(locale);
	}
}
