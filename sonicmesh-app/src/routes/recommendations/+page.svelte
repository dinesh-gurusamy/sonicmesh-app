<script lang="ts">
	import { browser } from '$app/environment';
	import LoadingSkeleton from '$lib/components/LoadingSkeleton.svelte';

	let expandedRec = $state<string | null>(null);
	let showCypherInspector = $state(false);

	async function getRecommendations() {
		if (!browser) return [];
		const res = await fetch('/api/recommendations');
		if (!res.ok) throw new Error('Failed to fetch recommendations');
		return await res.json();
	}

	let recsPromise = getRecommendations();

	function toggleExpand(id: string) {
		expandedRec = expandedRec === id ? null : id;
	}
</script>

<svelte:head>
	<title>Recommendations Console — SonicMesh Studio</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-8 py-2">
	<!-- Page Header -->
	<div class="flex flex-col justify-between gap-4 border-b border-[#2e2e2e] pb-6 md:flex-row md:items-center">
		<div>
			<div class="font-mono text-xs font-semibold uppercase tracking-wider text-[#3ecf8e]">
				Multi-Hop Cypher Engine
			</div>
			<h1 class="font-heading mt-1 text-3xl font-extrabold text-white sm:text-4xl">Recommendations Console</h1>
			<p class="mt-1 text-xs text-[#a1a1aa] sm:text-sm">
				Multi-hop candidate tracks weighted from creator, genre, mood, and language links in your graph.
			</p>
		</div>

		<div>
			<button
				onclick={() => (showCypherInspector = !showCypherInspector)}
				class="sb-btn-secondary cursor-pointer px-4 py-2.5 font-mono text-xs font-semibold shadow-xs"
			>
				{showCypherInspector ? 'Hide Cypher Query' : '⚡ Inspect Cypher Query'}
			</button>
		</div>
	</div>

	<!-- Cypher Inspector Drawer -->
	{#if showCypherInspector}
		<section class="space-y-3 rounded-lg border border-[#2e2e2e] bg-[#121212] p-6 font-mono text-xs text-white shadow-md">
			<div class="flex items-center justify-between border-b border-[#2e2e2e] pb-2 font-bold text-[#3ecf8e]">
				<span>⚡ Multi-Hop Recommendation openCypher Query</span>
				<span class="text-[10px] font-normal text-[#71717a]">CognoDB Engine v5.0</span>
			</div>

			<pre class="overflow-x-auto rounded-md border border-[#2e2e2e] bg-[#0a0a0a] p-4 text-[#ededed]"><code>MATCH (u:User &lcub;id: $userId&rcub;)-[l:LIKES]->(s1:Song)
MATCH (s1)-[:PERFORMED|COMPOSED|HAS_GENRE|HAS_MOOD|IN_LANGUAGE]-(entity)-(s2:Song)
WHERE NOT (u)-[:LIKES]->(s2) AND s1 &lt;&gt; s2
WITH s2, count(DISTINCT entity) as weightScore
RETURN s2.id, s2.title, s2.coverImage, weightScore
ORDER BY weightScore DESC
LIMIT 10</code></pre>
		</section>
	{/if}

	<!-- Scoring Rules Legend -->
	<div class="space-y-3 rounded-xl border border-[#2e2e2e] bg-[#171717] p-6 font-mono shadow-xs">
		<div class="text-xs font-semibold uppercase tracking-wider text-[#3ecf8e]">
			Multi-Hop Graph Weighting Matrix
		</div>
		<div class="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3 md:grid-cols-5">
			<div class="rounded-md border border-[#a855f7]/30 bg-[#1e1e1e] p-3 text-center">
				<div class="font-bold text-[#a855f7]">+25 Pts</div>
				<div class="text-[10px] text-[#a1a1aa] mt-0.5">Same Artist</div>
			</div>
			<div class="rounded-md border border-[#f59e0b]/30 bg-[#1e1e1e] p-3 text-center">
				<div class="font-bold text-[#f59e0b]">+20 Pts</div>
				<div class="text-[10px] text-[#a1a1aa] mt-0.5">Same Composer</div>
			</div>
			<div class="rounded-md border border-[#3ecf8e]/30 bg-[#1e1e1e] p-3 text-center">
				<div class="font-bold text-[#3ecf8e]">+15 Pts</div>
				<div class="text-[10px] text-[#a1a1aa] mt-0.5">Same Genre</div>
			</div>
			<div class="rounded-md border border-[#3b82f6]/30 bg-[#1e1e1e] p-3 text-center">
				<div class="font-bold text-[#3b82f6]">+15 Pts</div>
				<div class="text-[10px] text-[#a1a1aa] mt-0.5">Same Mood</div>
			</div>
			<div class="rounded-md border border-[#2e2e2e] bg-[#1e1e1e] p-3 text-center">
				<div class="font-bold text-white">+10 Pts</div>
				<div class="text-[10px] text-[#a1a1aa] mt-0.5">Language Match</div>
			</div>
		</div>
	</div>

	<!-- Recommendation List with {#await} block -->
	{#await recsPromise}
		<LoadingSkeleton variant="list" count={4} />
	{:then recommendations}
		{#if recommendations.length === 0}
			<div class="space-y-4 rounded-xl border border-dashed border-[#2e2e2e] bg-[#171717] p-12 text-center shadow-xs font-mono">
				<div class="text-3xl">🎵</div>
				<h3 class="font-heading text-lg font-bold text-white">No Recommendations Generated</h3>
				<p class="mx-auto max-w-md text-xs text-[#a1a1aa]">
					Like songs in the catalog to generate graph recommendations.
				</p>
				<a
					href="/"
					class="sb-btn-primary inline-block px-5 py-2.5 text-xs font-semibold"
				>
					Explore Catalog Songs ➔
				</a>
			</div>
		{:else}
			<div class="space-y-4">
				{#each recommendations as item}
					<div class="space-y-4 rounded-xl border border-[#2e2e2e] bg-[#171717] p-6 shadow-xs">
						<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
							<div class="flex items-center gap-4">
								<img
									src={item.song.coverImage}
									alt={item.song.title}
									class="h-16 w-16 shrink-0 rounded-md border border-[#2e2e2e] object-cover shadow-xs"
								/>
								<div class="space-y-1 font-mono">
									<div class="flex items-center gap-3">
										<h3 class="font-heading text-xl font-bold text-white">{item.song.title}</h3>
										<span class="rounded border border-[#2e2e2e] bg-[#1e1e1e] px-2 py-0.5 text-xs text-[#a1a1aa]">
											{item.song.releaseYear}
										</span>
									</div>
									<div class="text-xs text-[#a1a1aa]">
										{item.artists.join(', ') || 'Various Performers'} &bull; {item.composers.join(', ')} &bull; <span class="font-bold text-[#3ecf8e]">{item.language}</span>
									</div>
								</div>
							</div>

							<div class="flex shrink-0 items-center gap-4 font-mono">
								<div class="w-32">
									<div class="mb-1 flex items-center justify-between text-xs font-bold">
										<span class="text-[#71717a]">Match</span>
										<span class="text-[#3ecf8e]">{item.score}%</span>
									</div>
									<div class="h-2 w-full overflow-hidden rounded-full bg-[#262626]">
										<div
											class="h-full rounded-full bg-[#3ecf8e]"
											style="width: {item.score}%"
										></div>
									</div>
								</div>

								<button
									onclick={() => toggleExpand(item.song.id)}
									class="sb-btn-secondary cursor-pointer px-4 py-2 text-xs font-semibold"
								>
									{expandedRec === item.song.id ? 'Hide Explanation' : 'Why this song? ➔'}
								</button>
							</div>
						</div>

						<div class="flex items-center gap-2 rounded-md border border-[#2e2e2e] bg-[#121212] p-3 font-mono text-xs text-white">
							<span class="shrink-0 font-bold text-[#3ecf8e]">Connection Path:</span>
							<span class="truncate text-[#a1a1aa]">{item.pathDescription}</span>
						</div>

						<!-- 💡 "Why this song?" Visual Path & Score Breakdown Drawer -->
						{#if expandedRec === item.song.id}
							<div class="sb-fade-in space-y-4 border-t border-[#2e2e2e] pt-4 text-xs font-mono">
								<div class="text-sm font-semibold text-[#3ecf8e]">
									⚡ Multi-Hop Graph Traversal Execution Path:
								</div>

								<!-- Visual Path Traversal Diagrams -->
								<div class="space-y-2 rounded-md border border-[#2e2e2e] bg-[#121212] p-4">
									<div class="flex flex-wrap items-center gap-2 text-white">
										<span class="sb-badge-rose px-2 py-0.5 font-bold">Liked Song</span>
										<span>➔</span>
										<span class="sb-badge-amber px-2 py-0.5 font-bold">:COMPOSED</span>
										<span>➔</span>
										<span class="px-2 py-0.5 rounded bg-[#262626] font-bold">{item.composers[0] || 'Composer'}</span>
										<span>➔</span>
										<span class="sb-badge-green px-2 py-0.5 font-bold">{item.song.title}</span>
									</div>

									<div class="flex flex-wrap items-center gap-2 text-white">
										<span class="sb-badge-rose px-2 py-0.5 font-bold">Liked Song</span>
										<span>➔</span>
										<span class="sb-badge-blue px-2 py-0.5 font-bold">:HAS_MOOD</span>
										<span>➔</span>
										<span class="px-2 py-0.5 rounded bg-[#262626] font-bold">{item.moods[0] || 'Romantic'}</span>
										<span>➔</span>
										<span class="sb-badge-green px-2 py-0.5 font-bold">{item.song.title}</span>
									</div>
								</div>

								<!-- Point Score Breakdown Table -->
								<div class="overflow-hidden rounded-md border border-[#2e2e2e] bg-[#171717]">
									<div class="flex justify-between border-b border-[#2e2e2e] bg-[#1e1e1e] px-4 py-2 text-[10px] font-bold uppercase text-[#71717a]">
										<span>Rule Criteria</span>
										<span>Score Points</span>
									</div>
									<div class="divide-y divide-[#2e2e2e] text-xs">
										{#each item.reasons as r}
											<div class="flex items-center justify-between px-4 py-2">
												<span class="text-white">{r.rule}: <span class="text-[#a1a1aa] text-[11px]">{r.explanation}</span></span>
												<span class="font-bold text-[#3ecf8e]">+{r.points}</span>
											</div>
										{/each}
										<div class="flex items-center justify-between bg-[#1e1e1e] px-4 py-2 font-bold text-white">
											<span>Total Cypher Score</span>
											<span class="text-sm text-[#3ecf8e]">{item.score} / 100</span>
										</div>
									</div>
								</div>

								<div class="flex justify-end pt-1">
									<a href="/song/{item.song.id}" class="text-xs font-semibold text-[#3ecf8e] hover:underline">
										Inspect Song Node ➔
									</a>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	{:catch error}
		<div class="rounded-xl border border-[#2e2e2e] bg-[#171717] p-8 text-center text-xs font-mono text-[#a1a1aa]">
			Failed to load recommendations.
		</div>
	{/await}
</div>
