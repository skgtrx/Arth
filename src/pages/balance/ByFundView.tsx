import { useMemo } from 'react';
import type { Account, Fund, BalanceCell } from '@/types';
import { Card } from '@/components/ui';
import { formatINR } from '@/utils/currency';

interface Props {
  fundMap: Map<number, Fund>;
  accountMap: Map<number, Account>;
  fundTotals: Map<number, number>;
  matrixCells: BalanceCell[];
}

export default function ByFundView({ fundMap, accountMap, fundTotals, matrixCells }: Props) {
  const sortedFunds = useMemo(() => {
    return Array.from(fundTotals.entries())
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .map(([id]) => fundMap.get(id))
      .filter((f): f is Fund => f !== undefined);
  }, [fundTotals, fundMap]);

  const cellsByFund = useMemo(() => {
    const map = new Map<number, BalanceCell[]>();
    for (const cell of matrixCells) {
      const existing = map.get(cell.fundId);
      if (existing) existing.push(cell);
      else map.set(cell.fundId, [cell]);
    }
    return map;
  }, [matrixCells]);

  if (sortedFunds.length === 0) {
    return <p className="py-8 text-center text-text-muted">No balances yet.</p>;
  }

  return (
    <div className="space-y-3">
      {sortedFunds.map((fund) => {
        const total = fundTotals.get(fund.id) ?? 0;
        const cells = cellsByFund.get(fund.id) ?? [];

        return (
          <Card key={fund.id}>
            <div>
              <span className="text-lg font-bold">{fund.name}</span>
              <p className={`mt-1 text-xl font-semibold ${total >= 0 ? 'text-credit' : 'text-debit'}`}>
                {formatINR(total)}
              </p>
            </div>

            {cells.length > 0 && (
              <div className="mt-3 space-y-1">
                {cells
                  .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
                  .map((cell) => {
                    const account = accountMap.get(cell.accountId);
                    return (
                      <div key={cell.accountId} className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">{account?.name ?? `Account #${cell.accountId}`}</span>
                        <span className={cell.balance >= 0 ? 'text-credit' : 'text-debit'}>
                          {formatINR(cell.balance)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
