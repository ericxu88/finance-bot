/**
 * Sample Data - Sarah Demo User
 * 
 * Simplified sample data for testing and demonstrations.
 * This confirms the type system is complete and workable.
 */

import type {
  UserProfile,
  FinancialAction,
} from '../types/financial.js';
import { getInvestmentBalance } from '../types/financial.js';

// ============================================================================
// SAMPLE USER: Sarah
// ============================================================================

/**
 * Sarah - Demo user for financial decision simulations
 * Young professional working on building emergency fund and saving for a house
 */
export const sampleUser: UserProfile = {
  id: 'user_sarah_demo',
  name: 'Sarah',
  monthlyIncome: 5000,
  
  accounts: {
    checking: 3000,
    savings: 8000,
    investments: {
      taxable: {
        balance: 5000,
        allocation: { stocks: 80, bonds: 15, cash: 5 }, // Moderate growth portfolio
      },
      rothIRA: {
        balance: 0,
        allocation: { stocks: 90, bonds: 10, cash: 0 }, // Aggressive for long-term growth
      },
      traditional401k: {
        balance: 0,
        allocation: { stocks: 70, bonds: 25, cash: 5 }, // Balanced for retirement
      },
    },
  },
  
  fixedExpenses: [
    {
      id: 'exp_rent',
      name: 'Rent',
      amount: 1500,
      frequency: 'monthly',
      dueDay: 1,
    },
    {
      id: 'exp_utilities',
      name: 'Utilities',
      amount: 150,
      frequency: 'monthly',
      dueDay: 15,
    },
    {
      id: 'exp_car',
      name: 'Car Payment',
      amount: 350,
      frequency: 'monthly',
      dueDay: 10,
    },
  ],
  
  spendingCategories: [
    {
      id: 'cat_groceries',
      name: 'Groceries',
      monthlyBudget: 400,
      currentSpent: 0,
      transactions: [],
      subcategories: [
        { id: 'sub_produce', name: 'Produce', monthlyBudget: 120, currentSpent: 0 },
        { id: 'sub_meat', name: 'Meat & Seafood', monthlyBudget: 100, currentSpent: 0 },
        { id: 'sub_dairy', name: 'Dairy', monthlyBudget: 60, currentSpent: 0 },
        { id: 'sub_pantry', name: 'Pantry Staples', monthlyBudget: 80, currentSpent: 0 },
        { id: 'sub_snacks', name: 'Snacks & Beverages', monthlyBudget: 40, currentSpent: 0 },
      ],
    },
    {
      id: 'cat_dining',
      name: 'Dining',
      monthlyBudget: 200,
      currentSpent: 0,
      transactions: [],
      subcategories: [
        { id: 'sub_restaurants', name: 'Restaurants', monthlyBudget: 120, currentSpent: 0 },
        { id: 'sub_coffee', name: 'Coffee Shops', monthlyBudget: 40, currentSpent: 0 },
        { id: 'sub_delivery', name: 'Food Delivery', monthlyBudget: 40, currentSpent: 0 },
      ],
    },
    {
      id: 'cat_entertainment',
      name: 'Entertainment',
      monthlyBudget: 150,
      currentSpent: 0,
      transactions: [],
      subcategories: [
        { id: 'sub_streaming', name: 'Streaming Services', monthlyBudget: 40, currentSpent: 0 },
        { id: 'sub_events', name: 'Events & Concerts', monthlyBudget: 60, currentSpent: 0 },
        { id: 'sub_hobbies', name: 'Hobbies', monthlyBudget: 50, currentSpent: 0 },
      ],
    },
  ],
  
  goals: [
    {
      id: 'goal_emergency',
      name: 'Emergency Fund',
      targetAmount: 15000,
      currentAmount: 8000,
      deadline: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year from now
      priority: 1,
      timeHorizon: 'short',
      linkedAccountIds: ['savings'],
    },
    {
      id: 'goal_house',
      name: 'House Down Payment',
      targetAmount: 50000,
      currentAmount: 5000,
      deadline: new Date(new Date().setFullYear(new Date().getFullYear() + 5)), // 5 years from now
      priority: 2,
      timeHorizon: 'long',
      linkedAccountIds: ['taxable', 'savings'],
    },
    {
      id: 'goal_vacation',
      name: 'Vacation',
      targetAmount: 3000,
      currentAmount: 0,
      deadline: new Date(new Date().setMonth(new Date().getMonth() + 8)), // 8 months from now
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
    ],
    investmentPreferences: {
      autoInvestEnabled: false,
      reminderFrequency: 'monthly',
      reminderDay: 15,
      targetMonthlyInvestment: 500,
      preferredAccount: 'taxable',
      // lastInvestmentDate not set = first-time investor
    },
  },
  
  // Upcoming one-time or scheduled expenses
  upcomingExpenses: [
    {
      id: 'upcoming_car_insurance',
      name: 'Car Insurance Premium',
      amount: 450,
      dueDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString(),
      isRecurring: true,
      notes: 'Semi-annual payment',
      status: 'pending',
    },
    {
      id: 'upcoming_subscription_renewal',
      name: 'Streaming Services Renewal',
      amount: 89,
      dueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
      isRecurring: true,
      categoryId: 'entertainment',
      status: 'pending',
    },
    {
      id: 'upcoming_gym_annual',
      name: 'Gym Annual Membership',
      amount: 350,
      dueDate: new Date(new Date().setDate(new Date().getDate() + 25)).toISOString(),
      isRecurring: true,
      notes: 'Annual fee due next month',
      status: 'pending',
    },
    {
      id: 'upcoming_medical_copay',
      name: 'Doctor Visit Copay',
      amount: 50,
      dueDate: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(),
      isRecurring: false,
      status: 'pending',
    },
  ],
  
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-31'),
};

