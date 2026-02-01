export declare class FinancialKnowledgeBase {
    private static readonly COLLECTION_NAME;
    initialize(): Promise<void>;
    search(query: string, k?: number): Promise<Array<{
        principle: string;
        source: string;
        category: string;
    }>>;
    private createKnowledgeDocuments;
}
export declare const knowledgeBase: FinancialKnowledgeBase;
//# sourceMappingURL=knowledge-base.d.ts.map