import type { Database } from 'sql.js';
import type {
  Account, Fund, Category, SubCategory, Transaction,
  CreateAccountInput, UpdateAccountInput,
  CreateFundInput, UpdateFundInput,
  CreateCategoryInput, UpdateCategoryInput,
  CreateSubCategoryInput, UpdateSubCategoryInput,
  CreateTransactionInput, UpdateTransactionInput,
  TransactionFilters, BalanceCell, CategorySpend,
  MonthlyTrend, CategoryTrend, LendBorrowEntry,
  CreditCardSpend, SavingsRate, CashbackSummary,
  AccountType, TransactionType,
} from '@/types';
import { nowISO } from '@/utils/date';

function queryAll<T>(db: Database, sql: string, params: unknown[] = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

function queryOne<T>(db: Database, sql: string, params: unknown[] = []): T | null {
  const results = queryAll<T>(db, sql, params);
  return results.length > 0 ? results[0] : null;
}

function lastInsertId(db: Database): number {
  return db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number;
}

type Row = Record<string, unknown>;

function buildUpdate(
  table: string,
  id: number,
  fieldMap: Record<string, unknown>,
  boolFields: Set<string> = new Set(),
): { sql: string; params: unknown[] } | null {
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [key, value] of Object.entries(fieldMap)) {
    if (value === undefined) continue;
    sets.push(`${key} = ?`);
    params.push(boolFields.has(key) ? (value ? 1 : 0) : value);
  }
  if (sets.length === 0) return null;
  params.push(id);
  return { sql: `UPDATE ${table} SET ${sets.join(', ')} WHERE id = ?`, params };
}

function mapAccount(row: Row): Account {
  return {
    id: row.id as number,
    name: row.name as string,
    type: row.type as AccountType,
    isActive: row.is_active === 1,
    createdAt: row.created_at as string,
  };
}

function mapFund(row: Row): Fund {
  return {
    id: row.id as number,
    name: row.name as string,
    isActive: row.is_active === 1,
    createdAt: row.created_at as string,
  };
}

function mapCategory(row: Row): Category {
  return {
    id: row.id as number,
    name: row.name as string,
    isActive: row.is_active === 1,
  };
}

function mapSubCategory(row: Row): SubCategory {
  return {
    id: row.id as number,
    name: row.name as string,
    categoryId: row.category_id as number,
    isActive: row.is_active === 1,
  };
}

