/**
 * Chat Module
 * 
 * Provides chat-based interface for financial decision making.
 */

export { IntentParser, MockIntentParser, type ParsedIntent, ParsedIntentSchema } from './intent-parser.js';
export { 
  conversationStore, 
  resolveIntentWithContext, 
  buildConversationSummary,
  type ConversationContext,
  type ConversationMessage,
} from './conversation-memory.js';
export {
  formatAnalysisResponse,
  formatComparisonResponse,
  formatRecommendationResponse,
  formatGoalProgressResponse,
  formatClarificationResponse,
  type FormattedResponse,
} from './response-formatter.js';
export { ChatHandler, chatHandler, type ChatRequest, type ChatResponse } from './chat-handler.js';
export { 
  ActionExecutor, 
  actionExecutor,
  type ActionResult,
  type TransferRequest,
  type CreateGoalRequest,
  type UpdateBudgetRequest,
} from './action-executor.js';