import { Document } from '@langchain/core/documents';
import { vectorStore } from '../lib/rag/vector-store.js';
const FRED_DESCRIPTIONS = [
    {
        series_id: 'CPIAUCSL',
        name: 'Consumer Price Index for All Urban Consumers',
        description: `The Consumer Price Index (CPI) measures the average change over time in the prices paid by urban consumers for a market basket of consumer goods and services. It is the most widely used measure of inflation. A rising CPI indicates inflation, which reduces purchasing power. The Federal Reserve uses CPI data to guide monetary policy decisions. For investors, high inflation typically leads to higher interest rates, which can negatively impact bond prices and stock valuations.`,
        category: 'inflation',
        implications: 'High inflation erodes real returns. Investors may shift to inflation-protected securities (TIPS) or commodities. The Fed may raise rates to combat inflation, impacting stock and bond markets.',
    },
    {
        series_id: 'FEDFUNDS',
        name: 'Federal Funds Effective Rate',
        description: `The federal funds rate is the interest rate at which depository institutions lend reserve balances to other depository institutions overnight. It is the primary tool the Federal Reserve uses to influence monetary policy. Changes in the fed funds rate ripple through the economy, affecting borrowing costs, consumer spending, and investment decisions. A higher rate makes borrowing more expensive, potentially slowing economic growth but reducing inflation.`,
        category: 'interest_rates',
        implications: 'Rising rates typically hurt growth stocks and bonds. Lower rates stimulate borrowing and economic growth, benefiting stocks. Rate decisions impact mortgage rates, savings account yields, and overall market sentiment.',
    },
    {
        series_id: 'UNRATE',
        name: 'Unemployment Rate',
        description: `The unemployment rate represents the percentage of the labor force that is jobless and actively seeking employment. It is a lagging economic indicator that provides insight into the health of the labor market and overall economy. Low unemployment typically indicates a strong economy but can lead to wage inflation. High unemployment signals economic weakness and often coincides with market downturns.`,
        category: 'employment',
        implications: 'Low unemployment can signal economic strength but may trigger inflation concerns and Fed rate hikes. High unemployment often correlates with recessions and market declines.',
    },
    {
        series_id: 'GDP',
        name: 'Gross Domestic Product',
        description: `GDP measures the total value of all goods and services produced in a country over a specific period. It is the broadest measure of economic activity and health. Strong GDP growth indicates a healthy, expanding economy, while negative growth (recession) signals economic contraction. Investors use GDP data to gauge overall economic conditions and adjust portfolio allocations accordingly.`,
        category: 'economic_growth',
        implications: 'Strong GDP growth supports corporate earnings and stock prices. Weak or negative GDP growth may signal recession, leading investors to defensive positions or bonds.',
    },
    {
        series_id: 'DGS10',
        name: '10-Year Treasury Constant Maturity Rate',
        description: `The 10-year Treasury yield is the return on investment for the U.S. government's 10-year debt obligation. It serves as a benchmark for other interest rates, including mortgages and corporate bonds. The yield reflects investor expectations about inflation, economic growth, and Federal Reserve policy. When yields rise, bond prices fall. The 10-year yield is closely watched as an indicator of long-term economic expectations.`,
        category: 'interest_rates',
        implications: 'Rising yields can signal inflation concerns or economic strength, often pressuring stock valuations. The yield curve (10-year vs 2-year) is watched for recession signals. Higher yields make bonds more attractive relative to stocks.',
    },
];
async function ingestFREDDescriptions() {
    try {
        const documents = FRED_DESCRIPTIONS.map(indicator => new Document({
            pageContent: `
Economic Indicator: ${indicator.name}

Description:
${indicator.description}

Investment Implications:
${indicator.implications}

Category: ${indicator.category}
FRED Series ID: ${indicator.series_id}
      `.trim(),
            metadata: {
                type: 'economic_indicator_description',
                source: 'Federal Reserve Economic Data (FRED)',
                series_id: indicator.series_id,
                category: indicator.category,
            }
        }));
        await vectorStore.addDocuments('financial_knowledge_real', documents);
        console.log(`[FRED] Ingested ${documents.length} indicator descriptions`);
    }
    catch (error) {
        console.error('[FRED] Ingestion failed:', error);
        throw error;
    }
}
const isMain = process.argv[1]?.endsWith('ingest-fred-descriptions');
if (isMain || process.argv[1]?.includes('ingest-fred-descriptions')) {
    ingestFREDDescriptions()
        .then(() => {
        console.log('FRED descriptions ingestion complete');
        process.exit(0);
    })
        .catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
}
export { ingestFREDDescriptions };
//# sourceMappingURL=ingest-fred-descriptions.js.map