/**
 * Action Executor
 * 
 * Handles executing financial actions that modify user state.
 * This includes transfers, goal creation, budget updates, etc.
 * 
 * IMPORTANT: All successful actions persist changes to the user state manager,
 * making them visible across the entire application.
 */

import type { UserProfile, FinancialGoal } from '../../types/financial.js';
import { getInvestmentBalance } from '../../types/financial.js';
import { userStateManager } from '../user-state.js';

// ============================================================================
// TYPES
// ============================================================================

export interface ActionResult {
  success: boolean;
  message: string;
  details?: string;
  updatedUser?: UserProfile;
  changes?: ActionChange[];
}

export interface ActionChange {
  field: string;
  oldValue: string | number;
  newValue: string | number;
}

export interface TransferRequest {
  fromAccount: string;
  toAccount: string;
  amount: number;
}

export interface CreateGoalRequest {
  name: string;
  targetAmount: number;
  deadlineMonths?: number;
  priority?: number;
}

export interface UpdateBudgetRequest {
  categoryName: string;
  newAmount?: number;
  action: 'increase' | 'decrease' | 'set';
  changeAmount?: number;
}

// ============================================================================
// ACTION EXECUTOR CLASS
// ============================================================================

export class ActionExecutor {
  /**
   * Execute a money transfer between accounts
   */
  executeTransfer(user: UserProfile, request: TransferRequest): ActionResult {
    const { fromAccount, toAccount, amount } = request;
    
    // Validate amount
    if (amount <= 0) {
      return {
        success: false,
        message: 'Transfer amount must be positive.',
      };
    }
    
    // Get source balance
    const sourceBalance = this.getAccountBalance(user, fromAccount);
    if (sourceBalance === null) {
      return {
        success: false,
        message: `Unknown source account: ${fromAccount}`,
      };
    }
    
    // Check sufficient funds
    if (sourceBalance < amount) {
      return {
        success: false,
        message: `Insufficient funds in ${fromAccount}. Available: $${sourceBalance.toLocaleString()}, Requested: $${amount.toLocaleString()}`,
      };
    }
    
    // Check guardrails
    const guardrailViolation = this.checkGuardrails(user, fromAccount, sourceBalance - amount);
    if (guardrailViolation) {
      return {
        success: false,
        message: guardrailViolation,
      };
    }
    
    // Execute the transfer
    const updatedUser = this.applyTransfer(user, fromAccount, toAccount, amount);
    
    // PERSIST: Update the global user state
    userStateManager.setUserState(updatedUser);
    
    const newSourceBalance = this.getAccountBalance(updatedUser, fromAccount);
    const newDestBalance = this.getAccountBalance(updatedUser, toAccount);
    
    return {
      success: true,
      message: `Successfully transferred $${amount.toLocaleString()} from ${fromAccount} to ${toAccount}.`,
      details: `New ${fromAccount} balance: $${newSourceBalance?.toLocaleString()}. New ${toAccount} balance: $${newDestBalance?.toLocaleString()}.`,
      updatedUser,
      changes: [
        { field: `${fromAccount} balance`, oldValue: sourceBalance, newValue: newSourceBalance ?? 0 },
        { field: `${toAccount} balance`, oldValue: this.getAccountBalance(user, toAccount) ?? 0, newValue: newDestBalance ?? 0 },
      ],
    };
  }
  
  /**
   * Create a new financial goal
   */
  createGoal(user: UserProfile, request: CreateGoalRequest): ActionResult {
    const { name, targetAmount, deadlineMonths, priority } = request;
    
    // Validate
    if (!name || name.trim().length === 0) {
      return {
        success: false,
        message: 'Goal name is required.',
      };
    }
    
    if (targetAmount <= 0) {
      return {
        success: false,
        message: 'Target amount must be positive.',
      };
    }
    
    // Check if goal with same name exists
    const existingGoal = user.goals.find(g => 
      g.name.toLowerCase() === name.toLowerCase()
    );
    if (existingGoal) {
      return {
        success: false,
        message: `A goal named "${name}" already exists. Did you want to update it instead?`,
      };
    }
    
    // Create the new goal
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + (deadlineMonths || 12));
    
    const newGoal: FinancialGoal = {
      id: `goal_${Date.now()}`,
      name: name.trim(),
      targetAmount,
      currentAmount: 0,
      deadline,
      priority: priority || user.goals.length + 1,
      timeHorizon: deadlineMonths && deadlineMonths <= 12 ? 'short' : deadlineMonths && deadlineMonths <= 36 ? 'medium' : 'long',
      linkedAccountIds: ['savings'],
    };
    
    const updatedUser: UserProfile = {
      ...user,
      goals: [...user.goals, newGoal],
      updatedAt: new Date(),
    };
    
    // PERSIST: Update the global user state
    userStateManager.setUserState(updatedUser);
    
