import { useState, useCallback, useMemo } from 'react';
import type { Database } from 'sql.js';
import type {
  Transaction, TransactionFilters, CreateTransactionInput,
} from '@/types';
import {
  getTransactions, getTransferGroup, createTransaction, updateTransaction,
  deleteTransaction, deleteTransferGroup, getAllAccounts, getAllFunds,
  getAllCategories, getSubCategories,
} from '@/db/queries';
import { getMonthRange } from '@/utils/date';

export interface TransactionGroup {
  key: string;
  transferId: string | null;
  transactions: Transaction[];
}

export function groupTransactions(transactions: Transaction[]): TransactionGroup[] {
  const transferMap = new Map<string, Transaction[]>();

  for (const t of transactions) {
    if (t.transferId) {
      const existing = transferMap.get(t.transferId);
      if (existing) existing.push(t);
      else transferMap.set(t.transferId, [t]);
    }
  }

  const result: TransactionGroup[] = [];
  const seen = new Set<string>();

  for (const t of transactions) {
    if (t.transferId) {
      if (seen.has(t.transferId)) continue;
      seen.add(t.transferId);
      result.push({
        key: `transfer-${t.transferId}`,
        transferId: t.transferId,
        transactions: transferMap.get(t.transferId)!,
      });
    } else {
      result.push({
        key: `txn-${t.id}`,
        transferId: null,
        transactions: [t],
      });
    }
  }

  return result;
}

export interface TransferLegPair {
  debit: Transaction;
  credit: Transaction | undefined;
}

export function pairTransferLegs(transactions: Transaction[]): TransferLegPair[] {
  const debits = transactions.filter((t) => t.transactionType === 'debit');
  const credits = transactions.filter((t) => t.transactionType === 'credit');
  const usedCreditIds = new Set<number>();

  return debits.map((debit) => {
    const credit = credits.find((t) => t.amount === debit.amount && !usedCreditIds.has(t.id));
    if (credit) usedCreditIds.add(credit.id);
    return { debit, credit };
  });
}

export function useTransactions(db: Database, persistDatabase: () => Promise<void>) {
  const [filters, setFilters] = useState<TransactionFilters>(() => {
    const currentMonth = getMonthRange();
    return { startDate: currentMonth.start, endDate: currentMonth.end };
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const allAccounts = useMemo(() => getAllAccounts(db), [db, refreshKey]);
  const allFunds = useMemo(() => getAllFunds(db), [db, refreshKey]);
  const allCategories = useMemo(() => getAllCategories(db), [db, refreshKey]);
  const allSubCategories = useMemo(() => getSubCategories(db), [db, refreshKey]);

  const activeAccounts = useMemo(() => allAccounts.filter((a) => a.isActive), [allAccounts]);
  const activeFunds = useMemo(() => allFunds.filter((f) => f.isActive), [allFunds]);
  const activeCategories = useMemo(() => allCategories.filter((c) => c.isActive), [allCategories]);
  const activeSubCategories = useMemo(() => allSubCategories.filter((s) => s.isActive), [allSubCategories]);

  const accountMap = useMemo(() => new Map(allAccounts.map((a) => [a.id, a])), [allAccounts]);
  const fundMap = useMemo(() => new Map(allFunds.map((f) => [f.id, f])), [allFunds]);
  const categoryMap = useMemo(() => new Map(allCategories.map((c) => [c.id, c])), [allCategories]);
  const subCategoryMap = useMemo(() => new Map(allSubCategories.map((s) => [s.id, s])), [allSubCategories]);

  const transactions = useMemo(() => getTransactions(db, filters), [db, filters, refreshKey]);

  const groups = useMemo(() => groupTransactions(transactions), [transactions]);

  const addTransaction = useCallback(async (input: CreateTransactionInput) => {
    createTransaction(db, input);
    await persistDatabase();
    refresh();
  }, [db, persistDatabase, refresh]);

  const editTransaction = useCallback(async (id: number, input: Partial<CreateTransactionInput>) => {
    updateTransaction(db, id, input);
    await persistDatabase();
    refresh();
  }, [db, persistDatabase, refresh]);

  const removeTransaction = useCallback(async (id: number) => {
    deleteTransaction(db, id);
    await persistDatabase();
    refresh();
  }, [db, persistDatabase, refresh]);

  const addTransferGroup = useCallback(async (inputs: CreateTransactionInput[]) => {
    for (const input of inputs) {
      createTransaction(db, input);
    }
    await persistDatabase();
    refresh();
  }, [db, persistDatabase, refresh]);

  const editTransferGroup = useCallback(async (oldTransferId: string, inputs: CreateTransactionInput[]) => {
    deleteTransferGroup(db, oldTransferId);
    for (const input of inputs) {
      createTransaction(db, input);
    }
    await persistDatabase();
    refresh();
  }, [db, persistDatabase, refresh]);

  const removeTransferGroup = useCallback(async (transferId: string) => {
    deleteTransferGroup(db, transferId);
    await persistDatabase();
    refresh();
  }, [db, persistDatabase, refresh]);

  const loadTransferGroup = useCallback((transferId: string) => {
    return getTransferGroup(db, transferId);
  }, [db]);

  return {
    transactions,
    groups,
    filters,
    setFilters,
    allAccounts,
    allFunds,
    allCategories,
    allSubCategories,
    activeAccounts,
    activeFunds,
    activeCategories,
    activeSubCategories,
    accountMap,
    fundMap,
    categoryMap,
    subCategoryMap,
    addTransaction,
    editTransaction,
    removeTransaction,
    addTransferGroup,
    editTransferGroup,
    removeTransferGroup,
    loadTransferGroup,
  };
}
