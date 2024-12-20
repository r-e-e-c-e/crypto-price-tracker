import type { Product } from './types/ProductsAPI';
import type { TickerResponse } from './types/TickerAPI';

const COINBASE_API_BASE = 'https://api.exchange.coinbase.com';

export async function fetchProducts(): Promise<Product[]> {
	console.log('Fetching products from Coinbase.');

	const response = await fetch(`${COINBASE_API_BASE}/products`);

	if (!response.ok) {
		throw new Error(`Failed to fetch products: ${response.statusText}`);
	}

	const products: Product[] = await response.json();

	return products;
}

export async function fetchTickerForId(id: string) {
	console.log(`Fetching ticker price from Coinbase for ${id}.`);

	const response = await fetch(`${COINBASE_API_BASE}/products/${id}/ticker`);

	if (!response.ok) {
		throw new Error(`Failed to fetch ticker for ${id}: ${response.statusText}`);
	}

	const data: TickerResponse = await response.json();

	return { id, price: Number(data.price), volume: Number(data.volume) };
}
