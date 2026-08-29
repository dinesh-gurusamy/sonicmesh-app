<script lang="ts">
	import { browser } from '$app/environment';
	import LoadingSkeleton from '$lib/components/LoadingSkeleton.svelte';
	import EntityIcon from '$lib/components/EntityIcon.svelte';

	let { data } = $props();

	async function getArtistData(name: string) {
		if (!browser) return null;
		const res = await fetch(`/api/artist/${encodeURIComponent(name)}`);
		if (!res.ok) throw new Error('Failed to load artist details');
		return await res.json();
	}

	let artistPromise = $derived(getArtistData(data.artistName));
</script>

<svelte:head>
	<title>{data.artistName} — SonicMesh Studio</title>
</svelte:head>

<div class="mx-auto max-w-6xl space-y-8 py-2 pb-16 font-mono">
	<!-- Breadcrumb Navigation -->
	<div class="flex items-center gap-2 text-xs text-[#71717a]">
		<a href="/" class="hover:text-white">Home</a>
		<span>/</span>
		<a href="/catalog" class="hover:text-white">Catalog</a>
		<span>/</span>
		<span class="text-[#3ecf8e]">{data.artistName}</span>
	</div>

	{#await artistPromise}
		<LoadingSkeleton variant="stats" />
		<LoadingSkeleton variant="list" count={4} />
	{:then artistData}
		{#if !artistData || !artistData.artist}
			<div class="rounded-xl border border-dashed border-[#2e2e2e] bg-[#171717] p-12 text-center">
				<h3 class="font-heading text-xl font-bold text-white">Artist Node Not Found</h3>
				<p class="mt-2 text-xs text-[#a1a1aa]">No graph entity matching "{data.artistName}" was located.</p>
				<a href="/catalog" class="sb-btn-primary mt-4 inline-flex px-4 py-2 text-xs">Return to Catalog</a>
			</div>
		{:else}
			{@const artist = artistData.artist}
			{@const songs = artistData.songs || []}
			{@const collaborators = artistData.collaborators || []}

			<!-- Artist Profile Header Hero -->
			<section class="flex flex-col gap-6 rounded-2xl border border-[#2e2e2e] bg-[#171717] p-6 shadow-md md:flex-row md:items-center md:justify-between sm:p-8">
				<div class="flex items-center gap-5">
					<div class="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-[#2e2e2e] bg-[#1e1e1e] shadow-lg">
						<EntityIcon type={artist.label === 'Composer' ? 'composer' : 'artist'} class="h-full w-full" />
					</div>

					<div class="space-y-1.5">
						<div class="flex items-center gap-2">
							<span class="rounded-full border border-[#3ecf8e]/40 bg-[#1c392b] px-2.5 py-0.5 text-[10px] font-bold text-[#3ecf8e] uppercase">
								:{artist.label} Graph Node
							</span>
							<span class="text-xs text-[#71717a]">{artist.country || 'India'}</span>
						</div>

						<h1 class="font-heading text-2xl font-extrabold text-white sm:text-3xl">
							{artist.name}
						</h1>

						<p class="font-sans text-xs text-[#a1a1aa]">
							Featured in <span class="font-bold text-white">{songs.length}</span> tracks & connected with <span class="font-bold text-white">{collaborators.length}</span> collaborators in the music graph.
						</p>
					</div>
				</div>

				<div class="flex flex-wrap items-center gap-2.5">
					<a
						href="/connect?start={encodeURIComponent(artist.name)}"
						class="sb-btn-primary inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold"
					>
						⚡ Find Connections From {artist.name}
					</a>
				</div>
			</section>

			<!-- Collaborators / Co-creators Strip -->
			{#if collaborators.length > 0}
				<section class="space-y-3">
					<div class="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
						<span>👥 Top Graph Collaborators</span>
						<span class="text-[10px] text-[#71717a]">({collaborators.length})</span>
					</div>

					<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
						{#each collaborators as collab}
							<a
								href="/artist/{encodeURIComponent(collab.name)}"
								class="flex flex-col items-center gap-2 rounded-xl border border-[#2e2e2e] bg-[#171717] p-3 text-center transition-all hover:border-[#3ecf8e]/50 hover:bg-[#1e1e1e]"
							>
								<div class="h-10 w-10 overflow-hidden rounded-full border border-[#333] bg-[#222]">
									<EntityIcon type={collab.label === 'Composer' ? 'composer' : 'artist'} class="h-full w-full" />
								</div>
								<div class="w-full">
									<div class="truncate text-xs font-bold text-white">{collab.name}</div>
									<div class="text-[10px] text-[#71717a]">{collab.label}</div>
								</div>
							</a>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Discography Tracks in Mesh -->
			<section class="space-y-4 font-mono">
				<div class="flex items-center justify-between border-b border-[#2e2e2e] pb-3">
					<div class="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
						<span>🎵 Tracks in Knowledge Graph</span>
						<span class="rounded bg-[#262626] px-2 py-0.5 text-[10px] text-[#3ecf8e]">{songs.length}</span>
					</div>
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each songs as song}
						<div class="flex items-center justify-between gap-3 rounded-xl border border-[#2e2e2e] bg-[#171717] p-4 transition-all hover:border-[#3ecf8e]/40">
							<div class="flex items-center gap-3 overflow-hidden">
								<div class="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-[#2e2e2e] bg-[#1e1e1e]">
									<EntityIcon type="song" class="h-full w-full" />
								</div>
								<div class="truncate">
									<a href="/song/{song.id}" class="font-heading truncate text-sm font-bold text-white hover:text-[#3ecf8e] hover:underline">
										{song.title}
									</a>
									<div class="text-[11px] text-[#71717a]">{song.releaseYear || 2022}</div>
								</div>
							</div>

							<a
								href="/song/{song.id}"
								class="sb-btn-secondary shrink-0 px-2.5 py-1 text-[11px] font-semibold"
							>
								Graph ➔
							</a>
						</div>
					{/each}
				</div>
			</section>
		{/if}
	{:catch error}
		<div class="rounded-xl border border-[#ef4444]/40 bg-[#1c1214] p-8 text-center text-xs text-[#fca5a5]">
			⚠️ Failed to load artist data: {error?.message}
		</div>
	{/await}
</div>
