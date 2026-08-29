<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import EntityIcon from '$lib/components/EntityIcon.svelte';
	import LoadingSkeleton from '$lib/components/LoadingSkeleton.svelte';

	let { data } = $props();

	let fromInput = $state('');
	let toInput = $state('');

	let connectionResult = $state<{
		found: boolean;
		nodes: Array<{ id: string; label: string; name: string; image: string }>;
		relationships: string[];
	} | null>(null);

	let isLoading = $state(false);
	let errorMsg = $state('');

	async function loadConnection(from: string, to: string) {
		if (!from.trim() || !to.trim()) {
			connectionResult = null;
			return;
		}

		isLoading = true;
		errorMsg = '';
		try {
			const res = await fetch(
				`/api/connect?from=${encodeURIComponent(from.trim())}&to=${encodeURIComponent(to.trim())}`
			);
			if (res.ok) {
				const json = await res.json();
				connectionResult = json.connection;
			} else {
				errorMsg = 'Unable to fetch connection. Please check your network or try again.';
			}
		} catch (err) {
			console.error('Fetch connection error:', err);
			errorMsg = 'Database connection failed. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	$effect(() => {
		const from = page.url.searchParams.get('from') || data.startQuery || 'Vaseegara';
		const to = page.url.searchParams.get('to') || data.endQuery || 'Munbe Vaa';
		fromInput = from;
		toInput = to;
		loadConnection(from, to);
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (fromInput.trim() && toInput.trim()) {
			goto(`/connect?from=${encodeURIComponent(fromInput.trim())}&to=${encodeURIComponent(toInput.trim())}`);
		}
	}

	function applyPreset(from: string, to: string) {
		fromInput = from;
		toInput = to;
		goto(`/connect?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
	}

	const presets = [
		{ from: 'Vaseegara', to: 'Munbe Vaa', label: 'Vaseegara ➔ Munbe Vaa' },
		{ from: 'Naatu Naatu', to: 'M. M. Keeravani', label: 'Naatu Naatu ➔ M. M. Keeravani' },
		{ from: 'Harris Jayaraj', to: 'A. R. Rahman', label: 'Harris Jayaraj ➔ A. R. Rahman' },
		{ from: 'Sid Sriram', to: 'Shreya Ghoshal', label: 'Sid Sriram ➔ Shreya Ghoshal' }
	];

	function formatRel(rel: string) {
		switch (rel) {
			case 'PERFORMED':
				return 'Performed By';
			case 'COMPOSED':
				return 'Composed By';
			case 'WROTE':
				return 'Wrote Lyrics';
			case 'PART_OF':
				return 'Part of Album';
			case 'HAS_GENRE':
				return 'Shared Genre';
			case 'HAS_MOOD':
				return 'Shared Mood';
			case 'IN_LANGUAGE':
				return 'Shared Language';
			case 'FEATURES':
				return 'Features Instrument';
			case 'LIKES':
				return 'Liked By';
			default:
				return rel;
		}
	}

	function mapLabelToType(label: string): 'song' | 'artist' | 'composer' | 'album' {
		const l = (label || '').toLowerCase();
		if (l === 'artist') return 'artist';
		if (l === 'composer') return 'composer';
		if (l === 'album') return 'album';
		return 'song';
	}
</script>

<svelte:head>
	<title>Graph Connection Pathfinder - SonicMesh</title>
	<meta name="description" content="Find the shortest relationship path between any two songs, performers, or composers in the music graph." />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
	<!-- Page Header -->
	<div class="border-b border-[#2e2e2e] pb-6">
		<div class="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-[#3ecf8e]">
			<span class="inline-block h-2 w-2 rounded-full bg-[#3ecf8e] animate-pulse"></span>
			Graph Pathfinder Engine
		</div>
		<h1 class="font-heading mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
			Find Relationship Connection
		</h1>
		<p class="mt-2 text-sm text-[#a1a1aa] max-w-3xl">
			Discover how any two songs, singers, or composers are interconnected across degrees of separation.
		</p>
	</div>

	<!-- Pathfinder Form & Presets -->
	<div class="rounded-xl border border-[#2e2e2e] bg-[#141414] p-6 shadow-xl space-y-6">
		<form onsubmit={handleSubmit} class="grid gap-4 sm:grid-cols-12 items-end">
			<div class="sm:col-span-5 space-y-2">
				<label for="from-input" class="block text-xs font-medium uppercase tracking-wide text-[#a1a1aa]">
					Start Entity (Song / Performer / Composer)
				</label>
				<input
					id="from-input"
					type="text"
					bind:value={fromInput}
					placeholder="e.g. Vaseegara or Harris Jayaraj"
					class="w-full rounded-lg border border-[#2e2e2e] bg-[#1a1a1a] px-4 py-3 text-sm text-white placeholder-[#71717a] focus:border-[#3ecf8e] focus:outline-none focus:ring-1 focus:ring-[#3ecf8e] transition-colors"
				/>
			</div>

			<div class="sm:col-span-5 space-y-2">
				<label for="to-input" class="block text-xs font-medium uppercase tracking-wide text-[#a1a1aa]">
					Target Entity (Song / Performer / Composer)
				</label>
				<input
					id="to-input"
					type="text"
					bind:value={toInput}
					placeholder="e.g. Munbe Vaa or A. R. Rahman"
					class="w-full rounded-lg border border-[#2e2e2e] bg-[#1a1a1a] px-4 py-3 text-sm text-white placeholder-[#71717a] focus:border-[#3ecf8e] focus:outline-none focus:ring-1 focus:ring-[#3ecf8e] transition-colors"
				/>
			</div>

			<div class="sm:col-span-2">
				<button
					type="submit"
					class="w-full rounded-lg bg-[#3ecf8e] px-5 py-3 text-center text-sm font-semibold text-black hover:bg-[#34b87c] focus:outline-none focus:ring-2 focus:ring-[#3ecf8e] transition-all shadow-lg active:scale-95"
				>
					Find Path ➔
				</button>
			</div>
		</form>

		<!-- Quick Presets -->
		<div class="flex flex-wrap items-center gap-2 border-t border-[#2e2e2e] pt-4 text-xs">
			<span class="font-medium text-[#71717a]">Guaranteed Connection Presets:</span>
			{#each presets as p}
				<button
					type="button"
					onclick={() => applyPreset(p.from, p.to)}
					class="rounded-md border border-[#2e2e2e] bg-[#1a1a1a] px-3 py-1.5 text-xs text-[#3ecf8e] transition-colors hover:border-[#3ecf8e] hover:bg-[#222]"
				>
					{p.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Results Display Section -->
	{#if isLoading}
		<div class="space-y-4 rounded-xl border border-[#2e2e2e] bg-[#141414] p-8">
			<div class="flex items-center gap-3 text-sm text-[#3ecf8e]">
				<svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
				</svg>
				Calculating shortest graph relationship path...
			</div>
			<LoadingSkeleton variant="list" />
		</div>
	{:else if errorMsg}
		<div class="rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-red-400 text-sm">
			{errorMsg}
		</div>
	{:else if connectionResult}
		{#if connectionResult.found && connectionResult.nodes.length > 0}
			<div class="rounded-xl border border-[#2e2e2e] bg-[#141414] p-6 space-y-6">
				<!-- Path Summary Header -->
				<div class="flex flex-wrap items-center justify-between gap-4 border-b border-[#2e2e2e] pb-4">
					<div>
						<h2 class="text-lg font-bold text-white">Connection Path Found</h2>
						<p class="text-xs text-[#a1a1aa]">
							Connecting <span class="text-[#3ecf8e] font-semibold">{fromInput}</span> to <span class="text-[#3ecf8e] font-semibold">{toInput}</span>
						</p>
					</div>
					<div class="flex items-center gap-2">
						<span class="rounded-full bg-[#3ecf8e]/10 px-3 py-1 text-xs font-semibold text-[#3ecf8e] border border-[#3ecf8e]/30">
							{connectionResult.relationships.length}-Hop Path
						</span>
						<span class="rounded-full bg-[#262626] px-3 py-1 text-xs font-medium text-[#a1a1aa]">
							{connectionResult.nodes.length} Connected Nodes
						</span>
					</div>
				</div>

				<!-- Visual Connection Chain Flow -->
				<div class="py-4">
					<div class="flex flex-col md:flex-row items-center justify-center gap-4 overflow-x-auto pb-4">
						{#each connectionResult.nodes as node, idx}
							<!-- Node Card -->
							<div class="flex flex-col items-center text-center p-4 rounded-xl bg-[#1a1a1a] border border-[#2e2e2e] hover:border-[#3ecf8e]/50 transition-all min-w-[160px]">
								{#if node.image}
									<img
										src={node.image}
										alt={node.name}
										class="h-16 w-16 rounded-full object-cover border-2 stroke-neutral-700 shadow-md mb-2"
										onerror={(e) => {
											(e.target as HTMLElement).style.display = 'none';
										}}
									/>
								{:else}
									<div class="h-16 w-16 mb-2">
										<EntityIcon type={mapLabelToType(node.label)} class="h-full w-full" />
									</div>
								{/if}
								
								<span class="text-[10px] uppercase font-bold text-[#3ecf8e] px-2 py-0.5 rounded bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 mb-1">
									{node.label}
								</span>
								<span class="text-sm font-semibold text-white max-w-[140px] truncate" title={node.name}>
									{node.name}
								</span>
							</div>

							<!-- Relationship Connector Arrow -->
							{#if idx < connectionResult.relationships.length}
								<div class="flex flex-col items-center justify-center py-2 md:py-0 px-2 text-center shrink-0">
									<span class="text-[11px] font-semibold text-[#a1a1aa] bg-[#222] px-2.5 py-1 rounded-full border border-[#333] shadow">
										{formatRel(connectionResult.relationships[idx])}
									</span>
									<div class="text-[#3ecf8e] text-lg font-bold mt-1">
										<span class="hidden md:inline">➔</span>
										<span class="inline md:hidden">↓</span>
									</div>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			</div>
		{:else}
			<div class="rounded-xl border border-[#2e2e2e] bg-[#141414] p-12 text-center space-y-4">
				<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#262626] text-2xl">
					🔍
				</div>
				<h2 class="text-xl font-bold text-white">No Path Found</h2>
				<p class="text-sm text-[#a1a1aa] max-w-md mx-auto">
					No direct relationship path within 5 hops was found between <span class="text-white font-semibold">"{fromInput}"</span> and <span class="text-white font-semibold">"{toInput}"</span>.
				</p>
				<div class="pt-2">
					<p class="text-xs text-[#71717a] mb-3">Try one of our guaranteed connection presets:</p>
					<div class="flex flex-wrap justify-center gap-2">
						{#each presets as p}
							<button
								type="button"
								onclick={() => applyPreset(p.from, p.to)}
								class="rounded-md border border-[#2e2e2e] bg-[#1a1a1a] px-3 py-1.5 text-xs text-[#3ecf8e] transition-colors hover:border-[#3ecf8e]"
							>
								{p.label}
							</button>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>
