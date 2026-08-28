<script lang="ts">
	import { browser } from '$app/environment';
	import LoadingSkeleton from '$lib/components/LoadingSkeleton.svelte';

	let { data } = $props();

	let showCypherModal = $state(false);

	async function getArtistData(name: string) {
		if (!browser) return { artist: { name, label: 'Artist', image: '', country: 'India' }, songs: [], collaborators: [] };
		const res = await fetch(`/api/artist/${encodeURIComponent(name)}`);
		if (!res.ok) throw new Error('Failed to fetch artist details');
		return await res.json();
	}

	let artistPromise = $derived(getArtistData(data.artistName));
</script>

<svelte:head>
	<title>{data.artistName} Node — SonicMesh Studio</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-8 py-2 font-mono">
	<!-- Top Navigation -->
	<div>
		<a href="/" class="flex items-center gap-1 text-xs text-[#3ecf8e] hover:underline font-mono">
			← Back to Catalog Overview
		</a>
	</div>

	{#await artistPromise}
		<LoadingSkeleton variant="detail" />
	{:then payload}
		{@const artist = payload.artist}
		{@const songs = payload.songs}
		{@const collaborators = payload.collaborators}

		<!-- Artist Header Banner -->
		<section class="relative overflow-hidden rounded-xl border border-[#2e2e2e] bg-[#171717] p-6 sm:p-8 shadow-md flex flex-col md:flex-row items-center gap-6">
			<div class="h-32 w-32 shrink-0 overflow-hidden rounded-full border-2 border-[#2b5940] shadow-md">
				<img src={artist.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80'} alt={artist.name} class="h-full w-full object-cover" />
			</div>

			<div class="flex-1 space-y-2 text-center md:text-left">
				<div class="inline-flex items-center gap-2 rounded bg-[#1c392b] border border-[#2b5940] px-2.5 py-0.5 text-[10px] font-bold text-[#3ecf8e] uppercase">
					{artist.label} Node
				</div>

				<h1 class="font-heading text-3xl font-extrabold text-white">
					{artist.name}
				</h1>

				<div class="text-xs text-[#a1a1aa]">
					Origin: {artist.country || 'India'} &bull; {songs.length} Tracks Cataloged
				</div>

				<!-- Action Buttons -->
				<div class="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
					<a
						href="/connect?from={encodeURIComponent(artist.name)}&to=Ed Sheeran"
						class="sb-btn-primary px-4 py-2 text-xs font-semibold"
					>
						Find Path to Other Artists ➔
					</a>

					<button
						onclick={() => (showCypherModal = !showCypherModal)}
						class="sb-btn-secondary px-4 py-2 text-xs font-semibold cursor-pointer"
					>
						{showCypherModal ? 'Hide Cypher Inspector' : '⚡ View Cypher Query'}
					</button>
				</div>
			</div>
		</section>

		<!-- Cypher Inspector Drawer -->
		{#if showCypherModal}
			<section class="space-y-3 rounded-lg border border-[#2e2e2e] bg-[#121212] p-6 text-xs text-white shadow-md">
				<div class="flex items-center justify-between border-b border-[#2e2e2e] pb-2 font-bold text-[#3ecf8e]">
					<span>⚡ Executed Parameterized openCypher Queries</span>
					<span class="text-[10px] text-[#71717a]">CognoDB Engine v5.0</span>
				</div>

				<div class="space-y-2 pt-1">
					<div class="font-semibold text-[#f59e0b]">// 1. Artist Discography Query</div>
					<pre class="overflow-x-auto rounded border border-[#2e2e2e] bg-[#0a0a0a] p-3 text-[#ededed]"><code>MATCH (s:Song)-[:PERFORMED|COMPOSED]-(a)
WHERE toLower(a.name) = toLower($name)
RETURN s.id, s.title, s.coverImage, s.releaseYear, s.popularity</code></pre>

					<div class="font-semibold text-[#f59e0b] pt-2">// 2. Co-Collaborator 2-Hop Graph Traversal Query</div>
					<pre class="overflow-x-auto rounded border border-[#2e2e2e] bg-[#0a0a0a] p-3 text-[#ededed]"><code>MATCH (a)-[:PERFORMED|COMPOSED]-(s:Song)-[:PERFORMED|COMPOSED]-(c)
WHERE toLower(a.name) = toLower($name) AND toLower(c.name) &lt;&gt; toLower($name)
RETURN DISTINCT c.name, head(labels(c)), c.image
LIMIT 6</code></pre>
				</div>
			</section>
		{/if}

		<!-- Related Songs Catalog -->
		<section class="space-y-4">
			<h2 class="font-heading text-xl font-bold text-white border-b border-[#2e2e2e] pb-2">Discography in Graph</h2>
			{#if songs.length === 0}
				<div class="rounded-lg border border-dashed border-[#2e2e2e] bg-[#171717] p-8 text-center text-xs text-[#a1a1aa]">
					No tracks recorded for this artist node yet.
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each songs as song}
						<a
							href="/song/{song.id}"
							class="group flex items-center gap-3 rounded-lg border border-[#2e2e2e] bg-[#171717] p-3.5 transition-all hover:border-[#3ecf8e]"
						>
							<img
								src={song.coverImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&q=80'}
								alt={song.title}
								class="h-12 w-12 shrink-0 rounded-md border border-[#2e2e2e] object-cover"
							/>
							<div class="overflow-hidden">
								<div class="truncate font-heading text-sm font-bold text-white group-hover:text-[#3ecf8e] transition-colors">
									{song.title}
								</div>
								<div class="text-[10px] text-[#a1a1aa]">
									{song.releaseYear} &bull; {song.popularity}% Match Score
								</div>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</section>

		<!-- Co-Collaborators Section -->
		{#if collaborators && collaborators.length > 0}
			<section class="space-y-4 pt-2">
				<h2 class="font-heading text-xl font-bold text-white border-b border-[#2e2e2e] pb-2">Co-Collaborator Nodes</h2>
				<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
					{#each collaborators as c}
						<a
							href="/artist/{encodeURIComponent(c.name)}"
							class="group space-y-2 rounded-lg border border-[#2e2e2e] bg-[#171717] p-3 text-center transition-all hover:border-[#3ecf8e]"
						>
							<img
								src={c.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80'}
								alt={c.name}
								class="mx-auto h-10 w-10 rounded-full border border-[#2e2e2e] object-cover transition-transform group-hover:scale-105"
							/>
							<div class="truncate text-xs font-bold text-white group-hover:text-[#3ecf8e]">
								{c.name}
							</div>
							<div class="text-[9px] font-bold text-[#f59e0b] uppercase">
								{c.label}
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/if}
	{:catch error}
		<div class="rounded-lg border border-[#2e2e2e] bg-[#171717] p-8 text-center text-xs text-[#a1a1aa]">
			Failed to load artist details.
		</div>
	{/await}
</div>
