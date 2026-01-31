/**
 * LangChain Validation Agent (RAG-Enhanced)
 * 
 * Meta-analyst that synthesizes all agent outputs with historical context
 */

import { RAGEnhancedAgent, type EnhancedAgentContext } from './rag-enhanced-base.js';
import { 
  ValidationAnalysisSchema, 
  BudgetingAnalysisSchema,
  InvestmentAnalysisSchema,
  GuardrailAnalysisSchema
} from './schemas.js';
import type { z } from 'zod';
import type { AgentContext } from './langchain-base.js';

interface ValidationContext extends AgentContext {
  budgetingAnalysis: z.infer<typeof BudgetingAnalysisSchema>;
  investmentAnalysis: z.infer<typeof InvestmentAnalysisSchema>;
  guardrailAnalysis: z.infer<typeof GuardrailAnalysisSchema>;
}

export class LangChainValidationAgent extends RAGEnhancedAgent<typeof ValidationAnalysisSchema> {
  readonly agentName = 'Validation Agent';
  readonly schema = ValidationAnalysisSchema;

  constructor() {
    super(0.4); // Balanced for synthesis
  }

  readonly systemPrompt = `You are a meta-analyst responsible for CONSISTENCY and RISK FLAGS — you are NOT the final decision maker.

Your role is to:
1. Check CONSISTENCY between agent recommendations (do Budgeting and Investment contradict?)
2. Detect CONTRADICTIONS (e.g. one approves, one strongly_opposes)
3. Surface RISK FLAGS (liquidity, data insufficiency, variance)
4. Provide a clear SYNTHESIS summary and decision paths
5. Reference historical patterns and established principles when available

You do NOT have authority to veto. The final decision is computed from domain agents + guardrail by the orchestrator:
- Guardrail blocked → hard stop (blocked)
- Any domain agent strongly_oppose/blocked → do_not_proceed
- Any approve_with_caution → proceed_with_caution
- Both approve/strongly_approve → proceed

Guidelines:
- If guardrail can_proceed = true, do NOT state that the guardrail blocks the action
- "Approve with caution" from all domain agents should NOT be described as "do not proceed" — describe risks and that the user CAN proceed with caution
- Weight agent opinions by confidence and data quality
- Be honest about limitations; suggest safer alternatives (e.g. "try a smaller amount") when relevant
- When RAG context is available, cite specific historical patterns or principles that inform your analysis
- consensus_level: use "unanimous" only when both domain agents are in {approve, approve_with_caution, strongly_approve}; use "divided" when one approves and one opposes

Output a comprehensive validation in the specified JSON format.`;

  /**
   * Customize historical query for validation focus
   */
  protected buildHistoricalQuery(context: AgentContext): string {
    return `
      past agent recommendations decision outcomes similar actions
      ${context.action.type} ${context.action.amount} results patterns
    `.trim();
  }

  /**
   * Customize knowledge query for validation focus
   */
  protected buildKnowledgeQuery(context: AgentContext): string {
    return `
      financial decision making validation risk assessment
      decision frameworks ${context.user.preferences.riskTolerance}
    `.trim();
  }

  async analyzeWithAgentOutputs(
    context: AgentContext,
    agentAnalyses: Omit<ValidationContext, keyof AgentContext>
  ): Promise<z.infer<typeof ValidationAnalysisSchema>> {
    // Use the base analyze method but with extended context
    return this.analyze({
      ...context,
      ...agentAnalyses
    } as any);
  }

