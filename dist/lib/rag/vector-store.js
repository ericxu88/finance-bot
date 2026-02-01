import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
export class VectorStoreManager {
    embeddings;
    stores = new Map();
    constructor() {
        const apiKey = process.env.OPEN_AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY (or OPEN_AI_API_KEY) required for RAG embeddings');
        }
        const modelName = process.env.OPENAI_EMBEDDING_MODEL?.trim() || 'text-embedding-3-small';
        this.embeddings = new OpenAIEmbeddings({
            apiKey,
            modelName,
        });
    }
    async getStore(collectionName) {
        if (this.stores.has(collectionName)) {
            return this.stores.get(collectionName);
        }
        const store = await MemoryVectorStore.fromDocuments([], this.embeddings);
        this.stores.set(collectionName, store);
        return store;
    }
    async addDocuments(collectionName, docs) {
        const store = await this.getStore(collectionName);
        await store.addDocuments(docs);
        console.log(`[RAG] Added ${docs.length} documents to ${collectionName}`);
    }
    async search(collectionName, query, k = 5) {
        const store = await this.getStore(collectionName);
        return store.similaritySearch(query, k);
    }
    clearAll() {
        this.stores.clear();
    }
}
export const vectorStore = new VectorStoreManager();
//# sourceMappingURL=vector-store.js.map