<script lang="ts">
	import { list } from '$lib/stores/currencyListStore';
	import { investments } from '$lib/stores/investmentsStore';
	import { derived, writable } from 'svelte/store';

	export let onCancel: Function;
	export let onClose: Function;

	const formCryptocurrencyId = writable<string | null>(null);
	const formAmount = writable<number | null>(null);

	const sortedList = derived(list, ($list) => {
		return $list.sort((a, b) => {
			return a.label.localeCompare(b.label);
		});
	});

	const selectedItem = derived([formCryptocurrencyId, list], ([$formCryptocurrencyId, $list]) => {
		if ($formCryptocurrencyId === null) return null;
		return $list.find((item) => item.id === $formCryptocurrencyId) || null;
	});

	const amountOfProductToReceive = derived(
		[selectedItem, formAmount],
		([$selectedItem, $formAmount]) => {
			if (!$selectedItem || !$formAmount || !$selectedItem.price) return null;

			const amountPurchased: number = $formAmount / $selectedItem.price;
			const amountPurchasedRounded: number =
				Math.floor(amountPurchased / $selectedItem.increment) * $selectedItem.increment;

			return amountPurchasedRounded;
		}
	);

	const isDisabled = derived(
		[formCryptocurrencyId, formAmount],
		([$formCryptocurrencyId, $formAmount]) => {
			return $formCryptocurrencyId === null || $formAmount === null || $formAmount <= 0;
		}
	);

	function resetFormAndClose() {
		$formCryptocurrencyId = null;
		$formAmount = null;
		onClose();
	}

	function handleBuy(event: SubmitEvent) {
		event.preventDefault();

		if ($selectedItem && $amountOfProductToReceive && $formAmount) {
			investments.set([
				...$investments,
				{
					id: $selectedItem.id,
					label: $selectedItem.label,
					amount: $amountOfProductToReceive,
					usdInvested: $formAmount,
					usdPerProductAtPurchase: $selectedItem.price!,
					date: Date.now()
				}
			]);

			window.alert('Investment added to your portfolio successfully.'); //TODO: Replace with notification system.
		}

		resetFormAndClose();
	}
</script>

<form onsubmit={handleBuy}>
	<div class="fields">
		<label class="field">
			<div class="label">Cryptocurrency to buy <span class="required">*</span></div>
			<select name="cryptocurrency" id="cryptocurrency" bind:value={$formCryptocurrencyId}>
				<option disabled selected value="">-- Select an option --</option>
				{#each $sortedList as listItem}
					<option value={listItem.id}>{listItem.label}</option>
				{/each}
			</select>
		</label>

		<label class="field">
			<div class="label">Investment amount in USD <span class="required">*</span></div>
			<input type="number" name="amount" id="amount" bind:value={$formAmount} min="1" />
		</label>
	</div>

	{#if $amountOfProductToReceive !== null && $selectedItem}
		<div class="amount-of-product">
			<p>Current price for {$selectedItem.label}: ${$selectedItem.price}.</p>
			<p>
				You will receive {$amountOfProductToReceive}
				{$selectedItem.label}.
			</p>
		</div>
	{/if}

	<div class="actions">
		<button
			type="button"
			onclick={() => {
				onCancel();
			}}>Cancel</button
		>
		<button class="primary" type="submit" disabled={$isDisabled}>Buy</button>
	</div>
</form>

<style lang="scss">
	form {
		min-width: 480x;
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: 20px;
		margin-bottom: 20px;
	}

	.field {
		.label {
			font-weight: bold;
			margin-bottom: 10px;

			.required {
				color: red;
			}
		}

		input,
		select {
			display: block;
			width: 100%;
			height: 40px;
			min-width: 300px;
			padding: 0 8px;
			font-size: 16px;
			font-family: inherit;
		}
	}

	.actions {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		margin-top: 30px;
	}
</style>
