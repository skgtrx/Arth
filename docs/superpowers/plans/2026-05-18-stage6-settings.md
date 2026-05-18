# Stage 6: Settings (Meta Data Management) — Implementation Plan

**Date:** 2026-05-18
**Stage:** 6 of 13 (IMPLEMENTATION_PLAN.md)

---

## Overview

Build the Settings page for managing reference data: accounts, funds, categories, and sub-categories. The page uses horizontal tabs to switch between four CRUD sections. Each section supports listing items, adding new ones via a modal form, inline editing, and soft-deleting (deactivation). Deactivated items are hidden from dropdowns in future transaction/transfer forms but remain in historical data.

This is pure CRUD with no complex business logic. All SQL queries already exist in `src/db/queries.ts`. All UI primitives (Button, Card, Modal, Input, Select, Toggle, Badge) already exist in `src/components/ui/`.

---

## Files to Create/Modify

| Action | File Path | Purpose |
|--------|-----------|---------|
| **Modify** | `src/pages/Settings.tsx` | Replace placeholder with full Settings page (tabs + section routing) |
| **Create** | `src/pages/settings/AccountsSection.tsx` | Accounts list + add/edit modal |
| **Create** | `src/pages/settings/FundsSection.tsx` | Funds list + add/edit modal |
| **Create** | `src/pages/settings/CategoriesSection.tsx` | Categories list + add/edit modal |
| **Create** | `src/pages/settings/SubCategoriesSection.tsx` | Sub-categories list grouped by parent + add/edit modal |
| **Create** | `src/pages/settings/EntityList.tsx` | Shared list component used by all four sections |
| **Create** | `src/pages/settings/index.ts` | Barrel export for settings components |

**No changes needed to:**
- `src/db/queries.ts` — all CRUD functions exist (getAllAccounts, createAccount, updateAccount, deactivateAccount, etc.)
- `src/types/index.ts` — all types exist (Account, Fund, Category, SubCategory, CreateAccountInput, etc.)
- `src/components/ui/` — all primitives exist
- `src/App.tsx` — route already configured for `/settings`
- `src/context/DatabaseContext.tsx` — `persistDatabase` already exposed

---

## Design Decisions

### Tabs vs accordion vs separate pages
**Decision: Horizontal scrollable tabs** at the top of the Settings page.
- Why: Flat navigation is faster for a page with only 4 sections. Accordion requires extra taps to collapse/expand. Separate pages would require new routes and complicate back navigation.
- Tabs render as horizontally scrollable pill-style buttons. Active tab gets `bg-accent text-white`, inactive tabs get `bg-surface-overlay text-text-secondary`.

### Inline edit vs modal edit
**Decision: Modal for both add and edit.**
- Why: On mobile, inline editing is cramped and error-prone, especially for Accounts which have two fields (name + type). A modal provides a clean, focused form with clear Save/Cancel actions. The same modal component serves both add and edit modes — passing an existing entity pre-fills the form.

### EntityList — shared or duplicated?
**Decision: Shared `EntityList` component** for rendering lists of items.
- Why: All four sections render items identically (name on the left, action buttons on the right, Badge for inactive items). A shared component eliminates 80% of the duplication. Each section only needs to provide: the item list, the column display logic, and the modal form content.

### Deactivation UX
**Decision: Toggle inside the edit modal**, not a separate button in the list.
- Why: Deactivation is an infrequent operation. Putting a toggle directly in the list risks accidental taps on mobile. Inside the edit modal, the user has explicit Save/Cancel control. A `Badge variant="warning"` labeled "Inactive" appears next to deactivated items in the list.

### Reactivation
**Decision: Deactivated items remain visible in the settings list** (with an "Inactive" badge) and can be reactivated by editing and toggling the active state back on.
- Why: If deactivated items were hidden, there'd be no way to reactivate them.

---

## Implementation Tasks

### Task 1: Create EntityList shared component

**File:** `src/pages/settings/EntityList.tsx`

Create a reusable list component that all four sections use. Props:

```typescript
interface EntityListProps<T> {
  items: T[];
  getId: (item: T) => number;
  getName: (item: T) => string;
  getIsActive: (item: T) => boolean;
  getSubtitle?: (item: T) => string | undefined;
  onEdit: (item: T) => void;
  onAdd: () => void;
  addLabel: string;
}
```

