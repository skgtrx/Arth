import type { Database } from 'sql.js';
import type { AccountType } from '@/types';

interface SeedAccount { name: string; type: AccountType }
interface SeedTransaction {
  date: string;
  category: string;
  subCategory: string;
  transactionType: 'credit' | 'debit';
  fund: string;
  account: string;
  amount: number;
  comments: string;
  transferId: string | null;
}

const SEED_ACCOUNTS: SeedAccount[] = [
  {
    "name": "HDFC",
    "type": "bank"
  },
  {
    "name": "Jupiter Money",
    "type": "bank"
  },
  {
    "name": "Cash",
    "type": "cash"
  },
  {
    "name": "Amazon Pay",
    "type": "wallet"
  },
  {
    "name": "SBI",
    "type": "bank"
  },
  {
    "name": "Slice Credit Card",
    "type": "credit_card"
  },
  {
    "name": "Slice",
    "type": "bank"
  },
  {
    "name": "Amazon ICICI Card",
    "type": "credit_card"
  }
];

const SEED_FUNDS: string[] = [
  "Expense Saving Fund",
  "Opportunity Fund",
  "Monthly Expense Fund",
  "Annual Expense Fund",
  "Travel Fund",
  "Investment Return Fund",
  "Income Fund"
];

const SEED_CATEGORIES: string[] = [
  "Savings",
  "Transfer",
  "Investment Return",
  "Salary",
  "Pocket Money",
  "Expense",
  "Other",
  "Fee",
  "Food",
  "Reimbursement",
  "Cashback",
  "Accessories",
  "Travel",
  "Bill",
  "Marriage",
  "Lend",
  "Clothing",
  "House Help",
  "Rent",
  "Utility",
  "Grocery",
  "Refund",
  "Gift"
];

const SEED_SUB_CATEGORIES: { name: string; category: string }[] = [
  {
    "name": "Annualy",
    "category": "Savings"
  },
  {
    "name": "Annualy",
    "category": "Transfer"
  },
  {
    "name": "Savings Account",
    "category": "Investment Return"
  },
  {
    "name": "Zocdoc",
    "category": "Salary"
  },
  {
    "name": "Transfer",
    "category": "Transfer"
  },
  {
    "name": "Anju",
    "category": "Pocket Money"
  },
  {
    "name": "Monthly",
    "category": "Expense"
  },
  {
    "name": "Annualy",
    "category": "Expense"
  },
  {
    "name": "Travel",
    "category": "Savings"
  },
  {
    "name": "Opportunity",
    "category": "Savings"
  },
  {
    "name": "Mutual Fund",
    "category": "Savings"
  },
  {
    "name": "National Pension Scheme",
    "category": "Savings"
  },
  {
    "name": "Public Provident Fund",
    "category": "Savings"
  },
  {
    "name": "Other",
    "category": "Other"
  },
  {
    "name": "Other",
    "category": "Fee"
  },
  {
    "name": "Snacks",
    "category": "Food"
  },
  {
    "name": "Dinner",
    "category": "Food"
  },
  {
    "name": "Zocdoc",
    "category": "Reimbursement"
  },
  {
    "name": "Cred Payment",
    "category": "Cashback"
  },
  {
    "name": "Home",
    "category": "Accessories"
  },
  {
    "name": "Other",
    "category": "Cashback"
  },
  {
    "name": "Auto",
    "category": "Travel"
  },
  {
    "name": "Cab",
    "category": "Travel"
  },
  {
    "name": "Bike",
    "category": "Bill"
  },
  {
    "name": "Fuel",
    "category": "Bill"
  },
  {
    "name": "Banking Charges",
    "category": "Fee"
  },
  {
    "name": "Mobile Recharge",
    "category": "Bill"
  },
  {
    "name": "Home Appliance",
    "category": "Accessories"
  },
  {
    "name": "Mobile Bill",
    "category": "Reimbursement"
  },
  {
    "name": "Entertainment",
    "category": "Bill"
  },
  {
    "name": "Marriage",
    "category": "Marriage"
  },
  {
    "name": "Gaurav",
    "category": "Lend"
  },
  {
    "name": "Fee",
    "category": "Fee"
  },
  {
    "name": "Slippers",
    "category": "Clothing"
  },
  {
    "name": "Other",
    "category": "Food"
  },
  {
    "name": "Maid",
    "category": "House Help"
  },
  {
    "name": "Apartment",
    "category": "Rent"
  },
  {
    "name": "Home Appliance",
    "category": "Utility"
  },
  {
    "name": "Lunch",
    "category": "Food"
  },
  {
    "name": "Pantry",
    "category": "Grocery"
  },
  {
    "name": "Dairy Product",
    "category": "Grocery"
  },
  {
    "name": "Vegitables",
    "category": "Grocery"
  },
  {
    "name": "Personal Care",
    "category": "Grocery"
  },
  {
    "name": "Delivery Charges",
    "category": "Fee"
  },
  {
    "name": "Household & Cleaners",
    "category": "Grocery"
  },
  {
    "name": "Other",
    "category": "Refund"
  },
  {
    "name": "Anniversary",
    "category": "Gift"
  },
  {
    "name": "Wifi Bill",
    "category": "Bill"
  },
  {
    "name": "Wifi Bill",
    "category": "Reimbursement"
  },
  {
    "name": "Fruits",
    "category": "Grocery"
  },
  {
    "name": "Insurance",
    "category": "Fee"
  }
];

