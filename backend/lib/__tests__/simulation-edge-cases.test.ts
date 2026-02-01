/**
 * Simulation Engine Edge Case Tests
 * 
 * Tests calculateFutureValue, calculateTimeToGoal, calculateGoalImpact,
 * checkConstraintViolations, and simulation functions with edge cases.
 */

import {
  calculateFutureValue,
  calculateTimeToGoal,
  calculateGoalImpact,
  checkConstraintViolations,
  calculateBudgetStatus,
  calculateLiquidityImpact,
  cloneAccounts,
  simulate_save,
  simulate_invest,
  simulate_spend,
  compare_options,
} from '../simulation-engine.js';
import { sampleUser } from '../sample-data.js';
import type { UserProfile, FinancialGoal, Accounts, FinancialAction } from '../../types/financial.js';

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


console.log('\n🧪 SIMULATION ENGINE EDGE CASE TESTS');
console.log('='.repeat(70));

// ============================================================================
// calculateFutureValue EDGE CASES
// ============================================================================

console.log('\n📊 calculateFutureValue Edge Cases');
console.log('-'.repeat(70));

// Edge Case: Zero principal
{
  const result = calculateFutureValue(0, 0, 0.07, 5);
  assert(result === 0, 'Zero principal + zero contribution = $0');
}

// Edge Case: Zero principal with monthly contribution
{
  const result = calculateFutureValue(0, 100, 0.07, 5);
  assert(result > 6000, 'Zero principal + $100/mo for 5 years > $6,000', `Got: ${result}`);
}

// Edge Case: Zero return rate
{
  const result = calculateFutureValue(1000, 100, 0, 5);
  assert(result === 7000, '0% return = simple sum: $1,000 + $100*60 = $7,000', `Got: ${result}`);
}

// Edge Case: Zero years
{
  const result = calculateFutureValue(1000, 100, 0.07, 0);
  assert(result === 1000, 'Zero years = principal unchanged', `Got: ${result}`);
}

// Edge Case: Very high return rate (100%)
{
  const result = calculateFutureValue(1000, 0, 1.0, 1);
  assert(result > 2000 && result < 3000, '100% annual return for 1 year doubles+', `Got: ${result}`);
}

// Edge Case: Very small amounts (cents)
{
  const result = calculateFutureValue(0.01, 0.01, 0.07, 1);
  assert(result >= 0 && isFinite(result), 'Handles tiny amounts without breaking', `Got: ${result}`);
}

// Edge Case: Very large amounts
{
  const result = calculateFutureValue(1000000000, 0, 0.07, 30);
  assert(isFinite(result) && result > 0, 'Handles billion-dollar amounts', `Got: ${result.toExponential()}`);
}

// Edge Case: Negative return rate (market crash scenario)
{
  const result = calculateFutureValue(1000, 0, -0.20, 1);
  assert(result > 0 && result < 1000, '-20% return reduces principal', `Got: ${result}`);
}

// ============================================================================
// calculateTimeToGoal EDGE CASES
// ============================================================================

console.log('\n📊 calculateTimeToGoal Edge Cases');
console.log('-'.repeat(70));

const baseGoal: FinancialGoal = {
  id: 'test_goal',
  name: 'Test Goal',
  targetAmount: 10000,
  currentAmount: 0,
  deadline: new Date('2030-01-01'),
  priority: 1,
  timeHorizon: 'long',
  linkedAccountIds: ['savings'],
};

// Edge Case: Goal already achieved
{
  const achievedGoal = { ...baseGoal, currentAmount: 15000, targetAmount: 10000 };
  const months = calculateTimeToGoal(achievedGoal, 500);
  assert(months === 0, 'Goal already achieved = 0 months', `Got: ${months}`);
}

// Edge Case: Zero monthly contribution
{
  const months = calculateTimeToGoal(baseGoal, 0);
  assert(months === Infinity, 'Zero contribution = Infinity', `Got: ${months}`);
}

// Edge Case: Negative monthly contribution
{
  const months = calculateTimeToGoal(baseGoal, -100);
  assert(months === Infinity, 'Negative contribution = Infinity', `Got: ${months}`);
}

// Edge Case: Exact amount in one payment
{
  const goal = { ...baseGoal, currentAmount: 9000, targetAmount: 10000 };
  const months = calculateTimeToGoal(goal, 1000, 0);
  assert(months === 1, 'Exact remaining amount = 1 month', `Got: ${months}`);
}

// Edge Case: Goal with investment returns
{
  const goal = { ...baseGoal, currentAmount: 5000 };
  const monthsNoReturn = calculateTimeToGoal(goal, 100, 0);
  const monthsWithReturn = calculateTimeToGoal(goal, 100, 0.07);
  assert(monthsWithReturn < monthsNoReturn, 'Investment returns reduce time', 
    `No return: ${monthsNoReturn}, With return: ${monthsWithReturn}`);
}

