/**
 * Asset Allocation Edge Case Tests
 * 
 * Tests getInvestmentBalance, getInvestmentAllocation, calculatePortfolioAllocation
 * with edge cases and unusual inputs.
 */

import {
  getInvestmentBalance,
  getInvestmentAllocation,
  calculatePortfolioAllocation,
} from '../../types/financial.js';
import type { InvestmentAccounts, InvestmentAccount } from '../../types/financial.js';

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

function assertApprox(actual: number, expected: number, tolerance: number, testName: string): void {
  const diff = Math.abs(actual - expected);
  if (diff <= tolerance) {
    console.log(`✅ ${testName}`);
    testsPassed++;
  } else {
    console.log(`❌ ${testName}`);
    console.log(`   Expected: ${expected} ± ${tolerance}, Got: ${actual}`);
    testsFailed++;
  }
}

console.log('\n🧪 ASSET ALLOCATION EDGE CASE TESTS');
console.log('='.repeat(70));

// ============================================================================
// getInvestmentBalance EDGE CASES
// ============================================================================

console.log('\n📊 getInvestmentBalance Edge Cases');
console.log('-'.repeat(70));

// Edge Case: Zero balance (number format)
{
  const balance = getInvestmentBalance(0);
  assert(balance === 0, 'Zero balance returns 0');
}

// Edge Case: Zero balance (object format)
{
  const account: InvestmentAccount = { 
    balance: 0, 
    allocation: { stocks: 80, bonds: 15, cash: 5 } 
  };
  const balance = getInvestmentBalance(account);
  assert(balance === 0, 'Object with zero balance returns 0');
}

// Edge Case: Very large balance
{
  const balance = getInvestmentBalance(1000000000000);
  assert(balance === 1000000000000, 'Handles trillion-dollar balance');
}

// Edge Case: Decimal balance
{
  const balance = getInvestmentBalance(1234.56);
  assert(balance === 1234.56, 'Preserves decimal precision');
}

// Edge Case: Object with decimal balance
{
  const account: InvestmentAccount = { 
    balance: 9999.99, 
    allocation: { stocks: 50, bonds: 50, cash: 0 } 
  };
  const balance = getInvestmentBalance(account);
  assert(balance === 9999.99, 'Object preserves decimal balance');
}

// ============================================================================
// getInvestmentAllocation EDGE CASES
// ============================================================================

console.log('\n📊 getInvestmentAllocation Edge Cases');
console.log('-'.repeat(70));

// Edge Case: Number format (default allocation)
{
  const allocation = getInvestmentAllocation(5000);
  assert(allocation.stocks === 100, 'Default allocation is 100% stocks');
  assert(allocation.bonds === 0, 'Default has 0% bonds');
  assert(allocation.cash === 0, 'Default has 0% cash');
}

// Edge Case: Zero balance number
{
  const allocation = getInvestmentAllocation(0);
  assert(allocation.stocks === 100, 'Zero balance still gets default allocation');
}

// Edge Case: 100% single asset class
{
  const account: InvestmentAccount = { 
    balance: 10000, 
    allocation: { stocks: 100, bonds: 0, cash: 0 } 
  };
  const allocation = getInvestmentAllocation(account);
  assert(allocation.stocks === 100 && allocation.bonds === 0, '100% stocks allocation preserved');
}

// Edge Case: Equal allocation
{
  const account: InvestmentAccount = { 
    balance: 10000, 
    allocation: { stocks: 33.33, bonds: 33.33, cash: 33.34 } 
  };
  const allocation = getInvestmentAllocation(account);
  const total = allocation.stocks + allocation.bonds + allocation.cash;
  assertApprox(total, 100, 0.01, 'Equal allocation totals 100%');
}

// Edge Case: Allocation with "other" asset class
{
  const account: InvestmentAccount = { 
    balance: 10000, 
    allocation: { stocks: 60, bonds: 20, cash: 10, other: 10 } 
  };
  const allocation = getInvestmentAllocation(account);
  const total = allocation.stocks + allocation.bonds + allocation.cash + (allocation.other || 0);
  assert(total === 100, 'Allocation with "other" totals 100%', `Total: ${total}`);
}

// Edge Case: Very small allocation percentages
{
  const account: InvestmentAccount = { 
    balance: 10000, 
    allocation: { stocks: 99.9, bonds: 0.05, cash: 0.05 } 
  };
  const allocation = getInvestmentAllocation(account);
  assert(allocation.bonds === 0.05, 'Preserves small percentages');
}

// ============================================================================
// calculatePortfolioAllocation EDGE CASES
// ============================================================================

console.log('\n📊 calculatePortfolioAllocation Edge Cases');
console.log('-'.repeat(70));

// Edge Case: All zero balances
{
  const investments: InvestmentAccounts = {
    taxable: 0,
    rothIRA: 0,
    traditional401k: 0,
  };
  const portfolio = calculatePortfolioAllocation(investments);
  assert(portfolio.stocks === 0, 'Zero balance portfolio has 0% stocks');
  assert(portfolio.bonds === 0, 'Zero balance portfolio has 0% bonds');
  assert(portfolio.cash === 0, 'Zero balance portfolio has 0% cash');
}

