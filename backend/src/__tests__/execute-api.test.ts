/**
 * Unit tests for execute, user, history, undo, and freeze API endpoints.
 * Run with: TEST=1 node dist/src/__tests__/execute-api.test.js
 * so the server does not call listen() on load; we start it on a random port for tests.
 */

import http from 'http';
import { sampleUser } from '../../lib/sample-data.js';
import { userStateStore } from '../../lib/user-state-store.js';
import { getHistory, removeLastRecord } from '../../lib/audit-log.js';

process.env.TEST = '1';
const { app } = await import('../server.js');

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

const API_TEST_USER = 'test_execute_api_user_1';

function userToJson(u: typeof sampleUser): Record<string, unknown> {
  return {
    ...u,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    goals: u.goals.map((g) => ({ ...g, deadline: (g.deadline as Date).toISOString() })),
  };
}

async function request(
  method: string,
  path: string,
  body?: unknown
): Promise<{ status: number; body: unknown }> {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const addr = server.address();
  assert(addr != null && typeof addr === 'object' && 'port' in addr, 'server should have port');
  const port = (addr as { port: number }).port;
  const url = `http://127.0.0.1:${port}${path}`;
  const opts: RequestInit = {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  };
  const res = await fetch(url, opts);
  const text = await res.text();
  let out: unknown;
  try {
    out = text ? JSON.parse(text) : {};
  } catch {
    out = text;
  }
  server.close();
  return { status: res.status, body: out };
}

console.log('\n🧪 Execute / User / History / Undo / Freeze API tests');
console.log('='.repeat(60));

async function run(): Promise<void> {
  userStateStore.delete(API_TEST_USER);
  while (removeLastRecord(API_TEST_USER)) {}

  let r = await request('POST', '/execute', {
    user: userToJson(sampleUser),
    action: { type: 'save', amount: 500, goalId: 'goal_emergency' },
  });
  assert(r.status === 200, 'POST /execute with user should 200');
  const bodyWithUser = r.body as { updatedUser: { accounts: { checking: number; savings: number } }; message: string };
  assert(bodyWithUser.updatedUser.accounts.checking === 2500, 'execute should return updated checking');
  assert(bodyWithUser.updatedUser.accounts.savings === 8500, 'execute should return updated savings');
  assert(bodyWithUser.message?.includes('Action applied'), 'response should have message');
  console.log('✅ POST /execute with user body: returns updatedUser, no persistence');

  r = await request('POST', '/execute', {
    userId: API_TEST_USER,
    action: { type: 'save', amount: 300, goalId: 'goal_emergency' },
  });
  assert(r.status === 200, 'POST /execute with userId should 200');
  const updated = (r.body as { updatedUser: typeof sampleUser }).updatedUser;
  assert(updated.accounts.savings === 8000 + 300, 'savings should be 8300');
  const stored = userStateStore.get(API_TEST_USER);
  assert(stored != null && stored.accounts.savings === 8300, 'store should have updated user');
  const historyAfterExecute = getHistory(API_TEST_USER, 10);
  assert(historyAfterExecute.length === 1, 'history should have one record');
  assert(historyAfterExecute[0]!.action.type === 'save' && historyAfterExecute[0]!.action.amount === 300, 'history record action');
  console.log('✅ POST /execute with userId: persists and appends to history');

  r = await request('GET', `/user/${API_TEST_USER}`);
  assert(r.status === 200, 'GET /user/:id should 200');
  const gotUser = r.body as { id: string; accounts: { savings: number } };
  assert(gotUser.id === API_TEST_USER, 'GET /user should return same id');
  assert(gotUser.accounts.savings === 8300, 'GET /user should return persisted state');
  r = await request('GET', '/user/new_user_never_seen');
  assert(r.status === 200, 'GET /user for new id should 200');
  assert((r.body as { id: string }).id === 'new_user_never_seen', 'new user should be seeded with id');
  console.log('✅ GET /user/:id returns stored or sample-seeded user');

  r = await request('GET', `/user/${API_TEST_USER}/history`);
  assert(r.status === 200, 'GET /user/:id/history should 200');
  const historyBody = r.body as { userId: string; history: unknown[]; metadata: { count: number } };
  assert(historyBody.userId === API_TEST_USER, 'history userId matches');
  assert(historyBody.history.length === 1, 'history array has one record');
  assert(historyBody.metadata.count === 1, 'metadata count');
  r = await request('GET', `/user/${API_TEST_USER}/history?limit=5`);
  assert(r.status === 200, 'GET /user/:id/history?limit=5 should 200');
  console.log('✅ GET /user/:id/history returns audit records');

  r = await request('POST', '/undo', { userId: API_TEST_USER });
  assert(r.status === 200, 'POST /undo should 200');
  const undoBody = r.body as { restoredUser: { accounts: { savings: number } }; undoneAction: { type: string; amount: number } };
  assert(undoBody.restoredUser.accounts.savings === 8000, 'undo should restore savings to 8000');
  assert(undoBody.undoneAction.type === 'save' && undoBody.undoneAction.amount === 300, 'undoneAction matches');
  const afterUndo = userStateStore.get(API_TEST_USER);
  assert(afterUndo != null && afterUndo.accounts.savings === 8000, 'store should be restored after undo');
  assert(getHistory(API_TEST_USER, 10).length === 0, 'history should be empty after undo');
  console.log('✅ POST /undo restores state and removes last record');

  r = await request('POST', '/undo', { userId: API_TEST_USER });
  assert(r.status === 404, 'POST /undo with no history should 404');
  assert((r.body as { error: string }).error?.includes('Nothing to undo'), 'error message');
  console.log('✅ POST /undo (empty) returns 404');

  r = await request('POST', '/execute', { action: { type: 'save', amount: 100 } });
  assert(r.status === 400, 'POST /execute without user/userId should 400');
  r = await request('POST', '/execute', { userId: API_TEST_USER, action: { type: 'save' } });
  assert(r.status === 400, 'POST /execute with invalid action should 400');
  console.log('✅ POST /execute invalid payload returns 400');

  r = await request('GET', '/freeze');
  assert(r.status === 200, 'GET /freeze should 200');
  assert(typeof (r.body as { frozen: boolean }).frozen === 'boolean', 'GET /freeze returns frozen boolean');
  r = await request('POST', '/freeze', { frozen: true });
  assert(r.status === 200, 'POST /freeze should 200');
  assert((r.body as { frozen: boolean }).frozen === true, 'POST /freeze sets frozen');
  r = await request('GET', '/freeze');
  assert((r.body as { frozen: boolean }).frozen === true, 'GET /freeze after POST returns true');
  await request('POST', '/freeze', { frozen: false });
  console.log('✅ GET /freeze and POST /freeze work');

  await request('POST', '/execute', {
    userId: API_TEST_USER,
    action: { type: 'invest', amount: 200, targetAccountId: 'taxable', goalId: 'goal_house' },
  });
  const afterInvest = userStateStore.get(API_TEST_USER)!;
  assert(afterInvest.accounts.investments.taxable === 5000 + 200, 'invest updates taxable');
  assert(getHistory(API_TEST_USER, 10).length === 1, 'history has one after invest');
  console.log('✅ POST /execute invest with userId persists');

  r = await request('GET', '/user/%20');
  assert(r.status === 200 || r.status === 400, 'GET /user/:id with space handled');
  console.log('✅ GET /user/:id edge case handled');

  userStateStore.delete(API_TEST_USER);
  while (removeLastRecord(API_TEST_USER)) {}

  console.log('\n✅ All execute/user/history/undo/freeze API tests passed.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
