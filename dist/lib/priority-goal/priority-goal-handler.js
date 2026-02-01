import { rankGoalsByFeasibility } from './feasibility.js';
const EMERGENCY_LIQUIDITY_MIN = 1000;
const MIN_RECOMENDED_REALLOCATION = 50;
function checkGuardrails(user, proposedChecking, proposedSavings) {
    const violations = [];
    const guardrails = user.preferences?.guardrails ?? [];
    for (const g of guardrails) {
        if (g.type === 'min_balance' && g.accountId && g.threshold != null) {
            const balance = g.accountId === 'checking'
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
        violations.push(`Emergency liquidity: checking would be $${proposedChecking.toFixed(0)} (min $${EMERGENCY_LIQUIDITY_MIN})`);
    }
    return {
        passed: violations.length === 0,
        violations,
    };
}
function computeReallocations(user, priorityGoalId, surplus) {
    const reallocations = [];
    if (surplus <= 0)
        return reallocations;
    const priorityGoal = user.goals.find((g) => g.id === priorityGoalId);
    if (!priorityGoal)
        return reallocations;
    const gap = Math.max(0, priorityGoal.targetAmount - priorityGoal.currentAmount);
    const amountToPriority = Math.min(Math.max(MIN_RECOMENDED_REALLOCATION, Math.min(surplus * 0.5, gap * 0.1)), surplus);
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
function buildExplanation(priority, rankings, reallocations, violations) {
    const lines = [];
    lines.push(`**Why "${priority.goalName}" was chosen:** ${priority.goalName} has the highest feasibility score (${priority.score}) right now—closest to completion with a manageable required monthly contribution ($${priority.requiredMonthlyContribution.toFixed(0)}/mo) and ${priority.monthsRemaining} months left.`);
    const others = rankings.filter((r) => r.goalId !== priority.goalId);
    if (others.length > 0) {
        lines.push(`**Why others were deprioritized:** ${others
            .map((r) => `${r.goalName} (score ${r.score})${r.bottleneck ? `: ${r.bottleneck}` : ''}`)
            .join('. ')}`);
    }
    if (reallocations.length > 0) {
        lines.push(`**Capital reallocations:** ${reallocations
            .map((r) => `$${r.amount} from ${r.from} → ${r.to}`)
            .join('; ')}. These are recommendations; apply them in the app if you want.`);
    }
    if (violations.length > 0) {
        lines.push(`**Guardrails:** No automatic reallocations were applied because: ${violations.join('; ')}.`);
    }
    lines.push(`**What changed:** Your priority goal is now set to "${priority.goalName}". Future suggestions and chat will favor this goal until you change it.`);
    return lines.join('\n\n');
}
export function prioritizeMostRealisticGoal(user, options) {
    if (!user.goals?.length) {
        throw new Error('No goals to prioritize. Add at least one goal first.');
    }
    const { rankings, surplus } = rankGoalsByFeasibility(user);
    const top = rankings[0];
    if (!top)
        throw new Error('No goal scores computed.');
    const nearTies = rankings.filter((r) => Math.abs(r.score - top.score) < 0.05);
    const selected = nearTies.length > 1
        ? (nearTies.find((r) => user.priority_goal_id === r.goalId) ?? nearTies[0])
        : top;
    const reallocations = computeReallocations(user, selected.goalId, surplus);
    const totalRealloc = reallocations.reduce((s, r) => s + r.amount, 0);
    const guardrailResult = checkGuardrails(user, user.accounts.checking, user.accounts.savings);
    const liquidityOk = user.accounts.checking >= EMERGENCY_LIQUIDITY_MIN;
    const reallocOk = totalRealloc <= surplus && totalRealloc <= user.accounts.checking - EMERGENCY_LIQUIDITY_MIN;
    const capitalReallocations = guardrailResult.passed && liquidityOk && reallocOk ? reallocations : [];
    const updatedGoals = user.goals.map((g) => ({
        ...g,
        isPriority: g.id === selected.goalId,
    }));
    const updatedUserProfile = {
        ...user,
        goals: updatedGoals,
        priority_goal_id: selected.goalId,
        updatedAt: new Date(),
    };
    if (options?.persist) {
        options.persist(updatedUserProfile);
    }
    const explanation = buildExplanation(selected, rankings, capitalReallocations, guardrailResult.violations);
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
            goals: Object.fromEntries(updatedGoals.map((g) => [g.id, { priority: g.id === selected.goalId }])),
        },
        explanation,
        updatedUserProfile,
    };
}
//# sourceMappingURL=priority-goal-handler.js.map