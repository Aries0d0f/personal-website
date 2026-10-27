// Single source of truth for page order (nav menu and scroll/swipe).
export const pageOrder = [
	'blank',
	'home',
	'experience',
	'community',
	'skill',
	'blank-after'
] as const;

export type PageKey = (typeof pageOrder)[number];

/** Path for `resolve()` from `$app/paths`, which takes pathnames without a leading `/`. */
export function pagePath(key: PageKey, locale: string): string {
	return key === 'home' ? locale : `${locale}/${key}`;
}

/** Pathname as it appears in `page.url.pathname`. */
export function pageHref(key: PageKey, locale: string): `/${string}` {
	return `/${pagePath(key, locale)}`;
}

export function pageKeyFromHref(href: string): PageKey | undefined {
	const parts = href.split('/').filter(Boolean);
	if (parts.length === 0) return 'home';
	if (parts.length === 2) return parts[1] as PageKey;
	return undefined;
}
