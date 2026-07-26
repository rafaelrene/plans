import { readFile, stat } from 'node:fs/promises';
import { extname } from 'node:path';
import { MAX_PLAN_BYTES, PLANS_ORIGIN } from './constants';
import { CliError } from './errors';

type Fetch = typeof globalThis.fetch;

export async function validateOwnerSecret(
	secret: string,
	fetchRequest: Fetch = fetch
): Promise<void> {
	const response = await request(
		`${PLANS_ORIGIN}/api/auth`,
		{
			headers: { Authorization: `Bearer ${secret}` }
		},
		fetchRequest
	);

	if (response.status !== 204) {
		throw await apiError(response);
	}
}

export async function uploadPlan(
	filePath: string,
	secret: string,
	fetchRequest: Fetch = fetch
): Promise<string> {
	const bytes = await readPlan(filePath);
	const response = await request(
		`${PLANS_ORIGIN}/api/plans`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${secret}`,
				'Content-Type': 'text/html; charset=utf-8'
			},
			body: bytes
		},
		fetchRequest
	);

	if (response.status !== 201) {
		throw await apiError(response);
	}

	const location = response.headers.get('location');
	if (!location) {
		throw new CliError('Upload succeeded without returning a Share Link.');
	}

	try {
		const shareLink = new URL(location);
		if (shareLink.protocol !== 'http:' && shareLink.protocol !== 'https:') {
			throw new Error('Unsupported Share Link protocol.');
		}
		return shareLink.href;
	} catch (error) {
		throw new CliError('Upload returned an invalid Share Link.', { cause: error });
	}
}

async function readPlan(filePath: string): Promise<ArrayBuffer> {
	if (extname(filePath).toLowerCase() !== '.html') {
		throw new CliError('Plan must be an .html file.');
	}

	let file;
	try {
		file = await stat(filePath);
	} catch (error) {
		throw new CliError(`Could not read Plan: ${filePath}`, { cause: error });
	}

	if (!file.isFile()) {
		throw new CliError(`Plan is not a regular file: ${filePath}`);
	}
	if (file.size > MAX_PLAN_BYTES) {
		throw new CliError('Plan exceeds 4 MiB.');
	}

	try {
		const bytes = await readFile(filePath);
		if (bytes.byteLength > MAX_PLAN_BYTES) {
			throw new CliError('Plan exceeds 4 MiB.');
		}
		return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
	} catch (error) {
		if (error instanceof CliError) {
			throw error;
		}
		throw new CliError(`Could not read Plan: ${filePath}`, { cause: error });
	}
}

async function request(url: string, init: RequestInit, fetchRequest: Fetch): Promise<Response> {
	try {
		return await fetchRequest(url, init);
	} catch (error) {
		throw new CliError(`Could not reach Plans at ${PLANS_ORIGIN}.`, { cause: error });
	}
}

async function apiError(response: Response): Promise<CliError> {
	const message = (await response.text()).trim();
	return new CliError(message || `Plans returned ${response.status} ${response.statusText}.`);
}
