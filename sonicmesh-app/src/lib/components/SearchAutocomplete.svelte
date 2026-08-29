<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import EntityIcon from '$lib/components/EntityIcon.svelte';

	interface Props {
		placeholder?: string;
		value?: string;
		actionUrl?: string;
		showSubmitButton?: boolean;
		size?: 'sm' | 'md' | 'lg';
		onselect?: (item: any) => void;
	}

	let {
		placeholder = 'Search songs, artists, composers...',
		value = $bindable(''),
		actionUrl = '/',
		showSubmitButton = true,
		size = 'md',
		onselect
	}: Props = $props();

	let isOpen = $state(false);
	let selectedIndex = $state(-1);

	let suggestions = $state<{ songs: any[]; artists: any[]; composers: any[] }>({
		songs: [],
		artists: [],
		composers: []
	});

	let isSearching = $state(false);

	async function fetchSuggestions(query: string) {
		if (!query.trim() || !browser) {
			suggestions = { songs: [], artists: [], composers: [] };
			return;
		}
		isSearching = true;
		try {
			const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
			if (res.ok) {
				suggestions = await res.json();
			}
		} catch (err) {
			console.error('Autocomplete fetch error:', err);
		} finally {
			isSearching = false;
		}
	}

	$effect(() => {
		const q = value;
		if (q.trim().length >= 1) {
			fetchSuggestions(q);
			isOpen = true;
		} else {
			suggestions = { songs: [], artists: [], composers: [] };
			isOpen = false;
		}
	});

	const flatSuggestions = $derived([
		...suggestions.songs.map((s) => ({ ...s, label: 'Song' })),
		...suggestions.artists.map((a) => ({ ...a, label: 'Artist' })),
		...suggestions.composers.map((c) => ({ ...c, label: 'Composer' }))
	]);

	function handleKeydown(e: KeyboardEvent) {
		if (!isOpen || flatSuggestions.length === 0) return;

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = (selectedIndex + 1) % flatSuggestions.length;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = (selectedIndex - 1 + flatSuggestions.length) % flatSuggestions.length;
		} else if (e.key === 'Enter') {
			if (selectedIndex >= 0 && selectedIndex < flatSuggestions.length) {
				e.preventDefault();
				handleSelect(flatSuggestions[selectedIndex]);
			}
		} else if (e.key === 'Escape') {
			isOpen = false;
		}
	}

	function handleSelect(item: any) {
		value = item.name || item.title;
		isOpen = false;

		if (onselect) {
			onselect(item);
		} else if (item.label === 'Song' && item.id) {
			goto(`/song/${item.id}`);
		} else if ((item.label === 'Artist' || item.label === 'Composer') && item.name) {
			goto(`/artist/${encodeURIComponent(item.name)}`);
		} else {
			const queryStr = `q=${encodeURIComponent(value.trim())}`;
			if (actionUrl.includes('#')) {
				const [base, hash] = actionUrl.split('#');
				goto(`${base || '/'}?${queryStr}#${hash}`);
			} else {
				goto(`${actionUrl}?${queryStr}`);
			}
		}
	}

	function handleSubmit(e: Event) {
		if (showSubmitButton && actionUrl) {
			e.preventDefault();
			if (value.trim()) {
				const queryStr = `q=${encodeURIComponent(value.trim())}`;
				if (actionUrl.includes('#')) {
					const [base, hash] = actionUrl.split('#');
					goto(`${base || '/'}?${queryStr}#${hash}`);
				} else {
					goto(`${actionUrl}?${queryStr}`);
				}
			}
		}
	}

	const presetSuggestions = [
		{ name: 'Vaseegara', type: 'Song' },
		{ name: 'Munbe Vaa', type: 'Song' },
		{ name: 'Harris Jayaraj', type: 'Composer' },
		{ name: 'A.R. Rahman', type: 'Composer' },
		{ name: 'Shreya Ghoshal', type: 'Artist' },
		{ name: 'Anirudh Ravichander', type: 'Artist' }
	];
</script>

