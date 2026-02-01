import type { UserProfile } from '../../types/financial.js';
export interface HistoricalMetrics {
    monthsOfData: number;
    avgMonthlySpending: number;
    spendingVariance: number;
    transactionCount: number;
    categoryBreakdown: Record<string, number>;
}
export declare function calculateHistoricalMetrics(user: UserProfile): HistoricalMetrics;
//# sourceMappingURL=historical-metrics.d.ts.map