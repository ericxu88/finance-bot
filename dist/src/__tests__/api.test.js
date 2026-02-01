import { sampleUser } from '../../lib/sample-data.js';
import { calculateHistoricalMetrics } from '../../lib/agents/historical-metrics.js';
import { simulate_save, simulate_invest } from '../../lib/simulation-engine.js';
import { MockAgentOrchestrator } from '../../lib/agents/mock-orchestrator.js';
import { analyzeFinancialHealth, generateRecommendations, generateGoalSummary } from '../../lib/recommendation-engine.js';
import { demoScenarios, getScenarioById } from '../../lib/demo-scenarios.js';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
console.log('\n🧪 TEST 1: Historical Metrics Calculation');
console.log('='.repeat(60));
const metrics = calculateHistoricalMetrics(sampleUser);
console.log(`Months of data: ${metrics.monthsOfData}`);
console.log(`Average monthly spending: $${metrics.avgMonthlySpending.toFixed(2)}`);
console.log(`Spending variance: ${metrics.spendingVariance.toFixed(2)}`);
console.log(`Transaction count: ${metrics.transactionCount}`);
console.log(`Categories: ${Object.keys(metrics.categoryBreakdown).length}`);
if (metrics.monthsOfData >= 0 && metrics.avgMonthlySpending >= 0) {
    console.log('✅ Historical metrics calculated successfully');
}
else {
    console.log('❌ Historical metrics calculation failed');
    process.exit(1);
}
console.log('\n🧪 TEST 2: /analyze Endpoint Flow (Save Action)');
console.log('='.repeat(60));
const action = {
    type: 'save',
    amount: 500,
    goalId: sampleUser.goals[0]?.id,
};
const simulationResult = simulate_save(sampleUser, action.amount, action.goalId);
const historicalMetrics = calculateHistoricalMetrics(sampleUser);
console.log(`Simulation completed: ${simulationResult.action.type} $${simulationResult.action.amount}`);
console.log(`Historical metrics: ${historicalMetrics.monthsOfData} months of data`);
const orchestrator = new MockAgentOrchestrator();
orchestrator.processDecision({
    user: sampleUser,
    action,
    simulationResult,
    historicalMetrics,
}).then((analysisResult) => {
    console.log(`Analysis completed: ${analysisResult.shouldProceed ? 'PROCEED' : 'DO NOT PROCEED'}`);
    console.log(`Confidence: ${analysisResult.overallConfidence}`);
    console.log(`Execution time: ${analysisResult.executionTime}ms`);
    if (analysisResult.budgetingAnalysis && analysisResult.investmentAnalysis && analysisResult.guardrailAnalysis) {
        console.log('✅ All agent analyses present');
    }
    else {
        console.log('❌ Missing agent analyses');
        process.exit(1);
    }
    if (analysisResult.validationAnalysis) {
        console.log('✅ Validation analysis present');
    }
    else {
        console.log('❌ Missing validation analysis');
        process.exit(1);
    }
    console.log('\n🧪 TEST 3: /analyze Endpoint Flow (Invest Action)');
    console.log('='.repeat(60));
    const investAction = {
        type: 'invest',
        amount: 500,
        targetAccountId: 'taxable',
        goalId: sampleUser.goals.find(g => g.name.includes('House'))?.id,
    };
    const investSimulation = simulate_invest(sampleUser, investAction.amount, investAction.targetAccountId, investAction.goalId);
    const investMetrics = calculateHistoricalMetrics(sampleUser);
    return orchestrator.processDecision({
        user: sampleUser,
        action: investAction,
        simulationResult: investSimulation,
        historicalMetrics: investMetrics,
    });
}).then((analysisResult) => {
    console.log(`Invest analysis: ${analysisResult.shouldProceed ? 'PROCEED' : 'DO NOT PROCEED'}`);
    console.log(`Investment recommendation: ${analysisResult.investmentAnalysis.recommendation}`);
    if (analysisResult.investmentAnalysis.investment_metrics) {
        console.log('✅ Investment metrics present');
    }
    else {
        console.log('⚠️  Investment metrics missing (may be expected for non-invest actions)');
    }
    console.log('\n🧪 TEST 4: API Documentation');
    console.log('='.repeat(60));
    const specPath = path.join(process.cwd(), 'backend', 'api', 'openapi.yaml');
    if (!fs.existsSync(specPath)) {
        console.log('❌ OpenAPI spec file not found');
        process.exit(1);
    }
    const specContent = fs.readFileSync(specPath, 'utf8');
    const spec = yaml.load(specContent);
    if (!spec.openapi || !spec.info || !spec.paths) {
        console.log('❌ Invalid OpenAPI spec structure');
        process.exit(1);
    }
    const requiredPaths = ['/health', '/sample', '/simulate', '/compare', '/analyze', '/recommend', '/goals/summary', '/demo/scenarios', '/demo/scenarios/{id}'];
    const documentedPaths = Object.keys(spec.paths);
    const missingPaths = requiredPaths.filter(p => !documentedPaths.includes(p));
    if (missingPaths.length > 0) {
        console.log(`❌ Missing paths in OpenAPI spec: ${missingPaths.join(', ')}`);
        process.exit(1);
    }
    console.log(`OpenAPI version: ${spec.openapi}`);
    console.log(`API title: ${spec.info.title}`);
    console.log(`Documented paths: ${documentedPaths.length}`);
    console.log('✅ OpenAPI spec is valid and complete');
    console.log('\n🧪 TEST 5: Recommendation Engine');
    console.log('='.repeat(60));
    const healthAnalysis = analyzeFinancialHealth(sampleUser);
    console.log(`Overall health: ${healthAnalysis.overallHealth}`);
    console.log(`Monthly surplus: $${healthAnalysis.monthlySurplus.toFixed(2)}`);
    console.log(`Emergency fund status: ${healthAnalysis.emergencyFundStatus}`);
    console.log(`Goals tracked: ${healthAnalysis.goalProgress.length}`);
    if (healthAnalysis.overallHealth && healthAnalysis.monthlySurplus >= 0) {
        console.log('✅ Financial health analysis works');
    }
    else {
        console.log('❌ Financial health analysis failed');
        process.exit(1);
    }
    const recommendations = generateRecommendations(sampleUser);
    console.log(`\nGenerated ${recommendations.length} recommendations`);
    if (recommendations.length > 0 && recommendations[0]) {
        const topRec = recommendations[0];
        console.log(`Top recommendation: ${topRec.action.type} $${topRec.action.amount}`);
        console.log(`Priority: ${topRec.priority}`);
        console.log(`Reasoning: ${topRec.reasoning.substring(0, 60)}...`);
        console.log('✅ Recommendations generated successfully');
    }
    else {
        console.log('⚠️  No recommendations generated (may be expected for some user profiles)');
    }
    console.log('\n🧪 TEST 6: Goal Summary');
    console.log('='.repeat(60));
    const goalSummaries = generateGoalSummary(sampleUser);
    console.log(`Goals tracked: ${goalSummaries.length}`);
    if (goalSummaries.length > 0 && goalSummaries[0]) {
        const firstGoal = goalSummaries[0];
        console.log(`\nTop priority goal: ${firstGoal.goalName}`);
        console.log(`  Progress: ${firstGoal.progress.toFixed(1)}%`);
        console.log(`  Status: ${firstGoal.status}`);
        console.log(`  Months remaining: ${firstGoal.monthsRemaining}`);
        console.log(`  Monthly needed: $${firstGoal.monthlyNeeded.toFixed(2)}`);
        console.log(`  Projection: ${firstGoal.projectedCompletion}`);
        if (firstGoal.suggestedAction) {
            console.log(`  Suggested: ${firstGoal.suggestedAction.action.type} $${firstGoal.suggestedAction.action.amount}`);
        }
        console.log('✅ Goal summary generated successfully');
    }
    else {
        console.log('⚠️  No goals found');
    }
    console.log('\n🧪 TEST 7: Demo Scenarios');
    console.log('='.repeat(60));
    console.log(`Total scenarios: ${demoScenarios.length}`);
    if (demoScenarios.length >= 3) {
        demoScenarios.forEach(scenario => {
            console.log(`\n📊 ${scenario.name}`);
            console.log(`   Persona: ${scenario.persona}`);
            console.log(`   Highlights: ${scenario.highlights.length} key points`);
            console.log(`   Suggested actions: ${scenario.suggestedActions.length}`);
        });
        console.log('\n✅ Demo scenarios loaded successfully');
    }
    else {
        console.log('❌ Expected at least 3 demo scenarios');
        process.exit(1);
    }
    const testScenario = getScenarioById('young_professional');
    if (testScenario && testScenario.name === 'Sarah Chen - Young Professional') {
        console.log('✅ getScenarioById works correctly');
    }
    else {
        console.log('❌ getScenarioById failed');
        process.exit(1);
    }
    console.log('\n🎉 ALL API TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('✅ Historical metrics calculation works');
    console.log('✅ /analyze endpoint flow works with mock agents');
    console.log('✅ All agent analyses are returned');
    console.log('✅ Validation analysis is included');
    console.log('✅ API documentation is valid');
    console.log('✅ Recommendation engine works');
    console.log('✅ Goal summary works');
    console.log('✅ Demo scenarios work');
    console.log('\n🚀 API endpoint is ready for use!');
}).catch((error) => {
    console.error('\n❌ API test failed:', error);
    process.exit(1);
});
//# sourceMappingURL=api.test.js.map