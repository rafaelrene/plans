import { uploadPlan, validateOwnerSecret } from './client';
import { loadCredential, saveCredential } from './credentials';
import { CliError } from './errors';
import { promptOwnerSecret } from './prompt';

const HELP = `Usage:
  plans login
  plans upload <file.html>`;

export type CommandDependencies = {
	promptSecret: () => Promise<string>;
	validateSecret: (secret: string) => Promise<void>;
	saveSecret: (secret: string) => Promise<void>;
	loadSecret: () => Promise<string>;
	upload: (filePath: string, secret: string) => Promise<string>;
	writeOut: (text: string) => void;
};

const defaultDependencies: CommandDependencies = {
	promptSecret: promptOwnerSecret,
	validateSecret: validateOwnerSecret,
	saveSecret: saveCredential,
	loadSecret: loadCredential,
	upload: uploadPlan,
	writeOut: (text) => process.stdout.write(text)
};

export async function runCommand(
	args: string[],
	dependencies: CommandDependencies = defaultDependencies
): Promise<void> {
	if (args.length === 1 && args[0] === '--help') {
		dependencies.writeOut(`${HELP}\n`);
		return;
	}

	if (args.length === 1 && args[0] === 'login') {
		const secret = await dependencies.promptSecret();
		await dependencies.validateSecret(secret);
		await dependencies.saveSecret(secret);
		dependencies.writeOut('Logged in.\n');
		return;
	}

	if (args.length === 2 && args[0] === 'upload') {
		const secret = await dependencies.loadSecret();
		const shareLink = await dependencies.upload(args[1]!, secret);
		dependencies.writeOut(`${shareLink}\n`);
		return;
	}

	throw new CliError(`Invalid usage.\n\n${HELP}`);
}
