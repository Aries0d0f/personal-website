import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { handleEdge } from '$lib/server/edge';

// Ported Cloudflare Worker logic (social redirects + IP lookup). Runs first so
// it can short-circuit the request before routing/i18n; falls through to
// SvelteKit when it returns null.
const handleWorker: Handle = async ({ event, resolve }) => {
	const response = await handleEdge(event);
	if (response) return response;

	return resolve(event);
};

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html
					.replace('%paraglide.lang%', locale)
					.replace('%paraglide.dir%', getTextDirection(locale))
		});
	});

export const handle: Handle = sequence(handleWorker, handleParaglide);
