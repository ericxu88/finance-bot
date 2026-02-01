import { type ParsedIntent } from './intent-parser.js';
import { type FormattedResponse } from './response-formatter.js';
import type { UserProfile } from '../../types/financial.js';
export interface ChatRequest {
    message: string;
    userId: string;
    conversationId?: string;
    userProfile: UserProfile;
    fastMode?: boolean;
    parsedAction?: {
        type: 'save' | 'invest' | 'spend';
        amount: number;
        goalId?: string;
        targetAccountId?: string;
    };
}
export interface ChatResponse {
    conversationId: string;
    reply: FormattedResponse;
    intent: ParsedIntent;
    rawAnalysis?: unknown;
    executionTimeMs: number;
    updatedUserProfile?: UserProfile;
}
export declare class ChatHandler {
    private intentParser;
    private useMockAgents;
    private fastMode;
    constructor(options?: {
        fastMode?: boolean;
    });
    handleMessage(request: ChatRequest): Promise<ChatResponse>;
    private handleSimulateAction;
    private handleCompareOptions;
    private handleGetRecommendation;
    private handleCheckGoalProgress;
    private handleExplainTradeoffs;
    private handlePrioritizeGoal;
    private handleStabilizeFinances;
    private handleIncreaseSavingsNoLifestyle;
    private handleGeneralQuestion;
    private answerGeneralQuestionWithLLM;
    private handleTransferMoney;
    private handleCreateGoal;
    private handleUpdateBudget;
    private handleExecuteAction;
    private getAccountBalance;
    private extractLastSuggestedAction;
    private formatUnifiedResponse;
}
export declare const chatHandler: ChatHandler;
//# sourceMappingURL=chat-handler.d.ts.map