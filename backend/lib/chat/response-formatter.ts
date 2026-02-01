/**
 * Response Formatter
 * 
 * Converts structured analysis results into natural, conversational responses.
 * Makes the financial advisor feel human and helpful.
 */

import type { SimulationResult, UserProfile, GoalImpact, BudgetImpact, Guardrail } from '../../types/financial.js';
import type { OrchestrationResult } from '../agents/langchain-orchestrator.js';
import type { ParsedIntent } from './intent-parser.js';

export interface FormattedResponse {
  message: string;
  summary: string;
  details?: {
    simulation?: string;
    budgeting?: string;
    investment?: string;
    guardrails?: string;
    validation?: string;
  };
  suggestedFollowUps: string[];
  shouldProceed: boolean;
  confidence: 'high' | 'medium' | 'low' | 'very_low';
}

/**
 * Format a complete analysis result as a conversational response
 */
export function formatAnalysisResponse(
  _intent: ParsedIntent,
  simulation: SimulationResult,
  analysis: OrchestrationResult,
  userProfile: UserProfile
): FormattedResponse {
  const actionType = simulation.action.type;
  const amount = simulation.action.amount;
  const goalName = findGoalName(simulation.action, userProfile);
  
  // Build the main message
  let message = '';
  
  // Opening based on recommendation
  if (analysis.shouldProceed) {
    if (analysis.overallConfidence === 'high') {
      message = `Great news! ${capitalizeFirst(actionType)}ing $${amount.toLocaleString()}${goalName ? ` for your ${goalName}` : ''} looks like a solid move. `;
    } else {
      message = `${capitalizeFirst(actionType)}ing $${amount.toLocaleString()}${goalName ? ` for your ${goalName}` : ''} could work, though there are some considerations. `;
    }
  } else {
    message = `I'd recommend holding off on ${actionType}ing $${amount.toLocaleString()} right now. Here's why:\n\n`;
  }
  
  // Add key simulation insights
  message += formatSimulationInsights(simulation);
  
  // Add data-driven analysis summary (not agent counts)
  message += '\n\n' + formatDataDrivenAnalysis(simulation, analysis, userProfile);
  
  // Add specific concerns or highlights
  if (analysis.guardrailAnalysis.violated) {
    message += '\n\n⚠️ **Warning:** ' + analysis.guardrailAnalysis.violations
      .map(v => v.rule_description)
      .join('; ');
  }
  
  if (analysis.validationAnalysis.contradictions_found.length > 0) {
    // Filter out agent references from contradiction descriptions
    const cleanedContradictions = analysis.validationAnalysis.contradictions_found
      .map(c => sanitizeAgentReferences(c.description))
      .filter(d => d.length > 0);
    
    if (cleanedContradictions.length > 0) {
      message += '\n\n**Tradeoffs to consider:** ';
      message += cleanedContradictions.join('; ');
    }
  }
  
  // Final recommendation - sanitize any agent references
  message += '\n\n**Bottom line:** ' + sanitizeAgentReferences(analysis.finalRecommendation);
  
  // Build suggested follow-ups
  const suggestedFollowUps = generateFollowUps(simulation, userProfile);
  
  return {
    message,
    summary: analysis.shouldProceed 
      ? `✅ Recommended: ${actionType} $${amount.toLocaleString()}`
      : `⚠️ Not recommended: ${actionType} $${amount.toLocaleString()}`,
    details: {
      simulation: formatSimulationDetails(simulation),
      budgeting: analysis.budgetingAnalysis.key_findings.join('. '),
      investment: analysis.investmentAnalysis.key_findings.join('. '),
      guardrails: analysis.guardrailAnalysis.can_proceed 
        ? 'All safety checks pass'
        : analysis.guardrailAnalysis.violations.map(v => v.rule_description).join('. '),
      validation: `Confidence: ${analysis.overallConfidence}`,
    },
    suggestedFollowUps,
    shouldProceed: analysis.shouldProceed,
    confidence: analysis.overallConfidence,
  };
}

/**
 * Format a comparison of multiple options - data-driven without agent references
 */
