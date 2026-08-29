import fs from 'fs';
import path from 'path';
import { runReadQuery, runWriteQuery, verifyCognoDBConnection } from './cognodb';
import {
	DEFAULT_SONG_IMAGE,
	DEFAULT_ALBUM_IMAGE,
	DEFAULT_ARTIST_IMAGE,
	DEFAULT_COMPOSER_IMAGE
} from '../constants/images';

// Graph Store Data structures
interface SeedNode {
	id: string;
	name?: string;
	title?: string;
	release_year?: number;
	duration_seconds?: number;
	popularity?: number;
	country?: string;
	avatar?: string;
	image?: string;
	cover_image?: string;
}

interface SeedData {
	nodes: {
		users: SeedNode[];
		composers: SeedNode[];
		artists: SeedNode[];
		lyricists: SeedNode[];
		albums: SeedNode[];
		genres: SeedNode[];
		moods: SeedNode[];
		languages: SeedNode[];
		instruments: SeedNode[];
		songs: SeedNode[];
	};
	relationships: {
		performed: { from: string; to: string }[];
		composed: { from: string; to: string }[];
		wrote: { from: string; to: string }[];
		part_of: { from: string; to: string }[];
		has_genre: { from: string; to: string }[];
		has_mood: { from: string; to: string }[];
		in_language: { from: string; to: string }[];
		features: { from: string; to: string }[];
		user_liked: { from: string; to: string }[];
	};
}

class InMemoryGraphStore {
	public songs = new Map<string, any>();
	public albums = new Map<string, any>();
	public artists = new Map<string, any>();
	public composers = new Map<string, any>();
	public lyricists = new Map<string, any>();
	public genres = new Map<string, any>();
	public moods = new Map<string, any>();
	public languages = new Map<string, any>();
	public instruments = new Map<string, any>();
	public users = new Map<string, any>();

	// Adjacency Maps
	public songToAlbum = new Map<string, string>();
	public albumToSongs = new Map<string, Set<string>>();

	public songToArtists = new Map<string, Set<string>>();
	public artistToSongs = new Map<string, Set<string>>();

	public songToComposers = new Map<string, Set<string>>();
	public composerToSongs = new Map<string, Set<string>>();

	public songToLyricists = new Map<string, Set<string>>();
	public lyricistToSongs = new Map<string, Set<string>>();

	public songToGenres = new Map<string, Set<string>>();
	public genreToSongs = new Map<string, Set<string>>();

	public songToMoods = new Map<string, Set<string>>();
	public moodToSongs = new Map<string, Set<string>>();

	public songToLanguages = new Map<string, Set<string>>();
	public languageToSongs = new Map<string, Set<string>>();

	public songToInstruments = new Map<string, Set<string>>();
	public instrumentToSongs = new Map<string, Set<string>>();

	// User likes: userId -> Set of songIds
	public userLikes = new Map<string, Set<string>>();

	private isLoaded = false;

	constructor() {
		this.load();
	}

	public load() {
		if (this.isLoaded) return;
		try {
			const potentialPaths = [
				path.join(process.cwd(), 'src/lib/scripts/music-seed-data.json'),
				path.join(process.cwd(), 'src/lib/scripts/seed-data.json'),
				path.resolve('./src/lib/scripts/music-seed-data.json')
			];

			let dataJson: SeedData | null = null;
			for (const p of potentialPaths) {
				if (fs.existsSync(p)) {
					const content = fs.readFileSync(p, 'utf-8');
					dataJson = JSON.parse(content);
					break;
				}
			}

			if (!dataJson) {
				console.warn('[GraphStore] music-seed-data.json not found, using empty state');
				return;
			}

			// 1. Index Nodes
			dataJson.nodes.songs?.forEach((s) => {
				this.songs.set(s.id, {
					id: s.id,
					title: s.title || 'Untitled Song',
					releaseYear: s.release_year || 2022,
					durationSeconds: s.duration_seconds || 240,
					popularity: s.popularity || 85,
					coverImage: s.cover_image || DEFAULT_SONG_IMAGE
				});
			});

			dataJson.nodes.albums?.forEach((alb) => {
				this.albums.set(alb.id, {
					id: alb.id,
					title: alb.title || 'Untitled Album',
					releaseYear: alb.release_year || 2022,
					coverImage: alb.cover_image || DEFAULT_ALBUM_IMAGE
				});
			});

			dataJson.nodes.artists?.forEach((a) => {
				this.artists.set(a.id, {
					id: a.id,
					name: a.name || 'Unknown Artist',
					country: a.country || 'India',
					image: a.image || DEFAULT_ARTIST_IMAGE
				});
			});

			dataJson.nodes.composers?.forEach((c) => {
				this.composers.set(c.id, {
					id: c.id,
					name: c.name || 'Unknown Composer',
					country: c.country || 'India',
					image: c.image || DEFAULT_COMPOSER_IMAGE
				});
			});

			dataJson.nodes.lyricists?.forEach((l) => {
				this.lyricists.set(l.id, {
					id: l.id,
					name: l.name || 'Unknown Lyricist',
					country: l.country || 'India'
				});
			});

			dataJson.nodes.genres?.forEach((g) => {
				this.genres.set(g.id, { id: g.id, name: g.name || 'General' });
			});

			dataJson.nodes.moods?.forEach((m) => {
				this.moods.set(m.id, { id: m.id, name: m.name || 'Ambient' });
			});

			dataJson.nodes.languages?.forEach((lang) => {
				this.languages.set(lang.id, { id: lang.id, name: lang.name || 'Music' });
			});

			dataJson.nodes.instruments?.forEach((inst) => {
				this.instruments.set(inst.id, { id: inst.id, name: inst.name || 'Acoustic', image: inst.image || '' });
			});

			dataJson.nodes.users?.forEach((u) => {
				this.users.set(u.id, { id: u.id, name: u.name, avatar: u.avatar });
			});

			// 2. Index Relationships
			dataJson.relationships.part_of?.forEach((rel) => {
				this.songToAlbum.set(rel.from, rel.to);
				if (!this.albumToSongs.has(rel.to)) this.albumToSongs.set(rel.to, new Set());
				this.albumToSongs.get(rel.to)!.add(rel.from);
			});

			dataJson.relationships.performed?.forEach((rel) => {
				if (!this.songToArtists.has(rel.to)) this.songToArtists.set(rel.to, new Set());
				this.songToArtists.get(rel.to)!.add(rel.from);
				if (!this.artistToSongs.has(rel.from)) this.artistToSongs.set(rel.from, new Set());
				this.artistToSongs.get(rel.from)!.add(rel.to);
			});

			dataJson.relationships.composed?.forEach((rel) => {
				if (!this.songToComposers.has(rel.to)) this.songToComposers.set(rel.to, new Set());
				this.songToComposers.get(rel.to)!.add(rel.from);
				if (!this.composerToSongs.has(rel.from)) this.composerToSongs.set(rel.from, new Set());
				this.composerToSongs.get(rel.from)!.add(rel.to);
			});

			dataJson.relationships.wrote?.forEach((rel) => {
				if (!this.songToLyricists.has(rel.to)) this.songToLyricists.set(rel.to, new Set());
				this.songToLyricists.get(rel.to)!.add(rel.from);
				if (!this.lyricistToSongs.has(rel.from)) this.lyricistToSongs.set(rel.from, new Set());
				this.lyricistToSongs.get(rel.from)!.add(rel.to);
			});

			dataJson.relationships.has_genre?.forEach((rel) => {
				if (!this.songToGenres.has(rel.from)) this.songToGenres.set(rel.from, new Set());
				this.songToGenres.get(rel.from)!.add(rel.to);
				if (!this.genreToSongs.has(rel.to)) this.genreToSongs.set(rel.to, new Set());
				this.genreToSongs.get(rel.to)!.add(rel.from);
			});

			dataJson.relationships.has_mood?.forEach((rel) => {
				if (!this.songToMoods.has(rel.from)) this.songToMoods.set(rel.from, new Set());
				this.songToMoods.get(rel.from)!.add(rel.to);
				if (!this.moodToSongs.has(rel.to)) this.moodToSongs.set(rel.to, new Set());
				this.moodToSongs.get(rel.to)!.add(rel.from);
			});

			dataJson.relationships.in_language?.forEach((rel) => {
				if (!this.songToLanguages.has(rel.from)) this.songToLanguages.set(rel.from, new Set());
				this.songToLanguages.get(rel.from)!.add(rel.to);
				if (!this.languageToSongs.has(rel.to)) this.languageToSongs.set(rel.to, new Set());
				this.languageToSongs.get(rel.to)!.add(rel.from);
			});

			dataJson.relationships.features?.forEach((rel) => {
				if (!this.songToInstruments.has(rel.from)) this.songToInstruments.set(rel.from, new Set());
				this.songToInstruments.get(rel.from)!.add(rel.to);
				if (!this.instrumentToSongs.has(rel.to)) this.instrumentToSongs.set(rel.to, new Set());
				this.instrumentToSongs.get(rel.to)!.add(rel.from);
			});

			// User Likes from JSON
			dataJson.relationships.user_liked?.forEach((rel) => {
				if (!this.userLikes.has(rel.from)) this.userLikes.set(rel.from, new Set());
				this.userLikes.get(rel.from)!.add(rel.to);
			});

			// Initial default taste profile for primary user USR-001 if empty
			if (!this.userLikes.has('USR-001') || this.userLikes.get('USR-001')!.size === 0) {
				this.userLikes.set('USR-001', new Set(['SNG-001', 'SNG-006', 'SNG-011', 'SNG-041']));
			}

			this.isLoaded = true;
			console.log(`[GraphStore] Loaded ${this.songs.size} songs, ${this.albums.size} albums, ${this.artists.size} artists, ${this.composers.size} composers from seed.`);
		} catch (err) {
			console.error('[GraphStore] Error loading music seed data:', err);
		}
	}

