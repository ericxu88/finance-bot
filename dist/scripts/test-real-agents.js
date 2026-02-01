import 'dotenv/config';
import { sarah } from '../lib/demo-users.js';
import { simulate_invest } from '../lib/simulation-engine.js';
import { calculateHistoricalMetrics } from '../lib/agents/historical-metrics.js';
import { LangChainBudgetingAgent } from '../lib/agents/langchain-budgeting-agent.js';
import { LangChainAgentOrchestrator } from '../lib/agents/langchain-orchestrator.js';
const openAiKey = process.env.OPEN_AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
if (!openAiKey) {
    console.log('⚠️  OPENAI_API_KEY not set. Skipping real API tests.');
    console.log('   Set your API key: export OPENAI_API_KEY=your_key_here');
    console.log('   Or add it to .env file');
    process.exit(0);
}
console.log('🔑 OpenAI API Key found. Running REAL API tests...');
console.log('⚠️  This will make actual API calls to OpenAI');
console.log('='.repeat(60));
const action = {
    type: 'invest',
    amount: 500,
    targetAccountId: 'taxable',
    goalId: 'goal_house',
};
const simulationResult = simulate_invest(sarah, action.amount, action.targetAccountId, action.goalId, 5);
const historicalMetrics = calculateHistoricalMetrics(sarah);
const context = {
    user: sarah,
    action,
    simulationResult,
    historicalMetrics,
};
async function runTests() {
    const startTime = Date.now();
    console.log('\n🧪 TEST 1: Single Agent (Budgeting Agent)');
    console.log('-'.repeat(60));
    console.log('Making 1 API call to OpenAI...\n');
    try {
        const budgetingAgent = new LangChainBudgetingAgent();
        const budgetingResult = await budgetingAgent.analyze(context);
        console.log('✅ Budgeting Agent Response:');
        console.log(`   Recommendation: ${budgetingResult.recommendation}`);
        console.log(`   Confidence: ${(budgetingResult.confidence * 100).toFixed(0)}%`);
        console.log(`   Key findings: ${budgetingResult.key_findings.length} items`);
        if (budgetingResult.key_findings.length > 0) {
            console.log(`   First finding: "${budgetingResult.key_findings[0]}"`);
        }
        console.log('\n✅ TEST 1 PASSED: Single agent works with real API');
    }
    catch (error) {
        console.error('❌ TEST 1 FAILED:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
    console.log('\n🧪 TEST 2: Full Orchestrator (All 4 Agents)');
    console.log('-'.repeat(60));
    console.log('Making ~5 API calls to OpenAI...');
    console.log('(3 agents in parallel, then 1 validation agent)\n');
    try {
        const orchestrator = new LangChainAgentOrchestrator();
        const result = await orchestrator.processDecision(context);
        console.log('\n✅ Orchestrator Response:');
        console.log(`   Should Proceed: ${result.shouldProceed ? '✅ YES' : '🛑 NO'}`);
        console.log(`   Overall Confidence: ${result.overallConfidence}`);
        console.log(`   Execution Time: ${result.executionTime}ms`);
        console.log('\n   Agent Results:');
        console.log(`   - Budgeting: ${result.budgetingAnalysis.recommendation} (${(result.budgetingAnalysis.confidence * 100).toFixed(0)}%)`);
        console.log(`   - Investment: ${result.investmentAnalysis.recommendation} (${(result.investmentAnalysis.confidence * 100).toFixed(0)}%)`);
        console.log(`   - Guardrail: ${result.guardrailAnalysis.can_proceed ? 'PASS' : 'BLOCKED'}`);
        console.log(`   - Validation: ${result.validationAnalysis.overall_recommendation}`);
        console.log('\n✅ TEST 2 PASSED: Full orchestrator works with real API');
    }
    catch (error) {
        console.error('❌ TEST 2 FAILED:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
    const totalTime = Date.now() - startTime;
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL REAL API TESTS PASSED!');
    console.log('='.repeat(60));
    console.log(`Total time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`API calls made: ~6 (1 single + 5 orchestrator)`);
    console.log('\n✅ OpenAI integration is working correctly');
    console.log('✅ LangChain agents produce valid structured outputs');
    console.log('✅ Orchestrator coordinates agents successfully');
}
runTests().catch((error) => {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
});
//# sourceMappingURL=test-real-agents.js.map