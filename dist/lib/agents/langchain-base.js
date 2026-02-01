import { ChatOpenAI } from '@langchain/openai';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { getInvestmentBalance } from '../../types/financial.js';
export class LangChainBaseAgent {
    model;
    parser;
    constructor(temperature) {
        const openAiKey = process.env.OPEN_AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
        if (!openAiKey) {
            throw new Error('OPENAI_API_KEY (or OPEN_AI_API_KEY) environment variable is required. Get one at https://platform.openai.com/api-keys');
        }
        const modelName = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
        this.model = new ChatOpenAI({
            model: modelName,
            temperature,
            apiKey: openAiKey,
            maxTokens: 8192,
            maxRetries: 1,
        });
    }
    stripMarkdownCodeBlocks(text) {
        let cleaned = text.trim();
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.slice(7);
        }
        else if (cleaned.startsWith('```')) {
            cleaned = cleaned.slice(3);
        }
        if (cleaned.endsWith('```')) {
            cleaned = cleaned.slice(0, -3);
        }
        return cleaned.trim();
    }
    attemptJsonFix(text) {
        let fixed = text.trim();
        const openBrackets = (fixed.match(/\[/g) || []).length;
        const closeBrackets = (fixed.match(/\]/g) || []).length;
        const openBraces = (fixed.match(/\{/g) || []).length;
        const closeBraces = (fixed.match(/\}/g) || []).length;
        const afterLastComplete = fixed.slice(fixed.lastIndexOf(':'));
        const quotesAfterColon = (afterLastComplete.match(/"/g) || []).length;
        if (quotesAfterColon % 2 === 1) {
            fixed += '"';
        }
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
            fixed += ']';
        }
        for (let i = 0; i < openBraces - closeBraces; i++) {
            fixed += '}';
        }
        return fixed;
    }
    async analyze(context) {
        try {
            console.log(`[${this.agentName}] Starting analysis...`);
            this.parser = StructuredOutputParser.fromZodSchema(this.schema);
            const userPrompt = this.buildAnalysisPrompt(context);
            const formatInstructions = this.parser.getFormatInstructions();
            const prompt = PromptTemplate.fromTemplate(`{system_prompt}

{user_prompt}

{format_instructions}

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON - no markdown, no code blocks, no extra text
2. Keep string values concise (under 200 characters each)
3. Ensure all JSON is complete and properly closed`);
            const chain = RunnableSequence.from([
                prompt,
                this.model,
            ]);
            const response = await chain.invoke({
                system_prompt: this.systemPrompt,
                user_prompt: userPrompt,
                format_instructions: formatInstructions
            });
            const rawText = typeof response.content === 'string'
                ? response.content
                : JSON.stringify(response.content);
            const cleanedText = this.stripMarkdownCodeBlocks(rawText);
            if (!cleanedText.trim().endsWith('}')) {
                console.warn(`[${this.agentName}] Warning: Response may be truncated, attempting to fix...`);
                const fixedText = this.attemptJsonFix(cleanedText);
                try {
                    const result = await this.parser.parse(fixedText);
                    console.log(`[${this.agentName}] Analysis complete (with JSON fix)`);
                    return result;
                }
                catch {
                    throw new Error(`Response was truncated. Raw text ended with: "...${cleanedText.slice(-100)}"`);
                }
            }
            const result = await this.parser.parse(cleanedText);
            console.log(`[${this.agentName}] Analysis complete`);
            return result;
        }
        catch (error) {
            console.error(`[${this.agentName}] Error:`, error);
            throw new Error(`${this.agentName} analysis failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
    formatPercent(value) {
        return `${(value * 100).toFixed(1)}%`;
    }
    serializeSimulationResult(sim) {
        return `
SIMULATION RESULTS:
Action: ${sim.action.type} ${this.formatCurrency(sim.action.amount)}

IF USER PROCEEDS:
- Checking balance: ${this.formatCurrency(sim.scenarioIfDo.accountsAfter.checking)}
- Savings balance: ${this.formatCurrency(sim.scenarioIfDo.accountsAfter.savings)}
- Investment accounts: ${this.formatCurrency(getInvestmentBalance(sim.scenarioIfDo.accountsAfter.investments.taxable) +
            getInvestmentBalance(sim.scenarioIfDo.accountsAfter.investments.rothIRA) +
            getInvestmentBalance(sim.scenarioIfDo.accountsAfter.investments.traditional401k))}

Goal Impacts:
${sim.scenarioIfDo.goalImpacts.map(g => `- ${g.goalName}: ${g.progressChangePct > 0 ? '+' : ''}${g.progressChangePct.toFixed(1)}% progress, ${Math.abs(g.timeSaved)} months ${g.timeSaved >= 0 ? 'faster' : 'slower'}`).join('\n')}

Budget Impacts:
${sim.scenarioIfDo.budgetImpacts.map(b => `- ${b.categoryName}: ${b.percentUsed.toFixed(0)}% used (${b.status})`).join('\n')}

IF USER DOES NOT PROCEED:
- Liquidity impact: ${sim.scenarioIfDont.liquidityImpact}
- Risk impact: ${sim.scenarioIfDont.riskImpact}
- Timeline changes: ${sim.scenarioIfDont.timelineChanges.length > 0 ? sim.scenarioIfDont.timelineChanges.join('; ') : 'None'}
    `.trim();
    }
}
//# sourceMappingURL=langchain-base.js.map