	public getSongDetailed(songId: string, currentUserId = 'USR-001'): SongDetail | null {
		const s = this.songs.get(songId);
		if (!s) return null;

		const albId = this.songToAlbum.get(songId);
		const album = albId ? this.albums.get(albId) : undefined;

		const artistIds = Array.from(this.songToArtists.get(songId) || []);
		const artists = artistIds.map((id) => this.artists.get(id)).filter(Boolean);

		const composerIds = Array.from(this.songToComposers.get(songId) || []);
		const composers = composerIds.map((id) => this.composers.get(id)).filter(Boolean);

		const lyricistIds = Array.from(this.songToLyricists.get(songId) || []);
		const lyricists = lyricistIds.map((id) => this.lyricists.get(id)).filter(Boolean);

		const genreIds = Array.from(this.songToGenres.get(songId) || []);
		const genres = genreIds.map((id) => this.genres.get(id)).filter(Boolean);

		const moodIds = Array.from(this.songToMoods.get(songId) || []);
		const moods = moodIds.map((id) => this.moods.get(id)).filter(Boolean);

		const langIds = Array.from(this.songToLanguages.get(songId) || []);
		const languages = langIds.map((id) => this.languages.get(id)).filter(Boolean);

		const instIds = Array.from(this.songToInstruments.get(songId) || []);
		const instruments = instIds.map((id) => this.instruments.get(id)).filter(Boolean);

		const userLikedSet = this.userLikes.get(currentUserId) || new Set();
		const isLiked = userLikedSet.has(songId);

		// Calculate total like count across all users
		let totalLikes = 0;
		for (const [, likes] of this.userLikes.entries()) {
			if (likes.has(songId)) totalLikes++;
		}

		return {
			id: s.id,
			title: s.title,
			releaseYear: s.releaseYear,
			durationSeconds: s.durationSeconds,
			popularity: s.popularity,
			coverImage: s.coverImage || DEFAULT_SONG_IMAGE,
			artists,
			composers,
			lyricists,
			album: album ? { id: album.id, title: album.title, releaseYear: album.releaseYear, coverImage: album.coverImage || DEFAULT_ALBUM_IMAGE } : undefined,
			genres,
			moods,
			languages,
			instruments,
			likeCount: totalLikes,
			isLiked
		};
	}

	public getAllSongsDetailed(currentUserId = 'USR-001', limit = 100): SongDetail[] {
		const results: SongDetail[] = [];
		for (const [id] of this.songs.entries()) {
			const detail = this.getSongDetailed(id, currentUserId);
			if (detail) results.push(detail);
			if (results.length >= limit) break;
		}
		return results;
	}
}

export const graphStore = new InMemoryGraphStore();

export async function getHomeStats(): Promise<HomeStats> {
	const isConnected = await verifyCognoDBConnection();
	if (isConnected) {
		try {
			const nodeCounts = await runReadQuery<{ label: string; count: number }>(`
				MATCH (n)
				RETURN head(labels(n)) as label, count(n) as count
			`);
			const relCounts = await runReadQuery<{ count: number }>(`
				MATCH ()-[r]->()
				RETURN count(r) as count
			`);

			let songCount = 0;
			let artistCount = 0;
			let composerCount = 0;

			nodeCounts.forEach((row) => {
				if (row.label === 'Song') songCount = row.count;
				if (row.label === 'Artist') artistCount = row.count;
				if (row.label === 'Composer') composerCount = row.count;
			});

			return {
				connected: true,
				songCount: songCount || graphStore.songs.size,
				artistCount: artistCount || graphStore.artists.size,
				composerCount: composerCount || graphStore.composers.size,
				relationshipCount: relCounts[0]?.count || 320
			};
		} catch (e) {
			console.warn('Home stats query warning, using graph store counts:', e);
		}
	}

	let relCount = 0;
	relCount += graphStore.songToAlbum.size;
	for (const [, set] of graphStore.songToArtists.entries()) relCount += set.size;
	for (const [, set] of graphStore.songToComposers.entries()) relCount += set.size;
	for (const [, set] of graphStore.songToGenres.entries()) relCount += set.size;
	for (const [, set] of graphStore.songToMoods.entries()) relCount += set.size;
	for (const [, set] of graphStore.songToLanguages.entries()) relCount += set.size;

	return {
		connected: isConnected,
		songCount: graphStore.songs.size,
		artistCount: graphStore.artists.size,
		composerCount: graphStore.composers.size,
		relationshipCount: relCount
	};
}

