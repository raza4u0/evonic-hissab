export type PlanType = 'trial' | 'paid';

export interface Company {
  id: string;
  name: string;
  nameAr?: string; // Optional Secondary Trade Name
  trn: string; // UAE Tax Registration Number (15 digits)
  logoUrl?: string;
  currency: string; // Default AED
  fyStart: string; // Financial Year Start Date
  invoicePrefix: string; // e.g., 'INV-'
  proformaPrefix?: string; // e.g., 'PI-'
  quotationPrefix: string; // e.g., 'QTN-'
  deliveryPrefix: string; // e.g., 'DN-'
  creditNotePrefix?: string; // e.g., 'CN-'
  nextInvoiceNumber?: number; // Starting sequence number, e.g. 100 or 1001 or 5000
  nextDeliveryNumber?: number;
  isInvoicePrefixLocked?: boolean; // Company's toggle to lock invoice sequence/prefix
  bankName: string;
  bankAccountName: string;
  bankIban: string;
  bankCustomerName?: string;
  bankCity?: string;
  bankDetail?: string;
  footerNotes: string;
  inventoryEnabled: boolean; // ON/OFF
  staffEnabled?: boolean; // Staff Management Module ON/OFF Toggle
  vatEnabled?: boolean; // VAT/Tax Module ON/OFF Toggle
  erpEnabled?: boolean; // Enterprise ERP & Double-Entry Accounting ON/OFF Toggle
  posEnabled?: boolean; // Fast Thermal POS System Module ON/OFF Toggle (Default OFF)
  multiBranchEnabled?: boolean; // Multi-Branch Operations ON/OFF Toggle
  themePrimaryColor?: string; // App-wide primary brand color hex
  themeSecondaryColor?: string; // App-wide secondary brand accent color hex
  isSetupCompleted?: boolean; // Whether Corporate Setup Wizard has been finished
  targetIndustry?: string; // Selected primary target industry sector
  
  // High-fidelity general & brand settings fields
  email?: string;
  phone?: string;
  address?: string;
  timezone?: string;
  
  // Invoice settings
  invoiceSubtitle?: string;
  invoiceSubtitlePos?: 'left' | 'center' | 'right';
  invoiceFontFamily?: string;
  invoiceFontSize?: number;
  invoiceBold?: boolean;
  invoiceItalic?: boolean;
  invoiceThemeColor?: string;
  invoiceHeaderBgColor?: string;
  invoiceHeaderColor?: string;
  invoiceCustomHeaderTitle?: string;
  invoiceWatermarkText?: string;
  invoiceShowOfficialSeal?: boolean;
  invoiceSignatoryName?: string;
  invoiceSignatoryTitle?: string;
  invoiceSignatureUrl?: string;
  invoiceTerms?: string;
  invoiceFooterTemplate?: string;
  invoiceAutoRescale?: boolean;
  invoiceShowBankDetails?: boolean;

  // Quotation settings
  quotationThemeColor?: string;
  quotationHeaderBgColor?: string;
  quotationSignatoryName?: string;
  quotationSignatoryTitle?: string;
  quotationTerms?: string;
  quotationAutoRescale?: boolean;

  // Business profile details
  tagline?: string;
  industry?: string;
  foundedYear?: string;
  businessRegNo?: string;
  about?: string;
  services?: string;
  socialFacebook?: string;
  socialTwitter?: string;
  socialLinkedin?: string;

  // Tax & Currency configurations
  gccCountry?: 'UAE' | 'KSA' | 'Oman' | 'Bahrain' | 'Qatar' | 'Kuwait' | 'Pakistan' | 'India' | 'Bangladesh' | 'Nepal';
  country?: string;
  currencySymbol?: string;
  symbolPosition?: 'before' | 'after';
  taxRate?: number;
  taxName?: string;
  invoiceTemplate?: 'template1' | 'template2' | 'template3' | 'template4' | 'template5';
  invoicePaperSize?: 'A4' | 'A5';
  printPaperSize?: 'A4' | 'A5';
  invoiceMargin?: 'normal' | 'compact' | 'spacious';
  invoiceCustomMarginMm?: number;
  invoiceCompanyNameSize?: 'normal' | 'large' | 'extra_large';
  invoiceHeaderLayout?: 'split' | 'banner' | 'centered';
  invoiceHeaderPadding?: 'compact' | 'normal' | 'spacious';
  logoPosition?: 'left' | 'center' | 'right';
  logoSize?: 'small' | 'medium' | 'large';
  autoReminderEnabled?: boolean;
  appFont?: string;
  dateFormat?: string;
  branchName?: string;

