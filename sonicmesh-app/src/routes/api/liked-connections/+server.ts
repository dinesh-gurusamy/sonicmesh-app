import { json } from '@sveltejs/kit';
import { getLikedSongsConnections } from '$lib/server/queries';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		const payload = await getLikedSongsConnections('USR-001');
		return json(payload);
	} catch (error) {
		console.error('API /api/liked-connections error:', error);
		return json({ error: 'Failed to load liked songs connections' }, { status: 500 });
	}
};
