/**
 * Financial Knowledge Base
 * Curated financial principles and best practices for RAG retrieval
 */

import { Document } from '@langchain/core/documents';
import { vectorStore } from './vector-store.js';

export class FinancialKnowledgeBase {
  private static readonly COLLECTION_NAME = 'financial_knowledge';

  /**
   * Initialize knowledge base with curated financial principles
   */
  async initialize(): Promise<void> {
    const documents = this.createKnowledgeDocuments();
    await vectorStore.addDocuments(FinancialKnowledgeBase.COLLECTION_NAME, documents);
    console.log(`[RAG] Initialized knowledge base with ${documents.length} documents`);
  }

  /**
   * Search knowledge base for relevant principles
   */
  async search(query: string, k: number = 3): Promise<Array<{
    principle: string;
    source: string;
    category: string;
  }>> {
    const docs = await vectorStore.search(
      FinancialKnowledgeBase.COLLECTION_NAME,
      query,
      k
    );

    return docs.map(doc => ({
      principle: doc.pageContent,
      source: (doc.metadata.source as string) || 'Internal knowledge base',
      category: (doc.metadata.category as string) || 'General',
    }));
  }

  /**
   * Curated financial knowledge documents
   */
  private createKnowledgeDocuments(): Document[] {
    return [
      // Emergency Fund Principles
      new Document({
        pageContent: `Emergency Fund Best Practice: Financial experts recommend maintaining 3-6 months of essential expenses in a liquid savings account. This provides a safety net for unexpected job loss, medical emergencies, or urgent repairs. Conservative savers should aim for 6 months, while those with stable income and dual-income households can target 3 months.`,
        metadata: {
          category: 'Emergency Fund',
          source: 'Financial Planning Standards',
          priority: 'high',
        }
      }),

      new Document({
        pageContent: `Liquidity Buffer: Keep at least 1-2 months of expenses in checking account beyond your emergency fund. This prevents overdrafts, late fees, and the need to liquidate investments at inopportune times. Higher spending variability requires larger buffers.`,
        metadata: {
          category: 'Cash Management',
          source: 'Personal Finance Best Practices',
          priority: 'high',
        }
      }),

      // Investment Principles
      new Document({
        pageContent: `Time Horizon and Risk: Investment risk should match time horizon. For goals less than 2 years away, keep funds in high-yield savings or short-term bonds. For 2-5 year goals, consider balanced portfolios. For 5+ year goals, higher equity allocation is appropriate as time allows recovery from volatility.`,
        metadata: {
          category: 'Investment',
          source: 'Modern Portfolio Theory',
          priority: 'high',
        }
      }),

      new Document({
        pageContent: `Dollar-Cost Averaging: Investing fixed amounts regularly (e.g., monthly) reduces the impact of market volatility and removes emotion from investment decisions. This strategy is particularly effective for long-term goals like retirement.`,
        metadata: {
          category: 'Investment',
          source: 'Investment Strategy',
          priority: 'medium',
        }
      }),

      new Document({
        pageContent: `Asset Allocation by Risk Tolerance: Conservative investors should limit stocks to 40-60% of portfolio. Moderate investors can hold 60-80% stocks. Aggressive investors comfortable with volatility can maintain 80-100% stocks, especially with long time horizons.`,
        metadata: {
          category: 'Investment',
          source: 'Asset Allocation Guidelines',
          priority: 'medium',
        }
      }),

      new Document({
        pageContent: `Market Return Assumptions: Historical stock market returns average 7-10% annually (adjusted for inflation). However, past performance doesn't guarantee future results. Conservative planning uses 6-7% assumptions, while aggressive planning might use 8-10%.`,
        metadata: {
          category: 'Investment',
          source: 'Historical Market Data',
          priority: 'medium',
        }
      }),

      // Budgeting Principles
      new Document({
        pageContent: `50/30/20 Budget Rule: Allocate 50% of after-tax income to needs (housing, utilities, groceries), 30% to wants (dining, entertainment), and 20% to savings and debt repayment. Adjust ratios based on individual circumstances and goals.`,
        metadata: {
          category: 'Budgeting',
          source: 'Senator Elizabeth Warren',
          priority: 'medium',
        }
      }),

      new Document({
        pageContent: `Spending Variance: High month-to-month spending variability indicates financial unpredictability. Track spending for 3-6 months to establish baseline. High variance (>30%) requires larger emergency funds and conservative budgeting.`,
        metadata: {
          category: 'Budgeting',
          source: 'Financial Analysis',
          priority: 'medium',
        }
      }),

      // Goal Setting
      new Document({
        pageContent: `SMART Financial Goals: Goals should be Specific (exact amount), Measurable (track progress), Achievable (realistic given income), Relevant (aligned with values), and Time-bound (clear deadline). Prioritize goals numerically to guide trade-off decisions.`,
        metadata: {
          category: 'Goal Setting',
          source: 'Financial Planning Framework',
          priority: 'medium',
        }
      }),

      new Document({
        pageContent: `Goal Prioritization: Generally prioritize in this order: (1) Emergency fund, (2) High-interest debt payoff, (3) Employer 401(k) match, (4) Additional retirement savings, (5) Other goals (house, vacation). Individual circumstances may vary.`,
        metadata: {
          category: 'Goal Setting',
          source: 'Financial Planning Standards',
          priority: 'high',
        }
      }),

      // Risk Management
      new Document({
        pageContent: `Sequence of Returns Risk: For goals within 5 years, market downturns can derail plans. De-risk as deadline approaches by shifting to bonds/cash. This is especially critical for non-flexible goals like home purchases or education.`,
        metadata: {
          category: 'Risk Management',
          source: 'Financial Planning',
          priority: 'high',
        }
      }),

      new Document({
        pageContent: `Opportunity Cost: Money held in checking accounts earns near-zero returns. High-yield savings accounts offer 4-5% APY. Index funds historically return 7-10% annually but with volatility. Choose based on time horizon and risk tolerance.`,
        metadata: {
          category: 'Investment',
          source: 'Financial Economics',
          priority: 'medium',
        }
      }),

      // Tax-Advantaged Accounts
      new Document({
        pageContent: `Roth IRA vs Traditional: Roth IRA contributions are after-tax but grow tax-free. Traditional IRA/401(k) contributions are pre-tax but taxed on withdrawal. Choose Roth if expecting higher tax bracket in retirement, Traditional if current tax bracket is high.`,
        metadata: {
          category: 'Retirement',
          source: 'IRS Tax Guidelines',
          priority: 'medium',
        }
      }),

      new Document({
        pageContent: `401(k) Employer Match: Always contribute enough to get full employer match - it's free money with 100% instant return. This takes priority over most other financial goals except critical emergencies.`,
        metadata: {
          category: 'Retirement',
          source: 'Retirement Planning',
          priority: 'high',
        }
      }),

      // Behavioral Finance
      new Document({
        pageContent: `Behavioral Biases: Common mistakes include (1) Loss aversion - holding losing investments too long, (2) Recency bias - assuming recent trends continue, (3) Confirmation bias - seeking only information that supports existing beliefs. Systematic, rule-based approaches help overcome these biases.`,
        metadata: {
          category: 'Behavioral Finance',
          source: 'Behavioral Economics',
          priority: 'medium',
        }
      }),

      new Document({
        pageContent: `Automation Benefits: Automated savings and investments remove decision fatigue and emotional interference. Set up automatic transfers on payday to "pay yourself first" before discretionary spending opportunities arise.`,
        metadata: {
          category: 'Behavioral Finance',
          source: 'Personal Finance Research',
          priority: 'medium',
        }
      }),
    ];
  }
}

// Singleton
export const knowledgeBase = new FinancialKnowledgeBase();
