<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';

	let { data, children } = $props();

	let isMobileMenuOpen = $state(false);
</script>

<div class="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 selection:bg-indigo-500/20 selection:text-indigo-900">
	<!-- Navbar Header -->
	<header class="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
			<!-- Logo -->
			<a href="/" class="flex items-center gap-3 group">
				<div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-sky-500 p-0.5 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
					<div class="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
						<svg class="w-5 h-5 text-indigo-600 group-hover:text-purple-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
						</svg>
					</div>
				</div>
				<div class="flex flex-col">
					<span class="font-bold text-xl tracking-tight text-slate-900 flex items-center gap-1 font-heading">
						Sonic<span class="gradient-text-purple">Mesh</span>
					</span>
					<span class="text-[10px] text-slate-500 uppercase tracking-widest -mt-1 font-medium">Music Connections Engine</span>
				</div>
			</a>

			<!-- Desktop Nav Links -->
			<nav class="hidden lg:flex items-center gap-1 bg-slate-100 p-1.5 rounded-full border border-slate-200">
				<a
					href="/"
					class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 {page.url.pathname === '/' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}"
				>
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
					</svg>
					Home
				</a>
				<a
					href="/recommendations"
					class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 {page.url.pathname === '/recommendations' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}"
				>
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
					</svg>
					Recommendations
				</a>
				<a
					href="/liked-connections"
					class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 {page.url.pathname === '/liked-connections' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}"
				>
					<svg class="w-3.5 h-3.5 text-rose-500 fill-current" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
					</svg>
					Liked Connections
				</a>
				<a
					href="/connect"
					class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 {page.url.pathname === '/connect' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}"
				>
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
					</svg>
					Find Connection
				</a>
				<a
					href="/artist/A.R.%20Rahman"
					class="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 {page.url.pathname.startsWith('/artist') ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}"
				>
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
					</svg>
					Artist Explorer
				</a>
				<a
					href="/add-song"
					class="px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-indigo-500/20"
				>
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
					</svg>
					Add Song
				</a>
			</nav>

			<!-- Right Status Pill & Mobile Menu Toggle -->
			<div class="flex items-center gap-3">
				<div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs">
					<span class="w-2.5 h-2.5 rounded-full {data.dbConnected ? 'bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500' : 'bg-rose-500'}"></span>
					<span class="text-slate-700 text-[11px] font-bold">
						{data.dbConnected ? 'Graph Engine Active' : 'Offline'}
					</span>
				</div>

				<button
					onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
					class="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
					aria-label="Toggle menu"
				>
					<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
					</svg>
				</button>
			</div>
		</div>

		<!-- Mobile Navigation Drawer -->
		{#if isMobileMenuOpen}
			<div class="lg:hidden bg-white border-b border-slate-200 p-4 space-y-2 text-xs font-bold shadow-md">
				<a href="/" onclick={() => (isMobileMenuOpen = false)} class="block p-2.5 rounded-xl hover:bg-slate-100 text-slate-700">🏠 Home Catalog</a>
				<a href="/liked-connections" onclick={() => (isMobileMenuOpen = false)} class="block p-2.5 rounded-xl hover:bg-slate-100 text-slate-700">❤️ Liked Connections</a>
				<a href="/recommendations" onclick={() => (isMobileMenuOpen = false)} class="block p-2.5 rounded-xl hover:bg-slate-100 text-slate-700">🎯 Recommendations</a>
				<a href="/connect" onclick={() => (isMobileMenuOpen = false)} class="block p-2.5 rounded-xl hover:bg-slate-100 text-slate-700">🔗 Find Connection</a>
				<a href="/artist/A.R.%20Rahman" onclick={() => (isMobileMenuOpen = false)} class="block p-2.5 rounded-xl hover:bg-slate-100 text-slate-700">🎤 Artist Explorer</a>
				<a href="/add-song" onclick={() => (isMobileMenuOpen = false)} class="block p-2.5 rounded-xl bg-indigo-600 text-white text-center">➕ Add Song</a>
			</div>
		{/if}
	</header>

	<!-- Main Body Content -->
	<main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="border-t border-slate-200 py-8 mt-12 bg-white">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
			<div class="flex items-center gap-2">
				<span class="font-bold text-slate-800">SonicMesh</span>
				<span>— Interactive Music Connections Explorer</span>
			</div>
			<div class="flex items-center gap-6">
				<span>Powered by Graph Traversals & Cypher</span>
			</div>
		</div>
	</footer>
</div>
