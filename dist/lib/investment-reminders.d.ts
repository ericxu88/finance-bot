import type { UserProfile } from '../types/financial.js';
export interface InvestmentReminder {
    shouldRemind: boolean;
    urgency: 'low' | 'medium' | 'high';
    recommendedAmount: number;
    message: string;
    reasoning: string;
    suggestedAccount: 'taxable' | 'rothIRA' | 'traditional401k';
    impactIfInvested: {
        affectedGoals: Array<{
            goalId: string;
            goalName: string;
            progressIncrease: number;
            monthsCloser: number;
        }>;
        projectedValue5yr: number;
    };
    opportunityCostNote?: string;
    nextReminderDate?: Date;
}
export interface BudgetAnalysis {
    overallStatus: 'healthy' | 'good' | 'needs_attention';
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
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    daysLeftInMonth: number;
    projectedMonthlySpend: number;
}
export declare function getTotalInvestments(user: UserProfile): number;
export declare function generateInvestmentReminder(user: UserProfile): InvestmentReminder | null;
export declare function analyzeBudget(user: UserProfile): BudgetAnalysis;
export declare function getBudgetSummaryMessage(analysis: BudgetAnalysis): string;
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
export declare function detectUnderspending(user: UserProfile): UnderspendingAnalysis;
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
export declare function analyzeUpcomingExpenses(user: UserProfile): UpcomingExpensesAnalysis;
//# sourceMappingURL=investment-reminders.d.ts.map