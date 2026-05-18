import { useMemo } from 'react';
import type { Account, Fund, BalanceCell } from '@/types';
import { formatINR } from '@/utils/currency';

interface Props {
  accountMap: Map<number, Account>;
  fundMap: Map<number, Fund>;
  accountTotals: Map<number, number>;
  fundTotals: Map<number, number>;
  matrixCells: BalanceCell[];
}

export default function MatrixView({ accountMap, fundMap, accountTotals, fundTotals, matrixCells }: Props) {
  const cellLookup = useMemo(() => {
    const map = new Map<string, number>();
    for (const cell of matrixCells) {
      map.set(`${cell.fundId}-${cell.accountId}`, cell.balance);
    }
    return map;
  }, [matrixCells]);

  const accountIds = useMemo(() => {
    const ids = new Set<number>();
    for (const cell of matrixCells) ids.add(cell.accountId);
    return Array.from(ids).sort((a, b) => {
      const nameA = accountMap.get(a)?.name ?? '';
      const nameB = accountMap.get(b)?.name ?? '';
      return nameA.localeCompare(nameB);
    });
  }, [matrixCells, accountMap]);

  const fundIds = useMemo(() => {
    const ids = new Set<number>();
    for (const cell of matrixCells) ids.add(cell.fundId);
    return Array.from(ids).sort((a, b) => {
      const nameA = fundMap.get(a)?.name ?? '';
      const nameB = fundMap.get(b)?.name ?? '';
      return nameA.localeCompare(nameB);
    });
  }, [matrixCells, fundMap]);

  const grandTotal = useMemo(() => {
    let sum = 0;
    for (const [, total] of fundTotals) sum += total;
    return sum;
  }, [fundTotals]);

  if (matrixCells.length === 0) {
    return <p className="py-8 text-center text-text-muted">No balances yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border-default">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default bg-surface-overlay">
            <th className="sticky left-0 z-10 bg-surface-overlay px-3 py-2 text-left font-medium text-text-secondary">
              Fund
            </th>
            {accountIds.map((id) => (
              <th key={id} className="px-3 py-2 text-right font-medium text-text-secondary whitespace-nowrap">
                {accountMap.get(id)?.name ?? `#${id}`}
              </th>
            ))}
            <th className="px-3 py-2 text-right font-semibold text-text-primary whitespace-nowrap">Total</th>
          </tr>
        </thead>
        <tbody>
          {fundIds.map((fundId, idx) => {
            const fundTotal = fundTotals.get(fundId) ?? 0;
            const rowBg = idx % 2 === 0 ? 'bg-surface' : 'bg-surface-raised';
            return (
              <tr
                key={fundId}
                className={`border-b border-border-default ${rowBg}`}
              >
                <td className={`sticky left-0 z-10 px-3 py-2 font-medium text-text-primary whitespace-nowrap ${rowBg}`}>
                  {fundMap.get(fundId)?.name ?? `#${fundId}`}
                </td>
                {accountIds.map((accountId) => {
                  const balance = cellLookup.get(`${fundId}-${accountId}`);
                  return (
                    <td key={accountId} className="px-3 py-2 text-right whitespace-nowrap">
                      {balance !== undefined ? (
                        <span className={balance >= 0 ? 'text-credit' : 'text-debit'}>
                          {formatINR(balance)}
                        </span>
                      ) : (
                        <span className="text-text-muted">&mdash;</span>
                      )}
                    </td>
                  );
                })}
                <td className={`px-3 py-2 text-right font-semibold whitespace-nowrap ${fundTotal >= 0 ? 'text-credit' : 'text-debit'}`}>
                  {formatINR(fundTotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-surface-overlay">
            <td className="sticky left-0 z-10 bg-surface-overlay px-3 py-2 font-semibold text-text-primary">Total</td>
            {accountIds.map((accountId) => {
              const accTotal = accountTotals.get(accountId) ?? 0;
              return (
                <td key={accountId} className={`px-3 py-2 text-right font-semibold whitespace-nowrap ${accTotal >= 0 ? 'text-credit' : 'text-debit'}`}>
                  {formatINR(accTotal)}
                </td>
              );
            })}
            <td className={`px-3 py-2 text-right font-bold whitespace-nowrap ${grandTotal >= 0 ? 'text-credit' : 'text-debit'}`}>
              {formatINR(grandTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
