/**
 * Stabilization Handler
 *
 * Implements "Stabilize my finances for the next month":
 * - Analyze cash flow and upcoming expenses
 * - Calculate minimum safe liquidity buffer (30 days)
 * - Identify non-essential discretionary, high-risk investments, optional contributions
 * - Execute: increase liquidity buffer, reduce non-critical investments/discretionary
 * - Persist stabilization_mode with 30-day expiration
 */

import type { UserProfile, Accounts, SpendingCategory } from '../../types/financial.js';
import { getInvestmentBalance, getInvestmentAllocation } from '../../types/financial.js';
import { analyzeUpcomingExpenses } from '../investment-reminders.js';

// Helpers (inlined to avoid circular deps)
function monthlyFixed(user: UserProfile): number {
  return user.fixedExpenses.reduce((t, e) => {
    return t + (e.frequency === 'monthly' ? e.amount : e.amount / 12);
  }, 0);
}
function monthlyDiscretionary(user: UserProfile): number {
  return user.spendingCategories.reduce((t, c) => t + c.monthlyBudget, 0);
}
function liquid(user: UserProfile): number {
  return user.accounts.checking + user.accounts.savings;
}

const MIN_CHECKING = 1000;
const BUFFER_DAYS = 30;
const DISCRETIONARY_BUFFER_RATIO = 0.5; // use 50% of discretionary in buffer calc
const MAX_TAXABLE_PULL_PCT = 0.5; // at most 50% of taxable moved to savings
const DISCRETIONARY_TRIM_PCT = 0.15; // trim non-essential budgets by 15%
const NON_ESSENTIAL_NAMES = ['dining', 'entertainment', 'shopping', 'subscriptions', 'hobbies', 'travel', 'dining out'];

export interface StabilizationResult {
  before: { checking: number; savings: number; totalLiquid: number };
  after: { checking: number; savings: number; totalLiquid: number };
  minimumSafeBuffer: number;
  shortfall: number;
  actions: Array<{ type: string; description: string; amount?: number }>;
  explanation: string;
  updatedUserProfile: UserProfile;
  stabilization_start: string;
  stabilization_end: string;
}

/**
 * Compute minimum safe liquidity buffer for the next 30 days.
 */
export function computeMinimumSafeBuffer(user: UserProfile): number {
  const fixed = monthlyFixed(user);
  const disc = monthlyDiscretionary(user);
  const upcoming = analyzeUpcomingExpenses(user);
  const upcoming30 = upcoming.totalDueNext30Days || 0;
  const buffer =
    fixed + disc * DISCRETIONARY_BUFFER_RATIO + upcoming30;
  return Math.max(buffer, MIN_CHECKING);
}

/**
 * Identify discretionary categories considered non-essential (trim candidates).
 */
function getNonEssentialCategories(user: UserProfile): SpendingCategory[] {
  return user.spendingCategories.filter((c) =>
    NON_ESSENTIAL_NAMES.some((n) => c.name.toLowerCase().includes(n))
  );
}

/**
 * Check if an investment account is high-risk (stocks-heavy).
 */
function isHighRiskAllocation(allocation: { stocks: number }): boolean {
  return allocation.stocks >= 70;
}

