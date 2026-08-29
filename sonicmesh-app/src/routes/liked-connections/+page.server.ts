import type { PageServerLoad, Actions } from './$types';
import { toggleLikeSong } from '$lib/server/queries';

export const load: PageServerLoad = () => {
	return {};
};

export const actions: Actions = {
	toggleLike: async ({ request }) => {
		const formData = await request.formData();
		const songId = formData.get('songId')?.toString();
		if (!songId) return { success: false };

		const result = await toggleLikeSong(songId, 'USR-001');
		return { success: true, songId, isLiked: result.isLiked, allLikes: result.allLikes };
	}
};
