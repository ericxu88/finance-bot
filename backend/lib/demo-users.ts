/**
 * Demo User Personas
 * 
 * Three realistic user profiles for testing and demonstrations
 */

import { subMonths, addMonths } from 'date-fns';
import type { UserProfile } from '../types/financial.js';
import { generateTransactions } from './generate-transactions.js';

const now = new Date();
const fourMonthsAgo = subMonths(now, 4);

// ============================================================================
// SARAH - Young Professional (Primary Demo User)
// ============================================================================

export const sarah: UserProfile = {
  id: 'sarah',
  name: 'Sarah Chen',
  monthlyIncome: 5000,

  accounts: {
    checking: 3000,
    savings: 8000,
    investments: {
      taxable: {
        balance: 5000,
        allocation: { stocks: 80, bonds: 15, cash: 5 }, // Moderate growth
      },
      rothIRA: {
        balance: 12000,
        allocation: { stocks: 90, bonds: 10, cash: 0 }, // Aggressive for long-term
      },
      traditional401k: {
        balance: 0,
        allocation: { stocks: 70, bonds: 25, cash: 5 }, // Balanced for retirement
      },
    },
  },

  fixedExpenses: [
    {
      id: 'rent',
      name: 'Rent',
      amount: 1500,
      frequency: 'monthly',
      dueDay: 1,
    },
    {
      id: 'utilities',
      name: 'Utilities',
      amount: 150,
      frequency: 'monthly',
      dueDay: 5,
    },
    {
      id: 'car_payment',
      name: 'Car Payment',
      amount: 350,
      frequency: 'monthly',
      dueDay: 10,
    },
    {
      id: 'insurance',
      name: 'Car & Health Insurance',
      amount: 200,
      frequency: 'monthly',
      dueDay: 15,
    },
    {
      id: 'subscriptions',
      name: 'Subscriptions (Netflix, Spotify, etc.)',
      amount: 50,
      frequency: 'monthly',
      dueDay: 20,
    },
  ],

  spendingCategories: [
    {
      id: 'cat_groceries',
      name: 'Groceries',
      monthlyBudget: 400,
      currentSpent: 280,
      transactions: [],
    },
    {
      id: 'cat_dining',
      name: 'Dining Out',
      monthlyBudget: 200,
      currentSpent: 150,
      transactions: [],
    },
    {
      id: 'cat_entertainment',
      name: 'Entertainment',
      monthlyBudget: 150,
      currentSpent: 80,
      transactions: [],
    },
    {
      id: 'cat_transportation',
      name: 'Transportation',
      monthlyBudget: 200,
      currentSpent: 120,
      transactions: [],
    },
  ],

  goals: [
    {
      id: 'goal_emergency',
      name: 'Emergency Fund',
      targetAmount: 15000,
      currentAmount: 8000,
      deadline: addMonths(now, 12),
      priority: 1,
      timeHorizon: 'short',
      linkedAccountIds: ['savings'],
    },
    {
      id: 'goal_house',
      name: 'House Down Payment',
      targetAmount: 50000,
      currentAmount: 5000,
      deadline: addMonths(now, 60), // 5 years
      priority: 2,
      timeHorizon: 'long',
      linkedAccountIds: ['savings', 'taxable'],
    },
    {
      id: 'goal_vacation',
      name: 'Europe Vacation',
      targetAmount: 3000,
      currentAmount: 0,
      deadline: addMonths(now, 8),
      priority: 3,
      timeHorizon: 'short',
      linkedAccountIds: ['savings'],
    },
  ],

  preferences: {
    riskTolerance: 'moderate',
    liquidityPreference: 'medium',
    guardrails: [
      {
        id: 'guard_checking_min',
        rule: 'Never let checking drop below $1,000',
        type: 'min_balance',
        accountId: 'checking',
        threshold: 1000,
      },
      {
        id: 'guard_max_single_investment',
        rule: 'Max 30% of portfolio in single investment',
        type: 'max_investment_pct',
        accountId: 'taxable',
        threshold: 0.30,
      },
    ],
  },

  createdAt: subMonths(now, 6),
  updatedAt: now,
};

// Generate Sarah's transaction history
const sarahVariableTransactions = generateTransactions(
  80,
  sarah.spendingCategories,
  fourMonthsAgo,
  now
);

// Assign transactions to categories
sarah.spendingCategories = sarah.spendingCategories.map((cat) => ({
  ...cat,
  transactions: sarahVariableTransactions.filter((t) => t.category === cat.id),
}));

