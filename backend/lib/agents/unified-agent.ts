/**
 * Unified Agent
 * 
 * Combines all agent logic into a SINGLE LLM call for speed.
 * Tradeoff: Less specialized reasoning, but 4x faster.
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { z } from 'zod';
import type { UserProfile, FinancialAction, SimulationResult } from '../../types/financial.js';
import type { HistoricalMetrics } from './historical-metrics.js';

// Combined output schema
const UnifiedAnalysisSchema = z.object({
  // Budgeting analysis
  budget_assessment: z.object({
    can_afford: z.boolean(),
    monthly_impact: z.string(),
    key_concern: z.string().nullable(),
  }),
  
  // Investment analysis
  investment_assessment: z.object({
    appropriate_for_goal: z.boolean(),
    projected_growth: z.string(),
    risk_alignment: z.string(),
  }),
  
  // Guardrail check
  guardrail_assessment: z.object({
    passes_all: z.boolean(),
    violations: z.array(z.string()),
  }),
  
  // Final recommendation
  recommendation: z.enum(['proceed', 'proceed_with_caution', 'reconsider', 'do_not_proceed']),
  confidence: z.enum(['high', 'medium', 'low']),
  explanation: z.string(),
  suggested_alternative: z.string().nullable(),
});

export type UnifiedAnalysis = z.infer<typeof UnifiedAnalysisSchema>;

export interface UnifiedAgentContext {
  user: UserProfile;
  action: FinancialAction;
  simulationResult: SimulationResult;
  historicalMetrics: HistoricalMetrics;
}

export class UnifiedAgent {
  private model: ChatGoogleGenerativeAI;
  private parser: StructuredOutputParser<typeof UnifiedAnalysisSchema>;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY required');
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';
    
    this.model = new ChatGoogleGenerativeAI({
      model: modelName,
      temperature: 0.3,
      apiKey,
      maxOutputTokens: 2048,
    });
    
    this.parser = StructuredOutputParser.fromZodSchema(UnifiedAnalysisSchema);
  }

  async analyze(context: UnifiedAgentContext): Promise<UnifiedAnalysis> {
    const startTime = Date.now();
    console.log(`[UnifiedAgent] Starting analysis...`);

    const { user, action, simulationResult } = context;
    const scenario = simulationResult.scenarioIfDo;
    
    const prompt = PromptTemplate.fromTemplate(`You are a financial advisor AI. Analyze this financial decision in ONE response.

USER PROFILE:
- Monthly income: $${user.monthlyIncome}
- Checking: $${user.accounts.checking}
- Savings: $${user.accounts.savings}
- Risk tolerance: ${user.preferences.riskTolerance}
- Liquidity preference: ${user.preferences.liquidityPreference}

PROPOSED ACTION:
- Type: ${action.type}
- Amount: $${action.amount}
${action.goalId ? `- For goal: ${user.goals.find(g => g.id === action.goalId)?.name}` : ''}

SIMULATION RESULTS:
- Checking after: $${scenario.accountsAfter.checking}
- Savings after: $${scenario.accountsAfter.savings}
- Goal impacts: ${scenario.goalImpacts.map(g => `${g.goalName}: +${g.progressChangePct}%`).join(', ')}

GUARDRAILS TO CHECK:
${user.preferences.guardrails.map(g => `- ${g.rule}`).join('\n')}

Analyze this from budgeting, investment, and guardrail perspectives. Be concise.

{format_instructions}

Return ONLY the JSON object.`);

    const chain = RunnableSequence.from([prompt, this.model]);
    
    try {
      const response = await chain.invoke({
        format_instructions: this.parser.getFormatInstructions(),
      });

      const rawText = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);
      
      // Strip markdown if present
      const cleanedText = rawText.replace(/```(?:json)?\n?([\s\S]*?)\n?```/, '$1').trim();
      
      const result = await this.parser.parse(cleanedText);
      
      console.log(`[UnifiedAgent] Complete in ${Date.now() - startTime}ms`);
      return result;
      
    } catch (error) {
      console.error('[UnifiedAgent] Error:', error);
      throw error;
    }
  }
}

/**
 * Mock Unified Agent for testing
 */
export class MockUnifiedAgent {
  async analyze(context: UnifiedAgentContext): Promise<UnifiedAnalysis> {
    const { action, simulationResult } = context;
    const scenario = simulationResult.scenarioIfDo;
    
    const checkingLow = scenario.accountsAfter.checking < 1000;
    const isInvest = action.type === 'invest';
    
    return {
      budget_assessment: {
        can_afford: !checkingLow,
        monthly_impact: `$${action.amount} ${action.type} reduces available funds`,
        key_concern: checkingLow ? 'Checking balance would drop below $1000' : null,
      },
      investment_assessment: {
        appropriate_for_goal: isInvest,
        projected_growth: isInvest ? '+41.8% over 5 years' : 'N/A - not an investment',
        risk_alignment: 'Aligns with moderate risk tolerance',
      },
      guardrail_assessment: {
        passes_all: !checkingLow,
        violations: checkingLow ? ['Minimum checking balance violated'] : [],
      },
      recommendation: checkingLow ? 'do_not_proceed' : isInvest ? 'proceed' : 'proceed_with_caution',
      confidence: checkingLow ? 'high' : 'medium',
      explanation: checkingLow
        ? 'This action would violate your minimum checking balance guardrail.'
        : `This ${action.type} action is reasonable given your financial situation.`,
      suggested_alternative: checkingLow
        ? `Consider a smaller amount like $${Math.floor(action.amount / 2)}`
        : null,
    };
  }
}
