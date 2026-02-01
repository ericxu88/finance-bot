import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import Component1512WDefault from '@/imports/1512WDefault';
import { useFinancial } from '@/app/contexts/FinancialContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Calendar } from '@/app/components/ui/calendar';
import { Button } from '@/app/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

interface TransferFormData {
  fromAccount?: string;
  toAccount?: string;
  amount?: number;
  date?: string;
  memo?: string;
}

interface ChaseTransferFormProps {
  onTransferSubmit?: (data: TransferFormData) => void;
  onCancel?: () => void;
}

// Helper to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Helper to format account display name
function formatAccountDisplay(account: { name: string; balance: number }): string {
  // Extract last 4 digits from account name if it contains numbers, otherwise use default
  const match = account.name.match(/(\d{4})/);
  const last4 = match ? match[1] : '6293';
  return `${account.name.toUpperCase()} (...${last4}): ${formatCurrency(account.balance)}`;
}

export function ChaseTransferForm({ onTransferSubmit, onCancel }: ChaseTransferFormProps) {
  const { state } = useFinancial();
  const [fromAccountId, setFromAccountId] = useState<string>(state.accounts[0]?.id || 'checking');
  const [toAccountId, setToAccountId] = useState<string>(
    state.accounts.find(a => a.id !== fromAccountId && a.type === 'savings')?.id || 
    state.accounts.find(a => a.id !== fromAccountId)?.id || 
    'savings'
  );
  const [amount, setAmount] = useState<string>('200.00');
  const [date, setDate] = useState<Date>(new Date());
  const [memo, setMemo] = useState<string>('');

  const fromAccount = state.accounts.find(a => a.id === fromAccountId) || state.accounts[0];
  const toAccount = state.accounts.find(a => a.id === toAccountId) || state.accounts[1] || state.accounts[0];

  const containerRef = useRef<HTMLDivElement>(null);
  
  // State for element positions (relative to container)
  const [elementPositions, setElementPositions] = useState<{
    fromAccount?: { left: number; top: number; width: number; height: number };
    toAccount?: { left: number; top: number; width: number; height: number };
    amount?: { left: number; top: number; width: number; height: number };
    date?: { left: number; top: number; width: number; height: number };
    memo?: { left: number; top: number; width: number; height: number };
  }>({});

  // Find and position overlays after component mounts
  useEffect(() => {
    const findAndPositionOverlays = () => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      
      // Find the static elements by data-name
      const fromAccountEl = containerRef.current.querySelector('[data-name="button listbox#select-fundingAccountId"]') as HTMLElement;
      const toAccountEl = containerRef.current.querySelector('[data-name="button listbox#select-transferToAccountId"]') as HTMLElement;
      const amountEl = containerRef.current.querySelector('[data-name="input#transactionAmount-input"]') as HTMLElement;
      // Date picker is nested - find the container first, then the inner button
      // The date picker container has a unique data-name
      const dateContainer = containerRef.current.querySelector('[data-name="mds-datepicker → mds-text-input"]') as HTMLElement;
      // Find the button inside the date picker container (not the to-account dropdown)
      const dateEl = dateContainer?.querySelector('div[data-name="div.mds-select__background-container"] > div[data-name="button listbox#select-transferToAccountId"]') as HTMLElement || dateContainer;
      const memoEl = containerRef.current.querySelector('[data-name="input#transactionMemo-input"]') as HTMLElement;

      const positions: typeof elementPositions = {};
      
      if (fromAccountEl) {
        const rect = fromAccountEl.getBoundingClientRect();
        positions.fromAccount = {
          left: rect.left - containerRect.left,
          top: rect.top - containerRect.top,
          width: rect.width,
          height: rect.height,
        };
      }
      if (toAccountEl) {
        const rect = toAccountEl.getBoundingClientRect();
        positions.toAccount = {
          left: rect.left - containerRect.left,
          top: rect.top - containerRect.top,
          width: rect.width,
          height: rect.height,
        };
      }
      if (amountEl) {
        const rect = amountEl.getBoundingClientRect();
        positions.amount = {
          left: rect.left - containerRect.left,
          top: rect.top - containerRect.top,
          width: rect.width,
          height: rect.height,
        };
      }
      if (dateEl) {
        const rect = dateEl.getBoundingClientRect();
        positions.date = {
          left: rect.left - containerRect.left,
          top: rect.top - containerRect.top,
          width: rect.width,
          height: rect.height,
        };
      }
      if (memoEl) {
        const rect = memoEl.getBoundingClientRect();
        positions.memo = {
          left: rect.left - containerRect.left,
          top: rect.top - containerRect.top,
          width: rect.width,
          height: rect.height,
        };
      }

      if (Object.keys(positions).length > 0) {
        setElementPositions(positions);
      }
    };

    // Wait for Component1512WDefault to render, then find elements
    const timer = setTimeout(findAndPositionOverlays, 300);
    // Also try on window resize
    window.addEventListener('resize', findAndPositionOverlays);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', findAndPositionOverlays);
    };
  }, [state.accounts]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove $ and any non-numeric characters except decimal point
    let value = e.target.value.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].slice(0, 2);
    }
    setAmount(value);
  };

  const handleMemoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.slice(0, 32); // Max 32 characters
    setMemo(value);
  };

  const handleSubmit = () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!fromAccount || !toAccount) {
      alert('Please select both accounts');
      return;
    }

    if (fromAccount.balance < amountNum) {
      alert(`Insufficient funds. Available: ${formatCurrency(fromAccount.balance)}`);
      return;
    }

    onTransferSubmit?.({
      fromAccount: fromAccount.name,
      toAccount: toAccount.name,
      amount: amountNum,
      date: format(date, 'MM/dd/yyyy'),
      memo,
    });
  };

  const handleCancel = () => {
    onCancel?.();
  };

  return (
    <div className="relative" ref={containerRef}>
      <Component1512WDefault
        fromAccountName={fromAccount?.name || 'TOTAL CHECKING'}
        fromAccountBalance={fromAccount?.balance || 0}
        toAccountName={toAccount?.name || 'TOTAL SAVINGS'}
        toAccountBalance={toAccount?.balance || 0}
        amount={parseFloat(amount) || 0}
        date={format(date, 'MM/dd/yyyy')}
        memo={memo || ''}
      />

      {/* Overlay functional components */}
      <div className="absolute inset-0 pointer-events-none">
        {/* From Account Dropdown Overlay */}
        {elementPositions.fromAccount && (
          <div
            className="absolute pointer-events-auto z-10"
            style={{
              left: `${elementPositions.fromAccount.left}px`,
              top: `${elementPositions.fromAccount.top}px`,
              width: `${elementPositions.fromAccount.width}px`,
              height: `${elementPositions.fromAccount.height}px`,
            }}
          >
            <Select value={fromAccountId} onValueChange={setFromAccountId}>
              <SelectTrigger className="h-full w-full opacity-0 border-none bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {state.accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {formatAccountDisplay(account)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* To Account Dropdown Overlay */}
        {elementPositions.toAccount && (
          <div
            className="absolute pointer-events-auto z-10"
            style={{
              left: `${elementPositions.toAccount.left}px`,
              top: `${elementPositions.toAccount.top}px`,
              width: `${elementPositions.toAccount.width}px`,
              height: `${elementPositions.toAccount.height}px`,
            }}
          >
            <Select value={toAccountId} onValueChange={setToAccountId}>
              <SelectTrigger className="h-full w-full opacity-0 border-none bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {state.accounts
                  .filter(a => a.id !== fromAccountId)
                  .map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {formatAccountDisplay(account)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Amount Input Overlay */}
        {elementPositions.amount && (
          <div
            className="absolute pointer-events-auto z-10"
            style={{
              left: `${elementPositions.amount.left}px`,
              top: `${elementPositions.amount.top}px`,
              width: `${elementPositions.amount.width}px`,
              height: `${elementPositions.amount.height}px`,
            }}
          >
            <Input
              type="text"
              value={amount ? `$${amount}` : '$'}
              onChange={handleAmountChange}
              className="h-full w-full border-none shadow-none bg-transparent text-[16px] font-normal text-[#0f171f] px-4 py-2"
              placeholder="$0.00"
            />
          </div>
        )}

        {/* Date Picker Overlay */}
        {elementPositions.date && (
          <>
            <div
              className="absolute pointer-events-auto z-10"
              style={{
                left: `${elementPositions.date.left}px`,
                top: `${elementPositions.date.top}px`,
                width: `${elementPositions.date.width}px`,
                height: `${elementPositions.date.height}px`,
              }}
            >
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-full w-full border-none shadow-none bg-transparent text-[16px] font-normal text-[#0f171f] justify-start p-0 hover:bg-transparent"
                  >
                    {format(date, 'MM/dd/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {/* Calendar Button Overlay */}
            <div
              className="absolute pointer-events-auto z-10"
              style={{
                left: `${elementPositions.date.left + elementPositions.date.width - 39}px`,
                top: `${elementPositions.date.top + 3}px`,
              }}
            >
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-[34px] w-[36px] bg-[#d6d9db] hover:bg-[#c0c4c7] p-0"
                  >
                    <CalendarIcon className="h-5 w-5 text-[#85888A]" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}

        {/* Memo Input Overlay */}
        {elementPositions.memo && (
          <div
            className="absolute pointer-events-auto z-10"
            style={{
              left: `${elementPositions.memo.left}px`,
              top: `${elementPositions.memo.top}px`,
              width: `${elementPositions.memo.width}px`,
              height: `${elementPositions.memo.height}px`,
            }}
          >
            <Textarea
              value={memo}
              onChange={handleMemoChange}
              maxLength={32}
              className="h-full w-full border-none shadow-none bg-transparent text-[16px] font-normal text-[#0f171f] resize-none px-4 py-2"
              placeholder=""
            />
          </div>
        )}

        {/* Cancel and Next Buttons - positioned at bottom right */}
        <div className="absolute bottom-[24px] right-[36px] flex gap-3 pointer-events-auto z-50">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#005EB8] hover:bg-[#004d8c] text-white"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
