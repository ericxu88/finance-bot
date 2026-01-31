/**
 * Chat Handler
 * 
 * Main orchestrator for chat-based interactions.
 * Coordinates intent parsing, simulation, analysis, and response formatting.
 */

import { IntentParser, MockIntentParser, type ParsedIntent } from './intent-parser.js';
import {
  conversationStore,
  resolveIntentWithContext,
  type ConversationContext,
} from './conversation-memory.js';
import {
  formatAnalysisResponse,
  formatComparisonResponse,
  formatRecommendationResponse,
  formatGoalProgressResponse,
  formatClarificationResponse,
  type FormattedResponse,
} from './response-formatter.js';
import {
  simulate_save,
  simulate_invest,
  simulate_spend,
  compare_options,
} from '../simulation-engine.js';
import { calculateHistoricalMetrics } from '../agents/historical-metrics.js';
import { LangChainAgentOrchestrator } from '../agents/langchain-orchestrator.js';
import { MockAgentOrchestrator } from '../agents/mock-orchestrator.js';
import { UnifiedAgent } from '../agents/unified-agent.js';
import { analyzeFinancialHealth, generateGoalSummary } from '../recommendation-engine.js';
import type { UserProfile, FinancialAction, SimulationResult } from '../../types/financial.js';

export interface ChatRequest {
  message: string;
  userId: string;
  conversationId?: string;
  userProfile: UserProfile;
  /** Use fast mode (single LLM call) instead of multi-agent (5 LLM calls) */
  fastMode?: boolean;
  /** Skip intent parsing if action is already known */
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
}

export class ChatHandler {
  private intentParser: IntentParser | MockIntentParser;
  private useMockAgents: boolean;
  private fastMode: boolean;

  constructor(options?: { fastMode?: boolean }) {
    const openAiKey = process.env.OPEN_AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
    this.useMockAgents = !openAiKey || process.env.USE_MOCK_AGENTS === 'true';
    this.fastMode = options?.fastMode ?? (process.env.FAST_MODE === 'true');
    
    // Use mock parser if no API key (for development)
    this.intentParser = this.useMockAgents
      ? new MockIntentParser()
      : new IntentParser();
  }

