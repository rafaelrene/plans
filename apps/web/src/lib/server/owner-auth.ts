import { createHash, timingSafeEqual } from 'node:crypto';
import { textResponse } from './api-response';

export const OWNER_SESSION_COOKIE = 'plans_owner_secret';

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

	if (!suppliedSecret || !ownerSecretsMatch(suppliedSecret, configuredSecret)) {
		return textResponse('Invalid Owner secret.', 401, {
			'WWW-Authenticate': 'Bearer'
		});
	}

	return null;
}

export function isOwnerSession(
	suppliedSecret: string | undefined,
	configuredSecret: string | undefined
): boolean {
	return Boolean(
		suppliedSecret && configuredSecret && ownerSecretsMatch(suppliedSecret, configuredSecret)
	);
}

export function ownerSecretsMatch(supplied: string, configured: string): boolean {
	const suppliedDigest = createHash('sha256').update(supplied).digest();
	const configuredDigest = createHash('sha256').update(configured).digest();
	return timingSafeEqual(suppliedDigest, configuredDigest);
}
