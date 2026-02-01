import 'dotenv/config';
console.log('📋 Available OpenAI Models:\n');
const models = [
    { name: 'gpt-4o-mini', description: 'Fastest, cheapest (recommended for development)' },
    { name: 'gpt-4o', description: 'Balanced speed and quality' },
    { name: 'gpt-4-turbo', description: 'High quality, slower' },
    { name: 'gpt-4', description: 'Highest quality, slowest' },
    { name: 'gpt-3.5-turbo', description: 'Legacy, fast but less capable' },
];
models.forEach(model => {
    console.log(`  ✓ ${model.name.padEnd(20)} ${model.description}`);
});
console.log('\n💡 Set one in your .env file:');
console.log('   OPENAI_MODEL=gpt-4o-mini');
console.log('\n📖 See full list: https://platform.openai.com/docs/models');
//# sourceMappingURL=list-models.js.map