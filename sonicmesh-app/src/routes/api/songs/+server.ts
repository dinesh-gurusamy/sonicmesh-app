import { getFeaturedSongs, searchEntities } from '$lib/server/queries';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const queryParam = url.searchParams.get('q') || '';
	const limitParam = Number(url.searchParams.get('limit') || 50);

	if (queryParam.trim()) {
		const searchResults = await searchEntities(queryParam);
		return json({ type: 'search', results: searchResults });
	}

	const cookieRaw = cookies.get('sm_liked_songs');
	let cookieLikes: string[] | undefined = undefined;
	if (cookieRaw) {
		try {
			cookieLikes = JSON.parse(cookieRaw);
		} catch (_) {}
	}

	const songs = await getFeaturedSongs('USR-001', limitParam, cookieLikes);
	return json({ type: 'featured', songs });
};
