import { runReadQuery, runWriteQuery, verifyCognoDBConnection } from './cognodb';
import {
	DEFAULT_SONG_IMAGE,
	DEFAULT_ALBUM_IMAGE,
	DEFAULT_ARTIST_IMAGE,
	DEFAULT_COMPOSER_IMAGE
} from '../constants/images';

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
				songCount: songCount || 100,
				artistCount: artistCount || 25,
				composerCount: composerCount || 10,
				relationshipCount: relCounts[0]?.count || 600
			};
		} catch (e) {
			console.warn('[CognoDB] Home stats query error:', e);
		}
	}

	return {
		connected: false,
		songCount: 0,
		artistCount: 0,
		composerCount: 0,
		relationshipCount: 0
	};
}

export async function getFeaturedSongs(
	userIdOrLimit: string | number = 'USR-001',
	limitParam = 50,
	customLikes?: string[]
): Promise<SongDetail[]> {
	const userId = typeof userIdOrLimit === 'string' ? userIdOrLimit : 'USR-001';
	const limit = typeof userIdOrLimit === 'number' ? userIdOrLimit : limitParam;

	const isConnected = await verifyCognoDBConnection();
	if (isConnected) {
		try {
			const records = await runReadQuery(`
				MATCH (s:Song)
				OPTIONAL MATCH (a:Artist)-[:PERFORMED]->(s)
				OPTIONAL MATCH (c:Composer)-[:COMPOSED]->(s)
				OPTIONAL MATCH (l:Lyricist)-[:WROTE]->(s)
				OPTIONAL MATCH (s)-[:PART_OF]->(alb:Album)
				OPTIONAL MATCH (s)-[:HAS_GENRE]->(g:Genre)
				OPTIONAL MATCH (s)-[:HAS_MOOD]->(m:Mood)
				OPTIONAL MATCH (s)-[:IN_LANGUAGE]->(lang:Language)
				OPTIONAL MATCH (s)-[:FEATURES]->(inst:Instrument)
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
					   collect(DISTINCT {id: l.id, name: l.name}) as lyricists,
					   {id: alb.id, title: alb.title, releaseYear: alb.releaseYear, coverImage: alb.coverImage} as album,
					   collect(DISTINCT {id: g.id, name: g.name}) as genres,
					   collect(DISTINCT {id: m.id, name: m.name}) as moods,
					   collect(DISTINCT {id: lang.id, name: lang.name}) as languages,
					   collect(DISTINCT {id: inst.id, name: inst.name, image: inst.image}) as instruments,
					   count(DISTINCT u) as likeCount,
					   (count(currUser) > 0) as isLiked
				ORDER BY s.popularity DESC, s.title ASC
				LIMIT $limit
			`, { userId, limit });

			if (records && records.length > 0) {
				return records.map((r) => ({
					id: r.id,
					title: r.title || 'Untitled Track',
					releaseYear: r.releaseYear || 2023,
					durationSeconds: r.durationSeconds || 240,
					popularity: r.popularity || 85,
					coverImage: r.coverImage || DEFAULT_SONG_IMAGE,
					artists: (r.artists || []).filter((a: any) => a.id).map((a: any) => ({ ...a, image: a.image || DEFAULT_ARTIST_IMAGE })),
					composers: (r.composers || []).filter((c: any) => c.id).map((c: any) => ({ ...c, image: c.image || DEFAULT_COMPOSER_IMAGE })),
					lyricists: (r.lyricists || []).filter((l: any) => l.id),
					album: r.album && r.album.id ? { ...r.album, coverImage: r.album.coverImage || DEFAULT_ALBUM_IMAGE } : undefined,
					genres: (r.genres || []).filter((g: any) => g.id),
					moods: (r.moods || []).filter((m: any) => m.id),
					languages: (r.languages || []).filter((l: any) => l.id),
					instruments: (r.instruments || []).filter((i: any) => i.id),
					likeCount: r.likeCount || 0,
					isLiked: customLikes !== undefined ? customLikes.includes(r.id) : Boolean(r.isLiked)
				}));
			}
		} catch (err) {
			console.error('[CognoDB] Error fetching featured songs from database:', err);
		}
	}

	return [];
}

