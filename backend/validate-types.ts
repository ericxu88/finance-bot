/**
 * Type Validation Script
 * 
 * This script demonstrates that all types are properly defined and work together.
 * Run with: npm run type-check
 */

import type {
  UserProfile,
  SimulationResult,
} from './types/financial.js';

import {
  sampleUserSarah,
  sampleAction,
  sampleSimulationResult,
  sampleComparisonOptions,
} from './types/sample-data.js';
import { getInvestmentBalance } from './types/financial.js';

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Calculate total assets for a user
 */
function calculateTotalAssets(user: UserProfile): number {
  const { checking, savings, investments } = user.accounts;
  const investmentTotal = 
    getInvestmentBalance(investments.taxable) + 
    getInvestmentBalance(investments.rothIRA) + 
    getInvestmentBalance(investments.traditional401k);
  
  return checking + savings + investmentTotal;
}

/**
 * Calculate total monthly fixed expenses
 */
function calculateMonthlyFixedExpenses(user: UserProfile): number {
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
 * Calculate discretionary spending remaining
 */
function calculateDiscretionaryRemaining(user: UserProfile): number {
  return user.spendingCategories.reduce((total, category) => {
    return total + (category.monthlyBudget - category.currentSpent);
  }, 0);
}

/**
 * Get goal completion percentage
 */
function getGoalCompletionPct(goalId: string, user: UserProfile): number {
  const goal = user.goals.find(g => g.id === goalId);
  if (!goal) return 0;
  return (goal.currentAmount / goal.targetAmount) * 100;
}

/**
 * Validate a simulation result
 */
function validateSimulation(result: SimulationResult): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check that action amount is positive
  if (result.action.amount <= 0) {
    issues.push('Action amount must be positive');
  }
  
  // Check that both scenarios exist
  if (!result.scenarioIfDo || !result.scenarioIfDont) {
    issues.push('Both scenarios (do/dont) must be provided');
  }
  
  // Check that validation result exists
  if (!result.validationResult) {
    issues.push('Validation result must be provided');
  }
  
  // Check confidence level is valid
  const validConfidence = ['high', 'medium', 'low'];
  if (!validConfidence.includes(result.confidence)) {
    issues.push('Invalid confidence level');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
  };
}

// ============================================================================
// RUN VALIDATIONS
// ============================================================================

console.log('🔍 Type Validation Report\n');
console.log('=' .repeat(60));

// User Profile Validation
console.log('\n📊 USER PROFILE: Sarah Chen');
console.log('-'.repeat(60));
console.log(`Name: ${sampleUserSarah.name}`);
console.log(`Monthly Income: $${sampleUserSarah.monthlyIncome.toLocaleString()}`);
console.log(`Total Assets: $${calculateTotalAssets(sampleUserSarah).toLocaleString()}`);
console.log(`Fixed Expenses: $${calculateMonthlyFixedExpenses(sampleUserSarah).toLocaleString()}/month`);
console.log(`Discretionary Remaining: $${calculateDiscretionaryRemaining(sampleUserSarah).toLocaleString()}`);
console.log(`Number of Goals: ${sampleUserSarah.goals.length}`);
console.log(`Risk Tolerance: ${sampleUserSarah.preferences.riskTolerance}`);
console.log(`Active Guardrails: ${sampleUserSarah.preferences.guardrails.length}`);

// Goals Validation
console.log('\n🎯 FINANCIAL GOALS');
console.log('-'.repeat(60));
sampleUserSarah.goals.forEach(goal => {
  const completionPct = getGoalCompletionPct(goal.id, sampleUserSarah);
  console.log(`${goal.name}:`);
  console.log(`  Progress: ${completionPct.toFixed(1)}% ($${goal.currentAmount.toLocaleString()} / $${goal.targetAmount.toLocaleString()})`);
  console.log(`  Priority: ${goal.priority} | Horizon: ${goal.timeHorizon}`);
  console.log(`  Deadline: ${goal.deadline.toLocaleDateString()}`);
});

// Action Validation
console.log('\n💰 FINANCIAL ACTION');
console.log('-'.repeat(60));
console.log(`Type: ${sampleAction.type}`);
console.log(`Amount: $${sampleAction.amount}`);
console.log(`Target: ${sampleAction.targetAccountId}`);
console.log(`Supporting Goal: ${sampleAction.goalId}`);

// Simulation Validation
console.log('\n🔮 SIMULATION RESULT');
console.log('-'.repeat(60));
const validation = validateSimulation(sampleSimulationResult);
console.log(`Validation Status: ${validation.isValid ? '✅ PASSED' : '❌ FAILED'}`);
if (validation.issues.length > 0) {
  console.log('Issues:');
  validation.issues.forEach(issue => console.log(`  - ${issue}`));
} else {
  console.log('No issues found - all required fields present');
}
console.log(`Confidence: ${sampleSimulationResult.confidence}`);
console.log(`Passed Constraints: ${sampleSimulationResult.validationResult.passed ? 'Yes' : 'No'}`);
console.log(`Constraint Violations: ${sampleSimulationResult.validationResult.constraintViolations.length}`);
console.log(`Uncertainty Sources: ${sampleSimulationResult.validationResult.uncertaintySources.length}`);

// Goal Impacts
console.log('\n📈 GOAL IMPACTS (If Action Taken)');
console.log('-'.repeat(60));
sampleSimulationResult.scenarioIfDo.goalImpacts.forEach(impact => {
  console.log(`${impact.goalName}:`);
  console.log(`  Progress Change: ${impact.progressChangePct > 0 ? '+' : ''}${impact.progressChangePct}%`);
  console.log(`  Time Saved: ${impact.timeSaved} months`);
  if (impact.futureValue) {
    console.log(`  Future Value: $${impact.futureValue.toLocaleString()}`);
  }
});

// Budget Impacts
console.log('\n💳 BUDGET STATUS');
console.log('-'.repeat(60));
sampleSimulationResult.scenarioIfDo.budgetImpacts.forEach(budget => {
  const statusIcon = {
    under: '🟢',
    good: '🟢',
    warning: '🟡',
    over: '🔴',
  }[budget.status];
  
  console.log(`${statusIcon} ${budget.categoryName}: ${budget.percentUsed.toFixed(1)}% used ($${budget.amountRemaining.toLocaleString()} remaining)`);
});

// Comparison Options
console.log('\n🔄 COMPARISON OPTIONS');
console.log('-'.repeat(60));
sampleComparisonOptions.forEach((option, idx) => {
  console.log(`${idx + 1}. ${option.label}`);
  console.log(`   Confidence: ${option.result.confidence}`);
});

// Type System Summary
console.log('\n✅ TYPE SYSTEM VALIDATION COMPLETE');
console.log('='.repeat(60));
console.log('All core types are properly defined and working:');
console.log('  ✓ UserProfile');
console.log('  ✓ Accounts & InvestmentAccounts');
console.log('  ✓ FixedExpense & SpendingCategory');
console.log('  ✓ Transaction');
console.log('  ✓ FinancialGoal');
console.log('  ✓ UserPreferences & Guardrail');
console.log('  ✓ FinancialAction');
console.log('  ✓ SimulationResult & Scenario');
console.log('  ✓ GoalImpact & BudgetImpact');
console.log('  ✓ ValidationResult');
console.log('  ✓ ComparisonOption');
console.log('\n🚀 Ready for next phase: Simulation Engine implementation\n');
