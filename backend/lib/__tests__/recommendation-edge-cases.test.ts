/**
 * Recommendation Engine Edge Case Tests
 * 
 * Tests generateRecommendations and generateGoalSummary with edge cases.
 */

import { generateRecommendations, generateGoalSummary } from '../recommendation-engine.js';
import { sampleUser } from '../sample-data.js';
import type { UserProfile } from '../../types/financial.js';

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

// Helper to create test users
function createTestUser(overrides: Partial<UserProfile>): UserProfile {
  return { ...sampleUser, ...overrides };
}

console.log('\n🧪 RECOMMENDATION ENGINE EDGE CASE TESTS');
console.log('='.repeat(70));

// ============================================================================
// generateRecommendations EDGE CASES
// ============================================================================

console.log('\n📊 generateRecommendations Edge Cases');
console.log('-'.repeat(70));

// Edge Case 1: User with no goals
{
  console.log('\n[Edge Case 1: User with no goals]');
  const noGoalsUser = createTestUser({ goals: [] });
  
  try {
    const recommendations = generateRecommendations(noGoalsUser);
    assert(Array.isArray(recommendations), 'Returns array for user with no goals');
    // Should still generate generic savings recommendation if surplus exists
    if (recommendations.length > 0) {
      assert(recommendations.some(r => r.action.type === 'save'), 
        'Generates generic save recommendation');
    } else {
      assert(true, 'No recommendations is acceptable for no-goals user');
    }
  } catch (e) {
    assert(false, 'Should not throw for user with no goals', String(e));
  }
}

// Edge Case 2: User with negative surplus (expenses > income)
{
  console.log('\n[Edge Case 2: Negative surplus]');
  const negativeSurplusUser = createTestUser({
    monthlyIncome: 2000,
    fixedExpenses: [
      { id: 'rent', name: 'Rent', amount: 1500, frequency: 'monthly', dueDay: 1 },
      { id: 'car', name: 'Car', amount: 600, frequency: 'monthly', dueDay: 15 },
    ],
    spendingCategories: [
      { id: 'food', name: 'Food', monthlyBudget: 500, currentSpent: 0, transactions: [] },
    ],
  });
  
  try {
    const recommendations = generateRecommendations(negativeSurplusUser);
    assert(Array.isArray(recommendations), 'Returns array for negative surplus user');
    // Shouldn't recommend large investments when in the red
    const largeRecs = recommendations.filter(r => r.action.amount > 500);
    assert(largeRecs.length === 0, 'No large recommendations when surplus is negative',
      `Found ${largeRecs.length} large recommendations`);
  } catch (e) {
    assert(false, 'Should not throw for negative surplus', String(e));
  }
}

// Edge Case 3: User with all goals completed
{
  console.log('\n[Edge Case 3: All goals completed]');
  const completedGoalsUser = createTestUser({
    goals: [
      {
        id: 'completed1',
        name: 'Completed Goal',
        targetAmount: 10000,
        currentAmount: 15000, // Over target
        deadline: new Date('2025-01-01'),
        priority: 1,
        timeHorizon: 'short',
        linkedAccountIds: ['savings'],
      },
      {
        id: 'completed2',
        name: 'Another Done',
        targetAmount: 5000,
        currentAmount: 5000, // Exactly at target
        deadline: new Date('2025-06-01'),
        priority: 2,
        timeHorizon: 'medium',
        linkedAccountIds: ['savings'],
      },
    ],
  });
  
  const recommendations = generateRecommendations(completedGoalsUser);
  const goalSpecificRecs = recommendations.filter(r => r.goalImpact?.goalId);
  assert(goalSpecificRecs.length === 0, 'No goal-specific recs when all goals done',
    `Found ${goalSpecificRecs.length} goal-specific recs`);
}

