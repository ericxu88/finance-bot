/**
 * Recommendation Engine
 * 
 * Analyzes user's financial state and goals to generate actionable recommendations
 */

import type { UserProfile, FinancialAction, FinancialGoal } from '../types/financial.js';
import { differenceInMonths } from 'date-fns';

export interface Recommendation {
  action: FinancialAction;
  priority: number; // 1-5, 1 = highest
  reasoning: string;
  timeHorizon?: number; // For invest actions, years to project
  goalImpact?: {
    goalId: string;
    goalName: string;
    monthsSaved: number;
    progressIncrease: number;
  };
  estimatedImpact: {
    liquidityImpact: string;
    riskImpact: string;
    timelineBenefit: string;
  };
}

/**
 * Calculate monthly surplus (income - fixed expenses - average spending)
 */
function calculateMonthlySurplus(user: UserProfile): number {
  const totalFixedExpenses = user.fixedExpenses.reduce((sum, exp) => {
    return sum + (exp.frequency === 'monthly' ? exp.amount : exp.amount / 12);
  }, 0);

  const totalBudgeted = user.spendingCategories.reduce(
    (sum, cat) => sum + cat.monthlyBudget,
    0
  );

  return user.monthlyIncome - totalFixedExpenses - totalBudgeted;
}


/**
 * Calculate how much is needed to reach a goal
 */
function calculateGoalGap(goal: FinancialGoal): number {
  return Math.max(0, goal.targetAmount - goal.currentAmount);
}

/**
 * Calculate months until deadline
 */
function monthsUntilDeadline(deadline: Date): number {
  const now = new Date();
  return Math.max(0, differenceInMonths(deadline, now));
}

/**
 * Generate candidate recommendations based on user's financial state
 */
