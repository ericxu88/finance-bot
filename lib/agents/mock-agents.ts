/**
 * Mock Agents for Demo Mode
 * 
 * Provides realistic mock responses without calling the Google API
 * Use this for demos to avoid rate limits
 */

import type { AgentContext } from './langchain-base.js';
import type { z } from 'zod';
import {
  BudgetingAnalysisSchema,
  InvestmentAnalysisSchema,
  GuardrailAnalysisSchema,
  ValidationAnalysisSchema
} from './schemas.js';

/**
 * Generate realistic mock budgeting analysis
 */
export function generateMockBudgetingAnalysis(context: AgentContext): z.infer<typeof BudgetingAnalysisSchema> {
  const { user, action, simulationResult } = context;
  const checkingAfter = simulationResult.scenarioIfDo.accountsAfter.checking;
  const totalExpenses = user.fixedExpenses.reduce((sum, e) => sum + e.amount, 0) +
    user.spendingCategories.reduce((sum, c) => sum + c.monthlyBudget, 0);
  const monthsOfExpenses = checkingAfter / totalExpenses;

  // Determine recommendation based on liquidity
  let recommendation: 'strongly_approve' | 'approve' | 'approve_with_caution' | 'not_recommended' | 'strongly_oppose' | 'blocked';
  let confidence = 0.85;
  
  if (monthsOfExpenses < 1) {
    recommendation = 'not_recommended';
    confidence = 0.9;
  } else if (monthsOfExpenses < 2) {
    recommendation = 'approve_with_caution';
    confidence = 0.75;
  } else {
    recommendation = 'approve';
    confidence = 0.85;
  }

  return {
    recommendation,
    confidence,
    reasoning: `After this ${action.type} action, checking balance will be $${checkingAfter.toFixed(0)}, providing ${monthsOfExpenses.toFixed(1)} months of expense coverage. This is ${monthsOfExpenses >= 2 ? 'adequate' : 'below recommended'} for maintaining financial flexibility. The action aligns with your monthly surplus of $${(user.monthlyIncome - totalExpenses).toFixed(0)}.`,
    key_findings: [
      `Checking balance after action: $${checkingAfter.toFixed(0)}`,
      `Months of expenses remaining: ${monthsOfExpenses.toFixed(1)}`,
      `Monthly surplus: $${(user.monthlyIncome - totalExpenses).toFixed(0)}`,
      action.type === 'spend' ? 'This spending action reduces liquidity' : 'Action maintains reasonable liquidity buffer'
    ],
    concerns: monthsOfExpenses < 2 
      ? [`Low liquidity buffer: only ${monthsOfExpenses.toFixed(1)} months of expenses remaining`]
      : [],
    data_quality: context.historicalMetrics.monthsOfData >= 3 ? 'high' : 'medium',
    alternative_suggestions: monthsOfExpenses < 2 
      ? ['Consider reducing the amount to maintain a 2-month expense buffer', 'Build up emergency fund before making this commitment']
      : [],
    budgeting_metrics: {
      months_of_expenses_remaining: monthsOfExpenses,
      monthly_expense_average: totalExpenses,
      spending_variance_coefficient: context.historicalMetrics.spendingVariance,
      months_of_historical_data: context.historicalMetrics.monthsOfData,
      over_budget_categories: user.spendingCategories
        .filter(c => c.currentSpent > c.monthlyBudget)
        .map(c => c.name),
      budget_utilization_pct: user.spendingCategories.reduce((sum, c) => 
        sum + (c.currentSpent / c.monthlyBudget) * 100, 0) / user.spendingCategories.length
    }
  };
}

/**
 * Generate realistic mock investment analysis
 */
