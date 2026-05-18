# Arth — Implementation Plan

**Version:** 2.0
**Date:** 2026-05-18
**PRD Reference:** [docs/PRD.md](./PRD.md)

### Progress Summary

| Stage | Status | Completion |
|-------|--------|------------|
| 1. Project Setup & Tooling | ✅ Complete | 7/7 |
| 2. Database Layer | ✅ Complete | 11/11 |
| 3. IndexedDB Persistence | ✅ Complete | 4/4 |
| 4. Google Drive Sync (engine) | ✅ Complete | 7/7 (4.1 deferred to deploy) |
| 5. UI Shell | ✅ Complete | 8/8 |
| 6. Settings | ✅ Complete | 6/6 |
| 7. Transactions | ✅ Complete | 9/9 |
| 8. Home Dashboard | ✅ Complete | 5/5 |
| 9. Balance Sheet | ✅ Complete | 6/6 |
| 10. Analytics | ✅ Complete | 8/9 (budget vs actual deferred) |
| 11. PWA & Deployment | ✅ Complete | 11/11 |
| 12. Testing & QA | 🟡 Partial | 3/10 |
| **14. PIN Authentication** | ✅ Complete | 6/6 |
| **15. Seed Data Cleanup** | ✅ Complete | 4/4 |
| **16. Sync UI & Google Drive Go-Live** | ✅ Complete | 8/8 |
| 13. Go-Live | ⬜ Not started | 0/4 |

**Overall: ~102/107 tasks complete.**

### What's Next (priority order)

1. ~~**Stage 14: PIN Authentication**~~ ✅ Complete
2. ~~**Stage 16: Sync UI**~~ ✅ Complete — Google Drive sync wired in, sign in/out, auto-sync
3. ~~**Stage 15: Seed Data Cleanup**~~ ✅ Complete — Seed data, CSV parser deleted; Google sign-in required; empty DB for new users
4. **Stage 12: Testing & QA** — Component tests, mobile device testing
5. **Stage 13: Go-Live** — Verify data, install PWA, start daily use

---

## Legend

| Status | Meaning |
|--------|---------|
| ⬜ | Not started |
| 🟡 | In progress |
| ✅ | Complete |
| 🔵 | Blocked |

---

## Stage 1: Project Setup & Tooling

> Foundation: development environment, build pipeline, and project structure.

| # | Task | Status | Details |
|---|------|--------|---------|
| 1.1 | Initialize React + Vite + TypeScript project | ✅ | `npm create vite@latest arth -- --template react-ts` |
| 1.2 | Install and configure Tailwind CSS | ✅ | Tailwind v4 via `@tailwindcss/vite`, configured in `vite.config.ts` + `index.css` |
| 1.3 | Set up project directory structure | ✅ | All directories created per spec |
| 1.4 | Configure ESLint + Prettier | ✅ | ESLint v9 flat config + Prettier configured |
| 1.5 | Set up path aliases | ✅ | `@/` alias in Vite config and `tsconfig.app.json` |
| 1.6 | Add PWA plugin (vite-plugin-pwa) | ✅ | Service worker generation, WASM precaching |
| 1.7 | Create app icons and manifest | ✅ | 192x192 and 512x512 icons, theme color, app name "Arth" |

### Directory Structure

