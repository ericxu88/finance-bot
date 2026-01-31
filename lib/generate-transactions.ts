/**
 * Transaction Generator
 * 
 * Generates realistic transaction history for demo users
 */

import type { Transaction, SpendingCategory } from '../types/financial.js';

interface TransactionTemplate {
  category: string;
  descriptions: string[];
  minAmount: number;
  maxAmount: number;
}

const transactionTemplates: Record<string, TransactionTemplate> = {
  cat_groceries: {
    category: 'cat_groceries',
    descriptions: [
      'Whole Foods',
      'Trader Joe\'s',
      'Safeway',
      'Costco',
      'Local Market',
      'Farmers Market',
    ],
    minAmount: 30,
    maxAmount: 150,
  },
  cat_dining: {
    category: 'cat_dining',
    descriptions: [
      'Chipotle',
      'Local Restaurant',
      'Coffee Shop',
      'Pizza Place',
      'Sushi Restaurant',
      'Food Truck',
      'Cafe',
    ],
    minAmount: 15,
    maxAmount: 80,
  },
  cat_entertainment: {
    category: 'cat_entertainment',
    descriptions: [
      'Netflix',
      'Spotify',
      'Movie Tickets',
      'Concert',
      'Theater',
      'Streaming Service',
      'Gaming',
    ],
    minAmount: 10,
    maxAmount: 120,
  },
  cat_transportation: {
    category: 'cat_transportation',
    descriptions: [
      'Gas Station',
      'Uber',
      'Lyft',
      'Parking',
      'Public Transit',
      'Car Wash',
    ],
    minAmount: 10,
    maxAmount: 60,
  },
  cat_shopping: {
    category: 'cat_shopping',
    descriptions: [
      'Amazon',
      'Target',
      'Clothing Store',
      'Online Shopping',
      'Department Store',
    ],
    minAmount: 20,
    maxAmount: 200,
  },
  cat_fitness: {
    category: 'cat_fitness',
    descriptions: [
      'Gym Membership',
      'Yoga Class',
      'Fitness Equipment',
      'Sports Gear',
    ],
    minAmount: 20,
    maxAmount: 100,
  },
};

/**
 * Generate a random amount within a range
 */
function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

/**
 * Generate a random date between start and end
 */
function randomDate(start: Date, end: Date): Date {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
}

/**
 * Generate realistic transactions for a spending category
 */
export function generateTransactions(
  count: number,
  categories: SpendingCategory[],
  startDate: Date,
  endDate: Date
): Transaction[] {
  const transactions: Transaction[] = [];
  let idCounter = 1;

  // Calculate how many transactions per category
  const categoriesWithBudget = categories.filter(c => c.monthlyBudget > 0);
  const transactionsPerCategory = Math.floor(count / categoriesWithBudget.length);

  for (const category of categoriesWithBudget) {
    const template = transactionTemplates[category.id];
    if (!template) continue;

    let categoryTotal = 0;
    const categoryTransactions: Transaction[] = [];

    // Generate transactions for this category
    for (let i = 0; i < transactionsPerCategory; i++) {
      const amount = randomAmount(template.minAmount, template.maxAmount);
      const date = randomDate(startDate, endDate);
      const description =
        template.descriptions[Math.floor(Math.random() * template.descriptions.length)];

      categoryTransactions.push({
        id: `txn_${idCounter++}`,
        date,
        amount: -amount,
        category: category.id,
        description: description || 'Purchase',
        type: 'expense',
      });

      categoryTotal += amount;
    }

    // Adjust last transaction to match currentSpent if needed
    if (categoryTransactions.length > 0 && category.currentSpent > 0) {
      const diff = category.currentSpent - categoryTotal;
      const lastTxn = categoryTransactions[categoryTransactions.length - 1];
      if (lastTxn) {
        lastTxn.amount = -(Math.abs(lastTxn.amount) + diff);
      }
    }

    transactions.push(...categoryTransactions);
  }

  // Sort by date (newest first)
  transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

  return transactions;
}

/**
 * Generate recurring fixed expense transactions
 */
export function generateFixedExpenseTransactions(
  expenseName: string,
  amount: number,
  startDate: Date,
  endDate: Date,
  dayOfMonth: number = 1
): Transaction[] {
  const transactions: Transaction[] = [];
  let idCounter = 1;
  
  const currentDate = new Date(startDate);
  currentDate.setDate(dayOfMonth);

  while (currentDate <= endDate) {
    if (currentDate >= startDate) {
      transactions.push({
        id: `recurring_${expenseName.toLowerCase().replace(/\s/g, '_')}_${idCounter++}`,
        date: new Date(currentDate),
        amount: -amount,
        category: 'fixed',
        description: expenseName,
        type: 'expense',
      });
    }
    
    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return transactions;
}

/**
 * Generate income transactions
 */
export function generateIncomeTransactions(
  monthlyIncome: number,
  startDate: Date,
  endDate: Date,
  dayOfMonth: number = 28
): Transaction[] {
  const transactions: Transaction[] = [];
  let idCounter = 1;
  
  const currentDate = new Date(startDate);
  currentDate.setDate(dayOfMonth);

  while (currentDate <= endDate) {
    if (currentDate >= startDate) {
      transactions.push({
        id: `income_${idCounter++}`,
        date: new Date(currentDate),
        amount: monthlyIncome,
        category: 'income',
        description: 'Salary Deposit',
        type: 'income',
      });
    }
    
    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return transactions;
}

/**
 * Generate goal contribution transactions
 */
export function generateGoalTransactions(
  goalName: string,
  contributions: number[],
  dates: Date[]
): Transaction[] {
  return contributions.map((amount, index) => ({
    id: `goal_${goalName.toLowerCase().replace(/\s/g, '_')}_${index + 1}`,
    date: dates[index] || new Date(),
    amount,
    category: 'goal',
    description: `Contribution to ${goalName}`,
    type: 'transfer',
  }));
}
