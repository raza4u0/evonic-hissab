import React, { useState } from 'react';
import { 
  RefreshCw, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  X, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  User,
  Activity,
  DollarSign,
  Settings
} from 'lucide-react';
import { Customer, RecurringInvoice, Company } from '../types';
import { safeSetLocalStorage } from '../utils/safeStorage';

interface RecurringManagerProps {
  customers: Customer[];
  recurringInvoices: RecurringInvoice[];
  activeCompanyId: string;
  company?: Company;
  onAddRecurringInvoice: (rec: Omit<RecurringInvoice, 'id' | 'companyId'>) => void;
  onUpdateRecurringInvoice: (rec: RecurringInvoice) => void;
  onDeleteRecurringInvoice: (id: string) => void;
  onManualTrigger: () => void;
}

export default function RecurringManager({
  customers,
  recurringInvoices,
  activeCompanyId,
  company,
  onAddRecurringInvoice,
  onUpdateRecurringInvoice,
  onDeleteRecurringInvoice,
  onManualTrigger
}: RecurringManagerProps) {
  const companyRecs = recurringInvoices.filter(r => r.companyId === activeCompanyId);
  const companyCustomers = customers.filter(c => c.companyId === activeCompanyId);

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRec, setEditingRec] = useState<RecurringInvoice | null>(null);

  // Column Chooser State
  const [cols, setCols] = useState(() => {
    try {
      const saved = localStorage.getItem('hisaab_cols_recurring');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      customer: true,
      description: true,
      amount: true,
      frequency: true,
      nextBilling: true,
      status: true
    };
  });
  const [showColChooser, setShowColChooser] = useState(false);

  // Form states
  const [customerId, setCustomerId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [nextRunDate, setNextRunDate] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Stats / metrics calculation
  const totalCount = companyRecs.length;
  const totalVolume = companyRecs.reduce((sum, r) => sum + r.total, 0);
  const activeCount = companyRecs.filter(r => r.isActive).length;
  const activeVolume = companyRecs.filter(r => r.isActive).reduce((sum, r) => sum + r.total, 0);
  const pausedCount = companyRecs.filter(r => !r.isActive).length;
  const pausedVolume = companyRecs.filter(r => !r.isActive).reduce((sum, r) => sum + r.total, 0);

  // Filter list
  const filteredRecs = companyRecs.filter(r => {
    const cust = companyCustomers.find(c => c.id === r.customerId);
    const custName = cust ? cust.name.toLowerCase() : '';
    const desc = r.description.toLowerCase();
    const query = search.toLowerCase();
    return custName.includes(query) || desc.includes(query);
  });

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

  const handleOpenAdd = () => {
    setEditingRec(null);
    setCustomerId(companyCustomers[0]?.id || '');
    setDescription('Monthly Retainer Services');
    setAmount(2500);
    // Default next run date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setNextRunDate(tomorrow.toISOString().split('T')[0]);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: RecurringInvoice) => {
    setEditingRec(rec);
    setCustomerId(rec.customerId);
    setDescription(rec.description);
    setAmount(rec.amount);
    setNextRunDate(rec.nextRunDate);
    setIsActive(rec.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId) {
      alert('Please select a customer.');
      return;
    }

    if (!description.trim()) {
      alert('Please provide a description.');
      return;
    }

    if (amount <= 0) {
      alert('Amount must be greater than zero.');
      return;
    }

    if (!nextRunDate) {
      alert('Please select a next run date.');
      return;
    }

    const calculatedVat = Math.round(amount * 0.05 * 100) / 100; // UAE 5% Standard VAT
    const calculatedTotal = amount + calculatedVat;

    if (editingRec) {
      onUpdateRecurringInvoice({
        ...editingRec,
        customerId,
        description,
        amount,
        vatAmount: calculatedVat,
        total: calculatedTotal,
        nextRunDate,
        isActive
      });
    } else {
      onAddRecurringInvoice({
        customerId,
        description,
        amount,
        vatAmount: calculatedVat,
        total: calculatedTotal,
        nextRunDate,
        isActive
      });
    }

    setIsModalOpen(false);
  };

  const toggleStatus = (rec: RecurringInvoice) => {
    onUpdateRecurringInvoice({
      ...rec,
      isActive: !rec.isActive
    });
  };

  return (
    <div className="space-y-6 font-sans p-6 max-w-[1600px] mx-auto">
      
      {/* Title Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 uppercase tracking-wider font-mono">
            Recurring Invoices Engine
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Automate your monthly client invoices and standard retainers with UAE Standard 5% VAT calculation.
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <button
            onClick={onManualTrigger}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold rounded-lg transition-all flex items-center space-x-2 cursor-pointer"
            title="Check and process due agreements now"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
            <span>Process Due Now</span>
          </button>
          
          <button
            id="btn-add-recurring-open"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Template</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Orange Card - Paused / Inactive */}
        <div className="bg-amber-50/75 border border-amber-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700">Paused Automations</span>
              <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Paused</span>
            </div>
            <h3 className="text-2xl font-black text-amber-900 font-sans">{formatAED(pausedVolume)}</h3>
            <p className="text-[10px] text-amber-600 font-medium mt-1">{pausedCount} agreement template(s) paused</p>
          </div>
          <div className="mt-4">
            <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
              <div 
                style={{ width: `${totalVolume > 0 ? (pausedVolume / totalVolume) * 100 : 0}%` }} 
                className="bg-amber-500 h-full transition-all duration-500" 
              />
            </div>
            <div className="flex justify-between items-center mt-1.5 text-[9px] text-slate-400 font-medium">
              <span>Inactive Ratio</span>
              <span>{totalVolume > 0 ? ((pausedVolume / totalVolume) * 100).toFixed(1) : 0}% of Total Capacity</span>
            </div>
          </div>
        </div>

        {/* Green Card - Active projections */}
        <div className="bg-emerald-50/75 border border-emerald-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700">Monthly Projection</span>
              <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Active</span>
            </div>
            <h3 className="text-2xl font-black text-emerald-900 font-sans">{formatAED(activeVolume)}</h3>
            <p className="text-[10px] text-emerald-600 font-medium mt-1">{activeCount} agreement template(s) active</p>
          </div>
          <div className="mt-4">
            <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
              <div 
                style={{ width: `${totalVolume > 0 ? (activeVolume / totalVolume) * 100 : 0}%` }} 
                className="bg-emerald-500 h-full transition-all duration-500" 
              />
            </div>
            <div className="flex justify-between items-center mt-1.5 text-[9px] text-slate-400 font-medium">
              <span>Projection Rate</span>
              <span>{totalVolume > 0 ? ((activeVolume / totalVolume) * 100).toFixed(1) : 0}% of Capacity</span>
            </div>
          </div>
        </div>

        {/* Slate Card - Overall summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">Gross Capacity</span>
              <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">All Automations</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 font-sans">{formatAED(totalVolume)}</h3>
            <div className="flex gap-3 text-[10px] text-slate-500/90 mt-2 flex-wrap">
              <span>Total templates: <strong className="text-slate-800">{totalCount}</strong></span>
              <span>• Active: <strong className="text-emerald-600">{activeCount}</strong></span>
              <span>• Paused: <strong className="text-amber-600">{pausedCount}</strong></span>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden flex">
              <div 
                style={{ width: `${totalVolume > 0 ? (activeVolume / totalVolume) * 100 : 0}%` }} 
                className="bg-emerald-500 h-full"
              />
              <div 
                style={{ width: `${totalVolume > 0 ? (pausedVolume / totalVolume) * 100 : 0}%` }} 
                className="bg-amber-400 h-full"
              />
            </div>
            <div className="flex justify-between items-center mt-1.5 text-[9px] text-slate-400 font-medium">
              <span>Active vs Paused</span>
              <span>Total Agreement Analytics</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Table List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        
        {/* Filters Panel */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3 w-full max-w-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by customer name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-hidden transition-colors"
              />
            </div>

            {/* Column Chooser Button / ⚙️ Settings */}
            <div className="relative inline-block text-left shrink-0">
              <button
                type="button"
                onClick={() => setShowColChooser(!showColChooser)}
                className="bg-white hover:bg-slate-50 border border-slate-200 p-2 rounded-lg cursor-pointer transition-colors shadow-xs flex items-center"
                title="Table settings & column chooser"
              >
                <Settings className="w-4 h-4 text-slate-500" />
              </button>

              {showColChooser && (
                <>
                  <div className="fixed inset-0 z-45" onClick={() => setShowColChooser(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-150 shadow-xl z-50 p-4 animate-fade-in text-xs text-slate-700">
                    <p className="font-bold text-slate-900 mb-2.5 pb-1 border-b border-slate-100 uppercase tracking-wider text-[10px] font-mono">Recurring Invoice Columns</p>
                    <div className="space-y-2">
                      {[
                        { key: 'customer', label: 'Customer Details' },
                        { key: 'description', label: 'Item Description' },
                        { key: 'amount', label: 'Amount (AED)' },
                        { key: 'frequency', label: 'Frequency Pattern' },
                        { key: 'nextBilling', label: 'Next Billing Date' },
                        { key: 'status', label: 'Status' }
                      ].map((col) => (
                        <label key={col.key} className="flex items-center space-x-2.5 cursor-pointer hover:bg-slate-50 p-1.5 rounded-md transition-colors select-none font-medium">
                          <input
                            type="checkbox"
                            checked={(cols as any)[col.key]}
                            onChange={(e) => {
                              const updated = { ...cols, [col.key]: e.target.checked };
                              setCols(updated);
                              safeSetLocalStorage('hisaab_cols_recurring', updated);
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span>{col.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Showing {filteredRecs.length} of {companyRecs.length} Automated Templates
          </span>
        </div>

        {/* Templates Table */}
        {filteredRecs.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Recurring Templates Found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Create recurring invoice agreements for monthly retainer accounts, leases, or subscriptions to auto-generate invoices.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              + Create First Template
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono bg-slate-50/60">
                  {cols.customer && <th className="py-4 px-6">Client / Customer</th>}
                  {cols.description && <th className="py-4 px-6">Agreement / Description</th>}
                  {cols.amount && (
                    <>
                      <th className="py-4 px-6 text-right">Taxable Subtotal</th>
                      <th className="py-4 px-6 text-right">VAT (5%)</th>
                      <th className="py-4 px-6 text-right">Total Invoice</th>
                    </>
                  )}
                  {cols.nextBilling && <th className="py-4 px-6">Next Run Date</th>}
                  {cols.status && <th className="py-4 px-6 text-center">Active Status</th>}
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRecs.map((rec) => {
                  const cust = companyCustomers.find(c => c.id === rec.customerId);
                  const isTodayStr = new Date().toISOString().split('T')[0];
                  const isDue = rec.isActive && rec.nextRunDate && rec.nextRunDate <= isTodayStr;

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Customer Name */}
                      {cols.customer && (
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900">{cust ? cust.name : 'Unknown Client'}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">TRN: {cust?.trn || 'Not Registered'}</div>
                        </td>
                      )}

                      {/* Description */}
                      {cols.description && (
                        <td className="py-4 px-6 text-slate-700 font-medium">
                          {rec.description}
                        </td>
                      )}

                      {cols.amount && (
                        <>
                          {/* Taxable Subtotal */}
                          <td className="py-4 px-6 text-right font-mono font-medium text-slate-600">
                            {formatAED(rec.amount)}
                          </td>

                          {/* VAT amount */}
                          <td className="py-4 px-6 text-right font-mono text-slate-500">
                            {formatAED(rec.vatAmount)}
                          </td>

                          {/* Total Amount */}
                          <td className="py-4 px-6 text-right font-mono font-bold text-slate-900">
                            {formatAED(rec.total)}
                          </td>
                        </>
                      )}

                      {/* Next Run Date */}
                      {cols.nextBilling && (
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-1.5 font-mono">
                            <Calendar className={`w-3.5 h-3.5 ${isDue ? 'text-amber-500' : 'text-slate-400'}`} />
                            <span className={`${isDue ? 'text-amber-600 font-bold' : 'text-slate-700'}`}>
                              {rec.nextRunDate}
                            </span>
                          </div>
                          {isDue && (
                            <span className="inline-block text-[8px] uppercase tracking-wider font-bold font-mono px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-600 rounded mt-1">
                              Due Now
                            </span>
                          )}
                        </td>
                      )}

                      {/* Active Status ON/OFF */}
                      {cols.status && (
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => toggleStatus(rec)}
                            className="focus:outline-hidden inline-flex items-center cursor-pointer transition-colors text-slate-400 hover:text-indigo-600"
                            title={rec.isActive ? "Deactivate Automation" : "Activate Automation"}
                          >
                            {rec.isActive ? (
                              <ToggleRight className="w-8 h-8 text-indigo-600" />
                            ) : (
                              <ToggleLeft className="w-8 h-8 text-slate-300" />
                            )}
                          </button>
                        </td>
                      )}

                      {/* Actions */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleOpenEdit(rec)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                            title="Edit template details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this recurring invoice template?')) {
                                onDeleteRecurringInvoice(rec.id);
                              }
                            }}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-rose-600 rounded transition-colors cursor-pointer"
                            title="Delete template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Creation / Editing Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in no-print">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin-hover" />
                  <span>{editingRec ? 'Edit Billing Template' : 'Create Recurring Template'}</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">UAE standard VAT calculated automatically upon submission</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700">
              
              {/* Customer Selector */}
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">
                  Select Customer / Client *
                </label>
                <div className="relative">
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2.5 rounded-lg focus:border-indigo-500 focus:outline-hidden appearance-none cursor-pointer pr-10 font-medium"
                  >
                    <option value="" disabled>-- Select Corporate Client --</option>
                    {companyCustomers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">
                  Invoice Item Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Monthly Software License & Support Retainer"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2.5 rounded-lg focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Amount, VAT, and Total */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Subtotal amount */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">
                    Taxable Amount (AED) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2.5 rounded-lg focus:border-indigo-500 focus:outline-hidden font-mono"
                  />
                </div>

                {/* Next Run Date */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">
                    Next Run Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={nextRunDate}
                    onChange={(e) => setNextRunDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2.5 rounded-lg focus:border-indigo-500 focus:outline-hidden font-mono"
                  />
                </div>

              </div>

              {/* Real-time Tax calculation card preview */}
              <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl space-y-2 font-mono text-[11px]">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>{formatAED(amount)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Standard VAT (5.0%):</span>
                  <span>{formatAED(amount * 0.05)}</span>
                </div>
                <div className="border-t border-indigo-100 my-1 pt-1.5 flex justify-between font-bold text-slate-800">
                  <span>Total Recurring Invoice:</span>
                  <span>{formatAED(amount * 1.05)}</span>
                </div>
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center justify-between border border-slate-100 p-3 rounded-xl bg-slate-50/30">
                <div>
                  <span className="font-bold text-slate-800 block">Enable Auto-Billing Scheduler</span>
                  <span className="text-[10px] text-slate-400">If disabled, this agreement will not generate automatic invoices</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className="focus:outline-hidden inline-flex cursor-pointer transition-colors text-indigo-600"
                >
                  {isActive ? (
                    <ToggleRight className="w-8 h-8" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-300" />
                  )}
                </button>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {editingRec ? 'Save Changes' : 'Activate Automation'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
