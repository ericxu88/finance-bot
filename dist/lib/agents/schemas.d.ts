import { z } from 'zod';
export declare const AgentAnalysisSchema: z.ZodObject<{
    recommendation: z.ZodEnum<["strongly_approve", "approve", "approve_with_caution", "not_recommended", "strongly_oppose", "blocked"]>;
    confidence: z.ZodNumber;
    reasoning: z.ZodString;
    key_findings: z.ZodArray<z.ZodString, "many">;
    concerns: z.ZodArray<z.ZodString, "many">;
    data_quality: z.ZodEnum<["high", "medium", "low"]>;
    alternative_suggestions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    reasoning: string;
    recommendation: "strongly_approve" | "approve" | "approve_with_caution" | "not_recommended" | "strongly_oppose" | "blocked";
    confidence: number;
    key_findings: string[];
    concerns: string[];
    data_quality: "medium" | "high" | "low";
    alternative_suggestions?: string[] | undefined;
}, {
    reasoning: string;
    recommendation: "strongly_approve" | "approve" | "approve_with_caution" | "not_recommended" | "strongly_oppose" | "blocked";
    confidence: number;
    key_findings: string[];
    concerns: string[];
    data_quality: "medium" | "high" | "low";
    alternative_suggestions?: string[] | undefined;
}>;
export type AgentAnalysis = z.infer<typeof AgentAnalysisSchema>;
export declare const BudgetingAnalysisSchema: z.ZodObject<{
    recommendation: z.ZodEnum<["strongly_approve", "approve", "approve_with_caution", "not_recommended", "strongly_oppose", "blocked"]>;
    confidence: z.ZodNumber;
    reasoning: z.ZodString;
    key_findings: z.ZodArray<z.ZodString, "many">;
    concerns: z.ZodArray<z.ZodString, "many">;
    data_quality: z.ZodEnum<["high", "medium", "low"]>;
    alternative_suggestions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
} & {
    budgeting_metrics: z.ZodObject<{
        months_of_expenses_remaining: z.ZodNumber;
        monthly_expense_average: z.ZodNumber;
        spending_variance_coefficient: z.ZodNumber;
        months_of_historical_data: z.ZodNumber;
        over_budget_categories: z.ZodArray<z.ZodString, "many">;
        budget_utilization_pct: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        months_of_expenses_remaining: number;
        monthly_expense_average: number;
        spending_variance_coefficient: number;
        months_of_historical_data: number;
        over_budget_categories: string[];
        budget_utilization_pct: number;
    }, {
        months_of_expenses_remaining: number;
        monthly_expense_average: number;
        spending_variance_coefficient: number;
        months_of_historical_data: number;
        over_budget_categories: string[];
        budget_utilization_pct: number;
    }>;
}, "strip", z.ZodTypeAny, {
    reasoning: string;
    recommendation: "strongly_approve" | "approve" | "approve_with_caution" | "not_recommended" | "strongly_oppose" | "blocked";
    confidence: number;
    key_findings: string[];
    concerns: string[];
    data_quality: "medium" | "high" | "low";
    budgeting_metrics: {
        months_of_expenses_remaining: number;
        monthly_expense_average: number;
        spending_variance_coefficient: number;
        months_of_historical_data: number;
        over_budget_categories: string[];
        budget_utilization_pct: number;
    };
    alternative_suggestions?: string[] | undefined;
}, {
    reasoning: string;
    recommendation: "strongly_approve" | "approve" | "approve_with_caution" | "not_recommended" | "strongly_oppose" | "blocked";
    confidence: number;
    key_findings: string[];
    concerns: string[];
    data_quality: "medium" | "high" | "low";
    budgeting_metrics: {
        months_of_expenses_remaining: number;
        monthly_expense_average: number;
        spending_variance_coefficient: number;
        months_of_historical_data: number;
        over_budget_categories: string[];
        budget_utilization_pct: number;
    };
    alternative_suggestions?: string[] | undefined;
}>;
export declare const InvestmentAnalysisSchema: z.ZodObject<{
    recommendation: z.ZodEnum<["strongly_approve", "approve", "approve_with_caution", "not_recommended", "strongly_oppose", "blocked"]>;
    confidence: z.ZodNumber;
    reasoning: z.ZodString;
    key_findings: z.ZodArray<z.ZodString, "many">;
    concerns: z.ZodArray<z.ZodString, "many">;
    data_quality: z.ZodEnum<["high", "medium", "low"]>;
    alternative_suggestions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
} & {
    investment_metrics: z.ZodObject<{
        projected_value_5yr: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        annualized_return_assumption: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        time_to_goal_impact_months: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        risk_assessment: z.ZodOptional<z.ZodNullable<z.ZodEnum<["low", "medium", "high", "very_high"]>>>;
        goal_alignment_score: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        diversification_impact: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        projected_value_5yr?: number | null | undefined;
        annualized_return_assumption?: number | null | undefined;
        time_to_goal_impact_months?: number | null | undefined;
        risk_assessment?: "medium" | "high" | "low" | "very_high" | null | undefined;
        goal_alignment_score?: number | null | undefined;
        diversification_impact?: string | null | undefined;
    }, {
        projected_value_5yr?: number | null | undefined;
        annualized_return_assumption?: number | null | undefined;
        time_to_goal_impact_months?: number | null | undefined;
        risk_assessment?: "medium" | "high" | "low" | "very_high" | null | undefined;
        goal_alignment_score?: number | null | undefined;
        diversification_impact?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    reasoning: string;
    recommendation: "strongly_approve" | "approve" | "approve_with_caution" | "not_recommended" | "strongly_oppose" | "blocked";
    confidence: number;
    key_findings: string[];
    concerns: string[];
    data_quality: "medium" | "high" | "low";
    investment_metrics: {
        projected_value_5yr?: number | null | undefined;
        annualized_return_assumption?: number | null | undefined;
        time_to_goal_impact_months?: number | null | undefined;
        risk_assessment?: "medium" | "high" | "low" | "very_high" | null | undefined;
        goal_alignment_score?: number | null | undefined;
        diversification_impact?: string | null | undefined;
    };
    alternative_suggestions?: string[] | undefined;
}, {
    reasoning: string;
    recommendation: "strongly_approve" | "approve" | "approve_with_caution" | "not_recommended" | "strongly_oppose" | "blocked";
    confidence: number;
    key_findings: string[];
    concerns: string[];
    data_quality: "medium" | "high" | "low";
    investment_metrics: {
        projected_value_5yr?: number | null | undefined;
        annualized_return_assumption?: number | null | undefined;
        time_to_goal_impact_months?: number | null | undefined;
        risk_assessment?: "medium" | "high" | "low" | "very_high" | null | undefined;
        goal_alignment_score?: number | null | undefined;
        diversification_impact?: string | null | undefined;
    };
    alternative_suggestions?: string[] | undefined;
}>;
export declare const GuardrailAnalysisSchema: z.ZodObject<{
    violated: z.ZodBoolean;
    can_proceed: z.ZodBoolean;
    violations: z.ZodArray<z.ZodObject<{
        rule_description: z.ZodString;
        severity: z.ZodEnum<["critical", "high", "medium", "low"]>;
        violation_details: z.ZodString;
        current_value: z.ZodUnion<[z.ZodNumber, z.ZodString, z.ZodNull]>;
        threshold_value: z.ZodUnion<[z.ZodNumber, z.ZodString, z.ZodNull]>;
        suggested_adjustment: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        rule_description: string;
        severity: "medium" | "high" | "low" | "critical";
        violation_details: string;
        current_value: string | number | null;
        threshold_value: string | number | null;
        suggested_adjustment?: string | null | undefined;
    }, {
        rule_description: string;
        severity: "medium" | "high" | "low" | "critical";
        violation_details: string;
        current_value: string | number | null;
        threshold_value: string | number | null;
        suggested_adjustment?: string | null | undefined;
    }>, "many">;
    warnings: z.ZodArray<z.ZodString, "many">;
    compliance_summary: z.ZodString;
}, "strip", z.ZodTypeAny, {
    warnings: string[];
    violated: boolean;
    can_proceed: boolean;
    violations: {
        rule_description: string;
        severity: "medium" | "high" | "low" | "critical";
        violation_details: string;
        current_value: string | number | null;
        threshold_value: string | number | null;
        suggested_adjustment?: string | null | undefined;
    }[];
    compliance_summary: string;
}, {
    warnings: string[];
    violated: boolean;
    can_proceed: boolean;
    violations: {
        rule_description: string;
        severity: "medium" | "high" | "low" | "critical";
        violation_details: string;
        current_value: string | number | null;
        threshold_value: string | number | null;
        suggested_adjustment?: string | null | undefined;
    }[];
    compliance_summary: string;
}>;
export declare const ValidationAnalysisSchema: z.ZodObject<{
    overall_recommendation: z.ZodEnum<["proceed_confidently", "proceed", "proceed_with_caution", "reconsider", "do_not_proceed"]>;
    overall_confidence: z.ZodEnum<["high", "medium", "low", "very_low"]>;
    contradictions_found: z.ZodArray<z.ZodObject<{
        agent_a: z.ZodString;
        agent_b: z.ZodString;
        description: z.ZodString;
        severity: z.ZodEnum<["major", "minor"]>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        severity: "major" | "minor";
        agent_a: string;
        agent_b: string;
    }, {
        description: string;
        severity: "major" | "minor";
        agent_a: string;
        agent_b: string;
    }>, "many">;
    uncertainty_sources: z.ZodArray<z.ZodObject<{
        source: z.ZodString;
        impact: z.ZodEnum<["high", "medium", "low"]>;
        mitigation: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        source: string;
        impact: "medium" | "high" | "low";
        mitigation?: string | null | undefined;
    }, {
        source: string;
        impact: "medium" | "high" | "low";
        mitigation?: string | null | undefined;
    }>, "many">;
    data_sufficiency: z.ZodObject<{
        sufficient: z.ZodBoolean;
        missing_data_types: z.ZodArray<z.ZodString, "many">;
        data_quality_score: z.ZodNumber;
        recommendation: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        recommendation: string;
        sufficient: boolean;
        missing_data_types: string[];
        data_quality_score: number;
    }, {
        recommendation: string;
        sufficient: boolean;
        missing_data_types: string[];
        data_quality_score: number;
    }>;
    agent_consensus: z.ZodObject<{
        agents_approving: z.ZodNumber;
        agents_cautioning: z.ZodNumber;
        agents_opposing: z.ZodNumber;
        consensus_level: z.ZodEnum<["unanimous", "strong", "moderate", "weak", "divided"]>;
    }, "strip", z.ZodTypeAny, {
        agents_approving: number;
        agents_cautioning: number;
        agents_opposing: number;
        consensus_level: "moderate" | "unanimous" | "strong" | "weak" | "divided";
    }, {
        agents_approving: number;
        agents_cautioning: number;
        agents_opposing: number;
        consensus_level: "moderate" | "unanimous" | "strong" | "weak" | "divided";
    }>;
    final_summary: z.ZodString;
    decision_tree: z.ZodObject<{
        if_proceed: z.ZodString;
        if_do_not_proceed: z.ZodString;
        recommended_path: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        if_proceed: string;
        if_do_not_proceed: string;
        recommended_path: string;
    }, {
        if_proceed: string;
        if_do_not_proceed: string;
        recommended_path: string;
    }>;
}, "strip", z.ZodTypeAny, {
    overall_recommendation: "proceed_confidently" | "proceed" | "proceed_with_caution" | "reconsider" | "do_not_proceed";
    overall_confidence: "medium" | "high" | "low" | "very_low";
    contradictions_found: {
        description: string;
        severity: "major" | "minor";
        agent_a: string;
        agent_b: string;
    }[];
    uncertainty_sources: {
        source: string;
        impact: "medium" | "high" | "low";
        mitigation?: string | null | undefined;
    }[];
    data_sufficiency: {
        recommendation: string;
        sufficient: boolean;
        missing_data_types: string[];
        data_quality_score: number;
    };
    agent_consensus: {
        agents_approving: number;
        agents_cautioning: number;
        agents_opposing: number;
        consensus_level: "moderate" | "unanimous" | "strong" | "weak" | "divided";
    };
    final_summary: string;
    decision_tree: {
        if_proceed: string;
        if_do_not_proceed: string;
        recommended_path: string;
    };
}, {
    overall_recommendation: "proceed_confidently" | "proceed" | "proceed_with_caution" | "reconsider" | "do_not_proceed";
    overall_confidence: "medium" | "high" | "low" | "very_low";
    contradictions_found: {
        description: string;
        severity: "major" | "minor";
        agent_a: string;
        agent_b: string;
    }[];
    uncertainty_sources: {
        source: string;
        impact: "medium" | "high" | "low";
        mitigation?: string | null | undefined;
    }[];
    data_sufficiency: {
        recommendation: string;
        sufficient: boolean;
        missing_data_types: string[];
        data_quality_score: number;
    };
    agent_consensus: {
        agents_approving: number;
        agents_cautioning: number;
        agents_opposing: number;
        consensus_level: "moderate" | "unanimous" | "strong" | "weak" | "divided";
    };
    final_summary: string;
    decision_tree: {
        if_proceed: string;
        if_do_not_proceed: string;
        recommended_path: string;
    };
}>;
//# sourceMappingURL=schemas.d.ts.map