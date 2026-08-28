<script lang="ts">
	import { enhance } from '$app/forms';
	import { browser } from '$app/environment';
	import LoadingSkeleton from '$lib/components/LoadingSkeleton.svelte';

	let { data, form } = $props();

	let searchInput = $state('');
	let showSampleWhy = $state(false);

	$effect(() => {
		searchInput = data.searchQuery || '';
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
		const url = `/api/songs${query ? '?q=' + encodeURIComponent(query) : ''}`;
		const res = await fetch(url);
		if (!res.ok) throw new Error('Failed to fetch songs');
		return await res.json();
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
	let recsPromise = getRecommendations();
	let dnaPromise = getMusicDNA();

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

<div class="space-y-12 pb-16">
	<!-- ========================================== -->
	<!-- SECTION 1 — Studio Hero Banner             -->
	<!-- ========================================== -->
	<section
		class="relative overflow-hidden rounded-xl border border-[#2e2e2e] bg-[#171717] p-8 md:p-12 sb-grid-bg shadow-lg"
	>
		<div class="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#3ecf8e]/10 blur-3xl pointer-events-none"></div>

		<div class="relative z-10 max-w-4xl space-y-6">
			<div
				class="inline-flex items-center gap-2 rounded-md border border-[#2b5940] bg-[#1c392b] px-3 py-1 font-mono text-xs font-semibold text-[#3ecf8e]"
			>
				<span class="h-2 w-2 rounded-full bg-[#3ecf8e] animate-pulse"></span>
				CognoDB openCypher Graph Engine Active
			</div>

			<h1 class="font-heading text-4xl leading-tight font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
				Discover Music Through <span class="text-[#3ecf8e]">Connections</span>.
			</h1>

			<p class="max-w-2xl text-base text-[#a1a1aa] leading-relaxed sm:text-lg">
				SonicMesh maps the hidden relationships between songs, artists, composers, genres, and moods — following multi-hop Cypher paths to discover music you'll love with full explainability.
			</p>

			<div class="flex flex-wrap items-center gap-4 pt-2">
				<button
					onclick={() => scrollToSection('try-it')}
					class="sb-btn-primary px-6 py-3 font-mono text-xs font-semibold shadow-md flex items-center gap-2 cursor-pointer"
				>
					Explore Catalog ➔
				</button>
				<button
					onclick={() => scrollToSection('concept')}
					class="sb-btn-secondary px-6 py-3 font-mono text-xs font-semibold flex items-center gap-2 cursor-pointer"
				>
					Inspect Graph Schema ↓
				</button>
			</div>

			<!-- Live Graph Stats Ticker -->
			{#await statsPromise}
				<div class="flex items-center gap-3 border-t border-[#2e2e2e] pt-6 font-mono text-xs text-[#71717a]">
					<span class="h-2 w-2 animate-pulse rounded-full bg-[#3ecf8e]"></span>
					Fetching graph statistics...
				</div>
			{:then stats}
				<dl class="grid grid-cols-2 gap-4 border-t border-[#2e2e2e] pt-6 sm:grid-cols-4 font-mono">
					{#each [{ n: '01', label: 'Tracks cataloged', v: stats.songCount, color: 'text-[#3ecf8e]' }, { n: '02', label: 'Performers & singers', v: stats.artistCount, color: 'text-[#a855f7]' }, { n: '03', label: 'Composers', v: stats.composerCount, color: 'text-[#f59e0b]' }, { n: '04', label: 'Typed Cypher links', v: stats.relationshipCount, color: 'text-[#3b82f6]' }] as row}
						<div class="rounded-lg border border-[#2e2e2e] bg-[#1e1e1e] p-3.5">
							<div class="text-[10px] text-[#71717a] font-bold">{row.n}</div>
							<dd class="font-heading text-2xl font-bold text-white mt-0.5">{row.v}</dd>
							<dt class="text-[10px] uppercase font-semibold text-[#a1a1aa] mt-1">{row.label}</dt>
						</div>
					{/each}
				</dl>
			{/await}
		</div>
	</section>

	<!-- Action Banner -->
	{#if form?.message}
		<div
			class="flex items-center justify-between rounded-md border border-[#2b5940] bg-[#1c392b] p-4 text-xs font-mono text-[#3ecf8e] shadow-sm"
		>
			<span>{form.message}</span>
		</div>
	{/if}

	<!-- ========================================== -->
	<!-- SECTION 2 — Graph Schema Visualization     -->
	<!-- ========================================== -->
	<section id="concept" class="space-y-6 rounded-xl border border-[#2e2e2e] bg-[#171717] p-6 md:p-10">
		<div class="max-w-2xl space-y-2">
			<div class="font-mono text-xs font-semibold uppercase tracking-wider text-[#3ecf8e]">
				Graph Schema Architecture
			</div>
			<h2 class="font-heading text-2xl font-bold text-white sm:text-3xl">
				Multi-Hop Traversal Schema
			</h2>
			<p class="text-xs text-[#a1a1aa] sm:text-sm">
				A song isn't isolated — it connects to composers, performers, moods, genres, languages, and instruments in an interconnected graph mesh.
			</p>
		</div>

		<!-- Interactive Node Diagram Card -->
		<div class="relative overflow-hidden rounded-lg border border-[#2e2e2e] bg-[#121212] p-6 md:p-8">
			<div class="grid grid-cols-1 md:grid-cols-7 gap-4 items-center text-center font-mono">
				<!-- Source Node -->
				<div class="md:col-span-2 rounded-lg border border-[#2b5940] bg-[#1c392b]/40 p-4 space-y-2">
					<div class="inline-block px-2 py-0.5 rounded bg-[#1c392b] text-[#3ecf8e] text-[10px] font-bold uppercase">
						♥ Liked Track Node
					</div>
					<div class="text-base font-bold text-white font-heading">Vaseegara</div>
					<div class="text-[11px] text-[#a1a1aa]">Bombay Jayashri &bull; Minnale</div>
				</div>

				<!-- Hops Hub -->
				<div class="md:col-span-3 space-y-2 py-2">
					<div class="text-[10px] text-[#f59e0b] font-bold uppercase">
						⚡ Typed Relationship Edges
					</div>
					<div class="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
						<span class="px-2 py-0.5 rounded bg-[#1e1e1e] border border-[#f59e0b]/40 text-[#f59e0b]">
							:COMPOSED (Harris Jayaraj)
						</span>
						<span class="px-2 py-0.5 rounded bg-[#1e1e1e] border border-[#f43f5e]/40 text-[#f43f5e]">
							:HAS_MOOD (Romantic)
						</span>
						<span class="px-2 py-0.5 rounded bg-[#1e1e1e] border border-[#3ecf8e]/40 text-[#3ecf8e]">
							:HAS_GENRE (Melody)
						</span>
					</div>
					<div class="text-[10px] text-[#71717a] pt-1">
						(Song) ➔ [:COMPOSED|:HAS_MOOD|:HAS_GENRE] ➔ (Candidate Track)
					</div>
				</div>

				<!-- Target Recommendation -->
				<div class="md:col-span-2 rounded-lg border border-[#3ecf8e]/40 bg-[#1c392b]/60 p-4 space-y-2">
					<div class="inline-block px-2 py-0.5 rounded bg-[#3ecf8e] text-[#062317] text-[10px] font-bold uppercase">
						94% Score Match
					</div>
					<div class="text-base font-bold text-white font-heading">Munbe Vaa</div>
					<div class="text-[11px] text-[#3ecf8e]">Target Recommendation</div>
				</div>
			</div>
		</div>

		<div class="flex justify-start">
			<a
				href="/connect"
				class="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#3ecf8e] hover:underline"
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
			<div class="font-mono text-xs font-semibold uppercase tracking-wider text-[#3ecf8e]">
				Discovery Engine
			</div>
			<h2 class="font-heading text-2xl font-bold text-white sm:text-3xl">How SonicMesh Recommends</h2>
		</div>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 font-mono">
			{#each [{ n: '01', title: 'Seed Taste Profile', body: 'Save tracks to your collection to build your graph taste vector.' }, { n: '02', title: 'Extract Metadata', body: 'SonicMesh pulls out composers, singers, moods, genres, languages, and instruments.' }, { n: '03', title: 'Cypher Traversals', body: 'Multi-hop queries traverse graph edges 2 to 5 hops out.' }, { n: '04', title: 'Explainable Paths', body: 'Every recommendation comes with explicit relationship reasoning.' }] as step}
				<div class="rounded-lg border border-[#2e2e2e] bg-[#171717] p-5 space-y-2">
					<div class="text-xl font-bold text-[#3ecf8e]">{step.n}</div>
					<h3 class="text-sm font-bold text-white font-heading">{step.title}</h3>
					<p class="text-xs text-[#a1a1aa] leading-relaxed">{step.body}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- ========================================== -->
	<!-- SECTION 4 — See What You Get               -->
	<!-- ========================================== -->
	<section class="space-y-6 rounded-xl border border-[#2e2e2e] bg-[#171717] p-6 md:p-10">
		<div class="flex flex-col gap-4 border-b border-[#2e2e2e] pb-6 md:flex-row md:items-center md:justify-between">
			<div>
				<div class="font-mono text-xs font-semibold uppercase tracking-wider text-[#3ecf8e]">
					Explainable Recommendations
				</div>
				<h2 class="font-heading text-2xl font-bold text-white mt-1">See What You Get</h2>
				<p class="mt-1 text-xs text-[#a1a1aa]">Every match comes with full graph path transparency.</p>
			</div>
			<a
				href="/recommendations"
				class="sb-btn-primary px-4 py-2 font-mono text-xs font-semibold shrink-0"
			>
				Open Recommendation Console ➔
			</a>
		</div>

		<!-- Sample Recommendation Card -->
		<div class="space-y-4 rounded-lg border border-[#2e2e2e] bg-[#1e1e1e] p-6">
			<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div class="flex items-center gap-4">
					<img
						src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&q=80"
						alt="Munbe Vaa"
						class="h-14 w-14 shrink-0 rounded-md border border-[#2e2e2e] object-cover shadow-sm"
					/>
					<div>
						<div class="flex items-center gap-2">
							<h3 class="font-heading text-lg font-bold text-white">Munbe Vaa</h3>
							<span class="sb-badge-green px-2 py-0.5 text-xs font-mono font-bold">94% Match</span>
						</div>
						<p class="text-xs text-[#a1a1aa] font-mono">Harris Jayaraj &bull; Shreya Ghoshal &bull; Tamil</p>
					</div>
				</div>

				<button
					onclick={() => (showSampleWhy = !showSampleWhy)}
					class="sb-btn-secondary px-4 py-2 text-xs font-mono font-semibold shrink-0 cursor-pointer"
				>
					{showSampleWhy ? 'Hide Cypher Trace' : 'Why this song? ➔'}
				</button>
			</div>

			<div class="flex flex-wrap items-center gap-2 border-t border-[#2e2e2e] pt-3 text-xs font-mono">
				<span class="text-[#71717a] font-bold uppercase text-[10px]">Because you liked:</span>
				<span class="sb-badge-rose px-2.5 py-0.5 text-xs font-bold">♥ Vaseegara</span>
				<span class="sb-badge-amber px-2.5 py-0.5 text-xs">Same Composer: Harris Jayaraj</span>
				<span class="sb-badge-green px-2.5 py-0.5 text-xs">Same Mood: Romantic</span>
			</div>

			{#if showSampleWhy}
				<div class="sb-fade-in space-y-2 border-t border-[#2e2e2e] pt-3 font-mono text-xs">
					<div class="text-[#3ecf8e] font-bold text-[11px] uppercase">⚡ Graph Path Execution Trace:</div>
					<div class="space-y-2 rounded bg-[#121212] border border-[#2e2e2e] p-3 text-[#ededed]">
						<div class="flex flex-wrap items-center gap-2">
							<span class="sb-badge-rose px-2 py-0.5 font-bold">Vaseegara</span>
							<span class="text-[#71717a]">➔</span>
							<span class="sb-badge-amber px-2 py-0.5 font-bold">:COMPOSED</span>
							<span class="text-[#71717a]">➔</span>
							<span class="px-2 py-0.5 rounded bg-[#262626] font-bold">Harris Jayaraj</span>
							<span class="text-[#71717a]">➔</span>
							<span class="sb-badge-green px-2 py-0.5 font-bold">Munbe Vaa (+20 Pts)</span>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</section>

	<!-- ========================================== -->
	<!-- SECTION 5 — Try It & Catalog              -->
	<!-- ========================================== -->
	<section id="try-it" class="space-y-8">
		<!-- Search Form -->
		<div class="space-y-5 rounded-xl border border-[#2e2e2e] bg-[#171717] p-6 md:p-8">
			<div class="space-y-1">
				<div class="font-mono text-xs font-semibold uppercase tracking-wider text-[#3ecf8e]">
					Query Graph Catalog
				</div>
				<h2 class="font-heading text-2xl font-bold text-white">Search Music Nodes</h2>
				<p class="text-xs text-[#a1a1aa]">Search any track, performer, or composer to explore graph connections.</p>
			</div>

			<form method="GET" action="/" class="relative flex max-w-2xl items-center">
				<svg
					class="pointer-events-none absolute left-4 h-5 w-5 text-[#71717a]"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
				<input
					type="text"
					name="q"
					bind:value={searchInput}
					placeholder="Search songs, artists, composers..."
					class="sb-input w-full py-3 pr-28 pl-11 text-xs font-mono font-medium"
				/>
				<button
					type="submit"
					class="absolute right-1.5 sb-btn-primary px-5 py-2 text-xs font-mono font-semibold cursor-pointer"
				>
					Search
				</button>
			</form>

			<div class="flex flex-wrap items-center gap-2 border-t border-[#2e2e2e] pt-3 font-mono text-xs">
				<span class="text-[#71717a]">Presets:</span>
				<a href="/?q=Vaseegara" class="px-2.5 py-1 rounded bg-[#1e1e1e] border border-[#2e2e2e] text-[#3ecf8e] hover:border-[#3ecf8e] transition-colors">Vaseegara</a>
				<a href="/?q=A.R.%20Rahman" class="px-2.5 py-1 rounded bg-[#1e1e1e] border border-[#2e2e2e] text-[#3ecf8e] hover:border-[#3ecf8e] transition-colors">A.R. Rahman</a>
				<a href="/?q=Harris%20Jayaraj" class="px-2.5 py-1 rounded bg-[#1e1e1e] border border-[#2e2e2e] text-[#3ecf8e] hover:border-[#3ecf8e] transition-colors">Harris Jayaraj</a>
				<a href="/?q=Ed%20Sheeran" class="px-2.5 py-1 rounded bg-[#1e1e1e] border border-[#2e2e2e] text-[#3ecf8e] hover:border-[#3ecf8e] transition-colors">Ed Sheeran</a>
			</div>
		</div>

		<!-- Music DNA Breakdown -->
		{#await dnaPromise}
			<LoadingSkeleton variant="dna" />
		{:then musicDNA}
			{#if musicDNA}
				<section class="space-y-4 rounded-xl border border-[#2e2e2e] bg-[#171717] p-6 sm:p-8">
					<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2e2e2e] pb-3">
						<div>
							<div class="font-mono text-xs font-semibold uppercase tracking-wider text-[#3ecf8e]">
								🧬 User Taste Profiler
							</div>
							<h2 class="font-heading text-xl font-bold text-white mt-0.5">Your Music DNA</h2>
						</div>
						<a href="/liked-connections" class="text-xs font-mono font-semibold text-[#3ecf8e] hover:underline">
							Explore full taste mesh ➔
						</a>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div class="space-y-3 rounded-lg border border-[#2e2e2e] bg-[#1e1e1e] p-4">
							<div class="font-mono text-xs font-bold uppercase text-[#a1a1aa] flex justify-between">
								<span>Top Genres</span>
							</div>
							<div class="space-y-2">
								{#each musicDNA.topGenres as g}
									<div class="space-y-1">
										<div class="flex justify-between text-xs font-mono font-bold text-white">
											<span>{g.icon} {g.name}</span>
											<span class="text-[#3ecf8e]">{g.percentage}%</span>
										</div>
										<div class="h-1.5 w-full overflow-hidden rounded-full bg-[#262626]">
											<div class="h-full rounded-full bg-[#3ecf8e]" style="width: {g.percentage}%"></div>
										</div>
									</div>
								{/each}
							</div>
						</div>

						<div class="space-y-3 rounded-lg border border-[#2e2e2e] bg-[#1e1e1e] p-4">
							<div class="font-mono text-xs font-bold uppercase text-[#a1a1aa]">
								<span>Top Moods</span>
							</div>
							<div class="space-y-2">
								{#each musicDNA.topMoods as m}
									<div class="space-y-1">
										<div class="flex justify-between text-xs font-mono font-bold text-white">
											<span>{m.icon} {m.name}</span>
											<span class="text-[#a855f7]">{m.percentage}%</span>
										</div>
										<div class="h-1.5 w-full overflow-hidden rounded-full bg-[#262626]">
											<div class="h-full rounded-full bg-[#a855f7]" style="width: {m.percentage}%"></div>
										</div>
									</div>
								{/each}
							</div>
						</div>

						<div class="space-y-3 rounded-lg border border-[#2e2e2e] bg-[#1e1e1e] p-4 font-mono">
							<div class="text-xs font-bold uppercase text-[#a1a1aa]">Top Connected Composers</div>
							<div class="space-y-1.5">
								{#each musicDNA.topComposers as composer}
									<div class="flex items-center gap-2 rounded border border-[#2e2e2e] bg-[#171717] p-2 text-xs">
										<span class="text-[#f59e0b] font-bold">🎼</span>
										<span class="truncate text-white font-semibold">{composer}</span>
									</div>
								{/each}
							</div>
						</div>
					</div>
				</section>
			{/if}
		{/await}

		<!-- Songs Catalog Results Grid -->
		<section class="space-y-4">
			<div>
				<h2 class="font-heading text-2xl font-bold text-white">
					{data.searchQuery ? `Query Results for "${data.searchQuery}"` : 'Catalog Songs'}
				</h2>
				<p class="mt-1 text-xs text-[#a1a1aa]">Select any track node to inspect creator relations and album graph links.</p>
			</div>

			{#await songsPromise}
				<LoadingSkeleton variant="card" count={8} />
			{:then dataPayload}
				{#if dataPayload.type === 'search'}
					{#if dataPayload.results.songs.length === 0 && dataPayload.results.artists.length === 0 && dataPayload.results.composers.length === 0}
						<div class="rounded-lg border border-dashed border-[#2e2e2e] bg-[#171717] p-8 text-center text-xs font-mono text-[#a1a1aa]">
							No matching nodes found. Try searching for an artist or song title!
						</div>
					{:else}
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
							{#each dataPayload.results.songs as s}
								<a href="/song/{s.id}" class="flex items-center gap-3 rounded-lg border border-[#2e2e2e] bg-[#171717] p-4 transition-all hover:border-[#3ecf8e]">
									<img src={s.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&q=80'} alt={s.name} class="h-12 w-12 shrink-0 rounded-md object-cover" />
									<div class="overflow-hidden">
										<div class="truncate text-sm font-bold text-white font-heading">{s.name}</div>
										<div class="font-mono text-[10px] font-bold uppercase text-[#3ecf8e]">Song Node</div>
									</div>
								</a>
							{/each}
							{#each dataPayload.results.artists as a}
								<div class="flex items-center gap-3 rounded-lg border border-[#2e2e2e] bg-[#171717] p-4">
									<img src={a.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80'} alt={a.name} class="h-12 w-12 shrink-0 rounded-full object-cover" />
									<div class="overflow-hidden">
										<div class="truncate text-sm font-bold text-white font-heading">{a.name}</div>
										<div class="font-mono text-[10px] font-bold uppercase text-[#a855f7]">Artist Node</div>
									</div>
								</div>
							{/each}
							{#each dataPayload.results.composers as c}
								<div class="flex items-center gap-3 rounded-lg border border-[#2e2e2e] bg-[#171717] p-4">
									<img src={c.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80'} alt={c.name} class="h-12 w-12 shrink-0 rounded-full object-cover" />
									<div class="overflow-hidden">
										<div class="truncate text-sm font-bold text-white font-heading">{c.name}</div>
										<div class="font-mono text-[10px] font-bold uppercase text-[#f59e0b]">Composer Node</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				{:else}
					<!-- Featured Songs Grid -->
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
						{#each dataPayload.songs as song}
							<a href="/song/{song.id}" class="group flex flex-col overflow-hidden rounded-lg border border-[#2e2e2e] bg-[#171717] transition-all hover:border-[#3ecf8e]">
								<div class="relative h-44 w-full shrink-0 overflow-hidden bg-[#1e1e1e]">
									<img
										src={song.coverImage}
										alt={song.title}
										class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
									/>
									<div class="absolute top-3 right-3 rounded bg-[#121212]/90 border border-[#2e2e2e] px-2 py-0.5 font-mono text-[10px] font-bold text-[#3ecf8e]">
										{song.releaseYear}
									</div>
								</div>

								<div class="flex flex-1 flex-col justify-between space-y-3 p-4">
									<div class="space-y-1">
										<h3 class="font-heading line-clamp-1 text-base font-bold text-white group-hover:text-[#3ecf8e] transition-colors">
											{song.title}
										</h3>
										<p class="line-clamp-1 text-xs text-[#a1a1aa]">
											{song.artists.map((a: any) => a.name).join(', ') || 'Various Performers'}
										</p>
									</div>

									<div class="space-y-1.5 text-[11px] font-mono">
										{#if song.composers.length > 0}
											<div class="flex items-center gap-1 text-[#f59e0b]">
												<span class="text-[#71717a]">Composer:</span>
												<span class="truncate">{song.composers.map((c: any) => c.name).join(', ')}</span>
											</div>
										{/if}

										<div class="flex flex-wrap gap-1 pt-1">
											{#each song.genres as g}
												<span class="sb-badge-purple px-1.5 py-0.5 text-[9px]">{g.name}</span>
											{/each}
											{#each song.moods as m}
												<span class="sb-badge-green px-1.5 py-0.5 text-[9px]">{m.name}</span>
											{/each}
											{#each song.languages as lang}
												<span class="sb-badge-blue px-1.5 py-0.5 text-[9px]">{lang.name}</span>
											{/each}
										</div>
									</div>

									<div class="flex items-center justify-between border-t border-[#2e2e2e] pt-2.5 font-mono text-xs text-[#71717a]">
										<span class="text-[10px] text-[#3ecf8e]">{song.popularity}% Match</span>
										<span class="text-[#3ecf8e] font-bold transition-transform group-hover:translate-x-1">Inspect ➔</span>
									</div>
								</div>
							</a>
						{/each}
					</div>
				{/if}
			{:catch error}
				<div class="rounded-lg border border-[#2e2e2e] bg-[#171717] p-8 text-center text-xs font-mono text-[#a1a1aa]">
					Failed to load songs.
				</div>
			{/await}
		</section>
	</section>
</div>
