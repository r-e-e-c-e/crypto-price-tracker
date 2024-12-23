<script lang="ts">
	import { fetchProducts } from '$lib/api.js';
	import {
		LIST_LOCAL_STORAGE_KEY,
		LOCAL_STORAGE_EXPIRY,
		LOCAL_STORAGE_THROTTLE
	} from '$lib/consts';
	import { list } from '$lib/stores/currencyListStore';
	import type { ListItem, StoredListData } from '$lib/types/CurrencyList';
	import type { CoinbaseMessage } from '$lib/types/WebSocket';
	import { getLastUpdatedLabel } from '$lib/utils';
	import { createCoinbaseWebSocket } from '$lib/websocket.js';
	import { onDestroy, onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import List from '../components/list/List.svelte';
	import Search from '../components/Search.svelte';
	import '../app.scss';
	import { getInvestmentsFromLocalStorage, investments } from '$lib/stores/investmentsStore';
	import Investments from '../components/Investments.svelte';
	import InvestDialog from '../components/dialogs/InvestDialog.svelte';
	import PageHeader from '../components/PageHeader.svelte';

	let wsConnected = writable(false);
	let disconnectFromWS = writable<Function | null>(null);
	let throttleTimeout: ReturnType<typeof setTimeout> | null = null;

	onMount(async () => {
		// Set page title
		document.title = 'Crypto Price Tracker';

		// Load list data from local storage or fetch
		const storedList = getListFromLocalStorage();

		if (storedList) {
			$list = storedList;
		} else {
			$list = await getList();

			// Persist fetched list data to localStorage
			persistListToLocalStorage($list);
		}

		// Load investments data from local storage
		const storedInvestments = getInvestmentsFromLocalStorage();

		if (storedInvestments) {
			$investments = storedInvestments;
		}

		// No longer needed, as WS provides all prices on subscribe.
		// getInitialPrices().then(() => {
		// 	persistListToLocalStorage();
		// });

		// Connect to Coinbase WS
		const productIdsToListenFor: string[] = $list.map((item) => item.id);
		const { connect, disconnect, subscribe } = createCoinbaseWebSocket(productIdsToListenFor);

		disconnectFromWS.set(disconnect);

		subscribe((wsState) => {
			wsConnected.set(wsState.connected);

			if (wsState.messages.length > 0) {
				batchUpdateList(wsState.messages);
			}
		});
		connect();

		list.subscribe((updatedList) => {
			if (!throttleTimeout) {
				persistListToLocalStorage(updatedList);

				throttleTimeout = setTimeout(() => {
					throttleTimeout = null;
				}, LOCAL_STORAGE_THROTTLE);
			}
		});
	});

	function batchUpdateList(messages: CoinbaseMessage[]) {
		console.log(`Batch updating list with ${messages.length} items.`);

		list.update((_) => {
			// Create map from array for quick lookup
			const listMap = new Map($list.map((item) => [item.id, item]));
			const lastUpdated = getLastUpdatedLabel();

			// Update each item from WS message
			messages.forEach((message) => {
				if (message.type === 'ticker') {
					const currentItem = listMap.get(message.product_id);
					if (currentItem) {
						const updatedItem: ListItem = {
							...currentItem,
							...{
								price: Number(message.price),
								volume: Number(message.volume_24h),
								lastUpdated: lastUpdated
							}
						};

						listMap.set(currentItem.id, updatedItem);
					}
				}
			});

			return Array.from(listMap.values());
		});
	}

	onDestroy(() => {
		$disconnectFromWS?.();
	});

	/**
	 * Get stored list data from local storage, checks for staleness.
	 */
	function getListFromLocalStorage() {
		let data: ListItem[] | null = null;

		// check localStorage for previous list data
		const storedListData = localStorage.getItem(LIST_LOCAL_STORAGE_KEY);

		// if not expired, use localStorage list
		if (storedListData !== null) {
			const parsedListData: StoredListData = JSON.parse(storedListData);

			if (Date.now() - parsedListData.storageDate < LOCAL_STORAGE_EXPIRY) {
				// not expired, so can use data
				data = parsedListData.list;
			} else {
				localStorage.removeItem(LIST_LOCAL_STORAGE_KEY);
			}
		}

		return data;
	}

	function persistListToLocalStorage(list: ListItem[]) {
		console.log('Persisting list data to localStorage.');
		localStorage.setItem(LIST_LOCAL_STORAGE_KEY, JSON.stringify({ list, storageDate: Date.now() }));
	}

	async function getList() {
		const allProducts = await fetchProducts();

		const filteredProducts = allProducts.filter((product) => {
			return product.quote_currency === 'USD' && product.status === 'online';
		});

		const lastUpdated = getLastUpdatedLabel();

		const newList = filteredProducts.map((product) => {
			const listItem: ListItem = {
				id: product.id,
				label: product.base_currency,
				price: null,
				volume: null,
				increment: Number(product.base_increment),
				lastUpdated
			};

			return listItem;
		});

		return newList;
	}

	let investDialogRef: InvestDialog;
</script>

<main>
	<PageHeader
		onInvestClick={() => investDialogRef.openModal()}
		liveUpdatingEnabled={$wsConnected}
	/>

	{#if $investments.length > 0}
		<Investments />
	{/if}

	<Search />

	<List />

	<InvestDialog bind:this={investDialogRef} />
</main>

<style lang="scss">
	main {
		display: flex;
		flex-direction: column;
		gap: 20px;
		max-width: 768px;
		margin: 0 auto;
		padding: 30px 30px 80vh;
	}
</style>
