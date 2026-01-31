/**
 * Intent Parser
 * 
 * Converts natural language user messages into structured financial actions.
 * Uses LLM to extract intent, amount, goal, and other parameters.
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { z } from 'zod';
import type { UserProfile } from '../../types/financial.js';

// Schema for parsed intent
export const ParsedIntentSchema = z.object({
  intent_type: z.enum([
    'simulate_action',      // User wants to simulate save/invest/spend
    'compare_options',      // User wants to compare multiple options
    'get_recommendation',   // User asks "what should I do?"
    'check_goal_progress',  // User asks about goal status
    'explain_tradeoffs',    // User wants to understand tradeoffs
    'general_question',     // General financial question
    'clarification_needed', // Can't understand, need more info
  ]),
  
  // For simulate_action intent
  action: z.object({
    type: z.enum(['save', 'invest', 'spend']).nullable(),
    amount: z.number().nullable(),
    goal_name: z.string().nullable(),        // Natural language goal reference
    account_type: z.string().nullable(),     // "checking", "savings", "roth", etc.
    category: z.string().nullable(),         // For spend actions
    time_horizon: z.number().nullable(),     // Years for investment
  }).optional(),
  
  // For compare_options intent
  options_to_compare: z.array(z.object({
    type: z.enum(['save', 'invest', 'spend']),
    amount: z.number(),
    description: z.string(),
  })).optional(),
  
  // Extracted entities
  mentioned_goals: z.array(z.string()),      // Goals mentioned in message
  mentioned_amounts: z.array(z.number()),    // Amounts mentioned
  
  // Parser confidence
  confidence: z.enum(['high', 'medium', 'low']),
  clarification_question: z.string().nullable(), // If clarification needed
  
  // Original message summary
  user_intent_summary: z.string(),
});

export type ParsedIntent = z.infer<typeof ParsedIntentSchema>;

export class IntentParser {
  private model: ChatGoogleGenerativeAI;
  private parser: StructuredOutputParser<typeof ParsedIntentSchema>;
  
  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY required for chat functionality');
    }
    
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';
    
    this.model = new ChatGoogleGenerativeAI({
      model: modelName,
      temperature: 0.1, // Low temperature for consistent parsing
      apiKey,
      maxOutputTokens: 2048,
    });
    
    this.parser = StructuredOutputParser.fromZodSchema(ParsedIntentSchema);
  }
  
  async parse(message: string, userProfile: UserProfile): Promise<ParsedIntent> {
    const formatInstructions = this.parser.getFormatInstructions();
    
    // Build context about user's goals for better entity extraction
    const goalsContext = userProfile.goals
      .map(g => `- "${g.name}" (ID: ${g.id}, target: $${g.targetAmount}, current: $${g.currentAmount})`)
      .join('\n');
    
    const accountsContext = `
- Checking: $${userProfile.accounts.checking}
- Savings: $${userProfile.accounts.savings}
- Taxable investments: $${userProfile.accounts.investments.taxable}
- Roth IRA: $${userProfile.accounts.investments.rothIRA}
- 401k: $${userProfile.accounts.investments.traditional401k}`;
    
    const prompt = PromptTemplate.fromTemplate(`You are a financial intent parser. Extract the user's intent from their message.

USER'S FINANCIAL CONTEXT:
Monthly Income: $${userProfile.monthlyIncome}

Accounts:
${accountsContext}

Financial Goals:
${goalsContext}

USER MESSAGE: "{message}"

INSTRUCTIONS:
1. Determine the intent_type based on what the user wants to do
2. Extract any specific amounts, goals, or accounts mentioned
3. If the user mentions a goal by name, match it to one of their existing goals
4. Set confidence to "low" if the message is ambiguous
5. If clarification is needed, provide a helpful clarification_question

INTENT TYPES:
- simulate_action: User wants to know what happens if they save/invest/spend
- compare_options: User wants to compare multiple choices
- get_recommendation: User asks "what should I do?" or wants advice
- check_goal_progress: User asks about goal status
- explain_tradeoffs: User wants to understand pros/cons
- general_question: General financial question
- clarification_needed: Can't determine intent

{format_instructions}

Return ONLY the JSON object, no markdown code blocks.`);

    const chain = RunnableSequence.from([prompt, this.model]);
    
    try {
      const response = await chain.invoke({
        message,
        format_instructions: formatInstructions,
      });
      
      const rawText = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);
      
      // Strip markdown if present
      const cleanedText = this.stripMarkdownCodeBlocks(rawText);
      
      return await this.parser.parse(cleanedText);
    } catch (error) {
      console.error('[IntentParser] Error:', error);
      // Return a clarification-needed response on parse failure
      return {
        intent_type: 'clarification_needed',
        mentioned_goals: [],
        mentioned_amounts: [],
        confidence: 'low',
        clarification_question: "I'm not sure I understood that. Could you rephrase? For example: 'Should I invest $500 for my house fund?' or 'What happens if I save $300?'",
        user_intent_summary: message || 'Unable to parse message',
      };
    }
  }
  
  private stripMarkdownCodeBlocks(text: string): string {
    const jsonMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    return jsonMatch?.[1] ?? text;
  }
}

/**
 * Mock Intent Parser for testing without API calls
 */
