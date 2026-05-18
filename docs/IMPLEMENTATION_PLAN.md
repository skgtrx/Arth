# Arth — Implementation Plan

**Version:** 1.0
**Date:** 2026-05-17
**PRD Reference:** [docs/PRD.md](./PRD.md)

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
| 4.1 | Set up Google Cloud project | ⬜ | Create project, enable Drive API, configure OAuth consent screen (Testing mode), create OAuth client ID (Web application) |
| 4.2 | Implement Google OAuth flow | ⬜ | `sync/auth.ts` — sign in, token management, sign out. Use Google Identity Services (GIS) library. |
| 4.3 | Implement Drive file operations | ⬜ | `sync/drive.ts` — createFolder(), uploadFile(), downloadFile(), getFileMetadata() for the `Arth/` folder and `finance.db` file |
| 4.4 | Implement SyncManager | ⬜ | `sync/sync-manager.ts` — orchestrates: debounced upload (30s), download on app load, version comparison (local vs remote timestamps), last-write-wins resolution |
| 4.5 | Add sync status UI | ⬜ | Display "Last synced: X ago" / "Syncing..." / "Offline" in the top bar. Manual "Sync" button. |
| 4.6 | Handle offline → online transition | ⬜ | Detect connectivity changes, trigger sync when back online |
| 4.7 | Write tests for sync logic | ⬜ | Test debounce behavior, conflict resolution, offline queuing |

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
| 5.1 | Install React Router | ⬜ | `react-router-dom` for client-side routing |
| 5.2 | Build BottomNav component | ⬜ | 4 tabs: Home, Transactions, Balance, Analytics. Highlights active tab. Fixed at bottom. |
| 5.3 | Build TopBar component | ⬜ | App name "Arth", sync status indicator, settings gear icon |
| 5.4 | Build PageContainer layout | ⬜ | Scrollable content area between TopBar and BottomNav |
| 5.5 | Set up routing | ⬜ | Routes: `/` (Home), `/transactions` (Transactions), `/balance` (Balance), `/analytics` (Analytics), `/settings` (Settings) |
| 5.6 | Build shared UI primitives | ⬜ | Button, Card, Modal, Dropdown/Select, DatePicker, NumericInput, Toggle, Badge |
| 5.7 | Configure Tailwind theme | ⬜ | Colors, spacing, font sizes optimized for mobile |
| 5.8 | Add app startup flow | ⬜ | Loading screen → check IndexedDB → check Google auth → load DB → render app |

---

## Stage 6: UI — Settings (Meta Data Management)

> Manage accounts, funds, categories, sub-categories. Build this first because all other forms depend on this reference data.

| # | Task | Status | Details |
|---|------|--------|---------|
| 6.1 | Build Settings page | ⬜ | Tabs or sections: Accounts, Funds, Categories, Sub-Categories |
| 6.2 | Accounts management | ⬜ | List accounts, add new (name + type dropdown), edit name/type, deactivate (soft delete). Types: bank, credit_card, wallet, cash, investment |
| 6.3 | Funds management | ⬜ | List funds, add new (name), edit name, deactivate |
| 6.4 | Categories management | ⬜ | List categories, add new (name), edit name, deactivate |
| 6.5 | Sub-categories management | ⬜ | List grouped by parent category, add new (name + parent category), edit, deactivate |
| 6.6 | Ensure deactivated items hidden from dropdowns | ⬜ | Deactivated accounts/funds/categories don't appear in transaction/transfer forms but remain in historical data |

---

## Stage 7: UI — Transaction Entry & List

> Core interaction: adding, viewing, editing, and deleting transactions.

| # | Task | Status | Details |
|---|------|--------|---------|
| 7.1 | Build Add Transaction form | ⬜ | Full form: Date (default today), Category dropdown, Sub-Category dropdown (filtered by category), Transaction Type toggle (Credit/Debit), Fund dropdown, Account dropdown, Amount (numeric, ₹), Comments (text). Validation: all fields except Comments required. |
| 7.2 | Build Transfer form | ⬜ | Source Fund + Account, Dest Fund + Account, Amount, Date, Comments. "+ Add another leg" button adds additional source→dest pair. All legs get shared transfer_id. |
| 7.3 | Build Transaction list | ⬜ | Scrollable list, newest first. Card UI: collapsed shows Date, Category, Amount, Account. |
| 7.4 | Build Transaction card expand/collapse | ⬜ | Tap card → expand to show all fields + Edit/Delete buttons. Transfer groups shown as single grouped card with all legs visible. |
| 7.5 | Build filter bar | ⬜ | Date range presets (This Month, This FY, Last Month, Custom), Category multi-select, Fund multi-select, Account multi-select, Transaction Type filter |
| 7.6 | Implement edit transaction | ⬜ | Tap Edit → opens Add Transaction form pre-filled → save updates in place |
| 7.7 | Implement edit transfer | ⬜ | Tap Edit on grouped card → opens Transfer form with all legs pre-filled |
| 7.8 | Implement delete transaction | ⬜ | Swipe or tap Delete → confirmation dialog → delete row |
| 7.9 | Implement delete transfer group | ⬜ | Delete any leg → prompt "Delete all X legs of this transfer?" → delete all rows with same transfer_id |

---

## Stage 8: UI — Home Dashboard

> At-a-glance overview with quick actions.

| # | Task | Status | Details |
|---|------|--------|---------|
| 8.1 | Build Dashboard layout | ⬜ | Vertically scrollable cards |
| 8.2 | Sync status card | ⬜ | "Last synced: X ago" or "Offline" + manual Sync button |
| 8.3 | Fund balances summary | ⬜ | Cards showing each fund's total balance (non-zero only) |
| 8.4 | Monthly spend summary | ⬜ | Total spent this month + top 3 categories with amounts |
| 8.5 | Quick-action buttons | ⬜ | Prominent "Add Transaction" and "Transfer" buttons, easy to tap |

