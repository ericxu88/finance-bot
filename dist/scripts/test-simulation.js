import { sampleUser } from '../lib/sample-data.js';
import { simulate_save, simulate_invest, compare_options, } from '../lib/simulation-engine.js';
console.log('=== Testing Simulation Engine ===\n');
const goalEmergencyId = sampleUser.goals[0]?.id ?? 'goal_emergency';
const goalHouseId = sampleUser.goals[1]?.id ?? 'goal_house';
console.log('TEST 1: Save $500');
const saveResult = simulate_save(sampleUser, 500, goalEmergencyId);
console.log('Checking after:', saveResult.scenarioIfDo.accountsAfter.checking);
console.log('Savings after:', saveResult.scenarioIfDo.accountsAfter.savings);
const goalImpact0 = saveResult.scenarioIfDo.goalImpacts[0];
console.log('Goal impact:', goalImpact0 ? `${goalImpact0.goalName} +${goalImpact0.progressChangePct}%` : 'N/A');
console.log('\n');
console.log('TEST 2: Invest $500');
const investResult = simulate_invest(sampleUser, 500, 'taxable', goalHouseId);
const investImpact = investResult.scenarioIfDo.goalImpacts[0];
console.log('Investment value in 5 years:', investImpact?.futureValue);
console.log('Goal progress change:', investImpact ? `${investImpact.progressChangePct}%` : 'N/A');
console.log('\n');
console.log('TEST 3: Compare Save vs Invest vs Spend');
const comparison = compare_options(sampleUser, [
    { type: 'save', amount: 500, targetAccountId: 'savings', goalId: goalEmergencyId },
    { type: 'invest', amount: 500, targetAccountId: 'taxable', goalId: goalHouseId },
    { type: 'spend', amount: 500, category: 'cat_dining' },
]);
console.log('Number of options:', comparison.length);
comparison.forEach((result, i) => {
    console.log(`Option ${i + 1}: ${result.action.type}`);
    console.log('  Checking balance:', result.scenarioIfDo.accountsAfter.checking);
});
//# sourceMappingURL=test-simulation.js.map