  // New UAE Taxation & FTA compliance extensions
  corporateTaxEnabled?: boolean;
  corporateTaxRate?: number;
  corporateTaxThreshold?: number;
  corporateTaxSmallBusinessRelief?: boolean;
  corporateTaxPeriod?: string;
  ctrn?: string; // Corporate Tax Registration Number
  taxAgentName?: string;
  taxAgentNumber?: string; // TAN
  vatFilingFrequency?: 'monthly' | 'quarterly' | 'yearly';
  
  // Custom theme and visual configuration
  appAccentColor?: 'blue' | 'emerald' | 'purple' | 'amber' | 'teal' | 'rose' | 'slate';

  // UAE Profile Expiry and Registries
  tradeLicenseExpiry?: string;
  chamberRegNo?: string;

  // Accounting Ledger default mappings & Lock controls
  defaultReceivableAccount?: string;
  defaultSalesAccount?: string;
  defaultPayableAccount?: string;
  defaultBankCashAccount?: string;
  fiscalYearLockDate?: string;

  // Barcode Scanning configuration
  barcodeScanningEnabled?: boolean;
  defaultBarcodeType?: 'EAN-13' | 'QR' | 'Code128';

  // Work Shift & HR Payroll Calculation Configurations
  dayShiftStart?: string; // e.g., '08:00'
  dayShiftEnd?: string; // e.g., '17:00'
  dayShiftBreakMins?: number; // e.g., 60
  nightShiftStart?: string; // e.g., '20:00'
  nightShiftEnd?: string; // e.g., '05:00'
  nightShiftBreakMins?: number; // e.g., 60
  salaryCalculationBasis?: '30_fixed' | '31_fixed' | 'actual_month_days'; // '30_fixed' default for UAE

  // Custom Tax & Text Field configurations
  customTaxName?: string;
  customTaxEnabled?: boolean;
  showCustomTaxOnInvoice?: boolean;
  customTextFieldName?: string;
  customTextFieldValue?: string;
  customTextFieldEnabled?: boolean;
  showCustomTextOnInvoice?: boolean;

  // Pharmacy & Medical Store Specific Attributes
  pharmaLicenseNo?: string; // Drug Sale License (DSL) / DRAP Reg
  pharmaPharmacistName?: string; // Incharge Registered Pharmacist
  pharmaShowBatchExpiry?: boolean; // Display Batch & Expiry by default on invoices
  pharmaDrapRegistered?: boolean;
}

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  mobileNumber?: string;
  website?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  paymentTerms?: string;
  paymentMethod?: string;
  salesTaxNumber?: string;
  tinNumber?: string;
  trn?: string; // UAE TRN (optional for customers)
  vatStatus?: 'yes' | 'no' | 'pending'; // VAT status for provisional VAT customers
  tempTrnId?: string; // Auto-generated temporary VAT ID like TEMP-CUST-001
  vatPendingCreatedAt?: string; // Timestamp/date when provisional status started
  auditHistory?: Array<{ date: string; action: string; details: string; }>;
  address?: string;
  emirate?: 'Abu Dhabi' | 'Dubai' | 'Sharjah' | 'Ajman' | 'Umm Al Quwain' | 'Ras Al Khaimah' | 'Fujairah' | string;
  customerCode?: string;
  referralCode?: string;
  personalReferralCode?: string;
  managementLedgerCode?: string; // e.g. '1100-01'
  managementLedgerName?: string; // e.g. 'Trade Debtors - Corporate'
  openingBalance?: number; // Initial Ledger Opening Balance

  // Pharmacy & Medical Store Patient / Doctor / Clinic Profile
  customerType?: 'regular' | 'patient' | 'doctor' | 'clinic' | 'hospital' | 'pharmacy_wholesale';
  doctorName?: string; // Prescribing Physician / Doctor Name
  patientMrNo?: string; // Medical Record / Patient Token Number
  patientAge?: string;
  patientGender?: string;
  clinicHospitalName?: string;
  drugSaleLicenseNo?: string; // Drug Sale License (DSL) for Wholesale Pharmacies
}

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  supplierCode?: string;
  trn?: string; // UAE Tax Registration Number (15 digits)
  phone?: string;
  email?: string;
  address?: string;
  emirate?: string;
  tradeLicense?: string;
  dateAdded?: string;
  contactPerson?: string;
  mobileNumber?: string;
  website?: string;
  country?: string;
  postalCode?: string;
  paymentTerms?: string;
  vatStatus?: 'yes' | 'no' | 'pending';
  tempTrnId?: string;
}

