import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/AppShell';

const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const FinanceSetupPage = lazy(() =>
  import('./pages/FinanceSetupPage').then((m) => ({ default: m.FinanceSetupPage })),
);
const ChartOfAccountsPage = lazy(() =>
  import('./pages/ChartOfAccountsPage').then((m) => ({ default: m.ChartOfAccountsPage })),
);
const CaptionsPage = lazy(() => import('./pages/CaptionsPage').then((m) => ({ default: m.CaptionsPage })));
const FundTransfersPage = lazy(() =>
  import('./pages/FundTransfersPage').then((m) => ({ default: m.FundTransfersPage })),
);
const BulkUploadPage = lazy(() => import('./pages/BulkUploadPage').then((m) => ({ default: m.BulkUploadPage })));
const ReversalsPage = lazy(() => import('./pages/ReversalsPage').then((m) => ({ default: m.ReversalsPage })));
const JournalsPage = lazy(() => import('./pages/JournalsPage').then((m) => ({ default: m.JournalsPage })));

const RouteFallback: React.FC = () => (
  <div className="flex h-64 items-center justify-center">
    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
  </div>
);

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <DashboardPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance-setup"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <FinanceSetupPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chart-of-accounts"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <ChartOfAccountsPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/captions"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <CaptionsPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fund-transfers"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <FundTransfersPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bulk-upload"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <BulkUploadPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reversals"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <ReversalsPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/journals"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <JournalsPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
