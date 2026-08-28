<script lang="ts">
	import { browser } from '$app/environment';
	import LoadingSkeleton from '$lib/components/LoadingSkeleton.svelte';

	let { data } = $props();

	let searchQuery = $state('');
	let selectedGenre = $state('ALL');

	// Local mutable state for liked song IDs
	let likedSongsMap = $state<Record<string, boolean>>({});

	$effect(() => {
		searchQuery = data.searchQuery || '';
	});

	async function getCatalogSongs() {
		if (!browser) return [];
		const res = await fetch('/api/songs?limit=50');
		if (!res.ok) throw new Error('Failed to fetch songs catalog');
		const payload = await res.json();
		const songs = payload.songs || [];

		// Initialize liked status map from fetched payload
		const map: Record<string, boolean> = {};
		songs.forEach((s: any) => {
			map[s.id] = !!s.isLiked;
		});
		likedSongsMap = map;

		return songs;
	}

	let songsPromise = getCatalogSongs();

	function filterSongs(songs: any[]) {
		return songs.filter((s: any) => {
			const matchesSearch =
				!searchQuery ||
				s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.artists.some((a: any) => a.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
				s.composers.some((c: any) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

			const matchesGenre =
				selectedGenre === 'ALL' ||
				s.genres.some((g: any) => g.name.toLowerCase().includes(selectedGenre.toLowerCase()));

			return matchesSearch && matchesGenre;
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
		} catch (err) {
			console.error('Error toggling like:', err);
			likedSongsMap[songId] = currentStatus;
		}
	}
</script>

<svelte:head>
	<title>Songs Catalog — SonicMesh Studio</title>
</svelte:head>

<div class="mx-auto max-w-7xl space-y-6 py-2 font-mono pb-16">
	<!-- Page Header -->
	<div class="flex flex-col gap-4 border-b border-[#2e2e2e] pb-5 md:flex-row md:items-center md:justify-between">
		<div>
			<div class="flex items-center gap-2">
				<span class="w-2.5 h-2.5 rounded-full bg-[#3ecf8e] animate-pulse"></span>
				<h1 class="font-heading text-2xl font-extrabold text-white sm:text-3xl">Songs Catalog</h1>
			</div>
			<p class="mt-1 text-xs text-[#a1a1aa] font-sans">
				Explore catalog song nodes. Click the heart icon on any card to like/unlike and update your graph taste mesh in real time.
			</p>
		</div>

		<!-- Quick Actions -->
		<div class="flex items-center gap-3">
			<a
				href="/add-song"
				class="sb-btn-primary px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5"
			>
				+ Insert New Track
			</a>
			<a
				href="/liked-connections"
				class="sb-btn-secondary px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5"
			>
				♥ View Liked Mesh
			</a>
		</div>
	</div>

	<!-- Search & Filter Controls -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[#2e2e2e] bg-[#171717] p-4 shadow-xs">
		<!-- Search Input -->
		<div class="relative flex-1 max-w-md">
			<svg
				class="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#71717a]"
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
				bind:value={searchQuery}
				placeholder="Filter catalog by title or artist..."
				class="sb-input w-full py-2 pr-3 pl-9 text-xs font-mono"
			/>
		</div>

		<!-- Genre Filter Pills -->
		<div class="flex flex-wrap items-center gap-1 text-xs">
			<span class="text-[#71717a] text-[11px] mr-1">Genre:</span>
			{#each [{ id: 'ALL', label: 'All' }, { id: 'Melody', label: 'Melody' }, { id: 'Kuthu', label: 'Kuthu' }, { id: 'Classical', label: 'Classical' }, { id: 'Pop', label: 'Pop' }] as g}
				<button
					onclick={() => (selectedGenre = g.id)}
					class="rounded px-2.5 py-1 text-[11px] transition-all cursor-pointer {selectedGenre === g.id
						? 'bg-[#1c392b] text-[#3ecf8e] border border-[#2b5940] font-bold'
						: 'border border-[#2e2e2e] bg-[#1e1e1e] text-[#a1a1aa] hover:text-white'}"
				>
					{g.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Asynchronous Catalog Fetch with {#await} block & LoadingSkeleton -->
	{#await songsPromise}
		<div class="space-y-4">
			<div class="text-xs text-[#3ecf8e] flex items-center gap-2">
				<span class="w-2 h-2 rounded-full bg-[#3ecf8e] animate-pulse"></span>
				Fetching catalog track nodes from openCypher graph...
			</div>
			<LoadingSkeleton variant="card" count={12} />
		</div>
	{:then allSongs}
		{@const filtered = filterSongs(allSongs)}
		{#if filtered.length === 0}
			<div class="rounded-xl border border-dashed border-[#2e2e2e] bg-[#171717] p-12 text-center text-xs text-[#a1a1aa]">
				No catalog tracks match your filter criteria.
			</div>
		{:else}
			<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
				{#each filtered as song (song.id)}
					{@const isLiked = likedSongsMap[song.id] !== undefined ? likedSongsMap[song.id] : !!song.isLiked}

					<a
						href="/song/{song.id}"
						class="group relative flex flex-col overflow-hidden rounded-lg border border-[#2e2e2e] bg-[#171717] transition-all hover:border-[#3ecf8e] shadow-xs"
					>
						<!-- Card Header Image & Like Button Overlay -->
						<div class="relative h-28 sm:h-32 w-full shrink-0 overflow-hidden bg-[#1e1e1e]">
							<img
								src={song.coverImage}
								alt={song.title}
								class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
							/>

							<!-- Like Button Overlay (Instant In-Card Heart Toggle) -->
							<button
								onclick={(e) => toggleLike(song.id, e)}
								title={isLiked ? 'Unlike song in graph' : 'Like song in graph'}
								aria-label={isLiked ? 'Unlike song' : 'Like song'}
								class="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border transition-all cursor-pointer shadow-md backdrop-blur-xs
								{isLiked
									? 'border-[#f43f5e] bg-[#f43f5e] text-white shadow-rose-900/50 scale-105'
									: 'border-[#333] bg-[#121212]/80 text-[#a1a1aa] hover:border-[#f43f5e] hover:text-[#f43f5e]'}"
							>
								<svg class="h-3.5 w-3.5 {isLiked ? 'fill-current' : 'none'}" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
									/>
								</svg>
							</button>

							<!-- Year Badge -->
							<div class="absolute bottom-1.5 left-1.5 rounded bg-[#121212]/90 border border-[#2e2e2e] px-1.5 py-0.5 text-[9px] font-bold text-[#3ecf8e]">
								{song.releaseYear}
							</div>
						</div>

						<!-- Card Selective Essential Details -->
						<div class="flex flex-1 flex-col justify-between space-y-2 p-2.5">
							<div class="space-y-0.5">
								<!-- Title -->
								<h3 class="font-heading truncate text-xs font-bold text-white group-hover:text-[#3ecf8e] transition-colors">
									{song.title}
								</h3>
								<!-- Primary Artist / Composer -->
								<p class="truncate text-[10px] text-[#a1a1aa]">
									{song.artists[0]?.name || song.composers[0]?.name || 'Various'}
								</p>
							</div>

							<!-- Selective Details Pill Tags -->
							<div class="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-[#2e2e2e] text-[9px]">
								<span class="sb-badge-purple px-1.5 py-0.5 text-[8px] font-bold truncate max-w-[80px]">
									{song.genres[0]?.name || 'Music'}
								</span>
								<span class="text-[#3ecf8e] font-bold">
									{song.popularity}% Score
								</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	{:catch error}
		<div class="rounded-xl border border-[#2e2e2e] bg-[#171717] p-8 text-center text-xs text-[#a1a1aa]">
			Failed to load catalog songs.
		</div>
	{/await}
</div>