```
arth/
├── public/
│   └── icons/
├── src/
│   ├── components/           # Shared/reusable UI components
│   │   ├── ui/               # Primitives (Button, Input, Card, Modal, etc.)
│   │   ├── forms/            # TransactionForm, TransferForm
│   │   └── layout/           # BottomNav, TopBar, PageContainer
│   ├── pages/                # Top-level page components
│   │   ├── Home.tsx
│   │   ├── Transactions.tsx
│   │   ├── Balance.tsx
│   │   ├── Analytics.tsx
│   │   └── Settings.tsx
│   ├── db/                   # Database layer
│   │   ├── schema.ts         # SQL CREATE TABLE statements
│   │   ├── seed.ts           # FY26-27 seed data
│   │   ├── database.ts       # sql.js initialization and wrapper
│   │   ├── queries.ts        # All SQL queries as functions
│   │   └── migrations.ts     # Future schema migrations
│   ├── sync/                 # Google Drive sync
│   │   ├── auth.ts           # Google OAuth flow
│   │   ├── drive.ts          # Google Drive API operations
│   │   └── sync-manager.ts   # Dual-layer sync orchestration
│   ├── hooks/                # Custom React hooks
│   │   ├── useDatabase.ts
│   │   ├── useSync.ts
│   │   └── useTransactions.ts
│   ├── utils/                # Pure utility functions
│   │   ├── currency.ts       # Paisa conversion, INR formatting
│   │   ├── date.ts           # Date parsing, FY helpers
│   │   └── csv-parser.ts     # CSV import (for seed)
│   ├── types/                # TypeScript type definitions
│   │   └── index.ts
│   ├── context/              # React context providers
│   │   └── DatabaseContext.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── docs/
│   ├── PRD.md
│   └── IMPLEMENTATION_PLAN.md
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Stage 2: Database Layer

> Core data engine: SQLite setup, schema, queries, and seed data.

| # | Task | Status | Details |
|---|------|--------|---------|
| 2.1 | Install and configure sql.js | ✅ | sql.js + vite-plugin-static-copy + vitest installed. WASM binary copied to public/ via postinstall script. |
| 2.2 | Create database initialization module | ✅ | `db/database.ts` — WASM loading, PRAGMA foreign_keys=ON on every open, init/close/export helpers |
| 2.3 | Define schema (CREATE TABLE statements) | ✅ | `db/schema.ts` — 6 tables (incl. schema_version), CHECK/FK/UNIQUE constraints, 6 indexes |
| 2.4 | Implement DatabaseContext provider | ✅ | Thin React context (`db`, `isLoading`, `isSeeded`) + `useDatabase` hook |
| 2.5 | Implement core query functions | ✅ | `db/queries.ts` — CRUD for all entities with parameterized queries, transfer group operations |
| 2.6 | Implement balance computation queries | ✅ | Fund×Account matrix, account totals, fund totals, lend/borrow outstanding |
| 2.7 | Implement analytics queries | ✅ | 7 queries: spend by category, monthly trend, category trend, savings rate, cashback, CC annual spend |
| 2.8 | Build currency utility functions | ✅ | `utils/currency.ts` — rupeesToPaisa(), paisaToRupees(), formatINR() with Indian comma notation, parseAmountToPaisa() |
| 2.9 | Build date utility functions | ✅ | `utils/date.ts` — parseDateDMMMYYYY(), getFYRange(), getFYLabel(), getMonthRange(), getYearRange(), toISO(), today(), nowISO() |
| 2.10 | Parse CSV and create seed data | ✅ | `db/seed.ts` — pre-parsed TypeScript arrays (200 transactions, 8 accounts, 7 funds, 23 categories, 51 sub-categories). CSV parser retained as dev-time utility. |
| 2.11 | Write unit tests for database layer | ✅ | 111 tests across 6 files: schema, queries, seed, currency, date, csv-parser |

### Transfer Pair Detection Logic (for seed)

```
For consecutive rows in CSV:
  If row[i] and row[i+1] have:
    - Same date
    - Same amount
    - One is Debit, other is Credit
    - Category is Transfer, Expense, or Savings (paired allocation categories)
  Then:
    - Assign same transfer_id (UUID) to both rows
    - Check if row[i+2] and row[i+3] also form a pair with same date+amount
      → if so, assign same transfer_id (4-row transfer group)
    - Advance index past the paired rows
