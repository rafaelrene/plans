import { redirect } from '@sveltejs/kit';

// Unauthenticated entry point lands on login.
export const load = () => {
	redirect(307, '/login');
};