export function generateMockInvestmentAnalysis(context: AgentContext): z.infer<typeof InvestmentAnalysisSchema> {
  const { user, action, simulationResult } = context;
  const goalImpact = simulationResult.scenarioIfDo.goalImpacts[0];
  const futureValue = goalImpact?.futureValue || action.amount * 1.4; // Rough estimate

  let recommendation: 'strongly_approve' | 'approve' | 'approve_with_caution' | 'not_recommended' | 'strongly_oppose' | 'blocked';
  let confidence = 0.8;

  if (action.type !== 'invest') {
    recommendation = 'not_recommended';
    confidence = 0.7;
  } else {
    // Check risk tolerance alignment
    if (user.preferences.riskTolerance === 'conservative' && action.amount > 1000) {
      recommendation = 'approve_with_caution';
      confidence = 0.75;
    } else {
      recommendation = 'approve';
      confidence = 0.85;
    }
  }

  return {
    recommendation,
    confidence,
    reasoning: action.type === 'invest' 
      ? `Investing $${action.amount} in ${action.targetAccountId} supports your financial goals. Projected value in 5 years: $${futureValue.toFixed(0)} (assuming 7% annual return). This aligns with your ${user.preferences.riskTolerance} risk tolerance and helps advance your ${goalImpact?.goalName || 'investment'} goal.`
      : `This is a ${action.type} action, not an investment. The opportunity cost is potential growth of $${(futureValue - action.amount).toFixed(0)} over 5 years if this money were invested instead.`,
    key_findings: action.type === 'invest' ? [
      `Projected 5-year value: $${futureValue.toFixed(0)}`,
      `Goal progress impact: ${goalImpact?.progressChangePct.toFixed(1)}%`,
      `Risk level: ${user.preferences.riskTolerance === 'conservative' ? 'Low' : 'Moderate'}`,
      `Time to goal: ${goalImpact ? Math.abs(goalImpact.timeSaved) : 0} months ${goalImpact?.timeSaved && goalImpact.timeSaved >= 0 ? 'faster' : 'slower'}`
    ] : [
      'This is not an investment action',
      `Opportunity cost: $${(futureValue - action.amount).toFixed(0)} potential growth over 5 years`
    ],
    concerns: action.type === 'invest' && user.preferences.riskTolerance === 'conservative'
      ? ['Large investment amount may exceed conservative risk tolerance', 'Consider dollar-cost averaging instead']
      : [],
    data_quality: 'high',
    alternative_suggestions: action.type === 'invest' 
      ? ['Consider splitting into monthly contributions', 'Review asset allocation to ensure diversification']
      : ['Consider investing this amount instead for long-term growth'],
    investment_metrics: action.type === 'invest' ? {
      projected_value_5yr: futureValue,
      annualized_return_assumption: 0.07,
      time_to_goal_impact_months: goalImpact?.timeSaved || 0,
      risk_assessment: (user.preferences.riskTolerance === 'conservative' ? 'low' : 'medium') as 'low' | 'medium' | 'high' | 'very_high',
      goal_alignment_score: goalImpact ? 0.85 : 0.6,
      diversification_impact: 'Increases exposure to growth assets'
    } : {}
  };
}

/**
 * Generate realistic mock guardrail analysis
 */
export function generateMockGuardrailAnalysis(context: AgentContext): z.infer<typeof GuardrailAnalysisSchema> {
  const { user, simulationResult } = context;
  const accountsAfter = simulationResult.scenarioIfDo.accountsAfter;
  const violations: z.infer<typeof GuardrailAnalysisSchema>['violations'] = [];
  const warnings: string[] = [];

  // Check each guardrail
  for (const guardrail of user.preferences.guardrails) {
    if (guardrail.type === 'min_balance' && guardrail.accountId && guardrail.threshold) {
      const accountBalance = accountsAfter[guardrail.accountId as keyof typeof accountsAfter] as number;
      if (accountBalance < guardrail.threshold) {
        violations.push({
          rule_description: guardrail.rule,
          severity: 'critical',
          violation_details: `${guardrail.accountId} balance ($${accountBalance.toFixed(0)}) is below minimum threshold ($${guardrail.threshold})`,
          current_value: accountBalance,
          threshold_value: guardrail.threshold,
          suggested_adjustment: `Reduce action amount by $${(guardrail.threshold - accountBalance).toFixed(0)} to comply`
        });
      } else if (accountBalance < guardrail.threshold * 1.1) {
        warnings.push(`Approaching ${guardrail.accountId} minimum: $${accountBalance.toFixed(0)} (threshold: $${guardrail.threshold})`);
      }
    }
  }

  return {
    violated: violations.length > 0,
    can_proceed: violations.length === 0,
    violations,
    warnings,
    compliance_summary: violations.length === 0
      ? 'All guardrails satisfied. Action can proceed safely.'
      : `${violations.length} guardrail violation(s) detected. Action should be blocked or modified.`
  };
}

/**
 * Generate realistic mock validation analysis
 */
