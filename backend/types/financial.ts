/**
 * Core Financial Decision Platform - Type Definitions
 * 
 * This file contains all the foundational types for the financial simulation system.
 * These types are used across the simulation engine, agents, frontend, and API layers.
 */

// ============================================================================
// USER PROFILE & ACCOUNTS
// ============================================================================

/**
 * Complete user profile containing all financial information
 */
export interface UserProfile {
  /** Unique user identifier */
  id: string;
  
  /** User's display name */
  name: string;
  
  /** Monthly income after taxes */
  monthlyIncome: number;
  
  /** All user account balances */
  accounts: Accounts;
  
  /** Recurring fixed expenses (rent, loans, etc.) */
  fixedExpenses: FixedExpense[];
  
  /** Discretionary spending categories and budgets */
  spendingCategories: SpendingCategory[];
  
  /** Financial goals the user is working toward */
  goals: FinancialGoal[];
  
  /** User's financial preferences and risk profile */
  preferences: UserPreferences;
  
  /** One-time or scheduled upcoming expenses */
  upcomingExpenses?: UpcomingExpense[];
  
  /** Profile creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * User's account balances across different account types
 */
export interface Accounts {
  /** Checking account balance */
  checking: number;
  
  /** Savings account balance */
  savings: number;
  
  /** Investment accounts breakdown */
  investments: InvestmentAccounts;
}

/**
 * Asset allocation breakdown (percentages that sum to 100)
 */
export interface AssetAllocation {
  /** Stocks/equities percentage (0-100) */
  stocks: number;
  
  /** Bonds/fixed income percentage (0-100) */
  bonds: number;
  
  /** Cash/money market percentage (0-100) */
  cash: number;
  
  /** Other assets percentage (0-100) - REITs, commodities, etc. */
  other?: number;
}

/**
 * Investment account with balance and asset allocation
 */
export interface InvestmentAccount {
  /** Account balance */
  balance: number;
  
  /** Asset allocation breakdown (percentages sum to 100) */
  allocation: AssetAllocation;
}

/**
 * Investment account balances by account type
 * Supports both simple number format (backward compatible) and detailed account format
 */
export interface InvestmentAccounts {
  /** Taxable brokerage account */
  taxable: number | InvestmentAccount;
  
  /** Roth IRA balance (post-tax contributions) */
  rothIRA: number | InvestmentAccount;
  
  /** Traditional 401(k) balance (pre-tax contributions) */
  traditional401k: number | InvestmentAccount;
}

// ============================================================================
// EXPENSES & TRANSACTIONS
// ============================================================================

/**
 * Recurring fixed expense (non-discretionary)
 */
export interface FixedExpense {
  /** Unique expense identifier */
  id: string;
  
  /** Expense name (e.g., "Rent", "Car Payment") */
  name: string;
  
  /** Expense amount */
  amount: number;
  
  /** How often this expense occurs */
  frequency: 'monthly' | 'annual';
  
  /** Day of month the expense is due (1-31) */
  dueDay?: number;
}

/**
 * One-time or scheduled upcoming expense
 */
export interface UpcomingExpense {
  /** Unique identifier */
  id: string;
  
  /** Expense name (e.g., "Annual Insurance Premium", "Car Registration") */
  name: string;
  
  /** Expense amount */
  amount: number;
  
  /** Date the expense is due */
  dueDate: string;
  
  /** Whether this expense recurs */
  isRecurring: boolean;
  
  /** Optional spending category this falls under */
  categoryId?: string;
  
  /** Optional notes or description */
  notes?: string;
  
  /** Status of the expense */
  status: 'pending' | 'paid' | 'overdue';
}

/**
 * Subcategory within a spending category
 */
export interface SpendingSubcategory {
  /** Unique subcategory identifier */
  id: string;
  
  /** Subcategory name (e.g., "Produce", "Meat", "Dairy" under Groceries) */
  name: string;
  
  /** Monthly budget allocation for this subcategory */
  monthlyBudget: number;
  
  /** Amount spent in current period */
  currentSpent: number;
}

/**
 * Discretionary spending category with budget tracking
 */
export interface SpendingCategory {
  /** Unique category identifier */
  id: string;
  
  /** Category name (e.g., "Groceries", "Dining", "Entertainment") */
  name: string;
  
  /** Monthly budget allocation for this category */
  monthlyBudget: number;
  
  /** Amount spent in current period */
  currentSpent: number;
  
  /** Transaction history for this category */
  transactions: Transaction[];
  
  /** Optional subcategories for detailed tracking */
  subcategories?: SpendingSubcategory[];
}

/**
 * Individual financial transaction
 */
export interface Transaction {
  /** Unique transaction identifier */
  id: string;
  
  /** Transaction date */
  date: Date;
  
  /** Transaction amount (positive for income, negative for expenses) */
  amount: number;
  
  /** Spending category this transaction belongs to */
  category: string;
  
  /** Human-readable transaction description */
  description: string;
  
