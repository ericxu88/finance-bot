import { differenceInMonths } from 'date-fns';
function calculateMonthlySurplus(user) {
    const totalFixedExpenses = user.fixedExpenses.reduce((sum, exp) => {
        return sum + (exp.frequency === 'monthly' ? exp.amount : exp.amount / 12);
    }, 0);
    const totalBudgeted = user.spendingCategories.reduce((sum, cat) => sum + cat.monthlyBudget, 0);
    return user.monthlyIncome - totalFixedExpenses - totalBudgeted;
}
function calculateGoalGap(goal) {
    return Math.max(0, goal.targetAmount - goal.currentAmount);
}
function monthsUntilDeadline(deadline) {
    const now = new Date();
    return Math.max(0, differenceInMonths(deadline, now));
}
export function generateRecommendations(user) {
    const recommendations = [];
    const monthlySurplus = calculateMonthlySurplus(user);
    const totalLiquid = user.accounts.checking + user.accounts.savings;
    const emergencyGoal = user.goals.find((g) => g.name.toLowerCase().includes('emergency') || g.timeHorizon === 'short') || null;
    if (emergencyGoal) {
        const gap = calculateGoalGap(emergencyGoal);
        if (gap > 0) {
            const recommendedAmount = Math.min(Math.max(500, gap * 0.1), monthlySurplus * 0.5, totalLiquid * 0.3);
            if (recommendedAmount >= 100) {
                recommendations.push({
                    action: {
                        type: 'save',
                        amount: Math.round(recommendedAmount),
                        goalId: emergencyGoal.id,
                    },
                    priority: emergencyGoal.priority,
                    reasoning: `Build emergency fund to reach ${emergencyGoal.name} target. This provides financial security and aligns with your highest priority goal.`,
                    goalImpact: {
                        goalId: emergencyGoal.id,
                        goalName: emergencyGoal.name,
                        monthsSaved: Math.max(1, Math.floor(gap / recommendedAmount / 12)),
                        progressIncrease: (recommendedAmount / emergencyGoal.targetAmount) * 100,
                    },
                    estimatedImpact: {
                        liquidityImpact: 'Increases savings buffer',
                        riskImpact: 'Reduces financial risk',
                        timelineBenefit: `Moves you ${Math.floor(gap / recommendedAmount / 12)} months closer to goal`,
                    },
                });
            }
        }
    }
    const longTermGoals = user.goals.filter((g) => g.timeHorizon === 'long' && !g.name.toLowerCase().includes('emergency'));
    for (const goal of longTermGoals) {
        const gap = calculateGoalGap(goal);
        if (gap > 0 && monthlySurplus > 500) {
            const recommendedAmount = Math.min(Math.max(500, monthlySurplus * 0.3), gap * 0.05);
            if (recommendedAmount >= 100) {
                const accountType = user.preferences.riskTolerance === 'conservative'
                    ? 'taxable'
                    : user.preferences.riskTolerance === 'moderate'
                        ? 'rothIRA'
                        : 'taxable';
                const timeHorizon = Math.max(5, Math.floor(monthsUntilDeadline(goal.deadline) / 12));
                recommendations.push({
                    action: {
                        type: 'invest',
                        amount: Math.round(recommendedAmount),
                        targetAccountId: accountType,
                        goalId: goal.id,
                    },
                    timeHorizon,
                    priority: goal.priority,
                    reasoning: `Invest for ${goal.name}. Long-term investments can help you reach this goal faster through compound growth, especially with your ${user.preferences.riskTolerance} risk tolerance.`,
                    goalImpact: {
                        goalId: goal.id,
                        goalName: goal.name,
                        monthsSaved: Math.max(1, Math.floor(gap / recommendedAmount / 12)),
                        progressIncrease: (recommendedAmount / goal.targetAmount) * 100,
                    },
                    estimatedImpact: {
                        liquidityImpact: 'Reduces liquid cash but builds long-term wealth',
                        riskImpact: `Moderate risk based on ${user.preferences.riskTolerance} tolerance`,
                        timelineBenefit: `Potential to reach goal ${Math.floor(gap / recommendedAmount / 12)} months earlier with growth`,
                    },
                });
            }
        }
    }
    const mediumTermGoals = user.goals.filter((g) => g.timeHorizon === 'medium');
    for (const goal of mediumTermGoals) {
        const gap = calculateGoalGap(goal);
        const monthsRemaining = monthsUntilDeadline(goal.deadline);
        if (gap > 0 && monthsRemaining > 0 && monthlySurplus > 300) {
            const monthlyNeeded = gap / monthsRemaining;
            const recommendedAmount = Math.min(Math.max(300, monthlyNeeded * 1.2), monthlySurplus * 0.4);
            if (recommendedAmount >= 100) {
                recommendations.push({
                    action: {
                        type: 'save',
                        amount: Math.round(recommendedAmount),
                        goalId: goal.id,
                    },
                    priority: goal.priority,
                    reasoning: `Save for ${goal.name}. With ${monthsRemaining} months until deadline, this monthly amount will help you stay on track.`,
                    goalImpact: {
                        goalId: goal.id,
                        goalName: goal.name,
                        monthsSaved: 0,
                        progressIncrease: (recommendedAmount / goal.targetAmount) * 100,
                    },
                    estimatedImpact: {
                        liquidityImpact: 'Increases savings',
                        riskImpact: 'Low risk, guaranteed growth',
                        timelineBenefit: `Keeps you on track for ${goal.name} deadline`,
                    },
                });
            }
        }
    }
    if (recommendations.length === 0 && monthlySurplus > 200) {
        recommendations.push({
            action: {
                type: 'save',
                amount: Math.round(Math.min(monthlySurplus * 0.3, 1000)),
            },
            priority: 3,
            reasoning: 'Build general savings buffer. Having extra savings provides flexibility and financial security.',
            estimatedImpact: {
                liquidityImpact: 'Increases financial cushion',
                riskImpact: 'Very low risk',
                timelineBenefit: 'Improves overall financial health',
            },
        });
    }
    return recommendations
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 5);
}
export function generateGoalSummary(user) {
    const monthlySurplus = calculateMonthlySurplus(user);
    return user.goals.map((goal) => {
        const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
        const progress = goal.targetAmount > 0
            ? (goal.currentAmount / goal.targetAmount) * 100
            : (goal.currentAmount >= 0 ? 100 : 0);
        const monthsRemaining = monthsUntilDeadline(goal.deadline);
        const monthlyNeeded = monthsRemaining > 0 ? remainingAmount / monthsRemaining : remainingAmount;
        let status;
        let projectedCompletion;
        if (progress >= 100) {
            status = 'completed';
            projectedCompletion = 'Completed!';
        }
        else if (monthlyNeeded <= monthlySurplus) {
            status = 'on_track';
            projectedCompletion = 'On time';
        }
        else if (monthlyNeeded <= monthlySurplus * 1.5) {
            status = 'behind';
            const extraMonths = Math.ceil(remainingAmount / monthlySurplus) - monthsRemaining;
            projectedCompletion = extraMonths > 0 ? `${extraMonths} months late` : 'On time with effort';
        }
        else {
            status = 'at_risk';
            const monthsAtCurrentRate = monthlySurplus > 0 ? Math.ceil(remainingAmount / monthlySurplus) : Infinity;
            const delay = monthsAtCurrentRate - monthsRemaining;
            projectedCompletion = delay < Infinity ? `${delay} months late` : 'Significantly delayed';
        }
        let suggestedAction;
        if (status !== 'completed' && monthlySurplus > 0) {
            const recommendedAmount = Math.min(Math.max(100, monthlyNeeded * 0.8), monthlySurplus * 0.5);
            if (goal.timeHorizon === 'long') {
                suggestedAction = {
                    action: {
                        type: 'invest',
                        amount: Math.round(recommendedAmount),
                        targetAccountId: user.preferences.riskTolerance === 'aggressive' ? 'taxable' : 'rothIRA',
                        goalId: goal.id,
                    },
                    reasoning: `Invest for long-term growth to accelerate ${goal.name}`,
                };
            }
            else {
                suggestedAction = {
                    action: {
                        type: 'save',
                        amount: Math.round(recommendedAmount),
                        goalId: goal.id,
                    },
                    reasoning: `Save to stay on track for ${goal.name} deadline`,
                };
            }
        }
        return {
            goalId: goal.id,
            goalName: goal.name,
            targetAmount: goal.targetAmount,
            currentAmount: goal.currentAmount,
            remainingAmount: Math.round(remainingAmount * 100) / 100,
            progress: Math.round(progress * 10) / 10,
            deadline: goal.deadline,
            monthsRemaining,
            timeHorizon: goal.timeHorizon,
            priority: goal.priority,
            status,
            monthlyNeeded: Math.round(monthlyNeeded * 100) / 100,
            projectedCompletion,
            suggestedAction,
        };
    }).sort((a, b) => {
        if (a.priority !== b.priority)
            return a.priority - b.priority;
        const statusOrder = { at_risk: 0, behind: 1, on_track: 2, completed: 3 };
        return statusOrder[a.status] - statusOrder[b.status];
    });
}
export function analyzeFinancialHealth(user) {
    const monthlySurplus = calculateMonthlySurplus(user);
    const totalLiquid = user.accounts.checking + user.accounts.savings;
    const monthlyExpenses = user.fixedExpenses.reduce((sum, exp) => {
        return sum + (exp.frequency === 'monthly' ? exp.amount : exp.amount / 12);
    }, 0) +
        user.spendingCategories.reduce((sum, cat) => sum + cat.monthlyBudget, 0);
    const monthsOfExpenses = totalLiquid / monthlyExpenses;
    let emergencyFundStatus;
    if (monthsOfExpenses >= 3) {
        emergencyFundStatus = 'adequate';
    }
    else if (monthsOfExpenses >= 1) {
        emergencyFundStatus = 'low';
    }
    else {
        emergencyFundStatus = 'missing';
    }
    const goalProgress = user.goals.map((goal) => {
        const progress = (goal.currentAmount / goal.targetAmount) * 100;
        const monthsRemaining = monthsUntilDeadline(goal.deadline);
        const gap = calculateGoalGap(goal);
        const monthlyNeeded = monthsRemaining > 0 ? gap / monthsRemaining : 0;
        const onTrack = monthlyNeeded <= monthlySurplus * 1.2;
        return {
            goalId: goal.id,
            goalName: goal.name,
            progress: Math.round(progress * 10) / 10,
            onTrack,
        };
    });
    let overallHealth;
    if (monthlySurplus > 1000 && emergencyFundStatus === 'adequate' && goalProgress.every((g) => g.onTrack)) {
        overallHealth = 'excellent';
    }
    else if (monthlySurplus > 500 && emergencyFundStatus !== 'missing' && goalProgress.some((g) => g.onTrack)) {
        overallHealth = 'good';
    }
    else if (monthlySurplus > 0) {
        overallHealth = 'fair';
    }
    else {
        overallHealth = 'needs_attention';
    }
    const recommendations = generateRecommendations(user);
    return {
        overallHealth,
        monthlySurplus: Math.round(monthlySurplus * 100) / 100,
        emergencyFundStatus,
        goalProgress,
        recommendations,
    };
}
//# sourceMappingURL=recommendation-engine.js.map