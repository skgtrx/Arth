import { describe, it, expect, beforeEach } from 'vitest';
import initSqlJs, { type Database } from 'sql.js';
import { createSchema } from '../schema';
import {
  createAccount, getAllAccounts, getAccountById, updateAccount, deactivateAccount,
  createFund, getFundById, updateFund, deactivateFund,
  createCategory, getAllCategories, getCategoryById, updateCategory,
  createSubCategory, getSubCategories, getSubCategoryById, updateSubCategory,
  createTransaction, getTransactions, getTransactionById, updateTransaction, deleteTransaction,
  getTransferGroup, deleteTransferGroup,
  getBalanceMatrix, getAccountTotals, getFundTotals, getLendBorrowBalances,
  getSpendByCategory, getMonthlySpendTrend, getCreditCardAnnualSpend,
  getSavingsRate,
} from '../queries';

let db: Database;

beforeEach(async () => {
  const SQL = await initSqlJs();
  db = new SQL.Database();
  createSchema(db);
  db.run('PRAGMA foreign_keys=ON;');
});

function seedTestData() {
  const acctId = createAccount(db, { name: 'HDFC', type: 'bank' });
  const ccId = createAccount(db, { name: 'Slice CC', type: 'credit_card' });
  const fundId = createFund(db, { name: 'Income Fund' });
  const fund2Id = createFund(db, { name: 'Expense Fund' });
  const catId = createCategory(db, { name: 'Food' });
  const salaryId = createCategory(db, { name: 'Salary' });
  const savingsId = createCategory(db, { name: 'Savings' });
  const transferCatId = createCategory(db, { name: 'Transfer' });
  const lendCatId = createCategory(db, { name: 'Lend' });
  const scId = createSubCategory(db, { name: 'Dinner', categoryId: catId });
  const salaryScId = createSubCategory(db, { name: 'Zocdoc', categoryId: salaryId });
  const savingsScId = createSubCategory(db, { name: 'Mutual Fund', categoryId: savingsId });
  const transferScId = createSubCategory(db, { name: 'Transfer', categoryId: transferCatId });
  const lendScId = createSubCategory(db, { name: 'Gaurav', categoryId: lendCatId });
  return { acctId, ccId, fundId, fund2Id, catId, salaryId, savingsId, transferCatId, lendCatId, scId, salaryScId, savingsScId, transferScId, lendScId };
}

describe('Account CRUD', () => {
  it('creates and reads an account', () => {
    const id = createAccount(db, { name: 'HDFC', type: 'bank' });
    const account = getAccountById(db, id);
    expect(account).not.toBeNull();
    expect(account!.name).toBe('HDFC');
    expect(account!.type).toBe('bank');
    expect(account!.isActive).toBe(true);
  });

  it('lists all accounts', () => {
    createAccount(db, { name: 'HDFC', type: 'bank' });
    createAccount(db, { name: 'SBI', type: 'bank' });
    expect(getAllAccounts(db)).toHaveLength(2);
  });

  it('filters active-only accounts', () => {
    const id = createAccount(db, { name: 'HDFC', type: 'bank' });
    createAccount(db, { name: 'SBI', type: 'bank' });
    deactivateAccount(db, id);
    expect(getAllAccounts(db, true)).toHaveLength(1);
    expect(getAllAccounts(db, false)).toHaveLength(2);
  });

  it('updates an account', () => {
    const id = createAccount(db, { name: 'HDFC', type: 'bank' });
    updateAccount(db, id, { name: 'HDFC Bank' });
    expect(getAccountById(db, id)!.name).toBe('HDFC Bank');
  });

  it('deactivates an account', () => {
    const id = createAccount(db, { name: 'HDFC', type: 'bank' });
    deactivateAccount(db, id);
    expect(getAccountById(db, id)!.isActive).toBe(false);
  });
});

describe('Fund CRUD', () => {
  it('creates and reads a fund', () => {
    const id = createFund(db, { name: 'Income Fund' });
    const fund = getFundById(db, id);
    expect(fund!.name).toBe('Income Fund');
    expect(fund!.isActive).toBe(true);
  });

  it('deactivates a fund', () => {
    const id = createFund(db, { name: 'Income Fund' });
    deactivateFund(db, id);
    expect(getFundById(db, id)!.isActive).toBe(false);
  });

  it('updates a fund', () => {
    const id = createFund(db, { name: 'Old Name' });
    updateFund(db, id, { name: 'New Name' });
    expect(getFundById(db, id)!.name).toBe('New Name');
  });
});

