const FINANCIAL_DATA_SERVICE_URL = process.env.FINANCIAL_DATA_SERVICE_URL || 'http://localhost:5001';
export class LiveFinancialDataClient {
    async getStockData(ticker) {
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
            return await response.json();
        }
        catch (error) {
            console.error('Error fetching stock data:', error);
            return null;
        }
    }
    async getEconomicIndicators() {
        try {
            const response = await fetch(`${FINANCIAL_DATA_SERVICE_URL}/economic-indicators`);
            if (!response.ok) {
                if (response.status === 503) {
                    console.warn('Financial data service: FRED_API_KEY not set');
                }
                else {
                    console.error('Failed to fetch economic indicators:', response.status);
                }
                return null;
            }
            return await response.json();
        }
        catch (error) {
            console.error('Error fetching economic indicators:', error);
            return null;
        }
    }
    async getMarketSummary() {
        try {
            const response = await fetch(`${FINANCIAL_DATA_SERVICE_URL}/market-summary`);
            if (!response.ok) {
                console.error('Failed to fetch market summary:', response.status);
                return null;
            }
            return await response.json();
        }
        catch (error) {
            console.error('Error fetching market summary:', error);
            return null;
        }
    }
    async healthCheck() {
        try {
            const response = await fetch(`${FINANCIAL_DATA_SERVICE_URL}/health`);
            return response.ok;
        }
        catch {
            return false;
        }
    }
}
export const liveDataClient = new LiveFinancialDataClient();
//# sourceMappingURL=live-data-client.js.map