export async function searchEntities(queryStr: string) {
	const q = queryStr.trim().toLowerCase();
	if (!q) return { songs: [], artists: [], composers: [] };

	const isConnected = await verifyCognoDBConnection();
	if (isConnected) {
		try {
			const songs = await runReadQuery(`
				MATCH (s:Song)
				WHERE toLower(s.title) CONTAINS toLower($q)
				RETURN s.id as id, s.title as name, s.coverImage as image, 'Song' as type
				LIMIT 6
			`, { q });

			const artists = await runReadQuery(`
				MATCH (a:Artist)
				WHERE toLower(a.name) CONTAINS toLower($q)
				RETURN a.id as id, a.name as name, a.image as image, 'Artist' as type
				LIMIT 6
			`, { q });

			const composers = await runReadQuery(`
				MATCH (c:Composer)
				WHERE toLower(c.name) CONTAINS toLower($q)
				RETURN c.id as id, c.name as name, c.image as image, 'Composer' as type
				LIMIT 6
			`, { q });

			return {
				songs: songs.map((s) => ({ ...s, image: s.image || DEFAULT_SONG_IMAGE })),
				artists: artists.map((a) => ({ ...a, image: a.image || DEFAULT_ARTIST_IMAGE })),
				composers: composers.map((c) => ({ ...c, image: c.image || DEFAULT_COMPOSER_IMAGE }))
			};
		} catch (err) {
			console.error('[CognoDB] Search error:', err);
		}
	}

	return { songs: [], artists: [], composers: [] };
}

export async function getSongDetail(
	songId: string,
	currentUserId = 'USR-001',
	customLikes?: string[]
): Promise<SongDetail | null> {
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
					isLiked: customLikes !== undefined ? customLikes.includes(r.id) : Boolean(r.isLiked)
				};
			}
		} catch (err) {
			console.error('[CognoDB] Error fetching song detail:', err);
		}
	}

	return null;
}

export async function toggleLikeSong(
	songId: string,
	userId = 'USR-001',
	customLikes?: string[]
): Promise<{ isLiked: boolean; allLikes: string[] }> {
	const isConnected = await verifyCognoDBConnection();
	let newStatus = false;
	let allLikes: string[] = customLikes ? [...customLikes] : [];

	if (isConnected) {
		try {
			// Check if already liked in CognoDB
			const check = await runReadQuery(`
				MATCH (u:User {id: $userId})-[r:LIKED]->(s:Song {id: $songId})
				RETURN count(r) as count
			`, { userId, songId });

			const isCurrentlyLiked = check[0]?.count > 0 || (customLikes ? customLikes.includes(songId) : false);

			if (isCurrentlyLiked) {
				await runWriteQuery(`
					MATCH (u:User {id: $userId})-[r:LIKED]->(s:Song {id: $songId})
					DELETE r
				`, { userId, songId });
				newStatus = false;
				allLikes = allLikes.filter((id) => id !== songId);
			} else {
				await runWriteQuery(`
					MERGE (u:User {id: $userId})
					MERGE (s:Song {id: $songId})
					MERGE (u)-[:LIKED]->(s)
				`, { userId, songId });
				newStatus = true;
				if (!allLikes.includes(songId)) allLikes.push(songId);
			}

			// Get all likes for this user
			const updated = await runReadQuery<{ songId: string }>(`
				MATCH (u:User {id: $userId})-[:LIKED]->(s:Song)
				RETURN s.id as songId
			`, { userId });
			allLikes = updated.map((u) => u.songId);
		} catch (err) {
			console.error('[CognoDB] Error syncing like to CognoDB:', err);
		}
	} else if (customLikes !== undefined) {
		if (customLikes.includes(songId)) {
			allLikes = customLikes.filter((id) => id !== songId);
			newStatus = false;
		} else {
			allLikes = [...customLikes, songId];
			newStatus = true;
		}
	}

	return { isLiked: newStatus, allLikes };
}

