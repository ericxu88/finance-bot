/**
 * Historical Metrics Calculator
 * 
 * Calculates spending patterns and historical data metrics from user transactions
 * Used by agents to assess data quality and spending variance
 */

import type { UserProfile, Transaction, SpendingCategory } from '../../types/financial.js';

export interface HistoricalMetrics {
  monthsOfData: number;
  avgMonthlySpending: number;
  spendingVariance: number;
  transactionCount: number;
  categoryBreakdown: Record<string, number>;
}

/**
 * Calculate historical metrics from user's transaction data
 */
export function calculateHistoricalMetrics(user: UserProfile): HistoricalMetrics {
  // Collect all transactions from all spending categories
  const transactions = user.spendingCategories.flatMap(
    (category: SpendingCategory) => category.transactions
  );

  // If no transactions, return default metrics
  if (transactions.length === 0) {
    return {
      monthsOfData: 0,
      avgMonthlySpending: 0,
      spendingVariance: 0,
      transactionCount: 0,
      categoryBreakdown: {},
    };
  }

  // Calculate time span of data
  const transactionDates = transactions.map((t: Transaction) => t.date.getTime());
  const oldestTransaction = Math.min(...transactionDates);
  const newestTransaction = Math.max(...transactionDates);
  
  // Calculate months of data (minimum 1 month)
  const daysOfData = (newestTransaction - oldestTransaction) / (1000 * 60 * 60 * 24);
  const monthsOfData = Math.max(1, Math.ceil(daysOfData / 30));

  // Calculate average monthly spending (only expenses, not income)
  const expenseTransactions = transactions.filter((t: Transaction) => t.amount < 0);
  const totalSpending = expenseTransactions.reduce(
    (sum: number, t: Transaction) => sum + Math.abs(t.amount),
    0
  );
  const avgMonthlySpending = totalSpending / monthsOfData;

  // Calculate spending variance (coefficient of variation)
  // Group expenses by month and calculate variance
  const monthlySpending: number[] = [];
  const spendingByMonth = new Map<string, number>();
  
  expenseTransactions.forEach((t: Transaction) => {
    const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
    spendingByMonth.set(monthKey, (spendingByMonth.get(monthKey) || 0) + Math.abs(t.amount));
  });
  
  monthlySpending.push(...Array.from(spendingByMonth.values()));
  
  let spendingVariance = 0;
  if (monthlySpending.length > 1) {
    const mean = monthlySpending.reduce((a, b) => a + b, 0) / monthlySpending.length;
    const variance = monthlySpending.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / monthlySpending.length;
    const stdDev = Math.sqrt(variance);
    spendingVariance = mean > 0 ? stdDev / mean : 0; // Coefficient of variation
  }

  // Calculate category breakdown
  const categoryBreakdown: Record<string, number> = {};
  transactions.forEach((t: Transaction) => {
    categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + Math.abs(t.amount);
  });

  return {
    monthsOfData: Math.max(1, Math.floor(monthsOfData)),
    avgMonthlySpending,
    spendingVariance: Math.min(1, spendingVariance), // Cap at 1.0
    transactionCount: transactions.length,
    categoryBreakdown,
  };
}
