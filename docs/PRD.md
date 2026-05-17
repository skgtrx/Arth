# Arth — Product Requirements Document

**Version:** 1.0
**Date:** 2026-05-17
**Author:** Shashank Khandelwal
**Status:** Approved

---

## 1. Overview

### 1.1 Problem Statement

Personal finance tracking using Google Spreadsheets suffers from:

- **Poor mobile experience** — spreadsheets are difficult to update and manage on phones
- **Manual overhead** — creating a new spreadsheet every financial year (April-March), copying structure, carrying forward balances
- **No analytics** — no visibility into monthly spending by category, trends over time, or budget vs actual
- **Rigid structure** — adding a new account or fund requires updating metadata, balance sheet formulas, and validation rules manually
- **Data silos** — separate spreadsheets per FY prevent cross-year analysis

### 1.2 Solution

**Arth** is a Progressive Web App (PWA) for personal finance management that replaces the spreadsheet-based system with a mobile-first, offline-capable application backed by SQLite and synced via Google Drive.

### 1.3 Design Principles

1. **Full manual control, zero automation** — the system makes operations fast, not automatic
2. **Dynamic structure** — adding accounts, funds, or categories should be trivial with no downstream formula maintenance
3. **Built-in deterministic analytics** — monthly spend, trends, budget vs actual are first-class features
4. **Mobile-first** — phone is the primary device for daily use
5. **Zero cost** — no hosting fees, no API subscriptions, no paid services
6. **Offline-first** — works without internet after initial sync

### 1.4 Non-Goals (Deferred)

- LLM-powered analysis and natural language queries
- Goals tracking and progress visualization
- Alerting and configurable validation rules engine
- Smart defaults / quick-entry mode for transactions
- Multi-currency support
- Multi-user / shared access

---

## 2. Architecture

### 2.1 Platform

| Component | Choice | Rationale |
|-----------|--------|-----------|
| App type | Progressive Web App (PWA) | Mobile-friendly, installable, offline-capable, no app store needed |
| Hosting | GitHub Pages | Free static hosting, custom domain support |
| Frontend | React + Vite + Tailwind CSS | Familiar stack, fast dev experience, utility-first CSS |
| Database | SQLite via sql.js (WASM) | Full SQL in the browser, single-file database, battle-tested |
| Sync | Google Drive API (`drive.file` scope) | Free, cross-device, user-controlled data |
| Auth | Google OAuth 2.0 (client-side) | No backend needed, ties into Drive naturally |
| Charts | Chart.js or Recharts | Lightweight, sufficient for personal analytics |
| Offline | Service Worker + IndexedDB | Caches app shell + persists DB locally |

### 2.2 Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                             │
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌───────────────────┐  │
│  │ React UI │───▶│ sql.js   │───▶│ IndexedDB         │  │
│  │          │◀───│ (in-mem) │    │ (local persist)   │  │
│  └──────────┘    └──────────┘    └───────────────────┘  │
│                       │                    │             │
│                       │              30s debounce        │
│                       │                    │             │
│                       ▼                    ▼             │
│               ┌─────────────────────────────────┐       │
│               │    Google Drive API              │       │
│               │    (finance.db in Drive folder)  │       │
│               └─────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Sync Strategy — Dual-Layer Persistence

| Layer | When | What |
|-------|------|------|
| In-memory (sql.js) | Every mutation | DB updated immediately |
| IndexedDB | Every mutation | Serialized DB saved instantly (no network) |
| Google Drive | 30s debounce after last change, or manual "Sync" button | Full .db file uploaded |

**Conflict resolution:** Last write wins. App displays "Last synced: X ago" with device info. Google Drive's built-in version history (30-day retention) serves as safety net for accidental overwrites.

**Sync on app load:**
1. Load local DB from IndexedDB (instant)
2. Check Google Drive for newer version (compare timestamps)
3. If remote is newer, download and replace local
4. If local is newer (offline edits), upload to Drive

### 2.4 Authentication

- Google OAuth 2.0 with `drive.file` scope (app can only access files it created)
- Personal Google Cloud project in "Testing" mode (no Google review required)
- User adds their own Google account as test user
- App creates a `Arth/` folder in Google Drive, stores `finance.db` there

### 2.5 Offline Behavior

