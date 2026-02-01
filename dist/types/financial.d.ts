export interface UserProfile {
    id: string;
    name: string;
    monthlyIncome: number;
    accounts: Accounts;
    fixedExpenses: FixedExpense[];
    spendingCategories: SpendingCategory[];
    goals: FinancialGoal[];
    priority_goal_id?: string;
    stabilization_mode?: boolean;
    stabilization_start?: string;
    stabilization_end?: string;
    stabilization_canceled_at?: string;
    preferences: UserPreferences;
    upcomingExpenses?: UpcomingExpense[];
    createdAt: Date;
    updatedAt: Date;
}
export interface Accounts {
    checking: number;
    savings: number;
    investments: InvestmentAccounts;
}
export interface AssetAllocation {
    stocks: number;
    bonds: number;
    cash: number;
    other?: number;
}
export interface InvestmentAccount {
    balance: number;
    allocation: AssetAllocation;
}
export interface InvestmentAccounts {
    taxable: number | InvestmentAccount;
    rothIRA: number | InvestmentAccount;
    traditional401k: number | InvestmentAccount;
}
export interface FixedExpense {
    id: string;
    name: string;
    amount: number;
    frequency: 'monthly' | 'annual';
    dueDay?: number;
}
export interface UpcomingExpense {
    id: string;
    name: string;
    amount: number;
    dueDate: string;
    isRecurring: boolean;
    categoryId?: string;
    notes?: string;
    status: 'pending' | 'paid' | 'overdue';
}
export interface SpendingSubcategory {
    id: string;
    name: string;
    monthlyBudget: number;
    currentSpent: number;
}
export interface SpendingCategory {
    id: string;
    name: string;
    monthlyBudget: number;
    currentSpent: number;
    transactions: Transaction[];
    subcategories?: SpendingSubcategory[];
}
export interface Transaction {
    id: string;
    date: Date;
    amount: number;
    category: string;
    description: string;
    type: 'expense' | 'income' | 'transfer';
}
export interface FinancialGoal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: Date;
    priority: number;
    timeHorizon: 'short' | 'medium' | 'long';
    linkedAccountIds: string[];
    isPriority?: boolean;
}
export interface InvestmentPreferences {
    autoInvestEnabled: boolean;
    reminderFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'none';
    reminderDay?: number;
    targetMonthlyInvestment?: number;
    preferredAccount?: 'taxable' | 'rothIRA' | 'traditional401k';
    lastInvestmentDate?: Date;
}
export interface UserPreferences {
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    liquidityPreference: 'high' | 'medium' | 'low';
    guardrails: Guardrail[];
    investmentPreferences?: InvestmentPreferences;
}
export interface Guardrail {
    id: string;
    rule: string;
    type: 'min_balance' | 'max_investment_pct' | 'protected_account';
    accountId?: string;
    threshold?: number;
}
export interface FinancialAction {
    type: 'save' | 'invest' | 'spend';
    amount: number;
    targetAccountId?: string;
    goalId?: string;
    category?: string;
}
export interface SimulationResult {
    action: FinancialAction;
    scenarioIfDo: Scenario;
    scenarioIfDont: Scenario;
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
    validationResult: ValidationResult;
}
export interface Scenario {
    accountsAfter: Accounts;
    goalImpacts: GoalImpact[];
    budgetImpacts: BudgetImpact[];
    liquidityImpact: string;
    riskImpact: string;
    timelineChanges: string[];
}
export interface GoalImpact {
    goalId: string;
    goalName: string;
    progressChangePct: number;
    timeToGoalBefore: number;
    timeToGoalAfter: number;
    timeSaved: number;
    futureValue?: number;
}
export interface BudgetImpact {
    categoryId: string;
    categoryName: string;
    percentUsed: number;
    amountRemaining: number;
    status: 'under' | 'good' | 'warning' | 'over';
}
export interface ValidationResult {
    passed: boolean;
    constraintViolations: string[];
    contradictions: string[];
    uncertaintySources: string[];
    overallConfidence: 'high' | 'medium' | 'low';
    alternativeIfUncertain?: string;
}
export interface AgentOutput {
    agentName: string;
    recommendation: string;
    confidence: number;
    reasoning: string;
    flags: string[];
    data?: Record<string, any>;
}
export interface ComparisonOption {
    label: string;
    result: SimulationResult;
}
export interface FinancialState {
    user: UserProfile;
    timestamp: Date;
}
export type AccountType = 'checking' | 'savings' | 'taxable' | 'rothIRA' | 'traditional401k';
export type TimeHorizon = 'short' | 'medium' | 'long';
export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type BudgetStatus = 'under' | 'good' | 'warning' | 'over';
export declare function getInvestmentBalance(account: number | InvestmentAccount): number;
export declare function getInvestmentAllocation(account: number | InvestmentAccount): AssetAllocation;
export declare function calculatePortfolioAllocation(investments: InvestmentAccounts): AssetAllocation;
//# sourceMappingURL=financial.d.ts.map