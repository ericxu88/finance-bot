import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Send, Loader2, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Progress } from '@/app/components/ui/progress';
import { useFinancial } from '@/app/contexts/FinancialContext';
import { DecisionEngine } from '@/app/agents/DecisionEngine';
import { DecisionOption } from '@/app/contexts/FinancialContext';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  options?: DecisionOption[];
  showGoals?: boolean;
  showProgress?: boolean;
  showBudget?: boolean;
  timestamp: Date;
}

interface AIAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function AIAssistant({ isOpen, onToggle }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your Chase Assistant powered by AI. I can help you make smart financial decisions, analyze your spending, and work toward your goals. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { state } = useFinancial();
  const decisionEngine = useRef(new DecisionEngine());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const parseUserIntent = (message: string): { 
    action: string; 
    amount: number | null;
    showGoals: boolean;
    showProgress: boolean;
    showBudget: boolean;
  } => {
    const lowerMessage = message.toLowerCase();
    
    // Extract amount
    const amountMatch = message.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;

    // Check if user wants to see goals
    const showGoals = lowerMessage.includes('goal') || lowerMessage.includes('target');
    const showProgress = lowerMessage.includes('progress') || lowerMessage.includes('how close') || lowerMessage.includes('how far');
    const showBudget = lowerMessage.includes('budget') || lowerMessage.includes('expense') || lowerMessage.includes('spending');

    // Determine action
    let action = 'general';
    if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
      action = 'save';
    } else if (lowerMessage.includes('invest') || lowerMessage.includes('investment')) {
      action = 'invest';
    } else if (lowerMessage.includes('spend') || lowerMessage.includes('spending')) {
      action = 'spend';
    } else if (showGoals) {
      action = 'goals';
    } else if (showBudget) {
      action = 'budget';
    }

    return { action, amount, showGoals, showProgress, showBudget };
  };

  const generateResponse = async (userMessage: string): Promise<Message> => {
    const intent = parseUserIntent(userMessage);

    // Handle goal inquiries with visual display
    if (intent.action === 'goals' || intent.showGoals) {
      const goalProgress = state.goals.map((goal) => {
        const progress = (goal.currentAmount / goal.targetAmount) * 100;
        return {
          name: goal.name,
          progress,
          current: goal.currentAmount,
          target: goal.targetAmount,
          priority: goal.priority,
        };
      }).sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Here are your current financial goals:`,
        showGoals: true,
        timestamp: new Date(),
      };
    }

    // Handle progress inquiries
    if (intent.showProgress) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Here's a detailed view of your progress toward your financial goals:`,
        showProgress: true,
        timestamp: new Date(),
      };
    }

    // Handle budget inquiries
    if (intent.action === 'budget' || intent.showBudget) {
      const totalExpenses = state.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const available = state.monthlyIncome - totalExpenses;

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Your monthly budget breakdown:

**Monthly Income:** $${state.monthlyIncome.toFixed(2)}
**Total Expenses:** $${totalExpenses.toFixed(2)}
**Available for Savings/Investments:** $${available.toFixed(2)}

You're currently spending ${((totalExpenses / state.monthlyIncome) * 100).toFixed(1)}% of your income, which leaves you with ${((available / state.monthlyIncome) * 100).toFixed(1)}% for your financial goals.`,
        showBudget: true,
        timestamp: new Date(),
      };
    }

    // Handle decision simulations
    if (intent.amount && (intent.action === 'save' || intent.action === 'invest' || intent.action === 'spend')) {
      const options = await decisionEngine.current.simulateOptions(state, intent.action, intent.amount);

      if (options.length === 0) {
        return {
          id: Date.now().toString(),
          role: 'assistant',
          content: `I analyzed your request to ${intent.action} $${intent.amount}, but I don't have enough information to provide recommendations. Could you provide more details?`,
          timestamp: new Date(),
        };
      }

      const bestOption = options[0];
      const goalImpactText = bestOption.impact.goalImpacts.length > 0
        ? '\n\n**Goal Impact:**' + bestOption.impact.goalImpacts.map((impact) => {
            const goal = state.goals.find((g) => g.id === impact.goalId);
            return `\n• **${goal?.name}**: ${impact.percentageChange > 0 ? '+' : ''}${impact.percentageChange.toFixed(1)}% progress${impact.daysChange < 0 ? `, ${Math.abs(impact.daysChange)} days sooner` : ''}`;
          }).join('')
        : '';

      const content = `Based on your financial situation, here's my recommendation:

**${bestOption.action}**
${bestOption.description}${goalImpactText}

**Risk Level:** ${bestOption.impact.riskLevel}
**Confidence:** ${bestOption.confidence}

**Analysis:** ${bestOption.justification}

I've prepared ${options.length} alternative options for you to compare.`;

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content,
        options,
        timestamp: new Date(),
      };
    }

    // Handle account balance inquiries
    if (userMessage.toLowerCase().includes('balance') || userMessage.toLowerCase().includes('account')) {
      const checking = state.accounts.find(a => a.id === 'checking');
      const savings = state.accounts.find(a => a.id === 'savings');
      const investment = state.accounts.find(a => a.id === 'investment');
      const total = state.accounts.reduce((sum, a) => sum + a.balance, 0);

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Here's your current account summary:

**Checking Account:** $${checking?.balance.toFixed(2)}
**Savings Account:** $${savings?.balance.toFixed(2)}
**Investment Account:** $${investment?.balance.toFixed(2)}

**Total Balance:** $${total.toFixed(2)}`,
        timestamp: new Date(),
      };
    }

    // Default helpful response
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: `I can help you with:

• **Financial Goals** - Ask "Show me my goals" or "What are my financial goals?"
• **Budget Analysis** - Ask "Show me my budget" or "What are my expenses?"
• **Account Balances** - Ask "What's my balance?" or "Show my accounts"
• **Decision Simulation** - Ask "What if I save $300?" or "Should I invest $500?"
• **Progress Tracking** - Ask "Show my progress" or "How am I doing?"

What would you like to explore?`,
      timestamp: new Date(),
    };
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await generateResponse(input);
      setMessages((prev) => [...prev, response]);
    } catch (error) {
      console.error('Error generating response:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: "I'm sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 right-0 w-[350px] bg-white shadow-2xl z-50 flex flex-col"
          style={{ 
            height: '710px',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
          }}
        >
          {/* Header - matching Chase design */}
          <div className="bg-[#005EB8] text-white p-4 flex items-center justify-between" style={{ borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
            <div>
              <h3 className="font-bold text-[15px]">Chase Assistant</h3>
              <p className="text-[12px] opacity-90">Powered by AI</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onToggle}
                className="hover:bg-white/20 rounded p-1 transition-colors"
                aria-label="Minimize assistant"
              >
                <ChevronDown className="size-5" />
              </button>
              <button
                onClick={onToggle}
                className="hover:bg-white/20 rounded p-1 transition-colors"
                aria-label="Close assistant"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F4F6F8]">
            {messages.map((message) => (
              <div key={message.id}>
                <div
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-[#005EB8] text-white'
                        : 'bg-white text-black shadow-sm'
                    }`}
                  >
                    <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    
                    {/* Show Goals List */}
                    {message.showGoals && (
                      <div className="mt-3 space-y-3 border-t border-gray-200 pt-3">
                        {state.goals.map((goal) => {
                          const progress = (goal.currentAmount / goal.targetAmount) * 100;
                          return (
                            <div key={goal.id} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold">{goal.name}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] ${
                                  goal.priority === 'high' ? 'bg-red-100 text-red-700' :
                                  goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {goal.priority}
                                </span>
                              </div>
                              <Progress value={progress} className="h-2" />
                              <div className="flex items-center justify-between text-[10px] text-gray-600">
                                <span>${goal.currentAmount.toFixed(0)} of ${goal.targetAmount.toFixed(0)}</span>
                                <span>{progress.toFixed(1)}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Show Progress Details */}
                    {message.showProgress && (
                      <div className="mt-3 space-y-3 border-t border-gray-200 pt-3">
                        {state.goals.map((goal) => {
                          const progress = (goal.currentAmount / goal.targetAmount) * 100;
                          const remaining = goal.targetAmount - goal.currentAmount;
                          const daysToDeadline = Math.floor((goal.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                          
                          return (
                            <div key={goal.id} className="bg-gray-50 rounded p-2 space-y-2">
                              <div className="font-semibold text-xs">{goal.name}</div>
                              <Progress value={progress} className="h-2" />
                              <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div>
                                  <div className="text-gray-600">Saved</div>
                                  <div className="font-semibold">${goal.currentAmount.toFixed(0)}</div>
                                </div>
                                <div>
                                  <div className="text-gray-600">Remaining</div>
                                  <div className="font-semibold text-orange-600">${remaining.toFixed(0)}</div>
                                </div>
                                <div>
                                  <div className="text-gray-600">Progress</div>
                                  <div className="font-semibold text-blue-600">{progress.toFixed(1)}%</div>
                                </div>
                                <div>
                                  <div className="text-gray-600">Days left</div>
                                  <div className="font-semibold">{daysToDeadline}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Show Budget Breakdown */}
                    {message.showBudget && (
                      <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
                        <div className="text-xs font-semibold mb-2">Expense Breakdown:</div>
                        {state.expenses.map((expense) => {
                          const percentage = (expense.amount / state.monthlyIncome) * 100;
                          return (
                            <div key={expense.id} className="space-y-1">
                              <div className="flex items-center justify-between text-[10px]">
                                <span>{expense.category}</span>
                                <span className="font-semibold">${expense.amount.toFixed(2)}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-[#0088FF] h-1.5 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Show Decision Options */}
                    {message.options && message.options.length > 0 && (
                      <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
                        <div className="text-xs font-semibold mb-2">Alternative Options:</div>
                        {message.options.map((option, idx) => (
                          <div
                            key={option.id}
                            className="w-full text-left text-[11px] p-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors"
                          >
                            <div className="font-medium text-[#005EB8] mb-1">{option.action}</div>
                            <div className="text-gray-600 text-[10px] space-y-0.5">
                              <div>Confidence: <span className="font-semibold">{option.confidence}</span></div>
                              <div>Risk: <span className="font-semibold">{option.impact.riskLevel}</span></div>
                              {option.impact.goalImpacts.length > 0 && (
                                <div className="mt-1 text-blue-600">
                                  {option.impact.goalImpacts[0].percentageChange > 0 ? '+' : ''}
                                  {option.impact.goalImpacts[0].percentageChange.toFixed(1)}% toward goal
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Timestamp */}
                <p className={`text-[10px] text-gray-500 mt-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {message.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <Loader2 className="size-4 animate-spin text-[#005EB8]" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 text-[13px]"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="bg-[#005EB8] hover:bg-[#004d8c] shrink-0"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
