export type ListItem = {
	id: string;
	label: string;
	price: number | null;
	volume: number | null;
	lastUpdated: string;
};

export type StoredListData = { list: ListItem[]; storageDate: number };
