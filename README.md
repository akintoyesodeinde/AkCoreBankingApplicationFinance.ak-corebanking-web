# Ak Core Banking Application — Finance Web SPA (`ak-corebanking-web`)

Standalone **React 19 + TypeScript 5 + Vite + Tailwind CSS 4** Single-Page Application for **Ak Core Banking Application — Enterprise Finance & General Ledger**.

## Features & Modules

- **JWT Authentication & RBAC Session Management** (`TellerMaker`, `SupervisorChecker`, `FinanceAdmin`)
- **Executive & Operations Dashboard** — Live Trial Balance parity indicator, total debits/credits, pending 4-eyes queue, and recent double-entry journal postings
- **Finance Setup** — Account Groups, Account Categories, Account Types, Cost Centers, Currencies, and GL Policies
- **Chart of Accounts** — GL accounts, Default Accounts, and Central Bank / NIBSS Settlement GL Mappings
- **Financial Statement Captions** — Balance Sheet & Income Statement Main Captions and Sub-Captions
- **Fund Transfers & 4-Eyes Approval Queue** — Single Transfers, Multiple Split Transfers, `Idempotency-Key` protection, and strict Maker-Checker approval/rejection workflows
- **Bulk CSV / Excel Schedule Upload** — Template download, row-by-row account validation, and atomic batch settlement
- **Contra-Entry Reversals** — Immutable contra-entry reversal initiation and supervisor authorization
- **Double-Entry Journals & Audit Trail** — Balanced debit/credit journal lines and full security audit logs

## Quick Start

### Local Development
```bash
npm install
npm run dev
```
- **Dev Server:** `http://localhost:5173` (proxies `/api` and `/health` to `http://localhost:5080`)

### Production Build
```bash
npm run build
```

### Docker Container (Nginx 1.27 Alpine)
```bash
docker build -t ak-corebanking-web:latest .
```
- **Container URL:** `http://localhost:3080`
