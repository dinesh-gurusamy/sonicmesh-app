import { getHomeStats } from '$lib/server/queries';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const stats = await getHomeStats();
	return json(stats);
};
