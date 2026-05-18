import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { SavingsRate } from '@/types';
import { formatINR } from '@/utils/currency';
import { Card } from '@/components/ui';
import { formatMonthLabel, AXIS_TICK } from './chart-utils';

interface Props {
  data: SavingsRate[];
}

export default function SavingsRateChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <h3 className="text-base font-semibold text-text-primary mb-2">Savings Rate</h3>
        <p className="text-text-muted text-sm">No income data</p>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    month: formatMonthLabel(d.month),
    rate: Math.round(d.rate * 10) / 10,
    income: d.income,
    savings: d.savings,
  }));

  return (
    <Card>
      <h3 className="text-base font-semibold text-text-primary mb-4">Savings Rate</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
          <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v: number) => `${v}%`} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]?.payload) return null;
              const d = payload[0].payload as typeof chartData[number];
              return (
                <div className="rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm">
                  <p className="text-text-primary font-medium">{d.month}</p>
                  <p className="text-text-secondary">Income: {formatINR(d.income)}</p>
                  <p className="text-text-secondary">Savings: {formatINR(d.savings)}</p>
                  <p className="text-accent font-medium">{d.rate}%</p>
                </div>
              );
            }}
          />
          <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.rate >= 30 ? '#10b981' : '#f59e0b'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
