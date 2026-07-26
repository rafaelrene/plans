import { get, list } from '@vercel/blob';
import { BLOB_STORE_ID } from '$app/env/private';
import type { PlanSummary } from '#lib/plan';
import { isPlanId, MAX_PLAN_BYTES, planFromPathname } from './plan';

type BlobPlan = {
	pathname: string;
	uploadedAt: Date;
};

type BlobListResult = {
	blobs: BlobPlan[];
	cursor?: string;
	hasMore: boolean;
};

type PlanStoreDependencies = {
	listBlobs: (options: {
		prefix: string;
		limit?: number;
		cursor?: string;
	}) => Promise<BlobListResult>;
	readBlob: (pathname: string) => Promise<Response | null>;
};

type StoredPlan = PlanSummary & {
	pathname: string;
};

type LoadedPlan = PlanSummary & { html: string };

export type PlanView =
	| {
			owner: true;
			plan: LoadedPlan | null;
			plans: PlanSummary[];
	  }
	| {
			owner: false;
			plan: LoadedPlan | null;
			plans: null;
	  };

const defaultDependencies: PlanStoreDependencies = {
	listBlobs: (options) =>
		list({
			...options,
			storeId: BLOB_STORE_ID
		}),
	readBlob: async (pathname) => {
		const result = await get(pathname, {
			access: 'private',
			storeId: BLOB_STORE_ID
		});
		if (!result) {
			return null;
		}
		if (result.statusCode !== 200) {
			throw new Error(`Blob storage returned unexpected status ${result.statusCode}.`);
		}
		return new Response(result.stream, {
			headers: { 'content-length': String(result.blob.size) }
		});
	}
};

export async function loadPlanView(
	id: string,
	owner: boolean,
	dependencies: PlanStoreDependencies = defaultDependencies
): Promise<PlanView> {
	if (owner) {
		const storedPlans = await listStoredPlans(dependencies);
		const selected = storedPlans.find((plan) => plan.id === id) ?? null;

		return {
			owner: true,
			plan: selected ? await loadPlan(selected, dependencies) : null,
			plans: storedPlans.map(toSummary)
		};
	}

	const selected = isPlanId(id) ? await findStoredPlan(id, dependencies) : null;
	return {
		owner: false,
		plan: selected ? await loadPlan(selected, dependencies) : null,
		plans: null
	};
}

export async function listPlanSummaries(
	dependencies: PlanStoreDependencies = defaultDependencies
): Promise<PlanSummary[]> {
	return (await listStoredPlans(dependencies)).map(toSummary);
}

async function findStoredPlan(
	id: string,
	dependencies: PlanStoreDependencies
): Promise<StoredPlan | null> {
	const result = await dependencies.listBlobs({
		prefix: `plans/${id}/`,
		limit: 2
	});

	if (result.hasMore || result.blobs.length > 1) {
		throw new Error(`Blob storage contains multiple Plans with id "${id}".`);
	}

	const blob = result.blobs[0];
	return blob ? storedPlanFromBlob(blob) : null;
}

async function listStoredPlans(dependencies: PlanStoreDependencies): Promise<StoredPlan[]> {
	const blobs: BlobPlan[] = [];
	let cursor: string | undefined;

	do {
		const result = await dependencies.listBlobs({
			prefix: 'plans/',
			limit: 1000,
			cursor
		});
		blobs.push(...result.blobs);

		if (result.hasMore && !result.cursor) {
			throw new Error('Blob storage pagination did not provide a cursor.');
		}
		cursor = result.hasMore ? result.cursor : undefined;
	} while (cursor);

	const plans = blobs.map(storedPlanFromBlob);
	const ids = new Set<string>();
	for (const plan of plans) {
		if (ids.has(plan.id)) {
			throw new Error(`Blob storage contains multiple Plans with id "${plan.id}".`);
		}
		ids.add(plan.id);
	}

	return plans.sort(
		(a, b) =>
			new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime() ||
			a.id.localeCompare(b.id)
	);
}

function storedPlanFromBlob(blob: BlobPlan): StoredPlan {
	const plan = planFromPathname(blob.pathname);
	if (!plan) {
		throw new Error(`Blob storage contains an invalid Plan pathname: "${blob.pathname}".`);
	}

	return {
		...plan,
		uploadedAt: blob.uploadedAt.toISOString(),
		pathname: blob.pathname
	};
}

async function loadPlan(
	plan: StoredPlan,
	dependencies: PlanStoreDependencies
): Promise<PlanSummary & { html: string }> {
	let response: Response | null;
	try {
		response = await dependencies.readBlob(plan.pathname);
	} catch (error) {
		throw new Error(`Could not read Plan "${plan.id}" from Blob storage.`, { cause: error });
	}
	if (!response) {
		throw new Error(`Could not read Plan "${plan.id}" from Blob storage.`);
	}

	const contentLength = response.headers.get('content-length');
	if (contentLength && Number(contentLength) > MAX_PLAN_BYTES) {
		throw new Error(`Stored Plan "${plan.id}" exceeds 4 MiB.`);
	}

	const body = await response.arrayBuffer();
	if (body.byteLength > MAX_PLAN_BYTES) {
		throw new Error(`Stored Plan "${plan.id}" exceeds 4 MiB.`);
	}

	let html: string;
	try {
		html = new TextDecoder('utf-8', { fatal: true }).decode(body);
	} catch {
		throw new Error(`Stored Plan "${plan.id}" is not valid UTF-8.`);
	}

	return { ...toSummary(plan), html };
}

function toSummary(plan: StoredPlan): PlanSummary {
	return {
		id: plan.id,
		title: plan.title,
		uploadedAt: plan.uploadedAt
	};
}
