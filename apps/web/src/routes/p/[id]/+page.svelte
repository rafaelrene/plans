<script lang="ts">
	import { page } from '$app/state';
	import { plans, findPlan, formatDate } from '../../plans';

	const currentId = $derived(page.params.id ?? '');
	const plan = $derived(findPlan(currentId));

	let open = $state(false);
	let copied = $state<string | null>(null);

	async function copyLink(id: string) {
		await navigator.clipboard.writeText(`${location.origin}/p/${id}`);
		copied = id;
		setTimeout(() => {
			if (copied === id) copied = null;
		}, 1500);
	}
</script>

<!-- Full-bleed plan frame: the plan gets the whole viewport. -->
<div
	class="fixed inset-0 flex items-center justify-center text-[11px] tracking-widest text-white/30 uppercase"
>
	{plan ? `${plan.title} — sandboxed iframe` : 'Plan not found'}
</div>

<!-- Persistent brand mark (below the sidebar): keeps a little orange on screen
     even while the sidebar is hidden. -->
<div class="fixed top-5 left-7 z-30 flex items-center gap-2.5">
	<div class="h-2.5 w-2.5 bg-orange-500"></div>
	<span class="text-[10px] tracking-[0.3em] text-white/50 uppercase">Plans</span>
</div>

<!-- Left hover zone: a thin strip catches the hover. The panel is absolutely
     positioned (so the zone stays thin) but remains a descendant, so keeping
     the pointer on it keeps `open` true. Focus handlers cover keyboard users. -->
<nav
	aria-label="Plans"
	class="fixed inset-y-0 left-0 z-40 w-4"
	onmouseenter={() => (open = true)}
	onmouseleave={() => (open = false)}
	onfocusin={() => (open = true)}
	onfocusout={(e) => {
		if (!e.currentTarget.contains(e.relatedTarget as Node)) open = false;
	}}
>
	<!-- Orange handle: the always-visible affordance while the sidebar is closed. -->
	<div
		style="box-shadow: 0 0 16px 1px rgba(249,115,22,0.7)"
		class="absolute top-1/2 left-0 h-20 w-2 -translate-y-1/2 rounded-r bg-orange-500 transition-opacity duration-200"
		class:opacity-0={open}
	></div>

	<aside
		style="transform: translateX({open ? '0' : '-100%'})"
		class="absolute inset-y-0 left-0 flex w-72 flex-col border-t-2 border-r border-t-orange-500 border-r-white/15 bg-black shadow-2xl shadow-black/60 transition-transform duration-200 ease-out"
	>
		<div class="flex items-center justify-between border-b border-white/15 px-5 py-4">
			<p class="text-[11px] tracking-[0.3em] text-white uppercase">
				Plans<span class="text-orange-500">.</span>
			</p>
			<span class="text-[10px] tracking-widest text-white/30 uppercase">{plans.length}</span>
		</div>

		<div class="flex-1 overflow-y-auto py-1">
			{#each plans as p (p.id)}
				<div class="flex items-stretch {p.id === currentId ? 'bg-orange-500/15' : ''}">
					<a
						href={`/p/${p.id}`}
						aria-current={p.id === currentId ? 'page' : undefined}
						class="min-w-0 flex-1 border-l-[3px] py-2.5 pr-2 pl-4 transition-colors
							{p.id === currentId
							? 'border-orange-500 text-orange-400'
							: 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'}"
					>
						<p class="truncate text-sm">{p.title}</p>
						<p class="mt-0.5 text-[10px] tracking-wider text-white/40 uppercase">
							{formatDate(p.uploadedAt)}
						</p>
					</a>
					<button
						onclick={() => copyLink(p.id)}
						title="Copy share link"
						class="shrink-0 px-3 text-[10px] tracking-widest uppercase transition-colors
							{copied === p.id ? 'text-orange-400' : 'text-white/30 hover:text-orange-400'}"
					>
						{copied === p.id ? '✓ Copied' : 'Copy'}
					</button>
				</div>
			{/each}
		</div>
	</aside>
</nav>
