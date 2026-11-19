import React, { useMemo, useRef, useState, useEffect } from 'react';
import { ChevronDown, Search, ShieldAlert } from 'lucide-react';
import type { UnifiedAccountDto } from '../types/banking';
import { formatCurrency } from '../utils/format';

interface AccountPickerProps {
  label?: string;
  value: string;
  accounts: UnifiedAccountDto[];
  placeholder?: string;
  filterKind?: 'ALL' | 'CASA' | 'GL';
  required?: boolean;
  onChange: (accountNumber: string, selected?: UnifiedAccountDto) => void;
}

export const AccountPicker: React.FC<AccountPickerProps> = ({
  label,
  value,
  accounts,
  placeholder = 'Select or enter account number...',
  filterKind = 'ALL',
  required = false,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.accountNumber.toLowerCase() === value.trim().toLowerCase()),
    [accounts, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accounts
      .filter((a) => (filterKind === 'ALL' ? true : a.accountKind.toUpperCase() === filterKind))
      .filter((a) => {
        if (!q) return true;
        return (
          a.accountNumber.toLowerCase().includes(q) ||
          a.accountName.toLowerCase().includes(q) ||
          a.currency.toLowerCase().includes(q) ||
          a.branchCode.toLowerCase().includes(q)
        );
      })
      .slice(0, 60);
  }, [accounts, filterKind, query]);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="mb-1.5 block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
      )}
      <div className="flex items-center rounded-xl border border-slate-300 bg-white transition focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/10">
        <input
          type="text"
          value={value}
          required={required}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            setOpen(true);
            const exact = accounts.find((a) => a.accountNumber.toLowerCase() === val.trim().toLowerCase());
            onChange(val, exact);
          }}
          className="w-full rounded-l-xl bg-transparent px-3 py-2 font-mono text-sm text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center px-2.5 py-2 text-slate-400 hover:text-slate-700"
          aria-label="Toggle accounts list"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {selectedAccount && (
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] ring-1 ring-slate-200">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                selectedAccount.accountKind === 'CASA'
                  ? 'bg-sky-100 text-sky-700'
                  : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              {selectedAccount.accountKind}
            </span>
            <span className="truncate max-w-[200px]">{selectedAccount.accountName}</span>
          </div>
          <div className="flex items-center gap-2">
            {(selectedAccount.postNoDebit || selectedAccount.postNoCredit) && (
              <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
                <ShieldAlert className="h-3 w-3" />
                {selectedAccount.postNoDebit ? 'PND ' : ''}
                {selectedAccount.postNoCredit ? 'PNC' : ''}
              </span>
            )}
            <span className="font-semibold tabular-nums text-emerald-700">
              Avail: {formatCurrency(selectedAccount.availableBalance, selectedAccount.currency)}
            </span>
          </div>
        </div>
      )}

      {open && (
        <div className="absolute left-0 right-0 z-40 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by account no, name, currency..."
              className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-500">No matching accounts found.</div>
            ) : (
              filtered.map((acc) => (
                <button
                  key={`${acc.accountKind}-${acc.accountNumber}`}
                  type="button"
                  onClick={() => {
                    onChange(acc.accountNumber, acc);
                    setQuery('');
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-900">{acc.accountNumber}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          acc.accountKind === 'CASA' ? 'bg-sky-100 text-sky-700' : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {acc.accountKind}
                      </span>
                      {acc.postNoDebit && (
                        <span className="rounded bg-rose-100 px-1 text-[10px] font-semibold text-rose-700">PND</span>
                      )}
                      {acc.postNoCredit && (
                        <span className="rounded bg-rose-100 px-1 text-[10px] font-semibold text-rose-700">PNC</span>
                      )}
                    </div>
                    <p className="truncate text-xs text-slate-600">{acc.accountName}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-semibold tabular-nums text-slate-900">
                      {formatCurrency(acc.availableBalance, acc.currency)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {acc.currency} · {acc.branchCode}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
