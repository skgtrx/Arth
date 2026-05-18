import { parseDateDMMMYYYY } from './date';
import { parseAmountToPaisa } from './currency';
import type { AccountType } from '@/types';

export interface CsvRow {
  date: string;
  category: string;
  subCategory: string;
  transactionType: 'credit' | 'debit';
  fund: string;
  account: string;
  amount: number;
  comments: string;
}

export interface ParsedSeedData {
  accounts: { name: string; type: AccountType }[];
  funds: string[];
  categories: string[];
  subCategories: { name: string; category: string }[];
  transactions: (CsvRow & { transferId: string | null })[];
}

const ACCOUNT_TYPE_MAP: Record<string, AccountType> = {
  'HDFC': 'bank',
  'BOB': 'bank',
  'SBI': 'bank',
  'Jupiter Money': 'bank',
  'Fi Money': 'bank',
  'Slice Credit Card': 'credit_card',
  'HSBC Credit Card': 'credit_card',
  'SBI Credit Card': 'credit_card',
  'Suryoday Credit Card': 'credit_card',
  'Amazon ICICI Card': 'credit_card',
  'HDFC Credit Card': 'credit_card',
  'Amazon Pay': 'wallet',
  'Paytm Wallet': 'wallet',
  'Phonepe': 'wallet',
  'Paytm Bank': 'wallet',
  'Cash': 'cash',
  'Mutual Fund': 'investment',
  'Share': 'investment',
  'Fixed Deposit': 'investment',
  'Public Provident Fund': 'investment',
  'Sovereign Gold Bond': 'investment',
  'Slice': 'bank',
};

export function parseCSV(csvText: string): CsvRow[] {
  const lines = csvText.trim().split('\n');
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < 8) continue;

    rows.push({
      date: parseDateDMMMYYYY(fields[0].trim()),
      category: fields[1].trim(),
      subCategory: fields[2].trim(),
      transactionType: fields[3].trim().toLowerCase() as 'credit' | 'debit',
      fund: fields[4].trim(),
      account: fields[5].trim(),
      amount: parseAmountToPaisa(fields[6].trim()),
      comments: fields[7].trim(),
    });
  }

  return rows;
}

export function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

export function detectTransferPairs(rows: CsvRow[]): (CsvRow & { transferId: string | null })[] {
  const result: (CsvRow & { transferId: string | null })[] = [];
  let i = 0;

  while (i < rows.length) {
    if (i + 1 < rows.length && isPair(rows[i], rows[i + 1])) {
      const transferId = crypto.randomUUID();
      result.push({ ...rows[i], transferId });
      result.push({ ...rows[i + 1], transferId });

      if (i + 3 < rows.length && isPair(rows[i + 2], rows[i + 3])
          && rows[i + 2].date === rows[i].date
          && rows[i + 2].amount === rows[i].amount) {
        result.push({ ...rows[i + 2], transferId });
        result.push({ ...rows[i + 3], transferId });
        i += 4;
      } else {
        i += 2;
      }
    } else {
      result.push({ ...rows[i], transferId: null });
      i += 1;
    }
  }

  return result;
}

function isPair(a: CsvRow, b: CsvRow): boolean {
  return a.date === b.date
    && a.amount === b.amount
    && a.transactionType !== b.transactionType;
}

export function extractSeedData(csvText: string): ParsedSeedData {
  const rows = parseCSV(csvText);
  const transactionsWithTransfers = detectTransferPairs(rows);

  const accountSet = new Map<string, AccountType>();
  const fundSet = new Set<string>();
  const categorySet = new Set<string>();
  const subCategorySet = new Set<string>();
  const subCategoryMap: { name: string; category: string }[] = [];

  for (const row of rows) {
    if (!accountSet.has(row.account)) {
      accountSet.set(row.account, ACCOUNT_TYPE_MAP[row.account] ?? 'bank');
    }
    fundSet.add(row.fund);
    categorySet.add(row.category);
    const key = `${row.category}:${row.subCategory}`;
    if (!subCategorySet.has(key)) {
      subCategorySet.add(key);
      subCategoryMap.push({ name: row.subCategory, category: row.category });
    }
  }

  return {
    accounts: Array.from(accountSet.entries()).map(([name, type]) => ({ name, type })),
    funds: Array.from(fundSet),
    categories: Array.from(categorySet),
    subCategories: subCategoryMap,
    transactions: transactionsWithTransfers,
  };
}
