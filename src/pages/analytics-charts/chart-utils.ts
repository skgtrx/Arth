import type { CSSProperties } from 'react';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatMonthLabel(month: string): string {
  const [year, m] = month.split('-');
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} '${year.slice(2)}`;
}

export const CHART_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#a855f7',
];

export const TOOLTIP_STYLE: { contentStyle: CSSProperties; labelStyle: CSSProperties } = {
  contentStyle: { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 },
  labelStyle: { color: '#f8fafc' },
};

export const AXIS_TICK = { fill: '#94a3b8', fontSize: 12 };
