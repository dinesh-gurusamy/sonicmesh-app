import { seed } from '$lib/scripts/seed';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const queryParam = url.searchParams.get('q') || '';
	return {
		searchQuery: queryParam
	};
};

export const actions: Actions = {
	seedDb: async () => {
		try {
			await seed();
			return { success: true, message: 'Database successfully seeded with music graph nodes & typed relationships!' };
		} catch (err) {
			console.error('Error seeding DB action:', err);
			return { success: false, message: 'Failed to seed database: ' + (err as Error).message };
		}
	}
};