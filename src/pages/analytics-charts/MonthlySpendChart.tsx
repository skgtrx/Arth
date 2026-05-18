import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { MonthlyTrend } from '@/types';
import { paisaToRupees, formatINR } from '@/utils/currency';
import { Card } from '@/components/ui';
import { formatMonthLabel, TOOLTIP_STYLE, AXIS_TICK } from './chart-utils';

interface Props {
  data: MonthlyTrend[];
}

export default function MonthlySpendChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <h3 className="text-base font-semibold text-text-primary mb-2">Monthly Spending</h3>
        <p className="text-text-muted text-sm">No spending data</p>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    month: formatMonthLabel(d.month),
    total: d.total,
  }));

  return (
    <Card>
      <h3 className="text-base font-semibold text-text-primary mb-4">Monthly Spending</h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => `₹${Math.round(paisaToRupees(v)).toLocaleString('en-IN')}`} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value) => [formatINR(Number(value)), 'Total Spend']}
            {...TOOLTIP_STYLE}
            itemStyle={{ color: '#10b981' }}
          />
          <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} fill="url(#spendGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
