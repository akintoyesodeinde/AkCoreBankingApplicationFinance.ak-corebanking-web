import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Landmark,
  Loader2,
  RefreshCw,
  Scale,
  ShieldAlert,
  TrendingUp,
  Wallet,
  XCircle,
} from 'lucide-react';
import { dashboardApi, fundTransfersApi } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmModal } from '../components/ConfirmModal';
import { extractApiError, formatCurrency, formatDateTime, formatNumber } from '../utils/format';
import type { DashboardSummaryDto, FundTransferDto } from '../types/banking';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [summary, setSummary] = useState<DashboardSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedJournalId, setExpandedJournalId] = useState<number | null>(null);

  const [actionTransfer, setActionTransfer] = useState<{
    transfer: FundTransferDto;
    type: 'approve' | 'reject';
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadDashboard = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const data = await dashboardApi.getSummary();
        setSummary(data);
      } catch (err) {
        toast.error('Failed to Load Dashboard', extractApiError(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    void loadDashboard(false);
  }, [loadDashboard]);

  const handleConfirmTransferAction = async (inputValue: string) => {
    if (!actionTransfer) return;
    setActionLoading(true);
    try {
      if (actionTransfer.type === 'approve') {
        await fundTransfersApi.approve(actionTransfer.transfer.id, { remarks: inputValue || 'Approved from Dashboard' });
        toast.success(
          'Transfer Approved',
          `Reference ${actionTransfer.transfer.reference} posted to General Ledger.`,
        );
      } else {
        await fundTransfersApi.reject(actionTransfer.transfer.id, { reason: inputValue });
        toast.warning('Transfer Rejected', `Reference ${actionTransfer.transfer.reference} has been rejected.`);
      }
      setActionTransfer(null);
      await loadDashboard(true);
    } catch (err) {
      toast.error(
        actionTransfer.type === 'approve' ? 'Approval Blocked' : 'Rejection Failed',
        extractApiError(err),
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex h-80 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
        <p className="mt-3 text-sm font-medium text-slate-600">Loading Ak Core Banking Ledger Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trial Balance Health Banner */}
      <div
        className={`flex flex-col justify-between gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center ${
          summary?.isTrialBalanceBalanced
            ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-teal-50/70'
            : 'border-rose-200 bg-gradient-to-r from-rose-50 via-white to-amber-50/60'
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              summary?.isTrialBalanceBalanced
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
            }`}
          >
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-base font-bold text-slate-900">General Ledger Trial Balance Status</h2>
              <StatusBadge
                status={summary?.isTrialBalanceBalanced ? 'Balanced' : 'Unbalanced'}
                size="md"
              />
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Total Debits Posted:{' '}
              <span className="font-semibold tabular-nums text-slate-900">
                {formatCurrency(summary?.totalDebitsPosted ?? 0)}
              </span>{' '}
              &nbsp;&middot;&nbsp; Total Credits Posted:{' '}
              <span className="font-semibold tabular-nums text-slate-900">
                {formatCurrency(summary?.totalCreditsPosted ?? 0)}
              </span>{' '}
              &nbsp;&middot;&nbsp; Today&apos;s Postings:{' '}
              <span className="font-semibold tabular-nums text-slate-900">
                {formatNumber(summary?.todayTransactionsCount ?? 0)}
              </span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <Link
            to="/journals"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Inspect Journals
          </Link>
          <button
            type="button"
            onClick={() => void loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Customer Deposits (CASA)
            </span>
            <div className="rounded-xl bg-sky-50 p-2 text-sky-600">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums text-slate-900">
            {formatCurrency(summary?.totalCustomerDeposits ?? 0)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{formatNumber(summary?.totalCasaAccounts ?? 0)} active CASA accounts</span>
            <Link to="/chart-of-accounts" className="font-semibold text-sky-600 hover:text-sky-700">
              View &rarr;
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total GL Assets
            </span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums text-slate-900">
            {formatCurrency(summary?.totalGlAssets ?? 0)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{formatNumber(summary?.totalGlAccounts ?? 0)} total GL accounts</span>
            <Link to="/chart-of-accounts" className="font-semibold text-emerald-600 hover:text-emerald-700">
              COA &rarr;
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total GL Liabilities
            </span>
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums text-slate-900">
            {formatCurrency(summary?.totalGlLiabilities ?? 0)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Ledger Obligations &amp; Payables</span>
            <Link to="/captions" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Captions &rarr;
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Maker-Checker Workload
            </span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <p className="text-2xl font-bold tabular-nums text-slate-900">
              {formatNumber(summary?.pendingApprovalsCount ?? 0)}
            </p>
            <span className="text-xs font-medium text-slate-500">Pending Transfers</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <Link to="/reversals" className="font-medium text-amber-700 hover:underline">
              {formatNumber(summary?.pendingReversalsCount ?? 0)} pending reversals
            </Link>
            <Link to="/fund-transfers?tab=queue" className="font-semibold text-slate-900 hover:underline">
              Queue &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Main Split Content: Pending Approvals + Recent Journals */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Pending Approvals Preview */}
        <section className="xl:col-span-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pending Approval Queue</h3>
              <p className="text-xs text-slate-500">Awaiting Supervisor / Admin authorization</p>
            </div>
            <Link
              to="/fund-transfers?tab=queue"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Open Full Queue
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {!summary?.pendingTransfers?.length ? (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <CheckCircle2 className="h-9 w-9 text-emerald-500" />
                <p className="mt-2 text-sm font-semibold text-slate-800">All Caught Up</p>
                <p className="mt-1 text-xs text-slate-500">No transfers currently awaiting checker approval.</p>
              </div>
            ) : (
              summary.pendingTransfers.map((tx) => {
                const isSelfCreated =
                  user?.username && tx.createdBy.toLowerCase() === user.username.toLowerCase();
                return (
                  <div key={tx.id} className="p-4 transition hover:bg-slate-50/70">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">{tx.reference}</span>
                          <StatusBadge status={tx.status} />
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                            {tx.operationType}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-700">
                          <span className="font-mono font-semibold">{tx.debitAccountNo}</span>{' '}
                          <span className="text-slate-400">({tx.debitAccountName})</span> &rarr;{' '}
                          <span className="font-mono font-semibold">{tx.creditAccountNo}</span>{' '}
                          <span className="text-slate-400">({tx.creditAccountName})</span>
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Maker: <span className="font-medium text-slate-700">{tx.createdBy}</span> ·{' '}
                          {formatDateTime(tx.createdAt)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold tabular-nums text-slate-900">
                          {formatCurrency(tx.amount, tx.currency)}
                        </p>
                        <div className="mt-2 flex items-center justify-end gap-1.5">
                          {isSelfCreated && (
                            <span
                              title="Segregation of Duties: Maker cannot approve own transaction"
                              className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700"
                            >
                              <ShieldAlert className="h-3 w-3" />
                              Own Entry
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setActionTransfer({ transfer: tx, type: 'approve' })}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-emerald-700"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => setActionTransfer({ transfer: tx, type: 'reject' })}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-100"
                          >
                            <XCircle className="h-3 w-3" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Recent Journals */}
        <section className="xl:col-span-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Posted Journals</h3>
              <p className="text-xs text-slate-500">Latest immutable double-entry ledger batches</p>
            </div>
            <Link
              to="/journals"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-800"
            >
              View All Journals
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {!summary?.recentJournals?.length ? (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <Activity className="h-9 w-9 text-slate-400" />
                <p className="mt-2 text-sm font-semibold text-slate-800">No Recent Journals</p>
                <p className="mt-1 text-xs text-slate-500">Posted entries will appear here once transfers are approved.</p>
              </div>
            ) : (
              summary.recentJournals.map((j) => {
                const isExpanded = expandedJournalId === j.id;
                return (
                  <div key={j.id} className="p-4">
                    <button
                      type="button"
                      onClick={() => setExpandedJournalId(isExpanded ? null : j.id)}
                      className="flex w-full items-start justify-between gap-3 text-left"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        {isExpanded ? (
                          <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        ) : (
                          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        )}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">{j.journalReference}</span>
                            <StatusBadge status={j.status} />
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                              {j.transactionType}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500">
                            Source: <span className="font-mono text-slate-700">{j.sourceReference}</span> · Checker:{' '}
                            <span className="font-medium text-slate-700">{j.approvedBy || '—'}</span>
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-bold tabular-nums text-slate-900">
                          {formatCurrency(j.totalDebit, j.currency)}
                        </p>
                        <p className="text-[10px] text-slate-400">{formatDateTime(j.postDate)}</p>
                      </div>
                    </button>

                    {isExpanded && j.lines?.length > 0 && (
                      <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50">
                        <table className="w-full text-left text-[11px]">
                          <thead className="border-b border-slate-200 bg-slate-100/80 text-slate-600">
                            <tr>
                              <th className="px-3 py-2 font-semibold">Account</th>
                              <th className="px-3 py-2 font-semibold">Kind</th>
                              <th className="px-3 py-2 text-right font-semibold">Debit</th>
                              <th className="px-3 py-2 text-right font-semibold">Credit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/70">
                            {j.lines.map((line) => (
                              <tr key={line.id}>
                                <td className="px-3 py-1.5">
                                  <span className="font-mono font-semibold text-slate-900">{line.accountNo}</span>
                                  <span className="ml-1.5 text-slate-500">{line.accountName}</span>
                                </td>
                                <td className="px-3 py-1.5">
                                  <StatusBadge status={line.accountKind} />
                                </td>
                                <td className="px-3 py-1.5 text-right font-mono tabular-nums text-slate-900">
                                  {line.debitAmount > 0 ? formatCurrency(line.debitAmount, j.currency) : '—'}
                                </td>
                                <td className="px-3 py-1.5 text-right font-mono tabular-nums text-slate-900">
                                  {line.creditAmount > 0 ? formatCurrency(line.creditAmount, j.currency) : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Confirmation Modal for Approve / Reject */}
      <ConfirmModal
        isOpen={Boolean(actionTransfer)}
        variant={actionTransfer?.type === 'approve' ? 'approve' : 'danger'}
        title={actionTransfer?.type === 'approve' ? 'Authorize Fund Transfer' : 'Reject Fund Transfer'}
        message={
          actionTransfer?.type === 'approve'
            ? 'Confirming this approval will atomically post balanced double-entry journal lines and update account balances.'
            : 'Provide a clear audit reason for rejecting this pending fund transfer.'
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
                  label: 'Debit -> Credit',
                  value: `${actionTransfer.transfer.debitAccountNo} -> ${actionTransfer.transfer.creditAccountNo}`,
                },
                { label: 'Initiated By (Maker)', value: actionTransfer.transfer.createdBy },
              ]
            : undefined
        }
        inputLabel={actionTransfer?.type === 'approve' ? 'Checker Remarks (Optional)' : 'Rejection Reason'}
        inputPlaceholder={
          actionTransfer?.type === 'approve'
            ? 'Optional approval note...'
            : 'Enter reason for rejection (e.g. Incorrect beneficiary account)...'
        }
        inputRequired={actionTransfer?.type === 'reject'}
        confirmLabel={actionTransfer?.type === 'approve' ? 'Approve & Post Journal' : 'Confirm Rejection'}
        isLoading={actionLoading}
        onConfirm={handleConfirmTransferAction}
        onCancel={() => setActionTransfer(null)}
      />
    </div>
  );
};
