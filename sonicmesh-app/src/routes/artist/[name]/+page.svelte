<script lang="ts">
	import LoadingSkeleton from '$lib/components/LoadingSkeleton.svelte';

	let { data } = $props();

	let showCypherModal = $state(false);

	async function getArtistData(name: string) {
		const res = await fetch(`/api/artist/${encodeURIComponent(name)}`);
		if (!res.ok) throw new Error('Failed to fetch artist details');
		return await res.json();
	}

	let artistPromise = $derived(getArtistData(data.artistName));
</script>

<div class="max-w-5xl mx-auto space-y-8 py-2">
	<!-- Top Navigation -->
	<div>
		<a href="/" class="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1">
			← Back to Songs Catalog
		</a>
	</div>

	{#await artistPromise}
		<LoadingSkeleton variant="detail" />
	{:then payload}
		{@const artist = payload.artist}
		{@const songs = payload.songs}
		{@const collaborators = payload.collaborators}

		<!-- Artist Header Banner -->
		<section class="bg-white p-8 rounded-3xl border border-slate-200 shadow-md flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
			<div class="w-40 h-40 rounded-full overflow-hidden shadow-lg border-2 border-indigo-200 shrink-0">
				<img src={artist.image} alt={artist.name} class="w-full h-full object-cover" />
			</div>

			<div class="flex-1 space-y-3 text-center md:text-left">
				<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold uppercase tracking-wider">
					{artist.label} Node
				</div>

				<h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
					{artist.name}
				</h1>

				<div class="text-xs text-slate-500 font-semibold">
					Origin: {artist.country || 'India'} &bull; {songs.length} Tracks in Graph Catalog
				</div>

				<!-- Action Buttons -->
				<div class="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
					<a
						href="/connect?from={encodeURIComponent(artist.name)}&to=Ed Sheeran"
						class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
					>
						Find Connection to Other Artists ➔
					</a>

					<button
						onclick={() => (showCypherModal = !showCypherModal)}
						class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold font-mono transition-all"
					>
						{showCypherModal ? 'Hide Cypher Inspector' : '⚡ View Cypher Query'}
					</button>
				</div>
			</div>
		</section>

		<!-- Cypher Inspector Drawer -->
		{#if showCypherModal}
			<section class="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs shadow-lg">
				<div class="flex items-center justify-between text-indigo-400 font-bold border-b border-slate-800 pb-2">
					<span>⚡ Executed Parameterized openCypher Queries</span>
					<span class="text-[10px] text-slate-400 font-normal">CognoDB Driver v5.0</span>
				</div>

				<div class="space-y-2 pt-1">
					<div class="text-amber-400 font-semibold">// 1. Artist Discography Query</div>
					<pre class="bg-slate-950 p-3 rounded-lg overflow-x-auto text-slate-300 border border-slate-800"><code>MATCH (s:Song)-[:PERFORMED|COMPOSED]-(a)
WHERE toLower(a.name) = toLower($name)
RETURN s.id, s.title, s.coverImage, s.releaseYear, s.popularity</code></pre>

					<div class="text-amber-400 font-semibold pt-2">// 2. Co-Collaborator 2-Hop Graph Traversal Query</div>
					<pre class="bg-slate-950 p-3 rounded-lg overflow-x-auto text-slate-300 border border-slate-800"><code>MATCH (a)-[:PERFORMED|COMPOSED]-(s:Song)-[:PERFORMED|COMPOSED]-(c)
WHERE toLower(a.name) = toLower($name) AND toLower(c.name) &lt;&gt; toLower($name)
RETURN DISTINCT c.name, head(labels(c)), c.image
LIMIT 6</code></pre>
				</div>
			</section>
		{/if}

		<!-- Related Songs Catalog -->
		<section class="space-y-4">
			<h2 class="text-xl font-bold text-slate-900 font-heading">Discography in Graph</h2>
			{#if songs.length === 0}
				<div class="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-500 text-sm">
					No tracks recorded for this artist yet.
				</div>
			{:else}
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each songs as s}
						<a href="/song/{s.id}" class="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-3">
							<img src={s.coverImage} alt={s.title} class="w-14 h-14 rounded-lg object-cover shadow-sm shrink-0" />
							<div class="overflow-hidden">
								<div class="font-bold text-slate-900 truncate text-sm">{s.title}</div>
								<div class="text-xs text-slate-500">{s.releaseYear} &bull; Popularity {s.popularity}%</div>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</section>

		<!-- Co-Collaborators 2-Hop Graph Section -->
		<section class="space-y-4">
			<h2 class="text-xl font-bold text-slate-900 font-heading">Direct Collaborators (2-Hop Graph Links)</h2>
			{#if collaborators.length === 0}
				<div class="bg-white p-6 text-center rounded-2xl border border-slate-200 text-slate-500 text-sm">
					No co-collaborators linked yet.
				</div>
			{:else}
				<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
					{#each collaborators as collab}
						<a href="/artist/{encodeURIComponent(collab.name)}" class="bg-white p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col items-center text-center space-y-2">
							<img src={collab.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80'} alt={collab.name} class="w-14 h-14 rounded-full object-cover shadow-sm" />
							<div class="font-bold text-xs text-slate-900 line-clamp-1">{collab.name}</div>
							<div class="text-[10px] text-purple-600 font-semibold">{collab.label}</div>
						</a>
					{/each}
				</div>
			{/if}
		</section>
	{:catch error}
		<div class="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
			Failed to load artist profile.
		</div>
	{/await}
</div>