Renders:
- A `Button variant="primary"` at the top: `+ {addLabel}` (e.g., "+ Add Account")
- For each item: a `Card` with:
  - Left side: item name (bold) + optional subtitle (text-secondary, smaller) + `Badge variant="warning"` saying "Inactive" if `!isActive`
  - Right side: a `Button variant="ghost" size="sm"` with "Edit" text
- Empty state: if `items.length === 0`, show a centered text-muted message

Use `min-h-touch` on each card row for 44px touch targets. Items are rendered in the order provided (already sorted by name from the query).

**Dependencies:** None

---

### Task 2: Build AccountsSection

**File:** `src/pages/settings/AccountsSection.tsx`

A component that:
1. Reads all accounts via `getAllAccounts(db)` (no `activeOnly` filter — settings shows everything)
2. Renders `EntityList` with accounts, showing `type` as subtitle (formatted as human-readable label: "Bank", "Credit Card", "Wallet", "Cash", "Investment")
3. Has a `Modal` for add/edit with:
   - `Input label="Account Name"` for the name
   - `Select label="Type"` with the 5 account type options
   - `Toggle label="Active"` (only shown in edit mode)
   - `Button variant="primary"` "Save" and `Button variant="ghost"` "Cancel" in footer
4. On save (add): calls `createAccount(db, { name, type })` then `persistDatabase()`
5. On save (edit): calls `updateAccount(db, id, { name, type, isActive })` then `persistDatabase()`
6. Refreshes the list after every mutation by re-querying

State management: `useState` for the list of accounts, the modal open/closed state, and the currently editing account (null for add mode). A `refreshAccounts()` function queries the DB and sets state.

Account type display labels map:
```
bank → "Bank"
credit_card → "Credit Card"
wallet → "Wallet"
cash → "Cash"
investment → "Investment"
```

**Dependencies:** Task 1

---

### Task 3: Build FundsSection

**File:** `src/pages/settings/FundsSection.tsx`

Same pattern as AccountsSection but simpler — funds only have a `name` field:
1. Reads all funds via `getAllFunds(db)`
2. Renders `EntityList` (no subtitle needed)
3. Modal for add/edit: `Input label="Fund Name"` + `Toggle label="Active"` (edit only) + Save/Cancel
4. Add: `createFund(db, { name })` then `persistDatabase()`
5. Edit: `updateFund(db, id, { name, isActive })` then `persistDatabase()`

**Dependencies:** Task 1

---

### Task 4: Build CategoriesSection

**File:** `src/pages/settings/CategoriesSection.tsx`

Same pattern as FundsSection:
1. Reads all categories via `getAllCategories(db)`
2. Renders `EntityList` (no subtitle)
3. Modal: `Input label="Category Name"` + `Toggle label="Active"` (edit only) + Save/Cancel
4. Add: `createCategory(db, { name })` then `persistDatabase()`
5. Edit: `updateCategory(db, id, { name, isActive })` then `persistDatabase()`

**Dependencies:** Task 1

---

### Task 5: Build SubCategoriesSection

**File:** `src/pages/settings/SubCategoriesSection.tsx`

More complex because sub-categories are grouped by parent category:
1. Reads all categories via `getAllCategories(db)` and all sub-categories via `getSubCategories(db)`
2. Groups sub-categories by `categoryId`
3. Renders a section per category: category name as a heading, then `EntityList` for the sub-categories under it
   - Each sub-category shows its parent category name as subtitle
4. "Add Sub-Category" button at the top (one global add button, not per-category)
5. Modal for add/edit:
   - `Select label="Parent Category"` — lists only active categories
   - `Input label="Sub-Category Name"`
   - `Toggle label="Active"` (edit only)
   - Save/Cancel
6. Add: `createSubCategory(db, { name, categoryId })` then `persistDatabase()`
7. Edit: `updateSubCategory(db, id, { name, categoryId, isActive })` then `persistDatabase()`

