export type WebSocketState = {
	connected: boolean;
	messages: CoinbaseMessage[];
	error: string | null;
};

export type TickerMessage = {
	type: 'ticker';
	sequence: number;
	product_id: string;
	price: string;
	open_24h: string;
	volume_24h: string;
	low_24h: string;
	high_24h: string;
	volume_30d: string;
	best_bid: string;
	best_ask: string;
	side: 'buy' | 'sell';
	time: string; // ISO 8601 timestamp
	trade_id: number;
	last_size: string;
};

export type SubscriptionConfirmation = {
	type: 'subscriptions';
	channels: Channel[];
};

export type ErrorMessage = {
	type: 'error';
	message: string;
	reason: string;
};

export type Channel = {
	name: string;
	product_ids: string[];
};

export type CoinbaseMessage = TickerMessage | SubscriptionConfirmation | ErrorMessage;
