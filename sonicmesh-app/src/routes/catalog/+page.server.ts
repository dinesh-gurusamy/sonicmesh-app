import { toggleLikeSong } from '$lib/server/queries';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const queryParam = url.searchParams.get('q') || '';
	return {
		searchQuery: queryParam
	};
};

export const actions: Actions = {
	toggleLike: async ({ request, cookies }) => {
		const formData = await request.formData();
		const songId = formData.get('songId')?.toString();
		if (!songId) return { success: false, error: 'Song ID is required' };

		const cookieRaw = cookies.get('sm_liked_songs');
		let currentLikes: string[] = [];
		if (cookieRaw) {
			try {
				currentLikes = JSON.parse(cookieRaw);
			} catch (_) {}
		}

		const result = await toggleLikeSong(songId, 'USR-001', currentLikes);

		cookies.set('sm_liked_songs', JSON.stringify(result.allLikes), {
			path: '/',
			maxAge: 60 * 60 * 24 * 365,
			httpOnly: false,
			sameSite: 'lax'
		});

		return { success: true, songId, isLiked: result.isLiked, allLikes: result.allLikes };
	}
};
