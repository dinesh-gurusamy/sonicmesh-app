<script lang="ts">
	type Node = {
		id: string;
		label: string;
		name: string;
		type?: string;
		image?: string;
		x?: number;
		y?: number;
	};

	type Link = {
		source: string;
		target: string;
		type: string;
	};

	let { nodes = [], links = [] }: { nodes: Node[]; links: Link[] } = $props();

	let selectedFilter = $state('ALL');
	let hoveredNodeId = $state<string | null>(null);
	let selectedNode = $state<Node | null>(null);

	const CANVAS_W = 900;
	const CANVAS_H = 520;
	const CARD_W = 152;
	const CARD_H = 48;

	let positionedNodes = $state<Node[]>([]);
	let linksWithPositions = $state<{ sourceNode: Node; targetNode: Node; type: string; pathD: string }[]>([]);

	// Supabase Dark Studio Theme Accents per tier
	const TIERS = {
		song: { accent: '#f43f5e', row: 0, label: 'Liked Song', axis: 'Songs' },
		artist: { accent: '#a855f7', row: 1, label: 'Performer', axis: 'Performers' },
		composer: { accent: '#f59e0b', row: 2, label: 'Composer', axis: 'Composers' },
		album: { accent: '#3ecf8e', row: 3, label: 'Album / Genre', axis: 'Albums & Genres' }
	} as const;

	function tierOf(node: Node): keyof typeof TIERS {
		if (node.label === 'Song') return 'song';
		if (node.label === 'Artist') return 'artist';
		if (node.label === 'Composer') return 'composer';
		return 'album';
	}

	function calculatePositions() {
		if (!nodes || nodes.length === 0) {
			positionedNodes = [];
			linksWithPositions = [];
			return;
		}

		const filteredNodes = nodes.filter((n) => {
			if (selectedFilter === 'ALL') return true;
			if (n.label === 'Song') return true;
			return n.label.toUpperCase() === selectedFilter;
		});

		const rows: Record<number, Node[]> = { 0: [], 1: [], 2: [], 3: [] };
		filteredNodes.forEach((n) => rows[TIERS[tierOf(n)].row].push(n));

		const rowY = [70, 190, 310, 430];
		const nodeMap = new Map<string, Node>();

		Object.entries(rows).forEach(([rowIndex, rowNodes]) => {
			const y = rowY[Number(rowIndex)];
			rowNodes.forEach((node, idx) => {
				const stepX = CANVAS_W / (rowNodes.length + 1);
				nodeMap.set(node.id, { ...node, x: stepX * (idx + 1), y });
			});
		});

		positionedNodes = Array.from(nodeMap.values());

		const activeLinks: typeof linksWithPositions = [];
		links.forEach((l) => {
			const sourceNode = nodeMap.get(l.source);
			const targetNode = nodeMap.get(l.target);
			if (!sourceNode?.x || !sourceNode?.y || !targetNode?.x || !targetNode?.y) return;

			let x1 = sourceNode.x, y1 = sourceNode.y, x2 = targetNode.x, y2 = targetNode.y;
			if (y1 > y2) {
				[x1, x2] = [x2, x1];
				[y1, y2] = [y2, y1];
			}
			const topY = y1 + CARD_H / 2;
			const botY = y2 - CARD_H / 2;
			const midY = (topY + botY) / 2;
			const pathD = `M ${x1} ${topY} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${botY}`;
			activeLinks.push({ sourceNode, targetNode, type: l.type, pathD });
		});

		linksWithPositions = activeLinks;
	}

	$effect(() => {
		calculatePositions();
	});
</script>

