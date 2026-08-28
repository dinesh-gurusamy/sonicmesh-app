import fs from 'fs';
import path from 'path';
import { driver } from '../server/cognodb.js';

export async function seed() {
	const session = driver.session();
	try {
		console.log('🌱 Starting SonicMesh CognoDB seeding...');
		
		const dataPath = fs.existsSync(path.join(process.cwd(), 'src/lib/scripts/music-seed-data.json'))
			? path.join(process.cwd(), 'src/lib/scripts/music-seed-data.json')
			: path.join(process.cwd(), 'src/lib/scripts/seed-data.json');
			
		const rawData = fs.readFileSync(dataPath, 'utf-8');
		const data = JSON.parse(rawData);

		// 1. Wipe existing data
		console.log('🧹 Wiping existing nodes and relationships...');
		await session.run('MATCH (n) DETACH DELETE n');

		// 2. Unwind Nodes
		console.log('📌 Unwinding nodes with images...');
		if (data.nodes.users) {
			await session.run(
				`UNWIND $users AS u MERGE (node:User {id: u.id}) SET node.name = u.name, node.createdAt = u.created_at, node.avatar = u.avatar`,
				{ users: data.nodes.users }
			);
		}
		if (data.nodes.songs) {
			await session.run(
				`UNWIND $songs AS s MERGE (node:Song {id: s.id}) SET node.title = s.title, node.releaseYear = s.release_year, node.durationSeconds = s.duration_seconds, node.popularity = s.popularity, node.coverImage = s.cover_image`,
				{ songs: data.nodes.songs }
			);
		}
		if (data.nodes.artists) {
			await session.run(
				`UNWIND $artists AS a MERGE (node:Artist {id: a.id}) SET node.name = a.name, node.country = a.country, node.image = a.image`,
				{ artists: data.nodes.artists }
			);
		}
		if (data.nodes.composers) {
			await session.run(
				`UNWIND $composers AS c MERGE (node:Composer {id: c.id}) SET node.name = c.name, node.country = c.country, node.image = c.image`,
				{ composers: data.nodes.composers }
			);
		}
		if (data.nodes.lyricists) {
			await session.run(
				`UNWIND $lyricists AS l MERGE (node:Lyricist {id: l.id}) SET node.name = l.name, node.country = l.country`,
				{ lyricists: data.nodes.lyricists }
			);
		}
		if (data.nodes.albums) {
			await session.run(
				`UNWIND $albums AS alb MERGE (node:Album {id: alb.id}) SET node.title = alb.title, node.releaseYear = alb.release_year, node.coverImage = alb.cover_image`,
				{ albums: data.nodes.albums }
			);
		}
		if (data.nodes.genres) {
			await session.run(
				`UNWIND $genres AS g MERGE (node:Genre {id: g.id}) SET node.name = g.name`,
				{ genres: data.nodes.genres }
			);
		}
		if (data.nodes.moods) {
			await session.run(
				`UNWIND $moods AS m MERGE (node:Mood {id: m.id}) SET node.name = m.name`,
				{ moods: data.nodes.moods }
			);
		}
		if (data.nodes.languages) {
			await session.run(
				`UNWIND $languages AS lang MERGE (node:Language {id: lang.id}) SET node.name = lang.name`,
				{ languages: data.nodes.languages }
			);
		}
		if (data.nodes.instruments) {
			await session.run(
				`UNWIND $instruments AS inst MERGE (node:Instrument {id: inst.id}) SET node.name = inst.name, node.image = inst.image`,
				{ instruments: data.nodes.instruments }
			);
		}

		// 3. Unwind Relationships
		console.log('🔗 Creating typed relationships...');
		if (data.relationships.performed) {
			await session.run(
				`UNWIND $rels AS r MATCH (a:Artist {id: r.from}), (s:Song {id: r.to}) MERGE (a)-[:PERFORMED]->(s)`,
				{ rels: data.relationships.performed }
			);
		}
		if (data.relationships.composed) {
			await session.run(
				`UNWIND $rels AS r MATCH (c:Composer {id: r.from}), (s:Song {id: r.to}) MERGE (c)-[:COMPOSED]->(s)`,
				{ rels: data.relationships.composed }
			);
		}
		if (data.relationships.wrote) {
			await session.run(
				`UNWIND $rels AS r MATCH (l:Lyricist {id: r.from}), (s:Song {id: r.to}) MERGE (l)-[:WROTE]->(s)`,
				{ rels: data.relationships.wrote }
			);
		}
		if (data.relationships.part_of) {
			await session.run(
				`UNWIND $rels AS r MATCH (s:Song {id: r.from}), (alb:Album {id: r.to}) MERGE (s)-[:PART_OF]->(alb)`,
				{ rels: data.relationships.part_of }
			);
		}
		if (data.relationships.has_genre) {
			await session.run(
				`UNWIND $rels AS r MATCH (s:Song {id: r.from}), (g:Genre {id: r.to}) MERGE (s)-[:HAS_GENRE]->(g)`,
				{ rels: data.relationships.has_genre }
			);
		}
		if (data.relationships.has_mood) {
			await session.run(
				`UNWIND $rels AS r MATCH (s:Song {id: r.from}), (m:Mood {id: r.to}) MERGE (s)-[:HAS_MOOD]->(m)`,
				{ rels: data.relationships.has_mood }
			);
		}
		if (data.relationships.in_language) {
			await session.run(
				`UNWIND $rels AS r MATCH (s:Song {id: r.from}), (lang:Language {id: r.to}) MERGE (s)-[:IN_LANGUAGE]->(lang)`,
				{ rels: data.relationships.in_language }
			);
		}
		if (data.relationships.features) {
			await session.run(
				`UNWIND $rels AS r MATCH (s:Song {id: r.from}), (inst:Instrument {id: r.to}) MERGE (s)-[:FEATURES]->(inst)`,
				{ rels: data.relationships.features }
			);
		}
		if (data.relationships.user_liked) {
			await session.run(
				`UNWIND $rels AS r MATCH (u:User {id: r.from}), (s:Song {id: r.to}) MERGE (u)-[:LIKED]->(s)`,
				{ rels: data.relationships.user_liked }
			);
		}

		console.log('✅ SonicMesh database seeded with images successfully!');
	} catch (err) {
		console.error('❌ Error seeding CognoDB database:', err);
	} finally {
		await session.close();
	}
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('seed.ts')) {
	seed().then(() => driver.close());
}
