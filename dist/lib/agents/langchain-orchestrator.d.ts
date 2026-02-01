import type { AgentContext } from './langchain-base.js';
import type { z } from 'zod';
import { BudgetingAnalysisSchema, InvestmentAnalysisSchema, GuardrailAnalysisSchema, ValidationAnalysisSchema } from './schemas.js';
export type FinalDecision = 'blocked' | 'do_not_proceed' | 'proceed_with_caution' | 'proceed';
export type ConsensusLevel = 'blocked' | 'unanimous' | 'divided';
export interface OrchestrationResult {
    budgetingAnalysis: z.infer<typeof BudgetingAnalysisSchema>;
    investmentAnalysis: z.infer<typeof InvestmentAnalysisSchema>;
    guardrailAnalysis: z.infer<typeof GuardrailAnalysisSchema>;
    validationAnalysis: z.infer<typeof ValidationAnalysisSchema>;
    finalRecommendation: string;
    overallConfidence: 'high' | 'medium' | 'low' | 'very_low';
    finalDecision: FinalDecision;
    consensusLevel: ConsensusLevel;
    shouldProceed: boolean;
    executionTime: number;
}
export declare class LangChainAgentOrchestrator {
    private budgetingAgent;
    private investmentAgent;
    private guardrailAgent;
    private validationAgent;
    processDecision(context: AgentContext): Promise<OrchestrationResult>;
    private computeFinalDecision;
    private computeConsensus;
    private formatDecision;
    private buildFinalRecommendation;
    private applyDeterministicGuardrailOverride;
    private getAccountBalance;
}
//# sourceMappingURL=langchain-orchestrator.d.ts.map