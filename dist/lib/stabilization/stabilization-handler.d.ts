import type { UserProfile } from '../../types/financial.js';
export interface StabilizationResult {
    before: {
        checking: number;
        savings: number;
        totalLiquid: number;
    };
    after: {
        checking: number;
        savings: number;
        totalLiquid: number;
    };
    minimumSafeBuffer: number;
    shortfall: number;
    actions: Array<{
        type: string;
        description: string;
        amount?: number;
    }>;
    explanation: string;
    updatedUserProfile: UserProfile;
    stabilization_start: string;
    stabilization_end: string;
}
export declare function computeMinimumSafeBuffer(user: UserProfile): number;
export declare function runStabilization(user: UserProfile, options?: {
    userId?: string;
    persist?: (profile: UserProfile) => void;
}): StabilizationResult;
export declare function cancelStabilization(user: UserProfile, options?: {
    persist?: (profile: UserProfile) => void;
}): UserProfile;
//# sourceMappingURL=stabilization-handler.d.ts.map