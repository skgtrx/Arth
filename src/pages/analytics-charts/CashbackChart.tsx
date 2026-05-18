import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { CashbackSummary } from '@/types';
import { paisaToRupees, formatINR } from '@/utils/currency';
import { Card } from '@/components/ui';
import { formatMonthLabel, TOOLTIP_STYLE, AXIS_TICK } from './chart-utils';

interface Props {
  data: CashbackSummary[];
}

export default function CashbackChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <h3 className="text-base font-semibold text-text-primary mb-2">Cashback</h3>
        <p className="text-text-muted text-sm">No cashback data</p>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    month: formatMonthLabel(d.month),
    total: d.total,
  }));

  return (
    <Card>
      <h3 className="text-base font-semibold text-text-primary mb-4">Cashback</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
          <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v: number) => `₹${Math.round(paisaToRupees(v)).toLocaleString('en-IN')}`} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value) => [formatINR(Number(value ?? 0)), 'Cashback']}
            {...TOOLTIP_STYLE}
            itemStyle={{ color: '#10b981' }}
          />
          <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
