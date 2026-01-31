/**
 * User History RAG
 * Indexes and retrieves user's financial history for context-aware recommendations
 */

import { Document } from '@langchain/core/documents';
import { vectorStore } from './vector-store.js';
import type { UserProfile, Transaction } from '../../types/financial.js';

export class UserHistoryRAG {
  /**
   * Index all of a user's historical data
   */
  async indexUser(user: UserProfile): Promise<void> {
    const collectionName = `user_${user.id}_history`;
    const documents = this.createDocuments(user);
    
    await vectorStore.addDocuments(collectionName, documents);
    console.log(`[RAG] Indexed ${documents.length} items for user ${user.id}`);
  }

  /**
   * Search user's history for relevant context
   */
  async search(
    userId: string,
    query: string,
    k: number = 5
  ): Promise<Array<{ content: string; source: string; metadata: Record<string, unknown> }>> {
    const collectionName = `user_${userId}_history`;
    const docs = await vectorStore.search(collectionName, query, k);
    
    return docs.map(doc => ({
      content: doc.pageContent,
      source: (doc.metadata.type as string) || 'unknown',
      metadata: doc.metadata,
    }));
  }

  /**
   * Convert user data into searchable documents
   */
  private createDocuments(user: UserProfile): Document[] {
    const docs: Document[] = [];

    // 1. Transaction patterns (monthly summaries)
    const transactions = user.spendingCategories.flatMap(c => c.transactions);
    const monthlyGroups = this.groupByMonth(transactions);

    monthlyGroups.forEach(({ month, transactions: monthTxns }) => {
      const totalSpent = monthTxns.reduce((sum, t) => sum + t.amount, 0);
      const avgTransaction = totalSpent / monthTxns.length;
      const categories = [...new Set(monthTxns.map(t => t.category))];
      const categoryBreakdown = this.getCategoryBreakdown(monthTxns);

      docs.push(new Document({
        pageContent: `
Monthly Summary for ${month}:
- Total spent: $${totalSpent.toFixed(2)}
- Number of transactions: ${monthTxns.length}
- Average transaction: $${avgTransaction.toFixed(2)}
- Categories: ${categories.join(', ')}
- Breakdown: ${categoryBreakdown}
        `.trim(),
        metadata: {
          type: 'monthly_summary',
          month,
          total: totalSpent,
          transactionCount: monthTxns.length,
          categories,
        }
      }));
    });

    // 2. Significant transactions (>$200 or unusual)
    const significantTxns = transactions
      .filter(t => t.amount > 200)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 15); // Top 15 largest

    significantTxns.forEach(txn => {
      docs.push(new Document({
        pageContent: `
Significant Transaction:
- Date: ${txn.date.toLocaleDateString()}
- Amount: $${txn.amount.toFixed(2)}
- Category: ${txn.category}
- Description: ${txn.description}
- Type: ${txn.type}
        `.trim(),
        metadata: {
          type: 'significant_transaction',
          amount: txn.amount,
          category: txn.category,
          date: txn.date.toISOString(),
        }
      }));
    });

    // 3. Goal information and progress
    user.goals.forEach(goal => {
      const progressPct = (goal.currentAmount / goal.targetAmount) * 100;
      const monthsToDeadline = this.getMonthsUntil(goal.deadline);
      const monthlyRequired = monthsToDeadline > 0 
        ? (goal.targetAmount - goal.currentAmount) / monthsToDeadline 
        : 0;

      docs.push(new Document({
        pageContent: `
Financial Goal: ${goal.name}
- Target: $${goal.targetAmount.toFixed(2)}
- Current: $${goal.currentAmount.toFixed(2)} (${progressPct.toFixed(1)}% complete)
- Deadline: ${goal.deadline.toLocaleDateString()} (${monthsToDeadline} months away)
- Priority: ${goal.priority}/5 (${this.getPriorityLabel(goal.priority)})
- Time Horizon: ${goal.timeHorizon}
- Monthly requirement to reach goal: $${monthlyRequired.toFixed(2)}
        `.trim(),
        metadata: {
          type: 'goal',
          goalId: goal.id,
          goalName: goal.name,
          progress: progressPct,
          priority: goal.priority,
          monthsRemaining: monthsToDeadline,
        }
      }));
    });

    // 4. Spending category patterns
    user.spendingCategories.forEach(cat => {
      const utilization = (cat.currentSpent / cat.monthlyBudget) * 100;
      const status = this.getCategoryStatus(utilization);
      const avgTransactionSize = cat.transactions.length > 0
        ? cat.currentSpent / cat.transactions.length
        : 0;

      docs.push(new Document({
        pageContent: `
Spending Category: ${cat.name}
- Budget: $${cat.monthlyBudget.toFixed(2)}/month
- Current spent: $${cat.currentSpent.toFixed(2)} (${utilization.toFixed(1)}% of budget)
- Status: ${status}
- Transactions this period: ${cat.transactions.length}
- Average transaction size: $${avgTransactionSize.toFixed(2)}
        `.trim(),
        metadata: {
          type: 'category_pattern',
          category: cat.name,
          utilization,
          status,
        }
      }));
    });

