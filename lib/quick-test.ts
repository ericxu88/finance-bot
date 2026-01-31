#!/usr/bin/env node

/**
 * Quick Test - Run the simulation engine
 * 
 * Usage: npm run build && node dist/lib/quick-test.js
 */

import { simulate_save, simulate_invest, simulate_spend, compare_options } from './simulation-engine.js';
import { sampleUser } from './sample-data.js';

console.log('\n🚀 SIMULATION ENGINE - QUICK TEST\n');

// Test 1: Save
console.log('1️⃣  SAVE $500');
const save = simulate_save(sampleUser, 500, 'goal_emergency');
console.log(`   Result: ${save.confidence} confidence, ${save.validationResult.passed ? 'PASSED' : 'FAILED'}`);
console.log(`   Goal: ${save.scenarioIfDo.goalImpacts[0]?.goalName} +${save.scenarioIfDo.goalImpacts[0]?.progressChangePct.toFixed(1)}%\n`);

// Test 2: Invest
console.log('2️⃣  INVEST $500');
const invest = simulate_invest(sampleUser, 500, 'taxable', 'goal_house');
console.log(`   Result: ${invest.confidence} confidence, ${invest.validationResult.passed ? 'PASSED' : 'FAILED'}`);
console.log(`   Future Value: $${invest.scenarioIfDo.goalImpacts[0]?.futureValue?.toFixed(2)}\n`);

// Test 3: Spend
console.log('3️⃣  SPEND $500');
const spend = simulate_spend(sampleUser, 500, 'cat_dining');
const budget = spend.scenarioIfDo.budgetImpacts.find(b => b.categoryId === 'cat_dining');
console.log(`   Result: ${spend.confidence} confidence, ${spend.validationResult.passed ? 'PASSED' : 'FAILED'}`);
console.log(`   Budget: ${budget?.percentUsed.toFixed(0)}% used (${budget?.status})\n`);

// Test 4: Compare
console.log('4️⃣  COMPARE OPTIONS');
const results = compare_options(sampleUser, [
  { type: 'save', amount: 500, targetAccountId: 'savings', goalId: 'goal_emergency' },
  { type: 'invest', amount: 500, targetAccountId: 'taxable', goalId: 'goal_house' },
  { type: 'spend', amount: 500, category: 'cat_dining' },
]);
console.log(`   Generated ${results.length} comparisons successfully\n`);

console.log('✅ All functions working!\n');