// ============================================================================
// MARCUS - Experienced Investor
// ============================================================================

export const marcus: UserProfile = {
  id: 'marcus',
  name: 'Marcus Johnson',
  monthlyIncome: 8500,

  accounts: {
    checking: 5000,
    savings: 15000,
    investments: {
      taxable: {
        balance: 45000,
        allocation: { stocks: 75, bonds: 20, cash: 5 }, // Balanced for experienced investor
      },
      rothIRA: {
        balance: 28000,
        allocation: { stocks: 85, bonds: 15, cash: 0 }, // Growth-focused
      },
      traditional401k: {
        balance: 85000,
        allocation: { stocks: 65, bonds: 30, cash: 5 }, // Conservative for retirement
      },
    },
  },

  fixedExpenses: [
    {
      id: 'mortgage',
      name: 'Mortgage',
      amount: 2200,
      frequency: 'monthly',
      dueDay: 1,
    },
    {
      id: 'utilities',
      name: 'Utilities',
      amount: 250,
      frequency: 'monthly',
      dueDay: 5,
    },
    {
      id: 'insurance',
      name: 'Home & Auto Insurance',
      amount: 350,
      frequency: 'monthly',
      dueDay: 10,
    },
    {
      id: 'childcare',
      name: 'Childcare',
      amount: 800,
      frequency: 'monthly',
      dueDay: 1,
    },
    {
      id: 'subscriptions',
      name: 'Subscriptions & Services',
      amount: 120,
      frequency: 'monthly',
      dueDay: 15,
    },
  ],

  spendingCategories: [
    {
      id: 'cat_groceries',
      name: 'Groceries',
      monthlyBudget: 700,
      currentSpent: 580,
      transactions: [],
    },
    {
      id: 'cat_dining',
      name: 'Dining Out',
      monthlyBudget: 400,
      currentSpent: 320,
      transactions: [],
    },
    {
      id: 'cat_entertainment',
      name: 'Entertainment',
      monthlyBudget: 300,
      currentSpent: 210,
      transactions: [],
    },
    {
      id: 'cat_transportation',
      name: 'Transportation',
      monthlyBudget: 300,
      currentSpent: 240,
      transactions: [],
    },
    {
      id: 'cat_shopping',
      name: 'Shopping',
      monthlyBudget: 400,
      currentSpent: 280,
      transactions: [],
    },
  ],

  goals: [
    {
      id: 'goal_retirement',
      name: 'Retirement Fund',
      targetAmount: 1000000,
      currentAmount: 158000,
      deadline: addMonths(now, 300), // 25 years
      priority: 1,
      timeHorizon: 'long',
      linkedAccountIds: ['rothIRA', 'traditional401k', 'taxable'],
    },
    {
      id: 'goal_college',
      name: "Kids' College Fund",
      targetAmount: 200000,
      currentAmount: 45000,
      deadline: addMonths(now, 180), // 15 years
      priority: 2,
      timeHorizon: 'long',
      linkedAccountIds: ['taxable'],
    },
    {
      id: 'goal_home_improvement',
      name: 'Home Renovation',
      targetAmount: 30000,
      currentAmount: 10000,
      deadline: addMonths(now, 24), // 2 years
      priority: 3,
      timeHorizon: 'medium',
      linkedAccountIds: ['savings'],
    },
  ],

  preferences: {
    riskTolerance: 'aggressive',
    liquidityPreference: 'low',
    guardrails: [
      {
        id: 'guard_checking_min',
        rule: 'Never let checking drop below $2,000',
        type: 'min_balance',
        accountId: 'checking',
        threshold: 2000,
      },
      {
        id: 'guard_emergency_fund',
        rule: 'Maintain 6 months expenses in savings',
        type: 'min_balance',
        accountId: 'savings',
        threshold: 12000,
      },
    ],
  },

  createdAt: subMonths(now, 24),
  updatedAt: now,
};

// Generate Marcus's transactions
const marcusVariableTransactions = generateTransactions(
  100,
  marcus.spendingCategories,
  fourMonthsAgo,
  now
);

marcus.spendingCategories = marcus.spendingCategories.map((cat) => ({
  ...cat,
  transactions: marcusVariableTransactions.filter((t) => t.category === cat.id),
}));

// ============================================================================
// ELENA - Conservative Saver
// ============================================================================

