<script lang="ts">
	import LoadingSkeleton from '$lib/components/LoadingSkeleton.svelte';

	let { data } = $props();

	let fromInput = $state('');
	let toInput = $state('');

	$effect(() => {
		fromInput = data.startQuery || '';
		toInput = data.endQuery || '';
	});

	async function getConnection(from: string, to: string) {
		if (!from || !to) return { connection: null };
		const res = await fetch(`/api/connect?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
		if (!res.ok) throw new Error('Failed to fetch connection');
		return await res.json();
	}

	let connectionPromise = $derived(getConnection(data.startQuery || '', data.endQuery || ''));

	const QUICK_PRESETS = [
		{ from: 'Vathi Coming', to: 'Kesariya', label: 'Vathi Coming ➔ Kesariya' },
		{ from: 'A.R. Rahman', to: 'Ed Sheeran', label: 'A.R. Rahman ➔ Ed Sheeran' },
		{ from: 'Arabic Kuthu', to: 'Kun Faya Kun', label: 'Arabic Kuthu ➔ Kun Faya Kun' }
	];
</script>

<div class="space-y-8 py-2 max-w-4xl mx-auto">
	<!-- Header -->
	<div class="space-y-2">
		<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
			Artist & Song Paths
		</div>
		<h1 class="text-3xl font-extrabold text-slate-900 font-heading">Find Connection Path</h1>
		<p class="text-xs sm:text-sm text-slate-600">
			Pick any two songs, artists, or composers to discover how they link through shared creators or genres.
		</p>
	</div>

	<!-- Query Inputs Form -->
	<form method="GET" action="/connect" class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-6 shadow-md">
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label for="from" class="block text-xs font-bold text-slate-700 mb-1">Start Track or Artist *</label>
				<input
					type="text"
					id="from"
					name="from"
					required
					bind:value={fromInput}
					placeholder="e.g. Vathi Coming"
					class="w-full px-4 py-3 rounded-xl glass-input text-sm font-medium focus:ring-2 focus:ring-indigo-500"
				/>
			</div>

			<div>
				<label for="to" class="block text-xs font-bold text-slate-700 mb-1">Target Track or Artist *</label>
				<input
					type="text"
					id="to"
					name="to"
					required
					bind:value={toInput}
					placeholder="e.g. Kesariya"
					class="w-full px-4 py-3 rounded-xl glass-input text-sm font-medium focus:ring-2 focus:ring-indigo-500"
				/>
			</div>
		</div>

		<!-- Quick Presets -->
		<div class="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
			<span class="text-xs text-slate-500 font-medium">Try example:</span>
			{#each QUICK_PRESETS as p}
				<a
					href="/connect?from={encodeURIComponent(p.from)}&to={encodeURIComponent(p.to)}"
					class="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 hover:border-indigo-300 text-xs font-bold text-indigo-700 transition-colors"
				>
					{p.label}
				</a>
			{/each}
		</div>

		<div class="flex justify-end pt-2">
			<button
				type="submit"
				class="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all hover:scale-[1.01]"
			>
				Find Connection Path ➔
			</button>
		</div>
	</form>

	<!-- Traversal Results with {#await} block -->
	{#if data.startQuery && data.endQuery}
		<section class="space-y-4">
			<h2 class="text-xl font-bold text-slate-900 font-heading">
				Path: <span class="text-indigo-600">{data.startQuery}</span> ➔ <span class="text-purple-600">{data.endQuery}</span>
			</h2>

			{#await connectionPromise}
				<LoadingSkeleton variant="list" count={1} />
			{:then payload}
				{#if !payload.connection || !payload.connection.nodes.length}
					<div class="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-500 text-sm">
						No direct connection found between these two items. Try another pair of songs or artists!
					</div>
				{:else}
					<div class="bg-white p-8 rounded-3xl border border-slate-200 space-y-6 shadow-md">
						<div class="text-xs font-mono text-slate-500 font-semibold">
							Connected via {payload.connection.nodes.length} Steps ({payload.connection.relationships.length} Hops)
						</div>

						<div class="flex flex-wrap items-center gap-3">
							{#each payload.connection.nodes as node, idx}
								<div class="flex items-center gap-3">
									<div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3 shadow-sm">
										{#if node.image}
											<img src={node.image} alt={node.name} class="w-10 h-10 rounded-xl object-cover shadow-sm shrink-0" />
										{:else}
											<div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
												{node.name.substring(0, 2).toUpperCase()}
											</div>
										{/if}
										<div>
											<div class="text-xs font-bold text-slate-900">{node.name}</div>
											<div class="text-[10px] text-indigo-600 font-bold uppercase">{node.label}</div>
										</div>
									</div>

									{#if idx < payload.connection.relationships.length}
										<div class="flex flex-col items-center">
											<span class="text-[10px] font-mono text-amber-800 font-bold px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
												:{payload.connection.relationships[idx]}
											</span>
											<span class="text-slate-400 text-lg">➔</span>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}
			{:catch error}
				<div class="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
					Failed to find connection path.
				</div>
			{/await}
		</section>
	{/if}
</div>
