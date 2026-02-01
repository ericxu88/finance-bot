import { ArrowLeft } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useFinancial } from '@/app/contexts/FinancialContext';

interface SpendingAnalysisProps {
  onBack: () => void;
}

export function SpendingAnalysis({ onBack }: SpendingAnalysisProps) {
  const { state } = useFinancial();

  // Prepare spending data by category
  const categoryData = state.expenses.map(expense => ({
    category: expense.category,
    amount: expense.amount,
    percentage: ((expense.amount / state.monthlyIncome) * 100).toFixed(1),
  }));

  // Monthly trend data (mock data for demonstration)
  const monthlyTrend = [
    { month: 'Jan', spending: 4200, budget: 5000 },
    { month: 'Feb', spending: 3800, budget: 5000 },
    { month: 'Mar', spending: 4500, budget: 5000 },
    { month: 'Apr', spending: 4100, budget: 5000 },
    { month: 'May', spending: state.expenses.reduce((sum, e) => sum + e.amount, 0), budget: 5000 },
  ];

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

  const totalExpenses = state.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remainingBudget = state.monthlyIncome - totalExpenses;

  return (
    <div className="size-full bg-[#F4F6F8] overflow-auto">
      {/* Header */}
      <div className="bg-[#005EB8] text-white px-6 py-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity mb-3"
        >
          <ArrowLeft className="size-5" />
          <span className="font-semibold">Back to Home</span>
        </button>
        <h1 className="text-2xl font-bold">Spending Analysis</h1>
        <p className="text-sm opacity-90 mt-1">Your spending breakdown and insights</p>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Monthly Spending</h3>
            <p className="text-3xl font-bold text-gray-900">${totalExpenses.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">
              {((totalExpenses / state.monthlyIncome) * 100).toFixed(1)}% of income
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Monthly Income</h3>
            <p className="text-3xl font-bold text-gray-900">${state.monthlyIncome.toFixed(2)}</p>
            <p className="text-sm text-green-600 mt-1">Available for goals</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Remaining Budget</h3>
            <p className="text-3xl font-bold text-green-600">${remainingBudget.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">
              {((remainingBudget / state.monthlyIncome) * 100).toFixed(1)}% available
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spending by Category - Bar Chart */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Spending by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => `$${value}`} />
                <Bar dataKey="amount" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution - Pie Chart */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Category Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.category}: ${entry.percentage}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Trend - Line Chart */}
          <div className="bg-white rounded-lg p-6 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Monthly Spending Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value}`} />
                <Legend />
                <Line type="monotone" dataKey="spending" stroke="#0088FE" strokeWidth={2} name="Actual Spending" />
                <Line type="monotone" dataKey="budget" stroke="#82CA9D" strokeWidth={2} strokeDasharray="5 5" name="Budget" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Detailed Breakdown</h2>
          <div className="space-y-3">
            {categoryData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-semibold text-gray-900">{item.category}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${item.amount.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">{item.percentage}% of income</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
