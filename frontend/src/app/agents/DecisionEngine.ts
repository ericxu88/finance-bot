import { FinancialState, DecisionOption } from '@/app/contexts/FinancialContext';
import { BudgetingAgent } from './BudgetingAgent';
import { InvestmentAgent } from './InvestmentAgent';
import { GuardrailAgent } from './GuardrailAgent';
import { ValidationAgent } from './ValidationAgent';

export class DecisionEngine {
  private budgetingAgent = new BudgetingAgent();
  private investmentAgent = new InvestmentAgent();
  private guardrailAgent = new GuardrailAgent();
  private validationAgent = new ValidationAgent();

  async simulateOptions(
    state: FinancialState,
    action: string,
    amount: number
  ): Promise<DecisionOption[]> {
    const options: DecisionOption[] = [];

    // Determine action type
    const actionLower = action.toLowerCase();
    
    if (actionLower.includes('save') || actionLower.includes('allocate')) {
      options.push(...this.generateSavingOptions(state, amount));
    } else if (actionLower.includes('invest')) {
      options.push(...this.generateInvestmentOptions(state, amount));
    } else if (actionLower.includes('spend')) {
      options.push(...this.generateSpendingOptions(state, amount));
    } else {
      // Generic - provide all types
      options.push(...this.generateSavingOptions(state, amount));
      options.push(...this.generateInvestmentOptions(state, amount));
    }

    // Validate all options
    const validation = this.validationAgent.validate(options);
    
    if (!validation.isValid) {
      console.warn('Validation issues:', validation.issues);
    }

    if (validation.warnings.length > 0) {
      console.warn('Validation warnings:', validation.warnings);
    }

    // Filter out invalid options
    const validOptions = options.filter((option) => {
      const hasIssues = validation.issues.some((issue) => issue.includes(option.action));
      return !hasIssues;
    });

    return validOptions.slice(0, 3); // Return top 3 options
  }

  private generateSavingOptions(state: FinancialState, amount: number): DecisionOption[] {
    const options: DecisionOption[] = [];

    // Option 1: Save to emergency fund
    const emergencyGoal = state.goals.find((g) => g.id === 'emergency');
    if (emergencyGoal) {
      const budgetAnalysis = this.budgetingAgent.analyze(state, 'save', amount);
      const violations = this.guardrailAgent.checkConstraints(state, 'save', amount);
      
      const percentageToGoal = (amount / (emergencyGoal.targetAmount - emergencyGoal.currentAmount)) * 100;
      const monthsToGoal = this.monthsBetween(new Date(), emergencyGoal.deadline);
      const daysChange = Math.floor((percentageToGoal / 100) * monthsToGoal * 30);

      options.push({
        id: Date.now().toString() + '_1',
        action: `Save $${amount} to Emergency Fund`,
        description: `Transfer $${amount} from checking to savings for your emergency fund.`,
        impact: {
          accountChanges: [
            { accountId: 'checking', change: -amount },
            { accountId: 'savings', change: amount },
          ],
          goalImpacts: [
            { goalId: 'emergency', percentageChange: Math.round(percentageToGoal * 10) / 10, daysChange: -daysChange },
          ],
          liquidityImpact: 0, // Savings are still liquid
          riskLevel: this.guardrailAgent.assessRiskLevel(state, amount, 'save'),
        },
        confidence: violations.length > 0 ? 'medium' : budgetAnalysis.confidence || 'high',
        justification: budgetAnalysis.justification || 'This strengthens your financial safety net.',
      });
    }

    // Option 2: Save to vacation fund
    const vacationGoal = state.goals.find((g) => g.id === 'vacation');
    if (vacationGoal) {
      const percentageToGoal = (amount / (vacationGoal.targetAmount - vacationGoal.currentAmount)) * 100;
      const monthsToGoal = this.monthsBetween(new Date(), vacationGoal.deadline);
      const daysChange = Math.floor((percentageToGoal / 100) * monthsToGoal * 30);

      options.push({
        id: Date.now().toString() + '_2',
        action: `Save $${amount} to Vacation Fund`,
        description: `Allocate $${amount} toward your upcoming vacation.`,
        impact: {
          accountChanges: [
            { accountId: 'checking', change: -amount },
            { accountId: 'savings', change: amount },
          ],
          goalImpacts: [
            { goalId: 'vacation', percentageChange: Math.round(percentageToGoal * 10) / 10, daysChange: -daysChange },
          ],
          liquidityImpact: 0,
          riskLevel: 'low',
        },
        confidence: 'high',
        justification: 'This brings you closer to your vacation goal while maintaining liquidity.',
      });
    }

    return options;
  }

  private generateInvestmentOptions(state: FinancialState, amount: number): DecisionOption[] {
    const options: DecisionOption[] = [];

    // Analyze investment impact
    const investmentAnalysis = this.investmentAgent.analyzeInvestment(state, amount, 'house');
    const budgetAnalysis = this.budgetingAgent.analyze(state, 'invest', amount);
    const violations = this.guardrailAgent.checkConstraints(state, 'invest', amount);

    options.push({
      id: Date.now().toString() + '_3',
      action: `Invest $${amount} in Investment Account`,
      description: `Invest $${amount} for long-term growth toward your house down payment.`,
      impact: {
        accountChanges: [
          { accountId: 'checking', change: -amount },
          { accountId: 'investment', change: amount },
        ],
        goalImpacts: investmentAnalysis.goalImpact,
        liquidityImpact: -amount, // Investments reduce liquidity
        riskLevel: this.guardrailAgent.assessRiskLevel(state, amount, 'invest'),
      },
      confidence: violations.length > 0 ? 'medium' : budgetAnalysis.confidence || 'high',
      justification: investmentAnalysis.riskAssessment,
    });

    return options;
  }

  private generateSpendingOptions(state: FinancialState, amount: number): DecisionOption[] {
    const options: DecisionOption[] = [];

    const budgetAnalysis = this.budgetingAgent.analyze(state, 'spend', amount);
    const violations = this.guardrailAgent.checkConstraints(state, 'spend', amount);

    options.push({
      id: Date.now().toString() + '_4',
      action: `Spend $${amount}`,
      description: `Proceed with spending $${amount} from your checking account.`,
      impact: {
        accountChanges: [{ accountId: 'checking', change: -amount }],
        goalImpacts: [],
        liquidityImpact: -amount,
        riskLevel: this.guardrailAgent.assessRiskLevel(state, amount, 'spend'),
      },
      confidence: violations.some((v) => v.severity === 'critical') ? 'low' : budgetAnalysis.confidence || 'medium',
      justification: budgetAnalysis.justification || 'This spending will use available funds.',
    });

    return options;
  }

  private monthsBetween(start: Date, end: Date): number {
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                   (end.getMonth() - start.getMonth());
    return Math.max(0, months);
  }
}
