import type { UserProfile } from '../../types/financial.js';
export interface ActionResult {
    success: boolean;
    message: string;
    details?: string;
    updatedUser?: UserProfile;
    changes?: ActionChange[];
}
export interface ActionChange {
    field: string;
    oldValue: string | number;
    newValue: string | number;
}
export interface TransferRequest {
    fromAccount: string;
    toAccount: string;
    amount: number;
}
export interface CreateGoalRequest {
    name: string;
    targetAmount: number;
    deadlineMonths?: number;
    priority?: number;
}
export interface UpdateBudgetRequest {
    categoryName: string;
    newAmount?: number;
    action: 'increase' | 'decrease' | 'set';
    changeAmount?: number;
}
export declare class ActionExecutor {
    executeTransfer(user: UserProfile, request: TransferRequest): ActionResult;
    createGoal(user: UserProfile, request: CreateGoalRequest): ActionResult;
    updateBudget(user: UserProfile, request: UpdateBudgetRequest): ActionResult;
    executeSimulatedAction(user: UserProfile, actionType: 'save' | 'invest' | 'spend', amount: number, goalId?: string, targetAccount?: string): ActionResult;
    private getAccountBalance;
    private checkGuardrails;
    private applyTransfer;
    private applyInvestment;
}
export declare const actionExecutor: ActionExecutor;
//# sourceMappingURL=action-executor.d.ts.map