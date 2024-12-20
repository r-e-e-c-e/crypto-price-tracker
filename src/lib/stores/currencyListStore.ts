import { fetchTickerForId } from '$lib/api';
import type { ListItem } from '$lib/types/CurrencyList';
import { getLastUpdatedLabel, wait } from '$lib/utils';
import { derived, writable } from 'svelte/store';

export const list = writable<ListItem[]>([]);
export const sortBy = writable<'currency' | 'price'>('currency');
export const sortOrder = writable<'asc' | 'desc'>('asc');
export const filterQuery = writable<string>('');

export const filteredList = derived([list, filterQuery], ([$list, $filterQuery]) => {
	return $filterQuery.length === 0
		? $list
		: $list.filter((item) => item.label.toLowerCase().includes($filterQuery.toLowerCase()));
});

export const sortedList = derived(
	[filteredList, sortBy, sortOrder],
	([$filteredList, $sortBy, $sortOrder]) => {
		return [...$filteredList].sort((a, b) => {
			let comparison = 0;

			if ($sortBy === 'currency') {
				comparison = a.label.localeCompare(b.label);
			} else if ($sortBy === 'price') {
				comparison = (a.price ?? 0) - (b.price ?? 0); //TODO: Improve null handling
			}

			return $sortOrder === 'asc' ? comparison : -comparison;
		});
	}
);

export function setSortCriteria(criteria: 'currency' | 'price') {
	sortOrder.subscribe((currSortOrder) => {
		console.log(`Sorting list by ${criteria} ${currSortOrder === 'asc' ? 'desc' : 'asc'}.`);
	});

	sortBy.update((current) => {
		if (current === criteria) {
			// Toggle sort order if the same criteria is clicked again
			sortOrder.update((order) => (order === 'asc' ? 'desc' : 'asc'));
		} else {
			// Set new sort criteria and reset order to ascending
			sortOrder.set('asc');
			return criteria;
		}
		return current;
	});
}

/**
 * DEPRECATED: No longer needed as WS provides all prices up front on load.
 */
export async function getInitialPrices() {
	console.log('Fetching prices for list via REST queue.');

	const BATCH_SIZE = 10;
	const DELAY_BETWEEN_BATCHES = 1100;

	sortedList.subscribe(async (latestSortedList) => {
		let itemsToFetch: ListItem[] = [...latestSortedList];
		let batchNumber = 0; //TODO: Remove. For logging only.

		while (itemsToFetch.length > 0) {
			batchNumber++;
			console.log(`Fetching batch ${batchNumber}. ${itemsToFetch.length} items remaining.`);

			const waitPromise = wait(DELAY_BETWEEN_BATCHES);
			const batch = itemsToFetch.slice(0, BATCH_SIZE);
			itemsToFetch = itemsToFetch.slice(BATCH_SIZE);

			const promises = batch.map((item) => {
				return fetchTickerForId(item.id);
			});

			const results = await Promise.allSettled(promises); //TODO: Handle failures

			// Update main list with new price data from batch
			list.update((currentList) => {
				const lastUpdated = getLastUpdatedLabel();

				results.forEach((result) => {
					if (result.status === 'fulfilled') {
						const tickerItem = result.value;

						if (tickerItem) {
							const index = currentList.findIndex((item) => item.id === tickerItem.id);

							if (index !== -1) {
								currentList[index] = {
									...currentList[index],
									price: tickerItem.price,
									volume: tickerItem.volume,
									lastUpdated
								};
							}
						}
					}
				});

				return currentList;
			});

			// If there's more to fetch, wait until after the rate limit
			if (itemsToFetch.length > 0) {
				await waitPromise;
			}
		}
	});
}
