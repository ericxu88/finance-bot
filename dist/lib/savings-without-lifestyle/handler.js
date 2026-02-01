import { getInvestmentBalance } from '../../types/financial.js';
function deepCopyCategories(categories) {
    return categories.map((c) => ({
        ...c,
        transactions: [...c.transactions],
        subcategories: c.subcategories ? c.subcategories.map((s) => ({ ...s })) : undefined,
    }));
}
const MAX_REALLOCATION_PCT = 0.15;
const LIFESTYLE_KEYWORDS = [
    'entertainment',
    'dining',
    'hobbies',
    'music',
    'concert',
    'streaming',
    'restaurant',
    'coffee',
    'events',
    'dining out',
];
const ESSENTIAL_CATEGORY_KEYWORDS = ['groceries', 'healthcare', 'income', 'transfers', 'savings', 'utilities', 'bills'];
function isLifestyleCategory(cat) {
    const name = cat.name.toLowerCase();
    const hasKeyword = LIFESTYLE_KEYWORDS.some((k) => name.includes(k));
    if (hasKeyword)
        return true;
    const utilization = cat.monthlyBudget > 0 ? cat.currentSpent / cat.monthlyBudget : 0;
    const lifestyleInName = /entertainment|dining|hobby|music|concert|streaming|event/i.test(name);
    return lifestyleInName && utilization >= 0.5;
}
function isEssentialCategory(cat) {
    const name = cat.name.toLowerCase();
    return ESSENTIAL_CATEGORY_KEYWORDS.some((k) => name.includes(k));
}
function isNonLifestyleDiscretionary(cat) {
    if (cat.monthlyBudget <= 0)
        return false;
    if (isLifestyleCategory(cat))
        return false;
    if (isEssentialCategory(cat))
        return false;
    return true;
}
function totalInvestments(user) {
    const inv = user.accounts.investments;
    return (getInvestmentBalance(inv.taxable) +
        getInvestmentBalance(inv.rothIRA) +
        getInvestmentBalance(inv.traditional401k));
}
export function runIncreaseSavingsWithoutLifestyle(user) {
    const protected_categories = [];
    const actions = [];
    let toSavings = 0;
    const investments = totalInvestments(user);
    for (const cat of user.spendingCategories) {
        if (isLifestyleCategory(cat)) {
            protected_categories.push(cat.name);
        }
    }
    for (const cat of user.spendingCategories) {
        if (!isNonLifestyleDiscretionary(cat))
            continue;
        const reduction = cat.monthlyBudget * MAX_REALLOCATION_PCT;
        const amount = Math.round(Math.max(0, reduction) * 100) / 100;
        if (amount < 5)
            continue;
        toSavings += amount;
        actions.push({
            type: 'transfer',
            from: cat.name,
            to: 'savings',
            amount,
            reason: `Lowered ${cat.name} budget threshold by $${amount.toFixed(0)}/month (spending limit only; no money moved).`,
        });
    }
    const fixedTotal = user.fixedExpenses.reduce((s, e) => s + (e.frequency === 'monthly' ? e.amount : e.amount / 12), 0);
    const discretionaryTotal = user.spendingCategories.reduce((s, c) => s + c.monthlyBudget, 0);
    const monthlySurplus = user.monthlyIncome - fixedTotal - discretionaryTotal;
    const realisticCap = Math.max(monthlySurplus * 0.25, 50);
    if (toSavings > realisticCap && actions.length > 0) {
        const scale = realisticCap / toSavings;
        toSavings = 0;
        for (const a of actions) {
            a.amount = Math.round(a.amount * scale * 100) / 100;
            toSavings += a.amount;
        }
    }
    const updated_balances_projection = {
        checking: user.accounts.checking,
        savings: user.accounts.savings,
        investments,
    };
    const explanation = protected_categories.length > 0
        ? `Protected your lifestyle spending in: ${protected_categories.join(', ')}. ` +
            `Lowered budget thresholds by $${toSavings.toFixed(0)}/month in non-lifestyle categories (e.g. transportation, optional spending). ` +
            `Account balances are unchanged; only spending limits were reduced so you can save more if you stay within the new limits.`
        : `Lowered budget thresholds by $${toSavings.toFixed(0)}/month in discretionary categories. ` +
            `Account balances are unchanged; only spending limits were reduced.`;
    const now = new Date();
    const nextSpendingCategories = deepCopyCategories(user.spendingCategories);
    for (const a of actions) {
        if (a.type === 'transfer' && a.to === 'savings') {
            const cat = nextSpendingCategories.find((c) => c.name === a.from);
            if (cat) {
                cat.monthlyBudget = Math.round((cat.monthlyBudget - a.amount) * 100) / 100;
                cat.monthlyBudget = Math.max(0, cat.monthlyBudget);
            }
        }
    }
    const updatedUserProfile = {
        ...user,
        accounts: user.accounts,
        spendingCategories: nextSpendingCategories,
        updatedAt: now,
    };
    return {
        protected_categories,
        actions,
        updated_balances_projection,
        explanation,
        updatedUserProfile,
    };
}
//# sourceMappingURL=handler.js.map