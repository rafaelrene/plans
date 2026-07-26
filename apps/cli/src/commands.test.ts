import { describe, expect, test } from 'bun:test';
import { runCommand, type CommandDependencies } from './commands';

function dependencies(
	overrides: Partial<CommandDependencies> = {}
): CommandDependencies & { output: string[] } {
	const output: string[] = [];
	return {
		output,
		promptSecret: async () => 'owner-secret',
		validateSecret: async () => undefined,
		saveSecret: async () => undefined,
		loadSecret: async () => 'owner-secret',
		upload: async () => 'https://plans.example/p/id',
		writeOut: (text) => output.push(text),
		...overrides
	};
}

describe('login', () => {
	test('validates before replacing the saved credential', async () => {
		const calls: string[] = [];
		const commandDependencies = dependencies({
			validateSecret: async () => {
				calls.push('validate');
			},
			saveSecret: async () => {
				calls.push('save');
			}
		});

		await runCommand(['login'], commandDependencies);

		expect(calls).toEqual(['validate', 'save']);
		expect(commandDependencies.output).toEqual(['Logged in.\n']);
	});

	test('does not save an invalid credential', async () => {
		let saved = false;
		const commandDependencies = dependencies({
			validateSecret: async () => {
				throw new Error('Invalid Owner secret.');
			},
			saveSecret: async () => {
				saved = true;
			}
		});

		expect(runCommand(['login'], commandDependencies)).rejects.toThrow('Invalid Owner secret.');
		expect(saved).toBe(false);
	});
});

test('prints only the Share Link after upload', async () => {
	const commandDependencies = dependencies();

	await runCommand(['upload', 'plan.html'], commandDependencies);

	expect(commandDependencies.output).toEqual(['https://plans.example/p/id\n']);
});

test('rejects commands outside the two-command surface', () => {
	const commandDependencies = dependencies();

	expect(runCommand(['delete', 'id'], commandDependencies)).rejects.toThrow('Invalid usage.');
});
