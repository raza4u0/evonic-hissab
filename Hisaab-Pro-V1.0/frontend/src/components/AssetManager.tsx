import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  Eye, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Calendar, 
  DollarSign, 
  FileText, 
  ShieldCheck, 
  X, 
  AlertTriangle,
  QrCode,
  TrendingDown,
  Layers,
  Wrench,
  Archive,
  RefreshCw
} from 'lucide-react';
import { FixedAsset, AssetCategory, DepreciationMethod, Company, Branch, Staff, JournalEntry, COAAccount } from '../types';

interface AssetManagerProps {
  activeCompanyId: string;
  company?: Company;
  branches?: Branch[];
  staff?: Staff[];
  fixedAssets: FixedAsset[];
  onAddAsset: (asset: Omit<FixedAsset, 'id'>) => void;
  onUpdateAsset: (asset: FixedAsset) => void;
  onDeleteAsset: (id: string) => void;
  onAddJournalEntry?: (je: JournalEntry) => void;
  coaAccounts?: COAAccount[];
  activeSidebarItemId?: string;
  setActiveSidebarItemId?: (id: string) => void;
}

const CATEGORY_PRESETS: Record<AssetCategory, { usefulLife: number; defaultMethod: DepreciationMethod }> = {
  'Computers & IT Hardware': { usefulLife: 3, defaultMethod: 'Straight-Line' },
  'Commercial Vehicles': { usefulLife: 5, defaultMethod: 'Straight-Line' },
  'Office Furniture & Fixtures': { usefulLife: 7, defaultMethod: 'Straight-Line' },
  'Plant & Machinery': { usefulLife: 8, defaultMethod: 'Straight-Line' },
  'Office Equipment': { usefulLife: 4, defaultMethod: 'Straight-Line' },
  'Buildings & Leasehold': { usefulLife: 20, defaultMethod: 'Straight-Line' }
};