export interface InventoryItem {
  id: string;
  companyId: string;
  name: string;
  sku: string;
  category?: string; // Optional product category tag
  subcategory?: string; // Optional product subcategory tag
  brand?: string; // Brand / Manufacturer (e.g. Godes, RMZ, Logitech)
  vatType?: 'standard' | 'zero_rated' | 'exempt'; // UAE FTA Tax Classification
  vatRate?: number; // 5% standard or 0%
  supplierName?: string; // Vendor / Supplier Name
  batchNumber?: string; // Batch / Lot Number
  expiryDate?: string; // Product Expiry Date (YYYY-MM-DD)
  weightKg?: number; // Weight in KG
  purchasePrice: number;
  salePrice: number;
  stockQuantity: number;
  minStockThreshold: number; // Alerts if stock falls below this (default 1)
  internalNotes?: string;
  barcode?: string; // Optional barcode/QR string for quick scanner lookups
  branch?: string;
  image?: string; // Base64 encoded or URL product image
  
  // Custom unit models and additional costs
  sellingUnit?: string; // Unit price model: KG, piece, box, etc.
  costUnit?: string;    // Cost units model: KG per box, per piece, per unit, etc.
  otherCosts?: number;  // Amount for additional cost metrics
  barcodeType?: 'EAN-13' | 'QR' | 'Code128'; // Custom barcode format for item

  // Auto & Bike Spare Parts Specialized Attributes
  vehicleType?: 'car' | 'bike' | 'both' | 'heavy';
  partNumber?: string; // OEM or Manufacturer Part Number (e.g. 04465-02220, 13780-01D00)
  oemNumber?: string;  // Original Equipment Manufacturer Cross-Reference
  vehicleMake?: string; // e.g. Toyota, Honda, Yamaha, Suzuki, Nissan
  vehicleModel?: string; // e.g. Corolla, CD 70, CG 125, Civic, YBR 125
  modelYearFrom?: string; // e.g. 2018
  modelYearTo?: string; // e.g. 2024
  engineType?: string; // e.g. 1.8L VVTi, 70cc 4-Stroke, 125cc
  partCategory?: string; // e.g. Engine, Brakes, Suspension, Electrical, Transmission, Body
  shelfLocation?: string; // Rack / Bin / Shelf location in workshop (e.g. Rack A-04, Bin 12)
  condition?: 'new_oem' | 'aftermarket' | 'used_genuine' | 'reconditioned' | 'new_sealed' | 'refurbished' | 'used';
  warranty?: string; // e.g. 6 Months, 1 Year, 7 Days Testing, None
  compatibilityNotes?: string; // Cross-compatibility descriptions

  // Computer, IT, Printer & Service Specialized Attributes
  itCategory?: 'laptop' | 'desktop' | 'printer' | 'toner' | 'component' | 'networking' | 'accessory' | 'service';
  serialNumber?: string; // Hardware Serial Number / S/N (e.g. 5CD34291XX, VNB3R92019)
  deviceSpecs?: string;  // Processor, RAM, SSD, Screen, etc. (e.g. Core i7-1355U, 16GB, 512GB NVMe)
  printerModelCompatibility?: string; // Compatible printer models or toner cartridge code (e.g. HP M404, Canon 057)
  isServiceItem?: boolean; // True for IT repairs, maintenance, AMC
  serviceType?: 'repair' | 'installation' | 'maintenance' | 'software' | 'network' | 'amc';
  jobCardId?: string; // Linked repair ticket / job sheet
}

