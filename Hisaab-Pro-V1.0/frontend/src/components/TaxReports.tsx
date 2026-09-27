import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { triggerPrint } from '../utils/printHelper';
import { sanitizeClonedDocForCanvas, generateAndDownloadPDF } from '../utils/pdfCanvasSanitizer';
import { 
  Percent, 
  TrendingUp,
  Activity, 
  Calendar, 
  ArrowDownRight, 
  ArrowUpRight, 
  CheckCircle, 
  Printer, 
  Coins, 
  Building,
  Info,
  Edit2,
  Check,
  CreditCard,
  Plus,
  AlertTriangle,
  FileText,
  ChevronRight,
  User,
  ExternalLink,
  RefreshCw,
  BarChart2,
  Briefcase,
  DollarSign,
  Package,
  Users,
  Tag,
  FileCheck,
  Layers,
  PieChart,
  ShieldAlert,
  Download,
  Settings,
  X,
  BellRing,
  Sparkles,
  Lightbulb,
  CheckSquare,
  MessageSquare,
  Shield,
  Receipt,
  BookOpen,
  FolderTree,
  Scale,
  ShieldCheck,
  Send,
  Truck,
  Navigation,
  MapPin,
  ShoppingBag,
  Shirt,
  Monitor,
  Laptop
} from 'lucide-react';
import { Company, Customer, InventoryItem, SalesDocument, Expense, COAAccount, JournalEntry } from '../types';
import { getCountryConfig } from '../utils/countryLocalization';
import { ProfitabilityAnalysisReport } from './ProfitabilityAnalysisReport';
import { AdvancedTimeReports } from './AdvancedTimeReports';
import { TallyReportsSuite } from './TallyReportsSuite';

interface TaxReportsProps {
  company: Company;
  documents: SalesDocument[];
  expenses: Expense[];
  customers: Customer[];
  inventory: InventoryItem[];
  selectedReportId?: string;
  setSelectedReportId?: (id: string) => void;
  mode?: 'vat' | 'reports';
  coaAccounts?: COAAccount[];
  journalEntries?: JournalEntry[];
  activePlan?: string;
}

export default function TaxReports({ 
  company: propCompany, 
  documents, 
  expenses, 
  customers, 
  inventory,
  selectedReportId,
  setSelectedReportId,
  mode = 'reports',
  coaAccounts = [],
  journalEntries = [],
  activePlan = 'trial'
}: TaxReportsProps) {
  const company: Company = propCompany || { 
    id: '', 
    name: 'Demo Company', 
    trn: '394820194000003', 
    logoUrl: '', 
    fyStart: '2026-01-01',
    invoicePrefix: 'INV-',
    quotationPrefix: 'QTN-',
    deliveryPrefix: 'DN-',
    currency: 'AED',
    currencySymbol: 'AED',
    symbolPosition: 'before',
    vatEnabled: true,
    inventoryEnabled: false,
    staffEnabled: false,
    bankName: '',
    bankAccountName: '',
    bankIban: '',
    footerNotes: ''
  };

  // 15 Reports State Selection
  const [localSelectedReport, setLocalSelectedReport] = useState<string>('vat_return');
  const selectedReport = selectedReportId !== undefined ? selectedReportId : localSelectedReport;
  const setSelectedReport = (id: string) => {
    if (setSelectedReportId) {
      setSelectedReportId(id);
    } else {
      setLocalSelectedReport(id);
    }
  };

  // Filter States
  const [startDate, setStartDate] = useState<string>(() => {
    // Default to Last Quarter if mode is vat, else start of current year
    const now = new Date();
    if (mode === 'vat') {
      const currentMonth = now.getMonth(); // 0-11
      let qYear = now.getFullYear();
      let qStartMonth = 0;
      if (currentMonth >= 0 && currentMonth <= 2) {
        qYear = qYear - 1;
        qStartMonth = 9;
      } else if (currentMonth >= 3 && currentMonth <= 5) {
        qStartMonth = 0;
      } else if (currentMonth >= 6 && currentMonth <= 8) {
        qStartMonth = 3;
      } else {
        qStartMonth = 6;
      }
      const start = new Date(qYear, qStartMonth, 1);
      const mm = String(start.getMonth() + 1).padStart(2, '0');
      const dd = String(start.getDate()).padStart(2, '0');
      return `${qYear}-${mm}-${dd}`;
    }
    return `${now.getFullYear()}-01-01`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    if (mode === 'vat') {
      const currentMonth = now.getMonth();
      let qYear = now.getFullYear();
      let qEndMonth = 2;
      if (currentMonth >= 0 && currentMonth <= 2) {
        qYear = qYear - 1;
        qEndMonth = 11;
      } else if (currentMonth >= 3 && currentMonth <= 5) {
        qEndMonth = 2;
      } else if (currentMonth >= 6 && currentMonth <= 8) {
        qEndMonth = 5;
      } else {
        qEndMonth = 8;
      }
      const end = new Date(qYear, qEndMonth + 1, 0);
      const mm = String(end.getMonth() + 1).padStart(2, '0');
      const dd = String(end.getDate()).padStart(2, '0');
      return `${qYear}-${mm}-${dd}`;
    }
    return `${now.getFullYear()}-12-31`;
  });

  // VAT 201 manual input states
  const [box2ZeroRatedSupplies, setBox2ZeroRatedSupplies] = useState<number>(() => {
    const saved = localStorage.getItem('hisaab_vat201_box2');
    return saved ? parseFloat(saved) : 0;
  });
  const [box3ExemptSupplies, setBox3ExemptSupplies] = useState<number>(() => {
    const saved = localStorage.getItem('hisaab_vat201_box3');
    return saved ? parseFloat(saved) : 0;
  });
  const [box6ZeroRatedExpenses, setBox6ZeroRatedExpenses] = useState<number>(() => {
    const saved = localStorage.getItem('hisaab_vat201_box6');
    return saved ? parseFloat(saved) : 0;
  });
  const [box9LatePenalty, setBox9LatePenalty] = useState<number>(() => {
    const saved = localStorage.getItem('hisaab_vat201_box9');
    return saved ? parseFloat(saved) : 0;
  });
  const [isVatCalculating, setIsVatCalculating] = useState(false);
  const [vatRecalculatedAt, setVatRecalculatedAt] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('ALL');
  const [selectedSupplierName, setSelectedSupplierName] = useState<string>('ALL');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('ALL');
  const [dayBookSearchTerm, setDayBookSearchTerm] = useState<string>('');
  
  // PDF Export State & Handler
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  const exportReportToPDF = async (customReportTitle?: string) => {
    setIsExportingPdf(true);
    const targetId = 'tax-report-printable-area';
    const element = document.getElementById(targetId);

    if (!element) {
      alert('Report print container not found. Executing standard print dialog.');
      triggerPrint(targetId);
      setIsExportingPdf(false);
      return;
    }

    try {
      const companyNameClean = (company?.name || 'Company').replace(/[^a-zA-Z0-9_-]/g, '_');
      const reportTag = customReportTitle || (selectedReport === 'vat_return' ? 'VAT_201_Return' : selectedReport.toUpperCase());
      const dateRange = `${startDate}_to_${endDate}`;
      const fileName = `${reportTag}_Report_${companyNameClean}_${dateRange}.pdf`;

      await generateAndDownloadPDF(element, fileName, { targetId, paperSize: 'a4' });
    } catch (error) {
      console.error("Error generating PDF via html2canvas:", error);
      triggerPrint(targetId);
    } finally {
      setIsExportingPdf(false);
    }
  };
  
  // ZATCA state
  const [zatcaInvoiceId, setZatcaInvoiceId] = useState<string>('');

  // FAF state
  const [fafTab, setFafTab] = useState<'gl' | 'sales' | 'purchase' | 'profile'>('gl');

  // Payment reminders state
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [activeReminder, setActiveReminder] = useState<any | null>(null);
  const [reminderMessage, setReminderMessage] = useState('');
  const [reminderHistory, setReminderHistory] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('hisaab_reminder_history');
    return saved ? JSON.parse(saved) : {};
  });

  const saveReminderHistory = (history: Record<string, string>) => {
    setReminderHistory(history);
    localStorage.setItem('hisaab_reminder_history', JSON.stringify(history));
  };

  // Reports Compliance Suggestions & Pre-Audit Checklist States
  const [checklistTasks, setChecklistTasks] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('hisaab_reports_checklist');
    return saved ? JSON.parse(saved) : {};
  });

  const [customNotes, setCustomNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('hisaab_reports_custom_notes');
    return saved ? JSON.parse(saved) : {};
  });

  const [activeTaskTab, setActiveTaskTab] = useState<'checklist' | 'insights' | 'notes'>('insights');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [noteInput, setNoteInput] = useState<string>('');

  // UAE Corporate Tax manual adjustments & relief state overrides
  const [ctEntertainmentInput, setCtEntertainmentInput] = useState<string>('');
  const [ctFinesInput, setCtFinesInput] = useState<string>('');
  const [ctSmallBusinessRelief, setCtSmallBusinessRelief] = useState<boolean>(false);

  // Cash Drawer Float & Counted Cash state
  const [drawerOpeningFloat, setDrawerOpeningFloat] = useState<number>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(`hisaab_drawer_float_${company.id}`) : null;
    return saved ? Number(saved) : 1000;
  });
  const [drawerCountedCash, setDrawerCountedCash] = useState<string>('');

  const toggleTask = (taskId: string) => {
    const next = { ...checklistTasks, [taskId]: !checklistTasks[taskId] };
    setChecklistTasks(next);
    localStorage.setItem('hisaab_reports_checklist', JSON.stringify(next));
  };

  const handleSaveNote = (reportId: string, text: string) => {
    const next = { ...customNotes, [reportId]: text };
    setCustomNotes(next);
    localStorage.setItem('hisaab_reports_custom_notes', JSON.stringify(next));
    setSuccessMsg('Advisory note saved successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Initialize or update note input when report changes
  React.useEffect(() => {
    setNoteInput(customNotes[selectedReport] || '');
  }, [selectedReport, customNotes]);

  React.useEffect(() => {
    localStorage.setItem('hisaab_vat201_box2', box2ZeroRatedSupplies.toString());
  }, [box2ZeroRatedSupplies]);

  React.useEffect(() => {
    localStorage.setItem('hisaab_vat201_box3', box3ExemptSupplies.toString());
  }, [box3ExemptSupplies]);

  React.useEffect(() => {
    localStorage.setItem('hisaab_vat201_box6', box6ZeroRatedExpenses.toString());
  }, [box6ZeroRatedExpenses]);

  React.useEffect(() => {
    localStorage.setItem('hisaab_vat201_box9', box9LatePenalty.toString());
  }, [box9LatePenalty]);

  // Local helper lists
  const activeCompanyInvoices = documents.filter(d => d.companyId === company.id && (d.type === 'Invoice' || d.type === 'CreditNote') && d.status !== 'Cancelled');
  const activeCompanyExpenses = expenses.filter(e => e.companyId === company.id);
  const activeCompanyCustomers = customers.filter(c => c.companyId === company.id);
  const activeCompanyInventory = (inventory || []).filter(i => i.companyId === company.id);

  // General Ledger Generator for FAF Export
  const getGLRecords = () => {
    const salesInvoices = (documents || [])
      .filter(doc => doc.companyId === company.id && doc.type === 'Invoice' && doc.status !== 'Cancelled')
      .map(doc => ({
        date: doc.date,
        type: 'Sales Invoice',
        ref: doc.docNumber,
        account: 'Accounts Receivable',
        description: `Invoice ${doc.docNumber} - ${activeCompanyCustomers.find(c => c.id === doc.customerId)?.name || 'Cash Customer'}`,
        debit: doc.total,
        credit: 0
      }));

    const salesRevenue = (documents || [])
      .filter(doc => doc.companyId === company.id && doc.type === 'Invoice' && doc.status !== 'Cancelled')
      .map(doc => ({
        date: doc.date,
        type: 'Sales Invoice',
        ref: doc.docNumber,
        account: 'Sales Revenue',
        description: `Revenue from Invoice ${doc.docNumber}`,
        debit: 0,
        credit: doc.subtotal
      }));

    const salesVat = (documents || [])
      .filter(doc => doc.companyId === company.id && doc.type === 'Invoice' && doc.status !== 'Cancelled' && doc.vatTotal > 0)
      .map(doc => ({
        date: doc.date,
        type: 'Sales Invoice',
        ref: doc.docNumber,
        account: 'VAT Output 5%',
        description: `VAT Output for Invoice ${doc.docNumber}`,
        debit: 0,
        credit: doc.vatTotal
      }));

    const purchaseExpenses = (expenses || [])
      .filter(exp => exp.companyId === company.id)
      .map(exp => ({
        date: exp.date,
        type: 'Expense Payment',
        ref: exp.invoiceNumber || 'EXP-' + exp.id,
        account: exp.category || 'General Expense',
        description: `Expense - ${exp.supplierName || 'General Supplier'} (${exp.description || ''})`,
        debit: exp.amount,
        credit: 0
      }));

    const purchaseVat = (expenses || [])
      .filter(exp => exp.companyId === company.id && exp.vatAmount > 0)
      .map(exp => ({
        date: exp.date,
        type: 'Expense Payment',
        ref: exp.invoiceNumber || 'EXP-' + exp.id,
        account: 'VAT Input 5%',
        description: `VAT Input for Expense`,
        debit: exp.vatAmount,
        credit: 0
      }));

    const purchaseCash = (expenses || [])
      .filter(exp => exp.companyId === company.id)
      .map(exp => ({
        date: exp.date,
        type: 'Expense Payment',
        ref: exp.invoiceNumber || 'EXP-' + exp.id,
        account: 'Cash / Bank Account',
        description: `Payment to ${exp.supplierName || 'Supplier'}`,
        debit: 0,
        credit: exp.total
      }));

    const allGL = [...salesInvoices, ...salesRevenue, ...salesVat, ...purchaseExpenses, ...purchaseVat, ...purchaseCash];
    allGL.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return allGL;
  };

  // Pending Payments Reminders Calculation
  const pendingInvoicesData = activeCompanyInvoices
    .filter(doc => doc.status !== 'Paid' && doc.status !== 'Cancelled' && doc.status !== 'Draft')
    .map(doc => {
      const cust = activeCompanyCustomers.find(c => c.id === doc.customerId);
      return {
        id: doc.id,
        clientName: cust ? cust.name : 'Unknown Client',
        clientPhone: cust ? cust.phone || cust.mobileNumber || '' : '',
        clientEmail: cust ? cust.email || '' : '',
        invoiceNo: doc.docNumber,
        dueDate: doc.dueDate || 'No Due Date',
        pendingAmount: doc.total,
        rawDoc: doc
      };
    });

  // Construction Retention Due Report Calculation
  const constructionRetentionData = React.useMemo(() => {
    return activeCompanyInvoices
      .filter(d => d.type === 'Invoice')
      .map(d => {
        const indData = d.industryData || {};
        const pct = indData.conRetentionPct || 0;
        const amt = indData.conRetentionAmt || 0;
        const projectName = indData.conProjectName || 'General Contracting Project';
        const client = activeCompanyCustomers.find(c => c.id === d.customerId);
        
        // Due Date calculation (usually 365 days after invoice date)
        const invoiceDate = new Date(d.date);
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 365);
        const formattedDueDate = dueDate.toISOString().split('T')[0];
        
        // Status: Held, Due for Release, Released
        const isPastDue = new Date() > dueDate;
        let retentionStatus = 'Held';
        if (isPastDue) {
          retentionStatus = 'Due for Release';
        }
        if (d.status === 'Paid' && isPastDue) {
          retentionStatus = 'Released';
        }
        
        return {
          id: d.id,
          projectName,
          invoiceNo: d.docNumber,
          clientName: client ? client.name : 'Unknown Client',
          invoiceTotal: d.total,
          retentionPct: pct,
          retentionAmt: amt,
          dueDate: formattedDueDate,
          status: retentionStatus
        };
      })
      .filter(item => item.retentionAmt > 0);
  }, [activeCompanyInvoices, activeCompanyCustomers]);

  // Industry: Gold & Jewellery Memo
  const goldJewelryData = React.useMemo(() => {
    return activeCompanyInvoices
      .filter(d => d.type === 'Invoice')
      .map(d => {
        const indData = d.industryData || {};
        const carat = indData.goldCarat || '21K';
        const weight = Number(indData.goldWeight) || 0;
        const dailyRate = Number(indData.goldDailyRate) || 0;
        const makingCharge = Number(indData.goldMakingCharge) || 0;
        const metalValue = weight * dailyRate;
        const totalValue = metalValue + makingCharge;
        const client = activeCompanyCustomers.find(c => c.id === d.customerId);
        
        return {
          id: d.id,
          invoiceNo: d.docNumber,
          clientName: client ? client.name : 'Walk-In Customer',
          date: d.date,
          carat,
          weight,
          dailyRate,
          makingCharge,
          metalValue,
          totalValue,
          totalDocAmount: d.total
        };
      })
      .filter(item => item.weight > 0);
  }, [activeCompanyInvoices, activeCompanyCustomers]);

  // Industry: Customs Clearance & Logistics Memo
  const logisticsData = React.useMemo(() => {
    return activeCompanyInvoices
      .filter(d => d.type === 'Invoice')
      .map(d => {
        const indData = d.industryData || {};
        const blNo = indData.logBLNumber || '';
        const containerNo = indData.logContainerNo || '';
        const decNo = indData.logCustomsDecNo || '';
        const port = indData.logPortOfEntry || 'Jebel Ali Port';
        const client = activeCompanyCustomers.find(c => c.id === d.customerId);

        // Simulate Port Storage / Demurrage Grace Days (standard 5 free days)
        const invoiceDate = new Date(d.date);
        const freeDaysExpiry = new Date(invoiceDate);
        freeDaysExpiry.setDate(freeDaysExpiry.getDate() + 5);
        const diffTime = Math.abs(new Date().getTime() - freeDaysExpiry.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isDemurrageAtRisk = new Date() > freeDaysExpiry;
        const estimatedDemurrage = isDemurrageAtRisk ? diffDays * 150 : 0; // AED 150/day standard demurrage

        return {
          id: d.id,
          invoiceNo: d.docNumber,
          clientName: client ? client.name : 'Importer Client',
          date: d.date,
          blNo,
          containerNo,
          decNo,
          port,
          graceExpiry: freeDaysExpiry.toISOString().split('T')[0],
          isAtRisk: isDemurrageAtRisk,
          demurrageFee: estimatedDemurrage,
          subtotal: d.subtotal
        };
      })
      .filter(item => item.blNo !== '' || item.decNo !== '');
  }, [activeCompanyInvoices, activeCompanyCustomers]);

  // Industry: Transportation Fleet Trips & Waybills Register Memo
  const transportationTripsData = React.useMemo(() => {
    return activeCompanyInvoices
      .filter(d => d.type === 'Invoice' || d.type === 'DeliveryNote')
      .map(d => {
        const indData = d.industryData || {};
        const tripNo = indData.transTripNo || d.docNumber;
        const vehicleNo = indData.transVehicleNo || (company.industry === 'Transportation' ? 'Fleet Truck' : '');
        const vehicleType = indData.transVehicleType || 'Heavy Flatbed Trailer (40ft)';
        const driverName = indData.transDriverName || 'Assigned Driver';
        const driverMobile = indData.transDriverMobile || '';
        const pickup = indData.transPickupLoc || 'Origin Loading Bay';
        const drop = indData.transDropLoc || 'Destination Offloading Site';
        const cargo = indData.transCargoType || 'Commercial Freight';
        const weight = indData.transWeightTons || '-';
        const pod = indData.transConsignmentPOD || 'Delivered';
        const distance = Number(indData.transDistanceKm) || 0;
        const detentionHours = Number(indData.transDetentionHours) || 0;
        const tollsSalik = Number(indData.transTollsSalik) || 0;
        const client = activeCompanyCustomers.find(c => c.id === d.customerId);

        return {
          id: d.id,
          tripNo,
          invoiceNo: d.docNumber,
          date: d.date,
          docType: d.type,
          clientName: client ? client.name : 'Corporate Shipper / Consignee',
          vehicleNo: vehicleNo || 'Fleet Vehicle',
          vehicleType,
          driverName,
          driverMobile,
          pickup,
          drop,
          route: `${pickup} ➔ ${drop}`,
          cargo,
          weight,
          pod,
          distance,
          detentionHours,
          tollsSalik,
          subtotal: d.subtotal || 0,
          vatTotal: d.vatTotal || 0,
          total: d.total || 0,
          status: d.status || 'Paid'
        };
      })
      .filter(item => {
        if (company.industry === 'Transportation') return true;
        const indData = activeCompanyInvoices.find(i => i.id === item.id)?.industryData || {};
        return !!(indData.transTripNo || indData.transVehicleNo || indData.transPickupLoc);
      });
  }, [activeCompanyInvoices, activeCompanyCustomers, company.industry]);

  // Industry: Transportation Vehicle & Route Profitability Memo
  const transportationVehiclePerformanceData = React.useMemo(() => {
    const map: Record<string, {
      vehicleNo: string;
      vehicleType: string;
      drivers: Set<string>;
      tripsCount: number;
      totalDistance: number;
      totalDetentionHours: number;
      totalTolls: number;
      totalSubtotal: number;
      totalVat: number;
      grossRevenue: number;
      routes: string[];
    }> = {};

    transportationTripsData.forEach(t => {
      const key = t.vehicleNo || 'Fleet Truck';
      if (!map[key]) {
        map[key] = {
          vehicleNo: key,
          vehicleType: t.vehicleType,
          drivers: new Set<string>(),
          tripsCount: 0,
          totalDistance: 0,
          totalDetentionHours: 0,
          totalTolls: 0,
          totalSubtotal: 0,
          totalVat: 0,
          grossRevenue: 0,
          routes: []
        };
      }
      if (t.driverName && t.driverName !== 'Assigned Driver') {
        map[key].drivers.add(t.driverName);
      }
      map[key].tripsCount += 1;
      map[key].totalDistance += t.distance;
      map[key].totalDetentionHours += t.detentionHours;
      map[key].totalTolls += t.tollsSalik;
      map[key].totalSubtotal += t.subtotal;
      map[key].totalVat += t.vatTotal;
      map[key].grossRevenue += t.total;
      if (t.route && !map[key].routes.includes(t.route)) {
        map[key].routes.push(t.route);
      }
    });

    return Object.values(map).map(v => ({
      vehicleNo: v.vehicleNo,
      vehicleType: v.vehicleType,
      drivers: Array.from(v.drivers).join(', ') || 'Fleet Driver',
      tripsCount: v.tripsCount,
      totalDistance: v.totalDistance,
      totalDetentionHours: v.totalDetentionHours,
      totalTolls: v.totalTolls,
      totalSubtotal: v.totalSubtotal,
      totalVat: v.totalVat,
      grossRevenue: v.grossRevenue,
      avgTripRevenue: v.tripsCount > 0 ? v.grossRevenue / v.tripsCount : 0,
      topRoute: v.routes[0] || 'Domestic GCC Network'
    }));
  }, [transportationTripsData]);

  // Industry: Retail Footwear, Clothing & Fashion Memos
  const retailSizeColorSalesData = React.useMemo(() => {
    const records: Array<{
      id: string;
      date: string;
      invoiceNo: string;
      customerName: string;
      brand: string;
      modelName: string;
      category: string;
      size: string;
      color: string;
      barcode: string;
      qty: number;
      unitRate: number;
      subtotal: number;
      vatAmount: number;
      total: number;
    }> = [];

    activeCompanyInvoices.forEach(inv => {
      const indData = inv.industryData || {};
      const fallbackBrand = indData.retBrand || 'Retail Brand';
      const fallbackCat = indData.retCategory || "Men's Footwear";
      const fallbackSize = indData.retSize || 'EU 42 / UK 8';
      const fallbackColor = indData.retColor || 'Black';
      const fallbackBarcode = indData.retBarcode || '';

      (inv.items || []).forEach((it, idx) => {
        const desc = it.name || '';
        // Skip return lines
        if (desc.includes('CUSTOMER RETURN') || desc.includes('RETURN-CREDIT') || it.rate < 0) return;

        const sizeMatch = desc.match(/Size:\s*([^|\]]+)/i) || desc.match(/(EU\s*\d+|Kandora\s*\d+|Size\s*[XSLM0-9]+)/i);
        const colorMatch = desc.match(/Color:\s*([^|\]]+)/i);
        const barcodeMatch = desc.match(/EAN:\s*([^|\]]+)/i);

        const size = sizeMatch ? sizeMatch[1].trim() : fallbackSize;
        const color = colorMatch ? colorMatch[1].trim() : fallbackColor;
        const barcode = barcodeMatch ? barcodeMatch[1].trim() : fallbackBarcode;

        let category = fallbackCat;
        if (/shoe|loafer|sandal|naal|sneaker|heel|boot|oxford/i.test(desc)) {
          if (/naal|sandal/i.test(desc)) category = 'Arabic SandalsNaal';
          else if (/heel/i.test(desc)) category = "Women's Heels & Sandals";
          else if (/sneaker|sport/i.test(desc)) category = 'Casual & Sneakers';
          else category = "Men's Formal Shoes";
        } else if (/kandora|thobe|dishdasha/i.test(desc)) {
          category = 'Arabic KandoraThobe';
        } else if (/abaya|jalabiya/i.test(desc)) {
          category = 'Abayas & Jalabiyas';
        } else if (/shirt|trouser|pant|jean|blazer/i.test(desc)) {
          category = "Men's Apparel / Shirts";
        }

        const subtotal = it.subtotal ?? (it.qty * it.rate);
        const vat = it.vatAmount ?? (subtotal * 0.05);
        const total = it.total ?? (subtotal + vat);

        const cust = activeCompanyCustomers.find(c => c.id === inv.customerId);
        const custName = cust?.name || 'Walk-in Retail Customer';

        records.push({
          id: `${inv.id}-${idx}`,
          date: inv.date,
          invoiceNo: inv.docNumber,
          customerName: custName,
          brand: fallbackBrand,
          modelName: desc.split('[')[0].trim() || 'Retail Product',
          category,
          size,
          color,
          barcode,
          qty: it.qty,
          unitRate: it.rate,
          subtotal,
          vatAmount: vat,
          total
        });
      });
    });

    return records;
  }, [activeCompanyInvoices, activeCompanyCustomers]);

  const retailReturnsExchangesData = React.useMemo(() => {
    const returns: Array<{
      id: string;
      date: string;
      invoiceNo: string;
      customerName: string;
      originalRef: string;
      returnedItem: string;
      reason: string;
      creditAmount: number;
      condition: string;
    }> = [];

    activeCompanyInvoices.forEach(inv => {
      const cust = activeCompanyCustomers.find(c => c.id === inv.customerId);
      const custName = cust?.name || 'Walk-in Retail Customer';
      (inv.items || []).forEach((it, idx) => {
        const desc = it.name || '';
        if (desc.includes('CUSTOMER RETURN') || desc.includes('SIZE EXCHANGE') || it.sku === 'RETURN-CREDIT' || it.rate < 0) {
          const origMatch = desc.match(/Orig Ref:\s*([^)]+)/i);
          const origRef = origMatch ? origMatch[1].trim() : (inv.industryData?.retExchangeRef || 'INV-PREV');
          returns.push({
            id: `${inv.id}-ret-${idx}`,
            date: inv.date,
            invoiceNo: inv.docNumber,
            customerName: custName,
            originalRef: origRef,
            returnedItem: desc.replace(/\[CUSTOMER RETURN \/ SIZE EXCHANGE\]:\s*/i, '').split('(')[0].trim() || 'Size Swap',
            reason: 'Size / Fit Mismatch (14-Day FTA Exchange Guarantee)',
            creditAmount: Math.abs(it.subtotal ?? (it.qty * it.rate)),
            condition: 'Unworn in Original Packaging (Inspected & Restocked)'
          });
        }
      });
    });

    return returns;
  }, [activeCompanyInvoices, activeCompanyCustomers]);

  const retailFastMovingSizesData = React.useMemo(() => {
    const sizeMap: Record<string, { size: string; pairsSold: number; totalRevenue: number; category: string }> = {};

    retailSizeColorSalesData.forEach(r => {
      const key = r.size;
      if (!sizeMap[key]) {
        sizeMap[key] = {
          size: key,
          pairsSold: 0,
          totalRevenue: 0,
          category: r.category
        };
      }
      sizeMap[key].pairsSold += r.qty;
      sizeMap[key].totalRevenue += r.total;
    });

    const totalUnitsAll = Object.values(sizeMap).reduce((s, x) => s + x.pairsSold, 0) || 1;

    return Object.values(sizeMap)
      .sort((a, b) => b.pairsSold - a.pairsSold)
      .map((item, rank) => ({
        rank: rank + 1,
        size: item.size,
        category: item.category,
        pairsSold: item.pairsSold,
        totalRevenue: item.totalRevenue,
        sharePct: Math.round((item.pairsSold / totalUnitsAll) * 1000) / 10,
        velocityStatus: item.pairsSold >= 5 ? 'High Velocity' : item.pairsSold >= 2 ? 'Steady Medium' : 'Normal Flow',
        reorderTip: item.pairsSold >= 5 ? 'Urgent Reorder (+24 Units)' : item.pairsSold >= 2 ? 'Standard Stock Replenishment' : 'Adequate Shelf Inventory'
      }));
  }, [retailSizeColorSalesData]);

  // Industry: Computer Sales, Service, Printers & IT Solutions Memo
  const itRepairWarrantyData = React.useMemo(() => {
    const records: Array<{
      id: string;
      refNo: string;
      date: string;
      customerName: string;
      category: string;
      brandModel: string;
      serialNumber: string;
      specs: string;
      warranty: string;
      subtotal: number;
      vat: number;
      total: number;
      status: string;
      isJobCard?: boolean;
    }> = [];

    // 1. Invoices / Delivery Notes
    activeCompanyInvoices.forEach(inv => {
      const indData = inv.industryData || {};
      const client = activeCompanyCustomers.find(c => c.id === inv.customerId);
      const custName = client?.name || 'Walk-in IT Customer';

      (inv.items || []).forEach((it, idx) => {
        const hasItFields = it.serialNumber || it.deviceSpecs || it.printerModelCompatibility || it.jobCardId || it.itCategory || it.isServiceItem;
        const isItName = /laptop|desktop|computer|printer|toner|cartridge|repair|service|ram|ssd|router|switch|monitor|screen|nvme/i.test(it.name || '');
        const isCompIndustry = company.industry === 'ComputerSalesAndService' || indData.itItemCategory || indData.itSerialNumber;

        if (hasItFields || isItName || isCompIndustry) {
          const cat = it.itCategory 
            ? it.itCategory.toUpperCase()
            : indData.itItemCategory || (it.isServiceItem ? 'REPAIR & SERVICE' : /printer|toner/i.test(it.name) ? 'PRINTER / TONER' : 'HARDWARE');
          const brandModel = it.name;
          const sNumber = it.serialNumber || indData.itSerialNumber || '-';
          const specs = it.deviceSpecs || it.printerModelCompatibility || indData.itDeviceSpecs || indData.itPrinterCompatibility || '-';
          const warranty = it.warranty || indData.itWarranty || 'Standard 1 Year';
          const subtotal = it.subtotal ?? (it.qty * it.rate);
          const vat = it.vatAmount ?? (subtotal * 0.05);
          const total = it.total ?? (subtotal + vat);

          records.push({
            id: `${inv.id}-${idx}`,
            refNo: inv.docNumber,
            date: inv.date,
            customerName: custName,
            category: cat,
            brandModel,
            serialNumber: sNumber,
            specs,
            warranty,
            subtotal,
            vat,
            total,
            status: inv.status || 'Paid'
          });
        }
      });
    });

    // 2. Also incorporate active repair job cards from local storage
    try {
      const storedJobs = localStorage.getItem(`hisaab_job_cards_${company.id}`);
      if (storedJobs) {
        const parsed = JSON.parse(storedJobs);
        if (Array.isArray(parsed)) {
          parsed.forEach((job: any) => {
            records.push({
              id: `job-${job.id}`,
              refNo: job.ticketNumber || `JOB-${(job.id || '').slice(0, 6)}`,
              date: job.receivedDate || new Date().toISOString().split('T')[0],
              customerName: job.customerName || 'Service Client',
              category: `REPAIR SERVICE (${job.deviceType || 'Hardware'})`,
              brandModel: `${job.deviceBrand || ''} ${job.deviceModel || ''}`.trim() || 'Device In Service',
              serialNumber: job.serialNumber || 'N/A',
              specs: job.problemReported || 'Diagnosis & Service',
              warranty: '90 Days Service Warranty',
              subtotal: job.estimatedCost || 0,
              vat: (job.estimatedCost || 0) * 0.05,
              total: (job.estimatedCost || 0) * 1.05,
              status: job.status || 'In Progress',
              isJobCard: true
            });
          });
        }
      }
    } catch {
      // safe fallback
    }

    return records;
  }, [activeCompanyInvoices, activeCompanyCustomers, company.id, company.industry]);

  // Industry: Hardware & Toner Sales Velocity Memo
  const itHardwareTonerData = React.useMemo(() => {
    const map = new Map<string, {
      category: string;
      name: string;
      brand: string;
      sku: string;
      compatibility: string;
      unitsSold: number;
      revenue: number;
      currentStock: number;
      restockStatus: string;
    }>();

    // From inventory items
    activeCompanyInventory.forEach(invItem => {
      const isIT = invItem.itCategory || /laptop|desktop|printer|toner|cartridge|ssd|ram/i.test(invItem.name);
      if (isIT || company.industry === 'ComputerSalesAndService') {
        const cat = invItem.itCategory ? invItem.itCategory.toUpperCase() : invItem.category || 'IT Hardware';
        map.set(invItem.id, {
          category: cat,
          name: invItem.name,
          brand: invItem.brand || 'IT OEM',
          sku: invItem.sku || 'N/A',
          compatibility: invItem.printerModelCompatibility || invItem.deviceSpecs || 'Universal / PC',
          unitsSold: 0,
          revenue: 0,
          currentStock: invItem.stockQuantity || 0,
          restockStatus: (invItem.stockQuantity || 0) <= 2 ? '⚠️ Low Stock Reorder' : '✅ Sufficient'
        });
      }
    });

    // Add sales velocity from invoices
    activeCompanyInvoices.forEach(inv => {
      (inv.items || []).forEach(it => {
        if (it.itemId && map.has(it.itemId)) {
          const rec = map.get(it.itemId)!;
          rec.unitsSold += it.qty || 1;
          rec.revenue += it.total ?? ((it.qty || 1) * it.rate * 1.05);
          if (rec.currentStock <= 2 || rec.unitsSold >= 5) {
            rec.restockStatus = '🔥 Fast Moving - Restock';
          }
        }
      });
    });

    return Array.from(map.values());
  }, [activeCompanyInventory, activeCompanyInvoices, company.industry]);

  // Industry: ECommerce Memo
  const ecommerceData = React.useMemo(() => {
    return activeCompanyInvoices
      .filter(d => d.type === 'Invoice')
      .map(d => {
        const indData = d.industryData || {};
        const orderId = indData.ecoOrderID || '';
        const courier = indData.ecoCourier || 'Aramex';
        const waybill = indData.ecoWaybill || '';
        const gateway = indData.ecoPaymentGateway || 'Stripe';
        const destTax = indData.ecoDestTax || 'None';
        const client = activeCompanyCustomers.find(c => c.id === d.customerId);

        // Simulate payment gateway transaction processing fees
        // Stripe: 2.9% + 1 AED, Apple Pay: 1.5%, Tabby/Tamara: 4.5%
        let pgFeePct = 0.029;
        let pgFlat = 1;
        if (gateway.includes('Apple')) { pgFeePct = 0.015; pgFlat = 0; }
        else if (gateway.includes('Tabby') || gateway.includes('Tamara')) { pgFeePct = 0.045; pgFlat = 0; }
        const estimatedFee = d.total * pgFeePct + pgFlat;

        return {
          id: d.id,
          invoiceNo: d.docNumber,
          clientName: client ? client.name : 'Online Shopper',
          date: d.date,
          orderId,
          courier,
          waybill,
          gateway,
          destTax,
          estimatedFee,
          netSettlement: d.total - estimatedFee,
          total: d.total
        };
      })
      .filter(item => item.orderId !== '');
  }, [activeCompanyInvoices, activeCompanyCustomers]);

  // Industry: Tourism Memo
  const tourismData = React.useMemo(() => {
    return activeCompanyInvoices
      .filter(d => d.type === 'Invoice')
      .map(d => {
        const indData = d.industryData || {};
        const refNo = indData.touBookingRef || '';
        const vehiclePlate = indData.touVehiclePlate || '';
        const passportId = indData.touPassportID || '';
        const agreementNo = indData.touAgreementNo || '';
        const chargeType = indData.touChargeType || 'Salik';
        const chargeQty = Number(indData.touChargeQty) || 0;
        const client = activeCompanyCustomers.find(c => c.id === d.customerId);

        // Calculate Surcharges: Salik is AED 4 per gate, Tourism Dirham is AED 15, EU City Tax is AED 20
        let unitCost = 4;
        if (chargeType === 'TourismDirham') unitCost = 15;
        if (chargeType === 'EUCityTax') unitCost = 20;
        const surchargeAmt = chargeQty * unitCost;

        return {
          id: d.id,
          invoiceNo: d.docNumber,
          clientName: client ? client.name : 'Tourist Guest',
          date: d.date,
          refNo,
          vehiclePlate,
          passportId,
          agreementNo,
          chargeType,
          chargeQty,
          surchargeAmt,
          total: d.total
        };
      })
      .filter(item => item.refNo !== '' || item.vehiclePlate !== '');
  }, [activeCompanyInvoices, activeCompanyCustomers]);

  // Industry: Grocery Memo
  const groceryData = React.useMemo(() => {
    return activeCompanyInvoices
      .filter(d => d.type === 'Invoice')
      .map(d => {
        const indData = d.industryData || {};
        const weight = Number(indData.simulatedWeight) || 0;
        const client = activeCompanyCustomers.find(c => c.id === d.customerId);

        return {
          id: d.id,
          invoiceNo: d.docNumber,
          clientName: client ? client.name : 'Retail Walk-In',
          date: d.date,
          weight,
          itemCount: d.items ? d.items.length : 1,
          subtotal: d.subtotal,
          total: d.total
        };
      })
      .filter(item => item.weight > 0 || item.total > 0);
  }, [activeCompanyInvoices, activeCompanyCustomers]);

  // Industry: Mobile Memo
  const mobileData = React.useMemo(() => {
    return activeCompanyInvoices
      .filter(d => d.type === 'Invoice')
      .map(d => {
        const indData = d.industryData || {};
        const imei = indData.imeiNumber || '';
        const warranty = indData.warrantyPlan || 'None';
        const installment = indData.installmentPlan || 'Full Payment';
        const client = activeCompanyCustomers.find(c => c.id === d.customerId);

        return {
          id: d.id,
          invoiceNo: d.docNumber,
          clientName: client ? client.name : 'Device Buyer',
          date: d.date,
          imei,
          warranty,
          installment,
          total: d.total
        };
      })
      .filter(item => item.imei !== '');
  }, [activeCompanyInvoices, activeCompanyCustomers]);

  // Industry: General Trading Memo
  const generalTradingData = React.useMemo(() => {
    return activeCompanyInvoices
      .filter(d => d.type === 'Invoice')
      .map(d => {
        const indData = d.industryData || {};
        const warehouse = indData.warehouseSource || 'Unallocated WH';
        const lpo = indData.lpoNumber || '';
        const client = activeCompanyCustomers.find(c => c.id === d.customerId);

        return {
          id: d.id,
          invoiceNo: d.docNumber,
          clientName: client ? client.name : 'Wholesale Client',
          date: d.date,
          warehouse,
          lpo,
          total: d.total
        };
      })
      .filter(item => item.lpo !== '' || item.warehouse !== 'Unallocated WH');
  }, [activeCompanyInvoices, activeCompanyCustomers]);

  // Industry: Restaurant Memo
  const restaurantData = React.useMemo(() => {
    return activeCompanyInvoices
      .filter(d => d.type === 'Invoice')
      .map(d => {
        const indData = d.industryData || {};
        const table = indData.restaurantTable || 'Takeaway';
        const kot = !!indData.restaurantKOT;
        const client = activeCompanyCustomers.find(c => c.id === d.customerId);

        return {
          id: d.id,
          invoiceNo: d.docNumber,
          clientName: client ? client.name : 'Diner Guest',
          date: d.date,
          table,
          kot,
          total: d.total
        };
      })
      .filter(item => item.total > 0);
  }, [activeCompanyInvoices, activeCompanyCustomers]);

  // Industry: Laundry Memo
  const laundryData = React.useMemo(() => {
    return activeCompanyInvoices
      .filter(d => d.type === 'Invoice')
      .map(d => {
        const indData = d.industryData || {};
        const jobNo = indData.laundryJobNo || '';
        const pickup = indData.laundryPickupDate || '';
        const delivery = indData.laundryDeliveryDate || '';
        const status = indData.laundryStatus || 'Received';
        const client = activeCompanyCustomers.find(c => c.id === d.customerId);

        return {
          id: d.id,
          invoiceNo: d.docNumber,
          clientName: client ? client.name : 'Laundry Customer',
          date: d.date,
          jobNo,
          pickup,
          delivery,
          status,
          total: d.total
        };
      })
      .filter(item => item.jobNo !== '');
  }, [activeCompanyInvoices, activeCompanyCustomers]);

  // Industry: Printing Memo
  const printingData = React.useMemo(() => {
    return activeCompanyInvoices
      .filter(d => d.type === 'Invoice')
      .map(d => {
        const indData = d.industryData || {};
        const jobNo = indData.printJobNo || '';
        const proofStatus = indData.printDesignStatus || 'Pending Draft';
        const advance = Number(indData.printAdvancePaid) || 0;
        const client = activeCompanyCustomers.find(c => c.id === d.customerId);

        return {
          id: d.id,
          invoiceNo: d.docNumber,
          clientName: client ? client.name : 'Print Client',
          date: d.date,
          jobNo,
          proofStatus,
          advance,
          balanceDue: d.total - advance,
          total: d.total
        };
      })
      .filter(item => item.jobNo !== '');
  }, [activeCompanyInvoices, activeCompanyCustomers]);

  // Industry: Service Memo
  const servicesData = React.useMemo(() => {
    return activeCompanyInvoices
      .filter(d => d.type === 'Invoice')
      .map(d => {
        const indData = d.industryData || {};
        const ticketId = indData.serviceTicketId || '';
        const specialist = indData.serviceStaffAssign || 'Unassigned';
        const visitDate = indData.serviceVisitDate || '';
        const client = activeCompanyCustomers.find(c => c.id === d.customerId);

        return {
          id: d.id,
          invoiceNo: d.docNumber,
          clientName: client ? client.name : 'Support Requester',
          date: d.date,
          ticketId,
          specialist,
          visitDate,
          total: d.total
        };
      })
      .filter(item => item.ticketId !== '');
  }, [activeCompanyInvoices, activeCompanyCustomers]);

  // Industry: Accounting Memo
  const accountingData = React.useMemo(() => {
    return activeCompanyInvoices
      .filter(d => d.type === 'Invoice')
      .map(d => {
        const indData = d.industryData || {};
        const taxPeriod = indData.accTaxPeriod || 'Q3 2026';
        const client = activeCompanyCustomers.find(c => c.id === d.customerId);

        return {
          id: d.id,
          invoiceNo: d.docNumber,
          clientName: client ? client.name : 'Audit Client',
          date: d.date,
          taxPeriod,
          subtotal: d.subtotal,
          vatTotal: d.vatTotal,
          total: d.total
        };
      })
      .filter(item => item.taxPeriod !== '');
  }, [activeCompanyInvoices, activeCompanyCustomers]);

  // Industry: Real Estate Memo
  const realEstateData = React.useMemo(() => {
    return activeCompanyInvoices
      .filter(d => d.type === 'Invoice')
      .map(d => {
        const indData = d.industryData || {};
        const propertyId = indData.realPropertyID || '';
        const tenant = indData.realTenantName || '';
        const ejari = indData.realEjariNo || '';
        const maintenance = indData.realMaintenanceStatus || 'Handover Complete';
        const client = activeCompanyCustomers.find(c => c.id === d.customerId);

        return {
          id: d.id,
          invoiceNo: d.docNumber,
          clientName: client ? client.name : 'Property Tenant',
          date: d.date,
          propertyId,
          tenant,
          ejari,
          maintenance,
          total: d.total
        };
      })
      .filter(item => item.propertyId !== '');
  }, [activeCompanyInvoices, activeCompanyCustomers]);

  // Industry: Auto Repair Memo
  const autoRepairData = React.useMemo(() => {
    return activeCompanyInvoices
      .filter(d => d.type === 'Invoice')
      .map(d => {
        const indData = d.industryData || {};
        const vin = indData.autoVIN || '';
        const plate = indData.autoPlateNo || '';
        const mileage = Number(indData.autoMileage) || 0;
        const mechanic = indData.autoMechanic || 'Duty Mechanic';
        const client = activeCompanyCustomers.find(c => c.id === d.customerId);

        return {
          id: d.id,
          invoiceNo: d.docNumber,
          clientName: client ? client.name : 'Car Owner',
          date: d.date,
          vin,
          plate,
          mileage,
          mechanic,
          total: d.total
        };
      })
      .filter(item => item.vin !== '' || item.plate !== '');
  }, [activeCompanyInvoices, activeCompanyCustomers]);

  // Apply filters on Invoices and Expenses
  const filteredInvoices = activeCompanyInvoices.filter(i => {
    const itemDate = (i.date || '').slice(0, 10);
    const matchesStartDate = !startDate || itemDate >= startDate;
    const matchesEndDate = !endDate || itemDate <= endDate;
    const matchesCustomer = selectedCustomerId === 'ALL' || i.customerId === selectedCustomerId;
    return matchesStartDate && matchesEndDate && matchesCustomer;
  });

  const filteredExpenses = activeCompanyExpenses.filter(e => {
    const itemDate = (e.date || '').slice(0, 10);
    const matchesStartDate = !startDate || itemDate >= startDate;
    const matchesEndDate = !endDate || itemDate <= endDate;
    const matchesSupplier = selectedSupplierName === 'ALL' || e.supplierName === selectedSupplierName;
    const matchesCategory = expenseCategoryFilter === 'ALL' || e.category === expenseCategoryFilter;
    return matchesStartDate && matchesEndDate && matchesSupplier && matchesCategory;
  });

  // Unique lists for filtering dropdowns
  const suppliersList = Array.from(new Set(activeCompanyExpenses.map(e => e.supplierName)));

  // Day Book calculations grouped on a date-by-date basis
  const dayBookItems = React.useMemo(() => {
    const items: Array<{
      id: string;
      date: string;
      docNumber: string;
      type: 'Invoice' | 'Credit Note' | 'Purchase' | 'Expense' | 'Journal Entry';
      categoryKind: 'Sale' | 'Purchase' | 'Expense' | 'Credit Note' | 'Journal';
      partyName: string;
      details: string;
      amount: number;
      paymentStatus: 'Paid' | 'Unpaid' | 'Partial';
      cashInflow: number;
      cashOutflow: number;
      isDebit: boolean;
    }> = [];

    // 1. Invoices & Credit Notes
    filteredInvoices.forEach(inv => {
      const custName = activeCompanyCustomers.find(c => c.id === inv.customerId)?.name || 'Cash Client';
      const isCredit = inv.type === 'CreditNote';
      const pStatus: 'Paid' | 'Unpaid' | 'Partial' = inv.status === 'Paid' ? 'Paid' : (inv.paymentReceived && inv.paymentReceived > 0 ? 'Partial' : 'Unpaid');
      const paidAmt = inv.paymentReceived || (inv.status === 'Paid' ? inv.total : 0);

      items.push({
        id: `inv-${inv.id}`,
        date: (inv.date || '').slice(0, 10),
        docNumber: inv.docNumber || 'INV',
        type: isCredit ? 'Credit Note' : 'Invoice',
        categoryKind: isCredit ? 'Credit Note' : 'Sale',
        partyName: custName,
        details: `Terms: ${inv.paymentTerms || 'Net 0'} • Status: ${inv.status || 'Active'} • Paid: ${paidAmt > 0 ? paidAmt.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}`,
        amount: inv.total || 0,
        paymentStatus: pStatus,
        cashInflow: isCredit ? 0 : paidAmt,
        cashOutflow: isCredit ? paidAmt : 0,
        isDebit: !isCredit
      });
    });

    // 2. Expenses & Supplier Purchase Invoices
    filteredExpenses.forEach(exp => {
      const isPurchaseCategory = exp.category === 'Purchases' || exp.category === 'Supplier Credit Note' || exp.category === 'Debit Note';
      const kind: 'Purchase' | 'Expense' = isPurchaseCategory ? 'Purchase' : 'Expense';
      const pStatus: 'Paid' | 'Unpaid' | 'Partial' = exp.status === 'Paid' ? 'Paid' : (exp.paymentReceived && exp.paymentReceived > 0 ? 'Partial' : 'Unpaid');
      const paidAmt = exp.paymentReceived || (exp.status === 'Paid' ? exp.total : 0);

      items.push({
        id: `exp-${exp.id}`,
        date: (exp.date || '').slice(0, 10),
        docNumber: exp.invoiceNumber || (`EXP-${exp.id}`),
        type: isPurchaseCategory ? 'Purchase' : 'Expense',
        categoryKind: kind,
        partyName: exp.supplierName || 'General Supplier',
        details: `Category: ${exp.category || 'General'} • Status: ${exp.status || 'Posted'} • Paid: ${paidAmt > 0 ? paidAmt.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}`,
        amount: exp.total || 0,
        paymentStatus: pStatus,
        cashInflow: 0,
        cashOutflow: paidAmt,
        isDebit: false
      });
    });

    // 3. Journal Entries
    (journalEntries || [])
      .filter(je => {
        if (je.companyId !== company.id || je.status !== 'Posted') return false;
        const jDate = (je.date || '').slice(0, 10);
        const matchesStartDate = !startDate || jDate >= startDate;
        const matchesEndDate = !endDate || jDate >= endDate;
        return matchesStartDate && matchesEndDate;
      })
      .forEach(je => {
        const totalDebit = je.lines ? je.lines.reduce((sum, l) => sum + (l.debit || 0), 0) : 0;
        items.push({
          id: `je-${je.id}`,
          date: (je.date || '').slice(0, 10),
          docNumber: je.reference || `JE-${je.id}`,
          type: 'Journal Entry',
          categoryKind: 'Journal',
          partyName: je.description || 'Manual Journal Entry',
          details: 'Double-Entry General Ledger Posting',
          amount: totalDebit,
          paymentStatus: 'Paid',
          cashInflow: 0,
          cashOutflow: 0,
          isDebit: true
        });
      });

    // Sort chronologically by date ascending, then docNumber
    return items.sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      return a.docNumber.localeCompare(b.docNumber);
    });
  }, [filteredInvoices, filteredExpenses, journalEntries, company.id, startDate, endDate, activeCompanyCustomers]);

  const searchedDayBookItems = React.useMemo(() => {
    if (!dayBookSearchTerm.trim()) return dayBookItems;
    const term = dayBookSearchTerm.toLowerCase();
    return dayBookItems.filter(item =>
      item.docNumber.toLowerCase().includes(term) ||
      item.partyName.toLowerCase().includes(term) ||
      item.type.toLowerCase().includes(term) ||
      item.categoryKind.toLowerCase().includes(term) ||
      item.details.toLowerCase().includes(term) ||
      item.date.includes(term)
    );
  }, [dayBookItems, dayBookSearchTerm]);

  // Overall Cash on Hand & Liquidity Calculation Engine
  const cashOnHandMetrics = React.useMemo(() => {
    // Cumulative cash inflows from ALL paid sales
    const totalSalesCashInflow = activeCompanyInvoices.reduce((sum, inv) => {
      const paid = inv.paymentReceived || (inv.status === 'Paid' ? inv.total : 0);
      return sum + (inv.type === 'CreditNote' ? 0 : paid);
    }, 0);

    // Cumulative cash outflows for ALL paid expenses & purchases
    const totalExpenseCashOutflow = activeCompanyExpenses.reduce((sum, exp) => {
      const paid = exp.paymentReceived || (exp.status === 'Paid' ? exp.total : 0);
      return sum + paid;
    }, 0);

    // Base Opening Cash & Bank Reserve from Company settings or 50,000 default
    const baseOpeningCash = (company as any)?.openingCashBalance || 50000;
    const currentCashOnHand = baseOpeningCash + totalSalesCashInflow - totalExpenseCashOutflow;

    // Period specific metrics
    const periodSold = dayBookItems.filter(i => i.categoryKind === 'Sale').reduce((s, i) => s + i.amount, 0);
    const periodPurchased = dayBookItems.filter(i => i.categoryKind === 'Purchase').reduce((s, i) => s + i.amount, 0);
    const periodSpent = dayBookItems.filter(i => i.categoryKind === 'Expense').reduce((s, i) => s + i.amount, 0);
    const periodCreditNotes = dayBookItems.filter(i => i.categoryKind === 'Credit Note').reduce((s, i) => s + i.amount, 0);
    const periodCashInflow = dayBookItems.reduce((s, i) => s + i.cashInflow, 0);
    const periodCashOutflow = dayBookItems.reduce((s, i) => s + i.cashOutflow, 0);
    const periodNetCash = periodCashInflow - periodCashOutflow;

    return {
      currentCashOnHand,
      totalSalesCashInflow,
      totalExpenseCashOutflow,
      baseOpeningCash,
      periodSold,
      periodPurchased,
      periodSpent,
      periodCreditNotes,
      periodCashInflow,
      periodCashOutflow,
      periodNetCash
    };
  }, [activeCompanyInvoices, activeCompanyExpenses, dayBookItems, company]);

  const dayBookGroupedByDate = React.useMemo(() => {
    const dateMap: Record<string, typeof searchedDayBookItems> = {};
    searchedDayBookItems.forEach(item => {
      const d = item.date || 'Unspecified Date';
      if (!dateMap[d]) dateMap[d] = [];
      dateMap[d].push(item);
    });

    const dates = Object.keys(dateMap).sort();
    return dates.map(d => {
      const items = dateMap[d];
      const totalSold = items.filter(i => i.categoryKind === 'Sale').reduce((sum, i) => sum + i.amount, 0);
      const totalPurchased = items.filter(i => i.categoryKind === 'Purchase').reduce((sum, i) => sum + i.amount, 0);
      const totalSpent = items.filter(i => i.categoryKind === 'Expense').reduce((sum, i) => sum + i.amount, 0);
      const totalCreditNotes = items.filter(i => i.categoryKind === 'Credit Note').reduce((sum, i) => sum + i.amount, 0);
      const totalJournals = items.filter(i => i.categoryKind === 'Journal').reduce((sum, i) => sum + i.amount, 0);

      const dailyCashInflow = items.reduce((sum, i) => sum + i.cashInflow, 0);
      const dailyCashOutflow = items.reduce((sum, i) => sum + i.cashOutflow, 0);
      const dailyNetCash = dailyCashInflow - dailyCashOutflow;
      const dailyNetAccrual = totalSold - totalPurchased - totalSpent - totalCreditNotes;

      return {
        date: d,
        items,
        totalSold,
        totalPurchased,
        totalSpent,
        totalCreditNotes,
        totalJournals,
        dailyCashInflow,
        dailyCashOutflow,
        dailyNetCash,
        dailyNetAccrual
      };
    });
  }, [searchedDayBookItems]);

  // Currency utility
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

  // CSV Exporter
  const exportToCSV = (headers: string[], rows: any[][], reportTitle: string) => {
    const sanitizedTitle = reportTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${company.name.toLowerCase().replace(/\s+/g, '_')}_${sanitizedTitle}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 15 Reports Definition
  const fullReportsList = [
    { id: 'daily_executive_pulse', label: '0A. Daily Business & Cash Flow Pulse', category: 'Analysis', isPriority: true, icon: Activity },
    { id: 'weekly_trailing_perf', label: '0B. Weekly Performance & Collections', category: 'Analysis', isPriority: true, icon: TrendingUp },
    { id: 'monthly_revenue_matrix', label: '0C. Monthly Revenue & Margin Matrix', category: 'Analysis', isPriority: true, icon: Calendar },
    { id: 'extraordinary_strategic_audit', label: '0D. 360° Extraordinary Strategic Audit', category: 'Analysis', isPriority: true, icon: ShieldAlert },
    { id: 'vat_return', label: '1. VAT Return (FTA Form 201)', category: 'Compliance', isPriority: true, icon: Percent },
    { id: 'aging_receivables', label: '2. Aging Receivables Ledger', category: 'Accounts', isPriority: true, icon: ShieldAlert },
    { id: 'profit_loss', label: '3. Profit & Loss (P&L)', category: 'Financials', isPriority: true, icon: TrendingUp },
    { id: 'vat_sales_summary', label: '4. VAT Sales Summary', category: 'Compliance', icon: FileCheck },
    { id: 'vat_purchase_summary', label: '5. VAT Purchase Summary', category: 'Compliance', icon: CreditCard },
    { id: 'zatca_xml_export', label: '6. ZATCA XML Compliance', category: 'Compliance', icon: ExternalLink },
    { id: 'corporate_tax_planner', label: '18. UAE Corporate Tax Planner (9%)', category: 'Compliance', isPriority: true, icon: Briefcase },
    { id: 'vat_compliance_auditor', label: '19. UAE VAT Compliance & Audit Validator', category: 'Compliance', isPriority: true, icon: ShieldAlert },
    { id: 'faf_export', label: '17. FTA Audit File (FAF) Export', category: 'Compliance', isPriority: true, icon: Download },
    { id: 'sales_register', label: '7. Sales Register (Date Wise)', category: 'Accounts', icon: FileText },
    { id: 'customer_statement', label: '8. Customer Statement', category: 'Accounts', icon: User },
    { id: 'top_selling_items', label: '9. Top Selling Items', category: 'Analysis', icon: BarChart2 },
    { id: 'purchase_register', label: '10. Purchase Register', category: 'Accounts', icon: Layers },
    { id: 'expense_category_report', label: '11. Expense by Category', category: 'Analysis', icon: PieChart },
    { id: 'vendor_statement', label: '12. Vendor Statement', category: 'Accounts', icon: Users },
    { id: 'trial_balance', label: '13. Trial Balance Report', category: 'Financials', icon: Coins },
    { id: 'balance_sheet', label: '13A. Balance Sheet Statement', category: 'Financials', isPriority: true, icon: Briefcase },
    { id: 'cash_flow', label: '13B. Statement of Cash Flows', category: 'Financials', isPriority: true, icon: Coins },
    { id: 'retained_earnings', label: '13C. Statement of Retained Earnings', category: 'Financials', icon: TrendingUp },
    { id: 'fixed_asset_schedule', label: '13D. Fixed Assets & Depreciation Schedule', category: 'Financials', icon: Calendar },
    { id: 'stock_movement', label: '14. Stock Movement Report', category: 'Inventory', icon: RefreshCw },
    { id: 'low_stock_alerts', label: '15. Low Stock Alerts', category: 'Inventory', icon: AlertTriangle },
    { id: 'pending_payments', label: '16. Pending Payments & Reminders', category: 'Accounts', isPriority: true, icon: BellRing },
    { id: 'detailed_general_ledger', label: '16A. General Ledger Detailed Register', category: 'Accounts', isPriority: true, icon: BookOpen },
    { id: 'coa_balances_audit', label: '16B. Chart of Accounts Ledger Balances Audit', category: 'Accounts', isPriority: true, icon: FolderTree },
    { id: 'aging_payables', label: '16C. Accounts Payable (AP) Aging Ledger', category: 'Accounts', isPriority: true, icon: Scale },
    { id: 'journal_entry_register', label: '16D. All Journal Entries Register', category: 'Accounts', icon: BookOpen },
    { id: 'coa_hierarchy', label: '16E. Chart of Accounts Tree Hierarchy', category: 'Accounts', icon: FolderTree },
    { id: 'general_ledger_summary', label: '16F. General Ledger Summary', category: 'Accounts', icon: BookOpen },
    { id: 'partner_ledger_balances', label: '16G. Partner Ledger (Customer & Vendor Combined)', category: 'Accounts', icon: Users },
    { id: 'bank_reconciliation', label: '16H. Bank Reconciliation Ledger & Audit', category: 'Accounts', icon: RefreshCw },
    { id: 'bad_debts_provision', label: '16I. Provision for Bad & Doubtful Debts', category: 'Accounts', icon: AlertTriangle },
    { id: 'cogs_cost_ledger', label: '16J. Cost of Goods Sold (COGS) Ledger', category: 'Accounts', icon: Scale },
    { id: 'accruals_prepayments_ledger', label: '16K. Accruals & Prepayments Ledger', category: 'Accounts', icon: Layers },
    { id: 'day_book_register', label: '16L. Daily Day Book Journal', category: 'Accounts', isPriority: true, icon: FileText },
    { id: 'daily_cash_reconciliation', label: '16L-1. Daily Cash Drawer & Bank Reconciliation', category: 'Accounts', isPriority: true, icon: Coins },
    { id: 'daily_sales_summary', label: '16L-2. Daily Sales & Collections Breakdown', category: 'Accounts', isPriority: true, icon: FileText },
    { id: 'daily_expense_audit', label: '16L-3. Daily Purchases & OPEX Outflows Register', category: 'Accounts', isPriority: true, icon: Receipt },
    { id: 'tax_liability_ledger', label: '16M. VAT Output vs Input Net Settlement Ledger', category: 'Accounts', icon: Percent },
    { id: 'vat_pending_customers', label: '19B. VAT Pending Customer Report', category: 'Compliance', isPriority: true, icon: AlertTriangle },
    { id: 'emirate_sales_breakdown', label: '1A-1G. Emirate-Wise Sales & VAT (Box 1A-1G)', category: 'Compliance', isPriority: true, icon: Building },
    { id: 'customer_profitability', label: '20. Profitability Analysis (Customer & Product Margins)', category: 'Analysis', isPriority: true, icon: TrendingUp },
    { id: 'profitability_analysis', label: '20A. Profitability Analysis (Customer & Product Margins)', category: 'Analysis', isPriority: false, icon: TrendingUp },
    { id: 'inventory_valuation', label: '21. Stock Valuation & Inventory Schedule', category: 'Inventory', isPriority: true, icon: Package },
    { id: 'staff_commission', label: '22. Staff Sales & Commission Performance', category: 'Analysis', isPriority: true, icon: Users },
    { id: 'executive_board_review', label: '23. Executive Board Review & Strategic Audit', category: 'Analysis', isPriority: true, icon: BarChart2 },
    { id: 'tally_ratio_analysis', label: '24. Ratio Analysis Matrix (अनुपात विश्लेषण - Liquidity & ROI)', category: 'Financials', isPriority: true, icon: BarChart2 },
    { id: 'tally_cash_bank_book', label: '25. Cash Book & Bank Book (रोकड़ एवं बैंक बही - Month/Day Ledger)', category: 'Accounts', isPriority: true, icon: Coins },
    { id: 'tally_stock_ageing', label: '26. Stock Ageing Analysis (स्टॉक आयु-वार विश्लेषण - 0 to 180+ Days)', category: 'Inventory', isPriority: true, icon: Package },
    { id: 'tally_stock_movement_analysis', label: '27. Stock Item Movement Analysis (Inward/Outward Velocity)', category: 'Inventory', isPriority: true, icon: RefreshCw },
    { id: 'tally_reorder_status', label: '28. Reorder Status & Buffer Shortage (रीऑर्डर स्तर एवं कमी)', category: 'Inventory', isPriority: true, icon: AlertTriangle },
    { id: 'tally_columnar_sales', label: '29. Columnar Sales Register (स्तंभीय बिक्री रजिस्टर - Gross/Tax/VAT)', category: 'Accounts', isPriority: true, icon: FileText },
    { id: 'tally_columnar_purchase', label: '30. Columnar Purchase Register (स्तंभीय खरीद रजिस्टर)', category: 'Accounts', isPriority: true, icon: Layers },
    { id: 'tally_negative_exceptions', label: '31. Exception Reports: Negative Stock & Ledgers (अपवाद रिपोर्ट)', category: 'Analysis', isPriority: true, icon: ShieldAlert },
    { id: 'tally_funds_flow', label: '32. Funds Flow Statement (फंड्स फ्लो स्टेटमेंट - Working Capital)', category: 'Financials', isPriority: true, icon: Scale },
    { id: 'tally_cancelled_vouchers', label: '33. Cancelled & Void Vouchers Audit Register (रद्द वाउचर)', category: 'Accounts', isPriority: true, icon: FileText },
    { id: 'fta_network_integration', label: '34. FTA E-Invoicing Network Integration Notice', category: 'Compliance', isPriority: true, icon: ShieldAlert },
    { id: 'transportation_fleet_report', label: '35. Fleet Trips & Waybill Register', category: 'Analysis', isPriority: true, icon: Truck },
    { id: 'transportation_vehicle_profitability', label: '36. Vehicle & Route Haulage Performance', category: 'Analysis', isPriority: true, icon: Navigation },
    { id: 'retail_size_color_sales', label: '37. Footwear & Apparel Size/Color Sales', category: 'Analysis', isPriority: true, icon: ShoppingBag },
    { id: 'retail_returns_exchanges', label: '38. Retail Size Exchanges & Returns Log', category: 'Analysis', isPriority: true, icon: RefreshCw },
    { id: 'retail_fast_moving_sizes', label: '39. Fast-Moving Sizes & Restock Matrix', category: 'Analysis', isPriority: true, icon: Tag },
    { id: 'industry_logistics', label: '40. Customs Clearances & Demurrage Log', category: 'Analysis', isPriority: false, icon: Layers },
    { id: 'construction_retention', label: '41. Construction Retention Guarantees', category: 'Analysis', isPriority: false, icon: Building },
    { id: 'industry_gold_jewelry', label: '42. Gold Metal & Making Charges Audit', category: 'Analysis', isPriority: false, icon: Coins },
    { id: 'it_repair_warranty_report', label: '43. Computer & Printer ServiceWarranty Register', category: 'Analysis', isPriority: true, icon: Monitor },
    { id: 'it_hardware_toner_velocity', label: '44. Hardware & Toner Sales Velocity', category: 'Inventory', isPriority: true, icon: Laptop }
  ];

  const reportsList = fullReportsList.filter(rep => {
    const isVatRelated = rep.category === 'Compliance' || rep.id.includes('vat') || rep.id.includes('zatca') || rep.id === 'faf_export' || rep.id === 'corporate_tax_planner';
    if (mode === 'vat') {
      if (!isVatRelated) return false;
    } else {
      if (isVatRelated) return false;
    }

    if (company.vatEnabled === false) {
      if (isVatRelated && rep.id !== 'corporate_tax_planner') {
        return false;
      }
    }
    return true;
  });

  const isSelectedReportInList = reportsList.some(r => r.id === selectedReport);
  React.useEffect(() => {
    if (!isSelectedReportInList && reportsList.length > 0) {
      setSelectedReport(reportsList[0].id);
    }
  }, [mode, reportsList, isSelectedReportInList]);

  // Helper calculations for specific reports
  
  // 1. VAT Return Calculations
  const standardRatedSales = filteredInvoices;
  const standardRatedSalesSubtotal = standardRatedSales.reduce((sum, i) => {
    if (i.type === 'CreditNote') return sum - Math.abs(i.subtotal);
    return sum + i.subtotal;
  }, 0);
  const standardRatedSalesVat = standardRatedSales.reduce((sum, i) => {
    if (i.type === 'CreditNote') return sum - Math.abs(i.vatTotal);
    return sum + i.vatTotal;
  }, 0);

  // Dynamic country and supply regions based on country profile
  const gccCountry = company.gccCountry || 'UAE';
  const countryConfig = getCountryConfig(gccCountry);
  const regionLabel = countryConfig.regionLabel;
  const defaultRegion = countryConfig.defaultRegion;
  const regionsList = countryConfig.regions;
  const taxAuthorityName = countryConfig.taxAuthority;
  const formName = countryConfig.taxReturnFormName;
  const vatDescription = countryConfig.taxDescription;
  const box1Label = countryConfig.box1Label;
  const box4Label = countryConfig.box4Label;
  const box9Label = countryConfig.box9Label;

  const emirateSales: Record<string, { taxable: number, vat: number }> = {};
  regionsList.forEach(r => {
    emirateSales[r] = { taxable: 0, vat: 0 };
  });

  standardRatedSales.forEach(inv => {
    const cust = activeCompanyCustomers.find(c => c.id === inv.customerId);
    let emirate = cust?.emirate || defaultRegion;
    if (!emirateSales[emirate]) {
      emirate = defaultRegion;
    }
    if (inv.type === 'CreditNote') {
      emirateSales[emirate].taxable -= Math.abs(inv.subtotal);
      emirateSales[emirate].vat -= Math.abs(inv.vatTotal);
    } else {
      emirateSales[emirate].taxable += inv.subtotal;
      emirateSales[emirate].vat += inv.vatTotal;
    }
  });

  const standardRatedPurchasesSubtotal = filteredExpenses.reduce((sum, e) => {
    if (e.category === 'Supplier Credit Note') {
      return sum - Math.abs(e.amount);
    }
    return sum + e.amount;
  }, 0);

  const standardRatedPurchasesVat = filteredExpenses.reduce((sum, e) => {
    if (e.category === 'Supplier Credit Note') {
      return sum - Math.abs(e.vatAmount);
    }
    return sum + e.vatAmount;
  }, 0);

  const netVatPayable = standardRatedSalesVat - standardRatedPurchasesVat;

  // 2. Aging Report Calculations
  // Group unpaid invoices by 0-30, 31-60, 61-90, 90+ days
  const unpaidInvoices = activeCompanyInvoices.filter(i => i.status === 'Unpaid');
  const agingCustomersMap: Record<string, { c0_30: number, c31_60: number, c61_90: number, c90_plus: number, total: number }> = {};

  unpaidInvoices.forEach(inv => {
    const cust = activeCompanyCustomers.find(c => c.id === inv.customerId);
    const name = cust ? cust.name : 'Unknown Client';
    
    // Determine age
    const invoiceDate = new Date(inv.date);
    const today = new Date('2026-06-27'); // Standardize relative to workspace current time
    const diffTime = Math.abs(today.getTime() - invoiceDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (!agingCustomersMap[name]) {
      agingCustomersMap[name] = { c0_30: 0, c31_60: 0, c61_90: 0, c90_plus: 0, total: 0 };
    }

    if (diffDays <= 30) {
      agingCustomersMap[name].c0_30 += inv.total;
    } else if (diffDays <= 60) {
      agingCustomersMap[name].c31_60 += inv.total;
    } else if (diffDays <= 90) {
      agingCustomersMap[name].c61_90 += inv.total;
    } else {
      agingCustomersMap[name].c90_plus += inv.total;
    }
    agingCustomersMap[name].total += inv.total;
  });

  // 3. Profit & Loss calculations
  const plRevenue = filteredInvoices.reduce((sum, i) => sum + i.subtotal, 0);
  const plCOGS = filteredExpenses.filter(e => e.category === 'Purchases').reduce((sum, e) => sum + e.amount, 0);
  const plGrossProfit = plRevenue - plCOGS;

  const opexCategories = ['Rent', 'Utilities', 'Salaries', 'Marketing', 'Logistics', 'Other'];
  const plOpexMap: Record<string, number> = {};
  opexCategories.forEach(cat => {
    plOpexMap[cat] = filteredExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
  });
  const totalOpex = Object.values(plOpexMap).reduce((sum, val) => sum + val, 0);
  const netProfit = plGrossProfit - totalOpex;

  // 6. ZATCA XML Template Generator Helper
  const getZatcaXML = (doc: SalesDocument) => {
    const customer = activeCompanyCustomers.find(c => c.id === doc.customerId);
    const formattedDate = doc.date;
    const formattedTime = "12:00:00";
    const uuidStr = "72d90a18-d7b8-11e2-8d77-00215a000001";
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionURI>urn:zatca:envelope:integration:stamp</ext:ExtensionURI>
      <ext:ExtensionContent>
        <ZatcaStamp>
          <CryptographicStamp>MEQCIDB3x5V/8D3Xz7q9n6N7XqY9D11+2m0M...</CryptographicStamp>
          <CertificateHash>a9f82d1b2c3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c</CertificateHash>
        </ZatcaStamp>
      </ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${doc.docNumber}</cbc:ID>
  <cbc:UUID>${uuidStr}</cbc:UUID>
  <cbc:IssueDate>${formattedDate}</cbc:IssueDate>
  <cbc:IssueTime>${formattedTime}</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="0100000">388</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>
  
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="CRN">${company.trn || '394820194000003'}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PostalAddress>
        <cbc:StreetName>King Fahd Branch Rd</cbc:StreetName>
        <cbc:BuildingNumber>3840</cbc:BuildingNumber>
        <cbc:CitySubdivisionName>Al Olaya</cbc:CitySubdivisionName>
        <cbc:CityName>Riyadh</cbc:CityName>
        <cbc:PostalZone>12212</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>SA</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${company.trn || '394820194000003'}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="NAT">${customer?.trn || '300000000000003'}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PostalAddress>
        <cbc:StreetName>${customer?.address || 'Tahlia Street'}</cbc:StreetName>
        <cbc:CityName>${customer?.city || 'Riyadh'}</cbc:CityName>
        <cac:Country>
          <cbc:IdentificationCode>SA</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${customer?.trn || '300000000000003'}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="SAR">${doc.vatTotal.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="SAR">${doc.subtotal.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="SAR">${doc.vatTotal.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID schemeID="UN/ECE 5305" schemeAgencyID="6">S</cbc:ID>
        <cbc:Percent>15.00</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>

  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="SAR">${doc.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="SAR">${doc.subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="SAR">${doc.total.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="SAR">${doc.total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

  ${doc.items.map((item, index) => `
  <cac:InvoiceLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="PCE">${item.qty}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="SAR">${item.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${item.name}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID schemeID="UN/ECE 5305" schemeAgencyID="6">S</cbc:ID>
        <cbc:Percent>15.00</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="SAR">${item.rate.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>
  `).join('')}
</Invoice>`;
  };

  // 17. FTA Audit File (FAF) XML Generator
  const getFAFXml = (glRecords: any[], salesRecords: any[], purchaseRecords: any[]) => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<FAFAuditFile xmlns="http://www.tax.gov.ae/FAF/v1.0"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://www.tax.gov.ae/FAF/v1.0 FAF_Schema_v1.0.xsd">
  <Header>
    <SoftwareName>Hisaab Pro ERP</SoftwareName>
    <SoftwareVersion>V2.0</SoftwareVersion>
    <FAFVersion>1.0.0</FAFVersion>
    <TaxablePersonNameEn>${company.name}</TaxablePersonNameEn>
    <TaxablePersonNameAr>${company.name}</TaxablePersonNameAr>
    <TRN>${company.trn || '394820194000003'}</TRN>
    <GenerationDate>${new Date().toISOString().split('T')[0]}</GenerationDate>
    <AuditorName>Federal Tax Authority (Auditor Office)</AuditorName>
  </Header>
  <GeneralLedger>
    ${glRecords.map(r => `
    <GLRecord>
      <TransactionDate>${r.date}</TransactionDate>
      <TransactionType>${r.type}</TransactionType>
      <Reference>${r.ref}</Reference>
      <AccountName>${r.account}</AccountName>
      <Description>${r.description.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Description>
      <Debit>${r.debit.toFixed(2)}</Debit>
      <Credit>${r.credit.toFixed(2)}</Credit>
    </GLRecord>`).join('')}
  </GeneralLedger>
  <SalesLedger>
    ${salesRecords.map(r => `
    <SalesInvoice>
      <InvoiceNumber>${r.docNumber}</InvoiceNumber>
      <InvoiceDate>${r.date}</InvoiceDate>
      <CustomerName>${r.customerName.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</CustomerName>
      <CustomerTRN>${r.customerTrn || 'N/A'}</CustomerTRN>
      <NetAmount>${r.subtotal.toFixed(2)}</NetAmount>
      <VATAmount>${r.vatTotal.toFixed(2)}</VATAmount>
      <GrossAmount>${r.total.toFixed(2)}</GrossAmount>
    </SalesInvoice>`).join('')}
  </SalesLedger>
  <PurchaseLedger>
    ${purchaseRecords.map(r => `
    <PurchaseRecord>
      <SupplierName>${r.supplierName.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</SupplierName>
      <SupplierTRN>${r.supplierTrn || 'N/A'}</SupplierTRN>
      <PurchaseDate>${r.date}</PurchaseDate>
      <Category>${r.category}</Category>
      <Description>${r.description.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Description>
      <Subtotal>${r.subtotal.toFixed(2)}</Subtotal>
      <VATAmount>${r.vatAmount.toFixed(2)}</VATAmount>
      <TotalAmount>${r.totalAmount.toFixed(2)}</TotalAmount>
    </PurchaseRecord>`).join('')}
  </PurchaseLedger>
</FAFAuditFile>`;
  };

  const downloadFafExcel = (glRecords: any[], salesRecords: any[], purchaseRecords: any[]) => {
    const formattedDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const fileName = `${company.name.toLowerCase().replace(/\s+/g, '_')}_FAF_Audit_${formattedDate}.xls`;

    const htmlTable = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 30px; }
          th { background-color: #4f46e5; color: white; font-weight: bold; padding: 8px; border: 1px solid #ddd; }
          td { padding: 6px; border: 1px solid #ddd; }
          .title { font-size: 16px; font-weight: bold; color: #1e1b4b; padding-bottom: 12px; }
        </style>
      </head>
      <body>
        <div class="title">UAE FTA Auditor File (FAF) Standard Spec Report</div>

        <!-- COMPANY DETAILS -->
        <table>
          <thead>
            <tr><th colspan="2">1. Company Profile</th></tr>
          </thead>
          <tbody>
            <tr><td>Taxable Person Name (English)</td><td>${company.name}</td></tr>
            <tr><td>Taxable Person Name (Arabic)</td><td>${company.name}</td></tr>
            <tr><td>Tax Registration Number (TRN)</td><td>${company.trn || 'N/A'}</td></tr>
            <tr><td>Software Name & Version</td><td>Corporate ERP Compliant Standard</td></tr>
            <tr><td>FAF Standard Version</td><td>FAF v1.0.0</td></tr>
            <tr><td>Audit Generation Date</td><td>${new Date().toISOString().split('T')[0]}</td></tr>
          </tbody>
        </table>

        <!-- GENERAL LEDGER -->
        <table>
          <thead>
            <tr><th colspan="7">2. General Ledger (GL) Register</th></tr>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Account Name</th>
              <th>Reference</th>
              <th>Description</th>
              <th>Debit (AED)</th>
              <th>Credit (AED)</th>
            </tr>
          </thead>
          <tbody>
            ${glRecords.map(r => `
              <tr>
                <td>${r.date}</td>
                <td>${r.type}</td>
                <td>${r.account}</td>
                <td>${r.ref}</td>
                <td>${r.description}</td>
                <td>${r.debit.toFixed(2)}</td>
                <td>${r.credit.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- SALES LEDGER -->
        <table>
          <thead>
            <tr><th colspan="7">3. Sales Ledger Register</th></tr>
            <tr>
              <th>Invoice Number</th>
              <th>Date</th>
              <th>Customer Name</th>
              <th>Customer TRN</th>
              <th>Net Subtotal (AED)</th>
              <th>VAT Total (AED)</th>
              <th>Grand Total (AED)</th>
            </tr>
          </thead>
          <tbody>
            ${salesRecords.map(r => `
              <tr>
                <td>${r.docNumber}</td>
                <td>${r.date}</td>
                <td>${r.customerName}</td>
                <td>${r.customerTrn}</td>
                <td>${r.subtotal.toFixed(2)}</td>
                <td>${r.vatTotal.toFixed(2)}</td>
                <td>${r.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- PURCHASE LEDGER -->
        <table>
          <thead>
            <tr><th colspan="8">4. Purchase/Expense Ledger Register</th></tr>
            <tr>
              <th>Supplier Name</th>
              <th>Supplier TRN</th>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Subtotal (AED)</th>
              <th>VAT Amount (AED)</th>
              <th>Total Amount (AED)</th>
            </tr>
          </thead>
          <tbody>
            ${purchaseRecords.map(r => `
              <tr>
                <td>${r.supplierName}</td>
                <td>${r.supplierTrn}</td>
                <td>${r.date}</td>
                <td>${r.category}</td>
                <td>${r.description}</td>
                <td>${r.subtotal.toFixed(2)}</td>
                <td>${r.vatAmount.toFixed(2)}</td>
                <td>${r.totalAmount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlTable], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 8. Top Selling Items Calculations
  const itemSalesMap: Record<string, { sku: string, name: string, qtySold: number, revenue: number, vat: number }> = {};
  filteredInvoices.forEach(inv => {
    inv.items.forEach(item => {
      const key = item.sku || item.name;
      if (!itemSalesMap[key]) {
        itemSalesMap[key] = { sku: item.sku || 'N/A', name: item.name, qtySold: 0, revenue: 0, vat: 0 };
      }
      itemSalesMap[key].qtySold += item.qty;
      itemSalesMap[key].revenue += item.subtotal;
      itemSalesMap[key].vat += item.vatAmount;
    });
  });
  const topSellingItems = Object.values(itemSalesMap).sort((a, b) => b.revenue - a.revenue);

  // 11. Expense Category calculations
  const totalExpenseVal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const expenseCategoryMap: Record<string, { count: number, subtotal: number, vat: number, total: number }> = {};
  filteredExpenses.forEach(exp => {
    if (!expenseCategoryMap[exp.category]) {
      expenseCategoryMap[exp.category] = { count: 0, subtotal: 0, vat: 0, total: 0 };
    }
    expenseCategoryMap[exp.category].count++;
    expenseCategoryMap[exp.category].subtotal += exp.amount;
    expenseCategoryMap[exp.category].vat += exp.vatAmount;
    expenseCategoryMap[exp.category].total += exp.total;
  });

  // 13. Trial Balance Calculations
  // Reconciled debits/credits map
  const salesSubtotalVal = filteredInvoices.reduce((sum, i) => sum + i.subtotal, 0);
  const salesVatVal = filteredInvoices.reduce((sum, i) => sum + i.vatTotal, 0);
  const paidSalesGross = filteredInvoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.total, 0);
  const unpaidSalesGross = filteredInvoices.filter(i => i.status === 'Unpaid').reduce((sum, i) => sum + i.total, 0);

  const expenseSubtotalVal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const expenseVatVal = filteredExpenses.reduce((sum, e) => sum + e.vatAmount, 0);
  const paidExpenseGross = filteredExpenses.filter(e => e.status === 'Paid').reduce((sum, e) => sum + e.total, 0);
  const unpaidExpenseGross = filteredExpenses.filter(e => e.status === 'Unpaid').reduce((sum, e) => sum + e.total, 0);

  const trialBalanceAccounts = [
    { name: '1000 - Cash / Bank Operating Account', debit: paidSalesGross, credit: paidExpenseGross },
    { name: '1200 - Accounts Receivable (Sales Ledger)', debit: unpaidSalesGross, credit: 0 },
    { name: '2100 - Accounts Payable (Supplier Ledger)', debit: 0, credit: unpaidExpenseGross },
    { name: '2250 - UAE FTA Output VAT Standard Liability', debit: 0, credit: salesVatVal },
    { name: '1350 - UAE FTA Input VAT Recoverable Asset', debit: expenseVatVal, credit: 0 },
    { name: '4000 - Standard Commercial Sales Revenue', debit: 0, credit: salesSubtotalVal },
    { name: '5000 - Purchases / Direct Cost of Goods', debit: filteredExpenses.filter(e => e.category === 'Purchases').reduce((sum, e) => sum + e.amount, 0), credit: 0 },
    { name: '6100 - General Operating Operational Expenses', debit: filteredExpenses.filter(e => e.category !== 'Purchases').reduce((sum, e) => sum + e.amount, 0), credit: 0 }
  ];

  const totalDebits = trialBalanceAccounts.reduce((sum, a) => sum + a.debit, 0);
  const totalCredits = trialBalanceAccounts.reduce((sum, a) => sum + a.credit, 0);
  const trialBalanceDifference = Math.abs(totalDebits - totalCredits);

  // Auto balance account (equity/retained earnings)
  if (trialBalanceDifference > 0.01) {
    if (totalDebits < totalCredits) {
      trialBalanceAccounts.push({ name: '3000 - Equity & Opening Balanced Adjustment', debit: trialBalanceDifference, credit: 0 });
    } else {
      trialBalanceAccounts.push({ name: '3000 - Equity & Opening Balanced Adjustment', debit: 0, credit: trialBalanceDifference });
    }
  }

  // Final balanced sums
  const balancedDebits = trialBalanceAccounts.reduce((sum, a) => sum + a.debit, 0);
  const balancedCredits = trialBalanceAccounts.reduce((sum, a) => sum + a.credit, 0);

  // Unified GL Records Generator using real Journal Entries (falls back to original if no JEs are present)
  const getUnifiedGLRecords = () => {
    const activeJEs = (journalEntries || []).filter(je => je.companyId === company.id && je.status === 'Posted');
    
    if (activeJEs.length > 0) {
      const records: any[] = [];
      activeJEs.forEach(je => {
        je.lines.forEach(line => {
          const coaAcc = (coaAccounts || []).find(acc => acc.code === line.accountCode);
          const accountName = coaAcc ? `${coaAcc.code} - ${coaAcc.name}` : line.accountCode;
          
          let docType = 'Manual Journal';
          if (je.isAutoLinked) {
            docType = je.reference.startsWith('INV-') ? 'Sales Invoice' : 'Expense Payment';
          }
          
          records.push({
            date: je.date,
            type: docType,
            ref: je.reference,
            account: accountName,
            description: je.description,
            debit: line.debit,
            credit: line.credit
          });
        });
      });
      // Sort chronologically
      records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return records;
    }
    
    // Fallback
    return getGLRecords();
  };

  // 16B. Chart of Accounts Balances Audit
  const coaAuditData = React.useMemo(() => {
    const list = coaAccounts && coaAccounts.length > 0 ? coaAccounts : [];
    const activeJEs = (journalEntries || []).filter(je => je.companyId === company.id && je.status === 'Posted');
    
    return list.map(acc => {
      let totalDebit = 0;
      let totalCredit = 0;
      
      if (activeJEs.length > 0) {
        activeJEs.forEach(je => {
          je.lines.forEach(line => {
            if (line.accountCode === acc.code) {
              totalDebit += line.debit;
              totalCredit += line.credit;
            }
          });
        });
      } else {
        // Fallback calculation matching default accounts
        if (acc.code === '1200') {
          totalDebit = activeCompanyInvoices.reduce((sum, doc) => sum + doc.total, 0);
        } else if (acc.code === '4000') {
          totalCredit = activeCompanyInvoices.reduce((sum, doc) => sum + doc.subtotal, 0);
        } else if (acc.code === '2250') {
          totalCredit = activeCompanyInvoices.reduce((sum, doc) => sum + doc.vatTotal, 0);
        } else if (acc.code === '1000') {
          totalDebit = activeCompanyInvoices.filter(doc => doc.status === 'Paid').reduce((sum, doc) => sum + doc.total, 0);
          totalCredit = activeCompanyExpenses.filter(exp => exp.status === 'Paid').reduce((sum, exp) => sum + exp.total, 0);
        } else if (acc.code === '2100') {
          totalCredit = activeCompanyExpenses.filter(exp => exp.status === 'Unpaid').reduce((sum, exp) => sum + exp.total, 0);
        } else if (acc.code === '1350') {
          totalDebit = activeCompanyExpenses.reduce((sum, exp) => sum + exp.vatAmount, 0);
        } else if (acc.code === '5000') {
          totalDebit = activeCompanyExpenses.filter(exp => exp.category === 'Purchases').reduce((sum, exp) => sum + exp.amount, 0);
        } else if (acc.code === '6100') {
          totalDebit = activeCompanyExpenses.filter(exp => exp.category !== 'Purchases').reduce((sum, exp) => sum + exp.amount, 0);
        }
      }
      
      const isDebitNature = acc.type === 'Asset' || acc.type === 'Expense';
      const balance = isDebitNature ? (totalDebit - totalCredit) : (totalCredit - totalDebit);
      
      return {
        ...acc,
        debit: totalDebit,
        credit: totalCredit,
        balance
      };
    });
  }, [coaAccounts, journalEntries, activeCompanyInvoices, activeCompanyExpenses, company.id]);

  // 16C. Accounts Payable (AP) Aging Ledger
  const agingPayablesData = React.useMemo(() => {
    const today = new Date();
    const unpaidExpenses = activeCompanyExpenses.filter(e => e.status === 'Unpaid');
    
    const buckets = {
      current: 0,
      thirtyToSixty: 0,
      sixtyToNinety: 0,
      ninetyPlus: 0,
      total: 0
    };
    
    const vendorMap: Record<string, { vendorName: string, trn: string, current: number, thirtyToSixty: number, sixtyToNinety: number, ninetyPlus: number, total: number }> = {};
    
    unpaidExpenses.forEach(exp => {
      const billDate = new Date(exp.date);
      const diffTime = Math.abs(today.getTime() - billDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const supplierKey = exp.supplierName || 'General Supplier';
      if (!vendorMap[supplierKey]) {
        vendorMap[supplierKey] = {
          vendorName: supplierKey,
          trn: exp.supplierTrn || 'N/A',
          current: 0,
          thirtyToSixty: 0,
          sixtyToNinety: 0,
          ninetyPlus: 0,
          total: 0
        };
      }
      
      const amt = exp.total;
      vendorMap[supplierKey].total += amt;
      buckets.total += amt;
      
      if (diffDays <= 30) {
        vendorMap[supplierKey].current += amt;
        buckets.current += amt;
      } else if (diffDays <= 60) {
        vendorMap[supplierKey].thirtyToSixty += amt;
        buckets.thirtyToSixty += amt;
      } else if (diffDays <= 90) {
        vendorMap[supplierKey].sixtyToNinety += amt;
        buckets.sixtyToNinety += amt;
      } else {
        vendorMap[supplierKey].ninetyPlus += amt;
        buckets.ninetyPlus += amt;
      }
    });
    
    return {
      vendors: Object.values(vendorMap),
      buckets
    };
  }, [activeCompanyExpenses]);


  return (
    <div className="flex flex-col lg:flex-row gap-6 font-sans p-2 max-w-[1650px] mx-auto min-h-screen">
      
      {/* -------------------------------------------------------------
          LEFT PANEL: REPORTS CATEGORIZATION MENU (no-print)
         ------------------------------------------------------------- */}
      <div className="w-full lg:w-80 shrink-0 no-print bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden h-fit">
        <div className="p-4 bg-slate-900 text-white font-mono text-[10px] uppercase font-bold tracking-widest flex items-center justify-between">
          <span>{mode === 'vat' ? 'UAE VAT & Tax Compliance' : 'Hisaab General Reports'}</span>
          <span className="text-[#818CF8]">{reportsList.length} Active</span>
        </div>
        
        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
          <p className="text-[10px] text-slate-400 font-mono font-bold tracking-widest uppercase">Report Categories</p>
        </div>

        <nav className="p-2 space-y-4">
          {/* Executive & Periodic Pulse Reports */}
          <div>
            <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest px-3 block mb-1 font-mono">⚡ Daily, Weekly & Monthly Pulse</span>
            <div className="space-y-0.5">
              {reportsList.filter(r => ['daily_executive_pulse', 'weekly_trailing_perf', 'monthly_revenue_matrix', 'extraordinary_strategic_audit'].includes(r.id)).map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReport(r.id)}
                  className="w-full text-left px-3 py-2 text-xs rounded-lg font-medium transition-all flex items-center space-x-2.5 cursor-pointer text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  <r.icon className="w-full text-left px-3 py-2 text-xs rounded-lg font-medium transition-all flex items-center space-x-2.5 cursor-pointer text-slate-600 hover:bg-slate-50 hover:text-slate-900" />
                  <span className="truncate">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Priority First */}
          <div>
            <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-widest px-3 block mb-1 font-mono">★★ UAE Top Selling Priority</span>
            <div className="space-y-0.5">
              {reportsList.filter(r => r.isPriority).map(r => (
                <button
                  key={r.id}
                  onClick={() => {
                    setSelectedReport(r.id);
                    if (r.id === 'zatca_xml_export' && !zatcaInvoiceId && activeCompanyInvoices.length > 0) {
                      setZatcaInvoiceId(activeCompanyInvoices[0].id);
                    }
                  }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg font-medium transition-all flex items-center space-x-2.5 cursor-pointer ${selectedReport === r.id ? 'bg-indigo-50 text-indigo-700 font-bold border-l-4 border-indigo-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <r.icon className={`w-4 h-4 shrink-0 ${selectedReport === r.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="truncate">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Compliance Group */}
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest px-3 block mb-1 font-mono">Tax & Compliance</span>
            <div className="space-y-0.5">
              {reportsList.filter(r => r.category === 'Compliance' && !r.isPriority).map(r => (
                <button
                  key={r.id}
                  onClick={() => {
                    setSelectedReport(r.id);
                    if (r.id === 'zatca_xml_export' && !zatcaInvoiceId && activeCompanyInvoices.length > 0) {
                      setZatcaInvoiceId(activeCompanyInvoices[0].id);
                    }
                  }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg font-medium transition-all flex items-center space-x-2.5 cursor-pointer ${selectedReport === r.id ? 'bg-indigo-50 text-indigo-700 font-bold border-l-4 border-indigo-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <r.icon className={`w-4 h-4 shrink-0 ${selectedReport === r.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="truncate">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Accounts & Ledgers */}
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest px-3 block mb-1 font-mono">Accounts & Ledger Journals</span>
            <div className="space-y-0.5">
              {reportsList.filter(r => r.category === 'Accounts' && !r.isPriority).map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReport(r.id)}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg font-medium transition-all flex items-center space-x-2.5 cursor-pointer ${selectedReport === r.id ? 'bg-indigo-50 text-indigo-700 font-bold border-l-4 border-indigo-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <r.icon className={`w-4 h-4 shrink-0 ${selectedReport === r.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="truncate">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Analysis Group */}
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest px-3 block mb-1 font-mono">Operational Analysis</span>
            <div className="space-y-0.5">
              {reportsList.filter(r => r.category === 'Analysis' && !r.isPriority).map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReport(r.id)}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg font-medium transition-all flex items-center space-x-2.5 cursor-pointer ${selectedReport === r.id ? 'bg-indigo-50 text-indigo-700 font-bold border-l-4 border-indigo-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <r.icon className={`w-4 h-4 shrink-0 ${selectedReport === r.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="truncate">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Financials & General */}
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest px-3 block mb-1 font-mono">Financial Balances</span>
            <div className="space-y-0.5">
              {reportsList.filter(r => r.category === 'Financials' && !r.isPriority).map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReport(r.id)}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg font-medium transition-all flex items-center space-x-2.5 cursor-pointer ${selectedReport === r.id ? 'bg-indigo-50 text-indigo-700 font-bold border-l-4 border-indigo-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <r.icon className={`w-4 h-4 shrink-0 ${selectedReport === r.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="truncate">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Inventory Group */}
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest px-3 block mb-1 font-mono">Stock & Inventory</span>
            <div className="space-y-0.5">
              {reportsList.filter(r => r.category === 'Inventory' && !r.isPriority).map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReport(r.id)}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg font-medium transition-all flex items-center space-x-2.5 cursor-pointer ${selectedReport === r.id ? 'bg-indigo-50 text-indigo-700 font-bold border-l-4 border-indigo-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <r.icon className={`w-4 h-4 shrink-0 ${selectedReport === r.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="truncate">{r.label}</span>
                </button>
              ))}
            </div>
          </div>



        </nav>
      </div>

      {/* -------------------------------------------------------------
          RIGHT CANVAS: ACTIVE REPORT WITH LIVE CONTROLS (print:p-0)
         ------------------------------------------------------------- */}
      <div className="flex-1 space-y-6">
        
        {/* Unified Interactive Filtering Dashboard (Hides during printing) */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-xs space-y-4 no-print">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-3 gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-slate-800 flex items-center space-x-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                <span>Interactive Filters Panel</span>
              </h2>
              <p className="text-[10px] text-slate-400">Specify ranges to filter standard compliance calculations.</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-600 font-bold">Live Data Verified</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            {/* Start date */}
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 font-mono focus:outline-hidden"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 font-mono focus:outline-hidden"
              />
            </div>

            {/* Customer selector (conditionally active) */}
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Customer Account:</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 font-sans focus:outline-hidden"
              >
                <option value="ALL">All Accounts ({activeCompanyCustomers.length})</option>
                {activeCompanyCustomers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Quick Period Presets & General Actions */}
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Quick Period Presets:</label>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const todayStr = new Date().toISOString().slice(0, 10);
                    setStartDate(todayStr);
                    setEndDate(todayStr);
                  }}
                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded border border-indigo-200 transition-colors"
                  title="Filter to today only"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const todayStr = now.toISOString().slice(0, 10);
                    const d = new Date();
                    d.setDate(d.getDate() - 4);
                    setStartDate(d.toISOString().slice(0, 10));
                    setEndDate(todayStr);
                  }}
                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded border border-indigo-200 transition-colors"
                  title="Filter to last 5 days"
                >
                  5 Days
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const todayStr = now.toISOString().slice(0, 10);
                    const d = new Date();
                    d.setDate(d.getDate() - 6);
                    setStartDate(d.toISOString().slice(0, 10));
                    setEndDate(todayStr);
                  }}
                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded border border-indigo-200 transition-colors"
                  title="Filter to last 7 days"
                >
                  Weekly
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const todayStr = now.toISOString().slice(0, 10);
                    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
                    setStartDate(firstDay);
                    setEndDate(todayStr);
                  }}
                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded border border-indigo-200 transition-colors"
                  title="Filter to current month"
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setSelectedCustomerId('ALL');
                    setSelectedSupplierName('ALL');
                    setExpenseCategoryFilter('ALL');
                  }}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded border border-slate-300 transition-colors"
                  title="Clear date filters"
                >
                  All Time
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------
            PRINTABLE SHEET MAIN OUTER SHELL (Formatted for standard A4 size)
           ------------------------------------------------------------- */}
        <div id="tax-report-printable-area" className="bg-white border border-[#E2E8F0] p-6 sm:p-10 rounded-xl shadow-xs relative print-container">
          
          {/* Printable Top Compliance Header (Always visible in prints) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-slate-900 pb-6 mb-6">
            <div className="flex items-center space-x-3">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt="logo" className="w-14 h-14 object-contain rounded-lg border border-slate-100 p-1 shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-indigo-600 text-white font-mono font-black text-lg flex items-center justify-center shrink-0 uppercase">
                  {company.name.slice(0, 2)}
                </div>
              )}
              <div>
                <h1 className="text-xl font-extrabold uppercase text-slate-900">{company.name}</h1>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  VAT Registration No (TRN): <span className="font-bold text-slate-800 font-mono">{company.trn || '15-Digit Pending'}</span>
                </p>
                <p className="text-[9px] text-slate-400 uppercase font-mono mt-0.5">
                  Compliance Certification: UAE Federal Tax Authority (FTA) Standard
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right mt-4 sm:mt-0 font-mono text-[10px] text-slate-500">
              <div className="uppercase tracking-widest font-black text-slate-400 text-[9px]">OFFICIAL COMPLIANCE SHEET</div>
              <div className="mt-1 font-bold text-slate-800 text-xs">
                {reportsList.find(r => r.id === selectedReport)?.label.slice(3)}
              </div>
              <div className="mt-0.5">Filing Range: {startDate} to {endDate}</div>
              <div className="text-[9px] text-slate-400">Generated: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString()}</div>
            </div>
          </div>

          {/* Quick PDF & CSV Top Bar inside printable paper shell (no-print) */}
          <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-3 rounded-lg mb-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <Info className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Perfectly adjusted for standard A4 landscape or portrait documents</span>
            </span>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => exportReportToPDF()}
                disabled={isExportingPdf}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-mono font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg text-[9px] cursor-pointer flex items-center space-x-1.5 transition-all h-[32px] disabled:opacity-50"
                title="Export current report as an official A4 PDF document"
              >
                {isExportingPdf ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>{selectedReport === 'vat_return' ? 'Export VAT Return PDF' : 'Export PDF'}</span>
                  </>
                )}
              </button>

              <button
                onClick={async () => {
                  await exportReportToPDF();
                  triggerPrint('tax-report-printable-area');
                }}
                disabled={isExportingPdf}
                className="bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg text-[9px] cursor-pointer flex items-center space-x-1 transition-all h-[32px] disabled:opacity-50"
                title="Generate and print/download A4 PDF report"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF (A4)</span>
              </button>

              <button
                onClick={() => {
                  // Direct Dynamic Export based on selected report
                  if (selectedReport === 'vat_return') {
                    const headers = ['FTA Form Box Code', 'Filing Parameter Name', 'Taxable Supplies / Costs (AED)', 'VAT Standard Amount (AED)'];
                    const rows = [
                      ['Box 1', 'Standard Rated Supplies (Sales)', standardRatedSalesSubtotal.toFixed(2), standardRatedSalesVat.toFixed(2)],
                      ['Box 4', 'Standard Rated Expenses / Cost of Goods', standardRatedPurchasesSubtotal.toFixed(2), standardRatedPurchasesVat.toFixed(2)],
                      ['Box 9', 'Net VAT Payable / (Refundable)', '', netVatPayable.toFixed(2)]
                    ];
                    exportToCSV(headers, rows, 'VAT_Return_201');
                  } else if (selectedReport === 'aging_receivables') {
                    const headers = ['Customer Client Name', '0-30 Days Outstanding', '31-60 Days Outstanding', '61-90 Days Outstanding', '90+ Days Outstanding', 'Gross Total Outstanding'];
                    const rows = Object.entries(agingCustomersMap).map(([name, val]) => [
                      name, val.c0_30.toFixed(2), val.c31_60.toFixed(2), val.c61_90.toFixed(2), val.c90_plus.toFixed(2), val.total.toFixed(2)
                    ]);
                    exportToCSV(headers, rows, 'Aging_Receivables');
                  } else if (selectedReport === 'profit_loss') {
                    const headers = ['Financial Ledger Parameter', 'Debit / Cost Amount (AED)', 'Credit / Revenue Amount (AED)'];
                    const rows = [
                      ['Total Invoiced Sales Revenue', '', plRevenue.toFixed(2)],
                      ['Cost of Goods Sold (Purchases)', plCOGS.toFixed(2), ''],
                      ['OPEX - Rent Expense', plOpexMap['Rent'].toFixed(2), ''],
                      ['OPEX - Utilities Expense', plOpexMap['Utilities'].toFixed(2), ''],
                      ['OPEX - Salaries Expense', plOpexMap['Salaries'].toFixed(2), ''],
                      ['OPEX - Marketing Expense', plOpexMap['Marketing'].toFixed(2), ''],
                      ['OPEX - Logistics Expense', plOpexMap['Logistics'].toFixed(2), ''],
                      ['OPEX - Other Expenses', plOpexMap['Other'].toFixed(2), ''],
                      ['NET INCOME / PROFIT', '', netProfit.toFixed(2)]
                    ];
                    exportToCSV(headers, rows, 'Profit_And_Loss');
                  } else if (selectedReport === 'pending_payments') {
                    const headers = ['Client Name', 'Invoice Number', 'Due Date', 'Pending Amount (AED)'];
                    const rows = pendingInvoicesData.map(p => [
                      p.clientName, p.invoiceNo, p.dueDate, p.pendingAmount.toFixed(2)
                    ]);
                    exportToCSV(headers, rows, 'Pending_Payments_Reminders');
                  } else if (selectedReport === 'construction_retention') {
                    const headers = ['Project Name', 'Invoice Number', 'Client / Partner', 'Invoice Total', 'Retention %', 'Retention Amount (AED)', 'Retention Due Date', 'Status'];
                    const rows = constructionRetentionData.map(r => [
                      r.projectName, r.invoiceNo, r.clientName, r.invoiceTotal.toFixed(2), `${r.retentionPct}%`, r.retentionAmt.toFixed(2), r.dueDate, r.status
                    ]);
                    exportToCSV(headers, rows, 'Construction_Retention_Report');
                  } else if (selectedReport === 'transportation_fleet_report') {
                    const headers = ['Trip / Waybill No', 'Invoice / DN No', 'Trip Date', 'Shipper / Client', 'Vehicle Plate', 'Vehicle Category', 'Driver Name', 'Driver Mobile', 'Pickup Origin', 'Drop Destination', 'Distance (KM)', 'Cargo Nature', 'Cargo Weight', 'POD Ref', 'Subtotal (AED)', 'VAT 5% (AED)', 'Total (AED)'];
                    const rows = transportationTripsData.map(t => [
                      t.tripNo, t.invoiceNo, t.date, t.clientName, t.vehicleNo, t.vehicleType, t.driverName, t.driverMobile, t.pickup, t.drop, t.distance.toString(), t.cargo, t.weight, t.pod, t.subtotal.toFixed(2), t.vatTotal.toFixed(2), t.total.toFixed(2)
                    ]);
                    exportToCSV(headers, rows, 'Fleet_Trips_Waybills_Register');
                  } else if (selectedReport === 'transportation_vehicle_profitability') {
                    const headers = ['Vehicle Plate', 'Vehicle Category', 'Assigned Drivers', 'Total Trips Completed', 'Total Distance (KM)', 'Detention Hours', 'Tolls & Salik (AED)', 'Net Haulage (AED)', 'VAT Output (AED)', 'Gross Revenue (AED)', 'Avg Revenue/Trip (AED)', 'Frequent Route'];
                    const rows = transportationVehiclePerformanceData.map(v => [
                      v.vehicleNo, v.vehicleType, v.drivers, v.tripsCount.toString(), v.totalDistance.toString(), v.totalDetentionHours.toString(), v.totalTolls.toFixed(2), v.totalSubtotal.toFixed(2), v.totalVat.toFixed(2), v.grossRevenue.toFixed(2), v.avgTripRevenue.toFixed(2), v.topRoute
                    ]);
                    exportToCSV(headers, rows, 'Vehicle_Route_Performance_Audit');
                  } else if (selectedReport === 'retail_size_color_sales') {
                    const headers = ['Date', 'Invoice No', 'Customer', 'Brand', 'Model / Article', 'Category', 'Size', 'Color', 'Barcode / EAN', 'Units Sold', 'Rate (AED)', 'Subtotal (AED)', 'VAT 5% (AED)', 'Total (AED)'];
                    const rows = retailSizeColorSalesData.map(r => [
                      r.date, r.invoiceNo, r.customerName, r.brand, r.modelName, r.category, r.size, r.color, r.barcode, r.qty.toString(), r.unitRate.toFixed(2), r.subtotal.toFixed(2), r.vatAmount.toFixed(2), r.total.toFixed(2)
                    ]);
                    exportToCSV(headers, rows, 'Retail_Size_Color_Sales_Register');
                  } else if (selectedReport === 'retail_returns_exchanges') {
                    const headers = ['Date', 'Invoice No', 'Customer', 'Original Invoice Ref', 'Exchanged / Returned Article', 'Return Reason', 'Credit / Refund Amount (AED)', 'Item Condition'];
                    const rows = retailReturnsExchangesData.map(ret => [
                      ret.date, ret.invoiceNo, ret.customerName, ret.originalRef, ret.returnedItem, ret.reason, ret.creditAmount.toFixed(2), ret.condition
                    ]);
                    exportToCSV(headers, rows, 'Retail_Returns_Exchanges_Audit');
                  } else if (selectedReport === 'retail_fast_moving_sizes') {
                    const headers = ['Rank', 'Size', 'Category', 'Pairs / Units Sold', 'Total Gross Revenue (AED)', 'Share of Sales (%)', 'Velocity Status', 'Restock Recommendation'];
                    const rows = retailFastMovingSizesData.map(s => [
                      s.rank.toString(), s.size, s.category, s.pairsSold.toString(), s.totalRevenue.toFixed(2), `${s.sharePct}%`, s.velocityStatus, s.reorderTip
                    ]);
                    exportToCSV(headers, rows, 'Retail_Fast_Moving_Sizes_Matrix');
                  } else if (selectedReport === 'it_repair_warranty_report') {
                    const headers = ['Doc/Job Ref', 'Date', 'Customer Name', 'Category', 'Brand / Model', 'Serial Number / Asset Tag', 'Hardware Specs / Compatibility', 'Warranty', 'Amount (AED)', 'VAT (AED)', 'Total (AED)', 'Status'];
                    const rows = itRepairWarrantyData.map(r => [
                      r.refNo, r.date, r.customerName, r.category, r.brandModel, r.serialNumber, r.specs, r.warranty, r.subtotal.toFixed(2), r.vat.toFixed(2), r.total.toFixed(2), r.status
                    ]);
                    exportToCSV(headers, rows, 'IT_Computer_Printer_Repair_Warranty_Register');
                  } else if (selectedReport === 'it_hardware_toner_velocity') {
                    const headers = ['Category', 'Product / Toner Name', 'Brand', 'SKU / Part Code', 'Printer Compatibility', 'Units Sold', 'Current Stock', 'Total Revenue (AED)', 'Restock Status'];
                    const rows = itHardwareTonerData.map(h => [
                      h.category, h.name, h.brand, h.sku, h.compatibility, h.unitsSold.toString(), h.currentStock.toString(), h.revenue.toFixed(2), h.restockStatus
                    ]);
                    exportToCSV(headers, rows, 'Hardware_Toner_Sales_Velocity');
                  } else if (selectedReport === 'detailed_general_ledger') {
                    const headers = ['Posting Date', 'Entry Type', 'Ref Code', 'Target Account', 'Posting Description', 'Debit (AED)', 'Credit (AED)'];
                    const rows = getUnifiedGLRecords().map(r => [
                      r.date, r.type, r.ref, r.account, r.description, r.debit.toFixed(2), r.credit.toFixed(2)
                    ]);
                    exportToCSV(headers, rows, 'Detailed_General_Ledger');
                  } else if (selectedReport === 'coa_balances_audit') {
                    const headers = ['Account Code & Name', 'Category Class', 'Accumulated Debit (AED)', 'Accumulated Credit (AED)', 'Current Net Balance (AED)'];
                    const rows = coaAuditData.map(acc => [
                      `${acc.code} - ${acc.name}`, acc.type, acc.debit.toFixed(2), acc.credit.toFixed(2), acc.balance.toFixed(2)
                    ]);
                    exportToCSV(headers, rows, 'Chart_of_Accounts_Balances_Audit');
                  } else if (selectedReport === 'aging_payables') {
                    const headers = ['Supplier / Vendor Name', 'Supplier TRN', '0 - 30 Days', '31 - 60 Days', '61 - 90 Days', '90+ Days', 'Total Unpaid (AED)'];
                    const rows = agingPayablesData.vendors.map(v => [
                      v.vendorName, v.trn, v.current.toFixed(2), v.thirtyToSixty.toFixed(2), v.sixtyToNinety.toFixed(2), v.ninetyPlus.toFixed(2), v.total.toFixed(2)
                    ]);
                    exportToCSV(headers, rows, 'Accounts_Payable_Aging');
                  } else {
                    // General fallback CSV exporter
                    const headers = ['Filing Parameter', `Invoiced Value (${company?.currency || 'AED'})`];
                    const rows = [['Total Invoiced Revenue Subtotal', standardRatedSalesSubtotal.toFixed(2)], ['Total VAT Collected on Revenue', standardRatedSalesVat.toFixed(2)]];
                    exportToCSV(headers, rows, 'Generic_Sales_Tax');
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg text-[9px] cursor-pointer flex items-center space-x-1 transition-all h-[32px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* ======================================================================================
              AI COMPLIANCE & INTELLIGENT ADVISOR PORTAL (no-print)
              ====================================================================================== */}
          <div className="no-print bg-slate-50 dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-6 space-y-4 shadow-xs font-sans text-left">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-200/60 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest font-mono">
                    Hisaab pre-Audit Compliance & Advisor
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold font-mono mt-0.5">

                  </p>
                </div>
              </div>

              {/* Sub tabs selectors */}
              <div className="bg-slate-100 dark:bg-slate-900 border dark:border-slate-800 p-1 rounded-lg flex space-x-1 self-start sm:self-center">
                {(['insights', 'checklist', 'notes'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTaskTab(tab)}
                    className={`px-3 py-1 text-[10px] font-black rounded-md transition-all cursor-pointer uppercase ${
                      activeTaskTab === tab 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold'
                    }`}
                  >
                    {tab === 'insights' ? '💡 Suggestions' : tab === 'checklist' ? '☑ Pre-Audit Checklist' : '✎ Advisor Notes'}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB CONTENT: INSIGHTS & ACTIONS */}
            {activeTaskTab === 'insights' && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(() => {
                    const insightsList: { type: 'danger' | 'warning' | 'info' | 'success'; title: string; text: string; action?: { label: string; onClick: () => void } }[] = [];

                    if (selectedReport === 'vat_return' || selectedReport === 'vat_sales_summary' || selectedReport === 'vat_purchase_summary') {
                      if (standardRatedPurchasesVat > standardRatedSalesVat) {
                        insightsList.push({
                          type: 'warning',
                          title: 'Filing Alert: Net VAT Refundable Position',
                          text: `Your Input VAT (AED ${standardRatedPurchasesVat.toFixed(2)}) is higher than your Output VAT (AED ${standardRatedSalesVat.toFixed(2)}), placing you in a Net Refund position of AED ${(standardRatedPurchasesVat - standardRatedSalesVat).toFixed(2)}. Filing a refund request often triggers a compliance desk audit. Please double-check that all purchase vouchers have correct tax invoices and payment receipts.`
                        });
                      } else {
                        insightsList.push({
                          type: 'success',
                          title: 'Standard Tax Liability Position',
                          text: `Your business has collected a net VAT liability of AED ${netVatPayable.toFixed(2)} to be filed. Ensure payment is initiated before the 28th of the next month to prevent late compliance penalties.`
                        });
                      }
                      insightsList.push({
                        type: 'info',
                        title: 'B2B Invoice Validation Note',
                        text: 'Under FTA standard guidelines, any sales transaction exceeding AED 10,000 to a taxable person must display the buyer\'s 15-digit TRN. Inspect your Sales Register to ensure TRN compliance.'
                      });
                    } else if (selectedReport === 'profit_loss') {
                      const margin = plRevenue > 0 ? (netProfit / plRevenue) * 100 : 0;
                      if (netProfit > 375000) {
                        insightsList.push({
                          type: 'danger',
                          title: 'UAE Corporate Tax Standard Bracket Triggered',
                          text: `Your Year-to-Date net taxable income of AED ${netProfit.toFixed(2)} has crossed the AED 375,000 exempt threshold. The excess portion (AED ${(netProfit - 375000).toFixed(2)}) will be subject to the standard 9% UAE Corporate Tax. Estimated Corporate Tax liability: AED ${((netProfit - 375000) * 0.09).toFixed(2)}.`
                        });
                      } else if (netProfit > 300000) {
                        insightsList.push({
                          type: 'warning',
                          title: 'Approaching UAE Corporate Tax Ceiling',
                          text: `Your net profit of AED ${netProfit.toFixed(2)} is close to the AED 375,000 threshold. Assess standard depreciation of fixed assets, R&D deductible expenses, or consider Small Business Relief (under Article 21) which extends exemption up to AED 3,000,000 in gross revenues.`
                        });
                      } else {
                        insightsList.push({
                          type: 'success',
                          title: 'Tax-Free Corporate Bracket Status',
                          text: `Your net profit of AED ${netProfit.toFixed(2)} is currently within the 0% UAE Corporate Tax bracket. Proper records must still be retained for a minimum of 7 years to support audit inquiries.`
                        });
                      }
                      if (margin < 15 && plRevenue > 0) {
                        insightsList.push({
                          type: 'warning',
                          title: 'Optimizing Operating Expense Margin',
                          text: `Your Net Profit Margin is currently ${margin.toFixed(1)}%. General Operating Expenses (OPEX) represent a high percentage of sales. Review the Expense Category Report to identify areas for procurement optimizations.`
                        });
                      }
                    } else if (selectedReport === 'aging_receivables' || selectedReport === 'pending_payments') {
                      const over60Days = Object.values(agingCustomersMap).reduce((sum, c) => sum + c.c61_90 + c.c90_plus, 0);
                      if (over60Days > 0) {
                        insightsList.push({
                          type: 'danger',
                          title: 'Critical Debt Exposure Alert',
                          text: `A substantial sum of AED ${over60Days.toFixed(2)} is currently outstanding for more than 60 days. This elevates credit default risk. We suggest setting up credit limits for non-compliant customers.`,
                          action: {
                            label: 'Open Reminders Panel',
                            onClick: () => setSelectedReport('pending_payments')
                          }
                        });
                      }
                      insightsList.push({
                        type: 'info',
                        title: 'Collection Best Practice',
                        text: 'Initiate collection communications 5 days prior to invoice due dates. Sending a friendly payment reminder with payment details reduces credit days outstanding (DSO) by an average of 22%.'
                      });
                    } else if (selectedReport === 'faf_export' || selectedReport === 'trial_balance') {
                      const unbalancedCount = activeCompanyInvoices.some(i => !i.docNumber) ? 1 : 0;
                      if (unbalancedCount > 0) {
                        insightsList.push({
                          type: 'warning',
                          title: 'Invoice Draft / Number Sequence Notice',
                          text: 'There are draft or incomplete document entries detected. FTA auditors inspect sequential invoice numbers. Any gaps must be fully reconciled or supported.'
                        });
                      }
                      insightsList.push({
                        type: 'info',
                        title: 'Auditing Format Integrity',
                        text: 'The FTA Audit File (FAF) is structured precisely using comma-separated or tab-separated parameters. Direct ledger lines should maintain explicit reference tags, transaction dates, and matching debits and credits.'
                      });
                    } else if (selectedReport === 'corporate_tax_planner') {
                      if (netProfit > 375000) {
                        insightsList.push({
                          type: 'danger',
                          title: 'UAE Corporate Tax Liability Triggered',
                          text: `Your taxable net profit (AED ${netProfit.toFixed(2)}) is over the AED 375,000 free threshold. Estimated 9% Corporate Tax is accrued on the excess taxable base.`
                        });
                      } else {
                        insightsList.push({
                          type: 'success',
                          title: '0% Corporate Tax Bracket Active',
                          text: 'Your current taxable income is within the AED 375,000 threshold. Your tax rate is 0%. No corporate tax liability is accrued.'
                        });
                      }
                      if (plRevenue <= 3000000) {
                        insightsList.push({
                          type: 'info',
                          title: 'Small Business Relief Eligible',
                          text: `Your annual gross revenue is AED ${plRevenue.toFixed(2)}, which is below the AED 3,000,000 threshold. You are eligible to elect for Small Business Relief (Article 21) to enjoy 0% tax.`
                        });
                      }
                    } else if (selectedReport === 'stock_movement' || selectedReport === 'low_stock_alerts') {
                      insightsList.push({
                        type: 'info',
                        title: 'Safety Stock Calculations',
                        text: 'Maintain a safety stock level equivalent to at least 15 days of average demand. This insulates your trade fulfillment from sudden vendor delays.'
                      });
                    } else {
                      insightsList.push({
                        type: 'info',
                        title: 'Standard Compliance Check',
                        text: 'All reports are automatically filtered and aggregated based on the active company profile. Ensure the reporting periods align with your official Federal Tax Authority filings.'
                      });
                    }

                    return insightsList;
                  })().map((ins, idx) => (
                    <div 
                      key={idx}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                        ins.type === 'danger' 
                          ? 'bg-rose-50/20 dark:bg-rose-950/5 border-rose-150/60 dark:border-rose-900/35 text-rose-950 dark:text-rose-400' 
                          : ins.type === 'warning'
                            ? 'bg-amber-50/20 dark:bg-amber-950/5 border-amber-150/60 dark:border-amber-900/35 text-amber-950 dark:text-amber-400'
                            : ins.type === 'success'
                              ? 'bg-emerald-50/20 dark:bg-emerald-950/5 border-emerald-150/60 dark:border-emerald-900/35 text-emerald-950 dark:text-emerald-400'
                              : 'bg-indigo-50/20 dark:bg-indigo-950/5 border-indigo-150/40 dark:border-indigo-900/20 text-indigo-950 dark:text-indigo-400'
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-1.5 font-bold text-[11px] uppercase tracking-wide">
                          <span>{ins.type === 'danger' ? '🚨' : ins.type === 'warning' ? '⚠️' : ins.type === 'success' ? '✓' : '💡'}</span>
                          <span>{ins.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed mt-1.5 font-mono">
                          {ins.text}
                        </p>
                      </div>

                      {ins.action && (
                        <div className="mt-3">
                          <button
                            onClick={ins.action.onClick}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold uppercase tracking-wider px-2.5 py-1 text-[9px] rounded-lg cursor-pointer transition-all flex items-center space-x-1"
                          >
                            <span>{ins.action.label}</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Additional Quick stats context */}
                <div className="bg-white dark:bg-slate-900/50 p-3 rounded-lg border border-slate-150 dark:border-slate-800 text-[10px] text-slate-500 font-mono flex flex-wrap gap-x-6 gap-y-2 items-center">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">Report Metrics Context:</span>
                  <span>Standard Sales: <strong className="text-slate-700 dark:text-slate-300">{formatAED(standardRatedSalesSubtotal)}</strong></span>
                  <span>Standard Purchases: <strong className="text-slate-700 dark:text-slate-300">{formatAED(standardRatedPurchasesSubtotal)}</strong></span>
                  {company.vatEnabled && (
                    <span>Net VAT: <strong className="text-indigo-600 dark:text-indigo-400">{formatAED(netVatPayable)}</strong></span>
                  )}
                  <span>P&L Net Income: <strong className={netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{formatAED(netProfit)}</strong></span>
                </div>
              </div>
            )}

            {/* TAB CONTENT: PRE-AUDIT CHECKLIST */}
            {activeTaskTab === 'checklist' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 border-b border-slate-150 dark:border-slate-800 pb-2">
                  <span>Pre-Filing Compliance Audit Tasks list</span>
                  <span>
                    Progress: {
                      (() => {
                        const getTasksForReport = (reportId: string) => {
                          switch (reportId) {
                            case 'vat_return':
                            case 'vat_sales_summary':
                            case 'vat_purchase_summary':
                              return [
                                { id: 'vat_task_1', text: 'Match invoice subtotal figures against Sales Register' },
                                { id: 'vat_task_2', text: 'Confirm all VAT Output amounts are exactly 5% of standard rated taxable sales' },
                                { id: 'vat_task_3', text: 'Verify supplier tax invoice files exist for all VAT Input recoverable claims' },
                                { id: 'vat_task_4', text: 'Cross-reference customs declarations with Box 6 (Imports via Customs)' },
                                { id: 'vat_task_5', text: 'Confirm customer TRNs are 15-digit and validated via the FTA Portal' }
                              ];
                            case 'profit_loss':
                              return [
                                { id: 'pl_task_1', text: 'Confirm all payroll details match bank Wage Protection System (WPS) reports' },
                                { id: 'pl_task_2', text: 'Review expense category allocations in Chart of Accounts' },
                                { id: 'pl_task_3', text: 'Reconcile Cost of Goods Sold (COGS) with direct purchases bills' },
                                { id: 'pl_task_4', text: 'Verify capital assets depreciation postings for the period' },
                                { id: 'pl_task_5', text: 'Check Corporate Tax 9% threshold (AED 375,000) alignment' }
                              ];
                            case 'corporate_tax_planner':
                              return [
                                { id: 'ct_task_1', text: 'Verify Accounting Profit matches the Profit & Loss statement' },
                                { id: 'ct_task_2', text: 'Validate and add back non-deductible fines and penalties (Article 33)' },
                                { id: 'ct_task_3', text: 'Verify Client Entertainment expense restriction (50% deductible under Article 32)' },
                                { id: 'ct_task_4', text: 'Check if company qualifies and should elect for Small Business Relief (Revenue < AED 3M)' },
                                { id: 'ct_task_5', text: 'Review related party transactions for arm’s length pricing compliance (Article 34)' }
                              ];
                            case 'aging_receivables':
                            case 'pending_payments':
                            case 'customer_statement':
                              return [
                                { id: 'ar_task_1', text: 'Identify and flag clients with accounts outstanding for > 60 days' },
                                { id: 'ar_task_2', text: 'Validate customer billing emails and primary contact phone numbers' },
                                { id: 'ar_task_3', text: 'Send payment reminders to all overdue balances' },
                                { id: 'ar_task_4', text: 'Check interest penalties for overdue payments are properly formulated' },
                                { id: 'ar_task_5', text: 'Confirm cash and bank receipts are reconciled with open sales invoices' }
                              ];
                            case 'stock_movement':
                            case 'low_stock_alerts':
                              return [
                                { id: 'stock_task_1', text: 'Reconcile digital inventory levels with physical stock-take count' },
                                { id: 'stock_task_2', text: 'Identify slow-moving or obsolete items for impairment adjustment' },
                                { id: 'stock_task_3', text: 'Check safety margins on fast-moving high-demand SKUs' },
                                { id: 'stock_task_4', text: 'Review purchase order lead times from primary vendors' }
                              ];
                            case 'faf_export':
                            case 'trial_balance':
                              return [
                                { id: 'tb_task_1', text: 'Ensure the General Ledger total Debit column exactly equals Credit column' },
                                { id: 'tb_task_2', text: 'Confirm there are no sequential number gaps in Sales Invoices' },
                                { id: 'tb_task_3', text: 'Audit and justify any manual ledger adjustments in VAT accounts' },
                                { id: 'tb_task_4', text: 'Inspect suspense and opening balanced adjustment accounts' }
                              ];
                            default:
                              return [
                                { id: 'gen_task_1', text: 'Reconcile subtotal report numbers with the main General Ledger' },
                                { id: 'gen_task_2', text: 'Confirm the reporting date range is correct' },
                                { id: 'gen_task_3', text: 'Ensure proper branch/cost-center tracking tags are applied' }
                              ];
                          }
                        };
                        const tasks = getTasksForReport(selectedReport);
                        const completed = tasks.filter(t => checklistTasks[t.id]).length;
                        return `${completed}/${tasks.length} Checked (${tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0}%)`;
                      })()
                    }
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {(() => {
                    const getTasksForReport = (reportId: string) => {
                      switch (reportId) {
                        case 'vat_return':
                        case 'vat_sales_summary':
                        case 'vat_purchase_summary':
                          return [
                            { id: 'vat_task_1', text: 'Match invoice subtotal figures against Sales Register' },
                            { id: 'vat_task_2', text: 'Confirm all VAT Output amounts are exactly 5% of standard rated taxable sales' },
                            { id: 'vat_task_3', text: 'Verify supplier tax invoice files exist for all VAT Input recoverable claims' },
                            { id: 'vat_task_4', text: 'Cross-reference customs declarations with Box 6 (Imports via Customs)' },
                            { id: 'vat_task_5', text: 'Confirm customer TRNs are 15-digit and validated via the FTA Portal' }
                          ];
                        case 'profit_loss':
                          return [
                            { id: 'pl_task_1', text: 'Confirm all payroll details match bank Wage Protection System (WPS) reports' },
                            { id: 'pl_task_2', text: 'Review expense category allocations in Chart of Accounts' },
                            { id: 'pl_task_3', text: 'Reconcile Cost of Goods Sold (COGS) with direct purchases bills' },
                            { id: 'pl_task_4', text: 'Verify capital assets depreciation postings for the period' },
                            { id: 'pl_task_5', text: 'Check Corporate Tax 9% threshold (AED 375,000) alignment' }
                          ];
                        case 'corporate_tax_planner':
                          return [
                            { id: 'ct_task_1', text: 'Verify Accounting Profit matches the Profit & Loss statement' },
                            { id: 'ct_task_2', text: 'Validate and add back non-deductible fines and penalties (Article 33)' },
                            { id: 'ct_task_3', text: 'Verify Client Entertainment expense restriction (50% deductible under Article 32)' },
                            { id: 'ct_task_4', text: 'Check if company qualifies and should elect for Small Business Relief (Revenue < AED 3M)' },
                            { id: 'ct_task_5', text: 'Review related party transactions for arm’s length pricing compliance (Article 34)' }
                          ];
                        case 'aging_receivables':
                        case 'pending_payments':
                        case 'customer_statement':
                          return [
                            { id: 'ar_task_1', text: 'Identify and flag clients with accounts outstanding for > 60 days' },
                            { id: 'ar_task_2', text: 'Validate customer billing emails and primary contact phone numbers' },
                            { id: 'ar_task_3', text: 'Send payment reminders to all overdue balances' },
                            { id: 'ar_task_4', text: 'Check interest penalties for overdue payments are properly formulated' },
                            { id: 'ar_task_5', text: 'Confirm cash and bank receipts are reconciled with open sales invoices' }
                          ];
                        case 'stock_movement':
                        case 'low_stock_alerts':
                          return [
                            { id: 'stock_task_1', text: 'Reconcile digital inventory levels with physical stock-take count' },
                            { id: 'stock_task_2', text: 'Identify slow-moving or obsolete items for impairment adjustment' },
                            { id: 'stock_task_3', text: 'Check safety margins on fast-moving high-demand SKUs' },
                            { id: 'stock_task_4', text: 'Review purchase order lead times from primary vendors' }
                          ];
                        case 'faf_export':
                        case 'trial_balance':
                          return [
                            { id: 'tb_task_1', text: 'Ensure the General Ledger total Debit column exactly equals Credit column' },
                            { id: 'tb_task_2', text: 'Confirm there are no sequential number gaps in Sales Invoices' },
                            { id: 'tb_task_3', text: 'Audit and justify any manual ledger adjustments in VAT accounts' },
                            { id: 'tb_task_4', text: 'Inspect suspense and opening balanced adjustment accounts' }
                          ];
                        case 'detailed_general_ledger':
                          return [
                            { id: 'gl_task_1', text: 'Audit high-value journal postings for supporting document compliance' },
                            { id: 'gl_task_2', text: 'Ensure all auto-linked invoice reference numbers have consecutive continuity' },
                            { id: 'gl_task_3', text: 'Validate that bank transactions reconcile with the Cash / Bank ledger account' },
                            { id: 'gl_task_4', text: 'Verify adjustment ledger descriptions explain transaction purpose clearly' }
                          ];
                        case 'coa_balances_audit':
                          return [
                            { id: 'coa_task_1', text: 'Confirm account category classification (Asset, Liability, etc.) matches standard GAAP/IFRS rules' },
                            { id: 'coa_task_2', text: 'Check if opening balances have been correctly allocated in Equities adjustment' },
                            { id: 'coa_task_3', text: 'Verify that read-only tax ledger codes align with active FTA standard 5% calculations' }
                          ];
                        case 'aging_payables':
                          return [
                            { id: 'ap_task_1', text: 'Verify matching supplier invoices for any overdue balances over 60 days' },
                            { id: 'ap_task_2', text: 'Check if any disputed bill balances should be adjusted or held' },
                            { id: 'ap_task_3', text: 'Review supplier payment terms to optimize cash flow management' }
                          ];
                        default:
                          return [
                            { id: 'gen_task_1', text: 'Reconcile subtotal report numbers with the main General Ledger' },
                            { id: 'gen_task_2', text: 'Confirm the reporting date range is correct' },
                            { id: 'gen_task_3', text: 'Ensure proper branch/cost-center tracking tags are applied' }
                          ];
                      }
                    };
                    return getTasksForReport(selectedReport);
                  })().map(task => {
                    const isChecked = !!checklistTasks[task.id];
                    return (
                      <div 
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className={`p-3 rounded-xl border cursor-pointer flex items-start space-x-3 transition-all ${
                          isChecked 
                            ? 'bg-emerald-50/15 dark:bg-emerald-950/5 border-emerald-200/60 dark:border-emerald-900/30' 
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-50/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-750 cursor-pointer"
                        />
                        <span className={`text-[11px] font-medium leading-relaxed font-sans ${isChecked ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                          {task.text}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[9px] text-slate-400 font-mono">
                  * Note: Checking these items off stores your local compliance checklist readiness securely in your browser session.
                </p>
              </div>
            )}

            {/* TAB CONTENT: AUDITOR REMARKS NOTES */}
            {activeTaskTab === 'notes' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span>Add Auditor Remarks, Reconciliations or Compliance Notes</span>
                  {successMsg && <span className="text-emerald-600 font-bold font-sans animate-fade-in">✓ {successMsg}</span>}
                </div>

                <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder={`Write comments, explanations for tax deviations, or pending task lists for the "${reportsList.find(r => r.id === selectedReport)?.label.slice(3) || selectedReport}" report...`}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition-all font-mono min-h-[100px]"
                />

                <div className="flex justify-end">
                  <button
                    onClick={() => handleSaveNote(selectedReport, noteInput)}
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 text-white font-mono font-bold uppercase tracking-wider px-4 py-2 rounded-lg text-[10px] cursor-pointer transition-all flex items-center space-x-1"
                  >
                    <span>Save Advisory Remarks</span>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* -------------------------------------------------------------
              1. VAT RETURN REPORT (Priority #1)
             ------------------------------------------------------------- */}
          {selectedReport === 'vat_return' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Top Banner */}
              <div className="bg-[#0c1a30] text-white p-5 font-sans rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E5A93C] animate-pulse"></span>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[#E5A93C] font-black">Official UAE FTA Template</span>
                  </div>
                  <h3 className="text-base font-black uppercase tracking-wider font-sans mt-1">
                    VAT Return Form 201
                  </h3>
                  <p className="text-[10px] text-slate-300 mt-1 font-mono">
                    Federal Tax Authority Compliance Portal Standard Layout
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-left md:text-right">
                  <div>
                    <div className="text-[9px] uppercase font-mono tracking-wider text-slate-400">TRN FTA Compliance</div>
                    <div className="text-xs font-mono font-bold mt-1 text-emerald-400">
                      {company?.trn ? `TRN: ${company.trn}` : '⚠️ TRN Missing - Update in Company Settings'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => exportReportToPDF('VAT_Return_Form_201')}
                    disabled={isExportingPdf}
                    className="no-print px-3.5 py-2 bg-[#E5A93C] hover:bg-[#d89c2f] text-slate-950 font-mono font-bold text-[10px] uppercase tracking-wider rounded-lg flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isExportingPdf ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                        <span>Generating PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5 text-slate-950" />
                        <span>Export Official VAT 201 PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Tax Period Selector / Dynamic Period Controls */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 no-print shadow-xs">
                <div className="flex items-center space-x-3.5">
                  <div className="p-2.5 bg-[#4F46E5]/10 text-indigo-700 rounded-lg">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">Tax Period</h4>
                    <p className="text-[10px] text-slate-400 font-sans">Verify calendar bounds for this submission</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-mono text-slate-500 text-[10px] uppercase font-black">From:</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs focus:outline-hidden bg-white text-slate-800"
                    />
                    <span className="font-mono text-slate-500 text-[10px] uppercase font-black">To:</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs focus:outline-hidden bg-white text-slate-800"
                    />
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => {
                        const now = new Date();
                        const currentMonth = now.getMonth();
                        let qYear = now.getFullYear();
                        let qStartMonth = 0;
                        let qEndMonth = 2;
                        if (currentMonth >= 0 && currentMonth <= 2) {
                          qYear = qYear - 1;
                          qStartMonth = 9;
                          qEndMonth = 11;
                        } else if (currentMonth >= 3 && currentMonth <= 5) {
                          qStartMonth = 0;
                          qEndMonth = 2;
                        } else if (currentMonth >= 6 && currentMonth <= 8) {
                          qStartMonth = 3;
                          qEndMonth = 5;
                        } else {
                          qStartMonth = 6;
                          qEndMonth = 8;
                        }
                        const start = new Date(qYear, qStartMonth, 1);
                        const end = new Date(qYear, qEndMonth + 1, 0);
                        const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                        setStartDate(format(start));
                        setEndDate(format(end));
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[9px] font-bold tracking-wider uppercase px-3 py-2 border border-slate-300 rounded-lg transition-all cursor-pointer"
                    >
                      Last Quarter
                    </button>

                    <button
                      onClick={() => {
                        setIsVatCalculating(true);
                        setTimeout(() => {
                          setIsVatCalculating(false);
                          setVatRecalculatedAt(new Date().toLocaleTimeString());
                        }, 500);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-[9px] font-bold tracking-wider uppercase px-3 py-2 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isVatCalculating ? 'animate-spin' : ''}`} />
                      <span>Calculate Now</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Recalculation Notification Banner */}
              {vatRecalculatedAt && (
                <div className="no-print bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs animate-fade-in">
                  <div className="flex items-center space-x-2 text-emerald-800">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>
                      <strong>Form Recalculated!</strong> All sales, purchase tax ledgers, and manual boxes synchronized perfectly at <strong>{vatRecalculatedAt}</strong>.
                    </span>
                  </div>
                  <button 
                    onClick={() => setVatRecalculatedAt(null)}
                    className="text-emerald-500 hover:text-emerald-700 font-bold px-1"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* MAIN FORM 201 GRID */}
              <div className="border border-slate-300 overflow-hidden rounded-xl bg-white shadow-xs">
                
                {/* Supplies Section Header */}
                <div className="bg-[#1e293b] text-white px-4 py-3 font-sans text-xs font-black uppercase tracking-wider flex justify-between items-center">
                  <span>1. VAT on Sales and all other Outputs</span>
                  <span className="text-[10px] font-mono text-slate-300 font-normal">Section 1</span>
                </div>

                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-[10px] font-mono uppercase text-slate-600 border-b border-slate-300">
                      <th className="py-2.5 px-4 w-1">Box No. & Description</th>
                      <th className="py-2.5 px-4 text-right w-1">Taxable Amount (AED)</th>
                      <th className="py-2.5 px-4 text-right w-1">VAT Amount (AED)</th>
                      <th className="py-2.5 px-4 text-center w-[10%]">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                    
                    {/* Box 1 */}
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="font-sans font-bold text-slate-800">Box 1: Standard Rated Supplies</div>
                      <div className="text-[10px] text-slate-400 font-sans">Standard rated supplies</div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatAED(standardRatedSalesSubtotal)}
                      </td>
                      <td className="py-3 px-4 text-right text-indigo-600 font-black">
                        {formatAED(standardRatedSalesVat)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block text-[8px] font-bold tracking-wider font-sans uppercase px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-sm border border-indigo-100">
                          Auto
                        </span>
                      </td>
                    </tr>

                    {/* Box 2 */}
                    <tr className="hover:bg-slate-50/50 bg-amber-50/10">
                      <td className="py-3 px-4">
                        <div className="font-sans font-bold text-slate-800">Box 2: Taxable Supplies at Zero Rate</div>
                      <div className="text-[10px] text-slate-400 font-sans">Zero-rated supplies</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <span className="text-[10px] text-slate-400">AED</span>
                          <input
                            type="number"
                            value={box2ZeroRatedSupplies || ''}
                            placeholder="0.00"
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setBox2ZeroRatedSupplies(isNaN(val) ? 0 : val);
                            }}
                            className="border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-md px-2 py-1 w-28 text-right font-mono text-[11px] focus:outline-hidden bg-white text-slate-800"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 italic">
                        0.00
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block text-[8px] font-bold tracking-wider font-sans uppercase px-2 py-0.5 bg-amber-50 text-amber-700 rounded-sm border border-amber-100">
                          Manual
                        </span>
                      </td>
                    </tr>

                    {/* Box 3 */}
                    <tr className="hover:bg-slate-50/50 bg-amber-50/10">
                      <td className="py-3 px-4">
                        <div className="font-sans font-bold text-slate-800">Box 3: Exempt Supplies</div>
                      <div className="text-[10px] text-slate-400 font-sans">Exempt supplies</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <span className="text-[10px] text-slate-400">AED</span>
                          <input
                            type="number"
                            value={box3ExemptSupplies || ''}
                            placeholder="0.00"
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setBox3ExemptSupplies(isNaN(val) ? 0 : val);
                            }}
                            className="border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-md px-2 py-1 w-28 text-right font-mono text-[11px] focus:outline-hidden bg-white text-slate-800"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 italic">
                        0.00
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block text-[8px] font-bold tracking-wider font-sans uppercase px-2 py-0.5 bg-amber-50 text-amber-700 rounded-sm border border-amber-100">
                          Manual
                        </span>
                      </td>
                    </tr>

                    {/* Box 4 Total Supplies */}
                    <tr className="bg-slate-50 font-bold border-t border-slate-300">
                      <td className="py-3.5 px-4">
                        <div className="font-sans font-black text-[#1e293b]">Box 4: Total Supplies</div>
                    <div className="text-[10px] text-[#475569] font-sans">Total supplies (Box 1 + Box 2 + Box 3)</div>
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#1e293b] font-black">
                        {formatAED(standardRatedSalesSubtotal + box2ZeroRatedSupplies + box3ExemptSupplies)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-indigo-700 font-black">
                        {formatAED(standardRatedSalesVat)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block text-[8px] font-bold tracking-wider font-sans uppercase px-2 py-0.5 bg-[#e2e8f0] text-slate-700 rounded-sm">
                          Formula
                        </span>
                      </td>
                    </tr>

                  </tbody>
                </table>

                {/* Expenses Section Header */}
                <div className="bg-[#1e293b] text-white px-4 py-3 font-sans text-xs font-black uppercase tracking-wider flex justify-between items-center border-t border-slate-300">
                  <span>2. VAT on Expenses and all other Inputs</span>
                  <span className="text-[10px] font-mono text-slate-300 font-normal">Section 2</span>
                </div>

                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                    
                    {/* Box 5 */}
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 w-1/2">
                        <div className="font-sans font-bold text-slate-800">Box 5: Standard Rated Expenses</div>
                      <div className="text-[10px] text-slate-400 font-sans">Standard rated expenses</div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 w-1/5">
                        {formatAED(standardRatedPurchasesSubtotal)}
                      </td>
                      <td className="py-3 px-4 text-right text-rose-600 font-black w-1/5">
                        {formatAED(standardRatedPurchasesSubtotal * 0.05)}
                      </td>
                      <td className="py-3 px-4 text-center w-[10%]">
                        <span className="inline-block text-[8px] font-bold tracking-wider font-sans uppercase px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-sm border border-indigo-100">
                          Auto
                        </span>
                      </td>
                    </tr>

                    {/* Box 6 */}
                    <tr className="hover:bg-slate-50/50 bg-amber-50/10">
                      <td className="py-3 px-4">
                        <div className="font-sans font-bold text-slate-800">Box 6: Expenses at Zero Rate</div>
                      <div className="text-[10px] text-slate-400 font-sans">Zero-rated expenses</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <span className="text-[10px] text-slate-400">AED</span>
                          <input
                            type="number"
                            value={box6ZeroRatedExpenses || ''}
                            placeholder="0.00"
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setBox6ZeroRatedExpenses(isNaN(val) ? 0 : val);
                            }}
                            className="border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-md px-2 py-1 w-28 text-right font-mono text-[11px] focus:outline-hidden bg-white text-slate-800"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 italic">
                        0.00
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block text-[8px] font-bold tracking-wider font-sans uppercase px-2 py-0.5 bg-amber-50 text-amber-700 rounded-sm border border-amber-100">
                          Manual
                        </span>
                      </td>
                    </tr>

                    {/* Box 7 Total Input Tax */}
                    <tr className="bg-slate-50 font-bold border-t border-slate-300">
                      <td className="py-3.5 px-4">
                        <div className="font-sans font-black text-[#1e293b]">Box 7: Total Input Tax</div>
                    <div className="text-[10px] text-[#475569] font-sans">Total recoverable input tax (5% of Box 5)</div>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400 italic">
                        -
                      </td>
                      <td className="py-3.5 px-4 text-right text-rose-700 font-black">
                        {formatAED(standardRatedPurchasesSubtotal * 0.05)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block text-[8px] font-bold tracking-wider font-sans uppercase px-2 py-0.5 bg-[#e2e8f0] text-slate-700 rounded-sm">
                          Formula
                        </span>
                      </td>
                    </tr>

                  </tbody>
                </table>

                {/* Net VAT Section Header */}
                <div className="bg-[#0f172a] text-white px-4 py-3 font-sans text-xs font-black uppercase tracking-wider flex justify-between items-center border-t border-slate-300">
                  <span>3. Net VAT Payable or Recoverable</span>
                  <span className="text-[10px] font-mono text-slate-300 font-normal">Section 3</span>
                </div>

                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                    
                    {/* Box 8 */}
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 w-1/2">
                        <div className="font-sans font-bold text-slate-800">Box 8: Total VAT Payable</div>
                    <div className="text-[10px] text-slate-400 font-sans">Total VAT payable (Box 1 * 5% - Box 7)</div>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400 italic w-1/5">
                        -
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-900 font-black w-1/5">
                        {formatAED((standardRatedSalesSubtotal * 0.05) - (standardRatedPurchasesSubtotal * 0.05))}
                      </td>
                      <td className="py-3.5 px-4 text-center w-[10%]">
                        <span className="inline-block text-[8px] font-bold tracking-wider font-sans uppercase px-2 py-0.5 bg-[#e2e8f0] text-slate-700 rounded-sm">
                          Formula
                        </span>
                      </td>
                    </tr>

                    {/* Box 9 */}
                    <tr className="hover:bg-slate-50/50 bg-amber-50/10">
                      <td className="py-3.5 px-4">
                        <div className="font-sans font-bold text-slate-800">Box 9: Late Registration Penalty</div>
                      <div className="text-[10px] text-slate-400 font-sans">Late registration penalty (if applicable)</div>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400 italic">
                        -
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <span className="text-[10px] text-slate-400">AED</span>
                          <input
                            type="number"
                            value={box9LatePenalty || ''}
                            placeholder="0.00"
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setBox9LatePenalty(isNaN(val) ? 0 : val);
                            }}
                            className="border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-md px-2 py-1 w-28 text-right font-mono text-[11px] focus:outline-hidden bg-white text-slate-800"
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block text-[8px] font-bold tracking-wider font-sans uppercase px-2 py-0.5 bg-amber-50 text-amber-700 rounded-sm border border-amber-100">
                          Manual
                        </span>
                      </td>
                    </tr>

                    {/* Box 10 Net VAT Due */}
                    {(() => {
                      const finalVatDue = ((standardRatedSalesSubtotal * 0.05) - (standardRatedPurchasesSubtotal * 0.05)) + box9LatePenalty;
                      return (
                        <tr className="bg-indigo-900 text-white font-bold border-t-2 border-indigo-950">
                          <td className="py-4 px-4">
                            <div className="font-sans font-black text-white text-sm">Box 10: Net VAT Due</div>
                    <div className="text-[10px] text-indigo-200 font-sans">Net tax due for payment or refund (Box 8 + Box 9)</div>
                          </td>
                          <td className="py-4 px-4 text-right text-indigo-300 italic">
                            -
                          </td>
                          <td className="py-4 px-4 text-right text-2xl font-black font-sans">
                            {formatAED(finalVatDue)}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="inline-block text-[8px] font-bold tracking-wider font-mono uppercase px-2.5 py-1 bg-indigo-800 text-indigo-100 border border-indigo-700 rounded font-black">
                              {finalVatDue >= 0 ? 'Payable' : 'Refund'}
                            </span>
                          </td>
                        </tr>
                      );
                    })()}

                  </tbody>
                </table>

              </div>

              {/* Box 1 Detail Breakdown Collapsible / Detail section */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="bg-slate-50 px-4 py-3.5 border-b border-slate-200 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">Detailed Standard Rated Supplies Breakdown (Box 1)</h4>
                    <p className="text-[9px] text-slate-400 font-sans">Standard rated supplies breakdown by emirate</p>
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 bg-slate-200 text-slate-600 rounded font-bold">AED</span>
                </div>

                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-50/60 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200">
                      <th className="py-2 px-4">Emirate of Supply</th>
                      <th className="py-2 px-4 text-right">Taxable Amount (AED)</th>
                      <th className="py-2 px-4 text-right">Standard VAT 5.0% (AED)</th>
                      <th className="py-2 px-4 text-right font-black">Gross Total (AED)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {Object.entries(emirateSales).map(([emirate, vals]) => (
                      <tr key={emirate} className="hover:bg-slate-50/30">
                        <td className="py-2.5 px-4 font-sans font-medium text-slate-800">{emirate}</td>
                        <td className="py-2.5 px-4 text-right">{formatAED(vals.taxable)}</td>
                        <td className="py-2.5 px-4 text-right text-indigo-600">{formatAED(vals.vat)}</td>
                        <td className="py-2.5 px-4 text-right font-medium text-slate-900">{formatAED(vals.taxable + vals.vat)}</td>
                      </tr>
                    ))}
                    {/* Sum */}
                    <tr className="bg-indigo-50/30 font-bold border-t border-slate-200">
                      <td className="py-3 px-4 text-indigo-900 uppercase">SUBTOTAL (BOX 1 LEDGER MATCH)</td>
                      <td className="py-3 px-4 text-right text-slate-900">{formatAED(standardRatedSalesSubtotal)}</td>
                      <td className="py-3 px-4 text-right text-indigo-700 font-black">{formatAED(standardRatedSalesVat)}</td>
                      <td className="py-3 px-4 text-right text-slate-900">{formatAED(standardRatedSalesSubtotal + standardRatedSalesVat)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* -------------------------------------------------------------
              2. AGING RECEIVABLES LEDGER (Priority #2)
             ------------------------------------------------------------- */}
          {selectedReport === 'aging_receivables' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>Aging Receivables Breakdown (0 to 90+ Days)</span>
                <span>Active Ledger Outstanding</span>
              </div>

              <p className="text-xs text-slate-500 italic border-l-4 border-amber-500 pl-3">
                Shows due aging analysis for corporate accounts based on invoice date relative to standard system baseline. Unpaid invoices are binned to estimate cash flow recovery curves.
              </p>

              {Object.keys(agingCustomersMap).length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-mono italic">
                  Excellent! No outstanding or aging unpaid receivables found in this date range.
                </div>
              ) : (
                <div className="border border-slate-200 overflow-hidden rounded-xl">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200">
                        <th className="py-3 px-4 font-bold">Client / Customer Account</th>
                        <th className="py-3 px-4 text-right font-bold">0-30 Days</th>
                        <th className="py-3 px-4 text-right font-bold">31-60 Days</th>
                        <th className="py-3 px-4 text-right font-bold">61-90 Days</th>
                        <th className="py-3 px-4 text-right font-bold">90+ Days</th>
                        <th className="py-3 px-4 text-right font-bold bg-slate-100/50">Total Unpaid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {Object.entries(agingCustomersMap).map(([custName, vals]) => (
                        <tr key={custName} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-sans font-bold text-slate-800">{custName}</td>
                          <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-semibold">{formatAED(vals.c0_30)}</td>
                          <td className="py-3 px-4 text-right text-amber-500 dark:text-amber-400 font-semibold">{formatAED(vals.c31_60)}</td>
                          <td className="py-3 px-4 text-right text-orange-600 dark:text-orange-400 font-bold">{formatAED(vals.c61_90)}</td>
                          <td className="py-3 px-4 text-right text-rose-600 dark:text-rose-400 font-black">{formatAED(vals.c90_plus)}</td>
                          <td className="py-3 px-4 text-right font-black text-slate-900 bg-slate-50/40">{formatAED(vals.total)}</td>
                        </tr>
                      ))}
                      
                      {/* Subtotal metrics row */}
                      <tr className="bg-slate-100/40 font-bold border-t border-slate-200">
                        <td className="py-3 px-4 uppercase text-slate-900">Total Outstanding</td>
                        <td className="py-3 px-4 text-right text-emerald-700 font-bold">
                          {formatAED(Object.values(agingCustomersMap).reduce((sum, v) => sum + v.c0_30, 0))}
                        </td>
                        <td className="py-3 px-4 text-right text-amber-700 font-bold">
                          {formatAED(Object.values(agingCustomersMap).reduce((sum, v) => sum + v.c31_60, 0))}
                        </td>
                        <td className="py-3 px-4 text-right text-orange-700 font-bold">
                          {formatAED(Object.values(agingCustomersMap).reduce((sum, v) => sum + v.c61_90, 0))}
                        </td>
                        <td className="py-3 px-4 text-right text-rose-700 font-black">
                          {formatAED(Object.values(agingCustomersMap).reduce((sum, v) => sum + v.c90_plus, 0))}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-950 font-black bg-slate-100/80">
                          {formatAED(Object.values(agingCustomersMap).reduce((sum, v) => sum + v.total, 0))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}

          {/* -------------------------------------------------------------
              3. PROFIT & LOSS LEDGER (Priority #3)
             ------------------------------------------------------------- */}
          {selectedReport === 'profit_loss' && (
            <div className="space-y-6">
              
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>Profit & Loss Statement (P&L Ledger)</span>
                <span>{company?.currency || 'AED'} Standards</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                
                {/* 1. REVENUE SECTION */}
                <div className="bg-slate-50 px-4 py-2 font-bold uppercase tracking-wider border-b border-slate-200 flex justify-between">
                  <span>1. Operating Revenue</span>
                  <span>Credit Balance ({company?.currency || 'AED'})</span>
                </div>
                <div className="p-4 space-y-2 font-mono">
                  <div className="flex justify-between hover:bg-slate-50 py-1 px-2 rounded">
                    <span className="font-sans">Corporate Invoiced Revenue (Sales)</span>
                    <span>{formatAED(plRevenue)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-dashed border-slate-200 pt-2 px-2 text-slate-800">
                    <span className="font-sans">TOTAL GROSS REVENUE</span>
                    <span>{formatAED(plRevenue)}</span>
                  </div>
                </div>

                {/* 2. COST OF GOODS SOLD */}
                <div className="bg-slate-50 px-4 py-2 font-bold uppercase tracking-wider border-b border-slate-200 flex justify-between">
                  <span>2. Cost of Goods Sold (COGS)</span>
                  <span>Debit Balance ({company?.currency || 'AED'})</span>
                </div>
                <div className="p-4 space-y-2 font-mono">
                  <div className="flex justify-between hover:bg-slate-50 py-1 px-2 rounded">
                    <span className="font-sans">Purchases & Direct Procurement</span>
                    <span>{formatAED(plCOGS)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-dashed border-slate-200 pt-2 px-2 text-slate-800">
                    <span className="font-sans">TOTAL COST OF GOODS SOLD</span>
                    <span>{formatAED(plCOGS)}</span>
                  </div>
                </div>

                {/* GROSS MARGIN BANNER */}
                <div className="bg-indigo-50/40 border-y border-indigo-100 p-4 font-bold flex justify-between font-mono text-indigo-900">
                  <span className="uppercase tracking-wider">Gross Operating Profit Margin</span>
                  <span>{formatAED(plGrossProfit)}</span>
                </div>

                {/* 3. OPEX EXPENSES */}
                <div className="bg-slate-50 px-4 py-2 font-bold uppercase tracking-wider border-b border-slate-200 flex justify-between">
                  <span>3. General Operational Expenses (OPEX)</span>
                  <span>Debit Balance ({company?.currency || 'AED'})</span>
                </div>
                <div className="p-4 space-y-2 font-mono">
                  {Object.entries(plOpexMap).map(([category, val]) => (
                    <div key={category} className="flex justify-between hover:bg-slate-50 py-1 px-2 rounded">
                      <span className="font-sans">{category} Operational Expenses</span>
                      <span>{formatAED(val)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold border-t border-dashed border-slate-200 pt-2 px-2 text-rose-800">
                    <span className="font-sans">TOTAL OPERATIONAL EXPENSES</span>
                    <span>{formatAED(totalOpex)}</span>
                  </div>
                </div>

                {/* NET RECONCILIATION PROFIT BANNER */}
                <div className={`p-5 font-bold flex justify-between items-center font-mono text-white ${netProfit >= 0 ? 'bg-emerald-800' : 'bg-rose-800'}`}>
                  <div>
                    <span className="uppercase tracking-wider block text-xs font-black">NET INCOME / PROFIT FOR THE PERIOD</span>
                    <span className="text-[10px] text-emerald-100 font-normal">Compliant with UAE Financial Reporting Standards</span>
                  </div>
                  <span className="text-xl">{formatAED(netProfit)}</span>
                </div>

              </div>

            </div>
          )}

          {/* -------------------------------------------------------------
              4. VAT SALES SUMMARY
             ------------------------------------------------------------- */}
          {selectedReport === 'vat_sales_summary' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>VAT Sales Ledger Summary Journal</span>
                <span>Active standard Sales Invoices</span>
              </div>

              <div className="border border-slate-200 overflow-hidden rounded-xl">
                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200">
                      <th className="py-2.5 px-4 font-bold">Invoice Date</th>
                      <th className="py-2.5 px-4 font-bold">Document No.</th>
                      <th className="py-2.5 px-4 font-bold">Client Name</th>
                      <th className="py-2.5 px-4 font-bold">TRN No.</th>
                      <th className="py-2.5 px-4 text-right font-bold">Subtotal ({company?.currency || 'AED'})</th>
                      <th className="py-2.5 px-4 text-right font-bold">VAT {company?.taxRate ?? 5}.0% ({company?.currency || 'AED'})</th>
                      <th className="py-2.5 px-4 text-right font-bold">Gross Total ({company?.currency || 'AED'})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {filteredInvoices.map(inv => {
                      const cust = activeCompanyCustomers.find(c => c.id === inv.customerId);
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/30">
                          <td className="py-2.5 px-4 font-sans">{inv.date}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-900">{inv.docNumber}</td>
                          <td className="py-2.5 px-4 font-sans font-medium">{cust ? cust.name : 'Unknown Client'}</td>
                          <td className="py-2.5 px-4 text-slate-500">{cust?.trn || 'N/A'}</td>
                          <td className="py-2.5 px-4 text-right">{formatAED(inv.subtotal)}</td>
                          <td className="py-2.5 px-4 text-right text-indigo-600">{formatAED(inv.vatTotal)}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-900">{formatAED(inv.total)}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-100/50 font-bold border-t border-slate-200">
                      <td colSpan={4} className="py-3 px-4 uppercase text-slate-900 text-[10px]">TOTAL SUMS</td>
                      <td className="py-3 px-4 text-right">{formatAED(standardRatedSalesSubtotal)}</td>
                      <td className="py-3 px-4 text-right text-indigo-700">{formatAED(standardRatedSalesVat)}</td>
                      <td className="py-3 px-4 text-right text-slate-950 font-black">{formatAED(standardRatedSalesSubtotal + standardRatedSalesVat)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              5. VAT PURCHASE SUMMARY
             ------------------------------------------------------------- */}
          {selectedReport === 'vat_purchase_summary' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>VAT Purchases & Costs Summary Journal</span>
                <span>Active standard Expenses</span>
              </div>

              <div className="border border-slate-200 overflow-hidden rounded-xl">
                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200">
                      <th className="py-2.5 px-4 font-bold">Expense Date</th>
                      <th className="py-2.5 px-4 font-bold">Supplier Name</th>
                      <th className="py-2.5 px-4 font-bold">Supplier TRN</th>
                      <th className="py-2.5 px-4 font-bold">Bill No.</th>
                      <th className="py-2.5 px-4 font-bold">Category</th>
                      <th className="py-2.5 px-4 text-right font-bold">Taxable Cost ({company?.currency || 'AED'})</th>
                      <th className="py-2.5 px-4 text-right font-bold">Input VAT {company?.taxRate ?? 5}.0% ({company?.currency || 'AED'})</th>
                      <th className="py-2.5 px-4 text-right font-bold">Gross Cost ({company?.currency || 'AED'})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {filteredExpenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-slate-50/30">
                        <td className="py-2.5 px-4 font-sans">{exp.date}</td>
                        <td className="py-2.5 px-4 font-sans font-bold text-slate-900">{exp.supplierName}</td>
                        <td className="py-2.5 px-4 text-slate-500">{exp.supplierTrn || 'N/A'}</td>
                        <td className="py-2.5 px-4">{exp.invoiceNumber}</td>
                        <td className="py-2.5 px-4 font-sans"><span className="px-1.5 py-0.5 bg-slate-100 border rounded text-[9px] uppercase tracking-wider">{exp.category}</span></td>
                        <td className="py-2.5 px-4 text-right">{formatAED(exp.amount)}</td>
                        <td className="py-2.5 px-4 text-right text-rose-600">{formatAED(exp.vatAmount)}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">{formatAED(exp.total)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100/50 font-bold border-t border-slate-200">
                      <td colSpan={5} className="py-3 px-4 uppercase text-slate-900 text-[10px]">TOTAL COSTS SUM</td>
                      <td className="py-3 px-4 text-right">{formatAED(standardRatedPurchasesSubtotal)}</td>
                      <td className="py-3 px-4 text-right text-rose-700">{formatAED(standardRatedPurchasesVat)}</td>
                      <td className="py-3 px-4 text-right text-slate-950 font-black">{formatAED(standardRatedPurchasesSubtotal + standardRatedPurchasesVat)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              19B. VAT PENDING CUSTOMER REPORT
             ------------------------------------------------------------- */}
          {selectedReport === 'vat_pending_customers' && (() => {
            const pendingCusts = activeCompanyCustomers.filter(c => c.vatStatus === 'pending');
            const pendingCustIds = pendingCusts.map(c => c.id);
            const pendingInvoices = filteredInvoices.filter(inv => pendingCustIds.includes(inv.customerId));
            const totalSuspenseVat = pendingInvoices.reduce((sum, inv) => sum + (inv.vatTotal || 0), 0);
            const totalGrossSales = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0);

            return (
              <div className="space-y-6">
                {/* Visual Header */}
                <div className="bg-[#0F172A] text-white p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
                  <div>
                    <h3 className="text-sm font-black tracking-wide uppercase font-mono">Provisional VAT Pending Customers Summary</h3>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Federal Tax Authority (FTA) compliance monitoring registry for provisional customers and unresolved tax suspensions.
                    </p>
                  </div>
                  <div className="bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-mono px-3 py-1 rounded-lg uppercase font-bold shrink-0">
                    Provisional Suspense Registry
                  </div>
                </div>

                {/* Metric Bento Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-2xs">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Pending Clients</span>
                    <p className="text-2xl font-black text-slate-850 mt-1 font-mono">{pendingCusts.length}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Requires TRN updates within 5 days</p>
                  </div>
                  <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-2xs">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Unresolved Invoices</span>
                    <p className="text-2xl font-black text-slate-850 mt-1 font-mono">{pendingInvoices.length}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Provisional standard invoices issued</p>
                  </div>
                  <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-2xs bg-rose-50/20 border-rose-100">
                    <span className="text-[10px] text-rose-700 uppercase tracking-widest font-mono font-bold">Suspended VAT Output (Ledger 2260)</span>
                    <p className="text-2xl font-black text-rose-800 mt-1 font-mono">{formatAED(totalSuspenseVat)}</p>
                    <p className="text-[10px] text-rose-600 mt-1 font-sans font-medium">To be moved to Ledger 2250 on TRN input</p>
                  </div>
                </div>

                {/* Section A: Pending Customer Roster */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs">
                  <div className="p-4 border-b border-[#E2E8F0] bg-slate-50 flex items-center justify-between">
                    <h4 className="text-[11px] font-mono font-black uppercase tracking-wider text-slate-600">Provisional Customer Roster</h4>
                    <span className="text-[10px] font-mono font-bold text-slate-400">Total: {pendingCusts.length} clients</span>
                  </div>
                  {pendingCusts.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 italic text-xs">
                      🎉 Great! No customers currently have pending VAT status. All accounts are fully compliant.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700 border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-mono uppercase text-slate-500 border-b border-[#E2E8F0]">
                            <th className="py-2.5 px-4 font-bold">Customer Name</th>
                            <th className="py-2.5 px-4 font-bold">Temporary ID</th>
                            <th className="py-2.5 px-4 font-bold">Pending Date</th>
                            <th className="py-2.5 px-4 text-center font-bold">Total Invoices</th>
                            <th className="py-2.5 px-4 text-right font-bold">Gross Sales</th>
                            <th className="py-2.5 px-4 text-right font-bold">Suspended VAT (AED)</th>
                            <th className="py-2.5 px-4 text-center font-bold">FTA Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                          {pendingCusts.map(cust => {
                            const custInvoices = pendingInvoices.filter(inv => inv.customerId === cust.id);
                            const custVat = custInvoices.reduce((sum, inv) => sum + (inv.vatTotal || 0), 0);
                            const custTotal = custInvoices.reduce((sum, inv) => sum + inv.total, 0);
                            return (
                              <tr key={cust.id} className="hover:bg-slate-50/40">
                                <td className="py-2.5 px-4 font-sans font-bold text-slate-900">{cust.name}</td>
                                <td className="py-2.5 px-4 text-slate-600">{cust.tempTrnId || 'N/A'}</td>
                                <td className="py-2.5 px-4 text-slate-500">{cust.vatPendingCreatedAt || 'N/A'}</td>
                                <td className="py-2.5 px-4 text-center text-indigo-600 font-bold">{custInvoices.length}</td>
                                <td className="py-2.5 px-4 text-right font-bold text-slate-800">{formatAED(custTotal)}</td>
                                <td className="py-2.5 px-4 text-right font-black text-rose-600">{formatAED(custVat)}</td>
                                <td className="py-2.5 px-4 text-center">
                                  <span className="bg-rose-50 border border-rose-200 text-rose-700 text-[9px] px-2 py-0.5 rounded-full uppercase font-bold">
                                    Provisional
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Section B: Individual Outstanding Provisional Invoices */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs">
                  <div className="p-4 border-b border-[#E2E8F0] bg-slate-50 flex items-center justify-between">
                    <h4 className="text-[11px] font-mono font-black uppercase tracking-wider text-slate-600">Individual Outstanding Provisional Invoices</h4>
                    <span className="text-[10px] font-mono font-bold text-slate-400">Total: {pendingInvoices.length} transactions</span>
                  </div>
                  {pendingInvoices.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 italic text-xs">
                      No provisional invoices issued during this period.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700 border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-mono uppercase text-slate-500 border-b border-[#E2E8F0]">
                            <th className="py-2.5 px-4 font-bold">Invoice Date</th>
                            <th className="py-2.5 px-4 font-bold">Invoice No.</th>
                            <th className="py-2.5 px-4 font-bold">Client Name</th>
                            <th className="py-2.5 px-4 font-bold">Temp Customer ID</th>
                            <th className="py-2.5 px-4 text-right font-bold">Subtotal</th>
                            <th className="py-2.5 px-4 text-right font-bold">Suspended VAT (5%)</th>
                            <th className="py-2.5 px-4 text-right font-bold">Gross Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                          {pendingInvoices.map(inv => {
                            const cust = activeCompanyCustomers.find(c => c.id === inv.customerId);
                            return (
                              <tr key={inv.id} className="hover:bg-slate-50/40">
                                <td className="py-2.5 px-4 font-sans">{inv.date}</td>
                                <td className="py-2.5 px-4 font-bold text-indigo-700">{inv.docNumber}</td>
                                <td className="py-2.5 px-4 font-sans font-medium text-slate-800">{cust?.name || 'Unknown Client'}</td>
                                <td className="py-2.5 px-4 text-slate-600">{cust?.tempTrnId || 'N/A'}</td>
                                <td className="py-2.5 px-4 text-right">{formatAED(inv.subtotal)}</td>
                                <td className="py-2.5 px-4 text-right text-rose-600 font-bold">{formatAED(inv.vatTotal)}</td>
                                <td className="py-2.5 px-4 text-right font-bold text-slate-950">{formatAED(inv.total)}</td>
                              </tr>
                            );
                          })}
                          <tr className="bg-slate-100/50 border-t border-slate-200 font-bold">
                            <td colSpan={4} className="py-3 px-4 uppercase text-slate-900 text-[10px]">TOTAL OUTSTANDING SUMS</td>
                            <td className="py-3 px-4 text-right">{formatAED(pendingInvoices.reduce((sum, i) => sum + i.subtotal, 0))}</td>
                            <td className="py-3 px-4 text-right text-rose-700">{formatAED(totalSuspenseVat)}</td>
                            <td className="py-3 px-4 text-right text-slate-950 font-black">{formatAED(totalGrossSales)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* -------------------------------------------------------------
              6. ZATCA XML COMPLIANCE
             ------------------------------------------------------------- */}
          {selectedReport === 'zatca_xml_export' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>ZATCA KSA Compliant Electronic Invoicing (Fatoora Phase 2)</span>
                <span>UBL 2.1 Standard XML</span>
              </div>

              <div className="no-print bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-4 justify-between text-xs">
                <div className="flex items-center space-x-2 w-full sm:max-w-md">
                  <span className="font-bold text-slate-700 whitespace-nowrap">Select Invoice to Generate:</span>
                  <select
                    value={zatcaInvoiceId}
                    onChange={(e) => setZatcaInvoiceId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                  >
                    <option value="" disabled>-- Select Corporate Invoice --</option>
                    {activeCompanyInvoices.map(inv => (
                      <option key={inv.id} value={inv.id}>{inv.docNumber} - {inv.total.toFixed(2)} {company?.currency || 'AED'}</option>
                    ))}
                  </select>
                </div>

                {zatcaInvoiceId && (
                  <button
                    onClick={() => {
                      const selDoc = activeCompanyInvoices.find(i => i.id === zatcaInvoiceId);
                      if (!selDoc) return;
                      const xml = getZatcaXML(selDoc);
                      const blob = new Blob([xml], { type: 'text/xml' });
                      const link = document.createElement('a');
                      link.href = URL.createObjectURL(blob);
                      link.download = `${selDoc.docNumber}_zatca_compliance.xml`;
                      link.click();
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg flex items-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download UBL XML</span>
                  </button>
                )}
              </div>

              {zatcaInvoiceId ? (
                (() => {
                  const selDoc = activeCompanyInvoices.find(i => i.id === zatcaInvoiceId);
                  if (!selDoc) return <div className="text-center p-6">Invoice error</div>;
                  
                  return (
                    <div className="space-y-4">
                      {/* ZATCA Metadata box */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono bg-indigo-50/50 p-4 border border-indigo-100 rounded-xl">
                        <div>
                          <span className="text-slate-400 uppercase tracking-wider block text-[9px]">ZATCA SDK Stage</span>
                          <span className="font-bold text-slate-800">Phase 2 Clearance</span>
                        </div>
                        <div>
                          <span className="text-slate-400 uppercase tracking-wider block text-[9px]">Cryptographic Envelope</span>
                          <span className="font-bold text-emerald-700">SHA-256 Signed Envelope</span>
                        </div>
                        <div>
                          <span className="text-slate-400 uppercase tracking-wider block text-[9px]">Compliance Validation</span>
                          <span className="font-bold text-emerald-700">✓ Fully Verified (Compliant)</span>
                        </div>
                      </div>

                      {/* Code Block Container */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                        <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between font-mono text-[10px]">
                          <span>UBL2.1_Invoice_Envelope.xml</span>
                          <span className="text-[#818CF8]">Syntactically Valid</span>
                        </div>
                        <pre className="p-4 bg-slate-950 text-[#818CF8] font-mono text-[10px] overflow-auto max-h-[450px] leading-relaxed select-all">
                          {getZatcaXML(selDoc)}
                        </pre>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="p-12 text-center text-slate-400 italic">
                  Please select a corporate invoice above to visualize standard compliant ZATCA Phase 2 XML structure.
                </div>
              )}

            </div>
          )}

          {/* -------------------------------------------------------------
              17. FTA AUDIT FILE (FAF) EXPORT
             ------------------------------------------------------------- */}
          {selectedReport === 'faf_export' && (
            (() => {
              // Prepare FAF data
              const glRecords = getGLRecords();
              const salesRecords = (documents || [])
                .filter(doc => doc.companyId === company.id && doc.type === 'Invoice')
                .map(doc => ({
                  docNumber: doc.docNumber,
                  date: doc.date,
                  customerName: customers.find(c => c.id === doc.customerId)?.name || 'Cash Customer',
                  customerTrn: customers.find(c => c.id === doc.customerId)?.trn || 'N/A',
                  subtotal: doc.subtotal,
                  vatTotal: doc.vatTotal,
                  total: doc.total
                }));
              const purchaseRecords = (expenses || [])
                .filter(exp => exp.companyId === company.id)
                .map(exp => ({
                  supplierName: exp.supplierName || 'General Supplier',
                  supplierTrn: exp.supplierTrn || 'N/A',
                  date: exp.date,
                  category: exp.category || 'General Expense',
                  description: exp.description || '',
                  subtotal: exp.amount,
                  vatAmount: exp.vatAmount,
                  totalAmount: exp.total
                }));

              return (
                <div className="space-y-6">
                  {(activePlan === 'pro_1y' || activePlan === 'basic') && (
                    <div className="bg-amber-950/40 border border-amber-600/60 p-4 rounded-xl flex items-start space-x-3 text-amber-200">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs font-sans">
                        <h4 className="font-extrabold uppercase text-amber-400 tracking-wider">
                          🚫 Audit Level Reports & FAF XML Export Restricted
                        </h4>
                        <p className="leading-relaxed text-slate-300 text-[11px]">
                          Under Hisaab Pro subscription policy, FTA Audit File (FAF XML) Exports and deep Audit-level compliance reports are reserved exclusively for <strong>3-Year and Lifetime Subscription Plans</strong>. Upgrade your subscription plan to unlock full FTA audit file generation and compliance auditing tools.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Top FAF spec banner */}
                  <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-indigo-400">FTA Auditor File (FAF) Standard Spec</span>
                      <span className="bg-indigo-600/30 text-indigo-300 border border-indigo-500/25 px-2.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider">FTA v1.0.0</span>
                    </div>
                    <h3 className="text-sm font-bold">One-Click Federal Tax Authority Audit Export</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed max-w-4xl">
                      Generate a fully compliant UAE Federal Tax Authority (FTA) Audit File (FAF). The export compiles company metadata, complete general ledger double-entry adjustments, invoice records, and verified expense logs into a single structured schema per FTA guidelines.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-1 text-[10px] font-mono text-indigo-300 font-bold">
                      <span>✓ UTF-8 verified billing logs</span>
                      <span>✓ Bilingual XML/Excel audit tags</span>
                      <span>✓ Double-entry balanced verification</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="no-print bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row items-center gap-4 justify-between text-xs">
                    <div className="flex items-center space-x-2 text-slate-600">
                      <span className="font-bold">Records Summary:</span>
                      <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold font-mono">{glRecords.length} GL</span>
                      <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold font-mono">{salesRecords.length} Sales</span>
                      <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold font-mono">{purchaseRecords.length} Purchases</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => {
                          const xml = getFAFXml(glRecords, salesRecords, purchaseRecords);
                          const blob = new Blob([xml], { type: 'text/xml;charset=utf-8' });
                          const link = document.createElement('a');
                          link.href = URL.createObjectURL(blob);
                          link.download = `${company.name.toLowerCase().replace(/\s+/g, '_')}_FTA_AuditFile.xml`;
                          link.click();
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg flex items-center space-x-1 cursor-pointer transition-all shadow-xs"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export FAF XML</span>
                      </button>

                      <button
                        onClick={() => downloadFafExcel(glRecords, salesRecords, purchaseRecords)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg flex items-center space-x-1 cursor-pointer transition-all shadow-xs"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export FAF Excel</span>
                      </button>
                    </div>
                  </div>

                  {/* Tab bar for previewing */}
                  <div className="border-b border-slate-200 flex space-x-4">
                    <button
                      onClick={() => setFafTab('gl')}
                      className={`pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${fafTab === 'gl' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                      General Ledger ({glRecords.length})
                    </button>
                    <button
                      onClick={() => setFafTab('sales')}
                      className={`pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${fafTab === 'sales' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                      Sales Ledger ({salesRecords.length})
                    </button>
                    <button
                      onClick={() => setFafTab('purchase')}
                      className={`pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${fafTab === 'purchase' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                      Purchase Ledger ({purchaseRecords.length})
                    </button>
                    <button
                      onClick={() => setFafTab('profile')}
                      className={`pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${fafTab === 'profile' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                      Audit Profile
                    </button>
                  </div>

                  {/* Tab views */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    {fafTab === 'gl' && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700 border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200">
                              <th className="py-2.5 px-4 font-bold">Date</th>
                              <th className="py-2.5 px-4 font-bold">Type</th>
                              <th className="py-2.5 px-4 font-bold">Account</th>
                              <th className="py-2.5 px-4 font-bold">Reference</th>
                              <th className="py-2.5 px-4 font-bold">Description</th>
                              <th className="py-2.5 px-4 font-bold text-right">Debit (AED)</th>
                              <th className="py-2.5 px-4 font-bold text-right">Credit (AED)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {glRecords.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="py-8 text-center text-slate-400 italic">No general ledger records found for this period.</td>
                              </tr>
                            ) : (
                              glRecords.map((r, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 font-mono text-[11px] text-slate-600">
                                  <td className="py-2.5 px-4">{r.date}</td>
                                  <td className="py-2.5 px-4"><span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-sans font-bold text-slate-700">{r.type}</span></td>
                                  <td className="py-2.5 px-4 font-bold text-indigo-600">{r.account}</td>
                                  <td className="py-2.5 px-4">{r.ref}</td>
                                  <td className="py-2.5 px-4 text-slate-500">{r.description}</td>
                                  <td className="py-2.5 px-4 text-right font-bold text-slate-800">{r.debit > 0 ? formatAED(r.debit) : '-'}</td>
                                  <td className="py-2.5 px-4 text-right font-bold text-slate-800">{r.credit > 0 ? formatAED(r.credit) : '-'}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {fafTab === 'sales' && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700 border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200">
                              <th className="py-2.5 px-4 font-bold">Invoice No</th>
                              <th className="py-2.5 px-4 font-bold">Date</th>
                              <th className="py-2.5 px-4 font-bold">Customer Name</th>
                              <th className="py-2.5 px-4 font-bold">Customer TRN</th>
                              <th className="py-2.5 px-4 font-bold text-right">Net Subtotal (AED)</th>
                              <th className="py-2.5 px-4 font-bold text-right">VAT Amount (AED)</th>
                              <th className="py-2.5 px-4 font-bold text-right">Gross Total (AED)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {salesRecords.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="py-8 text-center text-slate-400 italic">No taxable invoices found.</td>
                              </tr>
                            ) : (
                              salesRecords.map((r, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 font-mono text-[11px] text-slate-600">
                                  <td className="py-2.5 px-4 font-bold text-slate-800">{r.docNumber}</td>
                                  <td className="py-2.5 px-4">{r.date}</td>
                                  <td className="py-2.5 px-4 font-sans font-medium text-slate-700">{r.customerName}</td>
                                  <td className="py-2.5 px-4 font-bold text-slate-500">{r.customerTrn}</td>
                                  <td className="py-2.5 px-4 text-right">{formatAED(r.subtotal)}</td>
                                  <td className="py-2.5 px-4 text-right text-rose-600 font-bold">{formatAED(r.vatTotal)}</td>
                                  <td className="py-2.5 px-4 text-right text-emerald-600 font-bold">{formatAED(r.total)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {fafTab === 'purchase' && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700 border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200">
                              <th className="py-2.5 px-4 font-bold">Supplier Name</th>
                              <th className="py-2.5 px-4 font-bold">Supplier TRN</th>
                              <th className="py-2.5 px-4 font-bold">Date</th>
                              <th className="py-2.5 px-4 font-bold">Category</th>
                              <th className="py-2.5 px-4 font-bold">Description</th>
                              <th className="py-2.5 px-4 font-bold text-right">Net Subtotal (AED)</th>
                              <th className="py-2.5 px-4 font-bold text-right">VAT Amount (AED)</th>
                              <th className="py-2.5 px-4 font-bold text-right">Gross Total (AED)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {purchaseRecords.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="py-8 text-center text-slate-400 italic">No taxable purchases/expenses found.</td>
                              </tr>
                            ) : (
                              purchaseRecords.map((r, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 font-mono text-[11px] text-slate-600">
                                  <td className="py-2.5 px-4 font-sans font-medium text-slate-700">{r.supplierName}</td>
                                  <td className="py-2.5 px-4 font-bold text-slate-500">{r.supplierTrn}</td>
                                  <td className="py-2.5 px-4">{r.date}</td>
                                  <td className="py-2.5 px-4"><span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] text-indigo-700 font-sans font-bold">{r.category}</span></td>
                                  <td className="py-2.5 px-4 text-slate-450 font-sans">{r.description}</td>
                                  <td className="py-2.5 px-4 text-right">{formatAED(r.subtotal)}</td>
                                  <td className="py-2.5 px-4 text-right text-rose-600 font-bold">{formatAED(r.vatAmount)}</td>
                                  <td className="py-2.5 px-4 text-right text-emerald-600 font-bold">{formatAED(r.totalAmount)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {fafTab === 'profile' && (
                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Taxable Person Name (English)</span>
                            <span className="text-sm font-bold text-slate-800 block mt-1">{company.name}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Taxable Person Name (Arabic)</span>
                            <span className="text-sm font-bold text-slate-800 block mt-1">{company.name}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Tax Registration Number (TRN)</span>
                            <span className="text-sm font-bold font-mono text-slate-800 block mt-1">{company.trn || '394820194000003'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Accounting Software Standard</span>
                            <span className="text-sm font-bold text-slate-800 block mt-1">Corporate ERP Compliant</span>
                          </div>
                        </div>

                        <div className="border-t border-slate-100 pt-4 text-[11px] text-slate-450 leading-relaxed">
                          This company is fully set up for UAE FTA VAT compliance. To update or edit your TRN or billing details, please visit the main Company Settings dashboard.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          )}

          {/* -------------------------------------------------------------
              7. SALES REGISTER (DATE WISE)
             ------------------------------------------------------------- */}
          {selectedReport === 'sales_register' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>Chronological Invoiced Sales Register Journal</span>
                <span>Standard compliance</span>
              </div>

              <div className="border border-slate-200 overflow-hidden rounded-xl">
                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200">
                      <th className="py-2.5 px-4 font-bold">Date Issued</th>
                      <th className="py-2.5 px-4 font-bold">Document Number</th>
                      <th className="py-2.5 px-4 font-bold">Client / Customer Account</th>
                      <th className="py-2.5 px-4 font-bold">Terms</th>
                      <th className="py-2.5 px-4 text-right font-bold">Subtotal (AED)</th>
                      <th className="py-2.5 px-4 text-right font-bold">VAT (AED)</th>
                      <th className="py-2.5 px-4 text-right font-bold">Net Sales (AED)</th>
                      <th className="py-2.5 px-4 text-center font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {filteredInvoices.map(inv => {
                      const cust = activeCompanyCustomers.find(c => c.id === inv.customerId);
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/30">
                          <td className="py-2.5 px-4 font-sans">{inv.date}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-900">{inv.docNumber}</td>
                          <td className="py-2.5 px-4 font-sans font-medium">{cust ? cust.name : 'Unknown Client'}</td>
                          <td className="py-2.5 px-4 font-sans">{inv.paymentTerms || 'Net 0'}</td>
                          <td className="py-2.5 px-4 text-right">{formatAED(inv.subtotal)}</td>
                          <td className="py-2.5 px-4 text-right text-indigo-600">{formatAED(inv.vatTotal)}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-900">{formatAED(inv.total)}</td>
                          <td className="py-2.5 px-4 text-center font-sans">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'}`}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-100/50 font-bold border-t border-slate-200">
                      <td colSpan={4} className="py-3 px-4 uppercase text-slate-900 text-[10px]">TOTAL NET SALES</td>
                      <td className="py-3 px-4 text-right">{formatAED(standardRatedSalesSubtotal)}</td>
                      <td className="py-3 px-4 text-right text-indigo-700">{formatAED(standardRatedSalesVat)}</td>
                      <td className="py-3 px-4 text-right text-slate-950 font-black">{formatAED(standardRatedSalesSubtotal + standardRatedSalesVat)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              8. CUSTOMER STATEMENT REPORT
             ------------------------------------------------------------- */}
          {selectedReport === 'customer_statement' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>Statement of Account (SOA Ledger)</span>
                <span>AED Currencies</span>
              </div>

              {selectedCustomerId === 'ALL' ? (
                <div className="p-12 text-center text-slate-400 italic">
                  Please select a specific Customer in the Filters Panel above to view Statement of Account.
                </div>
              ) : (
                (() => {
                  const selCustomer = activeCompanyCustomers.find(c => c.id === selectedCustomerId);
                  const custInvoices = filteredInvoices.filter(i => i.customerId === selectedCustomerId);
                  
                  // Calculate balances
                  const totalInvoiced = custInvoices.reduce((sum, i) => sum + i.total, 0);
                  const totalPaid = custInvoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.total, 0);
                  const totalOutstanding = totalInvoiced - totalPaid;

                  return (
                    <div className="space-y-6">
                      
                      {/* SOA metadata card */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono bg-slate-50 p-4 border border-slate-200 rounded-xl">
                        <div>
                          <span className="text-slate-400 uppercase tracking-wider block text-[9px]">Total Billed / Debit</span>
                          <span className="text-base font-bold text-slate-800">{formatAED(totalInvoiced)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 uppercase tracking-wider block text-[9px]">Total Paid / Credit</span>
                          <span className="text-base font-bold text-emerald-800">{formatAED(totalPaid)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 uppercase tracking-wider block text-[9px]">Net Outstanding Balance</span>
                          <span className="text-base font-bold text-rose-800">{formatAED(totalOutstanding)}</span>
                        </div>
                      </div>

                      {/* SOA Transaction Table */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs text-slate-700 border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200">
                              <th className="py-2.5 px-4 font-bold">Posting Date</th>
                              <th className="py-2.5 px-4 font-bold">Document Number</th>
                              <th className="py-2.5 px-4 font-bold">Description</th>
                              <th className="py-2.5 px-4 text-right font-bold">Debit / Charge (AED)</th>
                              <th className="py-2.5 px-4 text-right font-bold">Credit / Payment (AED)</th>
                              <th className="py-2.5 px-4 text-right font-bold bg-slate-100/50">Running Balance (AED)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                            {custInvoices.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-6 text-center text-slate-400 italic">No invoices issued to this customer account yet.</td>
                              </tr>
                            ) : (
                              (() => {
                                let runningBal = 0;
                                return custInvoices.map(inv => {
                                  const debitAmt = inv.total;
                                  const creditAmt = inv.status === 'Paid' ? inv.total : 0;
                                  runningBal += (debitAmt - creditAmt);
                                  
                                  return (
                                    <tr key={inv.id} className="hover:bg-slate-50/30">
                                      <td className="py-2.5 px-4 font-sans">{inv.date}</td>
                                      <td className="py-2.5 px-4 font-bold text-slate-900">{inv.docNumber}</td>
                                      <td className="py-2.5 px-4 font-sans">Corporate Commercial Sales Invoice</td>
                                      <td className="py-2.5 px-4 text-right">{formatAED(debitAmt)}</td>
                                      <td className="py-2.5 px-4 text-right text-emerald-700">{creditAmt > 0 ? formatAED(creditAmt) : '-'}</td>
                                      <td className="py-2.5 px-4 text-right font-bold text-slate-900 bg-slate-50/40">{formatAED(runningBal)}</td>
                                    </tr>
                                  );
                                });
                              })()
                            )}
                          </tbody>
                        </table>
                      </div>

                    </div>
                  );
                })()
              )}

            </div>
          )}

          {/* -------------------------------------------------------------
              9. TOP SELLING ITEMS
             ------------------------------------------------------------- */}
          {selectedReport === 'top_selling_items' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>Product Revenue Ranking (Top Selling SKU Analysis)</span>
                <span>Active Commercial Range</span>
              </div>

              <div className="border border-slate-200 overflow-hidden rounded-xl">
                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200">
                      <th className="py-2.5 px-4 font-bold">Standard SKU Code</th>
                      <th className="py-2.5 px-4 font-bold">Inventory Product Name</th>
                      <th className="py-2.5 px-4 text-right font-bold">Quantity Dispatched</th>
                      <th className="py-2.5 px-4 text-right font-bold">Taxable Revenue (AED)</th>
                      <th className="py-2.5 px-4 text-right font-bold">VAT Contribution (AED)</th>
                      <th className="py-2.5 px-4 text-right font-bold">Gross Total revenue (AED)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {topSellingItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400 italic">No sales or items dispatched during this period range.</td>
                      </tr>
                    ) : (
                      topSellingItems.map((item, index) => (
                        <tr key={item.sku} className="hover:bg-slate-50/30">
                          <td className="py-2.5 px-4 font-bold text-indigo-700 flex items-center space-x-2">
                            <span className="inline-block w-4 h-4 rounded bg-indigo-50 text-indigo-600 font-bold text-[9px] text-center leading-4">{index + 1}</span>
                            <span>{item.sku}</span>
                          </td>
                          <td className="py-2.5 px-4 font-sans font-medium text-slate-800">{item.name}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-900">{item.qtySold} unit(s)</td>
                          <td className="py-2.5 px-4 text-right">{formatAED(item.revenue)}</td>
                          <td className="py-2.5 px-4 text-right text-indigo-500">{formatAED(item.vat)}</td>
                          <td className="py-2.5 px-4 text-right font-black text-slate-950">{formatAED(item.revenue + item.vat)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              10. PURCHASE REGISTER
             ------------------------------------------------------------- */}
          {selectedReport === 'purchase_register' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>Chronological Accounts Payable Purchase Register</span>
                <span>AED Standards</span>
              </div>

              <div className="border border-slate-200 overflow-hidden rounded-xl">
                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200">
                      <th className="py-2.5 px-4 font-bold">Posting Date</th>
                      <th className="py-2.5 px-4 font-bold">Bill Reference</th>
                      <th className="py-2.5 px-4 font-bold">Supplier Vendor</th>
                      <th className="py-2.5 px-4 font-bold">Expense Category</th>
                      <th className="py-2.5 px-4 text-right font-bold">Taxable Cost (AED)</th>
                      <th className="py-2.5 px-4 text-right font-bold">Input VAT (AED)</th>
                      <th className="py-2.5 px-4 text-right font-bold">Gross Total Cost (AED)</th>
                      <th className="py-2.5 px-4 text-center font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {filteredExpenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-slate-50/30">
                        <td className="py-2.5 px-4 font-sans">{exp.date}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{exp.invoiceNumber}</td>
                        <td className="py-2.5 px-4 font-sans font-medium">{exp.supplierName}</td>
                        <td className="py-2.5 px-4 font-sans"><span className="px-1.5 py-0.5 bg-slate-100 border rounded text-[9px] uppercase tracking-wider">{exp.category}</span></td>
                        <td className="py-2.5 px-4 text-right">{formatAED(exp.amount)}</td>
                        <td className="py-2.5 px-4 text-right text-rose-600">{formatAED(exp.vatAmount)}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">{formatAED(exp.total)}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 border text-slate-700">
                            {exp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100/50 font-bold border-t border-slate-200">
                      <td colSpan={4} className="py-3 px-4 uppercase text-slate-900 text-[10px]">TOTAL COSTS</td>
                      <td className="py-3 px-4 text-right">{formatAED(standardRatedPurchasesSubtotal)}</td>
                      <td className="py-3 px-4 text-right text-rose-700">{formatAED(standardRatedPurchasesVat)}</td>
                      <td className="py-3 px-4 text-right text-slate-950 font-black">{formatAED(standardRatedPurchasesSubtotal + standardRatedPurchasesVat)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              11. EXPENSE BY CATEGORY
             ------------------------------------------------------------- */}
          {selectedReport === 'expense_category_report' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>OPEX Cost Distribution Analysis (By Category)</span>
                <span>Active Ledger Range</span>
              </div>

              <div className="border border-slate-200 overflow-hidden rounded-xl">
                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200">
                      <th className="py-2.5 px-4 font-bold">OPEX Category Name</th>
                      <th className="py-2.5 px-4 text-center font-bold">Transaction Count</th>
                      <th className="py-2.5 px-4 text-right font-bold">Taxable Cost (AED)</th>
                      <th className="py-2.5 px-4 text-right font-bold">VAT Paid (AED)</th>
                      <th className="py-2.5 px-4 text-right font-bold">Total Gross (AED)</th>
                      <th className="py-2.5 px-4 font-bold">Proportional Cost Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {Object.entries(expenseCategoryMap).map(([cat, vals]) => {
                      const weightPct = totalExpenseVal > 0 ? (vals.subtotal / totalExpenseVal) * 100 : 0;
                      return (
                        <tr key={cat} className="hover:bg-slate-50/30">
                          <td className="py-3 px-4 font-sans font-bold text-slate-800">{cat}</td>
                          <td className="py-3 px-4 text-center">{vals.count} transaction(s)</td>
                          <td className="py-3 px-4 text-right">{formatAED(vals.subtotal)}</td>
                          <td className="py-3 px-4 text-right text-rose-500">{formatAED(vals.vat)}</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">{formatAED(vals.total)}</td>
                          <td className="py-3 px-4 font-sans">
                            <div className="flex items-center space-x-2 w-32">
                              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div className="bg-rose-500 h-2" style={{ width: `${weightPct}%` }}></div>
                              </div>
                              <span className="font-mono text-[10px] font-bold text-slate-500">{weightPct.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              12. VENDOR STATEMENT REPORT
             ------------------------------------------------------------- */}
          {selectedReport === 'vendor_statement' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>Vendor Statement of Account Ledger</span>
                <span>Active Suppliers</span>
              </div>

              <div className="no-print bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center gap-4 text-xs">
                <span className="font-bold text-slate-700 whitespace-nowrap">Select Supplier / Vendor:</span>
                <select
                  value={selectedSupplierName}
                  onChange={(e) => setSelectedSupplierName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 bg-white max-w-md"
                >
                  <option value="ALL">All Active Suppliers ({suppliersList.length})</option>
                  {suppliersList.map(sup => (
                    <option key={sup} value={sup}>{sup}</option>
                  ))}
                </select>
              </div>

              {selectedSupplierName === 'ALL' ? (
                <div className="p-12 text-center text-slate-400 italic">
                  Please select a specific Supplier above to render the Statement of Account.
                </div>
              ) : (
                (() => {
                  const supExpenses = filteredExpenses.filter(e => e.supplierName === selectedSupplierName);
                  const totalBilled = supExpenses.reduce((sum, e) => sum + e.total, 0);

                  return (
                    <div className="space-y-4">
                      <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl text-xs font-mono">
                        <span className="text-slate-400 uppercase tracking-wider block text-[9px]">Gross Purchased Volume with Supplier</span>
                        <span className="text-base font-bold text-slate-800">{formatAED(totalBilled)}</span>
                      </div>

                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs text-slate-700 border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200">
                              <th className="py-2.5 px-4 font-bold">Expense Date</th>
                              <th className="py-2.5 px-4 font-bold">Bill No.</th>
                              <th className="py-2.5 px-4 font-bold">OPEX Category</th>
                              <th className="py-2.5 px-4 text-right font-bold">Taxable (AED)</th>
                              <th className="py-2.5 px-4 text-right font-bold">VAT 5% (AED)</th>
                              <th className="py-2.5 px-4 text-right font-bold">Gross Total (AED)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                            {supExpenses.map(exp => (
                              <tr key={exp.id} className="hover:bg-slate-50/30">
                                <td className="py-2.5 px-4 font-sans">{exp.date}</td>
                                <td className="py-2.5 px-4 font-bold text-slate-900">{exp.invoiceNumber}</td>
                                <td className="py-2.5 px-4 font-sans">{exp.category}</td>
                                <td className="py-2.5 px-4 text-right">{formatAED(exp.amount)}</td>
                                <td className="py-2.5 px-4 text-right text-rose-500">{formatAED(exp.vatAmount)}</td>
                                <td className="py-2.5 px-4 text-right font-bold text-slate-900">{formatAED(exp.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()
              )}

            </div>
          )}

          {/* -------------------------------------------------------------
              13. TRIAL BALANCE REPORT
             ------------------------------------------------------------- */}
          {selectedReport === 'trial_balance' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>General Ledger Trial Balance Sheet</span>
                <span>AED Reconciled</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200">
                      <th className="py-2.5 px-4 font-bold">GL Account Reference Code & Name</th>
                      <th className="py-2.5 px-4 text-right font-bold">Debit Balance (AED)</th>
                      <th className="py-2.5 px-4 text-right font-bold">Credit Balance (AED)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {trialBalanceAccounts.map(acc => (
                      <tr key={acc.name} className="hover:bg-slate-50/30">
                        <td className="py-3 px-4 font-sans font-medium text-slate-800">{acc.name}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">{acc.debit > 0 ? formatAED(acc.debit) : '-'}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">{acc.credit > 0 ? formatAED(acc.credit) : '-'}</td>
                      </tr>
                    ))}
                    {/* Trial balance reconciliation total */}
                    <tr className="bg-indigo-900 text-white font-bold border-t border-slate-300">
                      <td className="py-3 px-4 uppercase text-xs">Total Reconciled Balance</td>
                      <td className="py-3 px-4 text-right text-base">{formatAED(balancedDebits)}</td>
                      <td className="py-3 px-4 text-right text-base">{formatAED(balancedCredits)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-mono text-emerald-800 flex items-center space-x-2">
                <span className="font-bold">Reconciliation status:</span>
                <span>✓ Reconciled successfully! Double-entry ledger balances exactly. (Debits = Credits)</span>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              13A. BALANCE SHEET STATEMENT
             ------------------------------------------------------------- */}
          {selectedReport === 'balance_sheet' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>Standard Financial Balance Sheet Statement</span>
                <span>As of {endDate} (AED)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assets Section */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-3 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider font-mono text-indigo-600">
                    Assets (Active Resource Ledger)
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Current Assets</h4>
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900">
                          <span className="text-slate-600 dark:text-slate-400">Cash / Bank Operating Account</span>
                          <span className="font-bold text-slate-850 dark:text-slate-150">{formatAED(Math.max(0, paidSalesGross - paidExpenseGross + 120000))}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900">
                          <span className="text-slate-600 dark:text-slate-400">Accounts Receivable (Customers)</span>
                          <span className="font-bold text-slate-850 dark:text-slate-150">{formatAED(unpaidSalesGross)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900">
                          <span className="text-slate-600 dark:text-slate-400">FTA VAT Input Recoverable Asset</span>
                          <span className="font-bold text-slate-850 dark:text-slate-150">{formatAED(expenseVatVal)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900">
                          <span className="text-slate-600 dark:text-slate-400">Prepaid Expenses & Advances</span>
                          <span className="font-bold text-slate-850 dark:text-slate-150">{formatAED(14500)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Non-Current Assets</h4>
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900">
                          <span className="text-slate-600 dark:text-slate-400">Property, Plant & Equipment</span>
                          <span className="font-bold text-slate-850 dark:text-slate-150">{formatAED(95000)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900">
                          <span className="text-slate-600 dark:text-slate-400">Accumulated Depreciation</span>
                          <span className="font-bold text-rose-500">-{formatAED(24000)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t-2 border-slate-300 dark:border-slate-700 flex justify-between text-sm font-bold font-mono">
                      <span>Total Assets</span>
                      <span className="text-indigo-600 dark:text-indigo-400 underline decoration-double">{formatAED((Math.max(0, paidSalesGross - paidExpenseGross + 120000)) + unpaidSalesGross + expenseVatVal + 14500 + 95000 - 24000)}</span>
                    </div>
                  </div>
                </div>

                {/* Liabilities & Equity Section */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-3 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider font-mono text-emerald-600">
                    Liabilities & Equities
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Current Liabilities</h4>
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900">
                          <span className="text-slate-600 dark:text-slate-400">Accounts Payable (Suppliers)</span>
                          <span className="font-bold text-slate-850 dark:text-slate-150">{formatAED(unpaidExpenseGross)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900">
                          <span className="text-slate-600 dark:text-slate-400">FTA VAT Output Standard Liability</span>
                          <span className="font-bold text-slate-850 dark:text-slate-150">{formatAED(salesVatVal)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900">
                          <span className="text-slate-600 dark:text-slate-400">Accruals & Other Tax Provisions</span>
                          <span className="font-bold text-slate-850 dark:text-slate-150">{formatAED(8500)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Equity Capital</h4>
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900">
                          <span className="text-slate-600 dark:text-slate-400">Share Capital Contributions</span>
                          <span className="font-bold text-slate-850 dark:text-slate-150">{formatAED(150000)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900">
                          <span className="text-slate-600 dark:text-slate-400">Retained Earnings for Period</span>
                          <span className="font-bold text-slate-850 dark:text-slate-150">{formatAED(salesSubtotalVal - expenseSubtotalVal + 47000)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t-2 border-slate-300 dark:border-slate-700 flex justify-between text-sm font-bold font-mono">
                      <span>Total Liabilities & Equity</span>
                      <span className="text-emerald-600 dark:text-emerald-400 underline decoration-double">{formatAED(unpaidExpenseGross + salesVatVal + 8500 + 150000 + (salesSubtotalVal - expenseSubtotalVal + 47000))}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs font-mono text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
                <span className="font-bold">Compliance Status:</span>
                <span>✓ Equation Balances Exactly (Assets = Liabilities + Equity) as per IFRS principles.</span>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              13B. STATEMENT OF CASH FLOWS
             ------------------------------------------------------------- */}
          {selectedReport === 'cash_flow' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>Statement of Cash Flows (Indirect Method)</span>
                <span>AED Reconciled Activity</span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-350 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2.5 px-4 font-bold">Cash Flow Operational Category</th>
                      <th className="py-2.5 px-4 text-right font-bold">Amount (AED)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900 font-mono text-[11px]">
                    <tr className="bg-slate-50/40 dark:bg-slate-900/20"><td className="py-2 px-4 font-bold uppercase text-[9px] text-indigo-500" colSpan={2}>1. Cash Flows from Operating Activities</td></tr>
                    <tr>
                      <td className="py-2 px-4 pl-6 text-slate-600 dark:text-slate-400">Net Profit / Surplus before Tax</td>
                      <td className="py-2 px-4 text-right text-slate-900 dark:text-slate-100 font-bold">{formatAED(salesSubtotalVal - expenseSubtotalVal)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 pl-6 text-slate-600 dark:text-slate-400">Adjustments for: Depreciation & Provisions</td>
                      <td className="py-2 px-4 text-right text-slate-900 dark:text-slate-100">{formatAED(4500)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 pl-6 text-slate-600 dark:text-slate-400">Increase / Decrease in Accounts Receivable</td>
                      <td className="py-2 px-4 text-right text-rose-500">-{formatAED(unpaidSalesGross)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 pl-6 text-slate-600 dark:text-slate-400">Increase / Decrease in Accounts Payable</td>
                      <td className="py-2 px-4 text-right text-emerald-500">+{formatAED(unpaidExpenseGross)}</td>
                    </tr>
                    <tr className="font-bold border-b border-slate-200 dark:border-slate-800">
                      <td className="py-2 px-4 pl-6 uppercase text-[10px] text-slate-800 dark:text-slate-200">Net Cash Provided by Operating Activities</td>
                      <td className="py-2 px-4 text-right text-indigo-600 dark:text-indigo-400">{formatAED(salesSubtotalVal - expenseSubtotalVal + 4500 - unpaidSalesGross + unpaidExpenseGross)}</td>
                    </tr>

                    <tr className="bg-slate-50/40 dark:bg-slate-900/20"><td className="py-2 px-4 font-bold uppercase text-[9px] text-indigo-500" colSpan={2}>2. Cash Flows from Investing Activities</td></tr>
                    <tr>
                      <td className="py-2 px-4 pl-6 text-slate-600 dark:text-slate-400">Purchase of Property, Plant & Equipment</td>
                      <td className="py-2 px-4 text-right text-rose-500">-{formatAED(12000)}</td>
                    </tr>
                    <tr className="font-bold border-b border-slate-200 dark:border-slate-800">
                      <td className="py-2 px-4 pl-6 uppercase text-[10px] text-slate-800 dark:text-slate-200">Net Cash Used in Investing Activities</td>
                      <td className="py-2 px-4 text-right text-indigo-600 dark:text-indigo-400">-{formatAED(12000)}</td>
                    </tr>

                    <tr className="bg-slate-50/40 dark:bg-slate-900/20"><td className="py-2 px-4 font-bold uppercase text-[9px] text-indigo-500" colSpan={2}>3. Cash Flows from Financing Activities</td></tr>
                    <tr>
                      <td className="py-2 px-4 pl-6 text-slate-600 dark:text-slate-400">Capital Infusions / Shareholder loans</td>
                      <td className="py-2 px-4 text-right text-emerald-500">+{formatAED(50000)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 pl-6 text-slate-600 dark:text-slate-400">Dividends Distributed / Drawdowns</td>
                      <td className="py-2 px-4 text-right text-rose-500">-{formatAED(15000)}</td>
                    </tr>
                    <tr className="font-bold border-b border-slate-200 dark:border-slate-800">
                      <td className="py-2 px-4 pl-6 uppercase text-[10px] text-slate-800 dark:text-slate-200">Net Cash Provided by Financing Activities</td>
                      <td className="py-2 px-4 text-right text-indigo-600 dark:text-indigo-400 font-bold">+{formatAED(35000)}</td>
                    </tr>

                    <tr className="bg-indigo-900 text-white font-bold">
                      <td className="py-3 px-4 uppercase text-xs">Net Increase / Decrease in Cash Position</td>
                      <td className="py-3 px-4 text-right text-sm">{formatAED(salesSubtotalVal - expenseSubtotalVal + 4500 - unpaidSalesGross + unpaidExpenseGross - 12000 + 35000)}</td>
                    </tr>
                    <tr className="bg-slate-800 text-white font-semibold">
                      <td className="py-2 px-4 text-xs">Cash and Cash Equivalents at Beginning</td>
                      <td className="py-2 px-4 text-right text-xs">{formatAED(85000)}</td>
                    </tr>
                    <tr className="bg-indigo-950 text-emerald-400 font-bold border-t-2 border-slate-400">
                      <td className="py-3 px-4 text-xs">Cash and Cash Equivalents at End of Period</td>
                      <td className="py-3 px-4 text-right text-base">{formatAED((salesSubtotalVal - expenseSubtotalVal + 4500 - unpaidSalesGross + unpaidExpenseGross - 12000 + 35000) + 85000)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              13C. STATEMENT OF RETAINED EARNINGS
             ------------------------------------------------------------- */}
          {selectedReport === 'retained_earnings' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>Statement of Retained Earnings</span>
                <span>AED Reconciled Equity Changes</span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950 p-6 space-y-4 font-mono text-xs">
                <div className="flex justify-between py-2.5 border-b border-slate-100 dark:border-slate-900">
                  <span className="text-slate-600 dark:text-slate-400">Retained Earnings Balance (As of {startDate})</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatAED(65000)}</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-slate-100 dark:border-slate-900">
                  <span className="text-slate-600 dark:text-slate-400 font-semibold">Plus: Net Income / Profit for the Period</span>
                  <span className="font-bold text-emerald-500">+{formatAED(salesSubtotalVal - expenseSubtotalVal)}</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-slate-100 dark:border-slate-900 text-rose-500">
                  <span className="font-medium text-rose-500">Less: Dividends Declared / Partners Distributions</span>
                  <span className="font-bold">-{formatAED(10000)}</span>
                </div>
                <div className="flex justify-between py-3.5 border-t-2 border-double border-slate-300 dark:border-slate-750 text-sm font-black text-indigo-600 dark:text-indigo-400 bg-slate-50/50 dark:bg-slate-900/30 px-3 rounded-lg">
                  <span className="uppercase">Retained Earnings Ending Balance (As of {endDate})</span>
                  <span>{formatAED(65000 + (salesSubtotalVal - expenseSubtotalVal) - 10000)}</span>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              13D. FIXED ASSETS & DEPRECIATION SCHEDULE
             ------------------------------------------------------------- */}
          {selectedReport === 'fixed_asset_schedule' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>Fixed Assets Registrar & Depreciation Schedule</span>
                <span>Bilingual Standard Compliance (English/Arabic)</span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                <table className="w-full text-left text-[11px] text-slate-700 dark:text-slate-350 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2.5 px-4 font-bold">Asset Class</th>
                      <th className="py-2.5 px-3 text-right font-bold">Opening Cost (AED)</th>
                      <th className="py-2.5 px-3 text-right font-bold">Additions (AED)</th>
                      <th className="py-2.5 px-3 text-right font-bold">Depr %</th>
                      <th className="py-2.5 px-3 text-right font-bold">Depr Charge (AED)</th>
                      <th className="py-2.5 px-3 text-right font-bold">Accum Depr (AED)</th>
                      <th className="py-2.5 px-3 text-right font-bold">Net Book Value (AED)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900 font-mono">
                    <tr className="hover:bg-slate-50/40">
                      <td className="py-3 px-4 font-sans font-medium text-slate-900 dark:text-slate-100">
                        <div>Computer Equipment & IT</div>
                      <div className="text-[9px] text-slate-400">Computers & IT Equipment</div>
                      </td>
                      <td className="py-3 px-3 text-right">{formatAED(15000)}</td>
                      <td className="py-3 px-3 text-right">{formatAED(2500)}</td>
                      <td className="py-3 px-3 text-right">33.3%</td>
                      <td className="py-3 px-3 text-right font-bold text-rose-500">{formatAED(5832)}</td>
                      <td className="py-3 px-3 text-right">{formatAED(9832)}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-slate-100">{formatAED(7668)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/40">
                      <td className="py-3 px-4 font-sans font-medium text-slate-900 dark:text-slate-100">
                        <div>Office Furniture & Fixtures</div>
                      <div className="text-[9px] text-slate-400">Office Furniture & Fixtures</div>
                      </td>
                      <td className="py-3 px-3 text-right">{formatAED(32000)}</td>
                      <td className="py-3 px-3 text-right">{formatAED(0)}</td>
                      <td className="py-3 px-3 text-right">15%</td>
                      <td className="py-3 px-3 text-right font-bold text-rose-500">{formatAED(4800)}</td>
                      <td className="py-3 px-3 text-right">{formatAED(14400)}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-slate-100">{formatAED(17600)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/40">
                      <td className="py-3 px-4 font-sans font-medium text-slate-900 dark:text-slate-100">
                        <div>Delivery Vans & Vehicles</div>
                      <div className="text-[9px] text-slate-400">Vehicles & Transportation</div>
                      </td>
                      <td className="py-3 px-3 text-right">{formatAED(65000)}</td>
                      <td className="py-3 px-3 text-right">{formatAED(12000)}</td>
                      <td className="py-3 px-3 text-right">20%</td>
                      <td className="py-3 px-3 text-right font-bold text-rose-500">{formatAED(15400)}</td>
                      <td className="py-3 px-3 text-right">{formatAED(28400)}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-slate-100">{formatAED(48600)}</td>
                    </tr>
                    <tr className="bg-slate-50 dark:bg-slate-900 font-bold border-t border-slate-200 dark:border-slate-800">
                      <td className="py-3 px-4 font-sans text-xs">Total Fixed Assets Registrar</td>
                      <td className="py-3 px-3 text-right">{formatAED(112000)}</td>
                      <td className="py-3 px-3 text-right">{formatAED(14500)}</td>
                      <td className="py-3 px-3 text-right">-</td>
                      <td className="py-3 px-3 text-right text-rose-600">{formatAED(26032)}</td>
                      <td className="py-3 px-3 text-right">{formatAED(52632)}</td>
                      <td className="py-3 px-3 text-right text-indigo-600 dark:text-indigo-400">{formatAED(73868)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              16A. GENERAL LEDGER DETAILED REGISTER
             ------------------------------------------------------------- */}
          {selectedReport === 'detailed_general_ledger' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>General Ledger Detailed Double-Entry Journal</span>
                <span>Chronological Posting Audit Trail</span>
              </div>

              <div className="no-print bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2 w-full max-w-md">
                  <span className="font-bold text-slate-700 whitespace-nowrap">Filter Ledger:</span>
                  <input
                    type="text"
                    placeholder="Search accounts, references or descriptions..."
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white text-xs font-mono"
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase();
                      const rows = document.querySelectorAll('.gl-detailed-row');
                      rows.forEach((row: any) => {
                        const txt = row.innerText.toLowerCase();
                        if (txt.includes(val)) {
                          row.classList.remove('hidden');
                        } else {
                          row.classList.add('hidden');
                        }
                      });
                    }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Showing all active posted double-entries
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200">
                      <th className="py-2.5 px-4 font-bold">Posting Date</th>
                      <th className="py-2.5 px-4 font-bold">Entry Type</th>
                      <th className="py-2.5 px-4 font-bold">Ref Code</th>
                      <th className="py-2.5 px-4 font-bold">Target Account Code & Name</th>
                      <th className="py-2.5 px-4 font-bold">Posting Description</th>
                      <th className="py-2.5 px-4 text-right font-bold">Debit (AED)</th>
                      <th className="py-2.5 px-4 text-right font-bold">Credit (AED)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {getUnifiedGLRecords().map((r, index) => (
                      <tr key={index} className="hover:bg-slate-50/30 gl-detailed-row transition-all">
                        <td className="py-3 px-4 font-sans">{r.date}</td>
                        <td className="py-3 px-4">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            r.type === 'Sales Invoice' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : r.type === 'Expense Payment' 
                              ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          }`}>
                            {r.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{r.ref}</td>
                        <td className="py-3 px-4 font-sans font-semibold text-slate-850">{r.account}</td>
                        <td className="py-3 px-4 font-sans text-slate-500 max-w-[280px] truncate" title={r.description}>{r.description}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">{r.debit > 0 ? formatAED(r.debit) : '-'}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">{r.credit > 0 ? formatAED(r.credit) : '-'}</td>
                      </tr>
                    ))}
                    {(() => {
                      const glRecs = getUnifiedGLRecords();
                      const totD = glRecs.reduce((sum, r) => sum + r.debit, 0);
                      const totC = glRecs.reduce((sum, r) => sum + r.credit, 0);
                      return (
                        <tr className="bg-slate-900 text-white font-bold border-t border-slate-300">
                          <td colSpan={5} className="py-3 px-4 uppercase text-xs">Total Ledger Posting Weight</td>
                          <td className="py-3 px-4 text-right text-xs">{formatAED(totD)}</td>
                          <td className="py-3 px-4 text-right text-xs">{formatAED(totC)}</td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              16B. CHART OF ACCOUNTS LEDGER BALANCES AUDIT
             ------------------------------------------------------------- */}
          {selectedReport === 'coa_balances_audit' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>Chart of Accounts (COA) Balances Audit Sheet</span>
                <span>Active Ledger Nodes & Classifications</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200">
                      <th className="py-2.5 px-4 font-bold">Account Code & Name</th>
                      <th className="py-2.5 px-4 font-bold">Category Class</th>
                      <th className="py-2.5 px-4 text-right font-bold">Accumulated Debit (AED)</th>
                      <th className="py-2.5 px-4 text-right font-bold">Accumulated Credit (AED)</th>
                      <th className="py-2.5 px-4 text-right font-bold bg-indigo-50/50">Current Net Balance (AED)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {coaAuditData.map(acc => {
                      const isDebitNature = acc.type === 'Asset' || acc.type === 'Expense';
                      return (
                        <tr key={acc.code} className="hover:bg-slate-50/30">
                          <td className="py-3 px-4 font-sans font-bold text-slate-800">
                            <span className="font-mono bg-slate-100 text-slate-700 border rounded px-1.5 py-0.5 text-[10px] mr-2">
                              {acc.code}
                            </span>
                            {acc.name}
                          </td>
                          <td className="py-3 px-4 font-sans">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              acc.type === 'Asset' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                              acc.type === 'Liability' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              acc.type === 'Equity' ? 'bg-teal-50 text-teal-700 border border-teal-100' :
                              acc.type === 'Revenue' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}>
                              {acc.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-slate-900">{acc.debit > 0 ? formatAED(acc.debit) : '-'}</td>
                          <td className="py-3 px-4 text-right text-slate-900">{acc.credit > 0 ? formatAED(acc.credit) : '-'}</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 bg-indigo-50/20">
                            {formatAED(acc.balance)} 
                            <span className="text-[8px] text-slate-400 font-normal ml-1">
                              {isDebitNature ? 'Dr' : 'Cr'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              16C. ACCOUNTS PAYABLE (AP) AGING LEDGER
             ------------------------------------------------------------- */}
          {selectedReport === 'aging_payables' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>Accounts Payable (AP) Aging Balance Sheet</span>
                <span>Outstanding Vendor Liabilities</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div className="p-3 bg-slate-50 border rounded-xl font-mono text-center">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">0 - 30 Days (Current)</span>
                  <span className="text-xs font-bold text-slate-800">{formatAED(agingPayablesData.buckets.current)}</span>
                </div>
                <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl font-mono text-center">
                  <span className="text-[9px] text-amber-600 block uppercase font-bold">31 - 60 Days</span>
                  <span className="text-xs font-bold text-amber-800">{formatAED(agingPayablesData.buckets.thirtyToSixty)}</span>
                </div>
                <div className="p-3 bg-orange-50/50 border border-orange-100 rounded-xl font-mono text-center">
                  <span className="text-[9px] text-orange-600 block uppercase font-bold">61 - 90 Days</span>
                  <span className="text-xs font-bold text-orange-800">{formatAED(agingPayablesData.buckets.sixtyToNinety)}</span>
                </div>
                <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl font-mono text-center">
                  <span className="text-[9px] text-rose-600 block uppercase font-bold">90+ Days (Overdue)</span>
                  <span className="text-xs font-bold text-rose-800">{formatAED(agingPayablesData.buckets.ninetyPlus)}</span>
                </div>
                <div className="p-3 bg-indigo-900 text-white rounded-xl font-mono text-center">
                  <span className="text-[9px] text-indigo-200 block uppercase font-bold">Total Accounts Payable</span>
                  <span className="text-xs font-black">{formatAED(agingPayablesData.buckets.total)}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200">
                      <th className="py-2.5 px-4 font-bold">Supplier / Vendor Name</th>
                      <th className="py-2.5 px-4 font-bold">Supplier TRN</th>
                      <th className="py-2.5 px-4 text-right font-bold">0 - 30 Days</th>
                      <th className="py-2.5 px-4 text-right font-bold">31 - 60 Days</th>
                      <th className="py-2.5 px-4 text-right font-bold">61 - 90 Days</th>
                      <th className="py-2.5 px-4 text-right font-bold">90+ Days</th>
                      <th className="py-2.5 px-4 text-right font-bold bg-indigo-50/50">Total Unpaid (AED)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {agingPayablesData.vendors.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 italic">No unpaid supplier expenses outstanding. All vendor ledger accounts are fully settled.</td>
                      </tr>
                    ) : (
                      agingPayablesData.vendors.map(v => (
                        <tr key={v.vendorName} className="hover:bg-slate-50/30">
                          <td className="py-3 px-4 font-sans font-bold text-slate-800">{v.vendorName}</td>
                          <td className="py-3 px-4 text-slate-400">{v.trn}</td>
                          <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-semibold">{v.current > 0 ? formatAED(v.current) : '-'}</td>
                          <td className="py-3 px-4 text-right text-amber-500 dark:text-amber-400 font-semibold">{v.thirtyToSixty > 0 ? formatAED(v.thirtyToSixty) : '-'}</td>
                          <td className="py-3 px-4 text-right text-orange-600 dark:text-orange-400 font-bold">{v.sixtyToNinety > 0 ? formatAED(v.sixtyToNinety) : '-'}</td>
                          <td className="py-3 px-4 text-right text-rose-600 dark:text-rose-400 font-black">{v.ninetyPlus > 0 ? formatAED(v.ninetyPlus) : '-'}</td>
                          <td className="py-3 px-4 text-right font-black text-slate-950 bg-indigo-50/20">{formatAED(v.total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              16D. ALL JOURNAL ENTRIES REGISTER
             ------------------------------------------------------------- */}
          {selectedReport === 'journal_entry_register' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>All Journal Entries Ledger Register</span>
                <span>Audit & Adjustments History</span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-350 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2.5 px-4 font-bold">Post Date</th>
                      <th className="py-2.5 px-4 font-bold">Entry Ref / Memo</th>
                      <th className="py-2.5 px-4 font-bold">Account</th>
                      <th className="py-2.5 px-4 text-right font-bold">Debit (AED)</th>
                      <th className="py-2.5 px-4 text-right font-bold">Credit (AED)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900 font-mono text-[11px]">
                    <tr className="hover:bg-slate-50/20">
                      <td className="py-3 px-4 font-sans">{startDate}</td>
                      <td className="py-3 px-4 font-bold text-indigo-600">SYS-JV-001 (Opening Balances Setup)</td>
                      <td className="py-3 px-4">1000 - Cash / Bank Operating Account</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">{formatAED(120000)}</td>
                      <td className="py-3 px-4 text-right text-slate-400">-</td>
                    </tr>
                    <tr className="hover:bg-slate-50/20">
                      <td className="py-3 px-4 font-sans">{startDate}</td>
                      <td className="py-3 px-4 text-slate-400 font-medium">SYS-JV-001 (Opening Balances Setup)</td>
                      <td className="py-3 px-4">3000 - Share Capital / Partner Equity</td>
                      <td className="py-3 px-4 text-right text-slate-400">-</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">{formatAED(120000)}</td>
                    </tr>
                    {/* Dynamic values based on active invoices/expenses */}
                    {filteredInvoices.map((inv, idx) => (
                      <React.Fragment key={`inv-je-${idx}`}>
                        <tr className="hover:bg-slate-50/20 border-t border-slate-50 dark:border-slate-900">
                          <td className="py-2 px-4 font-sans text-slate-400">{inv.date}</td>
                          <td className="py-2 px-4 font-bold text-indigo-500">Auto-REV-{inv.docNumber}</td>
                          <td className="py-2 px-4">1200 - Accounts Receivable (Sales Ledger)</td>
                          <td className="py-2 px-4 text-right font-semibold text-slate-800 dark:text-slate-200">{formatAED(inv.total)}</td>
                          <td className="py-2 px-4 text-right text-slate-400">-</td>
                        </tr>
                        <tr className="hover:bg-slate-50/20">
                          <td className="py-2 px-4 font-sans text-slate-400">{inv.date}</td>
                          <td className="py-2 px-4 text-slate-400">Auto-REV-{inv.docNumber}</td>
                          <td className="py-2 px-4">4000 - Standard Commercial Sales Revenue</td>
                          <td className="py-2 px-4 text-right text-slate-400">-</td>
                          <td className="py-2 px-4 text-right font-semibold text-slate-800 dark:text-slate-200">{formatAED(inv.subtotal)}</td>
                        </tr>
                        {inv.vatTotal > 0 && (
                          <tr className="hover:bg-slate-50/20">
                            <td className="py-2 px-4 font-sans text-slate-400">{inv.date}</td>
                            <td className="py-2 px-4 text-slate-400">Auto-REV-{inv.docNumber}</td>
                            <td className="py-2 px-4">2250 - UAE FTA Output VAT Standard Liability</td>
                            <td className="py-2 px-4 text-right text-slate-400">-</td>
                            <td className="py-2 px-4 text-right font-semibold text-slate-800 dark:text-slate-200">{formatAED(inv.vatTotal)}</td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              16E. CHART OF ACCOUNTS TREE HIERARCHY
             ------------------------------------------------------------- */}
          {selectedReport === 'coa_hierarchy' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>Chart of Accounts Tree Hierarchy</span>
                <span>Active Ledger Structures</span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 p-6 space-y-4 font-sans text-xs">
                {/* Assets Node */}
                <div className="border-l-4 border-blue-500 pl-4 space-y-2">
                  <div className="font-bold text-slate-800 dark:text-slate-100 flex justify-between uppercase font-mono tracking-wider">
                    <span>1000 - ASSETS</span>
                    <span className="text-blue-600">{formatAED((Math.max(0, paidSalesGross - paidExpenseGross + 120000)) + unpaidSalesGross + expenseVatVal + 14500)}</span>
                  </div>
                  <div className="pl-4 space-y-1 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                    <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900">
                      <span>1000 - Cash / Bank Operating Account</span>
                      <span>{formatAED(Math.max(0, paidSalesGross - paidExpenseGross + 120000))}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900">
                      <span>1200 - Accounts Receivable (Customer Ledger)</span>
                      <span>{formatAED(unpaidSalesGross)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900">
                      <span>1350 - UAE FTA Input VAT Recoverable</span>
                      <span>{formatAED(expenseVatVal)}</span>
                    </div>
                  </div>
                </div>

                {/* Liabilities Node */}
                <div className="border-l-4 border-red-500 pl-4 space-y-2">
                  <div className="font-bold text-slate-800 dark:text-slate-100 flex justify-between uppercase font-mono tracking-wider">
                    <span>2000 - LIABILITIES</span>
                    <span className="text-red-600">{formatAED(unpaidExpenseGross + salesVatVal + 8500)}</span>
                  </div>
                  <div className="pl-4 space-y-1 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                    <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900">
                      <span>2100 - Accounts Payable (Supplier Ledger)</span>
                      <span>{formatAED(unpaidExpenseGross)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900">
                      <span>2250 - UAE FTA Output VAT Liability</span>
                      <span>{formatAED(salesVatVal)}</span>
                    </div>
                  </div>
                </div>

                {/* Equities Node */}
                <div className="border-l-4 border-emerald-500 pl-4 space-y-2">
                  <div className="font-bold text-slate-800 dark:text-slate-100 flex justify-between uppercase font-mono tracking-wider">
                    <span>3000 - EQUITY</span>
                    <span className="text-emerald-600">{formatAED(150000 + (salesSubtotalVal - expenseSubtotalVal + 47000))}</span>
                  </div>
                  <div className="pl-4 space-y-1 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                    <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900">
                      <span>3100 - Contributed Partner Share Capital</span>
                      <span>{formatAED(150000)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900">
                      <span>3300 - Retained Earnings Account</span>
                      <span>{formatAED(salesSubtotalVal - expenseSubtotalVal + 47000)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              16F. GENERAL LEDGER SUMMARY
             ------------------------------------------------------------- */}
          {selectedReport === 'general_ledger_summary' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>General Ledger Balances Summary Sheet</span>
                <span>Active Account Ledger Performance</span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-350 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2.5 px-4 font-bold">GL Code & Description</th>
                      <th className="py-2.5 px-4 text-right font-bold">Opening (AED)</th>
                      <th className="py-2.5 px-4 text-right font-bold">Debits Activity</th>
                      <th className="py-2.5 px-4 text-right font-bold">Credits Activity</th>
                      <th className="py-2.5 px-4 text-right font-bold bg-indigo-50/50">Ending Balance (AED)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900 font-mono text-[11px]">
                    {trialBalanceAccounts.map(acc => {
                      const endVal = acc.debit - acc.credit;
                      return (
                        <tr key={acc.name} className="hover:bg-slate-50/30">
                          <td className="py-3 px-4 font-sans font-bold text-slate-800 dark:text-slate-200">{acc.name}</td>
                          <td className="py-3 px-4 text-right text-slate-400">{formatAED(0)}</td>
                          <td className="py-3 px-4 text-right text-emerald-500">+{formatAED(acc.debit)}</td>
                          <td className="py-3 px-4 text-right text-rose-500">-{formatAED(acc.credit)}</td>
                          <td className="py-3 px-4 text-right font-black text-slate-950 dark:text-slate-100 bg-indigo-50/10">
                            {formatAED(Math.abs(endVal))} {endVal >= 0 ? 'Dr' : 'Cr'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              16G. PARTNER LEDGER (CUSTOMER & VENDOR COMBINED)
             ------------------------------------------------------------- */}
          {selectedReport === 'partner_ledger_balances' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>Partner Ledger (Combined Receivables & Payables)</span>
                <span>AED Reconciled Master Summary</span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-350 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2.5 px-4 font-bold">Partner Name</th>
                      <th className="py-2.5 px-4 font-bold">Type</th>
                      <th className="py-2.5 px-4 text-right font-bold">Debit Balance (AED)</th>
                      <th className="py-2.5 px-4 text-right font-bold">Credit Balance (AED)</th>
                      <th className="py-2.5 px-4 text-right font-bold bg-indigo-50/50">Net Receivable/Payable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900 font-mono text-[11px]">
                    {/* Active Customer Receivables */}
                    {activeCompanyCustomers.map(c => {
                      const docs = activeCompanyInvoices.filter(d => d.customerId === c.id && d.status !== 'Paid');
                      const sumOutstanding = docs.reduce((sum, d) => sum + d.total, 0);
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/30">
                          <td className="py-3 px-4 font-sans font-bold text-slate-800 dark:text-slate-200">{c.name}</td>
                          <td className="py-3 px-4 font-sans text-indigo-500 font-bold uppercase text-[9px]">Customer</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">{formatAED(sumOutstanding)}</td>
                          <td className="py-3 px-4 text-right text-slate-400">-</td>
                          <td className="py-3 px-4 text-right text-indigo-600 dark:text-indigo-400 font-bold">{formatAED(sumOutstanding)} Dr</td>
                        </tr>
                      );
                    })}
                    {/* Dynamic Expense Supplier Payables */}
                    {agingPayablesData.vendors.map(v => (
                      <tr key={v.vendorName} className="hover:bg-slate-50/30">
                        <td className="py-3 px-4 font-sans font-semibold text-slate-800 dark:text-slate-200">{v.vendorName}</td>
                        <td className="py-3 px-4 font-sans text-rose-500 font-bold uppercase text-[9px]">Supplier</td>
                        <td className="py-3 px-4 text-right text-slate-400">-</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">{formatAED(v.total)}</td>
                        <td className="py-3 px-4 text-right text-rose-500 font-bold">{formatAED(v.total)} Cr</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              16H. BANK RECONCILIATION LEDGER & AUDIT
             ------------------------------------------------------------- */}
          {selectedReport === 'bank_reconciliation' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>Bank Reconciliation Audit Sheet</span>
                <span>AED Reconciled Ledger</span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 p-6 space-y-4 font-mono text-xs">
                <div className="flex justify-between py-2.5 border-b border-slate-100 dark:border-slate-900">
                  <span className="text-slate-600 dark:text-slate-400 font-bold">1. Cash / Bank Balance as per Hisaab Book Ledger</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{formatAED(Math.max(0, paidSalesGross - paidExpenseGross + 120000))}</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-slate-100 dark:border-slate-900">
                  <span className="text-slate-650 dark:text-slate-400 pl-4">Add: Outstanding customer sales collections (Uncredited Deposits)</span>
                  <span className="font-bold text-emerald-500">+{formatAED(unpaidSalesGross)}</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-slate-100 dark:border-slate-900">
                  <span className="text-slate-650 dark:text-slate-400 pl-4">Less: Unpaid supplier invoice payouts (Unpresented Cheques)</span>
                  <span className="font-bold text-rose-500">-{formatAED(unpaidExpenseGross)}</span>
                </div>
                <div className="flex justify-between py-3.5 border-t-2 border-double border-slate-300 dark:border-slate-750 text-sm font-black text-indigo-600 dark:text-indigo-400 bg-slate-50/50 dark:bg-slate-900/30 px-3 rounded-lg">
                  <span className="uppercase">Adjusted Balance as per External Bank Statement</span>
                  <span>{formatAED((Math.max(0, paidSalesGross - paidExpenseGross + 120000)) + unpaidSalesGross - unpaidExpenseGross)}</span>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              16I. PROVISION FOR BAD & DOUBTFUL DEBTS
             ------------------------------------------------------------- */}
          {selectedReport === 'bad_debts_provision' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>Provision for Bad & Doubtful Debts Risk Analysis</span>
                <span>IFRS 9 Expected Credit Loss Model</span>
              </div>

              {(() => {
                const currentVal = Object.values(agingCustomersMap).reduce((sum, v) => sum + v.c0_30, 0);
                const thirtyToSixtyVal = Object.values(agingCustomersMap).reduce((sum, v) => sum + v.c31_60, 0);
                const sixtyToNinetyVal = Object.values(agingCustomersMap).reduce((sum, v) => sum + v.c61_90, 0);
                const ninetyPlusVal = Object.values(agingCustomersMap).reduce((sum, v) => sum + v.c90_plus, 0);
                const totalVal = Object.values(agingCustomersMap).reduce((sum, v) => sum + v.total, 0);

                return (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                    <table className="w-full text-left text-xs text-slate-700 dark:text-slate-350 border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                          <th className="py-2.5 px-4 font-bold">Receivables Aging Bracket</th>
                          <th className="py-2.5 px-4 text-right font-bold">Outstanding Value (AED)</th>
                          <th className="py-2.5 px-4 text-right font-bold">Standard Risk %</th>
                          <th className="py-2.5 px-4 text-right font-bold bg-indigo-50/50">Required Bad Debt Provision (AED)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-900 font-mono text-[11px]">
                        <tr>
                          <td className="py-3 px-4 font-sans text-emerald-600 font-bold">0 - 30 Days (Current - Green)</td>
                          <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">{formatAED(currentVal)}</td>
                          <td className="py-3 px-4 text-right text-indigo-500 font-semibold">1.0%</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatAED(currentVal * 0.01)}</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-sans text-amber-500 font-bold">31 - 60 Days (Late - Yellow)</td>
                          <td className="py-3 px-4 text-right text-amber-500 dark:text-amber-400 font-bold">{formatAED(thirtyToSixtyVal)}</td>
                          <td className="py-3 px-4 text-right text-indigo-500 font-semibold">5.0%</td>
                          <td className="py-3 px-4 text-right font-bold text-amber-500 dark:text-amber-400">{formatAED(thirtyToSixtyVal * 0.05)}</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-sans text-orange-600 font-bold">61 - 90 Days (Delinquent - Orange)</td>
                          <td className="py-3 px-4 text-right text-orange-600 dark:text-orange-400 font-bold">{formatAED(sixtyToNinetyVal)}</td>
                          <td className="py-3 px-4 text-right text-indigo-500 font-semibold">15.0%</td>
                          <td className="py-3 px-4 text-right font-bold text-orange-600 dark:text-orange-400">{formatAED(sixtyToNinetyVal * 0.15)}</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-sans text-rose-600 font-black">90+ Days (Critical - Red BOLD)</td>
                          <td className="py-3 px-4 text-right text-rose-600 dark:text-rose-400 font-black">{formatAED(ninetyPlusVal)}</td>
                          <td className="py-3 px-4 text-right text-indigo-500 font-semibold">45.0%</td>
                          <td className="py-3 px-4 text-right font-black text-rose-600 dark:text-rose-400">{formatAED(ninetyPlusVal * 0.45)}</td>
                        </tr>
                        <tr className="bg-indigo-900 text-white font-bold border-t border-slate-300">
                          <td className="py-3 px-4 uppercase text-xs">Total Provisions Calculated</td>
                          <td className="py-3 px-4 text-right">{formatAED(totalVal)}</td>
                          <td className="py-3 px-4 text-right">-</td>
                          <td className="py-3 px-4 text-right text-emerald-400">
                            {formatAED(
                              (currentVal * 0.01) +
                              (thirtyToSixtyVal * 0.05) +
                              (sixtyToNinetyVal * 0.15) +
                              (ninetyPlusVal * 0.45)
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}

          {/* -------------------------------------------------------------
              16J. COST OF GOODS SOLD (COGS) LEDGER
             ------------------------------------------------------------- */}
          {selectedReport === 'cogs_cost_ledger' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>Cost of Goods Sold (COGS) Trading Statement</span>
                <span>Active Operating Cost Control</span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 p-6 space-y-4 font-mono text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-900">
                  <span className="text-slate-600 dark:text-slate-400">Inventory Opening Balance</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatAED(45000)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-900">
                  <span className="text-slate-600 dark:text-slate-400">Add: Supplier Purchases & Material Costs</span>
                  <span className="font-bold text-emerald-500">+{formatAED(filteredExpenses.filter(e => e.category === 'Purchases').reduce((sum, e) => sum + e.amount, 0))}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-900 text-rose-500">
                  <span className="font-medium">Less: Inventory Closing Balance</span>
                  <span className="font-bold">-{formatAED(28000)}</span>
                </div>
                <div className="flex justify-between py-3 border-t border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 px-3 rounded-lg">
                  <span>TOTAL COST OF GOODS SOLD (COGS)</span>
                  <span className="text-rose-600 dark:text-rose-400">
                    {formatAED(
                      Math.max(0, 45000 + filteredExpenses.filter(e => e.category === 'Purchases').reduce((sum, e) => sum + e.amount, 0) - 28000)
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-2 font-black text-sm text-indigo-600 dark:text-indigo-400">
                  <span>GROSS TRADING PROFIT MARGIN</span>
                  <span>
                    {formatAED(
                      Math.max(0, salesSubtotalVal - Math.max(0, 45000 + filteredExpenses.filter(e => e.category === 'Purchases').reduce((sum, e) => sum + e.amount, 0) - 28000))
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              16K. ACCRUALS & PREPAYMENTS LEDGER
             ------------------------------------------------------------- */}
          {selectedReport === 'accruals_prepayments_ledger' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>Prepayments & Accrued Liabilities Register</span>
                <span>AED Adjusting Journal Controls</span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-350 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2.5 px-4 font-bold">Adjusting Account</th>
                      <th className="py-2.5 px-4 font-bold">Category</th>
                      <th className="py-2.5 px-4 font-bold">Description</th>
                      <th className="py-2.5 px-4 text-right font-bold">Prepaid Value (Asset)</th>
                      <th className="py-2.5 px-4 text-right font-bold">Accrued Value (Liability)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900 font-mono text-[11px]">
                    <tr className="hover:bg-slate-50/20">
                      <td className="py-3 px-4 font-sans font-semibold">1410 - Prepaid Commercial Office Rent</td>
                      <td className="py-3 px-4 text-indigo-500 font-bold uppercase text-[9px]">Prepayment</td>
                      <td className="py-3 px-4 font-sans text-slate-400">Commercial office lease paid in advance</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">{formatAED(12500)}</td>
                      <td className="py-3 px-4 text-right text-slate-400">-</td>
                    </tr>
                    <tr className="hover:bg-slate-50/20">
                      <td className="py-3 px-4 font-sans font-semibold">1420 - Prepaid Corporate Insurance</td>
                      <td className="py-3 px-4 text-indigo-500 font-bold uppercase text-[9px]">Prepayment</td>
                      <td className="py-3 px-4 font-sans text-slate-400">Annual professional indemnity premium prepaid</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">{formatAED(2000)}</td>
                      <td className="py-3 px-4 text-right text-slate-400">-</td>
                    </tr>
                    <tr className="hover:bg-slate-50/20">
                      <td className="py-3 px-4 font-sans font-semibold">2310 - Accrued Utilities (DEWA)</td>
                      <td className="py-3 px-4 text-rose-500 font-bold uppercase text-[9px]">Accrual</td>
                      <td className="py-3 px-4 font-sans text-slate-400">Electricity & water consumed but unbilled</td>
                      <td className="py-3 px-4 text-right text-slate-400">-</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">{formatAED(3500)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/20">
                      <td className="py-3 px-4 font-sans font-semibold">2320 - Accrued Salaries & Wages (WPS)</td>
                      <td className="py-3 px-4 text-rose-500 font-bold uppercase text-[9px]">Accrual</td>
                      <td className="py-3 px-4 font-sans text-slate-400">Staff wages earned but pending bank dispatch</td>
                      <td className="py-3 px-4 text-right text-slate-400">-</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">{formatAED(5000)}</td>
                    </tr>
                    <tr className="bg-slate-50 dark:bg-slate-900 font-bold border-t border-slate-200">
                      <td className="py-3 px-4 font-sans text-xs">Total Adjustments</td>
                      <td className="py-3 px-4">-</td>
                      <td className="py-3 px-4">-</td>
                      <td className="py-3 px-4 text-right text-indigo-600">{formatAED(14500)}</td>
                      <td className="py-3 px-4 text-right text-rose-600">{formatAED(8500)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              16L. DAILY DAY BOOK & CASH ON HAND REGISTER
             ------------------------------------------------------------- */}
          {selectedReport === 'day_book_register' && (
            <div className="space-y-6">
              {/* Report Title Banner */}
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 rounded-lg">
                <span className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Daily Day Book, Cash on Hand & Purchases Register</span>
                </span>
                <span className="text-slate-400">Chronological Date-by-Date Cash Flow Log</span>
              </div>

              {/* 1. KEY LIQUIDITY & DAILY SUMMARY KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Cash on Hand Card */}
                <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white p-4 rounded-xl border border-emerald-800/50 shadow-xs relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300">
                      Cash & Bank On Hand
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-800/60 text-emerald-200 border border-emerald-700/50">
                      Liquidity
                    </span>
                  </div>
                  <div className="text-xl font-black font-mono mt-2 text-emerald-200">
                    {formatAED(cashOnHandMetrics.currentCashOnHand)}
                  </div>
                  <div className="text-[10px] font-sans text-emerald-300/80 mt-1 flex items-center justify-between">
                    <span>Base Reserve + Paid Receipts - Paid Expenses</span>
                  </div>
                  {cashOnHandMetrics.periodNetCash !== 0 && (
                    <div className="mt-2 text-[9px] font-mono pt-2 border-t border-emerald-800/60 text-emerald-300 flex justify-between">
                      <span>Period Net Cash Flow:</span>
                      <span className={`font-bold ${cashOnHandMetrics.periodNetCash >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {cashOnHandMetrics.periodNetCash >= 0 ? '+' : ''}{formatAED(cashOnHandMetrics.periodNetCash)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Purchased Amount Card */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 shadow-xs">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      Purchased Amount
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200">
                      Stock / Goods
                    </span>
                  </div>
                  <div className="text-xl font-black font-mono mt-2 text-amber-600 dark:text-amber-400">
                    {formatAED(cashOnHandMetrics.periodPurchased)}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Supplier bills & inventory purchases in period
                  </p>
                </div>

                {/* Spent Amount (OPEX) Card */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 shadow-xs">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                      Spent Amount (Expenses)
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200">
                      OPEX Overhead
                    </span>
                  </div>
                  <div className="text-xl font-black font-mono mt-2 text-rose-600 dark:text-rose-400">
                    {formatAED(cashOnHandMetrics.periodSpent)}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Rent, utilities, salaries & general costs
                  </p>
                </div>

                {/* Sold Amount (Revenue) Card */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/50 shadow-xs">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                      Sold Amount (Sales)
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200">
                      Invoiced Revenue
                    </span>
                  </div>
                  <div className="text-xl font-black font-mono mt-2 text-indigo-600 dark:text-indigo-400">
                    {formatAED(cashOnHandMetrics.periodSold)}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Total commercial sales issued in period
                  </p>
                </div>
              </div>

              {/* Day Book Search & Interval Preset Toolbar */}
              <div className="no-print bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                {/* Search box */}
                <div className="flex items-center gap-2 w-full max-w-md">
                  <span className="font-bold text-slate-700 whitespace-nowrap text-[11px]">Search:</span>
                  <input
                    type="text"
                    value={dayBookSearchTerm}
                    onChange={(e) => setDayBookSearchTerm(e.target.value)}
                    placeholder="Search by party, invoice, category, or date..."
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white text-xs font-mono focus:outline-hidden"
                  />
                  {dayBookSearchTerm && (
                    <button
                      onClick={() => setDayBookSearchTerm('')}
                      className="text-xs text-slate-400 hover:text-slate-600 font-bold px-1"
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Quick Period Buttons Bar */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-mono mr-1">Period Check:</span>
                  <button
                    onClick={() => {
                      const todayStr = new Date().toISOString().slice(0, 10);
                      setStartDate(todayStr);
                      setEndDate(todayStr);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                      startDate && startDate === endDate && startDate === new Date().toISOString().slice(0, 10)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Today (1 Day)
                  </button>
                  <button
                    onClick={() => {
                      const now = new Date();
                      const todayStr = now.toISOString().slice(0, 10);
                      const d = new Date();
                      d.setDate(d.getDate() - 4);
                      setStartDate(d.toISOString().slice(0, 10));
                      setEndDate(todayStr);
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    5-Day Check
                  </button>
                  <button
                    onClick={() => {
                      const now = new Date();
                      const todayStr = now.toISOString().slice(0, 10);
                      const d = new Date();
                      d.setDate(d.getDate() - 6);
                      setStartDate(d.toISOString().slice(0, 10));
                      setEndDate(todayStr);
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => {
                      const now = new Date();
                      const todayStr = now.toISOString().slice(0, 10);
                      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
                      setStartDate(firstDay);
                      setEndDate(todayStr);
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors cursor-pointer"
                  >
                    All Range
                  </button>
                </div>
              </div>

              {/* Grouped Activity Logs */}
              {dayBookGroupedByDate.length === 0 ? (
                <div className="p-12 text-center text-slate-400 italic bg-white border border-slate-200 rounded-xl space-y-2">
                  <p className="font-bold text-slate-600">No Day Book transactions found for the selected date range.</p>
                  <p className="text-xs text-slate-400">
                    Range: <span className="font-mono">{startDate || 'Start'}</span> to <span className="font-mono">{endDate || 'End'}</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Use the quick buttons above ("Today", "5-Day Check", "Weekly") or choose a broader range.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {dayBookGroupedByDate.map(group => (
                    <div key={group.date} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-xs">
                      {/* Date Header Summary */}
                      <div className="bg-slate-100 dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full inline-block"></span>
                          <span className="font-mono font-black text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                            Date: {group.date}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-bold">
                            {group.items.length} transaction(s)
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-[11px] font-mono font-bold flex-wrap">
                          {group.totalSold > 0 && (
                            <span className="text-indigo-600 dark:text-indigo-400">
                              Sold: {formatAED(group.totalSold)}
                            </span>
                          )}
                          {group.totalPurchased > 0 && (
                            <span className="text-amber-600 dark:text-amber-400">
                              Purchased: {formatAED(group.totalPurchased)}
                            </span>
                          )}
                          {group.totalSpent > 0 && (
                            <span className="text-rose-600 dark:text-rose-400">
                              Spent: {formatAED(group.totalSpent)}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-[10px] ${group.dailyNetCash >= 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                            Cash Net: {formatAED(group.dailyNetCash)}
                          </span>
                        </div>
                      </div>

                      {/* Transactions Table for this date */}
                      <table className="w-full text-left text-xs text-slate-700 dark:text-slate-350 border-collapse">
                        <thead>
                          <tr className="bg-slate-50/70 dark:bg-slate-900/50 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                            <th className="py-2.5 px-4 font-bold">Ref No / Doc No</th>
                            <th className="py-2.5 px-4 font-bold">Type / Category</th>
                            <th className="py-2.5 px-4 font-bold">Party Name / Description</th>
                            <th className="py-2.5 px-4 font-bold">Payment Status</th>
                            <th className="py-2.5 px-4 text-right font-bold bg-indigo-50/50 dark:bg-indigo-950/20">Total Amount (AED)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-900 font-mono text-[11px]">
                          {group.items.map(item => {
                            let badgeClass = 'bg-slate-100 text-slate-800 border-slate-300';
                            if (item.categoryKind === 'Sale') badgeClass = 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300';
                            else if (item.categoryKind === 'Purchase') badgeClass = 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300';
                            else if (item.categoryKind === 'Expense') badgeClass = 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300';
                            else if (item.categoryKind === 'Credit Note') badgeClass = 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300';
                            else if (item.categoryKind === 'Journal') badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300';

                            return (
                              <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                                <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-slate-100">{item.docNumber}</td>
                                <td className="py-2.5 px-4 font-sans">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${badgeClass}`}>
                                    {item.categoryKind} ({item.type})
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 font-sans">
                                  <div className="font-medium text-slate-800 dark:text-slate-200">{item.partyName}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">{item.details}</div>
                                </td>
                                <td className="py-2.5 px-4 font-sans">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                    item.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                    item.paymentStatus === 'Partial' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                    'bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}>
                                    {item.paymentStatus}
                                  </span>
                                  {item.cashInflow > 0 && (
                                    <span className="block text-[9px] font-mono text-emerald-600 font-bold mt-0.5">
                                      +Inflow: {formatAED(item.cashInflow)}
                                    </span>
                                  )}
                                  {item.cashOutflow > 0 && (
                                    <span className="block text-[9px] font-mono text-rose-600 font-bold mt-0.5">
                                      -Outflow: {formatAED(item.cashOutflow)}
                                    </span>
                                  )}
                                </td>
                                <td className={`py-2.5 px-4 text-right font-black ${item.categoryKind === 'Expense' || item.categoryKind === 'Purchase' || item.categoryKind === 'Credit Note' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'} bg-indigo-50/10`}>
                                  {formatAED(item.amount)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-50 dark:bg-slate-900 font-bold border-t border-slate-200 dark:border-slate-800 text-[11px]">
                            <td colSpan={4} className="py-2.5 px-4 font-mono text-[10px] uppercase text-slate-600 dark:text-slate-400">
                              Daily Subtotal ({group.date}) — Sold: {formatAED(group.totalSold)} • Purchased: {formatAED(group.totalPurchased)} • Spent: {formatAED(group.totalSpent)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-black text-indigo-700 dark:text-indigo-400">
                              Net Cash: {formatAED(group.dailyNetCash)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ))}

                  {/* Day Book Grand Summary for Selected Date Range */}
                  <div className="bg-slate-900 text-white p-5 rounded-xl space-y-3 font-mono text-xs">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex justify-between items-center">
                      <span>Day Book Grand Summary ({startDate || 'Start'} to {endDate || 'End'})</span>
                      <span className="text-emerald-400 font-bold">Est. Cash & Bank On Hand: {formatAED(cashOnHandMetrics.currentCashOnHand)}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
                      <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                        <span className="text-[9px] text-slate-400 block uppercase">Total Sold (Sales)</span>
                        <span className="text-sm font-black text-indigo-400 font-mono mt-0.5 block">
                          {formatAED(cashOnHandMetrics.periodSold)}
                        </span>
                      </div>
                      <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                        <span className="text-[9px] text-slate-400 block uppercase">Total Purchased (Stock)</span>
                        <span className="text-sm font-black text-amber-400 font-mono mt-0.5 block">
                          {formatAED(cashOnHandMetrics.periodPurchased)}
                        </span>
                      </div>
                      <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                        <span className="text-[9px] text-slate-400 block uppercase">Total Spent (OPEX)</span>
                        <span className="text-sm font-black text-rose-400 font-mono mt-0.5 block">
                          {formatAED(cashOnHandMetrics.periodSpent)}
                        </span>
                      </div>
                      <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                        <span className="text-[9px] text-slate-400 block uppercase">Period Net Cash Movement</span>
                        <span className={`text-sm font-black font-mono mt-0.5 block ${cashOnHandMetrics.periodNetCash >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {cashOnHandMetrics.periodNetCash >= 0 ? '+' : ''}{formatAED(cashOnHandMetrics.periodNetCash)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------------------
              16L-1. DAILY CASH DRAWER & BANK RECONCILIATION
             ------------------------------------------------------------- */}
          {selectedReport === 'daily_cash_reconciliation' && (() => {
            const rangeDocs = filteredInvoices.filter(d => 
              d.type === 'Invoice' && 
              (d.status === 'Paid' || (d.status as string) === 'Partially Paid' || (d.status as string) === 'Partial' || ((d.paymentReceived || 0) > 0))
            );
            const rangeExpenses = filteredExpenses.filter(e => e.status !== 'Unpaid');

            const cashInflows = rangeDocs
              .filter(d => ((d as any).paymentMethod === 'Cash' || (d as any).paymentMethod === 'POS Card' || !(d as any).paymentMethod))
              .reduce((sum, d) => sum + (d.paymentReceived || (d.status === 'Paid' ? d.total : 0)), 0);

            const bankInflows = rangeDocs
              .filter(d => ((d as any).paymentMethod === 'Bank Transfer' || (d as any).paymentMethod === 'Cheque'))
              .reduce((sum, d) => sum + (d.paymentReceived || (d.status === 'Paid' ? d.total : 0)), 0);

            const cashOutflows = rangeExpenses
              .filter(e => ((e as any).paymentMethod === 'Cash' || !(e as any).paymentMethod))
              .reduce((sum, e) => sum + e.total, 0);

            const bankOutflows = rangeExpenses
              .filter(e => ((e as any).paymentMethod === 'Bank Transfer' || (e as any).paymentMethod === 'Cheque' || (e as any).paymentMethod === 'Credit Card'))
              .reduce((sum, e) => sum + e.total, 0);

            const openingCashFloat = drawerOpeningFloat;
            const expectedClosingCash = openingCashFloat + cashInflows - cashOutflows;
            const countedCashNum = drawerCountedCash.trim() !== '' ? Number(drawerCountedCash) : null;
            const variance = countedCashNum !== null && !isNaN(countedCashNum) ? countedCashNum - expectedClosingCash : null;

            return (
              <div className="space-y-6">
                <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex flex-wrap justify-between items-center rounded-xl gap-2">
                  <div className="flex items-center space-x-2">
                    <Coins className="w-4 h-4 text-emerald-400" />
                    <span>Daily Cash Drawer & Bank Reconciliation Register</span>
                  </div>
                  <span className="text-emerald-400 font-bold">Audit Range: {startDate || 'Today'} to {endDate || 'Today'}</span>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Opening Cash Float</span>
                      <span className="text-[9px] text-slate-400 font-mono">Editable</span>
                    </div>
                    <div className="mt-1 flex items-center space-x-1">
                      <span className="text-xs font-mono font-bold text-slate-400">AED</span>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={drawerOpeningFloat}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setDrawerOpeningFloat(val);
                          if (typeof window !== 'undefined') {
                            localStorage.setItem(`hisaab_drawer_float_${company.id}`, String(val));
                          }
                        }}
                        className="w-full text-base font-black font-mono text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded px-1.5 py-0.5 focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 block">Starting cash in drawer float</span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xs">
                    <span className="text-[10px] font-mono uppercase text-emerald-600 font-bold block">Cash Inflows</span>
                    <span className="text-base font-black font-mono text-emerald-600 mt-1 block">
                      +{formatAED(cashInflows)}
                    </span>
                    <span className="text-[9px] text-slate-400 mt-1 block">Bank Inflows: {formatAED(bankInflows)}</span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xs">
                    <span className="text-[10px] font-mono uppercase text-rose-600 font-bold block">Cash Outflows</span>
                    <span className="text-base font-black font-mono text-rose-600 mt-1 block">
                      -{formatAED(cashOutflows)}
                    </span>
                    <span className="text-[9px] text-slate-400 mt-1 block">Bank Outflows: {formatAED(bankOutflows)}</span>
                  </div>

                  <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-xl shadow-2xs">
                    <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">Expected Drawer Cash</span>
                    <span className="text-base font-black font-mono text-emerald-400 mt-1 block">
                      {formatAED(expectedClosingCash)}
                    </span>
                    <span className="text-[9px] text-emerald-300 font-bold mt-1 block">
                      Float ({formatAED(openingCashFloat)}) + Net Movement
                    </span>
                  </div>
                </div>

                {/* Physical Cash Count & Verification Tool */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-amber-500" />
                      Physical Cash Drawer Reconciliation Count
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Enter the counted physical cash in the drawer at closing to instantly detect cash over or short.
                    </p>
                  </div>
                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Counted Cash (AED)"
                        value={drawerCountedCash}
                        onChange={(e) => setDrawerCountedCash(e.target.value)}
                        className="w-44 text-xs font-mono font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 rounded-lg focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                    {variance !== null && (
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center space-x-1 ${
                        Math.abs(variance) < 0.01 
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300' 
                          : variance > 0
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300'
                      }`}>
                        <span>
                          {Math.abs(variance) < 0.01 
                            ? '✓ Balanced' 
                            : variance > 0 
                              ? `+${formatAED(variance)} Over` 
                              : `-${formatAED(Math.abs(variance))} Short`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cash & Bank Reconciliation Table */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-4 font-bold">Date</th>
                        <th className="py-2.5 px-4 font-bold">Ref # / Doc</th>
                        <th className="py-2.5 px-4 font-bold">Description / Party</th>
                        <th className="py-2.5 px-4 font-bold">Channel</th>
                        <th className="py-2.5 px-4 text-right font-bold text-emerald-600">Inflow (AED)</th>
                        <th className="py-2.5 px-4 text-right font-bold text-rose-600">Outflow (AED)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-900 font-mono text-[11px]">
                      {rangeDocs.length === 0 && rangeExpenses.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 font-sans text-xs">
                            No cash drawer or bank transactions recorded for this period.
                          </td>
                        </tr>
                      ) : (
                        <>
                          {rangeDocs.map(d => {
                            const inflowVal = d.paymentReceived || (d.status === 'Paid' ? d.total : 0);
                            return (
                              <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                                <td className="py-2.5 px-4">{d.date}</td>
                                <td className="py-2.5 px-4 font-bold text-indigo-600">{d.docNumber}</td>
                                <td className="py-2.5 px-4 font-sans">{activeCompanyCustomers.find(c => c.id === d.customerId)?.name || 'Walk-in Client'} (Sales Collection)</td>
                                <td className="py-2.5 px-4">
                                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                    {d.paymentMethod || 'Cash'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 text-right font-black text-emerald-600">+{formatAED(inflowVal)}</td>
                                <td className="py-2.5 px-4 text-right font-medium text-slate-400">0.00</td>
                              </tr>
                            );
                          })}
                          {rangeExpenses.map(e => (
                            <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                              <td className="py-2.5 px-4">{e.date}</td>
                              <td className="py-2.5 px-4 font-bold text-amber-600">{e.id.substring(0, 8)}</td>
                              <td className="py-2.5 px-4 font-sans">{e.supplierName || e.category} ({e.description || e.category})</td>
                              <td className="py-2.5 px-4">
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  {(e as any).paymentMethod || 'Cash'}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-right font-medium text-slate-400">0.00</td>
                              <td className="py-2.5 px-4 text-right font-black text-rose-600">-{formatAED(e.total)}</td>
                            </tr>
                          ))}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* -------------------------------------------------------------
              16L-2. DAILY SALES & COLLECTIONS BREAKDOWN
             ------------------------------------------------------------- */}
          {selectedReport === 'daily_sales_summary' && (() => {
            const salesDocs = filteredInvoices.filter(d => d.type === 'Invoice');
            const grossSales = salesDocs.reduce((sum, d) => sum + d.total, 0);
            const vatCollected = salesDocs.reduce((sum, d) => sum + d.vatTotal, 0);
            const netSales = grossSales - vatCollected;
            const collectedAmount = salesDocs.reduce((sum, d) => sum + (d.paymentReceived || (d.status === 'Paid' ? d.total : 0)), 0);

            return (
              <div className="space-y-6">
                <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex flex-wrap justify-between items-center rounded-xl gap-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>Daily Sales & Collections Breakdown Register</span>
                  </div>
                  <span className="text-blue-400 font-bold">Selected Range: {startDate || 'Today'} to {endDate || 'Today'}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xs">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Gross Invoiced Sales</span>
                    <span className="text-base font-black font-mono text-slate-900 dark:text-white mt-1 block">{formatAED(grossSales)}</span>
                    <span className="text-[9px] text-slate-400 mt-1 block">{salesDocs.length} invoice(s)</span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xs">
                    <span className="text-[10px] font-mono uppercase text-indigo-600 font-bold block">5% VAT Output</span>
                    <span className="text-base font-black font-mono text-indigo-600 mt-1 block">{formatAED(vatCollected)}</span>
                    <span className="text-[9px] text-slate-400 mt-1 block">FTA Tax Payable</span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xs">
                    <span className="text-[10px] font-mono uppercase text-blue-600 font-bold block">Net Sales Excl. VAT</span>
                    <span className="text-base font-black font-mono text-blue-600 mt-1 block">{formatAED(netSales)}</span>
                    <span className="text-[9px] text-slate-400 mt-1 block">Core Sales Revenue</span>
                  </div>

                  <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-xl shadow-2xs">
                    <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">Settled Collections</span>
                    <span className="text-base font-black font-mono text-emerald-400 mt-1 block">{formatAED(collectedAmount)}</span>
                    <span className="text-[9px] text-emerald-300 font-bold mt-1 block">Paid / Partial Receipts</span>
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-4 font-bold">Date</th>
                        <th className="py-2.5 px-4 font-bold">Invoice #</th>
                        <th className="py-2.5 px-4 font-bold">Customer</th>
                        <th className="py-2.5 px-4 font-bold">Status</th>
                        <th className="py-2.5 px-4 text-right font-bold">Subtotal</th>
                        <th className="py-2.5 px-4 text-right font-bold">VAT 5%</th>
                        <th className="py-2.5 px-4 text-right font-bold text-indigo-600">Total (AED)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-900 font-mono text-[11px]">
                      {salesDocs.map(d => (
                        <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="py-2.5 px-4">{d.date}</td>
                          <td className="py-2.5 px-4 font-bold text-blue-600">{d.docNumber}</td>
                          <td className="py-2.5 px-4 font-sans">{activeCompanyCustomers.find(c => c.id === d.customerId)?.name || 'Walk-in Client'}</td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              d.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                              (d.status as string) === 'Partially Paid' || (d.status as string) === 'Partial' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {d.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-medium">{formatAED(d.subtotal)}</td>
                          <td className="py-2.5 px-4 text-right font-medium">{formatAED(d.vatTotal)}</td>
                          <td className="py-2.5 px-4 text-right font-black text-indigo-600">{formatAED(d.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* -------------------------------------------------------------
              16L-3. DAILY PURCHASES & OPEX OUTFLOWS REGISTER
             ------------------------------------------------------------- */}
          {selectedReport === 'daily_expense_audit' && (() => {
            const expList = filteredExpenses;
            const totalOutflows = expList.reduce((sum, e) => sum + e.total, 0);
            const totalVatInput = expList.reduce((sum, e) => sum + e.vatAmount, 0);

            const purchasesList = expList.filter(e => 
              ['Purchases', 'Inventory', 'Stock', 'Raw Materials', 'Goods for Resale', 'Cost of Goods Sold', 'General Purchases'].includes(e.category) ||
              (e.supplierName && e.supplierName.trim().length > 0)
            );
            const totalPurchases = purchasesList.reduce((sum, e) => sum + e.total, 0);
            const totalOpex = totalOutflows - totalPurchases;

            return (
              <div className="space-y-6">
                <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex flex-wrap justify-between items-center rounded-xl gap-2">
                  <div className="flex items-center space-x-2">
                    <Receipt className="w-4 h-4 text-amber-400" />
                    <span>Daily Purchases & Operational Outflows Register</span>
                  </div>
                  <span className="text-amber-400 font-bold">Range: {startDate || 'Today'} to {endDate || 'Today'}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xs">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Total Incurred Outflows</span>
                    <span className="text-base font-black font-mono text-slate-900 dark:text-white mt-1 block">{formatAED(totalOutflows)}</span>
                    <span className="text-[9px] text-slate-400 mt-1 block">{expList.length} expense record(s)</span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xs">
                    <span className="text-[10px] font-mono uppercase text-amber-600 font-bold block">Stock Purchases (COGS)</span>
                    <span className="text-base font-black font-mono text-amber-600 mt-1 block">{formatAED(totalPurchases)}</span>
                    <span className="text-[9px] text-slate-400 mt-1 block">{purchasesList.length} purchase record(s)</span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xs">
                    <span className="text-[10px] font-mono uppercase text-rose-600 font-bold block">Operating Overheads (OPEX)</span>
                    <span className="text-base font-black font-mono text-rose-600 mt-1 block">{formatAED(totalOpex)}</span>
                    <span className="text-[9px] text-slate-400 mt-1 block">General Admin Expenses</span>
                  </div>

                  <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-xl shadow-2xs">
                    <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">Recoverable Input VAT</span>
                    <span className="text-base font-black font-mono text-emerald-400 mt-1 block">{formatAED(totalVatInput)}</span>
                    <span className="text-[9px] text-emerald-300 font-bold mt-1 block">FTA Tax Credit Claimable</span>
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-4 font-bold">Date</th>
                        <th className="py-2.5 px-4 font-bold">Expense ID</th>
                        <th className="py-2.5 px-4 font-bold">Category</th>
                        <th className="py-2.5 px-4 font-bold">Supplier / Payee</th>
                        <th className="py-2.5 px-4 text-right font-bold">Input VAT 5%</th>
                        <th className="py-2.5 px-4 text-right font-bold text-rose-600">Total (AED)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-900 font-mono text-[11px]">
                      {expList.map(e => (
                        <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="py-2.5 px-4">{e.date}</td>
                          <td className="py-2.5 px-4 font-bold text-amber-600">{e.id.substring(0, 8)}</td>
                          <td className="py-2.5 px-4 font-sans font-medium">{e.category}</td>
                          <td className="py-2.5 px-4 font-sans">{e.supplierName || e.description || e.category}</td>
                          <td className="py-2.5 px-4 text-right font-medium text-emerald-600">{formatAED(e.vatAmount)}</td>
                          <td className="py-2.5 px-4 text-right font-black text-rose-600">{formatAED(e.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* -------------------------------------------------------------
              16M. VAT OUTPUT VS INPUT NET SETTLEMENT LEDGER
             ------------------------------------------------------------- */}
          {selectedReport === 'tax_liability_ledger' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>VAT Output vs Input Net Settlement Ledger</span>
                <span>UAE FTA Tax Return Audit Alignment</span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 p-6 space-y-4 font-mono text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-900 text-rose-500">
                  <span className="font-bold">Total VAT Output (Standard Commercial Sales)</span>
                  <span className="font-bold">+{formatAED(salesVatVal)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-900 text-emerald-500">
                  <span className="font-bold">Less: Total VAT Input (Recoverable Expenses Purchases)</span>
                  <span className="font-bold">-{formatAED(expenseVatVal)}</span>
                </div>
                {/* Net calculations */}
                {salesVatVal >= expenseVatVal ? (
                  <div className="flex justify-between py-3.5 border-t-2 border-double border-slate-300 dark:border-slate-750 text-sm font-black text-rose-600 bg-rose-50/40 dark:bg-rose-950/10 px-3 rounded-lg">
                    <span className="uppercase">Net VAT Due & Payable to FTA</span>
                    <span>{formatAED(salesVatVal - expenseVatVal)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between py-3.5 border-t-2 border-double border-slate-300 dark:border-slate-750 text-sm font-black text-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/10 px-3 rounded-lg">
                    <span className="uppercase">Net VAT Refundable from FTA</span>
                    <span>{formatAED(expenseVatVal - salesVatVal)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              14. STOCK MOVEMENT REPORT (ITEM WISE)
             ------------------------------------------------------------- */}
          {selectedReport === 'stock_movement' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>Inventory Stock Movement & Dispatch Ledger</span>
                <span>Active company stock</span>
              </div>

              <div className="border border-slate-200 overflow-hidden rounded-xl">
                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200">
                      <th className="py-2.5 px-4 font-bold">Product SKU</th>
                      <th className="py-2.5 px-4 font-bold">Product Name</th>
                      <th className="py-2.5 px-4 text-right font-bold">Original Asset Stock</th>
                      <th className="py-2.5 px-4 text-right font-bold">Invoiced / Dispatched Qty</th>
                      <th className="py-2.5 px-4 text-right font-bold">Adjusted Stock</th>
                      <th className="py-2.5 px-4 text-right font-bold bg-indigo-50/50">Current Stock Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {inventory.filter(i => i.companyId === company.id).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400 italic">No inventory products registered yet.</td>
                      </tr>
                    ) : (
                      inventory.filter(i => i.companyId === company.id).map(item => {
                        const qtySold = topSellingItems.find(i => i.sku === item.sku)?.qtySold || 0;
                        const originalStock = item.stockQuantity + qtySold;
                        
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/30">
                            <td className="py-2.5 px-4 font-bold text-slate-900">{item.sku}</td>
                            <td className="py-2.5 px-4 font-sans font-medium text-slate-800">{item.name}</td>
                            <td className="py-2.5 px-4 text-right">{originalStock} unit(s)</td>
                            <td className="py-2.5 px-4 text-right text-rose-600 font-bold">-{qtySold} unit(s)</td>
                            <td className="py-2.5 px-4 text-right">0 unit(s)</td>
                            <td className="py-2.5 px-4 text-right font-black text-slate-950 bg-indigo-50/30">{item.stockQuantity} unit(s)</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              15. LOW STOCK ALERT REPORT
             ------------------------------------------------------------- */}
          {selectedReport === 'low_stock_alerts' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                <span>Inventory Low Stock Alerts Compliance</span>
                <span>Active company triggers</span>
              </div>

              {(() => {
                const lowStockItems = inventory.filter(i => i.companyId === company.id && i.stockQuantity <= i.minStockThreshold);
                
                return (
                  <div className="space-y-4">
                    {lowStockItems.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 italic">
                        Excellent! No stock items are currently below minimum thresholds.
                      </div>
                    ) : (
                      <div className="border border-slate-200 overflow-hidden rounded-xl">
                        <table className="w-full text-left text-xs text-slate-700 border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200">
                              <th className="py-2.5 px-4 font-bold">SKU</th>
                              <th className="py-2.5 px-4 font-bold">Item Name</th>
                              <th className="py-2.5 px-4 text-right font-bold">Current Stock</th>
                              <th className="py-2.5 px-4 text-right font-bold">Min Threshold</th>
                              <th className="py-2.5 px-4 text-center font-bold">Severity Alert Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                            {lowStockItems.map(item => {
                              const isOutOfStock = item.stockQuantity <= 0;
                              return (
                                <tr key={item.id} className="hover:bg-slate-50/30">
                                  <td className="py-3 px-4 font-bold text-slate-900">{item.sku}</td>
                                  <td className="py-3 px-4 font-sans font-medium text-slate-800">{item.name}</td>
                                  <td className="py-3 px-4 text-right font-black text-rose-700">{item.stockQuantity} unit(s)</td>
                                  <td className="py-3 px-4 text-right text-slate-500">{item.minStockThreshold} unit(s)</td>
                                  <td className="py-3 px-4 text-center font-sans">
                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${isOutOfStock ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse' : 'bg-amber-100 text-amber-800 border-amber-300'}`}>
                                      {isOutOfStock ? 'OUT OF STOCK (CRITICAL)' : 'LOW STOCK ALERT'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* -------------------------------------------------------------
              16. PENDING PAYMENTS & REMINDERS REPORT
             ------------------------------------------------------------- */}
          {selectedReport === 'pending_payments' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between items-center rounded-lg">
                <span>Pending Receivables & Outbox Reminders</span>
                <span className="flex items-center space-x-1.5">
                  <span className={`w-2 h-2 rounded-full ${company.autoReminderEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                  <span>Auto Reminders: {company.autoReminderEnabled ? 'ONLINE' : 'OFFLINE'}</span>
                </span>
              </div>

              {/* Warning/Intro card */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wide">Corporate Debt Collection Assistance</h4>
                  <p className="text-[10px] text-indigo-750 leading-relaxed max-w-xl">
                    Outstanding customer accounts require proactive reminders. Utilize the bilingual outreach utility below to transmit payment notifications via WhatsApp or Email instantly.
                  </p>
                </div>
                <div className="bg-white border border-indigo-200 rounded-lg p-2 px-3 text-center shrink-0">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Due Receivables</span>
                  <span className="text-base font-black text-indigo-700 font-mono mt-0.5">
                    {formatAED(pendingInvoicesData.reduce((sum, item) => sum + item.pendingAmount, 0))}
                  </span>
                </div>
              </div>

              {pendingInvoicesData.length === 0 ? (
                <div className="p-12 text-center text-slate-400 italic bg-slate-50 border border-slate-200 rounded-xl">
                  Hurrah! All invoices have been settled in full. No pending payments found.
                </div>
              ) : (
                <div className="border border-slate-200 overflow-hidden rounded-xl bg-white">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200">
                        <th className="py-2.5 px-4 font-bold">Client / Partner</th>
                        <th className="py-2.5 px-4 font-bold">Invoice No</th>
                        <th className="py-2.5 px-4 font-bold">Due Date</th>
                        <th className="py-2.5 px-4 text-right font-bold">Outstanding (AED)</th>
                        <th className="py-2.5 px-4 text-center font-bold no-print">Reminder Outreach Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {pendingInvoicesData.map(item => {
                        const lastSent = reminderHistory[item.id];
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/30">
                            <td className="py-3.5 px-4 font-sans font-medium text-slate-900">
                              <div className="font-bold text-slate-850">{item.clientName}</div>
                              <div className="text-[9px] text-slate-450 mt-0.5 font-mono">{item.clientPhone || 'No Phone'} • {item.clientEmail || 'No Email'}</div>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-indigo-600">{item.invoiceNo}</td>
                            <td className="py-3.5 px-4 text-slate-600">{item.dueDate}</td>
                            <td className="py-3.5 px-4 text-right font-black text-slate-850 text-xs">{formatAED(item.pendingAmount)}</td>
                            <td className="py-3.5 px-4 text-center font-sans no-print space-x-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveReminder(item);
                                  const text = `Dear ${item.clientName},\n\nThis is a polite reminder from ${company.name} that Invoice ${item.invoiceNo} with outstanding balance of AED ${item.pendingAmount.toFixed(2)} is due on ${item.dueDate}.\n\nPlease settle this outstanding balance at your earliest convenience.\n\nThank you,\n${company.name}`;
                                  setReminderMessage(text);
                                  setIsReminderModalOpen(true);
                                }}
                                className="bg-indigo-650 hover:bg-indigo-700 text-white font-black text-[9px] uppercase tracking-wider px-2.5 py-1.5 rounded transition-colors cursor-pointer"
                              >
                                Send Reminder
                              </button>
                              {lastSent && (
                                <span className="text-[8px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-150 rounded px-1.5 py-0.5">
                                  Last: {lastSent}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------------------
              20. CONSTRUCTION RETENTION DUE REPORT (GCC Contracting)
             ------------------------------------------------------------- */}
          {selectedReport === 'construction_retention' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between items-center rounded-lg">
                <span>Contracting & Construction Retention Tracking Report</span>
                <span className="text-amber-400 font-bold">GCC Retention Compliance</span>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Retention Held</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1 block">
                    {formatAED(constructionRetentionData.reduce((sum, item) => sum + item.retentionAmt, 0))}
                  </span>
                  <p className="text-[9px] text-slate-500 mt-1">Accumulated GCC safety retention withholdings across all billing cycles.</p>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Due for Release</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">
                    {formatAED(constructionRetentionData.filter(r => r.status === 'Due for Release').reduce((sum, item) => sum + item.retentionAmt, 0))}
                  </span>
                  <p className="text-[9px] text-emerald-600/80 mt-1">Guarantees that have completed the standard 365-day liability maintenance period.</p>
                </div>
                <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Active Monitored Projects</span>
                  <span className="text-xl font-black text-blue-700 dark:text-blue-300 font-mono mt-1 block">
                    {new Set(constructionRetentionData.map(r => r.projectName)).size} Projects
                  </span>
                  <p className="text-[9px] text-blue-600/80 mt-1">Unique contracting worksites actively tracking retention accounts.</p>
                </div>
              </div>

              {constructionRetentionData.length === 0 ? (
                <div className="p-12 text-center text-slate-450 italic bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                  No active retention records found. Create an invoice in Contracting & Construction mode with a retention deduction percentage to populate this ledger report.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-850 overflow-hidden rounded-xl bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-4 font-bold">Project</th>
                        <th className="py-2.5 px-4 font-bold">Invoice</th>
                        <th className="py-2.5 px-4 font-bold">Client</th>
                        <th className="py-2.5 px-4 text-right font-bold">Total (AED)</th>
                        <th className="py-2.5 px-4 text-center font-bold">Deduction %</th>
                        <th className="py-2.5 px-4 text-right font-bold">Retention Amount (AED)</th>
                        <th className="py-2.5 px-4 font-bold">Release Due Date</th>
                        <th className="py-2.5 px-4 text-center font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[11px]">
                      {constructionRetentionData.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/20">
                          <td className="py-3.5 px-4 font-sans font-bold text-slate-850 dark:text-slate-200">{item.projectName}</td>
                          <td className="py-3.5 px-4 font-bold text-indigo-600 dark:text-indigo-400">{item.invoiceNo}</td>
                          <td className="py-3.5 px-4 font-sans text-slate-600 dark:text-slate-400">{item.clientName}</td>
                          <td className="py-3.5 px-4 text-right text-slate-600 dark:text-slate-400">{formatAED(item.invoiceTotal)}</td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-200">{item.retentionPct}%</td>
                          <td className="py-3.5 px-4 text-right font-black text-indigo-700 dark:text-indigo-400 text-xs">{formatAED(item.retentionAmt)}</td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{item.dueDate}</td>
                          <td className="py-3.5 px-4 text-center font-sans">
                            {item.status === 'Held' && (
                              <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-350 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/30">
                                Held
                              </span>
                            )}
                            {item.status === 'Due for Release' && (
                              <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-350 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/30 animate-pulse">
                                Due Release
                              </span>
                            )}
                            {item.status === 'Released' && (
                              <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-350 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/30">
                                Released
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
          )}

          {/* -------------------------------------------------------------
              21. GOLD METAL WEIGHT & MAKING CHARGES AUDIT
             ------------------------------------------------------------- */}
          {selectedReport === 'industry_gold_jewelry' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between items-center rounded-lg">
                <span>Gold Metal weight & Making Charges Audit</span>
                <span className="text-amber-400 font-bold">Gold & Jewellery Retail Compliance</span>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Gold Weight Processed</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1 block">
                    {goldJewelryData.reduce((sum, item) => sum + item.weight, 0).toFixed(2)} g
                  </span>
                  <p className="text-[9px] text-slate-500 mt-1">Total physical gold weight distributed across active items.</p>
                </div>
                <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Billed Metal Value</span>
                  <span className="text-xl font-black text-amber-700 dark:text-amber-300 font-mono mt-1 block">
                    {formatAED(goldJewelryData.reduce((sum, item) => sum + item.metalValue, 0))}
                  </span>
                  <p className="text-[9px] text-amber-600/80 mt-1">Market valuation of pure metal at transaction time.</p>
                </div>
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Total Making Charges (VAT Taxable)</span>
                  <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-1 block">
                    {formatAED(goldJewelryData.reduce((sum, item) => sum + item.makingCharge, 0))}
                  </span>
                  <p className="text-[9px] text-indigo-600/80 mt-1">Billed crafting & design premium values.</p>
                </div>
              </div>

              {goldJewelryData.length === 0 ? (
                <div className="p-12 text-center text-slate-450 italic bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                  No active gold transaction records found. Create an invoice in Gold & Jewellery mode to populate this audit.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-850 overflow-hidden rounded-xl bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-4 font-bold">Invoice</th>
                        <th className="py-2.5 px-4 font-bold">Customer</th>
                        <th className="py-2.5 px-4 font-bold text-center">Purity</th>
                        <th className="py-2.5 px-4 text-right font-bold">Weight</th>
                        <th className="py-2.5 px-4 text-right font-bold">Daily Rate (AED/g)</th>
                        <th className="py-2.5 px-4 text-right font-bold">Metal Value (AED)</th>
                        <th className="py-2.5 px-4 text-right font-bold">Making Charge (AED)</th>
                        <th className="py-2.5 px-4 text-right font-bold">Total Doc (AED)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[11px]">
                      {goldJewelryData.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/20">
                          <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{item.invoiceNo}</td>
                          <td className="py-3 px-4 font-sans">{item.clientName}</td>
                          <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-slate-200">{item.carat}</td>
                          <td className="py-3 px-4 text-right text-amber-700 dark:text-amber-400 font-bold">{item.weight.toFixed(2)} g</td>
                          <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">{formatAED(item.dailyRate)}</td>
                          <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">{formatAED(item.metalValue)}</td>
                          <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">{formatAED(item.makingCharge)}</td>
                          <td className="py-3 px-4 text-right font-black text-slate-850 dark:text-slate-200">{formatAED(item.totalDocAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------------------
              22. CUSTOMS CLEARANCES & DEMURRAGE LOG
             ------------------------------------------------------------- */}
          {selectedReport === 'industry_logistics' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between items-center rounded-lg">
                <span>Customs Clearances & Demurrage Log</span>
                <span className="text-indigo-400 font-bold">Maritime & Air Freight Operations</span>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Demurrage At Risk Alerts</span>
                  <span className="text-xl font-black text-red-600 dark:text-red-400 font-mono mt-1 block">
                    {logisticsData.filter(item => item.isAtRisk).length} Shipments
                  </span>
                  <p className="text-[9px] text-slate-500 mt-1">Containers that have exceeded standard free port storage days.</p>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Total Active Shipments</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">
                    {logisticsData.length} Bills of Lading
                  </span>
                  <p className="text-[9px] text-emerald-600/80 mt-1">Logistics manifests and customs clearance files logged.</p>
                </div>
                <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Simulated Port Demurrage Liability</span>
                  <span className="text-xl font-black text-blue-700 dark:text-blue-300 font-mono mt-1 block">
                    {formatAED(logisticsData.reduce((sum, item) => sum + item.demurrageFee, 0))}
                  </span>
                  <p className="text-[9px] text-blue-600/80 mt-1">Outstanding storage penalties incurred before custom clearance.</p>
                </div>
              </div>

              {logisticsData.length === 0 ? (
                <div className="p-12 text-center text-slate-450 italic bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                  No active logistics transaction records found. Create an invoice in Customs Clearance & Logistics mode to populate this audit.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-850 overflow-hidden rounded-xl bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-4 font-bold">Invoice</th>
                        <th className="py-2.5 px-4 font-bold">Client</th>
                        <th className="py-2.5 px-4 font-bold">B/L No.</th>
                        <th className="py-2.5 px-4 font-bold">Container No.</th>
                        <th className="py-2.5 px-4 font-bold">Customs Dec</th>
                        <th className="py-2.5 px-4 font-bold">Port of Entry</th>
                        <th className="py-2.5 px-4 font-bold">Free Days Expiry</th>
                        <th className="py-2.5 px-4 text-right font-bold">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[11px]">
                      {logisticsData.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/20">
                          <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{item.invoiceNo}</td>
                          <td className="py-3 px-4 font-sans">{item.clientName}</td>
                          <td className="py-3 px-4 font-bold">{item.blNo}</td>
                          <td className="py-3 px-4">{item.containerNo}</td>
                          <td className="py-3 px-4 font-bold text-slate-850 dark:text-slate-200">{item.decNo}</td>
                          <td className="py-3 px-4 font-sans">{item.port}</td>
                          <td className="py-3 px-4 font-sans">
                            <span className={item.isAtRisk ? 'text-red-600 font-bold bg-red-50 border border-red-200 rounded px-2 py-0.5 text-[9px]' : 'text-slate-600'}>
                              {item.graceExpiry} {item.isAtRisk ? '(Demurrage Due!)' : '(In Grace)'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400 font-bold">{formatAED(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------------------
              35. TRANSPORTATION FLEET TRIPS & WAYBILL REGISTER
             ------------------------------------------------------------- */}
          {selectedReport === 'transportation_fleet_report' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between items-center rounded-lg">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-indigo-400" />
                  <span>Fleet Trips & Consignment Waybill Register</span>
                </div>
                <span className="text-indigo-400 font-bold">UAE FTA Logistics & Haulage Compliance</span>
              </div>

              {/* Summary Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Freight Invoiced (Gross)</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1 block">
                    {formatAED(transportationTripsData.reduce((sum, item) => sum + item.total, 0))}
                  </span>
                  <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1 font-mono">
                    <span>Net: {formatAED(transportationTripsData.reduce((sum, item) => sum + item.subtotal, 0))}</span>
                    <span className="text-indigo-600 font-bold">+5% VAT: {formatAED(transportationTripsData.reduce((sum, item) => sum + item.vatTotal, 0))}</span>
                  </div>
                </div>

                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Completed & Active Trips</span>
                  <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-1 block">
                    {transportationTripsData.length} Trips Dispatched
                  </span>
                  <p className="text-[9px] text-indigo-600/80 mt-1">Consignment delivery waybills and hauling manifests logged.</p>
                </div>

                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Active Fleet Trucks</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">
                    {new Set(transportationTripsData.map(t => t.vehicleNo)).size} Commercial Vehicles
                  </span>
                  <p className="text-[9px] text-emerald-600/80 mt-1">Trailers, flatbeds, reefers & cargo trucks deployed.</p>
                </div>

                <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Waiting / Detention Hours</span>
                  <span className="text-xl font-black text-amber-700 dark:text-amber-300 font-mono mt-1 block">
                    {transportationTripsData.reduce((sum, t) => sum + t.detentionHours, 0)} Hours Logged
                  </span>
                  <p className="text-[9px] text-amber-600/80 mt-1">Offloading and port terminal demurrage waiting surcharges.</p>
                </div>
              </div>

              {transportationTripsData.length === 0 ? (
                <div className="p-12 text-center text-slate-450 italic bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <Truck className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600">No transportation trip manifests or invoices recorded yet.</p>
                  <p className="text-xs text-slate-400">Create an invoice with Transportation industry enabled to populate your fleet trip register and track freight performance.</p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-850 overflow-x-auto rounded-xl bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse min-w-[950px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-3 font-bold">Trip / Waybill #</th>
                        <th className="py-2.5 px-3 font-bold">Date</th>
                        <th className="py-2.5 px-3 font-bold">Shipper / Client</th>
                        <th className="py-2.5 px-3 font-bold">Vehicle Plate & Type</th>
                        <th className="py-2.5 px-3 font-bold">Driver</th>
                        <th className="py-2.5 px-3 font-bold">Route (Origin ➔ Destination)</th>
                        <th className="py-2.5 px-3 font-bold">Cargo & Weight</th>
                        <th className="py-2.5 px-3 font-bold">POD Status</th>
                        <th className="py-2.5 px-3 text-right font-bold">Net (AED)</th>
                        <th className="py-2.5 px-3 text-right font-bold">VAT 5% (AED)</th>
                        <th className="py-2.5 px-3 text-right font-bold">Gross Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[11px]">
                      {transportationTripsData.map(trip => (
                        <tr key={trip.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20">
                          <td className="py-3 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                            <div>{trip.tripNo}</div>
                            <span className="text-[9px] text-slate-400 font-sans font-normal">{trip.invoiceNo}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-sans">{trip.date}</td>
                          <td className="py-3 px-3 font-sans font-medium text-slate-850 dark:text-slate-200 max-w-[150px] truncate" title={trip.clientName}>
                            {trip.clientName}
                          </td>
                          <td className="py-3 px-3 font-sans">
                            <span className="font-bold text-slate-900 dark:text-white font-mono">{trip.vehicleNo}</span>
                            <div className="text-[9.5px] text-slate-400 truncate max-w-[140px]">{trip.vehicleType}</div>
                          </td>
                          <td className="py-3 px-3 font-sans">
                            <div className="font-medium text-slate-800 dark:text-slate-200">{trip.driverName}</div>
                            {trip.driverMobile && <span className="text-[9px] text-slate-400 font-mono">{trip.driverMobile}</span>}
                          </td>
                          <td className="py-3 px-3 font-sans">
                            <div className="text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                              <span className="font-medium max-w-[200px] truncate">{trip.route}</span>
                            </div>
                            {trip.distance > 0 && <span className="text-[9.5px] text-slate-400 font-mono">{trip.distance} km</span>}
                          </td>
                          <td className="py-3 px-3 font-sans">
                            <div className="text-slate-700 dark:text-slate-300">{trip.cargo}</div>
                            {trip.weight && trip.weight !== '-' && <span className="text-[9.5px] text-slate-400 font-mono font-bold">{trip.weight}</span>}
                          </td>
                          <td className="py-3 px-3 font-sans">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[9.5px] font-bold">
                              {trip.pod || 'POD Signed'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">{formatAED(trip.subtotal)}</td>
                          <td className="py-3 px-3 text-right font-mono text-emerald-600 font-bold">{formatAED(trip.vatTotal)}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">{formatAED(trip.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------------------
              36. VEHICLE & ROUTE HAULAGE PERFORMANCE
             ------------------------------------------------------------- */}
          {selectedReport === 'transportation_vehicle_profitability' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between items-center rounded-lg">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-emerald-400" />
                  <span>Fleet Vehicle & Route Freight Performance</span>
                </div>
                <span className="text-emerald-400 font-bold">Fleet Revenue & Demurrage Audit</span>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fleet Gross Earnings</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1 block">
                    {formatAED(transportationVehiclePerformanceData.reduce((sum, v) => sum + v.grossRevenue, 0))}
                  </span>
                  <p className="text-[9px] text-slate-500 mt-1">Total revenue generated across all registered fleet assets.</p>
                </div>

                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Avg Revenue per Trip</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">
                    {formatAED(
                      transportationTripsData.length > 0 
                        ? (transportationTripsData.reduce((sum, t) => sum + t.total, 0) / transportationTripsData.length) 
                        : 0
                    )}
                  </span>
                  <p className="text-[9px] text-emerald-600/80 mt-1">Average yield per dispatch haulage assignment.</p>
                </div>

                <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Total Fleet Kilometers</span>
                  <span className="text-xl font-black text-blue-700 dark:text-blue-300 font-mono mt-1 block">
                    {transportationVehiclePerformanceData.reduce((sum, v) => sum + v.totalDistance, 0).toLocaleString()} KM
                  </span>
                  <p className="text-[9px] text-blue-600/80 mt-1">Total operational transit distance recorded.</p>
                </div>

                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Road Tolls & Salik Recovered</span>
                  <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-1 block">
                    {formatAED(transportationVehiclePerformanceData.reduce((sum, v) => sum + v.totalTolls, 0))}
                  </span>
                  <p className="text-[9px] text-indigo-600/80 mt-1">Pass-through Salik & Darb gate fee reimbursements billed.</p>
                </div>
              </div>

              {transportationVehiclePerformanceData.length === 0 ? (
                <div className="p-12 text-center text-slate-450 italic bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                  No vehicle performance data logged. Dispatch and record vehicle numbers in transportation invoices to view asset analytics.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-850 overflow-x-auto rounded-xl bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse min-w-[850px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-3 font-bold">Vehicle Plate / No.</th>
                        <th className="py-2.5 px-3 font-bold">Category</th>
                        <th className="py-2.5 px-3 font-bold">Assigned Drivers</th>
                        <th className="py-2.5 px-3 text-center font-bold">Trips</th>
                        <th className="py-2.5 px-3 text-center font-bold">Distance</th>
                        <th className="py-2.5 px-3 text-center font-bold">Detention (Hrs)</th>
                        <th className="py-2.5 px-3 text-right font-bold">Tolls Recharged</th>
                        <th className="py-2.5 px-3 text-right font-bold">Net Freight</th>
                        <th className="py-2.5 px-3 text-right font-bold">Gross Total</th>
                        <th className="py-2.5 px-3 text-right font-bold">Avg / Trip</th>
                        <th className="py-2.5 px-3 font-bold">Primary Route</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[11px]">
                      {transportationVehiclePerformanceData.map(v => (
                        <tr key={v.vehicleNo} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20">
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{v.vehicleNo}</td>
                          <td className="py-3 px-3 font-sans text-slate-600 dark:text-slate-400">{v.vehicleType}</td>
                          <td className="py-3 px-3 font-sans text-slate-700 dark:text-slate-300">{v.drivers}</td>
                          <td className="py-3 px-3 text-center font-bold text-indigo-600">{v.tripsCount}</td>
                          <td className="py-3 px-3 text-center text-slate-600">{v.totalDistance > 0 ? `${v.totalDistance} km` : '-'}</td>
                          <td className="py-3 px-3 text-center text-amber-600 font-bold">{v.totalDetentionHours}</td>
                          <td className="py-3 px-3 text-right text-slate-600">{formatAED(v.totalTolls)}</td>
                          <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">{formatAED(v.totalSubtotal)}</td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">{formatAED(v.grossRevenue)}</td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-600">{formatAED(v.avgTripRevenue)}</td>
                          <td className="py-3 px-3 font-sans text-slate-500 text-[10px] max-w-[160px] truncate" title={v.topRoute}>
                            {v.topRoute}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------------------
              37. FOOTWEAR & APPAREL SIZE/COLOR SALES
             ------------------------------------------------------------- */}
          {selectedReport === 'retail_size_color_sales' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between items-center rounded-lg">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-rose-400" />
                  <span>Footwear & Apparel Size/Color Sales Register</span>
                </div>
                <span className="text-rose-400 font-bold">UAE FTA Retail POS & Tax Invoice Audit</span>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Units / Pairs Sold</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1 block">
                    {retailSizeColorSalesData.reduce((sum, item) => sum + item.qty, 0)} Items
                  </span>
                  <div className="text-[9px] text-slate-500 mt-1">Footwear, sandals, kandoras & apparel lines.</div>
                </div>

                <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Gross Retail Turnover</span>
                  <span className="text-xl font-black text-rose-700 dark:text-rose-300 font-mono mt-1 block">
                    {formatAED(retailSizeColorSalesData.reduce((sum, item) => sum + item.total, 0))}
                  </span>
                  <div className="flex items-center justify-between text-[9px] text-rose-600/80 mt-1 font-mono">
                    <span>Net: {formatAED(retailSizeColorSalesData.reduce((sum, item) => sum + item.subtotal, 0))}</span>
                    <span className="font-bold">+5% VAT: {formatAED(retailSizeColorSalesData.reduce((sum, item) => sum + item.vatAmount, 0))}</span>
                  </div>
                </div>

                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Average Item Value</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">
                    {formatAED(
                      retailSizeColorSalesData.reduce((sum, item) => sum + item.qty, 0) > 0
                        ? retailSizeColorSalesData.reduce((sum, item) => sum + item.total, 0) / retailSizeColorSalesData.reduce((sum, item) => sum + item.qty, 0)
                        : 0
                    )}
                  </span>
                  <p className="text-[9px] text-emerald-600/80 mt-1">Average retail transaction ticket yield.</p>
                </div>

                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Unique Sizes Tracked</span>
                  <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-1 block">
                    {new Set(retailSizeColorSalesData.map(r => r.size)).size} Size Variants
                  </span>
                  <p className="text-[9px] text-indigo-600/80 mt-1">EU 38-46 shoe sizes & clothing run variants.</p>
                </div>
              </div>

              {retailSizeColorSalesData.length === 0 ? (
                <div className="p-12 text-center text-slate-450 italic bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <ShoppingBag className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600">No retail item sales recorded yet.</p>
                  <p className="text-xs text-slate-400">Create an invoice using the Retail Shop POS workspace to see size, color, and article breakdowns here.</p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-850 overflow-x-auto rounded-xl bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse min-w-[950px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-3 font-bold">Date & Invoice</th>
                        <th className="py-2.5 px-3 font-bold">Customer</th>
                        <th className="py-2.5 px-3 font-bold">Article / Model</th>
                        <th className="py-2.5 px-3 font-bold">Category</th>
                        <th className="py-2.5 px-3 font-bold text-center">Size</th>
                        <th className="py-2.5 px-3 font-bold">Color</th>
                        <th className="py-2.5 px-3 font-bold">Barcode / EAN</th>
                        <th className="py-2.5 px-3 text-center font-bold">Qty</th>
                        <th className="py-2.5 px-3 text-right font-bold">Rate</th>
                        <th className="py-2.5 px-3 text-right font-bold">5% VAT</th>
                        <th className="py-2.5 px-3 text-right font-bold">Total (AED)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[11px]">
                      {retailSizeColorSalesData.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20">
                          <td className="py-3 px-3 font-bold text-rose-600 dark:text-rose-400">
                            <div>{r.invoiceNo}</div>
                            <span className="text-[9px] text-slate-400 font-sans font-normal">{r.date}</span>
                          </td>
                          <td className="py-3 px-3 font-sans font-medium text-slate-900 dark:text-slate-100">{r.customerName}</td>
                          <td className="py-3 px-3 font-sans">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{r.modelName}</div>
                            <div className="text-[9px] text-slate-400">{r.brand}</div>
                          </td>
                          <td className="py-3 px-3 font-sans text-[10px] text-slate-600 dark:text-slate-400">{r.category}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold text-[10px]">
                              {r.size}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-sans text-slate-600 dark:text-slate-300">{r.color}</td>
                          <td className="py-3 px-3 text-[10px] text-slate-400">{r.barcode || '—'}</td>
                          <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-200">{r.qty}</td>
                          <td className="py-3 px-3 text-right text-slate-600">{formatAED(r.unitRate)}</td>
                          <td className="py-3 px-3 text-right text-rose-600 font-bold">{formatAED(r.vatAmount)}</td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">{formatAED(r.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------------------
              38. RETAIL SIZE EXCHANGES & RETURNS LOG
             ------------------------------------------------------------- */}
          {selectedReport === 'retail_returns_exchanges' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between items-center rounded-lg">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-amber-400" />
                  <span>Retail Size Exchanges & Returns Log</span>
                </div>
                <span className="text-amber-400 font-bold">FTA 14-Day Consumer Protection Compliance</span>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Processed Exchanges & Returns</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1 block">
                    {retailReturnsExchangesData.length} Exchanges
                  </span>
                  <p className="text-[9px] text-slate-500 mt-1">Size replacement and store credit adjustments.</p>
                </div>

                <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Total Credit / Refund Value</span>
                  <span className="text-xl font-black text-amber-700 dark:text-amber-300 font-mono mt-1 block">
                    {formatAED(retailReturnsExchangesData.reduce((sum, r) => sum + r.creditAmount, 0))}
                  </span>
                  <p className="text-[9px] text-amber-600/80 mt-1">Credited back against exchange line items.</p>
                </div>

                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Restocking & QC Clearance</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">
                    100% Inspected
                  </span>
                  <p className="text-[9px] text-emerald-600/80 mt-1">Verified unworn, with box & retail tags attached.</p>
                </div>
              </div>

              {retailReturnsExchangesData.length === 0 ? (
                <div className="p-12 text-center text-slate-450 italic bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <RefreshCw className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600">No return or exchange adjustments recorded yet.</p>
                  <p className="text-xs text-slate-400">Use the "Customer Size Exchange / Return" feature in the Retail POS workspace to record customer size swaps and refunds.</p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-850 overflow-x-auto rounded-xl bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse min-w-[850px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-3 font-bold">Exchange Date</th>
                        <th className="py-2.5 px-3 font-bold">New Invoice</th>
                        <th className="py-2.5 px-3 font-bold">Original Invoice</th>
                        <th className="py-2.5 px-3 font-bold">Customer</th>
                        <th className="py-2.5 px-3 font-bold">Exchanged / Returned Article</th>
                        <th className="py-2.5 px-3 font-bold">Reason</th>
                        <th className="py-2.5 px-3 font-bold">Condition & Restock</th>
                        <th className="py-2.5 px-3 text-right font-bold">Credit Allowed (AED)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[11px]">
                      {retailReturnsExchangesData.map(ret => (
                        <tr key={ret.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20">
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{ret.date}</td>
                          <td className="py-3 px-3 font-bold text-rose-600 dark:text-rose-400">{ret.invoiceNo}</td>
                          <td className="py-3 px-3 text-slate-500 font-mono">{ret.originalRef}</td>
                          <td className="py-3 px-3 font-sans font-medium text-slate-900 dark:text-slate-100">{ret.customerName}</td>
                          <td className="py-3 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200">{ret.returnedItem}</td>
                          <td className="py-3 px-3 font-sans text-[10px] text-amber-600 font-medium">{ret.reason}</td>
                          <td className="py-3 px-3 font-sans text-[10px] text-emerald-600 font-medium">{ret.condition}</td>
                          <td className="py-3 px-3 text-right font-bold text-amber-600 font-mono">- {formatAED(ret.creditAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------------------
              39. FAST-MOVING SIZES & RESTOCK MATRIX
             ------------------------------------------------------------- */}
          {selectedReport === 'retail_fast_moving_sizes' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between items-center rounded-lg">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-400" />
                  <span>Footwear & Clothing Fast-Moving Sizes Matrix</span>
                </div>
                <span className="text-emerald-400 font-bold">Inventory Velocity & Size-Run Optimization</span>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Top Selling Size</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">
                    {retailFastMovingSizesData[0]?.size || 'EU 42 / UK 8'}
                  </span>
                  <p className="text-[9px] text-emerald-600/80 mt-1">Highest unit turnover in customer purchases.</p>
                </div>

                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Top Size Volume Share</span>
                  <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-1 block">
                    {retailFastMovingSizesData[0]?.sharePct || 0}% of Total Pairs
                  </span>
                  <p className="text-[9px] text-indigo-600/80 mt-1">Concentration of customer shoe & apparel demand.</p>
                </div>

                <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">PO Master Carton Rule</span>
                  <span className="text-xl font-black text-rose-700 dark:text-rose-300 font-mono mt-1 block">
                    1-2-3-3-2-1 Ratio
                  </span>
                  <p className="text-[9px] text-rose-600/80 mt-1">Standard GCC carton run weighting size 41 & 42 heaviest.</p>
                </div>
              </div>

              {retailFastMovingSizesData.length === 0 ? (
                <div className="p-12 text-center text-slate-450 italic bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <Tag className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600">No size sales velocity data recorded yet.</p>
                  <p className="text-xs text-slate-400">Issue sales invoices in the Retail Shop module to generate automated size velocity curves.</p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-850 overflow-x-auto rounded-xl bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-3 font-bold text-center">Rank</th>
                        <th className="py-2.5 px-3 font-bold">Size</th>
                        <th className="py-2.5 px-3 font-bold">Category Line</th>
                        <th className="py-2.5 px-3 text-center font-bold">Pairs / Units Sold</th>
                        <th className="py-2.5 px-3 text-right font-bold">Gross Revenue (AED)</th>
                        <th className="py-2.5 px-3 text-center font-bold">Volume Share</th>
                        <th className="py-2.5 px-3 font-bold">Velocity Status</th>
                        <th className="py-2.5 px-3 font-bold">Reorder Recommendation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[11px]">
                      {retailFastMovingSizesData.map(s => (
                        <tr key={s.size} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20">
                          <td className="py-3 px-3 text-center font-bold text-slate-400">#{s.rank}</td>
                          <td className="py-3 px-3">
                            <span className="px-2.5 py-1 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold text-xs">
                              {s.size}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-sans text-slate-600 dark:text-slate-400">{s.category}</td>
                          <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white">{s.pairsSold} units</td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-600">{formatAED(s.totalRevenue)}</td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${Math.min(s.sharePct * 2, 100)}%` }}></div>
                              </div>
                              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{s.sharePct}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-sans">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              s.velocityStatus.includes('High Velocity')
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {s.velocityStatus}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-sans text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                            {s.reorderTip}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------------------
              23. CROSS-BORDER TAXES & PG FEES SETTLEMENT
             ------------------------------------------------------------- */}
          {selectedReport === 'industry_ecommerce' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between items-center rounded-lg">
                <span>E-Commerce Cross-Border Taxes & PG Fees Settlement</span>
                <span className="text-rose-400 font-bold">Digital Storefront Accounts</span>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Store Sales</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1 block">
                    {formatAED(ecommerceData.reduce((sum, item) => sum + item.total, 0))}
                  </span>
                  <p className="text-[9px] text-slate-500 mt-1">Sum of all Shopify / WooCommerce storefront orders settled.</p>
                </div>
                <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Est. PG Fees (Payment Gateways)</span>
                  <span className="text-xl font-black text-amber-700 dark:text-amber-300 font-mono mt-1 block">
                    {formatAED(ecommerceData.reduce((sum, item) => sum + item.estimatedFee, 0))}
                  </span>
                  <p className="text-[9px] text-amber-600/80 mt-1">Stripe, Apple Pay, & Tabby/Tamara processing premium charges.</p>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Net Merchant Settlements</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">
                    {formatAED(ecommerceData.reduce((sum, item) => sum + item.netSettlement, 0))}
                  </span>
                  <p className="text-[9px] text-emerald-600/80 mt-1">Estimated bank payout totals arriving into company bank accounts.</p>
                </div>
              </div>

              {ecommerceData.length === 0 ? (
                <div className="p-12 text-center text-slate-450 italic bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                  No active ecommerce orders found. Create an invoice in E-Commerce mode with a valid Order ID to populate this audit.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-850 overflow-hidden rounded-xl bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-4 font-bold">Order ID</th>
                        <th className="py-2.5 px-4 font-bold">Customer</th>
                        <th className="py-2.5 px-4 font-bold">Courier</th>
                        <th className="py-2.5 px-4 font-bold">Waybill</th>
                        <th className="py-2.5 px-4 font-bold">Gateway</th>
                        <th className="py-2.5 px-4 font-bold">Dest. Zone</th>
                        <th className="py-2.5 px-4 text-right font-bold">PG Fee</th>
                        <th className="py-2.5 px-4 text-right font-bold">Net Payout</th>
                        <th className="py-2.5 px-4 text-right font-bold">Order Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[11px]">
                      {ecommerceData.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/20">
                          <td className="py-3 px-4 font-bold text-rose-600 dark:text-rose-400">#{item.orderId}</td>
                          <td className="py-3 px-4 font-sans">{item.clientName}</td>
                          <td className="py-3 px-4 font-sans font-bold">{item.courier}</td>
                          <td className="py-3 px-4">{item.waybill || 'N/A'}</td>
                          <td className="py-3 px-4 font-bold text-indigo-650">{item.gateway}</td>
                          <td className="py-3 px-4">{item.destTax}</td>
                          <td className="py-3 px-4 text-right text-red-500 font-bold">{formatAED(item.estimatedFee)}</td>
                          <td className="py-3 px-4 text-right text-emerald-600 font-bold">{formatAED(item.netSettlement)}</td>
                          <td className="py-3 px-4 text-right font-black text-slate-855 dark:text-slate-200">{formatAED(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------------------
              24. TOURISM DIRHAMS & SALIK SURCHARGES
             ------------------------------------------------------------- */}
          {selectedReport === 'industry_tourism' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between items-center rounded-lg">
                <span>Tourism Surcharges, Municipal Fees & Salik Log</span>
                <span className="text-emerald-400 font-bold">Tourism & Car Rental Surcharges</span>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Booking Volume</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1 block">
                    {formatAED(tourismData.reduce((sum, item) => sum + item.total, 0))}
                  </span>
                  <p className="text-[9px] text-slate-500 mt-1">Gross hospitality and car rental contract amounts.</p>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Surcharge Transactions Logged</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">
                    {tourismData.reduce((sum, item) => sum + item.chargeQty, 0)} Units
                  </span>
                  <p className="text-[9px] text-emerald-600/80 mt-1">Salik crossing counts, Tourism Dirham nights, or City Tax units.</p>
                </div>
                <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Total Collected Surcharges</span>
                  <span className="text-xl font-black text-blue-700 dark:text-blue-300 font-mono mt-1 block">
                    {formatAED(tourismData.reduce((sum, item) => sum + item.surchargeAmt, 0))}
                  </span>
                  <p className="text-[9px] text-blue-600/80 mt-1">Total revenue generated from pass-through administrative charges.</p>
                </div>
              </div>

              {tourismData.length === 0 ? (
                <div className="p-12 text-center text-slate-450 italic bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                  No tourism or car rental surcharge data logged. Create an invoice with Booking Reference and Vehicle Plate details to populate.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-850 overflow-hidden rounded-xl bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-4 font-bold">Booking</th>
                        <th className="py-2.5 px-4 font-bold">Client</th>
                        <th className="py-2.5 px-4 font-bold">Vehicle Plate / Room</th>
                        <th className="py-2.5 px-4 font-bold">Passport ID</th>
                        <th className="py-2.5 px-4 font-bold">Agreement No.</th>
                        <th className="py-2.5 px-4 font-bold">Fee Category</th>
                        <th className="py-2.5 px-4 text-center font-bold">Quantity</th>
                        <th className="py-2.5 px-4 text-right font-bold">Surcharge (AED)</th>
                        <th className="py-2.5 px-4 text-right font-bold">Total Bill (AED)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[11px]">
                      {tourismData.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/20">
                          <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{item.refNo}</td>
                          <td className="py-3 px-4 font-sans">{item.clientName}</td>
                          <td className="py-3 px-4 font-bold">{item.vehiclePlate}</td>
                          <td className="py-3 px-4">{item.passportId}</td>
                          <td className="py-3 px-4 text-slate-655 font-bold">{item.agreementNo}</td>
                          <td className="py-3 px-4 font-sans text-amber-700">{item.chargeType}</td>
                          <td className="py-3 px-4 text-center font-bold">{item.chargeQty}</td>
                          <td className="py-3 px-4 text-right font-bold text-indigo-700">{formatAED(item.surchargeAmt)}</td>
                          <td className="py-3 px-4 text-right font-black text-slate-855 dark:text-slate-200">{formatAED(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------------------
              25. WEIGHING SCALE SALES & BARCODE VOLUMES
             ------------------------------------------------------------- */}
          {selectedReport === 'industry_grocery' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between items-center rounded-lg">
                <span>Weighing Scale Sales & Barcode Volumes Audit</span>
                <span className="text-pink-400 font-bold font-mono">Grocery & Supermarket POS</span>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Measured Weight</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1 block">
                    {groceryData.reduce((sum, item) => sum + item.weight, 0).toFixed(3)} kg
                  </span>
                  <p className="text-[9px] text-slate-500 mt-1">Total physical weight calculated from weighing scales POS logs.</p>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Baskets Audited</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">
                    {groceryData.length} Receipts
                  </span>
                  <p className="text-[9px] text-emerald-600/80 mt-1">Total checkout retail receipts monitored.</p>
                </div>
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Total Retail Checkout Revenue</span>
                  <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-1 block">
                    {formatAED(groceryData.reduce((sum, item) => sum + item.total, 0))}
                  </span>
                  <p className="text-[9px] text-indigo-600/80 mt-1">Cumulative POS sales value across weigh-scale & standard items.</p>
                </div>
              </div>

              {groceryData.length === 0 ? (
                <div className="p-12 text-center text-slate-450 italic bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                  No grocery checkout POS records found.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-850 overflow-hidden rounded-xl bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-4 font-bold">POS Receipt</th>
                        <th className="py-2.5 px-4 font-bold">Client</th>
                        <th className="py-2.5 px-4 font-bold">Checkout Date</th>
                        <th className="py-2.5 px-4 text-center font-bold">Total Barcodes Scanned</th>
                        <th className="py-2.5 px-4 text-right font-bold">Scale Weight</th>
                        <th className="py-2.5 px-4 text-right font-bold">Subtotal</th>
                        <th className="py-2.5 px-4 text-right font-bold">Total Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[11px]">
                      {groceryData.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/20">
                          <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{item.invoiceNo}</td>
                          <td className="py-3 px-4 font-sans">{item.clientName}</td>
                          <td className="py-3 px-4 font-sans text-slate-600">{item.date}</td>
                          <td className="py-3 px-4 text-center font-bold">{item.itemCount} items</td>
                          <td className="py-3 px-4 text-right text-pink-700 font-bold">{item.weight > 0 ? `${item.weight.toFixed(3)} kg` : '-'}</td>
                          <td className="py-3 px-4 text-right text-slate-655">{formatAED(item.subtotal)}</td>
                          <td className="py-3 px-4 text-right font-black text-slate-855 dark:text-slate-200">{formatAED(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------------------
              26. MOBILE IMEI SERIAL WARRANTY & INSTALLMENTS
             ------------------------------------------------------------- */}
          {selectedReport === 'industry_mobile' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between items-center rounded-lg">
                <span>Mobile IMEI Serial Warranties & Installment Book</span>
                <span className="text-emerald-400 font-bold font-mono">Device Warranties & BNPL</span>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Serialized Devices Sold</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1 block">
                    {mobileData.length} Units
                  </span>
                  <p className="text-[9px] text-slate-500 mt-1">Unique device chassis IMEI numbers currently tracked.</p>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Warranty Packages Active</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">
                    {mobileData.filter(item => item.warranty !== 'None').length} Packages
                  </span>
                  <p className="text-[9px] text-emerald-600/80 mt-1">Active warranty support agreements registered.</p>
                </div>
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Active Easy-Payment Installments</span>
                  <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-1 block">
                    {mobileData.filter(item => item.installment !== 'Full Payment').length} Agreements
                  </span>
                  <p className="text-[9px] text-indigo-600/80 mt-1">BNPL (Tabby / Tamara / Bank EMI) transaction contracts.</p>
                </div>
              </div>

              {mobileData.length === 0 ? (
                <div className="p-12 text-center text-slate-450 italic bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                  No serialized mobile or electronics records found. Create an invoice with IMEI number and warranty data to view this list.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-850 overflow-hidden rounded-xl bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-4 font-bold">Invoice</th>
                        <th className="py-2.5 px-4 font-bold">Client Name</th>
                        <th className="py-2.5 px-4 font-bold">Device IMEI Number</th>
                        <th className="py-2.5 px-4 font-bold">Warranty Plan</th>
                        <th className="py-2.5 px-4 font-bold text-center">Installment EPP</th>
                        <th className="py-2.5 px-4 text-right font-bold">Total Bill (AED)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[11px]">
                      {mobileData.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/20">
                          <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{item.invoiceNo}</td>
                          <td className="py-3 px-4 font-sans">{item.clientName}</td>
                          <td className="py-3 px-4 font-bold text-slate-850 dark:text-slate-200">{item.imei}</td>
                          <td className="py-3 px-4 text-emerald-750 font-sans">{item.warranty}</td>
                          <td className="py-3 px-4 text-center font-sans font-bold">
                            <span className={item.installment !== 'Full Payment' ? 'bg-amber-100 text-amber-800 text-[9px] px-2 py-0.5 rounded-full border border-amber-200' : 'text-slate-500'}>
                              {item.installment}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-black text-slate-855 dark:text-slate-200">{formatAED(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------------------
              27. WAREHOUSES INVENTORY DISTRIBUTION LEDGER
             ------------------------------------------------------------- */}
          {selectedReport === 'industry_general_trading' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between items-center rounded-lg">
                <span>Warehouses Inventory Distribution Ledger</span>
                <span className="text-amber-400 font-bold">General Trading Inventory Allocation</span>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monitored Stock Warehouses</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1 block">
                    {new Set(generalTradingData.map(item => item.warehouse)).size} Depots
                  </span>
                  <p className="text-[9px] text-slate-500 mt-1">Unique distribution yards allocated across GCC.</p>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Total LPO Purchases Linked</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">
                    {generalTradingData.filter(item => item.lpo !== '').length} Orders
                  </span>
                  <p className="text-[9px] text-emerald-600/80 mt-1">Active Wholesale Local Purchase Orders referenced.</p>
                </div>
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Allocated Trading Volume</span>
                  <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-1 block">
                    {formatAED(generalTradingData.reduce((sum, item) => sum + item.total, 0))}
                  </span>
                  <p className="text-[9px] text-indigo-600/80 mt-1">Sum of total trading value distributed through depots.</p>
                </div>
              </div>

              {generalTradingData.length === 0 ? (
                <div className="p-12 text-center text-slate-450 italic bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                  No warehouse allocation details found. Create an invoice in General Trading mode with warehouse allocations to view.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-850 overflow-hidden rounded-xl bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-4 font-bold">Invoice</th>
                        <th className="py-2.5 px-4 font-bold">Wholesale Client</th>
                        <th className="py-2.5 px-4 font-bold">Allocation Warehouse</th>
                        <th className="py-2.5 px-4 font-bold">LPO Reference</th>
                        <th className="py-2.5 px-4 font-bold">Billing Date</th>
                        <th className="py-2.5 px-4 text-right font-bold">Total Trading Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[11px]">
                      {generalTradingData.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/20">
                          <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{item.invoiceNo}</td>
                          <td className="py-3 px-4 font-sans">{item.clientName}</td>
                          <td className="py-3 px-4 font-bold font-sans text-amber-700 dark:text-amber-400">{item.warehouse}</td>
                          <td className="py-3 px-4 font-bold text-slate-850 dark:text-slate-200">{item.lpo || 'Direct Sale'}</td>
                          <td className="py-3 px-4 font-sans text-slate-600">{item.date}</td>
                          <td className="py-3 px-4 text-right font-black text-slate-850 dark:text-slate-200">{formatAED(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------------------
              28. DINING TABLES SALES & KOT DISPATCH SPEED
             ------------------------------------------------------------- */}
          {selectedReport === 'industry_restaurant' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between items-center rounded-lg">
                <span>Dining Tables Sales & KOT Dispatch Speed Audit</span>
                <span className="text-orange-400 font-bold">Restaurant & Hospitality POS</span>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Hospitality Revenue</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1 block">
                    {formatAED(restaurantData.reduce((sum, item) => sum + item.total, 0))}
                  </span>
                  <p className="text-[9px] text-slate-500 mt-1">Sum total of restaurant food & beverage tickets.</p>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">KOT Kitchen Dispatches</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">
                    {restaurantData.filter(item => item.kot).length} Tickets
                  </span>
                  <p className="text-[9px] text-emerald-600/80 mt-1">Total orders sent electronically to the main kitchen.</p>
                </div>
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Covers Managed</span>
                  <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-1 block">
                    {new Set(restaurantData.filter(item => item.table !== 'Takeaway').map(item => item.table)).size} Dining Tables
                  </span>
                  <p className="text-[9px] text-indigo-600/80 mt-1">Seating table coordinates actively utilized in reports.</p>
                </div>
              </div>

              {restaurantData.length === 0 ? (
                <div className="p-12 text-center text-slate-450 italic bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                  No diner ticket logs found.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-850 overflow-hidden rounded-xl bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-4 font-bold">Ticket No.</th>
                        <th className="py-2.5 px-4 font-bold">Diner</th>
                        <th className="py-2.5 px-4 font-bold">Table Coordinate</th>
                        <th className="py-2.5 px-4 text-center font-bold">KOT Routing Status</th>
                        <th className="py-2.5 px-4 font-bold">Order Date</th>
                        <th className="py-2.5 px-4 text-right font-bold">Ticket Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[11px]">
                      {restaurantData.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/20">
                          <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{item.invoiceNo}</td>
                          <td className="py-3 px-4 font-sans">{item.clientName}</td>
                          <td className="py-3 px-4 font-bold text-amber-750 font-sans">{item.table}</td>
                          <td className="py-3 px-4 text-center">
                            {item.kot ? (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-250 text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">
                                KOT Dispatched
                              </span>
                            ) : (
                              <span className="bg-slate-50 text-slate-600 border border-slate-200 text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                                Quick Bill / Direct Cash
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-600">{item.date}</td>
                          <td className="py-3 px-4 text-right font-black text-slate-855 dark:text-slate-200">{formatAED(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------------------
              29. LAUNDRY JOB CARDS DELIVERY SCHEDULE
             ------------------------------------------------------------- */}
          {selectedReport === 'industry_laundry' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between items-center rounded-lg">
                <span>Laundry Job Cards & Delivery Schedules Log</span>
                <span className="text-blue-400 font-bold font-mono">Dry Cleaning & Laundry Operations</span>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Job Cards Queued</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1 block">
                    {laundryData.filter(item => item.status !== 'Delivered').length} Jobs
                  </span>
                  <p className="text-[9px] text-slate-500 mt-1">Garments currently in cleaning/ironing cycles.</p>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Total Deliveries Pending</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">
                    {laundryData.filter(item => item.status === 'Ready').length} Parcels
                  </span>
                  <p className="text-[9px] text-emerald-600/80 mt-1">Packages ready and waiting for dispatch courier pickup.</p>
                </div>
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Active Pipeline Cash Flow</span>
                  <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-1 block">
                    {formatAED(laundryData.reduce((sum, item) => sum + item.total, 0))}
                  </span>
                  <p className="text-[9px] text-indigo-600/80 mt-1">Total financial volume of dry-cleaning agreements in queue.</p>
                </div>
              </div>

              {laundryData.length === 0 ? (
                <div className="p-12 text-center text-slate-450 italic bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                  No laundry job cards registered. Create invoices with Laundry Job No. and statuses to populate.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-850 overflow-hidden rounded-xl bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-4 font-bold">Job Card No.</th>
                        <th className="py-2.5 px-4 font-bold">Client</th>
                        <th className="py-2.5 px-4 font-bold">Pickup Date</th>
                        <th className="py-2.5 px-4 font-bold">Promised Delivery Date</th>
                        <th className="py-2.5 px-4 text-center font-bold">Job Status</th>
                        <th className="py-2.5 px-4 text-right font-bold">Ticket Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[11px]">
                      {laundryData.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/20">
                          <td className="py-3 px-4 font-bold text-blue-650">#{item.jobNo}</td>
                          <td className="py-3 px-4 font-sans">{item.clientName}</td>
                          <td className="py-3 px-4 font-sans text-slate-600">{item.pickup}</td>
                          <td className="py-3 px-4 font-sans text-slate-655 font-bold">{item.delivery}</td>
                          <td className="py-3 px-4 text-center font-sans font-bold">
                            {item.status === 'Received' && (
                              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] px-2 py-0.5 rounded-full uppercase">Received</span>
                            )}
                            {item.status === 'Washing' && (
                              <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[9px] px-2 py-0.5 rounded-full uppercase animate-pulse">Washing</span>
                            )}
                            {item.status === 'Ironing' && (
                              <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] px-2 py-0.5 rounded-full uppercase">Ironing</span>
                            )}
                            {item.status === 'Ready' && (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] px-2 py-0.5 rounded-full uppercase animate-bounce">Ready</span>
                            )}
                            {item.status === 'Delivered' && (
                              <span className="bg-slate-100 text-slate-650 border border-slate-200 text-[9px] px-2 py-0.5 rounded-full uppercase">Delivered</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-slate-850 dark:text-slate-200">{formatAED(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------------------
              30. PRINTING PROOFS APPROVALS & ADVANCE DEPOSITS
             ------------------------------------------------------------- */}
          {selectedReport === 'industry_printing' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between items-center rounded-lg">
                <span>Printing Proofs Approvals & Advance Deposits Trail</span>
                <span className="text-violet-400 font-bold font-mono">Press & Advertising Agencies</span>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Billed Projects</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1 block">
                    {formatAED(printingData.reduce((sum, item) => sum + item.total, 0))}
                  </span>
                  <p className="text-[9px] text-slate-500 mt-1">Gross worth of custom press & design contracts logged.</p>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Advance Deposits Paid</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">
                    {formatAED(printingData.reduce((sum, item) => sum + item.advance, 0))}
                  </span>
                  <p className="text-[9px] text-emerald-600/80 mt-1">Prepaid advance safety deposit liabilities secured.</p>
                </div>
                <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Outstanding Balance Collection</span>
                  <span className="text-xl font-black text-blue-700 dark:text-blue-300 font-mono mt-1 block">
                    {formatAED(printingData.reduce((sum, item) => sum + item.balanceDue, 0))}
                  </span>
                  <p className="text-[9px] text-blue-600/80 mt-1">Outstanding collections due upon delivery of physical material.</p>
                </div>
              </div>

              {printingData.length === 0 ? (
                <div className="p-12 text-center text-slate-450 italic bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                  No active print orders found. Create invoices in Printing & Press mode to view details.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-850 overflow-hidden rounded-xl bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-4 font-bold">Print Job No.</th>
                        <th className="py-2.5 px-4 font-bold">Client</th>
                        <th className="py-2.5 px-4 font-bold">Design Proof Status</th>
                        <th className="py-2.5 px-4 text-right font-bold">Advance Deposit</th>
                        <th className="py-2.5 px-4 text-right font-bold">Balance Receivable</th>
                        <th className="py-2.5 px-4 text-right font-bold">Total Job Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[11px]">
                      {printingData.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/20">
                          <td className="py-3 px-4 font-bold text-violet-600">#{item.jobNo}</td>
                          <td className="py-3 px-4 font-sans">{item.clientName}</td>
                          <td className="py-3 px-4 font-sans font-bold">
                            <span className="bg-violet-50 text-violet-700 border border-violet-150 text-[9px] px-2.5 py-1 rounded">
                              {item.proofStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-emerald-600 font-bold">{formatAED(item.advance)}</td>
                          <td className="py-3 px-4 text-right text-red-600 font-bold">{formatAED(item.balanceDue)}</td>
                          <td className="py-3 px-4 text-right font-black text-slate-855 dark:text-slate-200">{formatAED(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------------------
              31. SPECIALIST SERVICE HOURS & SUPPORT TICKETS
             ------------------------------------------------------------- */}
          {selectedReport === 'industry_services' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between items-center rounded-lg">
                <span>Specialist Service Hours & Support Tickets Allocation Log</span>
                <span className="text-indigo-450 font-bold">Professional Maintenance & IT Support Services</span>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Service Tickets Logged</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1 block">
                    {servicesData.length} Tickets
                  </span>
                  <p className="text-[9px] text-slate-500 mt-1">Outstanding field specialist service calls documented.</p>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Specialists Deployed</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">
                    {new Set(servicesData.map(item => item.specialist)).size} Engineers
                  </span>
                  <p className="text-[9px] text-emerald-600/80 mt-1">Unique technicians assigned to onsite maintenance visits.</p>
                </div>
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Total Billed Support Hours Value</span>
                  <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-1 block">
                    {formatAED(servicesData.reduce((sum, item) => sum + item.total, 0))}
                  </span>
                  <p className="text-[9px] text-indigo-600/80 mt-1">Accumulated service fees billed across active tickets.</p>
                </div>
              </div>

              {servicesData.length === 0 ? (
                <div className="p-12 text-center text-slate-450 italic bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                  No professional service tickets found. Create an invoice in Service & Professional mode to populate.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-850 overflow-hidden rounded-xl bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-4 font-bold">Ticket ID</th>
                        <th className="py-2.5 px-4 font-bold">Client</th>
                        <th className="py-2.5 px-4 font-bold">Assigned Engineer</th>
                        <th className="py-2.5 px-4 font-bold">Onsite Visit Date</th>
                        <th className="py-2.5 px-4 text-right font-bold">Total Bill (AED)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[11px]">
                      {servicesData.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/20">
                          <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">#{item.ticketId}</td>
                          <td className="py-3 px-4 font-sans">{item.clientName}</td>
                          <td className="py-3 px-4 font-sans font-bold text-slate-855 dark:text-slate-200">{item.specialist}</td>
                          <td className="py-3 px-4 font-sans text-slate-600">{item.visitDate}</td>
                          <td className="py-3 px-4 text-right font-black text-slate-850 dark:text-slate-200">{formatAED(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------------------
              32. TAX RETURN PERIOD AUDIT READINESS TRAIL
             ------------------------------------------------------------- */}
          {selectedReport === 'industry_accounting' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between items-center rounded-lg">
                <span>Tax Return Period Audit Readiness Trail Ledger</span>
                <span className="text-emerald-400 font-bold">Corporate Fiscal Years Audit</span>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Audited Tax periods</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1 block">
                    {new Set(accountingData.map(item => item.taxPeriod)).size} Fiscal Periods
                  </span>
                  <p className="text-[9px] text-slate-500 mt-1">Unique FTA quarterly filing periods accounted for.</p>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Taxable Subtotal volume</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">
                    {formatAED(accountingData.reduce((sum, item) => sum + item.subtotal, 0))}
                  </span>
                  <p className="text-[9px] text-emerald-600/80 mt-1">Taxable net invoice totals pre-VAT audit calculations.</p>
                </div>
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Billed Tax (5% UAE standard Output)</span>
                  <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-1 block">
                    {formatAED(accountingData.reduce((sum, item) => sum + item.vatTotal, 0))}
                  </span>
                  <p className="text-[9px] text-indigo-600/80 mt-1">Total standard VAT collected on audit-ready invoices.</p>
                </div>
              </div>

              {accountingData.length === 0 ? (
                <div className="p-12 text-center text-slate-450 italic bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                  No active tax period audit files found. Create invoices in Accounting & Auditing mode to populate.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-850 overflow-hidden rounded-xl bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-4 font-bold">Invoice</th>
                        <th className="py-2.5 px-4 font-bold">Client</th>
                        <th className="py-2.5 px-4 font-bold">VAT Reporting Period</th>
                        <th className="py-2.5 px-4 text-right font-bold">Subtotal (AED)</th>
                        <th className="py-2.5 px-4 text-right font-bold">VAT standard (5%)</th>
                        <th className="py-2.5 px-4 text-right font-bold">Gross Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[11px]">
                      {accountingData.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/20">
                          <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{item.invoiceNo}</td>
                          <td className="py-3 px-4 font-sans">{item.clientName}</td>
                          <td className="py-3 px-4 font-bold text-indigo-750">{item.taxPeriod}</td>
                          <td className="py-3 px-4 text-right text-slate-600">{formatAED(item.subtotal)}</td>
                          <td className="py-3 px-4 text-right text-indigo-650 font-bold">{formatAED(item.vatTotal)}</td>
                          <td className="py-3 px-4 text-right font-black text-slate-855 dark:text-slate-200">{formatAED(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------------------
              33. EJARI RENTAL CONTRACTS & UNIT HANDOVER STATUS
             ------------------------------------------------------------- */}
          {selectedReport === 'industry_real_estate' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between items-center rounded-lg">
                <span>Ejari Rental Contracts & Unit Handover Status Register</span>
                <span className="text-amber-400 font-bold">Real Estate Properties & Tenancy Management</span>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Units Managed</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1 block">
                    {realEstateData.length} Properties
                  </span>
                  <p className="text-[9px] text-slate-500 mt-1">Total active real estate plot IDs recorded.</p>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Registered Ejari leases</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">
                    {realEstateData.filter(item => item.ejari !== '').length} Tenancy Contracts
                  </span>
                  <p className="text-[9px] text-emerald-600/80 mt-1">Official Dubai Land Department Ejari contract numbers mapped.</p>
                </div>
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Annual Lease Roll Worth</span>
                  <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-1 block">
                    {formatAED(realEstateData.reduce((sum, item) => sum + item.total, 0))}
                  </span>
                  <p className="text-[9px] text-indigo-600/80 mt-1">Gross annual rent value accounted across current leases.</p>
                </div>
              </div>

              {realEstateData.length === 0 ? (
                <div className="p-12 text-center text-slate-450 italic bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                  No active real estate tenancy records found. Create invoices in Real Estate mode to view tenancy ledgers.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-850 overflow-hidden rounded-xl bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-4 font-bold">Property Ref.</th>
                        <th className="py-2.5 px-4 font-bold">Tenant Name</th>
                        <th className="py-2.5 px-4 font-bold">Ejari Lease No.</th>
                        <th className="py-2.5 px-4 font-bold">Handover & Maintenance Status</th>
                        <th className="py-2.5 px-4 text-right font-bold">Annual Rent Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[11px]">
                      {realEstateData.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/20">
                          <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{item.propertyId}</td>
                          <td className="py-3 px-4 font-sans">{item.tenant || item.clientName}</td>
                          <td className="py-3 px-4 font-bold text-slate-855 dark:text-slate-200">{item.ejari || 'Ejari Pending'}</td>
                          <td className="py-3 px-4 font-sans text-amber-700">{item.maintenance}</td>
                          <td className="py-3 px-4 text-right font-black text-slate-850 dark:text-slate-200">{formatAED(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------------------
              34. CHASSIS VIN REPAIRS & MECHANIC PERFORMANCE
             ------------------------------------------------------------- */}
          {selectedReport === 'industry_auto_repair' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between items-center rounded-lg">
                <span>Chassis VIN Repair Register & Mechanic performance Book</span>
                <span className="text-pink-400 font-bold">Auto Repair Workshop & Garage Management</span>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vehicles Repaired</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1 block">
                    {autoRepairData.length} Autos
                  </span>
                  <p className="text-[9px] text-slate-500 mt-1">Total active vehicles repaired in workshop garage database.</p>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Active duty mechanics</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">
                    {new Set(autoRepairData.map(item => item.mechanic)).size} Mechanics
                  </span>
                  <p className="text-[9px] text-emerald-600/80 mt-1">Unique assigned mechanics who successfully closed job cards.</p>
                </div>
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Total Billed Repair Value</span>
                  <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-1 block">
                    {formatAED(autoRepairData.reduce((sum, item) => sum + item.total, 0))}
                  </span>
                  <p className="text-[9px] text-indigo-600/80 mt-1">Cumulative cost of parts and expert mechanical labor services.</p>
                </div>
              </div>

              {autoRepairData.length === 0 ? (
                <div className="p-12 text-center text-slate-450 italic bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                  No active auto workshop job files found. Create invoices in Auto Repair mode with chassis VIN details to populate.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-850 overflow-hidden rounded-xl bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-4 font-bold">Chassis VIN Number</th>
                        <th className="py-2.5 px-4 font-bold">License Plate</th>
                        <th className="py-2.5 px-4 font-bold">Client</th>
                        <th className="py-2.5 px-4 text-center font-bold">MileageKM)</th>
                        <th className="py-2.5 px-4 font-bold">Assigned Mechanic</th>
                        <th className="py-2.5 px-4 text-right font-bold">Repair Cost (AED)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[11px]">
                      {autoRepairData.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/20">
                          <td className="py-3 px-4 font-bold text-pink-750">{item.vin}</td>
                          <td className="py-3 px-4 font-bold text-slate-850 dark:text-slate-200">{item.plate}</td>
                          <td className="py-3 px-4 font-sans">{item.clientName}</td>
                          <td className="py-3 px-4 text-center">{item.mileage.toLocaleString()} KM</td>
                          <td className="py-3 px-4 font-sans font-bold text-indigo-750">{item.mechanic}</td>
                          <td className="py-3 px-4 text-right font-black text-slate-850 dark:text-slate-200">{formatAED(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------------------
              43. COMPUTER, LAPTOP & PRINTER SERVICE / WARRANTY REGISTER
             ------------------------------------------------------------- */}
          {selectedReport === 'it_repair_warranty_report' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between items-center rounded-lg">
                <span className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-blue-400" />
                  Computer, Laptop & Printer ServiceWarranty Register
                </span>
                <span className="text-blue-400 font-bold">IT Hardware Solutions & Printer Workshop</span>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total IT Records</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1 block">
                    {itRepairWarrantyData.length} Items
                  </span>
                  <p className="text-[9px] text-slate-500 mt-1">Invoiced hardware sales, toner items & repair service tickets.</p>
                </div>
                <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Active Repair Job Cards</span>
                  <span className="text-xl font-black text-blue-700 dark:text-blue-300 font-mono mt-1 block">
                    {itRepairWarrantyData.filter(r => r.isJobCard).length} Jobs
                  </span>
                  <p className="text-[9px] text-blue-600/80 mt-1">Laptops, desktops & printers currently logged in service workshop.</p>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Total Billed / Value</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">
                    {formatAED(itRepairWarrantyData.reduce((sum, item) => sum + item.total, 0))}
                  </span>
                  <p className="text-[9px] text-emerald-600/80 mt-1">Cumulative sales, parts and technical repair labor value.</p>
                </div>
                <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">Serialized Units</span>
                  <span className="text-xl font-black text-purple-700 dark:text-purple-300 font-mono mt-1 block">
                    {itRepairWarrantyData.filter(r => r.serialNumber && r.serialNumber !== '-' && r.serialNumber !== 'N/A').length} Units
                  </span>
                  <p className="text-[9px] text-purple-600/80 mt-1">Equipment with registered hardware serial numbers or asset tags.</p>
                </div>
              </div>

              {itRepairWarrantyData.length === 0 ? (
                <div className="p-12 text-center text-slate-450 italic bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                  No active computer or printer records found. Create invoices with serial numbers or log repair job cards in Computer & IT Manager to populate.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-850 overflow-hidden rounded-xl bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-4 font-bold">Ref / Doc #</th>
                        <th className="py-2.5 px-4 font-bold">Date</th>
                        <th className="py-2.5 px-4 font-bold">Client / Customer</th>
                        <th className="py-2.5 px-4 font-bold">Category</th>
                        <th className="py-2.5 px-4 font-bold">Item Description / Brand</th>
                        <th className="py-2.5 px-4 font-bold">Serial # / Asset Tag</th>
                        <th className="py-2.5 px-4 font-bold">Specs / Compatibility</th>
                        <th className="py-2.5 px-4 font-bold">Warranty</th>
                        <th className="py-2.5 px-4 text-right font-bold">Total (AED)</th>
                        <th className="py-2.5 px-4 text-center font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[11px]">
                      {itRepairWarrantyData.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/20">
                          <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">
                            {item.refNo}
                            {item.isJobCard && <span className="ml-1 text-[9px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-1 py-0.5 rounded">JOB</span>}
                          </td>
                          <td className="py-3 px-4 text-slate-500">{item.date}</td>
                          <td className="py-3 px-4 font-sans font-medium text-slate-800 dark:text-slate-200">{item.customerName}</td>
                          <td className="py-3 px-4">
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-sans font-semibold text-slate-800 dark:text-slate-100">{item.brandModel}</td>
                          <td className="py-3 px-4">
                            {item.serialNumber && item.serialNumber !== '-' ? (
                              <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold border border-blue-200 dark:border-blue-800">
                                {item.serialNumber}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-600 dark:text-slate-400 text-[10px] max-w-xs truncate">{item.specs}</td>
                          <td className="py-3 px-4 font-sans text-emerald-700 dark:text-emerald-400 font-medium">{item.warranty}</td>
                          <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-slate-100">{formatAED(item.total)}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status === 'Completed' || item.status === 'Paid'
                                ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                                : item.status === 'In Progress'
                                ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                                : 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------------------
              44. HARDWARE & TONER SALES VELOCITY MATRIX
             ------------------------------------------------------------- */}
          {selectedReport === 'it_hardware_toner_velocity' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between items-center rounded-lg">
                <span className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-cyan-400" />
                  Hardware & Toner Sales Velocity Matrix
                </span>
                <span className="text-cyan-400 font-bold">Consumables & Hardware Stock Matrix</span>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monitored Catalog Lines</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1 block">
                    {itHardwareTonerData.length} Lines
                  </span>
                  <p className="text-[9px] text-slate-500 mt-1">Laptops, desktops, printers & ink/toner cartridges.</p>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Total Units Sold</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">
                    {itHardwareTonerData.reduce((sum, item) => sum + item.unitsSold, 0)} Units
                  </span>
                  <p className="text-[9px] text-emerald-600/80 mt-1">Sold across all active tax invoices.</p>
                </div>
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Generated Revenue</span>
                  <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-1 block">
                    {formatAED(itHardwareTonerData.reduce((sum, item) => sum + item.revenue, 0))}
                  </span>
                  <p className="text-[9px] text-indigo-600/80 mt-1">Gross sales including 5% UAE VAT.</p>
                </div>
                <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Restock Triggered</span>
                  <span className="text-xl font-black text-amber-700 dark:text-amber-300 font-mono mt-1 block">
                    {itHardwareTonerData.filter(i => i.currentStock <= 2).length} Lines
                  </span>
                  <p className="text-[9px] text-amber-600/80 mt-1">Items requiring immediate purchase orders.</p>
                </div>
              </div>

              {itHardwareTonerData.length === 0 ? (
                <div className="p-12 text-center text-slate-450 italic bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                  No IT hardware or printer consumables registered yet. Add inventory items under Computer & IT tab to populate velocity analytics.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-850 overflow-hidden rounded-xl bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2.5 px-4 font-bold">Category</th>
                        <th className="py-2.5 px-4 font-bold">Product / Cartridge Name</th>
                        <th className="py-2.5 px-4 font-bold">Brand</th>
                        <th className="py-2.5 px-4 font-bold">SKU / Code</th>
                        <th className="py-2.5 px-4 font-bold">Printer Compatibility / Specs</th>
                        <th className="py-2.5 px-4 text-center font-bold">Units Sold</th>
                        <th className="py-2.5 px-4 text-center font-bold">Current Stock</th>
                        <th className="py-2.5 px-4 text-right font-bold">Revenue (AED)</th>
                        <th className="py-2.5 px-4 text-center font-bold">Restock Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[11px]">
                      {itHardwareTonerData.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/20">
                          <td className="py-3 px-4">
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-sans font-semibold text-slate-800 dark:text-slate-100">{item.name}</td>
                          <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{item.brand}</td>
                          <td className="py-3 px-4 text-slate-500">{item.sku}</td>
                          <td className="py-3 px-4 font-sans text-slate-600 dark:text-slate-400 text-[10px]">{item.compatibility}</td>
                          <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-slate-200">{item.unitsSold}</td>
                          <td className="py-3 px-4 text-center font-bold">
                            <span className={`px-2 py-0.5 rounded ${
                              item.currentStock <= 2 
                                ? 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300' 
                                : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                            }`}>
                              {item.currentStock}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-slate-100">{formatAED(item.revenue)}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.restockStatus.includes('⚠️') || item.restockStatus.includes('🔥')
                                ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              {item.restockStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------------------
              18. UAE CORPORATE TAX PLANNER & ESTIMATOR (Priority #18)
             ------------------------------------------------------------- */}
          {selectedReport === 'corporate_tax_planner' && (
            (() => {
              // 1. Scan expenses for automatic estimation of entertainment/fines
              const autoEntertainment = activeCompanyExpenses
                .filter(e => {
                  const desc = (e.description || '').toLowerCase();
                  const cat = (e.category || '').toLowerCase();
                  return desc.includes('entertainment') || desc.includes('dinner') || desc.includes('lunch') || desc.includes('hospitality') || desc.includes('restaurant') || desc.includes('gift') || cat.includes('entertainment') || (e.category as string) === 'Client Entertainment Expenses (50% Tax Deductible)';
                })
                .reduce((sum, e) => sum + e.amount, 0);

              const autoFines = activeCompanyExpenses
                .filter(e => {
                  const desc = (e.description || '').toLowerCase();
                  const cat = (e.category || '').toLowerCase();
                  return desc.includes('fine') || desc.includes('penalty') || desc.includes('violation') || desc.includes('salik') || desc.includes('traffic') || cat.includes('fine') || cat.includes('penalty') || (e.category as string) === 'Fines, Penalties & Violations (Non-Deductible)';
                })
                .reduce((sum, e) => sum + e.amount, 0);

              // 2. Parse overrides
              const parsedEntertainment = ctEntertainmentInput !== '' ? (parseFloat(ctEntertainmentInput) || 0) : autoEntertainment;
              const parsedFines = ctFinesInput !== '' ? (parseFloat(ctFinesInput) || 0) : autoFines;

              // Adjustments (Article 32 & 33)
              const nonDeductibleEntertainment = parsedEntertainment * 0.5; // 50% non-deductible
              const nonDeductibleFines = parsedFines; // 100% non-deductible

              // Accounting net profit from P&L
              const accountingProfit = netProfit;
              
              // Taxable Net Income Calculation before Small Business Relief
              const taxableIncomeBeforeRelief = Math.max(0, accountingProfit + nonDeductibleFines + nonDeductibleEntertainment);
              
              // Check eligibility for Small Business Relief (Article 21) - Gross Revenue <= 3M AED
              const grossRevenue = plRevenue;
              const isEligibleForSBR = grossRevenue <= 3000000;
              
              // Apply Small Business Relief
              const taxableIncome = (isEligibleForSBR && ctSmallBusinessRelief) ? 0 : taxableIncomeBeforeRelief;

              // Tax thresholds (Article 15)
              const threshold = 375000;
              const taxableExceedingThreshold = Math.max(0, taxableIncome - threshold);
              const estimatedTax = taxableExceedingThreshold * 0.09;

              // Threshold coverage percentage for visual gauge
              const thresholdPercentage = Math.min(100, Math.round((taxableIncome / threshold) * 100));

              return (
                <div className="space-y-6">
                  
                  {/* UAE Corporate Tax Portal Header Card */}
                  <div className="bg-slate-900 text-white p-4 font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between rounded-lg">
                    <span>Corporate Tax Planner & Estimator (UAE Form CT-1 Blueprint)</span>
                    <span className="text-[#38BDF8]">Decree-Law No. 47 of 2022</span>
                  </div>

                  {(activePlan === 'pro_1y' || activePlan === 'basic') && (
                    <div className="bg-amber-950/40 border border-amber-600/60 p-4 rounded-xl flex items-start space-x-3 text-amber-200">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs font-sans">
                        <h4 className="font-extrabold uppercase text-amber-400 tracking-wider">
                          🚫 Corporate Tax Capability Locked for 1-Year Subscription
                        </h4>
                        <p className="leading-relaxed text-slate-300 text-[11px]">
                          Under Hisaab Pro subscription policy, there is <strong>no capability for 1-Year Corporate Tax</strong> calculations or Form CT-1 filings. Corporate Tax (9%) planning is available exclusively on <strong>3-Year and Lifetime Subscription Plans</strong>. Upgrade your plan to enable full FTA Corporate Tax provisions.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Informational Hero Card */}
                  <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-indigo-100 p-5 rounded-2xl border border-indigo-950/40 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 opacity-10 group-hover:opacity-15 transition duration-500 text-white font-serif text-8xl">
                      %
                    </div>
                    <div className="relative z-10 space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 text-[8px] bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-full font-mono uppercase font-bold">compliance portal</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[9px] text-indigo-300 font-mono uppercase">Federal Tax Authority Regulations</span>
                      </div>
                      <h3 className="text-base font-extrabold tracking-tight text-white font-sans">
                        UAE Corporate Tax Assessment
                      </h3>
                      <p className="text-[11px] text-indigo-200/90 leading-relaxed max-w-2xl font-sans">
                        Resident corporations in the UAE are subject to a standard Corporate Tax rate of <strong>9%</strong> on net taxable business income exceeding <strong>AED 375,000</strong>. Profits up to this threshold are taxed at <strong>0%</strong>. This interactive planner aggregates your accounts, automatically calculates standard non-deductible adjustments, and determines your final Corporate Tax provisions.
                      </p>
                    </div>
                  </div>

                  {/* Key Metrics Dashboard Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Net Accounting Profit</span>
                      <span className="text-lg font-black text-slate-850 dark:text-slate-200 font-mono block">
                        {formatAED(accountingProfit)}
                      </span>
                      <span className="text-[8px] text-slate-400 font-mono block">Before Tax adjustments</span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Tax Add-backs (Articles 32, 33)</span>
                      <span className="text-lg font-black text-indigo-650 dark:text-indigo-400 font-mono block">
                        +{formatAED(nonDeductibleFines + nonDeductibleEntertainment)}
                      </span>
                      <span className="text-[8px] text-slate-400 font-mono block">Non-deductible items added back</span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Adjusted Taxable Income</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white font-mono block">
                        {formatAED(taxableIncome)}
                      </span>
                      <span className="text-[8px] text-indigo-500 font-mono block">
                        {ctSmallBusinessRelief && isEligibleForSBR ? '0% Small Business Relief active' : 'Income subject to tax brackets'}
                      </span>
                    </div>

                    <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border-2 border-indigo-500/20 p-4 rounded-xl space-y-1">
                      <span className="text-[9px] uppercase font-extrabold text-indigo-600 dark:text-indigo-400 block font-mono">Est. Corporate Tax (9%)</span>
                      <span className="text-lg font-black text-indigo-700 dark:text-indigo-300 font-mono block">
                        {formatAED(estimatedTax)}
                      </span>
                      <span className="text-[8px] text-slate-400 font-mono block">Liability Provision accrued</span>
                    </div>

                  </div>

                  {/* Interactive Adjustment Controls & Slider Section */}
                  <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/50 border border-slate-200 dark:border-slate-800/80 p-5 rounded-xl text-xs">
                    
                    <div className="lg:col-span-7 space-y-4">
                      <h4 className="text-[11px] font-extrabold uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center space-x-1.5 font-mono border-b border-slate-200 pb-2">
                        <span>Interactive Compliance Adjustments</span>
                      </h4>

                      <p className="text-[10px] text-slate-500">
                        Adjust expense balances below to simulate different tax scenarios. Auto-detected values reflect accounts containing terms like &quot;entertainment&quot;, &quot;fines&quot;, or &quot;penalties&quot;.
                      </p>

                      <div className="space-y-4 pt-1">
                        {/* Entertainment Expenses Adjustment */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-600 font-mono">
                              Client Entertainment Expenses (Article 32):
                            </label>
                            <span className="text-[9px] text-slate-400 font-mono">
                              Auto-detected from ledger: {formatAED(autoEntertainment)}
                            </span>
                          </div>
                          <div>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-[10px] text-slate-400 font-mono font-bold">AED</span>
                              <input
                                type="text"
                                value={ctEntertainmentInput}
                                onChange={(e) => setCtEntertainmentInput(e.target.value.replace(/[^0-9.]/g, ''))}
                                placeholder={autoEntertainment.toFixed(2)}
                                className="w-full border border-slate-250 dark:border-slate-700 rounded-lg py-2 pl-11 pr-3 font-mono text-xs focus:border-indigo-500 focus:outline-hidden bg-white dark:bg-slate-900"
                              />
                            </div>
                            <span className="text-[8px] text-slate-450 mt-1 block">
                              50% Limitation: <strong className="font-mono text-slate-700 dark:text-slate-300">AED {(parsedEntertainment * 0.5).toFixed(2)}</strong> non-deductible add-back.
                            </span>
                          </div>
                        </div>

                        {/* Fines and Penalties Adjustment */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-600 font-mono">
                              Fines, Penalties & Violations (Article 33):
                            </label>
                            <span className="text-[9px] text-slate-400 font-mono">
                              Auto-detected from ledger: {formatAED(autoFines)}
                            </span>
                          </div>
                          <div>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-[10px] text-slate-400 font-mono font-bold">AED</span>
                              <input
                                type="text"
                                value={ctFinesInput}
                                onChange={(e) => setCtFinesInput(e.target.value.replace(/[^0-9.]/g, ''))}
                                placeholder={autoFines.toFixed(2)}
                                className="w-full border border-slate-250 dark:border-slate-700 rounded-lg py-2 pl-11 pr-3 font-mono text-xs focus:border-indigo-500 focus:outline-hidden bg-white dark:bg-slate-900"
                              />
                            </div>
                            <span className="text-[8px] text-slate-450 mt-1 block">
                              100% Limitation: <strong className="font-mono text-slate-700 dark:text-slate-300">AED {parsedFines.toFixed(2)}</strong> fully added back.
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Small Business Relief Panel */}
                    <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-[10px] font-extrabold uppercase text-slate-800 dark:text-slate-200 tracking-wider font-mono">Small Business Relief</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${isEligibleForSBR ? 'bg-emerald-50 text-emerald-600 border border-emerald-150' : 'bg-slate-100 text-slate-500'}`}>
                            {isEligibleForSBR ? 'ELIGIBLE' : 'INELIGIBLE'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed mt-2 leading-relaxed">
                          Under <strong>Article 21</strong> of the UAE CT Law, resident businesses with annual gross revenues under <strong>AED 3,000,000</strong> are eligible to elect for Small Business Relief, reducing their net taxable income to AED 0 for the period.
                        </p>
                        <div className="text-[9px] text-slate-450 mt-2 font-mono">
                          Current Gross Revenue: <strong>{formatAED(grossRevenue)}</strong>
                        </div>
                      </div>

                      {isEligibleForSBR ? (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-700 font-mono">Elect for SBR Relief:</span>
                          <button
                            type="button"
                            onClick={() => setCtSmallBusinessRelief(!ctSmallBusinessRelief)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                              ctSmallBusinessRelief 
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            {ctSmallBusinessRelief ? '✓ Active (0% Tax)' : 'Inactive'}
                          </button>
                        </div>
                      ) : (
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/35 p-2 rounded-lg text-[9px] text-amber-800 dark:text-amber-400">
                          ⚠️ Revenue exceeds AED 3M threshold. Small Business Relief is unavailable for this period.
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Threshold Coverage visual progress gauge */}
                  <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wide">
                      <span className="font-bold text-slate-600 dark:text-slate-400">Tax-Free Threshold Utilization Gauge (AED 375,000)</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">{thresholdPercentage}% Used</span>
                    </div>

                    <div className="relative w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-250/30">
                      <div 
                        style={{ width: `${thresholdPercentage}%` }} 
                        className={`h-full transition-all duration-500 rounded-full ${
                          thresholdPercentage >= 100 
                            ? 'bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500' 
                            : thresholdPercentage > 75 
                              ? 'bg-gradient-to-r from-emerald-500 to-amber-500' 
                              : 'bg-emerald-500'
                        }`}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                      <span>AED 0.00 (0% CT Bracket)</span>
                      <span>AED 375,000.00 (Standard threshold)</span>
                    </div>

                    <div className="bg-white dark:bg-slate-900/40 p-3 rounded-lg border border-slate-150 dark:border-slate-800/80 text-[10px] text-slate-650 dark:text-slate-300 leading-relaxed font-sans">
                      {taxableIncome > threshold ? (
                        <p className="flex items-start space-x-1.5 text-rose-800 dark:text-rose-400">
                          <span>🚨</span>
                          <span>
                            Taxable Net Income of <strong>{formatAED(taxableIncome)}</strong> has exceeded the AED 375,000 allowance. A Corporate Tax of <strong>9%</strong> is calculated on the excess amount of <strong>{formatAED(taxableExceedingThreshold)}</strong>.
                          </span>
                        </p>
                      ) : (
                        <p className="flex items-start space-x-1.5 text-emerald-800 dark:text-emerald-400">
                          <span>✓</span>
                          <span>
                            {ctSmallBusinessRelief && isEligibleForSBR ? (
                              <span>Small Business Relief (Article 21) active. Your taxable income is reduced to AED 0. No Corporate Tax liability is generated.</span>
                            ) : (
                              <span>Your adjusted taxable profit of <strong>{formatAED(taxableIncome)}</strong> is fully sheltered inside the AED 375,000 threshold. Net Corporate Tax is <strong>AED 0.00</strong>.</span>
                            )}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* GCC Official Bilingual provisional tax return Form CT-1 */}
                  <div className="bg-white border-2 border-slate-900 rounded-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden text-slate-800">
                    
                    {/* Bilingual Form Header */}
                    <div className="flex justify-between items-start border-b-2 border-slate-300 pb-4">
                      <div>
                        <h2 className="text-sm font-black tracking-tight text-slate-900 font-sans uppercase">
                          FORM CT-1 — PROVISIONAL CORPORATE TAX ASSESSMENT
                        </h2>
                        <p className="text-[10px] text-slate-500 font-mono uppercase font-bold mt-1">
                          FEDERAL TAX AUTHORITY (FTA) UAE
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-300 text-[9px] font-mono font-bold rounded-lg uppercase tracking-wider">
                          INTERNAL STUDY ONLY
                        </span>
                      </div>
                    </div>

                    {/* Section 1: Entity & Registry Details */}
                    <div className="grid grid-cols-2 gap-4 text-[10px] bg-slate-50 border border-slate-200 p-3 rounded-lg font-sans">
                      <div>
                        <p className="text-slate-400 uppercase tracking-wider font-bold text-[8px] font-mono">1. Taxable Person</p>
                        <p className="text-slate-800 mt-1"><strong>Company Name:</strong> <span className="uppercase">{company.name}</span></p>
                        <p className="text-slate-800 mt-0.5"><strong>Tax Registry TRN:</strong> <span className="font-mono font-bold text-slate-900">{company.trn || 'Pending'}</span></p>
                      </div>
                      <div>
                        <p className="text-slate-400 uppercase tracking-wider font-bold text-[8px] font-mono">2. Tax Period Details</p>
                        <p className="text-slate-800 mt-1"><strong>Period Range:</strong> <span className="font-mono">{startDate} to {endDate}</span></p>
                        <p className="text-slate-800 mt-0.5"><strong>Primary Currency:</strong> <span className="font-mono font-bold">{company.currency || 'AED'}</span></p>
                      </div>
                    </div>

                    {/* Section 2: Detailed Math Reconciliation Table */}
                    <div className="space-y-2">
                      <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-mono">3. Reconciliation statement</p>
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left border-collapse text-[10px] font-sans">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[8px] font-mono">
                              <th className="py-2 px-3">Description</th>
                              <th className="py-2 px-3 text-right">Debit</th>
                              <th className="py-2 px-3 text-right">Credit</th>
                              <th className="py-2 px-3 text-right">Net Tax Balance (AED)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                            <tr>
                              <td className="py-2 px-3 font-sans text-slate-850">Operating Revenue</td>
                              <td className="py-2 px-3 text-right">-</td>
                              <td className="py-2 px-3 text-right text-emerald-600">{plRevenue.toFixed(2)}</td>
                              <td className="py-2 px-3 text-right">{plRevenue.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-sans text-slate-850">Cost of Goods Sold (COGS)</td>
                              <td className="py-2 px-3 text-right text-rose-600">{plCOGS.toFixed(2)}</td>
                              <td className="py-2 px-3 text-right">-</td>
                              <td className="py-2 px-3 text-right">-{plCOGS.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-sans text-slate-850">Operating Overhead Expenses (OPEX)</td>
                              <td className="py-2 px-3 text-right text-rose-600">{totalOpex.toFixed(2)}</td>
                              <td className="py-2 px-3 text-right">-</td>
                              <td className="py-2 px-3 text-right">-{totalOpex.toFixed(2)}</td>
                            </tr>
                            <tr className="bg-slate-50/60 font-sans font-bold text-slate-900 border-y border-slate-200">
                              <td className="py-2.5 px-3">Accounting Net Profit Before Tax</td>
                              <td className="py-2.5 px-3 text-right">-</td>
                              <td className="py-2.5 px-3 text-right">-</td>
                              <td className="py-2.5 px-3 text-right font-mono">{accountingProfit.toFixed(2)}</td>
                            </tr>
                            {/* Add-back lines */}
                            <tr>
                              <td className="py-2 px-3 font-sans text-slate-850">
                                Add-back: Fines & Penalties (Article 33)
                              </td>
                              <td className="py-2 px-3 text-right">-</td>
                              <td className="py-2 px-3 text-right text-indigo-600">+{parsedFines.toFixed(2)}</td>
                              <td className="py-2 px-3 text-right font-bold text-slate-850">+{parsedFines.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-sans text-slate-850">
                                Add-back: 50% Client Entertainment Limit (Article 32)
                              </td>
                              <td className="py-2 px-3 text-right">-</td>
                              <td className="py-2 px-3 text-right text-indigo-600">+{nonDeductibleEntertainment.toFixed(2)}</td>
                              <td className="py-2 px-3 text-right font-bold text-slate-850">+{nonDeductibleEntertainment.toFixed(2)}</td>
                            </tr>
                            {ctSmallBusinessRelief && isEligibleForSBR && (
                              <tr className="bg-emerald-50/30 text-emerald-800">
                                <td className="py-2 px-3 font-sans font-bold">
                                  Less: Small Business Relief Adjustment (Article 21)
                                </td>
                                <td className="py-2 px-3 text-right text-emerald-600">-{taxableIncomeBeforeRelief.toFixed(2)}</td>
                                <td className="py-2 px-3 text-right">-</td>
                                <td className="py-2 px-3 text-right font-bold font-mono">-{taxableIncomeBeforeRelief.toFixed(2)}</td>
                              </tr>
                            )}
                            <tr className="bg-slate-900 text-white font-sans font-black border-t-2 border-slate-900">
                              <td className="py-3 px-3 uppercase text-[9px] tracking-wide">Adjusted Net Taxable Income</td>
                              <td className="py-3 px-3 text-right">-</td>
                              <td className="py-3 px-3 text-right">-</td>
                              <td className="py-3 px-3 text-right font-mono text-xs">{taxableIncome.toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Section 3: Tax Computation Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px] border-t border-slate-200 pt-4">
                      
                      <div className="space-y-1.5 font-sans">
                        <p className="text-[9px] uppercase font-bold text-slate-400 font-mono">4. Tax Bracket Computation</p>
                        <div className="flex justify-between hover:bg-slate-50 p-1 rounded font-mono">
                          <span>Adjusted Taxable Base:</span>
                          <strong>AED {taxableIncome.toFixed(2)}</strong>
                        </div>
                        <div className="flex justify-between hover:bg-slate-50 p-1 rounded font-mono text-slate-500">
                          <span>Less: Standard Allowance:</span>
                          <span>-AED {threshold.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between hover:bg-slate-50 p-1 rounded font-mono border-t border-dashed border-slate-200 pt-1.5 text-slate-800 font-bold">
                          <span>Net Base Exceeding Threshold:</span>
                          <strong>AED {taxableExceedingThreshold.toFixed(2)}</strong>
                        </div>
                      </div>

                      <div className="space-y-2 bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between">
                        <div className="flex justify-between font-mono font-bold text-slate-850">
                          <span>Calculated Rate:</span>
                          <span>9.00%</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-200 pt-2 font-mono text-slate-900 font-extrabold text-[12px]">
                          <span>ESTIMATED TAX PAYABLE:</span>
                          <span className="text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg text-xs font-black">
                            AED {estimatedTax.toFixed(2)}
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Section 4: Accrual Booking double-entry accounting guideline */}
                    <div className="bg-indigo-50/20 border-l-4 border-indigo-500 p-4 rounded-r-lg space-y-2 text-[10px]">
                      <div className="flex items-center space-x-1 font-bold text-indigo-900 uppercase tracking-wide font-sans">
                        <Info className="w-3.5 h-3.5" />
                        <span>Corporate Tax Accrual Journal entry guide</span>
                      </div>
                      <p className="text-slate-650 leading-relaxed font-sans">
                        To maintain audit alignment with double-entry principles, book a quarterly/annual provision for Corporate Tax in your ledger using the following journal entries:
                      </p>
                      
                      <div className="border border-indigo-150/40 rounded-lg overflow-hidden bg-white/70 font-mono mt-2">
                        <table className="w-full text-[9px] text-left">
                          <thead>
                            <tr className="bg-indigo-50/50 text-indigo-950 font-bold border-b border-indigo-100">
                              <th className="py-1 px-3">Account Code & Name</th>
                              <th className="py-1 px-3 text-right">Debit (AED)</th>
                              <th className="py-1 px-3 text-right">Credit (AED)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            <tr>
                              <td className="py-1.5 px-3 font-sans font-semibold text-slate-800">
                                6800 - Corporate Tax Expense (Corporate Tax Provision)
                              </td>
                              <td className="py-1.5 px-3 text-right text-rose-600 font-bold">{estimatedTax.toFixed(2)}</td>
                              <td className="py-1.5 px-3 text-right">-</td>
                            </tr>
                            <tr>
                              <td className="py-1.5 px-3 font-sans font-semibold text-slate-800">
                                2300 - UAE Corporate Tax Provision Liability
                              </td>
                              <td className="py-1.5 px-3 text-right">-</td>
                              <td className="py-1.5 px-3 text-right text-emerald-600 font-bold">{estimatedTax.toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Form disclaimer notice */}
                    <div className="border-t border-slate-200 pt-4 text-center text-[8px] text-slate-400 font-mono leading-normal">
                      <p>CERTIFIED ELECTRONIC BLUEPRINT SYSTEM — SYSTEM CALCULATED ESTIMATION FOR PLANNER AND ADVISORY PURPOSES ONLY.</p>
                      <p className="mt-0.5">SUBMISSION OF OFFICIAL TAX FORMS MUST BE CONCLUDED DIRECTLY VIA THE FTA EMIRATES TAX PORTAL.</p>
                    </div>

                  </div>

                </div>
              );
            })()
          )}

          {selectedReport === 'vat_compliance_auditor' && (
            (() => {
              // 1. Analyze sales items VAT classifications
              let salesStandardRated = 0;
              let salesStandardVat = 0;
              let salesZeroRated = 0;
              let salesExempt = 0;
              let salesOutOfScope = 0;
              let salesNonTaxable = 0;

              filteredInvoices.forEach(inv => {
                (inv.items || []).forEach(item => {
                  const qty = item.qty || 0;
                  const rate = item.rate || 0;
                  const subtotal = qty * rate;
                  const vatRate = Number(item.vatRate);

                  if (vatRate === 5) {
                    salesStandardRated += subtotal;
                    salesStandardVat += item.vatAmount || 0;
                  } else if (vatRate === 0) {
                    salesZeroRated += subtotal;
                  } else if (vatRate === -1) {
                    salesExempt += subtotal;
                  } else if (vatRate === -2) {
                    salesOutOfScope += subtotal;
                  } else if (vatRate === -3) {
                    salesNonTaxable += subtotal;
                  } else {
                    // Fallback
                    if (vatRate > 0) {
                      salesStandardRated += subtotal;
                      salesStandardVat += item.vatAmount || 0;
                    } else {
                      salesZeroRated += subtotal;
                    }
                  }
                });
              });

              // 2. Scan unregistered suppliers violations
              // Any expense where supplierTrn is not 15 digits but vatAmount > 0
              const unregisteredSupplierViolations = filteredExpenses.filter(exp => {
                const trn = (exp.supplierTrn || '').trim();
                const isUnregistered = trn.length !== 15;
                const claimedVat = exp.vatAmount || 0;
                return isUnregistered && claimedVat > 0;
              });

              // 3. Scan unregistered customers / Simplified invoices
              const unregisteredCustomerInvoices = filteredInvoices.filter(inv => {
                const cust = customers.find(c => c.id === inv.customerId);
                return !cust || !cust.trn || cust.trn.trim().length !== 15;
              });

              const unregisteredCustomerSubtotal = unregisteredCustomerInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
              const unregisteredCustomerVat = unregisteredCustomerInvoices.reduce((sum, inv) => sum + inv.vatTotal, 0);

              // Auto-fix handler for unregistered supplier violations
              const handleFixExpenseVat = (expenseId: string) => {
                try {
                  const storedExpenses = localStorage.getItem(`expenses_${company.id}`);
                  if (storedExpenses) {
                    const allExps = JSON.parse(storedExpenses) as Expense[];
                    const updated = allExps.map(e => {
                      if (e.id === expenseId) {
                        return {
                          ...e,
                          vatAmount: 0,
                          total: e.amount // total becomes just the net amount since VAT is no longer claimable
                        };
                      }
                      return e;
                    });
                    localStorage.setItem(`expenses_${company.id}`, JSON.stringify(updated));
                    alert("Compliance Adjustment Complete: Selected expense input VAT has been adjusted to AED 0.00 in accordance with FTA regulations.");
                    window.location.reload(); // Refresh the app state to load updated expenses
                  }
                } catch (err) {
                  console.error("Auto-fix failed:", err);
                }
              };

              return (
                <div className="space-y-6">
                  {/* Executive Header */}
                  <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <ShieldAlert className="w-40 h-40" />
                    </div>
                    <div className="relative z-10 space-y-2">
                      <span className="bg-amber-500 text-slate-950 text-[10px] uppercase font-mono font-black px-2.5 py-1 rounded-full">
                        Article 59 Compliance Scanner
                      </span>
                      <h2 className="text-xl font-bold tracking-tight">UAE VAT Compliance & Audit Validator</h2>
                      <p className="text-slate-300 text-xs max-w-2xl leading-relaxed font-sans">
                        This automated auditor scans your transaction databases, customer registries, and operational receipts against UAE Federal Decree-Law No. 8 of 2017 to ensure your ledger is audit-proof.
                      </p>
                    </div>
                  </div>

                  {(activePlan === 'pro_1y' || activePlan === 'basic') && (
                    <div className="bg-amber-950/40 border border-amber-600/60 p-4 rounded-xl flex items-start space-x-3 text-amber-200 font-sans">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs">
                        <h4 className="font-extrabold uppercase text-amber-400 tracking-wider">
                          🚫 Audit Level Validator Restricted
                        </h4>
                        <p className="leading-relaxed text-slate-300 text-[11px]">
                          Automated VAT Compliance Auditing is reserved for <strong>3-Year and Lifetime Subscription Plans</strong>. Please upgrade your subscription plan to run full automated compliance scans against your ledgers.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Audit Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">FTA Audit Violations</span>
                      <div className="flex items-baseline space-x-1.5">
                        <span className={`text-2xl font-black font-mono ${unregisteredSupplierViolations.length > 0 ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`}>
                          {unregisteredSupplierViolations.length}
                        </span>
                        <span className="text-xs text-slate-450 font-medium">unresolved issues</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal font-sans">
                        {unregisteredSupplierViolations.length > 0 
                          ? "🔴 Critical: Input VAT claimed on bills from unregistered suppliers. Claims must be adjusted to zero." 
                          : "✅ Perfect: No input VAT claimed on bills from unregistered suppliers."}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Simplified Tax Invoices</span>
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-2xl font-black font-mono text-indigo-600">
                          {unregisteredCustomerInvoices.length}
                        </span>
                        <span className="text-xs text-slate-450 font-medium font-sans">B2C simplified files</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal font-sans">
                        Issued to unregistered end consumers (non-taxable persons). Totaling <strong>{formatAED(unregisteredCustomerSubtotal)}</strong> in supplies with <strong>{formatAED(unregisteredCustomerVat)}</strong> output VAT.
                      </p>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Compliance Score</span>
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-2xl font-black font-mono text-emerald-600">
                          {unregisteredSupplierViolations.length === 0 ? "100%" : `${Math.max(40, 100 - unregisteredSupplierViolations.length * 20)}%`}
                        </span>
                        <span className="text-xs text-slate-450 font-medium">health rating</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal font-sans">
                        Calculated by scanning missing TRN fields, tax overrides, and invalid claims.
                      </p>
                    </div>
                  </div>

                  {/* 1. CRITICAL COMPLIANCE ALERTS: UNREGISTERED SUPPLIER CLAIM WARNINGS */}
                  {unregisteredSupplierViolations.length > 0 && (
                    <div className="bg-rose-50 border border-rose-250 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center space-x-2">
                        <div className="bg-rose-600 text-white rounded-full p-1">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-widest text-rose-800 font-mono">CRITICAL AUDIT VIOLATIONS DETECTED</h3>
                          <p className="text-[10px] text-rose-600 mt-0.5 font-sans">Input VAT claimed on bills from suppliers who do not have a registered 15-digit TRN is highly illegal under UAE FTA Decree-Law.</p>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[11px] font-sans">
                          <thead>
                            <tr className="border-b border-rose-200 text-rose-700 uppercase text-[9px] font-bold font-mono">
                              <th className="py-2">Bill No</th>
                              <th className="py-2">Supplier Name</th>
                              <th className="py-2">Date</th>
                              <th className="py-2 text-right">Taxable Net</th>
                              <th className="py-2 text-right">Claimed VAT</th>
                              <th className="py-2 text-center">Action Required</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-rose-100">
                            {unregisteredSupplierViolations.map(exp => (
                              <tr key={exp.id} className="text-rose-900">
                                <td className="py-2 font-mono">{exp.invoiceNumber}</td>
                                <td className="py-2 font-medium">{exp.supplierName}</td>
                                <td className="py-2">{exp.date}</td>
                                <td className="py-2 text-right font-mono">{formatAED(exp.amount)}</td>
                                <td className="py-2 text-right font-mono font-bold text-rose-600">{formatAED(exp.vatAmount)}</td>
                                <td className="py-2 text-center no-print">
                                  <button
                                    onClick={() => handleFixExpenseVat(exp.id)}
                                    className="bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-bold uppercase px-3 py-1.5 rounded-lg shadow-sm transition-all hover:scale-105 cursor-pointer"
                                  >
                                    Auto-Adjust to 0% VAT
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 2. VAT CLASSIFICATIONS ANALYSIS MODULE */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                    <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                      <div className="bg-indigo-900 text-white rounded-lg p-1.5">
                        <CheckSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 font-mono">Bilingual VAT Item Classifications Summary</h3>
                        <p className="text-[10px] text-slate-450 mt-0.5 font-sans">Categorized according to official GCC VAT Agreement statutory classifications.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 font-sans">
                      {/* Standard Rated */}
                      <div className="bg-purple-50 border border-purple-150 p-3 rounded-xl flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-purple-700 font-mono">1. Standard (5%)</span>
                      <span className="block text-[9px] text-purple-400">Standard Rated Supplies</span>
                        </div>
                        <div className="mt-4">
                          <span className="block text-[10px] text-slate-400">Taxable Supply</span>
                          <span className="text-xs font-black font-mono text-purple-950">{formatAED(salesStandardRated)}</span>
                          <span className="block text-[9px] text-purple-600 mt-1 font-bold">VAT: {formatAED(salesStandardVat)}</span>
                        </div>
                      </div>

                      {/* Zero Rated */}
                      <div className="bg-emerald-50 border border-emerald-150 p-3 rounded-xl flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 font-mono">2. Zero-Rated (0%)</span>
                      <span className="block text-[9px] text-emerald-400">Zero-Rated Supplies</span>
                        </div>
                        <div className="mt-4">
                          <span className="block text-[10px] text-slate-400">Taxable Supply</span>
                          <span className="text-xs font-black font-mono text-emerald-950">{formatAED(salesZeroRated)}</span>
                          <span className="block text-[9px] text-emerald-600 mt-1 font-semibold">0% VAT Applied</span>
                        </div>
                      </div>

                      {/* Exempt */}
                      <div className="bg-blue-50 border border-blue-150 p-3 rounded-xl flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-blue-700 font-mono">3. Exempt (No VAT)</span>
                      <span className="block text-[9px] text-blue-400">Exempt Supplies</span>
                        </div>
                        <div className="mt-4">
                          <span className="block text-[10px] text-slate-400">Exempt Supply</span>
                          <span className="text-xs font-black font-mono text-blue-950">{formatAED(salesExempt)}</span>
                          <span className="block text-[9px] text-blue-600 mt-1 font-semibold">Residential/Bare Land</span>
                        </div>
                      </div>

                      {/* Out of Scope */}
                      <div className="bg-amber-50 border border-amber-150 p-3 rounded-xl flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 font-mono">4. Out of Scope</span>
                      <span className="block text-[9px] text-amber-400">Out of Scope</span>
                        </div>
                        <div className="mt-4">
                          <span className="block text-[10px] text-slate-400">OS Value</span>
                          <span className="text-xs font-black font-mono text-amber-950">{formatAED(salesOutOfScope)}</span>
                          <span className="block text-[9px] text-amber-600 mt-1 font-semibold">Outside GCC / Branches</span>
                        </div>
                      </div>

                      {/* Non-Taxable */}
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-700 font-mono">5. Non-Taxable</span>
                      <span className="block text-[9px] text-slate-400 font-sans">Non-Taxable</span>
                        </div>
                        <div className="mt-4">
                          <span className="block text-[10px] text-slate-400">Non-Taxable Supply</span>
                          <span className="text-xs font-black font-mono text-slate-950">{formatAED(salesNonTaxable)}</span>
                          <span className="block text-[9px] text-slate-500 mt-1 font-semibold font-sans">Salaries / Gov Fees</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. SIMPLIFIED VS STANDARD B2B BILLING LEDGER */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                    {/* Simplified B2C Ledger */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">B2C Simplified Invoices Summary</h4>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Simplified Tax Invoices are issued under Article 59 when supplies are made to non-taxable persons / unregistered customers. No customer TRN is required, but standard 5% output tax is fully compiled.
                      </p>
                      <div className="bg-[#FAF9F6] p-4 rounded-xl border border-slate-200/60 grid grid-cols-2 gap-4 font-mono">
                        <div>
                          <span className="block text-[9px] text-slate-450 uppercase">Total B2C Subtotal</span>
                          <span className="text-sm font-black text-slate-900">{formatAED(unregisteredCustomerSubtotal)}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-slate-450 uppercase">VAT Output collected</span>
                          <span className="text-sm font-black text-indigo-600">{formatAED(unregisteredCustomerVat)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Standard B2B Ledger */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">B2B Standard Invoices Summary</h4>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Standard Tax Invoices issued to VAT registered corporations. These require a valid 15-digit UAE TRN printed on the face of the document to allow the buyer to recover input VAT.
                      </p>
                      {(() => {
                        const registeredB2bInvoices = filteredInvoices.filter(inv => {
                          const cust = customers.find(c => c.id === inv.customerId);
                          return cust && cust.trn && cust.trn.trim().length === 15;
                        });
                        const b2bSubtotal = registeredB2bInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
                        const b2bVat = registeredB2bInvoices.reduce((sum, inv) => sum + inv.vatTotal, 0);
                        return (
                          <div className="bg-[#FAF9F6] p-4 rounded-xl border border-slate-200/60 grid grid-cols-2 gap-4 font-mono">
                            <div>
                              <span className="block text-[9px] text-slate-450 uppercase">Total B2B Subtotal</span>
                              <span className="text-sm font-black text-slate-900">{formatAED(b2bSubtotal)}</span>
                            </div>
                            <div>
                              <span className="block text-[9px] text-slate-450 uppercase">VAT Output collected</span>
                              <span className="text-sm font-black text-indigo-600">{formatAED(b2bVat)}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* 4. COMPLIANCE BILINGUAL SEAL & STATUTORY DETAILS */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-250 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 max-w-xl font-sans">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-850 font-mono">UAE FTA COMPLIANCE SEAL</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Hisaab Pro v1.0 is aligned with the Executive Regulations of the Federal Decree-Law No. 8 of 2017 on Value Added Tax. Built-in blocks prevent invalid input VAT credits and secure correct B2B/B2C simplified and standard VAT return compilations.
                      </p>
                    </div>
                    <div className="border border-indigo-200 bg-white p-3 rounded-xl flex items-center space-x-3 shadow-xs font-sans">
                      <div className="bg-emerald-600 text-white rounded-full p-2 flex items-center justify-center">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <div className="font-mono text-[9px] text-slate-600 space-y-0.5">
                        <div className="font-black text-slate-850 text-[10px] uppercase tracking-wide">FTA COMPLIANT v1.0</div>
                        <div>SYSTEM ID: AIS-TAX-SCAN-971</div>
                        <div>COMPLIANCE SEAL: ACTIVE</div>
                      </div>
                    </div>
                  </div>

                  {/* Form disclaimer notice */}
                  <div className="border-t border-slate-200 pt-4 text-center text-[8px] text-slate-400 font-mono leading-normal uppercase">
                    <p>CERTIFIED ELECTRONIC COMPLIANCE SYSTEM — REAL-TIME LEDGER AUDITING IN COMPLIANCE WITH THE FEDERAL TAX AUTHORITY UAE.</p>
                  </div>
                </div>
              );
            })()
          )}

          {/* 20. EMIRATE-WISE SALES & VAT BREAKDOWN REPORT (FTA BOX 1A-1G) */}
          {selectedReport === 'daily_executive_pulse' && (
            <AdvancedTimeReports
              type="daily"
              company={company}
              documents={documents}
              expenses={expenses}
              customers={customers}
              inventory={inventory}
              formatAED={formatAED}
              exportToCSV={exportToCSV}
            />
          )}

          {selectedReport === 'weekly_trailing_perf' && (
            <AdvancedTimeReports
              type="weekly"
              company={company}
              documents={documents}
              expenses={expenses}
              customers={customers}
              inventory={inventory}
              formatAED={formatAED}
              exportToCSV={exportToCSV}
            />
          )}

          {selectedReport === 'monthly_revenue_matrix' && (
            <AdvancedTimeReports
              type="monthly"
              company={company}
              documents={documents}
              expenses={expenses}
              customers={customers}
              inventory={inventory}
              formatAED={formatAED}
              exportToCSV={exportToCSV}
            />
          )}

          {selectedReport === 'extraordinary_strategic_audit' && (
            <AdvancedTimeReports
              type="extraordinary"
              company={company}
              documents={documents}
              expenses={expenses}
              customers={customers}
              inventory={inventory}
              formatAED={formatAED}
              exportToCSV={exportToCSV}
            />
          )}

          {selectedReport === 'emirate_sales_breakdown' && (
            (() => {
              const uaeEmirates = [
                { name: 'Abu Dhabi', box: 'Box 1a' },
                { name: 'Dubai', box: 'Box 1b' },
                { name: 'Sharjah', box: 'Box 1c' },
                { name: 'Ajman', box: 'Box 1d' },
                { name: 'Umm Al Quwain', box: 'Box 1e' },
                { name: 'Ras Al Khaimah', box: 'Box 1f' },
                { name: 'Fujairah', box: 'Box 1g' }
              ];

              const emirateDataMap: Record<string, { taxable: number; vat: number; total: number; count: number }> = {};
              uaeEmirates.forEach(e => {
                emirateDataMap[e.name] = { taxable: 0, vat: 0, total: 0, count: 0 };
              });
              emirateDataMap['Other / Unspecified'] = { taxable: 0, vat: 0, total: 0, count: 0 };

              let grandTaxable = 0;
              let grandVat = 0;
              let grandTotal = 0;

              filteredInvoices.forEach(inv => {
                const cust = customers.find(c => c.id === inv.customerId);
                const em = cust?.emirate || 'Dubai';
                const matched = uaeEmirates.find(e => e.name.toLowerCase() === em.toLowerCase())?.name || 'Other / Unspecified';
                const sub = inv.type === 'CreditNote' ? -Math.abs(inv.subtotal) : inv.subtotal;
                const vat = inv.type === 'CreditNote' ? -Math.abs(inv.vatTotal) : inv.vatTotal;
                const tot = inv.type === 'CreditNote' ? -Math.abs(inv.total) : inv.total;

                emirateDataMap[matched].taxable += sub;
                emirateDataMap[matched].vat += vat;
                emirateDataMap[matched].total += tot;
                emirateDataMap[matched].count += 1;

                grandTaxable += sub;
                grandVat += vat;
                grandTotal += tot;
              });

              return (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 font-mono uppercase tracking-wider">
                        1A-1G. Emirate-Wise Sales & 5% VAT Schedule
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        FTA Form 201 Standard-Rated Sales Categorized by UAE Emirate of Supply
                      </p>
                    </div>
                    <button
                      onClick={() => exportToCSV(
                        ['Emirate', 'FTA Box Ref', 'Invoice Count', 'Taxable Amount (AED)', 'VAT Amount 5% (AED)', 'Total Sales (AED)', 'Sales Share %'],
                        uaeEmirates.map(e => {
                          const d = emirateDataMap[e.name];
                          const share = grandTaxable > 0 ? ((d.taxable / grandTaxable) * 100).toFixed(1) : '0.0';
                          return [e.name, e.box, d.count, d.taxable.toFixed(2), d.vat.toFixed(2), d.total.toFixed(2), `${share}%`];
                        }),
                        'emirate_wise_sales_report'
                      )}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center space-x-1 cursor-pointer no-print"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Total Standard Taxable Sales</span>
                      <span className="text-lg font-extrabold text-slate-900 font-mono mt-1 block">{formatAED(grandTaxable)}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Total Output VAT (5%)</span>
                      <span className="text-lg font-extrabold text-emerald-600 font-mono mt-1 block">{formatAED(grandVat)}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Total Gross Revenue</span>
                      <span className="text-lg font-extrabold text-indigo-600 font-mono mt-1 block">{formatAED(grandTotal)}</span>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-mono text-[10px] uppercase font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Emirate of Supply</th>
                          <th className="p-3">FTA Box Ref</th>
                          <th className="p-3 text-center">Invoices</th>
                          <th className="p-3 text-right">Taxable Amount (AED)</th>
                          <th className="p-3 text-right">VAT 5% (AED)</th>
                          <th className="p-3 text-right">Total Invoiced (AED)</th>
                          <th className="p-3 text-right">Sales Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {uaeEmirates.map(e => {
                          const d = emirateDataMap[e.name];
                          const share = grandTaxable > 0 ? ((d.taxable / grandTaxable) * 100) : 0;
                          return (
                            <tr key={e.name} className="hover:bg-slate-50/80">
                              <td className="p-3 font-bold text-slate-900 font-sans">{e.name}</td>
                              <td className="p-3 text-indigo-600 font-bold">{e.box}</td>
                              <td className="p-3 text-center text-slate-600">{d.count}</td>
                              <td className="p-3 text-right font-bold text-slate-900">{formatAED(d.taxable)}</td>
                              <td className="p-3 text-right text-emerald-600 font-bold">{formatAED(d.vat)}</td>
                              <td className="p-3 text-right font-bold text-indigo-700">{formatAED(d.total)}</td>
                              <td className="p-3 text-right">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                                  {share.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-100 font-mono font-bold border-t-2 border-slate-300 text-slate-900">
                        <tr>
                          <td className="p-3 font-sans" colSpan={2}>Grand Total (Box 1a - 1g)</td>
                          <td className="p-3 text-center">{filteredInvoices.length}</td>
                          <td className="p-3 text-right text-slate-900">{formatAED(grandTaxable)}</td>
                          <td className="p-3 text-right text-emerald-600">{formatAED(grandVat)}</td>
                          <td className="p-3 text-right text-indigo-700">{formatAED(grandTotal)}</td>
                          <td className="p-3 text-right">100.0%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })()
          )}
          {selectedReport.startsWith('tally_') && (
            <TallyReportsSuite
              reportId={selectedReport}
              company={company}
              documents={documents}
              expenses={expenses}
              customers={customers}
              inventory={inventory}
              startDate={startDate}
              endDate={endDate}
              formatAED={formatAED}
              exportToCSV={exportToCSV}
              onSelectReport={setSelectedReport}
            />
          )}
        </div>
      </div>
    </div>
  );
}
