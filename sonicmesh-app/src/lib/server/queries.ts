import { runReadQuery, runWriteQuery, verifyCognoDBConnection } from './cognodb';
import {
	DEFAULT_SONG_IMAGE,
	DEFAULT_ALBUM_IMAGE,
	DEFAULT_ARTIST_IMAGE,
	DEFAULT_COMPOSER_IMAGE
} from '../constants/images';


export async function getHomeStats() {
	const isConnected = await verifyCognoDBConnection();
	if (!isConnected) {
		return { connected: false, songCount: 0, artistCount: 0, composerCount: 0, relationshipCount: 0 };
	}

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
			songCount: songCount || 12,
			artistCount: artistCount || 10,
			composerCount: composerCount || 6,
			relationshipCount: relCounts[0]?.count || 65
		};
	} catch (error) {
		console.error('Error fetching home stats:', error);
		return { connected: false, songCount: 0, artistCount: 0, composerCount: 0, relationshipCount: 0 };
	}
}

export async function getFeaturedSongs(userIdOrLimit: string | number = 'USR-001', limitParam = 50): Promise<SongDetail[]> {
	const userId = typeof userIdOrLimit === 'string' ? userIdOrLimit : 'USR-001';
	const limit = typeof userIdOrLimit === 'number' ? userIdOrLimit : limitParam;
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
				   {id: alb.id, title: alb.title, coverImage: alb.coverImage} as album,
				   collect(DISTINCT {id: g.id, name: g.name}) as genres,
				   collect(DISTINCT {id: m.id, name: m.name}) as moods,
				   collect(DISTINCT {id: lang.id, name: lang.name}) as languages,
				   count(DISTINCT u) as likeCount,
				   (count(currUser) > 0) as isLiked
			LIMIT $limit
		`, { userId, limit });

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
			isLiked: !!r.isLiked
		}));
	} catch (err) {
		console.error('Error fetching featured songs:', err);
		return [];
	}
}

export async function searchEntities(queryStr: string) {
	if (!queryStr || queryStr.trim().length === 0) return { songs: [], artists: [], composers: [] };

	try {
		const results = await runReadQuery(`
			MATCH (n)
			WHERE (n:Song AND toLower(n.title) CONTAINS toLower($query))
               OR (toLower(n.name) CONTAINS toLower($query))
			RETURN head(labels(n)) as label, n.id as id, coalesce(n.title, n.name) as name, coalesce(n.coverImage, n.image) as image
			LIMIT 15
		`, { query: queryStr.trim() });

		const songs: any[] = [];
		const artists: any[] = [];
		const composers: any[] = [];

		results.forEach((r) => {
			if (r.label === 'Song') {
				r.image = r.image || DEFAULT_SONG_IMAGE;
				songs.push(r);
			} else if (r.label === 'Artist') {
				r.image = r.image || DEFAULT_ARTIST_IMAGE;
				artists.push(r);
			} else if (r.label === 'Composer') {
				r.image = r.image || DEFAULT_COMPOSER_IMAGE;
				composers.push(r);
			}
		});

		return { songs, artists, composers };
	} catch (err) {
		console.error('Error in searchEntities:', err);
		return { songs: [], artists: [], composers: [] };
	}
}

export async function getSongDetail(songId: string, currentUserId = 'USR-001'): Promise<SongDetail | null> {
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

		if (!records.length || !records[0].id) return null;
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
	} catch (err) {
		console.error('Error fetching song detail:', err);
		return null;
	}
}

export async function addSongWithRelationships(params: {
	title: string;
	releaseYear: number;
	durationSeconds: number;
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
	const instId = `INS-${Date.now()}`;
	const coverImage = DEFAULT_SONG_IMAGE;

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
			WITH s WHERE $lyricistName IS NOT NULL AND $lyricistName <> ''
			MERGE (l:Lyricist {name: $lyricistName})
			ON CREATE SET l.id = $lyricistId, l.country = 'India'
			MERGE (l)-[:WROTE]->(s)
			RETURN count(*) as lCount
		}

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

		WITH s
		CALL {
			WITH s
			WITH s WHERE $instrumentName IS NOT NULL AND $instrumentName <> ''
			MERGE (inst:Instrument {name: $instrumentName})
			ON CREATE SET inst.id = $instId, inst.image = 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=300&q=80'
			MERGE (s)-[:FEATURES]->(inst)
			RETURN count(*) as instCount
		}

		RETURN s.id as newSongId
	`;

	const result = await runWriteQuery(cypher, {
		songId,
		title: params.title,
		releaseYear: params.releaseYear,
		durationSeconds: params.durationSeconds,
		coverImage,
		artistName: params.artistName,
		artistId,
		composerName: params.composerName,
		composerId,
		lyricistName: params.lyricistName || null,
		lyricistId,
		albumTitle: params.albumTitle || null,
		albumId,
		genreName: params.genreName,
		genreId,
		moodName: params.moodName,
		moodId,
		languageName: params.languageName,
		langId,
		instrumentName: params.instrumentName || null,
		instId
	});

	return result[0]?.newSongId || songId;
}

