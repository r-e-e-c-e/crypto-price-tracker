import { writable } from 'svelte/store';
import type { CoinbaseMessage, WebSocketState } from './types/WebSocket';

const SOCKET_URL = 'wss://ws-feed.exchange.coinbase.com';
const RECONNECT_INTERVAL = 2000;

export function createCoinbaseWebSocket(productIds: string[]) {
	let socket: WebSocket | null = null;
	let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
	let messageBuffer: CoinbaseMessage[] = [];
	let throttleTimeout: ReturnType<typeof setTimeout> | null = null;
	const LIST_UPDATE_THROTTLE = 500;

	const { subscribe, set, update } = writable<WebSocketState>({
		connected: false,
		messages: [],
		error: null
	});

	const connect = () => {
		console.log(`Connecting to WS: ${SOCKET_URL}`);
		socket = new WebSocket(SOCKET_URL);

		socket.onopen = () => {
			console.log(`Connected to WS: ${SOCKET_URL}`);
			set({ connected: true, messages: [], error: null });

			const subscribeMessage = {
				type: 'subscribe',
				product_ids: productIds,
				channels: ['ticker']
			};

			socket!.send(JSON.stringify(subscribeMessage));
		};

		socket.onmessage = (event: MessageEvent) => {
			try {
				const data: CoinbaseMessage = JSON.parse(event.data);
				console.log(data);

				if (data.type === 'error') {
					console.log(`Error occurred when subscribing to Coinbase WS channel.`);
					set({ connected: false, messages: [], error: data.reason });
				} else {
					messageBuffer.push(data);
				}

				if (!throttleTimeout) {
					throttleTimeout = setTimeout(() => {
						update((state) => {
							const newMessages = [...messageBuffer];
							messageBuffer = []; // Clear buffer

							return {
								...state,
								messages: newMessages
							};
						});

						throttleTimeout = null; // Reset throttle
					}, LIST_UPDATE_THROTTLE);
				}
			} catch (error) {
				console.error('Failed to parse WebSocket message:', error);
			}
		};

		socket.onerror = (event: Event) => {
			console.error('WebSocket error:', event);

			update((state) => ({
				...state,
				error: 'WebSocket encountered an error.'
			}));
		};

		socket.onclose = (event) => {
			console.warn(`WebSocket closed: ${event.code} ${event.reason}`);

			// Update state: connected
			update((state) => ({
				...state,
				connected: false
			}));

			// Attempt reconnection
			reconnectTimeout = setTimeout(() => {
				connect();
			}, RECONNECT_INTERVAL);
		};
	};

	const disconnect = () => {
		if (socket) socket.close();
		if (reconnectTimeout) clearTimeout(reconnectTimeout);
		set({ connected: false, messages: [], error: null });

		console.log(`Disconnected from WS: ${SOCKET_URL}`);
	};

	return {
		subscribe,
		connect,
		disconnect
	};
}
