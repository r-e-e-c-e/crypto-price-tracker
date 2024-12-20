export type Product = {
    id: string;
    base_currency: string;
    quote_currency: string;
    quote_increment: string;
    base_increment: string;
    display_name: string;
    min_market_funds: string;
    margin_enabled: boolean;
    post_only: boolean;
    limit_only: boolean;
    cancel_only: boolean;
    status: Status;
    status_message: string;
    trading_disabled: boolean;
    fx_stablecoin: boolean;
    max_slippage_percentage: string;
    auction_mode: boolean;
    high_bid_limit_percentage: string;
  }

  export type Status = 'online' | 'delisted' | 'offline' | 'maintenance';

  export type ProductsResponse = Product[];