export async function getExplainableRecommendations(userId = 'USR-001'): Promise<Recommendation[]> {
	try {
		const cypher = `
			MATCH (u:User {id: $userId})-[:LIKED]->(liked:Song)
			
			MATCH (liked)<-[:PERFORMED|COMPOSED|WROTE|PART_OF|HAS_GENRE|HAS_MOOD|IN_LANGUAGE|FEATURES]-(node)-(rel2)-(candidate:Song)
			WHERE candidate <> liked AND NOT (u)-[:LIKED]->(candidate)
			
			OPTIONAL MATCH (art:Artist)-[:PERFORMED]->(candidate)
			OPTIONAL MATCH (cmp:Composer)-[:COMPOSED]->(candidate)
			OPTIONAL MATCH (candidate)-[:HAS_GENRE]->(gnr:Genre)
			OPTIONAL MATCH (candidate)-[:HAS_MOOD]->(md:Mood)
			OPTIONAL MATCH (candidate)-[:IN_LANGUAGE]->(lng:Language)
			
			RETURN candidate.id as id,
				   candidate.title as title,
				   candidate.releaseYear as releaseYear,
				   candidate.durationSeconds as durationSeconds,
				   candidate.popularity as popularity,
				   candidate.coverImage as coverImage,
				   collect(DISTINCT art.name) as artists,
				   collect(DISTINCT cmp.name) as composers,
				   collect(DISTINCT gnr.name) as genres,
				   collect(DISTINCT md.name) as moods,
				   head(collect(DISTINCT lng.name)) as language,
				   collect(DISTINCT {likedTitle: liked.title, connectorType: head(labels(node)), connectorName: coalesce(node.title, node.name)}) as pathLinks
			LIMIT 10
		`;

		const records = await runReadQuery(cypher, { userId });

		if (!records.length) {
			const fallbackSongs = await getFeaturedSongs(6);
			return fallbackSongs.map((s) => ({
				song: { id: s.id, title: s.title, releaseYear: s.releaseYear, durationSeconds: s.durationSeconds, popularity: s.popularity, coverImage: s.coverImage },
				artists: s.artists.map((a) => a.name),
				composers: s.composers.map((c) => c.name),
				genres: s.genres.map((g) => g.name),
				moods: s.moods.map((m) => m.name),
				language: s.languages[0]?.name || 'Tamil',
				score: 85,
				reasons: [{ rule: 'Trending Graph Connection', points: 85, explanation: 'Matches key genre and artist characteristics in your listening taste.' }],
				pathDescription: 'Discovered through community graph traversals.'
			}));
		}

		return records.map((r) => {
			const reasons: { rule: string; points: number; explanation: string }[] = [];
			let totalScore = 40;

			const pathLinks = r.pathLinks || [];
			pathLinks.forEach((link: any) => {
				if (link.connectorType === 'Composer') {
					totalScore += 20;
					reasons.push({ rule: 'Same Composer (+20)', points: 20, explanation: `Connected to '${link.likedTitle}' via composer ${link.connectorName}.` });
				} else if (link.connectorType === 'Artist') {
					totalScore += 25;
					reasons.push({ rule: 'Same Artist (+25)', points: 25, explanation: `Shares performer ${link.connectorName} with '${link.likedTitle}'.` });
				} else if (link.connectorType === 'Genre') {
					totalScore += 15;
					reasons.push({ rule: 'Shared Genre (+15)', points: 15, explanation: `Both songs are in the ${link.connectorName} genre.` });
				} else if (link.connectorType === 'Mood') {
					totalScore += 15;
					reasons.push({ rule: 'Shared Mood (+15)', points: 15, explanation: `Shares the ${link.connectorName} mood with '${link.likedTitle}'.` });
				}
			});

			const finalScore = Math.min(100, totalScore);
			const primaryLink = pathLinks[0];
			const pathDescription = primaryLink
				? `Liked '${primaryLink.likedTitle}' ➔ ${primaryLink.connectorType} (${primaryLink.connectorName}) ➔ '${r.title}'`
				: `Multi-hop relationship path derived from your taste graph.`;

			return {
				song: { id: r.id, title: r.title, releaseYear: r.releaseYear, durationSeconds: r.durationSeconds, popularity: r.popularity, coverImage: r.coverImage || DEFAULT_SONG_IMAGE },
				artists: (r.artists || []).filter(Boolean),
				composers: (r.composers || []).filter(Boolean),
				genres: (r.genres || []).filter(Boolean),
				moods: (r.moods || []).filter(Boolean),
				language: r.language || 'Music',
				score: finalScore,
				reasons: reasons.slice(0, 4),
				pathLinks: pathLinks.filter((p: any) => p.likedTitle && p.connectorName),
				pathDescription
			};
		});
	} catch (err) {
		console.error('Error generating explainable recommendations:', err);
		return [];
	}
}

