import { getFeaturedSongs, searchEntities } from '$lib/server/queries';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const queryParam = url.searchParams.get('q') || '';
	if (queryParam.trim()) {
		const searchResults = await searchEntities(queryParam);
		return json({ type: 'search', results: searchResults });
	}

	const songs = await getFeaturedSongs(12);
	return json({ type: 'featured', songs });
};
