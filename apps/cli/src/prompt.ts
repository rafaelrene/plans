import { CliError } from './errors';

export async function promptOwnerSecret(
	input: NodeJS.ReadStream = process.stdin,
	output: NodeJS.WriteStream = process.stderr
): Promise<string> {
	if (!input.isTTY || typeof input.setRawMode !== 'function') {
		throw new CliError('`plans login` requires an interactive terminal.');
	}

	output.write('Owner secret: ');
	const wasRaw = input.isRaw;
	input.setEncoding('utf8');
	input.setRawMode(true);

	return new Promise<string>((resolve, reject) => {
		let secret = '';
		let settled = false;

		const finish = (error?: CliError) => {
			if (settled) {
				return;
			}
			settled = true;
			input.off('data', onData);
			input.off('end', onEnd);
			input.off('error', onError);
			input.setRawMode(wasRaw);
			input.pause();
			output.write('\n');

			if (error) {
				reject(error);
			} else if (secret.length === 0) {
				reject(new CliError('Owner secret cannot be empty.'));
			} else {
				resolve(secret);
			}
		};

		const onData = (chunk: string | Buffer) => {
			for (const character of String(chunk)) {
				if (character === '\r' || character === '\n') {
					finish();
					return;
				}
				if (character === '\u0003' || character === '\u0004') {
					finish(new CliError('Login cancelled.'));
					return;
				}
				if (character === '\u007f' || character === '\b') {
					secret = Array.from(secret).slice(0, -1).join('');
					continue;
				}
				if (character >= ' ') {
					secret += character;
				}
			}
		};

		const onEnd = () => finish(new CliError('Login cancelled.'));
		const onError = (error: Error) =>
			finish(new CliError('Could not read the Owner secret.', { cause: error }));

		input.on('data', onData);
		input.once('end', onEnd);
		input.once('error', onError);
		input.resume();
	});
}