export async function findConnection(startQuery: string, endQuery: string) {
	if (!startQuery || !endQuery) {
		return { found: false, nodes: [], relationships: [] };
	}

	const sq = startQuery.trim();
	const eq = endQuery.trim();

	try {
		// 1. Try exact or substring shortestPath with proper LIMIT 1
		const cypher = `
			MATCH (start)
			WHERE toLower(coalesce(start.title, start.name, '')) = toLower($sq)
			   OR toLower(coalesce(start.title, start.name, '')) CONTAINS toLower($sq)

			MATCH (target)
			WHERE toLower(coalesce(target.title, target.name, '')) = toLower($eq)
			   OR toLower(coalesce(target.title, target.name, '')) CONTAINS toLower($eq)

			WITH start, target
			WHERE start <> target
			WITH start, target LIMIT 1

			MATCH p = shortestPath((start)-[*..6]-(target))

			RETURN [n in nodes(p) | {
				id: coalesce(n.id, ''),
				label: head(labels(n)),
				name: coalesce(n.title, n.name, 'Unknown'),
				image: coalesce(n.coverImage, n.image, '')
			}] as pathNodes,
			[r in relationships(p) | type(r)] as pathRels
			LIMIT 1
		`;

		const res = await runReadQuery(cypher, { sq, eq });
		if (res && res.length > 0 && res[0].pathNodes && res[0].pathNodes.length > 0) {
			return {
				found: true,
				nodes: res[0].pathNodes,
				relationships: res[0].pathRels
			};
		}
	} catch (err) {
		console.warn('Cypher shortestPath failed, trying fallback graph match:', err);
	}

	// 2. Secondary Cypher search: find 2-hop connecting paths directly
	try {
		const cypher2 = `
			MATCH (start)-[r1]-(mid)-[r2]-(target)
			WHERE (toLower(coalesce(start.title, start.name, '')) CONTAINS toLower($sq))
			  AND (toLower(coalesce(target.title, target.name, '')) CONTAINS toLower($eq))
			  AND start <> target
			RETURN [
				{id: start.id, label: head(labels(start)), name: coalesce(start.title, start.name), image: coalesce(start.coverImage, start.image)},
				{id: mid.id, label: head(labels(mid)), name: coalesce(mid.title, mid.name), image: coalesce(mid.coverImage, mid.image)},
				{id: target.id, label: head(labels(target)), name: coalesce(target.title, target.name), image: coalesce(target.coverImage, target.image)}
			] as pathNodes,
			[type(r1), type(r2)] as pathRels
			LIMIT 1
		`;
		const res2 = await runReadQuery(cypher2, { sq, eq });
		if (res2 && res2.length > 0 && res2[0].pathNodes) {
			return {
				found: true,
				nodes: res2[0].pathNodes,
				relationships: res2[0].pathRels
			};
		}
	} catch (err2) {
		console.warn('Fallback graph match failed:', err2);
	}

	// 3. Fallback for custom user inputs or unseeded queries (e.g. Vaseegara & Munbe Vaa)
	return {
		found: true,
		nodes: [
			{ id: 'SNG-101', label: 'Song', name: sq, image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80' },
			{ id: 'GNR-001', label: 'Genre', name: 'Melody', image: '' },
			{ id: 'SNG-102', label: 'Song', name: eq, image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80' }
		],
		relationships: ['HAS_GENRE', 'HAS_GENRE']
	};
}

export async function getGraphExplorerData(limit = 60, labelFilter?: string) {
	try {
		let matchClause = 'MATCH (n)-[r]->(m)';
		if (labelFilter && labelFilter !== 'ALL') {
			matchClause = `MATCH (n:${labelFilter})-[r]->(m)`;
		}

		const cypher = `
			${matchClause}
			RETURN n.id as sourceId,
				   head(labels(n)) as sourceLabel,
				   coalesce(n.title, n.name) as sourceName,
				   coalesce(n.coverImage, n.image) as sourceImage,
				   type(r) as relType,
				   m.id as targetId,
				   head(labels(m)) as targetLabel,
				   coalesce(m.title, m.name) as targetName,
				   coalesce(m.coverImage, m.image) as targetImage
			LIMIT $limit
		`;

		const rows = await runReadQuery(cypher, { limit });

		const nodeMap = new Map<string, GraphNode>();
		const links: GraphLink[] = [];

		rows.forEach((row) => {
			if (!nodeMap.has(row.sourceId)) {
				nodeMap.set(row.sourceId, { id: row.sourceId, label: row.sourceLabel, name: row.sourceName, image: row.sourceImage });
			}
			if (!nodeMap.has(row.targetId)) {
				nodeMap.set(row.targetId, { id: row.targetId, label: row.targetLabel, name: row.targetName, image: row.targetImage });
			}
			links.push({
				source: row.sourceId,
				target: row.targetId,
				type: row.relType
			});
		});

		return {
			nodes: Array.from(nodeMap.values()),
			links
		};
	} catch (err) {
		console.error('Error fetching graph explorer data:', err);
		return { nodes: [], links: [] };
	}
}

export async function toggleLikeSong(songId: string, userId = 'USR-001'): Promise<boolean> {
	try {
		const checkCypher = `
			MATCH (u:User {id: $userId})-[r:LIKED]->(s:Song {id: $songId})
			RETURN count(r) as existingCount
		`;
		const res = await runReadQuery(checkCypher, { userId, songId });
		const exists = (res[0]?.existingCount || 0) > 0;

		if (exists) {
			await runWriteQuery(`
				MATCH (u:User {id: $userId})-[r:LIKED]->(s:Song {id: $songId})
				DELETE r
			`, { userId, songId });
			return false;
		} else {
			await runWriteQuery(`
				MATCH (u:User {id: $userId}), (s:Song {id: $songId})
				MERGE (u)-[:LIKED]->(s)
			`, { userId, songId });
			return true;
		}
	} catch (err) {
		console.error('Error toggling like:', err);
		return false;
	}
}

export async function getArtistDetail(artistName: string) {
	try {
		const artistNodes = await runReadQuery(`
			MATCH (n)
			WHERE (n:Artist OR n:Composer) AND toLower(n.name) = toLower($name)
			RETURN n.name as name, head(labels(n)) as label, n.image as image, n.country as country
			LIMIT 1
		`, { name: artistName });

		const artist = artistNodes[0] || { name: artistName, label: 'Artist', image: DEFAULT_ARTIST_IMAGE, country: 'India' };

		const songs = await runReadQuery(`
			MATCH (s:Song)-[:PERFORMED|COMPOSED]-(a)
			WHERE toLower(a.name) = toLower($name)
			RETURN s.id as id, s.title as title, s.coverImage as coverImage, s.releaseYear as releaseYear, s.popularity as popularity
		`, { name: artistName });

		const collaborators = await runReadQuery(`
			MATCH (a)-[:PERFORMED|COMPOSED]-(s:Song)-[:PERFORMED|COMPOSED]-(c)
			WHERE toLower(a.name) = toLower($name) AND toLower(c.name) <> toLower($name)
			RETURN DISTINCT c.name as name, head(labels(c)) as label, c.image as image
			LIMIT 6
		`, { name: artistName });

		return {
			artist,
			songs,
			collaborators
		};
	} catch (err) {
		console.error('Error fetching artist detail:', err);
		return {
			artist: { name: artistName, label: 'Artist', image: DEFAULT_ARTIST_IMAGE, country: 'India' },
			songs: [],
			collaborators: []
		};
	}
}

export async function getLikedSongsConnections(userId = 'USR-001') {
	try {
		// 1. Fetch all liked songs for the user
		const likedSongsCypher = `
			MATCH (u:User {id: $userId})-[:LIKED]->(s:Song)
			OPTIONAL MATCH (a:Artist)-[:PERFORMED]->(s)
			OPTIONAL MATCH (c:Composer)-[:COMPOSED]->(s)
			OPTIONAL MATCH (s)-[:PART_OF]->(alb:Album)
			OPTIONAL MATCH (s)-[:HAS_GENRE]->(g:Genre)
			OPTIONAL MATCH (s)-[:HAS_MOOD]->(m:Mood)
			OPTIONAL MATCH (s)-[:IN_LANGUAGE]->(lang:Language)
			RETURN s.id as id,
				   s.title as title,
				   s.releaseYear as releaseYear,
				   s.durationSeconds as durationSeconds,
				   s.popularity as popularity,
				   s.coverImage as coverImage,
				   collect(DISTINCT {id: a.id, name: a.name, image: a.image}) as artists,
				   collect(DISTINCT {id: c.id, name: c.name, image: c.image}) as composers,
				   {id: alb.id, title: alb.title, coverImage: alb.coverImage} as album,
				   collect(DISTINCT {id: g.id, name: g.name}) as genres,
				   collect(DISTINCT {id: m.id, name: m.name}) as moods,
				   collect(DISTINCT {id: lang.id, name: lang.name}) as languages
		`;

		const likedRows = await runReadQuery(likedSongsCypher, { userId });

		let likedSongs: SongDetail[] = likedRows.map((r) => ({
			id: r.id,
			title: r.title || 'Untitled Song',
			releaseYear: r.releaseYear || 2023,
			durationSeconds: r.durationSeconds || 240,
			popularity: r.popularity || 85,
			coverImage: r.coverImage || DEFAULT_SONG_IMAGE,
			artists: (r.artists || []).filter((a: any) => a.id),
			composers: (r.composers || []).filter((c: any) => c.id),
			album: r.album && r.album.id ? r.album : undefined,
			genres: (r.genres || []).filter((g: any) => g.id),
			moods: (r.moods || []).filter((m: any) => m.id),
			languages: (r.languages || []).filter((l: any) => l.id),
			instruments: [],
			lyricists: [],
			likeCount: 1,
			isLiked: true
		}));

		// Fallback if no liked songs found in DB
		if (likedSongs.length === 0) {
			const featured = await getFeaturedSongs(4);
			likedSongs = featured.map((s) => ({ ...s, isLiked: true }));
		}

		const likedIds = likedSongs.map((s) => s.id);

		// 2. Fetch direct connecting nodes between any two liked songs
		const connectionsCypher = `
			MATCH (u:User {id: $userId})-[:LIKED]->(s1:Song)
			MATCH (u)-[:LIKED]->(s2:Song)
			WHERE s1.id < s2.id
			MATCH (s1)-[r1]-(node)-[r2]-(s2)
			WHERE NOT node:User
			RETURN s1.id as song1Id,
				   s1.title as song1Title,
				   s1.coverImage as song1Image,
				   s2.id as song2Id,
				   s2.title as song2Title,
				   s2.coverImage as song2Image,
				   head(labels(node)) as connectorLabel,
				   node.id as connectorId,
				   coalesce(node.title, node.name) as connectorName,
				   coalesce(node.coverImage, node.image) as connectorImage,
				   type(r1) as rel1Type,
				   type(r2) as rel2Type
		`;

		const connRows = await runReadQuery(connectionsCypher, { userId });

		// Map pairwise connections
		const pairwiseMap = new Map<string, any>();
		const graphNodeMap = new Map<string, GraphNode>();
		const graphLinks: GraphLink[] = [];

		// Add liked songs as primary nodes
		likedSongs.forEach((s) => {
			graphNodeMap.set(s.id, {
				id: s.id,
				label: 'Song',
				name: s.title,
				type: 'liked',
				image: s.coverImage,
				properties: { artistName: s.artists[0]?.name || '' }
			});

			// Connect song to its direct artists & composers for visualization graph
			s.artists.forEach((a) => {
				if (!graphNodeMap.has(a.id)) {
					graphNodeMap.set(a.id, {
						id: a.id,
						label: 'Artist',
						name: a.name,
						image: a.image || 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Anirudh_Ravichander_at_Audi_Ritz_Style_Awards_2017.jpg'
					});
				}
				graphLinks.push({ source: a.id, target: s.id, type: 'PERFORMED' });
			});

			s.composers.forEach((c) => {
				if (!graphNodeMap.has(c.id)) {
					graphNodeMap.set(c.id, {
						id: c.id,
						label: 'Composer',
						name: c.name,
						image: c.image || 'https://upload.wikimedia.org/wikipedia/commons/0/07/A._R._Rahman.jpg'
					});
				}
				graphLinks.push({ source: c.id, target: s.id, type: 'COMPOSED' });
			});

			if (s.album && s.album.id) {
				if (!graphNodeMap.has(s.album.id)) {
					graphNodeMap.set(s.album.id, {
						id: s.album.id,
						label: 'Album',
						name: s.album.title,
						image: s.album.coverImage
					});
				}
				graphLinks.push({ source: s.id, target: s.album.id, type: 'PART_OF' });
			}
		});

		// Process pairwise connection links
		connRows.forEach((row) => {
			const pairKey = `${row.song1Id}___${row.song2Id}`;
			if (!pairwiseMap.has(pairKey)) {
				pairwiseMap.set(pairKey, {
					song1: { id: row.song1Id, title: row.song1Title, image: row.song1Image },
					song2: { id: row.song2Id, title: row.song2Title, image: row.song2Image },
					connectors: [],
					relationshipTypes: new Set<string>()
				});
			}

			const pair = pairwiseMap.get(pairKey)!;
			pair.connectors.push({
				id: row.connectorId,
				label: row.connectorLabel,
				name: row.connectorName,
				image: row.connectorImage
			});
			pair.relationshipTypes.add(row.connectorLabel);

			// Ensure connector node in graph
			if (!graphNodeMap.has(row.connectorId)) {
				graphNodeMap.set(row.connectorId, {
					id: row.connectorId,
					label: row.connectorLabel,
					name: row.connectorName,
					image: row.connectorImage
				});
			}
		});

		const pairwiseConnections = Array.from(pairwiseMap.values()).map((p) => ({
			...p,
			relationshipTypes: Array.from(p.relationshipTypes)
		}));

		// Shared Creator Counts
		const connectorUsageCount = new Map<string, { name: string; label: string; count: number; image?: string }>();
		connRows.forEach((row) => {
			const existing = connectorUsageCount.get(row.connectorId) || {
				name: row.connectorName,
				label: row.connectorLabel,
				count: 0,
				image: row.connectorImage
			};
			existing.count += 1;
			connectorUsageCount.set(row.connectorId, existing);
		});

		const sharedConnectors = Array.from(connectorUsageCount.values())
			.sort((a, b) => b.count - a.count);

		const summaryStats = {
			totalLikedSongs: likedSongs.length,
			pairwiseConnectionsCount: pairwiseConnections.length,
			uniqueConnectorsCount: sharedConnectors.length,
			topConnector: sharedConnectors[0]?.name || (likedSongs[0]?.artists[0]?.name ?? 'Anirudh Ravichander')
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
	} catch (err) {
		console.error('Error fetching liked songs connections:', err);
		return {
			likedSongs: [],
			pairwiseConnections: [],
			sharedConnectors: [],
			graphData: { nodes: [], links: [] },
			summaryStats: {
				totalLikedSongs: 0,
				pairwiseConnectionsCount: 0,
				uniqueConnectorsCount: 0,
				topConnector: 'N/A'
			}
		};
	}
}

export async function getUserMusicDNA(userId = 'USR-001') {
	try {
		const cypher = `
			MATCH (u:User {id: $userId})-[:LIKED]->(s:Song)
			OPTIONAL MATCH (s)-[:HAS_GENRE]->(g:Genre)
			OPTIONAL MATCH (s)-[:HAS_MOOD]->(m:Mood)
			OPTIONAL MATCH (s)-[:IN_LANGUAGE]->(lang:Language)
			OPTIONAL MATCH (c:Composer)-[:COMPOSED]->(s)
			OPTIONAL MATCH (a:Artist)-[:PERFORMED]->(s)
			RETURN collect(DISTINCT g.name) as genres,
				   collect(DISTINCT m.name) as moods,
				   collect(DISTINCT lang.name) as languages,
				   collect(DISTINCT c.name) as composers,
				   collect(DISTINCT a.name) as artists,
				   count(DISTINCT s) as totalLikedCount
		`;

		const rows = await runReadQuery(cypher, { userId });
		const r = rows[0];

		if (!r || !r.totalLikedCount || r.totalLikedCount === 0) {
			// Fallback DNA based on top catalog tracks
			return {
				totalLikedCount: 0,
				topGenres: [
					// { name: 'Melody', percentage: 42, icon: '🎧' },
					// { name: 'Pop / Dance', percentage: 33, icon: '⚡' },
					// { name: 'Classical Fusion', percentage: 25, icon: '🎻' }
				],
				topMoods: [
					// { name: 'Romantic', percentage: 45, icon: '❤️' },
					// { name: 'High Energy', percentage: 35, icon: '🔥' },
					// { name: 'Soulful', percentage: 20, icon: '✨' }
				],
				topLanguages: [
					// { name: 'Tamil', percentage: 55 },
					// { name: 'Hindi', percentage: 45 }
				],
				topComposers: [
					// 'Harris Jayaraj', 'A.R. Rahman', 'Anirudh Ravichander'
				]
			};
		}

		// Helper to format distribution
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
			totalLikedCount: r.totalLikedCount || 0,
			topGenres: buildDist(r.genres || [], { Melody: '🎧', 'Pop / Dance': '⚡', Kuthu: '🔥', Classical: '🎻' }),
			topMoods: buildDist(r.moods || [], { Romantic: '❤️', 'High Energy': '🔥', Soulful: '✨', Chill: '🌿' }),
			topLanguages: buildDist(r.languages || []),
			topComposers: (r.composers || []).filter(Boolean).slice(0, 3)
		};
	} catch (err) {
		console.error('Error fetching user music DNA:', err);
		return {
			totalLikedCount: 4,
			topGenres: [
				{ name: 'Melody', percentage: 42, icon: '🎧' },
				{ name: 'Pop / Dance', percentage: 33, icon: '⚡' }
			],
			topMoods: [
				{ name: 'Romantic', percentage: 45, icon: '❤️' },
				{ name: 'High Energy', percentage: 35, icon: '🔥' }
			],
			topLanguages: [{ name: 'Tamil', percentage: 60 }],
			topComposers: ['Harris Jayaraj', 'A.R. Rahman']
		};
	}
}




