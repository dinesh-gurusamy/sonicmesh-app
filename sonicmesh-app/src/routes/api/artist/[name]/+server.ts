import { getArtistDetail } from '$lib/server/queries';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const data = await getArtistDetail(decodeURIComponent(params.name));
	return json(data);
};