describe('Category CRUD', () => {
  it('creates and reads a category', () => {
    const id = createCategory(db, { name: 'Food' });
    const cat = getCategoryById(db, id);
    expect(cat!.name).toBe('Food');
  });

  it('updates a category', () => {
    const id = createCategory(db, { name: 'Food' });
    updateCategory(db, id, { isActive: false });
    expect(getCategoryById(db, id)!.isActive).toBe(false);
  });

  it('lists categories', () => {
    createCategory(db, { name: 'Food' });
    createCategory(db, { name: 'Travel' });
    expect(getAllCategories(db)).toHaveLength(2);
  });
});

describe('Sub-Category CRUD', () => {
  it('creates and reads a sub-category', () => {
    const catId = createCategory(db, { name: 'Food' });
    const scId = createSubCategory(db, { name: 'Dinner', categoryId: catId });
    const sc = getSubCategoryById(db, scId);
    expect(sc!.name).toBe('Dinner');
    expect(sc!.categoryId).toBe(catId);
  });

  it('filters by category', () => {
    const cat1 = createCategory(db, { name: 'Food' });
    const cat2 = createCategory(db, { name: 'Travel' });
    createSubCategory(db, { name: 'Dinner', categoryId: cat1 });
    createSubCategory(db, { name: 'Cab', categoryId: cat2 });
    expect(getSubCategories(db, cat1)).toHaveLength(1);
    expect(getSubCategories(db)).toHaveLength(2);
  });

  it('updates a sub-category', () => {
    const catId = createCategory(db, { name: 'Food' });
    const scId = createSubCategory(db, { name: 'Dinner', categoryId: catId });
    updateSubCategory(db, scId, { name: 'Lunch' });
    expect(getSubCategoryById(db, scId)!.name).toBe('Lunch');
  });
});

describe('Transaction CRUD', () => {
  it('creates and reads a transaction', () => {
    const { acctId, fundId, catId, scId } = seedTestData();
    const txnId = createTransaction(db, {
      date: '2026-04-01',
      categoryId: catId,
      subCategoryId: scId,
      transactionType: 'debit',
      fundId,
      accountId: acctId,
      amount: 50000,
      comments: 'Test dinner',
    });
    const txn = getTransactionById(db, txnId);
    expect(txn!.amount).toBe(50000);
    expect(txn!.transactionType).toBe('debit');
    expect(txn!.comments).toBe('Test dinner');
    expect(txn!.transferId).toBeNull();
  });

  it('updates a transaction', () => {
    const { acctId, fundId, catId, scId } = seedTestData();
    const txnId = createTransaction(db, {
      date: '2026-04-01', categoryId: catId, subCategoryId: scId,
      transactionType: 'debit', fundId, accountId: acctId, amount: 50000,
    });
    updateTransaction(db, txnId, { amount: 75000, comments: 'Updated' });
    const txn = getTransactionById(db, txnId);
    expect(txn!.amount).toBe(75000);
    expect(txn!.comments).toBe('Updated');
  });

  it('deletes a transaction', () => {
    const { acctId, fundId, catId, scId } = seedTestData();
    const txnId = createTransaction(db, {
      date: '2026-04-01', categoryId: catId, subCategoryId: scId,
      transactionType: 'debit', fundId, accountId: acctId, amount: 50000,
    });
    deleteTransaction(db, txnId);
    expect(getTransactionById(db, txnId)).toBeNull();
  });
});

