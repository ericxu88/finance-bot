import { z } from 'zod';
import type { UserProfile, FinancialAction, SimulationResult } from '../../types/financial.js';
import type { HistoricalMetrics } from './historical-metrics.js';
declare const UnifiedAnalysisSchema: z.ZodObject<{
    budget_assessment: z.ZodObject<{
        can_afford: z.ZodBoolean;
        monthly_impact: z.ZodString;
        key_concern: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        can_afford: boolean;
        monthly_impact: string;
        key_concern: string | null;
    }, {
        can_afford: boolean;
        monthly_impact: string;
        key_concern: string | null;
    }>;
    investment_assessment: z.ZodObject<{
        appropriate_for_goal: z.ZodBoolean;
        projected_growth: z.ZodString;
        risk_alignment: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        appropriate_for_goal: boolean;
        projected_growth: string;
        risk_alignment: string;
    }, {
        appropriate_for_goal: boolean;
        projected_growth: string;
        risk_alignment: string;
    }>;
    guardrail_assessment: z.ZodObject<{
        passes_all: z.ZodBoolean;
        violations: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        violations: string[];
        passes_all: boolean;
    }, {
        violations: string[];
        passes_all: boolean;
    }>;
    spending_insights: z.ZodObject<{
        overspending_categories: z.ZodArray<z.ZodString, "many">;
        opportunities_to_save: z.ZodNullable<z.ZodString>;
        estimated_monthly_savings: z.ZodNullable<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        overspending_categories: string[];
        opportunities_to_save: string | null;
        estimated_monthly_savings: number | null;
    }, {
        overspending_categories: string[];
        opportunities_to_save: string | null;
        estimated_monthly_savings: number | null;
    }>;
    recommendation: z.ZodEnum<["proceed", "proceed_with_caution", "reconsider", "do_not_proceed"]>;
    confidence: z.ZodEnum<["high", "medium", "low"]>;
    explanation: z.ZodString;
    suggested_alternative: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    recommendation: "proceed" | "proceed_with_caution" | "reconsider" | "do_not_proceed";
    confidence: "medium" | "high" | "low";
    budget_assessment: {
        can_afford: boolean;
        monthly_impact: string;
        key_concern: string | null;
    };
    investment_assessment: {
        appropriate_for_goal: boolean;
        projected_growth: string;
        risk_alignment: string;
    };
    guardrail_assessment: {
        violations: string[];
        passes_all: boolean;
    };
    spending_insights: {
        overspending_categories: string[];
        opportunities_to_save: string | null;
        estimated_monthly_savings: number | null;
    };
    explanation: string;
    suggested_alternative: string | null;
}, {
    recommendation: "proceed" | "proceed_with_caution" | "reconsider" | "do_not_proceed";
    confidence: "medium" | "high" | "low";
    budget_assessment: {
        can_afford: boolean;
        monthly_impact: string;
        key_concern: string | null;
    };
    investment_assessment: {
        appropriate_for_goal: boolean;
        projected_growth: string;
        risk_alignment: string;
    };
    guardrail_assessment: {
        violations: string[];
        passes_all: boolean;
    };
    spending_insights: {
        overspending_categories: string[];
        opportunities_to_save: string | null;
        estimated_monthly_savings: number | null;
    };
    explanation: string;
    suggested_alternative: string | null;
}>;
export type UnifiedAnalysis = z.infer<typeof UnifiedAnalysisSchema>;
export interface UnifiedAgentContext {
    user: UserProfile;
    action: FinancialAction;
    simulationResult: SimulationResult;
    historicalMetrics: HistoricalMetrics;
}
export declare class UnifiedAgent {
    private model;
    private parser;
    constructor();
    analyze(context: UnifiedAgentContext): Promise<UnifiedAnalysis>;
}
export declare class MockUnifiedAgent {
    analyze(context: UnifiedAgentContext): Promise<UnifiedAnalysis>;
}
export {};
//# sourceMappingURL=unified-agent.d.ts.map