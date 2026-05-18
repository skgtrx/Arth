import { useState } from 'react';
import type { DateRange } from '@/types';
import { getFYRange } from '@/utils/date';
import { useDatabase } from '@/hooks/useDatabase';
import { useAnalytics } from '@/hooks/useAnalytics';
import { TimeScopeSelector } from '@/components/ui';
import {
  SpendByCategoryChart,
  MonthlySpendChart,
  CategoryTrendChart,
  SavingsRateChart,
  CashbackChart,
  CreditCardSpendChart,
} from './analytics-charts';

export default function Analytics() {
  const { db } = useDatabase();
  const [dateRange, setDateRange] = useState<DateRange>(getFYRange);

  const data = useAnalytics(db, dateRange);

  return (
    <div className="space-y-4 py-4">
      <div>
        <h2 className="text-2xl font-bold">Analytics</h2>
        <p className="text-text-secondary text-sm mb-3">Spending trends and insights</p>
        <TimeScopeSelector value={dateRange} onChange={setDateRange} />
      </div>

      <SpendByCategoryChart data={data.spendByCategory} />
      <MonthlySpendChart data={data.monthlyTrend} />
      <CategoryTrendChart data={data.categoryTrend} />
      <SavingsRateChart data={data.savingsRate} />
      <CashbackChart data={data.cashbackByMonth} />
      <CreditCardSpendChart data={data.creditCardSpend} />
    </div>
  );
}
