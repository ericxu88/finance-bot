/**
 * LangChain Budgeting Agent (RAG-Enhanced)
 * 
 * Analyzes cash flow, liquidity, and budget impacts with historical context and financial knowledge
 */

import { RAGEnhancedAgent, type EnhancedAgentContext } from './rag-enhanced-base.js';
import { BudgetingAnalysisSchema } from './schemas.js';
import type { AgentContext } from './langchain-base.js';

export class LangChainBudgetingAgent extends RAGEnhancedAgent<typeof BudgetingAnalysisSchema> {
  readonly agentName = 'Budgeting Agent';
  readonly schema = BudgetingAnalysisSchema;

  constructor() {
    super(0.2); // Lower temperature for more consistent budgeting analysis
  }

  readonly systemPrompt = `You are an expert budgeting analyst specializing in personal finance.

Your role is to evaluate whether a proposed financial action fits within a user's budget and spending patterns.

You have access to:
1. User's historical spending patterns via RAG retrieval
2. Curated financial knowledge and best practices
3. Current financial state and simulation results

Use this context to make informed, personalized recommendations grounded in both the user's actual behavior and established financial principles.

CRITICAL: When relevant historical patterns or financial principles are provided, reference them specifically in your reasoning to show evidence-based analysis.

Key responsibilities:
1. Analyze cash flow and liquidity after the proposed action
2. Assess whether the action leaves sufficient buffer for unexpected expenses
3. Evaluate spending patterns and variance
4. Check budget category utilization
5. Identify potential cash flow issues

Guidelines:
- Be conservative with liquidity - people should maintain 1-2 months of expenses in checking
- Consider spending variance - high variance = need bigger buffer
- Ground recommendations in user's actual past behavior when available
- Cite financial principles when they apply
- Flag over-budget categories
- Assess data quality honestly - limited historical data reduces confidence
- Provide specific, actionable findings
- Use actual numbers from the simulation in your reasoning

Output your analysis in the specified JSON format.`;

  /**
   * Customize historical query for budgeting focus
   */
  protected buildHistoricalQuery(context: AgentContext): string {
    return `
      spending patterns ${context.action.type} ${context.action.amount}
      past similar decisions budget utilization cash flow
      ${context.action.category || ''}
    `.trim();
  }

  /**
   * Customize knowledge query for budgeting focus
   */
  protected buildKnowledgeQuery(context: AgentContext): string {
    return `
      budgeting cash flow management liquidity emergency fund
      spending variance ${context.user.preferences.liquidityPreference}
    `.trim();
  }

  protected buildAnalysisPrompt(context: AgentContext | EnhancedAgentContext): string {
    const { user, action, simulationResult, historicalMetrics } = context;
    const ragContext = (context as EnhancedAgentContext).ragContext;

    // Calculate key metrics
    const totalMonthlyExpenses =
      user.fixedExpenses.reduce((sum, e) => sum + e.amount, 0) +
      user.spendingCategories.reduce((sum, c) => sum + c.monthlyBudget, 0);

    const checkingAfter = simulationResult.scenarioIfDo.accountsAfter.checking;
    const monthsOfExpensesRemaining = checkingAfter / totalMonthlyExpenses;

    const overBudgetCategories = user.spendingCategories
      .filter(c => c.currentSpent > c.monthlyBudget)
      .map(c => c.name);

    return `
BUDGETING ANALYSIS REQUEST

USER FINANCIAL PROFILE:
- Monthly Income: ${this.formatCurrency(user.monthlyIncome)}
- Current Checking Balance: ${this.formatCurrency(user.accounts.checking)}
- Current Savings Balance: ${this.formatCurrency(user.accounts.savings)}
- Total Monthly Expenses: ${this.formatCurrency(totalMonthlyExpenses)}
  * Fixed Expenses: ${this.formatCurrency(user.fixedExpenses.reduce((sum, e) => sum + e.amount, 0))}
  * Variable Budget: ${this.formatCurrency(user.spendingCategories.reduce((sum, c) => sum + c.monthlyBudget, 0))}

HISTORICAL SPENDING PATTERNS:
- Months of Data Available: ${historicalMetrics.monthsOfData}
- Average Monthly Spending: ${this.formatCurrency(historicalMetrics.avgMonthlySpending)}
- Spending Variance (Coefficient of Variation): ${this.formatPercent(historicalMetrics.spendingVariance)}
- Total Transactions Analyzed: ${historicalMetrics.transactionCount}

CURRENT BUDGET STATUS:
${user.spendingCategories.map(c => {
      const utilization = (c.currentSpent / c.monthlyBudget) * 100;
      return `- ${c.name}: ${this.formatCurrency(c.currentSpent)} / ${this.formatCurrency(c.monthlyBudget)} (${utilization.toFixed(0)}%)`;
    }).join('\n')}
${overBudgetCategories.length > 0 ? `\n⚠️  Over-budget categories: ${overBudgetCategories.join(', ')}` : ''}

PROPOSED ACTION:
${action.type.toUpperCase()} ${this.formatCurrency(action.amount)}

${this.serializeSimulationResult(simulationResult)}

AFTER THIS ACTION:
- Checking Balance: ${this.formatCurrency(checkingAfter)}
- Months of Expenses in Checking: ${monthsOfExpensesRemaining.toFixed(2)} months

${ragContext ? `
═══════════════════════════════════════════════════════════
${ragContext.historical}
═══════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════
${ragContext.knowledge}
═══════════════════════════════════════════════════════════
` : ''}

YOUR TASK:
Analyze whether this action is prudent from a budgeting perspective. Consider:
1. Will the user have sufficient liquidity for day-to-day expenses?
2. Does the user have adequate buffer for unexpected expenses given their spending variance?
3. How does this affect budget categories?
${ragContext ? '4. What do historical patterns tell us about this decision?\n5. What financial principles apply to this situation?' : '4. Is the historical data sufficient to make a confident recommendation?'}
${ragContext ? '6' : '5'}. What are the specific risks or concerns?

${ragContext ? 'IMPORTANT: \n- Reference specific historical patterns when making recommendations\n- Cite relevant financial principles that support your analysis\n- Show evidence-based reasoning, not just rules of thumb\n' : ''}
Provide a thorough analysis with specific numbers and clear reasoning.
    `.trim();
  }
}

