import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
import { textResponse } from './api-response';
import { authenticateOwner } from './owner-auth';
import { extractPlanTitle, MAX_PLAN_BYTES, planPathname, PlanValidationError } from './plan';

type UploadDependencies = {
	ownerSecret: () => string | undefined;
	createId: () => string;
	storePlan: (pathname: string, body: ArrayBuffer) => Promise<void>;
	reportError: (error: unknown) => void;
};

const defaultDependencies: UploadDependencies = {
	ownerSecret: () => process.env.PLANS_OWNER_SECRET,
	createId: randomUUID,
	storePlan: async (pathname, body) => {
		await put(pathname, body, {
			access: 'public',
			addRandomSuffix: false,
			allowOverwrite: false,
			contentType: 'text/html; charset=utf-8'
		});
	},
	reportError: (error) => console.error('Failed to store Plan.', error)
};

export function createUploadHandler(
	dependencies: UploadDependencies = defaultDependencies
): (request: Request) => Promise<Response> {
	return async (request) => {
		const authenticationFailure = authenticateOwner(request, dependencies.ownerSecret());
		if (authenticationFailure) {
			return authenticationFailure;
		}

		if (mediaType(request.headers.get('content-type')) !== 'text/html') {
			return textResponse('Expected text/html.', 415);
		}

		const contentLength = request.headers.get('content-length');
		if (contentLength && Number(contentLength) > MAX_PLAN_BYTES) {
			return textResponse('Plan exceeds 4 MiB.', 413);
		}

		let body: ArrayBuffer;
		try {
			body = await request.arrayBuffer();
		} catch {
			return textResponse('Could not read Plan.', 400);
		}

		if (body.byteLength > MAX_PLAN_BYTES) {
			return textResponse('Plan exceeds 4 MiB.', 413);
		}

		let html: string;
		try {
			html = new TextDecoder('utf-8', { fatal: true }).decode(body);
		} catch {
			return textResponse('Plan must be valid UTF-8.', 400);
		}
		if (!html.trim()) {
			return textResponse('Plan must not be empty.', 400);
		}

		const id = dependencies.createId();
		let pathname: string;
		try {
			pathname = planPathname(id, extractPlanTitle(html));
		} catch (error) {
			if (error instanceof PlanValidationError) {
				return textResponse(error.message, 400);
			}
			throw error;
		}

		try {
			await dependencies.storePlan(pathname, body);
		} catch (error) {
			dependencies.reportError(error);
			return textResponse('Failed to store Plan.', 500);
		}

		const shareLink = new URL(`/p/${id}`, request.url).href;
		return new Response(null, {
			status: 201,
			headers: { Location: shareLink }
		});
	};
}

function mediaType(contentType: string | null): string | null {
	return contentType?.split(';', 1)[0]?.trim().toLowerCase() ?? null;
}
