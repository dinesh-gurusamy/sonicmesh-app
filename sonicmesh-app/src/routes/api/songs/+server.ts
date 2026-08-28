import { getFeaturedSongs, searchEntities } from '$lib/server/queries';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const queryParam = url.searchParams.get('q') || '';
	const limitParam = Number(url.searchParams.get('limit') || 50);

	if (queryParam.trim()) {
		const searchResults = await searchEntities(queryParam);
		return json({ type: 'search', results: searchResults });
	}

	const songs = await getFeaturedSongs('USR-001', limitParam);
	return json({ type: 'featured', songs });
};
