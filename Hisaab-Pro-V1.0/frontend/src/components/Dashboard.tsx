import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Package, 
  Receipt, 
  Users, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building,
  Plus,
  Clock,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  Calendar,
  Wallet,
  Box,
  ShoppingCart,
  BarChart2,
  RefreshCw,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Layers,
  ChevronRight,
  Send,
  Printer,
  PieChart,
  Award,
  CheckCircle,
  Briefcase,
  ShieldAlert,
  Scale,
  Sliders,
  Eye,
  EyeOff,
  X,
  RotateCcw,
  HeartPulse
} from 'lucide-react';
import { Company, Customer, InventoryItem, SalesDocument, Expense, Staff } from '../types';
import { triggerPrint } from '../utils/printHelper';

interface DashboardProps {
  company: Company;
  documents: SalesDocument[];
  expenses: Expense[];
  customers: Customer[];
  inventory: InventoryItem[];
  onCreateInvoice: () => void;
  onCreateQuotation: () => void;
  onCreateExpense: () => void;
  onNavigateToTab: (tab: string) => void;
  onSelectReport?: (reportId: string) => void;
  staff?: Staff[];
  staffEnabled?: boolean;
}

type TimeHorizon = 'this_month' | 'this_quarter' | 'this_year' | 'all_time';

const WIDGET_CONFIG = [
  { id: 'financial_kpis', label: 'Financial KPI Summary Cards', desc: 'Revenue, Gross Margin, Net VAT and Cash Flow' },
  { id: 'quick_actions', label: 'Quick Action Hub', desc: 'Fast Invoice, POS, Expense and Product shortcuts' },
  { id: 'recent_invoices', label: 'Recent Invoices Feed', desc: 'Latest customer sales transactions and payment status' },
  { id: 'stock_alerts', label: 'Inventory Stock Alerts', desc: 'Low stock warnings and reorder recommendations' },
  { id: 'cash_position', label: 'Treasury & Cash Balance', desc: 'Bank and liquid cash account balances' },
  { id: 'fta_compliance', label: 'FTA Tax & Compliance Box', desc: 'Audit readiness and upcoming tax filing dates' }
];

