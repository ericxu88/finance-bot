import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..');
const DIST = join(ROOT, 'dist');
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
let passed = 0;
let failed = 0;
let skipped = 0;
function log(msg) {
    console.log(msg);
}
function section(title) {
    log('\n' + '='.repeat(70));
    log(`  ${title}`);
    log('='.repeat(70) + '\n');
}
function ok(name) {
    passed++;
    log(`  ✅ ${name}`);
}
function fail(name, err) {
    failed++;
    log(`  ❌ ${name}`);
    log(`     ${err}`);
}
function skip(name, reason) {
    skipped++;
    log(`  ⏭️  ${name} (${reason})`);
}
function runSimulationTests() {
    section('Phase 1: Simulation engine tests');
    const testPath = join(DIST, 'lib', '__tests__', 'simulation-engine.test.js');
    if (!existsSync(testPath)) {
        fail('Simulation engine tests', `Compiled test file not found. Run: npm run build\n     Expected: ${testPath}`);
        return false;
    }
    try {
        execSync(`node "${testPath}"`, {
            cwd: ROOT,
            stdio: 'inherit',
            encoding: 'utf-8',
        });
        ok('Simulation engine tests (simulate_save, simulate_invest, constraints, compare_options)');
        return true;
    }
    catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        fail('Simulation engine tests', err);
        return false;
    }
}
async function runAgentTests() {
    section('Phase 2: LangChain agent tests');
    if (!process.env.GOOGLE_API_KEY?.trim()) {
        skip('Agent tests', 'GOOGLE_API_KEY not set (set it to run agent tests)');
        return true;
    }
    const orchestratorPath = join(DIST, 'lib', 'agents', 'langchain-orchestrator.js');
    if (!existsSync(orchestratorPath)) {
        skip('Agent tests', 'lib/agents not found (orchestrator not built)');
        return true;
    }
    try {
        const orchestratorUrl = pathToFileURL(orchestratorPath).href;
        const orchestratorMod = await import(orchestratorUrl);
        const { LangChainAgentOrchestrator } = orchestratorMod;
        const samplePath = join(DIST, 'lib', 'sample-data.js');
        const sampleUrl = pathToFileURL(samplePath).href;
        const sampleMod = await import(sampleUrl);
        const user = sampleMod.sampleUser;
        const simEnginePath = join(DIST, 'lib', 'simulation-engine.js');
        const simEngineMod = await import(pathToFileURL(simEnginePath).href);
        const { simulate_save } = simEngineMod;
        const goalId = user.goals[0]?.id ?? 'goal_emergency';
        const action = { type: 'save', amount: 100, goalId };
        const simulationResult = simulate_save(user, action.amount, goalId);
        const historicalMetrics = {
            monthsOfData: 4,
            avgMonthlySpending: 2500,
            spendingVariance: 0.15,
            transactionCount: 120,
            categoryBreakdown: {},
        };
        const orchestrator = new LangChainAgentOrchestrator();
        const rawResult = await Promise.race([
            orchestrator.processDecision({
                user,
                action,
                simulationResult,
                historicalMetrics,
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Agent test timed out after 60s')), 60_000)),
        ]);
        const result = rawResult;
        if (!result.budgetingAnalysis || !result.investmentAnalysis || !result.guardrailAnalysis || !result.validationAnalysis) {
            fail('Agent tests', 'One or more agent analyses missing in result');
            return false;
        }
        if (!result.finalRecommendation?.length) {
            fail('Agent tests', 'finalRecommendation was empty');
            return false;
        }
        const validConfidence = ['high', 'medium', 'low', 'very_low'].includes(result.overallConfidence);
        if (!validConfidence) {
            fail('Agent tests', `Invalid overallConfidence: ${result.overallConfidence}`);
            return false;
        }
        ok('Agent tests (Budgeting, Investment, Guardrail, Validation agents + orchestrator)');
        log(`     Recommendation: ${result.validationAnalysis.overall_recommendation}`);
        log(`     Confidence: ${result.overallConfidence}`);
        log(`     Execution time: ${(result.executionTime / 1000).toFixed(2)}s`);
        return true;
    }
    catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        fail('Agent tests', err);
        return false;
    }
}
async function main() {
    log('\n🧪 Finance Bot – comprehensive test run\n');
    const simOk = runSimulationTests();
    if (!simOk) {
        log('\n❌ Simulation tests failed. Skipping agent tests.\n');
        process.exit(1);
    }
    await runAgentTests();
    section('Summary');
    log(`  Passed:  ${passed}`);
    if (skipped)
        log(`  Skipped: ${skipped}`);
    if (failed)
        log(`  Failed:  ${failed}`);
    log('');
    if (failed > 0) {
        process.exit(1);
    }
    log('🎉 All runnable tests passed.\n');
    process.exit(0);
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=test-all.js.map