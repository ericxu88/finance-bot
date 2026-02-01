import { z } from 'zod';
import type { UserProfile } from '../../types/financial.js';
export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}
export declare const ParsedIntentSchema: z.ZodObject<{
    intent_type: z.ZodEnum<["simulate_action", "compare_options", "get_recommendation", "check_goal_progress", "explain_tradeoffs", "general_question", "clarification_needed", "transfer_money", "create_goal", "update_budget", "execute_action", "prioritize_goal", "stabilize_finances", "increase_savings_no_lifestyle"]>;
    action: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        type: z.ZodNullable<z.ZodEnum<["save", "invest", "spend"]>>;
        amount: z.ZodNullable<z.ZodNumber>;
        goal_name: z.ZodNullable<z.ZodString>;
        account_type: z.ZodNullable<z.ZodString>;
        category: z.ZodNullable<z.ZodString>;
        time_horizon: z.ZodNullable<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        category: string | null;
        type: "save" | "invest" | "spend" | null;
        amount: number | null;
        goal_name: string | null;
        account_type: string | null;
        time_horizon: number | null;
    }, {
        category: string | null;
        type: "save" | "invest" | "spend" | null;
        amount: number | null;
        goal_name: string | null;
        account_type: string | null;
        time_horizon: number | null;
    }>>>;
    options_to_compare: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["save", "invest", "spend"]>;
        amount: z.ZodNumber;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        description: string;
        type: "save" | "invest" | "spend";
        amount: number;
    }, {
        description: string;
        type: "save" | "invest" | "spend";
        amount: number;
    }>, "many">>>;
    transfer: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        from_account: z.ZodNullable<z.ZodString>;
        to_account: z.ZodNullable<z.ZodString>;
        amount: z.ZodNullable<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        amount: number | null;
        from_account: string | null;
        to_account: string | null;
    }, {
        amount: number | null;
        from_account: string | null;
        to_account: string | null;
    }>>>;
    new_goal: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        name: z.ZodNullable<z.ZodString>;
        target_amount: z.ZodNullable<z.ZodNumber>;
        deadline_months: z.ZodNullable<z.ZodNumber>;
        priority: z.ZodNullable<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        name: string | null;
        priority: number | null;
        target_amount: number | null;
        deadline_months: number | null;
    }, {
        name: string | null;
        priority: number | null;
        target_amount: number | null;
        deadline_months: number | null;
    }>>>;
    budget_update: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        category_name: z.ZodNullable<z.ZodString>;
        new_amount: z.ZodNullable<z.ZodNumber>;
        action: z.ZodNullable<z.ZodEnum<["increase", "decrease", "set"]>>;
    }, "strip", z.ZodTypeAny, {
        action: "increase" | "decrease" | "set" | null;
        category_name: string | null;
        new_amount: number | null;
    }, {
        action: "increase" | "decrease" | "set" | null;
        category_name: string | null;
        new_amount: number | null;
    }>>>;
    mentioned_goals: z.ZodArray<z.ZodString, "many">;
    mentioned_amounts: z.ZodArray<z.ZodNumber, "many">;
    confidence: z.ZodEnum<["high", "medium", "low"]>;
    clarification_question: z.ZodNullable<z.ZodString>;
    user_intent_summary: z.ZodString;
    is_confirmation: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    confidence: "medium" | "high" | "low";
    intent_type: "update_budget" | "simulate_action" | "compare_options" | "get_recommendation" | "check_goal_progress" | "explain_tradeoffs" | "general_question" | "clarification_needed" | "transfer_money" | "create_goal" | "execute_action" | "prioritize_goal" | "stabilize_finances" | "increase_savings_no_lifestyle";
    mentioned_goals: string[];
    mentioned_amounts: number[];
    clarification_question: string | null;
    user_intent_summary: string;
    transfer?: {
        amount: number | null;
        from_account: string | null;
        to_account: string | null;
    } | null | undefined;
    action?: {
        category: string | null;
        type: "save" | "invest" | "spend" | null;
        amount: number | null;
        goal_name: string | null;
        account_type: string | null;
        time_horizon: number | null;
    } | null | undefined;
    options_to_compare?: {
        description: string;
        type: "save" | "invest" | "spend";
        amount: number;
    }[] | null | undefined;
    new_goal?: {
        name: string | null;
        priority: number | null;
        target_amount: number | null;
        deadline_months: number | null;
    } | null | undefined;
    budget_update?: {
        action: "increase" | "decrease" | "set" | null;
        category_name: string | null;
        new_amount: number | null;
    } | null | undefined;
    is_confirmation?: boolean | undefined;
}, {
    confidence: "medium" | "high" | "low";
    intent_type: "update_budget" | "simulate_action" | "compare_options" | "get_recommendation" | "check_goal_progress" | "explain_tradeoffs" | "general_question" | "clarification_needed" | "transfer_money" | "create_goal" | "execute_action" | "prioritize_goal" | "stabilize_finances" | "increase_savings_no_lifestyle";
    mentioned_goals: string[];
    mentioned_amounts: number[];
    clarification_question: string | null;
    user_intent_summary: string;
    transfer?: {
        amount: number | null;
        from_account: string | null;
        to_account: string | null;
    } | null | undefined;
    action?: {
        category: string | null;
        type: "save" | "invest" | "spend" | null;
        amount: number | null;
        goal_name: string | null;
        account_type: string | null;
        time_horizon: number | null;
    } | null | undefined;
    options_to_compare?: {
        description: string;
        type: "save" | "invest" | "spend";
        amount: number;
    }[] | null | undefined;
    new_goal?: {
        name: string | null;
        priority: number | null;
        target_amount: number | null;
        deadline_months: number | null;
    } | null | undefined;
    budget_update?: {
        action: "increase" | "decrease" | "set" | null;
        category_name: string | null;
        new_amount: number | null;
    } | null | undefined;
    is_confirmation?: boolean | undefined;
}>;
export type ParsedIntent = z.infer<typeof ParsedIntentSchema>;
export declare class IntentParser {
    private model;
    private parser;
    constructor();
    parse(message: string, userProfile: UserProfile, conversationHistory?: ConversationMessage[]): Promise<ParsedIntent>;
    private stripMarkdownCodeBlocks;
}
export declare class MockIntentParser {
    parse(message: string, userProfile: UserProfile, conversationHistory?: ConversationMessage[]): Promise<ParsedIntent>;
    private buildIntentSummary;
}
//# sourceMappingURL=intent-parser.d.ts.map