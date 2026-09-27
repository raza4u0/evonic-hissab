import React, { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Trash2, 
  Edit3, 
  Building2, 
  Calendar as CalendarIcon,
  DollarSign,
  FileSpreadsheet,
  MoreVertical,
  X,
  Check,
  RefreshCw,
  Info,
  TrendingUp,
  PieChart,
  Paperclip,
  Eye,
  ImagePlus
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { Company, Customer, PdcCheque, Supplier } from '../types';
import { safeSetLocalStorage, safeGetLocalStorage } from '../utils/safeStorage';

interface PdcManagerProps {
  company: Company | undefined;
  activeCompanyId: string;
  customers?: Customer[];
  suppliers?: Supplier[];
}

const UAE_BANKS = [
  'Emirates NBD',
  'First Abu Dhabi Bank (FAB)',
  'Abu Dhabi Commercial Bank (ADCB)',
  'Dubai Islamic Bank (DIB)',
  'Mashreq Bank',
  'RAKBANK',
  'Commercial Bank of Dubai (CBD)',
  'Abu Dhabi Islamic Bank (ADIB)',
  'Sharjah Islamic Bank (SIB)',
  'Ajman Bank',
  'HSBC Middle East',
  'Standard Chartered UAE',
  'Other Bank'
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs font-mono space-y-1.5 no-print">
        <p className="font-bold text-indigo-300 font-sans border-b border-slate-800 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <span style={{ color: entry.color }} className="font-semibold">
              {entry.name}:
            </span>
            <span className="font-bold text-white">
              AED {Number(entry.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function PdcManager({ company, activeCompanyId, customers = [], suppliers = [] }: PdcManagerProps) {
  // Suppliers Directory list loaded from props + localStorage + seed defaults
  const suppliersList = useMemo<Supplier[]>(() => {
    if (suppliers && suppliers.length > 0) return suppliers;
    const cached = safeGetLocalStorage<Supplier[] | null>('hisaab_suppliers_directory', null);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
    return [
      {
        id: 'sup-seed-1',
        companyId: activeCompanyId,
        name: 'Jabal Ali Construction Materials LLC',
        supplierCode: 'SUPP-1001',
        trn: '100234567800003',
      },
      {
        id: 'sup-seed-2',
        companyId: activeCompanyId,
        name: 'Mazen Carpet & Textiles UAE',
        supplierCode: 'SUPP-1002',
        trn: '100345678900003',
      },
      {
        id: 'sup-seed-3',
        companyId: activeCompanyId,
        name: 'Gulf General Logistics Corp',
        supplierCode: 'SUPP-1003',
        trn: '100456789000003',
      }
    ];
  }, [suppliers, activeCompanyId]);

  const DEFAULT_RENT_VENDORS = useMemo(() => [
    'Emaar Properties PJSC',
    'Al Habtoor Real Estate',
    'Nakheel Properties PJSC',
    'Dubai Holding / Properties Group',
    'Sobha Realty LLC',
    'Meraas Holding',
    'Wasl Properties',
    'Commercial Lease / Office Landlord Rent',
    'Deyaar Development PJSC'
  ], []);

  const UTILITY_VENDORS = useMemo(() => [
    'DEWA (Dubai Electricity & Water Authority)',
    'Etisalat by e&',
    'du Telecom',
    'FEWA / Etihad WE',
    'SEWA (Sharjah Electricity & Water)'
  ], []);

  // Local storage state for PDCs
  const [pdcs, setPdcs] = useState<PdcCheque[]>(() => {
    const saved = localStorage.getItem(`hisaab_pdcs_${activeCompanyId}`) || localStorage.getItem('hisaab_pdcs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse saved PDCs", e);
      }
    }

    // Default sample PDCs matching user scenario
    const today = new Date();
    
    // Date +3 days (triggers 3 days warning yellow)
    const in3Days = new Date(today);
    in3Days.setDate(today.getDate() + 3);
    const in3DaysStr = in3Days.toISOString().split('T')[0];

    // Date +1 day
    const in1Day = new Date(today);
    in1Day.setDate(today.getDate() + 1);
    const in1DayStr = in1Day.toISOString().split('T')[0];

    // Date -8 days
    const past8Days = new Date(today);
    past8Days.setDate(today.getDate() - 8);
    const past8DaysStr = past8Days.toISOString().split('T')[0];

    // Date -15 days
    const past15Days = new Date(today);
    past15Days.setDate(today.getDate() - 15);
    const past15DaysStr = past15Days.toISOString().split('T')[0];

    // Date +30 days, +60 days, +90 days
    const in30Days = new Date(today);
    in30Days.setDate(today.getDate() + 30);
    const in30DaysStr = in30Days.toISOString().split('T')[0];

    const in60Days = new Date(today);
    in60Days.setDate(today.getDate() + 60);
    const in60DaysStr = in60Days.toISOString().split('T')[0];

    const sampleData: PdcCheque[] = [
      {
        id: 'pdc-001',
        companyId: activeCompanyId,
        type: 'incoming',
        partyName: 'Al Habtoor Group LLC',
        partyType: 'customer',
        chequeNumber: '12345',
        bankName: 'Emirates NBD',
        amount: 25000,
        chequeDate: today.toISOString().split('T')[0],
        maturityDate: in3DaysStr,
        status: 'Pending',
        notes: 'Invoice #INV-2026-081 Downpayment PDC',
        createdDate: today.toISOString().split('T')[0]
      },
      {
        id: 'pdc-002',
        companyId: activeCompanyId,
        type: 'incoming',
        partyName: 'ABC Trading Co.',
        partyType: 'customer',
        chequeNumber: '67890',
        bankName: 'Mashreq Bank',
        amount: 10000,
        chequeDate: past15DaysStr,
        maturityDate: past8DaysStr,
        status: 'Bounced',
        bouncedReason: 'Insufficient Funds (Refer to Drawer)',
        notes: 'Chq returned on presentation at FAB branch',
        createdDate: past15DaysStr
      },
      {
        id: 'pdc-003',
        companyId: activeCompanyId,
        type: 'incoming',
        partyName: 'XYZ Contracting LLC',
        partyType: 'customer',
        chequeNumber: '11223',
        bankName: 'ADCB',
        amount: 50000,
        chequeDate: past15DaysStr,
        maturityDate: past15DaysStr,
        status: 'Cleared',
        clearedDate: past15DaysStr,
        notes: 'Cleared via Emirates NBD clearing batch',
        createdDate: past15DaysStr
      },
      {
        id: 'pdc-004',
        companyId: activeCompanyId,
        type: 'outgoing',
        partyName: 'Gulf Logistics FZE',
        partyType: 'supplier',
        chequeNumber: '99887',
        bankName: 'Dubai Islamic Bank (DIB)',
        amount: 18500,
        chequeDate: today.toISOString().split('T')[0],
        maturityDate: in1DayStr,
        status: 'Pending',
        notes: 'Warehouse Rent Quarterly Post-Dated Cheque',
        createdDate: today.toISOString().split('T')[0]
      },
      {
        id: 'pdc-005',
        companyId: activeCompanyId,
        type: 'incoming',
        partyName: 'Al Futtaim Real Estate',
        partyType: 'customer',
        chequeNumber: '44556',
        bankName: 'First Abu Dhabi Bank (FAB)',
        amount: 35000,
        chequeDate: today.toISOString().split('T')[0],
        maturityDate: in30DaysStr,
        status: 'Pending',
        notes: 'Commercial Lease Q3 Instalment PDC',
        createdDate: today.toISOString().split('T')[0]
      },
      {
        id: 'pdc-006',
        companyId: activeCompanyId,
        type: 'outgoing',
        partyName: 'Emaar Properties PJSC',
        partyType: 'supplier',
        chequeNumber: '77889',
        bankName: 'Emirates NBD',
        amount: 28000,
        chequeDate: today.toISOString().split('T')[0],
        maturityDate: in60DaysStr,
        status: 'Pending',
        notes: 'Office Fitout Contract Phase II PDC',
        createdDate: today.toISOString().split('T')[0]
      }
    ];

    return sampleData;
  });

  // Save to local storage safely on change
  useEffect(() => {
    safeSetLocalStorage(`hisaab_pdcs_${activeCompanyId}`, pdcs);
    safeSetLocalStorage('hisaab_pdcs', pdcs);
  }, [pdcs, activeCompanyId]);

  // Filters & Search
  const [filterType, setFilterType] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Pending' | 'Cleared' | 'Bounced' | 'Due3Days'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Batch Checkbox Selection State
  const [selectedPdcIds, setSelectedPdcIds] = useState<string[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPdc, setEditingPdc] = useState<PdcCheque | null>(null);

  // Bounce Modal
  const [bounceModalPdc, setBounceModalPdc] = useState<PdcCheque | null>(null);
  const [bounceReasonInput, setBounceReasonInput] = useState('Insufficient Funds');

  // Form Fields
  const [typeInput, setTypeInput] = useState<'incoming' | 'outgoing'>('incoming');
  const [partyNameInput, setPartyNameInput] = useState('');
  const [isCustomParty, setIsCustomParty] = useState(false);
  const [chequeNumberInput, setChequeNumberInput] = useState('');
  const [bankNameInput, setBankNameInput] = useState('Emirates NBD');
  const [amountInput, setAmountInput] = useState<number | ''>('');
  const [chequeDateInput, setChequeDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [maturityDateInput, setMaturityDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [statusInput, setStatusInput] = useState<'Pending' | 'Cleared' | 'Bounced'>('Pending');
  const [notesInput, setNotesInput] = useState('');
  const [chequeImageInput, setChequeImageInput] = useState<string>('');
  const [viewerChequeImage, setViewerChequeImage] = useState<string | null>(null);

  const handleChequeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Cheque scan image is too large (max 5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setChequeImageInput(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Calculate Days Difference to Maturity
  const getDaysToMaturity = (maturityDateStr: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maturity = new Date(maturityDateStr);
    maturity.setHours(0, 0, 0, 0);
    const diffTime = maturity.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Helper to check if due within 3 days or overdue pending
  const isDueWithin3Days = (pdc: PdcCheque): boolean => {
    if (pdc.status !== 'Pending') return false;
    const days = getDaysToMaturity(pdc.maturityDate);
    return days <= 3; // <= 3 days (includes overdue or due today/in 1-3 days)
  };

  // Filtered PDCs
  const filteredPdcs = pdcs.filter(pdc => {
    // Company match
    if (pdc.companyId && pdc.companyId !== activeCompanyId) return false;

    // Type match
    if (filterType !== 'all' && pdc.type !== filterType) return false;

    // Status match
    if (filterStatus === 'Due3Days') {
      if (!isDueWithin3Days(pdc)) return false;
    } else if (filterStatus !== 'all') {
      if (pdc.status !== filterStatus) return false;
    }

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchParty = pdc.partyName.toLowerCase().includes(q);
      const matchChq = pdc.chequeNumber.toLowerCase().includes(q);
      const matchBank = pdc.bankName.toLowerCase().includes(q);
      const matchAmount = pdc.amount.toString().includes(q);
      const matchNotes = (pdc.notes || '').toLowerCase().includes(q);
      if (!matchParty && !matchChq && !matchBank && !matchAmount && !matchNotes) return false;
    }

    return true;
  });

  // Calculate Statistics
  const totalChequesCount = pdcs.length;
  const pendingCheques = pdcs.filter(p => p.status === 'Pending');
  const bouncedChequesList = pdcs.filter(p => p.status === 'Bounced');
  const clearedChequesList = pdcs.filter(p => p.status === 'Cleared');
  const due3DaysCount = pdcs.filter(p => isDueWithin3Days(p)).length;

  const totalIncomingAmount = pdcs.filter(p => p.type === 'incoming').reduce((sum, p) => sum + p.amount, 0);
  const totalOutgoingAmount = pdcs.filter(p => p.type === 'outgoing').reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = pendingCheques.reduce((sum, p) => sum + p.amount, 0);
  const clearedAmount = clearedChequesList.reduce((sum, p) => sum + p.amount, 0);
  const bouncedAmount = bouncedChequesList.reduce((sum, p) => sum + p.amount, 0);

  // Calculate 6-month PDC maturity trend chart data for Recharts
  const next6MonthsData = useMemo(() => {
    const months = [];
    const today = new Date();
    
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const yearStr = d.getFullYear();
      const monthNum = d.getMonth() + 1;
      const monthKey = `${yearStr}-${String(monthNum).padStart(2, '0')}`;
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      let incoming = 0;
      let outgoing = 0;
      let count = 0;

      pdcs.forEach(pdc => {
        if (pdc.maturityDate && pdc.maturityDate.startsWith(monthKey)) {
          count++;
          if (pdc.type === 'incoming') {
            incoming += pdc.amount;
          } else {
            outgoing += pdc.amount;
          }
        }
      });

      months.push({
        monthLabel,
        incoming,
        outgoing,
        totalVolume: incoming + outgoing,
        count
      });
    }

    return months;
  }, [pdcs]);

  // Modal open handler
  const handleOpenModal = (pdc?: PdcCheque) => {
    setIsCustomParty(false);
    if (pdc) {
      setEditingPdc(pdc);
      setTypeInput(pdc.type);
      setPartyNameInput(pdc.partyName);
      setChequeNumberInput(pdc.chequeNumber);
      setBankNameInput(pdc.bankName);
      setAmountInput(pdc.amount);
      setChequeDateInput(pdc.chequeDate);
      setMaturityDateInput(pdc.maturityDate);
      setStatusInput(pdc.status as 'Pending' | 'Cleared' | 'Bounced');
      setNotesInput(pdc.notes || '');
      setChequeImageInput(pdc.chequeImage || pdc.attachment?.dataUrl || '');
    } else {
      setEditingPdc(null);
      setTypeInput('incoming');
      setPartyNameInput('');
      setChequeNumberInput('');
      setBankNameInput('Emirates NBD');
      setAmountInput('');
      setChequeDateInput(new Date().toISOString().split('T')[0]);
      setMaturityDateInput(new Date().toISOString().split('T')[0]);
      setStatusInput('Pending');
      setNotesInput('');
      setChequeImageInput('');
    }
    setIsModalOpen(true);
  };

  // Modal save handler
  const handleSavePdc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyNameInput.trim()) {
      alert('⚠️ Party Name is required');
      return;
    }
    if (!chequeNumberInput.trim()) {
      alert('⚠️ Cheque Number is required');
      return;
    }
    if (!amountInput || Number(amountInput) <= 0) {
      alert('⚠️ Please enter a valid Cheque Amount in AED');
      return;
    }

    const pdcData: PdcCheque = {
      id: editingPdc ? editingPdc.id : `pdc-${Date.now()}`,
      companyId: activeCompanyId,
      type: typeInput,
      partyName: partyNameInput.trim(),
      chequeNumber: chequeNumberInput.trim(),
      bankName: bankNameInput.trim(),
      amount: Number(amountInput),
      chequeDate: chequeDateInput,
      maturityDate: maturityDateInput,
      status: statusInput,
      notes: notesInput.trim(),
      createdDate: editingPdc ? editingPdc.createdDate : new Date().toISOString().split('T')[0],
      chequeImage: chequeImageInput || undefined,
      attachment: chequeImageInput ? { name: `PDC_${chequeNumberInput.trim()}.png`, dataUrl: chequeImageInput } : undefined
    };

    if (editingPdc) {
      setPdcs(prev => prev.map(p => p.id === editingPdc.id ? pdcData : p));
    } else {
      setPdcs(prev => [pdcData, ...prev]);
    }

    setIsModalOpen(false);
  };

  // Toast Notification state
  const [clearedToast, setClearedToast] = useState<{ message: string; details: string } | null>(null);

  // Status Change Actions
  const handleMarkCleared = (pdc: PdcCheque) => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // 1. Update PDC status
    setPdcs(prev => prev.map(p => {
      if (p.id === pdc.id) {
        return { ...p, status: 'Cleared', clearedDate: todayStr };
      }
      return p;
    }));

    const isIncoming = pdc.type === 'incoming';

    // 2. Post automated Double-Entry Journal Entry to General Ledger (localStorage key: 'hisaab_journal_entries')
    try {
      const savedJE = localStorage.getItem('hisaab_journal_entries');
      let existingJE: any[] = [];
      if (savedJE) {
        try { existingJE = JSON.parse(savedJE); } catch (e) { existingJE = []; }
      }

      const drAccount = isIncoming ? '1020' : '2100'; // 1020 Bank / 2100 Accounts Payable
      const crAccount = isIncoming ? '1100' : '1020'; // 1100 Accounts Receivable / 1020 Bank

      const newJournalEntry = {
        id: `je-pdc-${Date.now()}`,
        companyId: activeCompanyId,
        date: todayStr,
        reference: `PDC-CLR-${pdc.chequeNumber}`,
        description: `PDC Clearance: Chq #${pdc.chequeNumber} (${pdc.bankName}) - ${pdc.partyName}`,
        status: 'Posted',
        isAutoLinked: true,
        lines: [
          {
            id: `line-1-${Date.now()}`,
            accountId: drAccount === '1020' ? 'acc-1020' : 'acc-2100',
            accountCode: drAccount,
            accountName: drAccount === '1020' ? `1020 - ${pdc.bankName || 'Bank Account'}` : '2100 - Accounts Payable',
            debit: pdc.amount,
            credit: 0
          },
          {
            id: `line-2-${Date.now()}`,
            accountId: crAccount === '1100' ? 'acc-1100' : 'acc-1020',
            accountCode: crAccount,
            accountName: crAccount === '1100' ? '1100 - Accounts Receivable' : `1020 - ${pdc.bankName || 'Bank Account'}`,
            debit: 0,
            credit: pdc.amount
          }
        ]
      };

      existingJE.unshift(newJournalEntry);
      safeSetLocalStorage('hisaab_journal_entries', existingJE);
      
      // Broadcast event for live updates
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Failed to auto-post PDC clearing journal entry:', err);
    }

    // 3. Trigger Success Toast
    const toastMsg = isIncoming ? `PDC Cheque #${pdc.chequeNumber} Cleared & Posted to Bank Ledger!` : `Outgoing PDC #${pdc.chequeNumber} Cleared!`;
    const toastDetails = isIncoming 
      ? `Journal Entry Auto-Posted: DR 1020 Bank (AED ${pdc.amount.toLocaleString()}) | CR 1100 Accounts Receivable (AED ${pdc.amount.toLocaleString()})`
      : `Journal Entry Auto-Posted: DR 2100 Accounts Payable (AED ${pdc.amount.toLocaleString()}) | CR 1020 Bank (AED ${pdc.amount.toLocaleString()})`;

    setClearedToast({ message: toastMsg, details: toastDetails });
    setTimeout(() => setClearedToast(null), 7000);
  };

  const handleOpenBounceModal = (pdc: PdcCheque) => {
    setBounceModalPdc(pdc);
    setBounceReasonInput('Insufficient Funds (Refer to Drawer)');
  };

  const handleConfirmBounce = () => {
    if (!bounceModalPdc) return;
    setPdcs(prev => prev.map(p => {
      if (p.id === bounceModalPdc.id) {
        return { ...p, status: 'Bounced', bouncedReason: bounceReasonInput };
      }
      return p;
    }));
    setBounceModalPdc(null);
  };

  // Batch Checkbox Actions
  const handleBatchClearance = () => {
    if (selectedPdcIds.length === 0) return;
    const itemsToClear = pdcs.filter(p => selectedPdcIds.includes(p.id) && p.status !== 'Cleared');
    if (itemsToClear.length === 0) {
      alert('⚠️ All selected cheques are already marked as Cleared!');
      return;
    }

    itemsToClear.forEach(pdc => {
      handleMarkCleared(pdc);
    });

    setSelectedPdcIds([]);
    alert(`✅ Batch Action Complete! ${itemsToClear.length} Post-Dated Cheques have been cleared and posted to the General Ledger & Bank Balance.`);
  };

  const handleBatchBounce = () => {
    if (selectedPdcIds.length === 0) return;
    const itemsToBounce = pdcs.filter(p => selectedPdcIds.includes(p.id) && p.status !== 'Bounced');
    if (itemsToBounce.length === 0) return;

    const reason = prompt(`Enter bounce reason for ${itemsToBounce.length} selected cheques:`, 'Insufficient Funds (Refer to Drawer)');
    if (reason === null) return;

    setPdcs(prev => prev.map(p => {
      if (selectedPdcIds.includes(p.id)) {
        return { ...p, status: 'Bounced', bouncedReason: reason };
      }
      return p;
    }));

    setSelectedPdcIds([]);
    alert(`⚠️ Batch Action Complete! ${itemsToBounce.length} cheques marked as Bounced (${reason}).`);
  };

  const handleDeletePdc = (id: string) => {
    if (confirm('Are you sure you want to delete this PDC record?')) {
      setPdcs(prev => prev.filter(p => p.id !== id));
    }
  };

  // Export to CSV
  const handleExportExcel = () => {
    if (pdcs.length === 0) {
      alert('No PDC records to export.');
      return;
    }

    const headers = ['Type', 'Party Name', 'Cheque No', 'Bank Name', 'Amount (AED)', 'Issue Date', 'Maturity Date', 'Status', 'Notes'];
    const rows = filteredPdcs.map(p => [
      p.type.toUpperCase(),
      `"${p.partyName.replace(/"/g, '""')}"`,
      `"${p.chequeNumber}"`,
      `"${p.bankName}"`,
      p.amount.toFixed(2),
      p.chequeDate,
      p.maturityDate,
      p.status,
      `"${(p.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Hisaab_Pro_PDC_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER BAR matching prompt layout: HISAAB PRO > PDC MANAGEMENT HUB [+ New PDC] */}
      <div className="bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-mono font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase mb-1">
            <span>HISAAB PRO</span>
            <span>&gt;</span>
            <span className="text-slate-700 dark:text-slate-300">FINANCE MODULE</span>
            <span>&gt;</span>
            <span className="text-indigo-600 dark:text-indigo-400">PDC MANAGEMENT HUB</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight">
            <CreditCard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>PDC Management Hub</span>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
              UAE Post-Dated Cheques
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track incoming &amp; outgoing cheques, maturity dates, automated 3-day deposit alerts, and clearing statuses.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export to Excel</span>
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ New PDC</span>
          </button>
        </div>
      </div>

      {/* SUCCESS TOAST BANNER FOR JOURNAL POSTING */}
      {clearedToast && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500 rounded-xl p-4 flex items-center justify-between shadow-md animate-fade-in no-print">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-emerald-950 dark:text-emerald-100 uppercase tracking-wide font-mono">
                {clearedToast.message}
              </div>
              <div className="text-xs text-emerald-800 dark:text-emerald-300 font-mono mt-0.5 font-bold">
                {clearedToast.details}
              </div>
            </div>
          </div>
          <button onClick={() => setClearedToast(null)} className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-950 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PDC STATUS OVERVIEW SECTION */}
      <div className="bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div>
            <div className="flex items-center space-x-2 text-[10px] font-mono font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              <span>PDC STATUS OVERVIEW</span>
            </div>
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight mt-0.5 flex items-center gap-2">
              <PieChart className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
              <span>Cheque Performance Analytics &amp; 6-Month Maturity Projection</span>
            </h2>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="text-slate-500 dark:text-slate-400">Total Incoming: <strong className="text-emerald-600 dark:text-emerald-400">AED {totalIncomingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-slate-500 dark:text-slate-400">Total Outgoing: <strong className="text-indigo-600 dark:text-indigo-400">AED {totalOutgoingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
          </div>
        </div>

        {/* Card-Based Summaries: Total Pending PDCs, Total Bounced, Total Cleared */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Total Pending PDCs */}
          <div className="bg-amber-50/60 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-800/60 rounded-xl p-4 shadow-xs relative overflow-hidden transition-all hover:border-amber-400">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Total Pending PDCs
              </span>
              <span className="text-[10px] font-mono font-bold bg-amber-200 dark:bg-amber-900/80 text-amber-950 dark:text-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300/80">
                {pendingCheques.length} CHEQUES
              </span>
            </div>
            <div className="text-2xl font-black text-amber-950 dark:text-amber-100 font-mono tracking-tight">
              AED {pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-2 text-[11px] text-amber-800 dark:text-amber-300 font-medium flex items-center justify-between border-t border-amber-200/80 dark:border-amber-800/40 pt-2 font-mono">
              <span>Awaiting Bank Maturity</span>
              <span className="font-bold">{due3DaysCount > 0 ? `⚠️ ${due3DaysCount} Urgent (3 Days)` : 'Status OK'}</span>
            </div>
          </div>

          {/* Card 2: Total Bounced */}
          <div className="bg-rose-50/60 dark:bg-rose-950/20 border-2 border-rose-300 dark:border-rose-800/60 rounded-xl p-4 shadow-xs relative overflow-hidden transition-all hover:border-rose-400">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                Total Bounced
              </span>
              <span className="text-[10px] font-mono font-bold bg-rose-200 dark:bg-rose-900/80 text-rose-950 dark:text-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300/80">
                {bouncedChequesList.length} CHEQUES
              </span>
            </div>
            <div className="text-2xl font-black text-rose-950 dark:text-rose-100 font-mono tracking-tight">
              AED {bouncedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-2 text-[11px] text-rose-800 dark:text-rose-300 font-medium flex items-center justify-between border-t border-rose-200/80 dark:border-rose-800/40 pt-2 font-mono">
              <span>Returned / Dishonoured</span>
              <span className="font-bold text-rose-700 dark:text-rose-300">Requires Follow-up</span>
            </div>
          </div>

          {/* Card 3: Total Cleared */}
          <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border-2 border-emerald-300 dark:border-emerald-800/60 rounded-xl p-4 shadow-xs relative overflow-hidden transition-all hover:border-emerald-400">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Total Cleared
              </span>
              <span className="text-[10px] font-mono font-bold bg-emerald-200 dark:bg-emerald-900/80 text-emerald-950 dark:text-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300/80">
                {clearedChequesList.length} CHEQUES
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-950 dark:text-emerald-100 font-mono tracking-tight">
              AED {clearedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-2 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium flex items-center justify-between border-t border-emerald-200/80 dark:border-emerald-800/40 pt-2 font-mono">
              <span>Funded &amp; Posted to Bank</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300">Realized Cash Flow</span>
            </div>
          </div>

        </div>

        {/* Trend Line Chart (Recharts 6-Month Maturity Projection) */}
        <div className="bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>PDC Maturity Volume Trend (6-Month Projection)</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Monthly breakdown of expected incoming and outgoing cheque maturities for liquidity forecasting.
              </p>
            </div>
            
            <div className="flex items-center space-x-3 text-xs font-mono font-semibold">
              <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
                Total Volume
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                Incoming PDCs
              </span>
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                Outgoing PDCs
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={next6MonthsData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                <XAxis 
                  dataKey="monthLabel" 
                  tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} 
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }} 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="totalVolume" 
                  name="Total Maturity Volume" 
                  stroke="#6366F1" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="incoming" 
                  name="Incoming PDCs" 
                  stroke="#10B981" 
                  strokeWidth={2.5} 
                  dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#FFFFFF' }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="outgoing" 
                  name="Outgoing PDCs" 
                  stroke="#F59E0B" 
                  strokeWidth={2.5} 
                  dot={{ r: 4, fill: '#F59E0B', strokeWidth: 2, stroke: '#FFFFFF' }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ALERT BANNER matching prompt: [🔔 2 Cheques due in 3 days] */}
      {due3DaysCount > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200 font-mono">
                  🔔 ATTENTION: {due3DaysCount} CHEQUE{due3DaysCount > 1 ? 'S' : ''} DUE IN 3 DAYS OR OVERDUE!
                </span>
                <span className="bg-amber-500 text-slate-950 font-black text-[9.5px] uppercase tracking-widest px-2 py-0.5 rounded-full font-mono">
                  ACTION REQUIRED
                </span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5 font-sans">
                You have post-dated cheques reaching maturity. Highlighted in <strong>YELLOW</strong> below for immediate presentation at your bank branch or deposit machine.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setFilterStatus('Due3Days');
              setFilterType('all');
            }}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg transition-all cursor-pointer shrink-0 shadow-xs"
          >
            View Urgent PDCs ({due3DaysCount})
          </button>
        </div>
      )}

      {/* FILTER & CONTROL BAR matching prompt: [Filter: All] [Incoming] [Outgoing] [Pending] [Bounced] */}
      <div className="bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Filter Tabs matching prompt exactly */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl text-xs font-bold">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest px-2">Type:</span>
            
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All Types
            </button>

            <button
              onClick={() => setFilterType('incoming')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                filterType === 'incoming'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Incoming</span>
            </button>

            <button
              onClick={() => setFilterType('outgoing')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                filterType === 'outgoing'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Outgoing</span>
            </button>
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl text-xs font-bold">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest px-2">Status:</span>

            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Statuses
            </button>

            <button
              onClick={() => setFilterStatus('Pending')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterStatus === 'Pending'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
              }`}
            >
              Pending
            </button>

            <button
              onClick={() => setFilterStatus('Due3Days')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-black flex items-center space-x-1 ${
                filterStatus === 'Due3Days'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40'
              }`}
            >
              <Bell className="w-3 h-3 text-amber-600" />
              <span>Due in 3 Days ({due3DaysCount})</span>
            </button>

            <button
              onClick={() => setFilterStatus('Bounced')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterStatus === 'Bounced'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
              }`}
            >
              Bounced
            </button>

            <button
              onClick={() => setFilterStatus('Cleared')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterStatus === 'Cleared'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              }`}
            >
              Cleared
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Party, Chq #, Bank..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500 font-sans"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

      </div>

      {/* TABLE matching prompt layout: Date | Party | Chq No | Amount | Maturity | Status | Action */}
      <div className="bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Batch Clearance Action Bar */}
        {selectedPdcIds.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-3.5 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-indigo-800 animate-fade-in no-print">
            <div className="flex items-center space-x-2 text-xs font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                <strong>{selectedPdcIds.length}</strong> PDC Cheques Selected for Clearance / Action
              </span>
              <span className="text-slate-400 ml-2">| Total Value: </span>
              <strong className="text-emerald-400 font-bold">
                AED {pdcs.filter(p => selectedPdcIds.includes(p.id)).reduce((acc, p) => acc + p.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
              <button
                onClick={handleBatchClearance}
                className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all shadow-sm flex items-center justify-center space-x-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark Selected as Cleared ({selectedPdcIds.length})</span>
              </button>

              <button
                onClick={handleBatchBounce}
                className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-all shadow-sm flex items-center justify-center space-x-1 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Bounce Selected</span>
              </button>

              <button
                onClick={() => setSelectedPdcIds([])}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-all cursor-pointer"
              >
                Uncheck All
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4 w-10 text-center no-print">
                  <input
                    type="checkbox"
                    checked={filteredPdcs.length > 0 && filteredPdcs.every(p => selectedPdcIds.includes(p.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPdcIds(filteredPdcs.map(p => p.id));
                      } else {
                        setSelectedPdcIds([]);
                      }
                    }}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    title="Check / Uncheck All PDCs"
                  />
                </th>
                <th className="py-3 px-4 font-bold">Type &amp; Date</th>
                <th className="py-3 px-4 font-bold">Party Legal Name</th>
                <th className="py-3 px-4 font-bold">Chq No</th>
                <th className="py-3 px-4 font-bold">Bank Name</th>
                <th className="py-3 px-4 font-bold text-right">Amount (AED)</th>
                <th className="py-3 px-4 font-bold">Maturity Date</th>
                <th className="py-3 px-4 font-bold text-center">Status</th>
                <th className="py-3 px-4 font-bold text-right no-print">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {filteredPdcs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-sans">
                    <CreditCard className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2 stroke-1" />
                    <p className="font-bold text-slate-600 dark:text-slate-300">No Post-Dated Cheques Found</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try resetting your filters or click "+ New PDC" to add a record.</p>
                  </td>
                </tr>
              ) : (
                filteredPdcs.map((pdc) => {
                  const daysToMat = getDaysToMaturity(pdc.maturityDate);
                  const isUrgentYellow = isDueWithin3Days(pdc);
                  const isBouncedRed = pdc.status === 'Bounced';
                  const isClearedGreen = pdc.status === 'Cleared';
                  const isChecked = selectedPdcIds.includes(pdc.id);

                  // Row background matching user rule:
                  // 3 din baad YELLOW, Bounced RED, Cleared GREEN
                  let rowBgClass = "hover:bg-slate-50 dark:hover:bg-slate-900/50";
                  if (isChecked) {
                    rowBgClass = "bg-indigo-50/60 dark:bg-indigo-950/40 border-l-4 border-l-indigo-600 font-medium";
                  } else if (isUrgentYellow) {
                    rowBgClass = "bg-amber-100/60 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-950/60 border-l-4 border-l-amber-500";
                  } else if (isBouncedRed) {
                    rowBgClass = "bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-100/50 dark:hover:bg-rose-950/50 border-l-4 border-l-rose-500";
                  } else if (isClearedGreen) {
                    rowBgClass = "bg-emerald-50/30 dark:bg-emerald-950/20 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 border-l-4 border-l-emerald-500";
                  }

                  return (
                    <tr key={pdc.id} className={`transition-colors ${rowBgClass}`}>
                      
                      {/* Checkbox Column */}
                      <td className="py-3.5 px-4 text-center no-print">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedPdcIds(prev => prev.filter(id => id !== pdc.id));
                            } else {
                              setSelectedPdcIds(prev => [...prev, pdc.id]);
                            }
                          }}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      
                      {/* Type & Issue Date */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center space-x-1.5">
                          {pdc.type === 'incoming' ? (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1">
                              <ArrowDownLeft className="w-3 h-3" />
                              IN
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1">
                              <ArrowUpRight className="w-3 h-3" />
                              OUT
                            </span>
                          )}
                          <span className="text-slate-700 dark:text-slate-300 font-semibold">{pdc.chequeDate}</span>
                        </div>
                      </td>

                      {/* Party Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100 font-sans">
                          {pdc.partyName}
                        </div>
                        {pdc.notes && (
                          <div className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                            {pdc.notes}
                          </div>
                        )}
                      </td>

                      {/* Cheque Number */}
                      <td className="py-3.5 px-4 font-mono font-black text-indigo-600 dark:text-indigo-400">
                        <div>#{pdc.chequeNumber}</div>
                        {(pdc.chequeImage || pdc.attachment?.dataUrl) && (
                          <button
                            type="button"
                            onClick={() => setViewerChequeImage(pdc.chequeImage || pdc.attachment?.dataUrl || null)}
                            className="mt-0.5 inline-flex items-center space-x-1 text-[9.5px] font-sans font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            <Paperclip className="w-2.5 h-2.5" />
                            <span>View Scan</span>
                          </button>
                        )}
                      </td>

                      {/* Bank Name */}
                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        <div className="flex items-center space-x-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{pdc.bankName}</span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-mono font-black text-right text-slate-900 dark:text-slate-100 text-sm">
                        AED {pdc.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Maturity Date */}
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <div className="flex items-center space-x-1 text-slate-800 dark:text-slate-200">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{pdc.maturityDate}</span>
                        </div>
                        {pdc.status === 'Pending' && (
                          <div className={`text-[10px] font-bold mt-0.5 ${
                            daysToMat <= 0 
                              ? 'text-rose-600 dark:text-rose-400 font-black' 
                              : daysToMat <= 3 
                              ? 'text-amber-700 dark:text-amber-300 font-black' 
                              : 'text-slate-400'
                          }`}>
                            {daysToMat < 0 
                              ? `⚠️ OVERDUE BY ${Math.abs(daysToMat)} DAYS` 
                              : daysToMat === 0 
                              ? '⚠️ DUE TODAY!' 
                              : daysToMat <= 3 
                              ? `🔔 Due in ${daysToMat} day${daysToMat > 1 ? 's' : ''}` 
                              : `Due in ${daysToMat} days`}
                          </div>
                        )}
                      </td>

                      {/* Status Badge matching rules */}
                      <td className="py-3.5 px-4 text-center">
                        {isUrgentYellow ? (
                          <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider font-mono shadow-xs animate-pulse">
                            <Bell className="w-3 h-3" />
                            [Pending - Due &lt;= 3d]
                          </span>
                        ) : isBouncedRed ? (
                          <span className="inline-flex items-center gap-1 bg-rose-600 text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider font-mono shadow-xs">
                            <XCircle className="w-3 h-3" />
                            [Bounced]
                          </span>
                        ) : isClearedGreen ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-600 text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider font-mono shadow-xs">
                            <CheckCircle2 className="w-3 h-3" />
                            [Cleared]
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono">
                            <Clock className="w-3 h-3 text-slate-500" />
                            [Pending]
                          </span>
                        )}
                        {pdc.bouncedReason && (
                          <div className="text-[9.5px] text-rose-600 dark:text-rose-400 font-sans mt-0.5 max-w-[140px] truncate mx-auto">
                            {pdc.bouncedReason}
                          </div>
                        )}
                      </td>

                      {/* Action Menu */}
                      <td className="py-3.5 px-4 text-right no-print">
                        <div className="flex items-center justify-end space-x-1">
                          
                          {pdc.status === 'Pending' && (
                            <>
                              <button
                                title="Mark as Cleared"
                                onClick={() => handleMarkCleared(pdc)}
                                className="bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-600 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>Clear</span>
                              </button>

                              <button
                                title="Mark as Bounced"
                                onClick={() => handleOpenBounceModal(pdc)}
                                className="bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-600 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Bounce</span>
                              </button>
                            </>
                          )}

                          {pdc.status === 'Bounced' && (
                            <button
                              title="Re-open PDC"
                              onClick={() => {
                                setPdcs(prev => prev.map(p => p.id === pdc.id ? { ...p, status: 'Pending', bouncedReason: undefined } : p));
                              }}
                              className="bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer"
                            >
                              Re-open
                            </button>
                          )}

                          <button
                            title="Edit PDC"
                            onClick={() => handleOpenModal(pdc)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            title="Delete PDC"
                            onClick={() => handleDeletePdc(pdc.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>

        {/* Footer Summary Bar */}
        <div className="bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 p-3.5 px-4 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 gap-2">
          <div>
            Showing <strong>{filteredPdcs.length}</strong> of <strong>{totalChequesCount}</strong> Total Post-Dated Cheques
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              Cleared: AED {clearedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              Pending: AED {pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">
              Bounced: AED {bouncedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

      </div>

      {/* MODAL: ADD / EDIT PDC CHEQUE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in no-print">
          <div className="bg-white dark:bg-[#0c111d] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-zoom-in">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 px-5 flex items-center justify-between border-b border-indigo-500">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest font-mono">
                  {editingPdc ? 'Edit Post-Dated Cheque (PDC)' : '+ Issue / Receive New PDC Cheque'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSavePdc} className="p-5 space-y-4 text-xs font-sans">
              
              {/* Type Switcher */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Cheque Flow Type <span className="text-indigo-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTypeInput('incoming')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      typeInput === 'incoming'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                    <span>Incoming (From Customer)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTypeInput('outgoing')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      typeInput === 'outgoing'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-indigo-500" />
                    <span>Outgoing (To Supplier / Rent)</span>
                  </button>
                </div>
              </div>

              {/* Party Name Dropdown Selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  {typeInput === 'incoming' ? 'Incoming Customer' : 'Outgoing Supplier / Rent Vendor'} <span className="text-indigo-500">*</span>
                </label>

                {typeInput === 'incoming' ? (
                  /* Incoming Customers Dropdown List */
                  <div>
                    <select
                      value={isCustomParty ? '__custom__' : partyNameInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__custom__') {
                          setIsCustomParty(true);
                          setPartyNameInput('');
                        } else {
                          setIsCustomParty(false);
                          setPartyNameInput(val);
                        }
                      }}
                      className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900 focus:outline-hidden focus:border-indigo-500 text-xs font-bold text-slate-900 dark:text-slate-100 cursor-pointer"
                    >
                      <option value="">-- Select Customer from Dropdown List --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.name}>
                          {c.name} {c.phone ? `(${c.phone})` : ''} {c.emirate ? `- ${c.emirate}` : ''}
                        </option>
                      ))}
                      <option value="__custom__">✍️ Enter Custom Customer Name...</option>
                    </select>

                    {(isCustomParty || (partyNameInput && !customers.some(c => c.name === partyNameInput))) && (
                      <input
                        type="text"
                        required
                        placeholder="Type custom customer name..."
                        value={partyNameInput}
                        onChange={(e) => setPartyNameInput(e.target.value)}
                        className="w-full mt-2 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900 focus:outline-hidden focus:border-indigo-500 text-xs font-bold"
                      />
                    )}
                  </div>
                ) : (
                  /* Outgoing Suppliers & Rent Vendors Dropdown List */
                  <div>
                    <select
                      value={isCustomParty ? '__custom__' : partyNameInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__custom__') {
                          setIsCustomParty(true);
                          setPartyNameInput('');
                        } else {
                          setIsCustomParty(false);
                          setPartyNameInput(val);
                        }
                      }}
                      className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900 focus:outline-hidden focus:border-indigo-500 text-xs font-bold text-slate-900 dark:text-slate-100 cursor-pointer"
                    >
                      <option value="">-- Select Outgoing Supplier or Rent Vendor --</option>

                      <optgroup label="🏢 Rent & Property Landlords">
                        {DEFAULT_RENT_VENDORS.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </optgroup>

                      <optgroup label="📦 Registered Suppliers Directory">
                        {suppliersList.map(s => (
                          <option key={s.id} value={s.name}>
                            {s.name} {s.supplierCode ? `[${s.supplierCode}]` : ''}
                          </option>
                        ))}
                      </optgroup>

                      <optgroup label="⚡ Utilities & Telecom">
                        {UTILITY_VENDORS.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </optgroup>

                      <option value="__custom__">✍️ Enter Custom Supplier / Landlord Name...</option>
                    </select>

                    {(isCustomParty || (partyNameInput && !DEFAULT_RENT_VENDORS.includes(partyNameInput) && !suppliersList.some(s => s.name === partyNameInput) && !UTILITY_VENDORS.includes(partyNameInput))) && (
                      <input
                        type="text"
                        required
                        placeholder="Type supplier / landlord name..."
                        value={partyNameInput}
                        onChange={(e) => setPartyNameInput(e.target.value)}
                        className="w-full mt-2 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900 focus:outline-hidden focus:border-indigo-500 text-xs font-bold"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Cheque # & Bank */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Cheque Number <span className="text-indigo-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 12345"
                    value={chequeNumberInput}
                    onChange={(e) => setChequeNumberInput(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900 font-mono font-bold focus:outline-hidden focus:border-indigo-500 text-xs text-indigo-600 dark:text-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Issuing Bank Name <span className="text-indigo-500">*</span>
                  </label>
                  <select
                    value={bankNameInput}
                    onChange={(e) => setBankNameInput(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900 focus:outline-hidden focus:border-indigo-500 text-xs font-sans font-medium"
                  >
                    {UAE_BANKS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amount & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Cheque Amount (AED) <span className="text-indigo-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="25000.00"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900 font-mono font-black text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value as 'Pending' | 'Cleared' | 'Bounced')}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900 focus:outline-hidden focus:border-indigo-500 text-xs font-bold"
                  >
                    <option value="Pending">Pending Clearance</option>
                    <option value="Cleared">Cleared</option>
                    <option value="Bounced">Bounced</option>
                  </select>
                </div>
              </div>

              {/* Issue Date & Maturity Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Cheque Issue Date
                  </label>
                  <input
                    type="date"
                    required
                    value={chequeDateInput}
                    onChange={(e) => setChequeDateInput(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900 font-mono text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 text-amber-600 dark:text-amber-400 font-extrabold">
                    Maturity / Clearance Date <span className="text-indigo-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={maturityDateInput}
                    onChange={(e) => setMaturityDateInput(e.target.value)}
                    className="w-full border-2 border-amber-400 dark:border-amber-700 rounded-xl px-3 py-2 bg-amber-50/50 dark:bg-amber-950/30 font-mono font-bold text-xs focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Notes / Linked Invoice Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. Invoice #INV-2026-081 installment cheque"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900 focus:outline-hidden focus:border-indigo-500 text-xs"
                />
              </div>

              {/* Attach PDC Cheque Copy (Optional Scan/Photo) */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                  <span>Attach PDC Cheque Copy / Scan (Optional)</span>
                  {chequeImageInput && (
                    <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">✓ Cheque Image Attached</span>
                  )}
                </label>

                <div className="flex items-center space-x-2">
                  <label className="flex-1 flex items-center justify-center space-x-2 px-3 py-2.5 border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-500 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 font-bold text-xs cursor-pointer transition-all">
                    <Paperclip className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="truncate">{chequeImageInput ? 'Change Attached Cheque Image' : 'Scan or Upload PDC Cheque Copy'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleChequeUpload}
                      className="hidden"
                    />
                  </label>

                  {chequeImageInput && (
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setViewerChequeImage(chequeImageInput)}
                        className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 cursor-pointer"
                        title="View Attached Cheque Scan"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setChequeImageInput('')}
                        className="p-2 bg-rose-100 text-rose-700 rounded-xl hover:bg-rose-200 cursor-pointer"
                        title="Remove Attachment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-2 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {editingPdc ? 'Save PDC Changes' : 'Record PDC Cheque'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* BOUNCE REASON MODAL */}
      {bounceModalPdc && (
        <div className="fixed inset-0 bg-[#0F172A]/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in no-print">
          <div className="bg-white dark:bg-[#0c111d] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-rose-300 dark:border-rose-900/60 animate-zoom-in">
            
            <div className="bg-rose-600 text-white p-4 px-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-xs font-bold uppercase tracking-widest font-mono">
                  Record Cheque Bounce Status
                </h3>
              </div>
              <button onClick={() => setBounceModalPdc(null)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-sans">
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 p-3 rounded-xl">
                <div className="font-bold text-rose-900 dark:text-rose-200">
                  Cheque #{bounceModalPdc.chequeNumber} — AED {bounceModalPdc.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-rose-700 dark:text-rose-300">
                  Party: {bounceModalPdc.partyName} ({bounceModalPdc.bankName})
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Reason for Cheque Bounce / Return <span className="text-rose-500">*</span>
                </label>
                <select
                  value={bounceReasonInput}
                  onChange={(e) => setBounceReasonInput(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900 focus:outline-hidden focus:border-rose-500 text-xs font-semibold"
                >
                  <option value="Insufficient Funds (Refer to Drawer)">Insufficient Funds (Refer to Drawer)</option>
                  <option value="Signature Mismatch">Signature Mismatch</option>
                  <option value="Account Closed or Frozen">Account Closed or Frozen</option>
                  <option value="Post-dated Date Altered">Post-dated Date Altered / Stale Cheque</option>
                  <option value="Payment Stopped by Drawer">Payment Stopped by Drawer</option>
                  <option value="Other Bank Exception">Other Bank Exception</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setBounceModalPdc(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBounce}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-2 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Mark as Bounced
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Lightbox / Full PDC Cheque Image Viewer Modal */}
      {viewerChequeImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print" onClick={() => setViewerChequeImage(null)}>
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-2xl p-4 border border-slate-700 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-white">
              <div className="flex items-center space-x-2">
                <Paperclip className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Attached PDC Cheque Copy</span>
              </div>
              <button
                onClick={() => setViewerChequeImage(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img src={viewerChequeImage} alt="PDC Cheque Scan" className="w-full h-auto max-h-[75vh] object-contain rounded-xl mx-auto bg-black/40" />
          </div>
        </div>
      )}

    </div>
  );
}
