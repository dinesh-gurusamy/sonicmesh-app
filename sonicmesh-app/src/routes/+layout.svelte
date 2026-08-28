<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';

	let { data, children } = $props();

	let isMobileSidebarOpen = $state(false);
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
	<title>SonicMesh Studio — Graph Database Explorer</title>
</svelte:head>

<div class="min-h-screen flex flex-col lg:flex-row bg-[#121212] text-[#ededed] font-body selection:bg-[#1c392b] selection:text-[#3ecf8e]">
	<!-- Mobile Top Header Bar -->
	<header class="lg:hidden sticky top-0 z-30 bg-[#171717]/95 backdrop-blur-md border-b border-[#2e2e2e] px-4 py-3 flex items-center justify-between shadow-sm">
		<a href="/" class="flex items-center gap-2.5">
			<div class="w-7 h-7 rounded-md bg-[#3ecf8e] text-[#062317] flex items-center justify-center font-mono font-bold text-sm shadow-sm">
				⚡
			</div>
			<span class="font-bold text-base tracking-tight font-heading text-white">
				Sonic<span class="text-[#3ecf8e]">Mesh</span>
				<span class="ml-1.5 px-1.5 py-0.5 rounded bg-[#262626] border border-[#333] text-[10px] font-mono text-[#a1a1aa]">Studio</span>
			</span>
		</a>

		<div class="flex items-center gap-3">
			<div class="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1c392b] border border-[#2b5940] text-[11px] font-mono font-semibold text-[#3ecf8e]">
				<span class="w-2 h-2 rounded-full {data.dbConnected ? 'bg-[#3ecf8e] animate-pulse' : 'bg-rose-500'}"></span>
				{data.dbConnected ? 'Graph Engine' : 'Offline'}
			</div>

			<button
				onclick={() => (isMobileSidebarOpen = !isMobileSidebarOpen)}
				class="p-2 rounded-md bg-[#1e1e1e] text-[#ededed] hover:bg-[#262626] border border-[#2e2e2e] transition-colors cursor-pointer"
				aria-label="Toggle Navigation Sidebar"
			>
				<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
				</svg>
			</button>
		</div>
	</header>

	<!-- Mobile Sidebar Overlay Backdrop -->
	{#if isMobileSidebarOpen}
		<div
			class="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
			onclick={() => (isMobileSidebarOpen = false)}
			role="button"
			tabindex="0"
			onkeydown={(e) => e.key === 'Escape' && (isMobileSidebarOpen = false)}
		></div>
	{/if}

	<!-- Sidebar Navigation -->
	<aside
		class="fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-[#171717] border-r border-[#2e2e2e] flex flex-col justify-between p-5 transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none shrink-0
		{isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}"
	>
		<!-- Upper Portion: Brand & Links -->
		<div class="space-y-6 flex-1 overflow-y-auto">
			<!-- Logo Branding Header -->
			<div class="flex items-center justify-between pb-4 border-b border-[#2e2e2e]">
				<a href="/" onclick={() => (isMobileSidebarOpen = false)} class="flex items-center gap-3 group">
					<div class="w-9 h-9 rounded-md bg-[#3ecf8e] text-[#062317] flex items-center justify-center font-mono font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
						⚡
					</div>
					<div class="flex flex-col">
						<span class="font-bold text-lg tracking-tight text-white flex items-center gap-1.5 font-heading">
							Sonic<span class="text-[#3ecf8e]">Mesh</span>
							<span class="px-1.5 py-0.5 rounded bg-[#262626] border border-[#333] text-[9px] font-mono text-[#a1a1aa] uppercase font-semibold">Studio</span>
						</span>
						<span class="text-[10px] text-[#a1a1aa] uppercase tracking-wider font-mono">CognoDB openCypher</span>
					</div>
				</a>

				<button
					onclick={() => (isMobileSidebarOpen = false)}
					class="lg:hidden p-1.5 rounded-md text-[#a1a1aa] hover:text-white hover:bg-[#262626]"
					aria-label="Close navigation sidebar"
				>
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Add Song Quick Action -->
			<div>
				<a
					href="/add-song"
					onclick={() => (isMobileSidebarOpen = false)}
					class="w-full py-2.5 px-4 rounded-md text-xs font-semibold font-mono transition-all flex items-center justify-center gap-2 sb-btn-primary shadow-sm"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
					</svg>
					+ Insert New Song
				</a>
			</div>

			<!-- Main Links Section -->
			<nav class="space-y-1">
				<div class="px-3 pb-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#71717a]">Database Explorer</div>

				<a
					href="/"
					onclick={() => (isMobileSidebarOpen = false)}
					class="px-3.5 py-2.5 rounded-md text-xs font-semibold font-mono transition-all flex items-center gap-3 {page.url.pathname === '/' ? 'bg-[#1c392b] text-[#3ecf8e] border border-[#2b5940]' : 'text-[#a1a1aa] hover:text-white hover:bg-[#1e1e1e]'}"
				>
					<svg class="w-4 h-4 {page.url.pathname === '/' ? 'text-[#3ecf8e]' : 'text-[#71717a]'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
					</svg>
					Catalog Overview
				</a>

				<a
					href="/catalog"
					onclick={() => (isMobileSidebarOpen = false)}
					class="px-3.5 py-2.5 rounded-md text-xs font-semibold font-mono transition-all flex items-center gap-3 {page.url.pathname === '/catalog' ? 'bg-[#1c392b] text-[#3ecf8e] border border-[#2b5940]' : 'text-[#a1a1aa] hover:text-white hover:bg-[#1e1e1e]'}"
				>
					<svg class="w-4 h-4 {page.url.pathname === '/catalog' ? 'text-[#3ecf8e]' : 'text-[#71717a]'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 .895-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 .895-2 3-2 3 .895 3 2zM9 10l12-3" />
					</svg>
					Songs Catalog
				</a>


				<a
					href="/recommendations"
					onclick={() => (isMobileSidebarOpen = false)}
					class="px-3.5 py-2.5 rounded-md text-xs font-semibold font-mono transition-all flex items-center gap-3 {page.url.pathname === '/recommendations' ? 'bg-[#1c392b] text-[#3ecf8e] border border-[#2b5940]' : 'text-[#a1a1aa] hover:text-white hover:bg-[#1e1e1e]'}"
				>
					<svg class="w-4 h-4 {page.url.pathname === '/recommendations' ? 'text-[#3ecf8e]' : 'text-[#71717a]'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
					Recommendations
				</a>

				<a
					href="/liked-connections"
					onclick={() => (isMobileSidebarOpen = false)}
					class="px-3.5 py-2.5 rounded-md text-xs font-semibold font-mono transition-all flex items-center gap-3 {page.url.pathname === '/liked-connections' ? 'bg-[#1c392b] text-[#3ecf8e] border border-[#2b5940]' : 'text-[#a1a1aa] hover:text-white hover:bg-[#1e1e1e]'}"
				>
					<svg class="w-4 h-4 text-rose-500 fill-current" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
					</svg>
					Liked Connections
				</a>

				<a
					href="/connect"
					onclick={() => (isMobileSidebarOpen = false)}
					class="px-3.5 py-2.5 rounded-md text-xs font-semibold font-mono transition-all flex items-center gap-3 {page.url.pathname === '/connect' ? 'bg-[#1c392b] text-[#3ecf8e] border border-[#2b5940]' : 'text-[#a1a1aa] hover:text-white hover:bg-[#1e1e1e]'}"
				>
					<svg class="w-4 h-4 {page.url.pathname === '/connect' ? 'text-[#3ecf8e]' : 'text-[#71717a]'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
					</svg>
					Find Connection Path
				</a>

			</nav>
		</div>

		<!-- Lower Portion: Status & System Badge -->
		<div class="pt-4 border-t border-[#2e2e2e] space-y-3">
			<div class="flex items-center gap-2.5 px-3 py-2 rounded-md bg-[#1e1e1e] border border-[#2e2e2e] text-xs">
				<span class="w-2.5 h-2.5 rounded-full shrink-0 {data.dbConnected ? 'bg-[#3ecf8e] animate-pulse shadow-sm shadow-[#3ecf8e]' : 'bg-rose-500'}"></span>
				<div class="flex flex-col">
					<span class="text-[11px] font-mono font-bold text-white leading-tight">
						{data.dbConnected ? 'Graph Engine Active' : 'Offline'}
					</span>
					<span class="text-[9px] text-[#a1a1aa] font-mono">openCypher v5.0</span>
				</div>
			</div>

			<div class="px-1 text-[10px] text-[#71717a] flex items-center justify-between font-mono">
				<span>SonicMesh Studio</span>
				<span class="text-[#3ecf8e]">v0.0.1</span>
			</div>
		</div>
	</aside>

	<!-- Main Body Content Container -->
	<div class="flex-1 flex flex-col min-w-0 min-h-screen">
		<main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
			{@render children()}
		</main>

		<!-- Footer -->
		<footer class="border-t border-[#2e2e2e] py-6 bg-[#171717] mt-auto">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#a1a1aa]">
				<div class="flex items-center gap-2">
					<span class="font-bold text-white font-heading">SonicMesh Studio</span>
					<span>— Graph Database Explorer & Engine</span>
				</div>
				<div class="flex items-center gap-6 font-mono text-[11px]">
					<span class="text-[#3ecf8e]">● openCypher Graph Engine</span>
				</div>
			</div>
		</footer>
	</div>
</div>
