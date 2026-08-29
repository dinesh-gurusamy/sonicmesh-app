import { getExplainableRecommendations } from '$lib/server/queries';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const userId = url.searchParams.get('userId') || 'USR-001';

	const cookieRaw = cookies.get('sm_liked_songs');
	let cookieLikes: string[] | undefined = undefined;
	if (cookieRaw) {
		try {
			cookieLikes = JSON.parse(cookieRaw);
		} catch (_) {}
	}

	const recommendations = await getExplainableRecommendations(userId, cookieLikes);
	return json(recommendations);
};
