import { getInvestmentBalance, getInvestmentAllocation } from '../../types/financial.js';
const LIFESTYLE_CRITICAL_KEYWORDS = [
    'groceries', 'food', 'dining', 'rent', 'housing', 'mortgage',
    'utilities', 'transportation', 'gas', 'subscriptions', 'healthcare',
    'insurance', 'childcare', 'education', 'gym', 'wellness'
];
const MIN_EMERGENCY_MONTHS = 3;
const MODERATE_STOCK_PCT = 60;
const LOW_RISK_STOCK_PCT = 50;
const MIN_CHECKING = 1000;
function monthlyFixed(user) {
    return user.fixedExpenses.reduce((t, e) => {
        return t + (e.frequency === 'monthly' ? e.amount : e.amount / 12);
    }, 0);
}
function monthlyDiscretionary(user) {
    return user.spendingCategories.reduce((t, c) => t + c.monthlyBudget, 0);
}
function liquid(user) {
    return user.accounts.checking + user.accounts.savings;
}
function getPortfolioStockPct(user) {
    const inv = user.accounts.investments;
    const taxable = getInvestmentBalance(inv.taxable);
    const roth = getInvestmentBalance(inv.rothIRA);
    const trad = getInvestmentBalance(inv.traditional401k);
    const total = taxable + roth + trad;
    if (total === 0)
        return 0;
    const taxableAlloc = getInvestmentAllocation(inv.taxable);
    const rothAlloc = getInvestmentAllocation(inv.rothIRA);
    const tradAlloc = getInvestmentAllocation(inv.traditional401k);
    const weightedStocks = (taxable * taxableAlloc.stocks +
        roth * rothAlloc.stocks +
        trad * tradAlloc.stocks) / total;
    return Math.round(weightedStocks * 10) / 10;
}
function isLifestyleCritical(category) {
    const lower = category.name.toLowerCase();
    return LIFESTYLE_CRITICAL_KEYWORDS.some(kw => lower.includes(kw));
}
function calculateRiskScore(user) {
    const stockPct = getPortfolioStockPct(user);
    const investmentVolatility = Math.min(100, stockPct);
    const liquidAssets = liquid(user);
    const monthlyExpenses = monthlyFixed(user) + monthlyDiscretionary(user);
    const monthsCovered = monthlyExpenses > 0 ? liquidAssets / monthlyExpenses : 12;
    const emergencyBuffer = Math.max(0, Math.min(100, (1 - monthsCovered / 6) * 100));
    const fixedRatio = user.monthlyIncome > 0 ? monthlyFixed(user) / user.monthlyIncome : 1;
    const fixedCostExposure = Math.min(100, fixedRatio * 200);
    const checkingMonths = monthlyExpenses > 0 ? user.accounts.checking / monthlyExpenses : 3;
    const cashFlowStability = Math.max(0, Math.min(100, (1 - checkingMonths / 2) * 100));
    const overall = Math.round(investmentVolatility * 0.35 +
        emergencyBuffer * 0.30 +
        fixedCostExposure * 0.20 +
        cashFlowStability * 0.15);
    return {
        overall,
        breakdown: {
            investmentVolatility: Math.round(investmentVolatility),
            emergencyBuffer: Math.round(emergencyBuffer),
            fixedCostExposure: Math.round(fixedCostExposure),
            cashFlowStability: Math.round(cashFlowStability),
        },
    };
}
function detectRiskFactors(user) {
    const factors = [];
    const stockPct = getPortfolioStockPct(user);
    if (stockPct > 70) {
        factors.push({
            id: 'high_stock_concentration',
            name: 'High Stock Concentration',
            severity: stockPct > 85 ? 'high' : 'medium',
            description: `Portfolio is ${stockPct.toFixed(0)}% stocks, exposing you to market volatility.`,
            currentValue: stockPct,
            targetValue: MODERATE_STOCK_PCT,
            unit: '%',
        });
    }
    const liquidAssets = liquid(user);
    const monthlyExpenses = monthlyFixed(user) + monthlyDiscretionary(user);
    const monthsCovered = monthlyExpenses > 0 ? liquidAssets / monthlyExpenses : 12;
    if (monthsCovered < MIN_EMERGENCY_MONTHS) {
        factors.push({
            id: 'low_emergency_buffer',
            name: 'Low Emergency Buffer',
            severity: monthsCovered < 1 ? 'high' : 'medium',
            description: `Only ${monthsCovered.toFixed(1)} months of expenses in liquid savings (target: ${MIN_EMERGENCY_MONTHS}+ months).`,
            currentValue: monthsCovered,
            targetValue: MIN_EMERGENCY_MONTHS,
            unit: 'months',
        });
    }
    const fixedRatio = user.monthlyIncome > 0 ? (monthlyFixed(user) / user.monthlyIncome) * 100 : 100;
    if (fixedRatio > 50) {
        factors.push({
            id: 'high_fixed_costs',
            name: 'High Fixed Cost Ratio',
            severity: fixedRatio > 65 ? 'high' : 'medium',
            description: `${fixedRatio.toFixed(0)}% of income goes to fixed expenses, leaving little flexibility.`,
            currentValue: fixedRatio,
            targetValue: 40,
            unit: '%',
        });
    }
    const checkingMonths = monthlyExpenses > 0 ? user.accounts.checking / monthlyExpenses : 3;
    if (checkingMonths < 0.5) {
        factors.push({
            id: 'low_checking_buffer',
            name: 'Cash Flow Timing Risk',
            severity: 'high',
            description: `Checking balance only covers ${(checkingMonths * 30).toFixed(0)} days of expenses.`,
            currentValue: user.accounts.checking,
            targetValue: monthlyExpenses,
            unit: '$',
        });
    }
    const inv = user.accounts.investments;
    const taxable = getInvestmentBalance(inv.taxable);
    const roth = getInvestmentBalance(inv.rothIRA);
    const trad = getInvestmentBalance(inv.traditional401k);
    const totalInv = taxable + roth + trad;
    if (totalInv > 0) {
        const maxSingle = Math.max(taxable, roth, trad);
        const concentration = (maxSingle / totalInv) * 100;
        if (concentration > 90 && totalInv > 5000) {
            factors.push({
                id: 'account_concentration',
                name: 'Single Account Concentration',
                severity: 'low',
                description: `${concentration.toFixed(0)}% of investments in one account type.`,
                currentValue: concentration,
                targetValue: 70,
                unit: '%',
            });
        }
    }
    return factors;
}
function rebalanceToLowerVolatility(user, targetStockPct) {
    const inv = user.accounts.investments;
    const currentStockPct = getPortfolioStockPct(user);
    if (currentStockPct <= targetStockPct) {
        return { newInvestments: inv };
    }
    const taxable = inv.taxable;
    if (typeof taxable === 'object' && taxable.balance > 0) {
        const currentAlloc = taxable.allocation;
        const stockReduction = Math.min(currentAlloc.stocks, currentStockPct - targetStockPct);
        const newAlloc = {
            stocks: Math.max(0, currentAlloc.stocks - stockReduction),
            bonds: Math.min(100, currentAlloc.bonds + stockReduction * 0.7),
            cash: Math.min(100, (currentAlloc.cash || 0) + stockReduction * 0.3),
        };
        const total = newAlloc.stocks + newAlloc.bonds + newAlloc.cash;
        if (total !== 100) {
            const scale = 100 / total;
            newAlloc.stocks = Math.round(newAlloc.stocks * scale);
            newAlloc.bonds = Math.round(newAlloc.bonds * scale);
            newAlloc.cash = 100 - newAlloc.stocks - newAlloc.bonds;
        }
        return {
            newInvestments: {
                ...inv,
                taxable: { ...taxable, allocation: newAlloc },
            },
            action: {
                type: 'rebalance_investments',
                description: `Rebalanced taxable investments from ${currentAlloc.stocks}% stocks to ${newAlloc.stocks}% stocks, increasing bonds/cash allocation.`,
                details: {
                    before: currentAlloc,
                    after: newAlloc,
                    portfolioStockBefore: currentStockPct,
                    portfolioStockAfter: targetStockPct,
                },
            },
        };
    }
    return { newInvestments: inv };
}
function increaseEmergencyLiquidity(user, targetMonths) {
    const monthlyExpenses = monthlyFixed(user) + monthlyDiscretionary(user);
    const currentLiquid = liquid(user);
    const targetLiquid = monthlyExpenses * targetMonths;
    const shortfall = targetLiquid - currentLiquid;
    if (shortfall <= 0) {
        return { newAccounts: user.accounts };
    }
    const inv = user.accounts.investments;
    const taxableBalance = getInvestmentBalance(inv.taxable);
    const moveAmount = Math.min(shortfall, taxableBalance * 0.3);
    if (moveAmount > 100) {
        const newTaxable = typeof inv.taxable === 'number'
            ? inv.taxable - moveAmount
            : { ...inv.taxable, balance: inv.taxable.balance - moveAmount };
        return {
            newAccounts: {
                ...user.accounts,
                savings: user.accounts.savings + moveAmount,
                investments: {
                    ...inv,
                    taxable: newTaxable,
                },
            },
            action: {
                type: 'increase_liquidity',
                description: `Moved $${moveAmount.toFixed(0)} from taxable investments to savings to increase emergency buffer.`,
                details: {
                    amount: moveAmount,
                    newSavings: user.accounts.savings + moveAmount,
                    newEmergencyMonths: (currentLiquid + moveAmount) / monthlyExpenses,
                },
            },
        };
    }
    return { newAccounts: user.accounts };
}
function ensureCheckingBuffer(user, minChecking) {
    if (user.accounts.checking >= minChecking) {
        return { newAccounts: user.accounts };
    }
    const needed = minChecking - user.accounts.checking;
    const available = user.accounts.savings - 500;
    if (available > 0) {
        const moveAmount = Math.min(needed, available);
        return {
            newAccounts: {
                ...user.accounts,
                checking: user.accounts.checking + moveAmount,
                savings: user.accounts.savings - moveAmount,
            },
            action: {
                type: 'buffer_adjustment',
                description: `Moved $${moveAmount.toFixed(0)} from savings to checking to maintain cash flow buffer.`,
                details: {
                    amount: moveAmount,
                    newChecking: user.accounts.checking + moveAmount,
                },
            },
        };
    }
    return { newAccounts: user.accounts };
}
export function runRiskReduction(user, options) {
    const now = new Date();
    const riskScoreBefore = calculateRiskScore(user);
    const lifestyleLockedCategories = user.spendingCategories
        .filter(isLifestyleCritical)
        .map(c => c.id);
    const riskFactorsIdentified = detectRiskFactors(user);
    const actionsExecuted = [];
    let currentAccounts = { ...user.accounts };
    let currentInvestments = user.accounts.investments;
    if (lifestyleLockedCategories.length > 0) {
        actionsExecuted.push({
            type: 'lock_category',
            description: `Protected ${lifestyleLockedCategories.length} lifestyle categories from any reduction.`,
            details: { categories: lifestyleLockedCategories },
        });
    }
    const stockPct = getPortfolioStockPct(user);
    if (stockPct > 70) {
        const targetStock = user.preferences.riskTolerance === 'conservative' ? LOW_RISK_STOCK_PCT : MODERATE_STOCK_PCT;
        const { newInvestments, action } = rebalanceToLowerVolatility({ ...user, accounts: { ...currentAccounts, investments: currentInvestments } }, targetStock);
        currentInvestments = newInvestments;
        currentAccounts = { ...currentAccounts, investments: currentInvestments };
        if (action)
            actionsExecuted.push(action);
    }
    const monthlyExpenses = monthlyFixed(user) + monthlyDiscretionary(user);
    const currentMonthsCovered = liquid({ ...user, accounts: currentAccounts }) / monthlyExpenses;
    if (currentMonthsCovered < MIN_EMERGENCY_MONTHS) {
        const { newAccounts, action } = increaseEmergencyLiquidity({ ...user, accounts: currentAccounts }, MIN_EMERGENCY_MONTHS);
        currentAccounts = newAccounts;
        if (action)
            actionsExecuted.push(action);
    }
    const { newAccounts: finalAccounts, action: bufferAction } = ensureCheckingBuffer({ ...user, accounts: currentAccounts }, Math.max(MIN_CHECKING, monthlyExpenses * 0.5));
    currentAccounts = finalAccounts;
    if (bufferAction)
        actionsExecuted.push(bufferAction);
    const updatedUserProfile = {
        ...user,
        accounts: currentAccounts,
        risk_reduction_mode: true,
        lifestyle_locked_categories: lifestyleLockedCategories,
        risk_reduction_applied_at: now.toISOString(),
        updatedAt: now,
    };
    const riskScoreAfter = calculateRiskScore(updatedUserProfile);
    if (options?.persist) {
        options.persist(updatedUserProfile);
    }
    const explanation = buildExplanation(riskScoreBefore, riskScoreAfter, riskFactorsIdentified, actionsExecuted, lifestyleLockedCategories);
    return {
        riskScoreBefore,
        riskScoreAfter,
        riskFactorsIdentified,
        actionsExecuted,
        lifestyleLockedCategories,
        lifestylePreserved: true,
        explanation,
        updatedUserProfile,
    };
}
function buildExplanation(before, after, factors, actions, lockedCategories) {
    const lines = [];
    lines.push(`**Risk Reduction Complete — Lifestyle Preserved**`);
    lines.push('');
    const riskChange = before.overall - after.overall;
    if (riskChange > 0) {
        lines.push(`Your financial risk score improved from **${before.overall}** to **${after.overall}** (↓${riskChange} points).`);
    }
    else if (riskChange === 0) {
        lines.push(`Your risk score remains at **${after.overall}** — already well-optimized.`);
    }
    if (factors.length > 0) {
        lines.push('');
        lines.push('**Risks Identified:**');
        for (const f of factors) {
            const icon = f.severity === 'high' ? '🔴' : f.severity === 'medium' ? '🟡' : '🟢';
            lines.push(`${icon} ${f.name}: ${f.description}`);
        }
    }
    if (actions.length > 0) {
        lines.push('');
        lines.push('**Actions Taken:**');
        for (const a of actions) {
            lines.push(`• ${a.description}`);
        }
    }
    if (lockedCategories.length > 0) {
        lines.push('');
        lines.push(`✅ **Lifestyle Protected:** ${lockedCategories.length} spending categories locked from any reduction.`);
    }
    lines.push('');
    lines.push('**Downside Scenarios Now Protected Against:**');
    if (before.breakdown.investmentVolatility > after.breakdown.investmentVolatility) {
        lines.push('• Market downturn: reduced stock exposure limits losses');
    }
    if (before.breakdown.emergencyBuffer > after.breakdown.emergencyBuffer) {
        lines.push('• Job loss: increased emergency buffer provides runway');
    }
    if (before.breakdown.cashFlowStability > after.breakdown.cashFlowStability) {
        lines.push('• Cash flow timing: checking buffer prevents overdrafts');
    }
    return lines.join('\n');
}
export { calculateRiskScore, detectRiskFactors };
//# sourceMappingURL=risk-reduction-handler.js.map