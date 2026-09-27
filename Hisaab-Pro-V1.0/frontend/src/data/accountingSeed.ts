import { COAAccount, JournalEntry } from '../types';

export const INITIAL_COA_ACCOUNTS: COAAccount[] = [
  // 1. ASSETS (1000 - 1999)
  { code: '1000', name: 'Cash / Bank Operating Account', type: 'Asset', description: 'Primary bank account for business operations' },
  { code: '1200', name: 'Accounts Receivable (Sales Ledger)', type: 'Asset', description: 'Outstanding invoices from customers' },
  { code: '1300', name: 'Inventory Asset Account', type: 'Asset', description: 'Value of physical stock in warehouse' },
  { code: '1350', name: 'UAE FTA Input VAT Recoverable Asset', type: 'Asset', isSystem: true, description: '5% VAT paid on business expenses, recoverable from FTA' },

  // 2. LIABILITIES (2000 - 2999)
  { code: '2100', name: 'Accounts Payable (Supplier Ledger)', type: 'Liability', description: 'Outstanding bills to suppliers' },
  { code: '2250', name: 'UAE FTA Output VAT Standard Liability', type: 'Liability', isSystem: true, description: '5% VAT collected on sales, payable to FTA' },
  { code: '2260', name: 'VAT Suspense Payable (Provisional)', type: 'Liability', isSystem: true, description: 'VAT collected on provisional invoices with pending TRN' },
  { code: '2300', name: 'UAE Corporate Tax Provision Liability', type: 'Liability', isSystem: true, description: '9% Corporate tax accrued, payable to FTA' },

  // 3. EQUITY (3000 - 3999)
  { code: '3000', name: 'Share Capital', type: 'Equity', description: 'Owner initial investment capital' },
  { code: '3200', name: 'Retained Earnings', type: 'Equity', description: 'Accumulated profits retained in business' },

  // 4. REVENUE (4000 - 4999)
  { code: '4000', name: 'Standard Commercial Sales Revenue', type: 'Revenue', description: 'Revenue from standard rated 5% sales' },
  { code: '4200', name: 'Other Operating Income', type: 'Revenue', description: 'Auxiliary business revenue streams' },

  // 5. EXPENSES (5000 - 6999)
  { code: '5000', name: 'Cost of Goods Sold (COGS)', type: 'Expense', description: 'Direct material or purchase cost of items sold' },
  { code: '6000', name: 'Operational Expenses', type: 'Expense', description: 'General overhead and operating expenses' },
  { code: '6100', name: 'Rent Expense', type: 'Expense', parentCode: '6000', description: 'Office or warehouse rental costs' },
  { code: '6200', name: 'Utilities Expense', type: 'Expense', parentCode: '6000', description: 'Water, electricity, and telecommunications' },
  { code: '6300', name: 'Salaries Expense', type: 'Expense', parentCode: '6000', description: 'Employee wages and allowances' },
  { code: '6400', name: 'Marketing Expense', type: 'Expense', parentCode: '6000', description: 'Advertising and corporate brand promotions' },
  { code: '6500', name: 'Logistics Expense', type: 'Expense', parentCode: '6000', description: 'Delivery, freight, and cargo transport costs' },
  { code: '6600', name: 'Client Entertainment Expenses (50% Tax Deductible)', type: 'Expense', parentCode: '6000', description: 'Business hospitality and entertainment, subject to 50% limit under CT Article 32' },
  { code: '6700', name: 'Fines, Penalties & Violations (Non-Deductible)', type: 'Expense', parentCode: '6000', description: 'Administrative fines, traffic penalties, or late fees, non-deductible under CT Article 33' },
  { code: '6800', name: 'Corporate Tax Expense', type: 'Expense', parentCode: '6000', description: 'Current tax expense for the period, non-deductible' }
];

export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [];
