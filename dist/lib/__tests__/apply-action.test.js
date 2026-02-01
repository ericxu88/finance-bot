import { apply_action, simulate_save } from '../simulation-engine.js';
import { sampleUser } from '../sample-data.js';
function assert(condition, message) {
    if (!condition)
        throw new Error(`Assertion failed: ${message}`);
}
console.log('\n🧪 apply_action unit tests');
console.log('='.repeat(60));
const userSave = { ...sampleUser, id: 'apply_test_save' };
const saveAction = { type: 'save', amount: 500, goalId: 'goal_emergency' };
const simSave = simulate_save(userSave, 500, 'goal_emergency');
const { updatedUser: updatedSave, simulationResult: simResultSave } = apply_action(userSave, saveAction);
assert(userSave.accounts.checking === 3000, 'input user should not be mutated (checking)');
assert(userSave.accounts.savings === 8000, 'input user should not be mutated (savings)');
assert(updatedSave.accounts.checking === simSave.scenarioIfDo.accountsAfter.checking, 'apply save checking matches simulation');
assert(updatedSave.accounts.savings === simSave.scenarioIfDo.accountsAfter.savings, 'apply save savings matches simulation');
assert(simResultSave.action.type === 'save' && simResultSave.action.amount === 500, 'simulationResult action matches');
const emergencyGoal = updatedSave.goals.find((g) => g.id === 'goal_emergency');
assert(emergencyGoal != null && emergencyGoal.currentAmount === 8000 + 500, 'goal currentAmount increased by 500');
assert(updatedSave.updatedAt.getTime() >= userSave.updatedAt.getTime(), 'updatedAt should be current');
console.log('✅ apply_action(save): no mutation, correct balances and goal progress');
const userInvest = { ...sampleUser, id: 'apply_test_invest' };
const investAction = { type: 'invest', amount: 300, targetAccountId: 'taxable', goalId: 'goal_house' };
const { updatedUser: updatedInvest, simulationResult: simResultInvest } = apply_action(userInvest, investAction);
assert(userInvest.accounts.checking === 3000, 'input not mutated');
assert(updatedInvest.accounts.investments.taxable === userInvest.accounts.investments.taxable + 300, 'taxable increased by 300');
assert(updatedInvest.accounts.checking === userInvest.accounts.checking - 300, 'checking decreased by 300');
assert(simResultInvest.action.type === 'invest', 'simulationResult type invest');
const houseGoal = updatedInvest.goals.find((g) => g.id === 'goal_house');
assert(houseGoal != null && houseGoal.currentAmount === 5000 + 300, 'house goal increased by 300');
console.log('✅ apply_action(invest): correct account and goal updates');
const userSpend = {
    ...sampleUser,
    id: 'apply_test_spend',
    spendingCategories: [
        {
            id: 'cat_groceries',
            name: 'Groceries',
            monthlyBudget: 400,
            currentSpent: 100,
            transactions: [],
        },
    ],
};
const spendAction = { type: 'spend', amount: 50, category: 'Groceries' };
const { updatedUser: updatedSpend, simulationResult: simResultSpend } = apply_action(userSpend, spendAction);
assert(userSpend.spendingCategories[0].currentSpent === 100, 'input not mutated');
const groceriesAfter = updatedSpend.spendingCategories.find((c) => c.name === 'Groceries');
assert(groceriesAfter != null && groceriesAfter.currentSpent === 150, 'currentSpent 100 + 50 = 150');
assert(simResultSpend.action.type === 'spend' && simResultSpend.action.amount === 50, 'simulationResult spend');
assert(updatedSpend.accounts.checking === userSpend.accounts.checking - 50, 'checking decreased by 50');
console.log('✅ apply_action(spend): category and checking updated');
const saveActionNoGoal = { type: 'save', amount: 200 };
const { updatedUser: updatedSave2 } = apply_action(userSave, saveActionNoGoal);
assert(updatedSave2.accounts.savings === 8000 + 200, 'save without goalId still updates savings');
assert(updatedSave2.accounts.checking === 3000 - 200, 'checking decreased');
console.log('✅ apply_action(save, no goalId): still updates accounts');
let threw = false;
try {
    const badAction = { type: 'other', amount: 1 };
    apply_action(sampleUser, badAction);
}
catch (e) {
    threw = true;
    assert(e.message.includes('Unknown action type'), 'error message mentions unknown type');
}
assert(threw, 'unknown action type should throw');
console.log('✅ apply_action(unknown type) throws');
console.log('\n✅ All apply_action tests passed.');
//# sourceMappingURL=apply-action.test.js.map