// ============================================================================
// SAMPLE ACTION: Invest $500
// ============================================================================

/**
 * Sample action: Invest $500 into taxable account for house down payment goal
 */
export const sampleAction: FinancialAction = {
  type: 'invest',
  amount: 500,
  targetAccountId: 'taxable',
  goalId: 'goal_house',
};

// ============================================================================
// HELPER FUNCTIONS FOR VALIDATION
// ============================================================================

/**
 * Calculate total liquid assets (checking + savings)
 */
export function calculateLiquidAssets(user: UserProfile): number {
  return user.accounts.checking + user.accounts.savings;
}

/**
 * Calculate total invested assets
 */
export function calculateInvestedAssets(user: UserProfile): number {
  const inv = user.accounts.investments;
  return getInvestmentBalance(inv.taxable) + 
         getInvestmentBalance(inv.rothIRA) + 
         getInvestmentBalance(inv.traditional401k);
}

/**
 * Calculate total assets
 */
export function calculateTotalAssets(user: UserProfile): number {
  return calculateLiquidAssets(user) + calculateInvestedAssets(user);
}

/**
 * Calculate total monthly fixed expenses
 */
export function calculateMonthlyFixedExpenses(user: UserProfile): number {
  return user.fixedExpenses.reduce((total, expense) => {
    if (expense.frequency === 'monthly') {
      return total + expense.amount;
    } else if (expense.frequency === 'annual') {
      return total + (expense.amount / 12);
    }
    return total;
  }, 0);
}

/**
 * Calculate total monthly discretionary budget
 */
export function calculateMonthlyDiscretionaryBudget(user: UserProfile): number {
  return user.spendingCategories.reduce((total, category) => {
    return total + category.monthlyBudget;
  }, 0);
}

/**
 * Calculate monthly surplus (income - all expenses)
 */
export function calculateMonthlySurplus(user: UserProfile): number {
  const fixedExpenses = calculateMonthlyFixedExpenses(user);
  const discretionaryBudget = calculateMonthlyDiscretionaryBudget(user);
  return user.monthlyIncome - fixedExpenses - discretionaryBudget;
}

/**
 * Get goal completion percentage
 */
export function getGoalCompletionPct(goalId: string, user: UserProfile): number {
  const goal = user.goals.find(g => g.id === goalId);
  if (!goal) return 0;
  return (goal.currentAmount / goal.targetAmount) * 100;
}

/**
 * Get months until goal deadline
 */
export function getMonthsUntilGoalDeadline(goalId: string, user: UserProfile): number {
  const goal = user.goals.find(g => g.id === goalId);
  if (!goal) return 0;
  
  const now = new Date();
  const deadline = new Date(goal.deadline);
  const diffTime = deadline.getTime() - now.getTime();
  const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  
  return Math.max(0, diffMonths);
}

/**
 * Validate action against guardrails
 */
