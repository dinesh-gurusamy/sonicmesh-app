<script lang="ts">
	import { browser } from '$app/environment';
	import LoadingSkeleton from '$lib/components/LoadingSkeleton.svelte';

	let { data } = $props();

	let fromInput = $state('');
	let toInput = $state('');

	$effect(() => {
		fromInput = data.startQuery || '';
		toInput = data.endQuery || '';
	});

	async function getConnection(from: string, to: string) {
		if (!browser || !from || !to) return { connection: null };
		const res = await fetch(
			`/api/connect?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
		);
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

<svelte:head>
	<title>Find Graph Path — SonicMesh Studio</title>
</svelte:head>

<div class="mx-auto max-w-4xl space-y-8 py-2 font-mono">
	<!-- Header -->
	<div class="space-y-2 border-b border-[#2e2e2e] pb-6">
		<div class="text-xs font-semibold uppercase tracking-wider text-[#3ecf8e]">
			Degrees of Separation
		</div>
		<h1 class="font-heading text-3xl font-extrabold text-white sm:text-4xl">Find Connection Path</h1>
		<p class="text-xs text-[#a1a1aa] font-sans">
			Select any two songs, performers, or composers to discover their multi-hop Cypher traversal path.
		</p>
	</div>

	<!-- Query Inputs Form -->
	<form
		method="GET"
		action="/connect"
		class="space-y-6 rounded-xl border border-[#2e2e2e] bg-[#171717] p-6 shadow-md sm:p-8"
	>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<div>
				<label for="from" class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#a1a1aa]">
					Start Node *
				</label>
				<input
					type="text"
					id="from"
					name="from"
					required
					bind:value={fromInput}
					placeholder="e.g. Vathi Coming"
					class="sb-input w-full px-4 py-2.5 text-xs font-mono"
				/>
			</div>

			<div>
				<label for="to" class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#a1a1aa]">
					Target Node *
				</label>
				<input
					type="text"
					id="to"
					name="to"
					required
					bind:value={toInput}
					placeholder="e.g. Kesariya"
					class="sb-input w-full px-4 py-2.5 text-xs font-mono"
				/>
			</div>
		</div>

		<!-- Quick Presets -->
		<div class="flex flex-wrap items-center gap-2 border-t border-[#2e2e2e] pt-4 text-xs">
			<span class="text-[#71717a]">Presets:</span>
			{#each QUICK_PRESETS as p}
				<a
					href="/connect?from={encodeURIComponent(p.from)}&to={encodeURIComponent(p.to)}"
					class="rounded bg-[#1e1e1e] border border-[#2e2e2e] px-2.5 py-1 text-xs text-[#3ecf8e] hover:border-[#3ecf8e] transition-colors"
				>
					{p.label}
				</a>
			{/each}
		</div>

		<div class="flex justify-end pt-2">
			<button
				type="submit"
				class="sb-btn-primary px-6 py-2.5 text-xs font-mono font-semibold cursor-pointer"
			>
				Trace Shortest Path ➔
			</button>
		</div>
	</form>

	<!-- Traversal Results with {#await} block -->
	{#if data.startQuery && data.endQuery}
		<section class="space-y-4">
			<h2 class="font-heading text-xl font-bold text-white">
				Path: <span class="text-[#3ecf8e]">{data.startQuery}</span> ➔
				<span class="text-[#a855f7]">{data.endQuery}</span>
			</h2>

			{#await connectionPromise}
				<LoadingSkeleton variant="list" count={1} />
			{:then payload}
				{#if !payload.connection || !payload.connection.nodes.length}
					<div
						class="rounded-lg border border-dashed border-[#2e2e2e] bg-[#171717] p-8 text-center text-xs text-[#a1a1aa]"
					>
						No direct connection path found within 5 hops. Try another pair of songs or artists!
					</div>
				{:else}
					<div class="space-y-6 rounded-xl border border-[#2e2e2e] bg-[#171717] p-6 shadow-md">
						<div class="text-xs font-bold uppercase text-[#3ecf8e]">
							⚡ Connected via {payload.connection.nodes.length} Nodes ({payload.connection.relationships.length} Hops)
						</div>

						<div class="flex flex-wrap items-center gap-3">
							{#each payload.connection.nodes as node, idx}
								<div class="flex items-center gap-3">
									<div
										class="flex items-center gap-3 rounded-md border border-[#2e2e2e] bg-[#1e1e1e] p-3 shadow-xs"
									>
										{#if node.image}
											<img
												src={node.image}
												alt={node.name}
												class="h-10 w-10 shrink-0 rounded-md object-cover border border-[#2e2e2e]"
											/>
										{:else}
											<div
												class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#1c392b] text-xs font-bold text-[#3ecf8e]"
											>
												{node.name.substring(0, 2).toUpperCase()}
											</div>
										{/if}
										<div>
											<div class="text-xs font-bold text-white font-heading">{node.name}</div>
											<div class="text-[10px] font-bold uppercase text-[#3ecf8e]">{node.label} Node</div>
										</div>
									</div>

									{#if idx < payload.connection.relationships.length}
										<div class="flex flex-col items-center">
											<span class="rounded bg-[#121212] border border-[#f59e0b]/40 px-2 py-0.5 text-[10px] font-bold text-[#f59e0b]">
												:{payload.connection.relationships[idx]}
											</span>
											<span class="text-[#71717a] text-base">➔</span>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}
			{:catch error}
				<div class="rounded-lg border border-[#2e2e2e] bg-[#171717] p-8 text-center text-xs text-[#a1a1aa]">
					Failed to trace connection path.
				</div>
			{/await}
		</section>
	{/if}
</div>
