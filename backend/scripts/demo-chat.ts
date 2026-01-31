/**
 * Chat Interface Demo
 * 
 * Demonstrates the chat-based financial advisor interface
 * Uses mock agents for instant responses (no API key needed)
 */

import { ChatHandler } from '../lib/chat/chat-handler.js';
import { sarah } from '../lib/demo-users.js';

async function main() {
  console.log('💬 Financial Advisor Chat Demo');
  console.log('='.repeat(60));
  console.log('⚠️  Using mock agents (instant responses, no API calls)\n');
  
  const chatHandler = new ChatHandler();
  let conversationId: string | undefined;
  
  // Helper to chat
  async function chat(message: string) {
    console.log(`\n👤 USER: "${message}"`);
    console.log('-'.repeat(60));
    
    const response = await chatHandler.handleMessage({
      message,
      userId: 'demo_user',
      conversationId,
      userProfile: sarah,
    });
    
    conversationId = response.conversationId;
    
    console.log(`🤖 ADVISOR:`);
    console.log(response.reply.message);
    console.log(`\n📊 Summary: ${response.reply.summary}`);
    console.log(`⏱️  Response time: ${response.executionTimeMs}ms`);
    console.log(`🎯 Intent: ${response.intent.intent_type} (${response.intent.confidence} confidence)`);
    
    if (response.reply.suggestedFollowUps.length > 0) {
      console.log(`\n💡 Suggested follow-ups:`);
      response.reply.suggestedFollowUps.forEach((f, i) => console.log(`   ${i + 1}. ${f}`));
    }
    
    return response;
  }
  
  // Demo conversation
  console.log('\n' + '='.repeat(60));
  console.log('Starting conversation with Sarah...');
  console.log('='.repeat(60));
  
  // Test 1: Ask for recommendations
  await chat("What should I do with my extra money?");
  
  // Test 2: Simulate a specific action
  await chat("Should I invest $500 for my house down payment?");
  
  // Test 3: Follow-up question (uses context)
  await chat("What about $1000 instead?");
  
  // Test 4: Check goal progress
  await chat("How are my goals doing?");
  
  // Test 5: Compare options
  await chat("Compare saving vs investing $500");
  
  // Test 6: Explain tradeoffs
  await chat("Explain the tradeoffs of investing");
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Chat Demo Complete!');
  console.log('='.repeat(60));
  console.log('\nThis demonstrates:');
  console.log('  ✓ Natural language understanding');
  console.log('  ✓ Context-aware follow-up questions');
  console.log('  ✓ Financial simulation integration');
  console.log('  ✓ Multi-agent analysis');
  console.log('  ✓ Conversational responses');
  console.log('  ✓ Suggested follow-ups');
  console.log('\n🚀 Ready for the frontend chat interface!');
}

main().catch(error => {
  console.error('\n❌ Demo failed:', error);
  process.exit(1);
});