export async function getUserLikedSongIds(userId = 'USR-001', customLikes?: string[]): Promise<string[]> {
	if (customLikes !== undefined && customLikes.length > 0) {
		return customLikes;
	}

	const isConnected = await verifyCognoDBConnection();
	if (isConnected) {
		try {
			const records = await runReadQuery<{ songId: string }>(
				`MATCH (u:User {id: $userId})-[:LIKED]->(s:Song) RETURN s.id as songId`,
				{ userId }
			);
			if (records && records.length > 0) {
				return records.map((r) => r.songId).filter(Boolean);
			}
		} catch (e) {
			console.warn('[CognoDB] Could not read user likes from database:', e);
		}
	}

	return customLikes || [];
}

export async function getExplainableRecommendations(
	userId = 'USR-001',
	customLikes?: string[]
): Promise<Recommendation[]> {
	const isConnected = await verifyCognoDBConnection();
	if (!isConnected) return [];

	try {
		const likedIds = await getUserLikedSongIds(userId, customLikes);
		if (likedIds.length === 0) return [];

		// Multi-hop path traversal query directly on CognoDB server
		const records = await runReadQuery(`
			MATCH (liked:Song)
			WHERE liked.id IN $likedIds
			MATCH (liked)-[r1]-(connector)
			WHERE NOT connector:User
			MATCH (connector)-[r2]-(cand:Song)
			WHERE NOT cand.id IN $likedIds
			OPTIONAL MATCH (cand)-[:PART_OF]->(alb:Album)
			OPTIONAL MATCH (art:Artist)-[:PERFORMED]->(cand)
			OPTIONAL MATCH (cmp:Composer)-[:COMPOSED]->(cand)
			OPTIONAL MATCH (lyr:Lyricist)-[:WROTE]->(cand)
			OPTIONAL MATCH (cand)-[:HAS_GENRE]->(gnr:Genre)
			OPTIONAL MATCH (cand)-[:HAS_MOOD]->(mod:Mood)
			OPTIONAL MATCH (cand)-[:IN_LANGUAGE]->(lng:Language)
			OPTIONAL MATCH (cand)-[:FEATURES]->(ins:Instrument)
			RETURN cand.id as id,
				   cand.title as title,
				   cand.releaseYear as releaseYear,
				   cand.durationSeconds as durationSeconds,
				   cand.popularity as popularity,
				   cand.coverImage as coverImage,
				   {id: alb.id, title: alb.title, releaseYear: alb.releaseYear, coverImage: alb.coverImage} as album,
				   collect(DISTINCT art.name) as artists,
				   collect(DISTINCT cmp.name) as composers,
				   collect(DISTINCT lyr.name) as lyricists,
				   collect(DISTINCT gnr.name) as genres,
				   collect(DISTINCT mod.name) as moods,
				   collect(DISTINCT lng.name) as languages,
				   collect(DISTINCT ins.name) as instruments,
				   collect(DISTINCT {
					 likedTitle: liked.title,
					 likedSongId: liked.id,
					 connectorType: head(labels(connector)),
					 connectorName: coalesce(connector.name, connector.title, 'Connected Node'),
					 points: 20
				   }) as pathLinks,
				   count(DISTINCT connector) as sharedConnections
			ORDER BY sharedConnections DESC, cand.popularity DESC
			LIMIT 20
		`, { likedIds });

		if (!records || records.length === 0) return [];

		return records.map((r) => {
			const links = (r.pathLinks || []).filter((p: any) => p.likedTitle && p.connectorName);
			const baseScore = Math.min(99, 65 + (r.sharedConnections || 1) * 8);
			const primaryLink = links[0];
			const pathDescription = primaryLink
				? `Liked '${primaryLink.likedTitle}' ➔ ${primaryLink.connectorType} (${primaryLink.connectorName}) ➔ '${r.title}'`
				: 'Multi-hop graph path connection from your liked tracks.';

			const reasons: RecommendationReason[] = links.slice(0, 4).map((l: any) => ({
				rule: `Shared ${l.connectorType}`,
				points: 20,
				explanation: `Connected through ${l.connectorType} '${l.connectorName}' from '${l.likedTitle}'.`
			}));

			return {
				song: {
					id: r.id,
					title: r.title || 'Untitled Track',
					releaseYear: r.releaseYear || 2023,
					durationSeconds: r.durationSeconds || 240,
					popularity: r.popularity || 85,
					coverImage: r.coverImage || DEFAULT_SONG_IMAGE
				},
				album: r.album && r.album.id ? { ...r.album, coverImage: r.album.coverImage || DEFAULT_ALBUM_IMAGE } : undefined,
				artists: (r.artists || []).filter(Boolean),
				composers: (r.composers || []).filter(Boolean),
				lyricists: (r.lyricists || []).filter(Boolean),
				genres: (r.genres || []).filter(Boolean),
				moods: (r.moods || []).filter(Boolean),
				language: r.languages?.[0] || 'Music',
				instruments: (r.instruments || []).filter(Boolean),
				score: baseScore,
				reasons,
				pathLinks: links,
				pathDescription,
				isLiked: false
			};
		});
	} catch (err) {
		console.error('[CognoDB] Error running recommendation Cypher query:', err);
		return [];
	}
}

