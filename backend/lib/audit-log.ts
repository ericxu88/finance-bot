/**
 * Audit log of executed financial actions.
 * "History trails to see what the program has done already."
 */

import type { UserProfile, FinancialAction } from '../types/financial.js';

export interface ExecutedActionRecord {
  id: string;
  userId: string;
  action: FinancialAction;
  /** State before the action (used for undo) */
  previousStateSnapshot: UserProfile;
  /** State after the action */
  newStateSnapshot: UserProfile;
  timestamp: Date;
  conversationId?: string;
}

const historyByUser = new Map<string, ExecutedActionRecord[]>();
let idCounter = 0;

function nextId(): string {
  idCounter += 1;
  return `exec_${Date.now()}_${idCounter}`;
}

/**
 * Append a record when an action is executed.
 */
export function appendExecutedAction(
  userId: string,
  record: Omit<ExecutedActionRecord, 'id' | 'userId'>
): ExecutedActionRecord {
  const entry: ExecutedActionRecord = {
    ...record,
    id: nextId(),
    userId,
  };
  const list = historyByUser.get(userId) ?? [];
  list.push(entry);
  historyByUser.set(userId, list);
  return entry;
}

/**
 * Get history of executed actions for a user (newest first).
 * @param limit - Max number of records to return (default 50)
 */
export function getHistory(userId: string, limit = 50): ExecutedActionRecord[] {
  const list = historyByUser.get(userId) ?? [];
  return [...list].reverse().slice(0, limit);
}

/**
 * Get a single record by id (for undo).
 */
export function getRecordById(userId: string, recordId: string): ExecutedActionRecord | undefined {
  const list = historyByUser.get(userId) ?? [];
  return list.find((r) => r.id === recordId);
}

/**
 * Get the most recent executed action for a user (for one-level undo).
 */
export function getLastRecord(userId: string): ExecutedActionRecord | undefined {
  const list = historyByUser.get(userId) ?? [];
  return list[list.length - 1];
}

/**
 * Remove the most recent record for a user (used after undo so the next undo targets the previous action).
 */
export function removeLastRecord(userId: string): boolean {
  const list = historyByUser.get(userId) ?? [];
  if (list.length === 0) return false;
  list.pop();
  if (list.length === 0) historyByUser.delete(userId);
  else historyByUser.set(userId, list);
  return true;
}
