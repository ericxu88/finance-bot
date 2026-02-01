import type { UserProfile, FinancialAction } from '../types/financial.js';
export interface ExecutedActionRecord {
    id: string;
    userId: string;
    action: FinancialAction;
    previousStateSnapshot: UserProfile;
    newStateSnapshot: UserProfile;
    timestamp: Date;
    conversationId?: string;
}
export declare function appendExecutedAction(userId: string, record: Omit<ExecutedActionRecord, 'id' | 'userId'>): ExecutedActionRecord;
export declare function getHistory(userId: string, limit?: number): ExecutedActionRecord[];
export declare function getRecordById(userId: string, recordId: string): ExecutedActionRecord | undefined;
export declare function getLastRecord(userId: string): ExecutedActionRecord | undefined;
export declare function removeLastRecord(userId: string): boolean;
//# sourceMappingURL=audit-log.d.ts.map