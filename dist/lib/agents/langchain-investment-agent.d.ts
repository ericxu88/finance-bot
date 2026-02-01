import { LangChainBaseAgent, type AgentContext } from './langchain-base.js';
import { InvestmentAnalysisSchema } from './schemas.js';
export declare class LangChainInvestmentAgent extends LangChainBaseAgent<typeof InvestmentAnalysisSchema> {
    readonly agentName = "Investment Agent";
    readonly schema: import("zod").ZodObject<{
        recommendation: import("zod").ZodEnum<["strongly_approve", "approve", "approve_with_caution", "not_recommended", "strongly_oppose", "blocked"]>;
        confidence: import("zod").ZodNumber;
        reasoning: import("zod").ZodString;
        key_findings: import("zod").ZodArray<import("zod").ZodString, "many">;
        concerns: import("zod").ZodArray<import("zod").ZodString, "many">;
        data_quality: import("zod").ZodEnum<["high", "medium", "low"]>;
        alternative_suggestions: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
    } & {
        investment_metrics: import("zod").ZodObject<{
            projected_value_5yr: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodNumber>>;
            annualized_return_assumption: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodNumber>>;
            time_to_goal_impact_months: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodNumber>>;
            risk_assessment: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodEnum<["low", "medium", "high", "very_high"]>>>;
            goal_alignment_score: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodNumber>>;
            diversification_impact: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        }, "strip", import("zod").ZodTypeAny, {
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
    }, "strip", import("zod").ZodTypeAny, {
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
    constructor();
    readonly systemPrompt = "You are an expert investment analyst specializing in personal financial planning.\n\nYour role is to evaluate investment decisions in the context of a user's complete financial picture.\n\nKey responsibilities:\n1. Assess goal alignment - does this investment advance stated financial goals?\n2. Evaluate time horizon vs. risk tolerance\n3. Consider opportunity cost of investing vs. saving\n4. Analyze diversification and portfolio composition\n5. Project realistic returns and goal progress\n\nGuidelines:\n- Match investment risk to time horizon (short-term goals = lower risk)\n- Consider the user's stated risk tolerance\n- Be realistic about return assumptions - don't promise unrealistic gains\n- Acknowledge market risk and volatility\n- For non-investment actions, briefly note the opportunity cost\n- Use actual projected values from the simulation\n\nCritical thinking:\n- If time horizon is short (<2 years), high-risk investments may not be appropriate\n- If risk tolerance is conservative but timeline is long, user might be too conservative\n- Always consider what else could be done with this money\n\nOutput your analysis in the specified JSON format.";
    protected buildAnalysisPrompt(context: AgentContext): string;
    private buildNonInvestmentPrompt;
}
//# sourceMappingURL=langchain-investment-agent.d.ts.map