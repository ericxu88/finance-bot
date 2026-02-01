/**
 * Increase savings without lowering lifestyle
 *
 * Budgets are threshold values (spending limits), not actual money.
 * - Protects categories the user actively values (entertainment, dining, hobbies, music)
 * - Lowers budget thresholds for non-lifestyle discretionary categories (so user commits to spend less there)
 * - Does NOT move money or change account balances; only updates budget limits
 */

import type { UserProfile, SpendingCategory } from '../../types/financial.js';
import { getInvestmentBalance } from '../../types/financial.js';
import type {
  IncreaseSavingsWithoutLifestyleResult,
  SavingsAction,
  UpdatedBalancesProjection,
} from './types.js';

function deepCopyCategories(categories: SpendingCategory[]): SpendingCategory[] {
  return categories.map((c) => ({
    ...c,
    transactions: [...c.transactions],
    subcategories: c.subcategories ? c.subcategories.map((s) => ({ ...s })) : undefined,
  }));
}

const MAX_REALLOCATION_PCT = 0.15; // at most 15% of a category's budget threshold
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

function isLifestyleCategory(cat: SpendingCategory): boolean {
  const name = cat.name.toLowerCase();
  const hasKeyword = LIFESTYLE_KEYWORDS.some((k) => name.includes(k));
  if (hasKeyword) return true;
  // High utilization + looks like lifestyle (e.g. "entertainment" in transactions)
  const utilization = cat.monthlyBudget > 0 ? cat.currentSpent / cat.monthlyBudget : 0;
  const lifestyleInName = /entertainment|dining|hobby|music|concert|streaming|event/i.test(name);
  return lifestyleInName && utilization >= 0.5;
}

function isEssentialCategory(cat: SpendingCategory): boolean {
  const name = cat.name.toLowerCase();
  return ESSENTIAL_CATEGORY_KEYWORDS.some((k) => name.includes(k));
}

function isNonLifestyleDiscretionary(cat: SpendingCategory): boolean {
  if (cat.monthlyBudget <= 0) return false;
  if (isLifestyleCategory(cat)) return false;
  if (isEssentialCategory(cat)) return false;
  return true;
}

function totalInvestments(user: UserProfile): number {
  const inv = user.accounts.investments;
  return (
    getInvestmentBalance(inv.taxable) +
    getInvestmentBalance(inv.rothIRA) +
    getInvestmentBalance(inv.traditional401k)
  );
}

/**
 * Compute reallocatable surplus from non-lifestyle discretionary categories.
 * Caps at MAX_REALLOCATION_PCT of each category's budget to keep it realistic.
 */
export function runIncreaseSavingsWithoutLifestyle(
  user: UserProfile
): IncreaseSavingsWithoutLifestyleResult {
  const protected_categories: string[] = [];
  const actions: SavingsAction[] = [];

  let toSavings = 0;
  const investments = totalInvestments(user);

  // 1. Identify protected (lifestyle) categories
  for (const cat of user.spendingCategories) {
    if (isLifestyleCategory(cat)) {
      protected_categories.push(cat.name);
    }
  }

  // 2. Lower budget thresholds for non-lifestyle discretionary (thresholds only; no balance changes)
  for (const cat of user.spendingCategories) {
    if (!isNonLifestyleDiscretionary(cat)) continue;
    const reduction = cat.monthlyBudget * MAX_REALLOCATION_PCT;
    const amount = Math.round(Math.max(0, reduction) * 100) / 100;
    if (amount < 5) continue; // skip tiny amounts
    toSavings += amount;
    actions.push({
      type: 'transfer',
      from: cat.name,
      to: 'savings',
      amount,
      reason: `Lowered ${cat.name} budget threshold by $${amount.toFixed(0)}/month (spending limit only; no money moved).`,
    });
  }

  // 3. Cap total threshold reduction at a realistic share of income
  const fixedTotal = user.fixedExpenses.reduce(
    (s, e) => s + (e.frequency === 'monthly' ? e.amount : e.amount / 12),
    0
  );
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

  // Balances unchanged: budgets are thresholds only; we do not allocate to savings balance
  const updated_balances_projection: UpdatedBalancesProjection = {
    checking: user.accounts.checking,
    savings: user.accounts.savings,
    investments,
  };

  const explanation =
    protected_categories.length > 0
      ? `Protected your lifestyle spending in: ${protected_categories.join(', ')}. ` +
        `Lowered budget thresholds by $${toSavings.toFixed(0)}/month in non-lifestyle categories (e.g. transportation, optional spending). ` +
        `Account balances are unchanged; only spending limits were reduced so you can save more if you stay within the new limits.`
      : `Lowered budget thresholds by $${toSavings.toFixed(0)}/month in discretionary categories. ` +
        `Account balances are unchanged; only spending limits were reduced.`;

  // 4. Apply only budget threshold changes; do not change account balances
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
  const updatedUserProfile: UserProfile = {
    ...user,
    accounts: user.accounts, // unchanged: budgets are thresholds, not actual money
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
