import { describe, expect, test, vi } from 'vitest';
import { planPathname } from './plan';
import { loadPlanView } from './plan-store';

const currentId = '010255db-9e6f-4cb3-9274-77560a32ee5e';
const otherId = '208c2e7d-7b58-48ae-b891-9fe3f3b7143b';
const missingId = 'c481b786-4590-41b8-bbf1-f4d42adfa570';

function blob(id: string, title: string, uploadedAt: string) {
	return {
		pathname: planPathname(id, title),
		uploadedAt: new Date(uploadedAt),
		url: `https://example.public.blob.vercel-storage.com/${id}.html`
	};
}

describe('loadPlanView', () => {
	test('public visitors load only the requested Plan', async () => {
		const listBlobs = vi.fn(async () => ({
			blobs: [blob(currentId, 'Current Plan', '2026-07-26T10:00:00Z')],
			hasMore: false
		}));
		const fetchBlob = vi.fn(async () => new Response('<title>Current Plan</title>'));

		const view = await loadPlanView(currentId, false, { listBlobs, fetchBlob });

		expect(listBlobs).toHaveBeenCalledWith({
			prefix: `plans/${currentId}/`,
			limit: 2
		});
		expect(view).toEqual({
			owner: false,
			plan: {
				id: currentId,
				title: 'Current Plan',
				uploadedAt: '2026-07-26T10:00:00.000Z',
				html: '<title>Current Plan</title>'
			},
			plans: null
		});
	});

	test('the Owner receives every paginated Plan, newest first', async () => {
		const listBlobs = vi.fn(async ({ cursor }: { cursor?: string }) =>
			cursor
				? {
						blobs: [blob(currentId, 'Current Plan', '2026-07-26T10:00:00Z')],
						hasMore: false
					}
				: {
						blobs: [blob(otherId, 'Older Plan', '2026-07-20T10:00:00Z')],
						cursor: 'next-page',
						hasMore: true
					}
		);
		const fetchBlob = vi.fn(async () => new Response('<title>Current Plan</title>'));

		const view = await loadPlanView(currentId, true, { listBlobs, fetchBlob });

		expect(view.plans?.map((plan) => plan.id)).toEqual([currentId, otherId]);
		expect(view.plan?.html).toBe('<title>Current Plan</title>');
	});

	test('the Owner keeps the Plan list when the requested Plan is missing', async () => {
		const listBlobs = vi.fn(async () => ({
			blobs: [blob(otherId, 'Other Plan', '2026-07-20T10:00:00Z')],
			hasMore: false
		}));
		const fetchBlob = vi.fn();

		const view = await loadPlanView(missingId, true, { listBlobs, fetchBlob });

		expect(view.plan).toBeNull();
		expect(view.plans?.map((plan) => plan.id)).toEqual([otherId]);
		expect(fetchBlob).not.toHaveBeenCalled();
	});
});