// Edge Case: Very small contribution
{
  const months = calculateTimeToGoal(baseGoal, 0.01, 0);
  assert(months === Infinity || months > 100000, 'Tiny contribution = very long time', `Got: ${months}`);
}

// Edge Case: Current amount equals target
{
  const exactGoal = { ...baseGoal, currentAmount: 10000, targetAmount: 10000 };
  const months = calculateTimeToGoal(exactGoal, 500);
  assert(months === 0, 'Current = Target means 0 months', `Got: ${months}`);
}

// ============================================================================
// calculateGoalImpact EDGE CASES
// ============================================================================

console.log('\n📊 calculateGoalImpact Edge Cases');
console.log('-'.repeat(70));

// Edge Case: Goal already achieved
{
  const achievedGoal = { ...baseGoal, currentAmount: 15000 };
  const impact = calculateGoalImpact(achievedGoal, 500);
  assert(impact.progressChangePct === 0, 'No progress change when already achieved', 
    `Got: ${impact.progressChangePct}%`);
  assert(impact.timeSaved === 0, 'No time saved when already achieved');
}

// Edge Case: Zero amount added
{
  const impact = calculateGoalImpact(baseGoal, 0);
  assert(impact.progressChangePct === 0, 'Zero amount = 0% progress change', 
    `Got: ${impact.progressChangePct}%`);
}

// Edge Case: Adding more than remaining
{
  const goal = { ...baseGoal, currentAmount: 9000 };
  const impact = calculateGoalImpact(goal, 5000); // Adding 5k when only 1k needed
  assert(impact.progressChangePct > 0, 'Still shows positive progress', 
    `Got: ${impact.progressChangePct}%`);
}

// Edge Case: Very small percentage change
{
  const goal = { ...baseGoal, targetAmount: 1000000 }; // $1M goal
  const impact = calculateGoalImpact(goal, 1); // Adding $1
  assert(impact.progressChangePct >= 0 && impact.progressChangePct < 0.01, 
    'Tiny contribution shows near-zero progress', `Got: ${impact.progressChangePct}%`);
}

// Edge Case: No investment return (savings)
{
  const impact = calculateGoalImpact(baseGoal, 500, 0);
  assert(impact.timeToGoalBefore === Infinity, 'No return + no contribution = Infinity time before');
  assert(impact.timeToGoalAfter === Infinity, 'No return + no contribution = Infinity time after');
}

// ============================================================================
// checkConstraintViolations EDGE CASES
// ============================================================================

console.log('\n📊 checkConstraintViolations Edge Cases');
console.log('-'.repeat(70));

// Edge Case: No guardrails defined
{
  const userNoGuards: UserProfile = {
    ...sampleUser,
    preferences: { ...sampleUser.preferences, guardrails: [] }
  };
  const accounts: Accounts = { ...sampleUser.accounts, checking: 0 };
  const violations = checkConstraintViolations(userNoGuards, accounts);
  assert(violations.length === 0, 'No guardrails = no violations');
}

// Edge Case: Exactly at threshold
{
  const user: UserProfile = {
    ...sampleUser,
    preferences: {
      ...sampleUser.preferences,
      guardrails: [{
        id: 'min_check',
        rule: 'Minimum checking $1000',
        type: 'min_balance',
        accountId: 'checking',
        threshold: 1000
      }]
    }
  };
  const accountsAt = { ...sampleUser.accounts, checking: 1000 };
  const accountsBelow = { ...sampleUser.accounts, checking: 999.99 };
  
  const violationsAt = checkConstraintViolations(user, accountsAt);
  const violationsBelow = checkConstraintViolations(user, accountsBelow);
  
  assert(violationsAt.length === 0, 'Exactly at threshold = no violation');
  assert(violationsBelow.length === 1, 'Just below threshold = violation', `Got ${violationsBelow.length}`);
}

// Edge Case: Multiple guardrails, multiple violations
{
  const user: UserProfile = {
    ...sampleUser,
    preferences: {
      ...sampleUser.preferences,
      guardrails: [
        { id: 'g1', rule: 'Min checking $1000', type: 'min_balance', accountId: 'checking', threshold: 1000 },
        { id: 'g2', rule: 'Min checking $2000', type: 'min_balance', accountId: 'checking', threshold: 2000 },
      ]
    }
  };
  const accounts = { ...sampleUser.accounts, checking: 500 };
  const violations = checkConstraintViolations(user, accounts);
  assert(violations.length === 2, 'Both guardrails violated', `Got ${violations.length}`);
}

