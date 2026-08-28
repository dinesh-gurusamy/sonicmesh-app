import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const startQuery = url.searchParams.get('from') || '';
	const endQuery = url.searchParams.get('to') || '';

	return {
		startQuery,
		endQuery
	};
};
