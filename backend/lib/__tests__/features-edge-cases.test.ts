/**
 * Robust Edge Case Tests for New Features
 * 
 * Tests subcategories and investment reminders with edge cases
 */

import { sampleUser } from '../sample-data.js';
import { generateInvestmentReminder, analyzeBudget, getBudgetSummaryMessage } from '../investment-reminders.js';
import type { UserProfile } from '../../types/financial.js';

// Helper to create modified user profiles for testing
function createTestUser(overrides: Partial<UserProfile> & { 
  accountOverrides?: Partial<UserProfile['accounts']>;
  preferencesOverrides?: Partial<UserProfile['preferences']>;
}): UserProfile {
  const { accountOverrides, preferencesOverrides, ...rest } = overrides;
  return {
    ...sampleUser,
    ...rest,
    accounts: {
      ...sampleUser.accounts,
      ...accountOverrides,
    },
    preferences: {
      ...sampleUser.preferences,
      ...preferencesOverrides,
      investmentPreferences: {
        ...sampleUser.preferences.investmentPreferences!,
        ...(preferencesOverrides?.investmentPreferences || {}),
      },
    },
  };
}

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, details?: string): void {
  if (condition) {
    console.log(`✅ ${testName}`);
    testsPassed++;
  } else {
    console.log(`❌ ${testName}`);
    if (details) console.log(`   Details: ${details}`);
    testsFailed++;
  }
}

console.log('\n🧪 ROBUST EDGE CASE TESTS');
console.log('='.repeat(70));

// ============================================================================
// INVESTMENT REMINDER EDGE CASES
// ============================================================================

console.log('\n📊 INVESTMENT REMINDER EDGE CASES');
console.log('-'.repeat(70));

// Edge Case 1: User with very low checking balance
{
  console.log('\n[Edge Case 1: Very low checking balance]');
  const lowBalanceUser = createTestUser({
    accountOverrides: {
      checking: 500, // Below the $1,500 buffer threshold
    },
  });
  
  const reminder = generateInvestmentReminder(lowBalanceUser);
  
  // Should either return null or a very small/zero amount
  if (reminder) {
    assert(
      reminder.recommendedAmount <= 0 || !reminder.shouldRemind,
      'Low balance user should not get actionable reminder',
      `Got recommendedAmount: ${reminder.recommendedAmount}, shouldRemind: ${reminder.shouldRemind}`
    );
  } else {
    assert(true, 'Low balance user returns null (no reminder)');
  }
}

// Edge Case 2: User with negative surplus (expenses > income)
{
  console.log('\n[Edge Case 2: Negative surplus (expenses > income)]');
  const negativeSurplusUser = createTestUser({
    monthlyIncome: 2000,
    fixedExpenses: [
      { id: 'rent', name: 'Rent', amount: 1800, frequency: 'monthly', dueDay: 1 },
      { id: 'car', name: 'Car', amount: 400, frequency: 'monthly', dueDay: 15 },
    ],
    spendingCategories: [
      { id: 'food', name: 'Food', monthlyBudget: 500, currentSpent: 0, transactions: [] },
    ],
  });
  
  const reminder = generateInvestmentReminder(negativeSurplusUser);
  
  if (reminder) {
    assert(
      !reminder.shouldRemind || reminder.recommendedAmount === 0,
      'Negative surplus user should not be told to invest',
      `Message: "${reminder.message}"`
    );
    assert(
      reminder.message.includes('tight') || reminder.message.includes('essentials') || reminder.recommendedAmount === 0,
      'Message should acknowledge tight budget'
    );
  } else {
    assert(true, 'Negative surplus user returns null');
  }
}

// Edge Case 3: User who invested very recently
{
  console.log('\n[Edge Case 3: Recent investment (should not remind)]');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const recentInvestorUser = createTestUser({
    preferencesOverrides: {
      investmentPreferences: {
        ...sampleUser.preferences.investmentPreferences!,
        reminderFrequency: 'monthly',
        lastInvestmentDate: yesterday,
      },
    },
  });
  
  const reminder = generateInvestmentReminder(recentInvestorUser);
  
  if (reminder) {
    assert(
      !reminder.shouldRemind,
      'User who invested yesterday should not get monthly reminder',
      `shouldRemind: ${reminder.shouldRemind}`
    );
  } else {
    assert(true, 'Recent investor returns null');
  }
}

