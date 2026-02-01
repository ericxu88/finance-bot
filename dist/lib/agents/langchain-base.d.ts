import { ChatOpenAI } from '@langchain/openai';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import type { UserProfile, FinancialAction, SimulationResult } from '../../types/financial.js';
import type { z } from 'zod';
export interface AgentContext {
    user: UserProfile;
    action: FinancialAction;
    simulationResult: SimulationResult;
    historicalMetrics: {
        monthsOfData: number;
        avgMonthlySpending: number;
        spendingVariance: number;
        transactionCount: number;
        categoryBreakdown: Record<string, number>;
    };
}
export declare abstract class LangChainBaseAgent<TSchema extends z.ZodType> {
    protected model: ChatOpenAI;
    protected parser: StructuredOutputParser<z.infer<TSchema>>;
    abstract readonly agentName: string;
    abstract readonly schema: TSchema;
    abstract readonly systemPrompt: string;
    constructor(temperature: number);
    protected abstract buildAnalysisPrompt(context: AgentContext): string;
    private stripMarkdownCodeBlocks;
    private attemptJsonFix;
    analyze(context: AgentContext): Promise<z.infer<TSchema>>;
    protected formatCurrency(amount: number): string;
    protected formatPercent(value: number): string;
    protected serializeSimulationResult(sim: SimulationResult): string;
}
//# sourceMappingURL=langchain-base.d.ts.map