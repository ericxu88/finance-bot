export class FinancialOptimizerAgent {
    async optimize(userProfile) {
        const actions = [];
        const warnings = [];
        let totalPotentialSavings = 0;
        let totalReallocated = 0;
        const idleCashActions = this.analyzeIdleCash(userProfile, warnings);
        actions.push(...idleCashActions);
        totalReallocated += idleCashActions.reduce((sum, a) => sum + (a.details.amount || 0), 0);
        const budgetActions = this.analyzeUnderutilizedBudgets(userProfile, warnings);
        actions.push(...budgetActions);
        totalPotentialSavings += budgetActions.reduce((sum, a) => {
            const saved = (a.details.oldValue || 0) - (a.details.newValue || 0);
            return sum + (saved > 0 ? saved : 0);
        }, 0);
        const emergencyActions = this.analyzeEmergencyFund(userProfile, warnings);
        actions.push(...emergencyActions);
        const investmentActions = this.analyzeInvestmentOpportunities(userProfile, warnings);
        actions.push(...investmentActions);
        const summary = this.generateSummary(actions, totalPotentialSavings, totalReallocated, warnings);
        return {
            actions,
            summary,
            totalPotentialSavings,
            totalReallocated,
            warnings,
        };
    }
    analyzeIdleCash(userProfile, warnings) {
        const actions = [];
        const fixedExpensesTotal = userProfile.fixedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const actualSpending = userProfile.spendingCategories.reduce((sum, cat) => sum + cat.currentSpent, 0);
        const monthlyBurn = fixedExpensesTotal + actualSpending;
        const targetCheckingBalance = monthlyBurn * 1.5;
        const minCheckingBalance = Math.max(1000, monthlyBurn * 0.5);
        const currentChecking = userProfile.accounts.checking;
        const excessCash = currentChecking - targetCheckingBalance;
        if (excessCash > 500) {
            const emergencyGoal = userProfile.goals.find(g => g.name.toLowerCase().includes('emergency'));
            if (emergencyGoal && emergencyGoal.currentAmount < emergencyGoal.targetAmount) {
                const emergencyGap = emergencyGoal.targetAmount - emergencyGoal.currentAmount;
                const amountToMove = Math.min(excessCash, emergencyGap);
                if (amountToMove >= 100) {
                    actions.push({
                        type: 'transfer',
                        description: `Move $${amountToMove.toFixed(0)} from checking to savings for emergency fund`,
                        details: {
                            fromAccount: 'checking',
                            toAccount: 'savings',
                            amount: amountToMove,
                            goalId: emergencyGoal.id,
                        },
                        reasoning: `Checking balance ($${currentChecking.toFixed(0)}) is $${excessCash.toFixed(0)} above target ($${targetCheckingBalance.toFixed(0)}). Emergency fund needs $${emergencyGap.toFixed(0)} more to reach goal.`,
                        expectedImpact: `Emergency fund will be ${((emergencyGoal.currentAmount + amountToMove) / emergencyGoal.targetAmount * 100).toFixed(0)}% complete. Checking maintains safe buffer of $${(currentChecking - amountToMove).toFixed(0)}.`,
                        confidence: 'high',
                    });
                }
            }
            else if (excessCash > 1000) {
                const investmentAmount = Math.round(excessCash * 0.6);
                actions.push({
                    type: 'transfer',
                    description: `Move $${investmentAmount} from checking to investments`,
                    details: {
                        fromAccount: 'checking',
                        toAccount: 'investments',
                        amount: investmentAmount,
                    },
                    reasoning: `Checking has $${excessCash.toFixed(0)} excess cash above target. Emergency fund is adequately funded. Excess capital should be invested for growth.`,
                    expectedImpact: `Potential return: ~$${(investmentAmount * 0.07).toFixed(0)}/year (7% historical average). Checking maintains $${(currentChecking - investmentAmount).toFixed(0)} for daily expenses.`,
                    confidence: 'medium',
                });
            }
        }
        else if (currentChecking < minCheckingBalance) {
            warnings.push(`⚠️ Checking balance ($${currentChecking.toFixed(0)}) is below recommended minimum ($${minCheckingBalance.toFixed(0)}). Avoid large transfers until buffer is rebuilt.`);
        }
        return actions;
    }
    analyzeUnderutilizedBudgets(userProfile, warnings) {
        const actions = [];
        userProfile.spendingCategories.forEach(category => {
            if (category.monthlyBudget === 0)
                return;
            const utilizationPct = (category.currentSpent / category.monthlyBudget) * 100;
            if (utilizationPct < 50 && category.currentSpent > 0) {
                const newBudget = Math.ceil(category.currentSpent * 1.2);
                const savings = category.monthlyBudget - newBudget;
                if (savings >= 20) {
                    actions.push({
                        type: 'update_budget',
                        description: `Reduce ${category.name} budget from $${category.monthlyBudget} to $${newBudget}`,
                        details: {
                            category: category.name,
                            oldValue: category.monthlyBudget,
                            newValue: newBudget,
                        },
                        reasoning: `${category.name} is only using ${utilizationPct.toFixed(0)}% of budget ($${category.currentSpent}/$${category.monthlyBudget}). Recent spending suggests lower allocation is sufficient.`,
                        expectedImpact: `Frees up $${savings}/month ($${savings * 12}/year) for savings or higher-priority goals while maintaining 20% buffer above actual spending.`,
                        confidence: utilizationPct < 40 ? 'high' : 'medium',
                    });
                }
            }
            if (utilizationPct > 100) {
                warnings.push(`⚠️ ${category.name} is over budget by $${(category.currentSpent - category.monthlyBudget).toFixed(0)} (${utilizationPct.toFixed(0)}%). Consider increasing budget or reducing spending.`);
            }
        });
        return actions;
    }
    analyzeEmergencyFund(userProfile, warnings) {
        const actions = [];
        const emergencyGoal = userProfile.goals.find(g => g.name.toLowerCase().includes('emergency'));
        if (!emergencyGoal)
            return actions;
        const completion = (emergencyGoal.currentAmount / emergencyGoal.targetAmount) * 100;
        if (completion < 50) {
            const gap = emergencyGoal.targetAmount - emergencyGoal.currentAmount;
            warnings.push(`🚨 Emergency fund is only ${completion.toFixed(0)}% complete. This should be highest priority. Need $${gap.toFixed(0)} more.`);
            const monthlySurplus = this.calculateMonthlySurplus(userProfile);
            if (monthlySurplus > 200) {
                const allocation = Math.min(monthlySurplus * 0.7, gap);
                actions.push({
                    type: 'allocate_savings',
                    description: `Allocate $${Math.round(allocation)}/month to emergency fund`,
                    details: {
                        amount: Math.round(allocation),
                        goalId: emergencyGoal.id,
                    },
                    reasoning: `Emergency fund should be top priority at ${completion.toFixed(0)}% complete. Allocating 70% of monthly surplus ($${monthlySurplus.toFixed(0)}) ensures rapid progress.`,
                    expectedImpact: `Emergency fund will reach target in ${Math.ceil(gap / allocation)} months at this rate. Provides critical financial safety net.`,
                    confidence: 'high',
                });
            }
        }
        else if (completion >= 100) {
            const otherGoals = userProfile.goals.filter(g => g.id !== emergencyGoal.id);
            if (otherGoals.length > 0) {
                const nextGoal = otherGoals.sort((a, b) => (a.priority || 10) - (b.priority || 10))[0];
                const monthlySurplus = this.calculateMonthlySurplus(userProfile);
                if (monthlySurplus > 300 && nextGoal) {
                    actions.push({
                        type: 'allocate_savings',
                        description: `Allocate $${Math.round(monthlySurplus * 0.6)}/month to ${nextGoal.name}`,
                        details: {
                            amount: Math.round(monthlySurplus * 0.6),
                            goalId: nextGoal.id,
                        },
                        reasoning: `Emergency fund is fully funded. Next priority is ${nextGoal.name} at ${((nextGoal.currentAmount / nextGoal.targetAmount) * 100).toFixed(0)}% complete.`,
                        expectedImpact: `Will reach ${nextGoal.name} target in ${Math.ceil((nextGoal.targetAmount - nextGoal.currentAmount) / (monthlySurplus * 0.6))} months.`,
                        confidence: 'high',
                    });
                }
            }
        }
        return actions;
    }
    analyzeInvestmentOpportunities(userProfile, _warnings) {
        const actions = [];
        const emergencyGoal = userProfile.goals.find(g => g.name.toLowerCase().includes('emergency'));
        if (emergencyGoal && (emergencyGoal.currentAmount / emergencyGoal.targetAmount) < 0.7) {
            return actions;
        }
        const longTermGoals = userProfile.goals.filter(g => {
            if (!g.deadline)
                return false;
            const yearsToGoal = (new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 365);
            return yearsToGoal >= 5 && !g.name.toLowerCase().includes('emergency');
        });
        if (longTermGoals.length > 0 && userProfile.preferences.riskTolerance !== 'conservative') {
            const goal = longTermGoals[0];
            if (!goal)
                return actions;
            const monthlySurplus = this.calculateMonthlySurplus(userProfile);
            if (monthlySurplus > 400) {
                const investmentAmount = Math.round(monthlySurplus * 0.4);
                actions.push({
                    type: 'allocate_investment',
                    description: `Invest $${investmentAmount}/month toward ${goal.name}`,
                    details: {
                        amount: investmentAmount,
                        goalId: goal.id,
                        toAccount: 'investments',
                    },
                    reasoning: `${goal.name} has 5+ year time horizon. Investing provides higher returns (~7% vs ~4% savings). Risk tolerance is ${userProfile.preferences.riskTolerance}.`,
                    expectedImpact: `Projected value at goal deadline: $${this.projectInvestmentGrowth(investmentAmount, 5).toFixed(0)} (vs $${(investmentAmount * 12 * 5).toFixed(0)} in savings). Difference: +$${(this.projectInvestmentGrowth(investmentAmount, 5) - investmentAmount * 12 * 5).toFixed(0)}.`,
                    confidence: userProfile.preferences.riskTolerance === 'aggressive' ? 'high' : 'medium',
                });
            }
        }
        return actions;
    }
    calculateMonthlySurplus(userProfile) {
        const fixedExpenses = userProfile.fixedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const budgets = userProfile.spendingCategories.reduce((sum, cat) => sum + cat.monthlyBudget, 0);
        return userProfile.monthlyIncome - fixedExpenses - budgets;
    }
    projectInvestmentGrowth(monthlyAmount, years) {
        const annualReturn = 0.07;
        const months = years * 12;
        const monthlyRate = annualReturn / 12;
        return monthlyAmount * (((1 + monthlyRate) ** months - 1) / monthlyRate);
    }
    generateSummary(actions, totalPotentialSavings, totalReallocated, warnings) {
        if (actions.length === 0) {
            return "✅ Your finances are well-optimized. No immediate actions needed.";
        }
        let summary = `📊 **Financial Optimization Analysis**\n\n`;
        summary += `Identified ${actions.length} optimization opportunit${actions.length === 1 ? 'y' : 'ies'}:\n\n`;
        actions.forEach((action, i) => {
            const icon = action.type === 'transfer' ? '💸' :
                action.type === 'update_budget' ? '📝' :
                    action.type === 'allocate_savings' ? '💰' : '📈';
            summary += `${i + 1}. ${icon} **${action.description}**\n`;
            summary += `   ${action.reasoning}\n`;
            summary += `   💡 Impact: ${action.expectedImpact}\n`;
            summary += `   Confidence: ${action.confidence}\n\n`;
        });
        if (totalPotentialSavings > 0) {
            summary += `💰 **Total potential monthly savings:** $${totalPotentialSavings.toFixed(0)} ($${(totalPotentialSavings * 12).toFixed(0)}/year)\n`;
        }
        if (totalReallocated > 0) {
            summary += `📊 **Total capital reallocated:** $${totalReallocated.toFixed(0)}\n`;
        }
        if (warnings.length > 0) {
            summary += `\n**⚠️ Important Notes:**\n`;
            warnings.forEach(warning => {
                summary += `${warning}\n`;
            });
        }
        return summary;
    }
}
//# sourceMappingURL=financial-optimizer.js.map