<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props<{ form?: { success?: boolean; error?: string } | null }>();

	let isSubmitting = $state(false);

	const GENRE_OPTIONS = ['Folk Metal / Dance', 'Kuthu / Pop', 'Classical Fusion', 'Romantic Ballad', 'Sufi / Spiritual', 'Global Pop', 'Indie Rock'];
	const MOOD_OPTIONS = ['High Energy', 'Romantic', 'Melancholic', 'Soulful', 'Party', 'Chill'];
	const LANGUAGE_OPTIONS = ['Tamil', 'Hindi', 'Telugu', 'Malayalam', 'Kannada', 'English'];
</script>

<svelte:head>
	<title>Insert Song Node — SonicMesh Studio</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-8 py-2 font-mono">
	<!-- Page Header -->
	<div class="space-y-2 border-b border-[#2e2e2e] pb-6">
		<a href="/" class="flex items-center gap-1 text-xs text-[#3ecf8e] hover:underline font-mono">
			← Back to Catalog Overview
		</a>
		<h1 class="font-heading text-3xl font-extrabold text-white">Insert New Song Node</h1>
		<p class="text-xs text-[#a1a1aa] font-sans">
			Insert a track into the graph and execute Cypher MERGE queries connecting performers, composers, album, genre, mood, and featured instruments.
		</p>
	</div>

	<!-- Form Success Toast -->
	{#if form?.success}
		<div class="p-6 rounded-lg bg-[#1c392b] border border-[#2b5940] text-[#3ecf8e] space-y-3 shadow-md animate-fade-in">
			<div class="flex items-center gap-3">
				<div class="w-8 h-8 rounded bg-[#3ecf8e] text-[#062317] flex items-center justify-center font-bold text-base shrink-0">
					✓
				</div>
				<div>
					<h3 class="font-bold text-base text-white font-heading">Song Node Inserted & Merged Successfully!</h3>
					<p class="text-xs text-[#3ecf8e] mt-0.5">8 graph nodes linked &bull; 7 typed openCypher relationships merged</p>
				</div>
			</div>
			<div class="pt-2 flex justify-end">
				<a href="/" class="sb-btn-primary px-5 py-2 text-xs font-semibold">
					Explore Graph Catalog ➔
				</a>
			</div>
		</div>
	{/if}

	<!-- Form Error Alert -->
	{#if form?.error}
		<div class="p-4 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-3 shadow-sm">
			<svg class="w-5 h-5 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
			</svg>
			<span>{form.error}</span>
		</div>
	{/if}

	<!-- Single-Page Add Song Form -->
	<form
		method="POST"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ update }) => {
				isSubmitting = false;
				await update();
			};
		}}
		class="bg-[#171717] p-6 sm:p-8 rounded-xl border border-[#2e2e2e] space-y-8 shadow-md"
	>
		<!-- 1. Song Core Metadata -->
		<div class="space-y-4">
			<h2 class="text-xs font-bold text-[#3ecf8e] uppercase tracking-wider flex items-center gap-2">
				<span class="w-2 h-2 rounded-full bg-[#3ecf8e]"></span>
				1. Song Node Information
			</h2>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="sm:col-span-2">
					<label for="title" class="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-1">Song Title *</label>
					<input
						type="text"
						id="title"
						name="title"
						required
						placeholder="e.g. Arabic Kuthu - Halamithi Habibo"
						class="sb-input w-full px-4 py-2.5 text-xs font-mono"
					/>
				</div>

				<div>
					<label for="releaseYear" class="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-1">Release Year</label>
					<input
						type="number"
						id="releaseYear"
						name="releaseYear"
						value="2023"
						class="sb-input w-full px-4 py-2.5 text-xs font-mono"
					/>
				</div>

				<div>
					<label for="durationSeconds" class="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-1">Duration (Seconds)</label>
					<input
						type="number"
						id="durationSeconds"
						name="durationSeconds"
						value="240"
						class="sb-input w-full px-4 py-2.5 text-xs font-mono"
					/>
				</div>
			</div>
		</div>

		<!-- 2. Creators & Performers -->
		<div class="space-y-4 pt-4 border-t border-[#2e2e2e]">
			<h2 class="text-xs font-bold text-[#f59e0b] uppercase tracking-wider flex items-center gap-2">
				<span class="w-2 h-2 rounded-full bg-[#f59e0b]"></span>
				2. Creator & Performer Nodes
			</h2>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label for="artistName" class="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-1">Performer / Artist Name *</label>
					<input
						type="text"
						id="artistName"
						name="artistName"
						required
						placeholder="e.g. Anirudh Ravichander"
						class="sb-input w-full px-4 py-2.5 text-xs font-mono"
					/>
				</div>

				<div>
					<label for="composerName" class="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-1">Composer Name *</label>
					<input
						type="text"
						id="composerName"
						name="composerName"
						required
						placeholder="e.g. A.R. Rahman"
						class="sb-input w-full px-4 py-2.5 text-xs font-mono"
					/>
				</div>

				<div>
					<label for="lyricistName" class="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-1">Lyricist Name (Optional)</label>
					<input
						type="text"
						id="lyricistName"
						name="lyricistName"
						placeholder="e.g. Vairamuthu"
						class="sb-input w-full px-4 py-2.5 text-xs font-mono"
					/>
				</div>

				<div>
					<label for="albumTitle" class="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-1">Album Title (Optional)</label>
					<input
						type="text"
						id="albumTitle"
						name="albumTitle"
						placeholder="e.g. Beast Original Soundtrack"
						class="sb-input w-full px-4 py-2.5 text-xs font-mono"
					/>
				</div>
			</div>
		</div>

		<!-- 3. Music Characteristics -->
		<div class="space-y-4 pt-4 border-t border-[#2e2e2e]">
			<h2 class="text-xs font-bold text-[#a855f7] uppercase tracking-wider flex items-center gap-2">
				<span class="w-2 h-2 rounded-full bg-[#a855f7]"></span>
				3. Genre, Mood & Language
			</h2>

			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div>
					<label for="genreName" class="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-1">Genre *</label>
					<input
						type="text"
						id="genreName"
						name="genreName"
						required
						list="genre-list"
						placeholder="e.g. Kuthu / Pop"
						class="sb-input w-full px-4 py-2.5 text-xs font-mono"
					/>
					<datalist id="genre-list">
						{#each GENRE_OPTIONS as opt}
							<option value={opt}></option>
						{/each}
					</datalist>
				</div>

				<div>
					<label for="moodName" class="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-1">Mood *</label>
					<input
						type="text"
						id="moodName"
						name="moodName"
						required
						list="mood-list"
						placeholder="e.g. High Energy"
						class="sb-input w-full px-4 py-2.5 text-xs font-mono"
					/>
					<datalist id="mood-list">
						{#each MOOD_OPTIONS as opt}
							<option value={opt}></option>
						{/each}
					</datalist>
				</div>

				<div>
					<label for="languageName" class="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-1">Language *</label>
					<input
						type="text"
						id="languageName"
						name="languageName"
						required
						list="language-list"
						placeholder="e.g. Tamil"
						class="sb-input w-full px-4 py-2.5 text-xs font-mono"
					/>
					<datalist id="language-list">
						{#each LANGUAGE_OPTIONS as opt}
							<option value={opt}></option>
						{/each}
					</datalist>
				</div>
			</div>

			<div class="pt-2">
				<label for="instrumentName" class="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-1">Featured Instruments (Optional)</label>
				<input
					type="text"
					id="instrumentName"
					name="instrumentName"
					placeholder="e.g. Acoustic Guitar, Strings, Flute"
					class="sb-input w-full px-4 py-2.5 text-xs font-mono"
				/>
				<span class="text-[10px] text-[#71717a] mt-1 block font-mono">Executes Cypher MERGE for :FEATURES edge to Instrument nodes</span>
			</div>
		</div>

		<!-- Form Submit Button -->
		<div class="pt-4 border-t border-[#2e2e2e] flex items-center justify-end">
			<button
				type="submit"
				disabled={isSubmitting}
				class="sb-btn-primary px-6 py-2.5 text-xs font-mono font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
			>
				{#if isSubmitting}
					<span class="w-3.5 h-3.5 rounded-full border-2 border-[#062317] border-t-transparent animate-spin"></span>
					Merging Node...
				{:else}
					+ Insert Song Node ➔
				{/if}
			</button>
		</div>
	</form>
</div>
