import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { credentialPath, loadCredential, saveCredential } from './credentials';

const temporaryDirectories: string[] = [];

afterEach(async () => {
	await Promise.all(
		temporaryDirectories
			.splice(0)
			.map((directory) => rm(directory, { recursive: true, force: true }))
	);
});

describe('credentialPath', () => {
	test('uses an absolute XDG state home', () => {
		expect(credentialPath({ XDG_STATE_HOME: '/state' }, '/home/rene')).toBe(
			'/state/plans/credentials'
		);
	});

	test('ignores a relative XDG state home', () => {
		expect(credentialPath({ XDG_STATE_HOME: 'state' }, '/home/rene')).toBe(
			'/home/rene/.local/state/plans/credentials'
		);
	});
});

test('saves and replaces a permission-protected credential', async () => {
	const temporaryDirectory = await mkdtemp(join(tmpdir(), 'plans-cli-'));
	temporaryDirectories.push(temporaryDirectory);
	const filePath = join(temporaryDirectory, 'state', 'plans', 'credentials');

	await saveCredential('first', filePath);
	await saveCredential('second', filePath);

	expect(await loadCredential(filePath)).toBe('second');
	expect((await stat(join(temporaryDirectory, 'state', 'plans'))).mode & 0o777).toBe(0o700);
	expect((await stat(filePath)).mode & 0o777).toBe(0o600);
});

test('owns the missing-login error', async () => {
	const temporaryDirectory = await mkdtemp(join(tmpdir(), 'plans-cli-'));
	temporaryDirectories.push(temporaryDirectory);

	expect(loadCredential(join(temporaryDirectory, 'missing'))).rejects.toThrow(
		'Not logged in. Run `plans login`.'
	);
});
