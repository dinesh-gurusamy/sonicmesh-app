<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();

	let isSubmitting = $state(false);

	// Form inputs state for live graph preview
	let title = $state('');
	let releaseYear = $state(2024);
	let durationSeconds = $state(245);
	let artistName = $state('');
	let composerName = $state('');
	let lyricistName = $state('');
	let albumTitle = $state('');
	let genreName = $state('Melody');
	let moodName = $state('Romantic');
	let languageName = $state('Tamil');
	let instrumentName = $state('Acoustic Guitar');

	// Common genres, moods, and languages for quick selection
	const genresList = ['Melody', 'Pop / Dance', 'Classical', 'Kuthu', 'Folk', 'Hip-Hop / Rap', 'Rock / Fusion', 'Devotional'];
	const moodsList = ['Romantic', 'High Energy', 'Soulful', 'Heroic', 'Chill', 'Melancholic', 'Celebratory'];
	const languagesList = ['Tamil', 'Telugu', 'Hindi', 'Malayalam', 'Kannada'];
	const instrumentsList = ['Acoustic Guitar', 'Violin', 'Flute', 'Veena', 'Mridangam', 'Drums / Percussion', 'Piano / Synth'];

	function fillPreset(sample: {
		title: string;
		releaseYear: number;
		durationSeconds: number;
		artistName: string;
		composerName: string;
		lyricistName: string;
		albumTitle: string;
		genreName: string;
		moodName: string;
		languageName: string;
		instrumentName: string;
	}) {
		title = sample.title;
		releaseYear = sample.releaseYear;
		durationSeconds = sample.durationSeconds;
		artistName = sample.artistName;
		composerName = sample.composerName;
		lyricistName = sample.lyricistName;
		albumTitle = sample.albumTitle;
		genreName = sample.genreName;
		moodName = sample.moodName;
		languageName = sample.languageName;
		instrumentName = sample.instrumentName;
	}
</script>

<svelte:head>
	<title>Add Track & Graph Nodes — SonicMesh Studio</title>
</svelte:head>

