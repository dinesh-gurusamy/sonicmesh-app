import { toggleLikeSong } from '$lib/server/queries';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const queryParam = url.searchParams.get('q') || '';
	return {
		searchQuery: queryParam
	};
};

export const actions: Actions = {
	toggleLike: async ({ request }) => {
		const formData = await request.formData();
		const songId = formData.get('songId')?.toString();
		if (!songId) return { success: false, error: 'Song ID is required' };

		const result = await toggleLikeSong(songId, 'USR-001');
		return { success: true, songId, isLiked: result.isLiked, allLikes: result.allLikes };
	}
};