describe('Transaction Filters', () => {
  it('filters by date range', () => {
    const { acctId, fundId, catId, scId } = seedTestData();
    createTransaction(db, { date: '2026-04-01', categoryId: catId, subCategoryId: scId, transactionType: 'debit', fundId, accountId: acctId, amount: 100 });
    createTransaction(db, { date: '2026-05-01', categoryId: catId, subCategoryId: scId, transactionType: 'debit', fundId, accountId: acctId, amount: 200 });
    createTransaction(db, { date: '2026-06-01', categoryId: catId, subCategoryId: scId, transactionType: 'debit', fundId, accountId: acctId, amount: 300 });

    const filtered = getTransactions(db, { startDate: '2026-04-01', endDate: '2026-05-31' });
    expect(filtered).toHaveLength(2);
  });

  it('filters by transaction type', () => {
    const { acctId, fundId, catId, scId } = seedTestData();
    createTransaction(db, { date: '2026-04-01', categoryId: catId, subCategoryId: scId, transactionType: 'debit', fundId, accountId: acctId, amount: 100 });
    createTransaction(db, { date: '2026-04-01', categoryId: catId, subCategoryId: scId, transactionType: 'credit', fundId, accountId: acctId, amount: 200 });

    const debits = getTransactions(db, { transactionType: 'debit' });
    expect(debits).toHaveLength(1);
    expect(debits[0].amount).toBe(100);
  });

  it('filters by category', () => {
    const { acctId, fundId, catId, salaryId, scId, salaryScId } = seedTestData();
    createTransaction(db, { date: '2026-04-01', categoryId: catId, subCategoryId: scId, transactionType: 'debit', fundId, accountId: acctId, amount: 100 });
    createTransaction(db, { date: '2026-04-01', categoryId: salaryId, subCategoryId: salaryScId, transactionType: 'credit', fundId, accountId: acctId, amount: 200 });

    const filtered = getTransactions(db, { categoryIds: [catId] });
    expect(filtered).toHaveLength(1);
  });

  it('filters by fund', () => {
    const { acctId, fundId, fund2Id, catId, scId } = seedTestData();
    createTransaction(db, { date: '2026-04-01', categoryId: catId, subCategoryId: scId, transactionType: 'debit', fundId, accountId: acctId, amount: 100 });
    createTransaction(db, { date: '2026-04-01', categoryId: catId, subCategoryId: scId, transactionType: 'debit', fundId: fund2Id, accountId: acctId, amount: 200 });

    const filtered = getTransactions(db, { fundIds: [fundId] });
    expect(filtered).toHaveLength(1);
  });

  it('filters by account', () => {
    const { acctId, ccId, fundId, catId, scId } = seedTestData();
    createTransaction(db, { date: '2026-04-01', categoryId: catId, subCategoryId: scId, transactionType: 'debit', fundId, accountId: acctId, amount: 100 });
    createTransaction(db, { date: '2026-04-01', categoryId: catId, subCategoryId: scId, transactionType: 'debit', fundId, accountId: ccId, amount: 200 });

    const filtered = getTransactions(db, { accountIds: [ccId] });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].amount).toBe(200);
  });
});

describe('Transfer Operations', () => {
  it('creates a transfer pair and retrieves the group', () => {
    const { acctId, ccId, fundId, transferCatId, transferScId } = seedTestData();
    const tid = 'test-transfer-001';
    createTransaction(db, { date: '2026-04-01', categoryId: transferCatId, subCategoryId: transferScId, transactionType: 'debit', fundId, accountId: acctId, amount: 500000, transferId: tid });
    createTransaction(db, { date: '2026-04-01', categoryId: transferCatId, subCategoryId: transferScId, transactionType: 'credit', fundId, accountId: ccId, amount: 500000, transferId: tid });

    const group = getTransferGroup(db, tid);
    expect(group).toHaveLength(2);
    expect(group[0].transferId).toBe(tid);
    expect(group[1].transferId).toBe(tid);
  });

  it('deletes an entire transfer group', () => {
    const { acctId, ccId, fundId, transferCatId, transferScId } = seedTestData();
    const tid = 'test-transfer-002';
    createTransaction(db, { date: '2026-04-01', categoryId: transferCatId, subCategoryId: transferScId, transactionType: 'debit', fundId, accountId: acctId, amount: 500000, transferId: tid });
    createTransaction(db, { date: '2026-04-01', categoryId: transferCatId, subCategoryId: transferScId, transactionType: 'credit', fundId, accountId: ccId, amount: 500000, transferId: tid });

    deleteTransferGroup(db, tid);
    expect(getTransferGroup(db, tid)).toHaveLength(0);
  });
});

describe('Balance Computations', () => {
  it('computes balance matrix correctly', () => {
    const { acctId, fundId, catId, scId } = seedTestData();
    createTransaction(db, { date: '2026-04-01', categoryId: catId, subCategoryId: scId, transactionType: 'credit', fundId, accountId: acctId, amount: 100000 });
    createTransaction(db, { date: '2026-04-02', categoryId: catId, subCategoryId: scId, transactionType: 'debit', fundId, accountId: acctId, amount: 30000 });

    const matrix = getBalanceMatrix(db);
    expect(matrix).toHaveLength(1);
    expect(matrix[0].balance).toBe(70000);
  });

  it('computes account totals', () => {
    const { acctId, ccId, fundId, catId, scId } = seedTestData();
    createTransaction(db, { date: '2026-04-01', categoryId: catId, subCategoryId: scId, transactionType: 'credit', fundId, accountId: acctId, amount: 100000 });
    createTransaction(db, { date: '2026-04-01', categoryId: catId, subCategoryId: scId, transactionType: 'debit', fundId, accountId: ccId, amount: 50000 });

    const totals = getAccountTotals(db);
    expect(totals).toHaveLength(2);
    const hdfc = totals.find(t => t.accountId === acctId);
    const cc = totals.find(t => t.accountId === ccId);
    expect(hdfc!.total).toBe(100000);
    expect(cc!.total).toBe(-50000);
  });

  it('computes fund totals', () => {
    const { acctId, fundId, fund2Id, catId, scId } = seedTestData();
    createTransaction(db, { date: '2026-04-01', categoryId: catId, subCategoryId: scId, transactionType: 'credit', fundId, accountId: acctId, amount: 200000 });
    createTransaction(db, { date: '2026-04-01', categoryId: catId, subCategoryId: scId, transactionType: 'debit', fundId: fund2Id, accountId: acctId, amount: 50000 });

    const totals = getFundTotals(db);
    const income = totals.find(t => t.fundId === fundId);
    const expense = totals.find(t => t.fundId === fund2Id);
    expect(income!.total).toBe(200000);
    expect(expense!.total).toBe(-50000);
  });
});

