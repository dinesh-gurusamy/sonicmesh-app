<script lang="ts">
	import { enhance } from '$app/forms';
	import { browser } from '$app/environment';
	import LoadingSkeleton from '$lib/components/LoadingSkeleton.svelte';
	import EntityIcon from '$lib/components/EntityIcon.svelte';

	let { data } = $props();

	let isLiked = $state(false);
	let likeCount = $state(0);

	async function getSongDetail(songId: string) {
		if (!browser) return { song: null };
		const res = await fetch(`/api/song/${songId}`, { credentials: 'include' });
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
	<title>{data.songId} — SonicMesh Studio</title>
</svelte:head>

<div class="mx-auto max-w-4xl space-y-8 py-2 font-mono">
	<!-- Top Navigation -->
	<div>
		<a href="/" class="flex items-center gap-1 font-mono text-xs text-[#3ecf8e] hover:underline">
			← Back to Catalog Overview
		</a>
	</div>

	{#await songPromise}
		<LoadingSkeleton variant="detail" />
	{:then payload}
		{#if payload.song}
			{@const song = payload.song}
			<!-- Song Header Card -->
			<section
				class="relative flex flex-col items-center gap-8 overflow-hidden rounded-xl border border-[#2e2e2e] bg-[#171717] p-6 shadow-md sm:p-8 md:flex-row"
			>
				<div
					class="relative h-44 w-44 shrink-0 overflow-hidden rounded-lg border border-[#2e2e2e] shadow-md sm:h-48 sm:w-48"
				>
					<EntityIcon type="song" class="h-full w-full" />
				</div>

				<div class="flex-1 space-y-3 text-center md:text-left">
					<div class="flex flex-wrap items-center justify-center gap-2 text-xs md:justify-start">
						<span
							class="rounded border border-[#2b5940] bg-[#1c392b] px-2.5 py-0.5 font-bold text-[#3ecf8e] uppercase"
						>
							Track #{song.id}
						</span>
						<span class="rounded border border-[#2e2e2e] bg-[#1e1e1e] px-2.5 py-0.5 text-[#a1a1aa]">
							Released {song.releaseYear}
						</span>
						<span class="rounded border border-[#2e2e2e] bg-[#1e1e1e] px-2.5 py-0.5 text-[#a1a1aa]">
							{Math.floor(song.durationSeconds / 60)}m {song.durationSeconds % 60}s
						</span>
					</div>

					<h1 class="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
						{song.title}
					</h1>

					<div class="text-base font-bold text-[#3ecf8e]">
						{song.artists.map((a: any) => a.name).join(', ') || 'Various Performers'}
					</div>

					<div class="flex flex-wrap items-center justify-center gap-3 pt-2 md:justify-start">
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
								class="flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold shadow-xs transition-all {isLiked
									? 'bg-[#f43f5e] text-white'
									: 'sb-btn-secondary'}"
							>
								<svg
									class="h-4 w-4 {isLiked ? 'fill-current' : 'fill-none'}"
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
								{isLiked ? 'Liked in Graph' : 'Like Track'} ({likeCount})
							</button>
						</form>

						<a
							href="/recommendations"
							class="sb-btn-primary flex items-center gap-2 px-4 py-2 text-xs font-semibold"
						>
							Inspect Recommendations ➔
						</a>
					</div>
				</div>
			</section>

			<!-- Song Characteristics & Metadata Ledger -->
			<section class="grid grid-cols-1 gap-4 md:grid-cols-3">
				<!-- Performers & Composers -->
				<div class="space-y-3 rounded-lg border border-[#2e2e2e] bg-[#171717] p-4 shadow-xs">
					<div class="text-xs font-bold text-[#71717a] uppercase">Creators & Performers</div>
					<div class="space-y-2 text-xs">
						{#each song.artists as a}
							<div
								class="flex items-center gap-2 rounded border border-[#2e2e2e] bg-[#1e1e1e] p-2 text-white"
							>
								<span class="font-bold text-[#a855f7]">🎤</span>
								<span>{a.name} (Performer)</span>
							</div>
						{/each}
						{#each song.composers as c}
							<div
								class="flex items-center gap-2 rounded border border-[#2e2e2e] bg-[#1e1e1e] p-2 text-white"
							>
								<span class="font-bold text-[#f59e0b]">🎼</span>
								<span>{c.name} (Composer)</span>
							</div>
						{/each}
					</div>
				</div>

				<!-- Music Attributes -->
				<div class="space-y-3 rounded-lg border border-[#2e2e2e] bg-[#171717] p-4 shadow-xs">
					<div class="text-xs font-bold text-[#71717a] uppercase">Music Characteristics</div>
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
					<div class="text-xs font-bold text-[#71717a] uppercase">Album</div>
					{#if song.album}
						<div class="flex items-center gap-3 rounded border border-[#2e2e2e] bg-[#1e1e1e] p-2">
							<EntityIcon type="album" class="h-10 w-10 shrink-0" />
							<div>
								<div class="font-heading text-xs font-bold text-white">{song.album.title}</div>
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
					: 'Failed to load track details'}
			</h3>
			<p class="mx-auto max-w-md font-sans text-xs text-[#fca5a5]/80">
				{!browser || !navigator.onLine
					? 'Please check your internet or local network connection and try again.'
					: error?.message || 'An error occurred while fetching track details.'}
			</p>
			<button
				onclick={() => location.reload()}
				class="sb-btn-secondary inline-flex cursor-pointer items-center gap-2 px-4 py-2 text-xs font-semibold"
			>
				🔄 Reload Track
			</button>
		</div>
	{/await}
</div>
