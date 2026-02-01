import { LangChainBaseAgent, type AgentContext } from './langchain-base.js';
import { BudgetingAnalysisSchema } from './schemas.js';
export declare class LangChainBudgetingAgent extends LangChainBaseAgent<typeof BudgetingAnalysisSchema> {
    readonly agentName = "Budgeting Agent";
    readonly schema: import("zod").ZodObject<{
        recommendation: import("zod").ZodEnum<["strongly_approve", "approve", "approve_with_caution", "not_recommended", "strongly_oppose", "blocked"]>;
        confidence: import("zod").ZodNumber;
        reasoning: import("zod").ZodString;
        key_findings: import("zod").ZodArray<import("zod").ZodString, "many">;
        concerns: import("zod").ZodArray<import("zod").ZodString, "many">;
        data_quality: import("zod").ZodEnum<["high", "medium", "low"]>;
        alternative_suggestions: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
    } & {
        budgeting_metrics: import("zod").ZodObject<{
            months_of_expenses_remaining: import("zod").ZodNumber;
            monthly_expense_average: import("zod").ZodNumber;
            spending_variance_coefficient: import("zod").ZodNumber;
            months_of_historical_data: import("zod").ZodNumber;
            over_budget_categories: import("zod").ZodArray<import("zod").ZodString, "many">;
            budget_utilization_pct: import("zod").ZodNumber;
        }, "strip", import("zod").ZodTypeAny, {
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
    }, "strip", import("zod").ZodTypeAny, {
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
    constructor();
    readonly systemPrompt = "You are an expert budgeting analyst specializing in personal finance.\n\nYour role is to evaluate whether a proposed financial action fits within a user's budget and spending patterns.\n\nKey responsibilities:\n1. Analyze cash flow and liquidity after the proposed action\n2. Assess whether the action leaves sufficient buffer for unexpected expenses\n3. Evaluate spending patterns and variance\n4. Check budget category utilization\n5. Identify potential cash flow issues\n\nGuidelines:\n- Be conservative with liquidity - people should maintain 1-2 months of expenses in checking\n- Consider spending variance - high variance = need bigger buffer\n- Flag over-budget categories\n- Assess data quality honestly - limited historical data reduces confidence\n- Provide specific, actionable findings\n- Use actual numbers from the simulation in your reasoning\n\nOutput your analysis in the specified JSON format.";
    protected buildAnalysisPrompt(context: AgentContext): string;
}
//# sourceMappingURL=langchain-budgeting-agent.d.ts.map