```

---

## Stage 3: IndexedDB Persistence

> Local persistence layer: survive browser tabs closing.

| # | Task | Status | Details |
|---|------|--------|---------|
| 3.1 | Implement IndexedDB save/load | ✅ | `db/persistence.ts` — single-record schema (`persistence/main`), `saveDatabase()`, `loadDatabase()`, `getLastModified()`. ~60 lines, raw IndexedDB API. |
| 3.2 | Auto-save on every DB mutation | ✅ | `persistDatabase()` exposed via DatabaseContext/useDatabase hook. Callers invoke after mutations. |
| 3.3 | Track local version timestamp | ✅ | `lastModified` ISO timestamp stored atomically with DB in same IndexedDB record. Exposed in context. |
| 3.4 | Write tests for persistence | ✅ | 9 tests in `persistence.test.ts` using `fake-indexeddb`: null states, round-trip, overwrite, timestamps, sql.js export/restore. 120 total tests pass. |

---

## Stage 4: Google Drive Sync

> Cloud sync: Google OAuth + Drive API file operations.

| # | Task | Status | Details |
|---|------|--------|---------|
| 4.1 | Set up Google Cloud project | ✅ | Project "Arth" created, Drive API enabled, OAuth consent (Testing mode), Client ID created. Done in Stage 16.1. |
| 4.2 | Implement Google OAuth flow | ✅ | `sync/auth.ts` — `GoogleAuth` class wrapping GIS Token Model. Sign in, token management (memory-only), sign out, auth state listeners. |
| 4.3 | Implement Drive file operations | ✅ | `sync/drive.ts` — `DriveClient` class wrapping Drive REST API v3 via raw `fetch()`. ensureFolder, findFile, uploadDatabase (create/update), downloadDatabase, getFileMetadata, resetCache. |
| 4.4 | Implement SyncManager | ✅ | `sync/sync-manager.ts` — `SyncManager` class orchestrating debounced upload (30s), download on app load, version comparison (local vs remote timestamps), last-write-wins resolution, concurrent sync prevention. |
| 4.5 | Add sync status UI | ✅ | Implemented in Stage 16. TopBar sync indicator, Home/Settings sync buttons, `useSync` hook + `SyncProvider`. |
| 4.6 | Handle offline → online transition | ✅ | `SyncManager` listens to `online`/`offline` events, triggers sync on reconnection. |
| 4.7 | Write tests for sync logic | ✅ | 37 tests: auth (10), drive (12), sync-manager (15). Debounce, conflict resolution, offline queuing, error handling all covered. 158 total tests pass. |

### Google Cloud Project Setup Notes

1. Go to Google Cloud Console → create project "Arth"
2. Enable Google Drive API
3. OAuth consent screen → External → Testing mode
4. Add own Google account as test user
5. Create credentials → OAuth Client ID → Web Application
6. Authorized JavaScript origins: `http://localhost:5173` (dev) + GitHub Pages URL (prod)
7. Authorized redirect URIs: same as above
8. Copy Client ID into app config

---

## Stage 5: UI — Layout & Navigation Shell

> App skeleton: bottom nav, page routing, shared components.

| # | Task | Status | Details |
|---|------|--------|---------|
| 5.1 | Install React Router | ✅ | `react-router-dom` v7 installed, BrowserRouter with `basename="/arth/"` |
| 5.2 | Build BottomNav component | ✅ | 4 tabs (Home, Transactions, Balance, Analytics) with inline SVG icons, NavLink active highlighting, 44px touch targets, fixed bottom with safe-area insets |
| 5.3 | Build TopBar component | ✅ | "Arth" title, sync status indicator (synced/syncing/offline), settings gear link. Fixed top with safe-area insets |
| 5.4 | Build PageContainer layout | ✅ | Scrollable content area with `dvh`-based spacing, safe-area padding for notched devices |
| 5.5 | Set up routing | ✅ | Routes: `/` (Home), `/transactions`, `/balance`, `/analytics`, `/settings`. BrowserRouter with `/arth/` basename. |
| 5.6 | Build shared UI primitives | ✅ | Button (4 variants, 3 sizes), Card, Modal (portal + `<dialog>`), Select, Input (with prefix), DatePicker, Toggle, Badge (5 variants) |
| 5.7 | Configure Tailwind theme | ✅ | Tailwind v4 `@theme` directive with semantic color tokens (surface, accent, credit/debit, danger, warning), mobile-optimized font sizes, touch-target spacing |
| 5.8 | Add app startup flow | ✅ | LoadingScreen with shimmer animation → DatabaseProvider loads from IndexedDB → seeds if needed → renders AppShell with routing |

---

## Stage 6: UI — Settings (Meta Data Management)

> Manage accounts, funds, categories, sub-categories. Build this first because all other forms depend on this reference data.

