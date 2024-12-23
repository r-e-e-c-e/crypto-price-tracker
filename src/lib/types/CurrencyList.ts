export type ListItem = {
	id: string;
	label: string;
	price: number | null;
	volume: number | null;
	increment: number;
	lastUpdated: string;
};

export type StoredListData = { list: ListItem[]; storageDate: number };
