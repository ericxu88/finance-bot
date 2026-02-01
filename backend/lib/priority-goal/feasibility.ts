/**
 * Goal Feasibility Evaluation
 *
 * Deterministic scoring for ranking goals by how realistic they are to achieve
 * given: progress vs target, time horizon, required monthly contribution,
 * recent spending behavior, liquidity constraints, and risk profile alignment.
 */

import { differenceInMonths } from 'date-fns';
import type { UserProfile, FinancialGoal } from '../../types/financial.js';

export interface GoalFeasibilityScore {
  goalId: string;
  goalName: string;
  score: number;
  /** 0–1 components for explainability */
  components: {
    progressRatio: number;
    timePressure: number;
    contributionAffordability: number;
    spendingHeadroom: number;
    liquidityAlignment: number;
    riskAlignment: number;
  };
  requiredMonthlyContribution: number;
  monthsRemaining: number;
  bottleneck?: string;
}

/** Minimum months to avoid division-by-zero; cap time pressure */
const MIN_MONTHS = 1;
const MAX_MONTHS_FOR_PRESSURE = 120;

/**
 * Compute monthly surplus (income - fixed expenses - total budgeted discretionary).
 */
function monthlySurplus(user: UserProfile): number {
  const fixed = user.fixedExpenses.reduce(
    (sum, e) => sum + (e.frequency === 'monthly' ? e.amount : e.amount / 12),
    0
  );
  const budgeted = user.spendingCategories.reduce(
    (sum, c) => sum + (c.monthlyBudget || 0),
    0
  );
  return Math.max(0, user.monthlyIncome - fixed - budgeted);
}

/**
 * Total liquid assets (checking + savings).
 */
function totalLiquid(user: UserProfile): number {
  return user.accounts.checking + user.accounts.savings;
}

/**
 * Recent spending as fraction of budget (0 = under, 1 = at budget, >1 = over).
 * Higher headroom = more feasible to save.
 */
function spendingUtilization(user: UserProfile): number {
  let totalBudget = 0;
  let totalSpent = 0;
  for (const cat of user.spendingCategories) {
    if (cat.monthlyBudget > 0 && cat.name?.toLowerCase() !== 'income') {
      totalBudget += cat.monthlyBudget;
      totalSpent += cat.currentSpent ?? 0;
    }
  }
  if (totalBudget <= 0) return 0;
  return Math.min(1.5, totalSpent / totalBudget);
}

/**
 * Score a single goal (0–1, higher = more feasible).
 */
function scoreGoal(goal: FinancialGoal, user: UserProfile): GoalFeasibilityScore {
  const now = new Date();
  const gap = Math.max(0, goal.targetAmount - goal.currentAmount);
  const monthsRemaining = Math.max(
    MIN_MONTHS,
    differenceInMonths(goal.deadline, now)
  );
  const requiredMonthly =
    gap <= 0 ? 0 : gap / Math.min(monthsRemaining, MAX_MONTHS_FOR_PRESSURE);
  const surplus = monthlySurplus(user);
  const liquid = totalLiquid(user);
  const spendingUtil = spendingUtilization(user);

  // Progress: higher ratio = more feasible (0–1)
  const progressRatio =
    goal.targetAmount > 0
      ? Math.min(1, goal.currentAmount / goal.targetAmount)
      : 1;

  // Time pressure: more time = higher score (0–1)
  const timePressure =
    monthsRemaining >= 24 ? 1 : monthsRemaining >= 12 ? 0.8 : monthsRemaining >= 6 ? 0.6 : 0.4;

  // Contribution affordability: required vs surplus (0–1, 1 = easily affordable)
  const contributionAffordability =
    surplus <= 0 ? 0 : Math.min(1, surplus / (requiredMonthly || 1));

  // Spending headroom: under budget = more room to save (0–1)
  const spendingHeadroom = Math.max(0, 1 - spendingUtil);

  // Liquidity: don't require more than a fraction of liquid assets per month (0–1)
  const maxSensibleMonthlyFromLiquid = liquid * 0.1;
  const liquidityAlignment =
    requiredMonthly <= 0
      ? 1
      : Math.min(1, maxSensibleMonthlyFromLiquid / requiredMonthly);

  // Risk alignment: short-term goals + conservative = better; long-term + aggressive = better
  const risk = user.preferences?.riskTolerance ?? 'moderate';
  const liquidityPref = user.preferences?.liquidityPreference ?? 'medium';
  let riskAlignment = 0.7;
  if (goal.timeHorizon === 'short') {
    riskAlignment = risk === 'conservative' ? 1 : risk === 'moderate' ? 0.85 : 0.7;
    if (liquidityPref === 'high') riskAlignment = Math.min(1, riskAlignment + 0.1);
  } else if (goal.timeHorizon === 'long') {
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
  const score =
    progressRatio * weights.progressRatio +
    timePressure * weights.timePressure +
    contributionAffordability * weights.contributionAffordability +
    spendingHeadroom * weights.spendingHeadroom +
    liquidityAlignment * weights.liquidityAlignment +
    riskAlignment * weights.riskAlignment;

  let bottleneck: string | undefined;
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

/**
 * Rank all goals by feasibility (highest first).
 * Returns scores and rankings for explainability.
 */
export function rankGoalsByFeasibility(
  user: UserProfile
): { rankings: GoalFeasibilityScore[]; surplus: number; totalLiquid: number } {
  const surplus = monthlySurplus(user);
  const totalLiquidVal = totalLiquid(user);
  const rankings = user.goals
    .map((g) => scoreGoal(g, user))
    .sort((a, b) => b.score - a.score);
  return { rankings, surplus: Math.round(surplus * 100) / 100, totalLiquid: totalLiquidVal };
}
