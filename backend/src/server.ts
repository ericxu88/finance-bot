import express from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

import {
  simulate_save,
  simulate_invest,
  simulate_spend,
  compare_options,
} from '../lib/simulation-engine.js';
import { sampleUser } from '../lib/sample-data.js';
import { calculateHistoricalMetrics } from '../lib/agents/historical-metrics.js';
import { LangChainAgentOrchestrator } from '../lib/agents/langchain-orchestrator.js';
import { MockAgentOrchestrator } from '../lib/agents/mock-orchestrator.js';
import { analyzeFinancialHealth, generateGoalSummary } from '../lib/recommendation-engine.js';
import { demoScenarios, getScenarioById } from '../lib/demo-scenarios.js';
import { ChatHandler } from '../lib/chat/chat-handler.js';
import type { UserProfile, FinancialAction } from '../types/financial.js';

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json({ limit: '1mb' }));

const dateSchema = z.preprocess((value) => {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return value;
}, z.date());

const guardrailSchema = z.object({
  id: z.string().min(1),
  rule: z.string().min(1),
  type: z.enum(['min_balance', 'max_investment_pct', 'protected_account']),
  accountId: z.string().min(1).optional(),
  threshold: z.number().optional(),
});

const transactionSchema = z.object({
  id: z.string().min(1),
  date: dateSchema,
  amount: z.number(),
  category: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(['expense', 'income', 'transfer']),
});

const spendingCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  monthlyBudget: z.number().nonnegative(),
  currentSpent: z.number().nonnegative(),
  transactions: z.array(transactionSchema),
});

const fixedExpenseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  amount: z.number().nonnegative(),
  frequency: z.enum(['monthly', 'annual']),
  dueDay: z.number().int().min(1).max(31).optional(),
});

const goalSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  targetAmount: z.number().nonnegative(),
  currentAmount: z.number().nonnegative(),
  deadline: dateSchema,
  priority: z.number().int().min(1).max(5),
  timeHorizon: z.enum(['short', 'medium', 'long']),
  linkedAccountIds: z.array(z.string().min(1)),
});

const accountsSchema = z.object({
  checking: z.number().nonnegative(),
  savings: z.number().nonnegative(),
  investments: z.object({
    taxable: z.number().nonnegative(),
    rothIRA: z.number().nonnegative(),
    traditional401k: z.number().nonnegative(),
  }),
});

const preferencesSchema = z.object({
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
  liquidityPreference: z.enum(['high', 'medium', 'low']),
  guardrails: z.array(guardrailSchema),
});

const userProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  monthlyIncome: z.number().nonnegative(),
  accounts: accountsSchema,
  fixedExpenses: z.array(fixedExpenseSchema),
  spendingCategories: z.array(spendingCategorySchema),
  goals: z.array(goalSchema),
  preferences: preferencesSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

const simulateActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('save'),
    amount: z.number().positive(),
    goalId: z.string().min(1).optional(),
  }),
  z.object({
    type: z.literal('invest'),
    amount: z.number().positive(),
    targetAccountId: z.enum(['taxable', 'rothIRA', 'traditional401k']),
    goalId: z.string().min(1).optional(),
    timeHorizon: z.number().int().positive().max(100).optional(),
  }),
  z.object({
    type: z.literal('spend'),
    amount: z.number().positive(),
    category: z.string().min(1),
  }),
]);

const simulateRequestSchema = z.object({
  user: userProfileSchema,
  action: simulateActionSchema,
});

const compareRequestSchema = z.object({
  user: userProfileSchema,
  options: z.array(simulateActionSchema).min(1),
});

const recommendRequestSchema = z.object({
  user: userProfileSchema,
  evaluateWithAgents: z.boolean().optional().default(false),
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

app.post('/simulate', (req: Request, res: Response) => {
  const parsed = simulateRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid request payload',
      details: parsed.error.flatten(),
    });
  }

  const { user, action } = parsed.data;

  const result = (() => {
    switch (action.type) {
      case 'save':
        return simulate_save(user, action.amount, action.goalId);
      case 'invest':
        return simulate_invest(
          user,
          action.amount,
          action.targetAccountId,
          action.goalId,
          action.timeHorizon ?? 5
        );
      case 'spend':
        return simulate_spend(user, action.amount, action.category);
      default:
        return null;
    }
  })();

  if (!result) {
    return res.status(400).json({ error: 'Unsupported action type' });
  }

  return res.status(200).json(result);
});

