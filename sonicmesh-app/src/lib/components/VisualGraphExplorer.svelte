<script lang="ts">
	let { song } = $props<{ song: any }>();

	let selectedNode = $state<any>(null);

	// Compute node positions in a radial layout around central song node
	const nodes = $derived.by(() => {
		if (!song) return [];

		const items: any[] = [];
		const centerX = 250;
		const centerY = 180;

		// Center Node: Song
		items.push({
			id: 'center',
			label: 'Song',
			title: song.title,
			color: '#4F46E5', // Indigo
			x: centerX,
			y: centerY,
			radius: 28,
			icon: '🎵',
			details: `Song: ${song.title} (${song.releaseYear})`
		});

		const connected: { type: string; title: string; color: string; icon: string; rel: string }[] = [];

		(song.artists || []).forEach((a: any) => {
			connected.push({ type: 'Artist', title: a.name, color: '#9333EA', icon: '🎤', rel: ':PERFORMED' });
		});

		(song.composers || []).forEach((c: any) => {
			connected.push({ type: 'Composer', title: c.name, color: '#D97706', icon: '🎼', rel: ':COMPOSED' });
		});

		if (song.album?.title) {
			connected.push({ type: 'Album', title: song.album.title, color: '#0284C7', icon: '💿', rel: ':PART_OF' });
		}

		(song.genres || []).forEach((g: any) => {
			connected.push({ type: 'Genre', title: g.name, color: '#E11D48', icon: '🎧', rel: ':HAS_GENRE' });
		});

		(song.moods || []).forEach((m: any) => {
			connected.push({ type: 'Mood', title: m.name, color: '#059669', icon: '❤️', rel: ':HAS_MOOD' });
		});

		(song.languages || []).forEach((l: any) => {
			connected.push({ type: 'Language', title: l.name, color: '#4F46E5', icon: '🌐', rel: ':IN_LANGUAGE' });
		});

		const count = connected.length;
		const radiusDist = 130;

		connected.forEach((item, index) => {
			const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
			const x = centerX + radiusDist * Math.cos(angle);
			const y = centerY + radiusDist * Math.sin(angle);

			items.push({
				id: `node-${index}`,
				label: item.type,
				title: item.title,
				color: item.color,
				x,
				y,
				radius: 20,
				icon: item.icon,
				rel: item.rel,
				details: `${item.type}: ${item.title}`
			});
		});

		return items;
	});

	const links = $derived.by(() => {
		const center = nodes.find((n) => n.id === 'center');
		if (!center) return [];

		return nodes
			.filter((n) => n.id !== 'center')
			.map((target) => ({
				x1: center.x,
				y1: center.y,
				x2: target.x,
				y2: target.y,
				rel: target.rel,
				color: target.color
			}));
	});

	function selectNode(n: any) {
		selectedNode = n;
	}
</script>

<div class="bg-slate-900 rounded-3xl p-6 border border-slate-800 text-slate-100 shadow-xl space-y-4">
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-slate-800 pb-3">
		<div class="flex items-center gap-2">
			<span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
			<span class="font-bold text-sm font-heading text-slate-200">Interactive Graph Explorer</span>
		</div>
		<span class="text-[11px] font-mono text-indigo-400 font-semibold bg-indigo-950/80 px-2.5 py-1 rounded-full border border-indigo-800">
			{nodes.length} Labeled Nodes &bull; {links.length} Typed Edges
		</span>
	</div>

	<!-- SVG Interactive Graph Canvas -->
	<div class="relative w-full h-[360px] bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden flex items-center justify-center">
		<svg viewBox="0 0 500 360" class="w-full h-full">
			<!-- Background Grid Lines -->
			<defs>
				<pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
					<path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1E293B" stroke-width="0.5" />
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill="url(#grid)" />

			<!-- Edge Relationship Lines -->
			{#each links as link}
				<line x1={link.x1} y1={link.y1} x2={link.x2} y2={link.y2} stroke={link.color} stroke-width="2" stroke-opacity="0.6" stroke-dasharray="4 2" />
				<!-- Midpoint Relationship Label -->
				<text
					x={(link.x1 + link.x2) / 2}
					y={(link.y1 + link.y2) / 2 - 4}
					fill="#94A3B8"
					font-size="8"
					font-family="monospace"
					font-weight="bold"
					text-anchor="middle"
				>
					{link.rel}
				</text>
			{/each}

			<!-- Nodes -->
			{#each nodes as n}
				<!-- Glow ring on hover/selection -->
				<g
					class="cursor-pointer group"
					onclick={() => selectNode(n)}
					role="button"
					tabindex="0"
					onkeydown={(e) => e.key === 'Enter' && selectNode(n)}
				>
					<circle
						cx={n.x}
						cy={n.y}
						r={n.radius + (selectedNode?.id === n.id ? 4 : 0)}
						fill={n.color}
						fill-opacity={selectedNode?.id === n.id ? '1' : '0.85'}
						stroke="#FFFFFF"
						stroke-width={selectedNode?.id === n.id ? '3' : '1.5'}
						class="transition-all duration-300 group-hover:scale-110"
					/>
					<text x={n.x} y={n.y + 4} fill="#FFFFFF" font-size="12" text-anchor="middle" pointer-events="none">
						{n.icon}
					</text>
					<!-- Label text below node -->
					<text
						x={n.x}
						y={n.y + n.radius + 12}
						fill="#F8FAFC"
						font-size="9"
						font-weight="bold"
						text-anchor="middle"
						class="drop-shadow-sm"
					>
						{n.title.length > 14 ? n.title.substring(0, 12) + '...' : n.title}
					</text>
				</g>
			{/each}
		</svg>

		<!-- Selected Node Tooltip Card Overlay -->
		{#if selectedNode}
			<div class="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-md p-3.5 rounded-xl border border-indigo-500/40 text-xs flex items-center justify-between shadow-xl animate-fade-in">
				<div class="flex items-center gap-3">
					<span class="text-xl">{selectedNode.icon}</span>
					<div>
						<span class="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">{selectedNode.label} Node</span>
						<span class="font-bold text-slate-100">{selectedNode.title}</span>
					</div>
				</div>
				<button onclick={() => (selectedNode = null)} class="text-slate-400 hover:text-white font-bold px-2 text-xs">✕</button>
			</div>
		{/if}
	</div>

	<!-- Legend Footer -->
	<div class="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 pt-1 font-mono">
		<span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Song</span>
		<span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Artist</span>
		<span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-600"></span> Composer</span>
		<span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-rose-600"></span> Genre</span>
		<span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Mood</span>
	</div>
</div>