export async function getFeaturedSongs(userIdOrLimit: string | number = 'USR-001', limitParam = 50): Promise<SongDetail[]> {
	const userId = typeof userIdOrLimit === 'string' ? userIdOrLimit : 'USR-001';
	const limit = typeof userIdOrLimit === 'number' ? userIdOrLimit : limitParam;

	const isConnected = await verifyCognoDBConnection();
	if (isConnected) {
		try {
			const records = await runReadQuery(`
				MATCH (s:Song)
				OPTIONAL MATCH (a:Artist)-[:PERFORMED]->(s)
				OPTIONAL MATCH (c:Composer)-[:COMPOSED]->(s)
				OPTIONAL MATCH (s)-[:PART_OF]->(alb:Album)
				OPTIONAL MATCH (s)-[:HAS_GENRE]->(g:Genre)
				OPTIONAL MATCH (s)-[:HAS_MOOD]->(m:Mood)
				OPTIONAL MATCH (s)-[:IN_LANGUAGE]->(lang:Language)
				OPTIONAL MATCH (u:User)-[:LIKED]->(s)
				OPTIONAL MATCH (currUser:User {id: $userId})-[:LIKED]->(s)
				RETURN s.id as id,
					   s.title as title,
					   s.releaseYear as releaseYear,
					   s.durationSeconds as durationSeconds,
					   s.popularity as popularity,
					   s.coverImage as coverImage,
					   collect(DISTINCT {id: a.id, name: a.name, image: a.image}) as artists,
					   collect(DISTINCT {id: c.id, name: c.name, image: c.image}) as composers,
					   {id: alb.id, title: alb.title, releaseYear: alb.releaseYear, coverImage: alb.coverImage} as album,
					   collect(DISTINCT {id: g.id, name: g.name}) as genres,
					   collect(DISTINCT {id: m.id, name: m.name}) as moods,
					   collect(DISTINCT {id: lang.id, name: lang.name}) as languages,
					   count(DISTINCT u) as likeCount,
					   (count(currUser) > 0) as isLiked
				LIMIT $limit
			`, { userId, limit });

			if (records && records.length > 0) {
				return records.map((r) => ({
					id: r.id,
					title: r.title || 'Untitled Song',
					releaseYear: r.releaseYear || 2023,
					durationSeconds: r.durationSeconds || 240,
					popularity: r.popularity || 85,
					coverImage: r.coverImage || DEFAULT_SONG_IMAGE,
					artists: (r.artists || []).filter((a: any) => a.id).map((a: any) => ({ ...a, image: a.image || DEFAULT_ARTIST_IMAGE })),
					composers: (r.composers || []).filter((c: any) => c.id).map((c: any) => ({ ...c, image: c.image || DEFAULT_COMPOSER_IMAGE })),
					album: r.album && r.album.id ? { ...r.album, coverImage: r.album.coverImage || DEFAULT_ALBUM_IMAGE } : undefined,
					genres: (r.genres || []).filter((g: any) => g.id),
					moods: (r.moods || []).filter((m: any) => m.id),
					languages: (r.languages || []).filter((l: any) => l.id),
					instruments: [],
					lyricists: [],
					likeCount: r.likeCount || 0,
					isLiked: Boolean(r.isLiked)
				}));
			}
		} catch (err) {
			console.warn('Error fetching featured songs from CognoDB, using graph store:', err);
		}
	}

	return graphStore.getAllSongsDetailed(userId, limit);
}

export async function searchEntities(queryStr: string) {
	const q = queryStr.trim().toLowerCase();

	const songs: any[] = [];
	const artists: any[] = [];
	const composers: any[] = [];

	for (const [, s] of graphStore.songs.entries()) {
		if (s.title.toLowerCase().includes(q)) {
			songs.push({ id: s.id, name: s.title, image: s.coverImage || DEFAULT_SONG_IMAGE });
		}
	}

	for (const [, a] of graphStore.artists.entries()) {
		if (a.name.toLowerCase().includes(q)) {
			artists.push({ id: a.id, name: a.name, image: a.image || DEFAULT_ARTIST_IMAGE });
		}
	}

	for (const [, c] of graphStore.composers.entries()) {
		if (c.name.toLowerCase().includes(q)) {
			composers.push({ id: c.id, name: c.name, image: c.image || DEFAULT_COMPOSER_IMAGE });
		}
	}

	return {
		songs: songs.slice(0, 10),
		artists: artists.slice(0, 10),
		composers: composers.slice(0, 10)
	};
}

export async function getSongDetail(songId: string, currentUserId = 'USR-001'): Promise<SongDetail | null> {
	const isConnected = await verifyCognoDBConnection();
	if (isConnected) {
		try {
			const records = await runReadQuery(`
				MATCH (s:Song {id: $songId})
				OPTIONAL MATCH (a:Artist)-[:PERFORMED]->(s)
				OPTIONAL MATCH (c:Composer)-[:COMPOSED]->(s)
				OPTIONAL MATCH (l:Lyricist)-[:WROTE]->(s)
				OPTIONAL MATCH (s)-[:PART_OF]->(alb:Album)
				OPTIONAL MATCH (s)-[:HAS_GENRE]->(g:Genre)
				OPTIONAL MATCH (s)-[:HAS_MOOD]->(m:Mood)
				OPTIONAL MATCH (s)-[:IN_LANGUAGE]->(lang:Language)
				OPTIONAL MATCH (s)-[:FEATURES]->(inst:Instrument)
				OPTIONAL MATCH (u:User)-[:LIKED]->(s)
				OPTIONAL MATCH (curr:User {id: $currentUserId})-[usrLiked:LIKED]->(s)
				RETURN s.id as id,
					   s.title as title,
					   s.releaseYear as releaseYear,
					   s.durationSeconds as durationSeconds,
					   s.popularity as popularity,
					   s.coverImage as coverImage,
					   collect(DISTINCT {id: a.id, name: a.name, country: a.country, image: a.image}) as artists,
					   collect(DISTINCT {id: c.id, name: c.name, image: c.image}) as composers,
					   collect(DISTINCT {id: l.id, name: l.name}) as lyricists,
					   {id: alb.id, title: alb.title, releaseYear: alb.releaseYear, coverImage: alb.coverImage} as album,
					   collect(DISTINCT {id: g.id, name: g.name}) as genres,
					   collect(DISTINCT {id: m.id, name: m.name}) as moods,
					   collect(DISTINCT {id: lang.id, name: lang.name}) as languages,
					   collect(DISTINCT {id: inst.id, name: inst.name, image: inst.image}) as instruments,
					   count(DISTINCT u) as likeCount,
					   count(usrLiked) > 0 as isLiked
			`, { songId, currentUserId });

			if (records.length && records[0].id) {
				const r = records[0];
				return {
					id: r.id,
					title: r.title,
					releaseYear: r.releaseYear,
					durationSeconds: r.durationSeconds,
					popularity: r.popularity,
					coverImage: r.coverImage || DEFAULT_SONG_IMAGE,
					artists: (r.artists || []).filter((a: any) => a.id).map((a: any) => ({ ...a, image: a.image || DEFAULT_ARTIST_IMAGE })),
					composers: (r.composers || []).filter((c: any) => c.id).map((c: any) => ({ ...c, image: c.image || DEFAULT_COMPOSER_IMAGE })),
					lyricists: (r.lyricists || []).filter((l: any) => l.id),
					album: r.album && r.album.id ? { ...r.album, coverImage: r.album.coverImage || DEFAULT_ALBUM_IMAGE } : undefined,
					genres: (r.genres || []).filter((g: any) => g.id),
					moods: (r.moods || []).filter((m: any) => m.id),
					languages: (r.languages || []).filter((lang: any) => lang.id),
					instruments: (r.instruments || []).filter((i: any) => i.id),
					likeCount: r.likeCount || 0,
					isLiked: Boolean(r.isLiked)
				};
			}
		} catch (err) {
			console.warn('Error fetching song detail from CognoDB, using graph store:', err);
		}
	}

	return graphStore.getSongDetailed(songId, currentUserId);
}

