import { createHash, timingSafeEqual } from 'node:crypto';
import { textResponse } from './api-response';

export function authenticateOwner(
	request: Request,
	configuredSecret: string | undefined
): Response | null {
	if (!configuredSecret) {
		return textResponse('Server authentication is not configured.', 500);
	}

	const authorization = request.headers.get('authorization');
	const match = authorization?.match(/^Bearer (.+)$/i);
	const suppliedSecret = match?.[1];

	if (!suppliedSecret || !secretsMatch(suppliedSecret, configuredSecret)) {
		return textResponse('Invalid Owner secret.', 401, {
			'WWW-Authenticate': 'Bearer'
		});
	}

	return null;
}

function secretsMatch(supplied: string, configured: string): boolean {
	const suppliedDigest = createHash('sha256').update(supplied).digest();
	const configuredDigest = createHash('sha256').update(configured).digest();
	return timingSafeEqual(suppliedDigest, configuredDigest);
}
