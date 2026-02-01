/**
 * Client for fetching live financial data from Python service.
 * This data is NOT embedded - it's fetched on-demand for context injection.
 */

const FINANCIAL_DATA_SERVICE_URL = process.env.FINANCIAL_DATA_SERVICE_URL || 'http://localhost:5001';

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

export class LiveFinancialDataClient {

  /**
   * Fetch current stock data (NOT cached, always live)
   */
  async getStockData(ticker: string): Promise<StockData | null> {
    try {
      const response = await fetch(`${FINANCIAL_DATA_SERVICE_URL}/stock/${ticker}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch stock data for ${ticker}: ${response.status}`);
        return null;
      }

      return await response.json() as StockData;
    } catch (error) {
      console.error('Error fetching stock data:', error);
      return null;
    }
  }

  /**
   * Fetch current economic indicators
   */
  async getEconomicIndicators(): Promise<EconomicIndicators | null> {
    try {
      const response = await fetch(`${FINANCIAL_DATA_SERVICE_URL}/economic-indicators`);

      if (!response.ok) {
        if (response.status === 503) {
          console.warn('Financial data service: FRED_API_KEY not set');
        } else {
          console.error('Failed to fetch economic indicators:', response.status);
        }
        return null;
      }

      return await response.json() as EconomicIndicators;
    } catch (error) {
      console.error('Error fetching economic indicators:', error);
      return null;
    }
  }

  /**
   * Fetch market summary
   */
  async getMarketSummary(): Promise<MarketSummary | null> {
    try {
      const response = await fetch(`${FINANCIAL_DATA_SERVICE_URL}/market-summary`);

      if (!response.ok) {
        console.error('Failed to fetch market summary:', response.status);
        return null;
      }

      return await response.json() as MarketSummary;
    } catch (error) {
      console.error('Error fetching market summary:', error);
      return null;
    }
  }

  /**
   * Check if service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${FINANCIAL_DATA_SERVICE_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const liveDataClient = new LiveFinancialDataClient();