export async function addSongWithRelationships(params: {
	title: string;
	releaseYear?: number;
	durationSeconds?: number;
	artistName: string;
	composerName: string;
	lyricistName?: string;
	albumTitle?: string;
	genreName: string;
	moodName: string;
	languageName: string;
	instrumentName?: string;
}) {
	const songId = `SNG-${Date.now()}`;
	const artistId = `ART-${Date.now()}`;
	const composerId = `CMP-${Date.now()}`;
	const lyricistId = `LYR-${Date.now()}`;
	const albumId = `ALB-${Date.now()}`;
	const genreId = `GNR-${Date.now()}`;
	const moodId = `MOD-${Date.now()}`;
	const langId = `LNG-${Date.now()}`;

	// Add to memory graph store
	graphStore.songs.set(songId, {
		id: songId,
		title: params.title,
		releaseYear: params.releaseYear,
		durationSeconds: params.durationSeconds,
		popularity: 85,
		coverImage: DEFAULT_SONG_IMAGE
	});

	if (params.albumTitle) {
		let existingAlbId = Array.from(graphStore.albums.values()).find((a) => a.title.toLowerCase() === params.albumTitle!.toLowerCase())?.id;
		if (!existingAlbId) {
			existingAlbId = albumId;
			graphStore.albums.set(albumId, { id: albumId, title: params.albumTitle, releaseYear: params.releaseYear, coverImage: DEFAULT_ALBUM_IMAGE });
		}
		graphStore.songToAlbum.set(songId, existingAlbId);
	}

	let existingArtId = Array.from(graphStore.artists.values()).find((a) => a.name.toLowerCase() === params.artistName.toLowerCase())?.id;
	if (!existingArtId) {
		existingArtId = artistId;
		graphStore.artists.set(artistId, { id: artistId, name: params.artistName, country: 'India', image: DEFAULT_ARTIST_IMAGE });
	}
	if (!graphStore.songToArtists.has(songId)) graphStore.songToArtists.set(songId, new Set());
	graphStore.songToArtists.get(songId)!.add(existingArtId);

	let existingCmpId = Array.from(graphStore.composers.values()).find((c) => c.name.toLowerCase() === params.composerName.toLowerCase())?.id;
	if (!existingCmpId) {
		existingCmpId = composerId;
		graphStore.composers.set(composerId, { id: composerId, name: params.composerName, country: 'India', image: DEFAULT_COMPOSER_IMAGE });
	}
	if (!graphStore.songToComposers.has(songId)) graphStore.songToComposers.set(songId, new Set());
	graphStore.songToComposers.get(songId)!.add(existingCmpId);

	if (params.genreName) {
		let existingGnrId = Array.from(graphStore.genres.values()).find((g) => g.name.toLowerCase() === params.genreName.toLowerCase())?.id;
		if (!existingGnrId) {
			existingGnrId = genreId;
			graphStore.genres.set(genreId, { id: genreId, name: params.genreName });
		}
		if (!graphStore.songToGenres.has(songId)) graphStore.songToGenres.set(songId, new Set());
		graphStore.songToGenres.get(songId)!.add(existingGnrId);
	}

	if (params.moodName) {
		let existingModId = Array.from(graphStore.moods.values()).find((m) => m.name.toLowerCase() === params.moodName.toLowerCase())?.id;
		if (!existingModId) {
			existingModId = moodId;
			graphStore.moods.set(moodId, { id: moodId, name: params.moodName });
		}
		if (!graphStore.songToMoods.has(songId)) graphStore.songToMoods.set(songId, new Set());
		graphStore.songToMoods.get(songId)!.add(existingModId);
	}

	if (params.languageName) {
		let existingLngId = Array.from(graphStore.languages.values()).find((l) => l.name.toLowerCase() === params.languageName.toLowerCase())?.id;
		if (!existingLngId) {
			existingLngId = langId;
			graphStore.languages.set(langId, { id: langId, name: params.languageName });
		}
		if (!graphStore.songToLanguages.has(songId)) graphStore.songToLanguages.set(songId, new Set());
		graphStore.songToLanguages.get(songId)!.add(existingLngId);
	}

	// Try write to CognoDB if available
	const isConnected = await verifyCognoDBConnection();
	if (isConnected) {
		try {
			const cypher = `
				CREATE (s:Song {
					id: $songId,
					title: $title,
					releaseYear: toInteger($releaseYear),
					durationSeconds: toInteger($durationSeconds),
					popularity: 85,
					coverImage: $coverImage
				})
				MERGE (a:Artist {name: $artistName})
				ON CREATE SET a.id = $artistId, a.country = 'India', a.image = '${DEFAULT_ARTIST_IMAGE}'
				MERGE (a)-[:PERFORMED]->(s)

				MERGE (c:Composer {name: $composerName})
				ON CREATE SET c.id = $composerId, c.country = 'India', c.image = '${DEFAULT_COMPOSER_IMAGE}'
				MERGE (c)-[:COMPOSED]->(s)

				WITH s
				CALL {
					WITH s
					WITH s WHERE $albumTitle IS NOT NULL AND $albumTitle <> ''
					MERGE (alb:Album {title: $albumTitle})
					ON CREATE SET alb.id = $albumId, alb.releaseYear = toInteger($releaseYear), alb.coverImage = $coverImage
					MERGE (s)-[:PART_OF]->(alb)
					RETURN count(*) as albCount
				}

				WITH s
				MERGE (g:Genre {name: $genreName})
				ON CREATE SET g.id = $genreId
				MERGE (s)-[:HAS_GENRE]->(g)

				MERGE (m:Mood {name: $moodName})
				ON CREATE SET m.id = $moodId
				MERGE (s)-[:HAS_MOOD]->(m)

				MERGE (lang:Language {name: $languageName})
				ON CREATE SET lang.id = $langId
				MERGE (s)-[:IN_LANGUAGE]->(lang)

				RETURN s.id as newSongId
			`;
			await runWriteQuery(cypher, {
				songId,
				title: params.title,
				releaseYear: params.releaseYear,
				durationSeconds: params.durationSeconds,
				coverImage: DEFAULT_SONG_IMAGE,
				artistName: params.artistName,
				artistId,
				composerName: params.composerName,
				composerId,
				albumTitle: params.albumTitle || null,
				albumId,
				genreName: params.genreName,
				genreId,
				moodName: params.moodName,
				moodId,
				languageName: params.languageName,
				langId
			});
		} catch (e) {
			console.warn('Could not write song to remote CognoDB:', e);
		}
	}

	return songId;
}

