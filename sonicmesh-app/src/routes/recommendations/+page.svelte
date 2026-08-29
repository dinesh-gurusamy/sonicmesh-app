<script lang="ts">
	import { browser } from '$app/environment';
	import LoadingSkeleton from '$lib/components/LoadingSkeleton.svelte';
	import EntityIcon from '$lib/components/EntityIcon.svelte';

	let expandedRec = $state<string | null>(null);
	let showTechnicalQuery = $state(false);

	async function getRecommendations() {
		if (!browser) return [];
		const res = await fetch('/api/recommendations');
		if (!res.ok) throw new Error('Failed to fetch recommendations');
		return await res.json();
	}

	let recsPromise = $state(getRecommendations());

	function toggleExpand(id: string) {
		expandedRec = expandedRec === id ? null : id;
	}
</script>

<svelte:head>
	<title>Recommendations — SonicMesh Studio</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-8 py-2 font-mono">
	<!-- Page Header -->
	<div
		class="flex flex-col justify-between gap-4 border-b border-[#2e2e2e] pb-6 md:flex-row md:items-center"
	>
		<div>
			<div class="font-mono text-xs font-semibold tracking-wider text-[#3ecf8e] uppercase">
				Smart Recommendation Engine
			</div>
			<h1 class="font-heading mt-1 text-3xl font-extrabold text-white sm:text-4xl">
				Recommendations
			</h1>
			<p class="mt-1 font-sans text-xs text-[#a1a1aa] sm:text-sm">
				Recommended songs tailored from the performers, composers, genres, and languages you love.
			</p>
		</div>

		<div>
			<button
				onclick={() => (showTechnicalQuery = !showTechnicalQuery)}
				class="sb-btn-secondary cursor-pointer px-4 py-2.5 font-mono text-xs font-semibold shadow-xs"
			>
				{showTechnicalQuery ? 'Hide Technical Query' : '⚡ View Technical Query'}
			</button>
		</div>
	</div>

	<!-- Technical Query Drawer -->
	{#if showTechnicalQuery}
		<section
			class="space-y-3 rounded-lg border border-[#2e2e2e] bg-[#121212] p-6 font-mono text-xs text-white shadow-md"
		>
			<div
				class="flex items-center justify-between border-b border-[#2e2e2e] pb-2 font-bold text-[#3ecf8e]"
			>
				<span>⚡ Technical Recommendation Query</span>
				<span class="text-[10px] font-normal text-[#71717a]">Engine v5.0</span>
			</div>

			<pre
				class="overflow-x-auto rounded-md border border-[#2e2e2e] bg-[#0a0a0a] p-4 text-[#ededed]"><code
					>MATCH (u:User &#123;id: $userId&#125;)-[l:LIKES]->(s1:Song)
MATCH (s1)-[:PERFORMED|COMPOSED|HAS_GENRE|HAS_MOOD|IN_LANGUAGE]-(entity)-(s2:Song)
WHERE NOT (u)-[:LIKES]->(s2) AND s1 &lt;&gt; s2
WITH s2, count(DISTINCT entity) as sharedScore, collect(DISTINCT labels(entity)[0]) as connectionTypes
RETURN s2, sharedScore ORDER BY sharedScore DESC LIMIT 10;</code
				></pre>

			<p class="font-sans text-[11px] text-[#a1a1aa]">
				Traverses multi-hop paths to evaluate Candidate tracks connecting performers, composers,
				genres, moods, and languages.
			</p>
		</section>
	{/if}

	<!-- Recommendations Listing with {#await} block -->
	{#await recsPromise}
		<LoadingSkeleton variant="list" count={4} />
	{:then recommendations}
		{#if recommendations.length === 0}
			<!-- Empty State when User has 0 Liked Songs -->
			<div
				class="space-y-4 rounded-xl border border-dashed border-[#2e2e2e] bg-[#171717] p-12 text-center font-mono shadow-md"
			>
				<div
					class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#26151a] text-3xl text-[#f43f5e]"
				>
					♥
				</div>
				<h3 class="font-heading text-xl font-bold text-white">No Recommendations Yet</h3>
				<p class="mx-auto max-w-md font-sans text-xs leading-relaxed text-[#a1a1aa]">
					Your liked tracks list is currently empty! Like songs in the catalog by clicking the heart
					button (❤️) to build your taste collection and unlock personalized recommendations.
				</p>
				<div class="pt-2">
					<a
						href="/catalog"
						class="sb-btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold"
					>
						Explore Songs Catalog ➔
					</a>
				</div>
			</div>
		{:else}
			<div class="space-y-5">
				{#each recommendations as item}
					{@const firstLink = item.pathLinks?.[0]}
					{@const likedTitle = firstLink?.likedTitle || 'Vaseegara'}
					{@const composerName = item.composers?.[0] || 'Harris Jayaraj'}
					{@const moodName = item.moods?.[0] || 'Romantic'}
					{@const genreName = item.genres?.[0] || 'Melody'}
					{@const connectorName = firstLink?.connectorName || composerName}
					{@const connectorType = (firstLink?.connectorType || 'COMPOSED').toUpperCase()}
					{@const isExpanded = expandedRec === item.song.id}

					<!-- Sample Recommendation Card Component (Matching exact design requested) -->
					<div class="space-y-4 rounded-lg border border-[#2e2e2e] bg-[#171717] p-6 shadow-md">
						<!-- Top Row Header -->
						<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
							<div class="flex items-center gap-4">
								<EntityIcon type="song" class="h-14 w-14 shrink-0" />
								<div>
									<div class="flex items-center gap-2.5">
										<h3 class="font-heading text-lg font-bold text-white">{item.song.title}</h3>
										<span class="sb-badge-green px-2 py-0.5 text-xs font-bold"
											>{item.score}% Match</span
										>
									</div>
									<p class="mt-0.5 text-xs text-[#a1a1aa]">
										{item.composers.length ? item.composers.join(', ') : 'Composer'} &bull; {item
											.artists.length
											? item.artists.join(', ')
											: 'Artist'} &bull; {item.language}
									</p>
								</div>
							</div>

							<button
								onclick={() => toggleExpand(item.song.id)}
								class="sb-btn-secondary shrink-0 cursor-pointer px-4 py-2 text-xs font-semibold"
							>
								{isExpanded ? 'Hide Recommendation Reasons' : 'Why this song? ➔'}
							</button>
						</div>

						<!-- Middle Row Badges (Because you liked) -->
						<div class="flex flex-wrap items-center gap-2 border-t border-[#2e2e2e] pt-3 text-xs">
							<span class="font-mono text-[10px] font-bold text-[#71717a] uppercase"
								>BECAUSE YOU LIKED:</span
							>
							<span class="sb-badge-rose px-2.5 py-0.5 text-xs font-bold">♥ {likedTitle}</span>
							<span class="sb-badge-amber px-2.5 py-0.5 text-xs">Same Composer: {composerName}</span
							>
							<span class="sb-badge-green px-2.5 py-0.5 text-xs">Same Mood: {moodName}</span>
							{#if genreName}
								<span
									class="rounded border border-[#2b5940] bg-[#1c392b] px-2.5 py-0.5 text-xs text-[#3ecf8e]"
									>Genre: {genreName}</span
								>
							{/if}
						</div>

						<!-- Trace Flow Execution Section -->
						<div class="space-y-2 pt-1">
							<div
								class="flex items-center gap-1.5 font-mono text-[10px] font-bold text-[#3ecf8e] uppercase"
							>
								<span class="text-xs">⚡</span> GRAPH PATH EXECUTION TRACE:
							</div>
							<div
								class="flex flex-wrap items-center gap-2 rounded-lg border border-[#2e2e2e] bg-[#121212] p-3 font-mono text-xs"
							>
								<span class="sb-badge-rose px-3 py-1 text-xs font-bold">{likedTitle}</span>
								<span class="text-[#71717a]">➔</span>
								<span class="sb-badge-amber px-2.5 py-1 text-xs font-bold">:{connectorType}</span>
								<span class="text-[#71717a]">➔</span>
								<span
									class="rounded border border-[#333] bg-[#1e1e1e] px-3 py-1 text-xs font-bold text-white"
									>{connectorName}</span
								>
								<span class="text-[#71717a]">➔</span>
								<span class="sb-badge-green px-3 py-1 text-xs font-bold"
									>{item.song.title} (+20 Pts)</span
								>
							</div>
						</div>

						<!-- Expanded Recommendation Reasoning Breakdown -->
						{#if isExpanded}
							<div class="sb-fade-in space-y-3 border-t border-[#2e2e2e] pt-4 font-mono text-xs">
								<div class="font-bold text-[#3ecf8e]">Detailed Score Breakdown:</div>
								<div class="space-y-2 rounded-lg border border-[#2e2e2e] bg-[#121212] p-4">
									<div class="mb-2 font-sans text-[11px] text-[#a1a1aa]">
										{item.pathDescription}
									</div>
									{#each item.reasons as r}
										<div
											class="flex items-center justify-between border-b border-[#262626] py-1.5 last:border-none"
										>
											<span class="font-semibold text-white">
												{r.rule}:
												<span class="font-sans text-[11px] text-[#a1a1aa]">{r.explanation}</span>
											</span>
											<span class="font-bold text-[#3ecf8e]">+{r.points} Pts</span>
										</div>
									{/each}
									<div
										class="mt-2 flex items-center justify-between rounded bg-[#1e1e1e] px-4 py-2 font-bold text-white"
									>
										<span>Total Recommendation Score</span>
										<span class="text-sm text-[#3ecf8e]">{item.score} / 100</span>
									</div>
								</div>

								<div class="flex justify-end pt-1">
									<a
										href="/song/{item.song.id}"
										class="text-xs font-semibold text-[#3ecf8e] hover:underline"
									>
										View Song Details ➔
									</a>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	{:catch error}
		<!-- Error / Offline Failure Box -->
		<div
			class="space-y-4 rounded-xl border border-[#991b1b]/40 bg-[#1c1214] p-8 text-center font-mono text-xs text-[#a1a1aa] shadow-md"
		>
			<div
				class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#451a1a] text-xl text-[#f87171]"
			>
				{!browser || !navigator.onLine ? '🔌' : '⚠️'}
			</div>
			<h3 class="font-heading font-sans text-lg font-bold text-white">
				{!browser || !navigator.onLine
					? 'You are currently offline'
					: 'Failed to generate recommendations'}
			</h3>
			<p class="mx-auto max-w-md font-sans text-xs text-[#fca5a5]/80">
				{!browser || !navigator.onLine
					? 'Please check your internet or local network connection and try again.'
					: error?.message || 'An error occurred while generating recommendations.'}
			</p>
			<button
				onclick={() => (recsPromise = getRecommendations())}
				class="sb-btn-secondary inline-flex cursor-pointer items-center gap-2 px-4 py-2 text-xs font-semibold"
			>
				🔄 Retry Recommendations Query
			</button>
		</div>
	{/await}
</div>
