# Crypto Price Tracker README

## Project Goal

Display real-time updates of cryptocurrencies using Coinbase APIs.

Allow sorting and filtering of cryptocurrencies, and implement a mock investment feature.

## Technology

[SvelteKit](https://svelte.dev/docs/kit/creating-a-project) with WebSockets for live updating of prices, to match the current requirements of the role.

Add a local storage cache with of Coinbase data to prevent Coinbase rate limits being reached. This could have been a Redis cache, but that would be out of scope for frontend focused project.

I would normally use PNPM for dependency management for performance, but in this case I will use NPM for ease of set up.

For sorting and filtering, a ready-made component such as [AG-Grid](https://www.ag-grid.com/javascript-data-grid/getting-started//) would be the fastest solution. But the basis of this project, I will create a custom solution.

## Design

I would normally create wireframes and prototypes in Figma for larger features such as this before proceeding with development. But with this being a take-home project with a small scope, I will design as I go along.

## Coinbase APIs

#### Docs

https://docs.cdp.coinbase.com/exchange/docs/welcome

#### Cryptocurrencies List Endpoint

https://api.exchange.coinbase.com/products

#### Cryptocurrency Ticker Endpoint

https://api.exchange.coinbase.com/products/{product_id}/ticker

#### WebSocket Feed Info

https://docs.cdp.coinbase.com/exchange/docs/websocket-overview

#### Public API Rate Limits

Requests per second per IP: 10

Requests per second per IP in bursts: Up to 15

---

---

---

## Running the Project

1. Install latest LTS version of [Node](https://nodejs.org/en).
2. Clone repo.
3. Open root folder in IDE (e.g. [VS Code](https://code.visualstudio.com/download)).
4. Install dependencies in the terminal with: `npm install`.
5. Run app in dev mode with: `npm run dev`.

## Building the Project

1. Run: `npm run build`.

To preview the production build run: `npm run preview`.