// Edge Case: Guardrail with undefined threshold
{
  const user: UserProfile = {
    ...sampleUser,
    preferences: {
      ...sampleUser.preferences,
      guardrails: [
        { id: 'g1', rule: 'Some rule', type: 'min_balance', accountId: 'checking' } // no threshold
      ]
    }
  };
  const accounts = { ...sampleUser.accounts, checking: 0 };
  const violations = checkConstraintViolations(user, accounts);
  assert(violations.length === 0, 'Undefined threshold = no check performed');
}

// ============================================================================
// calculateBudgetStatus EDGE CASES
// ============================================================================

console.log('\n📊 calculateBudgetStatus Edge Cases');
console.log('-'.repeat(70));

// Edge Case: Exactly at boundaries
{
  assert(calculateBudgetStatus(0) === 'under', '0% = under');
  assert(calculateBudgetStatus(49.99) === 'under', '49.99% = under');
  assert(calculateBudgetStatus(50) === 'good', '50% = good (boundary)');
  assert(calculateBudgetStatus(80) === 'good', '80% = good (boundary)');
  assert(calculateBudgetStatus(80.01) === 'warning', '80.01% = warning');
  assert(calculateBudgetStatus(100) === 'warning', '100% = warning (boundary)');
  assert(calculateBudgetStatus(100.01) === 'over', '100.01% = over');
  assert(calculateBudgetStatus(200) === 'over', '200% = over');
}

// Edge Case: Negative percent (shouldn't happen, but test anyway)
{
  const status = calculateBudgetStatus(-10);
  assert(status === 'under', 'Negative percent treated as under', `Got: ${status}`);
}

// ============================================================================
// calculateLiquidityImpact EDGE CASES
// ============================================================================

console.log('\n📊 calculateLiquidityImpact Edge Cases');
console.log('-'.repeat(70));

// Edge Case: No change
{
  const impact = calculateLiquidityImpact(1000, 1000, 5000, 5000);
  assert(impact.includes('No significant change'), 'No change detected', impact);
}

// Edge Case: Large increase
{
  const impact = calculateLiquidityImpact(1000, 2000, 5000, 5000);
  assert(impact.includes('increase'), 'Increase detected', impact);
}

// Edge Case: Significant decrease
{
  const impact = calculateLiquidityImpact(5000, 1000, 5000, 5000);
  assert(impact.includes('decrease'), 'Decrease detected', impact);
}

// Edge Case: Zero starting balance (division edge case)
{
  // This could cause division by zero
  try {
    const impact = calculateLiquidityImpact(0, 1000, 0, 1000);
    assert(true, 'Handles zero starting balance', impact);
  } catch (e) {
    assert(false, 'Should not throw on zero starting balance', String(e));
  }
}

// ============================================================================
// cloneAccounts EDGE CASES
// ============================================================================

console.log('\n📊 cloneAccounts Edge Cases');
console.log('-'.repeat(70));

// Edge Case: All number format
{
  const accounts: Accounts = {
    checking: 1000,
    savings: 5000,
    investments: { taxable: 10000, rothIRA: 5000, traditional401k: 0 }
  };
  const cloned = cloneAccounts(accounts);
  accounts.checking = 0;
  assert(cloned.checking === 1000, 'Cloning preserves original checking');
}

// Edge Case: Mixed InvestmentAccount format
{
  const accounts: Accounts = {
    checking: 1000,
    savings: 5000,
    investments: {
      taxable: { balance: 10000, allocation: { stocks: 80, bonds: 15, cash: 5 } },
      rothIRA: 5000, // number format
      traditional401k: { balance: 0, allocation: { stocks: 60, bonds: 30, cash: 10 } }
    }
  };
  const cloned = cloneAccounts(accounts);
  
  // Mutate original
  if (typeof accounts.investments.taxable !== 'number') {
    accounts.investments.taxable.balance = 0;
    accounts.investments.taxable.allocation.stocks = 0;
  }
  
  const clonedTaxable = cloned.investments.taxable;
  if (typeof clonedTaxable !== 'number') {
    assert(clonedTaxable.balance === 10000, 'Cloned balance unchanged', `Got: ${clonedTaxable.balance}`);
    assert(clonedTaxable.allocation.stocks === 80, 'Cloned allocation unchanged', 
      `Got: ${clonedTaxable.allocation.stocks}`);
  }
}

// ============================================================================
// simulate_save EDGE CASES
// ============================================================================

console.log('\n📊 simulate_save Edge Cases');
console.log('-'.repeat(70));

// Edge Case: Save zero
{
  const result = simulate_save(sampleUser, 0);
  assert(result.scenarioIfDo.accountsAfter.checking === sampleUser.accounts.checking,
    'Save $0 = no change to checking');
  assert(result.scenarioIfDo.accountsAfter.savings === sampleUser.accounts.savings,
    'Save $0 = no change to savings');
}

