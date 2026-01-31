# Financial Type System - Visual Overview

## 📊 Type Hierarchy

```
FinancialState
└── UserProfile
    ├── id: string
    ├── name: string
    ├── monthlyIncome: number
    ├── accounts: Accounts
    │   ├── checking: number
    │   ├── savings: number
    │   └── investments: InvestmentAccounts
    │       ├── taxable: number
    │       ├── rothIRA: number
    │       └── traditional401k: number
    ├── fixedExpenses: FixedExpense[]
    │   ├── id: string
    │   ├── name: string
    │   ├── amount: number
    │   ├── frequency: 'monthly' | 'annual'
    │   └── dueDay?: number
    ├── spendingCategories: SpendingCategory[]
    │   ├── id: string
    │   ├── name: string
    │   ├── monthlyBudget: number
    │   ├── currentSpent: number
    │   └── transactions: Transaction[]
    │       ├── id: string
    │       ├── date: Date
    │       ├── amount: number
    │       ├── category: string
    │       ├── description: string
    │       └── type: 'expense' | 'income' | 'transfer'
    ├── goals: FinancialGoal[]
    │   ├── id: string
    │   ├── name: string
    │   ├── targetAmount: number
    │   ├── currentAmount: number
    │   ├── deadline: Date
    │   ├── priority: number (1-5)
    │   ├── timeHorizon: 'short' | 'medium' | 'long'
    │   └── linkedAccountIds: string[]
    ├── preferences: UserPreferences
    │   ├── riskTolerance: 'conservative' | 'moderate' | 'aggressive'
    │   ├── liquidityPreference: 'high' | 'medium' | 'low'
    │   └── guardrails: Guardrail[]
    │       ├── id: string
    │       ├── rule: string
    │       ├── type: 'min_balance' | 'max_investment_pct' | 'protected_account'
    │       ├── accountId?: string
    │       └── threshold?: number
    ├── createdAt: Date
    └── updatedAt: Date
```

## 🔮 Simulation Flow

```
FinancialAction
├── type: 'save' | 'invest' | 'spend'
├── amount: number
├── targetAccountId?: string
├── goalId?: string
└── category?: string
    ↓
SimulationResult
├── action: FinancialAction
├── scenarioIfDo: Scenario ←─────┐
├── scenarioIfDont: Scenario ←───┤
├── confidence: 'high' | 'medium' | 'low'
├── reasoning: string
└── validationResult: ValidationResult
```

## 📈 Scenario Structure

```
Scenario
├── accountsAfter: Accounts
├── goalImpacts: GoalImpact[]
│   ├── goalId: string
│   ├── goalName: string
│   ├── progressChangePct: number
│   ├── timeToGoalBefore: number
│   ├── timeToGoalAfter: number
│   ├── timeSaved: number
│   └── futureValue?: number
├── budgetImpacts: BudgetImpact[]
│   ├── categoryId: string
│   ├── categoryName: string
│   ├── percentUsed: number
│   ├── amountRemaining: number
│   └── status: 'under' | 'good' | 'warning' | 'over'
├── liquidityImpact: string
├── riskImpact: string
└── timelineChanges: string[]
```

## ✅ Validation System

```
ValidationResult
├── passed: boolean
├── constraintViolations: string[]
│   └── Checks Guardrails:
│       ├── min_balance (e.g., "Keep checking above $1,000")
│       ├── max_investment_pct (e.g., "Max 30% of liquid assets")
│       └── protected_account (e.g., "Don't touch emergency fund")
├── contradictions: string[]
│   └── Logical conflicts (e.g., "High-risk action with conservative profile")
├── uncertaintySources: string[]
│   └── Sources of variance (e.g., "Market returns assumed at 7%")
├── overallConfidence: 'high' | 'medium' | 'low'
└── alternativeIfUncertain?: string
```

## 🤖 Agent System Integration

```
AgentOutput
├── agentName: string (e.g., "Goal Priority Agent", "Risk Analysis Agent")
├── recommendation: string
├── confidence: number (0-1)
├── reasoning: string
├── flags: string[] (warnings)
└── data?: Record<string, any> (agent-specific payload)
```

## 🎯 Real Example: Sarah's Profile

```
Sarah Chen (age 28, software engineer)
├── Monthly Income: $5,416 (after-tax)
├── Total Assets: $54,100
│   ├── Checking: $3,200
│   ├── Savings: $8,500
│   └── Investments: $42,400
│       ├── Taxable: $2,400
│       ├── Roth IRA: $12,000
│       └── 401(k): $28,000
├── Fixed Expenses: $2,500/month
│   ├── Rent: $1,850
│   ├── Car Payment: $320
│   ├── Insurance: $145
│   ├── Utilities: $120
│   └── Phone: $65
├── Discretionary Budget: $1,150/month
│   ├── Groceries: $400 (71.9% used)
│   ├── Dining: $300 (59.5% used)
│   ├── Entertainment: $150 (60.0% used)
│   ├── Fitness: $100 (79.0% used)
│   └── Shopping: $200 (67.3% used)
└── Goals (4 active)
    ├── 1. Emergency Fund: $8,500 / $15,000 (56.7%) - SHORT
    ├── 2. House Down Payment: $14,400 / $60,000 (24.0%) - LONG
    ├── 3. Retirement: $40,000 / $1,000,000 (4.0%) - LONG
    └── 4. Europe Trip: $1,200 / $5,000 (24.0%) - SHORT
```

## 💡 Example Simulation: Invest $500 in Roth IRA

```
ACTION: Invest $500 → Roth IRA (supporting Retirement goal)

SCENARIO IF DO:
├── Checking: $3,200 → $2,700 (-$500)
├── Roth IRA: $12,000 → $12,500 (+$500)
├── Goal Impact (Retirement):
│   ├── Progress: +0.05%
│   ├── Timeline: 420 months → 417 months
│   ├── Time Saved: 3 months
│   └── Future Value: $3,847 (at 7% for 35 years)
├── Liquidity: Moderate decrease, checking above minimum
├── Risk: Slight increase, 8.5% of liquid assets
└── Validation: ✅ PASSED (no guardrail violations)

SCENARIO IF DON'T:
├── All accounts: No change
├── Goals: No progress change
└── Opportunity Cost: Potential $3,347 growth lost

RECOMMENDATION: ✅ Invest
├── Confidence: HIGH
├── Reasoning: Strong tax advantage, healthy liquidity, goal-aligned
└── Constraints: All guardrails satisfied
```

## 📐 Type Safety Guarantees

The type system ensures:

1. **No Missing Data**: All required fields must be present
2. **Type Correctness**: Numbers can't be strings, dates are proper Date objects
3. **Enum Safety**: Status values limited to valid options only
4. **Referential Integrity**: goalId must reference an actual goal
5. **Logical Consistency**: Amounts are numbers, percentages in proper range
6. **Future-Proof**: Easy to extend with new account types, goal types, etc.

## 🚀 Next Steps

With types in place, we can build:

1. **Simulation Engine** - Calculate scenarios deterministically
2. **Validation Engine** - Check guardrails and constraints
3. **Agent System** - Multi-agent analysis framework
4. **Frontend Components** - UI for comparisons
5. **API Layer** - REST/GraphQL endpoints

All using these strongly-typed interfaces! 🎉
