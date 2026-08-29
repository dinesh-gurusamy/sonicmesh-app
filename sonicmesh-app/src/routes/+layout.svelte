<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import SearchAutocomplete from '$lib/components/SearchAutocomplete.svelte';

	let { data, children } = $props();

	let isMobileSidebarOpen = $state(false);
</script>

<!-- App Shell Layout Container -->
<div
	class="min-h-screen bg-[#121212] font-sans text-slate-100 selection:bg-[#3ecf8e] selection:text-[#062317]"
>
	<!-- Top Navigation Bar (Full Width) -->
	<header
		class="sticky top-0 z-40 w-full border-b border-[#2e2e2e] bg-[#171717]/90 backdrop-blur-md"
	>
		<div class="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
			<!-- Mobile Hamburger Button -->
			<button
				onclick={() => (isMobileSidebarOpen = !isMobileSidebarOpen)}
				class="rounded-lg border border-[#2e2e2e] bg-[#1e1e1e] p-2 text-[#a1a1aa] hover:text-white lg:hidden"
				aria-label="Toggle navigation menu"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h16"
					/>
				</svg>
			</button>

			<!-- Brand Logo Header Link -->
			<a href="/" class="flex items-center gap-3">
				<div
					class="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#3ecf8e] to-[#059669] font-mono text-base font-extrabold text-[#062317] shadow-md shadow-[#3ecf8e]/20"
				>
					SM
				</div>
				<div class="flex flex-col">
					<span
						class="font-heading flex items-center gap-1.5 text-lg font-bold tracking-tight text-white"
					>
						Sonic<span class="text-[#3ecf8e]">Mesh</span>
						<span
							class="rounded border border-[#333] bg-[#262626] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[#a1a1aa] uppercase"
							>Studio</span
						>
					</span>
					<span class="font-mono text-[10px] tracking-wider text-[#a1a1aa] uppercase"
						>Music Mesh</span
					>
				</div>
			</a>

			<!-- Quick Global Autocomplete Search Input (Desktop Header) -->
			<div class="hidden max-w-md flex-1 px-8 sm:block">
				<SearchAutocomplete
					actionUrl="/catalog"
					placeholder="Global music search..."
					showSubmitButton={false}
					size="sm"
				/>
			</div>

			<!-- Quick Header Action Buttons -->
			<div class="flex items-center gap-3">
				<a
					href="/liked-connections"
					class="sb-btn-secondary hidden items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-semibold sm:flex"
				>
					♥ Liked Mesh
				</a>
				<a
					href="/add-song"
					class="sb-btn-primary flex items-center gap-1.5 px-3.5 py-1.5 font-mono text-xs font-semibold"
				>
					+ Add Track
				</a>
			</div>
		</div>
	</header>

	<!-- Mobile Drawer Backdrop Overlay -->
	{#if isMobileSidebarOpen}
		<button
			onclick={() => (isMobileSidebarOpen = false)}
			class="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
			aria-label="Close mobile sidebar overlay"
		></button>
	{/if}

	<!-- Main Body Layout Grid (Full Width Container attaching sidebar to left edge) -->
	<div class="flex min-h-[calc(100vh-4rem)] w-full">
		<!-- Sidebar Navigation (Flush Attached to Far Left of Screen) -->
		<aside
			class="fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col justify-between border-r border-[#2e2e2e] bg-[#171717] p-5 shadow-xl transition-transform duration-300 lg:sticky lg:top-16 lg:z-0 lg:h-[calc(100vh-4rem)] lg:shadow-none
			{isMobileSidebarOpen ? 'translate-x-0' : 'max-lg:-translate-x-full'}"
		>
			<div class="space-y-6">
				<!-- Brand Header in Mobile Sidebar -->
				<div class="flex items-center justify-between border-b border-[#2e2e2e] pb-4 lg:hidden">
					<div class="flex items-center gap-2">
						<div
							class="flex h-7 w-7 items-center justify-center rounded bg-[#3ecf8e] font-mono text-xs font-bold text-[#062317]"
						>
							SM
						</div>
						<span class="font-heading font-bold text-white">SonicMesh</span>
					</div>
					<button
						onclick={() => (isMobileSidebarOpen = false)}
						class="rounded p-1 text-[#a1a1aa] hover:text-white"
					>
						✕
					</button>
				</div>

				<div class="font-mono text-[10px] font-bold tracking-wider text-[#71717a] uppercase">
					Navigation Menu
				</div>

				<nav class="space-y-1 font-mono text-xs">
					<a
						href="/"
						onclick={() => (isMobileSidebarOpen = false)}
						class="flex items-center gap-3 rounded-md px-3.5 py-2.5 font-semibold transition-all
						{page.url.pathname === '/'
							? 'border border-[#2b5940] bg-[#1c392b] text-[#3ecf8e]'
							: 'text-[#a1a1aa] hover:bg-[#1e1e1e] hover:text-white'}"
					>
						<svg
							class="h-4 w-4 {page.url.pathname === '/' ? 'text-[#3ecf8e]' : 'text-[#71717a]'}"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
							/>
						</svg>
						Catalog Overview
					</a>

					<a
						href="/catalog"
						onclick={() => (isMobileSidebarOpen = false)}
						class="flex items-center gap-3 rounded-md px-3.5 py-2.5 font-semibold transition-all
						{page.url.pathname === '/catalog'
							? 'border border-[#2b5940] bg-[#1c392b] text-[#3ecf8e]'
							: 'text-[#a1a1aa] hover:bg-[#1e1e1e] hover:text-white'}"
					>
						<svg
							class="h-4 w-4 {page.url.pathname === '/catalog'
								? 'text-[#3ecf8e]'
								: 'text-[#71717a]'}"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 .895-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 .895-2 3-2 3 .895 3 2zM9 10l12-3"
							/>
						</svg>
						Songs Catalog
					</a>

					<a
						href="/liked-connections"
						onclick={() => (isMobileSidebarOpen = false)}
						class="flex items-center gap-3 rounded-md px-3.5 py-2.5 font-semibold transition-all
						{page.url.pathname === '/liked-connections'
							? 'border border-[#2b5940] bg-[#1c392b] text-[#3ecf8e]'
							: 'text-[#a1a1aa] hover:bg-[#1e1e1e] hover:text-white'}"
					>
						<svg
							class="h-4 w-4 fill-current text-rose-500"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
							/>
						</svg>
						Liked Connections
					</a>

					<a
						href="/recommendations"
						onclick={() => (isMobileSidebarOpen = false)}
						class="flex items-center gap-3 rounded-md px-3.5 py-2.5 font-semibold transition-all
						{page.url.pathname === '/recommendations'
							? 'border border-[#2b5940] bg-[#1c392b] text-[#3ecf8e]'
							: 'text-[#a1a1aa] hover:bg-[#1e1e1e] hover:text-white'}"
					>
						<svg
							class="h-4 w-4 {page.url.pathname === '/recommendations'
								? 'text-[#3ecf8e]'
								: 'text-[#71717a]'}"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>
						Recommendations
					</a>

					<a
						href="/connect"
						onclick={() => (isMobileSidebarOpen = false)}
						class="flex items-center gap-3 rounded-md px-3.5 py-2.5 font-semibold transition-all
						{page.url.pathname === '/connect'
							? 'border border-[#2b5940] bg-[#1c392b] text-[#3ecf8e]'
							: 'text-[#a1a1aa] hover:bg-[#1e1e1e] hover:text-white'}"
					>
						<svg
							class="h-4 w-4 {page.url.pathname === '/connect'
								? 'text-[#3ecf8e]'
								: 'text-[#71717a]'}"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
							/>
						</svg>
						Find Connection Path
					</a>
				</nav>
			</div>

			<!-- Lower Portion: Status & System Badge -->
			<div class="space-y-3 border-t border-[#2e2e2e] pt-4 font-mono">
				<div
					class="flex items-center gap-2.5 rounded-md border border-[#2e2e2e] bg-[#1e1e1e] px-3 py-2 text-xs"
				>
					<span
						class="h-2.5 w-2.5 shrink-0 rounded-full {data?.dbConnected
							? 'animate-pulse bg-[#3ecf8e] shadow-xs shadow-[#3ecf8e]'
							: 'bg-rose-500'}"
					></span>
					<div class="flex flex-col">
						<span class="font-mono text-[11px] leading-tight font-bold text-white">
							{data?.dbConnected ? 'Database Connected' : 'Offline'}
						</span>
						<span class="font-mono text-[9px] text-[#a1a1aa]">SonicMesh Engine</span>
					</div>
				</div>

				<div class="flex items-center justify-between px-1 font-mono text-[10px] text-[#71717a]">
					<span>SonicMesh Studio</span>
					<span class="text-[#3ecf8e]">v0.0.1</span>
				</div>
			</div>
		</aside>

		<!-- Main Body Content Container (Fills remaining horizontal space smoothly) -->
		<div class="min-w-0 flex-1">
			<main class="mx-auto w-full max-w-7xl px-6 py-8 font-sans sm:px-8 lg:px-12">
				{@render children()}
			</main>
		</div>
	</div>
</div>
