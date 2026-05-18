# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Arth is a mobile-first PWA for personal finance management, replacing Google Sheets-based expense tracking. Single user, single currency (INR), local-first with Google Drive sync, zero backend.

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Database:** SQLite via sql.js (WASM, runs entirely in the browser)
- **Local persistence:** IndexedDB (serialized sql.js database)
- **Cloud sync:** Google Drive API (`drive.file` scope), client-side OAuth 2.0
- **Hosting:** GitHub Pages (static files only)
- **Charts:** Recharts

## Commands

```bash
npm install          # install dependencies
npm run dev          # start dev server at localhost:5173
npm run build        # production build
npm run preview      # preview production build locally
```

## Architecture

There is no backend. The entire app runs in the browser:

1. **React UI** renders pages and forms
2. **sql.js** runs a full SQLite database in memory via WASM
3. **IndexedDB** persists the serialized database locally (instant, every mutation)
4. **Google Drive** syncs the `.db` file to the cloud (manual, user-triggered)

Data flows: UI → sql.js (in-memory) → IndexedDB (local). On manual sync: IndexedDB ↔ Google Drive.

### Key Directory Layout

```
src/
  db/           # Database layer: schema, queries, migrations
  sync/         # Google Drive: OAuth, Drive API, sync orchestration
  components/   # Shared UI (ui/, forms/, layout/, auth/)
  pages/        # Route-level pages (Home, Transactions, Balance, Analytics, Settings)
  hooks/        # useDatabase, useSync, useTransactions
  utils/        # currency.ts (paisa math), date.ts (FY helpers)
  types/        # TypeScript definitions
  context/      # DatabaseContext, SyncContext, AuthContext providers
```

## Data Model Conventions

- **Currency:** All amounts stored as **integers in paisa** (₹1,472.86 → 147286). Use `utils/currency.ts` for conversion and INR formatting with Indian comma notation (₹X,XX,XXX.XX).
- **Dates:** Stored as ISO 8601 strings (YYYY-MM-DD). Financial year runs April 1 to March 31 (e.g., "FY26-27"). Use `utils/date.ts` for FY/month/year range helpers.
- **Balances are computed, never stored:** Derived from `SUM(CASE credit/debit)` grouped by fund and account.
- **Transfers:** Multi-row transactions sharing a `transfer_id` (UUID). Can be 2-row (simple) or 4+-row (multi-leg). Displayed as grouped cards in the UI.
- **Soft deletes:** Accounts, funds, categories use `is_active` flag. Deactivated items hidden from forms but preserved in historical data.

## App Startup & Sync Model

The app is **local-first**: IndexedDB is the source of truth between syncs. Google Drive sync is manual.

**First launch (no local data):**
1. `DatabaseProvider` initializes empty sql.js database
2. `SignInScreen` is shown — user must sign in with Google
3. On sign-in → `SyncManager.sync()` downloads DB from Drive (or keeps empty for new users)
4. DB is saved to IndexedDB → app renders

**Subsequent launches (local data exists):**
1. `DatabaseProvider` loads from IndexedDB (instant, no Google popup)
2. If PIN is set → `LockScreen` overlay requires PIN
3. App renders immediately with local data
4. User taps "Sync" when ready → triggers Google sign-in popup if needed → syncs with Drive

**Why no auto-sync on reload:** GIS Token Model always opens a popup — `prompt: ''` only controls what's inside the popup, not whether it appears. Silent token refresh requires a backend (Code Model), which breaks our zero-backend constraint.

Uses a personal Google Cloud project in "Testing" mode. OAuth client configured with `drive.file` scope — the app can only access files it created. The app creates an `Arth/` folder in Drive containing `finance.db`.

## Git Workflow

- **Personal project only.** This repo lives on a personal GitHub account. Never reference, push to, or interact with any Zocdoc GitHub org or repos.
- **No PRs, no GitHub CLI (`gh`).** All merges are done locally via `git merge`.
- **Branch per change.** Never commit directly to `main`. For every change:
  1. Create a feature branch off `main`
  2. Commit work on the feature branch
  3. Merge the branch into `main` locally
- **Push periodically.** Push branches and `main` to the personal GitHub remote via `git push`. Direct commits to `main` on remote are restricted.
- **No `Co-Authored-By` trailers.** Keep commits clean.

## Design Principles

1. **Full manual control** — the app makes operations fast, not automatic
2. **Mobile-first** — phone is the primary device; all touch targets and layouts optimized accordingly
3. **Local-first** — IndexedDB is the source of truth; Google Drive is a manual sync target for backup/cross-device
4. **Zero cost** — no hosting fees, no API subscriptions, no paid services
5. **Dynamic structure** — adding accounts/funds/categories is trivial with no formula maintenance

## License

Proprietary — all rights reserved. Not open source. See LICENSE file.
