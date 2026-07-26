import { describe, expect, test } from 'vitest';
import { authenticateOwner } from './owner-auth';

describe('authenticateOwner', () => {
	test('accepts the configured Bearer secret', () => {
		const request = new Request('http://localhost/api', {
			headers: { Authorization: 'Bearer owner-secret' }
		});

		expect(authenticateOwner(request, 'owner-secret')).toBeNull();
	});

	test('owns invalid authentication failures', async () => {
		const request = new Request('http://localhost/api', {
			headers: { Authorization: 'Bearer wrong' }
		});

		const response = authenticateOwner(request, 'owner-secret');

		expect(response?.status).toBe(401);
		expect(await response?.text()).toBe('Invalid Owner secret.');
	});

	test('fails explicitly when the server secret is absent', async () => {
		const response = authenticateOwner(new Request('http://localhost/api'), undefined);

		expect(response?.status).toBe(500);
		expect(await response?.text()).toBe('Server authentication is not configured.');
	});
});
