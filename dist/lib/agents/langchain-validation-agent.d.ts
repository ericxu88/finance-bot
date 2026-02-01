import { LangChainBaseAgent, type AgentContext } from './langchain-base.js';
import { ValidationAnalysisSchema, BudgetingAnalysisSchema, InvestmentAnalysisSchema, GuardrailAnalysisSchema } from './schemas.js';
import type { z } from 'zod';
interface ValidationContext extends AgentContext {
    budgetingAnalysis: z.infer<typeof BudgetingAnalysisSchema>;
    investmentAnalysis: z.infer<typeof InvestmentAnalysisSchema>;
    guardrailAnalysis: z.infer<typeof GuardrailAnalysisSchema>;
}
export declare class LangChainValidationAgent extends LangChainBaseAgent<typeof ValidationAnalysisSchema> {
    readonly agentName = "Validation Agent";
    readonly schema: z.ZodObject<{
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
    constructor();
    readonly systemPrompt = "You are a meta-analyst responsible for CONSISTENCY and RISK FLAGS \u2014 you are NOT the final decision maker.\n\nYour role is to:\n1. Check CONSISTENCY between agent recommendations (do Budgeting and Investment contradict?)\n2. Detect CONTRADICTIONS (e.g. one approves, one strongly_opposes)\n3. Surface RISK FLAGS (liquidity, data insufficiency, variance)\n4. Provide a clear SYNTHESIS summary and decision paths\n\nYou do NOT have authority to veto. The final decision is computed from domain agents + guardrail by the orchestrator:\n- Guardrail blocked \u2192 hard stop (blocked)\n- Any domain agent strongly_oppose/blocked \u2192 do_not_proceed\n- Any approve_with_caution \u2192 proceed_with_caution\n- Both approve/strongly_approve \u2192 proceed\n\nGuidelines:\n- If guardrail can_proceed = true, do NOT state that the guardrail blocks the action\n- \"Approve with caution\" from all domain agents should NOT be described as \"do not proceed\" \u2014 describe risks and that the user CAN proceed with caution\n- Weight agent opinions by confidence and data quality\n- Be honest about limitations; suggest safer alternatives (e.g. \"try a smaller amount\") when relevant\n- consensus_level: use \"unanimous\" only when both domain agents are in {approve, approve_with_caution, strongly_approve}; use \"divided\" when one approves and one opposes\n\nOutput a comprehensive validation in the specified JSON format.";
    analyzeWithAgentOutputs(context: AgentContext, agentAnalyses: Omit<ValidationContext, keyof AgentContext>): Promise<z.infer<typeof ValidationAnalysisSchema>>;
    protected buildAnalysisPrompt(context: any): string;
}
export {};
//# sourceMappingURL=langchain-validation-agent.d.ts.map