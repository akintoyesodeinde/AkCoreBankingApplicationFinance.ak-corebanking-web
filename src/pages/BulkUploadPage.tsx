import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  ShieldAlert,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import { bulkUploadsApi, chartOfAccountsApi } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AccountPicker } from '../components/AccountPicker';
import { ConfirmModal } from '../components/ConfirmModal';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { extractApiError, formatCurrency, formatDateTime } from '../utils/format';
import type { BulkBatchDto, UnifiedAccountDto } from '../types/banking';

export const BulkUploadPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [batches, setBatches] = useState<BulkBatchDto[]>([]);
  const [accounts, setAccounts] = useState<UnifiedAccountDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload state
  const [debitAccountNo, setDebitAccountNo] = useState('');
  const [narration, setNarration] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloadingTpl, setDownloadingTpl] = useState(false);

  // Inspect modal & Approval confirm modal
  const [inspectBatch, setInspectBatch] = useState<BulkBatchDto | null>(null);
  const [approveTarget, setApproveTarget] = useState<BulkBatchDto | null>(null);
  const [approving, setApproving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [batchRes, accRes] = await Promise.all([
        bulkUploadsApi.list(),
        chartOfAccountsApi.searchUnifiedAccounts({ kind: 'ALL' }),
      ]);
      setBatches(batchRes);
      setAccounts(accRes);
    } catch (err) {
      toast.error('Failed to Load Bulk Batches', extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleDownloadTemplate = async () => {
    setDownloadingTpl(true);
    try {
      const blob = await bulkUploadsApi.downloadTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ak-core-banking-bulk-transfer-template.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('CSV Template Downloaded', 'Populate CreditAccountNo, Amount, Narration, ChequeNo rows.');
    } catch (err) {
      toast.error('Template Download Failed', extractApiError(err));
    } finally {
      setDownloadingTpl(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.warning('Missing CSV File', 'Please select a .csv schedule file to upload.');
      return;
    }
    if (!debitAccountNo.trim()) {
      toast.warning('Missing Debit Account', 'Select the funding debit account for this batch.');
      return;
    }
    setUploading(true);
    try {
      const batch = await bulkUploadsApi.upload(selectedFile, debitAccountNo.trim(), narration.trim());
      toast.success(
        'Bulk Batch Validated',
        `Batch ${batch.batchRef}: ${batch.validRows}/${batch.totalRows} valid rows (${formatCurrency(batch.totalAmount)}).`,
      );
      setSelectedFile(null);
      setNarration('');
      const input = document.getElementById('bulk-csv-input') as HTMLInputElement | null;
      if (input) input.value = '';
      await loadData();
      setInspectBatch(batch);
    } catch (err) {
      toast.error('Bulk Upload Failed', extractApiError(err));
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmApprove = async () => {
    if (!approveTarget) return;
    setApproving(true);
    try {
      const updated = await bulkUploadsApi.approve(approveTarget.batchRef);
      toast.success(
        'Bulk Batch Approved & Settled',
        `Batch ${updated.batchRef} posted ${updated.validRows} credits (${formatCurrency(updated.totalAmount)}).`,
      );
      setApproveTarget(null);
      await loadData();
    } catch (err) {
      toast.error('Batch Approval Blocked', extractApiError(err));
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">Upload Bulk Credit Schedule (CSV)</h2>
            <p className="text-xs text-slate-500">
              Validate beneficiary accounts &amp; amounts before routing batch to Checker authorization.
            </p>
          </div>
          <button
            type="button"
            disabled={downloadingTpl}
            onClick={() => void handleDownloadTemplate()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100 disabled:opacity-60"
          >
            {downloadingTpl ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Download CSV Template
          </button>
        </div>

        <form onSubmit={handleUploadSubmit} className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-4">
            <AccountPicker
              label="Funding Debit Account"
              required
              value={debitAccountNo}
              accounts={accounts}
              onChange={(accNo) => setDebitAccountNo(accNo)}
            />
          </div>

          <div className="lg:col-span-3">
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Batch Narration *</label>
            <input
              type="text"
              required
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              placeholder="e.g. November 2026 Payroll"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div className="lg:col-span-3">
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">CSV / Excel Schedule File *</label>
            <input
              id="bulk-csv-input"
              type="file"
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              required
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="block w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-800"
            />
          </div>

          <div className="lg:col-span-2">
            <button
              type="submit"
              disabled={uploading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              Upload &amp; Validate
            </button>
          </div>
        </form>
      </div>

      {/* Batches Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Uploaded Bulk Batches ({batches.length})</h3>
            <p className="text-xs text-slate-500">Click Inspect Rows to review row-level validation diagnostics</p>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Batch Reference</th>
                  <th className="px-4 py-3 font-semibold">Funding Debit Account</th>
                  <th className="px-4 py-3 text-center font-semibold">Rows (Valid / Invalid)</th>
                  <th className="px-4 py-3 text-right font-semibold">Total Amount</th>
                  <th className="px-4 py-3 font-semibold">Uploader / Checker</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      <FileSpreadsheet className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                      No bulk upload batches submitted yet.
                    </td>
                  </tr>
                ) : (
                  batches.map((b) => {
                    const canApprove =
                      (b.status === 'PendingApproval' || b.status === 'Validated') && b.validRows > 0;
                    const isSelf =
                      user?.username && b.uploadedBy.toLowerCase() === user.username.toLowerCase();
                    return (
                      <tr key={b.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">{b.batchRef}</td>
                        <td className="px-4 py-3">
                          <div className="font-mono font-semibold text-slate-900">{b.debitAccountNo}</div>
                          <div className="text-[11px] text-slate-500">{b.debitAccountName}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold text-slate-900">{b.totalRows}</span>
                          <span className="mx-1 text-slate-300">|</span>
                          <span className="font-semibold text-emerald-700">{b.validRows} ok</span>
                          {b.invalidRows > 0 && (
                            <>
                              <span className="mx-1 text-slate-300">/</span>
                              <span className="font-semibold text-rose-600">{b.invalidRows} err</span>
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-slate-900">
                          {formatCurrency(b.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-[11px]">
                          <div>
                            Maker: <span className="font-semibold text-slate-800">{b.uploadedBy}</span>
                          </div>
                          <div className="text-slate-400">{formatDateTime(b.uploadedAt)}</div>
                          {b.approvedBy && <div className="text-emerald-700">Checker: {b.approvedBy}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={b.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setInspectBatch(b)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Rows ({b.items?.length ?? b.totalRows})
                            </button>
                            {canApprove && (
                              <button
                                type="button"
                                onClick={() => setApproveTarget(b)}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700"
                                title={isSelf ? 'Segregation of Duties: Maker cannot approve own upload' : 'Approve batch'}
                              >
                                {isSelf ? (
                                  <ShieldAlert className="h-3.5 w-3.5" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                )}
                                Approve Batch
                              </button>
                            )}
                          </div>
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

      {/* Inspect Rows Modal */}
      <Modal
        isOpen={Boolean(inspectBatch)}
        title={`Batch Line Validation — ${inspectBatch?.batchRef ?? ''}`}
        subtitle={`Debit Account: ${inspectBatch?.debitAccountNo} · Total Valid Settlement: ${formatCurrency(inspectBatch?.totalAmount ?? 0)}`}
        maxWidthClass="max-w-4xl"
        onClose={() => setInspectBatch(null)}
      >
        {inspectBatch && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Row</th>
                  <th className="px-3 py-2.5 font-semibold">Credit Account</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Amount</th>
                  <th className="px-3 py-2.5 font-semibold">Narration</th>
                  <th className="px-3 py-2.5 font-semibold">Cheque</th>
                  <th className="px-3 py-2.5 font-semibold">Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inspectBatch.items.map((item) => (
                  <tr key={item.id} className={item.isValid ? '' : 'bg-rose-50/50'}>
                    <td className="px-3 py-2 font-mono text-slate-500">#{item.rowNumber}</td>
                    <td className="px-3 py-2">
                      <span className="font-mono font-semibold text-slate-900">{item.creditAccountNo}</span>
                      <div className="text-[11px] text-slate-500">{item.creditAccountName}</div>
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums text-slate-900">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{item.narration}</td>
                    <td className="px-3 py-2 font-mono text-slate-500">{item.chequeNo || '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        {item.isValid ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                        )}
                        <span className={item.isValid ? 'text-emerald-700' : 'font-medium text-rose-700'}>
                          {item.validationMessage}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={Boolean(approveTarget)}
        variant="approve"
        title="Confirm Bulk Batch Approval"
        message="Approving this bulk upload batch will debit the funding account and post double-entry credits for all valid rows."
        details={
          approveTarget
            ? [
                { label: 'Batch Reference', value: approveTarget.batchRef },
                { label: 'Debit Account', value: `${approveTarget.debitAccountNo} (${approveTarget.debitAccountName})` },
                { label: 'Valid Rows', value: `${approveTarget.validRows} of ${approveTarget.totalRows}` },
                { label: 'Total Settlement', value: formatCurrency(approveTarget.totalAmount) },
                { label: 'Uploaded By', value: approveTarget.uploadedBy },
              ]
            : undefined
        }
        confirmLabel="Approve & Post Batch"
        isLoading={approving}
        onConfirm={handleConfirmApprove}
        onCancel={() => setApproveTarget(null)}
      />
    </div>
  );
};
