import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users, 
  Search, 
  Download, 
  Printer, 
  Filter, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  BarChart2, 
  PieChart, 
  ShieldAlert, 
  Sparkles, 
  Info, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Building,
  Tag,
  ArrowRight
} from 'lucide-react';
import { Company, Customer, InventoryItem, SalesDocument, Expense } from '../types';

interface ProfitabilityAnalysisReportProps {
  company: Company;
  documents: SalesDocument[];
  expenses: Expense[];
  customers: Customer[];
  inventory: InventoryItem[];
  startDate: string;
  endDate: string;
  onDateChange?: (start: string, end: string) => void;
}

export const ProfitabilityAnalysisReport: React.FC<ProfitabilityAnalysisReportProps> = ({
  company,
  documents,
  expenses,
  customers,
  inventory,
  startDate: initialStartDate,
  endDate: initialEndDate,
  onDateChange
}) => {
  // Date range states
  const [startDate, setStartDate] = useState<string>(initialStartDate || `${new Date().getFullYear()}-01-01`);
  const [endDate, setEndDate] = useState<string>(initialEndDate || `${new Date().getFullYear()}-12-31`);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'customer' | 'product' | 'matrix' | 'reconciliation'>('customer');

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedEmirate, setSelectedEmirate] = useState<string>('ALL');
  const [marginTierFilter, setMarginTierFilter] = useState<'ALL' | 'high' | 'moderate' | 'low' | 'negative'>('ALL');
  const [opexAllocationMethod, setOpexAllocationMethod] = useState<'revenue_share' | 'volume_share' | 'equal'>('revenue_share');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Sorting States
  const [sortField, setSortField] = useState<string>('netProfit');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Sync date updates if props change
  React.useEffect(() => {
    if (initialStartDate) setStartDate(initialStartDate);
    if (initialEndDate) setEndDate(initialEndDate);
  }, [initialStartDate, initialEndDate]);

  const handleApplyDateRange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    if (onDateChange) {
      onDateChange(start, end);
    }
  };

  // Quick Preset Helper
  const applyPreset = (preset: 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'ytd' | 'last_12m' | 'all') => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth(); // 0-11

    let s = '';
    let e = '';

    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'this_month') {
      s = formatDate(new Date(curYear, curMonth, 1));
      e = formatDate(new Date(curYear, curMonth + 1, 0));
    } else if (preset === 'last_month') {
      s = formatDate(new Date(curYear, curMonth - 1, 1));
      e = formatDate(new Date(curYear, curMonth, 0));
    } else if (preset === 'this_quarter') {
      const qStartMonth = Math.floor(curMonth / 3) * 3;
      s = formatDate(new Date(curYear, qStartMonth, 1));
      e = formatDate(new Date(curYear, qStartMonth + 3, 0));
    } else if (preset === 'last_quarter') {
      let qYear = curYear;
      let qStartMonth = Math.floor(curMonth / 3) * 3 - 3;
      if (qStartMonth < 0) {
        qYear -= 1;
        qStartMonth = 9;
      }
      s = formatDate(new Date(qYear, qStartMonth, 1));
      e = formatDate(new Date(qYear, qStartMonth + 3, 0));
    } else if (preset === 'ytd') {
      s = `${curYear}-01-01`;
      e = formatDate(now);
    } else if (preset === 'last_12m') {
      const lastYear = new Date(curYear - 1, curMonth, now.getDate());
      s = formatDate(lastYear);
      e = formatDate(now);
    } else {
      s = '2020-01-01';
      e = `${curYear + 1}-12-31`;
    }

    handleApplyDateRange(s, e);
  };

  // Currency Formatter
  const formatAED = (val: number) => {
    const currency = company?.currency || 'AED';
    return `${currency} ${Number(val || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Filter Sales Invoices and Expenses by Company & Date Range
  const periodInvoices = useMemo(() => {
    return documents.filter(doc => {
      if (doc.companyId !== company.id) return false;
      if (doc.type !== 'Invoice' && doc.type !== 'CreditNote') return false;
      if (doc.status === 'Cancelled') return false;
      const docDate = (doc.date || '').slice(0, 10);
      if (startDate && docDate < startDate) return false;
      if (endDate && docDate > endDate) return false;
      return true;
    });
  }, [documents, company.id, startDate, endDate]);

  const periodExpenses = useMemo(() => {
    return expenses.filter(exp => {
      if (exp.companyId !== company.id) return false;
      const expDate = (exp.date || '').slice(0, 10);
      if (startDate && expDate < startDate) return false;
      if (endDate && expDate > endDate) return false;
      return true;
    });
  }, [expenses, company.id, startDate, endDate]);

  // Overall Operating Overhead / OPEX for the period (excluding direct purchases if captured in COGS)
  const totalPeriodOpex = useMemo(() => {
    return periodExpenses.reduce((sum, exp) => {
      // If it's a purchase item, some may be COGS, but standard OPEX includes Rent, Salaries, Utilities, Marketing, Logistics, Other
      const isDirectStockPurchase = exp.category === 'Purchases' && exp.entryType !== 'Supplier Credit Note';
      // In general business analysis, non-purchase expenses are standard OPEX
      const amount = exp.entryType === 'Supplier Credit Note' ? -Math.abs(exp.amount || 0) : (exp.amount || 0);
      return sum + amount;
    }, 0);
  }, [periodExpenses]);

  // ==========================================
  // 1. CUSTOMER PROFITABILITY COMPUTATIONS
  // ==========================================
  const customerProfitabilityData = useMemo(() => {
    const customerMap: Record<string, {
      customerId: string;
      name: string;
      trn: string;
      emirate: string;
      invoicesCount: number;
      creditNotesCount: number;
      unitsPurchased: number;
      grossRevenue: number;
      directCogs: number;
      grossProfit: number;
      grossMarginPct: number;
      allocatedOpex: number;
      netProfit: number;
      netMarginPct: number;
      aov: number;
      itemsList: Array<{ name: string; sku: string; qty: number; revenue: number; cogs: number; profit: number }>;
      invoicesList: Array<{ id: string; docNumber: string; date: string; amount: number; type: string }>;
    }> = {};

    let totalPeriodGrossRevenue = 0;
    let totalPeriodUnitsSold = 0;

    // First pass: compute Revenue, COGS, units per customer
    periodInvoices.forEach(inv => {
      const isCreditNote = inv.type === 'CreditNote';
      const cust = customers.find(c => c.id === inv.customerId);
      const custId = inv.customerId || 'walk_in';
      const custName = cust?.name || (inv.customerId ? 'Unknown Customer' : 'Walk-in Customer');
      const custTrn = cust?.trn || 'N/A';
      const custEmirate = cust?.emirate || 'Unassigned';

      if (!customerMap[custId]) {
        customerMap[custId] = {
          customerId: custId,
          name: custName,
          trn: custTrn,
          emirate: custEmirate,
          invoicesCount: 0,
          creditNotesCount: 0,
          unitsPurchased: 0,
          grossRevenue: 0,
          directCogs: 0,
          grossProfit: 0,
          grossMarginPct: 0,
          allocatedOpex: 0,
          netProfit: 0,
          netMarginPct: 0,
          aov: 0,
          itemsList: [],
          invoicesList: []
        };
      }

      const mult = isCreditNote ? -1 : 1;
      const invRevenue = (inv.subtotal || 0) * mult;
      let invCogs = 0;
      let invUnits = 0;

      (inv.items || []).forEach(item => {
        const qty = (item.qty || 1) * mult;
        invUnits += qty;

        // Match item with registered inventory to get authentic purchasePrice / cost
        const invItem = inventory.find(i => i.id === item.itemId || (i.name && item.name && i.name.toLowerCase() === item.name.toLowerCase()));
        
        let unitCost = 0;
        if (invItem && invItem.purchasePrice > 0) {
          unitCost = invItem.purchasePrice;
        } else if (item.rate > 0) {
          // Default estimated COGS ratio (65% if unit purchase price is unrecorded)
          unitCost = item.rate * 0.65;
        }

        const lineCogs = qty * unitCost;
        invCogs += lineCogs;

        // Track in customer item breakdown
        const existingItem = customerMap[custId].itemsList.find(it => it.name === item.name || (it.sku && it.sku === item.sku));
        const lineRev = (item.subtotal || (item.qty * item.rate) || 0) * mult;
        if (existingItem) {
          existingItem.qty += qty;
          existingItem.revenue += lineRev;
          existingItem.cogs += lineCogs;
          existingItem.profit += (lineRev - lineCogs);
        } else {
          customerMap[custId].itemsList.push({
            name: item.name || 'Unnamed Item',
            sku: item.sku || 'N/A',
            qty: qty,
            revenue: lineRev,
            cogs: lineCogs,
            profit: lineRev - lineCogs
          });
        }
      });

      customerMap[custId].grossRevenue += invRevenue;
      customerMap[custId].directCogs += invCogs;
      customerMap[custId].unitsPurchased += invUnits;

      if (isCreditNote) {
        customerMap[custId].creditNotesCount += 1;
      } else {
        customerMap[custId].invoicesCount += 1;
      }

      customerMap[custId].invoicesList.push({
        id: inv.id,
        docNumber: inv.docNumber || 'INV-TEMP',
        date: inv.date || '',
        amount: invRevenue,
        type: inv.type
      });

      totalPeriodGrossRevenue += invRevenue;
      totalPeriodUnitsSold += invUnits;
    });

    const totalCustomersCount = Object.keys(customerMap).length;

    // Second pass: Calculate Gross Profit, Margin %, Allocated OPEX, Net Profit, Net Margin %
    const list = Object.values(customerMap).map(cust => {
      const grossProfit = cust.grossRevenue - cust.directCogs;
      const grossMarginPct = cust.grossRevenue > 0 ? (grossProfit / cust.grossRevenue) * 100 : 0;

      // Allocate OPEX based on selected methodology
      let allocatedOpex = 0;
      if (totalPeriodOpex > 0) {
        if (opexAllocationMethod === 'revenue_share' && totalPeriodGrossRevenue > 0) {
          allocatedOpex = (Math.max(0, cust.grossRevenue) / totalPeriodGrossRevenue) * totalPeriodOpex;
        } else if (opexAllocationMethod === 'volume_share' && totalPeriodUnitsSold > 0) {
          allocatedOpex = (Math.max(0, cust.unitsPurchased) / totalPeriodUnitsSold) * totalPeriodOpex;
        } else if (opexAllocationMethod === 'equal' && totalCustomersCount > 0) {
          allocatedOpex = totalPeriodOpex / totalCustomersCount;
        }
      }

      const netProfit = grossProfit - allocatedOpex;
      const netMarginPct = cust.grossRevenue > 0 ? (netProfit / cust.grossRevenue) * 100 : 0;
      const aov = cust.invoicesCount > 0 ? cust.grossRevenue / cust.invoicesCount : cust.grossRevenue;

      return {
        ...cust,
        grossProfit,
        grossMarginPct,
        allocatedOpex,
        netProfit,
        netMarginPct,
        aov
      };
    });

    return list;
  }, [periodInvoices, customers, inventory, totalPeriodOpex, opexAllocationMethod]);

  // ==========================================
  // 2. PRODUCT PROFITABILITY COMPUTATIONS
  // ==========================================
  const productProfitabilityData = useMemo(() => {
    const productMap: Record<string, {
      productId: string;
      name: string;
      sku: string;
      category: string;
      stockOnHand: number;
      unitsSold: number;
      avgSellingPrice: number;
      avgUnitCost: number;
      grossRevenue: number;
      directCogs: number;
      grossProfit: number;
      grossMarginPct: number;
      allocatedOpex: number;
      netProfit: number;
      netMarginPct: number;
      marginContributionPct: number;
      ordersCount: number;
    }> = {};

    let totalPeriodGrossRevenue = 0;
    let totalPeriodUnitsSold = 0;
    let totalPeriodGrossProfit = 0;

    periodInvoices.forEach(inv => {
      const isCreditNote = inv.type === 'CreditNote';
      const mult = isCreditNote ? -1 : 1;

      (inv.items || []).forEach(item => {
        const key = item.itemId || item.sku || item.name || 'unnamed_item';
        const invItem = inventory.find(i => i.id === item.itemId || i.sku === item.sku || (i.name && item.name && i.name.toLowerCase() === item.name.toLowerCase()));
        
        const prodName = invItem?.name || item.name || 'Custom Line Item';
        const prodSku = invItem?.sku || item.sku || 'N/A';
        const prodCategory = invItem?.category || 'General';
        const stockOnHand = invItem?.stockQuantity || 0;

        let unitCost = 0;
        if (invItem && invItem.purchasePrice > 0) {
          unitCost = invItem.purchasePrice;
        } else if (item.rate > 0) {
          unitCost = item.rate * 0.65;
        }

        const qty = (item.qty || 1) * mult;
        const lineRevenue = (item.subtotal || (item.qty * item.rate) || 0) * mult;
        const lineCogs = qty * unitCost;

        if (!productMap[key]) {
          productMap[key] = {
            productId: key,
            name: prodName,
            sku: prodSku,
            category: prodCategory,
            stockOnHand: stockOnHand,
            unitsSold: 0,
            avgSellingPrice: 0,
            avgUnitCost: unitCost,
            grossRevenue: 0,
            directCogs: 0,
            grossProfit: 0,
            grossMarginPct: 0,
            allocatedOpex: 0,
            netProfit: 0,
            netMarginPct: 0,
            marginContributionPct: 0,
            ordersCount: 0
          };
        }

        productMap[key].unitsSold += qty;
        productMap[key].grossRevenue += lineRevenue;
        productMap[key].directCogs += lineCogs;
        productMap[key].ordersCount += 1;

        totalPeriodGrossRevenue += lineRevenue;
        totalPeriodUnitsSold += qty;
        totalPeriodGrossProfit += (lineRevenue - lineCogs);
      });
    });

    const totalProductsCount = Object.keys(productMap).length;

    const list = Object.values(productMap).map(prod => {
      const grossProfit = prod.grossRevenue - prod.directCogs;
      const grossMarginPct = prod.grossRevenue > 0 ? (grossProfit / prod.grossRevenue) * 100 : 0;
      const avgSellingPrice = prod.unitsSold > 0 ? prod.grossRevenue / prod.unitsSold : 0;

      // Allocate OPEX
      let allocatedOpex = 0;
      if (totalPeriodOpex > 0) {
        if (opexAllocationMethod === 'revenue_share' && totalPeriodGrossRevenue > 0) {
          allocatedOpex = (Math.max(0, prod.grossRevenue) / totalPeriodGrossRevenue) * totalPeriodOpex;
        } else if (opexAllocationMethod === 'volume_share' && totalPeriodUnitsSold > 0) {
          allocatedOpex = (Math.max(0, prod.unitsSold) / totalPeriodUnitsSold) * totalPeriodOpex;
        } else if (opexAllocationMethod === 'equal' && totalProductsCount > 0) {
          allocatedOpex = totalPeriodOpex / totalProductsCount;
        }
      }

      const netProfit = grossProfit - allocatedOpex;
      const netMarginPct = prod.grossRevenue > 0 ? (netProfit / prod.grossRevenue) * 100 : 0;
      const marginContributionPct = totalPeriodGrossProfit > 0 ? (grossProfit / totalPeriodGrossProfit) * 100 : 0;

      return {
        ...prod,
        avgSellingPrice,
        grossProfit,
        grossMarginPct,
        allocatedOpex,
        netProfit,
        netMarginPct,
        marginContributionPct
      };
    });

    return list;
  }, [periodInvoices, inventory, totalPeriodOpex, opexAllocationMethod]);

  // ==========================================
  // 3. OVERALL KPI METRICS
  // ==========================================
  const summaryKpis = useMemo(() => {
    const totalRevenue = customerProfitabilityData.reduce((sum, c) => sum + c.grossRevenue, 0);
    const totalCogs = customerProfitabilityData.reduce((sum, c) => sum + c.directCogs, 0);
    const totalGrossProfit = totalRevenue - totalCogs;
    const overallGrossMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;
    const totalNetProfit = totalGrossProfit - totalPeriodOpex;
    const overallNetMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;
    const totalUnitsSold = customerProfitabilityData.reduce((sum, c) => sum + c.unitsPurchased, 0);
    const totalInvoicesCount = customerProfitabilityData.reduce((sum, c) => sum + c.invoicesCount, 0);

    // Top performers
    const sortedByNetProfitCust = [...customerProfitabilityData].sort((a, b) => b.netProfit - a.netProfit);
    const topCustomer = sortedByNetProfitCust[0] || null;

    const sortedByGrossProfitProd = [...productProfitabilityData].sort((a, b) => b.grossProfit - a.grossProfit);
    const topProduct = sortedByGrossProfitProd[0] || null;

    const lowMarginCustomersCount = customerProfitabilityData.filter(c => c.grossMarginPct < 15 && c.grossRevenue > 0).length;
    const lowMarginProductsCount = productProfitabilityData.filter(p => p.grossMarginPct < 15 && p.grossRevenue > 0).length;

    return {
      totalRevenue,
      totalCogs,
      totalGrossProfit,
      overallGrossMargin,
      totalPeriodOpex,
      totalNetProfit,
      overallNetMargin,
      totalUnitsSold,
      totalInvoicesCount,
      topCustomer,
      topProduct,
      lowMarginCustomersCount,
      lowMarginProductsCount
    };
  }, [customerProfitabilityData, productProfitabilityData, totalPeriodOpex]);

  // Unique categories & emirates for filters
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    productProfitabilityData.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [productProfitabilityData]);

  const uniqueEmirates = useMemo(() => {
    const ems = new Set<string>();
    customerProfitabilityData.forEach(c => {
      if (c.emirate && c.emirate !== 'Unassigned') ems.add(c.emirate);
    });
    return Array.from(ems);
  }, [customerProfitabilityData]);

  // ==========================================
  // 4. FILTERED & SORTED DATA SETS
  // ==========================================
  const filteredCustomers = useMemo(() => {
    return customerProfitabilityData
      .filter(c => {
        // Search
        if (searchTerm) {
          const match = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.trn.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.emirate.toLowerCase().includes(searchTerm.toLowerCase());
          if (!match) return false;
        }
        // Emirate
        if (selectedEmirate !== 'ALL' && c.emirate !== selectedEmirate) {
          return false;
        }
        // Margin Tier
        if (marginTierFilter === 'high' && c.grossMarginPct < 30) return false;
        if (marginTierFilter === 'moderate' && (c.grossMarginPct < 15 || c.grossMarginPct >= 30)) return false;
        if (marginTierFilter === 'low' && (c.grossMarginPct < 0 || c.grossMarginPct >= 15)) return false;
        if (marginTierFilter === 'negative' && c.netProfit >= 0) return false;

        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortField as keyof typeof a];
        let valB: any = b[sortField as keyof typeof b];
        if (typeof valA === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortDirection === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
      });
  }, [customerProfitabilityData, searchTerm, selectedEmirate, marginTierFilter, sortField, sortDirection]);

  const filteredProducts = useMemo(() => {
    return productProfitabilityData
      .filter(p => {
        // Search
        if (searchTerm) {
          const match = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase());
          if (!match) return false;
        }
        // Category
        if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
          return false;
        }
        // Margin Tier
        if (marginTierFilter === 'high' && p.grossMarginPct < 30) return false;
        if (marginTierFilter === 'moderate' && (p.grossMarginPct < 15 || p.grossMarginPct >= 30)) return false;
        if (marginTierFilter === 'low' && (p.grossMarginPct < 0 || p.grossMarginPct >= 15)) return false;
        if (marginTierFilter === 'negative' && p.netProfit >= 0) return false;

        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortField as keyof typeof a];
        let valB: any = b[sortField as keyof typeof b];
        if (typeof valA === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortDirection === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
      });
  }, [productProfitabilityData, searchTerm, selectedCategory, marginTierFilter, sortField, sortDirection]);

  // Handle Sort Switch
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // CSV Export Utility
  const exportCsvData = (type: 'customer' | 'product' | 'full') => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let fileName = '';

    if (type === 'customer' || type === 'full') {
      headers = [
        'Customer Name',
        'TRN',
        'Emirate',
        'Orders Count',
        'Units Purchased',
        'Gross Revenue (AED)',
        'Direct COGS (AED)',
        'Gross Profit (AED)',
        'Gross Margin %',
        'Allocated OPEX (AED)',
        'Net Profit (AED)',
        'Net Margin %',
        'Average Order Value (AED)'
      ];
      rows = customerProfitabilityData.map(c => [
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.trn}"`,
        `"${c.emirate}"`,
        c.invoicesCount,
        c.unitsPurchased,
        c.grossRevenue.toFixed(2),
        c.directCogs.toFixed(2),
        c.grossProfit.toFixed(2),
        `${c.grossMarginPct.toFixed(2)}%`,
        c.allocatedOpex.toFixed(2),
        c.netProfit.toFixed(2),
        `${c.netMarginPct.toFixed(2)}%`,
        c.aov.toFixed(2)
      ]);
      fileName = `Customer_Profitability_Report_${startDate}_to_${endDate}.csv`;
    }

    if (type === 'product') {
      headers = [
        'SKU',
        'Product Name',
        'Category',
        'Stock on Hand',
        'Units Sold',
        'Avg Selling Price (AED)',
        'Avg Unit Cost (AED)',
        'Gross Revenue (AED)',
        'Direct COGS (AED)',
        'Gross Profit (AED)',
        'Gross Margin %',
        'Allocated OPEX (AED)',
        'Net Profit (AED)',
        'Net Margin %',
        'Margin Contribution %'
      ];
      rows = productProfitabilityData.map(p => [
        `"${p.sku}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category}"`,
        p.stockOnHand,
        p.unitsSold,
        p.avgSellingPrice.toFixed(2),
        p.avgUnitCost.toFixed(2),
        p.grossRevenue.toFixed(2),
        p.directCogs.toFixed(2),
        p.grossProfit.toFixed(2),
        `${p.grossMarginPct.toFixed(2)}%`,
        p.allocatedOpex.toFixed(2),
        p.netProfit.toFixed(2),
        `${p.netMarginPct.toFixed(2)}%`,
        `${p.marginContributionPct.toFixed(2)}%`
      ]);
      fileName = `Product_Profitability_Report_${startDate}_to_${endDate}.csv`;
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="profitability-report-container">
      {/* -------------------------------------------------------------
          HEADER & INTERACTIVE DATE FILTER BAR
          ------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 font-mono tracking-tight uppercase">
                  Comprehensive Profitability & Margin Analysis
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gross & Net Margins per Customer, Product SKU, and Period OPEX Allocation
                </p>
              </div>
            </div>
          </div>

          {/* Quick Date Presets & Export Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-mono">
              <button
                type="button"
                onClick={() => applyPreset('this_month')}
                className="px-2 py-1 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 font-bold transition-all cursor-pointer"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => applyPreset('this_quarter')}
                className="px-2 py-1 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 font-bold transition-all cursor-pointer"
              >
                This Qtr
              </button>
              <button
                type="button"
                onClick={() => applyPreset('ytd')}
                className="px-2 py-1 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 font-bold transition-all cursor-pointer"
              >
                YTD
              </button>
              <button
                type="button"
                onClick={() => applyPreset('all')}
                className="px-2 py-1 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 font-bold transition-all cursor-pointer"
              >
                All Time
              </button>
            </div>

            <button
              type="button"
              onClick={() => exportCsvData(activeTab === 'product' ? 'product' : 'customer')}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Download CSV Spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Date Inputs & Allocation Methodology Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
          <div className="md:col-span-3">
            <label className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => handleApplyDateRange(e.target.value, endDate)}
              className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => handleApplyDateRange(startDate, e.target.value)}
              className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1">
              OPEX Allocation Method
            </label>
            <select
              value={opexAllocationMethod}
              onChange={e => setOpexAllocationMethod(e.target.value as any)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-sans"
            >
              <option value="revenue_share">Revenue Share (Proportional %)</option>
              <option value="volume_share">Volume Share (Units Sold %)</option>
              <option value="equal">Equal Distribution per Entity</option>
            </select>
          </div>

          <div className="md:col-span-3 flex items-end">
            <div className="w-full p-2 bg-indigo-50/70 border border-indigo-100 rounded-lg text-[11px] text-indigo-900 flex items-center justify-between">
              <span className="font-medium">Total OPEX Incurred:</span>
              <span className="font-mono font-bold">{formatAED(summaryKpis.totalPeriodOpex)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          TOP-LEVEL METRIC KPI CARDS
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              Net Sales Revenue
            </span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900 font-mono mt-2">
            {formatAED(summaryKpis.totalRevenue)}
          </div>
          <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-slate-500">
            <span>{summaryKpis.totalInvoicesCount} invoices</span>
            <span>•</span>
            <span>{summaryKpis.totalUnitsSold.toLocaleString()} units</span>
          </div>
        </div>

        {/* Card 2: Direct COGS */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              Cost of Goods (COGS)
            </span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-rose-600 font-mono mt-2">
            {formatAED(summaryKpis.totalCogs)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Cost Ratio: <span className="font-mono font-bold text-slate-700">{summaryKpis.totalRevenue > 0 ? ((summaryKpis.totalCogs / summaryKpis.totalRevenue) * 100).toFixed(1) : '0.0'}%</span>
          </div>
        </div>

        {/* Card 3: Gross Profit & Margin */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              Gross Profit & Margin
            </span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-emerald-600 font-mono mt-2">
            {formatAED(summaryKpis.totalGrossProfit)}
          </div>
          <div className="flex items-center space-x-1.5 mt-1">
            <span className={`inline-block px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
              summaryKpis.overallGrossMargin >= 30 ? 'bg-emerald-100 text-emerald-800' :
              summaryKpis.overallGrossMargin >= 15 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {summaryKpis.overallGrossMargin.toFixed(1)}% Margin
            </span>
          </div>
        </div>

        {/* Card 4: Operating Expenses */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              Operating Overheads (OPEX)
            </span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-800 font-mono mt-2">
            {formatAED(summaryKpis.totalPeriodOpex)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            OPEX Ratio: <span className="font-mono font-bold text-slate-700">{summaryKpis.totalRevenue > 0 ? ((summaryKpis.totalPeriodOpex / summaryKpis.totalRevenue) * 100).toFixed(1) : '0.0'}%</span>
          </div>
        </div>

        {/* Card 5: Net Profit & Margin */}
        <div className={`border p-4 rounded-2xl shadow-xs ${
          summaryKpis.totalNetProfit >= 0 ? 'bg-indigo-50/40 border-indigo-200' : 'bg-rose-50/40 border-rose-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              Net Profit (Bottom Line)
            </span>
            <div className={`p-1.5 rounded-lg ${summaryKpis.totalNetProfit >= 0 ? 'bg-indigo-600 text-white' : 'bg-rose-600 text-white'}`}>
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl font-extrabold font-mono mt-2 ${summaryKpis.totalNetProfit >= 0 ? 'text-indigo-900' : 'text-rose-700'}`}>
            {formatAED(summaryKpis.totalNetProfit)}
          </div>
          <div className="flex items-center space-x-1.5 mt-1">
            <span className={`inline-block px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
              summaryKpis.overallNetMargin >= 20 ? 'bg-emerald-200 text-emerald-900' :
              summaryKpis.overallNetMargin >= 10 ? 'bg-indigo-200 text-indigo-900' :
              summaryKpis.overallNetMargin >= 0 ? 'bg-amber-200 text-amber-900' : 'bg-rose-200 text-rose-900'
            }`}>
              {summaryKpis.overallNetMargin.toFixed(1)}% Net Margin
            </span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          SUB-VIEW TAB SWITCHER & SEARCH / FILTER CONTROLS
          ------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl no-print overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                setActiveTab('customer');
                setSortField('netProfit');
                setSortDirection('desc');
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'customer' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Customer Profitability ({filteredCustomers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('product');
                setSortField('grossProfit');
                setSortDirection('desc');
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'product' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Product Profitability ({filteredProducts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'matrix' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Executive Margin Matrix</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reconciliation')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'reconciliation' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>P&L Margin Waterfall</span>
            </button>
          </div>

          {/* Quick Stat Pill */}
          <div className="hidden lg:flex items-center space-x-2 text-xs font-mono text-slate-500">
            <span>Period: <strong className="text-slate-800">{startDate}</strong> to <strong className="text-slate-800">{endDate}</strong></span>
          </div>
        </div>

        {/* Filters Bar (Applicable for Customer & Product views) */}
        {(activeTab === 'customer' || activeTab === 'product') && (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 no-print">
            {/* Search Input */}
            <div className="sm:col-span-5 relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={activeTab === 'customer' ? "Search customer name, TRN, emirate..." : "Search product SKU, item name, category..."}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Margin Tier Filter */}
            <div className="sm:col-span-4">
              <select
                value={marginTierFilter}
                onChange={e => setMarginTierFilter(e.target.value as any)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Margin Tiers (Full Portfolio)</option>
                <option value="high">High Margin (≥ 30% Gross)</option>
                <option value="moderate">Moderate Margin (15% - 29%)</option>
                <option value="low">Low Margin (0% - 14%)</option>
                <option value="negative">Loss Making (Negative Net Profit)</option>
              </select>
            </div>

            {/* Contextual Category/Emirate Filter */}
            <div className="sm:col-span-3">
              {activeTab === 'customer' ? (
                <select
                  value={selectedEmirate}
                  onChange={e => setSelectedEmirate(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Emirates</option>
                  {uniqueEmirates.map(em => (
                    <option key={em} value={em}>{em}</option>
                  ))}
                </select>
              ) : (
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Product Categories</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 1: CUSTOMER PROFITABILITY VIEW
            ------------------------------------------------------------- */}
        {activeTab === 'customer' && (
          <div className="space-y-4">
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-mono text-[10px] uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 cursor-pointer hover:text-indigo-600" onClick={() => handleSort('name')}>
                      Customer Account {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-3 text-center cursor-pointer hover:text-indigo-600" onClick={() => handleSort('invoicesCount')}>
                      Orders {sortField === 'invoicesCount' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-3 text-right cursor-pointer hover:text-indigo-600" onClick={() => handleSort('grossRevenue')}>
                      Gross Revenue {sortField === 'grossRevenue' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-3 text-right cursor-pointer hover:text-indigo-600" onClick={() => handleSort('directCogs')}>
                      Direct COGS {sortField === 'directCogs' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-3 text-right cursor-pointer hover:text-indigo-600" onClick={() => handleSort('grossProfit')}>
                      Gross Profit {sortField === 'grossProfit' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-3 text-right cursor-pointer hover:text-indigo-600" onClick={() => handleSort('grossMarginPct')}>
                      Gross Margin % {sortField === 'grossMarginPct' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-3 text-right cursor-pointer hover:text-indigo-600" onClick={() => handleSort('allocatedOpex')}>
                      Allocated OPEX {sortField === 'allocatedOpex' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-3 text-right cursor-pointer hover:text-indigo-600" onClick={() => handleSort('netProfit')}>
                      Net Profit (AED) {sortField === 'netProfit' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-3 text-right cursor-pointer hover:text-indigo-600" onClick={() => handleSort('netMarginPct')}>
                      Net Margin % {sortField === 'netMarginPct' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-3 text-center no-print">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400 font-sans">
                        No customer transactions recorded within the selected date range and filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map(cust => {
                      const isExpanded = expandedRowId === cust.customerId;
                      return (
                        <React.Fragment key={cust.customerId}>
                          <tr className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 font-sans">
                              <div className="font-bold text-slate-900">{cust.name}</div>
                              <div className="text-[10px] text-slate-400 flex items-center space-x-2 mt-0.5">
                                {cust.trn !== 'N/A' && <span>TRN: {cust.trn}</span>}
                                {cust.emirate && cust.emirate !== 'Unassigned' && (
                                  <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-600 font-mono">
                                    {cust.emirate}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-center text-slate-600">
                              <span className="font-bold text-slate-800">{cust.invoicesCount}</span>
                              {cust.creditNotesCount > 0 && (
                                <span className="text-[10px] text-rose-500 block">({cust.creditNotesCount} returns)</span>
                              )}
                            </td>
                            <td className="p-3 text-right font-bold text-slate-900">{formatAED(cust.grossRevenue)}</td>
                            <td className="p-3 text-right text-rose-600">{formatAED(cust.directCogs)}</td>
                            <td className="p-3 text-right text-emerald-600 font-bold">{formatAED(cust.grossProfit)}</td>
                            <td className="p-3 text-right">
                              <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                cust.grossMarginPct >= 30 ? 'bg-emerald-100 text-emerald-800' :
                                cust.grossMarginPct >= 15 ? 'bg-amber-100 text-amber-800' :
                                cust.grossMarginPct >= 0 ? 'bg-rose-100 text-rose-800' : 'bg-rose-200 text-rose-900 font-black'
                              }`}>
                                {cust.grossMarginPct.toFixed(1)}%
                              </span>
                            </td>
                            <td className="p-3 text-right text-slate-500">{formatAED(cust.allocatedOpex)}</td>
                            <td className={`p-3 text-right font-bold ${cust.netProfit >= 0 ? 'text-indigo-700' : 'text-rose-600'}`}>
                              {formatAED(cust.netProfit)}
                            </td>
                            <td className="p-3 text-right">
                              <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                cust.netMarginPct >= 20 ? 'bg-indigo-100 text-indigo-800' :
                                cust.netMarginPct >= 5 ? 'bg-emerald-50 text-emerald-700' :
                                cust.netMarginPct >= 0 ? 'bg-amber-50 text-amber-700' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {cust.netMarginPct.toFixed(1)}%
                              </span>
                            </td>
                            <td className="p-3 text-center no-print">
                              <button
                                type="button"
                                onClick={() => setExpandedRowId(isExpanded ? null : cust.customerId)}
                                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
                                title="View Customer Product Breakdown"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Itemized Breakdown for Customer */}
                          {isExpanded && (
                            <tr className="bg-slate-50/80">
                              <td colSpan={10} className="p-4">
                                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <span className="text-[11px] font-mono font-bold uppercase text-slate-500">
                                      Product Portfolio Purchased by {cust.name} ({cust.itemsList.length} unique items)
                                    </span>
                                    <span className="text-xs text-slate-400 font-mono">
                                      Average Order Value: <strong>{formatAED(cust.aov)}</strong>
                                    </span>
                                  </div>

                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-500 font-mono text-[9px] uppercase font-bold">
                                      <tr>
                                        <th className="p-2">Item Name</th>
                                        <th className="p-2 text-center">Qty Purchased</th>
                                        <th className="p-2 text-right">Revenue (AED)</th>
                                        <th className="p-2 text-right">COGS (AED)</th>
                                        <th className="p-2 text-right">Gross Profit (AED)</th>
                                        <th className="p-2 text-right">Gross Margin %</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                                      {cust.itemsList.map((item, idx) => {
                                        const itemMargin = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
                                        return (
                                          <tr key={idx} className="hover:bg-slate-50/50">
                                            <td className="p-2 font-sans font-medium">{item.name}</td>
                                            <td className="p-2 text-center">{item.qty}</td>
                                            <td className="p-2 text-right font-bold text-slate-900">{formatAED(item.revenue)}</td>
                                            <td className="p-2 text-right text-rose-600">{formatAED(item.cogs)}</td>
                                            <td className="p-2 text-right text-emerald-600 font-bold">{formatAED(item.profit)}</td>
                                            <td className="p-2 text-right">
                                              <span className={`inline-block px-1.5 py-0.2 rounded font-bold text-[9px] ${
                                                itemMargin >= 30 ? 'bg-emerald-100 text-emerald-800' :
                                                itemMargin >= 15 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                                              }`}>
                                                {itemMargin.toFixed(1)}%
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
                {filteredCustomers.length > 0 && (
                  <tfoot className="bg-slate-100/80 font-mono font-bold text-slate-900 border-t border-slate-200">
                    <tr>
                      <td className="p-3">Portfolio Total ({filteredCustomers.length} Accounts)</td>
                      <td className="p-3 text-center">{filteredCustomers.reduce((s, c) => s + c.invoicesCount, 0)}</td>
                      <td className="p-3 text-right">{formatAED(filteredCustomers.reduce((s, c) => s + c.grossRevenue, 0))}</td>
                      <td className="p-3 text-right text-rose-600">{formatAED(filteredCustomers.reduce((s, c) => s + c.directCogs, 0))}</td>
                      <td className="p-3 text-right text-emerald-600">{formatAED(filteredCustomers.reduce((s, c) => s + c.grossProfit, 0))}</td>
                      <td className="p-3 text-right">
                        {filteredCustomers.reduce((s, c) => s + c.grossRevenue, 0) > 0
                          ? ((filteredCustomers.reduce((s, c) => s + c.grossProfit, 0) / filteredCustomers.reduce((s, c) => s + c.grossRevenue, 0)) * 100).toFixed(1) + '%'
                          : '0.0%'}
                      </td>
                      <td className="p-3 text-right text-slate-600">{formatAED(filteredCustomers.reduce((s, c) => s + c.allocatedOpex, 0))}</td>
                      <td className="p-3 text-right text-indigo-700">{formatAED(filteredCustomers.reduce((s, c) => s + c.netProfit, 0))}</td>
                      <td className="p-3 text-right">
                        {filteredCustomers.reduce((s, c) => s + c.grossRevenue, 0) > 0
                          ? ((filteredCustomers.reduce((s, c) => s + c.netProfit, 0) / filteredCustomers.reduce((s, c) => s + c.grossRevenue, 0)) * 100).toFixed(1) + '%'
                          : '0.0%'}
                      </td>
                      <td className="p-3 text-center no-print"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 2: PRODUCT PROFITABILITY VIEW
            ------------------------------------------------------------- */}
        {activeTab === 'product' && (
          <div className="space-y-4">
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-mono text-[10px] uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 cursor-pointer hover:text-indigo-600" onClick={() => handleSort('sku')}>
                      SKU {sortField === 'sku' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-3 cursor-pointer hover:text-indigo-600" onClick={() => handleSort('name')}>
                      Product Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-3 text-center cursor-pointer hover:text-indigo-600" onClick={() => handleSort('unitsSold')}>
                      Units Sold {sortField === 'unitsSold' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-3 text-right cursor-pointer hover:text-indigo-600" onClick={() => handleSort('avgSellingPrice')}>
                      ASP (AED) {sortField === 'avgSellingPrice' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-3 text-right cursor-pointer hover:text-indigo-600" onClick={() => handleSort('avgUnitCost')}>
                      Unit Cost {sortField === 'avgUnitCost' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-3 text-right cursor-pointer hover:text-indigo-600" onClick={() => handleSort('grossRevenue')}>
                      Revenue {sortField === 'grossRevenue' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-3 text-right cursor-pointer hover:text-indigo-600" onClick={() => handleSort('directCogs')}>
                      COGS {sortField === 'directCogs' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-3 text-right cursor-pointer hover:text-indigo-600" onClick={() => handleSort('grossProfit')}>
                      Gross Profit {sortField === 'grossProfit' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-3 text-right cursor-pointer hover:text-indigo-600" onClick={() => handleSort('grossMarginPct')}>
                      Gross Margin % {sortField === 'grossMarginPct' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-3 text-right cursor-pointer hover:text-indigo-600" onClick={() => handleSort('netProfit')}>
                      Net Profit (AED) {sortField === 'netProfit' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-3 text-right cursor-pointer hover:text-indigo-600" onClick={() => handleSort('netMarginPct')}>
                      Net Margin % {sortField === 'netMarginPct' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="p-3 text-center">Performance Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-slate-400 font-sans">
                        No product sales recorded within the selected date range and filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(prod => {
                      // Determine performance quadrant tier
                      let tierLabel = 'Workhorse';
                      let tierBadgeClass = 'bg-blue-100 text-blue-800';
                      if (prod.grossMarginPct >= 35 && prod.unitsSold >= 10) {
                        tierLabel = '🌟 Star Item';
                        tierBadgeClass = 'bg-emerald-100 text-emerald-800';
                      } else if (prod.grossMarginPct >= 35) {
                        tierLabel = '💎 Niche High Yield';
                        tierBadgeClass = 'bg-indigo-100 text-indigo-800';
                      } else if (prod.grossMarginPct < 15 || prod.netProfit < 0) {
                        tierLabel = '⚠️ Review Pricing';
                        tierBadgeClass = 'bg-rose-100 text-rose-800';
                      }

                      return (
                        <tr key={prod.productId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-600">{prod.sku}</td>
                          <td className="p-3 font-sans">
                            <div className="font-bold text-slate-900">{prod.name}</div>
                            <div className="text-[10px] text-slate-400 flex items-center space-x-2 mt-0.5">
                              <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-600 font-mono">{prod.category}</span>
                              <span>Stock: {prod.stockOnHand}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center font-bold text-slate-800">{prod.unitsSold}</td>
                          <td className="p-3 text-right text-slate-700">{formatAED(prod.avgSellingPrice)}</td>
                          <td className="p-3 text-right text-rose-600">{formatAED(prod.avgUnitCost)}</td>
                          <td className="p-3 text-right font-bold text-slate-900">{formatAED(prod.grossRevenue)}</td>
                          <td className="p-3 text-right text-rose-600">{formatAED(prod.directCogs)}</td>
                          <td className="p-3 text-right text-emerald-600 font-bold">{formatAED(prod.grossProfit)}</td>
                          <td className="p-3 text-right">
                            <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              prod.grossMarginPct >= 30 ? 'bg-emerald-100 text-emerald-800' :
                              prod.grossMarginPct >= 15 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {prod.grossMarginPct.toFixed(1)}%
                            </span>
                          </td>
                          <td className={`p-3 text-right font-bold ${prod.netProfit >= 0 ? 'text-indigo-700' : 'text-rose-600'}`}>
                            {formatAED(prod.netProfit)}
                          </td>
                          <td className="p-3 text-right">
                            <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              prod.netMarginPct >= 20 ? 'bg-indigo-100 text-indigo-800' :
                              prod.netMarginPct >= 5 ? 'bg-emerald-50 text-emerald-700' :
                              prod.netMarginPct >= 0 ? 'bg-amber-50 text-amber-700' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {prod.netMarginPct.toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-md font-sans text-[10px] font-bold ${tierBadgeClass}`}>
                              {tierLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredProducts.length > 0 && (
                  <tfoot className="bg-slate-100/80 font-mono font-bold text-slate-900 border-t border-slate-200">
                    <tr>
                      <td colSpan={2} className="p-3">Portfolio Total ({filteredProducts.length} Products)</td>
                      <td className="p-3 text-center">{filteredProducts.reduce((s, p) => s + p.unitsSold, 0)}</td>
                      <td className="p-3 text-right">-</td>
                      <td className="p-3 text-right">-</td>
                      <td className="p-3 text-right">{formatAED(filteredProducts.reduce((s, p) => s + p.grossRevenue, 0))}</td>
                      <td className="p-3 text-right text-rose-600">{formatAED(filteredProducts.reduce((s, p) => s + p.directCogs, 0))}</td>
                      <td className="p-3 text-right text-emerald-600">{formatAED(filteredProducts.reduce((s, p) => s + p.grossProfit, 0))}</td>
                      <td className="p-3 text-right">
                        {filteredProducts.reduce((s, p) => s + p.grossRevenue, 0) > 0
                          ? ((filteredProducts.reduce((s, p) => s + p.grossProfit, 0) / filteredProducts.reduce((s, p) => s + p.grossRevenue, 0)) * 100).toFixed(1) + '%'
                          : '0.0%'}
                      </td>
                      <td className="p-3 text-right text-indigo-700">{formatAED(filteredProducts.reduce((s, p) => s + p.netProfit, 0))}</td>
                      <td className="p-3 text-right">
                        {filteredProducts.reduce((s, p) => s + p.grossRevenue, 0) > 0
                          ? ((filteredProducts.reduce((s, p) => s + p.netProfit, 0) / filteredProducts.reduce((s, p) => s + p.grossRevenue, 0)) * 100).toFixed(1) + '%'
                          : '0.0%'}
                      </td>
                      <td className="p-3 text-center">100.0%</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 3: EXECUTIVE MARGIN MATRIX & STRATEGIC INSIGHTS
            ------------------------------------------------------------- */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            {/* Quadrant Analysis Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quadrant 1: Stars */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🌟</span>
                    <h4 className="text-xs font-mono uppercase font-bold text-emerald-900">
                      Stars (High Margin & High Volume)
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                    Top Growth Engines
                  </span>
                </div>
                <p className="text-xs text-emerald-700">
                  Products delivering both superior gross margin (≥ 30%) and robust sales volume. Protect margins and prioritize inventory fulfillment.
                </p>
                <div className="space-y-1.5 pt-1">
                  {productProfitabilityData.filter(p => p.grossMarginPct >= 30 && p.unitsSold >= 5).slice(0, 4).map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-emerald-100 text-xs">
                      <span className="font-medium text-slate-800 truncate">{p.name}</span>
                      <span className="font-mono font-bold text-emerald-700">{p.grossMarginPct.toFixed(1)}% Margin ({formatAED(p.grossProfit)})</span>
                    </div>
                  ))}
                  {productProfitabilityData.filter(p => p.grossMarginPct >= 30 && p.unitsSold >= 5).length === 0 && (
                    <div className="text-[11px] text-slate-400 italic">No products currently qualify in this quadrant.</div>
                  )}
                </div>
              </div>

              {/* Quadrant 2: High Yield Niches */}
              <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">💎</span>
                    <h4 className="text-xs font-mono uppercase font-bold text-indigo-900">
                      Niches (High Margin & Low Volume)
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-md">
                    Scale Opportunities
                  </span>
                </div>
                <p className="text-xs text-indigo-700">
                  Lucrative margin products (≥ 30%) with untapped sales volume. Boost targeted promotions and bundle with workhorse offerings.
                </p>
                <div className="space-y-1.5 pt-1">
                  {productProfitabilityData.filter(p => p.grossMarginPct >= 30 && p.unitsSold < 5 && p.unitsSold > 0).slice(0, 4).map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-indigo-100 text-xs">
                      <span className="font-medium text-slate-800 truncate">{p.name}</span>
                      <span className="font-mono font-bold text-indigo-700">{p.grossMarginPct.toFixed(1)}% Margin ({p.unitsSold} sold)</span>
                    </div>
                  ))}
                  {productProfitabilityData.filter(p => p.grossMarginPct >= 30 && p.unitsSold < 5 && p.unitsSold > 0).length === 0 && (
                    <div className="text-[11px] text-slate-400 italic">No products currently qualify in this quadrant.</div>
                  )}
                </div>
              </div>

              {/* Quadrant 3: Volume Drivers / Workhorses */}
              <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🚜</span>
                    <h4 className="text-xs font-mono uppercase font-bold text-blue-900">
                      Workhorses (Moderate Margin & High Volume)
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md">
                    Cash Flow Anchors
                  </span>
                </div>
                <p className="text-xs text-blue-700">
                  Reliable cash flow generators with stable margins (15% - 29%). Negotiate bulk supplier discounts to convert into Stars.
                </p>
                <div className="space-y-1.5 pt-1">
                  {productProfitabilityData.filter(p => p.grossMarginPct >= 15 && p.grossMarginPct < 30 && p.unitsSold >= 5).slice(0, 4).map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-blue-100 text-xs">
                      <span className="font-medium text-slate-800 truncate">{p.name}</span>
                      <span className="font-mono font-bold text-blue-700">{formatAED(p.grossRevenue)} ({p.unitsSold} units)</span>
                    </div>
                  ))}
                  {productProfitabilityData.filter(p => p.grossMarginPct >= 15 && p.grossMarginPct < 30 && p.unitsSold >= 5).length === 0 && (
                    <div className="text-[11px] text-slate-400 italic">No products currently qualify in this quadrant.</div>
                  )}
                </div>
              </div>

              {/* Quadrant 4: Margin Drains / Review Needed */}
              <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">⚠️</span>
                    <h4 className="text-xs font-mono uppercase font-bold text-rose-900">
                      Underperformers (Low Margin & Negative Net)
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-md">
                    Action Required
                  </span>
                </div>
                <p className="text-xs text-rose-700">
                  Products and customers with gross margins &lt; 15% or generating negative net returns after OPEX allocation. Tighten discount policies immediately.
                </p>
                <div className="space-y-1.5 pt-1">
                  {productProfitabilityData.filter(p => p.grossMarginPct < 15 || p.netProfit < 0).slice(0, 4).map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-rose-100 text-xs">
                      <span className="font-medium text-slate-800 truncate">{p.name}</span>
                      <span className="font-mono font-bold text-rose-600">{p.grossMarginPct.toFixed(1)}% Margin ({formatAED(p.netProfit)})</span>
                    </div>
                  ))}
                  {productProfitabilityData.filter(p => p.grossMarginPct < 15 || p.netProfit < 0).length === 0 && (
                    <div className="text-[11px] text-emerald-600 italic">Excellent! No loss-making products found in this period.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Top 5 Value Creators vs Bottom Margin Drains */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs">
                <h4 className="text-xs font-mono uppercase font-bold text-slate-800 mb-3 flex items-center space-x-2">
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  <span>Top 5 Most Profitable Customers (Net Yield)</span>
                </h4>
                <div className="space-y-2">
                  {[...customerProfitabilityData].sort((a, b) => b.netProfit - a.netProfit).slice(0, 5).map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-mono font-bold text-[10px]">
                          {i + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">{c.name}</div>
                          <div className="text-[10px] text-slate-400">{c.invoicesCount} orders • {c.emirate}</div>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="font-bold text-emerald-600">{formatAED(c.netProfit)}</div>
                        <div className="text-[10px] text-slate-500">{c.netMarginPct.toFixed(1)}% Net</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs">
                <h4 className="text-xs font-mono uppercase font-bold text-slate-800 mb-3 flex items-center space-x-2">
                  <Package className="w-4 h-4 text-indigo-600" />
                  <span>Top 5 Highest Margin Products</span>
                </h4>
                <div className="space-y-2">
                  {[...productProfitabilityData].sort((a, b) => b.grossMarginPct - a.grossMarginPct).slice(0, 5).map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-mono font-bold text-[10px]">
                          {i + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-[10px] text-slate-400">{p.sku} • {p.category}</div>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="font-bold text-indigo-600">{p.grossMarginPct.toFixed(1)}%</div>
                        <div className="text-[10px] text-slate-500">{formatAED(p.grossProfit)} Profit</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 4: P&L MARGIN WATERFALL RECONCILIATION
            ------------------------------------------------------------- */}
        {activeTab === 'reconciliation' && (
          <div className="space-y-6">
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-extrabold font-mono uppercase tracking-wider text-white">
                    Reconciled Profitability Waterfall (Period P&L)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Step-by-step conversion of Top-Line Revenue to Bottom-Line Net Retained Margin
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block">Period Range</span>
                  <span className="text-xs text-indigo-400 font-bold">{startDate} ~ {endDate}</span>
                </div>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    <span className="text-slate-200">1. Gross Sales Revenue (Invoices subtotal)</span>
                  </div>
                  <span className="font-bold text-white text-sm">{formatAED(summaryKpis.totalRevenue)}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-800/80 text-rose-400">
                  <div className="flex items-center space-x-2 pl-4">
                    <span>(-) Direct Cost of Goods Sold (Inventory Purchase Cost)</span>
                  </div>
                  <span className="font-bold">- {formatAED(summaryKpis.totalCogs)}</span>
                </div>

                <div className="flex items-center justify-between py-2.5 bg-slate-800/50 px-3 rounded-xl border border-slate-700">
                  <div className="flex items-center space-x-2 font-bold text-emerald-400">
                    <span>(=) Total Gross Margin / Gross Profit</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-400 text-sm">{formatAED(summaryKpis.totalGrossProfit)}</span>
                    <span className="text-[10px] text-emerald-300 block font-normal">{summaryKpis.overallGrossMargin.toFixed(1)}% of Revenue</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-800/80 text-amber-400">
                  <div className="flex items-center space-x-2 pl-4">
                    <span>(-) Total Operating Expenses (OPEX: Rent, Salaries, Utilities, Marketing)</span>
                  </div>
                  <span className="font-bold">- {formatAED(summaryKpis.totalPeriodOpex)}</span>
                </div>

                <div className={`flex items-center justify-between py-3 px-4 rounded-xl border ${
                  summaryKpis.totalNetProfit >= 0 ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-200' : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
                }`}>
                  <div>
                    <span className="font-extrabold text-sm uppercase tracking-wider block">
                      (=) Reconciled Net Operating Profit
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Bottom line earnings retained prior to UAE Corporate Tax (9%)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`font-black text-lg ${summaryKpis.totalNetProfit >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                      {formatAED(summaryKpis.totalNetProfit)}
                    </span>
                    <span className="text-[10px] text-slate-300 block font-bold">
                      {summaryKpis.overallNetMargin.toFixed(1)}% Net Margin
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
