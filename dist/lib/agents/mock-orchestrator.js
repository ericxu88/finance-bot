import { generateMockBudgetingAnalysis, generateMockInvestmentAnalysis, generateMockGuardrailAnalysis, generateMockValidationAnalysis } from './mock-agents.js';
function computeFinalDecision(guardrail, budgeting, investment) {
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
function computeConsensus(guardrail, budgeting, investment) {
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
export class MockAgentOrchestrator {
    async processDecision(context) {
        const startTime = Date.now();
        console.log(`\n[Mock Orchestrator] Starting mock multi-agent analysis for ${context.action.type} $${context.action.amount}`);
        console.log('='.repeat(80));
        console.log('⚠️  DEMO MODE: Using mock responses (no API calls)');
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('\n[Mock Orchestrator] Phase 1: Generating mock agent analyses...');
        const budgetingAnalysis = generateMockBudgetingAnalysis(context);
        const investmentAnalysis = generateMockInvestmentAnalysis(context);
        const guardrailAnalysis = generateMockGuardrailAnalysis(context);
        console.log('\n[Mock Orchestrator] Phase 1 complete. Agent results:');
        console.log(`  ✓ Budgeting: ${budgetingAnalysis.recommendation} (confidence: ${(budgetingAnalysis.confidence * 100).toFixed(0)}%)`);
        console.log(`  ✓ Investment: ${investmentAnalysis.recommendation} (confidence: ${(investmentAnalysis.confidence * 100).toFixed(0)}%)`);
        console.log(`  ✓ Guardrail: ${guardrailAnalysis.can_proceed ? 'PASS ✓' : 'BLOCKED ✗'} (violations: ${guardrailAnalysis.violated})`);
        console.log('\n[Mock Orchestrator] Phase 2: Generating validation analysis...');
        const validationAnalysis = generateMockValidationAnalysis(context, budgetingAnalysis, investmentAnalysis, guardrailAnalysis);
        const finalDecision = computeFinalDecision(guardrailAnalysis, budgetingAnalysis, investmentAnalysis);
        const consensusLevel = computeConsensus(guardrailAnalysis, budgetingAnalysis, investmentAnalysis);
        const shouldProceed = finalDecision === 'proceed' || finalDecision === 'proceed_with_caution';
        const decisionLine = finalDecision === 'blocked'
            ? 'Decision: BLOCKED (guardrail violation).'
            : finalDecision === 'do_not_proceed'
                ? 'Decision: DO NOT PROCEED (domain agents oppose).'
                : finalDecision === 'proceed_with_caution'
                    ? 'Decision: PROCEED WITH CAUTION — you can do this; here are the risks and how to do it safer.'
                    : 'Decision: PROCEED.';
        const finalRecommendation = validationAnalysis.final_summary.trimEnd() + '\n\n' + decisionLine;
        const executionTime = Date.now() - startTime;
        console.log(`\n[Mock Orchestrator] Phase 2 complete.`);
        console.log(`  ✓ Decision (policy): ${finalDecision} | Consensus: ${consensusLevel}`);
        console.log(`\n[Mock Orchestrator] ✅ Complete in ${(executionTime / 1000).toFixed(2)}s`);
        console.log(`[Mock Orchestrator] Final decision: ${shouldProceed ? (finalDecision === 'proceed_with_caution' ? '⚠️ PROCEED WITH CAUTION' : '✅ PROCEED') : '🛑 DO NOT PROCEED'}`);
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
}
//# sourceMappingURL=mock-orchestrator.js.map