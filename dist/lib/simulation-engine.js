import { getInvestmentBalance } from '../types/financial.js';
export const DEFAULT_ANNUAL_RETURN = 0.07;
export const SAVINGS_RETURN = 0.04;
export const CHECKING_RETURN = 0.0;
export function cloneAccounts(accounts) {
    return {
        checking: accounts.checking,
        savings: accounts.savings,
        investments: {
            taxable: typeof accounts.investments.taxable === 'number'
                ? accounts.investments.taxable
                : {
                    balance: accounts.investments.taxable.balance,
                    allocation: { ...accounts.investments.taxable.allocation },
                },
            rothIRA: typeof accounts.investments.rothIRA === 'number'
                ? accounts.investments.rothIRA
                : {
                    balance: accounts.investments.rothIRA.balance,
                    allocation: { ...accounts.investments.rothIRA.allocation },
                },
            traditional401k: typeof accounts.investments.traditional401k === 'number'
                ? accounts.investments.traditional401k
                : {
                    balance: accounts.investments.traditional401k.balance,
                    allocation: { ...accounts.investments.traditional401k.allocation },
                },
        },
    };
}
export function calculateBudgetStatus(percentUsed) {
    if (percentUsed < 50)
        return 'under';
    if (percentUsed <= 80)
        return 'good';
    if (percentUsed <= 100)
        return 'warning';
    return 'over';
}
export function calculateLiquidityImpact(checkingBefore, checkingAfter, savingsBefore, savingsAfter) {
    const liquidBefore = checkingBefore + savingsBefore;
    const liquidAfter = checkingAfter + savingsAfter;
    const changePercent = ((liquidAfter - liquidBefore) / liquidBefore) * 100;
    if (changePercent > 5) {
        return `High increase: Liquid assets increased by ${changePercent.toFixed(1)}%`;
    }
    else if (changePercent < -10) {
        return `Significant decrease: Liquid assets decreased by ${Math.abs(changePercent).toFixed(1)}%`;
    }
    else if (changePercent < -5) {
        return `Moderate decrease: Liquid assets decreased by ${Math.abs(changePercent).toFixed(1)}%`;
    }
    else if (changePercent < 0) {
        return `Minor decrease: Liquid assets decreased by ${Math.abs(changePercent).toFixed(1)}%`;
    }
    else {
        return `No significant change to liquid assets`;
    }
}
export function calculateFutureValue(principal, monthlyContribution, annualReturnRate, years) {
    const monthlyRate = annualReturnRate / 12;
    const months = years * 12;
    let value = principal;
    for (let month = 0; month < months; month++) {
        value = value * (1 + monthlyRate);
        value += monthlyContribution;
    }
    return Math.round(value * 100) / 100;
}
export function calculateTimeToGoal(goal, monthlyContribution, assumedReturn = 0) {
    const remaining = goal.targetAmount - goal.currentAmount;
    if (remaining <= 0)
        return 0;
    if (monthlyContribution <= 0)
        return Infinity;
    if (assumedReturn === 0) {
        return Math.ceil(remaining / monthlyContribution);
    }
    const monthlyRate = assumedReturn / 12;
    const currentAmount = goal.currentAmount;
    const targetAmount = goal.targetAmount;
    let balance = currentAmount;
    let months = 0;
    const maxMonths = 1200;
    while (balance < targetAmount && months < maxMonths) {
        balance = balance * (1 + monthlyRate) + monthlyContribution;
        months++;
    }
    return months >= maxMonths ? Infinity : months;
}
export function calculateGoalImpact(goal, amountAdded, assumedAnnualReturn = 0.07) {
    if (goal.currentAmount >= goal.targetAmount) {
        return {
            goalId: goal.id,
            goalName: goal.name,
            progressChangePct: 0,
            timeToGoalBefore: 0,
            timeToGoalAfter: 0,
            timeSaved: 0,
            futureValue: goal.currentAmount,
        };
    }
    if (amountAdded === 0) {
        return {
            goalId: goal.id,
            goalName: goal.name,
            progressChangePct: 0,
            timeToGoalBefore: Infinity,
            timeToGoalAfter: Infinity,
            timeSaved: 0,
        };
    }
    const progressBefore = (goal.currentAmount / goal.targetAmount) * 100;
    const progressAfter = ((goal.currentAmount + amountAdded) / goal.targetAmount) * 100;
    const progressChangePct = progressAfter - progressBefore;
    let timeToGoalBefore = Infinity;
    let timeToGoalAfter = Infinity;
    if (assumedAnnualReturn > 0) {
        timeToGoalBefore = calculateTimeToGoal(goal, 0, assumedAnnualReturn);
        const adjustedGoal = { ...goal, currentAmount: goal.currentAmount + amountAdded };
        timeToGoalAfter = calculateTimeToGoal(adjustedGoal, 0, assumedAnnualReturn);
    }
    else {
        timeToGoalBefore = Infinity;
        timeToGoalAfter = Infinity;
    }
    const timeSaved = timeToGoalBefore - timeToGoalAfter;
    let futureValue;
    if (assumedAnnualReturn > 0) {
        const now = new Date();
        const deadline = new Date(goal.deadline);
        const yearsUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365);
        if (yearsUntilDeadline > 0) {
            futureValue = calculateFutureValue(amountAdded, 0, assumedAnnualReturn, yearsUntilDeadline);
        }
    }
    return {
        goalId: goal.id,
        goalName: goal.name,
        progressChangePct: Math.round(progressChangePct * 10) / 10,
        timeToGoalBefore,
        timeToGoalAfter,
        timeSaved: Math.max(0, timeSaved),
        futureValue,
    };
}
export function checkConstraintViolations(state, accountsAfter) {
    const violations = [];
    for (const guardrail of state.preferences.guardrails) {
        switch (guardrail.type) {
            case 'min_balance': {
                if (guardrail.accountId === 'checking' && guardrail.threshold) {
                    if (accountsAfter.checking < guardrail.threshold) {
                        violations.push(`${guardrail.rule} - Checking balance would be $${accountsAfter.checking.toFixed(2)} (minimum: $${guardrail.threshold})`);
                    }
                }
                if (guardrail.accountId === 'savings' && guardrail.threshold) {
                    if (accountsAfter.savings < guardrail.threshold) {
                        violations.push(`${guardrail.rule} - Savings balance would be $${accountsAfter.savings.toFixed(2)} (minimum: $${guardrail.threshold})`);
                    }
                }
                break;
            }
            case 'max_investment_pct': {
                const totalAssets = accountsAfter.checking +
                    accountsAfter.savings +
                    getInvestmentBalance(accountsAfter.investments.taxable) +
                    getInvestmentBalance(accountsAfter.investments.rothIRA) +
                    getInvestmentBalance(accountsAfter.investments.traditional401k);
                const investedAssets = getInvestmentBalance(accountsAfter.investments.taxable) +
                    getInvestmentBalance(accountsAfter.investments.rothIRA) +
                    getInvestmentBalance(accountsAfter.investments.traditional401k);
                const investmentPct = investedAssets / totalAssets;
                if (guardrail.threshold && investmentPct > guardrail.threshold) {
                    violations.push(`${guardrail.rule} - Investment allocation would be ${(investmentPct * 100).toFixed(1)}% (maximum: ${(guardrail.threshold * 100).toFixed(1)}%)`);
                }
                break;
            }
            case 'protected_account': {
                if (guardrail.accountId === 'savings') {
                    if (accountsAfter.savings < state.accounts.savings) {
                        violations.push(`${guardrail.rule} - Cannot reduce savings balance`);
                    }
                }
                break;
            }
        }
    }
    return violations;
}
export function simulate_save(state, amount, goalId) {
    const accountsAfterSave = cloneAccounts(state.accounts);
    accountsAfterSave.checking -= amount;
    accountsAfterSave.savings += amount;
    const goal = goalId ? state.goals.find(g => g.id === goalId) : undefined;
    const goalImpacts = [];
    if (goal) {
        const impact = calculateGoalImpact(goal, amount, SAVINGS_RETURN);
        goalImpacts.push(impact);
    }
    const budgetImpacts = state.spendingCategories.map(category => ({
        categoryId: category.id,
        categoryName: category.name,
        percentUsed: (category.currentSpent / category.monthlyBudget) * 100,
        amountRemaining: category.monthlyBudget - category.currentSpent,
        status: calculateBudgetStatus((category.currentSpent / category.monthlyBudget) * 100),
    }));
    const liquidityImpact = calculateLiquidityImpact(state.accounts.checking, accountsAfterSave.checking, state.accounts.savings, accountsAfterSave.savings);
    const constraintViolations = checkConstraintViolations(state, accountsAfterSave);
    const scenarioIfDo = {
        accountsAfter: accountsAfterSave,
        goalImpacts,
        budgetImpacts,
        liquidityImpact: `${liquidityImpact}. Savings remain fully liquid.`,
        riskImpact: 'No change in risk. Savings are FDIC insured.',
        timelineChanges: goalImpacts
            .filter(impact => impact.timeSaved > 0)
            .map(impact => `${impact.goalName}: Progress increased by ${impact.progressChangePct.toFixed(1)}%`),
    };
    const scenarioIfDont = {
        accountsAfter: cloneAccounts(state.accounts),
        goalImpacts: goalImpacts.map(impact => ({
            ...impact,
            progressChangePct: 0,
            timeSaved: 0,
            futureValue: undefined,
        })),
        budgetImpacts,
        liquidityImpact: 'No change to liquid assets.',
        riskImpact: 'No change in risk exposure.',
        timelineChanges: [],
    };
    const validationResult = {
        passed: constraintViolations.length === 0,
        constraintViolations,
        contradictions: [],
        uncertaintySources: [
            'Savings account return rate assumed at 4% APY',
        ],
        overallConfidence: constraintViolations.length === 0 ? 'high' : 'low',
    };
    const action = {
        type: 'save',
        amount,
        targetAccountId: 'savings',
        goalId,
    };
    return {
        action,
        scenarioIfDo,
        scenarioIfDont,
        confidence: constraintViolations.length === 0 ? 'high' : 'medium',
        reasoning: goal
            ? `Saving $${amount} will increase ${goal.name} progress by ${goalImpacts[0]?.progressChangePct.toFixed(1)}%. Funds remain liquid and low-risk.`
            : `Saving $${amount} increases emergency reserves. Funds remain liquid and FDIC insured.`,
        validationResult,
    };
}
export function simulate_invest(state, amount, accountType, goalId, timeHorizon = 5) {
    const accountsAfterInvest = cloneAccounts(state.accounts);
    accountsAfterInvest.checking -= amount;
    const currentAccount = accountsAfterInvest.investments[accountType];
    if (typeof currentAccount === 'number') {
        accountsAfterInvest.investments[accountType] = {
            balance: currentAccount + amount,
            allocation: { stocks: 100, bonds: 0, cash: 0 },
        };
    }
    else {
        currentAccount.balance += amount;
    }
    const goal = goalId ? state.goals.find(g => g.id === goalId) : undefined;
    const futureValue = calculateFutureValue(amount, 0, DEFAULT_ANNUAL_RETURN, timeHorizon);
    const projectedGain = futureValue - amount;
    const goalImpacts = [];
    if (goal) {
        const impact = calculateGoalImpact(goal, amount, DEFAULT_ANNUAL_RETURN);
        goalImpacts.push(impact);
    }
    const budgetImpacts = state.spendingCategories.map(category => ({
        categoryId: category.id,
        categoryName: category.name,
        percentUsed: (category.currentSpent / category.monthlyBudget) * 100,
        amountRemaining: category.monthlyBudget - category.currentSpent,
        status: calculateBudgetStatus((category.currentSpent / category.monthlyBudget) * 100),
    }));
    const liquidityImpact = `Moderate decrease in liquidity. Checking reduced by $${amount}. ` +
        `Investment can be sold but may lose short-term value.`;
    const riskImpact = `Moderate risk increase. $${amount} exposed to market volatility. ` +
        `Projected value in ${timeHorizon} years: $${futureValue.toFixed(2)} ` +
        `(+$${projectedGain.toFixed(2)} at 7% annual return).`;
    const constraintViolations = checkConstraintViolations(state, accountsAfterInvest);
    const scenarioIfDo = {
        accountsAfter: accountsAfterInvest,
        goalImpacts,
        budgetImpacts,
        liquidityImpact,
        riskImpact,
        timelineChanges: [
            `Investment projected to grow to $${futureValue.toFixed(2)} in ${timeHorizon} years`,
            ...goalImpacts
                .filter(impact => impact.timeSaved > 0)
                .map(impact => `${impact.goalName}: Progress increased by ${impact.progressChangePct.toFixed(1)}%`),
        ],
    };
    const scenarioIfDont = {
        accountsAfter: cloneAccounts(state.accounts),
        goalImpacts: goalImpacts.map(impact => ({
            ...impact,
            progressChangePct: 0,
            timeSaved: 0,
            futureValue: undefined,
        })),
        budgetImpacts,
        liquidityImpact: 'No change to liquidity.',
        riskImpact: `Opportunity cost: Potential $${projectedGain.toFixed(2)} in gains not realized.`,
        timelineChanges: [],
    };
    const validationResult = {
        passed: constraintViolations.length === 0,
        constraintViolations,
        contradictions: [],
        uncertaintySources: [
            'Market returns assumed at 7% historical average',
            'Does not account for market volatility or downturns',
            `Projection is for ${timeHorizon} year time horizon`,
        ],
        overallConfidence: constraintViolations.length === 0 ? 'medium' : 'low',
    };
    const action = {
        type: 'invest',
        amount,
        targetAccountId: accountType,
        goalId,
    };
    return {
        action,
        scenarioIfDo,
        scenarioIfDont,
        confidence: constraintViolations.length === 0 ? 'medium' : 'low',
        reasoning: goal
            ? `Investing $${amount} supports ${goal.name}. Expected value in ${timeHorizon} years: $${futureValue.toFixed(2)} ` +
                `(+${((projectedGain / amount) * 100).toFixed(1)}% gain). ${state.preferences.riskTolerance === 'conservative' ? 'Consider your conservative risk tolerance.' : 'Aligns with your risk profile.'}`
            : `Investing $${amount} in ${accountType} provides growth potential. ` +
                `Projected value: $${futureValue.toFixed(2)} in ${timeHorizon} years.`,
        validationResult,
    };
}
export function simulate_spend(state, amount, category) {
    const accountsAfterSpend = cloneAccounts(state.accounts);
    accountsAfterSpend.checking -= amount;
    const spendingCategory = state.spendingCategories.find(c => c.id === category || c.name === category);
    const budgetImpacts = state.spendingCategories.map(cat => {
        if (cat.id === category || cat.name === category) {
            const newSpent = cat.currentSpent + amount;
            const percentUsed = (newSpent / cat.monthlyBudget) * 100;
            return {
                categoryId: cat.id,
                categoryName: cat.name,
                percentUsed,
                amountRemaining: cat.monthlyBudget - newSpent,
                status: calculateBudgetStatus(percentUsed),
            };
        }
        else {
            const percentUsed = (cat.currentSpent / cat.monthlyBudget) * 100;
            return {
                categoryId: cat.id,
                categoryName: cat.name,
                percentUsed,
                amountRemaining: cat.monthlyBudget - cat.currentSpent,
                status: calculateBudgetStatus(percentUsed),
            };
        }
    });
    const goalImpacts = state.goals
        .filter(g => g.priority <= 2)
        .map(goal => ({
        goalId: goal.id,
        goalName: goal.name,
        progressChangePct: 0,
        timeToGoalBefore: Infinity,
        timeToGoalAfter: Infinity,
        timeSaved: 0,
    }));
    const liquidityImpact = `Checking balance reduced by $${amount}. ` +
        `Remaining: $${accountsAfterSpend.checking.toFixed(2)}.`;
    const riskImpact = 'No change in investment risk exposure.';
    const constraintViolations = checkConstraintViolations(state, accountsAfterSpend);
    const categoryImpact = budgetImpacts.find(bi => bi.categoryId === category || bi.categoryName === category);
    const budgetWarning = categoryImpact && categoryImpact.status === 'over'
        ? `Warning: This exceeds your ${categoryImpact.categoryName} budget by $${Math.abs(categoryImpact.amountRemaining).toFixed(2)}`
        : categoryImpact && categoryImpact.status === 'warning'
            ? `Caution: This uses ${categoryImpact.percentUsed.toFixed(1)}% of your ${categoryImpact.categoryName} budget`
            : '';
    const scenarioIfDo = {
        accountsAfter: accountsAfterSpend,
        goalImpacts,
        budgetImpacts,
        liquidityImpact,
        riskImpact,
        timelineChanges: budgetWarning ? [budgetWarning] : [],
    };
    const potentialSavingsGrowth = calculateFutureValue(amount, 0, DEFAULT_ANNUAL_RETURN, 5);
    const scenarioIfDont = {
        accountsAfter: cloneAccounts(state.accounts),
        goalImpacts: goalImpacts.map(impact => ({ ...impact })),
        budgetImpacts: state.spendingCategories.map(cat => {
            const percentUsed = (cat.currentSpent / cat.monthlyBudget) * 100;
            return {
                categoryId: cat.id,
                categoryName: cat.name,
                percentUsed,
                amountRemaining: cat.monthlyBudget - cat.currentSpent,
                status: calculateBudgetStatus(percentUsed),
            };
        }),
        liquidityImpact: 'No change to checking balance.',
        riskImpact: `Opportunity: $${amount} could be saved or invested instead. ` +
            `If invested, potential value in 5 years: $${potentialSavingsGrowth.toFixed(2)}.`,
        timelineChanges: [],
    };
    const validationResult = {
        passed: constraintViolations.length === 0,
        constraintViolations,
        contradictions: categoryImpact && categoryImpact.status === 'over'
            ? [`Spending exceeds ${categoryImpact.categoryName} budget`]
            : [],
        uncertaintySources: [],
        overallConfidence: constraintViolations.length === 0 && (!categoryImpact || categoryImpact.status !== 'over')
            ? 'high'
            : 'medium',
    };
    const action = {
        type: 'spend',
        amount,
        category,
    };
    return {
        action,
        scenarioIfDo,
        scenarioIfDont,
        confidence: validationResult.overallConfidence,
        reasoning: spendingCategory
            ? `Spending $${amount} on ${spendingCategory.name}. ${budgetWarning || `Within budget (${categoryImpact?.percentUsed.toFixed(1)}% used).`} ` +
                `Opportunity cost: Could grow to $${potentialSavingsGrowth.toFixed(2)} if invested instead.`
            : `Spending $${amount}. Consider saving or investing for long-term goals instead.`,
        validationResult,
    };
}
export function compare_options(state, options) {
    return options.map(option => {
        switch (option.type) {
            case 'save':
                return simulate_save(state, option.amount, option.goalId);
            case 'invest':
                return simulate_invest(state, option.amount, option.targetAccountId || 'taxable', option.goalId);
            case 'spend':
                return simulate_spend(state, option.amount, option.category || 'Miscellaneous');
            default:
                throw new Error(`Unknown action type: ${option.type}`);
        }
    });
}
//# sourceMappingURL=simulation-engine.js.map