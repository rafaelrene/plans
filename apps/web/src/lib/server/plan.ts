import { Buffer } from 'node:buffer';
import { parse, type DefaultTreeAdapterMap } from 'parse5';

export const MAX_PLAN_BYTES = 4 * 1024 * 1024;
const MAX_BLOB_PATHNAME_LENGTH = 950;
const PLAN_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type HtmlNode = DefaultTreeAdapterMap['node'];
type HtmlElement = DefaultTreeAdapterMap['element'];

export class PlanValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'PlanValidationError';
	}
}

export function extractPlanTitle(html: string): string {
	const titleElement = findTitle(parse(html));
	const title = titleElement ? textContent(titleElement).replace(/\s+/gu, ' ').trim() : '';

	if (!title) {
		throw new PlanValidationError('Plan must contain a non-empty <title>.');
	}

	return title;
}

export function planPathname(id: string, title: string): string {
	const encodedTitle = Buffer.from(title, 'utf8').toString('base64url');
	const pathname = `plans/${id}/${encodedTitle}.html`;

	if (pathname.length > MAX_BLOB_PATHNAME_LENGTH) {
		throw new PlanValidationError('Plan title is too long.');
	}

	return pathname;
}

export function isPlanId(value: string): boolean {
	return PLAN_ID_PATTERN.test(value);
}

export function planFromPathname(pathname: string): { id: string; title: string } | null {
	const match = pathname.match(/^plans\/([^/]+)\/([A-Za-z0-9_-]+)\.html$/);
	if (!match) {
		return null;
	}

	const id = match[1]!;
	if (!isPlanId(id)) {
		return null;
	}

	const encodedTitle = match[2]!;
	const title = Buffer.from(encodedTitle, 'base64url').toString('utf8');
	if (!title || Buffer.from(title, 'utf8').toString('base64url') !== encodedTitle) {
		return null;
	}

	return { id, title };
}

function findTitle(node: HtmlNode): HtmlElement | null {
	if ('tagName' in node && node.tagName === 'title') {
		return node;
	}
	if (!('childNodes' in node)) {
		return null;
	}

	for (const child of node.childNodes) {
		const title = findTitle(child);
		if (title) {
			return title;
		}
	}

	return null;
}

function textContent(node: HtmlNode): string {
	if ('value' in node) {
		return node.value;
	}
	if (!('childNodes' in node)) {
		return '';
	}
	return node.childNodes.map(textContent).join('');
}
