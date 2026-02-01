import { sampleUser } from '../sample-data.js';
import { simulate_invest } from '../simulation-engine.js';
import { getInvestmentBalance, getInvestmentAllocation, calculatePortfolioAllocation } from '../../types/financial.js';
console.log('\n🧪 ASSET ALLOCATION INTEGRATION TEST');
console.log('='.repeat(60));
console.log('\n📊 TEST: Investment preserves allocation data');
console.log('-'.repeat(60));
const initialAlloc = getInvestmentAllocation(sampleUser.accounts.investments.taxable);
console.log(`Initial taxable allocation: ${initialAlloc.stocks}% stocks, ${initialAlloc.bonds}% bonds, ${initialAlloc.cash}% cash`);
const result = simulate_invest(sampleUser, 500, 'taxable', 'goal_house', 5);
const newBalance = getInvestmentBalance(result.scenarioIfDo.accountsAfter.investments.taxable);
if (newBalance !== 5500) {
    throw new Error(`Expected $5,500 after investment, got $${newBalance}`);
}
console.log(`✅ Balance increased: $5,000 → $${newBalance.toLocaleString()}`);
const newAlloc = getInvestmentAllocation(result.scenarioIfDo.accountsAfter.investments.taxable);
console.log(`New taxable allocation: ${newAlloc.stocks}% stocks, ${newAlloc.bonds}% bonds, ${newAlloc.cash}% cash`);
if (typeof sampleUser.accounts.investments.taxable !== 'number') {
    if (newAlloc.stocks !== initialAlloc.stocks) {
        throw new Error(`Allocation should be preserved. Expected ${initialAlloc.stocks}% stocks, got ${newAlloc.stocks}%`);
    }
    console.log(`✅ Allocation preserved: ${newAlloc.stocks}% stocks`);
}
else {
    if (newAlloc.stocks !== 100) {
        throw new Error(`New investment should get default 100% stocks allocation, got ${newAlloc.stocks}%`);
    }
    console.log(`✅ New investment got default allocation: ${newAlloc.stocks}% stocks`);
}
console.log('\n📊 TEST: Portfolio-level allocation calculation');
console.log('-'.repeat(60));
const portfolioAlloc = calculatePortfolioAllocation(sampleUser.accounts.investments);
console.log(`Overall Portfolio Allocation:`);
console.log(`  Stocks: ${portfolioAlloc.stocks}%`);
console.log(`  Bonds: ${portfolioAlloc.bonds}%`);
console.log(`  Cash: ${portfolioAlloc.cash}%`);
const sum = portfolioAlloc.stocks + portfolioAlloc.bonds + portfolioAlloc.cash + (portfolioAlloc.other || 0);
if (Math.abs(sum - 100) > 1) {
    throw new Error(`Allocation percentages should sum to ~100, got ${sum}`);
}
console.log(`✅ Percentages sum to ${sum.toFixed(1)}% (within rounding tolerance)`);
console.log('\n📊 TEST: Multi-account weighted allocation');
console.log('-'.repeat(60));
const testUser = {
    ...sampleUser,
    accounts: {
        ...sampleUser.accounts,
        investments: {
            taxable: {
                balance: 10000,
                allocation: { stocks: 80, bonds: 15, cash: 5 },
            },
            rothIRA: {
                balance: 20000,
                allocation: { stocks: 90, bonds: 10, cash: 0 },
            },
            traditional401k: {
                balance: 30000,
                allocation: { stocks: 70, bonds: 25, cash: 5 },
            },
        },
    },
};
const multiAlloc = calculatePortfolioAllocation(testUser.accounts.investments);
console.log(`Multi-account Portfolio (weighted average):`);
console.log(`  Total invested: $${(10000 + 20000 + 30000).toLocaleString()}`);
console.log(`  Stocks: ${multiAlloc.stocks}%`);
console.log(`  Bonds: ${multiAlloc.bonds}%`);
console.log(`  Cash: ${multiAlloc.cash}%`);
if (Math.abs(multiAlloc.stocks - 78.3) > 2) {
    throw new Error(`Expected ~78.3% stocks, got ${multiAlloc.stocks}%`);
}
if (Math.abs(multiAlloc.bonds - 18.3) > 2) {
    throw new Error(`Expected ~18.3% bonds, got ${multiAlloc.bonds}%`);
}
if (Math.abs(multiAlloc.cash - 3.3) > 2) {
    throw new Error(`Expected ~3.3% cash, got ${multiAlloc.cash}%`);
}
console.log(`✅ Weighted average calculated correctly`);
console.log('\n🎉 ALL INTEGRATION TESTS PASSED!');
console.log('='.repeat(60));
console.log('✅ Simulation engine works with allocation data');
console.log('✅ Allocations are preserved during investments');
console.log('✅ Portfolio-level allocation calculation works');
console.log('✅ Multi-account weighted averages are correct');
console.log('\n🚀 Asset allocation is fully integrated and working!\n');
//# sourceMappingURL=allocation-integration.test.js.map