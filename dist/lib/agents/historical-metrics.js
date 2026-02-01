export function calculateHistoricalMetrics(user) {
    const transactions = user.spendingCategories.flatMap((category) => category.transactions);
    if (transactions.length === 0) {
        return {
            monthsOfData: 0,
            avgMonthlySpending: 0,
            spendingVariance: 0,
            transactionCount: 0,
            categoryBreakdown: {},
        };
    }
    const transactionDates = transactions.map((t) => t.date.getTime());
    const oldestTransaction = Math.min(...transactionDates);
    const newestTransaction = Math.max(...transactionDates);
    const daysOfData = (newestTransaction - oldestTransaction) / (1000 * 60 * 60 * 24);
    const monthsOfData = Math.max(1, Math.ceil(daysOfData / 30));
    const expenseTransactions = transactions.filter((t) => t.amount < 0);
    const totalSpending = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const avgMonthlySpending = totalSpending / monthsOfData;
    const monthlySpending = [];
    const spendingByMonth = new Map();
    expenseTransactions.forEach((t) => {
        const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
        spendingByMonth.set(monthKey, (spendingByMonth.get(monthKey) || 0) + Math.abs(t.amount));
    });
    monthlySpending.push(...Array.from(spendingByMonth.values()));
    let spendingVariance = 0;
    if (monthlySpending.length > 1) {
        const mean = monthlySpending.reduce((a, b) => a + b, 0) / monthlySpending.length;
        const variance = monthlySpending.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / monthlySpending.length;
        const stdDev = Math.sqrt(variance);
        spendingVariance = mean > 0 ? stdDev / mean : 0;
    }
    const categoryBreakdown = {};
    transactions.forEach((t) => {
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + Math.abs(t.amount);
    });
    return {
        monthsOfData: Math.max(1, Math.floor(monthsOfData)),
        avgMonthlySpending,
        spendingVariance: Math.min(1, spendingVariance),
        transactionCount: transactions.length,
        categoryBreakdown,
    };
}
//# sourceMappingURL=historical-metrics.js.map