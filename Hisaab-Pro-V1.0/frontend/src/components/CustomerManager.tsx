import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { triggerPrint } from '../utils/printHelper';
import { sanitizeClonedDocForCanvas, generateAndDownloadPDF } from '../utils/pdfCanvasSanitizer';
import { generateCustomerStatementWhatsAppMessage, openDirectWhatsApp } from '../utils/whatsappShareHelper';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Edit2, 
  Trash2, 
  X,
  FileCheck2,
  BookOpen,
  Printer,
  Download,
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  Info,
  FileText,
  CheckCircle2,
  AlertCircle,
  Building,
  Settings,
  AlertTriangle,
  Navigation,
  ExternalLink,
  Upload,
  FileSpreadsheet,
  Layers,
  ShieldCheck,
  Eye,
  FileDown
} from 'lucide-react';
import { Customer, SalesDocument, Company } from '../types';
import { getCountryConfig, validateCountryTaxId, getCountryCities } from '../utils/countryLocalization';

interface CustomerManagerProps {
  customers: Customer[];
  documents: SalesDocument[];
  activeCompanyId: string;
  company?: Company;
  onAddCustomer: (cust: Omit<Customer, 'id' | 'companyId'>) => void;
  onUpdateCustomer: (cust: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onViewInvoice?: (id: string) => void;
  onEditInvoice?: (id: string) => void;
  onDeleteInvoice?: (id: string) => void;
  onCreateInvoiceForCustomer?: (customerId: string) => void;
}

export default function CustomerManager({
  customers,
  documents,
  activeCompanyId,
  company,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onViewInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onCreateInvoiceForCustomer
}: CustomerManagerProps) {
  const companyCustomers = customers.filter(c => c.companyId === activeCompanyId);
  const [search, setSearch] = useState('');
  const [searchScope, setSearchScope] = useState<'ALL' | 'NAME' | 'COMPANY' | 'PHONE'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<SalesDocument | null>(null);

  // Column Chooser State
  const [cols, setCols] = useState(() => {
    try {
      const saved = localStorage.getItem('hisaab_cols_clients');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      client: true,
      trn: true,
      emirate: true,
      phone: true,
      financials: true
    };
  });
  const [showColChooser, setShowColChooser] = useState(false);
  const [ledgerCustomer, setLedgerCustomer] = useState<Customer | null>(null);
  
  // Filter dropdown states
  const [viewFilter, setViewFilter] = useState<'ALL' | 'TRN_REGISTERED' | 'UNREGISTERED' | 'WITH_CONTACTS' | 'WITH_LOCATION' | 'HAS_OUTSTANDING' | 'OVERDUE_ONLY' | 'HAS_INVOICES'>('ALL');
  const [emirateFilter, setEmirateFilter] = useState<string>('ALL');
  const [taxFilter, setTaxFilter] = useState<'ALL' | 'REGISTERED' | 'UNREGISTERED' | 'PROVISIONAL'>('ALL');
  const [balanceFilter, setBalanceFilter] = useState<'ALL' | 'OUTSTANDING' | 'OVERDUE' | 'ZERO'>('ALL');
  
  // Client Detail Page & Statement states
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<Customer | null>(null);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [dateFilterType, setDateFilterType] = useState<'weekly' | 'monthly' | 'quarterly' | 'custom'>('monthly');
  const [statementStartDate, setStatementStartDate] = useState('');
  const [statementEndDate, setStatementEndDate] = useState('');
  const [isPrintingStatement, setIsPrintingStatement] = useState(false);
  const [isDownloadingStatementPdf, setIsDownloadingStatementPdf] = useState(false);

  // Bulk Customer CSV Import with Management Ledgers Mapping State
  const [isImportLedgerModalOpen, setIsImportLedgerModalOpen] = useState(false);
  const [importRawCsvText, setImportRawCsvText] = useState(
    'CustomerName*,Phone*,Emirate*,TRN,Email,OpeningBalance\nAl Futtaim Group,042112233,Dubai,100382910400003,accounts@alfuttaim.ae,15500.00\nEmaar Properties PJSC,043675555,Dubai,100293847500003,billing@emaar.ae,24000.00\nMajid Al Futtaim Holding,042942222,Dubai,,finance@maf.ae,0.00'
  );
  const [selectedManagementLedgerCode, setSelectedManagementLedgerCode] = useState('1100-01');
  const [selectedManagementLedgerName, setSelectedManagementLedgerName] = useState('Trade Debtors - Corporate');

  // Calculate directory metrics
  const companyDocuments = documents.filter(d => d.companyId === activeCompanyId);
  const todayStr = '2026-06-26';

  // Unpaid Customers count
  const unpaidCustomerIds = new Set(
    companyDocuments
      .filter(d => d.type === 'Invoice' && (d.status === 'Unpaid' || d.status === 'Sent'))
      .map(d => d.customerId)
  );
  const unpaidCustomersCount = unpaidCustomerIds.size;

  // Overdue Customers count
  const overdueCustomerIds = new Set(
    companyDocuments
      .filter(d => d.type === 'Invoice' && (d.status === 'Unpaid' || d.status === 'Sent') && d.dueDate && d.dueDate < todayStr)
      .map(d => d.customerId)
  );
  const overdueCustomersCount = overdueCustomerIds.size;

  // Open Bills (outstanding invoices) count
  const openBillsCount = companyDocuments.filter(d => d.type === 'Invoice' && (d.status === 'Unpaid' || d.status === 'Sent')).length;

  // Customers paid in the last 30 days
  const todayDate = new Date('2026-06-26');
  const limitDate = new Date(todayDate);
  limitDate.setDate(todayDate.getDate() - 30);
  const limitDateStr = limitDate.toISOString().split('T')[0];

  const paidCustomerIdsLast30Days = new Set(
    companyDocuments
      .filter(d => d.type === 'Invoice' && d.status === 'Paid' && d.date >= limitDateStr)
      .map(d => d.customerId)
  );
  const paidCustomers30DaysCount = paidCustomerIdsLast30Days.size;

  // New detailed financial metrics
  const totalInvoicesValue = companyDocuments
    .filter(d => d.type === 'Invoice')
    .reduce((sum, d) => sum + d.total, 0);

  const totalOutstandingReceivable = companyDocuments
    .filter(d => d.type === 'Invoice' && (d.status === 'Unpaid' || d.status === 'Partially Paid'))
    .reduce((sum, d) => sum + (d.total - (d.paymentReceived || 0)), 0);

  const totalCollectedAmount = companyDocuments
    .filter(d => d.type === 'Invoice')
    .reduce((sum, d) => sum + (d.paymentReceived || 0), 0);

  const overdueOutstandingReceivable = companyDocuments
    .filter(d => d.type === 'Invoice' && (d.status === 'Unpaid' || d.status === 'Partially Paid') && d.dueDate && d.dueDate < todayStr)
    .reduce((sum, d) => sum + (d.total - (d.paymentReceived || 0)), 0);

  const totalCustomersCount = customers.filter(c => c.companyId === activeCompanyId).length;

  const gccCountry = company?.gccCountry || 'UAE';
  const countryConfig = getCountryConfig(company?.country || gccCountry);
  const isVatEnabled = Boolean(company?.vatEnabled !== false && (company?.taxRate ?? 5) > 0 && (company?.trn?.trim() || company?.vatEnabled === true));

  // Tax details
  const trnLabel = `${countryConfig.taxIdShortLabel} (${countryConfig.name})`;
  const trnPlaceholder = countryConfig.taxIdPlaceholder;
  const trnMinLength = countryConfig.taxIdMinLength;
  const trnMaxLength = countryConfig.taxIdMaxLength;

  const regionLabel = countryConfig.regionLabel;
  const regionsList = countryConfig.regions;

  // Custom Cities State & Persistence
  const [customCities, setCustomCities] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('hisaab_custom_cities');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showAddCityInput, setShowAddCityInput] = useState(false);
  const [manualCityName, setManualCityName] = useState('');

