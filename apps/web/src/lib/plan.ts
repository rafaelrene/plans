export type PlanSummary = {
	id: string;
	title: string;
	uploadedAt: string;
};

export function formatPlanDate(uploadedAt: string): string {
	return new Date(uploadedAt).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC'
	});
}
