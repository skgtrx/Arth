import { describe, it, expect } from 'vitest';
import { groupTransactions } from '../useTransactions';
import type { Transaction } from '@/types';

function makeTxn(overrides: Partial<Transaction> & { id: number }): Transaction {
  return {
    date: '2026-05-01',
    categoryId: 1,
    subCategoryId: 1,
    transactionType: 'debit',
    fundId: 1,
    accountId: 1,
    amount: 10000,
    comments: null,
    transferId: null,
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
    ...overrides,
  };
}

describe('groupTransactions', () => {
  it('returns empty array for empty input', () => {
    expect(groupTransactions([])).toEqual([]);
  });

  it('groups solo transactions individually', () => {
    const txns = [makeTxn({ id: 1 }), makeTxn({ id: 2 }), makeTxn({ id: 3 })];
    const groups = groupTransactions(txns);
    expect(groups).toHaveLength(3);
    expect(groups[0].key).toBe('txn-1');
    expect(groups[0].transferId).toBeNull();
    expect(groups[0].transactions).toHaveLength(1);
    expect(groups[1].key).toBe('txn-2');
    expect(groups[2].key).toBe('txn-3');
  });

  it('groups a single transfer pair into one group', () => {
    const tid = 'tf-abc';
    const txns = [
      makeTxn({ id: 1, transferId: tid, transactionType: 'debit' }),
      makeTxn({ id: 2, transferId: tid, transactionType: 'credit' }),
    ];
    const groups = groupTransactions(txns);
    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe(`transfer-${tid}`);
    expect(groups[0].transferId).toBe(tid);
    expect(groups[0].transactions).toHaveLength(2);
  });

  it('handles mixed solo transactions and transfers', () => {
    const tid = 'tf-mixed';
    const txns = [
      makeTxn({ id: 1 }),
      makeTxn({ id: 2, transferId: tid, transactionType: 'debit' }),
      makeTxn({ id: 3, transferId: tid, transactionType: 'credit' }),
      makeTxn({ id: 4 }),
    ];
    const groups = groupTransactions(txns);
    expect(groups).toHaveLength(3);
    expect(groups[0].key).toBe('txn-1');
    expect(groups[1].key).toBe(`transfer-${tid}`);
    expect(groups[1].transactions).toHaveLength(2);
    expect(groups[2].key).toBe('txn-4');
  });

  it('groups a multi-leg transfer (4+ rows) into one group', () => {
    const tid = 'tf-multi';
    const txns = [
      makeTxn({ id: 1, transferId: tid, transactionType: 'debit', amount: 50000 }),
      makeTxn({ id: 2, transferId: tid, transactionType: 'credit', amount: 50000 }),
      makeTxn({ id: 3, transferId: tid, transactionType: 'debit', amount: 30000 }),
      makeTxn({ id: 4, transferId: tid, transactionType: 'credit', amount: 30000 }),
    ];
    const groups = groupTransactions(txns);
    expect(groups).toHaveLength(1);
    expect(groups[0].transferId).toBe(tid);
    expect(groups[0].transactions).toHaveLength(4);
  });

  it('keeps multiple separate transfers as separate groups', () => {
    const tid1 = 'tf-1';
    const tid2 = 'tf-2';
    const txns = [
      makeTxn({ id: 1, transferId: tid1, transactionType: 'debit' }),
      makeTxn({ id: 2, transferId: tid1, transactionType: 'credit' }),
      makeTxn({ id: 3, transferId: tid2, transactionType: 'debit' }),
      makeTxn({ id: 4, transferId: tid2, transactionType: 'credit' }),
    ];
    const groups = groupTransactions(txns);
    expect(groups).toHaveLength(2);
    expect(groups[0].transferId).toBe(tid1);
    expect(groups[0].transactions).toHaveLength(2);
    expect(groups[1].transferId).toBe(tid2);
    expect(groups[1].transactions).toHaveLength(2);
  });

  it('preserves input order for groups', () => {
    const tid = 'tf-order';
    const txns = [
      makeTxn({ id: 10 }),
      makeTxn({ id: 20, transferId: tid, transactionType: 'debit' }),
      makeTxn({ id: 30 }),
      makeTxn({ id: 21, transferId: tid, transactionType: 'credit' }),
      makeTxn({ id: 40 }),
    ];
    const groups = groupTransactions(txns);
    expect(groups.map((g) => g.key)).toEqual([
      'txn-10',
      `transfer-${tid}`,
      'txn-30',
      'txn-40',
    ]);
  });
});