export type DocumentType = 'Invoice' | 'Proforma' | 'Quotation' | 'DeliveryNote' | 'CreditNote';
export type DocumentStatus = 'Draft' | 'Sent' | 'Paid' | 'Unpaid' | 'Approved' | 'Delivered' | 'Cancelled' | 'Partially Paid';

export interface DocumentItem {
  itemId: string;
  name: string;
  sku: string;
  qty: number;
  rate: number;
  vatRate: number; // Defaults to 5% for UAE VAT
  vatAmount: number;
  subtotal: number;
  total: number;
  unit?: string;
  discount?: number;
  industryData?: Record<string, any>;
  customFields?: Array<{ key: string; value: string }>;
  entryMode?: 'catalog' | 'manual';
  saveToInventory?: boolean;

  // Auto & Bike Spare Parts Line-Item Attributes
  partNumber?: string;
  oemNumber?: string;
  vehicleCompatibility?: string;
  warranty?: string;
  shelfLocation?: string;
  condition?: string;

  // Computer, IT, Printer & Service Line-Item Attributes
  itCategory?: string;
  serialNumber?: string;
  deviceSpecs?: string;
  printerModelCompatibility?: string;
  isServiceItem?: boolean;
  jobCardId?: string;

  // Pharmacy & Medical Store Specialized Line-Item Attributes
  medBatchNo?: string; // Batch Number
  medExpiry?: string;  // Expiry Date (MM/YY)
  medDosage?: string;  // Dosage form (Tablets, Syrup, etc.)
  medGeneric?: string; // Generic / Formula Name
  medPackSize?: string;// Pack / Strip size
  medManufacturer?: string; // Pharma Manufacturer
  medDrapReg?: string; // Drug Registration Number / DRAP No
  medRxStatus?: string;// Rx or OTC
}

export interface SalesDocument {
  id: string;
  companyId: string;
  type: DocumentType;
  docNumber: string; // formatted with prefix
  rawNumber: number; // auto-increment sequential number
  date: string;
  dueDate?: string;
  customerId: string;
  items: DocumentItem[];
  subtotal: number;
  vatTotal: number; // VAT at 5% (mandatory)
  discount: number;
  total: number;
  status: DocumentStatus;
  notes?: string;
  internalNotes?: string;
  reference?: string; // quotation reference / PO reference
  bankName: string;
  bankAccountName: string;
  bankIban: string;
  bankCustomerName?: string;
  bankCity?: string;
  bankDetail?: string;
  footerNotes: string;
  trn: string; // Store company's TRN at time of issue
  paymentTerms?: string;
  paymentMethod?: string;
  preparedBy?: string; // Prepared By: Staff Name (Designation)
  staffId?: string;
  vatInclusive?: boolean; // Whether VAT was included in rate
  lpoNumber?: string;
  orderId?: string;
  paymentReceived?: number;
  paymentHistory?: Array<{
    id: string;
    date: string;
    amount: number;
    method: string;
    refNo: string;
    receivedBy: string;
  }>;
  currency?: string;
  exchangeRate?: number;
  convertedToInvoiceId?: string;
  convertedToInvoiceNumber?: string;
  convertedFromQuotationNumber?: string;
  convertedFromProformaNumber?: string;
  deliveryNoteNumber?: string;
  convertedFromDeliveryNoteNumber?: string;
  industryData?: Record<string, any>;
  customFields?: Array<{ key: string; value: string }>;
  industry?: string;
  branch?: string;
  customTaxName?: string;
  customTaxAmount?: number;
  customTaxEnabled?: boolean;
  showCustomTaxOnInvoice?: boolean;
  customTextFieldName?: string;
  customTextFieldValue?: string;
  customTextFieldEnabled?: boolean;
  showCustomTextOnInvoice?: boolean;