| Scenario | Behavior |
|----------|----------|
| First visit, no internet | Message: "Connect to internet to sign in and sync your data" |
| First visit, has internet | Google sign-in → download DB (or create new) → ready |
| Return visit, has internet | Load from IndexedDB (instant) → background sync with Drive |
| Return visit, no internet | Load from IndexedDB → full functionality → sync when back online |

---

## 3. Data Model

### 3.1 Currency

- Single currency: Indian Rupee (INR)
- Amounts stored as **integers in paisa** (e.g., ₹1,472.86 → 147286)
- Display format: ₹X,XX,XXX.XX (Indian numbering system with commas)

### 3.2 Date & Financial Year

- Dates stored as ISO 8601 strings (YYYY-MM-DD)
- Three hardcoded time concepts for analytics:
  - **This Month** — calendar month (1st to last day)
  - **This Year** — January 1 to December 31
  - **This FY** — April 1 to March 31 (labeled as "FY26-27")
- Transaction date defaults to today, user-editable

### 3.3 Schema

#### `accounts`

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment |
| name | TEXT NOT NULL UNIQUE | e.g., "HDFC", "Slice Credit Card" |
| type | TEXT NOT NULL | One of: bank, credit_card, wallet, cash, investment |
| is_active | INTEGER DEFAULT 1 | Soft delete support |
| created_at | TEXT NOT NULL | ISO 8601 timestamp |

#### `funds`

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment |
| name | TEXT NOT NULL UNIQUE | e.g., "Monthly Expense Fund", "Income Fund" |
| is_active | INTEGER DEFAULT 1 | Soft delete support |
| created_at | TEXT NOT NULL | ISO 8601 timestamp |

#### `categories`

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment |
| name | TEXT NOT NULL UNIQUE | e.g., "Food", "Transfer", "Savings" |
| is_active | INTEGER DEFAULT 1 | Soft delete support |

#### `sub_categories`

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment |
| name | TEXT NOT NULL | e.g., "Snacks", "Mutual Fund" |
| category_id | INTEGER NOT NULL | FK to categories.id |
| is_active | INTEGER DEFAULT 1 | Soft delete support |
| | | UNIQUE(name, category_id) |

#### `transactions`

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment |
| date | TEXT NOT NULL | ISO 8601 date (YYYY-MM-DD) |
| category_id | INTEGER NOT NULL | FK to categories.id |
| sub_category_id | INTEGER NOT NULL | FK to sub_categories.id |
| transaction_type | TEXT NOT NULL | "credit" or "debit" |
| fund_id | INTEGER NOT NULL | FK to funds.id |
| account_id | INTEGER NOT NULL | FK to accounts.id |
| amount | INTEGER NOT NULL | Amount in paisa (always positive) |
| comments | TEXT | Optional free-text notes |
| transfer_id | TEXT | Shared UUID linking paired transfer rows (nullable) |
| created_at | TEXT NOT NULL | ISO 8601 timestamp |
| updated_at | TEXT NOT NULL | ISO 8601 timestamp |

**Indexes:**
- `idx_transactions_date` on (date)
- `idx_transactions_category` on (category_id)
- `idx_transactions_fund` on (fund_id)
- `idx_transactions_account` on (account_id)
- `idx_transactions_transfer` on (transfer_id)
- `idx_transactions_date_category` on (date, category_id)

### 3.4 Computed Views (No Stored Data)

**Balance Sheet:** `SELECT fund_id, account_id, SUM(CASE WHEN transaction_type='credit' THEN amount ELSE -amount END) AS balance FROM transactions GROUP BY fund_id, account_id`

**Lend/Borrow:** `SELECT sub_category_id, SUM(CASE WHEN transaction_type='debit' THEN amount ELSE -amount END) AS outstanding FROM transactions WHERE category = 'Lend' GROUP BY sub_category_id`

**Credit Card Annual Spend:** `SELECT account_id, SUM(amount) FROM transactions WHERE transaction_type='debit' AND date BETWEEN fy_start AND fy_end GROUP BY account_id` (filtered to credit card accounts)

---

## 4. User Interface

### 4.1 Navigation

**Bottom navigation bar** with 4 tabs:

| Tab | Icon | Content |
|-----|------|---------|
| Home | Dashboard icon | Dashboard + quick-access buttons |
| Transactions | List icon | Transaction list with filters |
| Balance | Wallet icon | Balance views (3 sub-tabs) |
| Analytics | Chart icon | Charts and trends |

