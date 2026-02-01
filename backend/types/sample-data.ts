/**
 * Sample Data for Type Validation
 * 
 * This file contains realistic sample data to validate that our type definitions
 * are practical and usable. It demonstrates how the types work together in practice.
 */

import type {
  UserProfile,
  FinancialAction,
  SimulationResult,
  ComparisonOption,
  FinancialState,
} from './financial';

// ============================================================================
// SAMPLE USER: Sarah - Young Professional
// ============================================================================

/**
 * Sarah is a 28-year-old software engineer earning $85k/year after taxes (~$5,416/month).
 * She's focused on building an emergency fund and saving for a house down payment.
 */
export const sampleUserSarah: UserProfile = {
  id: 'user_sarah_2026',
  name: 'Sarah Chen',
  monthlyIncome: 5416, // $65k after-tax annually
  
  accounts: {
    checking: 3200,
    savings: 8500,
    investments: {
      taxable: {
        balance: 2400,
        allocation: { stocks: 85, bonds: 10, cash: 5 }, // Growth-focused taxable account
      },
      rothIRA: {
        balance: 12000,
        allocation: { stocks: 90, bonds: 10, cash: 0 }, // Aggressive for long-term growth
      },
      traditional401k: {
        balance: 28000,
        allocation: { stocks: 70, bonds: 25, cash: 5 }, // Balanced for retirement
      },
    },
  },
  
  fixedExpenses: [
    {
      id: 'exp_rent',
      name: 'Rent',
      amount: 1850,
      frequency: 'monthly',
      dueDay: 1,
    },
    {
      id: 'exp_car',
      name: 'Car Payment',
      amount: 320,
      frequency: 'monthly',
      dueDay: 15,
    },
    {
      id: 'exp_insurance',
      name: 'Car Insurance',
      amount: 145,
      frequency: 'monthly',
      dueDay: 10,
    },
    {
      id: 'exp_utilities',
      name: 'Utilities (Avg)',
      amount: 120,
      frequency: 'monthly',
    },
    {
      id: 'exp_phone',
      name: 'Phone Bill',
      amount: 65,
      frequency: 'monthly',
      dueDay: 20,
    },
  ],
  
  spendingCategories: [
    {
      id: 'cat_groceries',
      name: 'Groceries',
      monthlyBudget: 400,
      currentSpent: 287.43,
      transactions: [
        {
          id: 'txn_1',
          date: new Date('2026-01-05'),
          amount: -87.23,
          category: 'cat_groceries',
          description: 'Whole Foods',
          type: 'expense',
        },
        {
          id: 'txn_2',
          date: new Date('2026-01-12'),
          amount: -103.45,
          category: 'cat_groceries',
          description: 'Trader Joes',
          type: 'expense',
        },
        {
          id: 'txn_3',
          date: new Date('2026-01-19'),
          amount: -96.75,
          category: 'cat_groceries',
          description: 'Safeway',
          type: 'expense',
        },
      ],
    },
    {
      id: 'cat_dining',
      name: 'Dining Out',
      monthlyBudget: 300,
      currentSpent: 178.50,
      transactions: [
        {
          id: 'txn_4',
          date: new Date('2026-01-08'),
          amount: -45.30,
          category: 'cat_dining',
          description: 'Chipotle',
          type: 'expense',
        },
        {
          id: 'txn_5',
          date: new Date('2026-01-14'),
          amount: -67.20,
          category: 'cat_dining',
          description: 'Olive Garden',
          type: 'expense',
        },
        {
          id: 'txn_6',
          date: new Date('2026-01-22'),
          amount: -66.00,
          category: 'cat_dining',
          description: 'Local Sushi Bar',
          type: 'expense',
        },
      ],
    },
    {
      id: 'cat_entertainment',
      name: 'Entertainment',
      monthlyBudget: 150,
      currentSpent: 89.97,
      transactions: [
        {
          id: 'txn_7',
          date: new Date('2026-01-10'),
          amount: -15.99,
          category: 'cat_entertainment',
          description: 'Netflix',
          type: 'expense',
        },
        {
          id: 'txn_8',
          date: new Date('2026-01-18'),
          amount: -45.00,
          category: 'cat_entertainment',
          description: 'Concert Tickets',
          type: 'expense',
        },
        {
          id: 'txn_9',
          date: new Date('2026-01-25'),
          amount: -28.98,
          category: 'cat_entertainment',
          description: 'Movie Night',
          type: 'expense',
        },
      ],
    },
    {
      id: 'cat_fitness',
      name: 'Fitness',
      monthlyBudget: 100,
      currentSpent: 79.00,
      transactions: [
        {
          id: 'txn_10',
          date: new Date('2026-01-01'),
          amount: -79.00,
          category: 'cat_fitness',
          description: 'Gym Membership',
          type: 'expense',
        },
      ],
    },
    {
      id: 'cat_shopping',
      name: 'Shopping',
      monthlyBudget: 200,
      currentSpent: 134.67,
      transactions: [
        {
          id: 'txn_11',
          date: new Date('2026-01-15'),
          amount: -89.99,
          category: 'cat_shopping',
          description: 'Amazon - Work Clothes',
          type: 'expense',
        },
        {
          id: 'txn_12',
          date: new Date('2026-01-28'),
          amount: -44.68,
          category: 'cat_shopping',
          description: 'Target - Household Items',
          type: 'expense',
        },
      ],
    },
  ],
  
  goals: [
    {
      id: 'goal_emergency',
      name: 'Emergency Fund',
      targetAmount: 15000, // 3 months of expenses
      currentAmount: 8500, // Current savings balance
      deadline: new Date('2026-12-31'),
      priority: 1,
      timeHorizon: 'short',
      linkedAccountIds: ['savings'],
    },
    {
      id: 'goal_house',
      name: 'House Down Payment',
      targetAmount: 60000, // 20% down on $300k house
      currentAmount: 14400, // Taxable + some savings
      deadline: new Date('2029-06-01'),
      priority: 2,
      timeHorizon: 'long',
      linkedAccountIds: ['savings', 'taxable'],
    },
    {
      id: 'goal_retirement',
      name: 'Retirement Savings',
      targetAmount: 1000000,
      currentAmount: 40000, // Both retirement accounts
      deadline: new Date('2061-01-01'), // Age 65
      priority: 3,
      timeHorizon: 'long',
      linkedAccountIds: ['rothIRA', 'traditional401k'],
    },
    {
      id: 'goal_vacation',
      name: 'Europe Trip',
      targetAmount: 5000,
      currentAmount: 1200,
      deadline: new Date('2026-09-01'),
      priority: 4,
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
        rule: 'Never let checking account drop below $1,000',
        type: 'min_balance',
        accountId: 'checking',
        threshold: 1000,
      },
      {
        id: 'guard_emergency_protected',
        rule: 'Keep emergency fund in savings, not investments',
        type: 'protected_account',
        accountId: 'savings',
      },
      {
        id: 'guard_max_investment',
        rule: 'Never invest more than 30% of liquid assets at once',
        type: 'max_investment_pct',
        threshold: 0.30,
      },
    ],
  },
  
  createdAt: new Date('2025-12-15'),
  updatedAt: new Date('2026-01-31'),
};

