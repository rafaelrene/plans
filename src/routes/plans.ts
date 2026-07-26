/**
 * Throwaway mock plans for the scaffolding, co-located with the routes that use
 * it (the login redirect and the plan viewer). Replaced by Vercel Blob `list()`
 * once the real data path is wired — see ADR 0002.
 */

export type Plan = {
	/** Unguessable id — the tail of the Share Link `/p/<id>`. */
	id: string;
	title: string;
	/** ISO timestamp, mirrors Blob's `uploadedAt`. */
	uploadedAt: string;
};

export const plans: Plan[] = [
	{ id: 'kf8s0d2a', title: 'Q3 Platform Migration', uploadedAt: '2026-07-24T09:12:00Z' },
	{ id: '9zx1qp4m', title: 'Onboarding Redesign — Phase 2', uploadedAt: '2026-07-22T16:40:00Z' },
	{ id: 'a3v7bn0c', title: 'Incident Response Runbook', uploadedAt: '2026-07-19T11:05:00Z' },
	{ id: 'm2w5re8t', title: 'Billing Rework Rollout', uploadedAt: '2026-07-15T08:30:00Z' },
	{ id: 'p6l9ok1j', title: 'Search Infra Cost Reduction', uploadedAt: '2026-07-09T14:22:00Z' },
	{ id: 'c4h8gd7s', title: 'Mobile Offline Support', uploadedAt: '2026-06-30T10:00:00Z' }
];

export function findPlan(id: string): Plan | undefined {
	return plans.find((p) => p.id === id);
}

/** Most recently uploaded plan — the default landing target after login. */
export const latestPlan: Plan = plans.reduce((a, b) =>
	new Date(a.uploadedAt) >= new Date(b.uploadedAt) ? a : b
);

/** e.g. "Jul 24, 2026" */
export function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
}
