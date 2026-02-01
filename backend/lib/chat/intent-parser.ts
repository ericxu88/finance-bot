/**
 * Intent Parser
 * 
 * Converts natural language user messages into structured financial actions.
 * Uses LLM to extract intent, amount, goal, and other parameters.
 * Now includes conversation history for contextual understanding.
 */

import { ChatOpenAI } from '@langchain/openai';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { z } from 'zod';
import type { UserProfile } from '../../types/financial.js';
import { getInvestmentBalance } from '../../types/financial.js';

// Conversation message for context
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

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
    // Action intents for modifying data
    'transfer_money',       // User wants to move money between accounts
    'create_goal',          // User wants to create a new financial goal
    'update_budget',        // User wants to modify a budget category
    'execute_action',       // User confirms to execute a previously suggested action
    // Quick query intents (no LLM needed)
    'check_balance',        // User asks about account balance(s)
    'list_goals',           // User asks to see their goals
    'show_budget',          // User asks about budget/spending
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
  
  // NEW: For transfer_money intent
  transfer: z.object({
    from_account: z.string().nullable(),     // "checking", "savings", etc.
    to_account: z.string().nullable(),       // "checking", "savings", "investment", etc.
    amount: z.number().nullable(),
  }).optional(),
  
  // NEW: For create_goal intent
  new_goal: z.object({
    name: z.string().nullable(),
    target_amount: z.number().nullable(),
    deadline_months: z.number().nullable(),  // Months from now
    priority: z.number().nullable(),         // 1-10
  }).optional(),
  
  // NEW: For update_budget intent
  budget_update: z.object({
    category_name: z.string().nullable(),
    new_amount: z.number().nullable(),
    action: z.enum(['increase', 'decrease', 'set']).nullable(),
  }).optional(),
  
  // Extracted entities
  mentioned_goals: z.array(z.string()),      // Goals mentioned in message
  mentioned_amounts: z.array(z.number()),    // Amounts mentioned
  
  // Parser confidence
  confidence: z.enum(['high', 'medium', 'low']),
  clarification_question: z.string().nullable(), // If clarification needed
  
  // Original message summary
  user_intent_summary: z.string(),
  
  // NEW: Whether this is a confirmation of a previous suggestion
  is_confirmation: z.boolean().optional(),
});

export type ParsedIntent = z.infer<typeof ParsedIntentSchema>;

export class IntentParser {
  private model: ChatOpenAI;
  private parser: StructuredOutputParser<typeof ParsedIntentSchema>;
  
  constructor() {
    const apiKey = process.env.OPEN_AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY (or OPEN_AI_API_KEY) required for chat functionality. Get one at https://platform.openai.com/api-keys');
    }
    
    const modelName = process.env.OPENAI_MODEL || 'o1-preview';
    
    this.model = new ChatOpenAI({
      model: modelName,
      temperature: 0.1, // Low temperature for consistent parsing
      apiKey,
      maxTokens: 2048,
      maxRetries: 1,
    });
    
    this.parser = StructuredOutputParser.fromZodSchema(ParsedIntentSchema);
  }
  
  async parse(
    message: string, 
    userProfile: UserProfile,
    conversationHistory?: ConversationMessage[]
  ): Promise<ParsedIntent> {
    const formatInstructions = this.parser.getFormatInstructions();
    
    // Build context about user's goals for better entity extraction
    const goalsContext = userProfile.goals
      .map(g => `- "${g.name}" (ID: ${g.id}, target: $${g.targetAmount}, current: $${g.currentAmount})`)
      .join('\n');
    
    const accountsContext = `
- Checking: $${userProfile.accounts.checking}
- Savings: $${userProfile.accounts.savings}
- Taxable investments: $${getInvestmentBalance(userProfile.accounts.investments.taxable)}
- Roth IRA: $${getInvestmentBalance(userProfile.accounts.investments.rothIRA)}
- 401k: $${getInvestmentBalance(userProfile.accounts.investments.traditional401k)}`;

    // Build conversation history context (last 4 messages for context)
    let conversationContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-4);
      conversationContext = `
RECENT CONVERSATION:
${recentHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content.substring(0, 300)}${msg.content.length > 300 ? '...' : ''}`).join('\n')}

