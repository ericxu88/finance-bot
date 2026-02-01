import { config } from 'dotenv';
config();
import * as fs from 'fs/promises';
import * as path from 'path';
import { Document } from '@langchain/core/documents';
import { vectorStore } from '../lib/rag/vector-store.js';
const COLLECTION = 'financial_knowledge_real';
const SAMPLE_FINANCIAL_QA = [
    {
        question: 'What is dollar-cost averaging?',
        context: 'Investment strategy for reducing impact of volatility.',
        answer: 'Dollar-cost averaging (DCA) means investing a fixed amount at regular intervals regardless of market price. It reduces the risk of investing a lump sum at a market peak and can lower the average cost per share over time.',
        category: 'investment',
        difficulty: 'medium',
    },
    {
        question: 'How much should I keep in an emergency fund?',
        context: 'Financial planning for unexpected expenses.',
        answer: 'Most experts recommend 3 to 6 months of essential expenses in a liquid savings account. Use 3 months if you have stable income or dual earners; aim for 6 months if income is variable or you are the sole earner.',
        category: 'emergency_fund',
        difficulty: 'easy',
    },
    {
        question: 'What is the difference between Roth IRA and Traditional IRA?',
        context: 'Tax-advantaged retirement accounts.',
        answer: 'Traditional IRA contributions are often tax-deductible now and taxed on withdrawal. Roth IRA contributions are made with after-tax money and grow tax-free; qualified withdrawals are tax-free. Choose Roth if you expect a higher tax bracket in retirement.',
        category: 'retirement',
        difficulty: 'medium',
    },
    {
        question: 'How does inflation affect my investments?',
        context: 'Macroeconomic impact on portfolios.',
        answer: 'Inflation erodes the real purchasing power of fixed-income investments like bonds. Stocks may offer some protection if companies can pass costs to consumers. Consider inflation-protected securities (TIPS) and equities for long-term inflation hedging.',
        category: 'inflation',
        difficulty: 'medium',
    },
    {
        question: 'What is the 50/30/20 budget rule?',
        context: 'Personal budgeting framework.',
        answer: 'The 50/30/20 rule suggests allocating 50% of after-tax income to needs (housing, utilities, groceries), 30% to wants (dining, entertainment), and 20% to savings and debt repayment. Adjust ratios based on your goals and circumstances.',
        category: 'budgeting',
        difficulty: 'easy',
    },
];
async function ensureDataDir() {
    const dataDir = path.join(process.cwd(), 'data');
    try {
        await fs.mkdir(dataDir, { recursive: true });
    }
    catch {
    }
    return dataDir;
}
async function loadFinTextQAFromFile(dataDir) {
    const filePath = path.join(dataDir, 'fintextqa.jsonl');
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.trim().split('\n').filter(Boolean);
        return lines.map(line => JSON.parse(line));
    }
    catch {
        return [];
    }
}
async function processFinTextQA() {
    const dataDir = await ensureDataDir();
    const items = await loadFinTextQAFromFile(dataDir);
    const source = items.length > 0 ? items : SAMPLE_FINANCIAL_QA;
    if (items.length === 0) {
        console.log('[FinTextQA] No data/fintextqa.jsonl found; using built-in sample.');
    }
    const documents = source.map(item => new Document({
        pageContent: `
Question: ${item.question}

Context: ${item.context}

Answer: ${item.answer}
    `.trim(),
        metadata: {
            type: 'financial_qa',
            source: 'FinTextQA',
            category: item.category || 'general',
            difficulty: item.difficulty || 'medium',
        }
    }));
    console.log(`[FinTextQA] Prepared ${documents.length} documents`);
    return documents;
}
export async function ingestFinTextQA() {
    try {
        const documents = await processFinTextQA();
        await vectorStore.addDocuments(COLLECTION, documents);
        console.log(`[FinTextQA] Successfully ingested ${documents.length} documents into ${COLLECTION}`);
    }
    catch (error) {
        console.error('[FinTextQA] Ingestion failed:', error);
        throw error;
    }
}
const isMain = process.argv[1]?.endsWith('ingest-fintextqa') || process.argv[1]?.includes('ingest-fintextqa');
if (isMain) {
    ingestFinTextQA()
        .then(() => {
        console.log('FinTextQA ingestion complete');
        process.exit(0);
    })
        .catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
}
//# sourceMappingURL=ingest-fintextqa.js.map