import 'dotenv/config';
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
import { generateInvestmentReminder, analyzeBudget, getBudgetSummaryMessage, detectUnderspending, analyzeUpcomingExpenses } from '../lib/investment-reminders.js';
import { prioritizeMostRealisticGoal } from '../lib/priority-goal/index.js';
import { runStabilization, cancelStabilization } from '../lib/stabilization/index.js';
import { runIncreaseSavingsWithoutLifestyle } from '../lib/savings-without-lifestyle/index.js';
import type { UserProfile, FinancialAction } from '../types/financial.js';

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// CORS middleware for frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

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
  isPriority: z.boolean().optional(),
});

// Schema for asset allocation (used in InvestmentAccount)
const assetAllocationSchema = z.object({
  stocks: z.number().min(0).max(100),
  bonds: z.number().min(0).max(100),
  cash: z.number().min(0).max(100),
  other: z.number().min(0).max(100).optional(),
}).refine(
  (data) => {
    const sum = data.stocks + data.bonds + data.cash + (data.other || 0);
    return Math.abs(sum - 100) < 0.1; // Allow small rounding differences
  },
  { message: "Allocation percentages must sum to 100" }
);

// Schema for investment account (supports both number and InvestmentAccount format)
const investmentAccountSchema = z.union([
  z.number().nonnegative(),
  z.object({
    balance: z.number().nonnegative(),
    allocation: assetAllocationSchema,
  }),
]);

const accountsSchema = z.object({
  checking: z.number().nonnegative(),
  savings: z.number().nonnegative(),
  investments: z.object({
    taxable: investmentAccountSchema,
    rothIRA: investmentAccountSchema,
    traditional401k: investmentAccountSchema,
  }),
});

const investmentPreferencesSchema = z.object({
  autoInvestEnabled: z.boolean(),
  reminderFrequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'none']),
  reminderDay: z.number().min(1).max(28).optional(),
  targetMonthlyInvestment: z.number().nonnegative().optional(),
  preferredAccount: z.enum(['taxable', 'rothIRA', 'traditional401k']).optional(),
  lastInvestmentDate: dateSchema.optional(),
}).optional();

const preferencesSchema = z.object({
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
  liquidityPreference: z.enum(['high', 'medium', 'low']),
  guardrails: z.array(guardrailSchema),
  investmentPreferences: investmentPreferencesSchema,
});

const userProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  monthlyIncome: z.number().nonnegative(),
  accounts: accountsSchema,
  fixedExpenses: z.array(fixedExpenseSchema),
  spendingCategories: z.array(spendingCategorySchema),
  goals: z.array(goalSchema),
  priority_goal_id: z.string().min(1).optional(),
  stabilization_mode: z.boolean().optional(),
  stabilization_start: z.string().optional(),
  stabilization_end: z.string().optional(),
  stabilization_canceled_at: z.string().optional(),
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

// ============================================================================
// USER PROFILE STORAGE
// ============================================================================

// In-memory storage for user profiles (in production, use a database)
const userProfiles: Map<string, UserProfile> = new Map();

// Initialize default user profile
userProfiles.set('sample', sampleUser);
userProfiles.set('default', sampleUser);

/**
 * Get or create user profile
 */
function getUserProfile(userId: string): UserProfile {
  const existing = userProfiles.get(userId);
  if (existing) {
    return existing;
  }

  // Create new user profile based on sample
  const newProfile: UserProfile = {
    ...sampleUser,
    id: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  userProfiles.set(userId, newProfile);
  return newProfile;
}

/**
 * Update user profile
 */
function updateUserProfile(userId: string, profile: UserProfile): void {
  userProfiles.set(userId, {
    ...profile,
    updatedAt: new Date(),
  });
}

/**
 * GET /user/profile
 * Get current user profile with balances and goals
 */
app.get('/user/profile', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'default';
  const profile = getUserProfile(userId);

  return res.status(200).json({
    profile,
    metadata: {
      timestamp: new Date().toISOString(),
    },
  });
});

// ============================================================================
// GOAL MANAGEMENT
// ============================================================================

// In-memory storage for user-created goals (in production, use a database)
const userCreatedGoals: Map<string, Array<{
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  priority: number;
  createdAt: string;
}>> = new Map();

const createGoalSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  targetAmount: z.number().positive(),
  currentAmount: z.number().min(0).default(0),
  deadline: z.string(),
  priority: z.number().min(1).max(10).default(5),
  userId: z.string().optional(),
});

/**
 * POST /goals
 * Create a new financial goal
 */
