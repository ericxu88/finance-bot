import type { UserProfile } from '../../types/financial.js';
export type SavingsActionType = 'transfer' | 'invest_rebalance' | 'buffer_increase';
export interface SavingsAction {
    type: SavingsActionType;
    from: string;
    to: string;
    amount: number;
    reason: string;
}
export interface UpdatedBalancesProjection {
    checking: number;
    savings: number;
    investments: number;
}
export interface IncreaseSavingsWithoutLifestyleResult {
    protected_categories: string[];
    actions: SavingsAction[];
    updated_balances_projection: UpdatedBalancesProjection;
    explanation: string;
    updatedUserProfile?: UserProfile;
}
//# sourceMappingURL=types.d.ts.map