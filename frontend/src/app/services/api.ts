// API Service Layer - Connects frontend to backend

const API_BASE = '/api';

export interface BackendAccount {
  checking: number;
  savings: number;
  investments: {
    taxable: number | { balance: number };
    rothIRA: number | { balance: number };
    traditional401k: number | { balance: number };
  };
}

export interface BackendGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  priority: number;
  timeHorizon: 'short' | 'medium' | 'long';
  linkedAccountIds: string[];
}

export interface BackendSpendingCategory {
  id: string;
  name: string;
  monthlyBudget: number;
  currentSpent: number;
  transactions: Array<{
    id: string;
    date: string;
    amount: number;
    category: string;
    description: string;
    type: 'expense' | 'income' | 'transfer';
  }>;
}

export interface BackendFixedExpense {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'annual';
  dueDay?: number;
}

export interface BackendUserProfile {
  id: string;
  name: string;
  monthlyIncome: number;
  accounts: BackendAccount;
  fixedExpenses: BackendFixedExpense[];
  spendingCategories: BackendSpendingCategory[];
  goals: BackendGoal[];
  preferences: {
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    liquidityPreference: 'high' | 'medium' | 'low';
    guardrails: Array<{
      id: string;
      rule: string;
      type: string;
      accountId?: string;
      threshold?: number;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ChatResponse {
  conversationId: string;
  reply: string;
  summary?: string;
  details?: string;
  suggestedFollowUps?: string[];
  shouldProceed?: boolean;
  confidence?: string;
  intent?: {
    type: string;
    action?: {
      type: string;
      amount: number;
      goalId?: string;
    };
    mentionedGoals?: string[];
    mentionedAmounts?: number[];
  };
  metadata?: {
    executionTimeMs: number;
    timestamp: string;
  };
}

export interface GoalSummary {
  goalId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  progress: number;
  monthsRemaining: number;
  monthlyNeeded: number;
  status: 'on_track' | 'behind' | 'at_risk' | 'completed';
}

export interface BudgetCategory {
  name: string;
  monthlyBudget: number;
  currentSpent: number;
  percentUsed: number;
  status: 'under' | 'good' | 'warning' | 'over';
  subcategories?: Array<{
    name: string;
    monthlyBudget: number;
    currentSpent: number;
    percentUsed: number;
  }>;
}

export interface BudgetAnalysis {
  totalBudget: number;
  totalSpent: number;
  percentUsed: number;
  categories: BudgetCategory[];
}

export interface ExecuteTransactionRequest {
  type: 'save' | 'invest' | 'transfer';
  amount: number;
  fromAccountId: string;
  toAccountId?: string;
  goalId?: string;
  description?: string;
}

export interface ExecuteTransactionResponse {
  success: boolean;
  message: string;
  updatedUser?: BackendUserProfile;
  transactionId?: string;
}

// Fetch user profile
export async function fetchUserProfile(): Promise<BackendUserProfile> {
  const response = await fetch(`${API_BASE}/user/profile`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.status}`);
  }
  return response.json();
}

// Send chat message with streaming
export async function sendChatMessageStream(
  message: string,
  conversationId?: string,
  onStatus?: (status: string) => void,
  onComplete?: (response: ChatResponse) => void,
  onError?: (error: string) => void
): Promise<void> {
  const response = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      conversationId,
      mode: 'fast', // Use fast mode for responsive UI
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let currentEventType: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEventType = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        const dataStr = line.slice(6);
        if (dataStr === '[DONE]') continue;

        try {
          const data = JSON.parse(dataStr);

          if (currentEventType === 'status' && onStatus) {
            onStatus(data.message);
          } else if (currentEventType === 'complete' && onComplete) {
            onComplete({
              conversationId: data.conversationId,
              reply: data.reply,
              summary: data.summary,
              suggestedFollowUps: data.suggestedFollowUps,
              shouldProceed: data.shouldProceed,
              confidence: data.confidence,
              metadata: {
                executionTimeMs: data.executionTimeMs,
                timestamp: new Date().toISOString(),
              },
            });
          } else if (currentEventType === 'error' && onError) {
            onError(data.message);
          }
        } catch {
          // Ignore parse errors for partial data
        }
      }
    }
  }
}

// Non-streaming chat fallback
export async function sendChatMessage(
  message: string,
  conversationId?: string
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      conversationId,
      fastMode: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.status}`);
  }

  return response.json();
}

// Get goals summary
export async function getGoalsSummary(): Promise<GoalSummary[]> {
  const response = await fetch(`${API_BASE}/goals/summary/sample`);
  if (!response.ok) {
    throw new Error(`Failed to fetch goals: ${response.status}`);
  }
  return response.json();
}

// Get budget analysis
export async function getBudgetAnalysis(): Promise<{ analysis: BudgetAnalysis; message: string }> {
  const response = await fetch(`${API_BASE}/budget/analysis/sample`);
  if (!response.ok) {
    throw new Error(`Failed to fetch budget: ${response.status}`);
  }
  return response.json();
}

// Execute transaction
export async function executeTransaction(
  request: ExecuteTransactionRequest
): Promise<ExecuteTransactionResponse> {
  const response = await fetch(`${API_BASE}/transactions/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `Transaction failed: ${response.status}`);
  }

  return response.json();
}

// Get investment reminder
export async function getInvestmentReminder(): Promise<{
  hasReminder: boolean;
  shouldRemind?: boolean;
  message?: string;
  reminder?: {
    urgency: string;
    message: string;
    recommendedAmount?: number;
  };
}> {
  const response = await fetch(`${API_BASE}/investments/reminders/sample`);
  if (!response.ok) {
    throw new Error(`Failed to fetch reminder: ${response.status}`);
  }
  return response.json();
}

// Reset user state (for demos)
export async function resetUserState(): Promise<BackendUserProfile> {
  const response = await fetch(`${API_BASE}/user/profile/reset`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to reset user state: ${response.status}`);
  }
  const data = await response.json();
  return data.user;
}
