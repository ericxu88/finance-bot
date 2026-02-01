import { LangChainBaseAgent, type AgentContext } from './langchain-base.js';
import { GuardrailAnalysisSchema } from './schemas.js';
export declare class LangChainGuardrailAgent extends LangChainBaseAgent<typeof GuardrailAnalysisSchema> {
    readonly agentName = "Guardrail Agent";
    readonly schema: import("zod").ZodObject<{
        violated: import("zod").ZodBoolean;
        can_proceed: import("zod").ZodBoolean;
        violations: import("zod").ZodArray<import("zod").ZodObject<{
            rule_description: import("zod").ZodString;
            severity: import("zod").ZodEnum<["critical", "high", "medium", "low"]>;
            violation_details: import("zod").ZodString;
            current_value: import("zod").ZodUnion<[import("zod").ZodNumber, import("zod").ZodString, import("zod").ZodNull]>;
            threshold_value: import("zod").ZodUnion<[import("zod").ZodNumber, import("zod").ZodString, import("zod").ZodNull]>;
            suggested_adjustment: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        }, "strip", import("zod").ZodTypeAny, {
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
        warnings: import("zod").ZodArray<import("zod").ZodString, "many">;
        compliance_summary: import("zod").ZodString;
    }, "strip", import("zod").ZodTypeAny, {
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
    constructor();
    readonly systemPrompt = "You are a strict compliance and risk management agent for personal finance.\n\nYour role is to enforce user-defined constraints and identify violations.\n\nKey responsibilities:\n1. Check ALL user-defined guardrails against the proposed action\n2. Identify violations with precise details\n3. Assess severity of each violation\n4. Determine if action can proceed or must be blocked\n5. Suggest adjustments to comply with rules\n\nGuidelines:\n- Be strict - guardrails exist for a reason\n- Clearly state what rule was violated and by how much\n- Differentiate between hard blocks (critical violations) and warnings (approaching limits)\n- Provide specific suggestions for how to modify the action to comply\n- Use exact numbers from the simulation\n\nCritical violations that BLOCK:\n- Any action that violates a \"never\" rule (e.g., \"never let checking drop below X\")\n- Protected account modifications\n- Exceeding maximum thresholds\n\nCRITICAL RULE FOR min_balance:\n- A min_balance rule is violated ONLY when the \"After Action\" balance for that account is BELOW the threshold.\n- If \"After Action\" balance >= threshold, then that rule is NOT violated. Set violated = false and can_proceed = true for that rule.\n- Do NOT block based on \"months of expenses\", liquidity opinions, or other non-threshold criteria. Use only the exact numbers: After Action balance vs threshold.\n\nWarnings (don't block but flag):\n- Approaching limits (within 10% of threshold)\n- Patterns that might lead to future violations\n\nOutput your analysis in the specified JSON format with complete violation details.";
    protected buildAnalysisPrompt(context: AgentContext): string;
    private delta;
}
//# sourceMappingURL=langchain-guardrail-agent.d.ts.map