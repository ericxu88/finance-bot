import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { IntentParser, MockIntentParser } from './intent-parser.js';
import { conversationStore, resolveIntentWithContext, } from './conversation-memory.js';
import { formatAnalysisResponse, formatComparisonResponse, formatRecommendationResponse, formatGoalProgressResponse, formatClarificationResponse, } from './response-formatter.js';
import { simulate_save, simulate_invest, simulate_spend, compare_options, } from '../simulation-engine.js';
import { calculateHistoricalMetrics } from '../agents/historical-metrics.js';
import { LangChainAgentOrchestrator } from '../agents/langchain-orchestrator.js';
import { MockAgentOrchestrator } from '../agents/mock-orchestrator.js';
import { UnifiedAgent } from '../agents/unified-agent.js';
import { analyzeFinancialHealth, generateGoalSummary } from '../recommendation-engine.js';
import { actionExecutor } from './action-executor.js';
import { prioritizeMostRealisticGoal } from '../priority-goal/index.js';
import { runStabilization } from '../stabilization/index.js';
import { runIncreaseSavingsWithoutLifestyle } from '../savings-without-lifestyle/index.js';
export class ChatHandler {
    intentParser;
    useMockAgents;
    fastMode;
    constructor(options) {
        const openAiKey = process.env.OPEN_AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
        this.useMockAgents = !openAiKey || process.env.USE_MOCK_AGENTS === 'true';
        this.fastMode = options?.fastMode ?? (process.env.FAST_MODE === 'true');
        this.intentParser = this.useMockAgents
            ? new MockIntentParser()
            : new IntentParser();
    }
    async handleMessage(request) {
        const startTime = Date.now();
        const { message, userId, userProfile, fastMode: requestFastMode, parsedAction } = request;
        const useFastMode = requestFastMode ?? this.fastMode;
        let currentUserProfile = userProfile;
        let profileWasUpdated = false;
        let conversationId = request.conversationId || `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        let context = conversationStore.get(conversationId);
        if (!context) {
            context = conversationStore.create(conversationId, userId);
        }
        conversationStore.addMessage(conversationId, {
            role: 'user',
            content: message,
            timestamp: new Date(),
        });
        try {
            let intent;
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
            }
            else {
                const conversationHistory = context.messages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                }));
                console.log(`[ChatHandler] Parsing intent for: "${message.substring(0, 50)}..." (with ${conversationHistory.length} messages of context)`);
                intent = await this.intentParser.parse(message, userProfile, conversationHistory);
                const lower = message.toLowerCase().trim();
                const isPrioritizeGoalPhrase = (lower.includes('prioritize') && (lower.includes('realistic') || lower.includes('most realistic goal'))) ||
                    lower.includes('prioritize my most realistic goal') ||
                    (lower.includes('which goal') && (lower.includes('focus') || lower.includes('priorit')));
                if (isPrioritizeGoalPhrase && userProfile.goals?.length) {
                    intent = {
                        ...intent,
                        intent_type: 'prioritize_goal',
                        user_intent_summary: 'User wants to set their most realistic/achievable goal as priority.',
                    };
                }
                const isStabilizePhrase = lower.includes('stabilize') && (lower.includes('finances') || lower.includes('finance')) ||
                    lower.includes('stability mode') ||
                    (lower.includes('stabil') && (lower.includes('month') || lower.includes('cash flow')));
                if (isStabilizePhrase) {
                    intent = {
                        ...intent,
                        intent_type: 'stabilize_finances',
                        user_intent_summary: 'User wants to activate 30-day Financial Stability Mode (liquidity-first).',
                    };
                }
                const isIncreaseSavingsNoLifestylePhrase = (lower.includes('increase') && lower.includes('savings') && (lower.includes('lifestyle') || lower.includes('without lowering'))) ||
                    (lower.includes('save more') && lower.includes('lifestyle')) ||
                    (lower.includes('savings') && lower.includes('without') && lower.includes('lowering'));
                if (isIncreaseSavingsNoLifestylePhrase) {
                    intent = {
                        ...intent,
                        intent_type: 'increase_savings_no_lifestyle',
                        user_intent_summary: 'User wants to increase savings without reducing lifestyle spending.',
                    };
                }
                intent = resolveIntentWithContext(intent, context, userProfile);
            }
            console.log(`[ChatHandler] Intent: ${intent.intent_type}, confidence: ${intent.confidence}${useFastMode ? ' (FAST MODE)' : ''}`);
            let reply;
            let rawAnalysis = null;
            switch (intent.intent_type) {
                case 'simulate_action':
                    const result = await this.handleSimulateAction(intent, currentUserProfile, context, useFastMode);
                    reply = result.reply;
                    rawAnalysis = result.rawAnalysis;
                    break;
                case 'compare_options':
                    const compResult = await this.handleCompareOptions(intent, currentUserProfile);
                    reply = compResult.reply;
                    rawAnalysis = compResult.rawAnalysis;
                    break;
                case 'get_recommendation':
                    reply = await this.handleGetRecommendation(currentUserProfile);
                    break;
                case 'check_goal_progress':
                    reply = this.handleCheckGoalProgress(currentUserProfile);
                    break;
                case 'explain_tradeoffs':
                    reply = await this.handleExplainTradeoffs(intent, currentUserProfile);
                    break;
                case 'clarification_needed':
                    reply = formatClarificationResponse(intent.clarification_question || "Could you tell me more about what you'd like to do?", currentUserProfile);
                    break;
                case 'transfer_money':
                    reply = await this.handleTransferMoney(intent, currentUserProfile, context);
                    break;
                case 'create_goal':
                    reply = await this.handleCreateGoal(intent, currentUserProfile, context);
                    break;
                case 'update_budget':
                    reply = await this.handleUpdateBudget(intent, currentUserProfile, context);
                    break;
                case 'execute_action':
                    const executeResult = await this.handleExecuteAction(intent, currentUserProfile, context, useFastMode);
                    reply = executeResult.reply;
                    if (executeResult.updatedUserProfile) {
                        currentUserProfile = executeResult.updatedUserProfile;
                        profileWasUpdated = true;
                    }
                    break;
                case 'prioritize_goal':
                    const priorityResult = this.handlePrioritizeGoal(currentUserProfile);
                    reply = priorityResult.reply;
                    currentUserProfile = priorityResult.updatedUserProfile;
                    profileWasUpdated = true;
                    rawAnalysis = priorityResult.rawResult;
                    break;
                case 'stabilize_finances':
                    const stabilizeResult = this.handleStabilizeFinances(currentUserProfile);
                    reply = stabilizeResult.reply;
                    currentUserProfile = stabilizeResult.updatedUserProfile;
                    profileWasUpdated = true;
                    rawAnalysis = stabilizeResult.rawResult;
                    break;
                case 'increase_savings_no_lifestyle':
                    const savingsResult = this.handleIncreaseSavingsNoLifestyle(currentUserProfile);
                    reply = savingsResult.reply;
                    rawAnalysis = savingsResult.rawResult;
                    if (savingsResult.updatedUserProfile) {
                        currentUserProfile = savingsResult.updatedUserProfile;
                        profileWasUpdated = true;
                    }
                    break;
                case 'general_question':
                default:
                    reply = await this.handleGeneralQuestion(message, currentUserProfile, context);
                    break;
            }
            conversationStore.addMessage(conversationId, {
                role: 'assistant',
                content: reply.message,
                timestamp: new Date(),
                intent,
                analysisResult: rawAnalysis,
            });
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
                updatedUserProfile: profileWasUpdated ? currentUserProfile : undefined,
            };
        }
        catch (error) {
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
    async handleSimulateAction(intent, userProfile, context, useFastMode = false) {
        const action = intent.action;
        if (!action?.type || !action?.amount) {
            return {
                reply: formatClarificationResponse("I need a bit more detail. What action would you like to take and for how much? For example: 'invest $500' or 'save $300 for vacation'", userProfile),
                rawAnalysis: null,
            };
        }
        let goalId;
        if (action.goal_name) {
            const goal = userProfile.goals.find(g => g.name.toLowerCase().includes(action.goal_name.toLowerCase()));
            goalId = goal?.id;
        }
        const financialAction = {
            type: action.type,
            amount: action.amount,
            ...(goalId && { goalId }),
            ...(action.type === 'invest' && action.account_type && {
                targetAccountId: action.account_type
            }),
            ...(action.type === 'spend' && action.category && { category: action.category }),
        };
        let simulation;
        switch (action.type) {
            case 'save':
                simulation = simulate_save(userProfile, action.amount, goalId);
                break;
            case 'invest':
                const accountId = action.account_type || 'taxable';
                simulation = simulate_invest(userProfile, action.amount, accountId, goalId, action.time_horizon || 5);
                break;
            case 'spend':
                simulation = simulate_spend(userProfile, action.amount, action.category || 'general');
                break;
            default:
                throw new Error(`Unknown action type: ${action.type}`);
        }
        const historicalMetrics = calculateHistoricalMetrics(userProfile);
        if (useFastMode && !this.useMockAgents) {
            console.log(`[ChatHandler] Using FAST MODE (unified agent)`);
            const unifiedAgent = new UnifiedAgent();
            const unifiedResult = await unifiedAgent.analyze({
                user: userProfile,
                action: financialAction,
                simulationResult: simulation,
                historicalMetrics,
            });
            const reply = {
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
        const orchestrator = this.useMockAgents
            ? new MockAgentOrchestrator()
            : new LangChainAgentOrchestrator();
        const analysisResult = await orchestrator.processDecision({
            user: userProfile,
            action: financialAction,
            simulationResult: simulation,
            historicalMetrics,
        });
        context.lastAction = financialAction;
        const reply = formatAnalysisResponse(intent, simulation, analysisResult, userProfile);
        return {
            reply,
            rawAnalysis: {
                simulation,
                analysis: analysisResult,
            },
        };
    }
    async handleCompareOptions(intent, userProfile) {
        if (intent.options_to_compare && intent.options_to_compare.length > 0) {
            const options = intent.options_to_compare.map(opt => ({
                type: opt.type,
                amount: opt.amount,
            }));
            const simulations = compare_options(userProfile, options);
            const orchestrator = this.useMockAgents
                ? new MockAgentOrchestrator()
                : new LangChainAgentOrchestrator();
            const historicalMetrics = calculateHistoricalMetrics(userProfile);
            const analyzed = await Promise.all(simulations.map(async (sim) => {
                const analysis = await orchestrator.processDecision({
                    user: userProfile,
                    action: sim.action,
                    simulationResult: sim,
                    historicalMetrics,
                });
                return { action: sim, analysis };
            }));
            return {
                reply: formatComparisonResponse(analyzed, userProfile),
                rawAnalysis: analyzed,
            };
        }
        const amount = intent.mentioned_amounts[0] || 500;
        const goalId = intent.mentioned_goals[0]
            ? userProfile.goals.find(g => g.name.toLowerCase().includes(intent.mentioned_goals[0].toLowerCase()))?.id
            : userProfile.goals[0]?.id;
        const options = [
            { type: 'save', amount, goalId },
            { type: 'invest', amount, targetAccountId: 'taxable', goalId },
        ];
        const simulations = compare_options(userProfile, options);
        const orchestrator = this.useMockAgents
            ? new MockAgentOrchestrator()
            : new LangChainAgentOrchestrator();
        const historicalMetrics = calculateHistoricalMetrics(userProfile);
        const analyzed = await Promise.all(simulations.map(async (sim, index) => {
            const analysis = await orchestrator.processDecision({
                user: userProfile,
                action: options[index],
                simulationResult: sim,
                historicalMetrics,
            });
            return { action: sim, analysis };
        }));
        return {
            reply: formatComparisonResponse(analyzed, userProfile),
            rawAnalysis: analyzed,
        };
    }
    async handleGetRecommendation(userProfile) {
        const healthAnalysis = analyzeFinancialHealth(userProfile);
        let enhancedMessage = formatRecommendationResponse(healthAnalysis.recommendations, userProfile).message;
        const categoriesWithSpending = userProfile.spendingCategories
            .filter(cat => cat.currentSpent > 0)
            .map(cat => ({
            ...cat,
            percentUsed: cat.monthlyBudget > 0 ? (cat.currentSpent / cat.monthlyBudget * 100) : 0,
            overspent: cat.currentSpent > cat.monthlyBudget,
        }))
            .sort((a, b) => b.percentUsed - a.percentUsed);
        const highSpendingCategories = categoriesWithSpending.filter(cat => cat.percentUsed > 70);
        if (highSpendingCategories.length > 0) {
            enhancedMessage += `\n\n**💡 How to save $700/month:**\n`;
            enhancedMessage += `Based on your spending patterns, here are specific ways to reach your savings goal:\n\n`;
            let totalSavingsOpportunity = 0;
            highSpendingCategories.slice(0, 3).forEach(cat => {
                const emoji = cat.overspent ? '🔴' : cat.percentUsed > 80 ? '🟡' : '🟢';
                const potentialSavings = Math.min(Math.round(cat.currentSpent * 0.25), cat.currentSpent - cat.monthlyBudget + 50);
                totalSavingsOpportunity += potentialSavings;
                enhancedMessage += `${emoji} **${cat.name}:** Currently $${cat.currentSpent.toFixed(0)}/$${cat.monthlyBudget} (${cat.percentUsed.toFixed(0)}% used)\n`;
                const recentTxns = (cat.transactions || [])
                    .filter(t => t.type === 'expense')
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 2);
                if (recentTxns.length > 0) {
                    enhancedMessage += `   Recent: ${recentTxns.map(t => `${t.description} ($${Math.abs(t.amount).toFixed(0)})`).join(', ')}\n`;
                }
                enhancedMessage += `   💰 **Savings opportunity:** Reduce by $${potentialSavings}/month\n\n`;
            });
            if (totalSavingsOpportunity >= 500) {
                enhancedMessage += `✅ By making these adjustments, you could save **$${totalSavingsOpportunity}/month** toward your Emergency Fund goal!\n`;
            }
            else {
                enhancedMessage += `By reducing spending in these areas plus your monthly surplus, you can reach your $700/month savings target.\n`;
            }
        }
        return {
            message: enhancedMessage,
            summary: formatRecommendationResponse(healthAnalysis.recommendations, userProfile).summary,
            suggestedFollowUps: [
                'How can I reduce my dining expenses?',
                'Should I save $700 toward my emergency fund?',
                'Show me my budget breakdown',
            ],
            shouldProceed: true,
            confidence: 'high',
        };
    }
    handleCheckGoalProgress(userProfile) {
        const goalSummaries = generateGoalSummary(userProfile);
        return formatGoalProgressResponse(goalSummaries);
    }
    async handleExplainTradeoffs(intent, userProfile) {
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
    handlePrioritizeGoal(userProfile) {
        const result = prioritizeMostRealisticGoal(userProfile, { persist: () => { } });
        const lines = [result.explanation];
        if (result.capital_reallocations.length > 0) {
            lines.push('\n**Suggested reallocations:** ' +
                result.capital_reallocations
                    .map((r) => `$${r.amount} from ${r.from} → ${r.to}`)
                    .join('; '));
        }
        return {
            reply: {
                message: lines.join('\n\n'),
                summary: `Priority goal set to "${result.priority_goal.name}"`,
                suggestedFollowUps: [
                    'Should I invest $500 for my priority goal?',
                    'Show me my goals',
                    'What should I do with my extra money?',
                ],
                shouldProceed: true,
                confidence: 'high',
            },
            updatedUserProfile: result.updatedUserProfile,
            rawResult: result,
        };
    }
    handleStabilizeFinances(userProfile) {
        const result = runStabilization(userProfile, { persist: () => { } });
        const before = result.before;
        const after = result.after;
        const lines = [
            result.explanation,
            '',
            `**Before:** Checking $${before.checking.toFixed(0)} · Savings $${before.savings.toFixed(0)} · Total liquid $${before.totalLiquid.toFixed(0)}`,
            `**After:** Checking $${after.checking.toFixed(0)} · Savings $${after.savings.toFixed(0)} · Total liquid $${after.totalLiquid.toFixed(0)}`,
        ];
        return {
            reply: {
                message: lines.join('\n\n'),
                summary: 'Financial Stability Mode is now active for 30 days.',
                suggestedFollowUps: [
                    'Cancel stability mode',
                    'Show my balances',
                    'What changed?',
                ],
                shouldProceed: true,
                confidence: 'high',
            },
            updatedUserProfile: result.updatedUserProfile,
            rawResult: result,
        };
    }
    handleIncreaseSavingsNoLifestyle(userProfile) {
        const result = runIncreaseSavingsWithoutLifestyle(userProfile);
        const lines = [
            result.explanation,
            '',
            `**Protected (lifestyle):** ${result.protected_categories.length ? result.protected_categories.join(', ') : 'None detected'}`,
            '',
            '**Actions:**',
            ...result.actions.map((a) => `- ${a.type}: $${a.amount.toFixed(0)} from ${a.from} → ${a.to}. ${a.reason}`),
            '',
            `**Account balances:** Unchanged (only budget thresholds were lowered). Checking $${result.updated_balances_projection.checking.toFixed(0)} · Savings $${result.updated_balances_projection.savings.toFixed(0)} · Investments $${result.updated_balances_projection.investments.toFixed(0)}`,
        ];
        return {
            reply: {
                message: lines.join('\n\n'),
                summary: 'Savings increase plan without lowering lifestyle.',
                suggestedFollowUps: [
                    'Apply these reallocations',
                    'Show my current budgets',
                    'What counts as lifestyle spending?',
                ],
                shouldProceed: true,
                confidence: 'high',
            },
            rawResult: result,
            updatedUserProfile: result.updatedUserProfile,
        };
    }
    async handleGeneralQuestion(message, userProfile, context) {
        if (!this.useMockAgents) {
            try {
                const llmReply = await this.answerGeneralQuestionWithLLM(message, userProfile, context);
                if (llmReply) {
                    return llmReply;
                }
            }
            catch (err) {
                console.error('[ChatHandler] LLM general answer failed, falling back to template:', err);
            }
        }
        const healthAnalysis = analyzeFinancialHealth(userProfile);
        const goalSummaries = generateGoalSummary(userProfile);
        const isAskingAboutSpending = /spend|budget|money|expense|cost|afford|save|cut|reduce/i.test(message);
        let response = "I'm here to help you make smart financial decisions. Here's your financial overview:\n\n";
        response += `**Financial Health:** ${healthAnalysis.overallHealth}\n`;
        response += `**Monthly Surplus:** $${healthAnalysis.monthlySurplus.toLocaleString()}\n`;
        response += `**Goals on Track:** ${goalSummaries.filter(g => g.status === 'on_track' || g.status === 'completed').length}/${goalSummaries.length}\n\n`;
        if (isAskingAboutSpending && userProfile.spendingCategories?.length) {
            response += `**📊 Spending Analysis:**\n`;
            const categoriesWithSpending = userProfile.spendingCategories
                .filter(cat => cat.currentSpent > 0)
                .map(cat => ({
                ...cat,
                percentUsed: cat.monthlyBudget > 0 ? (cat.currentSpent / cat.monthlyBudget * 100) : 0,
                overspent: cat.currentSpent > cat.monthlyBudget,
            }))
                .sort((a, b) => b.percentUsed - a.percentUsed);
            categoriesWithSpending.slice(0, 3).forEach(cat => {
                const emoji = cat.overspent ? '🔴' : cat.percentUsed > 70 ? '🟡' : '🟢';
                response += `${emoji} **${cat.name}:** $${cat.currentSpent.toFixed(0)}/$${cat.monthlyBudget} (${cat.percentUsed.toFixed(0)}% used)\n`;
            });
            response += '\n';
        }
        response += "**I can help you:**\n";
        response += "• **Analyze spending:** 'Where am I spending too much?'\n";
        response += "• **Simulate actions:** 'Should I invest $500?'\n";
        response += "• **Compare options:** 'Save $500 vs invest $500'\n";
        response += "• **Get recommendations:** 'What should I do with my extra money?'\n";
        response += "• **Check progress:** 'How are my goals doing?'\n";
        return {
            message: response,
            summary: 'Financial overview and insights',
            suggestedFollowUps: isAskingAboutSpending
                ? ['How can I reduce my spending?', 'What should I do with my surplus?', 'Show me where I can save money']
                : ['What should I do with my extra money?', 'Where am I spending too much?', 'How are my goals progressing?'],
            shouldProceed: true,
            confidence: 'high',
        };
    }
    async answerGeneralQuestionWithLLM(message, userProfile, context) {
        const apiKey = process.env.OPEN_AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
        if (!apiKey)
            return null;
        const healthAnalysis = analyzeFinancialHealth(userProfile);
        const goalSummaries = generateGoalSummary(userProfile);
        const goalsText = goalSummaries
            .map(g => `- ${g.goalName}: $${g.currentAmount.toLocaleString()} / $${g.targetAmount.toLocaleString()} (${g.status})`)
            .join('\n');
        const systemPrompt = `You are a helpful financial assistant for a banking app. Answer the user's question in a clear, friendly way. Use their financial context when relevant.

**User's financial context:**
- Monthly income: $${userProfile.monthlyIncome.toLocaleString()}
- Financial health: ${healthAnalysis.overallHealth}
- Monthly surplus: $${healthAnalysis.monthlySurplus.toLocaleString()}
- Goals: ${goalsText || 'None set'}

Keep answers concise (2–4 short paragraphs). If they ask something you can't do (e.g. real-time market data), say so and suggest what you can help with (e.g. goals, saving, investing, budget). Do not repeat a generic menu unless they ask "what can you do?".`;
        const model = new ChatOpenAI({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            temperature: 0.5,
            apiKey,
            maxTokens: 1024,
        });
        const chatMessages = [
            new SystemMessage(systemPrompt),
        ];
        const recent = context.messages.slice(-6);
        for (const m of recent) {
            if (m.role === 'user') {
                chatMessages.push(new HumanMessage(m.content));
            }
            else {
                chatMessages.push(new AIMessage(m.content));
            }
        }
        chatMessages.push(new HumanMessage(message));
        const result = await model.invoke(chatMessages);
        const text = typeof result.content === 'string' ? result.content : result.content?.[0]?.text ?? '';
        if (!text?.trim())
            return null;
        return {
            message: text.trim(),
            summary: 'Answer to your question',
            suggestedFollowUps: [
                'What should I do with my extra money?',
                'Should I invest $500?',
                'How are my goals doing?',
            ],
            shouldProceed: true,
            confidence: 'high',
        };
    }
    async handleTransferMoney(intent, userProfile, context) {
        const transfer = intent.transfer;
        if (!transfer?.from_account || !transfer?.to_account || !transfer?.amount) {
            const missing = [];
            if (!transfer?.amount)
                missing.push('amount');
            if (!transfer?.from_account)
                missing.push('source account (checking or savings)');
            if (!transfer?.to_account)
                missing.push('destination account');
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
        context.pendingAction = {
            type: 'transfer',
            data: {
                fromAccount: transfer.from_account,
                toAccount: transfer.to_account,
                amount: transfer.amount,
            },
        };
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
    async handleCreateGoal(intent, userProfile, context) {
        const newGoal = intent.new_goal;
        if (!newGoal?.name || !newGoal?.target_amount) {
            const missing = [];
            if (!newGoal?.name)
                missing.push('goal name (e.g., "New Car", "Vacation")');
            if (!newGoal?.target_amount)
                missing.push('target amount');
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
    async handleUpdateBudget(intent, userProfile, context) {
        const budgetUpdate = intent.budget_update;
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
        const category = userProfile.spendingCategories.find(c => c.name.toLowerCase() === budgetUpdate.category_name?.toLowerCase() ||
            c.id.toLowerCase() === budgetUpdate.category_name?.toLowerCase());
        if (!category) {
            const categories = userProfile.spendingCategories.map(c => c.name).join(', ');
            return {
                message: `I couldn't find a budget category called "${budgetUpdate.category_name}".\n\n` +
                    `Available categories: ${categories}\n\n` +
                    `Try: "Set dining budget to $250"`,
                summary: 'Category not found',
                suggestedFollowUps: userProfile.spendingCategories.slice(0, 3).map(c => `Update ${c.name} budget`),
                shouldProceed: false,
                confidence: 'low',
            };
        }
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
    async handleExecuteAction(_intent, userProfile, context, _useFastMode) {
        if (!context.pendingAction) {
            const lastAction = this.extractLastSuggestedAction(context);
            if (!lastAction) {
                return {
                    reply: {
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
                    },
                    updatedUserProfile: undefined,
                };
            }
            context.pendingAction = lastAction;
        }
        const pendingAction = context.pendingAction;
        const data = pendingAction.data;
        let result;
        switch (pendingAction.type) {
            case 'transfer':
                result = actionExecutor.executeTransfer(userProfile, {
                    fromAccount: data.fromAccount,
                    toAccount: data.toAccount,
                    amount: data.amount,
                });
                break;
            case 'create_goal':
                result = actionExecutor.createGoal(userProfile, {
                    name: data.name,
                    targetAmount: data.targetAmount,
                    deadlineMonths: data.deadlineMonths,
                    priority: data.priority,
                });
                break;
            case 'update_budget':
                result = actionExecutor.updateBudget(userProfile, {
                    categoryName: data.categoryName,
                    newAmount: data.newAmount,
                    action: data.action || 'set',
                });
                break;
            case 'save':
            case 'invest':
            case 'spend':
                result = actionExecutor.executeSimulatedAction(userProfile, pendingAction.type, data.amount, data.goalId, data.targetAccount);
                break;
            default:
                result = { success: false, message: 'Unknown action type.' };
        }
        context.pendingAction = undefined;
        if (result.success) {
            return {
                reply: {
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
                },
                updatedUserProfile: result.updatedUser,
            };
        }
        else {
            return {
                reply: {
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
                },
                updatedUserProfile: undefined,
            };
        }
    }
    getAccountBalance(user, accountName) {
        switch (accountName.toLowerCase()) {
            case 'checking': return user.accounts.checking;
            case 'savings': return user.accounts.savings;
            default: return 0;
        }
    }
    extractLastSuggestedAction(context) {
        const recentMessages = context.messages.slice(-6).reverse();
        for (const msg of recentMessages) {
            if (msg.role !== 'assistant')
                continue;
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
    formatUnifiedResponse(result, simulation, userProfile) {
        const action = simulation.action;
        const goalName = action.goalId
            ? userProfile.goals.find(g => g.id === action.goalId)?.name
            : null;
        let message = '';
        if (result.recommendation === 'proceed') {
            message = `Great news! ${action.type.charAt(0).toUpperCase() + action.type.slice(1)}ing $${action.amount.toLocaleString()}${goalName ? ` for ${goalName}` : ''} looks solid.\n\n`;
        }
        else if (result.recommendation === 'proceed_with_caution') {
            message = `${action.type.charAt(0).toUpperCase() + action.type.slice(1)}ing $${action.amount.toLocaleString()}${goalName ? ` for ${goalName}` : ''} could work, with some considerations.\n\n`;
        }
        else {
            message = `I'd recommend holding off on ${action.type}ing $${action.amount.toLocaleString()} right now.\n\n`;
        }
        message += `**Budget:** ${result.budget_assessment.monthly_impact}\n`;
        if (result.budget_assessment.key_concern) {
            message += `⚠️ ${result.budget_assessment.key_concern}\n`;
        }
        message += '\n';
        if (action.type === 'invest') {
            message += `**Investment:** ${result.investment_assessment.projected_growth}\n`;
            message += `Risk alignment: ${result.investment_assessment.risk_alignment}\n\n`;
        }
        if (result.spending_insights && (result.spending_insights.overspending_categories.length > 0 || result.spending_insights.opportunities_to_save)) {
            message += `**📊 Spending Analysis:**\n`;
            if (result.spending_insights.overspending_categories.length > 0) {
                message += `High spending in: ${result.spending_insights.overspending_categories.join(', ')}\n`;
            }
            if (result.spending_insights.opportunities_to_save) {
                message += `💡 ${result.spending_insights.opportunities_to_save}`;
                if (result.spending_insights.estimated_monthly_savings) {
                    message += ` (save ~$${result.spending_insights.estimated_monthly_savings}/month)`;
                }
                message += '\n';
            }
            message += '\n';
        }
        if (!result.guardrail_assessment.passes_all) {
            message += `**⚠️ Guardrail Violations:**\n`;
            result.guardrail_assessment.violations.forEach(v => {
                message += `• ${v}\n`;
            });
            message += '\n';
        }
        message += `**My recommendation:** ${result.explanation}`;
        if (result.suggested_alternative) {
            message += `\n\n💡 **Alternative:** ${result.suggested_alternative}`;
        }
        return message;
    }
}
export const chatHandler = new ChatHandler();
//# sourceMappingURL=chat-handler.js.map