import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Plus, 
  Package, 
  Layers, 
  Briefcase, 
  Truck, 
  ShoppingCart, 
  Wallet, 
  Box, 
  TrendingUp,
  Activity, 
  CreditCard, 
  Percent, 
  FileCheck, 
  BarChart2, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  Sparkles,
  HelpCircle,
  Calendar,
  Keyboard,
  UserCheck,
  Scale,
  Lock,
  RefreshCw,
  Printer,
  Wrench,
  Monitor
} from 'lucide-react';
import { Company } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  companies: Company[];
  activeCompanyId: string;
  setActiveCompanyId: (id: string) => void;
  isPaidPlan: boolean;
  setIsPaidPlan: (paid: boolean) => void;
  onOpenCreateCompany: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  selectedReportId?: string;
  setSelectedReportId?: (id: string) => void;
  onOpenShortcutsHelp?: () => void;
  activeSidebarItemId?: string;
  setActiveSidebarItemId?: (id: string) => void;
  activeSettingsSubTab?: string;
  activePlan?: 'trial' | 'pro_1y' | 'pro_3y' | 'pro_5y' | 'pro_lifetime' | 'basic';
  trialDaysLeft?: number;
  onOpenPricingModal?: () => void;
  lowStockCount?: number;
  pdcDueCount?: number;
  onNavigate?: () => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  companies,
  activeCompanyId,
  setActiveCompanyId,
  isPaidPlan,
  setIsPaidPlan,
  onOpenCreateCompany,
  isSidebarOpen = true,
  onToggleSidebar,
  selectedReportId = 'vat_return',
  setSelectedReportId,
  onOpenShortcutsHelp,
  activeSidebarItemId = 'dashboard',
  setActiveSidebarItemId,
  activeSettingsSubTab,
  activePlan = 'trial',
  trialDaysLeft = 84,
  onOpenPricingModal,
  lowStockCount = 0,
  pdcDueCount = 0,
  onNavigate
}: SidebarProps) {
  
  // High-fidelity shortlisted and customizable sidebar layout
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('hisaab_sidebar_collapsed');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [showMoreFinance, setShowMoreFinance] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(() => {
    try {
      return localStorage.getItem('hisaab_sidebar_compact') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => {
      const next = { ...prev, [title]: !prev[title] };
      try {
        localStorage.setItem('hisaab_sidebar_collapsed', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const toggleCompactMode = () => {
    setIsCompactMode(prev => {
      const next = !prev;
      try {
        localStorage.setItem('hisaab_sidebar_compact', String(next));
      } catch {}
      return next;
    });
  };

  const sections = [
    {
      title: 'SALES',
      key: 'sales',
      items: [
        { id: 'sales_pos', name: '⚡ Fast Thermal POS', icon: Printer, tab: 'pos' },
        { id: 'sales_invoices', name: 'Invoices', icon: FileText, tab: 'sales' },
        { id: 'sales_credit_note', name: '+ Credit Note', icon: Plus, tab: 'sales' },
        { id: 'sales_quotations', name: 'Quotations', icon: FileCheck, tab: 'sales' },
        { id: 'sales_recurring', name: 'Recurring Billing', icon: Calendar, tab: 'recurring' },
        { id: 'sales_clients', name: 'Customers / Clients', icon: Users, tab: 'customers' },
      ]
    },
    {
      title: 'INVENTORY',
      key: 'inventory',
      items: [
        { id: 'inv_computer_it', name: 'Computer, IT & Printers', icon: Monitor, tab: 'inventory' },
        { id: 'inv_spare_parts', name: 'Auto & Bike Spare Parts', icon: Wrench, tab: 'inventory' },
        { id: 'inv_stock', name: 'Products & Stock', icon: Package, tab: 'inventory' },
        { id: 'inv_category', name: 'Category & Others', icon: Layers, tab: 'inventory' },
        { id: 'inv_services', name: 'Services List', icon: Briefcase, tab: 'inventory' },
        { id: 'inv_barcodes', name: 'Barcode & Thermal Labels', icon: Printer, tab: 'inventory' },
        { id: 'inv_branches', name: 'Multi-Branch & Locations', icon: Layers, tab: 'inventory' },
        { id: 'inv_add', name: '+ Add Product', icon: Plus, tab: 'inventory', action: 'add' },
      ]
    },
    {
      title: 'PURCHASES & SUPPLIERS',
      key: 'purchases',
      items: [
        { id: 'pur_manage', name: 'Purchase Bills', icon: ShoppingCart, tab: 'expenses' },
        { id: 'pur_add', name: '+ Add a Purchase Bill', icon: Plus, tab: 'expenses' },
        { id: 'pur_po', name: 'Purchase Orders (Purchase & Pre-Procurement)', icon: FileCheck, tab: 'expenses' },
        { id: 'pur_grn', name: 'Goods Received (GRN)', icon: Box, tab: 'expenses' },
        { id: 'sup_list', name: 'Suppliers Directory', icon: Truck, tab: 'expenses' },
        { id: 'sup_add', name: '+ Add Supplier', icon: Plus, tab: 'expenses' },
      ]
    },
    {
      title: 'FINANCE & REPORTS',
      key: 'finance',
      items: [
        { id: 'fin_statement', name: 'Statement', icon: FileText, tab: 'reports', reportId: 'customer_statement' },
        { id: 'fin_balance', name: 'Balance Sheet', icon: BarChart2, tab: 'reports', reportId: 'trial_balance' },
        { id: 'fin_reports_daily', name: 'Daily & Weekly Reports', icon: Activity, tab: 'reports', reportId: 'daily_executive_pulse' },
        { id: 'fin_reports_monthly', name: 'Monthly Reports', icon: TrendingUp, tab: 'reports', reportId: 'monthly_revenue_matrix' },
        { id: 'fin_tax', name: 'VAT & Tax Compliance', icon: Percent, tab: 'vat', reportId: 'vat_return', isSubTool: true },
        { id: 'fin_ledger', name: 'Accounts & Ledger', icon: Scale, tab: 'accounts', isSubTool: true },
        { id: 'fin_account', name: 'Bank & Cash Accounts', icon: Wallet, tab: 'treasury', isSubTool: true },
        { id: 'fin_reports', name: 'All 70+ Reports Hub', icon: Layers, tab: 'reports', isSubTool: true },
        { id: 'fin_pdc', name: 'PDC Cheque Hub', icon: CreditCard, tab: 'pdc', isSubTool: true },
        { id: 'fin_bank_rec', name: 'Bank Reconciliation', icon: RefreshCw, tab: 'bank_rec', isSubTool: true },
        { id: 'fin_assets', name: 'Fixed Asset Register', icon: Box, tab: 'assets', isSubTool: true },
        { id: 'fin_reports_tally', name: 'MIS & Ratio Analysis', icon: BarChart2, tab: 'reports', reportId: 'tally_ratio_analysis', isSubTool: true },
      ]
    },
    {
      title: 'HR & STAFF',
      key: 'staff',
      items: [
        { id: 'staff_directory', name: 'Staff Directory', icon: UserCheck, tab: 'staff' },
      ]
    }
  ];

  const activeCompany = companies.find(c => c.id === activeCompanyId);
  const isStaffEnabled = activeCompany?.staffEnabled ?? true;
  const isInventoryEnabled = activeCompany?.inventoryEnabled ?? false;
  const isVatEnabled = activeCompany?.vatEnabled ?? true;
  const isMultiBranchEnabled = activeCompany?.multiBranchEnabled ?? false;
  const isErpEnabled = activeCompany?.erpEnabled ?? true;
  const isPosEnabled = activeCompany?.posEnabled ?? false;
  const compIndustry = activeCompany?.industry || '';
  const isComputerIndustry = compIndustry === 'ComputerSalesAndService' || compIndustry === 'Computer & IT' || compIndustry.toLowerCase().includes('computer') || compIndustry.toLowerCase().includes('printer');
  const isSparePartsIndustry = ['AutoSpareParts', 'CarSpareParts', 'BikeSpareParts', 'Auto Repair'].includes(compIndustry) || compIndustry.toLowerCase().includes('spare') || compIndustry.toLowerCase().includes('auto') || compIndustry.toLowerCase().includes('bike');

  const filteredSections = sections.map(sec => ({
    ...sec,
    items: sec.items.filter(item => {
      if (!isPosEnabled && item.id === 'sales_pos') {
        return false;
      }
      if (!isVatEnabled && (item.id === 'fin_tax' || item.tab === 'vat' || (item as any).reportId === 'vat_return')) {
        return false;
      }
      if (!isMultiBranchEnabled && item.id === 'inv_branches') {
        return false;
      }
      if (!isComputerIndustry && item.id === 'inv_computer_it') {
        return false;
      }
      if (!isSparePartsIndustry && item.id === 'inv_spare_parts') {
        return false;
      }
      if (item.id === 'inv_list') {
        return false;
      }
      if (!isErpEnabled && (item.id === 'fin_ledger' || item.id === 'fin_bank_rec' || item.id === 'fin_pdc' || item.id === 'fin_assets' || item.id === 'fin_account' || item.id === 'fin_reports_tally')) {
        return false;
      }
      return true;
    })
  })).filter(sec => {
    if (sec.title === 'HR & STAFF') {
      return isStaffEnabled;
    }
    if (sec.title === 'INVENTORY') {
      return isInventoryEnabled;
    }
    return sec.items.length > 0;
  });

  const handleItemClick = (item: any) => {
    if (activePlan === 'basic' && (item.tab === 'vat' || item.id === 'fin_tax')) {
      alert('❌ LOCKED ON BASIC: VAT & Corporate Tax Compliance reports are Pro-only features. Upgrade to evonix Hissab Pro to automate FTA audits and VAT returns!');
      onOpenPricingModal?.();
      return;
    }
    setCurrentTab(item.tab);
    if (setActiveSidebarItemId) {
      setActiveSidebarItemId(item.id);
    }
    if (item.reportId && setSelectedReportId) {
      setSelectedReportId(item.reportId);
    }
    onNavigate?.();
  };

  return (
    <aside className={`${isCompactMode ? 'w-56' : 'w-64'} bg-white dark:bg-[#0c111d] text-slate-750 dark:text-slate-300 flex flex-col h-full border-r border-slate-200 dark:border-slate-800 shrink-0 no-print font-sans animate-slide-in-left transition-all duration-200`}>
      
      {/* Top Sidebar Action Toolbar */}
      <div className="px-3 pt-2.5 pb-1 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
        <span className="text-[9.5px] font-mono uppercase tracking-widest text-slate-400 font-bold">
          Navigation
        </span>
        <button
          type="button"
          onClick={toggleCompactMode}
          title={isCompactMode ? 'Switch to Standard Spacious Sidebar' : 'Switch to Compact Shortlisted Sidebar'}
          className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors flex items-center space-x-1 cursor-pointer"
        >
          <span>{isCompactMode ? 'Standard' : 'Compact'}</span>
        </button>
      </div>

      {/* Scrollable Navigation Menu */}
      <nav className={`flex-1 ${isCompactMode ? 'py-1.5 px-2 space-y-0.5' : 'py-2.5 px-3 space-y-1'} overflow-y-auto select-none custom-scrollbar`}>
        
        {/* Main Dashboard Link */}
        <button
          onClick={() => {
            setCurrentTab('dashboard');
            if (setActiveSidebarItemId) {
              setActiveSidebarItemId('dashboard');
            }
            onNavigate?.();
          }}
          className={`w-full flex items-center space-x-3 px-3 ${isCompactMode ? 'py-1.5 text-[11px]' : 'py-2 text-xs'} rounded-lg font-semibold transition-all duration-150 cursor-pointer ${
            currentTab === 'dashboard' && activeSidebarItemId === 'dashboard'
              ? 'bg-[#eff6ff] dark:bg-indigo-950/40 text-blue-600 dark:text-indigo-400'
              : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          <LayoutDashboard className={`w-4 h-4 ${currentTab === 'dashboard' && activeSidebarItemId === 'dashboard' ? 'text-blue-500' : 'text-slate-400'}`} />
          <span>Dashboard</span>
        </button>

        {/* Dynamic Categorized Sections */}
        {filteredSections.map((sec, sIdx) => {
          const isCollapsed = !!collapsedSections[sec.title];
          const visibleItems = sec.items.filter(item => {
            if (sec.title === 'FINANCE & REPORTS' && (item as any).isSubTool && !showMoreFinance) {
              return false;
            }
            return true;
          });

          return (
            <div key={sec.title} className={isCompactMode ? 'pt-1' : 'pt-2'}>
              <button
                type="button"
                onClick={() => toggleSection(sec.title)}
                className="w-full flex items-center justify-between px-2.5 py-1 text-left rounded hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer group"
              >
                <span className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                  {sec.title}
                </span>
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                )}
              </button>

              {!isCollapsed && (
                <div className={`space-y-0.5 ${isCompactMode ? 'mt-0.5 pl-0.5' : 'mt-1 pl-1'}`}>
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    
                    // Determine if this item corresponds to the currently active screen
                    let isItemActive = false;
                    if (item.tab === currentTab) {
                      if (currentTab === 'sales') {
                        if (['sales_invoices', 'sales_credit_note', 'sales_quotations'].includes(activeSidebarItemId)) {
                          isItemActive = item.id === activeSidebarItemId;
                        } else {
                          isItemActive = item.id === 'sales_invoices';
                        }
                      } else if (currentTab === 'inventory') {
                        if (['inv_stock', 'inv_category', 'inv_services', 'inv_list'].includes(activeSidebarItemId)) {
                          isItemActive = item.id === activeSidebarItemId;
                        } else {
                          isItemActive = item.id === 'inv_stock';
                        }
                      } else if (currentTab === 'expenses') {
                        if (['pur_manage', 'pur_add', 'pur_credit_note', 'sup_list', 'sup_add', 'pur_po', 'pur_grn'].includes(activeSidebarItemId)) {
                          isItemActive = item.id === activeSidebarItemId;
                        } else {
                          isItemActive = item.id === 'pur_manage';
                        }
                      } else if (currentTab === 'reports') {
                        const itemReportId = (item as any).reportId;
                        if (itemReportId) {
                          isItemActive = selectedReportId === itemReportId;
                        } else {
                          isItemActive = !selectedReportId || !['customer_statement', 'trial_balance', 'daily_executive_pulse', 'monthly_revenue_matrix'].includes(selectedReportId);
                        }
                      } else if (currentTab === 'dashboard') {
                        if (['dashboard', 'fin_account', 'fin_assets'].includes(activeSidebarItemId)) {
                          isItemActive = item.id === activeSidebarItemId;
                        } else {
                          isItemActive = item.id === 'dashboard';
                        }
                      } else {
                        isItemActive = true;
                      }
                    }

                    const isLocked = activePlan === 'basic' && (item.tab === 'vat' || item.id === 'fin_tax');
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className={`w-full flex items-center justify-between px-2.5 ${isCompactMode ? 'py-1 text-[11px]' : 'py-1.5 text-xs'} rounded-lg font-medium transition-all duration-150 cursor-pointer ${
                          isLocked ? 'opacity-85 hover:bg-amber-50/10' : ''
                        } ${
                          isItemActive
                            ? 'bg-[#eff6ff] dark:bg-indigo-950/40 text-blue-600 dark:text-indigo-400 font-semibold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                        title={isLocked ? 'VAT & Tax compliance reports are locked on Hisaab Basic' : ''}
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <Icon className={`w-4 h-4 shrink-0 ${isItemActive ? 'text-blue-500' : 'text-slate-400'}`} />
                          <span className="truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center space-x-1 shrink-0">
                          {item.id === 'inv_stock' && lowStockCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-mono font-bold text-[8.5px] border border-rose-500/30">
                              {lowStockCount} Low
                            </span>
                          )}
                          {item.id === 'fin_pdc' && pdcDueCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono font-bold text-[8.5px] border border-amber-500/30">
                              {pdcDueCount} Due
                            </span>
                          )}
                          {isLocked && (
                            <Lock className="w-3 h-3 text-amber-500 shrink-0 animate-pulse" />
                          )}
                        </div>
                      </button>
                    );
                  })}

                  {/* Sub-tools expander for Finance */}
                  {sec.title === 'FINANCE & REPORTS' && (
                    <button
                      type="button"
                      onClick={() => setShowMoreFinance(!showMoreFinance)}
                      className="w-full text-left px-2.5 py-1 text-[9.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center justify-between cursor-pointer rounded hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-colors"
                    >
                      <span>{showMoreFinance ? '▲ Less Finance Tools' : '▼ More Tools (PDC, Bank Rec, Assets...)'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Corporate Profile / Settings */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 space-y-1">
          <button
            onClick={() => setCurrentTab('settings')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
              currentTab === 'settings'
                ? 'bg-[#eff6ff] dark:bg-indigo-950/40 text-blue-600 dark:text-indigo-400 font-bold'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Settings className={`w-4 h-4 ${currentTab === 'settings' ? 'text-blue-500' : 'text-slate-400'}`} />
            <span>Corporate Settings</span>
          </button>
        </div>

      </nav>

      {/* Creative Dynamic Plan Indicator (Footing) */}
      <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shrink-0 select-none">
        {activePlan === 'trial' && (
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full tracking-wide">
                90 Days Free Trial
              </span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse shrink-0" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-extrabold text-[#0F172A] dark:text-slate-200">
                {trialDaysLeft} Days Remaining
              </p>
              <p className="text-[9.5px] text-slate-500 dark:text-slate-400">
                Full Pro Features Active (AED 0.00)
              </p>
            </div>
            <button
              onClick={() => onOpenPricingModal?.()}
              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[9.5px] uppercase tracking-wider transition-colors cursor-pointer text-center"
            >
              Upgrade / View Plans
            </button>
          </div>
        )}

        {activePlan === 'basic' && (
          <div className="bg-amber-50/70 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/40 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full">
                evonix Hissab Basic (Free)
              </span>
              <Lock className="w-3 h-3 text-amber-500 shrink-0" />
            </div>
            <div className="space-y-1 font-sans text-[9.5px] leading-relaxed text-slate-600 dark:text-slate-400">
              <div className="flex justify-between font-medium">
                <span>Active Entity Limit:</span>
                <span className="font-bold text-slate-900 dark:text-slate-200">1 Company</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Sales Invoices:</span>
                <span className="font-bold text-amber-600">25 / Month</span>
              </div>
              <p className="text-[9px] text-slate-400 italic">Blocked: AI, Barcode, Tax, Themes</p>
            </div>
            <button
              onClick={() => onOpenPricingModal?.()}
              className="w-full py-1.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-extrabold rounded-lg text-[10px] uppercase tracking-wider transition-colors cursor-pointer text-center animate-pulse"
            >
              ⚡ Upgrade to Pro
            </button>
          </div>
        )}

        {activePlan === 'pro_1y' && (
          <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-150 dark:border-emerald-900/40 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full tracking-wide">
                Pro - 1 Year Active
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-extrabold text-[#0F172A] dark:text-slate-200">
                Unlimited Pro License
              </p>
              <p className="text-[9.5px] text-emerald-600 font-semibold font-mono">
                AED 499.00 / per Country
              </p>
            </div>
            <button
              onClick={() => onOpenPricingModal?.()}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-slate-100 font-bold rounded-lg text-[9.5px] uppercase tracking-wider transition-colors cursor-pointer text-center"
            >
              Subscription Billing
            </button>
          </div>
        )}

        {activePlan === 'pro_3y' && (
          <div className="bg-indigo-50/60 dark:bg-indigo-950/10 border border-indigo-150 dark:border-indigo-900/40 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full tracking-wide">
                Pro - 3 Years Active
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-extrabold text-[#0F172A] dark:text-slate-200">
                Standard Business Core
              </p>
              <p className="text-[9.5px] text-indigo-600 font-bold font-mono">
                AED 1,199.00 / per Country
              </p>
            </div>
            <button
              onClick={() => onOpenPricingModal?.()}
              className="w-full py-1.5 bg-indigo-950 dark:bg-indigo-900 text-indigo-100 font-bold rounded-lg text-[9.5px] uppercase tracking-wider transition-colors cursor-pointer text-center"
            >
              Subscription Billing
            </button>
          </div>
        )}

        {(activePlan === 'pro_lifetime' || activePlan === 'pro_5y') && (
          <div className="bg-rose-50/60 dark:bg-rose-950/10 border border-rose-150 dark:border-rose-900/40 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-bold px-2 py-0.5 rounded-full tracking-wide">
                Pro - Lifetime Active
              </span>
              <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse shrink-0" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-extrabold text-[#0F172A] dark:text-slate-200">
                Lifetime Enterprise
              </p>
              <p className="text-[9.5px] text-rose-600 font-extrabold font-mono">
                AED 1,999.00 / One-Time
              </p>
            </div>
            <button
              onClick={() => onOpenPricingModal?.()}
              className="w-full py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg text-[9.5px] uppercase tracking-wider transition-colors cursor-pointer text-center animate-pulse"
            >
              VIP Account Hub
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