  protected buildAnalysisPrompt(context: any): string {
    const {
      action,
      historicalMetrics,
      budgetingAnalysis,
      investmentAnalysis,
      guardrailAnalysis
    } = context as ValidationContext;

    const ragContext = (context as EnhancedAgentContext).ragContext;

    return `
META-VALIDATION REQUEST

You are reviewing analyses from 3 specialized agents for the following action:
ACTION: ${action.type.toUpperCase()} ${this.formatCurrency(action.amount)}

═══════════════════════════════════════════════════════════
BUDGETING AGENT ANALYSIS
═══════════════════════════════════════════════════════════
Recommendation: ${budgetingAnalysis.recommendation}
Confidence: ${this.formatPercent(budgetingAnalysis.confidence)}
Data Quality: ${budgetingAnalysis.data_quality}

Key Findings:
${budgetingAnalysis.key_findings.map(f => `• ${f}`).join('\n')}

Concerns:
${budgetingAnalysis.concerns.length > 0 ? budgetingAnalysis.concerns.map(c => `• ${c}`).join('\n') : 'None'}

Reasoning:
${budgetingAnalysis.reasoning}

Metrics:
- Months of expenses remaining: ${budgetingAnalysis.budgeting_metrics.months_of_expenses_remaining.toFixed(2)}
- Monthly expense average: ${this.formatCurrency(budgetingAnalysis.budgeting_metrics.monthly_expense_average)}
- Historical data: ${budgetingAnalysis.budgeting_metrics.months_of_historical_data} months
- Spending variance: ${this.formatPercent(budgetingAnalysis.budgeting_metrics.spending_variance_coefficient)}

═══════════════════════════════════════════════════════════
INVESTMENT AGENT ANALYSIS
═══════════════════════════════════════════════════════════
Recommendation: ${investmentAnalysis.recommendation}
Confidence: ${this.formatPercent(investmentAnalysis.confidence)}
Data Quality: ${investmentAnalysis.data_quality}

Key Findings:
${investmentAnalysis.key_findings.map(f => `• ${f}`).join('\n')}

Concerns:
${investmentAnalysis.concerns.length > 0 ? investmentAnalysis.concerns.map(c => `• ${c}`).join('\n') : 'None'}

Reasoning:
${investmentAnalysis.reasoning}

${investmentAnalysis.investment_metrics ? `
Metrics:
- Projected 5yr value: ${this.formatCurrency(investmentAnalysis.investment_metrics.projected_value_5yr ?? 0)}
- Time to goal impact: ${investmentAnalysis.investment_metrics.time_to_goal_impact_months ?? 0} months
- Risk assessment: ${investmentAnalysis.investment_metrics.risk_assessment ?? 'N/A'}
- Goal alignment: ${investmentAnalysis.investment_metrics.goal_alignment_score != null ? this.formatPercent(investmentAnalysis.investment_metrics.goal_alignment_score) : 'N/A'}
` : ''}

═══════════════════════════════════════════════════════════
GUARDRAIL AGENT ANALYSIS
═══════════════════════════════════════════════════════════
Violated: ${guardrailAnalysis.violated}
Can Proceed: ${guardrailAnalysis.can_proceed}

${guardrailAnalysis.violations.length > 0 ? `
VIOLATIONS DETECTED:
${guardrailAnalysis.violations.map(v => `
- ${v.rule_description}
  Severity: ${v.severity}
  Details: ${v.violation_details}
  Current: ${v.current_value} | Threshold: ${v.threshold_value}
  ${v.suggested_adjustment ? `Suggestion: ${v.suggested_adjustment}` : ''}
`).join('\n')}
` : 'No violations detected.'}

${guardrailAnalysis.warnings.length > 0 ? `
WARNINGS:
${guardrailAnalysis.warnings.map(w => `• ${w}`).join('\n')}
` : ''}

Compliance Summary:
${guardrailAnalysis.compliance_summary}

═══════════════════════════════════════════════════════════
HISTORICAL DATA CONTEXT
═══════════════════════════════════════════════════════════
- Months of data: ${historicalMetrics.monthsOfData}
- Transaction count: ${historicalMetrics.transactionCount}
- Average monthly spending: ${this.formatCurrency(historicalMetrics.avgMonthlySpending)}
- Spending variance: ${this.formatPercent(historicalMetrics.spendingVariance)}

${ragContext ? `
═══════════════════════════════════════════════════════════
${ragContext.historical}
═══════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════
${ragContext.knowledge}
═══════════════════════════════════════════════════════════
` : ''}

═══════════════════════════════════════════════════════════
YOUR VALIDATION TASK
═══════════════════════════════════════════════════════════

1. IDENTIFY CONTRADICTIONS:
   - Do any agents fundamentally disagree?
   - Are there conflicts in recommendations despite similar confidence?
   - Which contradictions are major vs. minor?

2. ASSESS DATA SUFFICIENCY:
   - Is ${historicalMetrics.monthsOfData} months of data enough?
   - Is spending variance of ${this.formatPercent(historicalMetrics.spendingVariance)} concerning?
   - What critical data is missing?
   - Overall data quality score (0-1)?

3. EVALUATE UNCERTAINTY:
   - What are the main sources of uncertainty?
   - How do they impact the recommendation?
   - Can uncertainty be mitigated?

4. DETERMINE CONSENSUS:
   - How many agents approve vs. caution vs. oppose?
   - Is there unanimous agreement or division?
   - What's the consensus level?

5. FINAL RECOMMENDATION:
   - Given ALL agent inputs, what should the user do?
   - What happens if they proceed?
   - What happens if they don't?
   - What's the recommended path?

${ragContext ? `6. REFERENCE CONTEXT:
   - Cite specific historical patterns that inform this validation
   - Reference relevant financial principles from the knowledge base
   - Show how evidence supports or contradicts agent recommendations
` : ''}

IMPORTANT:
- Your overall_recommendation is for display only; the orchestrator computes the actual decision from domain agents + guardrail
- When guardrail can_proceed = true and both domain agents recommend approve or approve_with_caution, use overall_recommendation "proceed_with_caution" or "proceed"
- Do NOT say "do_not_proceed" when no agent said oppose
- Describe risks and that the user can proceed with caution when appropriate
- When RAG context is provided, cite specific patterns and principles in your reasoning

Provide a comprehensive, synthesized analysis that helps the user make an informed decision.
    `.trim();
  }
}
