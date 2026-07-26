import { describe, expect, test, vi } from 'vitest';
import { MAX_PLAN_BYTES, planFromPathname } from '#lib/server/plan';
import { createUploadHandler } from '#lib/server/upload';

const id = '010255db-9e6f-4cb3-9274-77560a32ee5e';

function request(body: BodyInit, options: { secret?: string; contentType?: string } = {}): Request {
	const headers = new Headers({
		Authorization: `Bearer ${options.secret ?? 'owner-secret'}`,
		'Content-Type': options.contentType ?? 'text/html; charset=utf-8'
	});
	return new Request('http://localhost:5173/api/plans', {
		method: 'POST',
		headers,
		body
	});
}

function handler(
	storePlan = vi.fn(async (pathname: string, body: ArrayBuffer): Promise<void> => {
		void pathname;
		void body;
	})
) {
	return {
		storePlan,
		handle: createUploadHandler({
			ownerSecret: () => 'owner-secret',
			createId: () => id,
			storePlan,
			reportError: vi.fn()
		})
	};
}

describe('POST /api/plans', () => {
	test('stores raw HTML and returns the absolute Share Link', async () => {
		const upload = handler();
		const html = '<!doctype html><title>Deployment plan</title>';

		const response = await upload.handle(request(html));

		expect(response.status).toBe(201);
		expect(response.headers.get('location')).toBe(`http://localhost:5173/p/${id}`);
		expect(upload.storePlan).toHaveBeenCalledOnce();
		const [pathname, body] = upload.storePlan.mock.calls[0]!;
		expect(planFromPathname(pathname)).toEqual({ id, title: 'Deployment plan' });
		expect(new TextDecoder().decode(body)).toBe(html);
	});

	test('rejects invalid authentication before reading or storing content', async () => {
		const upload = handler();

		const response = await upload.handle(request('<title>Plan</title>', { secret: 'wrong' }));

		expect(response.status).toBe(401);
		expect(await response.text()).toBe('Invalid Owner secret.');
		expect(upload.storePlan).not.toHaveBeenCalled();
	});

	test('rejects missing titles with an owned error', async () => {
		const upload = handler();

		const response = await upload.handle(request('<main>Plan</main>'));

		expect(response.status).toBe(400);
		expect(await response.text()).toBe('Plan must contain a non-empty <title>.');
		expect(upload.storePlan).not.toHaveBeenCalled();
	});

	test('requires the raw HTML media type', async () => {
		const upload = handler();

		const response = await upload.handle(
			request('<title>Plan</title>', { contentType: 'application/json' })
		);

		expect(response.status).toBe(415);
		expect(await response.text()).toBe('Expected text/html.');
		expect(upload.storePlan).not.toHaveBeenCalled();
	});

	test('rejects content larger than 4 MiB before reading it', async () => {
		const upload = handler();
		const uploadRequest = request('<title>Plan</title>');
		uploadRequest.headers.set('Content-Length', String(MAX_PLAN_BYTES + 1));

		const response = await upload.handle(uploadRequest);

		expect(response.status).toBe(413);
		expect(await response.text()).toBe('Plan exceeds 4 MiB.');
		expect(upload.storePlan).not.toHaveBeenCalled();
	});
});
