import { getUserMusicDNA } from '$lib/server/queries';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const dna = await getUserMusicDNA('USR-001');
	return json(dna);
};