| # | Task | Status | Details |
|---|------|--------|---------|
| 6.1 | Build Settings page | ✅ | Tabbed layout (Accounts, Funds, Categories, Sub-Categories) with shared `EntityList` component |
| 6.2 | Accounts management | ✅ | `AccountsSection.tsx` — list, add (name + type dropdown), edit, deactivate. Types: bank, credit_card, wallet, cash, investment |
| 6.3 | Funds management | ✅ | `FundsSection.tsx` — list, add, edit name, deactivate |
| 6.4 | Categories management | ✅ | `CategoriesSection.tsx` — list, add, edit name, deactivate |
| 6.5 | Sub-categories management | ✅ | `SubCategoriesSection.tsx` — grouped by parent category, add (name + parent), edit, deactivate |
| 6.6 | Ensure deactivated items hidden from dropdowns | ✅ | Active-only filtering in transaction/transfer form dropdowns; deactivated items preserved in historical data |

---

## Stage 7: UI — Transaction Entry & List

> Core interaction: adding, viewing, editing, and deleting transactions.

| # | Task | Status | Details |
|---|------|--------|---------|
| 7.1 | Build Add Transaction form | ✅ | `TransactionForm.tsx` — date (default today), category/sub-category (filtered), type toggle, fund, account, amount (₹), comments. All required except comments. |
| 7.2 | Build Transfer form | ✅ | `TransferForm.tsx` — source/dest fund+account, amount, date, comments. Multi-leg support with "+ Add another leg". Shared `transfer_id`. |
| 7.3 | Build Transaction list | ✅ | Scrollable list, newest first. `TransactionCard.tsx` collapsed: date, category, amount, account. |
| 7.4 | Build Transaction card expand/collapse | ✅ | Tap to expand showing all fields + Edit/Delete. Transfer groups shown as grouped cards with all legs. |
| 7.5 | Build filter bar | ✅ | `FilterBar.tsx` — date range presets (This Month, This FY, Last Month, Custom), category/fund/account multi-select, transaction type filter |
| 7.6 | Implement edit transaction | ✅ | Edit button opens `TransactionForm` pre-filled → save updates in place |
| 7.7 | Implement edit transfer | ✅ | Edit on grouped card opens `TransferForm` with all legs pre-filled |
| 7.8 | Implement delete transaction | ✅ | Delete button → confirmation modal → delete row |
| 7.9 | Implement delete transfer group | ✅ | Delete any leg → "Delete all X legs?" prompt → deletes all rows with same `transfer_id` |

---

## Stage 8: UI — Home Dashboard

> At-a-glance overview with quick actions.

| # | Task | Status | Details |
|---|------|--------|---------|
| 8.1 | Build Dashboard layout | ✅ | `Home.tsx` — vertically scrollable cards |
| 8.2 | Sync status card | ✅ | "Last synced: X ago" or "Offline" + manual Sync button |
| 8.3 | Fund balances summary | ✅ | Cards showing each fund's total balance (non-zero only) |
| 8.4 | Monthly spend summary | ✅ | Total spent this month + top 3 categories with amounts |
| 8.5 | Quick-action buttons | ✅ | Prominent "Add Transaction" and "Transfer" buttons |

---

## Stage 9: UI — Balance Sheet

> Fund × Account views with reconciliation.

| # | Task | Status | Details |
|---|------|--------|---------|
| 9.1 | Build Balance page with 3 sub-tabs | ✅ | `Balance.tsx` — tab bar: "By Account" (default), "By Fund", "Matrix", "Lend/Borrow" |
| 9.2 | By Account view | ✅ | `ByAccountView.tsx` — account cards with computed totals, fund breakdown (non-zero only) |
| 9.3 | Reconciliation feature | ✅ | Actual balance input per account card, difference display, "Add Missing Transaction" and "Settle Difference" actions |
| 9.4 | By Fund view | ✅ | `ByFundView.tsx` — fund cards with totals, account breakdown (non-zero only) |
| 9.5 | Matrix view | ✅ | `MatrixView.tsx` — full grid: funds as rows, accounts as columns. Horizontally scrollable. Row/column totals. |
| 9.6 | Lend/Borrow view | ✅ | `LendBorrowView.tsx` — per-person outstanding lent/borrowed amounts from Lend/Borrow category transactions |