// Edge Case: Single account has all the money
{
  const investments: InvestmentAccounts = {
    taxable: { balance: 100000, allocation: { stocks: 80, bonds: 15, cash: 5 } },
    rothIRA: 0,
    traditional401k: 0,
  };
  const portfolio = calculatePortfolioAllocation(investments);
  assert(portfolio.stocks === 80, 'Portfolio matches single account stocks', `Got: ${portfolio.stocks}`);
  assert(portfolio.bonds === 15, 'Portfolio matches single account bonds', `Got: ${portfolio.bonds}`);
  assert(portfolio.cash === 5, 'Portfolio matches single account cash', `Got: ${portfolio.cash}`);
}

// Edge Case: Mixed number and object formats
{
  const investments: InvestmentAccounts = {
    taxable: 5000, // Number format (defaults to 100% stocks)
    rothIRA: { balance: 5000, allocation: { stocks: 60, bonds: 30, cash: 10 } },
    traditional401k: { balance: 10000, allocation: { stocks: 70, bonds: 20, cash: 10 } },
  };
  const portfolio = calculatePortfolioAllocation(investments);
  
  // Expected: 
  // taxable: 5k @ 100% stocks = 5k stocks
  // rothIRA: 5k @ 60/30/10 = 3k stocks, 1.5k bonds, 0.5k cash
  // 401k: 10k @ 70/20/10 = 7k stocks, 2k bonds, 1k cash
  // Total: 20k with 15k stocks (75%), 3.5k bonds (17.5%), 1.5k cash (7.5%)
  
  assertApprox(portfolio.stocks, 75, 0.5, 'Mixed format stocks weighted correctly');
  assertApprox(portfolio.bonds, 17.5, 0.5, 'Mixed format bonds weighted correctly');
  assertApprox(portfolio.cash, 7.5, 0.5, 'Mixed format cash weighted correctly');
}

// Edge Case: Equal balances, different allocations
{
  const investments: InvestmentAccounts = {
    taxable: { balance: 10000, allocation: { stocks: 90, bonds: 5, cash: 5 } },
    rothIRA: { balance: 10000, allocation: { stocks: 30, bonds: 60, cash: 10 } },
    traditional401k: { balance: 10000, allocation: { stocks: 50, bonds: 40, cash: 10 } },
  };
  const portfolio = calculatePortfolioAllocation(investments);
  
  // Expected: average of each (90+30+50)/3 = 56.67% stocks, etc.
  const expectedStocks = (90 + 30 + 50) / 3;
  const expectedBonds = (5 + 60 + 40) / 3;
  const expectedCash = (5 + 10 + 10) / 3;
  
  assertApprox(portfolio.stocks, expectedStocks, 0.5, 'Equal balance stocks averaged correctly');
  assertApprox(portfolio.bonds, expectedBonds, 0.5, 'Equal balance bonds averaged correctly');
  assertApprox(portfolio.cash, expectedCash, 0.5, 'Equal balance cash averaged correctly');
}

// Edge Case: Heavily weighted to one account
{
  const investments: InvestmentAccounts = {
    taxable: { balance: 1000, allocation: { stocks: 100, bonds: 0, cash: 0 } }, // 1% weight
    rothIRA: { balance: 99000, allocation: { stocks: 0, bonds: 100, cash: 0 } }, // 99% weight
    traditional401k: 0,
  };
  const portfolio = calculatePortfolioAllocation(investments);
  
  // Should be ~1% stocks, ~99% bonds
  assertApprox(portfolio.stocks, 1, 0.5, 'Heavily weighted account dominates stocks');
  assertApprox(portfolio.bonds, 99, 0.5, 'Heavily weighted account dominates bonds');
}

// Edge Case: All accounts 100% in same asset
{
  const investments: InvestmentAccounts = {
    taxable: { balance: 10000, allocation: { stocks: 100, bonds: 0, cash: 0 } },
    rothIRA: { balance: 5000, allocation: { stocks: 100, bonds: 0, cash: 0 } },
    traditional401k: { balance: 15000, allocation: { stocks: 100, bonds: 0, cash: 0 } },
  };
  const portfolio = calculatePortfolioAllocation(investments);
  
  assert(portfolio.stocks === 100, 'All 100% stocks = 100% portfolio stocks');
  assert(portfolio.bonds === 0, 'No bonds in any account = 0% portfolio bonds');
  assert(portfolio.cash === 0, 'No cash in any account = 0% portfolio cash');
}