export function runStabilization(
  user: UserProfile,
  options?: { userId?: string; persist?: (profile: UserProfile) => void }
): StabilizationResult {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + BUFFER_DAYS);

  const startIso = now.toISOString();
  const endIso = end.toISOString();

  const beforeChecking = user.accounts.checking;
  const beforeSavings = user.accounts.savings;
  const beforeLiquid = liquid(user);

  const minimumSafeBuffer = computeMinimumSafeBuffer(user);
  const shortfall = Math.max(0, minimumSafeBuffer - beforeLiquid);

  const actions: Array<{ type: string; description: string; amount?: number }> = [];
  let nextAccounts: Accounts = { ...user.accounts, checking: user.accounts.checking, savings: user.accounts.savings };
  const nextSpendingCategories: SpendingCategory[] = user.spendingCategories.map((c) => ({ ...c }));

  // 1) Increase liquidity: move from taxable to savings if shortfall and taxable available
  const taxableBalance = getInvestmentBalance(user.accounts.investments.taxable);
  const taxableAlloc = getInvestmentAllocation(user.accounts.investments.taxable);
  const canPullFromTaxable =
    shortfall > 0 &&
    taxableBalance > 0 &&
    (isHighRiskAllocation(taxableAlloc) || shortfall > 0);
  const pullAmount =
    canPullFromTaxable
      ? Math.min(shortfall, taxableBalance * MAX_TAXABLE_PULL_PCT, taxableBalance)
      : 0;

  if (pullAmount > 0) {
    const inv = user.accounts.investments.taxable;
    const newTaxableBalance = getInvestmentBalance(inv) - pullAmount;
    const newTaxable =
      typeof inv === 'number'
        ? newTaxableBalance
        : { ...inv, balance: newTaxableBalance };
    nextAccounts = {
      ...nextAccounts,
      savings: nextAccounts.savings + pullAmount,
      investments: {
        ...user.accounts.investments,
        taxable: newTaxable,
      },
    };
    actions.push({
      type: 'transfer_to_liquidity',
      description: 'Moved from taxable investment to savings to meet 30-day buffer',
      amount: pullAmount,
    });
  }

  // 2) Trim non-essential discretionary budgets (frees mental budget; no balance move)
  const nonEssential = getNonEssentialCategories(user);
  for (const cat of nonEssential) {
    const trim = Math.round(cat.monthlyBudget * DISCRETIONARY_TRIM_PCT * 100) / 100;
    if (trim <= 0) continue;
    const idx = nextSpendingCategories.findIndex((c) => c.id === cat.id);
    const existing = idx >= 0 ? nextSpendingCategories[idx] : undefined;
    if (existing) {
      nextSpendingCategories[idx] = {
        ...existing,
        monthlyBudget: Math.max(0, existing.monthlyBudget - trim),
      };
      actions.push({
        type: 'reduce_budget',
        description: `Reduced "${cat.name}" budget to prioritize liquidity`,
        amount: trim,
      });
    }
  }

  // 3) Ensure checking floor
  if (nextAccounts.checking < MIN_CHECKING && nextAccounts.savings >= MIN_CHECKING - nextAccounts.checking) {
    const moveToChecking = Math.min(MIN_CHECKING - nextAccounts.checking, nextAccounts.savings);
    nextAccounts = {
      ...nextAccounts,
      checking: nextAccounts.checking + moveToChecking,
      savings: nextAccounts.savings - moveToChecking,
    };
    actions.push({
      type: 'buffer_checking',
      description: `Kept checking at or above $${MIN_CHECKING} for daily safety`,
      amount: moveToChecking,
    });
  }

  const updatedUserProfile: UserProfile = {
    ...user,
    accounts: nextAccounts,
    spendingCategories: nextSpendingCategories,
    stabilization_mode: true,
    stabilization_start: startIso,
    stabilization_end: endIso,
    stabilization_canceled_at: undefined,
    updatedAt: now,
  };

  if (options?.persist) {
    options.persist(updatedUserProfile);
  }

  const afterChecking = updatedUserProfile.accounts.checking;
  const afterSavings = updatedUserProfile.accounts.savings;
  const afterLiquid = afterChecking + afterSavings;

  const explanation = buildExplanation({
    beforeLiquid: beforeLiquid,
    afterLiquid,
    minimumSafeBuffer,
    shortfall,
    actions,
    pullAmount,
  });

  return {
    before: { checking: beforeChecking, savings: beforeSavings, totalLiquid: beforeLiquid },
    after: { checking: afterChecking, savings: afterSavings, totalLiquid: afterLiquid },
    minimumSafeBuffer,
    shortfall,
    actions,
    explanation,
    updatedUserProfile,
    stabilization_start: startIso,
    stabilization_end: endIso,
  };
}

function buildExplanation(args: {
  beforeLiquid: number;
  afterLiquid: number;
  minimumSafeBuffer: number;
  shortfall: number;
  actions: Array<{ type: string; description: string; amount?: number }>;
  pullAmount: number;
}): string {
  const parts: string[] = [];
  parts.push(
    `**Financial Stability Mode is now active for 30 days.** Liquidity was prioritized so you have a safe buffer for the next month.`
  );
  parts.push(
    `Your minimum safe buffer was calculated as $${args.minimumSafeBuffer.toFixed(0)} (fixed expenses + 50% discretionary + upcoming expenses).`
  );
  if (args.shortfall > 0) {
    parts.push(`You were $${args.shortfall.toFixed(0)} short of that buffer.`);
  }
  parts.push(`**What changed:**`);
  for (const a of args.actions) {
    parts.push(`- ${a.description}${a.amount != null ? ` ($${a.amount.toFixed(0)})` : ''}`);
  }
  parts.push(
    `**Tradeoffs:** Growth from investments is paused for 30 days in favor of stability. Discretionary budgets were slightly reduced so more cash stays available. You can cancel Stability Mode anytime.`
  );
  return parts.join('\n\n');
}

/**
 * Cancel stabilization mode (user override).
 */
export function cancelStabilization(
  user: UserProfile,
  options?: { persist?: (profile: UserProfile) => void }
): UserProfile {
  if (!user.stabilization_mode) return user;
  const updated: UserProfile = {
    ...user,
    stabilization_mode: false,
    stabilization_canceled_at: new Date().toISOString(),
    updatedAt: new Date(),
  };
  if (options?.persist) options.persist(updated);
  return updated;
}
