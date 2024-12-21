<script lang="ts">
	import type { MouseEventHandler } from 'svelte/elements';

	export let onInvestClick: MouseEventHandler<HTMLButtonElement>;
</script>

<header class="page-header">
	<h1 class="page-title">Crypto Price Tracker</h1>
	<button onclick={onInvestClick}>Invest</button>
</header>

<style lang="scss">
	.page-header {
		display: flex;
		justify-content: space-between;

		.page-title {
			font-family: 'Castoro', Georgia, 'Times New Roman', Times, serif;
			margin: 0;
		}
	}
</style>
