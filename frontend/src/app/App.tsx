import { useState } from 'react';
import Main from '@/imports/Main';
import Component1512WDefault from '@/imports/1512WDefault';
import { FinancialProvider } from '@/app/contexts/FinancialContext';
import { AIAssistant } from '@/app/components/AIAssistant';

export default function App() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  return (
    <FinancialProvider>
      <div className="size-full relative bg-[#ECEFF1]">
        {/* Chase Bank UI */}
        <Component1512WDefault />
        
        {/* AI Assistant - appears when toggled */}
        <AIAssistant 
          isOpen={isAssistantOpen} 
          onToggle={() => setIsAssistantOpen(!isAssistantOpen)} 
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
    </FinancialProvider>
  );
}
