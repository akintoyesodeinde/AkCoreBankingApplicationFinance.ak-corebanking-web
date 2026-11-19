import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  ShieldAlert,
  Split,
  Trash2,
  XCircle,
} from 'lucide-react';
import { chartOfAccountsApi, financeSetupApi, fundTransfersApi } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AccountPicker } from '../components/AccountPicker';
import { ConfirmModal } from '../components/ConfirmModal';
import { StatusBadge } from '../components/StatusBadge';
import {
  extractApiError,
  formatCurrency,
  formatDateOnly,
  formatDateTime,
  generateIdempotencyKey,
  toIsoDateInput,
} from '../utils/format';
import type {
  CurrencyDto,
  FundTransferDto,
  MultipleCreditLineRequest,
  OperationTypeCode,
  UnifiedAccountDto,
} from '../types/banking';

type TabKey = 'single' | 'multiple' | 'queue';

const OPERATION_OPTIONS: { code: OperationTypeCode; label: string; hint: string }[] = [
  { code: 1, label: 'Customer to Customer (CASA -> CASA)', hint: 'Internal customer account transfer' },
  { code: 2, label: 'Customer to GL (CASA -> GL)', hint: 'Customer debit to bank General Ledger' },
  { code: 3, label: 'GL to Customer (GL -> CASA)', hint: 'Bank GL disbursement to customer CASA' },
  { code: 4, label: 'GL to GL (GL -> GL)', hint: 'Inter-ledger journal transfer' },
];