export function formatComparisonResponse(
  options: Array<{ action: SimulationResult; analysis: OrchestrationResult }>,
  userProfile: UserProfile
): FormattedResponse {
  let message = "Here's how your options compare:\n\n";
  
  options.forEach((opt, index) => {
    const actionType = opt.action.action.type;
    const amount = opt.action.action.amount;
    const goalName = findGoalName(opt.action.action, userProfile);
    const scenario = opt.action.scenarioIfDo;
    
    message += `**Option ${index + 1}: ${capitalizeFirst(actionType)} $${amount.toLocaleString()}${goalName ? ` → ${goalName}` : ''}**\n`;
    message += opt.analysis.shouldProceed ? '✅ Recommended\n' : '⚠️ Not recommended\n';
    
    // Show actual impact data instead of generic reasoning
    const goalImpacts = scenario.goalImpacts;
    if (goalImpacts && goalImpacts.length > 0) {
      const impact = goalImpacts[0];
      if (impact) {
        message += `• Goal progress: +${impact.progressChangePct.toFixed(1)}%`;
        if (impact.timeSaved > 0) {
          message += ` (reach goal ${impact.timeSaved} months sooner)`;
        }
        message += '\n';
      }
    }
    
    // Show liquidity impact
    if (actionType === 'invest') {
      message += `• Liquidity: Funds locked in investment\n`;
      const projectedValue5yr = amount * Math.pow(1.07, 5);
      message += `• 5-year projection: ~$${Math.round(projectedValue5yr).toLocaleString()}\n`;
    } else if (actionType === 'save') {
      message += `• Liquidity: Fully accessible\n`;
      message += `• Growth: ~4% APY in high-yield savings\n`;
    }
    
    // Account balance after
    message += `• Checking after: $${scenario.accountsAfter.checking.toLocaleString()}\n`;
    
    message += '\n';
  });
  
  // Find best option
  const bestOption = options.find(o => o.analysis.shouldProceed && o.analysis.overallConfidence === 'high')
    || options.find(o => o.analysis.shouldProceed)
    || options[0];
  
  if (bestOption) {
    const bestAction = bestOption.action.action;
    const bestGoalName = findGoalName(bestAction, userProfile);
    message += `**My recommendation:** ${capitalizeFirst(bestAction.type)} $${bestAction.amount.toLocaleString()}`;
    if (bestGoalName) {
      message += ` for ${bestGoalName}`;
    }
    message += ` — ${bestOption.analysis.finalRecommendation}`;
  }
  
  return {
    message,
    summary: `Compared ${options.length} options`,
    suggestedFollowUps: [
      'Tell me more about the first option',
      'What if I split the amount between options?',
      'Show me different amounts',
    ],
    shouldProceed: options.some(o => o.analysis.shouldProceed),
    confidence: bestOption?.analysis.overallConfidence || 'medium',
  };
}

/**
 * Format a recommendation response (when user asks "what should I do?")
 */
export function formatRecommendationResponse(
  recommendations: Array<{
    action: { type: string; amount: number; goalId?: string };
    reasoning: string;
    priority: number;
  }>,
  userProfile: UserProfile
): FormattedResponse {
  if (recommendations.length === 0) {
    return {
      message: "You're in great shape! I don't have any urgent recommendations right now. Your goals are on track and your finances look healthy.",
      summary: 'No urgent actions needed',
      suggestedFollowUps: [
        'How are my goals progressing?',
        'What if I wanted to invest more aggressively?',
        'Show me my financial overview',
      ],
      shouldProceed: true,
      confidence: 'high',
    };
  }
  
  let message = "Based on your financial situation, here's what I'd prioritize:\n\n";
  
  recommendations.slice(0, 3).forEach((rec, index) => {
    const goalName = rec.action.goalId 
      ? userProfile.goals.find(g => g.id === rec.action.goalId)?.name || 'your goal'
      : null;
    
    message += `**${index + 1}. ${capitalizeFirst(rec.action.type)} $${rec.action.amount.toLocaleString()}`;
    if (goalName) {
      message += ` → ${goalName}`;
    }
    message += '**\n';
    message += `${rec.reasoning}\n\n`;
  });
  
  const topRec = recommendations[0];
  if (topRec) {
    message += `Want me to analyze what happens if you ${topRec.action.type} $${topRec.action.amount.toLocaleString()}?`;
  }
  
  return {
    message,
    summary: `Top recommendation: ${recommendations[0]?.action.type} $${recommendations[0]?.action.amount.toLocaleString()}`,
    suggestedFollowUps: recommendations.slice(0, 3).map(rec => 
      `Analyze ${rec.action.type}ing $${rec.action.amount.toLocaleString()}`
    ),
    shouldProceed: true,
    confidence: 'high',
  };
}

/**
 * Format goal progress response
 */
