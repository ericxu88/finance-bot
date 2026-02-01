import type { ParsedIntent } from './intent-parser.js';
import type { FinancialAction, UserProfile } from '../../types/financial.js';
export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    intent?: ParsedIntent;
    action?: FinancialAction;
    analysisResult?: unknown;
}
export interface PendingAction {
    type: string;
    data: Record<string, unknown>;
}
export interface ConversationContext {
    id: string;
    userId: string;
    messages: ConversationMessage[];
    lastAction?: FinancialAction;
    lastGoalDiscussed?: string;
    lastAmountDiscussed?: number;
    pendingAction?: PendingAction;
    createdAt: Date;
    updatedAt: Date;
}
declare class ConversationStore {
    private conversations;
    get(conversationId: string): ConversationContext | undefined;
    create(conversationId: string, userId: string): ConversationContext;
    update(conversationId: string, updates: Partial<ConversationContext>): ConversationContext | undefined;
    addMessage(conversationId: string, message: ConversationMessage): void;
    cleanup(maxAgeMs?: number): void;
}
export declare const conversationStore: ConversationStore;
export declare function resolveIntentWithContext(intent: ParsedIntent, context: ConversationContext, _userProfile: UserProfile): ParsedIntent;
export declare function buildConversationSummary(context: ConversationContext, maxMessages?: number): string;
export {};
//# sourceMappingURL=conversation-memory.d.ts.map