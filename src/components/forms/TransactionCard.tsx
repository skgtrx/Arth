import { useState } from 'react';
import type { Transaction, Account, Fund, Category, SubCategory } from '@/types';
import { Button, Badge } from '@/components/ui';
import { formatINR } from '@/utils/currency';
import { pairTransferLegs } from '@/hooks/useTransactions';

interface TransactionCardProps {
  transactions: Transaction[];
  accountMap: Map<number, Account>;
  fundMap: Map<number, Fund>;
  categoryMap: Map<number, Category>;
  subCategoryMap: Map<number, SubCategory>;
  onEdit: () => void;
  onDelete: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function TransactionCard({
  transactions,
  accountMap,
  fundMap,
  categoryMap,
  subCategoryMap,
  onEdit,
  onDelete,
}: TransactionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const isTransfer = transactions.length > 1 || transactions[0]?.transferId !== null;
  const first = transactions[0];
  const totalAmount = transactions.reduce(
    (sum, t) => t.transactionType === 'debit' ? sum + t.amount : sum,
    0,
  );

  const displayAmount = isTransfer ? totalAmount : first.amount;
  const displayType = isTransfer ? 'debit' as const : first.transactionType;
  const category = categoryMap.get(first.categoryId);
  const debitLegs = transactions.filter((t) => t.transactionType === 'debit');

  return (
    <div
      className="rounded-xl border border-border-default bg-surface-raised overflow-hidden"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">{formatDate(first.date)}</span>
            <span className="truncate font-medium text-text-primary">
              {isTransfer ? 'Transfer' : category?.name ?? 'Unknown'}
            </span>
            {isTransfer && debitLegs.length > 1 && (
              <Badge variant="default">{debitLegs.length} legs</Badge>
            )}
          </div>
        </div>
        <span
          className={`ml-3 whitespace-nowrap font-semibold tabular-nums ${
            displayType === 'credit' ? 'text-credit' : 'text-debit'
          }`}
        >
          {displayType === 'credit' ? '+' : '-'}{formatINR(displayAmount)}
        </span>
      </div>

      <div
        className="transition-[max-height] duration-200 ease-in-out overflow-hidden"
        style={{ maxHeight: expanded ? '600px' : '0px' }}
      >
        <div className="border-t border-border-default px-4 py-3 space-y-3">
          {isTransfer ? (
            <TransferDetails
              transactions={transactions}
              fundMap={fundMap}
              accountMap={accountMap}
            />
          ) : (
            <SingleDetails
              transaction={first}
              accountMap={accountMap}
              fundMap={fundMap}
              subCategoryMap={subCategoryMap}
            />
          )}

          <div className="flex gap-2 pt-1">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              className="flex-1"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SingleDetails({
  transaction: t,
  accountMap,
  fundMap,
  subCategoryMap,
}: {
  transaction: Transaction;
  accountMap: Map<number, Account>;
  fundMap: Map<number, Fund>;
  subCategoryMap: Map<number, SubCategory>;
}) {
  const sub = subCategoryMap.get(t.subCategoryId);
  const fund = fundMap.get(t.fundId);
  const account = accountMap.get(t.accountId);

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
      <DetailRow label="Sub-Category" value={sub?.name} />
      <DetailRow label="Fund" value={fund?.name} />
      <DetailRow label="Account" value={account?.name} />
      <DetailRow label="Type" value={t.transactionType === 'credit' ? 'Credit' : 'Debit'} />
      {t.comments && <div className="col-span-2"><DetailRow label="Comments" value={t.comments} /></div>}
    </div>
  );
}

function TransferDetails({
  transactions,
  fundMap,
  accountMap,
}: {
  transactions: Transaction[];
  fundMap: Map<number, Fund>;
  accountMap: Map<number, Account>;
}) {
  const pairs = pairTransferLegs(transactions);

  return (
    <div className="space-y-2">
      {pairs.map(({ debit: dt, credit: ct }) => {
        const srcFund = fundMap.get(dt.fundId)?.name ?? '?';
        const srcAcc = accountMap.get(dt.accountId)?.name ?? '?';
        const dstFund = ct ? fundMap.get(ct.fundId)?.name ?? '?' : '?';
        const dstAcc = ct ? accountMap.get(ct.accountId)?.name ?? '?' : '?';

        return (
          <div key={dt.id} className="rounded-lg bg-surface-overlay px-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">
                {srcFund}/{srcAcc} → {dstFund}/{dstAcc}
              </span>
              <span className="font-medium tabular-nums text-text-primary">{formatINR(dt.amount)}</span>
            </div>
            {dt.comments && <p className="mt-1 text-text-muted">{dt.comments}</p>}
          </div>
        );
      })}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-text-muted">{label}: </span>
      <span className="text-text-primary">{value ?? '-'}</span>
    </div>
  );
}