  const formatAED = (val: number) => {
    const currencyCode = company?.currency || 'AED';
    const symbol = company?.currencySymbol || currencyCode;
    const position = company?.symbolPosition || 'before';
    const decimals = ['BHD', 'OMR', 'KWD'].includes(currencyCode) ? 3 : 2;
    const formattedNum = val.toLocaleString('en-US', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
    return position === 'before' ? `${symbol} ${formattedNum}` : `${formattedNum} ${symbol}`;
  };

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [website, setWebsite] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [salesTaxNumber, setSalesTaxNumber] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [trn, setTrn] = useState('');
  const [address, setAddress] = useState('');
  const [emirate, setEmirate] = useState<string>(countryConfig.defaultRegion || 'Dubai');

  const countryCities = React.useMemo(() => {
    const base = getCountryCities(country || company?.country || company?.gccCountry || gccCountry);
    return Array.from(new Set([...base, ...regionsList, ...customCities]));
  }, [country, company?.country, company?.gccCountry, gccCountry, regionsList, customCities]);

  // Real-time validation for duplicate Email, Phone, Mobile
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone.replace(/\D/g, '');
  const cleanMobile = mobileNumber.replace(/\D/g, '');

  const duplicateEmailCustomer = cleanEmail ? companyCustomers.find(
    c => c.id !== editingCustomer?.id && c.email?.trim().toLowerCase() === cleanEmail
  ) : null;

  const duplicatePhoneCustomer = cleanPhone.length >= 4 ? companyCustomers.find(
    c => c.id !== editingCustomer?.id && (
      (c.phone && c.phone.replace(/\D/g, '') === cleanPhone) ||
      (c.mobileNumber && c.mobileNumber.replace(/\D/g, '') === cleanPhone)
    )
  ) : null;

  const duplicateMobileCustomer = cleanMobile.length >= 4 ? companyCustomers.find(
    c => c.id !== editingCustomer?.id && (
      (c.phone && c.phone.replace(/\D/g, '') === cleanMobile) ||
      (c.mobileNumber && c.mobileNumber.replace(/\D/g, '') === cleanMobile)
    )
  ) : null;

  const [customerCode, setCustomerCode] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [personalReferralCode, setPersonalReferralCode] = useState('');

  // VAT Provisional states
  const [formVatStatus, setFormVatStatus] = useState<'yes' | 'no' | 'pending'>('yes');
  const [tempTrnId, setTempTrnId] = useState('');
  const [isUpdateVatModalOpen, setIsUpdateVatModalOpen] = useState(false);
  const [newRealTrn, setNewRealTrn] = useState('');
  const [trnError, setTrnError] = useState('');

  const generateNextTempId = () => {
    const pendingCustomers = companyCustomers.filter(c => c.vatStatus === 'pending' || (c.tempTrnId && c.tempTrnId.startsWith('TEMP-CUST-')));
    let maxNum = 0;
    pendingCustomers.forEach(c => {
      const idStr = c.tempTrnId || '';
      const match = idStr.match(/TEMP-CUST-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum + 1;
    return `TEMP-CUST-${String(nextNum).padStart(3, '0')}`;
  };

  const generateNextCustomerCode = () => {
    const existingCodes = companyCustomers.map(c => c.customerCode || '');
    let maxNum = 1000;
    existingCodes.forEach(code => {
      const match = code.match(/CUST-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    let nextCode = `CUST-${maxNum + 1}`;
    while (existingCodes.some(c => (c || '').toLowerCase() === nextCode.toLowerCase())) {
      maxNum++;
      nextCode = `CUST-${maxNum + 1}`;
    }
    return nextCode;
  };

  // Filter customers with comprehensive field matching & exact filter selectors
  const filteredCustomers = companyCustomers.filter(c => {
    // 1. Search Query Match
    const query = search.trim().toLowerCase();
    const rawQuery = query.replace(/\D/g, ''); // Digits only for phone search

    if (query) {
      let matchesSearch = false;
      if (searchScope === 'NAME') {
        const nameMatch = c.name?.toLowerCase().includes(query);
        const firstNameMatch = c.firstName?.toLowerCase().includes(query);
        const lastNameMatch = c.lastName?.toLowerCase().includes(query);
        const fullNameMatch = [c.firstName, c.lastName].filter(Boolean).join(' ').toLowerCase().includes(query);
        matchesSearch = !!(nameMatch || firstNameMatch || lastNameMatch || fullNameMatch);
      } else if (searchScope === 'COMPANY') {
        matchesSearch = !!c.companyName?.toLowerCase().includes(query);
      } else if (searchScope === 'PHONE') {
        const phoneMatch = (c.phone && c.phone.toLowerCase().includes(query)) || (c.mobileNumber && c.mobileNumber.toLowerCase().includes(query));
        const normPhoneMatch = rawQuery.length >= 2 && (
          (c.phone && c.phone.replace(/\D/g, '').includes(rawQuery)) ||
          (c.mobileNumber && c.mobileNumber.replace(/\D/g, '').includes(rawQuery))
        );
        matchesSearch = !!(phoneMatch || normPhoneMatch);
      } else {
        // ALL SCOPES
        const nameMatch = c.name?.toLowerCase().includes(query);
        const idMatch = c.id?.toLowerCase().includes(query);
        const codeMatch = c.customerCode?.toLowerCase().includes(query);
        const trnMatch = (c.trn && c.trn.toLowerCase().includes(query)) || (c.tempTrnId && c.tempTrnId.toLowerCase().includes(query));
        const taxNoMatch = (c.salesTaxNumber && c.salesTaxNumber.toLowerCase().includes(query)) || (c.tinNumber && c.tinNumber.toLowerCase().includes(query));
        const emailMatch = c.email?.toLowerCase().includes(query);
        const firstNameMatch = c.firstName?.toLowerCase().includes(query);
        const lastNameMatch = c.lastName?.toLowerCase().includes(query);
        const fullNameMatch = [c.firstName, c.lastName].filter(Boolean).join(' ').toLowerCase().includes(query);
        const companyMatch = c.companyName?.toLowerCase().includes(query);
        const phoneMatch = (c.phone && c.phone.toLowerCase().includes(query)) || (c.mobileNumber && c.mobileNumber.replace(/\D/g, '').includes(rawQuery));
        const normPhoneMatch = rawQuery.length >= 2 && (
          (c.phone && c.phone.replace(/\D/g, '').includes(rawQuery)) ||
          (c.mobileNumber && c.mobileNumber.replace(/\D/g, '').includes(rawQuery))
        );
        const addressMatch = c.address?.toLowerCase().includes(query);
        const emirateMatch = c.emirate?.toLowerCase().includes(query);
        const cityMatch = c.city?.toLowerCase().includes(query);
        const countryMatch = c.country?.toLowerCase().includes(query);
        const postalMatch = c.postalCode?.toLowerCase().includes(query);
        const termsMatch = (c.paymentTerms && c.paymentTerms.toLowerCase().includes(query)) || (c.paymentMethod && c.paymentMethod.toLowerCase().includes(query));

        matchesSearch = !!(nameMatch || idMatch || codeMatch || trnMatch || taxNoMatch || emailMatch || 
                            firstNameMatch || lastNameMatch || fullNameMatch || companyMatch || 
                            phoneMatch || normPhoneMatch || addressMatch || emirateMatch || cityMatch || 
                            countryMatch || postalMatch || termsMatch);
      }

      if (!matchesSearch) return false;
    }

    // 2. Customer Invoices & Balances for filter evaluation
    const custInvoices = companyDocuments.filter(d => d.customerId === c.id && d.type === 'Invoice' && d.status !== 'Cancelled');
    const custOutstanding = custInvoices.filter(d => d.status === 'Unpaid' || d.status === 'Partially Paid').reduce((sum, d) => sum + (d.total - (d.paymentReceived || 0)), 0);
    const custOverdue = custInvoices.filter(d => (d.status === 'Unpaid' || d.status === 'Partially Paid') && d.dueDate && d.dueDate < todayStr).reduce((sum, d) => sum + (d.total - (d.paymentReceived || 0)), 0);

    // 3. View Category Filter
    if (viewFilter === 'TRN_REGISTERED' && (!c.trn && !c.salesTaxNumber)) return false;
    if (viewFilter === 'UNREGISTERED' && (c.trn || c.salesTaxNumber)) return false;
    if (viewFilter === 'WITH_CONTACTS' && (!c.phone && !c.email && !c.mobileNumber)) return false;
    if (viewFilter === 'WITH_LOCATION' && (!c.emirate && !c.address && !c.city)) return false;
    if (viewFilter === 'HAS_OUTSTANDING' && custOutstanding <= 0) return false;
    if (viewFilter === 'OVERDUE_ONLY' && custOverdue <= 0) return false;
    if (viewFilter === 'HAS_INVOICES' && custInvoices.length === 0) return false;

    // 4. Emirate Filter
    if (emirateFilter !== 'ALL') {
      if (emirateFilter === 'Other') {
        const mainEmirates = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];
        if (c.emirate && mainEmirates.includes(c.emirate)) return false;
      } else {
        if (c.emirate !== emirateFilter && c.city !== emirateFilter) return false;
      }
    }

    // 5. Tax Status Filter
    if (taxFilter === 'REGISTERED' && (!c.trn && !c.salesTaxNumber)) return false;
    if (taxFilter === 'UNREGISTERED' && (c.trn || c.salesTaxNumber)) return false;
    if (taxFilter === 'PROVISIONAL' && c.vatStatus !== 'pending' && !c.tempTrnId) return false;

    // 6. Balance Filter
    if (balanceFilter === 'OUTSTANDING' && custOutstanding <= 0) return false;
    if (balanceFilter === 'OVERDUE' && custOverdue <= 0) return false;
    if (balanceFilter === 'ZERO' && custOutstanding > 0) return false;

    return true;
  });

  const [selectedIdx, setSelectedIdx] = useState<number>(-1);

  useEffect(() => {
    if (filteredCustomers.length > 0) {
      setSelectedIdx(0);
    } else {
      setSelectedIdx(-1);
    }
  }, [search, viewFilter, emirateFilter, taxFilter, balanceFilter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e || !e.key) return;
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.tagName === 'SELECT' || 
        activeEl.getAttribute('contenteditable') === 'true'
      );

      // 1. GLOBAL SHORTCUTS: Ctrl + P, Ctrl + N
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'p') {
          e.preventDefault();
          triggerPrint('printable-statement-body');
          return;
        }
        if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          openAddModal();
          return;
        }
        if (e.key.toLowerCase() === 'c' && !isTyping) {
          if (selectedIdx >= 0 && selectedIdx < filteredCustomers.length) {
            e.preventDefault();
            navigator.clipboard.writeText(filteredCustomers[selectedIdx].name);
            alert(`Copied Customer Name: ${filteredCustomers[selectedIdx].name}`);
            return;
          }
        }
      }

      if (isTyping) return;

      if (isModalOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsModalOpen(false);
        }
        return;
      }

      // 3. LIST ARROW NAVIGATION (UP / DOWN / ENTER)
      if (filteredCustomers.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIdx(prev => {
            const next = prev < filteredCustomers.length - 1 ? prev + 1 : prev;
            const rowEl = document.getElementById(`cust-row-${filteredCustomers[next].id}`);
            if (rowEl) {
              rowEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
              rowEl.focus();
            }
            return next;
          });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIdx(prev => {
            const next = prev > 0 ? prev - 1 : prev;
            const rowEl = document.getElementById(`cust-row-${filteredCustomers[next].id}`);
            if (rowEl) {
              rowEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
              rowEl.focus();
            }
            return next;
          });
        } else if (e.key === 'Enter') {
          if (selectedIdx >= 0 && selectedIdx < filteredCustomers.length) {
            e.preventDefault();
            openEditModal(filteredCustomers[selectedIdx]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, selectedIdx, filteredCustomers]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setFirstName('');
    setLastName('');
    setContactPersonName('');
    setCompanyName('');
    setEmail('');
    setPhone('');
    setMobileNumber('');
    setWebsite('');
    setCity('');
    setCountry('');
    setPostalCode('');
    setPaymentTerms('');
    setPaymentMethod('');
    setSalesTaxNumber('');
    setTinNumber('');
    setTrn('');
    setAddress('');
    setCountry(company?.country || (gccCountry === 'UAE' ? 'United Arab Emirates' : countryConfig.name));
    setEmirate(countryConfig.defaultRegion || 'Dubai');
    setCustomerCode(generateNextCustomerCode());
    setReferralCode('');
    setPersonalReferralCode('');
    setFormVatStatus(isVatEnabled ? 'yes' : 'no');
    setTempTrnId('');
    setIsModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFirstName(cust.firstName || '');
    setLastName(cust.lastName || '');
    setContactPersonName([cust.firstName, cust.lastName].filter(Boolean).join(' ') || cust.name || '');
    setCompanyName(cust.companyName || '');
    setEmail(cust.email || '');
    setPhone(cust.phone || '');
    setMobileNumber(cust.mobileNumber || '');
    setWebsite(cust.website || '');
    setCity(cust.city || '');
    setCountry(cust.country || '');
    setPostalCode(cust.postalCode || '');
    setPaymentTerms(cust.paymentTerms || '');
    setPaymentMethod(cust.paymentMethod || '');
    setSalesTaxNumber(cust.salesTaxNumber || '');
    setTinNumber(cust.tinNumber || '');
    setTrn(cust.trn || '');
    setAddress(cust.address || '');
    setEmirate(cust.emirate || '');
    setCustomerCode(cust.customerCode || generateNextCustomerCode());
    setReferralCode('');
    setPersonalReferralCode('');
    setFormVatStatus(cust.vatStatus || (cust.trn ? 'yes' : 'no'));
    setTempTrnId(cust.tempTrnId || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate name dynamically from optional fields
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
    let finalName = '';
    if (fullName && companyName.trim()) {
      finalName = `${fullName} (${companyName.trim()})`;
    } else if (fullName) {
      finalName = fullName;
    } else if (companyName.trim()) {
      finalName = companyName.trim();
    } else if (email.trim()) {
      finalName = email.trim();
    } else {
      finalName = 'Unnamed Customer';
    }

    // Ensure unique customer code
    let finalCustomerCode = (customerCode || '').trim();
    if (!finalCustomerCode) {
      finalCustomerCode = generateNextCustomerCode();
    } else {
      const isDuplicate = companyCustomers.some(
        c => c.id !== editingCustomer?.id && c.customerCode?.toLowerCase() === finalCustomerCode.toLowerCase()
      );
      if (isDuplicate) {
        finalCustomerCode = generateNextCustomerCode();
      }
    }

    const customerData = {
      name: finalName,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      companyName: companyName || undefined,
      email: email || undefined,
      phone: phone || undefined,
      mobileNumber: mobileNumber || undefined,
      website: website || undefined,
      city: city || undefined,
      country: country || undefined,
      postalCode: postalCode || undefined,
      paymentTerms: paymentTerms || undefined,
      paymentMethod: paymentMethod || undefined,
      salesTaxNumber: salesTaxNumber || undefined,
      tinNumber: tinNumber || undefined,
      trn: (isVatEnabled && formVatStatus === 'yes') ? (trn || undefined) : undefined,
      vatStatus: isVatEnabled ? formVatStatus : 'no',
      tempTrnId: (isVatEnabled && formVatStatus === 'pending') ? (tempTrnId || trn) : undefined,
      vatPendingCreatedAt: (isVatEnabled && formVatStatus === 'pending') ? (editingCustomer?.vatPendingCreatedAt || new Date().toISOString().split('T')[0]) : undefined,
      address: address || undefined,
      emirate: emirate || undefined,
      customerCode: finalCustomerCode,
      referralCode: referralCode || undefined,
      personalReferralCode: personalReferralCode || undefined
    };

    if (editingCustomer) {
      onUpdateCustomer({
        ...editingCustomer,
        ...customerData
      });
    } else {
      onAddCustomer(customerData);
    }
    setIsModalOpen(false);
  };

  const handleSaveRealTrn = () => {
    if (!selectedCustomerDetail) return;
    const cleanTrn = newRealTrn.trim();
    const valResult = validateCountryTaxId(gccCountry, cleanTrn);
    if (!valResult.isValid) {
      setTrnError(`⚠️ ${valResult.message || 'Invalid Tax ID format'}`);
      return;
    }
    
    // Create audit log
    const prevTempId = selectedCustomerDetail.tempTrnId || 'TEMP-CUST-XXX';
    const auditEntry = {
      date: new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'TRN Updated',
      details: `TRN Updated from ${prevTempId} to ${cleanTrn}`
    };

    const existingAudit = selectedCustomerDetail.auditHistory || [];
    const updatedCustomer: Customer = {
      ...selectedCustomerDetail,
      vatStatus: 'yes',
      trn: cleanTrn,
      tempTrnId: undefined,
      vatPendingCreatedAt: undefined,
      auditHistory: [...existingAudit, auditEntry]
    };

    onUpdateCustomer(updatedCustomer);
    setSelectedCustomerDetail(updatedCustomer);
    setIsUpdateVatModalOpen(false);
    setNewRealTrn('');
    setTrnError('');
  };

  // Date range calculators
  const getFilteredStatementInvoices = (custInvoices: SalesDocument[]) => {
    if (dateFilterType === 'custom') {
      return custInvoices.filter(inv => {
        if (statementStartDate && inv.date < statementStartDate) return false;
        if (statementEndDate && inv.date > statementEndDate) return false;
        return true;
      });
    }
    
    const today = new Date('2026-06-26');
    let limitDate = new Date(today);
    if (dateFilterType === 'weekly') {
      limitDate.setDate(today.getDate() - 7);
    } else if (dateFilterType === 'monthly') {
      limitDate.setDate(today.getDate() - 30);
    } else if (dateFilterType === 'quarterly') {
      limitDate.setDate(today.getDate() - 90);
    }
    const limitDateStr = limitDate.toISOString().split('T')[0];
    return custInvoices.filter(inv => inv.date >= limitDateStr);
  };

  useEffect(() => {
    if (isPrintingStatement) {
      const timer = setTimeout(() => {
        triggerPrint('printable-statement-body');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isPrintingStatement]);

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handleDownloadStatementPDF = async () => {
    if (!selectedCustomerDetail) return;
    setIsDownloadingStatementPdf(true);
    const element = document.getElementById('printable-statement-body');
    if (!element) {
      setIsDownloadingStatementPdf(false);
      return;
    }
    try {
      const rawFileName = `Statement_${selectedCustomerDetail.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      const fileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      
      await generateAndDownloadPDF(element, fileName, { targetId: 'printable-statement-body', paperSize: 'a4' });
    } catch (error) {
      console.error("Error generating Statement PDF:", error);
      triggerPrint('printable-statement-body');
    } finally {
      setIsDownloadingStatementPdf(false);
    }
  };

  const handleDownloadStatementHTML = () => {
    if (!selectedCustomerDetail) return;
    const element = document.getElementById('printable-statement-body');
    if (!element) return;
    
    const clone = element.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.no-print').forEach(el => el.remove());
    
    const rawFileName = `Statement_${selectedCustomerDetail.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
    const fileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Statement of Account - ${selectedCustomerDetail.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Noto+Sans+Arabic:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', 'Noto Sans Arabic', system-ui, -apple-system, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      padding: 2rem 1rem;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
    }
    .doc-container {
      max-width: 850px;
      width: 100%;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 2.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .font-mono { font-family: 'JetBrains Mono', monospace !important; }
    .flex { display: flex !important; }
    .flex-col { flex-direction: column !important; }
    .items-center { align-items: center !important; }
    .items-start { align-items: flex-start !important; }
    .justify-between { justify-content: space-between !important; }
    .justify-end { justify-content: flex-end !important; }
    .justify-center { justify-content: center !important; }
    .space-y-6 > * + * { margin-top: 1.5rem !important; }
    .space-y-4 > * + * { margin-top: 1rem !important; }
    .space-y-2 > * + * { margin-top: 0.5rem !important; }
    .space-x-3 > * + * { margin-left: 0.75rem !important; }
    .space-x-2 > * + * { margin-left: 0.5rem !important; }
    .grid { display: grid !important; }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
    .gap-4 { gap: 1rem !important; }
    .gap-6 { gap: 1.5rem !important; }
    table { width: 100% !important; border-collapse: collapse !important; margin: 1rem 0 !important; }
    th, td { padding: 0.75rem 0.5rem !important; border-bottom: 1px solid #e2e8f0 !important; text-align: left !important; }
    th { font-weight: 700 !important; font-size: 0.75rem !important; text-transform: uppercase !important; color: #475569 !important; background: #f8fafc !important; }
    td { font-size: 0.875rem !important; color: #1e293b !important; }
    .font-bold { font-weight: 700 !important; }
    .font-extrabold { font-weight: 800 !important; }
    .font-black { font-weight: 900 !important; }
    .text-xs { font-size: 0.75rem !important; }
    .text-sm { font-size: 0.875rem !important; }
    .text-base { font-size: 1rem !important; }
    .text-lg { font-size: 1.125rem !important; }
    .text-xl { font-size: 1.25rem !important; }
    .text-2xl { font-size: 1.5rem !important; }
    .text-right { text-align: right !important; }
    .text-center { text-align: center !important; }
    .text-slate-500 { color: #64748b !important; }
    .text-slate-600 { color: #475569 !important; }
    .text-slate-700 { color: #334155 !important; }
    .text-slate-800 { color: #1e293b !important; }
    .text-slate-900 { color: #0f172a !important; }
    .text-emerald-600 { color: #059669 !important; }
    .text-indigo-600 { color: #4f46e5 !important; }
    .bg-white { background-color: #ffffff !important; }
    .bg-slate-50 { background-color: #f8fafc !important; }
    .bg-slate-100 { background-color: #f1f5f9 !important; }
    .bg-slate-900 { background-color: #0f172a !important; color: #ffffff !important; }
    .border { border: 1px solid #e2e8f0 !important; }
    .border-b { border-bottom: 1px solid #e2e8f0 !important; }
    .border-t { border-top: 1px solid #e2e8f0 !important; }
    .rounded-lg { border-radius: 0.5rem !important; }
    .rounded-xl { border-radius: 0.75rem !important; }
    .p-4 { padding: 1rem !important; }
    .p-6 { padding: 1.5rem !important; }
    .p-8 { padding: 2rem !important; }
    .no-print { display: none !important; }
    @media print {
      body { background-color: white !important; padding: 0 !important; }
      .doc-container { border: none !important; box-shadow: none !important; padding: 0 !important; max-width: 100% !important; }
      .no-print { display: none !important; }
    }
  </style>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div class="doc-container">
    ${clone.innerHTML}
  </div>
</body>
</html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 200);
  };

  if (isPrintingStatement && selectedCustomerDetail) {
    const clientInvoices = companyDocuments.filter(d => d.customerId === selectedCustomerDetail.id && (d.type === 'Invoice' || d.type === 'CreditNote') && d.status !== 'Cancelled')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const filteredInvoices = getFilteredStatementInvoices(clientInvoices);
    
    let runningBalance = 0;
    let totalInvoiced = 0;
    let totalPaid = 0;
    const ledgerRows = filteredInvoices.map(doc => {
      const isInvoice = doc.type === 'Invoice';
      const isCreditNote = doc.type === 'CreditNote';
      const isPaid = doc.status === 'Paid';
      let debit = 0;
      let credit = 0;

      if (isInvoice) {
        debit = doc.total;
        credit = isPaid ? doc.total : 0;
        totalInvoiced += debit;
        totalPaid += credit;
        runningBalance += (debit - credit);
      } else if (isCreditNote) {
        debit = -Math.abs(doc.total);
        credit = 0;
        totalInvoiced += debit;
        runningBalance += debit;
      }

      return {
        ...doc,
        debit,
        credit,
        runningBalance
      };
    });

    return (
      <div className="bg-white p-8 min-h-screen text-slate-800 font-sans text-xs">
        {/* Print controls floating header */}
        <div className="no-print bg-slate-900 text-white p-5 rounded-xl flex flex-col gap-4 mb-8 shadow-lg border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Info className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <span className="text-xs font-bold font-sans block">BILINGUAL PRINT MODE — Standard A4 Statement of Account</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Generate, print or save local statement copies instantly</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => triggerPrint('printable-statement-body')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg font-bold uppercase tracking-wider text-[10px] cursor-pointer transition-all flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Statement</span>
              </button>
              
              <button
                type="button"
                disabled={isDownloadingStatementPdf}
                onClick={handleDownloadStatementPDF}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3.5 py-2 rounded-lg font-bold uppercase tracking-wider text-[10px] cursor-pointer transition-all flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isDownloadingStatementPdf ? 'Generating...' : 'Download PDF'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrintingStatement(false)}
                className="bg-slate-700 hover:bg-slate-650 text-white px-3.5 py-2 rounded-lg font-bold uppercase tracking-wider text-[10px] cursor-pointer transition-all"
              >
                Exit Print
              </button>
            </div>
          </div>

          {isIframe && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 p-3.5 rounded-lg text-[11px] flex items-start gap-2.5">
              <span className="text-sm shrink-0">⚠️</span>
              <div>
                <strong className="block text-amber-300 font-semibold mb-0.5">Direct PDF Export Active</strong>
                Direct PDF downloads are enabled. Click <strong className="text-emerald-300 font-bold">"Download PDF"</strong> above to save your statement of account in PDF format.
              </div>
            </div>
          )}
        </div>

        {/* Professional GCC Statement Template */}
        <div id="printable-statement-body" className="max-w-[800px] mx-auto border border-slate-300 p-8 rounded-lg shadow-xs bg-white">
          <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 font-sans">
                STATEMENT OF ACCOUNT
              </h1>
              <div className="text-[10px] text-slate-400 font-mono mt-2">
                Date: {new Date().toLocaleDateString('en-AE')}
              </div>
            </div>
            <div className="text-right">
              {company?.logoUrl ? (
                <img src={company.logoUrl} alt="Logo" className="h-10 ml-auto object-contain mb-1" />
              ) : null}
              <h3 className="text-lg font-black tracking-tight text-[#0F172A]">{company?.name || 'HISAAB PRO LLC'}</h3>
              <p className="text-[9px] text-slate-400 font-mono uppercase">{company?.branchName || 'Financial Systems UAE'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8 text-[11px]">
            <div>
              <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-mono mb-1">Company Details</p>
              <p className="font-extrabold text-slate-800">{company?.name || 'Active UAE Corporate'}</p>
              {company?.trn ? (
                <p className="text-slate-500 font-mono">TRN: {company.trn}</p>
              ) : (
                <p className="text-amber-600 dark:text-amber-400 font-mono text-[10px]">TRN missing - Update for Compliance</p>
              )}
              <p className="text-slate-500">{company?.address || 'United Arab Emirates'}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-mono mb-1">Client Account</p>
              <p className="font-extrabold text-slate-850">{selectedCustomerDetail.name}</p>
              {selectedCustomerDetail.trn && (
                <p className="text-slate-500 font-mono">TRN: {selectedCustomerDetail.trn}</p>
              )}
              {selectedCustomerDetail.phone && <p className="text-slate-500 font-mono">Phone: {selectedCustomerDetail.phone}</p>}
              {selectedCustomerDetail.address && <p className="text-slate-500 truncate max-w-xs ml-auto">{selectedCustomerDetail.address}</p>}
            </div>
          </div>

          {/* Bento Summary cards */}
          <div className="grid grid-cols-3 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl mb-6">
            <div>
              <span className="text-slate-400 uppercase tracking-wider block text-[8px] font-bold font-mono">Total Sales / Debit</span>
              <span className="text-sm font-extrabold text-slate-850">AED {totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase tracking-wider block text-[8px] font-bold font-mono">Total Collected / Credit</span>
              <span className="text-sm font-extrabold text-emerald-700">AED {totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div>
              <span className="text-rose-600 uppercase tracking-wider block text-[8px] font-bold font-mono">Outstanding Balance</span>
              <span className="text-sm font-extrabold text-rose-600">AED {(totalInvoiced - totalPaid).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-600 font-mono uppercase tracking-wider font-bold">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Doc Ref</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right">Debit</th>
                <th className="py-2.5 px-3 text-right">Credit</th>
                <th className="py-2.5 px-3 text-right bg-slate-200/50">Running Balance</th>
                <th className="py-2.5 px-3 text-center no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {ledgerRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">No transactions found for the selected range.</td>
                </tr>
              ) : (
                ledgerRows.map(row => (
                  <tr key={row.id}>
                    <td className="py-2.5 px-3">{row.date}</td>
                    <td 
                      className="py-2.5 px-3 font-bold text-indigo-700 hover:underline cursor-pointer"
                      onClick={() => onViewInvoice?.(row.id)}
                      title="Click to view invoice document"
                    >
                      {row.docNumber}
                    </td>
                    <td className="py-2.5 px-3 font-sans">{row.type === 'CreditNote' ? 'Sales Credit Note' : 'Corporate Sales Invoice'}</td>
                    <td className="py-2.5 px-3 text-right">
                      {row.debit < 0 ? (
                        <span className="text-rose-600 font-bold font-mono">-AED {Math.abs(row.debit).toFixed(2)}</span>
                      ) : row.debit > 0 ? (
                        `AED ${row.debit.toFixed(2)}`
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-700">{row.credit > 0 ? `AED ${row.credit.toFixed(2)}` : '-'}</td>
                    <td className="py-2.5 px-3 text-right font-bold bg-slate-50">{row.runningBalance.toFixed(2)}</td>
                    <td className="py-2 px-3 text-center no-print">
                      <div className="inline-flex items-center space-x-1 border border-slate-200 bg-white p-1 rounded-md shadow-xs">
                        <button
                          type="button"
                          onClick={() => onViewInvoice?.(row.id)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                          title="View Document (👁️)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onViewInvoice?.(row.id)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer"
                          title="Quick Document (📄)"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onViewInvoice?.(row.id)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-amber-600 transition-colors cursor-pointer"
                          title="Quick Print (🖨️)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onViewInvoice?.(row.id)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                          title="Download PDF (📥)"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (selectedCustomerDetail) {
    const clientInvoices = companyDocuments.filter(d => d.customerId === selectedCustomerDetail.id && (d.type === 'Invoice' || d.type === 'CreditNote') && d.status !== 'Cancelled')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const totalInvoices = clientInvoices.filter(d => d.type === 'Invoice').length;
    const totalSalesAmount = clientInvoices.reduce((sum, inv) => {
      if (inv.type === 'CreditNote') return sum - Math.abs(inv.total);
      return sum + inv.total;
    }, 0);
    const totalPaid = clientInvoices.filter(inv => inv.type === 'Invoice' && inv.status === 'Paid').reduce((sum, inv) => sum + inv.total, 0);
    const totalPendingAmount = clientInvoices.reduce((sum, inv) => {
      if (inv.type === 'CreditNote') return sum - Math.abs(inv.total);
      if (inv.status !== 'Paid' && inv.status !== 'Cancelled') return sum + inv.total;
      return sum;
    }, 0);

    // Filter statement table values
    const statementInvoices = getFilteredStatementInvoices(clientInvoices);

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 no-print">
          <button
            onClick={() => setSelectedCustomerDetail(null)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Directory</span>
          </button>
        </div>

        {selectedCustomerDetail.vatStatus === 'pending' && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in no-print">
            <div className="flex items-start space-x-3 text-rose-850">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs font-bold uppercase tracking-wide block">VAT No. Pending & Provisional Status Active</strong>
                <p className="text-xs text-slate-600 mt-1">
                  This client has pending VAT details. All provisional invoices are currently mapped to the **VAT Suspense Payable** account. Please update to a real TRN within 5 days of issue.
                </p>
                <div className="flex items-center space-x-4 mt-2 text-[10px] font-mono text-rose-700">
                  <span>Temp ID: <strong>{selectedCustomerDetail.tempTrnId || 'N/A'}</strong></span>
                  <span>&bull;</span>
                  <span>Created: <strong>{selectedCustomerDetail.vatPendingCreatedAt || 'N/A'}</strong></span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setNewRealTrn('');
                setTrnError('');
                setIsUpdateVatModalOpen(true);
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              Update VAT Number
            </button>
          </div>
        )}

        {/* HEADER SECTION - Top pe */}
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-xl flex flex-col md:flex-row md:items-start justify-between gap-6 shadow-xs">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md shrink-0">
              {selectedCustomerDetail.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-[#0F172A]">{selectedCustomerDetail.name}</h2>
                {selectedCustomerDetail.customerCode && (
                  <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold">
                    Code: {selectedCustomerDetail.customerCode}
                  </span>
                )}
                {selectedCustomerDetail.trn ? (
                  <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-lg text-[10px] font-mono font-extrabold flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>TRN Verified: {selectedCustomerDetail.trn}</span>
                  </span>
                ) : selectedCustomerDetail.vatStatus === 'pending' ? (
                  <span className="bg-rose-50 border border-rose-200 text-rose-800 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    <span>TRN Pending (Suspense)</span>
                  </span>
                ) : (
                  <span className="bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold">
                    Unregistered Vendor / Client
                  </span>
                )}
              </div>

              {/* CONTACT DETAILS & LOCATION CHECK */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Contact Info Card */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 text-xs space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-indigo-600" />
                    <span>Contact Details</span>
                  </div>
                  {selectedCustomerDetail.phone && (
                    <div className="flex items-center space-x-1.5 text-slate-700 font-mono">
                      <span className="font-semibold">{selectedCustomerDetail.phone}</span>
                      <a href={`tel:${selectedCustomerDetail.phone}`} className="text-indigo-600 hover:underline text-[10px] font-bold">Call</a>
                    </div>
                  )}
                  {selectedCustomerDetail.email && (
                    <div className="flex items-center space-x-1.5 text-slate-700 truncate">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <a href={`mailto:${selectedCustomerDetail.email}`} className="text-indigo-600 hover:underline truncate">{selectedCustomerDetail.email}</a>
                    </div>
                  )}
                  {selectedCustomerDetail.mobileNumber && (
                    <div className="text-[11px] text-slate-600 font-mono">
                      Mobile: {selectedCustomerDetail.mobileNumber}
                    </div>
                  )}
                </div>

                {/* Location Check Card with Arrow Marker */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 text-xs space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <Navigation className="w-3 h-3 text-indigo-600 rotate-45" />
                      <span>Location Check</span>
                    </span>
                    <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-bold font-mono">
                      Arrow Marker Active
                    </span>
                  </div>
                  <div className="flex items-start space-x-1.5 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span className="text-xs font-medium text-slate-800 leading-snug">
                      {selectedCustomerDetail.address || `${selectedCustomerDetail.emirate || 'UAE'}, ${selectedCustomerDetail.country || 'GCC'}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] pt-1">
                    <span className="font-mono font-bold text-slate-500">{selectedCustomerDetail.emirate || 'United Arab Emirates'}</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([selectedCustomerDetail.address, selectedCustomerDetail.emirate, selectedCustomerDetail.country].filter(Boolean).join(', '))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                    >
                      <Navigation className="w-3 h-3 rotate-45" />
                      <span>Open Map Direction</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* D. TOP RIGHT BUTTON */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsStatementOpen(true)}
              className="bg-[#0F172A] hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Statement of Account</span>
            </button>
          </div>
        </div>

        {/* B. SUMMARY SECTION - Beech mein */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-xs">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Total Invoices</span>
            <div className="text-2xl font-black text-slate-800 mt-1">{totalInvoices}</div>
            <p className="text-[9px] text-slate-400 mt-1">Total invoices registered</p>
          </div>
          <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-xs">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Total Sales Amount</span>
            <div className="text-2xl font-black text-slate-800 mt-1">AED {totalSalesAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-[9px] text-slate-400 mt-1">Total gross invoiced value</p>
          </div>
          <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-xs">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-600">Total Paid</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">AED {totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-[9px] text-emerald-600 mt-1 font-sans">Settled payments collected</p>
          </div>
          <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-xs">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-500">Total Pending Amount</span>
            <div className="text-2xl font-black text-rose-600 mt-1">AED {totalPendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-[9px] text-rose-500 mt-1 font-sans">Outstanding receivables</p>
          </div>
        </div>

        {/* C. LIST SECTION - Neeche */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#E2E8F0] bg-slate-50 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700 font-mono flex items-center space-x-1.5">
                <span>Invoices List (Date Wise)</span>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {clientInvoices.length} Invoices
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                Manage, add new, edit, or delete sales invoices directly for {selectedCustomerDetail.name}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onCreateInvoiceForCustomer) {
                  onCreateInvoiceForCustomer(selectedCustomerDetail.id);
                } else if (onViewInvoice) {
                  onViewInvoice('new');
                }
              }}
              className="bg-[#0F172A] hover:bg-[#4F46E5] text-white px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 text-indigo-300" />
              <span>Add Invoice</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-slate-600">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase font-mono tracking-wider text-slate-400 border-b border-[#E2E8F0]">
                  <th className="py-3 px-4 font-bold">Date</th>
                  <th className="py-3 px-4 font-bold">Invoice No</th>
                  <th className="py-3 px-4 text-right font-bold">Amount</th>
                  <th className="py-3 px-4 text-right font-bold">Paid</th>
                  <th className="py-3 px-4 text-right font-bold">Pending</th>
                  <th className="py-3 px-4 text-center font-bold">Status</th>
                  <th className="py-3 px-4 text-center font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium font-mono text-[11px]">
                {clientInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                      No invoices issued for this client yet. Click "+ Add Invoice" above to create one.
                    </td>
                  </tr>
                ) : (
                  clientInvoices.map(inv => {
                    const isPaid = inv.status === 'Paid';
                    return (
                      <tr
                        key={inv.id}
                        className="hover:bg-indigo-50/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-sans font-medium">{inv.date}</td>
                        <td 
                          className="py-3 px-4 font-bold text-indigo-700 hover:underline cursor-pointer"
                          onClick={() => onViewInvoice?.(inv.id)}
                        >
                          {inv.docNumber}
                        </td>
                        <td className="py-3 px-4 text-right font-bold">AED {inv.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-right text-emerald-600">
                          {isPaid ? `AED ${inv.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-rose-600">
                          {!isPaid && inv.status !== 'Cancelled' ? `AED ${inv.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                            isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            inv.status === 'Cancelled' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              type="button"
                              onClick={() => onViewInvoice?.(inv.id)}
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-100/60 rounded-lg transition-colors cursor-pointer"
                              title="View Invoice"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (onEditInvoice) {
                                  onEditInvoice(inv.id);
                                } else {
                                  onViewInvoice?.(inv.id);
                                }
                              }}
                              className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-100/60 rounded-lg transition-colors cursor-pointer"
                              title="Edit Invoice"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setInvoiceToDelete(inv)}
                              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-100/60 rounded-lg transition-colors cursor-pointer"
                              title="Delete Invoice"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* D. SECURITY & AUDIT LOGS SECTION */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs no-print">
          <div className="p-4 border-b border-[#E2E8F0] bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 font-mono">FTA Audit Trail & Compliance History</h3>
            <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">Verified Compliance</span>
          </div>
          <div className="p-4">
            {!selectedCustomerDetail.auditHistory || selectedCustomerDetail.auditHistory.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No historical audit logs registered for this customer. All details are up to date and verified.</p>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {selectedCustomerDetail.auditHistory.map((log, logIdx) => (
                    <li key={logIdx}>
                      <div className="relative pb-8">
                        {logIdx !== selectedCustomerDetail.auditHistory!.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center ring-8 ring-white">
                              <Building className="w-4 h-4 text-indigo-600" />
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-xs text-slate-800">
                                <span className="font-bold">{log.action}</span>: {log.details}
                              </p>
                            </div>
                            <div className="text-right text-[10px] whitespace-nowrap text-slate-400 font-mono">
                              <time dateTime={log.date}>{log.date}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Update VAT Number Modal */}
        {isUpdateVatModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 no-print">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-zoom-in text-slate-850">
              <div className="bg-[#0F172A] text-white p-4 flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-widest font-mono">Update {countryConfig.taxIdShortLabel} Registration</h3>
                <button 
                  onClick={() => {
                    setIsUpdateVatModalOpen(false);
                    setNewRealTrn('');
                    setTrnError('');
                  }} 
                  className="text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1 col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 font-mono">Enter Verified {countryConfig.taxIdShortLabel} / {countryConfig.taxIdLabel}</label>
                  <input
                    type="text"
                    maxLength={countryConfig.taxIdMaxLength}
                    minLength={countryConfig.taxIdMinLength}
                    placeholder={countryConfig.taxIdPlaceholder}
                    value={newRealTrn}
                    onChange={(e) => {
                      setNewRealTrn(e.target.value.toUpperCase());
                      setTrnError('');
                    }}
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:border-indigo-500 text-xs font-bold font-mono text-center tracking-widest bg-slate-50 focus:bg-white focus:outline-hidden"
                  />
                  {trnError && <p className="text-[10px] text-rose-600 font-bold">{trnError}</p>}
                </div>

                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-3 text-[10px] leading-relaxed space-y-1">
                  <strong className="block font-bold">💡 Automatic {countryConfig.taxAuthorityShort} Ledger Realignment Action:</strong>
                  <p>Saving this {countryConfig.taxIdShortLabel} will automatically:</p>
                  <ul className="list-disc pl-4 space-y-0.5 font-sans font-medium">
                    <li>Link all prior provisional invoices to the verified {countryConfig.taxIdShortLabel}.</li>
                    <li>Reallocate accumulated tax liabilities from <strong>VAT Suspense (2260)</strong> to the <strong>Output VAT (2250)</strong> account.</li>
                    <li>Add a system audit log entry tracking this action for subsequent {countryConfig.taxAuthority} compliance inspections.</li>
                  </ul>
                </div>

                <div className="flex items-center space-x-2 justify-end pt-2">
                  <button
                    onClick={() => {
                      setIsUpdateVatModalOpen(false);
                      setNewRealTrn('');
                      setTrnError('');
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveRealTrn}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Confirm & Update TRN
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statement of Account Setup Modal */}
        {isStatementOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-zoom-in">
              <div className="bg-[#0F172A] text-white p-4 flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-widest font-mono">Generate Statement of Account</h3>
                <button onClick={() => setIsStatementOpen(false)} className="text-slate-300 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 font-mono">Date Range Filter</label>
                  <select
                    value={dateFilterType}
                    onChange={(e) => setDateFilterType(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:border-indigo-500 text-xs font-bold"
                  >
                    <option value="weekly">Weekly (Last 7 Days)</option>
                    <option value="monthly">Monthly (Last 30 Days)</option>
                    <option value="quarterly">Quarterly (Last 90 Days)</option>
                    <option value="custom">Custom Date Range</option>
                  </select>
                </div>

                {dateFilterType === 'custom' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold uppercase text-slate-400 font-mono">Start Date</label>
                      <input
                        type="date"
                        value={statementStartDate}
                        onChange={(e) => setStatementStartDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold uppercase text-slate-400 font-mono">End Date</label>
                      <input
                        type="date"
                        value={statementEndDate}
                        onChange={(e) => setStatementEndDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 font-mono text-xs"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setIsPrintingStatement(true);
                      setIsStatementOpen(false);
                    }}
                    className="w-full bg-[#0F172A] hover:bg-[#4F46E5] text-white font-bold p-2.5 rounded-lg text-xs uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Export Statement (PDF)</span>
                  </button>

                  <button
                    onClick={() => {
                      const csvRows = [
                        ["Date", "Invoice No", "Taxable Amount", "Paid Amount", "Pending Amount", "Status"].join(",")
                      ];
                      statementInvoices.forEach(inv => {
                        const isPaid = inv.status === 'Paid';
                        csvRows.push([
                          inv.date,
                          inv.docNumber,
                          inv.total.toFixed(2),
                          isPaid ? inv.total.toFixed(2) : "0.00",
                          !isPaid && inv.status !== 'Cancelled' ? inv.total.toFixed(2) : "0.00",
                          inv.status
                        ].join(","));
                      });
                      const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join("\n"));
                      const link = document.createElement("a");
                      link.setAttribute("href", csvContent);
                      link.setAttribute("download", `Statement_${selectedCustomerDetail.name.replace(/\s+/g, '_')}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      setIsStatementOpen(false);
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2.5 rounded-lg text-xs uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Ledger (CSV/Excel)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <h2 className="text-xl font-sans font-black tracking-tight text-[#0F172A]">Customer Directory</h2>
          <p className="text-xs text-slate-500">Trace receivables, associate billing TRNs, and manage business accounts</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsImportLedgerModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Upload className="w-4 h-4" />
            <span>Import Clients</span>
          </button>

          <button
            id="btn-add-customer-open"
            onClick={openAddModal}
            className="bg-[#0F172A] hover:bg-[#4F46E5] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Customer</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 no-print">
        
        {/* Orange Card - Outstanding */}
        <div className="bg-amber-50/75 border border-amber-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700">Outstanding Accounts</span>
              <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Receivable</span>
            </div>
            <h3 className="text-2xl font-black text-amber-900 font-sans">{formatAED(totalOutstandingReceivable)}</h3>
            <div className="flex justify-between text-[10px] text-amber-700/80 mt-2">
              <span>Overdue ({overdueCustomersCount}): <strong className="text-rose-600 font-bold">{formatAED(overdueOutstandingReceivable)}</strong></span>
              <span>Unpaid: <strong>{unpaidCustomersCount} Customers</strong></span>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden flex">
              <div 
                style={{ width: `${totalOutstandingReceivable > 0 ? (overdueOutstandingReceivable / totalOutstandingReceivable) * 100 : 0}%` }} 
                className="bg-rose-500 h-full transition-all duration-500" 
              />
              <div 
                style={{ width: `${totalOutstandingReceivable > 0 ? ((totalOutstandingReceivable - overdueOutstandingReceivable) / totalOutstandingReceivable) * 100 : 0}%` }} 
                className="bg-amber-500 h-full transition-all duration-500" 
              />
            </div>
            <div className="flex justify-between items-center mt-1.5 text-[9px] text-slate-400 font-medium">
              <span>Overdue Ratio</span>
              <span>{openBillsCount} Outstanding Invoices</span>
            </div>
          </div>
        </div>

        {/* Green Card - Collected */}
        <div className="bg-emerald-50/75 border border-emerald-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700">Payments Collected</span>
              <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Collected</span>
            </div>
            <h3 className="text-2xl font-black text-emerald-900 font-sans">{formatAED(totalCollectedAmount)}</h3>
            <div className="flex justify-between text-[10px] text-emerald-700/80 mt-2">
              <span>Recent (30d): <strong>{paidCustomers30DaysCount} payees</strong></span>
              <span>Gross Collected: <strong>{formatAED(totalCollectedAmount)}</strong></span>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
              <div 
                style={{ width: `${totalInvoicesValue > 0 ? (totalCollectedAmount / totalInvoicesValue) * 100 : 0}%` }} 
                className="bg-emerald-500 h-full transition-all duration-500" 
              />
            </div>
            <div className="flex justify-between items-center mt-1.5 text-[9px] text-slate-400 font-medium">
              <span>Collection Ratio</span>
              <span>{totalInvoicesValue > 0 ? ((totalCollectedAmount / totalInvoicesValue) * 100).toFixed(1) : 0}% of Total Ledger</span>
            </div>
          </div>
        </div>

        {/* Slate Card - Overall Clients Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">Gross Sales Ledger</span>
              <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">All Clients</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 font-sans">{formatAED(totalInvoicesValue)}</h3>
            <div className="flex gap-3 text-[10px] text-slate-500/90 mt-2 flex-wrap">
              <span>Customers: <strong className="text-slate-800">{totalCustomersCount}</strong></span>
              <span>• Active Payees: <strong className="text-emerald-600">{paidCustomers30DaysCount}</strong></span>
              <span>• Outstanding: <strong className="text-amber-600">{unpaidCustomersCount}</strong></span>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden flex">
              <div 
                style={{ width: `${totalInvoicesValue > 0 ? (totalCollectedAmount / totalInvoicesValue) * 100 : 0}%` }} 
                className="bg-emerald-500 h-full"
              />
              <div 
                style={{ width: `${totalInvoicesValue > 0 ? (totalOutstandingReceivable / totalInvoicesValue) * 100 : 0}%` }} 
                className="bg-amber-400 h-full"
              />
            </div>
            <div className="flex justify-between items-center mt-1.5 text-[9px] text-slate-400 font-medium">
              <span>Collected vs Receivable</span>
              <span>Total Customers Activity</span>
            </div>
          </div>
        </div>

      </div>

      {/* Filter and Table Card */}
      <div className="bg-white border border-[#E2E8F0] overflow-hidden rounded-xl shadow-xs">
        
        {/* Search & Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] space-y-3.5 no-print">
          
          {/* Top Row: Dedicated Search Input + Scope Selectors */}
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            
            {/* Primary Search Input with Clear Button */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="input-customer-search"
                type="text"
                placeholder={
                  searchScope === 'NAME' ? 'Search by Customer First/Last Name...' :
                  searchScope === 'COMPANY' ? 'Search by Company / Legal Business Entity Name...' :
                  searchScope === 'PHONE' ? 'Search by Phone or Mobile Contact Number...' :
                  'Search by Customer Name, Company Name, Contact Phone, TRN...'
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-10 pr-9 py-2.5 bg-white border border-[#E2E8F0] rounded-xl focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 focus:outline-hidden transition-all font-sans text-slate-800 font-medium placeholder-slate-400 shadow-xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-2.5 p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title="Clear search query"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Field Scope Quick Pills */}
            <div className="flex items-center space-x-1 bg-white border border-[#E2E8F0] p-1 rounded-xl shrink-0 overflow-x-auto shadow-2xs">
              {[
                { id: 'ALL', label: 'All Fields' },
                { id: 'NAME', label: 'Customer Name' },
                { id: 'COMPANY', label: 'Company Name' },
                { id: 'PHONE', label: 'Contact Phone' }
              ].map((scope) => (
                <button
                  key={scope.id}
                  type="button"
                  onClick={() => setSearchScope(scope.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    searchScope === scope.id
                      ? 'bg-[#0F172A] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {scope.label}
                </button>
              ))}
            </div>

          </div>

          {/* Bottom Row: Detailed Dropdown Filters, Reset & Result Count */}
          <div className="flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between pt-2 border-t border-slate-200/60">
            
            {/* Filter Dropdowns */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center flex-1">
              {/* Quick Filter Category */}
              <select
                value={viewFilter}
                onChange={(e: any) => setViewFilter(e.target.value)}
                className="border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer hover:border-slate-300"
                title="Filter customer categories"
              >
                <option value="ALL">All View Categories</option>
                <option value="TRN_REGISTERED">TRN Registered Only</option>
                <option value="UNREGISTERED">Unregistered / Non-VAT</option>
                <option value="WITH_CONTACTS">Has Phone or Email</option>
                <option value="WITH_LOCATION">Has Emirate / Address</option>
                <option value="HAS_OUTSTANDING">Has Outstanding Receivables</option>
                <option value="OVERDUE_ONLY">Overdue Accounts Only</option>
                <option value="HAS_INVOICES">Has Issued Invoices</option>
              </select>

              {/* Location Filter */}
              <select
                value={emirateFilter}
                onChange={(e) => setEmirateFilter(e.target.value)}
                className="border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer hover:border-slate-300"
                title="Filter by City or Location"
              >
                <option value="ALL">All Cities & Locations</option>
                {countryCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="Other">Other Locations</option>
              </select>

              {/* Tax Status Filter */}
              {isVatEnabled && (
                <select
                  value={taxFilter}
                  onChange={(e: any) => setTaxFilter(e.target.value)}
                  className="border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer hover:border-slate-300"
                  title="Filter by Tax Status"
                >
                  <option value="ALL">All Tax Statuses</option>
                  <option value="REGISTERED">Registered Taxpayer ({countryConfig.taxIdShortLabel})</option>
                  <option value="PROVISIONAL">Provisional / Temp {countryConfig.taxIdShortLabel}</option>
                  <option value="UNREGISTERED">Unregistered / Non-{countryConfig.taxName}</option>
                </select>
              )}

              {/* Ledger Balance Filter */}
              <select
                value={balanceFilter}
                onChange={(e: any) => setBalanceFilter(e.target.value)}
                className="border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer hover:border-slate-300"
                title="Filter by Ledger Balance"
              >
                <option value="ALL">All Balances</option>
                <option value="OUTSTANDING">Outstanding Receivables</option>
                <option value="OVERDUE">Overdue Receivables</option>
                <option value="ZERO">Zero Balance / Paid Up</option>
              </select>

              {/* Clear Filters Button */}
              {(search || searchScope !== 'ALL' || viewFilter !== 'ALL' || emirateFilter !== 'ALL' || taxFilter !== 'ALL' || balanceFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setSearchScope('ALL');
                    setViewFilter('ALL');
                    setEmirateFilter('ALL');
                    setTaxFilter('ALL');
                    setBalanceFilter('ALL');
                  }}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer shrink-0 border border-rose-200"
                  title="Reset all search queries & filters"
                >
                  <X className="w-3.5 h-3.5 text-rose-600" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

            {/* Right Group: Count Badge & Column Chooser */}
            <div className="flex items-center space-x-2.5 shrink-0 justify-between xl:justify-end">
              <span className="text-xs font-mono text-indigo-900 bg-indigo-50 border border-indigo-200/80 px-3 py-1.5 rounded-lg shrink-0 font-bold flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Showing {filteredCustomers.length} of {companyCustomers.length} Customers</span>
              </span>

              {/* Column Chooser Button / ⚙️ Settings */}
              <div className="relative inline-block text-left shrink-0">
                <button
                  type="button"
                  onClick={() => setShowColChooser(!showColChooser)}
                  className="bg-white hover:bg-slate-50 border border-[#E2E8F0] p-2 rounded-lg cursor-pointer transition-colors shadow-xs flex items-center"
                  title="Table settings & column chooser"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                </button>

                {showColChooser && (
                  <>
                    <div className="fixed inset-0 z-45" onClick={() => setShowColChooser(false)} />
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-150 shadow-xl z-50 p-4 animate-fade-in text-xs text-slate-700">
                      <p className="font-bold text-slate-900 mb-2.5 pb-1 border-b border-slate-100 uppercase tracking-wider text-[10px] font-mono">Customer Columns</p>
                      <div className="space-y-2">
                        {[
                          { key: 'client', label: 'Customer Details' },
                          { key: 'trn', label: 'TRN Registration' },
                          { key: 'emirate', label: 'Emirate Location' },
                          { key: 'phone', label: 'Phone & Contacts' },
                          { key: 'financials', label: 'Outstandings & Sales' }
                        ].map((col) => (
                          <label key={col.key} className="flex items-center space-x-2.5 cursor-pointer hover:bg-slate-50 p-1.5 rounded-md transition-colors select-none font-medium">
                            <input
                              type="checkbox"
                              checked={(cols as any)[col.key]}
                              onChange={(e) => {
                                const updated = { ...cols, [col.key]: e.target.checked };
                                setCols(updated);
                                localStorage.setItem('hisaab_cols_clients', JSON.stringify(updated));
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span>{col.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Directory List Table */}
        {filteredCustomers.length === 0 ? (
          <div className="py-16 text-center bg-white border border-[#E2E8F0] rounded-xl shadow-xs p-8 max-w-2xl mx-auto my-8 animate-fade-in">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-xs">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-[#0F172A] tracking-tight font-sans">No Customers Registered</h3>
            <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
              Onboard corporate accounts and private clients to manage compliant 5% VAT tax invoices, trace outstanding receivables, and generate double-entry financial ledger histories.
            </p>
            <div className="mt-6 flex justify-center">
              <button
                id="btn-empty-state-add-customer"
                onClick={openAddModal}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer uppercase tracking-wider font-sans"
              >
                <Plus className="w-4 h-4" />
                <span>Onboard First Customer</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-slate-500 text-[10px] uppercase font-mono tracking-wider font-bold">
                  {cols.client && <th className="py-3 px-4 font-bold">Customer Details</th>}
                  {cols.trn && <th className="py-3 px-4 font-bold">Tax & TIN codes</th>}
                  {cols.phone && <th className="py-3 px-4 font-bold">Contact Details</th>}
                  {cols.emirate && <th className="py-3 px-4 font-bold">Address & Location</th>}
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-xs">
                {filteredCustomers.map((cust, idx) => {
                  const isSelected = selectedIdx === idx;
                  return (
                    <tr 
                      key={cust.id} 
                      id={`cust-row-${cust.id}`}
                      tabIndex={0}
                      onFocus={() => setSelectedIdx(idx)}
                      className={`transition-colors cursor-pointer outline-hidden focus:outline-hidden ${
                        isSelected 
                          ? 'bg-indigo-50/80 border-l-4 border-l-indigo-600 font-semibold' 
                          : 'hover:bg-[#F8FAFC]/45'
                      }`}
                    >
                    {cols.client && (
                      <td className="py-4 px-4 font-sans">
                        <div 
                          onClick={() => setSelectedCustomerDetail(cust)}
                          className="font-sans font-bold text-[#0F172A] hover:text-[#4F46E5] text-sm italic hover:underline cursor-pointer"
                        >
                          {cust.name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">ID: {cust.id}</div>
                        {cust.customerCode && (
                          <div className="text-[10px] text-indigo-600 font-bold font-mono">Code: {cust.customerCode}</div>
                        )}
                        {(cust.firstName || cust.lastName) && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Contact: {[cust.firstName, cust.lastName].filter(Boolean).join(' ')}
                          </div>
                        )}
                        {cust.companyName && (
                          <div className="text-[10px] text-slate-500">
                            Company: {cust.companyName}
                          </div>
                        )}
                      </td>
                    )}
                    {cols.trn && (
                      <td className="py-4 px-4 space-y-1 font-mono">
                        {cust.trn ? (
                          <div className="flex items-center">
                            <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 text-[9px] rounded-lg border border-emerald-200 font-bold">
                              UAE TRN: {cust.trn}
                            </span>
                          </div>
                        ) : cust.salesTaxNumber ? (
                          <div className="flex items-center">
                            <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 text-[9px] rounded-lg border border-emerald-200 font-bold">
                              Tax No: {cust.salesTaxNumber}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">No Tax Reg</span>
                        )}
                        {cust.tinNumber && (
                          <div className="text-[9px] text-slate-600 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.5 inline-block">
                            TIN: {cust.tinNumber}
                          </div>
                        )}
                      </td>
                    )}
                    {cols.phone && (
                      <td className="py-4 px-4 space-y-1">
                        {cust.email && (
                          <div className="flex items-center space-x-1 text-slate-600">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{cust.email}</span>
                          </div>
                        )}
                        {cust.phone && (
                          <div className="flex items-center space-x-1 text-slate-600">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{cust.phone} (P)</span>
                          </div>
                        )}
                        {cust.mobileNumber && (
                          <div className="flex items-center space-x-1 text-slate-600">
                            <Phone className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>{cust.mobileNumber} (M)</span>
                          </div>
                        )}
                        {cust.website && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            <span className="font-mono">Web: </span>
                            <a href={cust.website.startsWith('http') ? cust.website : `https://${cust.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-[#4F46E5] font-medium">{cust.website}</a>
                          </div>
                        )}
                      </td>
                    )}
                    {cols.emirate && (
                      <td className="py-4 px-4 space-y-1">
                        {cust.address && (
                          <div className="flex items-center space-x-1 text-slate-700">
                            <Navigation className="w-3.5 h-3.5 text-indigo-600 rotate-45 shrink-0" />
                            <span className="truncate max-w-xs font-medium">{cust.address}</span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1 items-center mt-1">
                          {cust.emirate && (
                            <span className="text-[9px] font-bold bg-[#F8FAFC] border border-[#E2E8F0] text-slate-600 px-1.5 py-0.5 rounded-lg uppercase font-mono flex items-center space-x-0.5">
                              <MapPin className="w-2.5 h-2.5 text-rose-500 inline" />
                              <span>{cust.emirate}</span>
                            </span>
                          )}
                          {cust.city && (
                            <span className="text-[9px] font-bold bg-[#F8FAFC] border border-[#E2E8F0] text-slate-600 px-1.5 py-0.5 rounded-lg uppercase font-mono">
                              {cust.city}
                            </span>
                          )}
                          {cust.country && (
                            <span className="text-[9px] font-bold bg-[#F8FAFC] border border-[#E2E8F0] text-slate-600 px-1.5 py-0.5 rounded-lg uppercase font-mono">
                              {cust.country}
                            </span>
                          )}
                          {cust.postalCode && (
                            <span className="text-[9px] font-bold bg-[#F8FAFC] border border-[#E2E8F0] text-slate-600 px-1.5 py-0.5 rounded-lg font-mono">
                              ZIP: {cust.postalCode}
                            </span>
                          )}
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([cust.address, cust.emirate, cust.country].filter(Boolean).join(', '))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[9px] font-bold bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded-lg font-mono inline-flex items-center space-x-1 transition-colors"
                            title="Location check on Google Maps"
                          >
                            <Navigation className="w-2.5 h-2.5 rotate-45" />
                            <span>Location Check</span>
                          </a>
                          {(cust.paymentTerms || cust.paymentMethod) && (
                            <span className="text-[9px] font-bold bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded-lg font-mono">
                              Terms & Method: {cust.paymentTerms && cust.paymentMethod && cust.paymentTerms !== cust.paymentMethod
                                ? `${cust.paymentTerms} (${cust.paymentMethod})`
                                : (cust.paymentTerms || cust.paymentMethod)}
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onCreateInvoiceForCustomer) {
                              onCreateInvoiceForCustomer(cust.id);
                            } else if (onViewInvoice) {
                              onViewInvoice('new');
                            }
                          }}
                          className="px-2.5 py-1.5 bg-[#0F172A] hover:bg-[#4F46E5] text-white font-bold rounded-lg text-xs inline-flex items-center space-x-1.5 cursor-pointer transition-all shadow-xs"
                          title={`Create new invoice for ${cust.name}`}
                        >
                          <Plus className="w-3.5 h-3.5 text-indigo-300" />
                          <span>+ Add Invoice</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (company) {
                              const cDocs = documents.filter(d => d.customerId === cust.id);
                              const totalInv = cDocs.filter(d => d.type === 'Invoice').reduce((sum, d) => sum + (d.total || 0), 0);
                              const totalPaid = cDocs.filter(d => d.type === 'Invoice').reduce((sum, d) => sum + (d.paymentReceived || 0), 0);
                              const pendingBalance = (cust.openingBalance || 0) + totalInv - totalPaid;
                              const { url, messageText } = generateCustomerStatementWhatsAppMessage(
                                cust,
                                company,
                                pendingBalance,
                                cDocs
                              );
                              openDirectWhatsApp(url, messageText, cust.name);
                            }
                          }}
                          className="p-1.5 hover:bg-[#25D366]/10 rounded-lg text-slate-500 hover:text-[#25D366] inline-block cursor-pointer transition-colors"
                          title="Share balance & statement via WhatsApp"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.413 9.863-9.864.001-2.641-1.025-5.125-2.889-6.991C16.581 1.884 14.09 1.857 11.455 1.857c-5.437 0-9.863 4.414-9.866 9.865-.001 1.84.482 3.633 1.4 5.2l-.372 1.36 1.397-.366zm13.111-6.126c-.287-.144-1.702-.84-1.965-.936-.264-.096-.456-.144-.648.144-.192.288-.744.936-.912 1.128-.168.192-.336.216-.624.072-.288-.144-1.215-.447-2.316-1.428-.856-.764-1.433-1.706-1.6-1.994-.168-.288-.018-.444.126-.586.13-.128.288-.336.432-.504.144-.168.192-.288.288-.48.096-.192.048-.36-.024-.504-.072-.144-.648-1.56-.888-2.136-.233-.561-.47-.485-.648-.494-.168-.008-.36-.01-.552-.01s-.504.072-.768.36c-.264.288-1.008.984-1.008 2.4 0 1.416 1.032 2.784 1.176 2.976.144.192 2.031 3.102 4.921 4.349.687.296 1.224.474 1.643.607.69.219 1.32.188 1.817.114.553-.082 1.702-.696 1.944-1.368.24-.672.24-1.248.168-1.368-.072-.12-.264-.192-.552-.336z"/>
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomerDetail(cust);
                          }}
                          className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 hover:text-emerald-700 inline-block cursor-pointer transition-colors"
                          title="View Customer Profile & Statement of Account"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(cust);
                          }}
                          className="p-1.5 hover:bg-[#F8FAFC] rounded-lg text-slate-600 hover:text-[#4F46E5] inline-block cursor-pointer transition-colors"
                          title="Edit profile"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCustomer(cust.id);
                          }}
                          className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 inline-block cursor-pointer transition-colors"
                          title="Delete customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ); })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto no-print">
          <div className="bg-[#F8FAFC] dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-[#E2E8F0] dark:border-slate-800 animate-zoom-in my-auto">
            {/* Modal Header */}
            <div className="bg-[#0F172A] text-white p-4 flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-[#4F46E5]" />
                <h3 className="text-xs font-bold uppercase tracking-widest font-sans text-[#4F46E5]">
                  {editingCustomer ? 'Modify Customer Profile' : 'Register New Customer'}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer transition-colors p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 text-xs flex-1 overflow-y-auto font-sans">
              
              {/* TOP HEADER: UNIQUE CUSTOMER CODE */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 rounded-xl border border-slate-800 shadow-md flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center font-mono font-bold text-indigo-300 text-sm shrink-0">
                    #
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-300 font-bold">
                        Unique Customer Code
                      </span>
                      <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Unique Active
                      </span>
                    </div>
                    <div className="text-base font-black font-mono tracking-wider text-white mt-0.5">
                      {customerCode || generateNextCustomerCode()}
                    </div>
                  </div>
                </div>
                <div className="text-right text-[10px] text-slate-400 font-mono hidden sm:block">
                  Auto-Sequenced System ID
                </div>
              </div>

              {/* SECTION 1: Contact Identity Details */}
              <div>
                <h4 className="font-sans font-bold text-[#0F172A] text-sm italic border-b border-[#E2E8F0] pb-1.5 mb-3">
                  Contact Identity Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Contact Person Name</label>
                    <input
                      id="form-customer-contactname"
                      type="text"
                      placeholder="e.g., Ahmed Al-Mansoori"
                      value={contactPersonName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setContactPersonName(val);
                        const parts = val.trim().split(' ');
                        setFirstName(parts[0] || '');
                        setLastName(parts.slice(1).join(' ') || '');
                      }}
                      className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-xs font-sans text-slate-800 focus:border-[#4F46E5] focus:outline-hidden transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Customer Code</label>
                    <input
                      type="text"
                      placeholder="Auto-generated"
                      value={customerCode}
                      onChange={(e) => setCustomerCode(e.target.value)}
                      className="w-full border border-[#E2E8F0] bg-slate-50 rounded-lg px-3 py-2 text-xs font-mono font-bold text-indigo-700 focus:border-[#4F46E5] focus:outline-hidden transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Company / Business Details */}
              <div>
                <h4 className="font-sans font-bold text-[#0F172A] text-sm italic border-b border-[#E2E8F0] pb-1.5 mb-3">
                  {isVatEnabled ? `${countryConfig.taxName} & Business Registration` : 'Business & Customer Details'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Customer Legal Name <span className="text-red-500">*</span></label>
                    <input
                      id="form-customer-companyname"
                      type="text"
                      required
                      placeholder="e.g., Burj Arab Logistics FZ-LLC"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-xs font-sans text-slate-800 focus:border-[#4F46E5] focus:outline-hidden transition-colors"
                    />
                  </div>
                  {isVatEnabled && (
                    <div className="md:col-span-2 space-y-3">
                      <div className="flex justify-between items-baseline">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          {countryConfig.taxName} Status Selection
                        </label>
                        <span className="text-[10px] font-mono font-bold text-slate-400">{countryConfig.taxAuthorityShort} Classification</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Option 1: Has VAT Number */}
                        <div
                          onClick={() => {
                            setFormVatStatus('yes');
                            setTrn('');
                          }}
                          className={`relative group cursor-pointer rounded-xl p-3.5 border transition-all duration-200 flex flex-col justify-between ${
                            formVatStatus === 'yes'
                              ? 'bg-gradient-to-br from-indigo-50/90 via-white to-indigo-50/50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                              : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/60 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                              formVatStatus === 'yes' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                            }`}>
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              formVatStatus === 'yes' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : 'bg-slate-100 text-slate-500'
                            }`}>
                              15-Digit TRN
                            </span>
                          </div>

                          <div>
                            <h5 className={`font-bold text-xs ${formVatStatus === 'yes' ? 'text-indigo-950' : 'text-slate-800'}`}>
                              Has VAT Number
                            </h5>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-sans leading-tight">
                              Registered business taxpayer with active UAE Tax Registration Number.
                            </p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                            <span className="font-mono text-slate-400 text-[9px]">Standard Tax Invoice</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              formVatStatus === 'yes' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                            }`}>
                              {formVatStatus === 'yes' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                          </div>
                        </div>

                        {/* Option 2: No VAT (Consumer) */}
                        <div
                          onClick={() => {
                            setFormVatStatus('no');
                            setTrn('');
                          }}
                          className={`relative group cursor-pointer rounded-xl p-3.5 border transition-all duration-200 flex flex-col justify-between ${
                            formVatStatus === 'no'
                              ? 'bg-gradient-to-br from-amber-50/90 via-white to-amber-50/50 border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                              : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-slate-50/60 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                              formVatStatus === 'no' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                            }`}>
                              <Info className="w-4 h-4" />
                            </div>
                            <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              formVatStatus === 'no' ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-slate-100 text-slate-500'
                            }`}>
                              B2C Consumer
                            </span>
                          </div>

                          <div>
                            <h5 className={`font-bold text-xs ${formVatStatus === 'no' ? 'text-amber-950' : 'text-slate-800'}`}>
                              No VAT (Consumer)
                            </h5>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-sans leading-tight">
                              Unregistered individual or non-taxable entity. Issued simplified invoice.
                            </p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                            <span className="font-mono text-slate-400 text-[9px]">Simplified B2C Sales</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              formVatStatus === 'no' ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300'
                            }`}>
                              {formVatStatus === 'no' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                          </div>
                        </div>

                        {/* Option 3: VAT Pending [TEMP] */}
                        <div
                          onClick={() => {
                            setFormVatStatus('pending');
                            const nextId = generateNextTempId();
                            setTrn(nextId);
                          }}
                          className={`relative group cursor-pointer rounded-xl p-3.5 border transition-all duration-200 flex flex-col justify-between ${
                            formVatStatus === 'pending'
                              ? 'bg-gradient-to-br from-rose-50/90 via-white to-rose-50/50 border-rose-500 ring-2 ring-rose-500/20 shadow-md'
                              : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-slate-50/60 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                              formVatStatus === 'pending' ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                            }`}>
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                            <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              formVatStatus === 'pending' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-slate-100 text-slate-500'
                            }`}>
                              FTA Suspense
                            </span>
                          </div>

                          <div>
                            <h5 className={`font-bold text-xs ${formVatStatus === 'pending' ? 'text-rose-950' : 'text-slate-800'}`}>
                              VAT Pending [TEMP]
                            </h5>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-sans leading-tight">
                              Provisional status (5-day FTA rule). VAT routed to Suspense Account 2260.
                            </p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                            <span className="font-mono text-rose-600 font-bold text-[9px]">Provisional Ledger</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              formVatStatus === 'pending' ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-300'
                            }`}>
                              {formVatStatus === 'pending' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                          </div>
                        </div>
                      </div>

                      {formVatStatus === 'yes' && (
                        <div className="space-y-1 animate-fade-in mt-3 p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">{trnLabel} <span className="text-red-500">*</span></label>
                          <input
                            id="form-customer-trn"
                            type="text"
                            required
                            maxLength={trnMaxLength}
                            minLength={trnMinLength}
                            placeholder={trnPlaceholder}
                            value={trn}
                            onChange={(e) => setTrn(e.target.value)}
                            className="w-full border border-indigo-200 rounded-lg px-3 py-2 bg-white font-mono text-xs focus:border-[#4F46E5] focus:outline-hidden transition-colors font-bold text-slate-900"
                          />
                        </div>
                      )}

                      {formVatStatus === 'pending' && (
                        <div className="space-y-2 p-3 bg-rose-50/60 border border-rose-200 rounded-xl animate-fade-in mt-3">
                          <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>VAT Registration No. Pending (Update within 5 days)</span>
                          </div>
                          <div className="text-[11px] text-slate-700 font-mono">
                            Auto-Assigned Temp ID: <span className="bg-white px-2 py-0.5 rounded border border-rose-300 font-bold text-rose-900">{trn || 'Generating...'}</span>
                          </div>
                          <p className="text-[10px] text-slate-600 leading-normal">
                            Provisional customer profile created. Output VAT for sales invoices will be posted to Suspense Account 2260 until formal TRN is verified.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Customer Trade License / Sales Tax No. <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., TL-99182-DB"
                      value={salesTaxNumber}
                      onChange={(e) => setSalesTaxNumber(e.target.value)}
                      className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-xs font-sans text-slate-800 focus:border-[#4F46E5] focus:outline-hidden transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Contacts */}
              <div>
                <h4 className="font-sans font-bold text-[#0F172A] text-sm italic border-b border-[#E2E8F0] pb-1.5 mb-3 flex items-center justify-between">
                  <span>Contact Information</span>
                  {(duplicateEmailCustomer || duplicatePhoneCustomer || duplicateMobileCustomer) && (
                    <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md flex items-center space-x-1 animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Duplicate Record Detected</span>
                    </span>
                  )}
                </h4>

                {(duplicateEmailCustomer || duplicatePhoneCustomer || duplicateMobileCustomer) && (
                  <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2.5 animate-fade-in text-xs text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold">Duplicate Contact Information Detected</p>
                      <div className="text-[11px] text-amber-800 space-y-0.5">
                        {duplicateEmailCustomer && (
                          <p>• Email address ({email}) is already linked to <strong className="font-mono">{duplicateEmailCustomer.name}</strong> ({duplicateEmailCustomer.customerCode || 'No Code'}).</p>
                        )}
                        {duplicatePhoneCustomer && (
                          <p>• Phone number ({phone}) is already registered to <strong className="font-mono">{duplicatePhoneCustomer.name}</strong> ({duplicatePhoneCustomer.customerCode || 'No Code'}).</p>
                        )}
                        {duplicateMobileCustomer && duplicateMobileCustomer.id !== duplicatePhoneCustomer?.id && (
                          <p>• Mobile number ({mobileNumber}) is already registered to <strong className="font-mono">{duplicateMobileCustomer.name}</strong> ({duplicateMobileCustomer.customerCode || 'No Code'}).</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email Field */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">Email Address</label>
                      {duplicateEmailCustomer ? (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-100/90 px-1.5 py-0.5 rounded flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>Duplicate Email</span>
                        </span>
                      ) : cleanEmail && (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Unique Email</span>
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        id="form-customer-email"
                        type="email"
                        placeholder="e.g., finance@company.ae"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full border rounded-lg px-3 py-2 bg-white focus:outline-hidden transition-colors ${
                          duplicateEmailCustomer
                            ? 'border-amber-400 focus:border-amber-500 ring-2 ring-amber-100 font-medium'
                            : 'border-[#E2E8F0] focus:border-[#4F46E5]'
                        }`}
                      />
                      {duplicateEmailCustomer && (
                        <AlertTriangle className="w-4 h-4 text-amber-600 absolute right-3 top-2.5 pointer-events-none shrink-0" />
                      )}
                    </div>
                    {duplicateEmailCustomer && (
                      <p className="text-[10px] text-amber-700 font-medium mt-1 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3 shrink-0 text-amber-600" />
                        <span>Matches: <strong>{duplicateEmailCustomer.name}</strong></span>
                      </p>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">Phone Number</label>
                      {duplicatePhoneCustomer ? (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-100/90 px-1.5 py-0.5 rounded flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>Duplicate Phone</span>
                        </span>
                      ) : cleanPhone.length >= 4 && (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Unique Phone</span>
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        id="form-customer-phone"
                        type="text"
                        placeholder="e.g., +971 4 321 0987"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`w-full border rounded-lg px-3 py-2 bg-white focus:outline-hidden transition-colors ${
                          duplicatePhoneCustomer
                            ? 'border-amber-400 focus:border-amber-500 ring-2 ring-amber-100 font-medium'
                            : 'border-[#E2E8F0] focus:border-[#4F46E5]'
                        }`}
                      />
                      {duplicatePhoneCustomer && (
                        <AlertTriangle className="w-4 h-4 text-amber-600 absolute right-3 top-2.5 pointer-events-none shrink-0" />
                      )}
                    </div>
                    {duplicatePhoneCustomer && (
                      <p className="text-[10px] text-amber-700 font-medium mt-1 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3 shrink-0 text-amber-600" />
                        <span>Matches: <strong>{duplicatePhoneCustomer.name}</strong></span>
                      </p>
                    )}
                  </div>

                  {/* Mobile Number Field */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">Mobile Number</label>
                      {duplicateMobileCustomer ? (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-100/90 px-1.5 py-0.5 rounded flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>Duplicate Mobile</span>
                        </span>
                      ) : cleanMobile.length >= 4 && (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Unique Mobile</span>
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        id="form-customer-mobile"
                        type="text"
                        placeholder="e.g., +971 50 123 4567"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className={`w-full border rounded-lg px-3 py-2 bg-white focus:outline-hidden transition-colors ${
                          duplicateMobileCustomer
                            ? 'border-amber-400 focus:border-amber-500 ring-2 ring-amber-100 font-medium'
                            : 'border-[#E2E8F0] focus:border-[#4F46E5]'
                        }`}
                      />
                      {duplicateMobileCustomer && (
                        <AlertTriangle className="w-4 h-4 text-amber-600 absolute right-3 top-2.5 pointer-events-none shrink-0" />
                      )}
                    </div>
                    {duplicateMobileCustomer && (
                      <p className="text-[10px] text-amber-700 font-medium mt-1 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3 shrink-0 text-amber-600" />
                        <span>Matches: <strong>{duplicateMobileCustomer.name}</strong></span>
                      </p>
                    )}
                  </div>

                  {/* Website Field */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Website</label>
                    <input
                      id="form-customer-website"
                      type="text"
                      placeholder="e.g., www.company.ae"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white focus:border-[#4F46E5] focus:outline-hidden transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: Address & Billing Preference */}
              <div>
                <h4 className="font-sans font-bold text-[#0F172A] text-sm italic border-b border-[#E2E8F0] pb-1.5 mb-3">
                  Address, Location & Financial Preferences
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Billing / Shipping Address</label>
                    <textarea
                      id="form-customer-address"
                      rows={2}
                      placeholder="e.g., Warehouse 12, Jebel Ali Free Zone"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white focus:border-[#4F46E5] focus:outline-hidden transition-colors resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Country <span className="text-red-500">*</span></label>
                    <input
                      id="form-customer-country"
                      type="text"
                      required
                      placeholder="e.g., United Arab Emirates"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white focus:border-[#4F46E5] focus:outline-hidden transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Postal Code</label>
                    <input
                      id="form-customer-postal"
                      type="text"
                      placeholder="e.g., 12345 (Optional)"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white font-mono focus:border-[#4F46E5] focus:outline-hidden transition-colors"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        {gccCountry === 'UAE' ? 'Emirate / City' : `${countryConfig.regionTypeName} / City`} <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAddCityInput(!showAddCityInput)}
                        className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-0.5 cursor-pointer uppercase tracking-wider"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>{showAddCityInput ? 'Close' : 'Add City'}</span>
                      </button>
                    </div>

                    {showAddCityInput && (
                      <div className="flex items-center space-x-1 mb-2">
                        <input
                          type="text"
                          placeholder="Enter new city name..."
                          value={manualCityName}
                          onChange={(e) => setManualCityName(e.target.value)}
                          className="flex-1 border border-indigo-200 rounded-lg px-2.5 py-1.5 bg-white text-xs text-slate-800 focus:outline-hidden focus:border-indigo-600 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = manualCityName.trim();
                            if (trimmed) {
                              if (!customCities.includes(trimmed)) {
                                const updated = [...customCities, trimmed];
                                setCustomCities(updated);
                                try { localStorage.setItem('hisaab_custom_cities', JSON.stringify(updated)); } catch (e) {}
                              }
                              setEmirate(trimmed);
                              setManualCityName('');
                              setShowAddCityInput(false);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    )}

                    <select
                      id="form-customer-emirate"
                      required
                      value={emirate}
                      onChange={(e) => {
                        if (e.target.value === '__add_new__') {
                          setShowAddCityInput(true);
                        } else {
                          setEmirate(e.target.value);
                        }
                      }}
                      className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white focus:border-[#4F46E5] focus:outline-hidden transition-colors"
                    >
                      <option value="">-- Select {countryConfig.regionTypeName} / City * --</option>
                      {countryCities.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                      <option value="__add_new__">+ Add Custom City / Region...</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Payment Terms & Method</label>
                    <select
                      id="form-customer-payment-terms-method"
                      value={paymentTerms || paymentMethod || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPaymentTerms(val);
                        setPaymentMethod(val);
                      }}
                      className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white focus:border-[#4F46E5] focus:outline-hidden transition-colors text-xs"
                    >
                      <option value="">-- Select Payment Terms & Method (Optional) --</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Check / Cheque">Check / Cheque</option>
                      <option value="Credit / Debit Card">Credit / Debit Card</option>
                      <option value="Advance payment">Advance payment</option>
                      <option value="Due on receipt">Due on receipt</option>
                      <option value="Net 15 days">Net 15 days</option>
                      <option value="Net 30 days">Net 30 days</option>
                      <option value="Net 45 days">Net 45 days</option>
                      <option value="Net 60 days">Net 60 days</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-[#E2E8F0] dark:border-slate-800 shrink-0 sticky bottom-0 bg-[#F8FAFC] dark:bg-slate-900 z-10 pb-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-[#E2E8F0] dark:border-slate-700 rounded-lg hover:bg-[#E2E8F0]/30 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer text-xs uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-customer-submit"
                  type="submit"
                  className="px-5 py-2.5 bg-[#0F172A] hover:bg-[#4F46E5] text-white rounded-lg font-bold uppercase tracking-widest flex items-center space-x-1.5 transition-colors cursor-pointer shadow-md font-sans"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>{editingCustomer ? 'Update Profile' : 'Save Customer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          INTERACTIVE CUSTOMER LEDGER STATEMENT MODAL
          ========================================== */}
      {ledgerCustomer && (() => {
        // Filter documents for this customer
        const custDocs = companyDocuments.filter(d => d.customerId === ledgerCustomer.id)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let runningBalance = 0;
        let totalInvoiced = 0;
        let totalPaid = 0;

        const list = custDocs.map(doc => {
          const isInvoice = doc.type === 'Invoice';
          const isCreditNote = doc.type === 'CreditNote';
          const isPaid = doc.status === 'Paid';

          let debit = 0;
          let credit = 0;

          if (isInvoice) {
            debit = doc.total;
            credit = isPaid ? doc.total : 0;
            totalInvoiced += debit;
            totalPaid += credit;
            runningBalance += (debit - credit);
          } else if (isCreditNote) {
            debit = -Math.abs(doc.total);
            credit = 0;
            totalInvoiced += debit;
            runningBalance += debit;
          }

          return {
            id: doc.id,
            date: doc.date,
            docNumber: doc.docNumber,
            type: doc.type,
            status: doc.status,
            debit,
            credit,
            runningBalance
          };
        });

        const outstanding = totalInvoiced - totalPaid;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto backdrop-blur-xs animate-fade-in">
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
              
              {/* Header */}
              <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-emerald-100 dark:bg-emerald-950 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono">Statement of Account</h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Customer Ledger History</p>
                  </div>
                </div>
                <button
                  onClick={() => setLedgerCustomer(null)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content Container */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 dark:text-slate-300">
                
                {/* Customer Profile Banner */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 border border-slate-100 dark:border-slate-800/80 rounded-xl text-xs">
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 font-mono">Client Details</div>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">{ledgerCustomer.name}</div>
                    {ledgerCustomer.companyName && <div className="text-slate-500 dark:text-slate-400 font-medium">Company: {ledgerCustomer.companyName}</div>}
                    {ledgerCustomer.trn && <div className="text-slate-500 dark:text-slate-400 font-mono">TRN: {ledgerCustomer.trn}</div>}
                  </div>
                  <div className="space-y-1 md:text-right">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 font-mono">Contact Information</div>
                    {ledgerCustomer.email && <div className="text-slate-500 dark:text-slate-400">Email: {ledgerCustomer.email}</div>}
                    {ledgerCustomer.phone && <div className="text-slate-500 dark:text-slate-400 font-mono">Phone: {ledgerCustomer.phone}</div>}
                    {ledgerCustomer.address && <div className="text-slate-500 dark:text-slate-400 truncate">{ledgerCustomer.address}</div>}
                  </div>
                </div>

                {/* Bento Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 p-4 rounded-xl">
                    <div className="text-[9px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400 font-mono">Total Sales (Debit)</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-1">AED {totalInvoiced.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">All tax invoices generated</div>
                  </div>
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-xl">
                    <div className="text-[9px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">Total Collected (Credit)</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-1">AED {totalPaid.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">Settled payments received</div>
                  </div>
                  <div className={`p-4 rounded-xl border ${outstanding > 0 ? 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30' : 'bg-slate-50/50 dark:bg-slate-900/10 border-slate-100 dark:border-slate-800'}`}>
                    <div className={`text-[9px] uppercase font-bold tracking-wider font-mono ${outstanding > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}`}>Outstanding Balance</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-1">AED {outstanding.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">Net pending collections</div>
                  </div>
                </div>

                {/* Ledger Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs uppercase font-bold text-slate-800 dark:text-slate-200 tracking-wider font-mono">Ledger History Log</h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          const csvRows = [
                            ["Date", "Document", "Type", "Debit (Sales)", "Credit (Paid)", "Running Balance"].join(",")
                          ];
                          list.forEach(row => {
                            csvRows.push([row.date, row.docNumber, row.type, row.debit, row.credit, row.runningBalance].join(","));
                          });
                          const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join("\n"));
                          const link = document.createElement("a");
                          link.setAttribute("href", csvContent);
                          link.setAttribute("download", `Ledger_${ledgerCustomer.name.replace(/\s+/g, '_')}.csv`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-2.5 py-1.5 rounded-lg border border-slate-250 dark:border-slate-700 flex items-center space-x-1 cursor-pointer transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>CSV Export</span>
                      </button>
                      <button
                        onClick={() => {
                          if (company && ledgerCustomer) {
                            const cDocs = documents.filter(d => d.customerId === ledgerCustomer.id);
                            const { url, messageText } = generateCustomerStatementWhatsAppMessage(
                              ledgerCustomer,
                              company,
                              outstanding,
                              cDocs
                            );
                            openDirectWhatsApp(url, messageText, ledgerCustomer.name);
                          }
                        }}
                        className="text-[10px] bg-[#25D366] hover:bg-[#25D366]/90 text-white font-bold px-2.5 py-1.5 rounded-lg shadow-sm flex items-center space-x-1.5 cursor-pointer transition-all shrink-0"
                        title="Send Statement of Account directly to customer via WhatsApp"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.413 9.863-9.864.001-2.641-1.025-5.125-2.889-6.991C16.581 1.884 14.09 1.857 11.455 1.857c-5.437 0-9.863 4.414-9.866 9.865-.001 1.84.482 3.633 1.4 5.2l-.372 1.36 1.397-.366zm13.111-6.126c-.287-.144-1.702-.84-1.965-.936-.264-.096-.456-.144-.648.144-.192.288-.744.936-.912 1.128-.168.192-.336.216-.624.072-.288-.144-1.215-.447-2.316-1.428-.856-.764-1.433-1.706-1.6-1.994-.168-.288-.018-.444.126-.586.13-.128.288-.336.432-.504.144-.168.192-.288.288-.48.096-.192.048-.36-.024-.504-.072-.144-.648-1.56-.888-2.136-.233-.561-.47-.485-.648-.494-.168-.008-.36-.01-.552-.01s-.504.072-.768.36c-.264.288-1.008.984-1.008 2.4 0 1.416 1.032 2.784 1.176 2.976.144.192 2.031 3.102 4.921 4.349.687.296 1.224.474 1.643.607.69.219 1.32.188 1.817.114.553-.082 1.702-.696 1.944-1.368.24-.672.24-1.248.168-1.368-.072-.12-.264-.192-.552-.336z"/>
                        </svg>
                        <span>WhatsApp</span>
                      </button>
                      <button
                        onClick={() => triggerPrint('printable-statement-body')}
                        className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-300 font-bold px-2.5 py-1.5 rounded-lg border border-indigo-150 dark:border-indigo-900/30 flex items-center space-x-1 cursor-pointer transition-all"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Statement</span>
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-150 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-150 dark:border-slate-800 text-slate-500 dark:text-slate-450 font-mono text-[9px] uppercase tracking-wider font-bold">
                          <th className="py-2.5 px-4">Date</th>
                          <th className="py-2.5 px-4">Document Ref</th>
                          <th className="py-2.5 px-4">Type</th>
                          <th className="py-2.5 px-4">Status</th>
                          <th className="py-2.5 px-4 text-right">Debit (Sales)</th>
                          <th className="py-2.5 px-4 text-right">Credit (Collected)</th>
                          <th className="py-2.5 px-4 text-right">Running Balance</th>
                          <th className="py-2.5 px-4 text-center no-print">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-400">
                        {list.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-10 text-center text-slate-400 dark:text-slate-500 italic">
                              No ledger history found. Add invoices for this client in the Sales section to initiate transactions.
                            </td>
                          </tr>
                        ) : (
                          list.map(row => (
                            <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 font-sans">
                              <td className="py-2.5 px-4 font-mono text-[10px]">{row.date}</td>
                              <td 
                                className="py-2.5 px-4 font-bold font-mono text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                onClick={() => onViewInvoice?.(row.id)}
                                title="Click to view invoice document"
                              >
                                {row.docNumber}
                              </td>
                              <td className="py-2.5 px-4">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                  row.type === 'Invoice' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400' :
                                  row.type === 'CreditNote' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800' :
                                  'bg-slate-50 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400'
                                }`}>
                                  {row.type === 'CreditNote' ? 'Credit Note' : row.type}
                                </span>
                              </td>
                              <td className="py-2.5 px-4">
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase ${
                                  row.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' :
                                  row.status === 'Unpaid' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400' :
                                  row.status === 'Cancelled' ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {row.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono text-slate-900 dark:text-slate-100">
                                {row.debit < 0 ? (
                                  <span className="text-rose-600 dark:text-rose-400 font-bold font-mono">-AED {Math.abs(row.debit).toFixed(2)}</span>
                                ) : row.debit > 0 ? (
                                  `AED ${row.debit.toFixed(2)}`
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                {row.credit > 0 ? `AED ${row.credit.toFixed(2)}` : '-'}
                              </td>
                              <td className={`py-2.5 px-4 text-right font-mono font-black ${row.runningBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                AED {row.runningBalance.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-4 text-center no-print">
                                <div className="inline-flex items-center space-x-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 rounded-lg shadow-xs">
                                  <button
                                    type="button"
                                    onClick={() => onViewInvoice?.(row.id)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                                    title="View Button / Quick View Document (👁️)"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onViewInvoice?.(row.id)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
                                    title="Quick Document Button (📄)"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onViewInvoice?.(row.id)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-amber-600 transition-colors cursor-pointer"
                                    title="Quick Print Button (🖨️)"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onViewInvoice?.(row.id)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
                                    title="Download Button (📥)"
                                  >
                                    <FileDown className="w-3.5 h-3.5" />
                                  </button>
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

              {/* Footer */}
              <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setLedgerCustomer(null)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer"
                >
                  Close Statement
                </button>
              </div>

            </div>
          </div>
        );
      })()}
      {/* BULK CLIENT CSV IMPORT MODAL */}
      {isImportLedgerModalOpen && (
        <div className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto no-print animate-fade-in">
          <div className="bg-[#F8FAFC] dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-[#E2E8F0] dark:border-slate-800 animate-zoom-in my-auto">
            
            {/* Modal Header */}
            <div className="bg-[#0F172A] text-white p-4 flex items-center justify-between shrink-0 border-b border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-widest font-sans text-[#4F46E5] flex items-center space-x-2">
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>Import Clients &amp; Bulk Data</span>
              </h3>
              <button 
                type="button"
                onClick={() => setIsImportLedgerModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer transition-colors p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form / Content */}
            <div className="p-4 sm:p-6 space-y-6 text-xs flex-1 overflow-y-auto">
              
              {/* TOP BANNER */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 rounded-xl border border-slate-800 shadow-md flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center font-mono font-bold text-indigo-300 text-sm shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-300 font-bold">
                        Bulk CSV Client Importer
                      </span>
                      <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        FTA Rule 6 Active
                      </span>
                    </div>
                    <div className="text-sm font-bold tracking-tight text-white mt-0.5">
                      Import &amp; Validate Customer Records
                    </div>
                  </div>
                </div>
                <div className="text-right text-[10px] text-slate-400 font-mono hidden sm:block">
                  Auto-Validates TRN &amp; Emirate
                </div>
              </div>

              {/* SECTION 1: Raw CSV Input */}
              <div>
                <h4 className="font-sans font-bold text-[#0F172A] text-sm italic border-b border-[#E2E8F0] pb-1.5 mb-3 flex items-center justify-between">
                  <span>CSV Data Input</span>
                  <span className="text-[10px] text-slate-500 font-mono">Header Required: CustomerName*,Phone,Emirate*,TRN,Email,OpeningBalance</span>
                </h4>
                <textarea
                  rows={5}
                  value={importRawCsvText}
                  onChange={(e) => setImportRawCsvText(e.target.value)}
                  className="w-full font-mono text-xs bg-white border border-[#E2E8F0] rounded-lg p-3 text-slate-900 focus:border-[#4F46E5] focus:outline-hidden transition-colors resize-none shadow-2xs"
                  placeholder="CustomerName*,Phone,Emirate*,TRN,Email,OpeningBalance"
                />
              </div>

              {/* SECTION 2: Validation Checks */}
              <div>
                <h4 className="font-sans font-bold text-[#0F172A] text-sm italic border-b border-[#E2E8F0] pb-1.5 mb-3 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Rule 6 Validator Compliance Checks</span>
                </h4>
                <div className="bg-white border border-[#E2E8F0] p-3.5 rounded-xl space-y-1.5 text-[11px]">
                  <ul className="list-disc list-inside text-slate-600 space-y-1 font-sans">
                    <li><strong className="text-slate-900">Mandatory Columns:</strong> CustomerName*, Emirate* (Phone is optional). Missing mandatory values will skip the row.</li>
                    <li><strong className="text-slate-900">TRN Optionality:</strong> TRN is optional. If provided, it must be exactly 15 digits. Missing TRN will flag a non-blocking compliance reminder.</li>
                  </ul>
                </div>
              </div>

              {/* SECTION 3: Live Parsed Preview */}
              <div>
                <h4 className="font-sans font-bold text-[#0F172A] text-sm italic border-b border-[#E2E8F0] pb-1.5 mb-3">
                  Live Parsed Preview &amp; Audit Trail
                </h4>
                <div className="border border-[#E2E8F0] rounded-xl overflow-x-auto max-h-48 custom-scrollbar bg-white">
                  <table className="w-full text-left font-sans text-xs">
                    <thead className="bg-[#F8FAFC] font-mono text-[10px] uppercase text-slate-600 border-b border-[#E2E8F0]">
                      <tr>
                        <th className="p-2.5">Customer Name*</th>
                        <th className="p-2.5">Phone</th>
                        <th className="p-2.5">Emirate*</th>
                        <th className="p-2.5">TRN Code</th>
                        <th className="p-2.5 text-right">Opening Balance</th>
                        <th className="p-2.5 text-center">Validation Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] font-mono text-[11px]">
                      {(() => {
                        const lines = importRawCsvText.trim().split('\n').filter(l => l.trim().length > 0);
                        if (lines.length <= 1) {
                          return (
                            <tr>
                              <td colSpan={6} className="p-4 text-center text-slate-400 italic">
                                Paste CSV data above to generate live row validation preview.
                              </td>
                            </tr>
                          );
                        }

                        const dataRows = lines.slice(1);
                        return dataRows.map((rowStr, idx) => {
                          const parts = rowStr.split(',').map(s => s.trim());
                          const cName = parts[0] || '';
                          const cPhone = parts[1] || '';
                          const cEmirate = parts[2] || '';
                          const cTrn = parts[3] || '';
                          const cEmail = parts[4] || '';
                          const cBal = parseFloat(parts[5] || '0') || 0;

                          const missingMandatory = !cName || !cEmirate;
                          const hasTrn = cTrn.length > 0;
                          const isTrn15Digits = cTrn.replace(/\D/g, '').length === 15;

                          let statusBadge = null;
                          if (missingMandatory) {
                            statusBadge = (
                              <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[9px]">
                                ❌ Missing Mandatory Field
                              </span>
                            );
                          } else if (hasTrn && !isTrn15Digits) {
                            statusBadge = (
                              <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[9px]">
                                ❌ Invalid TRN Length ({cTrn.length} digits)
                              </span>
                            );
                          } else if (!hasTrn) {
                            statusBadge = (
                              <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[9px]">
                                ⚠️ TRN missing - Update for FTA Compliance
                              </span>
                            );
                          } else {
                            statusBadge = (
                              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[9px]">
                                ✅ Valid (TRN OK)
                              </span>
                            );
                          }

                          return (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="p-2.5 font-bold text-slate-900 dark:text-white">{cName || '—'}</td>
                              <td className="p-2.5">{cPhone || '—'}</td>
                              <td className="p-2.5">{cEmirate || '—'}</td>
                              <td className="p-2.5">{cTrn || '—'}</td>
                              <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">
                                AED {cBal.toFixed(2)}
                              </td>
                              <td className="p-2.5 text-center">{statusBadge}</td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-2 p-4 border-t border-[#E2E8F0] dark:border-slate-800 shrink-0 bg-[#F8FAFC] dark:bg-slate-900 z-10">
              <button
                type="button"
                onClick={() => setIsImportLedgerModalOpen(false)}
                className="px-5 py-2.5 border border-[#E2E8F0] dark:border-slate-700 rounded-lg hover:bg-[#E2E8F0]/30 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer text-xs uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const lines = importRawCsvText.trim().split('\n').filter(l => l.trim().length > 0);
                  if (lines.length <= 1) {
                    alert('⚠️ Please enter CSV row data to import.');
                    return;
                  }

                  const dataRows = lines.slice(1);
                  let countImported = 0;

                  dataRows.forEach((rowStr) => {
                    const parts = rowStr.split(',').map(s => s.trim());
                    const cName = parts[0] || '';
                    const cPhone = parts[1] || '';
                    const cEmirate = parts[2] || '';
                    const cTrn = parts[3] || '';
                    const cEmail = parts[4] || '';
                    const cBal = parseFloat(parts[5] || '0') || 0;

                    // Mandatory check
                    if (!cName || !cEmirate) return;
                    // TRN strict check if provided
                    if (cTrn.length > 0 && cTrn.replace(/\D/g, '').length !== 15) return;

                    const validEmirate = (['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'].includes(cEmirate) ? cEmirate : 'Dubai') as any;

                    const newCust: Customer = {
                      id: `CUST-IMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                      companyId: activeCompanyId,
                      name: cName,
                      phone: cPhone || undefined,
                      emirate: validEmirate,
                      trn: cTrn || undefined,
                      email: cEmail || undefined,
                      openingBalance: cBal,
                      vatStatus: cTrn ? 'yes' : 'pending'
                    };

                    onAddCustomer(newCust);
                    countImported++;
                  });

                  alert(`🎉 Successfully imported ${countImported} customers!`);
                  setIsImportLedgerModalOpen(false);
                }}
                className="qb-btn-primary shadow-xs cursor-pointer flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Execute Bulk Import</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Delete Invoice Confirmation Modal */}
      {invoiceToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 no-print animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden text-slate-850">
            <div className="bg-rose-600 text-white p-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-xs font-bold uppercase tracking-widest font-mono">Delete Invoice Confirmation</h3>
              </div>
              <button 
                type="button"
                onClick={() => setInvoiceToDelete(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Are you sure you want to delete Invoice #{invoiceToDelete.docNumber}?
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    This will permanently remove invoice <span className="font-bold text-slate-700">{invoiceToDelete.docNumber}</span> (AED {invoiceToDelete.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}) from the customer directory and recalculate ledger balances.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInvoiceToDelete(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteInvoice) {
                      onDeleteInvoice(invoiceToDelete.id);
                    }
                    setInvoiceToDelete(null);
                  }}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-sm transition-colors flex items-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Invoice</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
