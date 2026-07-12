import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// content/ lives at the project root (outside src), so Vite's dev server
	// blocks dynamic imports into it by default. Whitelist it explicitly.
	server: {
		fs: { allow: ['./content'] },
		proxy: {
			'/ip': {
				target: 'https://aries0d0f.me/ip',
				changeOrigin: true
			}
		}
	},
	plugins: [
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			// URL is the source of truth: an explicit /ja/ or /zh-tw/ prefix always
			// wins, so localized links are shareable. preferredLanguage seeds
			// first-time visitors from their Accept-Language; baseLocale is the final
			// fallback. No cookie/localStorage — locale is never persisted, it is
			// derived from the URL (or the browser on an un-prefixed request).
			// Auto-redirect for the un-prefixed root lives in src/hooks.server.ts
			// (the url strategy alone never redirects `/`).
			strategy: ['url', 'preferredLanguage', 'baseLocale'],
			// Give every locale its own path prefix — including the base locale, so
			// /en, /ja and /zh-tw are symmetric (the default pattern would special-case
			// English to the bare root). The trailing `?` makes the path optional, so
			// both `/en` and `/en/foo` match (and fillPattern tolerates the absent
			// segment). The bare root `/` matches no localized pattern
			// (extractLocaleFromUrl → undefined); src/hooks.server.ts redirects it to
			// the visitor's preferred locale.
			urlPatterns: [
				{
					pattern: '/:path(.*)?',
					localized: [
						['en', '/en/:path(.*)?'],
						['ja', '/ja/:path(.*)?'],
						['zh-tw', '/zh-tw/:path(.*)?']
					]
				}
			]
		})
	]
});