export function generateRecommendations(user: UserProfile): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const monthlySurplus = calculateMonthlySurplus(user);
  const totalLiquid = user.accounts.checking + user.accounts.savings;

  // Rule 1: Emergency fund recommendation
  const emergencyGoal = user.goals.find(
    (g) => g.name.toLowerCase().includes('emergency') || g.timeHorizon === 'short'
  ) || null;
  if (emergencyGoal) {
    const gap = calculateGoalGap(emergencyGoal);
    if (gap > 0) {
      const recommendedAmount = Math.min(
        Math.max(500, gap * 0.1), // 10% of gap, min $500
        monthlySurplus * 0.5, // Max 50% of monthly surplus
        totalLiquid * 0.3 // Max 30% of liquid assets
      );
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

  // Rule 2: Long-term investment recommendations
  const longTermGoals = user.goals.filter(
    (g) => g.timeHorizon === 'long' && !g.name.toLowerCase().includes('emergency')
  );
  for (const goal of longTermGoals) {
    const gap = calculateGoalGap(goal);
    if (gap > 0 && monthlySurplus > 500) {
      const recommendedAmount = Math.min(
        Math.max(500, monthlySurplus * 0.3), // 30% of surplus
        gap * 0.05 // 5% of gap
      );
      if (recommendedAmount >= 100) {
        // Recommend based on risk tolerance
        const accountType =
          user.preferences.riskTolerance === 'conservative'
            ? 'taxable'
            : user.preferences.riskTolerance === 'moderate'
              ? 'rothIRA'
              : 'taxable';

        const timeHorizon = Math.max(5, Math.floor(monthsUntilDeadline(goal.deadline) / 12));
        recommendations.push({
          action: {
            type: 'invest',
            amount: Math.round(recommendedAmount),
            targetAccountId: accountType as 'taxable' | 'rothIRA' | 'traditional401k',
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

  // Rule 3: Medium-term goal savings
  const mediumTermGoals = user.goals.filter((g) => g.timeHorizon === 'medium');
  for (const goal of mediumTermGoals) {
    const gap = calculateGoalGap(goal);
    const monthsRemaining = monthsUntilDeadline(goal.deadline);
    if (gap > 0 && monthsRemaining > 0 && monthlySurplus > 300) {
      // Calculate monthly amount needed
      const monthlyNeeded = gap / monthsRemaining;
      const recommendedAmount = Math.min(
        Math.max(300, monthlyNeeded * 1.2), // 20% buffer
        monthlySurplus * 0.4 // Max 40% of surplus
      );
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
            monthsSaved: 0, // Not applicable for savings
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

  // Rule 4: If no specific goals, recommend general savings
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

  // Sort by priority (1 = highest) and return top 5
  return recommendations
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 5);
}

export interface GoalSummary {
  goalId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  progress: number; // 0-100
  deadline: Date;
  monthsRemaining: number;
  timeHorizon: 'short' | 'medium' | 'long';
  priority: number;
  status: 'on_track' | 'behind' | 'at_risk' | 'completed';
  monthlyNeeded: number; // Amount needed per month to hit deadline
  projectedCompletion: string; // "On time", "2 months late", etc.
  suggestedAction?: {
    action: FinancialAction;
    reasoning: string;
  };
}

/**
 * Generate detailed goal summary with progress and projections
 */
export function generateGoalSummary(user: UserProfile): GoalSummary[] {
  const monthlySurplus = calculateMonthlySurplus(user);
  
  return user.goals.map((goal): GoalSummary => {
    const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const monthsRemaining = monthsUntilDeadline(goal.deadline);
    
    // Calculate monthly amount needed to hit deadline
    const monthlyNeeded = monthsRemaining > 0 ? remainingAmount / monthsRemaining : remainingAmount;
    
    // Determine status based on whether user can afford monthly payment
    let status: 'on_track' | 'behind' | 'at_risk' | 'completed';
    let projectedCompletion: string;
    
    if (progress >= 100) {
      status = 'completed';
      projectedCompletion = 'Completed!';
    } else if (monthlyNeeded <= monthlySurplus) {
      status = 'on_track';
      projectedCompletion = 'On time';
    } else if (monthlyNeeded <= monthlySurplus * 1.5) {
      status = 'behind';
      const extraMonths = Math.ceil(remainingAmount / monthlySurplus) - monthsRemaining;
      projectedCompletion = extraMonths > 0 ? `${extraMonths} months late` : 'On time with effort';
    } else {
      status = 'at_risk';
      const monthsAtCurrentRate = monthlySurplus > 0 ? Math.ceil(remainingAmount / monthlySurplus) : Infinity;
      const delay = monthsAtCurrentRate - monthsRemaining;
      projectedCompletion = delay < Infinity ? `${delay} months late` : 'Significantly delayed';
    }
    
    // Generate suggested action
    let suggestedAction: GoalSummary['suggestedAction'] | undefined;
    if (status !== 'completed' && monthlySurplus > 0) {
      const recommendedAmount = Math.min(
        Math.max(100, monthlyNeeded * 0.8), // 80% of needed
        monthlySurplus * 0.5 // Max 50% of surplus
      );
      
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
      } else {
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
    // Sort by priority first, then by status (at_risk first)
    if (a.priority !== b.priority) return a.priority - b.priority;
    const statusOrder = { at_risk: 0, behind: 1, on_track: 2, completed: 3 };
    return statusOrder[a.status] - statusOrder[b.status];
  });
}

/**
 * Analyze user's financial health and generate summary
 */
export function analyzeFinancialHealth(user: UserProfile): {
  overallHealth: 'excellent' | 'good' | 'fair' | 'needs_attention';
  monthlySurplus: number;
  emergencyFundStatus: 'adequate' | 'low' | 'missing';
  goalProgress: Array<{
    goalId: string;
    goalName: string;
    progress: number;
    onTrack: boolean;
  }>;
  recommendations: Recommendation[];
} {
  const monthlySurplus = calculateMonthlySurplus(user);
  const totalLiquid = user.accounts.checking + user.accounts.savings;
  const monthlyExpenses =
    user.fixedExpenses.reduce((sum, exp) => {
      return sum + (exp.frequency === 'monthly' ? exp.amount : exp.amount / 12);
    }, 0) +
    user.spendingCategories.reduce((sum, cat) => sum + cat.monthlyBudget, 0);

  // Emergency fund status (3-6 months expenses is ideal)
  const monthsOfExpenses = totalLiquid / monthlyExpenses;
  let emergencyFundStatus: 'adequate' | 'low' | 'missing';
  if (monthsOfExpenses >= 3) {
    emergencyFundStatus = 'adequate';
  } else if (monthsOfExpenses >= 1) {
    emergencyFundStatus = 'low';
  } else {
    emergencyFundStatus = 'missing';
  }

  // Goal progress tracking
  const goalProgress = user.goals.map((goal) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const monthsRemaining = monthsUntilDeadline(goal.deadline);
    const gap = calculateGoalGap(goal);
    const monthlyNeeded = monthsRemaining > 0 ? gap / monthsRemaining : 0;
    const onTrack = monthlyNeeded <= monthlySurplus * 1.2; // 20% buffer

    return {
      goalId: goal.id,
      goalName: goal.name,
      progress: Math.round(progress * 10) / 10,
      onTrack,
    };
  });

  // Overall health assessment
  let overallHealth: 'excellent' | 'good' | 'fair' | 'needs_attention';
  if (monthlySurplus > 1000 && emergencyFundStatus === 'adequate' && goalProgress.every((g) => g.onTrack)) {
    overallHealth = 'excellent';
  } else if (monthlySurplus > 500 && emergencyFundStatus !== 'missing' && goalProgress.some((g) => g.onTrack)) {
    overallHealth = 'good';
  } else if (monthlySurplus > 0) {
    overallHealth = 'fair';
  } else {
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
