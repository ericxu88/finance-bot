import { FinancialState, DecisionOption } from '@/app/contexts/FinancialContext';

export class BudgetingAgent {
  analyze(state: FinancialState, action: string, amount: number): Partial<DecisionOption> {
    const totalExpenses = state.expenses.reduce((sum, exp) => {
      if (exp.frequency === 'monthly') return sum + exp.amount;
      if (exp.frequency === 'weekly') return sum + exp.amount * 4;
      if (exp.frequency === 'yearly') return sum + exp.amount / 12;
      return sum;
    }, 0);

    const monthlyAvailable = state.monthlyIncome - totalExpenses;
    const checkingBalance = state.accounts.find((a) => a.id === 'checking')?.balance || 0;

    // Analyze constraints and thresholds
    const constraints = {
      hasEmergencyFund: state.accounts.find((a) => a.type === 'savings')!.balance >= state.monthlyIncome * 3,
      monthlyBudgetRemaining: monthlyAvailable,
      cashFlowRatio: monthlyAvailable / state.monthlyIncome,
      liquidityRatio: checkingBalance / totalExpenses,
    };

    // Check if action violates constraints
    let confidence: 'high' | 'medium' | 'low' = 'high';
    let justification = '';

    if (action.toLowerCase().includes('spend')) {
      if (amount > monthlyAvailable) {
        confidence = 'low';
        justification = 'This spending exceeds your monthly available budget.';
      } else if (amount > monthlyAvailable * 0.5) {
        confidence = 'medium';
        justification = 'This spending uses a significant portion of your available budget.';
      } else {
        justification = 'This spending is within your budget constraints.';
      }
    } else if (action.toLowerCase().includes('save')) {
      if (amount <= monthlyAvailable * 0.3) {
        justification = 'This savings amount aligns well with your income.';
      } else {
        confidence = 'medium';
        justification = 'This is an aggressive savings rate but achievable.';
      }
    } else if (action.toLowerCase().includes('invest')) {
      if (!constraints.hasEmergencyFund) {
        confidence = 'medium';
        justification = 'Consider building your emergency fund before investing heavily.';
      } else if (amount > monthlyAvailable * 0.4) {
        confidence = 'medium';
        justification = 'This investment amount is significant. Ensure you maintain adequate liquidity.';
      } else {
        justification = 'Investment amount is reasonable given your financial position.';
      }
    }

    return {
      confidence,
      justification,
    };
  }

  checkUpcomingExpenses(state: FinancialState): string[] {
    const warnings: string[] = [];
    const today = new Date();
    
    // Check if any fixed expenses are due
    const totalMonthlyExpenses = state.expenses
      .filter((e) => e.frequency === 'monthly')
      .reduce((sum, e) => sum + e.amount, 0);

    const checkingBalance = state.accounts.find((a) => a.id === 'checking')?.balance || 0;

    if (checkingBalance < totalMonthlyExpenses * 1.5) {
      warnings.push('Your checking balance is low relative to monthly expenses.');
    }

    return warnings;
  }
}
