# Quick Start Guide

## Setup (2 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Set your Google API key (get one at https://aistudio.google.com/apikey)
export GOOGLE_API_KEY=your_key_here

# 3. Build the project
npm run build
```

## Run the Demo

```bash
npm run demo:agents
```

This will:
1. Load Sarah Chen (demo user with $28k in assets)
2. Simulate investing $500 in taxable account for house goal
3. Run 4 AI agents via Google Gemini:
   - Budgeting Agent (cash flow analysis)
   - Investment Agent (goal alignment)
   - Guardrail Agent (compliance check)
   - Validation Agent (meta-analysis)
4. Display complete analysis with final recommendation

**Expected runtime:** 10-15 seconds (4 Gemini calls)

## What You'll See

```
🤖 LangChain Multi-Agent Financial Analysis Demo
================================================

📊 Analyzing action for Sarah Chen:
   Action: INVEST $500
   Account: taxable
   Goal: House Down Payment

🚀 Launching LangChain multi-agent system...

[Orchestrator] Starting multi-agent analysis...
[Budgeting Agent] Starting analysis...
[Investment Agent] Starting analysis...
[Guardrail Agent] Starting analysis...

[Orchestrator] Phase 1 complete. Agent results:
  ✓ Budgeting: approve (confidence: 75%)
  ✓ Investment: approve (confidence: 85%)
  ✓ Guardrail: PASS ✓

[Validation Agent] Starting analysis...

[Orchestrator] Phase 2 complete.
  ✓ Final recommendation: proceed
  ✓ Confidence: high
  ✓ Consensus: strong

[Orchestrator] ✅ Complete in 12.45s

═══════════════════════════════════════════════
                 ANALYSIS RESULTS
═══════════════════════════════════════════════

📋 BUDGETING AGENT:
(detailed cash flow analysis)

📈 INVESTMENT AGENT:
(detailed goal alignment analysis)

🛡️ GUARDRAIL AGENT:
(compliance check results)

✅ VALIDATION AGENT:
(meta-analysis & final recommendation)

🎯 FINAL RECOMMENDATION:
Decision: ✅ PROCEED
```

## Run Tests

```bash
npm run test
```

Tests the simulation engine (no API key needed).

## File Structure

```
lib/
├── simulation-engine.ts          # Pure calculation functions
├── demo-users.ts                 # 3 realistic user personas
└── agents/                       # LangChain multi-agent system
    ├── schemas.ts                # Zod output schemas
    ├── langchain-base.ts         # Base agent class
    ├── langchain-budgeting-agent.ts
    ├── langchain-investment-agent.ts
    ├── langchain-guardrail-agent.ts
    ├── langchain-validation-agent.ts
    └── langchain-orchestrator.ts # Coordinates agents
```

## Documentation

- `README.md` - Overview
- `PROJECT-SUMMARY.md` - Complete system documentation
- `LANGCHAIN-AGENTS.md` - Detailed agent architecture
- `SIMULATION-COMPLETE.md` - Simulation engine reference

## Troubleshooting

**"GOOGLE_API_KEY environment variable is required"**
→ Get a key at https://aistudio.google.com/apikey then: `export GOOGLE_API_KEY=your_key_here`

**"Cannot find module"**
→ Run `npm install` and `npm run build`

**Demo takes too long**
→ Normal! 4 Gemini calls take 10-15 seconds total

## What's Impressive

This isn't just a GPT wrapper. It's a production-grade multi-agent system:

✅ **4 specialized LLM instances** with unique roles and temperatures
✅ **Structured outputs** validated by Zod schemas  
✅ **Parallel execution** (Phase 1 agents run concurrently)
✅ **Meta-validation** (Phase 2 agent reviews all others)
✅ **Contradiction detection** between agent recommendations
✅ **Consensus measurement** across agents
✅ **Production-grade** error handling and logging

**This demonstrates deep AI engineering skills!** 🚀
