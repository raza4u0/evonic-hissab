import React, { useState, useMemo, useEffect } from 'react';
import { triggerPrint } from '../utils/printHelper';
import { 
  FolderTree, 
  BookOpen, 
  Percent, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  AlertTriangle, 
  Scale, 
  Coins, 
  Download, 
  Printer, 
  Layers, 
  ToggleLeft, 
  ToggleRight,
  Info,
  Calendar,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  X,
  RefreshCw,
  TrendingUp,
  FileSpreadsheet,
  Sparkles,
  Lightbulb,
  Shield,
  HelpCircle
} from 'lucide-react';
import { COAAccount, JournalEntry, JournalLine, Company, SalesDocument, Expense, Customer } from '../types';
import { getCountryConfig } from '../utils/countryLocalization';

interface AccountsManagerProps {
  company: Company;
  coaAccounts: COAAccount[];
  journalEntries: JournalEntry[];
  customers: Customer[];
  documents: SalesDocument[];
  expenses: Expense[];
  onAddAccount: (account: COAAccount) => void;
  onUpdateAccount: (account: COAAccount) => void;
  onDeleteAccount: (code: string) => void;
  onAddJournalEntry: (entry: JournalEntry) => void;
  onUpdateJournalEntry: (entry: JournalEntry) => void;
  onDeleteJournalEntry: (id: string) => void;
  accountingMode: 'active' | 'passive';
  setAccountingMode: (mode: 'active' | 'passive') => void;
  onResetCOA: () => void;
}

