import { sampleUser } from '../sample-data.js';
import { getInvestmentBalance, getInvestmentAllocation, calculatePortfolioAllocation } from '../../types/financial.js';
console.log('\n🧪 ASSET ALLOCATION TESTS');
console.log('='.repeat(60));
console.log('\n📊 TEST 1: getInvestmentBalance helper');
console.log('-'.repeat(60));
const taxableBalance = getInvestmentBalance(sampleUser.accounts.investments.taxable);
console.log(`✅ Taxable balance: $${taxableBalance.toLocaleString()}`);
if (taxableBalance !== 5000) {
    throw new Error(`Expected $5,000, got $${taxableBalance}`);
}
const rothBalance = getInvestmentBalance(sampleUser.accounts.investments.rothIRA);
console.log(`✅ Roth IRA balance: $${rothBalance.toLocaleString()}`);
if (rothBalance !== 0) {
    throw new Error(`Expected $0, got $${rothBalance}`);
}
const testAccounts = {
    taxable: 1000,
    rothIRA: {
        balance: 2000,
        allocation: { stocks: 100, bonds: 0, cash: 0 },
    },
    traditional401k: 3000,
};
const testBalance1 = getInvestmentBalance(testAccounts.taxable);
if (testBalance1 !== 1000) {
    throw new Error(`Expected $1,000 for number format, got $${testBalance1}`);
}
console.log(`✅ Number format (backward compatible): $${testBalance1.toLocaleString()}`);
const testBalance2 = getInvestmentBalance(testAccounts.rothIRA);
if (testBalance2 !== 2000) {
    throw new Error(`Expected $2,000 for InvestmentAccount format, got $${testBalance2}`);
}
console.log(`✅ InvestmentAccount format: $${testBalance2.toLocaleString()}`);
console.log('✅ TEST 1 PASSED\n');
console.log('📊 TEST 2: getInvestmentAllocation helper');
console.log('-'.repeat(60));
const taxableAlloc = getInvestmentAllocation(sampleUser.accounts.investments.taxable);
console.log(`✅ Taxable allocation: ${taxableAlloc.stocks}% stocks, ${taxableAlloc.bonds}% bonds, ${taxableAlloc.cash}% cash`);
if (taxableAlloc.stocks !== 80 || taxableAlloc.bonds !== 15 || taxableAlloc.cash !== 5) {
    throw new Error(`Expected 80/15/5, got ${taxableAlloc.stocks}/${taxableAlloc.bonds}/${taxableAlloc.cash}`);
}
const defaultAlloc = getInvestmentAllocation(1000);
if (defaultAlloc.stocks !== 100 || defaultAlloc.bonds !== 0 || defaultAlloc.cash !== 0) {
    throw new Error(`Expected default 100/0/0 for number format, got ${defaultAlloc.stocks}/${defaultAlloc.bonds}/${defaultAlloc.cash}`);
}
console.log(`✅ Default allocation for number format: ${defaultAlloc.stocks}% stocks (as expected)`);
console.log('✅ TEST 2 PASSED\n');
console.log('📊 TEST 3: calculatePortfolioAllocation');
console.log('-'.repeat(60));
const portfolioAlloc = calculatePortfolioAllocation(sampleUser.accounts.investments);
console.log(`Portfolio Allocation:`);
console.log(`  Stocks: ${portfolioAlloc.stocks}%`);
console.log(`  Bonds: ${portfolioAlloc.bonds}%`);
console.log(`  Cash: ${portfolioAlloc.cash}%`);
if (Math.abs(portfolioAlloc.stocks - 80) > 1) {
    throw new Error(`Expected ~80% stocks, got ${portfolioAlloc.stocks}%`);
}
if (Math.abs(portfolioAlloc.bonds - 15) > 1) {
    throw new Error(`Expected ~15% bonds, got ${portfolioAlloc.bonds}%`);
}
if (Math.abs(portfolioAlloc.cash - 5) > 1) {
    throw new Error(`Expected ~5% cash, got ${portfolioAlloc.cash}%`);
}
const multiAccountInvestments = {
    taxable: {
        balance: 10000,
        allocation: { stocks: 80, bonds: 15, cash: 5 },
    },
    rothIRA: {
        balance: 10000,
        allocation: { stocks: 90, bonds: 10, cash: 0 },
    },
    traditional401k: {
        balance: 0,
        allocation: { stocks: 70, bonds: 25, cash: 5 },
    },
};
const multiAlloc = calculatePortfolioAllocation(multiAccountInvestments);
console.log(`\nMulti-account portfolio allocation:`);
console.log(`  Stocks: ${multiAlloc.stocks}% (expected ~85%)`);
console.log(`  Bonds: ${multiAlloc.bonds}% (expected ~12.5%)`);
console.log(`  Cash: ${multiAlloc.cash}% (expected ~2.5%)`);
if (Math.abs(multiAlloc.stocks - 85) > 1) {
    throw new Error(`Expected ~85% stocks for multi-account, got ${multiAlloc.stocks}%`);
}
console.log('✅ TEST 3 PASSED\n');
console.log('📊 TEST 4: Sample data verification');
console.log('-'.repeat(60));
const sampleTaxable = sampleUser.accounts.investments.taxable;
if (typeof sampleTaxable === 'number') {
    throw new Error('Sample data taxable should be InvestmentAccount, not number');
}
if (!sampleTaxable.allocation) {
    throw new Error('Sample data taxable should have allocation');
}
console.log(`✅ Sample user has allocation data:`);
console.log(`   Taxable: $${sampleTaxable.balance.toLocaleString()} - ${sampleTaxable.allocation.stocks}% stocks`);
console.log(`   Roth IRA: $${getInvestmentBalance(sampleUser.accounts.investments.rothIRA).toLocaleString()} - ${getInvestmentAllocation(sampleUser.accounts.investments.rothIRA).stocks}% stocks`);
console.log(`   401k: $${getInvestmentBalance(sampleUser.accounts.investments.traditional401k).toLocaleString()} - ${getInvestmentAllocation(sampleUser.accounts.investments.traditional401k).stocks}% stocks`);
console.log('✅ TEST 4 PASSED\n');
console.log('🎉 ALL ASSET ALLOCATION TESTS PASSED!');
console.log('='.repeat(60));
console.log('✅ Helper functions work correctly');
console.log('✅ Backward compatibility maintained');
console.log('✅ Portfolio allocation calculation accurate');
console.log('✅ Sample data includes allocation information');
console.log('\n🚀 Asset allocation features are ready to use!\n');
//# sourceMappingURL=asset-allocation.test.js.map