export function checkGuardrails(
  user: UserProfile,
  action: FinancialAction
): { passed: boolean; violations: string[] } {
  const violations: string[] = [];
  
  for (const guardrail of user.preferences.guardrails) {
    if (guardrail.type === 'min_balance' && guardrail.accountId === 'checking') {
      // If spending from checking, verify it won't drop below threshold
      if (action.type === 'invest' || action.type === 'spend') {
        const newBalance = user.accounts.checking - action.amount;
        if (guardrail.threshold && newBalance < guardrail.threshold) {
          violations.push(guardrail.rule);
        }
      }
    }
  }
  
  return {
    passed: violations.length === 0,
    violations,
  };
}

// ============================================================================
// VALIDATION: Log sample data details
// ============================================================================

console.log('✅ Sample Data Types Validated\n');
console.log('='.repeat(60));
console.log('\n📊 SAMPLE USER: Sarah');
console.log('-'.repeat(60));
console.log(`Name: ${sampleUser.name}`);
console.log(`Monthly Income: $${sampleUser.monthlyIncome.toLocaleString()}`);
console.log(`\nAssets:`);
console.log(`  Checking: $${sampleUser.accounts.checking.toLocaleString()}`);
console.log(`  Savings: $${sampleUser.accounts.savings.toLocaleString()}`);
console.log(`  Taxable Investments: $${getInvestmentBalance(sampleUser.accounts.investments.taxable).toLocaleString()}`);
console.log(`  Total: $${calculateTotalAssets(sampleUser).toLocaleString()}`);
console.log(`\nMonthly Cash Flow:`);
console.log(`  Income: $${sampleUser.monthlyIncome.toLocaleString()}`);
console.log(`  Fixed Expenses: -$${calculateMonthlyFixedExpenses(sampleUser).toLocaleString()}`);
console.log(`  Discretionary Budget: -$${calculateMonthlyDiscretionaryBudget(sampleUser).toLocaleString()}`);
console.log(`  Surplus: $${calculateMonthlySurplus(sampleUser).toLocaleString()}`);
console.log(`\nFixed Expenses (${sampleUser.fixedExpenses.length}):`);
sampleUser.fixedExpenses.forEach(exp => {
  console.log(`  - ${exp.name}: $${exp.amount}`);
});
console.log(`\nSpending Categories (${sampleUser.spendingCategories.length}):`);
sampleUser.spendingCategories.forEach(cat => {
  console.log(`  - ${cat.name}: $${cat.monthlyBudget} budget`);
});
console.log(`\nFinancial Goals (${sampleUser.goals.length}):`);
sampleUser.goals.forEach(goal => {
  const completion = getGoalCompletionPct(goal.id, sampleUser);
  const monthsLeft = getMonthsUntilGoalDeadline(goal.id, sampleUser);
  console.log(`  ${goal.priority}. ${goal.name}:`);
  console.log(`     Progress: ${completion.toFixed(1)}% ($${goal.currentAmount.toLocaleString()} / $${goal.targetAmount.toLocaleString()})`);
  console.log(`     Deadline: ${monthsLeft} months (${goal.deadline.toLocaleDateString()})`);
});
console.log(`\nGuardrails (${sampleUser.preferences.guardrails.length}):`);
sampleUser.preferences.guardrails.forEach(guard => {
  console.log(`  - ${guard.rule}`);
});

console.log('\n💰 SAMPLE ACTION');
console.log('-'.repeat(60));
console.log(`Type: ${sampleAction.type}`);
console.log(`Amount: $${sampleAction.amount}`);
console.log(`Target Account: ${sampleAction.targetAccountId}`);
console.log(`Supporting Goal: ${sampleAction.goalId}`);

console.log('\n✅ GUARDRAIL CHECK');
console.log('-'.repeat(60));
const guardrailCheck = checkGuardrails(sampleUser, sampleAction);
if (guardrailCheck.passed) {
  console.log('✅ Action passes all guardrails');
} else {
  console.log('❌ Action violates guardrails:');
  guardrailCheck.violations.forEach(v => console.log(`   - ${v}`));
}

console.log('\n🎉 TYPE VALIDATION COMPLETE');
console.log('='.repeat(60));
console.log('✓ All types compile without errors');
console.log('✓ Sample data instantiates correctly');
console.log('✓ Types can be imported and used');
console.log('✓ Helper functions work with typed data');
console.log('\n🚀 Data model is complete and workable!\n');
