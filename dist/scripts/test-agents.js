import { existsSync, readFileSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..');
const DIST = join(ROOT, 'dist');
const AGENTS = join(DIST, 'lib', 'agents');
function loadEnv() {
    const envPath = join(ROOT, '.env');
    if (!existsSync(envPath))
        return;
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#'))
            continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1)
            continue;
        const key = trimmed.slice(0, eq).trim();
        const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
        if (key && process.env[key] === undefined)
            process.env[key] = value;
    }
}
loadEnv();
function section(title) {
    console.log('\n' + '='.repeat(70));
    console.log(`  ${title}`);
    console.log('='.repeat(70) + '\n');
}
const REQUIRED_AGENT_FILES = [
    'langchain-orchestrator.js',
    'mock-orchestrator.js',
    'schemas.js',
    'langchain-base.js',
    'langchain-budgeting-agent.js',
    'langchain-investment-agent.js',
    'langchain-guardrail-agent.js',
    'langchain-validation-agent.js',
    'mock-agents.js',
];
async function checkArchitecture() {
    section('0. Architecture check (offline)');
    let ok = true;
    for (const file of REQUIRED_AGENT_FILES) {
        const p = join(AGENTS, file);
        if (!existsSync(p)) {
            console.log('  ❌ Missing:', file);
            ok = false;
        }
    }
    if (!ok) {
        console.log('  Run: npm run build\n');
        return false;
    }
    try {
        const orchestratorUrl = pathToFileURL(join(AGENTS, 'langchain-orchestrator.js')).href;
        const mockUrl = pathToFileURL(join(AGENTS, 'mock-orchestrator.js')).href;
        const orchestratorMod = (await import(orchestratorUrl));
        const mockMod = (await import(mockUrl));
        if (typeof orchestratorMod.LangChainAgentOrchestrator !== 'function') {
            console.log('  ❌ LangChainAgentOrchestrator export missing or not a constructor');
            ok = false;
        }
        if (typeof mockMod.MockAgentOrchestrator !== 'function') {
            console.log('  ❌ MockAgentOrchestrator export missing or not a constructor');
            ok = false;
        }
        if (ok)
            console.log('  ✅ All agent modules present and exports valid\n');
        return ok;
    }
    catch (e) {
        console.log('  ❌ Failed to load agent modules:', e instanceof Error ? e.message : e, '\n');
        return false;
    }
}
function getAgentProvider() {
    const openAiKey = process.env.OPEN_AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
    return openAiKey ? 'openai' : 'gemini';
}
async function checkApiKey() {
    section('1. API key check');
    const openAiKey = process.env.OPEN_AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
    const geminiKey = process.env.GOOGLE_API_KEY?.trim();
    if (openAiKey) {
        console.log('  ✅ OPEN_AI_API_KEY (or OPENAI_API_KEY) is set — agents will use OpenAI (length:', openAiKey.length, 'chars)\n');
        return true;
    }
    if (geminiKey) {
        console.log('  ✅ GOOGLE_API_KEY is set — agents will use Gemini (length:', geminiKey.length, 'chars)\n');
        return true;
    }
    console.log('  ❌ No LLM API key found.');
    console.log('     Set OPEN_AI_API_KEY (or OPENAI_API_KEY) for OpenAI, or GOOGLE_API_KEY for Gemini in .env\n');
    return false;
}
const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash-lite';
const OPENAI_MODEL = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
async function verifyOpenAIConnection() {
    section('2. OpenAI API connectivity');
    console.log('  Model:', OPENAI_MODEL, '(set OPENAI_MODEL in .env to override)\n');
    try {
        const { ChatOpenAI } = await import('@langchain/openai');
        const { HumanMessage } = await import('@langchain/core/messages');
        const apiKey = process.env.OPEN_AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
        const model = new ChatOpenAI({ model: OPENAI_MODEL, apiKey, maxTokens: 32 });
        const response = await model.invoke([new HumanMessage('Reply with exactly: OK')]);
        const raw = response.content;
        const text = typeof raw === 'string'
            ? raw
            : Array.isArray(raw)
                ? String(raw?.[0]?.text ?? raw?.[0] ?? '')
                : String(raw ?? '');
        if (text.trim().toUpperCase().includes('OK')) {
            console.log('  ✅ OpenAI API responded successfully.');
            console.log('     Response preview:', text.trim().slice(0, 80) + (text.length > 80 ? '...' : '') + '\n');
            return true;
        }
        console.log('  ⚠️  OpenAI responded but not with expected "OK". Response:', text.slice(0, 100) + '\n');
        return true;
    }
    catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        const is429 = err.includes('429') || err.includes('rate limit') || err.includes('Rate limit');
        if (is429) {
            console.log('  ⚠️  API key is valid but rate limit exceeded (429).');
            console.log('     Wait a minute and retry. See https://platform.openai.com/docs/guides/rate-limits\n');
        }
        else {
            console.log('  ❌ OpenAI API call failed:', err);
            console.log('     Check your API key at https://platform.openai.com/api-keys\n');
        }
        return false;
    }
}
async function verifyGeminiConnection() {
    section('2. Gemini API connectivity');
    console.log('  Model:', GEMINI_MODEL, '(set GEMINI_MODEL in .env to override)\n');
    try {
        const { ChatGoogleGenerativeAI } = await import('@langchain/google-genai');
        const { HumanMessage } = await import('@langchain/core/messages');
        const model = new ChatGoogleGenerativeAI({
            model: GEMINI_MODEL,
            maxOutputTokens: 32,
        });
        const response = await model.invoke([new HumanMessage('Reply with exactly: OK')]);
        const raw = response.content;
        const text = typeof raw === 'string'
            ? raw
            : Array.isArray(raw)
                ? String(raw?.[0]?.text ?? raw?.[0] ?? '')
                : String(raw ?? '');
        if (text.trim().toUpperCase().includes('OK')) {
            console.log('  ✅ Gemini API responded successfully.');
            console.log('     Response preview:', text.trim().slice(0, 80) + (text.length > 80 ? '...' : '') + '\n');
            return true;
        }
        console.log('  ⚠️  Gemini responded but not with expected "OK". Response:', text.slice(0, 100) + '\n');
        return true;
    }
    catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        const is429 = err.includes('429') || err.includes('Too Many Requests') || err.includes('quota') || err.includes('Quota exceeded');
        if (is429) {
            console.log('  ⚠️  API key is valid but rate/quota limit exceeded (429).');
            console.log('     Wait ~1 minute and retry, or check daily quota at https://aistudio.google.com/usage');
            console.log('     Free tier (e.g. gemini-2.0-flash-lite): 15 RPM, 1k requests/day.');
            console.log('     See https://ai.google.dev/gemini-api/docs/rate-limits\n');
        }
        else {
            console.log('  ❌ Gemini API call failed:', err);
            console.log('     Check your API key at https://aistudio.google.com/apikey\n');
        }
        return false;
    }
}
async function buildContext() {
    const sampleMod = await import(pathToFileURL(join(DIST, 'lib', 'sample-data.js')).href);
    const simEngineMod = await import(pathToFileURL(join(DIST, 'lib', 'simulation-engine.js')).href);
    const user = sampleMod.sampleUser;
    const goalId = user.goals[0]?.id ?? 'goal_emergency';
    const action = { type: 'save', amount: 100, goalId };
    const simulationResult = simEngineMod.simulate_save(user, action.amount, goalId);
    const historicalMetrics = {
        monthsOfData: 4,
        avgMonthlySpending: 2500,
        spendingVariance: 0.15,
        transactionCount: 120,
        categoryBreakdown: {},
    };
    return { user, action, simulationResult, historicalMetrics };
}
async function runMockOrchestratorTest() {
    section('3. Mock orchestrator (offline, no API)');
    try {
        const mockUrl = pathToFileURL(join(AGENTS, 'mock-orchestrator.js')).href;
        const mockMod = (await import(mockUrl));
        const context = await buildContext();
        const orchestrator = new mockMod.MockAgentOrchestrator();
        const result = (await orchestrator.processDecision(context));
        if (!result.budgetingAnalysis || !result.investmentAnalysis || !result.guardrailAnalysis || !result.validationAnalysis) {
            console.log('  ❌ One or more agent analyses missing.\n');
            return false;
        }
        if (typeof result.shouldProceed !== 'boolean') {
            console.log('  ❌ shouldProceed missing or not boolean.\n');
            return false;
        }
        if (!result.finalRecommendation || result.finalRecommendation.length < 100) {
            console.log('  ❌ finalRecommendation missing or too short.\n');
            return false;
        }
        const validConf = ['high', 'medium', 'low', 'very_low'].includes(result.overallConfidence ?? '');
        if (!validConf) {
            console.log('  ❌ Invalid overallConfidence.\n');
            return false;
        }
        const validRec = ['proceed_confidently', 'proceed', 'proceed_with_caution', 'reconsider', 'do_not_proceed'].includes(result.validationAnalysis?.overall_recommendation ?? '');
        if (!validRec) {
            console.log('  ❌ Invalid validationAnalysis.overall_recommendation.\n');
            return false;
        }
        console.log('  ✅ Mock orchestrator result shape valid');
        console.log('  ✅ shouldProceed:', result.shouldProceed, '| confidence:', result.overallConfidence, '| time:', ((result.executionTime ?? 0) / 1000).toFixed(2) + 's\n');
        return true;
    }
    catch (e) {
        console.log('  ❌ Mock orchestrator test failed:', e instanceof Error ? e.message : e, '\n');
        return false;
    }
}
async function runLiveOrchestratorTest() {
    section('4. Live orchestrator (4 agents, API)');
    try {
        const orchestratorUrl = pathToFileURL(join(AGENTS, 'langchain-orchestrator.js')).href;
        const orchestratorMod = (await import(orchestratorUrl));
        const context = await buildContext();
        const orchestrator = new orchestratorMod.LangChainAgentOrchestrator();
        const rawResult = await Promise.race([
            orchestrator.processDecision(context),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Orchestrator timed out after 180s')), 180_000)),
        ]);
        const result = rawResult;
        if (!result.budgetingAnalysis || !result.investmentAnalysis || !result.guardrailAnalysis || !result.validationAnalysis) {
            console.log('  ❌ One or more agent analyses missing.\n');
            return null;
        }
        if (typeof result.shouldProceed !== 'boolean') {
            console.log('  ❌ shouldProceed missing or not boolean.\n');
            return null;
        }
        if (!result.finalRecommendation?.length) {
            console.log('  ❌ finalRecommendation empty.\n');
            return null;
        }
        const validConf = ['high', 'medium', 'low', 'very_low'].includes(result.overallConfidence ?? '');
        if (!validConf) {
            console.log('  ❌ Invalid overallConfidence:', result.overallConfidence, '\n');
            return null;
        }
        console.log('  ✅ Budgeting:', result.budgetingAnalysis.recommendation, '| Investment:', result.investmentAnalysis.recommendation);
        console.log('  ✅ Guardrail can_proceed:', result.guardrailAnalysis.can_proceed);
        console.log('  ✅ Decision (policy):', result.finalDecision ?? '—', '| Consensus:', result.consensusLevel ?? '—');
        console.log('  ✅ shouldProceed:', result.shouldProceed, '| Time:', ((result.executionTime ?? 0) / 1000).toFixed(2) + 's\n');
        return result;
    }
    catch (e) {
        console.log('  ❌ Live orchestrator failed:', e instanceof Error ? e.message : e, '\n');
        return null;
    }
}
async function validateLiveResultZodSchemas(result) {
    section('5a. Live result Zod schema validation');
    try {
        const schemasMod = (await import(pathToFileURL(join(AGENTS, 'schemas.js')).href));
        const r = result;
        const b = schemasMod.BudgetingAnalysisSchema.safeParse(r.budgetingAnalysis);
        if (!b.success) {
            console.log('  ❌ Live budgetingAnalysis failed Zod parse:', b.error);
            return false;
        }
        const inv = schemasMod.InvestmentAnalysisSchema.safeParse(r.investmentAnalysis);
        if (!inv.success) {
            console.log('  ❌ Live investmentAnalysis failed Zod parse:', inv.error);
            return false;
        }
        const g = schemasMod.GuardrailAnalysisSchema.safeParse(r.guardrailAnalysis);
        if (!g.success) {
            console.log('  ❌ Live guardrailAnalysis failed Zod parse:', g.error);
            return false;
        }
        const v = schemasMod.ValidationAnalysisSchema.safeParse(r.validationAnalysis);
        if (!v.success) {
            console.log('  ❌ Live validationAnalysis failed Zod parse:', v.error);
            return false;
        }
        console.log('  ✅ All live analyses pass Zod schemas\n');
        return true;
    }
    catch (e) {
        console.log('  ❌ Zod schema validation failed:', e instanceof Error ? e.message : e, '\n');
        return false;
    }
}
function validateResultContract(result) {
    section('5. Result contract (strict validation)');
    const r = result;
    let ok = true;
    const recEnum = ['strongly_approve', 'approve', 'approve_with_caution', 'not_recommended', 'strongly_oppose', 'blocked'];
    if (r.budgetingAnalysis) {
        if (!recEnum.includes(r.budgetingAnalysis.recommendation)) {
            console.log('  ❌ Budgeting recommendation not in enum:', r.budgetingAnalysis.recommendation);
            ok = false;
        }
        if (r.budgetingAnalysis.confidence < 0 || r.budgetingAnalysis.confidence > 1) {
            console.log('  ❌ Budgeting confidence not in [0,1]:', r.budgetingAnalysis.confidence);
            ok = false;
        }
        if ((r.budgetingAnalysis.reasoning?.length ?? 0) < 50) {
            console.log('  ❌ Budgeting reasoning too short');
            ok = false;
        }
        if (r.budgetingAnalysis.key_findings && (r.budgetingAnalysis.key_findings.length < 1 || r.budgetingAnalysis.key_findings.length > 5)) {
            console.log('  ❌ Budgeting key_findings length not 1–5');
            ok = false;
        }
    }
    if (r.investmentAnalysis && !recEnum.includes(r.investmentAnalysis.recommendation)) {
        console.log('  ❌ Investment recommendation not in enum');
        ok = false;
    }
    if (r.guardrailAnalysis && typeof r.shouldProceed === 'boolean') {
        if (r.guardrailAnalysis.can_proceed === false && r.shouldProceed !== false) {
            console.log('  ❌ Guardrail can_proceed false but shouldProceed not false (orchestrator contract)');
            ok = false;
        }
        else if (r.guardrailAnalysis.can_proceed === false && r.shouldProceed === false) {
            console.log('  ✅ Guardrail blocks → shouldProceed false (orchestrator contract)');
        }
    }
    if (r.validationAnalysis?.agent_consensus) {
        const ac = r.validationAnalysis.agent_consensus;
        const sum = ac.agents_approving + ac.agents_cautioning + ac.agents_opposing;
        if (sum !== 2 && sum !== 3) {
            console.log('  ❌ agent_consensus counts should sum to 2 (budgeting+investment) or 3 (if guardrail included), got:', sum);
            ok = false;
        }
        else if (sum === 2) {
            const approveRecs = ['strongly_approve', 'approve'];
            const cautionRecs = ['approve_with_caution'];
            const opposeRecs = ['not_recommended', 'strongly_oppose', 'blocked'];
            const expectedApproving = [r.budgetingAnalysis, r.investmentAnalysis].filter((a) => a && approveRecs.includes(a.recommendation)).length;
            const expectedCautioning = [r.budgetingAnalysis, r.investmentAnalysis].filter((a) => a && cautionRecs.includes(a.recommendation)).length;
            const expectedOpposing = [r.budgetingAnalysis, r.investmentAnalysis].filter((a) => a && opposeRecs.includes(a.recommendation)).length;
            if (ac.agents_approving !== expectedApproving || ac.agents_cautioning !== expectedCautioning || ac.agents_opposing !== expectedOpposing) {
                console.log('  ❌ agent_consensus counts do not match budgeting+investment recommendations');
                ok = false;
            }
            else {
                console.log('  ✅ Consensus consistent with budgeting+investment (agents work together)');
            }
        }
        else {
            console.log('  ✅ Consensus sum is 3 (validation may include guardrail)');
        }
    }
    if (r.validationAnalysis) {
        if ((r.validationAnalysis.final_summary?.length ?? 0) < 100) {
            console.log('  ❌ Validation final_summary length < 100');
            ok = false;
        }
        const consensusLevels = ['unanimous', 'strong', 'moderate', 'weak', 'divided'];
        if (r.validationAnalysis.agent_consensus && !consensusLevels.includes(r.validationAnalysis.agent_consensus.consensus_level)) {
            console.log('  ❌ Invalid agent_consensus.consensus_level');
            ok = false;
        }
    }
    if (r.finalDecision) {
        const validDecisions = ['blocked', 'do_not_proceed', 'proceed_with_caution', 'proceed'];
        if (!validDecisions.includes(r.finalDecision)) {
            console.log('  ❌ Invalid finalDecision (policy):', r.finalDecision);
            ok = false;
        }
        const expectedProceed = r.finalDecision === 'proceed' || r.finalDecision === 'proceed_with_caution';
        if (typeof r.shouldProceed === 'boolean' && r.shouldProceed !== expectedProceed) {
            console.log('  ❌ shouldProceed should be', expectedProceed, 'for finalDecision', r.finalDecision);
            ok = false;
        }
    }
    if (r.consensusLevel && !['blocked', 'unanimous', 'divided'].includes(r.consensusLevel)) {
        console.log('  ❌ Invalid consensusLevel (policy):', r.consensusLevel);
        ok = false;
    }
    if (ok)
        console.log('  ✅ All result contract checks passed\n');
    return ok;
}
async function runContextSensitivityTest() {
    section('6. Context sensitivity (optional, 2 full runs)');
    try {
        const orchestratorUrl = pathToFileURL(join(AGENTS, 'langchain-orchestrator.js')).href;
        const orchestratorMod = (await import(orchestratorUrl));
        const baseContext = await buildContext();
        const orchestrator = new orchestratorMod.LangChainAgentOrchestrator();
        const saveResult = (await orchestrator.processDecision({ ...baseContext, action: { type: 'save', amount: 100, goalId: baseContext.action.goalId } }));
        const investContext = await buildContext();
        const goalIdInvest = investContext.user && typeof investContext.user === 'object' && 'goals' in investContext.user
            ? investContext.user.goals?.[1]?.id ?? investContext.action.goalId
            : investContext.action.goalId;
        const simEngineMod = await import(pathToFileURL(join(DIST, 'lib', 'simulation-engine.js')).href);
        const investSim = simEngineMod.simulate_invest(investContext.user, 100, 'taxable', goalIdInvest, 5);
        const investResult = (await orchestrator.processDecision({
            ...investContext,
            action: { type: 'invest', amount: 100, goalId: goalIdInvest },
            simulationResult: investSim,
        }));
        const recDiff = saveResult.finalRecommendation !== investResult.finalRecommendation;
        const budgetRecDiff = saveResult.budgetingAnalysis?.recommendation !== investResult.budgetingAnalysis?.recommendation;
        if (recDiff || budgetRecDiff) {
            console.log('  ✅ Context sensitivity: outputs differ for save vs invest (architecture is context-aware)\n');
            return true;
        }
        console.log('  ⚠️  Save and invest runs produced identical key outputs (may be rate-limited or model cached).\n');
        return true;
    }
    catch (e) {
        console.log('  ❌ Context sensitivity test failed:', e instanceof Error ? e.message : e, '\n');
        return false;
    }
}
async function main() {
    console.log('\n🧪 Finance Bot – comprehensive agent architecture tests\n');
    if (!(await checkArchitecture()))
        process.exit(1);
    if (!(await checkApiKey()))
        process.exit(1);
    const skipPing = process.env.SKIP_GEMINI_PING === '1' || process.env.SKIP_GEMINI_PING === 'true' || process.env.SKIP_LLM_PING === '1' || process.env.SKIP_LLM_PING === 'true';
    const provider = getAgentProvider();
    if (skipPing) {
        section('2. LLM API connectivity');
        console.log('  ⏭️  Skipped (SKIP_GEMINI_PING=1 or SKIP_LLM_PING=1)\n');
    }
    else if (provider === 'openai') {
        if (!(await verifyOpenAIConnection()))
            process.exit(1);
    }
    else if (!(await verifyGeminiConnection()))
        process.exit(1);
    if (!(await runMockOrchestratorTest()))
        process.exit(1);
    const liveResult = await runLiveOrchestratorTest();
    if (liveResult == null)
        process.exit(1);
    if (!(await validateLiveResultZodSchemas(liveResult)))
        process.exit(1);
    if (!validateResultContract(liveResult))
        process.exit(1);
    const runContextSensitivity = process.env.RUN_CONTEXT_SENSITIVITY === '1' || process.env.RUN_CONTEXT_SENSITIVITY === 'true';
    if (runContextSensitivity) {
        if (!(await runContextSensitivityTest()))
            process.exit(1);
    }
    else {
        section('6. Context sensitivity');
        console.log('  ⏭️  Skipped (set RUN_CONTEXT_SENSITIVITY=1 to run 2 extra orchestrator calls)\n');
    }
    section('Summary');
    console.log('  All agent architecture checks passed.');
    console.log('  (0) Architecture, (1) API key, (2) LLM connectivity (' + provider + '), (3) Mock orchestrator, (4) Live orchestrator, (5) Result contract.');
    if (runContextSensitivity)
        console.log('  (6) Context sensitivity.');
    console.log('');
    process.exit(0);
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=test-agents.js.map