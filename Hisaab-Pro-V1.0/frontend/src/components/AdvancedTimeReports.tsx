import React from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  Users, 
  Activity, 
  Download,
  ShieldAlert
} from 'lucide-react';
import { Company, SalesDocument, Expense, Customer, InventoryItem } from '../types';

interface AdvancedTimeReportsProps {
  type: 'daily' | 'weekly' | 'monthly' | 'extraordinary';
  company: Company;
  documents: SalesDocument[];
  expenses: Expense[];
  customers: Customer[];
  inventory: InventoryItem[];
  formatAED: (val: number) => string;
  exportToCSV: (headers: string[], rows: any[][], title: string) => void;
}

export const AdvancedTimeReports: React.FC<AdvancedTimeReportsProps> = ({
  type,
  company,
  documents,
  expenses,
  customers,
  inventory,
  formatAED,
  exportToCSV
}) => {
  const currency = company.currency || 'AED';

  // -------------------------------------------------------------
  // 1. DAILY BUSINESS EXECUTIVE PULSE
  // -------------------------------------------------------------
  if (type === 'daily') {
    // Group invoices & expenses for last 14 days
    const daysMap: Record<string, {
      date: string;
      invoicesCount: number;
      salesSubtotal: number;
      salesVat: number;
      salesTotal: number;
      cashCollected: number;
      expensesCount: number;
      expenseAmount: number;
      expenseVat: number;
      expenseTotal: number;
      netOperatingProfit: number;
    }> = {};

    // Populate last 14 days
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      daysMap[dateStr] = {
        date: dateStr,
        invoicesCount: 0,
        salesSubtotal: 0,
        salesVat: 0,
        salesTotal: 0,
        cashCollected: 0,
        expensesCount: 0,
        expenseAmount: 0,
        expenseVat: 0,
        expenseTotal: 0,
        netOperatingProfit: 0
      };
    }

    documents.filter(d => (d.type === 'Invoice' || d.type === 'CreditNote') && d.status !== 'Cancelled').forEach(inv => {
      const dateStr = inv.date?.slice(0, 10);
      if (dateStr && daysMap[dateStr]) {
        const sign = inv.type === 'CreditNote' ? -1 : 1;
        daysMap[dateStr].invoicesCount += 1;
        daysMap[dateStr].salesSubtotal += (inv.subtotal || 0) * sign;
        daysMap[dateStr].salesVat += (inv.vatTotal || 0) * sign;
        daysMap[dateStr].salesTotal += (inv.total || 0) * sign;
        daysMap[dateStr].cashCollected += (inv.paymentReceived || (inv.status === 'Paid' ? inv.total : 0)) * sign;
      }
    });

    expenses.forEach(exp => {
      const dateStr = exp.date?.slice(0, 10);
      if (dateStr && daysMap[dateStr]) {
        daysMap[dateStr].expensesCount += 1;
        daysMap[dateStr].expenseAmount += (exp.amount || 0);
        daysMap[dateStr].expenseVat += (exp.vatAmount || 0);
        daysMap[dateStr].expenseTotal += (exp.total || 0);
      }
    });

    const dailyList = Object.values(daysMap).map(d => ({
      ...d,
      netOperatingProfit: d.salesSubtotal - d.expenseAmount
    })).reverse();

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayData = daysMap[todayStr] || {
      date: todayStr,
      invoicesCount: 0,
      salesSubtotal: 0,
      salesVat: 0,
      salesTotal: 0,
      cashCollected: 0,
      expensesCount: 0,
      expenseAmount: 0,
      expenseVat: 0,
      expenseTotal: 0,
      netOperatingProfit: 0
    };
    const grand14DaySales = dailyList.reduce((acc, cur) => acc + cur.salesTotal, 0);
    const grand14DayExpense = dailyList.reduce((acc, cur) => acc + cur.expenseTotal, 0);
    const grand14DayCash = dailyList.reduce((acc, cur) => acc + cur.cashCollected, 0);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase font-mono rounded-md border border-emerald-200">
                Daily Operations
              </span>
              <h3 className="text-base font-extrabold text-slate-900 font-mono uppercase tracking-wider">
                Daily Business & Cash Flow Executive Pulse
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Day-by-day continuous audit of sales invoiced, cash collected, VAT obligations, and OPEX disbursements.
            </p>
          </div>
          <button
            onClick={() => exportToCSV(
              ['Date', 'Invoices', 'Sales Subtotal (AED)', 'VAT 5% (AED)', 'Sales Total (AED)', 'Cash Inflows (AED)', 'Expenses Total (AED)', 'Net Profit (AED)'],
              dailyList.map(d => [d.date, d.invoicesCount, d.salesSubtotal.toFixed(2), d.salesVat.toFixed(2), d.salesTotal.toFixed(2), d.cashCollected.toFixed(2), d.expenseTotal.toFixed(2), d.netOperatingProfit.toFixed(2)]),
              'daily_executive_pulse'
            )}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center space-x-1.5 cursor-pointer no-print shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Daily CSV</span>
          </button>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Today's Invoiced Sales</span>
            <span className="text-xl font-extrabold text-indigo-700 font-mono mt-1 block">{formatAED(todayData.salesTotal)}</span>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{todayData.invoicesCount} transaction(s) today</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Today's Cash Collected</span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono mt-1 block">{formatAED(todayData.cashCollected)}</span>
            <span className="text-[10px] text-emerald-700 font-mono mt-0.5 block">Direct bank/cash inflow</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">14-Day Trailing Gross Sales</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-1 block">{formatAED(grand14DaySales)}</span>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Total 14-day velocity</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">14-Day Trailing Net Cash Surplus</span>
            <span className={`text-xl font-extrabold font-mono mt-1 block ${(grand14DayCash - grand14DayExpense) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatAED(grand14DayCash - grand14DayExpense)}
            </span>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Inflows minus outflows</span>
          </div>
        </div>

        {/* Daily Breakdown Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-mono text-[10px] uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3 text-center">Inv Count</th>
                <th className="p-3 text-right">Invoiced Revenue ({currency})</th>
                <th className="p-3 text-right">Output VAT 5%</th>
                <th className="p-3 text-right">Cash Received ({currency})</th>
                <th className="p-3 text-right">OPEX Outflows ({currency})</th>
                <th className="p-3 text-right">Net Daily Margin</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {dailyList.map((row, idx) => {
                const isToday = row.date === todayStr;
                return (
                  <tr key={row.date} className={`hover:bg-slate-50/80 transition-colors ${isToday ? 'bg-indigo-50/40 font-bold' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                    <td className="p-3 text-slate-900 font-bold font-sans flex items-center space-x-1.5">
                      <span>{row.date}</span>
                      {isToday && <span className="px-1.5 py-0.2 bg-indigo-600 text-white text-[9px] rounded font-mono font-bold">TODAY</span>}
                    </td>
                    <td className="p-3 text-center text-slate-600">{row.invoicesCount}</td>
                    <td className="p-3 text-right font-bold text-slate-900">{formatAED(row.salesTotal)}</td>
                    <td className="p-3 text-right text-emerald-600">{formatAED(row.salesVat)}</td>
                    <td className="p-3 text-right font-bold text-emerald-700">{formatAED(row.cashCollected)}</td>
                    <td className="p-3 text-right text-rose-600 font-medium">{formatAED(row.expenseTotal)}</td>
                    <td className={`p-3 text-right font-bold ${row.netOperatingProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {formatAED(row.netOperatingProfit)}
                    </td>
                    <td className="p-3 text-center font-sans">
                      {row.salesTotal > 0 ? (
                        <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                          Active Trading
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 text-[10px]">
                          Idle / Closed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. WEEKLY TRAILING PERFORMANCE & COLLECTION ACCELERATOR
  // -------------------------------------------------------------
  if (type === 'weekly') {
    // Generate last 8 weeks
    const weeks: Array<{
      weekNumber: number;
      label: string;
      startDate: string;
      endDate: string;
      invoices: number;
      revenue: number;
      vat: number;
      collected: number;
      expenses: number;
      netMargin: number;
      collectionRate: number;
    }> = [];

    const now = new Date();
    for (let w = 7; w >= 0; w--) {
      const endD = new Date(now);
      endD.setDate(endD.getDate() - (w * 7));
      const startD = new Date(endD);
      startD.setDate(startD.getDate() - 6);

      const startStr = startD.toISOString().slice(0, 10);
      const endStr = endD.toISOString().slice(0, 10);

      let rev = 0;
      let vt = 0;
      let col = 0;
      let count = 0;
      let expTotal = 0;

      documents.filter(d => (d.type === 'Invoice' || d.type === 'CreditNote') && d.status !== 'Cancelled').forEach(inv => {
        const invDate = inv.date?.slice(0, 10);
        if (invDate && invDate >= startStr && invDate <= endStr) {
          const sign = inv.type === 'CreditNote' ? -1 : 1;
          count += 1;
          rev += (inv.total || 0) * sign;
          vt += (inv.vatTotal || 0) * sign;
          col += (inv.paymentReceived || (inv.status === 'Paid' ? inv.total : 0)) * sign;
        }
      });

      expenses.forEach(exp => {
        const expDate = exp.date?.slice(0, 10);
        if (expDate && expDate >= startStr && expDate <= endStr) {
          expTotal += (exp.total || 0);
        }
      });

      const rate = rev > 0 ? Math.min(100, Math.max(0, (col / rev) * 100)) : (col > 0 ? 100 : 0);

      weeks.push({
        weekNumber: 8 - w,
        label: `Week ${8 - w} (${startD.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} - ${endD.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })})`,
        startDate: startStr,
        endDate: endStr,
        invoices: count,
        revenue: rev,
        vat: vt,
        collected: col,
        expenses: expTotal,
        netMargin: rev - expTotal,
        collectionRate: rate
      });
    }

    const total8WRevenue = weeks.reduce((sum, w) => sum + w.revenue, 0);
    const total8WCollected = weeks.reduce((sum, w) => sum + w.collected, 0);
    const avgWeeklyRunrate = total8WRevenue / (weeks.length || 1);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase font-mono rounded-md border border-indigo-200">
                Weekly Performance
              </span>
              <h3 className="text-base font-extrabold text-slate-900 font-mono uppercase tracking-wider">
                Weekly Trailing Performance & Collection Accelerator
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              8-Week trend analysis comparing weekly billed revenues, cash collection conversion %, and operating costs.
            </p>
          </div>
          <button
            onClick={() => exportToCSV(
              ['Week Period', 'Start Date', 'End Date', 'Invoices', 'Billed Revenue (AED)', 'VAT (AED)', 'Cash Collected (AED)', 'Expenses (AED)', 'Net Weekly Margin (AED)', 'Collection Rate %'],
              weeks.map(w => [w.label, w.startDate, w.endDate, w.invoices, w.revenue.toFixed(2), w.vat.toFixed(2), w.collected.toFixed(2), w.expenses.toFixed(2), w.netMargin.toFixed(2), `${w.collectionRate.toFixed(1)}%`]),
              'weekly_trailing_performance'
            )}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center space-x-1.5 cursor-pointer no-print shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Weekly CSV</span>
          </button>
        </div>

        {/* 3 Overview KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">8-Week Total Invoiced</span>
            <span className="text-xl font-extrabold text-indigo-700 font-mono mt-1 block">{formatAED(total8WRevenue)}</span>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Avg Runrate: {formatAED(avgWeeklyRunrate)}/wk</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">8-Week Cash Realized</span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono mt-1 block">{formatAED(total8WCollected)}</span>
            <span className="text-[10px] text-emerald-700 font-mono mt-0.5 block">
              Overall Realization: {total8WRevenue > 0 ? ((total8WCollected / total8WRevenue) * 100).toFixed(1) : '100'}%
            </span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Current Week Runrate Velocity</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-1 block">
              {formatAED(weeks[weeks.length - 1]?.revenue || 0)}
            </span>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Active sprint target</span>
          </div>
        </div>

        {/* Weekly Table with Visual Progress bars */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-mono text-[10px] uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Week Span</th>
                <th className="p-3 text-center">Invoices</th>
                <th className="p-3 text-right">Invoiced Revenue ({currency})</th>
                <th className="p-3 text-right">Cash Collected ({currency})</th>
                <th className="p-3 text-right">OPEX ({currency})</th>
                <th className="p-3 text-right">Net Margin ({currency})</th>
                <th className="p-3 text-center">Collection Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {weeks.slice().reverse().map((w, idx) => (
                <tr key={w.label} className={`hover:bg-slate-50/80 transition-colors ${idx === 0 ? 'bg-indigo-50/30 font-bold' : ''}`}>
                  <td className="p-3 font-sans text-slate-900 font-bold">
                    <div className="flex items-center space-x-2">
                      <span>{w.label}</span>
                      {idx === 0 && <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] rounded font-bold">CURRENT</span>}
                    </div>
                  </td>
                  <td className="p-3 text-center text-slate-600">{w.invoices}</td>
                  <td className="p-3 text-right font-bold text-slate-900">{formatAED(w.revenue)}</td>
                  <td className="p-3 text-right font-bold text-emerald-700">{formatAED(w.collected)}</td>
                  <td className="p-3 text-right text-rose-600">{formatAED(w.expenses)}</td>
                  <td className={`p-3 text-right font-bold ${w.netMargin >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {formatAED(w.netMargin)}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${w.collectionRate >= 80 ? 'bg-emerald-500' : w.collectionRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${w.collectionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-700">{w.collectionRate.toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. MONTHLY EXECUTIVE REVENUE & OPERATING MARGIN MATRIX
  // -------------------------------------------------------------
  if (type === 'monthly') {
    // Current year months (Jan - Dec)
    const currentYear = new Date().getFullYear();
    const monthsNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthlyData = monthsNames.map((name, mIdx) => {
      const mNum = String(mIdx + 1).padStart(2, '0');
      const prefix = `${currentYear}-${mNum}`;

      let salesGross = 0;
      let salesTaxable = 0;
      let salesVat = 0;
      let paymentsReceived = 0;
      let docCount = 0;
      let expenseAmount = 0;
      let expenseVat = 0;
      let expenseTotal = 0;

      documents.filter(d => (d.type === 'Invoice' || d.type === 'CreditNote') && d.status !== 'Cancelled').forEach(inv => {
        if (inv.date?.startsWith(prefix)) {
          const sign = inv.type === 'CreditNote' ? -1 : 1;
          docCount += 1;
          salesGross += (inv.total || 0) * sign;
          salesTaxable += (inv.subtotal || 0) * sign;
          salesVat += (inv.vatTotal || 0) * sign;
          paymentsReceived += (inv.paymentReceived || (inv.status === 'Paid' ? inv.total : 0)) * sign;
        }
      });

      expenses.forEach(exp => {
        if (exp.date?.startsWith(prefix)) {
          expenseAmount += (exp.amount || 0);
          expenseVat += (exp.vatAmount || 0);
          expenseTotal += (exp.total || 0);
        }
      });

      const netProfit = salesTaxable - expenseAmount;
      const profitMarginPct = salesTaxable > 0 ? (netProfit / salesTaxable) * 100 : 0;
      const netVatPayable = salesVat - expenseVat;

      return {
        monthIndex: mIdx + 1,
        monthName: name,
        periodCode: `${name.slice(0, 3)} ${currentYear}`,
        docCount,
        salesGross,
        salesTaxable,
        salesVat,
        paymentsReceived,
        expenseTotal,
        expenseAmount,
        expenseVat,
        netProfit,
        profitMarginPct,
        netVatPayable
      };
    });

    const currentMonthIdx = new Date().getMonth();
    const grandYtdRevenue = monthlyData.reduce((acc, m) => acc + m.salesGross, 0);
    const grandYtdExpenses = monthlyData.reduce((acc, m) => acc + m.expenseTotal, 0);
    const grandYtdProfit = monthlyData.reduce((acc, m) => acc + m.netProfit, 0);
    const grandYtdVat = monthlyData.reduce((acc, m) => acc + m.netVatPayable, 0);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-violet-50 text-violet-700 font-bold text-[10px] uppercase font-mono rounded-md border border-violet-200">
                FY {currentYear} Monthly Matrix
              </span>
              <h3 className="text-base font-extrabold text-slate-900 font-mono uppercase tracking-wider">
                Monthly Executive Revenue & Operating Margin Matrix
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Full 12-Month financial calendar breakdown mapping gross billing, OPEX cost allocations, net margin %, and FTA VAT net settlements.
            </p>
          </div>
          <button
            onClick={() => exportToCSV(
              ['Month', 'Invoices', 'Gross Billed (AED)', 'Taxable Sales (AED)', 'Output VAT (AED)', 'OPEX (AED)', 'Input VAT (AED)', 'Net Profit (AED)', 'Margin %', 'Net VAT Payable (AED)'],
              monthlyData.map(m => [m.periodCode, m.docCount, m.salesGross.toFixed(2), m.salesTaxable.toFixed(2), m.salesVat.toFixed(2), m.expenseTotal.toFixed(2), m.expenseVat.toFixed(2), m.netProfit.toFixed(2), `${m.profitMarginPct.toFixed(1)}%`, m.netVatPayable.toFixed(2)]),
              `monthly_matrix_${currentYear}`
            )}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center space-x-1.5 cursor-pointer no-print shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Monthly CSV</span>
          </button>
        </div>

        {/* 4 Annual YTD Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">YTD Gross Revenue ({currentYear})</span>
            <span className="text-xl font-extrabold text-indigo-700 font-mono mt-1 block">{formatAED(grandYtdRevenue)}</span>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Full year cumulative sales</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">YTD Total OPEX Costs</span>
            <span className="text-xl font-extrabold text-rose-600 font-mono mt-1 block">{formatAED(grandYtdExpenses)}</span>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Operating expenditures</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">YTD Net Operating Profit</span>
            <span className={`text-xl font-extrabold font-mono mt-1 block ${grandYtdProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {formatAED(grandYtdProfit)}
            </span>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
              Operating Margin: {grandYtdRevenue > 0 ? ((grandYtdProfit / grandYtdRevenue) * 100).toFixed(1) : '0'}%
            </span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">YTD Net VAT Settlement</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-1 block">{formatAED(grandYtdVat)}</span>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Output VAT - Input VAT</span>
          </div>
        </div>

        {/* 12-Month Detailed Grid */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-mono text-[10px] uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Month</th>
                <th className="p-3 text-center">Inv Count</th>
                <th className="p-3 text-right">Gross Sales ({currency})</th>
                <th className="p-3 text-right">Taxable Base</th>
                <th className="p-3 text-right">OPEX ({currency})</th>
                <th className="p-3 text-right">Net Operating Profit</th>
                <th className="p-3 text-right">Margin %</th>
                <th className="p-3 text-right">Net VAT 5%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {monthlyData.map((m, idx) => {
                const isCurrentMonth = idx === currentMonthIdx;
                return (
                  <tr key={m.monthName} className={`hover:bg-slate-50/80 transition-colors ${isCurrentMonth ? 'bg-violet-50/40 font-bold' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                    <td className="p-3 font-sans text-slate-900 font-bold flex items-center space-x-2">
                      <span>{m.periodCode}</span>
                      {isCurrentMonth && (
                        <span className="px-1.5 py-0.2 bg-violet-600 text-white text-[9px] rounded font-mono font-bold">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center text-slate-600">{m.docCount}</td>
                    <td className="p-3 text-right font-bold text-slate-900">{formatAED(m.salesGross)}</td>
                    <td className="p-3 text-right text-slate-700">{formatAED(m.salesTaxable)}</td>
                    <td className="p-3 text-right text-rose-600">{formatAED(m.expenseTotal)}</td>
                    <td className={`p-3 text-right font-bold ${m.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {formatAED(m.netProfit)}
                    </td>
                    <td className="p-3 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${m.profitMarginPct >= 20 ? 'bg-emerald-50 text-emerald-700' : m.profitMarginPct > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                        {m.profitMarginPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-indigo-700">{formatAED(m.netVatPayable)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-100 font-mono font-bold border-t-2 border-slate-300 text-slate-900">
              <tr>
                <td className="p-3 font-sans" colSpan={2}>Annual Total (FY {currentYear})</td>
                <td className="p-3 text-right text-indigo-700">{formatAED(grandYtdRevenue)}</td>
                <td className="p-3 text-right">{formatAED(monthlyData.reduce((a, b) => a + b.salesTaxable, 0))}</td>
                <td className="p-3 text-right text-rose-600">{formatAED(grandYtdExpenses)}</td>
                <td className="p-3 text-right text-emerald-700">{formatAED(grandYtdProfit)}</td>
                <td className="p-3 text-right">
                  {grandYtdRevenue > 0 ? ((grandYtdProfit / grandYtdRevenue) * 100).toFixed(1) : '0.0'}%
                </td>
                <td className="p-3 text-right text-slate-900">{formatAED(grandYtdVat)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 4. EXTRAORDINARY INTELLIGENCE: 360° BUSINESS & ANOMALY AUDIT
  // -------------------------------------------------------------
  if (type === 'extraordinary') {
    // 1. Invoices missing TRN with amount > 10,000 AED
    const highValueWithoutTrn = documents.filter(d => {
      if (d.type !== 'Invoice' || d.total < 10000) return false;
      const cust = customers.find(c => c.id === d.customerId);
      return !cust?.trn || cust.trn.trim() === '';
    });

    // 2. Overdue Invoices (> 30 days overdue)
    const today = new Date();
    const severeOverdueInvoices = documents.filter(d => {
      if (d.type !== 'Invoice' || d.status === 'Paid' || d.status === 'Cancelled' || !d.dueDate) return false;
      const due = new Date(d.dueDate);
      const diffDays = Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > 30;
    }).map(d => {
      const cust = customers.find(c => c.id === d.customerId);
      const due = new Date(d.dueDate!);
      const overdueDays = Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      return {
        ...d,
        customerName: cust?.name || 'Unknown',
        customerPhone: cust?.phone || cust?.mobileNumber || 'N/A',
        overdueDays,
        pendingAmount: Math.max(0, d.total - (d.paymentReceived || 0))
      };
    });

    // 3. Customer Concentration Risk (Top 3 customers share of revenue)
    const customerRevMap: Record<string, { name: string; trn: string; totalSales: number; invoices: number }> = {};
    let totalAllSales = 0;
    documents.filter(d => d.type === 'Invoice' && d.status !== 'Cancelled').forEach(inv => {
      const cust = customers.find(c => c.id === inv.customerId);
      const name = cust?.name || 'Walk-in / Cash';
      const trn = cust?.trn || 'No TRN';
      if (!customerRevMap[name]) {
        customerRevMap[name] = { name, trn, totalSales: 0, invoices: 0 };
      }
      customerRevMap[name].totalSales += inv.total;
      customerRevMap[name].invoices += 1;
      totalAllSales += inv.total;
    });

    const topCustomers = Object.values(customerRevMap)
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5)
      .map(c => ({
        ...c,
        sharePct: totalAllSales > 0 ? ((c.totalSales / totalAllSales) * 100) : 0
      }));

    const top3Concentration = topCustomers.slice(0, 3).reduce((sum, c) => sum + c.sharePct, 0);

    // 4. Dead Stock & Stagnant Inventory (Stock > 0 with 0 sales in documents)
    const activeItemNames = new Set<string>();
    documents.forEach(d => {
      d.items?.forEach(it => {
        if (it.name) activeItemNames.add(it.name.toLowerCase().trim());
      });
    });

    const deadStockItems = inventory.filter(it => {
      return (it.stockQuantity || 0) > 0 && !activeItemNames.has((it.name || '').toLowerCase().trim());
    });
    const deadStockTiedCapital = deadStockItems.reduce((acc, it) => acc + ((it.stockQuantity || 0) * (it.purchasePrice || 0)), 0);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold text-[10px] uppercase font-mono rounded-md border border-amber-200">
                Extraordinary Strategic Intelligence
              </span>
              <h3 className="text-base font-extrabold text-slate-900 font-mono uppercase tracking-wider">
                360° Business Health, Anomaly Detection & Strategic Audit
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Advanced audit pinpointing client concentration vulnerability, dead inventory tied capital, high-risk delinquent receivables, and compliance flags.
            </p>
          </div>
          <button
            onClick={() => exportToCSV(
              ['Section', 'Item / Entity', 'Reference / Metric', 'Financial Exposure (AED)', 'Risk Level / Status'],
              [
                ...highValueWithoutTrn.map(d => ['High-Value Without TRN', d.docNumber, `Date: ${d.date}`, d.total.toFixed(2), 'Compliance Warning']),
                ...severeOverdueInvoices.map(d => ['Severe Overdue Receivable', d.docNumber, `${d.customerName} (${d.overdueDays}d overdue)`, d.pendingAmount.toFixed(2), 'Credit Risk']),
                ...topCustomers.map(c => ['Revenue Concentration', c.name, `${c.invoices} Invoices`, c.totalSales.toFixed(2), `${c.sharePct.toFixed(1)}% Share`]),
                ...deadStockItems.map(s => ['Dead Stock Capital', s.name, `Stock: ${s.stockQuantity} units`, ((s.stockQuantity || 0) * (s.purchasePrice || 0)).toFixed(2), 'Idle Inventory'])
              ],
              'extraordinary_strategic_audit'
            )}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center space-x-1.5 cursor-pointer no-print shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Strategic Audit CSV</span>
          </button>
        </div>

        {/* 4 Health Radar Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-4 rounded-xl border ${top3Concentration > 60 ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Top-3 Client Concentration</span>
            <span className={`text-xl font-extrabold font-mono mt-1 block ${top3Concentration > 60 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {top3Concentration.toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
              {top3Concentration > 60 ? '⚠️ High reliance risk on top 3 clients' : '✅ Well-diversified revenue portfolio'}
            </span>
          </div>

          <div className={`p-4 rounded-xl border ${severeOverdueInvoices.length > 0 ? 'bg-rose-50/60 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">30+ Days Overdue Exposure</span>
            <span className="text-xl font-extrabold text-rose-600 font-mono mt-1 block">
              {formatAED(severeOverdueInvoices.reduce((sum, d) => sum + d.pendingAmount, 0))}
            </span>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
              {severeOverdueInvoices.length} delinquent invoice(s)
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Dead Stock Locked Capital</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-1 block">{formatAED(deadStockTiedCapital)}</span>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{deadStockItems.length} unsold product SKU(s)</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">High Value Deals Without TRN</span>
            <span className="text-xl font-extrabold text-indigo-700 font-mono mt-1 block">{highValueWithoutTrn.length}</span>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Invoices &gt; AED 10,000 without TRN</span>
          </div>
        </div>

        {/* SECTION 1: Top Customer Concentration Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-800 flex items-center space-x-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>1. Customer Concentration & Revenue Reliance</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">Total Billed: {formatAED(totalAllSales)}</span>
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-mono text-[10px] uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">TRN Status</th>
                  <th className="p-3 text-center">Invoices</th>
                  <th className="p-3 text-right">Total Revenue ({currency})</th>
                  <th className="p-3 text-right">Revenue Share %</th>
                  <th className="p-3 text-center">Strategic Risk Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {topCustomers.map(cust => (
                  <tr key={cust.name} className="hover:bg-slate-50/80">
                    <td className="p-3 font-sans font-bold text-slate-900">{cust.name}</td>
                    <td className="p-3 text-slate-600">{cust.trn}</td>
                    <td className="p-3 text-center">{cust.invoices}</td>
                    <td className="p-3 text-right font-bold text-slate-900">{formatAED(cust.totalSales)}</td>
                    <td className="p-3 text-right font-bold text-indigo-600">{cust.sharePct.toFixed(1)}%</td>
                    <td className="p-3 text-center font-sans">
                      {cust.sharePct >= 30 ? (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded border border-rose-200">
                          Tier 1 (High Reliance)
                        </span>
                      ) : cust.sharePct >= 15 ? (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded border border-amber-200">
                          Tier 2 (Key Account)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded border border-emerald-200">
                          Tier 3 (Standard)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 2: Severe Overdue Receivables (>30 Days) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-800 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-rose-600" />
              <span>2. High-Risk Receivables Aging (&gt; 30 Days Overdue)</span>
            </h4>
            <span className="text-[10px] text-rose-600 font-mono font-bold">{severeOverdueInvoices.length} High-Risk Invoices</span>
          </div>
          {severeOverdueInvoices.length === 0 ? (
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 font-bold">
              ✅ Outstanding credit health! There are zero invoices exceeding 30 days overdue.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-mono text-[10px] uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Invoice No</th>
                    <th className="p-3">Client Name</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3 text-center">Days Overdue</th>
                    <th className="p-3 text-right">Invoice Total</th>
                    <th className="p-3 text-right">Pending Balance</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {severeOverdueInvoices.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-bold text-slate-900">{row.docNumber}</td>
                      <td className="p-3 font-sans text-slate-800 font-medium">{row.customerName}</td>
                      <td className="p-3 text-slate-600">{row.dueDate}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold text-[10px] rounded">
                          {row.overdueDays} Days Late
                        </span>
                      </td>
                      <td className="p-3 text-right text-slate-700">{formatAED(row.total)}</td>
                      <td className="p-3 text-right font-bold text-rose-600">{formatAED(row.pendingAmount)}</td>
                      <td className="p-3 text-center font-sans">
                        <span className="text-[10px] text-slate-500 font-medium">WhatsApp / Call Reminder</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};
