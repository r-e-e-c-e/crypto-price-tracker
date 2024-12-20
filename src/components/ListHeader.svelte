<script>
	import { setSortCriteria, sortBy, sortOrder } from '$lib/stores/currencyListStore';
	import ArrowIcon from './icons/ArrowIcon.svelte';
</script>

<header class="list-header">
	<button class="header-button" onclick={() => setSortCriteria('currency')}>
		<div>Name</div>
		{#if $sortBy === 'currency'}
			<div class="sorted-icon" class:rotated={$sortOrder === 'desc'}>
				<ArrowIcon />
			</div>
		{/if}
	</button>
	<button
		class="header-button"
		class:sorted={$sortBy === 'price'}
		class:desc={$sortBy === 'price' && $sortOrder === 'desc'}
		onclick={() => setSortCriteria('price')}
	>
		<div>Price (USD)</div>
		{#if $sortBy === 'price'}
			<div class="sorted-icon" class:rotated={$sortOrder === 'desc'}>
				<ArrowIcon />
			</div>
		{/if}
	</button>
</header>

<style lang="scss">
	.list-header {
		display: flex;
		justify-content: space-between;
		border-bottom: 3px solid var(--grey-blue);
		margin-bottom: 10px;
		position: sticky;
		top: 0;
		background: var(--body-background);

		button.header-button {
			display: flex;
			align-items: center;
			min-width: auto;
			box-shadow: none;
			text-shadow: none;
			gap: 4px;
			padding: 0 var(--list-item-padding);
			border: 0;
			background: none;
			font-size: 16px;
			color: var(--grey-blue);
			font-weight: 600;

			.sorted-icon {
				transition: var(--transition);
				height: 16px;
				width: 16px;
				display: flex;
				align-items: center;

				&.rotated {
					rotate: 180deg;
				}
			}

			&:hover {
				cursor: pointer;
				color: var(--blue);
			}
		}

		&::after {
			content: '';
			display: block;
			height: 10px;
			background: linear-gradient(to bottom, var(--body-background), transparent);
			position: absolute;
			left: 0;
			right: 0;
			bottom: -13px;
		}
	}
</style>
