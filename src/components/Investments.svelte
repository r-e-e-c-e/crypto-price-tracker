<script lang="ts">
	import { currentProductsForInvestments, investments } from '$lib/stores/investmentsStore';
	import type { Investment } from '$lib/types/Investment';

	function getInvestmentValueLabel(investment: Investment) {
		const currentPriceForProduct = $currentProductsForInvestments[investment.label];
		const currentValueInUSD = currentPriceForProduct * investment.amount;
		return currentValueInUSD.toFixed(2);
	}
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
				<div class="current-price">
					Current price: ${$currentProductsForInvestments[investment.label]}
				</div>
				<div class="current-value">
					Current value: $<span class="value"> {getInvestmentValueLabel(investment)}</span>
				</div>
				<div
					class="diff"
					class:profit={$currentProductsForInvestments[investment.label] >
						investment.usdPerProductAtPurchase}
					class:loss={$currentProductsForInvestments[investment.label] <
						investment.usdPerProductAtPurchase}
				>
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

				.profit {
					color: green;
				}

				.loss {
					color: red;
				}
			}
		}
	}
</style>
