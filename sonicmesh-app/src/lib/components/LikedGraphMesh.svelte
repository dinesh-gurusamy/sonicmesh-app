<script lang="ts">
	type Node = {
		id: string;
		label: string;
		name: string;
		type?: string;
		image?: string;
		x?: number;
		y?: number;
		tier?: number;
	};

	type Link = {
		source: string;
		target: string;
		type: string;
	};

	let { nodes = [], links = [] }: { nodes: Node[]; links: Link[] } = $props();

	let viewMode = $state<'FLOW' | 'RADIAL'>('FLOW');
	let selectedFilter = $state('ALL');
	let hoveredNodeId = $state<string | null>(null);
	let selectedNode = $state<Node | null>(null);

	let canvasWidth = $state(900);
	let canvasHeight = $state(540);

	let positionedNodes = $state<Node[]>([]);
	let linksWithPositions = $state<{ sourceNode: Node; targetNode: Node; type: string; pathD: string }[]>([]);

	// Theme colors per tier matching user's image styling
	function getNodeStyle(node: Node) {
		if (node.label === 'Song' || node.type === 'liked') {
			return { fill: '#331D19', stroke: '#E05D38', text: '#FDBA74', badgeBg: '#C2410C', badgeText: '#FFF', label: 'LIKED SONG' }; // Orange-Coral
		}
		if (node.label === 'Artist') {
			return { fill: '#2A2415', stroke: '#EAB308', text: '#FEF08A', badgeBg: '#CA8A04', badgeText: '#FFF', label: 'PERFORMER' }; // Yellow
		}
		if (node.label === 'Composer') {
			return { fill: '#142921', stroke: '#10B981', text: '#A7F3D0', badgeBg: '#059669', badgeText: '#FFF', label: 'COMPOSER' }; // Emerald Green
		}
		if (node.label === 'Album') {
			return { fill: '#17253B', stroke: '#3B82F6', text: '#BFDBFE', badgeBg: '#2563EB', badgeText: '#FFF', label: 'ALBUM' }; // Sky Blue
		}
		return { fill: '#1E293B', stroke: '#64748B', text: '#E2E8F0', badgeBg: '#475569', badgeText: '#FFF', label: node.label.toUpperCase() };
	}

	function calculatePositions() {
		if (!nodes || nodes.length === 0) return;

		const filteredNodes = nodes.filter((n) => {
			if (selectedFilter === 'ALL') return true;
			if (n.label === 'Song') return true;
			return n.label.toUpperCase() === selectedFilter;
		});

		const nodeMap = new Map<string, Node>();

		if (viewMode === 'FLOW') {
			// Hierarchical Tier Layout (Flow Diagram)
			const tier1: Node[] = []; // Songs
			const tier2: Node[] = []; // Artists
			const tier3: Node[] = []; // Composers
			const tier4: Node[] = []; // Albums / Genres

			filteredNodes.forEach((n) => {
				if (n.label === 'Song') tier1.push(n);
				else if (n.label === 'Artist') tier2.push(n);
				else if (n.label === 'Composer') tier3.push(n);
				else tier4.push(n);
			});

			const yTier1 = 70;
			const yTier2 = 190;
			const yTier3 = 310;
			const yTier4 = 430;

			// Position Tier 1
			tier1.forEach((node, idx) => {
				const stepX = canvasWidth / (tier1.length + 1);
				nodeMap.set(node.id, { ...node, x: stepX * (idx + 1), y: yTier1, tier: 1 });
			});

			// Position Tier 2
			tier2.forEach((node, idx) => {
				const stepX = canvasWidth / (tier2.length + 1);
				nodeMap.set(node.id, { ...node, x: stepX * (idx + 1), y: yTier2, tier: 2 });
			});

			// Position Tier 3
			tier3.forEach((node, idx) => {
				const stepX = canvasWidth / (tier3.length + 1);
				nodeMap.set(node.id, { ...node, x: stepX * (idx + 1), y: yTier3, tier: 3 });
			});

			// Position Tier 4
			tier4.forEach((node, idx) => {
				const stepX = canvasWidth / (tier4.length + 1);
				nodeMap.set(node.id, { ...node, x: stepX * (idx + 1), y: yTier4, tier: 4 });
			});
		} else {
			// Radial Orbit Layout
			const radius = Math.min(canvasWidth, canvasHeight) * 0.35;
			const centerX = canvasWidth / 2;
			const centerY = canvasHeight / 2;

			const songs = filteredNodes.filter((n) => n.label === 'Song');
			const connectors = filteredNodes.filter((n) => n.label !== 'Song');

			songs.forEach((s, idx) => {
				const angle = (idx / Math.max(1, songs.length)) * 2 * Math.PI - Math.PI / 2;
				const r = songs.length > 1 ? radius * 0.5 : 0;
				nodeMap.set(s.id, { ...s, x: centerX + r * Math.cos(angle), y: centerY + r * Math.sin(angle) });
			});

			connectors.forEach((c, idx) => {
				const angle = (idx / Math.max(1, connectors.length)) * 2 * Math.PI;
				const r = radius * 1.05;
				nodeMap.set(c.id, { ...c, x: centerX + r * Math.cos(angle), y: centerY + r * Math.sin(angle) });
			});
		}

		positionedNodes = Array.from(nodeMap.values());

		// Compute Curved Connector Bezier Paths with Arrow Markers
		const activeLinks: { sourceNode: Node; targetNode: Node; type: string; pathD: string }[] = [];

		links.forEach((l) => {
			const sourceNode = nodeMap.get(l.source);
			const targetNode = nodeMap.get(l.target);

			if (sourceNode && targetNode && sourceNode.x && sourceNode.y && targetNode.x && targetNode.y) {
				let x1 = sourceNode.x;
				let y1 = sourceNode.y;
				let x2 = targetNode.x;
				let y2 = targetNode.y;

				if (viewMode === 'FLOW') {
					// Ensure top-to-bottom direction flow
					if (y1 > y2) {
						[x1, x2] = [x2, x1];
						[y1, y2] = [y2, y1];
					}

					// Offset for card rectangle top/bottom edges
					const topY = y1 + 22;
					const botY = y2 - 22;
					const midY = (topY + botY) / 2;

					// Smooth orthogonal curved path matching user image
					const pathD = `M ${x1} ${topY} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${botY}`;
					activeLinks.push({ sourceNode, targetNode, type: l.type, pathD });
				} else {
					const pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
					activeLinks.push({ sourceNode, targetNode, type: l.type, pathD });
				}
			}
		});

		linksWithPositions = activeLinks;
	}

	$effect(() => {
		calculatePositions();
	});

	function isConnected(id1: string, id2: string) {
		return linksWithPositions.some(
			(l) =>
				(l.sourceNode.id === id1 && l.targetNode.id === id2) ||
				(l.sourceNode.id === id2 && l.targetNode.id === id1)
		);
	}
