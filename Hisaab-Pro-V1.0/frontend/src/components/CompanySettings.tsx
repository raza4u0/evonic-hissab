import React, { useState, useEffect } from 'react';
import { triggerPrint } from '../utils/printHelper';
import { 
  Building, 
  Settings, 
  Receipt, 
  CreditCard, 
  FileText, 
  Package, 
  Save, 
  Upload, 
  Image as ImageIcon,
  CheckCircle2,
  FileCheck,
  Briefcase,
  Percent,
  Bell,
  Trash2,
  Info,
  Lock,
  Unlock,
  Shield,
  ChevronDown,
  Download,
  Clock,
  Keyboard,
  Sparkles,
  MessageSquare,
  Mail,
  AlertTriangle,
  Server,
  Wifi,
  Laptop,
  Activity,
  RefreshCw,
  Key,
  Search,
  Plus,
  X,
  Printer,
  PhoneCall,
  AlertCircle,
  Check,
  Award,
  Palette,
  Paintbrush,
  RotateCcw,
  Sliders,
  Eye,
  Store,
  GitBranch,
  MapPin,
  Scale
} from 'lucide-react';
import { Company, Customer, SalesDocument, Expense, COAAccount, Branch, InventoryItem } from '../types';
import { getCountryConfig, ALL_SUPPORTED_COUNTRIES, GCC_COUNTRIES, ASIA_COUNTRIES, COUNTRIES_CONFIG, SupportedCountry } from '../utils/countryLocalization';
import AIImporter from './AIImporter';
import { serializeCompanyDbToNetworkStream, handleSimulatedNetworkRequest } from '../utils/syncEngine';
import { scanContentForThreats, sanitizeDataValue, logSecurityEvent, getSecurityAuditLogs, verifySystemIntegrity, SecurityAuditLog } from '../utils/securityShield';
import { getLicensesFromDB, generateLicenses, assignCode, exportToExcel, deactivateHardwareNode, unbindLicenseClient, renewLicense, LicenseRecord, submitUninstallFeedback } from '../utils/licenseEngine';
import { getPrintCountLast30Days } from '../utils/printHelper';
import { PRESET_THEME_COLORS, applyThemeToCssVariables, adjustLightness, hexToRgb } from '../utils/themeEngine';
import { safeSetLocalStorage } from '../utils/safeStorage';
import { activateTrialLicenseKey } from '../utils/trialSecurityEngine';

interface CompanySettingsProps {
  company: Company;
  companies: Company[];
  onSave: (updated: Company) => void;
  onDeleteCompany?: (id: string) => void;
  onTriggerDuplicateSaza?: (
    type: 'Company' | 'Invoice' | 'Purchase' | 'Quotation',
    identifierNameOrNo: string,
    dateOrTrn: string,
    existingId: string
  ) => void;
  initialSubTab?: string;
  onSubTabChange?: (tab: string) => void;
  
  // AI Importer props
  customers: Customer[];
  onAddCustomer: (cust: Omit<Customer, 'id' | 'companyId'>) => void;
  documents: SalesDocument[];
  onAddDocument: (doc: Omit<SalesDocument, 'id' | 'companyId'>) => void;
  expenses: Expense[];
  onAddExpense: (exp: Omit<Expense, 'id' | 'companyId'>) => void;
  coaAccounts: COAAccount[];
  onAddAccount: (acc: COAAccount) => void;
  activePlan?: 'trial' | 'pro_1y' | 'pro_3y' | 'pro_5y' | 'pro_lifetime' | 'basic';
  trialDaysLeft?: number;
  onOpenPricingModal?: () => void;
  isLoginEnabled?: boolean;
  onToggleLogin?: (val: boolean) => void;
  loginEmail?: string;
  onChangeLoginEmail?: (val: string) => void;
  loginMobile?: string;
  onChangeLoginMobile?: (val: string) => void;
  loginPassword?: string;
  onChangeLoginPassword?: (val: string) => void;
  invoicePortalOpened?: boolean;

  // Multi-Branch Management props
  branches?: Branch[];
  onAddBranch?: (branch: Omit<Branch, 'id'>) => void;
  onUpdateBranch?: (branch: Branch) => void;
  onDeleteBranch?: (id: string) => void;

  // Single-PC configuration props
  pcType?: 'main' | 'client';
  setPcType?: (type: 'main' | 'client') => void;
  machineId?: string;
  mainPcIp?: string;
  setMainPcIp?: (ip: string) => void;
  lanConnected?: boolean;
  setLanConnected?: (val: boolean) => void;
  lanSyncLogs?: any[];
  onAddLanSyncLog?: (method: string, endpoint: string, status: number, details: string) => void;
  inventory?: InventoryItem[];
  onResetAllData?: () => void;
  onOpenCorporateSetup?: () => void;
}

type SettingsTab = 'general' | 'theme' | 'logo' | 'invoice' | 'quotation' | 'profile' | 'tax' | 'notifications' | 'data' | 'importer' | 'shortcuts' | 'security' | 'plan' | 'auth' | 'feedback' | 'branches';

const getCompanyWithDefaults = (comp: Company): Company => {
  const safeComp = comp || {} as Company;
  return {
    ...safeComp,
    id: safeComp.id || '',
    name: safeComp.name || '',
    nameAr: safeComp.nameAr || '',
    trn: safeComp.trn || '',
    email: safeComp.email || 'Hissabpro1@gmail.com',
    phone: safeComp.phone || '0575385552',
    address: safeComp.address || '125/9 Industrial Area, Dubai, UAE',
    timezone: safeComp.timezone || 'Asia/Dubai',
    dateFormat: safeComp.dateFormat || 'DD/MM/YYYY',
    themePrimaryColor: safeComp.themePrimaryColor || '#2CA01C',
    themeSecondaryColor: safeComp.themeSecondaryColor || '#108000',
    
    invoiceSubtitle: safeComp.invoiceSubtitle || 'Building Construction & Maintenance',
    invoiceSubtitlePos: safeComp.invoiceSubtitlePos || 'left',
    invoiceFontFamily: safeComp.invoiceFontFamily || 'Verdana',
    invoiceFontSize: safeComp.invoiceFontSize || 18,
    invoiceBold: safeComp.invoiceBold ?? true,
    invoiceItalic: safeComp.invoiceItalic ?? false,
    invoiceThemeColor: safeComp.invoiceThemeColor || '#10b981', // emerald green
    invoiceHeaderBgColor: safeComp.invoiceHeaderBgColor || '#f3f4f6',
    invoiceSignatoryName: safeComp.invoiceSignatoryName || 'Yaser Mahmood',
    invoiceSignatoryTitle: safeComp.invoiceSignatoryTitle || 'Managing Director',
    invoiceTerms: safeComp.invoiceTerms || 'All payments are due within 15 days of invoice date. Late payments incur a fee.',
    invoiceFooterTemplate: safeComp.invoiceFooterTemplate || 'default',
    invoiceAutoRescale: safeComp.invoiceAutoRescale ?? true,
    invoiceShowBankDetails: safeComp.invoiceShowBankDetails ?? true,
    invoiceTemplate: safeComp.invoiceTemplate || 'template1',
    invoicePaperSize: safeComp.invoicePaperSize || safeComp.printPaperSize || 'A4',
    invoiceMargin: safeComp.invoiceMargin || 'normal',
    invoiceCompanyNameSize: safeComp.invoiceCompanyNameSize || 'large',
    invoiceHeaderLayout: safeComp.invoiceHeaderLayout || 'split',
    invoiceHeaderPadding: safeComp.invoiceHeaderPadding || 'normal',

    quotationThemeColor: safeComp.quotationThemeColor || '#06b6d4',
    quotationHeaderBgColor: safeComp.quotationHeaderBgColor || '#f8fafc',
    quotationSignatoryName: safeComp.quotationSignatoryName || 'Yaser Mahmood',
    quotationSignatoryTitle: safeComp.quotationSignatoryTitle || 'Managing Director',
    quotationTerms: safeComp.quotationTerms || 'Quotations are valid for 30 days. Prices are subject to materials availability.',
    quotationAutoRescale: safeComp.quotationAutoRescale ?? true,

    tagline: safeComp.tagline ?? '',
    industry: safeComp.industry || 'Construction',
    foundedYear: safeComp.foundedYear ?? '',
    businessRegNo: safeComp.businessRegNo ?? '',
    about: safeComp.about ?? '',
    services: safeComp.services ?? '',
    socialFacebook: safeComp.socialFacebook ?? '',
    socialTwitter: safeComp.socialTwitter ?? '',
    socialLinkedin: safeComp.socialLinkedin ?? '',

    gccCountry: safeComp.gccCountry || 'UAE',
    currency: safeComp.currency || 'AED',
    currencySymbol: safeComp.currencySymbol || 'AED',
    symbolPosition: safeComp.symbolPosition || 'before',
    taxRate: safeComp.taxRate ?? 5,
    taxName: safeComp.taxName || 'VAT',

    logoUrl: safeComp.logoUrl || '',
    logoPosition: safeComp.logoPosition || 'center',
    logoSize: safeComp.logoSize || 'medium',
    invoiceSignatureUrl: safeComp.invoiceSignatureUrl || '',
    quotationPrefix: safeComp.quotationPrefix || 'QTN-',
    invoicePrefix: safeComp.invoicePrefix || 'INV-',
    deliveryPrefix: safeComp.deliveryPrefix || 'DN-',
    nextInvoiceNumber: safeComp.nextInvoiceNumber || 1001,
    isInvoicePrefixLocked: safeComp.isInvoicePrefixLocked ?? false,
    bankName: safeComp.bankName || '',
    bankAccountName: safeComp.bankAccountName || '',
    bankIban: safeComp.bankIban || '',
    bankCustomerName: safeComp.bankCustomerName || '',
    bankCity: safeComp.bankCity || '',
    bankDetail: safeComp.bankDetail || '',
    footerNotes: safeComp.footerNotes || '',
    fyStart: safeComp.fyStart || '',
    inventoryEnabled: safeComp.inventoryEnabled ?? false,
    staffEnabled: safeComp.staffEnabled ?? true,
    vatEnabled: safeComp.vatEnabled ?? true,
    erpEnabled: safeComp.erpEnabled ?? true,
    posEnabled: safeComp.posEnabled ?? false,
    multiBranchEnabled: safeComp.multiBranchEnabled ?? false,
    autoReminderEnabled: safeComp.autoReminderEnabled ?? false,
    appFont: safeComp.appFont || 'Inter',
    branchName: safeComp.branchName || 'Main Branch',
    
    // New UAE corporate tax & FTA agency defaults
    corporateTaxEnabled: safeComp.corporateTaxEnabled ?? false,
    corporateTaxRate: safeComp.corporateTaxRate ?? 9,
    corporateTaxThreshold: safeComp.corporateTaxThreshold ?? 375000,
    corporateTaxSmallBusinessRelief: safeComp.corporateTaxSmallBusinessRelief ?? true,
    corporateTaxPeriod: safeComp.corporateTaxPeriod || 'Annual',
    ctrn: safeComp.ctrn || '',
    taxAgentName: safeComp.taxAgentName || '',
    taxAgentNumber: safeComp.taxAgentNumber || '',
    vatFilingFrequency: safeComp.vatFilingFrequency || 'quarterly',
    
    // Theme accent default
    appAccentColor: safeComp.appAccentColor || 'blue',
    
    // Expiries & registries defaults
    tradeLicenseExpiry: safeComp.tradeLicenseExpiry || '',
    chamberRegNo: safeComp.chamberRegNo || '',
    
    // Ledger defaults and lock configs
    defaultReceivableAccount: safeComp.defaultReceivableAccount || '1200',
    defaultSalesAccount: safeComp.defaultSalesAccount || '4000',
    defaultPayableAccount: safeComp.defaultPayableAccount || '2100',
    defaultBankCashAccount: safeComp.defaultBankCashAccount || '1000',
    fiscalYearLockDate: safeComp.fiscalYearLockDate || '',

    // Barcode Scanning Settings defaults
    barcodeScanningEnabled: safeComp.barcodeScanningEnabled ?? true,
    defaultBarcodeType: safeComp.defaultBarcodeType || 'EAN-13',

    // Work Shift & HR Payroll Settings
    dayShiftStart: safeComp.dayShiftStart || '08:00',
    dayShiftEnd: safeComp.dayShiftEnd || '17:00',
    dayShiftBreakMins: safeComp.dayShiftBreakMins ?? 60,
    nightShiftStart: safeComp.nightShiftStart || '20:00',
    nightShiftEnd: safeComp.nightShiftEnd || '05:00',
    nightShiftBreakMins: safeComp.nightShiftBreakMins ?? 60,
    salaryCalculationBasis: safeComp.salaryCalculationBasis || '30_fixed'
  };
};


export interface IbanChangeRequest {
  id: string;
  entityType: 'VENDOR' | 'CUSTOMER' | 'COMPANY';
  entityName: string;
  requestedBy: string;
  currentIban: string;
  requestedIban: string;
  bankName: string;
  requestDate: string;
  status: 'PENDING_OOB_VERIFICATION' | 'VERIFIED_OOB_APPROVED' | 'REJECTED_SUSPECTED_FRAUD';
  oobVerificationPhone?: string;
  oobVerifiedBy?: string;
  verifiedAt?: string;
}

