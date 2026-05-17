# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Arth is a mobile-first PWA for personal finance management, replacing Google Sheets-based expense tracking. Single user, single currency (INR), offline-first, zero backend.

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Database:** SQLite via sql.js (WASM, runs entirely in the browser)
- **Local persistence:** IndexedDB (serialized sql.js database)
- **Cloud sync:** Google Drive API (`drive.file` scope), client-side OAuth 2.0
- **Hosting:** GitHub Pages (static files only)
- **Charts:** Chart.js or Recharts (TBD during implementation)

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
4. **Google Drive** syncs the `.db` file to the cloud (30s debounce after last change)

Data flows: UI → sql.js (in-memory) → IndexedDB (local) → Google Drive (cloud).

### Key Directory Layout

```
src/
  db/           # Database layer: schema, queries, seed, migrations
  sync/         # Google Drive: OAuth, Drive API, sync orchestration
  components/   # Shared UI (ui/, forms/, layout/)
  pages/        # Route-level pages (Home, Transactions, Balance, Analytics, Settings)
  hooks/        # useDatabase, useSync, useTransactions
  utils/        # currency.ts (paisa math), date.ts (FY helpers), csv-parser.ts
  types/        # TypeScript definitions
  context/      # DatabaseContext provider
```

## Data Model Conventions

- **Currency:** All amounts stored as **integers in paisa** (₹1,472.86 → 147286). Use `utils/currency.ts` for conversion and INR formatting with Indian comma notation (₹X,XX,XXX.XX).
- **Dates:** Stored as ISO 8601 strings (YYYY-MM-DD). Financial year runs April 1 to March 31 (e.g., "FY26-27"). Use `utils/date.ts` for FY/month/year range helpers.
- **Balances are computed, never stored:** Derived from `SUM(CASE credit/debit)` grouped by fund and account.
- **Transfers:** Multi-row transactions sharing a `transfer_id` (UUID). Can be 2-row (simple) or 4+-row (multi-leg). Displayed as grouped cards in the UI.
- **Soft deletes:** Accounts, funds, categories use `is_active` flag. Deactivated items hidden from forms but preserved in historical data.

## Seed Data

Source CSV at `docs/Expense Tracker - FY26-27 - Regular Transactions.csv`. Parsing rules:
- Amounts: strip `₹` and commas, multiply by 100 for paisa
- Dates: parse `D-MMM-YYYY` format to ISO 8601
- Transfer detection: consecutive rows with same date + same amount + one debit/one credit = paired transfer group
- Account types inferred from known names (see PRD § 5.2 for the full mapping)

## Google Auth Setup

Uses a personal Google Cloud project in "Testing" mode (no review required). OAuth client configured with `drive.file` scope — the app can only access files it created. The app creates an `Arth/` folder in Drive containing `finance.db`.

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
3. **Offline-first** — full functionality from IndexedDB when offline, sync when back online
4. **Zero cost** — no hosting fees, no API subscriptions, no paid services
5. **Dynamic structure** — adding accounts/funds/categories is trivial with no formula maintenance

## License

Proprietary — all rights reserved. Not open source. See LICENSE file.
