import { describe, expect, test } from 'vitest';
import { extractPlanTitle, planFromPathname, planPathname, PlanValidationError } from './plan';

const id = '010255db-9e6f-4cb3-9274-77560a32ee5e';

describe('extractPlanTitle', () => {
	test('parses HTML entities and normalizes title whitespace', () => {
		expect(
			extractPlanTitle(`<!doctype html><title> Migration &amp;   rollout
 plan </title>`)
		).toBe('Migration & rollout plan');
	});

	test('rejects a missing or empty title', () => {
		expect(() => extractPlanTitle('<main>Untitled</main>')).toThrow(PlanValidationError);
		expect(() => extractPlanTitle('<title>   </title>')).toThrow(
			'Plan must contain a non-empty <title>.'
		);
	});
});

test('encodes and decodes the exact title through the Blob pathname', () => {
	const pathname = planPathname(id, 'Časový plán / Q3');

	expect(planFromPathname(pathname)).toEqual({ id, title: 'Časový plán / Q3' });
});

test('rejects titles that exceed the Blob pathname limit', () => {
	expect(() => planPathname(id, 'x'.repeat(700))).toThrow('Plan title is too long.');
});
