<script lang="ts">
	import { enhance } from '$app/forms';
	import LoadingSkeleton from '$lib/components/LoadingSkeleton.svelte';

	let { data, form } = $props();

	let searchInput = $state('');

	$effect(() => {
		searchInput = data.searchQuery || '';
	});

	async function getStats() {
		const res = await fetch('/api/stats');
		if (!res.ok) throw new Error('Failed to fetch stats');
		return await res.json();
	}

	async function getSongs(query: string) {
		const url = `/api/songs${query ? '?q=' + encodeURIComponent(query) : ''}`;
		const res = await fetch(url);
		if (!res.ok) throw new Error('Failed to fetch songs');
		return await res.json();
	}

	async function getRecommendations() {
		const res = await fetch('/api/recommendations');
		if (!res.ok) throw new Error('Failed to fetch recommendations');
		return await res.json();
	}

	let statsPromise = getStats();
	let songsPromise = $derived(getSongs(data.searchQuery || ''));
	let recsPromise = getRecommendations();
</script>

<div class="space-y-10 pb-12">
	<!-- Hero Header -->
	<section class="relative rounded-3xl overflow-hidden bg-white p-8 md:p-12 border border-slate-200 shadow-md">
		<div class="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-100/70 via-purple-50/40 to-transparent rounded-full blur-2xl pointer-events-none"></div>

		<div class="relative z-10 max-w-3xl space-y-6">
			<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
				<span class="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
				Music Traversal Engine
			</div>

			<h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight font-heading leading-tight text-slate-900">
				Explore how your <span class="gradient-text-purple">favorite music</span> connects.
			</h1>

			<p class="text-slate-600 text-base sm:text-lg font-normal leading-relaxed">
				Search any track to discover the composers, performers, albums, and genres that link artists and songs together.
			</p>

			<!-- Search Form -->
			<form method="GET" action="/" class="relative flex items-center max-w-xl">
				<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
				</div>
				<input
					type="text"
					name="q"
					bind:value={searchInput}
					placeholder="Search songs, artists, composers..."
					class="w-full pl-11 pr-28 py-3.5 rounded-2xl glass-input text-sm font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm placeholder:text-slate-400"
				/>
				<button
					type="submit"
					class="absolute right-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
				>
					Search
				</button>
			</form>
		</div>
	</section>

	<!-- Action Banner -->
	{#if form?.message}
		<div class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-sm">
			<span>{form.message}</span>
		</div>
	{/if}

	<!-- Stats Grid with {#await} block -->
	<section>
		{#await statsPromise}
			<LoadingSkeleton variant="stats" />
		{:then stats}
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
					<div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Songs</div>
					<div class="text-3xl font-extrabold font-heading text-indigo-600 mt-1">{stats.songCount}</div>
					<div class="text-[11px] text-slate-400 mt-0.5">Tracks in catalog</div>
				</div>
				<div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
					<div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Artists</div>
					<div class="text-3xl font-extrabold font-heading text-purple-600 mt-1">{stats.artistCount}</div>
					<div class="text-[11px] text-slate-400 mt-0.5">Performers & singers</div>
				</div>
				<div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
					<div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Composers</div>
					<div class="text-3xl font-extrabold font-heading text-amber-600 mt-1">{stats.composerCount}</div>
					<div class="text-[11px] text-slate-400 mt-0.5">Music directors</div>
				</div>
				<div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
					<div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Connections</div>
					<div class="text-3xl font-extrabold font-heading text-emerald-600 mt-1">{stats.relationshipCount}</div>
					<div class="text-[11px] text-slate-400 mt-0.5">Relationship links</div>
				</div>
			</div>
		{:catch error}
			<div class="p-4 rounded-xl bg-rose-50 text-rose-700 text-xs">Failed to load stats</div>
		{/await}
	</section>

	<!-- Songs Catalog & Search with {#await} block -->
	<section class="space-y-6">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-2xl font-bold font-heading text-slate-900">
					{data.searchQuery ? `Search Results for "${data.searchQuery}"` : 'Featured Songs'}
				</h2>
				<p class="text-xs text-slate-500 mt-1">Select a track to see its creators, album, and related songs</p>
			</div>
		</div>

		{#await songsPromise}
			<LoadingSkeleton variant="card" count={8} />
		{:then dataPayload}
			{#if dataPayload.type === 'search'}
				{#if dataPayload.results.songs.length === 0 && dataPayload.results.artists.length === 0 && dataPayload.results.composers.length === 0}
					<div class="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-500 text-sm">
						No matching items found. Try searching for an artist or song title!
					</div>
				{:else}
					<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
						{#each dataPayload.results.songs as s}
							<a href="/song/{s.id}" class="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-3">
								<img src={s.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&q=80'} alt={s.name} class="w-12 h-12 rounded-lg object-cover shadow-sm shrink-0" />
								<div class="overflow-hidden">
									<div class="font-bold text-slate-900 truncate text-sm">{s.name}</div>
									<div class="text-xs text-indigo-600 font-semibold">Song</div>
								</div>
							</a>
						{/each}
						{#each dataPayload.results.artists as a}
							<div class="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
								<img src={a.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80'} alt={a.name} class="w-12 h-12 rounded-full object-cover shadow-sm shrink-0" />
								<div class="overflow-hidden">
									<div class="font-bold text-slate-900 truncate text-sm">{a.name}</div>
									<div class="text-xs text-purple-600 font-semibold">Artist</div>
								</div>
							</div>
						{/each}
						{#each dataPayload.results.composers as c}
							<div class="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
								<img src={c.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80'} alt={c.name} class="w-12 h-12 rounded-full object-cover shadow-sm shrink-0" />
								<div class="overflow-hidden">
									<div class="font-bold text-slate-900 truncate text-sm">{c.name}</div>
									<div class="text-xs text-amber-600 font-semibold">Composer</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			{:else}
				<!-- Featured Songs Grid -->
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
					{#each dataPayload.songs as song}
						<a href="/song/{song.id}" class="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden group">
							<div class="relative w-full h-44 bg-slate-100 overflow-hidden shrink-0">
								<img
									src={song.coverImage}
									alt={song.title}
									class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
								/>
								<div class="absolute top-3 right-3 px-2 py-1 rounded-md bg-slate-900/80 backdrop-blur-md text-[10px] font-bold text-white shadow-sm">
									{song.releaseYear}
								</div>
							</div>

							<div class="p-5 flex-1 flex flex-col justify-between space-y-4">
								<div class="space-y-1.5">
									<h3 class="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
										{song.title}
									</h3>
									<p class="text-xs font-medium text-slate-600 line-clamp-1">
										{song.artists.map((a: any) => a.name).join(', ') || 'Various Artists'}
									</p>
								</div>

								<div class="space-y-2 text-[11px]">
									{#if song.composers.length > 0}
										<div class="flex items-center gap-1.5 text-amber-700 font-medium">
											<span class="text-slate-400 text-[10px] uppercase font-bold">Composer:</span>
											<span class="truncate">{song.composers.map((c: any) => c.name).join(', ')}</span>
										</div>
									{/if}

									<div class="flex flex-wrap gap-1.5 pt-1">
										{#each song.genres as g}
											<span class="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
												{g.name}
											</span>
										{/each}
										{#each song.moods as m}
											<span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
												{m.name}
											</span>
										{/each}
										{#each song.languages as lang}
											<span class="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
												{lang.name}
											</span>
										{/each}
									</div>
								</div>

								<div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
									<span class="text-[11px] font-mono font-semibold text-slate-600">Popularity {song.popularity}%</span>
									<span class="group-hover:translate-x-1 transition-transform text-indigo-600 font-bold">Explore Track Graph ➔</span>
								</div>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		{:catch error}
			<div class="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
				Failed to load songs.
			</div>
		{/await}
	</section>

	<!-- Recommendations Teaser Card with {#await} block -->
	<section class="bg-white p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
		<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
			<div>
				<div class="text-xs font-bold uppercase tracking-wider text-indigo-600">Smart Connection Matching</div>
				<h2 class="text-2xl font-bold font-heading text-slate-900 mt-1">Recommended Songs for You</h2>
			</div>
			<a href="/recommendations" class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm">
				View Full Recommendations ➔
			</a>
		</div>

		{#await recsPromise}
			<LoadingSkeleton variant="list" count={3} />
		{:then recs}
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				{#each recs.slice(0, 3) as rec}
					<div class="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 flex items-start gap-4">
						<img src={rec.song.coverImage} alt={rec.song.title} class="w-16 h-16 rounded-xl object-cover shadow-sm shrink-0" />
						<div class="flex-1 overflow-hidden space-y-1">
							<div class="flex items-center justify-between">
								<span class="text-sm font-bold text-slate-900 truncate">{rec.song.title}</span>
								<span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold font-mono">
									{rec.score}% Match
								</span>
							</div>
							<div class="text-xs text-slate-500 truncate">{rec.artists.join(', ') || 'Various Artists'}</div>
							<div class="text-[11px] text-indigo-700 font-medium line-clamp-2 pt-1">
								💡 {rec.pathDescription}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:catch error}
			<div class="p-4 rounded-xl bg-rose-50 text-rose-700 text-xs">Failed to load recommendations</div>
		{/await}
	</section>
</div>
