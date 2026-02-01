import { userHistoryRAG } from './user-history-rag.js';
import { knowledgeBase } from './knowledge-base.js';
export async function initializeRAGForUser(user) {
    console.log(`[RAG] Initializing for user ${user.id}...`);
    try {
        await userHistoryRAG.indexUser(user);
        console.log(`[RAG] User ${user.id} initialized successfully`);
    }
    catch (error) {
        console.error(`[RAG] Failed to initialize user ${user.id}:`, error);
    }
}
export async function initializeKnowledgeBase() {
    console.log('[RAG] Initializing knowledge base...');
    try {
        await knowledgeBase.initialize();
        console.log('[RAG] Knowledge base initialized successfully');
    }
    catch (error) {
        console.error('[RAG] Failed to initialize knowledge base:', error);
    }
}
//# sourceMappingURL=initialize.js.map