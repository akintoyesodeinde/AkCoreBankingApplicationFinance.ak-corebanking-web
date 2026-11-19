import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Download,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { ledgerApi } from '../services/endpoints';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/StatusBadge';
import { extractApiError, formatCurrency, formatDateOnly, formatDateTime } from '../utils/format';
import type { AuditLogDto, JournalEntryDto } from '../types/banking';

type TabKey = 'journals' | 'audit';

export const JournalsPage: React.FC = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('journals');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [journals, setJournals] = useState<JournalEntryDto[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogDto[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [jRes, aRes] = await Promise.all([ledgerApi.getJournals(), ledgerApi.getAuditLogs()]);
      setJournals(jRes);
      setAuditLogs(aRes);
      if (jRes.length > 0 && expandedId === null) {
        setExpandedId(jRes[0].id);
      }
    } catch (err) {
      toast.error('Failed to Load Ledger & Audit Data', extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [expandedId, toast]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const q = search.trim().toLowerCase();

  const filteredJournals = useMemo(() => {
    if (!q) return journals;
    return journals.filter(
      (j) =>
        j.journalReference.toLowerCase().includes(q) ||
        j.sourceReference.toLowerCase().includes(q) ||
        j.transactionType.toLowerCase().includes(q) ||
        j.postedBy.toLowerCase().includes(q) ||
        j.approvedBy.toLowerCase().includes(q) ||
        j.lines.some(
          (l) => l.accountNo.toLowerCase().includes(q) || l.accountName.toLowerCase().includes(q),
        ),
    );
  }, [journals, q]);

  const filteredAudits = useMemo(() => {
    if (!q) return auditLogs;
    return auditLogs.filter(
      (a) =>
        a.action.toLowerCase().includes(q) ||
        a.entityName.toLowerCase().includes(q) ||
        a.entityId.toLowerCase().includes(q) ||
        a.performedBy.toLowerCase().includes(q) ||
        a.userRole.toLowerCase().includes(q) ||
        a.details.toLowerCase().includes(q),
    );
  }, [auditLogs, q]);

  const totals = useMemo(() => {
    const dr = filteredJournals.reduce((s, j) => s + j.totalDebit, 0);
    const cr = filteredJournals.reduce((s, j) => s + j.totalCredit, 0);
    return { dr, cr, balanced: Math.abs(dr - cr) < 0.01 };
  }, [filteredJournals]);

  const exportJournalsCsv = () => {
    const header = [
      'JournalReference',
      'SourceReference',
      'TransactionType',
      'PostDate',
      'AccountNo',
      'AccountName',
      'AccountKind',
      'DebitAmount',
      'CreditAmount',
      'Currency',
      'PostedBy',
      'ApprovedBy',
      'Narration',
    ];
    const rows = filteredJournals.flatMap((j) =>
      j.lines.map((l) => [
        j.journalReference,
        j.sourceReference,
        j.transactionType,
        j.postDate,
        l.accountNo,
        `"${(l.accountName || '').replace(/"/g, '""')}"`,
        l.accountKind,
        l.debitAmount.toFixed(2),
        l.creditAmount.toFixed(2),
        j.currency,
        j.postedBy,
        j.approvedBy,
        `"${(l.narration || '').replace(/"/g, '""')}"`,
      ]),
    );
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ak-core-banking-journals-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Journals Exported', `Exported ${filteredJournals.length} journal batches to CSV.`);
  };

  return (
    <div className="space-y-5">
      {/* Control Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('journals')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'journals' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Double-Entry Journals ({journals.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'audit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            System Audit Trail ({auditLogs.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-72 sm:flex-initial">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === 'journals'
                  ? 'Search ref, account, maker, checker...'
                  : 'Search action, entity, user, IP...'
              }
              className="w-full rounded-xl border border-slate-300 py-1.5 pl-8 pr-3 text-xs focus:border-slate-900 focus:outline-none"
            />
          </div>
          {activeTab === 'journals' && (
            <button
              type="button"
              onClick={exportJournalsCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          )}
          <button
            type="button"
            onClick={() => void loadAll()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Journals Tab */}
      {activeTab === 'journals' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase text-slate-500">Matched Debits</p>
              <p className="mt-1 font-mono text-lg font-bold tabular-nums text-slate-900">
                {formatCurrency(totals.dr)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase text-slate-500">Matched Credits</p>
              <p className="mt-1 font-mono text-lg font-bold tabular-nums text-slate-900">
                {formatCurrency(totals.cr)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase text-slate-500">Ledger Parity</p>
                <p className="mt-1 text-xs text-slate-600">Debits == Credits check</p>
              </div>
              <StatusBadge status={totals.balanced ? 'Balanced' : 'Unbalanced'} size="md" />
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="flex h-60 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              </div>
            ) : filteredJournals.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white py-14 text-center text-xs text-slate-500">
                <BookOpen className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                No journal entries found.
              </div>
            ) : (
              filteredJournals.map((j) => {
                const isOpen = expandedId === j.id;
                const isEntryBalanced = Math.abs(j.totalDebit - j.totalCredit) < 0.01;
                return (
                  <div key={j.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isOpen ? null : j.id)}
                      className="flex w-full flex-wrap items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50/70"
                    >
                      <div className="flex items-start gap-3">
                        {isOpen ? (
                          <ChevronDown className="mt-0.5 h-4 w-4 text-slate-500" />
                        ) : (
                          <ChevronRight className="mt-0.5 h-4 w-4 text-slate-400" />
                        )}
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">{j.journalReference}</span>
                            <StatusBadge status={j.status} />
                            <StatusBadge status={isEntryBalanced ? 'Balanced' : 'Unbalanced'} />
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                              {j.transactionType}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500">
                            Source: <span className="font-mono text-slate-700">{j.sourceReference}</span> · Maker:{' '}
                            <span className="font-medium text-slate-700">{j.postedBy}</span> · Checker:{' '}
                            <span className="font-medium text-slate-700">{j.approvedBy || '—'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right text-xs">
                        <p className="font-mono font-bold tabular-nums text-slate-900">
                          DR {formatCurrency(j.totalDebit, j.currency)} &nbsp;/&nbsp; CR{' '}
                          {formatCurrency(j.totalCredit, j.currency)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          Post: {formatDateTime(j.postDate)} · Value: {formatDateOnly(j.valueDate)}
                        </p>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-slate-200 bg-slate-50/60 p-4">
                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                              <tr>
                                <th className="px-4 py-2.5 font-semibold">Account No</th>
                                <th className="px-4 py-2.5 font-semibold">Account Name</th>
                                <th className="px-4 py-2.5 font-semibold">Kind</th>
                                <th className="px-4 py-2.5 font-semibold">Narration</th>
                                <th className="px-4 py-2.5 text-right font-semibold">Debit</th>
                                <th className="px-4 py-2.5 text-right font-semibold">Credit</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {j.lines.map((line) => (
                                <tr key={line.id}>
                                  <td className="px-4 py-2.5 font-mono font-semibold text-slate-900">
                                    {line.accountNo}
                                  </td>
                                  <td className="px-4 py-2.5 text-slate-800">{line.accountName}</td>
                                  <td className="px-4 py-2.5">
                                    <StatusBadge status={line.accountKind} />
                                  </td>
                                  <td className="px-4 py-2.5 text-slate-600">{line.narration}</td>
                                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-900">
                                    {line.debitAmount > 0 ? formatCurrency(line.debitAmount, j.currency) : '—'}
                                  </td>
                                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-900">
                                    {line.creditAmount > 0 ? formatCurrency(line.creditAmount, j.currency) : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="border-t border-slate-200 bg-slate-50 font-semibold text-slate-900">
                              <tr>
                                <td colSpan={4} className="px-4 py-2 text-right text-[11px] uppercase text-slate-500">
                                  Journal Totals
                                </td>
                                <td className="px-4 py-2 text-right font-mono tabular-nums">
                                  {formatCurrency(j.totalDebit, j.currency)}
                                </td>
                                <td className="px-4 py-2 text-right font-mono tabular-nums">
                                  {formatCurrency(j.totalCredit, j.currency)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
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
                    <th className="px-4 py-3 font-semibold">Timestamp</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                    <th className="px-4 py-3 font-semibold">Entity</th>
                    <th className="px-4 py-3 font-semibold">Actor &amp; Role</th>
                    <th className="px-4 py-3 font-semibold">Branch / IP</th>
                    <th className="px-4 py-3 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAudits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                        No audit log events matched your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAudits.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                          {formatDateTime(log.timestamp)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-slate-900 px-2 py-0.5 font-mono text-[10px] font-semibold text-white">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-900">{log.entityName}</span>
                          {log.entityId && (
                            <span className="ml-1.5 font-mono text-[11px] text-slate-500">#{log.entityId}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{log.performedBy}</div>
                          <div className="text-[11px] text-slate-500">{log.userRole}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                          <div>{log.branchCode}</div>
                          <div className="text-slate-400">{log.ipAddress || '—'}</div>
                        </td>
                        <td className="px-4 py-3 max-w-md text-slate-700">{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
