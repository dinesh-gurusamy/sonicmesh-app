<script lang="ts">
	import { enhance } from '$app/forms';
	import LikedGraphMesh from '$lib/components/LikedGraphMesh.svelte';
	import LoadingSkeleton from '$lib/components/LoadingSkeleton.svelte';

	async function getLikedConnections() {
		const res = await fetch('/api/liked-connections');
		if (!res.ok) throw new Error('Failed to load liked songs connections');
		return await res.json();
	}

	let connectionPromise = $state(getLikedConnections());

	function refreshConnections() {
		connectionPromise = getLikedConnections();
	}
</script>

<div class="space-y-10 py-2 max-w-7xl mx-auto pb-12">
	<!-- Hero Header Shell (Renders Instantly on Navigation) -->
	<section class="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-md relative overflow-hidden space-y-6">
		<div class="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-100/80 via-purple-100/40 to-transparent rounded-full blur-3xl pointer-events-none"></div>

		<div class="relative z-10 space-y-4 max-w-3xl">
			<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
				❤️ Liked Taste Mesh
			</div>

			<h1 class="text-3xl sm:text-5xl font-extrabold text-slate-900 font-heading tracking-tight leading-tight">
				Connections Between Your <span class="gradient-text-purple">Liked Songs</span>
			</h1>

			<p class="text-slate-600 text-sm sm:text-base font-normal leading-relaxed">
				Visualizing the network of creators, performers, albums, and genres that bridge your favorite music together into a connected graph.
			</p>
		</div>
	</section>

	<!-- {#await} Block for Asynchronous Data Hydration with LoadingSkeleton -->
	{#await connectionPromise}
		<section class="space-y-8">
			<!-- Metrics Skeleton -->
			<LoadingSkeleton variant="stats" />

			<!-- Visual Mesh Graph Skeleton -->
			<LoadingSkeleton variant="mesh" />

			<!-- Pairwise Paths List Skeleton -->
			<div class="space-y-3">
				<div class="h-6 bg-slate-200 rounded w-1/4 animate-pulse"></div>
				<LoadingSkeleton variant="list" count={2} />
			</div>

			<!-- Catalog Cards Skeleton -->
			<div class="space-y-3">
				<div class="h-6 bg-slate-200 rounded w-1/3 animate-pulse"></div>
				<LoadingSkeleton variant="card" count={4} />
			</div>
		</section>
	{:then connectionData}
		<!-- Key Metrics Bar -->
		<section class="grid grid-cols-2 sm:grid-cols-4 gap-4">
			<div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
				<div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Liked Songs</div>
				<div class="text-2xl font-extrabold font-heading text-indigo-600 mt-0.5">
					{connectionData.summaryStats.totalLikedSongs}
				</div>
				<div class="text-[10px] text-slate-400">Tracks in taste graph</div>
			</div>

			<div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
				<div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Connected Pairs</div>
				<div class="text-2xl font-extrabold font-heading text-purple-600 mt-0.5">
					{connectionData.summaryStats.pairwiseConnectionsCount}
				</div>
				<div class="text-[10px] text-slate-400">Direct multi-song links</div>
			</div>

			<div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
				<div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Shared Connectors</div>
				<div class="text-2xl font-extrabold font-heading text-amber-600 mt-0.5">
					{connectionData.summaryStats.uniqueConnectorsCount}
				</div>
				<div class="text-[10px] text-slate-400">Artists & Composers</div>
			</div>

			<div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
				<div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Top Taste Anchor</div>
				<div class="text-lg font-bold font-heading text-emerald-700 truncate mt-1">
					{connectionData.summaryStats.topConnector}
				</div>
				<div class="text-[10px] text-slate-400">Primary graph hub</div>
			</div>
		</section>

		<!-- Interactive Mesh Network Graph -->
		<section class="space-y-3">
			<LikedGraphMesh
				nodes={connectionData.graphData.nodes}
				links={connectionData.graphData.links}
			/>
		</section>

		<!-- Shared Creator Highlights Grid -->
		<section class="space-y-4">
			<div class="flex items-center justify-between">
				<div>
					<h2 class="text-2xl font-bold font-heading text-slate-900">Key Connecting Artists & Composers</h2>
					<p class="text-xs text-slate-500">Creators that tie multiple liked songs together</p>
				</div>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{#each connectionData.sharedConnectors as connector}
					<a
						href="/artist/{encodeURIComponent(connector.name)}"
						class="bg-white p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-3.5 group"
					>
						<img
							src={connector.image || 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Anirudh_Ravichander_at_Audi_Ritz_Style_Awards_2017.jpg'}
							alt={connector.name}
							class="w-12 h-12 rounded-full object-cover shadow-sm shrink-0 border border-slate-200 group-hover:scale-105 transition-transform"
						/>
						<div class="overflow-hidden flex-1 space-y-0.5">
							<div class="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm truncate">
								{connector.name}
							</div>
							<div class="flex items-center justify-between">
								<span class="text-[10px] font-bold uppercase tracking-wider text-purple-600">
									{connector.label}
								</span>
								<span class="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold font-mono">
									Connects {connector.count} {connector.count === 1 ? 'song' : 'songs'}
								</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
		</section>

		<!-- Pairwise Liked Songs Connection Paths -->
		<section class="space-y-4">
			<div class="flex items-center justify-between">
				<div>
					<h2 class="text-2xl font-bold font-heading text-slate-900">Pairwise Connection Paths</h2>
					<p class="text-xs text-slate-500">Direct relationship links connecting your liked songs</p>
				</div>
			</div>

			{#if connectionData.pairwiseConnections.length === 0}
				<div class="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-500 text-sm">
					No direct connections found between current liked songs. Like more songs from different creators to discover shared paths!
				</div>
			{:else}
				<div class="space-y-4">
					{#each connectionData.pairwiseConnections as pair}
						<div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:border-indigo-200 transition-colors">
							<div class="flex flex-col md:flex-row items-center justify-between gap-4">
								<!-- Song 1 Card -->
								<a href="/song/{pair.song1.id}" class="flex items-center gap-3.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all w-full md:w-auto flex-1">
									<img src={pair.song1.image} alt={pair.song1.title} class="w-12 h-12 rounded-xl object-cover shadow-sm shrink-0" />
									<div class="overflow-hidden">
										<div class="font-bold text-slate-900 text-sm truncate">{pair.song1.title}</div>
										<div class="text-[10px] font-bold text-indigo-600 uppercase">Liked Track 1</div>
									</div>
								</a>

								<!-- Linking Badges -->
								<div class="flex flex-col items-center gap-1 shrink-0 px-2">
									<div class="flex flex-wrap gap-1 justify-center">
										{#each pair.relationshipTypes as rel}
											<span class="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
												Shared {rel}
											</span>
										{/each}
									</div>
									<span class="text-slate-400 text-xs font-bold font-mono">⇄ Linked via Taste Mesh</span>
								</div>

								<!-- Song 2 Card -->
								<a href="/song/{pair.song2.id}" class="flex items-center gap-3.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all w-full md:w-auto flex-1">
									<img src={pair.song2.image} alt={pair.song2.title} class="w-12 h-12 rounded-xl object-cover shadow-sm shrink-0" />
									<div class="overflow-hidden">
										<div class="font-bold text-slate-900 text-sm truncate">{pair.song2.title}</div>
										<div class="text-[10px] font-bold text-purple-600 uppercase">Liked Track 2</div>
									</div>
								</a>
							</div>

							<!-- Connector Nodes row -->
							<div class="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
								<span class="text-xs text-slate-500 font-bold">Connected through:</span>
								{#each pair.connectors as c}
									<div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs">
										{#if c.image}
											<img src={c.image} alt={c.name} class="w-6 h-6 rounded-full object-cover shrink-0" />
										{/if}
										<span class="font-bold text-slate-900">{c.name}</span>
										<span class="text-[10px] font-bold text-indigo-700 uppercase">({c.label})</span>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<!-- Your Liked Songs Catalog Grid -->
		<section class="space-y-4">
			<div class="flex items-center justify-between">
				<div>
					<h2 class="text-2xl font-bold font-heading text-slate-900">Your Liked Songs Catalog</h2>
					<p class="text-xs text-slate-500">Toggle songs to dynamically reshape your taste graph</p>
				</div>
				<a href="/" class="text-xs font-bold text-indigo-600 hover:text-indigo-700">
					Browse All Songs ➔
				</a>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
				{#each connectionData.likedSongs as song}
					<div class="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden group hover:shadow-md transition-all">
						<div class="relative w-full h-40 bg-slate-100 overflow-hidden shrink-0">
							<img src={song.coverImage} alt={song.title} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
							<div class="absolute top-2 right-2 px-2 py-0.5 rounded bg-slate-900/80 text-[10px] font-bold text-white">
								{song.releaseYear}
							</div>
						</div>

						<div class="p-4 flex-1 flex flex-col justify-between space-y-3">
							<div class="space-y-1">
								<a href="/song/{song.id}" class="font-bold text-sm text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1">
									{song.title}
								</a>
								<p class="text-xs text-slate-500 line-clamp-1">
									{song.artists.map((a: any) => a.name).join(', ') || 'Various Artists'}
								</p>
							</div>

							<div class="flex items-center justify-between pt-2 border-t border-slate-100">
								<form
									method="POST"
									action="?/toggleLike"
									use:enhance={() => {
										return async ({ update }) => {
											await update();
											refreshConnections();
										};
									}}
								>
									<input type="hidden" name="songId" value={song.id} />
									<button
										type="submit"
										class="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors flex items-center gap-1.5 shadow-sm"
									>
										<svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
										</svg>
										Liked
									</button>
								</form>

								<a href="/song/{song.id}" class="text-xs text-indigo-600 font-bold hover:underline">
									View Graph ➔
								</a>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{:catch error}
		<div class="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm space-y-4">
			<div class="text-rose-500 text-xl font-bold">Failed to load liked connections</div>
			<p class="text-xs text-slate-500">Please verify your database connection and try again.</p>
			<button
				onclick={() => refreshConnections()}
				class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all"
			>
				Retry Loading ➔
			</button>
		</div>
	{/await}
</div>
