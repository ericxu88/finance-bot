import type { AgentContext } from './langchain-base.js';
import type { z } from 'zod';
import { BudgetingAnalysisSchema, InvestmentAnalysisSchema, GuardrailAnalysisSchema, ValidationAnalysisSchema } from './schemas.js';
export declare function generateMockBudgetingAnalysis(context: AgentContext): z.infer<typeof BudgetingAnalysisSchema>;
export declare function generateMockInvestmentAnalysis(context: AgentContext): z.infer<typeof InvestmentAnalysisSchema>;
export declare function generateMockGuardrailAnalysis(context: AgentContext): z.infer<typeof GuardrailAnalysisSchema>;
export declare function generateMockValidationAnalysis(context: AgentContext, budgetingAnalysis: z.infer<typeof BudgetingAnalysisSchema>, investmentAnalysis: z.infer<typeof InvestmentAnalysisSchema>, guardrailAnalysis: z.infer<typeof GuardrailAnalysisSchema>): z.infer<typeof ValidationAnalysisSchema>;
//# sourceMappingURL=mock-agents.d.ts.map