**Settings** accessible via gear icon in the top-right corner of any screen.

### 4.2 Home (Dashboard)

Displays at a glance:
- **Sync status** — "Last synced: 2 min ago" or "Offline — changes saved locally"
- **Fund balances** — cards showing total balance per fund (non-zero funds only)
- **Monthly spend summary** — total spent this month, top 3 categories
- **Quick-access buttons** — "Add Transaction" and "Transfer" (prominent, easy to tap)

### 4.3 Transactions

#### 4.3.1 Transaction List

- Scrollable list of transactions, newest first
- **Card-based UI**: each card shows Date, Category, Amount, Account (collapsed)
- **Tap to expand**: shows all fields (Sub-Category, Fund, Transaction Type, Comments) + Edit/Delete buttons
- **Transfer groups**: transactions sharing a `transfer_id` display as a grouped card showing all legs together

#### 4.3.2 Filters

- Date range (with presets: This Month, This FY, Last Month, Custom)
- Category (multi-select)
- Fund (multi-select)
- Account (multi-select)
- Transaction Type (Credit / Debit / All)

#### 4.3.3 Add Transaction Form

Full form with all fields:

| Field | Input Type | Default |
|-------|-----------|---------|
| Date | Date picker | Today |
| Category | Dropdown (from categories table) | None |
| Sub-Category | Dropdown (filtered by selected category) | None |
| Transaction Type | Toggle: Credit / Debit | Debit |
| Fund | Dropdown (from funds table) | None |
| Account | Dropdown (from accounts table) | None |
| Amount | Numeric input (₹) | Empty |
| Comments | Text input | Empty |

#### 4.3.4 Edit Transaction

- Tap transaction card → expand → tap Edit
- Opens the Add Transaction form pre-filled with existing values
- Save updates the record in place

#### 4.3.5 Delete Transaction

- Tap transaction card → expand → tap Delete → confirmation dialog
- For transfer groups: deleting any leg prompts "Delete all X legs of this transfer?" → deletes all linked rows

### 4.4 Transfer Form

Single form that handles all transfer types:

```
┌─ Transfer ────────────────────────────┐
│                                        │
│  Source Fund:     [Dropdown]           │
│  Source Account:  [Dropdown]           │
│  Dest Fund:      [Dropdown]           │
│  Dest Account:   [Dropdown]           │
│  Amount:         [₹         ]         │
│  Date:           [Today     ]         │
│  Comments:       [           ]         │
│                                        │
│  [+ Add another leg]                  │
│                                        │
│  [Save Transfer]                       │
└────────────────────────────────────────┘
```

- **Simple transfer (2 rows):** Fill once, save. Generates 1 debit + 1 credit with shared `transfer_id`.
- **Multi-leg transfer (4+ rows):** Tap "+ Add another leg" to add additional source→dest pairs. All legs share the same `transfer_id`.
- **Edit transfer:** Opens the transfer form with all legs pre-filled.
- **Transfer types supported:**
  - Inter-account, same fund (e.g., HDFC → Slice within Opportunity Fund)
  - Inter-fund, same account (e.g., Monthly Expense Fund → Expense Saving Fund within Slice)
  - Inter-fund, inter-account (e.g., Income Fund/HDFC → Monthly Expense Fund/Slice)
  - Multi-leg balance cleanup (4 rows — two 2-row transfers linked together)

### 4.5 Balance

Three sub-tabs within the Balance screen:

#### 4.5.1 By Account (Default)

Account-centric cards. Each card shows:
- Account name + computed total balance (prominently displayed)
- Fund breakdown (only non-zero funds listed)
- **Reconciliation input**: "Actual balance" field for audit comparison
  - Shows difference (App balance - Actual balance)
  - Actions during reconciliation:
    - "Add Missing Transaction" → opens transaction form, difference updates on return
    - "Settle Difference" → opens pre-filled transaction form (Category: Other, Sub-Category: Other, amount = difference, user picks fund)
  - Actual balance input editable at any time during reconciliation session
  - "Exit Reconciliation" clears the input

#### 4.5.2 By Fund

Fund-centric cards. Each card shows:
- Fund name + total balance across all accounts
- Account breakdown (only non-zero accounts listed)

