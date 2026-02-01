import { userHistoryRAG } from '../lib/rag/user-history-rag.js';
import { knowledgeBase } from '../lib/rag/knowledge-base.js';
import { sampleUser } from '../lib/sample-data.js';
async function testRAG() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Testing RAG System');
    console.log('═══════════════════════════════════════════════════════════\n');
    try {
        console.log('[1/4] Indexing user history...');
        await userHistoryRAG.indexUser(sampleUser);
        console.log('✓ User history indexed successfully\n');
        console.log('[2/4] Testing historical context retrieval...');
        console.log('Query: "investing money savings patterns"\n');
        const histResults = await userHistoryRAG.search(sampleUser.id, 'investing money savings patterns', 3);
        if (histResults.length === 0) {
            console.log('⚠️  No historical results found (this is expected for sparse data)\n');
        }
        else {
            console.log(`Found ${histResults.length} relevant historical documents:\n`);
            histResults.forEach((r, i) => {
                console.log(`[${i + 1}] ${r.source.toUpperCase()}:`);
                console.log(r.content);
                console.log();
            });
        }
        console.log('[3/4] Initializing financial knowledge base...');
        await knowledgeBase.initialize();
        console.log('✓ Knowledge base initialized successfully\n');
        console.log('[4/4] Testing knowledge base retrieval...');
        console.log('Query: "emergency fund liquidity best practices"\n');
        const kbResults = await knowledgeBase.search('emergency fund liquidity best practices', 3);
        if (kbResults.length === 0) {
            console.log('⚠️  No knowledge base results found\n');
        }
        else {
            console.log(`Found ${kbResults.length} relevant financial principles:\n`);
            kbResults.forEach((r, i) => {
                console.log(`[${i + 1}] ${r.category}:`);
                console.log(r.principle);
                console.log(`(Source: ${r.source})`);
                console.log();
            });
        }
        console.log('[Bonus] Testing investment-related query...');
        console.log('Query: "time horizon risk tolerance asset allocation"\n');
        const investResults = await knowledgeBase.search('time horizon risk tolerance asset allocation', 3);
        if (investResults.length > 0) {
            console.log(`Found ${investResults.length} relevant investment principles:\n`);
            investResults.forEach((r, i) => {
                console.log(`[${i + 1}] ${r.category}:`);
                console.log(r.principle);
                console.log(`(Source: ${r.source})`);
                console.log();
            });
        }
        console.log('═══════════════════════════════════════════════════════════');
        console.log('✓ All RAG tests completed successfully');
        console.log('═══════════════════════════════════════════════════════════');
    }
    catch (error) {
        console.error('\n❌ RAG test failed:');
        console.error(error);
        process.exit(1);
    }
}
testRAG();
//# sourceMappingURL=test-rag.js.map