export const elena: UserProfile = {
  id: 'elena',
  name: 'Elena Rodriguez',
  monthlyIncome: 3800,

  accounts: {
    checking: 2500,
    savings: 12000,
    investments: {
      taxable: {
        balance: 1500,
        allocation: { stocks: 60, bonds: 35, cash: 5 }, // Conservative allocation
      },
      rothIRA: {
        balance: 8000,
        allocation: { stocks: 70, bonds: 25, cash: 5 }, // Moderate for conservative saver
      },
      traditional401k: {
        balance: 15000,
        allocation: { stocks: 60, bonds: 35, cash: 5 }, // Conservative for retirement
      },
    },
  },

  fixedExpenses: [
    {
      id: 'rent',
      name: 'Rent',
      amount: 1200,
      frequency: 'monthly',
      dueDay: 1,
    },
    {
      id: 'utilities',
      name: 'Utilities',
      amount: 120,
      frequency: 'monthly',
      dueDay: 5,
    },
    {
      id: 'car_payment',
      name: 'Car Payment',
      amount: 280,
      frequency: 'monthly',
      dueDay: 10,
    },
    {
      id: 'student_loan',
      name: 'Student Loan Payment',
      amount: 350,
      frequency: 'monthly',
      dueDay: 15,
    },
    {
      id: 'insurance',
      name: 'Insurance',
      amount: 180,
      frequency: 'monthly',
      dueDay: 20,
    },
    {
      id: 'subscriptions',
      name: 'Subscriptions',
      amount: 35,
      frequency: 'monthly',
      dueDay: 25,
    },
  ],

  spendingCategories: [
    {
      id: 'cat_groceries',
      name: 'Groceries',
      monthlyBudget: 350,
      currentSpent: 280,
      transactions: [],
    },
    {
      id: 'cat_dining',
      name: 'Dining Out',
      monthlyBudget: 150,
      currentSpent: 110,
      transactions: [],
    },
    {
      id: 'cat_entertainment',
      name: 'Entertainment',
      monthlyBudget: 100,
      currentSpent: 60,
      transactions: [],
    },
    {
      id: 'cat_transportation',
      name: 'Transportation',
      monthlyBudget: 150,
      currentSpent: 95,
      transactions: [],
    },
    {
      id: 'cat_fitness',
      name: 'Fitness & Health',
      monthlyBudget: 80,
      currentSpent: 65,
      transactions: [],
    },
  ],

  goals: [
    {
      id: 'goal_emergency',
      name: 'Emergency Fund',
      targetAmount: 18000,
      currentAmount: 12000,
      deadline: addMonths(now, 18),
      priority: 1,
      timeHorizon: 'short',
      linkedAccountIds: ['savings'],
    },
    {
      id: 'goal_debt',
      name: 'Pay Off Student Loans',
      targetAmount: 25000,
      currentAmount: 8000, // Amount paid so far
      deadline: addMonths(now, 36), // 3 years
      priority: 2,
      timeHorizon: 'medium',
      linkedAccountIds: ['checking', 'savings'],
    },
    {
      id: 'goal_car',
      name: 'New Car Fund',
      targetAmount: 15000,
      currentAmount: 2000,
      deadline: addMonths(now, 30),
      priority: 3,
      timeHorizon: 'medium',
      linkedAccountIds: ['savings'],
    },
  ],

  preferences: {
    riskTolerance: 'conservative',
    liquidityPreference: 'high',
    guardrails: [
      {
        id: 'guard_checking_min',
        rule: 'Never let checking drop below $800',
        type: 'min_balance',
        accountId: 'checking',
        threshold: 800,
      },
      {
        id: 'guard_emergency_protected',
        rule: 'Keep emergency fund in savings, never invest it',
        type: 'protected_account',
        accountId: 'savings',
      },
      {
        id: 'guard_max_investment',
        rule: 'Never invest more than 20% of liquid assets at once',
        type: 'max_investment_pct',
        threshold: 0.20,
      },
    ],
  },

  createdAt: subMonths(now, 18),
  updatedAt: now,
};

// Generate Elena's transactions
const elenaVariableTransactions = generateTransactions(
  70,
  elena.spendingCategories,
  fourMonthsAgo,
  now
);

elena.spendingCategories = elena.spendingCategories.map((cat) => ({
  ...cat,
  transactions: elenaVariableTransactions.filter((t) => t.category === cat.id),
}));

// ============================================================================
// EXPORT ALL USERS
// ============================================================================

export const demoUsers: Record<string, UserProfile> = {
  sarah,
  marcus,
  elena,
};

export function getUserById(userId: string): UserProfile | null {
  return demoUsers[userId] || null;
}
