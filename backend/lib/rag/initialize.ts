/**
 * RAG Initialization
 * Initialize user history and knowledge base for retrieval-augmented generation
 */

import { userHistoryRAG } from './user-history-rag.js';
import { knowledgeBase } from './knowledge-base.js';
import type { UserProfile } from '../../types/financial.js';

/**
 * Initialize RAG system for a user
 */
export async function initializeRAGForUser(user: UserProfile): Promise<void> {
  console.log(`[RAG] Initializing for user ${user.id}...`);
  
  try {
    // Index user's history
    await userHistoryRAG.indexUser(user);
    
    console.log(`[RAG] User ${user.id} initialized successfully`);
  } catch (error) {
    console.error(`[RAG] Failed to initialize user ${user.id}:`, error);
    // Don't throw - RAG is an enhancement, not critical
  }
}

/**
 * Initialize knowledge base (do once on app startup)
 */
export async function initializeKnowledgeBase(): Promise<void> {
  console.log('[RAG] Initializing knowledge base...');
  
  try {
    await knowledgeBase.initialize();
    console.log('[RAG] Knowledge base initialized successfully');
  } catch (error) {
    console.error('[RAG] Failed to initialize knowledge base:', error);
    // Don't throw - RAG is an enhancement, not critical
  }
}