export async function getLikedSongsConnections(userId = 'USR-001', customLikes?: string[]) {
	const isConnected = await verifyCognoDBConnection();
	if (!isConnected) {
		return {
			likedSongs: [],
			pairwiseConnections: [],
			sharedConnectors: [],
			graphData: { nodes: [], links: [] },
			summaryStats: {
				totalLikedSongs: 0,
				pairwiseConnectionsCount: 0,
				uniqueConnectorsCount: 0,
				topConnector: 'None'
			}
		};
	}

	try {
		const likedIds = await getUserLikedSongIds(userId, customLikes);
		if (likedIds.length === 0) {
			return {
				likedSongs: [],
				pairwiseConnections: [],
				sharedConnectors: [],
				graphData: { nodes: [], links: [] },
				summaryStats: {
					totalLikedSongs: 0,
					pairwiseConnectionsCount: 0,
					uniqueConnectorsCount: 0,
					topConnector: 'None'
				}
			};
		}

		// Fetch liked songs details from CognoDB
		const likedSongsRecords = await runReadQuery(`
			MATCH (s:Song)
			WHERE s.id IN $likedIds
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
				   {id: alb.id, title: alb.title, releaseYear: alb.releaseYear, coverImage: alb.coverImage} as album,
				   collect(DISTINCT {id: g.id, name: g.name}) as genres,
				   collect(DISTINCT {id: m.id, name: m.name}) as moods,
				   collect(DISTINCT {id: lang.id, name: lang.name}) as languages
		`, { likedIds });

		const likedSongs: SongDetail[] = likedSongsRecords.map((r) => ({
			id: r.id,
			title: r.title,
			releaseYear: r.releaseYear,
			durationSeconds: r.durationSeconds,
			popularity: r.popularity,
			coverImage: r.coverImage || DEFAULT_SONG_IMAGE,
			artists: (r.artists || []).filter((a: any) => a.id).map((a: any) => ({ ...a, image: a.image || DEFAULT_ARTIST_IMAGE })),
			composers: (r.composers || []).filter((c: any) => c.id).map((c: any) => ({ ...c, image: c.image || DEFAULT_COMPOSER_IMAGE })),
			lyricists: [],
			album: r.album && r.album.id ? { ...r.album, coverImage: r.album.coverImage || DEFAULT_ALBUM_IMAGE } : undefined,
			genres: (r.genres || []).filter((g: any) => g.id),
			moods: (r.moods || []).filter((m: any) => m.id),
			languages: (r.languages || []).filter((l: any) => l.id),
			instruments: [],
			likeCount: 1,
			isLiked: true
		}));

		const graphNodeMap = new Map<string, any>();
		const graphLinks: any[] = [];
		const pairwiseMap = new Map<string, any>();

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
		});

		// Find pairwise shared creators / albums / genres between liked tracks
		for (let i = 0; i < likedSongs.length; i++) {
			for (let j = i + 1; j < likedSongs.length; j++) {
				const s1 = likedSongs[i];
				const s2 = likedSongs[j];

				const connectors: any[] = [];
				const relTypes = new Set<string>();

				if (s1.album && s2.album && s1.album.id === s2.album.id) {
					connectors.push({ id: s1.album.id, label: 'Album', name: s1.album.title, image: s1.album.coverImage });
					relTypes.add('Album');
				}

				s1.composers.forEach((c1: any) => {
					if (s2.composers.some((c2: any) => c2.id === c1.id)) {
						connectors.push({ id: c1.id, label: 'Composer', name: c1.name, image: c1.image });
						relTypes.add('Composer');
					}
				});

				s1.artists.forEach((a1: any) => {
					if (s2.artists.some((a2: any) => a2.id === a1.id)) {
						connectors.push({ id: a1.id, label: 'Artist', name: a1.name, image: a1.image });
						relTypes.add('Artist');
					}
				});

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
			topConnector: sharedConnectors[0]?.name || likedSongs[0]?.composers[0]?.name || likedSongs[0]?.artists[0]?.name || 'N/A'
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
		console.error('[CognoDB] Error in liked songs connections:', err);
		return {
			likedSongs: [],
			pairwiseConnections: [],
			sharedConnectors: [],
			graphData: { nodes: [], links: [] },
			summaryStats: {
				totalLikedSongs: 0,
				pairwiseConnectionsCount: 0,
				uniqueConnectorsCount: 0,
				topConnector: 'None'
			}
		};
	}
}

