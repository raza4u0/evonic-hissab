import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  FileText, 
  Users, 
  Package, 
  BarChart2, 
  TrendingUp, 
  Settings, 
  Plus, 
  ArrowRight, 
  LayoutDashboard, 
  Percent, 
  CreditCard, 
  Sparkles, 
  Briefcase,
  ChevronRight,
  Sliders,
  Database,
  HelpCircle
} from 'lucide-react';
import { Customer, InventoryItem, SalesDocument, Company } from '../types';

interface CommandSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  setCurrentTab: (tab: string) => void;
  setSelectedReportId?: (id: string) => void;
  setActiveSettingsSubTab?: (subTab: string) => void;
  invoices: SalesDocument[];
  customers: Customer[];
  inventory: InventoryItem[];
  companies: Company[];
  activeCompany: Company;
  onOpenCreateInvoice?: () => void;
  onOpenCreateCustomer?: () => void;
  onOpenCreateProduct?: () => void;
}

interface SearchItem {
  id: string;
  category: 'Actions' | 'Navigation' | 'Tax Reports' | 'Invoices' | 'Customers' | 'Products';
  title: string;
  subtitle?: string;
  badge?: string;
  icon: React.ComponentType<any>;
  onSelect: () => void;
}

export default function CommandSearchModal({
  isOpen,
  onClose,
  setCurrentTab,
  setSelectedReportId,
  setActiveSettingsSubTab,
  invoices,
  customers,
  inventory,
  companies,
  activeCompany,
  onOpenCreateInvoice,
  onOpenCreateCustomer,
  onOpenCreateProduct
}: CommandSearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Build searchable index
  const allItems: SearchItem[] = [
    // Quick Actions
    {
      id: 'act_new_invoice',
      category: 'Actions',
      title: '+ Create Tax Invoice',
      subtitle: 'Draft a new FTA 5% compliant sales invoice',
      badge: 'Shortcut: Shift+N',
      icon: Plus,
      onSelect: () => {
        setCurrentTab('sales');
        if (onOpenCreateInvoice) onOpenCreateInvoice();
        onClose();
      }
    },
    {
      id: 'act_new_customer',
      category: 'Actions',
      title: '+ Add New Customer / Client',
      subtitle: 'Register customer with TRN & Emirate',
      icon: Users,
      onSelect: () => {
        setCurrentTab('customers');
        if (onOpenCreateCustomer) onOpenCreateCustomer();
        onClose();
      }
    },
    {
      id: 'act_new_product',
      category: 'Actions',
      title: '+ Add Inventory Product / Service',
      subtitle: 'Create stock item with SKU, cost & sale price',
      icon: Package,
      onSelect: () => {
        setCurrentTab('inventory');
        if (onOpenCreateProduct) onOpenCreateProduct();
        onClose();
      }
    },
    {
      id: 'act_custom_theme',
      category: 'Actions',
      title: 'Theme & Brand Customization',
      subtitle: 'Change accent colors, logo & UI styling',
      icon: Sliders,
      onSelect: () => {
        setCurrentTab('settings');
        if (setActiveSettingsSubTab) setActiveSettingsSubTab('theme');
        onClose();
      }
    },
    {
      id: 'act_open_help',
      category: 'Actions',
      title: 'Help Center & Keyboard Shortcuts Guide',
      subtitle: 'Documentation, FTA compliance rules & key combinations (Ctrl+H / F1)',
      badge: 'Shortcut: Ctrl+H',
      icon: HelpCircle,
      onSelect: () => {
        setCurrentTab('help');
        onClose();
      }
    },

    // Main Navigation
    {
      id: 'nav_dashboard',
      category: 'Navigation',
      title: 'Dashboard Overview',
      subtitle: 'Revenue metrics, VAT summary & active status',
      icon: LayoutDashboard,
      onSelect: () => {
        setCurrentTab('dashboard');
        onClose();
      }
    },
    {
      id: 'nav_sales',
      category: 'Navigation',
      title: 'Sales & Invoices Register',
      subtitle: 'Manage invoices, quotations & credit notes',
      icon: FileText,
      onSelect: () => {
        setCurrentTab('sales');
        onClose();
      }
    },
    {
      id: 'nav_customers',
      category: 'Navigation',
      title: 'Customers Directory',
      subtitle: 'View accounts, balances & statements',
      icon: Users,
      onSelect: () => {
        setCurrentTab('customers');
        onClose();
      }
    },
    {
      id: 'nav_inventory',
      category: 'Navigation',
      title: 'Products & Stock Control',
      subtitle: 'Physical stock levels, SKUs & reorder alerts',
      icon: Package,
      onSelect: () => {
        setCurrentTab('inventory');
        onClose();
      }
    },
    {
      id: 'nav_expenses',
      category: 'Navigation',
      title: 'Expenses & Supplier Bills',
      subtitle: 'Input VAT claims & vendor ledger',
      icon: CreditCard,
      onSelect: () => {
        setCurrentTab('expenses');
        onClose();
      }
    },
    {
      id: 'nav_pdc',
      category: 'Navigation',
      title: 'PDC Cheque Register',
      subtitle: 'Post-dated cheque tracking & clearance',
      icon: CreditCard,
      onSelect: () => {
        setCurrentTab('pdc');
        onClose();
      }
    },
    {
      id: 'nav_accounts',
      category: 'Navigation',
      title: 'Chart of Accounts & General Ledger',
      subtitle: 'Double-entry journals & COA tree',
      icon: Database,
      onSelect: () => {
        setCurrentTab('accounts');
        onClose();
      }
    },
    {
      id: 'nav_tax_reports',
      category: 'Navigation',
      title: 'FTA Tax & Compliance Center',
      subtitle: 'Form 201 VAT returns & corporate tax planner',
      icon: Percent,
      onSelect: () => {
        setCurrentTab('vat');
        if (setSelectedReportId) setSelectedReportId('vat_return');
        onClose();
      }
    },
    {
      id: 'nav_settings',
      category: 'Navigation',
      title: 'Company Settings & Preferences',
      subtitle: 'TRN configuration, staff roles & backups',
      icon: Settings,
      onSelect: () => {
        setCurrentTab('settings');
        onClose();
      }
    },

    // Tax Reports
    {
      id: 'rep_vat_return',
      category: 'Tax Reports',
      title: '1. VAT Return (FTA Form 201)',
      subtitle: 'Official UAE FTA VAT Return Box 1-14 breakdown',
      badge: 'FTA Priority',
      icon: Percent,
      onSelect: () => {
        setCurrentTab('vat');
        if (setSelectedReportId) setSelectedReportId('vat_return');
        onClose();
      }
    },
    {
      id: 'rep_emirate_sales',
      category: 'Tax Reports',
      title: '1A-1G. Emirate-Wise Sales & VAT (Box 1a-1g)',
      subtitle: 'Breakdown of sales per UAE Emirate of Supply',
      badge: 'FTA Form 201',
      icon: Percent,
      onSelect: () => {
        setCurrentTab('reports');
        if (setSelectedReportId) setSelectedReportId('emirate_sales_breakdown');
        onClose();
      }
    },
    {
      id: 'rep_customer_profit',
      category: 'Tax Reports',
      title: '20. Profitability Analysis (Customer & Product Margins)',
      subtitle: 'Gross and net margins per customer & product over custom date ranges',
      badge: 'Analysis',
      icon: TrendingUp,
      onSelect: () => {
        setCurrentTab('reports');
        if (setSelectedReportId) setSelectedReportId('customer_profitability');
        onClose();
      }
    },
    {
      id: 'rep_stock_valuation',
      category: 'Tax Reports',
      title: '21. Stock Valuation & Inventory Schedule',
      subtitle: 'Total asset cost, retail potential & stock units',
      badge: 'Inventory',
      icon: Package,
      onSelect: () => {
        setCurrentTab('reports');
        if (setSelectedReportId) setSelectedReportId('inventory_valuation');
        onClose();
      }
    },
    {
      id: 'rep_staff_commission',
      category: 'Tax Reports',
      title: '22. Staff Sales & Commission Performance',
      subtitle: 'Sales rep conversions, subtotal revenue & commissions',
      badge: 'Staff',
      icon: Users,
      onSelect: () => {
        setCurrentTab('reports');
        if (setSelectedReportId) setSelectedReportId('staff_commission');
        onClose();
      }
    },
    {
      id: 'rep_corp_tax',
      category: 'Tax Reports',
      title: '18. UAE Corporate Tax Planner (9%)',
      subtitle: 'AED 375,000 threshold calculator & net tax liability',
      badge: 'Corporate Tax',
      icon: Briefcase,
      onSelect: () => {
        setCurrentTab('reports');
        if (setSelectedReportId) setSelectedReportId('corporate_tax_planner');
        onClose();
      }
    },
    {
      id: 'rep_faf_export',
      category: 'Tax Reports',
      title: '17. FTA Audit File (FAF) CSV Export',
      subtitle: 'Generate FTA-compliant audit file export',
      badge: 'Audit File',
      icon: Sparkles,
      onSelect: () => {
        setCurrentTab('reports');
        if (setSelectedReportId) setSelectedReportId('faf_export');
        onClose();
      }
    },

    // Dynamic Invoices (Up to top 15)
    ...invoices.slice(0, 15).map(inv => {
      const custName = customers.find(c => c.id === inv.customerId)?.name || 'Walk-in Customer';
      return {
        id: `inv_${inv.id}`,
        category: 'Invoices' as const,
        title: `${inv.docNumber || 'INV-000'} — ${custName}`,
        subtitle: `Date: ${inv.date} | Total: AED ${(inv.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} | Status: ${inv.status || 'Paid'}`,
        badge: inv.type === 'CreditNote' ? 'Credit Note' : 'Tax Invoice',
        icon: FileText,
        onSelect: () => {
          setCurrentTab('sales');
          onClose();
        }
      };
    }),

    // Dynamic Customers (Up to top 15)
    ...customers.slice(0, 15).map(cust => ({
      id: `cust_${cust.id}`,
      category: 'Customers' as const,
      title: cust.name,
      subtitle: `${cust.emirate || 'Dubai'} | TRN: ${cust.trn || 'N/A'} | Phone: ${cust.phone || 'N/A'}`,
      badge: cust.companyName ? 'Company' : 'Individual',
      icon: Users,
      onSelect: () => {
        setCurrentTab('customers');
        onClose();
      }
    })),

    // Dynamic Inventory (Up to top 15)
    ...inventory.slice(0, 15).map(item => ({
      id: `item_${item.id}`,
      category: 'Products' as const,
      title: `${item.name} ${item.sku ? `(SKU: ${item.sku})` : ''}`,
      subtitle: `Stock: ${item.stockQuantity || 0} | Cost: AED ${(item.purchasePrice || 0).toFixed(2)} | Price: AED ${(item.salePrice || 0).toFixed(2)}`,
      badge: item.category || 'Product',
      icon: Package,
      onSelect: () => {
        setCurrentTab('inventory');
        onClose();
      }
    }))
  ];

  // Filter items
  const filteredItems = allItems.filter(item => {
    if (activeCategoryFilter !== 'all' && item.category !== activeCategoryFilter) return false;
    if (!query.trim()) return true;

    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      (item.badge && item.badge.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].onSelect();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
      <div 
        className="bg-white dark:bg-[#0f172a] w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh] transition-all"
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-3 bg-slate-50/50 dark:bg-slate-900/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, customer, invoice #, product SKU, or report name..."
            className="w-full bg-transparent border-none text-slate-900 dark:text-slate-100 font-sans text-sm focus:outline-none focus:ring-0 placeholder:text-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-200/70 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Category Filters */}
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] flex items-center space-x-1.5 overflow-x-auto text-xs scrollbar-none">
          {['all', 'Actions', 'Navigation', 'Tax Reports', 'Invoices', 'Customers', 'Products'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategoryFilter(cat);
                setSelectedIndex(0);
              }}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer capitalize whitespace-nowrap ${
                activeCategoryFilter === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat === 'all' ? 'All Results' : cat}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar max-h-[420px]">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No matching results found</p>
              <p className="text-xs mt-1">Try searching for "VAT", "Invoice", "Customer", "Emirate", or "Stock"</p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 shadow-sm'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-950 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'}`}>
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 ml-2">
                    <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase hidden sm:inline">
                      {item.category}
                    </span>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-300 dark:text-slate-600'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Command Bar Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-bold">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-bold">↓</kbd>
              <span className="ml-1">Navigate</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-bold">↵</kbd>
              <span className="ml-1">Select</span>
            </span>
          </div>
          <div className="flex items-center space-x-1 font-bold text-indigo-600 dark:text-indigo-400">
            <span>Hisaab Pro Command Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}
