/**
 * API Client for connecting to the Finance Bot backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'investment';
  balance: number;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
  /** True when this goal is the current priority (from "prioritize my most realistic goal") */
  isPriority?: boolean;
}

export interface UserProfile {
  id: string;
  monthlyIncome: number;
  accounts: Account[];
  fixedExpenses: Array<{ category: string; amount: number }>;
  variableSpending: Array<{ category: string; budgetLimit: number; spent: number }>;
  goals: FinancialGoal[];
  /** ID of the goal currently set as priority */
  priority_goal_id?: string;
  /** Financial Stability Mode active (30-day liquidity-first) */
  stabilization_mode?: boolean;
  stabilization_start?: string;
  stabilization_end?: string;
  stabilization_canceled_at?: string;
  riskTolerance: 'low' | 'medium' | 'high';
  liquidityPreference: 'low' | 'medium' | 'high';
}

export interface FinancialAction {
  type: 'save' | 'invest' | 'spend';
  amount: number;
  category?: string;
  goalId?: string;
  targetAccountId?: string;
  timeHorizon?: number;
}

export interface SimulationResult {
  newState: UserProfile;
  impact: {
    accountChanges: Array<{ accountId: string; change: number }>;
    goalImpacts: Array<{ goalId: string; percentageChange: number; daysChange: number }>;
    liquidityImpact: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  alternatives: {
    doNothing: {
      description: string;
      goalImpacts: Array<{ goalId: string; impact: string }>;
    };
  };
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

export interface ComparisonOption {
  action: FinancialAction;
  label: string;
}

export interface ComparisonResult {
  comparison: Array<{
    option: ComparisonOption;
    result: SimulationResult;
  }>;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  /** User profile (sent as userProfile to backend) */
  user: UserProfile;
  message: string;
  /** Previous messages for context (optional; backend also uses conversationId) */
  history?: ChatMessage[];
  /** Conversation ID from previous response – send this so the same thread continues */
  conversationId?: string;
  userId?: string;
}

export interface ChatResponse {
  /** Assistant reply text (backend sends as "reply") */
  reply: string;
  conversationId?: string;
  summary?: string;
  suggestedFollowUps?: string[];
  confidence?: string;
}

export interface AnalyzeRequest {
  user: UserProfile;
  action: FinancialAction;
}

export interface AnalyzeResponse {
  analysis: string;
  recommendation: 'approve' | 'reject' | 'modify';
  modifiedAction?: FinancialAction;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
  risks: string[];
  guardrails: {
    passed: boolean;
    violations: string[];
  };
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string }> {
    return this.request('/health');
  }

  /**
   * Get sample user data
   */
  async getSampleUser(): Promise<UserProfile> {
    return this.request('/sample');
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<UserProfile> {
    return this.request(`/user/${userId}`);
  }

  /**
   * Get user history
   */
  async getUserHistory(userId: string): Promise<any> {
    return this.request(`/user/${userId}/history`);
  }

  /**
   * Simulate a financial action
   */
  async simulate(user: UserProfile, action: FinancialAction): Promise<SimulationResult> {
    return this.request('/simulate', {
      method: 'POST',
      body: JSON.stringify({ user, action }),
    });
  }

  /**
   * Compare multiple financial action options
   */
  async compare(user: UserProfile, options: ComparisonOption[]): Promise<ComparisonResult> {
    return this.request('/compare', {
      method: 'POST',
      body: JSON.stringify({ user, options }),
    });
  }

  /**
   * Execute a financial action (modifies user state)
   */
  async execute(user: UserProfile, action: FinancialAction): Promise<UserProfile> {
    return this.request('/execute', {
      method: 'POST',
      body: JSON.stringify({ user, action }),
    });
  }

  /**
   * Undo last action
   */
  async undo(userId: string): Promise<UserProfile> {
    return this.request('/undo', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  /**
   * Get freeze status
   */
  async getFreezeStatus(): Promise<{ frozen: boolean }> {
    return this.request('/freeze');
  }

  /**
   * Set freeze status
   */
  async setFreezeStatus(frozen: boolean): Promise<{ frozen: boolean }> {
    return this.request('/freeze', {
      method: 'POST',
      body: JSON.stringify({ frozen }),
    });
  }

  /**
   * Chat with AI assistant (streaming not supported in this client)
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.request('/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Analyze a financial action with AI agents
   */
  async analyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    return this.request('/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get goal summary
   */
  async getGoalSummary(user: UserProfile): Promise<any> {
    return this.request('/goals/summary', {
      method: 'POST',
      body: JSON.stringify({ user }),
    });
  }

  /**
   * Get demo scenarios
   */
  async getDemoScenarios(): Promise<any[]> {
    return this.request('/demo/scenarios');
  }

  /**
   * Get specific demo scenario
   */
  async getDemoScenario(id: string): Promise<any> {
    return this.request(`/demo/scenarios/${id}`);
  }

  /**
   * Get AI recommendations
   */
  async getRecommendations(user: UserProfile): Promise<any> {
    return this.request('/recommend', {
      method: 'POST',
      body: JSON.stringify({ user }),
    });
  }

  /**
   * Prioritize most realistic goal: feasibility ranking, set priority, return structured result.
   */
  async prioritizeGoal(userId: string = 'default', userProfile?: UserProfile): Promise<{
    priority_goal: { id: string; name: string; feasibility_score: number; reason: string };
    goal_rankings: Array<{ id: string; name: string; score: number; bottleneck?: string }>;
    capital_reallocations: Array<{ from: string; to: string; amount: number }>;
    updated_user_state: { priority_goal_id: string; goals: Record<string, { priority: boolean }> };
    explanation: string;
    updatedUserProfile?: UserProfile;
  }> {
    return this.request('/priority-goal', {
      method: 'POST',
      body: JSON.stringify({ userId, userProfile }),
    });
  }

  /**
   * Activate 30-day Financial Stability Mode (increase liquidity buffer, reduce non-critical).
   */
  async stabilize(userId: string = 'default', userProfile?: UserProfile): Promise<{
    before: { checking: number; savings: number; totalLiquid: number };
    after: { checking: number; savings: number; totalLiquid: number };
    minimumSafeBuffer: number;
    shortfall: number;
    actions: Array<{ type: string; description: string; amount?: number }>;
    explanation: string;
    stabilization_start: string;
    stabilization_end: string;
    updatedUserProfile?: UserProfile;
  }> {
    return this.request('/stabilize', {
      method: 'POST',
      body: JSON.stringify({ userId, userProfile }),
    });
  }

  /**
   * Cancel Financial Stability Mode (user override).
   */
  async cancelStabilization(userId: string = 'default', userProfile?: UserProfile): Promise<{
    message: string;
    updatedUserProfile?: UserProfile;
  }> {
    return this.request('/stabilize/cancel', {
      method: 'POST',
      body: JSON.stringify({ userId, userProfile }),
    });
  }
}

export const apiClient = new APIClient();
export default apiClient;
