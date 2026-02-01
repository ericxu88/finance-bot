import type { UserProfile, FinancialAction } from '../types/financial.js';
export interface Recommendation {
    action: FinancialAction;
    priority: number;
    reasoning: string;
    timeHorizon?: number;
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
export declare function generateRecommendations(user: UserProfile): Recommendation[];
export interface GoalSummary {
    goalId: string;
    goalName: string;
    targetAmount: number;
    currentAmount: number;
    remainingAmount: number;
    progress: number;
    deadline: Date;
    monthsRemaining: number;
    timeHorizon: 'short' | 'medium' | 'long';
    priority: number;
    status: 'on_track' | 'behind' | 'at_risk' | 'completed';
    monthlyNeeded: number;
    projectedCompletion: string;
    suggestedAction?: {
        action: FinancialAction;
        reasoning: string;
    };
}
export declare function generateGoalSummary(user: UserProfile): GoalSummary[];
export declare function analyzeFinancialHealth(user: UserProfile): {
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
};
//# sourceMappingURL=recommendation-engine.d.ts.map