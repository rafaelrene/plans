import { defineEnvVars } from '@sveltejs/kit/env';
import { building } from '$app/env';
import * as v from 'valibot';

const requiredAtRuntime = building
	? v.optional(v.string())
	: v.pipe(v.string(), v.nonEmpty('Value is required.'));

export const variables = defineEnvVars({
	BLOB_STORE_ID: { schema: requiredAtRuntime },
	PLANS_OWNER_SECRET: { schema: requiredAtRuntime }
});
