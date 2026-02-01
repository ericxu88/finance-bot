import { getInvestmentBalance, getInvestmentAllocation, calculatePortfolioAllocation, } from '../../types/financial.js';
let testsPassed = 0;
let testsFailed = 0;
function assert(condition, testName, details) {
    if (condition) {
        console.log(`✅ ${testName}`);
        testsPassed++;
    }
    else {
        console.log(`❌ ${testName}`);
        if (details)
            console.log(`   Details: ${details}`);
        testsFailed++;
    }
}
function assertApprox(actual, expected, tolerance, testName) {
    const diff = Math.abs(actual - expected);
    if (diff <= tolerance) {
        console.log(`✅ ${testName}`);
        testsPassed++;
    }
    else {
        console.log(`❌ ${testName}`);
        console.log(`   Expected: ${expected} ± ${tolerance}, Got: ${actual}`);
        testsFailed++;
    }
}
console.log('\n🧪 ASSET ALLOCATION EDGE CASE TESTS');
console.log('='.repeat(70));
console.log('\n📊 getInvestmentBalance Edge Cases');
console.log('-'.repeat(70));
{
    const balance = getInvestmentBalance(0);
    assert(balance === 0, 'Zero balance returns 0');
}
{
    const account = {
        balance: 0,
        allocation: { stocks: 80, bonds: 15, cash: 5 }
    };
    const balance = getInvestmentBalance(account);
    assert(balance === 0, 'Object with zero balance returns 0');
}
{
    const balance = getInvestmentBalance(1000000000000);
    assert(balance === 1000000000000, 'Handles trillion-dollar balance');
}
{
    const balance = getInvestmentBalance(1234.56);
    assert(balance === 1234.56, 'Preserves decimal precision');
}
{
    const account = {
        balance: 9999.99,
        allocation: { stocks: 50, bonds: 50, cash: 0 }
    };
    const balance = getInvestmentBalance(account);
    assert(balance === 9999.99, 'Object preserves decimal balance');
}
console.log('\n📊 getInvestmentAllocation Edge Cases');
console.log('-'.repeat(70));
{
    const allocation = getInvestmentAllocation(5000);
    assert(allocation.stocks === 100, 'Default allocation is 100% stocks');
    assert(allocation.bonds === 0, 'Default has 0% bonds');
    assert(allocation.cash === 0, 'Default has 0% cash');
}
{
    const allocation = getInvestmentAllocation(0);
    assert(allocation.stocks === 100, 'Zero balance still gets default allocation');
}
{
    const account = {
        balance: 10000,
        allocation: { stocks: 100, bonds: 0, cash: 0 }
    };
    const allocation = getInvestmentAllocation(account);
    assert(allocation.stocks === 100 && allocation.bonds === 0, '100% stocks allocation preserved');
}
{
    const account = {
        balance: 10000,
        allocation: { stocks: 33.33, bonds: 33.33, cash: 33.34 }
    };
    const allocation = getInvestmentAllocation(account);
    const total = allocation.stocks + allocation.bonds + allocation.cash;
    assertApprox(total, 100, 0.01, 'Equal allocation totals 100%');
}
{
    const account = {
        balance: 10000,
        allocation: { stocks: 60, bonds: 20, cash: 10, other: 10 }
    };
    const allocation = getInvestmentAllocation(account);
    const total = allocation.stocks + allocation.bonds + allocation.cash + (allocation.other || 0);
    assert(total === 100, 'Allocation with "other" totals 100%', `Total: ${total}`);
}
{
    const account = {
        balance: 10000,
        allocation: { stocks: 99.9, bonds: 0.05, cash: 0.05 }
    };
    const allocation = getInvestmentAllocation(account);
    assert(allocation.bonds === 0.05, 'Preserves small percentages');
}
console.log('\n📊 calculatePortfolioAllocation Edge Cases');
console.log('-'.repeat(70));
{
    const investments = {
        taxable: 0,
        rothIRA: 0,
        traditional401k: 0,
    };
    const portfolio = calculatePortfolioAllocation(investments);
    assert(portfolio.stocks === 0, 'Zero balance portfolio has 0% stocks');
    assert(portfolio.bonds === 0, 'Zero balance portfolio has 0% bonds');
    assert(portfolio.cash === 0, 'Zero balance portfolio has 0% cash');
}
{
    const investments = {
        taxable: { balance: 100000, allocation: { stocks: 80, bonds: 15, cash: 5 } },
        rothIRA: 0,
        traditional401k: 0,
    };
    const portfolio = calculatePortfolioAllocation(investments);
    assert(portfolio.stocks === 80, 'Portfolio matches single account stocks', `Got: ${portfolio.stocks}`);
    assert(portfolio.bonds === 15, 'Portfolio matches single account bonds', `Got: ${portfolio.bonds}`);
    assert(portfolio.cash === 5, 'Portfolio matches single account cash', `Got: ${portfolio.cash}`);
}
{
    const investments = {
        taxable: 5000,
        rothIRA: { balance: 5000, allocation: { stocks: 60, bonds: 30, cash: 10 } },
        traditional401k: { balance: 10000, allocation: { stocks: 70, bonds: 20, cash: 10 } },
    };
    const portfolio = calculatePortfolioAllocation(investments);
    assertApprox(portfolio.stocks, 75, 0.5, 'Mixed format stocks weighted correctly');
    assertApprox(portfolio.bonds, 17.5, 0.5, 'Mixed format bonds weighted correctly');
    assertApprox(portfolio.cash, 7.5, 0.5, 'Mixed format cash weighted correctly');
}
{
    const investments = {
        taxable: { balance: 10000, allocation: { stocks: 90, bonds: 5, cash: 5 } },
        rothIRA: { balance: 10000, allocation: { stocks: 30, bonds: 60, cash: 10 } },
        traditional401k: { balance: 10000, allocation: { stocks: 50, bonds: 40, cash: 10 } },
    };
    const portfolio = calculatePortfolioAllocation(investments);
    const expectedStocks = (90 + 30 + 50) / 3;
    const expectedBonds = (5 + 60 + 40) / 3;
    const expectedCash = (5 + 10 + 10) / 3;
    assertApprox(portfolio.stocks, expectedStocks, 0.5, 'Equal balance stocks averaged correctly');
    assertApprox(portfolio.bonds, expectedBonds, 0.5, 'Equal balance bonds averaged correctly');
    assertApprox(portfolio.cash, expectedCash, 0.5, 'Equal balance cash averaged correctly');
}
{
    const investments = {
        taxable: { balance: 1000, allocation: { stocks: 100, bonds: 0, cash: 0 } },
        rothIRA: { balance: 99000, allocation: { stocks: 0, bonds: 100, cash: 0 } },
        traditional401k: 0,
    };
    const portfolio = calculatePortfolioAllocation(investments);
    assertApprox(portfolio.stocks, 1, 0.5, 'Heavily weighted account dominates stocks');
    assertApprox(portfolio.bonds, 99, 0.5, 'Heavily weighted account dominates bonds');
}
{
    const investments = {
        taxable: { balance: 10000, allocation: { stocks: 100, bonds: 0, cash: 0 } },
        rothIRA: { balance: 5000, allocation: { stocks: 100, bonds: 0, cash: 0 } },
        traditional401k: { balance: 15000, allocation: { stocks: 100, bonds: 0, cash: 0 } },
    };
    const portfolio = calculatePortfolioAllocation(investments);
    assert(portfolio.stocks === 100, 'All 100% stocks = 100% portfolio stocks');
    assert(portfolio.bonds === 0, 'No bonds in any account = 0% portfolio bonds');
    assert(portfolio.cash === 0, 'No cash in any account = 0% portfolio cash');
}
{
    const investments = {
        taxable: { balance: 10000, allocation: { stocks: 50, bonds: 20, cash: 10, other: 20 } },
        rothIRA: { balance: 10000, allocation: { stocks: 60, bonds: 30, cash: 5, other: 5 } },
        traditional401k: 0,
    };
    const portfolio = calculatePortfolioAllocation(investments);
    const other = portfolio.other || 0;
    const total = portfolio.stocks + portfolio.bonds + portfolio.cash + other;
    assertApprox(total, 100, 0.5, 'Portfolio with "other" totals 100%');
    assertApprox(other, 12.5, 0.5, '"Other" allocation weighted correctly');
}
{
    const investments = {
        taxable: { balance: 0.01, allocation: { stocks: 80, bonds: 15, cash: 5 } },
        rothIRA: { balance: 0.01, allocation: { stocks: 60, bonds: 30, cash: 10 } },
        traditional401k: 0,
    };
    const portfolio = calculatePortfolioAllocation(investments);
    assert(isFinite(portfolio.stocks) && portfolio.stocks >= 0, 'Handles very small balances', `Stocks: ${portfolio.stocks}`);
    const total = portfolio.stocks + portfolio.bonds + portfolio.cash + (portfolio.other || 0);
    assertApprox(total, 100, 1, 'Small balances still total ~100%');
}
{
    const investments = {
        taxable: { balance: 3333, allocation: { stocks: 33.33, bonds: 33.33, cash: 33.34 } },
        rothIRA: { balance: 3333, allocation: { stocks: 33.33, bonds: 33.33, cash: 33.34 } },
        traditional401k: { balance: 3334, allocation: { stocks: 33.33, bonds: 33.33, cash: 33.34 } },
    };
    const portfolio = calculatePortfolioAllocation(investments);
    const total = portfolio.stocks + portfolio.bonds + portfolio.cash + (portfolio.other || 0);
    assertApprox(total, 100, 1, 'Complex allocation rounds to ~100%');
}
{
    const investments = {
        taxable: 10000,
        rothIRA: { balance: 10000, allocation: { stocks: 0, bonds: 100, cash: 0 } },
        traditional401k: { balance: 10000, allocation: { stocks: 0, bonds: 0, cash: 100 } },
    };
    const portfolio = calculatePortfolioAllocation(investments);
    assertApprox(portfolio.stocks, 33.33, 1, 'Number format contributes correctly');
    assertApprox(portfolio.bonds, 33.33, 1, 'Object bond allocation contributes');
    assertApprox(portfolio.cash, 33.33, 1, 'Object cash allocation contributes');
}
console.log('\n📊 Integration Scenarios');
console.log('-'.repeat(70));
{
    const investments = {
        taxable: 500,
        rothIRA: 0,
        traditional401k: 0,
    };
    const balance = getInvestmentBalance(investments.taxable);
    const allocation = getInvestmentAllocation(investments.taxable);
    const portfolio = calculatePortfolioAllocation(investments);
    assert(balance === 500, 'New investor balance correct');
    assert(allocation.stocks === 100, 'New investor default allocation');
    assert(portfolio.stocks === 100, 'New investor portfolio all stocks');
}
{
    const investments = {
        taxable: { balance: 50000, allocation: { stocks: 20, bonds: 70, cash: 10 } },
        rothIRA: { balance: 100000, allocation: { stocks: 30, bonds: 60, cash: 10 } },
        traditional401k: { balance: 350000, allocation: { stocks: 25, bonds: 65, cash: 10 } },
    };
    const portfolio = calculatePortfolioAllocation(investments);
    assert(portfolio.bonds > portfolio.stocks, 'Retiree has more bonds than stocks', `Stocks: ${portfolio.stocks}%, Bonds: ${portfolio.bonds}%`);
    assert(portfolio.bonds > 60, 'Retiree portfolio is bond-heavy', `Bonds: ${portfolio.bonds}%`);
}
{
    const investments = {
        taxable: { balance: 25000, allocation: { stocks: 95, bonds: 5, cash: 0 } },
        rothIRA: { balance: 15000, allocation: { stocks: 90, bonds: 10, cash: 0 } },
        traditional401k: { balance: 10000, allocation: { stocks: 85, bonds: 10, cash: 5 } },
    };
    const portfolio = calculatePortfolioAllocation(investments);
    assert(portfolio.stocks > 85, 'Aggressive portfolio is stock-heavy', `Stocks: ${portfolio.stocks}%`);
    assert(portfolio.cash < 5, 'Aggressive portfolio has minimal cash', `Cash: ${portfolio.cash}%`);
}
console.log('\n\n' + '='.repeat(70));
console.log('🧪 ASSET ALLOCATION TEST RESULTS');
console.log('='.repeat(70));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📊 Total: ${testsPassed + testsFailed}`);
if (testsFailed > 0) {
    console.log('\n⚠️  Some tests failed!');
    process.exit(1);
}
else {
    console.log('\n🎉 All asset allocation edge case tests passed!');
    process.exit(0);
}
//# sourceMappingURL=asset-allocation-edge-cases.test.js.map