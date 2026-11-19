import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building,
  Edit2,
  FolderTree,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Users,
} from 'lucide-react';
import { chartOfAccountsApi, financeSetupApi } from '../services/endpoints';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { StatusBadge } from '../components/StatusBadge';
import { extractApiError, formatCurrency, formatDateOnly } from '../utils/format';
import type {
  AccountCategoryDto,
  AccountGroupDto,
  AccountTypeDto,
  BankGlMappingDto,
  ChartOfAccountDto,
  CostCenterDto,
  CurrencyDto,
  DefaultAccountDto,
  UnifiedAccountDto,
  UpsertBankGlMappingRequest,
  UpsertChartOfAccountRequest,
  UpsertDefaultAccountRequest,
} from '../types/banking';

type TabKey = 'gl' | 'casa' | 'defaults' | 'banks';

export const ChartOfAccountsPage: React.FC = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('gl');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Datasets
  const [glAccounts, setGlAccounts] = useState<ChartOfAccountDto[]>([]);
  const [defaultAccounts, setDefaultAccounts] = useState<DefaultAccountDto[]>([]);
  const [bankMappings, setBankMappings] = useState<BankGlMappingDto[]>([]);
  const [unifiedAccounts, setUnifiedAccounts] = useState<UnifiedAccountDto[]>([]);
  const [unifiedKind, setUnifiedKind] = useState<'CASA' | 'ALL' | 'GL'>('CASA');
  const [unifiedSearch, setUnifiedSearch] = useState('');
  const [unifiedLoading, setUnifiedLoading] = useState(false);

  // Setup lookups
  const [groups, setGroups] = useState<AccountGroupDto[]>([]);
  const [categories, setCategories] = useState<AccountCategoryDto[]>([]);
  const [types, setTypes] = useState<AccountTypeDto[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenterDto[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyDto[]>([]);

  // Modals
  const [glModalOpen, setGlModalOpen] = useState(false);
  const [editingGl, setEditingGl] = useState<ChartOfAccountDto | null>(null);
  const [glForm, setGlForm] = useState<UpsertChartOfAccountRequest>({
    accountId: '',
    accountName: '',
    accountTypeId: 0,
    accountGroupId: 0,
    accountCategoryId: 0,
    branchCode: 'BR001',
    currCode: 'NGN',
    costCenterCode: 'CC001',
    balance: 0,
    accountStatus: 'Active',
  });

  const [defModalOpen, setDefModalOpen] = useState(false);
  const [editingDef, setEditingDef] = useState<DefaultAccountDto | null>(null);
  const [defForm, setDefForm] = useState<UpsertDefaultAccountRequest>({
    code: '',
    accountRole: '',
    accountId: '',
    accountName: '',
    description: '',
  });

  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankGlMappingDto | null>(null);
  const [bankForm, setBankForm] = useState<UpsertBankGlMappingRequest>({
    bankCode: '',
    bankName: '',
    glAccountId: '',
    glAccountName: '',
    settlementAccountNo: '',
    branchName: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
  });

  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    kind: 'gl' | 'defaults' | 'banks';
    id: number;
    label: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCoreData = useCallback(async () => {
    setLoading(true);
    try {
      const [glRes, defRes, bankRes, grpRes, catRes, typRes, ccRes, curRes] = await Promise.all([
        chartOfAccountsApi.getChartOfAccounts(),
        chartOfAccountsApi.getDefaultAccounts(),
        chartOfAccountsApi.getBankMappings(),
        financeSetupApi.getAccountGroups(),
        financeSetupApi.getAccountCategories(),
        financeSetupApi.getAccountTypes(),
        financeSetupApi.getCostCenters(),
        financeSetupApi.getCurrencies(),
      ]);
      setGlAccounts(glRes);
      setDefaultAccounts(defRes);
      setBankMappings(bankRes);
      setGroups(grpRes);
      setCategories(catRes);
      setTypes(typRes);
      setCostCenters(ccRes);
      setCurrencies(curRes);
    } catch (err) {
      toast.error('Failed to Load Chart of Accounts', extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadUnifiedAccounts = useCallback(
    async (kind: 'CASA' | 'ALL' | 'GL', query: string) => {
      setUnifiedLoading(true);
      try {
        const res = await chartOfAccountsApi.searchUnifiedAccounts({ kind, search: query });
        setUnifiedAccounts(res);
      } catch (err) {
        toast.error('Failed to Load Accounts View', extractApiError(err));
      } finally {
        setUnifiedLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    void loadCoreData();
  }, [loadCoreData]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUnifiedAccounts(unifiedKind, unifiedSearch);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [loadUnifiedAccounts, unifiedKind, unifiedSearch]);

  const filteredGl = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return glAccounts;
    return glAccounts.filter(
      (a) =>
        a.accountId.toLowerCase().includes(q) ||
        a.accountName.toLowerCase().includes(q) ||
        a.accountGroupName.toLowerCase().includes(q) ||
        a.accountCategoryName.toLowerCase().includes(q) ||
        a.branchCode.toLowerCase().includes(q),
    );
  }, [glAccounts, search]);

  const filteredDefaults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return defaultAccounts;
    return defaultAccounts.filter(
      (d) =>
        d.code.toLowerCase().includes(q) ||
        d.accountRole.toLowerCase().includes(q) ||
        d.accountId.toLowerCase().includes(q) ||
        d.accountName.toLowerCase().includes(q),
    );
  }, [defaultAccounts, search]);

  const filteredBanks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bankMappings;
    return bankMappings.filter(
      (b) =>
        b.bankCode.toLowerCase().includes(q) ||
        b.bankName.toLowerCase().includes(q) ||
        b.glAccountId.toLowerCase().includes(q) ||
        b.settlementAccountNo.toLowerCase().includes(q),
    );
  }, [bankMappings, search]);

  const casaStats = useMemo(() => {
    const totalAvail = unifiedAccounts.reduce((sum, a) => sum + (a.availableBalance || 0), 0);
    const restricted = unifiedAccounts.filter((a) => a.postNoDebit || a.postNoCredit).length;
    return { count: unifiedAccounts.length, totalAvail, restricted };
  }, [unifiedAccounts]);

  // Handlers
  const openCreateGl = () => {
    setEditingGl(null);
    const firstGrp = groups[0]?.id ?? 0;
    const firstCat = categories.find((c) => c.accountGroupId === firstGrp)?.id ?? categories[0]?.id ?? 0;
    const firstTyp = types.find((t) => t.accountCategoryId === firstCat)?.id ?? types[0]?.id ?? 0;
    setGlForm({
      accountId: '',
      accountName: '',
      accountGroupId: firstGrp,
      accountCategoryId: firstCat,
      accountTypeId: firstTyp,
      branchCode: costCenters[0]?.branchCode ?? 'BR001',
      currCode: currencies.find((c) => c.isBaseCurrency)?.currCode ?? currencies[0]?.currCode ?? 'NGN',
      costCenterCode: costCenters[0]?.code ?? 'CC001',
      balance: 0,
      accountStatus: 'Active',
    });
    setGlModalOpen(true);
  };

  const openEditGl = (row: ChartOfAccountDto) => {
    setEditingGl(row);
    setGlForm({
      accountId: row.accountId,
      accountName: row.accountName,
      accountTypeId: row.accountTypeId,
      accountGroupId: row.accountGroupId,
      accountCategoryId: row.accountCategoryId,
      branchCode: row.branchCode,
      currCode: row.currCode,
      costCenterCode: row.costCenterCode,
      balance: row.balance,
      accountStatus: row.accountStatus,
    });
    setGlModalOpen(true);
  };

  const handleSaveGl = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingGl) {
        await chartOfAccountsApi.updateChartOfAccount(editingGl.id, glForm);
        toast.success('GL Account Updated', `${glForm.accountId} — ${glForm.accountName}`);
      } else {
        await chartOfAccountsApi.createChartOfAccount(glForm);
        toast.success('GL Account Created', `${glForm.accountId} — ${glForm.accountName}`);
      }
      setGlModalOpen(false);
      await Promise.all([loadCoreData(), loadUnifiedAccounts(unifiedKind, unifiedSearch)]);
    } catch (err) {
      toast.error('Failed to Save GL Account', extractApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const openCreateDef = () => {
    setEditingDef(null);
    setDefForm({ code: '', accountRole: '', accountId: '', accountName: '', description: '' });
    setDefModalOpen(true);
  };

  const openEditDef = (row: DefaultAccountDto) => {
    setEditingDef(row);
    setDefForm({
      code: row.code,
      accountRole: row.accountRole,
      accountId: row.accountId,
      accountName: row.accountName,
      description: row.description,
    });
    setDefModalOpen(true);
  };

  const handleSaveDef = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingDef) {
        await chartOfAccountsApi.updateDefaultAccount(editingDef.id, defForm);
        toast.success('Default Account Updated', defForm.accountRole);
      } else {
        await chartOfAccountsApi.createDefaultAccount(defForm);
        toast.success('Default Account Created', defForm.accountRole);
      }
      setDefModalOpen(false);
      await loadCoreData();
    } catch (err) {
      toast.error('Failed to Save Default Account', extractApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const openCreateBank = () => {
    setEditingBank(null);
    setBankForm({
      bankCode: '',
      bankName: '',
      glAccountId: '',
      glAccountName: '',
      settlementAccountNo: '',
      branchName: 'Head Office',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
    });
    setBankModalOpen(true);
  };

  const openEditBank = (row: BankGlMappingDto) => {
    setEditingBank(row);
    setBankForm({
      bankCode: row.bankCode,
      bankName: row.bankName,
      glAccountId: row.glAccountId,
      glAccountName: row.glAccountName,
      settlementAccountNo: row.settlementAccountNo,
      branchName: row.branchName,
      contactName: row.contactName,
      contactPhone: row.contactPhone,
      contactEmail: row.contactEmail,
    });
    setBankModalOpen(true);
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingBank) {
        await chartOfAccountsApi.updateBankMapping(editingBank.id, bankForm);
        toast.success('Bank GL Mapping Updated', bankForm.bankName);
      } else {
        await chartOfAccountsApi.createBankMapping(bankForm);
        toast.success('Bank GL Mapping Created', bankForm.bankName);
      }
      setBankModalOpen(false);
      await loadCoreData();
    } catch (err) {
      toast.error('Failed to Save Bank Mapping', extractApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.kind === 'gl') await chartOfAccountsApi.deleteChartOfAccount(deleteTarget.id);
      if (deleteTarget.kind === 'defaults') await chartOfAccountsApi.deleteDefaultAccount(deleteTarget.id);
      if (deleteTarget.kind === 'banks') await chartOfAccountsApi.deleteBankMapping(deleteTarget.id);
      toast.success('Record Deleted', `"${deleteTarget.label}" removed.`);
      setDeleteTarget(null);
      await loadCoreData();
    } catch (err) {
      toast.error('Delete Failed', extractApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Bar with 4 Tabs */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 xl:flex-row xl:items-center">
        <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
          {[
            { key: 'gl' as TabKey, label: `GL Chart (${glAccounts.length})` },
            { key: 'casa' as TabKey, label: 'CASA Customer Accounts View' },
            { key: 'defaults' as TabKey, label: `Default Accounts (${defaultAccounts.length})` },
            { key: 'banks' as TabKey, label: `Bank GL Mappings (${bankMappings.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                activeTab === tab.key ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab !== 'casa' && (
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:w-64 sm:flex-initial">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search accounts or mappings..."
                className="w-full rounded-xl border border-slate-300 py-1.5 pl-8 pr-3 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => void loadCoreData()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={
                activeTab === 'gl' ? openCreateGl : activeTab === 'defaults' ? openCreateDef : openCreateBank
              }
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Plus className="h-3.5 w-3.5" />
              {activeTab === 'gl'
                ? 'New GL Account'
                : activeTab === 'defaults'
                  ? 'New Default Account'
                  : 'New Bank Mapping'}
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: GL Chart */}
      {activeTab === 'gl' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Account ID</th>
                    <th className="px-4 py-3 font-semibold">Account Name</th>
                    <th className="px-4 py-3 font-semibold">Group / Category / Type</th>
                    <th className="px-4 py-3 font-semibold">Branch / CC</th>
                    <th className="px-4 py-3 text-right font-semibold">Balance</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredGl.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                        <FolderTree className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                        No General Ledger accounts matched your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredGl.map((acc) => (
                      <tr key={acc.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">{acc.accountId}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{acc.accountName}</td>
                        <td className="px-4 py-3 text-slate-600">
                          <span className="font-semibold text-slate-800">{acc.accountGroupName}</span>
                          <span className="mx-1 text-slate-300">/</span>
                          <span>{acc.accountCategoryName}</span>
                          <div className="text-[11px] text-slate-400">{acc.accountTypeName}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {acc.branchCode} · {acc.costCenterCode}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-slate-900">
                          {formatCurrency(acc.balance, acc.currCode)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={acc.accountStatus} />
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          <div>{formatDateOnly(acc.dateCreated)}</div>
                          <div className="text-[10px] text-slate-400">{acc.createdBy}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditGl(acc)}
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              title="Edit GL Account"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  kind: 'gl',
                                  id: acc.id,
                                  label: `${acc.accountId} (${acc.accountName})`,
                                })
                              }
                              className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                              title="Delete GL Account"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: CASA Customer Accounts & Unified View */}
      {activeTab === 'casa' && (
        <div className="space-y-4">
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              {(['CASA', 'ALL', 'GL'] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setUnifiedKind(kind)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                    unifiedKind === kind
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {kind === 'CASA' ? 'Customer CASA Only' : kind === 'GL' ? 'GL Accounts Only' : 'All Unified Accounts'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={unifiedSearch}
                  onChange={(e) => setUnifiedSearch(e.target.value)}
                  placeholder="Search account number or customer name..."
                  className="w-full rounded-xl border border-slate-300 py-1.5 pl-8 pr-3 text-xs focus:border-slate-900 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => void loadUnifiedAccounts(unifiedKind, unifiedSearch)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${unifiedLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase text-slate-500">Matched Accounts</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{casaStats.count}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase text-slate-500">Aggregate Available Balance</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-emerald-700">
                {formatCurrency(casaStats.totalAvail)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase text-slate-500">PND / PNC Restricted</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-rose-600">{casaStats.restricted}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            {unifiedLoading ? (
              <div className="flex h-60 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Account Number</th>
                      <th className="px-4 py-3 font-semibold">Account Name</th>
                      <th className="px-4 py-3 font-semibold">Kind</th>
                      <th className="px-4 py-3 font-semibold">Branch</th>
                      <th className="px-4 py-3 text-right font-semibold">Available Balance</th>
                      <th className="px-4 py-3 text-right font-semibold">Ledger Balance</th>
                      <th className="px-4 py-3 text-right font-semibold">Overdraft Limit</th>
                      <th className="px-4 py-3 font-semibold">Controls</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {unifiedAccounts.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                          <Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                          No accounts found matching &ldquo;{unifiedSearch}&rdquo;.
                        </td>
                      </tr>
                    ) : (
                      unifiedAccounts.map((acc) => (
                        <tr key={`${acc.accountKind}-${acc.accountNumber}`} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">{acc.accountNumber}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{acc.accountName}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={acc.accountKind} />
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600">{acc.branchCode}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-emerald-700">
                            {formatCurrency(acc.availableBalance, acc.currency)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                            {formatCurrency(acc.ledgerBalance, acc.currency)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-500">
                            {formatCurrency(acc.overdraftLimit, acc.currency)}
                          </td>
                          <td className="px-4 py-3">
                            {acc.postNoDebit || acc.postNoCredit ? (
                              <div className="inline-flex items-center gap-1">
                                {acc.postNoDebit && (
                                  <span className="inline-flex items-center gap-0.5 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                                    <ShieldAlert className="h-3 w-3" /> PND
                                  </span>
                                )}
                                {acc.postNoCredit && (
                                  <span className="inline-flex items-center gap-0.5 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                                    <ShieldAlert className="h-3 w-3" /> PNC
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">Unrestricted</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={acc.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Default Accounts */}
      {activeTab === 'defaults' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Account Role</th>
                  <th className="px-4 py-3 font-semibold">Mapped GL Account</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDefaults.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                      No default control accounts configured.
                    </td>
                  </tr>
                ) : (
                  filteredDefaults.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{row.code}</td>
                      <td className="px-4 py-3 font-semibold text-indigo-700">{row.accountRole}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-slate-900">{row.accountId}</span>
                        <span className="ml-2 text-slate-600">{row.accountName}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{row.description}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditDef(row)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({
                                kind: 'defaults',
                                id: row.id,
                                label: `${row.code} — ${row.accountRole}`,
                              })
                            }
                            className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Bank GL Mappings */}
      {activeTab === 'banks' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Bank Code &amp; Name</th>
                  <th className="px-4 py-3 font-semibold">Correspondent GL Account</th>
                  <th className="px-4 py-3 font-semibold">Settlement Account</th>
                  <th className="px-4 py-3 font-semibold">Branch</th>
                  <th className="px-4 py-3 font-semibold">Relationship Contact</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBanks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      <Building className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                      No bank GL mappings found.
                    </td>
                  </tr>
                ) : (
                  filteredBanks.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-slate-900">{row.bankCode}</span>
                        <div className="font-medium text-slate-700">{row.bankName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-slate-900">{row.glAccountId}</span>
                        <div className="text-[11px] text-slate-500">{row.glAccountName}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700">{row.settlementAccountNo}</td>
                      <td className="px-4 py-3 text-slate-600">{row.branchName}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="font-medium text-slate-800">{row.contactName || '—'}</div>
                        <div className="text-[11px] text-slate-500">
                          {row.contactPhone} {row.contactEmail ? `· ${row.contactEmail}` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditBank(row)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({
                                kind: 'banks',
                                id: row.id,
                                label: `${row.bankCode} — ${row.bankName}`,
                              })
                            }
                            className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: GL Account */}
      <Modal
        isOpen={glModalOpen}
        title={editingGl ? 'Edit GL Account' : 'Create GL Account'}
        subtitle="Configure General Ledger account hierarchy, branch, currency, and opening balance"
        maxWidthClass="max-w-2xl"
        onClose={() => setGlModalOpen(false)}
      >
        <form onSubmit={handleSaveGl} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">GL Account ID *</label>
              <input
                type="text"
                required
                value={glForm.accountId}
                onChange={(e) => setGlForm({ ...glForm, accountId: e.target.value })}
                placeholder="1001001001"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Account Name *</label>
              <input
                type="text"
                required
                value={glForm.accountName}
                onChange={(e) => setGlForm({ ...glForm, accountName: e.target.value })}
                placeholder="CBN Settlement Nostro NGN"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Account Group *</label>
              <select
                required
                value={glForm.accountGroupId}
                onChange={(e) => setGlForm({ ...glForm, accountGroupId: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              >
                <option value={0} disabled>
                  Select group...
                </option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.code} — {g.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Account Category *</label>
              <select
                required
                value={glForm.accountCategoryId}
                onChange={(e) => setGlForm({ ...glForm, accountCategoryId: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              >
                <option value={0} disabled>
                  Select category...
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.descriptions}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Account Type *</label>
              <select
                required
                value={glForm.accountTypeId}
                onChange={(e) => setGlForm({ ...glForm, accountTypeId: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              >
                <option value={0} disabled>
                  Select type...
                </option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Branch Code *</label>
              <input
                type="text"
                required
                value={glForm.branchCode}
                onChange={(e) => setGlForm({ ...glForm, branchCode: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Currency *</label>
              <select
                value={glForm.currCode}
                onChange={(e) => setGlForm({ ...glForm, currCode: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              >
                {currencies.length === 0 ? (
                  <option value="NGN">NGN</option>
                ) : (
                  currencies.map((c) => (
                    <option key={c.id} value={c.currCode}>
                      {c.currCode} — {c.currName}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Cost Center *</label>
              <select
                value={glForm.costCenterCode}
                onChange={(e) => setGlForm({ ...glForm, costCenterCode: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              >
                {costCenters.length === 0 ? (
                  <option value="CC001">CC001</option>
                ) : (
                  costCenters.map((cc) => (
                    <option key={cc.id} value={cc.code}>
                      {cc.code} — {cc.department}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                {editingGl ? 'Current Ledger Balance (Read-Only)' : 'Opening Balance'}
              </label>
              <input
                type="number"
                step="0.01"
                disabled={Boolean(editingGl)}
                value={glForm.balance}
                onChange={(e) => setGlForm({ ...glForm, balance: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm focus:border-slate-900 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
              />
              {editingGl && (
                <p className="mt-1 text-[10px] text-slate-500">
                  Live GL balances update exclusively via approved double-entry journals.
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Account Status</label>
              <select
                value={glForm.accountStatus}
                onChange={(e) => setGlForm({ ...glForm, accountStatus: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Frozen">Frozen</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setGlModalOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editingGl ? 'Update GL Account' : 'Create GL Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Default Account */}
      <Modal
        isOpen={defModalOpen}
        title={editingDef ? 'Edit Default Control Account' : 'Create Default Control Account'}
        onClose={() => setDefModalOpen(false)}
      >
        <form onSubmit={handleSaveDef} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Code *</label>
              <input
                type="text"
                required
                value={defForm.code}
                onChange={(e) => setDefForm({ ...defForm, code: e.target.value })}
                placeholder="DEF-SUSP"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Account Role *</label>
              <input
                type="text"
                required
                value={defForm.accountRole}
                onChange={(e) => setDefForm({ ...defForm, accountRole: e.target.value })}
                placeholder="CASA Liability Control"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Quick Pick GL Account (Optional)</label>
            <select
              value=""
              onChange={(e) => {
                const picked = glAccounts.find((g) => g.accountId === e.target.value);
                if (picked) {
                  setDefForm({ ...defForm, accountId: picked.accountId, accountName: picked.accountName });
                }
              }}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-slate-900 focus:outline-none"
            >
              <option value="">-- Select from GL Chart to autofill --</option>
              {glAccounts.map((g) => (
                <option key={g.id} value={g.accountId}>
                  {g.accountId} — {g.accountName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">GL Account ID *</label>
              <input
                type="text"
                required
                value={defForm.accountId}
                onChange={(e) => setDefForm({ ...defForm, accountId: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Account Name *</label>
              <input
                type="text"
                required
                value={defForm.accountName}
                onChange={(e) => setDefForm({ ...defForm, accountName: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Description</label>
            <textarea
              rows={2}
              value={defForm.description}
              onChange={(e) => setDefForm({ ...defForm, description: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setDefModalOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editingDef ? 'Save Changes' : 'Create Default Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Bank GL Mapping */}
      <Modal
        isOpen={bankModalOpen}
        title={editingBank ? 'Edit Bank GL Mapping' : 'Create Bank GL Mapping'}
        maxWidthClass="max-w-2xl"
        onClose={() => setBankModalOpen(false)}
      >
        <form onSubmit={handleSaveBank} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Bank Code *</label>
              <input
                type="text"
                required
                value={bankForm.bankCode}
                onChange={(e) => setBankForm({ ...bankForm, bankCode: e.target.value })}
                placeholder="011"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Bank Name *</label>
              <input
                type="text"
                required
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                placeholder="Zenith Commercial Bank"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Pick Correspondent GL Account</label>
            <select
              value=""
              onChange={(e) => {
                const picked = glAccounts.find((g) => g.accountId === e.target.value);
                if (picked) {
                  setBankForm({ ...bankForm, glAccountId: picked.accountId, glAccountName: picked.accountName });
                }
              }}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-slate-900 focus:outline-none"
            >
              <option value="">-- Autofill from GL Chart --</option>
              {glAccounts.map((g) => (
                <option key={g.id} value={g.accountId}>
                  {g.accountId} — {g.accountName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">GL Account ID *</label>
              <input
                type="text"
                required
                value={bankForm.glAccountId}
                onChange={(e) => setBankForm({ ...bankForm, glAccountId: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">GL Account Name</label>
              <input
                type="text"
                value={bankForm.glAccountName}
                onChange={(e) => setBankForm({ ...bankForm, glAccountName: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Settlement Account No</label>
              <input
                type="text"
                value={bankForm.settlementAccountNo}
                onChange={(e) => setBankForm({ ...bankForm, settlementAccountNo: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Branch Name</label>
              <input
                type="text"
                value={bankForm.branchName}
                onChange={(e) => setBankForm({ ...bankForm, branchName: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Contact Name</label>
              <input
                type="text"
                value={bankForm.contactName}
                onChange={(e) => setBankForm({ ...bankForm, contactName: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Contact Phone</label>
              <input
                type="text"
                value={bankForm.contactPhone}
                onChange={(e) => setBankForm({ ...bankForm, contactPhone: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Contact Email</label>
              <input
                type="email"
                value={bankForm.contactEmail}
                onChange={(e) => setBankForm({ ...bankForm, contactEmail: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setBankModalOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editingBank ? 'Save Changes' : 'Create Bank Mapping'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        variant="danger"
        title="Confirm Deletion"
        message={`Permanently delete "${deleteTarget?.label}"? Ensure no active ledger dependencies reference this record.`}
        confirmLabel="Delete Record"
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