---

## Stage 9: UI — Balance Sheet

> Fund × Account views with reconciliation.

| # | Task | Status | Details |
|---|------|--------|---------|
| 9.1 | Build Balance page with 3 sub-tabs | ⬜ | Tab bar: "By Account" (default), "By Fund", "Matrix" |
| 9.2 | By Account view | ⬜ | Account-centric cards: account name + computed total, fund breakdown (non-zero only) |
| 9.3 | Reconciliation feature | ⬜ | "Actual balance" input field per account card. Shows difference (app - actual). Actions: "Add Missing Transaction" (opens transaction form, difference updates on return), "Settle Difference" (opens pre-filled form: Category=Other, SubCategory=Other, amount=difference). "Exit Reconciliation" clears input. Actual balance editable anytime during session. |
| 9.4 | By Fund view | ⬜ | Fund-centric cards: fund name + total, account breakdown (non-zero only) |
| 9.5 | Matrix view | ⬜ | Full grid: funds as rows, accounts as columns. Horizontally scrollable. Row totals, column totals. |
| 9.6 | Lend/Borrow view | ⬜ | Accessible from Balance page (toggle or additional tab). Shows per-person: outstanding lent amount, outstanding borrowed amount. Computed from transactions where category = Lend/Borrow. |

---

## Stage 10: UI — Analytics

> Charts, trends, and insights.

| # | Task | Status | Details |
|---|------|--------|---------|
| 10.1 | Install charting library | ⬜ | Chart.js + react-chartjs-2 (or Recharts — decide during implementation) |
| 10.2 | Build Analytics page layout | ⬜ | Time scope selector (This Month / This Year / This FY / Custom), scrollable chart cards below |
| 10.3 | Spend by category chart | ⬜ | Pie chart or horizontal bar chart: total spend per category for selected period |
| 10.4 | Monthly spend trend | ⬜ | Line chart: total spending per month over time |
| 10.5 | Category trend over time | ⬜ | Multi-line chart: per-category spending across months. Allow toggling categories on/off. |
| 10.6 | Savings rate | ⬜ | Per-month bar chart: percentage of income that went to savings/investment categories |
| 10.7 | Cashback & rewards | ⬜ | Per-month summary: total cashback earned (sum of Cashback category credits) |
| 10.8 | Credit card annual spend | ⬜ | Per credit card: total annual spend, useful for fee waiver tracking |
| 10.9 | Budget vs actual (static reference) | ⬜ | If budget data exists, show comparison: budgeted amount vs actual spend per budget category |

---

## Stage 11: PWA & Deployment

> Make it installable and deploy to GitHub Pages.

| # | Task | Status | Details |
|---|------|--------|---------|
| 11.1 | Configure vite-plugin-pwa | ⬜ | Service worker with precaching of app shell, runtime caching for Google API calls |
| 11.2 | Create manifest.json | ⬜ | App name "Arth", short_name "Arth", theme_color, background_color, display: standalone, icons |
| 11.3 | Generate app icons | ⬜ | 192x192 and 512x512 PNG icons |
| 11.4 | Test PWA install flow | ⬜ | Install on Android Chrome, iOS Safari. Verify home screen icon, standalone mode, offline capability. |
| 11.5 | Create GitHub repository | ⬜ | `arth` repo, push codebase |
| 11.6 | Configure GitHub Pages deployment | ⬜ | GitHub Actions workflow: on push to main → build → deploy to `gh-pages` branch |
| 11.7 | Configure Vite base path | ⬜ | Set `base: '/arth/'` in vite.config.ts for GitHub Pages sub-path |
| 11.8 | Update OAuth redirect URIs | ⬜ | Add GitHub Pages URL to Google Cloud Console authorized origins/redirects |
| 11.9 | End-to-end deployment test | ⬜ | Full flow on production URL: sign in → sync → add transaction → view balance → offline → reconnect |

---

## Stage 12: Testing & QA

> Comprehensive testing across devices and scenarios.

| # | Task | Status | Details |
|---|------|--------|---------|
| 12.1 | Unit tests — database layer | ✅ | 75 tests: schema constraints, CRUD, balance computations, transfer pairing, seed integrity (done in Stage 2) |
| 12.2 | Unit tests — utility functions | ✅ | 36 tests: currency formatting, date parsing, FY calculations, CSV parser (done in Stage 2) |
| 12.3 | Unit tests — sync logic | ⬜ | Debounce, conflict resolution, offline handling |
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
Stage 1 (Setup)
  └──▶ Stage 2 (Database)
         ├──▶ Stage 3 (IndexedDB)
         │     └──▶ Stage 4 (Google Drive Sync)
         └──▶ Stage 5 (UI Shell)
               └──▶ Stage 6 (Settings) ──▶ Stage 7 (Transactions)
                                              ├──▶ Stage 8 (Dashboard)
                                              ├──▶ Stage 9 (Balance)
                                              └──▶ Stage 10 (Analytics)
                                                      └──▶ Stage 11 (PWA & Deploy)
                                                             └──▶ Stage 12 (Testing)
                                                                    └──▶ Stage 13 (Go-Live)
```

**Parallel tracks possible:**
- Stage 3 (IndexedDB) and Stage 5 (UI Shell) can proceed in parallel after Stage 2
- Stage 8, 9, 10 can proceed in parallel after Stage 7
- Stage 12 (Testing) runs continuously alongside development, with a final dedicated pass before go-live

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
| 12. Testing | 4-6 hours | Unit, component, device, integration |
| 13. Go-Live | 1-2 hours | Data verification, install |
| **Total** | **~37-56 hours** | |
