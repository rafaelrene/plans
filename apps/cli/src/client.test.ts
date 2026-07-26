import { afterEach, expect, test } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { uploadPlan, validateOwnerSecret } from './client';

const temporaryDirectories: string[] = [];

afterEach(async () => {
	await Promise.all(
		temporaryDirectories
			.splice(0)
			.map((directory) => rm(directory, { recursive: true, force: true }))
	);
});

test('validates the Owner secret with Bearer authentication', async () => {
	const captured = { authorization: '' };
	const fetchRequest = (async (_input: RequestInfo | URL, init?: RequestInit) => {
		captured.authorization = new Headers(init?.headers).get('authorization') ?? '';
		return new Response(null, { status: 204 });
	}) as typeof fetch;

	await validateOwnerSecret('owner-secret', fetchRequest);

	expect(captured.authorization).toBe('Bearer owner-secret');
});

test('uploads raw HTML and returns the absolute Location', async () => {
	const temporaryDirectory = await mkdtemp(join(tmpdir(), 'plans-cli-'));
	temporaryDirectories.push(temporaryDirectory);
	const filePath = join(temporaryDirectory, 'plan.html');
	await writeFile(filePath, '<title>Plan</title>');

	let requestBody = '';
	const fetchRequest = (async (_input: RequestInfo | URL, init?: RequestInit) => {
		requestBody = new TextDecoder().decode(init?.body as ArrayBuffer);
		return new Response(null, {
			status: 201,
			headers: { Location: 'https://plans.example/p/id' }
		});
	}) as typeof fetch;

	const shareLink = await uploadPlan(filePath, 'owner-secret', fetchRequest);

	expect(requestBody).toBe('<title>Plan</title>');
	expect(shareLink).toBe('https://plans.example/p/id');
});

test('rejects non-HTML paths before making a request', async () => {
	const fetchRequest = (() => {
		throw new Error('Fetch must not be called.');
	}) as unknown as typeof fetch;

	expect(uploadPlan('plan.txt', 'owner-secret', fetchRequest)).rejects.toThrow(
		'Plan must be an .html file.'
	);
});
