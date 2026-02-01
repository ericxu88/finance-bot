/**
 * Investment Reminders System
 * 
 * Non-intrusive reminders for users who don't have auto-invest enabled.
 * Provides gentle suggestions based on user preferences and financial state.
 */

import { differenceInDays, addDays } from 'date-fns';
import type { UserProfile } from '../types/financial.js';
import { getInvestmentBalance } from '../types/financial.js';

// ============================================================================
// TYPES
// ============================================================================

export interface InvestmentReminder {
  /** Whether a reminder should be shown */
  shouldRemind: boolean;
  
  /** Urgency level - only show 'high' prominently */
  urgency: 'low' | 'medium' | 'high';
  
  /** Recommended investment amount */
  recommendedAmount: number;
  
  /** Human-readable message (not pushy) */
  message: string;
  
  /** Reasoning for the recommendation */
  reasoning: string;
  
  /** Which account to invest in */
  suggestedAccount: 'taxable' | 'rothIRA' | 'traditional401k';
  
  /** Impact if invested now */
  impactIfInvested: {
    /** Goals that would benefit */
    affectedGoals: Array<{
      goalId: string;
      goalName: string;
      progressIncrease: number; // percentage points
      monthsCloser: number;
    }>;
    /** Projected value in 5 years */
    projectedValue5yr: number;
  };
  
  /** What happens if user delays (not fear-based, just informational) */
  opportunityCostNote?: string;
  
  /** Next reminder date (so user knows when to expect it) */
  nextReminderDate?: Date;
}

export interface BudgetAnalysis {
  /** Overall budget health */
  overallStatus: 'healthy' | 'good' | 'needs_attention';
  
  /** Categories with detailed status */
  categories: Array<{
    id: string;
    name: string;
    monthlyBudget: number;
    currentSpent: number;
    percentUsed: number;
    status: 'under' | 'good' | 'warning' | 'over';
    subcategories?: Array<{
      id: string;
      name: string;
      monthlyBudget: number;
      currentSpent: number;
      percentUsed: number;
      status: 'under' | 'good' | 'warning' | 'over';
    }>;
  }>;
  
  /** Total monthly budget */
  totalBudget: number;
  
  /** Total spent this period */
  totalSpent: number;
  
  /** Amount remaining in budget */
  remaining: number;
  
  /** Days left in the month */
  daysLeftInMonth: number;
  