export const AssetManager: React.FC<AssetManagerProps> = ({
  activeCompanyId,
  company,
  branches = [],
  staff = [],
  fixedAssets,
  onAddAsset,
  onUpdateAsset,
  onDeleteAsset,
  onAddJournalEntry,
  coaAccounts = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');

  // Modals & Sheets
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
  const [previewAsset, setPreviewAsset] = useState<FixedAsset | null>(null);
  const [tagAsset, setTagAsset] = useState<FixedAsset | null>(null);
  const [disposalAsset, setDisposalAsset] = useState<FixedAsset | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Disposal Form
  const [disposalDate, setDisposalDate] = useState(new Date().toISOString().split('T')[0]);
  const [disposalAmount, setDisposalAmount] = useState<number>(0);
  const [disposalReason, setDisposalReason] = useState('End of Economic Life / Sold');

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>('Computers & IT Hardware');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseCost, setPurchaseCost] = useState<number>(5000);
  const [residualValue, setResidualValue] = useState<number>(500);
  const [usefulLifeYears, setUsefulLifeYears] = useState<number>(3);
  const [depreciationMethod, setDepreciationMethod] = useState<DepreciationMethod>('Straight-Line');
  const [locationBranch, setLocationBranch] = useState(branches[0]?.name || 'Dubai Main Headquarters & Showroom');
  const [custodianStaff, setCustodianStaff] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [status, setStatus] = useState<'Active' | 'Under Maintenance' | 'Disposed' | 'Written Off'>('Active');
  const [notes, setNotes] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filter company assets
  const companyAssets = useMemo(() => {
    return fixedAssets.filter(a => a.companyId === activeCompanyId);
  }, [fixedAssets, activeCompanyId]);

  // Asset Depreciation Calculations Engine (Straight-Line & Reducing-Balance)
  const calculateAssetDepreciation = (asset: FixedAsset) => {
    const cost = Number(asset.purchaseCost) || 0;
    const residual = Number(asset.residualValue) || 0;
    const lifeYears = Number(asset.usefulLifeYears) || 1;
    const pDate = new Date(asset.purchaseDate);
    const today = new Date();

    // Months active
    let monthsElapsed = (today.getFullYear() - pDate.getFullYear()) * 12 + (today.getMonth() - pDate.getMonth());
    if (monthsElapsed < 0) monthsElapsed = 0;

    const totalMonths = lifeYears * 12;
    const depreciableBase = Math.max(0, cost - residual);

    let monthlyDepreciation = 0;
    let accumulatedDepreciation = 0;
    let netBookValue = cost;

    if (asset.depreciationMethod === 'Straight-Line') {
      monthlyDepreciation = depreciableBase / totalMonths;
      accumulatedDepreciation = Math.min(depreciableBase, monthlyDepreciation * monthsElapsed);
      netBookValue = Math.max(residual, cost - accumulatedDepreciation);
    } else {
      // Reducing-Balance (approx 2 / lifeYears annual rate)
      const annualRate = (2 / lifeYears);
      const monthlyRate = annualRate / 12;
      let currentVal = cost;
      for (let m = 0; m < Math.min(monthsElapsed, totalMonths); m++) {
        const dep = (currentVal - residual) * monthlyRate;
        if (dep > 0) {
          accumulatedDepreciation += dep;
          currentVal -= dep;
        }
      }
      monthlyDepreciation = (netBookValue - residual) * monthlyRate;
      netBookValue = Math.max(residual, cost - accumulatedDepreciation);
    }

    const annualDepreciation = monthlyDepreciation * 12;
    const isFullyDepreciated = netBookValue <= residual;

    return {
      monthlyDepreciation: Math.round(monthlyDepreciation * 100) / 100,
      annualDepreciation: Math.round(annualDepreciation * 100) / 100,
      accumulatedDepreciation: Math.round(accumulatedDepreciation * 100) / 100,
      netBookValue: Math.round(netBookValue * 100) / 100,
      monthsElapsed,
      isFullyDepreciated
    };
  };

  // KPIs
  const totalCost = useMemo(() => companyAssets.reduce((sum, a) => sum + (Number(a.purchaseCost) || 0), 0), [companyAssets]);
  const totalAccumulatedDep = useMemo(() => {
    return companyAssets.reduce((sum, a) => {
      const dep = calculateAssetDepreciation(a);
      return sum + dep.accumulatedDepreciation;
    }, 0);
  }, [companyAssets]);

  const totalNBV = Math.max(0, totalCost - totalAccumulatedDep);
  const totalMonthlyDepExpense = useMemo(() => {
    return companyAssets.reduce((sum, a) => {
      if (a.status === 'Disposed' || a.status === 'Written Off') return sum;
      const dep = calculateAssetDepreciation(a);
      return sum + dep.monthlyDepreciation;
    }, 0);
  }, [companyAssets]);

  // Open Add
  const handleOpenAdd = () => {
    setEditingAsset(null);
    setName('');
    setCategory('Computers & IT Hardware');
    setSerialNumber('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setPurchaseCost(5000);
    setResidualValue(500);
    setUsefulLifeYears(CATEGORY_PRESETS['Computers & IT Hardware'].usefulLife);
    setDepreciationMethod('Straight-Line');
    setLocationBranch(branches[0]?.name || 'Dubai Main Headquarters & Showroom');
    setCustodianStaff(staff[0]?.name || '');
    setSupplierName('Gulf Tech Distributors FZCO');
    setStatus('Active');
    setNotes('');
    setIsAddModalOpen(true);
  };

  // Open Edit
  const handleOpenEdit = (asset: FixedAsset) => {
    setEditingAsset(asset);
    setName(asset.name);
    setCategory(asset.category);
    setSerialNumber(asset.serialNumber || '');
    setPurchaseDate(asset.purchaseDate);
    setPurchaseCost(asset.purchaseCost);
    setResidualValue(asset.residualValue);
    setUsefulLifeYears(asset.usefulLifeYears);
    setDepreciationMethod(asset.depreciationMethod);
    setLocationBranch(asset.locationBranch || branches[0]?.name || '');
    setCustodianStaff(asset.custodianStaff || '');
    setSupplierName(asset.supplierName || '');
    setStatus(asset.status);
    setNotes(asset.notes || '');
    setIsAddModalOpen(true);
  };

  // Category change auto preset
  const handleCategoryChange = (cat: AssetCategory) => {
    setCategory(cat);
    const preset = CATEGORY_PRESETS[cat];
    if (preset) {
      setUsefulLifeYears(preset.usefulLife);
      setDepreciationMethod(preset.defaultMethod);
    }
  };

  // Save Asset
  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter an Asset Name.');
      return;
    }

    if (editingAsset) {
      const updated: FixedAsset = {
        ...editingAsset,
        name,
        category,
        serialNumber,
        purchaseDate,
        purchaseCost: Number(purchaseCost) || 0,
        residualValue: Number(residualValue) || 0,
        usefulLifeYears: Number(usefulLifeYears) || 1,
        depreciationMethod,
        locationBranch,
        custodianStaff,
        supplierName,
        status,
        notes
      };
      onUpdateAsset(updated);
      showToast(`Asset ${updated.assetCode} (${updated.name}) updated successfully.`);
    } else {
      const nextNum = companyAssets.length + 1001;
      const newAsset: Omit<FixedAsset, 'id'> = {
        companyId: activeCompanyId,
        assetCode: `AST-${nextNum}`,
        rawNumber: nextNum,
        name,
        category,
        serialNumber,
        purchaseDate,
        purchaseCost: Number(purchaseCost) || 0,
        residualValue: Number(residualValue) || 0,
        usefulLifeYears: Number(usefulLifeYears) || 1,
        depreciationMethod,
        locationBranch,
        custodianStaff,
        supplierName,
        status: 'Active',
        notes
      };
      onAddAsset(newAsset);
      showToast(`Fixed Asset ${newAsset.assetCode} created successfully!`);
    }
    setIsAddModalOpen(false);
  };

  // Asset Disposal Submit
  const handleSaveDisposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disposalAsset) return;

    const dep = calculateAssetDepreciation(disposalAsset);
    const gainOrLoss = disposalAmount - dep.netBookValue;

    const updated: FixedAsset = {
      ...disposalAsset,
      status: 'Disposed',
      disposalDate,
      disposalAmount: Number(disposalAmount) || 0,
      disposalReason
    };
    onUpdateAsset(updated);
    showToast(`Asset ${updated.assetCode} marked as Disposed. ${gainOrLoss >= 0 ? 'Gain' : 'Loss'} on Disposal: AED ${Math.abs(gainOrLoss).toFixed(2)}`);
    setDisposalAsset(null);
  };

  // Run Monthly Depreciation Run
  const handleExecuteDepreciationRun = () => {
    const activeAssets = companyAssets.filter(a => a.status === 'Active');
    if (activeAssets.length === 0) {
      alert('No active fixed assets found to depreciate.');
      return;
    }

    const currentMonthStr = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
    let totalDep = 0;
    activeAssets.forEach(a => {
      const dep = calculateAssetDepreciation(a);
      totalDep += dep.monthlyDepreciation;
    });

    if (onAddJournalEntry) {
      const je: JournalEntry = {
        id: `je_dep_${Date.now()}`,
        companyId: activeCompanyId,
        reference: `JE-DEP-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().split('T')[0],
        description: `Automated Monthly Depreciation Run for ${currentMonthStr} across ${activeAssets.length} fixed assets`,
        status: 'Posted',
        isAutoLinked: true,
        lines: [
          {
            accountCode: '6100', // Depreciation Expense
            debit: Math.round(totalDep * 100) / 100,
            credit: 0
          },
          {
            accountCode: '1590', // Accumulated Depreciation
            debit: 0,
            credit: Math.round(totalDep * 100) / 100
          }
        ]
      };
      onAddJournalEntry(je);
    }

    showToast(`✅ Successfully executed Depreciation Run for ${currentMonthStr}! Posted AED ${totalDep.toFixed(2)} to General Ledger.`);
  };

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return companyAssets.filter(a => {
      const matchSearch = a.assetCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.serialNumber && a.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.custodianStaff && a.custodianStaff.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCat = selectedCategory === 'ALL' || a.category === selectedCategory;
      const matchStatus = selectedStatus === 'ALL' || a.status === selectedStatus;
      const matchBranch = selectedBranch === 'ALL' || a.locationBranch === selectedBranch;
      return matchSearch && matchCat && matchStatus && matchBranch;
    });
  }, [companyAssets, searchQuery, selectedCategory, selectedStatus, selectedBranch]);

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
            <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Fixed Assets & Capital Equipment
            </span>
            <span className="text-slate-400 text-xs font-mono">FTA Compliant Register</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Fixed Asset Register & Depreciation Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track capital assets, calculate automated straight-line/reducing depreciation, manage asset disposal gains/losses, and print asset tags.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExecuteDepreciationRun}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold px-3.5 py-2.5 rounded-xl flex items-center space-x-2 shadow-xs transition-all cursor-pointer"
            title="Post monthly depreciation expense directly to Chart of Accounts"
          >
            <TrendingDown className="w-4 h-4" />
            <span>Run Monthly Depreciation</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Asset</span>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Acquisition Cost
            </span>
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Box className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-xl font-black text-slate-900 dark:text-white">
              AED {totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{companyAssets.length} Registered Assets</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Accumulated Depreciation
            </span>
            <span className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-xl font-black text-amber-600 dark:text-amber-400">
              AED {totalAccumulatedDep.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total written-off value to date</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Net Book Value (NBV)
            </span>
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              AED {totalNBV.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Current Balance Sheet carrying value</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Monthly Dep. Run Rate
            </span>
            <span className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-xl font-black text-blue-600 dark:text-blue-400">
              AED {totalMonthlyDepExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Monthly P&L depreciation expense</p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search asset code, name, serial, custodian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="Computers & IT Hardware">Computers & IT Hardware</option>
            <option value="Commercial Vehicles">Commercial Vehicles</option>
            <option value="Office Furniture & Fixtures">Office Furniture & Fixtures</option>
            <option value="Plant & Machinery">Plant & Machinery</option>
            <option value="Office Equipment">Office Equipment</option>
            <option value="Buildings & Leasehold">Buildings & Leasehold</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Under Maintenance">Under Maintenance</option>
            <option value="Disposed">Disposed</option>
            <option value="Written Off">Written Off</option>
          </select>

          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Locations</option>
            {branches.map(b => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Asset Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-4">Asset Code</th>
                <th className="py-3 px-4">Asset Details & Serial</th>
                <th className="py-3 px-4">Category / Location</th>
                <th className="py-3 px-4">Acquisition Date</th>
                <th className="py-3 px-4 text-right">Cost (AED)</th>
                <th className="py-3 px-4 text-right">Accum. Dep.</th>
                <th className="py-3 px-4 text-right">Net Book Value</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <Box className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold">No Fixed Assets found</p>
                    <p className="text-[11px] text-slate-400 mt-1">Click "Register New Asset" above to add plant, vehicles, computers, or office fixtures.</p>
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => {
                  const dep = calculateAssetDepreciation(asset);
                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {asset.assetCode}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{asset.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          SN: {asset.serialNumber || 'N/A'} {asset.custodianStaff ? `• Custodian: ${asset.custodianStaff}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{asset.category}</div>
                        <div className="text-[11px] text-slate-400">{asset.locationBranch || 'Main HQ'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">{asset.purchaseDate}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{asset.usefulLifeYears} Yrs ({asset.depreciationMethod})</div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white font-mono">
                        AED {asset.purchaseCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-600 dark:text-amber-400 font-bold">
                        AED {dep.accumulatedDepreciation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-black">
                        AED {dep.netBookValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          asset.status === 'Active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          asset.status === 'Under Maintenance' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          asset.status === 'Disposed' ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300' :
                          'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        }`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Asset Barcode / QR Tag */}
                          <button
                            onClick={() => setTagAsset(asset)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-300 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Print Asset Tag Label"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          {/* View Depreciation Schedule */}
                          <button
                            onClick={() => setPreviewAsset(asset)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="View Asset Details & Schedule"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Dispose Asset */}
                          {asset.status === 'Active' && (
                            <button
                              onClick={() => {
                                setDisposalAsset(asset);
                                setDisposalAmount(dep.netBookValue);
                              }}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:hover:bg-amber-900 dark:text-amber-300 p-1.5 rounded-lg transition-colors cursor-pointer"
                              title="Dispose / Sell Asset"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(asset)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Edit Asset"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (confirm(`Delete Fixed Asset ${asset.assetCode} (${asset.name})?`)) {
                                onDeleteAsset(asset.id);
                                showToast(`Deleted Asset ${asset.assetCode}`);
                              }
                            }}
                            className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/50 dark:hover:bg-red-900/80 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Delete Asset"
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
      </div>

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Box className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingAsset ? `Edit Asset (${editingAsset.assetCode})` : 'Register Capital Fixed Asset'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Asset Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MacBook Pro M3 16-inch, Toyota Delivery Van"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value as AssetCategory)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-medium"
                  >
                    <option value="Computers & IT Hardware">Computers & IT Hardware</option>
                    <option value="Commercial Vehicles">Commercial Vehicles</option>
                    <option value="Office Furniture & Fixtures">Office Furniture & Fixtures</option>
                    <option value="Plant & Machinery">Plant & Machinery</option>
                    <option value="Office Equipment">Office Equipment</option>
                    <option value="Buildings & Leasehold">Buildings & Leasehold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Serial / Chassis Number</label>
                  <input
                    type="text"
                    placeholder="e.g. C02G899ZMD6R"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Purchase Date *</label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Purchase Cost (AED) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Salvage Value (AED)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={residualValue}
                    onChange={(e) => setResidualValue(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Useful Life (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={usefulLifeYears}
                    onChange={(e) => setUsefulLifeYears(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Depreciation Method</label>
                  <select
                    value={depreciationMethod}
                    onChange={(e) => setDepreciationMethod(e.target.value as DepreciationMethod)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-medium"
                  >
                    <option value="Straight-Line">Straight-Line Method (SLM)</option>
                    <option value="Reducing-Balance">Reducing Balance (Written Down Value)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Location / Branch</label>
                  <select
                    value={locationBranch}
                    onChange={(e) => setLocationBranch(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-medium"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Custodian / Assigned Staff</label>
                  <input
                    type="text"
                    placeholder="e.g. Rashid Al Nuaimi"
                    value={custodianStaff}
                    onChange={(e) => setCustodianStaff(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {editingAsset ? 'Save Asset Changes' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asset Tag Modal */}
      {tagAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-indigo-600" />
                <span>Asset Identification Tag</span>
              </h3>
              <button
                onClick={() => setTagAsset(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 my-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center space-y-3">
              <div className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                {company?.name || 'evonix Technologies'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">PROPERTY OF UAE ENTERPRISE</div>

              <div className="w-28 h-28 bg-white p-2 rounded-xl shadow-xs mx-auto flex items-center justify-center border border-slate-200">
                <QrCode className="w-24 h-24 text-slate-900" />
              </div>

              <div className="font-mono font-black text-lg text-indigo-600 dark:text-indigo-400 tracking-wider">
                {tagAsset.assetCode}
              </div>

              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {tagAsset.name}
              </div>

              <div className="text-[11px] text-slate-500 font-mono">
                SN: {tagAsset.serialNumber || 'N/A'} • {tagAsset.locationBranch}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal Tag</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disposal Modal */}
      {disposalAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Archive className="w-5 h-5 text-amber-600" />
                <span>Asset Disposal / Write-Off ({disposalAsset.assetCode})</span>
              </h3>
              <button
                onClick={() => setDisposalAsset(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDisposal} className="space-y-4 mt-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-900 dark:text-amber-300">
                Current Net Book Value (NBV): <strong>AED {calculateAssetDepreciation(disposalAsset).netBookValue.toFixed(2)}</strong>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Disposal Date *</label>
                <input
                  type="date"
                  required
                  value={disposalDate}
                  onChange={(e) => setDisposalDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Sale / Scrap Proceeds (AED)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={disposalAmount}
                  onChange={(e) => setDisposalAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Disposal Reason / Remarks</label>
                <input
                  type="text"
                  value={disposalReason}
                  onChange={(e) => setDisposalReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDisposalAsset(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Confirm Asset Disposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asset Preview / Schedule Modal */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>Asset Valuation & Depreciation Certificate</span>
              </h3>
              <button
                onClick={() => setPreviewAsset(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Asset Code</span>
                  <div className="font-mono font-bold text-indigo-600">{previewAsset.assetCode}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Category</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{previewAsset.category}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Original Cost</span>
                  <div className="font-mono font-bold text-slate-900 dark:text-white">AED {previewAsset.purchaseCost.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Current NBV</span>
                  <div className="font-mono font-black text-emerald-600">AED {calculateAssetDepreciation(previewAsset).netBookValue.toFixed(2)}</div>
                </div>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300">
                <strong>Depreciation Method:</strong> {previewAsset.depreciationMethod} Method over {previewAsset.usefulLifeYears} years ({calculateAssetDepreciation(previewAsset).monthsElapsed} months active).
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center space-x-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Asset Register Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
