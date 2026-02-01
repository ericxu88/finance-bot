import { useState } from 'react';
import Component1512WDefault from '@/imports/1512WDefault';
import { FinancialProvider, useFinancial, SortField } from '@/app/contexts/FinancialContext';
import { AIAssistant } from '@/app/components/AIAssistant';
import { InteractiveChaseWrapper } from '@/app/components/InteractiveChaseWrapper';
import { SpendingAnalysis } from '@/app/pages/SpendingAnalysis';
import { InvestmentAnalysis } from '@/app/pages/InvestmentAnalysis';
import { GoalsProgress } from '@/app/pages/GoalsProgress';
import { ActionPage } from '@/app/pages/ActionPage';

type Page = 'home' | 'spending' | 'investment' | 'goals' | 'action';

interface TransferFormData {
  fromAccount?: string;
  toAccount?: string;
  amount?: number;
  date?: string;
  memo?: string;
}

export default function App() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [currentAction, setCurrentAction] = useState<{
    action: string;
    description: string;
    amount: number;
    target?: string;
    transferData?: TransferFormData;
  } | null>(null);

  const handleNavigation = (page: Page) => {
    setCurrentPage(page);
  };

  const handleActionNavigation = (action: string, description: string, amount: number, target?: string, transferData?: TransferFormData) => {
    setCurrentAction({ action, description, amount, target, transferData });
    setCurrentPage('action');
  };

  const handleOpenAssistant = (initialMessage?: string) => {
    setIsAssistantOpen(true);
    // If initial message provided, we could set it in the AI Assistant
    // This would require updating AIAssistant to accept an initial message prop
  };

  const handleTransferSubmit = (transferData: TransferFormData) => {
    const amount = transferData.amount || 0;
    handleActionNavigation(
      'Transfer Money',
      `Transfer $${amount.toFixed(2)} from ${transferData.fromAccount || 'account'} to ${transferData.toAccount || 'account'}`,
      amount,
      transferData.toAccount,
      transferData
    );
  };

  return (
    <FinancialProvider>
      <AppContent
        currentPage={currentPage}
        currentAction={currentAction}
        isAssistantOpen={isAssistantOpen}
        setIsAssistantOpen={setIsAssistantOpen}
        handleNavigation={handleNavigation}
        handleActionNavigation={handleActionNavigation}
        handleOpenAssistant={handleOpenAssistant}
        handleTransferSubmit={handleTransferSubmit}
      />
    </FinancialProvider>
  );
}

function AppContent({
  currentPage,
  currentAction,
  isAssistantOpen,
  setIsAssistantOpen,
  handleNavigation,
  handleActionNavigation,
  handleOpenAssistant,
  handleTransferSubmit,
}: {
  currentPage: Page;
  currentAction: {
    action: string;
    description: string;
    amount: number;
    target?: string;
    transferData?: TransferFormData;
  } | null;
  isAssistantOpen: boolean;
  setIsAssistantOpen: (open: boolean) => void;
  handleNavigation: (page: Page) => void;
  handleActionNavigation: (action: string, description: string, amount: number, target?: string, transferData?: TransferFormData) => void;
  handleOpenAssistant: (initialMessage?: string) => void;
  handleTransferSubmit: (data: TransferFormData) => void;
}) {
  const { sortTransactions } = useFinancial();

  const handleSort = (field: SortField) => {
    sortTransactions(field);
  };

  return (
    <div className="size-full relative bg-[#ECEFF1]">
      {/* Main Content - switches between pages */}
      {currentPage === 'home' && (
        <InteractiveChaseWrapper 
          onNavigate={handleNavigation}
          onOpenAssistant={handleOpenAssistant}
          onTransferSubmit={handleTransferSubmit}
          onSort={handleSort}
        />
      )}
      {currentPage === 'spending' && <SpendingAnalysis onBack={() => handleNavigation('home')} />}
      {currentPage === 'investment' && <InvestmentAnalysis onBack={() => handleNavigation('home')} />}
      {currentPage === 'goals' && <GoalsProgress onBack={() => handleNavigation('home')} />}
      {currentPage === 'action' && currentAction && (
        <ActionPage 
          action={currentAction.action}
          description={currentAction.description}
          amount={currentAction.amount}
          target={currentAction.target}
          transferData={currentAction.transferData}
          onBack={() => handleNavigation('home')}
        />
      )}
      
      {/* AI Assistant - appears when toggled */}
      <AIAssistant 
        isOpen={isAssistantOpen} 
        onToggle={() => setIsAssistantOpen(!isAssistantOpen)}
        onNavigate={handleNavigation}
        onActionNavigate={handleActionNavigation}
      />
        
      {/* AI Assistant Toggle Button - floating button matching Chase design */}
      {!isAssistantOpen && (
        <button
          onClick={() => setIsAssistantOpen(true)}
          className="fixed bottom-6 right-6 bg-[#005EB8] hover:bg-[#004d8c] text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105 z-50"
          aria-label="Open AI Assistant"
        >
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="font-semibold text-sm">AI Assistant</span>
        </button>
      )}
    </div>
  );
}