// Edge Case 4: User who invested a long time ago (higher urgency)
{
  console.log('\n[Edge Case 4: Long overdue investment (higher urgency)]');
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  
  const overdueUser = createTestUser({
    preferencesOverrides: {
      investmentPreferences: {
        ...sampleUser.preferences.investmentPreferences!,
        reminderFrequency: 'monthly',
        lastInvestmentDate: twoMonthsAgo,
      },
    },
  });
  
  const reminder = generateInvestmentReminder(overdueUser);
  
  assert(reminder !== null, 'Overdue user should get reminder');
  if (reminder) {
    assert(
      reminder.shouldRemind === true,
      'Overdue user should be reminded',
      `shouldRemind: ${reminder.shouldRemind}`
    );
    assert(
      reminder.urgency === 'medium',
      'Overdue user should have medium urgency (not high - non-intrusive)',
      `urgency: ${reminder.urgency}`
    );
    assert(
      reminder.urgency !== 'high',
      'Urgency should never be high (non-intrusive design)'
    );
  }
}

// Edge Case 5: Different reminder frequencies
{
  console.log('\n[Edge Case 5: Different reminder frequencies]');
  
  const frequencies: Array<'weekly' | 'biweekly' | 'monthly' | 'quarterly'> = 
    ['weekly', 'biweekly', 'monthly', 'quarterly'];
  const thresholds = { weekly: 7, biweekly: 14, monthly: 30, quarterly: 90 };
  
  for (const freq of frequencies) {
    // Test just past threshold
    const pastThreshold = new Date();
    pastThreshold.setDate(pastThreshold.getDate() - (thresholds[freq] + 1));
    
    const user = createTestUser({
      preferencesOverrides: {
        investmentPreferences: {
          ...sampleUser.preferences.investmentPreferences!,
          reminderFrequency: freq,
          lastInvestmentDate: pastThreshold,
        },
      },
    });
    
    const reminder = generateInvestmentReminder(user);
    assert(
      reminder !== null && reminder.shouldRemind,
      `${freq} frequency: should remind after ${thresholds[freq]} days`,
      reminder ? `shouldRemind: ${reminder.shouldRemind}` : 'reminder is null'
    );
  }
}

// Edge Case 6: User with no long-term goals
{
  console.log('\n[Edge Case 6: User with no long-term goals]');
  const shortTermOnlyUser = createTestUser({
    goals: [
      {
        id: 'short1',
        name: 'Short Term Goal',
        targetAmount: 1000,
        currentAmount: 500,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        priority: 1,
        timeHorizon: 'short',
        linkedAccountIds: ['savings'],
      },
    ],
  });
  
  const reminder = generateInvestmentReminder(shortTermOnlyUser);
  
  // Should still work, just no affected goals
  if (reminder) {
    assert(
      Array.isArray(reminder.impactIfInvested.affectedGoals),
      'Should have affectedGoals array (may be empty)'
    );
    assert(
      reminder.impactIfInvested.affectedGoals.length === 0,
      'Should have no affected goals for short-term only user',
      `Found ${reminder.impactIfInvested.affectedGoals.length} goals`
    );
  } else {
    assert(true, 'No reminder for short-term only user (acceptable)');
  }
}

// Edge Case 7: Very high target investment vs. available surplus
{
  console.log('\n[Edge Case 7: Target investment > available surplus]');
  const highTargetUser = createTestUser({
    preferencesOverrides: {
      investmentPreferences: {
        ...sampleUser.preferences.investmentPreferences!,
        targetMonthlyInvestment: 50000, // Way more than surplus
      },
    },
  });
  
  const reminder = generateInvestmentReminder(highTargetUser);
  
  if (reminder) {
    const surplus = 2250; // Sample user's surplus
    assert(
      reminder.recommendedAmount <= surplus * 0.5,
      'Recommended amount should not exceed 50% of surplus',
      `recommended: ${reminder.recommendedAmount}, 50% surplus: ${surplus * 0.5}`
    );
    assert(
      reminder.recommendedAmount <= sampleUser.accounts.checking - 1500,
      'Recommended amount should leave $1,500 buffer in checking'
    );
  }
}

