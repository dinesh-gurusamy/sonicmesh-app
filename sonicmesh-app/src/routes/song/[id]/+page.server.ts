import { toggleLikeSong } from '$lib/server/queries';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	return {
		songId: params.id
	};
};

export const actions: Actions = {
	like: async ({ params }) => {
		const isLiked = await toggleLikeSong(params.id, 'USR-001');
		return { success: true, isLiked };
	}
};
