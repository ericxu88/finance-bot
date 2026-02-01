import { z } from 'zod';
export const AgentAnalysisSchema = z.object({
    recommendation: z.enum([
        'strongly_approve',
        'approve',
        'approve_with_caution',
        'not_recommended',
        'strongly_oppose',
        'blocked'
    ]).describe('The agent recommendation level'),
    confidence: z.number()
        .min(0)
        .max(1)
        .describe('Confidence score between 0 and 1'),
    reasoning: z.string()
        .min(50)
        .describe('Detailed explanation of the recommendation with specific evidence'),
    key_findings: z.array(z.string())
        .min(1)
        .max(5)
        .describe('3-5 bullet points of most important findings'),
    concerns: z.array(z.string())
        .describe('Specific concerns, warnings, or risks identified'),
    data_quality: z.enum(['high', 'medium', 'low'])
        .describe('Assessment of the quality/sufficiency of data used'),
    alternative_suggestions: z.array(z.string())
        .optional()
        .describe('Alternative actions the user might consider')
});
export const BudgetingAnalysisSchema = AgentAnalysisSchema.extend({
    budgeting_metrics: z.object({
        months_of_expenses_remaining: z.number()
            .describe('How many months of expenses remain in checking after action'),
        monthly_expense_average: z.number()
            .describe('Average monthly expenses based on historical data'),
        spending_variance_coefficient: z.number()
            .describe('Coefficient of variation in spending (0-1)'),
        months_of_historical_data: z.number()
            .describe('Number of months of transaction history available'),
        over_budget_categories: z.array(z.string())
            .describe('Categories currently over budget'),
        budget_utilization_pct: z.number()
            .describe('Overall budget utilization percentage')
    })
});
export const InvestmentAnalysisSchema = AgentAnalysisSchema.extend({
    investment_metrics: z.object({
        projected_value_5yr: z.number()
            .nullable()
            .optional()
            .describe('Projected investment value in 5 years'),
        annualized_return_assumption: z.number()
            .nullable()
            .optional()
            .describe('Assumed annual return rate used'),
        time_to_goal_impact_months: z.number()
            .nullable()
            .optional()
            .describe('Impact on time to reach goal (negative = faster, positive = slower)'),
        risk_assessment: z.enum(['low', 'medium', 'high', 'very_high'])
            .nullable()
            .optional()
            .describe('Risk level assessment for this investment'),
        goal_alignment_score: z.number()
            .min(0)
            .max(1)
            .nullable()
            .optional()
            .describe('How well this investment aligns with stated goal (0-1)'),
        diversification_impact: z.string()
            .nullable()
            .optional()
            .describe('How this affects portfolio diversification')
    })
});
export const GuardrailAnalysisSchema = z.object({
    violated: z.boolean()
        .describe('Whether any guardrails were violated'),
    can_proceed: z.boolean()
        .describe('Whether the action can proceed despite any issues'),
    violations: z.array(z.object({
        rule_description: z.string()
            .describe('Human-readable description of the rule'),
        severity: z.enum(['critical', 'high', 'medium', 'low'])
            .describe('Severity level of the violation'),
        violation_details: z.string()
            .describe('Specific details about what was violated'),
        current_value: z.union([z.number(), z.string(), z.null()])
            .describe('Current value that triggered violation'),
        threshold_value: z.union([z.number(), z.string(), z.null()])
            .describe('The threshold that was crossed'),
        suggested_adjustment: z.string()
            .nullable()
            .optional()
            .describe('Suggestion for how to modify action to comply')
    })),
    warnings: z.array(z.string())
        .describe('Non-blocking warnings about approaching limits'),
    compliance_summary: z.string()
        .describe('Overall summary of guardrail compliance')
});
export const ValidationAnalysisSchema = z.object({
    overall_recommendation: z.enum([
        'proceed_confidently',
        'proceed',
        'proceed_with_caution',
        'reconsider',
        'do_not_proceed'
    ]).describe('Final meta-recommendation after reviewing all agents'),
    overall_confidence: z.enum(['high', 'medium', 'low', 'very_low'])
        .describe('Overall confidence in the collective recommendation'),
    contradictions_found: z.array(z.object({
        agent_a: z.string(),
        agent_b: z.string(),
        description: z.string(),
        severity: z.enum(['major', 'minor'])
    })).describe('Contradictions between agent recommendations'),
    uncertainty_sources: z.array(z.object({
        source: z.string(),
        impact: z.enum(['high', 'medium', 'low']),
        mitigation: z.string().nullable().optional()
    })).describe('Sources of uncertainty in the analysis'),
    data_sufficiency: z.object({
        sufficient: z.boolean(),
        missing_data_types: z.array(z.string()),
        data_quality_score: z.number().min(0).max(1),
        recommendation: z.string()
    }).describe('Assessment of whether we have enough data'),
    agent_consensus: z.object({
        agents_approving: z.number(),
        agents_cautioning: z.number(),
        agents_opposing: z.number(),
        consensus_level: z.enum(['unanimous', 'strong', 'moderate', 'weak', 'divided'])
    }).describe('Level of agreement between agents'),
    final_summary: z.string()
        .min(100)
        .describe('Comprehensive summary synthesizing all agent inputs'),
    decision_tree: z.object({
        if_proceed: z.string(),
        if_do_not_proceed: z.string(),
        recommended_path: z.string()
    }).describe('Clear decision paths for the user')
});
//# sourceMappingURL=schemas.js.map