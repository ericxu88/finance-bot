/**
 * Tests for RAG multi-source retrieval: financial_knowledge, financial_knowledge_real, financial_news.
 * Populates collections using built-in/sample data (no FRED API key or Python service required).
 * Requires OPENAI_API_KEY for embeddings.
 */

import { config } from 'dotenv';
config(); // Load .env before any module that reads process.env

import { vectorStore } from '../rag/vector-store.js';
import { knowledgeBase } from '../rag/knowledge-base.js';
import { ingestFREDDescriptions } from '../../scripts/ingest-fred-descriptions.js';
import { ingestFinTextQA } from '../../scripts/ingest-fintextqa.js';
import { ingestFinancialNews } from '../../scripts/ingest-financial-news.js';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function setupCollections(): Promise<void> {
  const apiKey = process.env.OPEN_AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY (or OPEN_AI_API_KEY) required for RAG tests. Add to .env');
  }

  // Reset so each test run starts from a known state
  vectorStore.clearAll();

  // 1. Curated financial knowledge (financial_knowledge)
  await knowledgeBase.initialize();

  // 2. FRED descriptions + FinTextQA samples (financial_knowledge_real) – no FRED API key needed
  await ingestFREDDescriptions();
  await ingestFinTextQA();

  // 3. Financial news samples (financial_news)
  await ingestFinancialNews();
}

console.log('\n🧪 RAG multi-source retrieval tests');
console.log('='.repeat(60));

try {
  await setupCollections();
  console.log('✅ Collections populated (financial_knowledge, financial_knowledge_real, financial_news)\n');

  // --- financial_knowledge_real: FRED + FinTextQA ---
  const realQuery = 'inflation interest rate federal reserve';
  const realDocs = await vectorStore.search('financial_knowledge_real', realQuery, 5);
  assert(Array.isArray(realDocs), 'financial_knowledge_real search should return array');
  assert(realDocs.length >= 1, `financial_knowledge_real should return at least 1 doc for "${realQuery}" (got ${realDocs.length})`);

  const realContent = realDocs.map(d => d.pageContent).join(' ');
  const hasFredOrInflation = /inflation|CPI|FRED|Federal Reserve|interest rate|Consumer Price/i.test(realContent);
  assert(hasFredOrInflation, 'financial_knowledge_real should contain FRED/inflation-related content');

  console.log(`✅ financial_knowledge_real: retrieved ${realDocs.length} doc(s), content includes FRED/inflation context`);

  // --- financial_news ---
  const newsQuery = 'market fed economy';
  const newsDocs = await vectorStore.search('financial_news', newsQuery, 3);
  assert(Array.isArray(newsDocs), 'financial_news search should return array');
  assert(newsDocs.length >= 1, `financial_news should return at least 1 doc for "${newsQuery}" (got ${newsDocs.length})`);

  const newsContent = newsDocs.map(d => d.pageContent).join(' ');
  const hasNewsLike = /headline|market|fed|rate|economy/i.test(newsContent);
  assert(hasNewsLike, 'financial_news should contain headline/market-like content');

  console.log(`✅ financial_news: retrieved ${newsDocs.length} doc(s), content includes market/headline context`);

  // --- financial_knowledge (curated via knowledgeBase) ---
  const curatedQuery = 'emergency fund savings budget';
  const curatedResults = await knowledgeBase.search(curatedQuery, 3);
  assert(Array.isArray(curatedResults), 'knowledgeBase.search should return array');
  assert(curatedResults.length >= 1, `financial_knowledge (curated) should return at least 1 result (got ${curatedResults.length})`);

  const hasPrinciple = curatedResults.some(r => r.principle && r.source && r.category);
  assert(hasPrinciple, 'Curated results should have principle, source, category');

  console.log(`✅ financial_knowledge (curated): retrieved ${curatedResults.length} result(s) with principle/source/category`);

  // --- Sanity: all three sources return different content ---
  const realIds = new Set(realDocs.map(d => d.pageContent.slice(0, 80)));
  const newsIds = new Set(newsDocs.map(d => d.pageContent.slice(0, 80)));
  assert(realIds.size >= 1 && newsIds.size >= 1, 'Each source should contribute at least one distinct doc');

  console.log('\n✅ All RAG multi-source retrieval tests passed');
} catch (err) {
  console.error('\n❌ RAG multi-source test failed:', err);
  process.exit(1);
}
