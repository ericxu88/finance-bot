import { ArrowLeft, TrendingUp, DollarSign, Target } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useFinancial } from '@/app/contexts/FinancialContext';

interface InvestmentAnalysisProps {
  onBack: () => void;
}

export function InvestmentAnalysis({ onBack }: InvestmentAnalysisProps) {
  const { state } = useFinancial();

  const investmentAccount = state.accounts.find(a => a.id === 'investment');
  const currentBalance = investmentAccount?.balance || 0;

  // Investment growth data (mock historical data)
  const growthData = [
    { month: 'Jan', value: 48000, projected: 48000 },
    { month: 'Feb', value: 49200, projected: 49000 },
    { month: 'Mar', value: 50100, projected: 50500 },
    { month: 'Apr', value: 51500, projected: 52000 },
    { month: 'May', value: currentBalance, projected: 53500 },
    { month: 'Jun', projected: 55000 },
    { month: 'Jul', projected: 56500 },
    { month: 'Aug', projected: 58000 },
  ];

  // Portfolio allocation
  const portfolioAllocation = [
    { name: 'Stocks', value: currentBalance * 0.60, percentage: 60 },
    { name: 'Bonds', value: currentBalance * 0.25, percentage: 25 },
    { name: 'Real Estate', value: currentBalance * 0.10, percentage: 10 },
    { name: 'Cash', value: currentBalance * 0.05, percentage: 5 },
  ];

  // Monthly contributions
  const contributionData = [
    { month: 'Jan', contribution: 500, returns: 150 },
    { month: 'Feb', contribution: 500, returns: 200 },
    { month: 'Mar', contribution: 500, returns: 180 },
    { month: 'Apr', contribution: 500, returns: 250 },
    { month: 'May', contribution: 500, returns: 220 },
  ];

  const totalContributions = contributionData.reduce((sum, d) => sum + d.contribution, 0);
  const totalReturns = contributionData.reduce((sum, d) => sum + d.returns, 0);
  const returnRate = ((totalReturns / totalContributions) * 100).toFixed(2);

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
        <h1 className="text-2xl font-bold">Investment Analysis</h1>
        <p className="text-sm opacity-90 mt-1">Track your portfolio performance and growth</p>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="size-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-600">Current Balance</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">${currentBalance.toFixed(2)}</p>
            <p className="text-sm text-green-600 mt-1">+4.2% this month</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="size-5 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-600">Total Returns</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">${totalReturns.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">{returnRate}% return rate</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Target className="size-5 text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-600">Monthly Contributions</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">$500</p>
            <p className="text-sm text-gray-500 mt-1">Auto-investing enabled</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="size-5 text-orange-600" />
              <h3 className="text-sm font-semibold text-gray-600">Projected (Dec)</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">$58,000</p>
            <p className="text-sm text-orange-600 mt-1">+12.3% YTD</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Investment Growth - Area Chart */}
          <div className="bg-white rounded-lg p-6 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Investment Growth & Projections</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0088FE" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82CA9D" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#82CA9D" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => value ? `$${value.toFixed(2)}` : 'N/A'} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#0088FE"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  name="Actual Value"
                />
                <Area
                  type="monotone"
                  dataKey="projected"
                  stroke="#82CA9D"
                  fillOpacity={1}
                  fill="url(#colorProjected)"
                  strokeDasharray="5 5"
                  name="Projected Value"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Contributions vs Returns */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Contributions vs Returns</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={contributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value}`} />
                <Legend />
                <Bar dataKey="contribution" fill="#0088FE" name="Monthly Contribution" />
                <Bar dataKey="returns" fill="#82CA9D" name="Investment Returns" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Portfolio Allocation */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Portfolio Allocation</h2>
            <div className="space-y-4">
              {portfolioAllocation.map((asset, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{asset.name}</span>
                    <span className="text-sm font-bold text-gray-900">{asset.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                      style={{ width: `${asset.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">${asset.value.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Investment Insights */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Investment Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">✓ Diversified Portfolio</h3>
              <p className="text-sm text-blue-700">
                Your portfolio is well-diversified across multiple asset classes, reducing overall risk.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">✓ Consistent Growth</h3>
              <p className="text-sm text-green-700">
                Your investments are showing consistent growth with an average return of {returnRate}% over the past 5 months.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-2">💡 Increase Contributions</h3>
              <p className="text-sm text-purple-700">
                Consider increasing monthly contributions by $200 to reach $65,000 by year-end.
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h3 className="font-semibold text-orange-900 mb-2">💡 Rebalance Portfolio</h3>
              <p className="text-sm text-orange-700">
                Your stock allocation has grown. Consider rebalancing to maintain your target 60/25/10/5 allocation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
