import { DecisionOption } from '@/app/contexts/FinancialContext';

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
}

export class ValidationAgent {
  private recentRecommendations: DecisionOption[] = [];

  validate(options: DecisionOption[]): ValidationResult {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check for contradictions with recent advice
    options.forEach((option) => {
      const contradictions = this.checkContradictions(option);
      if (contradictions.length > 0) {
        warnings.push(...contradictions);
      }
    });

    // Check for constraint violations
    options.forEach((option) => {
      if (option.impact.riskLevel === 'high' && option.confidence === 'low') {
        warnings.push(
          `Option "${option.action}" has high risk and low confidence. Reconsider this recommendation.`
        );
      }

      // Check for unrealistic impacts
      const totalGoalImpact = option.impact.goalImpacts.reduce(
        (sum, g) => sum + Math.abs(g.percentageChange),
        0
      );
      
      if (totalGoalImpact > 200) {
        issues.push(`Option "${option.action}" shows unrealistic goal impacts (${totalGoalImpact}%).`);
      }
    });

    // Check for high uncertainty
    const lowConfidenceCount = options.filter((o) => o.confidence === 'low').length;
    if (lowConfidenceCount === options.length && options.length > 0) {
      warnings.push('All options have low confidence. More information may be needed.');
    }

    // Check for missing critical information
    options.forEach((option) => {
      if (option.impact.accountChanges.length === 0) {
        issues.push(`Option "${option.action}" has no account impact defined.`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
    };
  }

  private checkContradictions(option: DecisionOption): string[] {
    const contradictions: string[] = [];

    // Check if this contradicts recent recommendations
    this.recentRecommendations.forEach((recent) => {
      // If we recently recommended saving but now recommending spending
      if (
        recent.action.toLowerCase().includes('save') &&
        option.action.toLowerCase().includes('spend')
      ) {
        const timeDiff = Date.now() - parseInt(recent.id);
        if (timeDiff < 24 * 60 * 60 * 1000) {
          // Less than 24 hours
          contradictions.push(
            `This recommendation to ${option.action} contradicts recent advice to save money.`
          );
        }
      }

      // Check for opposite goal prioritization
      const recentGoalIds = recent.impact.goalImpacts.map((g) => g.goalId);
      const currentGoalIds = option.impact.goalImpacts.map((g) => g.goalId);
      
      const differentGoals = currentGoalIds.filter((id) => !recentGoalIds.includes(id));
      if (differentGoals.length > 0 && recentGoalIds.length > 0) {
        const timeDiff = Date.now() - parseInt(recent.id);
        if (timeDiff < 7 * 24 * 60 * 60 * 1000) {
          // Less than 7 days
          contradictions.push(
            'This recommendation focuses on different goals than recent advice. Ensure goal consistency.'
          );
        }
      }
    });

    return contradictions;
  }

  recordRecommendation(option: DecisionOption): void {
    this.recentRecommendations.push(option);
    
    // Keep only last 10 recommendations
    if (this.recentRecommendations.length > 10) {
      this.recentRecommendations.shift();
    }
  }

  clearHistory(): void {
    this.recentRecommendations = [];
  }
}