const SEED_TRANSACTIONS: SeedTransaction[] = [
  {
    "date": "2026-04-01",
    "category": "Savings",
    "subCategory": "Annualy",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "HDFC",
    "amount": 147286,
    "comments": "Previous FY Balance",
    "transferId": null
  },
  {
    "date": "2026-04-01",
    "category": "Savings",
    "subCategory": "Annualy",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "Jupiter Money",
    "amount": 1000000,
    "comments": "Previous FY Balance",
    "transferId": null
  },
  {
    "date": "2026-04-01",
    "category": "Savings",
    "subCategory": "Annualy",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "Cash",
    "amount": 1002500,
    "comments": "Previous FY Balance",
    "transferId": null
  },
  {
    "date": "2026-04-01",
    "category": "Savings",
    "subCategory": "Annualy",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "Amazon Pay",
    "amount": 1275,
    "comments": "Previous FY Balance",
    "transferId": null
  },
  {
    "date": "2026-04-01",
    "category": "Savings",
    "subCategory": "Annualy",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "SBI",
    "amount": 116725,
    "comments": "Previous FY Balance",
    "transferId": null
  },
  {
    "date": "2026-04-01",
    "category": "Savings",
    "subCategory": "Annualy",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "Slice Credit Card",
    "amount": 2918716,
    "comments": "Previous FY Balance",
    "transferId": null
  },
  {
    "date": "2026-04-01",
    "category": "Transfer",
    "subCategory": "Annualy",
    "transactionType": "credit",
    "fund": "Opportunity Fund",
    "account": "HDFC",
    "amount": 4529616,
    "comments": "Previous FY Balance",
    "transferId": null
  },
  {
    "date": "2026-04-01",
    "category": "Transfer",
    "subCategory": "Annualy",
    "transactionType": "credit",
    "fund": "Opportunity Fund",
    "account": "Jupiter Money",
    "amount": 13300,
    "comments": "Previous FY Balance",
    "transferId": null
  },
  {
    "date": "2026-04-01",
    "category": "Transfer",
    "subCategory": "Annualy",
    "transactionType": "credit",
    "fund": "Opportunity Fund",
    "account": "SBI",
    "amount": 16500,
    "comments": "Previous FY Balance",
    "transferId": null
  },
  {
    "date": "2026-04-01",
    "category": "Transfer",
    "subCategory": "Annualy",
    "transactionType": "credit",
    "fund": "Monthly Expense Fund",
    "account": "Slice",
    "amount": 310675,
    "comments": "Previous FY Balance",
    "transferId": null
  },
  {
    "date": "2026-04-01",
    "category": "Transfer",
    "subCategory": "Annualy",
    "transactionType": "credit",
    "fund": "Annual Expense Fund",
    "account": "Slice",
    "amount": 79373,
    "comments": "Previous FY Balance",
    "transferId": null
  },
  {
    "date": "2026-04-01",
    "category": "Transfer",
    "subCategory": "Annualy",
    "transactionType": "credit",
    "fund": "Opportunity Fund",
    "account": "Slice",
    "amount": 17498867,
    "comments": "Previous FY Balance",
    "transferId": null
  },
  {
    "date": "2026-04-01",
    "category": "Transfer",
    "subCategory": "Annualy",
    "transactionType": "credit",
    "fund": "Travel Fund",
    "account": "Slice",
    "amount": 2981986,
    "comments": "Previous FY Balance",
    "transferId": null
  },
  {
    "date": "2026-04-01",
    "category": "Transfer",
    "subCategory": "Annualy",
    "transactionType": "credit",
    "fund": "Investment Return Fund",
    "account": "Slice",
    "amount": 1359354,
    "comments": "Previous FY Balance",
    "transferId": null
  },
  {
    "date": "2026-04-01",
    "category": "Transfer",
    "subCategory": "Annualy",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "Slice",
    "amount": 6219340,
    "comments": "Previous FY Balance",
    "transferId": null
  },
  {
    "date": "2026-04-01",
    "category": "Investment Return",
    "subCategory": "Savings Account",
    "transactionType": "credit",
    "fund": "Investment Return Fund",
    "account": "Slice",
    "amount": 135448,
    "comments": "Savings Account Interest",
    "transferId": null
  },
  {
    "date": "2026-04-01",
    "category": "Salary",
    "subCategory": "Zocdoc",
    "transactionType": "credit",
    "fund": "Income Fund",
    "account": "HDFC",
    "amount": 27068300,
    "comments": "March",
    "transferId": null
  },
  {
    "date": "2026-04-01",
    "category": "Investment Return",
    "subCategory": "Savings Account",
    "transactionType": "credit",
    "fund": "Investment Return Fund",
    "account": "HDFC",
    "amount": 64600,
    "comments": "Savings Account Interest",
    "transferId": null
  },
  {
    "date": "2026-04-01",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "debit",
    "fund": "Income Fund",
    "account": "HDFC",
    "amount": 500000,
    "comments": "Transfer",
    "transferId": "transfer-001"
  },
  {
    "date": "2026-04-01",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "credit",
    "fund": "Income Fund",
    "account": "Slice",
    "amount": 500000,
    "comments": "Transfer",
    "transferId": "transfer-001"
  },
  {
    "date": "2026-04-01",
    "category": "Pocket Money",
    "subCategory": "Anju",
    "transactionType": "debit",
    "fund": "Income Fund",
    "account": "Slice",
    "amount": 500000,
    "comments": "5000 Pocket Money",
    "transferId": null
  },
  {
    "date": "2026-04-01",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice",
    "amount": 310675,
    "comments": "Monthly Expense Fund",
    "transferId": "transfer-002"
  },
  {
    "date": "2026-04-01",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "Slice",
    "amount": 310675,
    "comments": "Monthly Expense Fund",
    "transferId": "transfer-002"
  },
  {
    "date": "2026-04-01",
    "category": "Expense",
    "subCategory": "Monthly",
    "transactionType": "debit",
    "fund": "Income Fund",
    "account": "HDFC",
    "amount": 1000000,
    "comments": "Monthly Expense Fund",
    "transferId": "transfer-003"
  },
  {
    "date": "2026-04-01",
    "category": "Expense",
    "subCategory": "Monthly",
    "transactionType": "credit",
    "fund": "Monthly Expense Fund",
    "account": "Slice",
    "amount": 1000000,
    "comments": "Monthly Expense Fund",
    "transferId": "transfer-003"
  },
  {
    "date": "2026-04-01",
    "category": "Expense",
    "subCategory": "Annualy",
    "transactionType": "debit",
    "fund": "Income Fund",
    "account": "HDFC",
    "amount": 200000,
    "comments": "Annual Expense Fund",
    "transferId": "transfer-004"
  },
  {
    "date": "2026-04-01",
    "category": "Expense",
    "subCategory": "Annualy",
    "transactionType": "credit",
    "fund": "Annual Expense Fund",
    "account": "Slice",
    "amount": 200000,
    "comments": "Annual Expense Fund",
    "transferId": "transfer-004"
  },
  {
    "date": "2026-04-01",
    "category": "Savings",
    "subCategory": "Travel",
    "transactionType": "debit",
    "fund": "Income Fund",
    "account": "HDFC",
    "amount": 500000,
    "comments": "Travel Fund",
    "transferId": "transfer-005"
  },
  {
    "date": "2026-04-01",
    "category": "Savings",
    "subCategory": "Travel",
    "transactionType": "credit",
    "fund": "Travel Fund",
    "account": "Slice",
    "amount": 500000,
    "comments": "Travel Fund",
    "transferId": "transfer-005"
  },
  {
    "date": "2026-04-01",
    "category": "Savings",
    "subCategory": "Opportunity",
    "transactionType": "debit",
    "fund": "Income Fund",
    "account": "HDFC",
    "amount": 17050000,
    "comments": "Opportunity Fund",
    "transferId": "transfer-006"
  },
  {
    "date": "2026-04-01",
    "category": "Savings",
    "subCategory": "Opportunity",
    "transactionType": "credit",
    "fund": "Opportunity Fund",
    "account": "HDFC",
    "amount": 17050000,
    "comments": "Opportunity Fund",
    "transferId": "transfer-006"
  },
  {
    "date": "2026-04-01",
    "category": "Savings",
    "subCategory": "Mutual Fund",
    "transactionType": "debit",
    "fund": "Opportunity Fund",
    "account": "HDFC",
    "amount": 11000000,
    "comments": "Mutual Fund SIP",
    "transferId": null
  },
  {
    "date": "2026-04-01",
    "category": "Savings",
    "subCategory": "National Pension Scheme",
    "transactionType": "debit",
    "fund": "Opportunity Fund",
    "account": "Slice",
    "amount": 50059,
    "comments": "NPS",
    "transferId": null
  },
  {
    "date": "2026-04-02",
    "category": "Savings",
    "subCategory": "Mutual Fund",
    "transactionType": "debit",
    "fund": "Opportunity Fund",
    "account": "HDFC",
    "amount": 500000,
    "comments": "Mutual Fund",
    "transferId": null
  },
  {
    "date": "2026-04-03",
    "category": "Savings",
    "subCategory": "Public Provident Fund",
    "transactionType": "debit",
    "fund": "Opportunity Fund",
    "account": "HDFC",
    "amount": 50000,
    "comments": "PPF Minimum Balance",
    "transferId": null
  },
  {
    "date": "2026-04-04",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "debit",
    "fund": "Opportunity Fund",
    "account": "HDFC",
    "amount": 10000000,
    "comments": "Transfer",
    "transferId": "transfer-007"
  },
  {
    "date": "2026-04-04",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "credit",
    "fund": "Opportunity Fund",
    "account": "Slice",
    "amount": 10000000,
    "comments": "Transfer",
    "transferId": "transfer-007"
  },
  {
    "date": "2026-04-04",
    "category": "Other",
    "subCategory": "Other",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 20000,
    "comments": "Unknown",
    "transferId": null
  },
  {
    "date": "2026-04-04",
    "category": "Fee",
    "subCategory": "Other",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice",
    "amount": 20000,
    "comments": "Photo and Prints for Marriage Certificate",
    "transferId": null
  },
  {
    "date": "2026-04-04",
    "category": "Food",
    "subCategory": "Snacks",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 2000,
    "comments": "Pani Puri",
    "transferId": null
  },
  {
    "date": "2026-04-04",
    "category": "Fee",
    "subCategory": "Other",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice",
    "amount": 1200,
    "comments": "Photo Copy",
    "transferId": null
  },
  {
    "date": "2026-04-04",
    "category": "Food",
    "subCategory": "Dinner",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 21000,
    "comments": "Videshi Rasoi",
    "transferId": null
  },
  {
    "date": "2026-04-05",
    "category": "Reimbursement",
    "subCategory": "Zocdoc",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "Slice Credit Card",
    "amount": 94300,
    "comments": "BSNL Wifi",
    "transferId": null
  },
  {
    "date": "2026-04-05",
    "category": "Cashback",
    "subCategory": "Cred Payment",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "Slice Credit Card",
    "amount": 500,
    "comments": "Cred Payment",
    "transferId": null
  },
  {
    "date": "2026-04-06",
    "category": "Fee",
    "subCategory": "Other",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice",
    "amount": 1000,
    "comments": "Photo Copy",
    "transferId": null
  },
  {
    "date": "2026-04-06",
    "category": "Fee",
    "subCategory": "Other",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice",
    "amount": 5000,
    "comments": "Buggu Aadhar Card Print",
    "transferId": null
  },
  {
    "date": "2026-04-07",
    "category": "Accessories",
    "subCategory": "Home",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "Slice Credit Card",
    "amount": 154200,
    "comments": "Flipkart Covers",
    "transferId": null
  },
  {
    "date": "2026-04-07",
    "category": "Cashback",
    "subCategory": "Other",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "Slice Credit Card",
    "amount": 15000,
    "comments": "Slice Spark Cashback",
    "transferId": null
  },
  {
    "date": "2026-04-09",
    "category": "Accessories",
    "subCategory": "Home",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 180000,
    "comments": "Green Sheet Home",
    "transferId": null
  },
  {
    "date": "2026-04-09",
    "category": "Fee",
    "subCategory": "Other",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 1000,
    "comments": "Photo Copy",
    "transferId": null
  },
  {
    "date": "2026-04-09",
    "category": "Fee",
    "subCategory": "Other",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice",
    "amount": 8000,
    "comments": "Jan Aadhar Name Add",
    "transferId": null
  },
  {
    "date": "2026-04-10",
    "category": "Food",
    "subCategory": "Snacks",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 3000,
    "comments": "Pani Puri",
    "transferId": null
  },
  {
    "date": "2026-04-10",
    "category": "Food",
    "subCategory": "Snacks",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 3500,
    "comments": "Butturscotch Cone",
    "transferId": null
  },
  {
    "date": "2026-04-10",
    "category": "Food",
    "subCategory": "Snacks",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 38000,
    "comments": "Kalakand (1kg)",
    "transferId": null
  },
  {
    "date": "2026-04-11",
    "category": "Travel",
    "subCategory": "Auto",
    "transactionType": "debit",
    "fund": "Travel Fund",
    "account": "Cash",
    "amount": 2000,
    "comments": "Railway Station to Metro",
    "transferId": null
  },
  {
    "date": "2026-04-11",
    "category": "Other",
    "subCategory": "Other",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "Cash",
    "amount": 10000,
    "comments": "Mummy",
    "transferId": null
  },
  {
    "date": "2026-04-11",
    "category": "Travel",
    "subCategory": "Cab",
    "transactionType": "debit",
    "fund": "Travel Fund",
    "account": "Slice",
    "amount": 15100,
    "comments": "Pune Airport to Gaurav Flat",
    "transferId": null
  },
  {
    "date": "2026-04-12",
    "category": "Bill",
    "subCategory": "Bike",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 42500,
    "comments": "Enginer Oil",
    "transferId": null
  },
  {
    "date": "2026-04-12",
    "category": "Bill",
    "subCategory": "Fuel",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 65185,
    "comments": "5L Pertol Shell V Power",
    "transferId": null
  },
  {
    "date": "2026-04-12",
    "category": "Travel",
    "subCategory": "Auto",
    "transactionType": "debit",
    "fund": "Travel Fund",
    "account": "Slice",
    "amount": 22000,
    "comments": "Flat to Kharadi",
    "transferId": null
  },
  {
    "date": "2026-04-12",
    "category": "Travel",
    "subCategory": "Cab",
    "transactionType": "debit",
    "fund": "Travel Fund",
    "account": "Slice Credit Card",
    "amount": 23995,
    "comments": "Gaurav Flat to Flat",
    "transferId": null
  },
  {
    "date": "2026-04-14",
    "category": "Fee",
    "subCategory": "Banking Charges",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "HDFC",
    "amount": 177000,
    "comments": "Locker Rent 67",
    "transferId": null
  },
  {
    "date": "2026-04-15",
    "category": "Savings",
    "subCategory": "Mutual Fund",
    "transactionType": "debit",
    "fund": "Opportunity Fund",
    "account": "HDFC",
    "amount": 4000000,
    "comments": "Mutual Fund SIP",
    "transferId": null
  },
  {
    "date": "2026-04-15",
    "category": "Travel",
    "subCategory": "Auto",
    "transactionType": "debit",
    "fund": "Travel Fund",
    "account": "Slice Credit Card",
    "amount": 23400,
    "comments": "Flat to Office",
    "transferId": null
  },
  {
    "date": "2026-04-15",
    "category": "Travel",
    "subCategory": "Cab",
    "transactionType": "debit",
    "fund": "Travel Fund",
    "account": "Slice Credit Card",
    "amount": 15200,
    "comments": "Office to Airport Pune",
    "transferId": null
  },
  {
    "date": "2026-04-16",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "Slice",
    "amount": 2912716,
    "comments": "Transfer",
    "transferId": "transfer-008"
  },
  {
    "date": "2026-04-16",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "Slice Credit Card",
    "amount": 2912716,
    "comments": "Transfer",
    "transferId": "transfer-008"
  },
  {
    "date": "2026-04-16",
    "category": "Travel",
    "subCategory": "Auto",
    "transactionType": "debit",
    "fund": "Travel Fund",
    "account": "Cash",
    "amount": 2000,
    "comments": "Metro to Railway Station",
    "transferId": null
  },
  {
    "date": "2026-04-16",
    "category": "Food",
    "subCategory": "Snacks",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 3000,
    "comments": "Bingo",
    "transferId": null
  },
  {
    "date": "2026-04-16",
    "category": "Travel",
    "subCategory": "Auto",
    "transactionType": "debit",
    "fund": "Travel Fund",
    "account": "Cash",
    "amount": 5000,
    "comments": "Railway station to Home",
    "transferId": null
  },
  {
    "date": "2026-04-17",
    "category": "Reimbursement",
    "subCategory": "Zocdoc",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "HDFC",
    "amount": 147281,
    "comments": "Reimbursement",
    "transferId": null
  },
  {
    "date": "2026-04-17",
    "category": "Fee",
    "subCategory": "Banking Charges",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "Slice",
    "amount": 350000,
    "comments": "Locker Rent 68",
    "transferId": null
  },
  {
    "date": "2026-04-18",
    "category": "Other",
    "subCategory": "Other",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 3000,
    "comments": "Khanai Books",
    "transferId": null
  },
  {
    "date": "2026-04-18",
    "category": "Other",
    "subCategory": "Other",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 7500,
    "comments": "Bhagwan Photo",
    "transferId": null
  },
  {
    "date": "2026-04-18",
    "category": "Food",
    "subCategory": "Snacks",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 2000,
    "comments": "Ganne ka Juice",
    "transferId": null
  },
  {
    "date": "2026-04-18",
    "category": "Food",
    "subCategory": "Snacks",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 8000,
    "comments": "Kaaju Kulfi",
    "transferId": null
  },
  {
    "date": "2026-04-18",
    "category": "Bill",
    "subCategory": "Mobile Recharge",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 1000,
    "comments": "Test Recharge",
    "transferId": null
  },
  {
    "date": "2026-04-18",
    "category": "Food",
    "subCategory": "Snacks",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 4000,
    "comments": "Kurkure and Doritos",
    "transferId": null
  },
  {
    "date": "2026-04-19",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "debit",
    "fund": "Opportunity Fund",
    "account": "Slice",
    "amount": 2173275,
    "comments": "Transfer",
    "transferId": "transfer-009"
  },
  {
    "date": "2026-04-19",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "credit",
    "fund": "Opportunity Fund",
    "account": "HDFC",
    "amount": 2173275,
    "comments": "Transfer",
    "transferId": "transfer-009"
  },
  {
    "date": "2026-04-19",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "Slice",
    "amount": 25800,
    "comments": "Transfer",
    "transferId": "transfer-010"
  },
  {
    "date": "2026-04-19",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "Slice Credit Card",
    "amount": 25800,
    "comments": "Transfer",
    "transferId": "transfer-010"
  },
  {
    "date": "2026-04-19",
    "category": "Other",
    "subCategory": "Other",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "Slice",
    "amount": 35556,
    "comments": "Settlement",
    "transferId": null
  },
  {
    "date": "2026-04-19",
    "category": "Savings",
    "subCategory": "Opportunity",
    "transactionType": "debit",
    "fund": "Income Fund",
    "account": "HDFC",
    "amount": 1826775,
    "comments": "Transfer",
    "transferId": "transfer-011"
  },
  {
    "date": "2026-04-19",
    "category": "Savings",
    "subCategory": "Opportunity",
    "transactionType": "credit",
    "fund": "Opportunity Fund",
    "account": "HDFC",
    "amount": 1826775,
    "comments": "Transfer",
    "transferId": "transfer-011"
  },
  {
    "date": "2026-04-19",
    "category": "Savings",
    "subCategory": "Opportunity",
    "transactionType": "debit",
    "fund": "Income Fund",
    "account": "HDFC",
    "amount": 5991525,
    "comments": "Transfer",
    "transferId": "transfer-012"
  },
  {
    "date": "2026-04-19",
    "category": "Savings",
    "subCategory": "Opportunity",
    "transactionType": "credit",
    "fund": "Opportunity Fund",
    "account": "HDFC",
    "amount": 5991525,
    "comments": "Transfer",
    "transferId": "transfer-012"
  },
  {
    "date": "2026-04-20",
    "category": "Food",
    "subCategory": "Snacks",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 2000,
    "comments": "Bingo",
    "transferId": null
  },
  {
    "date": "2026-04-20",
    "category": "Other",
    "subCategory": "Other",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice",
    "amount": 20000,
    "comments": "Mummy Parlor",
    "transferId": null
  },
  {
    "date": "2026-04-22",
    "category": "Accessories",
    "subCategory": "Home Appliance",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 56700,
    "comments": "Flipkart AC Cover",
    "transferId": null
  },
  {
    "date": "2026-04-22",
    "category": "Cashback",
    "subCategory": "Other",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "HDFC",
    "amount": 5000,
    "comments": "Cashback",
    "transferId": null
  },
  {
    "date": "2026-04-23",
    "category": "Bill",
    "subCategory": "Fuel",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 30000,
    "comments": "Petrol",
    "transferId": null
  },
  {
    "date": "2026-04-24",
    "category": "Reimbursement",
    "subCategory": "Mobile Bill",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "Slice Credit Card",
    "amount": 52981,
    "comments": "Jio Phone Bill",
    "transferId": null
  },
  {
    "date": "2026-04-24",
    "category": "Bill",
    "subCategory": "Entertainment",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "Slice Credit Card",
    "amount": 5000,
    "comments": "Netflix",
    "transferId": null
  },
  {
    "date": "2026-04-25",
    "category": "Other",
    "subCategory": "Other",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 400,
    "comments": "Photocopy",
    "transferId": null
  },
  {
    "date": "2026-04-26",
    "category": "Food",
    "subCategory": "Dinner",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 18000,
    "comments": "Double Roti",
    "transferId": null
  },
  {
    "date": "2026-04-27",
    "category": "Marriage",
    "subCategory": "Marriage",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "Slice",
    "amount": 3200000,
    "comments": "Remaining Photographer",
    "transferId": null
  },
  {
    "date": "2026-04-27",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "debit",
    "fund": "Investment Return Fund",
    "account": "Slice",
    "amount": 1000000,
    "comments": "Transfer",
    "transferId": "transfer-013"
  },
  {
    "date": "2026-04-27",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "credit",
    "fund": "Investment Return Fund",
    "account": "Jupiter Money",
    "amount": 1000000,
    "comments": "Transfer",
    "transferId": "transfer-013"
  },
  {
    "date": "2026-04-27",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "Jupiter Money",
    "amount": 1000000,
    "comments": "Transfer",
    "transferId": "transfer-013"
  },
  {
    "date": "2026-04-27",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "Slice",
    "amount": 1000000,
    "comments": "Transfer",
    "transferId": "transfer-013"
  },
  {
    "date": "2026-04-27",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "debit",
    "fund": "Investment Return Fund",
    "account": "Slice",
    "amount": 200000,
    "comments": "Transfer",
    "transferId": "transfer-014"
  },
  {
    "date": "2026-04-27",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "Slice",
    "amount": 200000,
    "comments": "Transfer",
    "transferId": "transfer-014"
  },
  {
    "date": "2026-04-29",
    "category": "Lend",
    "subCategory": "Gaurav",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "Slice Credit Card",
    "amount": 117700,
    "comments": "Urban Company Service Advance",
    "transferId": null
  },
  {
    "date": "2026-04-29",
    "category": "Food",
    "subCategory": "Snacks",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 2500,
    "comments": "Bingo",
    "transferId": null
  },
  {
    "date": "2026-04-29",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "Amazon ICICI Card",
    "amount": 82500,
    "comments": "Transfer",
    "transferId": null
  },
  {
    "date": "2026-04-29",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "Amazon Pay",
    "amount": 10000,
    "comments": "Transfer",
    "transferId": null
  },
  {
    "date": "2026-04-29",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "Amazon ICICI Card",
    "amount": 72000,
    "comments": "Transfer",
    "transferId": null
  },
  {
    "date": "2026-04-29",
    "category": "Fee",
    "subCategory": "Fee",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "Amazon ICICI Card",
    "amount": 500,
    "comments": "Amazon Fee",
    "transferId": null
  },
  {
    "date": "2026-04-30",
    "category": "Fee",
    "subCategory": "Other",
    "transactionType": "debit",
    "fund": "Annual Expense Fund",
    "account": "Slice",
    "amount": 50000,
    "comments": "Buggu Airtel Sim Card",
    "transferId": null
  },
  {
    "date": "2026-04-30",
    "category": "Clothing",
    "subCategory": "Slippers",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 50000,
    "comments": "Slippers",
    "transferId": null
  },
  {
    "date": "2026-04-30",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice",
    "amount": 564285,
    "comments": "Transfer",
    "transferId": "transfer-015"
  },
  {
    "date": "2026-04-30",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "credit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 564285,
    "comments": "Transfer",
    "transferId": "transfer-015"
  },
  {
    "date": "2026-04-30",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "Slice Credit Card",
    "amount": 564285,
    "comments": "Transfer",
    "transferId": "transfer-015"
  },
  {
    "date": "2026-04-30",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "Slice",
    "amount": 564285,
    "comments": "Transfer",
    "transferId": "transfer-015"
  },
  {
    "date": "2026-05-01",
    "category": "Investment Return",
    "subCategory": "Savings Account",
    "transactionType": "credit",
    "fund": "Investment Return Fund",
    "account": "Slice",
    "amount": 150722,
    "comments": "Savings Account Interest",
    "transferId": null
  },
  {
    "date": "2026-05-01",
    "category": "Salary",
    "subCategory": "Zocdoc",
    "transactionType": "credit",
    "fund": "Income Fund",
    "account": "HDFC",
    "amount": 27068300,
    "comments": "April",
    "transferId": null
  },
  {
    "date": "2026-05-01",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice",
    "amount": 380515,
    "comments": "Monthly Expense Fund",
    "transferId": "transfer-016"
  },
  {
    "date": "2026-05-01",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "Slice",
    "amount": 380515,
    "comments": "Monthly Expense Fund",
    "transferId": "transfer-016"
  },
  {
    "date": "2026-05-01",
    "category": "Expense",
    "subCategory": "Annualy",
    "transactionType": "debit",
    "fund": "Income Fund",
    "account": "HDFC",
    "amount": 1200000,
    "comments": "Annual Expense Fund",
    "transferId": "transfer-017"
  },
  {
    "date": "2026-05-01",
    "category": "Expense",
    "subCategory": "Annualy",
    "transactionType": "credit",
    "fund": "Annual Expense Fund",
    "account": "Slice",
    "amount": 1200000,
    "comments": "Annual Expense Fund",
    "transferId": "transfer-017"
  },
  {
    "date": "2026-05-01",
    "category": "Savings",
    "subCategory": "Travel",
    "transactionType": "debit",
    "fund": "Income Fund",
    "account": "HDFC",
    "amount": 500000,
    "comments": "Travel Fund",
    "transferId": "transfer-018"
  },
  {
    "date": "2026-05-01",
    "category": "Savings",
    "subCategory": "Travel",
    "transactionType": "credit",
    "fund": "Travel Fund",
    "account": "Slice",
    "amount": 500000,
    "comments": "Travel Fund",
    "transferId": "transfer-018"
  },
  {
    "date": "2026-05-01",
    "category": "Expense",
    "subCategory": "Monthly",
    "transactionType": "debit",
    "fund": "Income Fund",
    "account": "HDFC",
    "amount": 4000000,
    "comments": "Monthly Expense Fund",
    "transferId": "transfer-019"
  },
  {
    "date": "2026-05-01",
    "category": "Expense",
    "subCategory": "Monthly",
    "transactionType": "credit",
    "fund": "Monthly Expense Fund",
    "account": "Slice",
    "amount": 4000000,
    "comments": "Monthly Expense Fund",
    "transferId": "transfer-019"
  },
  {
    "date": "2026-05-01",
    "category": "Savings",
    "subCategory": "Opportunity",
    "transactionType": "debit",
    "fund": "Income Fund",
    "account": "HDFC",
    "amount": 20768300,
    "comments": "Opportunity Fund",
    "transferId": "transfer-020"
  },
  {
    "date": "2026-05-01",
    "category": "Savings",
    "subCategory": "Opportunity",
    "transactionType": "credit",
    "fund": "Opportunity Fund",
    "account": "HDFC",
    "amount": 20768300,
    "comments": "Opportunity Fund",
    "transferId": "transfer-020"
  },
  {
    "date": "2026-05-01",
    "category": "Savings",
    "subCategory": "Mutual Fund",
    "transactionType": "debit",
    "fund": "Opportunity Fund",
    "account": "HDFC",
    "amount": 11000000,
    "comments": "Mutual Fund SIP",
    "transferId": null
  },
  {
    "date": "2026-05-01",
    "category": "Pocket Money",
    "subCategory": "Anju",
    "transactionType": "debit",
    "fund": "Income Fund",
    "account": "Slice",
    "amount": 600000,
    "comments": "5000 Pocket Money + Extra 1000",
    "transferId": null
  },
  {
    "date": "2026-05-01",
    "category": "Food",
    "subCategory": "Snacks",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 2000,
    "comments": "Chana Daal",
    "transferId": null
  },
  {
    "date": "2026-05-01",
    "category": "Food",
    "subCategory": "Other",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 1400,
    "comments": "Water Bottle",
    "transferId": null
  },
  {
    "date": "2026-05-01",
    "category": "Food",
    "subCategory": "Snacks",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice",
    "amount": 6000,
    "comments": "Ranu Chocolate",
    "transferId": null
  },
  {
    "date": "2026-05-01",
    "category": "Fee",
    "subCategory": "Other",
    "transactionType": "debit",
    "fund": "Travel Fund",
    "account": "Slice Credit Card",
    "amount": 12000,
    "comments": "AC Train Waiting Room",
    "transferId": null
  },
  {
    "date": "2026-05-03",
    "category": "Lend",
    "subCategory": "Gaurav",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "Slice Credit Card",
    "amount": 470800,
    "comments": "Urban Company Service",
    "transferId": null
  },
  {
    "date": "2026-05-03",
    "category": "Lend",
    "subCategory": "Gaurav",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "Cash",
    "amount": 11500,
    "comments": "Maid",
    "transferId": null
  },
  {
    "date": "2026-05-03",
    "category": "House Help",
    "subCategory": "Maid",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "Cash",
    "amount": 38500,
    "comments": "Contributed to round off Gaurav",
    "transferId": null
  },
  {
    "date": "2026-05-03",
    "category": "Lend",
    "subCategory": "Gaurav",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "HDFC",
    "amount": 600000,
    "comments": "Adjusted as part of Rent",
    "transferId": null
  },
  {
    "date": "2026-05-03",
    "category": "Rent",
    "subCategory": "Apartment",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "HDFC",
    "amount": 2400000,
    "comments": "May",
    "transferId": null
  },
  {
    "date": "2026-05-03",
    "category": "Utility",
    "subCategory": "Home Appliance",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Amazon ICICI Card",
    "amount": 20300,
    "comments": "Twist Mop",
    "transferId": null
  },
  {
    "date": "2026-05-03",
    "category": "Reimbursement",
    "subCategory": "Zocdoc",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "Slice Credit Card",
    "amount": 150000,
    "comments": "Airtel Wifi",
    "transferId": null
  },
  {
    "date": "2026-05-03",
    "category": "Food",
    "subCategory": "Lunch",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Amazon Pay",
    "amount": 11275,
    "comments": "Eatsure Biryani",
    "transferId": null
  },
  {
    "date": "2026-05-03",
    "category": "Food",
    "subCategory": "Lunch",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 25425,
    "comments": "Eatsure Biryani",
    "transferId": null
  },
  {
    "date": "2026-05-03",
    "category": "Grocery",
    "subCategory": "Pantry",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 130034,
    "comments": "Zepto",
    "transferId": null
  },
  {
    "date": "2026-05-03",
    "category": "Grocery",
    "subCategory": "Dairy Product",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 70028,
    "comments": "Zepto",
    "transferId": null
  },
  {
    "date": "2026-05-03",
    "category": "Grocery",
    "subCategory": "Vegitables",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 2969,
    "comments": "Zepto",
    "transferId": null
  },
  {
    "date": "2026-05-03",
    "category": "Grocery",
    "subCategory": "Personal Care",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 20127,
    "comments": "Zepto",
    "transferId": null
  },
  {
    "date": "2026-05-03",
    "category": "Grocery",
    "subCategory": "Vegitables",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice",
    "amount": 8995,
    "comments": "Big Basket",
    "transferId": null
  },
  {
    "date": "2026-05-03",
    "category": "Grocery",
    "subCategory": "Dairy Product",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice",
    "amount": 3600,
    "comments": "Big Basket",
    "transferId": null
  },
  {
    "date": "2026-05-03",
    "category": "Grocery",
    "subCategory": "Pantry",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice",
    "amount": 29106,
    "comments": "Big Basket",
    "transferId": null
  },
  {
    "date": "2026-05-03",
    "category": "Fee",
    "subCategory": "Delivery Charges",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice",
    "amount": 600,
    "comments": "Big Basket Handling Charges",
    "transferId": null
  },
  {
    "date": "2026-05-03",
    "category": "Cashback",
    "subCategory": "Other",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "Slice",
    "amount": 2500,
    "comments": "Big Basket Wallet Credit",
    "transferId": null
  },
  {
    "date": "2026-05-03",
    "category": "Cashback",
    "subCategory": "Other",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "Slice",
    "amount": 39856,
    "comments": "Neucoins spend on Big Basket",
    "transferId": null
  },
  {
    "date": "2026-05-04",
    "category": "Grocery",
    "subCategory": "Pantry",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice",
    "amount": 93733,
    "comments": "Big Basket",
    "transferId": null
  },
  {
    "date": "2026-05-04",
    "category": "Fee",
    "subCategory": "Delivery Charges",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice",
    "amount": 600,
    "comments": "Big Basket Handling Charges",
    "transferId": null
  },
  {
    "date": "2026-05-04",
    "category": "Cashback",
    "subCategory": "Other",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "Slice",
    "amount": 56,
    "comments": "Big Basket Wallet Credit",
    "transferId": null
  },
  {
    "date": "2026-05-04",
    "category": "Cashback",
    "subCategory": "Other",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "Slice",
    "amount": 94277,
    "comments": "Neucoins spend on Big Basket",
    "transferId": null
  },
  {
    "date": "2026-05-04",
    "category": "Grocery",
    "subCategory": "Pantry",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Amazon ICICI Card",
    "amount": 98600,
    "comments": "Amazon Now",
    "transferId": null
  },
  {
    "date": "2026-05-04",
    "category": "Grocery",
    "subCategory": "Vegitables",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Amazon ICICI Card",
    "amount": 18020,
    "comments": "Amazon Now",
    "transferId": null
  },
  {
    "date": "2026-05-04",
    "category": "Grocery",
    "subCategory": "Household & Cleaners",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Amazon ICICI Card",
    "amount": 24100,
    "comments": "Amazon Now",
    "transferId": null
  },
  {
    "date": "2026-05-04",
    "category": "Grocery",
    "subCategory": "Dairy Product",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Amazon ICICI Card",
    "amount": 3500,
    "comments": "Amazon Now",
    "transferId": null
  },
  {
    "date": "2026-05-04",
    "category": "Refund",
    "subCategory": "Other",
    "transactionType": "credit",
    "fund": "Monthly Expense Fund",
    "account": "Amazon Pay",
    "amount": 1380,
    "comments": "Amazon Now - Refund for Missing Lemon Grass",
    "transferId": null
  },
  {
    "date": "2026-05-04",
    "category": "Grocery",
    "subCategory": "Household & Cleaners",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Amazon ICICI Card",
    "amount": 8500,
    "comments": "Amazon Now",
    "transferId": null
  },
  {
    "date": "2026-05-04",
    "category": "Grocery",
    "subCategory": "Pantry",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Amazon ICICI Card",
    "amount": 26500,
    "comments": "Amazon Now",
    "transferId": null
  },
  {
    "date": "2026-05-04",
    "category": "Utility",
    "subCategory": "Home Appliance",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Amazon ICICI Card",
    "amount": 175900,
    "comments": "Amazon Now - Pressure Cooker",
    "transferId": null
  },
  {
    "date": "2026-05-04",
    "category": "Cashback",
    "subCategory": "Other",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "Amazon Pay",
    "amount": 20000,
    "comments": "Amazon Now",
    "transferId": null
  },
  {
    "date": "2026-05-04",
    "category": "Cashback",
    "subCategory": "Other",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "Amazon Pay",
    "amount": 20000,
    "comments": "Amazon Now",
    "transferId": null
  },
  {
    "date": "2026-05-04",
    "category": "Cashback",
    "subCategory": "Other",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "HDFC",
    "amount": 4190,
    "comments": "BHIM UPI",
    "transferId": null
  },
  {
    "date": "2026-05-05",
    "category": "Lend",
    "subCategory": "Gaurav",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "Amazon ICICI Card",
    "amount": 57000,
    "comments": "Electricity Bill",
    "transferId": null
  },
  {
    "date": "2026-05-05",
    "category": "Food",
    "subCategory": "Dinner",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 15500,
    "comments": "Eatclub - Rolls",
    "transferId": null
  },
  {
    "date": "2026-05-07",
    "category": "Lend",
    "subCategory": "Gaurav",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "Amazon ICICI Card",
    "amount": 91100,
    "comments": "Gas Bill",
    "transferId": null
  },
  {
    "date": "2026-05-07",
    "category": "Lend",
    "subCategory": "Gaurav",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "Slice Credit Card",
    "amount": 38000,
    "comments": "Electricity Bill",
    "transferId": null
  },
  {
    "date": "2026-05-07",
    "category": "Cashback",
    "subCategory": "Other",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "Slice Credit Card",
    "amount": 1000,
    "comments": "Cashback",
    "transferId": null
  },
  {
    "date": "2026-05-07",
    "category": "Gift",
    "subCategory": "Anniversary",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "Amazon ICICI Card",
    "amount": 208894,
    "comments": "Mummy",
    "transferId": null
  },
  {
    "date": "2026-05-07",
    "category": "Gift",
    "subCategory": "Anniversary",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "Slice Credit Card",
    "amount": 32900,
    "comments": "Papa",
    "transferId": null
  },
  {
    "date": "2026-05-07",
    "category": "Bill",
    "subCategory": "Wifi Bill",
    "transactionType": "debit",
    "fund": "Annual Expense Fund",
    "account": "Amazon ICICI Card",
    "amount": 848184,
    "comments": "BSNL Annual Home - 1 May 2026 to 31 May 2027",
    "transferId": null
  },
  {
    "date": "2026-05-07",
    "category": "Reimbursement",
    "subCategory": "Wifi Bill",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "Amazon ICICI Card",
    "amount": 81342,
    "comments": "BSNL Wifi",
    "transferId": null
  },
  {
    "date": "2026-05-07",
    "category": "Other",
    "subCategory": "Other",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "Cash",
    "amount": 19500,
    "comments": "Sattlement",
    "transferId": null
  },
  {
    "date": "2026-05-08",
    "category": "Cashback",
    "subCategory": "Other",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "Amazon Pay",
    "amount": 5114,
    "comments": "Amazon Pay",
    "transferId": null
  },
  {
    "date": "2026-05-08",
    "category": "Cashback",
    "subCategory": "Other",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "Amazon Pay",
    "amount": 4887,
    "comments": "Amazon Pay",
    "transferId": null
  },
  {
    "date": "2026-05-09",
    "category": "Food",
    "subCategory": "Snacks",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 6500,
    "comments": "Pani Puri & Bhel Puri",
    "transferId": null
  },
  {
    "date": "2026-05-09",
    "category": "Grocery",
    "subCategory": "Vegitables",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice Credit Card",
    "amount": 11000,
    "comments": "Offline",
    "transferId": null
  },
  {
    "date": "2026-05-10",
    "category": "Grocery",
    "subCategory": "Pantry",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice",
    "amount": 9565,
    "comments": "Big Basket",
    "transferId": null
  },
  {
    "date": "2026-05-10",
    "category": "Grocery",
    "subCategory": "Vegitables",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice",
    "amount": 90755,
    "comments": "Big Basket",
    "transferId": null
  },
  {
    "date": "2026-05-10",
    "category": "Grocery",
    "subCategory": "Fruits",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice",
    "amount": 13120,
    "comments": "Big Basket",
    "transferId": null
  },
  {
    "date": "2026-05-10",
    "category": "Grocery",
    "subCategory": "Dairy Product",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice",
    "amount": 3600,
    "comments": "Big Basket",
    "transferId": null
  },
  {
    "date": "2026-05-10",
    "category": "Fee",
    "subCategory": "Delivery Charges",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice",
    "amount": 600,
    "comments": "Big Basket Handling Charges",
    "transferId": null
  },
  {
    "date": "2026-05-10",
    "category": "Cashback",
    "subCategory": "Other",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "Slice",
    "amount": 128665,
    "comments": "Neucoins spend on Big Basket",
    "transferId": null
  },
  {
    "date": "2026-05-10",
    "category": "Grocery",
    "subCategory": "Pantry",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Amazon ICICI Card",
    "amount": 91100,
    "comments": "Amazon Now",
    "transferId": null
  },
  {
    "date": "2026-05-10",
    "category": "Grocery",
    "subCategory": "Vegitables",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Amazon ICICI Card",
    "amount": 38500,
    "comments": "Amazon Now",
    "transferId": null
  },
  {
    "date": "2026-05-10",
    "category": "Grocery",
    "subCategory": "Fruits",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Amazon ICICI Card",
    "amount": 26300,
    "comments": "Amazon Now",
    "transferId": null
  },
  {
    "date": "2026-05-10",
    "category": "Cashback",
    "subCategory": "Other",
    "transactionType": "credit",
    "fund": "Expense Saving Fund",
    "account": "Amazon Pay",
    "amount": 20000,
    "comments": "Amazon Now",
    "transferId": null
  },
  {
    "date": "2026-05-10",
    "category": "Fee",
    "subCategory": "Insurance",
    "transactionType": "debit",
    "fund": "Annual Expense Fund",
    "account": "Slice Credit Card",
    "amount": 87000,
    "comments": "Policy Bazaar -  Bike Insurance",
    "transferId": null
  },
  {
    "date": "2026-05-10",
    "category": "Bill",
    "subCategory": "Bike",
    "transactionType": "debit",
    "fund": "Annual Expense Fund",
    "account": "Slice",
    "amount": 400000,
    "comments": "Bike Servicing and Repair",
    "transferId": null
  },
  {
    "date": "2026-05-10",
    "category": "Lend",
    "subCategory": "Gaurav",
    "transactionType": "debit",
    "fund": "Expense Saving Fund",
    "account": "Slice Credit Card",
    "amount": 109400,
    "comments": "Gas Bill",
    "transferId": null
  },
  {
    "date": "2026-05-10",
    "category": "Investment Return",
    "subCategory": "Savings Account",
    "transactionType": "credit",
    "fund": "Investment Return Fund",
    "account": "Slice",
    "amount": 40075,
    "comments": "Savings Account Interest",
    "transferId": null
  },
  {
    "date": "2026-05-10",
    "category": "Other",
    "subCategory": "Other",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice",
    "amount": 11080,
    "comments": "Sattlement",
    "transferId": null
  },
  {
    "date": "2026-05-10",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "debit",
    "fund": "Income Fund",
    "account": "HDFC",
    "amount": 600000,
    "comments": "Transfer",
    "transferId": "transfer-021"
  },
  {
    "date": "2026-05-10",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "credit",
    "fund": "Income Fund",
    "account": "Slice",
    "amount": 600000,
    "comments": "Transfer",
    "transferId": "transfer-021"
  },
  {
    "date": "2026-05-10",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "debit",
    "fund": "Monthly Expense Fund",
    "account": "Slice",
    "amount": 2400000,
    "comments": "Transfer",
    "transferId": "transfer-022"
  },
  {
    "date": "2026-05-10",
    "category": "Transfer",
    "subCategory": "Transfer",
    "transactionType": "credit",
    "fund": "Monthly Expense Fund",
    "account": "HDFC",
    "amount": 2400000,
    "comments": "Transfer",
    "transferId": "transfer-022"
  }
];

