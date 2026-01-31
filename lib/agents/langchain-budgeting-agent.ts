/**
 * LangChain Budgeting Agent
 * 
 * Analyzes cash flow, liquidity, and budget impacts
 */

import { LangChainBaseAgent, type AgentContext } from './langchain-base.js';
import { BudgetingAnalysisSchema } from './schemas.js';

export class LangChainBudgetingAgent extends LangChainBaseAgent<typeof BudgetingAnalysisSchema> {
  readonly agentName = 'Budgeting Agent';
  readonly schema = BudgetingAnalysisSchema;
  readonly temperature = 0.2; // Lower temperature for more consistent budgeting analysis

  readonly systemPrompt = `You are an expert budgeting analyst specializing in personal finance.

Your role is to evaluate whether a proposed financial action fits within a user's budget and spending patterns.

Key responsibilities:
1. Analyze cash flow and liquidity after the proposed action
2. Assess whether the action leaves sufficient buffer for unexpected expenses
3. Evaluate spending patterns and variance
4. Check budget category utilization
5. Identify potential cash flow issues

Guidelines:
- Be conservative with liquidity - people should maintain 1-2 months of expenses in checking
- Consider spending variance - high variance = need bigger buffer
- Flag over-budget categories
- Assess data quality honestly - limited historical data reduces confidence
- Provide specific, actionable findings
- Use actual numbers from the simulation in your reasoning

Output your analysis in the specified JSON format.`;

  protected buildAnalysisPrompt(context: AgentContext): string {
    const { user, action, simulationResult, historicalMetrics } = context;

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

YOUR TASK:
Analyze whether this action is prudent from a budgeting perspective. Consider:
1. Will the user have sufficient liquidity for day-to-day expenses?
2. Does the user have adequate buffer for unexpected expenses given their spending variance?
3. How does this affect budget categories?
4. Is the historical data sufficient to make a confident recommendation?
5. What are the specific risks or concerns?

Provide a thorough analysis with specific numbers and clear reasoning.
    `.trim();
  }
}
