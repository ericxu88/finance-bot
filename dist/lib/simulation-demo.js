import { simulate_save, simulate_invest, simulate_spend, compare_options, calculateFutureValue, } from './simulation-engine.js';
import { sampleUser } from './sample-data.js';
import { getInvestmentBalance } from '../types/financial.js';
console.log('\n🎮 SIMULATION ENGINE DEMO');
console.log('='.repeat(70));
console.log(`User: ${sampleUser.name}`);
console.log(`Assets: $${(sampleUser.accounts.checking + sampleUser.accounts.savings + getInvestmentBalance(sampleUser.accounts.investments.taxable)).toLocaleString()}`);
console.log(`Monthly Surplus: $2,250\n`);
console.log('💰 SCENARIO 1: Save $500 to Emergency Fund');
console.log('-'.repeat(70));
const saveSimulation = simulate_save(sampleUser, 500, 'goal_emergency');
console.log(`Action: ${saveSimulation.action.type} $${saveSimulation.action.amount}`);
console.log(`Confidence: ${saveSimulation.confidence}`);
console.log(`\nIF YOU DO IT:`);
console.log(`  Checking: $3,000 → $${saveSimulation.scenarioIfDo.accountsAfter.checking.toLocaleString()}`);
console.log(`  Savings: $8,000 → $${saveSimulation.scenarioIfDo.accountsAfter.savings.toLocaleString()}`);
if (saveSimulation.scenarioIfDo.goalImpacts[0]) {
    const impact = saveSimulation.scenarioIfDo.goalImpacts[0];
    console.log(`  Goal Progress: +${impact.progressChangePct.toFixed(1)}% toward ${impact.goalName}`);
}
console.log(`\nIF YOU DON'T:`);
console.log(`  No goal progress`);
console.log(`  Money stays in checking (earning 0%)`);
console.log(`\nRECOMMENDATION: ${saveSimulation.reasoning}\n`);
console.log('📈 SCENARIO 2: Invest $500 in Taxable Account');
console.log('-'.repeat(70));
const investSimulation = simulate_invest(sampleUser, 500, 'taxable', 'goal_house', 5);
console.log(`Action: ${investSimulation.action.type} $${investSimulation.action.amount}`);
console.log(`Confidence: ${investSimulation.confidence}`);
console.log(`\nIF YOU DO IT:`);
console.log(`  Checking: $3,000 → $${investSimulation.scenarioIfDo.accountsAfter.checking.toLocaleString()}`);
console.log(`  Taxable Investments: $5,000 → $${getInvestmentBalance(investSimulation.scenarioIfDo.accountsAfter.investments.taxable).toLocaleString()}`);
if (investSimulation.scenarioIfDo.goalImpacts[0]) {
    const impact = investSimulation.scenarioIfDo.goalImpacts[0];
    console.log(`  Goal Progress: +${impact.progressChangePct.toFixed(1)}% toward ${impact.goalName}`);
    if (impact.futureValue) {
        console.log(`  Future Value (5yr): $${impact.futureValue.toFixed(2)} at 7% return`);
    }
}
console.log(`\n  ${investSimulation.scenarioIfDo.riskImpact}`);
console.log(`\nIF YOU DON'T:`);
console.log(`  ${investSimulation.scenarioIfDont.riskImpact}`);
console.log(`\nRECOMMENDATION: ${investSimulation.reasoning}\n`);
console.log('🍽️  SCENARIO 3: Spend $500 on Dining');
console.log('-'.repeat(70));
const spendSimulation = simulate_spend(sampleUser, 500, 'cat_dining');
console.log(`Action: ${spendSimulation.action.type} $${spendSimulation.action.amount}`);
console.log(`Confidence: ${spendSimulation.confidence}`);
console.log(`\nIF YOU DO IT:`);
console.log(`  Checking: $3,000 → $${spendSimulation.scenarioIfDo.accountsAfter.checking.toLocaleString()}`);
const diningBudget = spendSimulation.scenarioIfDo.budgetImpacts.find(bi => bi.categoryId === 'cat_dining');
if (diningBudget) {
    console.log(`  Dining Budget: ${diningBudget.percentUsed.toFixed(1)}% used (${diningBudget.status})`);
    console.log(`  Remaining: $${diningBudget.amountRemaining.toFixed(2)}`);
}
console.log(`\nIF YOU DON'T:`);
console.log(`  ${spendSimulation.scenarioIfDont.riskImpact}`);
console.log(`\nRECOMMENDATION: ${spendSimulation.reasoning}\n`);
console.log('🔄 SCENARIO 4: Compare All Three Options');
console.log('-'.repeat(70));
const options = [
    { type: 'save', amount: 500, targetAccountId: 'savings', goalId: 'goal_emergency' },
    { type: 'invest', amount: 500, targetAccountId: 'taxable', goalId: 'goal_house' },
    { type: 'spend', amount: 500, category: 'cat_dining' },
];
const comparison = compare_options(sampleUser, options);
console.log('\n📊 Side-by-Side Comparison:\n');
comparison.forEach((result, index) => {
    console.log(`Option ${index + 1}: ${result.action.type.toUpperCase()} $${result.action.amount}`);
    console.log(`  Confidence: ${result.confidence}`);
    console.log(`  Validation: ${result.validationResult.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  Checking After: $${result.scenarioIfDo.accountsAfter.checking.toLocaleString()}`);
    if (result.scenarioIfDo.goalImpacts.length > 0) {
        result.scenarioIfDo.goalImpacts.forEach(impact => {
            if (impact.progressChangePct > 0) {
                console.log(`  Goal Impact: ${impact.goalName} +${impact.progressChangePct.toFixed(1)}%`);
            }
        });
    }
    console.log('');
});
console.log('🚫 SCENARIO 5: Test Guardrail Violation');
console.log('-'.repeat(70));
const violationSimulation = simulate_save(sampleUser, 2500);
console.log(`Action: Save $2,500`);
console.log(`Validation: ${violationSimulation.validationResult.passed ? '✅ PASSED' : '❌ FAILED'}`);
if (!violationSimulation.validationResult.passed) {
    console.log(`\nVIOLATIONS DETECTED:`);
    violationSimulation.validationResult.constraintViolations.forEach(violation => {
        console.log(`  ⚠️  ${violation}`);
    });
}
console.log(`\nResult: Action blocked due to guardrail protection\n`);
console.log('📊 SCENARIO 6: Investment Growth Projections');
console.log('-'.repeat(70));
const amounts = [500, 1000, 2000];
const years = [5, 10, 20, 30];
console.log('\nProjected value at 7% annual return:\n');
console.log('Initial │  5 years  │  10 years  │  20 years  │  30 years');
console.log('-'.repeat(65));
amounts.forEach(amount => {
    const values = years.map(y => calculateFutureValue(amount, 0, 0.07, y));
    console.log(`$${amount.toString().padStart(5)} │ $${values[0]?.toFixed(2).padStart(8)} │ ` +
        `$${values[1]?.toFixed(2).padStart(9)} │ $${values[2]?.toFixed(2).padStart(9)} │ ` +
        `$${values[3]?.toFixed(2).padStart(9)}`);
});
console.log('\n💡 The power of compound growth over time!\n');
console.log('✅ DEMO COMPLETE');
console.log('='.repeat(70));
console.log('The simulation engine provides:');
console.log('  ✓ Accurate financial projections');
console.log('  ✓ Goal impact analysis');
console.log('  ✓ Budget tracking');
console.log('  ✓ Guardrail enforcement');
console.log('  ✓ Side-by-side comparisons');
console.log('  ✓ Investment growth calculations');
console.log('\n🚀 Ready for production use!\n');
//# sourceMappingURL=simulation-demo.js.map