/**
 * LangChain Investment Agent (RAG-Enhanced)
 * 
 * Analyzes investment decisions with live market data, economic indicators,
 * and RAG-retrieved financial knowledge (curated + FinTextQA + FRED + news).
 */

import { RAGEnhancedAgent, type EnhancedAgentContext } from './rag-enhanced-base.js';
import { InvestmentAnalysisSchema } from './schemas.js';
import type { AgentContext } from './langchain-base.js';
import { liveDataClient } from '../financial-data/live-data-client.js';
import { vectorStore } from '../rag/vector-store.js';
import { knowledgeBase } from '../rag/knowledge-base.js';

export class LangChainInvestmentAgent extends RAGEnhancedAgent<typeof InvestmentAnalysisSchema> {
  readonly agentName = 'Investment Agent';
  readonly schema = InvestmentAnalysisSchema;

  constructor() {
    super(0.3);
  }

  readonly systemPrompt = `You are an expert investment analyst specializing in personal financial planning.

Your role is to evaluate investment decisions in the context of a user's complete financial picture.

You have access to:
1. User's historical investment and saving patterns via RAG retrieval
2. Curated investment principles and best practices
3. Current financial state and simulation results

Use this context to make informed, personalized recommendations grounded in both the user's actual behavior and established investment principles.

CRITICAL: When relevant historical patterns or investment principles are provided, reference them specifically in your reasoning to show evidence-based analysis.

Key responsibilities:
1. Assess goal alignment - does this investment advance stated financial goals?
2. Evaluate time horizon vs. risk tolerance
3. Consider opportunity cost of investing vs. saving
4. Analyze diversification and portfolio composition
5. Project realistic returns and goal progress

Guidelines:
- Match investment risk to time horizon (short-term goals = lower risk)
- Consider the user's stated risk tolerance
- Ground recommendations in user's actual past investment behavior when available
- Cite investment principles when they apply
- Be realistic about return assumptions - don't promise unrealistic gains
- Acknowledge market risk and volatility
- For non-investment actions, briefly note the opportunity cost
- Use actual projected values from the simulation

Critical thinking:
- If time horizon is short (<2 years), high-risk investments may not be appropriate
- If risk tolerance is conservative but timeline is long, user might be too conservative
- Always consider what else could be done with this money

Output your analysis in the specified JSON format.`;

  /**
   * Customize historical query for investment focus
   */
  protected buildHistoricalQuery(context: AgentContext): string {
    return `
      investment decisions ${context.action.type} ${context.action.amount}
      past investing behavior goal progress risk patterns portfolio allocation
      ${context.action.targetAccountId || ''}
    `.trim();
  }

  /**
   * Customize knowledge query for investment focus
   */
  protected buildKnowledgeQuery(context: AgentContext): string {
    return `
      investment strategy time horizon risk management asset allocation
      ${context.user.preferences.riskTolerance} portfolio diversification
      ${context.action.type === 'invest' ? 'market returns compounding' : 'opportunity cost'}
    `.trim();
  }

  /**
   * Extended knowledge: curated + financial_knowledge_real (FinTextQA, FRED) + financial_news
   */
  protected override async getKnowledgeContext(context: AgentContext): Promise<string> {
    const query = this.buildKnowledgeQuery(context);
    const [curated, realDocs, newsDocs] = await Promise.all([
      knowledgeBase.search(query, 3),
      vectorStore.search('financial_knowledge_real', query, 3).catch(() => []),
      vectorStore.search('financial_news', query, 2).catch(() => []),
    ]);

    const parts: string[] = [];

    if (curated.length > 0) {
      parts.push('RELEVANT FINANCIAL PRINCIPLES:\n' + curated.map((r, i) =>
        `[${i + 1}] ${r.category}:\n${r.principle}\n(Source: ${r.source})`
      ).join('\n\n'));
    }
    if (realDocs.length > 0) {
      parts.push('RELEVANT FINANCIAL Q&A / INDICATOR CONTEXT:\n' + realDocs.map((d, i) =>
        `[${i + 1}] ${(d.metadata.source as string) || 'FinTextQA/FRED'}:\n${d.pageContent}`
      ).join('\n\n'));
    }
    if (newsDocs.length > 0) {
      parts.push('RELEVANT MARKET CONTEXT (NEWS):\n' + newsDocs.map((d, i) =>
        `[${i + 1}] ${(d.metadata.source as string) || 'News'}:\n${d.pageContent}`
      ).join('\n\n'));
    }

    if (parts.length === 0) return 'No relevant financial principles or market context found.';
    return parts.join('\n\n═══════════════════════════════════════════════════════════\n\n');
  }