// ============================================================================
// SAMPLE FINANCIAL ACTION: Invest $500
// ============================================================================

export const sampleAction: FinancialAction = {
  type: 'invest',
  amount: 500,
  targetAccountId: 'rothIRA',
  goalId: 'goal_retirement',
};

// ============================================================================
// SAMPLE SIMULATION RESULT
// ============================================================================

export const sampleSimulationResult: SimulationResult = {
  action: sampleAction,
  
  scenarioIfDo: {
    accountsAfter: {
      checking: 2700, // $3,200 - $500
      savings: 8500,
      investments: {
        taxable: {
          balance: 2400,
          allocation: { stocks: 85, bonds: 10, cash: 5 },
        },
        rothIRA: {
          balance: 12500, // $12,000 + $500
          allocation: { stocks: 90, bonds: 10, cash: 0 },
        },
        traditional401k: {
          balance: 28000,
          allocation: { stocks: 70, bonds: 25, cash: 5 },
        },
      },
    },
    
    goalImpacts: [
      {
        goalId: 'goal_retirement',
        goalName: 'Retirement Savings',
        progressChangePct: 0.05, // 0.05% closer (small impact on large goal)
        timeToGoalBefore: 420, // 35 years in months
        timeToGoalAfter: 417, // Saves 3 months due to compound growth
        timeSaved: 3,
        futureValue: 3847, // $500 growing at 7% for 35 years
      },
      {
        goalId: 'goal_emergency',
        goalName: 'Emergency Fund',
        progressChangePct: 0, // No direct impact
        timeToGoalBefore: 8,
        timeToGoalAfter: 8,
        timeSaved: 0,
      },
    ],
    
    budgetImpacts: [
      {
        categoryId: 'cat_groceries',
        categoryName: 'Groceries',
        percentUsed: 71.86,
        amountRemaining: 112.57,
        status: 'good',
      },
      {
        categoryId: 'cat_dining',
        categoryName: 'Dining Out',
        percentUsed: 59.50,
        amountRemaining: 121.50,
        status: 'good',
      },
    ],
    
    liquidityImpact: 'Moderate decrease in liquidity. Checking drops to $2,700, still above minimum threshold.',
    riskImpact: 'Slight increase in risk exposure. Investment represents 8.5% of liquid assets, within comfortable range.',
    timelineChanges: [
      'Retirement goal accelerated by ~3 months due to compound growth',
      'Checking balance reduced but remains healthy',
    ],
  },
  
  scenarioIfDont: {
    accountsAfter: {
      checking: 3200, // No change
      savings: 8500,
      investments: {
        taxable: {
          balance: 2400,
          allocation: { stocks: 85, bonds: 10, cash: 5 },
        },
        rothIRA: {
          balance: 12000, // No change
          allocation: { stocks: 90, bonds: 10, cash: 0 },
        },
        traditional401k: {
          balance: 28000,
          allocation: { stocks: 70, bonds: 25, cash: 5 },
        },
      },
    },
    
    goalImpacts: [
      {
        goalId: 'goal_retirement',
        goalName: 'Retirement Savings',
        progressChangePct: 0,
        timeToGoalBefore: 420,
        timeToGoalAfter: 420,
        timeSaved: 0,
      },
      {
        goalId: 'goal_emergency',
        goalName: 'Emergency Fund',
        progressChangePct: 0,
        timeToGoalBefore: 8,
        timeToGoalAfter: 8,
        timeSaved: 0,
      },
    ],
    
    budgetImpacts: [
      {
        categoryId: 'cat_groceries',
        categoryName: 'Groceries',
        percentUsed: 71.86,
        amountRemaining: 112.57,
        status: 'good',
      },
      {
        categoryId: 'cat_dining',
        categoryName: 'Dining Out',
        percentUsed: 59.50,
        amountRemaining: 121.50,
        status: 'good',
      },
    ],
    
    liquidityImpact: 'No change. Maintains current liquidity position.',
    riskImpact: 'No change. Current risk exposure maintained.',
    timelineChanges: [],
  },
  
  confidence: 'high',
  
  reasoning: `Investing $500 in your Roth IRA is a solid move because:

1. **Tax Advantage**: Roth IRA contributions grow tax-free, maximizing long-term returns
2. **Time Value**: At 28, you have 35+ years for compound growth ($500 → ~$3,847)
3. **Liquidity Safe**: You'll still have $2,700 in checking, above your $1,000 minimum
4. **Goal Alignment**: Directly supports retirement goal (Priority 3)
5. **Risk Appropriate**: Moderate risk matches your profile; represents 8.5% of liquid assets

The main tradeoff is reduced short-term liquidity, but your emergency fund ($8,500) remains intact and checking stays healthy.`,
  
  validationResult: {
    passed: true,
    constraintViolations: [],
    contradictions: [],
    uncertaintySources: [
      'Future market returns assumed at 7% historical average',
      'Assumes no major life changes in next 3 months',
    ],
    overallConfidence: 'high',
  },
};

