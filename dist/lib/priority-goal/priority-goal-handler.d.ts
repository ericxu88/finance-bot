import type { UserProfile } from '../../types/financial.js';
export interface CapitalReallocation {
    from: string;
    to: string;
    amount: number;
    reason?: string;
}
export interface PriorityGoalResult {
    priority_goal: {
        id: string;
        name: string;
        feasibility_score: number;
        reason: string;
    };
    goal_rankings: Array<{
        id: string;
        name: string;
        score: number;
        bottleneck?: string;
    }>;
    capital_reallocations: CapitalReallocation[];
    updated_user_state: {
        priority_goal_id: string;
        goals: Record<string, {
            priority: boolean;
        }>;
    };
    explanation: string;
    updatedUserProfile: UserProfile;
}
export declare function prioritizeMostRealisticGoal(user: UserProfile, options?: {
    userId?: string;
    persist?: (profile: UserProfile) => void;
}): PriorityGoalResult;
//# sourceMappingURL=priority-goal-handler.d.ts.map