  async handleMessage(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    const { message, userId, userProfile, fastMode: requestFastMode, parsedAction } = request;
    const useFastMode = requestFastMode ?? this.fastMode;
    
    // Get or create conversation context
    let conversationId = request.conversationId || `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    let context = conversationStore.get(conversationId);
    
    if (!context) {
      context = conversationStore.create(conversationId, userId);
    }
    
    // Add user message to history
    conversationStore.addMessage(conversationId, {
      role: 'user',
      content: message,
      timestamp: new Date(),
    });
    
    try {
      let intent: ParsedIntent;
      
      // Fast path: Skip intent parsing if action is provided
      if (parsedAction) {
        console.log(`[ChatHandler] Using pre-parsed action (skipping intent parsing)`);
        intent = {
          intent_type: 'simulate_action',
          action: {
            type: parsedAction.type,
            amount: parsedAction.amount,
            goal_name: parsedAction.goalId ? userProfile.goals.find(g => g.id === parsedAction.goalId)?.name || null : null,
            account_type: parsedAction.targetAccountId || null,
            category: null,
            time_horizon: null,
          },
          mentioned_goals: [],
          mentioned_amounts: [parsedAction.amount],
          confidence: 'high',
          clarification_question: null,
          user_intent_summary: `${parsedAction.type} $${parsedAction.amount}`,
        };
      } else {
        // Step 1: Parse intent (slow path - uses LLM if available)
        console.log(`[ChatHandler] Parsing intent for: "${message.substring(0, 50)}..."`);
        intent = await this.intentParser.parse(message, userProfile);
        
        // Step 2: Resolve with conversation context (for follow-up questions)
        intent = resolveIntentWithContext(intent, context, userProfile);
      }
      
      console.log(`[ChatHandler] Intent: ${intent.intent_type}, confidence: ${intent.confidence}${useFastMode ? ' (FAST MODE)' : ''}`);
      
      // Step 3: Handle based on intent type
      let reply: FormattedResponse;
      let rawAnalysis: unknown = null;
      
      switch (intent.intent_type) {
        case 'simulate_action':
          const result = await this.handleSimulateAction(intent, userProfile, context, useFastMode);
          reply = result.reply;
          rawAnalysis = result.rawAnalysis;
          break;
          
        case 'compare_options':
          const compResult = await this.handleCompareOptions(intent, userProfile);
          reply = compResult.reply;
          rawAnalysis = compResult.rawAnalysis;
          break;
          
        case 'get_recommendation':
          reply = await this.handleGetRecommendation(userProfile);
          break;
          
        case 'check_goal_progress':
          reply = this.handleCheckGoalProgress(userProfile);
          break;
          
        case 'explain_tradeoffs':
          reply = await this.handleExplainTradeoffs(intent, userProfile);
          break;
          
        case 'clarification_needed':
          reply = formatClarificationResponse(
            intent.clarification_question || "Could you tell me more about what you'd like to do?",
            userProfile
          );
          break;
          
        case 'general_question':
        default:
          reply = await this.handleGeneralQuestion(message, userProfile, context);
          break;
      }
      
      // Step 4: Store assistant response in conversation history
      conversationStore.addMessage(conversationId, {
        role: 'assistant',
        content: reply.message,
        timestamp: new Date(),
        intent,
        analysisResult: rawAnalysis,
      });
      
      // Update conversation context with discussed entities
      if (intent.mentioned_goals.length > 0 && intent.mentioned_goals[0]) {
        context.lastGoalDiscussed = intent.mentioned_goals[0];
      }
      if (intent.mentioned_amounts.length > 0) {
        context.lastAmountDiscussed = intent.mentioned_amounts[0];
      }
      
      return {
        conversationId,
        reply,
        intent,
        rawAnalysis,
        executionTimeMs: Date.now() - startTime,
      };
      
    } catch (error) {
      console.error('[ChatHandler] Error:', error);
      
      return {
        conversationId,
        reply: {
          message: "I ran into an issue processing your request. Could you try rephrasing? For example: 'Should I invest $500 for my house fund?'",
          summary: 'Error processing request',
          suggestedFollowUps: [
            'Should I invest $500?',
            'What should I do with extra money?',
            'Show me my goals',
          ],
          shouldProceed: false,
          confidence: 'low',
        },
        intent: {
          intent_type: 'clarification_needed',
          mentioned_goals: [],
          mentioned_amounts: [],
          confidence: 'low',
          clarification_question: null,
          user_intent_summary: message,
        },
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  private async handleSimulateAction(
    intent: ParsedIntent,
    userProfile: UserProfile,
    context: ConversationContext,
    useFastMode: boolean = false
  ): Promise<{ reply: FormattedResponse; rawAnalysis: unknown }> {
    const action = intent.action;
    
    if (!action?.type || !action?.amount) {
      return {
        reply: formatClarificationResponse(
          "I need a bit more detail. What action would you like to take and for how much? For example: 'invest $500' or 'save $300 for vacation'",
          userProfile
        ),
        rawAnalysis: null,
      };
    }
    
    // Resolve goal ID from goal name
    let goalId: string | undefined;
    if (action.goal_name) {
      const goal = userProfile.goals.find(g => 
        g.name.toLowerCase().includes(action.goal_name!.toLowerCase())
      );
      goalId = goal?.id;
    }
    
    // Build the financial action
    const financialAction: FinancialAction = {
      type: action.type,
      amount: action.amount,
      ...(goalId && { goalId }),
      ...(action.type === 'invest' && action.account_type && { 
        targetAccountId: action.account_type as 'taxable' | 'rothIRA' | 'traditional401k'
      }),
      ...(action.type === 'spend' && action.category && { category: action.category }),
    };
    
    // Run simulation
    let simulation: SimulationResult;
    switch (action.type) {
      case 'save':
        simulation = simulate_save(userProfile, action.amount, goalId);
        break;
      case 'invest':
        const accountId = (action.account_type as 'taxable' | 'rothIRA' | 'traditional401k') || 'taxable';
        simulation = simulate_invest(userProfile, action.amount, accountId, goalId, action.time_horizon || 5);
        break;
      case 'spend':
        simulation = simulate_spend(userProfile, action.amount, action.category || 'general');
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
    
    const historicalMetrics = calculateHistoricalMetrics(userProfile);
    
    // FAST MODE: Use unified agent (single LLM call)
    if (useFastMode && !this.useMockAgents) {
      console.log(`[ChatHandler] Using FAST MODE (unified agent)`);
      const unifiedAgent = new UnifiedAgent();
      const unifiedResult = await unifiedAgent.analyze({
        user: userProfile,
        action: financialAction,
        simulationResult: simulation,
        historicalMetrics,
      });
      
      // Convert unified result to formatted response
      const reply: FormattedResponse = {
        message: this.formatUnifiedResponse(unifiedResult, simulation, userProfile),
        summary: unifiedResult.recommendation === 'proceed' || unifiedResult.recommendation === 'proceed_with_caution'
          ? `✅ Recommended: ${action.type} $${action.amount.toLocaleString()}`
          : `⚠️ Not recommended: ${action.type} $${action.amount.toLocaleString()}`,
        suggestedFollowUps: [
          `What about $${Math.round(action.amount * 1.5)}?`,
          `What if I ${action.type === 'invest' ? 'saved' : 'invested'} instead?`,
          'Show me other options',
        ],
        shouldProceed: unifiedResult.recommendation === 'proceed' || unifiedResult.recommendation === 'proceed_with_caution',
        confidence: unifiedResult.confidence,
      };
      
      context.lastAction = financialAction;
      
      return { reply, rawAnalysis: unifiedResult };
    }
    
    // STANDARD MODE: Use multi-agent orchestrator
    const orchestrator = this.useMockAgents
      ? new MockAgentOrchestrator()
      : new LangChainAgentOrchestrator();
    
    const analysisResult = await orchestrator.processDecision({
      user: userProfile,
      action: financialAction,
      simulationResult: simulation,
      historicalMetrics,
    });
    
    // Update context with this action
    context.lastAction = financialAction;
    
    // Format response
    const reply = formatAnalysisResponse(intent, simulation, analysisResult, userProfile);
    
    return {
      reply,
      rawAnalysis: {
        simulation,
        analysis: analysisResult,
      },
    };
  }

  private async handleCompareOptions(
    intent: ParsedIntent,
    userProfile: UserProfile
  ): Promise<{ reply: FormattedResponse; rawAnalysis: unknown }> {
    // If specific options provided, use them
    if (intent.options_to_compare && intent.options_to_compare.length > 0) {
      const options = intent.options_to_compare.map(opt => ({
        type: opt.type,
        amount: opt.amount,
      }));
      
      const simulations = compare_options(userProfile, options);
      
      // Run analysis on each option
      const orchestrator = this.useMockAgents
        ? new MockAgentOrchestrator()
        : new LangChainAgentOrchestrator();
      
      const historicalMetrics = calculateHistoricalMetrics(userProfile);
      
      const analyzed = await Promise.all(
        simulations.map(async (sim) => {
          const analysis = await orchestrator.processDecision({
            user: userProfile,
            action: sim.action,
            simulationResult: sim,
            historicalMetrics,
          });
          return { action: sim, analysis };
        })
      );
      
      return {
        reply: formatComparisonResponse(analyzed, userProfile),
        rawAnalysis: analyzed,
      };
    }
    
    // Default: compare save vs invest for the mentioned amount
    const amount = intent.mentioned_amounts[0] || 500;
    const goalId = intent.mentioned_goals[0] 
      ? userProfile.goals.find(g => g.name.toLowerCase().includes(intent.mentioned_goals[0]!.toLowerCase()))?.id
      : userProfile.goals[0]?.id;
    
    const options = [
      { type: 'save' as const, amount, goalId },
      { type: 'invest' as const, amount, targetAccountId: 'taxable' as const, goalId },
    ];
    
    const simulations = compare_options(userProfile, options);
    
    const orchestrator = this.useMockAgents
      ? new MockAgentOrchestrator()
      : new LangChainAgentOrchestrator();
    
    const historicalMetrics = calculateHistoricalMetrics(userProfile);
    
    const analyzed = await Promise.all(
      simulations.map(async (sim, index) => {
        const analysis = await orchestrator.processDecision({
          user: userProfile,
          action: options[index]!,
          simulationResult: sim,
          historicalMetrics,
        });
        return { action: sim, analysis };
      })
    );
    
    return {
      reply: formatComparisonResponse(analyzed, userProfile),
      rawAnalysis: analyzed,
    };
  }

  private async handleGetRecommendation(userProfile: UserProfile): Promise<FormattedResponse> {
    const healthAnalysis = analyzeFinancialHealth(userProfile);
    return formatRecommendationResponse(healthAnalysis.recommendations, userProfile);
  }

  private handleCheckGoalProgress(userProfile: UserProfile): FormattedResponse {
    const goalSummaries = generateGoalSummary(userProfile);
    return formatGoalProgressResponse(goalSummaries);
  }

  private async handleExplainTradeoffs(
    intent: ParsedIntent,
    userProfile: UserProfile
  ): Promise<FormattedResponse> {
    // Explain tradeoffs for the mentioned action or goals
    const amount = intent.mentioned_amounts[0] || 500;
    
    let message = `Let me explain the tradeoffs for a $${amount} decision:\n\n`;
    
    message += `**If you SAVE $${amount}:**\n`;
    message += `• Immediate access to funds (high liquidity)\n`;
    message += `• Earns ~4% annually in high-yield savings\n`;
    message += `• Best for: Emergency fund, short-term goals\n\n`;
    
    message += `**If you INVEST $${amount}:**\n`;
    message += `• Potential for ~7% annual returns (historically)\n`;
    message += `• Money is less accessible (lower liquidity)\n`;
    message += `• Subject to market volatility\n`;
    message += `• Best for: Long-term goals (5+ years)\n\n`;
    
    message += `**If you SPEND $${amount}:**\n`;
    message += `• Immediate utility/enjoyment\n`;
    message += `• Delays progress on financial goals\n`;
    message += `• Best for: Planned expenses within budget\n\n`;
    
    message += `Your risk tolerance is **${userProfile.preferences.riskTolerance}** and liquidity preference is **${userProfile.preferences.liquidityPreference}**.`;
    
    return {
      message,
      summary: `Tradeoff analysis for $${amount}`,
      suggestedFollowUps: [
        `Should I save $${amount}?`,
        `Should I invest $${amount}?`,
        `Compare saving vs investing $${amount}`,
      ],
      shouldProceed: true,
      confidence: 'high',
    };
  }

  private async handleGeneralQuestion(
    _message: string,
    userProfile: UserProfile,
    _context: ConversationContext
  ): Promise<FormattedResponse> {
    // For general questions, provide helpful context and suggestions
    const healthAnalysis = analyzeFinancialHealth(userProfile);
    const goalSummaries = generateGoalSummary(userProfile);
    
    let response = "I'm here to help you make smart financial decisions. Here's a quick overview:\n\n";
    
    response += `**Your Financial Health:** ${healthAnalysis.overallHealth}\n`;
    response += `**Monthly Surplus:** $${healthAnalysis.monthlySurplus.toLocaleString()}\n`;
    response += `**Goals on Track:** ${goalSummaries.filter(g => g.status === 'on_track' || g.status === 'completed').length}/${goalSummaries.length}\n\n`;
    
    response += "Here are some things I can help with:\n";
    response += "• **Simulate actions:** 'Should I invest $500?'\n";
    response += "• **Compare options:** 'Save $500 vs invest $500'\n";
    response += "• **Get recommendations:** 'What should I do?'\n";
    response += "• **Check progress:** 'How are my goals doing?'\n";
    
    return {
      message: response,
      summary: 'Overview and help',
      suggestedFollowUps: [
        'What should I do with my extra money?',
        'How are my goals progressing?',
        'Should I invest $500 for my house fund?',
        'Compare saving vs investing',
      ],
      shouldProceed: true,
      confidence: 'high',
    };
  }

  private formatUnifiedResponse(
    result: import('../agents/unified-agent.js').UnifiedAnalysis,
    simulation: SimulationResult,
    userProfile: UserProfile
  ): string {
    const action = simulation.action;
    const goalName = action.goalId
      ? userProfile.goals.find(g => g.id === action.goalId)?.name
      : null;
    
    let message = '';
    
    // Opening
    if (result.recommendation === 'proceed') {
      message = `Great news! ${action.type.charAt(0).toUpperCase() + action.type.slice(1)}ing $${action.amount.toLocaleString()}${goalName ? ` for ${goalName}` : ''} looks solid.\n\n`;
    } else if (result.recommendation === 'proceed_with_caution') {
      message = `${action.type.charAt(0).toUpperCase() + action.type.slice(1)}ing $${action.amount.toLocaleString()}${goalName ? ` for ${goalName}` : ''} could work, with some considerations.\n\n`;
    } else {
      message = `I'd recommend holding off on ${action.type}ing $${action.amount.toLocaleString()} right now.\n\n`;
    }
    
    // Key insights
    message += `**Budget:** ${result.budget_assessment.monthly_impact}\n`;
    if (result.budget_assessment.key_concern) {
      message += `⚠️ ${result.budget_assessment.key_concern}\n`;
    }
    message += '\n';
    
    if (action.type === 'invest') {
      message += `**Investment:** ${result.investment_assessment.projected_growth}\n`;
      message += `Risk alignment: ${result.investment_assessment.risk_alignment}\n\n`;
    }
    
    // Guardrails
    if (!result.guardrail_assessment.passes_all) {
      message += `**⚠️ Guardrail Violations:**\n`;
      result.guardrail_assessment.violations.forEach(v => {
        message += `• ${v}\n`;
      });
      message += '\n';
    }
    
    // Recommendation
    message += `**My recommendation:** ${result.explanation}`;
    
    if (result.suggested_alternative) {
      message += `\n\n💡 **Alternative:** ${result.suggested_alternative}`;
    }
    
    return message;
  }
}

// Export singleton for simple usage
export const chatHandler = new ChatHandler();