IMPORTANT: The current message may be a follow-up to the conversation above.
- If the user says "Yes", "Sure", "Do it", "Okay", etc., they are likely agreeing to the assistant's last suggestion.
- If the user mentions "that" or "it" without specifics, refer to what was last discussed.
- Extract amounts, goals, and action types from the conversation context if not in the current message.
`;
    }
    
    const prompt = PromptTemplate.fromTemplate(`You are a financial intent parser. Extract the user's intent from their message, considering conversation context.

USER'S FINANCIAL CONTEXT:
Monthly Income: $${userProfile.monthlyIncome}

Accounts:
${accountsContext}

Financial Goals:
${goalsContext}
{conversation_context}
CURRENT USER MESSAGE: "{message}"

INSTRUCTIONS:
1. Determine the intent_type based on what the user wants to do
2. Extract any specific amounts, goals, or accounts mentioned
3. If the user mentions a goal by name, match it to one of their existing goals
4. IMPORTANT: If this is a follow-up message (like "Yes", "Sure", "Do it"), look at the conversation context to understand what the user is agreeing to
5. Set confidence to "high" if you can determine intent from context, even for short messages like "Yes"
6. If clarification is needed, provide a helpful clarification_question

INTENT TYPES:
- simulate_action: User wants to know what happens if they save/invest/spend (includes agreeing to a suggested action)
- compare_options: User wants to compare multiple choices
- get_recommendation: User asks "what should I do?" or wants advice
- check_goal_progress: User asks about goal status
- explain_tradeoffs: User wants to understand pros/cons
- general_question: General financial question
- clarification_needed: Can't determine intent even with context
- transfer_money: User wants to ACTUALLY move money between accounts (e.g., "Move $500 from checking to savings")
- create_goal: User wants to CREATE a new financial goal (e.g., "I want to save for a car")
- update_budget: User wants to CHANGE their budget allocations (e.g., "Increase my dining budget to $300")
- execute_action: User confirms they want to execute a previously suggested or simulated action (e.g., "Yes, do it", "Go ahead")
- check_balance: User asks about their account balance(s) (e.g., "What's my checking balance?", "How much do I have?")
- list_goals: User asks to see their financial goals (e.g., "What are my goals?", "Show me my savings goals")
- show_budget: User asks about their budget or spending (e.g., "How much have I spent on dining?", "What's my budget?")

{format_instructions}

