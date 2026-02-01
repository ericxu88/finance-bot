/**
 * Master script to ingest all financial data sources into the vector database.
 * Run once (or when updating sources) to populate financial_knowledge_real and financial_news.
 */

import { config } from 'dotenv';
config();

import { ingestFinTextQA } from './ingest-fintextqa.js';
import { ingestFREDDescriptions } from './ingest-fred-descriptions.js';
import { ingestFinancialNews } from './ingest-financial-news.js';

async function ingestAll(): Promise<void> {
  console.log('=== Starting Financial Data Ingestion ===\n');

  try {
    console.log('1/3: Ingesting FinTextQA (Financial Q&A)...');
    await ingestFinTextQA();
    console.log('✓ FinTextQA complete\n');

    console.log('2/3: Ingesting FRED indicator descriptions...');
    await ingestFREDDescriptions();
    console.log('✓ FRED descriptions complete\n');

    console.log('3/3: Ingesting Financial News...');
    await ingestFinancialNews();
    console.log('✓ News complete\n');

    console.log('=== All Financial Data Ingested Successfully ===');
  } catch (error) {
    console.error('Ingestion failed:', error);
    process.exit(1);
  }
}

ingestAll();
