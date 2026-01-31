/**
 * Vector Store Manager
 * Manages ChromaDB collections for RAG (Retrieval-Augmented Generation)
 * Uses in-memory mode for MVP (no persistence)
 */

import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Document } from '@langchain/core/documents';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';

export class VectorStoreManager {
  private embeddings: GoogleGenerativeAIEmbeddings;
  private stores: Map<string, MemoryVectorStore> = new Map();

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY required for embeddings');
    }

    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey,
      modelName: 'embedding-001', // Gemini's free embedding model
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
