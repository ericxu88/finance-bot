import type { UserProfile, FinancialAction } from '../types/financial.js';
export declare const sampleUser: UserProfile;
export declare const sampleAction: FinancialAction;
export declare function calculateLiquidAssets(user: UserProfile): number;
export declare function calculateInvestedAssets(user: UserProfile): number;
export declare function calculateTotalAssets(user: UserProfile): number;
export declare function calculateMonthlyFixedExpenses(user: UserProfile): number;
export declare function calculateMonthlyDiscretionaryBudget(user: UserProfile): number;
export declare function calculateMonthlySurplus(user: UserProfile): number;
export declare function getGoalCompletionPct(goalId: string, user: UserProfile): number;
export declare function getMonthsUntilGoalDeadline(goalId: string, user: UserProfile): number;
export declare function checkGuardrails(user: UserProfile, action: FinancialAction): {
    passed: boolean;
    violations: string[];
};
//# sourceMappingURL=sample-data.d.ts.map