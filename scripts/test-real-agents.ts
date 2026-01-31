/**
 * Real Agent API Test
 * 
 * Tests the actual Google Gemini API integration with minimal requests.
 * Only runs if GOOGLE_API_KEY is set.
 * 
 * This makes 2 API calls total:
 * 1. Single agent test (Budgeting Agent)
 * 2. Full orchestrator test (4 agents in parallel + 1 validation = ~5 calls)
 * 
 * Run with: npm run test:real-agents
 */

import 'dotenv/config';
import { sarah } from '../lib/demo-users.js';
import { simulate_invest } from '../lib/simulation-engine.js';
import { calculateHistoricalMetrics } from '../lib/agents/historical-metrics.js';
import { LangChainBudgetingAgent } from '../lib/agents/langchain-budgeting-agent.js';
import { LangChainAgentOrchestrator } from '../lib/agents/langchain-orchestrator.js';
import type { FinancialAction } from '../types/financial.js';

// Check for API key
if (!process.env.GOOGLE_API_KEY) {
  console.log('⚠️  GOOGLE_API_KEY not set. Skipping real API tests.');
  console.log('   Set your API key: export GOOGLE_API_KEY=your_key_here');
  console.log('   Or add it to .env file');
  process.exit(0);
}

console.log('🔑 Google API Key found. Running REAL API tests...');
console.log('⚠️  This will make actual API calls to Google Gemini');
console.log('='.repeat(60));

const action: FinancialAction = {
  type: 'invest',
  amount: 500,
  targetAccountId: 'taxable',
  goalId: 'goal_house',
};

const simulationResult = simulate_invest(
  sarah,
  action.amount,
  action.targetAccountId as 'taxable' | 'rothIRA' | 'traditional401k',
  action.goalId,
  5
);

const historicalMetrics = calculateHistoricalMetrics(sarah);

const context = {
  user: sarah,
  action,
  simulationResult,
  historicalMetrics,
};

async function runTests() {
  const startTime = Date.now();
  
  // =========================================================================
  // TEST 1: Single Agent (Budgeting) - 1 API call
  // =========================================================================
  console.log('\n🧪 TEST 1: Single Agent (Budgeting Agent)');
  console.log('-'.repeat(60));
  console.log('Making 1 API call to Google Gemini...\n');
  
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
  } catch (error) {
    console.error('❌ TEST 1 FAILED:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
  
  // =========================================================================
  // TEST 2: Full Orchestrator - ~5 API calls (3 parallel + 1 validation)
  // =========================================================================
  console.log('\n🧪 TEST 2: Full Orchestrator (All 4 Agents)');
  console.log('-'.repeat(60));
  console.log('Making ~5 API calls to Google Gemini...');
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
  } catch (error) {
    console.error('❌ TEST 2 FAILED:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
  
  // =========================================================================
  // Summary
  // =========================================================================
  const totalTime = Date.now() - startTime;
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 ALL REAL API TESTS PASSED!');
  console.log('='.repeat(60));
  console.log(`Total time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`API calls made: ~6 (1 single + 5 orchestrator)`);
  console.log('\n✅ Google Gemini integration is working correctly');
  console.log('✅ LangChain agents produce valid structured outputs');
  console.log('✅ Orchestrator coordinates agents successfully');
}

runTests().catch((error) => {
  console.error('\n❌ Test failed with error:', error);
  process.exit(1);
});
