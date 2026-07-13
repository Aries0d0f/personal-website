// Single source of truth for the page order so the nav menu and scroll/swipe
// navigation always stay in sync.
export const pageOrder = ['home', 'experience', 'community', 'skill', 'blank'] as const;

export type PageKey = (typeof pageOrder)[number];

export function pageHref(key: PageKey, locale: string): `/${string}` {
	return key === 'home' ? `/${locale}` : `/${locale}/${key}`;
}

export function pageKeyFromHref(href: string): PageKey | undefined {
	const parts = href.split('/').filter(Boolean);
	if (parts.length === 0) return 'home';
	if (parts.length === 2) return parts[1] as PageKey;
	return undefined;
}
