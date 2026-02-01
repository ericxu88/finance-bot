/**
 * Ingest financial news for market context (embedded).
 * If data/financial_news.jsonl exists it is used; otherwise a small built-in sample is embedded.
 */

import { config } from 'dotenv';
config();

import * as fs from 'fs/promises';
import * as path from 'path';
import { Document } from '@langchain/core/documents';
import { vectorStore } from '../lib/rag/vector-store.js';

const COLLECTION = 'financial_news';

/** Fallback sample when no JSONL file is present */
const SAMPLE_NEWS = [
  { title: 'Fed holds rates steady amid inflation watch', summary: 'Federal Reserve keeps interest rates unchanged while monitoring inflation data.', date: new Date().toISOString().slice(0, 10), category: 'monetary_policy' },
  { title: 'S&P 500 reaches new high on earnings strength', summary: 'Broad market index rises as major companies report strong quarterly results.', date: new Date().toISOString().slice(0, 10), category: 'markets' },
  { title: 'Treasury yields rise on strong jobs report', summary: '10-year Treasury yield climbs after employment data exceeds expectations.', date: new Date().toISOString().slice(0, 10), category: 'bonds' },
  { title: 'Consumer spending remains resilient', summary: 'Retail sales data suggests consumers are continuing to spend despite higher rates.', date: new Date().toISOString().slice(0, 10), category: 'economy' },
  { title: 'Oil prices volatile on supply concerns', summary: 'Crude oil fluctuates as traders weigh supply disruptions and demand outlook.', date: new Date().toISOString().slice(0, 10), category: 'commodities' },
];

async function ensureDataDir(): Promise<string> {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch {
    // ignore
  }
  return dataDir;
}

async function loadNewsFromFile(dataDir: string): Promise<Array<{ title: string; summary?: string; content?: string; date?: string; category?: string; url?: string }>> {
  const filePath = path.join(dataDir, 'financial_news.jsonl');
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean).slice(0, 500);
    return lines.map(line => JSON.parse(line));
  } catch {
    return [];
  }
}

async function processFinancialNews(): Promise<Document[]> {
  const dataDir = await ensureDataDir();
  const items = await loadNewsFromFile(dataDir);

  const source = items.length > 0 ? items : SAMPLE_NEWS;
  if (items.length === 0) {
    console.log('[News] No data/financial_news.jsonl found; using built-in sample.');
  }

  type NewsItem = { title: string; summary?: string; content?: string; date?: string; category?: string; url?: string };
  const documents = source.map((item: NewsItem) => new Document({
    pageContent: `
Headline: ${item.title}

Summary: ${item.summary || (item.content ? item.content.substring(0, 300) : '')}

Date: ${item.date || 'N/A'}

Category: ${item.category || 'general'}
    `.trim(),
    metadata: {
      type: 'financial_news',
      source: 'Financial News Dataset',
      date: item.date,
      category: item.category || 'general',
      url: item.url,
    }
  }));

  console.log(`[News] Prepared ${documents.length} documents`);
  return documents;
}

export async function ingestFinancialNews(): Promise<void> {
  try {
    const documents = await processFinancialNews();
    await vectorStore.addDocuments(COLLECTION, documents);
    console.log(`[News] Successfully ingested ${documents.length} documents into ${COLLECTION}`);
  } catch (error) {
    console.error('[News] Ingestion failed:', error);
    throw error;
  }
}

const isMain = process.argv[1]?.endsWith('ingest-financial-news') || process.argv[1]?.includes('ingest-financial-news');
if (isMain) {
  ingestFinancialNews()
    .then(() => {
      console.log('Financial news ingestion complete');
      process.exit(0);
    })
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