  /** Type of transaction */
  type: 'expense' | 'income' | 'transfer';
}

// ============================================================================
// FINANCIAL GOALS
// ============================================================================

/**
 * User-defined financial goal with tracking
 */
export interface FinancialGoal {
  /** Unique goal identifier */
  id: string;
  
  /** Goal name (e.g., "Emergency Fund", "House Down Payment") */
  name: string;
  
  /** Target amount to reach */
  targetAmount: number;
  
  /** Current progress toward goal */
  currentAmount: number;
  
  /** Target completion date */
  deadline: Date;
  
  /** Priority level (1-5, where 1 is highest priority) */
  priority: number;
  
  /** Time horizon classification */
  timeHorizon: 'short' | 'medium' | 'long'; // < 2yr, 2-5yr, 5yr+
  
  /** Account IDs that contribute to this goal */
  linkedAccountIds: string[];
}

// ============================================================================
// USER PREFERENCES & GUARDRAILS
// ============================================================================

/**
 * Investment reminder preferences
 */
export interface InvestmentPreferences {
  /** Whether auto-invest is enabled */
  autoInvestEnabled: boolean;
  
  /** How often to receive investment reminders (if not auto-investing) */
  reminderFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'none';
  
  /** Preferred day for reminders (1-7 for weekly, 1-28 for monthly) */
  reminderDay?: number;
  
  /** Target monthly investment amount (optional) */
  targetMonthlyInvestment?: number;
  
  /** Preferred account for investments */
  preferredAccount?: 'taxable' | 'rothIRA' | 'traditional401k';
  
  /** Last investment date (for tracking reminder timing) */
  lastInvestmentDate?: Date;
}

/**
 * User's financial preferences and risk profile
 */
export interface UserPreferences {
  /** Investment risk tolerance level */
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  
  /** Preference for liquid vs. locked-up assets */
  liquidityPreference: 'high' | 'medium' | 'low';
  
  /** User-defined financial safety rules */
  guardrails: Guardrail[];
  
  /** Investment preferences and reminder settings (optional for backward compatibility) */
  investmentPreferences?: InvestmentPreferences;
}

/**
 * User-defined financial safety constraint
 */
export interface Guardrail {
  /** Unique guardrail identifier */
  id: string;
  
  /** Human-readable rule description */
  rule: string; // e.g., "Never let checking drop below $1,000"
  
  /** Type of constraint */
  type: 'min_balance' | 'max_investment_pct' | 'protected_account';
  
  /** Account this rule applies to */
  accountId?: string;
  
  /** Numerical threshold for the rule */
  threshold?: number;
}

// ============================================================================
// FINANCIAL ACTIONS
// ============================================================================

/**
 * A potential financial action the user can take
 */
export interface FinancialAction {
  /** Type of action */
  type: 'save' | 'invest' | 'spend';
  
  /** Amount of money involved */
  amount: number;
  
  /** Target account for save/invest actions */
  targetAccountId?: string;
  
  /** Goal this action supports */
  goalId?: string;
  
  /** Spending category (for spend actions) */
  category?: string;
}

// ============================================================================
// SIMULATION RESULTS
// ============================================================================

/**
 * Complete simulation result showing outcomes of a financial action
 */
export interface SimulationResult {
  /** The action being evaluated */
  action: FinancialAction;
  
  /** Projected outcome if the action is taken */
  scenarioIfDo: Scenario;
  
  /** Projected outcome if the action is NOT taken */
  scenarioIfDont: Scenario;
  
  /** Confidence level in the simulation accuracy */
  confidence: 'high' | 'medium' | 'low';
  
  /** Explanation of the recommendation */
  reasoning: string;
  
  /** Validation checks and constraint verification */
  validationResult: ValidationResult;
}

/**
 * Projected financial scenario outcome
 */
export interface Scenario {
  /** Account balances after the action */
  accountsAfter: Accounts;
  
  /** Impact on each financial goal */
  goalImpacts: GoalImpact[];
  
  /** Impact on spending budgets */
  budgetImpacts: BudgetImpact[];
  
  /** Description of liquidity impact */
  liquidityImpact: string;
  
  /** Description of risk impact */
  riskImpact: string;
  
  /** Timeline changes and important dates */
  timelineChanges: string[];
}

/**
 * Impact of an action on a specific financial goal
 */
export interface GoalImpact {
  /** Goal identifier */
  goalId: string;
  
  /** Goal name for display */
  goalName: string;
  
  /** Percentage change in goal progress (e.g., +3.5 = 3.5% closer) */
  progressChangePct: number;
  
  /** Months until goal completion before action */
  timeToGoalBefore: number;
  
  /** Months until goal completion after action */
  timeToGoalAfter: number;
  
  /** Months saved (negative if goal is delayed) */
  timeSaved: number;
  
  /** Projected future value (for investment goals) */
  futureValue?: number;
}

/**
 * Impact of an action on a spending category budget
 */
export interface BudgetImpact {
  /** Category identifier */
  categoryId: string;
  