---

## Stage 10: UI — Analytics

> Charts, trends, and insights.

| # | Task | Status | Details |
|---|------|--------|---------|
| 10.1 | Install charting library | ✅ | Recharts v3.8.1 installed (chose over Chart.js for declarative React API) |
| 10.2 | Build Analytics page layout | ✅ | `Analytics.tsx` — `TimeScopeSelector` (This Month / This Year / This FY / Custom), scrollable chart cards. `useAnalytics` hook for data. |
| 10.3 | Spend by category chart | ✅ | `SpendByCategoryChart.tsx` — horizontal bar chart with category breakdown for selected period |
| 10.4 | Monthly spend trend | ✅ | `MonthlySpendChart.tsx` — line chart: total spending per month over time |
| 10.5 | Category trend over time | ✅ | `CategoryTrendChart.tsx` — multi-line chart: per-category spending across months with legend toggles |
| 10.6 | Savings rate | ✅ | `SavingsRateChart.tsx` — per-month bar chart: savings/investment as percentage of income |
| 10.7 | Cashback & rewards | ✅ | `CashbackChart.tsx` — per-month summary of total cashback earned |
| 10.8 | Credit card annual spend | ✅ | `CreditCardSpendChart.tsx` — per credit card annual spend, useful for fee waiver tracking |
| 10.9 | Budget vs actual (static reference) | ⬜ | Deferred — requires budget data model not yet implemented |

---

## Stage 11: PWA & Deployment

> Make it installable and deploy to GitHub Pages.

| # | Task | Status | Details |
|---|------|--------|---------|
| 11.1 | Configure vite-plugin-pwa | ✅ | SW registration in `main.tsx` via `registerSW({ immediate: true })`, workbox precaching 9 entries, types in tsconfig |
| 11.2 | Create manifest.json | ✅ | `manifest.webmanifest` with PNG + SVG icon entries, proper `/Arth/` scope and start_url |
| 11.3 | Generate app icons | ✅ | 192x192 & 512x512 in both SVG and PNG. `scripts/generate-icons.mjs` for proper PNG rendering. |
| 11.4 | Test PWA install flow | ✅ | Android Chrome install verified. iOS Safari pending. |
| 11.5 | Create GitHub repository | ✅ | `skgtrx/Arth` on personal GitHub |
| 11.6 | Configure GitHub Pages deployment | ✅ | `.github/workflows/deploy.yml` — Actions deploys on push to main. Live at `https://skgtrx.github.io/Arth/` |
| 11.7 | Configure Vite base path | ✅ | `base: '/Arth/'` in vite.config.ts, BrowserRouter basename, manifest scope all aligned (case-sensitive) |
| 11.8 | Update OAuth redirect URIs | ✅ | Authorized origins: localhost:5173 + skgtrx.github.io. `VITE_GOOGLE_CLIENT_ID` set as repo variable. |
| 11.9 | End-to-end deployment test | ✅ | App loads and renders at production URL. Full sync E2E deferred to Stage 16. |
| 11.10 | SPA routing on GitHub Pages | ✅ | `404.html` redirect + `main.tsx` route restoration for deep links |
| 11.11 | Environment config | ✅ | `.env.example` documenting `VITE_GOOGLE_CLIENT_ID`, GH Actions reads from repo vars |

---

## Stage 14: PIN Authentication

> App-level lock screen to prevent casual access on shared/lost devices.

| # | Task | Status | Details |
|---|------|--------|---------|
| 14.1 | PIN storage schema | ✅ | `app_settings` table (`key TEXT PRIMARY KEY, value TEXT`), schema v2, migration for existing DBs. |
| 14.2 | PIN setup flow | ✅ | Settings → Set PIN modal with numpad, enter + confirm, SHA-256 hash saved via `setAppSetting`. |
| 14.3 | Lock screen component | ✅ | `LockScreen.tsx` — portal overlay (z-50), numpad (64px buttons), auto-submit on 4th digit. |
| 14.4 | Session management | ✅ | `AuthContext.tsx` — `AuthProvider` + `useAuth` hook. `isUnlocked` starts false, set true on correct PIN or no PIN. |
| 14.5 | Change PIN | ✅ | Settings → Change PIN modal: current PIN → new PIN → confirm → save new hash. |
| 14.6 | Reset PIN | ✅ | Settings → Remove PIN modal: enter current PIN → confirm → clears hash from `app_settings`. |

