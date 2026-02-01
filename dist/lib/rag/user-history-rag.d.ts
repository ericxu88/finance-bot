import type { UserProfile } from '../../types/financial.js';
export declare class UserHistoryRAG {
    indexUser(user: UserProfile): Promise<void>;
    search(userId: string, query: string, k?: number): Promise<Array<{
        content: string;
        source: string;
        metadata: Record<string, unknown>;
    }>>;
    private createDocuments;
    private groupByMonth;
    private getCategoryBreakdown;
    private getMonthsUntil;
    private getPriorityLabel;
    private getCategoryStatus;
}
export declare const userHistoryRAG: UserHistoryRAG;
//# sourceMappingURL=user-history-rag.d.ts.map