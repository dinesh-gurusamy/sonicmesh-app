<script lang="ts">
	import { enhance } from '$app/forms';
	import { browser } from '$app/environment';
	import LoadingSkeleton from '$lib/components/LoadingSkeleton.svelte';

	let { data } = $props();

	let isLiked = $state(false);
	let likeCount = $state(0);

	async function getSongDetail(songId: string) {
		if (!browser) return { song: null };
		const res = await fetch(`/api/song/${songId}`);
		if (!res.ok) throw new Error('Failed to fetch song details');
		const payload = await res.json();
		if (payload.song) {
			isLiked = payload.song.isLiked;
			likeCount = payload.song.likeCount;
		}
		return payload;
	}

	let songPromise = $derived(getSongDetail(data.songId));
</script>

<svelte:head>
	<title>Track #{data.songId} Node — SonicMesh Studio</title>
</svelte:head>

<div class="mx-auto max-w-4xl space-y-8 py-2 font-mono">
	<!-- Top Navigation -->
	<div>
		<a href="/" class="flex items-center gap-1 text-xs text-[#3ecf8e] hover:underline font-mono">
			← Back to Catalog Overview
		</a>
	</div>

	{#await songPromise}
		<LoadingSkeleton variant="detail" />
	{:then payload}
		{#if payload.song}
			{@const song = payload.song}
			<!-- Song Header Card -->
			<section class="relative overflow-hidden rounded-xl border border-[#2e2e2e] bg-[#171717] p-6 sm:p-8 shadow-md flex flex-col md:flex-row items-center gap-8">
				<div class="h-44 w-44 sm:h-48 sm:w-48 shrink-0 overflow-hidden rounded-lg border border-[#2e2e2e] shadow-md relative">
					<img src={song.coverImage} alt={song.title} class="h-full w-full object-cover" />
				</div>

				<div class="flex-1 space-y-3 text-center md:text-left">
					<div class="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs">
						<span class="rounded bg-[#1c392b] border border-[#2b5940] px-2.5 py-0.5 font-bold text-[#3ecf8e] uppercase">
							Track #{song.id}
						</span>
						<span class="rounded bg-[#1e1e1e] border border-[#2e2e2e] px-2.5 py-0.5 text-[#a1a1aa]">
							Released {song.releaseYear}
						</span>
						<span class="rounded bg-[#1e1e1e] border border-[#2e2e2e] px-2.5 py-0.5 text-[#a1a1aa]">
							{Math.floor(song.durationSeconds / 60)}m {song.durationSeconds % 60}s
						</span>
					</div>

					<h1 class="font-heading text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
						{song.title}
					</h1>

					<div class="text-base text-[#3ecf8e] font-bold">
						{song.artists.map((a: any) => a.name).join(', ') || 'Various Performers'}
					</div>

					<div class="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
						<form
							method="POST"
							action="?/like"
							use:enhance={() => {
								isLiked = !isLiked;
								likeCount += isLiked ? 1 : -1;
								return async ({ update }) => {
									await update({ reset: false });
								};
							}}
						>
							<button
								type="submit"
								class="cursor-pointer rounded-md px-4 py-2 text-xs font-semibold transition-all flex items-center gap-2 shadow-xs {isLiked ? 'bg-[#f43f5e] text-white' : 'sb-btn-secondary'}"
							>
								<svg class="w-4 h-4 {isLiked ? 'fill-current' : 'none'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
								</svg>
								{isLiked ? 'Liked in Graph' : 'Like Track'} ({likeCount})
							</button>
						</form>

						<a
							href="/recommendations"
							class="sb-btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-2"
						>
							Inspect Recommendations ➔
						</a>
					</div>
				</div>
			</section>

			<!-- Song Characteristics & Metadata Ledger -->
			<section class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<!-- Performers & Composers -->
				<div class="space-y-3 rounded-lg border border-[#2e2e2e] bg-[#171717] p-4 shadow-xs">
					<div class="text-xs font-bold uppercase text-[#71717a]">
						Creators & Performers
					</div>
					<div class="space-y-2 text-xs">
						{#each song.artists as a}
							<div class="flex items-center gap-2 p-2 rounded bg-[#1e1e1e] border border-[#2e2e2e] text-white">
								<span class="text-[#a855f7] font-bold">🎤</span>
								<span>{a.name} (Performer)</span>
							</div>
						{/each}
						{#each song.composers as c}
							<div class="flex items-center gap-2 p-2 rounded bg-[#1e1e1e] border border-[#2e2e2e] text-white">
								<span class="text-[#f59e0b] font-bold">🎼</span>
								<span>{c.name} (Composer)</span>
							</div>
						{/each}

					</div>
				</div>

				<!-- Music Attributes -->
				<div class="space-y-3 rounded-lg border border-[#2e2e2e] bg-[#171717] p-4 shadow-xs">
					<div class="text-xs font-bold uppercase text-[#71717a]">
						Music Characteristics
					</div>
					<div class="flex flex-wrap gap-1.5 text-xs">
						{#each song.genres as g}
							<span class="sb-badge-purple px-2.5 py-1">Genre: {g.name}</span>
						{/each}
						{#each song.moods as m}
							<span class="sb-badge-green px-2.5 py-1">Mood: {m.name}</span>
						{/each}
						{#each song.languages as lang}
							<span class="sb-badge-blue px-2.5 py-1">Lang: {lang.name}</span>
						{/each}
					</div>
				</div>

				<!-- Album Info -->
				<div class="space-y-3 rounded-lg border border-[#2e2e2e] bg-[#171717] p-4 shadow-xs">
					<div class="text-xs font-bold uppercase text-[#71717a]">
						Album Node
					</div>
					{#if song.album}
						<div class="flex items-center gap-3 p-2 rounded bg-[#1e1e1e] border border-[#2e2e2e]">
							<img src={song.album.coverImage} alt={song.album.title} class="h-10 w-10 rounded object-cover border border-[#2e2e2e]" />
							<div>
								<div class="font-heading font-bold text-xs text-white">{song.album.title}</div>
								<div class="text-[10px] text-[#a1a1aa]">{song.album.releaseYear} Album</div>
							</div>
						</div>
					{:else}
						<div class="text-xs text-[#a1a1aa]">Single Track Release</div>
					{/if}
				</div>
			</section>
		{/if}
	{:catch error}
		<div class="rounded-lg border border-[#2e2e2e] bg-[#171717] p-8 text-center text-xs text-[#a1a1aa]">
			Failed to load song details.
		</div>
	{/await}
</div>
