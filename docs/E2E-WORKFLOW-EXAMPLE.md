# End-to-end workflow: example queries and output

## What the tests verify

- **Agents work together**: All 4 agents (Budgeting, Investment, Guardrail, Validation) run; the Validation agent uses the other agents’ outputs; if the Guardrail blocks, `shouldProceed` is false; consensus counts are consistent.
- **Agents provide a response**: `finalRecommendation` is present and non-empty; structured outputs pass Zod schemas; `overallConfidence` and `shouldProceed` are valid.

See the header of `scripts/test-agents.ts` for the full checklist.

## Run the E2E demo

```bash
npm run demo:e2e
```

- With **OPEN_AI_API_KEY** or **GOOGLE_API_KEY** set: uses the real LLM (OpenAI or Gemini).
- With **no** API key: uses the mock orchestrator (no API calls).

## Example input queries (and what you see)

The demo runs three example “queries” (each is an action + user context). For each, you see **INPUT** (query + action) and **OUTPUT** (all agent analyses and the final recommendation).

### 1. Save $100 to emergency fund

**INPUT**

- Query: *Should I save $100 to my emergency fund?*
- Action: `save` $100 → goal `goal_emergency`

**OUTPUT (example)**

- Budgeting Agent: e.g. `approve` or `approve_with_caution` (confidence %)
- Investment Agent: e.g. `approve_with_caution` or `not_recommended`
- Guardrail Agent: PASS (violated: false)
- Validation Agent: e.g. `proceed_with_caution` | confidence: medium | consensus: moderate
- **Final recommendation**: A paragraph summarizing whether to proceed and why.
- **Decision**: PROCEED or DO NOT PROCEED | Overall confidence | Time (s)

---

### 2. Invest $500 for house goal

**INPUT**

- Query: *Can I invest $500 in my taxable account for my house down payment goal?*
- Action: `invest` $500, account `taxable`, goal `goal_house`

**OUTPUT (example)**

- Budgeting / Investment / Guardrail / Validation agents each give recommendation and reasoning.
- **Final recommendation**: Summary and decision (PROCEED / DO NOT PROCEED).

---

### 3. Save $2,500 (guardrail blocks)

**INPUT**

- Query: *I want to save $2,500 to my emergency fund. (This drops checking below $1,000 – guardrail should block.)*
- Action: `save` $2500 → goal `goal_emergency`

**OUTPUT (example)**

- Guardrail Agent: **BLOCKED** (violated: true) — e.g. “Never let checking drop below $1,000”.
- Validation Agent: `do_not_proceed`.
- **Decision**: **DO NOT PROCEED** (guardrail overrides other agents).

---

## Quick reference

| Command            | What it does                                                                 |
|--------------------|-------------------------------------------------------------------------------|
| `npm run test:agents` | Full agent tests: architecture, API key, LLM connectivity, mock + live run, contract checks. |
| `npm run demo:e2e`    | E2E demo: 3 example queries → full INPUT/OUTPUT for each.                    |
| `npm run demo:agents:mock` | Single mock run (invest $500) with detailed agent output.                 |
