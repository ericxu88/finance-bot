import { MockAgentOrchestrator } from '../mock-orchestrator.js';
import { BudgetingAnalysisSchema, InvestmentAnalysisSchema, GuardrailAnalysisSchema, ValidationAnalysisSchema, } from '../schemas.js';
import { sampleUser } from '../../sample-data.js';
import { simulate_save } from '../../simulation-engine.js';
const VALID_RECOMMENDATIONS = [
    'strongly_approve',
    'approve',
    'approve_with_caution',
    'not_recommended',
    'strongly_oppose',
    'blocked',
];
const VALID_OVERALL_RECOMMENDATIONS = [
    'proceed_confidently',
    'proceed',
    'proceed_with_caution',
    'reconsider',
    'do_not_proceed',
];
const VALID_CONFIDENCE = ['high', 'medium', 'low', 'very_low'];
function buildContext() {
    const goalId = sampleUser.goals[0]?.id ?? 'goal_emergency';
    const action = { type: 'save', amount: 100, goalId };
    const simulationResult = simulate_save(sampleUser, action.amount, goalId);
    return {
        user: sampleUser,
        action,
        simulationResult,
        historicalMetrics: {
            monthsOfData: 4,
            avgMonthlySpending: 2500,
            spendingVariance: 0.15,
            transactionCount: 120,
            categoryBreakdown: {},
        },
    };
}
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
async function main() {
    console.log('\n🧪 Agent architecture unit tests (no API)\n');
    console.log('='.repeat(60));
    const context = buildContext();
    assert(!!context.user, 'Context has user');
    assert(!!context.action, 'Context has action');
    assert(!!context.simulationResult, 'Context has simulationResult');
    assert(!!context.simulationResult.scenarioIfDo, 'Simulation has scenarioIfDo');
    console.log('  ✅ AgentContext built correctly');
    const orchestrator = new MockAgentOrchestrator();
    const result = await orchestrator.processDecision(context);
    assert(!!result.budgetingAnalysis, 'Has budgetingAnalysis');
    assert(!!result.investmentAnalysis, 'Has investmentAnalysis');
    assert(!!result.guardrailAnalysis, 'Has guardrailAnalysis');
    assert(!!result.validationAnalysis, 'Has validationAnalysis');
    assert(typeof result.finalRecommendation === 'string', 'Has finalRecommendation string');
    assert(result.finalRecommendation.length >= 100, 'finalRecommendation length >= 100');
    assert(typeof result.shouldProceed === 'boolean', 'Has shouldProceed boolean');
    assert(VALID_CONFIDENCE.includes(result.overallConfidence), 'Valid overallConfidence');
    assert(typeof result.executionTime === 'number', 'Has executionTime number');
    assert(['blocked', 'do_not_proceed', 'proceed_with_caution', 'proceed'].includes(result.finalDecision ?? ''), 'Has finalDecision (policy)');
    assert(['blocked', 'unanimous', 'divided'].includes(result.consensusLevel ?? ''), 'Has consensusLevel (policy)');
    console.log('  ✅ OrchestrationResult shape valid');
    const budgetingParsed = BudgetingAnalysisSchema.safeParse(result.budgetingAnalysis);
    assert(budgetingParsed.success, 'BudgetingAnalysis matches schema');
    const b = result.budgetingAnalysis;
    assert(VALID_RECOMMENDATIONS.includes(b.recommendation), 'Budgeting recommendation enum');
    assert(b.confidence >= 0 && b.confidence <= 1, 'Budgeting confidence in [0,1]');
    assert(b.reasoning.length >= 50, 'Budgeting reasoning length');
    assert(b.key_findings.length >= 1 && b.key_findings.length <= 5, 'Budgeting key_findings length');
    assert(Array.isArray(b.concerns), 'Budgeting concerns array');
    assert(['high', 'medium', 'low'].includes(b.data_quality), 'Budgeting data_quality');
    assert(!!b.budgeting_metrics, 'Budgeting has budgeting_metrics');
    console.log('  ✅ BudgetingAnalysis schema valid');
    const investmentParsed = InvestmentAnalysisSchema.safeParse(result.investmentAnalysis);
    assert(investmentParsed.success, 'InvestmentAnalysis matches schema');
    const inv = result.investmentAnalysis;
    assert(VALID_RECOMMENDATIONS.includes(inv.recommendation), 'Investment recommendation enum');
    assert(inv.confidence >= 0 && inv.confidence <= 1, 'Investment confidence in [0,1]');
    assert(!!inv.investment_metrics, 'Investment has investment_metrics');
    console.log('  ✅ InvestmentAnalysis schema valid');
    const guardrailParsed = GuardrailAnalysisSchema.safeParse(result.guardrailAnalysis);
    assert(guardrailParsed.success, 'GuardrailAnalysis matches schema');
    const g = result.guardrailAnalysis;
    assert(typeof g.violated === 'boolean', 'Guardrail violated boolean');
    assert(typeof g.can_proceed === 'boolean', 'Guardrail can_proceed boolean');
    assert(Array.isArray(g.violations), 'Guardrail violations array');
    assert(Array.isArray(g.warnings), 'Guardrail warnings array');
    assert(typeof g.compliance_summary === 'string', 'Guardrail compliance_summary');
    console.log('  ✅ GuardrailAnalysis schema valid');
    const validationParsed = ValidationAnalysisSchema.safeParse(result.validationAnalysis);
    assert(validationParsed.success, 'ValidationAnalysis matches schema');
    const v = result.validationAnalysis;
    assert(VALID_OVERALL_RECOMMENDATIONS.includes(v.overall_recommendation), 'Validation overall_recommendation enum');
    assert(VALID_CONFIDENCE.includes(v.overall_confidence), 'Validation overall_confidence');
    assert(v.final_summary.length >= 100, 'Validation final_summary length');
    assert(!!v.agent_consensus, 'Validation has agent_consensus');
    assert(['unanimous', 'strong', 'moderate', 'weak', 'divided'].includes(v.agent_consensus.consensus_level), 'Consensus level enum');
    assert(!!v.decision_tree, 'Validation has decision_tree');
    console.log('  ✅ ValidationAnalysis schema valid');
    assert(result.overallConfidence === v.overall_confidence, 'Result overallConfidence matches validationAnalysis.overall_confidence');
    assert(result.finalRecommendation.startsWith(v.final_summary.trimEnd()), 'Result finalRecommendation starts with validationAnalysis.final_summary (may append decision line)');
    console.log('  ✅ Result consistency (confidence, final summary)');
    const approveRecs = ['strongly_approve', 'approve'];
    const cautionRecs = ['approve_with_caution'];
    const opposeRecs = ['not_recommended', 'strongly_oppose', 'blocked'];
    const expectedApproving = [b, inv].filter((a) => approveRecs.includes(a.recommendation)).length;
    const expectedCautioning = [b, inv].filter((a) => cautionRecs.includes(a.recommendation)).length;
    const expectedOpposing = [b, inv].filter((a) => opposeRecs.includes(a.recommendation)).length;
    assert(v.agent_consensus.agents_approving === expectedApproving, 'agent_consensus.agents_approving matches budgeting+investment');
    assert(v.agent_consensus.agents_cautioning === expectedCautioning, 'agent_consensus.agents_cautioning matches');
    assert(v.agent_consensus.agents_opposing === expectedOpposing, 'agent_consensus.agents_opposing matches');
    assert(v.agent_consensus.agents_approving + v.agent_consensus.agents_cautioning + v.agent_consensus.agents_opposing === 2, 'Consensus counts sum to 2 (budgeting + investment)');
    console.log('  ✅ Consensus consistent with budgeting + investment (agents work together)');
    const violationAction = { type: 'save', amount: 2500, goalId: sampleUser.goals[0]?.id ?? 'goal_emergency' };
    const violationSim = simulate_save(sampleUser, violationAction.amount, violationAction.goalId);
    const violationContext = {
        user: sampleUser,
        action: violationAction,
        simulationResult: violationSim,
        historicalMetrics: {
            monthsOfData: 4,
            avgMonthlySpending: 2500,
            spendingVariance: 0.15,
            transactionCount: 120,
            categoryBreakdown: {},
        },
    };
    const violationResult = await orchestrator.processDecision(violationContext);
    assert(violationResult.guardrailAnalysis.violated === true, 'Guardrail violated when checking would drop below min');
    assert(violationResult.guardrailAnalysis.can_proceed === false, 'Guardrail can_proceed false on violation');
    assert(violationResult.shouldProceed === false, 'shouldProceed false when guardrail blocks (orchestrator contract)');
    assert(violationResult.finalDecision === 'blocked', 'Policy finalDecision is blocked when guardrail violated');
    console.log('  ✅ Guardrail violation → shouldProceed false, finalDecision blocked (orchestrator contract)');
    let invalidContextThrew = false;
    try {
        await orchestrator.processDecision({});
    }
    catch {
        invalidContextThrew = true;
    }
    assert(invalidContextThrew, 'processDecision with invalid context throws');
    console.log('  ✅ Invalid context throws (error handling)');
    console.log('='.repeat(60));
    console.log('  All agent architecture unit tests passed.\n');
}
main().catch((e) => {
    console.error('  ❌', e instanceof Error ? e.message : e);
    process.exit(1);
});
//# sourceMappingURL=agent-architecture.test.js.map