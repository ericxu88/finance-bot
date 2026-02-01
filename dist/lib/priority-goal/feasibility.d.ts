import type { UserProfile } from '../../types/financial.js';
export interface GoalFeasibilityScore {
    goalId: string;
    goalName: string;
    score: number;
    components: {
        progressRatio: number;
        timePressure: number;
        contributionAffordability: number;
        spendingHeadroom: number;
        liquidityAlignment: number;
        riskAlignment: number;
    };
    requiredMonthlyContribution: number;
    monthsRemaining: number;
    bottleneck?: string;
}
export declare function rankGoalsByFeasibility(user: UserProfile): {
    rankings: GoalFeasibilityScore[];
    surplus: number;
    totalLiquid: number;
};
//# sourceMappingURL=feasibility.d.ts.map