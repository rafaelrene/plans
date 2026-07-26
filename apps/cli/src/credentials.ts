import { chmod, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { CliError } from './errors';

export function credentialPath(
	environment: NodeJS.ProcessEnv = process.env,
	userHome: string = homedir()
): string {
	const configuredStateHome = environment.XDG_STATE_HOME;
	const stateHome =
		configuredStateHome && isAbsolute(configuredStateHome)
			? configuredStateHome
			: join(userHome, '.local', 'state');

	return join(stateHome, 'plans', 'credentials');
}

export async function loadCredential(filePath: string = credentialPath()): Promise<string> {
	try {
		const secret = await readFile(filePath, 'utf8');
		if (secret.length === 0) {
			throw new CliError('Saved Owner secret is empty. Run `plans login`.');
		}
		return secret;
	} catch (error) {
		if (error instanceof CliError) {
			throw error;
		}
		if (isFileSystemError(error) && error.code === 'ENOENT') {
			throw new CliError('Not logged in. Run `plans login`.', { cause: error });
		}
		throw new CliError('Could not read the saved Owner secret.', { cause: error });
	}
}

export async function saveCredential(
	secret: string,
	filePath: string = credentialPath()
): Promise<void> {
	if (secret.length === 0) {
		throw new CliError('Owner secret cannot be empty.');
	}

	const directory = dirname(filePath);
	const temporaryPath = `${filePath}.${randomUUID()}.tmp`;

	try {
		await mkdir(directory, { recursive: true, mode: 0o700 });
		await chmod(directory, 0o700);
		await writeFile(temporaryPath, secret, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
		await rename(temporaryPath, filePath);
		await chmod(filePath, 0o600);
	} catch (error) {
		const cleanupError = await removeTemporaryFile(temporaryPath);
		const cause = cleanupError ? new AggregateError([error, cleanupError]) : error;
		throw new CliError('Could not save the Owner secret.', { cause });
	}
}

async function removeTemporaryFile(filePath: string): Promise<unknown | null> {
	try {
		await unlink(filePath);
		return null;
	} catch (error) {
		return isFileSystemError(error) && error.code === 'ENOENT' ? null : error;
	}
}

function isFileSystemError(error: unknown): error is NodeJS.ErrnoException {
	return error instanceof Error && 'code' in error;
}
