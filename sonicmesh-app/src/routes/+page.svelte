<script lang="ts">
	import { enhance } from '$app/forms';
	import { browser } from '$app/environment';
	import LoadingSkeleton from '$lib/components/LoadingSkeleton.svelte';
	import SearchAutocomplete from '$lib/components/SearchAutocomplete.svelte';
	import EntityIcon from '$lib/components/EntityIcon.svelte';

	let { data, form } = $props();

	let searchInput = $state('');
	let selectedGenre = $state('ALL');
	let showSampleWhy = $state(false);

	// Local mutable state for liked song IDs
	let likedSongsMap = $state<Record<string, boolean>>({});

	$effect(() => {
		searchInput = data.searchQuery || '';
		if (browser && data.searchQuery) {
			setTimeout(() => {
				const el = document.getElementById('search-results');
				if (el) {
					el.scrollIntoView({ behavior: 'smooth' });
				}
			}, 100);
		}
	});

	async function getStats() {
		if (!browser)
			return { songCount: 12, artistCount: 10, composerCount: 6, relationshipCount: 65 };
		const res = await fetch('/api/stats');
		if (!res.ok) throw new Error('Failed to fetch stats');
		return await res.json();
	}

	async function getSongs(query: string) {
		if (!browser) return { type: 'featured', songs: [] };
		const url = `/api/songs${query ? '?q=' + encodeURIComponent(query) : '?limit=50'}`;
		const res = await fetch(url);
		if (!res.ok) throw new Error('Failed to fetch songs');
		const payload = await res.json();

		if (payload.songs) {
			const map = { ...likedSongsMap };
			payload.songs.forEach((s: any) => {
				if (map[s.id] === undefined) {
					map[s.id] = !!s.isLiked;
				}
			});
			likedSongsMap = map;
		} else if (payload.results?.songs) {
			const map = { ...likedSongsMap };
			payload.results.songs.forEach((s: any) => {
				if (map[s.id] === undefined) {
					map[s.id] = !!s.isLiked;
				}
			});
			likedSongsMap = map;
		}

		return payload;
	}

	async function getRecommendations() {
		if (!browser) return [];
		const res = await fetch('/api/recommendations');
		if (!res.ok) throw new Error('Failed to fetch recommendations');
		return await res.json();
	}

	async function getMusicDNA() {
		if (!browser) return null;
		const res = await fetch('/api/dna');
		if (!res.ok) throw new Error('Failed to fetch music DNA');
		return await res.json();
	}

	let statsPromise = getStats();
	let songsPromise = $derived(getSongs(data.searchQuery || ''));
	let recsPromise = $state(getRecommendations());
	let dnaPromise = $state(getMusicDNA());

	function filterSongs(songs: any[]) {
		if (!songs) return [];
		return songs.filter((s: any) => {
			const matchesGenre =
				selectedGenre === 'ALL' ||
				(s.genres &&
					s.genres.some((g: any) => g.name.toLowerCase().includes(selectedGenre.toLowerCase())));
			return matchesGenre;
		});
	}

	async function toggleLike(songId: string, event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();

		const currentStatus = !!likedSongsMap[songId];
		likedSongsMap[songId] = !currentStatus;

		try {
			const res = await fetch('/api/like', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ songId })
			});

			if (!res.ok) throw new Error('Like toggle failed');
			const payload = await res.json();
			likedSongsMap[songId] = payload.isLiked;

			// Refresh recommendations & DNA on like change
			recsPromise = getRecommendations();
			dnaPromise = getMusicDNA();
		} catch (err) {
			console.error('Error toggling like:', err);
			likedSongsMap[songId] = currentStatus;
		}
	}

	function scrollToSection(id: string) {
		const el = document.getElementById(id);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth' });
		}
	}
</script>

<svelte:head>
	<title>SonicMesh Studio — Graph Database Overview</title>
</svelte:head>

