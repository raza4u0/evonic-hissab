import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { triggerPrint, downloadStandaloneHTML } from '../utils/printHelper';
import { sanitizeClonedDocForCanvas, generateAndDownloadPDF } from '../utils/pdfCanvasSanitizer';
import { 
  Plus, 
  Search, 
  Receipt, 
  Edit3, 
  Trash2, 
  X,
  PlusCircle,
  CreditCard,
  HelpCircle,
  Copy,
  Printer,
  Truck,
  ShoppingCart,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  TrendingDown,
  Scale,
  BookOpen,
  ArrowLeft,
  Calendar,
  Building,
  Info,
  FileText,
  FileCode,
  Download,
  Camera,
  Paperclip,
  UploadCloud,
  Eye,
  Settings,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Users,
  Box,
  Layers
} from 'lucide-react';
import { Expense, Staff, Company, Supplier, InventoryItem, PurchaseOrder, GoodsReceivedNote, Branch } from '../types';
import { INITIAL_SUPPLIERS, INITIAL_PURCHASE_ORDERS, INITIAL_GOODS_RECEIVED_NOTES, INITIAL_BRANCHES } from '../data/mockData';
import { ProcurementManager } from './ProcurementManager';
import { safeSetLocalStorage, safeGetLocalStorage } from '../utils/safeStorage';
import { getCountryCities, getCountryConfig } from '../utils/countryLocalization';

interface ExpenseManagerProps {
  expenses: Expense[];
  activeCompanyId: string;
  company?: Company;
  onAddExpense: (exp: Omit<Expense, 'id' | 'companyId'>) => void;
  onUpdateExpense: (exp: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onTriggerDuplicateSaza?: (
    type: 'Company' | 'Invoice' | 'Purchase' | 'Quotation',
    identifierNameOrNo: string,
    dateOrTrn: string,
    existingId: string
  ) => void;
  initialEditExpenseId?: string | null;
  onClearInitialEditExpenseId?: () => void;
  staff?: Staff[];
  staffEnabled?: boolean;
  activeSidebarItemId?: string;
  setActiveSidebarItemId?: (id: string) => void;
  inventory?: InventoryItem[];
  purchaseOrders?: PurchaseOrder[];
  goodsReceivedNotes?: GoodsReceivedNote[];
  branches?: Branch[];
  onAddPO?: (po: Omit<PurchaseOrder, 'id'>) => void;
  onUpdatePO?: (po: PurchaseOrder) => void;
  onDeletePO?: (id: string) => void;
  onAddGRN?: (grn: Omit<GoodsReceivedNote, 'id'>) => void;
  onUpdateGRN?: (grn: GoodsReceivedNote) => void;
  onDeleteGRN?: (id: string) => void;
  onAdjustStock?: (itemId: string, diff: number, reason: string) => void;
}

type ExpenseCategory = 'Rent' | 'Utilities' | 'Salaries' | 'Purchases' | 'Marketing' | 'Logistics' | 'Supplier Credit Note' | 'Debit Note' | 'Other';

export const Barcode = ({ value }: { value: string }) => {
  const CODE39_MAP: Record<string, string> = {
    '0': '101001101101',
    '1': '110100101011',
    '2': '101100101011',
    '3': '110110010101',
    '4': '101001101011',
    '5': '110100110101',
    '6': '101100110101',
    '7': '101001011011',
    '8': '110100101101',
    '9': '101100101101',
    'A': '110101001011',
    'B': '101101001011',
    'C': '110110100101',
    'D': '101011001011',
    'E': '110101100101',
    'F': '101101100101',
    'G': '101010011011',
    'H': '110101001101',
    'I': '101101001101',
    'J': '101011001101',
    'K': '110101010011',
    'L': '101101010011',
    'M': '110110101001',
    'N': '101011010011',
    'O': '110101101001',
    'P': '101101101001',
    'Q': '101010110011',
    'R': '110101011001',
    'S': '101101011001',
    'T': '101011011001',
    'U': '110010101011',
    'V': '100110101011',
    'W': '110011010101',
    'X': '100101101011',
    'Y': '110010110101',
    'Z': '100110110101',
    '-': '100101011011',
    '.': '110010101101',
    ' ': '100110101101',
    '*': '100101101101',
  };

  const cleanValue = (value || '').toUpperCase().replace(/[^A-Z0-9\-\.\s]/g, '');
  const barcodeText = `*${cleanValue}*`;
  
  let binaryString = '';
  for (let i = 0; i < barcodeText.length; i++) {
    const char = barcodeText[i];
    const pattern = CODE39_MAP[char] || CODE39_MAP[' '];
    binaryString += pattern + '0'; // Extra space between characters
  }

  const barWidth = 1.2;
  const height = 40;
  const width = binaryString.length * barWidth;

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height} className="max-w-full">
        <g fill="black">
          {binaryString.split('').map((char, index) => {
            if (char === '1') {
              return (
                <rect
                  key={index}
                  x={index * barWidth}
                  y={0}
                  width={barWidth}
                  height={height}
                />
              );
            }
            return null;
          })}
        </g>
      </svg>
      <span className="text-[8px] font-mono tracking-widest mt-0.5 text-slate-500">{barcodeText}</span>
    </div>
  );
};