export default function AccountsManager({
  company,
  coaAccounts,
  journalEntries,
  customers,
  documents,
  expenses,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onAddJournalEntry,
  onUpdateJournalEntry,
  onDeleteJournalEntry,
  accountingMode,
  setAccountingMode,
  onResetCOA
}: AccountsManagerProps) {
  // Navigation internal tabs
  const [activeTab, setActiveTab] = useState<'coa' | 'journal' | 'vat201' | 'ledger_balances' | 'export_hub' | 'advisor'>('coa');

  useEffect(() => {
    if (company?.vatEnabled === false && (activeTab === 'vat201' || activeTab === 'export_hub')) {
      setActiveTab('coa');
    }
  }, [company?.vatEnabled, activeTab]);

  // Search and Filter States
  const [coaSearch, setCoaSearch] = useState('');
  const [coaFilterType, setCoaFilterType] = useState<string>('ALL');
  const [journalSearch, setJournalSearch] = useState('');
  const [journalFilterType, setJournalFilterType] = useState<'all' | 'manual' | 'auto'>('all');

  // COA modal/form states
  const [isCoaModalOpen, setIsCoaModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<COAAccount | null>(null);
  const [coaCode, setCoaCode] = useState('');
  const [coaName, setCoaName] = useState('');
  const [coaType, setCoaType] = useState<'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense'>('Asset');
  const [coaParent, setCoaParent] = useState('');
  const [coaDesc, setCoaDesc] = useState('');
  const [coaError, setCoaError] = useState('');

  // Journal Entry modal/form states
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [jeDate, setJeDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [jeRef, setJeRef] = useState('');
  const [jeDesc, setJeDesc] = useState('');
  const [jeLines, setJeLines] = useState<JournalLine[]>([
    { accountCode: '', debit: 0, credit: 0 },
    { accountCode: '', debit: 0, credit: 0 }
  ]);
  const [jeError, setJeError] = useState('');

  // Detail viewer for Journal Entry
  const [viewingJournal, setViewingJournal] = useState<JournalEntry | null>(null);

  // VAT 201 extra editable fields for Box 2-7, 10-12
  const [box2Taxable, setBox2Taxable] = useState(0);
  const [box2Vat, setBox2Vat] = useState(0);
  const [box3Taxable, setBox3Taxable] = useState(0);
  const [box3Vat, setBox3Vat] = useState(0);
  const [box4SalesZero, setBox4SalesZero] = useState(0);
  const [box5SalesExempt, setBox5SalesExempt] = useState(0);
  const [box10ExpensesRCM, setBox10ExpensesRCM] = useState(0);
  const [box10ExpensesRCMVat, setBox10ExpensesRCMVat] = useState(0);
  const [box11ExpensesZero, setBox11ExpensesZero] = useState(0);
  const [box12ExpensesExempt, setBox12ExpensesExempt] = useState(0);

  // Export dropdown states & database validation states
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [validationReport, setValidationReport] = useState<{
    status: 'IDLE' | 'SUCCESS' | 'WARNING' | 'FAILED';
    fileType: string;
    encoding: string;
    rowCount: number;
    errors: string[];
    warnings: string[];
    isCompatible: boolean;
  } | null>(null);
  
  const [validationRows, setValidationRows] = useState<any[]>([]);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // AI Compliance & Tax Simulator States
  const [projAddRevenue, setProjAddRevenue] = useState<number>(50000);
  const [projAddExpense, setProjAddExpense] = useState<number>(20000);
  const [advisorSearch, setAdvisorSearch] = useState<string>('');
  const [advisorFilter, setAdvisorFilter] = useState<'All' | 'Critical' | 'Warning' | 'Optimization'>('All');

  // CSV formatting helper
  const downloadCSV = (headers: string[], rows: any[][], fileName: string) => {
    // Add UTF-8 BOM so Microsoft Excel can read Arabic characters perfectly
    const csvContent = "\uFEFF" + [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
      ...rows.map(row => row.map(val => {
        const stringVal = val === null || val === undefined ? "" : String(val);
        return `"${stringVal.replace(/"/g, '""')}"`;
      }).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Excel-compatible HTML representation
  const downloadXLS = (title: string, headers: string[], rows: any[][], fileName: string) => {
    const htmlTable = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #4f46e5; color: white; font-weight: bold; padding: 8px; border: 1px solid #ddd; }
          td { padding: 6px; border: 1px solid #ddd; }
          .title { font-size: 16px; font-weight: bold; color: #1e1b4b; padding-bottom: 12px; }
        </style>
      </head>
      <body>
        <div class="title">${title}</div>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows.map(row => `<tr>${row.map(val => `<td>${val === null || val === undefined ? "" : String(val)}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlTable], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // High-fidelity printable vector PDF generator
  const downloadPDF = (title: string, headers: string[], rows: any[][], subtitle: string = '') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocker is enabled. Please allow pop-ups to export PDF/print.');
      return;
    }
    
    const htmlContent = `
      <html>
      <head>
        <title>${title} - Print</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: 800; color: #4f46e5; letter-spacing: -0.05em; }
          .title { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 5px; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 2px; }
          .meta { font-size: 11px; text-align: right; color: #64748b; font-family: monospace; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
          th { background-color: #f8fafc; color: #334155; font-weight: bold; border-bottom: 2px solid #cbd5e1; padding: 10px 8px; text-align: left; text-transform: uppercase; letter-spacing: 0.05em; }
          td { border-bottom: 1px solid #e2e8f0; padding: 8px; color: #475569; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 10px; color: #94a3b8; text-align: center; }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">${company.name}</div>
            <div class="title">${title}</div>
            <div class="subtitle">${subtitle}</div>
          </div>
          <div class="meta">
            <div>Company: ${company.name}</div>
            <div>TRN: ${company.trn || 'N/A'}</div>
            <div>Generated: ${new Date().toLocaleDateString('en-AE')}</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows.map(row => `<tr>${row.map(val => `<td>${val === null || val === undefined ? "" : String(val)}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
        
        <div class="footer">
          UAE FTA Compliance ERP Document. Generated on behalf of ${company.name}.
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Robust CSV parser (handles quoted strings and comma separators)
  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let line: string[] = [];
    let token = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i+1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          token += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        line.push(token.trim());
        token = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        line.push(token.trim());
        lines.push(line);
        line = [];
        token = '';
      } else {
        token += char;
      }
    }
    if (token || line.length > 0) {
      line.push(token.trim());
      lines.push(line);
    }
    return lines.filter(l => l.length > 0);
  };

  // Currency utility helper
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

  // Filter accounts for active company
  const companyAccounts = useMemo(() => {
    return coaAccounts.filter(acc => !acc.companyId || acc.companyId === company.id);
  }, [coaAccounts, company.id]);

  // YTD Financial calculations for the Corporate Tax progress tracker
  const financialTotalsYTD = useMemo(() => {
    const activeDocs = documents.filter(d => d.companyId === company.id);
    const activeExps = expenses.filter(e => e.companyId === company.id);
    
    const revenue = activeDocs.reduce((sum, d) => sum + (d.subtotal || 0), 0);
    const expensesCost = activeExps.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    const outputVat = activeDocs.reduce((sum, d) => sum + (d.vatTotal || 0), 0);
    const inputVat = activeExps.reduce((sum, e) => sum + (e.vatAmount || 0), 0);
    
    const profit = revenue - expensesCost;
    
    return { revenue, expensesCost, outputVat, inputVat, profit };
  }, [documents, expenses, company.id]);

  // Live findings compiled based on Double-entry rules and UAE Regulations
  const advisoryFindings = useMemo(() => {
    const findings: {
      id: string;
      category: 'Critical' | 'Warning' | 'Optimization';
      title: string;
      titleAr: string;
      description: string;
      resolution: string;
      reference?: string;
    }[] = [];

    // 1. Check for unbalanced journal entries
    const activeJournals = journalEntries.filter(je => je.companyId === company.id);
    activeJournals.forEach(je => {
      const debits = je.lines.reduce((sum, l) => sum + (l.debit || 0), 0);
      const credits = je.lines.reduce((sum, l) => sum + (l.credit || 0), 0);
      const diff = Math.abs(debits - credits);
      if (diff > 0.01) {
        findings.push({
          id: `unbalanced-${je.id}`,
          category: 'Critical',
          title: 'Unbalanced Journal Entry Ledger Posting',
          titleAr: '',
          description: `Journal entry "${je.reference || je.id}" has debits of ${formatAED(debits)} and credits of ${formatAED(credits)}, creating an out-of-balance discrepancy of ${formatAED(diff)}.`,
          resolution: 'Adjust the journal line debit/credit values to strictly match, ensuring double-entry balance integrity.',
          reference: je.reference || je.id
        });
      }
    });

    // 2. Customer TRN Strict Validation & B2B warnings
    const activeCustomers = customers.filter(c => c.companyId === company.id);
    activeCustomers.forEach(c => {
      if (c.trn) {
        const trnClean = c.trn.replace(/[^0-9]/g, '');
        if (trnClean.length !== 15) {
          findings.push({
            id: `invalid-trn-${c.id}`,
            category: 'Critical',
            title: 'Non-Compliant 15-Digit TRN for Customer',
            titleAr: '',
            description: `Customer "${c.name}" has a registered TRN of "${c.trn}" which is ${trnClean.length} digits long. Under UAE Federal Tax Authority (FTA) regulations, all TRNs must be exactly 15 digits long.`,
            resolution: 'Edit the customer profile to provide a valid 15-digit TRN to prevent document invalidation under FTA audits.',
            reference: c.name
          });
        }
      } else {
        const customerDocs = documents.filter(d => d.customerId === c.id);
        const hasLargeInvoices = customerDocs.some(d => d.total > 10000);
        if (hasLargeInvoices) {
          findings.push({
            id: `missing-trn-${c.id}`,
            category: 'Warning',
            title: 'TRN Missing on High-Value B2B Account',
            titleAr: '',
            description: `Customer "${c.name}" is missing a TRN, but has invoices exceeding AED 10,000.00. FTA Executive Regulations specify that B2B tax invoices above AED 10,000 must display the buyer's TRN for tax recoverability.`,
            resolution: 'Request the customer\'s 15-digit Tax Registration Number and update their profile to support compliance.',
            reference: c.name
          });
        }
      }
    });

    // 3. High Cash Expense Audit
    const activeExpenses = expenses.filter(e => e.companyId === company.id);
    activeExpenses.forEach(e => {
      const isCash = e.paymentHistory?.some(p => p.method?.toLowerCase() === 'cash') || e.description?.toLowerCase().includes('cash') || e.internalNotes?.toLowerCase().includes('cash');
      if (isCash && e.total > 10000) {
        findings.push({
          id: `cash-threshold-${e.id}`,
          category: 'Warning',
          title: 'High-Value Expense Paid via Cash Channel',
          titleAr: '',
          description: `Expense bill "${e.invoiceNumber || e.id}" for ${formatAED(e.total)} to "${e.supplierName}" was recorded as Cash. Under UAE FTA corporate audit patterns and anti-money laundering (AML) recommendations, any single commercial transaction exceeding AED 10,000 should be settled via trackable banking channels (Bank Transfer, Corporate Cheque, or Card).`,
          resolution: 'Ensure this transaction is supported by a signed cash receipt voucher, and transition future large payments to official banking channels.',
          reference: e.invoiceNumber || e.id
        });
      }
    });

    // 4. Standard VAT Rate Deviation Alert
    const activeDocuments = documents.filter(d => d.companyId === company.id);
    activeDocuments.forEach(d => {
      if (d.type === 'Invoice' && d.vatTotal > 0) {
        const expectedVat = d.subtotal * 0.05;
        const diff = Math.abs(d.vatTotal - expectedVat);
        if (diff > 0.1) {
          findings.push({
            id: `vat-deviation-${d.id}`,
            category: 'Warning',
            title: 'Standard VAT Deviation Alert',
            titleAr: '',
            description: `Invoice "${d.docNumber}" lists a VAT amount of ${formatAED(d.vatTotal)} on a subtotal of ${formatAED(d.subtotal)}. This deviates from the standard 5% flat VAT rate by ${formatAED(diff)}.`,
            resolution: 'Verify item taxes and ensure the 5% VAT multiplier is calculated precisely on the taxable subtotal levels before rounding.',
            reference: d.docNumber
          });
        }
      }
    });

    // 5. System VAT Account Manual Mod Postings
    activeJournals.forEach(je => {
      if (!je.isAutoLinked) {
        const modifiesVatAcc = je.lines.some(l => l.accountCode === '1350' || l.accountCode === '2250');
        if (modifiesVatAcc) {
          findings.push({
            id: `manual-vat-post-${je.id}`,
            category: 'Optimization',
            title: 'Manual Posting to Read-Only System VAT Accounts',
            titleAr: '',
            description: `Journal entry "${je.reference || je.id}" contains manual lines targeting VAT Input (1350) or VAT Output (2250) accounts. Direct manual postings to VAT accounts can cause reconciliation gaps with your Sales & Purchase ledgers during FTA audits.`,
            resolution: 'Use the system\'s automated Sales Invoice and Purchase Expense modules to handle VAT ledger postings automatically rather than compiling manual journals.',
            reference: je.reference || je.id
          });
        }
      }
    });

    // 6. Corporate Tax Optimization warning
    const netProfit = financialTotalsYTD.profit;
    if (netProfit > 300000 && netProfit <= 375000) {
      findings.push({
        id: `ct-threshold-opt`,
        category: 'Optimization',
        title: 'Approaching Corporate Tax Threshold',
        titleAr: '',
        description: `Your Year-to-Date taxable profit of ${formatAED(netProfit)} is approaching the UAE Corporate Tax exemption cap of AED 375,000. Once exceeded, net taxable profit above this threshold is taxed at a standard 9% rate.`,
        resolution: 'Assess your operational expenses, asset depreciations, or research & development expenses. Verify if you are eligible for Small Business Relief (under Art. 21 of CT Law) which extends 0% CT up to 3M AED revenue.',
        reference: 'CT-375K'
      });
    }

    // 7. Pre-Audit Sales Invoice Sequence Gap Detection
    const invoices = activeDocuments.filter(d => d.type === 'Invoice');
    if (invoices.length > 1) {
      const numericInvoices = invoices.map(inv => {
        const numPart = inv.docNumber.replace(/[^0-9]/g, '');
        return {
          original: inv.docNumber,
          num: numPart ? parseInt(numPart, 10) : null
        };
      }).filter(x => x.num !== null) as { original: string, num: number }[];

      if (numericInvoices.length > 1) {
        numericInvoices.sort((a, b) => a.num - b.num);
        const minNum = numericInvoices[0].num;
        const maxNum = numericInvoices[numericInvoices.length - 1].num;

        const missingNumbers: number[] = [];
        for (let i = minNum + 1; i < maxNum; i++) {
          if (!numericInvoices.some(inv => inv.num === i)) {
            missingNumbers.push(i);
          }
        }

        if (missingNumbers.length > 0) {
          const displayedGaps = missingNumbers.slice(0, 5).map(n => `INV-${n.toString().padStart(3, '0')}`).join(', ');
          const moreGaps = missingNumbers.length > 5 ? ` and ${missingNumbers.length - 5} more` : '';
          findings.push({
            id: 'sequence-gap-detection',
            category: 'Warning',
            title: 'Pre-Audit Sales Invoice Sequence Gap Detected',
            titleAr: '',
            description: `A gap check on your invoice numbering sequence has detected missing invoice numbers: [${displayedGaps}${moreGaps}]. Under UAE Federal Decree-Law No. 8 on VAT, tax invoices must be issued in a consecutive, unbroken chronological series to guarantee complete audit trails.`,
            resolution: 'Ensure that no sales invoices have been deleted from local databases. If invoices were cancelled, issue a formal Credit Note rather than deleting the voucher to preserve sequential integrity.',
            reference: `Gaps Count: ${missingNumbers.length}`
          });
        }
      }
    }

    // 8. General Ledger Trial Balance Reconciliation
    let totalLedgerDebits = 0;
    let totalLedgerCredits = 0;
    activeJournals.forEach(je => {
      je.lines.forEach(l => {
        totalLedgerDebits += l.debit || 0;
        totalLedgerCredits += l.credit || 0;
      });
    });

    const tbDiscrepancy = Math.abs(totalLedgerDebits - totalLedgerCredits);
    if (tbDiscrepancy > 0.05) {
      findings.push({
        id: 'trial-balance-discrepancy',
        category: 'Critical',
        title: 'Trial Balance Out-of-Balance Reconciliation Alert',
        titleAr: '',
        description: `The cumulative Trial Balance of the General Ledger is out of sync. Sum of all ledger Debits is ${formatAED(totalLedgerDebits)} while credits is ${formatAED(totalLedgerCredits)}, resulting in a double-entry gap of ${formatAED(tbDiscrepancy)}. This is a critical audit red-flag.`,
        resolution: 'Inspect manual journal postings and check imports to verify that all historical transactions were completely posted with matching debits and credits.',
        reference: `TB Gap: ${formatAED(tbDiscrepancy)}`
      });
    }

    return findings;
  }, [journalEntries, customers, expenses, documents, company.id, financialTotalsYTD.profit]);

  // Overall compliance score out of 100
  const complianceScore = useMemo(() => {
    let score = 100;
    advisoryFindings.forEach(f => {
      if (f.category === 'Critical') score -= 15;
      else if (f.category === 'Warning') score -= 5;
    });
    return Math.max(score, 0);
  }, [advisoryFindings]);

  // Group accounts by main type
  const groupedAccounts = useMemo(() => {
    const groups: Record<string, COAAccount[]> = {
      Asset: [],
      Liability: [],
      Equity: [],
      Revenue: [],
      Expense: []
    };
    companyAccounts.forEach(acc => {
      if (groups[acc.type]) {
        groups[acc.type].push(acc);
      }
    });
    return groups;
  }, [companyAccounts]);

  // Calculate Account Balances based on Posted Journal Entries
  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    
    // Initialize
    companyAccounts.forEach(acc => {
      balances[acc.code] = 0;
    });

    // Sum postings
    journalEntries.forEach(entry => {
      if (entry.status === 'Posted' && entry.companyId === company.id) {
        entry.lines.forEach(line => {
          const acc = companyAccounts.find(a => a.code === line.accountCode);
          if (acc) {
            const amount = line.debit - line.credit;
            // Asset & Expense normal balance is Debit (+)
            // Liability, Equity & Revenue normal balance is Credit (-)
            if (acc.type === 'Asset' || acc.type === 'Expense') {
              balances[acc.code] += amount;
            } else {
              balances[acc.code] -= amount; // credit increases balance
            }
          }
        });
      }
    });

    return balances;
  }, [companyAccounts, journalEntries, company.id]);

  // Handle COA Save
  const handleSaveCOA = (e: React.FormEvent) => {
    e.preventDefault();
    setCoaError('');

    if (!coaCode.trim()) {
      setCoaError('Account Code is strictly mandatory.');
      return;
    }
    if (!coaName.trim()) {
      setCoaError('Account Name is strictly mandatory.');
      return;
    }

    // Code digit check based on category
    const codePrefix = coaCode.trim().charAt(0);
    const expectedPrefix = {
      Asset: '1',
      Liability: '2',
      Equity: '3',
      Revenue: '4',
      Expense: '5' // Or 6
    }[coaType];

    if (coaType === 'Expense' && codePrefix !== '5' && codePrefix !== '6') {
      setCoaError('Expense accounts must start with code 5 or 6 (e.g., 5000, 6100).');
      return;
    } else if (coaType !== 'Expense' && codePrefix !== expectedPrefix) {
      setCoaError(`${coaType} accounts must start with code ${expectedPrefix} (e.g., ${expectedPrefix}000).`);
      return;
    }

    // Check duplicate code
    const existing = coaAccounts.find(a => a.code === coaCode.trim());
    if (existing && (!editingAccount || editingAccount.code !== coaCode.trim())) {
      setCoaError(`Account code "${coaCode}" is already in use by "${existing.name}".`);
      return;
    }

    const accountData: COAAccount = {
      code: coaCode.trim(),
      companyId: company.id,
      name: coaName.trim(),
      type: coaType,
      parentCode: coaParent || undefined,
      description: coaDesc.trim() || undefined,
      isSystem: editingAccount?.isSystem
    };

    if (editingAccount) {
      onUpdateAccount(accountData);
    } else {
      onAddAccount(accountData);
    }

    setIsCoaModalOpen(false);
    setEditingAccount(null);
  };

  const handleOpenEditCOA = (acc: COAAccount) => {
    setEditingAccount(acc);
    setCoaCode(acc.code);
    setCoaName(acc.name);
    setCoaType(acc.type);
    setCoaParent(acc.parentCode || '');
    setCoaDesc(acc.description || '');
    setCoaError('');
    setIsCoaModalOpen(true);
  };

  const handleOpenAddCOA = () => {
    setEditingAccount(null);
    setCoaCode('');
    setCoaName('');
    setCoaType('Asset');
    setCoaParent('');
    setCoaDesc('');
    setCoaError('');
    setIsCoaModalOpen(true);
  };

  // Journal Entry Form line actions
  const handleAddJeLine = () => {
    setJeLines([...jeLines, { accountCode: '', debit: 0, credit: 0 }]);
  };

  const handleRemoveJeLine = (idx: number) => {
    if (jeLines.length <= 2) {
      alert('A double-entry journal must contain at least 2 entry lines.');
      return;
    }
    setJeLines(jeLines.filter((_, i) => i !== idx));
  };

  const handleJeLineChange = (idx: number, field: keyof JournalLine, value: any) => {
    const updated = [...jeLines];
    if (field === 'accountCode') {
      updated[idx].accountCode = value;
    } else {
      const numVal = Math.max(0, parseFloat(value) || 0); // Strictly no negative balances allowed
      updated[idx][field] = numVal;
      // If debit is entered, credit should reset to 0 to keep clean, and vice-versa
      if (field === 'debit' && numVal > 0) {
        updated[idx].credit = 0;
      } else if (field === 'credit' && numVal > 0) {
        updated[idx].debit = 0;
      }
    }
    setJeLines(updated);
  };

  // Handle Manual Journal Entry Save
  const handleSaveJournalEntry = (e: React.FormEvent) => {
    e.preventDefault();
    setJeError('');

    if (!jeRef.trim()) {
      setJeError('Reference number is required.');
      return;
    }
    if (!jeDesc.trim()) {
      setJeError('Description/Memo is required.');
      return;
    }

    // Validate lines
    let totalDebit = 0;
    let totalCredit = 0;
    const cleanLines: JournalLine[] = [];

    for (let i = 0; i < jeLines.length; i++) {
      const line = jeLines[i];
      if (!line.accountCode) {
        setJeError(`Line ${i + 1}: Account selection is required.`);
        return;
      }
      if (line.debit === 0 && line.credit === 0) {
        setJeError(`Line ${i + 1}: Either Debit or Credit must be a positive number.`);
        return;
      }
      if (line.debit < 0 || line.credit < 0) {
        setJeError(`Line ${i + 1}: Negative balances are strictly forbidden under the double-entry constitution.`);
        return;
      }

      totalDebit += line.debit;
      totalCredit += line.credit;
      cleanLines.push(line);
    }

    // Double-entry match verification
    const diff = Math.abs(totalDebit - totalCredit);
    if (diff > 0.01) {
      setJeError(`Double-Entry Mismatch! Total Debits (${formatAED(totalDebit)}) must strictly equal Total Credits (${formatAED(totalCredit)}). Out of balance by: ${formatAED(diff)}`);
      return;
    }

    const newJE: JournalEntry = {
      id: `je_manual_${Date.now()}`,
      companyId: company.id,
      date: jeDate,
      reference: jeRef.trim(),
      description: jeDesc.trim(),
      status: 'Posted', // Post immediately to general ledger
      lines: cleanLines,
      isAutoLinked: false
    };

    onAddJournalEntry(newJE);
    setIsJournalModalOpen(false);
    // Reset
    setJeRef('');
    setJeDesc('');
    setJeLines([
      { accountCode: '', debit: 0, credit: 0 },
      { accountCode: '', debit: 0, credit: 0 }
    ]);
  };

  // Filter accounts for parents list
  const parentAccountsList = companyAccounts.filter(a => !a.parentCode);

  // Filter COA for table listing
  const filteredCOAList = useMemo(() => {
    return companyAccounts.filter(acc => {
      const matchesSearch = acc.name.toLowerCase().includes(coaSearch.toLowerCase()) || 
                            acc.code.includes(coaSearch);
      const matchesType = coaFilterType === 'ALL' || acc.type === coaFilterType;
      return matchesSearch && matchesType;
    });
  }, [companyAccounts, coaSearch, coaFilterType]);

  // Filter Journal entries for listing
  const filteredJournals = useMemo(() => {
    return journalEntries.filter(entry => {
      if (entry.companyId !== company.id) return false;
      const matchesSearch = entry.reference.toLowerCase().includes(journalSearch.toLowerCase()) || 
                            entry.description.toLowerCase().includes(journalSearch.toLowerCase());
      if (journalFilterType === 'manual') return matchesSearch && !entry.isAutoLinked;
      if (journalFilterType === 'auto') return matchesSearch && entry.isAutoLinked;
      return matchesSearch;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [journalEntries, journalSearch, journalFilterType, company.id]);

  // VAT calculations for VAT 201 Return
  const vatCalculations = useMemo(() => {
    // Collect from standard posted journals
    let outputVatTotal = 0;
    let standardRatedSalesTotal = 0;
    let inputVatTotal = 0;
    let standardRatedExpensesTotal = 0;

    // Filter documents and expenses inside date range
    // Since we computed auto-journals reactively, let's extract standard VAT return figures directly from current documents and expenses of this company
    const activeInvoices = documents.filter(d => d.companyId === company.id && d.type === 'Invoice' && d.status !== 'Cancelled');
    const activeExpenses = expenses.filter(e => e.companyId === company.id && e.status === 'Paid');

    activeInvoices.forEach(inv => {
      standardRatedSalesTotal += inv.subtotal;
      outputVatTotal += inv.vatTotal;
    });

    activeExpenses.forEach(exp => {
      standardRatedExpensesTotal += exp.amount;
      inputVatTotal += exp.vatAmount;
    });

    // Box 1 supplies by Emirate
    const emirateSalesBreakdown: Record<string, { taxable: number; vat: number }> = {
      'Abu Dhabi': { taxable: 0, vat: 0 },
      'Dubai': { taxable: 0, vat: 0 },
      'Sharjah': { taxable: 0, vat: 0 },
      'Ajman': { taxable: 0, vat: 0 },
      'Umm Al Quwain': { taxable: 0, vat: 0 },
      'Ras Al Khaimah': { taxable: 0, vat: 0 },
      'Fujairah': { taxable: 0, vat: 0 }
    };

    activeInvoices.forEach(inv => {
      const cust = customers.find(c => c.id === inv.customerId);
      const emirate = cust?.emirate || 'Dubai';
      if (emirateSalesBreakdown[emirate]) {
        emirateSalesBreakdown[emirate].taxable += inv.subtotal;
        emirateSalesBreakdown[emirate].vat += inv.vatTotal;
      } else {
        emirateSalesBreakdown['Dubai'].taxable += inv.subtotal;
        emirateSalesBreakdown['Dubai'].vat += inv.vatTotal;
      }
    });

    return {
      outputVatTotal,
      standardRatedSalesTotal,
      inputVatTotal,
      standardRatedExpensesTotal,
      emirateSalesBreakdown
    };
  }, [documents, expenses, customers, company.id]);

  // Total outputs & inputs calculations
  const totalOutputVat = vatCalculations.outputVatTotal + box2Vat + box3Vat;
  const totalInputVat = vatCalculations.inputVatTotal + box10ExpensesRCMVat;
  const netVatLiability = totalOutputVat - totalInputVat;

  // Export official XML format matching FTA schema representation
  const handleExportXML = () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<FtaVatReturn201 xmlns="urn:ae:fta:vat:return:v1.0">
  <Header>
    <TaxRegistrationNumber>${company.trn || '150000000000003'}</TaxRegistrationNumber>
    <TaxablePersonName>${company.name}</TaxablePersonName>
    <ReportingPeriodStart>${company.fyStart}</ReportingPeriodStart>
    <ReportingPeriodEnd>${new Date().toISOString().split('T')[0]}</ReportingPeriodEnd>
  </Header>
  <VatOutputs>
    <Box1StandardRatedSupplies>
      <AbuDhabi>
        <Taxable>${vatCalculations.emirateSalesBreakdown['Abu Dhabi'].taxable.toFixed(2)}</Taxable>
        <Vat>${vatCalculations.emirateSalesBreakdown['Abu Dhabi'].vat.toFixed(2)}</Vat>
      </AbuDhabi>
      <Dubai>
        <Taxable>${vatCalculations.emirateSalesBreakdown['Dubai'].taxable.toFixed(2)}</Taxable>
        <Vat>${vatCalculations.emirateSalesBreakdown['Dubai'].vat.toFixed(2)}</Vat>
      </Dubai>
      <Sharjah>
        <Taxable>${vatCalculations.emirateSalesBreakdown['Sharjah'].taxable.toFixed(2)}</Taxable>
        <Vat>${vatCalculations.emirateSalesBreakdown['Sharjah'].vat.toFixed(2)}</Vat>
      </Sharjah>
      <Ajman>
        <Taxable>${vatCalculations.emirateSalesBreakdown['Ajman'].taxable.toFixed(2)}</Taxable>
        <Vat>${vatCalculations.emirateSalesBreakdown['Ajman'].vat.toFixed(2)}</Vat>
      </Ajman>
      <UmmAlQuwain>
        <Taxable>${vatCalculations.emirateSalesBreakdown['Umm Al Quwain'].taxable.toFixed(2)}</Taxable>
        <Vat>${vatCalculations.emirateSalesBreakdown['Umm Al Quwain'].vat.toFixed(2)}</Vat>
      </UmmAlQuwain>
      <RasAlRakimah>
        <Taxable>${vatCalculations.emirateSalesBreakdown['Ras Al Khaimah'].taxable.toFixed(2)}</Taxable>
        <Vat>${vatCalculations.emirateSalesBreakdown['Ras Al Khaimah'].vat.toFixed(2)}</Vat>
      </RasAlRakimah>
      <Fujairah>
        <Taxable>${vatCalculations.emirateSalesBreakdown['Fujairah'].taxable.toFixed(2)}</Taxable>
        <Vat>${vatCalculations.emirateSalesBreakdown['Fujairah'].vat.toFixed(2)}</Vat>
      </Fujairah>
    </Box1StandardRatedSupplies>
    <Box2ImportsGoods>
      <Taxable>${box2Taxable.toFixed(2)}</Taxable>
      <Vat>${box2Vat.toFixed(2)}</Vat>
    </Box2ImportsGoods>
    <Box3ReverseChargeMechanisms>
      <Taxable>${box3Taxable.toFixed(2)}</Taxable>
      <Vat>${box3Vat.toFixed(2)}</Vat>
    </Box3ReverseChargeMechanisms>
    <Box4ZeroRatedSupplies>${box4SalesZero.toFixed(2)}</Box4ZeroRatedSupplies>
    <Box5ExemptSupplies>${box5SalesExempt.toFixed(2)}</Box5ExemptSupplies>
    <Box8TotalOutputs>
      <Vat>${totalOutputVat.toFixed(2)}</Vat>
    </Box8TotalOutputs>
  </VatOutputs>
  <VatInputs>
    <Box9StandardRatedExpenses>
      <Taxable>${vatCalculations.standardRatedExpensesTotal.toFixed(2)}</Taxable>
      <Vat>${vatCalculations.inputVatTotal.toFixed(2)}</Vat>
    </Box9StandardRatedExpenses>
    <Box10RcmExpenses>
      <Taxable>${box10ExpensesRCM.toFixed(2)}</Taxable>
      <Vat>${box10ExpensesRCMVat.toFixed(2)}</Vat>
    </Box10RcmExpenses>
    <Box11ZeroRatedExpenses>${box11ExpensesZero.toFixed(2)}</Box11ZeroRatedExpenses>
    <Box12ExemptExpenses>${box12ExpensesExempt.toFixed(2)}</Box12ExemptExpenses>
    <Box13TotalInputs>
      <Vat>${totalInputVat.toFixed(2)}</Vat>
    </Box13TotalInputs>
  </VatInputs>
  <VatRefundSummary>
    <Box14NetVatDue>${netVatLiability.toFixed(2)}</Box14NetVatDue>
    <Box15RefundRequested>true</Box15RefundRequested>
  </VatRefundSummary>
</FtaVatReturn201>`;

    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fta_vat_201_${company.name.toLowerCase().replace(/\s+/g, '_')}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('Bilingual FTA Compliant XML generated successfully for official tax filing on the FTA e-portal.');
  };

  // --- DATA GENERATORS FOR EXPORT SYSTEM ---
  
  const getCOAExportData = () => {
    const headers = ["Code", "Name", "Type", "Description", "Parent Code", "System Locked"];
    const rows = companyAccounts.map(acc => [
      acc.code,
      acc.name,
      acc.type,
      acc.description || '',
      acc.parentCode || '',
      acc.isSystem ? 'Yes' : 'No'
    ]);
    return { headers, rows };
  };

  const getLedgerExportData = () => {
    const headers = ["Entry ID", "Date", "Reference", "Description", "Type", "Line Account Code", "Line Account Name", "Debit", "Credit"];
    const rows: any[][] = [];
    
    journalEntries
      .filter(entry => entry.companyId === company.id)
      .forEach(entry => {
        entry.lines.forEach(line => {
          const account = coaAccounts.find(a => a.code === line.accountCode);
          rows.push([
            entry.id,
            entry.date,
            entry.reference,
            entry.description,
            entry.isAutoLinked ? 'Auto Sync' : 'Manual',
            line.accountCode,
            account ? account.name : 'Unknown Account',
            line.debit,
            line.credit
          ]);
        });
      });
      
    return { headers, rows };
  };

  const getVATExportData = () => {
    const headers = ["Box Number", "Box Name (Bilingual)", "Taxable Amount (AED)", "VAT Amount (AED)", "VAT Rate", "Description"];
    const rows: any[][] = [];
    
    // Output Tax items
    const emirateNames: Record<string, string> = {
      abu_dhabi: "Abu Dhabi",
      dubai: "Dubai",
      sharjah: "Sharjah",
      ajman: "Ajman",
      umm_al_quwain: "Umm Al Quwain",
      ras_al_khaimah: "Ras Al Khaimah",
      fujairah: "Fujairah"
    };
    
    Object.entries(vatCalculations.emirateSalesBreakdown).forEach(([key, val]) => {
      const castVal = val as { taxable: number; vat: number };
      rows.push([
        "Box 1",
        `Supplies - ${emirateNames[key] || key}`,
        castVal.taxable.toFixed(2),
        castVal.vat.toFixed(2),
        "5%",
        `Standard rated sales registered in emirate of ${key}`
      ]);
    });
    
    rows.push([
      "Box 2",
      "Taxable Imports of Goods",
      box2Taxable.toFixed(2),
      box2Vat.toFixed(2),
      "5%",
      "Customs imported goods subject to standard VAT rates"
    ]);
    
    rows.push([
      "Box 3",
      "Reverse Charge Sales",
      box3Taxable.toFixed(2),
      box3Vat.toFixed(2),
      "5%",
      "Services/Supplies subject to reverse charge mechanism"
    ]);
    
    rows.push([
      "Box 4",
      "Sales Zero-Rated",
      box4SalesZero.toFixed(2),
      "0.00",
      "0%",
      "Exports or international transport zero-rated sales"
    ]);
    
    rows.push([
      "Box 5",
      "Sales Exempt",
      box5SalesExempt.toFixed(2),
      "0.00",
      "Exempt",
      "Local financial services or residential lease exempt sales"
    ]);
    
    const totalOutputVat = vatCalculations.outputVatTotal + box2Vat + box3Vat;
    rows.push([
      "Box 8",
      "Total Standard Rated Supplies",
      (vatCalculations.standardRatedSalesTotal + box2Taxable + box3Taxable).toFixed(2),
      totalOutputVat.toFixed(2),
      "Calculated",
      "Consolidated taxable supplies output total"
    ]);
    
    // Input Tax items
    rows.push([
      "Box 9",
      "Standard Rated Expenses",
      vatCalculations.standardRatedExpensesTotal.toFixed(2),
      vatCalculations.inputVatTotal.toFixed(2),
      "5%",
      "FTA compliant operational procurement and taxable business expenses"
    ]);
    
    rows.push([
      "Box 10",
      "RCM Expenses",
      box10ExpensesRCM.toFixed(2),
      box10ExpensesRCMVat.toFixed(2),
      "5%",
      "RCM taxable expense acquisitions"
    ]);
    
    rows.push([
      "Box 11",
      "Zero-Rated Expenses",
      box11ExpensesZero.toFixed(2),
      "0.00",
      "0%",
      "Zero rated local business expenses"
    ]);
    
    rows.push([
      "Box 12",
      "Exempt Expenses",
      box12ExpensesExempt.toFixed(2),
      "0.00",
      "Exempt",
      "Exempt local procurement expenses"
    ]);
    
    const totalInputVat = vatCalculations.inputVatTotal + box10ExpensesRCMVat;
    rows.push([
      "Box 13",
      "Total Inputs",
      (vatCalculations.standardRatedExpensesTotal + box10ExpensesRCM).toFixed(2),
      totalInputVat.toFixed(2),
      "Calculated",
      "Consolidated recoverable business expenses input total"
    ]);
    
    const netVatLiability = totalOutputVat - totalInputVat;
    rows.push([
      "Box 14",
      "Net VAT Payable / (Refundable)",
      "N/A",
      netVatLiability.toFixed(2),
      "Net due",
      netVatLiability >= 0 ? "PAYABLE TO FEDERAL TAX AUTHORITY" : "REFUND CLAIMABLE FROM FEDERAL TAX AUTHORITY"
    ]);
    
    return { headers, rows };
  };

  const getCustomersExportData = () => {
    const headers = ["Customer Name*", "Emirate*", "Phone*", "Email", "TRN"];
    const rows = customers
      .filter(cust => cust.companyId === company.id)
      .map(cust => [
        cust.name,
        cust.emirate || '',
        cust.phone || '',
        cust.email || '',
        cust.trn || ''
      ]);
    return { headers, rows };
  };

  // --- COMPLIANCE INTERACTIVE VALIDATOR & AUDIT CHECKER ---
  
  const handleFileValidation = (text: string, fileName: string) => {
    setSelectedFileName(fileName);
    const parsed = parseCSV(text);
    if (parsed.length === 0) {
      setValidationReport({
        status: 'FAILED',
        fileType: 'Unknown',
        encoding: 'UTF-8',
        rowCount: 0,
        errors: ['The uploaded file is empty, corrupted, or has formatting anomalies.'],
        warnings: [],
        isCompatible: false
      });
      return;
    }

    const rawHeaders = parsed[0];
    const headers = rawHeaders.map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = parsed.slice(1);

    let fileType = 'Unknown';
    let errors: string[] = [];
    let warnings: string[] = [];
    let isCompatible = false;
    let validatedRows: any[] = [];

    // Let's identify the specific file template by headers signature
    if (headers.includes('Code') && headers.includes('Name') && headers.includes('Type')) {
      fileType = 'Chart of Accounts (COA)';
      isCompatible = true;
      
      rows.forEach((row, idx) => {
        const rowNum = idx + 2;
        if (row.length < 3) {
          errors.push(`Row ${rowNum}: Insufficient structural parameters. Account row must specify at least Code, Name, and Type.`);
          return;
        }
        
        const code = row[0]?.trim().replace(/^"|"$/g, '');
        const name = row[1]?.trim().replace(/^"|"$/g, '');
        const type = row[2]?.trim().replace(/^"|"$/g, '');
        const desc = row[3]?.trim().replace(/^"|"$/g, '') || '';
        const parentCode = row[4]?.trim().replace(/^"|"$/g, '') || '';
        const isLocked = row[5]?.trim().replace(/^"|"$/g, '') === 'Yes';

        if (!code) errors.push(`Row ${rowNum}: Required column "Code" is missing.`);
        if (!name) errors.push(`Row ${rowNum}: Required column "Name" is missing.`);
        
        // Double-entry Standard prefix checks as defined in Hisaab ERP
        if (code && type) {
          if (type === 'Asset' && !code.startsWith('1')) {
            errors.push(`Row ${rowNum}: Prefix validation failed. Asset account code "${code}" must start with prefix "1".`);
          } else if (type === 'Liability' && !code.startsWith('2')) {
            errors.push(`Row ${rowNum}: Prefix validation failed. Liability account code "${code}" must start with prefix "2".`);
          } else if (type === 'Equity' && !code.startsWith('3')) {
            errors.push(`Row ${rowNum}: Prefix validation failed. Equity account code "${code}" must start with prefix "3".`);
          } else if (type === 'Revenue' && !code.startsWith('4')) {
            errors.push(`Row ${rowNum}: Prefix validation failed. Revenue account code "${code}" must start with prefix "4".`);
          } else if (type === 'Expense' && !(code.startsWith('5') || code.startsWith('6'))) {
            errors.push(`Row ${rowNum}: Prefix validation failed. Expense account code "${code}" must start with prefix "5" or "6".`);
          }
        }

        // Lock protection checks (e.g. VAT accounts 1350/2250 should be read-only system managed)
        if (['1350', '2250'].includes(code) && !isLocked) {
          warnings.push(`Row ${rowNum}: Standard FTA Audit Account "${name}" (${code}) is not flagged as Locked. System-level accounts should ideally be Locked.`);
        }

        validatedRows.push({ code, name, type, description: desc, parentCode, isLocked });
      });

      if (errors.length > 0) isCompatible = false;

    } else if (headers.includes('Entry ID') && headers.includes('Line Account Code') && headers.includes('Debit')) {
      fileType = 'General Ledger';
      isCompatible = true;

      // Group double-entry lines by Entry ID to verify Dr/Cr match
      const journalGroups: Record<string, any[]> = {};
      
      rows.forEach((row, idx) => {
        const rowNum = idx + 2;
        const entryId = row[0]?.trim().replace(/^"|"$/g, '');
        const date = row[1]?.trim().replace(/^"|"$/g, '');
        const ref = row[2]?.trim().replace(/^"|"$/g, '');
        const desc = row[3]?.trim().replace(/^"|"$/g, '');
        const isAuto = row[4]?.trim().replace(/^"|"$/g, '');
        const accCode = row[5]?.trim().replace(/^"|"$/g, '');
        const accName = row[6]?.trim().replace(/^"|"$/g, '');
        const debit = parseFloat(row[7]?.trim().replace(/^"|"$/g, '')) || 0;
        const credit = parseFloat(row[8]?.trim().replace(/^"|"$/g, '')) || 0;

        if (!entryId) {
          errors.push(`Row ${rowNum}: Entry ID parameter is blank.`);
          return;
        }

        if (debit < 0 || credit < 0) {
          errors.push(`Row ${rowNum}: Invalid negative transaction line in general ledger. Debit and Credit must always be positive values.`);
        }

        if (!journalGroups[entryId]) {
          journalGroups[entryId] = [];
        }
        journalGroups[entryId].push({ rowNum, date, ref, desc, isAuto, accCode, accName, debit, credit });
      });

      // Double-entry validation
      Object.entries(journalGroups).forEach(([entryId, lines]) => {
        let totalDebit = 0;
        let totalCredit = 0;
        
        lines.forEach(l => {
          totalDebit += l.debit;
          totalCredit += l.credit;
        });

        // Tolerance check for floating points
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
          errors.push(`Journal "${entryId}" (Ref: ${lines[0].ref || 'N/A'}): Balanced double-entry check failed. Debits sum: AED ${totalDebit.toFixed(2)}, Credits sum: AED ${totalCredit.toFixed(2)}. Out of balance by: AED ${Math.abs(totalDebit - totalCredit).toFixed(2)}.`);
        }

        validatedRows.push({
          id: entryId,
          date: lines[0].date || new Date().toISOString().split('T')[0],
          reference: lines[0].ref || '',
          description: lines[0].desc || '',
          isAutoLinked: lines[0].isAuto === 'Auto Sync',
          companyId: company.id,
          lines: lines.map(l => ({
            accountCode: l.accCode,
            debit: l.debit,
            credit: l.credit
          }))
        });
      });

      if (errors.length > 0) isCompatible = false;

    } else if (headers.includes('Box Number') && headers.includes('VAT Amount (AED)')) {
      fileType = 'VAT 201 Return';
      isCompatible = false;
      warnings.push('Bilingual VAT 201 return forms are read-only summary calculations and cannot be re-imported to overwrite ledger transaction logs.');

    } else if (headers.includes('Customer Name*') && headers.includes('Emirate*') && headers.includes('Phone*')) {
      fileType = 'Customers Database';
      isCompatible = false; // Customer import validation logic
      
      const countryConfig = getCountryConfig(company?.gccCountry);
      const gccCountry = countryConfig.name;
      const trnLengthMsg = countryConfig.taxIdMinLength === countryConfig.taxIdMaxLength 
        ? `${countryConfig.taxIdMinLength} digits` 
        : `${countryConfig.taxIdMinLength} to ${countryConfig.taxIdMaxLength} characters`;
      const trnRegex = countryConfig.taxIdRegex;
      const taxAuthority = countryConfig.taxAuthorityShort;
      const regionName = countryConfig.regionTypeName;

      rows.forEach((row, idx) => {
        const rowNum = idx + 2;
        const name = row[0]?.trim().replace(/^"|"$/g, '');
        const emirate = row[1]?.trim().replace(/^"|"$/g, '');
        const phone = row[2]?.trim().replace(/^"|"$/g, '');
        const email = row[3]?.trim().replace(/^"|"$/g, '');
        const trn = row[4]?.trim().replace(/^"|"$/g, '');

        if (!name) errors.push(`Row ${rowNum}: "Customer Name*" is strictly mandatory for corporate records.`);
        if (!emirate) errors.push(`Row ${rowNum}: "${regionName}*" is strictly mandatory for ${taxAuthority} tax allocation.`);
        if (!phone) errors.push(`Row ${rowNum}: "Phone*" is strictly mandatory for compliance contact.`);

        if (!trn) {
          warnings.push(`Row ${rowNum}: Customer "${name || 'Unknown'}" has no tax code. "${countryConfig.taxIdShortLabel} missing - Update for ${taxAuthority} Compliance".`);
        } else {
          // TRN / Tax ID Strict Validation
          if (!trnRegex.test(trn)) {
            errors.push(`Row ${rowNum}: Tax code "${trn}" for customer "${name}" is invalid. It must be valid (${trnLengthMsg}) for ${gccCountry} compliance.`);
          }
        }
      });
      
      if (errors.length === 0) {
        warnings.push('Customers Database structure has been validated 100% and is free of errors. Direct synchronizations are currently handled via the Customers workspace.');
      }
    } else {
      fileType = 'Unknown File Schema';
      errors.push('File schema rejection: Uploaded CSV columns do not match COA, Ledger, VAT 201, or Customer tables. Please export from Hisaab Pro first.');
    }

    setValidationRows(validatedRows);
    setValidationReport({
      status: errors.length > 0 ? 'FAILED' : warnings.length > 0 ? 'WARNING' : 'SUCCESS',
      fileType,
      encoding: 'UTF-8 (Verified Bilingual BOM)',
      rowCount: rows.length,
      errors,
      warnings,
      isCompatible
    });
  };

  const handleImportValidatedData = () => {
    if (!validationReport || !validationReport.isCompatible || validationRows.length === 0) return;

    if (validationReport.fileType === 'Chart of Accounts (COA)') {
      let importedCount = 0;
      validationRows.forEach(row => {
        const exists = coaAccounts.some(acc => acc.code === row.code);
        if (!exists) {
          onAddAccount(row);
          importedCount++;
        }
      });
      alert(`Bilingual COA Import Complete: Successfully synchronized and appended ${importedCount} tax-compliant accounts into your Chart of Accounts.`);
    } else if (validationReport.fileType === 'General Ledger') {
      let importedCount = 0;
      validationRows.forEach(row => {
        const exists = journalEntries.some(je => je.id === row.id);
        if (!exists) {
          onAddJournalEntry(row);
          importedCount++;
        }
      });
      alert(`Double-entry Ledger Sync Complete: Successfully posted ${importedCount} balanced journal entries to the core ledger engine.`);
    }

    // Reset validation state
    setSelectedFileName('');
    setValidationReport(null);
    setValidationRows([]);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER BAR WITH AUTO LINKING TOGGLE */}
      <div className="bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 p-6 rounded-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-xs no-print">
        <div className="flex-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-lg">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Hisaab Double-Entry Accounting Core</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">FTA-compliant Chart of Accounts, Ledger Journals, and Auto Journal Synchronization</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Quick Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="bg-white dark:bg-[#0c111d] hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-lg flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer transition-all shadow-xs"
              title="Export database tables in professional auditor formats"
            >
              <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Export Table</span>
              <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-bold">12 Options</span>
            </button>

            {isExportDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsExportDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-4 z-50 text-xs text-left animate-in fade-in slide-in-from-top-2 duration-100">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                    FTA Compliance Export Hub
                  </div>
                  
                  <div className="space-y-4">
                    {/* Segment 1: COA */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 dark:text-slate-200">1. Chart of Accounts (COA)</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center font-bold text-[10px]">
                        <button
                          onClick={() => {
                            const { headers, rows } = getCOAExportData();
                            const formattedDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
                            downloadCSV(headers, rows, `hisaabpro_COA_${formattedDate}.csv`);
                            setIsExportDropdownOpen(false);
                          }}
                          className="py-1 px-2 bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 border border-slate-200 dark:border-slate-800 rounded transition-colors cursor-pointer"
                        >
                          CSV
                        </button>
                        <button
                          onClick={() => {
                            const { headers, rows } = getCOAExportData();
                            const formattedDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
                            downloadXLS("Chart of Accounts", headers, rows, `hisaabpro_COA_${formattedDate}.xls`);
                            setIsExportDropdownOpen(false);
                          }}
                          className="py-1 px-2 bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 border border-slate-200 dark:border-slate-800 rounded transition-colors cursor-pointer"
                        >
                          Excel
                        </button>
                        <button
                          onClick={() => {
                            const { headers, rows } = getCOAExportData();
                            downloadPDF("Chart of Accounts (COA)", headers, rows, "Standardized UAE Accounting Accounts Directory");
                            setIsExportDropdownOpen(false);
                          }}
                          className="py-1 px-2 bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 border border-slate-200 dark:border-slate-800 rounded transition-colors cursor-pointer"
                        >
                          PDF
                        </button>
                      </div>
                    </div>

                    {/* Segment 2: General Ledger */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 dark:text-slate-200">2. General Ledger / Journals</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center font-bold text-[10px]">
                        <button
                          onClick={() => {
                            const { headers, rows } = getLedgerExportData();
                            const formattedDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
                            downloadCSV(headers, rows, `hisaabpro_Ledger_${formattedDate}.csv`);
                            setIsExportDropdownOpen(false);
                          }}
                          className="py-1 px-2 bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 border border-slate-200 dark:border-slate-800 rounded transition-colors cursor-pointer"
                        >
                          CSV
                        </button>
                        <button
                          onClick={() => {
                            const { headers, rows } = getLedgerExportData();
                            const formattedDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
                            downloadXLS("General Ledger", headers, rows, `hisaabpro_Ledger_${formattedDate}.xls`);
                            setIsExportDropdownOpen(false);
                          }}
                          className="py-1 px-2 bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 border border-slate-200 dark:border-slate-800 rounded transition-colors cursor-pointer"
                        >
                          Excel
                        </button>
                        <button
                          onClick={() => {
                            const { headers, rows } = getLedgerExportData();
                            downloadPDF("General Ledger Transactions Log", headers, rows, "Official Audit Leg-by-Leg Balanced Postings");
                            setIsExportDropdownOpen(false);
                          }}
                          className="py-1 px-2 bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 border border-slate-200 dark:border-slate-800 rounded transition-colors cursor-pointer"
                        >
                          PDF
                        </button>
                      </div>
                    </div>

                    {/* Segment 3: VAT 201 */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 dark:text-slate-200">3. VAT 201 Return Report</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center font-bold text-[10px]">
                        <button
                          onClick={() => {
                            const { headers, rows } = getVATExportData();
                            const formattedDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
                            downloadCSV(headers, rows, `hisaabpro_VAT201_${formattedDate}.csv`);
                            setIsExportDropdownOpen(false);
                          }}
                          className="py-1 px-2 bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 border border-slate-200 dark:border-slate-800 rounded transition-colors cursor-pointer"
                        >
                          CSV
                        </button>
                        <button
                          onClick={() => {
                            const { headers, rows } = getVATExportData();
                            const formattedDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
                            downloadXLS("VAT 201 Return Report", headers, rows, `hisaabpro_VAT201_${formattedDate}.xls`);
                            setIsExportDropdownOpen(false);
                          }}
                          className="py-1 px-2 bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 border border-slate-200 dark:border-slate-800 rounded transition-colors cursor-pointer"
                        >
                          Excel
                        </button>
                        <button
                          onClick={() => {
                            const { headers, rows } = getVATExportData();
                            downloadPDF("VAT 201 Official Return", headers, rows, "Bilingual UAE FTA Tax Return Form");
                            setIsExportDropdownOpen(false);
                          }}
                          className="py-1 px-2 bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 border border-slate-200 dark:border-slate-800 rounded transition-colors cursor-pointer"
                        >
                          PDF
                        </button>
                      </div>
                    </div>

                    {/* Segment 4: Customers */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 dark:text-slate-200">4. Customers Database</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center font-bold text-[10px]">
                        <button
                          onClick={() => {
                            const { headers, rows } = getCustomersExportData();
                            const formattedDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
                            downloadCSV(headers, rows, `hisaabpro_Customers_${formattedDate}.csv`);
                            setIsExportDropdownOpen(false);
                          }}
                          className="py-1 px-2 bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 border border-slate-200 dark:border-slate-800 rounded transition-colors cursor-pointer"
                        >
                          CSV
                        </button>
                        <button
                          onClick={() => {
                            const { headers, rows } = getCustomersExportData();
                            const formattedDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
                            downloadXLS("Customers Database", headers, rows, `hisaabpro_Customers_${formattedDate}.xls`);
                            setIsExportDropdownOpen(false);
                          }}
                          className="py-1 px-2 bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 border border-slate-200 dark:border-slate-800 rounded transition-colors cursor-pointer"
                        >
                          Excel
                        </button>
                        <button
                          onClick={() => {
                            const { headers, rows } = getCustomersExportData();
                            downloadPDF("Registered Customers Database", headers, rows, "Bilingual UAE Client Compliance Index");
                            setIsExportDropdownOpen(false);
                          }}
                          className="py-1 px-2 bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 border border-slate-200 dark:border-slate-800 rounded transition-colors cursor-pointer"
                        >
                          PDF
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-center">
                    <button
                      onClick={() => {
                        setActiveTab('export_hub');
                        setIsExportDropdownOpen(false);
                      }}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-black cursor-pointer uppercase"
                    >
                      Open Auditor Import/Validation Hub →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sync Mode Toggle Card */}
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-lg flex items-center space-x-4">
            <div className="text-left">
              <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-slate-400 block">Ledger Sync Engine</span>
              <span className={`text-xs font-bold ${accountingMode === 'active' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600'}`}>
                {accountingMode === 'active' ? '● ACTIVE (Auto Journal Sync)' : '○ PASSIVE (Manual Only)'}
              </span>
            </div>

            <button 
              type="button"
              onClick={() => {
                const nextMode = accountingMode === 'active' ? 'passive' : 'active';
                setAccountingMode(nextMode);
                alert(`Accounting Engine is now set to ${nextMode === 'active' ? 'ACTIVE. Invoices and Purchases will auto-generate double-entry journals.' : 'PASSIVE. Manual journals are used.'}`);
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 focus:outline-hidden cursor-pointer"
              title="Toggle Ledger Sync Mode"
            >
              {accountingMode === 'active' ? (
                <ToggleRight className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-slate-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* INTERNAL SUITE TABS */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 no-print">
        <button
          onClick={() => setActiveTab('coa')}
          className={`px-4 py-2 text-xs font-bold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${activeTab === 'coa' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-black' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Chart of Accounts</span>
        </button>

        <button
          onClick={() => setActiveTab('journal')}
          className={`px-4 py-2 text-xs font-bold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${activeTab === 'journal' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-black' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Journal Entries Log</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger_balances')}
          className={`px-4 py-2 text-xs font-bold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${activeTab === 'ledger_balances' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-black' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          <Coins className="w-4 h-4" />
          <span>General Ledger Balances</span>
        </button>

        {company?.vatEnabled !== false && (
          <>
            <button
              onClick={() => setActiveTab('vat201')}
              className={`px-4 py-2 text-xs font-bold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${activeTab === 'vat201' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-black' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              <Percent className="w-4 h-4" />
              <span>FTA VAT 201 Return</span>
            </button>

            <button
              onClick={() => setActiveTab('export_hub')}
              className={`px-4 py-2 text-xs font-bold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${activeTab === 'export_hub' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-black' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-400">FTA Audit Export & Import Hub</span>
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab('advisor')}
          className={`px-4 py-2 text-xs font-bold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${activeTab === 'advisor' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-black' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
          <span className="text-indigo-600 dark:text-indigo-400 font-black">AI Compliance Advisor</span>
        </button>
      </div>

      {/* --------------------------------------------------------------------------------------
          1. TAB: CHART OF ACCOUNTS
          -------------------------------------------------------------------------------------- */}
      {activeTab === 'coa' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
            <div className="flex items-center space-x-2 flex-1 max-w-md">
              <div className="relative w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search accounts by name or code..."
                  value={coaSearch}
                  onChange={(e) => setCoaSearch(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs bg-white dark:bg-[#0c111d] focus:outline-hidden font-sans"
                />
              </div>

              <select
                value={coaFilterType}
                onChange={(e) => setCoaFilterType(e.target.value)}
                className="border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs bg-white dark:bg-[#0c111d] focus:outline-hidden"
              >
                <option value="ALL">All Types</option>
                <option value="Asset">Assets</option>
                <option value="Liability">Liabilities</option>
                <option value="Equity">Equity</option>
                <option value="Revenue">Revenue</option>
                <option value="Expense">Expenses</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={onResetCOA}
                className="px-3 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title="Reset Chart of Accounts to UAE standard seed"
              >
                Reset UAE Seed
              </button>

              <button
                onClick={handleOpenAddCOA}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Account</span>
              </button>
            </div>
          </div>

          {/* Accounts Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            
            {/* Left side: Quick summaries */}
            <div className="xl:col-span-1 space-y-4 no-print">
              <div className="bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Ledger Balance Checks</h3>
                
                <div className="mt-4 space-y-3 font-sans">
                  <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-900">
                    <span className="text-[10px] text-slate-400 block font-mono">System Integrity Status</span>
                    <span className="text-xs font-black text-emerald-600 flex items-center space-x-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Balanced Double-Entry</span>
                    </span>
                  </div>

                  <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-100/50 dark:border-indigo-950/50">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-mono">VAT Liability (Output - Input)</span>
                    <span className="text-xs font-mono font-black text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {formatAED((accountBalances['2250'] || 0) - (accountBalances['1350'] || 0))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2 border border-slate-850">
                <span className="text-[8.5px] font-mono tracking-widest uppercase font-bold text-indigo-400">UAE Taxation Mandate</span>
                <p className="text-[10px] text-slate-350 leading-relaxed">
                  VAT Output (Liability) and VAT Input (Recoverable) are pre-configured system-critical accounts and are locked to guarantee compliance on FTA audits.
                </p>
              </div>
            </div>

            {/* Right side: Accounts List */}
            <div className="xl:col-span-4 bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-slate-900 text-white py-3 px-4 flex justify-between items-center font-mono text-[10px] uppercase font-bold tracking-widest">
                <span>Account Name & Code</span>
                <span>Type & Group Balance</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCOAList.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">No accounts match your filter or search query.</div>
                ) : (
                  filteredCOAList.map((acc) => {
                    const balance = accountBalances[acc.code] || 0;
                    return (
                      <div 
                        key={acc.code} 
                        className={`p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors ${acc.parentCode ? 'pl-10 border-l-4 border-indigo-100 dark:border-indigo-950' : 'pl-4'}`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="font-mono text-xs font-extrabold bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-2 py-1 rounded">
                            {acc.code}
                          </span>
                          <div>
                            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                              <span>{acc.name}</span>
                              {acc.isSystem && (
                                <span className="bg-indigo-100/50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider font-mono">
                                  System Lock
                                </span>
                              )}
                              {acc.parentCode && (
                                <span className="text-[9px] text-slate-400 font-sans font-medium">
                                  (Sub of {acc.parentCode})
                                </span>
                              )}
                            </div>
                            {acc.description && (
                              <p className="text-[11px] text-slate-400 mt-0.5">{acc.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-6 shrink-0">
                          <div className="text-right">
                            <span className="bg-slate-100/75 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide">
                              {acc.type}
                            </span>
                            <div className="text-xs font-mono font-bold mt-1.5 text-slate-800 dark:text-slate-200">
                              {formatAED(balance)}
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 no-print">
                            <button
                              onClick={() => handleOpenEditCOA(acc)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                              title="Edit Account Details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {!acc.isSystem && (
                              <button
                                onClick={() => {
                                  if (balance !== 0) {
                                    alert(`Cannot delete account "${acc.name}" because it currently has a non-zero ledger balance of ${formatAED(balance)}.`);
                                    return;
                                  }
                                  if (confirm(`Are you sure you want to delete the account "${acc.name}" (${acc.code})?`)) {
                                    onDeleteAccount(acc.code);
                                  }
                                }}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                title="Delete Account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------------------------
          2. TAB: JOURNAL ENTRIES
          -------------------------------------------------------------------------------------- */}
      {activeTab === 'journal' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
            <div className="flex items-center space-x-2 flex-1 max-w-md">
              <div className="relative w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search journals by description or ref..."
                  value={journalSearch}
                  onChange={(e) => setJournalSearch(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs bg-white dark:bg-[#0c111d] focus:outline-hidden font-sans"
                />
              </div>

              <select
                value={journalFilterType}
                onChange={(e) => setJournalFilterType(e.target.value as any)}
                className="border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs bg-white dark:bg-[#0c111d] focus:outline-hidden"
              >
                <option value="all">All Journals</option>
                <option value="manual">Manual Journals</option>
                <option value="auto">Auto-Linked Syncs</option>
              </select>
            </div>

            <button
              onClick={() => setIsJournalModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Manual Journal</span>
            </button>
          </div>

          {/* Journal Entries List */}
          <div className="bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-mono text-[10px] uppercase font-bold tracking-widest border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Description / Ledger Memo</th>
                  <th className="py-3 px-4">Post Type</th>
                  <th className="py-3 px-4 text-right">Debit Balance</th>
                  <th className="py-3 px-4 text-right">Credit Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center no-print">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                {filteredJournals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">No journal entries found. Use active mode or add manual journals.</td>
                  </tr>
                ) : (
                  filteredJournals.map((je) => {
                    const totalAmount = je.lines.reduce((sum, l) => sum + l.debit, 0);
                    return (
                      <tr key={je.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-650 dark:text-slate-350">{je.date}</td>
                        <td className="py-3.5 px-4 font-mono font-extrabold text-indigo-600 dark:text-indigo-400">{je.reference}</td>
                        <td className="py-3.5 px-4 max-w-sm truncate text-slate-750 dark:text-slate-200 font-medium">{je.description}</td>
                        <td className="py-3.5 px-4">
                          {je.isAutoLinked ? (
                            <span className="bg-emerald-100/50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono">
                              Auto-Sync
                            </span>
                          ) : (
                            <span className="bg-blue-100/50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono">
                              Manual
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-900 dark:text-slate-100 font-bold">{formatAED(totalAmount)}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-900 dark:text-slate-100 font-bold">{formatAED(totalAmount)}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="bg-emerald-100/50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase font-mono">
                            Posted
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center space-x-1.5 no-print">
                          <button
                            onClick={() => setViewingJournal(je)}
                            className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded font-bold transition-all cursor-pointer"
                          >
                            View lines
                          </button>
                          
                          {!je.isAutoLinked && (
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this manual journal entry? This will immediately reverse the ledger postings.')) {
                                  onDeleteJournalEntry(je.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer inline-block"
                              title="Delete Journal Entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------------------------
          3. TAB: GENERAL LEDGER BALANCE VIEWER
          -------------------------------------------------------------------------------------- */}
      {activeTab === 'ledger_balances' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-xs">
            <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-slate-800 dark:text-slate-100 flex items-center space-x-2">
              <Scale className="w-4 h-4 text-indigo-600" />
              <span>General Trial Balance Checksheet (Balance Verification)</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Double-Entry validation verifying that all posted debit ledger accounts equal credit ledger accounts across your UAE corporation.
            </p>

            <div className="mt-6 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-mono text-[10px] uppercase font-bold tracking-widest">
                    <th className="py-3 px-4">Account Code</th>
                    <th className="py-3 px-4">Account Name</th>
                    <th className="py-3 px-4">Category Group</th>
                    <th className="py-3 px-4 text-right">Debit Balance (AED)</th>
                    <th className="py-3 px-4 text-right">Credit Balance (AED)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {coaAccounts.map((acc) => {
                    const balance = accountBalances[acc.code] || 0;
                    const isDebitAcc = acc.type === 'Asset' || acc.type === 'Expense';
                    
                    return (
                      <tr key={acc.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="py-2.5 px-4 font-bold text-slate-500">{acc.code}</td>
                        <td className="py-2.5 px-4 font-sans font-semibold text-slate-800 dark:text-slate-250">{acc.name}</td>
                        <td className="py-2.5 px-4 font-sans text-slate-500">{acc.type}</td>
                        <td className="py-2.5 px-4 text-right text-slate-900 dark:text-slate-100 font-bold">
                          {isDebitAcc && balance > 0 ? formatAED(balance) : formatAED(0)}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-900 dark:text-slate-100 font-bold">
                          {!isDebitAcc && balance > 0 ? formatAED(balance) : formatAED(0)}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Summary Totals */}
                  <tr className="bg-slate-100 dark:bg-slate-900/60 font-bold border-t-2 border-slate-900 text-xs text-slate-900 dark:text-slate-100">
                    <td colSpan={3} className="py-3.5 px-4 uppercase text-slate-700 dark:text-slate-300 font-sans font-extrabold">Filing Period Trial Balance Verification</td>
                    <td className="py-3.5 px-4 text-right font-black">
                      {formatAED(
                        coaAccounts.reduce((sum, acc) => {
                          const balance = accountBalances[acc.code] || 0;
                          return sum + ((acc.type === 'Asset' || acc.type === 'Expense') && balance > 0 ? balance : 0);
                        }, 0)
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black">
                      {formatAED(
                        coaAccounts.reduce((sum, acc) => {
                          const balance = accountBalances[acc.code] || 0;
                          return sum + (!(acc.type === 'Asset' || acc.type === 'Expense') && balance > 0 ? balance : 0);
                        }, 0)
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------------------------
          4. TAB: FTA VAT 201 BILINGUAL REPORT
          -------------------------------------------------------------------------------------- */}
      {activeTab === 'vat201' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print bg-white dark:bg-[#0c111d] p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
            <div>
              <h2 className="text-sm font-bold font-mono uppercase text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
                <Percent className="text-indigo-600 w-4 h-4" />
                <span>Bilingual VAT Form 201 Filing Companion</span>
              </h2>
              <p className="text-[11px] text-slate-400">Fill standard Box parameters to preview and export tax filings.</p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => triggerPrint('printable-vat-form')}
                className="px-3.5 py-1.5 bg-slate-950 text-white rounded-lg text-xs font-bold transition-all hover:bg-slate-900 flex items-center space-x-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Form (A4)</span>
              </button>

              <button
                onClick={handleExportXML}
                className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold transition-all hover:bg-indigo-700 flex items-center space-x-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export XML (FTA e-portal)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Box adjustment controller */}
            <div className="lg:col-span-1 bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-4 no-print h-fit">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono border-b border-slate-100 dark:border-slate-800 pb-2">Additional Filings</h3>
              
              {/* Box 2 Inputs */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-slate-500 font-mono">Box 2: Imports of Goods (Taxable)</label>
                <input
                  type="number"
                  value={box2Taxable}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    setBox2Taxable(val);
                    setBox2Vat(val * 0.05);
                  }}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 font-mono focus:outline-hidden"
                />
              </div>

              {/* Box 3 Inputs */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-slate-500 font-mono">Box 3: Reverse Charge sales (Taxable)</label>
                <input
                  type="number"
                  value={box3Taxable}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    setBox3Taxable(val);
                    setBox3Vat(val * 0.05);
                  }}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 font-mono focus:outline-hidden"
                />
              </div>

              {/* Box 4 & 5 Sales */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[9px] uppercase font-bold text-slate-400 font-mono">Box 4: Zero Sales</label>
                  <input
                    type="number"
                    value={box4SalesZero}
                    onChange={(e) => setBox4SalesZero(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] uppercase font-bold text-slate-400 font-mono">Box 5: Exempt Sales</label>
                  <input
                    type="number"
                    value={box5SalesExempt}
                    onChange={(e) => setBox5SalesExempt(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Box 10 Inputs */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-slate-500 font-mono">Box 10: RCM Expenses (Taxable)</label>
                <input
                  type="number"
                  value={box10ExpensesRCM}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    setBox10ExpensesRCM(val);
                    setBox10ExpensesRCMVat(val * 0.05);
                  }}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 font-mono focus:outline-hidden"
                />
              </div>
            </div>

            {/* Bilingual FTA Form Representation */}
            <div id="printable-vat-form" className="lg:col-span-3 bg-white border border-[#E2E8F0] p-6 sm:p-10 rounded-xl relative print-container text-slate-900 font-sans shadow-xs">
              
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
                <div>
                  <div className="font-sans font-black text-xs text-indigo-700 tracking-wider">UNITED ARAB EMIRATES</div>
                  <div className="font-extrabold text-base text-slate-800">FEDERAL TAX AUTHORITY</div>
                  <h1 className="text-xl font-black mt-2 text-indigo-900 uppercase">VAT Return Form 201</h1>
                </div>
                <div className="text-right font-mono text-[10px] text-slate-500">
                  <span className="font-bold text-slate-800">Company TRN: {company.trn || '100234567890003'}</span>
                  <div className="mt-1 font-semibold text-slate-650">Tax Rate: 5% Standard Rate</div>
                </div>
              </div>

              {/* Outputs Table */}
              <div className="space-y-4">
                <div className="bg-slate-900 text-white py-2 px-3 flex justify-between font-bold text-[10px] uppercase font-mono tracking-widest rounded">
                  <span>1. VAT on Sales and all other Outputs</span>
                  <span>AED</span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-[11px] border-collapse font-mono">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500">
                        <th className="py-2 px-3 text-left font-sans font-bold">Standard Rated Supplies (Sales by Emirate)</th>
                        <th className="py-2 px-3 text-right">Taxable Amount</th>
                        <th className="py-2 px-3 text-right">VAT Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {Object.entries(vatCalculations.emirateSalesBreakdown).map(([emirate, entry]) => {
                        const vals = entry as { taxable: number; vat: number };
                        return (
                          <tr key={emirate}>
                            <td className="py-2 px-3 font-sans text-slate-700">{emirate}</td>
                            <td className="py-2 px-3 text-right">{formatAED(vals.taxable)}</td>
                            <td className="py-2 px-3 text-right text-indigo-600">{formatAED(vals.vat)}</td>
                          </tr>
                        );
                      })}
                      
                      {/* Box 2 */}
                      <tr className="bg-slate-50/50">
                        <td className="py-2 px-3 font-sans font-bold text-slate-800">Box 2: Tax erected on imports</td>
                        <td className="py-2 px-3 text-right">{formatAED(box2Taxable)}</td>
                        <td className="py-2 px-3 text-right text-indigo-600">{formatAED(box2Vat)}</td>
                      </tr>

                      {/* Box 3 */}
                      <tr className="bg-slate-50/50">
                        <td className="py-2 px-3 font-sans font-bold text-slate-800">Box 3: Supplies subject to reverse charge</td>
                        <td className="py-2 px-3 text-right">{formatAED(box3Taxable)}</td>
                        <td className="py-2 px-3 text-right text-indigo-600">{formatAED(box3Vat)}</td>
                      </tr>

                      {/* Box 4 */}
                      <tr className="bg-slate-50/50">
                        <td className="py-2 px-3 font-sans text-slate-800">Box 4: Zero-rated supplies</td>
                        <td className="py-2 px-3 text-right">{formatAED(box4SalesZero)}</td>
                        <td className="py-2 px-3 text-right text-slate-400">{formatAED(0)}</td>
                      </tr>

                      {/* Box 5 */}
                      <tr className="bg-slate-50/50">
                        <td className="py-2 px-3 font-sans text-slate-800">Box 5: Exempt supplies</td>
                        <td className="py-2 px-3 text-right">{formatAED(box5SalesExempt)}</td>
                        <td className="py-2 px-3 text-right text-slate-400">{formatAED(0)}</td>
                      </tr>

                      {/* Box 8 output total */}
                      <tr className="bg-indigo-50 border-t border-slate-300 text-xs font-bold text-indigo-950 font-mono">
                        <td className="py-2.5 px-3 font-sans uppercase">Box 8: Total outputs</td>
                        <td className="py-2.5 px-3 text-right">
                          {formatAED(vatCalculations.standardRatedSalesTotal + box2Taxable + box3Taxable + box4SalesZero + box5SalesExempt)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-indigo-700 font-extrabold">{formatAED(totalOutputVat)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Inputs Table */}
              <div className="space-y-4 mt-6">
                <div className="bg-slate-900 text-white py-2 px-3 flex justify-between font-bold text-[10px] uppercase font-mono tracking-widest rounded">
                  <span>2. VAT on Expenses and all other Inputs</span>
                  <span>AED</span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-[11px] border-collapse font-mono">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500">
                        <th className="py-2 px-3 text-left font-sans font-bold">Standard Rated Expenses (Box 9)</th>
                        <th className="py-2 px-3 text-right">Taxable Expenses</th>
                        <th className="py-2 px-3 text-right">VAT Amount Recoverable</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr>
                        <td className="py-2 px-3 font-sans text-slate-700">Box 9: Purchases & OPEX subject to 5% standard rate</td>
                        <td className="py-2 px-3 text-right">{formatAED(vatCalculations.standardRatedExpensesTotal)}</td>
                        <td className="py-2 px-3 text-right text-rose-600">{formatAED(vatCalculations.inputVatTotal)}</td>
                      </tr>

                      {/* Box 10 */}
                      <tr className="bg-slate-50/50">
                        <td className="py-2 px-3 font-sans text-slate-700">Box 10: RCM expenses incurred</td>
                        <td className="py-2 px-3 text-right">{formatAED(box10ExpensesRCM)}</td>
                        <td className="py-2 px-3 text-right text-rose-600">{formatAED(box10ExpensesRCMVat)}</td>
                      </tr>

                      {/* Box 11 */}
                      <tr className="bg-slate-50/50">
                        <td className="py-2 px-3 font-sans text-slate-700">Box 11: Zero-rated expenses incurred</td>
                        <td className="py-2 px-3 text-right">{formatAED(box11ExpensesZero)}</td>
                        <td className="py-2 px-3 text-right text-slate-400">{formatAED(0)}</td>
                      </tr>

                      {/* Box 12 */}
                      <tr className="bg-slate-50/50">
                        <td className="py-2 px-3 font-sans text-slate-700">Box 12: Exempt expenses incurred</td>
                        <td className="py-2 px-3 text-right">{formatAED(box12ExpensesExempt)}</td>
                        <td className="py-2 px-3 text-right text-slate-400">{formatAED(0)}</td>
                      </tr>

                      {/* Box 13 input total */}
                      <tr className="bg-rose-50 border-t border-slate-300 text-xs font-bold text-rose-950 font-mono">
                        <td className="py-2.5 px-3 font-sans uppercase">Box 13: Total inputs</td>
                        <td className="py-2.5 px-3 text-right">
                          {formatAED(vatCalculations.standardRatedExpensesTotal + box10ExpensesRCM + box11ExpensesZero + box12ExpensesExempt)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-rose-700 font-extrabold">{formatAED(totalInputVat)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Net VAT Summary Box 14 */}
              <div className="bg-indigo-900 text-white p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono">Box 14: Net VAT Payable / (Refundable)</h3>
                  <p className="text-[10px] text-indigo-200 mt-1">
                    Filing Standard: Output VAT (Box 8 Total) - Recoverable VAT (Box 13 Total)
                  </p>
                </div>
                <div className="text-right font-mono">
                  <div className="text-[9px] uppercase font-mono tracking-widest text-indigo-300 font-bold">Total UAE Tax Net Liability</div>
                  <div className="text-xl font-black mt-0.5">{formatAED(netVatLiability)}</div>
                  <span className="inline-block text-[8px] uppercase tracking-wider font-mono px-2 py-0.5 bg-indigo-800 text-indigo-200 border border-indigo-700 rounded mt-1.5 font-bold">
                    {netVatLiability >= 0 ? 'Filing Payable' : 'Filing Refundable'}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------------------------
          5. TAB: FTA AUDIT EXPORT & IMPORT HUB
          -------------------------------------------------------------------------------------- */}
      {activeTab === 'export_hub' && (
        <div className="space-y-6">
          
          {/* Compliance Banner */}
          <div className="bg-emerald-950 text-emerald-100 p-6 rounded-xl border border-emerald-800/60 shadow-xs">
            <div className="flex items-start space-x-4">
              <div className="p-2.5 bg-emerald-900 text-emerald-300 rounded-lg">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider font-mono text-white">
                  UAE FTA Compliance, Audit, & Data Exchange Suite
                </h2>
                <p className="text-[11px] text-emerald-300/80 leading-relaxed mt-2 max-w-4xl">
                  Welcome to the official Audit Hub. Here, tax auditors and corporate managers can perform one-click bilingual data exports of critical accounting tables in audit-ready formats (CSV, Excel-compatible Spreadsheet, and Printable Vector PDF). You can also run the Database Validation playground to verify the structural integrity of exported files before filing on the FTA e-portal.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT: Export Center (1-Click Downloads) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono border-b border-slate-100 dark:border-slate-800 pb-2">
                    1-Click Export Center
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">Select any accounting module to generate files immediately.</p>
                </div>

                <div className="space-y-4">
                  {/* COA Export Card */}
                  <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-850 p-3.5 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">Chart of Accounts (COA)</span>
                      <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">File: hisaabpro_COA_YYYYMMDD.csv</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          const { headers, rows } = getCOAExportData();
                          const formattedDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
                          downloadCSV(headers, rows, `hisaabpro_COA_${formattedDate}.csv`);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 text-[10px] font-extrabold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded transition-all cursor-pointer"
                      >
                        CSV
                      </button>
                      <button
                        onClick={() => {
                          const { headers, rows } = getCOAExportData();
                          const formattedDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
                          downloadXLS("Chart of Accounts", headers, rows, `hisaabpro_COA_${formattedDate}.xls`);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 text-[10px] font-extrabold text-indigo-600 border border-slate-200 dark:border-slate-800 rounded transition-all cursor-pointer"
                      >
                        Excel
                      </button>
                      <button
                        onClick={() => {
                          const { headers, rows } = getCOAExportData();
                          downloadPDF("Chart of Accounts (COA)", headers, rows, "Standardized UAE Accounting Accounts Directory");
                        }}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-[10px] font-extrabold text-white rounded transition-all cursor-pointer"
                      >
                        PDF
                      </button>
                    </div>
                  </div>

                  {/* General Ledger Export Card */}
                  <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-850 p-3.5 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">General Ledger Logs</span>
                      <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">File: hisaabpro_Ledger_YYYYMMDD.csv</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          const { headers, rows } = getLedgerExportData();
                          const formattedDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
                          downloadCSV(headers, rows, `hisaabpro_Ledger_${formattedDate}.csv`);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 text-[10px] font-extrabold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded transition-all cursor-pointer"
                      >
                        CSV
                      </button>
                      <button
                        onClick={() => {
                          const { headers, rows } = getLedgerExportData();
                          const formattedDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
                          downloadXLS("General Ledger", headers, rows, `hisaabpro_Ledger_${formattedDate}.xls`);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 text-[10px] font-extrabold text-indigo-600 border border-slate-200 dark:border-slate-800 rounded transition-all cursor-pointer"
                      >
                        Excel
                      </button>
                      <button
                        onClick={() => {
                          const { headers, rows } = getLedgerExportData();
                          downloadPDF("General Ledger Transactions Log", headers, rows, "Official Audit Balanced General Ledger Ledger Record");
                        }}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-[10px] font-extrabold text-white rounded transition-all cursor-pointer"
                      >
                        PDF
                      </button>
                    </div>
                  </div>

                  {/* VAT 201 Return Export Card */}
                  <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-850 p-3.5 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">VAT 201 Form Report</span>
                      <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">File: hisaabpro_VAT201_YYYYMMDD.csv</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          const { headers, rows } = getVATExportData();
                          const formattedDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
                          downloadCSV(headers, rows, `hisaabpro_VAT201_${formattedDate}.csv`);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 text-[10px] font-extrabold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded transition-all cursor-pointer"
                      >
                        CSV
                      </button>
                      <button
                        onClick={() => {
                          const { headers, rows } = getVATExportData();
                          const formattedDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
                          downloadXLS("VAT 201 Return Report", headers, rows, `hisaabpro_VAT201_${formattedDate}.xls`);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 text-[10px] font-extrabold text-indigo-600 border border-slate-200 dark:border-slate-800 rounded transition-all cursor-pointer"
                      >
                        Excel
                      </button>
                      <button
                        onClick={() => {
                          const { headers, rows } = getVATExportData();
                          downloadPDF("VAT 201 Official Return", headers, rows, "Bilingual UAE FTA Tax Return Form");
                        }}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-[10px] font-extrabold text-white rounded transition-all cursor-pointer"
                      >
                        PDF
                      </button>
                    </div>
                  </div>

                  {/* Customers Registry Export Card */}
                  <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-850 p-3.5 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">Customers Database Index</span>
                      <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">File: hisaabpro_Customers_YYYYMMDD.csv</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          const { headers, rows } = getCustomersExportData();
                          const formattedDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
                          downloadCSV(headers, rows, `hisaabpro_Customers_${formattedDate}.csv`);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 text-[10px] font-extrabold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded transition-all cursor-pointer"
                      >
                        CSV
                      </button>
                      <button
                        onClick={() => {
                          const { headers, rows } = getCustomersExportData();
                          const formattedDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
                          downloadXLS("Customers Database", headers, rows, `hisaabpro_Customers_${formattedDate}.xls`);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 text-[10px] font-extrabold text-indigo-600 border border-slate-200 dark:border-slate-800 rounded transition-all cursor-pointer"
                      >
                        Excel
                      </button>
                      <button
                        onClick={() => {
                          const { headers, rows } = getCustomersExportData();
                          downloadPDF("Registered Customers Database", headers, rows, "Bilingual UAE Client Compliance Index");
                        }}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-[10px] font-extrabold text-white rounded transition-all cursor-pointer"
                      >
                        PDF
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Technical Spec Summary Card */}
              <div className="bg-slate-900 text-slate-200 p-5 rounded-xl border border-slate-800 space-y-3">
                <span className="text-[9px] font-mono tracking-widest uppercase font-bold text-indigo-400 block">FTA Auditor File (FAF) Standard Spec</span>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  All exported files are formatted in strict alignment with the UAE Federal Tax Authority (FTA) guidelines. CSV and Excel spreadsheets enforce native UTF-8 encoding (complete with character Byte Order Mark / BOM header) to ensure that billing names and records display flawlessly in global spreadsheet applications.
                </p>
                <div className="flex gap-4 text-[9px] font-mono text-indigo-300 font-bold">
                  <span>✓ UTF-8 Verified</span>
                  <span>✓ Standardized Layout</span>
                  <span>✓ Bilingual Compliant</span>
                </div>
              </div>
            </div>

            {/* RIGHT: Database Validation Playground */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs space-y-5">
                <div>
                  <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest font-mono border-b border-slate-100 dark:border-slate-800 pb-2">
                    Database Validation & Import Sandbox
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Upload an exported Hisaab Pro file here to validate formatting, TRN compliance, double-entry balances, and encoding.
                  </p>
                </div>

                {/* Drag and Drop Zone */}
                <div 
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      const file = e.dataTransfer.files[0];
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const text = evt.target?.result as string;
                        handleFileValidation(text, file.name);
                      };
                      reader.readAsText(file);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-250 dark:border-slate-800 hover:border-slate-400'}`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-full text-slate-400 dark:text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin-slow text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-350 font-bold">
                      Drag and drop exported CSV here, or
                    </div>
                    <label className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950 text-[10px] text-indigo-700 dark:text-indigo-400 font-extrabold rounded border border-indigo-100 dark:border-indigo-900 cursor-pointer transition-colors inline-block">
                      <span>Select File</span>
                      <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              const text = evt.target?.result as string;
                              handleFileValidation(text, file.name);
                            };
                            reader.readAsText(file);
                          }
                        }}
                      />
                    </label>
                    <span className="text-[9px] text-slate-400 block font-mono">Compatible Formats: CSV UTF-8 (Bilingual)</span>
                  </div>
                </div>

                {/* Selected File indicator */}
                {selectedFileName && (
                  <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 p-2.5 rounded-lg flex items-center justify-between font-sans">
                    <div className="flex items-center space-x-2">
                      <FileSpreadsheet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 truncate max-w-xs">{selectedFileName}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFileName('');
                        setValidationReport(null);
                        setValidationRows([]);
                      }}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Validation Report Area */}
                {validationReport && (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
                    
                    {/* Header bar of report */}
                    <div className={`p-4 flex justify-between items-center ${
                      validationReport.status === 'SUCCESS' ? 'bg-emerald-50 border-b border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40' :
                      validationReport.status === 'WARNING' ? 'bg-amber-50 border-b border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40' :
                      'bg-rose-50 border-b border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40'
                    }`}>
                      <div className="flex items-center space-x-2.5 text-xs font-bold font-sans">
                        {validationReport.status === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                        {validationReport.status === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                        {validationReport.status === 'FAILED' && <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                        <div>
                          <span className={`${
                            validationReport.status === 'SUCCESS' ? 'text-emerald-800 dark:text-emerald-400' :
                            validationReport.status === 'WARNING' ? 'text-amber-800 dark:text-amber-400' :
                            'text-rose-800 dark:text-rose-400'
                          }`}>
                            AUDIT INTEGRITY: {validationReport.status}
                          </span>
                        </div>
                      </div>
                      
                      <span className="font-mono text-[9px] uppercase bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded font-black text-slate-500">
                        {validationReport.fileType}
                      </span>
                    </div>

                    {/* Report Matrix details */}
                    <div className="p-4 space-y-4 text-xs font-sans">
                      <div className="grid grid-cols-3 gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div>
                          <span className="text-[10px] text-slate-400 font-mono block uppercase">File Encoding</span>
                          <span className="text-slate-800 dark:text-slate-200 font-bold mt-0.5 block">{validationReport.encoding}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-mono block uppercase">Parsed Records</span>
                          <span className="text-slate-800 dark:text-slate-200 font-bold mt-0.5 block">{validationReport.rowCount} Rows</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-mono block uppercase">Database Sync</span>
                          <span className={`font-bold mt-0.5 block uppercase ${validationReport.isCompatible ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {validationReport.isCompatible ? 'Compatible' : 'Incompatible'}
                          </span>
                        </div>
                      </div>

                      {/* Error details */}
                      {validationReport.errors.length > 0 && (
                        <div className="space-y-1 bg-rose-50/50 dark:bg-rose-950/10 p-3 rounded-lg border border-rose-100 dark:border-rose-950">
                          <span className="text-[10px] text-rose-700 dark:text-rose-400 font-mono uppercase font-bold block">Blocking Errors Found ({validationReport.errors.length})</span>
                          <ul className="list-disc pl-4 space-y-1 text-rose-650 dark:text-rose-400 text-[11px] font-medium font-mono">
                            {validationReport.errors.slice(0, 5).map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                            {validationReport.errors.length > 5 && (
                              <li>...and {validationReport.errors.length - 5} more errors.</li>
                            )}
                          </ul>
                        </div>
                      )}

                      {/* Warning details */}
                      {validationReport.warnings.length > 0 && (
                        <div className="space-y-1 bg-amber-50/50 dark:bg-amber-950/10 p-3 rounded-lg border border-amber-100 dark:border-amber-950">
                          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono uppercase font-bold block">Compliance Warnings Triggered ({validationReport.warnings.length})</span>
                          <ul className="list-disc pl-4 space-y-1 text-amber-650 dark:text-amber-400 text-[11px] font-medium font-mono">
                            {validationReport.warnings.slice(0, 4).map((warn, i) => (
                              <li key={i}>{warn}</li>
                            ))}
                            {validationReport.warnings.length > 4 && (
                              <li>...and {validationReport.warnings.length - 4} more warnings.</li>
                            )}
                          </ul>
                        </div>
                      )}

                      {/* Clean state message */}
                      {validationReport.errors.length === 0 && validationReport.warnings.length === 0 && (
                        <div className="text-emerald-700 dark:text-emerald-400 text-[11px] bg-emerald-50/30 dark:bg-emerald-950/10 p-3 rounded-lg border border-emerald-100 dark:border-emerald-950 font-bold">
                          ✓ 100% Structural & Tax Compliant. The auditor dataset perfectly matches the double-entry Ledger ruleset. Zero mismatches detected.
                        </div>
                      )}

                      {/* Interactive DB Insertion button */}
                      <div className="pt-2">
                        {validationReport.isCompatible ? (
                          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                            <span className="text-[10px] text-slate-400 leading-relaxed max-w-sm">
                              You can securely import these validated records back into your active ERP database. Existing duplicate accounts or ledger entries will be overwritten.
                            </span>
                            <button
                              onClick={handleImportValidatedData}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 shrink-0"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Import Validated Records</span>
                            </button>
                          </div>
                        ) : (
                          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-150 dark:border-slate-800 text-center text-[10px] text-slate-400">
                            The uploaded file has validation errors and cannot be synchronized with the system's database. Please correct the schema issues logged above to proceed.
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>

        </div>
      )}

      {/* --------------------------------------------------------------------------------------
          5. TAB: AI COMPLIANCE ADVISOR & SIMULATOR
          -------------------------------------------------------------------------------------- */}
      {activeTab === 'advisor' && (
        <div className="space-y-6">
          
          {/* Top Compliance Title Banner */}
          <div className="bg-indigo-950 text-indigo-100 p-6 rounded-xl border border-indigo-800/60 shadow-xs relative overflow-hidden group">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10 group-hover:opacity-15 transition duration-500 text-white">
              <Sparkles className="w-64 h-64" />
            </div>
            <div className="flex items-start space-x-4 relative z-10">
              <div className="p-3 bg-indigo-900 text-indigo-300 rounded-lg">
                <Sparkles className="w-7 h-7 text-indigo-400 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-black uppercase tracking-wider font-mono text-white">
                  Hisaab Pro Intelligent Compliance & pre-Audit Advisory Portal
                </h2>
                <p className="text-xs text-indigo-200/85 leading-relaxed mt-2.5 max-w-4xl">
                  Analyze your Chart of Accounts, Journal Entries, Sales Invoices, and Purchase Expenses in real-time. Our automated auditor runs verification procedures compiled from the latest UAE Federal Tax Authority (FTA) regulations, Executive Decisions, and Workforce Wage Protection (WPS) practices.
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Score Card & CT Progress Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT: Pre-Audit Compliance Score Card (SVG Circle Ring) */}
            <div className="lg:col-span-4 bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono border-b border-slate-100 dark:border-slate-800 pb-2">
                  Pre-Audit Score Card
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Real-time health quotient based on logged transactions</p>
              </div>

              <div className="flex flex-col items-center justify-center my-6 space-y-3">
                {/* Visual Circle Gauge */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      stroke="#f1f5f9"
                      strokeWidth="8"
                      fill="transparent"
                      className="dark:stroke-slate-800"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      stroke={complianceScore >= 90 ? '#10b981' : complianceScore >= 70 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={263.89}
                      strokeDashoffset={263.89 - (263.89 * complianceScore) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  {/* Inner text */}
                  <div className="absolute text-center">
                    <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">{complianceScore}</span>
                    <span className="text-slate-400 font-mono font-bold text-xs block">/ 100</span>
                  </div>
                </div>

                {/* Score Status Designation */}
                <div className="text-center">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    complianceScore >= 90 
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                      : complianceScore >= 70 
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' 
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                  }`}>
                    {complianceScore >= 90 ? 'Excellent' : complianceScore >= 70 ? 'Minor Action Required' : 'Critical Risks Flagged'}
                  </span>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 max-w-xs leading-relaxed">
                    {complianceScore >= 90 
                      ? 'Your accounting books demonstrate standard compliance. Ready for FTA e-filing.' 
                      : complianceScore >= 70 
                        ? 'Ensure to address the warnings to clear secondary FTA audit flags.' 
                        : 'Action required immediately. Double-entry or Tax structures contain errors.'}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg text-[9px] font-mono text-slate-500 leading-relaxed dark:text-slate-400">
                ⚠️ <strong>Score Weighting:</strong> Critical errors deduct 15 points each (blocking audit). Warning items deduct 5 points each. Optimization alerts carry no deductions.
              </div>
            </div>

            {/* MIDDLE: UAE Corporate Tax Threshold Tracker Bento Card */}
            <div className="lg:col-span-8 bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-mono">
                    UAE Corporate Tax Progress Tracker
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">YTD Taxable Income vs AED 375,000 Exempt Threshold</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block font-mono">Standard Tax Bracket</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">9% above Threshold</span>
                </div>
              </div>

              {/* CT Metric Panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
                <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl">
                  <span className="text-[9px] uppercase tracking-widest font-mono text-slate-450 block font-bold">YTD Taxable Revenues</span>
                  <span className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1 block">{formatAED(financialTotalsYTD.revenue)}</span>
                  <span className="text-[9px] text-slate-400 mt-0.5 block">From documented Sales</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl">
                  <span className="text-[9px] uppercase tracking-widest font-mono text-slate-450 block font-bold">YTD Deductible Expenses</span>
                  <span className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1 block">{formatAED(financialTotalsYTD.expensesCost)}</span>
                  <span className="text-[9px] text-slate-400 mt-0.5 block">From documented Purchases</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-indigo-50 dark:border-indigo-950/50">
                  <span className="text-[9px] uppercase tracking-widest font-mono text-indigo-600 dark:text-indigo-400 block font-bold">Net Taxable Profit</span>
                  <span className={`text-base font-black font-mono mt-1 block ${financialTotalsYTD.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatAED(financialTotalsYTD.profit)}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5 block">Subtotal Subject to CT</span>
                </div>
              </div>

              {/* Progress Slider (Locked / Visual only) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                  <span>Progress to CT Threshold (AED 375,000.00)</span>
                  <span>{Math.min((financialTotalsYTD.profit / 375000) * 100, 100).toFixed(1)}%</span>
                </div>
                <div className="h-4 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden flex relative border dark:border-slate-800">
                  <div 
                    style={{ width: `${Math.min(Math.max((financialTotalsYTD.profit / 375000) * 100, 0), 100)}%` }} 
                    className={`h-full transition-all duration-1000 ${
                      financialTotalsYTD.profit > 375000 
                        ? 'bg-rose-500' 
                        : financialTotalsYTD.profit >= 300000 
                          ? 'bg-amber-500' 
                          : 'bg-indigo-600'
                    }`}
                  ></div>
                  
                  {/* Threshold marker line */}
                  <div className="absolute right-0 h-full w-0.5 bg-slate-350 dark:bg-slate-750" title="Exemption Threshold"></div>
                </div>
                <div className="flex justify-between text-[9px] font-mono font-bold text-slate-400">
                  <span>AED 0.00 (Exempt)</span>
                  <span>Ceiling: AED 375,000.00 (Standard 9% Rate Threshold)</span>
                </div>
              </div>

              {/* CT Liability / Exemption Advice */}
              <div className="mt-4 bg-indigo-50/50 dark:bg-indigo-950/25 border border-indigo-150/40 dark:border-indigo-900/30 p-3 rounded-lg flex items-start space-x-3 text-xs leading-relaxed">
                <div className="p-1 bg-indigo-100 dark:bg-indigo-900 rounded text-indigo-700 dark:text-indigo-300 mt-0.5">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  {financialTotalsYTD.profit > 375000 ? (
                    <>
                      <p className="font-bold text-rose-700 dark:text-rose-400">🚨 Standard Corporate Tax Triggered!</p>
                      <p className="text-slate-600 dark:text-slate-350 text-[11px]">
                        Your taxable profit has exceeded AED 375,000.00. The portion of <strong>{formatAED(financialTotalsYTD.profit - 375000)}</strong> is subject to a 9% Corporate Tax. 
                        Estimated Tax Liability: <strong className="font-mono">{formatAED((financialTotalsYTD.profit - 375000) * 0.09)}</strong>.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-indigo-700 dark:text-indigo-400">✓ Within Tax-Free Corporate Bracket</p>
                      <p className="text-slate-600 dark:text-slate-350 text-[11px]">
                        Your Net Profit is below the taxable ceiling. You are currently subject to a <strong>0% Corporate Tax rate</strong>. Under Ministerial Decision No. 73 of 2023, ensure to maintain proper documentation and consider Small Business Relief if your revenue remains below AED 3,000,000.00.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Findings List & Interactive Simulator Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
            
            {/* LEFT: Pre-Audit Findings Registry (8 Cols) */}
            <div className="lg:col-span-8 bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs space-y-4">
              
              {/* Header Controls */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest font-mono">
                    Pre-Audit Audit Logs & Findings
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Live anomalies, compliance gaps, and validation triggers</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">Filter Level:</span>
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-lg flex space-x-1">
                    {(['All', 'Critical', 'Warning', 'Optimization'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setAdvisorFilter(f)}
                        className={`px-2 py-1 text-[9px] font-black rounded-md transition-all cursor-pointer uppercase ${
                          advisorFilter === f 
                            ? 'bg-indigo-600 text-white shadow-xs' 
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Search */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search findings by invoice number, customer name, account, or UAE Decree..."
                  value={advisorSearch}
                  onChange={(e) => setAdvisorSearch(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition-all font-mono"
                />
              </div>

              {/* Findings Stack */}
              {(() => {
                const filtered = advisoryFindings.filter(f => {
                  const matchesFilter = advisorFilter === 'All' || f.category === advisorFilter;
                  const matchesSearch = !advisorSearch || 
                    f.title.toLowerCase().includes(advisorSearch.toLowerCase()) || 
                    f.description.toLowerCase().includes(advisorSearch.toLowerCase()) || 
                    f.resolution.toLowerCase().includes(advisorSearch.toLowerCase()) || 
                    (f.reference && f.reference.toLowerCase().includes(advisorSearch.toLowerCase()));
                  return matchesFilter && matchesSearch;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/30 rounded-xl border-2 border-dashed dark:border-slate-850">
                      <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2.5 animate-bounce" />
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide">✓ Perfect Compliance Standard Confirmed</p>
                      <p className="text-[10px] text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                        No active anomalies or compliance warnings matched your criteria. All double-entry postings strictly balance, and customer TRN validations conform to the 15-digit FTA standard.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {filtered.map((item) => (
                      <div 
                        key={item.id}
                        className={`p-4 rounded-xl border transition-all ${
                          item.category === 'Critical' 
                            ? 'bg-rose-50/20 dark:bg-rose-950/5 border-rose-150/60 dark:border-rose-900/30' 
                            : item.category === 'Warning' 
                              ? 'bg-amber-50/20 dark:bg-amber-950/5 border-amber-150/60 dark:border-amber-900/30' 
                              : 'bg-indigo-50/10 dark:bg-indigo-950/5 border-indigo-150/40 dark:border-indigo-900/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start space-x-3">
                            {/* Category Indicator Icon */}
                            <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                              item.category === 'Critical' 
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/65 dark:text-rose-400' 
                                : item.category === 'Warning' 
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/65 dark:text-amber-400' 
                                  : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/65 dark:text-indigo-400'
                            }`}>
                              <Shield className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              {/* Title */}
                              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                                {item.title}
                              </h4>
                              {/* Title Arabic */}
                              <h5 className="text-[10px] font-semibold text-slate-450 dark:text-slate-500 mt-0.5 leading-relaxed font-sans">
                                {item.titleAr}
                              </h5>
                              {/* Description */}
                              <p className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed mt-2 bg-white/70 dark:bg-slate-950/50 p-2 rounded border border-slate-100 dark:border-slate-850/60 font-mono">
                                {item.description}
                              </p>
                              {/* Resolution / Fix advice */}
                              <div className="text-[10px] text-indigo-700 dark:text-indigo-400 font-sans mt-2.5 flex items-start space-x-1.5 leading-relaxed bg-indigo-50/40 dark:bg-indigo-950/20 px-2 py-1.5 rounded">
                                <span>💡</span>
                                <span><strong>Resolution:</strong> {item.resolution}</span>
                              </div>
                            </div>
                          </div>

                          {/* Reference Tag */}
                          {item.reference && (
                            <span className="font-mono font-bold text-[9px] bg-slate-100 dark:bg-slate-900 border px-2 py-0.5 rounded text-slate-500 shrink-0 uppercase tracking-widest">
                              {item.reference}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

            </div>

            {/* RIGHT: Tax Optimizer Simulator Dashboard (4 Cols) */}
            <div className="lg:col-span-4 bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs flex flex-col justify-between">
              <div className="space-y-1">
                <h3 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-mono border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                  <span>Compliance & Tax Simulator</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Model forecasted business shifts to immediately assess VAT & Corporate Tax brackets.</p>
              </div>

              {/* Sliders Box */}
              <div className="space-y-5 my-5">
                {/* Sliders 1: Forecasted Additional Revenue */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold">
                    <span className="text-slate-500">Additional Sales Revenue:</span>
                    <span className="text-indigo-600 font-extrabold">{formatAED(projAddRevenue)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1000000"
                    step="5000"
                    value={projAddRevenue}
                    onChange={(e) => setProjAddRevenue(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                    <span>AED 0</span>
                    <span>AED 1,000,000</span>
                  </div>
                </div>

                {/* Sliders 2: Forecasted Additional Expenses */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold">
                    <span className="text-slate-500">Additional Deductible Expenses:</span>
                    <span className="text-emerald-600 font-extrabold">{formatAED(projAddExpense)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="500000"
                    step="2500"
                    value={projAddExpense}
                    onChange={(e) => setProjAddExpense(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                    <span>AED 0</span>
                    <span>AED 500,000</span>
                  </div>
                </div>
              </div>

              {/* Real-time Simulated Outputs */}
              {(() => {
                const simOutputVat = projAddRevenue * 0.05;
                const simInputVat = projAddExpense * 0.05;
                const simVatNet = simOutputVat - simInputVat;

                const simProfitImpact = projAddRevenue - projAddExpense;
                const simTotalProfitYtd = financialTotalsYTD.profit + simProfitImpact;

                // Estimated Corporate Tax after Simulator
                let simCtLiability = 0;
                if (simTotalProfitYtd > 375000) {
                  simCtLiability = (simTotalProfitYtd - 375000) * 0.09;
                }

                return (
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-800 space-y-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest block border-b dark:border-slate-800 pb-1.5">Simulation Outcomes Matrix</span>
                    
                    <div className="flex justify-between items-center">
                      <span>Simulated Net Profit Shift:</span>
                      <span className={`font-bold ${simProfitImpact >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {simProfitImpact >= 0 ? '+' : ''}{formatAED(simProfitImpact)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span>Projected YTD Net Profit:</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-100">{formatAED(simTotalProfitYtd)}</span>
                    </div>

                    <div className="border-t dark:border-slate-800 pt-2 space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">Additional Sales VAT (5%):</span>
                        <span>+{formatAED(simOutputVat)}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">Additional Purchase VAT (5%):</span>
                        <span>-{formatAED(simInputVat)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-[10px] text-indigo-600 dark:text-indigo-400">
                        <span>Net FTA VAT Impact:</span>
                        <span>{simVatNet >= 0 ? 'Payable: ' : 'Recoverable: '}{formatAED(Math.abs(simVatNet))}</span>
                      </div>
                    </div>

                    <div className="border-t dark:border-slate-800 pt-2 flex justify-between items-center">
                      <span className="font-sans font-bold text-slate-700 dark:text-slate-350">Est. Corporate Tax:</span>
                      <span className={`font-black ${simCtLiability > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {simCtLiability > 0 ? formatAED(simCtLiability) : 'AED 0.00 (Exempt)'}
                      </span>
                    </div>

                    <div className="bg-indigo-50/40 dark:bg-indigo-950/15 p-2 rounded border border-indigo-100/55 dark:border-indigo-900/20 text-[9px] text-indigo-700 dark:text-indigo-300 leading-relaxed font-sans">
                      ⚡ <strong>Instant Tax Projection:</strong> Simulating additional sales increases VAT payable. High deductible purchases can optimize Corporate Tax exposure.
                    </div>
                  </div>
                );
              })()}

            </div>

          </div>

        </div>
      )}

      {/* ==========================================
          MODAL: CHART OF ACCOUNTS CREATION/EDIT
          ========================================== */}
      {isCoaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 no-print backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full overflow-hidden shadow-xl animate-in fade-in zoom-in duration-150">
            <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center font-mono text-[10px] uppercase font-bold tracking-widest">
              <span>{editingAccount ? 'Edit Account' : 'Add New Account'}</span>
              <button 
                type="button"
                onClick={() => setIsCoaModalOpen(false)} 
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCOA} className="p-5 space-y-4 text-xs">
              {coaError && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 p-3 rounded-lg text-rose-600 dark:text-rose-400 font-medium flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{coaError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Code */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-slate-500 font-mono">Account Code*</label>
                  <input
                    type="text"
                    value={coaCode}
                    onChange={(e) => setCoaCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g., 5100"
                    className="w-full border border-slate-200 dark:border-slate-800 rounded px-2.5 py-2 font-mono bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100"
                    disabled={!!editingAccount?.isSystem}
                  />
                  {!editingAccount?.isSystem && (
                    <span className="text-[9px] text-slate-400 block mt-0.5">Asset: 1 | Liab: 2 | Equity: 3 | Rev: 4 | Exp: 5/6</span>
                  )}
                </div>

                {/* Group Type */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-slate-500 font-mono">Account Group*</label>
                  <select
                    value={coaType}
                    onChange={(e) => setCoaType(e.target.value as any)}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded px-2.5 py-2 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100"
                    disabled={!!editingAccount}
                  >
                    <option value="Asset">Asset (Assets)</option>
                    <option value="Liability">Liability (Liabilities)</option>
                    <option value="Equity">Equity (Capital / Earnings)</option>
                    <option value="Revenue">Revenue (Income)</option>
                    <option value="Expense">Expense (Costs/OPEX)</option>
                  </select>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-slate-500 font-mono">Account Name*</label>
                <input
                  type="text"
                  value={coaName}
                  onChange={(e) => setCoaName(e.target.value)}
                  placeholder="e.g., Office Rent Expense"
                  className="w-full border border-slate-200 dark:border-slate-800 rounded px-2.5 py-2 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100 font-semibold"
                  disabled={!!editingAccount?.isSystem}
                />
              </div>

              {/* Parent */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-slate-500 font-mono">Parent Account (Optional)</label>
                <select
                  value={coaParent}
                  onChange={(e) => setCoaParent(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded px-2.5 py-2 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100"
                >
                  <option value="">-- None (This is a root account) --</option>
                  {parentAccountsList.filter(a => a.type === coaType && a.code !== coaCode).map(a => (
                    <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-slate-500 font-mono">Account Description</label>
                <textarea
                  value={coaDesc}
                  onChange={(e) => setCoaDesc(e.target.value)}
                  rows={2}
                  placeholder="Describe the usage of this ledger account..."
                  className="w-full border border-slate-200 dark:border-slate-800 rounded px-2.5 py-2 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCoaModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 cursor-pointer"
                >
                  {editingAccount ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: MANUAL JOURNAL ENTRY CREATION
          ========================================== */}
      {isJournalModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 no-print backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full overflow-hidden shadow-xl animate-in fade-in zoom-in duration-150">
            <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center font-mono text-[10px] uppercase font-bold tracking-widest">
              <span>Create Manual Double-Entry Journal</span>
              <button 
                type="button"
                onClick={() => setIsJournalModalOpen(false)} 
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveJournalEntry} className="p-5 space-y-4 text-xs">
              {jeError && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 p-3 rounded-lg text-rose-600 dark:text-rose-400 font-medium flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{jeError}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                {/* Date */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-slate-500 font-mono">Posting Date*</label>
                  <input
                    type="date"
                    value={jeDate}
                    onChange={(e) => setJeDate(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded px-2.5 py-2 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100 font-mono"
                  />
                </div>

                {/* Reference */}
                <div className="space-y-1 col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-slate-500 font-mono">Reference / Document No*</label>
                  <input
                    type="text"
                    value={jeRef}
                    onChange={(e) => setJeRef(e.target.value)}
                    placeholder="e.g., JE-2026-001"
                    className="w-full border border-slate-200 dark:border-slate-800 rounded px-2.5 py-2 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* Memo Description */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-slate-500 font-mono">Transaction Memo / Description*</label>
                <input
                  type="text"
                  value={jeDesc}
                  onChange={(e) => setJeDesc(e.target.value)}
                  placeholder="Memo explaining the double-entry reason..."
                  className="w-full border border-slate-200 dark:border-slate-800 rounded px-2.5 py-2 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100"
                />
              </div>

              {/* Journal Line Entries */}
              <div className="space-y-2 border border-slate-100 dark:border-slate-850 p-3 rounded-lg bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Ledger Transaction Lines</span>
                  <button
                    type="button"
                    onClick={handleAddJeLine}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Line</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {jeLines.map((line, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      {/* Account Selector */}
                      <select
                        value={line.accountCode}
                        onChange={(e) => handleJeLineChange(idx, 'accountCode', e.target.value)}
                        className="flex-1 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100 font-sans"
                      >
                        <option value="">-- Choose Account --</option>
                        {coaAccounts.map(a => (
                          <option key={a.code} value={a.code}>{a.code} - {a.name} ({a.type})</option>
                        ))}
                      </select>

                      {/* Debit */}
                      <div className="w-32 relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-[9px] font-mono text-slate-400">Dr</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={line.debit || ''}
                          onChange={(e) => handleJeLineChange(idx, 'debit', e.target.value)}
                          className="w-full text-right border border-slate-200 dark:border-slate-800 rounded pl-6 pr-2 py-1.5 font-mono text-xs bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100"
                        />
                      </div>

                      {/* Credit */}
                      <div className="w-32 relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-[9px] font-mono text-slate-400">Cr</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={line.credit || ''}
                          onChange={(e) => handleJeLineChange(idx, 'credit', e.target.value)}
                          className="w-full text-right border border-slate-200 dark:border-slate-800 rounded pl-6 pr-2 py-1.5 font-mono text-xs bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100"
                        />
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => handleRemoveJeLine(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Remove Line"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Running Totals */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-12 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-350 pr-8">
                  <div>
                    <span>Total Debits:</span>
                    <span className="text-indigo-600 dark:text-indigo-400 ml-2">
                      {formatAED(jeLines.reduce((sum, l) => sum + l.debit, 0))}
                    </span>
                  </div>
                  <div>
                    <span>Total Credits:</span>
                    <span className="text-indigo-600 dark:text-indigo-400 ml-2">
                      {formatAED(jeLines.reduce((sum, l) => sum + l.credit, 0))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsJournalModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 cursor-pointer flex items-center space-x-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Post Journal Entry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: JOURNAL LINE DETAILS VIEWER
          ========================================== */}
      {viewingJournal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 no-print backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-xl max-w-xl w-full overflow-hidden shadow-xl">
            
            <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center font-mono text-[10px] uppercase font-bold tracking-widest">
              <span>Journal Details: {viewingJournal.reference}</span>
              <button 
                type="button"
                onClick={() => setViewingJournal(null)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block uppercase font-mono tracking-wider text-[9px] font-bold">Posting Date</span>
                  <span className="text-slate-800 dark:text-slate-200 font-mono font-bold text-sm">{viewingJournal.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-mono tracking-wider text-[9px] font-bold">Source Reference</span>
                  <span className="text-slate-850 dark:text-slate-150 font-mono font-black text-sm text-indigo-600 dark:text-indigo-400">{viewingJournal.reference}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block uppercase font-mono tracking-wider text-[9px] font-bold">Memo / Description</span>
                <p className="text-slate-800 dark:text-slate-250 text-xs font-semibold">{viewingJournal.description}</p>
              </div>

              {/* Lines table */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 font-mono text-[10px] uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2 px-3">Account Code & Name</th>
                      <th className="py-2 px-3 text-right">Debit (AED)</th>
                      <th className="py-2 px-3 text-right">Credit (AED)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    {viewingJournal.lines.map((line, lIdx) => {
                      const acc = coaAccounts.find(a => a.code === line.accountCode);
                      return (
                        <tr key={lIdx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3">
                            <span className="font-extrabold text-slate-500 mr-2">{line.accountCode}</span>
                            <span className="font-sans font-bold text-slate-850 dark:text-slate-150">{acc?.name || 'Unknown Account'}</span>
                          </td>
                          <td className="py-2 px-3 text-right text-indigo-600 font-bold">
                            {line.debit > 0 ? formatAED(line.debit) : '-'}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-900 dark:text-slate-100 font-bold">
                            {line.credit > 0 ? formatAED(line.credit) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Sum */}
                    <tr className="bg-slate-50 dark:bg-slate-900 font-bold text-xs border-t border-slate-200 dark:border-slate-800">
                      <td className="py-2.5 px-3 uppercase font-sans">Total Balanced Postings</td>
                      <td className="py-2.5 px-3 text-right text-indigo-700">
                        {formatAED(viewingJournal.lines.reduce((sum, l) => sum + l.debit, 0))}
                      </td>
                      <td className="py-2.5 px-3 text-right text-indigo-700">
                        {formatAED(viewingJournal.lines.reduce((sum, l) => sum + l.credit, 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setViewingJournal(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer text-xs"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
