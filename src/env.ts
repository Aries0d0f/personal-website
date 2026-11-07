import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	GAME_SECRET: { schema: (input) => input ?? '' }
});