export default function ExpenseManager({
  expenses,
  activeCompanyId,
  company,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onTriggerDuplicateSaza,
  initialEditExpenseId,
  onClearInitialEditExpenseId,
  staff = [],
  staffEnabled = true,
  activeSidebarItemId = 'expenses',
  setActiveSidebarItemId,
  inventory = [],
  purchaseOrders = INITIAL_PURCHASE_ORDERS,
  goodsReceivedNotes = INITIAL_GOODS_RECEIVED_NOTES,
  branches = INITIAL_BRANCHES,
  onAddPO = () => {},
  onUpdatePO = () => {},
  onDeletePO = () => {},
  onAddGRN = () => {},
  onUpdateGRN = () => {},
  onDeleteGRN = () => {},
  onAdjustStock
}: ExpenseManagerProps) {
  // Filter only expenses of active company
  const compExpenses = expenses.filter(e => e.companyId === activeCompanyId);
  const isRemoteLogo = (url?: string) => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://');
  };

  // Suppliers Directory local state
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const cached = safeGetLocalStorage<Supplier[] | null>('hisaab_suppliers_directory', null);
    if (cached && Array.isArray(cached)) {
      return cached;
    }
    return INITIAL_SUPPLIERS;
  });

  // Save suppliers safely with quota protection
  useEffect(() => {
    safeSetLocalStorage('hisaab_suppliers_directory', suppliers);
  }, [suppliers]);

  // Filter suppliers by active company
  const companySuppliers = suppliers.filter(s => s.companyId === activeCompanyId);

  // Supplier / Purchase Detail Page states
  const [selectedSupplierDetail, setSelectedSupplierDetail] = useState<Supplier | { id?: string, name: string, trn?: string, phone?: string, email?: string, address?: string, emirate?: string } | null>(null);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [dateFilterType, setDateFilterType] = useState<'weekly' | 'monthly' | 'quarterly' | 'custom'>('monthly');
  const [statementStartDate, setStatementStartDate] = useState('');
  const [statementEndDate, setStatementEndDate] = useState('');
  const [isPrintingStatement, setIsPrintingStatement] = useState(false);

  // Supplier Payment History & Voucher states
  const [supplierDetailTab, setSupplierDetailTab] = useState<'bills' | 'payments'>('bills');
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [payBillId, setPayBillId] = useState('');
  const [payAmount, setPayAmount] = useState(0);
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState<'Cash' | 'Cheque' | 'Bank Transfer' | 'Credit/Debit Card' | 'Other'>('Cash');
  const [payRefNo, setPayRefNo] = useState('');
  const [payBankName, setPayBankName] = useState('');
  const [payChequeDate, setPayChequeDate] = useState('');
  const [payPaidBy, setPayPaidBy] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [payVoucherNo, setPayVoucherNo] = useState('');
  const [printingVoucher, setPrintingVoucher] = useState<{
    expenseId: string;
    expenseInvoiceNo: string;
    expenseTotal: number;
    paymentId: string;
    date: string;
    amount: number;
    method: string;
    refNo: string;
    paidBy: string;
    bankName?: string;
    chequeDate?: string;
    notes?: string;
    voucherNo?: string;
  } | null>(null);

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [voucherLayout, setVoucherLayout] = useState<'standard' | 'sleeve'>('standard');
  const [downloadingExpenseId, setDownloadingExpenseId] = useState<string | null>(null);

  // Column Chooser State for Suppliers & Purchases
  const [colsSuppliers, setColsSuppliers] = useState(() => {
    try {
      const saved = localStorage.getItem('hisaab_cols_suppliers');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      supplier: true,
      trn: true,
      email: true,
      phone: true,
      emirate: true,
      tradeLicense: true,
      dateAdded: true
    };
  });
  const [showSuppliersColChooser, setShowSuppliersColChooser] = useState(false);

  const [colsPurchases, setColsPurchases] = useState(() => {
    try {
      const saved = localStorage.getItem('hisaab_cols_purchases');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      date: true,
      invoiceNo: true,
      supplier: true,
      category: true,
      amount: true,
      paymentStatus: true
    };
  });
  const [showPurchasesColChooser, setShowPurchasesColChooser] = useState(false);

  // States for general listing
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  
  const [sortField, setSortField] = useState<'date' | 'supplier' | 'category' | 'total' | 'status'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [supSortField, setSupSortField] = useState<'name' | 'trn' | 'emirate' | 'email' | 'tradeLicense' | 'dateAdded' | 'bills' | 'gross'>('name');
  const [supSortDirection, setSupSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedSupplierViewFilter, setSelectedSupplierViewFilter] = useState<'all' | 'trn' | 'contact' | 'city' | 'bill' | 'gross' | 'trade' | 'added'>('all');

  const handleSort = (field: 'date' | 'supplier' | 'category' | 'total' | 'status') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSupSort = (field: 'name' | 'trn' | 'emirate' | 'email' | 'tradeLicense' | 'dateAdded' | 'bills' | 'gross') => {
    if (supSortField === field) {
      setSupSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSupSortField(field);
      setSupSortDirection('asc');
    }
  };
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // Form Fields state
  const [supplierName, setSupplierName] = useState('');
  const [supplierTrn, setSupplierTrn] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Purchases');
  const [amount, setAmount] = useState<number>(0);
  const [vatAmount, setVatAmount] = useState<number>(0);
  const [status, setStatus] = useState<'Paid' | 'Unpaid'>('Paid');
  const [autoCalcVat, setAutoCalcVat] = useState(true);
  const [vatRecoverability, setVatRecoverability] = useState<'Fully Recoverable' | 'Non-Recoverable' | 'Partially Recoverable'>('Fully Recoverable');
  const [preparedBy, setPreparedBy] = useState('');
  const [attachment, setAttachment] = useState<{ name: string; dataUrl: string } | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<{ name: string; dataUrl: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Barcode states for purchase scanning
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [barcodeScanInput, setBarcodeScanInput] = useState('');
  const [scanStatus, setScanStatus] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  const [scannedItemsList, setScannedItemsList] = useState<{ item: InventoryItem; qty: number }[]>([]);

  // Local heuristic lookup for suggesting categories
  const isInitializingEdit = React.useRef(false);
  const [lastSuggestedFor, setLastSuggestedFor] = useState('');
  const [showSuggestionTip, setShowSuggestionTip] = useState(false);

  const suggestCategoryFromSupplier = (name: string): ExpenseCategory | null => {
    const normalized = name.toLowerCase().trim();
    if (!normalized) return null;

    if (
      normalized.includes('rent') || 
      normalized.includes('real estate') || 
      normalized.includes('property') || 
      normalized.includes('properties') || 
      normalized.includes('holding') || 
      normalized.includes('holdings') || 
      normalized.includes('landlord') ||
      normalized.includes('tenancy') ||
      normalized.includes('lease') ||
      normalized.includes('co-working') ||
      normalized.includes('wework') ||
      normalized.includes('regus') ||
      normalized.includes('office space') ||
      normalized.includes('ejari') ||
      normalized.includes('estate') ||
      normalized.includes('warehouse')
    ) {
      return 'Rent';
    }
    if (
      normalized.includes('dewa') || 
      normalized.includes('sewa') || 
      normalized.includes('fewa') || 
      normalized.includes('addc') || 
      normalized.includes('aadc') || 
      normalized.includes('electricity') || 
      normalized.includes('water') || 
      normalized.includes('telecom') || 
      normalized.includes('etisalat') || 
      normalized.includes('du') || 
      normalized.includes('internet') || 
      normalized.includes('power') || 
      normalized.includes('municipality') ||
      normalized.includes('mobile') ||
      normalized.includes('phone') ||
      normalized.includes('empower') ||
      normalized.includes('tabreed') ||
      normalized.includes('cooling') ||
      normalized.includes('sewage') ||
      normalized.includes('wi-fi') ||
      normalized.includes('wifi') ||
      normalized.includes('gas') ||
      normalized.includes('ooredoo') ||
      normalized.includes('utility') ||
      normalized.includes('utilities')
    ) {
      return 'Utilities';
    }
    if (
      normalized.includes('salary') || 
      normalized.includes('salaries') || 
      normalized.includes('payroll') || 
      normalized.includes('wage') || 
      normalized.includes('wages') || 
      normalized.includes('employee') || 
      normalized.includes('staff') ||
      normalized.includes('manpower') ||
      normalized.includes('compensation') ||
      normalized.includes('allowance') ||
      normalized.includes('bonus') ||
      normalized.includes('commission') ||
      normalized.includes('recruitment') ||
      normalized.includes('human resource') ||
      normalized.includes(' hr ') ||
      normalized.includes('hr-') ||
      normalized.includes('wps') ||
      normalized.includes('mohre') ||
      normalized.includes('gratuity') ||
      normalized.includes('pension')
    ) {
      return 'Salaries';
    }
    if (
      normalized.includes('marketing') || 
      normalized.includes('ads') || 
      normalized.includes('ad ') || 
      normalized.includes('advertising') || 
      normalized.includes('facebook') || 
      normalized.includes('meta') || 
      normalized.includes('google') || 
      normalized.includes('tiktok') || 
      normalized.includes('instagram') || 
      normalized.includes('snapchat') || 
      normalized.includes('linkedin') || 
      normalized.includes('twitter') || 
      normalized.includes('seo') || 
      normalized.includes('promo') || 
      normalized.includes('promotion') || 
      normalized.includes('branding') || 
      normalized.includes('pr agency') ||
      normalized.includes('influencer') ||
      normalized.includes('flyer') ||
      normalized.includes('brochure') ||
      normalized.includes('exhibition') ||
      normalized.includes('campaign') ||
      normalized.includes('media')
    ) {
      return 'Marketing';
    }
    if (
      normalized.includes('logistics') || 
      normalized.includes('courier') || 
      normalized.includes('dhl') || 
      normalized.includes('fedex') || 
      normalized.includes('aramex') || 
      normalized.includes('cargo') || 
      normalized.includes('delivery') || 
      normalized.includes('shipping') || 
      normalized.includes('transport') ||
      normalized.includes('freight') ||
      normalized.includes('mover') ||
      normalized.includes('port') ||
      normalized.includes('customs') ||
      normalized.includes('salik') ||
      normalized.includes('fuel') ||
      normalized.includes('petrol') ||
      normalized.includes('adnoc') ||
      normalized.includes('enoc') ||
      normalized.includes('eppco') ||
      normalized.includes('talabat') ||
      normalized.includes('noon') ||
      normalized.includes('deliveroo')
    ) {
      return 'Logistics';
    }
    if (
      normalized.includes('construction') || 
      normalized.includes('materials') || 
      normalized.includes('carpet') || 
      normalized.includes('textile') || 
      normalized.includes('services') || 
      normalized.includes('purchasing') || 
      normalized.includes('supply') || 
      normalized.includes('supplier') || 
      normalized.includes('supplies') || 
      normalized.includes('wholesale') || 
      normalized.includes('vendor') ||
      normalized.includes('trading') ||
      normalized.includes('equipment') ||
      normalized.includes('hardware') ||
      normalized.includes('raw material') ||
      normalized.includes('retailer') ||
      normalized.includes('factory') ||
      normalized.includes('goods') ||
      normalized.includes('procure') ||
      normalized.includes('stock') ||
      normalized.includes('inventory')
    ) {
      return 'Purchases';
    }
    return null;
  };

  useEffect(() => {
    if (isInitializingEdit.current) return;
    if (!supplierName || supplierName === lastSuggestedFor) return;
    const suggested = suggestCategoryFromSupplier(supplierName);
    if (suggested) {
      setCategory(suggested);
      setLastSuggestedFor(supplierName);
      setShowSuggestionTip(true);
      const timer = setTimeout(() => setShowSuggestionTip(false), 4000);
      return () => clearTimeout(timer);
    } else {
      setShowSuggestionTip(false);
    }
  }, [supplierName]);

  // Supplier modal Form Fields state
  const isVatEnabled = company?.vatEnabled !== false && (company?.taxRate ?? 5) > 0;
  const companyCountry = company?.country || company?.gccCountry || 'UAE';
  const countryConfig = getCountryConfig(companyCountry);

  const [customSupplierCities, setCustomSupplierCities] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('hisaab_custom_cities');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showSupplierAddCity, setShowSupplierAddCity] = useState(false);
  const [manualSupplierCity, setManualSupplierCity] = useState('');

  const supplierCountryCities = React.useMemo(() => {
    const base = getCountryCities(companyCountry);
    const regions = countryConfig?.regions || [];
    return Array.from(new Set([...base, ...regions, ...customSupplierCities]));
  }, [companyCountry, countryConfig, customSupplierCities]);

  const [newSupName, setNewSupName] = useState('');
  const [newSupCode, setNewSupCode] = useState('');
  const [newSupTrn, setNewSupTrn] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupEmail, setNewSupEmail] = useState('');
  const [newSupAddress, setNewSupAddress] = useState('');
  const [newSupEmirate, setNewSupEmirate] = useState<string>(() => {
    const base = getCountryCities(companyCountry);
    return base[0] || 'Dubai';
  });
  const [newSupTradeLicense, setNewSupTradeLicense] = useState('');
  const [newSupDateAdded, setNewSupDateAdded] = useState(() => new Date().toISOString().split('T')[0]);
  const [newSupVatStatus, setNewSupVatStatus] = useState<'yes' | 'no' | 'pending'>(isVatEnabled ? 'yes' : 'no');
  const [newSupContactPerson, setNewSupContactPerson] = useState('');
  const [trnValidationError, setTrnValidationError] = useState('');
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Generate Auto-Sequenced Unique Supplier Code
  const generateNextSupplierCode = () => {
    const existingCodes = companySuppliers.map(s => s.supplierCode || '');
    let maxNum = 1000;
    existingCodes.forEach(code => {
      const match = code.match(/SUPP-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    let nextCode = `SUPP-${maxNum + 1}`;
    while (existingCodes.some(c => c.toLowerCase() === nextCode.toLowerCase())) {
      maxNum++;
      nextCode = `SUPP-${maxNum + 1}`;
    }
    return nextCode;
  };

  // Multi-item Purchases Entry state (BATCH 3 - 1)
  const [purchaseItems, setPurchaseItems] = useState<Array<{ name: string; qty: number; rate: number; taxPercent: number; amount: number; vatAmount: number; total: number }>>([
    { name: '', qty: 1, rate: 0, taxPercent: 5, amount: 0, vatAmount: 0, total: 0 }
  ]);

  const addPurchaseItemRow = () => {
    setPurchaseItems(prev => [
      ...prev,
      { name: '', qty: 1, rate: 0, taxPercent: company?.vatEnabled !== false ? 5 : 0, amount: 0, vatAmount: 0, total: 0 }
    ]);
  };

  const removePurchaseItemRow = (index: number) => {
    if (purchaseItems.length <= 1) {
      setPurchaseItems([{ name: '', qty: 1, rate: 0, taxPercent: company?.vatEnabled !== false ? 5 : 0, amount: 0, vatAmount: 0, total: 0 }]);
      return;
    }
    setPurchaseItems(prev => prev.filter((_, i) => i !== index));
  };

  const updatePurchaseItemField = (index: number, field: string, value: any) => {
    setPurchaseItems(prev => {
      const copy = [...prev];
      const row = { ...copy[index] };
      
      if (field === 'qty') {
        row.qty = Math.max(1, parseInt(value) || 1);
      } else if (field === 'rate') {
        row.rate = Math.max(0, parseFloat(value) || 0);
      } else if (field === 'taxPercent') {
        row.taxPercent = Math.max(0, parseFloat(value) || 0);
      } else if (field === 'name') {
        row.name = value;
      }
      
      row.amount = Number((row.qty * row.rate).toFixed(2));
      row.vatAmount = company?.vatEnabled !== false ? Number((row.amount * (row.taxPercent / 100)).toFixed(2)) : 0;
      row.total = Number((row.amount + row.vatAmount).toFixed(2));
      
      copy[index] = row;
      return copy;
    });
  };

  // Dynamic calculation for Multi-item purchases
  useEffect(() => {
    if (activeSidebarItemId === 'pur_add' || activeSidebarItemId === 'pur_credit_note' || category === 'Purchases' || category === 'Supplier Credit Note') {
      const subtotal = purchaseItems.reduce((sum, item) => sum + (item.qty * item.rate), 0);
      const vatTotal = purchaseItems.reduce((sum, item) => {
        const itemSub = item.qty * item.rate;
        const itemVat = company?.vatEnabled !== false ? (itemSub * (item.taxPercent / 100)) : 0;
        return sum + itemVat;
      }, 0);
      
      setAmount(Number(subtotal.toFixed(2)));
      setVatAmount(Number(vatTotal.toFixed(2)));
      
      // Auto generate description from items if manual description is empty/default or we are adding
      if (purchaseItems.length > 0 && purchaseItems.some(it => it.name.trim())) {
        const itemNames = purchaseItems
          .filter(it => it.name.trim())
          .map(it => `${it.name.trim()} (x${it.qty})`)
          .join(', ');
        setDescription(`Purchase of: ${itemNames}`);
      }
    }
  }, [purchaseItems, category, company, activeSidebarItemId]);

  // UAE VAT Compliance: Unregistered Supplier rules
  useEffect(() => {
    if (company?.vatEnabled !== false) {
      const trimmedTrn = (supplierTrn || '').trim();
      const isRegistered = trimmedTrn.length === 15;
      
      if (!isRegistered) {
        // Force simple expense VAT amount to 0
        if (category !== 'Purchases') {
          setVatAmount(0);
          setAutoCalcVat(false);
          setVatRecoverability('Non-Recoverable');
        } else {
          // Force all purchase items taxPercent to 0
          setPurchaseItems(prev => {
            if (prev.some(it => it.taxPercent !== 0)) {
              return prev.map(it => {
                const sub = Number((it.qty * it.rate).toFixed(2));
                return {
                  ...it,
                  taxPercent: 0,
                  vatAmount: 0,
                  total: sub
                };
              });
            }
            return prev;
          });
        }
      }
    }
  }, [supplierTrn, category, company]);

  // Determine active view based on sidebar selection
  // 'expenses' = General Expense Ledger
  // 'suppliers' = Supplier Directory & List
  // 'purchases' = Purchases Ledger
  // 'purchase_orders' = Purchase Orders (PO)
  // 'goods_received' = Goods Received Notes (GRN)
  let activeView: 'expenses' | 'suppliers' | 'purchases' | 'purchase_orders' | 'goods_received' = 'expenses';
  if (activeSidebarItemId === 'sup_list' || activeSidebarItemId === 'sup_add') {
    activeView = 'suppliers';
  } else if (activeSidebarItemId === 'pur_manage' || activeSidebarItemId === 'pur_add' || activeSidebarItemId === 'pur_credit_note') {
    activeView = 'purchases';
  } else if (activeSidebarItemId === 'pur_po') {
    activeView = 'purchase_orders';
  } else if (activeSidebarItemId === 'pur_grn') {
    activeView = 'goods_received';
  }

  // Effect to automatically open modals depending on sidebar action click
  const [lastActionHandled, setLastActionHandled] = useState('');
  useEffect(() => {
    setSelectedSupplierDetail(null);
    if (activeSidebarItemId === 'sup_add' && lastActionHandled !== 'sup_add') {
      // Clear fields for inline supplier form
      setNewSupName('');
      setNewSupTrn('');
      setNewSupPhone('');
      setNewSupEmail('');
      setNewSupAddress('');
      setNewSupEmirate(supplierCountryCities[0] || 'Dubai');
      setNewSupTradeLicense('');
      setNewSupVatStatus(isVatEnabled ? 'yes' : 'no');
      setNewSupDateAdded(new Date().toISOString().split('T')[0]);
      setTrnValidationError('');
      setEditingSupplier(null);
      setIsSupplierModalOpen(false); // Render inline instead of modal
      setLastActionHandled('sup_add');
    } else if ((activeSidebarItemId === 'pur_add' || activeSidebarItemId === 'pur_credit_note') && lastActionHandled !== activeSidebarItemId) {
      // Clear fields for inline purchase/credit note form
      setSupplierName('');
      setSupplierTrn('');
      setInvoiceNumber('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setCategory(activeSidebarItemId === 'pur_credit_note' ? 'Supplier Credit Note' : 'Purchases');
      setAmount(0);
      setVatAmount(0);
      setStatus('Paid');
      setAutoCalcVat(true);
      setVatRecoverability('Fully Recoverable');
      setPreparedBy('');
      setScannedItemsList([]);
      
      setPurchaseItems([
        { name: '', qty: 1, rate: 0, taxPercent: company?.vatEnabled !== false ? 5 : 0, amount: 0, vatAmount: 0, total: 0 }
      ]);
      
      setIsFormOpen(false); // Render inline instead of modal
      setLastActionHandled(activeSidebarItemId);
    } else {
      setLastActionHandled(activeSidebarItemId);
    }
  }, [activeSidebarItemId]);

  // Currency Formatter matching Project Constitution V2.0
  const formatAED = (num: number) => {
    const currencyCode = company?.currency || 'AED';
    const symbol = company?.currencySymbol || currencyCode;
    const position = company?.symbolPosition || 'before';
    const decimals = ['BHD', 'OMR', 'KWD'].includes(currencyCode) ? 3 : 2;
    const formattedNum = num.toLocaleString('en-US', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
    return position === 'before' ? `${symbol} ${formattedNum}` : `${formattedNum} ${symbol}`;
  };

  // KPI Calculations
  const activeCompanyExpenses = compExpenses;
  // If activeView is 'purchases', calculate stats only for Purchases category
  const statsExpenses = activeView === 'purchases' 
    ? activeCompanyExpenses.filter(e => e.category === 'Purchases')
    : activeCompanyExpenses;

  const totalTaxable = statsExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalVat = statsExpenses.reduce((sum, e) => sum + e.vatAmount, 0);
  const totalExpenseAmount = statsExpenses.reduce((sum, e) => sum + e.total, 0);

  const unpaidExpensesSum = statsExpenses.filter(e => e.status === 'Unpaid').reduce((sum, e) => sum + e.total, 0);
  const unpaidExpensesCount = statsExpenses.filter(e => e.status === 'Unpaid').length;
  const paidExpensesSum = statsExpenses.filter(e => e.status === 'Paid').reduce((sum, e) => sum + e.total, 0);
  const paidExpensesCount = statsExpenses.filter(e => e.status === 'Paid').length;

  // Supplier statistics
  const totalSuppliersCount = companySuppliers.length;
  const suppliersWithTrn = companySuppliers.filter(s => s.trn).length;
  const totalPurchasesVolume = compExpenses.filter(e => e.category === 'Purchases').reduce((sum, e) => sum + e.total, 0);
  const totalUnpaidPurchasesVolume = compExpenses.filter(e => e.category === 'Purchases' && e.status === 'Unpaid').reduce((sum, e) => sum + e.total, 0);
  const totalPaidPurchasesVolume = compExpenses.filter(e => e.category === 'Purchases' && e.status === 'Paid').reduce((sum, e) => sum + e.total, 0);

  // Handle Amount change for auto VAT
  const handleAmountChange = (val: number) => {
    setAmount(val);
    if (company?.vatEnabled === false) {
      setVatAmount(0);
    } else if (autoCalcVat) {
      setVatAmount(parseFloat((val * 0.05).toFixed(2)));
    }
  };

  const updateExpenseFromScannedItems = (list: { item: InventoryItem; qty: number }[]) => {
    const sumAmount = list.reduce((sum, itemRow) => sum + (itemRow.qty * itemRow.item.purchasePrice), 0);
    handleAmountChange(Number(sumAmount.toFixed(2)));
    if (list.length > 0) {
      const descLines = list.map(itemRow => `${itemRow.item.name} (${itemRow.item.sku}) x${itemRow.qty}`);
      setDescription(`Purchase of catalog items:\n${descLines.join(', ')}`);
    } else {
      setDescription('');
    }
  };

  const handleScanBarcodeInPurchase = (scannedCode: string) => {
    const cleaned = scannedCode.trim();
    if (!cleaned) return;

    const matched = (inventory || []).find(item => item.barcode && item.barcode.trim() === cleaned);

    if (matched) {
      setScannedItemsList(prev => {
        const existingIdx = prev.findIndex(row => row.item.id === matched.id);
        let updated: { item: InventoryItem; qty: number }[];
        if (existingIdx !== -1) {
          updated = prev.map((row, i) => i === existingIdx ? { ...row, qty: row.qty + 1 } : row);
        } else {
          updated = [...prev, { item: matched, qty: 1 }];
        }
        updateExpenseFromScannedItems(updated);
        return updated;
      });

      setScanStatus({ text: `Matched: "${matched.name}" added`, type: 'success' });
      setTimeout(() => {
        setScanStatus(prev => prev.text.includes(matched.name) ? { text: '', type: '' } : prev);
      }, 3500);
    } else {
      const matchedSku = (inventory || []).find(item => item.sku.trim().toLowerCase() === cleaned.toLowerCase());
      if (matchedSku) {
        setScannedItemsList(prev => {
          const existingIdx = prev.findIndex(row => row.item.id === matchedSku.id);
          let updated: { item: InventoryItem; qty: number }[];
          if (existingIdx !== -1) {
            updated = prev.map((row, i) => i === existingIdx ? { ...row, qty: row.qty + 1 } : row);
          } else {
            updated = [...prev, { item: matchedSku, qty: 1 }];
          }
          updateExpenseFromScannedItems(updated);
          return updated;
        });

        setScanStatus({ text: `Matched SKU: "${matchedSku.name}" added`, type: 'success' });
        setTimeout(() => {
          setScanStatus(prev => prev.text.includes(matchedSku.name) ? { text: '', type: '' } : prev);
        }, 3500);
      } else {
        setScanStatus({ text: `Item Not Found for code "${cleaned}"`, type: 'error' });
        alert(`Item Not Found: The barcode "${cleaned}" is not registered in the product catalog.`);
      }
    }
    setBarcodeScanInput('');
  };

  // Drag and drop / file helpers
  const handleFileChange = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachment({
        name: file.name,
        dataUrl: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  // Toggle Auto VAT
  const handleToggleAutoVat = (checked: boolean) => {
    setAutoCalcVat(checked);
    if (company?.vatEnabled === false) {
      setVatAmount(0);
    } else if (checked) {
      setVatAmount(parseFloat((amount * 0.05).toFixed(2)));
    }
  };

  // Open Form for Add Bill
  const handleOpenAdd = () => {
    isInitializingEdit.current = false;
    setEditingExpense(null);
    setSupplierName('');
    setSupplierTrn('');
    setInvoiceNumber('');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setCategory('Purchases');
    setAmount(0);
    setVatAmount(0);
    setStatus('Paid');
    setAutoCalcVat(true);
    setVatRecoverability('Fully Recoverable');
    setPreparedBy('');
    setAttachment(null);
    setScannedItemsList([]);
    setPurchaseItems([
      { name: '', qty: 1, rate: 0, taxPercent: company?.vatEnabled !== false ? 5 : 0, amount: 0, vatAmount: 0, total: 0 }
    ]);
    setIsFormOpen(true);
  };

  // Open Form for Edit Bill
  const handleOpenEdit = (exp: Expense) => {
    isInitializingEdit.current = true;
    setEditingExpense(exp);
    setSupplierName(exp.supplierName);
    setSupplierTrn(exp.supplierTrn || '');
    setInvoiceNumber(exp.invoiceNumber);
    setDate(exp.date);
    setDescription(exp.description);
    setCategory(exp.category);
    setAmount(exp.amount);
    setVatAmount(exp.vatAmount);
    setStatus(exp.status);
    setAutoCalcVat(false); // keep their manually loaded VAT value
    setVatRecoverability((exp as any).vatRecoverability || 'Fully Recoverable');
    setPreparedBy(exp.preparedBy || '');
    setAttachment(exp.attachment || null);
    setScannedItemsList([]);
    
    // Load purchase items if present
    if (exp.items && exp.items.length > 0) {
      setPurchaseItems(exp.items.map(it => ({
        name: it.name,
        qty: it.qty,
        rate: it.rate,
        taxPercent: it.vatRate || 5,
        amount: it.qty * it.rate,
        vatAmount: it.vatAmount,
        total: it.total
      })));
    } else {
      setPurchaseItems([{
        name: exp.description || 'General Purchases',
        qty: 1,
        rate: exp.amount,
        taxPercent: exp.vatAmount > 0 ? 5 : 0,
        amount: exp.amount,
        vatAmount: exp.vatAmount,
        total: exp.total
      }]);
    }

    setIsFormOpen(true);
    setTimeout(() => {
      isInitializingEdit.current = false;
    }, 200);
  };

  // Clone Bill
  const handleCloneExpense = (exp: Expense) => {
    setEditingExpense(null); // Create new instead of updating
    setSupplierName(exp.supplierName);
    setSupplierTrn(exp.supplierTrn || '');
    
    // Auto increment or append -COPY
    const cleanNo = exp.invoiceNumber.replace(/-COPY$/, '');
    setInvoiceNumber(`${cleanNo}-COPY`);
    
    setDate(new Date().toISOString().split('T')[0]);
    setDescription(exp.description);
    setCategory(exp.category);
    setAmount(exp.amount);
    setVatAmount(exp.vatAmount);
    setStatus(exp.status);
    setAutoCalcVat(false);
    setVatRecoverability((exp as any).vatRecoverability || 'Fully Recoverable');
    setPreparedBy(exp.preparedBy || '');
    setAttachment(exp.attachment || null);
    setScannedItemsList([]);

    // Load purchase items if present
    if (exp.items && exp.items.length > 0) {
      setPurchaseItems(exp.items.map(it => ({
        name: it.name,
        qty: it.qty,
        rate: it.rate,
        taxPercent: it.vatRate || 5,
        amount: it.qty * it.rate,
        vatAmount: it.vatAmount,
        total: it.total
      })));
    } else {
      setPurchaseItems([{
        name: exp.description || 'General Purchases',
        qty: 1,
        rate: exp.amount,
        taxPercent: exp.vatAmount > 0 ? 5 : 0,
        amount: exp.amount,
        vatAmount: exp.vatAmount,
        total: exp.total
      }]);
    }

    setIsFormOpen(true);
  };

  // Submit Bill
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName || !invoiceNumber || amount <= 0) {
      alert('Please fill in all mandatory fields, and ensure the amount is greater than 0.');
      return;
    }

    // Check for duplicate Purchase (bill) number within this company
    const duplicate = compExpenses.find(exp => 
      exp.invoiceNumber.trim().toLowerCase() === invoiceNumber.trim().toLowerCase() &&
      (!editingExpense || exp.id !== editingExpense.id)
    );

    if (duplicate) {
      if (onTriggerDuplicateSaza) {
        onTriggerDuplicateSaza('Purchase', invoiceNumber, duplicate.date, duplicate.id);
      }
      return;
    }

    const calculatedTotal = parseFloat((amount + vatAmount).toFixed(2));

    const expensePayload: Omit<Expense, 'id' | 'companyId'> = {
      supplierName,
      supplierTrn: supplierTrn || undefined,
      invoiceNumber,
      date,
      description,
      category,
      amount,
      vatAmount,
      total: calculatedTotal,
      status,
      vatRecoverability,
      attachment: attachment || undefined,
      preparedBy: staffEnabled ? preparedBy : undefined,
      items: (category === 'Purchases' || activeView === 'purchases') ? purchaseItems.map(it => ({
        name: it.name || 'Item',
        qty: it.qty,
        rate: it.rate,
        vatRate: it.taxPercent,
        vatAmount: it.vatAmount,
        total: it.total
      })) : undefined
    };

    if (editingExpense) {
      onUpdateExpense({
        ...editingExpense,
        ...expensePayload
      } as Expense);
    } else {
      onAddExpense(expensePayload);
    }

    setIsFormOpen(false);
    // If we were on 'pur_add' or 'pur_credit_note', redirect sidebar highlight back to 'pur_manage'
    if ((activeSidebarItemId === 'pur_add' || activeSidebarItemId === 'pur_credit_note') && setActiveSidebarItemId) {
      setActiveSidebarItemId('pur_manage');
    }
  };

  // Submit Supplier Profile (Create or Update)
  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) {
      alert("Please provide the Supplier's Legal Name.");
      return;
    }

    let finalTrn = newSupTrn.trim();
    const effectiveVatStatus = isVatEnabled ? newSupVatStatus : 'no';

    if (isVatEnabled) {
      if (newSupVatStatus === 'yes') {
        if (!finalTrn) {
          setTrnValidationError("15-digit Tax Registration Number (TRN) is required when VAT Status is 'Has VAT Number'.");
          return;
        }
        if (!/^\d{15}$/.test(finalTrn)) {
          setTrnValidationError("UAE Tax Registration Number (TRN) must be exactly 15 numeric digits.");
          return;
        }
      } else if (newSupVatStatus === 'no') {
        finalTrn = '';
      } else if (newSupVatStatus === 'pending') {
        if (!finalTrn) {
          finalTrn = 'TRN-PEND-' + Math.floor(1000 + Math.random() * 9000);
        }
      }
    } else {
      finalTrn = '';
    }

    if (editingSupplier) {
      const oldName = editingSupplier.name.trim().toLowerCase();
      const newName = newSupName.trim();

      // Update supplier
      setSuppliers(prev => prev.map(s => s.id === editingSupplier.id ? {
        ...s,
        name: newName,
        supplierCode: newSupCode || s.supplierCode || generateNextSupplierCode(),
        trn: finalTrn || undefined,
        phone: newSupPhone.trim() || undefined,
        email: newSupEmail.trim() || undefined,
        address: newSupAddress.trim() || undefined,
        emirate: newSupEmirate,
        tradeLicense: newSupTradeLicense.trim() || undefined,
        dateAdded: newSupDateAdded || new Date().toISOString().split('T')[0],
        contactPerson: newSupContactPerson.trim() || undefined,
        vatStatus: effectiveVatStatus,
        tempTrnId: effectiveVatStatus === 'pending' ? finalTrn : undefined
      } : s));

      // Update any associated expenses / bills
      compExpenses.forEach(exp => {
        if (exp.supplierName.trim().toLowerCase() === oldName) {
          onUpdateExpense({
            ...exp,
            supplierName: newName,
            supplierTrn: finalTrn || undefined
          });
        }
      });

      alert(`Supplier "${newName}" (${newSupCode || editingSupplier.supplierCode || ''}) has been updated successfully!`);
    } else {
      const assignedCode = newSupCode.trim() || generateNextSupplierCode();
      const newSup: Supplier = {
        id: 'sup-' + Date.now(),
        companyId: activeCompanyId,
        name: newSupName.trim(),
        supplierCode: assignedCode,
        trn: finalTrn || undefined,
        phone: newSupPhone.trim() || undefined,
        email: newSupEmail.trim() || undefined,
        address: newSupAddress.trim() || undefined,
        emirate: newSupEmirate,
        tradeLicense: newSupTradeLicense.trim() || undefined,
        dateAdded: newSupDateAdded || new Date().toISOString().split('T')[0],
        contactPerson: newSupContactPerson.trim() || undefined,
        vatStatus: newSupVatStatus,
        tempTrnId: newSupVatStatus === 'pending' ? finalTrn : undefined
      };

      setSuppliers(prev => [newSup, ...prev]);
      alert(`Supplier "${newSup.name}" (${assignedCode}) has been registered successfully!`);
    }

    setIsSupplierModalOpen(false);
    setEditingSupplier(null);
    
    // Clear fields
    setNewSupName('');
    setNewSupCode('');
    setNewSupTrn('');
    setNewSupPhone('');
    setNewSupEmail('');
    setNewSupAddress('');
    setNewSupEmirate(supplierCountryCities[0] || 'Dubai');
    setNewSupTradeLicense('');
    setNewSupContactPerson('');
    setNewSupVatStatus(isVatEnabled ? 'yes' : 'no');
    setNewSupDateAdded(new Date().toISOString().split('T')[0]);
    setTrnValidationError('');
    
    // Redirect sidebar item highlight to 'sup_list' after successfully adding
    if (activeSidebarItemId === 'sup_add' && setActiveSidebarItemId) {
      setActiveSidebarItemId('sup_list');
    }
  };

  // Edit Supplier Profile
  const handleEditSupplier = (sup: Supplier) => {
    setEditingSupplier(sup);
    setNewSupName(sup.name);
    setNewSupCode(sup.supplierCode || generateNextSupplierCode());
    setNewSupTrn(sup.trn || sup.tempTrnId || '');
    setNewSupPhone(sup.phone || '');
    setNewSupEmail(sup.email || '');
    setNewSupAddress(sup.address || '');
    setNewSupEmirate(sup.emirate || 'Dubai');
    setNewSupTradeLicense(sup.tradeLicense || '');
    setNewSupContactPerson(sup.contactPerson || '');
    setNewSupVatStatus(sup.vatStatus || (sup.trn ? 'yes' : 'no'));
    setNewSupDateAdded(sup.dateAdded || new Date().toISOString().split('T')[0]);
    setTrnValidationError('');
    setIsSupplierModalOpen(true);
  };

  // Delete Supplier Profile
  const handleDeleteSupplier = (supId: string, supName: string) => {
    const sup = suppliers.find(s => s.id === supId);
    if (sup) {
      setSupplierToDelete(sup);
    }
  };

  // Save Supplier Payment and trigger state updates
  const handleSaveSupplierPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payBillId) {
      alert("Please select a purchase bill to pay.");
      return;
    }
    if (payAmount <= 0) {
      alert("Please enter a valid payment amount greater than 0.");
      return;
    }

    const bill = compExpenses.find(exp => exp.id === payBillId);
    if (!bill) {
      alert("Selected bill not found.");
      return;
    }

    const remaining = bill.total - (bill.paymentReceived || 0);
    if (payAmount > Number(remaining.toFixed(2))) {
      alert(`Payment amount (AED ${payAmount}) cannot exceed the remaining pending balance (AED ${remaining.toFixed(2)}).`);
      return;
    }

    const voucherNumber = payVoucherNo.trim() || `PV-${String(Math.floor(10000 + Math.random() * 90000))}`;
    
    const newPayment = {
      id: 'pay-' + Date.now(),
      date: payDate,
      amount: payAmount,
      method: payMethod,
      refNo: payRefNo.trim() || 'N/A',
      paidBy: payPaidBy.trim() || 'Finance Officer',
      bankName: (payMethod === 'Cheque' || payMethod === 'Bank Transfer') && payBankName.trim() ? payBankName.trim() : undefined,
      chequeDate: payMethod === 'Cheque' && payChequeDate ? payChequeDate : undefined,
      notes: payNotes.trim() || undefined,
      voucherNo: voucherNumber
    };

    const updatedReceived = parseFloat(((bill.paymentReceived || 0) + payAmount).toFixed(2));
    const updatedHistory = [...(bill.paymentHistory || []), newPayment];
    // status can only be 'Paid' or 'Unpaid'
    const updatedStatus: 'Paid' | 'Unpaid' = updatedReceived >= bill.total ? 'Paid' : 'Unpaid';

    const updatedBill: Expense = {
      ...bill,
      paymentReceived: updatedReceived,
      paymentHistory: updatedHistory,
      status: updatedStatus
    };

    // Update expense state
    onUpdateExpense(updatedBill);

    // Reset fields
    setPayBillId('');
    setPayAmount(0);
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayMethod('Cash');
    setPayRefNo('');
    setPayBankName('');
    setPayChequeDate('');
    setPayPaidBy('');
    setPayNotes('');
    setPayVoucherNo('');
    setIsRecordPaymentOpen(false);

    alert(`Payment of AED ${payAmount.toFixed(2)} recorded successfully! Voucher ${voucherNumber} generated.`);

    // Auto open voucher for printing/downloading
    setPrintingVoucher({
      expenseId: updatedBill.id,
      expenseInvoiceNo: updatedBill.invoiceNumber,
      expenseTotal: updatedBill.total,
      paymentId: newPayment.id,
      date: newPayment.date,
      amount: newPayment.amount,
      method: newPayment.method,
      refNo: newPayment.refNo,
      paidBy: newPayment.paidBy,
      bankName: newPayment.bankName,
      chequeDate: newPayment.chequeDate,
      notes: newPayment.notes,
      voucherNo: newPayment.voucherNo
    });
  };

  // Filter bills list based on search and selected options
  const filteredExpenses = statsExpenses
    .filter(exp => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = (exp.supplierName || '').toLowerCase().includes(term) || 
                            (exp.invoiceNumber || '').toLowerCase().includes(term) || 
                            (exp.description || '').toLowerCase().includes(term);
      
      // Category filter
      let matchesCategory = true;
      if (activeView === 'purchases') {
        matchesCategory = exp.category === 'Purchases';
      } else if (selectedCategoryFilter !== 'all') {
        matchesCategory = exp.category === selectedCategoryFilter;
      }

      const matchesStatus = selectedStatusFilter === 'all' || exp.status === selectedStatusFilter;

      // Date range filtering
      const matchesDate = (!startDate || exp.date >= startDate) && (!endDate || exp.date <= endDate);

      // Amount range filtering
      const matchesAmount = (!minAmount || exp.total >= Number(minAmount)) && (!maxAmount || exp.total <= Number(maxAmount));

      return matchesSearch && matchesCategory && matchesStatus && matchesDate && matchesAmount;
    })
    .sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      if (sortField === 'date') {
        valA = a.date || '';
        valB = b.date || '';
      } else if (sortField === 'supplier') {
        valA = (a.supplierName || '').toLowerCase();
        valB = (b.supplierName || '').toLowerCase();
      } else if (sortField === 'category') {
        valA = (a.category || '').toLowerCase();
        valB = (b.category || '').toLowerCase();
      } else if (sortField === 'total') {
        valA = a.total || 0;
        valB = b.total || 0;
      } else if (sortField === 'status') {
        valA = (a.status || '').toLowerCase();
        valB = (b.status || '').toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Filter supplier registry based on search
  const filteredSuppliers = companySuppliers
    .filter(sup => {
      // Search filter
      const query = searchTerm.trim().toLowerCase();
      const rawQuery = query.replace(/\D/g, '');

      let matchesSearch = true;
      if (query) {
        const nameMatch = sup.name?.toLowerCase().includes(query);
        const idMatch = sup.id?.toLowerCase().includes(query);
        const codeMatch = sup.supplierCode?.toLowerCase().includes(query);
        const trnMatch = sup.trn?.toLowerCase().includes(query);
        const emirateMatch = sup.emirate?.toLowerCase().includes(query);
        const addressMatch = sup.address?.toLowerCase().includes(query);
        const emailMatch = sup.email?.toLowerCase().includes(query);
        const tradeMatch = sup.tradeLicense?.toLowerCase().includes(query);
        const phoneMatch = sup.phone?.toLowerCase().includes(query);
        const normPhoneMatch = rawQuery.length >= 3 && (sup.phone && sup.phone.replace(/\D/g, '').includes(rawQuery));

        matchesSearch = nameMatch || idMatch || codeMatch || trnMatch || emirateMatch || addressMatch || 
                        emailMatch || tradeMatch || phoneMatch || normPhoneMatch;
      }

      if (!matchesSearch) return false;

      // View category filter
      if (selectedSupplierViewFilter === 'all') {
        return true;
      } else if (selectedSupplierViewFilter === 'trn') {
        return !!sup.trn;
      } else if (selectedSupplierViewFilter === 'contact') {
        return !!sup.phone || !!sup.email;
      } else if (selectedSupplierViewFilter === 'city') {
        return !!sup.emirate;
      } else if (selectedSupplierViewFilter === 'bill') {
        const billsCount = compExpenses.filter(e => e.supplierName.trim().toLowerCase() === sup.name.trim().toLowerCase()).length;
        return billsCount > 0;
      } else if (selectedSupplierViewFilter === 'gross') {
        const totalPurchased = compExpenses.filter(e => e.supplierName.trim().toLowerCase() === sup.name.trim().toLowerCase()).reduce((sum, e) => sum + e.total, 0);
        return totalPurchased > 0;
      } else if (selectedSupplierViewFilter === 'trade') {
        return !!sup.tradeLicense;
      } else if (selectedSupplierViewFilter === 'added') {
        return !!sup.dateAdded;
      }

      return true;
    })
    .sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      if (supSortField === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (supSortField === 'trn') {
        valA = (a.trn || '').toLowerCase();
        valB = (b.trn || '').toLowerCase();
      } else if (supSortField === 'tradeLicense') {
        valA = (a.tradeLicense || '').toLowerCase();
        valB = (b.tradeLicense || '').toLowerCase();
      } else if (supSortField === 'emirate') {
        valA = (a.emirate || '').toLowerCase();
        valB = (b.emirate || '').toLowerCase();
      } else if (supSortField === 'email') {
        valA = (a.email || '').toLowerCase();
        valB = (b.email || '').toLowerCase();
      } else if (supSortField === 'dateAdded') {
        valA = (a.dateAdded || '').toLowerCase();
        valB = (b.dateAdded || '').toLowerCase();
      } else if (supSortField === 'bills') {
        valA = compExpenses.filter(e => e.supplierName.trim().toLowerCase() === a.name.trim().toLowerCase()).length;
        valB = compExpenses.filter(e => e.supplierName.trim().toLowerCase() === b.name.trim().toLowerCase()).length;
        return supSortDirection === 'asc' ? valA - valB : valB - valA;
      } else if (supSortField === 'gross') {
        valA = compExpenses.filter(e => e.supplierName.trim().toLowerCase() === a.name.trim().toLowerCase()).reduce((sum, e) => sum + e.total, 0);
        valB = compExpenses.filter(e => e.supplierName.trim().toLowerCase() === b.name.trim().toLowerCase()).reduce((sum, e) => sum + e.total, 0);
        return supSortDirection === 'asc' ? valA - valB : valB - valA;
      }

      if (valA < valB) return supSortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return supSortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const [selectedIdx, setSelectedIdx] = useState<number>(-1);

  useEffect(() => {
    if (filteredExpenses.length > 0) {
      setSelectedIdx(0);
    } else {
      setSelectedIdx(-1);
    }
  }, [searchTerm, selectedCategoryFilter, selectedStatusFilter, activeView]);

  useEffect(() => {
    if (initialEditExpenseId) {
      const exp = compExpenses.find(e => e.id === initialEditExpenseId);
      if (exp) {
        handleOpenEdit(exp);
      }
      if (onClearInitialEditExpenseId) {
        onClearInitialEditExpenseId();
      }
    }
  }, [initialEditExpenseId, compExpenses]);

  // Keyboard navigation matching user experience standards
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

      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'p') {
          e.preventDefault();
          triggerPrint('printable-voucher');
          return;
        }
        if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          if (activeView === 'suppliers') {
            setIsSupplierModalOpen(true);
          } else {
            handleOpenAdd();
          }
          return;
        }
      }

      if (isTyping) return;

      if (!isFormOpen && !isSupplierModalOpen && activeView !== 'suppliers' && selectedIdx >= 0 && selectedIdx < filteredExpenses.length) {
        const exp = filteredExpenses[selectedIdx];
        if (e.key.toLowerCase() === 'v') {
          e.preventDefault();
          handleOpenEdit(exp);
          return;
        }
        if (e.key.toLowerCase() === 'c') {
          e.preventDefault();
          handleCloneExpense(exp);
          return;
        }
      }

      if (isFormOpen && e.key === 'Escape') {
        setIsFormOpen(false);
      }
      if (isSupplierModalOpen && e.key === 'Escape') {
        setIsSupplierModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFormOpen, isSupplierModalOpen, selectedIdx, filteredExpenses, activeView]);

  // Date range calculators for supplier statements
  const getFilteredStatementExpenses = (supExpenses: Expense[]) => {
    if (dateFilterType === 'custom') {
      return supExpenses.filter(e => {
        if (statementStartDate && e.date < statementStartDate) return false;
        if (statementEndDate && e.date > statementEndDate) return false;
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
    return supExpenses.filter(e => e.date >= limitDateStr);
  };

  const generateChronologicalLedger = (
    supExpenses: Expense[],
    startDateStr?: string,
    endDateStr?: string,
    filterType: string = 'all'
  ) => {
    const rawTx: Array<{
      id: string;
      date: string;
      reference: string;
      type: string;
      debit: number;
      credit: number;
    }> = [];

    supExpenses.forEach(exp => {
      rawTx.push({
        id: `bill_${exp.id}`,
        date: exp.date,
        reference: exp.invoiceNumber || 'N/A',
        type: 'Purchase Bill',
        debit: exp.total,
        credit: 0
      });

      if (exp.paymentHistory) {
        exp.paymentHistory.forEach(pm => {
          rawTx.push({
            id: `pm_${pm.id}`,
            date: pm.date,
            reference: pm.voucherNo || pm.refNo || 'PV-N/A',
            type: `Payment Made (${pm.method})`,
            debit: 0,
            credit: pm.amount
          });
        });
      }
    });

    rawTx.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let targetStartDate = '';
    let targetEndDate = '';

    if (filterType === 'custom') {
      targetStartDate = startDateStr || '';
      targetEndDate = endDateStr || '';
    } else if (filterType !== 'all') {
      const today = new Date('2026-06-26');
      let limitDate = new Date(today);
      if (filterType === 'weekly') {
        limitDate.setDate(today.getDate() - 7);
      } else if (filterType === 'monthly') {
        limitDate.setDate(today.getDate() - 30);
      } else if (filterType === 'quarterly') {
        limitDate.setDate(today.getDate() - 90);
      }
      targetStartDate = limitDate.toISOString().split('T')[0];
    }

    let priorDebitSum = 0;
    let priorCreditSum = 0;
    const currentTx: typeof rawTx = [];

    rawTx.forEach(tx => {
      const isBeforeStart = targetStartDate && tx.date < targetStartDate;
      const isAfterEnd = targetEndDate && tx.date > targetEndDate;

      if (isBeforeStart) {
        priorDebitSum += tx.debit;
        priorCreditSum += tx.credit;
      } else if (!isAfterEnd) {
        currentTx.push(tx);
      }
    });

    const openingBalance = priorDebitSum - priorCreditSum;

    const ledgerRows: Array<{
      id: string;
      date: string;
      reference: string;
      type: string;
      debit: number;
      credit: number;
      runningBalance: number;
    }> = [];

    let currentBalance = openingBalance;

    if (targetStartDate || openingBalance !== 0) {
      ledgerRows.push({
        id: 'opening_balance',
        date: targetStartDate || (rawTx[0]?.date || ''),
        reference: '-',
        type: 'Opening Balance',
        debit: 0,
        credit: 0,
        runningBalance: openingBalance
      });
    }

    currentTx.forEach(tx => {
      currentBalance += (tx.debit - tx.credit);
      ledgerRows.push({
        ...tx,
        runningBalance: currentBalance
      });
    });

    return {
      ledgerRows,
      openingBalance,
      totalPurchased: rawTx.reduce((sum, tx) => sum + tx.debit, 0),
      totalPaid: rawTx.reduce((sum, tx) => sum + tx.credit, 0),
      currentOutstanding: rawTx.reduce((sum, tx) => sum + tx.debit, 0) - rawTx.reduce((sum, tx) => sum + tx.credit, 0),
    };
  };

  useEffect(() => {
    if (isPrintingStatement) {
      const timer = setTimeout(() => {
        triggerPrint('printable-voucher');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isPrintingStatement]);

  if (isPrintingStatement && selectedSupplierDetail) {
    const supExpenses = compExpenses.filter(e => e.supplierName.trim().toLowerCase() === selectedSupplierDetail.name.trim().toLowerCase());
    
    const { ledgerRows, totalPurchased, totalPaid, currentOutstanding } = generateChronologicalLedger(
      supExpenses,
      statementStartDate,
      statementEndDate,
      dateFilterType
    );

    return (
      <div className="bg-white p-8 min-h-screen text-slate-800 font-sans text-xs">
        {/* Print controls floating header */}
        <div className="no-print bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-bold font-sans">BILINGUAL PRINT MODE — Standard A4 Vendor Statement of Account</span>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => triggerPrint('printable-voucher')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-[10px]"
            >
              Print / Save PDF
            </button>
            <button
              onClick={() => setIsPrintingStatement(false)}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-[10px]"
            >
              Exit Print
            </button>
          </div>
        </div>

        {/* Professional GCC Statement Template */}
        <div className="max-w-[800px] mx-auto border border-slate-300 p-8 rounded-lg shadow-xs bg-white">
          <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 font-sans">
                VENDOR STATEMENT OF ACCOUNT
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
                <p className="text-amber-600 dark:text-amber-400 font-mono text-[10px]">TRN missing - Update for FTA Compliance</p>
              )}
              <p className="text-slate-500">{company?.address || 'United Arab Emirates'}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-mono mb-1">Supplier Account</p>
              <p className="font-extrabold text-slate-850">{selectedSupplierDetail.name}</p>
              {selectedSupplierDetail.trn && (
                <p className="text-slate-500 font-mono">TRN: {selectedSupplierDetail.trn}</p>
              )}
              {selectedSupplierDetail.phone && <p className="text-slate-500 font-mono">Phone: {selectedSupplierDetail.phone}</p>}
              {selectedSupplierDetail.address && <p className="text-slate-500 truncate max-w-xs ml-auto">{selectedSupplierDetail.address}</p>}
            </div>
          </div>

          {/* Bento Summary cards */}
          <div className="grid grid-cols-3 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl mb-6">
            <div>
              <span className="text-slate-400 uppercase tracking-wider block text-[8px] font-bold font-mono">Total Purchased (Debit)</span>
              <span className="text-sm font-extrabold text-slate-850">{formatAED(totalPurchased)}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase tracking-wider block text-[8px] font-bold font-mono">Total Settled (Credit)</span>
              <span className="text-sm font-extrabold text-emerald-700">{formatAED(totalPaid)}</span>
            </div>
            <div>
              <span className="text-rose-600 uppercase tracking-wider block text-[8px] font-bold font-mono">Outstanding Payable</span>
              <span className="text-sm font-extrabold text-rose-600">{formatAED(currentOutstanding)}</span>
            </div>
          </div>

          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-600 font-mono uppercase tracking-wider font-bold">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Reference</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right">Debit</th>
                <th className="py-2.5 px-3 text-right">Credit</th>
                <th className="py-2.5 px-3 text-right bg-slate-200/50">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {ledgerRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">No transactions found for the selected range.</td>
                </tr>
              ) : (
                ledgerRows.map(row => (
                  <tr key={row.id}>
                    <td className="py-2.5 px-3">{row.date}</td>
                    <td className="py-2.5 px-3 font-bold">{row.reference}</td>
                    <td className="py-2.5 px-3 font-sans">{row.type}</td>
                    <td className="py-2.5 px-3 text-right">{row.debit > 0 ? formatAED(row.debit) : '-'}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-700">{row.credit > 0 ? formatAED(row.credit) : '-'}</td>
                    <td className="py-2.5 px-3 text-right font-bold bg-slate-50">{formatAED(row.runningBalance)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Helper to convert number to English words for the UAE Dirham & Fils Currency
  const convertNumberToWords = (amount: number): string => {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const num = Math.floor(amount);
    const fils = Math.round((amount - num) * 100);
    
    const helper = (n: number): string => {
      if (n < 20) return units[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '');
      if (n < 1000) return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + helper(n % 100) : '');
      if (n < 1000000) return helper(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + helper(n % 1000) : '');
      return n.toString();
    };
    
    const words = num === 0 ? 'Zero' : helper(num);
    const filsWords = fils > 0 ? ` and ${fils}/100 Fils` : '';
    return `${words} UAE Dirhams${filsWords} Only`;
  };

  // Utility to download a beautiful self-contained PDF Payment Voucher
  const handleDownloadVoucherPDF = async (voucher: any) => {
    if (!voucher) return;
    setIsDownloadingPdf(true);
    setTimeout(async () => {
      const element = document.getElementById('printable-payment-voucher-area');
      if (!element) {
        setIsDownloadingPdf(false);
        return;
      }
      try {
        const supplierName = selectedSupplierDetail?.name || 'Supplier';
        const rawFileName = `${voucher.voucherNo}_${supplierName}.pdf`;
        const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileName = sanitizeFileName(rawFileName);
        
        await generateAndDownloadPDF(element, fileName, { targetId: 'printable-payment-voucher-area', paperSize: 'a4' });
      } catch (error) {
        console.error("Error generating Voucher PDF:", error);
        triggerPrint('printable-payment-voucher-area');
      } finally {
        setIsDownloadingPdf(false);
      }
    }, 150);
  };

  // Utility to download individual Purchase / Expense details as a PDF
  const handleDownloadExpensePDF = async (exp: Expense) => {
    if (!exp) return;
    setDownloadingExpenseId(exp.id);
    
    setTimeout(async () => {
      const element = document.getElementById(`printable-expense-${exp.id}`);
      if (!element) {
        setDownloadingExpenseId(null);
        return;
      }
      try {
        const rawFileName = `${exp.invoiceNumber}_${exp.supplierName || exp.category}.pdf`;
        const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileName = sanitizeFileName(rawFileName);
        
        await generateAndDownloadPDF(element, fileName, { targetId: `printable-expense-${exp.id}`, paperSize: 'a4' });
      } catch (error) {
        console.error("Error generating Expense PDF:", error);
      } finally {
        setDownloadingExpenseId(null);
      }
    }, 150);
  };

  // Utility to download a beautiful self-contained HTML Payment Voucher
  const handleDownloadVoucherHTML = (voucher: any) => {
    const barcodeLines = Array.from({ length: 45 }).map((_, i) => {
      const h = Math.floor(40 + Math.random() * 20);
      const w = Math.random() > 0.4 ? '2px' : '1px';
      const g = Math.floor(2 + Math.random() * 3) + 'px';
      return `<div style="height: ${h}px; width: ${w}; background-color: #000; margin-right: ${g}; display: inline-block;"></div>`;
    }).join('');

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payment Voucher - ${voucher.voucherNo}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 30px 15px; color: #334155; background-color: #f8fafc; display: flex; flex-direction: column; align-items: center; }
    .print-nav-bar { width: 100%; max-width: 800px; background: #0f172a; color: #ffffff; padding: 12px 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; box-shadow: 0 4px 14px rgba(0,0,0,0.15); }
    .btn-print { background: #4f46e5; color: #ffffff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; }
    .card { background: white; width: 100%; max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 36px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 25px; }
    .company-details h1 { margin: 0; font-size: 22px; color: #0f172a; font-weight: 800; }
    .company-details p { margin: 4px 0; font-size: 11px; color: #64748b; font-family: monospace; }
    .title-block { text-align: right; }
    .title-block h2 { margin: 0; font-size: 20px; color: #4f46e5; font-weight: 800; }
    .title-block h3 { margin: 2px 0 0; font-size: 14px; color: #64748b; font-weight: 600; font-style: italic; }
    .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 24px; margin-bottom: 25px; font-size: 12px; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
    .data-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #f1f5f9; }
    .data-label { color: #64748b; font-weight: 500; }
    .data-value { color: #0f172a; font-weight: 700; font-family: monospace; }
    .table-container { margin-bottom: 25px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background-color: #f8fafc; padding: 12px; text-align: left; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0; }
    td { padding: 12px; border-bottom: 1px solid #f1f5f9; }
    .amount-box { background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px; border-radius: 8px; text-align: center; margin-bottom: 25px; }
    .amount-val { font-size: 20px; font-weight: 900; color: #15803d; font-family: monospace; }
    .amount-words { font-size: 11px; color: #166534; font-weight: 600; margin-top: 4px; }
    .signature-grid { display: grid; grid-template-cols: 1fr 1fr 1fr; gap: 20px; margin-top: 40px; text-align: center; font-size: 11px; }
    .sig-box { border-top: 1px solid #cbd5e1; padding-top: 10px; }
    .sig-label { font-weight: 700; color: #0f172a; }
    .sig-label-ar { color: #64748b; font-size: 10px; margin-top: 2px; font-style: italic; }
    .barcode-container { text-align: center; margin-top: 30px; border-top: 1px dashed #e2e8f0; padding-top: 15px; }
    .barcode-val { font-size: 9px; font-family: monospace; color: #94a3b8; margin-top: 4px; letter-spacing: 2px; }

    @media print {
      @page { size: A4 portrait; margin: 8mm 10mm; }
      body { background: #ffffff !important; padding: 0 !important; margin: 0 !important; color: #0f172a !important; }
      .print-nav-bar { display: none !important; }
      .card { box-shadow: none !important; border: none !important; border-radius: 0 !important; padding: 0 !important; max-width: 100% !important; width: 100% !important; margin: 0 !important; }
    }
  </style>
</head>
<body>
  <div class="print-nav-bar">
    <div>
      <div style="font-weight: 800; font-size: 14px;">📄 Payment Voucher #${voucher.voucherNo}</div>
      <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Ready to print • Press <strong>Ctrl + P</strong> (Cmd + P on Mac) or click button</div>
    </div>
    <button class="btn-print" onclick="window.print()">🖨️ Print Voucher (Ctrl+P)</button>
  </div>

  <div class="card">
    <div class="header">
      <div class="company-details">
        <h1>${company?.name || 'evonix Technologies'}</h1>
        <p>TRN: ${company?.trn || '100234567800003'}</p>
        <p>Phone: ${company?.phone || '+971 4 222 3333'} | Email: ${company?.email || 'finance@evonix.ae'}</p>
        <p>${company?.address || 'Dubai, United Arab Emirates'}</p>
      </div>
      <div class="title-block">
        <h2>PAYMENT VOUCHER</h2>
        <p style="font-size: 11px; color: #64748b; font-family: monospace; margin: 8px 0 0;">Voucher No: ${voucher.voucherNo}</p>
        <p style="font-size: 11px; color: #64748b; font-family: monospace; margin: 2px 0 0;">Date: ${voucher.date}</p>
      </div>
    </div>

    <div class="grid">
      <div>
        <div class="section-title">Supplier Details</div>
        <div class="data-row"><span class="data-label">Name:</span><span class="data-value" style="font-family: sans-serif;">${selectedSupplierDetail?.name}</span></div>
        <div class="data-row"><span class="data-label">TRN:</span><span class="data-value">${selectedSupplierDetail?.trn || 'N/A'}</span></div>
        <div class="data-row"><span class="data-label">Emirate:</span><span class="data-value">${selectedSupplierDetail?.emirate || 'Dubai'}</span></div>
      </div>
      <div>
        <div class="section-title">Payment Settlement</div>
        <div class="data-row"><span class="data-label">Payment Method:</span><span class="data-value">${voucher.method}</span></div>
        <div class="data-row"><span class="data-label">Reference No:</span><span class="data-value">${voucher.refNo}</span></div>
        ${voucher.bankName ? `<div class="data-row"><span class="data-label">Bank Name:</span><span class="data-value">${voucher.bankName}</span></div>` : ''}
        ${voucher.chequeDate ? `<div class="data-row"><span class="data-label">Cheque Date:</span><span class="data-value">${voucher.chequeDate}</span></div>` : ''}
      </div>
    </div>

    <div class="amount-box">
      <div class="amount-val">AED ${voucher.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      <div class="amount-words">${convertNumberToWords(voucher.amount)}</div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Linked Document</th>
            <th style="text-align: right;">Document Total</th>
            <th style="text-align: right;">Amount Paid</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Disbursement of Outstanding Vendor Procurement Balance.</td>
            <td>Purchase Bill No: <strong>${voucher.expenseInvoiceNo}</strong></td>
            <td style="text-align: right; font-family: monospace;">AED ${voucher.expenseTotal.toFixed(2)}</td>
            <td style="text-align: right; font-family: monospace; font-weight: bold; color: #15803d;">AED ${voucher.amount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="font-size: 11px; background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 12px; margin-bottom: 40px; border-radius: 4px;">
      <strong>Narration:</strong> ${voucher.notes || 'None.'}
    </div>

    <div class="signature-grid">
      <div class="sig-box">
        <div class="sig-label">Prepared By</div>
        <div style="margin-top: 15px; font-weight: bold; font-family: monospace; font-size: 12px; color: #4f46e5;">${voucher.paidBy}</div>
      </div>
      <div class="sig-box">
        <div class="sig-label">Approved By</div>
        <div style="margin-top: 30px; border-bottom: 1px dotted #94a3b8; width: 80%; margin-left: auto; margin-right: auto;"></div>
      </div>
      <div class="sig-box">
        <div class="sig-label">Supplier Confirmation</div>
        <div style="margin-top: 30px; border-bottom: 1px dotted #94a3b8; width: 80%; margin-left: auto; margin-right: auto;"></div>
        <div style="font-size: 8px; color: #94a3b8; margin-top: 8px;">Received with thanks</div>
      </div>
    </div>

    <div class="barcode-container">
      <div style="display: flex; justify-content: center; align-items: center;">
        ${barcodeLines}
      </div>
      <div class="barcode-val">*${voucher.voucherNo}*</div>
    </div>
  </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Payment_Voucher_${voucher.voucherNo}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Printable A4 GCC Payment Voucher View
  if (printingVoucher && selectedSupplierDetail) {
    const isIframe = typeof window !== 'undefined' && window.self !== window.top;

    return (
      <div className="bg-white p-8 min-h-screen text-slate-800 font-sans text-xs">
        {/* Print controls floating header */}
        <div className="no-print bg-slate-900 text-white p-5 rounded-xl flex flex-col gap-4 mb-8 max-w-[800px] mx-auto shadow-md border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Info className="w-5 h-5 text-emerald-400 animate-pulse shrink-0" />
              <div>
                <span className="text-xs font-bold font-sans block">BILINGUAL PAYMENT VOUCHER — {voucherLayout === 'sleeve' ? 'Sleeve Slip Layout' : 'Standard A4 Layout'}</span>
                <span className="text-[10px] text-slate-400">Printed copy confirms vendor cheque/cash disbursement.</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setVoucherLayout(prev => prev === 'standard' ? 'sleeve' : 'standard');
                }}
                className={`px-3 py-1.5 rounded-lg cursor-pointer text-[10px] font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-sm shrink-0 ${voucherLayout === 'sleeve' ? 'bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-500' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'}`}
                title="Toggle between standard A4 layout and compact sleeve layout"
              >
                <span>{voucherLayout === 'sleeve' ? 'Standard A4' : 'Sleeve Layout'}</span>
              </button>
              <button
                type="button"
                onClick={() => triggerPrint('printable-payment-voucher-area')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider text-[10px] cursor-pointer flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const element = document.getElementById('printable-payment-voucher-area');
                  if (element) {
                    downloadStandaloneHTML({
                      elementOrId: element,
                      fileName: `Payment_Voucher_${printingVoucher.voucherNo}.html`,
                      docTitle: `Payment Voucher #${printingVoucher.voucherNo}`,
                      paperSize: 'A4'
                    });
                  }
                }}
                className="bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-white border border-teal-500/40 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider text-[10px] cursor-pointer flex items-center space-x-1.5 shadow-sm"
                title="Download Standalone Printable HTML file (Ctrl+P ready)"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Download HTML</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadVoucherPDF(printingVoucher)}
                disabled={isDownloadingPdf}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider text-[10px] cursor-pointer flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isDownloadingPdf ? 'Generating...' : 'Download PDF'}</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintingVoucher(null)}
                className="bg-slate-750 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider text-[10px] cursor-pointer"
              >
                Exit
              </button>
            </div>
          </div>

          {isIframe && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 p-3.5 rounded-lg text-[11px] flex items-start gap-2.5">
              <span className="text-sm shrink-0">⚠️</span>
              <div>
                <strong className="block text-amber-300 font-semibold mb-0.5">Direct PDF Export Active</strong>
                Direct PDF downloads are enabled. Click <strong className="text-emerald-300 font-bold">"Download PDF"</strong> above to save your payment voucher in PDF format.
              </div>
            </div>
          )}
        </div>

        {/* Professional GCC Payment Voucher Template */}
        <div id="printable-payment-voucher-area">
          {voucherLayout === 'sleeve' ? (
            /* RENDER COMPACT BILINGUAL SLEEVE PAYMENT VOUCHER */
            <div className="space-y-4 pt-2 text-slate-800 max-w-[800px] mx-auto border-4 border-double border-slate-400 p-6 rounded-xl bg-white shadow-sm font-sans relative">
              {/* Compact Header Grid */}
              <div className="flex justify-between items-start border-b border-dashed border-slate-300 pb-3 gap-4">
                <div className="flex items-center space-x-3">
                  {company?.logoUrl ? (
                    <div className="h-10 w-20 flex items-center justify-start overflow-hidden">
                      <img src={company.logoUrl} alt="logo" className="object-contain max-h-full max-w-full" crossOrigin={isRemoteLogo(company.logoUrl) ? "anonymous" : undefined} />
                    </div>
                  ) : (
                    <div className="bg-slate-900 text-white p-2 rounded font-bold font-mono text-[10px]">
                      {company?.name ? company.name.substring(0, 3).toUpperCase() : 'HISAAB'}
                    </div>
                  )}
                  <div>
                    <h1 className="text-base font-black text-slate-900 uppercase tracking-tight">{company?.name || 'HISAAB PRO LLC'}</h1>
                    <p className="text-[8px] text-slate-500 font-mono leading-none mt-0.5">TRN: {company?.trn || '100234567800003'}</p>
                    <p className="text-[8px] text-slate-500 font-mono leading-none">{company?.phone || '+971 4 222 3333'} | {company?.email || 'finance@hisaabpro.ae'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider inline-block rounded">
                    Payment Voucher
                  </span>
                  <div className="mt-1.5 text-[8px] font-mono text-slate-600 leading-tight">
                    <p>Voucher No: <strong className="text-slate-900 font-bold">{printingVoucher.voucherNo}</strong></p>
                    <p>Date: {printingVoucher.date}</p>
                  </div>
                </div>
              </div>

              {/* Compact Content Fields */}
              <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/55 text-[10px] space-y-2">
                <div className="grid grid-cols-12 gap-2 border-b border-slate-100 pb-1.5">
                  <div className="col-span-3 text-slate-500 font-bold">Paid To:</div>
                  <div className="col-span-9 font-extrabold text-slate-900 text-xs">{selectedSupplierDetail.name}</div>
                </div>

                <div className="grid grid-cols-12 gap-2 border-b border-slate-100 pb-1.5 items-center">
                  <div className="col-span-3 text-slate-500 font-bold">Disbursement:</div>
                  <div className="col-span-4 font-black text-slate-900 text-sm font-mono bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    AED {printingVoucher.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="col-span-5 text-right font-semibold text-slate-650 text-[9px] truncate">
                    {convertNumberToWords(printingVoucher.amount)}
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2 border-b border-slate-100 pb-1.5 font-sans">
                  <div className="col-span-3 text-slate-500 font-bold">Ref & Method:</div>
                  <div className="col-span-9 font-semibold text-slate-700 text-[9px]">
                    {printingVoucher.method} {printingVoucher.refNo ? `(Ref: ${printingVoucher.refNo})` : ''}
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-3 text-slate-500 font-bold">Narration:</div>
                  <div className="col-span-9 text-slate-600 italic">
                    {printingVoucher.notes || 'Settlement of outstanding trade balance.'}
                  </div>
                </div>
              </div>

              {/* Compact Signature & Barcode Section */}
              <div className="grid grid-cols-12 gap-4 items-center pt-2">
                <div className="col-span-8 grid grid-cols-2 gap-4 text-center text-[9px]">
                  <div className="border-t border-dashed border-slate-300 pt-1.5">
                    <p className="font-bold text-slate-700">Paid By: <span className="font-mono text-indigo-700">{printingVoucher.paidBy}</span></p>
                  </div>
                  <div className="border-t border-dashed border-slate-300 pt-1.5">
                    <p className="font-bold text-slate-700">Vendor Signature</p>
                  </div>
                </div>
                <div className="col-span-4 flex justify-end">
                  <Barcode value={printingVoucher.voucherNo || ''} />
                </div>
              </div>
            </div>
          ) : (
            /* RENDER STANDARD A4 PAYMENT DISBURSEMENT VOUCHER */
            <div className="max-w-[800px] mx-auto border border-slate-300 p-8 rounded-xl bg-white space-y-6 shadow-sm">
              {/* Header Grid with Logo Support */}
              {(() => {
                const logoPos = company?.logoPosition || 'center';
                const logoSizeClass = company?.logoSize === 'small' ? 'h-12 w-24' : company?.logoSize === 'large' ? 'h-24 w-48' : 'h-16 w-32';
                
                const voucherMeta = (
                  <div>
                    <h1 className="text-xl font-extrabold tracking-tight text-slate-900 font-sans">
                      PAYMENT DISBURSEMENT VOUCHER
                    </h1>
                    <div className="text-[10px] text-slate-400 font-mono mt-3">
                      Printed: {new Date().toLocaleDateString('en-AE')}
                    </div>
                  </div>
                );

                const companyDetails = (
                  <div className="text-right">
                    <h3 className="text-lg font-black tracking-tight text-[#0F172A]">{company?.name || 'HISAAB PRO LLC'}</h3>
                    <p className="text-[10px] text-slate-400 font-mono uppercase">Financial Systems UAE</p>
                    <p className="text-[10px] text-slate-400 font-mono">TRN: {company?.trn || '100234567800003'}</p>
                    {company?.address && <p className="text-[10px] text-slate-400 font-mono">{company?.address}</p>}
                  </div>
                );

                const logoEl = company?.logoUrl ? (
                  <div className={`${logoSizeClass} flex items-center justify-end overflow-hidden mb-2`}>
                    <img src={company.logoUrl} alt="logo" className="object-contain max-h-full max-w-full" crossOrigin={isRemoteLogo(company.logoUrl) ? "anonymous" : undefined} />
                  </div>
                ) : null;

                if (logoPos === 'left' && logoEl) {
                  return (
                    <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                      <div className="flex items-start space-x-4">
                        <div className="shrink-0 pt-1">
                          <div className={`${logoSizeClass} flex items-center justify-start overflow-hidden`}>
                            <img src={company.logoUrl} alt="logo" className="object-contain max-h-full max-w-full" crossOrigin={isRemoteLogo(company.logoUrl) ? "anonymous" : undefined} />
                          </div>
                        </div>
                        {voucherMeta}
                      </div>
                      {companyDetails}
                    </div>
                  );
                } else if (logoPos === 'right' && logoEl) {
                  return (
                    <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                      {voucherMeta}
                      <div className="flex flex-col items-end">
                        {logoEl}
                        {companyDetails}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="flex flex-col border-b border-slate-200 pb-6 space-y-4">
                      {logoEl && (
                        <div className="flex justify-center">
                          <div className={`${logoSizeClass} flex items-center justify-center overflow-hidden`}>
                            <img src={company.logoUrl} alt="logo" className="object-contain max-h-full max-w-full" crossOrigin={isRemoteLogo(company.logoUrl) ? "anonymous" : undefined} />
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between items-start">
                        {voucherMeta}
                        {companyDetails}
                      </div>
                    </div>
                  );
                }
              })()}

              <div className="grid grid-cols-2 gap-8 text-[11px] bg-slate-50 border border-slate-150 p-4 rounded-xl">
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-mono">Voucher Meta</p>
                  <p className="text-slate-700"><strong>Voucher No:</strong> <span className="font-mono font-bold text-slate-900">{printingVoucher.voucherNo}</span></p>
                  <p className="text-slate-700"><strong>Date:</strong> <span className="font-mono text-slate-900">{printingVoucher.date}</span></p>
                  <p className="text-slate-700"><strong>Payment Method:</strong> <span className="font-sans font-bold text-indigo-700">{printingVoucher.method}</span></p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-mono">Recipient (Supplier)</p>
                  <p className="text-slate-700"><strong>Supplier Name:</strong> <span className="font-sans font-bold text-slate-900">{selectedSupplierDetail.name}</span></p>
                  {selectedSupplierDetail.trn && (
                    <p className="text-slate-700 font-mono"><strong>Supplier TRN:</strong> <span className="font-mono text-slate-900">{selectedSupplierDetail.trn}</span></p>
                  )}
                  <p className="text-slate-700"><strong>Emirate:</strong> <span className="font-sans text-slate-900">{selectedSupplierDetail.emirate || 'Dubai'}</span></p>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
                <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-widest font-mono">Disbursement Amount</span>
                <div className="text-2xl font-black text-emerald-800 font-mono mt-1">AED {printingVoucher.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-[10px] text-emerald-700 font-semibold mt-1">{convertNumberToWords(printingVoucher.amount)}</p>
              </div>

              {/* Payment Details Section */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                  <h3 className="text-[9px] font-bold uppercase tracking-wider text-slate-500 font-mono">Settlement & Document Details</h3>
                </div>
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100/50 border-b border-slate-200 font-mono text-slate-500 text-[10px] uppercase">
                      <th className="py-2 px-4 font-bold">Narration</th>
                      <th className="py-2 px-4 font-bold">Document Number</th>
                      <th className="py-2 px-4 text-right font-bold">Invoice Total</th>
                      <th className="py-2 px-4 text-right font-bold">Amount Settled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    <tr>
                      <td className="py-3 px-4 font-sans text-slate-600">Disbursement of outstanding trade balance.</td>
                      <td className="py-3 px-4 font-bold text-indigo-700">{printingVoucher.expenseInvoiceNo}</td>
                      <td className="py-3 px-4 text-right">AED {printingVoucher.expenseTotal.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">AED {printingVoucher.amount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payment Method Metadata */}
              <div className="grid grid-cols-2 gap-4 text-[11px] border border-slate-150 p-4 rounded-xl">
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400 font-mono">Payment Instrument Details</p>
                  <p className="text-slate-600 mt-1"><strong>Reference No:</strong> <span className="font-mono text-slate-800">{printingVoucher.refNo}</span></p>
                  {printingVoucher.bankName && (
                    <p className="text-slate-600"><strong>Bank Name:</strong> <span className="font-sans text-slate-800">{printingVoucher.bankName}</span></p>
                  )}
                  {printingVoucher.chequeDate && (
                    <p className="text-slate-600"><strong>Cheque Due Date:</strong> <span className="font-mono text-slate-800">{printingVoucher.chequeDate}</span></p>
                  )}
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400 font-mono">Remarks</p>
                  <p className="text-slate-500 italic mt-1 font-sans">{printingVoucher.notes || 'No remarks recorded.'}</p>
                </div>
              </div>

              {/* Signature Grid */}
              <div className="grid grid-cols-3 gap-6 pt-12 text-[10px]">
                <div className="border-t border-slate-300 pt-3 text-center space-y-1">
                  <span className="font-bold text-slate-700 block">Prepared By</span>
                  <div className="font-mono font-bold text-indigo-600 pt-2">{printingVoucher.paidBy}</div>
                </div>
                <div className="border-t border-slate-300 pt-3 text-center space-y-1">
                  <span className="font-bold text-slate-700 block">Approved By</span>
                  <div className="text-slate-300 pt-4">_______________________</div>
                </div>
                <div className="border-t border-slate-300 pt-3 text-center space-y-1">
                  <span className="font-bold text-slate-700 block">Supplier Signature</span>
                  <div className="text-slate-300 pt-4">_______________________</div>
                  <span className="text-[8px] text-slate-400 block font-sans pt-1">I confirm receipt of this cash/cheque in full.</span>
                </div>
              </div>

              {/* Barcode representation */}
              <div className="border-t border-slate-100 pt-6 text-center">
                <Barcode value={printingVoucher.voucherNo || ''} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectedSupplierDetail) {
    const supExpenses = compExpenses.filter(e => e.supplierName.trim().toLowerCase() === selectedSupplierDetail.name.trim().toLowerCase())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalBills = supExpenses.length;
    const totalPurchase = supExpenses.reduce((sum, e) => sum + e.total, 0);
    const totalPaid = supExpenses.reduce((sum, e) => sum + (e.paymentReceived || 0), 0);
    const totalPendingAmount = totalPurchase - totalPaid;

    const statementExpenses = getFilteredStatementExpenses(supExpenses);

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Back Button */}
        <button
          onClick={() => setSelectedSupplierDetail(null)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory / Ledger</span>
        </button>

        {/* HEADER SECTION - Top pe */}
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#EFF6FF] text-[#1E3A8A] rounded-xl flex items-center justify-center font-black text-lg">
              {selectedSupplierDetail.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#0F172A]">{selectedSupplierDetail.name}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1 font-mono">
                {selectedSupplierDetail.phone && (
                  <span className="flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{selectedSupplierDetail.phone}</span>
                  </span>
                )}
                {selectedSupplierDetail.trn && (
                  <span className="flex items-center space-x-1 text-emerald-700">
                    <Building className="w-3.5 h-3.5" />
                    <span>TRN: {selectedSupplierDetail.trn}</span>
                  </span>
                )}
              </div>
              {selectedSupplierDetail.address && (
                <p className="text-xs text-slate-400 mt-1.5 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{selectedSupplierDetail.address}</span>
                </p>
              )}
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
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Total Bills Logged</span>
            <div className="text-2xl font-black text-slate-800 mt-1">{totalBills}</div>
            <p className="text-[9px] text-slate-400 mt-1">Total invoices recorded</p>
          </div>
          <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-xs">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Total Purchase Volume</span>
            <div className="text-2xl font-black text-slate-800 mt-1">AED {totalPurchase.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-[9px] text-slate-400 mt-1">Gross trade procurement</p>
          </div>
          <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-xs">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-600">Total Paid</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">AED {totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-[9px] text-emerald-600 mt-1 font-sans">Settled purchase payments</p>
          </div>
          <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-xs">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-500">Total Outstanding Payable</span>
            <div className="text-2xl font-black text-rose-600 mt-1">AED {totalPendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-[9px] text-rose-500 mt-1 font-sans">Pending vendor balances</p>
          </div>
        </div>

        {/* Navigation Tabs & Quick Actions — GCC Style (Rule 8) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 border border-slate-200 p-3 rounded-xl">
          <div className="flex space-x-2">
            <button
              onClick={() => setSupplierDetailTab('bills')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                supplierDetailTab === 'bills' 
                  ? 'bg-[#0F172A] text-white shadow-xs' 
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Purchases & Bills ({supExpenses.length})</span>
            </button>
            <button
              onClick={() => setSupplierDetailTab('payments')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                supplierDetailTab === 'payments' 
                  ? 'bg-[#0F172A] text-white shadow-xs' 
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payment History ({supExpenses.reduce((count, e) => count + (e.paymentHistory?.length || 0), 0)})</span>
            </button>
          </div>

          <button
            onClick={() => {
              const unpaid = supExpenses.find(e => e.status !== 'Paid');
              setPayBillId(unpaid ? unpaid.id : '');
              setPayAmount(unpaid ? parseFloat((unpaid.total - (unpaid.paymentReceived || 0)).toFixed(2)) : 0);
              setPayVoucherNo(`PV-${String(Math.floor(10000 + Math.random() * 90000))}`);
              setIsRecordPaymentOpen(true);
            }}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Supplier Payment</span>
          </button>
        </div>

        {/* C. LIST SECTION - Dynamic Tab Content */}
        {supplierDetailTab === 'bills' ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#E2E8F0] bg-slate-50">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 font-mono">Supplier Bills (Date Wise)</h3>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium font-mono text-[11px]">
                  {supExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 italic">No purchase bills logged for this supplier yet.</td>
                    </tr>
                  ) : (
                    supExpenses.map(exp => {
                      const isPaid = exp.status === 'Paid';
                      const received = exp.paymentReceived || 0;
                      const pending = exp.total - received;
                      return (
                        <tr
                          key={exp.id}
                          onClick={() => handleOpenEdit(exp)}
                          className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4 font-sans font-medium">{exp.date}</td>
                          <td className="py-3 px-4 font-bold text-indigo-700 hover:underline">{exp.invoiceNumber || 'N/A'}</td>
                          <td className="py-3 px-4 text-right font-bold">AED {exp.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="py-3 px-4 text-right text-emerald-600">
                            {received > 0 ? `AED ${received.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                          </td>
                          <td className="py-3 px-4 text-right text-rose-600 font-bold">
                            {pending > 0 ? `AED ${pending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                              isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              pending < exp.total && pending > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {isPaid ? 'Paid' : pending < exp.total && pending > 0 ? 'Partial' : 'Unpaid'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#E2E8F0] bg-slate-50">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 font-mono">Supplier Payment Ledger</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-slate-600">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase font-mono tracking-wider text-slate-400 border-b border-[#E2E8F0]">
                    <th className="py-3 px-4 font-bold">Date</th>
                    <th className="py-3 px-4 font-bold">Voucher No</th>
                    <th className="py-3 px-4 font-bold">Bill Ref</th>
                    <th className="py-3 px-4 text-right font-bold">Amount Paid</th>
                    <th className="py-3 px-4 font-bold text-center">Method</th>
                    <th className="py-3 px-4 font-bold">Reference</th>
                    <th className="py-3 px-4 text-center font-bold no-print">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium font-mono text-[11px]">
                  {(() => {
                    const supplierPayments: Array<{
                      expenseId: string;
                      expenseInvoiceNo: string;
                      expenseTotal: number;
                      paymentId: string;
                      date: string;
                      amount: number;
                      method: string;
                      refNo: string;
                      paidBy: string;
                      bankName?: string;
                      chequeDate?: string;
                      notes?: string;
                      voucherNo?: string;
                    }> = [];

                    supExpenses.forEach(exp => {
                      if (exp.paymentHistory) {
                        exp.paymentHistory.forEach(pm => {
                          supplierPayments.push({
                            expenseId: exp.id,
                            expenseInvoiceNo: exp.invoiceNumber,
                            expenseTotal: exp.total,
                            paymentId: pm.id,
                            date: pm.date,
                            amount: pm.amount,
                            method: pm.method,
                            refNo: pm.refNo,
                            paidBy: pm.paidBy,
                            bankName: pm.bankName,
                            chequeDate: pm.chequeDate,
                            notes: pm.notes,
                            voucherNo: pm.voucherNo
                          });
                        });
                      }
                    });

                    supplierPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                    if (supplierPayments.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 italic">No disbursement history recorded for this supplier yet.</td>
                        </tr>
                      );
                    }

                    return supplierPayments.map(pm => (
                      <tr key={pm.paymentId} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-sans font-medium">{pm.date}</td>
                        <td className="py-3 px-4 font-bold text-indigo-700">{pm.voucherNo || 'N/A'}</td>
                        <td className="py-3 px-4 text-slate-500">Bill: {pm.expenseInvoiceNo}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">AED {pm.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200">
                            {pm.method}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[10px] text-slate-500 truncate max-w-[150px]">
                          {pm.method === 'Cheque' ? `Chq: ${pm.refNo} | ${pm.bankName || ''}` : `Ref: ${pm.refNo}`}
                        </td>
                        <td className="py-3 px-4 text-center no-print">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => setPrintingVoucher(pm)}
                              title="Print Bilingual Payment Voucher"
                              className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-indigo-600 cursor-pointer"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadVoucherHTML(pm)}
                              title="Download Voucher Receipt"
                              className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-emerald-600 cursor-pointer"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Record Supplier Payment Modal (Bilingual & High Fidelity) */}
        {isRecordPaymentOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-zoom-in">
              <div className="bg-[#0F172A] text-white p-4 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest font-mono">Record Vendor Disbursement</h3>
                  <p className="text-[10px] text-slate-300">Record supplier payment voucher</p>
                </div>
                <button onClick={() => setIsRecordPaymentOpen(false)} className="text-slate-300 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSupplierPayment} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                {/* Select Bill */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Select Purchase Invoice <span className="text-rose-600">*</span>
                  </label>
                  <select
                    required
                    value={payBillId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      setPayBillId(selectedId);
                      const selectedBill = supExpenses.find(x => x.id === selectedId);
                      if (selectedBill) {
                        const remaining = selectedBill.total - (selectedBill.paymentReceived || 0);
                        setPayAmount(parseFloat(remaining.toFixed(2)));
                      } else {
                        setPayAmount(0);
                      }
                    }}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white text-xs font-semibold text-slate-800"
                  >
                    <option value="">-- Choose Unpaid/Partial Bill --</option>
                    {supExpenses.map(b => {
                      const remaining = b.total - (b.paymentReceived || 0);
                      if (remaining <= 0) return null;
                      return (
                        <option key={b.id} value={b.id}>
                          Bill: {b.invoiceNumber || 'N/A'} (Date: {b.date}) - Balance: AED {remaining.toFixed(2)}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Amount Paid */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Payment Amount <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-[10px] font-bold text-slate-400">AED</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        min="0.01"
                        value={payAmount || ''}
                        onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                        className="w-full border border-slate-200 rounded-lg pl-10 pr-3 py-2 bg-white text-xs font-bold text-slate-850"
                      />
                    </div>
                  </div>

                  {/* Voucher Number */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Voucher Number <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PV-1023"
                      value={payVoucherNo}
                      onChange={(e) => setPayVoucherNo(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-xs font-mono text-slate-850"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Date */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Voucher Date
                    </label>
                    <input
                      type="date"
                      required
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-xs font-mono text-slate-850"
                    />
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value as any)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-xs text-slate-850"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Credit/Debit Card">Credit/Debit Card</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Conditional Cheque Fields */}
                {payMethod === 'Cheque' && (
                  <div className="bg-indigo-50/40 border border-indigo-100 p-4 rounded-xl space-y-3 animate-fade-in">
                    <p className="text-[9px] uppercase font-bold text-indigo-700 font-mono tracking-wider">Cheque Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Cheque Number *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 883401"
                          value={payRefNo}
                          onChange={(e) => setPayRefNo(e.target.value)}
                          className="w-full border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Bank Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Emirates NBD"
                          value={payBankName}
                          onChange={(e) => setPayBankName(e.target.value)}
                          className="w-full border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-xs font-semibold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Cheque Due Date (Maturity Date) *</label>
                      <input
                        type="date"
                        required
                        value={payChequeDate}
                        onChange={(e) => setPayChequeDate(e.target.value)}
                        className="w-full border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Conditional Bank Transfer Fields */}
                {payMethod === 'Bank Transfer' && (
                  <div className="bg-indigo-50/40 border border-indigo-100 p-4 rounded-xl space-y-3 animate-fade-in">
                    <p className="text-[9px] uppercase font-bold text-indigo-700 font-mono tracking-wider">Transfer Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Transaction Ref / ID *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. TXN-9943201"
                          value={payRefNo}
                          onChange={(e) => setPayRefNo(e.target.value)}
                          className="w-full border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Paying Bank Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Abu Dhabi Commercial Bank"
                          value={payBankName}
                          onChange={(e) => setPayBankName(e.target.value)}
                          className="w-full border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Other/Card Reference */}
                {payMethod !== 'Cheque' && payMethod !== 'Bank Transfer' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Reference / Auth Code <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cash Receipt Ref or Card Trans ID"
                      value={payRefNo}
                      onChange={(e) => setPayRefNo(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-xs font-mono"
                    />
                  </div>
                )}

                {/* Paid By / Prepared By */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Prepared By <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Finance Controller"
                    value={payPaidBy}
                    onChange={(e) => setPayPaidBy(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-xs font-semibold"
                  />
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Remarks
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Full/Partial disbursement settled via cheque."
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white text-xs"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsRecordPaymentOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-lg text-xs uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-lg text-xs uppercase cursor-pointer"
                  >
                    Save & Generate Voucher
                  </button>
                </div>
              </form>
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
                      const supExpenses = compExpenses.filter(e => e.supplierName.trim().toLowerCase() === selectedSupplierDetail.name.trim().toLowerCase());
                      const { ledgerRows } = generateChronologicalLedger(
                        supExpenses,
                        statementStartDate,
                        statementEndDate,
                        dateFilterType
                      );
                      const csvRows = [
                        ["Date", "Reference / Al Marji'", "Description / Al Wasf", "Debit / Madeen (AED)", "Credit / Da'en (AED)", "Running Balance / Al Raseed (AED)"].join(",")
                      ];
                      ledgerRows.forEach(row => {
                        csvRows.push([
                          row.date,
                          `"${row.reference.replace(/"/g, '""')}"`,
                          `"${row.type.replace(/"/g, '""')}"`,
                          row.debit.toFixed(2),
                          row.credit.toFixed(2),
                          row.runningBalance.toFixed(2)
                        ].join(","));
                      });
                      const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join("\n"));
                      const link = document.createElement("a");
                      link.setAttribute("href", csvContent);
                      link.setAttribute("download", `Vendor_Ledger_${selectedSupplierDetail.name.replace(/\s+/g, '_')}.csv`);
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

  if (activeView === 'purchase_orders' || activeView === 'goods_received') {
    return (
      <ProcurementManager
        activeCompanyId={activeCompanyId}
        company={company}
        suppliers={suppliers}
        inventory={inventory}
        branches={branches}
        purchaseOrders={purchaseOrders}
        goodsReceivedNotes={goodsReceivedNotes}
        onAddPO={onAddPO}
        onUpdatePO={onUpdatePO}
        onDeletePO={onDeletePO}
        onAddGRN={onAddGRN}
        onUpdateGRN={onUpdateGRN}
        onDeleteGRN={onDeleteGRN}
        onAdjustStock={onAdjustStock}
        onConvertToExpense={onAddExpense}
        activeSidebarItemId={activeSidebarItemId}
        setActiveSidebarItemId={setActiveSidebarItemId}
      />
    );
  }

  return (
    <div className="space-y-8 font-sans">
      
      {/* =========================================================================
          VIEW 1A: ADD NEW SUPPLIER PROFILE (INLINE)
          ========================================================================= */}
      {activeView === 'suppliers' && activeSidebarItemId === 'sup_add' && (
        <div className="bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-[1400px] mx-auto overflow-hidden">
          {/* Header */}
          <div className="bg-[#0F172A] text-white p-4 flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Truck className="w-5 h-5 text-[#4F46E5]" />
              <h3 className="text-xs font-bold uppercase tracking-widest font-sans text-[#4F46E5]">
                {editingSupplier ? 'Modify Trade Supplier' : 'Register Trade Supplier'}
              </h3>
            </div>
            <button 
              type="button"
              onClick={() => {
                setEditingSupplier(null);
                if (setActiveSidebarItemId) setActiveSidebarItemId('sup_list');
              }}
              className="text-slate-400 hover:text-white cursor-pointer transition-colors p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSupplierSubmit} className="p-4 sm:p-6 space-y-6 text-xs font-sans">
            {/* TOP HEADER: UNIQUE CODE */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 rounded-xl border border-slate-800 shadow-md flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center font-mono font-bold text-indigo-300 text-sm shrink-0">
                  #
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-300 font-bold">
                      Unique Supplier Code
                    </span>
                    <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Unique Active
                    </span>
                  </div>
                  <div className="text-base font-black font-mono tracking-wider text-white mt-0.5">
                    {newSupCode || generateNextSupplierCode()}
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
                    type="text"
                    placeholder="e.g., Ahmed Al-Mansoori"
                    value={newSupContactPerson}
                    onChange={(e) => setNewSupContactPerson(e.target.value)}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-xs font-sans text-slate-800 focus:border-[#4F46E5] focus:outline-hidden transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Supplier Code</label>
                  <input
                    type="text"
                    placeholder="Auto-generated"
                    value={newSupCode}
                    onChange={(e) => setNewSupCode(e.target.value)}
                    className="w-full border border-[#E2E8F0] bg-slate-50 rounded-lg px-3 py-2 text-xs font-mono font-bold text-indigo-700 focus:border-[#4F46E5] focus:outline-hidden transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Company & Tax Registrations */}
            <div>
              <h4 className="font-sans font-bold text-[#0F172A] text-sm italic border-b border-[#E2E8F0] pb-1.5 mb-3">
                Company & Tax Registrations
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Supplier Legal Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Jabal Ali Construction Materials FZ-LLC"
                    value={newSupName}
                    onChange={(e) => setNewSupName(e.target.value)}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-xs font-sans text-slate-800 focus:border-[#4F46E5] focus:outline-hidden transition-colors"
                  />
                </div>

                {/* VAT Status Cards */}
                {isVatEnabled && (
                  <div className="md:col-span-2 space-y-3">
                    <div className="flex justify-between items-baseline">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        VAT Status Selection
                      </label>
                      <span className="text-[10px] font-mono font-bold text-slate-400">FTA GCC Classification</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Has VAT */}
                      <div
                        onClick={() => {
                          setNewSupVatStatus('yes');
                          setNewSupTrn('');
                          setTrnValidationError('');
                        }}
                        className={`relative group cursor-pointer rounded-xl p-3.5 border transition-all duration-200 flex flex-col justify-between ${
                          newSupVatStatus === 'yes'
                            ? 'bg-gradient-to-br from-indigo-50/90 via-white to-indigo-50/50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                            : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/60 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            newSupVatStatus === 'yes' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            newSupVatStatus === 'yes' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : 'bg-slate-100 text-slate-500'
                          }`}>
                            15-Digit TRN
                          </span>
                        </div>
                        <div>
                          <h5 className={`font-bold text-xs ${newSupVatStatus === 'yes' ? 'text-indigo-950' : 'text-slate-800'}`}>
                            Has VAT Number
                          </h5>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-sans leading-tight">
                            Registered business supplier with active UAE Tax Registration Number.
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span className="font-mono text-slate-400 text-[9px]">Standard Tax Invoice</span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            newSupVatStatus === 'yes' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                          }`}>
                            {newSupVatStatus === 'yes' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                        </div>
                      </div>

                      {/* No VAT */}
                      <div
                        onClick={() => {
                          setNewSupVatStatus('no');
                          setNewSupTrn('');
                          setTrnValidationError('');
                        }}
                        className={`relative group cursor-pointer rounded-xl p-3.5 border transition-all duration-200 flex flex-col justify-between ${
                          newSupVatStatus === 'no'
                            ? 'bg-gradient-to-br from-amber-50/90 via-white to-amber-50/50 border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                            : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-slate-50/60 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            newSupVatStatus === 'no' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <Info className="w-4 h-4" />
                          </div>
                          <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            newSupVatStatus === 'no' ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-slate-100 text-slate-500'
                          }`}>
                            Unregistered Vendor
                          </span>
                        </div>
                        <div>
                          <h5 className={`font-bold text-xs ${newSupVatStatus === 'no' ? 'text-amber-950' : 'text-slate-800'}`}>
                            No VAT (Unregistered)
                          </h5>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-sans leading-tight">
                            Non-registered trade vendor. Issued simple bill without input tax claim.
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span className="font-mono text-slate-400 text-[9px]">Standard Purchase Bill</span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            newSupVatStatus === 'no' ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300'
                          }`}>
                            {newSupVatStatus === 'no' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                        </div>
                      </div>

                      {/* VAT Pending [TEMP] */}
                      <div
                        onClick={() => {
                          setNewSupVatStatus('pending');
                          const nextId = 'TRN-PEND-' + Math.floor(1000 + Math.random() * 9000);
                          setNewSupTrn(nextId);
                          setTrnValidationError('');
                        }}
                        className={`relative group cursor-pointer rounded-xl p-3.5 border transition-all duration-200 flex flex-col justify-between ${
                          newSupVatStatus === 'pending'
                            ? 'bg-gradient-to-br from-rose-50/90 via-white to-rose-50/50 border-rose-500 ring-2 ring-rose-500/20 shadow-md'
                            : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-slate-50/60 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            newSupVatStatus === 'pending' ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            newSupVatStatus === 'pending' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-slate-100 text-slate-500'
                          }`}>
                            FTA Suspense
                          </span>
                        </div>
                        <div>
                          <h5 className={`font-bold text-xs ${newSupVatStatus === 'pending' ? 'text-rose-950' : 'text-slate-800'}`}>
                            VAT Pending [TEMP]
                          </h5>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-sans leading-tight">
                            Provisional supplier profile created. Input VAT held in Suspense until TRN verified.
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span className="font-mono text-rose-600 font-bold text-[9px]">Provisional Ledger</span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            newSupVatStatus === 'pending' ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-300'
                          }`}>
                            {newSupVatStatus === 'pending' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                        </div>
                      </div>
                    </div>

                    {newSupVatStatus === 'yes' && (
                      <div className="space-y-1 animate-fade-in mt-3 p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                          UAE Tax Registration Number (TRN) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={15}
                          placeholder="e.g., 100234567800003"
                          value={newSupTrn}
                          onChange={(e) => {
                            setNewSupTrn(e.target.value.replace(/\D/g, ''));
                            setTrnValidationError('');
                          }}
                          className="w-full border border-indigo-200 rounded-lg px-3 py-2 bg-white font-mono text-xs focus:border-[#4F46E5] focus:outline-hidden transition-colors font-bold text-slate-900"
                        />
                        {trnValidationError && (
                          <p className="text-[10px] text-rose-600 font-semibold mt-1">{trnValidationError}</p>
                        )}
                      </div>
                    )}

                    {newSupVatStatus === 'pending' && (
                      <div className="space-y-2 p-3 bg-rose-50/60 border border-rose-200 rounded-xl animate-fade-in mt-3">
                        <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>VAT Registration No. Pending (Update within 5 days)</span>
                        </div>
                        <div className="text-[11px] text-slate-700 font-mono">
                          Auto-Assigned Temp ID: <span className="bg-white px-2 py-0.5 rounded border border-rose-300 font-bold text-rose-900">{newSupTrn || 'Generating...'}</span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-normal">
                          Provisional supplier profile created. Input VAT for purchase invoices will be held in Suspense until formal TRN is verified.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Supplier Trade License No. <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., TL-88912-DB"
                    value={newSupTradeLicense}
                    onChange={(e) => setNewSupTradeLicense(e.target.value)}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-xs font-sans text-slate-800 focus:border-[#4F46E5] focus:outline-hidden transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Contact Information */}
            <div>
              <h4 className="font-sans font-bold text-[#0F172A] text-sm italic border-b border-[#E2E8F0] pb-1.5 mb-3">
                Contact Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g., sales@jabalali.ae"
                    value={newSupEmail}
                    onChange={(e) => setNewSupEmail(e.target.value)}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-xs font-sans text-slate-800 focus:border-[#4F46E5] focus:outline-hidden transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Phone Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., +971 4 881 1111"
                    value={newSupPhone}
                    onChange={(e) => setNewSupPhone(e.target.value)}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-xs font-sans text-slate-800 focus:border-[#4F46E5] focus:outline-hidden transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: Address, Location & Financial Preferences */}
            <div>
              <h4 className="font-sans font-bold text-[#0F172A] text-sm italic border-b border-[#E2E8F0] pb-1.5 mb-3">
                Address, Location & Financial Preferences
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Warehouse / Office Address</label>
                  <textarea
                    rows={2}
                    placeholder="e.g., Warehouse 4, Jebel Ali Industrial Zone 1"
                    value={newSupAddress}
                    onChange={(e) => setNewSupAddress(e.target.value)}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-xs font-sans text-slate-800 focus:border-[#4F46E5] focus:outline-hidden transition-colors resize-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {companyCountry === 'Pakistan' ? 'Supplier City' : (countryConfig?.regionTypeName ? `${countryConfig.regionTypeName} / City` : 'Business Emirate / City')} <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSupplierAddCity(!showSupplierAddCity)}
                      className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-0.5 cursor-pointer uppercase tracking-wider"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>{showSupplierAddCity ? 'Close' : 'Add City'}</span>
                    </button>
                  </div>

                  {showSupplierAddCity && (
                    <div className="flex items-center space-x-1 mb-2">
                      <input
                        type="text"
                        placeholder="Enter new city name..."
                        value={manualSupplierCity}
                        onChange={(e) => setManualSupplierCity(e.target.value)}
                        className="flex-1 border border-indigo-200 rounded-lg px-2.5 py-1.5 bg-white text-xs text-slate-800 focus:outline-hidden focus:border-indigo-600 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = manualSupplierCity.trim();
                          if (trimmed) {
                            if (!customSupplierCities.includes(trimmed)) {
                              const updated = [...customSupplierCities, trimmed];
                              setCustomSupplierCities(updated);
                              try { localStorage.setItem('hisaab_custom_cities', JSON.stringify(updated)); } catch (e) {}
                            }
                            setNewSupEmirate(trimmed);
                            setManualSupplierCity('');
                            setShowSupplierAddCity(false);
                          }
                        }}
                        className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  )}

                  <select
                    required
                    value={newSupEmirate}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setShowSupplierAddCity(true);
                      } else {
                        setNewSupEmirate(e.target.value);
                      }
                    }}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-xs font-sans text-slate-800 focus:border-[#4F46E5] focus:outline-hidden transition-colors"
                  >
                    {supplierCountryCities.map((ct) => (
                      <option key={ct} value={ct}>{ct}</option>
                    ))}
                    <option value="__add_new__">+ Add Custom City...</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Date Registered / Added</label>
                  <input
                    type="date"
                    value={newSupDateAdded}
                    onChange={(e) => setNewSupDateAdded(e.target.value)}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-xs font-sans text-slate-800 focus:border-[#4F46E5] focus:outline-hidden transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Form Buttons */}
            <div className="flex justify-end space-x-2 pt-4 border-t border-[#E2E8F0] dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setEditingSupplier(null);
                  if (setActiveSidebarItemId) setActiveSidebarItemId('sup_list');
                }}
                className="px-5 py-2.5 border border-[#E2E8F0] dark:border-slate-700 rounded-lg hover:bg-[#E2E8F0]/30 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer text-xs uppercase tracking-wider transition-colors font-sans"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#0F172A] hover:bg-[#4F46E5] text-white rounded-lg font-bold uppercase tracking-widest flex items-center space-x-1 transition-colors cursor-pointer shadow-md font-sans"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>{editingSupplier ? 'Update Supplier' : 'Save Supplier'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          VIEW 1B: SUPPLIERS DIRECTORY LIST (WHEN NOT ADDING)
          ========================================================================= */}
      {activeView === 'suppliers' && activeSidebarItemId !== 'sup_add' && (
        <>
          {/* Header Panel */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white border border-slate-200 p-6 rounded-xl shadow-xs">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Suppliers & Vendor Directory</h1>
              <p className="text-xs text-slate-500 mt-1">
                Register trade supply partners, manage 15-digit FTA TRN tax credentials, and review business purchase volumes.
              </p>
            </div>
            <button
              id="btn-add-supplier-open"
              onClick={() => {
                if (setActiveSidebarItemId) {
                  setActiveSidebarItemId('sup_add');
                } else {
                  setNewSupName('');
                  setNewSupTrn('');
                  setNewSupPhone('');
                  setNewSupEmail('');
                  setNewSupAddress('');
                  setNewSupEmirate('Dubai');
                  setNewSupTradeLicense('');
                  setNewSupDateAdded(new Date().toISOString().split('T')[0]);
                  setTrnValidationError('');
                  setIsSupplierModalOpen(true);
                }
              }}
              className="mt-4 md:mt-0 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Trade Supplier</span>
            </button>
          </div>

          {/* Supplier KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Orange Card - Outstanding Trade Bills */}
            <div className="bg-amber-50/75 border border-amber-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700">Trade Payables</span>
                  <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Unpaid</span>
                </div>
                <h3 className="text-2xl font-black text-amber-900 font-sans">{formatAED(totalUnpaidPurchasesVolume)}</h3>
                <p className="text-[10px] text-amber-600 font-medium mt-1">Outstanding liabilities we owe suppliers</p>
              </div>
              <div className="mt-4">
                <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${totalPurchasesVolume > 0 ? (totalUnpaidPurchasesVolume / totalPurchasesVolume) * 100 : 0}%` }} 
                    className="bg-amber-500 h-full transition-all duration-500" 
                  />
                </div>
                <div className="flex justify-between items-center mt-1.5 text-[9px] text-slate-400 font-medium">
                  <span>Payable Ratio</span>
                  <span>{totalPurchasesVolume > 0 ? ((totalUnpaidPurchasesVolume / totalPurchasesVolume) * 100).toFixed(1) : 0}% of Purchases</span>
                </div>
              </div>
            </div>

            {/* Green Card - Settled Purchase Bills */}
            <div className="bg-emerald-50/75 border border-emerald-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700">Settled Procurement</span>
                  <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Paid</span>
                </div>
                <h3 className="text-2xl font-black text-emerald-900 font-sans">{formatAED(totalPaidPurchasesVolume)}</h3>
                <p className="text-[10px] text-emerald-600 font-medium mt-1">Total cash settled with vendors</p>
              </div>
              <div className="mt-4">
                <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${totalPurchasesVolume > 0 ? (totalPaidPurchasesVolume / totalPurchasesVolume) * 100 : 0}%` }} 
                    className="bg-emerald-500 h-full transition-all duration-500" 
                  />
                </div>
                <div className="flex justify-between items-center mt-1.5 text-[9px] text-slate-400 font-medium">
                  <span>Settlement Rate</span>
                  <span>{totalPurchasesVolume > 0 ? ((totalPaidPurchasesVolume / totalPurchasesVolume) * 100).toFixed(1) : 0}% of Purchases</span>
                </div>
              </div>
            </div>

            {/* Slate Card - Vendor directory stats */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">Gross Trade Ledger</span>
                  <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">All Vendors</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 font-sans">{formatAED(totalPurchasesVolume)}</h3>
                <div className="flex gap-3 text-[10px] text-slate-500/90 mt-2 flex-wrap">
                  <span>Suppliers: <strong className="text-slate-800">{totalSuppliersCount}</strong></span>
                  <span>• TRN Reg: <strong className="text-emerald-600">{suppliersWithTrn}</strong></span>
                </div>
              </div>
              <div className="mt-4">
                <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden flex">
                  <div 
                    style={{ width: `${totalPurchasesVolume > 0 ? (totalPaidPurchasesVolume / totalPurchasesVolume) * 100 : 0}%` }} 
                    className="bg-emerald-500 h-full"
                  />
                  <div 
                    style={{ width: `${totalPurchasesVolume > 0 ? (totalUnpaidPurchasesVolume / totalPurchasesVolume) * 100 : 0}%` }} 
                    className="bg-amber-400 h-full"
                  />
                </div>
                <div className="flex justify-between items-center mt-1.5 text-[9px] text-slate-400 font-medium">
                  <span>Settled vs Payable</span>
                  <span>Trade Partners Analytics</span>
                </div>
              </div>
            </div>

          </div>

          {companySuppliers.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs py-16 text-center p-8 max-w-2xl mx-auto my-8 animate-fade-in">
              <div className="w-16 h-16 bg-blue-50 text-blue-650 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-xs">
                <Truck className="w-8 h-8 text-blue-650" />
              </div>
              <h3 className="text-base font-black text-[#0F172A] tracking-tight font-sans">
                Register Your Trade Suppliers
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-md mx-auto">
                Keep a central registry of all material supply partners, corporate service providers, and log verified 15-digit FTA TRN tax numbers to automate invoice compliance.
              </p>
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => {
                    if (setActiveSidebarItemId) {
                      setActiveSidebarItemId('sup_add');
                    } else {
                      setNewSupName('');
                      setNewSupTrn('');
                      setNewSupPhone('');
                      setNewSupEmail('');
                      setNewSupAddress('');
                      setNewSupEmirate('Dubai');
                      setNewSupTradeLicense('');
                      setNewSupDateAdded(new Date().toISOString().split('T')[0]);
                      setTrnValidationError('');
                      setIsSupplierModalOpen(true);
                    }
                  }}
                  className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer uppercase tracking-wider font-sans"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Your First Supplier</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-50/50">
                <div className="flex flex-wrap items-center gap-3 w-full">
                  {/* Search bar */}
                  <div className="relative min-w-[200px] flex-1 max-w-sm">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search supplier name, TRN, emirate..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:border-indigo-500 text-slate-700 font-medium"
                    />
                  </div>

                  {/* Filter Dropdown */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">View Options:</span>
                    <select
                      value={selectedSupplierViewFilter}
                      onChange={(e) => setSelectedSupplierViewFilter(e.target.value as any)}
                      className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 cursor-pointer shadow-xs"
                    >
                      <option value="all">All Trade Partners</option>
                      <option value="trn">UAE TRN Registered</option>
                      <option value="contact">With Contact</option>
                      <option value="city">With Emirate (City)</option>
                      <option value="bill">With Bills Logged</option>
                      <option value="gross">With Gross Purchases</option>
                      <option value="trade">Supplier Trade License</option>
                      <option value="added">Supplier Added Date</option>
                    </select>
                  </div>

                  {/* Column Chooser Button / ⚙️ Settings for Suppliers */}
                  <div className="relative inline-block text-left shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowSuppliersColChooser(!showSuppliersColChooser)}
                      className="bg-white hover:bg-slate-50 border border-slate-200 p-2 rounded-lg cursor-pointer transition-colors shadow-xs flex items-center"
                      title="Table settings & column chooser"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                    </button>

                    {showSuppliersColChooser && (
                      <>
                        <div className="fixed inset-0 z-45" onClick={() => setShowSuppliersColChooser(false)} />
                        <div className="absolute left-0 md:right-0 md:left-auto mt-2 w-56 rounded-xl bg-white border border-slate-150 shadow-xl z-50 p-4 animate-fade-in text-xs text-slate-700">
                          <p className="font-bold text-slate-900 mb-2.5 pb-1 border-b border-slate-100 uppercase tracking-wider text-[10px] font-mono">Supplier Columns</p>
                          <div className="space-y-2">
                            {[
                              { key: 'supplier', label: 'Supplier Legal Details' },
                              { key: 'trn', label: 'UAE TRN' },
                              { key: 'tradeLicense', label: 'Trade License No' },
                              { key: 'email', label: 'Email Contact' },
                              { key: 'phone', label: 'Phone Details' },
                              { key: 'emirate', label: 'Emirate Location' },
                              { key: 'dateAdded', label: 'Date Registered' }
                            ].map((col) => (
                              <label key={col.key} className="flex items-center space-x-2.5 cursor-pointer hover:bg-slate-50 p-1.5 rounded-md transition-colors select-none font-medium">
                                <input
                                  type="checkbox"
                                  checked={(colsSuppliers as any)[col.key]}
                                  onChange={(e) => {
                                    const updated = { ...colsSuppliers, [col.key]: e.target.checked };
                                    setColsSuppliers(updated);
                                    safeSetLocalStorage('hisaab_cols_suppliers', updated);
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

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-600">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                      {colsSuppliers.supplier && (
                        <th 
                          onClick={() => handleSupSort('name')} 
                          className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none text-left"
                        >
                          <span className="flex items-center space-x-1">
                            <span>Supplier Legal Details</span>
                            {supSortField === 'name' && (supSortDirection === 'asc' ? '▲' : '▼')}
                          </span>
                        </th>
                      )}
                      {colsSuppliers.trn && (
                        <th 
                          onClick={() => handleSupSort('trn')} 
                          className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none text-left"
                        >
                          <span className="flex items-center space-x-1">
                            <span>UAE TRN (Tax Number)</span>
                            {supSortField === 'trn' && (supSortDirection === 'asc' ? '▲' : '▼')}
                          </span>
                        </th>
                      )}
                      {colsSuppliers.tradeLicense && (
                        <th 
                          onClick={() => handleSupSort('tradeLicense')} 
                          className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none text-left"
                        >
                          <span className="flex items-center space-x-1">
                            <span>Trade License No</span>
                            {supSortField === 'tradeLicense' && (supSortDirection === 'asc' ? '▲' : '▼')}
                          </span>
                        </th>
                      )}
                      {(colsSuppliers.emirate || colsSuppliers.phone || colsSuppliers.email) && (
                        <th 
                          onClick={() => handleSupSort('emirate')} 
                          className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none text-left"
                        >
                          <span className="flex items-center space-x-1">
                            <span>Emirate & Contact</span>
                            {supSortField === 'emirate' && (supSortDirection === 'asc' ? '▲' : '▼')}
                          </span>
                        </th>
                      )}
                      {colsSuppliers.dateAdded && (
                        <th 
                          onClick={() => handleSupSort('dateAdded')} 
                          className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none text-left"
                        >
                          <span className="flex items-center space-x-1">
                            <span>Date Registered</span>
                            {supSortField === 'dateAdded' && (supSortDirection === 'asc' ? '▲' : '▼')}
                          </span>
                        </th>
                      )}
                      <th 
                        onClick={() => handleSupSort('bills')} 
                        className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none"
                      >
                        <span className="flex items-center justify-center space-x-1">
                          <span>Bills Logged</span>
                          {supSortField === 'bills' && (supSortDirection === 'asc' ? '▲' : '▼')}
                        </span>
                      </th>
                      <th 
                        onClick={() => handleSupSort('gross')} 
                        className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                      >
                        <span className="flex items-center justify-end space-x-1">
                          <span>Gross Total Purchased</span>
                          {supSortField === 'gross' && (supSortDirection === 'asc' ? '▲' : '▼')}
                        </span>
                      </th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSuppliers.length > 0 ? (
                      filteredSuppliers.map((sup) => {
                        // Calculate purchase stats for this supplier name
                        const supInvoices = compExpenses.filter(e => e.supplierName.trim().toLowerCase() === sup.name.trim().toLowerCase());
                        const totalPurchased = supInvoices.reduce((sum, e) => sum + e.total, 0);

                        return (
                          <tr key={sup.id} className="hover:bg-slate-50/40 transition-colors">
                            {colsSuppliers.supplier && (
                              <td className="py-3.5 px-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-blue-50 text-blue-600 font-extrabold rounded-lg flex items-center justify-center text-xs">
                                    {sup.name.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <p 
                                        onClick={() => setSelectedSupplierDetail(sup)}
                                        className="font-extrabold text-[#0F172A] hover:text-indigo-600 hover:underline cursor-pointer"
                                      >
                                        {sup.name}
                                      </p>
                                      {sup.supplierCode && (
                                        <span className="bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[9px] font-bold px-1.5 py-0.2 rounded uppercase">
                                          {sup.supplierCode}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium">{sup.address || 'No registered business address'}</p>
                                  </div>
                                </div>
                              </td>
                            )}
                            {colsSuppliers.trn && (
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                                {sup.trn ? (
                                  <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px]">
                                    {sup.trn}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">No TRN Registered</span>
                                )}
                              </td>
                            )}
                            {colsSuppliers.tradeLicense && (
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                                {sup.tradeLicense ? (
                                  <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md text-[10px]">
                                    {sup.tradeLicense}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">No License Registered</span>
                                )}
                              </td>
                            )}
                            {(colsSuppliers.emirate || colsSuppliers.phone || colsSuppliers.email) && (
                              <td className="py-3.5 px-4 text-slate-500">
                                {colsSuppliers.emirate && <p className="font-medium text-slate-700">{sup.emirate || 'N/A'}</p>}
                                <p className="text-[10px] text-slate-400 font-mono">
                                  {[
                                    colsSuppliers.phone && sup.phone,
                                    colsSuppliers.email && sup.email
                                  ].filter(Boolean).join(' | ') || 'No contact details'}
                                </p>
                              </td>
                            )}
                            {colsSuppliers.dateAdded && (
                              <td className="py-3.5 px-4 font-mono text-slate-500">
                                {sup.dateAdded ? sup.dateAdded : <span className="text-slate-400 italic">N/A</span>}
                              </td>
                            )}
                            <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                              {supInvoices.length} Bills
                            </td>
                            <td className="py-3.5 px-4 text-right font-black text-rose-600 font-mono">
                              {formatAED(totalPurchased)}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setSupplierName(sup.name);
                                    setSupplierTrn(sup.trn || '');
                                    setCategory('Purchases');
                                    if (setActiveSidebarItemId) {
                                      setActiveSidebarItemId('pur_add');
                                    } else {
                                      handleOpenAdd();
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded text-[10px] flex items-center space-x-1 cursor-pointer transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Purchase</span>
                                </button>
                                <button
                                  onClick={() => handleEditSupplier(sup)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                                  title="Edit Supplier"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setSelectedSupplierDetail(sup)}
                                  className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                                  title="View Supplier Profile & Statement"
                                >
                                  <BookOpen className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSupplier(sup.id, sup.name)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                  title="Delete Supplier"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                          No trade suppliers found matching "{searchTerm}"
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* =========================================================================
          VIEW 2A: RECORD NEW PURCHASE OR CREDIT NOTE (INLINE FORM)
          ========================================================================= */}
      {activeView === 'purchases' && (activeSidebarItemId === 'pur_add' || activeSidebarItemId === 'pur_credit_note') && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 w-full max-w-[1400px] mx-auto space-y-6">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-600" />
              <span>{category === 'Supplier Credit Note' || activeSidebarItemId === 'pur_credit_note' ? 'Add Supplier Credit Note / Purchase Return' : 'Add Purchase Entry'}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {category === 'Supplier Credit Note' || activeSidebarItemId === 'pur_credit_note'
                ? 'Record supplier credit notes, goods returns, or price adjustments to reduce taxable expense and input VAT.'
                : 'Record commercial supply purchases, material procurements, and manage 5% input VAT calculations.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Supplier Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Supplier Legal Name <span className="text-indigo-600">*</span>
                  </label>
                  {setActiveSidebarItemId && (
                    <button
                      type="button"
                      onClick={() => setActiveSidebarItemId('sup_add')}
                      className="text-indigo-600 hover:text-indigo-800 text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5 cursor-pointer hover:underline"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>Add New Supplier</span>
                    </button>
                  )}
                </div>
                <div className="flex gap-1.5 items-center">
                  {companySuppliers.length > 0 && (
                    <div className="flex items-center gap-1 shrink-0">
                      <select
                        value={companySuppliers.find(s => s.name === supplierName)?.id || 'CUSTOM'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'CUSTOM') {
                            setSupplierName('');
                            setSupplierTrn('');
                          } else {
                            const found = companySuppliers.find(s => s.id === val);
                            if (found) {
                              setSupplierName(found.name);
                              setSupplierTrn(found.trn || '');
                            }
                          }
                        }}
                        className="border border-slate-200 rounded-lg px-2 py-2 bg-white text-xs text-slate-700 focus:border-indigo-500 cursor-pointer max-w-[130px]"
                      >
                        <option value="CUSTOM">Custom...</option>
                        {companySuppliers.map(sup => (
                          <option key={sup.id} value={sup.id}>{sup.name}</option>
                        ))}
                      </select>
                      {companySuppliers.find(s => s.name === supplierName) && (
                        <button
                          type="button"
                          onClick={() => {
                            const found = companySuppliers.find(s => s.name === supplierName);
                            if (found) {
                              handleEditSupplier(found);
                            }
                          }}
                          className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer shrink-0"
                          title="Edit Selected Supplier"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                  <input
                    type="text"
                    required
                    placeholder="e.g., Jabal Ali Materials LLC"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 bg-white text-xs focus:border-indigo-500 text-slate-850"
                  />
                </div>
              </div>

              {company?.vatEnabled !== false && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Supplier UAE TRN (Tax Number)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="e.g., 100xxxxxxxxx003"
                    value={supplierTrn}
                    onChange={(e) => setSupplierTrn(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-xs font-mono focus:border-indigo-500 text-slate-850"
                  />
                  {(supplierTrn || '').trim().length !== 15 ? (
                    <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium">
                      <span>⚠️ Unregistered Supplier</span>
                    </div>
                  ) : (
                    <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Registered Supplier (TRN Valid)</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Invoice Meta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Purchase Invoice / Bill No <span className="text-indigo-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., PUR-10023-A"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-xs font-mono focus:border-indigo-500 text-slate-850"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Invoice Date <span className="text-indigo-600">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-xs font-mono focus:border-indigo-500 text-slate-850"
                />
              </div>
            </div>

            {/* MULTI-ITEM PROCUREMENT TABLE (BATCH 3 - 1) */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-indigo-500" />
                  <span>Procurement Items</span>
                </h3>
                <button
                  type="button"
                  onClick={addPurchaseItemRow}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Row</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase text-[9px] font-bold tracking-wider">
                      <th className="pb-2 pr-2">Item Description</th>
                      <th className="pb-2 px-2 w-16 text-center">Qty</th>
                      <th className="pb-2 px-2 w-28 text-right">Rate (AED)</th>
                      {company?.vatEnabled !== false && (
                        <th className="pb-2 px-2 w-20 text-center">Tax %</th>
                      )}
                      <th className="pb-2 pl-2 w-24 text-right">Amount</th>
                      <th className="pb-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchaseItems.map((item, idx) => (
                      <tr key={idx} className="group">
                        <td className="py-2 pr-2">
                          <div className="space-y-1">
                            <select
                              value={(inventory || []).find(inv => inv.name === item.name)?.id || 'CUSTOM'}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'CUSTOM') {
                                  updatePurchaseItemField(idx, 'name', '');
                                } else {
                                  const matched = (inventory || []).find(inv => inv.id === val);
                                  if (matched) {
                                    updatePurchaseItemField(idx, 'name', matched.name);
                                    updatePurchaseItemField(idx, 'rate', matched.purchasePrice);
                                  }
                                }
                              }}
                              className="w-full border border-slate-200 rounded-md px-2 py-1 bg-white text-[11px] focus:border-indigo-500 cursor-pointer text-slate-700 mb-1"
                            >
                              <option value="CUSTOM">Custom description...</option>
                              {(inventory || []).map(inv => (
                                <option key={inv.id} value={inv.id}>{inv.name} ({inv.sku || 'No SKU'})</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              required
                              placeholder="Enter manual description..."
                              value={item.name}
                              onChange={(e) => updatePurchaseItemField(idx, 'name', e.target.value)}
                              className="w-full border border-slate-200 rounded-md px-2 py-1 bg-white focus:border-indigo-500 text-slate-850"
                            />
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min={1}
                            required
                            value={item.qty}
                            onChange={(e) => updatePurchaseItemField(idx, 'qty', e.target.value)}
                            className="w-full border border-slate-200 rounded-md px-2 py-1 bg-white text-center font-mono focus:border-indigo-500 text-slate-850"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            step="any"
                            min={0}
                            required
                            value={item.rate || ''}
                            placeholder="0.00"
                            onChange={(e) => updatePurchaseItemField(idx, 'rate', e.target.value)}
                            className="w-full border border-slate-200 rounded-md px-2 py-1 bg-white text-right font-mono focus:border-indigo-500 text-slate-850"
                          />
                        </td>
                        {company?.vatEnabled !== false && (
                          <td className="py-2 px-2">
                            <select
                              value={item.taxPercent}
                              disabled={(supplierTrn || '').trim().length !== 15}
                              onChange={(e) => updatePurchaseItemField(idx, 'taxPercent', e.target.value)}
                              className={`w-full border border-slate-200 rounded-md px-2 py-1 text-center focus:border-indigo-500 cursor-pointer text-slate-800 font-mono ${
                                (supplierTrn || '').trim().length !== 15 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white'
                              }`}
                              title={(supplierTrn || '').trim().length !== 15 ? "Locked to 0% because supplier is unregistered" : "Choose tax percentage"}
                            >
                              <option value="5">5%</option>
                              <option value="0">0%</option>
                            </select>
                          </td>
                        )}
                        <td className="py-2 pl-2 text-right font-mono font-medium text-slate-700">
                          AED {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 pl-2 text-center">
                          <button
                            type="button"
                            onClick={() => removePurchaseItemRow(idx)}
                            className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TAX AND TOTAL BREAKDOWN CARD */}
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 flex flex-col space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal (Taxable Amount):</span>
                <span className="font-semibold text-slate-800">AED {amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {company?.vatEnabled !== false && (
                <div className="flex justify-between">
                  <span>Input UAE VAT (5%):</span>
                  <span className="font-semibold text-slate-800">AED {vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black">
                <span className="text-slate-900">Total Purchase Cost:</span>
                <span className="text-indigo-600">AED {(amount + vatAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Metadata Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Payment Status <span className="text-indigo-600">*</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('Paid')}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border transition-colors rounded-lg cursor-pointer ${
                      status === 'Paid'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Paid
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('Unpaid')}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border transition-colors rounded-lg cursor-pointer ${
                      status === 'Unpaid'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Unpaid
                  </button>
                </div>
              </div>

              {staffEnabled && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Prepared / Handled By
                  </label>
                  <select
                    value={preparedBy}
                    onChange={(e) => setPreparedBy(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-xs focus:border-indigo-500 cursor-pointer text-slate-850"
                  >
                    <option value="">Select Staff...</option>
                    {staff.map(s => (
                      <option key={s.id} value={`${s.name} (${s.designation})`}>
                        {s.name} ({s.designation})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Receipt / Invoice Attachment */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Supporting Document / Receipt Attachment
                </label>
                {attachment ? (
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 min-w-0">
                        <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                        <span className="font-extrabold text-slate-800 truncate">{attachment.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewAttachment(attachment)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase rounded-lg flex items-center space-x-1 cursor-pointer transition-colors shadow-xs"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Full Preview</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttachment(null)}
                          className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-bold uppercase rounded-lg cursor-pointer transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Direct Visual Preview Card */}
                    <div className="bg-white rounded-lg p-2 border border-indigo-100 flex items-center justify-center max-h-48 overflow-hidden">
                      {attachment.dataUrl.startsWith('data:image/') || attachment.name.match(/\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i) ? (
                        <img
                          src={attachment.dataUrl}
                          alt={attachment.name}
                          className="max-h-40 object-contain rounded cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setPreviewAttachment(attachment)}
                        />
                      ) : attachment.dataUrl.startsWith('data:application/pdf') || attachment.name.endsWith('.pdf') ? (
                        <div className="flex flex-col items-center justify-center py-3 text-center cursor-pointer" onClick={() => setPreviewAttachment(attachment)}>
                          <FileText className="w-8 h-8 text-rose-500 mb-1" />
                          <span className="text-xs font-bold text-slate-700">PDF Document Attached</span>
                          <span className="text-[10px] text-indigo-600 underline font-semibold mt-0.5">Click for full interactive preview</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-slate-600 font-medium py-1">
                          <Paperclip className="w-4 h-4 text-slate-400" />
                          <span>Attached: {attachment.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                      isDragOver
                        ? 'border-indigo-500 bg-indigo-50/50'
                        : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50'
                    }`}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*,application/pdf';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          handleFileChange(file);
                        }
                      };
                      input.click();
                    }}
                  >
                    <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-600 font-semibold">
                      Drag & Drop files here or <span className="text-indigo-600 hover:underline">Browse</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">Supports PDF or Image receipts</p>
                  </div>
                )}
              </div>
            </div>

            {/* Form actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 mt-6">
              <button
                type="button"
                onClick={() => {
                  if (setActiveSidebarItemId) setActiveSidebarItemId('pur_manage');
                }}
                className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="qb-btn-primary shadow-xs cursor-pointer"
              >
                Save Purchase
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          VIEW 2B & 3: PURCHASES DIRECTORY OR GENERAL EXPENSE LEDGER (LIST)
          ========================================================================= */}
      {activeView !== 'suppliers' && activeSidebarItemId !== 'pur_add' && activeSidebarItemId !== 'pur_credit_note' && (
        <>
          {/* Top Sub-Navigation Tabs */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex flex-wrap gap-1 text-xs font-bold w-fit">
            <button
              onClick={() => setActiveSidebarItemId && setActiveSidebarItemId('pur_manage')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeView === 'purchases' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 text-indigo-600" />
              <span>Purchase Bills</span>
            </button>

            <button
              onClick={() => setActiveSidebarItemId && setActiveSidebarItemId('pur_po')}
              className="px-3 py-1.5 rounded-lg flex items-center space-x-1.5 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Purchase Orders (PO)</span>
            </button>

            <button
              onClick={() => setActiveSidebarItemId && setActiveSidebarItemId('pur_grn')}
              className="px-3 py-1.5 rounded-lg flex items-center space-x-1.5 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
            >
              <Box className="w-3.5 h-3.5 text-emerald-600" />
              <span>Goods Received (GRN)</span>
            </button>

            <button
              onClick={() => setActiveSidebarItemId && setActiveSidebarItemId('expenses')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeView === 'expenses' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-amber-600" />
              <span>Corporate Expenses</span>
            </button>

            <button
              onClick={() => setActiveSidebarItemId && setActiveSidebarItemId('sup_list')}
              className="px-3 py-1.5 rounded-lg flex items-center space-x-1.5 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-blue-600" />
              <span>Suppliers Directory</span>
            </button>
          </div>

          {/* Header Panel */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white border border-slate-200 p-6 rounded-xl shadow-xs">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {activeView === 'purchases' ? 'Purchase Invoice Registry & Supplier Bills' : 'Corporate Expense Ledger'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {activeView === 'purchases' 
                  ? 'Track trade materials, commercial supply orders, inventory purchases, and recover input VAT.'
                  : 'Log raw supplier invoice bills, operational costs, utilities, rent, and recover input VAT on quarterly returns.'}
              </p>
            </div>
            <button
              id="btn-add-expense-open"
              onClick={() => {
                if (activeView === 'purchases' && setActiveSidebarItemId) {
                  setActiveSidebarItemId('pur_add');
                } else {
                  handleOpenAdd();
                }
              }}
              className="mt-4 md:mt-0 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{activeView === 'purchases' ? 'Add Purchase' : 'Log Expense Bill'}</span>
            </button>
          </div>

          {/* Compact Professional KPI Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Orange Card - Unpaid / Outstanding */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl px-4 py-3 shadow-2xs flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-amber-700">Awaiting Settlement</span>
                  <span className="text-[8.5px] font-mono font-bold bg-amber-100 text-amber-800 px-1 py-0.2 rounded">Pending</span>
                </div>
                <h3 className="text-lg font-black text-amber-900 font-sans">{formatAED(unpaidExpensesSum)}</h3>
              </div>
              <div className="text-right text-[10px] text-amber-700 font-mono font-semibold">
                <span>{unpaidExpensesCount} Bill(s)</span>
                <div className="text-[8.5px] text-amber-600/80 mt-0.5">
                  {totalExpenseAmount > 0 ? ((unpaidExpensesSum / totalExpenseAmount) * 100).toFixed(0) : 0}% Pending
                </div>
              </div>
            </div>

            {/* Green Card - Paid / Settled */}
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl px-4 py-3 shadow-2xs flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-emerald-700">Settled Payments</span>
                  <span className="text-[8.5px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded">Settled</span>
                </div>
                <h3 className="text-lg font-black text-emerald-900 font-sans">{formatAED(paidExpensesSum)}</h3>
              </div>
              <div className="text-right text-[10px] text-emerald-700 font-mono font-semibold">
                <span>{paidExpensesCount} Paid</span>
                <div className="text-[8.5px] text-emerald-600/80 mt-0.5">
                  {totalExpenseAmount > 0 ? ((paidExpensesSum / totalExpenseAmount) * 100).toFixed(0) : 0}% Cleared
                </div>
              </div>
            </div>

            {/* Slate Card - Gross Volume */}
            <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl px-4 py-3 shadow-2xs flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-slate-500">Gross Outflow Volume</span>
                  <span className="text-[8.5px] font-mono font-bold bg-slate-200 text-slate-700 px-1 py-0.2 rounded">Total</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 font-sans">{formatAED(totalExpenseAmount)}</h3>
              </div>
              <div className="text-right text-[10px] text-slate-600 font-mono font-semibold">
                <span>{statsExpenses.length} Records</span>
                <div className="text-[8.5px] text-slate-400 mt-0.5">All Purchases & Bills</div>
              </div>
            </div>
          </div>

          {/* Filter and Table Panel */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col gap-3 bg-slate-50/50">
              {/* Row 1: Search & Date Range & Amount Range */}
              <div className="flex flex-col md:flex-row flex-wrap gap-3 items-stretch md:items-center justify-between">
                
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search supplier, description, invoice no..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:border-indigo-500 text-slate-700 focus:outline-hidden"
                  />
                </div>

                {/* Date range inputs */}
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400">Date:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border border-[#E2E8F0] rounded-lg px-2 py-1 bg-white text-xs text-slate-700 font-mono focus:outline-hidden"
                    title="Start Date"
                  />
                  <span className="text-slate-400 text-xs">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border border-[#E2E8F0] rounded-lg px-2 py-1 bg-white text-xs text-slate-700 font-mono focus:outline-hidden"
                    title="End Date"
                  />
                  {(startDate || endDate) && (
                    <button
                      onClick={() => { setStartDate(''); setEndDate(''); }}
                      className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded transition-colors"
                      title="Clear Dates"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Amount range inputs */}
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400">Amount (AED):</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="border border-[#E2E8F0] rounded-lg px-2 py-1 bg-white text-xs text-slate-700 font-mono focus:outline-hidden w-20"
                    title="Min Amount"
                  />
                  <span className="text-slate-400 text-xs">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="border border-[#E2E8F0] rounded-lg px-2 py-1 bg-white text-xs text-slate-700 font-mono focus:outline-hidden w-20"
                    title="Max Amount"
                  />
                  {(minAmount || maxAmount) && (
                    <button
                      onClick={() => { setMinAmount(''); setMaxAmount(''); }}
                      className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded transition-colors"
                      title="Clear Amounts"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

              </div>

              {/* Row 2: Status & Category Filter & Results Count */}
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between border-t border-slate-100 pt-3">
                
                <div className="text-xs font-semibold text-slate-600 font-mono bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full flex items-center space-x-1 select-none w-fit">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                  <span>Showing <strong>{filteredExpenses.length}</strong> of <strong>{statsExpenses.length}</strong> records</span>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  {/* Category Filter is locked to 'Purchases' for Purchase Registry */}
                  {activeView !== 'purchases' && (
                    <select
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      className="bg-white border border-slate-200 text-slate-600 text-xs px-3 py-2 rounded-lg cursor-pointer focus:border-indigo-500"
                    >
                      <option value="all">All Categories</option>
                      <option value="Rent">Rent</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Salaries">Salaries</option>
                      <option value="Purchases">Purchases</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Logistics">Logistics</option>
                      <option value="Other">Other</option>
                    </select>
                  )}

                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    className="bg-white border border-slate-200 text-slate-600 text-xs px-3 py-2 rounded-lg cursor-pointer focus:border-indigo-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>

                {/* Column Chooser Button / ⚙️ Settings for Purchases/Expenses */}
                <div className="relative inline-block text-left shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowPurchasesColChooser(!showPurchasesColChooser)}
                    className="bg-white hover:bg-slate-50 border border-slate-200 p-2 rounded-lg cursor-pointer transition-colors shadow-xs flex items-center"
                    title="Table settings & column chooser"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                  </button>

                  {showPurchasesColChooser && (
                    <>
                      <div className="fixed inset-0 z-45" onClick={() => setShowPurchasesColChooser(false)} />
                      <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-150 shadow-xl z-50 p-4 animate-fade-in text-xs text-slate-700">
                        <p className="font-bold text-slate-900 mb-2.5 pb-1 border-b border-slate-100 uppercase tracking-wider text-[10px] font-mono">
                          {activeView === 'purchases' ? 'Purchase Columns' : 'Expense Columns'}
                        </p>
                        <div className="space-y-2">
                          {[
                            { key: 'supplier', label: 'Supplier / TRN' },
                            { key: 'invoiceNo', label: 'Invoice Number' },
                            { key: 'date', label: 'Date' },
                            { key: 'category', label: 'Category' },
                            { key: 'amount', label: 'Financial Amounts' },
                            { key: 'paymentStatus', label: 'Status' }
                          ].map((col) => (
                            <label key={col.key} className="flex items-center space-x-2.5 cursor-pointer hover:bg-slate-50 p-1.5 rounded-md transition-colors select-none font-medium">
                              <input
                                type="checkbox"
                                checked={(colsPurchases as any)[col.key]}
                                onChange={(e) => {
                                  const updated = { ...colsPurchases, [col.key]: e.target.checked };
                                  setColsPurchases(updated);
                                  safeSetLocalStorage('hisaab_cols_purchases', updated);
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

            {filteredExpenses.length === 0 ? (
              <div className="py-16 text-center p-8 max-w-2xl mx-auto my-8 animate-fade-in">
                <div className="w-16 h-16 bg-slate-50 text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-xs">
                  <Receipt className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-base font-black text-[#0F172A] tracking-tight font-sans">
                  No {activeView === 'purchases' ? 'Purchase Invoices' : 'Expense Bills'} Found
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-md mx-auto">
                  {activeView === 'purchases'
                    ? 'Log commercial purchase invoices, material procurement costs, and regional GCC trade bills to track recoverable 5% input VAT.'
                    : 'Track business expenses, utility bills, office rentals, travel outlays, and configure corporate ledger accounting categories.'}
                </p>
                <div className="mt-6 flex justify-center">
                  <button
                    id="btn-empty-state-add-expense"
                    onClick={() => {
                      if (activeView === 'purchases' && setActiveSidebarItemId) {
                        setActiveSidebarItemId('pur_add');
                      } else {
                        handleOpenAdd();
                      }
                    }}
                    className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer uppercase tracking-wider font-sans"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{activeView === 'purchases' ? 'Add Purchase' : 'Log First Expense'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-600">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                      {colsPurchases.supplier && <th onClick={() => handleSort('supplier')} className="py-3 px-4 cursor-pointer hover:bg-slate-100 select-none">Supplier / TRN {sortField === 'supplier' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}</th>}
                      {colsPurchases.invoiceNo && <th className="py-3 px-4">Invoice No</th>}
                      {colsPurchases.date && <th onClick={() => handleSort('date')} className="py-3 px-4 cursor-pointer hover:bg-slate-100 select-none">Date {sortField === 'date' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}</th>}
                      {colsPurchases.category && <th onClick={() => handleSort('category')} className="py-3 px-4 cursor-pointer hover:bg-slate-100 select-none">Category {sortField === 'category' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}</th>}
                      {colsPurchases.amount && (
                        company?.vatEnabled !== false ? (
                          <>
                            <th className="py-3 px-4 text-right">Taxable ({company?.currencySymbol || company?.currency || 'AED'})</th>
                            <th className="py-3 px-4 text-right">VAT (5%)</th>
                            <th onClick={() => handleSort('total')} className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 select-none">Gross ({company?.currencySymbol || company?.currency || 'AED'}) {sortField === 'total' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}</th>
                          </>
                        ) : (
                          <th onClick={() => handleSort('total')} className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 select-none">Amount ({company?.currencySymbol || company?.currency || 'AED'}) {sortField === 'total' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}</th>
                        )
                      )}
                      {colsPurchases.paymentStatus && <th onClick={() => handleSort('status')} className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100 select-none">Status {sortField === 'status' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}</th>}
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpenses.map((exp, idx) => {
                      const isSelected = selectedIdx === idx;
                      return (
                        <tr 
                          key={exp.id} 
                          id={`exp-row-${exp.id}`}
                          tabIndex={0}
                          onFocus={() => setSelectedIdx(idx)}
                          className={`transition-colors cursor-pointer outline-hidden focus:outline-hidden ${
                            isSelected 
                              ? 'bg-indigo-50/80 border-l-4 border-l-indigo-600 font-semibold text-slate-900' 
                              : 'hover:bg-slate-50/40 text-slate-600'
                          }`}
                        >
                          {colsPurchases.supplier && (
                            <td className="py-3.5 px-4 font-sans">
                              <p 
                                onClick={() => {
                                  const matchedSup = companySuppliers.find(s => s.name.trim().toLowerCase() === exp.supplierName.trim().toLowerCase());
                                  setSelectedSupplierDetail(matchedSup || { name: exp.supplierName, trn: exp.supplierTrn });
                                }}
                                className="font-bold text-[#0F172A] hover:text-indigo-600 hover:underline cursor-pointer"
                              >
                                {exp.supplierName}
                              </p>
                              {exp.supplierTrn && (
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">TRN: {exp.supplierTrn}</p>
                              )}
                            </td>
                          )}
                          {colsPurchases.invoiceNo && <td className="py-3.5 px-4 font-mono text-slate-700">{exp.invoiceNumber}</td>}
                          {colsPurchases.date && <td className="py-3.5 px-4 text-slate-500 font-mono">{exp.date}</td>}
                          {colsPurchases.category && (
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                exp.category === 'Supplier Credit Note'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200 font-extrabold'
                                  : exp.category === 'Debit Note'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200 font-extrabold'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {exp.category}
                              </span>
                            </td>
                          )}
                          {colsPurchases.amount && (
                            company?.vatEnabled !== false ? (
                              <>
                                <td className="py-3.5 px-4 text-right font-mono font-medium">{exp.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="py-3.5 px-4 text-right font-mono font-semibold text-indigo-600">+{exp.vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">{exp.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              </>
                            ) : (
                              <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">{exp.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            )
                          )}
                          {colsPurchases.paymentStatus && (
                            <td className="py-3.5 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase ${
                                exp.status === 'Paid' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {exp.status === 'Paid' ? 'Paid' : 'Unpaid'}
                              </span>
                            </td>
                          )}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center space-x-2">
                              {exp.attachment && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewAttachment(exp.attachment!);
                                  }}
                                  className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-all cursor-pointer"
                                  title="View Uploaded Receipt"
                                >
                                  <Paperclip className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenEdit(exp)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all cursor-pointer"
                                title="Edit Record"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadExpensePDF(exp);
                                }}
                                disabled={downloadingExpenseId === exp.id}
                                className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all cursor-pointer disabled:opacity-50"
                                title={downloadingExpenseId === exp.id ? "Downloading..." : "Download PDF"}
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleCloneExpense(exp)}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-all cursor-pointer"
                                title="Clone/Duplicate Bill"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  // Directly trigger onDeleteExpense to show the high-fidelity app-wide confirm modal
                                  onDeleteExpense(exp.id);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* =========================================================================
          MODAL: ADD/EDIT PURCHASE OR EXPENSE BILL
          ========================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in no-print">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-950 font-mono">
                  {editingExpense 
                    ? 'Edit Commercial Bill Record' 
                    : activeView === 'purchases' 
                      ? 'Record New Purchase / Supply Bill' 
                      : 'Log Operational Expense Bill'}
                </h3>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              
              {/* Quick Barcode Scanner Trigger for Catalog Procurement */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <h4 className="text-[11px] font-bold text-slate-800">Scan Procurement Barcodes</h4>
                  <p className="text-[10px] text-slate-400">
                    {scannedItemsList.length > 0 
                      ? `Scanned: ${scannedItemsList.reduce((sum, itemRow) => sum + itemRow.qty, 0)} item(s) (${formatAED(scannedItemsList.reduce((sum, itemRow) => sum + (itemRow.qty * itemRow.item.purchasePrice), 0))})` 
                      : 'Scan catalog items to auto-calculate your bill total and description'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {scannedItemsList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setScannedItemsList([]);
                        setAmount(0);
                        setVatAmount(0);
                        setDescription('');
                      }}
                      className="px-2.5 py-1.5 text-[10px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsBarcodeScannerOpen(true)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg shadow-sm flex items-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Scan Barcode</span>
                  </button>
                </div>
              </div>
              
              <div className={company?.vatEnabled !== false ? "grid grid-cols-2 gap-4" : "block"}>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Supplier Legal Name <span className="text-indigo-600">*</span>
                  </label>
                  <div className="flex gap-1.5 items-center">
                    {companySuppliers.length > 0 && (
                      <div className="flex items-center gap-1 shrink-0">
                        <select
                          value={companySuppliers.find(s => s.name === supplierName)?.id || 'CUSTOM'}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'CUSTOM') {
                              setSupplierName('');
                              setSupplierTrn('');
                            } else {
                              const found = companySuppliers.find(s => s.id === val);
                              if (found) {
                                setSupplierName(found.name);
                                setSupplierTrn(found.trn || '');
                              }
                            }
                          }}
                          className="border border-slate-200 rounded-lg px-2 py-2 bg-white text-xs text-slate-700 focus:border-indigo-500 cursor-pointer max-w-[130px]"
                        >
                          <option value="CUSTOM">Custom...</option>
                          {companySuppliers.map(sup => (
                            <option key={sup.id} value={sup.id}>{sup.name}</option>
                          ))}
                        </select>
                        {companySuppliers.find(s => s.name === supplierName) && (
                          <button
                            type="button"
                            onClick={() => {
                              const found = companySuppliers.find(s => s.name === supplierName);
                              if (found) {
                                handleEditSupplier(found);
                              }
                            }}
                            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer shrink-0"
                            title="Edit Selected Supplier"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                    <input
                      type="text"
                      required
                      placeholder="e.g., DEWA, Amazon Web Services"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-2 bg-white text-xs focus:border-indigo-500"
                    />
                  </div>
                </div>
                 {company?.vatEnabled !== false && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Supplier UAE TRN (Tax Number)
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      placeholder="e.g., 100xxxxxxxxx003"
                      value={supplierTrn}
                      onChange={(e) => setSupplierTrn(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-xs font-mono focus:border-indigo-500"
                    />
                    {(supplierTrn || '').trim().length !== 15 ? (
                      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium">
                        <span>⚠️ Unregistered Supplier</span>
                      </div>
                    ) : (
                      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Registered Supplier (TRN Valid)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Bill Reference / Invoice No <span className="text-indigo-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., INV-44921-A"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-xs font-mono focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    {company?.vatEnabled !== false ? "Tax Invoice Date" : "Invoice Date"} <span className="text-indigo-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-xs font-mono focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                    <span>Expense Ledger Category <span className="text-indigo-600">*</span></span>
                    {showSuggestionTip && (
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold normal-case animate-pulse">
                        ✨ Heuristic Suggestion Applied!
                      </span>
                    )}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-xs focus:border-indigo-500 cursor-pointer"
                    disabled={activeView === 'purchases'} // Fixed to 'Purchases' for purchases screen
                  >
                    <option value="Rent">Rent</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Salaries">Salaries</option>
                    <option value="Purchases">Purchases</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Supplier Credit Note">Supplier Credit Note / Purchase Return</option>
                    <option value="Debit Note">Debit Note / Adjustment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Payment Status <span className="text-indigo-600">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus('Paid')}
                      className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border transition-colors ${
                        status === 'Paid' 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                          : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      Paid
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('Unpaid')}
                      className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border transition-colors ${
                        status === 'Unpaid' 
                          ? 'bg-amber-50 border-amber-500 text-amber-700' 
                          : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      Unpaid
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Item Description / Notes
                </label>
                <textarea
                  placeholder="Provide precise details of the expense items purchased..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-xs focus:border-indigo-500 h-16 resize-none"
                />
              </div>

              {staffEnabled && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Prepared By (Staff)
                  </label>
                  <select
                    value={preparedBy}
                    onChange={(e) => setPreparedBy(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-xs focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">-- Select Staff Member --</option>
                    {staff.map(member => (
                      <option key={member.id} value={`${member.name} (${member.designation})`}>
                        {member.name} - {member.designation}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Pricing breakdown block */}
              {category === 'Purchases' ? (
                <>
                  {/* MULTI-ITEM PROCUREMENT TABLE (BATCH 3 - 1) */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <ShoppingCart className="w-4 h-4 text-indigo-500" />
                        <span>Procurement Items</span>
                      </h4>
                      <button
                        type="button"
                        onClick={addPurchaseItemRow}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Row</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 uppercase text-[9px] font-bold tracking-wider">
                            <th className="pb-2 pr-2">Item Description</th>
                            <th className="pb-2 px-2 w-16 text-center">Qty</th>
                            <th className="pb-2 px-2 w-28 text-right">Rate</th>
                            {company?.vatEnabled !== false && (
                              <th className="pb-2 px-2 w-20 text-center">Tax %</th>
                            )}
                            <th className="pb-2 pl-2 w-24 text-right">Amount</th>
                            <th className="pb-2 w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {purchaseItems.map((item, idx) => (
                            <tr key={idx} className="group">
                              <td className="py-2 pr-2">
                                <div className="space-y-1">
                                  <select
                                    value={(inventory || []).find(inv => inv.name === item.name)?.id || 'CUSTOM'}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === 'CUSTOM') {
                                        updatePurchaseItemField(idx, 'name', '');
                                      } else {
                                        const matched = (inventory || []).find(inv => inv.id === val);
                                        if (matched) {
                                          updatePurchaseItemField(idx, 'name', matched.name);
                                          updatePurchaseItemField(idx, 'rate', matched.purchasePrice);
                                        }
                                      }
                                    }}
                                    className="w-full border border-slate-200 rounded-md px-2 py-1 bg-white text-[11px] focus:border-indigo-500 cursor-pointer text-slate-700 mb-1"
                                  >
                                    <option value="CUSTOM">Custom description...</option>
                                    {(inventory || []).map(inv => (
                                      <option key={inv.id} value={inv.id}>{inv.name} ({inv.sku || 'No SKU'})</option>
                                    ))}
                                  </select>
                                  <input
                                    type="text"
                                    required
                                    placeholder="Enter manual description..."
                                    value={item.name}
                                    onChange={(e) => updatePurchaseItemField(idx, 'name', e.target.value)}
                                    className="w-full border border-slate-200 rounded-md px-2 py-1 bg-white focus:border-indigo-500 text-slate-850"
                                  />
                                </div>
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  min={1}
                                  required
                                  value={item.qty}
                                  onChange={(e) => updatePurchaseItemField(idx, 'qty', e.target.value)}
                                  className="w-full border border-slate-200 rounded-md px-2 py-1 bg-white text-center font-mono focus:border-indigo-500 text-slate-850"
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  step="any"
                                  min={0}
                                  required
                                  value={item.rate || ''}
                                  placeholder="0.00"
                                  onChange={(e) => updatePurchaseItemField(idx, 'rate', e.target.value)}
                                  className="w-full border border-slate-200 rounded-md px-2 py-1 bg-white text-right font-mono focus:border-indigo-500 text-slate-850"
                                />
                              </td>
                              {company?.vatEnabled !== false && (
                                <td className="py-2 px-2">
                                  <select
                                    value={item.taxPercent}
                                    disabled={(supplierTrn || '').trim().length !== 15}
                                    onChange={(e) => updatePurchaseItemField(idx, 'taxPercent', e.target.value)}
                                    className={`w-full border border-slate-200 rounded-md px-2 py-1 text-center focus:border-indigo-500 cursor-pointer text-slate-800 font-mono ${
                                      (supplierTrn || '').trim().length !== 15 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white'
                                    }`}
                                    title={(supplierTrn || '').trim().length !== 15 ? "Locked to 0% because supplier is unregistered" : "Choose tax percentage"}
                                  >
                                    <option value="5">5%</option>
                                    <option value="0">0%</option>
                                  </select>
                                </td>
                              )}
                              <td className="py-2 pl-2 text-right font-mono font-medium text-slate-700">
                                AED {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 pl-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => removePurchaseItemRow(idx)}
                                  className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Delete Row"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* TAX AND TOTAL BREAKDOWN CARD */}
                  <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 flex flex-col space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Subtotal (Taxable Amount):</span>
                      <span className="font-semibold text-slate-800">AED {amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    {company?.vatEnabled !== false && (
                      <div className="flex justify-between">
                        <span>Input UAE VAT (5%):</span>
                        <span className="font-semibold text-slate-800">AED {vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black">
                      <span className="text-slate-900">Total Purchase Cost:</span>
                      <span className="text-indigo-600">AED {(amount + vatAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg space-y-3">
                  {company?.vatEnabled !== false && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-1">
                        <span className="text-xs font-bold text-slate-700">Auto-calculate UAE 5% VAT</span>
                        <span title="Automatically calculate VAT at UAE flat rate of 5%"><HelpCircle className="w-3.5 h-3.5 text-slate-400" /></span>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoCalcVat}
                        onChange={(e) => handleToggleAutoVat(e.target.checked)}
                        className="w-4.5 h-4.5 cursor-pointer accent-indigo-600"
                      />
                    </div>
                  )}

                  <div className={company?.vatEnabled !== false ? "grid grid-cols-2 gap-4 pt-1" : "block pt-1"}>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        {company?.vatEnabled !== false ? "Taxable Net Amount" : "Total Expense Amount"} ({company?.currencySymbol || company?.currency || 'AED'}) <span className="text-indigo-600">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        step="any"
                        placeholder="0.00"
                        value={amount || ''}
                        onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-xs font-mono focus:border-indigo-500"
                      />
                    </div>
                    {company?.vatEnabled !== false && (
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          VAT Amount ({company?.currencySymbol || company?.currency || 'AED'}) {autoCalcVat && <span className="text-indigo-400 font-normal">(5%)</span>}
                        </label>
                        <input
                          type="number"
                          required
                          min={0}
                          step="any"
                          placeholder="0.00"
                          disabled={autoCalcVat}
                          value={vatAmount || ''}
                          onChange={(e) => setVatAmount(parseFloat(e.target.value) || 0)}
                          className={`w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-indigo-500 ${
                            autoCalcVat ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-700'
                          }`}
                        />
                      </div>
                    )}
                    {company?.vatEnabled !== false && (
                      <div className="col-span-2 pt-2 border-t border-dashed border-slate-100">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-semibold">
                          VAT Recoverability Status
                        </label>
                        <select
                          value={vatRecoverability}
                          onChange={(e) => setVatRecoverability(e.target.value as any)}
                          className="w-full border border-slate-250 rounded-lg px-3 py-2 bg-white text-xs text-slate-700 focus:border-indigo-500 focus:outline-hidden cursor-pointer"
                        >
                          <option value="Fully Recoverable">Fully Recoverable - Settle to VAT Input Asset Account</option>
                          <option value="Non-Recoverable">Non-Recoverable - Capitalize / Add to Expense Account</option>
                          <option value="Partially Recoverable">Partially Recoverable - Split 50% Asset / 50% Expense</option>
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1.5 italic leading-relaxed">
                          {vatRecoverability === 'Non-Recoverable' && "💡 Note: Under UAE FTA laws, the 5% Input VAT will be capitalized as direct operational cost rather than offset against Output VAT liabilities."}
                          {vatRecoverability === 'Partially Recoverable' && "💡 Note: Automatically distributes tax offset allocations in a 50/50 ratio to satisfy business-proportionate VAT audits."}
                          {vatRecoverability === 'Fully Recoverable' && "💡 Standard: Standard deductible business input tax. Full offset allowed in Box 4 of UAE VAT Return form."}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-xs">
                    <span className="font-extrabold text-slate-800 uppercase tracking-wide">
                      {company?.vatEnabled !== false ? "Total Gross Cost:" : "Total Outflow Cost:"}
                    </span>
                    <span className="font-mono font-black text-slate-900 text-sm">
                      {formatAED(amount + vatAmount)}
                    </span>
                  </div>
                </div>
              )}

              {/* Receipt / Invoice Attachment */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Supporting Document / Receipt Attachment
                </label>
                {attachment ? (
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 min-w-0">
                        <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                        <span className="font-extrabold text-slate-800 truncate">{attachment.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewAttachment(attachment)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase rounded-lg flex items-center space-x-1 cursor-pointer transition-colors shadow-xs"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Full Preview</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttachment(null)}
                          className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-bold uppercase rounded-lg cursor-pointer transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Direct Visual Preview Card */}
                    <div className="bg-white rounded-lg p-2 border border-indigo-100 flex items-center justify-center max-h-48 overflow-hidden">
                      {attachment.dataUrl.startsWith('data:image/') || attachment.name.match(/\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i) ? (
                        <img
                          src={attachment.dataUrl}
                          alt={attachment.name}
                          className="max-h-40 object-contain rounded cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setPreviewAttachment(attachment)}
                        />
                      ) : attachment.dataUrl.startsWith('data:application/pdf') || attachment.name.endsWith('.pdf') ? (
                        <div className="flex flex-col items-center justify-center py-3 text-center cursor-pointer" onClick={() => setPreviewAttachment(attachment)}>
                          <FileText className="w-8 h-8 text-rose-500 mb-1" />
                          <span className="text-xs font-bold text-slate-700">PDF Document Attached</span>
                          <span className="text-[10px] text-indigo-600 underline font-semibold mt-0.5">Click for full interactive preview</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-slate-600 font-medium py-1">
                          <Paperclip className="w-4 h-4 text-slate-400" />
                          <span>Attached: {attachment.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                      isDragOver
                        ? 'border-indigo-500 bg-indigo-50/50'
                        : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50'
                    }`}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*,application/pdf';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          handleFileChange(file);
                        }
                      };
                      input.click();
                    }}
                  >
                    <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-600 font-semibold">
                      Drag & Drop files here or <span className="text-indigo-600 hover:underline">Browse</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">Supports PDF or Image receipts</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg cursor-pointer transition-all"
                >
                  {editingExpense ? 'Save Updates' : 'Confirm & Post Log'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD NEW SUPPLIER PROFILE
          ========================================================================= */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto no-print">
          <div className="bg-[#F8FAFC] dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-[#E2E8F0] dark:border-slate-800 animate-zoom-in my-auto">
            
            {/* Modal Header */}
            <div className="bg-[#0F172A] text-white p-4 flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-[#4F46E5]" />
                <h3 className="text-xs font-bold uppercase tracking-widest font-sans text-[#4F46E5]">
                  {editingSupplier ? 'Modify Trade Supplier' : 'Register Trade Supplier'}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsSupplierModalOpen(false);
                  setEditingSupplier(null);
                  if (activeSidebarItemId === 'sup_add' && setActiveSidebarItemId) {
                    setActiveSidebarItemId('sup_list');
                  }
                }}
                className="text-slate-400 hover:text-white cursor-pointer transition-colors p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSupplierSubmit} className="p-4 sm:p-6 space-y-6 text-xs flex-1 overflow-y-auto">
              
              {/* TOP HEADER: UNIQUE CODE */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 rounded-xl border border-slate-800 shadow-md flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center font-mono font-bold text-indigo-300 text-sm shrink-0">
                    #
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-300 font-bold">
                        Unique Supplier Code
                      </span>
                      <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Unique Active
                      </span>
                    </div>
                    <div className="text-base font-black font-mono tracking-wider text-white mt-0.5">
                      {newSupCode || generateNextSupplierCode()}
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
                      type="text"
                      placeholder="e.g., Ahmed Al-Mansoori"
                      value={newSupContactPerson}
                      onChange={(e) => setNewSupContactPerson(e.target.value)}
                      className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-xs font-sans text-slate-800 focus:border-[#4F46E5] focus:outline-hidden transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Supplier Code</label>
                    <input
                      type="text"
                      placeholder="Auto-generated"
                      value={newSupCode}
                      onChange={(e) => setNewSupCode(e.target.value)}
                      className="w-full border border-[#E2E8F0] bg-slate-50 rounded-lg px-3 py-2 text-xs font-mono font-bold text-indigo-700 focus:border-[#4F46E5] focus:outline-hidden transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Company & Tax Registrations */}
              <div>
                <h4 className="font-sans font-bold text-[#0F172A] text-sm italic border-b border-[#E2E8F0] pb-1.5 mb-3">
                  Company & Tax Registrations
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Supplier Legal Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Jabal Ali Construction Materials FZ-LLC"
                      value={newSupName}
                      onChange={(e) => setNewSupName(e.target.value)}
                      className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-xs font-sans text-slate-800 focus:border-[#4F46E5] focus:outline-hidden transition-colors"
                    />
                  </div>

                  {/* VAT Status Cards */}
                  {isVatEnabled && (
                    <div className="md:col-span-2 space-y-3">
                      <div className="flex justify-between items-baseline">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          VAT Status Selection
                        </label>
                        <span className="text-[10px] font-mono font-bold text-slate-400">FTA GCC Classification</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Has VAT */}
                        <div
                          onClick={() => {
                            setNewSupVatStatus('yes');
                            setNewSupTrn('');
                            setTrnValidationError('');
                          }}
                          className={`relative group cursor-pointer rounded-xl p-3.5 border transition-all duration-200 flex flex-col justify-between ${
                            newSupVatStatus === 'yes'
                              ? 'bg-gradient-to-br from-indigo-50/90 via-white to-indigo-50/50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                              : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/60 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                              newSupVatStatus === 'yes' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                            }`}>
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              newSupVatStatus === 'yes' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : 'bg-slate-100 text-slate-500'
                            }`}>
                              15-Digit TRN
                            </span>
                          </div>
                          <div>
                            <h5 className={`font-bold text-xs ${newSupVatStatus === 'yes' ? 'text-indigo-950' : 'text-slate-800'}`}>
                              Has VAT Number
                            </h5>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-sans leading-tight">
                              Registered business supplier with active UAE Tax Registration Number.
                            </p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                            <span className="font-mono text-slate-400 text-[9px]">Standard Tax Invoice</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              newSupVatStatus === 'yes' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                            }`}>
                              {newSupVatStatus === 'yes' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                          </div>
                        </div>

                        {/* No VAT */}
                        <div
                          onClick={() => {
                            setNewSupVatStatus('no');
                            setNewSupTrn('');
                            setTrnValidationError('');
                          }}
                          className={`relative group cursor-pointer rounded-xl p-3.5 border transition-all duration-200 flex flex-col justify-between ${
                            newSupVatStatus === 'no'
                              ? 'bg-gradient-to-br from-amber-50/90 via-white to-amber-50/50 border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                              : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-slate-50/60 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                              newSupVatStatus === 'no' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                            }`}>
                              <Info className="w-4 h-4" />
                            </div>
                            <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              newSupVatStatus === 'no' ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-slate-100 text-slate-500'
                            }`}>
                              Unregistered Vendor
                            </span>
                          </div>
                          <div>
                            <h5 className={`font-bold text-xs ${newSupVatStatus === 'no' ? 'text-amber-950' : 'text-slate-800'}`}>
                              No VAT (Unregistered)
                            </h5>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-sans leading-tight">
                              Non-registered trade vendor. Issued simple bill without input tax claim.
                            </p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                            <span className="font-mono text-slate-400 text-[9px]">Standard Purchase Bill</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              newSupVatStatus === 'no' ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300'
                            }`}>
                              {newSupVatStatus === 'no' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                          </div>
                        </div>

                        {/* VAT Pending [TEMP] */}
                        <div
                          onClick={() => {
                            setNewSupVatStatus('pending');
                            const nextId = 'TRN-PEND-' + Math.floor(1000 + Math.random() * 9000);
                            setNewSupTrn(nextId);
                            setTrnValidationError('');
                          }}
                          className={`relative group cursor-pointer rounded-xl p-3.5 border transition-all duration-200 flex flex-col justify-between ${
                            newSupVatStatus === 'pending'
                              ? 'bg-gradient-to-br from-rose-50/90 via-white to-rose-50/50 border-rose-500 ring-2 ring-rose-500/20 shadow-md'
                              : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-slate-50/60 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                              newSupVatStatus === 'pending' ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                            }`}>
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                            <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              newSupVatStatus === 'pending' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-slate-100 text-slate-500'
                            }`}>
                              FTA Suspense
                            </span>
                          </div>
                          <div>
                            <h5 className={`font-bold text-xs ${newSupVatStatus === 'pending' ? 'text-rose-950' : 'text-slate-800'}`}>
                              VAT Pending [TEMP]
                            </h5>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-sans leading-tight">
                              Provisional supplier profile created. Input VAT held in Suspense until TRN verified.
                            </p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                            <span className="font-mono text-rose-600 font-bold text-[9px]">Provisional Ledger</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              newSupVatStatus === 'pending' ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-300'
                            }`}>
                              {newSupVatStatus === 'pending' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                          </div>
                        </div>
                      </div>

                      {newSupVatStatus === 'yes' && (
                        <div className="space-y-1 animate-fade-in mt-3 p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                            UAE Tax Registration Number (TRN) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={15}
                            placeholder="e.g., 100234567800003"
                            value={newSupTrn}
                            onChange={(e) => {
                              setNewSupTrn(e.target.value.replace(/\D/g, ''));
                              setTrnValidationError('');
                            }}
                            className="w-full border border-indigo-200 rounded-lg px-3 py-2 bg-white font-mono text-xs focus:border-[#4F46E5] focus:outline-hidden transition-colors font-bold text-slate-900"
                          />
                          {trnValidationError && (
                            <p className="text-[10px] text-rose-600 font-semibold mt-1">{trnValidationError}</p>
                          )}
                        </div>
                      )}

                      {newSupVatStatus === 'pending' && (
                        <div className="space-y-2 p-3 bg-rose-50/60 border border-rose-200 rounded-xl animate-fade-in mt-3">
                          <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>VAT Registration No. Pending (Update within 5 days)</span>
                          </div>
                          <div className="text-[11px] text-slate-700 font-mono">
                            Auto-Assigned Temp ID: <span className="bg-white px-2 py-0.5 rounded border border-rose-300 font-bold text-rose-900">{newSupTrn || 'Generating...'}</span>
                          </div>
                          <p className="text-[10px] text-slate-600 leading-normal">
                            Provisional supplier profile created. Input VAT for purchase invoices will be held in Suspense until formal TRN is verified.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Supplier Trade License No. <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., TL-88912-DB"
                      value={newSupTradeLicense}
                      onChange={(e) => setNewSupTradeLicense(e.target.value)}
                      className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-xs font-sans text-slate-800 focus:border-[#4F46E5] focus:outline-hidden transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Contact Information */}
              <div>
                <h4 className="font-sans font-bold text-[#0F172A] text-sm italic border-b border-[#E2E8F0] pb-1.5 mb-3">
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g., sales@jabalali.ae"
                      value={newSupEmail}
                      onChange={(e) => setNewSupEmail(e.target.value)}
                      className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-xs font-sans text-slate-800 focus:border-[#4F46E5] focus:outline-hidden transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Phone Number <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., +971 4 881 1111"
                      value={newSupPhone}
                      onChange={(e) => setNewSupPhone(e.target.value)}
                      className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-xs font-sans text-slate-800 focus:border-[#4F46E5] focus:outline-hidden transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: Address, Location & Financial Preferences */}
              <div>
                <h4 className="font-sans font-bold text-[#0F172A] text-sm italic border-b border-[#E2E8F0] pb-1.5 mb-3">
                  Address, Location & Financial Preferences
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Warehouse / Office Address</label>
                    <textarea
                      rows={2}
                      placeholder="e.g., Warehouse 4, Jebel Ali Industrial Zone 1"
                      value={newSupAddress}
                      onChange={(e) => setNewSupAddress(e.target.value)}
                      className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-xs font-sans text-slate-800 focus:border-[#4F46E5] focus:outline-hidden transition-colors resize-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        {companyCountry === 'Pakistan' ? 'Supplier City' : (countryConfig?.regionTypeName ? `${countryConfig.regionTypeName} / City` : 'Business Emirate / City')} <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowSupplierAddCity(!showSupplierAddCity)}
                        className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-0.5 cursor-pointer uppercase tracking-wider"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>{showSupplierAddCity ? 'Close' : 'Add City'}</span>
                      </button>
                    </div>

                    {showSupplierAddCity && (
                      <div className="flex items-center space-x-1 mb-2">
                        <input
                          type="text"
                          placeholder="Enter new city name..."
                          value={manualSupplierCity}
                          onChange={(e) => setManualSupplierCity(e.target.value)}
                          className="flex-1 border border-indigo-200 rounded-lg px-2.5 py-1.5 bg-white text-xs text-slate-800 focus:outline-hidden focus:border-indigo-600 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = manualSupplierCity.trim();
                            if (trimmed) {
                              if (!customSupplierCities.includes(trimmed)) {
                                const updated = [...customSupplierCities, trimmed];
                                setCustomSupplierCities(updated);
                                try { localStorage.setItem('hisaab_custom_cities', JSON.stringify(updated)); } catch (e) {}
                              }
                              setNewSupEmirate(trimmed);
                              setManualSupplierCity('');
                              setShowSupplierAddCity(false);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    )}

                    <select
                      required
                      value={newSupEmirate}
                      onChange={(e) => {
                        if (e.target.value === '__add_new__') {
                          setShowSupplierAddCity(true);
                        } else {
                          setNewSupEmirate(e.target.value);
                        }
                      }}
                      className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-xs font-sans text-slate-800 focus:border-[#4F46E5] focus:outline-hidden transition-colors"
                    >
                      {supplierCountryCities.map((ct) => (
                        <option key={ct} value={ct}>{ct}</option>
                      ))}
                      <option value="__add_new__">+ Add Custom City...</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Date Registered / Added</label>
                    <input
                      type="date"
                      value={newSupDateAdded}
                      onChange={(e) => setNewSupDateAdded(e.target.value)}
                      className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-xs font-sans text-slate-800 focus:border-[#4F46E5] focus:outline-hidden transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-[#E2E8F0] dark:border-slate-800 shrink-0 sticky bottom-0 bg-[#F8FAFC] dark:bg-slate-900 z-10 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsSupplierModalOpen(false);
                    setEditingSupplier(null);
                    if (activeSidebarItemId === 'sup_add' && setActiveSidebarItemId) {
                      setActiveSidebarItemId('sup_list');
                    }
                  }}
                  className="px-5 py-2.5 border border-[#E2E8F0] dark:border-slate-700 rounded-lg hover:bg-[#E2E8F0]/30 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer text-xs uppercase tracking-wider transition-colors font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0F172A] hover:bg-[#4F46E5] text-white rounded-lg font-bold uppercase tracking-widest flex items-center space-x-1 transition-colors cursor-pointer shadow-md font-sans"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>{editingSupplier ? 'Update Supplier' : 'Save Supplier'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Barcode Scanner Modal for Expense/Purchases */}
      {isBarcodeScannerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-250 shadow-2xl max-w-lg w-full overflow-hidden animate-zoom-in text-slate-850">
            <div className="bg-indigo-900 text-white p-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-indigo-300 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest font-mono">Bilingual Procurement Scanner Hub</span>
              </div>
              <button 
                onClick={() => setIsBarcodeScannerOpen(false)} 
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              {/* Camera Viewfinder Overlay */}
              <div className="relative h-36 bg-slate-950 rounded-xl overflow-hidden flex flex-col items-center justify-center border-2 border-indigo-600/30">
                <div className="absolute inset-x-0 top-0 h-0.5 bg-rose-500 shadow-lg shadow-rose-500 animate-[bounce_2s_infinite]"></div>
                
                <div className="absolute top-4 left-8 w-6 h-6 border-t-4 border-l-4 border-indigo-500 rounded-tl"></div>
                <div className="absolute top-4 right-8 w-6 h-6 border-t-4 border-r-4 border-indigo-500 rounded-tr"></div>
                <div className="absolute bottom-4 left-8 w-6 h-6 border-b-4 border-l-4 border-indigo-500 rounded-bl"></div>
                <div className="absolute bottom-4 right-8 w-6 h-6 border-b-4 border-r-4 border-indigo-500 rounded-br"></div>
                
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900/85 px-3 py-1.5 rounded-md uppercase tracking-wider text-center z-10">
                  Align purchase stock barcode in frame
                </span>

                <div className="absolute bottom-2 right-2 text-[8px] font-mono text-emerald-400 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>LASER ONLINE</span>
                </div>
              </div>

              {/* Text Input / Laser Capture */}
              <div className="space-y-1 text-left">
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-500">Hardware Scanner Input</label>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleScanBarcodeInPurchase(barcodeScanInput);
                  }}
                  className="flex space-x-2"
                >
                  <input
                    type="text"
                    placeholder="Scan product barcode or SKU code..."
                    value={barcodeScanInput}
                    onChange={(e) => setBarcodeScanInput(e.target.value)}
                    autoFocus
                    className="flex-1 border border-slate-250 rounded-lg px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg cursor-pointer transition-colors"
                  >
                    Enter
                  </button>
                </form>
              </div>

              {/* Status Message */}
              {scanStatus.text && (
                <div className={`p-2.5 rounded-lg text-xs font-mono text-center border ${
                  scanStatus.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {scanStatus.text}
                </div>
              )}

              {/* Scanned Items Summary */}
              {scannedItemsList.length > 0 && (
                <div className="border border-indigo-100 rounded-xl p-3 bg-indigo-50/20 text-left space-y-2">
                  <div className="flex justify-between items-center border-b border-indigo-100/50 pb-1.5">
                    <span className="text-[10px] font-bold uppercase text-indigo-900 font-mono">Scanned Purchase Items</span>
                    <span className="text-[10px] font-extrabold text-indigo-750 font-mono">Running Total: {formatAED(scannedItemsList.reduce((sum, r) => sum + (r.qty * r.item.purchasePrice), 0))}</span>
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                    {scannedItemsList.map((row, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] bg-white p-2 rounded-lg border border-slate-150">
                        <div className="truncate pr-2">
                          <strong className="text-slate-800 block truncate">{row.item.name}</strong>
                          <span className="text-slate-450 font-mono">Price: {formatAED(row.item.purchasePrice)}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = scannedItemsList.map((r, i) => i === idx ? { ...r, qty: Math.max(1, r.qty - 1) } : r);
                              setScannedItemsList(updated);
                              updateExpenseFromScannedItems(updated);
                            }}
                            className="w-5 h-5 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold rounded flex items-center justify-center transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold w-5 text-center">{row.qty}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = scannedItemsList.map((r, i) => i === idx ? { ...r, qty: r.qty + 1 } : r);
                              setScannedItemsList(updated);
                              updateExpenseFromScannedItems(updated);
                            }}
                            className="w-5 h-5 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold rounded flex items-center justify-center transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Demo Scan Presets */}
              <div className="border-t border-slate-100 pt-3.5 text-left space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Simulate Scan (Demo Catalog Presets)</span>
                {inventory.filter(i => i.barcode).length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic">No registered products with barcodes in catalog. Add barcodes first.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto pr-1">
                    {inventory.filter(i => i.barcode).map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleScanBarcodeInPurchase(item.barcode || '')}
                        className="bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-lg p-2 text-left transition-colors cursor-pointer flex justify-between items-center"
                      >
                        <div className="truncate pr-1">
                          <strong className="text-[9px] text-slate-800 block truncate font-sans">{item.name}</strong>
                          <span className="text-[8px] text-slate-450 font-mono">Barcode: {item.barcode}</span>
                        </div>
                        <span className="bg-slate-250 hover:bg-indigo-200 text-slate-700 text-[8px] px-1 py-0.5 rounded font-mono font-black shrink-0">Scan</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsBarcodeScannerOpen(false)}
                className="w-full bg-slate-800 hover:bg-slate-950 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer text-center"
              >
                Apply & Close Scanner
              </button>

            </div>
          </div>
        </div>
      )}

      {/* Custom Supplier Delete Confirmation Modal */}
      {supplierToDelete && (
        <div className="fixed inset-0 bg-[#0F172A]/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in no-print">
          <div className="bg-[#F8FAFC] rounded-lg shadow-2xl max-w-md w-full overflow-hidden border border-[#E2E8F0] animate-zoom-in p-6 relative">
            <button 
              onClick={() => setSupplierToDelete(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#EF4444] rounded-full p-3.5 w-14 h-14 flex items-center justify-center">
                <Info className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold uppercase tracking-widest text-[#0F172A] font-mono">
                  Are you sure?
                </h3>
                <p className="text-xs text-slate-650 font-sans leading-relaxed">
                  This action cannot be undone. Delete [Supplier {supplierToDelete.name}]?
                </p>
                <p className="text-[10px] text-slate-400 font-sans">
                  This will not delete logged invoices for this supplier.
                </p>
              </div>

              <div className="flex gap-3 w-full pt-4">
                <button
                  type="button"
                  onClick={() => setSupplierToDelete(null)}
                  className="w-1/2 py-2.5 border border-[#E2E8F0] hover:bg-[#F1F5F9]/30 text-slate-700 bg-slate-100 font-bold uppercase tracking-wider text-[10px] transition-colors cursor-pointer rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSuppliers(prev => prev.filter(s => s.id !== supplierToDelete.id));
                    setSupplierToDelete(null);
                  }}
                  className="w-1/2 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold uppercase tracking-widest text-[10px] transition-colors cursor-pointer rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Preview Modal */}
      {previewAttachment && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-[60] p-4 animate-fade-in no-print">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-950 font-mono truncate max-w-[400px]">
                  Receipt Preview: {previewAttachment.name}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={previewAttachment.dataUrl}
                  download={previewAttachment.name}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Document</span>
                </a>
                <button
                  onClick={() => setPreviewAttachment(null)}
                  className="text-slate-400 hover:text-slate-650 cursor-pointer transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 bg-slate-100/50 flex items-center justify-center overflow-auto flex-1 min-h-[40vh]">
              {previewAttachment.dataUrl.startsWith('data:application/pdf') || previewAttachment.name.toLowerCase().endsWith('.pdf') ? (
                <div className="w-full h-full flex flex-col items-center">
                  <iframe
                    src={previewAttachment.dataUrl}
                    title={previewAttachment.name}
                    className="w-full h-[60vh] rounded-xl border border-slate-200 shadow-sm bg-white"
                  />
                  <div className="mt-2 text-[11px] text-slate-500 font-medium">
                    If PDF does not display inside sandbox iframe, please click <a href={previewAttachment.dataUrl} download={previewAttachment.name} className="text-indigo-600 underline font-bold">Download Document</a> above.
                  </div>
                </div>
              ) : previewAttachment.dataUrl.startsWith('data:image/') || previewAttachment.dataUrl.includes('image') || previewAttachment.name.match(/\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i) ? (
                <img
                  src={previewAttachment.dataUrl}
                  alt={previewAttachment.name}
                  className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-md border border-slate-200 bg-white p-2"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-xl shadow-xs border border-slate-200 max-w-md">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-800">Attached File: {previewAttachment.name}</p>
                  <p className="text-xs text-slate-500 mt-1 mb-4">Click below to download and view the attachment on your local device.</p>
                  <a
                    href={previewAttachment.dataUrl}
                    download={previewAttachment.name}
                    className="inline-flex items-center space-x-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Attachment</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden off-screen PDF printing containers */}
      {compExpenses.map(exp => {
        if (downloadingExpenseId !== exp.id) return null;
        
        const isPurchase = exp.category === 'Purchases';
        const displayTitle = isPurchase ? 'TAX PURCHASE BILL' : 'OFFICIAL EXPENSE VOUCHER';
        
        return (
          <div 
            key={exp.id}
            id={`printable-expense-${exp.id}`}
            style={{ position: 'absolute', left: '-9999px', top: '0', width: '800px' }}
            className="bg-white p-8 text-slate-800 font-sans text-xs space-y-6"
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-6">
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 font-sans">
                  {displayTitle}
                </h1>
                <div className="text-[10px] text-slate-400 font-mono mt-3">
                  Document Date: {exp.date} | Generation: {new Date().toLocaleDateString('en-AE')}
                </div>
              </div>
              <div className="text-right">
                <h3 className="text-lg font-black tracking-tight text-[#0F172A]">{company?.name || 'HISAAB PRO LLC'}</h3>
                <p className="text-[10px] text-slate-400 font-mono uppercase font-bold">Financial Systems UAE</p>
                <p className="text-[10px] text-slate-400 font-mono">TRN: {company?.trn || '100234567800003'}</p>
                {company?.phone && <p className="text-[10px] text-slate-400 font-mono">Phone: {company.phone}</p>}
                {company?.email && <p className="text-[10px] text-slate-400 font-mono">Email: {company.email}</p>}
              </div>
            </div>

            {/* Main Info Columns */}
            <div className="grid grid-cols-2 gap-8 text-[11px] bg-slate-50 border border-slate-150 p-4 rounded-xl">
              <div className="space-y-1">
                <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-mono">Document Details</p>
                <p className="text-slate-700"><strong>Voucher / Bill No:</strong> <span className="font-mono font-bold text-slate-900">{exp.invoiceNumber}</span></p>
                <p className="text-slate-700"><strong>Category:</strong> <span className="font-mono text-slate-900">{exp.category}</span></p>
                <p className="text-slate-700"><strong>Status:</strong> <span className="font-mono text-slate-900 font-bold text-emerald-600">{exp.status}</span></p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-mono">Supplier Details</p>
                <p className="text-slate-700"><strong>Supplier Name:</strong> <span className="font-sans font-bold text-slate-900">{exp.supplierName}</span></p>
                <p className="text-slate-700"><strong>TRN:</strong> <span className="font-mono text-slate-900">{exp.supplierTrn || 'N/A'}</span></p>
              </div>
            </div>

            {/* Description or Line Items */}
            <div className="space-y-2">
              <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-mono">Itemised Ledger</p>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[9px]">
                      <th className="py-2.5 px-4">Line Description</th>
                      <th className="py-2.5 px-4 text-center w-16">Qty</th>
                      <th className="py-2.5 px-4 text-right w-24">Rate</th>
                      {company?.vatEnabled !== false && <th className="py-2.5 px-4 text-center w-20">VAT Rate</th>}
                      <th className="py-2.5 px-4 text-right w-28">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                    {exp.items && exp.items.length > 0 ? (
                      exp.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-4 font-sans text-slate-850 font-semibold">{it.name}</td>
                          <td className="py-2.5 px-4 text-center">{it.qty}</td>
                          <td className="py-2.5 px-4 text-right">AED {it.rate.toFixed(2)}</td>
                          {company?.vatEnabled !== false && <td className="py-2.5 px-4 text-center">{it.vatRate}%</td>}
                          <td className="py-2.5 px-4 text-right font-bold text-slate-900">AED {it.total.toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-3 px-4 font-sans text-slate-850 font-semibold">{exp.description}</td>
                        <td className="py-3 px-4 text-center">1</td>
                        <td className="py-3 px-4 text-right">AED {exp.amount.toFixed(2)}</td>
                        {company?.vatEnabled !== false && <td className="py-3 px-4 text-center">5%</td>}
                        <td className="py-3 px-4 text-right font-bold text-slate-900">AED {exp.total.toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Box */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1.5 border border-slate-200 p-4 rounded-xl bg-slate-50/60 font-mono text-[11px] text-slate-700">
                <div className="flex justify-between">
                  <span>Taxable Subtotal:</span>
                  <span>AED {exp.amount.toFixed(2)}</span>
                </div>
                {company?.vatEnabled !== false && (
                  <div className="flex justify-between text-indigo-650 font-semibold font-bold">
                    <span>VAT Amount (5%):</span>
                    <span>AED {exp.vatAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-900 font-extrabold text-[12px] pt-1.5 border-t border-slate-200">
                  <span>Gross Total:</span>
                  <span>AED {exp.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {exp.internalNotes && (
              <div className="font-sans text-[11px] bg-slate-50 border-l-4 border-slate-300 p-3 rounded-r-lg text-slate-650">
                <strong>Internal Narration:</strong> {exp.internalNotes}
              </div>
            )}

            {/* Bottom compliance statement */}
            <div className="border-t border-slate-200 pt-6 text-center text-[10px] text-slate-400 font-mono space-y-1">
              <p>Certified Electronic Voucher — Valid without signature/stamp</p>
            </div>
          </div>
        );
      })}

    </div>
  );
}