export function formatGoalProgressResponse(
  goalSummaries: Array<{
    goalName: string;
    progress: number;
    status: string;
    monthsRemaining: number;
    monthlyNeeded: number;
    projectedCompletion: string;
  }>
): FormattedResponse {
  let message = "Here's how you're tracking on your goals:\n\n";
  
  goalSummaries.forEach(goal => {
    const statusEmoji = goal.status === 'on_track' || goal.status === 'completed' ? '✅' 
      : goal.status === 'at_risk' ? '⚠️' 
      : '❌';
    
    message += `**${goal.goalName}** ${statusEmoji}\n`;
    message += `Progress: ${goal.progress.toFixed(1)}% complete\n`;
    
    if (goal.status === 'completed') {
      message += `🎉 Completed!\n`;
    } else {
      message += `${goal.monthsRemaining} months remaining • Need $${goal.monthlyNeeded.toFixed(0)}/month\n`;
      if (goal.status === 'at_risk') {
        message += `⚠️ ${goal.projectedCompletion}\n`;
      }
    }
    message += '\n';
  });
  
  const atRiskGoals = goalSummaries.filter(g => g.status === 'at_risk');
  if (atRiskGoals.length > 0 && atRiskGoals[0]) {
    message += `💡 **Tip:** Your ${atRiskGoals[0].goalName} needs attention. Want me to suggest ways to get back on track?`;
  }
  
  return {
    message,
    summary: `${goalSummaries.filter(g => g.status === 'on_track' || g.status === 'completed').length}/${goalSummaries.length} goals on track`,
    suggestedFollowUps: [
      'How can I speed up my highest priority goal?',
      'What if I increased my monthly savings?',
      'Show me recommended actions',
    ],
    shouldProceed: true,
    confidence: 'high',
  };
}

/**
 * Format clarification request
 */
export function formatClarificationResponse(
  question: string,
  userProfile: UserProfile
): FormattedResponse {
  const goalNames = userProfile.goals.map(g => g.name).join(', ');
  
  return {
    message: question + `\n\nFor reference, your current goals are: ${goalNames}.`,
    summary: 'Need more information',
    suggestedFollowUps: [
      'Should I invest $500?',
      'What should I do with extra money?',
      'How are my goals doing?',
    ],
    shouldProceed: false,
    confidence: 'low',
  };
}

// Helper functions