### Design Notes

- PIN hash stored in SQLite `app_settings` table, persisted to IndexedDB alongside the database
- No lockout/rate-limiting needed — this is a casual access deterrent, not cryptographic security
- Lock screen renders _above_ the app (portal/overlay), not as a route — prevents flash of content
- The PIN travels with the database to Google Drive, so the same PIN works across devices

---

## Stage 15: Seed Data Cleanup

> Remove personal/sensitive data from the public repository. Require Google sign-in.

| # | Task | Status | Details |
|---|------|--------|---------|
| 15.1 | Delete seed data | ✅ | Removed `seed.ts` (2556 lines of personal financial data), `seed.test.ts`. All sensitive data eliminated from codebase. |
| 15.2 | Delete CSV parser | ✅ | Removed `csv-parser.ts` and `csv-parser.test.ts`. No longer needed — data lives in Google Drive, not the repo. |
| 15.3 | Require Google sign-in | ✅ | `SignInScreen.tsx` gates the app — user must sign in with Google before accessing any functionality. App downloads DB from Drive on first sync. |
| 15.4 | Empty DB for new users | ✅ | Removed auto-seeding from `DatabaseContext`. New users get empty schema. Added `*.db` to `.gitignore`. |

---

## Stage 16: Sync UI & Google Drive Go-Live

> Wire the existing sync engine (Stage 4) into the React app. Enable real cloud sync.

| # | Task | Status | Details |
|---|------|--------|---------|
| 16.1 | Set up Google Cloud project | ✅ | Project "Arth" created, Drive API enabled, OAuth consent (Testing mode), Client ID created. Origins: localhost:5173 + skgtrx.github.io. Repo variable set. |
| 16.2 | Implement `useSync` hook | ✅ | `useSync()` re-exports from `SyncContext`. Exposes `signIn`, `signOut`, `syncNow`, `scheduleUpload`, `syncState`, `isSignedIn`. |
| 16.3 | Add sync context/provider | ✅ | `SyncProvider` in `context/SyncContext.tsx`. Initializes `GoogleAuth` + `DriveClient` + `SyncManager` on mount. Wraps app inside `DatabaseProvider`. |
| 16.4 | Sign in / sign out UI | ✅ | Settings page → `SyncSection` card. "Sign in with Google" / "Connected + Sign out" + "Sync Now" button. |
| 16.5 | Sync status in TopBar | ✅ | `AppShell` reads `syncState` → maps to TopBar `syncStatus` prop. Added `error` state with `text-danger`. |
| 16.6 | Auto-sync on mutations | ✅ | All pages (Home, Transactions, Balance, Settings) call `scheduleUpload()` after `persistDatabase()`. 30s debounce via `SyncManager`. |
| 16.7 | Sync on app load | ✅ | `SyncProvider` `onAuthChange` listener triggers `manager.sync()` on sign-in — compares local vs remote timestamps, uploads or downloads. |
| 16.8 | Manual sync button | ✅ | Home dashboard "Sync Now" button (when signed in). Also in Settings `SyncSection`. Shows last synced timestamp. |

### Prerequisites

- Stage 14 (PIN) should be done first — PIN hash is stored in the database, so it syncs to Drive automatically
- Stage 15 (Seed cleanup) should be done first — don't sync test data to Drive
- Google Cloud project must be set up (16.1) before any sync testing

---

## Stage 12: Testing & QA

> Comprehensive testing across devices and scenarios.

