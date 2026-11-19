import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  BookOpen,
  Building2,
  FileSpreadsheet,
  FolderTree,
  Landmark,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  RotateCcw,
  Settings2,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from './StatusBadge';

interface NavSection {
  label: string;
  items: {
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Executive Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Operations & Payments',
    items: [
      { to: '/fund-transfers', label: 'Fund Transfers & Queue', icon: ArrowLeftRight },
      { to: '/bulk-upload', label: 'Bulk Batch Uploads', icon: FileSpreadsheet },
      { to: '/reversals', label: 'Reversals', icon: RotateCcw },
    ],
  },
  {
    label: 'General Ledger & Config',
    items: [
      { to: '/journals', label: 'Journals & Audit Logs', icon: BookOpen },
      { to: '/chart-of-accounts', label: 'Chart of Accounts', icon: FolderTree },
      { to: '/captions', label: 'Financial Captions', icon: Layers },
      { to: '/finance-setup', label: 'Finance Setup', icon: Settings2 },
    ],
  },
];

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Executive Finance Dashboard',
    subtitle: 'Real-time Trial Balance health, CASA deposits, GL exposure, and approval workload',
  },
  '/fund-transfers': {
    title: 'Fund Transfers & Maker-Checker Queue',
    subtitle: 'Execute single, split-credit, and inter-ledger transfers with dual-control enforcement',
  },
  '/bulk-upload': {
    title: 'Bulk Salary & Batch Uploads',
    subtitle: 'Validate multi-credit CSV schedules and authorize batch settlement postings',
  },
  '/reversals': {
    title: 'Transaction Reversals',
    subtitle: 'Initiate and authorize balanced contra-entry reversals for posted transfers',
  },
  '/journals': {
    title: 'Double-Entry Journals & Audit Trail',
    subtitle: 'Inspect immutable balanced ledger postings and system-wide compliance telemetry',
  },
  '/chart-of-accounts': {
    title: 'Chart of Accounts & CASA View',
    subtitle: 'Manage GL accounts, customer CASA balances, default control accounts, and bank mappings',
  },
  '/captions': {
    title: 'Financial Statement Captions',
    subtitle: 'Configure Balance Sheet and Income Statement reporting lines and sub-captions',
  },
  '/finance-setup': {
    title: 'Finance Setup & Governance Policies',
    subtitle: 'Maintain account groups, categories, types, cost centers, FX currencies, and GL policies',
  },
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const meta = PAGE_META[location.pathname] ?? {
    title: 'Ak Core Banking Application',
    subtitle: 'Enterprise Finance & General Ledger Control Center',
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-[#0B1324] text-slate-300">
      {/* Brand Header */}
      <div className="flex items-center gap-3 border-b border-slate-800/90 px-5 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-950/50">
          <Landmark className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-white">Ak Core Banking</p>
          <p className="truncate text-[11px] font-medium text-emerald-400">Finance &amp; General Ledger</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
                          : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Active Operator Card */}
      <div className="border-t border-slate-800/90 p-4">
        <div className="rounded-xl bg-slate-900/90 p-3 ring-1 ring-slate-800">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">{user?.fullName || user?.username}</p>
              <p className="truncate text-[11px] text-slate-400">{user?.email}</p>
            </div>
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-300">
              {user?.role}
            </span>
            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-slate-300">
              {user?.branchCode} · {user?.companyCode}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 lg:sticky lg:top-0 lg:block lg:h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw] shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                  {meta.title}
                </h1>
                <p className="hidden truncate text-xs text-slate-500 sm:block">{meta.subtitle}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs md:flex">
                <Building2 className="h-3.5 w-3.5 text-slate-500" />
                <span className="font-medium text-slate-700">
                  {user?.branchName || 'Head Office'} ({user?.branchCode || 'BR001'})
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500">{user?.department || 'Finance'}</span>
              </div>
              {user?.role && <StatusBadge status={user.role} size="md" />}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-500 sm:px-6 lg:flex lg:items-center lg:justify-between lg:px-8 lg:text-left">
          <span>&copy; {new Date().getFullYear()} Ak Core Banking. Ak Core Banking Application.</span>
          <span className="mt-1 block lg:mt-0">
            Double-Entry Core Ledger &middot; Maker-Checker Segregation of Duties Enabled
          </span>
        </footer>
      </div>
    </div>
  );
};
