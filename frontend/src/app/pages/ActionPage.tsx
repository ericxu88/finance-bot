import { useState } from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useFinancial } from '@/app/contexts/FinancialContext';
import { Button } from '@/app/components/ui/button';

interface TransferFormData {
  fromAccount?: string;
  toAccount?: string;
  amount?: number;
  date?: string;
  memo?: string;
}

interface ActionPageProps {
  action: string;
  description: string;
  amount: number;
  target?: string;
  transferData?: TransferFormData;
  onBack: () => void;
}

// Helper to match account name to account ID
function matchAccountName(accountName: string, accounts: Array<{ id: string; name: string; type: string }>): string | undefined {
  const lowerName = accountName.toLowerCase();
  // Try exact match first
  const exactMatch = accounts.find(a => lowerName.includes(a.name.toLowerCase()) || lowerName.includes(a.type));
  if (exactMatch) return exactMatch.id;
  
  // Try partial matches
  if (lowerName.includes('checking')) return accounts.find(a => a.type === 'checking')?.id;
  if (lowerName.includes('savings')) return accounts.find(a => a.type === 'savings')?.id;
  if (lowerName.includes('investment')) return accounts.find(a => a.type === 'investment')?.id;
  
  return undefined;
}

export function ActionPage({ action, description, amount: propAmount, target, transferData, onBack }: ActionPageProps) {
  const { state, addTransaction, updateGoal, refreshData } = useFinancial();
  const [completed, setCompleted] = useState(false);
  
  // Use transfer data if available, otherwise use props/defaults
  const amount = transferData?.amount || propAmount;
  const initialFromAccount = transferData?.fromAccount 
    ? matchAccountName(transferData.fromAccount, state.accounts) || 'checking'
    : 'checking';
  const initialToAccount = transferData?.toAccount
    ? matchAccountName(transferData.toAccount, state.accounts) || target || 'savings'
    : target || 'savings';
  
  const [selectedFromAccount, setSelectedFromAccount] = useState(initialFromAccount);
  const [selectedToAccount, setSelectedToAccount] = useState(initialToAccount);

  const fromAccount = state.accounts.find(a => a.id === selectedFromAccount);
  const hasEnoughFunds = fromAccount && fromAccount.balance >= amount;

  const handleExecuteAction = async () => {
    if (!hasEnoughFunds) return;

    try {
      // Execute the transfer/action via API
      const { executeTransaction } = await import('@/app/services/api');
      await executeTransaction({
        type: action.toLowerCase().includes('save') ? 'save' : 
              action.toLowerCase().includes('invest') ? 'invest' : 'transfer',
        amount,
        fromAccountId: selectedFromAccount,
        toAccountId: selectedToAccount,
        description: transferData?.memo || description,
      });
      
      // Refresh data from backend to get updated balances
      await refreshData();
      
      // Add transaction record
      addTransaction({
        date: new Date(transferData?.date || Date.now()),
        description: transferData?.memo || description,
        amount: -amount, // Negative for outgoing
        category: action.toLowerCase().includes('save') ? 'Savings' : 
                  action.toLowerCase().includes('invest') ? 'Investment' : 'Transfer',
      });
      
      setCompleted(true);
      
      // Redirect back after 2 seconds
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      console.error('Error executing transaction:', error);
      alert('Failed to execute transaction. Please try again.');
    }
  };

  // Parse the action to determine what we're doing
  const actionType = action.toLowerCase().includes('save') ? 'Save' : 
                     action.toLowerCase().includes('invest') ? 'Invest' : 
                     action.toLowerCase().includes('transfer') ? 'Transfer' : 'Action';

  return (
    <div className="size-full bg-[#F4F6F8] overflow-auto">
      {/* Header */}
      <div className="bg-[#005EB8] text-white px-6 py-4">
        {!completed && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity mb-3"
          >
            <ArrowLeft className="size-5" />
            <span className="font-semibold">Back</span>
          </button>
        )}
        <h1 className="text-2xl font-bold">{actionType} Money</h1>
        <p className="text-sm opacity-90 mt-1">Complete your financial action</p>
      </div>

      <div className="p-6 max-w-3xl mx-auto">
        {completed ? (
          /* Success Screen */
          <div className="bg-white rounded-lg p-8 shadow-sm text-center">
            <CheckCircle2 className="size-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Action Completed!</h2>
            <p className="text-gray-600 mb-4">
              Successfully {actionType.toLowerCase()}d ${amount.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">Redirecting you back...</p>
          </div>
        ) : (
          /* Action Form */
          <div className="space-y-6">
            {/* Action Summary Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Recommended Action</h2>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-1">{action}</h3>
                <p className="text-sm text-blue-700">{description}</p>
              </div>
            </div>

            {/* Transfer Details */}
            <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Transfer Details</h2>
              
              {/* Memo/Note if provided */}
              {transferData?.memo && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    <span className="font-semibold">Note:</span> {transferData.memo}
                  </p>
                </div>
              )}
              
              {/* Transfer Date if provided */}
              {transferData?.date && (
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">Scheduled Date:</span> {transferData.date}
                </div>
              )}
              
              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
                <div className="text-3xl font-bold text-gray-900">${amount.toFixed(2)}</div>
              </div>

              {/* From Account */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">From Account</label>
                <select
                  value={selectedFromAccount}
                  onChange={(e) => setSelectedFromAccount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {state.accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - ${account.balance.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {/* To Account/Goal */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {actionType === 'Save' ? 'To Savings Goal' : 'To Account'}
                </label>
                <select
                  value={selectedToAccount}
                  onChange={(e) => setSelectedToAccount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {actionType === 'Save' ? (
                    state.goals.map((goal) => (
                      <option key={goal.id} value={goal.id}>
                        {goal.name} - ${goal.currentAmount.toFixed(2)} of ${goal.targetAmount.toFixed(2)}
                      </option>
                    ))
                  ) : (
                    state.accounts.filter(a => a.id !== selectedFromAccount).map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} - ${account.balance.toFixed(2)}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Insufficient Funds Warning */}
              {!hasEnoughFunds && (
                <div className="flex items-center gap-2 p-4 bg-red-50 rounded-lg border border-red-200">
                  <AlertCircle className="size-5 text-red-600" />
                  <p className="text-sm text-red-700">
                    Insufficient funds in {fromAccount?.name}. Available: ${fromAccount?.balance.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Fee Information */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Transfer Amount</span>
                  <span className="font-semibold text-gray-900">${amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Fee</span>
                  <span className="font-semibold text-green-600">$0.00</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-gray-900">${amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={onBack}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExecuteAction}
                  disabled={!hasEnoughFunds}
                  className="flex-1 bg-[#005EB8] hover:bg-[#004d8c]"
                >
                  Confirm {actionType}
                </Button>
              </div>
            </div>

            {/* Impact Preview */}
            {hasEnoughFunds && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Impact Preview</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">New {fromAccount?.name} Balance</span>
                    <span className="font-semibold text-gray-900">
                      ${(fromAccount ? fromAccount.balance - amount : 0).toFixed(2)}
                    </span>
                  </div>
                  {actionType === 'Save' && (
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                      <span className="text-sm text-green-700">Goal Progress Increase</span>
                      <span className="font-semibold text-green-600">
                        +{((amount / (state.goals.find(g => g.id === selectedToAccount)?.targetAmount || amount)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