// Edge Case 8: Checking balance exactly at buffer threshold
{
  console.log('\n[Edge Case 8: Checking at buffer threshold ($1,500)]');
  const atThresholdUser = createTestUser({
    accountOverrides: {
      checking: 1500,
    },
  });
  
  const reminder = generateInvestmentReminder(atThresholdUser);
  
  if (reminder) {
    assert(
      reminder.recommendedAmount === 0 || !reminder.shouldRemind || reminder === null,
      'Should not recommend investing when at buffer threshold',
      `recommendedAmount: ${reminder.recommendedAmount}`
    );
  } else {
    assert(true, 'Returns null at buffer threshold (correct)');
  }
}

// Edge Case 9: No investment preferences (undefined)
{
  console.log('\n[Edge Case 9: No investment preferences]');
  const noPrefsUser: UserProfile = {
    ...sampleUser,
    preferences: {
      riskTolerance: 'moderate',
      liquidityPreference: 'medium',
      guardrails: sampleUser.preferences.guardrails,
      // No investmentPreferences
    },
  };
  
  const reminder = generateInvestmentReminder(noPrefsUser);
  assert(
    reminder === null,
    'Should return null when no investment preferences'
  );
}

// Edge Case 10: Weekly reminder but invested 6 days ago
{
  console.log('\n[Edge Case 10: Weekly reminder, invested 6 days ago (no remind)]');
  const sixDaysAgo = new Date();
  sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
  
  const weeklyUser = createTestUser({
    preferencesOverrides: {
      investmentPreferences: {
        ...sampleUser.preferences.investmentPreferences!,
        reminderFrequency: 'weekly',
        lastInvestmentDate: sixDaysAgo,
      },
    },
  });
  
  const reminder = generateInvestmentReminder(weeklyUser);
  
  if (reminder) {
    assert(
      !reminder.shouldRemind,
      'Weekly reminder should not trigger after 6 days',
      `shouldRemind: ${reminder.shouldRemind}`
    );
  } else {
    assert(true, 'Returns null for 6-day-old weekly (correct)');
  }
}

// ============================================================================
// BUDGET ANALYSIS EDGE CASES
// ============================================================================

console.log('\n\n📊 BUDGET ANALYSIS EDGE CASES');
console.log('-'.repeat(70));

// Edge Case 11: Category with $0 budget (division by zero protection)
{
  console.log('\n[Edge Case 11: Category with $0 budget]');
  const zeroBudgetUser = createTestUser({
    spendingCategories: [
      { id: 'zero', name: 'Zero Budget', monthlyBudget: 0, currentSpent: 50, transactions: [] },
      { id: 'normal', name: 'Normal', monthlyBudget: 100, currentSpent: 50, transactions: [] },
    ],
  });
  
  try {
    const analysis = analyzeBudget(zeroBudgetUser);
    assert(
      analysis.categories.length === 2,
      'Should handle $0 budget category without crashing'
    );
    
    const zeroCategory = analysis.categories.find(c => c.id === 'zero');
    assert(
      zeroCategory !== undefined,
      'Zero budget category should exist in analysis'
    );
    assert(
      !isNaN(zeroCategory!.percentUsed) && isFinite(zeroCategory!.percentUsed),
      'Percent used should not be NaN or Infinity',
      `percentUsed: ${zeroCategory!.percentUsed}`
    );
  } catch (error) {
    assert(false, 'Should not throw error for $0 budget', String(error));
  }
}

// Edge Case 12: Category over budget (> 100%)
{
  console.log('\n[Edge Case 12: Category over budget (150%)]');
  const overBudgetUser = createTestUser({
    spendingCategories: [
      { id: 'over', name: 'Over Budget', monthlyBudget: 100, currentSpent: 150, transactions: [] },
    ],
  });
  
  const analysis = analyzeBudget(overBudgetUser);
  const overCategory = analysis.categories.find(c => c.id === 'over');
  
  assert(
    overCategory?.status === 'over',
    'Category at 150% should have "over" status',
    `status: ${overCategory?.status}`
  );
  assert(
    overCategory?.percentUsed === 150,
    'Percent used should be 150%',
    `percentUsed: ${overCategory?.percentUsed}`
  );
  assert(
    analysis.overallStatus === 'needs_attention',
    'Overall status should be needs_attention when over budget',
    `overallStatus: ${analysis.overallStatus}`
  );
}

