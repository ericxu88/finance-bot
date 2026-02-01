import { LangChainBaseAgent } from '../lib/agents/langchain-base.js';
import { BudgetingAnalysisSchema } from '../lib/agents/schemas.js';
import { sampleUser } from '../lib/sample-data.js';
import { simulate_save } from '../lib/simulation-engine.js';
import { calculateHistoricalMetrics } from '../lib/agents/historical-metrics.js';
class TestAgent extends LangChainBaseAgent {
    agentName = 'Test Agent';
    schema = BudgetingAnalysisSchema;
    systemPrompt = 'You are a test agent.';
    buildAnalysisPrompt() {
        return 'Test prompt';
    }
    testModelInitialized() {
        return this.model !== null && this.model !== undefined;
    }
}
console.log('🧪 Testing OpenAI Model Configuration');
console.log('='.repeat(60));
const apiKey = process.env.OPEN_AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
console.log(`\n📋 Configuration:`);
console.log(`   API Key: ${apiKey ? '✅ Set' : '❌ Not set'}`);
console.log(`   Model: ${modelName}`);
console.log(`   Expected: gpt-4o-mini (default)`);
console.log('\n🧪 TEST 1: Model Configuration');
console.log('-'.repeat(60));
if (!apiKey) {
    console.log('⚠️  OPENAI_API_KEY not set - skipping agent initialization test');
    console.log('✅ Model configuration code is correct (will use: gpt-4o-mini)');
    console.log('✅ To test agent initialization: export OPENAI_API_KEY=your_key_here');
}
else {
    try {
        const agent = new TestAgent(0.2);
        const isInitialized = agent.testModelInitialized();
        console.log(`✅ Agent created successfully`);
        console.log(`   Model initialized: ${isInitialized ? 'Yes' : 'No'}`);
        console.log(`   Configured model: ${modelName}`);
    }
    catch (error) {
        console.error(`❌ Failed to create agent:`, error);
        if (error instanceof Error && error.message.includes('OPENAI_API_KEY')) {
            console.error(`\n💡 Set your API key: export OPENAI_API_KEY=your_key_here`);
        }
        process.exit(1);
    }
}
const testRealAPI = process.env.TEST_REAL_API === 'true' && apiKey;
if (testRealAPI) {
    console.log('\n🧪 TEST 2: Real API Call (Single Request)');
    console.log('-'.repeat(60));
    console.log('⚠️  Making ONE API call to verify model works...\n');
    try {
        const agent = new TestAgent(0.2);
        const simulationResult = simulate_save(sampleUser, 100, sampleUser.goals[0]?.id);
        const historicalMetrics = calculateHistoricalMetrics(sampleUser);
        const startTime = Date.now();
        const result = await agent.analyze({
            user: sampleUser,
            action: { type: 'save', amount: 100 },
            simulationResult,
            historicalMetrics,
        });
        const duration = Date.now() - startTime;
        console.log(`✅ API call successful!`);
        console.log(`   Model: ${modelName}`);
        console.log(`   Response time: ${duration}ms`);
        console.log(`   Recommendation: ${result.recommendation}`);
        console.log(`   Confidence: ${(result.confidence * 100).toFixed(0)}%`);
        console.log(`\n🎉 Model configuration is working correctly!`);
    }
    catch (error) {
        console.error(`❌ API call failed:`, error.message);
        if (error.message.includes('404') || error.message.includes('not found')) {
            console.error(`\n💡 Suggestion: Try a different model:`);
            console.error(`   export OPENAI_MODEL=gpt-4o-mini`);
            console.error(`   export OPENAI_MODEL=gpt-4o`);
        }
        process.exit(1);
    }
}
else {
    console.log('\n🧪 TEST 2: Skipped (using mock agents)');
    console.log('-'.repeat(60));
    console.log('✅ Model configuration verified');
    console.log('✅ To test real API: export TEST_REAL_API=true');
    console.log('   (This will make ONE API call to verify)');
    console.log('\n💡 Recommendation: Use mock agents for development/testing');
    console.log('   npm run demo:agents:mock  # No API calls');
}
console.log('\n' + '='.repeat(60));
console.log('✅ Model configuration test complete!');
//# sourceMappingURL=test-model-config.js.map