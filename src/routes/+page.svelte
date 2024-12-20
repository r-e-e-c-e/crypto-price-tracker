<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { derived, writable } from 'svelte/store';
	import type { ListItem } from '$lib/types/CurrencyList';
	import { fetchProducts, fetchTickerForId } from '$lib/api.js';
	import { createCoinbaseWebSocket } from '$lib/websocket.js';
	import {
		LIST_LOCAL_STORAGE_KEY,
		LOCAL_STORAGE_EXPIRY,
		LOCAL_STORAGE_THROTTLE
	} from '$lib/consts';
	import type { CoinbaseMessage } from '$lib/types/WebSocket';

	type StoredListData = { list: ListItem[]; storageDate: number };

	let inputRef: HTMLInputElement;

	let list = writable<ListItem[]>([]);
	let sortBy = writable<'currency' | 'price'>('currency');
	let sortOrder = writable<'asc' | 'desc'>('asc');
	let filterQuery = writable<string>('');

	let disconnectFromWS = writable<Function | null>(null);

	let throttleTimeout: ReturnType<typeof setTimeout> | null = null;

	onMount(async () => {
		const storedList = getListFromLocalStorage();

		if (storedList) {
			$list = storedList;
		} else {
			$list = await getList();

			// Persist fetched list data to localStorage
			persistListToLocalStorage();
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
			if (wsState.messages.length > 0) {
				batchUpdateList(wsState.messages);
			}
		});
		connect();

		list.subscribe((updatedList) => {
			if (!throttleTimeout) {
				persistListToLocalStorage();

				throttleTimeout = setTimeout(() => {
					throttleTimeout = null;
				}, LOCAL_STORAGE_THROTTLE);
			}
		});
	});

	function batchUpdateList(messages: CoinbaseMessage[]) {
		console.log(`Batch updating list with ${messages.length} items.`);

		list.update((currentList) => {
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

	function formatNumber(num: number): string {
		if (num < 10000) {
			return num.toFixed(2).toString(); // Show the number as is if less than 100K
		} else if (num >= 10000 && num < 1000000) {
			return (num / 1000).toFixed(2) + 'K'; // Convert to thousands (K)
		} else if (num >= 1000000 && num < 1000000000) {
			return (num / 1000000).toFixed(2) + 'M'; // Convert to millions (M)
		} else {
			return (num / 1000000000).toFixed(2) + 'B'; // Convert to billions (B)
		}
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

	function persistListToLocalStorage() {
		console.log('Persisting list data to localStorage.');
		localStorage.setItem(
			LIST_LOCAL_STORAGE_KEY,
			JSON.stringify({ list: $list, storageDate: Date.now() })
		);
	}

	function getLastUpdatedLabel() {
		const now = new Date(Date.now());
		return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
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
				lastUpdated
			};

			return listItem;
		});

		return newList;
	}

	function wait(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	async function getInitialPrices() {
		console.log('Fetching prices for list via REST queue.');

		const BATCH_SIZE = 10;
		const DELAY_BETWEEN_BATCHES = 1100;

		let itemsToFetch: ListItem[] = [...$sortedList];
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
	}

	const filteredList = derived([list, filterQuery], ([$list, $filterQuery]) => {
		return $filterQuery.length === 0
			? $list
			: $list.filter((item) => item.label.toLowerCase().includes($filterQuery.toLowerCase()));
	});

	const sortedList = derived(
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

	function setSortCriteria(criteria: 'currency' | 'price') {
		console.log(`Sorting list by ${criteria} ${$sortOrder === 'asc' ? 'desc' : 'asc'}.`);

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
</script>

<main>
	<header class="page-header">
		<h1 class="page-title">Crypto Price Tracker</h1>
		<button
			onclick={() => {
				//TODO: Implement invest modal.
			}}>Invest</button
		>
	</header>

	<label class="search-input" for="search">
		<input
			bind:this={inputRef}
			name="search"
			type="text"
			placeholder="Search currencies..."
			bind:value={$filterQuery}
		/>
		<svg
			class="search-icon"
			width="22"
			height="22"
			viewBox="0 0 22 22"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M21.7073 20.293L16.032 14.6178C17.3089 13.0241 18.0032 11.0421 18 9C18 4.0295 13.9707 0 9 0C4.0295 0 0 4.0295 0 9C0 13.9705 4.0295 18 9 18C11.125 18 13.078 17.2635 14.6178 16.0317L20.293 21.707C20.3857 21.8 20.4959 21.8738 20.6173 21.924C20.7386 21.9743 20.8687 22.0001 21 22C21.1978 22 21.3911 21.9414 21.5556 21.8315C21.72 21.7216 21.8482 21.5655 21.9239 21.3828C21.9996 21.2001 22.0194 20.999 21.9808 20.805C21.9423 20.6111 21.8471 20.4329 21.7073 20.293ZM9 16C5.134 16 2 12.866 2 9C2 5.134 5.134 2 9 2C12.8663 2 16 5.134 16 9C16 12.866 12.8663 16 9 16Z"
				fill="#545A6E"
			/>
		</svg>
		{#if $filterQuery.length > 0}
			<button
				class="clear"
				onclick={() => {
					$filterQuery = '';
					inputRef?.focus();
				}}
				aria-label="Clear input text"
			>
				<svg
					width="9"
					height="10"
					viewBox="0 0 9 10"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M8.38898 7.71L5.63798 4.9585L8.38798 2.2075L6.97448 0.792496L4.22298 3.5435L1.47198 0.792496L0.0579834 2.2075L2.80798 4.9585L0.0579834 7.7095L1.47298 9.1235L4.22298 6.3725L6.97298 9.1235L8.38898 7.71Z"
						fill="black"
					/>
				</svg>
			</button>
		{/if}
	</label>

	<div class="list">
		<header class="list-header">
			<button
				class="header-button"
				class:sorted={$sortBy === 'currency'}
				class:desc={$sortBy === 'currency' && $sortOrder === 'desc'}
				onclick={() => setSortCriteria('currency')}
			>
				<div>Currency</div>
				<svg
					class="sorted-icon"
					width="16"
					height="20"
					viewBox="0 0 16 20"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M7.703 18.376L6.89101 19.188L7.703 20L8.51499 19.188L7.703 18.376ZM8.8515 1.1485C8.8515 0.8439 8.7305 0.551774 8.51511 0.336388C8.29972 0.121003 8.0076 0 7.703 0C7.3984 0 7.10627 0.121003 6.89088 0.336388C6.6755 0.551774 6.5545 0.8439 6.5545 1.1485H8.8515ZM0 12.297L6.89101 19.188L8.51499 17.564L1.62398 10.673L0 12.297ZM8.51499 19.188L15.406 12.297L13.782 10.673L6.89101 17.564L8.51499 19.188ZM8.8515 18.376V1.1485H6.5545V18.376H8.8515Z"
						fill="#2A73ED"
					/>
				</svg>
			</button>
			<button
				class="header-button"
				class:sorted={$sortBy === 'price'}
				class:desc={$sortBy === 'price' && $sortOrder === 'desc'}
				onclick={() => setSortCriteria('price')}
			>
				<div>Price (USD)</div>
				<svg
					class="sorted-icon"
					width="16"
					height="20"
					viewBox="0 0 16 20"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M7.703 18.376L6.89101 19.188L7.703 20L8.51499 19.188L7.703 18.376ZM8.8515 1.1485C8.8515 0.8439 8.7305 0.551774 8.51511 0.336388C8.29972 0.121003 8.0076 0 7.703 0C7.3984 0 7.10627 0.121003 6.89088 0.336388C6.6755 0.551774 6.5545 0.8439 6.5545 1.1485H8.8515ZM0 12.297L6.89101 19.188L8.51499 17.564L1.62398 10.673L0 12.297ZM8.51499 19.188L15.406 12.297L13.782 10.673L6.89101 17.564L8.51499 19.188ZM8.8515 18.376V1.1485H6.5545V18.376H8.8515Z"
						fill="#2A73ED"
					/>
				</svg></button
			>
		</header>
		{#if $sortedList.length > 0}
			<ul class="list-items">
				{#each $sortedList as item}
					<li class="list-item">
						<div class="main-row">
							<div class="label mono">{item.label}</div>
							<div class="price mono">{item.price ?? '—'}</div>
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
				{/each}
			</ul>
		{:else}
			<p class="empty-message">No currencies match your search.</p>
		{/if}
	</div>
</main>

<style lang="scss">
	:root {
		--blue: #2a73ed;
		--grey-blue: #545a6e;
		--body-background: #f9f5f1;
		--list-item-padding: 14px;
		--list-item-background-hover: #fff;
		--transition: all 120ms ease-out;
	}

	:global(html) {
		padding: 0;
		margin: 0;
	}
	:global(body) {
		padding: 0;
		margin: 0;
		background: var(--body-background);
		font-family:
			'Lato',
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			Roboto,
			Oxygen,
			Ubuntu,
			Cantarell,
			'Open Sans',
			'Helvetica Neue',
			sans-serif;
		overflow-y: scroll;
	}

	:global(*, *:before, *:after) {
		box-sizing: border-box;
	}

	:global(button) {
		background: var(--blue);
		border: 0;
		height: 46px;
		padding: 0 20px;
		min-width: 100px;
		border-radius: 4px;
		color: #fff;
		font-weight: 900;
		font-size: 16px;
		text-shadow: 0 2px 1px rgb(0 0 0 / 20%);
		box-shadow:
			0 14px 12px -10px rgb(0 0 0 / 14%),
			0 4px 10px rgb(0 0 0 / 14%);
		transition: var(--transition);

		&:hover {
			cursor: pointer;
		}
	}

	.mono {
		font-family: 'Azeret Mono', serif;
		font-optical-sizing: auto;
	}

	main {
		max-width: 768px;
		margin: 0 auto;
		padding-top: 30px;
		padding-bottom: 80vh;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		margin-bottom: 20px;

		.page-title {
			font-family: 'Castoro', Georgia, 'Times New Roman', Times, serif;
			margin: 0;
		}
	}

	.search-input {
		height: 56px;
		display: flex;
		position: relative;
		--search-icon-gap: 14px;
		--search-icon-size: 20px;
		--icon-label-gap: 6px;

		input {
			display: block;
			width: 100%;
			padding-left: calc(var(--search-icon-gap) + var(--search-icon-size) + var(--icon-label-gap));
			border: 2px solid #d3d6db;
			border-radius: 4px;
			font-size: 16px;
			font-family: inherit;
			box-shadow:
				0 6px 14px rgba(0, 0, 0, 0.02),
				0 12px 10px -8px rgba(0, 0, 0, 0.06);
		}

		svg.search-icon {
			position: absolute;
			left: var(--search-icon-gap);
			top: 50%;
			translate: 0 -50%;
			height: var(--search-icon-size);
			width: var(--search-icon-size);
		}

		button.clear {
			position: absolute;
			min-width: auto;
			right: 10px;
			top: 50%;
			translate: 0 -50%;
			border: 0;
			padding: 0;
			margin: 0;
			width: 32px;
			height: 32px;

			display: grid;
			place-content: center;

			background: var(--grey-blue);
			border-radius: 50%;
			transition: var(--transition);

			&:hover {
				background: var(--blue);
				cursor: pointer;
			}

			svg {
				height: 12px;
				width: 12px;

				path {
					fill: white;
				}
			}
		}
	}
	.list {
		margin-top: 20px;

		.list-header {
			display: flex;
			justify-content: space-between;
			border-bottom: 2px solid #d3d6db;
			margin-bottom: 10px;

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
					display: none;
					transition: var(--transition);
					height: 16px;
				}

				&.sorted {
					.sorted-icon {
						display: block;
					}

					&.desc {
						.sorted-icon {
							rotate: 180deg;
						}
					}
				}

				&:hover {
					cursor: pointer;
					color: var(--blue);
				}
			}
		}

		.list-items {
			list-style: none;
			padding: 0;
			margin: 0;

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

					.label,
					.price {
						font-weight: 600;
						font-size: 18px;
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
		}
	}

	.empty-message {
		text-align: center;
		font-size: 18px;
		font-weight: 900;
		margin-top: 50px;
	}
</style>