// Edge Case 4: User with very short deadline
{
  console.log('\n[Edge Case 4: Very short deadline (1 week)]');
  const shortDeadlineUser = createTestUser({
    goals: [{
      id: 'urgent',
      name: 'Urgent Goal',
      targetAmount: 1000,
      currentAmount: 0,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
      priority: 1,
      timeHorizon: 'short',
      linkedAccountIds: ['savings'],
    }],
  });
  
  const recommendations = generateRecommendations(shortDeadlineUser);
  assert(Array.isArray(recommendations), 'Handles very short deadline');
}

// Edge Case 5: User with huge goal gap
{
  console.log('\n[Edge Case 5: Huge goal gap ($1M)]');
  const hugeGapUser = createTestUser({
    goals: [{
      id: 'huge',
      name: 'Million Dollar Goal',
      targetAmount: 1000000,
      currentAmount: 0,
      deadline: new Date('2040-01-01'),
      priority: 1,
      timeHorizon: 'long',
      linkedAccountIds: ['taxable'],
    }],
  });
  
  const recommendations = generateRecommendations(hugeGapUser);
  // Should not recommend unrealistic amounts
  const unrealistic = recommendations.filter(r => r.action.amount > hugeGapUser.monthlyIncome);
  assert(unrealistic.length === 0, 'No unrealistic recommendations for huge goal',
    `Found recommendation for $${unrealistic[0]?.action.amount}`);
}

// Edge Case 6: User with only emergency fund goal (short-term)
{
  console.log('\n[Edge Case 6: Only emergency fund goal]');
  const emergencyOnlyUser = createTestUser({
    goals: [{
      id: 'emergency',
      name: 'Emergency Fund',
      targetAmount: 15000,
      currentAmount: 5000,
      deadline: new Date('2027-01-01'),
      priority: 1,
      timeHorizon: 'short',
      linkedAccountIds: ['savings'],
    }],
  });
  
  const recommendations = generateRecommendations(emergencyOnlyUser);
  const saveRecs = recommendations.filter(r => r.action.type === 'save');
  assert(saveRecs.length > 0, 'Recommends saving for emergency fund');
  assert(!recommendations.some(r => r.action.type === 'invest'),
    'Does not recommend investing over emergency fund');
}

// Edge Case 7: Very high surplus user
{
  console.log('\n[Edge Case 7: Very high surplus ($10k/month)]');
  const highSurplusUser = createTestUser({
    monthlyIncome: 15000,
    fixedExpenses: [
      { id: 'rent', name: 'Rent', amount: 2000, frequency: 'monthly', dueDay: 1 },
    ],
    spendingCategories: [
      { id: 'food', name: 'Food', monthlyBudget: 500, currentSpent: 0, transactions: [] },
    ],
  });
  
  const recommendations = generateRecommendations(highSurplusUser);
  assert(recommendations.length > 0, 'Generates recommendations for high surplus user');
}

// Edge Case 8: Zero income user
{
  console.log('\n[Edge Case 8: Zero income]');
  const zeroIncomeUser = createTestUser({ monthlyIncome: 0 });
  
  try {
    const recommendations = generateRecommendations(zeroIncomeUser);
    assert(Array.isArray(recommendations), 'Handles zero income');
    assert(recommendations.length === 0 || recommendations.every(r => r.action.amount <= 0),
      'Does not recommend actions with no income');
  } catch (e) {
    assert(false, 'Should not throw for zero income', String(e));
  }
}

// Edge Case 9: User with only long-term goals
{
  console.log('\n[Edge Case 9: Only long-term goals]');
  const longTermOnlyUser = createTestUser({
    goals: [
      {
        id: 'retirement',
        name: 'Retirement',
        targetAmount: 500000,
        currentAmount: 50000,
        deadline: new Date('2050-01-01'),
        priority: 1,
        timeHorizon: 'long',
        linkedAccountIds: ['traditional401k'],
      },
    ],
  });
  
  const recommendations = generateRecommendations(longTermOnlyUser);
  const investRecs = recommendations.filter(r => r.action.type === 'invest');
  assert(investRecs.length > 0 || recommendations.length > 0, 
    'Handles long-term only goals');
}