app.post('/compare', (req: Request, res: Response) => {
  const parsed = compareRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid request payload',
      details: parsed.error.flatten(),
    });
  }

  const { user, options } = parsed.data;
  const results = compare_options(user, options);

  return res.status(200).json(results);
});

app.get('/sample', (_req: Request, res: Response) => {
  return res.status(200).json(sampleUser);
});

app.get('/api-docs', (_req: Request, res: Response) => {
  // Return OpenAPI spec as JSON
  try {
    const specPath = path.join(process.cwd(), 'backend', 'api', 'openapi.yaml');
    const specContent = fs.readFileSync(specPath, 'utf8');
    const spec = yaml.load(specContent);
    res.status(200).json(spec);
  } catch (error) {
    console.error('Error loading API docs:', error);
    res.status(500).json({ error: 'Failed to load API documentation' });
  }
});

app.get('/demo/scenarios', (_req: Request, res: Response) => {
  // Return all demo scenarios for hackathon presentations
  return res.status(200).json({
    scenarios: demoScenarios.map(scenario => ({
      id: scenario.id,
      name: scenario.name,
      persona: scenario.persona,
      description: scenario.description,
      highlights: scenario.highlights,
      user: scenario.user,
      suggestedActions: scenario.suggestedActions,
    })),
    metadata: {
      totalScenarios: demoScenarios.length,
      timestamp: new Date().toISOString(),
    },
  });
});

app.get('/demo/scenarios/:id', (req: Request, res: Response) => {
  const scenarioId = req.params.id;
  if (!scenarioId) {
    return res.status(400).json({ error: 'Scenario ID required' });
  }
  const scenario = getScenarioById(scenarioId);
  if (!scenario) {
    return res.status(404).json({ error: 'Scenario not found' });
  }
  return res.status(200).json(scenario);
});