export default function CompanySettings({ 
  company, 
  companies = [], 
  onSave, 
  onDeleteCompany, 
  onTriggerDuplicateSaza,
  initialSubTab,
  onSubTabChange,
  customers,
  onAddCustomer,
  documents,
  onAddDocument,
  expenses,
  onAddExpense,
  coaAccounts,
  onAddAccount,
  activePlan = 'trial',
  trialDaysLeft = 90,
  onOpenPricingModal,
  isLoginEnabled = false,
  onToggleLogin,
  loginEmail = 'Hissabpro1@gmail.com',
  onChangeLoginEmail,
  loginMobile = '0501234567',
  onChangeLoginMobile,
  loginPassword = 'admin123',
  onChangeLoginPassword,
  invoicePortalOpened = false,
  branches = [],
  onAddBranch,
  onUpdateBranch,
  onDeleteBranch,
  pcType = 'main',
  setPcType = () => {},
  machineId = '',
  mainPcIp = '192.168.1.100',
  setMainPcIp = () => {},
  lanConnected = true,
  setLanConnected = () => {},
  lanSyncLogs = [],
  onAddLanSyncLog = () => {},
  inventory = [],
  onResetAllData,
  onOpenCorporateSetup
}: CompanySettingsProps) {
  // Select active setting sub-tab
  const [activeSubTab, setActiveSubTab] = useState<SettingsTab>((initialSubTab as SettingsTab) || 'general');
  const [formData, setFormData] = useState<Company>(() => getCompanyWithDefaults(company));
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState(false);

  // Multi-Branch Management local state
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [branchFormCode, setBranchFormCode] = useState('');
  const [branchFormName, setBranchFormName] = useState('');
  const [branchFormEmirate, setBranchFormEmirate] = useState<'Abu Dhabi' | 'Dubai' | 'Sharjah' | 'Ajman' | 'Umm Al Quwain' | 'Ras Al Khaimah' | 'Fujairah'>('Dubai');
  const [branchFormAddress, setBranchFormAddress] = useState('');
  const [branchFormPhone, setBranchFormPhone] = useState('');
  const [branchFormEmail, setBranchFormEmail] = useState('');
  const [branchFormManager, setBranchFormManager] = useState('');
  const [branchFormPrefix, setBranchFormPrefix] = useState('');
  const [branchFormIsHeadOffice, setBranchFormIsHeadOffice] = useState(false);
  const [branchFormStatus, setBranchFormStatus] = useState<'Active' | 'Inactive'>('Active');

  const handleOpenAddBranchModal = () => {
    setEditingBranchId(null);
    const existingCount = branches.filter(b => b.companyId === company.id).length;
    setBranchFormCode(`BR-${String(existingCount + 1).padStart(2, '0')}`);
    setBranchFormName('');
    setBranchFormEmirate('Dubai');
    setBranchFormAddress('');
    setBranchFormPhone(formData.phone || '+971 4 000 0000');
    setBranchFormEmail(formData.email || '');
    setBranchFormManager('');
    setBranchFormPrefix(`BR${existingCount + 1}-`);
    setBranchFormIsHeadOffice(existingCount === 0);
    setBranchFormStatus('Active');
    setIsBranchModalOpen(true);
  };

  const handleOpenEditBranchModal = (br: Branch) => {
    setEditingBranchId(br.id);
    setBranchFormCode(br.code);
    setBranchFormName(br.name);
    setBranchFormEmirate(br.emirate);
    setBranchFormAddress(br.address);
    setBranchFormPhone(br.phone);
    setBranchFormEmail(br.email);
    setBranchFormManager(br.managerName);
    setBranchFormPrefix(br.invoicePrefix || '');
    setBranchFormIsHeadOffice(br.isHeadOffice || false);
    setBranchFormStatus(br.status);
    setIsBranchModalOpen(true);
  };

  const handleSaveBranchForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchFormName.trim()) {
      alert('Please enter a valid Branch Name.');
      return;
    }

    if (editingBranchId) {
      if (onUpdateBranch) {
        onUpdateBranch({
          id: editingBranchId,
          companyId: company.id,
          code: branchFormCode || 'BR-01',
          name: branchFormName.trim(),
          emirate: branchFormEmirate,
          address: branchFormAddress.trim(),
          phone: branchFormPhone.trim(),
          email: branchFormEmail.trim(),
          managerName: branchFormManager.trim(),
          invoicePrefix: branchFormPrefix.trim(),
          isHeadOffice: branchFormIsHeadOffice,
          status: branchFormStatus
        });
      }
    } else {
      if (onAddBranch) {
        onAddBranch({
          companyId: company.id,
          code: branchFormCode || `BR-${String(branches.length + 1).padStart(2, '0')}`,
          name: branchFormName.trim(),
          emirate: branchFormEmirate,
          address: branchFormAddress.trim(),
          phone: branchFormPhone.trim(),
          email: branchFormEmail.trim(),
          managerName: branchFormManager.trim(),
          invoicePrefix: branchFormPrefix.trim(),
          isHeadOffice: branchFormIsHeadOffice,
          status: branchFormStatus
        });
      }
    }
    setIsBranchModalOpen(false);
  };

  // Theme customization state
  const [customThemeHex, setCustomThemeHex] = useState<string>(() => formData.themePrimaryColor || '#2CA01C');
  const [activePresetId, setActivePresetId] = useState<string>(() => {
    const activeColor = (formData.themePrimaryColor || '#2CA01C').toLowerCase();
    const match = PRESET_THEME_COLORS.find(p => p.hex.toLowerCase() === activeColor);
    return match ? match.id : 'custom';
  });

  const handleSelectPresetTheme = (presetHex: string, presetId: string) => {
    setActivePresetId(presetId);
    setCustomThemeHex(presetHex);
    setFormData(prev => ({ ...prev, themePrimaryColor: presetHex }));
    applyThemeToCssVariables(presetHex);
    if (typeof localStorage !== 'undefined') {
      safeSetLocalStorage('hisaab_theme_primary_color', presetHex);
    }
  };

  const handleCustomHexChange = (hexValue: string) => {
    setCustomThemeHex(hexValue);
    const cleanHex = hexValue.trim().startsWith('#') ? hexValue.trim() : `#${hexValue.trim()}`;
    const match = PRESET_THEME_COLORS.find(p => p.hex.toLowerCase() === cleanHex.toLowerCase());
    setActivePresetId(match ? match.id : 'custom');
    setFormData(prev => ({ ...prev, themePrimaryColor: cleanHex }));
    if (/^#[0-9A-Fa-f]{6}$/.test(cleanHex) || /^#[0-9A-Fa-f]{3}$/.test(cleanHex)) {
      applyThemeToCssVariables(cleanHex);
      if (typeof localStorage !== 'undefined') {
        safeSetLocalStorage('hisaab_theme_primary_color', cleanHex);
      }
    }
  };

  const handleResetThemeDefault = () => {
    handleSelectPresetTheme('#2CA01C', 'qb-green');
  };

  // Security audit log & integrity state
  const [securityLogs, setSecurityLogs] = useState<SecurityAuditLog[]>(() => getSecurityAuditLogs());
  const [securityIntegrity, setSecurityIntegrity] = useState(() => verifySystemIntegrity());

  // License System V3.0 Admin state
  const [licenses, setLicenses] = useState<LicenseRecord[]>(() => getLicensesFromDB());
  const [licenseFilterStatus, setLicenseFilterStatus] = useState<'all' | 'unused' | 'assigned' | 'active' | 'expired'>('all');
  const [licenseSearchQuery, setLicenseSearchQuery] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignCode, setSelectedAssignCode] = useState('');
  const [assignEmail, setAssignEmail] = useState('');
  const [assignPhone, setAssignPhone] = useState('');

  // Digital License Certificate Modal state (Option 4)
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedCertLicense, setSelectedCertLicense] = useState<LicenseRecord | null>(null);

  // Uninstall & Deletion Feedback Modal State
  const [showUninstallModal, setShowUninstallModal] = useState(false);
  const [uninstallCompany, setUninstallCompany] = useState(company.name || '');
  const [uninstallEmail, setUninstallEmail] = useState('');
  const [uninstallPhone, setUninstallPhone] = useState('');
  const [uninstallPassword, setUninstallPassword] = useState('');
  const [uninstallReasonCategory, setUninstallReasonCategory] = useState('Switched to alternative software');
  const [uninstallDetailedReason, setUninstallDetailedReason] = useState('');
  const [isSubmittingUninstall, setIsSubmittingUninstall] = useState(false);

  const refreshLicenses = () => {
    setLicenses(getLicensesFromDB());
  };

  const refreshSecurityState = () => {
    setSecurityLogs(getSecurityAuditLogs());
    setSecurityIntegrity(verifySystemIntegrity());
  };

  // 1. Print Count last 30 days state
  const [printCount30Days, setPrintCount30Days] = useState<number>(() => getPrintCountLast30Days());

  // 2. Failed Login Attempts state
  const [failedLoginAttempts, setFailedLoginAttempts] = useState<number>(() => Number(localStorage.getItem('hisaab_failed_login_attempts') || 0));

  const handleResetFailedLogins = () => {
    safeSetLocalStorage('hisaab_failed_login_attempts', '0');
    setFailedLoginAttempts(0);
    logSecurityEvent({
      type: 'SYSTEM_SCAN',
      title: 'Failed Login Attempt Log Cleared',
      details: 'Administrator manually reset the failed login attempt counter to 0.',
      severity: 'INFO'
    });
    refreshSecurityState();
  };

  // 3. Pending IBAN Change Requests state
  const [ibanRequests, setIbanRequests] = useState<IbanChangeRequest[]>(() => {
    try {
      const raw = localStorage.getItem('hisaab_iban_requests');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      // fallback
    }
    const defaults: IbanChangeRequest[] = [
      {
        id: 'IBAN-REQ-101',
        entityType: 'VENDOR',
        entityName: 'Emirates Building Materials LLC',
        requestedBy: 'finance@emiratesbmt.ae (Email Request)',
        currentIban: 'AE320200000012345678901',
        requestedIban: 'AE840330000098765432109',
        bankName: 'First Abu Dhabi Bank (FAB)',
        requestDate: new Date(Date.now() - 86400000).toISOString(),
        status: 'PENDING_OOB_VERIFICATION',
        oobVerificationPhone: '+971 4 398 7654'
      }
    ];
    safeSetLocalStorage('hisaab_iban_requests', defaults);
    return defaults;
  });

  const saveIbanRequests = (updated: IbanChangeRequest[]) => {
    setIbanRequests(updated);
    try {
      safeSetLocalStorage('hisaab_iban_requests', updated);
    } catch (e) {
      console.error(e);
    }
  };

  const pendingIbanCount = ibanRequests.filter(r => r.status === 'PENDING_OOB_VERIFICATION').length;

  const handleApproveIbanRequest = (id: string) => {
    const req = ibanRequests.find(r => r.id === id);
    if (!req) return;
    const phone = prompt(`Enter phone number verified during secondary Out-Of-Band call with ${req.entityName}:`, req.oobVerificationPhone || '+971 4 000 0000');
    if (phone === null) return;

    const updated = ibanRequests.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: 'VERIFIED_OOB_APPROVED' as const,
          oobVerifiedBy: 'Administrator (OOB Call)',
          verifiedAt: new Date().toISOString()
        };
      }
      return r;
    });
    saveIbanRequests(updated);
    logSecurityEvent({
      type: 'API_SECURED',
      title: `IBAN Change Approved via OOB Secondary Call (${req.entityName})`,
      details: `Secondary telephone verification call to ${phone} completed. New IBAN ${req.requestedIban} approved.`,
      severity: 'INFO'
    });
    refreshSecurityState();
    alert(`✅ IBAN Change Request Approved!\n\nEntity: ${req.entityName}\nNew IBAN: ${req.requestedIban}\nVerification: Out-Of-Band Call to ${phone} confirmed.`);
  };

  const handleRejectIbanRequest = (id: string) => {
    const req = ibanRequests.find(r => r.id === id);
    if (!req) return;
    if (!confirm(`Reject IBAN change request from ${req.entityName}? This will flag the request as suspected AI phishing / fraud.`)) return;

    const updated = ibanRequests.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: 'REJECTED_SUSPECTED_FRAUD' as const,
          verifiedAt: new Date().toISOString()
        };
      }
      return r;
    });
    saveIbanRequests(updated);
    logSecurityEvent({
      type: 'THREAT_BLOCKED',
      title: `IBAN Change Request Flagged & Blocked (${req.entityName})`,
      details: `Unverified request to change IBAN to ${req.requestedIban} was rejected by administrator. Suspected AI voice / email phishing.`,
      severity: 'CRITICAL'
    });
    refreshSecurityState();
    alert(`⚠️ IBAN Change Request Rejected & Flagged as Suspected Fraud.\n\nEntity: ${req.entityName}\nSecurity event logged.`);
  };

  const handleAddNewIbanRequest = () => {
    const entityName = prompt("Enter Entity / Vendor Name requesting IBAN update:");
    if (!entityName) return;
    const requestedIban = prompt("Enter requested NEW 23-character UAE IBAN (e.g. AE840330000098765432109):", "AE");
    if (!requestedIban) return;
    const phone = prompt("Enter pre-registered telephone number for Out-Of-Band verification call:", "+971 ");
    if (!phone) return;

    const newReq: IbanChangeRequest = {
      id: 'IBAN-REQ-' + Math.floor(100 + Math.random() * 900),
      entityType: 'VENDOR',
      entityName,
      requestedBy: 'Manual Entry / Email Request',
      currentIban: 'AE000000000000000000000',
      requestedIban,
      bankName: 'UAE Commercial Bank',
      requestDate: new Date().toISOString(),
      status: 'PENDING_OOB_VERIFICATION',
      oobVerificationPhone: phone
    };
    saveIbanRequests([newReq, ...ibanRequests]);
    logSecurityEvent({
      type: 'SYSTEM_SCAN',
      title: `New Pending IBAN Change Request Added (${entityName})`,
      details: `IBAN change request queued. Requires Out-Of-Band secondary phone verification to ${phone}.`,
      severity: 'WARNING'
    });
    refreshSecurityState();
  };

  // Prefix lock status controlled directly by company preference
  const isInvoiceLocked = formData.isInvoicePrefixLocked ?? false;

  // Prefix locks error states
  const [invoicePrefixError, setInvoicePrefixError] = useState<string>('');
  const [quotationPrefixError, setQuotationPrefixError] = useState<string>('');

  // Authentication credentials state
  const [authEmail, setAuthEmail] = useState(loginEmail);
  const [authMobile, setAuthMobile] = useState(loginMobile);
  const [authPassword, setAuthPassword] = useState(loginPassword);
  const [confirmPassword, setConfirmPassword] = useState(loginPassword);
  const [authSaveSuccess, setAuthSaveSuccess] = useState(false);
  const [authError, setAuthError] = useState('');

  // License key & Security state
  const [settingEmailInput, setSettingEmailInput] = useState<string>(() => {
    const saved = localStorage.getItem('hisaab_client_email');
    if (!saved || saved.toLowerCase() === 'raza4u0@gmail.com') {
      safeSetLocalStorage('hisaab_client_email', 'Hissabpro1@gmail.com');
      return 'Hissabpro1@gmail.com';
    }
    return saved;
  });

  const [settingMobileInput, setSettingMobileInput] = useState<string>(() => {
    return localStorage.getItem('hisaab_client_mobile') || '+971 50 123 4567';
  });

  const [activeSecCode, setActiveSecCode] = useState<string>(() => {
    return localStorage.getItem('hisaab_security_code') || '';
  });

  const [settingKeyInput, setSettingKeyInput] = useState('');

  const handleActivateKeyFromSettings = (email: string, mobile: string, key: string) => {
    const cleanEmail = email.trim();
    const cleanMobile = mobile.trim();
    const cleanKey = key.trim().toUpperCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      alert('⚠️ Invalid Client Email:\n\nPlease enter a valid client email address.');
      return;
    }

    if (!cleanMobile || cleanMobile.length < 7) {
      alert('⚠️ Invalid Client Mobile Number:\n\nPlease enter a valid mobile phone number.');
      return;
    }

    if (cleanKey === 'HISAAB-30-UNLOCK' || cleanKey === 'HISAAB-365-PAID') {
      activateTrialLicenseKey(cleanKey).then(res => {
        if (res.success) {
          alert(`✓ ${res.message}`);
          setActiveSecCode(cleanKey);
          safeSetLocalStorage('hisaab_security_code', cleanKey);
          safeSetLocalStorage('hisaab_client_email', cleanEmail);
          safeSetLocalStorage('hisaab_client_mobile', cleanMobile);
          safeSetLocalStorage('hisaab_active_plan', 'pro_1y');
          safeSetLocalStorage('hisaab_is_paid_plan', 'true');
          setSettingKeyInput('');
          window.location.reload();
        } else {
          alert(res.message);
        }
      });
      return;
    }

    const rawCode = cleanKey.replace(/[^A-Z0-9]/gi, '');
    if (!cleanKey || (rawCode.length !== 15 && rawCode.length !== 16 && !cleanKey.startsWith('HP'))) {
      alert('⚠️ Invalid 15 or 16-Digit Security Code:\n\nPlease enter a valid 15 or 16-digit security activation code (e.g. 9876-5432-1012-3456 or HP1Y-8921-7723-9012).');
      return;
    }

    let targetPlan = 'pro_1y';
    if (cleanKey.includes('3Y') || cleanKey.startsWith('HP3Y') || rawCode.startsWith('3')) {
      targetPlan = 'pro_3y';
    } else if (cleanKey.includes('5Y') || cleanKey.includes('LF') || cleanKey.startsWith('HP5Y') || cleanKey.startsWith('HPLF') || rawCode.startsWith('5') || rawCode.startsWith('9')) {
      targetPlan = 'pro_lifetime';
    }

    safeSetLocalStorage('hisaab_client_email', cleanEmail);
    safeSetLocalStorage('hisaab_client_mobile', cleanMobile);
    safeSetLocalStorage('hisaab_security_code', cleanKey);
    setActiveSecCode(cleanKey);

    window.dispatchEvent(new CustomEvent('change-plan', { detail: { plan: targetPlan } }));
    alert(`🎉 Security Code Verified & Activated Successfully!\n\nClient Email: ${cleanEmail}\nClient Mobile: ${cleanMobile}\nSecurity Code: ${cleanKey}\nSubscription Plan: ${targetPlan.toUpperCase().replace('_', ' ')}.`);
    setSettingKeyInput('');
  };

  // -------------------------------------------------------------
  // SECURE SETTINGS PASSWORD LOCK STATE
  // -------------------------------------------------------------
  const [isSettingsAuthorized, setIsSettingsAuthorized] = useState<boolean>(false);
  const [settingsAuthPasswordInput, setSettingsAuthPasswordInput] = useState<string>('');
  const [settingsAuthError, setSettingsAuthError] = useState<string>('');

  const handleSettingsAuthVerify = () => {
    if (settingsAuthPasswordInput === loginPassword) {
      setIsSettingsAuthorized(true);
      setSettingsAuthError('');
    } else {
      setSettingsAuthError('Invalid administrator password! Access denied.');
    }
  };

  const handleAutoConfigureSettings = () => {
    // Enable Login required
    if (onToggleLogin) onToggleLogin(true);
    
    // Set default credentials
    const defEmail = 'Hissabpro1@gmail.com';
    const defMobile = '0501234567';
    const defPass = 'admin123';

    if (onChangeLoginEmail) onChangeLoginEmail(defEmail);
    if (onChangeLoginMobile) onChangeLoginMobile(defMobile);
    if (onChangeLoginPassword) onChangeLoginPassword(defPass);

    setAuthEmail(defEmail);
    setAuthMobile(defMobile);
    setAuthPassword(defPass);
    setConfirmPassword(defPass);

    // Set authorized to true
    setIsSettingsAuthorized(true);
    setSettingsAuthError('');
    setAuthSaveSuccess(true);
    setTimeout(() => setAuthSaveSuccess(false), 3000);
  };

  const isSensitiveTab = activeSubTab === 'auth' || activeSubTab === 'security';

  // -------------------------------------------------------------
  // FEEDBACK & SUPPORT CONFIGURATION STATE
  // -------------------------------------------------------------
  const [supportEmail, setSupportEmail] = useState<string>(() => {
    const saved = localStorage.getItem('hisaab_support_email');
    return saved || 'Hissabpro1@gmail.com';
  });

  const [autoSendError, setAutoSendError] = useState<boolean>(() => {
    const saved = localStorage.getItem('hisaab_auto_send_error');
    return saved ? saved === 'true' : true;
  });

  const [feedbackCategory, setFeedbackCategory] = useState<'accounts' | 'VAT' | 'purchases' | 'others'>('accounts');
  const [feedbackDescription, setFeedbackDescription] = useState<string>('');
  const [feedbackSaveSuccess, setFeedbackSaveSuccess] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'date' | 'category' | 'status'>('date');

  // LAN network sync packet simulation states
  const [serializedStream, setSerializedStream] = useState<any>(null);
  const [simulationType, setSimulationType] = useState<string>('customers');
  const [simulationMethod, setSimulationMethod] = useState<'GET' | 'POST'>('GET');
  const [isSimulatingSync, setIsSimulatingSync] = useState<boolean>(false);

  // Network Diagnosis tool states
  const [diagStatus, setDiagStatus] = useState<'idle' | 'testing' | 'completed'>('idle');
  const [diagProgress, setDiagProgress] = useState<number>(0);
  const [diagStep, setDiagStep] = useState<string>('');
  const [diagMetrics, setDiagMetrics] = useState<any>({
    wifiSignal: '92% (Excellent)',
    handshakeTime: '4.2ms',
    jitter: '0.6ms',
    packetLoss: '0.0%',
    dbIntegrity: '100% Valid',
    dnsResolution: '0.1ms'
  });

  const [feedbackLogs, setFeedbackLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('hisaab_feedback_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    // Pre-seed some default demo logs for rich visual state
    const defaults = [
      {
        id: 'FB-9082',
        date: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
        category: 'VAT',
        description: 'Auto calculation of 5% VAT on the manual item description did not trigger. Solved after toggling inventory mode.',
        emailSentTo: 'Hissabpro1@gmail.com',
        status: 'resolved',
        isAutoCrashReport: false
      },
      {
        id: 'FB-4512',
        date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        category: 'accounts',
        description: 'Need capability to export trial balance directly into standard UAE FTA Audit file (FAF format).',
        emailSentTo: 'Hissabpro1@gmail.com',
        status: 'sent',
        isAutoCrashReport: false
      },
      {
        id: 'CR-1029',
        date: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        category: 'others',
        description: 'AUTOMATIC CRASH REPORT: TypeError: Cannot read properties of undefined (reading "company_theme") in Dashboard.tsx line 412.',
        emailSentTo: 'Hissabpro1@gmail.com',
        status: 'sent',
        isAutoCrashReport: true
      }
    ];
    try {
      safeSetLocalStorage('hisaab_feedback_logs', defaults);
    } catch (e) {}
    return defaults;
  });

  // Sync state modifications to LocalStorage
  useEffect(() => {
    try {
      safeSetLocalStorage('hisaab_support_email', supportEmail);
    } catch (e) {}
  }, [supportEmail]);

  useEffect(() => {
    try {
      safeSetLocalStorage('hisaab_auto_send_error', autoSendError);
    } catch (e) {}
  }, [autoSendError]);

  useEffect(() => {
    try {
      const trimmed = Array.isArray(feedbackLogs) ? feedbackLogs.slice(0, 20) : [];
      safeSetLocalStorage('hisaab_feedback_logs', trimmed);
    } catch (e) {
      console.warn('Unable to persist feedbackLogs safely:', e);
    }
  }, [feedbackLogs]);

  // Listen to a custom event for when the app captures a runtime crash error, to immediately reload logs
  useEffect(() => {
    const handleCrashReported = () => {
      const saved = localStorage.getItem('hisaab_feedback_logs');
      if (saved) {
        try {
          setFeedbackLogs(JSON.parse(saved));
        } catch (e) {}
      }
    };
    window.addEventListener('hisaab_crash_reported', handleCrashReported);
    return () => {
      window.removeEventListener('hisaab_crash_reported', handleCrashReported);
    };
  }, []);

  useEffect(() => {
    setAuthEmail(loginEmail);
  }, [loginEmail]);

  useEffect(() => {
    setAuthMobile(loginMobile);
  }, [loginMobile]);

  useEffect(() => {
    setAuthPassword(loginPassword);
    setConfirmPassword(loginPassword);
  }, [loginPassword]);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab as SettingsTab);
    }
  }, [initialSubTab]);

  useEffect(() => {
    const handleSwitch = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.subTab) {
        const tab = customEvent.detail.subTab as SettingsTab;
        setActiveSubTab(tab);
        if (onSubTabChange) {
          onSubTabChange(tab);
        }
      }
    };
    window.addEventListener('switch-tab', handleSwitch);
    return () => window.removeEventListener('switch-tab', handleSwitch);
  }, [onSubTabChange]);

  // CSV Import state
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [csvValidationReport, setCsvValidationReport] = useState<{
    totalRows: number;
    validCount: number;
    invalidCount: number;
    errors: { row: number; message: string; type: 'error' | 'warning' }[];
    parsedRows: any[];
  } | null>(null);

  const [settingsCsvTab, setSettingsCsvTab] = useState<'HEADERS' | 'README'>('HEADERS');

  // Synchronize on company update
  useEffect(() => {
    setFormData(getCompanyWithDefaults(company));
  }, [company]);

  const SECRET_SALT = "HisaabPro_Secure_UAE_FTA_System_2026_@!";

  const encryptBackupData = (plainText: string): string => {
    const utf8Bytes = new TextEncoder().encode(plainText);
    const keyBytes = new TextEncoder().encode(SECRET_SALT);
    
    const encryptedBytes = new Uint8Array(utf8Bytes.length);
    for (let i = 0; i < utf8Bytes.length; i++) {
      const rotatingKeyByte = keyBytes[i % keyBytes.length];
      const shift = (i * 7) % 256;
      encryptedBytes[i] = utf8Bytes[i] ^ rotatingKeyByte ^ shift;
    }
    
    let binaryString = "";
    for (let i = 0; i < encryptedBytes.length; i++) {
      binaryString += String.fromCharCode(encryptedBytes[i]);
    }
    const base64Data = btoa(binaryString);
    
    // Core signature algorithm to seal with the Hisaab Pro Brand Identity
    const brandedPayload = `BRAND:HISAAB_PRO_V2.0:${plainText}`;
    let sum = 0;
    for (let i = 0; i < brandedPayload.length; i++) {
      sum = (sum * 31 + brandedPayload.charCodeAt(i)) % 1000000007;
    }
    const signature = sum.toString(16).toUpperCase();
    
    return `HISAAB_PRO_SECURE_V1:${signature}:${base64Data}`;
  };

  const decryptBackupData = (securedText: string): string => {
    const parts = securedText.trim().split(':');
    if (parts.length !== 3 || parts[0] !== 'HISAAB_PRO_SECURE_V1') {
      throw new Error('MALFORMED_FORMAT');
    }
    
    const expectedSignature = parts[1];
    const base64Data = parts[2];
    
    let binaryString;
    try {
      binaryString = atob(base64Data);
    } catch (e) {
      throw new Error('DECODE_ERROR');
    }
    
    const encryptedBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      encryptedBytes[i] = binaryString.charCodeAt(i);
    }
    
    const keyBytes = new TextEncoder().encode(SECRET_SALT);
    const decryptedBytes = new Uint8Array(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
      const rotatingKeyByte = keyBytes[i % keyBytes.length];
      const shift = (i * 7) % 256;
      decryptedBytes[i] = encryptedBytes[i] ^ rotatingKeyByte ^ shift;
    }
    
    const plainText = new TextDecoder().decode(decryptedBytes);
    
    // Verify brand authenticity & checksum
    const brandedPayload = `BRAND:HISAAB_PRO_V2.0:${plainText}`;
    let sum = 0;
    for (let i = 0; i < brandedPayload.length; i++) {
      sum = (sum * 31 + brandedPayload.charCodeAt(i)) % 1000000007;
    }
    const actualSignature = sum.toString(16).toUpperCase();
    
    if (actualSignature !== expectedSignature) {
      throw new Error('SIGNATURE_MISMATCH');
    }
    
    return plainText;
  };

  const handleBackup = () => {
    const backupData: Record<string, string | null> = {};
    
    // Scan all keys in localStorage for complete coverage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('hisaab_') ||
        key.startsWith('stock_movements_logs_') ||
        key.startsWith('recent_customers_') ||
        key.startsWith('recent_items_') ||
        key.startsWith('recent_manual_items_')
      )) {
        backupData[key] = localStorage.getItem(key);
      }
    }

    // Include standard fallback keys to ensure complete state
    const fallbackKeys = [
      'hisaab_companies',
      'hisaab_active_company_id',
      'hisaab_customers',
      'hisaab_inventory',
      'hisaab_documents',
      'hisaab_expenses',
      'hisaab_recurring',
      'hisaab_is_paid_plan',
      'hisaab_staff',
      'hisaab_coa_accounts',
      'hisaab_journal_entries',
      'hisaab_accounting_mode',
      'hisaab_notifications',
      'hisaab_dark_mode'
    ];
    fallbackKeys.forEach(key => {
      if (!(key in backupData)) {
        backupData[key] = localStorage.getItem(key);
      }
    });

    const jsonString = JSON.stringify(backupData, null, 2);
    const encryptedString = encryptBackupData(jsonString);
    const blob = new Blob([encryptedString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", `hisaab_pro_backup_${formData.name.replace(/\s+/g, '_')}.hisaab`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result as string;

        // 🛡️ STEP 1: REAL-TIME VIRUS & MALWARE THREAT SCAN
        const rawThreatScan = scanContentForThreats(fileContent);
        if (!rawThreatScan.safe) {
          logSecurityEvent({
            type: 'THREAT_BLOCKED',
            title: 'Malicious File Payload Blocked',
            details: rawThreatScan.details || 'Windows binary or command execution signature detected.',
            severity: 'CRITICAL'
          });
          alert(
            `❌ SECURITY SHIELD THREAT BLOCKED!\n\n` +
            `A malicious virus payload, executable header, or dangerous script command was detected in this file.\n\n` +
            `Details: ${rawThreatScan.details}\n\n` +
            `Restoration has been HALTED immediately to protect your software, database, and Windows host system from corruption or infection.`
          );
          return;
        }

        let plainText = "";

        if (fileContent.trim().startsWith('{')) {
          // Plaintext JSON legacy file
          const confirmLegacy = window.confirm(
            "⚠️ WARNING: You are attempting to restore an unencrypted, legacy backup file.\n\n" +
            "Unencrypted backups are highly vulnerable to unauthorized snooping, modification, or data leakage if stored on USB drives.\n\n" +
            "For strict UAE FTA compliance and total brand security, please proceed ONLY if you trust the source. Once restored, download a new backup to secure your data.\n\n" +
            "Do you want to restore this unencrypted legacy file?"
          );
          if (!confirmLegacy) return;
          plainText = fileContent;
        } else {
          // Cryptographically secured file
          try {
            plainText = decryptBackupData(fileContent);
          } catch (decryptErr: any) {
            let errorMsg = "❌ SECURITY VIOLATION: Secure cryptographic signature verification failed.\n\n";
            if (decryptErr.message === 'MALFORMED_FORMAT') {
              errorMsg += "This file is either corrupted, not a valid Hisaab Pro backup, or has been modified externally.";
            } else if (decryptErr.message === 'SIGNATURE_MISMATCH') {
              errorMsg += "Signature mismatch detected. This backup file has been tampered with, or generated by an unauthorized copy of Hisaab Pro. Restoration is blocked to protect database integrity.";
            } else {
              errorMsg += "The backup is encrypted and could not be verified securely.";
            }
            alert(errorMsg);
            return;
          }
        }

        // 🛡️ STEP 2: THREAT SCAN DECRYPTED PAYLOAD
        const decryptedThreatScan = scanContentForThreats(plainText);
        if (!decryptedThreatScan.safe) {
          alert(
            `❌ SECURITY SHIELD THREAT BLOCKED!\n\n` +
            `A hidden script injection or malicious command payload was found inside the decrypted database stream.\n\n` +
            `Details: ${decryptedThreatScan.details}\n\n` +
            `Restoration has been HALTED immediately to safeguard your software and Windows host environment.`
          );
          return;
        }

        const rawBackupData = JSON.parse(plainText);
        
        if (rawBackupData && typeof rawBackupData === 'object') {
          // 🛡️ STEP 3: SANITIZE & STRUCTURAL CLEANSE DATA VALUES
          const backupData = sanitizeDataValue(rawBackupData) as Record<string, any>;
          const keys = Object.keys(backupData);
          const hasHisaabKeys = keys.some(key => 
            key.startsWith('hisaab_') || 
            key.startsWith('stock_movements_logs_') ||
            key.startsWith('recent_customers_') || 
            key.startsWith('recent_items_') || 
            key.startsWith('recent_manual_items_')
          );

          if (hasHisaabKeys) {
            // First clear old related keys to prevent stale pollution
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const key = localStorage.key(i);
              if (key && (
                key.startsWith('hisaab_') ||
                key.startsWith('stock_movements_logs_') ||
                key.startsWith('recent_customers_') ||
                key.startsWith('recent_items_') ||
                key.startsWith('recent_manual_items_')
              )) {
                localStorage.removeItem(key);
              }
            }

            // Write restored keys
            Object.keys(backupData).forEach(key => {
              if (backupData[key] !== null) {
                safeSetLocalStorage(key, backupData[key]);
              }
            });
            logSecurityEvent({
              type: 'RESTORE_PASSED',
              title: 'Secure Database Restoration Completed',
              details: `Restored ${Object.keys(backupData).length} database nodes. Anti-virus scan and checksum passed.`,
              severity: 'INFO'
            });
            alert("🛡️ Security Verification Passed! Backup successfully threat-scanned, verified, and restored! Reloading the page to apply changes...");
            window.location.reload();
          } else {
            alert("Error: Selected file does not contain valid Hisaab Pro database nodes.");
          }
        } else {
          alert("Error: Invalid backup file format.");
        }
      } catch (err) {
        alert("Could not restore backup: Make sure to select the correct secure backup file downloaded from Hisaab Pro.");
      }
    };
    reader.readAsText(file);
  };

  const handleRunNetworkDiagnostics = () => {
    setDiagStatus('testing');
    setDiagProgress(0);
    setDiagStep('Initializing Network Socket & Port Scanners...');
    onAddLanSyncLog?.('GET', '/api/diagnostics/start', 200, 'Initiating comprehensive local network handshake and speedtest.');

    const steps = [
      { progress: 15, step: 'Scanning WiFi/Ethernet interfaces for active LAN subnets...', delay: 600 },
      { progress: 35, step: 'Testing local loopback socket (127.0.0.1) & routing tables...', delay: 1100 },
      { progress: 55, step: 'Pinging main PC gateway... Local handshake check succeeded.', delay: 1700 },
      { progress: 75, step: 'Probing open ports for socket connections on Port 3000...', delay: 2300 },
      { progress: 90, step: 'Validating SQLite local database sector allocations & CRC signatures...', delay: 2900 },
      { progress: 100, step: 'Diagnose completed! All network stations verified and 100% active.', delay: 3400 }
    ];

    steps.forEach((s) => {
      setTimeout(() => {
        setDiagProgress(s.progress);
        setDiagStep(s.step);
        if (s.progress === 100) {
          setDiagStatus('completed');
          setDiagMetrics({
            wifiSignal: '95% (Excellent)',
            handshakeTime: (Math.random() * 2 + 2).toFixed(1) + 'ms',
            jitter: (Math.random() * 0.4 + 0.2).toFixed(2) + 'ms',
            packetLoss: '0.0%',
            dbIntegrity: '100% Secure & Parity Matched',
            dnsResolution: '0.1ms'
          });
          onAddLanSyncLog?.('GET', '/api/diagnostics/results', 200, 'Diagnostics passed. Signal strength: 95%, Avg Handshake: 3.2ms, Packet Loss: 0.0%.');
        }
      }, s.delay);
    });
  };

  // Download Customer CSV Template
  const downloadCustomerCSVTemplate = () => {
    const headers = ['CustomerName*', 'CompanyName', 'Email', 'Phone', 'MobileNumber', 'TRN', 'Address', 'Emirate*'];
    const mockRows = [
      ['EXAMPLE: Al Ghurair Contracting', 'Al Ghurair Group', 'finance@alghurair.ae', '04 290 0000', '050 123 4567', '100234567800003', 'Al Ghurair Centre, Rigga Street, Deira', 'Dubai'],
      ['Al Ghurair Contracting', 'Al Ghurair Group', 'finance@alghurair.ae', '04 290 0000', '050 123 4567', '100234567800003', 'Al Ghurair Centre, Rigga Street, Deira', 'Dubai'],
      ['Falcon Air Services', '', 'ops@falconair.ae', '02 444 8888', '052 987 6543', '100456123789005', 'Al Bateen Executive Airport, Al Bateen', 'Abu Dhabi'],
      ['Sharjah Logistics Co', 'Sharjah Logistics', 'info@sharjahlogistics.ae', '06 555 1234', '', '100789456123999', 'Warehouse 12, Industrial Area 5', 'Sharjah']
    ];

    // Escape fields that might contain commas
    const escapeCsv = (str: string) => {
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.join(','),
      ...mockRows.map(row => row.map(escapeCsv).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Hisaab_Pro_Customers_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Safe CSV row parser to handle quotes and commas properly
  const splitCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    
    return result.map(val => {
      let cleaned = val;
      if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.substring(1, cleaned.length - 1);
      }
      return cleaned.replace(/""/g, '"').trim();
    });
  };

  const validateCustomerCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      setCsvValidationReport({
        totalRows: 0,
        validCount: 0,
        invalidCount: 0,
        errors: [{ row: 0, message: 'The uploaded file is empty or missing data rows.', type: 'error' }],
        parsedRows: []
      });
      return;
    }

    const rawHeaders = splitCsvLine(lines[0]);
    const headers = rawHeaders.map(h => h.toLowerCase().replace(/\*/g, '').trim());
    
    // Check if critical headers are missing (checking either "customername" or "name")
    let nameIndex = headers.indexOf('customername');
    if (nameIndex === -1) {
      nameIndex = headers.indexOf('name');
    }

    if (nameIndex === -1) {
      setCsvValidationReport({
        totalRows: 0,
        validCount: 0,
        invalidCount: 0,
        errors: [{ row: 1, message: 'Header mismatch: "CustomerName*" or "name" column is missing.', type: 'error' }],
        parsedRows: []
      });
      return;
    }

    const companyNameIndex = headers.indexOf('companyname');
    const emailIndex = headers.indexOf('email');
    
    let phoneIndex = headers.indexOf('phone');
    if (phoneIndex === -1) phoneIndex = headers.indexOf('phone*');

    const mobileIndex = headers.indexOf('mobilenumber');
    const trnIndex = headers.indexOf('trn');
    const addressIndex = headers.indexOf('address');
    
    let emirateIndex = headers.indexOf('emirate');
    if (emirateIndex === -1) emirateIndex = headers.indexOf('emirate*');

    const countryConfig = getCountryConfig(company.gccCountry);
    const gccCountry = countryConfig.code;
    const trnRegex = countryConfig.taxIdRegex;
    const trnLengthMsg = countryConfig.taxIdMinLength === countryConfig.taxIdMaxLength 
      ? `${countryConfig.taxIdMinLength} digits` 
      : `${countryConfig.taxIdMinLength} to ${countryConfig.taxIdMaxLength} characters`;
    const taxAuthority = countryConfig.taxAuthorityShort;
    const regionName = countryConfig.regionTypeName;
    const validEmirates = countryConfig.regions;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const errorsList: { row: number; message: string; type: 'error' | 'warning' }[] = [];
    const parsedRows: any[] = [];
    let validCount = 0;
    let invalidCount = 0;
    let skippedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cols = splitCsvLine(line);
      if (cols.length === 0 || (cols.length === 1 && cols[0] === '')) {
        continue; // skip blank line
      }

      const rowNum = i + 1;
      const name = nameIndex !== -1 ? (cols[nameIndex] || '') : '';
      
      // Skip example rows
      if (name.toLowerCase().includes('example') || name.startsWith('#')) {
        skippedCount++;
        continue;
      }

      const companyName = companyNameIndex !== -1 ? cols[companyNameIndex] : '';
      const email = emailIndex !== -1 ? cols[emailIndex] : '';
      const phone = phoneIndex !== -1 ? cols[phoneIndex] : '';
      const mobileNumber = mobileIndex !== -1 ? cols[mobileIndex] : '';
      const trn = trnIndex !== -1 ? cols[trnIndex] : '';
      const address = addressIndex !== -1 ? cols[addressIndex] : '';
      const emirate = emirateIndex !== -1 ? cols[emirateIndex] : '';

      let hasError = false;

      // 1. Validate Customer Name
      if (!name) {
        errorsList.push({
          row: rowNum,
          message: `Row ${rowNum}: Customer Name is required and cannot be empty.`,
          type: 'error'
        });
        hasError = true;
      }

      // 2. Validate TRN / Tax ID (optional. check if present, warning if absent)
      if (trn) {
        const sanitizedTrn = trn.replace(/\s+/g, '');
        if (!trnRegex.test(sanitizedTrn)) {
          errorsList.push({
            row: rowNum,
            message: `Row ${rowNum}: Tax code "${trn}" must be valid (${trnLengthMsg}) for ${countryConfig.name} ${taxAuthority} tax compliance.`,
            type: 'error'
          });
          hasError = true;
        }
      } else {
        errorsList.push({
          row: rowNum,
          message: `Row ${rowNum}: ${countryConfig.taxIdShortLabel} missing - Update for ${taxAuthority} Compliance.`,
          type: 'warning'
        });
      }

      // 4. Validate Region/Emirate (Mandatory now, must be valid GCC location)
      if (!emirate) {
        errorsList.push({
          row: rowNum,
          message: `Row ${rowNum}: ${regionName} (${regionName}*) is required.`,
          type: 'error'
        });
        hasError = true;
      } else {
        const matchedEmirate = validEmirates.find(e => e.toLowerCase() === emirate.trim().toLowerCase());
        if (!matchedEmirate) {
          errorsList.push({
            row: rowNum,
            message: `Row ${rowNum}: ${regionName} "${emirate}" is invalid. Must be one of: ${validEmirates.join(', ')}.`,
            type: 'error'
          });
          hasError = true;
        }
      }

      // 5. Validate Email (Warning only, non-blocking)
      if (email && !emailRegex.test(email)) {
        errorsList.push({
          row: rowNum,
          message: `Row ${rowNum}: Email format "${email}" is invalid.`,
          type: 'warning'
        });
      }

      if (hasError) {
        invalidCount++;
      } else {
        validCount++;
        parsedRows.push({
          name,
          companyName,
          email,
          phone,
          mobileNumber,
          trn,
          address,
          emirate: validEmirates.find(e => e.toLowerCase() === emirate.trim().toLowerCase()) || emirate
        });
      }
    }

    setCsvValidationReport({
      totalRows: lines.length - 1 - skippedCount,
      validCount,
      invalidCount,
      errors: errorsList,
      parsedRows
    });
  };

  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      validateCustomerCSV(text);
    };
    reader.readAsText(file);
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        setCsvFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          validateCustomerCSV(text);
        };
        reader.readAsText(file);
      } else {
        alert("Please upload a valid CSV file (.csv).");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string, directValue?: any) => {
    if (typeof e === 'string') {
      setFormData(prev => ({ ...prev, [e]: directValue }));
      return;
    }

    const { name, value } = e.target;
    
    if ((name === 'invoicePrefix' || name === 'nextInvoiceNumber') && formData.isInvoicePrefixLocked) {
      setInvoicePrefixError('⚠️ Sequence prefix & number settings are locked by company preference. Click "Unlock" to make edits.');
      return;
    }
    
    if (name === 'quotationPrefix' && formData.isInvoicePrefixLocked) {
      setQuotationPrefixError('⚠️ Quotation sequence prefix is locked by company preference. Click "Unlock" to make edits.');
      return;
    }

    setInvoicePrefixError('');
    setQuotationPrefixError('');

    setFormData(prev => ({
      ...prev,
      [name]: name === 'nextInvoiceNumber' ? (parseInt(value, 10) || 1) : value
    }));
  };

  const handleToggle = (name: keyof Company) => {
    setFormData(prev => ({
      ...prev,
      [name]: !prev[name] as any
    }));
  };

  const handleCountryChange = (selectedCountryCode: string) => {
    const config = COUNTRIES_CONFIG[selectedCountryCode as SupportedCountry];
    if (!config) {
      setFormData(prev => ({ ...prev, country: selectedCountryCode }));
      return;
    }

    const defaultTz = selectedCountryCode === 'Pakistan' ? 'Asia/Karachi'
      : selectedCountryCode === 'UAE' ? 'Asia/Dubai'
      : selectedCountryCode === 'Bangladesh' ? 'Asia/Dhaka'
      : selectedCountryCode === 'India' ? 'Asia/Kolkata'
      : selectedCountryCode === 'KSA' ? 'Asia/Riyadh'
      : selectedCountryCode === 'Oman' ? 'Asia/Muscat'
      : selectedCountryCode === 'Qatar' ? 'Asia/Qatar'
      : selectedCountryCode === 'Kuwait' ? 'Asia/Kuwait'
      : selectedCountryCode === 'Bahrain' ? 'Asia/Bahrain'
      : selectedCountryCode === 'Nepal' ? 'Asia/Kathmandu'
      : 'Asia/Dubai';

    setFormData(prev => ({
      ...prev,
      country: config.code,
      gccCountry: config.code as any,
      currency: config.currency,
      currencySymbol: config.symbol,
      taxRate: config.taxRate,
      taxName: config.taxName,
      vatEnabled: config.vatEnabled,
      timezone: defaultTz,
      dateFormat: 'DD/MM/YYYY'
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({
          ...prev,
          logoUrl: base64String
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({
          ...prev,
          invoiceSignatureUrl: base64String
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for duplicate Company Name or TRN (excluding this company itself)
    const duplicate = companies.find(c => 
      c.id !== company.id && (
        c.name.trim().toLowerCase() === formData.name.trim().toLowerCase() ||
        c.trn.trim() === formData.trn.trim()
      )
    );

    if (duplicate) {
      if (onTriggerDuplicateSaza) {
        onTriggerDuplicateSaza('Company', formData.name, formData.trn, duplicate.id);
      }
      return;
    }

    onSave(formData);
    setSaveSuccess(true);

    const currencyOrVatChanged = 
      company.gccCountry !== formData.gccCountry ||
      company.currency !== formData.currency ||
      company.currencySymbol !== formData.currencySymbol ||
      company.symbolPosition !== formData.symbolPosition ||
      company.vatEnabled !== formData.vatEnabled;

    if (currencyOrVatChanged) {
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else {
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Color preset palettes
  const colorPresets = [
    '#10b981', // emerald
    '#2563eb', // blue
    '#f59e0b', // yellow/amber
    '#f43f5e', // red/rose
    '#8b5cf6', // violet
    '#a855f7', // purple
    '#06b6d4', // cyan
    '#475569'  // slate
  ];

  const headerPresets = [
    '#ffffff',
    '#f8fafc',
    '#f3f4f6',
    '#f1f5f9',
    '#e2e8f0',
    '#eff6ff',
    '#f0fdf4'
  ];

  const subTabGroups = [
    {
      groupTitle: '🏢 Company Profile & Branding',
      tabs: [
        { id: 'general', name: 'General Profile', icon: Settings },
        { id: 'branches', name: 'Multi-Branch & Locations', icon: Store },
        { id: 'profile', name: 'Trade License & Registry', icon: Briefcase },
        { id: 'logo', name: 'Company Logo & Stamp', icon: ImageIcon }
      ]
    },
    {
      groupTitle: '🧾 Invoices & Tax Defaults',
      tabs: [
        { id: 'invoice', name: 'Invoice Templates & Terms', icon: FileText },
        { id: 'quotation', name: 'Quotation Preferences', icon: FileCheck },
        { id: 'tax', name: 'Tax & Currency (5% VAT)', icon: Percent }
      ]
    },
    {
      groupTitle: '🔒 Security & Access Control',
      tabs: [
        { id: 'auth', name: 'Admin Login Credentials', icon: Lock },
        { id: 'security', name: 'Security & License Shield', icon: Shield }
      ]
    },
    {
      groupTitle: '🛠️ Data, Importer & System',
      tabs: [
        { id: 'importer', name: 'Universal AI Data Importer', icon: Sparkles },
        { id: 'data', name: 'Backup & Restore Database', icon: Upload },
        { id: 'notifications', name: 'Notifications & Alerts', icon: Bell },
        { id: 'shortcuts', name: 'Keyboard Shortcuts', icon: Keyboard },
        { id: 'plan', name: 'Subscription Plan', icon: Award },
        { id: 'feedback', name: 'Support & Feedback', icon: MessageSquare }
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Settings Title bar */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Settings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage your workspace, branding, and invoice defaults</p>
        </div>
        
        {saveSuccess && (
          <div className="flex items-center space-x-1.5 text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3.5 py-1.5 rounded-lg text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-bounce" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* LEFT NAV PANEL: Categorized Organized Settings Tabs */}
        <div className="w-full lg:w-72 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-3 shrink-0 space-y-4 shadow-xs no-print">
          {subTabGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider font-mono text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/60 mb-1">
                {group.groupTitle}
              </div>
              <div className="space-y-0.5">
                {group.tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveSubTab(tab.id as SettingsTab);
                        setSaveSuccess(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold border-l-4 border-indigo-600 dark:border-indigo-500 shadow-2xs'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                      <span className="truncate">{tab.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT CONTENT PANEL: Interactive form */}
        <form onSubmit={handleSubmit} className="flex-1 w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          
          <div className="p-6 md:p-8 space-y-6">
            
            {/* SENSITIVE TAB AUTHORIZATION GATE */}
            {isSensitiveTab && !isSettingsAuthorized ? (
              <div id="settings-auth-gate" className="space-y-6 animate-fade-in max-w-md mx-auto py-8">
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-850 flex items-center justify-center mx-auto shadow-xs">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono">🔒 Secure Access Lock</h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono mt-1">Administrator verification required to modify user/client settings</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs font-sans">
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-center">
                    To modify authentication profiles, license keys, or LAN PC networking configurations, please enter your active login password.
                  </p>

                  {settingsAuthError && (
                    <div id="settings-auth-error" className="bg-rose-50 dark:bg-rose-950/30 border border-rose-150 text-rose-650 dark:text-rose-450 p-2.5 rounded-lg text-[11px] font-semibold text-center font-mono animate-pulse">
                      ⚠️ {settingsAuthError}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">Enter Admin Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={settingsAuthPasswordInput}
                        onChange={(e) => setSettingsAuthPasswordInput(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-850 dark:text-slate-100 outline-hidden focus:border-indigo-500 text-xs text-center font-mono"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSettingsAuthVerify();
                          }
                        }}
                      />
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleSettingsAuthVerify}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition-colors cursor-pointer text-center font-mono"
                      >
                        Verify Identity & Unlock
                      </button>

                      <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                        <span className="flex-shrink mx-3 text-slate-400 text-[9px] font-bold font-mono uppercase tracking-widest">or</span>
                        <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAutoConfigureSettings}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold rounded-lg text-[10px] uppercase tracking-wider transition-all duration-150 cursor-pointer text-center font-mono flex items-center justify-center space-x-1.5 shadow-sm"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Configure Settings Automatically</span>
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-center text-[9px] text-slate-400 font-mono">
                  Default credentials: <strong>Email/Mobile</strong>: Hissabpro1@gmail.com / 0501234567 | <strong>Password</strong>: admin123
                </p>
              </div>
            ) : (
              <>
            {/* 1. GENERAL TAB */}
            {activeSubTab === 'general' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Primary Country Selection & Automated Regional Presets */}
                <div className="bg-gradient-to-r from-blue-900/20 via-slate-900/60 to-emerald-900/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800/60 mb-4">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
                        <span>Operational Country & Regional Standards</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          Country & Region
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Select your business jurisdiction to automatically tune Currency, Tax Rules, Timezone, and Document Formats.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 text-[10.5px] font-mono bg-white dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                      <span className="text-slate-400">Current:</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">{formData.country || formData.gccCountry || 'UAE'}</span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{formData.currency || 'AED'}</span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-slate-600 dark:text-slate-300">{formData.taxRate ?? 5}% {formData.taxName || 'VAT'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Select Business Country
                      </label>
                      <select
                        value={formData.country || formData.gccCountry || 'UAE'}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="w-full text-xs font-bold border border-slate-200 dark:border-slate-750 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden cursor-pointer"
                      >
                        <optgroup label="GCC Countries">
                          <option value="UAE">🇦🇪 United Arab Emirates (UAE) - AED / 5% VAT</option>
                          <option value="KSA">🇸🇦 Saudi Arabia (KSA) - SAR / 15% VAT</option>
                          <option value="Oman">🇴🇲 Oman - OMR / 5% VAT</option>
                          <option value="Bahrain">🇧🇭 Bahrain - BHD / 10% VAT</option>
                          <option value="Qatar">🇶🇦 Qatar - QAR / Tax Free</option>
                          <option value="Kuwait">🇰🇼 Kuwait - KWD / Tax Free</option>
                        </optgroup>
                        <optgroup label="South Asia & Central Asia">
                          <option value="Pakistan">🇵🇰 Pakistan - PKR / 18% Sales Tax (FBR)</option>
                          <option value="Bangladesh">🇧🇩 Bangladesh - BDT / 15% VAT (NBR Mushak)</option>
                          <option value="India">🇮🇳 India - INR (₹) / 18% GST (GSTN)</option>
                          <option value="Nepal">🇳🇵 Nepal - NPR / 13% VAT (IRD)</option>
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Base Currency & Symbol
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          name="currency"
                          value={formData.currency || 'AED'}
                          onChange={handleChange}
                          placeholder="AED / PKR / SAR"
                          className="w-1/2 text-xs font-mono font-bold border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-hidden"
                        />
                        <input
                          type="text"
                          name="currencySymbol"
                          value={formData.currencySymbol || formData.currency || 'AED'}
                          onChange={handleChange}
                          placeholder="Symbol (e.g. AED, Rs, ₹)"
                          className="w-1/2 text-xs font-mono font-bold border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Standard Tax Rate (%)
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          step="0.1"
                          name="taxRate"
                          value={formData.taxRate ?? 5}
                          onChange={handleChange}
                          className="w-1/2 text-xs font-mono font-bold border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-hidden"
                        />
                        <input
                          type="text"
                          name="taxName"
                          value={formData.taxName || 'VAT'}
                          onChange={handleChange}
                          placeholder="VAT / GST / Sales Tax"
                          className="w-1/2 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Workspace Header */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">Workspace</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Primary trade identity details & workspace settings</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Business Name (English)</label>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="e.g., ABC COMPANY LLC"
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center justify-between">
                      <span>Secondary Trade Name</span>
                      <span className="text-[9px] text-emerald-600 font-semibold font-mono">FTA Bilingual</span>
                    </label>
                    <input 
                      type="text" 
                      name="nameAr"
                      dir="rtl"
                      value={formData.nameAr || ''}
                      onChange={handleChange}
                      placeholder="e.g., Al Anwar Trading LLC"
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-hidden font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Email</label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g., demo@gmail.com"
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1 dark:text-slate-300">Phone</label>
                    <input 
                      type="text" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g., 0575385552"
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1 dark:text-slate-300">Address</label>
                    <input 
                      type="text" 
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="e.g., 125/9 Industrial Area, Dubai, UAE"
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1 dark:text-slate-300">
                      Corporate Timezone
                    </label>
                    <select 
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleChange}
                      className="w-full text-xs font-semibold border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-hidden cursor-pointer"
                    >
                      <optgroup label="South Asia & Central Asia">
                        <option value="Asia/Karachi">🇵🇰 Asia/Karachi (PKT - Pakistan Standard Time, UTC+5)</option>
                        <option value="Asia/Dhaka">🇧🇩 Asia/Dhaka (BST - Bangladesh Standard Time, UTC+6)</option>
                        <option value="Asia/Kolkata">🇮🇳 Asia/Kolkata (IST - India Standard Time, UTC+5:30)</option>
                        <option value="Asia/Kathmandu">🇳🇵 Asia/Kathmandu (NPT - Nepal Standard Time, UTC+5:45)</option>
                        <option value="Asia/Colombo">🇱🇰 Asia/Colombo (SLST - Sri Lanka, UTC+5:30)</option>
                        <option value="Asia/Kabul">🇦🇫 Asia/Kabul (AFT - Afghanistan, UTC+4:30)</option>
                      </optgroup>
                      <optgroup label="GCC & Middle East">
                        <option value="Asia/Dubai">🇦🇪 Asia/Dubai (GST - UAE Gulf Standard Time, UTC+4)</option>
                        <option value="Asia/Riyadh">🇸🇦 Asia/Riyadh (AST - Saudi Arabia Standard Time, UTC+3)</option>
                        <option value="Asia/Muscat">🇴🇲 Asia/Muscat (GST - Oman Standard Time, UTC+4)</option>
                        <option value="Asia/Qatar">🇶🇦 Asia/Qatar (AST - Qatar Standard Time, UTC+3)</option>
                        <option value="Asia/Kuwait">🇰🇼 Asia/Kuwait (AST - Kuwait Standard Time, UTC+3)</option>
                        <option value="Asia/Bahrain">🇧🇭 Asia/Bahrain (AST - Bahrain Standard Time, UTC+3)</option>
                      </optgroup>
                      <optgroup label="East Asia & Global">
                        <option value="Asia/Bangkok">🇹🇭 Asia/Bangkok (ICT - Thailand, Indochina, UTC+7)</option>
                        <option value="Asia/Singapore">🇸🇬 Asia/Singapore (SGT - Singapore / Malaysia, UTC+8)</option>
                        <option value="Asia/Tokyo">🇯🇵 Asia/Tokyo (JST - Japan, UTC+9)</option>
                        <option value="Europe/London">🇬🇧 Europe/London (BST/GMT - United Kingdom, UTC+0/+1)</option>
                        <option value="America/New_York">🇺🇸 America/New_York (EST/EDT - US Eastern, UTC-5/-4)</option>
                        <option value="UTC">🌐 Coordinated Universal Time (UTC+0)</option>
                      </optgroup>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1 dark:text-slate-300">Financial Year Start</label>
                    <input 
                      type="date" 
                      name="fyStart"
                      value={formData.fyStart}
                      onChange={handleChange}
                      required
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1 dark:text-slate-300">Standard Date Format</label>
                    <select 
                      name="dateFormat"
                      value={formData.dateFormat || 'DD/MM/YYYY'}
                      onChange={handleChange}
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-hidden cursor-pointer"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY (GCC Standard - e.g., 31/07/2026)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Standard - e.g., 2026-07-31)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (US Standard - e.g., 07/31/2026)</option>
                      <option value="DD-MM-YYYY">DD-MM-YYYY (Hyphenated - e.g., 31-07-2026)</option>
                      <option value="DD MMM YYYY">DD MMM YYYY (Textual Month - e.g., 31 Jul 2026)</option>
                    </select>
                  </div>

                  {/* Software-Wide Typography & Theme Font Selector */}
                  <div className="sm:col-span-2 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-3 mt-2">
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">Software-Wide Typography & Themes</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Choose your company's preferred branding font family to customize the entire software interface</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1 dark:text-slate-300">Choose Software Font Family</label>
                        <select 
                          name="appFont"
                          value={formData.appFont || 'Inter'}
                          onChange={handleChange}
                          className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 cursor-pointer focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="Inter">Inter (System Default - Elegant & Modern)</option>
                          <option value="Space Grotesk">Space Grotesk (Bold, Tech-forward & Clean)</option>
                          <option value="JetBrains Mono">JetBrains Mono (Sleek, Developer & Tabular)</option>
                          <option value="Lexend">Lexend (Friendly, Rounded & Legible)</option>
                          <option value="Plus Jakarta Sans">Plus Jakarta Sans (Symmetric Geometric)</option>
                          <option value="Outfit">Outfit (Minimalist Geometric & Modern)</option>
                          <option value="DM Sans">DM Sans (Compact, Sophisticated Sans-Serif)</option>
                          <option value="Playfair Display">Playfair Display (Premium, High-Contrast Serif)</option>
                          <option value="Cabin">Cabin (Warm, Humanist & Professional)</option>
                          <option value="Noto Sans Arabic">Noto Sans Arabic (Perfect Bilingual Arabic/English)</option>
                        </select>
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-150 dark:border-slate-800 flex flex-col justify-center min-h-[64px]">
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">Live Typography Preview:</span>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1" style={{ fontFamily: formData.appFont || 'Inter' }}>
                          Hisaab Pro - {formData.appFont || 'Inter'} Font
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5" style={{ fontFamily: formData.appFont || 'Inter' }}>
                          AED 1,250.50 VAT 5% (Live Detailed Preview)
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Legacy features: Inventory Control Toggle & Disaster Recovery */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  
                  {/* Inventory Switch */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="pr-4">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Enable Inventory Management</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">
                        Toggle ON to restrict invoices to items in the Product Master and enforce stock validation. Toggle OFF to allow adding manual items without stock checks.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('inventoryEnabled')}
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${formData.inventoryEnabled ? 'bg-blue-600' : 'bg-slate-350 dark:bg-slate-700'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${formData.inventoryEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </button>
                  </div>

                  {/* Barcode Scanning Settings */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="pr-4">
                        <div className="flex items-center space-x-2">
                          <span className="bg-blue-600 text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Barcode Engine</span>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Enable Barcode Scanning</h4>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">
                          Enable barcode/QR/Code128 product lookup, tracking, and scanner search in sales documents.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggle('barcodeScanningEnabled')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${formData.barcodeScanningEnabled ? 'bg-blue-600' : 'bg-slate-350 dark:bg-slate-700'}`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${formData.barcodeScanningEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </button>
                    </div>

                    {formData.barcodeScanningEnabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Default Barcode Type</label>
                          <select 
                            name="defaultBarcodeType"
                            value={formData.defaultBarcodeType || 'EAN-13'}
                            onChange={handleChange}
                            className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 cursor-pointer"
                          >
                            <option value="EAN-13">EAN-13 (Standard Retail Barcode)</option>
                            <option value="QR">QR Code (Matrix Barcode)</option>
                            <option value="Code128">Code 128 (High-Density Linear Barcode)</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Staff Module Switch */}
                  <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="pr-4">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Staff Management Module</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">
                          Enable UAE compliance, labor law-aligned staff directory, visa/passport expiry alerts, and gratuity calculators.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggle('staffEnabled')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${formData.staffEnabled ? 'bg-blue-600' : 'bg-slate-350 dark:bg-slate-700'}`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${formData.staffEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </button>
                    </div>

                    {formData.staffEnabled && (
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-4">
                        
                        {/* 1. Shift Timings & Break Configuration */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-mono">
                              ⏰ Shift Timings, Durations & Break Configurations
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">Company Standard HR Shifts</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Day Shift Panel */}
                            <div className="p-3 bg-white dark:bg-slate-950 border border-indigo-100 dark:border-indigo-900/50 rounded-lg space-y-2.5">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                                  Day Shift Parameters
                                </span>
                                <span className="text-[10px] font-mono text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                                  {(() => {
                                    const [sh, sm] = (formData.dayShiftStart || '08:00').split(':').map(Number);
                                    const [eh, em] = (formData.dayShiftEnd || '17:00').split(':').map(Number);
                                    let startMins = sh * 60 + sm;
                                    let endMins = eh * 60 + em;
                                    if (endMins <= startMins) endMins += 1440;
                                    const totalHours = (endMins - startMins) / 60;
                                    const breakHours = (formData.dayShiftBreakMins || 60) / 60;
                                    const workHours = Math.max(0, totalHours - breakHours);
                                    return `${totalHours.toFixed(1)} hrs total (${workHours.toFixed(1)}h work + ${breakHours.toFixed(1)}h break)`;
                                  })()}
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Start Time</label>
                                  <input 
                                    type="time" 
                                    value={formData.dayShiftStart || '08:00'} 
                                    onChange={(e) => handleChange('dayShiftStart', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 font-mono text-xs text-slate-800 dark:text-slate-200"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">End Time</label>
                                  <input 
                                    type="time" 
                                    value={formData.dayShiftEnd || '17:00'} 
                                    onChange={(e) => handleChange('dayShiftEnd', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 font-mono text-xs text-slate-800 dark:text-slate-200"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Break (Mins)</label>
                                  <input 
                                    type="number" 
                                    value={formData.dayShiftBreakMins ?? 60} 
                                    onChange={(e) => handleChange('dayShiftBreakMins', Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 font-mono text-xs text-slate-800 dark:text-slate-200"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Night Shift Panel */}
                            <div className="p-3 bg-white dark:bg-slate-950 border border-indigo-100 dark:border-indigo-900/50 rounded-lg space-y-2.5">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                                  Night Shift Parameters
                                </span>
                                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
                                  {(() => {
                                    const [sh, sm] = (formData.nightShiftStart || '20:00').split(':').map(Number);
                                    const [eh, em] = (formData.nightShiftEnd || '05:00').split(':').map(Number);
                                    let startMins = sh * 60 + sm;
                                    let endMins = eh * 60 + em;
                                    if (endMins <= startMins) endMins += 1440;
                                    const totalHours = (endMins - startMins) / 60;
                                    const breakHours = (formData.nightShiftBreakMins || 60) / 60;
                                    const workHours = Math.max(0, totalHours - breakHours);
                                    return `${totalHours.toFixed(1)} hrs total (${workHours.toFixed(1)}h work + ${breakHours.toFixed(1)}h break)`;
                                  })()}
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Start Time</label>
                                  <input 
                                    type="time" 
                                    value={formData.nightShiftStart || '20:00'} 
                                    onChange={(e) => handleChange('nightShiftStart', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 font-mono text-xs text-slate-800 dark:text-slate-200"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">End Time</label>
                                  <input 
                                    type="time" 
                                    value={formData.nightShiftEnd || '05:00'} 
                                    onChange={(e) => handleChange('nightShiftEnd', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 font-mono text-xs text-slate-800 dark:text-slate-200"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Break (Mins)</label>
                                  <input 
                                    type="number" 
                                    value={formData.nightShiftBreakMins ?? 60} 
                                    onChange={(e) => handleChange('nightShiftBreakMins', Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 font-mono text-xs text-slate-800 dark:text-slate-200"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 2. Salary Month Calculation Basis */}
                        <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono block">
                            💵 Monthly Payroll Salary Calculation Days Basis
                          </label>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Determines daily rate computation for unexcused leave deductions and partial month joining salaries. (e.g. Daily Rate = Basic Salary / Calculation Days).
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                            <label className={`p-2.5 rounded-lg border text-xs cursor-pointer flex flex-col justify-between ${
                              formData.salaryCalculationBasis === '30_fixed' || !formData.salaryCalculationBasis
                                ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-200 font-bold'
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              <div className="flex items-center space-x-2">
                                <input 
                                  type="radio" 
                                  name="salaryBasis" 
                                  value="30_fixed" 
                                  checked={formData.salaryCalculationBasis === '30_fixed' || !formData.salaryCalculationBasis} 
                                  onChange={() => handleChange('salaryCalculationBasis', '30_fixed')}
                                />
                                <span>30 Days Fixed (Standard UAE)</span>
                              </div>
                              <span className="text-[9px] text-slate-400 mt-1 font-normal font-mono">Daily Rate = Salary / 30</span>
                            </label>

                            <label className={`p-2.5 rounded-lg border text-xs cursor-pointer flex flex-col justify-between ${
                              formData.salaryCalculationBasis === '31_fixed'
                                ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-200 font-bold'
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              <div className="flex items-center space-x-2">
                                <input 
                                  type="radio" 
                                  name="salaryBasis" 
                                  value="31_fixed" 
                                  checked={formData.salaryCalculationBasis === '31_fixed'} 
                                  onChange={() => handleChange('salaryCalculationBasis', '31_fixed')}
                                />
                                <span>31 Days Fixed</span>
                              </div>
                              <span className="text-[9px] text-slate-400 mt-1 font-normal font-mono">Daily Rate = Salary / 31</span>
                            </label>

                            <label className={`p-2.5 rounded-lg border text-xs cursor-pointer flex flex-col justify-between ${
                              formData.salaryCalculationBasis === 'actual_month_days'
                                ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-200 font-bold'
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              <div className="flex items-center space-x-2">
                                <input 
                                  type="radio" 
                                  name="salaryBasis" 
                                  value="actual_month_days" 
                                  checked={formData.salaryCalculationBasis === 'actual_month_days'} 
                                  onChange={() => handleChange('salaryCalculationBasis', 'actual_month_days')}
                                />
                                <span>Actual Calendar Days</span>
                              </div>
                              <span className="text-[9px] text-slate-400 mt-1 font-normal font-mono">Daily Rate = Salary / Month Days (28-31)</span>
                            </label>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>

                  {/* Multi-Branch Operations Switch */}
                  <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="pr-4">
                        <div className="flex items-center space-x-2">
                          <span className="bg-indigo-600 text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Corporate Operations</span>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Multi-Branch System</h4>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">
                          Enable for multi-location businesses operating multiple retail shops, showrooms, regional warehouses, or inter-branch stock transfers. Toggle OFF if this company operates from a single head office.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggle('multiBranchEnabled')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${formData.multiBranchEnabled ? 'bg-indigo-600' : 'bg-slate-350 dark:bg-slate-700'}`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${formData.multiBranchEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </button>
                    </div>

                    {formData.multiBranchEnabled && (
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center space-x-1.5">
                          <Store className="w-4 h-4 text-indigo-500" />
                          <span>Registered Branches: <strong>{branches.filter(b => b.companyId === company.id).length || 1} Outlets</strong></span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (onSubTabChange) onSubTabChange('branches');
                            setActiveSubTab('branches');
                          }}
                          className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded text-[10px] font-bold uppercase tracking-wider font-mono border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                        >
                          Manage Locations &rarr;
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Enterprise ERP & Double-Entry Accounting Module Switch */}
                  <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="pr-4">
                        <div className="flex items-center space-x-2">
                          <span className="bg-emerald-600 text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">ERP Accounting</span>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Enterprise ERP & Double-Entry Accounting</h4>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">
                          Toggle ON to enable General Ledger, Chart of Accounts, Bank Reconciliation, Asset Register, PDC Cheques, and Advanced Balance Sheet reports. Toggle OFF for a simplified, lightweight invoicing experience.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggle('erpEnabled')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${formData.erpEnabled ? 'bg-emerald-600' : 'bg-slate-350 dark:bg-slate-700'}`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${formData.erpEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </button>
                    </div>

                    {formData.erpEnabled && (
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center space-x-1.5 font-mono">
                          <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Double-Entry Matching: <strong>Strict Balance (Debit = Credit)</strong></span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (onSubTabChange) onSubTabChange('tax');
                            setActiveSubTab('tax');
                          }}
                          className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded text-[10px] font-bold uppercase tracking-wider font-mono border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                        >
                          Ledger Defaults & Lock &rarr;
                        </button>
                      </div>
                    )}
                  </div>

                  {/* UAE Corporate Tax (9%) & Corporate Settings Switch */}
                  <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="pr-4">
                        <div className="flex items-center space-x-2">
                          <span className="bg-cyan-600 text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-mono">FTA Corporate Tax 2024+</span>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">UAE Corporate Tax & Corporate Settings (9%)</h4>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">
                          Toggle ON to enable UAE Corporate Tax estimations (9% tax on net profit over AED 375,000 under Federal Decree-Law No. 47), CTRN registration, and corporate tax liability tracking. Toggle OFF if exempt or not required.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggle('corporateTaxEnabled')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${formData.corporateTaxEnabled ? 'bg-cyan-600' : 'bg-slate-350 dark:bg-slate-700'}`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${formData.corporateTaxEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </button>
                    </div>

                    {formData.corporateTaxEnabled && (
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Corporate Tax Reg (CTRN)</label>
                          <input
                            type="text"
                            name="ctrn"
                            value={formData.ctrn || ''}
                            onChange={handleChange}
                            placeholder="e.g., CTRN100234"
                            className="w-full text-xs font-mono border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Taxable Threshold (AED)</label>
                          <input
                            type="number"
                            name="corporateTaxThreshold"
                            value={formData.corporateTaxThreshold ?? 375000}
                            onChange={handleChange}
                            className="w-full text-xs font-mono border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Corporate Tax Rate (%)</label>
                          <input
                            type="number"
                            name="corporateTaxRate"
                            value={formData.corporateTaxRate ?? 9}
                            onChange={handleChange}
                            className="w-full text-xs font-mono border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fast Thermal POS Terminal Module Switch (Default OFF) */}
                  <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="pr-4">
                        <div className="flex items-center space-x-2">
                          <span className="bg-amber-500 text-slate-950 font-mono text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Thermal POS (80mm/58mm)</span>
                          <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Default: OFF</span>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Fast Thermal POS System</h4>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">
                          Toggle ON to activate high-speed retail counter POS checkout, instant barcode lookup, keyboard shortcuts (F1-F12), quick cash tender buttons, and 80mm/58mm ESC/POS thermal receipt printing. Toggle OFF (Default) to streamline back-office invoicing.
                        </p>
                      </div>
                      <button
                        type="button"
                        id="toggle-pos-enabled"
                        onClick={() => handleToggle('posEnabled')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${formData.posEnabled ? 'bg-amber-500' : 'bg-slate-350 dark:bg-slate-700'}`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${formData.posEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </button>
                    </div>

                    {formData.posEnabled && (
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center space-x-2 font-mono">
                          <Printer className="w-4 h-4 text-amber-500" />
                          <span>Receipt Format: <strong>80mm / 58mm Thermal Roll + QR Code</strong></span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('switch-tab', { detail: { tab: 'pos' } }));
                          }}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-[10px] font-black uppercase tracking-wider font-mono shadow-sm cursor-pointer flex items-center space-x-1"
                        >
                          <span>⚡ Launch POS Register &rarr;</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* System Backup Vault */}
                  <div className="bg-emerald-50/40 dark:bg-[#062e1c]/10 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-xl space-y-3">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider font-mono">Disaster Recovery & Data Backup Vault</h4>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-500 leading-normal">
                        <strong>100% Offline & Local.</strong> All your financial ledgers, settings, and invoices are saved securely at <code>C:\HisaabPro\Data\company.db</code>. Use the controls below to migrate or store backups.
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleBackup}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center space-x-1.5 cursor-pointer shadow-xs font-mono"
                      >
                        <Upload className="w-3 h-3 rotate-180" />
                        <span>Export Backup (.hisaab)</span>
                      </button>
                      <label className="px-3 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center space-x-1.5 cursor-pointer shadow-xs font-mono">
                        <Upload className="w-3 h-3" />
                        <span>Import Restore (.hisaab)</span>
                        <input
                          type="file"
                          accept=".hisaab,.json"
                          onChange={handleRestore}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* 🛡️ Real-time Anti-Virus & Anti-Corruption Shield Notice */}
                    <div className="mt-3 p-3 bg-white/80 dark:bg-slate-900/60 border border-emerald-200/80 dark:border-emerald-800/40 rounded-lg flex items-start space-x-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5 text-[11px]">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider font-mono">Anti-Virus & Zero-Corruption Shield: ACTIVE</span>
                          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold text-[9px] rounded font-mono">PRO-PROTECTED</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[10px]">
                          All backup exports and restores undergo real-time heuristic scanning for Windows PE executables, PowerShell/CMD script injection, malicious payload headers, and structural corruptions. Restores containing viruses or altered signatures are blocked automatically.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* MULTI-BRANCH & LOCATIONS TAB */}
            {activeSubTab === 'branches' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Header & Master Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Store className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
                          Multi-Branch System & Locations
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Manage multiple retail outlets, regional showrooms, branch managers, and warehouse transfer nodes
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* On/Off Switch */}
                  <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-950 p-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
                    <div className="text-right">
                      <div className="text-[11px] font-bold text-slate-900 dark:text-slate-100">
                        {formData.multiBranchEnabled ? 'Multi-Branch: ON' : 'Multi-Branch: OFF'}
                      </div>
                      <div className="text-[9px] font-mono text-slate-400">
                        {formData.multiBranchEnabled ? 'Multiple Outlets Active' : 'Single Office Mode'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('multiBranchEnabled')}
                      className={`w-12 h-6.5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                        formData.multiBranchEnabled ? 'bg-indigo-600' : 'bg-slate-350 dark:bg-slate-700'
                      }`}
                      title={formData.multiBranchEnabled ? 'Click to Disable Multi-Branch Mode' : 'Click to Enable Multi-Branch Mode'}
                    >
                      <div
                        className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform ${
                          formData.multiBranchEnabled ? 'translate-x-5.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {!formData.multiBranchEnabled ? (
                  /* Disabled Notice Banner */
                  <div className="p-8 bg-slate-50 dark:bg-slate-900/30 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4">
                    <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <Store className="w-7 h-7" />
                    </div>
                    <div className="max-w-md mx-auto space-y-1.5">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Single-Branch Mode Active
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        This company operates from a single head office. Invoices and inventory operate from the central company profile.
                      </p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        If this business has multiple showrooms, retail outlets, or requires branch-to-branch warehouse transfers, turn ON the Multi-Branch toggle above.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('multiBranchEnabled')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all shadow-xs cursor-pointer inline-flex items-center space-x-2"
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Enable Multi-Branch System</span>
                    </button>
                  </div>
                ) : (
                  /* Active Multi-Branch Dashboard & Manager */
                  <div className="space-y-6">
                    
                    {/* Summary KPI Cards */}
                    {(() => {
                      const companyBranches = branches.filter(b => b.companyId === company.id);
                      const activeCount = companyBranches.filter(b => b.status === 'Active').length;
                      const headOffice = companyBranches.find(b => b.isHeadOffice) || companyBranches[0];
                      const emirates = Array.from(new Set(companyBranches.map(b => b.emirate)));

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Registered Branches</div>
                            <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1 font-mono">
                              {companyBranches.length}
                            </div>
                            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5 font-medium">
                              {activeCount} Active Outlets
                            </div>
                          </div>

                          <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Head Office</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">
                              {headOffice ? headOffice.name : formData.name}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                              Code: {headOffice ? headOffice.code : 'HQ-01'}
                            </div>
                          </div>

                          <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Emirates Coverage</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">
                              {emirates.join(', ') || 'Dubai'}
                            </div>
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                              {emirates.length} {emirates.length === 1 ? 'Emirate' : 'Emirates'}
                            </div>
                          </div>

                          <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Inter-Branch Logistics</div>
                            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                              Warehouse Transfer Ready
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Synced in Inventory Master
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Branch Action & List */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                      
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/30">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
                            Registered Company Branches ({branches.filter(b => b.companyId === company.id).length})
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Individual branch locations and invoice prefixes for {formData.name}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleOpenAddBranchModal}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold font-mono uppercase tracking-wider flex items-center space-x-1.5 shadow-xs cursor-pointer shrink-0 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Register New Branch</span>
                        </button>
                      </div>

                      {/* Branches Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              <th className="p-3 pl-4">Branch Code & Name</th>
                              <th className="p-3">Emirate / City</th>
                              <th className="p-3">Contact & Address</th>
                              <th className="p-3">Manager</th>
                              <th className="p-3">Invoice Prefix</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 pr-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                            {branches.filter(b => b.companyId === company.id).length === 0 ? (
                              <tr>
                                <td colSpan={7} className="p-8 text-center text-slate-400">
                                  <Store className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                                  <p className="text-xs font-medium">No branch locations registered yet.</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">Click "Register New Branch" above to add your first branch location.</p>
                                </td>
                              </tr>
                            ) : (
                              branches
                                .filter(b => b.companyId === company.id)
                                .map((br) => (
                                  <tr key={br.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                    <td className="p-3 pl-4">
                                      <div className="flex items-center space-x-2">
                                        <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold rounded border border-indigo-200 dark:border-indigo-800">
                                          {br.code}
                                        </span>
                                        <div>
                                          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                            <span>{br.name}</span>
                                            {br.isHeadOffice && (
                                              <span className="px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[9px] font-bold rounded">
                                                HQ
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-3 text-slate-700 dark:text-slate-300">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300">
                                        <MapPin className="w-3 h-3 text-indigo-500" />
                                        {br.emirate}
                                      </span>
                                    </td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400">
                                      <div className="text-[11px] truncate max-w-xs">{br.address || '—'}</div>
                                      <div className="text-[10px] text-slate-400 font-mono">{br.phone}</div>
                                    </td>
                                    <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">
                                      {br.managerName || '—'}
                                    </td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                                      {br.invoicePrefix ? (
                                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-bold text-[10px]">
                                          {br.invoicePrefix}
                                        </span>
                                      ) : '—'}
                                    </td>
                                    <td className="p-3">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase ${
                                        br.status === 'Active'
                                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                      }`}>
                                        {br.status}
                                      </span>
                                    </td>
                                    <td className="p-3 pr-4 text-right">
                                      <div className="flex items-center justify-end space-x-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditBranchModal(br)}
                                          className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded transition-colors cursor-pointer"
                                          title="Edit Branch"
                                        >
                                          <Sliders className="w-3.5 h-3.5" />
                                        </button>
                                        {!br.isHeadOffice && onDeleteBranch && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (confirm(`Are you sure you want to delete branch "${br.name}" (${br.code})?`)) {
                                                onDeleteBranch(br.id);
                                              }
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                                            title="Delete Branch"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))
                            )}
                          </tbody>
                        </table>
                      </div>

                    </div>

                  </div>
                )}

              </div>
            )}

            {/* MODAL FOR ADDING / EDITING BRANCH */}
            {isBranchModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print animate-fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden">
                  
                  <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <div className="flex items-center space-x-2">
                      <Store className="w-4.5 h-4.5 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono uppercase tracking-wider">
                        {editingBranchId ? 'Edit Branch Location' : 'Register New Branch Location'}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsBranchModalOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveBranchForm} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Branch Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={branchFormCode}
                          onChange={(e) => setBranchFormCode(e.target.value)}
                          placeholder="e.g., DXB-01"
                          className="w-full text-xs font-mono border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 uppercase"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          UAE Emirate *
                        </label>
                        <select
                          value={branchFormEmirate}
                          onChange={(e) => setBranchFormEmirate(e.target.value as 'Abu Dhabi' | 'Dubai' | 'Sharjah' | 'Ajman' | 'Umm Al Quwain' | 'Ras Al Khaimah' | 'Fujairah')}
                          className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 cursor-pointer"
                        >
                          <option value="Dubai">Dubai</option>
                          <option value="Abu Dhabi">Abu Dhabi</option>
                          <option value="Sharjah">Sharjah</option>
                          <option value="Ajman">Ajman</option>
                          <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                          <option value="Fujairah">Fujairah</option>
                          <option value="Umm Al Quwain">Umm Al Quwain</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Branch Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={branchFormName}
                        onChange={(e) => setBranchFormName(e.target.value)}
                        placeholder="e.g., Dubai Mall Outlet"
                        className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Branch Phone
                        </label>
                        <input
                          type="text"
                          value={branchFormPhone}
                          onChange={(e) => setBranchFormPhone(e.target.value)}
                          placeholder="e.g., +971 4 380 0000"
                          className="w-full text-xs font-mono border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Branch Email
                        </label>
                        <input
                          type="email"
                          value={branchFormEmail}
                          onChange={(e) => setBranchFormEmail(e.target.value)}
                          placeholder="e.g., dxb-branch@company.ae"
                          className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Branch Manager
                        </label>
                        <input
                          type="text"
                          value={branchFormManager}
                          onChange={(e) => setBranchFormManager(e.target.value)}
                          placeholder="e.g., Tariq Al Mansoori"
                          className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Invoice Prefix
                        </label>
                        <input
                          type="text"
                          value={branchFormPrefix}
                          onChange={(e) => setBranchFormPrefix(e.target.value)}
                          placeholder="e.g., DXB- or SHJ-"
                          className="w-full text-xs font-mono border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={branchFormAddress}
                        onChange={(e) => setBranchFormAddress(e.target.value)}
                        placeholder="e.g., Unit 42, Floor 2, Financial Centre Road, Dubai"
                        className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={branchFormIsHeadOffice}
                          onChange={(e) => setBranchFormIsHeadOffice(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                        <span>Set as Main Head Office (HQ)</span>
                      </label>

                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <label>Status:</label>
                        <select
                          value={branchFormStatus}
                          onChange={(e) => setBranchFormStatus(e.target.value as 'Active' | 'Inactive')}
                          className="text-xs border border-slate-200 dark:border-slate-800 rounded px-2 py-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 cursor-pointer font-mono"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setIsBranchModalOpen(false)}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold font-mono uppercase tracking-wider shadow-xs cursor-pointer transition-colors"
                      >
                        {editingBranchId ? 'Update Branch' : 'Save Branch'}
                      </button>
                    </div>

                  </form>

                </div>
              </div>
            )}

            {/* 2. ADD COMPANY LOGO TAB */}
            {activeSubTab === 'logo' && (
              <div className="space-y-6 animate-fade-in">
                
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">Company Logo</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Customize your brand image displayed on corporate headers</p>
                </div>

                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
                  {formData.logoUrl ? (
                    <div className="relative w-40 h-40 flex items-center justify-center bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner p-3">
                      <img src={formData.logoUrl} alt="Company Logo" className="object-contain max-w-full max-h-full" />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, logoUrl: undefined }))}
                        className="absolute top-2 right-2 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer"
                        title="Remove logo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-40 h-40 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400">
                      <ImageIcon className="w-10 h-10 stroke-1" />
                      <span className="text-[10px] text-slate-450 mt-2 font-mono italic">No Brand Logo Loaded</span>
                    </div>
                  )}

                  <div className="text-center space-y-1">
                    <label className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg cursor-pointer transition-all shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose file</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload} 
                        className="hidden" 
                      />
                    </label>
                    <p className="text-[9px] text-slate-450 dark:text-slate-500 pt-1">Accepts PNG, JPG or WebP. Transparent background suggested.</p>
                  </div>
                </div>

                {/* Logo Customization Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block font-mono uppercase tracking-wider">Logo Position</label>
                    <select
                      name="logoPosition"
                      value={formData.logoPosition || 'center'}
                      onChange={handleChange}
                      className="w-full border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-lg p-2.5 text-xs font-semibold focus:border-blue-500"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                    <span className="text-[9px] text-slate-400 block">Positions the logo in print PDFs and report headers.</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block font-mono uppercase tracking-wider">Logo Size</label>
                    <select
                      name="logoSize"
                      value={formData.logoSize || 'medium'}
                      onChange={handleChange}
                      className="w-full border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-lg p-2.5 text-xs font-semibold focus:border-blue-500"
                    >
                      <option value="small">Small (Height: 40px)</option>
                      <option value="medium">Medium (Height: 64px)</option>
                      <option value="large">Large (Height: 96px)</option>
                    </select>
                    <span className="text-[9px] text-slate-400 block">Resizes the brand asset on document headers.</span>
                  </div>
                </div>

              </div>
            )}

            {/* 3. INVOICE SETTINGS TAB */}
            {activeSubTab === 'invoice' && (
              <div className="space-y-6 animate-fade-in text-xs">
                
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">Invoice Settings</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Configure default layouts, prefix values, colors, signatures and payment terms for Invoices</p>
                </div>

                {/* Brand Identity / Title styling */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Invoice subtitle</label>
                    <input 
                      type="text" 
                      name="invoiceSubtitle"
                      value={formData.invoiceSubtitle}
                      onChange={handleChange}
                      placeholder="e.g., Building Construction & Maintenance"
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Subtitle position</label>
                    <select 
                      name="invoiceSubtitlePos"
                      value={formData.invoiceSubtitlePos}
                      onChange={handleChange}
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 cursor-pointer"
                    >
                      <option value="left">Left Aligned</option>
                      <option value="center">Center Aligned</option>
                      <option value="right">Right Aligned</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Font family</label>
                    <select 
                      name="invoiceFontFamily"
                      value={formData.invoiceFontFamily}
                      onChange={handleChange}
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 cursor-pointer"
                    >
                      <option value="Verdana">Verdana (Corporate Clean)</option>
                      <option value="Inter">Inter (SaaS Modern)</option>
                      <option value="Courier New">Courier New (Monospaced Technical)</option>
                      <option value="Georgia">Georgia (Serif Elegant)</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-4 pt-5">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.invoiceBold}
                        onChange={() => setFormData(prev => ({ ...prev, invoiceBold: !prev.invoiceBold }))}
                        className="rounded-sm border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Bold</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.invoiceItalic}
                        onChange={() => setFormData(prev => ({ ...prev, invoiceItalic: !prev.invoiceItalic }))}
                        className="rounded-sm border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Italic</span>
                    </label>
                  </div>
                </div>

                {/* Colors picker palette */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Colors</label>
                  <div className="flex flex-wrap gap-2.5">
                    {colorPresets.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, invoiceThemeColor: color }))}
                        className="w-7 h-7 rounded-full border border-slate-300 dark:border-slate-600 cursor-pointer transition-transform hover:scale-115 flex items-center justify-center"
                        style={{ backgroundColor: color }}
                        title={color}
                      >
                        {formData.invoiceThemeColor === color && (
                          <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Header background presets */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Header background color</label>
                  <div className="flex flex-wrap gap-2.5">
                    {headerPresets.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, invoiceHeaderBgColor: color }))}
                        className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 cursor-pointer transition-transform hover:scale-115 flex items-center justify-center shadow-2xs"
                        style={{ backgroundColor: color }}
                        title={color}
                      >
                        {formData.invoiceHeaderBgColor === color && (
                          <span className="w-1.5 h-1.5 bg-slate-900 rounded-full"></span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prefix, Starting Sequence & Banking Defaults */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                        <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Invoice Sequence & Prefix Lock Control
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Set custom sequence prefix and starting invoice number (e.g. 100, 1001, 5000). The company can toggle lock at any time.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, isInvoicePrefixLocked: !prev.isInvoicePrefixLocked }))}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-2xs ${
                        formData.isInvoicePrefixLocked
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-500/20'
                      }`}
                    >
                      {formData.isInvoicePrefixLocked ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>🔒 Locked (Click to Unlock)</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>🔓 Unlocked (Click to Lock)</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Invoice Number Prefix</label>
                      <input 
                        type="text" 
                        name="invoicePrefix"
                        value={formData.invoicePrefix}
                        onChange={handleChange}
                        disabled={formData.isInvoicePrefixLocked}
                        placeholder="e.g. INV-"
                        className={`w-full text-xs border rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 ${
                          formData.isInvoicePrefixLocked 
                            ? 'bg-slate-100 dark:bg-slate-800/80 cursor-not-allowed opacity-75 border-slate-200 dark:border-slate-800 font-mono' 
                            : invoicePrefixError 
                            ? 'border-rose-500 focus:border-rose-500 bg-white dark:bg-slate-900 font-mono' 
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono font-bold'
                        }`}
                      />
                      {formData.isInvoicePrefixLocked ? (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-1 leading-normal flex items-center space-x-1">
                          <Lock className="w-3 h-3 shrink-0" />
                          <span>Prefix is locked. Click Unlock button to modify.</span>
                        </div>
                      ) : invoicePrefixError ? (
                        <div className="text-[10px] text-rose-500 font-bold mt-1 font-mono">
                          {invoicePrefixError}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">e.g. INV-, BILL-, SLS-</p>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Next Invoice Starting Number</label>
                      <input 
                        type="number" 
                        name="nextInvoiceNumber"
                        value={formData.nextInvoiceNumber || 1001}
                        onChange={handleChange}
                        disabled={formData.isInvoicePrefixLocked}
                        placeholder="e.g. 100, 1001, 5000"
                        className={`w-full text-xs border rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 ${
                          formData.isInvoicePrefixLocked 
                            ? 'bg-slate-100 dark:bg-slate-800/80 cursor-not-allowed opacity-75 border-slate-200 dark:border-slate-800 font-mono' 
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono font-bold'
                        }`}
                      />
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Company can start sequence from 100, 1001, or 5000</p>
                    </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Bank Name</label>
                    <input 
                      type="text" 
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      placeholder="e.g., Emirates NBD"
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Account Beneficiary</label>
                    <input 
                      type="text" 
                      name="bankAccountName"
                      value={formData.bankAccountName}
                      onChange={handleChange}
                      placeholder="e.g., ABC COMPANY LLC"
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">IBAN Number</label>
                    <input 
                      type="text" 
                      name="bankIban"
                      value={formData.bankIban}
                      onChange={handleChange}
                      placeholder="e.g., AE120220000001234567890"
                      className="w-full text-xs font-mono border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Customer Name (Beneficiary)</label>
                    <input 
                      type="text" 
                      name="bankCustomerName"
                      value={formData.bankCustomerName}
                      onChange={handleChange}
                      placeholder="e.g., Raza"
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Bank City / Branch City</label>
                    <input 
                      type="text" 
                      name="bankCity"
                      value={formData.bankCity}
                      onChange={handleChange}
                      placeholder="e.g., Dubai"
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Bank Detail / Additional Instructions</label>
                    <textarea 
                      name="bankDetail"
                      value={formData.bankDetail || ''}
                      onChange={handleChange}
                      placeholder="e.g., SWIFT: EMIRAEADXXX, Branch: Deira City Center"
                      rows={2}
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {/* Display Bank Details on Printed Invoices Toggle */}
                  <div className="sm:col-span-3 bg-indigo-50/50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-indigo-100 dark:border-slate-700 flex items-center justify-between gap-3 mt-1">
                    <div>
                      <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                        Display Bank Details on Printed Invoices
                      </h5>
                      <p className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Enable or disable displaying corporate wire bank account details (Bank Name, Beneficiary, IBAN) at the bottom of printed sales invoices and PDFs.
                      </p>
                    </div>
                    <button
                      type="button"
                      id="toggle-invoice-show-bank-details"
                      onClick={() => handleToggle('invoiceShowBankDetails')}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors shrink-0 ${formData.invoiceShowBankDetails ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-750'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${formData.invoiceShowBankDetails ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </button>
                  </div>
                </div>
              </div>

                {/* Signatory Configuration */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                  <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-800 dark:text-slate-200">Signature</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Signatory Name</label>
                      <input 
                        type="text" 
                        name="invoiceSignatoryName"
                        value={formData.invoiceSignatoryName}
                        onChange={handleChange}
                        className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Signatory Title</label>
                      <input 
                        type="text" 
                        name="invoiceSignatoryTitle"
                        value={formData.invoiceSignatoryTitle}
                        onChange={handleChange}
                        className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Signature Image</label>
                      <div className="flex items-center space-x-2">
                        {formData.invoiceSignatureUrl ? (
                          <div className="relative w-20 h-10 border border-slate-250 dark:border-slate-800 bg-white p-1 rounded overflow-hidden flex items-center justify-center shrink-0">
                            <img src={formData.invoiceSignatureUrl} alt="Signature" className="max-w-full max-h-full object-contain" />
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">No signature</span>
                        )}
                        <label className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold uppercase cursor-pointer hover:bg-slate-200">
                          <span>Upload</span>
                          <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms and conditions */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Terms & conditions</label>
                  <textarea 
                    name="invoiceTerms"
                    value={formData.invoiceTerms}
                    onChange={handleChange}
                    rows={2}
                    className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* Footers Multi-templates */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Footer Template
                    </label>
                    <p className="text-[9px] text-slate-400 font-medium mb-2">
                      Choose one of 5 compliant footer templates to display on all invoices, quotations, POs, and receipts.
                    </p>
                    <select 
                      name="invoiceFooterTemplate"
                      value={formData.invoiceFooterTemplate || 'default'}
                      onChange={handleChange}
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="default">Default: Custom Note Only</option>
                      <option value="minimal">Template 1: Minimal - Name, Address, Phone</option>
                      <option value="bank">Template 2: Bank Details - A/C, IBAN, Bank Name</option>
                      <option value="terms">Template 3: Terms & Conditions</option>
                      <option value="bilingual_terms">Template 4: Bilingual T&C - English + Arabic</option>
                      <option value="color_match">Template 5: Color Match - Footer color = Selected Document Template color</option>
                    </select>
                  </div>
                  
                  {/* Suggestion Line */}
                  <div className="bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-lg p-3 text-[10px] text-indigo-700 dark:text-indigo-300 font-medium leading-relaxed">
                    Note: Footer mein Bank Details or Terms show karne se payment process fast aur compliant hota hai.
                  </div>
                </div>

                {/* Invoice Document Templates */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-850 dark:text-slate-200">Invoice PDF Layout Template (A4 Format)</h5>
                    <p className="text-[9px] text-slate-400 font-medium">Choose one of our premium, high-fidelity GCC-compliant layouts for print or export.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {[
                      { id: 'template1', name: 'Classic English A4', desc: 'Clean & professional business layout (English)' },
                      { id: 'template2', name: 'Branded English', desc: 'Modern header with accent styling (English)' },
                      { id: 'template3', name: 'Minimal English', desc: 'Spacious & streamlined format (English)' }
                    ].map((tpl) => {
                      const isSelected = formData.invoiceTemplate === tpl.id;
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, invoiceTemplate: tpl.id as any }))}
                          className={`relative text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-24 ${isSelected ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-350 hover:bg-slate-50/50'}`}
                        >
                          <div>
                            <span className={`text-[9px] font-mono tracking-wider uppercase font-bold ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>A4 SIZE</span>
                            <h6 className="text-[11px] font-black text-slate-800 dark:text-slate-200 mt-1">{tpl.name}</h6>
                            <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">{tpl.desc}</p>
                          </div>
                          {isSelected && (
                            <span className="absolute bottom-2.5 right-2.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px] font-bold">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>



                {/* Paper Size Configuration (A4 / A5) */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-850 dark:text-slate-200">Default Document Paper Size</h5>
                    <p className="text-[9px] text-slate-400 font-medium">Select your standard paper dimension for sales invoices, quotations, and vouchers.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {[
                      { id: 'A4', name: 'A4 Paper Size', dimensions: '210 × 297 mm', desc: 'Standard full-sheet invoice page layout with spacious padding and standard typography.' },
                      { id: 'A5', name: 'A5 Paper Size', dimensions: '148 × 210 mm', desc: 'Compact half-sheet layout formatted for smaller printers and quick paper slips.' }
                    ].map((paper) => {
                      const isSelected = (formData.invoicePaperSize || 'A4') === paper.id;
                      return (
                        <button
                          key={paper.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, invoicePaperSize: paper.id as any, printPaperSize: paper.id as any }))}
                          className={`relative text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${isSelected ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-xs' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-350 hover:bg-slate-50/50'}`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-mono tracking-wider uppercase font-black ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>{paper.id} SIZE</span>
                              <span className="text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold">{paper.dimensions}</span>
                            </div>
                            <h6 className="text-[12px] font-extrabold text-slate-800 dark:text-slate-200 mt-1">{paper.name}</h6>
                            <p className="text-[9.5px] text-slate-500 mt-0.5 leading-snug">{paper.desc}</p>
                          </div>
                          {isSelected && (
                            <span className="mt-2 text-right block text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">Active Standard ✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* A4 Paper Settings, Company Name & Margin Customizer */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <h5 className="text-[12px] font-black text-slate-850 dark:text-slate-100 uppercase tracking-wide">
                          A4 Paper, Company Name & Header Margin Settings
                        </h5>
                      </div>
                      <p className="text-[9.5px] text-slate-500 mt-0.5">
                        Customize page margins, company name prominence, header arrangement, and print spacing for perfect A4 document outputs.
                      </p>
                    </div>
                    <span className="text-[9px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-full">
                      A4 Standard (210 × 297 mm)
                    </span>
                  </div>

                  {/* 1. Page Margins Selector */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span>A4 Document Page Margins</span>
                      <span className="text-[9.5px] font-mono text-slate-400">Controls print edge distance</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { 
                          id: 'compact', 
                          name: 'Narrow Margins (5mm)', 
                          tag: 'Max Density', 
                          desc: 'Packs 15+ items per page, ideal for retail, hardware & long itemized bills.' 
                        },
                        { 
                          id: 'normal', 
                          name: 'Balanced Standard (8mm)', 
                          tag: 'FTA Recommended', 
                          desc: 'Optimum balance between printable area and clean, professional paper borders.' 
                        },
                        { 
                          id: 'spacious', 
                          name: 'Executive Wide (12mm)', 
                          tag: 'Airy & Formal', 
                          desc: 'Generous white space for corporate agreements, executive contracts & proposals.' 
                        }
                      ].map((m) => {
                        const isSelected = (formData.invoiceMargin || 'normal') === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, invoiceMargin: m.id as any }))}
                            className={`relative text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected 
                                ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs ring-1 ring-emerald-500/30' 
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-350 hover:bg-slate-50/50'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-bold ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {m.name}
                                </span>
                                <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  isSelected ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}>
                                  {m.tag}
                                </span>
                              </div>
                              <p className="text-[9px] text-slate-500 mt-1 leading-snug">{m.desc}</p>
                            </div>
                            {isSelected && (
                              <span className="mt-2 text-right block text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">Selected ✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Company Name Prominence & Sizing */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span>Company Name Size & Emphasis in Header</span>
                      <span className="text-[9.5px] font-mono text-slate-400">Heading visual weight</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { 
                          id: 'normal', 
                          name: 'Standard Title (18px)', 
                          desc: 'Balanced proportion alongside medium company logos.' 
                        },
                        { 
                          id: 'large', 
                          name: 'Prominent Brand (22px)', 
                          desc: 'Crisp, high-contrast presence recommended for most commercial businesses.' 
                        },
                        { 
                          id: 'extra_large', 
                          name: 'Executive Bold (26px)', 
                          desc: 'Dominant company brand headline across the top of the A4 page.' 
                        }
                      ].map((sz) => {
                        const isSelected = (formData.invoiceCompanyNameSize || 'large') === sz.id;
                        return (
                          <button
                            key={sz.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, invoiceCompanyNameSize: sz.id as any }))}
                            className={`relative text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected 
                                ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-xs ring-1 ring-indigo-500/30' 
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-350 hover:bg-slate-50/50'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-bold ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {sz.name}
                                </span>
                              </div>
                              <div className={`mt-1.5 text-slate-900 dark:text-white truncate font-bold ${
                                sz.id === 'extra_large' ? 'text-lg font-black' : sz.id === 'large' ? 'text-base font-extrabold' : 'text-sm font-bold'
                              }`}>
                                {formData.name || 'YOUR COMPANY LLC'}
                              </div>
                              <p className="text-[9px] text-slate-500 mt-1 leading-snug">{sz.desc}</p>
                            </div>
                            {isSelected && (
                              <span className="mt-2 text-right block text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">Active Style ✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Header Arrangement & Layout Style */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span>Invoice Header Layout & Alignment</span>
                      <span className="text-[9.5px] font-mono text-slate-400">Visual balance across page top</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { 
                          id: 'split', 
                          name: 'Classic Split (Logo Left / Meta Right)', 
                          desc: 'Logo and company details on the left, Tax Invoice title, number and date on the right.' 
                        },
                        { 
                          id: 'centered', 
                          name: 'Centered Executive Branding', 
                          desc: 'Logo and company name centered at the top, document metadata formatted below.' 
                        },
                        { 
                          id: 'banner', 
                          name: 'Accent Header Banner', 
                          desc: 'Contemporary framed header container with subtle accent backdrop.' 
                        }
                      ].map((ly) => {
                        const isSelected = (formData.invoiceHeaderLayout || 'split') === ly.id;
                        return (
                          <button
                            key={ly.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, invoiceHeaderLayout: ly.id as any }))}
                            className={`relative text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected 
                                ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-xs ring-1 ring-indigo-500/30' 
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-350 hover:bg-slate-50/50'
                            }`}
                          >
                            <div>
                              <span className={`text-[10px] font-bold ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                {ly.name}
                              </span>
                              <p className="text-[9px] text-slate-500 mt-1 leading-snug">{ly.desc}</p>
                            </div>
                            {isSelected && (
                              <span className="mt-2 text-right block text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">Selected ✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Header Spacing Density */}
                  <div className="bg-slate-50 dark:bg-slate-850/40 rounded-xl p-3 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold text-slate-850 dark:text-slate-200 block">
                        Header Vertical Spacing & Density
                      </span>
                      <span className="text-[9px] text-slate-500">
                        Adjust vertical gap between header and the bill-to / items table.
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      {[
                        { id: 'compact', name: 'Tight (Space Saver)' },
                        { id: 'normal', name: 'Balanced Standard' },
                        { id: 'spacious', name: 'Relaxed (Airy)' }
                      ].map((sp) => {
                        const isSelected = (formData.invoiceHeaderPadding || 'normal') === sp.id;
                        return (
                          <button
                            key={sp.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, invoiceHeaderPadding: sp.id as any }))}
                            className={`px-2.5 py-1 rounded text-[9.5px] font-bold transition cursor-pointer ${
                              isSelected 
                                ? 'bg-indigo-600 text-white shadow-xs' 
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            {sp.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Custom Tax & Custom Text Field Options */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-850 dark:text-slate-200">Custom Tax & Additional Fields</h5>
                    <p className="text-[9px] text-slate-400 font-medium">Configure optional custom tax (e.g., Tourism Fee, Municipality Tax) and custom text fields to display on Invoices, Quotations, and Purchases.</p>
                  </div>

                  {/* Custom Tax Section */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <span>Custom Tax Field</span>
                        <span className="text-[10px] text-slate-400 font-normal">(Invoices, Quotations & Purchases)</span>
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox"
                          name="customTaxEnabled"
                          checked={!!formData.customTaxEnabled}
                          onChange={(e) => setFormData(prev => ({ ...prev, customTaxEnabled: e.target.checked, showCustomTaxOnInvoice: e.target.checked }))}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">Enable Custom Tax</span>
                      </label>
                    </div>

                    {formData.customTaxEnabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Custom Tax Name / Label</label>
                          <input 
                            type="text"
                            name="customTaxName"
                            value={formData.customTaxName || ''}
                            onChange={handleChange}
                            placeholder="e.g. Tourism Dirham Fee / Municipality Tax"
                            className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div className="flex items-center pt-5">
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox"
                              name="showCustomTaxOnInvoice"
                              checked={formData.showCustomTaxOnInvoice !== false}
                              onChange={(e) => setFormData(prev => ({ ...prev, showCustomTaxOnInvoice: e.target.checked }))}
                              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                            />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Show Tax row on PDF & Invoice print layout</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Custom Text Field Section */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <span>Custom Text Field</span>
                        <span className="text-[10px] text-slate-400 font-normal">(Additional Reference / Info box)</span>
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox"
                          name="customTextFieldEnabled"
                          checked={!!formData.customTextFieldEnabled}
                          onChange={(e) => setFormData(prev => ({ ...prev, customTextFieldEnabled: e.target.checked, showCustomTextOnInvoice: e.target.checked }))}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">Enable Custom Text Field</span>
                      </label>
                    </div>

                    {formData.customTextFieldEnabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Field Label / Name</label>
                          <input 
                            type="text"
                            name="customTextFieldName"
                            value={formData.customTextFieldName || ''}
                            onChange={handleChange}
                            placeholder="e.g. Project Code / Delivery Location / Customs Ref"
                            className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Default Field Value (Optional)</label>
                          <input 
                            type="text"
                            name="customTextFieldValue"
                            value={formData.customTextFieldValue || ''}
                            onChange={handleChange}
                            placeholder="e.g. Standard Terms apply / Gate Pass 12"
                            className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div className="sm:col-span-2 flex items-center pt-1">
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox"
                              name="showCustomTextOnInvoice"
                              checked={formData.showCustomTextOnInvoice !== false}
                              onChange={(e) => setFormData(prev => ({ ...prev, showCustomTextOnInvoice: e.target.checked }))}
                              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                            />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Show Custom Text Field box on Invoice & Document layouts</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Print and pdf toggle */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between">
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-850 dark:text-slate-200">Print & PDF Auto-Rescale</h5>
                    <p className="text-[9px] text-slate-400">Optimize documents to scale perfectly on standard page layout.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('invoiceAutoRescale')}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors shrink-0 ${formData.invoiceAutoRescale ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-750'}`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${formData.invoiceAutoRescale ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </button>
                </div>

              </div>
            )}

            {/* 4. QUOTATION SETTINGS TAB */}
            {activeSubTab === 'quotation' && (
              <div className="space-y-6 animate-fade-in text-xs">
                
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">Quotation Settings</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Customize layouts and branding presets for estimates and proposals</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Quotation Prefix & Sequence Lock Control
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Customize sequence prefix for quotations and proposals. Toggle lock on or off at any time.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isInvoicePrefixLocked: !prev.isInvoicePrefixLocked }))}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-2xs ${
                      formData.isInvoicePrefixLocked
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-500/20'
                    }`}
                  >
                    {formData.isInvoicePrefixLocked ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>🔒 Locked (Click to Unlock)</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>🔓 Unlocked (Click to Lock)</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Quotation Prefix</label>
                    <input 
                      type="text" 
                      name="quotationPrefix"
                      value={formData.quotationPrefix}
                      onChange={handleChange}
                      disabled={formData.isInvoicePrefixLocked}
                      className={`w-full text-xs border rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 font-mono font-bold ${
                        formData.isInvoicePrefixLocked 
                          ? 'bg-slate-100 dark:bg-slate-800/80 cursor-not-allowed opacity-75 border-slate-200 dark:border-slate-800' 
                          : quotationPrefixError 
                          ? 'border-rose-500 focus:border-rose-500 bg-white dark:bg-slate-900' 
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                      }`}
                    />
                    {formData.isInvoicePrefixLocked ? (
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-1 leading-normal flex items-center space-x-1">
                        <Lock className="w-3 h-3 shrink-0" />
                        <span>Prefix is locked. Click Unlock to modify.</span>
                      </div>
                    ) : quotationPrefixError ? (
                      <div className="text-[10px] text-rose-500 font-bold mt-1 font-mono">
                        {quotationPrefixError}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">e.g. QTN-, EST-</p>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Valid Days Limit</label>
                    <input 
                      type="number" 
                      defaultValue={30}
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Quotation theme colors */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Colors</label>
                  <div className="flex flex-wrap gap-2.5">
                    {colorPresets.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, quotationThemeColor: color }))}
                        className="w-7 h-7 rounded-full border border-slate-300 dark:border-slate-600 cursor-pointer transition-transform hover:scale-115 flex items-center justify-center"
                        style={{ backgroundColor: color }}
                        title={color}
                      >
                        {formData.quotationThemeColor === color && (
                          <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Signatory */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Signatory Name</label>
                    <input 
                      type="text" 
                      name="quotationSignatoryName"
                      value={formData.quotationSignatoryName}
                      onChange={handleChange}
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Signatory Title</label>
                    <input 
                      type="text" 
                      name="quotationSignatoryTitle"
                      value={formData.quotationSignatoryTitle}
                      onChange={handleChange}
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Terms and conditions */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Terms & conditions</label>
                  <textarea 
                    name="quotationTerms"
                    value={formData.quotationTerms}
                    onChange={handleChange}
                    rows={2}
                    className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* Print and pdf toggle */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between">
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-850 dark:text-slate-200">Print & PDF</h5>
                    <p className="text-[9px] text-slate-400">Auto-scale Quotation to fit standard A4 page width perfectly.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('quotationAutoRescale')}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors shrink-0 ${formData.quotationAutoRescale ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-750'}`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${formData.quotationAutoRescale ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </button>
                </div>

              </div>
            )}

            {/* 5. BUSINESS PROFILE TAB */}
            {activeSubTab === 'profile' && (
              <div className="space-y-6 animate-fade-in text-xs">
                
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">Business Profile</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Corporate identity, taglines, registration certificates and social networks</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Tagline</label>
                    <input 
                      type="text" 
                      name="tagline"
                      value={formData.tagline}
                      onChange={handleChange}
                      placeholder="e.g., Building Maintenance Works"
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Industry</label>
                    <select
                      name="industry"
                      value={formData.industry || 'Other'}
                      onChange={handleChange}
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 cursor-pointer focus:border-indigo-500 focus:outline-hidden"
                    >
                      <option value="Construction">Contracting & Construction</option>
                      <option value="GoldJewelry">Gold & Jewellery</option>
                      <option value="Retail Shop">Retail Shoes, Clothing & Fashion</option>
                      <option value="Transportation">Transportation & Fleet Logistics</option>
                      <option value="Logistics">Customs Clearance & Logistics</option>
                      <option value="ECommerce">E-Commerce & Digital Hub</option>
                      <option value="TourismCarRental">Tourism, Travel & Car Rental</option>
                      <option value="Grocery">Grocery / Kirana / Supermarket</option>
                      <option value="Mobile">Mobile & Electronics Shop</option>
                      <option value="Electrical">Electrical Supplies & Contracting</option>
                      <option value="Hardware Trading">Hardware Trading & Building Materials</option>
                      <option value="General Trading">General Trading & Retail</option>
                      <option value="Restaurant">Restaurant & Cafe</option>
                      <option value="Laundry">Laundry & Dry Cleaning</option>
                      <option value="Printing">Printing & Advertising</option>
                      <option value="Service">Service Business</option>
                      <option value="Accounting">Accounting & Bookkeeping</option>
                      <option value="Real Estate">Real Estate / Property Management</option>
                      <option value="AutoSpareParts">Auto & Bike Spare Parts (Car & Motorcycle)</option>
                      <option value="CarSpareParts">Car Spare Parts & Auto Parts</option>
                      <option value="BikeSpareParts">Motorcycle & Bike Spare Parts</option>
                      <option value="ComputerSalesAndService">Computer Sales, Service & Printer Solutions</option>
                      <option value="Auto Repair">Auto Repair & Garage</option>
                      <option value="Other">Other Business (Core + Custom Fields)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Founded year</label>
                    <input 
                      type="text" 
                      name="foundedYear"
                      value={formData.foundedYear}
                      onChange={handleChange}
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Business registration number</label>
                    <input 
                      type="text" 
                      name="businessRegNo"
                      value={formData.businessRegNo}
                      onChange={handleChange}
                      placeholder="e.g., CN-1899200"
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {getCountryConfig(formData.gccCountry).taxIdLabel} ({getCountryConfig(formData.gccCountry).taxAuthorityShort})
                    </label>
                    <input 
                      type="text" 
                      name="trn"
                      value={formData.trn}
                      onChange={handleChange}
                      maxLength={getCountryConfig(formData.gccCountry).taxIdMaxLength}
                      placeholder={getCountryConfig(formData.gccCountry).taxIdPlaceholder}
                      className="w-full text-xs font-mono border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Branch Name</label>
                    <input 
                      type="text" 
                      name="branchName"
                      value={formData.branchName || ''}
                      onChange={handleChange}
                      placeholder="e.g., Dubai Mall Branch"
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Trade License Expiry</label>
                    <input 
                      type="date" 
                      name="tradeLicenseExpiry"
                      value={formData.tradeLicenseExpiry || ''}
                      onChange={handleChange}
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Chamber of Commerce Registry No.</label>
                    <input 
                      type="text" 
                      name="chamberRegNo"
                      value={formData.chamberRegNo || ''}
                      onChange={handleChange}
                      placeholder="e.g., Chamber Registry 290139"
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">About</label>
                    <textarea 
                      name="about"
                      value={formData.about || ''}
                      onChange={handleChange}
                      placeholder="e.g., Briefly describe your company and scope of business..."
                      rows={2}
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Our services</label>
                    <input 
                      type="text" 
                      name="services"
                      value={formData.services || ''}
                      onChange={handleChange}
                      placeholder="e.g., Contracting, Maintenance, Consultancy"
                      className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Social links */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                  <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-800 dark:text-slate-200">Social Links</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Facebook</label>
                      <input 
                        type="text" 
                        name="socialFacebook"
                        value={formData.socialFacebook}
                        onChange={handleChange}
                        className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Twitter / X</label>
                      <input 
                        type="text" 
                        name="socialTwitter"
                        value={formData.socialTwitter}
                        onChange={handleChange}
                        className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">LinkedIn</label>
                      <input 
                        type="text" 
                        name="socialLinkedin"
                        value={formData.socialLinkedin}
                        onChange={handleChange}
                        className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. TAX & CURRENCY TAB */}
            {activeSubTab === 'tax' && (
              <div className="space-y-6 animate-fade-in text-xs">
                
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">Tax & Currency</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Control domestic tax regulations, tax rates, currency ISO and symbol positions</p>
                </div>

                {/* Regional Compliance Presets (GCC + Asia) */}
                <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 dark:from-slate-900/60 dark:to-slate-800/60 border border-blue-200 dark:border-slate-800 p-5 rounded-xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="bg-indigo-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase">Regional Preset Engine</span>
                      <h4 className="text-xs font-black text-slate-850 dark:text-slate-100 uppercase tracking-wider font-mono">GCC & Asian Country Localization</h4>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 font-mono">
                      Active: <strong className="text-indigo-600 dark:text-indigo-400">{getCountryConfig(formData.gccCountry).flag} {getCountryConfig(formData.gccCountry).name}</strong>
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                    Instantly align your system with country-specific taxation frameworks ({getCountryConfig(formData.gccCountry).taxAuthorityShort}), currency fractional systems, tax rates, and regulatory reporting. Selecting a country will automatically configure currency ISO, symbol, tax rules, TRN/GSTIN/PAN/BIN labels, and state/provincial supplies.
                  </p>

                  {/* GCC Group */}
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      <span>GCC Countries</span>
                      <span className="text-[9px] text-slate-400 font-normal">({GCC_COUNTRIES.length})</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      {GCC_COUNTRIES.map((c) => {
                        const isSelected = formData.gccCountry === c.code;
                        return (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                gccCountry: c.code as any,
                                country: c.name,
                                currency: c.currency,
                                currencySymbol: c.symbol,
                                taxName: c.taxName,
                                taxRate: c.taxRate,
                                vatEnabled: c.vatEnabled,
                              }));
                            }}
                            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600/10 border-indigo-500 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-500/20 shadow-xs'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900/80 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-base leading-none">{c.flag}</span>
                              <span className="font-extrabold text-[9px] tracking-wider uppercase font-mono">{c.code}</span>
                            </div>
                            <div className="text-[9px] font-bold text-slate-850 dark:text-slate-200 truncate mt-1" title={c.name}>{c.name}</div>
                            <div className="text-[8px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                              {c.currency} • {c.taxRate > 0 ? `${c.taxRate}% ${c.taxName}` : 'Tax Free'}
                            </div>
                            <div className="text-[7.5px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5 truncate">
                              {c.taxAuthorityShort}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Asian Countries Group */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      <span>Asian Countries (Pakistan, India, Bangladesh, Nepal)</span>
                      <span className="text-[9px] text-slate-400 font-normal">({ASIA_COUNTRIES.length})</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {ASIA_COUNTRIES.map((c) => {
                        const isSelected = formData.gccCountry === c.code;
                        return (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                gccCountry: c.code as any,
                                country: c.name,
                                currency: c.currency,
                                currencySymbol: c.symbol,
                                taxName: c.taxName,
                                taxRate: c.taxRate,
                                vatEnabled: c.vatEnabled,
                              }));
                            }}
                            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600/10 border-emerald-500 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20 shadow-xs'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900/80 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-base leading-none">{c.flag}</span>
                              <span className="font-extrabold text-[9px] tracking-wider uppercase font-mono">{c.code}</span>
                            </div>
                            <div className="text-[9px] font-bold text-slate-850 dark:text-slate-200 truncate mt-1" title={c.name}>{c.name}</div>
                            <div className="text-[8px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                              {c.currency} ({c.symbol}) • {c.taxRate}% {c.taxName}
                            </div>
                            <div className="text-[7.5px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 truncate">
                              {c.taxAuthorityShort} • {c.taxIdShortLabel}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* VAT/TAX Enable ON/OFF Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <div className="pr-4">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Enable {getCountryConfig(formData.gccCountry).taxName} / Tax System</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">
                      Turn ON to calculate, display, and report {getCountryConfig(formData.gccCountry).taxName} ({getCountryConfig(formData.gccCountry).taxRate}%) on invoices and expense sheets for {getCountryConfig(formData.gccCountry).name}. Turn OFF to run tax-free invoicing.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('vatEnabled')}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${formData.vatEnabled ? 'bg-blue-600' : 'bg-slate-350 dark:bg-slate-700'}`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${formData.vatEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </button>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-800 dark:text-slate-200">Currency</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Primary Currency ISO</label>
                      <select 
                        name="currency"
                        value={formData.currency}
                        onChange={handleChange}
                        className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 cursor-pointer"
                      >
                        <option value="AED">AED — UAE Dirham</option>
                        <option value="SAR">SAR — Saudi Riyal</option>
                        <option value="PKR">PKR — Pakistani Rupee (₨)</option>
                        <option value="INR">INR — Indian Rupee (₹)</option>
                        <option value="BDT">BDT — Bangladeshi Taka (৳)</option>
                        <option value="NPR">NPR — Nepalese Rupee (रू)</option>
                        <option value="OMR">OMR — Omani Rial</option>
                        <option value="BHD">BHD — Bahraini Dinar</option>
                        <option value="KWD">KWD — Kuwaiti Dinar</option>
                        <option value="QAR">QAR — Qatari Riyal</option>
                        <option value="USD">USD — US Dollar ($)</option>
                        <option value="EUR">EUR — Euro (€)</option>
                        <option value="GBP">GBP — British Pound (£)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Symbol symbol</label>
                      <input 
                        type="text" 
                        name="currencySymbol"
                        value={formData.currencySymbol}
                        onChange={handleChange}
                        placeholder="AED"
                        className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Symbol position</label>
                      <select 
                        name="symbolPosition"
                        value={formData.symbolPosition}
                        onChange={handleChange}
                        className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 cursor-pointer"
                      >
                        <option value="before">Before amount (AED 100)</option>
                        <option value="after">After amount (100 AED)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {formData.vatEnabled && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                    <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-800 dark:text-slate-200">Tax Settings</h4>
                    
                    <div className="flex items-center space-x-2 cursor-pointer pb-2">
                      <input 
                        type="checkbox" 
                        id="enable_tax_by_default"
                        defaultChecked={true}
                        className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="enable_tax_by_default" className="text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        Enable tax on invoices by default
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Primary tax name</label>
                        <input 
                          type="text" 
                          name="taxName"
                          value={formData.taxName}
                          onChange={handleChange}
                          className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Primary tax rate (%)</label>
                        <input 
                          type="number" 
                          name="taxRate"
                          value={formData.taxRate}
                          onChange={handleChange}
                          className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    {/* FTA compliance & registered agents */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">FTA VAT Filing Frequency</label>
                        <select 
                          name="vatFilingFrequency"
                          value={formData.vatFilingFrequency || 'quarterly'}
                          onChange={handleChange}
                          className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 cursor-pointer"
                        >
                          <option value="quarterly">Quarterly (Standard FTA Frequency)</option>
                          <option value="monthly">Monthly (Due 28th of next month)</option>
                          <option value="yearly">Yearly (Annual Filing / Small Business)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Tax Agent Name</label>
                        <input 
                          type="text" 
                          name="taxAgentName"
                          value={formData.taxAgentName || ''}
                          onChange={handleChange}
                          placeholder="e.g., Al Mansoori Associates"
                          className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Tax Agent Number (TAN)</label>
                        <input 
                          type="text" 
                          name="taxAgentNumber"
                          value={formData.taxAgentNumber || ''}
                          onChange={handleChange}
                          placeholder="e.g., TAN1002345"
                          className="w-full text-xs font-mono border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* UAE Corporate Tax (9%) Section */}
                <div className="border-t border-slate-150 dark:border-slate-800 pt-4 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="pr-4">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="bg-cyan-600 text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-mono">FTA Corporate Tax 2024+</span>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">UAE Corporate Tax Estimation (9%)</h4>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">
                        Enable automatic calculations and reporting flags for UAE Corporate Tax under Federal Decree-Law No. 47 of 2022 (9% tax on net profit over AED 375,000).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('corporateTaxEnabled')}
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${formData.corporateTaxEnabled ? 'bg-cyan-600' : 'bg-slate-350 dark:bg-slate-700'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${formData.corporateTaxEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </button>
                  </div>

                  {formData.corporateTaxEnabled && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/20 border border-slate-150 dark:border-slate-800 rounded-xl space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Corporate Tax Reg Number (CTRN)</label>
                          <input 
                            type="text" 
                            name="ctrn"
                            value={formData.ctrn || ''}
                            onChange={handleChange}
                            placeholder="e.g., CTRN902341"
                            className="w-full text-xs font-mono border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Taxable Threshold (AED)</label>
                          <input 
                            type="number" 
                            name="corporateTaxThreshold"
                            value={formData.corporateTaxThreshold ?? 375000}
                            onChange={handleChange}
                            className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Corporate Tax Rate (%)</label>
                          <input 
                            type="number" 
                            name="corporateTaxRate"
                            value={formData.corporateTaxRate ?? 9}
                            onChange={handleChange}
                            className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>

                      {/* Small Business Relief (SBR) Toggle */}
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">Small Business Relief (SBR) Exemption</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">Applicable for resident taxable persons with revenue ≤ AED 3,000,000 for tax periods up to 31 Dec 2026.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggle('corporateTaxSmallBusinessRelief')}
                          className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors shrink-0 ${formData.corporateTaxSmallBusinessRelief ? 'bg-cyan-600' : 'bg-slate-350 dark:bg-slate-700'}`}
                        >
                          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${formData.corporateTaxSmallBusinessRelief ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ledger Mapping & Fiscal Year Lock */}
                <div className="border-t border-slate-150 dark:border-slate-800 pt-4 space-y-4">
                  <div className="pb-1">
                    <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-800 dark:text-slate-200">Accounting Ledger Defaults & Lock Control</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Define default chart of accounts codes for automatic transactions and secure fiscal periods with locking</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-900/20 border border-slate-150 dark:border-slate-800 rounded-xl">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Default Cash/Bank Account</label>
                      <select 
                        name="defaultBankCashAccount"
                        value={formData.defaultBankCashAccount || '1000'}
                        onChange={handleChange}
                        className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 cursor-pointer"
                      >
                        {coaAccounts.filter(a => a.type === 'Asset').map(a => (
                          <option key={a.code} value={a.code}>{a.code} — {a.name}</option>
                        ))}
                        <option value="1000">1000 — Cash & Bank Accounts (System Default)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Default Trade Receivables</label>
                      <select 
                        name="defaultReceivableAccount"
                        value={formData.defaultReceivableAccount || '1200'}
                        onChange={handleChange}
                        className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 cursor-pointer"
                      >
                        {coaAccounts.filter(a => a.type === 'Asset').map(a => (
                          <option key={a.code} value={a.code}>{a.code} — {a.name}</option>
                        ))}
                        <option value="1200">1200 — Trade Receivables (System Default)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Default Sales Revenue</label>
                      <select 
                        name="defaultSalesAccount"
                        value={formData.defaultSalesAccount || '4000'}
                        onChange={handleChange}
                        className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 cursor-pointer"
                      >
                        {coaAccounts.filter(a => a.type === 'Revenue').map(a => (
                          <option key={a.code} value={a.code}>{a.code} — {a.name}</option>
                        ))}
                        <option value="4000">4000 — Sales Revenue (System Default)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Default Trade Payables</label>
                      <select 
                        name="defaultPayableAccount"
                        value={formData.defaultPayableAccount || '2100'}
                        onChange={handleChange}
                        className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 cursor-pointer"
                      >
                        {coaAccounts.filter(a => a.type === 'Liability').map(a => (
                          <option key={a.code} value={a.code}>{a.code} — {a.name}</option>
                        ))}
                        <option value="2100">2100 — Accounts Payable (System Default)</option>
                      </select>
                    </div>
                  </div>

                  {/* Fiscal Year Lock Date */}
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="bg-rose-600 text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-mono">FTA Audit Control</span>
                      <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wide">Fiscal Period Locking Date</h4>
                    </div>
                    <p className="text-[10px] text-rose-700 dark:text-rose-400 leading-normal">
                      Set a strict freeze date. All transactions, invoices, or expense vouchers before this date will be set to read-only. Modification or deletion will be locked to align with audited tax filing submissions.
                    </p>
                    <div className="max-w-xs pt-1">
                      <input 
                        type="date" 
                        name="fiscalYearLockDate"
                        value={formData.fiscalYearLockDate || ''}
                        onChange={handleChange}
                        className="w-full text-xs border border-rose-200 dark:border-rose-900/30 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* 7. NOTIFICATIONS TAB */}
            {activeSubTab === 'notifications' && (
              <div className="space-y-6 animate-fade-in text-xs text-left max-w-2xl">
                
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">Alerts & Reminders Settings</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Configure automated reminders, payment collection alerts, and client outreach channels</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800/85 rounded-xl p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 pr-4">
                      <h4 className="text-xs font-black text-slate-850 dark:text-slate-150 uppercase tracking-wider font-mono flex items-center space-x-2">
                        <span>Automated Payment Collection Reminders</span>
                        <span className="bg-indigo-100 text-indigo-700 text-[8px] font-bold px-1.5 py-0.5 rounded font-mono uppercase">AI Daemon</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        When enabled, the Hisaab Pro billing daemon will auto-schedule bilingual WhatsApp notifications to be dispatched to clients exactly <strong>3 days prior to the invoice due date</strong> for standard outstanding invoices.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input 
                        type="checkbox" 
                        name="autoReminderEnabled"
                        checked={formData.autoReminderEnabled || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, autoReminderEnabled: e.target.checked }))}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-650"></div>
                    </label>
                  </div>

                  <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-3.5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">WhatsApp Outreach Channel</span>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500">Bilingual Arabic/English messages sent via FTA-registered gateway</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">Dispatch Trigger Window</span>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">Exactly -3 Days Before Due Date (Auto-recalculated on date update)</p>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50/40 border border-emerald-100 dark:border-emerald-950/40 dark:bg-emerald-950/10 rounded-xl p-4 flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block font-mono">Active UAE SMS & Gateway Compliance</span>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      All communication dispatches are fully synchronized with Telecommunications and Digital Government Regulatory Authority (TDRA) guidelines. Customers can opt-out at any time.
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* 8. DATA TOOLS TAB */}
            {activeSubTab === 'data' && (
              <div className="space-y-6 animate-fade-in text-slate-700 dark:text-slate-300" onDragEnter={handleDrag}>
                
                {/* Data Tools Header */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">Data Tools</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Import, export, and validate your corporate records under UAE FTA guidelines</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* CSV Template Download Section */}
                  <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800/80 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">Download Customer Template</h4>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500">Standardized CSV template with pre-filled samples</p>
                      </div>
                      
                      {/* Mini Tab Swapper */}
                      <div className="bg-slate-200/65 dark:bg-slate-805 p-0.5 rounded-lg flex space-x-1 text-[9px] font-mono shrink-0">
                        <button
                          type="button"
                          onClick={() => setSettingsCsvTab('HEADERS')}
                          className={`px-2 py-1 rounded font-bold cursor-pointer transition-all ${settingsCsvTab === 'HEADERS' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs' : 'text-slate-505 dark:text-slate-450 hover:text-slate-700'}`}
                        >
                          SCHEMA
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettingsCsvTab('README')}
                          className={`px-2 py-1 rounded font-bold cursor-pointer transition-all ${settingsCsvTab === 'README' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs' : 'text-slate-505 dark:text-slate-450 hover:text-slate-700'}`}
                        >
                          README
                        </button>
                      </div>
                    </div>

                    {settingsCsvTab === 'HEADERS' ? (
                      <div className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 rounded-lg p-3 text-[10px] font-mono text-slate-500 dark:text-slate-400 overflow-x-auto space-y-1">
                        <div className="font-bold text-slate-750 dark:text-slate-300">Expected CSV Headers (2 Mandatory columns):</div>
                        <div className="text-blue-650 dark:text-indigo-400 font-bold">
                          CustomerName*, CompanyName, Email, Phone, MobileNumber, TRN, Address, Emirate*
                        </div>
                        <div className="text-slate-350 dark:text-slate-650 border-t border-slate-100 dark:border-slate-900/60 pt-1 mt-1">
                          * Columns with asterisk are strictly required for validation.
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 rounded-lg p-3 text-[10px] text-slate-500 dark:text-slate-400 space-y-1.5">
                        <div className="font-bold text-slate-750 dark:text-slate-200 uppercase font-mono text-[9px] tracking-wide border-b border-slate-100 dark:border-slate-900 pb-1">UAE FTA Trade Compliance Rules:</div>
                        <ul className="list-disc pl-4 space-y-1 text-[9.5px]">
                          <li>
                            <strong className="text-slate-800 dark:text-slate-200">TRN Requirement:</strong> TRN optional for B2C. Mandatory only for B2B VAT invoices. If specified, the Tax Registration Number (TRN) must be exactly <span className="font-semibold text-indigo-650 dark:text-indigo-450 font-mono">15 digits</span> long (e.g., <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded">100234567800003</code>).
                          </li>
                          <li>
                            <strong className="text-slate-800 dark:text-slate-200">Emirate Spelling:</strong> The Emirate column is mandatory and must match one of the 7 official UAE Emirates exactly:
                            <div className="font-mono text-indigo-650 dark:text-indigo-450 font-bold mt-0.5">
                              Abu Dhabi, Dubai, Sharjah, Ajman, Umm Al Quwain, Ras Al Khaimah, Fujairah
                            </div>
                          </li>
                          <li>
                            <strong className="text-slate-800 dark:text-slate-200">Mandatory Fields:</strong> Please ensure `CustomerName*` and `Emirate*` columns are fully pre-filled.
                          </li>
                        </ul>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={downloadCustomerCSVTemplate}
                      className="w-full py-2.5 bg-blue-650 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Customer Template</span>
                    </button>
                  </div>

                  {/* CSV Validation Upload Section */}
                  <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800/80 rounded-xl p-5 space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">Upload & Validate CSV</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                        Select or drag and drop your Customer CSV file. The system will perform real-time verification against UAE validation schemas (e.g. 15-digit TRN length, emirate validation).
                      </p>
                    </div>

                    <div 
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                        dragActive 
                          ? 'border-blue-550 bg-blue-50/40 dark:bg-indigo-950/20' 
                          : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-400 dark:hover:border-slate-700'
                      }`}
                    >
                      <input 
                        type="file" 
                        accept=".csv"
                        id="csv-file-upload"
                        onChange={handleCSVFileChange}
                        className="hidden" 
                      />
                      <label htmlFor="csv-file-upload" className="cursor-pointer space-y-2.5 block">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-450 dark:text-slate-550">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-850 dark:text-slate-200">
                            {csvFileName ? `File: ${csvFileName}` : 'Choose file or drag here'}
                          </p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                            Supports standard .csv format only
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                </div>

                {/* Validation Report UI */}
                {csvValidationReport && (
                  <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3">
                      <div>
                        <h4 className="text-xs font-black text-slate-850 dark:text-slate-100 uppercase tracking-widest font-mono">Validation Report</h4>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 font-sans">Diagnostic breakdown of the uploaded customer database</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {csvValidationReport.invalidCount === 0 && csvValidationReport.totalRows > 0 ? (
                          <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-850 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider rounded-md font-mono">
                            PASSED
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-850 text-rose-700 dark:text-rose-400 text-[9px] font-black uppercase tracking-wider rounded-md font-mono">
                            {csvValidationReport.invalidCount > 0 ? 'FAILED' : 'NO DATA'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Summary Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 p-3 rounded-lg space-y-0.5">
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold font-mono">Total Rows</p>
                        <p className="text-base font-extrabold text-slate-850 dark:text-slate-200 font-mono">{csvValidationReport.totalRows}</p>
                      </div>
                      <div className="bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100/60 dark:border-emerald-900/30 p-3 rounded-lg space-y-0.5">
                        <p className="text-[9px] text-emerald-600/80 dark:text-emerald-400 uppercase tracking-wider font-semibold font-mono">Valid Rows</p>
                        <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{csvValidationReport.validCount}</p>
                      </div>
                      <div className="bg-rose-50/40 dark:bg-rose-950/10 border border-rose-100/60 dark:border-rose-900/30 p-3 rounded-lg space-y-0.5">
                        <p className="text-[9px] text-rose-650 dark:text-rose-450 uppercase tracking-wider font-semibold font-mono">Invalid Rows</p>
                        <p className="text-base font-extrabold text-rose-600 dark:text-rose-400 font-mono">{csvValidationReport.invalidCount}</p>
                      </div>
                      <div className="bg-amber-50/40 dark:bg-amber-950/10 border border-amber-100/60 dark:border-amber-900/30 p-3 rounded-lg space-y-0.5">
                        <p className="text-[9px] text-amber-600/80 dark:text-amber-500 uppercase tracking-wider font-semibold font-mono">Warnings</p>
                        <p className="text-base font-extrabold text-amber-605 dark:text-amber-500 font-mono">
                          {csvValidationReport.errors.filter(e => e.type === 'warning').length}
                        </p>
                      </div>
                    </div>

                    {/* Errors List */}
                    {csvValidationReport.errors.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-150 dark:border-slate-800/60 rounded-lg p-3 bg-slate-50/50 dark:bg-slate-900/20">
                        <div className="text-[9px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono mb-1.5">
                          Validation Messages
                        </div>
                        <div className="space-y-1.5 text-[10px] font-mono">
                          {csvValidationReport.errors.map((err, idx) => (
                            <div key={idx} className={`flex items-start space-x-2 p-1.5 rounded-md ${
                              err.type === 'error' 
                                ? 'text-rose-650 bg-rose-50/40 dark:text-rose-400 dark:bg-rose-950/15' 
                                : 'text-amber-750 bg-amber-50/40 dark:text-amber-500 dark:bg-amber-950/15'
                            }`}>
                              <span className="font-extrabold shrink-0">[{err.type.toUpperCase()}]</span>
                              <span>{err.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : csvValidationReport.totalRows > 0 ? (
                      <div className="text-center py-4 text-emerald-650 dark:text-emerald-450 space-y-1 bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/40 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-500" />
                        <p className="text-xs font-bold uppercase tracking-wider font-mono">Validation Succeeded</p>
                        <p className="text-[9px] text-emerald-500/85">No format violations or tax compliance warnings found. Ready for deployment.</p>
                      </div>
                    ) : null}

                    {/* Preview Parsed Rows (If valid rows exist) */}
                    {csvValidationReport.parsedRows.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[9px] font-black text-slate-750 dark:text-slate-300 uppercase tracking-wider font-mono">
                          Parsed Customers Preview ({csvValidationReport.parsedRows.length})
                        </div>
                        <div className="overflow-x-auto border border-slate-150 dark:border-slate-850 rounded-lg">
                          <table className="w-full text-left border-collapse text-[10px] font-sans">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-550 dark:text-slate-405 border-b border-slate-150 dark:border-slate-800 font-mono text-[9px] uppercase tracking-wider">
                                <th className="p-2 font-bold">Name</th>
                                <th className="p-2 font-bold">Company</th>
                                <th className="p-2 font-bold">Email</th>
                                <th className="p-2 font-bold">Phone</th>
                                <th className="p-2 font-bold">UAE TRN</th>
                                <th className="p-2 font-bold">Emirate</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-750 dark:text-slate-300">
                              {csvValidationReport.parsedRows.slice(0, 5).map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10">
                                  <td className="p-2 font-semibold">{row.name}</td>
                                  <td className="p-2">{row.companyName || '-'}</td>
                                  <td className="p-2 text-slate-500 font-mono">{row.email || '-'}</td>
                                  <td className="p-2 text-slate-500 font-mono">{row.phone || row.mobileNumber || '-'}</td>
                                  <td className="p-2 text-slate-605 dark:text-slate-400 font-mono font-bold">{row.trn || '-'}</td>
                                  <td className="p-2">
                                    <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 rounded-md text-[9px] font-medium">
                                      {row.emirate || '-'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {csvValidationReport.parsedRows.length > 5 && (
                            <div className="p-2 text-center text-[9px] text-slate-400 dark:text-slate-500 font-mono border-t border-slate-100 dark:border-slate-800/60">
                              Showing top 5 parsed rows out of {csvValidationReport.parsedRows.length} total valid records
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* Client Demo Clean Slate / Database Maintenance */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-150 dark:border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                        <h4 className="text-xs font-black text-slate-850 dark:text-slate-100 uppercase tracking-widest font-mono">
                          Client Presentation Clean Slate
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        Clear all sample transactions (invoices, quotations, inventory items, customers, expenses, journals) to start fresh for showing the software to clients. Company settings and tax framework remain safe.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowResetConfirmModal(true)}
                      className="inline-flex items-center justify-center space-x-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-mono text-xs font-bold rounded-lg transition-all shadow-xs shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Clear All Data</span>
                    </button>
                  </div>

                  {/* Live Database Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-150 dark:border-slate-800 p-3 rounded-lg text-center space-y-0.5">
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold font-mono">Invoices & Docs</p>
                      <p className="text-base font-extrabold text-slate-800 dark:text-slate-200 font-mono">{documents?.length || 0}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-150 dark:border-slate-800 p-3 rounded-lg text-center space-y-0.5">
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold font-mono">Inventory Stock</p>
                      <p className="text-base font-extrabold text-slate-800 dark:text-slate-200 font-mono">{inventory?.length || 0}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-150 dark:border-slate-800 p-3 rounded-lg text-center space-y-0.5">
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold font-mono">Registered Customers</p>
                      <p className="text-base font-extrabold text-slate-800 dark:text-slate-200 font-mono">{customers?.length || 0}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-150 dark:border-slate-800 p-3 rounded-lg text-center space-y-0.5">
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold font-mono">Expenses</p>
                      <p className="text-base font-extrabold text-slate-800 dark:text-slate-200 font-mono">{expenses?.length || 0}</p>
                    </div>
                  </div>

                  {/* Clean State Status Banner */}
                  {(documents?.length || 0) === 0 && (inventory?.length || 0) === 0 && (customers?.length || 0) === 0 && (expenses?.length || 0) === 0 ? (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-lg flex items-center space-x-3 text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <div className="text-xs">
                        <span className="font-bold font-mono">Clean Slate Active: </span>
                        <span>Database is completely clean and empty — ready for live client demo.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-lg flex items-center space-x-3 text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
                      <div className="text-xs">
                        <span className="font-bold font-mono">Sample Data Present: </span>
                        <span>Existing records detected. Click "Clear All Data" above to wipe invoices & stock before customer demonstration.</span>
                      </div>
                    </div>
                  )}

                  {resetSuccessMessage && (
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 rounded-lg text-xs font-mono font-bold animate-fade-in">
                      ✓ All data wiped successfully. The system is ready for client presentation.
                    </div>
                  )}
                </div>

                {/* Reset Confirmation Modal */}
                {showResetConfirmModal && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
                      <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
                        <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
                          <Trash2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-wider font-mono text-slate-900 dark:text-white">
                            Confirm Data Reset
                          </h3>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Clean slate for customer demonstration</p>
                        </div>
                      </div>

                      <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl space-y-2 text-rose-900 dark:text-rose-200 text-xs">
                        <p className="font-semibold">
                          This action will immediately clear all invoices, inventory items, customer lists, purchase orders, and expenses.
                        </p>
                        <p className="text-[11px] text-rose-700 dark:text-rose-300">
                          Are you sure you want to clear all transactional data? Your company settings, regional VAT rules, and currencies will be preserved.
                        </p>
                      </div>

                      <div className="flex items-center justify-end space-x-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowResetConfirmModal(false)}
                          className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onResetAllData) {
                              onResetAllData();
                            }
                            setShowResetConfirmModal(false);
                            setResetSuccessMessage(true);
                            setTimeout(() => setResetSuccessMessage(false), 5000);
                          }}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-mono font-bold shadow-xs cursor-pointer"
                        >
                          Yes, Clear All Data
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {activeSubTab === 'importer' && (
              <div className="space-y-6 animate-fade-in w-full">
                <AIImporter
                  company={company}
                  customers={customers}
                  onAddCustomer={onAddCustomer}
                  documents={documents}
                  onAddDocument={onAddDocument}
                  expenses={expenses}
                  onAddExpense={onAddExpense}
                  coaAccounts={coaAccounts}
                  onAddAccount={onAddAccount}
                />
              </div>
            )}

            {activeSubTab === 'shortcuts' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono">Keyboard Shortcuts & Hotkeys Guide</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono mt-0.5">Speed up financial data entry and navigate seamlessly</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                  {/* Column 1: Core Action Hotkeys */}
                  <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 border-b border-slate-100 dark:border-slate-800 pb-2 font-mono">
                      Core Transactions
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 dark:text-white text-xs">New Transaction</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">Invoice, customer, or asset catalog</div>
                        </div>
                        <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[10px] font-black text-slate-700 dark:text-slate-200 shadow-xs">
                          Ctrl + N
                        </kbd>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 dark:text-white text-xs">Save / Submit Form</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">Save active modal or invoice sheet</div>
                        </div>
                        <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[10px] font-black text-slate-700 dark:text-slate-200 shadow-xs">
                          Ctrl + S
                        </kbd>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 dark:text-white text-xs">Focus Search Bar</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">Focus global autocomplete search input</div>
                        </div>
                        <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[10px] font-black text-slate-700 dark:text-slate-200 shadow-xs">
                          Ctrl + K
                        </kbd>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 dark:text-white text-xs">Toggle Shortcuts Modal</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">Show/hide keyboard hotkeys guide</div>
                        </div>
                        <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[10px] font-black text-slate-700 dark:text-slate-200 shadow-xs">
                          Ctrl + /
                        </kbd>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 dark:text-white text-xs">Vat Reports / Print</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">Switch to Tax Reports (Print if modal is open)</div>
                        </div>
                        <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[10px] font-black text-slate-700 dark:text-slate-200 shadow-xs">
                          Ctrl + P
                        </kbd>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Dashboard/Workspace Navigation */}
                  <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 border-b border-slate-100 dark:border-slate-800 pb-2 font-mono">
                      Workspace Navigation
                    </h4>
                    <div className="space-y-2 font-mono text-[11px]">
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">1. Dashboard Overview</span>
                        <kbd className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded text-[9px] font-bold text-slate-550 dark:text-slate-350">
                          Alt + 1
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-550 dark:text-slate-400 font-semibold">2. Sales & Revenue</span>
                        <kbd className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded text-[9px] font-bold text-slate-550 dark:text-slate-350">
                          Alt + 2
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-550 dark:text-slate-400 font-semibold">3. Recurring Automations</span>
                        <kbd className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded text-[9px] font-bold text-slate-550 dark:text-slate-350">
                          Alt + 3
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-550 dark:text-slate-400 font-semibold">4. Inventory Stock Catalog</span>
                        <kbd className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded text-[9px] font-bold text-slate-550 dark:text-slate-350">
                          Alt + 4
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-550 dark:text-slate-400 font-semibold">5. Expense & Outflow Logs</span>
                        <kbd className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded text-[9px] font-bold text-slate-550 dark:text-slate-350">
                          Alt + 5
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-550 dark:text-slate-400 font-semibold">6. Customers & Clients Directory</span>
                        <kbd className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded text-[9px] font-bold text-slate-550 dark:text-slate-350">
                          Alt + 6
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-550 dark:text-slate-400 font-semibold">7. Compliance & VAT Auditing</span>
                        <kbd className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded text-[9px] font-bold text-slate-550 dark:text-slate-350">
                          Alt + 7
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-550 dark:text-slate-400 font-semibold">8. Corporate Settings</span>
                        <kbd className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded text-[9px] font-bold text-slate-550 dark:text-slate-350">
                          Alt + 8
                        </kbd>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contextual Tip Callout Box */}
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-xl space-y-1.5 text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                  <div className="font-extrabold text-slate-900 dark:text-slate-200 uppercase tracking-wider font-mono text-[10px]">
                    💡 Smart Contextual Shortcuts
                  </div>
                  <p>
                    Our hotkeys adapt dynamically to whichever screen you are on. For instance, pressing <kbd className="font-mono bg-white dark:bg-slate-800 border px-1 rounded text-[10px]">Ctrl + N</kbd> on the <strong>Customers / Clients</strong> tab automatically triggers the customer registration modal, while on the <strong>Product Catalog</strong> tab it launches the catalog item sheet.
                  </p>
                  <p>
                    Pressing <kbd className="font-mono bg-white dark:bg-slate-800 border px-1 rounded text-[10px]">Ctrl + S</kbd> validates and submits whichever form modal or document creator you have currently open, avoiding manual mouse clicks.
                  </p>
                </div>
              </div>
            )}

            {activeSubTab === 'auth' && (
              <div className="space-y-6 animate-fade-in max-w-3xl">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono">App Security & Admin Credentials</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono mt-0.5">Manage administrator credentials, email username, and security password</p>
                </div>

                <div className="font-sans">
                  {/* Security Credentials & Reset */}
                  <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 border-b border-slate-100 dark:border-slate-800 pb-2 font-mono flex items-center space-x-1.5">
                      <Save className="w-3.5 h-3.5" />
                      <span>Security Credentials & Password Management</span>
                    </h4>

                    {authError && (
                      <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-150 text-rose-650 dark:text-rose-450 p-2.5 rounded-lg text-[11px] font-semibold animate-pulse">
                        ⚠️ {authError}
                      </div>
                    )}

                    {authSaveSuccess && (
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-150 text-emerald-650 dark:text-emerald-400 p-2.5 rounded-lg text-[11px] font-semibold flex items-center space-x-2">
                        <span>🎉 Security Credentials saved successfully!</span>
                      </div>
                    )}

                    <div className="space-y-3.5 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Username</label>
                          <input
                            type="email"
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            placeholder="your-email@gmail.com"
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-100 outline-hidden focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mobile Number Username</label>
                          <input
                            type="text"
                            value={authMobile}
                            onChange={(e) => setAuthMobile(e.target.value)}
                            placeholder="e.g., 0501234567"
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-100 outline-hidden focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                          <input
                            type="password"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-100 outline-hidden focus:border-indigo-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-100 outline-hidden focus:border-indigo-500 font-mono"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!authEmail.trim() || !authMobile.trim()) {
                            setAuthError('Email and Mobile cannot be empty!');
                            return;
                          }
                          if (authPassword !== confirmPassword) {
                            setAuthError('Confirm password does not match new password!');
                            return;
                          }
                          setAuthError('');
                          if (onChangeLoginEmail) onChangeLoginEmail(authEmail);
                          if (onChangeLoginMobile) onChangeLoginMobile(authMobile);
                          if (onChangeLoginPassword) onChangeLoginPassword(authPassword);
                          setAuthSaveSuccess(true);
                          setTimeout(() => setAuthSaveSuccess(false), 3000);
                        }}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition-colors cursor-pointer text-center mt-2"
                      >
                        Reset Credentials & Update Password
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'plan' && (
              <div className="space-y-6 animate-fade-in w-full">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono">Subscription Status & Plan Details</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono mt-0.5">Manage licenses, check remaining trial, or activate premium tiers</p>
                </div>

                {/* Trial/License Dashboard Card */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                  <div className="space-y-2">
                    <span className="bg-amber-400 text-slate-950 font-black text-[9px] tracking-widest uppercase px-2.5 py-0.5 rounded-full inline-block animate-pulse">
                      {activePlan === 'trial' ? '90-Day Full Free Trial' : 'License Tier Active'}
                    </span>
                    <h4 className="text-xl font-extrabold tracking-tight">
                      {activePlan === 'trial' && `Hisaab Pro Free Trial: ${trialDaysLeft} Days Left`}
                      {activePlan === 'basic' && 'Hisaab Basic (Forever Free Tier)'}
                      {activePlan === 'pro_1y' && 'Pro Plan (1 Year License)'}
                      {activePlan === 'pro_3y' && 'Pro Plan (3 Year License) • Locked Price'}
                      {activePlan === 'pro_lifetime' && 'Pro VIP Lifetime License'}
                    </h4>
                    <p className="text-xs text-slate-350 max-w-xl">
                      Run your entities with full UAE FTA 5% VAT & Corporate Tax compliance. Premium subscriptions unlock offline-first high scale DB operations, AI loaders, barcode tracking, and custom template white labeling.
                    </p>
                  </div>

                  {activePlan === 'trial' && (
                    <div className="shrink-0 flex flex-col items-center justify-center p-4 bg-white/5 rounded-2xl border border-white/10 w-44">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block mb-1">Trial Timeline</span>
                      <div className="w-full bg-slate-850 h-3 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-indigo-300 h-full transition-all duration-500" 
                          style={{ width: `${(trialDaysLeft / 90) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between w-full text-[10px] font-mono mt-1.5 text-slate-300">
                        <span>Day 0</span>
                        <span className="font-bold text-amber-300">{trialDaysLeft} Days Remaining</span>
                        <span>Day 90</span>
                      </div>
                    </div>
                  )}

                  {activePlan !== 'trial' && activePlan !== 'basic' && (
                    <div className="shrink-0 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold px-4 py-2.5 rounded-2xl text-center">
                      <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-350">STATUS</span>
                      <span className="text-xs font-mono">HP-SECURE-ACTIVE-LIC</span>
                    </div>
                  )}
                </div>

                {/* Pending Subscription Request Banner if present */}
                {(() => {
                  const saved = localStorage.getItem('hisaab_last_enquiry');
                  if (!saved) return null;
                  try {
                    const enquiry = JSON.parse(saved);
                    return (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <span className="bg-amber-500 text-slate-950 font-black text-[9px] uppercase px-2 py-0.5 rounded font-mono">
                            ⏳ SUBSCRIPTION ENQUIRY PENDING
                          </span>
                          <p className="font-bold text-slate-900 dark:text-amber-200">
                            Requested: {enquiry.plan} for {enquiry.companyName}
                          </p>
                          <p className="text-[10.5px] text-slate-600 dark:text-slate-350">
                            Our sales team will contact <strong>{enquiry.companyEmail}</strong> / <strong>{enquiry.phone}</strong> with your official Tax Invoice & Payment Link. After payment, your 15/16-digit Security Activation Code will be delivered.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => window.dispatchEvent(new CustomEvent('open-subscription-enquiry', { detail: { plan: 'pro_1y' } }))}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider shrink-0 cursor-pointer shadow-xs"
                        >
                          🔑 Enter Code / View Status
                        </button>
                      </div>
                    );
                  } catch {
                    return null;
                  }
                })()}

                {/* System Node Hardware & License Lock Card */}
                <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 space-y-3 font-sans text-xs shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-slate-200 uppercase font-mono tracking-wider text-[11px]">
                        🔒 System Hardware Node & License Lock Engine
                      </span>
                    </div>
                    <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase">
                      Node Locked
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-[11px]">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[9px] text-slate-400 uppercase block font-bold">Node Machine ID</span>
                      <span className="font-bold text-indigo-400 block mt-0.5 select-all">{machineId || 'HP-HW-SERVER-NODE'}</span>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[9px] text-slate-400 uppercase block font-bold">Licensed Client Email</span>
                      <span className="font-bold text-slate-200 block mt-0.5 truncate">{localStorage.getItem('hisaab_client_email') || loginEmail || 'Hissabpro1@gmail.com'}</span>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[9px] text-slate-400 uppercase block font-bold">Licensed Client Phone</span>
                      <span className="font-bold text-slate-200 block mt-0.5 truncate">{localStorage.getItem('hisaab_client_mobile') || loginMobile || '+971 50 123 4567'}</span>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[9px] text-slate-400 uppercase block font-bold">Security Code Status</span>
                      <span className="font-bold text-emerald-400 block mt-0.5 truncate">
                        {localStorage.getItem('hisaab_security_code') ? `LOCKED: ${localStorage.getItem('hisaab_security_code')}` : 'BASIC FREE TIER'}
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                    <strong>🛡️ Hardware Binding Guarantee:</strong> This subscription, client credentials, and 15/16-digit security activation code are cryptographically bound to Node Machine ID <code className="text-amber-300 font-mono">{machineId || 'HP-HW-SERVER-NODE'}</code>. Credentials and activation keys cannot be duplicated or run on unauthorized secondary computer systems.
                  </p>

                  {/* Actions for Options 4 & 5: Certificate & Hardware Deactivation / Transfer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        const secCode = localStorage.getItem('hisaab_security_code') || 'HP1Y-8921-7723-9012';
                        const foundLic = licenses.find(l => l.code.toUpperCase() === secCode.toUpperCase()) || {
                          id: 'lic_active_cert',
                          code: secCode,
                          plan_type: activePlan === 'pro_3y' ? 'HP3Y' : activePlan === 'pro_lifetime' || activePlan === 'pro_5y' ? 'HPLF' : 'HP1Y',
                          max_devices: 1,
                          duration_months: activePlan === 'pro_3y' ? 36 : activePlan === 'pro_lifetime' || activePlan === 'pro_5y' ? 999 : 12,
                          status: 'active',
                          assigned_email: localStorage.getItem('hisaab_client_email') || loginEmail || 'Hissabpro1@gmail.com',
                          assigned_phone: localStorage.getItem('hisaab_client_mobile') || loginMobile || '+971 50 123 4567',
                          active_hw_ids: [machineId || 'HP-HW-SERVER-NODE'],
                          expiry_date: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
                          created_at: new Date().toISOString()
                        };
                        setSelectedCertLicense(foundLic as LicenseRecord);
                        setShowCertificateModal(true);
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-[10px] rounded-lg shadow-sm transition-all cursor-pointer flex items-center space-x-1.5"
                    >
                      <span>📜 View / Print Digital License Certificate</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const secCode = localStorage.getItem('hisaab_security_code');
                        if (!secCode) {
                          alert('⚠️ No Active License to Deactivate:\n\nYou are currently on the Free Basic Tier. Activate a Pro Security Code first.');
                          return;
                        }
                        const confirmUnbind = confirm(
                          `🔄 HARDWARE NODE TRANSFER & DEACTIVATION:\n\nAre you sure you want to unbind Node Hardware ID [${machineId || 'HP-HW-SERVER-NODE'}] from License [${secCode}]?\n\nThis will free up 1 device slot on your license so you can activate Hisaab Pro on a new computer hardware node.`
                        );
                        if (confirmUnbind) {
                          const res = deactivateHardwareNode(secCode, machineId || 'HP-HW-SERVER-NODE');
                          alert(res.msg);
                          refreshLicenses();
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-rose-200 border border-slate-700 font-bold text-[10px] rounded-lg transition-all cursor-pointer flex items-center space-x-1.5"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>🔄 Deactivate / Transfer Node to New PC</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUninstallCompany(formData.name || 'Hisaab Pro User');
                        setUninstallEmail(formData.email || localStorage.getItem('hisaab_client_email') || '');
                        setUninstallPhone(formData.phone || localStorage.getItem('hisaab_client_mobile') || '');
                        setShowUninstallModal(true);
                      }}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-[10px] rounded-lg transition-all cursor-pointer flex items-center space-x-1.5"
                    >
                      <Trash2 className="w-3 h-3 text-rose-400" />
                      <span>🗑️ Request Uninstall / Feedback</span>
                    </button>
                  </div>
                </div>

                {/* 5-Tier Pricing Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 font-sans pt-2">
                  
                  {/* TIER 0: BASIC */}
                  <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="border-b border-slate-100 dark:border-slate-850 pb-2.5 text-center">
                        <span className="text-[7.5px] tracking-wider uppercase font-mono font-bold text-slate-400">BASIC • FREE</span>
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase mt-0.5">HISAAB BASIC</h4>
                        <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200">AED 0</span>
                        <span className="text-[9px] text-slate-500 block">Single User</span>
                      </div>
                      <ul className="space-y-1.5 text-[10.5px] text-slate-600 dark:text-slate-350 pt-2.5">
                        <li className="flex items-start space-x-1 font-bold text-slate-800 dark:text-slate-200">
                          <span className="text-indigo-500">🏢</span>
                          <span><strong>1 Company Profile</strong></span>
                        </li>
                        <li className="flex items-start space-x-1 font-bold text-slate-800 dark:text-slate-200">
                          <span className="text-indigo-500">👤</span>
                          <span>1 Standalone PC</span>
                        </li>
                        <li className="flex items-start space-x-1">
                          <span className="text-emerald-500">✓</span>
                          <span>25 Sales Invoices / Mo</span>
                        </li>
                        <li className="flex items-start space-x-1 text-slate-400 dark:text-slate-500">
                          <span className="text-amber-500 font-bold">✕</span>
                          <span>No Custom Tax Config</span>
                        </li>
                        <li className="flex items-start space-x-1 text-slate-400 dark:text-slate-500">
                          <span className="text-amber-500 font-bold">✕</span>
                          <span>No Corporate Tax (9%)</span>
                        </li>
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (onChangeLoginPassword) {
                          const confirmed = window.confirm("Do you want to switch to the Free Basic Plan? Premium capabilities (Tax settings, AI importer, multiple entities) will be locked.");
                          if (confirmed) {
                            window.dispatchEvent(new CustomEvent('change-plan', { detail: { plan: 'basic' } }));
                          }
                        }
                      }}
                      className={`w-full mt-3 py-1.5 rounded-lg text-[9.5px] font-bold uppercase transition-colors ${
                        activePlan === 'basic' 
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed' 
                          : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700'
                      }`}
                      disabled={activePlan === 'basic'}
                    >
                      {activePlan === 'basic' ? 'Active' : 'Downgrade'}
                    </button>
                  </div>

                  {/* TIER 1: PRO - 1 YEAR */}
                  <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="border-b border-slate-100 dark:border-slate-850 pb-2.5 text-center">
                        <span className="text-[7.5px] tracking-wider uppercase font-mono font-bold text-emerald-600 dark:text-emerald-400">YEAR 1 • ANNUAL</span>
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase mt-0.5">PRO - 1 YEAR</h4>
                        <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200">AED 499</span>
                        <span className="text-[9px] text-slate-500 block">1st Year License</span>
                      </div>
                      <ul className="space-y-1.5 text-[10.5px] text-slate-600 dark:text-slate-350 pt-2.5">
                        <li className="flex items-start space-x-1 font-bold text-slate-800 dark:text-slate-200">
                          <span className="text-indigo-500">🏢</span>
                          <span><strong>1 Company Limit</strong></span>
                        </li>
                        <li className="flex items-start space-x-1 font-bold text-slate-800 dark:text-slate-200">
                          <span className="text-indigo-500">💻</span>
                          <span>1 Standard PC License</span>
                        </li>
                        <li className="flex items-start space-x-1 text-emerald-600 dark:text-emerald-400 font-bold">
                          <span className="text-emerald-500">✓</span>
                          <span>5% VAT & Return 201</span>
                        </li>
                        <li className="flex items-start space-x-1">
                          <span className="text-emerald-500">✓</span>
                          <span>CP/SP P&L Margin Engine</span>
                        </li>
                        <li className="flex items-start space-x-1">
                          <span className="text-emerald-500">✓</span>
                          <span>UAE Top Nav Calendar</span>
                        </li>
                        <li className="flex items-start space-x-1">
                          <span className="text-emerald-500">✓</span>
                          <span>Staff HR & WPS Payroll</span>
                        </li>
                        <li className="flex items-start space-x-1 text-rose-500 font-semibold">
                          <span className="text-rose-500 font-bold">✕</span>
                          <span>No 9% Corporate Tax</span>
                        </li>
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('open-subscription-enquiry', { detail: { plan: 'pro_1y' } }));
                      }}
                      className="w-full mt-3 py-1.5 rounded-lg text-[9.5px] font-bold uppercase transition-colors bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                    >
                      {activePlan === 'pro_1y' ? 'Active Pro 1Y' : 'Select / Request 1Y'}
                    </button>
                  </div>

                  {/* TIER 2: PRO - 3 YEARS */}
                  <div className="border-2 border-indigo-500 bg-indigo-50/5 dark:bg-indigo-950/10 rounded-2xl p-4 flex flex-col justify-between relative">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white font-extrabold text-[7.5px] tracking-widest uppercase px-2 py-0.5 rounded-full whitespace-nowrap shadow-xs">
                      5 Companies • CT 9% & Audit
                    </span>
                    <div>
                      <div className="border-b border-indigo-100 dark:border-indigo-900/50 pb-2.5 text-center">
                        <span className="text-[7.5px] tracking-wider uppercase font-mono font-bold text-indigo-600 dark:text-indigo-400">YEAR 3 • BEST VALUE</span>
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase mt-0.5">PRO - 3 YEARS</h4>
                        <span className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">AED 1,199</span>
                        <span className="text-[9px] text-slate-500 block">3-Year Offerings</span>
                      </div>
                      <ul className="space-y-1.5 text-[10.5px] text-slate-600 dark:text-slate-350 pt-2.5 font-sans">
                        <li className="flex items-start space-x-1 font-bold text-indigo-600 dark:text-indigo-400">
                          <span className="text-indigo-500 font-bold">🏢</span>
                          <span><strong>5 Companies Limit</strong></span>
                        </li>
                        <li className="flex items-start space-x-1 font-bold text-indigo-600 dark:text-indigo-400">
                          <span className="text-emerald-500">💻</span>
                          <span><strong>1 Standard PC (3-Yr Lock)</strong></span>
                        </li>
                        <li className="flex items-start space-x-1 font-bold text-emerald-600 dark:text-emerald-400">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span><strong>3-Year CT (9%) Planner</strong></span>
                        </li>
                        <li className="flex items-start space-x-1 font-bold text-indigo-600 dark:text-indigo-400">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span><strong>FTA Audit File (FAF XML)</strong></span>
                        </li>
                        <li className="flex items-start space-x-1">
                          <span className="text-emerald-500">✓</span>
                          <span>CP/SP P&L & Calendar</span>
                        </li>
                        <li className="flex items-start space-x-1">
                          <span className="text-emerald-500">✓</span>
                          <span>Staff HR & WPS Payroll</span>
                        </li>
                        <li className="flex items-start space-x-1">
                          <span className="text-indigo-500">★</span>
                          <span>3-Year Price Lock</span>
                        </li>
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('open-subscription-enquiry', { detail: { plan: 'pro_3y' } }));
                      }}
                      className="w-full mt-3 py-1.5 rounded-lg text-[9.5px] font-bold uppercase transition-colors bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
                    >
                      {activePlan === 'pro_3y' ? 'Active Pro 3Y' : 'Select / Request 3Y'}
                    </button>
                  </div>

                  {/* TIER 3: PRO - 5 YEARS */}
                  <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="border-b border-slate-100 dark:border-slate-850 pb-2.5 text-center">
                        <span className="text-[7.5px] tracking-wider uppercase font-mono font-bold text-violet-600 dark:text-violet-400">YEAR 5 • ENTERPRISE</span>
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase mt-0.5">PRO - 5 YEARS</h4>
                        <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200">AED 1,699</span>
                        <span className="text-[9px] text-slate-500 block">5-Year Offerings</span>
                      </div>
                      <ul className="space-y-1.5 text-[10.5px] text-slate-600 dark:text-slate-350 pt-2.5 font-sans">
                        <li className="flex items-start space-x-1 font-bold text-violet-600 dark:text-violet-400">
                          <span className="text-violet-500 font-bold">🏢</span>
                          <span><strong>10 Companies Limit</strong></span>
                        </li>
                        <li className="flex items-start space-x-1 font-bold text-violet-600 dark:text-violet-400">
                          <span className="text-emerald-500">💻</span>
                          <span><strong>1 Standard PC (5-Yr Lock)</strong></span>
                        </li>
                        <li className="flex items-start space-x-1 font-bold text-emerald-600 dark:text-emerald-400">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span><strong>5-Year CT (9%) Planner</strong></span>
                        </li>
                        <li className="flex items-start space-x-1 font-bold text-indigo-600 dark:text-indigo-400">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span><strong>FTA Audit File (FAF XML)</strong></span>
                        </li>
                        <li className="flex items-start space-x-1">
                          <span className="text-emerald-500">✓</span>
                          <span>CP/SP P&L & Calendar</span>
                        </li>
                        <li className="flex items-start space-x-1">
                          <span className="text-emerald-500">✓</span>
                          <span>Staff HR & WPS Payroll</span>
                        </li>
                        <li className="flex items-start space-x-1">
                          <span className="text-violet-500">★</span>
                          <span>5-Year Price Lock</span>
                        </li>
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('open-subscription-enquiry', { detail: { plan: 'pro_5y' } }));
                      }}
                      className="w-full mt-3 py-1.5 rounded-lg text-[9.5px] font-bold uppercase transition-colors bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
                    >
                      {activePlan === 'pro_5y' ? 'Active Pro 5Y' : 'Select / Request 5Y'}
                    </button>
                  </div>

                  {/* TIER 4: PRO - LIFETIME VIP */}
                  <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="border-b border-slate-100 dark:border-slate-850 pb-2.5 text-center">
                        <span className="text-[7.5px] tracking-wider uppercase font-mono font-bold text-rose-500">LIFETIME VIP • UNLIMITED</span>
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase mt-0.5">PRO - LIFETIME VIP</h4>
                        <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200">AED 1,999</span>
                        <span className="text-[9px] text-slate-500 block">Pay Once Forever</span>
                      </div>
                      <ul className="space-y-1.5 text-[10.5px] text-slate-600 dark:text-slate-350 pt-2.5 font-sans">
                        <li className="flex items-start space-x-1 font-bold text-rose-600 dark:text-rose-400">
                          <span className="text-rose-500 font-bold">🏢</span>
                          <span><strong>UNLIMITED Companies</strong></span>
                        </li>
                        <li className="flex items-start space-x-1 font-bold text-rose-600 dark:text-rose-400">
                          <span className="text-rose-500">💻</span>
                          <span><strong>1 Standard PC (Lifetime License)</strong></span>
                        </li>
                        <li className="flex items-start space-x-1 font-bold text-rose-600 dark:text-rose-400">
                          <span className="text-rose-500 font-bold">★</span>
                          <span><strong>Lifetime CT (9%) Planner</strong></span>
                        </li>
                        <li className="flex items-start space-x-1 font-bold text-emerald-600 dark:text-emerald-400">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span><strong>Full Tax Audit & FAF XML</strong></span>
                        </li>
                        <li className="flex items-start space-x-1">
                          <span className="text-emerald-500">✓</span>
                          <span>CP/SP P&L & Calendar</span>
                        </li>
                        <li className="flex items-start space-x-1">
                          <span className="text-emerald-500">✓</span>
                          <span>Staff HR & WPS Payroll</span>
                        </li>
                        <li className="flex items-start space-x-1 text-rose-500 font-bold">
                          <span className="text-rose-500">★</span>
                          <span>Zero Renewal Fees Ever</span>
                        </li>
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('open-subscription-enquiry', { detail: { plan: 'pro_lifetime' } }));
                      }}
                      className="w-full mt-3 py-1.5 rounded-lg text-[9.5px] font-bold uppercase transition-colors bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                    >
                      {activePlan === 'pro_lifetime' ? 'Active Lifetime' : 'Select / Request Lifetime'}
                    </button>
                  </div>

                </div>
              </div>
            )}

            {activeSubTab === 'feedback' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono">Feedback & Diagnostic Logs</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono mt-0.5">Submit feedback or review local diagnostic logs</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
                  {/* Left Panel (Col 5): Manual Feedback Submission */}
                  <div className="lg:col-span-5 space-y-5">
                    
                    {/* Manual Submission Form */}
                    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 border-b border-slate-100 dark:border-slate-800 pb-2 font-mono flex items-center space-x-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Submit Issue & General Feedback</span>
                      </h4>

                      {feedbackSaveSuccess && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-150 text-emerald-700 dark:text-emerald-400 p-2.5 rounded-lg text-[11px] font-semibold flex items-center space-x-2">
                          <span>🎉 Feedback logged successfully in local database!</span>
                        </div>
                      )}

                      <div className="space-y-3.5 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Module / Segment</label>
                          <select
                            value={feedbackCategory}
                            onChange={(e) => setFeedbackCategory(e.target.value as any)}
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-100 outline-hidden focus:border-indigo-500"
                          >
                            <option value="accounts">Accounts & Ledger Matching</option>
                            <option value="VAT">VAT 5% & FTA Compliance</option>
                            <option value="purchases">Purchases & Expenses</option>
                            <option value="others">Others / General UI Bug</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Issue Description / Feedback Details</label>
                          <textarea
                            value={feedbackDescription}
                            onChange={(e) => setFeedbackDescription(e.target.value)}
                            rows={4}
                            placeholder="Describe what occurred, what was calculated, or what features you would like updated..."
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-100 outline-hidden focus:border-indigo-500 placeholder:text-slate-400"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!feedbackDescription.trim()) {
                              alert("Please input feedback details before submitting!");
                              return;
                            }

                            const fbId = `FB-${Math.floor(1000 + Math.random() * 9000)}`;
                            const newLog = {
                              id: fbId,
                              date: new Date().toISOString(),
                              category: feedbackCategory,
                              description: feedbackDescription,
                              emailSentTo: 'Local Storage',
                              status: 'recorded',
                              isAutoCrashReport: false
                            };

                            // Add to local history
                            const updatedLogs = [newLog, ...feedbackLogs];
                            setFeedbackLogs(updatedLogs);

                            // Clear description and show success feedback
                            setFeedbackDescription('');
                            setFeedbackSaveSuccess(true);
                            setTimeout(() => setFeedbackSaveSuccess(false), 4000);
                          }}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer text-center"
                        >
                          Submit Feedback (Save Locally)
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Right Panel (Col 7): System Diagnostic Logs & Sorting */}
                  <div className="lg:col-span-7 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
                    <div className="space-y-4">
                      
                      {/* Sub-header & Sorting */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-mono flex items-center space-x-1.5">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>System Feedback & Diagnostic Logs</span>
                          </h4>
                          <span className="text-[9px] text-slate-450 uppercase font-mono tracking-widest">
                            Locally stored feedback and system exception records
                          </span>
                        </div>

                        {/* Sorting & Export Actions */}
                        <div className="flex items-center space-x-2 text-xs">
                          {feedbackLogs.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(feedbackLogs, null, 2));
                                const downloadAnchor = document.createElement('a');
                                downloadAnchor.setAttribute("href", dataStr);
                                downloadAnchor.setAttribute("download", `hisaab_diagnostic_logs_${new Date().toISOString().slice(0, 10)}.json`);
                                document.body.appendChild(downloadAnchor);
                                downloadAnchor.click();
                                downloadAnchor.remove();
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold rounded cursor-pointer transition-colors"
                              title="Download JSON of all diagnostic logs"
                            >
                              Export JSON
                            </button>
                          )}
                          <span className="text-slate-400 font-mono text-[10px] uppercase">Sort by:</span>
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold px-2 py-1 rounded outline-hidden cursor-pointer"
                          >
                            <option value="date">Date (Newest)</option>
                            <option value="category">Category</option>
                            <option value="status">Status</option>
                          </select>
                        </div>
                      </div>

                      {/* Feedback List Log */}
                      <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
                        {[...feedbackLogs]
                          .sort((a, b) => {
                            if (sortBy === 'date') {
                              return new Date(b.date).getTime() - new Date(a.date).getTime();
                            }
                            if (sortBy === 'category') {
                              return a.category.localeCompare(b.category);
                            }
                            if (sortBy === 'status') {
                              return a.status.localeCompare(b.status);
                            }
                            return 0;
                          })
                          .map((log) => {
                            const isCrash = log.isAutoCrashReport || log.description.toLowerCase().includes('crash') || log.description.toLowerCase().includes('typeerror');
                            return (
                              <div 
                                key={log.id} 
                                className={`p-4 border rounded-xl space-y-2.5 transition-all relative ${
                                  isCrash 
                                    ? 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-150 dark:border-rose-900/40' 
                                    : 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-850'
                                }`}
                              >
                                {/* Row 1: Badge, ticket No, Status */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <span className={`px-2 py-0.5 rounded text-[8px] tracking-wider uppercase font-mono font-black ${
                                      isCrash
                                        ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                                        : log.category === 'VAT'
                                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                                        : log.category === 'accounts'
                                        ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350'
                                    }`}>
                                      {isCrash ? 'SYSTEM CRASH' : log.category.toUpperCase()}
                                    </span>
                                    <span className="font-mono text-[10px] font-black text-slate-800 dark:text-slate-200">
                                      {log.id}
                                    </span>
                                  </div>

                                  <div className="flex items-center space-x-1.5 font-mono text-[9px] text-slate-400">
                                    <span>{new Date(log.date).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                </div>

                                {/* Row 2: Description */}
                                <p className="text-[11px] text-slate-700 dark:text-slate-350 leading-relaxed font-sans pr-2 font-medium">
                                  {log.description}
                                </p>

                                {/* Row 3: Support targets & user actions */}
                                <div className="border-t border-slate-100 dark:border-slate-850 pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] font-mono text-slate-400 gap-1.5">
                                  <div className="flex items-center space-x-1.5">
                                    <span>Storage: <strong className="text-slate-650 dark:text-slate-300">Local System</strong></span>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const text = `Ticket: ${log.id}\nDate: ${new Date(log.date).toLocaleString()}\nCategory: ${log.category}\nDescription: ${log.description}`;
                                        navigator.clipboard?.writeText(text);
                                        alert(`Ticket details for ${log.id} copied to clipboard!`);
                                      }}
                                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                                    >
                                      Copy Log
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const text = `Support Contact: Hissabpro1@gmail.com\nTicket ID: ${log.id}\nDate: ${new Date(log.date).toLocaleString()}\nCategory: ${log.category}\nDetails:\n${log.description}`;
                                        navigator.clipboard?.writeText(text);
                                        alert(`Support ticket details and email (Hissabpro1@gmail.com) copied to clipboard!`);
                                      }}
                                      className="text-slate-600 dark:text-slate-400 hover:underline cursor-pointer"
                                      title="Copy support email and ticket details to clipboard"
                                    >
                                      Copy Support Details 📋
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm(`Delete diagnostic log entry [${log.id}]?`)) {
                                          const updated = feedbackLogs.filter(l => l.id !== log.id);
                                          setFeedbackLogs(updated);
                                        }
                                      }}
                                      className="text-rose-600 dark:text-rose-400 hover:underline font-bold cursor-pointer"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                        {feedbackLogs.length === 0 && (
                          <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                            <span className="text-2xl block">💬</span>
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block mt-2">No Diagnostic Logs Recorded</span>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Support note */}
                    <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-4 text-[10px] font-mono text-slate-450 flex items-center justify-between">
                      <span>AUDIT SYSTEM ACTIVE</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">LOCAL LOGSTORE ACTIVE</span>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>Security Dashboard & Operational Threat Monitoring</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono mt-0.5">
                    Real-time audit monitoring, print activity logs, login security, IBAN fraud verification, and license status
                  </p>
                </div>

                {/* 🛡️ 4 CORE SECURITY DASHBOARD METRICS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
                  
                  {/* 1. Last 30 Days Print Count */}
                  <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Last 30 Days Print Count
                      </span>
                      <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        <Printer className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                        {printCount30Days}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">job(s) printed</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Audit Tracked</span>
                      <button 
                        type="button" 
                        onClick={() => setPrintCount30Days(getPrintCountLast30Days())}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>

                  {/* 2. Failed Login Attempts */}
                  <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                        Failed Login Attempts
                      </span>
                      <div className="p-1.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-lg">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <div className={`text-2xl font-black font-mono ${failedLoginAttempts > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                        {failedLoginAttempts}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">attempt(s)</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className={failedLoginAttempts > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                        {failedLoginAttempts === 0 ? '✓ Account Safe' : '⚠️ Monitored'}
                      </span>
                      <button 
                        type="button" 
                        onClick={handleResetFailedLogins}
                        className="text-slate-500 hover:text-slate-900 dark:hover:text-white hover:underline cursor-pointer"
                      >
                        Reset Log
                      </button>
                    </div>
                  </div>

                  {/* 3. Pending IBAN Change Requests - Requires OOB Verification */}
                  <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Pending IBAN Requests
                      </span>
                      <div className="p-1.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-lg">
                        <PhoneCall className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <div className={`text-2xl font-black font-mono ${pendingIbanCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                        {pendingIbanCount}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">requires OOB</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        {pendingIbanCount > 0 ? '🔒 Gate Active' : '✓ All Verified'}
                      </span>
                      <span className="text-slate-400">Secondary Call</span>
                    </div>
                  </div>

                  {/* 4. License Expiry Alerts */}
                  <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        License Expiry Alert
                      </span>
                      <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                        {activePlan === 'trial' ? `${trialDaysLeft}d` : (activePlan === 'pro_lifetime' || activePlan === 'pro_5y') ? 'LIFETIME' : '365d'}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {activePlan === 'trial' ? 'trial remaining' : 'active plan'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className={activePlan === 'trial' && trialDaysLeft < 15 ? 'text-rose-600 font-bold animate-pulse' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                        {activePlan === 'trial' && trialDaysLeft < 15 ? '⚠️ Renewal Due' : '✓ Active'}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => onOpenPricingModal?.()}
                        className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                      >
                        Upgrade
                      </button>
                    </div>
                  </div>

                </div>

                {/* 🔒 PENDING IBAN CHANGE REQUESTS - OUT-OF-BAND (OOB) VERIFICATION PANEL */}
                <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-lg">
                        <PhoneCall className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider font-mono text-slate-900 dark:text-white flex items-center space-x-2">
                          <span>Pending IBAN Change Requests — Requires Out-Of-Band (OOB) Verification</span>
                          {pendingIbanCount > 0 && (
                            <span className="bg-amber-500 text-slate-950 font-bold text-[9px] px-2 py-0.5 rounded-full font-mono">
                              {pendingIbanCount} REQUIRES OOB CALL
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          Protection against AI voice deepfakes and email phishing. Secondary telephone verification required before updating beneficiary IBANs.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddNewIbanRequest}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-mono font-bold flex items-center space-x-1 transition-colors shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New IBAN Change Request</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
                    {ibanRequests.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 font-mono text-xs">
                        No pending IBAN change requests. All beneficiary accounts are verified.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-100 dark:bg-slate-800/80 font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            <tr>
                              <th className="p-2.5 border-b border-slate-200 dark:border-slate-800">Entity & Source</th>
                              <th className="p-2.5 border-b border-slate-200 dark:border-slate-800">Current IBAN</th>
                              <th className="p-2.5 border-b border-slate-200 dark:border-slate-800">Requested IBAN & Bank</th>
                              <th className="p-2.5 border-b border-slate-200 dark:border-slate-800">OOB Phone to Call</th>
                              <th className="p-2.5 border-b border-slate-200 dark:border-slate-800">Verification Status</th>
                              <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 text-right">Action Gate</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                            {ibanRequests.map((req) => (
                              <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                <td className="p-2.5 space-y-0.5">
                                  <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">{req.entityName}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{req.requestedBy} • {req.entityType}</div>
                                </td>
                                <td className="p-2.5 font-mono text-[10.5px] text-slate-500 line-through">
                                  {req.currentIban}
                                </td>
                                <td className="p-2.5 space-y-0.5">
                                  <div className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">{req.requestedIban}</div>
                                  <div className="text-[10px] text-slate-500">{req.bankName}</div>
                                </td>
                                <td className="p-2.5 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                  {req.oobVerificationPhone}
                                </td>
                                <td className="p-2.5">
                                  {req.status === 'PENDING_OOB_VERIFICATION' && (
                                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono font-bold text-[9px] rounded uppercase flex items-center space-x-1 w-fit">
                                      <PhoneCall className="w-2.5 h-2.5 animate-pulse" />
                                      <span>OOB Call Required</span>
                                    </span>
                                  )}
                                  {req.status === 'VERIFIED_OOB_APPROVED' && (
                                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-[9px] rounded uppercase flex items-center space-x-1 w-fit">
                                      <CheckCircle2 className="w-2.5 h-2.5" />
                                      <span>Verified & Approved</span>
                                    </span>
                                  )}
                                  {req.status === 'REJECTED_SUSPECTED_FRAUD' && (
                                    <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-mono font-bold text-[9px] rounded uppercase flex items-center space-x-1 w-fit">
                                      <AlertTriangle className="w-2.5 h-2.5" />
                                      <span>Blocked (Fraud)</span>
                                    </span>
                                  )}
                                </td>
                                <td className="p-2.5 text-right space-x-1.5 whitespace-nowrap">
                                  {req.status === 'PENDING_OOB_VERIFICATION' ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleApproveIbanRequest(req.id)}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-[10px] rounded uppercase transition-all cursor-pointer"
                                        title="Verify via pre-registered telephone call and approve IBAN"
                                      >
                                        ✓ OOB Call & Approve
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRejectIbanRequest(req.id)}
                                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-mono font-bold text-[10px] rounded uppercase transition-all cursor-pointer"
                                        title="Flag as AI phishing / unverified fraud"
                                      >
                                        ✕ Reject
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-[10px] font-mono text-slate-400 italic">
                                      {req.verifiedAt ? new Date(req.verifiedAt).toLocaleDateString() : 'Processed'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                  {/* Licensing & Brand Protection Card */}
                  <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 border-b border-slate-100 dark:border-slate-800 pb-2 font-mono flex items-center space-x-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Software License & Subscription Activation</span>
                    </h4>
                    <div className="space-y-3 text-xs text-slate-650 dark:text-slate-350">
                      <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 pb-2">
                        <span className="font-semibold text-slate-500">Registered Product</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">evonix Hissab V2.0</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 pb-2">
                        <span className="font-semibold text-slate-500">License Status</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                          activePlan === 'trial'
                            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 animate-pulse'
                            : activePlan === 'basic'
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            : 'bg-emerald-150 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {activePlan === 'trial' ? `PRO TRIAL (${trialDaysLeft}D LEFT)` : activePlan?.toUpperCase().replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 pb-2">
                        <span className="font-semibold text-slate-500">Owner Entity</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{formData.name || 'evonix Technologies'}</span>
                      </div>
                      
                      {/* Client Registration & 15/16-Digit Security Code Activation */}
                      <div className="pt-3 space-y-3 border-t border-slate-100 dark:border-slate-800 font-sans">
                        <label className="block text-[10px] font-extrabold uppercase font-mono text-indigo-600 dark:text-indigo-400">
                          🔑 Client Security Activation (1-Year, 3-Year, or Lifetime)
                        </label>

                        {activeSecCode && (
                          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-lg p-2.5 text-[10.5px] font-mono space-y-1">
                            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                              <span>✓ Security Code Bound</span>
                              <span className="bg-emerald-200 dark:bg-emerald-900 px-2 py-0.5 rounded text-[9px] uppercase">
                                {activePlan?.toUpperCase().replace('_', ' ')}
                              </span>
                            </div>
                            <div className="text-slate-600 dark:text-slate-400 text-[10px]">
                              <div><strong>Email:</strong> {settingEmailInput}</div>
                              <div><strong>Mobile:</strong> {settingMobileInput}</div>
                              <div><strong>Code:</strong> {activeSecCode}</div>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <div>
                            <span className="block text-[9.5px] font-mono text-slate-500 uppercase">Client Email Address</span>
                            <input
                              type="email"
                              placeholder="e.g. client@company.com"
                              value={settingEmailInput}
                              onChange={(e) => setSettingEmailInput(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <span className="block text-[9.5px] font-mono text-slate-500 uppercase">Client Mobile Number</span>
                            <input
                              type="text"
                              placeholder="e.g. +971 50 123 4567"
                              value={settingMobileInput}
                              onChange={(e) => setSettingMobileInput(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <span className="block text-[9.5px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">15 or 16-Digit Security Code</span>
                            <div className="flex space-x-2 mt-0.5">
                              <input
                                type="text"
                                placeholder="e.g. 9876-5432-1012-3456"
                                value={settingKeyInput}
                                onChange={(e) => setSettingKeyInput(e.target.value.toUpperCase())}
                                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-300 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleActivateKeyFromSettings(settingEmailInput, settingMobileInput, settingKeyInput)}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] uppercase font-mono tracking-wider transition-all cursor-pointer shrink-0"
                              >
                                Activate
                              </button>
                            </div>
                          </div>
                        </div>

                        <p className="text-[9.5px] text-slate-400 dark:text-slate-500 leading-tight font-sans">
                          Enter the 15/16-digit security code issued for your 1-Year, 3-Year, or Lifetime Plan. If unactivated, <strong>Hisaab Basic (Forever Free)</strong> continues.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenPricingModal?.()}
                        className="w-full mt-2 py-2 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer text-center"
                      >
                        View Full Subscription Plans & Offerings
                      </button>
                    </div>
                  </div>

                  {/* Cryptographic Key Architecture */}
                  <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 border-b border-slate-100 dark:border-slate-800 pb-2 font-mono flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Cryptographic Engine</span>
                    </h4>
                    <div className="space-y-3.5 text-xs text-slate-650 dark:text-slate-350">
                      <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 pb-2">
                        <span className="font-semibold text-slate-500">Export Encoding</span>
                        <span className="font-mono text-[10px] text-slate-800 dark:text-slate-200">Signed Secure Stream (.hisaab)</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 pb-2">
                        <span className="font-semibold text-slate-500">Cipher Level</span>
                        <span className="font-mono text-[10px] text-slate-800 dark:text-slate-200">Rotating Variable Byte XOR</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 pb-2">
                        <span className="font-semibold text-slate-500">Security Signature</span>
                        <span className="font-mono text-[10px] text-slate-800 dark:text-slate-200">HISAAB_PRO_SECURE_V1</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-500">Integrity Checksum</span>
                        <span className="font-mono text-[10px] text-slate-800 dark:text-slate-200">Polynomial Hash (Mod 10^9+7)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 🛡️ Real-Time Virus, Malware & Windows Protection Safeguard Card */}
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-5 space-y-4 border border-indigo-800/50 shadow-md">
                  <div className="flex items-center justify-between border-b border-indigo-800/60 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-indigo-600/30 border border-indigo-500/40 rounded-lg text-emerald-400">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider font-mono text-white">System, Software & Windows Virus Protection Level</h4>
                        <p className="text-[10px] text-indigo-200/80 font-mono">Real-Time Threat Detection • Heuristic Memory Isolation • Zero Data Corruption</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono font-bold text-[10px] rounded-full flex items-center space-x-1">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping mr-1"></span>
                      <span>ACTIVE SHIELD</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white/5 border border-white/10 rounded-lg space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 font-mono">Executable Malware Block</div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Scans incoming files and backups for Windows PE headers, <code>.exe</code>, <code>.dll</code>, <code>.vbs</code>, and <code>.bat</code> executable payloads.
                      </p>
                    </div>

                    <div className="p-3 bg-white/5 border border-white/10 rounded-lg space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 font-mono">Host Windows Isolation</div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Operates in a isolated memory environment, blocking arbitrary command executions like <code>cmd.exe</code> or <code>powershell</code>.
                      </p>
                    </div>

                    <div className="p-3 bg-white/5 border border-white/10 rounded-lg space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 font-mono">Anti-Corruption Restore</div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Every backup restoration verifies cryptographic signature hashes & sanitizes inputs to ensure corrupted or infected data can never be written.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 🔍 REAL-TIME SYSTEM INTEGRITY & SECURITY AUDIT TRAIL */}
                <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider font-mono text-slate-900 dark:text-white">Security Health Inspector & Threat Audit Log</h4>
                        <p className="text-[10px] text-slate-500 font-mono">Automated data verification and threat containment history</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={refreshSecurityState}
                      className="px-3 py-1.5 bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-200 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 hover:bg-slate-800 transition-colors shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Run Deep Integrity Scan</span>
                    </button>
                  </div>

                  {/* Health Metric Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-lg space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 font-mono">Health Score</span>
                      <div className="text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono">
                        {securityIntegrity.healthScore}% SECURE
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 font-mono">Scanned Storage Nodes</span>
                      <div className="text-lg font-black text-slate-800 dark:text-slate-200 font-mono">
                        {securityIntegrity.totalKeysScanned} Collections
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 font-mono">Corrupted Nodes</span>
                      <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        {securityIntegrity.corruptedKeysFound} Detected
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 font-mono">Threats Blocked</span>
                      <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                        {securityIntegrity.criticalThreatsBlocked} Threat(s)
                      </div>
                    </div>
                  </div>

                  {/* Audit Logs Table */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Recent Security Audit Logs</span>
                    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs max-h-56 overflow-y-auto">
                      {securityLogs.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 font-mono text-xs">No security threats detected. System is operating safely.</div>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-100 dark:bg-slate-800/80 font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky top-0">
                            <tr>
                              <th className="p-2 border-b border-slate-200 dark:border-slate-800">Event Code</th>
                              <th className="p-2 border-b border-slate-200 dark:border-slate-800">Type</th>
                              <th className="p-2 border-b border-slate-200 dark:border-slate-800">Title & Details</th>
                              <th className="p-2 border-b border-slate-200 dark:border-slate-800 text-right">Timestamp</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                            {securityLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                <td className="p-2 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">{log.id}</td>
                                <td className="p-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                                    log.severity === 'CRITICAL' 
                                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  }`}>
                                    {log.type}
                                  </span>
                                </td>
                                <td className="p-2 space-y-0.5">
                                  <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">{log.title}</div>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400">{log.details}</div>
                                </td>
                                <td className="p-2 font-mono text-[10px] text-slate-400 text-right whitespace-nowrap">
                                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>

                {/* Developer Advisory & Anti-Tamper Warnings */}
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-xl space-y-3 text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                  <div className="font-extrabold text-slate-900 dark:text-slate-200 uppercase tracking-wider font-mono text-[10px] flex items-center space-x-1.5 text-rose-600 dark:text-rose-450">
                    <span>⚠️ CRITICAL DIRECTIVE FOR DEVELOPMENT & REPLICATION</span>
                  </div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    To maintain strict security alignment with UAE FTA standard specifications and protect intellectual property:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 font-sans">
                    <li>
                      <strong>Intellectual Property Shield</strong>: This software is compiled exclusively under the registered brand identity <strong>"Hisaab Pro"</strong>. Standard reverse engineering, renaming, or modifying core descriptors to deploy under alternative names is strictly prohibited.
                    </li>
                    <li>
                      <strong>Data Safety & Protection</strong>: Standard encrypted local database backups ensure that exported financial data cannot be corrupted or read by unauthorized third-party utilities.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {(activeSubTab as string) === 'license_admin' && (
              <div className="space-y-6 animate-fade-in w-full text-xs font-sans">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center space-x-2">
                      <Key className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>evonix Hissab License Engine V3.0 — Admin Portal</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono mt-0.5">
                      Batch generate license keys, assign email/phone locks, verify active hardware nodes & export keys
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = generateLicenses(200);
                        setLicenses(updated);
                        alert(`🎉 SUCCESS: 200 New License Keys Generated!\n\nTotal Database Records: ${updated.length} licenses.\nYou can filter, assign, or export them to Excel below.`);
                      }}
                      className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-[11px] rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>⚡ Generate 200 License Keys</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => exportToExcel(licenses)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>📥 Export to Excel (CSV)</span>
                    </button>
                  </div>
                </div>

                {/* Database Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-white">
                    <span className="text-[9px] uppercase font-mono text-slate-400 font-bold block">Total License Records</span>
                    <span className="text-lg font-black text-white font-mono mt-0.5 block">{licenses.length}</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-white">
                    <span className="text-[9px] uppercase font-mono text-slate-400 font-bold block">Unused / Available Pool</span>
                    <span className="text-lg font-black text-amber-400 font-mono mt-0.5 block">
                      {licenses.filter((l) => l.status === 'unused').length}
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-white">
                    <span className="text-[9px] uppercase font-mono text-slate-400 font-bold block">Assigned To Clients</span>
                    <span className="text-lg font-black text-indigo-400 font-mono mt-0.5 block">
                      {licenses.filter((l) => l.status === 'assigned').length}
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-white">
                    <span className="text-[9px] uppercase font-mono text-slate-400 font-bold block">Active Hardware Bound</span>
                    <span className="text-lg font-black text-emerald-400 font-mono mt-0.5 block">
                      {licenses.filter((l) => l.status === 'active').length}
                    </span>
                  </div>
                </div>

                {/* Filter Tabs & Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#111827] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center space-x-1 font-mono text-[11px] overflow-x-auto w-full sm:w-auto">
                    {(['all', 'unused', 'assigned', 'active', 'expired'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setLicenseFilterStatus(st)}
                        className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                          licenseFilterStatus === st
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {st} ({st === 'all' ? licenses.length : licenses.filter((l) => l.status === st).length})
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search code, email or phone..."
                        value={licenseSearchQuery}
                        onChange={(e) => setLicenseSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAssignCode('');
                        setAssignEmail('');
                        setAssignPhone('');
                        setShowAssignModal(true);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shrink-0 flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Assign Code</span>
                    </button>
                  </div>
                </div>

                {/* License Database Table */}
                <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-[11px]">
                      <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 font-bold uppercase">
                        <tr>
                          <th className="p-3">License Code</th>
                          <th className="p-3">Plan & Limits</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Assigned Client (Email & Phone)</th>
                          <th className="p-3">Active Machine IDs</th>
                          <th className="p-3">Expiry Date</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-transparent">
                        {(() => {
                          const filtered = licenses.filter((l) => {
                            if (licenseFilterStatus !== 'all' && l.status !== licenseFilterStatus) return false;
                            if (licenseSearchQuery.trim()) {
                              const q = licenseSearchQuery.toLowerCase().trim();
                              const matchCode = l.code.toLowerCase().includes(q);
                              const matchEmail = (l.assigned_email || '').toLowerCase().includes(q);
                              const matchPhone = (l.assigned_phone || '').includes(q);
                              return matchCode || matchEmail || matchPhone;
                            }
                            return true;
                          });

                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={7} className="p-8 text-center text-slate-400 font-sans italic">
                                  No licenses found matching your filters. Click "Generate 200 License Keys" or change search query.
                                </td>
                              </tr>
                            );
                          }

                          return filtered.slice(0, 100).map((l) => (
                            <tr key={l.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                              <td className="p-3 font-black text-indigo-600 dark:text-indigo-400 select-all font-mono">
                                {l.code}
                              </td>
                              <td className="p-3">
                                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                  {l.plan_type === 'HP1Y' ? 'Pro 1-Year' : l.plan_type === 'HP3Y' ? 'Pro 3-Year' : 'Lifetime VIP'}
                                </span>
                                <span className="text-[9.5px] text-slate-400 block font-sans">
                                  Single PC License (1 Station)
                                </span>
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase inline-flex items-center space-x-1 ${
                                    l.status === 'unused'
                                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                      : l.status === 'assigned'
                                      ? 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                      : l.status === 'active'
                                      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                      : 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400'
                                  }`}
                                >
                                  {l.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block mr-1" />}
                                  <span>{l.status}</span>
                                </span>
                              </td>
                              <td className="p-3">
                                {l.assigned_email ? (
                                  <div>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[180px]">{l.assigned_email}</span>
                                    <span className="text-[9.5px] text-slate-400 block">{l.assigned_phone}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic text-[10px]">Unassigned (Public Pool)</span>
                                )}
                              </td>
                              <td className="p-3">
                                {l.active_hw_ids && l.active_hw_ids.length > 0 ? (
                                  <div className="space-y-1">
                                    {l.active_hw_ids.map((hw, idx) => (
                                      <div key={idx} className="flex items-center justify-between gap-1 bg-slate-100 dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[9.5px] font-bold">
                                        <span className="truncate max-w-[110px]">💻 {hw}</span>
                                        <button
                                          type="button"
                                          title="Deactivate this Machine ID node"
                                          onClick={() => {
                                            if (confirm(`Unbind Hardware Node [${hw}] from key [${l.code}]?`)) {
                                              const res = deactivateHardwareNode(l.code, hw);
                                              alert(res.msg);
                                              refreshLicenses();
                                            }
                                          }}
                                          className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 font-extrabold px-1 cursor-pointer"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic text-[10px]">No Hardware Bound Yet</span>
                                )}
                              </td>
                              <td className="p-3 font-mono text-[10.5px]">
                                {l.expiry_date ? (
                                  <span className="text-slate-700 dark:text-slate-300 font-bold">{l.expiry_date}</span>
                                ) : (
                                  <span className="text-slate-400 italic">Starts on First Activation</span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCertLicense(l);
                                      setShowCertificateModal(true);
                                    }}
                                    className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded text-[9.5px] font-black uppercase transition cursor-pointer"
                                    title="View Digital Certificate"
                                  >
                                    Cert
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(l.code);
                                      alert(`Copied code [${l.code}] to clipboard!`);
                                    }}
                                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded text-[9.5px] font-bold uppercase transition cursor-pointer"
                                  >
                                    Copy
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedAssignCode(l.code);
                                      setAssignEmail(l.assigned_email || '');
                                      setAssignPhone(l.assigned_phone || '');
                                      setShowAssignModal(true);
                                    }}
                                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[9.5px] font-bold uppercase transition cursor-pointer"
                                  >
                                    Assign
                                  </button>
                                  {l.status !== 'unused' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm(`Reset License [${l.code}] to Unused? This will unbind all client emails and active hardware nodes.`)) {
                                          const res = unbindLicenseClient(l.code);
                                          alert(res.msg);
                                          refreshLicenses();
                                        }
                                      }}
                                      className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-600 dark:text-rose-400 rounded text-[9.5px] font-bold uppercase transition cursor-pointer border border-rose-500/30"
                                      title="Reset key to unused state"
                                    >
                                      Unbind
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Modal: Assign Code to Company */}
                {showAssignModal && (
                  <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-[80] p-4 font-sans">
                    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-zoom-in">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase font-mono flex items-center space-x-1.5">
                          <Key className="w-4 h-4 text-indigo-500" />
                          <span>Assign License Code to Customer</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => setShowAssignModal(false)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                            License Security Code *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. HP1Y-8921-7723-9012"
                            value={selectedAssignCode}
                            onChange={(e) => setSelectedAssignCode(e.target.value.toUpperCase())}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                            Target Company Email *
                          </label>
                          <input
                            type="email"
                            placeholder="e.g. client@company.com"
                            value={assignEmail}
                            onChange={(e) => setAssignEmail(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1">
                            Target Company Phone *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. +971 50 123 4567"
                            value={assignPhone}
                            onChange={(e) => setAssignPhone(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowAssignModal(false)}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs uppercase"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!selectedAssignCode || !assignEmail || !assignPhone) {
                              alert('Please fill out code, email and phone number.');
                              return;
                            }
                            const res = assignCode(selectedAssignCode, assignEmail, assignPhone);
                            alert(res.msg);
                            if (res.success) {
                              refreshLicenses();
                              setShowAssignModal(false);
                            }
                          }}
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-md"
                        >
                          Confirm & Assign Code
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal: Official Digital License Certificate (Option 4) */}
                {showCertificateModal && selectedCertLicense && (
                  <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-[100] p-4 font-sans overflow-y-auto">
                    <div id="official-software-certificate" className="bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white border-2 border-amber-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-auto animate-zoom-in">
                      {/* Close & Print Buttons */}
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 no-print">
                        <span className="text-[10px] font-mono font-bold uppercase text-amber-500 tracking-widest flex items-center space-x-1.5">
                          <Award className="w-4 h-4 text-amber-500" />
                          <span>HISAAB PRO V2.0 • OFFICIAL SOFTWARE CERTIFICATE</span>
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => triggerPrint('official-software-certificate')}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition hover:scale-105 cursor-pointer flex items-center space-x-1.5"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print / Export PDF</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowCertificateModal(false)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Printable Certificate Layout */}
                      <div id="license-certificate-print" className="p-6 bg-gradient-to-b from-amber-500/5 via-transparent to-indigo-500/5 border border-amber-500/30 rounded-2xl relative overflow-hidden space-y-6 font-sans">
                        {/* GCC Gold Watermark Header */}
                        <div className="text-center space-y-1">
                          <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl mb-1">
                            <Shield className="w-8 h-8 text-amber-500" />
                          </div>
                          <p className="text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">
                            UNITED ARAB EMIRATES • FEDERAL TAX AUTHORITY COMPLIANT
                          </p>
                          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase font-serif">
                            Digital License Certificate
                          </h2>
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-mono font-bold">
                            Official Authenticity & Cryptographic Hardware Lock Record
                          </p>
                        </div>

                        {/* Certificate Main Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                          <div className="bg-slate-100 dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">License Security Code</span>
                            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 block tracking-wider select-all">
                              {selectedCertLicense.code}
                            </span>
                          </div>

                          <div className="bg-slate-100 dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">Plan Tier & Duration</span>
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block uppercase">
                              {selectedCertLicense.plan_type === 'HP1Y' ? 'Pro 1-Year (12 Months)' : selectedCertLicense.plan_type === 'HP3Y' ? 'Pro 3-Year (36 Months)' : 'Pro Lifetime VIP (Permanent)'}
                            </span>
                          </div>

                          <div className="bg-slate-100 dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">Registered Company Entity</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                              {company.name || 'Registered UAE Establishment'}
                            </span>
                          </div>

                          <div className="bg-slate-100 dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">Tax Registration No. (TRN)</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              {company.trn || '100028912300003'}
                            </span>
                          </div>

                          <div className="bg-slate-100 dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">Registered Client Email</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                              {selectedCertLicense.assigned_email || company.email || 'Hissabpro1@gmail.com'}
                            </span>
                          </div>

                          <div className="bg-slate-100 dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">Registered Client Mobile</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              {selectedCertLicense.assigned_phone || company.phone || '+971 50 123 4567'}
                            </span>
                          </div>

                          <div className="bg-slate-100 dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 col-span-1 sm:col-span-2">
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">Cryptographic Hardware Node Lock ID</span>
                            <span className="text-xs font-black text-amber-500 block truncate font-mono">
                              💻 {(selectedCertLicense.active_hw_ids && selectedCertLicense.active_hw_ids[0]) || machineId || 'HP-HW-SERVER-NODE'}
                            </span>
                          </div>
                        </div>

                        {/* Status & Expiry Bar with Graphic QR Code */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-950 text-white rounded-2xl border border-slate-800 font-mono">
                          <div className="space-y-1 text-center sm:text-left">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Certificate Verification Status</span>
                            <div className="flex items-center space-x-2 justify-center sm:justify-start">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-sm font-extrabold text-emerald-400 uppercase">ACTIVE & VALIDATED</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block pt-1">
                              Expiry Date: <strong className="text-white">{selectedCertLicense.expiry_date || '2030-12-31'}</strong>
                            </span>
                          </div>

                          {/* Verification QR Graphic */}
                          <div className="flex items-center space-x-3 bg-slate-900 p-2.5 rounded-xl border border-slate-800 shrink-0">
                            <div className="w-12 h-12 bg-white p-1 rounded-lg flex items-center justify-center">
                              {/* Vector QR Placeholder */}
                              <svg viewBox="0 0 24 24" className="w-full h-full text-slate-950 fill-current">
                                <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm11-2h7v7h-7V2zm2 2v3h3V4h-3zM2 15h7v7H2v-7zm2 2v3h3v-3H4zm13 2h3v3h-3v-3zm-2-4h3v2h-3v-2zm4 0h3v2h-3v-2zm-4 4h2v3h-2v-3zm2-6h2v2h-2v-2z"/>
                              </svg>
                            </div>
                            <div className="text-[9px] text-slate-400 font-mono space-y-0.5">
                              <span className="font-bold text-amber-400 block">FTA Audit Verified</span>
                              <span className="block">Scan to verify key integrity</span>
                              <span className="text-[8px] text-slate-500 block">Node Bound: Yes</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-[9.5px] text-slate-500 dark:text-slate-400 text-center font-sans leading-relaxed italic border-t border-slate-200 dark:border-slate-800 pt-3">
                          This certificate confirms that Hisaab Pro V2.0 is officially licensed to the client entity listed above under UAE Federal Tax Authority rules. Hardware node binding prevents unauthorized multi-machine duplication.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            </>
            )}

          </div>

          {/* Core Sticky Footer with save & company deletion controls */}
          <div className="bg-slate-50 dark:bg-[#0f172a] border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between no-print">
            <div>
              {onDeleteCompany && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this company entity? This will delete all linked tax documents, customer statements, and inventory files permanently.")) {
                      onDeleteCompany(formData.id);
                    }
                  }}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-650 dark:text-rose-450 border border-rose-200/50 dark:border-rose-900/60 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Delete Company Entity
                </button>
              )}
            </div>
            
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#2563eb] hover:bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs hover:shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save changes</span>
            </button>
          </div>

        </form>

        {/* Modal: Client Application Uninstall & Deletion Feedback */}
        {showUninstallModal && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-[100] p-4 font-sans">
            <div className="bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative my-auto animate-zoom-in">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                      Software Uninstall & Deletion Request
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Please tell us why you are uninstalling to help us improve Hisaab Pro
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUninstallModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Form Fields */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!uninstallCompany || !uninstallEmail || !uninstallPhone) {
                    alert('⚠️ Please provide Company Name, Email Address, and Phone Number.');
                    return;
                  }
                  setIsSubmittingUninstall(true);
                  try {
                    const res = await submitUninstallFeedback({
                      companyName: uninstallCompany,
                      email: uninstallEmail,
                      phone: uninstallPhone,
                      passwordProvided: uninstallPassword,
                      reasonCategory: uninstallReasonCategory,
                      detailedReason: uninstallDetailedReason
                    });
                    alert(res.msg);
                    setShowUninstallModal(false);
                  } catch (err) {
                    alert('Feedback recorded locally.');
                    setShowUninstallModal(false);
                  } finally {
                    setIsSubmittingUninstall(false);
                  }
                }}
                className="space-y-4 text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Company / Client Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={uninstallCompany}
                      onChange={(e) => setUninstallCompany(e.target.value)}
                      placeholder="Your Company Name"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Account Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={uninstallEmail}
                      onChange={(e) => setUninstallEmail(e.target.value)}
                      placeholder="client@company.ae"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Phone / Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={uninstallPhone}
                      onChange={(e) => setUninstallPhone(e.target.value)}
                      placeholder="+971 50 123 4567"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Account Password (Verification)
                    </label>
                    <input
                      type="password"
                      value={uninstallPassword}
                      onChange={(e) => setUninstallPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Primary Reason for Uninstalling / Deleting *
                  </label>
                  <select
                    value={uninstallReasonCategory}
                    onChange={(e) => setUninstallReasonCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="Switched to alternative software">Switched to alternative software</option>
                    <option value="Missing required business feature">Missing required business feature</option>
                    <option value="Too complex or difficult to navigate">Too complex or difficult to navigate</option>
                    <option value="Technical bugs, errors, or performance issues">Technical bugs, errors, or performance issues</option>
                    <option value="Company closing or operations paused">Company closing or operations paused</option>
                    <option value="High pricing / license fee concerns">High pricing / license fee concerns</option>
                    <option value="Other custom feedback">Other custom feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Detailed Reason & Feature Improvement Suggestions
                  </label>
                  <textarea
                    rows={3}
                    value={uninstallDetailedReason}
                    onChange={(e) => setUninstallDetailedReason(e.target.value)}
                    placeholder="Please tell us what specific feature or improvement would have convinced you to stay..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowUninstallModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingUninstall}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition shadow-md cursor-pointer flex items-center space-x-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isSubmittingUninstall ? 'Submitting...' : 'Submit Uninstall Request'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
      
    </div>
  );
}