</script>

<div class="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4 relative overflow-hidden">
	<!-- Top Header & View Controls Bar -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
		<div>
			<div class="flex items-center gap-2">
				<span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
				<h2 class="text-xl font-bold font-heading text-slate-900">Liked Connection Flow Visualizer</h2>
				<span class="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold font-mono">
					{positionedNodes.length} Nodes • {linksWithPositions.length} Flow Edges
				</span>
			</div>
			<p class="text-xs text-slate-500 mt-1">
				Hierarchical flow diagram mapping liked songs to performing artists, composers, and albums
			</p>
		</div>

		<!-- Control Switches -->
		<div class="flex flex-wrap items-center gap-3">
			<!-- View Mode Switch (Flow Hierarchy vs Radial Mesh) -->
			<div class="flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
				<button
					onclick={() => (viewMode = 'FLOW')}
					class="px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 {viewMode === 'FLOW' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'}"
				>
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
					</svg>
					Hierarchical Flow
				</button>
				<button
					onclick={() => (viewMode = 'RADIAL')}
					class="px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 {viewMode === 'RADIAL' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'}"
				>
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
					</svg>
					Radial Mesh
				</button>
			</div>

			<!-- Filter Tabs -->
			<div class="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
				{#each ['ALL', 'ARTIST', 'COMPOSER', 'ALBUM'] as f}
					<button
						onclick={() => (selectedFilter = f)}
						class="px-2.5 py-1 rounded-lg transition-all {selectedFilter === f ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'}"
					>
						{f}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Flow Level Legend (Shown in Flow mode) -->
	{#if viewMode === 'FLOW'}
		<div class="flex flex-wrap items-center justify-between text-xs font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 px-4">
			<span class="flex items-center gap-2">
				<span class="w-3 h-3 rounded-md bg-amber-600"></span>
				Level 1: Liked Songs
			</span>
			<span class="text-slate-300">➔</span>
			<span class="flex items-center gap-2">
				<span class="w-3 h-3 rounded-md bg-yellow-500"></span>
				Level 2: Performers
			</span>
			<span class="text-slate-300">➔</span>
			<span class="flex items-center gap-2">
				<span class="w-3 h-3 rounded-md bg-emerald-500"></span>
				Level 3: Composers
			</span>
			<span class="text-slate-300">➔</span>
			<span class="flex items-center gap-2">
				<span class="w-3 h-3 rounded-md bg-blue-500"></span>
				Level 4: Albums & Styles
			</span>
		</div>
	{/if}

	<!-- Canvas Render Window -->
	<div class="relative w-full h-[520px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/90 flex items-center justify-center shadow-inner">
		<!-- Mesh background grid effect -->
		<div class="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none"></div>

		<svg width="100%" height="100%" viewBox="0 0 900 520" class="w-full h-full">
			<defs>
				<!-- Arrowhead Markers for Flow Connectors -->
				<marker
					id="arrow-default"
					viewBox="0 0 10 10"
					refX="8"
					refY="5"
					markerWidth="6"
					markerHeight="6"
					orient="auto-start-reverse"
				>
					<path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
				</marker>

				<marker
					id="arrow-active"
					viewBox="0 0 10 10"
					refX="8"
					refY="5"
					markerWidth="7"
					markerHeight="7"
					orient="auto-start-reverse"
				>
					<path d="M 0 0 L 10 5 L 0 10 z" fill="#818CF8" />
				</marker>

				<!-- Image Clip Paths -->
				<clipPath id="avatar-clip">
					<rect x="-62" y="-16" width="32" height="32" rx="8" ry="8" />
				</clipPath>
			</defs>

			<!-- Tier Guideline Dividers (in Flow mode) -->
			{#if viewMode === 'FLOW'}
				<g class="tier-lines" opacity="0.3">
					<line x1="20" y1="130" x2="880" y2="130" stroke="#334155" stroke-dasharray="6 4" stroke-width="1" />
					<line x1="20" y1="250" x2="880" y2="250" stroke="#334155" stroke-dasharray="6 4" stroke-width="1" />
					<line x1="20" y1="370" x2="880" y2="370" stroke="#334155" stroke-dasharray="6 4" stroke-width="1" />
				</g>
			{/if}

			<!-- Curved Orthogonal Connector Lines -->
			<g class="flow-connectors">
				{#each linksWithPositions as link}
					{@const isHighlighted = hoveredNodeId
						? link.sourceNode.id === hoveredNodeId || link.targetNode.id === hoveredNodeId
						: false}
					<path
						d={link.pathD}
						fill="none"
						stroke={isHighlighted ? '#818CF8' : '#334155'}
						stroke-width={isHighlighted ? 3 : 1.8}
						stroke-opacity={hoveredNodeId && !isHighlighted ? 0.25 : 0.85}
						marker-end={isHighlighted ? 'url(#arrow-active)' : 'url(#arrow-default)'}
						class="transition-all duration-300"
					/>
				{/each}
			</g>

			<!-- Node Cards (Structured Rectangular Flow Cards) -->
			<g class="flow-nodes">
				{#each positionedNodes as node}
					{@const isSelected = selectedNode?.id === node.id}
					{@const isHovered = hoveredNodeId === node.id}
					{@const style = getNodeStyle(node)}
					{@const cardW = viewMode === 'FLOW' ? 144 : 52}
					{@const cardH = viewMode === 'FLOW' ? 44 : 52}

					<g
						transform="translate({node.x || 450}, {node.y || 260})"
						class="cursor-pointer transition-transform duration-300 hover:scale-105"
						onmouseenter={() => (hoveredNodeId = node.id)}
						onmouseleave={() => (hoveredNodeId = null)}
						onclick={() => (selectedNode = node)}
						onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectedNode = node; }}
						tabindex="0"
						role="button"
					>
						{#if viewMode === 'FLOW'}
							<!-- Outer Card Aura Glow -->
							<rect
								x={-cardW / 2 - 2}
								y={-cardH / 2 - 2}
								width={cardW + 4}
								height={cardH + 4}
								rx="14"
								ry="14"
								fill={style.stroke}
								opacity={isHovered || isSelected ? 0.4 : 0.1}
								class="transition-opacity"
							/>

							<!-- Flow Rectangular Card Body -->
							<rect
								x={-cardW / 2}
								y={-cardH / 2}
								width={cardW}
								height={cardH}
								rx="12"
								ry="12"
								fill={style.fill}
								stroke={isHovered || isSelected ? '#FFFFFF' : style.stroke}
								stroke-width={isHovered || isSelected ? 2.5 : 1.5}
								class="shadow-lg transition-all"
							/>

							<!-- Image Avatar Thumbnail inside Card -->
							{#if node.image}
								<image
									href={node.image}
									x={-cardW / 2 + 6}
									y={-cardH / 2 + 6}
									width="32"
									height="32"
									clip-path="url(#avatar-clip)"
									preserveAspectRatio="xMidYMid slice"
								/>
							{:else}
								<rect
									x={-cardW / 2 + 6}
									y={-cardH / 2 + 6}
									width="32"
									height="32"
									rx="8"
									ry="8"
									fill={style.stroke}
								/>
								<text
									x={-cardW / 2 + 22}
									y={-cardH / 2 + 22}
									text-anchor="middle"
									fill="#FFFFFF"
									font-size="11"
									font-weight="bold"
								>
									{node.name.substring(0, 2).toUpperCase()}
								</text>
							{/if}

							<!-- Card Text Details -->
							<text
								x={-cardW / 2 + 44}
								y="-2"
								fill={style.text}
								font-size="11"
								font-weight="bold"
								class="select-none"
							>
								{node.name.length > 11 ? node.name.substring(0, 9) + '..' : node.name}
							</text>

							<text
								x={-cardW / 2 + 44}
								y="12"
								fill="#94A3B8"
								font-size="9"
								font-weight="600"
								class="select-none uppercase tracking-wider"
							>
								{style.label}
							</text>
						{:else}
							<!-- Radial Circle Node -->
							<circle
								r="24"
								fill={style.stroke}
								opacity={isHovered || isSelected ? 0.35 : 0.15}
							/>
							<circle
								r="20"
								fill={style.fill}
								stroke={isHovered || isSelected ? '#FFFFFF' : style.stroke}
								stroke-width={isHovered || isSelected ? 2.5 : 1.5}
							/>
							{#if node.image}
								<clipPath id="radial-clip-{node.id}">
									<circle r="18" cx="0" cy="0" />
								</clipPath>
								<image
									href={node.image}
									x="-18"
									y="-18"
									width="36"
									height="36"
									clip-path="url(#radial-clip-{node.id})"
									preserveAspectRatio="xMidYMid slice"
								/>
							{:else}
								<text text-anchor="middle" dy=".35em" fill="#FFFFFF" font-size="10" font-weight="bold">
									{node.name.substring(0, 2).toUpperCase()}
								</text>
							{/if}
							<text
								y="34"
								text-anchor="middle"
								fill="#F8FAFC"
								font-size="10"
								font-weight="bold"
								class="select-none drop-shadow-sm"
							>
								{node.name}
							</text>
						{/if}
					</g>
				{/each}
			</g>
		</svg>

		<!-- Node Detail Modal Card on selection -->
		{#if selectedNode}
			<div class="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-4 rounded-2xl text-white flex items-center justify-between shadow-2xl animate-fade-in">
				<div class="flex items-center gap-3.5">
					{#if selectedNode.image}
						<img src={selectedNode.image} alt={selectedNode.name} class="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow-md shrink-0" />
					{:else}
						<div class="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
							{selectedNode.name.substring(0, 2).toUpperCase()}
						</div>
					{/if}
					<div>
						<div class="flex items-center gap-2">
							<span class="text-sm font-bold text-slate-100">{selectedNode.name}</span>
							<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-900/60 border border-indigo-700">
								{selectedNode.label}
							</span>
						</div>
						<p class="text-xs text-slate-400 mt-0.5">
							{selectedNode.label === 'Song' ? 'User Liked Song in Graph' : `Connecting ${selectedNode.label} Node in Taste Mesh`}
						</p>
					</div>
				</div>

				<div class="flex items-center gap-2">
					{#if selectedNode.label === 'Artist'}
						<a href="/artist/{encodeURIComponent(selectedNode.name)}" class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm">
							View Artist Explorer ➔
						</a>
					{:else if selectedNode.label === 'Song'}
						<a href="/song/{selectedNode.id}" class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm">
							View Song Detail ➔
						</a>
					{/if}
					<button onclick={() => (selectedNode = null)} class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
						✕
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
