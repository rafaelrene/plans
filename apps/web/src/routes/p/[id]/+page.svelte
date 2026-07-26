<script lang="ts">
	import { formatPlanDate } from '#lib/plan';
	import { getPlanView } from '../../plans.remote';

	let { params } = $props();

	const view = $derived(await getPlanView(params.id));
	let open = $state(false);
	let copyState = $state<{ id: string; failed: boolean } | null>(null);

	async function copyLink(id: string) {
		try {
			await navigator.clipboard.writeText(`${location.origin}/p/${id}`);
			copyState = { id, failed: false };
		} catch {
			copyState = { id, failed: true };
		}

		setTimeout(() => {
			if (copyState?.id === id) {
				copyState = null;
			}
		}, 1500);
	}
</script>

<svelte:head>
	<title>{view.plan?.title ?? 'Plan not found'} — Plans</title>
</svelte:head>

{#if view.plan}
	<iframe
		title={view.plan.title}
		srcdoc={view.plan.html}
		sandbox="allow-scripts"
		class="fixed inset-0 h-full w-full border-0 bg-white"
	></iframe>
{:else}
	<div class="fixed inset-0 flex items-center justify-center text-sm text-white/50">
		Plan not found
	</div>
{/if}

{#if view.owner}
	<!-- Owner chrome deliberately overlays the full-bleed Plan. -->
	<div class="fixed top-5 left-7 z-30 flex items-center gap-2.5">
		<div class="h-2.5 w-2.5 bg-orange-500"></div>
		<span class="text-[10px] tracking-[0.3em] text-white/50 uppercase">Plans</span>
	</div>

	<nav
		aria-label="Plans"
		class="fixed inset-y-0 left-0 z-40 w-4"
		onmouseenter={() => (open = true)}
		onmouseleave={() => (open = false)}
		onfocusin={() => (open = true)}
		onfocusout={(event) => {
			if (!event.currentTarget.contains(event.relatedTarget as Node)) {
				open = false;
			}
		}}
	>
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
				<span class="text-[10px] tracking-widest text-white/30 uppercase">
					{view.plans.length}
				</span>
			</div>

			<div class="flex-1 overflow-y-auto py-1">
				{#each view.plans as plan (plan.id)}
					<div class="flex items-stretch {plan.id === params.id ? 'bg-orange-500/15' : ''}">
						<a
							href={`/p/${plan.id}`}
							aria-current={plan.id === params.id ? 'page' : undefined}
							class="min-w-0 flex-1 border-l-[3px] py-2.5 pr-2 pl-4 transition-colors
								{plan.id === params.id
								? 'border-orange-500 text-orange-400'
								: 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'}"
						>
							<p class="truncate text-sm">{plan.title}</p>
							<p class="mt-0.5 text-[10px] tracking-wider text-white/40 uppercase">
								{formatPlanDate(plan.uploadedAt)}
							</p>
						</a>
						<button
							onclick={() => copyLink(plan.id)}
							title="Copy Share Link"
							class="shrink-0 px-3 text-[10px] tracking-widest uppercase transition-colors
								{copyState?.id === plan.id
								? copyState.failed
									? 'text-red-400'
									: 'text-orange-400'
								: 'text-white/30 hover:text-orange-400'}"
						>
							{copyState?.id === plan.id ? (copyState.failed ? 'Failed' : '✓ Copied') : 'Copy'}
						</button>
					</div>
				{/each}
			</div>
		</aside>
	</nav>
{/if}
