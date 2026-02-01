import { differenceInMonths } from 'date-fns';
const MIN_MONTHS = 1;
const MAX_MONTHS_FOR_PRESSURE = 120;
function monthlySurplus(user) {
    const fixed = user.fixedExpenses.reduce((sum, e) => sum + (e.frequency === 'monthly' ? e.amount : e.amount / 12), 0);
    const budgeted = user.spendingCategories.reduce((sum, c) => sum + (c.monthlyBudget || 0), 0);
    return Math.max(0, user.monthlyIncome - fixed - budgeted);
}
function totalLiquid(user) {
    return user.accounts.checking + user.accounts.savings;
}
function spendingUtilization(user) {
    let totalBudget = 0;
    let totalSpent = 0;
    for (const cat of user.spendingCategories) {
        if (cat.monthlyBudget > 0 && cat.name?.toLowerCase() !== 'income') {
            totalBudget += cat.monthlyBudget;
            totalSpent += cat.currentSpent ?? 0;
        }
    }
    if (totalBudget <= 0)
        return 0;
    return Math.min(1.5, totalSpent / totalBudget);
}
function scoreGoal(goal, user) {
    const now = new Date();
    const gap = Math.max(0, goal.targetAmount - goal.currentAmount);
    const monthsRemaining = Math.max(MIN_MONTHS, differenceInMonths(goal.deadline, now));
    const requiredMonthly = gap <= 0 ? 0 : gap / Math.min(monthsRemaining, MAX_MONTHS_FOR_PRESSURE);
    const surplus = monthlySurplus(user);
    const liquid = totalLiquid(user);
    const spendingUtil = spendingUtilization(user);
    const progressRatio = goal.targetAmount > 0
        ? Math.min(1, goal.currentAmount / goal.targetAmount)
        : 1;
    const timePressure = monthsRemaining >= 24 ? 1 : monthsRemaining >= 12 ? 0.8 : monthsRemaining >= 6 ? 0.6 : 0.4;
    const contributionAffordability = surplus <= 0 ? 0 : Math.min(1, surplus / (requiredMonthly || 1));
    const spendingHeadroom = Math.max(0, 1 - spendingUtil);
    const maxSensibleMonthlyFromLiquid = liquid * 0.1;
    const liquidityAlignment = requiredMonthly <= 0
        ? 1
        : Math.min(1, maxSensibleMonthlyFromLiquid / requiredMonthly);
    const risk = user.preferences?.riskTolerance ?? 'moderate';
    const liquidityPref = user.preferences?.liquidityPreference ?? 'medium';
    let riskAlignment = 0.7;
    if (goal.timeHorizon === 'short') {
        riskAlignment = risk === 'conservative' ? 1 : risk === 'moderate' ? 0.85 : 0.7;
        if (liquidityPref === 'high')
            riskAlignment = Math.min(1, riskAlignment + 0.1);
    }
    else if (goal.timeHorizon === 'long') {
        riskAlignment = risk === 'aggressive' ? 1 : risk === 'moderate' ? 0.85 : 0.7;
    }
    const weights = {
        progressRatio: 0.25,
        timePressure: 0.15,
        contributionAffordability: 0.25,
        spendingHeadroom: 0.1,
        liquidityAlignment: 0.05,
        riskAlignment: 0.1,
    };
    const score = progressRatio * weights.progressRatio +
        timePressure * weights.timePressure +
        contributionAffordability * weights.contributionAffordability +
        spendingHeadroom * weights.spendingHeadroom +
        liquidityAlignment * weights.liquidityAlignment +
        riskAlignment * weights.riskAlignment;
    let bottleneck;
    if (contributionAffordability < 0.5 && requiredMonthly > 0)
        bottleneck = `Required monthly ($${Math.round(requiredMonthly)}) exceeds affordable surplus`;
    else if (progressRatio < 0.2 && gap > 0)
        bottleneck = `Far from target ($${Math.round(gap)} to go)`;
    else if (monthsRemaining < 6 && gap > 0)
        bottleneck = `Short time horizon (${monthsRemaining} months left)`;
    else if (liquidityAlignment < 0.5)
        bottleneck = 'Liquidity constraints limit allocation';
    return {
        goalId: goal.id,
        goalName: goal.name,
        score: Math.round(Math.min(1, Math.max(0, score)) * 100) / 100,
        components: {
            progressRatio,
            timePressure,
            contributionAffordability,
            spendingHeadroom,
            liquidityAlignment,
            riskAlignment,
        },
        requiredMonthlyContribution: Math.round(requiredMonthly * 100) / 100,
        monthsRemaining,
        bottleneck,
    };
}
export function rankGoalsByFeasibility(user) {
    const surplus = monthlySurplus(user);
    const totalLiquidVal = totalLiquid(user);
    const rankings = user.goals
        .map((g) => scoreGoal(g, user))
        .sort((a, b) => b.score - a.score);
    return { rankings, surplus: Math.round(surplus * 100) / 100, totalLiquid: totalLiquidVal };
}
//# sourceMappingURL=feasibility.js.map