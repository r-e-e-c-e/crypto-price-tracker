<script lang="ts">
	import type { MouseEventHandler } from 'svelte/elements';

	export let onInvestClick: MouseEventHandler<HTMLButtonElement>;
	export let liveUpdatingEnabled: boolean = false;
</script>

<header class="page-header">
	<div class="title-wrapper">
		<h1 class="page-title">Crypto Price Tracker</h1>
		<div class="live-update-status" class:live={liveUpdatingEnabled}>
			<div class="indicator"></div>
			{liveUpdatingEnabled ? 'Live' : 'Not live'}
		</div>
	</div>
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

		.title-wrapper {
			display: flex;
			align-items: center;
			gap: 14px;
		}
		.live-update-status {
			display: flex;
			align-items: center;
			padding: 6px 8px;
			border-radius: 6px;
			background: rgb(0 0 0 / 6%);
			gap: 3px;
			font-size: 12px;
			font-weight: 900;
			color: rgb(0 0 0 / 50%);

			.indicator {
				width: 10px;
				aspect-ratio: 1 / 1;
				border-radius: 50%;
				background: rgb(255, 86, 86);
			}

			&.live {
				.indicator {
					background: rgb(7, 182, 7);
				}
			}
		}
	}
</style>
