/**
 * In-memory user state store.
 * Holds current UserProfile per userId. Updated when user executes an action.
 * For demo, can be seeded with sample user; for production would use SQLite or DB.
 */

import type { UserProfile } from '../types/financial.js';

class UserStateStore {
  private store = new Map<string, UserProfile>();

  get(userId: string): UserProfile | undefined {
    return this.store.get(userId);
  }

  set(userId: string, user: UserProfile): void {
    this.store.set(userId, user);
  }

  getOrCreate(userId: string, defaultUser: UserProfile): UserProfile {
    const existing = this.store.get(userId);
    if (existing) return existing;
    const clone = { ...defaultUser, id: userId, updatedAt: new Date() };
    this.store.set(userId, clone);
    return clone;
  }

  has(userId: string): boolean {
    return this.store.has(userId);
  }

  delete(userId: string): boolean {
    return this.store.delete(userId);
  }
}

export const userStateStore = new UserStateStore();
