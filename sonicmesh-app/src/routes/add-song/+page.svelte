<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props<{ form?: { success?: boolean; error?: string } | null }>();

	let isSubmitting = $state(false);

	const GENRE_OPTIONS = ['Folk Metal / Dance', 'Kuthu / Pop', 'Classical Fusion', 'Romantic Ballad', 'Sufi / Spiritual', 'Global Pop', 'Indie Rock'];
	const MOOD_OPTIONS = ['High Energy', 'Romantic', 'Melancholic', 'Soulful', 'Party', 'Chill'];
	const LANGUAGE_OPTIONS = ['Tamil', 'Hindi', 'Telugu', 'Malayalam', 'Kannada', 'English'];
</script>

<div class="max-w-3xl mx-auto space-y-8 py-2">
	<!-- Page Header -->
	<div class="space-y-2">
		<a href="/" class="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1">
			← Back to Songs Catalog
		</a>
		<h1 class="text-3xl font-extrabold font-heading text-slate-900">Add a New Song</h1>
		<p class="text-xs sm:text-sm text-slate-600">
			Add a track to the catalog and link its performers, composers, album, genre, and mood.
		</p>
	</div>

	<!-- Form Success Toast / Banner -->
	{#if form?.success}
		<div class="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3 shadow-md animate-fade-in">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
					✓
				</div>
				<div>
					<h3 class="font-bold text-base text-emerald-950 font-heading">Song Added to Graph Successfully!</h3>
					<p class="text-xs text-emerald-800 font-mono mt-0.5">8 graph entities connected &bull; 7 typed relationships created</p>
				</div>
			</div>
			<div class="pt-2 flex justify-end">
				<a href="/" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all">
					Explore Music Graph ➔
				</a>
			</div>
		</div>
	{/if}

	<!-- Form Error Alert -->
	{#if form?.error}
		<div class="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3 shadow-sm">
			<svg class="w-5 h-5 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
		class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-8 shadow-md"
	>
		<!-- 1. Song Core Metadata -->
		<div class="space-y-4">
			<h2 class="text-base font-bold text-indigo-600 uppercase tracking-wider font-heading flex items-center gap-2">
				<span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
				1. Song Information
			</h2>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="sm:col-span-2">
					<label for="title" class="block text-xs font-bold text-slate-700 mb-1">Song Title *</label>
					<input
						type="text"
						id="title"
						name="title"
						required
						placeholder="e.g. Arabic Kuthu - Halamithi Habibo"
						class="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-medium focus:ring-2 focus:ring-indigo-500"
					/>
				</div>

				<div>
					<label for="releaseYear" class="block text-xs font-bold text-slate-700 mb-1">Release Year</label>
					<input
						type="number"
						id="releaseYear"
						name="releaseYear"
						value="2023"
						class="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-medium focus:ring-2 focus:ring-indigo-500"
					/>
				</div>

				<div>
					<label for="durationSeconds" class="block text-xs font-bold text-slate-700 mb-1">Duration (Seconds)</label>
					<input
						type="number"
						id="durationSeconds"
						name="durationSeconds"
						value="240"
						class="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-medium focus:ring-2 focus:ring-indigo-500"
					/>
				</div>
			</div>
		</div>

		<!-- 2. Creators & Performers -->
		<div class="space-y-4 pt-4 border-t border-slate-100">
			<h2 class="text-base font-bold text-purple-600 uppercase tracking-wider font-heading flex items-center gap-2">
				<span class="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
				2. Artists & Creators
			</h2>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label for="artistName" class="block text-xs font-bold text-slate-700 mb-1">Performer / Artist Name *</label>
					<input
						type="text"
						id="artistName"
						name="artistName"
						required
						placeholder="e.g. Anirudh Ravichander"
						class="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-medium focus:ring-2 focus:ring-indigo-500"
					/>
				</div>

				<div>
					<label for="composerName" class="block text-xs font-bold text-slate-700 mb-1">Composer Name *</label>
					<input
						type="text"
						id="composerName"
						name="composerName"
						required
						placeholder="e.g. A.R. Rahman"
						class="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-medium focus:ring-2 focus:ring-indigo-500"
					/>
				</div>

				<div>
					<label for="lyricistName" class="block text-xs font-bold text-slate-700 mb-1">Lyricist Name (Optional)</label>
					<input
						type="text"
						id="lyricistName"
						name="lyricistName"
						placeholder="e.g. Vairamuthu"
						class="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-medium focus:ring-2 focus:ring-indigo-500"
					/>
				</div>

				<div>
					<label for="albumTitle" class="block text-xs font-bold text-slate-700 mb-1">Album Title (Optional)</label>
					<input
						type="text"
						id="albumTitle"
						name="albumTitle"
						placeholder="e.g. Beast Original Soundtrack"
						class="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-medium focus:ring-2 focus:ring-indigo-500"
					/>
				</div>
			</div>
		</div>

		<!-- 3. Music Characteristics -->
		<div class="space-y-4 pt-4 border-t border-slate-100">
			<h2 class="text-base font-bold text-amber-600 uppercase tracking-wider font-heading flex items-center gap-2">
				<span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
				3. Genre, Mood & Language
			</h2>

			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div>
					<label for="genreName" class="block text-xs font-bold text-slate-700 mb-1">Genre *</label>
					<input
						type="text"
						id="genreName"
						name="genreName"
						required
						list="genre-list"
						placeholder="e.g. Kuthu / Pop"
						class="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-medium focus:ring-2 focus:ring-indigo-500"
					/>
					<datalist id="genre-list">
						{#each GENRE_OPTIONS as opt}
							<option value={opt}></option>
						{/each}
					</datalist>
				</div>

				<div>
					<label for="moodName" class="block text-xs font-bold text-slate-700 mb-1">Mood *</label>
					<input
						type="text"
						id="moodName"
						name="moodName"
						required
						list="mood-list"
						placeholder="e.g. High Energy"
						class="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-medium focus:ring-2 focus:ring-indigo-500"
					/>
					<datalist id="mood-list">
						{#each MOOD_OPTIONS as opt}
							<option value={opt}></option>
						{/each}
					</datalist>
				</div>

				<div>
					<label for="languageName" class="block text-xs font-bold text-slate-700 mb-1">Language *</label>
					<input
						type="text"
						id="languageName"
						name="languageName"
						required
						list="language-list"
						placeholder="e.g. Tamil"
						class="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-medium focus:ring-2 focus:ring-indigo-500"
					/>
					<datalist id="language-list">
						{#each LANGUAGE_OPTIONS as opt}
							<option value={opt}></option>
						{/each}
					</datalist>
				</div>
			</div>
		</div>

		<!-- Form Submit Button -->
		<div class="pt-4 border-t border-slate-200 flex items-center justify-end">
			<button
				type="submit"
				disabled={isSubmitting}
				class="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 hover:scale-[1.01] disabled:opacity-50"
			>
				{#if isSubmitting}
					<span class="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
					Saving Song...
				{:else}
					Add to SonicMesh ➔
				{/if}
			</button>
		</div>
	</form>
</div>