  // Pharmacy & Medical Store Document Prescriptions
  doctorName?: string; // Prescribing Doctor / Clinic
  patientMrNo?: string; // Patient Medical Record / Token Number
  patientAge?: string;
  patientGender?: string;
  pharmaLicenseNo?: string; // Drug Sale License (DSL) No
  pharmacistName?: string; // Attending Registered Pharmacist
}

export interface Expense {
  id: string;
  companyId: string;
  supplierName: string;
  supplierTrn?: string;
  invoiceNumber: string;
  date: string;
  description: string;
  category: 'Rent' | 'Utilities' | 'Salaries' | 'Purchases' | 'Marketing' | 'Logistics' | 'Supplier Credit Note' | 'Debit Note' | 'Other';
  entryType?: 'Standard' | 'Supplier Credit Note' | 'Debit Note';
  amount: number; // taxable amount
  vatAmount: number; // 5% VAT
  total: number;
  status: 'Paid' | 'Unpaid';
  vatRecoverability?: 'Fully Recoverable' | 'Non-Recoverable' | 'Partially Recoverable';
  internalNotes?: string;
  preparedBy?: string; // Prepared By: Staff Name (Designation)
  attachment?: { name: string; dataUrl: string };
  items?: Array<{ name: string; qty: number; rate: number; vatRate: number; vatAmount: number; total: number }>;
  paymentReceived?: number;
  paymentHistory?: Array<{
    id: string;
    date: string;
    amount: number;
    method: string;
    refNo: string;
    paidBy: string;
    bankName?: string;
    chequeDate?: string;
    notes?: string;
    voucherNo?: string;
  }>;
  branch?: string;
  customTaxName?: string;
  customTaxAmount?: number;
  customTextFieldName?: string;
  customTextFieldValue?: string;
}

export interface RecurringInvoice {
  id: string;
  companyId: string;
  customerId: string;
  description: string;
  amount: number; // taxable subtotal
  vatAmount: number; // 5% VAT
  total: number;
  nextRunDate: string; // YYYY-MM-DD
  isActive: boolean; // ON/OFF
}

export interface StaffDocument {
  name: string;
  type: string; // 'Passport' | 'EmiratesID' | 'Visa' | 'LaborCard' | 'OfferLetter' | 'JoiningLetter' | 'Contract' | 'Cancellation' | 'Other'
  fileName: string;
  fileSize?: string;
  uploadedAt: string;
  dataUrl?: string; // base64 representation if available
}

export interface LeaveRecord {
  id: string;
  type: 'Annual' | 'Sick' | 'Unpaid' | 'Maternity' | 'Paternity' | 'Other';
  startDate: string;
  endDate: string;
  days: number;
  status: 'Approved' | 'Pending' | 'Rejected';
  notes?: string;
}

export interface SalarySlip {
  id: string;
  monthYear: string; // e.g., "June 2026"
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  foodAllowance: number;
  otherAllowance: number;
  overtimeHours: number;
  overtimeRate: number;
  overtimePay: number;
  deductions: number;
  netSalary: number;
  paymentMethod: string;
  paymentDate: string;
  status: 'Paid' | 'Draft';
  preparedBy?: string;
}

export interface Staff {
  id: string;
  companyId: string;
  employeeId: string; // e.g., STF-001
  name: string;
  role?: string; // 'Admin' | 'Manager' | 'Accountant' | 'Sales' | 'Staff'
  photoUrl?: string; // photo base64 or placeholder
  designation: string;
  department?: string;
  joiningDate: string;
  dob?: string;
  gender: 'Male' | 'Female';
  nationality?: string;
  religion?: string;
  
  // Contact
  phone: string;
  email: string;
  address?: string;
  cityCountry?: string;

  // Emergency contact
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelationship: string;

  // Salary & Work
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  foodAllowance: number;
  otherAllowance: number;
  overtimeRate: number;
  paymentMethod: 'Bank Transfer' | 'Cash';
  bankName?: string;
  iban?: string;
  workShift: 'Morning' | 'Evening' | 'Night';
  workingDays: string[]; // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  workingHoursPerDay: number; // default 8

