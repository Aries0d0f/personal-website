// Single source of truth for the page order so the nav menu and scroll/swipe
// navigation always stay in sync.
export const pageOrder = ['home', 'experience', 'community', 'skill'] as const;

export type PageKey = (typeof pageOrder)[number];

export function pageHref(key: PageKey, locale: string): `/${string}` {
	return key === 'home' ? `/${locale}` : `/${locale}/${key}`;
}
