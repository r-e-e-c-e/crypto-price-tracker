<script>
	import { filteredList, sortedList } from '$lib/stores/currencyListStore';
	import ListHeader from './ListHeader.svelte';
	import ListItem from './ListItem.svelte';
</script>

<div class="list">
	<ListHeader />
	{#if $filteredList.length > 0}
		<ul class="list-items">
			{#each $filteredList as item}
				<ListItem {item} />
			{/each}
		</ul>
	{:else}
		<p class="empty-message">No currencies match your search.</p>
	{/if}
</div>

<style>
	.list {
		.list-items {
			list-style: none;
			padding: 0;
			margin: 0;
		}

		.empty-message {
			text-align: center;
			font-size: 18px;
			font-weight: 900;
			margin-top: 50px;
		}
	}
</style>
