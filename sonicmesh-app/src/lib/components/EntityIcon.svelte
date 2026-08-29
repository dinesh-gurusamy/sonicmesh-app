<script lang="ts">
	let {
		type = 'song',
		class: className = 'h-full w-full'
	}: {
		type?: 'song' | 'album' | 'artist' | 'composer';
		class?: string;
	} = $props();
</script>

{#if type === 'song'}
	<!-- Sleek Vinyl Disc Icon Badge -->
	<div class="relative flex items-center justify-center rounded-lg border border-[#2e2e2e] bg-[#141414] p-1.5 shadow-md shrink-0 overflow-hidden {className}">
		<svg viewBox="0 0 100 100" class="h-full w-full text-[#3ecf8e]">
			<circle cx="50" cy="50" r="46" fill="#121212" stroke="#262626" stroke-width="2"/>
			<circle cx="50" cy="50" r="40" fill="none" stroke="#222" stroke-width="1" stroke-dasharray="4 2"/>
			<circle cx="50" cy="50" r="32" fill="none" stroke="#2a2a2a" stroke-width="1"/>
			<circle cx="50" cy="50" r="24" fill="none" stroke="#202020" stroke-width="1"/>
			<circle cx="50" cy="50" r="16" fill="currentColor"/>
			<circle cx="50" cy="50" r="4" fill="#121212" stroke="#000" stroke-width="1"/>
			<path d="M47 43 L47 53 A 3 3 0 1 1 44 50 L47 50 L53 47 L53 51 A 3 3 0 1 1 50 48 L53 48 L53 43 Z" fill="#062317"/>
		</svg>
	</div>
{:else if type === 'album'}
	<!-- Sleek Album Vinyl Sleeve Icon Badge -->
	<div class="relative flex items-center justify-center rounded-lg border border-[#4338ca]/60 bg-gradient-to-br from-[#1e1b4b] to-[#0f172a] p-1.5 shadow-md shrink-0 overflow-hidden {className}">
		<svg viewBox="0 0 100 100" class="h-full w-full text-[#a855f7]">
			<circle cx="58" cy="50" r="38" fill="#141414" stroke="#262626" stroke-width="1.5"/>
			<circle cx="58" cy="50" r="28" fill="none" stroke="#292929" stroke-width="1"/>
			<circle cx="58" cy="50" r="14" fill="currentColor"/>
			<circle cx="58" cy="50" r="4" fill="#0f172a"/>
			<rect x="8" y="12" width="60" height="76" rx="4" fill="#181825" stroke="#4338ca" stroke-width="1.5" opacity="0.95"/>
			<path d="M 32 38 L 48 38 L 48 54 L 32 54 Z" fill="none" stroke="#a855f7" stroke-width="1.5" stroke-dasharray="2 2"/>
			<circle cx="40" cy="46" r="6" fill="#a855f7" opacity="0.4"/>
		</svg>
	</div>
{:else if type === 'artist'}
	<!-- Sleek Stage Microphone & Performer Icon Badge -->
	<div class="relative flex items-center justify-center rounded-full border border-[#581c87]/60 bg-gradient-to-br from-[#2e1065] to-[#0f172a] p-1.5 shadow-md shrink-0 overflow-hidden {className}">
		<svg viewBox="0 0 100 100" class="h-full w-full text-[#c084fc]">
			<circle cx="50" cy="50" r="44" fill="none" stroke="#581c87" stroke-width="1.5"/>
			<path d="M 50 26 C 44 26 39 31 39 37 L 39 51 C 39 57 44 62 50 62 C 56 62 61 57 61 51 L 61 37 C 61 31 56 26 50 26 Z M 67 50 C 67 59 59 67 50 67 C 41 67 33 59 33 50 H 28 C 28 61 35 70 46 71.5 V 80 H 40 V 84 H 60 V 80 H 54 V 71.5 C 65 70 72 61 72 50 H 67 Z" fill="currentColor"/>
		</svg>
	</div>
{:else if type === 'composer'}
	<!-- Sleek Composer Treble Clef Icon Badge -->
	<div class="relative flex items-center justify-center rounded-full border border-[#78350f]/60 bg-gradient-to-br from-[#451a03] to-[#1c1917] p-1.5 shadow-md shrink-0 overflow-hidden {className}">
		<svg viewBox="0 0 100 100" class="h-full w-full text-[#fbbf24]">
			<line x1="16" y1="36" x2="84" y2="36" stroke="#78350f" stroke-width="1" stroke-dasharray="2 2"/>
			<line x1="16" y1="46" x2="84" y2="46" stroke="#78350f" stroke-width="1" stroke-dasharray="2 2"/>
			<line x1="16" y1="56" x2="84" y2="56" stroke="#78350f" stroke-width="1" stroke-dasharray="2 2"/>
			<line x1="16" y1="66" x2="84" y2="66" stroke="#78350f" stroke-width="1" stroke-dasharray="2 2"/>
			<path d="M 55 24 C 51 24 47 28 47 34 C 47 42 55 46 55 52 C 55 58 45 60 41 54 C 39 51 40 46 44 45 C 41 45 37 48 37 53 C 37 60 43 65 51 65 C 61 65 65 57 65 51 C 65 40 55 36 55 32 C 55 29 57 28 59 29 C 57 27 58 24 55 24 Z M 49 65 L 49 83 C 49 89 43 93 38 90 C 34 87 34 82 38 80 C 40 79 43 80 43 83 L 43 65 Z" fill="currentColor"/>
		</svg>
	</div>
{/if}
