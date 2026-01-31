/**
 * List available Gemini models for your API key
 */

import 'dotenv/config';

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.log('❌ GOOGLE_API_KEY not set');
  process.exit(1);
}

console.log('🔍 Fetching available models...\n');

interface ModelResponse {
  error?: { message: string };
  models?: Array<{ name: string; supportedGenerationMethods?: string[] }>;
}

async function listModels() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json() as ModelResponse;
    
    if (data.error) {
      console.error('❌ Error:', data.error.message);
      process.exit(1);
    }
    
    console.log('Available models that support generateContent:\n');
    
    const generateModels = data.models?.filter(m => 
      m.supportedGenerationMethods?.includes('generateContent')
    ) || [];
    
    generateModels.forEach(model => {
      console.log(`  ✓ ${model.name.replace('models/', '')}`);
    });
    
    console.log(`\nTotal: ${generateModels.length} models`);
    console.log('\nAdd one of these to your .env file as GEMINI_MODEL');
  } catch (err) {
    console.error('❌ Fetch error:', err);
  }
}

listModels();
