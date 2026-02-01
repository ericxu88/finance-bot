export function formatAnalysisResponse(_intent, simulation, analysis, userProfile) {
    const actionType = simulation.action.type;
    const amount = simulation.action.amount;
    const goalName = findGoalName(simulation.action, userProfile);
    let message = '';
    if (analysis.shouldProceed) {
        if (analysis.overallConfidence === 'high') {
            message = `Great news! ${capitalizeFirst(actionType)}ing $${amount.toLocaleString()}${goalName ? ` for your ${goalName}` : ''} looks like a solid move. `;
        }
        else {
            message = `${capitalizeFirst(actionType)}ing $${amount.toLocaleString()}${goalName ? ` for your ${goalName}` : ''} could work, though there are some considerations. `;
        }
    }
    else {
        message = `I'd recommend holding off on ${actionType}ing $${amount.toLocaleString()} right now. Here's why:\n\n`;
    }
    message += formatSimulationInsights(simulation);
    message += '\n\n' + formatDataDrivenAnalysis(simulation, analysis, userProfile);
    if (analysis.guardrailAnalysis.violated) {
        message += '\n\n⚠️ **Warning:** ' + analysis.guardrailAnalysis.violations
            .map(v => v.rule_description)
            .join('; ');
    }
    if (analysis.validationAnalysis.contradictions_found.length > 0) {
        const cleanedContradictions = analysis.validationAnalysis.contradictions_found
            .map(c => sanitizeAgentReferences(c.description))
            .filter(d => d.length > 0);
        if (cleanedContradictions.length > 0) {
            message += '\n\n**Tradeoffs to consider:** ';
            message += cleanedContradictions.join('; ');
        }
    }
    message += '\n\n**Bottom line:** ' + sanitizeAgentReferences(analysis.finalRecommendation);
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
export function formatComparisonResponse(options, userProfile) {
    let message = "Here's how your options compare:\n\n";
    options.forEach((opt, index) => {
        const actionType = opt.action.action.type;
        const amount = opt.action.action.amount;
        const goalName = findGoalName(opt.action.action, userProfile);
        const scenario = opt.action.scenarioIfDo;
        message += `**Option ${index + 1}: ${capitalizeFirst(actionType)} $${amount.toLocaleString()}${goalName ? ` → ${goalName}` : ''}**\n`;
        message += opt.analysis.shouldProceed ? '✅ Recommended\n' : '⚠️ Not recommended\n';
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
        if (actionType === 'invest') {
            message += `• Liquidity: Funds locked in investment\n`;
            const projectedValue5yr = amount * Math.pow(1.07, 5);
            message += `• 5-year projection: ~$${Math.round(projectedValue5yr).toLocaleString()}\n`;
        }
        else if (actionType === 'save') {
            message += `• Liquidity: Fully accessible\n`;
            message += `• Growth: ~4% APY in high-yield savings\n`;
        }
        message += `• Checking after: $${scenario.accountsAfter.checking.toLocaleString()}\n`;
        message += '\n';
    });
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
export function formatRecommendationResponse(recommendations, userProfile) {
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
        suggestedFollowUps: recommendations.slice(0, 3).map(rec => `Analyze ${rec.action.type}ing $${rec.action.amount.toLocaleString()}`),
        shouldProceed: true,
        confidence: 'high',
    };
}
export function formatGoalProgressResponse(goalSummaries) {
    let message = "Here's how you're tracking on your goals:\n\n";
    goalSummaries.forEach(goal => {
        const statusEmoji = goal.status === 'on_track' || goal.status === 'completed' ? '✅'
            : goal.status === 'at_risk' ? '⚠️'
                : '❌';
        message += `**${goal.goalName}** ${statusEmoji}\n`;
        message += `Progress: ${goal.progress.toFixed(1)}% complete\n`;
        if (goal.status === 'completed') {
            message += `🎉 Completed!\n`;
        }
        else {
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
export function formatClarificationResponse(question, userProfile) {
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
function findGoalName(action, userProfile) {
    if (!action.goalId)
        return null;
    const goal = userProfile.goals.find(g => g.id === action.goalId);
    return goal?.name || null;
}
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function sanitizeAgentReferences(text) {
    if (!text)
        return '';
    return text
        .replace(/\b(budgeting|investment|guardrail|validation)\s*agent/gi, 'analysis')
        .replace(/\bagent\s*(a|b|1|2|3)\b/gi, '')
        .replace(/\bagents?\b/gi, '')
        .replace(/\bconsensus\s*(is|level|score)?\s*(unanimous|divided|strong|weak|moderate)?\b/gi, '')
        .replace(/\b(domain\s*)?agents?\s*(approve|oppose|caution|recommend)/gi, 'the analysis suggests')
        .replace(/\s{2,}/g, ' ')
        .trim();
}
function formatSimulationInsights(simulation) {
    const insights = [];
    const scenario = simulation.scenarioIfDo;
    if (scenario.goalImpacts && scenario.goalImpacts.length > 0) {
        scenario.goalImpacts.forEach((impact) => {
            if (impact.progressChangePct > 0) {
                insights.push(`This moves your ${impact.goalName} +${impact.progressChangePct.toFixed(1)}% closer${impact.timeSaved > 0 ? `, saving ${impact.timeSaved} months` : ''}`);
            }
        });
    }
    if (scenario.budgetImpacts && scenario.budgetImpacts.length > 0) {
        const overBudgetCategories = scenario.budgetImpacts.filter((b) => b.status === 'over');
        if (overBudgetCategories.length > 0) {
            insights.push(`This would put ${overBudgetCategories.map((b) => b.categoryName).join(', ')} over budget`);
        }
        const warningCategories = scenario.budgetImpacts.filter((b) => b.status === 'warning');
        if (warningCategories.length > 0 && overBudgetCategories.length === 0) {
            insights.push(`This leaves ${warningCategories.map((b) => b.categoryName).join(', ')} tight on budget`);
        }
    }
    const checking = scenario.accountsAfter.checking;
    if (checking < 1000) {
        insights.push(`⚠️ Your checking would drop to $${checking.toFixed(0)}`);
    }
    if (scenario.liquidityImpact) {
        insights.push(scenario.liquidityImpact);
    }
    return insights.length > 0 ? insights.join('. ') + '.' : '';
}
function formatDataDrivenAnalysis(simulation, analysis, userProfile) {
    const insights = [];
    const scenario = simulation.scenarioIfDo;
    const action = simulation.action;
    if (analysis.budgetingAnalysis.key_findings.length > 0) {
        const budgetFinding = analysis.budgetingAnalysis.key_findings[0];
        if (budgetFinding && !budgetFinding.includes('agent')) {
            insights.push(`**Budget:** ${budgetFinding}`);
        }
    }
    const monthlyIncome = userProfile.monthlyIncome;
    const totalExpenses = userProfile.fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
    const surplus = monthlyIncome - totalExpenses;
    const remainingAfterAction = surplus - action.amount;
    if (remainingAfterAction < 500) {
        insights.push(`**Flexibility:** This leaves you with $${remainingAfterAction.toLocaleString()} buffer this month`);
    }
    if (action.type === 'invest' && analysis.investmentAnalysis.key_findings.length > 0) {
        const investFinding = analysis.investmentAnalysis.key_findings[0];
        if (investFinding && !investFinding.includes('agent')) {
            insights.push(`**Growth potential:** ${investFinding}`);
        }
        const projectedValue5yr = action.amount * Math.pow(1.07, 5);
        insights.push(`In 5 years at 7% avg return: **~$${Math.round(projectedValue5yr).toLocaleString()}**`);
    }
    const checkingAfter = scenario.accountsAfter.checking;
    const savingsAfter = scenario.accountsAfter.savings;
    if (action.type === 'save' || action.type === 'spend') {
        insights.push(`**After this action:** Checking: $${checkingAfter.toLocaleString()} | Savings: $${savingsAfter.toLocaleString()}`);
    }
    if (userProfile.preferences.riskTolerance === 'conservative' && action.type === 'invest') {
        insights.push(`**Note:** Given your conservative risk preference, consider starting with a smaller amount`);
    }
    else if (userProfile.preferences.riskTolerance === 'aggressive' && action.type === 'save') {
        insights.push(`**Consider:** With your aggressive risk profile, investing could yield higher returns`);
    }
    if (analysis.guardrailAnalysis.can_proceed) {
        const checkingGuardrail = userProfile.preferences.guardrails.find((g) => g.accountId === 'checking' && g.type === 'min_balance');
        const checkingMin = checkingGuardrail?.threshold;
        if (checkingMin && checkingAfter > checkingMin + 500) {
            insights.push(`✅ Your checking stays safely above your $${checkingMin.toLocaleString()} minimum`);
        }
    }
    if (analysis.overallConfidence === 'high') {
        insights.push(`**Confidence:** High — this aligns well with your goals and constraints`);
    }
    else if (analysis.overallConfidence === 'medium') {
        insights.push(`**Confidence:** Medium — there are some trade-offs to weigh`);
    }
    else if (analysis.overallConfidence === 'low') {
        insights.push(`**Confidence:** Lower — I'd recommend more caution here`);
    }
    return insights.join('\n');
}
function formatSimulationDetails(simulation) {
    const parts = [];
    parts.push(`Action: ${simulation.action.type} $${simulation.action.amount.toLocaleString()}`);
    parts.push(`Summary: ${simulation.reasoning}`);
    const goalImpacts = simulation.scenarioIfDo.goalImpacts;
    if (goalImpacts && goalImpacts.length > 0) {
        parts.push(`Goal impacts: ${goalImpacts.map((g) => `${g.goalName}: +${g.progressChangePct.toFixed(1)}%`).join(', ')}`);
    }
    return parts.join('\n');
}
function generateFollowUps(simulation, userProfile) {
    const followUps = [];
    const amount = simulation.action.amount;
    followUps.push(`What about $${Math.round(amount * 1.5).toLocaleString()} instead?`);
    if (amount > 200) {
        followUps.push(`What if I only did $${Math.round(amount * 0.5).toLocaleString()}?`);
    }
    if (simulation.action.type === 'invest') {
        followUps.push(`What if I saved this instead of investing?`);
    }
    else if (simulation.action.type === 'save') {
        followUps.push(`Should I invest this instead?`);
    }
    const currentGoalId = simulation.action.goalId;
    const otherGoals = userProfile.goals.filter(g => g.id !== currentGoalId);
    if (otherGoals.length > 0 && otherGoals[0]) {
        followUps.push(`What about putting this toward ${otherGoals[0].name}?`);
    }
    return followUps.slice(0, 4);
}
//# sourceMappingURL=response-formatter.js.map