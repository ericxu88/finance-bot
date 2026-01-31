/**
 * LangChain Multi-Agent Demo
 * 
 * Demonstrates the full multi-agent system with real LLM calls
 */

import { LangChainAgentOrchestrator } from './agents/langchain-orchestrator.js';
import { sarah } from './demo-users.js';
import { simulate_invest } from './simulation-engine.js';
import type { FinancialAction } from '../types/financial.js';

async function main() {
  console.log('🤖 LangChain Multi-Agent Financial Analysis Demo');
  console.log('================================================\n');

  // Check for API key
  if (!process.env.GOOGLE_API_KEY) {
    console.error('❌ Error: GOOGLE_API_KEY environment variable not set');
    console.error('Get a free API key at: https://aistudio.google.com/apikey');
    console.error('Then set it with: export GOOGLE_API_KEY=your_key_here');
    process.exit(1);
  }

  // Define action: Invest $500 in taxable account for house goal
  const action: FinancialAction = {
    type: 'invest',
    amount: 500,
    targetAccountId: 'taxable',
    goalId: sarah.goals.find(g => g.name.includes('House'))?.id || sarah.goals[1]?.id
  };

  console.log(`📊 Analyzing action for ${sarah.name}:`);
  console.log(`   Action: INVEST $${action.amount}`);
  console.log(`   Account: ${action.targetAccountId}`);
  console.log(`   Goal: ${sarah.goals.find(g => g.id === action.goalId)?.name || 'Unknown'}\n`);

  // Run simulation
  console.log('🔬 Running financial simulation...\n');
  const simulationResult = simulate_invest(
    sarah,
    action.amount,
    action.targetAccountId as 'taxable' | 'rothIRA' | 'traditional401k',
    action.goalId
  );

  // Calculate historical metrics
  const transactions = sarah.spendingCategories.flatMap(c => c.transactions);
  const now = Date.now();
  const transactionDates = transactions.map(t => t.date.getTime());
  const oldestTransaction = Math.min(...transactionDates);
  const monthsOfData = (now - oldestTransaction) / (1000 * 60 * 60 * 24 * 30);

  const monthlySpending = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0) / monthsOfData;

  const categoryBreakdown: Record<string, number> = {};
  transactions.forEach(t => {
    categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + Math.abs(t.amount);
  });

  const historicalMetrics = {
    monthsOfData: Math.max(1, Math.floor(monthsOfData)),
    avgMonthlySpending: monthlySpending,
    spendingVariance: 0.15, // Simplified variance calculation
    transactionCount: transactions.length,
    categoryBreakdown
  };

  // Run multi-agent analysis
  console.log('🚀 Launching LangChain multi-agent system...\n');
  
  const orchestrator = new LangChainAgentOrchestrator();
  const result = await orchestrator.processDecision({
    user: sarah,
    action,
    simulationResult,
    historicalMetrics
  });

  // Display results
  console.log('\n\n');
  console.log('═'.repeat(80));
  console.log('                         ANALYSIS RESULTS');
  console.log('═'.repeat(80));

  console.log('\n📋 BUDGETING AGENT:');
  console.log('─'.repeat(80));
  console.log(`Recommendation: ${result.budgetingAnalysis.recommendation}`);
  console.log(`Confidence: ${(result.budgetingAnalysis.confidence * 100).toFixed(0)}%`);
  console.log(`Data Quality: ${result.budgetingAnalysis.data_quality}`);
  console.log('\nKey Findings:');
  result.budgetingAnalysis.key_findings.forEach(f => console.log(`  • ${f}`));
  if (result.budgetingAnalysis.concerns.length > 0) {
    console.log('\nConcerns:');
    result.budgetingAnalysis.concerns.forEach(c => console.log(`  ⚠️  ${c}`));
  }
  console.log('\nMetrics:');
  console.log(`  • Months of expenses remaining: ${result.budgetingAnalysis.budgeting_metrics.months_of_expenses_remaining.toFixed(2)}`);
  console.log(`  • Budget utilization: ${result.budgetingAnalysis.budgeting_metrics.budget_utilization_pct.toFixed(0)}%`);

  console.log('\n\n📈 INVESTMENT AGENT:');
  console.log('─'.repeat(80));
  console.log(`Recommendation: ${result.investmentAnalysis.recommendation}`);
  console.log(`Confidence: ${(result.investmentAnalysis.confidence * 100).toFixed(0)}%`);
  console.log(`Data Quality: ${result.investmentAnalysis.data_quality}`);
  console.log('\nKey Findings:');
  result.investmentAnalysis.key_findings.forEach(f => console.log(`  • ${f}`));
  if (result.investmentAnalysis.investment_metrics) {
    console.log('\nMetrics:');
    if (result.investmentAnalysis.investment_metrics.projected_value_5yr) {
      console.log(`  • Projected 5yr value: $${result.investmentAnalysis.investment_metrics.projected_value_5yr.toFixed(0)}`);
    }
    if (result.investmentAnalysis.investment_metrics.risk_assessment) {
      console.log(`  • Risk: ${result.investmentAnalysis.investment_metrics.risk_assessment}`);
    }
  }

  console.log('\n\n🛡️  GUARDRAIL AGENT:');
  console.log('─'.repeat(80));
  console.log(`Violated: ${result.guardrailAnalysis.violated ? '❌ YES' : '✅ NO'}`);
  console.log(`Can Proceed: ${result.guardrailAnalysis.can_proceed ? '✅ YES' : '❌ NO'}`);
  if (result.guardrailAnalysis.violations.length > 0) {
    console.log('\nViolations:');
    result.guardrailAnalysis.violations.forEach(v => {
      console.log(`  • ${v.rule_description}`);
      console.log(`    Severity: ${v.severity}`);
      console.log(`    ${v.violation_details}`);
    });
  }
  if (result.guardrailAnalysis.warnings.length > 0) {
    console.log('\nWarnings:');
    result.guardrailAnalysis.warnings.forEach(w => console.log(`  ⚠️  ${w}`));
  }

  console.log('\n\n✅ VALIDATION AGENT (META-ANALYSIS):');
  console.log('─'.repeat(80));
  console.log(`Overall Recommendation: ${result.validationAnalysis.overall_recommendation}`);
  console.log(`Confidence: ${result.validationAnalysis.overall_confidence}`);
  console.log(`Consensus: ${result.validationAnalysis.agent_consensus.consensus_level}`);
  console.log(`\nAgent Votes:`);
  console.log(`  • Approving: ${result.validationAnalysis.agent_consensus.agents_approving}`);
  console.log(`  • Cautioning: ${result.validationAnalysis.agent_consensus.agents_cautioning}`);
  console.log(`  • Opposing: ${result.validationAnalysis.agent_consensus.agents_opposing}`);

  if (result.validationAnalysis.contradictions_found.length > 0) {
    console.log('\n⚠️  Contradictions Found:');
    result.validationAnalysis.contradictions_found.forEach(c => {
      console.log(`  • ${c.agent_a} vs ${c.agent_b}: ${c.description} (${c.severity})`);
    });
  }

  console.log('\n\n🎯 FINAL RECOMMENDATION:');
  console.log('═'.repeat(80));
  console.log(result.finalRecommendation);
  console.log('');
  console.log(`Decision: ${result.shouldProceed ? '✅ PROCEED' : '🛑 DO NOT PROCEED'}`);
  console.log(`Execution Time: ${(result.executionTime / 1000).toFixed(2)}s`);
  console.log('═'.repeat(80));

  console.log('\n\n💡 Decision Tree:');
  console.log(`If Proceed: ${result.validationAnalysis.decision_tree.if_proceed}`);
  console.log(`If Don't Proceed: ${result.validationAnalysis.decision_tree.if_do_not_proceed}`);
  console.log(`Recommended Path: ${result.validationAnalysis.decision_tree.recommended_path}`);

  console.log('\n\n✨ Demo complete! This demonstrates:');
  console.log('  ✓ LangChain multi-agent orchestration');
  console.log('  ✓ Structured outputs with Zod schemas');
  console.log('  ✓ Parallel agent execution');
  console.log('  ✓ Meta-validation and contradiction detection');
  console.log('  ✓ Sophisticated prompt engineering');
  console.log('  ✓ Production-grade error handling\n');
}

main().catch(error => {
  console.error('\n❌ Demo failed:', error);
  process.exit(1);
});