// Edge Case 13: Subcategory with $0 budget
{
  console.log('\n[Edge Case 13: Subcategory with $0 budget]');
  const zeroSubBudgetUser = createTestUser({
    spendingCategories: [
      {
        id: 'parent',
        name: 'Parent',
        monthlyBudget: 100,
        currentSpent: 50,
        transactions: [],
        subcategories: [
          { id: 'zero_sub', name: 'Zero Sub', monthlyBudget: 0, currentSpent: 10 },
          { id: 'normal_sub', name: 'Normal Sub', monthlyBudget: 50, currentSpent: 25 },
        ],
      },
    ],
  });
  
  try {
    const analysis = analyzeBudget(zeroSubBudgetUser);
    const parentCat = analysis.categories.find(c => c.id === 'parent');
    const zeroSub = parentCat?.subcategories?.find(s => s.id === 'zero_sub');
    
    assert(
      zeroSub !== undefined,
      'Zero budget subcategory should exist'
    );
    assert(
      !isNaN(zeroSub!.percentUsed) && isFinite(zeroSub!.percentUsed),
      'Subcategory percent should not be NaN/Infinity',
      `percentUsed: ${zeroSub!.percentUsed}`
    );
    assert(
      zeroSub!.percentUsed === 0,
      'Zero budget subcategory should show 0% used (safe default)',
      `percentUsed: ${zeroSub!.percentUsed}`
    );
  } catch (error) {
    assert(false, 'Should not throw for $0 subcategory budget', String(error));
  }
}

// Edge Case 14: Categories with no subcategories
{
  console.log('\n[Edge Case 14: Categories without subcategories]');
  const noSubUser = createTestUser({
    spendingCategories: [
      { id: 'no_sub', name: 'No Subcategories', monthlyBudget: 200, currentSpent: 100, transactions: [] },
    ],
  });
  
  const analysis = analyzeBudget(noSubUser);
  const category = analysis.categories.find(c => c.id === 'no_sub');
  
  assert(
    category?.subcategories === undefined || category?.subcategories?.length === 0,
    'Categories without subcategories should work correctly'
  );
}

// Edge Case 15: All categories exactly at 100%
{
  console.log('\n[Edge Case 15: All categories exactly at 100%]');
  const atLimitUser = createTestUser({
    spendingCategories: [
      { id: 'c1', name: 'Cat 1', monthlyBudget: 100, currentSpent: 100, transactions: [] },
      { id: 'c2', name: 'Cat 2', monthlyBudget: 200, currentSpent: 200, transactions: [] },
    ],
  });
  
  const analysis = analyzeBudget(atLimitUser);
  
  assert(
    analysis.categories.every(c => c.status === 'warning'),
    'Categories at exactly 100% should be "warning" status',
    analysis.categories.map(c => `${c.name}: ${c.status}`).join(', ')
  );
  assert(
    analysis.remaining === 0,
    'Remaining should be $0 when all at 100%',
    `remaining: ${analysis.remaining}`
  );
}

// Edge Case 16: Very high spending rate projection
{
  console.log('\n[Edge Case 16: High spending rate projection]');
  const highSpendUser = createTestUser({
    spendingCategories: [
      { id: 'high', name: 'High Spend', monthlyBudget: 100, currentSpent: 80, transactions: [] },
    ],
  });
  
  const analysis = analyzeBudget(highSpendUser);
  
  // If early in month with high spend, projection could exceed budget
  assert(
    analysis.projectedMonthlySpend >= 0,
    'Projected monthly spend should be non-negative',
    `projected: ${analysis.projectedMonthlySpend}`
  );
}

