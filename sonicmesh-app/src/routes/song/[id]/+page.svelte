<script lang="ts">
	import { enhance } from '$app/forms';
	import LoadingSkeleton from '$lib/components/LoadingSkeleton.svelte';
	import VisualGraphExplorer from '$lib/components/VisualGraphExplorer.svelte';

	let { data } = $props();

	let isLiked = $state(false);
	let likeCount = $state(0);

	async function getSongDetail(songId: string) {
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

<div class="max-w-4xl mx-auto space-y-8 py-2">
	<!-- Top Navigation -->
	<div>
		<a href="/" class="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1">
			← Back to Songs Catalog
		</a>
	</div>

	{#await songPromise}
		<LoadingSkeleton variant="detail" />
	{:then payload}
		{#if payload.song}
			{@const song = payload.song}
			<!-- Song Header & Album Image Card -->
			<section class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
				<div class="w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shadow-lg border border-slate-200 shrink-0 relative">
					<img src={song.coverImage} alt={song.title} class="w-full h-full object-cover" />
				</div>

				<div class="flex-1 space-y-4 text-center md:text-left">
					<div class="flex flex-wrap items-center justify-center md:justify-start gap-2">
						<span class="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
							Track #{song.id}
						</span>
						<span class="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
							Released {song.releaseYear}
						</span>
						<span class="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-semibold">
							{Math.floor(song.durationSeconds / 60)}m {song.durationSeconds % 60}s
						</span>
					</div>

					<h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-heading tracking-tight">
						{song.title}
					</h1>

					<div class="text-base sm:text-lg text-indigo-600 font-bold">
						{song.artists.map((a: any) => a.name).join(', ') || 'Various Performers'}
					</div>

					<div class="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4">
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
								class="px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm hover:scale-105 {isLiked ? 'bg-rose-600 text-white shadow-rose-500/20' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'}"
							>
								<svg class="w-4 h-4 {isLiked ? 'fill-current' : 'none'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
								</svg>
								{isLiked ? 'Liked in Taste Graph' : 'Like Song'} ({likeCount})
							</button>
						</form>

						<a
							href="/recommendations"
							class="px-5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold transition-all flex items-center gap-2"
						>
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
							</svg>
							View Recommendations ➔
						</a>
					</div>
				</div>
			</section>

			<!-- 🕸️ Interactive Visual Graph Explorer Section -->
			<section class="space-y-3">
				<VisualGraphExplorer {song} />
			</section>

			<!-- Relationships & Creators Grid -->
			<section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
					<div class="flex items-center justify-between text-xs text-indigo-600 font-bold uppercase tracking-wider">
						<span>Performers</span>
						<span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
					</div>
					<div class="text-sm font-bold text-slate-900">Vocalists & Performers</div>
					<div class="space-y-2.5">
						{#each song.artists as a}
							<a href="/artist/{encodeURIComponent(a.name)}" class="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-colors">
								<img src={a.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80'} alt={a.name} class="w-10 h-10 rounded-full object-cover shadow-sm shrink-0" />
								<div>
									<div class="text-xs font-bold text-slate-900">{a.name}</div>
									<div class="text-[10px] text-slate-500 font-semibold">{a.country || 'India'}</div>
								</div>
							</a>
						{/each}
					</div>
				</div>

				<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
					<div class="flex items-center justify-between text-xs text-amber-600 font-bold uppercase tracking-wider">
						<span>Composers</span>
						<span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
					</div>
					<div class="text-sm font-bold text-slate-900">Music Directors</div>
					<div class="space-y-2.5">
						{#each song.composers as c}
							<a href="/artist/{encodeURIComponent(c.name)}" class="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-colors">
								<img src={c.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80'} alt={c.name} class="w-10 h-10 rounded-full object-cover shadow-sm shrink-0" />
								<div>
									<div class="text-xs font-bold text-slate-900">{c.name}</div>
									<div class="text-[10px] text-amber-700 font-semibold">Composer</div>
								</div>
							</a>
						{/each}
					</div>
				</div>

				<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
					<div class="flex items-center justify-between text-xs text-rose-600 font-bold uppercase tracking-wider">
						<span>Album & Style</span>
						<span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
					</div>
					<div class="text-sm font-bold text-slate-900">Album & Tags</div>
					<div class="space-y-3">
						{#if song.album}
							<div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
								<img src={song.album.coverImage || song.coverImage} alt={song.album.title} class="w-10 h-10 rounded-lg object-cover shadow-sm shrink-0" />
								<div>
									<div class="text-xs font-bold text-slate-900">{song.album.title}</div>
									<div class="text-[10px] text-slate-500">Album Node</div>
								</div>
							</div>
						{/if}

						<div class="flex flex-wrap gap-2">
							{#each song.genres as g}
								<span class="px-3 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
									{g.name}
								</span>
							{/each}
							{#each song.moods as m}
								<span class="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
									{m.name}
								</span>
							{/each}
						</div>
					</div>
				</div>
			</section>
		{:else}
			<div class="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
				Song not found.
			</div>
		{/if}
	{:catch error}
		<div class="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
			Failed to load song details.
		</div>
	{/await}
</div>
