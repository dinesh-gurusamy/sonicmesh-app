import { getExplainableRecommendations } from '$lib/server/queries';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const userId = url.searchParams.get('userId') || 'USR-001';
	const recommendations = await getExplainableRecommendations(userId);
	return json(recommendations);
};