  protected async buildAnalysisPrompt(context: AgentContext | EnhancedAgentContext): Promise<string> {
    const { user, action, simulationResult } = context;
    const ragContext = (context as EnhancedAgentContext).ragContext;

    // Only do deep analysis for invest actions
    if (action.type !== 'invest') {
      return this.buildNonInvestmentPrompt(context, ragContext);
    }

    // Live fetch: economic indicators and market summary (NOT embedded)
    let economicContext = '';
    let marketContext = '';
    try {
      const [indicators, market] = await Promise.all([
        liveDataClient.getEconomicIndicators(),
        liveDataClient.getMarketSummary(),
      ]);
      if (indicators?.indicators) {
        const ind = indicators.indicators;
        economicContext = `
CURRENT ECONOMIC CONDITIONS (LIVE):
${ind.inflation_rate ? `- ${ind.inflation_rate.name}: ${ind.inflation_rate.current_value.toFixed(2)} (${ind.inflation_rate.change >= 0 ? '↑' : '↓'} ${Math.abs(ind.inflation_rate.change).toFixed(2)})` : ''}
${ind.fed_funds_rate ? `- ${ind.fed_funds_rate.name}: ${ind.fed_funds_rate.current_value.toFixed(2)}%` : ''}
${ind.unemployment_rate ? `- ${ind.unemployment_rate.name}: ${ind.unemployment_rate.current_value.toFixed(2)}%` : ''}
${ind['10y_treasury'] ? `- ${ind['10y_treasury'].name}: ${ind['10y_treasury'].current_value.toFixed(2)}%` : ''}

Source: Federal Reserve Economic Data (${indicators.metadata?.fetched_at ?? 'live'})
        `.trim();
      }
      if (market?.indices && Object.keys(market.indices).length > 0) {
        marketContext = `
CURRENT MARKET CONDITIONS (LIVE):
${Object.entries(market.indices).map(([, data]) =>
          `- ${data.name}: ${data.current != null ? data.current.toFixed(2) : 'N/A'} (${data.change_percent >= 0 ? '+' : ''}${data.change_percent.toFixed(2)}%)`
        ).join('\n')}

Source: Live market data (${market.metadata?.fetched_at ?? 'live'})
        `.trim();
      }
    } catch (e) {
      console.warn('[Investment Agent] Live data fetch failed:', e);
    }

    const goal = user.goals.find(g => g.id === action.goalId);
    const goalImpact = simulationResult.scenarioIfDo.goalImpacts.find(g => g.goalId === action.goalId);

    const yearsToDeadline = goal
      ? (goal.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 365)
      : 5;

    const totalInvestments =
      user.accounts.investments.taxable +
      user.accounts.investments.rothIRA +
      user.accounts.investments.traditional401k;

    const totalAssets =
      user.accounts.checking +
      user.accounts.savings +
      totalInvestments;

    return `
INVESTMENT ANALYSIS REQUEST

${economicContext ? `${economicContext}\n\n` : ''}
${marketContext ? `${marketContext}\n\n` : ''}

USER INVESTMENT PROFILE:
- Risk Tolerance: ${user.preferences.riskTolerance}
- Current Investment Portfolio: ${this.formatCurrency(totalInvestments)}
  * Taxable Account: ${this.formatCurrency(user.accounts.investments.taxable)}
  * Roth IRA: ${this.formatCurrency(user.accounts.investments.rothIRA)}
  * 401(k): ${this.formatCurrency(user.accounts.investments.traditional401k)}
- Total Assets: ${this.formatCurrency(totalAssets)}
- Current Investment Allocation: ${this.formatPercent(totalInvestments / totalAssets)}

INVESTMENT GOAL:
${goal ? `
- Goal Name: ${goal.name}
- Target Amount: ${this.formatCurrency(goal.targetAmount)}
- Current Progress: ${this.formatCurrency(goal.currentAmount)} (${this.formatPercent(goal.currentAmount / goal.targetAmount)})
- Deadline: ${goal.deadline.toLocaleDateString()} (${yearsToDeadline.toFixed(1)} years away)
- Priority: ${goal.priority}/5
- Time Horizon: ${goal.timeHorizon}
` : 'No specific goal assigned to this investment'}

PROPOSED INVESTMENT:
- Amount: ${this.formatCurrency(action.amount)}
- Account Type: ${action.targetAccountId || 'taxable'}

PROJECTED OUTCOMES:
${goalImpact ? `
- Projected Value (5 years, 7% annual return): ${this.formatCurrency(goalImpact.futureValue || 0)}
- Goal Progress Impact: ${goalImpact.progressChangePct > 0 ? '+' : ''}${goalImpact.progressChangePct.toFixed(2)}%
- Time to Goal Impact: ${Math.abs(goalImpact.timeSaved)} months ${goalImpact.timeSaved >= 0 ? 'faster' : 'slower'}
- Current Progress: ${this.formatPercent(goal!.currentAmount / goal!.targetAmount)} → ${this.formatPercent((goal!.currentAmount + action.amount) / goal!.targetAmount)}
` : 'Goal impact not available'}

${this.serializeSimulationResult(simulationResult)}

${ragContext ? `
═══════════════════════════════════════════════════════════
${ragContext.historical}
═══════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════
${ragContext.knowledge}
═══════════════════════════════════════════════════════════
` : ''}

YOUR TASK:
Evaluate this investment decision considering:
1. Does the time horizon match the risk? (${yearsToDeadline.toFixed(1)} years to goal, risk tolerance: ${user.preferences.riskTolerance})
2. Is this investment aligned with the user's stated goal?
3. Are the return assumptions realistic?
4. What's the opportunity cost vs. keeping in savings?
5. How does this affect overall portfolio diversification?
${ragContext ? '6. What do historical investment patterns tell us?\n7. What investment principles apply to this situation?' : '6. Are there any timing concerns or better alternatives?'}

${ragContext ? 'IMPORTANT: \n- Reference specific historical patterns when making recommendations\n- Cite relevant investment principles that support your analysis\n- Show evidence-based reasoning with sources\n' : ''}
Provide specific, data-driven analysis.
    `.trim();
  }

  private buildNonInvestmentPrompt(context: AgentContext | EnhancedAgentContext, ragContext?: { historical: string; knowledge: string }): string {
    const { action, simulationResult } = context;

    return `
The user is performing a ${action.type} action of ${this.formatCurrency(action.amount)}, not an investment.

${this.serializeSimulationResult(simulationResult)}

${ragContext ? `
═══════════════════════════════════════════════════════════
${ragContext.knowledge}
═══════════════════════════════════════════════════════════
` : ''}

YOUR TASK:
Briefly note:
1. This is not an investment action
2. The opportunity cost (this money could have been invested for growth)
3. Whether there are any investment considerations the user should be aware of
${ragContext ? '4. Any relevant principles from the knowledge base' : ''}

Keep this analysis brief since investment is not the primary action.
    `.trim();
  }
}

