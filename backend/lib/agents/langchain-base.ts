/**
 * LangChain Base Agent
 *
 * Abstract base class for all LangChain-powered agents (powered by Google Gemini)
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import type { UserProfile, FinancialAction, SimulationResult } from '../../types/financial.js';
import type { z } from 'zod';

export interface AgentContext {
  user: UserProfile;
  action: FinancialAction;
  simulationResult: SimulationResult;
  historicalMetrics: {
    monthsOfData: number;
    avgMonthlySpending: number;
    spendingVariance: number;
    transactionCount: number;
    categoryBreakdown: Record<string, number>;
  };
}

export abstract class LangChainBaseAgent<TSchema extends z.ZodType> {
  protected model: ChatGoogleGenerativeAI;
  protected parser!: StructuredOutputParser<z.infer<TSchema>>;

  abstract readonly agentName: string;
  abstract readonly schema: TSchema;
  abstract readonly systemPrompt: string;

  constructor(temperature: number) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY environment variable is required (get one at https://aistudio.google.com/apikey)');
    }

    // Use gemini-1.5-flash as default (widely available and fast)
    // Can override with GEMINI_MODEL env var (e.g., 'gemini-1.5-pro', 'gemini-2.0-flash')
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    
    this.model = new ChatGoogleGenerativeAI({
      model: modelName,
      temperature,
      apiKey,
      maxOutputTokens: 8192, // Increased to prevent truncated JSON responses
    });
  }

  /**
   * Build the analysis prompt for this specific agent
   */
  protected abstract buildAnalysisPrompt(context: AgentContext): string;

  /**
   * Strip markdown code blocks from LLM output
   */
  private stripMarkdownCodeBlocks(text: string): string {
    // Remove ```json ... ``` or ``` ... ``` wrapping
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    return cleaned.trim();
  }

  /**
   * Attempt to fix truncated JSON by closing open brackets/braces
   */
  private attemptJsonFix(text: string): string {
    let fixed = text.trim();
    
    // Count brackets and braces
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;
    
    // Check if we're mid-string (odd number of quotes after last complete value)
    const afterLastComplete = fixed.slice(fixed.lastIndexOf(':'));
    const quotesAfterColon = (afterLastComplete.match(/"/g) || []).length;
    if (quotesAfterColon % 2 === 1) {
      fixed += '"';
    }
    
    // Close arrays
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      fixed += ']';
    }
    
    // Close objects
    for (let i = 0; i < openBraces - closeBraces; i++) {
      fixed += '}';
    }
    
    return fixed;
  }

  /**
   * Main analysis method - orchestrates the LLM call with structured output
   */
  async analyze(context: AgentContext): Promise<z.infer<TSchema>> {
    try {
      console.log(`[${this.agentName}] Starting analysis...`);

      // Initialize parser
      this.parser = StructuredOutputParser.fromZodSchema(this.schema);

      // Build the complete prompt
      const userPrompt = this.buildAnalysisPrompt(context);
      const formatInstructions = this.parser.getFormatInstructions();

      // Create the chain - get raw text first, then parse manually
      const prompt = PromptTemplate.fromTemplate(
        `{system_prompt}

{user_prompt}

{format_instructions}

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON - no markdown, no code blocks, no extra text
2. Keep string values concise (under 200 characters each)
3. Ensure all JSON is complete and properly closed`
      );

      const chain = RunnableSequence.from([
        prompt,
        this.model,
      ]);

      // Execute the chain
      const response = await chain.invoke({
        system_prompt: this.systemPrompt,
        user_prompt: userPrompt,
        format_instructions: formatInstructions
      });

      // Extract text content and strip any markdown formatting
      const rawText = typeof response.content === 'string' 
        ? response.content 
        : JSON.stringify(response.content);
      const cleanedText = this.stripMarkdownCodeBlocks(rawText);
      
      // Check for truncated JSON (common sign: ends mid-string or missing closing brackets)
      if (!cleanedText.trim().endsWith('}')) {
        console.warn(`[${this.agentName}] Warning: Response may be truncated, attempting to fix...`);
        // Try to close the JSON properly
        const fixedText = this.attemptJsonFix(cleanedText);
        try {
          const result = await this.parser.parse(fixedText);
          console.log(`[${this.agentName}] Analysis complete (with JSON fix)`);
          return result;
        } catch {
          // If fix didn't work, throw with helpful message
          throw new Error(`Response was truncated. Raw text ended with: "...${cleanedText.slice(-100)}"`);
        }
      }
      
      // Parse the cleaned JSON
      const result = await this.parser.parse(cleanedText);

      console.log(`[${this.agentName}] Analysis complete`);
      return result;

    } catch (error) {
      console.error(`[${this.agentName}] Error:`, error);
      throw new Error(`${this.agentName} analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Helper: Format currency
   */
  protected formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Helper: Format percentage
   */
  protected formatPercent(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }

  /**
   * Helper: Serialize simulation result for prompt
   */
  protected serializeSimulationResult(sim: SimulationResult): string {
    return `
SIMULATION RESULTS:
Action: ${sim.action.type} ${this.formatCurrency(sim.action.amount)}

IF USER PROCEEDS:
- Checking balance: ${this.formatCurrency(sim.scenarioIfDo.accountsAfter.checking)}
- Savings balance: ${this.formatCurrency(sim.scenarioIfDo.accountsAfter.savings)}
- Investment accounts: ${this.formatCurrency(
      sim.scenarioIfDo.accountsAfter.investments.taxable +
      sim.scenarioIfDo.accountsAfter.investments.rothIRA +
      sim.scenarioIfDo.accountsAfter.investments.traditional401k
    )}

Goal Impacts:
${sim.scenarioIfDo.goalImpacts.map(g =>
      `- ${g.goalName}: ${g.progressChangePct > 0 ? '+' : ''}${g.progressChangePct.toFixed(1)}% progress, ${Math.abs(g.timeSaved)} months ${g.timeSaved >= 0 ? 'faster' : 'slower'}`
    ).join('\n')}

Budget Impacts:
${sim.scenarioIfDo.budgetImpacts.map(b =>
      `- ${b.categoryName}: ${b.percentUsed.toFixed(0)}% used (${b.status})`
    ).join('\n')}

IF USER DOES NOT PROCEED:
- Liquidity impact: ${sim.scenarioIfDont.liquidityImpact}
- Risk impact: ${sim.scenarioIfDont.riskImpact}
- Timeline changes: ${sim.scenarioIfDont.timelineChanges.length > 0 ? sim.scenarioIfDont.timelineChanges.join('; ') : 'None'}
    `.trim();
  }
}
