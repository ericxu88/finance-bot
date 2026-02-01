/**
 * Mock Agent Orchestrator
 * 
 * Uses mock agents instead of real API calls - perfect for demos without rate limits
 */

import type { AgentContext } from './langchain-base.js';
import type { OrchestrationResult } from './langchain-orchestrator.js';
import {
    generateMockBudgetingAnalysis,
    generateMockInvestmentAnalysis,
    generateMockGuardrailAnalysis,
    generateMockValidationAnalysis
} from './mock-agents.js';

export class MockAgentOrchestrator {
    async processDecision(context: AgentContext): Promise<OrchestrationResult> {
        const startTime = Date.now();

        console.log(`\n[Mock Orchestrator] Starting mock multi-agent analysis for ${context.action.type} $${context.action.amount}`);
        console.log('='.repeat(80));
        console.log('⚠️  DEMO MODE: Using mock responses (no API calls)');

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 500));

        // Phase 1: Generate mock analyses
        console.log('\n[Mock Orchestrator] Phase 1: Generating mock agent analyses...');
        const budgetingAnalysis = generateMockBudgetingAnalysis(context);
        const investmentAnalysis = generateMockInvestmentAnalysis(context);
        const guardrailAnalysis = generateMockGuardrailAnalysis(context);

        console.log('\n[Mock Orchestrator] Phase 1 complete. Agent results:');
        console.log(`  ✓ Budgeting: ${budgetingAnalysis.recommendation} (confidence: ${(budgetingAnalysis.confidence * 100).toFixed(0)}%)`);
        console.log(`  ✓ Investment: ${investmentAnalysis.recommendation} (confidence: ${(investmentAnalysis.confidence * 100).toFixed(0)}%)`);
        console.log(`  ✓ Guardrail: ${guardrailAnalysis.can_proceed ? 'PASS ✓' : 'BLOCKED ✗'} (violations: ${guardrailAnalysis.violated})`);

        // Phase 2: Generate validation analysis
        console.log('\n[Mock Orchestrator] Phase 2: Generating validation analysis...');
        const validationAnalysis = generateMockValidationAnalysis(
            context,
            budgetingAnalysis,
            investmentAnalysis,
            guardrailAnalysis
        );

        console.log(`\n[Mock Orchestrator] Phase 2 complete.`);
        console.log(`  ✓ Final recommendation: ${validationAnalysis.overall_recommendation}`);
        console.log(`  ✓ Confidence: ${validationAnalysis.overall_confidence}`);
        console.log(`  ✓ Consensus: ${validationAnalysis.agent_consensus.consensus_level}`);

        // Phase 3: Synthesize final recommendation
        const finalRecommendation = validationAnalysis.final_summary;
        const shouldProceed = guardrailAnalysis.can_proceed &&
            (validationAnalysis.overall_recommendation === 'proceed_confidently' ||
                validationAnalysis.overall_recommendation === 'proceed');

        const executionTime = Date.now() - startTime;
        console.log(`\n[Mock Orchestrator] ✅ Complete in ${(executionTime / 1000).toFixed(2)}s`);
        console.log(`[Mock Orchestrator] Final decision: ${shouldProceed ? '✅ PROCEED' : '🛑 DO NOT PROCEED'}`);
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
    }
}