function mapTransaction(row: Row): Transaction {
  return {
    id: row.id as number,
    date: row.date as string,
    categoryId: row.category_id as number,
    subCategoryId: row.sub_category_id as number,
    transactionType: row.transaction_type as TransactionType,
    fundId: row.fund_id as number,
    accountId: row.account_id as number,
    amount: row.amount as number,
    comments: (row.comments as string) ?? null,
    transferId: (row.transfer_id as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ─── Account CRUD ────────────────────────────────────

export function getAllAccounts(db: Database, activeOnly = false): Account[] {
  const sql = activeOnly
    ? 'SELECT * FROM accounts WHERE is_active = 1 ORDER BY name'
    : 'SELECT * FROM accounts ORDER BY name';
  return queryAll<Row>(db, sql).map(mapAccount);
}

export function getAccountById(db: Database, id: number): Account | null {
  const row = queryOne<Row>(db, 'SELECT * FROM accounts WHERE id = ?', [id]);
  return row ? mapAccount(row) : null;
}

export function createAccount(db: Database, input: CreateAccountInput): number {
  db.run(
    'INSERT INTO accounts (name, type, created_at) VALUES (?, ?, ?)',
    [input.name, input.type, nowISO()]
  );
  return lastInsertId(db);
}

export function updateAccount(db: Database, id: number, input: UpdateAccountInput): void {
  const update = buildUpdate('accounts', id, {
    name: input.name, type: input.type, is_active: input.isActive,
  }, new Set(['is_active']));
  if (update) db.run(update.sql, update.params);
}

export function deactivateAccount(db: Database, id: number): void {
  db.run('UPDATE accounts SET is_active = 0 WHERE id = ?', [id]);
}

// ─── Fund CRUD ───────────────────────────────────────

export function getAllFunds(db: Database, activeOnly = false): Fund[] {
  const sql = activeOnly
    ? 'SELECT * FROM funds WHERE is_active = 1 ORDER BY name'
    : 'SELECT * FROM funds ORDER BY name';
  return queryAll<Row>(db, sql).map(mapFund);
}

export function getFundById(db: Database, id: number): Fund | null {
  const row = queryOne<Row>(db, 'SELECT * FROM funds WHERE id = ?', [id]);
  return row ? mapFund(row) : null;
}

export function createFund(db: Database, input: CreateFundInput): number {
  db.run('INSERT INTO funds (name, created_at) VALUES (?, ?)', [input.name, nowISO()]);
  return lastInsertId(db);
}

export function updateFund(db: Database, id: number, input: UpdateFundInput): void {
  const update = buildUpdate('funds', id, {
    name: input.name, is_active: input.isActive,
  }, new Set(['is_active']));
  if (update) db.run(update.sql, update.params);
}

export function deactivateFund(db: Database, id: number): void {
  db.run('UPDATE funds SET is_active = 0 WHERE id = ?', [id]);
}

// ─── Category CRUD ───────────────────────────────────

export function getAllCategories(db: Database, activeOnly = false): Category[] {
  const sql = activeOnly
    ? 'SELECT * FROM categories WHERE is_active = 1 ORDER BY name'
    : 'SELECT * FROM categories ORDER BY name';
  return queryAll<Row>(db, sql).map(mapCategory);
}

export function getCategoryById(db: Database, id: number): Category | null {
  const row = queryOne<Row>(db, 'SELECT * FROM categories WHERE id = ?', [id]);
  return row ? mapCategory(row) : null;
}

export function createCategory(db: Database, input: CreateCategoryInput): number {
  db.run('INSERT INTO categories (name) VALUES (?)', [input.name]);
  return lastInsertId(db);
}

export function updateCategory(db: Database, id: number, input: UpdateCategoryInput): void {
  const update = buildUpdate('categories', id, {
    name: input.name, is_active: input.isActive,
  }, new Set(['is_active']));
  if (update) db.run(update.sql, update.params);
}

// ─── Sub-Category CRUD ───────────────────────────────

export function getSubCategories(db: Database, categoryId?: number, activeOnly = false): SubCategory[] {
  let sql = 'SELECT * FROM sub_categories';
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (categoryId !== undefined) { conditions.push('category_id = ?'); params.push(categoryId); }
  if (activeOnly) { conditions.push('is_active = 1'); }
  if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY name';
  return queryAll<Row>(db, sql, params).map(mapSubCategory);
}

export function getSubCategoryById(db: Database, id: number): SubCategory | null {
  const row = queryOne<Row>(db, 'SELECT * FROM sub_categories WHERE id = ?', [id]);
  return row ? mapSubCategory(row) : null;
}

export function createSubCategory(db: Database, input: CreateSubCategoryInput): number {
  db.run(
    'INSERT INTO sub_categories (name, category_id) VALUES (?, ?)',
    [input.name, input.categoryId]
  );
  return lastInsertId(db);
}

export function updateSubCategory(db: Database, id: number, input: UpdateSubCategoryInput): void {
  const update = buildUpdate('sub_categories', id, {
    name: input.name, category_id: input.categoryId, is_active: input.isActive,
  }, new Set(['is_active']));
  if (update) db.run(update.sql, update.params);
}

// ─── Transaction CRUD ────────────────────────────────

export function getTransactions(db: Database, filters?: TransactionFilters): Transaction[] {
  let sql = 'SELECT * FROM transactions';
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters) {
    if (filters.startDate) { conditions.push('date >= ?'); params.push(filters.startDate); }
    if (filters.endDate) { conditions.push('date <= ?'); params.push(filters.endDate); }
    if (filters.transactionType) { conditions.push('transaction_type = ?'); params.push(filters.transactionType); }
    if (filters.transferId) { conditions.push('transfer_id = ?'); params.push(filters.transferId); }
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      conditions.push(`category_id IN (${filters.categoryIds.map(() => '?').join(',')})`);
      params.push(...filters.categoryIds);
    }
    if (filters.fundIds && filters.fundIds.length > 0) {
      conditions.push(`fund_id IN (${filters.fundIds.map(() => '?').join(',')})`);
      params.push(...filters.fundIds);
    }
    if (filters.accountIds && filters.accountIds.length > 0) {
      conditions.push(`account_id IN (${filters.accountIds.map(() => '?').join(',')})`);
      params.push(...filters.accountIds);
    }
  }

  if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY date DESC, id DESC';

  return queryAll<Row>(db, sql, params).map(mapTransaction);
}

export function getTransactionById(db: Database, id: number): Transaction | null {
  const row = queryOne<Row>(db, 'SELECT * FROM transactions WHERE id = ?', [id]);
  return row ? mapTransaction(row) : null;
}

export function getTransferGroup(db: Database, transferId: string): Transaction[] {
  return queryAll<Row>(
    db,
    'SELECT * FROM transactions WHERE transfer_id = ? ORDER BY id',
    [transferId]
  ).map(mapTransaction);
}

export function createTransaction(db: Database, input: CreateTransactionInput): number {
  const now = nowISO();
  db.run(
    `INSERT INTO transactions (date, category_id, sub_category_id, transaction_type, fund_id, account_id, amount, comments, transfer_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [input.date, input.categoryId, input.subCategoryId, input.transactionType,
     input.fundId, input.accountId, input.amount, input.comments ?? null,
     input.transferId ?? null, now, now]
  );
  return lastInsertId(db);
}

export function updateTransaction(db: Database, id: number, input: UpdateTransactionInput): void {
  const update = buildUpdate('transactions', id, {
    date: input.date, category_id: input.categoryId, sub_category_id: input.subCategoryId,
    transaction_type: input.transactionType, fund_id: input.fundId, account_id: input.accountId,
    amount: input.amount, comments: input.comments,
  });
  if (!update) return;
  const sql = update.sql.replace(' WHERE', ', updated_at = ? WHERE');
  update.params.splice(update.params.length - 1, 0, nowISO());
  db.run(sql, update.params);
}

export function deleteTransaction(db: Database, id: number): void {
  db.run('DELETE FROM transactions WHERE id = ?', [id]);
}

export function deleteTransferGroup(db: Database, transferId: string): void {
  db.run('DELETE FROM transactions WHERE transfer_id = ?', [transferId]);
}

// ─── Balance Computations ────────────────────────────

export function getBalanceMatrix(db: Database): BalanceCell[] {
  return queryAll<BalanceCell>(
    db,
    `SELECT fund_id AS fundId, account_id AS accountId,
       SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE -amount END) AS balance
     FROM transactions
     GROUP BY fund_id, account_id
     HAVING balance != 0`
  );
}

export function getAccountTotals(db: Database): { accountId: number; total: number }[] {
  return queryAll(
    db,
    `SELECT account_id AS accountId,
       SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE -amount END) AS total
     FROM transactions
     GROUP BY account_id`
  );
}

export function getFundTotals(db: Database): { fundId: number; total: number }[] {
  return queryAll(
    db,
    `SELECT fund_id AS fundId,
       SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE -amount END) AS total
     FROM transactions
     GROUP BY fund_id`
  );
}

export function getLendBorrowBalances(db: Database): LendBorrowEntry[] {
  return queryAll(
    db,
    `SELECT sc.id AS subCategoryId, sc.name AS personName,
       SUM(CASE WHEN t.transaction_type = 'debit' THEN t.amount ELSE -t.amount END) AS outstanding
     FROM transactions t
     JOIN sub_categories sc ON t.sub_category_id = sc.id
     JOIN categories c ON t.category_id = c.id
     WHERE c.name IN ('Lend', 'Borrow')
     GROUP BY sc.id, sc.name
     HAVING outstanding != 0`
  );
}

// ─── Analytics Queries ───────────────────────────────

export function getSpendByCategory(db: Database, startDate: string, endDate: string): CategorySpend[] {
  return queryAll(
    db,
    `SELECT c.id AS categoryId, c.name AS categoryName,
       SUM(t.amount) AS total
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     WHERE t.transaction_type = 'debit'
       AND t.transfer_id IS NULL
       AND t.date BETWEEN ? AND ?
     GROUP BY c.id, c.name
     ORDER BY total DESC`,
    [startDate, endDate]
  );
}

export function getMonthlySpendTrend(db: Database, startDate: string, endDate: string): MonthlyTrend[] {
  return queryAll(
    db,
    `SELECT SUBSTR(date, 1, 7) AS month,
       SUM(amount) AS total
     FROM transactions
     WHERE transaction_type = 'debit'
       AND transfer_id IS NULL
       AND date BETWEEN ? AND ?
     GROUP BY SUBSTR(date, 1, 7)
     ORDER BY month`,
    [startDate, endDate]
  );
}

export function getCategoryTrend(db: Database, startDate: string, endDate: string): CategoryTrend[] {
  return queryAll(
    db,
    `SELECT SUBSTR(t.date, 1, 7) AS month,
       c.id AS categoryId, c.name AS categoryName,
       SUM(t.amount) AS total
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     WHERE t.transaction_type = 'debit'
       AND t.transfer_id IS NULL
       AND t.date BETWEEN ? AND ?
     GROUP BY SUBSTR(t.date, 1, 7), c.id, c.name
     ORDER BY month, total DESC`,
    [startDate, endDate]
  );
}

export function getSavingsRate(db: Database, startDate: string, endDate: string): SavingsRate[] {
  const income = queryAll<{ month: string; total: number }>(
    db,
    `SELECT SUBSTR(date, 1, 7) AS month, SUM(amount) AS total
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     WHERE c.name = 'Salary' AND t.transaction_type = 'credit'
       AND t.date BETWEEN ? AND ?
     GROUP BY SUBSTR(date, 1, 7)`,
    [startDate, endDate]
  );

  const savings = queryAll<{ month: string; total: number }>(
    db,
    `SELECT SUBSTR(date, 1, 7) AS month, SUM(amount) AS total
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     WHERE c.name = 'Savings' AND t.transaction_type = 'debit'
       AND t.date BETWEEN ? AND ?
     GROUP BY SUBSTR(date, 1, 7)`,
    [startDate, endDate]
  );

  const savingsMap = new Map(savings.map(s => [s.month, s.total]));
  return income.map(i => {
    const s = savingsMap.get(i.month) ?? 0;
    return {
      month: i.month,
      income: i.total,
      savings: s,
      rate: i.total > 0 ? (s / i.total) * 100 : 0,
    };
  });
}

export function getCashbackByMonth(db: Database, startDate: string, endDate: string): CashbackSummary[] {
  return queryAll(
    db,
    `SELECT SUBSTR(t.date, 1, 7) AS month, SUM(t.amount) AS total
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     WHERE c.name = 'Cashback' AND t.transaction_type = 'credit'
       AND t.date BETWEEN ? AND ?
     GROUP BY SUBSTR(t.date, 1, 7)
     ORDER BY month`,
    [startDate, endDate]
  );
}

export function getCreditCardAnnualSpend(db: Database, startDate: string, endDate: string): CreditCardSpend[] {
  return queryAll(
    db,
    `SELECT a.id AS accountId, a.name AS accountName,
       SUM(t.amount) AS totalSpend
     FROM transactions t
     JOIN accounts a ON t.account_id = a.id
     WHERE a.type = 'credit_card'
       AND t.transaction_type = 'debit'
       AND t.date BETWEEN ? AND ?
     GROUP BY a.id, a.name`,
    [startDate, endDate]
  );
}
