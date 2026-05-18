import { useState, useCallback, useMemo } from 'react';
import type { Database } from 'sql.js';
import type { Account, Fund, BalanceCell, CreateTransactionInput } from '@/types';
import { Card, Badge, Button, Modal, Input } from '@/components/ui';
import TransactionForm from '@/components/forms/TransactionForm';
import { formatINR, parseAmountToPaisa } from '@/utils/currency';
import { today } from '@/utils/date';
import { createTransaction, getAllCategories, getSubCategories } from '@/db/queries';

interface Props {
  accounts: Account[];
  funds: Fund[];
  accountMap: Map<number, Account>;
  fundMap: Map<number, Fund>;
  accountTotals: Map<number, number>;
  matrixCells: BalanceCell[];
  db: Database;
  persistDatabase: () => Promise<void>;
  onRefresh: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  bank: 'Bank',
  credit_card: 'Credit Card',
  wallet: 'Wallet',
  cash: 'Cash',
  investment: 'Investment',
};

export default function ByAccountView({
  accounts,
  funds,
  accountMap,
  fundMap,
  accountTotals,
  matrixCells,
  db,
  persistDatabase,
  onRefresh,
}: Props) {
  const [reconAccountId, setReconAccountId] = useState<number | null>(null);
  const [actualBalanceStr, setActualBalanceStr] = useState('');
  const [showTxnForm, setShowTxnForm] = useState(false);
  const [prefilledTxn, setPrefilledTxn] = useState<Partial<CreateTransactionInput> | null>(null);

  const activeFunds = useMemo(() => funds.filter((f) => f.isActive), [funds]);

  const allCategories = useMemo(() => getAllCategories(db), [db]);
  const allSubCategories = useMemo(() => getSubCategories(db), [db]);
  const activeCategories = useMemo(() => allCategories.filter((c) => c.isActive), [allCategories]);
  const activeSubCategories = useMemo(() => allSubCategories.filter((s) => s.isActive), [allSubCategories]);
  const activeAccountsList = useMemo(() => accounts.filter((a) => a.isActive), [accounts]);

  const sortedAccounts = useMemo(() => {
    return Array.from(accountTotals.entries())
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .map(([id]) => accountMap.get(id))
      .filter((a): a is Account => a !== undefined);
  }, [accountTotals, accountMap]);

  const cellsByAccount = useMemo(() => {
    const map = new Map<number, BalanceCell[]>();
    for (const cell of matrixCells) {
      const existing = map.get(cell.accountId);
      if (existing) existing.push(cell);
      else map.set(cell.accountId, [cell]);
    }
    return map;
  }, [matrixCells]);

  const handleSaveTransaction = useCallback(async (input: CreateTransactionInput) => {
    createTransaction(db, input);
    await persistDatabase();
    onRefresh();
    setShowTxnForm(false);
    setPrefilledTxn(null);
  }, [db, persistDatabase, onRefresh]);

  function startReconciliation(accountId: number) {
    setReconAccountId(accountId);
    setActualBalanceStr('');
  }

  function exitReconciliation() {
    setReconAccountId(null);
    setActualBalanceStr('');
  }

  function openAddTransaction(accountId: number) {
    setPrefilledTxn({ accountId });
    setShowTxnForm(true);
  }

  function openSettleDifference(accountId: number, diffPaisa: number) {
    const otherCategory = allCategories.find((c) => c.name === 'Other');
    const otherSubCategory = otherCategory
      ? allSubCategories.find((s) => s.categoryId === otherCategory.id && s.name === 'Other')
      : undefined;

    setPrefilledTxn({
      accountId,
      amount: Math.abs(diffPaisa),
      transactionType: diffPaisa > 0 ? 'debit' : 'credit',
      categoryId: otherCategory?.id,
      subCategoryId: otherSubCategory?.id,
    });
    setShowTxnForm(true);
  }

  const actualPaisa = useMemo(() => {
    if (!actualBalanceStr.trim()) return null;
    try {
      return parseAmountToPaisa(actualBalanceStr);
    } catch {
      return null;
    }
  }, [actualBalanceStr]);

  if (sortedAccounts.length === 0) {
    return <p className="py-8 text-center text-text-muted">No balances yet.</p>;
  }

  return (
    <>
      <div className="space-y-3">
        {sortedAccounts.map((account) => {
          const total = accountTotals.get(account.id) ?? 0;
          const cells = cellsByAccount.get(account.id) ?? [];
          const isRecon = reconAccountId === account.id;
          const diff = isRecon && actualPaisa !== null ? total - actualPaisa : null;

          return (
            <Card key={account.id}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{account.name}</span>
                    <Badge>{TYPE_LABELS[account.type] ?? account.type}</Badge>
                  </div>
                  <p className={`mt-1 text-xl font-semibold ${total >= 0 ? 'text-credit' : 'text-debit'}`}>
                    {formatINR(total)}
                  </p>
                </div>
                {!isRecon && (
                  <Button variant="ghost" size="sm" onClick={() => startReconciliation(account.id)}>
                    Reconcile
                  </Button>
                )}
              </div>

              {cells.length > 0 && (
                <div className="mt-3 space-y-1">
                  {cells
                    .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
                    .map((cell) => {
                      const fund = fundMap.get(cell.fundId);
                      return (
                        <div key={cell.fundId} className="flex items-center justify-between text-sm">
                          <span className="text-text-secondary">{fund?.name ?? `Fund #${cell.fundId}`}</span>
                          <span className={cell.balance >= 0 ? 'text-credit' : 'text-debit'}>
                            {formatINR(cell.balance)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}

              {isRecon && (
                <div className="mt-4 space-y-3 border-t border-border-default pt-4">
                  <Input
                    label="Actual balance"
                    prefix="₹"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={actualBalanceStr}
                    onChange={setActualBalanceStr}
                  />

                  {diff !== null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Difference</span>
                      <span className={diff === 0 ? 'text-text-muted' : diff > 0 ? 'text-debit' : 'text-credit'}>
                        {diff === 0 ? 'Balanced' : formatINR(diff)}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => openAddTransaction(account.id)}
                    >
                      Add Transaction
                    </Button>
                    {diff !== null && diff !== 0 && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        onClick={() => openSettleDifference(account.id, diff)}
                      >
                        Settle Difference
                      </Button>
                    )}
                  </div>

                  <Button variant="ghost" size="sm" className="w-full" onClick={exitReconciliation}>
                    Exit Reconciliation
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Modal
        open={showTxnForm}
        onClose={() => { setShowTxnForm(false); setPrefilledTxn(null); }}
        title="Add Transaction"
      >
        {prefilledTxn && (
          <TransactionForm
            key={JSON.stringify(prefilledTxn)}
            accounts={activeAccountsList}
            funds={activeFunds}
            categories={activeCategories}
            subCategories={activeSubCategories}
            initialData={{
              id: 0,
              date: today(),
              categoryId: prefilledTxn.categoryId ?? 0,
              subCategoryId: prefilledTxn.subCategoryId ?? 0,
              transactionType: prefilledTxn.transactionType ?? 'debit',
              fundId: prefilledTxn.fundId ?? 0,
              accountId: prefilledTxn.accountId ?? 0,
              amount: prefilledTxn.amount ?? 0,
              comments: null,
              transferId: null,
              createdAt: '',
              updatedAt: '',
            }}
            onSave={handleSaveTransaction}
            onCancel={() => { setShowTxnForm(false); setPrefilledTxn(null); }}
          />
        )}
      </Modal>
    </>
  );
}
