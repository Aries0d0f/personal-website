import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	GAME_SECRET: { schema: (input) => input ?? '' },
	GA4_MEASUREMENT_ID: { schema: (input) => input ?? '' },
	GA4_API_SECRET: { schema: (input) => input ?? '' },
	IPAPI_API_KEY: { schema: (input) => input ?? '' }
});
