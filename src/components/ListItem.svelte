<script lang="ts">
	import type { ListItem } from '$lib/types/CurrencyList';
	import { formatNumber } from '$lib/utils';

	export let item: ListItem;
</script>

<li class="list-item">
	<div class="main-row">
		<div class="label mono">{item.label}</div>
		<div class="line"></div>
		<div class="price mono">
			{item.price ?? '—'}
		</div>
	</div>
	<div class="meta-row">
		<div class="metadata-item">
			<div class="key">Volume (24h):</div>
			<div class="value">${item.volume ? formatNumber(item.volume) : '—'}</div>
		</div>
		<div class="metadata-item">
			<div class="key">Last Updated:</div>
			<div class="value">{item.lastUpdated}</div>
		</div>
	</div>
</li>

<style lang="scss">
	.list-item {
		padding: var(--list-item-padding);
		transition: var(--transition);
		border-radius: 10px;
		&:hover {
			background: var(--list-item-background-hover);
			box-shadow: 0 4px 10px rgb(0 0 0 / 6%);
		}

		.main-row {
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: 14px;

			.label,
			.price {
				font-weight: 600;
				font-size: 18px;
			}

			.line {
				height: 2px;
				background: rgb(0 0 0 / 10%);
				flex: 1 1 auto;
			}
		}

		.meta-row {
			display: flex;
			margin-top: 6px;
			font-size: 16px;
			gap: 10px;
			color: var(--grey-blue);

			.metadata-item {
				display: flex;
				gap: 4px;

				.key {
					font-weight: bold;
				}
			}
		}
	}
</style>
