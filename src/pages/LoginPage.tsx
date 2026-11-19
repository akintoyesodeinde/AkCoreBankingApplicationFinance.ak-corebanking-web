import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Landmark,
  Loader2,
  Lock,
  ShieldCheck,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { extractApiError } from '../utils/format';

interface DemoAccount {
  label: string;
  badge: string;
  usernameOrEmail: string;
  password: string;
  note: string;
  accent: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: 'Finance Admin',
    badge: 'Full System Access',
    usernameOrEmail: 'admin@akcorebanking.com',
    password: 'AkBank@2026!',
    note: 'Setup, Chart of Accounts, Dual Control',
    accent: 'border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-950',
  },
  {
    label: 'Maker (Teller)',
    badge: 'tayo.olawumi',
    usernameOrEmail: 'maker@akcorebanking.com',
    password: 'AkBank@2026!',
    note: 'Initiates Transfers, Uploads, Reversals',
    accent: 'border-sky-200 bg-sky-50/70 hover:bg-sky-100/80 text-sky-950',
  },
  {
    label: 'Checker (Supervisor)',
    badge: 'supervisor.ak',
    usernameOrEmail: 'checker@akcorebanking.com',
    password: 'AkBank@2026!',
    note: 'Approves / Rejects Pending Operations',
    accent: 'border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-950',
  },
];