// ============================================================================
// SAMPLE COMPARISON OPTIONS
// ============================================================================

export const sampleComparisonOptions: ComparisonOption[] = [
  {
    label: 'Invest $500 in Roth IRA',
    result: sampleSimulationResult,
  },
  {
    label: 'Save $500 to Emergency Fund',
    result: {
      ...sampleSimulationResult,
      action: {
        type: 'save',
        amount: 500,
        targetAccountId: 'savings',
        goalId: 'goal_emergency',
      },
      confidence: 'high',
      reasoning: 'Saving to emergency fund reduces financial stress and builds safety net. High priority goal.',
    },
  },
  {
    label: 'Spend $500 on Europe Trip Fund',
    result: {
      ...sampleSimulationResult,
      action: {
        type: 'save',
        amount: 500,
        targetAccountId: 'savings',
        goalId: 'goal_vacation',
      },
      confidence: 'medium',
      reasoning: 'Vacation goal is lower priority. Consider focusing on emergency fund first.',
    },
  },
];

// ============================================================================
// SAMPLE FINANCIAL STATE SNAPSHOT
// ============================================================================

export const sampleFinancialState: FinancialState = {
  user: sampleUserSarah,
  timestamp: new Date('2026-01-31T10:30:00Z'),
};

// ============================================================================
// EXPORT ALL SAMPLES
// ============================================================================

export const samples = {
  user: sampleUserSarah,
  action: sampleAction,
  simulationResult: sampleSimulationResult,
  comparisonOptions: sampleComparisonOptions,
  financialState: sampleFinancialState,
};