<div class="relative w-full">
	<form onsubmit={handleSubmit} class="relative flex items-center">
		<div class="relative w-full">
			<input
				type="text"
				bind:value
				{placeholder}
				onkeydown={handleKeydown}
				onfocus={() => (isOpen = true)}
				onblur={() => setTimeout(() => (isOpen = false), 200)}
				class="sb-input w-full pl-10 pr-4 font-mono transition-all focus:border-[#3ecf8e]
				{size === 'lg' ? 'py-3.5 text-sm shadow-md' : size === 'sm' ? 'py-1.5 text-xs' : 'py-2.5 text-xs'}"
			/>

			<!-- Left Magnifying Glass Icon -->
			<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#71717a]">
				{#if isSearching}
					<span class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#3ecf8e] border-t-transparent"></span>
				{:else}
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
				{/if}
			</div>

			<!-- Clear Button -->
			{#if value}
				<button
					type="button"
					onclick={() => (value = '')}
					class="absolute inset-y-0 right-0 flex items-center pr-3 text-[#71717a] hover:text-white"
				>
					✕
				</button>
			{/if}
		</div>

		{#if showSubmitButton}
			<button
				type="submit"
				class="sb-btn-primary ml-2 shrink-0 px-4 py-2.5 font-mono text-xs font-semibold
				{size === 'lg' ? 'py-3.5 px-6 text-sm' : ''}"
			>
				Search ➔
			</button>
		{/if}
	</form>

	<!-- Suggestions Dropdown Drawer -->
	{#if isOpen}
		<div
			class="sb-fade-in absolute top-full left-0 right-0 z-50 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-[#2e2e2e] bg-[#141414] p-2 shadow-2xl backdrop-blur-md"
		>
			{#if flatSuggestions.length > 0}
				<div class="space-y-3 font-mono">
					<!-- Songs Group -->
					{#if suggestions.songs.length > 0}
						<div>
							<div
								class="mb-1 flex items-center gap-1.5 border-b border-[#2e2e2e] px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#3ecf8e] uppercase"
							>
								<span>🎵</span> Songs ({suggestions.songs.length})
							</div>
							{#each suggestions.songs as song, idx}
								{@const flatIdx = idx}
								<button
									type="button"
									onmousedown={() => handleSelect({ ...song, label: 'Song' })}
									class="flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-colors
									{selectedIndex === flatIdx ? 'bg-[#1c392b] text-[#3ecf8e]' : 'text-white hover:bg-[#262626]'}"
								>
									<EntityIcon type="song" class="h-8 w-8 shrink-0" />
									<div class="flex-1 overflow-hidden">
										<div class="font-heading truncate text-xs font-bold">{song.name}</div>
										<div class="truncate font-mono text-[10px] text-[#a1a1aa]">Song Track</div>
									</div>
									<span
										class="rounded border border-[#2b5940] bg-[#1c392b] px-1.5 py-0.5 text-[9px] font-bold text-[#3ecf8e]"
									>
										SONG
									</span>
								</button>
							{/each}
						</div>
					{/if}

					<!-- Artists Group -->
					{#if suggestions.artists.length > 0}
						<div>
							<div
								class="mb-1 flex items-center gap-1.5 border-b border-[#2e2e2e] px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#a855f7] uppercase"
							>
								<span>🎤</span> Artists ({suggestions.artists.length})
							</div>
							{#each suggestions.artists as artist, idx}
								{@const flatIdx = suggestions.songs.length + idx}
								<button
									type="button"
									onmousedown={() => handleSelect({ ...artist, label: 'Artist' })}
									class="flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-colors
									{selectedIndex === flatIdx ? 'bg-[#2d1b4e] text-[#a855f7]' : 'text-white hover:bg-[#262626]'}"
								>
									<EntityIcon type="artist" class="h-8 w-8 shrink-0" />
									<div class="flex-1 overflow-hidden">
										<div class="font-heading truncate text-xs font-bold">{artist.name}</div>
										<div class="truncate font-mono text-[10px] text-[#a1a1aa]">
											Singer / Artist
										</div>
									</div>
									<span
										class="rounded border border-[#581c87] bg-[#2d1b4e] px-1.5 py-0.5 text-[9px] font-bold text-[#a855f7]"
									>
										ARTIST
									</span>
								</button>
							{/each}
						</div>
					{/if}

					<!-- Composers Group -->
					{#if suggestions.composers.length > 0}
						<div>
							<div
								class="mb-1 flex items-center gap-1.5 border-b border-[#2e2e2e] px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#f59e0b] uppercase"
							>
								<span>🎼</span> Composers ({suggestions.composers.length})
							</div>
							{#each suggestions.composers as composer, idx}
								{@const flatIdx = suggestions.songs.length + suggestions.artists.length + idx}
								<button
									type="button"
									onmousedown={() => handleSelect({ ...composer, label: 'Composer' })}
									class="flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-colors
									{selectedIndex === flatIdx ? 'bg-[#3b2d12] text-[#f59e0b]' : 'text-white hover:bg-[#262626]'}"
								>
									<EntityIcon type="composer" class="h-8 w-8 shrink-0" />
									<div class="flex-1 overflow-hidden">
										<div class="font-heading truncate text-xs font-bold">{composer.name}</div>
										<div class="truncate font-mono text-[10px] text-[#a1a1aa]">Composer</div>
									</div>
									<span
										class="rounded border border-[#78350f] bg-[#3b2d12] px-1.5 py-0.5 text-[9px] font-bold text-[#f59e0b]"
									>
										COMPOSER
									</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<!-- Quick Suggestions when input is focused -->
				<div class="space-y-2 p-2 font-mono">
					<div class="px-2 text-[10px] font-bold tracking-wider text-[#71717a] uppercase">
						Popular Search Suggestions
					</div>
					<div class="flex flex-wrap gap-1.5">
						{#each presetSuggestions as preset}
							<button
								type="button"
								onmousedown={() => handleSelect(preset)}
								class="rounded border border-[#2e2e2e] bg-[#1e1e1e] px-2.5 py-1 text-xs text-[#a1a1aa] transition-colors hover:border-[#3ecf8e] hover:text-white"
							>
								{preset.name}
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
