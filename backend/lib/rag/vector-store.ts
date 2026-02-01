/**
 * Vector Store Manager
 * Manages in-memory vector stores for RAG (Retrieval-Augmented Generation).
 * Uses OpenAI embeddings for indexing and similarity search.
 */

import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';

export class VectorStoreManager {
  private embeddings: OpenAIEmbeddings;
  private stores: Map<string, MemoryVectorStore> = new Map();

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

  /**
   * Get or create a vector store for a specific collection
   */
  async getStore(collectionName: string): Promise<MemoryVectorStore> {
    if (this.stores.has(collectionName)) {
      return this.stores.get(collectionName)!;
    }

    // Create new in-memory vector store (no external server required)
    const store = await MemoryVectorStore.fromDocuments(
      [], // Start empty
      this.embeddings
    );

    this.stores.set(collectionName, store);
    return store;
  }

  /**
   * Add documents to a collection
   */
  async addDocuments(collectionName: string, docs: Document[]): Promise<void> {
    const store = await this.getStore(collectionName);
    await store.addDocuments(docs);
    console.log(`[RAG] Added ${docs.length} documents to ${collectionName}`);
  }

  /**
   * Search for relevant documents
   */
  async search(
    collectionName: string,
    query: string,
    k: number = 5
  ): Promise<Document[]> {
    const store = await this.getStore(collectionName);
    return store.similaritySearch(query, k);
  }

  /**
   * Clear all stores (useful for testing)
   */
  clearAll(): void {
    this.stores.clear();
  }
}

// Singleton instance
export const vectorStore = new VectorStoreManager();