export const LoginPage: React.FC = () => {
  const { isAuthenticated, login, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState('');

  // Register state
  const [regForm, setRegForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'TellerMaker',
    branchCode: 'BR001',
    department: 'Finance & Treasury',
  });

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const executeLogin = async (credUsername: string, credPassword: string, demoLabel?: string) => {
    setErrorBanner('');
    setIsSubmitting(true);
    if (demoLabel) setActiveDemo(demoLabel);
    try {
      const profile = await login({ usernameOrEmail: credUsername, password: credPassword });
      toast.success('Welcome to Ak Core Banking', `Signed in as ${profile.fullName} (${profile.role})`);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = extractApiError(err, 'Invalid credentials. Please verify username/email and password.');
      setErrorBanner(msg);
      toast.error('Authentication Failed', msg);
    } finally {
      setIsSubmitting(false);
      setActiveDemo(null);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password) {
      setErrorBanner('Please enter both your username/email and password.');
      return;
    }
    await executeLogin(usernameOrEmail.trim(), password);
  };

  const handleDemoClick = async (demo: DemoAccount) => {
    setMode('login');
    setUsernameOrEmail(demo.usernameOrEmail);
    setPassword(demo.password);
    await executeLogin(demo.usernameOrEmail, demo.password, demo.label);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner('');
    setIsSubmitting(true);
    try {
      const profile = await register(regForm);
      toast.success('Account Provisioned', `Welcome ${profile.fullName} (${profile.role})`);
      navigate('/', { replace: true });
    } catch (err) {
      const msg = extractApiError(err, 'Unable to complete operator registration.');
      setErrorBanner(msg);
      toast.error('Registration Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 lg:flex-row">
      {/* Left Enterprise Brand Panel */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#070E1C] via-[#0D1A33] to-[#0B252B] px-8 py-10 text-slate-200 lg:w-[46%] lg:px-14 lg:py-14">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 shadow-lg">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-white">Ak Core Banking Application</p>
              <p className="text-[11px] font-medium text-emerald-400">Ak Core Banking · Enterprise Finance Core</p>
            </div>
          </div>

          <h2 className="mt-10 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            Precision General Ledger &amp; Dual-Control Treasury Operations.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-300">
            Unified CASA &amp; GL accounting workspace engineered for balanced double-entry postings,
            strict Maker-Checker segregation of duties, idempotent fund transfers, and real-time audit telemetry.
          </p>

          <div className="mt-8 grid gap-3.5 sm:grid-cols-2">
            {[
              {
                title: 'Balanced Double-Entry',
                desc: 'Every approved transfer posts balanced debit/credit journal lines.',
              },
              {
                title: 'Maker-Checker Security',
                desc: 'Segregation of duties prevents makers from approving their own entries.',
              },
              {
                title: 'Idempotent Transfers',
                desc: 'Unique UUID idempotency keys guard against duplicate postings.',
              },
              {
                title: 'Full Audit Trail',
                desc: 'Immutable compliance log across setup, journals, bulk batches & reversals.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {item.title}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-5 text-xs text-slate-400">
          <span>&copy; {new Date().getFullYear()} Ak Core Banking</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            TLS / JWT Bearer Protected
          </span>
        </div>
      </div>

      {/* Right Auth Panel */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 px-6 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-8">
            {/* Mode Switch */}
            <div className="flex items-center justify-between gap-2">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {mode === 'login' ? 'Operator Sign In' : 'Provision Operator'}
                </h1>
                <p className="mt-1 text-xs text-slate-500">
                  {mode === 'login'
                    ? 'Authenticate to access Ak Core Banking Finance Workspace.'
                    : 'Register a new Finance operator profile with role assignment.'}
                </p>
              </div>
              <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorBanner('');
                  }}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorBanner('');
                  }}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {errorBanner && (
              <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
                {errorBanner}
              </div>
            )}

            {mode === 'login' ? (
              <>
                <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Username or Email
                    </label>
                    <div className="relative">
                      <UserCheck className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        autoComplete="username"
                        value={usernameOrEmail}
                        onChange={(e) => setUsernameOrEmail(e.target.value)}
                        placeholder="e.g. admin@akcorebanking.com"
                        className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Password</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-2.5 top-2 rounded-lg p-1 text-slate-400 hover:text-slate-700"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {isSubmitting && !activeDemo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="h-4 w-4" />
                    )}
                    Sign In to Ak Core Banking
                  </button>
                </form>

                {/* Quick Demo Login Buttons */}
                <div className="mt-7 border-t border-slate-200 pt-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Quick Demo Login (One-Click)
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">AkBank@2026!</span>
                  </div>
                  <div className="space-y-2.5">
                    {DEMO_ACCOUNTS.map((demo) => {
                      const loadingThis = isSubmitting && activeDemo === demo.label;
                      return (
                        <button
                          key={demo.label}
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => void handleDemoClick(demo)}
                          className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition disabled:opacity-60 ${demo.accent}`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold">{demo.label}</span>
                              <span className="rounded-md bg-white/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                                {demo.badge}
                              </span>
                            </div>
                            <p className="mt-0.5 truncate text-[11px] opacity-80">
                              {demo.usernameOrEmail} · {demo.note}
                            </p>
                          </div>
                          {loadingThis ? (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                          ) : (
                            <span className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-800 shadow-xs">
                              Sign In
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="mt-6 space-y-3.5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Full Name</label>
                    <input
                      type="text"
                      required
                      value={regForm.fullName}
                      onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                      placeholder="Adaeze Okafor"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Username</label>
                    <input
                      type="text"
                      required
                      value={regForm.username}
                      onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                      placeholder="adaeze.okafor"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Corporate Email</label>
                  <input
                    type="email"
                    required
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="adaeze@akcorebanking.com"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Role</label>
                    <select
                      value={regForm.role}
                      onChange={(e) => setRegForm({ ...regForm, role: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    >
                      <option value="TellerMaker">TellerMaker</option>
                      <option value="SupervisorChecker">SupervisorChecker</option>
                      <option value="FinanceAdmin">FinanceAdmin</option>
                      <option value="Auditor">Auditor</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Branch Code</label>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={regForm.branchCode}
                        onChange={(e) => setRegForm({ ...regForm, branchCode: e.target.value })}
                        placeholder="BR001"
                        className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Department</label>
                  <input
                    type="text"
                    required
                    value={regForm.department}
                    onChange={(e) => setRegForm({ ...regForm, department: e.target.value })}
                    placeholder="Finance & Treasury"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    placeholder="Minimum 8 characters"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Create Operator &amp; Sign In
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