// Edge Case 10: Past deadline goal
{
  console.log('\n[Edge Case 10: Goal with past deadline]');
  const pastDeadlineUser = createTestUser({
    goals: [{
      id: 'past',
      name: 'Past Goal',
      targetAmount: 5000,
      currentAmount: 1000,
      deadline: new Date('2020-01-01'), // In the past
      priority: 1,
      timeHorizon: 'short',
      linkedAccountIds: ['savings'],
    }],
  });
  
  try {
    const recommendations = generateRecommendations(pastDeadlineUser);
    assert(Array.isArray(recommendations), 'Handles past deadline without crashing');
  } catch (e) {
    assert(false, 'Should not throw for past deadline', String(e));
  }
}

// ============================================================================
// generateGoalSummary EDGE CASES
// ============================================================================

console.log('\n\n📊 generateGoalSummary Edge Cases');
console.log('-'.repeat(70));

// Edge Case 11: Empty goals
{
  console.log('\n[Edge Case 11: No goals]');
  const noGoalsUser = createTestUser({ goals: [] });
  
  const summary = generateGoalSummary(noGoalsUser);
  assert(summary.length === 0, 'Empty goals = empty summary');
}

// Edge Case 12: Goal at exactly 100% progress
{
  console.log('\n[Edge Case 12: Goal at 100% progress]');
  const exactlyDoneUser = createTestUser({
    goals: [{
      id: 'done',
      name: 'Done Goal',
      targetAmount: 10000,
      currentAmount: 10000,
      deadline: new Date('2027-01-01'),
      priority: 1,
      timeHorizon: 'medium',
      linkedAccountIds: ['savings'],
    }],
  });
  
  const summary = generateGoalSummary(exactlyDoneUser);
  if (summary[0]) {
    assert(summary[0].status === 'completed', '100% progress = completed status',
      `Got: ${summary[0].status}`);
    assert(summary[0].progress === 100, 'Progress is 100%', `Got: ${summary[0].progress}%`);
  } else {
    assert(false, 'Summary should have at least one entry');
  }
}

// Edge Case 13: Goal over 100% progress
{
  console.log('\n[Edge Case 13: Goal over 100% progress]');
  const overAchievedUser = createTestUser({
    goals: [{
      id: 'over',
      name: 'Over Achieved',
      targetAmount: 10000,
      currentAmount: 15000,
      deadline: new Date('2027-01-01'),
      priority: 1,
      timeHorizon: 'medium',
      linkedAccountIds: ['savings'],
    }],
  });
  
  const summary = generateGoalSummary(overAchievedUser);
  if (summary[0]) {
    assert(summary[0].status === 'completed', 'Over 100% = completed');
    assert(summary[0].progress >= 100, 'Progress >= 100%', `Got: ${summary[0].progress}%`);
    assert(summary[0].remainingAmount === 0, 'Remaining amount is 0',
      `Got: ${summary[0].remainingAmount}`);
  } else {
    assert(false, 'Summary should have at least one entry');
  }
}

// Edge Case 14: Goal with 0 target (edge case)
{
  console.log('\n[Edge Case 14: Goal with $0 target]');
  const zeroTargetUser = createTestUser({
    goals: [{
      id: 'zero',
      name: 'Zero Target',
      targetAmount: 0,
      currentAmount: 0,
      deadline: new Date('2027-01-01'),
      priority: 1,
      timeHorizon: 'short',
      linkedAccountIds: ['savings'],
    }],
  });
  
  try {
    const summary = generateGoalSummary(zeroTargetUser);
    assert(Array.isArray(summary), 'Handles $0 target without crashing');
    // Progress could be NaN, Infinity, or treated as complete
    const progress = summary[0]?.progress ?? NaN;
    const status = summary[0]?.status ?? 'unknown';
    assert(isFinite(progress) || status === 'completed',
      'Handles $0 target gracefully', `Progress: ${progress}`);
  } catch (e) {
    assert(false, 'Should not throw for $0 target', String(e));
  }
}