describe('Lend/Borrow Balances', () => {
  it('computes outstanding lend balances', () => {
    const { acctId, fundId, lendCatId, lendScId } = seedTestData();
    createTransaction(db, { date: '2026-04-01', categoryId: lendCatId, subCategoryId: lendScId, transactionType: 'debit', fundId, accountId: acctId, amount: 50000 });
    createTransaction(db, { date: '2026-04-15', categoryId: lendCatId, subCategoryId: lendScId, transactionType: 'credit', fundId, accountId: acctId, amount: 20000 });

    const balances = getLendBorrowBalances(db);
    expect(balances).toHaveLength(1);
    expect(balances[0].personName).toBe('Gaurav');
    expect(balances[0].outstanding).toBe(30000);
  });
});

describe('Analytics Queries', () => {
  it('getSpendByCategory excludes transfers', () => {
    const { acctId, fundId, catId, scId, transferCatId, transferScId } = seedTestData();
    createTransaction(db, { date: '2026-04-01', categoryId: catId, subCategoryId: scId, transactionType: 'debit', fundId, accountId: acctId, amount: 50000 });
    createTransaction(db, { date: '2026-04-01', categoryId: transferCatId, subCategoryId: transferScId, transactionType: 'debit', fundId, accountId: acctId, amount: 100000, transferId: 'xfer-1' });

    const spend = getSpendByCategory(db, '2026-04-01', '2026-04-30');
    expect(spend).toHaveLength(1);
    expect(spend[0].categoryName).toBe('Food');
    expect(spend[0].total).toBe(50000);
  });

  it('getMonthlySpendTrend groups by month', () => {
    const { acctId, fundId, catId, scId } = seedTestData();
    createTransaction(db, { date: '2026-04-01', categoryId: catId, subCategoryId: scId, transactionType: 'debit', fundId, accountId: acctId, amount: 100 });
    createTransaction(db, { date: '2026-04-15', categoryId: catId, subCategoryId: scId, transactionType: 'debit', fundId, accountId: acctId, amount: 200 });
    createTransaction(db, { date: '2026-05-01', categoryId: catId, subCategoryId: scId, transactionType: 'debit', fundId, accountId: acctId, amount: 300 });

    const trend = getMonthlySpendTrend(db, '2026-04-01', '2026-05-31');
    expect(trend).toHaveLength(2);
    expect(trend[0].month).toBe('2026-04');
    expect(trend[0].total).toBe(300);
    expect(trend[1].month).toBe('2026-05');
    expect(trend[1].total).toBe(300);
  });

  it('getSavingsRate computes rate from salary income and savings debits', () => {
    const { acctId, fundId, salaryId, salaryScId, savingsId, savingsScId } = seedTestData();
    createTransaction(db, { date: '2026-04-10', categoryId: salaryId, subCategoryId: salaryScId, transactionType: 'credit', fundId, accountId: acctId, amount: 10000000 });
    createTransaction(db, { date: '2026-04-15', categoryId: savingsId, subCategoryId: savingsScId, transactionType: 'debit', fundId, accountId: acctId, amount: 3000000 });

    const result = getSavingsRate(db, '2026-04-01', '2026-04-30');
    expect(result).toHaveLength(1);
    expect(result[0].month).toBe('2026-04');
    expect(result[0].income).toBe(10000000);
    expect(result[0].savings).toBe(3000000);
    expect(result[0].rate).toBe(30);
  });

  it('getCreditCardAnnualSpend totals by credit card account', () => {
    const { ccId, fundId, catId, scId } = seedTestData();
    createTransaction(db, { date: '2026-04-01', categoryId: catId, subCategoryId: scId, transactionType: 'debit', fundId, accountId: ccId, amount: 50000 });
    createTransaction(db, { date: '2026-05-01', categoryId: catId, subCategoryId: scId, transactionType: 'debit', fundId, accountId: ccId, amount: 30000 });

    const spend = getCreditCardAnnualSpend(db, '2026-04-01', '2027-03-31');
    expect(spend).toHaveLength(1);
    expect(spend[0].accountName).toBe('Slice CC');
    expect(spend[0].totalSpend).toBe(80000);
  });
});