  /** Projected end-of-month spend based on current pace */
  projectedMonthlySpend: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateMonthlySurplus(user: UserProfile): number {
  const totalFixedExpenses = user.fixedExpenses.reduce((sum, exp) => 
    sum + (exp.frequency === 'monthly' ? exp.amount : exp.amount / 12), 0);
  const totalBudgeted = user.spendingCategories.reduce((sum, cat) => sum + cat.monthlyBudget, 0);
  return user.monthlyIncome - totalFixedExpenses - totalBudgeted;
}

// Helper to get total investments (exported for potential use elsewhere)
export function getTotalInvestments(user: UserProfile): number {
  return (
    getInvestmentBalance(user.accounts.investments.taxable) +
    getInvestmentBalance(user.accounts.investments.rothIRA) +
    getInvestmentBalance(user.accounts.investments.traditional401k)
  );
}

function calculateFutureValue(principal: number, rate: number, years: number): number {
  return principal * Math.pow(1 + rate, years);
}

function getBudgetStatus(percentUsed: number): 'under' | 'good' | 'warning' | 'over' {
  if (percentUsed < 50) return 'under';
  if (percentUsed <= 80) return 'good';
  if (percentUsed <= 100) return 'warning';
  return 'over';
}

// ============================================================================
// INVESTMENT REMINDER GENERATION
// ============================================================================

/**
 * Generate a non-intrusive investment reminder based on user preferences.
 * Returns null if no reminder is needed or user has auto-invest enabled.
 */
export function generateInvestmentReminder(user: UserProfile): InvestmentReminder | null {
  const prefs = user.preferences.investmentPreferences;
  
  // No reminder if auto-invest is enabled or reminders are disabled
  if (!prefs || prefs.autoInvestEnabled || prefs.reminderFrequency === 'none') {
    return null;
  }
  
  const now = new Date();
  const lastInvestment = prefs.lastInvestmentDate ? new Date(prefs.lastInvestmentDate) : null;
  
  // Check if it's time for a reminder based on frequency
  let shouldRemind = false;
  let urgency: 'low' | 'medium' | 'high' = 'low';
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
  
  // If user has never invested, gently remind (but not aggressively)
  if (!lastInvestment) {
    shouldRemind = true;
    urgency = 'low'; // Keep it gentle for first-time investors
  }
  
  // Don't remind if user can't afford to invest
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
  
  // Calculate recommended amount (conservative - don't suggest more than 50% of surplus)
  const targetAmount = prefs.targetMonthlyInvestment || surplus * 0.3;
  const recommendedAmount = Math.min(
    targetAmount,
    surplus * 0.5, // Never suggest more than half the surplus
    user.accounts.checking - 1500 // Leave at least $1,500 buffer in checking
  );
  
  if (recommendedAmount < 50) {
    return null; // Don't bother with tiny amounts
  }
  
  // Find goals that would benefit
  const longTermGoals = user.goals.filter(g => g.timeHorizon === 'long' || g.timeHorizon === 'medium');
  const affectedGoals = longTermGoals.map(goal => {
    const progressIncrease = (recommendedAmount / goal.targetAmount) * 100;
    const monthlyNeeded = (goal.targetAmount - goal.currentAmount) / 12; // Simplified
    const monthsCloser = monthlyNeeded > 0 ? Math.round(recommendedAmount / monthlyNeeded) : 0;
    
    return {
      goalId: goal.id,
      goalName: goal.name,
      progressIncrease: Math.round(progressIncrease * 10) / 10,
      monthsCloser: Math.max(0, monthsCloser),
    };
  }).filter(g => g.progressIncrease > 0.1); // Only show meaningful impacts
  
  // Calculate projected value
  const projectedValue5yr = Math.round(calculateFutureValue(recommendedAmount, 0.07, 5));
  
  // Generate friendly, non-pushy message
  let message: string;
  if (!lastInvestment) {
    message = `When you're ready, investing $${recommendedAmount.toLocaleString()} could be a good start for your goals.`;
  } else if (urgency === 'medium') {
    message = `It's been a while since your last investment. When convenient, $${recommendedAmount.toLocaleString()} could help with your goals.`;
  } else {
    message = `Friendly reminder: $${recommendedAmount.toLocaleString()} is available to invest if you'd like.`;
  }
  
  // Generate reasoning
  const topGoal = affectedGoals[0];
  const reasoning = topGoal
    ? `Based on your ${prefs.reminderFrequency} reminder preference. This could move your "${topGoal.goalName}" goal ${topGoal.progressIncrease.toFixed(1)}% closer.`
    : `Based on your ${prefs.reminderFrequency} reminder preference and available surplus.`;
  
  // Calculate next reminder date
  const reminderDays = {
    weekly: 7,
    biweekly: 14,
    monthly: 30,
    quarterly: 90,
    none: 365,
  };
  const nextReminderDate = addDays(now, reminderDays[prefs.reminderFrequency]);
  
  // Optional opportunity cost note (kept informational, not fear-based)
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

// ============================================================================
// BUDGET ANALYSIS
// ============================================================================

/**
 * Analyze user's budget with subcategory breakdown
 */
export function analyzeBudget(user: UserProfile): BudgetAnalysis {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeftInMonth = daysInMonth - dayOfMonth;
  
  let totalBudget = 0;
  let totalSpent = 0;
  
  const categories = user.spendingCategories.map(cat => {
    totalBudget += cat.monthlyBudget;
    totalSpent += cat.currentSpent;
    
    // Handle $0 budget safely (avoid division by zero)
    const percentUsed = cat.monthlyBudget > 0 
      ? (cat.currentSpent / cat.monthlyBudget) * 100 
      : (cat.currentSpent > 0 ? 100 : 0); // If $0 budget but spent, treat as 100% over; if $0 spent, treat as 0%
    
    // Process subcategories if they exist
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
  
  // Project end-of-month spend based on current pace
  const dailySpendRate = totalSpent / dayOfMonth;
  const projectedMonthlySpend = Math.round(dailySpendRate * daysInMonth);
  
  // Determine overall status
  const overBudgetCount = categories.filter(c => c.status === 'over').length;
  const warningCount = categories.filter(c => c.status === 'warning').length;
  
  let overallStatus: 'healthy' | 'good' | 'needs_attention';
  if (overBudgetCount > 0 || projectedMonthlySpend > totalBudget * 1.1) {
    overallStatus = 'needs_attention';
  } else if (warningCount > 0 || projectedMonthlySpend > totalBudget * 0.95) {
    overallStatus = 'good';
  } else {
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

/**
 * Get a friendly summary message for budget status
 */
export function getBudgetSummaryMessage(analysis: BudgetAnalysis): string {
  const { overallStatus, remaining, daysLeftInMonth, categories } = analysis;
  
  const overCategories = categories.filter(c => c.status === 'over');
  const warningCategories = categories.filter(c => c.status === 'warning');
  
  if (overallStatus === 'healthy') {
    return `You're doing great! $${remaining.toLocaleString()} remaining in your budget with ${daysLeftInMonth} days left this month.`;
  } else if (overallStatus === 'good') {
    if (warningCategories.length > 0) {
      return `Budget looks okay. ${warningCategories.map(c => c.name).join(', ')} ${warningCategories.length === 1 ? 'is' : 'are'} getting close to the limit.`;
    }
    return `$${remaining.toLocaleString()} remaining with ${daysLeftInMonth} days left. Pace yourself to stay on track.`;
  } else {
    if (overCategories.length > 0) {
      return `Heads up: ${overCategories.map(c => c.name).join(', ')} ${overCategories.length === 1 ? 'has' : 'have'} exceeded the budget.`;
    }
    return `Budget needs attention. Consider reducing spending in the remaining ${daysLeftInMonth} days.`;
  }
}

// ============================================================================
// UNDERSPENDING DETECTION
// ============================================================================

export interface UnderspendingSuggestion {
  type: 'invest' | 'save' | 'reallocate';
  description: string;
  amount: number;
  reasoning: string;
  goalId?: string;
}

export interface UnderspendingCategory {
  categoryId: string;
  categoryName: string;
  monthlyBudget: number;
  currentSpent: number;
  percentUsed: number;
  surplusAmount: number;
  suggestions: UnderspendingSuggestion[];
}

export interface UnderspendingAnalysis {
  hasUnderspending: boolean;
  totalSurplus: number;
  categories: UnderspendingCategory[];
  summary: string;
  topRecommendation: UnderspendingSuggestion | null;
}

/**
 * Detect underspending in budget categories and generate actionable suggestions.
 * Only flags categories where spending is significantly below budget with enough 
 * time left in the month to be meaningful.
 */
export function detectUnderspending(user: UserProfile): UnderspendingAnalysis {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeftInMonth = daysInMonth - dayOfMonth;
  
  // Only analyze if we're at least 10 days into the month and have 5+ days left
  // to give meaningful underspending analysis
  if (dayOfMonth < 10 || daysLeftInMonth < 5) {
    return {
      hasUnderspending: false,
      totalSurplus: 0,
      categories: [],
      summary: 'Not enough data to analyze underspending patterns yet.',
      topRecommendation: null,
    };
  }
  
  // Calculate expected spending pace
  const expectedPercentUsed = (dayOfMonth / daysInMonth) * 100;
  
  const underspendingCategories: UnderspendingCategory[] = [];
  let totalSurplus = 0;
  
  for (const cat of user.spendingCategories) {
    if (cat.monthlyBudget <= 0) continue;
    
    const percentUsed = (cat.currentSpent / cat.monthlyBudget) * 100;
    
    // Flag as underspending if:
    // - Less than 50% of budget used AND
    // - Significantly behind expected pace (at least 20% behind)
    const isBehindPace = percentUsed < expectedPercentUsed - 20;
    const isSignificantlyUnder = percentUsed < 50;
    
    if (isSignificantlyUnder && isBehindPace) {
      // Calculate surplus - the amount that could be redirected
      const expectedSpent = (cat.monthlyBudget * expectedPercentUsed) / 100;
      const surplusAmount = Math.round((expectedSpent - cat.currentSpent) * 100) / 100;
      
      if (surplusAmount < 20) continue; // Skip tiny surpluses
      
      totalSurplus += surplusAmount;
      
      // Generate suggestions for this surplus
      const suggestions: UnderspendingSuggestion[] = [];
      
      // Suggestion 1: Invest the difference
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
      
      // Suggestion 2: Save toward emergency fund
      const emergencyGoal = user.goals.find(g => 
        g.name.toLowerCase().includes('emergency') || g.name.toLowerCase().includes('safety')
      );
      if (emergencyGoal && emergencyGoal.currentAmount < emergencyGoal.targetAmount) {
        suggestions.push({
          type: 'save',
          description: `Add $${surplusAmount.toLocaleString()} to your emergency fund`,
          amount: surplusAmount,
          reasoning: `Your emergency fund is at ${((emergencyGoal.currentAmount / emergencyGoal.targetAmount) * 100).toFixed(0)}% of your goal.`,
          goalId: emergencyGoal.id,
        });
      }
      
      // Suggestion 3: Reallocate to another category
      const overCategories = user.spendingCategories.filter(c => 
        c.id !== cat.id && c.monthlyBudget > 0 && (c.currentSpent / c.monthlyBudget) > 0.8
      );
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
  
  // Build summary and top recommendation
  let summary: string;
  let topRecommendation: UnderspendingSuggestion | null = null;
  
  if (underspendingCategories.length === 0) {
    summary = 'Your spending is on track with your budget allocations.';
  } else if (underspendingCategories.length === 1 && underspendingCategories[0]) {
    const cat = underspendingCategories[0];
    summary = `You're spending less than planned in "${cat.categoryName}" — $${cat.surplusAmount.toLocaleString()} could be put to work elsewhere.`;
    topRecommendation = cat.suggestions[0] ?? null;
  } else {
    summary = `You have $${totalSurplus.toLocaleString()} in unspent budget across ${underspendingCategories.length} categories that could be invested or saved.`;
    // Find the best overall recommendation (prefer investing)
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

// ============================================================================
// UPCOMING EXPENSES ANALYSIS
// ============================================================================

export interface UpcomingExpenseItem {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  daysUntilDue: number;
  isRecurring: boolean;
  urgency: 'immediate' | 'soon' | 'upcoming';
  categoryName?: string;
  notes?: string;
}

export interface UpcomingExpensesAnalysis {
  hasUpcoming: boolean;
  totalDueNext30Days: number;
  totalDueNext7Days: number;
  expenses: UpcomingExpenseItem[];
  immediateAttentionCount: number;
  summary: string;
  canAfford: boolean;
  shortfall: number;
}

/**
 * Analyze upcoming expenses for the next 30 days and provide actionable insights.
 */
export function analyzeUpcomingExpenses(user: UserProfile): UpcomingExpensesAnalysis {
  const now = new Date();
  const upcoming = user.upcomingExpenses || [];
  
  // Filter to next 30 days and pending/overdue
  const relevantExpenses = upcoming
    .filter(exp => {
      if (exp.status === 'paid') return false;
      const dueDate = new Date(exp.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 30;
    })
    .map(exp => {
      const dueDate = new Date(exp.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Determine urgency
      let urgency: 'immediate' | 'soon' | 'upcoming';
      if (daysUntilDue <= 3 || exp.status === 'overdue') {
        urgency = 'immediate';
      } else if (daysUntilDue <= 7) {
        urgency = 'soon';
      } else {
        urgency = 'upcoming';
      }
      
      // Find category name if linked
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
  
  // Calculate totals
  const totalDueNext30Days = relevantExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalDueNext7Days = relevantExpenses
    .filter(exp => exp.daysUntilDue <= 7)
    .reduce((sum, exp) => sum + exp.amount, 0);
  
  const immediateAttentionCount = relevantExpenses.filter(exp => exp.urgency === 'immediate').length;
  
  // Check if user can afford upcoming expenses
  const availableFunds = user.accounts.checking;
  const canAfford = availableFunds >= totalDueNext30Days;
  const shortfall = canAfford ? 0 : totalDueNext30Days - availableFunds;
  
  // Generate summary
  let summary: string;
  if (relevantExpenses.length === 0) {
    summary = 'No upcoming expenses in the next 30 days. Your budget looks clear!';
  } else if (immediateAttentionCount > 0) {
    summary = `${immediateAttentionCount} expense${immediateAttentionCount > 1 ? 's' : ''} need${immediateAttentionCount === 1 ? 's' : ''} immediate attention. $${totalDueNext7Days.toLocaleString()} due in the next 7 days.`;
  } else {
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