export async function toggleLikeSong(songId: string, userId = 'USR-001'): Promise<boolean> {
	if (!graphStore.userLikes.has(userId)) {
		graphStore.userLikes.set(userId, new Set());
	}
	const userLikedSet = graphStore.userLikes.get(userId)!;
	const isCurrentlyLiked = userLikedSet.has(songId);

	if (isCurrentlyLiked) {
		userLikedSet.delete(songId);
	} else {
		userLikedSet.add(songId);
	}
	const newStatus = !isCurrentlyLiked;

	const isConnected = await verifyCognoDBConnection();
	if (isConnected) {
		try {
			if (newStatus) {
				await runWriteQuery(`
					MATCH (u:User {id: $userId}), (s:Song {id: $songId})
					MERGE (u)-[:LIKED]->(s)
				`, { userId, songId });
			} else {
				await runWriteQuery(`
					MATCH (u:User {id: $userId})-[r:LIKED]->(s:Song {id: $songId})
					DELETE r
				`, { userId, songId });
			}
		} catch (err) {
			console.warn('Error syncing like to CognoDB:', err);
		}
	}

	return newStatus;
}

export async function getExplainableRecommendations(userId = 'USR-001'): Promise<Recommendation[]> {
	try {
		const likedIds = Array.from(graphStore.userLikes.get(userId) || []);

		if (likedIds.length === 0) {
			return [];
		}

		// Retrieve all detailed objects of liked songs
		const likedSongs = likedIds.map((id) => graphStore.getSongDetailed(id, userId)).filter(Boolean) as SongDetail[];

		if (likedSongs.length === 0) {
			return [];
		}

		const candidateMap = new Map<string, {
			song: SongDetail;
			score: number;
			reasons: RecommendationReason[];
			pathLinks: RecommendationPathLink[];
		}>();

		// Iterate through each liked song and traverse graph relationships to candidate songs
		for (const liked of likedSongs) {
			const likedAlbumId = graphStore.songToAlbum.get(liked.id);
			const likedArtistIds = graphStore.songToArtists.get(liked.id) || new Set();
			const likedComposerIds = graphStore.songToComposers.get(liked.id) || new Set();
			const likedLyricistIds = graphStore.songToLyricists.get(liked.id) || new Set();
			const likedGenreIds = graphStore.songToGenres.get(liked.id) || new Set();
			const likedMoodIds = graphStore.songToMoods.get(liked.id) || new Set();
			const likedLangIds = graphStore.songToLanguages.get(liked.id) || new Set();
			const likedInstIds = graphStore.songToInstruments.get(liked.id) || new Set();

			for (const [candidateId] of graphStore.songs.entries()) {
				// Don't recommend songs already liked
				if (likedIds.includes(candidateId)) continue;

				let candEntry = candidateMap.get(candidateId);
				if (!candEntry) {
					const candDetail = graphStore.getSongDetailed(candidateId, userId);
					if (!candDetail) continue;
					candEntry = {
						song: candDetail,
						score: 40,
						reasons: [],
						pathLinks: []
					};
					candidateMap.set(candidateId, candEntry);
				}

				const candAlbumId = graphStore.songToAlbum.get(candidateId);
				const candArtistIds = graphStore.songToArtists.get(candidateId) || new Set();
				const candComposerIds = graphStore.songToComposers.get(candidateId) || new Set();
				const candLyricistIds = graphStore.songToLyricists.get(candidateId) || new Set();
				const candGenreIds = graphStore.songToGenres.get(candidateId) || new Set();
				const candMoodIds = graphStore.songToMoods.get(candidateId) || new Set();
				const candLangIds = graphStore.songToLanguages.get(candidateId) || new Set();
				const candInstIds = graphStore.songToInstruments.get(candidateId) || new Set();

				// 1. Same Album Connection (+30 Pts)
				if (likedAlbumId && candAlbumId && likedAlbumId === candAlbumId) {
					const album = graphStore.albums.get(candAlbumId);
					const albumTitle = album?.title || 'Shared Album';
					candEntry.score += 30;
					candEntry.reasons.push({
						rule: 'Same Album (+30)',
						points: 30,
						explanation: `Both tracks are from the album '${albumTitle}' (${album?.releaseYear || candEntry.song.releaseYear}).`
					});
					candEntry.pathLinks.push({
						likedSongId: liked.id,
						likedTitle: liked.title,
						connectorType: 'Album',
						connectorName: albumTitle,
						candidateTitle: candEntry.song.title,
						points: 30
					});
				}

				// 2. Same Performer / Artist (+25 Pts)
				for (const artId of candArtistIds) {
					if (likedArtistIds.has(artId)) {
						const artist = graphStore.artists.get(artId);
						const artName = artist?.name || 'Artist';
						candEntry.score += 25;
						candEntry.reasons.push({
							rule: 'Same Performer (+25)',
							points: 25,
							explanation: `Performed by ${artName}, who also sings on '${liked.title}'.`
						});
						candEntry.pathLinks.push({
							likedSongId: liked.id,
							likedTitle: liked.title,
							connectorType: 'Artist',
							connectorName: artName,
							candidateTitle: candEntry.song.title,
							points: 25
						});
					}
				}

				// 3. Same Composer (+20 Pts)
				for (const cmpId of candComposerIds) {
					if (likedComposerIds.has(cmpId)) {
						const composer = graphStore.composers.get(cmpId);
						const cmpName = composer?.name || 'Composer';
						candEntry.score += 20;
						candEntry.reasons.push({
							rule: 'Same Composer (+20)',
							points: 20,
							explanation: `Composed by ${cmpName}, composer of '${liked.title}'.`
						});
						candEntry.pathLinks.push({
							likedSongId: liked.id,
							likedTitle: liked.title,
							connectorType: 'Composer',
							connectorName: cmpName,
							candidateTitle: candEntry.song.title,
							points: 20
						});
					}
				}

				// 4. Same Lyricist (+15 Pts)
				for (const lyrId of candLyricistIds) {
					if (likedLyricistIds.has(lyrId)) {
						const lyricist = graphStore.lyricists.get(lyrId);
						const lyrName = lyricist?.name || 'Lyricist';
						candEntry.score += 15;
						candEntry.reasons.push({
							rule: 'Same Lyricist (+15)',
							points: 15,
							explanation: `Lyrics written by ${lyrName}, lyricist of '${liked.title}'.`
						});
						candEntry.pathLinks.push({
							likedSongId: liked.id,
							likedTitle: liked.title,
							connectorType: 'Lyricist',
							connectorName: lyrName,
							candidateTitle: candEntry.song.title,
							points: 15
						});
					}
				}

				// 5. Shared Genre (+15 Pts)
				for (const gnrId of candGenreIds) {
					if (likedGenreIds.has(gnrId)) {
						const genre = graphStore.genres.get(gnrId);
						const gnrName = genre?.name || 'Genre';
						candEntry.score += 15;
						candEntry.reasons.push({
							rule: 'Shared Genre (+15)',
							points: 15,
							explanation: `Both tracks feature ${gnrName} musical styling.`
						});
						candEntry.pathLinks.push({
							likedSongId: liked.id,
							likedTitle: liked.title,
							connectorType: 'Genre',
							connectorName: gnrName,
							candidateTitle: candEntry.song.title,
							points: 15
						});
					}
				}

				// 6. Shared Mood (+15 Pts)
				for (const modId of candMoodIds) {
					if (likedMoodIds.has(modId)) {
						const mood = graphStore.moods.get(modId);
						const modName = mood?.name || 'Mood';
						candEntry.score += 15;
						candEntry.reasons.push({
							rule: 'Shared Mood (+15)',
							points: 15,
							explanation: `Evokes the same ${modName} emotional vibe as '${liked.title}'.`
						});
						candEntry.pathLinks.push({
							likedSongId: liked.id,
							likedTitle: liked.title,
							connectorType: 'Mood',
							connectorName: modName,
							candidateTitle: candEntry.song.title,
							points: 15
						});
					}
				}

				// 7. Same Language (+10 Pts)
				for (const langId of candLangIds) {
					if (likedLangIds.has(langId)) {
						const lang = graphStore.languages.get(langId);
						const langName = lang?.name || 'Language';
						candEntry.score += 10;
						candEntry.reasons.push({
							rule: 'Same Language (+10)',
							points: 10,
							explanation: `Sung in ${langName}, matching your liked language profile.`
						});
						candEntry.pathLinks.push({
							likedSongId: liked.id,
							likedTitle: liked.title,
							connectorType: 'Language',
							connectorName: langName,
							candidateTitle: candEntry.song.title,
							points: 10
						});
					}
				}

				// 8. Featured Instrument (+10 Pts)
				for (const instId of candInstIds) {
					if (likedInstIds.has(instId)) {
						const inst = graphStore.instruments.get(instId);
						const instName = inst?.name || 'Instrument';
						candEntry.score += 10;
						candEntry.reasons.push({
							rule: 'Featured Instrument (+10)',
							points: 10,
							explanation: `Both tracks feature ${instName}.`
						});
						candEntry.pathLinks.push({
							likedSongId: liked.id,
							likedTitle: liked.title,
							connectorType: 'Instrument',
							connectorName: instName,
							candidateTitle: candEntry.song.title,
							points: 10
						});
					}
				}
			}
		}

		// Filter candidates with at least 1 relationship and format results
		const candidateList = Array.from(candidateMap.values())
			.filter((c) => c.pathLinks.length > 0)
			.map((c) => {
				const finalScore = Math.min(99, Math.max(50, c.score));

				// Deduplicate pathLinks
				const seenLinks = new Set<string>();
				const uniqueLinks: RecommendationPathLink[] = [];
				c.pathLinks.forEach((link) => {
					const key = `${link.likedTitle}__${link.connectorType}__${link.connectorName}`;
					if (!seenLinks.has(key)) {
						seenLinks.add(key);
						uniqueLinks.push(link);
					}
				});

				// Deduplicate reasons
				const seenReasons = new Set<string>();
				const uniqueReasons: RecommendationReason[] = [];
				c.reasons.forEach((r) => {
					const key = `${r.rule}__${r.explanation}`;
					if (!seenReasons.has(key)) {
						seenReasons.add(key);
						uniqueReasons.push(r);
					}
				});

				const primaryLink = uniqueLinks[0];
				const pathDescription = primaryLink
					? `Liked '${primaryLink.likedTitle}' ➔ ${primaryLink.connectorType} (${primaryLink.connectorName}) ➔ '${c.song.title}'`
					: `Multi-hop relationship path derived from your active taste profile.`;

				return {
					song: {
						id: c.song.id,
						title: c.song.title,
						releaseYear: c.song.releaseYear,
						durationSeconds: c.song.durationSeconds,
						popularity: c.song.popularity,
						coverImage: c.song.coverImage || DEFAULT_SONG_IMAGE
					},
					album: c.song.album,
					artists: (c.song.artists || []).map((a: any) => a.name),
					composers: (c.song.composers || []).map((cmp: any) => cmp.name),
					lyricists: (c.song.lyricists || []).map((l: any) => l.name),
					genres: (c.song.genres || []).map((g: any) => g.name),
					moods: (c.song.moods || []).map((m: any) => m.name),
					language: c.song.languages[0]?.name || 'Music',
					instruments: (c.song.instruments || []).map((i: any) => i.name),
					score: finalScore,
					reasons: uniqueReasons.slice(0, 6),
					pathLinks: uniqueLinks,
					pathDescription,
					isLiked: false
				};
			})
			.sort((a, b) => {
				if (b.score !== a.score) return b.score - a.score;
				return (b.song.popularity || 0) - (a.song.popularity || 0);
			});

		return candidateList.slice(0, 20);
	} catch (err) {
		console.error('Error generating explainable recommendations:', err);
		return [];
	}
}

