# Arth

A mobile-first Progressive Web App (PWA) for personal finance management, built to replace spreadsheet-based expense tracking with a fast, offline-capable, and analytics-rich experience.

> **Arth** (अर्थ) — meaning "wealth" or "meaning" in Hindi.

## Why

Tracking personal finances in Google Sheets works until it doesn't:

- Poor mobile experience for daily entry
- Manual year-over-year setup (new sheet, copy structure, carry forward balances)
- No built-in analytics or trend visibility
- Rigid structure that breaks when you add accounts or funds

Arth solves this with a structured app that keeps the manual control of a spreadsheet while adding the convenience of a dedicated tool.

## Features

- **Transaction management** — add, edit, delete transactions with category, sub-category, fund, and account tracking
- **Multi-leg transfers** — inter-fund, inter-account, and multi-leg transfers with grouped display
- **Balance sheet** — three views: by account, by fund, and a full fund × account matrix
- **Reconciliation** — compare app balances against actual bank balances, settle differences
- **Analytics** — monthly spend by category, trends over time, savings rate, credit card annual spend tracking
- **Budget tracking** — static budget vs actual comparison
- **Offline-first** — works without internet after initial setup; data persists in IndexedDB
- **Google Drive sync** — cross-device sync via Drive API with last-write-wins conflict resolution
- **Indian financial context** — INR formatting with Indian comma notation, April-March financial year

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Database | SQLite via sql.js (WASM, in-browser) |
| Persistence | IndexedDB (local) + Google Drive (cloud) |
| Auth | Google OAuth 2.0 (client-side, `drive.file` scope) |
| Hosting | GitHub Pages |
| App type | PWA (installable, offline-capable) |

## Architecture

All data lives in a single SQLite database running in the browser via WebAssembly. Mutations are persisted to IndexedDB immediately and synced to Google Drive on a 30-second debounce. No backend server — the entire app is static files served from GitHub Pages.

```
Browser
  React UI → sql.js (in-memory SQLite) → IndexedDB (instant local persist)
                                        → Google Drive (debounced cloud sync)
```

## Project Structure

```
arth/
├── src/
│   ├── components/       # Shared UI components
│   ├── pages/            # Page-level components (Home, Transactions, Balance, Analytics, Settings)
│   ├── db/               # Database layer (schema, queries, seed, migrations)
│   ├── sync/             # Google Drive sync (auth, drive API, sync manager)
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Currency, date, and CSV utilities
│   ├── types/            # TypeScript type definitions
│   └── context/          # React context providers
├── docs/
│   ├── PRD.md            # Product requirements
│   └── IMPLEMENTATION_PLAN.md
└── data/
    └── fy26-27-transactions.csv
```

## Data Model

- **Accounts** — bank, credit card, wallet, cash, investment
- **Funds** — logical buckets (e.g., Monthly Expense Fund, Income Fund)
- **Categories / Sub-categories** — hierarchical transaction classification
- **Transactions** — every financial event, amounts stored as integers in paisa

Balances are computed, not stored — derived from `SUM(credit) - SUM(debit)` grouped by fund and account.

## Development

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`. Google OAuth requires a configured Google Cloud project with the Drive API enabled (see `docs/PRD.md` § 2.4 for setup details).

## License

Copyright (c) 2026 Shashank Khandelwal. All Rights Reserved.

This is a personal project. No part of this software may be used, copied, modified, or distributed without prior written permission. See [LICENSE](./LICENSE) for details.
