import { Document } from '@langchain/core/documents';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
export declare class VectorStoreManager {
    private embeddings;
    private stores;
    constructor();
    getStore(collectionName: string): Promise<MemoryVectorStore>;
    addDocuments(collectionName: string, docs: Document[]): Promise<void>;
    search(collectionName: string, query: string, k?: number): Promise<Document[]>;
    clearAll(): void;
}
export declare const vectorStore: VectorStoreManager;
//# sourceMappingURL=vector-store.d.ts.map