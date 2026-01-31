/**
 * Unit tests for audit log (executed action history and undo support).
 * Tests appendExecutedAction, getHistory, getRecordById, getLastRecord, removeLastRecord.
 */

import {
  appendExecutedAction,
  getHistory,
  getRecordById,
  getLastRecord,
  removeLastRecord,
} from '../audit-log.js';
import type { UserProfile, FinancialAction } from '../../types/financial.js';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function makeUser(id: string): UserProfile {
  return {
    id,
    name: 'Test',
    monthlyIncome: 5000,
    accounts: { checking: 1000, savings: 2000, investments: { taxable: 0, rothIRA: 0, traditional401k: 0 } },
    fixedExpenses: [],
    spendingCategories: [],
    goals: [],
    preferences: { riskTolerance: 'moderate', liquidityPreference: 'medium', guardrails: [] },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const TEST_USER = 'test_audit_user_1';

console.log('\n🧪 Audit log unit tests');
console.log('='.repeat(60));

// --- getHistory (empty) ---
const emptyHistory = getHistory(TEST_USER, 10);
assert(Array.isArray(emptyHistory), 'getHistory should return array');
assert(emptyHistory.length === 0, 'getHistory for new user should be empty');
console.log('✅ getHistory(unknown user) returns empty array');

// --- appendExecutedAction ---
const prev = makeUser(TEST_USER);
const next = { ...prev, accounts: { ...prev.accounts, checking: 500, savings: 2500 }, updatedAt: new Date() };
const action: FinancialAction = { type: 'save', amount: 500 };
const record = appendExecutedAction(TEST_USER, {
  action,
  previousStateSnapshot: prev,
  newStateSnapshot: next,
  timestamp: new Date(),
});
assert(record.id != null && record.id.length > 0, 'append should return record with id');
assert(record.userId === TEST_USER, 'record userId should match');
assert(record.action.type === 'save' && record.action.amount === 500, 'record action should match');
assert(record.previousStateSnapshot.accounts.checking === 1000, 'previous snapshot preserved');
assert(record.newStateSnapshot.accounts.checking === 500, 'new snapshot preserved');
console.log('✅ appendExecutedAction returns record with id and snapshots');

// --- getHistory (after append) ---
const history1 = getHistory(TEST_USER, 50);
assert(history1.length === 1, 'history should have one record');
assert(history1[0]!.id === record.id, 'history should return newest first (same record)');
console.log('✅ getHistory returns records newest first');

// --- append second, order ---
const prev2 = next;
const next2 = { ...prev2, accounts: { ...prev2.accounts, savings: 3000 }, updatedAt: new Date() };
const record2 = appendExecutedAction(TEST_USER, {
  action: { type: 'save', amount: 500 },
  previousStateSnapshot: prev2,
  newStateSnapshot: next2,
  timestamp: new Date(),
});
const history2 = getHistory(TEST_USER, 50);
assert(history2.length === 2, 'history should have two records');
assert(history2[0]!.id === record2.id, 'first (newest) should be record2');
assert(history2[1]!.id === record.id, 'second should be record');
console.log('✅ getHistory order is newest first');

// --- getRecordById ---
const found = getRecordById(TEST_USER, record.id);
assert(found !== undefined, 'getRecordById should find record');
assert(found!.action.amount === 500, 'getRecordById should return full record');
assert(getRecordById(TEST_USER, 'nonexistent_id') === undefined, 'getRecordById missing returns undefined');
console.log('✅ getRecordById finds by id');

// --- getLastRecord ---
const last = getLastRecord(TEST_USER);
assert(last !== undefined, 'getLastRecord should return record');
assert(last!.id === record2.id, 'getLastRecord should return most recent');
console.log('✅ getLastRecord returns most recent');

// --- removeLastRecord ---
const removed = removeLastRecord(TEST_USER);
assert(removed === true, 'removeLastRecord should return true when record existed');
const historyAfter = getHistory(TEST_USER, 50);
assert(historyAfter.length === 1, 'history should have one record after remove');
assert(historyAfter[0]!.id === record.id, 'remaining should be first record');
const lastAfter = getLastRecord(TEST_USER);
assert(lastAfter!.id === record.id, 'getLastRecord after remove should be previous record');
console.log('✅ removeLastRecord removes most recent');

// --- removeLastRecord again (one more) ---
removeLastRecord(TEST_USER);
assert(getHistory(TEST_USER, 50).length === 0, 'history empty after second remove');
assert(getLastRecord(TEST_USER) === undefined, 'getLastRecord empty returns undefined');
console.log('✅ removeLastRecord to empty');

// --- removeLastRecord (empty) ---
const removedEmpty = removeLastRecord(TEST_USER);
assert(removedEmpty === false, 'removeLastRecord on empty should return false');
console.log('✅ removeLastRecord(empty) returns false');

// --- getHistory limit ---
for (let i = 0; i < 5; i++) {
  appendExecutedAction(TEST_USER, {
    action: { type: 'save', amount: 100 + i },
    previousStateSnapshot: makeUser(TEST_USER),
    newStateSnapshot: makeUser(TEST_USER),
    timestamp: new Date(),
  });
}
const limited = getHistory(TEST_USER, 3);
assert(limited.length === 3, 'getHistory(limit 3) should return 3');
console.log('✅ getHistory(limit) respects limit');

// Clean up: remove all test records so TEST_USER has no history for other test runs
while (removeLastRecord(TEST_USER)) {}
console.log('\n✅ All audit log tests passed.');
