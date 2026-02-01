import { ArrowLeft, Target, Calendar, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useFinancial } from '@/app/contexts/FinancialContext';
import { Progress } from '@/app/components/ui/progress';

interface GoalsProgressProps {
  onBack: () => void;
}

export function GoalsProgress({ onBack }: GoalsProgressProps) {
  const { state } = useFinancial();

  // Calculate progress for each goal
  const goalsWithProgress = state.goals.map(goal => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const remaining = goal.targetAmount - goal.currentAmount;
    const daysToDeadline = Math.floor((goal.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const monthsRemaining = Math.max(1, Math.floor(daysToDeadline / 30));
    const monthlyRequired = remaining / monthsRemaining;

    return {
      ...goal,
      progress,
      remaining,
      daysToDeadline,
      monthsRemaining,
      monthlyRequired,
    };
  });

  // Progress over time (mock data showing goal progress)
  const progressTimeline = [
    { month: 'Jan', vacation: 15, emergency: 40, car: 10 },
    { month: 'Feb', vacation: 25, emergency: 50, car: 18 },
    { month: 'Mar', vacation: 35, emergency: 60, car: 25 },
    { month: 'Apr', vacation: 48, emergency: 72, car: 35 },
    { month: 'May', 
      vacation: goalsWithProgress.find(g => g.id === 'vacation')?.progress || 0,
      emergency: goalsWithProgress.find(g => g.id === 'emergency')?.progress || 0,
      car: goalsWithProgress.find(g => g.id === 'car')?.progress || 0
    },
  ];

  // Goal comparison
  const goalComparison = goalsWithProgress.map(goal => ({
    name: goal.name,
    current: goal.currentAmount,
    target: goal.targetAmount,
  }));

  const totalSaved = goalsWithProgress.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = goalsWithProgress.reduce((sum, g) => sum + g.targetAmount, 0);
  const overallProgress = (totalSaved / totalTarget) * 100;

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
        <h1 className="text-2xl font-bold">Goals Progress</h1>
        <p className="text-sm opacity-90 mt-1">Track your financial goals and milestones</p>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Target className="size-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-600">Total Saved</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">${totalSaved.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">Across {state.goals.length} goals</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="size-5 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-600">Overall Progress</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">{overallProgress.toFixed(1)}%</p>
            <Progress value={overallProgress} className="mt-2 h-2" />
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="size-5 text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-600">Target Amount</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">${totalTarget.toFixed(2)}</p>
            <p className="text-sm text-orange-600 mt-1">${(totalTarget - totalSaved).toFixed(2)} remaining</p>
          </div>
        </div>

        {/* Individual Goals */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Your Goals</h2>
          {goalsWithProgress.map((goal) => (
            <div key={goal.id} className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{goal.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {goal.daysToDeadline > 0 
                      ? `${goal.daysToDeadline} days remaining`
                      : 'Deadline passed'}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  goal.priority === 'high' ? 'bg-red-100 text-red-700' :
                  goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {goal.priority.toUpperCase()} PRIORITY
                </span>
              </div>

              <div className="space-y-3">
                <Progress value={goal.progress} className="h-3" />
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Current Amount</p>
                    <p className="text-lg font-bold text-gray-900">${goal.currentAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Target Amount</p>
                    <p className="text-lg font-bold text-gray-900">${goal.targetAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Remaining</p>
                    <p className="text-lg font-bold text-orange-600">${goal.remaining.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Monthly Required</p>
                    <p className="text-lg font-bold text-blue-600">${goal.monthlyRequired.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-700">
                    Progress: {goal.progress.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500">
                    {goal.monthsRemaining} months to go
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progress Timeline */}
          <div className="bg-white rounded-lg p-6 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Progress Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progressTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis label={{ value: 'Progress %', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Line type="monotone" dataKey="vacation" stroke="#0088FE" strokeWidth={2} name="Vacation Fund" />
                <Line type="monotone" dataKey="emergency" stroke="#00C49F" strokeWidth={2} name="Emergency Fund" />
                <Line type="monotone" dataKey="car" stroke="#FFBB28" strokeWidth={2} name="New Car" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Goal Comparison */}
          <div className="bg-white rounded-lg p-6 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Current vs Target Amounts</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={goalComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value}`} />
                <Legend />
                <Bar dataKey="current" fill="#0088FE" name="Current Amount" />
                <Bar dataKey="target" fill="#82CA9D" name="Target Amount" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insights & Recommendations */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Insights & Recommendations</h2>
          <div className="space-y-3">
            {goalsWithProgress.map((goal) => {
              const isOnTrack = goal.progress >= (100 - (goal.daysToDeadline / goal.daysToDeadline * 100));
              return (
                <div
                  key={goal.id}
                  className={`p-4 rounded-lg border ${
                    isOnTrack ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
                  }`}
                >
                  <h3 className={`font-semibold mb-2 ${
                    isOnTrack ? 'text-green-900' : 'text-orange-900'
                  }`}>
                    {isOnTrack ? '✓' : '⚠'} {goal.name}
                  </h3>
                  <p className={`text-sm ${
                    isOnTrack ? 'text-green-700' : 'text-orange-700'
                  }`}>
                    {isOnTrack
                      ? `Great progress! You're on track to reach your goal. Keep contributing regularly.`
                      : `You need to save $${goal.monthlyRequired.toFixed(2)} per month to reach your goal on time. Consider increasing your contributions.`
                    }
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
