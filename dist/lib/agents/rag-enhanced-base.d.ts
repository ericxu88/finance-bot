import { LangChainBaseAgent, type AgentContext } from './langchain-base.js';
import type { z } from 'zod';
export interface RAGContext {
    historical: string;
    knowledge: string;
}
export interface EnhancedAgentContext extends AgentContext {
    ragContext?: RAGContext;
}
export declare abstract class RAGEnhancedAgent<TSchema extends z.ZodType> extends LangChainBaseAgent<TSchema> {
    analyze(context: AgentContext): Promise<z.infer<TSchema>>;
    protected getHistoricalContext(context: AgentContext): Promise<string>;
    protected getKnowledgeContext(context: AgentContext): Promise<string>;
    protected buildHistoricalQuery(context: AgentContext): string;
    protected buildKnowledgeQuery(context: AgentContext): string;
    protected abstract buildAnalysisPrompt(context: AgentContext | EnhancedAgentContext): Promise<string>;
}
//# sourceMappingURL=rag-enhanced-base.d.ts.map