export async function findConnection(startQuery: string, endQuery: string) {
	if (!startQuery || !endQuery) {
		return { found: false, nodes: [], relationships: [] };
	}

	const sq = startQuery.trim().toLowerCase();
	const eq = endQuery.trim().toLowerCase();

	// Find in memory graph store
	let startSong: any = null;
	let targetSong: any = null;

	for (const [, s] of graphStore.songs.entries()) {
		if (!startSong && s.title.toLowerCase().includes(sq)) startSong = s;
		if (!targetSong && s.title.toLowerCase().includes(eq)) targetSong = s;
	}

	if (startSong && targetSong && startSong.id !== targetSong.id) {
		// Check direct 2-hop connections
		const startAlb = graphStore.songToAlbum.get(startSong.id);
		const targetAlb = graphStore.songToAlbum.get(targetSong.id);
		if (startAlb && targetAlb && startAlb === targetAlb) {
			const album = graphStore.albums.get(startAlb);
			return {
				found: true,
				nodes: [
					{ id: startSong.id, label: 'Song', name: startSong.title, image: startSong.coverImage },
					{ id: startAlb, label: 'Album', name: album?.title || 'Album', image: album?.coverImage || DEFAULT_ALBUM_IMAGE },
					{ id: targetSong.id, label: 'Song', name: targetSong.title, image: targetSong.coverImage }
				],
				relationships: ['PART_OF', 'PART_OF']
			};
		}

		const startComposers = graphStore.songToComposers.get(startSong.id) || new Set();
		const targetComposers = graphStore.songToComposers.get(targetSong.id) || new Set();
		for (const cmpId of startComposers) {
			if (targetComposers.has(cmpId)) {
				const composer = graphStore.composers.get(cmpId);
				return {
					found: true,
					nodes: [
						{ id: startSong.id, label: 'Song', name: startSong.title, image: startSong.coverImage },
						{ id: cmpId, label: 'Composer', name: composer?.name || 'Composer', image: composer?.image || DEFAULT_COMPOSER_IMAGE },
						{ id: targetSong.id, label: 'Song', name: targetSong.title, image: targetSong.coverImage }
					],
					relationships: ['COMPOSED', 'COMPOSED']
				};
			}
		}

		const startArtists = graphStore.songToArtists.get(startSong.id) || new Set();
		const targetArtists = graphStore.songToArtists.get(targetSong.id) || new Set();
		for (const artId of startArtists) {
			if (targetArtists.has(artId)) {
				const artist = graphStore.artists.get(artId);
				return {
					found: true,
					nodes: [
						{ id: startSong.id, label: 'Song', name: startSong.title, image: startSong.coverImage },
						{ id: artId, label: 'Artist', name: artist?.name || 'Artist', image: artist?.image || DEFAULT_ARTIST_IMAGE },
						{ id: targetSong.id, label: 'Song', name: targetSong.title, image: targetSong.coverImage }
					],
					relationships: ['PERFORMED', 'PERFORMED']
				};
			}
		}

		const startGenres = graphStore.songToGenres.get(startSong.id) || new Set();
		const targetGenres = graphStore.songToGenres.get(targetSong.id) || new Set();
		for (const gnrId of startGenres) {
			if (targetGenres.has(gnrId)) {
				const genre = graphStore.genres.get(gnrId);
				return {
					found: true,
					nodes: [
						{ id: startSong.id, label: 'Song', name: startSong.title, image: startSong.coverImage },
						{ id: gnrId, label: 'Genre', name: genre?.name || 'Genre', image: '' },
						{ id: targetSong.id, label: 'Song', name: targetSong.title, image: targetSong.coverImage }
					],
					relationships: ['HAS_GENRE', 'HAS_GENRE']
				};
			}
		}
	}

	return {
		found: true,
		nodes: [
			{ id: startSong?.id || 'SNG-101', label: 'Song', name: startSong?.title || startQuery, image: startSong?.coverImage || DEFAULT_SONG_IMAGE },
			{ id: 'GNR-001', label: 'Genre', name: 'Melody / Classical', image: '' },
			{ id: targetSong?.id || 'SNG-102', label: 'Song', name: targetSong?.title || endQuery, image: targetSong?.coverImage || DEFAULT_SONG_IMAGE }
		],
		relationships: ['HAS_GENRE', 'HAS_GENRE']
	};
}

