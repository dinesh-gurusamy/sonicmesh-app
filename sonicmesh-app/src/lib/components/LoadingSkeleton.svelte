<script lang="ts">
	let { variant = 'card', count = 4 } = $props<{
		variant?: 'card' | 'detail' | 'stats' | 'list' | 'mesh' | 'dna';
		count?: number;
	}>();
</script>

{#if variant === 'card'}
	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
		{#each Array(count) as _}
			<div
				class="animate-pulse space-y-4 rounded-xl border border-[#2e2e2e] bg-[#171717] p-5 shadow-sm"
			>
				<div class="h-40 w-full rounded-lg bg-[#262626]"></div>
				<div class="h-4 w-3/4 rounded bg-[#262626]"></div>
				<div class="h-3 w-1/2 rounded bg-[#262626]"></div>
				<div class="flex gap-2 pt-2">
					<div class="h-5 w-14 rounded bg-[#262626]"></div>
					<div class="h-5 w-14 rounded bg-[#262626]"></div>
				</div>
			</div>
		{/each}
	</div>
{:else if variant === 'detail'}
	<div class="animate-pulse space-y-6 font-mono">
		<div class="flex flex-col md:flex-row items-center gap-8 rounded-xl border border-[#2e2e2e] bg-[#171717] p-6 sm:p-8">
			<div class="h-44 w-44 sm:h-48 sm:w-48 shrink-0 rounded-lg bg-[#262626]"></div>
			<div class="w-full space-y-3">
				<div class="flex gap-2">
					<div class="h-5 w-20 rounded bg-[#262626]"></div>
					<div class="h-5 w-24 rounded bg-[#262626]"></div>
				</div>
				<div class="h-8 w-2/3 rounded bg-[#262626]"></div>
				<div class="h-5 w-1/3 rounded bg-[#262626]"></div>
				<div class="flex gap-3 pt-2">
					<div class="h-9 w-32 rounded bg-[#262626]"></div>
					<div class="h-9 w-40 rounded bg-[#262626]"></div>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div class="h-36 rounded-lg border border-[#2e2e2e] bg-[#171717] p-4 space-y-3">
				<div class="h-4 w-1/2 rounded bg-[#262626]"></div>
				<div class="h-8 w-full rounded bg-[#262626]"></div>
				<div class="h-8 w-full rounded bg-[#262626]"></div>
			</div>
			<div class="h-36 rounded-lg border border-[#2e2e2e] bg-[#171717] p-4 space-y-3">
				<div class="h-4 w-1/2 rounded bg-[#262626]"></div>
				<div class="h-6 w-3/4 rounded bg-[#262626]"></div>
				<div class="h-6 w-2/3 rounded bg-[#262626]"></div>
			</div>
			<div class="h-36 rounded-lg border border-[#2e2e2e] bg-[#171717] p-4 space-y-3">
				<div class="h-4 w-1/2 rounded bg-[#262626]"></div>
				<div class="h-12 w-full rounded bg-[#262626]"></div>
			</div>
		</div>
	</div>
{:else if variant === 'stats'}
	<div class="grid grid-cols-2 gap-4 md:grid-cols-4 font-mono">
		{#each Array(4) as _}
			<div
				class="animate-pulse space-y-3 rounded-lg border border-[#2e2e2e] bg-[#171717] p-4 shadow-sm"
			>
				<div class="h-3 w-1/2 rounded bg-[#262626]"></div>
				<div class="h-7 w-1/3 rounded bg-[#262626]"></div>
				<div class="h-2.5 w-2/3 rounded bg-[#262626]"></div>
			</div>
		{/each}
	</div>
{:else if variant === 'list'}
	<div class="space-y-4 font-mono">
		{#each Array(count) as _}
			<div
				class="flex animate-pulse items-center justify-between gap-4 rounded-xl border border-[#2e2e2e] bg-[#171717] p-6 shadow-sm"
			>
				<div class="flex w-full items-center gap-4">
					<div class="h-16 w-16 shrink-0 rounded-lg bg-[#262626]"></div>
					<div class="w-full max-w-md space-y-2">
						<div class="h-4 w-1/2 rounded bg-[#262626]"></div>
						<div class="h-3 w-1/3 rounded bg-[#262626]"></div>
						<div class="h-3 w-3/4 rounded bg-[#262626]"></div>
					</div>
				</div>
			</div>
		{/each}
	</div>
{:else if variant === 'mesh'}
	<div
		class="relative flex h-[480px] w-full animate-pulse flex-col justify-between overflow-hidden rounded-xl border border-[#2e2e2e] bg-[#121212] p-8"
	>
		<div class="flex items-center justify-between">
			<div class="h-6 w-1/4 rounded bg-[#262626]"></div>
			<div class="h-8 w-1/3 rounded-lg bg-[#262626]"></div>
		</div>
		<div class="flex items-center justify-center space-x-12">
			<div class="h-20 w-20 rounded-full bg-[#262626]"></div>
			<div class="h-28 w-28 rounded-full border border-[#2b5940] bg-[#1c392b]"></div>
			<div class="h-20 w-20 rounded-full bg-[#262626]"></div>
		</div>
		<div class="mx-auto h-4 w-1/2 rounded bg-[#262626]"></div>
	</div>
{:else if variant === 'dna'}
	<div class="animate-pulse space-y-5 rounded-xl border border-[#2e2e2e] bg-[#171717] p-6 shadow-md sm:p-8 font-mono">
		<div class="flex items-center justify-between border-b border-[#2e2e2e] pb-4">
			<div class="h-6 w-1/4 rounded bg-[#262626]"></div>
			<div class="h-4 w-1/6 rounded bg-[#262626]"></div>
		</div>
		<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
			<div class="h-36 space-y-3 rounded-lg bg-[#1e1e1e] p-4">
				<div class="h-4 w-1/2 rounded bg-[#262626]"></div>
				<div class="h-3 w-3/4 rounded bg-[#262626]"></div>
				<div class="h-3 w-2/3 rounded bg-[#262626]"></div>
			</div>
			<div class="h-36 space-y-3 rounded-lg bg-[#1e1e1e] p-4">
				<div class="h-4 w-1/2 rounded bg-[#262626]"></div>
				<div class="h-3 w-3/4 rounded bg-[#262626]"></div>
				<div class="h-3 w-2/3 rounded bg-[#262626]"></div>
			</div>
			<div class="h-36 space-y-3 rounded-lg bg-[#1e1e1e] p-4">
				<div class="h-4 w-1/2 rounded bg-[#262626]"></div>
				<div class="h-3 w-3/4 rounded bg-[#262626]"></div>
				<div class="h-3 w-2/3 rounded bg-[#262626]"></div>
			</div>
		</div>
	</div>
{/if}
