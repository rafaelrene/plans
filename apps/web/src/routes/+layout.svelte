<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';

	let { children } = $props();

	function reportError(error: unknown) {
		console.error('Failed to render Plans.', error);
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-black font-sans font-light text-white antialiased">
	<svelte:boundary onerror={reportError}>
		{@render children()}

		{#snippet failed()}
			<div class="flex min-h-screen items-center justify-center text-sm text-red-400">
				Could not load Plans.
			</div>
		{/snippet}
	</svelte:boundary>
</div>
