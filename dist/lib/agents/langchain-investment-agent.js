import { LangChainBaseAgent } from './langchain-base.js';
import { InvestmentAnalysisSchema } from './schemas.js';
import { getInvestmentBalance } from '../../types/financial.js';
export class LangChainInvestmentAgent extends LangChainBaseAgent {
    agentName = 'Investment Agent';
    schema = InvestmentAnalysisSchema;
    constructor() {
        super(0.3);
    }
    systemPrompt = `You are an expert investment analyst specializing in personal financial planning.

Your role is to evaluate investment decisions in the context of a user's complete financial picture.

Key responsibilities:
1. Assess goal alignment - does this investment advance stated financial goals?
2. Evaluate time horizon vs. risk tolerance
3. Consider opportunity cost of investing vs. saving
4. Analyze diversification and portfolio composition
5. Project realistic returns and goal progress

Guidelines:
- Match investment risk to time horizon (short-term goals = lower risk)
- Consider the user's stated risk tolerance
- Be realistic about return assumptions - don't promise unrealistic gains
- Acknowledge market risk and volatility
- For non-investment actions, briefly note the opportunity cost
- Use actual projected values from the simulation

Critical thinking:
- If time horizon is short (<2 years), high-risk investments may not be appropriate
- If risk tolerance is conservative but timeline is long, user might be too conservative
- Always consider what else could be done with this money

Output your analysis in the specified JSON format.`;
    buildAnalysisPrompt(context) {
        const { user, action, simulationResult } = context;
        if (action.type !== 'invest') {
            return this.buildNonInvestmentPrompt(context);
        }
        const goal = user.goals.find(g => g.id === action.goalId);
        const goalImpact = simulationResult.scenarioIfDo.goalImpacts.find(g => g.goalId === action.goalId);
        const yearsToDeadline = goal
            ? (goal.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 365)
            : 5;
        const totalInvestments = getInvestmentBalance(user.accounts.investments.taxable) +
            getInvestmentBalance(user.accounts.investments.rothIRA) +
            getInvestmentBalance(user.accounts.investments.traditional401k);
        const totalAssets = user.accounts.checking +
            user.accounts.savings +
            totalInvestments;
        return `
INVESTMENT ANALYSIS REQUEST

USER INVESTMENT PROFILE:
- Risk Tolerance: ${user.preferences.riskTolerance}
- Current Investment Portfolio: ${this.formatCurrency(totalInvestments)}
  * Taxable Account: ${this.formatCurrency(getInvestmentBalance(user.accounts.investments.taxable))}
  * Roth IRA: ${this.formatCurrency(getInvestmentBalance(user.accounts.investments.rothIRA))}
  * 401(k): ${this.formatCurrency(getInvestmentBalance(user.accounts.investments.traditional401k))}
- Total Assets: ${this.formatCurrency(totalAssets)}
- Current Investment Allocation: ${this.formatPercent(totalInvestments / totalAssets)}

INVESTMENT GOAL:
${goal ? `
- Goal Name: ${goal.name}
- Target Amount: ${this.formatCurrency(goal.targetAmount)}
- Current Progress: ${this.formatCurrency(goal.currentAmount)} (${this.formatPercent(goal.currentAmount / goal.targetAmount)})
- Deadline: ${goal.deadline.toLocaleDateString()} (${yearsToDeadline.toFixed(1)} years away)
- Priority: ${goal.priority}/5
- Time Horizon: ${goal.timeHorizon}
` : 'No specific goal assigned to this investment'}

PROPOSED INVESTMENT:
- Amount: ${this.formatCurrency(action.amount)}
- Account Type: ${action.targetAccountId || 'taxable'}

PROJECTED OUTCOMES:
${goalImpact ? `
- Projected Value (5 years, 7% annual return): ${this.formatCurrency(goalImpact.futureValue || 0)}
- Goal Progress Impact: ${goalImpact.progressChangePct > 0 ? '+' : ''}${goalImpact.progressChangePct.toFixed(2)}%
- Time to Goal Impact: ${Math.abs(goalImpact.timeSaved)} months ${goalImpact.timeSaved >= 0 ? 'faster' : 'slower'}
- Current Progress: ${this.formatPercent(goal.currentAmount / goal.targetAmount)} → ${this.formatPercent((goal.currentAmount + action.amount) / goal.targetAmount)}
` : 'Goal impact not available'}

${this.serializeSimulationResult(simulationResult)}

YOUR TASK:
Evaluate this investment decision considering:
1. Does the time horizon match the risk? (${yearsToDeadline.toFixed(1)} years to goal, risk tolerance: ${user.preferences.riskTolerance})
2. Is this investment aligned with the user's stated goal?
3. Are the return assumptions realistic?
4. What's the opportunity cost vs. keeping in savings?
5. How does this affect overall portfolio diversification?
6. Are there any timing concerns or better alternatives?

Provide specific, data-driven analysis.
    `.trim();
    }
    buildNonInvestmentPrompt(context) {
        const { action, simulationResult } = context;
        return `
The user is performing a ${action.type} action of ${this.formatCurrency(action.amount)}, not an investment.

${this.serializeSimulationResult(simulationResult)}

YOUR TASK:
Briefly note:
1. This is not an investment action
2. The opportunity cost (this money could have been invested for growth)
3. Whether there are any investment considerations the user should be aware of

Keep this analysis brief since investment is not the primary action.
    `.trim();
    }
}
//# sourceMappingURL=langchain-investment-agent.js.map