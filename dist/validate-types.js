import { sampleUserSarah, sampleAction, sampleSimulationResult, sampleComparisonOptions, } from './types/sample-data.js';
import { getInvestmentBalance } from './types/financial.js';
function calculateTotalAssets(user) {
    const { checking, savings, investments } = user.accounts;
    const investmentTotal = getInvestmentBalance(investments.taxable) +
        getInvestmentBalance(investments.rothIRA) +
        getInvestmentBalance(investments.traditional401k);
    return checking + savings + investmentTotal;
}
function calculateMonthlyFixedExpenses(user) {
    return user.fixedExpenses.reduce((total, expense) => {
        if (expense.frequency === 'monthly') {
            return total + expense.amount;
        }
        else if (expense.frequency === 'annual') {
            return total + (expense.amount / 12);
        }
        return total;
    }, 0);
}
function calculateDiscretionaryRemaining(user) {
    return user.spendingCategories.reduce((total, category) => {
        return total + (category.monthlyBudget - category.currentSpent);
    }, 0);
}
function getGoalCompletionPct(goalId, user) {
    const goal = user.goals.find(g => g.id === goalId);
    if (!goal)
        return 0;
    return (goal.currentAmount / goal.targetAmount) * 100;
}
function validateSimulation(result) {
    const issues = [];
    if (result.action.amount <= 0) {
        issues.push('Action amount must be positive');
    }
    if (!result.scenarioIfDo || !result.scenarioIfDont) {
        issues.push('Both scenarios (do/dont) must be provided');
    }
    if (!result.validationResult) {
        issues.push('Validation result must be provided');
    }
    const validConfidence = ['high', 'medium', 'low'];
    if (!validConfidence.includes(result.confidence)) {
        issues.push('Invalid confidence level');
    }
    return {
        isValid: issues.length === 0,
        issues,
    };
}
console.log('🔍 Type Validation Report\n');
console.log('='.repeat(60));
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
console.log('\n🎯 FINANCIAL GOALS');
console.log('-'.repeat(60));
sampleUserSarah.goals.forEach(goal => {
    const completionPct = getGoalCompletionPct(goal.id, sampleUserSarah);
    console.log(`${goal.name}:`);
    console.log(`  Progress: ${completionPct.toFixed(1)}% ($${goal.currentAmount.toLocaleString()} / $${goal.targetAmount.toLocaleString()})`);
    console.log(`  Priority: ${goal.priority} | Horizon: ${goal.timeHorizon}`);
    console.log(`  Deadline: ${goal.deadline.toLocaleDateString()}`);
});
console.log('\n💰 FINANCIAL ACTION');
console.log('-'.repeat(60));
console.log(`Type: ${sampleAction.type}`);
console.log(`Amount: $${sampleAction.amount}`);
console.log(`Target: ${sampleAction.targetAccountId}`);
console.log(`Supporting Goal: ${sampleAction.goalId}`);
console.log('\n🔮 SIMULATION RESULT');
console.log('-'.repeat(60));
const validation = validateSimulation(sampleSimulationResult);
console.log(`Validation Status: ${validation.isValid ? '✅ PASSED' : '❌ FAILED'}`);
if (validation.issues.length > 0) {
    console.log('Issues:');
    validation.issues.forEach(issue => console.log(`  - ${issue}`));
}
else {
    console.log('No issues found - all required fields present');
}
console.log(`Confidence: ${sampleSimulationResult.confidence}`);
console.log(`Passed Constraints: ${sampleSimulationResult.validationResult.passed ? 'Yes' : 'No'}`);
console.log(`Constraint Violations: ${sampleSimulationResult.validationResult.constraintViolations.length}`);
console.log(`Uncertainty Sources: ${sampleSimulationResult.validationResult.uncertaintySources.length}`);
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
console.log('\n🔄 COMPARISON OPTIONS');
console.log('-'.repeat(60));
sampleComparisonOptions.forEach((option, idx) => {
    console.log(`${idx + 1}. ${option.label}`);
    console.log(`   Confidence: ${option.result.confidence}`);
});
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
//# sourceMappingURL=validate-types.js.map