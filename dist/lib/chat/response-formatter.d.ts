import type { SimulationResult, UserProfile } from '../../types/financial.js';
import type { OrchestrationResult } from '../agents/langchain-orchestrator.js';
import type { ParsedIntent } from './intent-parser.js';
export interface FormattedResponse {
    message: string;
    summary: string;
    details?: {
        simulation?: string;
        budgeting?: string;
        investment?: string;
        guardrails?: string;
        validation?: string;
    };
    suggestedFollowUps: string[];
    shouldProceed: boolean;
    confidence: 'high' | 'medium' | 'low' | 'very_low';
}
export declare function formatAnalysisResponse(_intent: ParsedIntent, simulation: SimulationResult, analysis: OrchestrationResult, userProfile: UserProfile): FormattedResponse;
export declare function formatComparisonResponse(options: Array<{
    action: SimulationResult;
    analysis: OrchestrationResult;
}>, userProfile: UserProfile): FormattedResponse;
export declare function formatRecommendationResponse(recommendations: Array<{
    action: {
        type: string;
        amount: number;
        goalId?: string;
    };
    reasoning: string;
    priority: number;
}>, userProfile: UserProfile): FormattedResponse;
export declare function formatGoalProgressResponse(goalSummaries: Array<{
    goalName: string;
    progress: number;
    status: string;
    monthsRemaining: number;
    monthlyNeeded: number;
    projectedCompletion: string;
}>): FormattedResponse;
export declare function formatClarificationResponse(question: string, userProfile: UserProfile): FormattedResponse;
//# sourceMappingURL=response-formatter.d.ts.map