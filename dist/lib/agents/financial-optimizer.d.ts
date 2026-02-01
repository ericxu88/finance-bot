import type { UserProfile } from '../../types/financial.js';
export interface OptimizationAction {
    type: 'transfer' | 'update_budget' | 'allocate_savings' | 'allocate_investment';
    description: string;
    details: {
        fromAccount?: string;
        toAccount?: string;
        amount?: number;
        category?: string;
        oldValue?: number;
        newValue?: number;
        goalId?: string;
    };
    reasoning: string;
    expectedImpact: string;
    confidence: 'high' | 'medium' | 'low';
}
export interface OptimizationResult {
    actions: OptimizationAction[];
    summary: string;
    totalPotentialSavings: number;
    totalReallocated: number;
    warnings: string[];
}
export declare class FinancialOptimizerAgent {
    optimize(userProfile: UserProfile): Promise<OptimizationResult>;
    private analyzeIdleCash;
    private analyzeUnderutilizedBudgets;
    private analyzeEmergencyFund;
    private analyzeInvestmentOpportunities;
    private calculateMonthlySurplus;
    private projectInvestmentGrowth;
    private generateSummary;
}
//# sourceMappingURL=financial-optimizer.d.ts.map