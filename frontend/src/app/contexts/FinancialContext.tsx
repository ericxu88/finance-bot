import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { DecisionEngine } from '@/app/agents/DecisionEngine';
import { apiClient } from '@/app/services/api-client';
import type { UserProfile as APIUserProfile, FinancialAction as APIFinancialAction } from '@/app/services/api-client';

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  priority: 'high' | 'medium' | 'low';
  /** True when this goal is the current priority (from "prioritize my most realistic goal") */
  isPriority?: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'investment';
  balance: number;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  type: 'fixed' | 'variable';
  frequency: 'monthly' | 'weekly' | 'yearly';
}

export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
}

export interface FinancialState {
  monthlyIncome: number;
  accounts: Account[];
  expenses: Expense[];
  goals: FinancialGoal[];
  /** ID of the goal currently set as priority */
  priority_goal_id?: string;
  /** Financial Stability Mode active (30-day liquidity-first) */
  stabilization_mode?: boolean;
  stabilization_start?: string;
  stabilization_end?: string;
  transactions: Transaction[];
  riskTolerance: 'low' | 'medium' | 'high';
  liquidityPreference: 'low' | 'medium' | 'high';
}

export interface StabilizationResult {
  before: { checking: number; savings: number; totalLiquid: number };
  after: { checking: number; savings: number; totalLiquid: number };
  explanation: string;
}

export interface DecisionOption {
  id: string;
  action: string;
  description: string;
  impact: {
    accountChanges: { accountId: string; change: number }[];
    goalImpacts: { goalId: string; percentageChange: number; daysChange: number }[];
    liquidityImpact: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  confidence: 'high' | 'medium' | 'low';
  justification: string;
}

export interface PrioritizeGoalResult {
  priority_goal: { id: string; name: string; feasibility_score: number; reason: string };
  goal_rankings: Array<{ id: string; name: string; score: number; bottleneck?: string }>;
  capital_reallocations: Array<{ from: string; to: string; amount: number }>;
  explanation: string;
}

interface FinancialContextType {
  state: FinancialState;
  updateState: (newState: Partial<FinancialState>) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateGoal: (goalId: string, updates: Partial<FinancialGoal>) => void;
  simulateDecision: (action: string, amount: number) => Promise<DecisionOption[]>;
  chatWithAI: (message: string, history: Array<{ role: 'user' | 'assistant'; content: string }>) => Promise<string>;
  analyzeAction: (action: APIFinancialAction) => Promise<any>;
  prioritizeGoal: () => Promise<PrioritizeGoalResult>;
  stabilize: () => Promise<StabilizationResult>;
  cancelStabilization: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

const initialState: FinancialState = {
  monthlyIncome: 6500,
  accounts: [
    { id: 'checking', name: 'Checking Account', type: 'checking', balance: 6132.89 },
    { id: 'savings', name: 'Savings Account', type: 'savings', balance: 4489.02 },
    { id: 'investment', name: 'Investment Account', type: 'investment', balance: 2059.29 },
  ],
  expenses: [
    { id: 'rent', category: 'Rent', amount: 1800, type: 'fixed', frequency: 'monthly' },
    { id: 'utilities', category: 'Utilities', amount: 150, type: 'fixed', frequency: 'monthly' },
    { id: 'groceries', category: 'Groceries', amount: 600, type: 'variable', frequency: 'monthly' },
    { id: 'transportation', category: 'Transportation', amount: 200, type: 'variable', frequency: 'monthly' },
  ],
  goals: [
    {
      id: 'emergency',
      name: 'Emergency Fund',
      targetAmount: 15000,
      currentAmount: 4489.02,
      deadline: new Date('2026-12-31'),
      priority: 'high',
    },
    {
      id: 'vacation',
      name: 'Vacation Fund',
      targetAmount: 5000,
      currentAmount: 1200,
      deadline: new Date('2026-08-01'),
      priority: 'medium',
    },
    {
      id: 'house',
      name: 'House Down Payment',
      targetAmount: 50000,
      currentAmount: 2059.29,
      deadline: new Date('2028-12-31'),
      priority: 'high',
    },
  ],
  transactions: [
    { id: '1', date: new Date('2026-01-27'), description: 'Paycheck', amount: 1720.14, category: 'Income' },
    { id: '2', date: new Date('2026-01-26'), description: 'Grocery Store', amount: -84.00, category: 'Groceries' },
    { id: '3', date: new Date('2026-01-23'), description: 'Gas Station', amount: 237.00, category: 'Transportation' },
    { id: '4', date: new Date('2026-01-21'), description: 'Restaurant', amount: 45.00, category: 'Dining' },
    { id: '5', date: new Date('2026-01-20'), description: 'Online Shopping', amount: -46.00, category: 'Shopping' },
  ],
  riskTolerance: 'medium',
  liquidityPreference: 'medium',
};

export function FinancialProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FinancialState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const decisionEngine = new DecisionEngine();

  // Load user data from backend on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        const userData = await apiClient.getSampleUser();
        