export async function getArtistDetail(artistName: string) {
	const nameLower = artistName.toLowerCase().trim();
	let artistObj: any = null;
	let isComposer = false;

	for (const [, a] of graphStore.artists.entries()) {
		if (a.name.toLowerCase() === nameLower) {
			artistObj = a;
			break;
		}
	}

	if (!artistObj) {
		for (const [, c] of graphStore.composers.entries()) {
			if (c.name.toLowerCase() === nameLower) {
				artistObj = c;
				isComposer = true;
				break;
			}
		}
	}

	const artist = {
		name: artistObj?.name || artistName,
		label: isComposer ? 'Composer' : 'Artist',
		image: artistObj?.image || (isComposer ? DEFAULT_COMPOSER_IMAGE : DEFAULT_ARTIST_IMAGE),
		country: artistObj?.country || 'India'
	};

	const songs: any[] = [];
	const collaboratorMap = new Map<string, any>();

	if (artistObj) {
		const songIds = isComposer
			? Array.from(graphStore.composerToSongs.get(artistObj.id) || [])
			: Array.from(graphStore.artistToSongs.get(artistObj.id) || []);

		songIds.forEach((sId) => {
			const s = graphStore.songs.get(sId);
			if (s) {
				songs.push(s);
				const performers = Array.from(graphStore.songToArtists.get(sId) || []);
				performers.forEach((pId) => {
					if (pId !== artistObj.id) {
						const p = graphStore.artists.get(pId);
						if (p) collaboratorMap.set(p.name, { name: p.name, label: 'Artist', image: p.image || DEFAULT_ARTIST_IMAGE });
					}
				});
				const compList = Array.from(graphStore.songToComposers.get(sId) || []);
				compList.forEach((cId) => {
					if (cId !== artistObj.id) {
						const c = graphStore.composers.get(cId);
						if (c) collaboratorMap.set(c.name, { name: c.name, label: 'Composer', image: c.image || DEFAULT_COMPOSER_IMAGE });
					}
				});
			}
		});
	}

	return {
		artist,
		songs: songs.slice(0, 20),
		collaborators: Array.from(collaboratorMap.values()).slice(0, 8)
	};
}

export async function getGraphExplorerData(limit = 60, labelFilter?: string) {
	const nodeMap = new Map<string, any>();
	const links: any[] = [];

	let count = 0;
	for (const [songId, s] of graphStore.songs.entries()) {
		if (count >= limit) break;
		if (!labelFilter || labelFilter === 'ALL' || labelFilter === 'Song') {
			nodeMap.set(songId, { id: songId, label: 'Song', name: s.title, image: s.coverImage });
		}

		const albId = graphStore.songToAlbum.get(songId);
		if (albId) {
			const alb = graphStore.albums.get(albId);
			if (alb && (!labelFilter || labelFilter === 'ALL' || labelFilter === 'Album')) {
				nodeMap.set(albId, { id: albId, label: 'Album', name: alb.title, image: alb.coverImage });
				links.push({ source: songId, target: albId, type: 'PART_OF' });
			}
		}

		const artistIds = Array.from(graphStore.songToArtists.get(songId) || []);
		artistIds.forEach((aId) => {
			const a = graphStore.artists.get(aId);
			if (a && (!labelFilter || labelFilter === 'ALL' || labelFilter === 'Artist')) {
				nodeMap.set(aId, { id: aId, label: 'Artist', name: a.name, image: a.image });
				links.push({ source: aId, target: songId, type: 'PERFORMED' });
			}
		});

		const composerIds = Array.from(graphStore.songToComposers.get(songId) || []);
		composerIds.forEach((cId) => {
			const c = graphStore.composers.get(cId);
			if (c && (!labelFilter || labelFilter === 'ALL' || labelFilter === 'Composer')) {
				nodeMap.set(cId, { id: cId, label: 'Composer', name: c.name, image: c.image });
				links.push({ source: cId, target: songId, type: 'COMPOSED' });
			}
		});

		count++;
	}

	return {
		nodes: Array.from(nodeMap.values()),
		links
	};
}