export async function getUserMusicDNA(userId = 'USR-001', customLikes?: string[]) {
	const isConnected = await verifyCognoDBConnection();
	if (!isConnected) {
		return {
			totalLikedCount: 0,
			topGenres: [],
			topMoods: [],
			topLanguages: [],
			topComposers: []
		};
	}

	try {
		const likedIds = await getUserLikedSongIds(userId, customLikes);
		if (likedIds.length === 0) {
			return {
				totalLikedCount: 0,
				topGenres: [],
				topMoods: [],
				topLanguages: [],
				topComposers: []
			};
		}

		const records = await runReadQuery(`
			MATCH (s:Song)
			WHERE s.id IN $likedIds
			OPTIONAL MATCH (s)-[:HAS_GENRE]->(g:Genre)
			OPTIONAL MATCH (s)-[:HAS_MOOD]->(m:Mood)
			OPTIONAL MATCH (s)-[:IN_LANGUAGE]->(lang:Language)
			OPTIONAL MATCH (c:Composer)-[:COMPOSED]->(s)
			RETURN collect(g.name) as genres,
				   collect(m.name) as moods,
				   collect(lang.name) as languages,
				   collect(c.name) as composers
		`, { likedIds });

		const genresList: string[] = records[0]?.genres || [];
		const moodsList: string[] = records[0]?.moods || [];
		const languagesList: string[] = records[0]?.languages || [];
		const composersList: string[] = records[0]?.composers || [];

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
			topComposers: Array.from(new Set(composersList)).filter(Boolean).slice(0, 3)
		};
	} catch (err) {
		console.error('[CognoDB] Error computing music DNA:', err);
		return {
			totalLikedCount: 0,
			topGenres: [],
			topMoods: [],
			topLanguages: [],
			topComposers: []
		};
	}
}

export async function findConnection(startQuery: string, endQuery: string) {
	if (!startQuery || !endQuery) {
		return { found: false, nodes: [], relationships: [] };
	}

	const isConnected = await verifyCognoDBConnection();
	if (isConnected) {
		try {
			const records = await runReadQuery(`
				MATCH (start), (end)
				WHERE (toLower(start.title) CONTAINS toLower($startQuery) OR toLower(start.name) CONTAINS toLower($startQuery))
				  AND (toLower(end.title) CONTAINS toLower($endQuery) OR toLower(end.name) CONTAINS toLower($endQuery))
				  AND start <> end
				MATCH p = shortestPath((start)-[*..4]-(end))
				RETURN [n in nodes(p) | {
				  id: n.id,
				  label: head(labels(n)),
				  name: coalesce(n.name, n.title, 'Node'),
				  image: coalesce(n.image, n.coverImage, n.avatar, '')
				}] as pathNodes,
				[r in relationships(p) | type(r)] as pathRels
				LIMIT 1
			`, { startQuery: startQuery.trim(), endQuery: endQuery.trim() });

			if (records.length && records[0].pathNodes) {
				return {
					found: true,
					nodes: records[0].pathNodes,
					relationships: records[0].pathRels || []
				};
			}
		} catch (err) {
			console.error('[CognoDB] Error finding shortest path:', err);
		}
	}

	return { found: false, nodes: [], relationships: [] };
}

