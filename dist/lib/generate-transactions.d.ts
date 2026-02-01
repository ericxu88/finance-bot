import type { Transaction, SpendingCategory } from '../types/financial.js';
export declare function generateTransactions(count: number, categories: SpendingCategory[], startDate: Date, endDate: Date): Transaction[];
export declare function generateFixedExpenseTransactions(expenseName: string, amount: number, startDate: Date, endDate: Date, dayOfMonth?: number): Transaction[];
export declare function generateIncomeTransactions(monthlyIncome: number, startDate: Date, endDate: Date, dayOfMonth?: number): Transaction[];
export declare function generateGoalTransactions(goalName: string, contributions: number[], dates: Date[]): Transaction[];
//# sourceMappingURL=generate-transactions.d.ts.map