export class MockIntentParser {
  async parse(message: string, userProfile: UserProfile): Promise<ParsedIntent> {
    const lowerMessage = message.toLowerCase();
    
    // Simple keyword-based parsing for mock mode
    const amounts = message.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/g)?.map(a => 
      parseFloat(a.replace(/[$,]/g, ''))
    ) || [];
    
    // Detect goals mentioned
    const mentionedGoals: string[] = [];
    for (const goal of userProfile.goals) {
      if (lowerMessage.includes(goal.name.toLowerCase())) {
        mentionedGoals.push(goal.name);
      }
    }
    // Common goal keywords
    if (lowerMessage.includes('house') || lowerMessage.includes('down payment')) {
      const houseGoal = userProfile.goals.find(g => 
        g.name.toLowerCase().includes('house') || g.name.toLowerCase().includes('down payment')
      );
      if (houseGoal && !mentionedGoals.includes(houseGoal.name)) {
        mentionedGoals.push(houseGoal.name);
      }
    }
    if (lowerMessage.includes('emergency') || lowerMessage.includes('rainy day')) {
      const emergencyGoal = userProfile.goals.find(g => 
        g.name.toLowerCase().includes('emergency')
      );
      if (emergencyGoal && !mentionedGoals.includes(emergencyGoal.name)) {
        mentionedGoals.push(emergencyGoal.name);
      }
    }
    if (lowerMessage.includes('vacation') || lowerMessage.includes('trip')) {
      const vacationGoal = userProfile.goals.find(g => 
        g.name.toLowerCase().includes('vacation')
      );
      if (vacationGoal && !mentionedGoals.includes(vacationGoal.name)) {
        mentionedGoals.push(vacationGoal.name);
      }
    }
    
    // Detect intent type
    let intentType: ParsedIntent['intent_type'] = 'general_question';
    let actionType: 'save' | 'invest' | 'spend' | null = null;
    
    if (lowerMessage.includes('compare') || lowerMessage.includes('vs') || lowerMessage.includes('or')) {
      intentType = 'compare_options';
    } else if (lowerMessage.includes('what should i') || lowerMessage.includes('recommend') || lowerMessage.includes('advice')) {
      intentType = 'get_recommendation';
    } else if (lowerMessage.includes('progress') || lowerMessage.includes('how am i doing') || lowerMessage.includes('status')) {
      intentType = 'check_goal_progress';
    } else if (lowerMessage.includes('tradeoff') || lowerMessage.includes('pros and cons') || lowerMessage.includes('explain')) {
      intentType = 'explain_tradeoffs';
    } else if (lowerMessage.includes('invest') || lowerMessage.includes('save') || lowerMessage.includes('spend') || 
               lowerMessage.includes('put') || lowerMessage.includes('move')) {
      intentType = 'simulate_action';
      
      if (lowerMessage.includes('invest') || lowerMessage.includes('stock') || lowerMessage.includes('market')) {
        actionType = 'invest';
      } else if (lowerMessage.includes('save') || lowerMessage.includes('savings') || lowerMessage.includes('put away')) {
        actionType = 'save';
      } else if (lowerMessage.includes('spend') || lowerMessage.includes('buy') || lowerMessage.includes('purchase')) {
        actionType = 'spend';
      }
    }
    
    // Detect account type
    let accountType: string | null = null;
    if (lowerMessage.includes('roth') || lowerMessage.includes('ira')) {
      accountType = 'rothIRA';
    } else if (lowerMessage.includes('401k') || lowerMessage.includes('401(k)')) {
      accountType = 'traditional401k';
    } else if (lowerMessage.includes('taxable') || lowerMessage.includes('brokerage')) {
      accountType = 'taxable';
    }
    
    const amount = amounts[0] || null;
    const confidence = amount && actionType ? 'high' : amount || actionType ? 'medium' : 'low';
    
    return {
      intent_type: intentType,
      action: intentType === 'simulate_action' ? {
        type: actionType,
        amount: amount,
        goal_name: mentionedGoals[0] || null,
        account_type: accountType,
        category: null,
        time_horizon: null,
      } : undefined,
      mentioned_goals: mentionedGoals,
      mentioned_amounts: amounts,
      confidence,
      clarification_question: confidence === 'low' 
        ? "Could you specify an amount and what you'd like to do? For example: 'Should I invest $500 for my house?'"
        : null,
      user_intent_summary: `User wants to ${actionType || 'discuss'} ${amount ? '$' + amount : 'money'}${mentionedGoals.length ? ' for ' + mentionedGoals.join(', ') : ''}`,
    };
  }
}
