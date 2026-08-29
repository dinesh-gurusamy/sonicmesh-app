<script lang="ts">
	import { browser } from '$app/environment';
	import LikedGraphMesh from '$lib/components/LikedGraphMesh.svelte';
	import LoadingSkeleton from '$lib/components/LoadingSkeleton.svelte';
	import EntityIcon from '$lib/components/EntityIcon.svelte';

	async function getLikedConnections() {
		if (!browser)
			return {
				likedSongs: [],
				pairwiseConnections: [],
				sharedConnectors: [],
				graphData: { nodes: [], links: [] },
				summaryStats: {
					totalLikedSongs: 0,
					pairwiseConnectionsCount: 0,
					uniqueConnectorsCount: 0,
					topConnector: 'N/A'
				}
			};
		const res = await fetch('/api/liked-connections', { credentials: 'include' });
		if (!res.ok) throw new Error('Failed to load liked songs connections');
		return await res.json();
	}

	let connectionPromise = $state(getLikedConnections());
</script>

<svelte:head>
	<title>Liked Connections Mesh — SonicMesh Studio</title>
</svelte:head>

<div class="mx-auto max-w-7xl space-y-8 py-2 pb-12">
	<!-- Hero Header Shell -->
	<section class="space-y-3 rounded-xl border border-[#2e2e2e] bg-[#171717] p-6 shadow-md sm:p-8">
		<div class="font-mono text-xs font-semibold tracking-wider text-[#3ecf8e] uppercase">
			♥ Liked Taste Mesh
		</div>

		<h1
			class="font-heading text-3xl leading-tight font-extrabold tracking-tight text-white sm:text-4xl"
		>
			Connections Between Your <span class="text-[#f43f5e]">Liked Songs</span>
		</h1>

		<p class="max-w-2xl text-xs leading-relaxed text-[#a1a1aa] sm:text-sm">
			Discover how your favorite performers, composers, albums, and genres connect your liked songs
			together.
		</p>
	</section>

	<!-- {#await} Block for Asynchronous Data Hydration with LoadingSkeleton -->
	{#await connectionPromise}
		<section class="space-y-8">
			<LoadingSkeleton variant="stats" />
			<LoadingSkeleton variant="mesh" />
			<div class="space-y-3">
				<div class="h-6 w-1/4 animate-pulse rounded bg-[#2e2e2e]"></div>
				<LoadingSkeleton variant="list" count={2} />
			</div>
		</section>
	{:then connectionData}
		{#if connectionData.summaryStats.totalLikedSongs === 0}
			<section
				class="space-y-4 rounded-xl border border-dashed border-[#2e2e2e] bg-[#171717] p-12 text-center font-mono shadow-md"
			>
				<div
					class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#26151a] text-3xl text-[#f43f5e]"
				>
					♥
				</div>
				<h2 class="font-heading text-xl font-bold text-white">Your Liked Taste Mesh is Empty</h2>
				<p class="mx-auto max-w-md font-sans text-xs leading-relaxed text-[#a1a1aa]">
					You haven't liked any tracks yet! Head over to the Songs Catalog, click the heart button
					(❤️) on tracks you enjoy, and return here to discover your personalized graph connections
					and shared artist anchors.
				</p>
				<div class="pt-2">
					<a
						href="/catalog"
						class="sb-btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold"
					>
						Explore Songs Catalog ➔
					</a>
				</div>
			</section>
		{:else}
			<!-- Key Metrics Bar -->
			<section class="grid grid-cols-2 gap-4 font-mono sm:grid-cols-4">
				<div class="rounded-lg border border-[#2e2e2e] bg-[#171717] p-4 shadow-xs">
					<div class="text-[10px] font-bold tracking-wider text-[#71717a] uppercase">
						Liked Songs
					</div>
					<div class="font-heading mt-0.5 text-2xl font-bold text-[#f43f5e]">
						{connectionData.summaryStats.totalLikedSongs}
					</div>
					<div class="text-[10px] text-[#a1a1aa]">Saved songs in collection</div>
				</div>

				<div class="rounded-lg border border-[#2e2e2e] bg-[#171717] p-4 shadow-xs">
					<div class="text-[10px] font-bold tracking-wider text-[#71717a] uppercase">
						Connected Pairs
					</div>
					<div class="font-heading mt-0.5 text-2xl font-bold text-[#3ecf8e]">
						{connectionData.summaryStats.pairwiseConnectionsCount}
					</div>
					<div class="text-[10px] text-[#a1a1aa]">Direct song connections</div>
				</div>

				<div class="rounded-lg border border-[#2e2e2e] bg-[#171717] p-4 shadow-xs">
					<div class="text-[10px] font-bold tracking-wider text-[#71717a] uppercase">
						Shared Connectors
					</div>
					<div class="font-heading mt-0.5 text-2xl font-bold text-[#f59e0b]">
						{connectionData.summaryStats.uniqueConnectorsCount}
					</div>
					<div class="text-[10px] text-[#a1a1aa]">Artists & Composers</div>
				</div>

				<div class="rounded-lg border border-[#2e2e2e] bg-[#171717] p-4 shadow-xs">
					<div class="text-[10px] font-bold tracking-wider text-[#71717a] uppercase">
						Top Taste Anchor
					</div>
					<div class="font-heading mt-0.5 truncate text-lg font-bold text-[#a855f7]">
						{connectionData.summaryStats.topConnector}
					</div>
					<div class="text-[10px] text-[#a1a1aa]">Primary music hub</div>
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
			<section class="space-y-4 font-mono">
				<div class="border-b border-[#2e2e2e] pb-3">
					<h2 class="font-heading text-xl font-bold text-white">Key Connecting Creators</h2>
					<p class="text-xs text-[#a1a1aa]">Artists & composers bridging multiple liked tracks</p>
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{#each connectionData.sharedConnectors as connector}
						<div
							class="flex items-center gap-3 rounded-lg border border-[#2e2e2e] bg-[#171717] p-3.5"
						>
							<EntityIcon
								type={connector.label === 'Composer' ? 'composer' : 'artist'}
								class="h-10 w-10 shrink-0"
							/>
							<div class="flex-1 space-y-0.5 overflow-hidden">
								<div class="font-heading truncate text-xs font-bold text-white">
									{connector.name}
								</div>
								<div class="flex items-center justify-between text-[10px]">
									<span class="font-bold text-[#f59e0b] uppercase">
										{connector.label}
									</span>
									<span class="sb-badge-green px-1.5 py-0.5 text-[9px]">
										{connector.count}
										{connector.count === 1 ? 'song' : 'songs'}
									</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</section>

			<!-- Pairwise Liked Songs Connection Paths -->
			<section class="space-y-4 font-mono">
				<div class="border-b border-[#2e2e2e] pb-3">
					<h2 class="font-heading text-xl font-bold text-white">Pairwise Connection Paths</h2>
					<p class="text-xs text-[#a1a1aa]">Direct connections linking your favorite songs</p>
				</div>

				{#if connectionData.pairwiseConnections.length === 0}
					<div
						class="rounded-lg border border-dashed border-[#2e2e2e] bg-[#171717] p-8 text-center text-xs text-[#a1a1aa]"
					>
						No direct connections found between current liked songs. Like more songs to discover
						shared paths!
					</div>
				{:else}
					<div class="space-y-3">
						{#each connectionData.pairwiseConnections as pair}
							<div
								class="space-y-3 rounded-lg border border-[#2e2e2e] bg-[#171717] p-4 shadow-xs transition-colors hover:border-[#3ecf8e]"
							>
								<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
									<!-- Song 1 Card -->
									<a
										href="/song/{pair.song1.id}"
										class="flex w-full flex-1 items-center gap-3 rounded-md border border-[#2e2e2e] bg-[#1e1e1e] p-3 transition-all hover:border-[#3ecf8e] md:w-auto"
									>
										<EntityIcon type="song" class="h-10 w-10 shrink-0" />
										<div class="overflow-hidden">
											<div class="font-heading truncate text-xs font-bold text-white">
												{pair.song1.title}
											</div>
											<div class="text-[10px] font-bold text-[#f43f5e] uppercase">
												Liked Track 1
											</div>
										</div>
									</a>

									<!-- Central Connector Link -->
									<div
										class="flex flex-col items-center justify-center text-xs font-bold text-[#f59e0b]"
									>
										<div
											class="rounded border border-[#2b5940] bg-[#1c392b] px-3 py-1 text-center text-[10px] text-[#3ecf8e]"
										>
											🔗 Connected via {pair.connectors[0]?.label || 'Artist'} ({pair.connectors[0]
												?.name || ''})
										</div>
										<div class="mt-1 text-[10px] text-[#71717a]">
											{pair.relationshipTypes.join(' &bull; ')}
										</div>
									</div>

									<!-- Song 2 Card -->
									<a
										href="/song/{pair.song2.id}"
										class="flex w-full flex-1 items-center gap-3 rounded-md border border-[#2e2e2e] bg-[#1e1e1e] p-3 transition-all hover:border-[#3ecf8e] md:w-auto"
									>
										<EntityIcon type="song" class="h-10 w-10 shrink-0" />
										<div class="overflow-hidden">
											<div class="font-heading truncate text-xs font-bold text-white">
												{pair.song2.title}
											</div>
											<div class="text-[10px] font-bold text-[#f43f5e] uppercase">
												Liked Track 2
											</div>
										</div>
									</a>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>
		{/if}
	{:catch error}
		<section
			class="space-y-4 rounded-xl border border-[#991b1b]/40 bg-[#1c1214] p-8 text-center font-mono shadow-md"
		>
			<div
				class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#451a1a] text-xl text-[#f87171]"
			>
				{!browser || !navigator.onLine ? '🔌' : '⚠️'}
			</div>
			<h2 class="font-heading font-sans text-lg font-bold text-white">
				{!browser || !navigator.onLine
					? 'You are currently offline'
					: 'Failed to load graph connections'}
			</h2>
			<p class="mx-auto max-w-md font-sans text-xs text-[#fca5a5]/80">
				{!browser || !navigator.onLine
					? 'Please check your internet or local network connection and try again.'
					: error?.message || 'An error occurred while fetching graph connections.'}
			</p>
			<button
				onclick={() => (connectionPromise = getLikedConnections())}
				class="sb-btn-secondary inline-flex cursor-pointer items-center gap-2 px-4 py-2 text-xs font-semibold"
			>
				🔄 Retry Connections Query
			</button>
		</section>
	{/await}
</div>
