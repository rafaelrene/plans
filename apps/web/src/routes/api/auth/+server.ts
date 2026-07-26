import { authenticateOwner } from '#lib/server/owner-auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request }) => {
	const failure = authenticateOwner(request, process.env.PLANS_OWNER_SECRET);
	return failure ?? new Response(null, { status: 204 });
};