  // Status
  status: 'Active' | 'Inactive' | 'Resigned';

  // Legal Document Expiry Dates
  visaExpiryDate?: string; // YYYY-MM-DD
  eidExpiryDate?: string; // YYYY-MM-DD
  passportExpiryDate?: string; // YYYY-MM-DD

  // Contract Details
  contractType: 'Limited' | 'Unlimited';
  contractStartDate?: string;
  contractEndDate?: string;

  // Leave Balance
  leaveBalanceTotal: number;
  leaveBalanceUsed: number;

  // Advance Salary
  advanceSalaryGiven: number;
  advanceSalaryInstallments: number;
  advanceSalaryPending: number;

  // Attachments & records
  documents: StaffDocument[];
  leaveRecords: LeaveRecord[];
  salarySlips: SalarySlip[];
  branch?: string;
  attendanceLog?: AttendanceRecord[];
  incrementLog?: Array<{ id: string; date: string; oldSalary: number; newSalary: number; designationChange?: string; approvedBy: string }>;
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Sick Leave' | 'Late';
  remarks?: string;
}

export interface COAAccount {
  code: string; // unique code, e.g., '1000', '1200'
  companyId?: string; // Optional company isolation
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  parentCode?: string; // Parent account code
  isSystem?: boolean; // Read-only / cannot be deleted (like VAT Input, VAT Output)
  description?: string;
}

export interface JournalLine {
  accountCode: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  companyId: string;
  date: string;
  reference: string; // e.g., "INV-1001", "EXP-202", "MANUAL-001"
  description: string;
  status: 'Draft' | 'Posted';
  lines: JournalLine[];
  isAutoLinked?: boolean;
}

export interface PdcCheque {
  id: string;
  companyId: string;
  type: 'incoming' | 'outgoing'; // Incoming (from customer) or Outgoing (to supplier)
  partyName: string; // e.g. "Al Habtoor", "ABC Trading", "XYZ LLC"
  partyType?: 'customer' | 'supplier' | 'other';
  chequeNumber: string; // e.g. "12345"
  bankName: string; // e.g. "Emirates NBD", "FAB", "ADCB"
  amount: number; // e.g. 25000
  chequeDate: string; // Issue / Receive date (YYYY-MM-DD)
  maturityDate: string; // Clearance / Maturity date (YYYY-MM-DD)
  status: 'Pending' | 'Cleared' | 'Bounced' | 'Cancelled';
  notes?: string;
  clearedDate?: string;
  bouncedReason?: string;
  createdDate: string;
  attachment?: { name: string; dataUrl: string };
  chequeImage?: string;
}

export interface PurchaseOrderItem {
  id?: string;
  itemId?: string;
  name: string;
  sku?: string;
  qty: number;
  rate: number;
  vatRate: number; // 5% standard
  vatAmount: number;
  subtotal: number;
  total: number;
  unit?: string;
}

export interface PurchaseOrder {
  id: string;
  companyId: string;
  poNumber: string; // e.g. "PO-1001"
  rawNumber: number;
  date: string; // YYYY-MM-DD
  expectedDeliveryDate?: string; // YYYY-MM-DD
  supplierId?: string;
  supplierName: string;
  supplierTrn?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  supplierAddress?: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  vatTotal: number;
  discount: number;
  total: number;
  currency: string;
  status: 'Draft' | 'Sent' | 'Approved' | 'Partially Received' | 'Completed' | 'Cancelled';
  paymentTerms?: string;
  deliveryLocation?: string;
  branch?: string;
  notes?: string;
  preparedBy?: string;
  approvedBy?: string;
  grnIds?: string[];
  convertedToExpenseId?: string;
  convertedToExpenseNumber?: string;
}

