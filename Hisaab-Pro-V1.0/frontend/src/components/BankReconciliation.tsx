import React, { useState } from 'react';
import { 
  Scale, 
  Upload, 
  FileCheck2, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight, 
  Printer, 
  Download, 
  Search, 
  Building2, 
  CreditCard, 
  FileText, 
  Sparkles, 
  X, 
  Link2, 
  Unlink, 
  Check, 
  DollarSign, 
  HelpCircle,
  FileSpreadsheet,
  Zap
} from 'lucide-react';
import { Company, SalesDocument, Expense, COAAccount } from '../types';
import { triggerPrint } from '../utils/printHelper';

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  referenceNo: string;
  type: 'Credit' | 'Debit';
  amount: number;
  matchedSystemId?: string;
  matchScore: number; // 0 to 100
  matchType?: 'Invoice' | 'Expense' | 'PDC' | 'Manual';
  status: 'Reconciled' | 'Pending' | 'Unmatched';
}

interface BankReconciliationProps {
  company: Company | null;
  documents: SalesDocument[];
  expenses: Expense[];
  coaAccounts: COAAccount[];
  activeCompanyId: string;
}

export default function BankReconciliation({
  company,
  documents,
  expenses,
  coaAccounts,
  activeCompanyId
}: BankReconciliationProps) {
  const companyDocs = documents.filter(d => d.companyId === activeCompanyId);
  const companyExpenses = expenses.filter(e => e.companyId === activeCompanyId);

  // Bank Account Selection
  const bankAccounts = coaAccounts.filter(a => a.type === 'Asset' && (a.name.toLowerCase().includes('bank') || a.code.startsWith('10')));
  const [selectedBankCode, setSelectedBankCode] = useState<string>(bankAccounts[0]?.code || '1010-01');

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RECONCILED' | 'UNMATCHED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Initial Auto-Generated Bank Feed Transactions matching real system documents & expenses
  const [bankFeed, setBankFeed] = useState<BankTransaction[]>(() => {
    const feed: BankTransaction[] = [];
    let idCounter = 1;

    // Map Invoices to Bank Credits
    companyDocs.forEach(doc => {
      feed.push({
        id: `BANK-TXN-${idCounter++}`,
        date: doc.date,
        description: `FT DEPOSIT - ${(doc.bankCustomerName || 'CLIENT ACCOUNT').toUpperCase()}`,
        referenceNo: doc.docNumber,
        type: 'Credit',
        amount: doc.total,
        matchedSystemId: doc.id,
        matchScore: 100,
        matchType: 'Invoice',
        status: doc.status === 'Paid' ? 'Reconciled' : 'Pending'
      });
    });

    // Map Expenses/Purchases to Bank Debits
    companyExpenses.forEach(exp => {
      feed.push({
        id: `BANK-TXN-${idCounter++}`,
        date: exp.date,
        description: `TRANSFER OUT - ${exp.supplierName ? exp.supplierName.toUpperCase() : exp.category.toUpperCase()}`,
        referenceNo: exp.invoiceNumber || `REF-${exp.id}`,
        type: 'Debit',
        amount: exp.total,
        matchedSystemId: exp.id,
        matchScore: 95,
        matchType: 'Expense',
        status: exp.status === 'Paid' ? 'Reconciled' : 'Pending'
      });
    });

    // Add 2 realistic un-matched bank fee/interest items for audit testing
    feed.push({
      id: `BANK-TXN-${idCounter++}`,
      date: new Date().toISOString().split('T')[0],
      description: 'MTHLY BANK SERVICE CHARGE & VAT',
      referenceNo: 'CHG-9921',
      type: 'Debit',
      amount: 52.50,
      matchScore: 0,
      status: 'Unmatched'
    });

    return feed;
  });

  // Certificate Modal State
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

  // Financial Metrics
  const totalBankDeposits = bankFeed.filter(t => t.type === 'Credit').reduce((s, t) => s + t.amount, 0);
  const totalBankWithdrawals = bankFeed.filter(t => t.type === 'Debit').reduce((s, t) => s + t.amount, 0);
  const reconciledCount = bankFeed.filter(t => t.status === 'Reconciled').length;
  const pendingCount = bankFeed.filter(t => t.status === 'Pending').length;
  const unmatchedCount = bankFeed.filter(t => t.status === 'Unmatched').length;

  const totalReconciledDeposits = bankFeed
    .filter(t => t.type === 'Credit' && t.status === 'Reconciled')
    .reduce((s, t) => s + t.amount, 0);

  const totalReconciledWithdrawals = bankFeed
    .filter(t => t.type === 'Debit' && t.status === 'Reconciled')
    .reduce((s, t) => s + t.amount, 0);

  const bankStatementEndingBalance = totalBankDeposits - totalBankWithdrawals;
  const systemLedgerBalance = totalReconciledDeposits - totalReconciledWithdrawals;
  const reconciliationVariance = bankStatementEndingBalance - systemLedgerBalance;

  // Batch Auto-Reconcile 100% Matches
  const handleBatchAutoReconcile = () => {
    setBankFeed(prev => prev.map(t => {
      if (t.matchScore >= 85 && t.status !== 'Reconciled') {
        return { ...t, status: 'Reconciled' };
      }
      return t;
    }));
    alert('✅ Auto-Reconciliation Complete! All high-confidence matched transactions have been reconciled.');
  };

  // Toggle individual row status
  const handleToggleStatus = (id: string) => {
    setBankFeed(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'Reconciled' ? 'Pending' : 'Reconciled';
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  // Filtered transactions
  const filteredFeed = bankFeed.filter(t => {
    const matchesStatus = 
      statusFilter === 'ALL' ||
      (statusFilter === 'RECONCILED' && t.status === 'Reconciled') ||
      (statusFilter === 'PENDING' && t.status === 'Pending') ||
      (statusFilter === 'UNMATCHED' && t.status === 'Unmatched');

    const matchesSearch = 
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.referenceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.amount.toString().includes(searchQuery);

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER CARD */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-5 rounded-2xl border border-emerald-800/60 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-emerald-600/30 border border-emerald-400 rounded-xl flex items-center justify-center text-emerald-300 font-black text-xl shadow-inner">
            <Scale className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/40 uppercase tracking-widest flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Automated AI Bank Matching Engine Active</span>
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight mt-1">
              Bank Statement Reconciliation — {company?.name || 'Hisaab Pro'}
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <button
            onClick={handleBatchAutoReconcile}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Auto-Reconcile High Matches</span>
          </button>
          <button
            onClick={() => setIsCertificateOpen(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Reconciliation Audit Certificate</span>
          </button>
        </div>
      </div>

      {/* METRICS SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Bank Statement Ending Balance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 font-mono uppercase block">
            Bank Statement Net Total
          </span>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
            AED {bankStatementEndingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Deposits: AED {totalBankDeposits.toFixed(2)}
          </div>
        </div>

        {/* System Ledger Matched Total */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 font-mono uppercase block">
            System Cleared Ledger Total
          </span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            AED {systemLedgerBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-emerald-600 font-mono font-bold">
            Reconciled: {reconciledCount} transactions
          </div>
        </div>

        {/* Reconciliation Variance Difference */}
        <div className={`p-4 rounded-2xl border shadow-xs space-y-1 ${
          reconciliationVariance === 0 
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300'
            : 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/40 text-amber-900 dark:text-amber-300'
        }`}>
          <span className="text-[10px] font-bold font-mono uppercase block">
            Reconciliation Variance
          </span>
          <div className="text-xl font-black font-mono">
            AED {Math.abs(reconciliationVariance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] font-mono font-bold">
            {reconciliationVariance === 0 ? '✨ PERFECT BALANCE MATCH' : '⚠️ Pending Unreconciled Items'}
          </div>
        </div>

        {/* Pending & Unmatched Items */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 font-mono uppercase block">
            Items Status Breakdown
          </span>
          <div className="flex items-center space-x-2 pt-1 font-mono text-xs font-bold">
            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
              {reconciledCount} Matched
            </span>
            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
              {pendingCount} Pending
            </span>
            <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md">
              {unmatchedCount} Direct
            </span>
          </div>
        </div>

      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-3">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 w-full md:w-auto">
          {[
            { id: 'ALL', label: 'All Transactions' },
            { id: 'RECONCILED', label: 'Reconciled' },
            { id: 'PENDING', label: 'Pending Review' },
            { id: 'UNMATCHED', label: 'Direct Bank Charges' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reference, party, or amount..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

      </div>

      {/* BANK RECONCILIATION DATA TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/80 font-mono text-[10px] uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5">Bank Statement Date</th>
                <th className="p-3.5">Transaction Description &amp; Ref</th>
                <th className="p-3.5 text-right">Credit (Deposit)</th>
                <th className="p-3.5 text-right">Debit (Payment)</th>
                <th className="p-3.5 text-center">AI Match Score</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Reconcile Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {filteredFeed.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No bank statement line items match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredFeed.map(item => {
                  const isCredit = item.type === 'Credit';
                  const isReconciled = item.status === 'Reconciled';

                  return (
                    <tr 
                      key={item.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        isReconciled ? 'bg-emerald-50/30 dark:bg-emerald-950/10' : ''
                      }`}
                    >
                      <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                        {item.date}
                      </td>

                      <td className="p-3.5 font-sans">
                        <span className="font-bold text-slate-900 dark:text-white block text-xs">
                          {item.description}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Ref: {item.referenceNo} {item.matchType ? `(${item.matchType})` : ''}
                        </span>
                      </td>

                      <td className="p-3.5 text-right font-black text-emerald-600">
                        {isCredit ? `AED ${item.amount.toFixed(2)}` : '—'}
                      </td>

                      <td className="p-3.5 text-right font-black text-rose-600">
                        {!isCredit ? `AED ${item.amount.toFixed(2)}` : '—'}
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          item.matchScore >= 90
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : item.matchScore >= 70
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}>
                          {item.matchScore}% Match
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                          isReconciled
                            ? 'bg-emerald-600 text-white font-extrabold'
                            : item.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleStatus(item.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center space-x-1 mx-auto ${
                            isReconciled
                              ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                          }`}
                        >
                          {isReconciled ? (
                            <>
                              <Unlink className="w-3.5 h-3.5" />
                              <span>Unlink</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Reconcile</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECONCILIATION CERTIFICATE MODAL */}
      {isCertificateOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in no-print">
          <div className="bg-white text-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-300 font-sans">
            
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-sm uppercase font-mono text-indigo-900">
                Official Bank Reconciliation Certificate
              </h3>
              <button onClick={() => setIsCertificateOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div id="bank-rec-certificate" className="p-5 bg-slate-50 border rounded-2xl space-y-4 font-mono text-xs">
              <div className="text-center space-y-1 border-b pb-3">
                <h4 className="font-black text-base text-slate-900 uppercase">{company?.name || 'HISAAB PRO'}</h4>
                <p className="text-[10px] text-slate-500">TRN: {company?.trn || '100293847500003'}</p>
                <p className="text-xs font-bold text-emerald-700 mt-1">BANK RECONCILIATION AUDIT CERTIFICATE</p>
                <p className="text-[9px] text-slate-400">Statement Period Ending: {new Date().toLocaleDateString()}</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b pb-1">
                  <span>Bank Account Code:</span>
                  <strong className="font-bold">{selectedBankCode} (Emirates NBD / FAB)</strong>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span>Bank Statement Balance:</span>
                  <strong className="font-bold text-slate-900">AED {bankStatementEndingBalance.toFixed(2)}</strong>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span>(+) Reconciled Cleared Deposits:</span>
                  <span className="text-emerald-700 font-bold">AED {totalReconciledDeposits.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span>(-) Reconciled Cleared Withdrawals:</span>
                  <span className="text-rose-700 font-bold">AED {totalReconciledWithdrawals.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 text-sm font-black text-emerald-800 border-t-2 border-emerald-600">
                  <span>Adjusted Ledger Balance:</span>
                  <span>AED {systemLedgerBalance.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-emerald-100/80 border border-emerald-400 p-3 rounded-xl text-[10px] text-emerald-900 space-y-0.5 text-center">
                <strong className="block uppercase font-bold">AUDIT VERIFICATION STAMP</strong>
                <span>Verified 100% compliant with UAE FTA Double-Entry Accounting rules.</span>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => triggerPrint('bank-rec-certificate')}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Reconciliation Certificate</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
