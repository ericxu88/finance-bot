import { userStateStore } from '../user-state-store.js';
function assert(condition, message) {
    if (!condition)
        throw new Error(`Assertion failed: ${message}`);
}
function makeMinimalUser(id, checking = 1000) {
    return {
        id,
        name: 'Test',
        monthlyIncome: 5000,
        accounts: { checking, savings: 2000, investments: { taxable: 0, rothIRA: 0, traditional401k: 0 } },
        fixedExpenses: [],
        spendingCategories: [],
        goals: [],
        preferences: { riskTolerance: 'moderate', liquidityPreference: 'medium', guardrails: [] },
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}
const TEST_PREFIX = 'test_store_';
console.log('\n🧪 UserStateStore unit tests');
console.log('='.repeat(60));
const getMissing = userStateStore.get(TEST_PREFIX + 'nonexistent');
assert(getMissing === undefined, 'get for missing userId should return undefined');
console.log('✅ get(missing) returns undefined');
const user1 = makeMinimalUser(TEST_PREFIX + 'u1', 3000);
userStateStore.set(TEST_PREFIX + 'u1', user1);
const got1 = userStateStore.get(TEST_PREFIX + 'u1');
assert(got1 !== undefined, 'get after set should return user');
assert(got1.id === TEST_PREFIX + 'u1', 'returned user id should match');
assert(got1.accounts.checking === 3000, 'returned user accounts should match');
console.log('✅ set then get returns same user');
assert(userStateStore.has(TEST_PREFIX + 'u1') === true, 'has should be true after set');
assert(userStateStore.has(TEST_PREFIX + 'nonexistent') === false, 'has should be false for missing');
console.log('✅ has() correct for present and missing');
const defaultUser = makeMinimalUser('default_id', 5000);
const created = userStateStore.getOrCreate(TEST_PREFIX + 'create_me', defaultUser);
assert(created.id === TEST_PREFIX + 'create_me', 'getOrCreate should set id to userId');
assert(created.accounts.checking === 5000, 'getOrCreate should use default user data');
assert(userStateStore.has(TEST_PREFIX + 'create_me') === true, 'getOrCreate should persist');
console.log('✅ getOrCreate creates and persists with default data');
const existing = userStateStore.getOrCreate(TEST_PREFIX + 'create_me', makeMinimalUser('other', 999));
assert(existing.id === TEST_PREFIX + 'create_me', 'getOrCreate should return existing, not replace id');
assert(existing.accounts.checking === 5000, 'getOrCreate should return existing data, not default');
console.log('✅ getOrCreate returns existing user when present');
userStateStore.set(TEST_PREFIX + 'to_delete', makeMinimalUser(TEST_PREFIX + 'to_delete'));
assert(userStateStore.has(TEST_PREFIX + 'to_delete') === true, 'should exist before delete');
const deleted = userStateStore.delete(TEST_PREFIX + 'to_delete');
assert(deleted === true, 'delete should return true when key existed');
assert(userStateStore.has(TEST_PREFIX + 'to_delete') === false, 'should not exist after delete');
assert(userStateStore.delete(TEST_PREFIX + 'nonexistent') === false, 'delete missing should return false');
console.log('✅ delete removes user and returns boolean');
userStateStore.set(TEST_PREFIX + 'a', makeMinimalUser(TEST_PREFIX + 'a', 1));
userStateStore.set(TEST_PREFIX + 'b', makeMinimalUser(TEST_PREFIX + 'b', 2));
assert(userStateStore.get(TEST_PREFIX + 'a').accounts.checking === 1, 'user a unchanged');
assert(userStateStore.get(TEST_PREFIX + 'b').accounts.checking === 2, 'user b unchanged');
console.log('✅ different userIds store independently');
[TEST_PREFIX + 'u1', TEST_PREFIX + 'create_me', TEST_PREFIX + 'a', TEST_PREFIX + 'b'].forEach((id) => userStateStore.delete(id));
console.log('\n✅ All UserStateStore tests passed.');
//# sourceMappingURL=user-state-store.test.js.map