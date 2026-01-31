/**
 * Financial Types - Main Export
 * 
 * This is the main entry point for importing financial types.
 * Use this for clean imports across the codebase.
 */

// Export all types
export type {
  // User & Accounts
  UserProfile,
  Accounts,
  InvestmentAccounts,
  
  // Expenses & Transactions
  FixedExpense,
  SpendingCategory,
  Transaction,
  
  // Goals
  FinancialGoal,
  
  // Preferences & Safety
  UserPreferences,
  Guardrail,
  
  // Actions
  FinancialAction,
  
  // Simulations
  SimulationResult,
  Scenario,
  GoalImpact,
  BudgetImpact,
  ValidationResult,
  
  // Agents
  AgentOutput,
  
  // Helpers
  ComparisonOption,
  FinancialState,
  
  // Utility Types
  AccountType,
  TimeHorizon,
  RiskTolerance,
  ConfidenceLevel,
  BudgetStatus,
} from './financial';

// Export sample data for testing and demos
export {
  sampleUserSarah,
  sampleAction,
  sampleSimulationResult,
  sampleComparisonOptions,
  sampleFinancialState,
  samples,
} from './sample-data';
