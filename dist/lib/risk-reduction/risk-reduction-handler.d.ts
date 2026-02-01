import type { UserProfile } from '../../types/financial.js';
export interface RiskFactor {
    id: string;
    name: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    currentValue: number;
    targetValue?: number;
    unit?: string;
}
export interface RiskReductionAction {
    type: 'rebalance_investments' | 'increase_liquidity' | 'lock_category' | 'buffer_adjustment';
    description: string;
    details?: Record<string, unknown>;
}
export interface RiskScore {
    overall: number;
    breakdown: {
        investmentVolatility: number;
        emergencyBuffer: number;
        fixedCostExposure: number;
        cashFlowStability: number;
    };
}
export interface RiskReductionResult {
    riskScoreBefore: RiskScore;
    riskScoreAfter: RiskScore;
    riskFactorsIdentified: RiskFactor[];
    actionsExecuted: RiskReductionAction[];
    lifestyleLockedCategories: string[];
    lifestylePreserved: boolean;
    explanation: string;
    updatedUserProfile: UserProfile;
}
declare function calculateRiskScore(user: UserProfile): RiskScore;
declare function detectRiskFactors(user: UserProfile): RiskFactor[];
export declare function runRiskReduction(user: UserProfile, options?: {
    persist?: (profile: UserProfile) => void;
}): RiskReductionResult;
export { calculateRiskScore, detectRiskFactors };
//# sourceMappingURL=risk-reduction-handler.d.ts.map