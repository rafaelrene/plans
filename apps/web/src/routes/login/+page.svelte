<script lang="ts">
	import { loginOwner } from '../plans.remote';
</script>

<main class="flex min-h-screen items-center justify-center px-6">
	<form {...loginOwner} class="w-full max-w-sm space-y-10">
		<div class="space-y-3">
			<div class="h-1 w-10 bg-orange-500"></div>
			<h1 class="text-xs font-normal tracking-[0.3em] text-white uppercase">
				Plans<span class="text-orange-500">.</span>
			</h1>
			<p class="text-sm text-white/50">Sign in to manage and share your plans.</p>
		</div>
		<div class="space-y-5">
			<label class="block space-y-2">
				<span class="text-[10px] tracking-[0.2em] text-white/50 uppercase">Owner secret</span>
				{#each loginOwner.fields._secret.issues() ?? [] as issue (issue.message)}
					<span class="block text-xs text-red-400">{issue.message}</span>
				{/each}
				<input
					{...loginOwner.fields._secret.as('password')}
					required
					autocomplete="current-password"
					placeholder="••••••••••••"
					class="w-full border border-white/40 bg-black px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-500 focus:outline-none"
				/>
			</label>
			<button
				type="submit"
				disabled={loginOwner.pending > 0}
				class="w-full bg-orange-500 px-3 py-2.5 text-xs font-medium tracking-[0.2em] text-black uppercase transition-colors hover:bg-orange-400"
			>
				{loginOwner.pending ? 'Entering…' : 'Enter'}
			</button>
		</div>
	</form>
</main>
