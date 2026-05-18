import { useMemo } from 'react';
import type { LendBorrowEntry } from '@/types';
import { Card } from '@/components/ui';
import { formatINR } from '@/utils/currency';

interface Props {
  entries: LendBorrowEntry[];
}

export default function LendBorrowView({ entries }: Props) {
  const sorted = useMemo(
    () => [...entries].sort((a, b) => Math.abs(b.outstanding) - Math.abs(a.outstanding)),
    [entries],
  );

  const netTotal = useMemo(
    () => entries.reduce((sum, e) => sum + e.outstanding, 0),
    [entries],
  );

  if (entries.length === 0) {
    return <p className="py-8 text-center text-text-muted">No outstanding balances.</p>;
  }

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-secondary">Net Outstanding</span>
          <span className={`text-lg font-bold ${netTotal >= 0 ? 'text-credit' : 'text-debit'}`}>
            {formatINR(netTotal)}
          </span>
        </div>
      </Card>

      {sorted.map((entry) => (
        <Card key={entry.subCategoryId}>
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold">{entry.personName}</span>
            <span className={`text-lg font-bold ${entry.outstanding >= 0 ? 'text-credit' : 'text-debit'}`}>
              {formatINR(entry.outstanding)}
            </span>
          </div>
          <p className="mt-1 text-xs text-text-muted">
            {entry.outstanding > 0 ? 'They owe you' : 'You owe them'}
          </p>
        </Card>
      ))}
    </div>
  );
}
