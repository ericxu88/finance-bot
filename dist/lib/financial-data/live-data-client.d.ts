export interface StockData {
    ticker: string;
    current_price: number | null;
    market_cap: number | null;
    pe_ratio: number | null;
    dividend_yield: number | null;
    sector: string | null;
    industry: string | null;
    recent_prices: {
        dates: string[];
        close: number[];
        volume: number[];
    };
    metadata: {
        fetched_at: string;
        source: string;
    };
}
export interface IndicatorData {
    name: string;
    current_value: number;
    previous_value: number;
    change: number;
    date: string;
    source: string;
}
export interface EconomicIndicators {
    indicators: Record<string, IndicatorData>;
    metadata: {
        fetched_at: string;
    };
}
export interface MarketSummary {
    indices: Record<string, {
        name: string;
        current: number | null;
        previous_close: number | null;
        change_percent: number;
        recent_trend: number[];
    }>;
    metadata: {
        fetched_at: string;
    };
}
export declare class LiveFinancialDataClient {
    getStockData(ticker: string): Promise<StockData | null>;
    getEconomicIndicators(): Promise<EconomicIndicators | null>;
    getMarketSummary(): Promise<MarketSummary | null>;
    healthCheck(): Promise<boolean>;
}
export declare const liveDataClient: LiveFinancialDataClient;
//# sourceMappingURL=live-data-client.d.ts.map