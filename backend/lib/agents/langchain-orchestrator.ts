/**
 * LangChain Agent Orchestrator
 * 
 * Coordinates multi-agent analysis pipeline
 */

import { LangChainBudgetingAgent } from './langchain-budgeting-agent.js';
import { LangChainInvestmentAgent } from './langchain-investment-agent.js';
import { LangChainGuardrailAgent } from './langchain-guardrail-agent.js';
import { LangChainValidationAgent } from './langchain-validation-agent.js';
import type { AgentContext } from './langchain-base.js';
import type { z } from 'zod';
import {
  BudgetingAnalysisSchema,
  InvestmentAnalysisSchema,
  GuardrailAnalysisSchema,
  ValidationAnalysisSchema
} from './schemas.js';

export interface OrchestrationResult {
  budgetingAnalysis: z.infer<typeof BudgetingAnalysisSchema>;
  investmentAnalysis: z.infer<typeof InvestmentAnalysisSchema>;
  guardrailAnalysis: z.infer<typeof GuardrailAnalysisSchema>;
  validationAnalysis: z.infer<typeof ValidationAnalysisSchema>;
  finalRecommendation: string;
  overallConfidence: 'high' | 'medium' | 'low' | 'very_low';
  shouldProceed: boolean;
  executionTime: number;
}

export class LangChainAgentOrchestrator {
  private budgetingAgent = new LangChainBudgetingAgent();
  private investmentAgent = new LangChainInvestmentAgent();
  private guardrailAgent = new LangChainGuardrailAgent();
  private validationAgent = new LangChainValidationAgent();

  async processDecision(context: AgentContext): Promise<OrchestrationResult> {
    const startTime = Date.now();

    try {
      console.log(`\n[Orchestrator] Starting multi-agent analysis for ${context.action.type} $${context.action.amount}`);
      console.log('='.repeat(80));

      // Phase 1: Run specialized agents in parallel
      console.log('\n[Orchestrator] Phase 1: Running specialized agents in parallel...');
      const [budgetingAnalysis, investmentAnalysis, guardrailAnalysis] = await Promise.all([
        this.budgetingAgent.analyze(context).catch(err => {
          console.error('[Budgeting Agent] Error:', err);
          throw err;
        }),
        this.investmentAgent.analyze(context).catch(err => {
          console.error('[Investment Agent] Error:', err);
          throw err;
        }),
        this.guardrailAgent.analyze(context).catch(err => {
          console.error('[Guardrail Agent] Error:', err);
          throw err;
        })
      ]);

      console.log('\n[Orchestrator] Phase 1 complete. Agent results:');
      console.log(`  ✓ Budgeting: ${budgetingAnalysis.recommendation} (confidence: ${(budgetingAnalysis.confidence * 100).toFixed(0)}%)`);
      console.log(`  ✓ Investment: ${investmentAnalysis.recommendation} (confidence: ${(investmentAnalysis.confidence * 100).toFixed(0)}%)`);
      console.log(`  ✓ Guardrail: ${guardrailAnalysis.can_proceed ? 'PASS ✓' : 'BLOCKED ✗'} (violations: ${guardrailAnalysis.violated})`);

      // Phase 2: Validation agent reviews all outputs
      console.log('\n[Orchestrator] Phase 2: Running validation agent...');
      const validationAnalysis = await this.validationAgent.analyzeWithAgentOutputs(
        context,
        { budgetingAnalysis, investmentAnalysis, guardrailAnalysis }
      ).catch(err => {
        console.error('[Validation Agent] Error:', err);
        throw err;
      });

      console.log(`\n[Orchestrator] Phase 2 complete.`);
      console.log(`  ✓ Final recommendation: ${validationAnalysis.overall_recommendation}`);
      console.log(`  ✓ Confidence: ${validationAnalysis.overall_confidence}`);
      console.log(`  ✓ Consensus: ${validationAnalysis.agent_consensus.consensus_level}`);

      // Phase 3: Synthesize final recommendation
      const finalRecommendation = this.buildFinalRecommendation(validationAnalysis);
      const shouldProceed = this.determineShouldProceed(validationAnalysis, guardrailAnalysis);

      const executionTime = Date.now() - startTime;
      console.log(`\n[Orchestrator] ✅ Complete in ${(executionTime / 1000).toFixed(2)}s`);
      console.log(`[Orchestrator] Final decision: ${shouldProceed ? '✅ PROCEED' : '🛑 DO NOT PROCEED'}`);
      console.log('='.repeat(80));

      return {
        budgetingAnalysis,
        investmentAnalysis,
        guardrailAnalysis,
        validationAnalysis,
        finalRecommendation,
        overallConfidence: validationAnalysis.overall_confidence,
        shouldProceed,
        executionTime
      };

    } catch (error) {
      console.error('\n[Orchestrator] ❌ Fatal error:', error);
      throw new Error(`Agent orchestration failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private buildFinalRecommendation(validation: z.infer<typeof ValidationAnalysisSchema>): string {
    // Use the validation agent's summary as the primary recommendation
    return validation.final_summary;
  }

  private determineShouldProceed(
    validation: z.infer<typeof ValidationAnalysisSchema>,
    guardrail: z.infer<typeof GuardrailAnalysisSchema>
  ): boolean {
    // Hard block on guardrail violations
    if (!guardrail.can_proceed) {
      return false;
    }

    // Otherwise follow validation recommendation
    return validation.overall_recommendation === 'proceed_confidently' ||
      validation.overall_recommendation === 'proceed';
  }
}
