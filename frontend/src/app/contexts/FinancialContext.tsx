import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { DecisionEngine } from '@/app/agents/DecisionEngine';
import * as api from '@/app/services/api';

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  priority: 'high' | 'medium' | 'low';
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
  userName: string;
  monthlyIncome: number;
  accounts: Account[];
  expenses: Expense[];
  goals: FinancialGoal[];
  transactions: Transaction[];
  riskTolerance: 'low' | 'medium' | 'high';
  liquidityPreference: 'low' | 'medium' | 'high';
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

export type SortField = 'date' | 'status' | 'account' | 'amount';
export type SortOrder = 'asc' | 'desc';

interface FinancialContextType {
  state: FinancialState;
  loading: boolean;
  error: string | null;
  goalSummaries: api.GoalSummary[];
  budgetAnalysis: api.BudgetAnalysis | null;
  sortField: SortField | null;
  sortOrder: SortOrder;
  sortedTransactions: Transaction[];
  updateState: (newState: Partial<FinancialState>) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateGoal: (goalId: string, updates: Partial<FinancialGoal>) => void;
  simulateDecision: (action: string, amount: number) => Promise<DecisionOption[]>;
  refreshData: () => Promise<void>;
  sortTransactions: (field: SortField, order?: SortOrder) => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

// Minimal initial state - backend is the single source of truth
const initialState: FinancialState = {
  userName: '',
  monthlyIncome: 0,
  accounts: [],
  expenses: [],
  goals: [],
  transactions: [],
  riskTolerance: 'medium',
  liquidityPreference: 'medium',
};

// Convert backend user profile to our state format
function convertBackendToState(profile: api.BackendUserProfile): FinancialState {
  const getInvestmentBalance = (val: number | { balance: number }) =>
    typeof val === 'number' ? val : val.balance;

  const totalInvestments =
    getInvestmentBalance(profile.accounts.investments.taxable) +
    getInvestmentBalance(profile.accounts.investments.rothIRA) +
    getInvestmentBalance(profile.accounts.investments.traditional401k);

  return {
    userName: profile.name,
    monthlyIncome: profile.monthlyIncome,
    accounts: [
      { id: 'checking', name: 'Checking Account', type: 'checking', balance: profile.accounts.checking },
      { id: 'savings', name: 'Savings Account', type: 'savings', balance: profile.accounts.savings },
      { id: 'investment', name: 'Investment Account', type: 'investment', balance: totalInvestments },
    ],
    expenses: profile.fixedExpenses.map((exp) => ({
      id: exp.id,
      category: exp.name,
      amount: exp.frequency === 'annual' ? exp.amount / 12 : exp.amount,
      type: 'fixed' as const,
      frequency: 'monthly' as const,
    })),
    goals: profile.goals.map((goal) => ({
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: new Date(goal.deadline),
      priority: goal.priority === 1 ? 'high' : goal.priority === 2 ? 'medium' : 'low',
    })),
    transactions: profile.spendingCategories.flatMap((cat) =>
      cat.transactions.map((tx) => ({
        id: tx.id,
        date: new Date(tx.date),
        description: tx.description,
        amount: tx.type === 'expense' ? -tx.amount : tx.amount,
        category: tx.category,
      }))
    ).sort((a, b) => b.date.getTime() - a.date.getTime()),
    riskTolerance: profile.preferences.riskTolerance === 'conservative' ? 'low' :
                   profile.preferences.riskTolerance === 'aggressive' ? 'high' : 'medium',
    liquidityPreference: profile.preferences.liquidityPreference,
  };
}

export function FinancialProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FinancialState>(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goalSummaries, setGoalSummaries] = useState<api.GoalSummary[]>([]);
  const [budgetAnalysis, setBudgetAnalysis] = useState<api.BudgetAnalysis | null>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const decisionEngine = new DecisionEngine();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Always fetch from backend - it's the single source of truth
      const [profile, goals, budget] = await Promise.all([
        api.fetchUserProfile(),
        api.getGoalsSummary().catch(() => []),
        api.getBudgetAnalysis().catch(() => null),
      ]);

      if (profile) {
        setState(convertBackendToState(profile));
      } else {
        setError('Failed to load user profile');
      }
      
      setGoalSummaries(goals);
      if (budget) {
        setBudgetAnalysis(budget.analysis);
      }
    } catch (err) {
      console.error('Failed to fetch data from backend:', err);
      setError('Failed to load financial data. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    return await decisionEngine.simulateOptions(state, action, amount);
  };

  const refreshData = async () => {
    await fetchData();
  };

  // Sort transactions based on current sort field and order
  const sortedTransactions = useMemo(() => {
    if (!sortField) {
      return state.transactions;
    }

    const sorted = [...state.transactions].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'date':
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case 'amount':
          comparison = Math.abs(a.amount) - Math.abs(b.amount);
          break;
        case 'status':
          // Status would be based on transaction type or completion
          const aStatus = a.amount >= 0 ? 'completed' : 'pending';
          const bStatus = b.amount >= 0 ? 'completed' : 'pending';
          comparison = aStatus.localeCompare(bStatus);
          break;
        case 'account':
          // Account would be based on category or description
          comparison = a.category.localeCompare(b.category);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [state.transactions, sortField, sortOrder]);

  const sortTransactions = (field: SortField, order?: SortOrder) => {
    // Toggle order if clicking the same field
    if (sortField === field && !order) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(order || 'desc');
    }
  };

  return (
    <FinancialContext.Provider
      value={{
        state,
        loading,
        error,
        goalSummaries,
        budgetAnalysis,
        sortField,
        sortOrder,
        sortedTransactions,
        updateState,
        addTransaction,
        updateGoal,
        simulateDecision,
        refreshData,
        sortTransactions,
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