app.post('/goals', (req: Request, res: Response) => {
  const parsed = createGoalSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid request payload',
      details: parsed.error.flatten(),
    });
  }

  const { name, targetAmount, currentAmount, deadline, priority, userId } = parsed.data;
  const goalUserId = userId || 'default';

  const newGoal = {
    id: parsed.data.id || `goal_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    name,
    targetAmount,
    currentAmount,
    deadline,
    priority,
    createdAt: new Date().toISOString(),
  };

  // Get or create user's goals list (for backward compatibility)
  const userGoals = userCreatedGoals.get(goalUserId) || [];
  userGoals.push(newGoal);
  userCreatedGoals.set(goalUserId, userGoals);

  // ALSO update the user profile to include this goal
  const userProfile = getUserProfile(goalUserId);
  const profileGoal = {
    id: newGoal.id,
    name: newGoal.name,
    targetAmount: newGoal.targetAmount,
    currentAmount: newGoal.currentAmount,
    deadline: new Date(newGoal.deadline),
    priority: newGoal.priority,
    timeHorizon: 'short' as const, // Default to short-term
    linkedAccountIds: ['savings'], // Default to savings account
  };

  userProfile.goals.push(profileGoal);
  updateUserProfile(goalUserId, userProfile);

  console.log(`[Goals] Created goal "${name}" for user ${goalUserId}`);

  return res.status(201).json({
    goal: newGoal,
    message: `Goal "${name}" created successfully`,
    metadata: {
      timestamp: new Date().toISOString(),
      totalUserGoals: userGoals.length,
    },
  });
});

/**
 * GET /goals
 * Get all goals for a user
 */
app.get('/goals', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'default';
  const userGoals = userCreatedGoals.get(userId) || [];

  return res.status(200).json({
    goals: userGoals,
    count: userGoals.length,
    metadata: {
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * DELETE /goals/:id
 * Delete a specific goal
 */
app.delete('/goals/:id', (req: Request, res: Response) => {
  const goalId = req.params.id;
  const userId = (req.query.userId as string) || 'default';
  
  const userGoals = userCreatedGoals.get(userId) || [];
  const goalIndex = userGoals.findIndex(g => g.id === goalId);
  
  if (goalIndex === -1) {
    return res.status(404).json({
      error: 'Goal not found',
      goalId,
    });
  }
  
  const [deletedGoal] = userGoals.splice(goalIndex, 1);
  userCreatedGoals.set(userId, userGoals);

  console.log(`[Goals] Deleted goal "${deletedGoal?.name}" for user ${userId}`);

  return res.status(200).json({
    message: 'Goal deleted successfully',
    deletedGoal,
  });
});

// =============================================================================
// PRIORITY GOAL — "Prioritize my most realistic goal right now"
// =============================================================================

const priorityGoalRequestSchema = z.object({
  userId: z.string().min(1).default('default'),
  userProfile: userProfileSchema.optional(),
});

/**
 * POST /priority-goal
 * Run feasibility ranking, select priority goal, persist state, return structured output.
 */
app.post('/priority-goal', (req: Request, res: Response) => {
  const parsed = priorityGoalRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid request payload',
      details: parsed.error.flatten(),
    });
  }

  const { userId, userProfile: bodyProfile } = parsed.data;
  const profile = bodyProfile ?? getUserProfile(userId);

  try {
    const result = prioritizeMostRealisticGoal(profile, {
      userId,
      persist: (updated) => updateUserProfile(userId, updated),
    });

    return res.status(200).json({
      priority_goal: result.priority_goal,
      goal_rankings: result.goal_rankings,
      capital_reallocations: result.capital_reallocations,
      updated_user_state: result.updated_user_state,
      explanation: result.explanation,
      updatedUserProfile: result.updatedUserProfile,
    });
  } catch (error) {
    console.error('[Priority Goal] Error:', error);
    return res.status(500).json({
      error: 'Priority goal processing failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

const stabilizeRequestSchema = z.object({
  userId: z.string().min(1).default('default'),
  userProfile: userProfileSchema.optional(),
});

/**
 * POST /stabilize
 * Activate 30-day Financial Stability Mode: increase liquidity buffer, reduce non-critical investments/discretionary.
 */
app.post('/stabilize', (req: Request, res: Response) => {
  const parsed = stabilizeRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid request payload',
      details: parsed.error.flatten(),
    });
  }
  const { userId, userProfile: bodyProfile } = parsed.data;
  const profile = bodyProfile ?? getUserProfile(userId);
  try {
    const result = runStabilization(profile, {
      userId,
      persist: (updated) => updateUserProfile(userId, updated),
    });
    return res.status(200).json({
      before: result.before,
      after: result.after,
      minimumSafeBuffer: result.minimumSafeBuffer,
      shortfall: result.shortfall,
      actions: result.actions,
      explanation: result.explanation,
      stabilization_start: result.stabilization_start,
      stabilization_end: result.stabilization_end,
      updatedUserProfile: result.updatedUserProfile,
    });
  } catch (error) {
    console.error('[Stabilize] Error:', error);
    return res.status(500).json({
      error: 'Stabilization failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

const stabilizeCancelSchema = z.object({
  userId: z.string().min(1).default('default'),
  userProfile: userProfileSchema.optional(),
});

/**
 * POST /stabilize/cancel
 * Cancel Financial Stability Mode (user override).
 */
app.post('/stabilize/cancel', (req: Request, res: Response) => {
  const parsed = stabilizeCancelSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid request payload',
      details: parsed.error.flatten(),
    });
  }
  const { userId, userProfile: bodyProfile } = parsed.data;
  const profile = bodyProfile ?? getUserProfile(userId);
  try {
    const updated = cancelStabilization(profile, {
      persist: (p) => updateUserProfile(userId, p),
    });
    updateUserProfile(userId, updated);
    return res.status(200).json({
      message: 'Financial Stability Mode canceled.',
      updatedUserProfile: updated,
    });
  } catch (error) {
    console.error('[Stabilize Cancel] Error:', error);
    return res.status(500).json({
      error: 'Cancel stabilization failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

const increaseSavingsRequestSchema = z.object({
  userId: z.string().min(1).default('default'),
  userProfile: userProfileSchema.optional(),
});

/**
 * POST /savings/increase-without-lifestyle
 * Increase savings by reallocating from non-lifestyle discretionary categories; protect lifestyle spending.
 * Returns structured JSON: protected_categories, actions, updated_balances_projection, explanation.
 */
app.post('/savings/increase-without-lifestyle', (req: Request, res: Response) => {
  const parsed = increaseSavingsRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid request payload',
      details: parsed.error.flatten(),
    });
  }
  const { userId, userProfile: bodyProfile } = parsed.data;
  const profile = bodyProfile ?? getUserProfile(userId);
  try {
    const result = runIncreaseSavingsWithoutLifestyle(profile);
    if (result.updatedUserProfile) {
      updateUserProfile(userId, result.updatedUserProfile);
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error('[Increase savings without lifestyle] Error:', error);
    return res.status(500).json({
      error: 'Increase savings failed',
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

  // Use provided profile or get from storage
  const actualUserId = userId || 'default';
  const profile = userProfile || getUserProfile(actualUserId);

  try {
    const response = await chatHandler.handleMessage({
      message,
      userId,
      conversationId,
      userProfile: profile,
      fastMode,
      parsedAction,
    });

    // Save updated user profile if it was modified
    if (response.updatedUserProfile) {
      updateUserProfile(actualUserId, response.updatedUserProfile);
      console.log(`[Chat] User profile updated for ${actualUserId}`);
    }

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
      updatedUserProfile: response.updatedUserProfile, // Return updated profile to frontend
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
  const actualUserId = userId || 'default';
  const profile = userProfile || getUserProfile(actualUserId);

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

    // Save updated user profile if it was modified
    if (response.updatedUserProfile) {
      updateUserProfile(actualUserId, response.updatedUserProfile);
      console.log(`[Chat Stream] User profile updated for ${actualUserId}`);
    }

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
      updatedUserProfile: response.updatedUserProfile,
      rawAnalysis: response.rawAnalysis ?? undefined,
    });

    res.end();
  } catch (error) {
    console.error('Error in /chat/stream endpoint:', error);
    sendEvent('error', { message: error instanceof Error ? error.message : String(error) });
    res.end();
  }
});

// ============================================================================
// BUDGET ANALYSIS ENDPOINT
// ============================================================================

/**
 * GET /budget/analysis
 * 
 * Analyze budget with subcategory breakdown
 */
app.post('/budget/analysis', (req: Request, res: Response) => {
  const parsed = userProfileSchema.safeParse(req.body.user ?? req.body);
  
  // Allow using sample user if no user provided
  const user = parsed.success ? parsed.data : sampleUser;
  
  try {
    const analysis = analyzeBudget(user);
    const summaryMessage = getBudgetSummaryMessage(analysis);
    
    return res.status(200).json({
      analysis,
      message: summaryMessage,
      metadata: {
        timestamp: new Date().toISOString(),
        userId: user.id,
      },
    });
  } catch (error) {
    console.error('Error in /budget/analysis endpoint:', error);
    return res.status(500).json({
      error: 'Budget analysis failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /budget/analysis/sample
 * 
 * Get budget analysis for sample user (demo endpoint)
 */
app.get('/budget/analysis/sample', (_req: Request, res: Response) => {
  try {
    const analysis = analyzeBudget(sampleUser);
    const summaryMessage = getBudgetSummaryMessage(analysis);
    
    return res.status(200).json({
      analysis,
      message: summaryMessage,
      metadata: {
        timestamp: new Date().toISOString(),
        userId: sampleUser.id,
      },
    });
  } catch (error) {
    console.error('Error in /budget/analysis/sample endpoint:', error);
    return res.status(500).json({
      error: 'Budget analysis failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /budget/underspending/sample
 * 
 * Detect underspending in budget categories for sample user
 */
app.get('/budget/underspending/sample', (_req: Request, res: Response) => {
  try {
    const analysis = detectUnderspending(sampleUser);
    
    return res.status(200).json({
      analysis,
      metadata: {
        timestamp: new Date().toISOString(),
        userId: sampleUser.id,
      },
    });
  } catch (error) {
    console.error('Error in /budget/underspending/sample endpoint:', error);
    return res.status(500).json({
      error: 'Underspending analysis failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /budget/upcoming/sample
 * 
 * Get upcoming expenses analysis for sample user
 */
app.get('/budget/upcoming/sample', (_req: Request, res: Response) => {
  try {
    const analysis = analyzeUpcomingExpenses(sampleUser);
    
    return res.status(200).json({
      analysis,
      metadata: {
        timestamp: new Date().toISOString(),
        userId: sampleUser.id,
      },
    });
  } catch (error) {
    console.error('Error in /budget/upcoming/sample endpoint:', error);
    return res.status(500).json({
      error: 'Upcoming expenses analysis failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// ============================================================================
// INVESTMENT REMINDERS ENDPOINT
// ============================================================================

/**
 * POST /investments/reminders
 * 
 * Get non-intrusive investment reminder based on user preferences
 */
app.post('/investments/reminders', (req: Request, res: Response) => {
  const parsed = userProfileSchema.safeParse(req.body.user ?? req.body);
  
  // Allow using sample user if no user provided
  const user = parsed.success ? parsed.data : sampleUser;
  
  try {
    const reminder = generateInvestmentReminder(user);
    
    if (!reminder) {
      return res.status(200).json({
        hasReminder: false,
        message: "No investment reminder at this time.",
        reason: user.preferences.investmentPreferences?.autoInvestEnabled
          ? "Auto-invest is enabled - no manual reminders needed."
          : user.preferences.investmentPreferences?.reminderFrequency === 'none'
            ? "Reminders are disabled in your preferences."
            : "Not time for a reminder yet based on your preferences.",
      });
    }
    
    return res.status(200).json({
      hasReminder: reminder.shouldRemind,
      reminder: {
        urgency: reminder.urgency,
        message: reminder.message,
        reasoning: reminder.reasoning,
        recommendedAmount: reminder.recommendedAmount,
        suggestedAccount: reminder.suggestedAccount,
        impactIfInvested: reminder.impactIfInvested,
        opportunityCostNote: reminder.opportunityCostNote,
        nextReminderDate: reminder.nextReminderDate?.toISOString(),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        userId: user.id,
      },
    });
  } catch (error) {
    console.error('Error in /investments/reminders endpoint:', error);
    return res.status(500).json({
      error: 'Investment reminder generation failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /investments/reminders/sample
 * 
 * Get investment reminder for sample user (demo endpoint)
 */
app.get('/investments/reminders/sample', (_req: Request, res: Response) => {
  try {
    const reminder = generateInvestmentReminder(sampleUser);
    
    if (!reminder) {
      return res.status(200).json({
        hasReminder: false,
        message: "No investment reminder at this time.",
      });
    }
    
    return res.status(200).json({
      hasReminder: reminder.shouldRemind,
      reminder: {
        urgency: reminder.urgency,
        message: reminder.message,
        reasoning: reminder.reasoning,
        recommendedAmount: reminder.recommendedAmount,
        suggestedAccount: reminder.suggestedAccount,
        impactIfInvested: reminder.impactIfInvested,
        opportunityCostNote: reminder.opportunityCostNote,
        nextReminderDate: reminder.nextReminderDate?.toISOString(),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        userId: sampleUser.id,
      },
    });
  } catch (error) {
    console.error('Error in /investments/reminders/sample endpoint:', error);
    return res.status(500).json({
      error: 'Investment reminder generation failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
  console.log(`Chat endpoint available at POST /chat`);
  console.log(`Budget analysis available at GET /budget/analysis/sample`);
  console.log(`Investment reminders available at GET /investments/reminders/sample`);
});
