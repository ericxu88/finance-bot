import { differenceInDays, addDays } from 'date-fns';
import { getInvestmentBalance } from '../types/financial.js';
function calculateMonthlySurplus(user) {
    const totalFixedExpenses = user.fixedExpenses.reduce((sum, exp) => sum + (exp.frequency === 'monthly' ? exp.amount : exp.amount / 12), 0);
    const totalBudgeted = user.spendingCategories.reduce((sum, cat) => sum + cat.monthlyBudget, 0);
    return user.monthlyIncome - totalFixedExpenses - totalBudgeted;
}
export function getTotalInvestments(user) {
    return (getInvestmentBalance(user.accounts.investments.taxable) +
        getInvestmentBalance(user.accounts.investments.rothIRA) +
        getInvestmentBalance(user.accounts.investments.traditional401k));
}
function calculateFutureValue(principal, rate, years) {
    return principal * Math.pow(1 + rate, years);
}
function getBudgetStatus(percentUsed) {
    if (percentUsed < 50)
        return 'under';
    if (percentUsed <= 80)
        return 'good';
    if (percentUsed <= 100)
        return 'warning';
    return 'over';
}
export function generateInvestmentReminder(user) {
    const prefs = user.preferences.investmentPreferences;
    if (!prefs || prefs.autoInvestEnabled || prefs.reminderFrequency === 'none') {
        return null;
    }
    const now = new Date();
    const lastInvestment = prefs.lastInvestmentDate ? new Date(prefs.lastInvestmentDate) : null;
    let shouldRemind = false;
    let urgency = 'low';
    let daysSinceLastInvestment = lastInvestment ? differenceInDays(now, lastInvestment) : Infinity;
    switch (prefs.reminderFrequency) {
        case 'weekly':
            if (daysSinceLastInvestment >= 7) {
                shouldRemind = true;
                urgency = daysSinceLastInvestment > 14 ? 'medium' : 'low';
            }
            break;
        case 'biweekly':
            if (daysSinceLastInvestment >= 14) {
                shouldRemind = true;
                urgency = daysSinceLastInvestment > 28 ? 'medium' : 'low';
            }
            break;
        case 'monthly':
            if (daysSinceLastInvestment >= 30) {
                shouldRemind = true;
                urgency = daysSinceLastInvestment > 45 ? 'medium' : 'low';
            }
            break;
        case 'quarterly':
            if (daysSinceLastInvestment >= 90) {
                shouldRemind = true;
                urgency = daysSinceLastInvestment > 120 ? 'medium' : 'low';
            }
            break;
    }
    if (!lastInvestment) {
        shouldRemind = true;
        urgency = 'low';
    }
    const surplus = calculateMonthlySurplus(user);
    if (surplus < 100) {
        return {
            shouldRemind: false,
            urgency: 'low',
            recommendedAmount: 0,
            message: "Your budget is tight right now - focus on your essentials first.",
            reasoning: "Monthly surplus is below $100, so investing isn't recommended at this time.",
            suggestedAccount: prefs.preferredAccount || 'taxable',
            impactIfInvested: { affectedGoals: [], projectedValue5yr: 0 },
        };
    }
    const targetAmount = prefs.targetMonthlyInvestment || surplus * 0.3;
    const recommendedAmount = Math.min(targetAmount, surplus * 0.5, user.accounts.checking - 1500);
    if (recommendedAmount < 50) {
        return null;
    }
    const longTermGoals = user.goals.filter(g => g.timeHorizon === 'long' || g.timeHorizon === 'medium');
    const affectedGoals = longTermGoals.map(goal => {
        const progressIncrease = (recommendedAmount / goal.targetAmount) * 100;
        const monthlyNeeded = (goal.targetAmount - goal.currentAmount) / 12;
        const monthsCloser = monthlyNeeded > 0 ? Math.round(recommendedAmount / monthlyNeeded) : 0;
        return {
            goalId: goal.id,
            goalName: goal.name,
            progressIncrease: Math.round(progressIncrease * 10) / 10,
            monthsCloser: Math.max(0, monthsCloser),
        };
    }).filter(g => g.progressIncrease > 0.1);
    const projectedValue5yr = Math.round(calculateFutureValue(recommendedAmount, 0.07, 5));
    let message;
    if (!lastInvestment) {
        message = `When you're ready, investing $${recommendedAmount.toLocaleString()} could be a good start for your goals.`;
    }
    else if (urgency === 'medium') {
        message = `It's been a while since your last investment. When convenient, $${recommendedAmount.toLocaleString()} could help with your goals.`;
    }
    else {
        message = `Friendly reminder: $${recommendedAmount.toLocaleString()} is available to invest if you'd like.`;
    }
    const topGoal = affectedGoals[0];
    const reasoning = topGoal
        ? `Based on your ${prefs.reminderFrequency} reminder preference. This could move your "${topGoal.goalName}" goal ${topGoal.progressIncrease.toFixed(1)}% closer.`
        : `Based on your ${prefs.reminderFrequency} reminder preference and available surplus.`;
    const reminderDays = {
        weekly: 7,
        biweekly: 14,
        monthly: 30,
        quarterly: 90,
        none: 365,
    };
    const nextReminderDate = addDays(now, reminderDays[prefs.reminderFrequency]);
    const opportunityCostNote = projectedValue5yr > recommendedAmount * 1.2
        ? `Fun fact: $${recommendedAmount.toLocaleString()} invested today could grow to ~$${projectedValue5yr.toLocaleString()} in 5 years (based on historical averages).`
        : undefined;
    return {
        shouldRemind,
        urgency,
        recommendedAmount: Math.round(recommendedAmount),
        message,
        reasoning,
        suggestedAccount: prefs.preferredAccount || 'taxable',
        impactIfInvested: {
            affectedGoals,
            projectedValue5yr,
        },
        opportunityCostNote,
        nextReminderDate,
    };
}
export function analyzeBudget(user) {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeftInMonth = daysInMonth - dayOfMonth;
    let totalBudget = 0;
    let totalSpent = 0;
    const categories = user.spendingCategories.map(cat => {
        totalBudget += cat.monthlyBudget;
        totalSpent += cat.currentSpent;
        const percentUsed = cat.monthlyBudget > 0
            ? (cat.currentSpent / cat.monthlyBudget) * 100
            : (cat.currentSpent > 0 ? 100 : 0);
        const subcategories = cat.subcategories?.map(sub => {
            const subPercentUsed = sub.monthlyBudget > 0
                ? (sub.currentSpent / sub.monthlyBudget) * 100
                : 0;
            return {
                id: sub.id,
                name: sub.name,
                monthlyBudget: sub.monthlyBudget,
                currentSpent: sub.currentSpent,
                percentUsed: Math.round(subPercentUsed * 10) / 10,
                status: getBudgetStatus(subPercentUsed),
            };
        });
        return {
            id: cat.id,
            name: cat.name,
            monthlyBudget: cat.monthlyBudget,
            currentSpent: cat.currentSpent,
            percentUsed: Math.round(percentUsed * 10) / 10,
            status: getBudgetStatus(percentUsed),
            subcategories,
        };
    });
    const dailySpendRate = totalSpent / dayOfMonth;
    const projectedMonthlySpend = Math.round(dailySpendRate * daysInMonth);
    const overBudgetCount = categories.filter(c => c.status === 'over').length;
    const warningCount = categories.filter(c => c.status === 'warning').length;
    let overallStatus;
    if (overBudgetCount > 0 || projectedMonthlySpend > totalBudget * 1.1) {
        overallStatus = 'needs_attention';
    }
    else if (warningCount > 0 || projectedMonthlySpend > totalBudget * 0.95) {
        overallStatus = 'good';
    }
    else {
        overallStatus = 'healthy';
    }
    return {
        overallStatus,
        categories,
        totalBudget,
        totalSpent: Math.round(totalSpent * 100) / 100,
        remaining: Math.round((totalBudget - totalSpent) * 100) / 100,
        daysLeftInMonth,
        projectedMonthlySpend,
    };
}
export function getBudgetSummaryMessage(analysis) {
    const { overallStatus, remaining, daysLeftInMonth, categories } = analysis;
    const overCategories = categories.filter(c => c.status === 'over');
    const warningCategories = categories.filter(c => c.status === 'warning');
    if (overallStatus === 'healthy') {
        return `You're doing great! $${remaining.toLocaleString()} remaining in your budget with ${daysLeftInMonth} days left this month.`;
    }
    else if (overallStatus === 'good') {
        if (warningCategories.length > 0) {
            return `Budget looks okay. ${warningCategories.map(c => c.name).join(', ')} ${warningCategories.length === 1 ? 'is' : 'are'} getting close to the limit.`;
        }
        return `$${remaining.toLocaleString()} remaining with ${daysLeftInMonth} days left. Pace yourself to stay on track.`;
    }
    else {
        if (overCategories.length > 0) {
            return `Heads up: ${overCategories.map(c => c.name).join(', ')} ${overCategories.length === 1 ? 'has' : 'have'} exceeded the budget.`;
        }
        return `Budget needs attention. Consider reducing spending in the remaining ${daysLeftInMonth} days.`;
    }
}
export function detectUnderspending(user) {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeftInMonth = daysInMonth - dayOfMonth;
    if (dayOfMonth < 10 || daysLeftInMonth < 5) {
        return {
            hasUnderspending: false,
            totalSurplus: 0,
            categories: [],
            summary: 'Not enough data to analyze underspending patterns yet.',
            topRecommendation: null,
        };
    }
    const expectedPercentUsed = (dayOfMonth / daysInMonth) * 100;
    const underspendingCategories = [];
    let totalSurplus = 0;
    for (const cat of user.spendingCategories) {
        if (cat.monthlyBudget <= 0)
            continue;
        const percentUsed = (cat.currentSpent / cat.monthlyBudget) * 100;
        const isBehindPace = percentUsed < expectedPercentUsed - 20;
        const isSignificantlyUnder = percentUsed < 50;
        if (isSignificantlyUnder && isBehindPace) {
            const expectedSpent = (cat.monthlyBudget * expectedPercentUsed) / 100;
            const surplusAmount = Math.round((expectedSpent - cat.currentSpent) * 100) / 100;
            if (surplusAmount < 20)
                continue;
            totalSurplus += surplusAmount;
            const suggestions = [];
            if (surplusAmount >= 50) {
                const topGoal = user.goals.find(g => g.timeHorizon === 'long') || user.goals[0];
                suggestions.push({
                    type: 'invest',
                    description: `Invest $${surplusAmount.toLocaleString()} toward your goals`,
                    amount: surplusAmount,
                    reasoning: topGoal
                        ? `This could move your "${topGoal.name}" goal ${((surplusAmount / topGoal.targetAmount) * 100).toFixed(1)}% closer.`
                        : 'Investing consistently helps build long-term wealth.',
                    goalId: topGoal?.id,
                });
            }
            const emergencyGoal = user.goals.find(g => g.name.toLowerCase().includes('emergency') || g.name.toLowerCase().includes('safety'));
            if (emergencyGoal && emergencyGoal.currentAmount < emergencyGoal.targetAmount) {
                suggestions.push({
                    type: 'save',
                    description: `Add $${surplusAmount.toLocaleString()} to your emergency fund`,
                    amount: surplusAmount,
                    reasoning: `Your emergency fund is at ${((emergencyGoal.currentAmount / emergencyGoal.targetAmount) * 100).toFixed(0)}% of your goal.`,
                    goalId: emergencyGoal.id,
                });
            }
            const overCategories = user.spendingCategories.filter(c => c.id !== cat.id && c.monthlyBudget > 0 && (c.currentSpent / c.monthlyBudget) > 0.8);
            const topOver = overCategories[0];
            if (topOver) {
                suggestions.push({
                    type: 'reallocate',
                    description: `Reallocate $${surplusAmount.toLocaleString()} to "${topOver.name}"`,
                    amount: surplusAmount,
                    reasoning: `"${topOver.name}" is at ${((topOver.currentSpent / topOver.monthlyBudget) * 100).toFixed(0)}% of budget and could use the extra room.`,
                });
            }
            underspendingCategories.push({
                categoryId: cat.id,
                categoryName: cat.name,
                monthlyBudget: cat.monthlyBudget,
                currentSpent: cat.currentSpent,
                percentUsed: Math.round(percentUsed * 10) / 10,
                surplusAmount,
                suggestions,
            });
        }
    }
    let summary;
    let topRecommendation = null;
    if (underspendingCategories.length === 0) {
        summary = 'Your spending is on track with your budget allocations.';
    }
    else if (underspendingCategories.length === 1 && underspendingCategories[0]) {
        const cat = underspendingCategories[0];
        summary = `You're spending less than planned in "${cat.categoryName}" — $${cat.surplusAmount.toLocaleString()} could be put to work elsewhere.`;
        topRecommendation = cat.suggestions[0] ?? null;
    }
    else {
        summary = `You have $${totalSurplus.toLocaleString()} in unspent budget across ${underspendingCategories.length} categories that could be invested or saved.`;
        for (const cat of underspendingCategories) {
            const investSuggestion = cat.suggestions.find(s => s.type === 'invest');
            if (investSuggestion) {
                topRecommendation = investSuggestion;
                break;
            }
        }
        if (!topRecommendation && underspendingCategories[0]?.suggestions[0]) {
            topRecommendation = underspendingCategories[0].suggestions[0];
        }
    }
    return {
        hasUnderspending: underspendingCategories.length > 0,
        totalSurplus,
        categories: underspendingCategories,
        summary,
        topRecommendation,
    };
}
export function analyzeUpcomingExpenses(user) {
    const now = new Date();
    const upcoming = user.upcomingExpenses || [];
    const relevantExpenses = upcoming
        .filter(exp => {
        if (exp.status === 'paid')
            return false;
        const dueDate = new Date(exp.dueDate);
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilDue <= 30;
    })
        .map(exp => {
        const dueDate = new Date(exp.dueDate);
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        let urgency;
        if (daysUntilDue <= 3 || exp.status === 'overdue') {
            urgency = 'immediate';
        }
        else if (daysUntilDue <= 7) {
            urgency = 'soon';
        }
        else {
            urgency = 'upcoming';
        }
        const category = exp.categoryId
            ? user.spendingCategories.find(c => c.id === exp.categoryId)
            : undefined;
        return {
            id: exp.id,
            name: exp.name,
            amount: exp.amount,
            dueDate: exp.dueDate,
            daysUntilDue,
            isRecurring: exp.isRecurring,
            urgency,
            categoryName: category?.name,
            notes: exp.notes,
        };
    })
        .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
    const totalDueNext30Days = relevantExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalDueNext7Days = relevantExpenses
        .filter(exp => exp.daysUntilDue <= 7)
        .reduce((sum, exp) => sum + exp.amount, 0);
    const immediateAttentionCount = relevantExpenses.filter(exp => exp.urgency === 'immediate').length;
    const availableFunds = user.accounts.checking;
    const canAfford = availableFunds >= totalDueNext30Days;
    const shortfall = canAfford ? 0 : totalDueNext30Days - availableFunds;
    let summary;
    if (relevantExpenses.length === 0) {
        summary = 'No upcoming expenses in the next 30 days. Your budget looks clear!';
    }
    else if (immediateAttentionCount > 0) {
        summary = `${immediateAttentionCount} expense${immediateAttentionCount > 1 ? 's' : ''} need${immediateAttentionCount === 1 ? 's' : ''} immediate attention. $${totalDueNext7Days.toLocaleString()} due in the next 7 days.`;
    }
    else {
        summary = `$${totalDueNext30Days.toLocaleString()} in upcoming expenses over the next 30 days.`;
    }
    if (!canAfford) {
        summary += ` Note: You may need an additional $${shortfall.toLocaleString()} to cover all expenses.`;
    }
    return {
        hasUpcoming: relevantExpenses.length > 0,
        totalDueNext30Days,
        totalDueNext7Days,
        expenses: relevantExpenses,
        immediateAttentionCount,
        summary,
        canAfford,
        shortfall,
    };
}
//# sourceMappingURL=investment-reminders.js.map