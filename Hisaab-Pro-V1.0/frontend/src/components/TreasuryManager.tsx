import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  Plus, 
  ArrowRightLeft, 
  Building2, 
  CreditCard, 
  CheckCircle2, 
  Printer, 
  Eye, 
  Edit3, 
  Trash2, 
  DollarSign, 
  FileText, 
  FileCode,
  X, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Calendar,
  AlertCircle,
  Search
} from 'lucide-react';
import { TreasuryAccount, FundTransfer, Company, Staff, JournalEntry, COAAccount } from '../types';
import { triggerPrint, downloadStandaloneHTML } from '../utils/printHelper';

interface TreasuryManagerProps {
  activeCompanyId: string;
  company?: Company;
  staff?: Staff[];
  treasuryAccounts: TreasuryAccount[];
  fundTransfers: FundTransfer[];
  onAddAccount: (acc: Omit<TreasuryAccount, 'id'>) => void;
  onUpdateAccount: (acc: TreasuryAccount) => void;
  onDeleteAccount: (id: string) => void;
  onAddFundTransfer: (transfer: Omit<FundTransfer, 'id'>) => void;
  onUpdateFundTransfer: (transfer: FundTransfer) => void;
  onDeleteFundTransfer: (id: string) => void;
  onAddJournalEntry?: (je: JournalEntry) => void;
  coaAccounts?: COAAccount[];
  activeSidebarItemId?: string;
  setActiveSidebarItemId?: (id: string) => void;
}

const UAE_BANKS = [
  'Emirates NBD',
  'Abu Dhabi Commercial Bank (ADCB)',
  'First Abu Dhabi Bank (FAB)',
  'Dubai Islamic Bank (DIB)',
  'Mashreq Bank',
  'Commercial Bank of Dubai (CBD)',
  'Abu Dhabi Islamic Bank (ADIB)',
  'RAKBANK (National Bank of Ras Al Khaimah)',
  'Sharjah Islamic Bank (SIB)',
  'HSBC Middle East UAE',
  'Standard Chartered UAE'
];