    return {
      success: true,
      message: `Created new goal: "${name}" with target of $${targetAmount.toLocaleString()}.`,
      details: `Deadline: ${deadline.toLocaleDateString()}. Priority: ${newGoal.priority}. Time horizon: ${newGoal.timeHorizon}.`,
      updatedUser,
      changes: [
        { field: 'goals', oldValue: user.goals.length, newValue: updatedUser.goals.length },
      ],
    };
  }
  
  /**
   * Update a budget category
   */
  updateBudget(user: UserProfile, request: UpdateBudgetRequest): ActionResult {
    const { categoryName, newAmount, action, changeAmount } = request;
    
    // Find the category
    const categoryIndex = user.spendingCategories.findIndex(c => 
      c.name.toLowerCase() === categoryName.toLowerCase() ||
      c.id.toLowerCase() === categoryName.toLowerCase()
    );
    
    if (categoryIndex === -1) {
      // List available categories in error message
      const available = user.spendingCategories.map(c => c.name).join(', ');
      return {
        success: false,
        message: `Budget category "${categoryName}" not found. Available categories: ${available}`,
      };
    }
    
    const category = user.spendingCategories[categoryIndex];
    if (!category) {
      return { success: false, message: 'Category not found at index.' };
    }
    
    const oldBudget = category.monthlyBudget;
    let calculatedNewAmount: number;
    
    switch (action) {
      case 'set':
        if (newAmount === undefined || newAmount === null) {
          return { success: false, message: 'New budget amount is required for set action.' };
        }
        calculatedNewAmount = newAmount;
        break;
      case 'increase':
        calculatedNewAmount = oldBudget + (changeAmount || newAmount || 0);
        break;
      case 'decrease':
        calculatedNewAmount = Math.max(0, oldBudget - (changeAmount || newAmount || 0));
        break;
      default:
        return { success: false, message: 'Invalid budget action.' };
    }
    
    if (calculatedNewAmount < 0) {
      return {
        success: false,
        message: 'Budget amount cannot be negative.',
      };
    }
    
    // Create updated categories with proper typing
    const updatedCategories = user.spendingCategories.map((cat, idx) => 
      idx === categoryIndex 
        ? { ...cat, monthlyBudget: calculatedNewAmount }
        : cat
    );
    
    const updatedUser: UserProfile = {
      ...user,
      spendingCategories: updatedCategories,
      updatedAt: new Date(),
    };
    
    // PERSIST: Update the global user state
    userStateManager.setUserState(updatedUser);
    
    return {
      success: true,
      message: `Updated "${category.name}" budget from $${oldBudget.toLocaleString()} to $${calculatedNewAmount.toLocaleString()}.`,
      details: action === 'increase' 
        ? `Increased by $${(calculatedNewAmount - oldBudget).toLocaleString()}`
        : action === 'decrease'
          ? `Decreased by $${(oldBudget - calculatedNewAmount).toLocaleString()}`
          : `Set to new amount`,
      updatedUser,
      changes: [
        { field: `${category.name} budget`, oldValue: oldBudget, newValue: calculatedNewAmount },
      ],
    };
  }
  
  /**
   * Execute a financial action (save/invest) that was previously simulated
   */
  executeSimulatedAction(
    user: UserProfile, 
    actionType: 'save' | 'invest' | 'spend',
    amount: number,
    goalId?: string,
    targetAccount?: string
  ): ActionResult {
    if (amount <= 0) {
      return {
        success: false,
        message: 'Amount must be positive.',
      };
    }
    
    // Check sufficient funds in checking
    if (user.accounts.checking < amount) {
      return {
        success: false,
        message: `Insufficient funds in checking. Available: $${user.accounts.checking.toLocaleString()}`,
      };
    }
    
    // Check guardrails
    const guardrailViolation = this.checkGuardrails(user, 'checking', user.accounts.checking - amount);
    if (guardrailViolation) {
      return {
        success: false,
        message: guardrailViolation,
      };
    }
    
    let updatedUser: UserProfile;
    let message: string;
    let details: string;
    const changes: ActionChange[] = [];
    
    switch (actionType) {
      case 'save':
        updatedUser = {
          ...user,
          accounts: {
            ...user.accounts,
            checking: user.accounts.checking - amount,
            savings: user.accounts.savings + amount,
          },
          updatedAt: new Date(),
        };
        message = `Saved $${amount.toLocaleString()} to your savings account.`;
        details = `New checking: $${updatedUser.accounts.checking.toLocaleString()}. New savings: $${updatedUser.accounts.savings.toLocaleString()}.`;
        changes.push(
          { field: 'checking', oldValue: user.accounts.checking, newValue: updatedUser.accounts.checking },
          { field: 'savings', oldValue: user.accounts.savings, newValue: updatedUser.accounts.savings }
        );
        break;
        
      case 'invest':
        const account = targetAccount || 'taxable';
        updatedUser = this.applyInvestment(user, amount, account as 'taxable' | 'rothIRA' | 'traditional401k');
        message = `Invested $${amount.toLocaleString()} into your ${account} account.`;
        const newInvestBalance = getInvestmentBalance(updatedUser.accounts.investments[account as keyof typeof updatedUser.accounts.investments]);
        details = `New checking: $${updatedUser.accounts.checking.toLocaleString()}. New ${account}: $${newInvestBalance.toLocaleString()}.`;
        changes.push(
          { field: 'checking', oldValue: user.accounts.checking, newValue: updatedUser.accounts.checking },
          { field: `${account} investments`, oldValue: getInvestmentBalance(user.accounts.investments[account as keyof typeof user.accounts.investments]), newValue: newInvestBalance }
        );
        break;
        
      case 'spend':
        updatedUser = {
          ...user,
          accounts: {
            ...user.accounts,
            checking: user.accounts.checking - amount,
          },
          updatedAt: new Date(),
        };
        message = `Recorded spending of $${amount.toLocaleString()}.`;
        details = `New checking balance: $${updatedUser.accounts.checking.toLocaleString()}.`;
        changes.push(
          { field: 'checking', oldValue: user.accounts.checking, newValue: updatedUser.accounts.checking }
        );
        break;
        
      default:
        return { success: false, message: 'Unknown action type.' };
    }
    
    // Update goal progress if linked
    if (goalId && (actionType === 'save' || actionType === 'invest')) {
      const goalIndex = updatedUser.goals.findIndex(g => g.id === goalId);
      const goal = updatedUser.goals[goalIndex];
      if (goalIndex !== -1 && goal) {
        const oldProgress = (goal.currentAmount / goal.targetAmount) * 100;
        const newCurrentAmount = goal.currentAmount + amount;
        const newProgress = (newCurrentAmount / goal.targetAmount) * 100;
        
        const updatedGoals = updatedUser.goals.map((g, idx) => 
          idx === goalIndex
            ? { ...g, currentAmount: newCurrentAmount }
            : g
        );
        updatedUser = { ...updatedUser, goals: updatedGoals };
        
        details += ` ${goal.name} progress: ${newProgress.toFixed(1)}%.`;
        changes.push({
          field: `${goal.name} progress`,
          oldValue: oldProgress,
          newValue: newProgress,
        });
      }
    }
    
    // PERSIST: Update the global user state
    userStateManager.setUserState(updatedUser);
    
    return {
      success: true,
      message,
      details,
      updatedUser,
      changes,
    };
  }
  
  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================
  
  private getAccountBalance(user: UserProfile, accountName: string): number | null {
    switch (accountName.toLowerCase()) {
      case 'checking':
        return user.accounts.checking;
      case 'savings':
        return user.accounts.savings;
      case 'taxable':
      case 'investment':
      case 'investments':
        return getInvestmentBalance(user.accounts.investments.taxable);
      case 'rothira':
      case 'roth':
      case 'roth ira':
        return getInvestmentBalance(user.accounts.investments.rothIRA);
      case '401k':
      case 'traditional401k':
        return getInvestmentBalance(user.accounts.investments.traditional401k);
      default:
        return null;
    }
  }
  
  private checkGuardrails(user: UserProfile, account: string, newBalance: number): string | null {
    for (const guardrail of user.preferences.guardrails) {
      if (guardrail.type === 'min_balance' && guardrail.accountId === account) {
        if (newBalance < (guardrail.threshold || 0)) {
          return `This action would violate your guardrail: "${guardrail.rule}". The ${account} balance would drop to $${newBalance.toLocaleString()}, below your $${guardrail.threshold?.toLocaleString()} minimum.`;
        }
      }
    }
    return null;
  }
  
  private applyTransfer(user: UserProfile, from: string, to: string, amount: number): UserProfile {
    const updatedAccounts = { ...user.accounts };
    
    // Deduct from source
    switch (from.toLowerCase()) {
      case 'checking':
        updatedAccounts.checking -= amount;
        break;
      case 'savings':
        updatedAccounts.savings -= amount;
        break;
    }
    
    // Add to destination
    switch (to.toLowerCase()) {
      case 'checking':
        updatedAccounts.checking += amount;
        break;
      case 'savings':
        updatedAccounts.savings += amount;
        break;
      case 'investment':
      case 'taxable':
        return this.applyInvestment(
          { ...user, accounts: updatedAccounts },
          amount,
          'taxable'
        );
    }
    
    return {
      ...user,
      accounts: updatedAccounts,
      updatedAt: new Date(),
    };
  }
  
  private applyInvestment(
    user: UserProfile, 
    amount: number, 
    account: 'taxable' | 'rothIRA' | 'traditional401k'
  ): UserProfile {
    const investments = { ...user.accounts.investments };
    const currentAccount = investments[account];
    
    if (typeof currentAccount === 'number') {
      investments[account] = currentAccount + amount;
    } else {
      investments[account] = {
        ...currentAccount,
        balance: currentAccount.balance + amount,
      };
    }
    
    return {
      ...user,
      accounts: {
        ...user.accounts,
        checking: user.accounts.checking - amount,
        investments,
      },
      updatedAt: new Date(),
    };
  }
}

// Export singleton instance
export const actionExecutor = new ActionExecutor();
