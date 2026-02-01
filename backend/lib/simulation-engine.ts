/**
 * Financial Simulation Engine
 * 
 * Pure functions that simulate financial decisions and calculate their impact
 * on goals, budgets, and account balances. All functions are deterministic.
 */

import type {
  UserProfile,
  FinancialAction,
  SimulationResult,
  Scenario,
  GoalImpact,
  BudgetImpact,
  Accounts,
  FinancialGoal,
  ValidationResult,
  BudgetStatus,
} from '../types/financial.js';
import { getInvestmentBalance } from '../types/financial.js';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default annual return rate for stock market investments */
export const DEFAULT_ANNUAL_RETURN = 0.07; // 7%

/** Annual return rate for high-yield savings accounts */
export const SAVINGS_RETURN = 0.04; // 4%

/** Annual return rate for checking accounts (typically none) */
export const CHECKING_RETURN = 0.0; // 0%

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Deep clone accounts object to avoid mutations
 */
export function cloneAccounts(accounts: Accounts): Accounts {
  return {
    checking: accounts.checking,
    savings: accounts.savings,
    investments: {
      taxable: typeof accounts.investments.taxable === 'number'
        ? accounts.investments.taxable
        : {
            balance: accounts.investments.taxable.balance,
            allocation: { ...accounts.investments.taxable.allocation },
          },
      rothIRA: typeof accounts.investments.rothIRA === 'number'
        ? accounts.investments.rothIRA
        : {
            balance: accounts.investments.rothIRA.balance,
            allocation: { ...accounts.investments.rothIRA.allocation },
          },
      traditional401k: typeof accounts.investments.traditional401k === 'number'
        ? accounts.investments.traditional401k
        : {
            balance: accounts.investments.traditional401k.balance,
            allocation: { ...accounts.investments.traditional401k.allocation },
          },
    },
  };
}

/**
 * Calculate budget status based on percentage used
 */
export function calculateBudgetStatus(percentUsed: number): BudgetStatus {
  if (percentUsed < 50) return 'under';
  if (percentUsed <= 80) return 'good';
  if (percentUsed <= 100) return 'warning';
  return 'over';
}

/**
 * Calculate liquidity impact of account changes
 */
export function calculateLiquidityImpact(
  checkingBefore: number,
  checkingAfter: number,
  savingsBefore: number,
  savingsAfter: number
): string {
  const liquidBefore = checkingBefore + savingsBefore;
  const liquidAfter = checkingAfter + savingsAfter;
  const changePercent = ((liquidAfter - liquidBefore) / liquidBefore) * 100;
  
  if (changePercent > 5) {
    return `High increase: Liquid assets increased by ${changePercent.toFixed(1)}%`;
  } else if (changePercent < -10) {
    return `Significant decrease: Liquid assets decreased by ${Math.abs(changePercent).toFixed(1)}%`;
  } else if (changePercent < -5) {
    return `Moderate decrease: Liquid assets decreased by ${Math.abs(changePercent).toFixed(1)}%`;
  } else if (changePercent < 0) {
    return `Minor decrease: Liquid assets decreased by ${Math.abs(changePercent).toFixed(1)}%`;
  } else {
    return `No significant change to liquid assets`;
  }
}

// ============================================================================
// CORE CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate future value of investment with monthly compounding
 * 
 * @param principal - Initial investment amount
 * @param monthlyContribution - Amount added each month
 * @param annualReturnRate - Annual return rate (e.g., 0.07 for 7%)
 * @param years - Number of years to project
 * @returns Final value after compounding
 * 
 * @example
 * calculateFutureValue(500, 0, 0.07, 5) // ~$701
 */
