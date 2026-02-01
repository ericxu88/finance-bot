/**
 * Priority Goal Handler
 *
 * Implements "Prioritize my most realistic goal right now":
 * - Goal feasibility evaluation and ranking
 * - Priority goal selection and persistent state (priority_goal_id, goals[].isPriority)
 * - Capital reallocation suggestions (deterministic)
 * - Guardrails and validation
 * - Structured output and explainability
 */

import type { UserProfile, FinancialGoal, Guardrail } from '../../types/financial.js';
import { rankGoalsByFeasibility, type GoalFeasibilityScore } from './feasibility.js';

export interface CapitalReallocation {
  from: string;
  to: string;
  amount: number;
  reason?: string;
}

export interface PriorityGoalResult {
  priority_goal: {
    id: string;
    name: string;
    feasibility_score: number;
    reason: string;
  };
  goal_rankings: Array<{ id: string; name: string; score: number; bottleneck?: string }>;
  capital_reallocations: CapitalReallocation[];
  updated_user_state: {
    priority_goal_id: string;
    goals: Record<string, { priority: boolean }>;
  };
  explanation: string;
  updatedUserProfile: UserProfile;
}

const EMERGENCY_LIQUIDITY_MIN = 1000; // Do not suggest reallocating below this (checking)
const MIN_RECOMENDED_REALLOCATION = 50;

/**
 * Check guardrails: min balance, etc.
 */
function checkGuardrails(
  user: UserProfile,
  proposedChecking: number,
  proposedSavings: number
): { passed: boolean; violations: string[] } {
  const violations: string[] = [];
  const guardrails: Guardrail[] = user.preferences?.guardrails ?? [];
  for (const g of guardrails) {
    if (g.type === 'min_balance' && g.accountId && g.threshold != null) {
      const balance =
        g.accountId === 'checking'
          ? proposedChecking
          : g.accountId === 'savings'
            ? proposedSavings
            : null;
      if (balance != null && balance < g.threshold) {
        violations.push(`${g.rule} (would be $${balance.toFixed(0)})`);
      }
    }
  }
  if (proposedChecking < EMERGENCY_LIQUIDITY_MIN) {
    violations.push(
      `Emergency liquidity: checking would be $${proposedChecking.toFixed(0)} (min $${EMERGENCY_LIQUIDITY_MIN})`
    );
  }
  return {
    passed: violations.length === 0,
    violations,
  };
}

/**
 * Compute suggested capital reallocations: discretionary surplus toward priority goal,
 * optionally reduce contributions to deprioritized goals (we output suggestions only;
 * no actual account transfers unless executed elsewhere).
 */
function computeReallocations(
  user: UserProfile,
  priorityGoalId: string,
  surplus: number
): CapitalReallocation[] {
  const reallocations: CapitalReallocation[] = [];
  if (surplus <= 0) return reallocations;

  const priorityGoal = user.goals.find((g) => g.id === priorityGoalId);
  if (!priorityGoal) return reallocations;

  const gap = Math.max(0, priorityGoal.targetAmount - priorityGoal.currentAmount);
  const amountToPriority = Math.min(
    Math.max(MIN_RECOMENDED_REALLOCATION, Math.min(surplus * 0.5, gap * 0.1)),
    surplus
  );
  if (amountToPriority >= MIN_RECOMENDED_REALLOCATION) {
    reallocations.push({
      from: 'general_savings',
      to: priorityGoalId,
      amount: Math.round(amountToPriority * 100) / 100,
      reason: `Increase progress toward priority goal "${priorityGoal.name}"`,
    });
  }

  return reallocations;
}

/**
 * Build human-readable explanation.
 */
