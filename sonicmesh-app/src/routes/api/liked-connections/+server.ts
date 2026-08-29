import { json } from '@sveltejs/kit';
import { getLikedSongsConnections } from '$lib/server/queries';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	try {
		const cookieRaw = cookies.get('sm_liked_songs');
		let cookieLikes: string[] | undefined = undefined;
		if (cookieRaw) {
			try {
				cookieLikes = JSON.parse(cookieRaw);
			} catch (_) {}
		}

		const payload = await getLikedSongsConnections('USR-001', cookieLikes);
		return json(payload);
	} catch (error) {
		console.error('API /api/liked-connections error:', error);
		return json({ error: 'Failed to load liked songs connections' }, { status: 500 });
	}
};
