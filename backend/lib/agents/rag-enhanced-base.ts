/**
 * RAG-Enhanced Base Agent
 * Extends LangChainBaseAgent with RAG capabilities for historical context and financial knowledge
 */

import { LangChainBaseAgent, type AgentContext } from './langchain-base.js';
import { userHistoryRAG } from '../rag/user-history-rag.js';
import { knowledgeBase } from '../rag/knowledge-base.js';
import type { z } from 'zod';

export interface RAGContext {
  historical: string;
  knowledge: string;
}

export interface EnhancedAgentContext extends AgentContext {
  ragContext?: RAGContext;
}

/**
 * Extended base agent with RAG capabilities
 */
export abstract class RAGEnhancedAgent<TSchema extends z.ZodType> extends LangChainBaseAgent<TSchema> {
  
  /**
   * Override analyze to include RAG context
   */
  async analyze(context: AgentContext): Promise<z.infer<TSchema>> {
    try {
      // Retrieve relevant historical context
      const historicalContext = await this.getHistoricalContext(context);
      
      // Retrieve relevant financial principles
      const knowledgeContext = await this.getKnowledgeContext(context);
      
      // Inject into context for prompt building
      const enhancedContext: EnhancedAgentContext = {
        ...context,
        ragContext: {
          historical: historicalContext,
          knowledge: knowledgeContext,
        }
      };
      
      return super.analyze(enhancedContext as AgentContext);
    } catch (error) {
      // If RAG fails, fall back to non-RAG analysis
      console.warn(`[${this.agentName}] RAG retrieval failed, using base analysis:`, error);
      return super.analyze(context);
    }
  }

  /**
   * Get relevant historical context via RAG
   */
  protected async getHistoricalContext(context: AgentContext): Promise<string> {
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
    } catch (error) {
      console.warn(`[${this.agentName}] Historical context retrieval failed:`, error);
      return 'Historical context unavailable.';
    }
  }

  /**
   * Get relevant financial knowledge via RAG
   */
  protected async getKnowledgeContext(context: AgentContext): Promise<string> {
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
    } catch (error) {
      console.warn(`[${this.agentName}] Knowledge context retrieval failed:`, error);
      return 'Financial knowledge unavailable.';
    }
  }

  /**
   * Build query for historical context (override in subclasses for specificity)
   */
  protected buildHistoricalQuery(context: AgentContext): string {
    return `${context.action.type} ${context.action.amount} past behavior patterns spending goals`;
  }

  /**
   * Build query for knowledge base (override in subclasses for specificity)
   */
  protected buildKnowledgeQuery(context: AgentContext): string {
    return `${context.action.type} best practices financial advice`;
  }

  /**
   * Override buildAnalysisPrompt to include RAG context if available
   */
  protected abstract buildAnalysisPrompt(context: AgentContext | EnhancedAgentContext): Promise<string>;
}