export function calculateFutureValue(
  principal: number,
  monthlyContribution: number,
  annualReturnRate: number,
  years: number
): number {
  const monthlyRate = annualReturnRate / 12;
  const months = years * 12;
  
  let value = principal;
  
  for (let month = 0; month < months; month++) {
    // Compound existing value
    value = value * (1 + monthlyRate);
    // Add monthly contribution
    value += monthlyContribution;
  }
  
  return Math.round(value * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate how many months until a goal is reached
 * 
 * @param goal - Financial goal to analyze
 * @param monthlyContribution - Amount saved/invested per month
 * @param assumedReturn - Annual return rate (0 for savings, 0.07 for investments)
 * @returns Number of months until goal is reached
 */
export function calculateTimeToGoal(
  goal: FinancialGoal,
  monthlyContribution: number,
  assumedReturn: number = 0
): number {
  const remaining = goal.targetAmount - goal.currentAmount;
  
  // Goal already achieved
  if (remaining <= 0) return 0;
  
  // No monthly contribution means never reaching goal
  if (monthlyContribution <= 0) return Infinity;
  
  // Simple case: no investment growth (savings)
  if (assumedReturn === 0) {
    return Math.ceil(remaining / monthlyContribution);
  }
  
  // Investment case: solve for time with compounding
  // Using future value formula: FV = PV * (1 + r)^n + PMT * [((1 + r)^n - 1) / r]
  // We need to solve for n (months)
  const monthlyRate = assumedReturn / 12;
  const currentAmount = goal.currentAmount;
  const targetAmount = goal.targetAmount;
  
  // Iterative approach: simulate month by month
  let balance = currentAmount;
  let months = 0;
  const maxMonths = 1200; // 100 years cap
  
  while (balance < targetAmount && months < maxMonths) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    months++;
  }
  
  return months >= maxMonths ? Infinity : months;
}

/**
 * Calculate impact of an action on a specific goal
 * 
 * @param goal - Financial goal to analyze
 * @param amountAdded - Amount being added to the goal
 * @param assumedAnnualReturn - Expected annual return (0 for savings, 0.07 for investments)
 * @returns GoalImpact describing progress and timeline changes
 */
export function calculateGoalImpact(
  goal: FinancialGoal,
  amountAdded: number,
  assumedAnnualReturn: number = 0.07
): GoalImpact {
  // Edge case: goal already achieved
  if (goal.currentAmount >= goal.targetAmount) {
    return {
      goalId: goal.id,
      goalName: goal.name,
      progressChangePct: 0,
      timeToGoalBefore: 0,
      timeToGoalAfter: 0,
      timeSaved: 0,
      futureValue: goal.currentAmount,
    };
  }
  
  // Edge case: no amount added
  if (amountAdded === 0) {
    return {
      goalId: goal.id,
      goalName: goal.name,
      progressChangePct: 0,
      timeToGoalBefore: Infinity,
      timeToGoalAfter: Infinity,
      timeSaved: 0,
    };
  }
  
  // Calculate progress change
  const progressBefore = (goal.currentAmount / goal.targetAmount) * 100;
  const progressAfter = ((goal.currentAmount + amountAdded) / goal.targetAmount) * 100;
  const progressChangePct = progressAfter - progressBefore;
  
  // For investments, calculate with growth
  let timeToGoalBefore = Infinity;
  let timeToGoalAfter = Infinity;
  
  if (assumedAnnualReturn > 0) {
    // Calculate months to reach goal with compound growth (no additional contributions)
    timeToGoalBefore = calculateTimeToGoal(goal, 0, assumedAnnualReturn);
    
    const adjustedGoal = { ...goal, currentAmount: goal.currentAmount + amountAdded };
    timeToGoalAfter = calculateTimeToGoal(adjustedGoal, 0, assumedAnnualReturn);
  } else {
    // Savings: no growth, would need monthly contributions
    // Return simplified months based on remaining
    timeToGoalBefore = Infinity; // Can't reach without contributions
    timeToGoalAfter = Infinity;
  }
  
  const timeSaved = timeToGoalBefore - timeToGoalAfter;
  
  // Calculate future value for investments
  let futureValue: number | undefined;
  if (assumedAnnualReturn > 0) {
    const now = new Date();
    const deadline = new Date(goal.deadline);
    const yearsUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    if (yearsUntilDeadline > 0) {
      futureValue = calculateFutureValue(amountAdded, 0, assumedAnnualReturn, yearsUntilDeadline);
    }
  }
  
  return {
    goalId: goal.id,
    goalName: goal.name,
    progressChangePct: Math.round(progressChangePct * 10) / 10, // Round to 1 decimal
    timeToGoalBefore,
    timeToGoalAfter,
    timeSaved: Math.max(0, timeSaved),
    futureValue,
  };
}

// ============================================================================
// CONSTRAINT VALIDATION
// ============================================================================

/**
 * Check if an action violates any user-defined guardrails
 * 
 * @param state - User's financial profile
 * @param accountsAfter - Projected account balances after action
 * @returns Array of violation messages (empty if no violations)
 */
export function checkConstraintViolations(
  state: UserProfile,
  accountsAfter: Accounts
): string[] {
  const violations: string[] = [];
  
  for (const guardrail of state.preferences.guardrails) {
    switch (guardrail.type) {
      case 'min_balance': {
        if (guardrail.accountId === 'checking' && guardrail.threshold) {
          if (accountsAfter.checking < guardrail.threshold) {
            violations.push(
              `${guardrail.rule} - Checking balance would be $${accountsAfter.checking.toFixed(2)} (minimum: $${guardrail.threshold})`
            );
          }
        }
        if (guardrail.accountId === 'savings' && guardrail.threshold) {
          if (accountsAfter.savings < guardrail.threshold) {
            violations.push(
              `${guardrail.rule} - Savings balance would be $${accountsAfter.savings.toFixed(2)} (minimum: $${guardrail.threshold})`
            );
          }
        }
        break;
      }
      
      case 'max_investment_pct': {
        const totalAssets = accountsAfter.checking + 
                          accountsAfter.savings + 
                          getInvestmentBalance(accountsAfter.investments.taxable) +
                          getInvestmentBalance(accountsAfter.investments.rothIRA) +
                          getInvestmentBalance(accountsAfter.investments.traditional401k);
        
        const investedAssets = getInvestmentBalance(accountsAfter.investments.taxable) +
                              getInvestmentBalance(accountsAfter.investments.rothIRA) +
                              getInvestmentBalance(accountsAfter.investments.traditional401k);
        
        const investmentPct = investedAssets / totalAssets;
        
        if (guardrail.threshold && investmentPct > guardrail.threshold) {
          violations.push(
            `${guardrail.rule} - Investment allocation would be ${(investmentPct * 100).toFixed(1)}% (maximum: ${(guardrail.threshold * 100).toFixed(1)}%)`
          );
        }
        break;
      }
      
      case 'protected_account': {
        // Check if protected account balance changed
        if (guardrail.accountId === 'savings') {
          if (accountsAfter.savings < state.accounts.savings) {
            violations.push(`${guardrail.rule} - Cannot reduce savings balance`);
          }
        }
        break;
      }
    }
  }
  
  return violations;
}

// ============================================================================
// SIMULATION FUNCTIONS
// ============================================================================

/**
 * Simulate transferring money to savings
 * 
 * @param state - User's current financial state
 * @param amount - Amount to save
 * @param goalId - Optional goal this supports
 * @returns Complete simulation result with both scenarios
 */
export function simulate_save(
  state: UserProfile,
  amount: number,
  goalId?: string
): SimulationResult {
  // Clone accounts for scenario calculations
  const accountsAfterSave = cloneAccounts(state.accounts);
  accountsAfterSave.checking -= amount;
  accountsAfterSave.savings += amount;
  
  // Find the goal if specified
  const goal = goalId ? state.goals.find(g => g.id === goalId) : undefined;
  
  // Calculate goal impacts
  const goalImpacts: GoalImpact[] = [];
  if (goal) {
    const impact = calculateGoalImpact(goal, amount, SAVINGS_RETURN);
    goalImpacts.push(impact);
  }
  
  // Calculate budget impacts (unchanged for save action)
  const budgetImpacts: BudgetImpact[] = state.spendingCategories.map(category => ({
    categoryId: category.id,
    categoryName: category.name,
    percentUsed: (category.currentSpent / category.monthlyBudget) * 100,
    amountRemaining: category.monthlyBudget - category.currentSpent,
    status: calculateBudgetStatus((category.currentSpent / category.monthlyBudget) * 100),
  }));
  
  // Calculate liquidity impact
  const liquidityImpact = calculateLiquidityImpact(
    state.accounts.checking,
    accountsAfterSave.checking,
    state.accounts.savings,
    accountsAfterSave.savings
  );
  
  // Check constraints
  const constraintViolations = checkConstraintViolations(state, accountsAfterSave);
  
  // Build scenario if action is taken
  const scenarioIfDo: Scenario = {
    accountsAfter: accountsAfterSave,
    goalImpacts,
    budgetImpacts,
    liquidityImpact: `${liquidityImpact}. Savings remain fully liquid.`,
    riskImpact: 'No change in risk. Savings are FDIC insured.',
    timelineChanges: goalImpacts
      .filter(impact => impact.timeSaved > 0)
      .map(impact => `${impact.goalName}: Progress increased by ${impact.progressChangePct.toFixed(1)}%`),
  };
  
  // Build scenario if action is NOT taken
  const scenarioIfDont: Scenario = {
    accountsAfter: cloneAccounts(state.accounts),
    goalImpacts: goalImpacts.map(impact => ({
      ...impact,
      progressChangePct: 0,
      timeSaved: 0,
      futureValue: undefined,
    })),
    budgetImpacts,
    liquidityImpact: 'No change to liquid assets.',
    riskImpact: 'No change in risk exposure.',
    timelineChanges: [],
  };
  
  // Build validation result
  const validationResult: ValidationResult = {
    passed: constraintViolations.length === 0,
    constraintViolations,
    contradictions: [],
    uncertaintySources: [
      'Savings account return rate assumed at 4% APY',
    ],
    overallConfidence: constraintViolations.length === 0 ? 'high' : 'low',
  };
  
  const action: FinancialAction = {
    type: 'save',
    amount,
    targetAccountId: 'savings',
    goalId,
  };
  
  return {
    action,
    scenarioIfDo,
    scenarioIfDont,
    confidence: constraintViolations.length === 0 ? 'high' : 'medium',
    reasoning: goal 
      ? `Saving $${amount} will increase ${goal.name} progress by ${goalImpacts[0]?.progressChangePct.toFixed(1)}%. Funds remain liquid and low-risk.`
      : `Saving $${amount} increases emergency reserves. Funds remain liquid and FDIC insured.`,
    validationResult,
  };
}

/**
 * Simulate investing money
 * 
 * @param state - User's current financial state
 * @param amount - Amount to invest
 * @param accountType - Type of investment account
 * @param goalId - Optional goal this supports
 * @param timeHorizon - Years to project growth (default 5)
 * @returns Complete simulation result with both scenarios
 */
export function simulate_invest(
  state: UserProfile,
  amount: number,
  accountType: 'taxable' | 'rothIRA' | 'traditional401k',
  goalId?: string,
  timeHorizon: number = 5
): SimulationResult {
  // Clone accounts for scenario calculations
  const accountsAfterInvest = cloneAccounts(state.accounts);
  accountsAfterInvest.checking -= amount;
  
  // Update investment account balance (handles both number and InvestmentAccount formats)
  const currentAccount = accountsAfterInvest.investments[accountType];
  if (typeof currentAccount === 'number') {
    // Convert to InvestmentAccount format with default allocation
    accountsAfterInvest.investments[accountType] = {
      balance: currentAccount + amount,
      allocation: { stocks: 100, bonds: 0, cash: 0 }, // Default: 100% stocks for new investments
    };
  } else {
    // Update existing InvestmentAccount balance
    currentAccount.balance += amount;
  }
  
  // Find the goal if specified
  const goal = goalId ? state.goals.find(g => g.id === goalId) : undefined;
  
  // Calculate future value with market returns
  const futureValue = calculateFutureValue(amount, 0, DEFAULT_ANNUAL_RETURN, timeHorizon);
  const projectedGain = futureValue - amount;
  
  // Calculate goal impacts
  const goalImpacts: GoalImpact[] = [];
  if (goal) {
    const impact = calculateGoalImpact(goal, amount, DEFAULT_ANNUAL_RETURN);
    goalImpacts.push(impact);
  }
  
  // Calculate budget impacts (unchanged for invest action)
  const budgetImpacts: BudgetImpact[] = state.spendingCategories.map(category => ({
    categoryId: category.id,
    categoryName: category.name,
    percentUsed: (category.currentSpent / category.monthlyBudget) * 100,
    amountRemaining: category.monthlyBudget - category.currentSpent,
    status: calculateBudgetStatus((category.currentSpent / category.monthlyBudget) * 100),
  }));
  
  // Calculate liquidity impact  
  const liquidityImpact = `Moderate decrease in liquidity. Checking reduced by $${amount}. ` +
    `Investment can be sold but may lose short-term value.`;
  
  // Risk impact
  const riskImpact = `Moderate risk increase. $${amount} exposed to market volatility. ` +
    `Projected value in ${timeHorizon} years: $${futureValue.toFixed(2)} ` +
    `(+$${projectedGain.toFixed(2)} at 7% annual return).`;
  
  // Check constraints
  const constraintViolations = checkConstraintViolations(state, accountsAfterInvest);
  
  // Build scenario if action is taken
  const scenarioIfDo: Scenario = {
    accountsAfter: accountsAfterInvest,
    goalImpacts,
    budgetImpacts,
    liquidityImpact,
    riskImpact,
    timelineChanges: [
      `Investment projected to grow to $${futureValue.toFixed(2)} in ${timeHorizon} years`,
      ...goalImpacts
        .filter(impact => impact.timeSaved > 0)
        .map(impact => `${impact.goalName}: Progress increased by ${impact.progressChangePct.toFixed(1)}%`),
    ],
  };
  
  // Build scenario if action is NOT taken (opportunity cost)
  const scenarioIfDont: Scenario = {
    accountsAfter: cloneAccounts(state.accounts),
    goalImpacts: goalImpacts.map(impact => ({
      ...impact,
      progressChangePct: 0,
      timeSaved: 0,
      futureValue: undefined,
    })),
    budgetImpacts,
    liquidityImpact: 'No change to liquidity.',
    riskImpact: `Opportunity cost: Potential $${projectedGain.toFixed(2)} in gains not realized.`,
    timelineChanges: [],
  };
  
  // Build validation result
  const validationResult: ValidationResult = {
    passed: constraintViolations.length === 0,
    constraintViolations,
    contradictions: [],
    uncertaintySources: [
      'Market returns assumed at 7% historical average',
      'Does not account for market volatility or downturns',
      `Projection is for ${timeHorizon} year time horizon`,
    ],
    overallConfidence: constraintViolations.length === 0 ? 'medium' : 'low',
  };
  
  const action: FinancialAction = {
    type: 'invest',
    amount,
    targetAccountId: accountType,
    goalId,
  };
  
  return {
    action,
    scenarioIfDo,
    scenarioIfDont,
    confidence: constraintViolations.length === 0 ? 'medium' : 'low',
    reasoning: goal
      ? `Investing $${amount} supports ${goal.name}. Expected value in ${timeHorizon} years: $${futureValue.toFixed(2)} ` +
        `(+${((projectedGain / amount) * 100).toFixed(1)}% gain). ${state.preferences.riskTolerance === 'conservative' ? 'Consider your conservative risk tolerance.' : 'Aligns with your risk profile.'}`
      : `Investing $${amount} in ${accountType} provides growth potential. ` +
        `Projected value: $${futureValue.toFixed(2)} in ${timeHorizon} years.`,
    validationResult,
  };
}

/**
 * Simulate spending money
 * 
 * @param state - User's current financial state
 * @param amount - Amount to spend
 * @param category - Spending category
 * @returns Complete simulation result with both scenarios
 */
export function simulate_spend(
  state: UserProfile,
  amount: number,
  category: string
): SimulationResult {
  // Clone accounts for scenario calculations
  const accountsAfterSpend = cloneAccounts(state.accounts);
  accountsAfterSpend.checking -= amount;
  
  // Find the spending category
  const spendingCategory = state.spendingCategories.find(c => c.id === category || c.name === category);
  
  // Calculate budget impacts
  const budgetImpacts: BudgetImpact[] = state.spendingCategories.map(cat => {
    if (cat.id === category || cat.name === category) {
      const newSpent = cat.currentSpent + amount;
      const percentUsed = (newSpent / cat.monthlyBudget) * 100;
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        percentUsed,
        amountRemaining: cat.monthlyBudget - newSpent,
        status: calculateBudgetStatus(percentUsed),
      };
    } else {
      const percentUsed = (cat.currentSpent / cat.monthlyBudget) * 100;
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        percentUsed,
        amountRemaining: cat.monthlyBudget - cat.currentSpent,
        status: calculateBudgetStatus(percentUsed),
      };
    }
  });
  
  // Goal impacts (negative - no progress made)
  const goalImpacts: GoalImpact[] = state.goals
    .filter(g => g.priority <= 2) // Only show high-priority goals
    .map(goal => ({
      goalId: goal.id,
      goalName: goal.name,
      progressChangePct: 0,
      timeToGoalBefore: Infinity,
      timeToGoalAfter: Infinity,
      timeSaved: 0,
    }));
  
  // Liquidity impact
  const liquidityImpact = `Checking balance reduced by $${amount}. ` +
    `Remaining: $${accountsAfterSpend.checking.toFixed(2)}.`;
  
  // Risk impact (none for spending)
  const riskImpact = 'No change in investment risk exposure.';
  
  // Check constraints
  const constraintViolations = checkConstraintViolations(state, accountsAfterSpend);
  
  // Find budget status for this category
  const categoryImpact = budgetImpacts.find(bi => bi.categoryId === category || bi.categoryName === category);
  const budgetWarning = categoryImpact && categoryImpact.status === 'over'
    ? `Warning: This exceeds your ${categoryImpact.categoryName} budget by $${Math.abs(categoryImpact.amountRemaining).toFixed(2)}`
    : categoryImpact && categoryImpact.status === 'warning'
    ? `Caution: This uses ${categoryImpact.percentUsed.toFixed(1)}% of your ${categoryImpact.categoryName} budget`
    : '';
  
  // Build scenario if action is taken
  const scenarioIfDo: Scenario = {
    accountsAfter: accountsAfterSpend,
    goalImpacts,
    budgetImpacts,
    liquidityImpact,
    riskImpact,
    timelineChanges: budgetWarning ? [budgetWarning] : [],
  };
  
  // Build scenario if action is NOT taken (opportunity cost - could save/invest instead)
  const potentialSavingsGrowth = calculateFutureValue(amount, 0, DEFAULT_ANNUAL_RETURN, 5);
  const scenarioIfDont: Scenario = {
    accountsAfter: cloneAccounts(state.accounts),
    goalImpacts: goalImpacts.map(impact => ({ ...impact })),
    budgetImpacts: state.spendingCategories.map(cat => {
      const percentUsed = (cat.currentSpent / cat.monthlyBudget) * 100;
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        percentUsed,
        amountRemaining: cat.monthlyBudget - cat.currentSpent,
        status: calculateBudgetStatus(percentUsed),
      };
    }),
    liquidityImpact: 'No change to checking balance.',
    riskImpact: `Opportunity: $${amount} could be saved or invested instead. ` +
      `If invested, potential value in 5 years: $${potentialSavingsGrowth.toFixed(2)}.`,
    timelineChanges: [],
  };
  
  // Build validation result
  const validationResult: ValidationResult = {
    passed: constraintViolations.length === 0,
    constraintViolations,
    contradictions: categoryImpact && categoryImpact.status === 'over' 
      ? [`Spending exceeds ${categoryImpact.categoryName} budget`]
      : [],
    uncertaintySources: [],
    overallConfidence: constraintViolations.length === 0 && (!categoryImpact || categoryImpact.status !== 'over') 
      ? 'high' 
      : 'medium',
  };
  
  const action: FinancialAction = {
    type: 'spend',
    amount,
    category,
  };
  
  return {
    action,
    scenarioIfDo,
    scenarioIfDont,
    confidence: validationResult.overallConfidence,
    reasoning: spendingCategory
      ? `Spending $${amount} on ${spendingCategory.name}. ${budgetWarning || `Within budget (${categoryImpact?.percentUsed.toFixed(1)}% used).`} ` +
        `Opportunity cost: Could grow to $${potentialSavingsGrowth.toFixed(2)} if invested instead.`
      : `Spending $${amount}. Consider saving or investing for long-term goals instead.`,
    validationResult,
  };
}

/**
 * Compare multiple financial action options side-by-side
 * 
 * @param state - User's current financial state
 * @param options - Array of financial actions to compare
 * @returns Array of simulation results for each option
 */
export function compare_options(
  state: UserProfile,
  options: FinancialAction[]
): SimulationResult[] {
  return options.map(option => {
    switch (option.type) {
      case 'save':
        return simulate_save(state, option.amount, option.goalId);
      
      case 'invest':
        return simulate_invest(
          state,
          option.amount,
          (option.targetAccountId as 'taxable' | 'rothIRA' | 'traditional401k') || 'taxable',
          option.goalId
        );
      
      case 'spend':
        return simulate_spend(state, option.amount, option.category || 'Miscellaneous');
      
      default:
        throw new Error(`Unknown action type: ${(option as any).type}`);
    }
  });
}
