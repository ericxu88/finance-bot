/**
 * LangChain Guardrail Agent
 * 
 * Enforces user-defined constraints and identifies violations
 */

import { LangChainBaseAgent, type AgentContext } from './langchain-base.js';
import { GuardrailAnalysisSchema } from './schemas.js';

export class LangChainGuardrailAgent extends LangChainBaseAgent<typeof GuardrailAnalysisSchema> {
  readonly agentName = 'Guardrail Agent';
  readonly schema = GuardrailAnalysisSchema;
  readonly temperature = 0.0; // Deterministic for rule checking

  readonly systemPrompt = `You are a strict compliance and risk management agent for personal finance.

Your role is to enforce user-defined constraints and identify violations.

Key responsibilities:
1. Check ALL user-defined guardrails against the proposed action
2. Identify violations with precise details
3. Assess severity of each violation
4. Determine if action can proceed or must be blocked
5. Suggest adjustments to comply with rules

Guidelines:
- Be strict - guardrails exist for a reason
- Clearly state what rule was violated and by how much
- Differentiate between hard blocks (critical violations) and warnings (approaching limits)
- Provide specific suggestions for how to modify the action to comply
- Use exact numbers from the simulation

Critical violations that BLOCK:
- Any action that violates a "never" rule (e.g., "never let checking drop below X")
- Protected account modifications
- Exceeding maximum thresholds

Warnings (don't block but flag):
- Approaching limits (within 10% of threshold)
- Patterns that might lead to future violations

Output your analysis in the specified JSON format with complete violation details.`;

  protected buildAnalysisPrompt(context: AgentContext): string {
    const { user, action, simulationResult } = context;

    const accountsAfter = simulationResult.scenarioIfDo.accountsAfter;
    const accountsBefore = user.accounts;

    return `
GUARDRAIL COMPLIANCE CHECK

USER-DEFINED RULES:
${user.preferences.guardrails.map((g, i) => `
${i + 1}. ${g.rule}
   Type: ${g.type}
   ${g.accountId ? `Account: ${g.accountId}` : ''}
   ${g.threshold !== undefined ? `Threshold: ${typeof g.threshold === 'number' ? this.formatCurrency(g.threshold) : g.threshold}` : ''}
`).join('\n')}

ACCOUNT BALANCES:
Before Action:
- Checking: ${this.formatCurrency(accountsBefore.checking)}
- Savings: ${this.formatCurrency(accountsBefore.savings)}
- Taxable Investments: ${this.formatCurrency(accountsBefore.investments.taxable)}
- Roth IRA: ${this.formatCurrency(accountsBefore.investments.rothIRA)}
- 401(k): ${this.formatCurrency(accountsBefore.investments.traditional401k)}

After Action:
- Checking: ${this.formatCurrency(accountsAfter.checking)} ${this.delta(accountsBefore.checking, accountsAfter.checking)}
- Savings: ${this.formatCurrency(accountsAfter.savings)} ${this.delta(accountsBefore.savings, accountsAfter.savings)}
- Taxable Investments: ${this.formatCurrency(accountsAfter.investments.taxable)} ${this.delta(accountsBefore.investments.taxable, accountsAfter.investments.taxable)}
- Roth IRA: ${this.formatCurrency(accountsAfter.investments.rothIRA)} ${this.delta(accountsBefore.investments.rothIRA, accountsAfter.investments.rothIRA)}
- 401(k): ${this.formatCurrency(accountsAfter.investments.traditional401k)} ${this.delta(accountsBefore.investments.traditional401k, accountsAfter.investments.traditional401k)}

PROPOSED ACTION:
${action.type.toUpperCase()} ${this.formatCurrency(action.amount)}

YOUR TASK:
For EACH guardrail rule:
1. Check if it would be violated after this action
2. If violated:
   - Describe the violation precisely
   - State current value vs. threshold
   - Assign severity (critical/high/medium/low)
   - Suggest how to adjust the action to comply
3. Also check for warnings (getting close to limits)

Determine:
- violated: true if ANY rule is broken
- can_proceed: false if ANY critical/high severity violations exist
- List ALL violations and warnings found

Be thorough and precise.
    `.trim();
  }

  private delta(before: number, after: number): string {
    const diff = after - before;
    if (diff === 0) return '(no change)';
    const sign = diff > 0 ? '+' : '';
    return `(${sign}${this.formatCurrency(diff)})`;
  }
}
