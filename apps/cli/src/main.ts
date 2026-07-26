import { runCommand } from './commands';

try {
	await runCommand(Bun.argv.slice(2));
} catch (error) {
	const message = error instanceof Error ? error.message : 'Unknown failure.';
	process.stderr.write(`Error: ${message}\n`);
	process.exitCode = 1;
}
