import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
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
			strategy: ['url', 'preferredLanguage', 'baseLocale']
		})
	]
});