export async function getArtistDetail(artistName: string) {
	const isConnected = await verifyCognoDBConnection();
	if (isConnected) {
		try {
			const records = await runReadQuery(`
				MATCH (a)
				WHERE (a:Artist OR a:Composer) AND toLower(a.name) = toLower($artistName)
				OPTIONAL MATCH (a)-[:PERFORMED|COMPOSED]->(s:Song)
				OPTIONAL MATCH (s)<-[:PERFORMED|COMPOSED]-(collab)
				WHERE collab <> a
				RETURN a.id as id,
					   a.name as name,
					   a.country as country,
					   a.image as image,
					   head(labels(a)) as label,
					   collect(DISTINCT {
						 id: s.id,
						 title: s.title,
						 releaseYear: s.releaseYear,
						 coverImage: s.coverImage
					   }) as songs,
					   collect(DISTINCT {
						 id: collab.id,
						 name: collab.name,
						 image: collab.image,
						 label: head(labels(collab))
					   }) as collaborators
			`, { artistName: artistName.trim() });

			if (records.length && records[0].id) {
				const r = records[0];
				return {
					artist: {
						id: r.id,
						name: r.name,
						country: r.country || 'India',
						image: r.image || (r.label === 'Composer' ? DEFAULT_COMPOSER_IMAGE : DEFAULT_ARTIST_IMAGE),
						label: r.label
					},
					songs: (r.songs || []).filter((s: any) => s.id),
					collaborators: (r.collaborators || []).filter((c: any) => c.id).slice(0, 6)
				};
			}
		} catch (err) {
			console.error('[CognoDB] Error fetching artist detail:', err);
		}
	}

	return {
		artist: null,
		songs: [],
		collaborators: []
	};
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
	const instId = `INS-${Date.now()}`;

	const isConnected = await verifyCognoDBConnection();
	if (isConnected) {
		try {
			await runWriteQuery(`
				MERGE (s:Song {id: $songId})
				SET s.title = $title,
				    s.releaseYear = $releaseYear,
				    s.durationSeconds = $durationSeconds,
				    s.popularity = 85,
				    s.coverImage = $coverImage

				MERGE (a:Artist {name: $artistName})
				ON CREATE SET a.id = $artistId, a.country = 'India', a.image = $artistImage
				MERGE (a)-[:PERFORMED]->(s)

				MERGE (c:Composer {name: $composerName})
				ON CREATE SET c.id = $composerId, c.country = 'India', c.image = $composerImage
				MERGE (c)-[:COMPOSED]->(s)

				MERGE (g:Genre {name: $genreName})
				ON CREATE SET g.id = $genreId
				MERGE (s)-[:HAS_GENRE]->(g)

				MERGE (m:Mood {name: $moodName})
				ON CREATE SET m.id = $moodId
				MERGE (s)-[:HAS_MOOD]->(m)

				MERGE (lang:Language {name: $languageName})
				ON CREATE SET lang.id = $langId
				MERGE (s)-[:IN_LANGUAGE]->(lang)
			`, {
				songId,
				title: params.title,
				releaseYear: params.releaseYear || 2023,
				durationSeconds: params.durationSeconds || 240,
				coverImage: DEFAULT_SONG_IMAGE,
				artistName: params.artistName,
				artistId,
				artistImage: DEFAULT_ARTIST_IMAGE,
				composerName: params.composerName,
				composerId,
				composerImage: DEFAULT_COMPOSER_IMAGE,
				genreName: params.genreName,
				genreId,
				moodName: params.moodName,
				moodId,
				languageName: params.languageName,
				langId
			});

			if (params.albumTitle) {
				await runWriteQuery(`
					MATCH (s:Song {id: $songId})
					MERGE (alb:Album {title: $albumTitle})
					ON CREATE SET alb.id = $albumId, alb.releaseYear = $releaseYear, alb.coverImage = $albumImage
					MERGE (s)-[:PART_OF]->(alb)
				`, {
					songId,
					albumTitle: params.albumTitle,
					albumId,
					releaseYear: params.releaseYear || 2023,
					albumImage: DEFAULT_ALBUM_IMAGE
				});
			}

			if (params.lyricistName) {
				await runWriteQuery(`
					MATCH (s:Song {id: $songId})
					MERGE (l:Lyricist {name: $lyricistName})
					ON CREATE SET l.id = $lyricistId, l.country = 'India'
					MERGE (l)-[:WROTE]->(s)
				`, {
					songId,
					lyricistName: params.lyricistName,
					lyricistId
				});
			}

			if (params.instrumentName) {
				await runWriteQuery(`
					MATCH (s:Song {id: $songId})
					MERGE (inst:Instrument {name: $instrumentName})
					ON CREATE SET inst.id = $instId
					MERGE (s)-[:FEATURES]->(inst)
				`, {
					songId,
					instrumentName: params.instrumentName,
					instId
				});
			}
		} catch (e) {
			console.error('[CognoDB] Could not write song to CognoDB:', e);
		}
	}

	return songId;
}

