import { searchEntities } from '$lib/server/queries';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const queryParam = url.searchParams.get('q') || '';

	if (!queryParam.trim()) {
		return json({ songs: [], artists: [], composers: [] });
	}

	try {
		const searchResults = await searchEntities(queryParam);
		return json(searchResults);
	} catch (err) {
		console.error('Error executing search API query:', err);
		return json({ songs: [], artists: [], composers: [] });
	}
};