function findGoalName(action: { goalId?: string }, userProfile: UserProfile): string | null {
  if (!action.goalId) return null;
  const goal = userProfile.goals.find(g => g.id === action.goalId);
  return goal?.name || null;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Remove references to internal agent architecture from user-facing text
 */
function sanitizeAgentReferences(text: string): string {
  if (!text) return '';
  
  return text
    // Remove agent name references
    .replace(/\b(budgeting|investment|guardrail|validation)\s*agent/gi, 'analysis')
    .replace(/\bagent\s*(a|b|1|2|3)\b/gi, '')
    .replace(/\bagents?\b/gi, '')
    // Remove internal decision terminology
    .replace(/\bconsensus\s*(is|level|score)?\s*(unanimous|divided|strong|weak|moderate)?\b/gi, '')
    .replace(/\b(domain\s*)?agents?\s*(approve|oppose|caution|recommend)/gi, 'the analysis suggests')
    // Clean up resulting double spaces
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function formatSimulationInsights(simulation: SimulationResult): string {
  const insights: string[] = [];
  const scenario = simulation.scenarioIfDo;
  
  // Goal impact
  if (scenario.goalImpacts && scenario.goalImpacts.length > 0) {
    scenario.goalImpacts.forEach((impact: GoalImpact) => {
      if (impact.progressChangePct > 0) {
        insights.push(`This moves your ${impact.goalName} +${impact.progressChangePct.toFixed(1)}% closer${impact.timeSaved > 0 ? `, saving ${impact.timeSaved} months` : ''}`);
      }
    });
  }
  
  // Budget impact
  if (scenario.budgetImpacts && scenario.budgetImpacts.length > 0) {
    const overBudgetCategories = scenario.budgetImpacts.filter((b: BudgetImpact) => b.status === 'over');
    if (overBudgetCategories.length > 0) {
      insights.push(`This would put ${overBudgetCategories.map((b: BudgetImpact) => b.categoryName).join(', ')} over budget`);
    }
    const warningCategories = scenario.budgetImpacts.filter((b: BudgetImpact) => b.status === 'warning');
    if (warningCategories.length > 0 && overBudgetCategories.length === 0) {
      insights.push(`This leaves ${warningCategories.map((b: BudgetImpact) => b.categoryName).join(', ')} tight on budget`);
    }
  }
  
  // Account balance changes
  const checking = scenario.accountsAfter.checking;
  if (checking < 1000) {
    insights.push(`⚠️ Your checking would drop to $${checking.toFixed(0)}`);
  }
  
  // Liquidity and risk impacts
  if (scenario.liquidityImpact) {
    insights.push(scenario.liquidityImpact);
  }
  
  return insights.length > 0 ? insights.join('. ') + '.' : '';
}

/**
 * Format a data-driven analysis summary instead of showing agent counts.
 * Focuses on real numbers, impacts, and financial reasoning.
 */
function formatDataDrivenAnalysis(
  simulation: SimulationResult,
  analysis: OrchestrationResult,
  userProfile: UserProfile
): string {
  const insights: string[] = [];
  const scenario = simulation.scenarioIfDo;
  const action = simulation.action;
  
  // Budget analysis - use actual numbers
  if (analysis.budgetingAnalysis.key_findings.length > 0) {
    // Get the most important budget finding
    const budgetFinding = analysis.budgetingAnalysis.key_findings[0];
    if (budgetFinding && !budgetFinding.includes('agent')) {
      insights.push(`**Budget:** ${budgetFinding}`);
    }
  }
  
  // Show remaining budget after this action
  const monthlyIncome = userProfile.monthlyIncome;
  const totalExpenses = userProfile.fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const surplus = monthlyIncome - totalExpenses;
  const remainingAfterAction = surplus - action.amount;
  
  if (remainingAfterAction < 500) {
    insights.push(`**Flexibility:** This leaves you with $${remainingAfterAction.toLocaleString()} buffer this month`);
  }
  
  // Investment analysis - focus on projected growth
  if (action.type === 'invest' && analysis.investmentAnalysis.key_findings.length > 0) {
    const investFinding = analysis.investmentAnalysis.key_findings[0];
    if (investFinding && !investFinding.includes('agent')) {
      insights.push(`**Growth potential:** ${investFinding}`);
    }
    
    // Calculate projected value for investment
    const projectedValue5yr = action.amount * Math.pow(1.07, 5);
    insights.push(`In 5 years at 7% avg return: **~$${Math.round(projectedValue5yr).toLocaleString()}**`);
  }
  
  // Account impact - show actual numbers
  const checkingAfter = scenario.accountsAfter.checking;
  const savingsAfter = scenario.accountsAfter.savings;
  
  if (action.type === 'save' || action.type === 'spend') {
    insights.push(`**After this action:** Checking: $${checkingAfter.toLocaleString()} | Savings: $${savingsAfter.toLocaleString()}`);
  }
  
  // Risk assessment based on user's profile
  if (userProfile.preferences.riskTolerance === 'conservative' && action.type === 'invest') {
    insights.push(`**Note:** Given your conservative risk preference, consider starting with a smaller amount`);
  } else if (userProfile.preferences.riskTolerance === 'aggressive' && action.type === 'save') {
    insights.push(`**Consider:** With your aggressive risk profile, investing could yield higher returns`);
  }
  
  // Guardrail status - plain English
  if (analysis.guardrailAnalysis.can_proceed) {
    const checkingGuardrail = userProfile.preferences.guardrails.find((g: Guardrail) => g.accountId === 'checking' && g.type === 'min_balance');
    const checkingMin = checkingGuardrail?.threshold;
    if (checkingMin && checkingAfter > checkingMin + 500) {
      insights.push(`✅ Your checking stays safely above your $${checkingMin.toLocaleString()} minimum`);
    }
  }
  
  // Confidence explanation based on data, not agents
  if (analysis.overallConfidence === 'high') {
    insights.push(`**Confidence:** High — this aligns well with your goals and constraints`);
  } else if (analysis.overallConfidence === 'medium') {
    insights.push(`**Confidence:** Medium — there are some trade-offs to weigh`);
  } else if (analysis.overallConfidence === 'low') {
    insights.push(`**Confidence:** Lower — I'd recommend more caution here`);
  }
  
  return insights.join('\n');
}

function formatSimulationDetails(simulation: SimulationResult): string {
  const parts: string[] = [];
  
  parts.push(`Action: ${simulation.action.type} $${simulation.action.amount.toLocaleString()}`);
  parts.push(`Summary: ${simulation.reasoning}`);
  
  const goalImpacts = simulation.scenarioIfDo.goalImpacts;
  if (goalImpacts && goalImpacts.length > 0) {
    parts.push(`Goal impacts: ${goalImpacts.map((g: GoalImpact) => 
      `${g.goalName}: +${g.progressChangePct.toFixed(1)}%`
    ).join(', ')}`);
  }
  
  return parts.join('\n');
}

function generateFollowUps(
  simulation: SimulationResult,
  userProfile: UserProfile
): string[] {
  const followUps: string[] = [];
  const amount = simulation.action.amount;
  
  // Amount variations
  followUps.push(`What about $${Math.round(amount * 1.5).toLocaleString()} instead?`);
  if (amount > 200) {
    followUps.push(`What if I only did $${Math.round(amount * 0.5).toLocaleString()}?`);
  }
  
  // Alternative actions
  if (simulation.action.type === 'invest') {
    followUps.push(`What if I saved this instead of investing?`);
  } else if (simulation.action.type === 'save') {
    followUps.push(`Should I invest this instead?`);
  }
  
  // Goal-related
  const currentGoalId = simulation.action.goalId;
  const otherGoals = userProfile.goals.filter(g => g.id !== currentGoalId);
  if (otherGoals.length > 0 && otherGoals[0]) {
    followUps.push(`What about putting this toward ${otherGoals[0].name}?`);
  }
  
  return followUps.slice(0, 4);
}