export const FundTransfersPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = (searchParams.get('tab') as TabKey) || 'single';
  const [activeTab, setActiveTab] = useState<TabKey>(
    ['single', 'multiple', 'queue'].includes(initialTab) ? initialTab : 'single',
  );

  const [accounts, setAccounts] = useState<UnifiedAccountDto[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyDto[]>([]);
  const [transfers, setTransfers] = useState<FundTransferDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loadingQueue, setLoadingQueue] = useState(false);

  // Single transfer form
  const [singleForm, setSingleForm] = useState({
    debitAccountNo: '',
    creditAccountNo: '',
    amount: '',
    currency: 'NGN',
    operationType: 1 as OperationTypeCode,
    narration: '',
    valueDate: toIsoDateInput(),
    chequeNo: '',
  });
  const [submittingSingle, setSubmittingSingle] = useState(false);

  // Multiple transfer form
  const [multiDebitAccountNo, setMultiDebitAccountNo] = useState('');
  const [multiDebitNarration, setMultiDebitNarration] = useState('');
  const [multiCurrency, setMultiCurrency] = useState('NGN');
  const [multiValueDate, setMultiValueDate] = useState(toIsoDateInput());
  const [creditLines, setCreditLines] = useState<
    { creditAccountNo: string; amount: string; narration: string; chequeNo: string }[]
  >([
    { creditAccountNo: '', amount: '', narration: '', chequeNo: '' },
    { creditAccountNo: '', amount: '', narration: '', chequeNo: '' },
  ]);
  const [submittingMulti, setSubmittingMulti] = useState(false);

  // Approval / Rejection confirmation modal
  const [actionTransfer, setActionTransfer] = useState<{
    transfer: FundTransferDto;
    type: 'approve' | 'reject';
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const switchTab = (tab: TabKey) => {
    setActiveTab(tab);
    setSearchParams(tab === 'single' ? {} : { tab });
  };

  const loadLookups = useCallback(async () => {
    try {
      const [accRes, curRes] = await Promise.all([
        chartOfAccountsApi.searchUnifiedAccounts({ kind: 'ALL' }),
        financeSetupApi.getCurrencies(),
      ]);
      setAccounts(accRes);
      setCurrencies(curRes);
    } catch (err) {
      toast.error('Failed to Load Accounts & Currencies', extractApiError(err));
    }
  }, [toast]);

  const loadQueue = useCallback(
    async (filter = statusFilter) => {
      setLoadingQueue(true);
      try {
        const res = await fundTransfersApi.list(filter);
        setTransfers(res);
      } catch (err) {
        toast.error('Failed to Load Transfers Queue', extractApiError(err));
      } finally {
        setLoadingQueue(false);
      }
    },
    [statusFilter, toast],
  );

  useEffect(() => {
    void loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    void loadQueue(statusFilter);
  }, [loadQueue, statusFilter]);

  const inferOperationType = (debitNo: string, creditNo: string): OperationTypeCode => {
    const dr = accounts.find((a) => a.accountNumber.toLowerCase() === debitNo.trim().toLowerCase());
    const cr = accounts.find((a) => a.accountNumber.toLowerCase() === creditNo.trim().toLowerCase());
    if (!dr || !cr) return singleForm.operationType;
    const drCasa = dr.accountKind.toUpperCase() === 'CASA';
    const crCasa = cr.accountKind.toUpperCase() === 'CASA';
    if (drCasa && crCasa) return 1;
    if (drCasa && !crCasa) return 2;
    if (!drCasa && crCasa) return 3;
    return 4;
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(singleForm.amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.warning('Invalid Amount', 'Transfer amount must be greater than zero.');
      return;
    }
    if (singleForm.debitAccountNo.trim() === singleForm.creditAccountNo.trim()) {
      toast.warning('Invalid Accounts', 'Debit and Credit accounts cannot be identical.');
      return;
    }
    setSubmittingSingle(true);
    try {
      const idempotencyKey = generateIdempotencyKey();
      const result = await fundTransfersApi.createSingle(
        {
          debitAccountNo: singleForm.debitAccountNo.trim(),
          creditAccountNo: singleForm.creditAccountNo.trim(),
          amount: numericAmount,
          currency: singleForm.currency,
          operationType: singleForm.operationType,
          narration: singleForm.narration.trim(),
          valueDate: singleForm.valueDate ? new Date(singleForm.valueDate).toISOString() : null,
          chequeNo: singleForm.chequeNo.trim() || null,
        },
        idempotencyKey,
      );
      toast.success(
        'Transfer Submitted for Approval',
        `Reference ${result.reference} queued for Checker authorization.`,
      );
      setSingleForm((prev) => ({
        ...prev,
        amount: '',
        narration: '',
        chequeNo: '',
      }));
      await loadQueue(statusFilter);
      switchTab('queue');
    } catch (err) {
      toast.error('Transfer Submission Failed', extractApiError(err));
    } finally {
      setSubmittingSingle(false);
    }
  };

  const multiTotalAmount = useMemo(
    () => creditLines.reduce((acc, line) => acc + (Number(line.amount) > 0 ? Number(line.amount) : 0), 0),
    [creditLines],
  );

  const selectedMultiDebit = useMemo(
    () => accounts.find((a) => a.accountNumber.toLowerCase() === multiDebitAccountNo.trim().toLowerCase()),
    [accounts, multiDebitAccountNo],
  );

  const handleMultiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validLines: MultipleCreditLineRequest[] = creditLines
      .filter((l) => l.creditAccountNo.trim() && Number(l.amount) > 0)
      .map((l) => ({
        creditAccountNo: l.creditAccountNo.trim(),
        amount: Number(l.amount),
        narration: l.narration.trim() || multiDebitNarration.trim(),
        chequeNo: l.chequeNo.trim() || null,
      }));

    if (!multiDebitAccountNo.trim() || validLines.length === 0) {
      toast.warning('Incomplete Split Transfer', 'Provide a debit account and at least one valid credit line.');
      return;
    }

    setSubmittingMulti(true);
    try {
      const idempotencyKey = generateIdempotencyKey();
      await fundTransfersApi.createMultiple(
        {
          debitAccountNo: multiDebitAccountNo.trim(),
          debitNarration: multiDebitNarration.trim(),
          valueDate: multiValueDate ? new Date(multiValueDate).toISOString() : null,
          currency: multiCurrency,
          creditLines: validLines,
        },
        idempotencyKey,
      );
      toast.success(
        'Split-Credit Batch Submitted',
        `${validLines.length} credit lines totaling ${formatCurrency(multiTotalAmount, multiCurrency)} queued for approval.`,
      );
      setMultiDebitNarration('');
      setCreditLines([{ creditAccountNo: '', amount: '', narration: '', chequeNo: '' }]);
      await loadQueue(statusFilter);
      switchTab('queue');
    } catch (err) {
      toast.error('Multiple Transfer Failed', extractApiError(err));
    } finally {
      setSubmittingMulti(false);
    }
  };

  const handleConfirmApprovalAction = async (inputValue: string) => {
    if (!actionTransfer) return;
    setActionLoading(true);
    try {
      if (actionTransfer.type === 'approve') {
        await fundTransfersApi.approve(actionTransfer.transfer.id, { remarks: inputValue || 'Approved' });
        toast.success(
          'Transfer Approved & Posted',
          `Reference ${actionTransfer.transfer.reference} settled cleanly.`,
        );
      } else {
        await fundTransfersApi.reject(actionTransfer.transfer.id, { reason: inputValue });
        toast.warning('Transfer Rejected', `Reference ${actionTransfer.transfer.reference} marked Rejected.`);
      }
      setActionTransfer(null);
      await Promise.all([loadQueue(statusFilter), loadLookups()]);
    } catch (err) {
      toast.error(
        actionTransfer.type === 'approve' ? 'Approval Blocked (Policy / SoD)' : 'Rejection Failed',
        extractApiError(err),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = useMemo(
    () => transfers.filter((t) => t.status === 'PendingApproval').length,
    [transfers],
  );

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => switchTab('single')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'single' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            Single Transfer
          </button>
          <button
            type="button"
            onClick={() => switchTab('multiple')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'multiple' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Split className="h-3.5 w-3.5" />
            Multiple Split-Credit
          </button>
          <button
            type="button"
            onClick={() => switchTab('queue')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'queue' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approval Queue &amp; History
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        <div className="text-xs text-slate-500">
          Maker: <span className="font-semibold text-slate-800">{user?.username}</span> ({user?.role})
        </div>
      </div>

      {/* Tab 1: Single Transfer */}
      {activeTab === 'single' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <form
            onSubmit={handleSingleSubmit}
            className="xl:col-span-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
          >
            <div>
              <h2 className="text-base font-bold text-slate-900">Single Fund Transfer</h2>
              <p className="text-xs text-slate-500">
                Submits an idempotent transfer instruction into the Maker-Checker approval workflow.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <AccountPicker
                label="Debit Account (Source)"
                required
                value={singleForm.debitAccountNo}
                accounts={accounts}
                onChange={(accNo, selected) => {
                  const nextOp = inferOperationType(accNo, singleForm.creditAccountNo);
                  setSingleForm((prev) => ({
                    ...prev,
                    debitAccountNo: accNo,
                    currency: selected?.currency || prev.currency,
                    operationType: nextOp,
                  }));
                }}
              />
              <AccountPicker
                label="Credit Account (Destination)"
                required
                value={singleForm.creditAccountNo}
                accounts={accounts}
                onChange={(accNo) => {
                  const nextOp = inferOperationType(singleForm.debitAccountNo, accNo);
                  setSingleForm((prev) => ({
                    ...prev,
                    creditAccountNo: accNo,
                    operationType: nextOp,
                  }));
                }}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Amount <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={singleForm.amount}
                  onChange={(e) => setSingleForm({ ...singleForm, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm font-semibold focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Currency</label>
                <select
                  value={singleForm.currency}
                  onChange={(e) => setSingleForm({ ...singleForm, currency: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                >
                  {currencies.length === 0 ? (
                    <option value="NGN">NGN</option>
                  ) : (
                    currencies.map((c) => (
                      <option key={c.id} value={c.currCode}>
                        {c.currCode} ({c.currSymbol})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Value Date</label>
                <input
                  type="date"
                  value={singleForm.valueDate}
                  onChange={(e) => setSingleForm({ ...singleForm, valueDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Operation Type</label>
                <select
                  value={singleForm.operationType}
                  onChange={(e) =>
                    setSingleForm({ ...singleForm, operationType: Number(e.target.value) as OperationTypeCode })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                >
                  {OPERATION_OPTIONS.map((op) => (
                    <option key={op.code} value={op.code}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Cheque / Instrument No (Optional)
                </label>
                <input
                  type="text"
                  value={singleForm.chequeNo}
                  onChange={(e) => setSingleForm({ ...singleForm, chequeNo: e.target.value })}
                  placeholder="Optional instrument ref"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Transaction Narration <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={singleForm.narration}
                onChange={(e) => setSingleForm({ ...singleForm, narration: e.target.value })}
                placeholder="e.g. Settlement for Vendor Invoice #AK-2026-091"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                type="submit"
                disabled={submittingSingle}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
              >
                {submittingSingle ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit Transfer for Approval
              </button>
            </div>
          </form>

          {/* Posting Preview Card */}
          <aside className="xl:col-span-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900">Double-Entry Preview</h3>
              <p className="mt-1 text-xs text-slate-500">
                Upon Checker approval, the following balanced entries will post:
              </p>

              <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-rose-700">DR (Debit)</span>
                  <span className="font-mono font-bold text-slate-900">
                    {singleForm.debitAccountNo || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-center text-slate-400">
                  <ArrowRight className="h-4 w-4 rotate-90" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-700">CR (Credit)</span>
                  <span className="font-mono font-bold text-slate-900">
                    {singleForm.creditAccountNo || '—'}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                  <span className="text-slate-500">Settlement Value</span>
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {formatCurrency(Number(singleForm.amount) || 0, singleForm.currency)}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-[11px] text-sky-900">
                <strong>Idempotency &amp; SoD Enforced:</strong> Every submission carries a unique UUID{' '}
                <code>Idempotency-Key</code> header and must be approved by a separate Checker operator.
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Tab 2: Multiple Split-Credit Transfer */}
      {activeTab === 'multiple' && (
        <form onSubmit={handleMultiSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">Multiple Split-Credit Transfer (1 Debit &rarr; N Credits)</h2>
              <p className="text-xs text-slate-500">
                Disburse funds from a single funding account across multiple beneficiary CASA or GL accounts.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-right">
              <p className="text-[10px] font-semibold uppercase text-slate-500">Total Batch Debit</p>
              <p className="font-mono text-base font-bold tabular-nums text-slate-900">
                {formatCurrency(multiTotalAmount, multiCurrency)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <AccountPicker
                label="Funding Debit Account"
                required
                value={multiDebitAccountNo}
                accounts={accounts}
                onChange={(accNo, selected) => {
                  setMultiDebitAccountNo(accNo);
                  if (selected?.currency) setMultiCurrency(selected.currency);
                }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Currency</label>
              <select
                value={multiCurrency}
                onChange={(e) => setMultiCurrency(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {currencies.length === 0 ? (
                  <option value="NGN">NGN</option>
                ) : (
                  currencies.map((c) => (
                    <option key={c.id} value={c.currCode}>
                      {c.currCode}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Value Date</label>
              <input
                type="date"
                value={multiValueDate}
                onChange={(e) => setMultiValueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Master Debit Narration *</label>
            <input
              type="text"
              required
              value={multiDebitNarration}
              onChange={(e) => setMultiDebitNarration(e.target.value)}
              placeholder="e.g. Monthly Contractor & Stipend Disbursement"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            />
          </div>

          {selectedMultiDebit && multiTotalAmount > selectedMultiDebit.availableBalance + selectedMultiDebit.overdraftLimit && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800">
              Warning: Total split amount ({formatCurrency(multiTotalAmount, multiCurrency)}) exceeds available balance +
              overdraft ({formatCurrency(selectedMultiDebit.availableBalance + selectedMultiDebit.overdraftLimit, multiCurrency)}).
            </div>
          )}

          {/* Credit Lines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Credit Beneficiary Lines ({creditLines.length})
              </h3>
              <button
                type="button"
                onClick={() =>
                  setCreditLines((prev) => [...prev, { creditAccountNo: '', amount: '', narration: '', chequeNo: '' }])
                }
                className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Credit Line
              </button>
            </div>

            <div className="space-y-3">
              {creditLines.map((line, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 md:grid-cols-12 md:items-start"
                >
                  <div className="md:col-span-4">
                    <AccountPicker
                      label={`Credit Account #${idx + 1}`}
                      required
                      value={line.creditAccountNo}
                      accounts={accounts}
                      onChange={(accNo) => {
                        setCreditLines((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, creditAccountNo: accNo } : item)),
                        );
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Amount *</label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={line.amount}
                      onChange={(e) =>
                        setCreditLines((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, amount: e.target.value } : item)),
                        )
                      }
                      placeholder="0.00"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-sm"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Line Narration</label>
                    <input
                      type="text"
                      value={line.narration}
                      onChange={(e) =>
                        setCreditLines((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, narration: e.target.value } : item)),
                        )
                      }
                      placeholder="Beneficiary memo"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Cheque No</label>
                    <input
                      type="text"
                      value={line.chequeNo}
                      onChange={(e) =>
                        setCreditLines((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, chequeNo: e.target.value } : item)),
                        )
                      }
                      placeholder="Optional"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-sm"
                    />
                  </div>
                  <div className="flex justify-end md:col-span-1 md:pt-7">
                    <button
                      type="button"
                      disabled={creditLines.length <= 1}
                      onClick={() => setCreditLines((prev) => prev.filter((_, i) => i !== idx))}
                      className="rounded-lg border border-rose-200 bg-white p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                      title="Remove credit line"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-200 pt-4">
            <button
              type="submit"
              disabled={submittingMulti}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {submittingMulti ? <Loader2 className="h-4 w-4 animate-spin" /> : <Split className="h-4 w-4" />}
              Submit Split-Credit Transfer
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Approval Queue & History */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap gap-1.5">
              {['ALL', 'PendingApproval', 'Approved', 'Rejected', 'Reversed'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {st === 'ALL' ? 'All Transfers' : st.replace(/([a-z])([A-Z])/g, '$1 $2')}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void loadQueue(statusFilter)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingQueue ? 'animate-spin' : ''}`} />
              Refresh Queue
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            {loadingQueue ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Reference / Type</th>
                      <th className="px-4 py-3 font-semibold">Debit Account</th>
                      <th className="px-4 py-3 font-semibold">Credit Account</th>
                      <th className="px-4 py-3 text-right font-semibold">Amount</th>
                      <th className="px-4 py-3 font-semibold">Narration &amp; Dates</th>
                      <th className="px-4 py-3 font-semibold">Maker / Checker</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Authorization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transfers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                          No fund transfers found for the selected filter.
                        </td>
                      </tr>
                    ) : (
                      transfers.map((tx) => {
                        const isPending = tx.status === 'PendingApproval';
                        const isSelf = user?.username && tx.createdBy.toLowerCase() === user.username.toLowerCase();
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3">
                              <div className="font-mono font-bold text-slate-900">{tx.reference}</div>
                              {tx.batchReference && (
                                <div className="font-mono text-[10px] text-indigo-600">Batch: {tx.batchReference}</div>
                              )}
                              <div className="mt-1 flex items-center gap-1">
                                <StatusBadge status={tx.transferType} />
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-mono font-semibold text-slate-900">{tx.debitAccountNo}</div>
                              <div className="max-w-[160px] truncate text-[11px] text-slate-500">
                                {tx.debitAccountName}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-mono font-semibold text-slate-900">{tx.creditAccountNo}</div>
                              <div className="max-w-[160px] truncate text-[11px] text-slate-500">
                                {tx.creditAccountName}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-slate-900">
                              {formatCurrency(tx.amount, tx.currency)}
                            </td>
                            <td className="px-4 py-3 max-w-[220px]">
                              <p className="truncate font-medium text-slate-800" title={tx.narration}>
                                {tx.narration}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Val: {formatDateOnly(tx.valueDate)} · {tx.operationType}
                              </p>
                              {tx.journalReference && (
                                <p className="font-mono text-[10px] font-semibold text-emerald-700">
                                  JRN: {tx.journalReference}
                                </p>
                              )}
                              {tx.rejectionReason && (
                                <p className="text-[10px] font-medium text-rose-600">Reason: {tx.rejectionReason}</p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-[11px]">
                              <div>
                                <span className="text-slate-400">Maker:</span>{' '}
                                <span className="font-semibold text-slate-800">{tx.createdBy}</span>
                              </div>
                              <div className="text-slate-400">{formatDateTime(tx.createdAt)}</div>
                              {tx.approvedBy && (
                                <div className="mt-0.5 text-emerald-700">Checker: {tx.approvedBy}</div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={tx.status} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              {isPending ? (
                                <div className="flex flex-col items-end gap-1.5">
                                  {isSelf && (
                                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                                      <ShieldAlert className="h-3 w-3" /> SoD: Own Entry
                                    </span>
                                  )}
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setActionTransfer({ transfer: tx, type: 'approve' })}
                                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setActionTransfer({ transfer: tx, type: 'reject' })}
                                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                                    >
                                      <XCircle className="h-3.5 w-3.5" />
                                      Reject
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400">Processed</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(actionTransfer)}
        variant={actionTransfer?.type === 'approve' ? 'approve' : 'danger'}
        title={actionTransfer?.type === 'approve' ? 'Confirm Transfer Approval' : 'Confirm Transfer Rejection'}
        message={
          actionTransfer?.type === 'approve'
            ? 'Approving this instruction posts a balanced double-entry journal and settles account balances atomically.'
            : 'Rejecting this transfer cancels pending settlement and records the rejection reason in the audit trail.'
        }
        details={
          actionTransfer
            ? [
                { label: 'Reference', value: actionTransfer.transfer.reference },
                {
                  label: 'Amount',
                  value: formatCurrency(actionTransfer.transfer.amount, actionTransfer.transfer.currency),
                },
                {
                  label: 'Route',
                  value: `${actionTransfer.transfer.debitAccountNo} -> ${actionTransfer.transfer.creditAccountNo}`,
                },
                { label: 'Maker', value: actionTransfer.transfer.createdBy },
              ]
            : undefined
        }
        inputLabel={actionTransfer?.type === 'approve' ? 'Approval Remarks (Optional)' : 'Rejection Reason'}
        inputPlaceholder={
          actionTransfer?.type === 'approve'
            ? 'Optional supervisor remarks...'
            : 'State reason for rejecting this transfer...'
        }
        inputRequired={actionTransfer?.type === 'reject'}
        confirmLabel={actionTransfer?.type === 'approve' ? 'Approve & Settle' : 'Reject Transfer'}
        isLoading={actionLoading}
        onConfirm={handleConfirmApprovalAction}
        onCancel={() => setActionTransfer(null)}
      />
    </div>
  );
};
