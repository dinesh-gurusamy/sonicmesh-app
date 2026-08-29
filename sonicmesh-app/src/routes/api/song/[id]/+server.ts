import { getSongDetail } from '$lib/server/queries';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, cookies }) => {
	const cookieRaw = cookies.get('sm_liked_songs');
	let cookieLikes: string[] | undefined = undefined;
	if (cookieRaw) {
		try {
			cookieLikes = JSON.parse(cookieRaw);
		} catch (_) {}
	}

	const song = await getSongDetail(params.id, 'USR-001', cookieLikes);
	if (!song) {
		throw error(404, 'Song node not found');
	}
	return json({ song });
};
