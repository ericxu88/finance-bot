import { FinancialState } from '@/app/contexts/FinancialContext';

export interface GuardrailViolation {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  constraint: string;
}

export class GuardrailAgent {
  checkConstraints(state: FinancialState, action: string, amount: number): GuardrailViolation[] {
    const violations: GuardrailViolation[] = [];

    const checkingAccount = state.accounts.find((a) => a.id === 'checking');
    const savingsAccount = state.accounts.find((a) => a.id === 'savings');

    const totalMonthlyExpenses = state.expenses
      .filter((e) => e.frequency === 'monthly')
      .reduce((sum, e) => sum + e.amount, 0);

    // Critical constraints
    if (action.toLowerCase().includes('spend') || action.toLowerCase().includes('invest')) {
      const projectedChecking = (checkingAccount?.balance || 0) - amount;
      
      if (projectedChecking < totalMonthlyExpenses) {
        violations.push({
          severity: 'critical',
          message: 'This action would leave your checking account below one month of expenses.',
          constraint: 'MINIMUM_CHECKING_BALANCE',
        });
      }

      if (projectedChecking < 500) {
        violations.push({
          severity: 'critical',
          message: 'This action would reduce your checking account to critically low levels.',
          constraint: 'MINIMUM_EMERGENCY_BALANCE',
        });
      }
    }

    // Emergency fund check
    const emergencyFundTarget = state.monthlyIncome * 3; // 3 months of income
    const currentEmergencyFund = savingsAccount?.balance || 0;

    if (currentEmergencyFund < emergencyFundTarget && action.toLowerCase().includes('invest')) {
      violations.push({
        severity: 'warning',
        message: `Your emergency fund is below the recommended 3 months of income ($${emergencyFundTarget.toFixed(2)}). Consider building this first.`,
        constraint: 'EMERGENCY_FUND_TARGET',
      });
    }

    // Risk threshold checks
    if (action.toLowerCase().includes('invest')) {
      const investmentAccount = state.accounts.find((a) => a.type === 'investment');
      const currentInvestment = investmentAccount?.balance || 0;
      const totalAssets = state.accounts.reduce((sum, a) => sum + a.balance, 0);
      const projectedInvestmentRatio = (currentInvestment + amount) / (totalAssets + amount);

      if (state.riskTolerance === 'low' && projectedInvestmentRatio > 0.3) {
        violations.push({
          severity: 'warning',
          message: 'This investment would exceed your low risk tolerance allocation (30% max in investments).',
          constraint: 'RISK_TOLERANCE_ALLOCATION',
        });
      } else if (state.riskTolerance === 'medium' && projectedInvestmentRatio > 0.5) {
        violations.push({
          severity: 'warning',
          message: 'This investment would exceed your medium risk tolerance allocation (50% max in investments).',
          constraint: 'RISK_TOLERANCE_ALLOCATION',
        });
      }
    }

    // Liquidity preference checks
    if (state.liquidityPreference === 'high') {
      const liquidAssets = (checkingAccount?.balance || 0) + (savingsAccount?.balance || 0);
      const totalAssets = state.accounts.reduce((sum, a) => sum + a.balance, 0);
      const projectedLiquidRatio = (liquidAssets - amount) / totalAssets;

      if (projectedLiquidRatio < 0.6 && action.toLowerCase().includes('invest')) {
        violations.push({
          severity: 'info',
          message: 'You have a high liquidity preference. This investment reduces your liquid assets.',
          constraint: 'LIQUIDITY_PREFERENCE',
        });
      }
    }

    return violations;
  }

  assessRiskLevel(state: FinancialState, amount: number, actionType: string): 'low' | 'medium' | 'high' {
    const violations = this.checkConstraints(state, actionType, amount);
    
    if (violations.some((v) => v.severity === 'critical')) {
      return 'high';
    } else if (violations.some((v) => v.severity === 'warning')) {
      return 'medium';
    }
    return 'low';
  }
}