<div class="mx-auto max-w-6xl space-y-8 py-4 pb-20">
	<!-- Page Header -->
	<div class="flex flex-col justify-between gap-4 border-b border-[#2e2e2e] pb-6 md:flex-row md:items-center">
		<div>
			<div class="flex items-center gap-2">
				<span class="h-2.5 w-2.5 rounded-full bg-[#3ecf8e]"></span>
				<div class="font-mono text-xs font-semibold tracking-wider text-[#3ecf8e] uppercase">
					Graph Schema Ingestion
				</div>
			</div>
			<h1 class="font-heading mt-1.5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
				Add Track to Music Mesh
			</h1>
			<p class="mt-1 text-sm text-[#a1a1aa]">
				Create a new Song node and connect its Artist, Composer, Album, Genre, Mood, and Language relationships in the knowledge graph.
			</p>
		</div>

		<!-- Quick Fill Sample Presets -->
		<div class="flex flex-wrap items-center gap-2.5 font-mono">
			<button
				type="button"
				onclick={() => fillPreset({
					title: 'Katchi Sera',
					releaseYear: 2024,
					durationSeconds: 210,
					artistName: 'Sai Abhyankkar',
					composerName: 'Sai Abhyankkar',
					lyricistName: 'Adesh Krishna',
					albumTitle: 'Katchi Sera',
					genreName: 'Pop / Dance',
					moodName: 'High Energy',
					languageName: 'Tamil',
					instrumentName: 'Acoustic Guitar'
				})}
				class="sb-btn-secondary cursor-pointer px-3.5 py-2 text-xs font-semibold transition-all hover:border-[#3ecf8e]/50"
				title="Autofill with sample indie pop track"
			>
				⚡ Load Pop Preset
			</button>
			<button
				type="button"
				onclick={() => fillPreset({
					title: 'Nenjame Nenjame',
					releaseYear: 2023,
					durationSeconds: 290,
					artistName: 'Shakthisree Gopalan',
					composerName: 'A. R. Rahman',
					lyricistName: 'Yugabharathi',
					albumTitle: 'Maamannan',
					genreName: 'Melody',
					moodName: 'Soulful',
					languageName: 'Tamil',
					instrumentName: 'Violin'
				})}
				class="sb-btn-secondary cursor-pointer px-3.5 py-2 text-xs font-semibold transition-all hover:border-[#3ecf8e]/50"
				title="Autofill with sample classical melody track"
			>
				⚡ Load Melody Preset
			</button>
		</div>
	</div>

	<!-- Error Alert Box (if server action failed) -->
	{#if form?.error}
		<div class="flex items-center gap-3 rounded-xl border border-[#ef4444]/40 bg-[#26151a] p-4 text-sm text-[#fca5a5] shadow-md font-mono">
			<span class="text-lg">⚠️</span>
			<span>{form.error}</span>
		</div>
	{/if}

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
		<!-- Left: Spacious Form Inputs (7 Cols) -->
		<div class="lg:col-span-7 space-y-6">
			<form
				method="POST"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						isSubmitting = false;
						await update();
					};
				}}
				class="space-y-6"
			>
				<!-- 1. Song Metadata Card -->
				<section class="space-y-5 rounded-2xl border border-[#2e2e2e] bg-[#171717] p-6 sm:p-7 shadow-md">
					<div class="flex items-center gap-2.5 border-b border-[#262626] pb-3.5">
						<span class="font-mono text-xs font-bold text-[#3ecf8e]">01.</span>
						<h2 class="font-heading text-base font-bold text-white">Song Identity & Core Metadata</h2>
					</div>

					<div class="space-y-4">
						<div>
							<label for="title" class="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-[#d4d4d8]">
								Song Title <span class="text-[#ef4444]">*</span>
							</label>
							<input
								id="title"
								name="title"
								type="text"
								required
								bind:value={title}
								placeholder="e.g. Samajavaragamana"
								class="sb-input h-11 w-full px-4 text-sm font-medium placeholder-[#52525b]"
							/>
						</div>

						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label for="releaseYear" class="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-[#d4d4d8]">
									Release Year
								</label>
								<input
									id="releaseYear"
									name="releaseYear"
									type="number"
									min="1950"
									max="2030"
									bind:value={releaseYear}
									class="sb-input h-11 w-full px-4 text-sm font-medium"
								/>
							</div>

							<div>
								<label for="durationSeconds" class="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-[#d4d4d8]">
									Duration (Seconds)
								</label>
								<input
									id="durationSeconds"
									name="durationSeconds"
									type="number"
									min="30"
									max="900"
									bind:value={durationSeconds}
									class="sb-input h-11 w-full px-4 text-sm font-medium"
								/>
							</div>
						</div>
					</div>
				</section>

				<!-- 2. Creators & Performers Card -->
				<section class="space-y-5 rounded-2xl border border-[#2e2e2e] bg-[#171717] p-6 sm:p-7 shadow-md">
					<div class="flex items-center gap-2.5 border-b border-[#262626] pb-3.5">
						<span class="font-mono text-xs font-bold text-[#3ecf8e]">02.</span>
						<h2 class="font-heading text-base font-bold text-white">Performers, Composers & Lyricists</h2>
					</div>

					<div class="space-y-4">
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label for="artistName" class="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-[#d4d4d8]">
									Primary Performer / Singer <span class="text-[#ef4444]">*</span>
								</label>
								<input
									id="artistName"
									name="artistName"
									type="text"
									required
									bind:value={artistName}
									placeholder="e.g. Sid Sriram"
									class="sb-input h-11 w-full px-4 text-sm font-medium placeholder-[#52525b]"
								/>
							</div>

							<div>
								<label for="composerName" class="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-[#d4d4d8]">
									Music Composer <span class="text-[#ef4444]">*</span>
								</label>
								<input
									id="composerName"
									name="composerName"
									type="text"
									required
									bind:value={composerName}
									placeholder="e.g. S. Thaman"
									class="sb-input h-11 w-full px-4 text-sm font-medium placeholder-[#52525b]"
								/>
							</div>
						</div>

						<div>
							<label for="lyricistName" class="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-[#d4d4d8]">
								Lyricist (Optional)
							</label>
							<input
								id="lyricistName"
								name="lyricistName"
								type="text"
								bind:value={lyricistName}
								placeholder="e.g. Sirivennela Seetharama Sastry"
								class="sb-input h-11 w-full px-4 text-sm font-medium placeholder-[#52525b]"
							/>
						</div>
					</div>
				</section>

				<!-- 3. Album Information Card -->
				<section class="space-y-5 rounded-2xl border border-[#2e2e2e] bg-[#171717] p-6 sm:p-7 shadow-md">
					<div class="flex items-center gap-2.5 border-b border-[#262626] pb-3.5">
						<span class="font-mono text-xs font-bold text-[#3ecf8e]">03.</span>
						<h2 class="font-heading text-base font-bold text-white">Album & Collection</h2>
					</div>

					<div class="space-y-4">
						<div>
							<label for="albumTitle" class="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-[#d4d4d8]">
								Album / Movie Title
							</label>
							<input
								id="albumTitle"
								name="albumTitle"
								type="text"
								bind:value={albumTitle}
								placeholder="e.g. Ala Vaikunthapurramuloo"
								class="sb-input h-11 w-full px-4 text-sm font-medium placeholder-[#52525b]"
							/>
						</div>
					</div>
				</section>

				<!-- 4. Graph DNA & Classification Card -->
				<section class="space-y-5 rounded-2xl border border-[#2e2e2e] bg-[#171717] p-6 sm:p-7 shadow-md">
					<div class="flex items-center gap-2.5 border-b border-[#262626] pb-3.5">
						<span class="font-mono text-xs font-bold text-[#3ecf8e]">04.</span>
						<h2 class="font-heading text-base font-bold text-white">Audio DNA & Graph Attributes</h2>
					</div>

					<div class="space-y-5">
						<!-- Genre Selector & Quick Chips -->
						<div>
							<label for="genreName" class="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-[#d4d4d8]">
								Genre <span class="text-[#ef4444]">*</span>
							</label>
							<input
								id="genreName"
								name="genreName"
								type="text"
								required
								bind:value={genreName}
								class="sb-input h-11 w-full px-4 text-sm font-medium"
							/>
							<div class="mt-2.5 flex flex-wrap gap-2">
								{#each genresList as g}
									<button
										type="button"
										onclick={() => (genreName = g)}
										class="rounded-lg border px-3 py-1 font-mono text-xs font-medium transition-all {genreName === g ? 'border-[#3ecf8e] bg-[#1c392b] text-[#3ecf8e] shadow-xs' : 'border-[#2e2e2e] bg-[#121212] text-[#71717a] hover:text-white hover:border-[#444]'}"
									>
										{g}
									</button>
								{/each}
							</div>
						</div>

						<!-- Mood Selector & Quick Chips -->
						<div>
							<label for="moodName" class="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-[#d4d4d8]">
								Mood / Vibe <span class="text-[#ef4444]">*</span>
							</label>
							<input
								id="moodName"
								name="moodName"
								type="text"
								required
								bind:value={moodName}
								class="sb-input h-11 w-full px-4 text-sm font-medium"
							/>
							<div class="mt-2.5 flex flex-wrap gap-2">
								{#each moodsList as m}
									<button
										type="button"
										onclick={() => (moodName = m)}
										class="rounded-lg border px-3 py-1 font-mono text-xs font-medium transition-all {moodName === m ? 'border-[#f59e0b] bg-[#2e2009] text-[#f59e0b] shadow-xs' : 'border-[#2e2e2e] bg-[#121212] text-[#71717a] hover:text-white hover:border-[#444]'}"
									>
										{m}
									</button>
								{/each}
							</div>
						</div>

						<!-- Language & Instrument Grid -->
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label for="languageName" class="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-[#d4d4d8]">
									Language <span class="text-[#ef4444]">*</span>
								</label>
								<select
									id="languageName"
									name="languageName"
									bind:value={languageName}
									class="sb-input h-11 w-full px-4 text-sm font-medium"
								>
									{#each languagesList as l}
										<option value={l}>{l}</option>
									{/each}
								</select>
							</div>

							<div>
								<label for="instrumentName" class="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-[#d4d4d8]">
									Featured Instrument
								</label>
								<select
									id="instrumentName"
									name="instrumentName"
									bind:value={instrumentName}
									class="sb-input h-11 w-full px-4 text-sm font-medium"
								>
									<option value="">None / Synthesizer</option>
									{#each instrumentsList as inst}
										<option value={inst}>{inst}</option>
									{/each}
								</select>
							</div>
						</div>
					</div>
				</section>

				<!-- Submit Button Bar -->
				<div class="flex items-center justify-end gap-3.5 pt-2">
					<a href="/catalog" class="sb-btn-secondary px-6 py-3 font-mono text-xs font-semibold">
						Cancel
					</a>
					<button
						type="submit"
						disabled={isSubmitting}
						class="sb-btn-primary inline-flex items-center gap-2 px-8 py-3 font-mono text-xs font-bold cursor-pointer shadow-lg shadow-[#3ecf8e]/10"
					>
						{#if isSubmitting}
							<span class="h-4 w-4 animate-spin rounded-full border-2 border-[#062317] border-t-transparent"></span>
							<span>Creating Graph Nodes...</span>
						{:else}
							<span>+ Commit Track to Graph ➔</span>
						{/if}
					</button>
				</div>
			</form>
		</div>

		<!-- Right: Live Graph Preview & Visual Topology Card (5 Cols) -->
		<div class="lg:col-span-5 space-y-6">
			<div class="sticky top-20 space-y-5 rounded-2xl border border-[#2e2e2e] bg-[#171717] p-6 sm:p-7 shadow-md font-mono">
				<div class="flex items-center justify-between border-b border-[#262626] pb-3.5">
					<span class="font-bold text-white">Graph Topology Preview</span>
					<span class="rounded bg-[#1c392b] px-2.5 py-0.5 text-[10px] font-bold text-[#3ecf8e]">Live Schema</span>
				</div>

				<p class="font-sans text-xs text-[#a1a1aa] leading-relaxed">
					Submitting this form creates and links the following typed graph relationships in real time:
				</p>

				<div class="space-y-3 text-xs">
					<!-- Song Center Node -->
					<div class="rounded-xl border border-[#3ecf8e]/40 bg-[#121212] p-4 text-center shadow-inner">
						<span class="text-[10px] font-bold tracking-wider text-[#71717a] uppercase">:Song Node</span>
						<div class="font-heading text-base font-bold text-white mt-0.5">{title || 'Untitled Track'}</div>
						<div class="text-[11px] text-[#3ecf8e] mt-0.5 font-medium">{releaseYear} &bull; {Math.floor(durationSeconds / 60)}m {durationSeconds % 60}s</div>
					</div>

					<!-- Artist Link -->
					<div class="flex items-center justify-between rounded-lg border border-[#2e2e2e] bg-[#121212] p-3">
						<span class="text-[#3b82f6] font-semibold">(:Artist)</span>
						<span class="text-[10px] text-[#71717a] font-bold">➔ :PERFORMED ➔</span>
						<span class="truncate max-w-[140px] font-bold text-white">{artistName || 'Performer'}</span>
					</div>

					<!-- Composer Link -->
					<div class="flex items-center justify-between rounded-lg border border-[#2e2e2e] bg-[#121212] p-3">
						<span class="text-[#f59e0b] font-semibold">(:Composer)</span>
						<span class="text-[10px] text-[#71717a] font-bold">➔ :COMPOSED ➔</span>
						<span class="truncate max-w-[140px] font-bold text-white">{composerName || 'Composer'}</span>
					</div>

					<!-- Album Link -->
					{#if albumTitle}
						<div class="flex items-center justify-between rounded-lg border border-[#2e2e2e] bg-[#121212] p-3">
							<span class="text-[#a5b4fc] font-semibold">(:Album)</span>
							<span class="text-[10px] text-[#71717a] font-bold">➔ :PART_OF ➔</span>
							<span class="truncate max-w-[140px] font-bold text-white">{albumTitle}</span>
						</div>
					{/if}

					<!-- Genre Link -->
					<div class="flex items-center justify-between rounded-lg border border-[#2e2e2e] bg-[#121212] p-3">
						<span class="text-[#3ecf8e] font-semibold">(:Genre)</span>
						<span class="text-[10px] text-[#71717a] font-bold">➔ :HAS_GENRE ➔</span>
						<span class="font-bold text-white">{genreName}</span>
					</div>

					<!-- Mood Link -->
					<div class="flex items-center justify-between rounded-lg border border-[#2e2e2e] bg-[#121212] p-3">
						<span class="text-[#ec4899] font-semibold">(:Mood)</span>
						<span class="text-[10px] text-[#71717a] font-bold">➔ :HAS_MOOD ➔</span>
						<span class="font-bold text-white">{moodName}</span>
					</div>

					<!-- Language Link -->
					<div class="flex items-center justify-between rounded-lg border border-[#2e2e2e] bg-[#121212] p-3">
						<span class="text-[#06b6d4] font-semibold">(:Language)</span>
						<span class="text-[10px] text-[#71717a] font-bold">➔ :IN_LANGUAGE ➔</span>
						<span class="font-bold text-white">{languageName}</span>
					</div>

					<!-- Featured Instrument Link -->
					{#if instrumentName}
						<div class="flex items-center justify-between rounded-lg border border-[#2e2e2e] bg-[#121212] p-3">
							<span class="text-[#eab308] font-semibold">(:Instrument)</span>
							<span class="text-[10px] text-[#71717a] font-bold">➔ :FEATURES ➔</span>
							<span class="font-bold text-white">{instrumentName}</span>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
