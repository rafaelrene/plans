<script lang="ts">
	import { getOwnerHome } from './plans.remote';

	const home = getOwnerHome();
</script>

{#if (await home) === null}
	<main class="flex min-h-screen items-center justify-center px-6">
		<div class="w-full max-w-sm space-y-6">
			<div class="h-1 w-10 bg-orange-500"></div>
			<h1 class="text-xs font-normal tracking-[0.3em] text-white uppercase">
				Plans<span class="text-orange-500">.</span>
			</h1>
			<div class="space-y-2">
				<p class="text-sm text-white">No Plans yet.</p>
				<p class="text-sm text-white/50">Upload an HTML Plan with the CLI to get started.</p>
			</div>
		</div>
	</main>
{/if}
