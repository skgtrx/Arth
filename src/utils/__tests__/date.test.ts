import { describe, it, expect } from 'vitest';
import {
  parseDateDMMMYYYY, toISO, getFYRange, getFYLabel,
  getMonthRange, getYearRange, getMonthKey,
} from '../date';

describe('parseDateDMMMYYYY', () => {
  it('parses 1-Apr-2026', () => {
    expect(parseDateDMMMYYYY('1-Apr-2026')).toBe('2026-04-01');
  });

  it('parses 15-Dec-2025', () => {
    expect(parseDateDMMMYYYY('15-Dec-2025')).toBe('2025-12-15');
  });

  it('parses single-digit day', () => {
    expect(parseDateDMMMYYYY('3-Jan-2026')).toBe('2026-01-03');
  });

  it('throws on invalid format', () => {
    expect(() => parseDateDMMMYYYY('2026-04-01')).toThrow('Invalid month');
  });

  it('throws on wrong separator count', () => {
    expect(() => parseDateDMMMYYYY('1 Apr 2026')).toThrow('Invalid date format');
  });
});

describe('toISO', () => {
  it('converts Date to YYYY-MM-DD', () => {
    expect(toISO(new Date(2026, 3, 1))).toBe('2026-04-01');
  });

  it('pads single-digit month and day', () => {
    expect(toISO(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('getFYRange', () => {
  it('returns correct FY for May 2026 (April start)', () => {
    const range = getFYRange(new Date(2026, 4, 15));
    expect(range.start).toBe('2026-04-01');
    expect(range.end).toBe('2027-03-31');
  });

  it('returns correct FY for Feb 2027 (still same FY)', () => {
    const range = getFYRange(new Date(2027, 1, 15));
    expect(range.start).toBe('2026-04-01');
    expect(range.end).toBe('2027-03-31');
  });

  it('returns correct FY for April (start of new FY)', () => {
    const range = getFYRange(new Date(2026, 3, 1));
    expect(range.start).toBe('2026-04-01');
    expect(range.end).toBe('2027-03-31');
  });

  it('returns correct FY for March (end of FY)', () => {
    const range = getFYRange(new Date(2027, 2, 31));
    expect(range.start).toBe('2026-04-01');
    expect(range.end).toBe('2027-03-31');
  });
});

describe('getFYLabel', () => {
  it('returns FY26-27 for May 2026', () => {
    expect(getFYLabel(new Date(2026, 4, 15))).toBe('FY26-27');
  });

  it('returns FY26-27 for Feb 2027', () => {
    expect(getFYLabel(new Date(2027, 1, 15))).toBe('FY26-27');
  });
});

describe('getMonthRange', () => {
  it('returns correct range for April 2026', () => {
    const range = getMonthRange(new Date(2026, 3, 15));
    expect(range.start).toBe('2026-04-01');
    expect(range.end).toBe('2026-04-30');
  });

  it('handles February in non-leap year', () => {
    const range = getMonthRange(new Date(2027, 1, 10));
    expect(range.start).toBe('2027-02-01');
    expect(range.end).toBe('2027-02-28');
  });

  it('handles month with 31 days', () => {
    const range = getMonthRange(new Date(2026, 0, 15));
    expect(range.start).toBe('2026-01-01');
    expect(range.end).toBe('2026-01-31');
  });
});

describe('getYearRange', () => {
  it('returns Jan-Dec range', () => {
    const range = getYearRange(new Date(2026, 5, 15));
    expect(range.start).toBe('2026-01-01');
    expect(range.end).toBe('2026-12-31');
  });
});

describe('getMonthKey', () => {
  it('extracts YYYY-MM from date string', () => {
    expect(getMonthKey('2026-04-15')).toBe('2026-04');
  });
});
