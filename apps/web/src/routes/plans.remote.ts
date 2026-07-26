import { dev } from '$app/env';
import { PLANS_OWNER_SECRET } from '$app/env/private';
import { form, getRequestEvent, query } from '$app/server';
import { error, invalid, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { isOwnerSession, OWNER_SESSION_COOKIE, ownerSecretsMatch } from '#lib/server/owner-auth';
import { listPlanSummaries, loadPlanView as loadStoredPlanView } from '#lib/server/plan-store';

const loginSchema = v.object({
	_secret: v.pipe(v.string(), v.nonEmpty('Owner secret is required.'))
});

export const getPlanView = query(v.string(), async (id) => {
	return loadStoredPlanView(id, currentRequestIsOwner());
});

export const getOwnerHome = query(async () => {
	if (!currentRequestIsOwner()) {
		redirect(307, '/login');
	}

	const plans = await listPlanSummaries();
	const latestPlan = plans[0];
	if (latestPlan) {
		redirect(307, `/p/${latestPlan.id}`);
	}

	return null;
});

export const loginOwner = form(loginSchema, ({ _secret }, issue) => {
	const configuredSecret = PLANS_OWNER_SECRET;
	if (!configuredSecret) {
		error(500, 'Server authentication is not configured.');
	}
	if (!ownerSecretsMatch(_secret, configuredSecret)) {
		invalid(issue._secret('Invalid Owner secret.'));
	}

	const { cookies } = getRequestEvent();
	cookies.set(OWNER_SESSION_COOKIE, _secret, {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: !dev
	});

	redirect(303, '/');
});

function currentRequestIsOwner(): boolean {
	const { cookies } = getRequestEvent();
	return isOwnerSession(cookies.get(OWNER_SESSION_COOKIE), PLANS_OWNER_SECRET);
}
