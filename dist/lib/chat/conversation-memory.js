class ConversationStore {
    conversations = new Map();
    get(conversationId) {
        return this.conversations.get(conversationId);
    }
    create(conversationId, userId) {
        const context = {
            id: conversationId,
            userId,
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.conversations.set(conversationId, context);
        return context;
    }
    update(conversationId, updates) {
        const existing = this.conversations.get(conversationId);
        if (!existing)
            return undefined;
        const updated = {
            ...existing,
            ...updates,
            updatedAt: new Date(),
        };
        this.conversations.set(conversationId, updated);
        return updated;
    }
    addMessage(conversationId, message) {
        const context = this.conversations.get(conversationId);
        if (context) {
            context.messages.push(message);
            context.updatedAt = new Date();
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
    cleanup(maxAgeMs = 30 * 60 * 1000) {
        const now = Date.now();
        for (const [id, context] of this.conversations.entries()) {
            if (now - context.updatedAt.getTime() > maxAgeMs) {
                this.conversations.delete(id);
            }
        }
    }
}
export const conversationStore = new ConversationStore();
export function resolveIntentWithContext(intent, context, _userProfile) {
    if (intent.confidence === 'high') {
        return intent;
    }
    const resolved = { ...intent };
    if (resolved.action) {
        if (!resolved.action.amount && context.lastAmountDiscussed) {
            resolved.action = {
                ...resolved.action,
                amount: context.lastAmountDiscussed,
            };
        }
        if (!resolved.action.goal_name && context.lastGoalDiscussed) {
            resolved.action = {
                ...resolved.action,
                goal_name: context.lastGoalDiscussed,
            };
        }
        if (!resolved.action.type && context.lastAction) {
            resolved.action = {
                ...resolved.action,
                type: context.lastAction.type,
            };
        }
        if (!resolved.action.account_type && context.lastAction?.type === 'invest') {
            const lastInvestAction = context.lastAction;
            if (lastInvestAction.targetAccountId) {
                resolved.action = {
                    ...resolved.action,
                    account_type: lastInvestAction.targetAccountId,
                };
            }
        }
    }
    if (resolved.mentioned_goals.length === 0 && context.lastGoalDiscussed) {
        resolved.mentioned_goals = [context.lastGoalDiscussed];
    }
    if (resolved.action?.amount && resolved.action?.type) {
        resolved.confidence = resolved.action.goal_name ? 'high' : 'medium';
    }
    return resolved;
}
export function buildConversationSummary(context, maxMessages = 5) {
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
//# sourceMappingURL=conversation-memory.js.map