export function generateMockValidationAnalysis(
  context: AgentContext,
  budgetingAnalysis: z.infer<typeof BudgetingAnalysisSchema>,
  investmentAnalysis: z.infer<typeof InvestmentAnalysisSchema>,
  guardrailAnalysis: z.infer<typeof GuardrailAnalysisSchema>
): z.infer<typeof ValidationAnalysisSchema> {
  // Count agent votes
  const agentsApproving = [budgetingAnalysis, investmentAnalysis]
    .filter(a => a.recommendation === 'strongly_approve' || a.recommendation === 'approve').length;
  const agentsCautioning = [budgetingAnalysis, investmentAnalysis]
    .filter(a => a.recommendation === 'approve_with_caution').length;
  const agentsOpposing = [budgetingAnalysis, investmentAnalysis]
    .filter(a => a.recommendation === 'not_recommended' || a.recommendation === 'strongly_oppose').length;

  let consensusLevel: 'unanimous' | 'strong' | 'moderate' | 'weak' | 'divided';
  if (agentsApproving === 2 && agentsCautioning === 0 && agentsOpposing === 0) {
    consensusLevel = 'unanimous';
  } else if (agentsApproving >= 1 && agentsOpposing === 0) {
    consensusLevel = 'strong';
  } else if (agentsApproving + agentsCautioning >= agentsOpposing) {
    consensusLevel = 'moderate';
  } else if (agentsOpposing > 0) {
    consensusLevel = 'weak';
  } else {
    consensusLevel = 'divided';
  }

  let overallRecommendation: 'proceed_confidently' | 'proceed' | 'proceed_with_caution' | 'reconsider' | 'do_not_proceed';
  let overallConfidence: 'high' | 'medium' | 'low' | 'very_low';

  if (!guardrailAnalysis.can_proceed) {
    overallRecommendation = 'do_not_proceed';
    overallConfidence = 'high';
  } else if (consensusLevel === 'unanimous' || consensusLevel === 'strong') {
    overallRecommendation = agentsCautioning > 0 ? 'proceed_with_caution' : 'proceed_confidently';
    overallConfidence = 'high';
  } else if (consensusLevel === 'moderate') {
    overallRecommendation = 'proceed_with_caution';
    overallConfidence = 'medium';
  } else {
    overallRecommendation = 'reconsider';
    overallConfidence = 'low';
  }

  return {
    overall_recommendation: overallRecommendation,
    overall_confidence: overallConfidence,
    contradictions_found: [],
    uncertainty_sources: context.historicalMetrics.monthsOfData < 3
      ? [{
          source: 'Limited historical data',
          impact: 'medium',
          mitigation: 'Collect more transaction history for better predictions'
        }]
      : [],
    data_sufficiency: {
      sufficient: context.historicalMetrics.monthsOfData >= 3,
      missing_data_types: context.historicalMetrics.monthsOfData < 3 ? ['Extended transaction history'] : [],
      data_quality_score: context.historicalMetrics.monthsOfData >= 3 ? 0.85 : 0.6,
      recommendation: context.historicalMetrics.monthsOfData >= 3
        ? 'Sufficient data for confident analysis'
        : 'More historical data would improve confidence'
    },
    agent_consensus: {
      agents_approving: agentsApproving,
      agents_cautioning: agentsCautioning,
      agents_opposing: agentsOpposing,
      consensus_level: consensusLevel
    },
    final_summary: `Based on analysis from budgeting, investment, and guardrail agents: ${overallRecommendation === 'do_not_proceed' 
      ? 'This action violates guardrails and should not proceed.'
      : `This action is ${overallRecommendation.replace('_', ' ')}. Budgeting agent ${budgetingAnalysis.recommendation}, investment agent ${investmentAnalysis.recommendation}. ${guardrailAnalysis.violated ? 'Guardrails violated.' : 'All guardrails satisfied.'}`}`,
    decision_tree: {
      if_proceed: `If you proceed: ${context.simulationResult.scenarioIfDo.goalImpacts.map((g: { goalName: string; progressChangePct: number }) => `${g.goalName} progress increases by ${g.progressChangePct.toFixed(1)}%`).join(', ')}. Checking balance becomes $${context.simulationResult.scenarioIfDo.accountsAfter.checking.toFixed(0)}.`,
      if_do_not_proceed: `If you don't proceed: No immediate impact. Opportunity cost: ${investmentAnalysis.investment_metrics?.projected_value_5yr ? `$${(investmentAnalysis.investment_metrics.projected_value_5yr - context.action.amount).toFixed(0)} potential growth over 5 years` : 'Maintains current liquidity'}.`,
      recommended_path: overallRecommendation === 'do_not_proceed'
        ? 'Do not proceed. Modify the action to comply with guardrails.'
        : `Proceed ${overallRecommendation === 'proceed_with_caution' ? 'with caution and monitor liquidity' : 'as planned'}.`
    }
  };
}