export interface GoodsReceivedNoteItem {
  id?: string;
  itemId?: string;
  name: string;
  sku?: string;
  orderedQty: number;
  receivedQty: number;
  rejectedQty?: number;
  rate: number;
  vatRate: number;
  vatAmount: number;
  subtotal: number;
  total: number;
  unit?: string;
  condition?: 'Good' | 'Damaged' | 'Excess' | 'Shortage';
  remarks?: string;
}

export interface GoodsReceivedNote {
  id: string;
  companyId: string;
  grnNumber: string; // e.g. "GRN-1001"
  rawNumber: number;
  poId?: string;
  poNumber?: string;
  date: string; // YYYY-MM-DD
  supplierId?: string;
  supplierName: string;
  supplierTrn?: string;
  supplierDeliveryNoteNo?: string; // Vendor delivery slip / invoice reference
  vehicleNo?: string;
  warehouseLocation?: string;
  branch?: string;
  items: GoodsReceivedNoteItem[];
  subtotal: number;
  vatTotal: number;
  total: number;
  status: 'Received' | 'Inspected' | 'Stock Updated' | 'Billed';
  receivedBy: string;
  inspectedBy?: string;
  notes?: string;
  convertedToExpenseId?: string;
  convertedToExpenseNumber?: string;
  stockIncremented?: boolean;
}

export interface Branch {
  id: string;
  companyId: string;
  code: string; // e.g. "DXB-01", "AUH-01"
  name: string; // e.g. "Dubai Main HQ", "Abu Dhabi Showroom"
  emirate: 'Abu Dhabi' | 'Dubai' | 'Sharjah' | 'Ajman' | 'Umm Al Quwain' | 'Ras Al Khaimah' | 'Fujairah';
  address: string;
  phone?: string;
  email?: string;
  managerName?: string;
  isHeadOffice?: boolean;
  invoicePrefix?: string;
  status: 'Active' | 'Inactive';
}

export type AssetCategory = 
  | 'Computers & IT Hardware' 
  | 'Office Furniture & Fixtures' 
  | 'Commercial Vehicles' 
  | 'Plant & Machinery' 
  | 'Buildings & Leasehold' 
  | 'Office Equipment';

export type DepreciationMethod = 'Straight-Line' | 'Reducing-Balance';

export interface FixedAsset {
  id: string;
  companyId: string;
  assetCode: string; // e.g. "AST-1001"
  rawNumber: number;
  name: string;
  category: AssetCategory;
  serialNumber?: string;
  purchaseDate: string; // YYYY-MM-DD
  purchaseCost: number; // AED
  residualValue: number; // AED (Salvage value)
  usefulLifeYears: number; // e.g. 3, 5, 10
  depreciationMethod: DepreciationMethod;
  depreciationRatePercent?: number;
  locationBranch?: string;
  custodianStaff?: string;
  supplierName?: string;
  status: 'Active' | 'Under Maintenance' | 'Disposed' | 'Written Off';
  disposalDate?: string;
  disposalAmount?: number;
  disposalReason?: string;
  notes?: string;
}

export interface TreasuryAccount {
  id: string;
  companyId: string;
  accountType: 'Bank' | 'Cash' | 'Payment Gateway' | 'Petty Cash';
  accountName: string; // e.g. "Emirates NBD Corporate", "Main Cash Vault"
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  swiftCode?: string;
  branchName?: string;
  currency: string;
  openingBalance: number;
  currentBalance: number;
  status: 'Active' | 'Dormant' | 'Closed';
  isDefault?: boolean;
  coaCode?: string;
  notes?: string;
}

export interface FundTransfer {
  id: string;
  companyId: string;
  transferNumber: string; // e.g. "TRF-1001"
  rawNumber: number;
  date: string; // YYYY-MM-DD
  fromAccountId: string;
  fromAccountName: string;
  toAccountId: string;
  toAccountName: string;
  amount: number; // AED
  fee: number; // Bank charges / transfer fee
  feeAccountId?: string;
  transferType: 'Inter-Bank' | 'Bank to Cash' | 'Cash to Bank' | 'Owner Drawing' | 'Capital Injection';
  referenceNo?: string;
  authorizedBy: string;
  notes?: string;
  status: 'Completed' | 'Pending' | 'Cancelled';
}



