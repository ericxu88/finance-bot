import { FinancialState, DecisionOption, FinancialGoal } from '@/app/contexts/FinancialContext';

export class InvestmentAgent {
  // Simple deterministic compounding model
  private calculateCompoundGrowth(
    principal: number,
    monthlyContribution: number,
    annualRate: number,
    months: number
  ): number {
    const monthlyRate = annualRate / 12;
    let balance = principal;

    for (let i = 0; i < months; i++) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
    }

    return balance;
  }

  analyzeInvestment(
    state: FinancialState,
    amount: number,
    targetGoal?: string
  ): {
    projectedReturns: number;
    goalImpact: { goalId: string; percentageChange: number; daysChange: number }[];
    timeHorizon: number;
    riskAssessment: string;
  } {
    // Use conservative 7% annual return for long-term investments
    const annualReturn = state.riskTolerance === 'high' ? 0.09 : state.riskTolerance === 'medium' ? 0.07 : 0.05;

    const investmentAccount = state.accounts.find((a) => a.type === 'investment');
    const currentBalance = investmentAccount?.balance || 0;

    // Calculate impact on goals
    const goalImpacts = state.goals.map((goal) => {
      const monthsToGoal = this.monthsBetween(new Date(), goal.deadline);
      const projectedValue = this.calculateCompoundGrowth(
        currentBalance + amount,
        0,
        annualReturn,
        monthsToGoal
      );

      const currentProjectedValue = this.calculateCompoundGrowth(
        currentBalance,
        0,
        annualReturn,
        monthsToGoal
      );

      const additionalGrowth = projectedValue - currentProjectedValue;
      const remainingAmount = goal.targetAmount - goal.currentAmount;

      let percentageChange = 0;
      let daysChange = 0;

      if (goal.id === targetGoal || goal.priority === 'high') {
        percentageChange = (additionalGrowth / remainingAmount) * 100;

        // Calculate how many days sooner the goal could be achieved
        if (additionalGrowth > 0) {
          const daysPerPercent = (monthsToGoal * 30) / 100;
          daysChange = -Math.floor(percentageChange * daysPerPercent);
        }
      }

      return {
        goalId: goal.id,
        percentageChange: Math.round(percentageChange * 10) / 10,
        daysChange,
      };
    });

    const avgMonthsToGoal = state.goals.reduce(
      (sum, g) => sum + this.monthsBetween(new Date(), g.deadline),
      0
    ) / state.goals.length;

    let riskAssessment = '';
    if (state.riskTolerance === 'low' && amount > state.monthlyIncome * 0.5) {
      riskAssessment = 'This investment amount exceeds your risk tolerance profile.';
    } else if (state.liquidityPreference === 'high' && amount > state.monthlyIncome * 0.3) {
      riskAssessment = 'Consider your liquidity preference - investments are less liquid.';
    } else {
      riskAssessment = 'Investment aligns with your risk tolerance and liquidity preferences.';
    }

    return {
      projectedReturns: this.calculateCompoundGrowth(amount, 0, annualReturn, 12),
      goalImpact: goalImpacts.filter((g) => g.percentageChange > 0),
      timeHorizon: avgMonthsToGoal,
      riskAssessment,
    };
  }

  private monthsBetween(start: Date, end: Date): number {
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                   (end.getMonth() - start.getMonth());
    return Math.max(0, months);
  }

  attributeGrowthToGoals(state: FinancialState): Map<string, number> {
    const attribution = new Map<string, number>();
    const investmentBalance = state.accounts.find((a) => a.type === 'investment')?.balance || 0;

    // Simple proportional attribution based on goal priority and target
    const totalGoalWeight = state.goals.reduce((sum, goal) => {
      const weight = goal.priority === 'high' ? 3 : goal.priority === 'medium' ? 2 : 1;
      return sum + weight;
    }, 0);

    state.goals.forEach((goal) => {
      const weight = goal.priority === 'high' ? 3 : goal.priority === 'medium' ? 2 : 1;
      const attributedAmount = (investmentBalance * weight) / totalGoalWeight;
      attribution.set(goal.id, attributedAmount);
    });

    return attribution;
  }
}