export function seedDatabase(db: Database): void {
  const now = new Date().toISOString();

  for (const acct of SEED_ACCOUNTS) {
    db.run('INSERT INTO accounts (name, type, created_at) VALUES (?, ?, ?)',
      [acct.name, acct.type, now]);
  }

  for (const fund of SEED_FUNDS) {
    db.run('INSERT INTO funds (name, created_at) VALUES (?, ?)', [fund, now]);
  }

  for (const cat of SEED_CATEGORIES) {
    db.run('INSERT INTO categories (name) VALUES (?)', [cat]);
  }

  const accountIds = new Map<string, number>();
  for (const row of db.exec('SELECT id, name FROM accounts')[0]?.values ?? []) {
    accountIds.set(row[1] as string, row[0] as number);
  }
  const fundIds = new Map<string, number>();
  for (const row of db.exec('SELECT id, name FROM funds')[0]?.values ?? []) {
    fundIds.set(row[1] as string, row[0] as number);
  }
  const categoryIds = new Map<string, number>();
  for (const row of db.exec('SELECT id, name FROM categories')[0]?.values ?? []) {
    categoryIds.set(row[1] as string, row[0] as number);
  }

  for (const sc of SEED_SUB_CATEGORIES) {
    const catId = categoryIds.get(sc.category);
    db.run('INSERT INTO sub_categories (name, category_id) VALUES (?, ?)', [sc.name, catId]);
  }
  const categoryNamesById = new Map<number, string>();
  for (const [name, id] of categoryIds) categoryNamesById.set(id, name);
  const subCategoryIds = new Map<string, number>();
  for (const row of db.exec('SELECT id, name, category_id FROM sub_categories')[0]?.values ?? []) {
    const catName = categoryNamesById.get(row[2] as number) ?? '';
    subCategoryIds.set(`${catName}:${row[1]}`, row[0] as number);
  }

  for (const txn of SEED_TRANSACTIONS) {
    const catId = categoryIds.get(txn.category)!;
    const scId = subCategoryIds.get(`${txn.category}:${txn.subCategory}`)!;
    const fundId = fundIds.get(txn.fund)!;
    const accountId = accountIds.get(txn.account)!;
    db.run(
      `INSERT INTO transactions (date, category_id, sub_category_id, transaction_type, fund_id, account_id, amount, comments, transfer_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [txn.date, catId, scId, txn.transactionType, fundId, accountId,
       txn.amount, txn.comments, txn.transferId, now, now]
    );
  }
}

export function isDatabaseSeeded(db: Database): boolean {
  const result = db.exec('SELECT COUNT(*) FROM transactions');
  return result.length > 0 && (result[0].values[0][0] as number) > 0;
}
