import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, Layers, Loader2, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { captionsApi, financeSetupApi } from '../services/endpoints';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { StatusBadge } from '../components/StatusBadge';
import { extractApiError } from '../utils/format';
import type {
  AccountCategoryDto,
  CurrencyDto,
  MainCaptionDto,
  SubCaptionDto,
  UpsertMainCaptionRequest,
  UpsertSubCaptionRequest,
} from '../types/banking';

type TabKey = 'main' | 'sub';

const STATEMENT_TYPES = ['Balance Sheet', 'Income Statement', 'Off-Balance Sheet', 'Cash Flow'];

export const CaptionsPage: React.FC = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('main');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [mainCaptions, setMainCaptions] = useState<MainCaptionDto[]>([]);
  const [subCaptions, setSubCaptions] = useState<SubCaptionDto[]>([]);
  const [categories, setCategories] = useState<AccountCategoryDto[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyDto[]>([]);

  // Main Caption modal
  const [mainModalOpen, setMainModalOpen] = useState(false);
  const [editingMain, setEditingMain] = useState<MainCaptionDto | null>(null);
  const [mainForm, setMainForm] = useState<UpsertMainCaptionRequest>({
    code: '',
    description: '',
    accountCategoryId: 0,
    statementType: 'Balance Sheet',
    displayOrder: 1,
    isActive: true,
  });

  // Sub Caption modal
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubCaptionDto | null>(null);
  const [subForm, setSubForm] = useState<UpsertSubCaptionRequest>({
    code: '',
    accountSubName: '',
    mainCaptionId: 0,
    currency: 'NGN',
    accountStatus: 'Active',
    isActive: true,
  });

  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    kind: TabKey;
    id: number;
    label: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [mainRes, subRes, catRes, curRes] = await Promise.all([
        captionsApi.getMainCaptions(),
        captionsApi.getSubCaptions(),
        financeSetupApi.getAccountCategories(),
        financeSetupApi.getCurrencies(),
      ]);
      setMainCaptions(mainRes);
      setSubCaptions(subRes);
      setCategories(catRes);
      setCurrencies(curRes);
    } catch (err) {
      toast.error('Failed to Load Captions', extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const filteredMain = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mainCaptions;
    return mainCaptions.filter(
      (m) =>
        m.code.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.accountCategoryName.toLowerCase().includes(q) ||
        m.statementType.toLowerCase().includes(q),
    );
  }, [mainCaptions, search]);

  const filteredSub = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subCaptions;
    return subCaptions.filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        s.accountSubName.toLowerCase().includes(q) ||
        s.mainCaptionName.toLowerCase().includes(q) ||
        s.currency.toLowerCase().includes(q),
    );
  }, [subCaptions, search]);

  const openCreateMain = () => {
    setEditingMain(null);
    setMainForm({
      code: '',
      description: '',
      accountCategoryId: categories[0]?.id ?? 0,
      statementType: 'Balance Sheet',
      displayOrder: mainCaptions.length + 1,
      isActive: true,
    });
    setMainModalOpen(true);
  };

  const openEditMain = (item: MainCaptionDto) => {
    setEditingMain(item);
    setMainForm({
      code: item.code,
      description: item.description,
      accountCategoryId: item.accountCategoryId,
      statementType: item.statementType,
      displayOrder: item.displayOrder,
      isActive: item.isActive,
    });
    setMainModalOpen(true);
  };

  const handleSaveMain = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingMain) {
        await captionsApi.updateMainCaption(editingMain.id, mainForm);
        toast.success('Main Caption Updated', `${mainForm.code} — ${mainForm.description}`);
      } else {
        await captionsApi.createMainCaption(mainForm);
        toast.success('Main Caption Created', `${mainForm.code} — ${mainForm.description}`);
      }
      setMainModalOpen(false);
      await loadAll();
    } catch (err) {
      toast.error('Failed to Save Main Caption', extractApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const openCreateSub = () => {
    setEditingSub(null);
    setSubForm({
      code: '',
      accountSubName: '',
      mainCaptionId: mainCaptions[0]?.id ?? 0,
      currency: currencies.find((c) => c.isBaseCurrency)?.currCode ?? currencies[0]?.currCode ?? 'NGN',
      accountStatus: 'Active',
      isActive: true,
    });
    setSubModalOpen(true);
  };

  const openEditSub = (item: SubCaptionDto) => {
    setEditingSub(item);
    setSubForm({
      code: item.code,
      accountSubName: item.accountSubName,
      mainCaptionId: item.mainCaptionId,
      currency: item.currency,
      accountStatus: item.accountStatus,
      isActive: item.isActive,
    });
    setSubModalOpen(true);
  };

  const handleSaveSub = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingSub) {
        await captionsApi.updateSubCaption(editingSub.id, subForm);
        toast.success('Sub Caption Updated', `${subForm.code} — ${subForm.accountSubName}`);
      } else {
        await captionsApi.createSubCaption(subForm);
        toast.success('Sub Caption Created', `${subForm.code} — ${subForm.accountSubName}`);
      }
      setSubModalOpen(false);
      await loadAll();
    } catch (err) {
      toast.error('Failed to Save Sub Caption', extractApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.kind === 'main') {
        await captionsApi.deleteMainCaption(deleteTarget.id);
      } else {
        await captionsApi.deleteSubCaption(deleteTarget.id);
      }
      toast.success('Caption Deleted', `"${deleteTarget.label}" has been removed.`);
      setDeleteTarget(null);
      await loadAll();
    } catch (err) {
      toast.error('Delete Failed', extractApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Tabs */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('main')}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'main' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Main Captions ({mainCaptions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sub')}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'sub' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sub Captions ({subCaptions.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-64 sm:flex-initial">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter captions..."
              className="w-full rounded-xl border border-slate-300 py-1.5 pl-8 pr-3 text-xs focus:border-slate-900 focus:outline-none"
            />
          </div>
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
            onClick={activeTab === 'main' ? openCreateMain : openCreateSub}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5" />
            {activeTab === 'main' ? 'New Main Caption' : 'New Sub Caption'}
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : activeTab === 'main' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold">Account Category</th>
                  <th className="px-4 py-3 font-semibold">Statement Type</th>
                  <th className="px-4 py-3 text-center font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMain.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      <Layers className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                      No main captions found.
                    </td>
                  </tr>
                ) : (
                  filteredMain.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900">{row.code}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{row.description}</td>
                      <td className="px-4 py-3 text-slate-600">{row.accountCategoryName}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                          {row.statementType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums text-slate-600">{row.displayOrder}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.isActive} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditMain(row)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            title="Edit Main Caption"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({ kind: 'main', id: row.id, label: `${row.code} (${row.description})` })
                            }
                            className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                            title="Delete Main Caption"
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Sub Caption Name</th>
                  <th className="px-4 py-3 font-semibold">Main Caption</th>
                  <th className="px-4 py-3 font-semibold">Currency</th>
                  <th className="px-4 py-3 font-semibold">Account Status</th>
                  <th className="px-4 py-3 font-semibold">Active</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSub.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      <Layers className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                      No sub captions found.
                    </td>
                  </tr>
                ) : (
                  filteredSub.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900">{row.code}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{row.accountSubName}</td>
                      <td className="px-4 py-3 text-slate-600">{row.mainCaptionName}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">{row.currency}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.accountStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.isActive} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditSub(row)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            title="Edit Sub Caption"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({
                                kind: 'sub',
                                id: row.id,
                                label: `${row.code} (${row.accountSubName})`,
                              })
                            }
                            className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                            title="Delete Sub Caption"
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

      {/* Main Caption Modal */}
      <Modal
        isOpen={mainModalOpen}
        title={editingMain ? 'Edit Main Caption' : 'Create Main Caption'}
        subtitle="Maps financial reporting lines to account categories"
        onClose={() => setMainModalOpen(false)}
      >
        <form onSubmit={handleSaveMain} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Caption Code *</label>
              <input
                type="text"
                required
                value={mainForm.code}
                onChange={(e) => setMainForm({ ...mainForm, code: e.target.value })}
                placeholder="MC-100"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Display Order *</label>
              <input
                type="number"
                required
                min={1}
                value={mainForm.displayOrder}
                onChange={(e) => setMainForm({ ...mainForm, displayOrder: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Description *</label>
            <input
              type="text"
              required
              value={mainForm.description}
              onChange={(e) => setMainForm({ ...mainForm, description: e.target.value })}
              placeholder="Cash and Balances with Central Bank"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Account Category *</label>
              <select
                required
                value={mainForm.accountCategoryId}
                onChange={(e) => setMainForm({ ...mainForm, accountCategoryId: Number(e.target.value) })}
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
              <label className="mb-1 block text-xs font-semibold text-slate-700">Statement Type *</label>
              <select
                value={mainForm.statementType}
                onChange={(e) => setMainForm({ ...mainForm, statementType: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              >
                {STATEMENT_TYPES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={mainForm.isActive}
              onChange={(e) => setMainForm({ ...mainForm, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Caption is Active for Financial Statements
          </label>

          <div className="flex justify-end gap-2.5 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setMainModalOpen(false)}
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
              {editingMain ? 'Save Changes' : 'Create Main Caption'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Sub Caption Modal */}
      <Modal
        isOpen={subModalOpen}
        title={editingSub ? 'Edit Sub Caption' : 'Create Sub Caption'}
        subtitle="Granular line items linked to Main Captions"
        onClose={() => setSubModalOpen(false)}
      >
        <form onSubmit={handleSaveSub} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Sub Caption Code *</label>
              <input
                type="text"
                required
                value={subForm.code}
                onChange={(e) => setSubForm({ ...subForm, code: e.target.value })}
                placeholder="SC-101"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Currency *</label>
              <select
                value={subForm.currency}
                onChange={(e) => setSubForm({ ...subForm, currency: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              >
                {currencies.length === 0 ? (
                  <option value="NGN">NGN</option>
                ) : (
                  currencies.map((cur) => (
                    <option key={cur.id} value={cur.currCode}>
                      {cur.currCode} — {cur.currName}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Sub Caption Name *</label>
            <input
              type="text"
              required
              value={subForm.accountSubName}
              onChange={(e) => setSubForm({ ...subForm, accountSubName: e.target.value })}
              placeholder="Vault Cash & Teller Tills"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Main Caption *</label>
              <select
                required
                value={subForm.mainCaptionId}
                onChange={(e) => setSubForm({ ...subForm, mainCaptionId: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              >
                <option value={0} disabled>
                  Select main caption...
                </option>
                {mainCaptions.map((mc) => (
                  <option key={mc.id} value={mc.id}>
                    {mc.code} — {mc.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Account Status *</label>
              <select
                value={subForm.accountStatus}
                onChange={(e) => setSubForm({ ...subForm, accountStatus: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Frozen">Frozen</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={subForm.isActive}
              onChange={(e) => setSubForm({ ...subForm, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Sub Caption Active
          </label>

          <div className="flex justify-end gap-2.5 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setSubModalOpen(false)}
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
              {editingSub ? 'Save Changes' : 'Create Sub Caption'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        variant="danger"
        title="Confirm Caption Deletion"
        message={`Are you sure you want to permanently remove "${deleteTarget?.label}"? This action cannot be undone.`}
        confirmLabel="Delete Caption"
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
