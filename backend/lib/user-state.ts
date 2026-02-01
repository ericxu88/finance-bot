/**
 * User State Manager
 * 
 * Provides mutable in-memory state for user profiles.
 * Changes persist across requests while the server is running.
 * Resets to sample data on server restart.
 */

import type { UserProfile, FinancialGoal, SpendingCategory, Accounts } from '../types/financial.js';
import { getInvestmentBalance } from '../types/financial.js';
import { sampleUser } from './sample-data.js';

// ============================================================================
// USER STATE MANAGER
// ============================================================================

class UserStateManager {
  private state: UserProfile;

  constructor(initialUser: UserProfile) {
    // Deep clone to avoid mutating the original sample data
    this.state = this.deepClone(initialUser);
  }

  /**
   * Get the current user profile state
   */
  getUserState(): UserProfile {
    return this.state;
  }

  /**
   * Get a deep clone of the current state (for safe external use)
   */
  getUserStateCopy(): UserProfile {
    return this.deepClone(this.state);
  }

  /**
   * Replace the entire user profile
   */
  setUserState(newState: UserProfile): void {
    this.state = this.deepClone(newState);
    this.state.updatedAt = new Date();
  }

  /**
   * Update specific fields of the user profile
   */
  updateUserState(changes: Partial<UserProfile>): UserProfile {
    this.state = {
      ...this.state,
      ...changes,
      updatedAt: new Date(),
    };
    return this.state;
  }

  /**
   * Update account balances
   */
  updateAccounts(accounts: Partial<Accounts>): UserProfile {
    this.state = {
      ...this.state,
      accounts: {
        ...this.state.accounts,
        ...accounts,
        investments: {
          ...this.state.accounts.investments,
          ...(accounts.investments || {}),
        },
      },
      updatedAt: new Date(),
    };
    return this.state;
  }

  /**
   * Add a new goal
   */
  addGoal(goal: FinancialGoal): UserProfile {
    this.state = {
      ...this.state,
      goals: [...this.state.goals, goal],
      updatedAt: new Date(),
    };
    return this.state;
  }

  /**
   * Update an existing goal
   */
  updateGoal(goalId: string, changes: Partial<FinancialGoal>): UserProfile {
    this.state = {
      ...this.state,
      goals: this.state.goals.map(g => 
        g.id === goalId ? { ...g, ...changes } : g
      ),
      updatedAt: new Date(),
    };
    return this.state;
  }

  /**
   * Remove a goal
   */
  removeGoal(goalId: string): UserProfile {
    this.state = {
      ...this.state,
      goals: this.state.goals.filter(g => g.id !== goalId),
      updatedAt: new Date(),
    };
    return this.state;
  }

  /**
   * Update a spending category
   */
  updateSpendingCategory(categoryId: string, changes: Partial<SpendingCategory>): UserProfile {
    this.state = {
      ...this.state,
      spendingCategories: this.state.spendingCategories.map(c =>
        c.id === categoryId ? { ...c, ...changes } : c
      ),
      updatedAt: new Date(),
    };
    return this.state;
  }

  /**
   * Update spending category by name (case-insensitive)
   */
  updateSpendingCategoryByName(categoryName: string, changes: Partial<SpendingCategory>): UserProfile {
    this.state = {
      ...this.state,
      spendingCategories: this.state.spendingCategories.map(c =>
        c.name.toLowerCase() === categoryName.toLowerCase() ? { ...c, ...changes } : c
      ),
      updatedAt: new Date(),
    };
    return this.state;
  }

  /**
   * Transfer money between accounts
   */
  transferMoney(fromAccount: string, toAccount: string, amount: number): { success: boolean; message: string } {
    const fromBalance = this.getAccountBalance(fromAccount);
    const toBalance = this.getAccountBalance(toAccount);

    if (fromBalance === undefined) {
      return { success: false, message: `Source account "${fromAccount}" not found.` };
    }
    if (toBalance === undefined) {
      return { success: false, message: `Destination account "${toAccount}" not found.` };
    }
    if (fromBalance < amount) {
      return { success: false, message: `Insufficient funds in ${fromAccount}. Available: $${fromBalance.toLocaleString()}` };
    }

    this.setAccountBalance(fromAccount, fromBalance - amount);
    this.setAccountBalance(toAccount, toBalance + amount);
    this.state.updatedAt = new Date();

    return { 
      success: true, 
      message: `Transferred $${amount.toLocaleString()} from ${fromAccount} to ${toAccount}.`
    };
  }

  /**
   * Reset state to original sample data
   */
  reset(): void {
    this.state = this.deepClone(sampleUser);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private getAccountBalance(accountName: string): number | undefined {
    const normalized = accountName.toLowerCase().replace(/\s+/g, '');
    switch (normalized) {
      case 'checking': return this.state.accounts.checking;
      case 'savings': return this.state.accounts.savings;
      case 'taxable': return getInvestmentBalance(this.state.accounts.investments.taxable);
      case 'rothira': return getInvestmentBalance(this.state.accounts.investments.rothIRA);
      case 'traditional401k': 
      case '401k': 
        return getInvestmentBalance(this.state.accounts.investments.traditional401k);
      default: return undefined;
    }
  }

  private setAccountBalance(accountName: string, newBalance: number): void {
    const normalized = accountName.toLowerCase().replace(/\s+/g, '');
    switch (normalized) {
      case 'checking': 
        this.state.accounts.checking = newBalance; 
        break;
      case 'savings': 
        this.state.accounts.savings = newBalance; 
        break;
      case 'taxable': 
        this.setInvestmentBalance('taxable', newBalance);
        break;
      case 'rothira': 
        this.setInvestmentBalance('rothIRA', newBalance);
        break;
      case 'traditional401k':
      case '401k':
        this.setInvestmentBalance('traditional401k', newBalance);
        break;
    }
  }

  private setInvestmentBalance(accountKey: 'taxable' | 'rothIRA' | 'traditional401k', newBalance: number): void {
    const account = this.state.accounts.investments[accountKey];
    if (typeof account === 'number') {
      // If it's a number, convert to InvestmentAccount
      this.state.accounts.investments[accountKey] = {
        balance: newBalance,
        allocation: { stocks: 70, bonds: 20, cash: 10 }, // Default allocation
      };
    } else if (account) {
      // If it's an InvestmentAccount, update the balance
      this.state.accounts.investments[accountKey] = {
        ...account,
        balance: newBalance,
      };
    }
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj, (_key, value) => {
      // Handle Date objects
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }), (key, value) => {
      // Restore Date objects from ISO strings for known date fields
      if (typeof value === 'string' && 
          (key === 'deadline' || key === 'createdAt' || key === 'updatedAt' || key === 'dueDate' || key === 'lastInvestmentDate')) {
        return new Date(value);
      }
      return value;
    });
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

// Create a singleton instance initialized with sample data
export const userStateManager = new UserStateManager(sampleUser);

// Export the class for testing purposes
export { UserStateManager };

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Get the current user state
 */
export function getUserState(): UserProfile {
  return userStateManager.getUserState();
}

/**
 * Get a safe copy of the user state
 */
export function getUserStateCopy(): UserProfile {
  return userStateManager.getUserStateCopy();
}

/**
 * Update the user state with changes
 */
export function updateUserState(changes: Partial<UserProfile>): UserProfile {
  return userStateManager.updateUserState(changes);
}

/**
 * Reset state to original sample data
 */
export function resetUserState(): void {
  userStateManager.reset();
}
