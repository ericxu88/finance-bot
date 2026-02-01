/**
 * Unified Agent
 * 
 * Combines all agent logic into a SINGLE LLM call for speed.
 * Tradeoff: Less specialized reasoning, but 4x faster.
 */

import { ChatOpenAI } from '@langchain/openai';
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

  // Spending insights - NEW
  spending_insights: z.object({
    overspending_categories: z.array(z.string()).describe('Categories where user is over 70% of budget or overspent'),
    opportunities_to_save: z.string().nullable().describe('Specific suggestion to reduce spending, referencing transaction data'),
    estimated_monthly_savings: z.number().nullable().describe('Estimated monthly savings if user follows the suggestion'),
  }),

  // Final recommendation
  recommendation: z.enum(['proceed', 'proceed_with_caution', 'reconsider', 'do_not_proceed']),
  confidence: z.enum(['high', 'medium', 'low']),
  explanation: z.string().describe('Detailed explanation with specific references to spending data, transactions, or budget usage'),
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
  private model: ChatOpenAI;
  private parser: StructuredOutputParser<typeof UnifiedAnalysisSchema>;

  constructor() {
    const apiKey = process.env.OPEN_AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY (or OPEN_AI_API_KEY) required. Get one at https://platform.openai.com/api-keys');
    }

    const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    
    this.model = new ChatOpenAI({
      model: modelName,
      temperature: 0.3,
      apiKey,
      maxTokens: 2048,
      maxRetries: 1,
    });
    
    this.parser = StructuredOutputParser.fromZodSchema(UnifiedAnalysisSchema);
  }

  async analyze(context: UnifiedAgentContext): Promise<UnifiedAnalysis> {
    const startTime = Date.now();
    console.log(`[UnifiedAgent] Starting analysis...`);

    const { user, action, simulationResult } = context;
    const scenario = simulationResult.scenarioIfDo;

    // Helper to safely get investment balance
    const getInvestmentBalance = (account: number | { balance: number }): number => {
      return typeof account === 'number' ? account : account.balance;
    };

    // Build spending summary with transaction details
    const spendingSummary = user.spendingCategories.map(cat => {
      const percentUsed = cat.monthlyBudget > 0 ? (cat.currentSpent / cat.monthlyBudget * 100) : 0;
      const status = percentUsed > 90 ? '🔴' : percentUsed > 70 ? '🟡' : '🟢';
      const recentTxns = (cat.transactions || [])
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);

      return `${status} ${cat.name}: $${cat.currentSpent.toFixed(0)}/$${cat.monthlyBudget} (${percentUsed.toFixed(0)}% used)` +
        (recentTxns.length > 0
          ? `\n   Recent: ${recentTxns.map(t => `${t.description} $${Math.abs(t.amount).toFixed(0)}`).join(', ')}`
          : '');
    }).join('\n');

    // Build goals summary
    const goalsSummary = user.goals.map(g => {
      const progress = (g.currentAmount / g.targetAmount * 100).toFixed(0);
      const remaining = g.targetAmount - g.currentAmount;
      return `• ${g.name}: $${g.currentAmount.toLocaleString()}/$${g.targetAmount.toLocaleString()} (${progress}% complete, $${remaining.toLocaleString()} to go)`;
    }).join('\n');

    // Calculate monthly surplus
    const fixedExpensesTotal = user.fixedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const budgetTotal = user.spendingCategories.reduce((sum, cat) => sum + cat.monthlyBudget, 0);
    const monthlySurplus = user.monthlyIncome - fixedExpensesTotal - budgetTotal;

    const prompt = PromptTemplate.fromTemplate(`You are a financial advisor AI. Analyze this financial decision comprehensively with ALL available user context.

💰 ACCOUNTS:
- Monthly income: $${user.monthlyIncome}
- Checking: $${user.accounts.checking}
- Savings: $${user.accounts.savings}
- Investments: $${typeof user.accounts.investments === 'object' && user.accounts.investments?.taxable ? getInvestmentBalance(user.accounts.investments.taxable) : 0} (taxable)
- Monthly surplus: $${monthlySurplus.toFixed(0)} (after fixed expenses + budgets)

💳 SPENDING ANALYSIS (this month):
${spendingSummary}

📊 FIXED EXPENSES (monthly):
${user.fixedExpenses.map(e => `- ${e.name}: $${e.amount}`).join('\n')}

🎯 FINANCIAL GOALS:
${goalsSummary}

⚙️ PREFERENCES:
- Risk tolerance: ${user.preferences.riskTolerance}
- Liquidity preference: ${user.preferences.liquidityPreference}

🔍 PROPOSED ACTION:
- Type: ${action.type}
- Amount: $${action.amount}
${action.goalId ? `- For goal: ${user.goals.find(g => g.id === action.goalId)?.name}` : ''}

📈 SIMULATION RESULTS:
- Checking after: $${scenario.accountsAfter.checking}
- Savings after: $${scenario.accountsAfter.savings}
- Goal impacts: ${scenario.goalImpacts.map(g => `${g.goalName}: +${g.progressChangePct}%`).join(', ')}

🛡️ GUARDRAILS:
${user.preferences.guardrails.map(g => `- ${g.rule}`).join('\n')}

INSTRUCTIONS:
Analyze this decision using ALL context above. Look for:
1. Budget impact: Is any category overspent? Can they afford this?
2. Spending patterns: Are there categories where spending could be reduced?
3. Goal alignment: Does this help or hurt their financial goals?
4. Evidence-based advice: Reference specific transactions/spending when making recommendations
5. Alternative suggestions: If you see overspending in one area, suggest reallocating that money

Be specific and reference actual data (transactions, budget percentages, goal progress).

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
    const { user, action, simulationResult } = context;
    const scenario = simulationResult.scenarioIfDo;

    const checkingLow = scenario.accountsAfter.checking < 1000;
    const isInvest = action.type === 'invest';

    // Find overspending categories
    const overspendingCategories = user.spendingCategories
      .filter(cat => cat.monthlyBudget > 0 && (cat.currentSpent / cat.monthlyBudget) > 0.7)
      .map(cat => cat.name);

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
      spending_insights: {
        overspending_categories: overspendingCategories,
        opportunities_to_save: overspendingCategories.length > 0
          ? `You're spending heavily on ${overspendingCategories[0]}. Consider reducing by $50/month.`
          : null,
        estimated_monthly_savings: overspendingCategories.length > 0 ? 50 : null,
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