// Edge Case: Save more than available in checking
{
  const result = simulate_save(sampleUser, sampleUser.accounts.checking + 1000);
  assert(result.scenarioIfDo.accountsAfter.checking < 0,
    'Overdraft allowed in simulation (for guardrail detection)', 
    `Checking: ${result.scenarioIfDo.accountsAfter.checking}`);
  assert(result.validationResult.passed === false || result.validationResult.constraintViolations.length > 0,
    'Should flag violation for over-saving');
}

// Edge Case: Negative save (should be treated as withdrawal?)
{
  try {
    simulate_save(sampleUser, -500);
    assert(true, 'Handles negative amount without crashing');
  } catch (e) {
    assert(false, 'Should not throw on negative save', String(e));
  }
}

// ============================================================================
// simulate_invest EDGE CASES
// ============================================================================

console.log('\n📊 simulate_invest Edge Cases');
console.log('-'.repeat(70));

// Edge Case: Invest zero
{
  const result = simulate_invest(sampleUser, 0, 'taxable');
  assert(result.scenarioIfDo.accountsAfter.checking === sampleUser.accounts.checking,
    'Invest $0 = no change to checking');
}

// Edge Case: User with no goals linked to investment account
{
  const userNoGoals: UserProfile = { ...sampleUser, goals: [] };
  try {
    const result = simulate_invest(userNoGoals, 500, 'taxable');
    assert(result.scenarioIfDo.goalImpacts.length === 0 || result !== null, 
      'Handles user with no goals');
  } catch (e) {
    assert(false, 'Should not throw for user with no goals', String(e));
  }
}

// Edge Case: Different account types
{
  const taxResult = simulate_invest(sampleUser, 500, 'taxable');
  const rothResult = simulate_invest(sampleUser, 500, 'rothIRA');
  const tradResult = simulate_invest(sampleUser, 500, 'traditional401k');
  
  assert(taxResult !== null, 'Taxable investment works');
  assert(rothResult !== null, 'Roth IRA investment works');
  assert(tradResult !== null, 'Traditional 401k investment works');
}

// ============================================================================
// simulate_spend EDGE CASES
// ============================================================================

console.log('\n📊 simulate_spend Edge Cases');
console.log('-'.repeat(70));

// Edge Case: Spend on first category
{
  const firstCategory = sampleUser.spendingCategories[0];
  if (firstCategory) {
    const result = simulate_spend(sampleUser, 100, firstCategory.id);
    assert(result.scenarioIfDo.accountsAfter.checking < sampleUser.accounts.checking,
      'Spending deducts from checking');
  }
}

// Edge Case: Spend exactly entire checking balance
{
  const firstCategory = sampleUser.spendingCategories[0];
  if (firstCategory) {
    const result = simulate_spend(sampleUser, sampleUser.accounts.checking, firstCategory.id);
    assert(result.scenarioIfDo.accountsAfter.checking === 0,
      'Spending entire checking leaves $0');
  assert(result.validationResult.constraintViolations.length > 0,
    'Should violate min balance guardrail');
  }
}

// ============================================================================
// compare_options EDGE CASES
// ============================================================================

console.log('\n📊 compare_options Edge Cases');
console.log('-'.repeat(70));

// Edge Case: Empty actions array
{
  try {
    const result = compare_options(sampleUser, []);
    assert(result.length === 0, 'Empty actions = empty results');
  } catch (e) {
    assert(false, 'Should not throw on empty actions', String(e));
  }
}

// Edge Case: Single action
{
  const actions: FinancialAction[] = [{ type: 'save', amount: 500 }];
  const result = compare_options(sampleUser, actions);
  assert(result.length === 1, 'Single action = single result');
}

// Edge Case: Many identical actions
{
  const actions: FinancialAction[] = Array(10).fill({ type: 'save', amount: 500 });
  const result = compare_options(sampleUser, actions);
  assert(result.length === 10, '10 identical actions = 10 results');
  const firstConfidence = result[0]?.confidence;
  assert(result.every(r => r.confidence === firstConfidence), 
    'Identical actions have identical confidence');
}

// Edge Case: Mixed valid and invalid actions
{
  const actions: FinancialAction[] = [
    { type: 'save', amount: 500 },
    { type: 'save', amount: 1000000 }, // Probably violates guardrails
    { type: 'invest', amount: 500, targetAccountId: 'taxable' },
  ];
  const result = compare_options(sampleUser, actions);
  assert(result.length === 3, 'All actions simulated');
  assert(result.some(r => r.validationResult.passed) && result.some(r => !r.validationResult.passed),
    'Mix of valid and invalid results');
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n\n' + '='.repeat(70));
console.log('🧪 SIMULATION ENGINE TEST RESULTS');
console.log('='.repeat(70));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📊 Total: ${testsPassed + testsFailed}`);

if (testsFailed > 0) {
  console.log('\n⚠️  Some tests failed!');
  process.exit(1);
} else {
  console.log('\n🎉 All simulation engine edge case tests passed!');
  process.exit(0);
}
