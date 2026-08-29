<script lang="ts">
	import { browser } from '$app/environment';
	import LoadingSkeleton from '$lib/components/LoadingSkeleton.svelte';
	import EntityIcon from '$lib/components/EntityIcon.svelte';

	let expandedRec = $state<string | null>(null);
	let showTechnicalQuery = $state(false);
	let isRefreshing = $state(false);

	async function getRecommendations() {
		if (!browser) return [];
		const res = await fetch('/api/recommendations');
		if (!res.ok) throw new Error('Failed to fetch recommendations');
		return await res.json();
	}

	async function getLikedSongs() {
		if (!browser) return { likedSongs: [] };
		const res = await fetch('/api/liked-connections');
		if (!res.ok) return { likedSongs: [] };
		return await res.json();
	}

	let recsPromise = $state(getRecommendations());
	let likedPromise = $state(getLikedSongs());

	function toggleExpand(id: string) {
		expandedRec = expandedRec === id ? null : id;
	}

	async function toggleLike(songId: string) {
		try {
			isRefreshing = true;
			const res = await fetch('/api/like', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ songId })
			});
			if (!res.ok) throw new Error('Failed to toggle like');
			// Re-fetch recommendations and liked songs
			recsPromise = getRecommendations();
			likedPromise = getLikedSongs();
		} catch (err) {
			console.error('Error toggling like:', err);
		} finally {
			isRefreshing = false;
		}
	}

	function formatDuration(seconds?: number) {
		if (!seconds) return '3:45';
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}m ${s < 10 ? '0' : ''}${s}s`;
	}

	function getConnectorBadgeClass(type?: string) {
		switch ((type || '').toUpperCase()) {
			case 'ALBUM':
				return 'border border-[#6366f1]/40 bg-[#1e1b4b] text-[#a5b4fc]';
			case 'COMPOSER':
				return 'sb-badge-amber';
			case 'ARTIST':
				return 'sb-badge-blue';
			case 'LYRICIST':
				return 'border border-[#ec4899]/40 bg-[#381124] text-[#f472b6]';
			case 'GENRE':
				return 'border border-[#2b5940] bg-[#1c392b] text-[#3ecf8e]';
			case 'MOOD':
				return 'sb-badge-green';
			case 'LANGUAGE':
				return 'border border-[#06b6d4]/40 bg-[#083344] text-[#67e8f9]';
			case 'INSTRUMENT':
				return 'border border-[#eab308]/40 bg-[#3a2803] text-[#fde047]';
			default:
				return 'border border-[#333] bg-[#222] text-[#ededed]';
		}
	}
</script>

<svelte:head>
	<title>Smart Recommendations — SonicMesh Studio</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-8 py-2 font-mono">
	<!-- Page Header -->
	<div
		class="flex flex-col justify-between gap-4 border-b border-[#2e2e2e] pb-6 md:flex-row md:items-center"
	>
		<div>
			<div class="flex items-center gap-2">
				<span class="h-2.5 w-2.5 animate-pulse rounded-full bg-[#3ecf8e]"></span>
				<div class="font-mono text-xs font-semibold tracking-wider text-[#3ecf8e] uppercase">
					Explainable Graph Engine
				</div>
			</div>
			<h1 class="font-heading mt-1 text-3xl font-extrabold text-white sm:text-4xl">
				Music Recommendations
			</h1>
			<p class="mt-1 font-sans text-xs text-[#a1a1aa] sm:text-sm">
				Multi-hop recommendations calculated live from the original music dataset, matching albums, creators, genres, and moods you love.
			</p>
		</div>

		<div class="flex flex-wrap items-center gap-2.5">
			<button
				onclick={() => {
					recsPromise = getRecommendations();
					likedPromise = getLikedSongs();
				}}
				disabled={isRefreshing}
				class="sb-btn-secondary cursor-pointer px-3.5 py-2 font-mono text-xs font-semibold shadow-xs"
				title="Refresh recommendation calculations"
			>
				{isRefreshing ? '⏳ Refreshing...' : '🔄 Refresh'}
			</button>
			<button
				onclick={() => (showTechnicalQuery = !showTechnicalQuery)}
				class="sb-btn-secondary cursor-pointer px-4 py-2 font-mono text-xs font-semibold shadow-xs"
			>
				{showTechnicalQuery ? 'Hide Cypher Query' : '⚡ View Cypher Query'}
			</button>
		</div>
	</div>

	<!-- Active Liked Seeds Strip (Only rendered when user has liked songs) -->
	{#await likedPromise}
		<div class="h-12 animate-pulse rounded-lg border border-[#2e2e2e] bg-[#171717]"></div>
	{:then likedData}
		{@const likedSongs = (likedData && likedData.likedSongs) ? likedData.likedSongs : []}
		{#if likedSongs.length > 0}
			<div class="rounded-xl border border-[#2e2e2e] bg-[#171717] p-4 shadow-xs">
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div class="flex items-center gap-2">
						<span class="text-sm text-[#f43f5e]">♥</span>
						<span class="text-xs font-bold text-white uppercase">Your Active Taste Seeds ({likedSongs.length}):</span>
					</div>
					<a href="/catalog" class="text-[11px] text-[#3ecf8e] hover:underline">
						+ Browse & Like More Tracks in Catalog ➔
					</a>
				</div>

				<div class="mt-3 flex flex-wrap items-center gap-2">
					{#each likedSongs as song}
						<div
							class="flex items-center gap-1.5 rounded-md border border-[#f43f5e]/30 bg-[#26151a] px-2.5 py-1 text-xs text-white"
						>
							<span class="text-[#f43f5e]">♥</span>
							<a href="/song/{song.id}" class="font-semibold hover:text-[#3ecf8e] hover:underline">
								{song.title}
							</a>
							{#if song.album}
								<span class="text-[10px] text-[#a1a1aa]">({song.album.title})</span>
							{/if}
							<button
								onclick={() => toggleLike(song.id)}
								class="ml-1 text-[11px] text-[#71717a] hover:text-[#f43f5e]"
								title="Remove from taste seeds"
							>
								✕
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/await}

	<!-- Technical Query Drawer -->
	{#if showTechnicalQuery}
		<section
			class="space-y-3 rounded-lg border border-[#2e2e2e] bg-[#121212] p-6 font-mono text-xs text-white shadow-md"
		>
			<div
				class="flex items-center justify-between border-b border-[#2e2e2e] pb-2 font-bold text-[#3ecf8e]"
			>
				<span>⚡ Multi-Hop Recommendation Traversal Query</span>
				<span class="text-[10px] font-normal text-[#71717a]">Engine v5.2</span>
			</div>

			<pre
				class="overflow-x-auto rounded-md border border-[#2e2e2e] bg-[#0a0a0a] p-4 text-[#ededed]"><code
					>MATCH (u:User &#123;id: $userId&#125;)-[l:LIKES]->(liked:Song)
MATCH (liked)-[r1:PART_OF|PERFORMED|COMPOSED|WROTE|HAS_GENRE|HAS_MOOD|IN_LANGUAGE]-(node)-[r2]-(candidate:Song)
WHERE candidate &lt;&gt; liked AND NOT (u)-[:LIKES]->(candidate)
OPTIONAL MATCH (candidate)-[:PART_OF]->(alb:Album)
OPTIONAL MATCH (art:Artist)-[:PERFORMED]->(candidate)
OPTIONAL MATCH (cmp:Composer)-[:COMPOSED]->(candidate)
RETURN candidate, alb, collect(DISTINCT art.name) as artists, collect(DISTINCT cmp.name) as composers,
       count(DISTINCT node) as sharedScore, collect(DISTINCT head(labels(node))) as connectionTypes
ORDER BY sharedScore DESC LIMIT 20;</code
				></pre>

			<p class="font-sans text-[11px] text-[#a1a1aa]">
				Traverses multi-hop graph edges across Albums, Performers, Composers, Lyricists, Genres, Moods, and Languages in real time.
			</p>
		</section>
	{/if}

	<!-- Recommendations Listing with {#await} block -->
	{#await recsPromise}
		<LoadingSkeleton variant="list" count={4} />
	{:then recommendations}
		{#if !recommendations || recommendations.length === 0}
			<!-- Empty State when User has 0 Liked Songs or No Matches -->
			<div
				class="space-y-6 rounded-2xl border border-dashed border-[#2e2e2e] bg-[#171717] p-12 text-center font-mono shadow-md"
			>
				<div
					class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#26151a] text-3xl text-[#f43f5e]"
				>
					♥
				</div>
				<div class="space-y-2">
					<h3 class="font-heading text-xl font-bold text-white">No Liked Songs Yet</h3>
					<p class="mx-auto max-w-md font-sans text-xs leading-relaxed text-[#a1a1aa]">
						Your taste profile is currently empty! Explore the catalog and like songs you love (❤️) to build your profile and generate personalized graph recommendations.
					</p>
				</div>

				<div class="pt-3">
					<a
						href="/catalog"
						class="sb-btn-primary inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold"
					>
						Explore Songs Catalog ➔
					</a>
				</div>
			</div>
		{:else}
			<div class="space-y-5">
				{#each recommendations as item}
					{@const isExpanded = expandedRec === item.song.id}
					{@const pathLinks = item.pathLinks || []}
					{@const likedTitles = Array.from(new Set(pathLinks.map((p: any) => p.likedTitle))).filter(Boolean)}

					<!-- Recommendation Card Component -->
					<div class="space-y-4 rounded-xl border border-[#2e2e2e] bg-[#171717] p-6 shadow-md transition-all hover:border-[#3ecf8e]/40">
						<!-- Top Row Header with Song & Album info -->
						<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
							<div class="flex items-start gap-4">
								<div class="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#2e2e2e]">
									<EntityIcon type="song" class="h-full w-full" />
								</div>
								<div>
									<div class="flex flex-wrap items-center gap-2.5">
										<a
											href="/song/{item.song.id}"
											class="font-heading text-lg font-bold text-white hover:text-[#3ecf8e] hover:underline"
										>
											{item.song.title}
										</a>
										<span class="sb-badge-green px-2.5 py-0.5 text-xs font-bold shadow-xs">
											{item.score}% Match
										</span>
									</div>

									<!-- Album & Creator Details -->
									<div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#a1a1aa]">
										{#if item.album}
											<span class="flex items-center gap-1 font-semibold text-[#ededed]">
												<span class="text-[#a5b4fc]">💿</span> {item.album.title} ({item.album.releaseYear || item.song.releaseYear})
											</span>
											<span>&bull;</span>
										{/if}
										{#if item.composers && item.composers.length > 0}
											<span>Composer: <strong class="text-white">{item.composers.join(', ')}</strong></span>
											<span>&bull;</span>
										{/if}
										{#if item.artists && item.artists.length > 0}
											<span>Performers: <strong class="text-white">{item.artists.join(', ')}</strong></span>
											<span>&bull;</span>
										{/if}
										<span>{item.language}</span>
										<span>&bull;</span>
										<span>{formatDuration(item.song.durationSeconds)}</span>
									</div>
								</div>
							</div>

							<!-- Action Buttons -->
							<div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
								<button
									onclick={() => toggleLike(item.song.id)}
									class="flex cursor-pointer items-center gap-1.5 rounded-md border border-[#2e2e2e] bg-[#1e1e1e] px-3 py-2 text-xs font-semibold text-[#f43f5e] transition-all hover:bg-[#26151a] hover:border-[#f43f5e]/50"
									title="Save to liked collection"
								>
									♥ Like Track
								</button>
								<button
									onclick={() => toggleExpand(item.song.id)}
									class="sb-btn-secondary cursor-pointer px-3.5 py-2 text-xs font-semibold"
								>
									{isExpanded ? 'Hide Reasons ▲' : 'Why this song? ➔'}
								</button>
							</div>
						</div>

						<!-- Dynamic Relationship Badges (Computed from real graph paths) -->
						<div class="flex flex-wrap items-center gap-2 border-t border-[#2e2e2e] pt-3 text-xs">
							<span class="font-mono text-[10px] font-bold text-[#71717a] uppercase">
								BECAUSE YOU LIKED:
							</span>
							{#each likedTitles as likedTitle}
								<span class="sb-badge-rose px-2.5 py-0.5 text-xs font-bold">♥ {likedTitle}</span>
							{/each}

							<!-- Individual connection badges -->
							{#each pathLinks.slice(0, 4) as link}
								<span class="{getConnectorBadgeClass(link.connectorType)} px-2.5 py-0.5 text-xs font-medium">
									{link.connectorType}: {link.connectorName}
								</span>
							{/each}
						</div>

						<!-- Trace Flow Execution Section -->
						{#if pathLinks.length > 0}
							<div class="space-y-2 pt-1">
								<div class="flex items-center gap-1.5 font-mono text-[10px] font-bold text-[#3ecf8e] uppercase">
									<span class="text-xs">⚡</span> GRAPH PATH EXECUTION TRACE:
								</div>
								<div class="flex flex-col gap-2">
									{#each pathLinks.slice(0, 2) as link}
										<div
											class="flex flex-wrap items-center gap-2 rounded-lg border border-[#2e2e2e] bg-[#121212] p-2.5 font-mono text-xs"
										>
											<span class="sb-badge-rose px-2.5 py-0.5 text-xs font-bold">{link.likedTitle}</span>
											<span class="text-[#71717a]">➔</span>
											<span class="sb-badge-amber px-2 py-0.5 text-xs font-bold">:{link.connectorType.toUpperCase()}</span>
											<span class="text-[#71717a]">➔</span>
											<span class="rounded border border-[#333] bg-[#1e1e1e] px-2.5 py-0.5 text-xs font-bold text-white">
												{link.connectorName}
											</span>
											<span class="text-[#71717a]">➔</span>
											<span class="sb-badge-green px-2.5 py-0.5 text-xs font-bold">
												{item.song.title} (+{link.points || 20} Pts)
											</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Expanded Recommendation Reasoning Breakdown -->
						{#if isExpanded}
							<div class="sb-fade-in space-y-3 border-t border-[#2e2e2e] pt-4 font-mono text-xs">
								<div class="font-bold text-[#3ecf8e]">Detailed Graph Score Breakdown:</div>
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
										<span>Total Graph Recommendation Score</span>
										<span class="text-sm text-[#3ecf8e]">{item.score} / 100</span>
									</div>
								</div>

								<div class="flex justify-end pt-1">
									<a
										href="/song/{item.song.id}"
										class="text-xs font-semibold text-[#3ecf8e] hover:underline"
									>
										Inspect Song Graph Node & Relationships ➔
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
				⚠️
			</div>
			<h3 class="font-heading font-sans text-lg font-bold text-white">
				Failed to generate recommendations
			</h3>
			<p class="mx-auto max-w-md font-sans text-xs text-[#fca5a5]/80">
				{error?.message || 'An error occurred while computing graph recommendations.'}
			</p>
			<button
				onclick={() => {
					recsPromise = getRecommendations();
					likedPromise = getLikedSongs();
				}}
				class="sb-btn-secondary inline-flex cursor-pointer items-center gap-2 px-4 py-2 text-xs font-semibold"
			>
				🔄 Retry Recommendations Query
			</button>
		</div>
	{/await}
</div>
