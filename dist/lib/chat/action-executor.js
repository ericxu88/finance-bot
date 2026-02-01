import { getInvestmentBalance } from '../../types/financial.js';
export class ActionExecutor {
    executeTransfer(user, request) {
        const { fromAccount, toAccount, amount } = request;
        if (amount <= 0) {
            return {
                success: false,
                message: 'Transfer amount must be positive.',
            };
        }
        const sourceBalance = this.getAccountBalance(user, fromAccount);
        if (sourceBalance === null) {
            return {
                success: false,
                message: `Unknown source account: ${fromAccount}`,
            };
        }
        if (sourceBalance < amount) {
            return {
                success: false,
                message: `Insufficient funds in ${fromAccount}. Available: $${sourceBalance.toLocaleString()}, Requested: $${amount.toLocaleString()}`,
            };
        }
        const guardrailViolation = this.checkGuardrails(user, fromAccount, sourceBalance - amount);
        if (guardrailViolation) {
            return {
                success: false,
                message: guardrailViolation,
            };
        }
        const updatedUser = this.applyTransfer(user, fromAccount, toAccount, amount);
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
    createGoal(user, request) {
        const { name, targetAmount, deadlineMonths, priority } = request;
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
        const existingGoal = user.goals.find(g => g.name.toLowerCase() === name.toLowerCase());
        if (existingGoal) {
            return {
                success: false,
                message: `A goal named "${name}" already exists. Did you want to update it instead?`,
            };
        }
        const deadline = new Date();
        deadline.setMonth(deadline.getMonth() + (deadlineMonths || 12));
        const newGoal = {
            id: `goal_${Date.now()}`,
            name: name.trim(),
            targetAmount,
            currentAmount: 0,
            deadline,
            priority: priority || user.goals.length + 1,
            timeHorizon: deadlineMonths && deadlineMonths <= 12 ? 'short' : deadlineMonths && deadlineMonths <= 36 ? 'medium' : 'long',
            linkedAccountIds: ['savings'],
        };
        const updatedUser = {
            ...user,
            goals: [...user.goals, newGoal],
            updatedAt: new Date(),
        };
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
    updateBudget(user, request) {
        const { categoryName, newAmount, action, changeAmount } = request;
        const categoryIndex = user.spendingCategories.findIndex(c => c.name.toLowerCase() === categoryName.toLowerCase() ||
            c.id.toLowerCase() === categoryName.toLowerCase());
        if (categoryIndex === -1) {
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
        let calculatedNewAmount;
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
        const updatedCategories = user.spendingCategories.map((cat, idx) => idx === categoryIndex
            ? { ...cat, monthlyBudget: calculatedNewAmount }
            : cat);
        const updatedUser = {
            ...user,
            spendingCategories: updatedCategories,
            updatedAt: new Date(),
        };
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
    executeSimulatedAction(user, actionType, amount, goalId, targetAccount) {
        if (amount <= 0) {
            return {
                success: false,
                message: 'Amount must be positive.',
            };
        }
        if (user.accounts.checking < amount) {
            return {
                success: false,
                message: `Insufficient funds in checking. Available: $${user.accounts.checking.toLocaleString()}`,
            };
        }
        const guardrailViolation = this.checkGuardrails(user, 'checking', user.accounts.checking - amount);
        if (guardrailViolation) {
            return {
                success: false,
                message: guardrailViolation,
            };
        }
        let updatedUser;
        let message;
        let details;
        const changes = [];
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
                changes.push({ field: 'checking', oldValue: user.accounts.checking, newValue: updatedUser.accounts.checking }, { field: 'savings', oldValue: user.accounts.savings, newValue: updatedUser.accounts.savings });
                break;
            case 'invest':
                const account = targetAccount || 'taxable';
                updatedUser = this.applyInvestment(user, amount, account);
                message = `Invested $${amount.toLocaleString()} into your ${account} account.`;
                const newInvestBalance = getInvestmentBalance(updatedUser.accounts.investments[account]);
                details = `New checking: $${updatedUser.accounts.checking.toLocaleString()}. New ${account}: $${newInvestBalance.toLocaleString()}.`;
                changes.push({ field: 'checking', oldValue: user.accounts.checking, newValue: updatedUser.accounts.checking }, { field: `${account} investments`, oldValue: getInvestmentBalance(user.accounts.investments[account]), newValue: newInvestBalance });
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
                changes.push({ field: 'checking', oldValue: user.accounts.checking, newValue: updatedUser.accounts.checking });
                break;
            default:
                return { success: false, message: 'Unknown action type.' };
        }
        if (goalId && (actionType === 'save' || actionType === 'invest')) {
            const goalIndex = updatedUser.goals.findIndex(g => g.id === goalId);
            const goal = updatedUser.goals[goalIndex];
            if (goalIndex !== -1 && goal) {
                const oldProgress = (goal.currentAmount / goal.targetAmount) * 100;
                const newCurrentAmount = goal.currentAmount + amount;
                const newProgress = (newCurrentAmount / goal.targetAmount) * 100;
                const updatedGoals = updatedUser.goals.map((g, idx) => idx === goalIndex
                    ? { ...g, currentAmount: newCurrentAmount }
                    : g);
                updatedUser = { ...updatedUser, goals: updatedGoals };
                details += ` ${goal.name} progress: ${newProgress.toFixed(1)}%.`;
                changes.push({
                    field: `${goal.name} progress`,
                    oldValue: oldProgress,
                    newValue: newProgress,
                });
            }
        }
        return {
            success: true,
            message,
            details,
            updatedUser,
            changes,
        };
    }
    getAccountBalance(user, accountName) {
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
    checkGuardrails(user, account, newBalance) {
        for (const guardrail of user.preferences.guardrails) {
            if (guardrail.type === 'min_balance' && guardrail.accountId === account) {
                if (newBalance < (guardrail.threshold || 0)) {
                    return `This action would violate your guardrail: "${guardrail.rule}". The ${account} balance would drop to $${newBalance.toLocaleString()}, below your $${guardrail.threshold?.toLocaleString()} minimum.`;
                }
            }
        }
        return null;
    }
    applyTransfer(user, from, to, amount) {
        const updatedAccounts = { ...user.accounts };
        switch (from.toLowerCase()) {
            case 'checking':
                updatedAccounts.checking -= amount;
                break;
            case 'savings':
                updatedAccounts.savings -= amount;
                break;
        }
        switch (to.toLowerCase()) {
            case 'checking':
                updatedAccounts.checking += amount;
                break;
            case 'savings':
                updatedAccounts.savings += amount;
                break;
            case 'investment':
            case 'taxable':
                return this.applyInvestment({ ...user, accounts: updatedAccounts }, amount, 'taxable');
        }
        return {
            ...user,
            accounts: updatedAccounts,
            updatedAt: new Date(),
        };
    }
    applyInvestment(user, amount, account) {
        const investments = { ...user.accounts.investments };
        const currentAccount = investments[account];
        if (typeof currentAccount === 'number') {
            investments[account] = currentAccount + amount;
        }
        else {
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
export const actionExecutor = new ActionExecutor();
//# sourceMappingURL=action-executor.js.map