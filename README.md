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

Docs: https://docs.cdp.coinbase.com/advanced-trade/reference/retailbrokerageapi_getproducts

#### Cryptocurrency Ticker Endpoint

https://api.exchange.coinbase.com/products/{product_id}/ticker

#### WebSocket Feed Info

https://docs.cdp.coinbase.com/exchange/docs/websocket-overview

#### Public API Rate Limits

Requests per second per IP: 10

Requests per second per IP in bursts: Up to 15

---

## Development Log

1. Get one off data example from Coinbase Products API to play around with locally.
2. Create TypeScript types of received data objects.
3. Send local example data to frontend via sveltekit loader to get a basic list displaying.
4. Check out ticker API.
5. Coinbase recommends to use WebSocket rather than polling. So will take the WS approach.
6. Investigate WS setup.
7. Coinbase Market Data feed is available without authentication.
8. Implement websocket file for connecting and handling messages.
9. Implement reusable store to init WS.
10. Got 2 cryptocurrencies live updating via WS through hard coded IDs.
11. Now to architect for performance for 50+ cryptocurrencies at the same time.
12. Create types for WS state and messages.
13. Create a map in data store that holds the latest price for each currency.
14. https://docs.cdp.coinbase.com/exchange/docs/websocket-best-practices
15. There are 200+ currencies to display. Questions:
    1. Should I call /products on each page load or should I persist the list (in local storage or db) with a cache expiry.
    2. The /products response does not include a price. So have to call /ticker for each currency. With a rate limit of 10 per second, that would take 20+ seconds to load. Which is unacceptable.
    3. Should I wait until all prices for each currency are fetched via a queue before enabling the WebSocket connection? Or should I combine the REST responses with the WS messages for quicker filling of data?
    4. Should I have the server constantly fetching up to date data as a cache and then enable WS connection right away on page load?
    5. Should I only enable WS messages for currencies that are currently displaying on screen and within search filter?
16. Save list data periodically in localStorage. Pull on load. Check expiry. Clear if expired.
17. Scan through entire products list via a 10 by 10 queue to get initial prices list. Also connect to WS to get some live updates straight away.
18. Turns out, upon connecting to WS, the WS responds with all of the latest prices in the subscription message. So no need to scan through via the queue.
19. I created most of the app in the single main page component for speed, but now need to break it into multiple components and stores.
    1. Create list store.
    2. Clean up types.
    3. Create utils and consts files.
20. Create investments modal with form.
21. Create investments overview component to show on main page.
    1. Add investment date, and up/down calc.
22. Create investments store.
    1. Create mapping from main list from investments list to get current value.

## Notes

I was originally going to store all data in a SqlLite DB file, but decided to instead to use SvelteKit's server actions to deliver Coinbase's products, and then cache them in a JSON file on the server.

But then I thought to simply use local storage for this project, as it fulfills the needs of painting data very quickly upon loading the page with persisted data from the previous session.

To improve this project I would move the Coinbase WebSocket connection to the backend, with the backend managing WebSockets to it's clients separately.

I would add unit tests for each component. And E2E tests for the investment flow, searching, and sorting.

I would also add a notification system instead of using window.alert();

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
