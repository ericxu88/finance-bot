# Finance Bot - Financial Decision Platform

An intelligent financial decision simulation system that shows users what happens if they save, invest, or spend money.

## 🏗️ Project Structure

```
finance-bot/
├── types/
│   ├── financial.ts      # Core type definitions (18 interfaces)
│   ├── sample-data.ts    # Detailed sample (Sarah Chen)
│   └── index.ts          # Clean exports
├── lib/
│   ├── sample-data.ts         # Simplified demo data (Sarah)
│   ├── simulation-engine.ts   # Core simulation functions ⭐ NEW
│   ├── usage-example.ts       # Usage demonstrations
│   ├── simulation-demo.ts     # Interactive simulation demo ⭐ NEW
│   ├── __tests__/
│   │   └── simulation-engine.test.ts  # Test suite ⭐ NEW
│   ├── README.md              # Library documentation
│   └── SIMULATION-ENGINE.md   # Simulation docs ⭐ NEW
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

### Environment Setup

```bash
# Copy example env file
cp .env.example .env

# Add your Google API key (get one at https://aistudio.google.com/apikey)
export GOOGLE_API_KEY=your_key_here
```

### Type Check

```bash
npm run type-check
```

### Build

```bash
npm run build
```

### Run All Tests

```bash
npm run test
```

This builds the project and runs the full backend unit test suite:

- **user-state-store** – get, set, getOrCreate, has, delete
- **audit-log** – appendExecutedAction, getHistory, getRecordById, getLastRecord, removeLastRecord
- **apply-action** – apply_action for save/invest/spend, no mutation, correct outputs
- **execute API** – POST /execute, GET /user/:id, GET /user/:id/history, POST /undo, GET/POST /freeze
- **simulation-engine** – simulate_save, simulate_invest, compare_options, constraints

The execute-api test starts the app on a random port (requires network permission in restricted environments).

### Run LangChain Multi-Agent Demo

```bash
npm run demo:agents
```

Runs a complete multi-agent analysis using Google Gemini via LangChain. Requires `GOOGLE_API_KEY`.

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

## 🔒 Permission & Safety (Confirm Before Execute)

**The system asks the user for permission before doing anything.** No financial action is applied automatically.

- **Simulate** (`POST /simulate`, `POST /compare`, chat) – All return recommendations and projected outcomes only. No state is changed.
- **Execute** (`POST /execute`) – State is updated **only** when the client explicitly calls this endpoint after the user has confirmed (e.g. clicked an "Execute: Save $500" button). The backend never applies an action without an explicit execute request.

**Contract:** Actions are applied only after user confirmation via the Execute flow. The frontend (or any client) must call `POST /execute` with the chosen action only after the user has confirmed; the API does not auto-apply any recommendation.

## 📋 Project Scope

This repo includes a backend API and (optionally) a frontend: types, simulation engine, demo data, LangChain multi-agent system, state store, audit log, and HTTP server.

### Key Components

1. **Type System** (`/types/`) - 18 comprehensive TypeScript interfaces
2. **Simulation Engine** (`/lib/simulation-engine.ts`) - Pure functions for financial calculations
3. **Demo Data** (`/lib/demo-users.ts`) - 3 realistic user personas with transaction history
4. **LangChain Agents** (`/lib/agents/`) - Multi-agent AI system with Google Gemini
   - Budgeting Agent - Cash flow & liquidity analysis
   - Investment Agent - Goal alignment & risk assessment
   - Guardrail Agent - Compliance checking
   - Validation Agent - Meta-analysis & consensus

---

## 🤖 Multi-Agent Architecture

See **`LANGCHAIN-AGENTS.md`** for complete documentation.

The LangChain multi-agent system provides AI-powered financial decision analysis:

```
User Action → Simulation → Multi-Agent Analysis → Recommendation
                              ↓
                    ┌─────────┬─────────┬──────────┐
                    │Budgeting│Investment│Guardrail│
                    │  Agent  │  Agent   │  Agent  │
                    └─────────┴─────────┴──────────┘
                              ↓
                         Validation
                            Agent
                              ↓
                    Final Recommendation
```

**Features:**
- Structured outputs via Zod schemas
- Parallel agent execution
- Contradiction detection
- Data quality assessment
- Production-grade error handling

**Run demo:** `npm run demo:agents`

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
