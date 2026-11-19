import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { fundTransfersApi, reversalsApi } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/ConfirmModal';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { extractApiError, formatCurrency, formatDateTime } from '../utils/format';
import type { FundTransferDto, ReversalDto } from '../types/banking';

export const ReversalsPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [reversals, setReversals] = useState<ReversalDto[]>([]);
  const [approvedTransfers, setApprovedTransfers] = useState<FundTransferDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Initiate Modal
  const [initiateOpen, setInitiateOpen] = useState(false);
  const [selectedTransferId, setSelectedTransferId] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Approve Confirm Modal
  const [approveTarget, setApproveTarget] = useState<ReversalDto | null>(null);
  const [approving, setApproving] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [revRes, txRes] = await Promise.all([
        reversalsApi.list(),
        fundTransfersApi.list('Approved'),
      ]);
      setReversals(revRes);
      setApprovedTransfers(txRes);
    } catch (err) {
      toast.error('Failed to Load Reversals', extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const openInitiate = () => {
    setSelectedTransferId(approvedTransfers[0]?.id ?? 0);
    setReason('');
    setInitiateOpen(true);
  };

  const handleInitiateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransferId || selectedTransferId <= 0) {
      toast.warning('Select Original Transfer', 'Please pick an approved transfer to reverse.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await reversalsApi.initiate({
        originalTransferId: selectedTransferId,
        reason: reason.trim(),
      });
      toast.success(
        'Reversal Request Initiated',
        `Reversal ${created.reversalReference} queued for Checker authorization.`,
      );
      setInitiateOpen(false);
      await loadAll();
    } catch (err) {
      toast.error('Reversal Initiation Failed', extractApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmApprove = async () => {
    if (!approveTarget) return;
    setApproving(true);
    try {
      const updated = await reversalsApi.approve(approveTarget.id);
      toast.success(
        'Contra-Entry Reversal Posted',
        `Reversal ${updated.reversalReference} posted (${updated.contraJournalReference || 'Contra Journal'}).`,
      );
      setApproveTarget(null);
      await loadAll();
    } catch (err) {
      toast.error('Reversal Approval Blocked', extractApiError(err));
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900">Transaction Reversal Queue</h2>
          <p className="text-xs text-slate-500">
            Reversals generate immutable contra-entry journals while preserving original posting audit history.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadAll()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={openInitiate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Initiate Reversal
          </button>
        </div>
      </div>

      {/* Reversals Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Reversal Reference</th>
                  <th className="px-4 py-3 font-semibold">Original Transfer</th>
                  <th className="px-4 py-3 font-semibold">Accounts (Original Dr / Cr)</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Reason &amp; Contra Journal</th>
                  <th className="px-4 py-3 font-semibold">Maker / Checker</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reversals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      <RotateCcw className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                      No transaction reversals have been initiated.
                    </td>
                  </tr>
                ) : (
                  reversals.map((rev) => {
                    const isPending = rev.status === 'PendingApproval';
                    const isSelf =
                      user?.username && rev.requestedBy.toLowerCase() === user.username.toLowerCase();
                    return (
                      <tr key={rev.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">{rev.reversalReference}</td>
                        <td className="px-4 py-3">
                          <div className="font-mono font-semibold text-slate-900">{rev.originalReference}</div>
                          <div className="text-[11px] text-slate-400">Transfer ID #{rev.originalTransferId}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-700">
                          <div>DR: {rev.debitAccountNo}</div>
                          <div>CR: {rev.creditAccountNo}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-slate-900">
                          {formatCurrency(rev.amount)}
                        </td>
                        <td className="px-4 py-3 max-w-[240px]">
                          <p className="text-slate-800">{rev.reason}</p>
                          {rev.contraJournalReference && (
                            <p className="mt-0.5 font-mono text-[10px] font-semibold text-emerald-700">
                              Contra JRN: {rev.contraJournalReference}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[11px]">
                          <div>
                            Req: <span className="font-semibold text-slate-800">{rev.requestedBy}</span>
                          </div>
                          <div className="text-slate-400">{formatDateTime(rev.requestedAt)}</div>
                          {rev.approvedBy && <div className="text-emerald-700">App: {rev.approvedBy}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={rev.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isPending ? (
                            <div className="inline-flex flex-col items-end gap-1">
                              {isSelf && (
                                <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                                  <ShieldAlert className="h-3 w-3" /> Own Request
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => setApproveTarget(rev)}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Approve Reversal
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Settled</span>
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

      {/* Initiate Reversal Modal */}
      <Modal
        isOpen={initiateOpen}
        title="Initiate Contra-Entry Reversal"
        subtitle="Select an approved posted transfer to reverse via Maker-Checker control"
        onClose={() => setInitiateOpen(false)}
      >
        <form onSubmit={handleInitiateSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Approved Transfer *</label>
            {approvedTransfers.length > 0 ? (
              <select
                required
                value={selectedTransferId}
                onChange={(e) => setSelectedTransferId(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
              >
                <option value={0} disabled>
                  Select posted transfer...
                </option>
                {approvedTransfers.map((tx) => (
                  <option key={tx.id} value={tx.id}>
                    {tx.reference} — {formatCurrency(tx.amount, tx.currency)} ({tx.debitAccountNo} -&gt;{' '}
                    {tx.creditAccountNo})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                required
                min={1}
                value={selectedTransferId || ''}
                onChange={(e) => setSelectedTransferId(Number(e.target.value))}
                placeholder="Enter Original Transfer ID"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Reversal Reason *</label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Duplicate vendor disbursement posted in error"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setInitiateOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Submit Reversal Request
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(approveTarget)}
        variant="approve"
        title="Confirm Reversal Authorization"
        message="Approving this reversal posts an equal and opposite contra-entry journal and restores account balances."
        details={
          approveTarget
            ? [
                { label: 'Reversal Ref', value: approveTarget.reversalReference },
                { label: 'Original Ref', value: approveTarget.originalReference },
                { label: 'Amount', value: formatCurrency(approveTarget.amount) },
                { label: 'Reason', value: approveTarget.reason },
                { label: 'Requested By', value: approveTarget.requestedBy },
              ]
            : undefined
        }
        confirmLabel="Approve & Post Contra Journal"
        isLoading={approving}
        onConfirm={handleConfirmApprove}
        onCancel={() => setApproveTarget(null)}
      />
    </div>
  );
};
