import { LangChainBudgetingAgent } from './langchain-budgeting-agent.js';
import { LangChainInvestmentAgent } from './langchain-investment-agent.js';
import { LangChainGuardrailAgent } from './langchain-guardrail-agent.js';
import { LangChainValidationAgent } from './langchain-validation-agent.js';
import { getInvestmentBalance } from '../../types/financial.js';
export class LangChainAgentOrchestrator {
    budgetingAgent = new LangChainBudgetingAgent();
    investmentAgent = new LangChainInvestmentAgent();
    guardrailAgent = new LangChainGuardrailAgent();
    validationAgent = new LangChainValidationAgent();
    async processDecision(context) {
        const startTime = Date.now();
        try {
            console.log(`\n[Orchestrator] Starting multi-agent analysis for ${context.action.type} $${context.action.amount}`);
            console.log('='.repeat(80));
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
            const guardrailAnalysis = this.applyDeterministicGuardrailOverride(context, rawGuardrailAnalysis);
            console.log('\n[Orchestrator] Phase 1 complete. Agent results:');
            console.log(`  ✓ Budgeting: ${budgetingAnalysis.recommendation} (confidence: ${(budgetingAnalysis.confidence * 100).toFixed(0)}%)`);
            console.log(`  ✓ Investment: ${investmentAnalysis.recommendation} (confidence: ${(investmentAnalysis.confidence * 100).toFixed(0)}%)`);
            console.log(`  ✓ Guardrail: ${guardrailAnalysis.can_proceed ? 'PASS ✓' : 'BLOCKED ✗'} (violations: ${guardrailAnalysis.violated})`);
            console.log('\n[Orchestrator] Phase 2: Running validation agent...');
            const validationAnalysis = await this.validationAgent.analyzeWithAgentOutputs(context, { budgetingAnalysis, investmentAnalysis, guardrailAnalysis }).catch(err => {
                console.error('[Validation Agent] Error:', err);
                throw err;
            });
            console.log(`\n[Orchestrator] Phase 2 complete.`);
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
        }
        catch (error) {
            console.error('\n[Orchestrator] ❌ Fatal error:', error);
            throw new Error(`Agent orchestration failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    computeFinalDecision(guardrail, budgeting, investment) {
        if (!guardrail.can_proceed)
            return 'blocked';
        const oppose = (r) => r === 'strongly_oppose' || r === 'blocked';
        const cautionOrOppose = (r) => r === 'approve_with_caution' || r === 'not_recommended' || oppose(r);
        const approve = (r) => r === 'strongly_approve' || r === 'approve';
        if (oppose(budgeting.recommendation) || oppose(investment.recommendation))
            return 'do_not_proceed';
        if (cautionOrOppose(budgeting.recommendation) || cautionOrOppose(investment.recommendation))
            return 'proceed_with_caution';
        if (approve(budgeting.recommendation) && approve(investment.recommendation))
            return 'proceed';
        return 'proceed_with_caution';
    }
    computeConsensus(guardrail, budgeting, investment) {
        if (!guardrail.can_proceed)
            return 'blocked';
        const approving = (r) => r === 'strongly_approve' || r === 'approve' || r === 'approve_with_caution';
        const opposing = (r) => r === 'not_recommended' || r === 'strongly_oppose' || r === 'blocked';
        const bApprove = approving(budgeting.recommendation);
        const iApprove = approving(investment.recommendation);
        const bOppose = opposing(budgeting.recommendation);
        const iOppose = opposing(investment.recommendation);
        if (bApprove && iApprove)
            return 'unanimous';
        if (bOppose && iOppose)
            return 'divided';
        if ((bApprove && iOppose) || (bOppose && iApprove))
            return 'divided';
        return 'unanimous';
    }
    formatDecision(d) {
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
    buildFinalRecommendation(validation, finalDecision) {
        const decisionLine = finalDecision === 'blocked'
            ? 'Decision: BLOCKED (guardrail violation).'
            : finalDecision === 'do_not_proceed'
                ? 'Decision: DO NOT PROCEED (domain agents oppose).'
                : finalDecision === 'proceed_with_caution'
                    ? 'Decision: PROCEED WITH CAUTION — you can do this; here are the risks and how to do it safer.'
                    : 'Decision: PROCEED.';
        return validation.final_summary.trimEnd() + '\n\n' + decisionLine;
    }
    applyDeterministicGuardrailOverride(context, analysis) {
        const accountsAfter = context.simulationResult.scenarioIfDo.accountsAfter;
        const minBalanceRules = context.user.preferences.guardrails.filter((g) => g.type === 'min_balance' && g.accountId != null && typeof g.threshold === 'number');
        if (minBalanceRules.length === 0)
            return analysis;
        const allSatisfied = minBalanceRules.every((g) => {
            const balance = this.getAccountBalance(accountsAfter, g.accountId);
            return balance >= g.threshold;
        });
        if (!allSatisfied)
            return analysis;
        return {
            ...analysis,
            violated: false,
            can_proceed: true,
            compliance_summary: analysis.compliance_summary +
                ' [Deterministic override: all min_balance thresholds met by simulation.].',
        };
    }
    getAccountBalance(accounts, accountId) {
        switch (accountId) {
            case 'checking':
                return accounts.checking;
            case 'savings':
                return accounts.savings;
            case 'taxable':
                return getInvestmentBalance(accounts.investments.taxable);
            case 'rothIRA':
                return getInvestmentBalance(accounts.investments.rothIRA);
            case 'traditional401k':
                return getInvestmentBalance(accounts.investments.traditional401k);
            default:
                return 0;
        }
    }
}
//# sourceMappingURL=langchain-orchestrator.js.map