<div class="rounded-xl border border-[#2e2e2e] bg-[#171717] p-6 shadow-md space-y-4 font-mono">
	<!-- Header & Control Bar -->
	<div class="flex flex-col gap-4 border-b border-[#2e2e2e] pb-4 md:flex-row md:items-center md:justify-between">
		<div>
			<div class="flex items-center gap-2">
				<span class="w-2.5 h-2.5 rounded-full bg-[#3ecf8e] animate-pulse"></span>
				<h2 class="font-heading text-lg font-bold text-white">Liked Graph Connection Visualizer</h2>
				<span class="rounded bg-[#1c392b] border border-[#2b5940] px-2 py-0.5 text-[10px] font-bold text-[#3ecf8e]">
					{positionedNodes.length} Nodes &bull; {linksWithPositions.length} Edges
				</span>
			</div>
			<p class="mt-1 text-xs text-[#a1a1aa] font-sans">
				Hierarchical openCypher graph mapping liked tracks to performers, composers, and album nodes.
			</p>
		</div>

		<!-- Filter Switch -->
		<div class="flex flex-wrap gap-1 rounded-md border border-[#2e2e2e] bg-[#1e1e1e] p-1 text-xs font-bold">
			{#each [{ id: 'ALL', label: 'All' }, { id: 'ARTIST', label: 'Performers' }, { id: 'COMPOSER', label: 'Composers' }, { id: 'ALBUM', label: 'Albums' }] as f}
				<button
					onclick={() => (selectedFilter = f.id)}
					class="rounded px-2.5 py-1 transition-all cursor-pointer {selectedFilter === f.id
						? 'bg-[#262626] text-[#3ecf8e] shadow-xs border border-[#333]'
						: 'border border-transparent text-[#a1a1aa] hover:text-white'}"
				>
					{f.label}
				</button>
			{/each}
		</div>
	</div>

	{#if positionedNodes.length === 0}
		<!-- Empty state -->
		<div class="rounded-lg border border-dashed border-[#2e2e2e] bg-[#121212] p-10 text-center text-xs text-[#a1a1aa]">
			No nodes found. Like songs in the catalog to populate your graph visualization.
		</div>
	{:else}
		<!-- Canvas Window -->
		<div class="overflow-x-auto rounded-lg border border-[#2e2e2e]">
			<div class="relative h-[440px] min-w-[700px] sm:h-[520px] sb-canvas-bg">
				<svg width="100%" height="100%" viewBox="0 0 {CANVAS_W} {CANVAS_H}" class="h-full w-full">
					<defs>
						<marker id="arrow-default" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
							<path d="M 0 0 L 10 5 L 0 10 z" fill="#404040" />
						</marker>
						<marker id="arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
							<path d="M 0 0 L 10 5 L 0 10 z" fill="#3ecf8e" />
						</marker>
						<clipPath id="avatar-clip">
							<rect x={-CARD_W / 2 + 6} y={-CARD_H / 2 + 6} width="32" height="32" rx="6" ry="6" />
						</clipPath>
					</defs>

					<!-- Row guides -->
					<g opacity="0.4">
						{#each Object.values(TIERS) as tier, i}
							{#if i > 0}
								<line x1="20" y1={[130, 250, 370][i - 1]} x2={CANVAS_W - 20} y2={[130, 250, 370][i - 1]}
									stroke="#2e2e2e" stroke-dasharray="4 4" stroke-width="1" />
							{/if}
							<text x="24" y={[70, 190, 310, 430][i] - 30} fill="#71717a"
								font-family="var(--font-mono, monospace)" font-size="10" font-weight="700" letter-spacing="0.08em">
								{tier.axis.toUpperCase()}
							</text>
						{/each}
					</g>

					<!-- Connectors -->
					<g>
						{#each linksWithPositions as link}
							{@const isHighlighted = hoveredNodeId ? (link.sourceNode.id === hoveredNodeId || link.targetNode.id === hoveredNodeId) : false}
							<path
								d={link.pathD}
								fill="none"
								stroke={isHighlighted ? '#3ecf8e' : '#333333'}
								stroke-width={isHighlighted ? 2.5 : 1.5}
								stroke-opacity={hoveredNodeId && !isHighlighted ? 0.2 : 0.9}
								marker-end={isHighlighted ? 'url(#arrow-active)' : 'url(#arrow-default)'}
								class="transition-all duration-300"
							/>
						{/each}
					</g>

					<!-- Nodes -->
					<g>
						{#each positionedNodes as node}
							{@const tier = TIERS[tierOf(node)]}
							{@const isActive = hoveredNodeId === node.id || selectedNode?.id === node.id}
							<g
								transform="translate({node.x || CANVAS_W / 2}, {node.y || CANVAS_H / 2})"
								class="cursor-pointer transition-transform duration-200 hover:scale-[1.03]"
								onmouseenter={() => (hoveredNodeId = node.id)}
								onmouseleave={() => (hoveredNodeId = null)}
								onclick={() => (selectedNode = node)}
								onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectedNode = node; }}
								tabindex="0"
								role="button"
								aria-label="{node.name}, {tier.label}"
							>
								<!-- Dark Studio Card Body -->
								<rect
									x={-CARD_W / 2} y={-CARD_H / 2} width={CARD_W} height={CARD_H} rx="8" ry="8"
									fill="#1c1c1c"
									stroke={isActive ? '#3ecf8e' : '#333333'}
									stroke-width={isActive ? 2 : 1}
								/>
								<!-- Accent Strip -->
								<rect x={-CARD_W / 2} y={-CARD_H / 2} width="4" height={CARD_H} rx="2" ry="2" fill={tier.accent} />

								{#if node.image}
									<image href={node.image} x={-CARD_W / 2 + 6} y={-CARD_H / 2 + 6} width="32" height="32"
										clip-path="url(#avatar-clip)" preserveAspectRatio="xMidYMid slice" />
								{:else}
									<rect x={-CARD_W / 2 + 6} y={-CARD_H / 2 + 6} width="32" height="32" rx="6" ry="6" fill="#262626" />
									<text x={-CARD_W / 2 + 22} y={-CARD_H / 2 + 22} text-anchor="middle" fill={tier.accent} font-size="11" font-weight="700">
										{node.name.substring(0, 2).toUpperCase()}
									</text>
								{/if}

								<text x={-CARD_W / 2 + 44} y="-3" fill="#ededed" font-size="11" font-weight="700" class="select-none font-sans">
									{node.name.length > 14 ? node.name.substring(0, 13) + '…' : node.name}
								</text>
								<text x={-CARD_W / 2 + 44} y="12" fill={tier.accent} font-size="9" font-weight="700" letter-spacing="0.04em" class="select-none uppercase">
									{tier.label}
								</text>
							</g>
						{/each}
					</g>
				</svg>

				<!-- Detail card on selection -->
				{#if selectedNode}
					{@const tier = TIERS[tierOf(selectedNode)]}
					<div class="sb-fade-in absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 rounded-lg border border-[#333] bg-[#171717] p-4 shadow-2xl">
						<div class="flex items-center gap-3.5 overflow-hidden">
							<div class="relative shrink-0">
								{#if selectedNode.image}
									<img src={selectedNode.image} alt={selectedNode.name} class="h-12 w-12 rounded-md border border-[#2e2e2e] object-cover" />
								{:else}
									<div class="flex h-12 w-12 items-center justify-center rounded-md text-sm font-bold bg-[#262626]" style="color: {tier.accent}">
										{selectedNode.name.substring(0, 2).toUpperCase()}
									</div>
								{/if}
								<span class="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[#171717]" style="background-color: {tier.accent}"></span>
							</div>
							<div class="overflow-hidden">
								<div class="truncate font-heading text-sm font-bold text-white">{selectedNode.name}</div>
								<div class="mt-0.5 text-xs text-[#a1a1aa] font-mono">
									{selectedNode.label === 'Song' ? 'User Liked Song Node' : `${tier.label} Node &bull; connects songs in graph`}
								</div>
							</div>
						</div>

						<div class="flex shrink-0 items-center gap-2 font-mono">
							{#if selectedNode.label === 'Song'}
								<a href="/song/{selectedNode.id}" class="sb-btn-primary px-3 py-1.5 text-xs">
									Inspect Song ➔
								</a>
							{/if}
							<button onclick={() => (selectedNode = null)} aria-label="Close" class="rounded p-1.5 text-[#a1a1aa] hover:text-white hover:bg-[#262626]">
								✕
							</button>
						</div>

					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>