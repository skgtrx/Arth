import { describe, it, expect } from 'vitest';
import { rupeesToPaisa, paisaToRupees, formatINR, parseAmountToPaisa } from '../currency';

describe('rupeesToPaisa', () => {
  it('converts whole rupees', () => {
    expect(rupeesToPaisa(100)).toBe(10000);
  });

  it('converts decimal rupees', () => {
    expect(rupeesToPaisa(1472.86)).toBe(147286);
  });

  it('rounds floating point correctly', () => {
    expect(rupeesToPaisa(0.1 + 0.2)).toBe(30);
  });

  it('handles zero', () => {
    expect(rupeesToPaisa(0)).toBe(0);
  });

  it('handles negative amounts', () => {
    expect(rupeesToPaisa(-50.25)).toBe(-5025);
  });
});

describe('paisaToRupees', () => {
  it('converts paisa to rupees', () => {
    expect(paisaToRupees(147286)).toBe(1472.86);
  });

  it('handles zero', () => {
    expect(paisaToRupees(0)).toBe(0);
  });
});

describe('formatINR', () => {
  it('formats small amounts', () => {
    expect(formatINR(500)).toBe('₹5.00');
  });

  it('formats hundreds', () => {
    expect(formatINR(99900)).toBe('₹999.00');
  });

  it('formats thousands with Indian notation', () => {
    expect(formatINR(147286)).toBe('₹1,472.86');
  });

  it('formats lakhs', () => {
    expect(formatINR(27068300)).toBe('₹2,70,683.00');
  });

  it('formats crores', () => {
    expect(formatINR(1000000000)).toBe('₹1,00,00,000.00');
  });

  it('formats negative amounts', () => {
    expect(formatINR(-147286)).toBe('-₹1,472.86');
  });

  it('formats zero', () => {
    expect(formatINR(0)).toBe('₹0.00');
  });

  it('formats single digit paisa', () => {
    expect(formatINR(105)).toBe('₹1.05');
  });
});

describe('parseAmountToPaisa', () => {
  it('parses amount with rupee symbol and commas', () => {
    expect(parseAmountToPaisa('₹1,472.86')).toBe(147286);
  });

  it('parses amount with rupee symbol only', () => {
    expect(parseAmountToPaisa('₹500')).toBe(50000);
  });

  it('parses plain number', () => {
    expect(parseAmountToPaisa('1000.50')).toBe(100050);
  });

  it('parses Indian lakh notation', () => {
    expect(parseAmountToPaisa('₹2,70,683.00')).toBe(27068300);
  });

  it('throws on invalid input', () => {
    expect(() => parseAmountToPaisa('abc')).toThrow('Invalid amount');
  });

  it('throws on empty string', () => {
    expect(() => parseAmountToPaisa('')).toThrow('Invalid amount');
  });
});