The grouping display: for each category (sorted alphabetically), render a heading with the category name, then all sub-categories under it using a simple list (not EntityList — since each group needs its own heading). Actually, keep it simpler: render a flat `EntityList` with the parent category name as the `subtitle` for each sub-category. This avoids complex nested rendering.

**Decision: Flat list with parent category as subtitle**, not grouped sections. Simpler to build, and the alphabetical sort by name still groups similar items visually.

**Dependencies:** Task 1

---

### Task 6: Build Settings page with tabs

**File:** `src/pages/Settings.tsx`

Replace the placeholder with the full Settings page:
1. Horizontal tab bar at the top with 4 tabs: "Accounts", "Funds", "Categories", "Sub-Categories"
2. Active tab state managed via `useState`, default to "Accounts"
3. Renders the corresponding section component based on active tab
4. Gets `db` and `persistDatabase` from `useDatabase()` hook, passes them as props to each section

Tab bar styling:
- Container: `flex gap-2 overflow-x-auto py-4` with `-webkit-overflow-scrolling: touch` for smooth mobile scrolling
- Each tab: `Button` with `variant="primary"` for active, `variant="secondary"` for inactive, `size="sm"`, `whitespace-nowrap` to prevent text wrapping

Page structure:
```
<div className="space-y-4 py-4">
  <h2 className="text-2xl font-bold">Settings</h2>
  <TabBar />
  <ActiveSectionComponent db={db} persistDatabase={persistDatabase} />
</div>
```

**Dependencies:** Tasks 2, 3, 4, 5

---

### Task 7: Create barrel export

**File:** `src/pages/settings/index.ts`

Export all section components:
```typescript
export { default as AccountsSection } from './AccountsSection';
export { default as FundsSection } from './FundsSection';
export { default as CategoriesSection } from './CategoriesSection';
export { default as SubCategoriesSection } from './SubCategoriesSection';
```

**Dependencies:** Tasks 2, 3, 4, 5

---

### Task 8: Verify deactivated items are filtered in existing queries

**File:** No file changes needed — this is a verification task.

Verify that `getAllAccounts(db, true)`, `getAllFunds(db, true)`, `getAllCategories(db, true)`, and `getSubCategories(db, categoryId, true)` all correctly filter out deactivated items. These `activeOnly=true` calls will be used by future transaction/transfer forms (Stage 7).

The queries already support this via the `activeOnly` parameter. Confirm by reading `src/db/queries.ts` lines 111-116 (accounts), 144-149 (funds), 174-179 (categories), 200-209 (sub-categories). Each adds `WHERE is_active = 1` when `activeOnly` is true.

**Result:** No code changes required for task 6.6. The `activeOnly` parameter in all four query functions already handles this correctly. Stage 7 (transaction forms) just needs to pass `activeOnly: true` when populating dropdowns.

**Dependencies:** None

---

## Task Execution Order

```
Task 1 (EntityList)
  ├──▶ Task 2 (Accounts)
  ├──▶ Task 3 (Funds)
  ├──▶ Task 4 (Categories)
  └──▶ Task 5 (SubCategories)
           └──▶ Task 6 (Settings page with tabs)
                  └──▶ Task 7 (Barrel export)

Task 8 (Verification) — independent, can run in parallel
```

Tasks 2, 3, 4, 5 can be implemented in parallel after Task 1.
Task 6 depends on all section components existing.
Task 7 is trivial and can be done alongside Task 6.
Task 8 is a read-only verification with no code changes.

---

## Form Validation Rules

All sections share these validation rules:
- **Name is required** — trim whitespace, reject empty strings
- **Name must be unique** — check against existing items in the list (case-insensitive). Show `error` prop on the Input if duplicate detected.
- **Type is required** (Accounts only) — cannot submit without selecting a type
- **Parent category is required** (Sub-Categories only) — cannot submit without selecting a parent

Validation is client-side only. The database has UNIQUE constraints that will also catch duplicates, but showing an inline error is better UX.

---

## Props Pattern

Each section component receives:
```typescript
interface SectionProps {
  db: Database;
  persistDatabase: () => Promise<void>;
}
```

This keeps the sections as pure components that receive their dependencies. The Settings page (Task 6) gets `db` and `persistDatabase` from `useDatabase()` and passes them down.