// Edge Case 15: Very distant deadline
{
  console.log('\n[Edge Case 15: Very distant deadline (50 years)]');
  const distantUser = createTestUser({
    goals: [{
      id: 'distant',
      name: 'Very Distant Goal',
      targetAmount: 1000000,
      currentAmount: 0,
      deadline: new Date('2075-01-01'),
      priority: 1,
      timeHorizon: 'long',
      linkedAccountIds: ['taxable'],
    }],
  });
  
  const summary = generateGoalSummary(distantUser);
  if (summary[0]) {
    assert(summary[0].monthsRemaining > 500, 'Correctly calculates distant months',
      `Got: ${summary[0].monthsRemaining} months`);
    assert(summary[0].monthlyNeeded > 0, 'Monthly needed is positive',
      `Got: ${summary[0].monthlyNeeded}`);
  } else {
    assert(false, 'Summary should have at least one entry');
  }
}

// Edge Case 16: Deadline tomorrow
{
  console.log('\n[Edge Case 16: Deadline tomorrow]');
  const tomorrowUser = createTestUser({
    goals: [{
      id: 'tomorrow',
      name: 'Due Tomorrow',
      targetAmount: 5000,
      currentAmount: 1000,
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      priority: 1,
      timeHorizon: 'short',
      linkedAccountIds: ['savings'],
    }],
  });
  
  const summary = generateGoalSummary(tomorrowUser);
  if (summary[0]) {
    assert(summary[0].monthsRemaining <= 1, 'Tomorrow = 0 or 1 months',
      `Got: ${summary[0].monthsRemaining}`);
    assert(summary[0].status === 'at_risk' || summary[0].status === 'behind',
      'Tomorrow deadline with gap is at_risk or behind', `Got: ${summary[0].status}`);
  } else {
    assert(false, 'Summary should have at least one entry');
  }
}

// Edge Case 17: Multiple goals with same deadline
{
  console.log('\n[Edge Case 17: Multiple goals, same deadline]');
  const sameDeadlineUser = createTestUser({
    goals: [
      {
        id: 'goal1',
        name: 'Goal 1',
        targetAmount: 5000,
        currentAmount: 2500,
        deadline: new Date('2027-01-01'),
        priority: 1,
        timeHorizon: 'medium',
        linkedAccountIds: ['savings'],
      },
      {
        id: 'goal2',
        name: 'Goal 2',
        targetAmount: 10000,
        currentAmount: 8000,
        deadline: new Date('2027-01-01'),
        priority: 2,
        timeHorizon: 'medium',
        linkedAccountIds: ['savings'],
      },
    ],
  });
  
  const summary = generateGoalSummary(sameDeadlineUser);
  assert(summary.length === 2, 'Both goals in summary');
  if (summary[0] && summary[1]) {
    assert(summary[0].deadline.getTime() === summary[1].deadline.getTime(),
      'Same deadlines preserved');
  }
}

// Edge Case 18: User with zero liquid assets
{
  console.log('\n[Edge Case 18: Zero liquid assets]');
  const zeroLiquidUser = createTestUser({
    accounts: {
      checking: 0,
      savings: 0,
      investments: { taxable: 5000, rothIRA: 0, traditional401k: 0 },
    },
  });
  
  try {
    const summary = generateGoalSummary(zeroLiquidUser);
    assert(Array.isArray(summary), 'Handles zero liquid assets');
  } catch (e) {
    assert(false, 'Should not throw for zero liquid', String(e));
  }
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n\n' + '='.repeat(70));
console.log('🧪 RECOMMENDATION ENGINE TEST RESULTS');
console.log('='.repeat(70));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📊 Total: ${testsPassed + testsFailed}`);

if (testsFailed > 0) {
  console.log('\n⚠️  Some tests failed!');
  process.exit(1);
} else {
  console.log('\n🎉 All recommendation engine edge case tests passed!');
  process.exit(0);
}