#### 4.5.3 Matrix

Full Fund × Account grid:
- Funds as rows, Accounts as columns
- Horizontally scrollable on mobile
- Fund total as last column
- Account total as last row
- Matches the current spreadsheet Balance sheet layout

### 4.6 Analytics

#### 4.6.1 Monthly Dashboard

- **Total spend this month** — sum of all debits (excluding transfers and savings allocations)
- **Spend by category** — bar chart or pie chart
- **Budget vs actual** — if budget data exists, show comparison (budget data is static reference, not enforced)
- **Fund utilization** — how much of each expense fund was used this month

#### 4.6.2 Trends

- **Month-over-month total spending** — line chart across months
- **Category trends** — line chart per category over time
- **Savings rate** — percentage of income invested per month
- **Cashback/rewards earned** — sum of cashback category credits per month
- **Credit card annual spend** — total debit amount per credit card account per FY (for fee waiver tracking)

#### 4.6.3 Time Filters

All analytics views support three time scopes:
- **This Month** — current calendar month
- **This Year** — January 1 to December 31
- **This FY** — April 1 to March 31

Custom date range picker also available.

### 4.7 Settings

Manage reference data (replaces the Meta sheet):

- **Accounts** — Add, edit, deactivate accounts. Fields: name, type (bank/credit_card/wallet/cash/investment)
- **Funds** — Add, edit, deactivate funds. Fields: name
- **Categories** — Add, edit, deactivate categories. Fields: name
- **Sub-Categories** — Add, edit, deactivate sub-categories. Fields: name, parent category

Deactivated items are hidden from dropdowns but preserved in historical transactions.

---

## 5. Data Seed

### 5.1 Source

FY26-27 transaction data from the CSV file: `Expense Tracker - FY26-27 - Regular Transactions.csv`

### 5.2 Seed Process

- **Meta data extraction:** Parse unique Categories, Sub-Categories, Funds, and Accounts from the CSV to populate reference tables
- **Amount parsing:** Strip `₹` symbol and commas, convert to paisa integers
- **Date parsing:** Convert `D-MMM-YYYY` format (e.g., "1-Apr-2026") to ISO 8601 (`2026-04-01`)
- **Transfer pairing:** Detect transfer pairs by consecutive rows with:
  - Same date
  - Category = "Transfer" or matching paired categories (Expense, Savings)
  - Same amount
  - One Debit + one Credit
  - Assign shared `transfer_id` (UUID) to paired rows
- **Account type inference:** Map known accounts to types:
  - Bank: HDFC, BOB, SBI, Jupiter Money, Fi Money
  - Credit Card: Slice Credit Card, HSBC Credit Card, SBI Credit Card, Suryoday Credit Card, Amazon ICICI Card, HDFC Credit Card
  - Wallet: Amazon Pay, Paytm Wallet, Phonepe, Paytm Bank
  - Cash: Cash
  - Investment: Mutual Fund, Share, Fixed Deposit, Public Provident Fund, Sovereign Gold Bond

### 5.3 Budget Data

Monthly budget allocations from the Budget sheet:
- Maid Charges: ₹3,000
- Monthly Expense: ₹7,000
- Annual Expense: ₹2,000
- Travel Expense: ₹5,000
- Pocket Money: ₹5,000
- Mutual Fund SIP: ₹1,35,000

Stored as static reference data, not enforced.

---

## 6. Future Considerations

These items are explicitly deferred but the architecture should not preclude them:

### 6.1 LLM Integration

- Local LLM via Ollama (localhost:11434) for ad-hoc analysis
- SQL query generation from natural language
- Trend detection and spending recommendations
- The data layer (SQLite) is already LLM-friendly — queries produce structured results that can be formatted as LLM context

### 6.2 Alerting & Validation Rules

- Configurable rules engine (e.g., "Fund X balance should be ≥ 0")
- Dashboard indicators (✓/✗) for rule compliance
- Architecture note: all balance data is computed via SQL, so adding rule evaluation is a thin layer on top

### 6.3 Goals Tracking

- Goals table: name, target amount, linked fund, target date
- Progress visualization (current balance / target)

### 6.4 Smart Defaults

- Learn common fund+account patterns per category
- Quick-entry mode for frequent transaction types