function buildExplanation(
  priority: GoalFeasibilityScore,
  rankings: GoalFeasibilityScore[],
  reallocations: CapitalReallocation[],
  violations: string[]
): string {
  const lines: string[] = [];
  lines.push(
    `**Why "${priority.goalName}" was chosen:** ${priority.goalName} has the highest feasibility score (${priority.score}) right now—closest to completion with a manageable required monthly contribution ($${priority.requiredMonthlyContribution.toFixed(0)}/mo) and ${priority.monthsRemaining} months left.`
  );
  const others = rankings.filter((r) => r.goalId !== priority.goalId);
  if (others.length > 0) {
    lines.push(
      `**Why others were deprioritized:** ${others
        .map(
          (r) =>
            `${r.goalName} (score ${r.score})${r.bottleneck ? `: ${r.bottleneck}` : ''}`
        )
        .join('. ')}`
    );
  }
  if (reallocations.length > 0) {
    lines.push(
      `**Capital reallocations:** ${reallocations
        .map((r) => `$${r.amount} from ${r.from} → ${r.to}`)
        .join('; ')}. These are recommendations; apply them in the app if you want.`
    );
  }
  if (violations.length > 0) {
    lines.push(
      `**Guardrails:** No automatic reallocations were applied because: ${violations.join('; ')}.`
    );
  }
  lines.push(
    `**What changed:** Your priority goal is now set to "${priority.goalName}". Future suggestions and chat will favor this goal until you change it.`
  );
  return lines.join('\n\n');
}

/**
 * Run the full "prioritize my most realistic goal" flow and persist state.
 */
export function prioritizeMostRealisticGoal(
  user: UserProfile,
  options?: { userId?: string; persist?: (profile: UserProfile) => void }
): PriorityGoalResult {
  if (!user.goals?.length) {
    throw new Error('No goals to prioritize. Add at least one goal first.');
  }

  const { rankings, surplus } = rankGoalsByFeasibility(user);

  const top = rankings[0];
  if (!top) throw new Error('No goal scores computed.');

  // If multiple goals are similarly feasible (within 0.05), act conservatively: prefer the one already priority or first by id
  const nearTies = rankings.filter((r) => Math.abs(r.score - top.score) < 0.05);
  const selected: GoalFeasibilityScore =
    nearTies.length > 1
      ? (nearTies.find((r) => user.priority_goal_id === r.goalId) ?? nearTies[0])!
      : top;

  const reallocations = computeReallocations(
    user,
    selected.goalId,
    surplus
  );

  const totalRealloc = reallocations.reduce((s, r) => s + r.amount, 0);
  const guardrailResult = checkGuardrails(
    user,
    user.accounts.checking,
    user.accounts.savings
  );
  const liquidityOk = user.accounts.checking >= EMERGENCY_LIQUIDITY_MIN;
  const reallocOk = totalRealloc <= surplus && totalRealloc <= user.accounts.checking - EMERGENCY_LIQUIDITY_MIN;
  const capitalReallocations =
    guardrailResult.passed && liquidityOk && reallocOk ? reallocations : [];

  const updatedGoals: FinancialGoal[] = user.goals.map((g) => ({
    ...g,
    isPriority: g.id === selected.goalId,
  }));

  const updatedUserProfile: UserProfile = {
    ...user,
    goals: updatedGoals,
    priority_goal_id: selected.goalId,
    updatedAt: new Date(),
  };

  if (options?.persist) {
    options.persist(updatedUserProfile);
  }

  const explanation = buildExplanation(
    selected,
    rankings,
    capitalReallocations,
    guardrailResult.violations
  );

  return {
    priority_goal: {
      id: selected.goalId,
      name: selected.goalName,
      feasibility_score: selected.score,
      reason: selected.bottleneck
        ? `Highest feasibility (${selected.score}). ${selected.bottleneck}`
        : `Closest to completion with manageable monthly contribution ($${selected.requiredMonthlyContribution.toFixed(0)}/mo)`,
    },
    goal_rankings: rankings.map((r) => ({
      id: r.goalId,
      name: r.goalName,
      score: r.score,
      bottleneck: r.bottleneck,
    })),
    capital_reallocations: capitalReallocations,
    updated_user_state: {
      priority_goal_id: selected.goalId,
      goals: Object.fromEntries(
        updatedGoals.map((g) => [g.id, { priority: g.id === selected.goalId }])
      ),
    },
    explanation,
    updatedUserProfile,
  };
}
