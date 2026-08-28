import { json } from '@sveltejs/kit';
import { getLikedSongsConnections } from '$lib/server/queries';

export async function GET() {
	try {
		const payload = await getLikedSongsConnections('USR-001');
		return json(payload);
	} catch (error) {
		console.error('API /api/liked-connections error:', error);
		return json({ error: 'Failed to load liked songs connections' }, { status: 500 });
	}
}