<div class="space-y-12 pb-16 font-mono">
	<!-- ========================================== -->
	<!-- SECTION 1 — Studio Hero Banner             -->
	<!-- ========================================== -->
	<section
		class="sb-grid-bg relative overflow-hidden rounded-xl border border-[#2e2e2e] bg-[#171717] p-8 shadow-lg md:p-12"
	>
		<div
			class="pointer-events-none absolute -top-20 -right-20 h-96 w-96 rounded-full bg-[#3ecf8e]/10 blur-3xl"
		></div>

		<div class="relative z-10 max-w-4xl space-y-6">
			<div
				class="inline-flex items-center gap-2 rounded-md border border-[#2b5940] bg-[#1c392b] px-3 py-1 text-xs font-semibold text-[#3ecf8e]"
			>
				<span class="h-2 w-2 animate-pulse rounded-full bg-[#3ecf8e]"></span>
				Music Connection Engine Active
			</div>

			<h1
				class="font-heading text-4xl leading-tight font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl"
			>
				Discover Music Through <span class="text-[#3ecf8e]">Connections</span>.
			</h1>

			<p class="max-w-2xl font-sans text-base leading-relaxed text-[#a1a1aa] sm:text-lg">
				SonicMesh maps the hidden relationships between songs, artists, composers, genres, and moods
				— discovering musical connections to find songs you'll love with full clarity.
			</p>

			<!-- <div class="flex flex-wrap items-center gap-4 pt-2">
				<button
					onclick={() => scrollToSection('try-it')}
					class="sb-btn-primary flex cursor-pointer items-center gap-2 px-6 py-3 text-xs font-semibold shadow-md"
				>
					Explore Catalog ➔
				</button>
				<button
					onclick={() => scrollToSection('concept')}
					class="sb-btn-secondary flex cursor-pointer items-center gap-2 px-6 py-3 text-xs font-semibold"
				>
					How It Works ↓
				</button>
			</div> -->

			<!-- Live Graph Stats Ticker -->
			{#await statsPromise}
				<div class="flex items-center gap-3 border-t border-[#2e2e2e] pt-6 text-xs text-[#71717a]">
					<span class="h-2 w-2 animate-pulse rounded-full bg-[#3ecf8e]"></span>
					Fetching graph statistics...
				</div>
			{:then stats}
				<dl class="grid grid-cols-2 gap-4 border-t border-[#2e2e2e] pt-6 sm:grid-cols-4">
					{#each [{ n: '01', label: 'Tracks cataloged', v: stats.songCount, color: 'text-[#3ecf8e]' }, { n: '02', label: 'Performers & singers', v: stats.artistCount, color: 'text-[#a855f7]' }, { n: '03', label: 'Composers', v: stats.composerCount, color: 'text-[#f59e0b]' }, { n: '04', label: 'Music Connections', v: stats.relationshipCount, color: 'text-[#3b82f6]' }] as row}
						<div class="rounded-lg border border-[#2e2e2e] bg-[#1e1e1e] p-3.5">
							<div class="text-[10px] font-bold text-[#71717a]">{row.n}</div>
							<dd class="font-heading mt-0.5 text-2xl font-bold text-white">{row.v}</dd>
							<dt class="mt-1 text-[10px] font-semibold text-[#a1a1aa] uppercase">{row.label}</dt>
						</div>
					{/each}
				</dl>
			{/await}
		</div>
	</section>

	<!-- Action Banner -->
	{#if form?.message}
		<div
			class="flex items-center justify-between rounded-md border border-[#2b5940] bg-[#1c392b] p-4 text-xs text-[#3ecf8e] shadow-sm"
		>
			<span>{form.message}</span>
		</div>
	{/if}

	<!-- ========================================== -->
	<!-- SECTION 2 — Graph Schema Visualization     -->
	<!-- ========================================== -->
	<section
		id="concept"
		class="space-y-6 rounded-xl border border-[#2e2e2e] bg-[#171717] p-6 md:p-10"
	>
		<div class="max-w-2xl space-y-2">
			<div class="text-xs font-semibold tracking-wider text-[#3ecf8e] uppercase">
				Graph Schema Architecture
			</div>
			<h2 class="font-heading text-2xl font-bold text-white sm:text-3xl">
				Multi-Hop Traversal Schema
			</h2>
			<p class="font-sans text-xs text-[#a1a1aa] sm:text-sm">
				A song isn't isolated — it connects to composers, performers, moods, genres, languages, and
				instruments in an interconnected graph mesh.
			</p>
		</div>

		<!-- Interactive Node Diagram Card -->
		<div
			class="relative overflow-hidden rounded-lg border border-[#2e2e2e] bg-[#121212] p-6 md:p-8"
		>
			<div class="grid grid-cols-1 items-center gap-4 text-center md:grid-cols-7">
				<!-- Source Node -->
				<div class="space-y-2 rounded-lg border border-[#2b5940] bg-[#1c392b]/40 p-4 md:col-span-2">
					<div
						class="inline-block rounded bg-[#1c392b] px-2 py-0.5 text-[10px] font-bold text-[#3ecf8e] uppercase"
					>
						♥ Liked Song
					</div>
					<div class="font-heading text-base font-bold text-white">Vaseegara</div>
					<div class="text-[11px] text-[#a1a1aa]">Bombay Jayashri &bull; Minnale</div>
				</div>

				<!-- Hops Hub -->
				<div class="space-y-2 py-2 md:col-span-3">
					<div class="text-[10px] font-bold text-[#f59e0b] uppercase">⚡ Music Connections</div>
					<div class="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
						<span
							class="rounded border border-[#f59e0b]/40 bg-[#1e1e1e] px-2 py-0.5 text-[#f59e0b]"
						>
							:COMPOSED (Harris Jayaraj)
						</span>
						<span
							class="rounded border border-[#f43f5e]/40 bg-[#1e1e1e] px-2 py-0.5 text-[#f43f5e]"
						>
							:HAS_MOOD (Romantic)
						</span>
						<span
							class="rounded border border-[#3ecf8e]/40 bg-[#1e1e1e] px-2 py-0.5 text-[#3ecf8e]"
						>
							:HAS_GENRE (Melody)
						</span>
					</div>
					<div class="pt-1 text-[10px] text-[#71717a]">
						(Song) ➔ [:COMPOSED|:HAS_MOOD|:HAS_GENRE] ➔ (Candidate Track)
					</div>
				</div>

				<!-- Target Recommendation -->
				<div
					class="space-y-2 rounded-lg border border-[#3ecf8e]/40 bg-[#1c392b]/60 p-4 md:col-span-2"
				>
					<div
						class="inline-block rounded bg-[#3ecf8e] px-2 py-0.5 text-[10px] font-bold text-[#062317] uppercase"
					>
						94% Score Match
					</div>
					<div class="font-heading text-base font-bold text-white">Munbe Vaa</div>
					<div class="text-[11px] text-[#3ecf8e]">Target Recommendation</div>
				</div>
			</div>
		</div>

		<div class="flex justify-start">
			<a
				href="/connect"
				class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3ecf8e] hover:underline"
			>
				Trace shortest path between any two artists ➔
			</a>
		</div>
	</section>

	<!-- ========================================== -->
	<!-- SECTION 3 — How It Works (Pipeline)        -->
	<!-- ========================================== -->
	<section class="space-y-6">
		<div class="space-y-2">
			<div class="text-xs font-semibold tracking-wider text-[#3ecf8e] uppercase">
				Discovery Engine
			</div>
			<h2 class="font-heading text-2xl font-bold text-white sm:text-3xl">
				How SonicMesh Recommends
			</h2>
		</div>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
			{#each [{ n: '01', title: 'Seed Taste Profile', body: 'Save tracks to your collection to build your music taste profile.' }, { n: '02', title: 'Extract Metadata', body: 'SonicMesh pulls out composers, singers, moods, genres, languages, and instruments.' }, { n: '03', title: 'Multi-Hop Matching', body: 'Searches connections 2 to 5 steps out to find shared creators.' }, { n: '04', title: 'Explainable Paths', body: 'Every recommendation comes with explicit relationship reasoning.' }] as step}
				<div class="space-y-2 rounded-lg border border-[#2e2e2e] bg-[#171717] p-5">
					<div class="text-xl font-bold text-[#3ecf8e]">{step.n}</div>
					<h3 class="font-heading text-sm font-bold text-white">{step.title}</h3>
					<p class="font-sans text-xs leading-relaxed text-[#a1a1aa]">{step.body}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- ========================================== -->
	<!-- SECTION 4 — See What You Get               -->
	<!-- ========================================== -->
	<section class="space-y-6 rounded-xl border border-[#2e2e2e] bg-[#171717] p-6 md:p-10">
		<div
			class="flex flex-col gap-4 border-b border-[#2e2e2e] pb-6 md:flex-row md:items-center md:justify-between"
		>
			<div>
				<div class="text-xs font-semibold tracking-wider text-[#3ecf8e] uppercase">
					Explainable Recommendations
				</div>
				<h2 class="font-heading mt-1 text-2xl font-bold text-white">See What You Get</h2>
				<p class="mt-1 font-sans text-xs text-[#a1a1aa]">
					Every match comes with full graph path transparency.
				</p>
			</div>
			<a href="/recommendations" class="sb-btn-primary shrink-0 px-4 py-2 text-xs font-semibold">
				Open Recommendation Console ➔
			</a>
		</div>

		<!-- Live Explainable Recommendation Card -->
		{#await recsPromise}
			<div class="h-36 animate-pulse rounded-lg border border-[#2e2e2e] bg-[#1e1e1e]"></div>
		{:then recommendations}
			{#if recommendations && recommendations.length > 0}
				{@const rec = recommendations[0]}
				{@const pathLinks = rec.pathLinks || []}
				{@const likedTitles = Array.from(new Set(pathLinks.map((p: any) => p.likedTitle))).filter(Boolean)}
				<div class="space-y-4 rounded-lg border border-[#2e2e2e] bg-[#1e1e1e] p-6">
					<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
						<div class="flex items-center gap-4">
							<div class="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#2e2e2e]">
								<EntityIcon type="song" class="h-full w-full" />
							</div>
							<div>
								<div class="flex items-center gap-2.5">
									<a href="/song/{rec.song.id}" class="font-heading text-lg font-bold text-white hover:text-[#3ecf8e] hover:underline">
										{rec.song.title}
									</a>
									<span class="sb-badge-green px-2 py-0.5 text-xs font-bold">{rec.score}% Match</span>
								</div>
								<p class="text-xs text-[#a1a1aa] mt-0.5">
									{#if rec.album}
										<span class="text-[#ededed] font-semibold">💿 {rec.album.title}</span> &bull;
									{/if}
									{rec.composers.length ? rec.composers.join(', ') : 'Composer'} &bull; {rec.artists.length ? rec.artists.join(', ') : 'Performer'} &bull; {rec.language}
								</p>
							</div>
						</div>

						<button
							onclick={() => (showSampleWhy = !showSampleWhy)}
							class="sb-btn-secondary shrink-0 cursor-pointer px-4 py-2 text-xs font-semibold"
						>
							{showSampleWhy ? 'Hide Recommendation Reasons' : 'Why this song? ➔'}
						</button>
					</div>

					<div class="flex flex-wrap items-center gap-2 border-t border-[#2e2e2e] pt-3 text-xs">
						<span class="text-[10px] font-bold text-[#71717a] uppercase">Because you liked:</span>
						{#each likedTitles.slice(0, 3) as likedTitle}
							<span class="sb-badge-rose px-2.5 py-0.5 text-xs font-bold">♥ {likedTitle}</span>
						{/each}
						{#each pathLinks.slice(0, 3) as link}
							<span class="sb-badge-amber px-2.5 py-0.5 text-xs">{link.connectorType}: {link.connectorName}</span>
						{/each}
					</div>

					{#if showSampleWhy}
						<div class="sb-fade-in space-y-3 border-t border-[#2e2e2e] pt-3 text-xs">
							<div class="text-[11px] font-bold text-[#3ecf8e] uppercase">
								⚡ Graph Path Execution Trace:
							</div>
							<div class="space-y-2">
								{#each pathLinks.slice(0, 2) as link}
									<div class="flex flex-wrap items-center gap-2 rounded border border-[#2e2e2e] bg-[#121212] p-2.5 text-[#ededed]">
										<span class="sb-badge-rose px-2 py-0.5 font-bold">{link.likedTitle}</span>
										<span class="text-[#71717a]">➔</span>
										<span class="sb-badge-amber px-2 py-0.5 font-bold">:{link.connectorType.toUpperCase()}</span>
										<span class="text-[#71717a]">➔</span>
										<span class="rounded bg-[#262626] px-2 py-0.5 font-bold">{link.connectorName}</span>
										<span class="text-[#71717a]">➔</span>
										<span class="sb-badge-green px-2 py-0.5 font-bold">{rec.song.title} (+{link.points || 20} Pts)</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{:else}
				<div class="rounded-lg border border-dashed border-[#2e2e2e] bg-[#1e1e1e] p-6 text-center text-xs text-[#a1a1aa]">
					Like songs in the catalog to generate personalized explainable recommendations.
				</div>
			{/if}
		{/await}
	</section>

	<!-- ========================================== -->
	<!-- SECTION 5 — Search & Catalog Results       -->
	<!-- ========================================== -->
	<section id="try-it" class="space-y-8">
		<!-- Search Form -->
		<div class="space-y-5 rounded-xl border border-[#2e2e2e] bg-[#171717] p-6 md:p-8">
			<div class="space-y-1">
				<div class="text-xs font-semibold tracking-wider text-[#3ecf8e] uppercase">
					Query Graph Catalog
				</div>
				<h2 class="font-heading text-2xl font-bold text-white">Search Music</h2>
				<p class="font-sans text-xs text-[#a1a1aa]">
					Search any track, performer, or composer to explore graph connections.
				</p>
			</div>

			<div class="max-w-2xl">
				<SearchAutocomplete
					bind:value={searchInput}
					actionUrl="/#search-results"
					size="lg"
					placeholder="Search songs, artists, composers..."
				/>
			</div>

			<div class="flex flex-wrap items-center gap-2 border-t border-[#2e2e2e] pt-3 text-xs">
				<span class="text-[#71717a]">Presets:</span>
				<a
					href="/?q=Vaseegara#search-results"
					class="rounded border border-[#2e2e2e] bg-[#1e1e1e] px-2.5 py-1 text-[#3ecf8e] transition-colors hover:border-[#3ecf8e]"
					>Vaseegara</a
				>
				<a
					href="/?q=A.R.%20Rahman#search-results"
					class="rounded border border-[#2e2e2e] bg-[#1e1e1e] px-2.5 py-1 text-[#3ecf8e] transition-colors hover:border-[#3ecf8e]"
					>A.R. Rahman</a
				>
				<a
					href="/?q=Harris%20Jayaraj#search-results"
					class="rounded border border-[#2e2e2e] bg-[#1e1e1e] px-2.5 py-1 text-[#3ecf8e] transition-colors hover:border-[#3ecf8e]"
					>Harris Jayaraj</a
				>
				<a
					href="/?q=Ed%20Sheeran#search-results"
					class="rounded border border-[#2e2e2e] bg-[#1e1e1e] px-2.5 py-1 text-[#3ecf8e] transition-colors hover:border-[#3ecf8e]"
					>Ed Sheeran</a
				>
			</div>
		</div>

		<!-- Catalog Style Song Listing Grid Section (Immediately Below Search Input) -->
		<section id="search-results" class="space-y-4 pt-4 scroll-mt-20">
			<div
				class="flex flex-col gap-4 border-b border-[#2e2e2e] pb-4 md:flex-row md:items-center md:justify-between"
			>
				<div>
					<div class="flex items-center gap-2">
						<span class="h-2.5 w-2.5 animate-pulse rounded-full bg-[#3ecf8e]"></span>
						<h2 class="font-heading text-2xl font-bold text-white">
							{data.searchQuery ? `Query Results for "${data.searchQuery}"` : 'Songs Catalog'}
						</h2>
					</div>
					<p class="mt-1 font-sans text-xs text-[#a1a1aa]">
						Explore catalog songs. Click the heart icon on any card to save your favorite songs and
						get recommendations.
					</p>
				</div>

				<!-- Quick Actions & Genre Filters -->
				<div class="flex flex-wrap items-center gap-2">
					<div
						class="flex flex-wrap items-center gap-1 rounded-lg border border-[#2e2e2e] bg-[#171717] p-1 text-xs"
					>
						<span class="px-1.5 text-[11px] text-[#71717a]">Genre:</span>
						{#each [{ id: 'ALL', label: 'All' }, { id: 'Melody', label: 'Melody' }, { id: 'Kuthu', label: 'Kuthu' }, { id: 'Classical', label: 'Classical' }, { id: 'Pop', label: 'Pop' }] as g}
							<button
								onclick={() => (selectedGenre = g.id)}
								class="cursor-pointer rounded px-2.5 py-1 text-[11px] transition-all {selectedGenre ===
								g.id
									? 'border border-[#2b5940] bg-[#1c392b] font-bold text-[#3ecf8e]'
									: 'border border-transparent text-[#a1a1aa] hover:text-white'}"
							>
								{g.label}
							</button>
						{/each}
					</div>

					<a
						href="/catalog"
						class="sb-btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
					>
						Full Catalog ➔
					</a>
				</div>
			</div>

			{#await songsPromise}
				<LoadingSkeleton variant="card" count={12} />
			{:then dataPayload}
				{#if dataPayload.type === 'search'}
					{#if dataPayload.results.songs.length === 0 && dataPayload.results.artists.length === 0 && dataPayload.results.composers.length === 0}
						<div
							class="rounded-lg border border-dashed border-[#2e2e2e] bg-[#171717] p-8 text-center text-xs text-[#a1a1aa]"
						>
							No matching songs or artists found. Try searching for another title!
						</div>
					{:else}
						<!-- Artists & Composers Nodes -->
						{#if dataPayload.results.artists.length > 0 || dataPayload.results.composers.length > 0}
							<div class="grid grid-cols-1 gap-3 pb-2 sm:grid-cols-2 md:grid-cols-3">
								{#each dataPayload.results.artists as a}
									<a
										href="/artist/{a.name}"
										class="flex items-center gap-3 rounded-lg border border-[#2e2e2e] bg-[#171717] p-3 transition-all hover:border-[#a855f7]"
									>
										<EntityIcon type="artist" class="h-10 w-10 shrink-0" />
										<div class="overflow-hidden">
											<div class="font-heading truncate text-xs font-bold text-white">{a.name}</div>
											<div class="text-[9px] font-bold text-[#a855f7] uppercase">Artist</div>
										</div>
									</a>
								{/each}
								{#each dataPayload.results.composers as c}
									<a
										href="/artist/{c.name}"
										class="flex items-center gap-3 rounded-lg border border-[#2e2e2e] bg-[#171717] p-3 transition-all hover:border-[#f59e0b]"
									>
										<EntityIcon type="composer" class="h-10 w-10 shrink-0" />
										<div class="overflow-hidden">
											<div class="font-heading truncate text-xs font-bold text-white">{c.name}</div>
											<div class="text-[9px] font-bold text-[#f59e0b] uppercase">Composer</div>
										</div>
									</a>
								{/each}
							</div>
						{/if}

						<!-- Catalog Style Songs Grid for Search Results -->
						{@const searchSongs = filterSongs(dataPayload.results.songs)}
						{#if searchSongs.length === 0}
							<div
								class="rounded-xl border border-dashed border-[#2e2e2e] bg-[#171717] p-8 text-center text-xs text-[#a1a1aa]"
							>
								No track nodes match your selected genre filter.
							</div>
						{:else}
							<div
								class="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
							>
								{#each searchSongs as song (song.id)}
									{@const isLiked =
										likedSongsMap[song.id] !== undefined ? likedSongsMap[song.id] : !!song.isLiked}

									<a
										href="/song/{song.id}"
										class="group relative flex flex-col overflow-hidden rounded-lg border border-[#2e2e2e] bg-[#171717] shadow-xs transition-all hover:border-[#3ecf8e]"
									>
										<!-- Header Image & Like Button -->
										<div class="relative h-28 w-full shrink-0 overflow-hidden bg-[#1e1e1e] sm:h-32">
											<EntityIcon
												type="song"
												class="h-full w-full transition-transform duration-300 group-hover:scale-105"
											/>

											<!-- Interactive Heart Toggle Overlay -->
											<button
												onclick={(e) => toggleLike(song.id, e)}
												title={isLiked ? 'Unlike song in graph' : 'Like song in graph'}
												aria-label={isLiked ? 'Unlike song' : 'Like song'}
												class="absolute top-2 right-2 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border shadow-md backdrop-blur-xs transition-all
												{isLiked
													? 'scale-105 border-[#f43f5e] bg-[#f43f5e] text-white shadow-rose-900/50'
													: 'border-[#333] bg-[#121212]/80 text-[#a1a1aa] hover:border-[#f43f5e] hover:text-[#f43f5e]'}"
											>
												<svg
													class="h-3.5 w-3.5 {isLiked ? 'fill-current' : 'fill-none'}"
													viewBox="0 0 24 24"
													stroke="currentColor"
													stroke-width="2"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
													/>
												</svg>
											</button>

											{#if song.releaseYear}
												<div
													class="absolute bottom-1.5 left-1.5 rounded border border-[#2e2e2e] bg-[#121212]/90 px-1.5 py-0.5 text-[9px] font-bold text-[#3ecf8e]"
												>
													{song.releaseYear}
												</div>
											{/if}
										</div>

										<!-- Essential Details -->
										<div class="flex flex-1 flex-col justify-between space-y-2 p-2.5">
											<div class="space-y-0.5">
												<h3
													class="font-heading truncate text-xs font-bold text-white transition-colors group-hover:text-[#3ecf8e]"
												>
													{song.title || song.name}
												</h3>
												<p class="truncate text-[10px] text-[#a1a1aa]">
													{song.artists?.[0]?.name || song.composers?.[0]?.name || 'Various'}
												</p>
											</div>

											<div
												class="flex flex-wrap items-center justify-between gap-1 border-t border-[#2e2e2e] pt-1 text-[9px]"
											>
												<span
													class="sb-badge-purple max-w-[80px] truncate px-1.5 py-0.5 text-[8px] font-bold"
												>
													{song.genres?.[0]?.name || 'Music'}
												</span>
												<span class="font-bold text-[#3ecf8e]">
													{song.popularity || 85}% Score
												</span>
											</div>
										</div>
									</a>
								{/each}
							</div>
						{/if}
					{/if}
				{:else}
					<!-- Catalog Featured Songs Grid -->
					{@const filteredSongs = filterSongs(dataPayload.songs)}
					{#if filteredSongs.length === 0}
						<div
							class="rounded-xl border border-dashed border-[#2e2e2e] bg-[#171717] p-12 text-center text-xs text-[#a1a1aa]"
						>
							No catalog tracks match your selected genre filter.
						</div>
					{:else}
						<div
							class="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
						>
							{#each filteredSongs as song (song.id)}
								{@const isLiked =
									likedSongsMap[song.id] !== undefined ? likedSongsMap[song.id] : !!song.isLiked}

								<a
									href="/song/{song.id}"
									class="group relative flex flex-col overflow-hidden rounded-lg border border-[#2e2e2e] bg-[#171717] shadow-xs transition-all hover:border-[#3ecf8e]"
								>
									<!-- Header Image & Like Overlay -->
									<div class="relative h-28 w-full shrink-0 overflow-hidden bg-[#1e1e1e] sm:h-32">
										<EntityIcon
											type="song"
											class="h-full w-full transition-transform duration-300 group-hover:scale-105"
										/>

										<!-- Interactive Heart Button -->
										<button
											onclick={(e) => toggleLike(song.id, e)}
											title={isLiked ? 'Unlike song in graph' : 'Like song in graph'}
											aria-label={isLiked ? 'Unlike song' : 'Like song'}
											class="absolute top-2 right-2 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border shadow-md backdrop-blur-xs transition-all
											{isLiked
												? 'scale-105 border-[#f43f5e] bg-[#f43f5e] text-white shadow-rose-900/50'
												: 'border-[#333] bg-[#121212]/80 text-[#a1a1aa] hover:border-[#f43f5e] hover:text-[#f43f5e]'}"
										>
											<svg
												class="h-3.5 w-3.5 {isLiked ? 'fill-current' : 'fill-none'}"
												viewBox="0 0 24 24"
												stroke="currentColor"
												stroke-width="2"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
												/>
											</svg>
										</button>

										<!-- Year Badge -->
										<div
											class="absolute bottom-1.5 left-1.5 rounded border border-[#2e2e2e] bg-[#121212]/90 px-1.5 py-0.5 text-[9px] font-bold text-[#3ecf8e]"
										>
											{song.releaseYear}
										</div>
									</div>

									<!-- Selective Essential Details -->
									<div class="flex flex-1 flex-col justify-between space-y-2 p-2.5">
										<div class="space-y-0.5">
											<!-- Title -->
											<h3
												class="font-heading truncate text-xs font-bold text-white transition-colors group-hover:text-[#3ecf8e]"
											>
												{song.title}
											</h3>
											<!-- Primary Artist / Composer -->
											<p class="truncate text-[10px] text-[#a1a1aa]">
												{song.artists[0]?.name || song.composers[0]?.name || 'Various'}
											</p>
										</div>

										<!-- Selective Details Pill Tags -->
										<div
											class="flex flex-wrap items-center justify-between gap-1 border-t border-[#2e2e2e] pt-1 text-[9px]"
										>
											<span
												class="sb-badge-purple max-w-[80px] truncate px-1.5 py-0.5 text-[8px] font-bold"
											>
												{song.genres[0]?.name || 'Music'}
											</span>
											<span class="font-bold text-[#3ecf8e]">
												{song.popularity}% Score
											</span>
										</div>
									</div>
								</a>
							{/each}
						</div>
					{/if}
				{/if}
			{/await}
		</section>

		<!-- Music DNA Breakdown -->
		{#await dnaPromise}
			<LoadingSkeleton variant="dna" />
		{:then musicDNA}
			{#if musicDNA}
				{#if musicDNA.totalLikedCount === 0}
					<section class="space-y-4 rounded-xl border border-dashed border-[#2e2e2e] bg-[#171717] p-8 text-center shadow-sm">
						<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#26151a] text-xl text-[#f43f5e]">
							🧬
						</div>
						<h3 class="font-heading text-lg font-bold text-white">Your Music DNA Profile is Empty</h3>
						<p class="mx-auto max-w-md text-xs text-[#a1a1aa] font-sans">
							Like songs in the catalog above by clicking the heart button (❤️) to generate your music taste DNA!
						</p>
					</section>
				{:else}
					<section
						class="space-y-4 rounded-xl border border-[#2e2e2e] bg-[#171717] p-6 shadow-md md:p-8"
					>
						<div class="flex items-center justify-between border-b border-[#2e2e2e] pb-3">
							<div>
								<div class="text-xs font-semibold tracking-wider text-[#3ecf8e] uppercase">
									🧬 User Taste Profiler
								</div>
								<h2 class="font-heading mt-0.5 text-xl font-bold text-white">Your Music DNA</h2>
							</div>
							<a
								href="/liked-connections"
								class="text-xs font-semibold text-[#3ecf8e] hover:underline"
							>
								Explore full taste mesh ➔
							</a>
						</div>

						<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
							<div class="space-y-3 rounded-lg border border-[#2e2e2e] bg-[#1e1e1e] p-4">
								<div class="flex justify-between text-xs font-bold text-[#a1a1aa] uppercase">
									<span>Top Genres</span>
								</div>
								<div class="space-y-2">
									{#each musicDNA.topGenres as g}
										<div class="space-y-1">
											<div class="flex justify-between text-xs font-bold text-white">
												<span>{g.icon} {g.name}</span>
												<span class="text-[#3ecf8e]">{g.percentage}%</span>
											</div>
											<div class="h-1.5 w-full overflow-hidden rounded-full bg-[#262626]">
												<div
													class="h-full rounded-full bg-[#3ecf8e]"
													style="width: {g.percentage}%"
												></div>
											</div>
										</div>
									{/each}
								</div>
							</div>

							<div class="space-y-3 rounded-lg border border-[#2e2e2e] bg-[#1e1e1e] p-4">
								<div class="text-xs font-bold text-[#a1a1aa] uppercase">
									<span>Top Moods</span>
								</div>
								<div class="space-y-2">
									{#each musicDNA.topMoods as m}
										<div class="space-y-1">
											<div class="flex justify-between text-xs font-bold text-white">
												<span>{m.icon} {m.name}</span>
												<span class="text-[#a855f7]">{m.percentage}%</span>
											</div>
											<div class="h-1.5 w-full overflow-hidden rounded-full bg-[#262626]">
												<div
													class="h-full rounded-full bg-[#a855f7]"
													style="width: {m.percentage}%"
												></div>
											</div>
										</div>
									{/each}
								</div>
							</div>

							<div class="space-y-3 rounded-lg border border-[#2e2e2e] bg-[#1e1e1e] p-4">
								<div class="text-xs font-bold text-[#a1a1aa] uppercase">Top Connected Composers</div>
								<div class="space-y-1.5">
									{#each musicDNA.topComposers as composer}
										<div
											class="flex items-center gap-2 rounded border border-[#2e2e2e] bg-[#171717] p-2 text-xs"
										>
											<span class="font-bold text-[#f59e0b]">🎼</span>
											<span class="truncate font-semibold text-white">{composer}</span>
										</div>
									{/each}
								</div>
							</div>
						</div>
					</section>
				{/if}
			{/if}
		{/await}
	</section>
</div>
