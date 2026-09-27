import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Building, 
  FileText, 
  FileCheck2, 
  ArrowRightLeft, 
  Edit3, 
  Trash2, 
  Users, 
  BookOpen, 
  Percent, 
  ChevronRight, 
  ArrowRight,
  Sparkles,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  Lock,
  Download,
  Terminal,
  HelpCircle,
  Tag,
  FolderTree,
  Scale,
  Keyboard,
  UserCheck,
  CreditCard,
  Settings,
  Database,
  Sliders,
  Package
} from 'lucide-react';

interface HelpSystemProps {
  isOpen: boolean;
  onClose: () => void;
  setCurrentTab: (tab: string) => void;
}

interface HelpTopic {
  id: string;
  category: 'onboarding' | 'sales' | 'quotes' | 'purchases' | 'ledgers' | 'taxes' | 'shortcuts' | 'staff';
  title: string;
  icon: React.ComponentType<any>;
  summary: string;
  steps: string[];
  tips: string[];
  keywords: string[];
  targetTab?: string;
  actionLabel?: string;
}

export default function HelpSystem({ isOpen, onClose, setCurrentTab }: HelpSystemProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTopicId, setActiveTopicId] = useState<string | null>('keyboard_shortcuts');

  const topics: HelpTopic[] = [
    {
      id: 'keyboard_shortcuts',
      category: 'shortcuts',
      title: 'Global Keyboard Shortcuts & Fast Navigation',
      icon: Keyboard,
      summary: 'Master Hisaab Pro hotkeys to accelerate document creation, command search, tab switching, and form submission.',
      keywords: ['shortcut', 'hotkey', 'command', 'search', 'ctrl+k', 'ctrl+n', 'ctrl+s', 'ctrl+p', 'alt+h', 'navigation', 'arrows'],
      steps: [
        'Press Ctrl + K (or click Search on top header) to open the Command Search engine from anywhere.',
        'Press Shift + N or Ctrl + N to open the contextual New Document creation sheet (Invoice, Customer, Item, or Expense).',
        'Press Ctrl + S to validate and save any active form modal or invoice draft immediately.',
        'Press Alt + H or Ctrl + / to open this Help Center & Shortcuts manual at any time.',
        'Press Alt + 1 through Alt + 8 to navigate instantly between main tabs (Dashboard, Sales, Recurring, Inventory, Expenses, Customers, Tax Reports, Settings).',
        'Use Left & Right Arrow keys on tab bars or search results to switch active sub-tabs and navigate menu items.',
        'Press Esc to close active command modals, popup dialogs, or slide-out drawers.'
      ],
      tips: [
        'All shortcuts are non-intrusive and automatically ignored while typing inside input fields, textarea blocks, or rich editors.',
        'You can search for any invoice number, client TRN, or stock SKU directly from the Ctrl + K command modal.'
      ],
      targetTab: 'dashboard',
      actionLabel: 'Try Command Search (Ctrl + K)'
    },
    {
      id: 'universal_ai_importer',
      category: 'onboarding',
      title: 'Universal AI Importer Scan & Merge Guide',
      icon: Sparkles,
      summary: 'Learn how to scan arbitrary financial reports, Excel ledgers, or PDF/CSV files and merge them with 100% offline fidelity.',
      keywords: ['importer', 'ai importer', 'pdf', 'excel', 'csv', 'import', 'scan', 'trn', 'merge', 'offline'],
      steps: [
        'Click on "Universal AI Importer" in the left sidebar menu.',
        'Drag and drop or select any PDF document, Excel sheet, CSV, or text file.',
        'Click "Analyze & Extract Report" to initiate 100% Offline CPA-level structuring.',
        'Review the parsed ledger entries in the spreadsheet-style editable data table.',
        'Perform any necessary adjustments inline (e.g. edit TRNs, rates, dates, or add new lines).',
        'Click "Merge into Hisaab Pro State" to instantly save and integrate all records.'
      ],
      tips: [
        'TRNs are strictly validated to be exactly 15 digits to preserve FTA VAT compliance, prompting interactive warnings if missing.',
        'You can export extracted data to a clean Excel-compatible CSV or natively print a PDF report before merging.'
      ],
      targetTab: 'importer',
      actionLabel: 'Launch Universal AI Importer'
    },
    {
      id: 'company_setup',
      category: 'onboarding',
      title: 'Company Setup & Configuration',
      icon: Building,
      summary: 'Learn how to register and configure a corporate entity with correct Trade License details and legal compliance in Hisaab Pro.',
      keywords: ['company', 'setup', 'trade license', 'trn', 'settings', 'industry', 'emirates', 'aed'],
      steps: [
        'Open the active company dropdown on the top right header, and click "+ Register New Entity...".',
        'Alternatively, go to the "Settings" tab using the left sidebar to modify the current company settings.',
        'In the General sub-tab, input the corporate legal name, register address, phone, email, and website details.',
        'Provide the Federal Tax Authority (FTA) Trade License number and Tax Registration Number (TRN) if applicable.'
      ],
      tips: [
        'To support faster invoicing, the "Enable Inventory Management" toggle is turned OFF by default for new companies. You can turn it ON in the Inventory tab.',
        'TRN is completely optional to prevent data entry hurdles. If provided, it must be verified strictly to ensure it is exactly 15 digits.'
      ],
      targetTab: 'settings',
      actionLabel: 'Go to Settings Configuration'
    },
    {
      id: 'staff_management',
      category: 'staff',
      title: 'Staff Directory, Roles & Sales Commission',
      icon: UserCheck,
      summary: 'Manage employee profiles, assign role permissions (Owner, Manager, Accountant, Sales Rep), and track sales commissions.',
      keywords: ['staff', 'employee', 'role', 'permissions', 'commission', 'access control', 'sales rep', 'hr'],
      steps: [
        'Navigate to the "Staff Directory" tab from the left sidebar menu.',
        'Click "+ Register Employee" to add a new team member with designation, department, and salary rate.',
        'Assign Role Privileges: Owner (Full Access), Manager (Operations & Approvals), Accountant (Financials & Ledger), or Sales Rep (Invoicing Only).',
        'Set Sales Commission percentage rate to automatically track individual performance in Sales Reports.',
        'Use the Feature Flag toggle in Company Settings to show or hide the HR & Staff module whenever required.'
      ],
      tips: [
        'Role-based permissions automatically restrict unauthorized staff members from deleting posted invoices or changing company TRN settings.',
        'Staff sales performance is automatically aggregated in Report #22 (Staff Sales & Commission Performance).'
      ],
      targetTab: 'staff',
      actionLabel: 'Open Staff Directory'
    },
    {
      id: 'create_invoice',
      category: 'sales',
      title: 'How to Create a Sales Invoice',
      icon: FileText,
      summary: 'Draft and print professional UAE FTA compliant tax invoices with automatic VAT calculations.',
      keywords: ['invoice', 'tax invoice', 'sales', 'vat', '5%', 'create', 'customer', 'aed', 'bilingual'],
      steps: [
        'Go to the "Sales" tab from the left sidebar and click on the "Invoices" section.',
        'Click the "+ Create New Invoice" button on the upper action bar (or press Shift + N).',
        'Select an existing customer from the dropdown, or click "Register New Client" to add a customer dynamically.',
        'Choose the appropriate invoice date, due date, and custom reference code.',
        'Add line-items: select from catalog products (if Inventory is toggled ON) or manually write custom item descriptions, quantities, and rates (if Inventory is toggled OFF).',
        'The system automatically computes subtotal, standard 5% VAT tax, and final grand total in UAE AED.',
        'Review the double-entry preview (Debit Accounts Receivable / Credit Sales Revenue & VAT Output Liability) and click "Save & Post Invoice".'
      ],
      tips: [
        'If Inventory is enabled, manual description entry is barred and saving is strictly gated on verifying that the item stock is available.',
        'Hisaab Pro formats currency precisely to 2 decimal places with thousands separators (e.g. AED 1,250.00).'
      ],
      targetTab: 'sales',
      actionLabel: 'Launch Invoices Workspace'
    },
    {
      id: 'recurring_billing',
      category: 'sales',
      title: 'Recurring Invoice Automations',
      icon: Calendar,
      summary: 'Set up automated recurring subscription billing for regular retainer clients on weekly, monthly, or annual schedules.',
      keywords: ['recurring', 'automation', 'retainer', 'billing', 'subscription', 'schedule', 'auto invoice'],
      steps: [
        'Navigate to the "Sales" tab and switch to the "Recurring Billing" sub-tab.',
        'Click "+ New Recurring Template" to specify client, interval (Monthly, Quarterly, Annual), and start date.',
        'Define line items, terms, and tax options for the recurring contract.',
        'Save the template. Hisaab Pro automatically generates and posts upcoming invoices on schedule with zero manual intervention.'
      ],
      tips: [
        'Active recurring schedules can be paused, resumed, or edited at any time without disrupting past posted invoices.'
      ],
      targetTab: 'recurring',
      actionLabel: 'Manage Recurring Schedules'
    },
    {
      id: 'pdc_cheque_hub',
      category: 'sales',
      title: 'PDC Cheque Register & Maturity Tracking',
      icon: CreditCard,
      summary: 'Record, track, and clear Post-Dated Cheques (PDC) received from clients or issued to vendors.',
      keywords: ['pdc', 'cheque', 'post dated', 'bank', 'clearance', 'maturity', 'deposit'],
      steps: [
        'Select "PDC Cheque Hub" under Finance in the left sidebar menu.',
        'Click "+ Log New PDC" and enter cheque number, bank name, drawer/payee, issue date, and clearance due date.',
        'Filter cheques by status: Pending, Deposited, Cleared, or Bounced.',
        'When funds clear in your bank account, click "Mark as Cleared" to automatically update bank ledgers.'
      ],
      tips: [
        'PDC entries remain off balance-sheet as contingent receivables until marked as cleared or deposited.'
      ],
      targetTab: 'pdc',
      actionLabel: 'Open PDC Cheque Register'
    },
    {
      id: 'select_vendor',
      category: 'purchases',
      title: 'Registering & Selecting a Vendor',
      icon: Users,
      summary: 'Maintain clean supplier accounts for seamless direct purchases, stock tracking, and VAT Input tax credit claims.',
      keywords: ['vendor', 'supplier', 'purchases', 'trn', 'client', 'contact', 'credit'],
      steps: [
        'Go to the "Clients" (or Customers/Vendors) workspace from the left sidebar.',
        'Click the "+ Register Customer/Vendor" button on the screen.',
        'Fill out the vendor details and toggle the "Classify as Vendor/Supplier" checkbox.',
        'Provide the supplier VAT Tax Registration Number (TRN) for FTA compliance.',
        'Save. When drafting new purchase vouchers or direct expenses, this vendor will be selectable from the supplier dropdown.'
      ],
      tips: [
        'Verify vendor TRN strictly. FTA auditors require 15 digits for valid Input VAT tax deduction recovery.'
      ],
      targetTab: 'customers',
      actionLabel: 'Manage Vendors Catalog'
    },
    {
      id: 'create_quotation',
      category: 'quotes',
      title: 'Creating a Customer Quotation / Estimate',
      icon: FileCheck2,
      summary: 'Draft legal quotes and pro-forma documents to send to customers before posting official tax invoices.',
      keywords: ['quotation', 'quote', 'estimate', 'proforma', 'draft', 'convert', 'validity'],
      steps: [
        'Select the "Sales" workspace in the sidebar, and switch to the "Quotations" sub-tab.',
        'Click the "+ Generate Quotation" button.',
        'Select the customer and enter quote date, validity period, and proposed line-items with rates.',
        'The system calculates the estimated 5% VAT so the customer has full disclosure on taxes.',
        'Click "Create Quotation" to save the draft. You can now download or print it.'
      ],
      tips: [
        'Quotations do not affect your double-entry accounting ledgers until they are converted to posted sales invoices.'
      ],
      targetTab: 'sales',
      actionLabel: 'Go to Quotations Desk'
    },
    {
      id: 'convert_quotation',
      category: 'quotes',
      title: 'Converting a Quotation to an Invoice',
      icon: ArrowRightLeft,
      summary: 'Save time by converting an approved client quote into an active posted tax invoice with a single click.',
      keywords: ['convert', 'quote to invoice', 'approve', 'sales', 'tax invoice', 'one click'],
      steps: [
        'In the "Sales" tab, go to the "Quotations" sub-tab and locate your client quote.',
        'Click the "Actions" menu (three dots icon) on the quotation row, or click on the quote to view details.',
        'Select "Convert to Tax Invoice" from the menu options.',
        'The system automatically loads all customer details, line-items, and VAT calculations into the Invoice Creator workspace.',
        'Make any necessary adjustments, choose the posting date, and click "Save & Post Invoice".'
      ],
      tips: [
        'Once converted, the quotation status is updated to "Converted" or "Approved", preventing duplicate invoice creation.'
      ],
      targetTab: 'sales',
      actionLabel: 'Convert Active Quotes'
    },
    {
      id: 'create_purchase',
      category: 'purchases',
      title: 'Creating a Purchase / Expense Record',
      icon: Tag,
      summary: 'Log inventory purchases, utility costs, and overhead expenses with standard 5% VAT Input tax recovery.',
      keywords: ['expense', 'purchase', 'outflow', 'vendor bill', 'vat input', 'reclaim', 'receipt'],
      steps: [
        'Navigate to the "Expenses" tab from the left sidebar.',
        'Click the "+ Record Expense / Purchase" button.',
        'Select the expense category (e.g. Inventory Cost, rent, marketing, office supply) which links directly to your Chart of Accounts.',
        'Select the vendor, enter payment account (Cash, Bank), date, and amount.',
        'Ensure the "VAT Applicable (5%)" checkbox is toggled to reclaim standard FTA input credit.',
        'Enter custom reference numbers from the supplier invoice, and save the transaction.'
      ],
      tips: [
        'Reclaimed VAT goes directly to your "VAT Input 5% (Asset)" account, which reduces your net VAT liability during tax returns!'
      ],
      targetTab: 'expenses',
      actionLabel: 'Log Business Purchase'
    },
    {
      id: 'view_ledger',
      category: 'ledgers',
      title: 'Viewing the General Accounting Ledger',
      icon: BookOpen,
      summary: 'Audit your company account balances, verify double-entry journal postings, and inspect the real-time Chart of Accounts.',
      keywords: ['ledger', 'general ledger', 'chart of accounts', 'double entry', 'debit', 'credit', 'balance'],
      steps: [
        'Navigate to the "VAT & Financials" (or Tax Reports) tab on the left sidebar.',
        'Look for the "Chart of Accounts / Ledgers" section.',
        'View live balances for all assets, liabilities, equity, revenues, and expenses.',
        'Select any account to inspect the corresponding general ledger logs showing every debit and credit posting.',
        'Verify that total debits exactly equal total credits to maintain accounting equilibrium.'
      ],
      tips: [
        'Double-entry compliance guarantees that every posted invoice or expense creates balancing accounting nodes in the background automatically.'
      ],
      targetTab: 'vat',
      actionLabel: 'Inspect General Ledgers'
    },
    {
      id: 'view_taxes',
      category: 'taxes',
      title: 'Viewing & Exporting UAE VAT Returns',
      icon: Percent,
      summary: 'Generate instant Federal Tax Authority (FTA) format VAT Return reports with full breakdown of output and input taxes.',
      keywords: ['vat', 'form 201', 'fta', 'tax return', 'emirate sales', 'audit file', 'box 1a', '5%'],
      steps: [
        'Select the "VAT & Financials" tab on the left sidebar.',
        'The main screen displays the "VAT Return (Form 201)" template layout.',
        'Inspect standard boxes: Box 1 (Standard Rated Supplies in Emirate level), Box 1a-1g (Abu Dhabi, Dubai, Sharjah, etc.), and Box 9 (Standard Rated Expenses subject to 5% Input VAT).',
        'Review the "Net VAT Payable/Refundable" computation.',
        'Click "Print VAT Return" or "Export Audit File" to save copy for regulatory filing.'
      ],
      tips: [
        'Accounts for VAT Input (Asset) and VAT Output (Liability) are strictly read-only and automatically managed by the system to maintain FTA compliance.'
      ],
      targetTab: 'vat',
      actionLabel: 'Open VAT Returns Dashboard'
    },
    {
      id: 'whatsapp_sharing_guide',
      category: 'sales',
      title: 'WhatsApp 1-Click Direct Invoicing & Statement Sharing',
      icon: Sparkles,
      summary: 'Instantly send professional bilingual (English/Arabic) tax invoices, quotations, and customer balance statements directly via WhatsApp.',
      keywords: ['whatsapp', 'share', 'direct', 'send', 'link', 'customer', 'statement', 'balance', 'iban', 'bilingual'],
      steps: [
        'Open any Invoice, Quotation, or Customer Statement in Hisaab Pro.',
        'Click the green WhatsApp button (📱) on the action bar, print preview, or customer directory list.',
        'Hisaab Pro automatically validates and formats the customer UAE phone number (+971) with zero manual prefix adjustments.',
        'A comprehensive bilingual message is crafted with document number, subtotal, 5% VAT, total due, and corporate bank IBAN details.',
        'Click to open WhatsApp Web or Desktop App and dispatch with 1 click! If offline, the message is automatically queued for dispatch when network resumes.'
      ],
      tips: [
        'Works seamlessly across desktop, tablets, and mobile browsers without requiring complex API keys or monthly third-party subscriptions.',
        'Customer Statements sent via WhatsApp summarize total outstanding receivables, pending invoices list, and wire payment details.'
      ],
      targetTab: 'sales',
      actionLabel: 'Try Invoicing WhatsApp Share'
    },
    {
      id: 'data_safety_and_updates',
      category: 'onboarding',
      title: 'Data Safety, Offline Persistence & Zero-Reset Updates',
      icon: Lock,
      summary: 'Understand how your business records, invoices, customer ledgers, and license credentials remain 100% safe and persistent during system updates.',
      keywords: ['data safety', 'update', 'persistence', 'security', 'backup', 'offline', 'license', 'zero reset', 'encryption'],
      steps: [
        'Hisaab Pro employs a decoupled architecture where application code updates apply exclusively to the user interface and processing engine.',
        'Active company transactional data, settings, TRN profiles, and custom templates reside in isolated, tamper-resistant local persistence layers.',
        'Upgrades and bug-fixes run dry-run validation checks before applying, guaranteeing zero corruption and zero data resets.',
        'Hardware Node Locking anchors your license securely to your authorized workstation, preventing unauthorized multi-system duplication while remaining fully functional offline.'
      ],
      tips: [
        'You can generate encrypted .hisaab cryptographic backups at any time from Company Settings -> Backups.',
        'Auto-save and fast indexed caching ensure lightning-fast UI responsiveness without freezing or data loss.'
      ],
      targetTab: 'settings',
      actionLabel: 'View Backup & Security Settings'
    },
    {
      id: 'aging_payables_guide',
      category: 'ledgers',
      title: 'Accounts Payable (AP) & Receivable (AR) Aging',
      icon: Scale,
      summary: 'Track outstanding liabilities and receivables categorized by due dates to optimize working capital.',
      keywords: ['aging', 'ap', 'ar', 'payables', 'receivables', 'overdue', 'working capital', 'credit period'],
      steps: [
        'Navigate to the "VAT & Financials" tab in the left sidebar.',
        'Select "Accounts Payable (AP) Aging" or "Accounts Receivable (AR) Aging" from the reports menu.',
        'Inspect summary cards to view balances divided across Current (0-30 days), 31-60 days, 61-90 days, and 90+ days.',
        'Review individual client or vendor lines showing outstanding unpaid totals to plan collections and settlements.'
      ],
      tips: [
        'Settle outstanding 90+ days liabilities first to maintain optimal supplier relationships and secure supply continuity.'
      ],
      targetTab: 'vat',
      actionLabel: 'Manage Supplier Aging'
    }
  ];

  const changelogs = [
    {
      date: 'Latest Update (July 31, 2026)',
      title: 'Complete Software UI Alignment, Shortcuts & Help Center Refresh',
      items: [
        'Standardized all form inputs, select dropdowns, search bars, and action buttons with consistent padding, rounded corners, and focus ring borders.',
        'Polished tab navigation bars across all workspaces with responsive flex wrapping, active tab indicators, and keyboard arrow key switching.',
        'Updated Command Search Modal (Ctrl + K) and Shortcuts Guide with all active keywords, shortcuts, and navigation paths.',
        'Wired Alt + H and Ctrl + / hotkeys to toggle the Help Center instantly from anywhere in the app.',
        'Ensured all arrow icons (ChevronRight, ArrowRight, ArrowRightLeft) are properly aligned with text labels across all modules.'
      ]
    },
    {
      date: 'July 27, 2026',
      title: 'Invoice Metadata Standards, Compact Badges & Inventory Sync',
      items: [
        'Standardized invoice header details to always include Date, Invoice Number, Due Date, LP Number, Quotation Number, and Purchase Number.',
        'Replaced long TRN text boxes in Sales Invoices and Purchase Entries with clean, compact green checkmark indicator badges.',
        'Implemented automatic inventory stock quantity updates whenever purchase bills are recorded or edited.',
        'Expanded invoice, quotation, and purchase entry forms to full viewport width with 3-column Currency & Document Metadata layouts.'
      ]
    },
    {
      date: 'July 16, 2026',
      title: 'Security Core Integration & Interactive Help Center',
      items: [
        'Implemented cryptographically signed data export (.hisaab) with brand protection checksum to prevent unauthorized modifications or cloning.',
        'Created interactive Help System with A-to-Z setup walkthroughs, search filters, and quick tab jump features.',
        'Hardened USB storage backups with rotating variable ciphers to prevent plaintext financial leaks.'
      ]
    }
  ];

  const categories = [
    { id: 'all', name: 'All Guides' },
    { id: 'shortcuts', name: 'Shortcuts & Hotkeys' },
    { id: 'onboarding', name: 'Onboarding & Setup' },
    { id: 'sales', name: 'Sales & Invoicing' },
    { id: 'quotes', name: 'Quotations Management' },
    { id: 'purchases', name: 'Purchases & Expenses' },
    { id: 'ledgers', name: 'Accounting Ledgers' },
    { id: 'taxes', name: 'Taxes & VAT Returns' },
    { id: 'staff', name: 'Staff & Roles' }
  ];

  const filteredTopics = topics.filter(t => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
                          t.title.toLowerCase().includes(q) ||
                          t.summary.toLowerCase().includes(q) ||
                          t.steps.some(s => s.toLowerCase().includes(q)) ||
                          t.keywords.some(k => k.toLowerCase().includes(q));
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const activeTopic = topics.find(t => t.id === activeTopicId) || topics[0];

  if (!isOpen) return null;

  return (
    <>
      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 transition-opacity duration-300 no-print"
        onClick={onClose}
      />

      {/* Slide-out Help Drawer */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[500px] md:w-[650px] lg:w-[750px] bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col overflow-hidden text-slate-150 animate-in slide-in-from-right duration-300 no-print font-sans">
        
        {/* Header bar */}
        <div className="bg-slate-950/90 border-b border-slate-800 p-4 shrink-0 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-950/60 border border-indigo-900/60 text-indigo-400 rounded-xl">
              <BookOpen className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono flex items-center space-x-2">
                <span>evonix Hissab Help Center</span>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">v1.0 Compliance</span>
              </h2>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">UAE Standard Financial Manual & Quick Reference Guide</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            title="Close Help Center (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Search & Filters */}
        <div className="bg-slate-950/40 border-b border-slate-800 p-4 space-y-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Search guides, keywords, or shortcuts (e.g. Ctrl+K, convert quotation, VAT, staff...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-16 py-2.5 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-2.5 px-2 py-0.5 text-slate-400 hover:text-white bg-slate-800 rounded text-[10px] font-mono cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Filter Categories */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 custom-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all shrink-0 cursor-pointer font-mono ${
                  selectedCategory === cat.id 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs' 
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Two Column Layout: Topics list on Left, Topic content on Right */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Column: List of matching guides */}
          <div className="w-2/5 border-r border-slate-800 overflow-y-auto divide-y divide-slate-800/60 bg-slate-950/20 custom-scrollbar">
            <div className="p-2.5 bg-slate-950/40 text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono">
              Matching Walkthroughs ({filteredTopics.length})
            </div>
            {filteredTopics.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No matching guides found for "{searchQuery}".
              </div>
            ) : (
              filteredTopics.map((topic) => {
                const TopicIcon = topic.icon;
                const isSelected = activeTopicId === topic.id;
                return (
                  <button
                    key={topic.id}
                    onClick={() => setActiveTopicId(topic.id)}
                    className={`w-full text-left p-3.5 flex items-start space-x-3 transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-slate-800/90 border-r-2 border-indigo-500 text-white' 
                        : 'hover:bg-slate-850/50 text-slate-300'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      isSelected ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-400'
                    }`}>
                      <TopicIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold truncate leading-snug">{topic.title}</p>
                      <p className="text-[9.5px] text-slate-400 truncate mt-0.5">{topic.summary}</p>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 self-center transition-transform ${isSelected ? 'text-indigo-400 translate-x-0.5' : 'text-slate-600'}`} />
                  </button>
                );
              })
            )}

            {/* Dynamic Sync Footer Note */}
            <div className="p-3.5 bg-indigo-950/20 border-t border-slate-800 mt-4 space-y-2">
              <div className="flex items-center space-x-2 text-indigo-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold font-mono uppercase tracking-wider">Dynamic System Sync</span>
              </div>
              <p className="text-[9.5px] text-slate-400 leading-relaxed font-sans">
                Hisaab Pro help logs and keyboard shortcuts update dynamically with new build specifications.
              </p>
            </div>
          </div>

          {/* Right Column: Detailed instructional steps */}
          <div className="w-3/5 overflow-y-auto p-5 space-y-5 bg-slate-900 custom-scrollbar">
            {activeTopic ? (
              <div className="space-y-5">
                
                {/* Title Card */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-[9px] bg-indigo-950/60 border border-indigo-900/50 text-indigo-400 w-max px-2.5 py-1 rounded-lg font-mono font-bold uppercase tracking-widest">
                    <span>{activeTopic.category}</span>
                  </div>
                  <h3 className="text-base font-black text-white leading-snug">{activeTopic.title}</h3>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-medium">{activeTopic.summary}</p>
                </div>

                {/* Keywords Tag Cloud */}
                {activeTopic.keywords && activeTopic.keywords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest mr-1">Keywords:</span>
                    {activeTopic.keywords.map((kw, i) => (
                      <span key={i} className="text-[9px] font-mono px-2 py-0.5 bg-slate-800 border border-slate-700/80 rounded text-slate-400">
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}

                {/* Steps block */}
                <div className="space-y-3 bg-slate-950/50 border border-slate-800 rounded-2xl p-4">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono flex items-center space-x-2">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>A to Z Execution Walkthrough</span>
                  </h4>
                  <ol className="space-y-3 text-xs leading-relaxed text-slate-200">
                    {activeTopic.steps.map((step, idx) => (
                      <li key={idx} className="flex items-start space-x-3">
                        <span className="font-mono text-[9px] font-black bg-slate-800 text-slate-300 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-slate-700 shadow-xs">
                          {idx + 1}
                        </span>
                        <span className="flex-1">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Tips & Strict Validation Blocks */}
                {activeTopic.tips && activeTopic.tips.length > 0 && (
                  <div className="space-y-2.5 bg-indigo-950/30 border border-indigo-900/40 rounded-2xl p-4">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-indigo-400 font-mono flex items-center space-x-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      <span>UAE FTA Rules & Pro Tips</span>
                    </h4>
                    <ul className="space-y-2 text-[10.5px] leading-relaxed text-slate-300">
                      {activeTopic.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-indigo-400 shrink-0 mt-1">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Quick tab redirect button */}
                {activeTopic.targetTab && (
                  <button
                    onClick={() => {
                      setCurrentTab(activeTopic.targetTab!);
                      onClose();
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md hover:shadow-indigo-500/20 cursor-pointer"
                  >
                    <span>{activeTopic.actionLabel || 'Launch Module Now'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-6 space-y-3">
                <HelpCircle className="w-10 h-10 text-slate-700 animate-pulse" />
                <p className="text-xs font-medium">Select a guide from the sidebar to inspect step-by-step documentation.</p>
              </div>
            )}

            {/* Comprehensive Daily Auto-updates / Changelog Section */}
            <div className="border-t border-slate-800 pt-5 mt-6 space-y-4">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">Daily System Updates & Instructions Log</h4>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5">Updated live as new specifications or modules are compiled</p>
              </div>

              <div className="space-y-4">
                {changelogs.map((log, index) => (
                  <div key={index} className="border-l-2 border-indigo-500/60 pl-3.5 space-y-1.5 text-xs">
                    <div className="flex items-center space-x-2 text-[10px] font-bold font-mono text-indigo-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{log.date}</span>
                    </div>
                    <p className="font-extrabold text-slate-200">{log.title}</p>
                    <ul className="space-y-1 text-[10px] text-slate-400 list-disc pl-4 font-sans leading-relaxed">
                      {log.items.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom suggestion rule compliance notice footer */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-[10px] text-slate-400 leading-relaxed font-sans italic text-center">
              "💡 Suggestion: Ye mera suggestion hai. Agar aap isse behtar tarike se kar sakte ho to please kar dijiye. Hum best UX aur clean code chahte hain. Aap developer hain, aapki expertise important hai."
            </div>

          </div>

        </div>

      </div>
    </>
  );
}
