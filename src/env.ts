import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	NODE_ENV: { schema: (input) => input },
	RATE_LIMIT_REDIS_URL: { schema: (input) => input },
	REDIS_URL: { schema: (input) => input },
	DATABASE_URL: { schema: (input) => input }
});
