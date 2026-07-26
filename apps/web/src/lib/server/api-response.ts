export function textResponse(
	message: string,
	status: number,
	headers?: Record<string, string>
): Response {
	return new Response(message, {
		status,
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			...headers
		}
	});
}
