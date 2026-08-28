import { findConnection } from '$lib/server/queries';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const startQuery = url.searchParams.get('from') || '';
	const endQuery = url.searchParams.get('to') || '';

	if (!startQuery || !endQuery) {
		return json({ connection: null });
	}

	const connection = await findConnection(startQuery, endQuery);
	return json({ connection, startQuery, endQuery });
};
