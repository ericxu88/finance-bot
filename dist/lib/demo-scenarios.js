import { sarah, marcus, elena } from './demo-users.js';
const sarahScenario = {
    id: 'young_professional',
    name: 'Sarah Chen - Young Professional',
    persona: '28yo Software Engineer',
    description: 'Early-career professional focused on building emergency fund and saving for first home. Has moderate risk tolerance and wants to balance saving with enjoying life.',
    highlights: [
        'Building emergency fund (53% complete)',
        'Saving for house down payment (5 year goal)',
        'Planning a Europe vacation',
        'Moderate risk tolerance',
    ],
    user: sarah,
    suggestedActions: [
        {
            id: 'sarah_emergency',
            description: 'Save $500 to emergency fund',
            action: {
                type: 'save',
                amount: 500,
                goalId: 'goal_emergency',
            },
            expectedOutcome: 'Reach emergency fund goal 2 months faster',
        },
        {
            id: 'sarah_invest_house',
            description: 'Invest $500 for house down payment',
            action: {
                type: 'invest',
                amount: 500,
                targetAccountId: 'taxable',
                goalId: 'goal_house',
            },
            expectedOutcome: 'Projected growth to $750+ over 5 years',
        },
        {
            id: 'sarah_vacation',
            description: 'Save $300 for Europe vacation',
            action: {
                type: 'save',
                amount: 300,
                goalId: 'goal_vacation',
            },
            expectedOutcome: 'Stay on track for 8-month deadline',
        },
        {
            id: 'sarah_dining',
            description: 'Spend $75 on nice dinner',
            action: {
                type: 'spend',
                amount: 75,
                category: 'cat_dining',
            },
            expectedOutcome: 'Stays within dining budget (56% used)',
        },
    ],
};
const marcusScenario = {
    id: 'experienced_investor',
    name: 'Marcus Johnson - Experienced Investor',
    persona: '42yo Consultant, Family Man',
    description: 'Mid-career professional with aggressive investment strategy. Focused on retirement and kids\' college funds while maintaining home.',
    highlights: [
        '$158K retirement portfolio (16% of goal)',
        'Kids\' college fund ($45K saved)',
        'Home renovation project in 2 years',
        'Aggressive risk tolerance',
    ],
    user: marcus,
    suggestedActions: [
        {
            id: 'marcus_401k',
            description: 'Max out 401k contribution ($1,500)',
            action: {
                type: 'invest',
                amount: 1500,
                targetAccountId: 'traditional401k',
                goalId: 'goal_retirement',
            },
            expectedOutcome: 'Tax-deferred growth, reduce taxable income',
        },
        {
            id: 'marcus_college',
            description: 'Invest $800 for college fund',
            action: {
                type: 'invest',
                amount: 800,
                targetAccountId: 'taxable',
                goalId: 'goal_college',
            },
            expectedOutcome: 'Projected to grow significantly over 15 years',
        },
        {
            id: 'marcus_renovation',
            description: 'Save $500 for home renovation',
            action: {
                type: 'save',
                amount: 500,
                goalId: 'goal_home_improvement',
            },
            expectedOutcome: 'On track for 2-year renovation budget',
        },
        {
            id: 'marcus_splurge',
            description: 'Spend $200 on family entertainment',
            action: {
                type: 'spend',
                amount: 200,
                category: 'cat_entertainment',
            },
            expectedOutcome: 'Within entertainment budget (70% used)',
        },
    ],
};
const elenaScenario = {
    id: 'conservative_saver',
    name: 'Elena Rodriguez - Conservative Saver',
    persona: '35yo Teacher, Debt-Conscious',
    description: 'Careful saver prioritizing financial security and paying off student loans. Conservative approach with focus on liquidity and emergency fund.',
    highlights: [
        'Emergency fund priority (67% complete)',
        'Paying off $25K student loans',
        'Saving for reliable car',
        'Conservative risk tolerance',
    ],
    user: elena,
    suggestedActions: [
        {
            id: 'elena_emergency',
            description: 'Save $400 to emergency fund',
            action: {
                type: 'save',
                amount: 400,
                goalId: 'goal_emergency',
            },
            expectedOutcome: 'Complete emergency fund in 15 months',
        },
        {
            id: 'elena_debt',
            description: 'Extra $200 toward student loans',
            action: {
                type: 'save',
                amount: 200,
                goalId: 'goal_debt',
            },
            expectedOutcome: 'Pay off loans 6 months faster',
        },
        {
            id: 'elena_car',
            description: 'Save $150 for car fund',
            action: {
                type: 'save',
                amount: 150,
                goalId: 'goal_car',
            },
            expectedOutcome: 'Steady progress toward new car',
        },
        {
            id: 'elena_conservative_invest',
            description: 'Invest $100 in Roth IRA',
            action: {
                type: 'invest',
                amount: 100,
                targetAccountId: 'rothIRA',
            },
            expectedOutcome: 'Start building retirement slowly',
        },
    ],
};
export const demoScenarios = [
    sarahScenario,
    marcusScenario,
    elenaScenario,
];
export function getScenarioById(id) {
    return demoScenarios.find(s => s.id === id) || null;
}
export function getScenarioSummaries() {
    return demoScenarios.map(s => ({
        id: s.id,
        name: s.name,
        persona: s.persona,
        description: s.description,
        highlights: s.highlights,
        userId: s.user.id,
        suggestedActions: s.suggestedActions,
    }));
}
//# sourceMappingURL=demo-scenarios.js.map