// Edge Case 17: No spending categories
{
  console.log('\n[Edge Case 17: User with no spending categories]');
  const noSpendingUser = createTestUser({
    spendingCategories: [],
  });
  
  try {
    const analysis = analyzeBudget(noSpendingUser);
    assert(
      analysis.categories.length === 0,
      'Should handle empty spending categories'
    );
    assert(
      analysis.totalBudget === 0,
      'Total budget should be $0 with no categories'
    );
    assert(
      analysis.totalSpent === 0,
      'Total spent should be $0 with no categories'
    );
    assert(
      analysis.overallStatus === 'healthy',
      'Should be healthy with no spending',
      `status: ${analysis.overallStatus}`
    );
  } catch (error) {
    assert(false, 'Should not throw for empty categories', String(error));
  }
}

// Edge Case 18: Subcategory totals don't match parent
{
  console.log('\n[Edge Case 18: Subcategory totals != parent total]');
  const mismatchUser = createTestUser({
    spendingCategories: [
      {
        id: 'parent',
        name: 'Parent',
        monthlyBudget: 500,
        currentSpent: 200,
        transactions: [],
        subcategories: [
          { id: 's1', name: 'Sub 1', monthlyBudget: 100, currentSpent: 50 },
          { id: 's2', name: 'Sub 2', monthlyBudget: 100, currentSpent: 75 },
          // Total sub budget: 200, parent: 500
          // Total sub spent: 125, parent: 200
        ],
      },
    ],
  });
  
  const analysis = analyzeBudget(mismatchUser);
  const parent = analysis.categories.find(c => c.id === 'parent');
  
  // Should use parent values for parent category, sub values for subs
  assert(
    parent?.currentSpent === 200,
    'Parent should use its own currentSpent value',
    `parent spent: ${parent?.currentSpent}`
  );
  assert(
    parent?.subcategories?.[0]?.currentSpent === 50,
    'Subcategory should use its own currentSpent value'
  );
}

// Edge Case 19: Budget summary message with multiple over-budget categories
{
  console.log('\n[Edge Case 19: Multiple over-budget categories message]');
  const multiOverUser = createTestUser({
    spendingCategories: [
      { id: 'c1', name: 'Dining', monthlyBudget: 100, currentSpent: 150, transactions: [] },
      { id: 'c2', name: 'Shopping', monthlyBudget: 100, currentSpent: 200, transactions: [] },
      { id: 'c3', name: 'Normal', monthlyBudget: 100, currentSpent: 50, transactions: [] },
    ],
  });
  
  const analysis = analyzeBudget(multiOverUser);
  const message = getBudgetSummaryMessage(analysis);
  
  assert(
    message.includes('Dining') && message.includes('Shopping'),
    'Message should mention both over-budget categories',
    `message: "${message}"`
  );
  assert(
    message.includes('have exceeded') || message.includes('have exceeded'),
    'Message should use plural form for multiple categories'
  );
}

// Edge Case 20: Boundary conditions for budget status
{
  console.log('\n[Edge Case 20: Budget status boundaries]');
  
  const boundaries: Array<{ spent: number; expected: 'under' | 'good' | 'warning' | 'over' }> = [
    { spent: 49, expected: 'under' },    // < 50%
    { spent: 50, expected: 'good' },     // = 50%
    { spent: 79, expected: 'good' },     // < 80%
    { spent: 80, expected: 'good' },     // = 80%
    { spent: 81, expected: 'warning' },  // > 80%, <= 100%
    { spent: 100, expected: 'warning' }, // = 100%
    { spent: 101, expected: 'over' },    // > 100%
  ];
  
  for (const { spent, expected } of boundaries) {
    const user = createTestUser({
      spendingCategories: [
        { id: 'test', name: 'Test', monthlyBudget: 100, currentSpent: spent, transactions: [] },
      ],
    });
    
    const analysis = analyzeBudget(user);
    const category = analysis.categories[0];
    
    assert(
      category?.status === expected,
      `${spent}% spent should be "${expected}"`,
      `got: ${category?.status}`
    );
  }
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n\n' + '='.repeat(70));
console.log('🧪 TEST RESULTS SUMMARY');
console.log('='.repeat(70));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📊 Total: ${testsPassed + testsFailed}`);

if (testsFailed > 0) {
  console.log('\n⚠️  Some tests failed! Review the failures above.');
  process.exit(1);
} else {
  console.log('\n🎉 All edge case tests passed!');
  process.exit(0);
}
