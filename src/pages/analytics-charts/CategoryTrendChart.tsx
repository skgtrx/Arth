import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { CategoryTrend } from '@/types';
import { paisaToRupees, formatINR } from '@/utils/currency';
import { Card } from '@/components/ui';
import { formatMonthLabel, CHART_COLORS, TOOLTIP_STYLE, AXIS_TICK } from './chart-utils';

interface Props {
  data: CategoryTrend[];
}

export default function CategoryTrendChart({ data }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());

  const { categories, chartData } = useMemo(() => {
    const totals = new Map<string, number>();
    for (const d of data) {
      totals.set(d.categoryName, (totals.get(d.categoryName) ?? 0) + d.total);
    }

    const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    const cats = showAll ? sorted.map(([name]) => name) : sorted.slice(0, 5).map(([name]) => name);

    const lookup = new Map(data.map((d) => [`${d.month}|${d.categoryName}`, d.total]));
    const months = [...new Set(data.map((d) => d.month))].sort();
    const rows = months.map((month) => {
      const row: Record<string, string | number> = { month: formatMonthLabel(month) };
      for (const cat of cats) {
        row[cat] = lookup.get(`${month}|${cat}`) ?? 0;
      }
      return row;
    });

    return { categories: cats, chartData: rows };
  }, [data, showAll]);

  if (data.length === 0) {
    return (
      <Card>
        <h3 className="text-base font-semibold text-text-primary mb-2">Category Trends</h3>
        <p className="text-text-muted text-sm">No spending data</p>
      </Card>
    );
  }

  const totalCategories = new Set(data.map((d) => d.categoryName)).size;

  function handleLegendClick(dataKey: string) {
    setHiddenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(dataKey)) {
        next.delete(dataKey);
      } else {
        next.add(dataKey);
      }
      return next;
    });
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-text-primary">Category Trends</h3>
        {totalCategories > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-accent font-medium"
          >
            {showAll ? 'Top 5' : 'Show all'}
          </button>
        )}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
          <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => `₹${Math.round(paisaToRupees(v)).toLocaleString('en-IN')}`} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value, name) => [formatINR(Number(value)), String(name)]}
            {...TOOLTIP_STYLE}
          />
          <Legend
            onClick={(e) => handleLegendClick(e.dataKey as string)}
            wrapperStyle={{ cursor: 'pointer', fontSize: 12 }}
          />
          {categories.map((cat, i) => (
            <Line
              key={cat}
              type="monotone"
              dataKey={cat}
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
              hide={hiddenCategories.has(cat)}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
