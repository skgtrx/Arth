import type { DateRange } from '@/types';

const MONTH_ABBR: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04',
  May: '05', Jun: '06', Jul: '07', Aug: '08',
  Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

export function parseDateDMMMYYYY(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    throw new Error(`Invalid date format: "${dateStr}". Expected D-MMM-YYYY.`);
  }
  const [day, monthAbbr, year] = parts;
  const month = MONTH_ABBR[monthAbbr];
  if (!month) {
    throw new Error(`Invalid month abbreviation: "${monthAbbr}"`);
  }
  return `${year}-${month}-${day.padStart(2, '0')}`;
}

export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function today(): string {
  return toISO(new Date());
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function getFYRange(date: Date = new Date()): DateRange {
  const year = date.getFullYear();
  const month = date.getMonth();
  const fyStartYear = month >= 3 ? year : year - 1;
  return {
    start: `${fyStartYear}-04-01`,
    end: `${fyStartYear + 1}-03-31`,
  };
}

export function getFYLabel(date: Date = new Date()): string {
  const range = getFYRange(date);
  const startYear = parseInt(range.start.slice(0, 4), 10);
  const endYear = startYear + 1;
  return `FY${startYear.toString().slice(2)}-${endYear.toString().slice(2)}`;
}

export function getMonthRange(date: Date = new Date()): DateRange {
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const m = (month + 1).toString().padStart(2, '0');
  return {
    start: `${year}-${m}-01`,
    end: `${year}-${m}-${lastDay.toString().padStart(2, '0')}`,
  };
}

export function getYearRange(date: Date = new Date()): DateRange {
  const year = date.getFullYear();
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
  };
}

export function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}
