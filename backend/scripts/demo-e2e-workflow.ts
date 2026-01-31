/**
 * End-to-end workflow demo: example input queries → full agent output
 *
 * Runs 3 example "queries" (actions) through the orchestrator and prints
 * INPUT (query + action) and full OUTPUT (all agent analyses, final recommendation).
 *
 * Uses real LLM if OPEN_AI_API_KEY or OPENAI_API_KEY is set; otherwise mock (no API).
 *
 * Usage: npm run build && npm run demo:e2e
 */

import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { sampleUser } from '../lib/sample-data.js';
import { simulate_save, simulate_invest } from '../lib/simulation-engine.js';
import type { AgentContext } from '../lib/agents/langchain-base.js';
import type { FinancialAction } from '../types/financial.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// When run as dist/scripts/demo-e2e-workflow.js, __dirname is dist/scripts → go up twice for project root
const ROOT = join(__dirname, '..', '..');

function loadEnv(): void {
  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}
loadEnv();

const historicalMetrics = {
  monthsOfData: 4,
  avgMonthlySpending: 2500,
  spendingVariance: 0.15,
  transactionCount: 120,
  categoryBreakdown: {} as Record<string, number>,
};

function buildContext(action: FinancialAction): AgentContext {
  const simulationResult =
    action.type === 'save'
      ? simulate_save(sampleUser, action.amount, action.goalId)
      : action.type === 'invest'
        ? simulate_invest(
            sampleUser,
            action.amount,
            (action.targetAccountId as 'taxable' | 'rothIRA' | 'traditional401k') ?? 'taxable',
            action.goalId,
            5
          )
        : (() => {
            throw new Error('Only save and invest actions supported in this demo');
          })();
  return {
    user: sampleUser,
    action,
    simulationResult,
    historicalMetrics,
  };
}

function formatOutput(result: {
  budgetingAnalysis: { recommendation: string; confidence: number; reasoning?: string; key_findings?: string[] };
  investmentAnalysis: { recommendation: string; confidence?: number; reasoning?: string; key_findings?: string[] };
  guardrailAnalysis: { can_proceed: boolean; violated: boolean; violations?: unknown[] };
  validationAnalysis: { overall_recommendation: string; overall_confidence: string; final_summary: string; agent_consensus?: { consensus_level: string } };
  finalRecommendation: string;
  shouldProceed: boolean;
  overallConfidence: string;
  executionTime: number;
}): string {
  const lines: string[] = [];
  lines.push('  Budgeting Agent:  ' + result.budgetingAnalysis.recommendation + ' (confidence: ' + Math.round((result.budgetingAnalysis.confidence ?? 0) * 100) + '%)');
  if (result.budgetingAnalysis.reasoning) lines.push('    Reasoning: ' + result.budgetingAnalysis.reasoning.slice(0, 200) + (result.budgetingAnalysis.reasoning.length > 200 ? '...' : ''));
  lines.push('  Investment Agent: ' + result.investmentAnalysis.recommendation + (result.investmentAnalysis.confidence != null ? ' (confidence: ' + Math.round(result.investmentAnalysis.confidence * 100) + '%)' : ''));
  if (result.investmentAnalysis.reasoning) lines.push('    Reasoning: ' + result.investmentAnalysis.reasoning.slice(0, 200) + (result.investmentAnalysis.reasoning.length > 200 ? '...' : ''));
  lines.push('  Guardrail Agent: ' + (result.guardrailAnalysis.can_proceed ? 'PASS' : 'BLOCKED') + ' (violated: ' + result.guardrailAnalysis.violated + ')');
  const decision = (result as { finalDecision?: string }).finalDecision ?? (result.shouldProceed ? 'proceed' : 'do_not_proceed');
  const consensus = (result as { consensusLevel?: string }).consensusLevel ?? (result.validationAnalysis?.agent_consensus?.consensus_level ?? '');
  lines.push('  Policy decision: ' + decision + (consensus ? ' | Consensus: ' + consensus : ''));
  lines.push('');
  lines.push('  Final recommendation (summary):');
  lines.push('  ' + result.finalRecommendation.split('\n').join('\n  '));
  lines.push('');
  lines.push('  Decision: ' + (result.shouldProceed ? (decision === 'proceed_with_caution' ? 'PROCEED WITH CAUTION' : 'PROCEED') : 'DO NOT PROCEED') + ' | Overall confidence: ' + result.overallConfidence + ' | Time: ' + (result.executionTime / 1000).toFixed(2) + 's');
  return lines.join('\n');
}

async function runOne(
  queryLabel: string,
  action: FinancialAction,
  useRealOrchestrator: boolean
): Promise<void> {
  console.log('\n' + '═'.repeat(80));
  console.log('INPUT (query + action)');
  console.log('═'.repeat(80));
  console.log('  Query: ' + queryLabel);
  console.log('  Action: ' + action.type + ' $' + action.amount + (action.goalId ? ' → goal ' + action.goalId : '') + (action.targetAccountId ? ', account: ' + action.targetAccountId : ''));
  console.log('');

  const context = buildContext(action);

  if (useRealOrchestrator) {
    const { LangChainAgentOrchestrator } = await import('../lib/agents/langchain-orchestrator.js');
    const orchestrator = new (LangChainAgentOrchestrator as new () => { processDecision: (ctx: AgentContext) => Promise<unknown> })();
    const result = (await orchestrator.processDecision(context)) as Parameters<typeof formatOutput>[0];
    console.log('OUTPUT (agents worked together → response)');
    console.log('─'.repeat(80));
    console.log(formatOutput(result));
  } else {
    const { MockAgentOrchestrator } = await import('../lib/agents/mock-orchestrator.js');
    const orchestrator = new (MockAgentOrchestrator as new () => { processDecision: (ctx: unknown) => Promise<unknown> })();
    const result = (await orchestrator.processDecision(context)) as Parameters<typeof formatOutput>[0];
    console.log('OUTPUT (mock – agents worked together → response)');
    console.log('─'.repeat(80));
    console.log(formatOutput(result));
  }
}

async function main(): Promise<void> {
  const openAiKey = process.env.OPEN_AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
  const useReal = !!openAiKey;

  console.log('\n🧪 End-to-end workflow: example queries → full agent output');
  console.log('   Mode: ' + (useReal ? 'LIVE (OpenAI)' : 'MOCK (no API)'));
  console.log('   User: ' + sampleUser.name + ' (income $' + sampleUser.monthlyIncome + '/mo, checking $' + sampleUser.accounts.checking + ')');

  const examples: { query: string; action: FinancialAction }[] = [
    {
      query: 'Should I save $100 to my emergency fund?',
      action: { type: 'save', amount: 100, goalId: 'goal_emergency' },
    },
    {
      query: 'Can I invest $500 in my taxable account for my house down payment goal?',
      action: { type: 'invest', amount: 500, targetAccountId: 'taxable', goalId: 'goal_house' },
    },
    {
      query: 'I want to save $2,500 to my emergency fund. (This drops checking below $1,000 – guardrail should block.)',
      action: { type: 'save', amount: 2500, goalId: 'goal_emergency' },
    },
  ];

  for (const ex of examples) {
    await runOne(ex.query, ex.action, useReal);
  }

  console.log('\n' + '═'.repeat(80));
  console.log('Done. Each example: input query + action → orchestrator ran 4 agents → you see full output.');
  console.log('═'.repeat(80) + '\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