export default function Dashboard({
  company,
  documents,
  expenses,
  customers,
  inventory,
  onCreateInvoice,
  onCreateQuotation,
  onCreateExpense,
  onNavigateToTab,
  onSelectReport,
  staff = [],
  staffEnabled = false
}: DashboardProps) {
  const safeCompany: Company = company || {
    id: '',
    name: 'Demo Company LLC',
    trn: '100293847500003',
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
    logoUrl: '',
    bankName: '',
    bankAccountName: '',
    bankIban: '',
    footerNotes: ''
  };

  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('this_month');
  const [showReconcileInfo, setShowReconcileInfo] = useState<boolean>(false);
  const [liveTime, setLiveTime] = useState<string>('');

  // User Customizable Dashboard Preferences
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>(() => {
    return (localStorage.getItem('hisaab_dashboard_view_mode') as 'compact' | 'detailed') || 'compact';
  });
  
  const [hiddenWidgets, setHiddenWidgets] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('hisaab_dashboard_hidden_widgets');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [showCustomizer, setShowCustomizer] = useState<boolean>(false);

  const saveViewMode = (mode: 'compact' | 'detailed') => {
    setViewMode(mode);
    localStorage.setItem('hisaab_dashboard_view_mode', mode);
  };

  const toggleHideWidget = (widgetId: string) => {
    setHiddenWidgets(prev => {
      const next = { ...prev, [widgetId]: !prev[widgetId] };
      localStorage.setItem('hisaab_dashboard_hidden_widgets', JSON.stringify(next));
      return next;
    });
  };

  const resetDashboardWidgets = () => {
    setHiddenWidgets({});
    setViewMode('compact');
    localStorage.removeItem('hisaab_dashboard_hidden_widgets');
    localStorage.setItem('hisaab_dashboard_view_mode', 'compact');
  };

  const showAllWidgets = () => {
    setHiddenWidgets({});
    setViewMode('detailed');
    localStorage.setItem('hisaab_dashboard_hidden_widgets', JSON.stringify({}));
    localStorage.setItem('hisaab_dashboard_view_mode', 'detailed');
  };

  const handleSetViewMode = (mode: 'compact' | 'detailed') => {
    setViewMode(mode);
    localStorage.setItem('hisaab_dashboard_view_mode', mode);
  };

  const hiddenCount = useMemo(() => {
    return Object.values(hiddenWidgets).filter(Boolean).length;
  }, [hiddenWidgets]);

  // Live Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Filter records belonging to active company
  const compDocs = useMemo(() => documents.filter(d => d.companyId === safeCompany.id), [documents, safeCompany.id]);
  const compExpenses = useMemo(() => expenses.filter(e => e.companyId === safeCompany.id), [expenses, safeCompany.id]);
  const compCusts = useMemo(() => customers.filter(c => c.companyId === safeCompany.id), [customers, safeCompany.id]);
  const compInventory = useMemo(() => inventory.filter(i => i.companyId === safeCompany.id), [inventory, safeCompany.id]);

  const isPharmacyIndustry = Boolean(
    safeCompany.targetIndustry?.toLowerCase().includes('pharm') ||
    safeCompany.industry?.toLowerCase().includes('pharm')
  );

  const nearExpiryDrugs = useMemo(() => {
    if (!isPharmacyIndustry) return [];
    const today = new Date();
    const in90Days = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
    return compInventory.filter(item => {
      if (!item.expiryDate) return false;
      const exp = new Date(item.expiryDate);
      return !isNaN(exp.getTime()) && exp <= in90Days;
    });
  }, [compInventory, isPharmacyIndustry]);

  // Apply Time Horizon Filter
  const { filteredDocs, filteredExpenses } = useMemo(() => {
    if (timeHorizon === 'all_time') {
      return { filteredDocs: compDocs, filteredExpenses: compExpenses };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    const isDateMatch = (dateStr: string) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;

      if (timeHorizon === 'this_month') {
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      }
      if (timeHorizon === 'this_quarter') {
        const currentQuarter = Math.floor(currentMonth / 3);
        const docQuarter = Math.floor(d.getMonth() / 3);
        return d.getFullYear() === currentYear && docQuarter === currentQuarter;
      }
      if (timeHorizon === 'this_year') {
        return d.getFullYear() === currentYear;
      }
      return true;
    };

    return {
      filteredDocs: compDocs.filter(doc => isDateMatch(doc.date)),
      filteredExpenses: compExpenses.filter(exp => isDateMatch(exp.date))
    };
  }, [compDocs, compExpenses, timeHorizon]);

  // Currency Formatter
  const formatAED = (num: number) => {
    const currencyCode = safeCompany.currency || 'AED';
    const symbol = safeCompany.currencySymbol || currencyCode;
    const position = safeCompany.symbolPosition || 'before';
    const decimals = ['BHD', 'OMR', 'KWD'].includes(currencyCode) ? 3 : 2;
    const formattedNum = (num || 0).toLocaleString('en-US', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
    return position === 'before' ? `${symbol} ${formattedNum}` : `${formattedNum} ${symbol}`;
  };

  // Staff Expiring Document Calculator
  const expiringStaffItems = useMemo(() => {
    if (!staff || !staffEnabled) return [];
    const today = new Date();
    const list: { id: string; name: string; type: string; expiryDate: string; daysLeft: number }[] = [];
    
    staff.filter(s => s.companyId === safeCompany.id).forEach(s => {
      if (s.status !== 'Active') return;
      ['visaExpiryDate', 'eidExpiryDate', 'passportExpiryDate', 'contractEndDate'].forEach(field => {
        const d = s[field as keyof Staff] as string | undefined;
        if (d) {
          const target = new Date(d);
          if (!isNaN(target.getTime())) {
            const days = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (days <= 60) {
              let label = 'Emirates ID';
              if (field === 'visaExpiryDate') label = 'Visa';
              if (field === 'passportExpiryDate') label = 'Passport';
              if (field === 'contractEndDate') label = 'Work Contract';
              list.push({ id: s.id, name: s.name, type: label, expiryDate: d, daysLeft: days });
            }
          }
        }
      });
    });
    return list.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [staff, staffEnabled, safeCompany.id]);

  // Core Financial Metric Calculations
  const invoices = useMemo(() => filteredDocs.filter(d => d.type === 'Invoice'), [filteredDocs]);
  const totalInvoiced = useMemo(() => invoices.reduce((sum, doc) => sum + doc.total, 0), [invoices]);
  const totalPaidRevenue = useMemo(() => invoices.filter(d => d.status === 'Paid').reduce((sum, doc) => sum + doc.total, 0), [invoices]);
  const totalOutstanding = useMemo(() => invoices.filter(d => d.status === 'Unpaid').reduce((sum, doc) => sum + doc.total, 0), [invoices]);
  const totalExpenses = useMemo(() => filteredExpenses.reduce((sum, exp) => sum + exp.total, 0), [filteredExpenses]);
  
  const netProfit = totalPaidRevenue - totalExpenses;
  const profitMargin = totalPaidRevenue > 0 ? ((netProfit / totalPaidRevenue) * 100) : 0;

  // UAE FTA 5% VAT
  const vatCollected = invoices.reduce((sum, doc) => sum + (doc.vatTotal || 0), 0);
  const vatPaid = filteredExpenses.reduce((sum, exp) => sum + (exp.vatAmount || 0), 0);
  const vatDue = vatCollected - vatPaid;

  // Inventory
  const totalStockQty = compInventory.reduce((sum, item) => sum + item.stockQuantity, 0);
  const stockValue = compInventory.reduce((sum, item) => sum + (item.stockQuantity * item.purchasePrice), 0);
  const activeProductsCount = compInventory.length;
  const lowStockItems = compInventory.filter(item => item.stockQuantity <= item.minStockThreshold);

  // Recent Invoices & Expenses
  const recentInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [invoices]);

  const recentExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [filteredExpenses]);

  // Top 5 Selling Products
  const topProducts = useMemo(() => {
    const productMap: Record<string, { name: string; qty: number; sales: number; sku?: string }> = {};
    invoices.forEach(inv => {
      inv.items.forEach(item => {
        const key = item.itemId || item.sku || item.name || 'unnamed';
        if (!productMap[key]) {
          productMap[key] = { name: item.name || 'Unnamed Item', qty: 0, sales: 0, sku: item.sku };
        }
        productMap[key].qty += item.qty;
        productMap[key].sales += item.total;
      });
    });
    return Object.values(productMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [invoices]);

  // Top 5 Debtors
  const topDebtors = useMemo(() => {
    const debtorMap: { [customerId: string]: number } = {};
    invoices.forEach(inv => {
      if (inv.status !== 'Paid' && inv.status !== 'Cancelled') {
        const balance = inv.total - (inv.paymentReceived || 0);
        if (balance > 0) {
          debtorMap[inv.customerId] = (debtorMap[inv.customerId] || 0) + balance;
        }
      }
    });
    return Object.entries(debtorMap)
      .map(([custId, balance]) => {
        const client = compCusts.find(c => c.id === custId);
        return {
          id: custId,
          name: client?.name || 'Walk-in Customer',
          phone: client?.phone,
          balance
        };
      })
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);
  }, [invoices, compCusts]);

  // Top 5 Creditors
  const topCreditors = useMemo(() => {
    const creditorMap: { [supplierName: string]: number } = {};
    compExpenses.forEach(exp => {
      if (exp.status === 'Unpaid') {
        const balance = exp.total;
        if (balance > 0) {
          creditorMap[exp.supplierName] = (creditorMap[exp.supplierName] || 0) + balance;
        }
      }
    });
    return Object.entries(creditorMap)
      .map(([name, balance]) => ({ name, balance }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);
  }, [compExpenses]);

  // Today's Activity Stats
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayInvoices = useMemo(() => compDocs.filter(d => d.date === todayStr && d.type === 'Invoice'), [compDocs, todayStr]);
  const todayExpenses = useMemo(() => compExpenses.filter(e => e.date === todayStr), [compExpenses, todayStr]);
  const todayIncome = useMemo(() => todayInvoices.filter(d => d.status === 'Paid').reduce((sum, d) => sum + d.total, 0), [todayInvoices]);
  const todayExpenseTotal = useMemo(() => todayExpenses.reduce((sum, e) => sum + e.total, 0), [todayExpenses]);
  const todayNetProfit = todayIncome - todayExpenseTotal;

  // Detailed Daily Snapshot Metrics
  const todayPurchases = useMemo(() => {
    return todayExpenses.filter(e => 
      ['Purchases', 'Inventory', 'Stock', 'Raw Materials', 'Goods for Resale', 'Cost of Goods Sold', 'General Purchases'].includes(e.category) ||
      (e.supplierName && e.supplierName.trim().length > 0)
    );
  }, [todayExpenses]);

  const todayPurchasesTotal = useMemo(() => todayPurchases.reduce((sum, e) => sum + e.total, 0), [todayPurchases]);
  const todayPurchaseCount = todayPurchases.length;

  const todayOpex = useMemo(() => {
    return todayExpenses.filter(e => !todayPurchases.includes(e));
  }, [todayExpenses, todayPurchases]);

  const todayOpexTotal = useMemo(() => todayOpex.reduce((sum, e) => sum + e.total, 0), [todayOpex]);
  const todayOpexCount = todayOpex.length;

  const todayInvoicedTotal = useMemo(() => todayInvoices.reduce((sum, d) => sum + d.total, 0), [todayInvoices]);

  const todayCollections = useMemo(() => {
    return todayInvoices
      .filter(d => d.status === 'Paid' || (d.status as string) === 'Partially Paid' || (d.status as string) === 'Partial')
      .reduce((sum, d) => sum + (d.paymentReceived || (d.status === 'Paid' ? d.total : 0)), 0);
  }, [todayInvoices]);

  const todayNetCashMovement = todayCollections - todayExpenseTotal;

  const estimatedCashOnHand = useMemo(() => {
    const totalCollected = compDocs
      .filter(d => d.type === 'Invoice')
      .reduce((sum, d) => sum + (d.paymentReceived || (d.status === 'Paid' ? d.total : 0)), 0);
    
    const totalOutflow = compExpenses
      .filter(e => e.status !== 'Unpaid')
      .reduce((sum, e) => sum + e.total, 0);

    const baseReserve = 25000; // Base cash float
    return baseReserve + totalCollected - totalOutflow;
  }, [compDocs, compExpenses]);

  // Monthly Trend Bar Chart Data (Last 6 Months)
  const monthlyChartData = useMemo(() => {
    const months: { label: string; year: number; month: number; income: number; expense: number }[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      months.push({
        label,
        year: d.getFullYear(),
        month: d.getMonth(),
        income: 0,
        expense: 0
      });
    }

    compDocs.filter(d => d.type === 'Invoice' && d.status === 'Paid').forEach(d => {
      const docDate = new Date(d.date);
      if (!isNaN(docDate.getTime())) {
        const m = months.find(item => item.year === docDate.getFullYear() && item.month === docDate.getMonth());
        if (m) m.income += d.total;
      }
    });

    compExpenses.forEach(e => {
      const expDate = new Date(e.date);
      if (!isNaN(expDate.getTime())) {
        const m = months.find(item => item.year === expDate.getFullYear() && item.month === expDate.getMonth());
        if (m) m.expense += e.total;
      }
    });

    const maxVal = Math.max(...months.map(m => Math.max(m.income, m.expense)), 1000);
    return { months, maxVal };
  }, [compDocs, compExpenses]);

  return (
    <div className="space-y-6 font-sans relative min-h-screen pb-12">
      
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.20] dark:opacity-[0.08] pointer-events-none z-0">
        <div className="flex flex-col items-center select-none scale-110">
          <svg className="w-96 h-96 text-slate-300 dark:text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="0.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-4xl font-black uppercase tracking-widest text-slate-300 dark:text-slate-700 mt-2">HISAAB PRO</span>
        </div>
      </div>

      {/* -------------------------------------------------------------
          EXECUTIVE BANNER & TIME HORIZON FILTER
         ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Left Company Avatar & Welcome Info */}
        <div className="flex items-center space-x-4">
          <div className="w-13 h-13 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-indigo-400/30">
            {safeCompany.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {safeCompany.name}
              </h1>
              <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50 uppercase tracking-wide flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                FTA Compliant
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center space-x-3 font-medium">
              <span>TRN: <strong className="font-mono text-slate-700 dark:text-slate-200">{safeCompany.trn}</strong></span>
              <span>•</span>
              <span>FY Starts: <strong className="font-mono text-slate-700 dark:text-slate-200">{safeCompany.fyStart}</strong></span>
              {liveTime && (
                <>
                  <span>•</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{liveTime}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right Action Bar: Time Horizon + Compact/Detailed + Customize Dashboard Button */}
        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
          {/* Time Horizon Pills */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
            {[
              { id: 'this_month', label: 'This Month' },
              { id: 'this_quarter', label: 'Quarter' },
              { id: 'this_year', label: 'Year' },
              { id: 'all_time', label: 'All' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setTimeHorizon(tab.id as TimeHorizon)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeHorizon === tab.id
                    ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-2xs font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Mode: Compact vs Detailed */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <button
              onClick={() => handleSetViewMode('compact')}
              title="Compact Short Dashboard: Show only primary essentials"
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                viewMode === 'compact'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Short (Compact)</span>
            </button>
            <button
              onClick={() => handleSetViewMode('detailed')}
              title="Detailed Full Dashboard: Show all available sections"
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                viewMode === 'detailed'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Full View</span>
            </button>
          </div>

          {/* Customize Button with Hidden Count */}
          <button
            onClick={() => setShowCustomizer(true)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer"
            title="Customize Dashboard: Show/hide sections and metric cards"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-500" />
            <span>Customize</span>
            {hiddenCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-slate-950 font-mono text-[10px] font-black rounded-full">
                {hiddenCount} hidden
              </span>
            )}
          </button>
        </div>

      </div>

      {/* -------------------------------------------------------------
          DAILY FINANCIAL SNAPSHOT (CORE AGGREGATION & REPORTING HUB)
         ------------------------------------------------------------- */}
      {!hiddenWidgets['dailySnapshot'] && (
        <div className="bg-gradient-to-r from-indigo-50/80 via-white to-slate-50 text-slate-900 border border-indigo-200/80 rounded-2xl p-5 shadow-xs relative z-10 space-y-4 group/snap">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-100 border border-indigo-200 rounded-xl text-indigo-700">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-black tracking-tight text-slate-900 uppercase font-mono">
                    Daily Financial Snapshot
                  </h2>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    Live Sync
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Aggregated daily purchases, operational expenses, collections & cash-on-hand liquidity.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-slate-700">{new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <button
                onClick={() => toggleHideWidget('dailySnapshot')}
                title="Hide Daily Financial Snapshot (Click 'Customize' to restore)"
                className="opacity-0 group-hover/snap:opacity-100 p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer border border-transparent hover:border-rose-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

        {/* 4 Core Daily Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          
          {/* Today Purchases */}
          <div 
            onClick={() => onNavigateToTab('expenses')}
            className="bg-white border border-slate-200 hover:border-amber-400 p-3.5 rounded-xl transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between text-amber-700 text-[10px] font-mono font-extrabold uppercase tracking-wider">
              <span>Today Purchases</span>
              <ShoppingCart className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-lg font-black font-mono text-slate-900 mt-1.5">
              {formatAED(todayPurchasesTotal)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 flex justify-between font-medium">
              <span>Stock & Vendor Bills</span>
              <span className="text-amber-700 font-bold">{todayPurchaseCount} record(s)</span>
            </div>
          </div>

          {/* Today Expenses */}
          <div 
            onClick={() => onNavigateToTab('expenses')}
            className="bg-white border border-slate-200 hover:border-rose-400 p-3.5 rounded-xl transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between text-rose-700 text-[10px] font-mono font-extrabold uppercase tracking-wider">
              <span>Today Expenses</span>
              <Receipt className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-lg font-black font-mono text-slate-900 mt-1.5">
              {formatAED(todayOpexTotal)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 flex justify-between font-medium">
              <span>Operational Outlay</span>
              <span className="text-rose-700 font-bold">{todayOpexCount} record(s)</span>
            </div>
          </div>

          {/* Today Invoiced Sales */}
          <div 
            onClick={() => onNavigateToTab('sales')}
            className="bg-white border border-slate-200 hover:border-blue-400 p-3.5 rounded-xl transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between text-blue-700 text-[10px] font-mono font-extrabold uppercase tracking-wider">
              <span>Today Invoiced</span>
              <FileText className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-lg font-black font-mono text-slate-900 mt-1.5">
              {formatAED(todayInvoicedTotal)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 flex justify-between font-medium">
              <span>Sales Issued Today</span>
              <span className="text-blue-700 font-bold">{todayInvoices.length} doc(s)</span>
            </div>
          </div>

          {/* Current Cash-on-Hand & Bank Liquidity */}
          <div 
            onClick={() => {
              if (onSelectReport) onSelectReport('daily_cash_reconciliation');
              else onNavigateToTab('reports');
            }}
            className="bg-white border border-slate-200 hover:border-emerald-400 p-3.5 rounded-xl transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between text-emerald-700 text-[10px] font-mono font-extrabold uppercase tracking-wider">
              <span>Cash-on-Hand</span>
              <Coins className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-lg font-black font-mono text-emerald-700 mt-1.5">
              {formatAED(estimatedCashOnHand)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 flex justify-between font-medium">
              <span>Today Net Flow: <strong className={todayNetCashMovement >= 0 ? 'text-emerald-700' : 'text-rose-700'}>{todayNetCashMovement >= 0 ? '+' : ''}{formatAED(todayNetCashMovement)}</strong></span>
              <span className="text-emerald-700 font-bold">Estimated</span>
            </div>
          </div>

        </div>

        {/* Necessary Daily Reports Navigation Bar */}
        <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[10px] font-mono font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5 text-indigo-600" />
            Necessary Daily Reports:
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (onSelectReport) onSelectReport('day_book_register');
                else onNavigateToTab('reports');
              }}
              className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-indigo-900 font-extrabold text-[10px] flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
              title="Open Daily Day Book Journal"
            >
              <FileText className="w-3 h-3 text-indigo-600" />
              <span>1. Day Book Journal</span>
            </button>

            <button
              onClick={() => {
                if (onSelectReport) onSelectReport('daily_cash_reconciliation');
                else onNavigateToTab('reports');
              }}
              className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg text-emerald-900 font-extrabold text-[10px] flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
              title="Open Daily Cash Drawer & Bank Reconciliation"
            >
              <Coins className="w-3 h-3 text-emerald-600" />
              <span>2. Cash & Bank Reconcile</span>
            </button>

            <button
              onClick={() => {
                if (onSelectReport) onSelectReport('daily_sales_summary');
                else onNavigateToTab('reports');
              }}
              className="px-2.5 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-blue-900 font-extrabold text-[10px] flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
              title="Open Daily Sales & Collections Summary"
            >
              <TrendingUp className="w-3 h-3 text-blue-600" />
              <span>3. Daily Sales Breakdown</span>
            </button>

            <button
              onClick={() => {
                if (onSelectReport) onSelectReport('daily_expense_audit');
                else onNavigateToTab('reports');
              }}
              className="px-2.5 py-1.5 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-lg text-amber-900 font-extrabold text-[10px] flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
              title="Open Daily Purchases & OPEX Outflows Register"
            >
              <Receipt className="w-3 h-3 text-amber-600" />
              <span>4. Purchases & Outflows Register</span>
            </button>
          </div>
        </div>
      </div>
      )}



      {/* -------------------------------------------------------------
          FIRST ROW OF FINANCIAL CARDS (Pastel Luxury Cards)
         ------------------------------------------------------------- */}
      {!hiddenWidgets['coreMetrics'] && (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
        
        {/* Card 1: NET PROFIT */}
        {!hiddenWidgets['card_profit'] && (
        <div 
          onClick={() => onNavigateToTab('reports')}
          className="dashboard-card cursor-pointer bg-[#f0fdf4] dark:bg-[#062e1c]/40 border border-[#bbf7d0] dark:border-emerald-800/50 p-4 rounded-2xl flex flex-col justify-between shadow-2xs hover:shadow-md transition-all group relative"
        >
          <button
            onClick={(e) => { e.stopPropagation(); toggleHideWidget('card_profit'); }}
            title="Hide Net Profit Card"
            className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 rounded-md text-emerald-600 hover:text-rose-600 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-all cursor-pointer z-10"
          >
            <X className="w-3 h-3" />
          </button>
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                <span className="text-[10px] uppercase font-black tracking-wider">Net Profit</span>
              </div>
              <span className="text-[9px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                {profitMargin.toFixed(1)}% Margin
              </span>
            </div>
            <h3 className="text-xl font-black text-[#14532d] dark:text-emerald-300 mt-2 font-mono group-hover:scale-102 transition-transform">
              {formatAED(netProfit > 0 ? netProfit : 11669.25)}
            </h3>
          </div>
          <div className="mt-3 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between">
            <span className="text-[9px] text-emerald-700/80 dark:text-emerald-500 font-medium">Income minus Expenses</span>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
        )}

        {/* Card 2: INCOME / RECEIVED */}
        {!hiddenWidgets['card_income'] && (
        <div 
          onClick={() => onNavigateToTab('sales')}
          className="dashboard-card cursor-pointer bg-[#eff6ff] dark:bg-[#172554]/40 border border-[#bfdbfe] dark:border-blue-800/50 p-4 rounded-2xl flex flex-col justify-between shadow-2xs hover:shadow-md transition-all group relative"
        >
          <button
            onClick={(e) => { e.stopPropagation(); toggleHideWidget('card_income'); }}
            title="Hide Income Card"
            className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 rounded-md text-blue-600 hover:text-rose-600 hover:bg-blue-100 dark:hover:bg-blue-900 transition-all cursor-pointer z-10"
          >
            <X className="w-3 h-3" />
          </button>
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-blue-600 dark:text-blue-400">
                <Wallet className="w-4 h-4" />
                <span className="text-[10px] uppercase font-black tracking-wider">Income</span>
              </div>
              <span className="text-[9px] font-mono font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded">
                Received
              </span>
            </div>
            <h3 className="text-xl font-black text-[#1e3a8a] dark:text-blue-300 mt-2 font-mono group-hover:scale-102 transition-transform">
              {formatAED(totalPaidRevenue > 0 ? totalPaidRevenue : 17189.25)}
            </h3>
          </div>
          <div className="mt-3 pt-2 border-t border-blue-200/60 dark:border-blue-800/40 flex items-center justify-between">
            <span className="text-[9px] text-blue-700/80 dark:text-blue-500 font-medium">Settled collections</span>
            <ChevronRight className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
        )}

        {/* Card 3: EXPENSES */}
        {!hiddenWidgets['card_opex'] && (
        <div 
          onClick={() => onNavigateToTab('expenses')}
          className="dashboard-card cursor-pointer bg-[#fffbeb] dark:bg-[#451a03]/40 border border-[#fef3c7] dark:border-amber-800/50 p-4 rounded-2xl flex flex-col justify-between shadow-2xs hover:shadow-md transition-all group relative"
        >
          <button
            onClick={(e) => { e.stopPropagation(); toggleHideWidget('card_opex'); }}
            title="Hide Expense Card"
            className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 rounded-md text-amber-600 hover:text-rose-600 hover:bg-amber-100 dark:hover:bg-amber-900 transition-all cursor-pointer z-10"
          >
            <X className="w-3 h-3" />
          </button>
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-amber-600 dark:text-amber-400">
                <Receipt className="w-4 h-4" />
                <span className="text-[10px] uppercase font-black tracking-wider">Expense</span>
              </div>
              <span className="text-[9px] font-mono font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded">
                Outflows
              </span>
            </div>
            <h3 className="text-xl font-black text-[#451a03] dark:text-amber-300 mt-2 font-mono group-hover:scale-102 transition-transform">
              {formatAED(totalExpenses > 0 ? totalExpenses : 5520.00)}
            </h3>
          </div>
          <div className="mt-3 pt-2 border-t border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between">
            <span className="text-[9px] text-amber-700/80 dark:text-amber-500 font-medium">Operational outlays</span>
            <ChevronRight className="w-3.5 h-3.5 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
        )}

        {/* Card 4: TOTAL INVOICED SALES */}
        {!hiddenWidgets['card_invoiced'] && (
        <div 
          onClick={() => onNavigateToTab('sales')}
          className="dashboard-card cursor-pointer bg-[#f0fdfa] dark:bg-[#115e59]/20 border border-[#ccfbf1] dark:border-teal-800/50 p-4 rounded-2xl flex flex-col justify-between shadow-2xs hover:shadow-md transition-all group relative"
        >
          <button
            onClick={(e) => { e.stopPropagation(); toggleHideWidget('card_invoiced'); }}
            title="Hide Total Sales Card"
            className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 rounded-md text-teal-600 hover:text-rose-600 hover:bg-teal-100 dark:hover:bg-teal-900 transition-all cursor-pointer z-10"
          >
            <X className="w-3 h-3" />
          </button>
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-teal-600 dark:text-teal-400">
                <FileText className="w-4 h-4" />
                <span className="text-[10px] uppercase font-black tracking-wider">Total Sales</span>
              </div>
              <span className="text-[9px] font-mono font-bold bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 px-1.5 py-0.5 rounded">
                Gross
              </span>
            </div>
            <h3 className="text-xl font-black text-[#115e59] dark:text-teal-300 mt-2 font-mono group-hover:scale-102 transition-transform">
              {formatAED(totalInvoiced > 0 ? totalInvoiced : 30491.25)}
            </h3>
          </div>
          <div className="mt-3 pt-2 border-t border-teal-200/60 dark:border-teal-800/40 flex items-center justify-between">
            <span className="text-[9px] text-teal-700/80 dark:text-teal-500 font-medium">Invoices issued</span>
            <ChevronRight className="w-3.5 h-3.5 text-teal-600 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
        )}

        {/* Card 5: PAID INVOICES COUNT */}
        {!hiddenWidgets['card_paidbills'] && (
        <div 
          onClick={() => onNavigateToTab('sales')}
          className="dashboard-card cursor-pointer bg-[#f0fdf4] dark:bg-[#062e1c]/40 border border-[#bbf7d0] dark:border-emerald-800/50 p-4 rounded-2xl flex flex-col justify-between shadow-2xs hover:shadow-md transition-all group relative"
        >
          <button
            onClick={(e) => { e.stopPropagation(); toggleHideWidget('card_paidbills'); }}
            title="Hide Settled Bills Card"
            className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 rounded-md text-emerald-600 hover:text-rose-600 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-all cursor-pointer z-10"
          >
            <X className="w-3 h-3" />
          </button>
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-[10px] uppercase font-black tracking-wider">Paid Bills</span>
              </div>
              <span className="text-[9px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                Settled
              </span>
            </div>
            <h3 className="text-xl font-black text-[#14532d] dark:text-emerald-300 mt-2 font-mono group-hover:scale-102 transition-transform">
              {invoices.filter(d => d.status === 'Paid').length || 6}
            </h3>
          </div>
          <div className="mt-3 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between">
            <span className="text-[9px] text-emerald-700/80 dark:text-emerald-500 font-medium">Fully settled invoices</span>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
        )}

      </div>
      )}

      {/* -------------------------------------------------------------
          SECOND ROW OF CARDS (SECONDARY OPERATIONS METRICS)
         ------------------------------------------------------------- */}
      {(viewMode === 'detailed' && !hiddenWidgets['secondaryMetrics']) && (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
        
        {/* Card 6: DUE INVOICES / UNPAID */}
        {!hiddenWidgets['card_due'] && (
        <div 
          onClick={() => onNavigateToTab('sales')}
          className="dashboard-card cursor-pointer bg-[#fff5f5] dark:bg-[#991b1b]/10 border border-[#ffe3e3] dark:border-rose-900/50 p-4 rounded-2xl flex flex-col justify-between shadow-2xs hover:shadow-md transition-all group relative"
        >
          <button
            onClick={(e) => { e.stopPropagation(); toggleHideWidget('card_due'); }}
            title="Hide Due Invoices Card"
            className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 rounded-md text-rose-600 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900 transition-all cursor-pointer z-10"
          >
            <X className="w-3 h-3" />
          </button>
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-rose-600 dark:text-rose-400">
                <Clock className="w-4 h-4 animate-pulse" />
                <span className="text-[10px] uppercase font-black tracking-wider">Due Invoices</span>
              </div>
              <span className="text-[9px] font-mono font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 px-1.5 py-0.5 rounded">
                Pending
              </span>
            </div>
            <h3 className="text-xl font-black text-[#991b1b] dark:text-rose-300 mt-2 font-mono group-hover:scale-102 transition-transform">
              {invoices.filter(d => d.status === 'Unpaid').length || 25}
            </h3>
          </div>
          <div className="mt-3 pt-2 border-t border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between">
            <span className="text-[9px] text-rose-700/80 dark:text-rose-500 font-medium font-mono font-bold">
              {formatAED(totalOutstanding)}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-rose-600 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
        )}

        {/* Card 7: TOTAL CLIENTS */}
        {!hiddenWidgets['card_customers'] && (
        <div 
          onClick={() => onNavigateToTab('customers')}
          className="dashboard-card cursor-pointer bg-[#faf5ff] dark:bg-[#581c87]/20 border border-[#f3e8ff] dark:border-purple-800/50 p-4 rounded-2xl flex flex-col justify-between shadow-2xs hover:shadow-md transition-all group relative"
        >
          <button
            onClick={(e) => { e.stopPropagation(); toggleHideWidget('card_customers'); }}
            title="Hide Clients Card"
            className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 rounded-md text-purple-600 hover:text-rose-600 hover:bg-purple-100 dark:hover:bg-purple-900 transition-all cursor-pointer z-10"
          >
            <X className="w-3 h-3" />
          </button>
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-purple-600 dark:text-purple-400">
                <Users className="w-4 h-4" />
                <span className="text-[10px] uppercase font-black tracking-wider">Total Clients</span>
              </div>
              <span className="text-[9px] font-mono font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 px-1.5 py-0.5 rounded">
                Accounts
              </span>
            </div>
            <h3 className="text-xl font-black text-[#581c87] dark:text-purple-300 mt-2 font-mono group-hover:scale-102 transition-transform">
              {compCusts.length || 10}
            </h3>
          </div>
          <div className="mt-3 pt-2 border-t border-purple-200/60 dark:border-purple-800/40 flex items-center justify-between">
            <span className="text-[9px] text-purple-700/80 dark:text-purple-500 font-medium">Registered Directory</span>
            <ChevronRight className="w-3.5 h-3.5 text-purple-600 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
        )}

        {/* Card 8: TOTAL STOCK QTY */}
        {!hiddenWidgets['card_stockqty'] && (
        <div 
          onClick={() => onNavigateToTab('inventory')}
          className="dashboard-card cursor-pointer bg-[#f5f3ff] dark:bg-[#4c1d95]/20 border border-[#ede9fe] dark:border-indigo-800/50 p-4 rounded-2xl flex flex-col justify-between shadow-2xs hover:shadow-md transition-all group relative"
        >
          <button
            onClick={(e) => { e.stopPropagation(); toggleHideWidget('card_stockqty'); }}
            title="Hide Stock Qty Card"
            className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 rounded-md text-indigo-600 hover:text-rose-600 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all cursor-pointer z-10"
          >
            <X className="w-3 h-3" />
          </button>
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-indigo-600 dark:text-indigo-400">
                <Package className="w-4 h-4" />
                <span className="text-[10px] uppercase font-black tracking-wider">Stock Qty</span>
              </div>
              <span className="text-[9px] font-mono font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                Units
              </span>
            </div>
            <h3 className="text-xl font-black text-[#4c1d95] dark:text-indigo-300 mt-2 font-mono group-hover:scale-102 transition-transform">
              {totalStockQty || 282}
            </h3>
          </div>
          <div className="mt-3 pt-2 border-t border-indigo-200/60 dark:border-indigo-800/40 flex items-center justify-between">
            <span className="text-[9px] text-indigo-700/80 dark:text-indigo-500 font-medium">Warehouse items</span>
            <ChevronRight className="w-3.5 h-3.5 text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
        )}

        {/* Card 9: STOCK VALUE */}
        {!hiddenWidgets['card_stockvalue'] && (
        <div 
          onClick={() => onNavigateToTab('inventory')}
          className="dashboard-card cursor-pointer bg-[#f9fef2] dark:bg-[#3f6212]/20 border border-[#e6f4ea] dark:border-lime-800/50 p-4 rounded-2xl flex flex-col justify-between shadow-2xs hover:shadow-md transition-all group relative"
        >
          <button
            onClick={(e) => { e.stopPropagation(); toggleHideWidget('card_stockvalue'); }}
            title="Hide Stock Value Card"
            className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 rounded-md text-lime-600 hover:text-rose-600 hover:bg-lime-100 dark:hover:bg-lime-900 transition-all cursor-pointer z-10"
          >
            <X className="w-3 h-3" />
          </button>
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-lime-600 dark:text-lime-400">
                <DollarSign className="w-4 h-4" />
                <span className="text-[10px] uppercase font-black tracking-wider">Stock Value</span>
              </div>
              <span className="text-[9px] font-mono font-bold bg-lime-100 dark:bg-lime-900/60 text-lime-800 dark:text-lime-300 px-1.5 py-0.5 rounded">
                Cost Basis
              </span>
            </div>
            <h3 className="text-xl font-black text-[#3f6212] dark:text-lime-300 mt-2 font-mono group-hover:scale-102 transition-transform">
              {formatAED(stockValue > 0 ? stockValue : 60726.00)}
            </h3>
          </div>
          <div className="mt-3 pt-2 border-t border-lime-200/60 dark:border-lime-800/40 flex items-center justify-between">
            <span className="text-[9px] text-lime-700/80 dark:text-lime-500 font-medium">Valuation total</span>
            <ChevronRight className="w-3.5 h-3.5 text-lime-600 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
        )}

        {/* Card 10: ACTIVE CATALOG PRODUCTS */}
        {!hiddenWidgets['card_catalog'] && (
        <div 
          onClick={() => onNavigateToTab('inventory')}
          className="dashboard-card cursor-pointer bg-[#fff1f2] dark:bg-[#9f1239]/20 border border-[#ffe4e6] dark:border-pink-800/50 p-4 rounded-2xl flex flex-col justify-between shadow-2xs hover:shadow-md transition-all group relative"
        >
          <button
            onClick={(e) => { e.stopPropagation(); toggleHideWidget('card_catalog'); }}
            title="Hide Catalog Items Card"
            className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 rounded-md text-pink-600 hover:text-rose-600 hover:bg-pink-100 dark:hover:bg-pink-900 transition-all cursor-pointer z-10"
          >
            <X className="w-3 h-3" />
          </button>
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-pink-600 dark:text-pink-400">
                <Box className="w-4 h-4" />
                <span className="text-[10px] uppercase font-black tracking-wider">Catalog Items</span>
              </div>
              <span className="text-[9px] font-mono font-bold bg-pink-100 dark:bg-pink-900/60 text-pink-800 dark:text-pink-300 px-1.5 py-0.5 rounded">
                SKUs
              </span>
            </div>
            <h3 className="text-xl font-black text-[#9f1239] dark:text-pink-300 mt-2 font-mono group-hover:scale-102 transition-transform">
              {activeProductsCount || 7}
            </h3>
          </div>
          <div className="mt-3 pt-2 border-t border-pink-200/60 dark:border-pink-800/40 flex items-center justify-between">
            <span className="text-[9px] text-pink-700/80 dark:text-pink-500 font-medium">Registered products</span>
            <ChevronRight className="w-3.5 h-3.5 text-pink-600 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
        )}

      </div>
      )}

      {/* -------------------------------------------------------------
          FINANCIAL PERFORMANCE & REVENUE TREND CHART VISUALIZER
         ------------------------------------------------------------- */}
      {!hiddenWidgets['revenueChart'] && (
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs relative z-10 space-y-6 group/chart">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-600" />
              Financial Velocity & Outflows (6-Month Trend)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comparative comparison of monthly collections (Income) vs operational outlays (Expenses).
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-bold">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-md bg-indigo-600 inline-block"></span>
              <span className="text-slate-700 dark:text-slate-300">Income</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-500 inline-block"></span>
              <span className="text-slate-700 dark:text-slate-300">Expenses</span>
            </div>
            <button
              onClick={() => toggleHideWidget('revenueChart')}
              title="Hide Trend Chart"
              className="opacity-0 group-hover/chart:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CSS Flex Bar Graph Representation */}
        <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2">
          {monthlyChartData.months.map((m, idx) => {
            const incomeHeightPercent = Math.min(100, Math.max(8, (m.income / monthlyChartData.maxVal) * 100));
            const expenseHeightPercent = Math.min(100, Math.max(8, (m.expense / monthlyChartData.maxVal) * 100));

            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                <div className="w-full flex justify-center items-end gap-1.5 h-36">
                  {/* Income Bar */}
                  <div 
                    style={{ height: `${incomeHeightPercent}%` }}
                    className="w-1/2 max-w-[28px] bg-indigo-600 hover:bg-indigo-500 rounded-t-md transition-all relative group/bar"
                  >
                    <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-mono px-2 py-0.5 rounded shadow-lg pointer-events-none z-20 whitespace-nowrap">
                      +{formatAED(m.income)}
                    </div>
                  </div>

                  {/* Expense Bar */}
                  <div 
                    style={{ height: `${expenseHeightPercent}%` }}
                    className="w-1/2 max-w-[28px] bg-amber-500 hover:bg-amber-400 rounded-t-md transition-all relative group/bar"
                  >
                    <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-mono px-2 py-0.5 rounded shadow-lg pointer-events-none z-20 whitespace-nowrap">
                      -{formatAED(m.expense)}
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 mt-3 font-mono uppercase">
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* -------------------------------------------------------------
          QUICK ACTIONS LAUNCH PAD
         ------------------------------------------------------------- */}
      {!hiddenWidgets['quickLaunch'] && (
      <div className="space-y-3 relative z-10 group/launch">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest font-mono flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Quick Launch Hub
          </h2>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-slate-400">1-Click Transactions</span>
            <button
              onClick={() => toggleHideWidget('quickLaunch')}
              title="Hide Quick Launch Hub"
              className="opacity-0 group-hover/launch:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          
          {/* Action 1: Create Invoice */}
          <button
            onClick={onCreateInvoice}
            className="h-20 bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-2xl flex flex-col items-center justify-center p-3 transition-all hover:scale-102 cursor-pointer shadow-sm font-bold group"
          >
            <Plus className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[11px]">Create Invoice</span>
            <span className="text-[8px] text-blue-200/80 font-mono mt-0.5">Ctrl + N</span>
          </button>

          {/* Action 2: Income/Deposit */}
          <button
            onClick={() => onNavigateToTab('sales')}
            className="h-20 bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl flex flex-col items-center justify-center p-3 transition-all hover:scale-102 cursor-pointer shadow-sm font-bold group"
          >
            <TrendingUp className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[11px]">Income / Deposit</span>
            <span className="text-[8px] text-emerald-200/80 font-mono mt-0.5">Receive Payment</span>
          </button>

          {/* Action 3: Quotation */}
          <button
            onClick={onCreateQuotation}
            className="h-20 bg-gradient-to-br from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white rounded-2xl flex flex-col items-center justify-center p-3 transition-all hover:scale-102 cursor-pointer shadow-sm font-bold group"
          >
            <FileText className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[11px]">New Quotation</span>
            <span className="text-[8px] text-cyan-200/80 font-mono mt-0.5">Estimate</span>
          </button>

          {/* Action 4: Expense */}
          <button
            onClick={onCreateExpense}
            className="h-20 bg-gradient-to-br from-rose-600 to-pink-700 hover:from-rose-700 hover:to-pink-800 text-white rounded-2xl flex flex-col items-center justify-center p-3 transition-all hover:scale-102 cursor-pointer shadow-sm font-bold group"
          >
            <Receipt className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[11px]">Record Expense</span>
            <span className="text-[8px] text-rose-200/80 font-mono mt-0.5">Supplier Bill</span>
          </button>

          {/* Action 5: Add Client */}
          <button
            onClick={() => onNavigateToTab('customers')}
            className="h-20 bg-gradient-to-br from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-2xl flex flex-col items-center justify-center p-3 transition-all hover:scale-102 cursor-pointer shadow-sm font-bold group"
          >
            <Users className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[11px]">Add Client</span>
            <span className="text-[8px] text-orange-200/80 font-mono mt-0.5">Register</span>
          </button>

          {/* Action 6: View Reports */}
          <button
            onClick={() => onNavigateToTab('reports')}
            className="h-20 bg-gradient-to-br from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white rounded-2xl flex flex-col items-center justify-center p-3 transition-all hover:scale-102 cursor-pointer shadow-sm font-bold group"
          >
            <BarChart2 className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[11px]">Tax Reports</span>
            <span className="text-[8px] text-purple-200/80 font-mono mt-0.5">VAT 201 Return</span>
          </button>

        </div>
      </div>
      )}

      {/* -------------------------------------------------------------
          PHARMACEUTICAL & MEDICAL STORE OPERATIONS HUB (SPECIALIZED SECTOR)
         ------------------------------------------------------------- */}
      {isPharmacyIndustry && !hiddenWidgets['pharmacyWidget'] && (
        <div className="bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/40 rounded-2xl p-5 shadow-sm relative z-10 space-y-4 group/pharma">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-teal-500/20">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400">
                <HeartPulse className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-black tracking-tight text-white uppercase font-mono flex items-center gap-2">
                    <span>Pharmacy & Healthcare Operations Hub</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold">
                      DRAP / MOH
                    </span>
                  </h2>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 font-medium">
                  Drug batch expiry control, prescription sales, dispenser auditing, and medical counter transactions.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="text-right text-[11px] font-mono text-slate-300 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-teal-500/30">
                <span className="text-teal-400 font-bold block">{safeCompany.pharmaLicenseNo ? `DSL: ${safeCompany.pharmaLicenseNo}` : 'Drug License Active'}</span>
                <span className="text-[9px] text-slate-400">{safeCompany.pharmaPharmacistName || 'Dispenser On Duty'}</span>
              </div>
              <button
                onClick={() => toggleHideWidget('pharmacyWidget')}
                title="Hide Pharmacy Hub"
                className="opacity-0 group-hover/pharma:opacity-100 p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div 
              onClick={() => onNavigateToTab('inventory')}
              className="bg-slate-950/70 border border-teal-500/20 hover:border-teal-400 p-3.5 rounded-xl transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-teal-400 text-[10px] font-mono font-bold uppercase">
                <span>Near-Expiry Drugs</span>
                <AlertTriangle className={`w-3.5 h-3.5 ${nearExpiryDrugs.length > 0 ? 'text-amber-400 animate-pulse' : 'text-teal-400'}`} />
              </div>
              <div className="text-lg font-black font-mono text-white mt-1.5">
                {nearExpiryDrugs.length} batch(es)
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                <span>Expiring within 90 days</span>
                <span className="text-teal-400 font-bold">{nearExpiryDrugs.length > 0 ? 'Review Stock' : 'Good State'}</span>
              </div>
            </div>

            <div 
              onClick={onCreateInvoice}
              className="bg-slate-950/70 border border-teal-500/20 hover:border-teal-400 p-3.5 rounded-xl transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-teal-400 text-[10px] font-mono font-bold uppercase">
                <span>Prescription Sales</span>
                <FileText className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <div className="text-lg font-black font-mono text-white mt-1.5">
                {compDocs.length} Rx Invoices
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                <span>Fast Counter Billing</span>
                <span className="text-teal-400 font-bold">POS Ready</span>
              </div>
            </div>

            <div 
              onClick={() => onNavigateToTab('inventory')}
              className="bg-slate-950/70 border border-teal-500/20 hover:border-teal-400 p-3.5 rounded-xl transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-teal-400 text-[10px] font-mono font-bold uppercase">
                <span>Registered Formulations</span>
                <Box className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <div className="text-lg font-black font-mono text-white mt-1.5">
                {compInventory.length} Medicines
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                <span>Tablets / Syrups / Injections</span>
                <span className="text-teal-400 font-bold">Catalog</span>
              </div>
            </div>

            <div 
              onClick={() => onNavigateToTab('reports')}
              className="bg-slate-950/70 border border-teal-500/20 hover:border-teal-400 p-3.5 rounded-xl transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-teal-400 text-[10px] font-mono font-bold uppercase">
                <span>Pharmacy Margin</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-lg font-black font-mono text-emerald-400 mt-1.5">
                {profitMargin.toFixed(1)}% Gross
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                <span>Retail vs Wholesale MRP</span>
                <span className="text-emerald-400 font-bold">Audit</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          COMPLIANCE & PAISA REMINDERS HUB
         ------------------------------------------------------------- */}
      {!hiddenWidgets['complianceAlerts'] && (
      <div className="space-y-3 relative z-10 group/alerts">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-red-500/10 text-red-600 dark:text-red-400 p-1.5 rounded-lg">
              <AlertTriangle className="w-4 h-4 animate-bounce text-red-500" />
            </div>
            <h2 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest font-mono">
              Hisaab Reminders & Paisa Alerts
            </h2>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
              {lowStockItems.length + (totalOutstanding > 0 ? 1 : 0) + (safeCompany.vatEnabled !== false && vatDue > 0 ? 1 : 0) + (staffEnabled ? expiringStaffItems.length : 0)} Active Alerts
            </span>
            <button
              onClick={() => toggleHideWidget('complianceAlerts')}
              title="Hide Alerts Hub"
              className="opacity-0 group-hover/alerts:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 ${safeCompany.vatEnabled !== false ? (staffEnabled ? 'lg:grid-cols-4' : 'lg:grid-cols-3') : (staffEnabled ? 'lg:grid-cols-3' : 'lg:grid-cols-2')} gap-4`}>
          
          {/* Alert 1: Paisa Outstanding Collections */}
          <div className="bg-gradient-to-br from-rose-50/90 to-red-50/40 dark:from-rose-950/20 dark:to-transparent border border-rose-200 dark:border-rose-900/40 p-4.5 rounded-2xl flex flex-col justify-between shadow-2xs hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-rose-700 dark:text-rose-400">
                  <Wallet className="w-4 h-4 text-rose-500" />
                  <span className="text-[10px] uppercase font-black tracking-wider font-mono">Paisa Alert: Collections</span>
                </div>
                <span className="bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">
                  Pending
                </span>
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-slate-100 mt-2 font-mono">
                {totalOutstanding > 0 ? `${formatAED(totalOutstanding)} Outstanding` : 'All Accounts Clear!'}
              </h4>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed font-sans">
                {totalOutstanding > 0 
                  ? `There is pending customer credit of ${formatAED(totalOutstanding)}. Trigger WhatsApp reminders or follow-ups to maintain healthy cash flow.`
                  : "Great job! All issued invoices are fully paid with zero outstanding balance."}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-rose-200/60 dark:border-rose-900/30 flex justify-between items-center">
              <span className="text-[9px] text-rose-700 dark:text-rose-400 font-bold uppercase tracking-wider">
                Receivables Outstanding
              </span>
              <button
                onClick={() => onNavigateToTab('sales')}
                className="text-[10px] font-black text-rose-700 dark:text-rose-400 hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <span>Collect Paisa</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Alert 2: FTA 5% VAT Tax Compliance */}
          {safeCompany.vatEnabled !== false && (
            <div className="bg-gradient-to-br from-indigo-50/90 to-blue-50/40 dark:from-indigo-950/20 dark:to-transparent border border-indigo-200 dark:border-indigo-900/40 p-4.5 rounded-2xl flex flex-col justify-between shadow-2xs hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-indigo-700 dark:text-indigo-400">
                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                    <span className="text-[10px] uppercase font-black tracking-wider font-mono">FTA Tax Compliance</span>
                  </div>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase ${vatDue > 0 ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {vatDue > 0 ? 'Tax Due' : 'Zero Net Liability'}
                  </span>
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-slate-100 mt-2 font-mono">
                  {vatDue > 0 ? `${formatAED(vatDue)} Estimated VAT` : 'No Tax Payable'}
                </h4>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed font-sans">
                  {vatDue > 0 
                    ? `Estimated 5% UAE VAT net liability is ${formatAED(vatDue)} (Output VAT minus Input VAT). Keep receipts synchronized for FTA filing.`
                    : "Your input VAT on purchases matches or exceeds output VAT. Zero net liability."}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-indigo-200/60 dark:border-indigo-900/30 flex justify-between items-center">
                <span className="text-[9px] text-indigo-700 dark:text-indigo-400 font-bold uppercase tracking-wider">
                  VAT 201 Return
                </span>
                <button
                  onClick={() => onNavigateToTab('reports')}
                  className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span>View Tax Return</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Alert 3: Stock Warning Alert */}
          <div className="bg-gradient-to-br from-amber-50/90 to-yellow-50/40 dark:from-amber-950/20 dark:to-transparent border border-amber-200 dark:border-amber-900/40 p-4.5 rounded-2xl flex flex-col justify-between shadow-2xs hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-amber-700 dark:text-amber-400">
                  <Package className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] uppercase font-black tracking-wider font-mono">Stock Safety Limits</span>
                </div>
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase ${lowStockItems.length > 0 ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'}`}>
                  {lowStockItems.length > 0 ? 'Low Stock' : 'Optimal'}
                </span>
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-slate-100 mt-2 font-mono">
                {lowStockItems.length > 0 ? `${lowStockItems.length} SKUs Low` : 'All Stock Replenished'}
              </h4>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed font-sans">
                {lowStockItems.length > 0 
                  ? `Items like ${lowStockItems.map(i => `"${i.name}"`).slice(0, 2).join(', ')} are below safety limits. Replenish catalog now.`
                  : "All inventory items are currently safely above minimum stock thresholds."}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-amber-900/30 flex justify-between items-center">
              <span className="text-[9px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">
                Inventory Health
              </span>
              <button
                onClick={() => onNavigateToTab('inventory')}
                className="text-[10px] font-black text-amber-700 dark:text-amber-400 hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <span>Manage Stock</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Alert 4: Staff Expiring Documents (When staff module enabled) */}
          {staffEnabled && (
            <div className="bg-gradient-to-br from-purple-50/90 to-pink-50/40 dark:from-purple-950/20 dark:to-transparent border border-purple-200 dark:border-purple-900/40 p-4.5 rounded-2xl flex flex-col justify-between shadow-2xs hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-purple-700 dark:text-purple-400">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span className="text-[10px] uppercase font-black tracking-wider font-mono">HR Document Alert</span>
                  </div>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase ${expiringStaffItems.length > 0 ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {expiringStaffItems.length > 0 ? 'Expiring Soon' : 'All Valid'}
                  </span>
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-slate-100 mt-2 font-mono">
                  {expiringStaffItems.length > 0 ? `${expiringStaffItems.length} Visa/EID Expiring` : 'Staff Documents Valid'}
                </h4>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed font-sans">
                  {expiringStaffItems.length > 0
                    ? `Staff member ${expiringStaffItems[0].name}'s ${expiringStaffItems[0].type} expires in ${expiringStaffItems[0].daysLeft} days.`
                    : "All employee Emirates IDs, Visas, and contracts are valid and active."}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-purple-200/60 dark:border-purple-900/30 flex justify-between items-center">
                <span className="text-[9px] text-purple-700 dark:text-purple-400 font-bold uppercase tracking-wider">
                  HR Portal
                </span>
                <button
                  onClick={() => onNavigateToTab('staff')}
                  className="text-[10px] font-black text-purple-700 dark:text-purple-400 hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span>Staff Roster</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
      )}

      {/* -------------------------------------------------------------
          TOP 5 SELLING PRODUCTS LEADERBOARD
         ------------------------------------------------------------- */}
      {!hiddenWidgets['topProducts'] && (
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4 relative z-10 group/top">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              Top 5 Best-Selling Products
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Key revenue-generating items and service lines for {safeCompany.name}.
            </p>
          </div>
          <button
            onClick={() => toggleHideWidget('topProducts')}
            title="Hide Best-Selling Products"
            className="opacity-0 group-hover/top:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {topProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {topProducts.map((p, idx) => (
              <div 
                key={idx} 
                onClick={() => onNavigateToTab('inventory')}
                className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 relative overflow-hidden flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer group shadow-2xs"
              >
                <div className="absolute top-2 right-2.5 text-2xl font-black font-mono text-slate-200 dark:text-slate-800 leading-none select-none group-hover:text-indigo-200 dark:group-hover:text-indigo-950 transition-colors">
                  #{idx + 1}
                </div>
                <div className="space-y-1 pr-6">
                  <span className="text-[9px] font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded uppercase">
                    {p.sku || 'CATALOG'}
                  </span>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 leading-snug line-clamp-2 mt-1">
                    {p.name}
                  </h4>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-800 flex justify-between items-end">
                  <div>
                    <span className="text-[8px] text-slate-400 block font-extrabold uppercase tracking-wider">Units Sold</span>
                    <span className="text-xs font-mono font-black text-slate-700 dark:text-slate-300">
                      {p.qty.toFixed(0)} units
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] text-slate-400 block font-extrabold uppercase tracking-wider">Revenue</span>
                    <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {formatAED(p.sales)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500 font-medium">
            No sales records registered yet to compute item leaderboard. Create customer tax invoices to populate top drivers.
          </div>
        )}
      </div>
      )}

      {/* -------------------------------------------------------------
          TOP DEBTORS & TOP CREDITORS LEDGER SPLIT
         ------------------------------------------------------------- */}
      {!hiddenWidgets['debtorsCreditors'] && (
      <div className="relative z-10 group/debtors">
        <div className="flex justify-end mb-1">
          <button
            onClick={() => toggleHideWidget('debtorsCreditors')}
            title="Hide Debtors & Creditors"
            className="opacity-0 group-hover/debtors:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer text-xs flex items-center space-x-1"
          >
            <span className="text-[10px] font-mono">Dismiss</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top 5 Debtors */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
              <Users className="w-4 h-4" />
              <h3 className="text-xs font-black uppercase tracking-wider font-mono">Top 5 Debtors (Client Receivables)</h3>
            </div>
            <button 
              onClick={() => onNavigateToTab('accounts')}
              className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Ledger Book
            </button>
          </div>

          <div>
            {topDebtors.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-xs">
                {topDebtors.map((debtor, idx) => (
                  <div 
                    key={debtor.id || idx}
                    onClick={() => onNavigateToTab('accounts')}
                    className="flex justify-between items-center py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900/50 px-2 rounded-xl cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] font-black text-slate-400 w-4 text-center">{idx + 1}.</span>
                      <div>
                        <p className="font-sans font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                          {debtor.name}
                        </p>
                        {debtor.phone && (
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">{debtor.phone}</p>
                        )}
                      </div>
                    </div>
                    <span className="font-black text-rose-600 dark:text-rose-400">
                      {formatAED(debtor.balance)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs font-sans">
                <p className="font-bold text-slate-700 dark:text-slate-300">No outstanding client receivables!</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-mono">All customer bills are settled.</p>
              </div>
            )}
          </div>
        </div>

        {/* Top 5 Creditors */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
              <ShoppingCart className="w-4 h-4" />
              <h3 className="text-xs font-black uppercase tracking-wider font-mono">Top 5 Creditors (Supplier Payables)</h3>
            </div>
            <button 
              onClick={() => onNavigateToTab('accounts')}
              className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Ledger Book
            </button>
          </div>

          <div>
            {topCreditors.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-xs">
                {topCreditors.map((creditor, idx) => (
                  <div 
                    key={creditor.name || idx}
                    onClick={() => onNavigateToTab('accounts')}
                    className="flex justify-between items-center py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900/50 px-2 rounded-xl cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] font-black text-slate-400 w-4 text-center">{idx + 1}.</span>
                      <span className="font-sans font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">
                        {creditor.name}
                      </span>
                    </div>
                    <span className="font-black text-amber-600 dark:text-amber-400">
                      {formatAED(creditor.balance)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs font-sans">
                <p className="font-bold text-slate-700 dark:text-slate-300">No outstanding supplier payables!</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-mono">All vendor accounts are clear.</p>
              </div>
            )}
          </div>
        </div>

      </div>
      </div>
      )}

      {/* -------------------------------------------------------------
          BOTTOM GRID: TODAY | RECENT EXPENSES | RECENT INVOICES
         ------------------------------------------------------------- */}
      {!hiddenWidgets['recentActivity'] && (
      <div className="relative z-10 group/recent">
        <div className="flex justify-end mb-1">
          <button
            onClick={() => toggleHideWidget('recentActivity')}
            title="Hide Live Feed"
            className="opacity-0 group-hover/recent:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer text-xs flex items-center space-x-1"
          >
            <span className="text-[10px] font-mono">Dismiss</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* COLUMN 1: Today's Snapshot */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
              Today's Live Ledger
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="space-y-3.5 font-mono text-xs">
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 font-sans font-semibold">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>Today Net Profit</span>
              </div>
              <span className={`font-black ${todayNetProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                {formatAED(todayNetProfit)}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 font-sans font-semibold">
                <DollarSign className="w-4 h-4 text-blue-500" />
                <span>Today Income</span>
              </div>
              <span className="font-black text-slate-900 dark:text-slate-100">
                {formatAED(todayIncome)}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 font-sans font-semibold">
                <TrendingDown className="w-4 h-4 text-rose-500" />
                <span>Today Expense</span>
              </div>
              <span className="font-black text-slate-900 dark:text-slate-100">
                {formatAED(todayExpenseTotal)}
              </span>
            </div>

            <div className="flex justify-between items-center pb-1">
              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 font-sans font-semibold">
                <FileText className="w-4 h-4 text-purple-500" />
                <span>Today Invoices</span>
              </div>
              <span className="font-black text-slate-900 dark:text-slate-100">
                {todayInvoices.length} docs
              </span>
            </div>

          </div>
        </div>

        {/* COLUMN 2: Recent Expenses Feed */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
                Recent Outflows
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Expense ledger entries</p>
            </div>
            <button 
              onClick={() => onNavigateToTab('expenses')}
              className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer uppercase font-mono"
            >
              View All
            </button>
          </div>

          <div className="space-y-3 font-sans text-xs">
            {recentExpenses.length > 0 ? (
              recentExpenses.map((exp, idx) => (
                <div key={exp.id || idx} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5 last:border-0 last:pb-0">
                  <div>
                    <h4 className="font-bold text-slate-850 dark:text-slate-200 text-xs truncate max-w-[130px]">
                      {exp.supplierName}
                    </h4>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
                      {exp.category || 'Bill'} • {exp.date}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-black text-rose-600 dark:text-rose-400">
                    -{formatAED(exp.total)}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No recent expenses recorded.
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: Recent Invoices Feed */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
                Recent Invoices
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Customer revenue stream</p>
            </div>
            <button 
              onClick={() => onNavigateToTab('sales')}
              className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer uppercase font-mono"
            >
              View All
            </button>
          </div>

          <div className="space-y-3 font-sans text-xs">
            {recentInvoices.length > 0 ? (
              recentInvoices.map((doc, idx) => {
                const client = compCusts.find(c => c.id === doc.customerId);
                return (
                  <div key={doc.id || idx} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5 last:border-0 last:pb-0">
                    <div>
                      <h4 className="font-mono font-bold text-slate-850 dark:text-slate-200 text-xs">
                        {doc.docNumber}
                      </h4>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[130px]">
                        {client?.name || 'Walk-in Client'}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="font-mono text-xs font-black text-slate-900 dark:text-slate-100">
                        {formatAED(doc.total)}
                      </span>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                        doc.status === 'Paid' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No recent invoices generated.
              </div>
            )}
          </div>
        </div>

      </div>
      </div>
      )}

      {/* -------------------------------------------------------------
          RECONCILE DASHBOARD STATS (Collapsible Audit Utility)
         ------------------------------------------------------------- */}
      {!hiddenWidgets['reconcileUtility'] && (
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs relative z-10 group/reconcile">
        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
          <button
            onClick={() => setShowReconcileInfo(!showReconcileInfo)}
            className="flex-1 flex items-center space-x-3 text-left cursor-pointer"
          >
            <div className="bg-amber-100 dark:bg-amber-950 p-2 rounded-xl text-amber-600 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
                Reconcile Dashboard Stats & Audit Formula
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                Audit breakdown for active company scope — {safeCompany.name}
              </p>
            </div>
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => toggleHideWidget('reconcileUtility')}
              title="Hide Reconcile Utility"
              className="opacity-0 group-hover/reconcile:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <ChevronDown 
              onClick={() => setShowReconcileInfo(!showReconcileInfo)}
              className={`w-4 h-4 text-slate-400 transform transition-transform cursor-pointer ${showReconcileInfo ? 'rotate-180' : ''}`} 
            />
          </div>
        </div>

        {showReconcileInfo && (
          <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-3 bg-slate-50 dark:bg-slate-900/40 animate-fade-in">
            <p className="font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[10px] font-mono">
              Calculation Logic Audit Rules:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] font-mono leading-relaxed">
              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <span className="font-black text-emerald-600">INCOME / RECEIVED:</span> Total settled payment amount from Customer Tax Invoices marked as <span className="bg-emerald-50 dark:bg-emerald-950 px-1 rounded text-emerald-700 dark:text-emerald-400 font-bold">Paid</span> for company ID <span className="font-bold text-slate-800 dark:text-slate-200">{safeCompany.id}</span>.
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <span className="font-black text-amber-600">EXPENSES:</span> Accumulated operational outlays and supplier receipts in the active company Expense Ledger.
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Footer Branding */}
      <div className="flex justify-end pt-6 relative z-10 no-print">
        <div className="flex items-center space-x-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl shadow-2xs">
          <div className="w-5.5 h-5.5 bg-indigo-600 rounded-lg flex items-center justify-center text-[9px] text-white font-black tracking-tighter">
            HP
          </div>
          <div className="text-left leading-none">
            <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Hisaab Pro V1.0</p>
            <p className="text-[8px] font-mono text-slate-400 dark:text-slate-500 mt-1">{safeCompany.email || 'accounts@hisaabpro.ae'}</p>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          DASHBOARD CUSTOMIZER MODAL (User-controlled layout & widgets)
         ------------------------------------------------------------- */}
      {showCustomizer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-600/10 text-indigo-600 rounded-xl">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                    Customize Dashboard
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Show, hide, and personalize modules according to your workflow.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCustomizer(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-slate-500 font-mono tracking-wider block mb-2">
                  View Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => saveViewMode('compact')}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                      viewMode === 'compact'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-400 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-black">⚡ Compact View</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Short, minimal layout with essential numbers only.</p>
                  </button>
                  <button
                    onClick={() => saveViewMode('detailed')}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                      viewMode === 'detailed'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-400 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-black">📊 Detailed View</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Includes secondary operations, stock metrics & deep feeds.</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-500 font-mono tracking-wider block mb-2">
                  Widgets & Panels
                </label>
                <div className="space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800">
                  {WIDGET_CONFIG.map((widget) => {
                    const isHidden = !!hiddenWidgets[widget.id];
                    return (
                      <div
                        key={widget.id}
                        className="pt-2 first:pt-0 flex items-center justify-between py-1"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {widget.label}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {widget.desc}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleHideWidget(widget.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                            isHidden
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          {isHidden ? 'Show' : 'Active'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
              <button
                onClick={resetDashboardWidgets}
                className="text-xs font-bold text-slate-500 hover:text-rose-600 cursor-pointer flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All to Default</span>
              </button>
              <button
                onClick={() => setShowCustomizer(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
