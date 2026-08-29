import { toggleLikeSong } from '$lib/server/queries';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { songId } = await request.json();
		if (!songId) return json({ error: 'Missing songId' }, { status: 400 });

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

		return json({
			success: true,
			songId,
			isLiked: result.isLiked,
			allLikes: result.allLikes
		});
	} catch (error) {
		console.error('Error toggling song like:', error);
		return json({ error: 'Failed to toggle song like' }, { status: 500 });
	}
};
