<script lang="ts">
	import { filterQuery } from '$lib/stores/currencyListStore';
	import SearchIcon from './icons/SearchIcon.svelte';

	let inputRef: HTMLInputElement;
</script>

<label class="search-input" for="search">
	<input
		bind:this={inputRef}
		name="search"
		type="text"
		placeholder="Search currencies..."
		bind:value={$filterQuery}
	/>

	<div class="search-icon">
		<SearchIcon />
	</div>

	{#if $filterQuery.length > 0}
		<button
			class="clear"
			onclick={() => {
				$filterQuery = '';
				inputRef?.focus();
			}}
			aria-label="Clear input text"
		>
			<svg width="9" height="10" viewBox="0 0 9 10" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M8.38898 7.71L5.63798 4.9585L8.38798 2.2075L6.97448 0.792496L4.22298 3.5435L1.47198 0.792496L0.0579834 2.2075L2.80798 4.9585L0.0579834 7.7095L1.47298 9.1235L4.22298 6.3725L6.97298 9.1235L8.38898 7.71Z"
					fill="black"
				/>
			</svg>
		</button>
	{/if}
</label>

<style lang="scss">
	.search-input {
		height: 56px;
		display: flex;
		position: relative;
		--search-icon-gap: 14px;
		--search-icon-size: 22px;
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

		.search-icon {
			position: absolute;
			left: var(--search-icon-gap);
			top: 50%;
			translate: 0 -50%;
			height: var(--search-icon-size);
			width: var(--search-icon-size);
			display: flex;
			place-items: center;
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
</style>