        // Convert backend UserProfile to frontend FinancialState
        setState({
          monthlyIncome: userData.monthlyIncome,
          accounts: userData.accounts,
          expenses: [
            ...userData.fixedExpenses.map(e => ({
              id: e.category.toLowerCase(),
              category: e.category,
              amount: e.amount,
              type: 'fixed' as const,
              frequency: 'monthly' as const,
            })),
            ...userData.variableSpending.map(e => ({
              id: e.category.toLowerCase(),
              category: e.category,
              amount: e.budgetLimit,
              type: 'variable' as const,
              frequency: 'monthly' as const,
            })),
          ],
          goals: userData.goals.map(g => ({
            ...g,
            deadline: new Date(g.deadline),
            isPriority: (g as { isPriority?: boolean }).isPriority,
          })),
          priority_goal_id: userData.priority_goal_id,
          transactions: state.transactions, // Keep existing transactions for now
          riskTolerance: userData.riskTolerance,
          liquidityPreference: userData.liquidityPreference,
        });
      } catch (err) {
        console.error('Failed to load user data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const updateState = (newState: Partial<FinancialState>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    setState((prev) => ({
      ...prev,
      transactions: [newTransaction, ...prev.transactions],
    }));
  };

  const updateGoal = (goalId: string, updates: Partial<FinancialGoal>) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((goal) =>
        goal.id === goalId ? { ...goal, ...updates } : goal
      ),
    }));
  };

  const simulateDecision = async (
    action: string,
    amount: number
  ): Promise<DecisionOption[]> => {
    // Use the decision engine to generate options locally
    return await decisionEngine.simulateOptions(state, action, amount);
  };

  /** Persist conversation ID so the same thread continues and answers vary by context */
  const conversationIdRef = useRef<string | undefined>(undefined);

  /**
   * Chat with the AI assistant using the backend
   */
  const chatWithAI = async (
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);

      // Convert frontend state to backend UserProfile format
      const userProfile: APIUserProfile = {
        id: 'demo-user',
        monthlyIncome: state.monthlyIncome,
        accounts: state.accounts,
        fixedExpenses: state.expenses
          .filter(e => e.type === 'fixed')
          .map(e => ({ category: e.category, amount: e.amount })),
        variableSpending: state.expenses
          .filter(e => e.type === 'variable')
          .map(e => ({ category: e.category, budgetLimit: e.amount, spent: 0 })),
        goals: state.goals.map(g => ({
          ...g,
          deadline: g.deadline.toISOString(),
        })),
        riskTolerance: state.riskTolerance,
        liquidityPreference: state.liquidityPreference,
      };

      const response = await apiClient.chat({
        user: userProfile,
        message,
        history,
        conversationId: conversationIdRef.current,
        userId: 'demo-user',
      });

      if (response.conversationId) {
        conversationIdRef.current = response.conversationId;
      }

      return response.reply;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to chat with AI';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Analyze a financial action using backend AI agents
   */
  const analyzeAction = async (action: APIFinancialAction): Promise<any> => {
    try {
      setIsLoading(true);
      setError(null);

      const userProfile: APIUserProfile = {
        id: 'demo-user',
        monthlyIncome: state.monthlyIncome,
        accounts: state.accounts,
        fixedExpenses: state.expenses
          .filter(e => e.type === 'fixed')
          .map(e => ({ category: e.category, amount: e.amount })),
        variableSpending: state.expenses
          .filter(e => e.type === 'variable')
          .map(e => ({ category: e.category, budgetLimit: e.amount, spent: 0 })),
        goals: state.goals.map(g => ({
          ...g,
          deadline: g.deadline.toISOString(),
        })),
        riskTolerance: state.riskTolerance,
        liquidityPreference: state.liquidityPreference,
      };

      const result = await apiClient.analyze({
        user: userProfile,
        action,
      });

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to analyze action';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const prioritizeGoal = async (): Promise<PrioritizeGoalResult> => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiClient.prioritizeGoal('demo-user');
      setState((prev) => ({
        ...prev,
        priority_goal_id: result.updated_user_state.priority_goal_id,
        goals: prev.goals.map((g) => ({
          ...g,
          isPriority: result.updated_user_state.goals[g.id]?.priority ?? false,
        })),
      }));
      return {
        priority_goal: result.priority_goal,
        goal_rankings: result.goal_rankings,
        capital_reallocations: result.capital_reallocations,
        explanation: result.explanation,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to prioritize goal';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const stabilize = async (): Promise<StabilizationResult> => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiClient.stabilize('demo-user');
      setState((prev) => ({
        ...prev,
        stabilization_mode: true,
        stabilization_start: result.stabilization_start,
        stabilization_end: result.stabilization_end,
      }));
      return {
        before: result.before,
        after: result.after,
        explanation: result.explanation,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to stabilize finances';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelStabilization = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiClient.cancelStabilization('demo-user');
      setState((prev) => ({
        ...prev,
        stabilization_mode: false,
        stabilization_start: undefined,
        stabilization_end: undefined,
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to cancel stability mode';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FinancialContext.Provider
      value={{ 
        state, 
        updateState, 
        addTransaction, 
        updateGoal, 
        simulateDecision,
        chatWithAI,
        analyzeAction,
        prioritizeGoal,
        stabilize,
        cancelStabilization,
        isLoading,
        error,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancial() {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
}