// Edge Case: Portfolio with "other" assets
{
  const investments: InvestmentAccounts = {
    taxable: { balance: 10000, allocation: { stocks: 50, bonds: 20, cash: 10, other: 20 } },
    rothIRA: { balance: 10000, allocation: { stocks: 60, bonds: 30, cash: 5, other: 5 } },
    traditional401k: 0,
  };
  const portfolio = calculatePortfolioAllocation(investments);
  
  // Should have "other" property
  const other = portfolio.other || 0;
  const total = portfolio.stocks + portfolio.bonds + portfolio.cash + other;
  assertApprox(total, 100, 0.5, 'Portfolio with "other" totals 100%');
  assertApprox(other, 12.5, 0.5, '"Other" allocation weighted correctly');
}

// Edge Case: Very small total balance
{
  const investments: InvestmentAccounts = {
    taxable: { balance: 0.01, allocation: { stocks: 80, bonds: 15, cash: 5 } },
    rothIRA: { balance: 0.01, allocation: { stocks: 60, bonds: 30, cash: 10 } },
    traditional401k: 0,
  };
  const portfolio = calculatePortfolioAllocation(investments);
  
  assert(isFinite(portfolio.stocks) && portfolio.stocks >= 0, 
    'Handles very small balances', `Stocks: ${portfolio.stocks}`);
  const total = portfolio.stocks + portfolio.bonds + portfolio.cash + (portfolio.other || 0);
  assertApprox(total, 100, 1, 'Small balances still total ~100%');
}

// Edge Case: Rounding verification
{
  const investments: InvestmentAccounts = {
    taxable: { balance: 3333, allocation: { stocks: 33.33, bonds: 33.33, cash: 33.34 } },
    rothIRA: { balance: 3333, allocation: { stocks: 33.33, bonds: 33.33, cash: 33.34 } },
    traditional401k: { balance: 3334, allocation: { stocks: 33.33, bonds: 33.33, cash: 33.34 } },
  };
  const portfolio = calculatePortfolioAllocation(investments);
  
  const total = portfolio.stocks + portfolio.bonds + portfolio.cash + (portfolio.other || 0);
  assertApprox(total, 100, 1, 'Complex allocation rounds to ~100%');
}

// Edge Case: One number, two objects
{
  const investments: InvestmentAccounts = {
    taxable: 10000, // 100% stocks default
    rothIRA: { balance: 10000, allocation: { stocks: 0, bonds: 100, cash: 0 } },
    traditional401k: { balance: 10000, allocation: { stocks: 0, bonds: 0, cash: 100 } },
  };
  const portfolio = calculatePortfolioAllocation(investments);
  
  // Should be 33.33% each
  assertApprox(portfolio.stocks, 33.33, 1, 'Number format contributes correctly');
  assertApprox(portfolio.bonds, 33.33, 1, 'Object bond allocation contributes');
  assertApprox(portfolio.cash, 33.33, 1, 'Object cash allocation contributes');
}

// ============================================================================
// INTEGRATION: Full scenario tests
// ============================================================================

console.log('\n📊 Integration Scenarios');
console.log('-'.repeat(70));

// Scenario: New investor (only one account, small balance)
{
  const investments: InvestmentAccounts = {
    taxable: 500, // Just started
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

// Scenario: Conservative retiree (bonds heavy)
{
  const investments: InvestmentAccounts = {
    taxable: { balance: 50000, allocation: { stocks: 20, bonds: 70, cash: 10 } },
    rothIRA: { balance: 100000, allocation: { stocks: 30, bonds: 60, cash: 10 } },
    traditional401k: { balance: 350000, allocation: { stocks: 25, bonds: 65, cash: 10 } },
  };
  
  const portfolio = calculatePortfolioAllocation(investments);
  
  assert(portfolio.bonds > portfolio.stocks, 'Retiree has more bonds than stocks',
    `Stocks: ${portfolio.stocks}%, Bonds: ${portfolio.bonds}%`);
  assert(portfolio.bonds > 60, 'Retiree portfolio is bond-heavy',
    `Bonds: ${portfolio.bonds}%`);
}

// Scenario: Aggressive growth (stocks heavy, across accounts)
{
  const investments: InvestmentAccounts = {
    taxable: { balance: 25000, allocation: { stocks: 95, bonds: 5, cash: 0 } },
    rothIRA: { balance: 15000, allocation: { stocks: 90, bonds: 10, cash: 0 } },
    traditional401k: { balance: 10000, allocation: { stocks: 85, bonds: 10, cash: 5 } },
  };
  
  const portfolio = calculatePortfolioAllocation(investments);
  
  assert(portfolio.stocks > 85, 'Aggressive portfolio is stock-heavy',
    `Stocks: ${portfolio.stocks}%`);
  assert(portfolio.cash < 5, 'Aggressive portfolio has minimal cash',
    `Cash: ${portfolio.cash}%`);
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n\n' + '='.repeat(70));
console.log('🧪 ASSET ALLOCATION TEST RESULTS');
console.log('='.repeat(70));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📊 Total: ${testsPassed + testsFailed}`);

if (testsFailed > 0) {
  console.log('\n⚠️  Some tests failed!');
  process.exit(1);
} else {
  console.log('\n🎉 All asset allocation edge case tests passed!');
  process.exit(0);
}
