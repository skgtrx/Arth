import { describe, it, expect } from 'vitest';
import { parseCSV, parseCSVLine, detectTransferPairs, extractSeedData } from '../csv-parser';

const SAMPLE_CSV = `Date,Category,Sub-Category,Transaction Type,Fund,Account,Amount,Comments
1-Apr-2026,Savings,Annualy,Credit,Expense Saving Fund,HDFC,"₹1,472.86",Previous FY Balance
1-Apr-2026,Savings,Annualy,Credit,Expense Saving Fund,Jupiter Money,"₹10,000.00",Previous FY Balance
1-Apr-2026,Transfer,Transfer,Debit,Income Fund,HDFC,"₹5,000.00",Transfer
1-Apr-2026,Transfer,Transfer,Credit,Income Fund,Slice,"₹5,000.00",Transfer
1-Apr-2026,Pocket Money,Anju,Debit,Income Fund,Slice,"₹5,000.00",5000 Pocket Money`;

describe('parseCSVLine', () => {
  it('parses simple fields', () => {
    const fields = parseCSVLine('a,b,c');
    expect(fields).toEqual(['a', 'b', 'c']);
  });

  it('handles quoted fields with commas', () => {
    const fields = parseCSVLine('a,"₹1,472.86",c');
    expect(fields).toEqual(['a', '₹1,472.86', 'c']);
  });

  it('handles empty fields', () => {
    const fields = parseCSVLine('a,,c');
    expect(fields).toEqual(['a', '', 'c']);
  });
});

describe('parseCSV', () => {
  it('parses correct number of rows', () => {
    const rows = parseCSV(SAMPLE_CSV);
    expect(rows).toHaveLength(5);
  });

  it('parses dates to ISO format', () => {
    const rows = parseCSV(SAMPLE_CSV);
    expect(rows[0].date).toBe('2026-04-01');
  });

  it('parses amounts to paisa', () => {
    const rows = parseCSV(SAMPLE_CSV);
    expect(rows[0].amount).toBe(147286);
    expect(rows[1].amount).toBe(1000000);
  });

  it('parses category and sub-category', () => {
    const rows = parseCSV(SAMPLE_CSV);
    expect(rows[0].category).toBe('Savings');
    expect(rows[0].subCategory).toBe('Annualy');
  });

  it('parses transaction type', () => {
    const rows = parseCSV(SAMPLE_CSV);
    expect(rows[0].transactionType).toBe('credit');
    expect(rows[2].transactionType).toBe('debit');
  });

  it('parses fund and account', () => {
    const rows = parseCSV(SAMPLE_CSV);
    expect(rows[0].fund).toBe('Expense Saving Fund');
    expect(rows[0].account).toBe('HDFC');
  });
});

describe('detectTransferPairs', () => {
  it('detects a 2-row transfer pair', () => {
    const rows = parseCSV(SAMPLE_CSV);
    const result = detectTransferPairs(rows);

    const transferRow1 = result.find(r => r.category === 'Transfer' && r.transactionType === 'debit');
    const transferRow2 = result.find(r => r.category === 'Transfer' && r.transactionType === 'credit' && r.account === 'Slice');

    expect(transferRow1?.transferId).toBeTruthy();
    expect(transferRow1?.transferId).toBe(transferRow2?.transferId);
  });

  it('leaves standalone rows with null transferId', () => {
    const rows = parseCSV(SAMPLE_CSV);
    const result = detectTransferPairs(rows);

    const pocketMoney = result.find(r => r.category === 'Pocket Money');
    expect(pocketMoney?.transferId).toBeNull();
  });

  it('preserves total row count', () => {
    const rows = parseCSV(SAMPLE_CSV);
    const result = detectTransferPairs(rows);
    expect(result).toHaveLength(rows.length);
  });
});

describe('extractSeedData', () => {
  it('extracts unique accounts', () => {
    const data = extractSeedData(SAMPLE_CSV);
    expect(data.accounts.length).toBeGreaterThanOrEqual(3);
    expect(data.accounts.find(a => a.name === 'HDFC')?.type).toBe('bank');
  });

  it('extracts unique funds', () => {
    const data = extractSeedData(SAMPLE_CSV);
    expect(data.funds).toContain('Expense Saving Fund');
    expect(data.funds).toContain('Income Fund');
  });

  it('extracts unique categories', () => {
    const data = extractSeedData(SAMPLE_CSV);
    expect(data.categories).toContain('Savings');
    expect(data.categories).toContain('Transfer');
    expect(data.categories).toContain('Pocket Money');
  });

  it('extracts sub-categories with parent category', () => {
    const data = extractSeedData(SAMPLE_CSV);
    const annualySavings = data.subCategories.find(
      sc => sc.name === 'Annualy' && sc.category === 'Savings'
    );
    expect(annualySavings).toBeTruthy();
  });

  it('has transactions with transfer detection applied', () => {
    const data = extractSeedData(SAMPLE_CSV);
    const transfers = data.transactions.filter(t => t.transferId !== null);
    expect(transfers.length).toBeGreaterThanOrEqual(2);
  });
});
