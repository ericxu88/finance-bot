/**
 * Conversation Memory
 * 
 * Tracks conversation context across messages to enable follow-up questions
 * like "What about $1000 instead?" or "Try the Roth IRA".
 */

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

/**
 * In-memory conversation store
 * In production, this would be Redis or a database
 */
class ConversationStore {
  private conversations: Map<string, ConversationContext> = new Map();
  
  get(conversationId: string): ConversationContext | undefined {
    return this.conversations.get(conversationId);
  }
  
  create(conversationId: string, userId: string): ConversationContext {
    const context: ConversationContext = {
      id: conversationId,
      userId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.conversations.set(conversationId, context);
    return context;
  }
  
  update(conversationId: string, updates: Partial<ConversationContext>): ConversationContext | undefined {
    const existing = this.conversations.get(conversationId);
    if (!existing) return undefined;
    
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.conversations.set(conversationId, updated);
    return updated;
  }
  
  addMessage(conversationId: string, message: ConversationMessage): void {
    const context = this.conversations.get(conversationId);
    if (context) {
      context.messages.push(message);
      context.updatedAt = new Date();
      
      // Update context from message
      if (message.action) {
        context.lastAction = message.action;
      }
      if (message.intent?.mentioned_goals?.[0]) {
        context.lastGoalDiscussed = message.intent.mentioned_goals[0];
      }
      if (message.intent?.mentioned_amounts?.[0]) {
        context.lastAmountDiscussed = message.intent.mentioned_amounts[0];
      }
    }
  }
  
  // Clean up old conversations (call periodically)
  cleanup(maxAgeMs: number = 30 * 60 * 1000): void { // Default 30 minutes
    const now = Date.now();
    for (const [id, context] of this.conversations.entries()) {
      if (now - context.updatedAt.getTime() > maxAgeMs) {
        this.conversations.delete(id);
      }
    }
  }
}

// Singleton store
export const conversationStore = new ConversationStore();

/**
 * Resolves incomplete intents using conversation context
 * 
 * Example: User says "What about $1000?" after discussing investing $500 for house
 * This function fills in the missing pieces from context.
 */
export function resolveIntentWithContext(
  intent: ParsedIntent,
  context: ConversationContext,
  _userProfile: UserProfile
): ParsedIntent {
  // If intent is already complete, return as-is
  if (intent.confidence === 'high') {
    return intent;
  }
  
  const resolved = { ...intent };
  
  // Resolve action details from context
  if (resolved.action) {
    // Fill in missing amount from context
    if (!resolved.action.amount && context.lastAmountDiscussed) {
      resolved.action = {
        ...resolved.action,
        amount: context.lastAmountDiscussed,
      };
    }
    
    // Fill in missing goal from context
    if (!resolved.action.goal_name && context.lastGoalDiscussed) {
      resolved.action = {
        ...resolved.action,
        goal_name: context.lastGoalDiscussed,
      };
    }
    
    // Fill in missing action type from context
    if (!resolved.action.type && context.lastAction) {
      resolved.action = {
        ...resolved.action,
        type: context.lastAction.type,
      };
    }
    
    // Fill in missing account from context
    if (!resolved.action.account_type && context.lastAction?.type === 'invest') {
      const lastInvestAction = context.lastAction as { targetAccountId?: string };
      if (lastInvestAction.targetAccountId) {
        resolved.action = {
          ...resolved.action,
          account_type: lastInvestAction.targetAccountId,
        };
      }
    }
  }
  
  // Resolve mentioned goals from context
  if (resolved.mentioned_goals.length === 0 && context.lastGoalDiscussed) {
    resolved.mentioned_goals = [context.lastGoalDiscussed];
  }
  
  // Update confidence if we filled in blanks
  if (resolved.action?.amount && resolved.action?.type) {
    resolved.confidence = resolved.action.goal_name ? 'high' : 'medium';
  }
  
  return resolved;
}

/**
 * Build recent conversation summary for LLM context
 */
export function buildConversationSummary(context: ConversationContext, maxMessages: number = 5): string {
  const recentMessages = context.messages.slice(-maxMessages);
  
  if (recentMessages.length === 0) {
    return 'This is the start of the conversation.';
  }
  
  const summary = recentMessages.map(msg => {
    const role = msg.role === 'user' ? 'User' : 'Assistant';
    const content = msg.content.length > 200 
      ? msg.content.substring(0, 200) + '...'
      : msg.content;
    return `${role}: ${content}`;
  }).join('\n');
  
  let contextSummary = '';
  if (context.lastAction) {
    contextSummary += `\nLast discussed action: ${context.lastAction.type} $${context.lastAction.amount}`;
  }
  if (context.lastGoalDiscussed) {
    contextSummary += `\nLast discussed goal: ${context.lastGoalDiscussed}`;
  }
  
  return `Recent conversation:\n${summary}${contextSummary}`;
}