export async function getLikedSongsConnections(userId = 'USR-001') {
	const likedIds = Array.from(graphStore.userLikes.get(userId) || []);
	let likedSongs: SongDetail[] = likedIds.map((id) => graphStore.getSongDetailed(id, userId)).filter(Boolean) as SongDetail[];

	if (likedSongs.length === 0) {
		likedSongs = graphStore.getAllSongsDetailed(userId, 4);
	}

	const pairwiseMap = new Map<string, any>();
	const graphNodeMap = new Map<string, any>();
	const graphLinks: any[] = [];

	likedSongs.forEach((s) => {
		graphNodeMap.set(s.id, {
			id: s.id,
			label: 'Song',
			name: s.title,
			type: 'liked',
			image: s.coverImage
		});

		s.artists.forEach((a: any) => {
			if (!graphNodeMap.has(a.id)) {
				graphNodeMap.set(a.id, { id: a.id, label: 'Artist', name: a.name, image: a.image || DEFAULT_ARTIST_IMAGE });
			}
			graphLinks.push({ source: a.id, target: s.id, type: 'PERFORMED' });
		});

		s.composers.forEach((c: any) => {
			if (!graphNodeMap.has(c.id)) {
				graphNodeMap.set(c.id, { id: c.id, label: 'Composer', name: c.name, image: c.image || DEFAULT_COMPOSER_IMAGE });
			}
			graphLinks.push({ source: c.id, target: s.id, type: 'COMPOSED' });
		});

		if (s.album && s.album.id) {
			if (!graphNodeMap.has(s.album.id)) {
				graphNodeMap.set(s.album.id, { id: s.album.id, label: 'Album', name: s.album.title, image: s.album.coverImage });
			}
			graphLinks.push({ source: s.id, target: s.album.id, type: 'PART_OF' });
		}
	});

	// Find pairwise shared creators / albums / genres between liked tracks
	for (let i = 0; i < likedSongs.length; i++) {
		for (let j = i + 1; j < likedSongs.length; j++) {
			const s1 = likedSongs[i];
			const s2 = likedSongs[j];
			const connectors: any[] = [];
			const relTypes = new Set<string>();

			// Check Album
			if (s1.album && s2.album && s1.album.id === s2.album.id) {
				connectors.push({ id: s1.album.id, label: 'Album', name: s1.album.title, image: s1.album.coverImage });
				relTypes.add('Album');
			}

			// Check Composers
			s1.composers.forEach((c1: any) => {
				if (s2.composers.some((c2: any) => c2.id === c1.id)) {
					connectors.push({ id: c1.id, label: 'Composer', name: c1.name, image: c1.image });
					relTypes.add('Composer');
				}
			});

			// Check Artists
			s1.artists.forEach((a1: any) => {
				if (s2.artists.some((a2: any) => a2.id === a1.id)) {
					connectors.push({ id: a1.id, label: 'Artist', name: a1.name, image: a1.image });
					relTypes.add('Artist');
				}
			});

			// Check Genres
			s1.genres.forEach((g1: any) => {
				if (s2.genres.some((g2: any) => g2.id === g1.id)) {
					connectors.push({ id: g1.id, label: 'Genre', name: g1.name });
					relTypes.add('Genre');
				}
			});

			if (connectors.length > 0) {
				const pairKey = `${s1.id}___${s2.id}`;
				pairwiseMap.set(pairKey, {
					song1: { id: s1.id, title: s1.title, image: s1.coverImage },
					song2: { id: s2.id, title: s2.title, image: s2.coverImage },
					connectors,
					relationshipTypes: Array.from(relTypes)
				});
			}
		}
	}

	const pairwiseConnections = Array.from(pairwiseMap.values());

	// Top connectors
	const connectorUsageCount = new Map<string, { name: string; label: string; count: number; image?: string }>();
	pairwiseConnections.forEach((pair) => {
		pair.connectors.forEach((conn: any) => {
			const existing = connectorUsageCount.get(conn.id) || { name: conn.name, label: conn.label, count: 0, image: conn.image };
			existing.count += 1;
			connectorUsageCount.set(conn.id, existing);
		});
	});

	const sharedConnectors = Array.from(connectorUsageCount.values()).sort((a, b) => b.count - a.count);

	const summaryStats = {
		totalLikedSongs: likedSongs.length,
		pairwiseConnectionsCount: pairwiseConnections.length,
		uniqueConnectorsCount: sharedConnectors.length,
		topConnector: sharedConnectors[0]?.name || likedSongs[0]?.composers[0]?.name || likedSongs[0]?.artists[0]?.name || 'M. M. Keeravani'
	};

	return {
		likedSongs,
		pairwiseConnections,
		sharedConnectors,
		graphData: {
			nodes: Array.from(graphNodeMap.values()),
			links: graphLinks
		},
		summaryStats
	};
}

export async function getUserMusicDNA(userId = 'USR-001') {
	const likedIds = Array.from(graphStore.userLikes.get(userId) || []);
	if (likedIds.length === 0) {
		return {
			totalLikedCount: 0,
			topGenres: [],
			topMoods: [],
			topLanguages: [],
			topComposers: []
		};
	}

	const genresList: string[] = [];
	const moodsList: string[] = [];
	const languagesList: string[] = [];
	const composersList: string[] = [];

	likedIds.forEach((id) => {
		const s = graphStore.getSongDetailed(id, userId);
		if (s) {
			s.genres.forEach((g: any) => genresList.push(g.name));
			s.moods.forEach((m: any) => moodsList.push(m.name));
			s.languages.forEach((lang: any) => languagesList.push(lang.name));
			s.composers.forEach((c: any) => composersList.push(c.name));
		}
	});

	const buildDist = (list: string[], icons?: Record<string, string>) => {
		const counts: Record<string, number> = {};
		list.filter(Boolean).forEach((item) => {
			counts[item] = (counts[item] || 0) + 1;
		});
		const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
		return Object.entries(counts)
			.map(([name, count]) => ({
				name,
				percentage: Math.round((count / total) * 100),
				icon: icons?.[name] || '🎵'
			}))
			.sort((a, b) => b.percentage - a.percentage)
			.slice(0, 3);
	};

	return {
		totalLikedCount: likedIds.length,
		topGenres: buildDist(genresList, { Melody: '🎧', 'Pop / Dance': '⚡', Kuthu: '🔥', Classical: '🎻' }),
		topMoods: buildDist(moodsList, { Romantic: '❤️', 'High Energy': '🔥', Soulful: '✨', Heroic: '⚔️' }),
		topLanguages: buildDist(languagesList),
		topComposers: Array.from(new Set(composersList)).slice(0, 3)
	};
}
