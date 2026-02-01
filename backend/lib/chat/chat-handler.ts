/**
 * Chat Handler
 * 
 * Main orchestrator for chat-based interactions.
 * Coordinates intent parsing, simulation, analysis, and response formatting.
 */

import { IntentParser, MockIntentParser, type ParsedIntent, type ConversationMessage } from './intent-parser.js';
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
import { actionExecutor, type ActionResult } from './action-executor.js';
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
        // Build conversation history for context-aware parsing
        const conversationHistory: ConversationMessage[] = context.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        }));
        
        // Step 1: Parse intent with conversation context (uses LLM if available)
        console.log(`[ChatHandler] Parsing intent for: "${message.substring(0, 50)}..." (with ${conversationHistory.length} messages of context)`);
        intent = await this.intentParser.parse(message, userProfile, conversationHistory);
        
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
        
        // NEW: Action intents that modify user data
        case 'transfer_money':
          reply = await this.handleTransferMoney(intent, userProfile, context);
          break;
          
        case 'create_goal':
          reply = await this.handleCreateGoal(intent, userProfile, context);
          break;
          
        case 'update_budget':
          reply = await this.handleUpdateBudget(intent, userProfile, context);
          break;
          
        case 'execute_action':
          reply = await this.handleExecuteAction(intent, userProfile, context, useFastMode);
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
    response += "• **Move money:** 'Transfer $500 from checking to savings'\n";
    response += "• **Create goals:** 'I want to save for a vacation'\n";
    response += "• **Update budget:** 'Increase my dining budget to $300'\n";
    
    return {
      message: response,
      summary: 'Overview and help',
      suggestedFollowUps: [
        'What should I do with my extra money?',
        'How are my goals progressing?',
        'Transfer $500 from checking to savings',
        'Create a goal for a new car',
      ],
      shouldProceed: true,
      confidence: 'high',
    };
  }

  // ============================================================================
  // ACTION HANDLERS - Modify user data
  // ============================================================================

  private async handleTransferMoney(
    intent: ParsedIntent,
    userProfile: UserProfile,
    context: ConversationContext
  ): Promise<FormattedResponse> {
    const transfer = intent.transfer;
    
    // Validate we have the required information
    if (!transfer?.from_account || !transfer?.to_account || !transfer?.amount) {
      // Ask for missing information
      const missing: string[] = [];
      if (!transfer?.amount) missing.push('amount');
      if (!transfer?.from_account) missing.push('source account (checking or savings)');
      if (!transfer?.to_account) missing.push('destination account');
      
      return {
        message: `I'd be happy to help you transfer money! I just need a few more details:\n\n${missing.map(m => `• What ${m}?`).join('\n')}\n\nFor example: "Transfer $500 from checking to savings"`,
        summary: 'Need transfer details',
        suggestedFollowUps: [
          'Transfer $500 from checking to savings',
          'Move $300 from savings to checking',
          'Transfer $200 from checking to investments',
        ],
        shouldProceed: false,
        confidence: 'low',
      };
    }
    
    // Store pending action for confirmation
    context.pendingAction = {
      type: 'transfer',
      data: {
        fromAccount: transfer.from_account,
        toAccount: transfer.to_account,
        amount: transfer.amount,
      },
    };
    
    // Ask for confirmation
    return {
      message: `I'll transfer **$${transfer.amount.toLocaleString()}** from your **${transfer.from_account}** to your **${transfer.to_account}**.\n\n` +
        `**Current balances:**\n` +
        `• ${transfer.from_account}: $${this.getAccountBalance(userProfile, transfer.from_account).toLocaleString()}\n` +
        `• ${transfer.to_account}: $${this.getAccountBalance(userProfile, transfer.to_account).toLocaleString()}\n\n` +
        `**After transfer:**\n` +
        `• ${transfer.from_account}: $${(this.getAccountBalance(userProfile, transfer.from_account) - transfer.amount).toLocaleString()}\n` +
        `• ${transfer.to_account}: $${(this.getAccountBalance(userProfile, transfer.to_account) + transfer.amount).toLocaleString()}\n\n` +
        `Would you like me to proceed with this transfer?`,
      summary: `Transfer $${transfer.amount.toLocaleString()} ready`,
      suggestedFollowUps: [
        'Yes, do it',
        'No, cancel',
        'Change the amount',
      ],
      shouldProceed: true,
      confidence: 'high',
    };
  }

  private async handleCreateGoal(
    intent: ParsedIntent,
    userProfile: UserProfile,
    context: ConversationContext
  ): Promise<FormattedResponse> {
    const newGoal = intent.new_goal;
    
    // Validate we have the required information
    if (!newGoal?.name || !newGoal?.target_amount) {
      const missing: string[] = [];
      if (!newGoal?.name) missing.push('goal name (e.g., "New Car", "Vacation")');
      if (!newGoal?.target_amount) missing.push('target amount');
      
      return {
        message: `Great idea to set a new goal! I need a bit more information:\n\n${missing.map(m => `• ${m}`).join('\n')}\n\nFor example: "Create a goal for a car with $15,000 in 2 years"`,
        summary: 'Need goal details',
        suggestedFollowUps: [
          'Save $5,000 for a vacation',
          'Create a goal for a car: $15,000',
          'Start saving $10,000 for education',
        ],
        shouldProceed: false,
        confidence: 'low',
      };
    }
    
    // Store pending action for confirmation
    context.pendingAction = {
      type: 'create_goal',
      data: {
        name: newGoal.name,
        targetAmount: newGoal.target_amount,
        deadlineMonths: newGoal.deadline_months || 12,
        priority: newGoal.priority || userProfile.goals.length + 1,
      },
    };
    
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + (newGoal.deadline_months || 12));
    
    return {
      message: `I'll create a new goal for you:\n\n` +
        `**Goal:** ${newGoal.name}\n` +
        `**Target:** $${newGoal.target_amount.toLocaleString()}\n` +
        `**Deadline:** ${deadline.toLocaleDateString()} (${newGoal.deadline_months || 12} months)\n` +
        `**Priority:** ${newGoal.priority || userProfile.goals.length + 1}\n\n` +
        `To reach this goal, you'd need to save about **$${Math.round(newGoal.target_amount / (newGoal.deadline_months || 12)).toLocaleString()}/month**.\n\n` +
        `Would you like me to create this goal?`,
      summary: `Create goal: ${newGoal.name}`,
      suggestedFollowUps: [
        'Yes, create it',
        'No, cancel',
        'Change the target amount',
      ],
      shouldProceed: true,
      confidence: 'high',
    };
  }

  private async handleUpdateBudget(
    intent: ParsedIntent,
    userProfile: UserProfile,
    context: ConversationContext
  ): Promise<FormattedResponse> {
    const budgetUpdate = intent.budget_update;
    
    // Validate we have the required information
    if (!budgetUpdate?.category_name || !budgetUpdate?.new_amount) {
      const categories = userProfile.spendingCategories.map(c => c.name).join(', ');
      
      return {
        message: `I can help you update your budget! I need to know:\n\n` +
          `• Which category? (${categories})\n` +
          `• What's the new budget amount?\n\n` +
          `For example: "Set dining budget to $250" or "Increase groceries by $50"`,
        summary: 'Need budget details',
        suggestedFollowUps: [
          'Set dining budget to $250',
          'Increase groceries to $500',
          'Decrease entertainment by $50',
        ],
        shouldProceed: false,
        confidence: 'low',
      };
    }
    
    // Find current category
    const category = userProfile.spendingCategories.find(c => 
      c.name.toLowerCase() === budgetUpdate.category_name?.toLowerCase() ||
      c.id.toLowerCase() === budgetUpdate.category_name?.toLowerCase()
    );
    
    if (!category) {
      const categories = userProfile.spendingCategories.map(c => c.name).join(', ');
      return {
        message: `I couldn't find a budget category called "${budgetUpdate.category_name}".\n\n` +
          `Available categories: ${categories}\n\n` +
          `Try: "Set dining budget to $250"`,
        summary: 'Category not found',
        suggestedFollowUps: userProfile.spendingCategories.slice(0, 3).map(c => 
          `Update ${c.name} budget`
        ),
        shouldProceed: false,
        confidence: 'low',
      };
    }
    
    // Store pending action
    context.pendingAction = {
      type: 'update_budget',
      data: {
        categoryName: category.name,
        newAmount: budgetUpdate.new_amount,
        action: budgetUpdate.action || 'set',
      },
    };
    
    return {
      message: `I'll update your **${category.name}** budget:\n\n` +
        `**Current budget:** $${category.monthlyBudget.toLocaleString()}/month\n` +
        `**New budget:** $${budgetUpdate.new_amount.toLocaleString()}/month\n` +
        `**Change:** ${budgetUpdate.new_amount > category.monthlyBudget ? '+' : ''}$${(budgetUpdate.new_amount - category.monthlyBudget).toLocaleString()}\n\n` +
        `Would you like me to make this change?`,
      summary: `Update ${category.name} budget`,
      suggestedFollowUps: [
        'Yes, update it',
        'No, cancel',
        'Show all budgets',
      ],
      shouldProceed: true,
      confidence: 'high',
    };
  }

  private async handleExecuteAction(
    _intent: ParsedIntent,
    userProfile: UserProfile,
    context: ConversationContext,
    _useFastMode: boolean
  ): Promise<FormattedResponse> {
    // Check if there's a pending action to execute
    if (!context.pendingAction) {
      // Try to find the last suggested action from conversation
      const lastAction = this.extractLastSuggestedAction(context);
      
      if (!lastAction) {
        return {
          message: `I'm not sure what action you'd like me to execute. Could you be more specific?\n\n` +
            `For example:\n` +
            `• "Transfer $500 from checking to savings"\n` +
            `• "Create a goal for a car"\n` +
            `• "Invest $300 in my taxable account"`,
          summary: 'No pending action',
          suggestedFollowUps: [
            'Transfer $500 from checking to savings',
            'Save $300 toward my emergency fund',
            'Create a goal for a vacation',
          ],
          shouldProceed: false,
          confidence: 'low',
        };
      }
      
      // Use the last suggested action
      context.pendingAction = lastAction;
    }
    
    // Execute the pending action
    const pendingAction = context.pendingAction;
    const data = pendingAction.data;
    let result: ActionResult;
    
    switch (pendingAction.type) {
      case 'transfer':
        result = actionExecutor.executeTransfer(userProfile, {
          fromAccount: data.fromAccount as string,
          toAccount: data.toAccount as string,
          amount: data.amount as number,
        });
        break;
        
      case 'create_goal':
        result = actionExecutor.createGoal(userProfile, {
          name: data.name as string,
          targetAmount: data.targetAmount as number,
          deadlineMonths: data.deadlineMonths as number | undefined,
          priority: data.priority as number | undefined,
        });
        break;
        
      case 'update_budget':
        result = actionExecutor.updateBudget(userProfile, {
          categoryName: data.categoryName as string,
          newAmount: data.newAmount as number | undefined,
          action: (data.action as 'increase' | 'decrease' | 'set') || 'set',
        });
        break;
        
      case 'save':
      case 'invest':
      case 'spend':
        result = actionExecutor.executeSimulatedAction(
          userProfile,
          pendingAction.type as 'save' | 'invest' | 'spend',
          data.amount as number,
          data.goalId as string | undefined,
          data.targetAccount as string | undefined
        );
        break;
        
      default:
        result = { success: false, message: 'Unknown action type.' };
    }
    
    // Clear pending action after execution attempt
    context.pendingAction = undefined;
    
    // Return result
    if (result.success) {
      return {
        message: `✅ **Done!** ${result.message}\n\n${result.details || ''}\n\n` +
          (result.changes && result.changes.length > 0 
            ? `**Changes made:**\n${result.changes.map(c => `• ${c.field}: $${typeof c.oldValue === 'number' ? c.oldValue.toLocaleString() : c.oldValue} → $${typeof c.newValue === 'number' ? c.newValue.toLocaleString() : c.newValue}`).join('\n')}`
            : ''),
        summary: result.message,
        suggestedFollowUps: [
          'Check my goal progress',
          'What should I do next?',
          "Show my account balances",
        ],
        shouldProceed: true,
        confidence: 'high',
      };
    } else {
      return {
        message: `❌ **Could not complete:** ${result.message}\n\n` +
          `Would you like to try a different amount or action?`,
        summary: 'Action failed',
        suggestedFollowUps: [
          'Try a smaller amount',
          'Check my account balances',
          'What can I afford?',
        ],
        shouldProceed: false,
        confidence: 'high',
      };
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private getAccountBalance(user: UserProfile, accountName: string): number {
    switch (accountName.toLowerCase()) {
      case 'checking': return user.accounts.checking;
      case 'savings': return user.accounts.savings;
      default: return 0;
    }
  }

  private extractLastSuggestedAction(context: ConversationContext): { type: string; data: Record<string, unknown> } | null {
    // Look through recent assistant messages for suggested actions
    const recentMessages = context.messages.slice(-6).reverse();
    
    for (const msg of recentMessages) {
      if (msg.role !== 'assistant') continue;
      
      // Check for transfer suggestion
      const transferMatch = msg.content.match(/transfer\s+\*?\*?\$?([\d,]+)\*?\*?\s+from\s+\*?\*?(\w+)\*?\*?\s+to\s+\*?\*?(\w+)/i);
      if (transferMatch && transferMatch[1] && transferMatch[2] && transferMatch[3]) {
        return {
          type: 'transfer',
          data: {
            amount: parseFloat(transferMatch[1].replace(/,/g, '')),
            fromAccount: transferMatch[2],
            toAccount: transferMatch[3],
          },
        };
      }
      
      // Check for save/invest suggestion
      const actionMatch = msg.content.match(/(save|invest|saving|investing)\s+\*?\*?\$?([\d,]+)/i);
      if (actionMatch && actionMatch[1] && actionMatch[2]) {
        const type = actionMatch[1].toLowerCase().includes('invest') ? 'invest' : 'save';
        return {
          type,
          data: { amount: parseFloat(actionMatch[2].replace(/,/g, '')) },
        };
      }
    }
    
    return null;
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
