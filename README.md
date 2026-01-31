# Finance Bot - Financial Decision Platform

An intelligent financial decision simulation system that shows users what happens if they save, invest, or spend money.

## 🏗️ Project Structure

```
finance-bot/
├── types/
│   ├── financial.ts      # Core type definitions
│   ├── sample-data.ts    # Detailed sample (Sarah Chen)
│   └── index.ts          # Clean exports
├── lib/
│   ├── sample-data.ts    # Simplified demo data (Sarah)
│   ├── usage-example.ts  # Usage demonstrations
│   └── README.md         # Library documentation
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## 📊 Type System Overview

The foundation of this platform is built on comprehensive TypeScript types that model the complete financial state and simulation system.

### Core Types

#### 1. **User & Accounts**
- `UserProfile` - Complete user financial profile
- `Accounts` - Account balances (checking, savings, investments)
- `InvestmentAccounts` - Breakdown of investment accounts

#### 2. **Expenses & Transactions**
- `FixedExpense` - Recurring fixed expenses (rent, loans, etc.)
- `SpendingCategory` - Discretionary spending with budget tracking
- `Transaction` - Individual financial transactions

#### 3. **Financial Goals**
- `FinancialGoal` - User-defined goals with progress tracking
- Time horizons: short (<2yr), medium (2-5yr), long (5yr+)
- Priority levels 1-5 (1 = highest)

#### 4. **Preferences & Safety**
- `UserPreferences` - Risk tolerance and liquidity preferences
- `Guardrail` - User-defined financial safety constraints

#### 5. **Actions & Simulations**
- `FinancialAction` - Potential actions (save, invest, spend)
- `SimulationResult` - Complete what-if analysis
- `Scenario` - Projected outcome of an action
- `GoalImpact` - How an action affects each goal
- `BudgetImpact` - How an action affects budgets
- `ValidationResult` - Constraint checking and confidence

#### 6. **Agent System**
- `AgentOutput` - Analysis output from individual agents

## 🎯 Sample Data: Sarah

The `sample-data.ts` file includes a realistic example user:

**Sarah Chen** - 28-year-old software engineer
- **Income**: $5,416/month (after-tax)
- **Assets**: $54,100 total
  - Checking: $3,200
  - Savings: $8,500
  - Investments: $42,400 (Roth IRA, 401k, taxable)
- **Fixed Expenses**: $2,500/month (rent, car, insurance, etc.)
- **Goals**:
  1. Emergency Fund ($15k target)
  2. House Down Payment ($60k target)
  3. Retirement ($1M target)
  4. Europe Trip ($5k target)

### Sample Simulation: Invest $500 in Roth IRA

The sample includes a complete simulation showing:
- **Before/After** account balances
- **Goal impacts** with timeline changes
- **Budget status** across categories
- **Liquidity & risk** analysis
- **Validation** with confidence scoring

## 🚀 Getting Started

### Install Dependencies

```bash
npm install
```

### Type Check

```bash
npm run type-check
```

### Build

```bash
npm run build
```

## 🔧 Usage Examples

### Import Types

```typescript
import type {
  UserProfile,
  FinancialAction,
  SimulationResult,
} from './types/financial';
```

### Use Sample Data

```typescript
import { sampleUserSarah, sampleSimulationResult } from './types/sample-data';

console.log(`User: ${sampleUserSarah.name}`);
console.log(`Monthly Income: $${sampleUserSarah.monthlyIncome}`);
console.log(`Total Assets: $${
  sampleUserSarah.accounts.checking +
  sampleUserSarah.accounts.savings +
  Object.values(sampleUserSarah.accounts.investments).reduce((a, b) => a + b, 0)
}`);
```

## 📋 Next Steps

With the type system in place, the next chunks will build:

1. **Simulation Engine** - Calculate financial outcomes
2. **Agent System** - Multi-agent analysis framework
3. **Validation Engine** - Constraint checking and confidence scoring
4. **API Layer** - REST/GraphQL endpoints
5. **Frontend** - User interface for comparisons

## 🎓 Type Design Principles

1. **Comprehensive** - Captures all aspects of financial state
2. **Composable** - Types build on each other logically
3. **Practical** - Designed for real-world usage patterns
4. **Type-Safe** - Leverages TypeScript's full type system
5. **Documented** - JSDoc comments on every interface
6. **Validated** - Sample data proves usability

## 📝 License

MIT

---

Built for hackathon financial decision platform 🚀
