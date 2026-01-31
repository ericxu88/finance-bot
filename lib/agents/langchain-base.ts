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
  protected parser: StructuredOutputParser<z.infer<TSchema>>;

  abstract readonly agentName: string;
  abstract readonly schema: TSchema;
  abstract readonly systemPrompt: string;
  abstract readonly temperature: number;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY environment variable is required (get one at https://aistudio.google.com/apikey)');
    }

    this.model = new ChatGoogleGenerativeAI({
      model: 'gemini-1.5-pro',
      temperature: this.temperature,
      apiKey,
      maxOutputTokens: 2048,
    });
  }

  /**
   * Build the analysis prompt for this specific agent
   */
  protected abstract buildAnalysisPrompt(context: AgentContext): string;

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

      // Create the chain
      const prompt = PromptTemplate.fromTemplate(
        `{system_prompt}

{user_prompt}

{format_instructions}`
      );

      const chain = RunnableSequence.from([
        prompt,
        this.model,
        this.parser
      ]);

      // Execute the chain
      const result = await chain.invoke({
        system_prompt: this.systemPrompt,
        user_prompt: userPrompt,
        format_instructions: formatInstructions
      });

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
${sim.scenarioIfDont.opportunityCost}
${sim.scenarioIfDont.alternativeOutcome}
    `.trim();
  }
}