app.post('/recommend', async (req: Request, res: Response) => {
  const parsed = recommendRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid request payload',
      details: parsed.error.flatten(),
    });
  }

  const { user, evaluateWithAgents } = parsed.data;

  try {
    // Step 1: Analyze financial health and generate recommendations
    const healthAnalysis = analyzeFinancialHealth(user);
    const recommendations = healthAnalysis.recommendations;

    // Step 2: Optionally evaluate top recommendations with agents
    let evaluatedRecommendations = recommendations;
    if (evaluateWithAgents && recommendations.length > 0) {
      const openAiKey = process.env.OPEN_AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
      const useMockAgents = !openAiKey || process.env.USE_MOCK_AGENTS === 'true';
      const orchestrator = useMockAgents
        ? new MockAgentOrchestrator()
        : new LangChainAgentOrchestrator();

      // Evaluate top 3 recommendations
      const topRecommendations = recommendations.slice(0, 3);
      const evaluations = await Promise.all(
        topRecommendations.map(async (rec) => {
          try {
            // Run simulation for this recommendation
            let simulationResult;
            switch (rec.action.type) {
              case 'save':
                simulationResult = simulate_save(user, rec.action.amount, rec.action.goalId);
                break;
              case 'invest':
                if (!rec.action.targetAccountId) {
                  throw new Error('Invest action requires targetAccountId');
                }
                simulationResult = simulate_invest(
                  user,
                  rec.action.amount,
                  rec.action.targetAccountId as 'taxable' | 'rothIRA' | 'traditional401k',
                  rec.action.goalId,
                  rec.timeHorizon ?? 5
                );
                break;
              case 'spend':
                if (!rec.action.category) {
                  throw new Error('Spend action requires category');
                }
                simulationResult = simulate_spend(user, rec.action.amount, rec.action.category);
                break;
            }

            const historicalMetrics = calculateHistoricalMetrics(user);
            const analysisResult = await orchestrator.processDecision({
              user: user as UserProfile,
              action: rec.action as FinancialAction,
              simulationResult,
              historicalMetrics,
            });

            return {
              ...rec,
              agentAnalysis: analysisResult,
              agentScore: analysisResult.shouldProceed
                ? analysisResult.overallConfidence === 'high'
                  ? 5
                  : analysisResult.overallConfidence === 'medium'
                    ? 4
                    : 3
                : 2,
            };
          } catch (error) {
            console.error(`Error evaluating recommendation:`, error);
            return {
              ...rec,
              agentAnalysis: null,
              agentScore: rec.priority,
            };
          }
        })
      );

      // Sort by agent score (if available) or priority
      evaluatedRecommendations = [
        ...evaluations.sort((a, b) => (b.agentScore || b.priority) - (a.agentScore || a.priority)),
        ...recommendations.slice(3), // Keep remaining recommendations
      ];
    }

    return res.status(200).json({
      financialHealth: {
        overallHealth: healthAnalysis.overallHealth,
        monthlySurplus: healthAnalysis.monthlySurplus,
        emergencyFundStatus: healthAnalysis.emergencyFundStatus,
        goalProgress: healthAnalysis.goalProgress,
      },
      recommendations: evaluatedRecommendations,
      metadata: {
        totalRecommendations: recommendations.length,
        evaluatedWithAgents: evaluateWithAgents,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in /recommend endpoint:', error);
    return res.status(500).json({
      error: 'Recommendation generation failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

const goalsSummaryRequestSchema = z.object({
  user: userProfileSchema,
});

app.post('/goals/summary', (req: Request, res: Response) => {
  const parsed = goalsSummaryRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid request payload',
      details: parsed.error.flatten(),
    });
  }

  const { user } = parsed.data;

  try {
    const goalSummaries = generateGoalSummary(user);
    const healthAnalysis = analyzeFinancialHealth(user);

    // Calculate aggregate statistics
    const totalTargeted = goalSummaries.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSaved = goalSummaries.reduce((sum, g) => sum + g.currentAmount, 0);
    const overallProgress = totalTargeted > 0 ? (totalSaved / totalTargeted) * 100 : 0;

    const goalsOnTrack = goalSummaries.filter(g => g.status === 'on_track' || g.status === 'completed').length;
    const goalsAtRisk = goalSummaries.filter(g => g.status === 'at_risk').length;

    return res.status(200).json({
      summary: {
        totalGoals: goalSummaries.length,
        goalsOnTrack,
        goalsBehind: goalSummaries.filter(g => g.status === 'behind').length,
        goalsAtRisk,
        goalsCompleted: goalSummaries.filter(g => g.status === 'completed').length,
        totalTargeted: Math.round(totalTargeted * 100) / 100,
        totalSaved: Math.round(totalSaved * 100) / 100,
        overallProgress: Math.round(overallProgress * 10) / 10,
        monthlySurplus: healthAnalysis.monthlySurplus,
      },
      goals: goalSummaries,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in /goals/summary endpoint:', error);
    return res.status(500).json({
      error: 'Goal summary generation failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post('/analyze', async (req: Request, res: Response) => {
  const parsed = simulateRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid request payload',
      details: parsed.error.flatten(),
    });
  }

  const { user, action } = parsed.data;

  try {
    // Step 1: Run simulation
    let simulationResult;
    switch (action.type) {
      case 'save':
        simulationResult = simulate_save(user, action.amount, action.goalId);
        break;
      case 'invest':
        simulationResult = simulate_invest(
          user,
          action.amount,
          action.targetAccountId,
          action.goalId,
          action.timeHorizon ?? 5
        );
        break;
      case 'spend':
        simulationResult = simulate_spend(user, action.amount, action.category);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported action type' });
    }

    // Step 2: Calculate historical metrics
    const historicalMetrics = calculateHistoricalMetrics(user);

    // Step 3: Run agent analysis (use mock if no API key, real if available)
    const openAiKey = process.env.OPEN_AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
    const useMockAgents = !openAiKey || process.env.USE_MOCK_AGENTS === 'true';
    const orchestrator = useMockAgents
      ? new MockAgentOrchestrator()
      : new LangChainAgentOrchestrator();

    const analysisResult = await orchestrator.processDecision({
      user: user as UserProfile,
      action: action as FinancialAction,
      simulationResult,
      historicalMetrics,
    });

    // Step 4: Return combined result
    return res.status(200).json({
      simulation: simulationResult,
      analysis: analysisResult,
      metadata: {
        usedMockAgents: useMockAgents,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in /analyze endpoint:', error);
    return res.status(500).json({
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// Streaming analyze endpoint using Server-Sent Events
app.post('/analyze/stream', async (req: Request, res: Response): Promise<void> => {
  const parsed = simulateRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid request payload',
      details: parsed.error.flatten(),
    });
    return;
  }

  const { user, action } = parsed.data;

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const startTime = Date.now();

    // Step 1: Run simulation (instant)
    sendEvent('status', { stage: 'simulation', message: 'Running simulation...' });

    let simulationResult;
    switch (action.type) {
      case 'save':
        simulationResult = simulate_save(user, action.amount, action.goalId);
        break;
      case 'invest':
        simulationResult = simulate_invest(
          user,
          action.amount,
          action.targetAccountId,
          action.goalId,
          action.timeHorizon ?? 5
        );
        break;
      case 'spend':
        simulationResult = simulate_spend(user, action.amount, action.category);
        break;
      default:
        sendEvent('error', { message: 'Unsupported action type' });
        res.end();
        return;
    }

    sendEvent('simulation', { result: simulationResult, elapsed: Date.now() - startTime });

    // Step 2: Calculate historical metrics (instant)
    const historicalMetrics = calculateHistoricalMetrics(user);
    sendEvent('status', { stage: 'metrics', message: 'Calculated historical metrics' });

    // Step 3: Check if using mock or real agents
    const openAiKey = process.env.OPEN_AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
    const useMockAgents = !openAiKey || process.env.USE_MOCK_AGENTS === 'true';

    if (useMockAgents) {
      // Mock mode - instant results
      sendEvent('status', { stage: 'agents', message: 'Using mock agents (instant)' });
      const orchestrator = new MockAgentOrchestrator();
      const analysisResult = await orchestrator.processDecision({
        user: user as UserProfile,
        action: action as FinancialAction,
        simulationResult,
        historicalMetrics,
      });
      sendEvent('complete', {
        simulation: simulationResult,
        analysis: analysisResult,
        metadata: { usedMockAgents: true, elapsed: Date.now() - startTime },
      });
    } else {
      // Real AI agents - stream each result as it completes
      sendEvent('status', { stage: 'agents', message: 'Starting AI agent analysis...' });

      const context = {
        user: user as UserProfile,
        action: action as FinancialAction,
        simulationResult,
        historicalMetrics,
      };

      // Import agents dynamically to avoid issues if no API key
      const { LangChainBudgetingAgent } = await import('../lib/agents/langchain-budgeting-agent.js');
      const { LangChainInvestmentAgent } = await import('../lib/agents/langchain-investment-agent.js');
      const { LangChainGuardrailAgent } = await import('../lib/agents/langchain-guardrail-agent.js');
      const { LangChainValidationAgent } = await import('../lib/agents/langchain-validation-agent.js');

      // Phase 1: Run specialized agents in parallel, stream as each completes
      sendEvent('status', { stage: 'phase1', message: 'Phase 1: Running specialized agents...' });

      const budgetingAgent = new LangChainBudgetingAgent();
      const investmentAgent = new LangChainInvestmentAgent();
      const guardrailAgent = new LangChainGuardrailAgent();

      // Create promises that send events when they complete
      const budgetingPromise = budgetingAgent.analyze(context).then(result => {
        sendEvent('agent', { agent: 'budgeting', result, elapsed: Date.now() - startTime });
        return result;
      });

      const investmentPromise = investmentAgent.analyze(context).then(result => {
        sendEvent('agent', { agent: 'investment', result, elapsed: Date.now() - startTime });
        return result;
      });

      const guardrailPromise = guardrailAgent.analyze(context).then(result => {
        sendEvent('agent', { agent: 'guardrail', result, elapsed: Date.now() - startTime });
        return result;
      });

      // Wait for all Phase 1 agents
      const [budgetingAnalysis, investmentAnalysis, guardrailAnalysis] = await Promise.all([
        budgetingPromise,
        investmentPromise,
        guardrailPromise,
      ]);

      // Phase 2: Validation agent
      sendEvent('status', { stage: 'phase2', message: 'Phase 2: Running validation agent...' });

      const validationAgent = new LangChainValidationAgent();
      const validationAnalysis = await validationAgent.analyzeWithAgentOutputs(
        context,
        { budgetingAnalysis, investmentAnalysis, guardrailAnalysis }
      );

      sendEvent('agent', { agent: 'validation', result: validationAnalysis, elapsed: Date.now() - startTime });

      // Build final result
      const shouldProceed =
        validationAnalysis.overall_recommendation === 'proceed_confidently' ||
        validationAnalysis.overall_recommendation === 'proceed' ||
        (validationAnalysis.overall_recommendation === 'proceed_with_caution' && guardrailAnalysis.can_proceed);

      const analysisResult = {
        budgetingAnalysis,
        investmentAnalysis,
        guardrailAnalysis,
        validationAnalysis,
        finalRecommendation: validationAnalysis.final_summary,
        overallConfidence: validationAnalysis.overall_confidence,
        shouldProceed,
        executionTime: Date.now() - startTime,
      };

      sendEvent('complete', {
        simulation: simulationResult,
        analysis: analysisResult,
        metadata: { usedMockAgents: false, elapsed: Date.now() - startTime },
      });
    }

    res.end();
  } catch (error) {
    console.error('Error in /analyze/stream endpoint:', error);
    sendEvent('error', { message: error instanceof Error ? error.message : String(error) });
    res.end();
  }
});

// =============================================================================
// CHAT ENDPOINTS
// =============================================================================

const chatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  userId: z.string().min(1).default('default_user'),
  conversationId: z.string().optional(),
  userProfile: userProfileSchema.optional(),
  /** Use fast mode: single LLM call instead of multi-agent (5 calls). ~4x faster. */
  fastMode: z.boolean().optional().default(false),
  /** Skip intent parsing by providing the structured action directly */
  parsedAction: z.object({
    type: z.enum(['save', 'invest', 'spend']),
    amount: z.number().positive(),
    goalId: z.string().optional(),
    targetAccountId: z.enum(['taxable', 'rothIRA', 'traditional401k']).optional(),
  }).optional(),
});

// Initialize chat handler
const chatHandler = new ChatHandler();

/**
 * POST /chat
 * 
 * Chat-based interface for financial decision making.
 * Users can ask questions in natural language and receive conversational responses.
 * 
 * Examples:
 * - "Should I invest $500 for my house fund?"
 * - "What happens if I save $300?"
 * - "Compare saving vs investing"
 * - "What should I do with extra money?"
 * - "How are my goals doing?"
 */
app.post('/chat', async (req: Request, res: Response) => {
  const parsed = chatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid request payload',
      details: parsed.error.flatten(),
    });
  }

  const { message, userId, conversationId, userProfile, fastMode, parsedAction } = parsed.data;

  // Use provided profile or fall back to sample user for demos
  const profile = userProfile || sampleUser;

  try {
    const response = await chatHandler.handleMessage({
      message,
      userId,
      conversationId,
      userProfile: profile,
      fastMode,
      parsedAction,
    });

    return res.status(200).json({
      conversationId: response.conversationId,
      reply: response.reply.message,
      summary: response.reply.summary,
      details: response.reply.details,
      suggestedFollowUps: response.reply.suggestedFollowUps,
      shouldProceed: response.reply.shouldProceed,
      confidence: response.reply.confidence,
      intent: {
        type: response.intent.intent_type,
        action: response.intent.action,
        mentionedGoals: response.intent.mentioned_goals,
        mentionedAmounts: response.intent.mentioned_amounts,
      },
      metadata: {
        executionTimeMs: response.executionTimeMs,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in /chat endpoint:', error);
    return res.status(500).json({
      error: 'Chat processing failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /chat/stream
 * 
 * Streaming version of chat for real-time UI updates.
 * Uses Server-Sent Events to stream progress and partial results.
 */
app.post('/chat/stream', async (req: Request, res: Response): Promise<void> => {
  const parsed = chatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid request payload',
      details: parsed.error.flatten(),
    });
    return;
  }

  const { message, userId, conversationId, userProfile } = parsed.data;
  const profile = userProfile || sampleUser;

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const startTime = Date.now();

    sendEvent('status', { stage: 'parsing', message: 'Understanding your request...' });

    const response = await chatHandler.handleMessage({
      message,
      userId,
      conversationId,
      userProfile: profile,
    });

    sendEvent('intent', {
      type: response.intent.intent_type,
      confidence: response.intent.confidence,
      elapsed: Date.now() - startTime,
    });

    if (response.rawAnalysis) {
      sendEvent('analysis', {
        available: true,
        elapsed: Date.now() - startTime,
      });
    }

    sendEvent('complete', {
      conversationId: response.conversationId,
      reply: response.reply.message,
      summary: response.reply.summary,
      suggestedFollowUps: response.reply.suggestedFollowUps,
      shouldProceed: response.reply.shouldProceed,
      confidence: response.reply.confidence,
      executionTimeMs: response.executionTimeMs,
    });

    res.end();
  } catch (error) {
    console.error('Error in /chat/stream endpoint:', error);
    sendEvent('error', { message: error instanceof Error ? error.message : String(error) });
    res.end();
  }
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
  console.log(`Chat endpoint available at POST /chat`);
});
