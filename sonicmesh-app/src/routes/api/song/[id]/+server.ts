import { getSongDetail } from '$lib/server/queries';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const song = await getSongDetail(params.id, 'USR-001');
	if (!song) {
		throw error(404, 'Song node not found in CognoDB');
	}
	return json({ song });
};
