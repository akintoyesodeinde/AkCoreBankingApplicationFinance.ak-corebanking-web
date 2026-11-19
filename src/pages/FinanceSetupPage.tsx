import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Coins,
  Edit2,
  FolderKanban,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { captionsApi, financeSetupApi } from '../services/endpoints';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { StatusBadge } from '../components/StatusBadge';
import { extractApiError, formatCurrency, formatDateOnly } from '../utils/format';
import type {
  AccountCategoryDto,
  AccountGroupDto,
  AccountTypeDto,
  CostCenterDto,
  CurrencyDto,
  GlPolicyDto,
  SubCaptionDto,
  UpsertAccountCategoryRequest,
  UpsertAccountGroupRequest,
  UpsertAccountTypeRequest,
  UpsertCostCenterRequest,
  UpsertCurrencyRequest,
  UpsertGlPolicyRequest,
} from '../types/banking';

type TabKey = 'groups' | 'categories' | 'types' | 'costCenters' | 'currencies' | 'policies';

const CATEGORY_TYPES = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'];

export const FinanceSetupPage: React.FC = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('groups');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [groups, setGroups] = useState<AccountGroupDto[]>([]);
  const [categories, setCategories] = useState<AccountCategoryDto[]>([]);
  const [types, setTypes] = useState<AccountTypeDto[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenterDto[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyDto[]>([]);
  const [policies, setPolicies] = useState<GlPolicyDto[]>([]);
  const [subCaptions, setSubCaptions] = useState<SubCaptionDto[]>([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [groupForm, setGroupForm] = useState<UpsertAccountGroupRequest>({
    code: '',
    description: '',
    categoryType: 'Asset',
    isActive: true,
  });
  const [catForm, setCatForm] = useState<UpsertAccountCategoryRequest>({
    descriptions: '',
    accountGroupId: 0,
    isActive: true,
  });
  const [typeForm, setTypeForm] = useState<UpsertAccountTypeRequest>({
    description: '',
    accountCategoryId: 0,
    subCaptionId: null,
    active: true,
  });
  const [ccForm, setCcForm] = useState<UpsertCostCenterRequest>({
    code: '',
    department: '',
    branchCode: 'BR001',
    managerName: '',
    isActive: true,
  });
  const [currForm, setCurrForm] = useState<UpsertCurrencyRequest>({
    currCode: '',
    currName: '',
    currSymbol: '',
    exchangeRateToNgn: 1,
    isBaseCurrency: false,
    isActive: true,
  });
  const [policyForm, setPolicyForm] = useState<UpsertGlPolicyRequest>({
    glLength: 10,
    companyCodeLength: 2,
    branchCodeLength: 3,
    productCodeLength: 2,
    currencyCodeLength: 3,
    enforceBalancedPosting: true,
    requireMakerChecker: true,
    makerCheckerThreshold: 0,
  });

  const [deleteTarget, setDeleteTarget] = useState<{
    tab: TabKey;
    id: number;
    label: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [g, c, t, cc, cur, pol, subs] = await Promise.all([
        financeSetupApi.getAccountGroups(),
        financeSetupApi.getAccountCategories(),
        financeSetupApi.getAccountTypes(),
        financeSetupApi.getCostCenters(),
        financeSetupApi.getCurrencies(),
        financeSetupApi.getGlPolicies(),
        captionsApi.getSubCaptions(),
      ]);
      setGroups(g);
      setCategories(c);
      setTypes(t);
      setCostCenters(cc);
      setCurrencies(cur);
      setPolicies(pol);
      setSubCaptions(subs);
    } catch (err) {
      toast.error('Failed to Load Finance Setup', extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const openCreate = () => {
    setEditingId(null);
    if (activeTab === 'groups') {
      setGroupForm({ code: '', description: '', categoryType: 'Asset', isActive: true });
    } else if (activeTab === 'categories') {
      setCatForm({ descriptions: '', accountGroupId: groups[0]?.id ?? 0, isActive: true });
    } else if (activeTab === 'types') {
      setTypeForm({
        description: '',
        accountCategoryId: categories[0]?.id ?? 0,
        subCaptionId: subCaptions[0]?.id ?? null,
        active: true,
      });
    } else if (activeTab === 'costCenters') {
      setCcForm({ code: '', department: '', branchCode: 'BR001', managerName: '', isActive: true });
    } else if (activeTab === 'currencies') {
      setCurrForm({
        currCode: '',
        currName: '',
        currSymbol: '',
        exchangeRateToNgn: 1,
        isBaseCurrency: false,
        isActive: true,
      });
    } else if (activeTab === 'policies') {
      setPolicyForm({
        glLength: 10,
        companyCodeLength: 2,
        branchCodeLength: 3,
        productCodeLength: 2,
        currencyCodeLength: 3,
        enforceBalancedPosting: true,
        requireMakerChecker: true,
        makerCheckerThreshold: 0,
      });
    }
    setModalOpen(true);
  };

  const openEdit = (tab: TabKey, item: unknown) => {
    setActiveTab(tab);
    if (tab === 'groups') {
      const g = item as AccountGroupDto;
      setEditingId(g.id);
      setGroupForm({ code: g.code, description: g.description, categoryType: g.categoryType, isActive: g.isActive });
    } else if (tab === 'categories') {
      const c = item as AccountCategoryDto;
      setEditingId(c.id);
      setCatForm({ descriptions: c.descriptions, accountGroupId: c.accountGroupId, isActive: c.isActive });
    } else if (tab === 'types') {
      const t = item as AccountTypeDto;
      setEditingId(t.id);
      setTypeForm({
        description: t.description,
        accountCategoryId: t.accountCategoryId,
        subCaptionId: t.subCaptionId,
        active: t.active,
      });
    } else if (tab === 'costCenters') {
      const cc = item as CostCenterDto;
      setEditingId(cc.id);
      setCcForm({
        code: cc.code,
        department: cc.department,
        branchCode: cc.branchCode,
        managerName: cc.managerName,
        isActive: cc.isActive,
      });
    } else if (tab === 'currencies') {
      const cur = item as CurrencyDto;
      setEditingId(cur.id);
      setCurrForm({
        currCode: cur.currCode,
        currName: cur.currName,
        currSymbol: cur.currSymbol,
        exchangeRateToNgn: cur.exchangeRateToNgn,
        isBaseCurrency: cur.isBaseCurrency,
        isActive: cur.isActive,
      });
    } else if (tab === 'policies') {
      const p = item as GlPolicyDto;
      setEditingId(p.id);
      setPolicyForm({
        glLength: p.glLength,
        companyCodeLength: p.companyCodeLength,
        branchCodeLength: p.branchCodeLength,
        productCodeLength: p.productCodeLength,
        currencyCodeLength: p.currencyCodeLength,
        enforceBalancedPosting: p.enforceBalancedPosting,
        requireMakerChecker: p.requireMakerChecker,
        makerCheckerThreshold: p.makerCheckerThreshold,
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (activeTab === 'groups') {
        if (editingId) await financeSetupApi.updateAccountGroup(editingId, groupForm);
        else await financeSetupApi.createAccountGroup(groupForm);
      } else if (activeTab === 'categories') {
        if (editingId) await financeSetupApi.updateAccountCategory(editingId, catForm);
        else await financeSetupApi.createAccountCategory(catForm);
      } else if (activeTab === 'types') {
        if (editingId) await financeSetupApi.updateAccountType(editingId, typeForm);
        else await financeSetupApi.createAccountType(typeForm);
      } else if (activeTab === 'costCenters') {
        if (editingId) await financeSetupApi.updateCostCenter(editingId, ccForm);
        else await financeSetupApi.createCostCenter(ccForm);
      } else if (activeTab === 'currencies') {
        if (editingId) await financeSetupApi.updateCurrency(editingId, currForm);
        else await financeSetupApi.createCurrency(currForm);
      } else if (activeTab === 'policies') {
        if (editingId) await financeSetupApi.updateGlPolicy(editingId, policyForm);
        else await financeSetupApi.createGlPolicy(policyForm);
      }

      toast.success(editingId ? 'Configuration Updated' : 'Configuration Created', 'Finance setup saved successfully.');
      setModalOpen(false);
      await loadAll();
    } catch (err) {
      toast.error('Failed to Save Setup', extractApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.tab === 'groups') await financeSetupApi.deleteAccountGroup(deleteTarget.id);
      if (deleteTarget.tab === 'categories') await financeSetupApi.deleteAccountCategory(deleteTarget.id);
      if (deleteTarget.tab === 'types') await financeSetupApi.deleteAccountType(deleteTarget.id);
      if (deleteTarget.tab === 'costCenters') await financeSetupApi.deleteCostCenter(deleteTarget.id);
      if (deleteTarget.tab === 'currencies') await financeSetupApi.deleteCurrency(deleteTarget.id);
      if (deleteTarget.tab === 'policies') await financeSetupApi.deleteGlPolicy(deleteTarget.id);
      toast.success('Setup Record Deleted', `"${deleteTarget.label}" removed.`);
      setDeleteTarget(null);
      await loadAll();
    } catch (err) {
      toast.error('Delete Failed', extractApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  const q = search.trim().toLowerCase();
  const filteredGroups = useMemo(
    () =>
      groups.filter(
        (g) =>
          !q ||
          g.code.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.categoryType.toLowerCase().includes(q),
      ),
    [groups, q],
  );
  const filteredCategories = useMemo(
    () =>
      categories.filter(
        (c) => !q || c.descriptions.toLowerCase().includes(q) || c.accountGroupName.toLowerCase().includes(q),
      ),
    [categories, q],
  );
  const filteredTypes = useMemo(
    () =>
      types.filter(
        (t) =>
          !q ||
          t.description.toLowerCase().includes(q) ||
          t.accountCategoryName.toLowerCase().includes(q) ||
          (t.subCaptionName ?? '').toLowerCase().includes(q),
      ),
    [types, q],
  );
  const filteredCostCenters = useMemo(
    () =>
      costCenters.filter(
        (cc) =>
          !q ||
          cc.code.toLowerCase().includes(q) ||
          cc.department.toLowerCase().includes(q) ||
          cc.managerName.toLowerCase().includes(q) ||
          cc.branchCode.toLowerCase().includes(q),
      ),
    [costCenters, q],
  );
  const filteredCurrencies = useMemo(
    () =>
      currencies.filter(
        (cur) => !q || cur.currCode.toLowerCase().includes(q) || cur.currName.toLowerCase().includes(q),
      ),
    [currencies, q],
  );

  const tabs: { key: TabKey; label: string; count: number; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'groups', label: 'Account Groups', count: groups.length, icon: FolderKanban },
    { key: 'categories', label: 'Account Categories', count: categories.length, icon: FolderKanban },
    { key: 'types', label: 'Account Types', count: types.length, icon: SlidersHorizontal },
    { key: 'costCenters', label: 'Cost Centers', count: costCenters.length, icon: Settings },
    { key: 'currencies', label: 'Currencies', count: currencies.length, icon: Coins },
    { key: 'policies', label: 'GL Policies', count: policies.length, icon: ShieldCheck },
  ];

  const createLabel: Record<TabKey, string> = {
    groups: 'New Account Group',
    categories: 'New Category',
    types: 'New Account Type',
    costCenters: 'New Cost Center',
    currencies: 'New Currency',
    policies: 'New GL Policy',
  };

  return (
    <div className="space-y-5">
      {/* Tabs & Action Strip */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  activeTab === tab.key
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                <span className="rounded-md bg-slate-200/80 px-1.5 py-0.5 text-[10px] text-slate-700">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter records..."
              className="w-full rounded-xl border border-slate-300 py-1.5 pl-8 pr-3 text-xs focus:border-slate-900 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadAll()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Plus className="h-3.5 w-3.5" />
              {createLabel[activeTab]}
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : activeTab === 'groups' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold">Category Type</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGroups.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{g.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{g.description}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                        {g.categoryType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={g.isActive} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDateOnly(g.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit('groups', g)}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ tab: 'groups', id: g.id, label: `${g.code} — ${g.description}` })}
                          className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'categories' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Category Description</th>
                  <th className="px-4 py-3 font-semibold">Parent Account Group</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium text-slate-900">{c.descriptions}</td>
                    <td className="px-4 py-3 text-slate-700">{c.accountGroupName}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.isActive} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit('categories', c)}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ tab: 'categories', id: c.id, label: c.descriptions })}
                          className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'types' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Account Type Description</th>
                  <th className="px-4 py-3 font-semibold">Account Category</th>
                  <th className="px-4 py-3 font-semibold">Linked Sub Caption</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTypes.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium text-slate-900">{t.description}</td>
                    <td className="px-4 py-3 text-slate-700">{t.accountCategoryName}</td>
                    <td className="px-4 py-3 text-slate-600">{t.subCaptionName || '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.active} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit('types', t)}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ tab: 'types', id: t.id, label: t.description })}
                          className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'costCenters' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Department</th>
                  <th className="px-4 py-3 font-semibold">Branch Code</th>
                  <th className="px-4 py-3 font-semibold">Cost Center Manager</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCostCenters.map((cc) => (
                  <tr key={cc.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{cc.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{cc.department}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{cc.branchCode}</td>
                    <td className="px-4 py-3 text-slate-700">{cc.managerName}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={cc.isActive} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit('costCenters', cc)}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({ tab: 'costCenters', id: cc.id, label: `${cc.code} — ${cc.department}` })
                          }
                          className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'currencies' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Currency Name</th>
                  <th className="px-4 py-3 font-semibold">Symbol</th>
                  <th className="px-4 py-3 text-right font-semibold">Rate to NGN</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCurrencies.map((cur) => (
                  <tr key={cur.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{cur.currCode}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{cur.currName}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{cur.currSymbol}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900">
                      {cur.exchangeRateToNgn.toFixed(4)}
                    </td>
                    <td className="px-4 py-3">
                      {cur.isBaseCurrency ? <StatusBadge status="Base" /> : <span className="text-slate-500">Foreign FX</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={cur.isActive} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit('currencies', cur)}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({
                              tab: 'currencies',
                              id: cur.id,
                              label: `${cur.currCode} — ${cur.currName}`,
                            })
                          }
                          className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* GL Policies Cards */
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
            {policies.length === 0 ? (
              <p className="col-span-full py-10 text-center text-xs text-slate-500">No GL governance policies found.</p>
            ) : (
              policies.map((p) => (
                <div key={p.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">GL Policy #{p.id}</h4>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Account Structure: {p.companyCodeLength} (Coy) + {p.branchCodeLength} (Br) +{' '}
                        {p.productCodeLength} (Prod) + {p.currencyCodeLength} (Ccy) = {p.glLength} chars
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit('policies', p)}
                        className="rounded-lg border border-slate-300 bg-white p-1.5 text-slate-600 hover:bg-slate-100"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ tab: 'policies', id: p.id, label: `GL Policy #${p.id}` })}
                        className="rounded-lg border border-rose-200 bg-white p-1.5 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                      <p className="text-[11px] text-slate-500">Balanced Posting</p>
                      <div className="mt-1">
                        <StatusBadge status={p.enforceBalancedPosting} trueLabel="Enforced" falseLabel="Disabled" />
                      </div>
                    </div>
                    <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                      <p className="text-[11px] text-slate-500">Maker-Checker</p>
                      <div className="mt-1">
                        <StatusBadge status={p.requireMakerChecker} trueLabel="Required" falseLabel="Optional" />
                      </div>
                    </div>
                    <div className="col-span-2 rounded-xl bg-white p-3 ring-1 ring-slate-200">
                      <p className="text-[11px] text-slate-500">Maker-Checker Approval Threshold</p>
                      <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                        {formatCurrency(p.makerCheckerThreshold)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Shared Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        title={editingId ? 'Edit Finance Setup Record' : createLabel[activeTab]}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {activeTab === 'groups' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Group Code *</label>
                  <input
                    type="text"
                    required
                    value={groupForm.code}
                    onChange={(e) => setGroupForm({ ...groupForm, code: e.target.value })}
                    placeholder="100"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Category Type *</label>
                  <select
                    value={groupForm.categoryType}
                    onChange={(e) => setGroupForm({ ...groupForm, categoryType: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  >
                    {CATEGORY_TYPES.map((ct) => (
                      <option key={ct} value={ct}>
                        {ct}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Description *</label>
                <input
                  type="text"
                  required
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  placeholder="Liquid Assets"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={groupForm.isActive}
                  onChange={(e) => setGroupForm({ ...groupForm, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Active
              </label>
            </>
          )}

          {activeTab === 'categories' && (
            <>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Description *</label>
                <input
                  type="text"
                  required
                  value={catForm.descriptions}
                  onChange={(e) => setCatForm({ ...catForm, descriptions: e.target.value })}
                  placeholder="Cash & Bank Balances"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Account Group *</label>
                <select
                  required
                  value={catForm.accountGroupId}
                  onChange={(e) => setCatForm({ ...catForm, accountGroupId: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                >
                  <option value={0} disabled>
                    Select group...
                  </option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.code} — {g.description} ({g.categoryType})
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={catForm.isActive}
                  onChange={(e) => setCatForm({ ...catForm, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Active
              </label>
            </>
          )}

          {activeTab === 'types' && (
            <>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Account Type Description *</label>
                <input
                  type="text"
                  required
                  value={typeForm.description}
                  onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                  placeholder="Nostro Settlement GL"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Account Category *</label>
                <select
                  required
                  value={typeForm.accountCategoryId}
                  onChange={(e) => setTypeForm({ ...typeForm, accountCategoryId: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                >
                  <option value={0} disabled>
                    Select category...
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.descriptions} ({c.accountGroupName})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Sub Caption (Optional)</label>
                <select
                  value={typeForm.subCaptionId ?? ''}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, subCaptionId: e.target.value ? Number(e.target.value) : null })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                >
                  <option value="">None</option>
                  {subCaptions.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.code} — {sc.accountSubName}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={typeForm.active}
                  onChange={(e) => setTypeForm({ ...typeForm, active: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Active
              </label>
            </>
          )}

          {activeTab === 'costCenters' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Cost Center Code *</label>
                  <input
                    type="text"
                    required
                    value={ccForm.code}
                    onChange={(e) => setCcForm({ ...ccForm, code: e.target.value })}
                    placeholder="CC001"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Branch Code *</label>
                  <input
                    type="text"
                    required
                    value={ccForm.branchCode}
                    onChange={(e) => setCcForm({ ...ccForm, branchCode: e.target.value })}
                    placeholder="BR001"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Department *</label>
                <input
                  type="text"
                  required
                  value={ccForm.department}
                  onChange={(e) => setCcForm({ ...ccForm, department: e.target.value })}
                  placeholder="Treasury & Liquidity Operations"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Manager Name</label>
                <input
                  type="text"
                  value={ccForm.managerName}
                  onChange={(e) => setCcForm({ ...ccForm, managerName: e.target.value })}
                  placeholder="Chinedu Eze"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={ccForm.isActive}
                  onChange={(e) => setCcForm({ ...ccForm, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Active
              </label>
            </>
          )}

          {activeTab === 'currencies' && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">ISO Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={currForm.currCode}
                    onChange={(e) => setCurrForm({ ...currForm, currCode: e.target.value.toUpperCase() })}
                    placeholder="USD"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Symbol *</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={currForm.currSymbol}
                    onChange={(e) => setCurrForm({ ...currForm, currSymbol: e.target.value })}
                    placeholder="$"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Rate to NGN *</label>
                  <input
                    type="number"
                    required
                    step="0.0001"
                    min="0.0001"
                    value={currForm.exchangeRateToNgn}
                    onChange={(e) => setCurrForm({ ...currForm, exchangeRateToNgn: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Currency Name *</label>
                <input
                  type="text"
                  required
                  value={currForm.currName}
                  onChange={(e) => setCurrForm({ ...currForm, currName: e.target.value })}
                  placeholder="US Dollar"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={currForm.isBaseCurrency}
                    onChange={(e) => setCurrForm({ ...currForm, isBaseCurrency: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Base Reporting Currency
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={currForm.isActive}
                    onChange={(e) => setCurrForm({ ...currForm, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Active
                </label>
              </div>
            </>
          )}

          {activeTab === 'policies' && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Total GL Length</label>
                  <input
                    type="number"
                    min={4}
                    max={30}
                    value={policyForm.glLength}
                    onChange={(e) => setPolicyForm({ ...policyForm, glLength: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Company Code Len</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={policyForm.companyCodeLength}
                    onChange={(e) => setPolicyForm({ ...policyForm, companyCodeLength: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Branch Code Len</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={policyForm.branchCodeLength}
                    onChange={(e) => setPolicyForm({ ...policyForm, branchCodeLength: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Product Code Len</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={policyForm.productCodeLength}
                    onChange={(e) => setPolicyForm({ ...policyForm, productCodeLength: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Currency Code Len</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={policyForm.currencyCodeLength}
                    onChange={(e) => setPolicyForm({ ...policyForm, currencyCodeLength: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Threshold (NGN)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={policyForm.makerCheckerThreshold}
                    onChange={(e) => setPolicyForm({ ...policyForm, makerCheckerThreshold: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={policyForm.enforceBalancedPosting}
                    onChange={(e) => setPolicyForm({ ...policyForm, enforceBalancedPosting: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Enforce Balanced Double-Entry Posting (Debits == Credits)
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={policyForm.requireMakerChecker}
                    onChange={(e) => setPolicyForm({ ...policyForm, requireMakerChecker: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Require Dual-Control Maker-Checker Authorization
                </label>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2.5 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
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
              {editingId ? 'Save Changes' : 'Create Record'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        variant="danger"
        title="Confirm Setup Deletion"
        message={`Are you sure you want to delete "${deleteTarget?.label}"?`}
        confirmLabel="Delete Record"
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