export const TreasuryManager: React.FC<TreasuryManagerProps> = ({
  activeCompanyId,
  company,
  staff = [],
  treasuryAccounts,
  fundTransfers,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onAddFundTransfer,
  onUpdateFundTransfer,
  onDeleteFundTransfer,
  onAddJournalEntry
}) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'transfers'>('accounts');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TreasuryAccount | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [voucherTransfer, setVoucherTransfer] = useState<FundTransfer | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Account Form
  const [accountType, setAccountType] = useState<'Bank' | 'Cash' | 'Payment Gateway' | 'Petty Cash'>('Bank');
  const [accountName, setAccountName] = useState('');
  const [bankName, setBankName] = useState(UAE_BANKS[0]);
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [branchName, setBranchName] = useState('Dubai Main');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [accountNotes, setAccountNotes] = useState('');

  // Transfer Form
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferAmount, setTransferAmount] = useState<number>(1000);
  const [transferFee, setTransferFee] = useState<number>(0);
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [transferType, setTransferType] = useState<'Inter-Bank' | 'Bank to Cash' | 'Cash to Bank' | 'Owner Drawing' | 'Capital Injection'>('Inter-Bank');
  const [referenceNo, setReferenceNo] = useState('');
  const [authorizedBy, setAuthorizedBy] = useState(staff[0]?.name || 'Director');
  const [transferNotes, setTransferNotes] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Company Accounts & Transfers
  const companyAccounts = useMemo(() => {
    return treasuryAccounts.filter(a => a.companyId === activeCompanyId);
  }, [treasuryAccounts, activeCompanyId]);

  const companyTransfers = useMemo(() => {
    return fundTransfers.filter(t => t.companyId === activeCompanyId);
  }, [fundTransfers, activeCompanyId]);

  // Total Liquidity
  const totalBankBalance = useMemo(() => {
    return companyAccounts
      .filter(a => a.accountType === 'Bank' || a.accountType === 'Payment Gateway')
      .reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);
  }, [companyAccounts]);

  const totalCashBalance = useMemo(() => {
    return companyAccounts
      .filter(a => a.accountType === 'Cash' || a.accountType === 'Petty Cash')
      .reduce((sum, a) => sum + (Number(a.currentBalance) || 0), 0);
  }, [companyAccounts]);

  const totalLiquidity = totalBankBalance + totalCashBalance;

  // Open Add Account
  const handleOpenAddAccount = () => {
    setEditingAccount(null);
    setAccountType('Bank');
    setAccountName('');
    setBankName(UAE_BANKS[0]);
    setAccountNumber('');
    setIban('AE');
    setSwiftCode('');
    setBranchName('Dubai Business Bay');
    setOpeningBalance(0);
    setAccountNotes('');
    setIsAccountModalOpen(true);
  };

  // Open Edit Account
  const handleOpenEditAccount = (acc: TreasuryAccount) => {
    setEditingAccount(acc);
    setAccountType(acc.accountType);
    setAccountName(acc.accountName);
    setBankName(acc.bankName || UAE_BANKS[0]);
    setAccountNumber(acc.accountNumber || '');
    setIban(acc.iban || '');
    setSwiftCode(acc.swiftCode || '');
    setBranchName(acc.branchName || '');
    setOpeningBalance(acc.openingBalance);
    setAccountNotes(acc.notes || '');
    setIsAccountModalOpen(true);
  };

  // Save Account
  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) {
      alert('Please enter an account name.');
      return;
    }

    if (editingAccount) {
      const updated: TreasuryAccount = {
        ...editingAccount,
        accountType,
        accountName,
        bankName: accountType === 'Bank' ? bankName : undefined,
        accountNumber,
        iban: accountType === 'Bank' ? iban : undefined,
        swiftCode: accountType === 'Bank' ? swiftCode : undefined,
        branchName: accountType === 'Bank' ? branchName : undefined,
        openingBalance: Number(openingBalance) || 0,
        notes: accountNotes
      };
      onUpdateAccount(updated);
      showToast(`Account "${updated.accountName}" updated successfully.`);
    } else {
      const newAcc: Omit<TreasuryAccount, 'id'> = {
        companyId: activeCompanyId,
        accountType,
        accountName,
        bankName: accountType === 'Bank' ? bankName : undefined,
        accountNumber,
        iban: accountType === 'Bank' ? iban : undefined,
        swiftCode: accountType === 'Bank' ? swiftCode : undefined,
        branchName: accountType === 'Bank' ? branchName : undefined,
        currency: 'AED',
        openingBalance: Number(openingBalance) || 0,
        currentBalance: Number(openingBalance) || 0,
        status: 'Active',
        isDefault: companyAccounts.length === 0,
        coaCode: accountType === 'Bank' ? '1010' : '1000',
        notes: accountNotes
      };
      onAddAccount(newAcc);
      showToast(`Created Account "${newAcc.accountName}".`);
    }
    setIsAccountModalOpen(false);
  };

  // Open Transfer Modal
  const handleOpenTransferModal = () => {
    if (companyAccounts.length < 2) {
      alert('You need at least 2 bank/cash accounts to perform an inter-account fund transfer.');
      return;
    }
    setFromAccountId(companyAccounts[0]?.id || '');
    setToAccountId(companyAccounts[1]?.id || '');
    setTransferAmount(5000);
    setTransferFee(0);
    setTransferDate(new Date().toISOString().split('T')[0]);
    setTransferType('Inter-Bank');
    setReferenceNo('');
    setAuthorizedBy(staff[0]?.name || 'Managing Director');
    setTransferNotes('');
    setIsTransferModalOpen(true);
  };

  // Save Transfer
  const handleSaveTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccountId || !toAccountId) {
      alert('Please select both From and To accounts.');
      return;
    }
    if (fromAccountId === toAccountId) {
      alert('Source and destination accounts must be different.');
      return;
    }
    if (transferAmount <= 0) {
      alert('Transfer amount must be greater than zero.');
      return;
    }

    const fromAcc = companyAccounts.find(a => a.id === fromAccountId);
    const toAcc = companyAccounts.find(a => a.id === toAccountId);

    if (!fromAcc || !toAcc) return;

    const nextRaw = companyTransfers.length + 1001;
    const newTransfer: Omit<FundTransfer, 'id'> = {
      companyId: activeCompanyId,
      transferNumber: `TRF-${nextRaw}`,
      rawNumber: nextRaw,
      date: transferDate,
      fromAccountId,
      fromAccountName: fromAcc.accountName,
      toAccountId,
      toAccountName: toAcc.accountName,
      amount: Number(transferAmount) || 0,
      fee: Number(transferFee) || 0,
      transferType,
      referenceNo: referenceNo.trim() || `TRF-REF-${Date.now().toString().slice(-6)}`,
      authorizedBy,
      notes: transferNotes,
      status: 'Completed'
    };

    // Update balances
    const updatedFrom = {
      ...fromAcc,
      currentBalance: (Number(fromAcc.currentBalance) || 0) - (Number(transferAmount) || 0) - (Number(transferFee) || 0)
    };
    const updatedTo = {
      ...toAcc,
      currentBalance: (Number(toAcc.currentBalance) || 0) + (Number(transferAmount) || 0)
    };

    onUpdateAccount(updatedFrom);
    onUpdateAccount(updatedTo);
    onAddFundTransfer(newTransfer);

    // Create double-entry Contra Journal Voucher if COA integration active
    if (onAddJournalEntry) {
      const je: JournalEntry = {
        id: `je_trf_${Date.now()}`,
        companyId: activeCompanyId,
        reference: `JE-CONTRA-${Date.now().toString().slice(-4)}`,
        date: transferDate,
        description: `Contra Transfer: ${fromAcc.accountName} -> ${toAcc.accountName} (Ref: ${newTransfer.referenceNo})`,
        status: 'Posted',
        isAutoLinked: true,
        lines: [
          {
            accountCode: toAcc.coaCode || '1010',
            debit: Number(transferAmount) || 0,
            credit: 0
          },
          {
            accountCode: fromAcc.coaCode || '1010',
            debit: 0,
            credit: Number(transferAmount) || 0
          }
        ]
      };
      onAddJournalEntry(je);
    }

    showToast(`Transfer ${newTransfer.transferNumber} executed! Transferred AED ${transferAmount.toFixed(2)}.`);
    setIsTransferModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-xl flex items-center space-x-3 text-sm font-semibold border border-emerald-500/30 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Treasury & Cash Management
            </span>
            <span className="text-slate-400 text-xs font-mono">UAE Central Bank Compliant</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Bank & Cash Accounts Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage corporate bank accounts, IBANs, petty cash vaults, inter-account contra transfers, and generate payment vouchers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleOpenTransferModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-3.5 py-2.5 rounded-xl flex items-center space-x-2 shadow-xs transition-all cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Inter-Account Transfer</span>
          </button>

          <button
            onClick={handleOpenAddAccount}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bank / Cash Account</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Available Liquidity
            </span>
            <span className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Wallet className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              AED {totalLiquidity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Combined Banks, Gateways & Cash Vaults</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Bank Accounts & Gateways
            </span>
            <span className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Building2 className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              AED {totalBankBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Corporate Chequing & Online Gateways</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Physical Cash & Petty Vaults
            </span>
            <span className="p-2.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              AED {totalCashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Cash in Hand & Drawer Reserves</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'accounts' 
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Bank & Cash Accounts ({companyAccounts.length})
        </button>

        <button
          onClick={() => setActiveTab('transfers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'transfers' 
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Inter-Account Transfer History ({companyTransfers.length})
        </button>
      </div>

      {/* Accounts List */}
      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companyAccounts.map(account => (
            <div 
              key={account.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-xl ${
                    account.accountType === 'Bank' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400' :
                    account.accountType === 'Petty Cash' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400' :
                    account.accountType === 'Payment Gateway' ? 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400' :
                    'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                  }`}>
                    {account.accountType === 'Bank' ? <Building2 className="w-5 h-5" /> :
                     account.accountType === 'Payment Gateway' ? <CreditCard className="w-5 h-5" /> :
                     <Wallet className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <span>{account.accountName}</span>
                      {account.isDefault && (
                        <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          DEFAULT
                        </span>
                      )}
                    </h3>
                    <div className="text-[11px] text-slate-400 font-medium">
                      {account.accountType} {account.bankName ? `• ${account.bankName}` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEditAccount(account)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="Edit Account"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete account "${account.accountName}"?`)) {
                        onDeleteAccount(account.id);
                        showToast(`Deleted account "${account.accountName}"`);
                      }
                    }}
                    className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                    title="Delete Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Account details */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl space-y-1.5 text-xs font-mono">
                {account.iban && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">IBAN:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{account.iban}</span>
                  </div>
                )}
                {account.accountNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account No:</span>
                    <span className="text-slate-700 dark:text-slate-300">{account.accountNumber}</span>
                  </div>
                )}
                {account.swiftCode && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">SWIFT / BIC:</span>
                    <span className="text-slate-700 dark:text-slate-300">{account.swiftCode}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 font-medium">Current Calculated Balance:</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  AED {Number(account.currentBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transfers List */}
      {activeTab === 'transfers' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4">Voucher No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Transfer Routing</th>
                  <th className="py-3 px-4">Type / Ref</th>
                  <th className="py-3 px-4 text-right">Amount (AED)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {companyTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      <ArrowRightLeft className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold">No Fund Transfers recorded</p>
                      <p className="text-[11px] text-slate-400 mt-1">Click "Inter-Account Transfer" to transfer funds between bank accounts and cash drawers.</p>
                    </td>
                  </tr>
                ) : (
                  companyTransfers.map(trf => (
                    <tr key={trf.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {trf.transferNumber}
                      </td>
                      <td className="py-3 px-4 font-medium">{trf.date}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white">
                          <span>{trf.fromAccountName}</span>
                          <span className="text-slate-400">→</span>
                          <span className="text-indigo-600 dark:text-indigo-400">{trf.toAccountName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{trf.transferType}</div>
                        <div className="text-[11px] text-slate-400 font-mono">Ref: {trf.referenceNo || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                        AED {trf.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          {trf.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => setVoucherTransfer(trf)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-300 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Print Transfer Voucher"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete transfer ${trf.transferNumber}?`)) {
                                onDeleteFundTransfer(trf.id);
                                showToast(`Deleted transfer ${trf.transferNumber}`);
                              }
                            }}
                            className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/50 dark:hover:bg-red-900/80 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Delete Transfer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* Add / Edit Account Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>{editingAccount ? 'Edit Account Details' : 'Add Bank or Cash Account'}</span>
              </h3>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Type *</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-medium"
                >
                  <option value="Bank">Bank Current / Savings Account</option>
                  <option value="Petty Cash">Petty Cash Vault</option>
                  <option value="Cash">Main Office Cash Drawer</option>
                  <option value="Payment Gateway">Online Gateway (Stripe, Network Intl)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emirates NBD - Corporate Current AED"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-medium"
                />
              </div>

              {accountType === 'Bank' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bank Name *</label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-medium"
                    >
                      {UAE_BANKS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 10145892019901"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">UAE IBAN (23 Chars)</label>
                      <input
                        type="text"
                        placeholder="AE..."
                        value={iban}
                        onChange={(e) => setIban(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">SWIFT / BIC Code</label>
                      <input
                        type="text"
                        placeholder="e.g. EBILAEADXXX"
                        value={swiftCode}
                        onChange={(e) => setSwiftCode(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Branch Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Business Bay Branch, Dubai"
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Opening Balance (AED)</label>
                <input
                  type="number"
                  step="0.01"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-mono font-bold"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {editingAccount ? 'Update Account' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <ArrowRightLeft className="w-5 h-5 text-emerald-600" />
                <span>Inter-Account Fund Transfer (Contra)</span>
              </h3>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransfer} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Transfer Date *</label>
                  <input
                    type="date"
                    required
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Transfer Type *</label>
                  <select
                    value={transferType}
                    onChange={(e) => setTransferType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-medium"
                  >
                    <option value="Inter-Bank">Inter-Bank Wire Transfer</option>
                    <option value="Bank to Cash">Bank to Petty Cash Replenishment</option>
                    <option value="Cash to Bank">Cash Deposit to Bank</option>
                    <option value="Owner Drawing">Owner / Partner Capital Drawing</option>
                    <option value="Capital Injection">Owner Capital Injection</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">From Account (Source) *</label>
                  <select
                    value={fromAccountId}
                    onChange={(e) => setFromAccountId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-medium"
                  >
                    {companyAccounts.map(a => (
                      <option key={a.id} value={a.id}>{a.accountName} (AED {Number(a.currentBalance).toFixed(2)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">To Account (Destination) *</label>
                  <select
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-medium"
                  >
                    {companyAccounts.map(a => (
                      <option key={a.id} value={a.id}>{a.accountName} (AED {Number(a.currentBalance).toFixed(2)})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Transfer Amount (AED) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bank Fee / Charges (AED)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={transferFee}
                    onChange={(e) => setTransferFee(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Reference / Cheque No</label>
                  <input
                    type="text"
                    placeholder="e.g. NFT-9912088-UAE"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Authorized Signatory</label>
                  <input
                    type="text"
                    value={authorizedBy}
                    onChange={(e) => setAuthorizedBy(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Transfer Purpose / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly petty cash replenishment for office operations"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Execute Fund Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Voucher Print Modal */}
      {voucherTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div id="printable-contra-voucher-area" className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  FUND TRANSFER CONTRA VOUCHER
                </h3>
              </div>
              <button
                onClick={() => setVoucherTransfer(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer no-print"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 my-6 text-xs text-slate-800 dark:text-slate-200">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-extrabold text-base text-slate-900 dark:text-white">{company?.name || 'evonix Technologies'}</div>
                  <div className="text-slate-500 font-mono text-[11px]">TRN: {company?.trn || '100234567890003'}</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{voucherTransfer.transferNumber}</div>
                  <div className="text-slate-500 text-[11px]">Date: {voucherTransfer.date}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Debit (Inward Account)</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-1">{voucherTransfer.toAccountName}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Credit (Outward Account)</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-1">{voucherTransfer.fromAccountName}</div>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Transfer Description & Reference</th>
                      <th className="py-2.5 px-4 text-right">Amount (AED)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-slate-100 dark:border-slate-800">
                      <td className="py-3 px-4">
                        <div className="font-bold">{voucherTransfer.transferType}</div>
                        <div className="text-[11px] text-slate-400">{voucherTransfer.notes || 'Internal treasury fund transfer'}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">Ref: {voucherTransfer.referenceNo}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-sm">
                        AED {voucherTransfer.amount.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 dark:border-slate-800">
                <div className="text-center">
                  <div className="border-b border-slate-300 dark:border-slate-700 pb-8 text-slate-400 text-[11px]">
                    Authorized Signature
                  </div>
                  <div className="font-bold mt-2">{voucherTransfer.authorizedBy}</div>
                </div>
                <div className="text-center">
                  <div className="border-b border-slate-300 dark:border-slate-700 pb-8 text-slate-400 text-[11px]">
                    Accountant Verification
                  </div>
                  <div className="font-bold mt-2">Chief Financial Officer</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800 no-print">
              <button
                type="button"
                onClick={() => {
                  const element = document.getElementById('printable-contra-voucher-area');
                  if (element) {
                    downloadStandaloneHTML({
                      elementOrId: element,
                      fileName: `Contra_Voucher_${voucherTransfer.transferNumber}.html`,
                      docTitle: `Contra Voucher #${voucherTransfer.transferNumber}`,
                      paperSize: 'A4'
                    });
                  }
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-white border border-teal-500/40 text-xs font-bold rounded-xl flex items-center space-x-2 cursor-pointer shadow-sm"
                title="Download Standalone Printable HTML file (Ctrl+P ready)"
              >
                <FileCode className="w-4 h-4" />
                <span>Download HTML (Ctrl+P)</span>
              </button>
              <button
                type="button"
                onClick={() => triggerPrint('printable-contra-voucher-area')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center space-x-2 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Voucher</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
