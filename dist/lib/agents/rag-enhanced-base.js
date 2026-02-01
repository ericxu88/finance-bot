import { LangChainBaseAgent } from './langchain-base.js';
import { userHistoryRAG } from '../rag/user-history-rag.js';
import { knowledgeBase } from '../rag/knowledge-base.js';
export class RAGEnhancedAgent extends LangChainBaseAgent {
    async analyze(context) {
        try {
            const historicalContext = await this.getHistoricalContext(context);
            const knowledgeContext = await this.getKnowledgeContext(context);
            const enhancedContext = {
                ...context,
                ragContext: {
                    historical: historicalContext,
                    knowledge: knowledgeContext,
                }
            };
            return super.analyze(enhancedContext);
        }
        catch (error) {
            console.warn(`[${this.agentName}] RAG retrieval failed, using base analysis:`, error);
            return super.analyze(context);
        }
    }
    async getHistoricalContext(context) {
        try {
            const query = this.buildHistoricalQuery(context);
            const results = await userHistoryRAG.search(context.user.id, query, 5);
            if (results.length === 0) {
                return 'No relevant historical patterns found.';
            }
            return `
RELEVANT HISTORICAL CONTEXT:
${results.map((r, i) => `
[${i + 1}] ${r.source.toUpperCase()}:
${r.content}
`).join('\n')}
      `.trim();
        }
        catch (error) {
            console.warn(`[${this.agentName}] Historical context retrieval failed:`, error);
            return 'Historical context unavailable.';
        }
    }
    async getKnowledgeContext(context) {
        try {
            const query = this.buildKnowledgeQuery(context);
            const results = await knowledgeBase.search(query, 3);
            if (results.length === 0) {
                return 'No relevant financial principles found.';
            }
            return `
RELEVANT FINANCIAL PRINCIPLES:
${results.map((r, i) => `
[${i + 1}] ${r.category}:
${r.principle}
(Source: ${r.source})
`).join('\n')}
      `.trim();
        }
        catch (error) {
            console.warn(`[${this.agentName}] Knowledge context retrieval failed:`, error);
            return 'Financial knowledge unavailable.';
        }
    }
    buildHistoricalQuery(context) {
        return `${context.action.type} ${context.action.amount} past behavior patterns spending goals`;
    }
    buildKnowledgeQuery(context) {
        return `${context.action.type} best practices financial advice`;
    }
}
//# sourceMappingURL=rag-enhanced-base.js.map