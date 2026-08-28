<script lang="ts">
	let { variant = 'card', count = 4 } = $props<{
		variant?: 'card' | 'detail' | 'stats' | 'list' | 'mesh';
		count?: number;
	}>();
</script>

{#if variant === 'card'}
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
		{#each Array(count) as _}
			<div class="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm animate-pulse">
				<div class="w-full h-40 bg-slate-200 rounded-xl"></div>
				<div class="h-4 bg-slate-200 rounded w-3/4"></div>
				<div class="h-3 bg-slate-200 rounded w-1/2"></div>
				<div class="flex gap-2 pt-2">
					<div class="h-5 bg-slate-200 rounded-full w-14"></div>
					<div class="h-5 bg-slate-200 rounded-full w-14"></div>
				</div>
			</div>
		{/each}
	</div>
{:else if variant === 'stats'}
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		{#each Array(4) as _}
			<div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 animate-pulse">
				<div class="h-3 bg-slate-200 rounded w-1/2"></div>
				<div class="h-8 bg-slate-200 rounded w-1/3"></div>
				<div class="h-2.5 bg-slate-200 rounded w-2/3"></div>
			</div>
		{/each}
	</div>
{:else if variant === 'list'}
	<div class="space-y-4">
		{#each Array(count) as _}
			<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4 animate-pulse">
				<div class="flex items-center gap-4 w-full">
					<div class="w-16 h-16 bg-slate-200 rounded-xl shrink-0"></div>
					<div class="space-y-2 w-full max-w-md">
						<div class="h-4 bg-slate-200 rounded w-1/2"></div>
						<div class="h-3 bg-slate-200 rounded w-1/3"></div>
						<div class="h-3 bg-slate-200 rounded w-3/4"></div>
					</div>
				</div>
			</div>
		{/each}
	</div>
{:else if variant === 'mesh'}
	<div class="w-full h-[480px] bg-slate-900/90 rounded-3xl border border-slate-800 p-8 flex flex-col justify-between animate-pulse relative overflow-hidden">
		<div class="flex items-center justify-between">
			<div class="h-6 bg-slate-800 rounded w-1/4"></div>
			<div class="h-8 bg-slate-800 rounded-xl w-1/3"></div>
		</div>
		<div class="flex items-center justify-center space-x-12">
			<div class="w-20 h-20 bg-slate-800 rounded-full"></div>
			<div class="w-28 h-28 bg-indigo-950/60 border border-indigo-800/40 rounded-full"></div>
			<div class="w-20 h-20 bg-slate-800 rounded-full"></div>
		</div>
		<div class="h-4 bg-slate-800 rounded w-1/2 mx-auto"></div>
	</div>
{/if}
