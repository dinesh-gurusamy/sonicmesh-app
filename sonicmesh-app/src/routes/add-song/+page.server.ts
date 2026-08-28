import { addSongWithRelationships } from '$lib/server/queries';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const title = formData.get('title')?.toString().trim();
		const releaseYear = parseInt(formData.get('releaseYear')?.toString() || '2023', 10);
		const durationSeconds = parseInt(formData.get('durationSeconds')?.toString() || '240', 10);
		const artistName = formData.get('artistName')?.toString().trim();
		const composerName = formData.get('composerName')?.toString().trim();
		const lyricistName = formData.get('lyricistName')?.toString().trim() || undefined;
		const albumTitle = formData.get('albumTitle')?.toString().trim() || undefined;
		const genreName = formData.get('genreName')?.toString().trim();
		const moodName = formData.get('moodName')?.toString().trim();
		const languageName = formData.get('languageName')?.toString().trim();
		const instrumentName = formData.get('instrumentName')?.toString().trim() || undefined;

		if (!title || !artistName || !composerName || !genreName || !moodName || !languageName) {
			return fail(400, {
				error: 'Please fill in all required fields (Title, Performer, Composer, Genre, Mood, and Language).'
			});
		}

		let newSongId = '';
		try {
			newSongId = await addSongWithRelationships({
				title,
				releaseYear,
				durationSeconds,
				artistName,
				composerName,
				lyricistName,
				albumTitle,
				genreName,
				moodName,
				languageName,
				instrumentName
			});
		} catch (err) {
			console.error('Error in addSong form action:', err);
			return fail(500, { error: 'Database transaction error: ' + (err as Error).message });
		}

		throw redirect(303, `/song/${newSongId}`);
	}
};
