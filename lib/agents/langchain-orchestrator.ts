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

/** 3-state + blocked: guardrails are the only hard stop; domain agents drive proceed vs caution vs do_not_proceed */
export type FinalDecision = 'blocked' | 'do_not_proceed' | 'proceed_with_caution' | 'proceed';

/** Deterministic consensus from domain agents (budgeting + investment); guardrail block is separate */
export type ConsensusLevel = 'blocked' | 'unanimous' | 'divided';

export interface OrchestrationResult {
  budgetingAnalysis: z.infer<typeof BudgetingAnalysisSchema>;
  investmentAnalysis: z.infer<typeof InvestmentAnalysisSchema>;
  guardrailAnalysis: z.infer<typeof GuardrailAnalysisSchema>;
  validationAnalysis: z.infer<typeof ValidationAnalysisSchema>;
  finalRecommendation: string;
  overallConfidence: 'high' | 'medium' | 'low' | 'very_low';
  /** Deterministic decision from policy (guardrail + domain agents); Validation Agent is non-authoritative */
  finalDecision: FinalDecision;
  /** Deterministic consensus: unanimous when all domain agents approve/approve_with_caution; divided when mix */
  consensusLevel: ConsensusLevel;
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
      const [budgetingAnalysis, investmentAnalysis, rawGuardrailAnalysis] = await Promise.all([
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

      // Deterministic override: if all min_balance guardrails are satisfied by the simulation numbers, force PASS
      const guardrailAnalysis = this.applyDeterministicGuardrailOverride(context, rawGuardrailAnalysis);

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

      // Phase 3: Deterministic decision policy (Validation Agent is non-authoritative for decision)
      const finalDecision = this.computeFinalDecision(guardrailAnalysis, budgetingAnalysis, investmentAnalysis);
      const consensusLevel = this.computeConsensus(guardrailAnalysis, budgetingAnalysis, investmentAnalysis);
      const shouldProceed = finalDecision === 'proceed' || finalDecision === 'proceed_with_caution';
      const finalRecommendation = this.buildFinalRecommendation(validationAnalysis, finalDecision);

      const executionTime = Date.now() - startTime;
      console.log(`  ✓ Decision (policy): ${finalDecision} | Consensus: ${consensusLevel}`);
      console.log(`\n[Orchestrator] ✅ Complete in ${(executionTime / 1000).toFixed(2)}s`);
      console.log(`[Orchestrator] Final decision: ${this.formatDecision(finalDecision)}`);
      console.log('='.repeat(80));

      return {
        budgetingAnalysis,
        investmentAnalysis,
        guardrailAnalysis,
        validationAnalysis,
        finalRecommendation,
        overallConfidence: validationAnalysis.overall_confidence,
        finalDecision,
        consensusLevel,
        shouldProceed,
        executionTime
      };

    } catch (error) {
      console.error('\n[Orchestrator] ❌ Fatal error:', error);
      throw new Error(`Agent orchestration failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Deterministic decision policy: guardrails are the only hard stop; domain agents drive proceed vs caution vs do_not_proceed.
   * Validation Agent does not override this.
   */
  private computeFinalDecision(
    guardrail: z.infer<typeof GuardrailAnalysisSchema>,
    budgeting: z.infer<typeof BudgetingAnalysisSchema>,
    investment: z.infer<typeof InvestmentAnalysisSchema>
  ): FinalDecision {
    if (!guardrail.can_proceed) return 'blocked';

    const oppose = (r: string): boolean =>
      r === 'strongly_oppose' || r === 'blocked';
    const cautionOrOppose = (r: string): boolean =>
      r === 'approve_with_caution' || r === 'not_recommended' || oppose(r);
    const approve = (r: string): boolean =>
      r === 'strongly_approve' || r === 'approve';

    if (oppose(budgeting.recommendation) || oppose(investment.recommendation)) return 'do_not_proceed';
    if (cautionOrOppose(budgeting.recommendation) || cautionOrOppose(investment.recommendation)) return 'proceed_with_caution';
    if (approve(budgeting.recommendation) && approve(investment.recommendation)) return 'proceed';

    return 'proceed_with_caution';
  }

  /**
   * Deterministic consensus: unanimous when all domain agents approve/approve_with_caution; divided when mix.
   */
  private computeConsensus(
    guardrail: z.infer<typeof GuardrailAnalysisSchema>,
    budgeting: z.infer<typeof BudgetingAnalysisSchema>,
    investment: z.infer<typeof InvestmentAnalysisSchema>
  ): ConsensusLevel {
    if (!guardrail.can_proceed) return 'blocked';

    const approving = (r: string): boolean =>
      r === 'strongly_approve' || r === 'approve' || r === 'approve_with_caution';
    const opposing = (r: string): boolean =>
      r === 'not_recommended' || r === 'strongly_oppose' || r === 'blocked';

    const bApprove = approving(budgeting.recommendation);
    const iApprove = approving(investment.recommendation);
    const bOppose = opposing(budgeting.recommendation);
    const iOppose = opposing(investment.recommendation);

    if (bApprove && iApprove) return 'unanimous';
    if (bOppose && iOppose) return 'divided';
    if ((bApprove && iOppose) || (bOppose && iApprove)) return 'divided';
    return 'unanimous';
  }

  private formatDecision(d: FinalDecision): string {
    switch (d) {
      case 'blocked':
        return '🛑 BLOCKED (guardrail)';
      case 'do_not_proceed':
        return '🛑 DO NOT PROCEED';
      case 'proceed_with_caution':
        return '⚠️ PROCEED WITH CAUTION';
      case 'proceed':
        return '✅ PROCEED';
      default:
        return String(d);
    }
  }

  private buildFinalRecommendation(
    validation: z.infer<typeof ValidationAnalysisSchema>,
    finalDecision: FinalDecision
  ): string {
    const decisionLine =
      finalDecision === 'blocked'
        ? 'Decision: BLOCKED (guardrail violation).'
        : finalDecision === 'do_not_proceed'
          ? 'Decision: DO NOT PROCEED (domain agents oppose).'
          : finalDecision === 'proceed_with_caution'
            ? 'Decision: PROCEED WITH CAUTION — you can do this; here are the risks and how to do it safer.'
            : 'Decision: PROCEED.';
    return validation.final_summary.trimEnd() + '\n\n' + decisionLine;
  }

  /**
   * Override guardrail result when simulation numbers show all min_balance rules are satisfied.
   * Prevents LLM from incorrectly blocking when e.g. checking after = $2,900 and threshold = $1,000.
   */
  private applyDeterministicGuardrailOverride(
    context: AgentContext,
    analysis: z.infer<typeof GuardrailAnalysisSchema>
  ): z.infer<typeof GuardrailAnalysisSchema> {
    const accountsAfter = context.simulationResult.scenarioIfDo.accountsAfter;
    const minBalanceRules = context.user.preferences.guardrails.filter(
      (g): g is typeof g & { accountId: string; threshold: number } =>
        g.type === 'min_balance' && g.accountId != null && typeof g.threshold === 'number'
    );
    if (minBalanceRules.length === 0) return analysis;

    const allSatisfied = minBalanceRules.every((g) => {
      const balance = this.getAccountBalance(accountsAfter, g.accountId);
      return balance >= g.threshold;
    });
    if (!allSatisfied) return analysis;

    return {
      ...analysis,
      violated: false,
      can_proceed: true,
      compliance_summary:
        analysis.compliance_summary +
        ' [Deterministic override: all min_balance thresholds met by simulation.].',
    };
  }

  private getAccountBalance(
    accounts: {
      checking: number;
      savings: number;
      investments: { taxable: number; rothIRA: number; traditional401k: number };
    },
    accountId: string
  ): number {
    switch (accountId) {
      case 'checking':
        return accounts.checking;
      case 'savings':
        return accounts.savings;
      case 'taxable':
        return accounts.investments.taxable;
      case 'rothIRA':
        return accounts.investments.rothIRA;
      case 'traditional401k':
        return accounts.investments.traditional401k;
      default:
        return 0;
    }
  }
}