  /** Category name for display */
  categoryName: string;
  
  /** Percentage of budget used (0-100+) */
  percentUsed: number;
  
  /** Dollar amount remaining in budget */
  amountRemaining: number;
  
  /** Budget health status */
  status: 'under' | 'good' | 'warning' | 'over';
}

/**
 * Validation result for a financial action
 */
export interface ValidationResult {
  /** Whether the action passes all validation checks */
  passed: boolean;
  
  /** List of constraint violations (guardrails broken) */
  constraintViolations: string[];
  
  /** Logical contradictions or conflicts detected */
  contradictions: string[];
  
  /** Sources of uncertainty in the simulation */
  uncertaintySources: string[];
  
  /** Overall confidence in the validation */
  overallConfidence: 'high' | 'medium' | 'low';
  
  /** Alternative recommendation if original action is uncertain */
  alternativeIfUncertain?: string;
}

// ============================================================================
// AGENT OUTPUTS
// ============================================================================

/**
 * Output from an individual agent's analysis
 */
export interface AgentOutput {
  /** Name of the agent that produced this output */
  agentName: string;
  
  /** Agent's recommendation */
  recommendation: string;
  
  /** Confidence score (0-1) */
  confidence: number;
  
  /** Explanation of the agent's reasoning */
  reasoning: string;
  
  /** Warnings or issues flagged by the agent */
  flags: string[];
  
  /** Agent-specific data payload */
  data?: Record<string, any>;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * A comparison option presented to the user
 */
export interface ComparisonOption {
  /** User-facing label (e.g., "Save $500", "Invest $500") */
  label: string;
  
  /** Simulation result for this option */
  result: SimulationResult;
}

/**
 * Complete snapshot of a user's financial state at a point in time
 */
export interface FinancialState {
  /** Complete user profile */
  user: UserProfile;
  
  /** Timestamp of this snapshot */
  timestamp: Date;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Account type identifiers
 */
export type AccountType = 
  | 'checking' 
  | 'savings' 
  | 'taxable' 
  | 'rothIRA' 
  | 'traditional401k';

/**
 * Time horizon categories for financial goals
 */
export type TimeHorizon = 'short' | 'medium' | 'long';

/**
 * Risk tolerance levels
 */
export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';

/**
 * Confidence levels for simulations and validations
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Budget status indicators
 */
export type BudgetStatus = 'under' | 'good' | 'warning' | 'over';

// ============================================================================
// PORTFOLIO UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the balance from an investment account (handles both number and InvestmentAccount formats)
 */
export function getInvestmentBalance(account: number | InvestmentAccount): number {
  return typeof account === 'number' ? account : account.balance;
}

/**
 * Get the allocation from an investment account (returns default if not available)
 */
export function getInvestmentAllocation(account: number | InvestmentAccount): AssetAllocation {
  if (typeof account === 'number') {
    // Default allocation for accounts without allocation data: 100% stocks (aggressive default)
    return { stocks: 100, bonds: 0, cash: 0 };
  }
  return account.allocation;
}

/**
 * Calculate total portfolio allocation across all investment accounts
 */
export function calculatePortfolioAllocation(investments: InvestmentAccounts): AssetAllocation {
  const taxableBalance = getInvestmentBalance(investments.taxable);
  const rothBalance = getInvestmentBalance(investments.rothIRA);
  const trad401kBalance = getInvestmentBalance(investments.traditional401k);
  const totalBalance = taxableBalance + rothBalance + trad401kBalance;

  if (totalBalance === 0) {
    return { stocks: 0, bonds: 0, cash: 0 };
  }

  const taxableAlloc = getInvestmentAllocation(investments.taxable);
  const rothAlloc = getInvestmentAllocation(investments.rothIRA);
  const trad401kAlloc = getInvestmentAllocation(investments.traditional401k);

  // Weighted average allocation
  const stocks = (
    (taxableBalance * taxableAlloc.stocks +
     rothBalance * rothAlloc.stocks +
     trad401kBalance * trad401kAlloc.stocks) / totalBalance
  );
  
  const bonds = (
    (taxableBalance * taxableAlloc.bonds +
     rothBalance * rothAlloc.bonds +
     trad401kBalance * trad401kAlloc.bonds) / totalBalance
  );
  
  const cash = (
    (taxableBalance * (taxableAlloc.cash || 0) +
     rothBalance * (rothAlloc.cash || 0) +
     trad401kBalance * (trad401kAlloc.cash || 0)) / totalBalance
  );

  const other = (
    (taxableBalance * (taxableAlloc.other || 0) +
     rothBalance * (rothAlloc.other || 0) +
     trad401kBalance * (trad401kAlloc.other || 0)) / totalBalance
  );

  return {
    stocks: Math.round(stocks * 10) / 10,
    bonds: Math.round(bonds * 10) / 10,
    cash: Math.round(cash * 10) / 10,
    other: other > 0 ? Math.round(other * 10) / 10 : undefined,
  };
}
