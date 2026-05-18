export type AccountType = 'bank' | 'credit_card' | 'wallet' | 'cash' | 'investment';
export type TransactionType = 'credit' | 'debit';

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  isActive: boolean;
  createdAt: string;
}

export interface Fund {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  isActive: boolean;
}

export interface SubCategory {
  id: number;
  name: string;
  categoryId: number;
  isActive: boolean;
}

export interface Transaction {
  id: number;
  date: string;
  categoryId: number;
  subCategoryId: number;
  transactionType: TransactionType;
  fundId: number;
  accountId: number;
  amount: number;
  comments: string | null;
  transferId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BalanceCell {
  fundId: number;
  accountId: number;
  balance: number;
}

export interface CategorySpend {
  categoryId: number;
  categoryName: string;
  total: number;
}

export interface MonthlyTrend {
  month: string;
  total: number;
}

export interface CategoryTrend {
  month: string;
  categoryId: number;
  categoryName: string;
  total: number;
}

export interface LendBorrowEntry {
  subCategoryId: number;
  personName: string;
  outstanding: number;
}

export interface CreditCardSpend {
  accountId: number;
  accountName: string;
  totalSpend: number;
}

export interface SavingsRate {
  month: string;
  income: number;
  savings: number;
  rate: number;
}

export interface CashbackSummary {
  month: string;
  total: number;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
}

export interface UpdateAccountInput {
  name?: string;
  type?: AccountType;
  isActive?: boolean;
}

export interface CreateFundInput {
  name: string;
}

export interface UpdateFundInput {
  name?: string;
  isActive?: boolean;
}

export interface CreateCategoryInput {
  name: string;
}

export interface UpdateCategoryInput {
  name?: string;
  isActive?: boolean;
}

export interface CreateSubCategoryInput {
  name: string;
  categoryId: number;
}

export interface UpdateSubCategoryInput {
  name?: string;
  categoryId?: number;
  isActive?: boolean;
}

export interface CreateTransactionInput {
  date: string;
  categoryId: number;
  subCategoryId: number;
  transactionType: TransactionType;
  fundId: number;
  accountId: number;
  amount: number;
  comments?: string;
  transferId?: string;
}

export interface UpdateTransactionInput {
  date?: string;
  categoryId?: number;
  subCategoryId?: number;
  transactionType?: TransactionType;
  fundId?: number;
  accountId?: number;
  amount?: number;
  comments?: string | null;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  categoryIds?: number[];
  fundIds?: number[];
  accountIds?: number[];
  transactionType?: TransactionType;
  transferId?: string;
}

export interface DateRange {
  start: string;
  end: string;
}
