import { useEffect } from 'react';
import { ChaseTransferForm } from '@/app/components/ChaseTransferForm';

interface TransferFormData {
  fromAccount?: string;
  toAccount?: string;
  amount?: number;
  date?: string;
  memo?: string;
}

import { SortField } from '@/app/contexts/FinancialContext';

interface InteractiveChaseWrapperProps {
  onNavigate?: (page: 'home' | 'spending' | 'investment' | 'goals') => void;
  onOpenAssistant?: (initialMessage?: string) => void;
  onTransferSubmit?: (data: TransferFormData) => void;
  onSort?: (field: SortField) => void;
}

// Helper function to find element by data-name
function findElementByDataName(dataName: string): HTMLElement | null {
  return document.querySelector(`[data-name="${dataName}"]`) as HTMLElement | null;
}

// Extract transfer form data
function extractTransferFormData(): TransferFormData | null {
  try {
    // Extract from account
    const fromAccountEl = findElementByDataName('button listbox#select-fundingAccountId');
    const fromAccount = fromAccountEl?.textContent?.trim() || '';

    // Extract to account
    const toAccountEl = findElementByDataName('button listbox#select-transferToAccountId');
    const toAccount = toAccountEl?.textContent?.trim() || '';

    // Extract amount
    const amountEl = document.querySelector('[data-name="input#transactionAmount-input"]') as HTMLElement;
    const amountText = amountEl?.textContent?.trim() || '';
    const amountMatch = amountText.match(/\$?([\d,]+\.?\d*)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : undefined;

    // Extract date
    const dateEl = document.querySelector('[data-name="button listbox#select-transferToAccountId"]') as HTMLElement;
    // Look for date in the date picker area
    const datePickerArea = document.querySelector('[data-name="mds-datepicker → mds-text-input"]');
    const dateText = datePickerArea?.textContent?.trim() || '';
    const date = dateText.match(/\d{2}\/\d{2}\/\d{4}/)?.[0];

    // Extract memo
    const memoEl = document.querySelector('[data-name="input#transactionMemo-input"]') as HTMLElement;
    const memo = memoEl?.textContent?.trim() || '';

    if (!fromAccount && !toAccount && !amount) {
      return null;
    }

    return {
      fromAccount,
      toAccount,
      amount,
      date,
      memo,
    };
  } catch (error) {
    console.error('Error extracting form data:', error);
    return null;
  }
}

export function InteractiveChaseWrapper({ onNavigate, onOpenAssistant, onTransferSubmit, onSort }: InteractiveChaseWrapperProps) {
  useEffect(() => {
    // Add click handlers to buttons after component mounts
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Find the closest element with data-name attribute
      const element = target.closest('[data-name]');
      if (!element) {
        // Check if it's a button or link without data-name
        const buttonOrLink = target.closest('button, a, [role="button"]');
        if (buttonOrLink) {
          const text = buttonOrLink.textContent?.trim().toLowerCase() || '';
          // Handle Cancel button
          if (text === 'cancel') {
            e.preventDefault();
            e.stopPropagation();
            onNavigate?.('home');
            return;
          }
          // Handle Next button
          if (text === 'next') {
            e.preventDefault();
            e.stopPropagation();
            const formData = extractTransferFormData();
            if (formData && onTransferSubmit) {
              onTransferSubmit(formData);
            }
            return;
          }
        }
        return;
      }
      
      const dataName = element.getAttribute('data-name');
      const textContent = element.textContent?.trim().toLowerCase() || '';
      
      // Handle top navigation buttons
      if (dataName === 'button#requestAccounts' || (textContent.includes('accounts') && dataName?.includes('requestAccounts'))) {
        e.preventDefault();
        e.stopPropagation();
        onNavigate?.('home');
      } else if (dataName === 'button#requestPaymentsAndTransfers' || (textContent.includes('pay') && textContent.includes('transfer'))) {
        e.preventDefault();
        e.stopPropagation();
        onNavigate?.('spending');
      } else if (dataName === 'button#requestPlanTrack' || (textContent.includes('plan') && textContent.includes('track'))) {
        e.preventDefault();
        e.stopPropagation();
        onNavigate?.('goals');
      } else if (dataName === 'button#requestChaseInvestmentsMenu' || textContent.includes('investment')) {
        e.preventDefault();
        e.stopPropagation();
        onNavigate?.('investment');
      } else if (dataName === 'button#requestBenefitsAndTravel' || (textContent.includes('benefit') || textContent.includes('travel'))) {
        e.preventDefault();
        e.stopPropagation();
        onOpenAssistant?.('Tell me about benefits and travel options');
      } else if (dataName === 'button#requestSecurityCenter' || (textContent.includes('security') || textContent.includes('privacy'))) {
        e.preventDefault();
        e.stopPropagation();
        onOpenAssistant?.('Tell me about security and privacy settings');
      } else if (dataName === 'button#requestExploreChaseProductsMenu' || textContent.includes('explore')) {
        e.preventDefault();
        e.stopPropagation();
        onOpenAssistant?.('What Chase products are available?');
      } else if (dataName === 'button#brand_bar_sign_in_out' || textContent.includes('sign in') || textContent.includes('sign out')) {
        e.preventDefault();
        e.stopPropagation();
        alert('Sign in/out functionality would be implemented here');
      } else if (dataName === 'div#brand_bar_search_button' || (dataName?.includes('search') && textContent.includes('search'))) {
        e.preventDefault();
        e.stopPropagation();
        onOpenAssistant?.();
      }
      
      // Handle transfer money links
      else if (dataName === 'a#transferFunds' || textContent.includes('schedule transfer')) {
        e.preventDefault();
        e.stopPropagation();
        // Navigate to action page with transfer
        if (onTransferSubmit) {
          onTransferSubmit({});
        }
      } else if (dataName === 'a#activityTransfer' || textContent.includes('transfer activity')) {
        e.preventDefault();
        e.stopPropagation();
        onNavigate?.('spending');
      } else if (dataName === 'a#manageExternalAccounts' || textContent.includes('manage external')) {
        e.preventDefault();
        e.stopPropagation();
        onOpenAssistant?.('Help me manage external accounts');
      }
      
      // Handle account links
      else if (dataName === 'mds-link' && (textContent.includes('link an external account') || textContent.includes('link external'))) {
        e.preventDefault();
        e.stopPropagation();
        onOpenAssistant?.('How do I link an external account?');
      }
      
      // Handle form buttons
      else if (dataName === 'mds-button') {
        const buttonText = element.textContent?.trim().toLowerCase() || '';
        if (buttonText === 'cancel') {
          e.preventDefault();
          e.stopPropagation();
          onNavigate?.('home');
        } else if (buttonText === 'next') {
          e.preventDefault();
          e.stopPropagation();
          const formData = extractTransferFormData();
          if (formData && onTransferSubmit) {
            onTransferSubmit(formData);
          }
        }
      }
      
      // Handle sort links
      else if (dataName === 'a#sortByTransactionDueDate' || dataName?.includes('sortByTransactionDueDate')) {
        e.preventDefault();
        e.stopPropagation();
        onSort?.('date');
      } else if (dataName === 'a#sortByTransactionStatus' || dataName?.includes('sortByTransactionStatus')) {
        e.preventDefault();
        e.stopPropagation();
        onSort?.('status');
      } else if (dataName === 'a#sortByTransferToAccountDisplayName' || dataName?.includes('sortByTransferToAccountDisplayName')) {
        e.preventDefault();
        e.stopPropagation();
        onSort?.('account');
      } else if (dataName === 'a#sortByTransactionAmount' || dataName?.includes('sortByTransactionAmount')) {
        e.preventDefault();
        e.stopPropagation();
        onSort?.('amount');
      }
      
      // Handle legal links
      else if (dataName === 'div#transferAgreementLink' || dataName === 'div#requestMoneyTransferLegalAgreementLink') {
        e.preventDefault();
        e.stopPropagation();
        alert('Transfers Agreement:\n\nBy proceeding with this transfer, you agree to the terms and conditions of the Transfers Agreement. This includes authorization for Chase to process the transfer according to your instructions.');
      }
      
      // Handle any other button element
      else if (element.tagName === 'BUTTON' || dataName?.includes('button')) {
        const buttonText = element.textContent?.trim().toLowerCase() || '';
        if (buttonText === 'cancel') {
          e.preventDefault();
          e.stopPropagation();
          onNavigate?.('home');
        } else if (buttonText === 'next') {
          e.preventDefault();
          e.stopPropagation();
          const formData = extractTransferFormData();
          if (formData && onTransferSubmit) {
            onTransferSubmit(formData);
          }
        }
      }
    };
    
    // Attach event listener
    document.addEventListener('click', handleClick, true); // Use capture phase to catch early
    
    // Add CSS to make buttons appear clickable
    const style = document.createElement('style');
    style.textContent = `
      [data-name*="button"]:hover,
      [data-name*="Button"]:hover,
      [data-name*="mds-button"]:hover {
        opacity: 0.8 !important;
        cursor: pointer !important;
      }
      
      [data-name^="button#"]:hover,
      [data-name^="a#"]:hover,
      [data-name*="mds-link"]:hover {
        background-color: rgba(255, 255, 255, 0.1) !important;
        cursor: pointer !important;
      }
      
      button:hover,
      [role="button"]:hover,
      [data-name*="link"]:hover {
        cursor: pointer !important;
      }
    `;
    document.head.appendChild(style);
    
    // Cleanup
    return () => {
      document.removeEventListener('click', handleClick, true);
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [onNavigate, onOpenAssistant, onTransferSubmit, onSort]);
  
  return (
    <ChaseTransferForm
      onTransferSubmit={onTransferSubmit}
      onCancel={() => onNavigate?.('home')}
    />
  );
}
