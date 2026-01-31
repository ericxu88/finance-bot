/**
 * Real API Endpoint Test
 * 
 * Tests the /analyze endpoint with real Google Gemini API calls.
 * Requires GOOGLE_API_KEY to be set.
 * 
 * Run with: npm run test:api-real
 */

import 'dotenv/config';

// Check for API key first
if (!process.env.GOOGLE_API_KEY) {
  console.log('⚠️  GOOGLE_API_KEY not set. Skipping real API endpoint tests.');
  console.log('   Set your API key in .env file');
  process.exit(0);
}

// Ensure we're NOT using mock agents
process.env.USE_MOCK_AGENTS = 'false';

import { sampleUser } from '../lib/sample-data.js';

console.log('🔑 Google API Key found. Testing /analyze endpoint with REAL agents...');
console.log('⚠️  This will make actual API calls to Google Gemini');
console.log('='.repeat(60));

async function runTest() {
  const testAction = {
    type: 'invest' as const,
    amount: 500,
    targetAccountId: 'taxable' as const,
    goalId: 'goal_house',
  };

  console.log('\n🧪 TEST: /analyze endpoint with real agents');
  console.log('-'.repeat(60));
  console.log(`Action: ${testAction.type} $${testAction.amount}`);
  console.log('Starting server and making request...\n');

  // Import and start server
  const { simulate_invest } = await import('../lib/simulation-engine.js');
  const { calculateHistoricalMetrics } = await import('../lib/agents/historical-metrics.js');
  const { LangChainAgentOrchestrator } = await import('../lib/agents/langchain-orchestrator.js');
  
  const startTime = Date.now();

  // Run the same logic as /analyze endpoint
  const simulationResult = simulate_invest(
    sampleUser,
    testAction.amount,
    testAction.targetAccountId,
    testAction.goalId,
    5
  );

  console.log('✓ Simulation completed');

  const historicalMetrics = calculateHistoricalMetrics(sampleUser);
  console.log('✓ Historical metrics calculated');

  console.log('⏳ Running LangChain agent orchestrator (this takes ~30-40s)...\n');

  const orchestrator = new LangChainAgentOrchestrator();
  const analysisResult = await orchestrator.processDecision({
    user: sampleUser,
    action: testAction,
    simulationResult,
    historicalMetrics,
  });

  const elapsed = Date.now() - startTime;

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTS');
  console.log('='.repeat(60));

  // Validate response structure
  const checks = [
    { name: 'budgetingAnalysis', pass: !!analysisResult.budgetingAnalysis },
    { name: 'investmentAnalysis', pass: !!analysisResult.investmentAnalysis },
    { name: 'guardrailAnalysis', pass: !!analysisResult.guardrailAnalysis },
    { name: 'validationAnalysis', pass: !!analysisResult.validationAnalysis },
    { name: 'finalRecommendation', pass: !!analysisResult.finalRecommendation },
    { name: 'overallConfidence', pass: !!analysisResult.overallConfidence },
    { name: 'shouldProceed (boolean)', pass: typeof analysisResult.shouldProceed === 'boolean' },
    { name: 'executionTime', pass: analysisResult.executionTime > 0 },
  ];

  let allPassed = true;
  checks.forEach(check => {
    const icon = check.pass ? '✅' : '❌';
    console.log(`${icon} ${check.name}`);
    if (!check.pass) allPassed = false;
  });

  console.log('\n📋 Summary:');
  console.log(`   Decision: ${analysisResult.shouldProceed ? '✅ PROCEED' : '🛑 DO NOT PROCEED'}`);
  console.log(`   Confidence: ${analysisResult.overallConfidence}`);
  console.log(`   Execution time: ${(elapsed / 1000).toFixed(2)}s`);

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('🎉 ALL CHECKS PASSED!');
    console.log('✅ /analyze endpoint works correctly with real agents');
  } else {
    console.log('❌ SOME CHECKS FAILED');
    process.exit(1);
  }
}

runTest().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