Return ONLY the JSON object, no markdown code blocks.`);

    const chain = RunnableSequence.from([prompt, this.model]);
    
    try {
      const response = await chain.invoke({
        message,
        conversation_context: conversationContext,
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
 * Now supports conversation context for follow-up messages
 */
export class MockIntentParser {
  async parse(
    message: string, 
    userProfile: UserProfile,
    conversationHistory?: ConversationMessage[]
  ): Promise<ParsedIntent> {
    const lowerMessage = message.toLowerCase().trim();
    
    // Check if this is a follow-up/affirmative response
    const affirmativeResponses = ['yes', 'sure', 'okay', 'ok', 'do it', 'go ahead', 'yeah', 'yep', 'yup', 'please', 'sounds good', 'let\'s do it'];
    const isAffirmative = affirmativeResponses.some(r => lowerMessage === r || lowerMessage.startsWith(r + ' ') || lowerMessage.startsWith(r + ','));
    
    // If affirmative, try to extract context from last assistant message
    if (isAffirmative && conversationHistory && conversationHistory.length > 0) {
      const lastAssistantMessage = [...conversationHistory].reverse().find(m => m.role === 'assistant');
      if (lastAssistantMessage) {
        const assistantContent = lastAssistantMessage.content.toLowerCase();
        
        // Extract amount from assistant's last message
        const amountMatch = lastAssistantMessage.content.match(/\$(\d+(?:,\d{3})*)/);
        const contextAmount = amountMatch && amountMatch[1] ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;
        
        // Determine action type from context
        let contextActionType: 'save' | 'invest' | 'spend' | null = null;
        if (assistantContent.includes('save') || assistantContent.includes('saving')) {
          contextActionType = 'save';
        } else if (assistantContent.includes('invest') || assistantContent.includes('investing')) {
          contextActionType = 'invest';
        } else if (assistantContent.includes('spend')) {
          contextActionType = 'spend';
        }
        
        // Extract goal from context
        let contextGoal: string | null = null;
        for (const goal of userProfile.goals) {
          if (assistantContent.includes(goal.name.toLowerCase())) {
            contextGoal = goal.name;
            break;
          }
        }
        
        if (contextAmount && contextActionType) {
          return {
            intent_type: 'simulate_action',
            action: {
              type: contextActionType,
              amount: contextAmount,
              goal_name: contextGoal,
              account_type: null,
              category: null,
              time_horizon: null,
            },
            mentioned_goals: contextGoal ? [contextGoal] : [],
            mentioned_amounts: [contextAmount],
            confidence: 'high',
            clarification_question: null,
            user_intent_summary: `User confirmed: ${contextActionType} $${contextAmount}${contextGoal ? ' for ' + contextGoal : ''}`,
          };
        }
      }
    }
    
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
    
    // QUICK QUERIES: Detect balance, goals, budget queries (no LLM needed)
    const balancePatterns = [
      /(?:what(?:'s| is)|how much|show|check|my)\s+(?:my\s+)?(?:checking|savings|balance|account)/i,
      /(?:balance|money|funds)\s+(?:in|do i have)/i,
      /how much (?:do i have|money|is in)/i,
      /(?:checking|savings)\s+(?:balance|account)/i,
    ];
    const isBalanceQuery = balancePatterns.some(p => p.test(message));
    
    const goalsPatterns = [
      /(?:what|show|list|see)\s+(?:are\s+)?(?:my\s+)?goals?/i,
      /(?:my\s+)?(?:financial\s+)?goals?\s+(?:list|status|progress)/i,
      /(?:show|tell)\s+me\s+(?:my\s+)?goals?/i,
    ];
    const isGoalsQuery = goalsPatterns.some(p => p.test(message));
    
    const budgetPatterns2 = [
      /(?:what(?:'s| is)|how much|show|check)\s+(?:my\s+)?(?:budget|spending)/i,
      /(?:spent|spending)\s+(?:on|in|for)\s+\w+/i,
      /budget\s+(?:for|on)\s+\w+/i,
      /how much (?:have i|did i) (?:spend|spent)/i,
    ];
    const isBudgetQuery = budgetPatterns2.some(p => p.test(message));
    
    // Handle quick queries first (they take priority)
    if (isBalanceQuery) {
      return {
        intent_type: 'check_balance',
        mentioned_goals: [],
        mentioned_amounts: [],
        confidence: 'high',
        clarification_question: null,
        user_intent_summary: 'User wants to check account balance',
      };
    }
    
    if (isGoalsQuery) {
      return {
        intent_type: 'list_goals',
        mentioned_goals: mentionedGoals,
        mentioned_amounts: [],
        confidence: 'high',
        clarification_question: null,
        user_intent_summary: 'User wants to see their financial goals',
      };
    }
    
    // Check if this is a budget UPDATE (not just a query)
    const budgetUpdatePatterns = [
      /(?:change|update|set|adjust|increase|decrease|modify)\s+(?:my\s+)?(?:\w+\s+)?budget/i,
      /budget\s+(?:for\s+)?\w+\s+(?:to|should be|at)\s+\$?\d+/i,
    ];
    const isBudgetUpdateIntent = budgetUpdatePatterns.some(p => p.test(message));
    
    if (isBudgetQuery && !isBudgetUpdateIntent) {
      // Extract category if mentioned
      const categories = ['groceries', 'dining', 'entertainment', 'shopping', 'transportation', 'utilities'];
      let queriedCategory: string | null = null;
      for (const cat of categories) {
        if (lowerMessage.includes(cat)) {
          queriedCategory = cat;
          break;
        }
      }
      
      return {
        intent_type: 'show_budget',
        budget_update: queriedCategory ? {
          category_name: queriedCategory,
          new_amount: null,
          action: null,
        } : undefined,
        mentioned_goals: [],
        mentioned_amounts: [],
        confidence: 'high',
        clarification_question: null,
        user_intent_summary: queriedCategory 
          ? `User wants to check ${queriedCategory} budget/spending`
          : 'User wants to see their budget overview',
      };
    }
    
    // Detect transfer intent
    const transferPatterns = [
      /move\s+\$?\d+.*(?:from|to).*(?:checking|savings|investment)/i,
      /transfer\s+\$?\d+.*(?:from|to)/i,
      /(?:from|to)\s+(?:checking|savings).*\$?\d+/i,
    ];
    const isTransfer = transferPatterns.some(p => p.test(message));
    
    // NEW: Detect create goal intent
    const createGoalPatterns = [
      /(?:create|add|start|new|set up)\s+(?:a\s+)?(?:goal|savings goal)/i,
      /(?:want|like) to (?:save|start saving) for/i,
      /(?:set|make)\s+(?:a\s+)?goal/i,
    ];
    const isCreateGoal = createGoalPatterns.some(p => p.test(message));
    
    // NEW: Detect budget update intent
    const budgetPatterns = [
      /(?:change|update|set|adjust|increase|decrease|modify)\s+(?:my\s+)?(?:\w+\s+)?budget/i,
      /budget\s+(?:for\s+)?\w+\s+(?:to|should be|at)\s+\$?\d+/i,
    ];
    const isBudgetUpdate = budgetPatterns.some(p => p.test(message));
    
    // NEW: Detect execute/confirm intent
    const executePatterns = [
      /(?:go ahead|do it|execute|confirm|yes|sure|proceed|make it happen|let's do it)/i,
    ];
    const isExecute = executePatterns.some(p => p.test(lowerMessage)) && conversationHistory && conversationHistory.length > 0;
    
    if (isTransfer && amounts.length > 0) {
      intentType = 'transfer_money';
    } else if (isCreateGoal) {
      intentType = 'create_goal';
    } else if (isBudgetUpdate) {
      intentType = 'update_budget';
    } else if (isExecute) {
      intentType = 'execute_action';
    } else if (lowerMessage.includes('compare') || lowerMessage.includes('vs') || lowerMessage.includes(' or ')) {
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
    let fromAccount: string | null = null;
    let toAccount: string | null = null;
    
    if (lowerMessage.includes('roth') || lowerMessage.includes('ira')) {
      accountType = 'rothIRA';
    } else if (lowerMessage.includes('401k') || lowerMessage.includes('401(k)')) {
      accountType = 'traditional401k';
    } else if (lowerMessage.includes('taxable') || lowerMessage.includes('brokerage')) {
      accountType = 'taxable';
    }
    
    // Extract from/to accounts for transfers
    if (intentType === 'transfer_money') {
      if (lowerMessage.includes('from checking') || lowerMessage.includes('from my checking')) {
        fromAccount = 'checking';
      } else if (lowerMessage.includes('from savings') || lowerMessage.includes('from my savings')) {
        fromAccount = 'savings';
      }
      
      if (lowerMessage.includes('to savings') || lowerMessage.includes('to my savings')) {
        toAccount = 'savings';
      } else if (lowerMessage.includes('to checking') || lowerMessage.includes('to my checking')) {
        toAccount = 'checking';
      } else if (lowerMessage.includes('to invest') || lowerMessage.includes('to investment')) {
        toAccount = 'investment';
      }
    }
    
    // Extract goal details for create_goal
    let newGoalName: string | null = null;
    let newGoalAmount: number | null = null;
    let newGoalMonths: number | null = null;
    
    if (intentType === 'create_goal') {
      // Try to extract goal name (e.g., "save for a car", "new goal for vacation")
      const goalNameMatch = message.match(/(?:save for|saving for|goal for|goal:)\s+(?:a\s+)?([a-zA-Z\s]+?)(?:\.|,|\s+with|\s+of|\s+\$|\s*$)/i);
      if (goalNameMatch?.[1]) {
        newGoalName = goalNameMatch[1].trim();
      }
      newGoalAmount = amounts[0] || null;
      
      // Extract timeline (e.g., "in 6 months", "by next year")
      const monthsMatch = message.match(/(?:in|within)\s+(\d+)\s+months?/i);
      if (monthsMatch?.[1]) {
        newGoalMonths = parseInt(monthsMatch[1]);
      }
    }
    
    // Extract budget category for update_budget
    let budgetCategory: string | null = null;
    let budgetAction: 'increase' | 'decrease' | 'set' | null = null;
    
    if (intentType === 'update_budget') {
      // Find which category
      const categories = ['groceries', 'dining', 'entertainment', 'shopping', 'transportation', 'utilities'];
      for (const cat of categories) {
        if (lowerMessage.includes(cat)) {
          budgetCategory = cat;
          break;
        }
      }
      
      if (lowerMessage.includes('increase')) {
        budgetAction = 'increase';
      } else if (lowerMessage.includes('decrease') || lowerMessage.includes('reduce')) {
        budgetAction = 'decrease';
      } else {
        budgetAction = 'set';
      }
    }
    
    const amount = amounts[0] || null;
    const confidence = amount && (actionType || intentType !== 'general_question') ? 'high' : amount || actionType ? 'medium' : 'low';
    
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
      transfer: intentType === 'transfer_money' ? {
        from_account: fromAccount,
        to_account: toAccount,
        amount: amount,
      } : undefined,
      new_goal: intentType === 'create_goal' ? {
        name: newGoalName,
        target_amount: newGoalAmount,
        deadline_months: newGoalMonths,
        priority: null,
      } : undefined,
      budget_update: intentType === 'update_budget' ? {
        category_name: budgetCategory,
        new_amount: amount,
        action: budgetAction,
      } : undefined,
      mentioned_goals: mentionedGoals,
      mentioned_amounts: amounts,
      confidence,
      clarification_question: confidence === 'low' 
        ? "Could you please provide more details about what you would like to discuss or ask?"
        : null,
      user_intent_summary: this.buildIntentSummary(intentType, actionType, amount, mentionedGoals, fromAccount, toAccount, newGoalName, budgetCategory),
      is_confirmation: intentType === 'execute_action',
    };
  }
  
  private buildIntentSummary(
    intentType: string, 
    actionType: string | null, 
    amount: number | null, 
    mentionedGoals: string[],
    fromAccount: string | null,
    toAccount: string | null,
    newGoalName: string | null,
    budgetCategory: string | null
  ): string {
    switch (intentType) {
      case 'transfer_money':
        return `User wants to transfer ${amount ? '$' + amount : 'money'} from ${fromAccount || 'account'} to ${toAccount || 'account'}`;
      case 'create_goal':
        return `User wants to create a goal${newGoalName ? ': ' + newGoalName : ''}${amount ? ' for $' + amount : ''}`;
      case 'update_budget':
        return `User wants to update ${budgetCategory || 'budget'}${amount ? ' to $' + amount : ''}`;
      case 'execute_action':
        return 'User confirms to execute the suggested action';
      default:
        return `User wants to ${actionType || 'discuss'} ${amount ? '$' + amount : 'finances'}${mentionedGoals.length ? ' for ' + mentionedGoals.join(', ') : ''}`;
    }
  }
}
