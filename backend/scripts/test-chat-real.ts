/**
 * Real API Chat Test
 * 
 * Tests the chat interface with REAL OpenAI API.
 * Makes MINIMAL calls (only 1-2) to avoid exhausting the API.
 */

import { ChatHandler } from '../lib/chat/chat-handler.js';
import { sampleUser } from '../lib/sample-data.js';

async function main() {
  console.log('🧪 REAL API CHAT TEST');
  console.log('='.repeat(60));
  
  // Check for API key
  const openAiKey = process.env.OPEN_AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
  if (!openAiKey) {
    console.log('⚠️  OPENAI_API_KEY not set. Skipping real API test.');
    console.log('   Set OPENAI_API_KEY in .env to run this test.');
    process.exit(0);
  }
  
  // Check if mock mode is forced
  if (process.env.USE_MOCK_AGENTS === 'true') {
    console.log('⚠️  USE_MOCK_AGENTS=true. Skipping real API test.');
    process.exit(0);
  }
  
  console.log('✅ API key found. Running ONE real API test...\n');
  console.log('⚠️  This will make 1 API call to OpenAI (fast mode + skip intent parsing).\n');
  
  // Check model being used
  const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  console.log(`📌 Using model: ${modelName}`);
  if (modelName.includes('gpt-4') && !modelName.includes('mini')) {
    console.log('⚠️  WARNING: You are using a slower model. Consider setting OPENAI_MODEL=gpt-4o-mini in .env\n');
  }
  
  const handler = new ChatHandler();
  const startTime = Date.now();
  
  try {
    // Test: Skip intent parsing entirely and use fast mode (1 LLM call total)
    console.log('📝 TEST: Fast mode with pre-parsed action (1 API call)');
    console.log('-'.repeat(60));
    console.log('User: "Should I invest $500 for my house fund?"\n');
    console.log('⚡ Optimizations:');
    console.log('   • Skipping intent parsing (using parsedAction)');
    console.log('   • Using fast mode (unified agent = 1 call)\n');
    
    const houseGoalId = sampleUser.goals.find(g => g.name.includes('House'))?.id;
    
    const response = await handler.handleMessage({
      message: 'Analyzing investment...', // Message doesn't matter since we skip parsing
      userId: 'test_user',
      userProfile: sampleUser,
      fastMode: true, // Use unified agent (1 call instead of 5)
      parsedAction: {
        // Skip intent parsing entirely - provide action directly
        type: 'invest',
        amount: 500,
        goalId: houseGoalId,
        targetAccountId: 'taxable',
      },
    });
    
    const elapsed = Date.now() - startTime;
    
    console.log(`✅ Response received in ${elapsed}ms (${(elapsed / 1000).toFixed(1)}s)`);
    console.log(`\nIntent: ${response.intent.intent_type}`);
    console.log(`Confidence: ${response.intent.confidence}`);
    console.log(`\n🤖 Advisor Response:`);
    console.log(response.reply.message);
    console.log(`\n📊 Summary: ${response.reply.summary}`);
    console.log(`🎯 Should Proceed: ${response.reply.shouldProceed ? '✅ Yes' : '❌ No'}`);
    console.log(`💬 Confidence: ${response.reply.confidence}`);
    
    if (response.reply.suggestedFollowUps.length > 0) {
      console.log(`\n💡 Suggested Follow-ups:`);
      response.reply.suggestedFollowUps.forEach((f, i) => {
        console.log(`   ${i + 1}. ${f}`);
      });
    }
    
    // Validate response structure
    const isValid = 
      response.reply.message.length > 0 &&
      response.reply.summary.length > 0 &&
      response.reply.confidence &&
      response.intent.intent_type;
    
    if (isValid) {
      console.log('\n✅ Real API test PASSED');
      console.log('='.repeat(60));
      console.log('✅ Response structure valid');
      console.log('✅ Fast mode working');
      console.log(`✅ Response time: ${(elapsed / 1000).toFixed(1)}s (acceptable for real API)`);
      
      if (elapsed < 5000) {
        console.log('✅ Response time is excellent (<5s)');
      } else if (elapsed < 10000) {
        console.log('✅ Response time is good (<10s)');
      } else if (elapsed < 20000) {
        console.log('⚠️  Response time is acceptable but slow (10-20s)');
        console.log('   💡 Tip: Set OPENAI_MODEL=gpt-4o-mini in .env for faster responses');
      } else {
        console.log('⚠️  Response time is very slow (>20s)');
        console.log('   💡 Tip: Set OPENAI_MODEL=gpt-4o-mini in .env');
        console.log('   💡 Tip: Check your network connection');
      }
      
      console.log('\n📊 Breakdown:');
      console.log(`   • Intent parsing: SKIPPED (saved ~3-8s)`);
      console.log(`   • Unified agent: ${(elapsed / 1000).toFixed(1)}s`);
      console.log(`   • Total: ${(elapsed / 1000).toFixed(1)}s`);
      
      process.exit(0);
    } else {
      console.log('\n❌ Real API test FAILED - invalid response structure');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Real API test FAILED with error:');
    console.error(error);
    
    if (error instanceof Error) {
      if (error.message.includes('429')) {
        console.error('\n⚠️  Rate limit hit. Wait a bit and try again.');
      } else if (error.message.includes('404')) {
        console.error('\n⚠️  Model not found. Check OPENAI_MODEL in .env');
      } else if (error.message.includes('401') || error.message.includes('403')) {
        console.error('\n⚠️  API key invalid. Check OPENAI_API_KEY in .env');
      }
    }
    
    process.exit(1);
  }
}

main();
