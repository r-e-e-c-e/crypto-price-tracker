import { INVESTMENTS_LOCAL_STORAGE_KEY } from '$lib/consts';
import type { Investment } from '$lib/types/Investment';
import { derived, writable } from 'svelte/store';
import { sortedList } from './currencyListStore';

export const investments = writable<Investment[]>([]);

export const currentProductsForInvestments = derived(
	[investments, sortedList],
	([$investments, $sortedList]) => {
		const investmentsIdsSet = new Set($investments.map((investment) => investment.id));
		return $sortedList
			.filter((item) => investmentsIdsSet.has(item.id))
			.reduce(
				(obj, item) => {
					obj[item.label] = item.price!;
					return obj;
				},
				{} as Record<string, number>
			);
	}
);

investments.subscribe((latestInvestments) => {
	if (latestInvestments.length > 0) {
		persistInvestments(latestInvestments);
	}
});

export function persistInvestments(investments: Investment[]) {
	localStorage.setItem(INVESTMENTS_LOCAL_STORAGE_KEY, JSON.stringify(investments));
}

export function getInvestmentsFromLocalStorage() {
	let data: Investment[] | null = null;

	// check localStorage for previous investments
	const storedInvestmentsData = localStorage.getItem(INVESTMENTS_LOCAL_STORAGE_KEY);

	if (storedInvestmentsData !== null) {
		const storedInvestments: Investment[] = JSON.parse(storedInvestmentsData);
		data = storedInvestments;
	}

	return data;
}