export async function getGraphExplorerData(labelFilter = 'ALL', limit = 25) {
	const isConnected = await verifyCognoDBConnection();
	if (isConnected) {
		try {
			const nodesRecords = await runReadQuery(`
				MATCH (s:Song)
				OPTIONAL MATCH (a:Artist)-[:PERFORMED]->(s)
				OPTIONAL MATCH (c:Composer)-[:COMPOSED]->(s)
				OPTIONAL MATCH (s)-[:PART_OF]->(alb:Album)
				RETURN s.id as songId, s.title as songTitle, s.coverImage as songImage,
				       alb.id as albumId, alb.title as albumTitle, alb.coverImage as albumImage,
				       collect(DISTINCT {id: a.id, name: a.name, image: a.image}) as artists,
				       collect(DISTINCT {id: c.id, name: c.name, image: c.image}) as composers
				LIMIT $limit
			`, { limit });

			const nodeMap = new Map<string, any>();
			const links: any[] = [];

			nodesRecords.forEach((row) => {
				if (!nodeMap.has(row.songId)) {
					nodeMap.set(row.songId, {
						id: row.songId,
						label: 'Song',
						name: row.songTitle,
						image: row.songImage || DEFAULT_SONG_IMAGE
					});
				}

				if (row.albumId && (!labelFilter || labelFilter === 'ALL' || labelFilter === 'Album')) {
					if (!nodeMap.has(row.albumId)) {
						nodeMap.set(row.albumId, {
							id: row.albumId,
							label: 'Album',
							name: row.albumTitle,
							image: row.albumImage || DEFAULT_ALBUM_IMAGE
						});
					}
					links.push({ source: row.songId, target: row.albumId, type: 'PART_OF' });
				}

				(row.artists || []).forEach((a: any) => {
					if (a.id && (!labelFilter || labelFilter === 'ALL' || labelFilter === 'Artist')) {
						if (!nodeMap.has(a.id)) {
							nodeMap.set(a.id, {
								id: a.id,
								label: 'Artist',
								name: a.name,
								image: a.image || DEFAULT_ARTIST_IMAGE
							});
						}
						links.push({ source: a.id, target: row.songId, type: 'PERFORMED' });
					}
				});

				(row.composers || []).forEach((c: any) => {
					if (c.id && (!labelFilter || labelFilter === 'ALL' || labelFilter === 'Composer')) {
						if (!nodeMap.has(c.id)) {
							nodeMap.set(c.id, {
								id: c.id,
								label: 'Composer',
								name: c.name,
								image: c.image || DEFAULT_COMPOSER_IMAGE
							});
						}
						links.push({ source: c.id, target: row.songId, type: 'COMPOSED' });
					}
				});
			});

			return {
				nodes: Array.from(nodeMap.values()),
				links
			};
		} catch (err) {
			console.error('[CognoDB] Graph explorer query error:', err);
		}
	}

	return { nodes: [], links: [] };
}
