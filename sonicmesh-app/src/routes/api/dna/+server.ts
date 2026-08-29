import { getUserMusicDNA } from '$lib/server/queries';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	const cookieRaw = cookies.get('sm_liked_songs');
	let cookieLikes: string[] | undefined = undefined;
	if (cookieRaw) {
		try {
			cookieLikes = JSON.parse(cookieRaw);
		} catch (_) {}
	}

	const dna = await getUserMusicDNA('USR-001', cookieLikes);
	return json(dna);
};
