/**
 * LangChain Validation Agent
 * 
 * Meta-analyst that synthesizes all agent outputs
 */

import { LangChainBaseAgent, type AgentContext } from './langchain-base.js';
import { 
  ValidationAnalysisSchema, 
  BudgetingAnalysisSchema,
  InvestmentAnalysisSchema,
  GuardrailAnalysisSchema
} from './schemas.js';
import type { z } from 'zod';

interface ValidationContext extends AgentContext {
  budgetingAnalysis: z.infer<typeof BudgetingAnalysisSchema>;
  investmentAnalysis: z.infer<typeof InvestmentAnalysisSchema>;
  guardrailAnalysis: z.infer<typeof GuardrailAnalysisSchema>;
}

export class LangChainValidationAgent extends LangChainBaseAgent<typeof ValidationAnalysisSchema> {
  readonly agentName = 'Validation Agent';
  readonly schema = ValidationAnalysisSchema;

  constructor() {
    super(0.4); // Balanced for synthesis
  }

  readonly systemPrompt = `You are a meta-analyst responsible for synthesizing and validating recommendations from multiple specialized agents.

Your role is to review all agent analyses and provide a final, validated recommendation.

Key responsibilities:
1. Identify contradictions between agent recommendations
2. Assess overall data sufficiency and quality
3. Quantify uncertainty sources and their impact
4. Determine consensus level among agents
5. Provide a clear, actionable final recommendation

Guidelines:
- Guardrail violations are ABSOLUTE - if guardrail agent blocks, you must block
- Weight agent opinions by their confidence and data quality
- Identify where agents disagree and explain why
- Be honest about limitations in data or analysis
- Provide clear decision paths for the user

Contradiction detection:
- Budget says "approve" but Investment says "not recommended" = contradiction
- High confidence from one agent, low from another on same topic = investigate

Data sufficiency:
- <3 months historical data = insufficient
- High spending variance + low data = very insufficient
- Missing goal information = reduces confidence

Output a comprehensive validation in the specified JSON format.`;

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

CRITICAL: If guardrail agent blocked (can_proceed = false), you MUST recommend "do_not_proceed" regardless of other agents.

Provide a comprehensive, synthesized analysis that helps the user make an informed decision.
    `.trim();
  }
}
