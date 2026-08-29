import { toggleLikeSong } from '$lib/server/queries';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	return {
		songId: params.id
	};
};

export const actions: Actions = {
	like: async ({ params, cookies }) => {
		const cookieRaw = cookies.get('sm_liked_songs');
		let currentLikes: string[] = [];
		if (cookieRaw) {
			try {
				currentLikes = JSON.parse(cookieRaw);
			} catch (_) {}
		}

		const result = await toggleLikeSong(params.id, 'USR-001', currentLikes);

		cookies.set('sm_liked_songs', JSON.stringify(result.allLikes), {
			path: '/',
			maxAge: 60 * 60 * 24 * 365,
			httpOnly: false,
			sameSite: 'lax'
		});

		return { success: true, isLiked: result.isLiked, allLikes: result.allLikes };
	}
};
