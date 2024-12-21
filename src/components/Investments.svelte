<script lang="ts">
	import { currentProductsForInvestments, investments } from '$lib/stores/investmentsStore';
</script>

<div class="investments">
	<h3 class="heading">Your Investments</h3>
	<div class="investments-list">
		{#each $investments as investment}
			<div class="investment">
				<div class="amount">
					${investment.usdInvested} invested for
					{investment.amount}
					{investment.label} @ ${investment.usdPerProductAtPurchase} each
				</div>
				<div class="date">
					Investment Date:
					{new Date(investment.date).toLocaleDateString()}
					{new Date(investment.date).toLocaleTimeString()}
				</div>
				<div class="current-value">
					Current value: $<span
						class="value"
						class:profit={$currentProductsForInvestments[investment.label] >
							investment.usdPerProductAtPurchase}
						class:loss={$currentProductsForInvestments[investment.label] <
							investment.usdPerProductAtPurchase}
						>{$currentProductsForInvestments[investment.label]}</span
					>
				</div>
				<div class="diff">
					{$currentProductsForInvestments[investment.label] > investment.usdPerProductAtPurchase
						? 'Up'
						: 'Down'}
					${Math.abs(
						$currentProductsForInvestments[investment.label] - investment.usdPerProductAtPurchase
					).toFixed(2)}
				</div>
			</div>
		{/each}
	</div>
</div>

<style lang="scss">
	.investments {
		background: rgb(0 0 0 / 6%);
		border-radius: 14px;
		padding: 20px;

		.heading {
			margin: 0 0 14px;
		}

		.investments-list {
			display: flex;
			flex-direction: column;
			gap: 20px;

			.investment {
				display: flex;
				flex-direction: column;
				gap: 3px;

				.amount {
					font-weight: bold;
				}

				.current-value .profit {
					color: green;
				}

				.loss {
					color: red;
				}
			}
		}
	}
</style>
