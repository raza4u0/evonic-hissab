import { Company, Customer, InventoryItem, SalesDocument, Expense, Supplier, Staff, PurchaseOrder, GoodsReceivedNote, Branch, FixedAsset, TreasuryAccount, FundTransfer } from '../types';

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'co-1',
    name: 'evonix Technologies',
    trn: '100234567890003',
    logoUrl: '/evonix-logo.svg',
    currency: 'AED',
    fyStart: '2026-01-01',
    invoicePrefix: 'INV-',
    quotationPrefix: 'QTN-',
    deliveryPrefix: 'DN-',
    bankName: 'Emirates NBD',
    bankAccountName: 'evonix Technologies',
    bankIban: 'AE120230000001234567890',
    footerNotes: 'Thank you for your business.',
    inventoryEnabled: false,
    staffEnabled: true,
    vatEnabled: true,
    erpEnabled: true,
    posEnabled: false,
    multiBranchEnabled: false
  }
];

// Clean state for customer demonstration: 0 demo customers
export const INITIAL_CUSTOMERS: Customer[] = [];

// Clean state: 0 demo suppliers
export const INITIAL_SUPPLIERS: Supplier[] = [];

// Clean state: 0 demo inventory stock items
export const INITIAL_INVENTORY: InventoryItem[] = [];

// Clean state: 0 demo pre-generated services
export const INITIAL_SERVICES: InventoryItem[] = [];

// Clean state: 0 demo invoices, quotations, delivery notes, or credit notes
export const INITIAL_DOCUMENTS: SalesDocument[] = [];

// Clean state: 0 demo expenses
export const INITIAL_EXPENSES: Expense[] = [];

// 1 Clean Administrator/Owner Profile for system authentication and operations
export const INITIAL_STAFF: Staff[] = [
  {
    id: 'stf_1',
    companyId: 'co-1',
    employeeId: 'STF-001',
    name: 'Administrator',
    role: 'Admin',
    designation: 'Managing Director',
    department: 'Management',
    joiningDate: '2026-01-01',
    dob: '1990-01-01',
    gender: 'Male',
    nationality: 'UAE National',
    religion: 'Other',
    phone: '+971 50 000 0000',
    email: 'admin@hisaabpro.com',
    address: 'Office 101, Business Center',
    cityCountry: 'Dubai, UAE',
    emergencyName: 'Emergency Contact',
    emergencyPhone: '+971 50 000 0000',
    emergencyRelationship: 'Family',
    basicSalary: 10000,
    housingAllowance: 0,
    transportAllowance: 0,
    foodAllowance: 0,
    otherAllowance: 0,
    overtimeRate: 50,
    paymentMethod: 'Bank Transfer',
    workShift: 'Morning',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    workingHoursPerDay: 8,
    status: 'Active',
    contractType: 'Unlimited',
    leaveBalanceTotal: 30,
    leaveBalanceUsed: 0,
    advanceSalaryGiven: 0,
    advanceSalaryInstallments: 0,
    advanceSalaryPending: 0,
    documents: [],
    leaveRecords: [],
    salarySlips: []
  }
];

// 1 Clean Default Main Head Office Branch
export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'br-1',
    companyId: 'co-1',
    code: 'HQ',
    name: 'Main Head Office',
    emirate: 'Dubai',
    address: 'Main Office',
    phone: '',
    email: '',
    managerName: 'Administrator',
    isHeadOffice: true,
    invoicePrefix: 'INV-',
    status: 'Active'
  }
];

// Clean state: 0 purchase orders
export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [];

// Clean state: 0 goods received notes
export const INITIAL_GOODS_RECEIVED_NOTES: GoodsReceivedNote[] = [];

// Clean state: 0 fixed assets
export const INITIAL_FIXED_ASSETS: FixedAsset[] = [];

// 2 Clean Treasury Accounts with 0 balance for pristine operations
export const INITIAL_TREASURY_ACCOUNTS: TreasuryAccount[] = [
  {
    id: 'tr-1',
    companyId: 'co-1',
    accountType: 'Bank',
    accountName: 'Operating Bank Account',
    bankName: 'Main Bank',
    accountNumber: '',
    iban: '',
    swiftCode: '',
    branchName: '',
    currency: 'AED',
    openingBalance: 0,
    currentBalance: 0,
    status: 'Active',
    isDefault: true,
    coaCode: '1000',
    notes: 'Primary operational bank account'
  },
  {
    id: 'tr-2',
    companyId: 'co-1',
    accountType: 'Petty Cash',
    accountName: 'Cash in Hand',
    bankName: 'Cash Drawer',
    accountNumber: '',
    currency: 'AED',
    openingBalance: 0,
    currentBalance: 0,
    status: 'Active',
    isDefault: false,
    coaCode: '1000',
    notes: 'Main cash drawer'
  }
];

// Clean state: 0 fund transfers
export const INITIAL_FUND_TRANSFERS: FundTransfer[] = [];
