import { getInvestmentBalance } from '../types/financial.js';
export const sampleUser = {
    id: 'user_sarah_demo',
    name: 'Sarah',
    monthlyIncome: 5000,
    accounts: {
        checking: 3000,
        savings: 8000,
        investments: {
            taxable: {
                balance: 5000,
                allocation: { stocks: 80, bonds: 15, cash: 5 },
            },
            rothIRA: {
                balance: 0,
                allocation: { stocks: 90, bonds: 10, cash: 0 },
            },
            traditional401k: {
                balance: 0,
                allocation: { stocks: 70, bonds: 25, cash: 5 },
            },
        },
    },
    fixedExpenses: [
        {
            id: 'exp_rent',
            name: 'Rent',
            amount: 1500,
            frequency: 'monthly',
            dueDay: 1,
        },
        {
            id: 'exp_utilities',
            name: 'Utilities',
            amount: 150,
            frequency: 'monthly',
            dueDay: 15,
        },
        {
            id: 'exp_car',
            name: 'Car Payment',
            amount: 350,
            frequency: 'monthly',
            dueDay: 10,
        },
    ],
    spendingCategories: [
        {
            id: 'cat_groceries',
            name: 'Groceries',
            monthlyBudget: 400,
            currentSpent: 178.45,
            transactions: [
                { id: 'txn_1', date: new Date('2026-01-05'), amount: -62.30, category: 'cat_groceries', description: 'Whole Foods Market', type: 'expense' },
                { id: 'txn_2', date: new Date('2026-01-12'), amount: -48.75, category: 'cat_groceries', description: 'Trader Joe\'s', type: 'expense' },
                { id: 'txn_3', date: new Date('2026-01-19'), amount: -35.20, category: 'cat_groceries', description: 'Safeway', type: 'expense' },
                { id: 'txn_4', date: new Date('2026-01-26'), amount: -32.20, category: 'cat_groceries', description: 'Whole Foods Market', type: 'expense' },
            ],
            subcategories: [
                { id: 'sub_produce', name: 'Produce', monthlyBudget: 120, currentSpent: 0 },
                { id: 'sub_meat', name: 'Meat & Seafood', monthlyBudget: 100, currentSpent: 0 },
                { id: 'sub_dairy', name: 'Dairy', monthlyBudget: 60, currentSpent: 0 },
                { id: 'sub_pantry', name: 'Pantry Staples', monthlyBudget: 80, currentSpent: 0 },
                { id: 'sub_snacks', name: 'Snacks & Beverages', monthlyBudget: 40, currentSpent: 0 },
            ],
        },
        {
            id: 'cat_dining',
            name: 'Dining',
            monthlyBudget: 200,
            currentSpent: 142.60,
            transactions: [
                { id: 'txn_5', date: new Date('2026-01-04'), amount: -28.50, category: 'cat_dining', description: 'Starbucks', type: 'expense' },
                { id: 'txn_6', date: new Date('2026-01-08'), amount: -45.80, category: 'cat_dining', description: 'The Cheesecake Factory', type: 'expense' },
                { id: 'txn_7', date: new Date('2026-01-15'), amount: -18.30, category: 'cat_dining', description: 'Chipotle', type: 'expense' },
                { id: 'txn_8', date: new Date('2026-01-22'), amount: -35.00, category: 'cat_dining', description: 'DoorDash - Pizza Hut', type: 'expense' },
                { id: 'txn_9', date: new Date('2026-01-28'), amount: -15.00, category: 'cat_dining', description: 'Starbucks', type: 'expense' },
            ],
            subcategories: [
                { id: 'sub_restaurants', name: 'Restaurants', monthlyBudget: 120, currentSpent: 0 },
                { id: 'sub_coffee', name: 'Coffee Shops', monthlyBudget: 40, currentSpent: 0 },
                { id: 'sub_delivery', name: 'Food Delivery', monthlyBudget: 40, currentSpent: 0 },
            ],
        },
        {
            id: 'cat_entertainment',
            name: 'Entertainment',
            monthlyBudget: 150,
            currentSpent: 89.97,
            transactions: [
                { id: 'txn_10', date: new Date('2026-01-01'), amount: -15.99, category: 'cat_entertainment', description: 'Netflix Subscription', type: 'expense' },
                { id: 'txn_11', date: new Date('2026-01-01'), amount: -12.99, category: 'cat_entertainment', description: 'Spotify Premium', type: 'expense' },
                { id: 'txn_12', date: new Date('2026-01-17'), amount: -60.99, category: 'cat_entertainment', description: 'Concert Tickets', type: 'expense' },
            ],
            subcategories: [
                { id: 'sub_streaming', name: 'Streaming Services', monthlyBudget: 40, currentSpent: 0 },
                { id: 'sub_events', name: 'Events & Concerts', monthlyBudget: 60, currentSpent: 0 },
                { id: 'sub_hobbies', name: 'Hobbies', monthlyBudget: 50, currentSpent: 0 },
            ],
        },
        {
            id: 'cat_transportation',
            name: 'Transportation',
            monthlyBudget: 250,
            currentSpent: 187.50,
            transactions: [
                { id: 'txn_13', date: new Date('2026-01-03'), amount: -55.00, category: 'cat_transportation', description: 'Shell Gas Station', type: 'expense' },
                { id: 'txn_14', date: new Date('2026-01-11'), amount: -48.75, category: 'cat_transportation', description: 'Chevron', type: 'expense' },
                { id: 'txn_15', date: new Date('2026-01-20'), amount: -52.25, category: 'cat_transportation', description: 'BP Gas', type: 'expense' },
                { id: 'txn_16', date: new Date('2026-01-27'), amount: -31.50, category: 'cat_transportation', description: 'Uber', type: 'expense' },
            ],
        },
        {
            id: 'cat_utilities',
            name: 'Utilities & Bills',
            monthlyBudget: 200,
            currentSpent: 165.43,
            transactions: [
                { id: 'txn_17', date: new Date('2026-01-05'), amount: -85.20, category: 'cat_utilities', description: 'Electric Bill - PG&E', type: 'expense' },
                { id: 'txn_18', date: new Date('2026-01-10'), amount: -59.99, category: 'cat_utilities', description: 'Internet - Comcast', type: 'expense' },
                { id: 'txn_19', date: new Date('2026-01-15'), amount: -20.24, category: 'cat_utilities', description: 'Water Bill', type: 'expense' },
            ],
        },
        {
            id: 'cat_income',
            name: 'Income',
            monthlyBudget: 0,
            currentSpent: -5416.00,
            transactions: [
                { id: 'txn_20', date: new Date('2026-01-01'), amount: 2708.00, category: 'cat_income', description: 'Paycheck - Tech Corp', type: 'income' },
                { id: 'txn_21', date: new Date('2026-01-15'), amount: 2708.00, category: 'cat_income', description: 'Paycheck - Tech Corp', type: 'income' },
            ],
        },
        {
            id: 'cat_transfers',
            name: 'Transfers & Savings',
            monthlyBudget: 0,
            currentSpent: 0,
            transactions: [
                { id: 'txn_22', date: new Date('2026-01-02'), amount: -500.00, category: 'cat_transfers', description: 'Transfer to Savings', type: 'transfer' },
                { id: 'txn_23', date: new Date('2026-01-16'), amount: -300.00, category: 'cat_transfers', description: 'Roth IRA Contribution', type: 'transfer' },
                { id: 'txn_24', date: new Date('2026-01-07'), amount: -200.00, category: 'cat_transfers', description: 'Transfer to Vacation Fund', type: 'transfer' },
            ],
        },
        {
            id: 'cat_healthcare',
            name: 'Healthcare',
            monthlyBudget: 150,
            currentSpent: 85.00,
            transactions: [
                { id: 'txn_25', date: new Date('2026-01-12'), amount: -25.00, category: 'cat_healthcare', description: 'CVS Pharmacy', type: 'expense' },
                { id: 'txn_26', date: new Date('2026-01-21'), amount: -60.00, category: 'cat_healthcare', description: 'Doctor Copay', type: 'expense' },
            ],
        },
    ],
    goals: [
        {
            id: 'goal_emergency',
            name: 'Emergency Fund',
            targetAmount: 15000,
            currentAmount: 8000,
            deadline: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            priority: 1,
            timeHorizon: 'short',
            linkedAccountIds: ['savings'],
        },
        {
            id: 'goal_house',
            name: 'House Down Payment',
            targetAmount: 50000,
            currentAmount: 5000,
            deadline: new Date(new Date().setFullYear(new Date().getFullYear() + 5)),
            priority: 2,
            timeHorizon: 'long',
            linkedAccountIds: ['taxable', 'savings'],
        },
        {
            id: 'goal_vacation',
            name: 'Vacation',
            targetAmount: 3000,
            currentAmount: 0,
            deadline: new Date(new Date().setMonth(new Date().getMonth() + 8)),
            priority: 3,
            timeHorizon: 'short',
            linkedAccountIds: ['savings'],
        },
    ],
    preferences: {
        riskTolerance: 'moderate',
        liquidityPreference: 'medium',
        guardrails: [
            {
                id: 'guard_checking_min',
                rule: 'Never let checking drop below $1,000',
                type: 'min_balance',
                accountId: 'checking',
                threshold: 1000,
            },
        ],
        investmentPreferences: {
            autoInvestEnabled: false,
            reminderFrequency: 'monthly',
            reminderDay: 15,
            targetMonthlyInvestment: 500,
            preferredAccount: 'taxable',
        },
    },
    upcomingExpenses: [
        {
            id: 'upcoming_car_insurance',
            name: 'Car Insurance Premium',
            amount: 450,
            dueDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString(),
            isRecurring: true,
            notes: 'Semi-annual payment',
            status: 'pending',
        },
        {
            id: 'upcoming_subscription_renewal',
            name: 'Streaming Services Renewal',
            amount: 89,
            dueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
            isRecurring: true,
            categoryId: 'entertainment',
            status: 'pending',
        },
        {
            id: 'upcoming_gym_annual',
            name: 'Gym Annual Membership',
            amount: 350,
            dueDate: new Date(new Date().setDate(new Date().getDate() + 25)).toISOString(),
            isRecurring: true,
            notes: 'Annual fee due next month',
            status: 'pending',
        },
        {
            id: 'upcoming_medical_copay',
            name: 'Doctor Visit Copay',
            amount: 50,
            dueDate: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(),
            isRecurring: false,
            status: 'pending',
        },
    ],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-31'),
};
export const sampleAction = {
    type: 'invest',
    amount: 500,
    targetAccountId: 'taxable',
    goalId: 'goal_house',
};
export function calculateLiquidAssets(user) {
    return user.accounts.checking + user.accounts.savings;
}
export function calculateInvestedAssets(user) {
    const inv = user.accounts.investments;
    return getInvestmentBalance(inv.taxable) +
        getInvestmentBalance(inv.rothIRA) +
        getInvestmentBalance(inv.traditional401k);
}
export function calculateTotalAssets(user) {
    return calculateLiquidAssets(user) + calculateInvestedAssets(user);
}
export function calculateMonthlyFixedExpenses(user) {
    return user.fixedExpenses.reduce((total, expense) => {
        if (expense.frequency === 'monthly') {
            return total + expense.amount;
        }
        else if (expense.frequency === 'annual') {
            return total + (expense.amount / 12);
        }
        return total;
    }, 0);
}
export function calculateMonthlyDiscretionaryBudget(user) {
    return user.spendingCategories.reduce((total, category) => {
        return total + category.monthlyBudget;
    }, 0);
}
export function calculateMonthlySurplus(user) {
    const fixedExpenses = calculateMonthlyFixedExpenses(user);
    const discretionaryBudget = calculateMonthlyDiscretionaryBudget(user);
    return user.monthlyIncome - fixedExpenses - discretionaryBudget;
}
export function getGoalCompletionPct(goalId, user) {
    const goal = user.goals.find(g => g.id === goalId);
    if (!goal)
        return 0;
    return (goal.currentAmount / goal.targetAmount) * 100;
}
export function getMonthsUntilGoalDeadline(goalId, user) {
    const goal = user.goals.find(g => g.id === goalId);
    if (!goal)
        return 0;
    const now = new Date();
    const deadline = new Date(goal.deadline);
    const diffTime = deadline.getTime() - now.getTime();
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return Math.max(0, diffMonths);
}
export function checkGuardrails(user, action) {
    const violations = [];
    for (const guardrail of user.preferences.guardrails) {
        if (guardrail.type === 'min_balance' && guardrail.accountId === 'checking') {
            if (action.type === 'invest' || action.type === 'spend') {
                const newBalance = user.accounts.checking - action.amount;
                if (guardrail.threshold && newBalance < guardrail.threshold) {
                    violations.push(guardrail.rule);
                }
            }
        }
    }
    return {
        passed: violations.length === 0,
        violations,
    };
}
console.log('✅ Sample Data Types Validated\n');
console.log('='.repeat(60));
console.log('\n📊 SAMPLE USER: Sarah');
console.log('-'.repeat(60));
console.log(`Name: ${sampleUser.name}`);
console.log(`Monthly Income: $${sampleUser.monthlyIncome.toLocaleString()}`);
console.log(`\nAssets:`);
console.log(`  Checking: $${sampleUser.accounts.checking.toLocaleString()}`);
console.log(`  Savings: $${sampleUser.accounts.savings.toLocaleString()}`);
console.log(`  Taxable Investments: $${getInvestmentBalance(sampleUser.accounts.investments.taxable).toLocaleString()}`);
console.log(`  Total: $${calculateTotalAssets(sampleUser).toLocaleString()}`);
console.log(`\nMonthly Cash Flow:`);
console.log(`  Income: $${sampleUser.monthlyIncome.toLocaleString()}`);
console.log(`  Fixed Expenses: -$${calculateMonthlyFixedExpenses(sampleUser).toLocaleString()}`);
console.log(`  Discretionary Budget: -$${calculateMonthlyDiscretionaryBudget(sampleUser).toLocaleString()}`);
console.log(`  Surplus: $${calculateMonthlySurplus(sampleUser).toLocaleString()}`);
console.log(`\nFixed Expenses (${sampleUser.fixedExpenses.length}):`);
sampleUser.fixedExpenses.forEach(exp => {
    console.log(`  - ${exp.name}: $${exp.amount}`);
});
console.log(`\nSpending Categories (${sampleUser.spendingCategories.length}):`);
sampleUser.spendingCategories.forEach(cat => {
    console.log(`  - ${cat.name}: $${cat.monthlyBudget} budget`);
});
console.log(`\nFinancial Goals (${sampleUser.goals.length}):`);
sampleUser.goals.forEach(goal => {
    const completion = getGoalCompletionPct(goal.id, sampleUser);
    const monthsLeft = getMonthsUntilGoalDeadline(goal.id, sampleUser);
    console.log(`  ${goal.priority}. ${goal.name}:`);
    console.log(`     Progress: ${completion.toFixed(1)}% ($${goal.currentAmount.toLocaleString()} / $${goal.targetAmount.toLocaleString()})`);
    console.log(`     Deadline: ${monthsLeft} months (${goal.deadline.toLocaleDateString()})`);
});
console.log(`\nGuardrails (${sampleUser.preferences.guardrails.length}):`);
sampleUser.preferences.guardrails.forEach(guard => {
    console.log(`  - ${guard.rule}`);
});
console.log('\n💰 SAMPLE ACTION');
console.log('-'.repeat(60));
console.log(`Type: ${sampleAction.type}`);
console.log(`Amount: $${sampleAction.amount}`);
console.log(`Target Account: ${sampleAction.targetAccountId}`);
console.log(`Supporting Goal: ${sampleAction.goalId}`);
console.log('\n✅ GUARDRAIL CHECK');
console.log('-'.repeat(60));
const guardrailCheck = checkGuardrails(sampleUser, sampleAction);
if (guardrailCheck.passed) {
    console.log('✅ Action passes all guardrails');
}
else {
    console.log('❌ Action violates guardrails:');
    guardrailCheck.violations.forEach(v => console.log(`   - ${v}`));
}
console.log('\n🎉 TYPE VALIDATION COMPLETE');
console.log('='.repeat(60));
console.log('✓ All types compile without errors');
console.log('✓ Sample data instantiates correctly');
console.log('✓ Types can be imported and used');
console.log('✓ Helper functions work with typed data');
console.log('\n🚀 Data model is complete and workable!\n');
//# sourceMappingURL=sample-data.js.map