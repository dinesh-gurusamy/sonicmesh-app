import { toggleLikeSong } from '$lib/server/queries';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { songId } = await request.json();
		if (!songId) return json({ error: 'Missing songId' }, { status: 400 });
		const isLiked = await toggleLikeSong(songId, 'USR-001');
		return json({ success: true, songId, isLiked });
	} catch (error) {
		console.error('Error toggling song like:', error);
		return json({ error: 'Failed to toggle song like' }, { status: 500 });
	}
};
