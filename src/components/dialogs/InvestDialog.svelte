<script lang="ts">
	import InvestForm from '../forms/InvestForm.svelte';

	let modalRef: HTMLDialogElement;

	export function closeModal() {
		modalRef.close();
	}

	export function openModal() {
		modalRef.showModal();
	}
</script>

<dialog bind:this={modalRef}>
	<h1 class="dialog-title">Invest</h1>
	<InvestForm onCancel={closeModal} onClose={closeModal} />
</dialog>

<style lang="scss">
	dialog {
		padding: 20px;
		border: none;
		border-radius: 6px;
		box-shadow: 0 14px 20px rgba(0, 0, 0, 0.2);
		margin-top: max(12vh, 40px);
		min-width: 480px;

		.dialog-title {
			font-size: 28px;
			margin: 0 0 20px;
		}
	}

	dialog::backdrop {
		background-color: rgba(0, 0, 0, 0.5);
	}
</style>
