import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { CategorySpend } from '@/types';
import { paisaToRupees, formatINR } from '@/utils/currency';
import { Card } from '@/components/ui';
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_TICK } from './chart-utils';

interface Props {
  data: CategorySpend[];
}

export default function SpendByCategoryChart({ data }: Props) {
  const [view, setView] = useState<'bar' | 'pie'>('bar');

  if (data.length === 0) {
    return (
      <Card>
        <h3 className="text-base font-semibold text-text-primary mb-2">Spend by Category</h3>
        <p className="text-text-muted text-sm">No spending data</p>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    name: d.categoryName,
    value: d.total,
  }));

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-text-primary">Spend by Category</h3>
        <div className="flex rounded-md border border-border-default overflow-hidden">
          <button
            onClick={() => setView('bar')}
            className={`px-3 py-1 text-xs font-medium ${view === 'bar' ? 'bg-accent text-white' : 'text-text-secondary'}`}
          >
            Bar
          </button>
          <button
            onClick={() => setView('pie')}
            className={`px-3 py-1 text-xs font-medium ${view === 'pie' ? 'bg-accent text-white' : 'text-text-secondary'}`}
          >
            Donut
          </button>
        </div>
      </div>

      {view === 'bar' ? (
        <ResponsiveContainer width="100%" height={data.length * 40 + 20}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
            <XAxis type="number" tickFormatter={(v: number) => `₹${Math.round(paisaToRupees(v)).toLocaleString('en-IN')}`} tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={100} tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value) => [formatINR(Number(value ?? 0)), 'Amount']}
              {...TOOLTIP_STYLE}
              itemStyle={{ color: '#10b981' }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [formatINR(Number(value ?? 0)), 'Amount']}
              {...TOOLTIP_STYLE}
              itemStyle={{ color: '#94a3b8' }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
