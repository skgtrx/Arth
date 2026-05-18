import { useMemo } from 'react';
import type { Database } from 'sql.js';
import type {
  DateRange,
  CategorySpend,
  MonthlyTrend,
  CategoryTrend,
  SavingsRate,
  CashbackSummary,
  CreditCardSpend,
} from '@/types';
import {
  getSpendByCategory,
  getMonthlySpendTrend,
  getCategoryTrend,
  getSavingsRate,
  getCashbackByMonth,
  getCreditCardAnnualSpend,
} from '@/db/queries';

export interface AnalyticsData {
  spendByCategory: CategorySpend[];
  monthlyTrend: MonthlyTrend[];
  categoryTrend: CategoryTrend[];
  savingsRate: SavingsRate[];
  cashbackByMonth: CashbackSummary[];
  creditCardSpend: CreditCardSpend[];
}

export function useAnalytics(db: Database | null, dateRange: DateRange): AnalyticsData {
  return useMemo(() => {
    if (!db) {
      return {
        spendByCategory: [],
        monthlyTrend: [],
        categoryTrend: [],
        savingsRate: [],
        cashbackByMonth: [],
        creditCardSpend: [],
      };
    }

    return {
      spendByCategory: getSpendByCategory(db, dateRange.start, dateRange.end),
      monthlyTrend: getMonthlySpendTrend(db, dateRange.start, dateRange.end),
      categoryTrend: getCategoryTrend(db, dateRange.start, dateRange.end),
      savingsRate: getSavingsRate(db, dateRange.start, dateRange.end),
      cashbackByMonth: getCashbackByMonth(db, dateRange.start, dateRange.end),
      creditCardSpend: getCreditCardAnnualSpend(db, dateRange.start, dateRange.end),
    };
  }, [db, dateRange.start, dateRange.end]);
}