    // 5. Fixed expenses summary
    const totalFixed = user.fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
    docs.push(new Document({
      pageContent: `
Fixed Expenses Summary:
- Total monthly fixed expenses: $${totalFixed.toFixed(2)}
- Breakdown: ${user.fixedExpenses.map(e => `${e.name} ($${e.amount})`).join(', ')}
- As percentage of income: ${((totalFixed / user.monthlyIncome) * 100).toFixed(1)}%
      `.trim(),
      metadata: {
        type: 'fixed_expenses',
        total: totalFixed,
        count: user.fixedExpenses.length,
      }
    }));

    // 6. Financial health snapshot
    const totalAssets = user.accounts.checking + user.accounts.savings +
      user.accounts.investments.taxable + user.accounts.investments.rothIRA +
      user.accounts.investments.traditional401k;
    
    const totalMonthlyExpenses = totalFixed + 
      user.spendingCategories.reduce((sum, c) => sum + c.monthlyBudget, 0);
    
    const monthsOfRunway = user.accounts.checking / totalMonthlyExpenses;
    const savingsRate = ((user.monthlyIncome - totalMonthlyExpenses) / user.monthlyIncome) * 100;

    docs.push(new Document({
      pageContent: `
Financial Health Overview:
- Total assets: $${totalAssets.toFixed(2)}
- Monthly income: $${user.monthlyIncome.toFixed(2)}
- Monthly expenses: $${totalMonthlyExpenses.toFixed(2)}
- Savings rate: ${savingsRate.toFixed(1)}%
- Months of runway in checking: ${monthsOfRunway.toFixed(1)}
- Risk tolerance: ${user.preferences.riskTolerance}
- Liquidity preference: ${user.preferences.liquidityPreference}
      `.trim(),
      metadata: {
        type: 'financial_snapshot',
        totalAssets,
        savingsRate,
        monthsOfRunway,
      }
    }));

    // 7. Guardrails/constraints
    user.preferences.guardrails.forEach((guardrail, idx) => {
      docs.push(new Document({
        pageContent: `
User Constraint #${idx + 1}: ${guardrail.rule}
- Type: ${guardrail.type}
${guardrail.threshold ? `- Threshold: ${guardrail.threshold}` : ''}
${guardrail.accountId ? `- Applies to: ${guardrail.accountId}` : ''}
        `.trim(),
        metadata: {
          type: 'guardrail',
          guardrailType: guardrail.type,
        }
      }));
    });

    return docs;
  }

  /**
   * Helper: Group transactions by month
   */
  private groupByMonth(transactions: Transaction[]): Array<{
    month: string;
    transactions: Transaction[];
  }> {
    const groups = new Map<string, Transaction[]>();

    transactions.forEach(txn => {
      const monthKey = txn.date.toISOString().substring(0, 7); // YYYY-MM
      if (!groups.has(monthKey)) {
        groups.set(monthKey, []);
      }
      groups.get(monthKey)!.push(txn);
    });

    return Array.from(groups.entries())
      .map(([month, transactions]) => ({ month, transactions }))
      .sort((a, b) => b.month.localeCompare(a.month)); // Most recent first
  }

  /**
   * Helper: Get category breakdown string
   */
  private getCategoryBreakdown(transactions: Transaction[]): string {
    const breakdown = new Map<string, number>();
    transactions.forEach(t => {
      breakdown.set(t.category, (breakdown.get(t.category) || 0) + t.amount);
    });

    return Array.from(breakdown.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount]) => `${cat}: $${amount.toFixed(0)}`)
      .join(', ');
  }

  /**
   * Helper: Get months until date
   */
  private getMonthsUntil(date: Date): number {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    return Math.max(0, diffMs / (1000 * 60 * 60 * 24 * 30));
  }

  /**
   * Helper: Priority label
   */
  private getPriorityLabel(priority: number): string {
    if (priority === 1) return 'Critical';
    if (priority === 2) return 'High';
    if (priority === 3) return 'Medium';
    if (priority === 4) return 'Low';
    return 'Optional';
  }

  /**
   * Helper: Category status
   */
  private getCategoryStatus(utilization: number): string {
    if (utilization < 50) return 'Under budget';
    if (utilization < 80) return 'On track';
    if (utilization < 100) return 'Approaching limit';
    return 'Over budget';
  }
}

// Singleton
export const userHistoryRAG = new UserHistoryRAG();
