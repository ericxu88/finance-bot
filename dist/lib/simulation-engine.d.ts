import type { UserProfile, FinancialAction, SimulationResult, GoalImpact, Accounts, FinancialGoal, BudgetStatus } from '../types/financial.js';
export declare const DEFAULT_ANNUAL_RETURN = 0.07;
export declare const SAVINGS_RETURN = 0.04;
export declare const CHECKING_RETURN = 0;
export declare function cloneAccounts(accounts: Accounts): Accounts;
export declare function calculateBudgetStatus(percentUsed: number): BudgetStatus;
export declare function calculateLiquidityImpact(checkingBefore: number, checkingAfter: number, savingsBefore: number, savingsAfter: number): string;
export declare function calculateFutureValue(principal: number, monthlyContribution: number, annualReturnRate: number, years: number): number;
export declare function calculateTimeToGoal(goal: FinancialGoal, monthlyContribution: number, assumedReturn?: number): number;
export declare function calculateGoalImpact(goal: FinancialGoal, amountAdded: number, assumedAnnualReturn?: number): GoalImpact;
export declare function checkConstraintViolations(state: UserProfile, accountsAfter: Accounts): string[];
export declare function simulate_save(state: UserProfile, amount: number, goalId?: string): SimulationResult;
export declare function simulate_invest(state: UserProfile, amount: number, accountType: 'taxable' | 'rothIRA' | 'traditional401k', goalId?: string, timeHorizon?: number): SimulationResult;
export declare function simulate_spend(state: UserProfile, amount: number, category: string): SimulationResult;
export declare function compare_options(state: UserProfile, options: FinancialAction[]): SimulationResult[];
//# sourceMappingURL=simulation-engine.d.ts.map