| # | Task | Status | Details |
|---|------|--------|---------|
| 12.1 | Unit tests — database layer | ✅ | 75 tests: schema constraints, CRUD, balance computations, transfer pairing, seed integrity (done in Stage 2) |
| 12.2 | Unit tests — utility functions | ✅ | 36 tests: currency formatting, date parsing, FY calculations, CSV parser (done in Stage 2) |
| 12.3 | Unit tests — sync logic | ✅ | 37 tests in Stage 4: auth (10), drive (12), sync-manager (15). Debounce, conflict resolution, offline handling covered. |
| 12.4 | Component tests — forms | ⬜ | Transaction form validation, transfer form multi-leg behavior, dropdown filtering |
| 12.5 | Component tests — views | ⬜ | Balance sheet computation, analytics chart data preparation, filter behavior |
| 12.6 | Mobile device testing | ⬜ | Test on actual Android phone + iOS phone. Verify: touch targets, scroll behavior, keyboard handling for numeric input, PWA install, offline usage. |
| 12.7 | Cross-browser testing | ⬜ | Chrome (primary), Safari (iOS), Firefox. Verify sql.js WASM loading, IndexedDB, Google OAuth. |
| 12.8 | Data integrity verification | ⬜ | Seed the FY26-27 data → verify all balance sheet values match the original spreadsheet exactly |
| 12.9 | Sync stress test | ⬜ | Rapid edits → verify debounce works → verify Drive file is correct. Go offline → edit → go online → verify sync. |
| 12.10 | Reconciliation workflow test | ⬜ | Full audit flow: enter actual balances → add missing transactions → settle → verify all differences = 0 |

---

## Stage 13: Data Migration & Go-Live

> Seed production data and start using the app.

| # | Task | Status | Details |
|---|------|--------|---------|
| 13.1 | Final seed data verification | ⬜ | Verify all 201 rows from CSV imported correctly with proper transfer_id pairing |
| 13.2 | Verify balance sheet matches spreadsheet | ⬜ | Cross-check every fund×account cell in the app vs the original spreadsheet |
| 13.3 | Install PWA on primary mobile device | ⬜ | Add to home screen on phone |
| 13.4 | Begin using for daily transactions | ⬜ | Start recording real transactions in the app |

---

## Dependencies Between Stages

```
Stages 1–11 ✅ (core app built and deployed)
  │
  ├──▶ Stage 14 (PIN Auth) ──────────────────┐
  │                                           │
  ├──▶ Stage 15 (Seed Data Cleanup) ─────────┤
  │                                           │
  └──▶ Google Cloud setup (manual, 16.1) ────┤
                                              │
                                              └──▶ Stage 16 (Sync UI)
                                                      │
                                                      └──▶ Stage 12 (Testing)
                                                             └──▶ Stage 13 (Go-Live)
```

**Parallel tracks:**
- Stages 14, 15, and 16.1 (Google Cloud setup) can all proceed in parallel
- Stage 16.2+ (sync UI code) should wait for 14 and 15 to complete
- Stage 12 (Testing) runs continuously alongside development

---

## Estimated Effort

| Stage | Estimated Time | Notes |
|-------|---------------|-------|
| 1. Project Setup | 1-2 hours | Boilerplate, tooling |
| 2. Database Layer | 4-6 hours | Schema, queries, seed parsing, transfer detection |
| 3. IndexedDB Persistence | 1-2 hours | Straightforward serialization |
| 4. Google Drive Sync | 4-6 hours | OAuth flow + Drive API integration |
| 5. UI Shell | 2-3 hours | Navigation, layout, routing, primitives |
| 6. Settings | 2-3 hours | CRUD for reference data |
| 7. Transactions | 6-8 hours | Forms, list, filters, edit/delete, transfer groups |
| 8. Dashboard | 2-3 hours | Summary cards, quick actions |
| 9. Balance Sheet | 4-6 hours | Three views + reconciliation |
| 10. Analytics | 4-6 hours | Charts, trends, time filters |
| 11. PWA & Deployment | 2-3 hours | Service worker, manifest, GitHub Pages |
| 14. PIN Authentication | 2-3 hours | Lock screen, setup/change/remove flow |
| 15. Seed Data Cleanup | 1-2 hours | Anonymize data, add CSV import, gate auto-seed |
| 16. Sync UI & Go-Live | 3-4 hours | Wire sync engine into React, sign in/out, auto-sync |
| 12. Testing | 4-6 hours | Unit, component, device, integration |
| 13. Go-Live | 1-2 hours | Data verification, install |
| **Total** | **~43-65 hours** | |
