import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DecisionEngine } from '@/app/agents/DecisionEngine';

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

interface FinancialContextType {
  state: FinancialState;
  updateState: (newState: Partial<FinancialState>) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateGoal: (goalId: string, updates: Partial<FinancialGoal>) => void;
  simulateDecision: (action: string, amount: number) => Promise<DecisionOption[]>;
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
  const decisionEngine = new DecisionEngine();

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
    // Use the decision engine to generate options
    return await decisionEngine.simulateOptions(state, action, amount);
  };

  return (
    <FinancialContext.Provider
      value={{ state, updateState, addTransaction, updateGoal, simulateDecision }}
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