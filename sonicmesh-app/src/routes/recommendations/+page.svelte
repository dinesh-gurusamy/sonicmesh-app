<script lang="ts">
	import LoadingSkeleton from '$lib/components/LoadingSkeleton.svelte';

	let expandedRec = $state<string | null>(null);
	let showCypherInspector = $state(false);

	async function getRecommendations() {
		const res = await fetch('/api/recommendations');
		if (!res.ok) throw new Error('Failed to fetch recommendations');
		return await res.json();
	}

	let recsPromise = getRecommendations();

	function toggleExpand(id: string) {
		expandedRec = expandedRec === id ? null : id;
	}
</script>

<div class="space-y-8 py-2 max-w-5xl mx-auto">
	<!-- Page Header -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
				Graph Traversal Engine
			</div>
			<h1 class="text-3xl font-extrabold text-slate-900 font-heading mt-2">Recommended for You</h1>
			<p class="text-xs sm:text-sm text-slate-600 mt-1">
				Tracks matched from the artists, composers, and music styles of songs in your collection.
			</p>
		</div>

		<div>
			<button
				onclick={() => (showCypherInspector = !showCypherInspector)}
				class="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold font-mono transition-all shadow-sm"
			>
				{showCypherInspector ? 'Hide Cypher Inspector' : '⚡ View Cypher Query'}
			</button>
		</div>
	</div>

	<!-- Cypher Inspector Drawer -->
	{#if showCypherInspector}
		<section class="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs shadow-lg">
			<div class="flex items-center justify-between text-emerald-400 font-bold border-b border-slate-800 pb-2">
				<span>⚡ Multi-Hop Recommendation Cypher Query</span>
				<span class="text-[10px] text-slate-400 font-normal">CognoDB Driver v5.0</span>
			</div>

			<pre class="bg-slate-950 p-4 rounded-lg overflow-x-auto text-slate-300 border border-slate-800"><code>MATCH (u:User &lcub;id: $userId&rcub;)-[l:LIKES]->(s1:Song)
MATCH (s1)-[:PERFORMED|COMPOSED|HAS_GENRE|HAS_MOOD|IN_LANGUAGE]-(entity)-(s2:Song)
WHERE NOT (u)-[:LIKES]->(s2) AND s1 &lt;&gt; s2
WITH s2, count(DISTINCT entity) as weightScore
RETURN s2.id, s2.title, s2.coverImage, weightScore
ORDER BY weightScore DESC
LIMIT 10</code></pre>
		</section>
	{/if}

	<!-- Scoring Rules Legend -->
	<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
		<div class="text-xs font-bold uppercase tracking-wider text-amber-700">Recommendation Weights</div>
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
			<div class="p-3 rounded-xl bg-purple-50 border border-purple-200 text-center">
				<div class="font-bold text-purple-700">+25 Pts</div>
				<div class="text-[10px] text-slate-600 font-medium">Same Artist</div>
			</div>
			<div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
				<div class="font-bold text-amber-700">+20 Pts</div>
				<div class="text-[10px] text-slate-600 font-medium">Same Composer</div>
			</div>
			<div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
				<div class="font-bold text-rose-700">+15 Pts</div>
				<div class="text-[10px] text-slate-600 font-medium">Same Genre</div>
			</div>
			<div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
				<div class="font-bold text-emerald-700">+15 Pts</div>
				<div class="text-[10px] text-slate-600 font-medium">Same Mood</div>
			</div>
			<div class="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-center">
				<div class="font-bold text-indigo-700">+10 Pts</div>
				<div class="text-[10px] text-slate-600 font-medium">Language Match</div>
			</div>
		</div>
	</div>

	<!-- Recommendation List with {#await} block -->
	{#await recsPromise}
		<LoadingSkeleton variant="list" count={4} />
	{:then recommendations}
		{#if recommendations.length === 0}
			<div class="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm space-y-4">
				<div class="text-4xl">🎵</div>
				<h3 class="text-lg font-bold text-slate-800">No Recommendations Yet</h3>
				<p class="text-xs text-slate-500 max-w-md mx-auto">
					Like a few songs in SonicMesh to generate personalized track suggestions.
				</p>
				<a href="/" class="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-sm">
					Explore Songs ➔
				</a>
			</div>
		{:else}
			<div class="space-y-4">
				{#each recommendations as item}
					<div class="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
						<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<div class="flex items-center gap-4">
								<img src={item.song.coverImage} alt={item.song.title} class="w-16 h-16 rounded-xl object-cover shadow-sm shrink-0 border border-slate-200" />
								<div class="space-y-1">
									<div class="flex items-center gap-3">
										<h3 class="text-lg font-bold text-slate-900 font-heading">{item.song.title}</h3>
										<span class="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 text-xs font-mono">
											{item.song.releaseYear}
										</span>
									</div>
									<div class="text-xs text-slate-600 font-medium">
										{item.artists.join(', ') || 'Various Artists'} &bull; {item.composers.join(', ')} &bull; <span class="text-indigo-600 font-bold">{item.language}</span>
									</div>
								</div>
							</div>

							<div class="flex items-center gap-4 shrink-0">
								<div class="w-32">
									<div class="flex items-center justify-between text-xs font-mono font-bold mb-1">
										<span class="text-slate-500">Match Score</span>
										<span class="text-emerald-600">{item.score}%</span>
									</div>
									<div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
										<div class="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full" style="width: {item.score}%"></div>
									</div>
								</div>

								<button
									onclick={() => toggleExpand(item.song.id)}
									class="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold transition-all"
								>
									{expandedRec === item.song.id ? 'Hide Explanation' : 'Why this song? ➔'}
								</button>
							</div>
						</div>

						<div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2 font-mono">
							<span class="text-indigo-600 font-bold shrink-0">Connection:</span>
							<span class="truncate">{item.pathDescription}</span>
						</div>

						<!-- 💡 "Why this song?" Visual Path & Score Breakdown Drawer -->
						{#if expandedRec === item.song.id}
							<div class="pt-4 border-t border-slate-100 space-y-4 text-xs animate-fade-in">
								<div class="font-bold text-slate-900 uppercase tracking-wider text-[11px] font-heading flex items-center gap-2">
									<span>💡 Why is "{item.song.title}" recommended?</span>
								</div>

								<!-- Visual Path Traversal Diagrams -->
								<div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 font-mono">
									<div class="flex items-center gap-2 text-slate-700">
										<span class="px-2 py-1 rounded bg-indigo-100 text-indigo-800 font-bold">Your liked song</span>
										<span>➔</span>
										<span class="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">:COMPOSED</span>
										<span>➔</span>
										<span class="px-2 py-1 rounded bg-slate-200 text-slate-900 font-bold">{item.composers[0] || 'Composer'}</span>
										<span>➔</span>
										<span class="px-2 py-1 rounded bg-emerald-100 text-emerald-900 font-bold">{item.song.title}</span>
									</div>

									<div class="flex items-center gap-2 text-slate-700">
										<span class="px-2 py-1 rounded bg-indigo-100 text-indigo-800 font-bold">Your liked song</span>
										<span>➔</span>
										<span class="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">:HAS_MOOD</span>
										<span>➔</span>
										<span class="px-2 py-1 rounded bg-slate-200 text-slate-900 font-bold">{item.moods[0] || 'Romantic'}</span>
										<span>➔</span>
										<span class="px-2 py-1 rounded bg-emerald-100 text-emerald-900 font-bold">{item.song.title}</span>
									</div>
								</div>

								<!-- Point Score Breakdown Table -->
								<div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
									<div class="px-4 py-2 bg-slate-100 font-bold text-slate-700 text-[11px] uppercase tracking-wider border-b border-slate-200 flex justify-between">
										<span>Criteria</span>
										<span>Score Points</span>
									</div>
									<div class="divide-y divide-slate-100 font-mono text-xs">
										{#each item.reasons as r}
											<div class="px-4 py-2 flex justify-between items-center">
												<span class="text-slate-700 font-sans">{r.rule}: <span class="text-slate-500 text-[11px]">{r.explanation}</span></span>
												<span class="text-emerald-600 font-bold">+{r.points}</span>
											</div>
										{/each}
										<div class="px-4 py-2 bg-slate-50 font-bold flex justify-between items-center text-slate-900">
											<span>Total Weighted Graph Score</span>
											<span class="text-emerald-700 text-sm">{item.score} / 100</span>
										</div>
									</div>
								</div>

								<div class="pt-2 flex justify-end">
									<a href="/song/{item.song.id}" class="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
										Open Song Graph ➔
									</a>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	{:catch error}
		<div class="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
			Failed to load recommendations.
		</div>
	{/await}
</div>
