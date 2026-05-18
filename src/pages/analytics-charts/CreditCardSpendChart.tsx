import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { CreditCardSpend } from '@/types';
import { paisaToRupees, formatINR } from '@/utils/currency';
import { Card } from '@/components/ui';
import { TOOLTIP_STYLE, AXIS_TICK } from './chart-utils';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4'];

interface Props {
  data: CreditCardSpend[];
}

export default function CreditCardSpendChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <h3 className="text-base font-semibold text-text-primary mb-2">Credit Card Spend</h3>
        <p className="text-text-muted text-sm">No credit card data</p>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    name: d.accountName,
    value: d.totalSpend,
  }));

  return (
    <Card>
      <h3 className="text-base font-semibold text-text-primary mb-4">Credit Card Spend</h3>
      <ResponsiveContainer width="100%" height={data.length * 48 + 20}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
          <XAxis type="number" tickFormatter={(v: number) => `₹${Math.round(paisaToRupees(v)).toLocaleString('en-IN')}`} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={120} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value) => [formatINR(Number(value ?? 0)), 'Total Spend']}
            {...TOOLTIP_STYLE}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
