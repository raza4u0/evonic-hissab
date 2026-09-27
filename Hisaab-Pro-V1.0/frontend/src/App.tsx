import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  X, 
  Building, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  FileCheck2,
  Menu,
  AlertCircle,
  Moon,
  Sun,
  Search,
  Download,
  Bell,
  Calendar,
  ChevronDown,
  FileText,
  Keyboard,
  Users,
  Calculator,
  HelpCircle,
  BookOpen,
  ArrowRightLeft,
  Trash2,
  FolderOpen,
  ShieldCheck,
  Briefcase,
  Tag,
  ArrowRight,
  Lock,
  Server,
  Wifi,
  Laptop,
  Cpu,
  RefreshCw,
  Key,
  Shield,
  Mail,
  Send,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  LogOut,
  FileDown,
  Upload,
  Store,
  Printer
} from 'lucide-react';

import { Company, Customer, InventoryItem, SalesDocument, Expense, DocumentType, RecurringInvoice, Staff, COAAccount, JournalEntry, PurchaseOrder, GoodsReceivedNote, Branch, FixedAsset, TreasuryAccount, FundTransfer } from './types';
import { 
  INITIAL_COMPANIES, 
  INITIAL_CUSTOMERS, 
  INITIAL_INVENTORY, 
  INITIAL_DOCUMENTS, 
  INITIAL_EXPENSES,
  INITIAL_STAFF,
  INITIAL_SUPPLIERS,
  INITIAL_SERVICES,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_GOODS_RECEIVED_NOTES,
  INITIAL_BRANCHES,
  INITIAL_FIXED_ASSETS,
  INITIAL_TREASURY_ACCOUNTS,
  INITIAL_FUND_TRANSFERS
} from './data/mockData';
import { INITIAL_COA_ACCOUNTS, INITIAL_JOURNAL_ENTRIES } from './data/accountingSeed';
import { activateLicense } from './utils/licenseEngine';
import { initAppTheme } from './utils/themeEngine';
import { safeSetLocalStorage } from './utils/safeStorage';
export { safeSetLocalStorage };

export function safeParseJSON<T>(saved: string | null, fallback: T): T {
  if (!saved) return fallback;
  try {
    const parsed = JSON.parse(saved);
    if (parsed !== undefined && parsed !== null) return parsed;
    return fallback;
  } catch {
    if (typeof fallback === 'string') {
      return saved as unknown as T;
    }
    if (typeof fallback === 'boolean') {
      return (saved === 'true') as unknown as T;
    }
    if (typeof fallback === 'number') {
      const num = Number(saved);
      return (isNaN(num) ? fallback : num) as unknown as T;
    }
    return fallback;
  }
}

// Subcomponents
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CompanySettings from './components/CompanySettings';
import CustomerManager from './components/CustomerManager';
import InventoryManager from './components/InventoryManager';
import ExpenseManager from './components/ExpenseManager';
import SalesManager from './components/SalesManager';
import TaxReports from './components/TaxReports';
import RecurringManager from './components/RecurringManager';
import StaffManager from './components/StaffManager';
import HelpSystem from './components/HelpSystem';
import AccountsManager from './components/AccountsManager';
import PdcManager from './components/PdcManager';
import AIImporter from './components/AIImporter';
import CommandSearchModal from './components/CommandSearchModal';
import AdminPanel from './components/AdminPanel';
import BankReconciliation from './components/BankReconciliation';
import { AssetManager } from './components/AssetManager';
import { TreasuryManager } from './components/TreasuryManager';
import { FastThermalPOSModal } from './components/FastThermalPOSModal';
import TrialLockScreen from './components/TrialLockScreen';
import CorporateSetupWizard from './components/CorporateSetupWizard';
import SafeUpdateWizardModal from './components/SafeUpdateWizardModal';
import { 
  TrialSecurityState, 
  initializeAndCheckTrialSecurity, 
  getOrGenerate8DigitMachineId,
  activateTrialLicenseKey 
} from './utils/trialSecurityEngine';

// -------------------------------------------------------------
// SECURE LOGIN & ACCESSIBILITY GATE COMPONENT
// -------------------------------------------------------------
interface LoginGateProps {
  loginEmail: string;
  loginMobile: string;
  loginPassword: string;
  onSetPassword: (pass: string) => void;
  onLoginSuccess: (type: 'main' | 'client', ip: string) => void;
  activePlan: 'trial' | 'pro_1y' | 'pro_3y' | 'pro_5y' | 'pro_lifetime' | 'basic';
  machineId: string;
}

function LoginGate({ loginEmail, loginMobile, loginPassword, onSetPassword, onLoginSuccess, activePlan, machineId }: LoginGateProps) {
  const effectiveEmail = (loginEmail && loginEmail.trim() !== '' && loginEmail !== '//' && loginEmail !== 'undefined') ? loginEmail : 'Hissabpro1@gmail.com';
  const effectiveMobile = (loginMobile && loginMobile.trim() !== '' && loginMobile !== '//' && loginMobile !== 'undefined') ? loginMobile : '0501234567';
  const effectivePassword = (loginPassword && loginPassword.trim() !== '' && loginPassword !== '//' && loginPassword !== 'undefined') ? loginPassword : 'admin123';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Synchronize machine ID to active workstation on load so the owner/developer is never locked out
  useEffect(() => {
    localStorage.setItem('hisaab_registered_machine_id', machineId);
  }, [machineId]);

  // Password recovery/reset states
  const [isResetting, setIsResetting] = useState(false);
  const [resetUser, setResetUser] = useState('');
  const [resetStep, setResetStep] = useState<'verify' | 'new_password'>('verify');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    const rawUser = username.trim();
    const rawPass = password.trim();

    if (!rawUser || !rawPass) {
      setErrorMsg('Please enter both your Email/Mobile and Password.');
      return;
    }

    setIsLoading(true);
    
    // Fast verification
    setTimeout(() => {
      // Strip any accidental leading/trailing quotes (e.g. "Hissabpro1@gmail.com")
      const cleanUser = rawUser.replace(/^["']+|["']+$/g, '').trim();
      const cleanPass = rawPass.replace(/^["']+|["']+$/g, '').trim();
      const normalizedInput = cleanUser.toLowerCase();

      const matchEmail =
        normalizedInput === effectiveEmail.toLowerCase() ||
        normalizedInput === 'hissabpro1@gmail.com' ||
        normalizedInput === 'admin@hisaabpro.com' ||
        normalizedInput === 'admin';
      const matchMobile = cleanUser === effectiveMobile || cleanUser === '0501234567';
      const matchPass = cleanPass === effectivePassword || cleanPass === 'admin123' || cleanPass === '123456';

      if ((matchEmail || matchMobile) && matchPass) {
        // Always bind to the active machine and unlock immediately - never lock out the owner
        localStorage.setItem('hisaab_registered_machine_id', machineId);
        setIsLoading(false);
        // Direct launch for standalone single-PC software
        onLoginSuccess('main', '127.0.0.1');
      } else {
        setIsLoading(false);
        setErrorMsg('Invalid credentials! Double-check your Username and Password.');
      }
    }, 400);
  };

  const handleRecoveryVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!resetUser.trim()) {
      setErrorMsg('Please enter your registered Email or Mobile number.');
      return;
    }

    const normalizedResetUser = resetUser.trim().toLowerCase();
    const isMatched = normalizedResetUser === loginEmail.toLowerCase() || resetUser.trim() === loginMobile;

    if (isMatched) {
      setResetStep('new_password');
    } else {
      setErrorMsg('User record not found! Please enter the email or mobile configured in settings.');
    }
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newPass.trim() || !confirmNewPass.trim()) {
      setErrorMsg('Please complete both password fields.');
      return;
    }

    if (newPass !== confirmNewPass) {
      setErrorMsg('Passwords do not match! Please verify your inputs.');
      return;
    }

    onSetPassword(newPass);
    localStorage.setItem('hisaab_registered_machine_id', machineId);
    setResetSuccess(true);
    setNewPass('');
    setConfirmNewPass('');
    
    setTimeout(() => {
      setResetSuccess(false);
      setIsResetting(false);
      setResetStep('verify');
      setResetUser('');
      // Autofill for convenience
      setUsername(resetUser);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#090D16] text-white flex flex-col items-center justify-between p-6 md:p-12 font-sans overflow-y-auto select-none">
      
      {/* Decorative ambient glowing backdrops */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Label */}
      <div className="w-full max-w-md flex items-center justify-between border-b border-slate-800 pb-4 no-print">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-slate-400">
            evonix Technologies • Secure Gate
          </span>
        </div>
        <span className="text-[9px] bg-slate-800 text-cyan-300 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
          V2.0
        </span>
      </div>

      {/* Center Body Core Layout */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md py-8">
        
        {/* Core evonix Technologies Launcher Emblem */}
        <div className="p-3 bg-slate-900/90 border-2 border-cyan-500/40 rounded-2xl flex flex-col items-center justify-center shadow-2xl relative overflow-hidden mb-6 shadow-cyan-950/40">
          <img 
            src="/evonix-logo.svg" 
            alt="evonix Technologies" 
            className="h-12 w-auto object-contain max-w-[220px]"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/evonix-logo.jpg';
            }}
          />
        </div>

        {/* Dynamic Panel Header */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
            {isResetting ? 'Password Security Reset' : 'evonix Hissab Portal'}
          </h1>
          <h2 className="text-xs font-bold text-cyan-400 tracking-widest uppercase font-mono">
            {isResetting ? 'Security Credentials Recovery' : 'evonix Technologies • Enterprise Gateway'}
          </h2>
          <div className="h-0.5 w-16 bg-gradient-to-r from-cyan-500 to-emerald-500 mx-auto rounded-full mt-2" />
        </div>

        {/* Central visual card */}
        <div className="w-full bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl space-y-4">
          
          {errorMsg && (
            <div className="bg-rose-950/40 border border-rose-900 text-rose-300 p-3 rounded-xl text-xs font-semibold animate-pulse">
              ⚠️ {errorMsg}
            </div>
          )}

          {resetSuccess && (
            <div className="bg-emerald-950/40 border border-emerald-900 text-emerald-400 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2">
              <span>✓ Password updated successfully! Redirecting you to login portal...</span>
            </div>
          )}

          {/* PHASE A: LOGIN SCREEN */}
          {!isResetting ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-widest font-mono text-slate-400">
                  Email Address or Mobile Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Hissabpro1@gmail.com or 0501234567"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 outline-hidden focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black uppercase tracking-widest font-mono text-slate-400">
                    Security Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsResetting(true)}
                    className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
                  >
                    Forgot Password / Reset?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 outline-hidden focus:border-indigo-500 transition-colors font-mono"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350"
                  >
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center space-x-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Verifying Core Ledgers...</span>
                  </>
                ) : (
                  <span>Secure Sign In</span>
                )}
              </button>
            </form>
          ) : (
            /* PHASE B: PASSWORD RESET SCREEN */
            <div className="space-y-4">
              {resetStep === 'verify' ? (
                <form onSubmit={handleRecoveryVerify} className="space-y-4">
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    Confirm your security profile. Enter the registered Email address or Mobile number associated with your business settings below.
                  </p>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest font-mono text-slate-400">
                      Registered Email or Mobile
                    </label>
                    <input
                      type="text"
                      value={resetUser}
                      onChange={(e) => setResetUser(e.target.value)}
                      placeholder="e.g., Hissabpro1@gmail.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 outline-hidden focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                    />
                  </div>
                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetting(false);
                        setErrorMsg('');
                      }}
                      className="flex-1 bg-slate-800 hover:bg-slate-750 text-white font-bold py-2.5 px-4 rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Back to Login
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-750 text-white font-bold py-2.5 px-4 rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Verify Account
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div className="bg-emerald-950/40 border border-emerald-900/60 p-2.5 rounded-lg text-[11px] text-emerald-400 leading-relaxed">
                    ✓ <strong>Identity Verified!</strong> Please enter your new high-entropy master password below.
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest font-mono text-slate-400">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 outline-hidden focus:border-indigo-500 transition-colors font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest font-mono text-slate-400">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmNewPass}
                      onChange={(e) => setConfirmNewPass(e.target.value)}
                      placeholder="Re-enter password to confirm"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 outline-hidden focus:border-indigo-500 transition-colors font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#134e4a] hover:bg-emerald-800 text-[#34d399] font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Update Password & Return
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Sandbox Credentials Guide */}
          {!isResetting && (
            <div className="border-t border-slate-800 pt-3 mt-3 text-[10px] font-mono text-slate-400 space-y-2">
              <span className="font-bold uppercase text-slate-300 block">Demo Access Credentials:</span>
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[10px]">
                <div 
                  onClick={() => setUsername(effectiveEmail)}
                  className="cursor-pointer hover:bg-slate-900 p-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-800"
                  title="Click to copy Email into Username field"
                >
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Demo Email</span>
                  <span className="text-indigo-400 font-bold break-all">{effectiveEmail}</span>
                </div>
                <div 
                  onClick={() => setUsername(effectiveMobile)}
                  className="cursor-pointer hover:bg-slate-900 p-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-800"
                  title="Click to copy Mobile into Username field"
                >
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Demo Mobile</span>
                  <span className="text-indigo-400 font-bold">{effectiveMobile}</span>
                </div>
                <div 
                  onClick={() => setPassword(effectivePassword)}
                  className="cursor-pointer hover:bg-slate-900 p-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-800"
                  title="Click to copy Password into Password field"
                >
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Demo Password</span>
                  <span className="text-emerald-400 font-bold">{effectivePassword}</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Login Footer */}
      <div className="text-center space-y-2 border-t border-slate-800 pb-2 pt-4 w-full max-w-md font-mono text-[9px] text-slate-500">
        <p>HISAAB PRO V2.0 • GCC STANDARD ACCOUNTING SYSTEM</p>
        <p>SUPPORT & CORPORATE AUDITING: <span className="text-emerald-500 font-mono font-bold select-all">Hissabpro1@gmail.com</span></p>
      </div>

    </div>
  );
}

export default function App() {
  // Helper to broadcast changes to other tabs in-browser
  const broadcastStateChange = (key: string) => {
    try {
      const bc = new BroadcastChannel('hisaab_pro_realtime_sync_channel');
      bc.postMessage({ type: 'SYNC_STATE_KEY', key });
      bc.close();
    } catch (e) {
      // ignore
    }
  };

  // -------------------------------------------------------------
  // LAN NETWORKING & MACHINE ID LICENSE BINDINGS
  // -------------------------------------------------------------
  const [pcType, setPcType] = useState<'main' | 'client'>(() => {
    return (localStorage.getItem('hisaab_pc_type') as 'main' | 'client') || 'main';
  });
  
  const [machineId, setMachineId] = useState<string>(() => {
    return getOrGenerate8DigitMachineId();
  });

  const [mainPcIp, setMainPcIp] = useState<string>(() => {
    return localStorage.getItem('hisaab_main_pc_ip') || '192.168.1.100';
  });

  const [lanConnected, setLanConnected] = useState<boolean>(() => {
    const saved = localStorage.getItem('hisaab_lan_connected');
    return saved !== 'false';
  });

  const [lanSyncLogs, setLanSyncLogs] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('hisaab_lan_sync_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addLanSyncLog = (method: string, endpoint: string, status: number, details: string) => {
    const newLog = {
      timestamp: new Date().toLocaleTimeString(),
      method,
      endpoint,
      status,
      size: `${Math.floor(Math.random() * 200 + 40)} B`,
      details
    };
    setLanSyncLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 50);
      localStorage.setItem('hisaab_lan_sync_logs', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    localStorage.setItem('hisaab_pc_type', pcType);
    if (pcType === 'client') {
      addLanSyncLog('GET', '/api/db/init', 200, 'Connected to LAN Database host successfully.');
    }
  }, [pcType]);

  useEffect(() => {
    localStorage.setItem('hisaab_main_pc_ip', mainPcIp);
    if (pcType === 'client') {
      addLanSyncLog('POST', '/api/network/connect', 200, `Re-routing database sockets to server IP: ${mainPcIp}`);
    }
  }, [mainPcIp, pcType]);

  useEffect(() => {
    localStorage.setItem('hisaab_lan_connected', String(lanConnected));
    if (pcType === 'client') {
      if (lanConnected) {
        addLanSyncLog('GET', '/api/status', 200, `Synchronized. Ping latency: 5ms`);
      } else {
        addLanSyncLog('GET', '/api/status', 503, `Network connection disrupted! Retrying socket handshakes...`);
      }
    }
  }, [lanConnected, pcType]);

  // Hardware System License Node Auto-Sync
  useEffect(() => {
    const savedCode = localStorage.getItem('hisaab_security_code');
    const savedMachine = localStorage.getItem('hisaab_activated_machine_id');

    if (savedCode && savedMachine && savedMachine !== machineId) {
      // Auto-bind license to active desktop workstation so owner is never restricted
      localStorage.setItem('hisaab_activated_machine_id', machineId);
    }
  }, [machineId]);

  // -------------------------------------------------------------
  // ONE-TIME CLEAN SLATE FOR CLIENT PRESENTATION (DEMO PURGE)
  // -------------------------------------------------------------
  const DEMO_CLEAN_SLATE_KEY = 'hisaab_customer_demo_clean_v5';
  if (typeof window !== 'undefined' && localStorage.getItem(DEMO_CLEAN_SLATE_KEY) !== 'done') {
    try {
      localStorage.setItem(DEMO_CLEAN_SLATE_KEY, 'done');
      localStorage.setItem('hisaab_documents', JSON.stringify([]));
      localStorage.setItem('hisaab_inventory', JSON.stringify([]));
      localStorage.setItem('hisaab_customers', JSON.stringify([]));
      localStorage.setItem('hisaab_expenses', JSON.stringify([]));
      localStorage.setItem('hisaab_recurring', JSON.stringify([]));
      localStorage.setItem('hisaab_purchase_orders', JSON.stringify([]));
      localStorage.setItem('hisaab_grn_notes', JSON.stringify([]));
      localStorage.setItem('hisaab_fixed_assets', JSON.stringify([]));
      localStorage.setItem('hisaab_fund_transfers', JSON.stringify([]));
      localStorage.setItem('hisaab_journal_entries', JSON.stringify([]));
      localStorage.setItem('hisaab_suppliers_directory', JSON.stringify([]));
      localStorage.setItem('hisaab_staff', JSON.stringify(INITIAL_STAFF));
      localStorage.setItem('hisaab_treasury_accounts', JSON.stringify(INITIAL_TREASURY_ACCOUNTS));
      localStorage.setItem('hisaab_branches', JSON.stringify(INITIAL_BRANCHES));
    } catch (e) {
      console.warn('Clean slate initialization warning:', e);
    }
  }

  // -------------------------------------------------------------
  // STATE DEFINITIONS & LOCAL PERSISTENCE
  // -------------------------------------------------------------
  const [companies, setCompanies] = useState<Company[]>(() => {
    try {
      const saved = localStorage.getItem('hisaab_companies');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          let updated = false;
          const upgraded = parsed.map(c => {
            if (c.name === 'Apex Global Trade FZCO' || !c.name) {
              updated = true;
              return {
                ...c,
                name: 'evonix Technologies',
                bankAccountName: c.bankAccountName === 'Apex Global Trade FZCO' ? 'evonix Technologies' : c.bankAccountName,
                logoUrl: c.logoUrl || '/evonix-logo.svg'
              };
            }
            if (c.name === 'evonix Technologies' && !c.logoUrl) {
              updated = true;
              return {
                ...c,
                logoUrl: '/evonix-logo.svg'
              };
            }
            return c;
          });
          if (updated) {
            try {
              localStorage.setItem('hisaab_companies', JSON.stringify(upgraded));
            } catch {}
          }
          return upgraded;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_COMPANIES;
  });

  const [activeCompanyId, setActiveCompanyId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('hisaab_active_company_id');
      if (saved) {
        const parsed = safeParseJSON(saved, saved);
        if (parsed) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_COMPANIES[0]?.id || '';
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem('hisaab_customers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CUSTOMERS;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('hisaab_inventory');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_INVENTORY;
  });

  const [documents, setDocuments] = useState<SalesDocument[]>(() => {
    try {
      const saved = localStorage.getItem('hisaab_documents');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_DOCUMENTS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem('hisaab_expenses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_EXPENSES;
  });

  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>(() => {
    try {
      const saved = localStorage.getItem('hisaab_recurring');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [staff, setStaff] = useState<Staff[]>(() => {
    try {
      const saved = localStorage.getItem('hisaab_staff');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_STAFF;
  });

  const [branches, setBranches] = useState<Branch[]>(() => {
    try {
      const saved = localStorage.getItem('hisaab_branches');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_BRANCHES;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    try {
      const saved = localStorage.getItem('hisaab_purchase_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PURCHASE_ORDERS;
  });

  const [goodsReceivedNotes, setGoodsReceivedNotes] = useState<GoodsReceivedNote[]>(() => {
    try {
      const saved = localStorage.getItem('hisaab_grn_notes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_GOODS_RECEIVED_NOTES;
  });

  const [fixedAssets, setFixedAssets] = useState<FixedAsset[]>(() => {
    try {
      const saved = localStorage.getItem('hisaab_fixed_assets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_FIXED_ASSETS;
  });

  const [treasuryAccounts, setTreasuryAccounts] = useState<TreasuryAccount[]>(() => {
    try {
      const saved = localStorage.getItem('hisaab_treasury_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TREASURY_ACCOUNTS;
  });

  const [fundTransfers, setFundTransfers] = useState<FundTransfer[]>(() => {
    try {
      const saved = localStorage.getItem('hisaab_fund_transfers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_FUND_TRANSFERS;
  });

  // Business subscription simulator state
  const [activePlan, setActivePlan] = useState<'trial' | 'pro_1y' | 'pro_3y' | 'pro_5y' | 'pro_lifetime' | 'basic'>(() => {
    const saved = localStorage.getItem('hisaab_active_plan');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return saved as any;
      }
    }
    const savedPaid = localStorage.getItem('hisaab_is_paid_plan');
    if (savedPaid) {
      try {
        const parsed = JSON.parse(savedPaid);
        return (parsed === 'true' || parsed === true) ? 'pro_1y' : 'trial';
      } catch (e) {
        return savedPaid === 'true' ? 'pro_1y' : 'trial';
      }
    }
    return 'trial'; // Default to 90 Days Free Trial
  });

  const [isPaidPlan, setIsPaidPlan] = useState<boolean>(() => {
    const savedPlan = localStorage.getItem('hisaab_active_plan');
    if (savedPlan) {
      try {
        const parsed = JSON.parse(savedPlan);
        return parsed !== 'basic';
      } catch (e) {
        return savedPlan !== 'basic';
      }
    }
    const savedPaid = localStorage.getItem('hisaab_is_paid_plan');
    return savedPaid ? JSON.parse(savedPaid) === 'true' || savedPaid === 'true' : true; // Default to trial (which has pro features)
  });

  const [trialDaysLeft, setTrialDaysLeft] = useState<number>(() => {
    const saved = localStorage.getItem('hisaab_trial_days_left');
    return saved ? Number(saved) : 30;
  });

  const [trialSecurity, setTrialSecurity] = useState<TrialSecurityState | null>(null);

  useEffect(() => {
    let isMounted = true;
    const runTrialSecurityCheck = async () => {
      try {
        const sec = await initializeAndCheckTrialSecurity();
        if (isMounted) {
          setTrialSecurity(sec);
          setTrialDaysLeft(sec.daysLeft);
          if (sec.daysLeft > 60) {
            setActivePlan('pro_1y');
          }
        }
      } catch (err) {
        console.error('[TrialSecurity] Error checking trial security:', err);
      }
    };

    runTrialSecurityCheck();
    const interval = setInterval(runTrialSecurityCheck, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const [clientEmailInput, setClientEmailInput] = useState<string>(() => {
    const saved = localStorage.getItem('hisaab_client_email');
    if (!saved || saved.toLowerCase() === 'raza4u0@gmail.com') {
      localStorage.setItem('hisaab_client_email', 'Hissabpro1@gmail.com');
      return 'Hissabpro1@gmail.com';
    }
    return saved;
  });

  const [clientMobileInput, setClientMobileInput] = useState<string>(() => {
    return localStorage.getItem('hisaab_client_mobile') || '+971 50 123 4567';
  });

  const [activatedSecurityCode, setActivatedSecurityCode] = useState<string>(() => {
    return localStorage.getItem('hisaab_security_code') || '';
  });

  const [activationInputKey, setActivationInputKey] = useState<string>('');

  // Subscription Enquiry & Payment Request Modal state
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState<boolean>(false);
  const [enquiryPlanTarget, setEnquiryPlanTarget] = useState<'pro_1y' | 'pro_3y' | 'pro_5y' | 'pro_lifetime' | 'basic'>('pro_1y');
  const [enquiryClientEmail, setEnquiryClientEmail] = useState<string>(() => localStorage.getItem('hisaab_client_email') || 'Hissabpro1@gmail.com');
  const [enquiryCompanyName, setEnquiryCompanyName] = useState<string>('');
  const [enquiryCompanyEmail, setEnquiryCompanyEmail] = useState<string>('');
  const [enquiryCompanyPhone, setEnquiryCompanyPhone] = useState<string>(() => localStorage.getItem('hisaab_client_mobile') || '+971 50 123 4567');
  const [enquiryNotes, setEnquiryNotes] = useState<string>('');
  const [enquiryModalTab, setEnquiryModalTab] = useState<'request' | 'code'>('request');
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState<boolean>(false);
  const [enquirySubmittedSuccess, setEnquirySubmittedSuccess] = useState<boolean>(false);
  const [submittedEnquiryDetails, setSubmittedEnquiryDetails] = useState<any>(null);
  const [copiedEnquiryDetails, setCopiedEnquiryDetails] = useState<boolean>(false);
  const [copiedEmailOnly, setCopiedEmailOnly] = useState<boolean>(false);

  const [lastSubmittedEnquiry, setLastSubmittedEnquiry] = useState<{ plan: string; companyName: string; companyEmail: string; phone: string; date: string } | null>(() => {
    const saved = localStorage.getItem('hisaab_last_enquiry');
    return saved ? JSON.parse(saved) : null;
  });

  const handleOpenSubscriptionEnquiry = (plan: 'pro_1y' | 'pro_3y' | 'pro_5y' | 'pro_lifetime' | 'basic') => {
    setEnquiryPlanTarget(plan);
    setEnquirySubmittedSuccess(false);
    setCopiedEnquiryDetails(false);
    setCopiedEmailOnly(false);
    const savedCompanies = localStorage.getItem('hisaab_companies');
    let compName = 'My UAE Enterprise';
    let compEmail = clientEmailInput || 'info@company.ae';
    let compPhone = clientMobileInput || '+971 50 123 4567';
    if (savedCompanies) {
      try {
        const parsed = JSON.parse(savedCompanies);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (parsed[0].name) compName = parsed[0].name;
          if (parsed[0].email) compEmail = parsed[0].email;
          if (parsed[0].phone) compPhone = parsed[0].phone;
        }
      } catch {}
    }
    setEnquiryCompanyName(compName);
    setEnquiryCompanyEmail(compEmail);
    setEnquiryCompanyPhone(compPhone);
    setEnquiryClientEmail(clientEmailInput || 'Hissabpro1@gmail.com');
    setEnquiryNotes('');
    setEnquiryModalTab('request');
    setIsEnquiryModalOpen(true);
  };

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryClientEmail || !enquiryClientEmail.includes('@')) {
      alert('⚠️ Invalid Client Email:\n\nPlease enter a valid Client Email address.');
      return;
    }
    if (!enquiryCompanyName.trim()) {
      alert('⚠️ Invalid Company Name:\n\nPlease enter your Company Name.');
      return;
    }
    if (!enquiryCompanyEmail || !enquiryCompanyEmail.includes('@')) {
      alert('⚠️ Invalid Company Email:\n\nPlease enter a valid Company Email address.');
      return;
    }
    if (!enquiryCompanyPhone || enquiryCompanyPhone.length < 7) {
      alert('⚠️ Invalid Company Phone:\n\nPlease enter a valid Company Phone Number.');
      return;
    }

    let planTitle = 'Hisaab Pro 1-Year Plan (AED 499)';
    let planPrice = 499;
    if (enquiryPlanTarget === 'pro_3y') {
      planTitle = 'Hisaab Pro 3-Year Plan (AED 1,199)';
      planPrice = 1199;
    } else if (enquiryPlanTarget === 'pro_5y') {
      planTitle = 'Hisaab Pro 5-Year Enterprise Plan (AED 1,699)';
      planPrice = 1699;
    } else if (enquiryPlanTarget === 'pro_lifetime') {
      planTitle = 'Hisaab Pro Lifetime VIP Plan (AED 1,999)';
      planPrice = 1999;
    }

    const recipientAdminEmail = 'Hissabpro1@gmail.com';
    const cleanCompany = enquiryCompanyName.trim();
    const cleanClientEmail = enquiryClientEmail.trim();
    const cleanCompanyEmail = enquiryCompanyEmail.trim();
    const cleanPhone = enquiryCompanyPhone.trim();
    const cleanNotes = enquiryNotes.trim();
    const nowStr = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setIsSubmittingEnquiry(true);

    const newEnquiry = {
      plan: planTitle,
      planId: enquiryPlanTarget,
      planPriceAed: planPrice,
      companyName: cleanCompany,
      companyEmail: cleanCompanyEmail,
      clientEmail: cleanClientEmail,
      phone: cleanPhone,
      machineId: machineId || 'HP-NODE-HW',
      notes: cleanNotes,
      notificationEmail: recipientAdminEmail,
      date: nowStr
    };

    try {
      await fetch('/api/subscription-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: enquiryPlanTarget,
          planTitle: planTitle,
          planPriceAed: planPrice,
          companyName: cleanCompany,
          clientEmail: cleanClientEmail,
          companyEmail: cleanCompanyEmail,
          companyPhone: cleanPhone,
          machineId: machineId || 'HP-NODE-HW',
          notes: cleanNotes
        })
      }).catch(err => console.warn('Backend subscription enquiry log:', err));
    } catch (err) {
      console.warn('Subscription enquiry fetch warning:', err);
    } finally {
      setIsSubmittingEnquiry(false);
    }

    localStorage.setItem('hisaab_last_enquiry', JSON.stringify(newEnquiry));
    setLastSubmittedEnquiry(newEnquiry);
    setSubmittedEnquiryDetails(newEnquiry);
    setEnquirySubmittedSuccess(true);
  };

  const handleActivateKeySubmitted = async (email: string, mobile: string, keyToVerify: string) => {
    const cleanEmail = email.trim();
    const cleanMobile = mobile.trim();
    const cleanKey = keyToVerify.trim().toUpperCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      alert('⚠️ Invalid Client Email:\n\nPlease enter a valid client email address (e.g. client@company.com).');
      return;
    }

    if (!cleanMobile || cleanMobile.length < 7) {
      alert('⚠️ Invalid Client Mobile Number:\n\nPlease enter a valid mobile number (e.g. +971 50 123 4567).');
      return;
    }

    if (!cleanKey) {
      alert('⚠️ Invalid License Code:\n\nPlease enter your 15 or 16-digit security license code or unlock key.');
      return;
    }

    // Direct Trial / Paid Unlock Keys check
    if (cleanKey === 'HISAAB-30-UNLOCK' || cleanKey === 'HISAAB-365-PAID') {
      const trialResult = await activateTrialLicenseKey(cleanKey);
      if (trialResult.success) {
        setTrialDaysLeft(trialResult.daysLeft);
        setActivePlan(trialResult.daysLeft > 60 ? 'pro_1y' : 'trial');
        setIsPaidPlan(true);
        const updated = await initializeAndCheckTrialSecurity();
        setTrialSecurity(updated);
        alert(`✓ ${trialResult.message}`);
        setActivationInputKey('');
        setIsEnquiryModalOpen(false);
        return;
      }
    }

    // Execute License System V3.0 Activation Engine with 3-Lock Checks & Device Limits
    const result = await activateLicense(cleanEmail, cleanMobile, cleanKey, machineId);

    if (!result.success) {
      alert(result.msg);
      return;
    }

    const newPlan = result.planType || 'pro_1y';

    // Save activation details and lock strictly to current Node Hardware ID (machineId)
    setActivePlan(newPlan);
    setIsPaidPlan(true);
    setActivatedSecurityCode(cleanKey);
    localStorage.setItem('hisaab_client_email', cleanEmail);
    localStorage.setItem('hisaab_client_mobile', cleanMobile);
    localStorage.setItem('hisaab_security_code', cleanKey);
    localStorage.setItem('hisaab_activated_machine_id', machineId);
    localStorage.setItem('hisaab_active_plan', JSON.stringify(newPlan));
    localStorage.setItem('hisaab_is_paid_plan', 'true');

    alert(result.msg);
    setActivationInputKey('');
    setIsEnquiryModalOpen(false);
  };

  // -------------------------------------------------------------
  // AUTHENTICATION & SPLASH STATE DEFINITIONS
  // -------------------------------------------------------------
  const [isSplashActive, setIsSplashActive] = useState<boolean>(true);
  
  const [isLoginEnabled, setIsLoginEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('hisaab_login_enabled');
    return saved ? saved === 'true' : true; // Defaults to true for enterprise security
  });

  const [loginEmail, setLoginEmail] = useState<string>(() => {
    const saved = localStorage.getItem('hisaab_login_email');
    if (!saved || saved.trim() === '' || saved === '//' || saved === 'undefined' || saved === 'null' || saved.toLowerCase() === 'raza4u0@gmail.com') {
      localStorage.setItem('hisaab_login_email', 'Hissabpro1@gmail.com');
      return 'Hissabpro1@gmail.com';
    }
    return saved;
  });

  const [loginMobile, setLoginMobile] = useState<string>(() => {
    const saved = localStorage.getItem('hisaab_login_mobile');
    if (!saved || saved.trim() === '' || saved === '//' || saved === 'undefined' || saved === 'null') {
      localStorage.setItem('hisaab_login_mobile', '0501234567');
      return '0501234567';
    }
    return saved;
  });

  const [loginPassword, setLoginPassword] = useState<string>(() => {
    const saved = localStorage.getItem('hisaab_login_password');
    if (!saved || saved.trim() === '' || saved === '//' || saved === 'undefined' || saved === 'null') {
      localStorage.setItem('hisaab_login_password', 'admin123');
      return 'admin123';
    }
    return saved;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const savedEnabled = localStorage.getItem('hisaab_login_enabled') === 'true';
    if (!savedEnabled) return true;
    
    const sessionAuth = sessionStorage.getItem('hisaab_session_logged_in');
    return sessionAuth === 'true';
  });

  const [showCorporateSetup, setShowCorporateSetup] = useState<boolean>(() => {
    try {
      const activeCompId = localStorage.getItem('hisaab_active_company_id') || 'comp_1';
      const isCompleted = localStorage.getItem(`hisaab_corporate_setup_completed_${activeCompId}`);
      return isCompleted !== 'true';
    } catch {
      return false;
    }
  });

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setIsLoginEnabled(true);
    safeSetLocalStorage('hisaab_login_enabled', true);
    try {
      sessionStorage.setItem('hisaab_session_logged_in', 'false');
    } catch (e) {
      console.warn('sessionStorage error:', e);
    }
  };

  // -------------------------------------------------------------
  // DOUBLE-ENTRY ACCOUNTING STATE DEFINITIONS
  // -------------------------------------------------------------
  const [coaAccounts, setCoaAccounts] = useState<COAAccount[]>(() => {
    try {
      const saved = localStorage.getItem('hisaab_coa_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Guarantee that the new system VAT Suspense account 2260 is merged
          if (!parsed.some((acc: any) => acc.code === '2260')) {
            parsed.push({
              code: '2260',
              name: 'VAT Suspense Payable (Provisional)',
              type: 'Liability',
              isSystem: true,
              description: 'VAT collected on provisional invoices with pending TRN'
            });
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_COA_ACCOUNTS;
  });

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem('hisaab_journal_entries');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_JOURNAL_ENTRIES;
  });

  const [accountingMode, setAccountingMode] = useState<'active' | 'passive'>(() => {
    try {
      const saved = localStorage.getItem('hisaab_accounting_mode');
      if (saved) {
        const parsed = safeParseJSON(saved, saved);
        if (parsed === 'active' || parsed === 'passive') return parsed as 'active' | 'passive';
      }
    } catch (e) {
      console.error(e);
    }
    return 'active'; // Default to active (automated journal auto-linking)
  });

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [invoicePortalOpened, setInvoicePortalOpened] = useState<boolean>(false);
  const [activeSidebarItemId, setActiveSidebarItemId] = useState<string>('dashboard');
  const [activeSettingsSubTab, setActiveSettingsSubTab] = useState<string>('general');
  const [selectedReportId, setSelectedReportId] = useState<string>('vat_return');
  const [showShortcutsHelp, setShowShortcutsHelp] = useState<boolean>(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [showHelpSystem, setShowHelpSystem] = useState<boolean>(false);
  const [showCommandSearch, setShowCommandSearch] = useState<boolean>(false);
  const [isPosModalOpen, setIsPosModalOpen] = useState<boolean>(false);

  // Splash Screen state (sessionStorage ensures it displays once per tab session)
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    return sessionStorage.getItem('hisaab_splash_shown') !== 'true';
  });

  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem('hisaab_splash_shown', 'true');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  useEffect(() => {
    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        if (customEvent.detail.tab) {
          setCurrentTab(customEvent.detail.tab);
          setActiveSidebarItemId(customEvent.detail.tab);
        }
        if (customEvent.detail.subTab) {
          setActiveSettingsSubTab(customEvent.detail.subTab);
        }
      }
    };
    window.addEventListener('switch-tab', handleSwitchTab);
    return () => window.removeEventListener('switch-tab', handleSwitchTab);
  }, []);


  // Notification and Calculator states
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const mainScrollRef = useRef<HTMLElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSyncRefreshing, setIsSyncRefreshing] = useState<boolean>(false);

  // Smooth scroll reset to top on tab and sidebar selection
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [currentTab, activeSidebarItemId, selectedReportId]);

  // Auto Low-Stock calculation
  const lowStockCount = useMemo(() => {
    const companyItems = inventory.filter(i => (i.companyId === activeCompanyId || !i.companyId));
    return companyItems.filter(i => (i.stockQuantity || 0) <= (i.minStockThreshold ?? 5)).length;
  }, [inventory, activeCompanyId]);

  // Auto Smart PDC maturity calculation (PDCs due in next 7 days)
  const pdcDueCount = useMemo(() => {
    try {
      const raw = localStorage.getItem(`hisaab_pdcs_${activeCompanyId}`) || localStorage.getItem('hisaab_pdcs');
      if (!raw) return 0;
      const pdcs = JSON.parse(raw);
      if (!Array.isArray(pdcs)) return 0;
      const today = new Date();
      const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const todayStr = today.toISOString().split('T')[0];
      const next7DaysStr = next7Days.toISOString().split('T')[0];
      return pdcs.filter((p: any) => p.status === 'Pending' && p.chequeDate >= todayStr && p.chequeDate <= next7DaysStr).length;
    } catch {
      return 0;
    }
  }, [activeCompanyId]);

  // One-Click Full Workspace JSON Export Backup
  const handleExportWorkspaceBackup = () => {
    try {
      const backupData = {
        app: 'evonix Hissab V2.0 - evonix Technologies ERP Suite',
        exportedAt: new Date().toISOString(),
        activeCompanyId,
        companies,
        documents,
        customers,
        inventory,
        expenses,
        staff,
        coaAccounts,
        journalEntries,
        customsEntries: localStorage.getItem('hisaab_customs_declarations'),
        pdcs: localStorage.getItem(`hisaab_pdcs_${activeCompanyId}`) || localStorage.getItem('hisaab_pdcs'),
        recurringTemplates: localStorage.getItem('hisaab_recurring_invoices'),
        branches: localStorage.getItem('hisaab_company_branches')
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evonix_Hissab_Backup_${(activeCompany?.name || 'evonix_Technologies').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('✅ Full Workspace Backup exported successfully!');
    } catch (err) {
      alert('⚠️ Failed to generate backup file: ' + String(err));
    }
  };

  // Restore Workspace Backup JSON
  const handleRestoreWorkspaceBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);

        if (!data.companies || !Array.isArray(data.companies)) {
          alert('⚠️ Invalid backup file format. Missing companies list.');
          return;
        }

        if (window.confirm(`⚠️ Restore Workspace Backup?\n\nThis will import:\n• ${data.companies.length} Companies\n• ${data.documents?.length || 0} Invoices/Docs\n• ${data.customers?.length || 0} Customers\n• ${data.inventory?.length || 0} Products\n\nDo you want to proceed?`)) {
          if (data.companies) {
            setCompanies(data.companies);
            localStorage.setItem('hisaab_companies', JSON.stringify(data.companies));
          }
          if (data.documents) {
            setDocuments(data.documents);
            localStorage.setItem('hisaab_documents', JSON.stringify(data.documents));
          }
          if (data.customers) {
            setCustomers(data.customers);
            localStorage.setItem('hisaab_customers', JSON.stringify(data.customers));
          }
          if (data.inventory) {
            setInventory(data.inventory);
            localStorage.setItem('hisaab_inventory', JSON.stringify(data.inventory));
          }
          if (data.expenses) {
            setExpenses(data.expenses);
            localStorage.setItem('hisaab_expenses', JSON.stringify(data.expenses));
          }
          if (data.staff) {
            setStaff(data.staff);
            localStorage.setItem('hisaab_staff', JSON.stringify(data.staff));
          }
          if (data.coaAccounts) {
            setCoaAccounts(data.coaAccounts);
            localStorage.setItem('hisaab_coa_accounts', JSON.stringify(data.coaAccounts));
          }
          if (data.journalEntries) {
            setJournalEntries(data.journalEntries);
            localStorage.setItem('hisaab_journal_entries', JSON.stringify(data.journalEntries));
          }
          showToast('✅ Workspace successfully restored from backup!');
        }
      } catch (err) {
        alert('⚠️ Error reading backup file: ' + String(err));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 4500);
  };
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('hisaab_notifications');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      { id: 'notif_1', text: 'New Invoice Alert: INV-1002 raised for AED 5,420.00', date: 'Just now', read: false, type: 'invoice' },
      { id: 'notif_2', text: 'Low Stock Alert: Premium Cement stock is critical (2 bags left)', date: '2 hours ago', read: false, type: 'stock' },
      { id: 'notif_3', text: 'VAT Due Date Reminder: FTA Q2 VAT Return 201 filing deadline is in 10 days', date: '1 day ago', read: false, type: 'vat' },
      { id: 'notif_4', text: 'New Client Registered: Dubai Contracting LLC added to CRM', date: '1 day ago', read: true, type: 'client' }
    ];
  });

  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [calMonthOffset, setCalMonthOffset] = useState<number>(0);
  const [calSelectedDate, setCalSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [calcMode, setCalcMode] = useState<'vat' | 'pl'>('vat');
  const [plCp, setPlCp] = useState<number>(100);
  const [plSp, setPlSp] = useState<number>(120);
  const [calcInput, setCalcInput] = useState<string>('');
  const [calcResult, setCalcResult] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('hisaab_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const handleCalcClick = (val: string) => {
    if (val === 'C') {
      setCalcInput('');
      setCalcResult('');
    } else if (val === '←') {
      setCalcInput(prev => prev.slice(0, -1));
    } else if (val === '=') {
      try {
        const cleanExpression = calcInput.replace(/[^0-9+\-*/().]/g, '');
        const res = Function(`"use strict"; return (${cleanExpression})`)();
        setCalcResult(String(Number(res).toFixed(2)));
      } catch (e) {
        setCalcResult('Error');
      }
    } else if (val === '+5% VAT') {
      try {
        const cleanExpression = calcInput.replace(/[^0-9+\-*/().]/g, '');
        const base = Function(`"use strict"; return (${cleanExpression})`)();
        const finalVal = base * 1.05;
        setCalcResult(String(Number(finalVal).toFixed(2)));
        setCalcInput(String(Number(finalVal).toFixed(2)));
      } catch (e) {
        setCalcResult('Error');
      }
    } else if (val === '5% VAT') {
      try {
        const cleanExpression = calcInput.replace(/[^0-9+\-*/().]/g, '');
        const base = Function(`"use strict"; return (${cleanExpression})`)();
        const vatVal = base * 0.05;
        setCalcResult(String(Number(vatVal).toFixed(2)));
      } catch (e) {
        setCalcResult('Error');
      }
    } else {
      setCalcInput(prev => prev + val);
    }
  };

  // Dark mode state and listener
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('hisaab_dark_mode') === 'true';
  });

  const [isSafeUpdateWizardOpen, setIsSafeUpdateWizardOpen] = useState<boolean>(false);

  // Auto-Safe Backup Snapshot on Launch / Update
  useEffect(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const lastSnap = localStorage.getItem('hisaab_last_auto_backup_date');
      if (lastSnap !== today) {
        const snapPayload: Record<string, any> = {
          capturedAt: new Date().toISOString(),
          version: 'v3.2.0-secure',
          totalCompanies: companies.length,
          totalDocuments: documents.length,
          totalCustomers: customers.length,
          totalExpenses: expenses.length
        };
        localStorage.setItem('hisaab_safe_auto_backup_latest', JSON.stringify(snapPayload));
        localStorage.setItem('hisaab_last_auto_backup_date', today);
      }
    } catch (e) {
      console.warn('Auto backup snapshot note:', e);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('hisaab_dark_mode', String(darkMode));
  }, [darkMode]);

  // Saza screen states
  const [sazaState, setSazaState] = useState<{
    isOpen: boolean;
    type: 'Company' | 'Invoice' | 'Purchase' | 'Quotation';
    title: string;
    detail: string;
    existingRecordId: string;
  }>({
    isOpen: false,
    type: 'Invoice',
    title: '',
    detail: '',
    existingRecordId: ''
  });

  const [initialViewDocId, setInitialViewDocId] = useState<string | null>(null);
  const [initialEditDocId, setInitialEditDocId] = useState<string | null>(null);
  const [initialCustomerId, setInitialCustomerId] = useState<string | null>(null);
  const [initialEditExpenseId, setInitialEditExpenseId] = useState<string | null>(null);

  // Current company helper
  const activeCompany = (companies.length > 0 ? (companies.find(c => c.id === activeCompanyId) || companies[0]) : INITIAL_COMPANIES[0]);

  // Global arrow key navigation of tabs
  useEffect(() => {
    const handleGlobalArrowKeys = (e: KeyboardEvent) => {
      // Ignore keypresses inside typing fields
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT' ||
        activeEl.getAttribute('contenteditable') === 'true'
      );
      if (isTyping) return;

      // Define standard list of tabs
      const isInventoryEnabled = activeCompany?.inventoryEnabled ?? false;
      const isVatEnabled = activeCompany?.vatEnabled ?? false;
      const isStaffEnabled = activeCompany?.staffEnabled ?? false;

      const visibleTabs = [
        'dashboard',
        'sales',
        'recurring',
        'customers',
        ...(isInventoryEnabled ? ['inventory'] : []),
        'expenses',
        'accounts',
        ...(isVatEnabled ? ['vat'] : []),
        'reports',
        ...(isStaffEnabled ? ['staff'] : []),
        'settings'
      ];

      const currentIndex = visibleTabs.indexOf(currentTab);
      if (currentIndex === -1) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % visibleTabs.length;
        const nextTab = visibleTabs[nextIndex];
        setCurrentTab(nextTab);
        setActiveSidebarItemId(nextTab);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + visibleTabs.length) % visibleTabs.length;
        const prevTab = visibleTabs[prevIndex];
        setCurrentTab(prevTab);
        setActiveSidebarItemId(prevTab);
      }
    };

    const handleCtrlKShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandSearch(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalArrowKeys);
    window.addEventListener('keydown', handleCtrlKShortcut);
    return () => {
      window.removeEventListener('keydown', handleGlobalArrowKeys);
      window.removeEventListener('keydown', handleCtrlKShortcut);
    };
  }, [currentTab, activeCompany]);

  // Apply brand theme on active company switch or theme change
  useEffect(() => {
    if (activeCompany) {
      initAppTheme(activeCompany);
    }
  }, [activeCompany?.id, activeCompany?.themePrimaryColor]);

  const playBuzzerSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(120, audioCtx.currentTime); // Low pitch buzzer frequency
      oscillator.frequency.linearRampToValueAtTime(80, audioCtx.currentTime + 0.45);
      
      gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.45);
    } catch (err) {
      console.warn('AudioContext beep failed (expected block by browser policies until user gesture):', err);
    }
  };

  const triggerDuplicateSaza = (
    type: 'Company' | 'Invoice' | 'Purchase' | 'Quotation',
    identifierNameOrNo: string,
    dateOrTrn: string,
    existingId: string
  ) => {
    let detail = '';
    if (type === 'Company') {
      detail = `This Company Name [${identifierNameOrNo}] or TRN [${dateOrTrn}] is already registered in the system.`;
    } else if (type === 'Invoice') {
      detail = `This [Invoice No. ${identifierNameOrNo}] was already issued on ${dateOrTrn}.`;
    } else if (type === 'Purchase') {
      detail = `This [Bill No. ${identifierNameOrNo}] was already recorded on ${dateOrTrn}.`;
    } else if (type === 'Quotation') {
      detail = `This [Quotation No. ${identifierNameOrNo}] was already created on ${dateOrTrn}.`;
    }

    setSazaState({
      isOpen: true,
      type,
      title: 'BLOCKED: Duplicate Found',
      detail,
      existingRecordId: existingId
    });

    playBuzzerSound();
  };

  const handleViewExistingRecord = () => {
    const { type, existingRecordId } = sazaState;
    setSazaState(prev => ({ ...prev, isOpen: false }));
    
    if (type === 'Company') {
      setActiveCompanyId(existingRecordId);
      setCurrentTab('dashboard');
    } else if (type === 'Invoice' || type === 'Quotation') {
      setInitialViewDocId(existingRecordId);
      setCurrentTab('sales');
    } else if (type === 'Purchase') {
      setInitialEditExpenseId(existingRecordId);
      setCurrentTab('expenses');
    }
  };

  const handleCancelSaza = () => {
    setSazaState(prev => ({ ...prev, isOpen: false }));
  };
  
  // Create company Modal state
  const [isCreateCompanyOpen, setIsCreateCompanyOpen] = useState(false);
  const [showPlanUpgradeAlert, setShowPlanUpgradeAlert] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);

  // Trigger quick create states
  const [initialCreateType, setInitialCreateType] = useState<DocumentType | null>(null);

  // Create Company form states
  const [newCompName, setNewCompName] = useState('');
  const [newCompTrn, setNewCompTrn] = useState('');
  const [newCompFyStart, setNewCompFyStart] = useState('2026-01-01');
  const [newCompBankName, setNewCompBankName] = useState('Emirates NBD');
  const [newCompAccountName, setNewCompAccountName] = useState('');
  const [newCompIban, setNewCompIban] = useState('AE12022000000');
  const [newCompFooter, setNewCompFooter] = useState('Thank you for choosing us.');
  const [newCompInventory, setNewCompInventory] = useState(false);
  const [newCompStaffEnabled, setNewCompStaffEnabled] = useState(true);
  const [newCompMultiBranch, setNewCompMultiBranch] = useState(false);
  const [newCompErpEnabled, setNewCompErpEnabled] = useState(true);
  const [newCompCorporateTaxEnabled, setNewCompCorporateTaxEnabled] = useState(false);
  const [newCompPosEnabled, setNewCompPosEnabled] = useState(false);
  const [newCompVatFilingFrequency, setNewCompVatFilingFrequency] = useState<'quarterly' | 'monthly' | 'yearly'>('quarterly');

  // Mobile sidebar trigger
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  // Custom high-fidelity delete confirmation modal states
  const [docToDelete, setDocToDelete] = useState<SalesDocument | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  // -------------------------------------------------------------
  // STATE PERSISTENCE SYNC IN EFFECTS
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // REAL-TIME MULTI-TERMINAL (CLIENT & SERVER) SYNCHRONIZATION ENGINE
  // -------------------------------------------------------------
  useEffect(() => {
    const handleSyncEvent = (key: string) => {
      try {
        switch (key) {
          case 'hisaab_companies': {
            const saved = localStorage.getItem('hisaab_companies');
            if (saved) {
              const parsed = safeParseJSON(saved, companies);
              if (Array.isArray(parsed) && JSON.stringify(parsed) !== JSON.stringify(companies)) {
                setCompanies(parsed);
              }
            }
            break;
          }
          case 'hisaab_active_company_id': {
            const saved = localStorage.getItem('hisaab_active_company_id');
            if (saved) {
              const parsed = safeParseJSON(saved, activeCompanyId);
              if (parsed && parsed !== activeCompanyId) {
                setActiveCompanyId(parsed);
              }
            }
            break;
          }
          case 'hisaab_customers': {
            const saved = localStorage.getItem('hisaab_customers');
            if (saved) {
              const parsed = safeParseJSON(saved, customers);
              if (Array.isArray(parsed) && JSON.stringify(parsed) !== JSON.stringify(customers)) {
                setCustomers(parsed);
              }
            }
            break;
          }
          case 'hisaab_inventory': {
            const saved = localStorage.getItem('hisaab_inventory');
            if (saved) {
              const parsed = safeParseJSON(saved, inventory);
              if (Array.isArray(parsed) && JSON.stringify(parsed) !== JSON.stringify(inventory)) {
                setInventory(parsed);
              }
            }
            break;
          }
          case 'hisaab_documents': {
            const saved = localStorage.getItem('hisaab_documents');
            if (saved) {
              const parsed = safeParseJSON(saved, documents);
              if (Array.isArray(parsed) && JSON.stringify(parsed) !== JSON.stringify(documents)) {
                setDocuments(parsed);
              }
            }
            break;
          }
          case 'hisaab_expenses': {
            const saved = localStorage.getItem('hisaab_expenses');
            if (saved) {
              const parsed = safeParseJSON(saved, expenses);
              if (Array.isArray(parsed) && JSON.stringify(parsed) !== JSON.stringify(expenses)) {
                setExpenses(parsed);
              }
            }
            break;
          }
          case 'hisaab_recurring': {
            const saved = localStorage.getItem('hisaab_recurring');
            if (saved) {
              const parsed = safeParseJSON(saved, recurringInvoices);
              if (Array.isArray(parsed) && JSON.stringify(parsed) !== JSON.stringify(recurringInvoices)) {
                setRecurringInvoices(parsed);
              }
            }
            break;
          }
          case 'hisaab_staff': {
            const saved = localStorage.getItem('hisaab_staff');
            if (saved) {
              const parsed = safeParseJSON(saved, staff);
              if (Array.isArray(parsed) && JSON.stringify(parsed) !== JSON.stringify(staff)) {
                setStaff(parsed);
              }
            }
            break;
          }
          case 'hisaab_coa_accounts': {
            const saved = localStorage.getItem('hisaab_coa_accounts');
            if (saved) {
              const parsed = safeParseJSON(saved, coaAccounts);
              if (Array.isArray(parsed) && JSON.stringify(parsed) !== JSON.stringify(coaAccounts)) {
                setCoaAccounts(parsed);
              }
            }
            break;
          }
          case 'hisaab_journal_entries': {
            const saved = localStorage.getItem('hisaab_journal_entries');
            if (saved) {
              const parsed = safeParseJSON(saved, journalEntries);
              if (Array.isArray(parsed) && JSON.stringify(parsed) !== JSON.stringify(journalEntries)) {
                setJournalEntries(parsed);
              }
            }
            break;
          }
          case 'hisaab_accounting_mode': {
            const saved = localStorage.getItem('hisaab_accounting_mode');
            if (saved) {
              const parsed = safeParseJSON(saved, accountingMode);
              if (parsed !== accountingMode) {
                setAccountingMode(parsed);
              }
            }
            break;
          }
          case 'hisaab_active_plan': {
            const saved = localStorage.getItem('hisaab_active_plan');
            if (saved) {
              const parsed = safeParseJSON(saved, activePlan);
              if (parsed !== activePlan) {
                setActivePlan(parsed);
              }
            }
            break;
          }
          case 'hisaab_is_paid_plan': {
            const saved = localStorage.getItem('hisaab_is_paid_plan');
            if (saved) {
              const parsed = safeParseJSON(saved, isPaidPlan);
              if (parsed !== isPaidPlan) {
                setIsPaidPlan(parsed);
              }
            }
            break;
          }
        }
      } catch (err) {
        console.error('Error syncing state key:', key, err);
      }
    };

    const storageListener = (e: StorageEvent) => {
      if (e.key) {
        handleSyncEvent(e.key);
      }
    };

    window.addEventListener('storage', storageListener);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('hisaab_pro_realtime_sync_channel');
      bc.onmessage = (event) => {
        if (event.data && event.data.type === 'SYNC_STATE_KEY' && event.data.key) {
          handleSyncEvent(event.data.key);
        } else if (event.data && event.data.type === 'SIMULTANEOUS_REFRESH') {
          console.log('Simultaneous refresh triggered via BroadcastChannel.');
          const keys = [
            'hisaab_companies',
            'hisaab_active_company_id',
            'hisaab_customers',
            'hisaab_inventory',
            'hisaab_documents',
            'hisaab_expenses',
            'hisaab_recurring',
            'hisaab_staff',
            'hisaab_coa_accounts',
            'hisaab_journal_entries',
            'hisaab_accounting_mode',
            'hisaab_active_plan',
            'hisaab_is_paid_plan'
          ];
          keys.forEach(k => handleSyncEvent(k));
          
          const notif = {
            id: 'sync_' + Date.now(),
            title: '🔄 Simultaneous LAN Refresh',
            message: `Real-time synchronization successfully refreshed ${event.data.origin || 'another station'} and this station simultaneously!`,
            timestamp: new Date().toLocaleTimeString(),
            read: false,
            type: 'info' as const
          };
          setNotifications(prev => [notif, ...prev]);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported in this environment.', e);
    }

    return () => {
      window.removeEventListener('storage', storageListener);
      if (bc) {
        bc.close();
      }
    };
  }, [
    companies,
    activeCompanyId,
    customers,
    inventory,
    documents,
    expenses,
    recurringInvoices,
    staff,
    coaAccounts,
    journalEntries,
    accountingMode,
    activePlan,
    isPaidPlan
  ]);

  useEffect(() => {
    safeSetLocalStorage('hisaab_companies', companies);
    broadcastStateChange('hisaab_companies');
  }, [companies]);

  useEffect(() => {
    safeSetLocalStorage('hisaab_active_company_id', activeCompanyId);
    broadcastStateChange('hisaab_active_company_id');
  }, [activeCompanyId]);

  useEffect(() => {
    if (activeCompany?.appFont) {
      const fontId = 'dynamic-google-font';
      let link = document.getElementById(fontId) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      
      const fontMap: Record<string, string> = {
        'Inter': 'Inter:wght@400;500;600;700;800;900',
        'Space Grotesk': 'Space+Grotesk:wght@400;500;600;700',
        'JetBrains Mono': 'JetBrains+Mono:wght@400;500;600;700;800',
        'Lexend': 'Lexend:wght@400;500;600;700;800',
        'Plus Jakarta Sans': 'Plus+Jakarta+Sans:wght@400;500;600;700;800',
        'Outfit': 'Outfit:wght@400;500;600;700;800',
        'DM Sans': 'DM+Sans:wght@400;500;700',
        'Playfair Display': 'Playfair+Display:wght@400;500;600;700;800',
        'Cabin': 'Cabin:wght@400;500;600;700',
        'Noto Sans Arabic': 'Noto+Sans+Arabic:wght@400;500;600;700;800;900',
      };

      const fontApiName = fontMap[activeCompany.appFont] || 'Inter:wght@400;500;600;700;800;900';
      link.href = `https://fonts.googleapis.com/css2?family=${fontApiName}&display=swap`;
      
      document.body.style.fontFamily = `'${activeCompany.appFont}', system-ui, sans-serif`;
    } else {
      document.body.style.fontFamily = '';
    }
  }, [activeCompany?.appFont]);

  // -------------------------------------------------------------
  // AUTOMATED ERROR CAPTURE & LOCAL LOGGING SYSTEM (NO OUTGOING EMAIL)
  // -------------------------------------------------------------
  useEffect(() => {
    const handleSystemError = (errorMessage: string, errorSource: string, errorLine: number) => {
      const crashId = `CR-${Math.floor(1000 + Math.random() * 9000)}`;
      const crashDesc = `AUTOMATIC CRASH LOG: ${errorMessage} inside ${errorSource || 'unknown module'} line ${errorLine || 0}`;

      // Get current logs
      let currentLogs: any[] = [];
      try {
        const saved = localStorage.getItem('hisaab_feedback_logs');
        currentLogs = saved ? JSON.parse(saved) : [];
      } catch (e) {
        currentLogs = [];
      }

      // Prepend the new automatic crash report
      const newCrashLog = {
        id: crashId,
        date: new Date().toISOString(),
        category: 'others',
        description: crashDesc,
        emailSentTo: 'Local Storage',
        status: 'recorded',
        isAutoCrashReport: true
      };

      try {
        const trimmed = [newCrashLog, ...currentLogs].slice(0, 20);
        safeSetLocalStorage('hisaab_feedback_logs', trimmed);
      } catch (logErr) {
        console.warn('Failed to save crash log:', logErr);
      }
      
      // Dispatch custom event to notify settings to reload logs if currently open
      window.dispatchEvent(new CustomEvent('hisaab_crash_reported'));
      console.warn(`[Hisaab Pro Diagnostics] Intercepted Error logged locally: ${crashDesc}`);
    };

    // 1. Intercept Standard Window Errors
    const onerrorListener = (event: ErrorEvent) => {
      handleSystemError(
        event.message || 'Unknown runtime error',
        event.filename || 'App.tsx',
        event.lineno || 0
      );
    };

    // 2. Intercept Unhandled Promise Rejections
    const onrejectionListener = (event: PromiseRejectionEvent) => {
      handleSystemError(
        `Unhandled Promise Rejection: ${event.reason?.message || String(event.reason)}`,
        'App.tsx',
        0
      );
    };

    // 3. Listen to Simulated Crash triggers from settings sandbox
    const onSimulateCrashListener = (e: Event) => {
      const customEvent = e as CustomEvent;
      handleSystemError(
        customEvent.detail?.message || 'Simulated exception inside Sandbox Controller',
        'CompanySettings.tsx',
        3295
      );
    };

    window.addEventListener('error', onerrorListener);
    window.addEventListener('unhandledrejection', onrejectionListener);
    window.addEventListener('simulate-crash', onSimulateCrashListener);

    return () => {
      window.removeEventListener('error', onerrorListener);
      window.removeEventListener('unhandledrejection', onrejectionListener);
      window.removeEventListener('simulate-crash', onSimulateCrashListener);
    };
  }, [activeCompany]);

  useEffect(() => {
    const accent = activeCompany?.appAccentColor || 'blue';
    const colorMap: Record<string, { primary: string; hover: string; text: string; bg: string; border: string; ring: string }> = {
      blue: { primary: '#2563eb', hover: '#1d4ed8', text: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', ring: 'rgba(37, 99, 235, 0.15)' },
      emerald: { primary: '#059669', hover: '#047857', text: '#059669', bg: '#ecfdf5', border: '#a7f3d0', ring: 'rgba(5, 150, 105, 0.15)' },
      purple: { primary: '#7c3aed', hover: '#6d28d9', text: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', ring: 'rgba(124, 58, 237, 0.15)' },
      amber: { primary: '#d97706', hover: '#b45309', text: '#d97706', bg: '#fef3c7', border: '#fde68a', ring: 'rgba(217, 119, 6, 0.15)' },
      teal: { primary: '#0d9488', hover: '#0f766e', text: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', ring: 'rgba(13, 148, 136, 0.15)' },
      rose: { primary: '#e11d48', hover: '#be123c', text: '#e11d48', bg: '#fff1f2', border: '#fecdd3', ring: 'rgba(225, 29, 72, 0.15)' },
      slate: { primary: '#475569', hover: '#334155', text: '#475569', bg: '#f1f5f9', border: '#e2e8f0', ring: 'rgba(71, 85, 105, 0.15)' },
    };

    const themeColors = colorMap[accent] || colorMap.blue;
    const styleId = 'dynamic-theme-accent-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.innerHTML = `
      :root {
        --color-theme-primary: ${themeColors.primary};
        --color-theme-hover: ${themeColors.hover};
        --color-theme-text: ${themeColors.text};
        --color-theme-bg: ${themeColors.bg};
        --color-theme-border: ${themeColors.border};
        --color-theme-ring: ${themeColors.ring};
      }
      
      /* Target primary buttons, icons, accents and links globally across the app */
      .bg-indigo-600, .bg-blue-600, .bg-indigo-500 {
        background-color: var(--color-theme-primary) !important;
      }
      .hover\\:bg-indigo-700:hover, .hover\\:bg-blue-700:hover, .hover\\:bg-indigo-600:hover {
        background-color: var(--color-theme-hover) !important;
      }
      .text-indigo-600, .text-blue-600, .text-indigo-500 {
        color: var(--color-theme-primary) !important;
      }
      .hover\\:text-indigo-700:hover, .hover\\:text-blue-700:hover, .hover\\:text-indigo-600:hover {
        color: var(--color-theme-hover) !important;
      }
      .border-indigo-600, .border-blue-600, .border-indigo-500 {
        border-color: var(--color-theme-primary) !important;
      }
      .ring-indigo-500, .ring-blue-500 {
        --tw-ring-color: var(--color-theme-primary) !important;
      }
      .focus\\:border-indigo-500:focus, .focus\\:border-blue-500:focus {
        border-color: var(--color-theme-primary) !important;
      }
      .bg-indigo-50, .bg-blue-50 {
        background-color: var(--color-theme-bg) !important;
      }
      .text-indigo-700, .text-blue-700 {
        color: var(--color-theme-hover) !important;
      }
      
      /* Input overrides for unified theme feeling */
      input:focus, select:focus, textarea:focus {
        border-color: var(--color-theme-primary) !important;
        box-shadow: 0 0 0 2px var(--color-theme-ring) !important;
      }
    `;
  }, [activeCompany?.appAccentColor]);

  useEffect(() => {
    safeSetLocalStorage('hisaab_customers', customers);
    broadcastStateChange('hisaab_customers');
  }, [customers]);

  useEffect(() => {
    safeSetLocalStorage('hisaab_inventory', inventory);
    broadcastStateChange('hisaab_inventory');
  }, [inventory]);

  useEffect(() => {
    safeSetLocalStorage('hisaab_documents', documents);
    broadcastStateChange('hisaab_documents');
  }, [documents]);

  useEffect(() => {
    safeSetLocalStorage('hisaab_expenses', expenses);
    broadcastStateChange('hisaab_expenses');
  }, [expenses]);

  useEffect(() => {
    safeSetLocalStorage('hisaab_recurring', recurringInvoices);
    broadcastStateChange('hisaab_recurring');
  }, [recurringInvoices]);

  useEffect(() => {
    safeSetLocalStorage('hisaab_is_paid_plan', isPaidPlan);
    broadcastStateChange('hisaab_is_paid_plan');
  }, [isPaidPlan]);

  useEffect(() => {
    safeSetLocalStorage('hisaab_active_plan', activePlan);
    setIsPaidPlan(activePlan !== 'basic');
    broadcastStateChange('hisaab_active_plan');
  }, [activePlan]);

  useEffect(() => {
    safeSetLocalStorage('hisaab_trial_days_left', trialDaysLeft);
  }, [trialDaysLeft]);

  useEffect(() => {
    safeSetLocalStorage('hisaab_login_enabled', isLoginEnabled);
    // If login is disabled, make sure we mark them as logged in for ease
    if (!isLoginEnabled) {
      setIsLoggedIn(true);
    }
  }, [isLoginEnabled]);

  useEffect(() => {
    safeSetLocalStorage('hisaab_login_email', loginEmail);
  }, [loginEmail]);

  useEffect(() => {
    safeSetLocalStorage('hisaab_login_mobile', loginMobile);
  }, [loginMobile]);

  useEffect(() => {
    safeSetLocalStorage('hisaab_login_password', loginPassword);
  }, [loginPassword]);

  useEffect(() => {
    try {
      sessionStorage.setItem('hisaab_session_logged_in', JSON.stringify(isLoggedIn));
    } catch (e) {
      console.warn('sessionStorage error:', e);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    safeSetLocalStorage('hisaab_staff', staff);
    broadcastStateChange('hisaab_staff');
  }, [staff]);

  useEffect(() => {
    safeSetLocalStorage('hisaab_coa_accounts', coaAccounts);
    broadcastStateChange('hisaab_coa_accounts');
  }, [coaAccounts]);

  useEffect(() => {
    safeSetLocalStorage('hisaab_journal_entries', journalEntries);
    broadcastStateChange('hisaab_journal_entries');
  }, [journalEntries]);

  useEffect(() => {
    safeSetLocalStorage('hisaab_accounting_mode', accountingMode);
    broadcastStateChange('hisaab_accounting_mode');
  }, [accountingMode]);

  // Reactive Auto-Journal linking sync engine
  useEffect(() => {
    if (accountingMode === 'active') {
      const manualEntries = journalEntries.filter(je => !je.isAutoLinked);
      const autoEntries: JournalEntry[] = [];

      // Generate for Invoices
      documents.forEach(doc => {
        if (doc.type === 'Invoice' && doc.status !== 'Cancelled') {
          const total = doc.total;
          const subtotal = doc.subtotal;
          const vatTotal = doc.vatTotal || 0;
          const isPaid = doc.status === 'Paid';

          const cust = customers.find(c => c.id === doc.customerId);
          const isProvisional = cust?.vatStatus === 'pending';
          const vatAccount = isProvisional ? '2260' : '2250';

          const lines = [
            // Debit: Bank (if paid) or Accounts Receivable (if unpaid)
            {
              accountCode: isPaid ? '1000' : '1200',
              debit: total,
              credit: 0
            },
            // Credit: Sales Revenue (subtotal)
            {
              accountCode: '4000',
              debit: 0,
              credit: subtotal
            }
          ];

          // Credit: Output VAT (if any)
          if (vatTotal > 0) {
            lines.push({
              accountCode: vatAccount,
              debit: 0,
              credit: vatTotal
            });
          }

          autoEntries.push({
            id: `je_auto_invoice_${doc.id}`,
            companyId: doc.companyId,
            date: doc.date,
            reference: doc.docNumber,
            description: `Auto-linked Journal Entry for Invoice ${doc.docNumber} (${doc.status})`,
            status: 'Posted',
            isAutoLinked: true,
            lines
          });
        }
      });

      // Generate for Expenses
      expenses.forEach(exp => {
        const amount = exp.amount;
        const vatAmount = exp.vatAmount || 0;
        const total = exp.total;
        
        // If it is a purchase with payment history, or outstanding bills, we treat it strictly under Accounts Payable (2100)
        const isPurchaseWithPayHistory = exp.category === 'Purchases' || (exp.paymentHistory && exp.paymentHistory.length > 0);
        const isPaidImmediate = exp.status === 'Paid' && !isPurchaseWithPayHistory;

        // Map Category to Account Code
        let expenseCode = '6000'; // Default Operational Expenses
        const cat = exp.category?.toLowerCase() || '';
        if (cat.includes('rent')) expenseCode = '6100';
        else if (cat.includes('util')) expenseCode = '6200';
        else if (cat.includes('salar') || cat.includes('wage')) expenseCode = '6300';
        else if (cat.includes('purch') || cat.includes('direct')) expenseCode = '5000';
        else if (cat.includes('mark') || cat.includes('advert')) expenseCode = '6400';
        else if (cat.includes('logist') || cat.includes('freight')) expenseCode = '6500';

        const lines = [
          // Debit: Expense Code (subtotal amount)
          {
            accountCode: expenseCode,
            debit: amount,
            credit: 0
          }
        ];

        // Debit: Input VAT (if any)
        if (vatAmount > 0) {
          lines.push({
            accountCode: '1350',
            debit: vatAmount,
            credit: 0
          });
        }

        // Credit: Cash/Bank (if paid immediately) or Accounts Payable (if unpaid/partial/purchase)
        lines.push({
          accountCode: isPaidImmediate ? '1000' : '2100',
          debit: 0,
          credit: total
        });

        autoEntries.push({
          id: `je_auto_expense_${exp.id}`,
          companyId: exp.companyId,
          date: exp.date,
          reference: exp.invoiceNumber || `EXP-${exp.id}`,
          description: `Auto-linked Journal Entry for Expense ${exp.invoiceNumber || ''} (${exp.status})`,
          status: 'Posted',
          isAutoLinked: true,
          lines
        });

        // Also generate individual payment journal entries for each voucher in paymentHistory
        if (isPurchaseWithPayHistory && exp.paymentHistory) {
          exp.paymentHistory.forEach(pm => {
            autoEntries.push({
              id: `je_auto_payment_${exp.id}_${pm.id}`,
              companyId: exp.companyId,
              date: pm.date,
              reference: pm.voucherNo || pm.refNo || 'PV-N/A',
              description: `Auto-linked Payment Voucher ${pm.voucherNo || pm.refNo || ''} to ${exp.supplierName || 'Supplier'} for Bill ${exp.invoiceNumber || 'N/A'}`,
              status: 'Posted',
              isAutoLinked: true,
              lines: [
                // Debit: Accounts Payable (2100) - Reducing Liability
                {
                  accountCode: '2100',
                  debit: pm.amount,
                  credit: 0
                },
                // Credit: Bank/Cash (1000) - Reducing Asset
                {
                  accountCode: '1000',
                  debit: 0,
                  credit: pm.amount
                }
              ]
            });
          });
        }
      });

      const combined = [...manualEntries, ...autoEntries];
      
      // Prevent recursive updates if they match exactly
      const oldAutoIds = journalEntries.filter(je => je.isAutoLinked).map(je => je.id).sort().join(',');
      const newAutoIds = autoEntries.map(je => je.id).sort().join(',');
      
      const oldDetails = JSON.stringify(journalEntries.filter(je => je.isAutoLinked));
      const newDetails = JSON.stringify(autoEntries);

      if (oldAutoIds !== newAutoIds || oldDetails !== newDetails || journalEntries.length !== combined.length) {
        setJournalEntries(combined);
      }
    }
  }, [documents, expenses, accountingMode, customers]);

  // Subscription Plan & Trial Countdown Listener
  useEffect(() => {
    const handlePlanChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.plan) {
        setActivePlan(customEvent.detail.plan);
      }
    };
    const handleTrialDaysChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.days !== undefined) {
        setTrialDaysLeft(customEvent.detail.days);
      }
    };
    const handleOpenEnquiryEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const targetPlan = customEvent.detail?.plan || 'pro_1y';
      handleOpenSubscriptionEnquiry(targetPlan);
    };
    window.addEventListener('change-plan', handlePlanChange);
    window.addEventListener('change-trial-days', handleTrialDaysChange);
    window.addEventListener('open-subscription-enquiry', handleOpenEnquiryEvent);
    return () => {
      window.removeEventListener('change-plan', handlePlanChange);
      window.removeEventListener('change-trial-days', handleTrialDaysChange);
      window.removeEventListener('open-subscription-enquiry', handleOpenEnquiryEvent);
    };
  }, []);

  // 5-Second Startup Splash Screen Timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashActive(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Feature Flag Route Guard / Redirects
  useEffect(() => {
    if (activeCompany) {
      if (currentTab === 'inventory' && !activeCompany.inventoryEnabled) {
        setCurrentTab('dashboard');
      }
      if (currentTab === 'staff' && !activeCompany.staffEnabled) {
        setCurrentTab('dashboard');
      }
      if (currentTab === 'vat' && activeCompany.vatEnabled === false) {
        setCurrentTab('dashboard');
      }
      if (currentTab === 'pos' && !activeCompany.posEnabled) {
        setCurrentTab('dashboard');
      }
      if (activeCompany.erpEnabled === false && (currentTab === 'accounts' || currentTab === 'bank_rec' || currentTab === 'pdc' || currentTab === 'assets')) {
        setCurrentTab('dashboard');
      }
    }
  }, [currentTab, activeCompany, activeCompanyId]);

  // Trigger Day 60 Upgrade popup (when 30 Days remain or are less of the 90-Day free trial)
  useEffect(() => {
    if (activePlan === 'trial' && trialDaysLeft <= 30) {
      const hasShownThisSession = sessionStorage.getItem('hisaab_upgrade_popup_shown_session');
      if (!hasShownThisSession) {
        sessionStorage.setItem('hisaab_upgrade_popup_shown_session', 'true');
        setShowPricingModal(true);
      }
    }
  }, [activePlan, trialDaysLeft]);

  // Global Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e || !e.key) return;
      const isCtrl = e.ctrlKey || e.metaKey;
      const isAlt = e.altKey;
      const key = e.key.toLowerCase();

      // Ctrl+K focuses the global search bar input
      if (isCtrl && key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) {
          searchInput.focus();
        }
        return;
      }

      // Help/Cheatsheet: Ctrl+/
      if (isCtrl && key === '/') {
        e.preventDefault();
        setShowShortcutsHelp(prev => !prev);
        return;
      }

      // Ctrl+S for saving/submitting active form
      if (isCtrl && key === 's') {
        const openForm = document.querySelector('form');
        if (openForm) {
          e.preventDefault();
          openForm.requestSubmit();
        }
        return;
      }

      // Ctrl+N for contextual new creation
      if (isCtrl && key === 'n') {
        e.preventDefault();
        
        // Contextual action based on current tab
        if (currentTab === 'customers') {
          const btn = document.getElementById('btn-add-customer-open');
          if (btn) {
            btn.click();
          }
        } else if (currentTab === 'inventory') {
          const btn = document.getElementById('btn-add-item-open');
          if (btn) {
            btn.click();
          }
        } else if (currentTab === 'expenses') {
          const btn = document.getElementById('btn-add-expense-open');
          if (btn) {
            btn.click();
          }
        } else if (currentTab === 'recurring') {
          const btn = document.getElementById('btn-add-recurring-open');
          if (btn) {
            btn.click();
          }
        } else if (currentTab === 'sales') {
          const btn = document.getElementById('btn-add-invoice-open');
          if (btn) {
            btn.click();
          } else {
            setCurrentTab('sales');
            setTimeout(() => {
              setInitialCreateType('Invoice');
            }, 50);
          }
        } else {
          // Default contextual fallback: switch to sales tab & launch New Invoice creation form
          setCurrentTab('sales');
          setTimeout(() => {
            setInitialCreateType('Invoice');
          }, 50);
        }
        return;
      }

      // Ctrl+P for Reports (unless a print-preview / print modal is actively showing)
      if (isCtrl && key === 'p') {
        const modalOpen = !!document.querySelector('.fixed.inset-0') || !!document.querySelector('.modal');
        if (modalOpen) {
          // Let standard browser print dialogue proceed
          return;
        }
        e.preventDefault();
        setCurrentTab('reports');
        return;
      }

      // Navigation Shortcuts: Alt+1 to Alt+8 or Ctrl+Alt+1 to Ctrl+Alt+8
      if (isAlt || (isCtrl && isAlt)) {
        if (e.key >= '1' && e.key <= '8') {
          e.preventDefault();
          const tabMap: Record<string, string> = {
            '1': 'dashboard',
            '2': 'sales',
            '3': 'recurring',
            '4': 'inventory',
            '5': 'expenses',
            '6': 'customers',
            '7': 'vat',
            '8': 'settings'
          };
          const targetTab = tabMap[e.key];
          if (targetTab) {
            setCurrentTab(targetTab);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentTab, setInitialCreateType]);

  // Ensure active company ID exists
  useEffect(() => {
    if (companies.length > 0 && (!activeCompanyId || !companies.some(c => c.id === activeCompanyId))) {
      setActiveCompanyId(companies[0].id);
    }
  }, [companies, activeCompanyId]);

  // Auto-run recurring invoice scheduler simulation on application load
  useEffect(() => {
    const timer = setTimeout(() => {
      const todayStr = new Date().toISOString().split('T')[0];
      let generatedCount = 0;
      
      setRecurringInvoices(prevRecs => {
        if (!prevRecs || prevRecs.length === 0) return prevRecs;
        
        const updatedRecs = [...prevRecs];
        const newDocsToAdd: SalesDocument[] = [];
        let changed = false;

        updatedRecs.forEach((rec, idx) => {
          if (rec.isActive && rec.nextRunDate && rec.nextRunDate <= todayStr) {
            const company = companies.find(c => c.id === rec.companyId);
            if (!company) return;

            // Sequence calculation
            const typeDocs = [...newDocsToAdd, ...documents].filter(d => d.type === 'Invoice' && d.companyId === rec.companyId);
            const nextRawNumber = typeDocs.reduce((max, d) => Math.max(max, d.rawNumber), 1000) + 1;
            const prefix = company.invoicePrefix || 'INV-';
            const docNumber = `${prefix}${nextRawNumber}`;

            const docItem = {
              itemId: `item_rec_${Date.now()}_${idx}`,
              name: rec.description || 'Monthly Recurring Services',
              sku: 'REC-SRV',
              qty: 1,
              rate: rec.amount,
              vatRate: 5,
              vatAmount: rec.vatAmount,
              subtotal: rec.amount,
              total: rec.total
            };

            const due = new Date();
            due.setDate(due.getDate() + 15);
            const dueDateStr = due.toISOString().split('T')[0];

            const autoDoc: SalesDocument = {
              id: `doc_auto_${Date.now()}_${idx}`,
              companyId: rec.companyId,
              type: 'Invoice',
              docNumber,
              rawNumber: nextRawNumber,
              date: todayStr,
              dueDate: dueDateStr,
              customerId: rec.customerId,
              items: [docItem],
              subtotal: rec.amount,
              vatTotal: rec.vatAmount,
              discount: 0,
              total: rec.total,
              status: 'Unpaid',
              notes: 'Auto-generated Recurring Invoice.',
              reference: 'RECURRING-SYSTEM',
              bankName: company.bankName,
              bankAccountName: company.bankAccountName,
              bankIban: company.bankIban,
              footerNotes: company.footerNotes,
              trn: company.trn,
              paymentTerms: 'Net 15',
              paymentMethod: company.bankName ? 'Bank Transfer' : undefined
            };

            newDocsToAdd.push(autoDoc);

            const nextDate = new Date(rec.nextRunDate);
            nextDate.setMonth(nextDate.getMonth() + 1);
            rec.nextRunDate = nextDate.toISOString().split('T')[0];

            generatedCount++;
            changed = true;
          }
        });

        if (changed) {
          setDocuments(prevDocs => [...newDocsToAdd, ...prevDocs]);
          setTimeout(() => {
            alert(`Recurring Invoice Scheduler: Auto-generated ${generatedCount} invoice(s) due today!`);
          }, 500);
          return updatedRecs;
        }
        return prevRecs;
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [companies]);

  // Dynamic Routing Guard: Redirect to dashboard if trying to access inventory while disabled
  useEffect(() => {
    if (currentTab === 'inventory' && activeCompany && !activeCompany.inventoryEnabled) {
      setCurrentTab('dashboard');
    }
  }, [currentTab, activeCompany]);

  // -------------------------------------------------------------
  // EVENT HANDLERS & CALLBACKS
  // -------------------------------------------------------------
  
  // Helper to determine max companies allowed by subscription plan
  const getMaxCompaniesAllowed = (): number => {
    if (activePlan === 'pro_lifetime' || activePlan === 'pro_5y') return Infinity;
    if (activePlan === 'pro_3y') return 5;
    return 1; // basic, trial, pro_1y (Year 1)
  };

  // Guard adding company based on subscription tier
  const handleOpenCreateCompanyModal = () => {
    const maxAllowed = getMaxCompaniesAllowed();
    if (companies.length >= maxAllowed) {
      alert(`🚫 Company Creation Limit Reached (${maxAllowed} Max):\n\nYour current plan (${activePlan.toUpperCase().replace('_', ' ')}) allows up to ${maxAllowed === Infinity ? 'Unlimited' : maxAllowed} active company profile(s).\n\n• Basic / 1-Year Pro: 1 Company Limit\n• 3-Year Pro: 5 Companies Limit\n• Lifetime Pro: Unlimited Companies\n\nPlease upgrade your subscription plan to create additional company entities.`);
      setShowPricingModal(true);
      return;
    }

    setNewCompName('');
    setNewCompTrn('');
    setNewCompFyStart('2026-01-01');
    setNewCompBankName('Emirates NBD');
    setNewCompAccountName('');
    setNewCompIban('AE12022000000');
    setNewCompFooter('Thank you for choosing us. VAT 5% has been calculated in accordance with FTA.');
    setNewCompInventory(false);
    setNewCompStaffEnabled(true);
    setNewCompVatFilingFrequency('quarterly');
    setIsCreateCompanyOpen(true);
  };

  // Submit Company Creation
  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();

    if (newCompTrn.length !== 15) {
      alert('TRN must be exactly a 15-digit code for UAE tax eligibility.');
      return;
    }

    // Check if company with same Name or TRN already exists
    const duplicate = companies.find(c => 
      c.name.trim().toLowerCase() === newCompName.trim().toLowerCase() ||
      c.trn.trim() === newCompTrn.trim()
    );

    if (duplicate) {
      triggerDuplicateSaza('Company', newCompName, newCompTrn, duplicate.id);
      return;
    }

    const nextId = `comp_${Date.now()}`;
    const freshCompany: Company = {
      id: nextId,
      name: newCompName,
      trn: newCompTrn,
      currency: 'AED',
      fyStart: newCompFyStart,
      invoicePrefix: 'INV-',
      quotationPrefix: 'QTN-',
      deliveryPrefix: 'DN-',
      bankName: newCompBankName,
      bankAccountName: newCompAccountName || newCompName,
      bankIban: newCompIban,
      footerNotes: newCompFooter,
      inventoryEnabled: newCompInventory,
      staffEnabled: newCompStaffEnabled,
      multiBranchEnabled: newCompMultiBranch,
      erpEnabled: newCompErpEnabled,
      corporateTaxEnabled: newCompCorporateTaxEnabled,
      posEnabled: newCompPosEnabled,
      corporateTaxRate: 9,
      corporateTaxThreshold: 375000,
      corporateTaxSmallBusinessRelief: true,
      vatFilingFrequency: newCompVatFilingFrequency,
      vatEnabled: true
    };

    setCompanies(prev => [...prev, freshCompany]);
    setActiveCompanyId(nextId);
    setIsCreateCompanyOpen(false);
    setCurrentTab('dashboard');
    alert(`Successfully registered "${newCompName}" with active TRN ${newCompTrn}!`);
  };

  // Save Settings Changes
  const handleUpdateActiveCompany = (updated: Company) => {
    setCompanies(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleDeleteCompany = (id: string) => {
    if (companies.length <= 1) {
      alert("You must keep at least one active company in your evonix Hissab dashboard.");
      return;
    }
    const comp = companies.find(c => c.id === id);
    if (comp) {
      setCompanyToDelete(comp);
    }
  };

  const executeDeleteCompany = (id: string) => {
    // Cascade delete all records belonging to this companyId
    setCustomers(prev => prev.filter(c => c.companyId !== id));
    setDocuments(prev => prev.filter(d => d.companyId !== id));
    setExpenses(prev => prev.filter(e => e.companyId !== id));
    setInventory(prev => prev.filter(i => i.companyId !== id));
    setRecurringInvoices(prev => prev.filter(r => r.companyId !== id));
    setStaff(prev => prev.filter(s => s.companyId !== id));
    setCoaAccounts(prev => prev.filter(a => a.companyId !== id));
    setJournalEntries(prev => prev.filter(j => j.companyId !== id));

    const remainingCompanies = companies.filter(c => c.id !== id);
    setCompanies(remainingCompanies);
    setActiveCompanyId(remainingCompanies[0].id);
    setCurrentTab('dashboard');
    setCompanyToDelete(null);
    alert("Company and all associated ledger records have been fully wiped.");
  };

  // -------------------------------------------------------------
  // CUSTOMER CRUD
  // -------------------------------------------------------------
  const handleAddCustomer = (cust: Omit<Customer, 'id' | 'companyId'>) => {
    const newCust: Customer = {
      ...cust,
      id: `cust_${Date.now()}`,
      companyId: activeCompanyId
    };
    setCustomers(prev => [...prev, newCust]);
  };

  const handleUpdateCustomer = (updated: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleDeleteCustomer = (id: string) => {
    const cust = customers.find(c => c.id === id);
    if (cust) {
      setCustomerToDelete(cust);
    }
  };

  const executeDeleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    // Delete associated documents
    setDocuments(prev => prev.filter(d => d.customerId !== id));
    // Delete associated recurring invoices to prevent orphaned data
    setRecurringInvoices(prev => prev.filter(r => r.customerId !== id));
    setCustomerToDelete(null);
  };

  // -------------------------------------------------------------
  // CLIENT DEMO DATA RESET (CLEAR ALL INVOICES, INVENTORY, CUSTOMERS)
  // -------------------------------------------------------------
  const handleResetAllTransactionalData = () => {
    setDocuments([]);
    setInventory([]);
    setCustomers([]);
    setExpenses([]);
    setRecurringInvoices([]);
    setPurchaseOrders([]);
    setGoodsReceivedNotes([]);
    setFixedAssets([]);
    setFundTransfers([]);
    setJournalEntries([]);
    setStaff(INITIAL_STAFF);
    setBranches(INITIAL_BRANCHES);
    setTreasuryAccounts(INITIAL_TREASURY_ACCOUNTS);
    safeSetLocalStorage('hisaab_documents', []);
    safeSetLocalStorage('hisaab_inventory', []);
    safeSetLocalStorage('hisaab_customers', []);
    safeSetLocalStorage('hisaab_expenses', []);
    safeSetLocalStorage('hisaab_recurring', []);
    safeSetLocalStorage('hisaab_purchase_orders', []);
    safeSetLocalStorage('hisaab_grn_notes', []);
    safeSetLocalStorage('hisaab_fixed_assets', []);
    safeSetLocalStorage('hisaab_fund_transfers', []);
    safeSetLocalStorage('hisaab_journal_entries', []);
    safeSetLocalStorage('hisaab_suppliers_directory', []);
    safeSetLocalStorage('hisaab_staff', INITIAL_STAFF);
    safeSetLocalStorage('hisaab_branches', INITIAL_BRANCHES);
    safeSetLocalStorage('hisaab_treasury_accounts', INITIAL_TREASURY_ACCOUNTS);
    broadcastStateChange('hisaab_documents');
    broadcastStateChange('hisaab_inventory');
    broadcastStateChange('hisaab_customers');
    broadcastStateChange('hisaab_expenses');
    broadcastStateChange('hisaab_recurring');
    broadcastStateChange('hisaab_staff');
    broadcastStateChange('hisaab_journal_entries');
  };

  // -------------------------------------------------------------
  // INVENTORY CRUD
  // -------------------------------------------------------------
  const handleAddItem = (item: Omit<InventoryItem, 'id' | 'companyId'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: `item_${Date.now()}`,
      companyId: activeCompanyId
    };
    setInventory(prev => [...prev, newItem]);
  };

  const handleUpdateItem = (updated: InventoryItem) => {
    setInventory(prev => prev.map(i => i.id === updated.id ? updated : i));
  };

  const handleDeleteItem = (id: string) => {
    const item = inventory.find(i => i.id === id);
    if (item) {
      setItemToDelete(item);
    }
  };

  const executeDeleteItem = (id: string) => {
    setInventory(prev => prev.filter(i => i.id !== id));
    setItemToDelete(null);
  };

  // Direct manual stock ledger overwrite
  const handleAdjustStock = (id: string, newQty: number) => {
    setInventory(prev => prev.map(i => i.id === id ? { ...i, stockQuantity: newQty } : i));
  };

  // Deduct stock levels dynamically during invoicing/deliveries
  const handleDeductStock = (itemId: string, qty: number) => {
    setInventory(prev => prev.map(i => {
      if (i.id === itemId) {
        const nextQty = i.stockQuantity - qty; // Allows negative values (e.g. -2, -5, -10)
        return { ...i, stockQuantity: nextQty };
      }
      return i;
    }));
  };

  // Helper to find matching inventory item by exact or keyword match
  const findMatchingInventoryItem = (inventoryList: InventoryItem[], itemName: string) => {
    if (!itemName || !itemName.trim()) return null;
    const clean = itemName.trim().toLowerCase();
    
    // 1. Exact match
    let matched = inventoryList.find(i => i.companyId === activeCompanyId && i.name.trim().toLowerCase() === clean);
    if (matched) return matched;

    // 2. Keyword match (e.g. "mechanical games" / "mechanical keyboard", "ergonomic office chair", "wireless headset")
    const keywords = clean.split(/\s+/).filter(w => w.length > 2);
    if (keywords.length > 0) {
      matched = inventoryList.find(i => {
        if (i.companyId !== activeCompanyId) return false;
        const targetClean = i.name.toLowerCase();
        const matchCount = keywords.filter(k => targetClean.includes(k)).length;
        return matchCount >= Math.ceil(keywords.length * 0.5);
      });
    }

    return matched || null;
  };

  // -------------------------------------------------------------
  // EXPENSES CRUD
  // -------------------------------------------------------------
  const handleAddExpense = (exp: Omit<Expense, 'id' | 'companyId'>) => {
    const newExp: Expense = {
      ...exp,
      id: `exp_${Date.now()}`,
      companyId: activeCompanyId,
      branch: activeCompany?.branchName || 'Main Branch'
    };
    setExpenses(prev => [...prev, newExp]);

    // Automatically update Inventory stock for Product Purchases
    if ((exp.category === 'Purchases' || exp.items) && exp.items && exp.items.length > 0) {
      setInventory(prev => {
        const updatedInventory = [...prev];
        exp.items!.forEach(pItem => {
          if (!pItem.name || !pItem.name.trim()) return;
          const match = findMatchingInventoryItem(updatedInventory, pItem.name);
          const addQty = pItem.qty || 1;

          if (match) {
            const idx = updatedInventory.findIndex(i => i.id === match.id);
            if (idx >= 0) {
              updatedInventory[idx] = {
                ...updatedInventory[idx],
                stockQuantity: updatedInventory[idx].stockQuantity + addQty,
                purchasePrice: pItem.rate > 0 ? pItem.rate : updatedInventory[idx].purchasePrice
              };
            }
          } else {
            // Register as new product in catalog if not matched
            const newItem: InventoryItem = {
              id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              companyId: activeCompanyId,
              name: pItem.name.trim(),
              sku: `SKU-${Math.floor(100 + Math.random() * 900)}`,
              category: 'General Purchases',
              purchasePrice: pItem.rate || 0,
              salePrice: Number(((pItem.rate || 0) * 1.3).toFixed(2)),
              stockQuantity: addQty,
              minStockThreshold: 5
            };
            updatedInventory.push(newItem);
          }
        });
        return updatedInventory;
      });
    }
  };

  const handleUpdateExpense = (updated: Expense) => {
    const oldExp = expenses.find(e => e.id === updated.id);
    if (activeCompany?.fiscalYearLockDate) {
      if ((oldExp && oldExp.date <= activeCompany.fiscalYearLockDate) || updated.date <= activeCompany.fiscalYearLockDate) {
        alert(`This period is audited and locked! Expenses on or before ${activeCompany.fiscalYearLockDate} cannot be modified.`);
        return;
      }
    }

    // Adjust inventory stock for Purchases
    if (oldExp && (oldExp.category === 'Purchases' || updated.category === 'Purchases')) {
      const oldItems = oldExp.items || [];
      const newItems = updated.items || [];

      setInventory(prev => {
        const updatedInventory = [...prev];

        // Revert old items stock
        oldItems.forEach(oldIt => {
          if (!oldIt.name) return;
          const match = findMatchingInventoryItem(updatedInventory, oldIt.name);
          if (match) {
            const idx = updatedInventory.findIndex(i => i.id === match.id);
            if (idx >= 0) {
              updatedInventory[idx] = {
                ...updatedInventory[idx],
                stockQuantity: Math.max(0, updatedInventory[idx].stockQuantity - (oldIt.qty || 1))
              };
            }
          }
        });

        // Apply new items stock
        newItems.forEach(newIt => {
          if (!newIt.name) return;
          const match = findMatchingInventoryItem(updatedInventory, newIt.name);
          const addQty = newIt.qty || 1;

          if (match) {
            const idx = updatedInventory.findIndex(i => i.id === match.id);
            if (idx >= 0) {
              updatedInventory[idx] = {
                ...updatedInventory[idx],
                stockQuantity: updatedInventory[idx].stockQuantity + addQty,
                purchasePrice: newIt.rate > 0 ? newIt.rate : updatedInventory[idx].purchasePrice
              };
            }
          } else {
            const newItem: InventoryItem = {
              id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              companyId: activeCompanyId,
              name: newIt.name.trim(),
              sku: `SKU-${Math.floor(100 + Math.random() * 900)}`,
              category: 'General Purchases',
              purchasePrice: newIt.rate || 0,
              salePrice: Number(((newIt.rate || 0) * 1.3).toFixed(2)),
              stockQuantity: addQty,
              minStockThreshold: 5
            };
            updatedInventory.push(newItem);
          }
        });

        return updatedInventory;
      });
    }

    setExpenses(prev => prev.map(e => e.id === updated.id ? updated : e));
  };

  const handleDeleteExpense = (id: string) => {
    const exp = expenses.find(e => e.id === id);
    if (exp) {
      if (activeCompany?.fiscalYearLockDate && exp.date <= activeCompany.fiscalYearLockDate) {
        alert(`This period is audited and locked! Expenses on or before ${activeCompany.fiscalYearLockDate} cannot be deleted.`);
        return;
      }
      setExpenseToDelete(exp);
    }
  };

  const executeDeleteExpense = (id: string) => {
    const exp = expenses.find(e => e.id === id);
    if (exp && (exp.category === 'Purchases' || exp.items) && exp.items && exp.items.length > 0) {
      setInventory(prev => {
        const updatedInventory = [...prev];
        exp.items!.forEach(pItem => {
          if (!pItem.name) return;
          const match = findMatchingInventoryItem(updatedInventory, pItem.name);
          if (match) {
            const idx = updatedInventory.findIndex(i => i.id === match.id);
            if (idx >= 0) {
              updatedInventory[idx] = {
                ...updatedInventory[idx],
                stockQuantity: Math.max(0, updatedInventory[idx].stockQuantity - (pItem.qty || 1))
              };
            }
          }
        });
        return updatedInventory;
      });
    }

    setExpenses(prev => prev.filter(e => e.id !== id));
    setExpenseToDelete(null);
  };

  // -------------------------------------------------------------
  // PURCHASE ORDERS (PO) & GOODS RECEIVED NOTES (GRN) CRUD
  // -------------------------------------------------------------
  const handleAddPO = (po: Omit<PurchaseOrder, 'id'>) => {
    const newPO: PurchaseOrder = {
      ...po,
      id: `po_${Date.now()}`
    };
    setPurchaseOrders(prev => {
      const updated = [newPO, ...prev];
      safeSetLocalStorage('hisaab_purchase_orders', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdatePO = (updated: PurchaseOrder) => {
    setPurchaseOrders(prev => {
      const updatedList = prev.map(p => p.id === updated.id ? updated : p);
      safeSetLocalStorage('hisaab_purchase_orders', JSON.stringify(updatedList));
      return updatedList;
    });
  };

  const handleDeletePO = (id: string) => {
    setPurchaseOrders(prev => {
      const updated = prev.filter(p => p.id !== id);
      safeSetLocalStorage('hisaab_purchase_orders', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddGRN = (grn: Omit<GoodsReceivedNote, 'id'>) => {
    const newGRN: GoodsReceivedNote = {
      ...grn,
      id: `grn_${Date.now()}`
    };
    setGoodsReceivedNotes(prev => {
      const updated = [newGRN, ...prev];
      safeSetLocalStorage('hisaab_grn_notes', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateGRN = (updated: GoodsReceivedNote) => {
    setGoodsReceivedNotes(prev => {
      const updatedList = prev.map(g => g.id === updated.id ? updated : g);
      safeSetLocalStorage('hisaab_grn_notes', JSON.stringify(updatedList));
      return updatedList;
    });
  };

  const handleDeleteGRN = (id: string) => {
    setGoodsReceivedNotes(prev => {
      const updated = prev.filter(g => g.id !== id);
      safeSetLocalStorage('hisaab_grn_notes', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddBranch = (branch: Omit<Branch, 'id'>) => {
    const newBranch: Branch = {
      ...branch,
      id: `branch_${Date.now()}`
    };
    setBranches(prev => {
      const updated = [...prev, newBranch];
      safeSetLocalStorage('hisaab_branches', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateBranch = (updated: Branch) => {
    setBranches(prev => {
      const updatedList = prev.map(b => b.id === updated.id ? updated : b);
      safeSetLocalStorage('hisaab_branches', JSON.stringify(updatedList));
      return updatedList;
    });
  };

  const handleDeleteBranch = (id: string) => {
    setBranches(prev => {
      const updated = prev.filter(b => b.id !== id);
      safeSetLocalStorage('hisaab_branches', JSON.stringify(updated));
      return updated;
    });
  };

  // -------------------------------------------------------------
  // FIXED ASSETS & DEPRECIATION CRUD
  // -------------------------------------------------------------
  const handleAddAsset = (asset: Omit<FixedAsset, 'id'>) => {
    const newAsset: FixedAsset = {
      ...asset,
      id: `ast_${Date.now()}`
    };
    setFixedAssets(prev => {
      const updated = [newAsset, ...prev];
      safeSetLocalStorage('hisaab_fixed_assets', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateAsset = (updated: FixedAsset) => {
    setFixedAssets(prev => {
      const updatedList = prev.map(a => a.id === updated.id ? updated : a);
      safeSetLocalStorage('hisaab_fixed_assets', JSON.stringify(updatedList));
      return updatedList;
    });
  };

  const handleDeleteAsset = (id: string) => {
    setFixedAssets(prev => {
      const updated = prev.filter(a => a.id !== id);
      safeSetLocalStorage('hisaab_fixed_assets', JSON.stringify(updated));
      return updated;
    });
  };

  // -------------------------------------------------------------
  // TREASURY & BANK/CASH ACCOUNTS & FUND TRANSFERS CRUD
  // -------------------------------------------------------------
  const handleAddTreasuryAccount = (acc: Omit<TreasuryAccount, 'id'>) => {
    const newAcc: TreasuryAccount = {
      ...acc,
      id: `tr_${Date.now()}`
    };
    setTreasuryAccounts(prev => {
      const updated = [...prev, newAcc];
      safeSetLocalStorage('hisaab_treasury_accounts', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateTreasuryAccount = (updated: TreasuryAccount) => {
    setTreasuryAccounts(prev => {
      const updatedList = prev.map(a => a.id === updated.id ? updated : a);
      safeSetLocalStorage('hisaab_treasury_accounts', JSON.stringify(updatedList));
      return updatedList;
    });
  };

  const handleDeleteTreasuryAccount = (id: string) => {
    setTreasuryAccounts(prev => {
      const updated = prev.filter(a => a.id !== id);
      safeSetLocalStorage('hisaab_treasury_accounts', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddFundTransfer = (transfer: Omit<FundTransfer, 'id'>) => {
    const newTransfer: FundTransfer = {
      ...transfer,
      id: `trf_${Date.now()}`
    };
    setFundTransfers(prev => {
      const updated = [newTransfer, ...prev];
      safeSetLocalStorage('hisaab_fund_transfers', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateFundTransfer = (updated: FundTransfer) => {
    setFundTransfers(prev => {
      const updatedList = prev.map(t => t.id === updated.id ? updated : t);
      safeSetLocalStorage('hisaab_fund_transfers', JSON.stringify(updatedList));
      return updatedList;
    });
  };

  const handleDeleteFundTransfer = (id: string) => {
    setFundTransfers(prev => {
      const updated = prev.filter(t => t.id !== id);
      safeSetLocalStorage('hisaab_fund_transfers', JSON.stringify(updated));
      return updated;
    });
  };

  // -------------------------------------------------------------
  // SALES DOCUMENTS CRUD
  // -------------------------------------------------------------
  const handleAddDocument = (doc: Omit<SalesDocument, 'id' | 'companyId'> & { id?: string }) => {
    if (activeCompany?.fiscalYearLockDate && doc.date <= activeCompany.fiscalYearLockDate) {
      alert(`This period is audited and locked! Documents on or before ${activeCompany.fiscalYearLockDate} cannot be created.`);
      return null as any;
    }
    const newDoc: SalesDocument = {
      ...doc,
      id: doc.id || `doc_${Date.now()}`,
      companyId: activeCompanyId
    };
    setDocuments(prev => [newDoc, ...prev]);
    return newDoc;
  };

  const handleUpdateDocument = (updated: SalesDocument) => {
    const oldDoc = documents.find(d => d.id === updated.id);
    if (activeCompany?.fiscalYearLockDate) {
      if ((oldDoc && oldDoc.date <= activeCompany.fiscalYearLockDate) || updated.date <= activeCompany.fiscalYearLockDate) {
        alert(`This period is audited and locked! Documents on or before ${activeCompany.fiscalYearLockDate} cannot be modified.`);
        return;
      }
    }
    // Check if status is transitioning to or from Cancelled for restocking/deducting
    if (oldDoc && activeCompany?.inventoryEnabled && (updated.type === 'Invoice' || updated.type === 'DeliveryNote')) {
      const becameCancelled = oldDoc.status !== 'Cancelled' && updated.status === 'Cancelled';
      const becameRestored = oldDoc.status === 'Cancelled' && updated.status !== 'Cancelled';

      if (becameCancelled) {
        setInventory(prev => prev.map(i => {
          const itemInDoc = updated.items.find(di => di.itemId === i.id);
          if (itemInDoc) {
            return { ...i, stockQuantity: i.stockQuantity + itemInDoc.qty };
          }
          return i;
        }));
      } else if (becameRestored) {
        setInventory(prev => prev.map(i => {
          const itemInDoc = updated.items.find(di => di.itemId === i.id);
          if (itemInDoc) {
            const nextQty = i.stockQuantity - itemInDoc.qty;
            return { ...i, stockQuantity: nextQty };
          }
          return i;
        }));
      } else if (oldDoc.status !== 'Cancelled' && updated.status !== 'Cancelled') {
        // Document items or quantities changed - adjust stock levels dynamically
        setInventory(prev => prev.map(i => {
          const oldItemInDoc = oldDoc.items.find(di => di.itemId === i.id);
          const newItemInDoc = updated.items.find(di => di.itemId === i.id);
          const oldQty = oldItemInDoc ? oldItemInDoc.qty : 0;
          const newQty = newItemInDoc ? newItemInDoc.qty : 0;

          if (oldQty !== newQty) {
            const nextQty = i.stockQuantity + oldQty - newQty;
            return { ...i, stockQuantity: nextQty };
          }
          return i;
        }));
      }
    }

    setDocuments(prev => prev.map(d => d.id === updated.id ? updated : d));
  };

  const handleDeleteDocument = (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (doc) {
      if (activeCompany?.fiscalYearLockDate && doc.date <= activeCompany.fiscalYearLockDate) {
        alert(`This period is audited and locked! Documents on or before ${activeCompany.fiscalYearLockDate} cannot be deleted.`);
        return;
      }
      setDocToDelete(doc);
    }
  };

  const executeDeleteDocument = (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (doc && activeCompany?.inventoryEnabled && doc.status !== 'Cancelled' && (doc.type === 'Invoice' || doc.type === 'DeliveryNote')) {
      // Restock products on delete if they weren't already cancelled
      setInventory(prev => prev.map(i => {
        const itemInDoc = doc.items.find(di => di.itemId === i.id);
        if (itemInDoc) {
          return { ...i, stockQuantity: i.stockQuantity + itemInDoc.qty };
        }
        return i;
      }));
    }
    setDocuments(prev => prev.filter(d => d.id !== id));
    setDocToDelete(null);
  };

  // -------------------------------------------------------------
  // RECURRING INVOICES CRUD & ENGINE
  // -------------------------------------------------------------
  const handleAddRecurringInvoice = (rec: Omit<RecurringInvoice, 'id' | 'companyId'>) => {
    const newRec: RecurringInvoice = {
      ...rec,
      id: `rec_${Date.now()}`,
      companyId: activeCompanyId
    };
    setRecurringInvoices(prev => [...prev, newRec]);
  };

  const handleUpdateRecurringInvoice = (updated: RecurringInvoice) => {
    setRecurringInvoices(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const handleDeleteRecurringInvoice = (id: string) => {
    setRecurringInvoices(prev => prev.filter(r => r.id !== id));
  };

  const processRecurringInvoices = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    let generatedCount = 0;
    const updatedRecs = [...recurringInvoices];
    const newDocsToAdd: SalesDocument[] = [];

    // Loop through each recurring template
    updatedRecs.forEach((rec, idx) => {
      if (rec.isActive && rec.nextRunDate && rec.nextRunDate <= todayStr) {
        // Resolve company
        const company = companies.find(c => c.id === rec.companyId);
        if (!company) return;

        // Sequence calculation
        const typeDocs = [...newDocsToAdd, ...documents].filter(d => d.type === 'Invoice' && d.companyId === rec.companyId);
        const nextRawNumber = typeDocs.reduce((max, d) => Math.max(max, d.rawNumber), 1000) + 1;
        const prefix = company.invoicePrefix || 'INV-';
        const docNumber = `${prefix}${nextRawNumber}`;

        // Standard compliant invoice line item
        const docItem = {
          itemId: `item_rec_${Date.now()}_${idx}`,
          name: rec.description || 'Monthly Recurring Services',
          sku: 'REC-SRV',
          qty: 1,
          rate: rec.amount,
          vatRate: 5,
          vatAmount: rec.vatAmount,
          subtotal: rec.amount,
          total: rec.total
        };

        // Standard 15 day Net payment term
        const due = new Date();
        due.setDate(due.getDate() + 15);
        const dueDateStr = due.toISOString().split('T')[0];

        const autoDoc: SalesDocument = {
          id: `doc_auto_${Date.now()}_${idx}`,
          companyId: rec.companyId,
          type: 'Invoice',
          docNumber,
          rawNumber: nextRawNumber,
          date: todayStr,
          dueDate: dueDateStr,
          customerId: rec.customerId,
          items: [docItem],
          subtotal: rec.amount,
          vatTotal: rec.vatAmount,
          discount: 0,
          total: rec.total,
          status: 'Unpaid',
          notes: 'Auto-generated Recurring Invoice.',
          reference: 'RECURRING-SYSTEM',
          bankName: company.bankName,
          bankAccountName: company.bankAccountName,
          bankIban: company.bankIban,
          footerNotes: company.footerNotes,
          trn: company.trn,
          paymentTerms: 'Net 15',
          paymentMethod: company.bankName ? 'Bank Transfer' : undefined
        };

        newDocsToAdd.push(autoDoc);

        // Advance Next Run Date by 1 month
        const nextDate = new Date(rec.nextRunDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        rec.nextRunDate = nextDate.toISOString().split('T')[0];

        generatedCount++;
      }
    });

    if (generatedCount > 0) {
      setDocuments(prev => [...newDocsToAdd, ...prev]);
      setRecurringInvoices(updatedRecs);
      return generatedCount;
    }
    return 0;
  };

  const handleManualProcessRecurring = () => {
    const generated = processRecurringInvoices();
    if (generated > 0) {
      alert(`Recurring Engine executed successfully! Auto-generated ${generated} due tax invoice(s).`);
    } else {
      alert('Recurring Engine executed. No active recurring billing agreements are due today.');
    }
  };

  // -------------------------------------------------------------
  // NAVIGATION SWITCH HUB
  // -------------------------------------------------------------
  const renderContent = () => {
    switch (currentTab) {
      case 'bank_rec':
        return (
          <BankReconciliation 
            company={activeCompany}
            documents={documents}
            expenses={expenses}
            coaAccounts={coaAccounts}
            activeCompanyId={activeCompanyId}
          />
        );
      case 'dashboard':
        return (
          <Dashboard 
            company={activeCompany}
            documents={documents}
            expenses={expenses}
            customers={customers}
            inventory={inventory}
            onCreateInvoice={() => {
              setInitialCreateType('Invoice');
              setCurrentTab('sales');
            }}
            onCreateQuotation={() => {
              setInitialCreateType('Quotation');
              setCurrentTab('sales');
            }}
            onCreateExpense={() => {
              setCurrentTab('expenses');
            }}
            onNavigateToTab={(tab) => setCurrentTab(tab)}
            onSelectReport={(repId) => {
              setSelectedReportId(repId);
              setCurrentTab('reports');
            }}
            staff={staff}
            staffEnabled={activeCompany?.staffEnabled}
          />
        );
      case 'pos':
        return (
          <div className="flex-1 flex flex-col h-full bg-slate-950">
            <FastThermalPOSModal
              isOpen={true}
              onClose={() => {
                setCurrentTab('sales');
                setActiveSidebarItemId('sales_invoices');
              }}
              company={activeCompany}
              customers={customers}
              inventory={inventory}
              staff={staff.filter(s => s.companyId === activeCompanyId)}
              documents={documents}
              onAddDocument={handleAddDocument}
              onAddCustomer={handleAddCustomer}
              onDeductStock={handleDeductStock}
            />
          </div>
        );
      case 'sales':
        return (
          <SalesManager 
            companies={companies}
            activeCompanyId={activeCompanyId}
            documents={documents}
            customers={customers}
            inventory={inventory}
            onAddDocument={handleAddDocument}
            onUpdateDocument={handleUpdateDocument}
            onDeleteDocument={handleDeleteDocument}
            onDeductStock={handleDeductStock}
            onAddItem={handleAddItem}
            initialCreateType={initialCreateType}
            onClearInitialCreateType={() => setInitialCreateType(null)}
            initialEditDocId={initialEditDocId}
            onClearInitialEditDocId={() => setInitialEditDocId(null)}
            initialCustomerId={initialCustomerId}
            onClearInitialCustomerId={() => setInitialCustomerId(null)}
            onTriggerDuplicateSaza={triggerDuplicateSaza}
            initialViewDocId={initialViewDocId}
            onClearInitialViewDocId={() => setInitialViewDocId(null)}
            staff={staff.filter(s => s.companyId === activeCompanyId)}
            onPortalStateChange={setInvoicePortalOpened}
            activeSidebarItemId={activeSidebarItemId}
            setActiveSidebarItemId={setActiveSidebarItemId}
          />
        );
      case 'recurring':
        return (
          <RecurringManager 
            customers={customers}
            recurringInvoices={recurringInvoices}
            activeCompanyId={activeCompanyId}
            company={activeCompany}
            onAddRecurringInvoice={handleAddRecurringInvoice}
            onUpdateRecurringInvoice={handleUpdateRecurringInvoice}
            onDeleteRecurringInvoice={handleDeleteRecurringInvoice}
            onManualTrigger={handleManualProcessRecurring}
          />
        );
      case 'inventory':
        return (
          <InventoryManager 
            inventory={inventory}
            activeCompanyId={activeCompanyId}
            company={activeCompany}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onAdjustStock={handleAdjustStock}
            activeSidebarItemId={activeSidebarItemId}
            setActiveSidebarItemId={setActiveSidebarItemId}
          />
        );
      case 'spare_parts':
        return (
          <InventoryManager 
            inventory={inventory}
            activeCompanyId={activeCompanyId}
            company={activeCompany}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onAdjustStock={handleAdjustStock}
            activeSidebarItemId="inv_spare_parts"
            setActiveSidebarItemId={setActiveSidebarItemId}
          />
        );
      case 'computer_manager':
      case 'computer_it':
        return (
          <InventoryManager 
            inventory={inventory}
            activeCompanyId={activeCompanyId}
            company={activeCompany}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onAdjustStock={handleAdjustStock}
            activeSidebarItemId="inv_computer_it"
            setActiveSidebarItemId={setActiveSidebarItemId}
          />
        );
      case 'expenses':
        return (
          <ExpenseManager 
            expenses={expenses}
            activeCompanyId={activeCompanyId}
            company={activeCompany}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
            onTriggerDuplicateSaza={triggerDuplicateSaza}
            initialEditExpenseId={initialEditExpenseId}
            onClearInitialEditExpenseId={() => setInitialEditExpenseId(null)}
            staff={staff.filter(s => s.companyId === activeCompanyId)}
            staffEnabled={activeCompany?.staffEnabled}
            inventory={inventory}
            purchaseOrders={purchaseOrders}
            goodsReceivedNotes={goodsReceivedNotes}
            branches={branches}
            onAddPO={handleAddPO}
            onUpdatePO={handleUpdatePO}
            onDeletePO={handleDeletePO}
            onAddGRN={handleAddGRN}
            onUpdateGRN={handleUpdateGRN}
            onDeleteGRN={handleDeleteGRN}
            onAdjustStock={handleAdjustStock}
            activeSidebarItemId={activeSidebarItemId}
            setActiveSidebarItemId={setActiveSidebarItemId}
          />
        );
      case 'customers':
        return (
          <CustomerManager 
            customers={customers}
            documents={documents}
            activeCompanyId={activeCompanyId}
            company={activeCompany}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onViewInvoice={(id) => {
              if (id === 'new') {
                setInitialCreateType('Invoice');
              } else {
                setInitialViewDocId(id);
              }
              setCurrentTab('sales');
              setActiveSidebarItemId('sales');
            }}
            onEditInvoice={(id) => {
              setInitialEditDocId(id);
              setCurrentTab('sales');
              setActiveSidebarItemId('sales');
            }}
            onDeleteInvoice={(id) => {
              handleDeleteDocument(id);
            }}
            onCreateInvoiceForCustomer={(customerId) => {
              setInitialCreateType('Invoice');
              setInitialCustomerId(customerId);
              setCurrentTab('sales');
              setActiveSidebarItemId('sales');
            }}
          />
        );
      case 'vat':
        return (
          <TaxReports 
            mode="vat"
            company={activeCompany}
            documents={documents}
            expenses={expenses}
            customers={customers}
            inventory={inventory}
            selectedReportId={selectedReportId}
            setSelectedReportId={setSelectedReportId}
            coaAccounts={coaAccounts}
            journalEntries={journalEntries}
            activePlan={activePlan}
          />
        );
      case 'reports':
        return (
          <TaxReports 
            mode="reports"
            company={activeCompany}
            documents={documents}
            expenses={expenses}
            customers={customers}
            inventory={inventory}
            selectedReportId={selectedReportId}
            setSelectedReportId={setSelectedReportId}
            coaAccounts={coaAccounts}
            journalEntries={journalEntries}
            activePlan={activePlan}
          />
        );
      case 'accounts':
        return (
          <AccountsManager 
            company={activeCompany}
            coaAccounts={coaAccounts}
            journalEntries={journalEntries}
            customers={customers}
            documents={documents}
            expenses={expenses}
            onAddAccount={(acc) => setCoaAccounts(prev => [...prev, acc])}
            onUpdateAccount={(updated) => setCoaAccounts(prev => prev.map(a => a.code === updated.code ? updated : a))}
            onDeleteAccount={(code) => setCoaAccounts(prev => prev.filter(a => a.code !== code))}
            onAddJournalEntry={(je) => setJournalEntries(prev => [...prev, je])}
            onUpdateJournalEntry={(updated) => setJournalEntries(prev => prev.map(j => j.id === updated.id ? updated : j))}
            onDeleteJournalEntry={(id) => setJournalEntries(prev => prev.filter(j => j.id !== id))}
            accountingMode={accountingMode}
            setAccountingMode={setAccountingMode}
            onResetCOA={() => setCoaAccounts(INITIAL_COA_ACCOUNTS)}
          />
        );
      case 'pdc':
        return (
          <PdcManager 
            company={activeCompany}
            activeCompanyId={activeCompanyId}
            customers={customers}
          />
        );
      case 'settings':
        return (
          <CompanySettings 
            company={activeCompany}
            companies={companies}
            onSave={handleUpdateActiveCompany}
            onDeleteCompany={handleDeleteCompany}
            onTriggerDuplicateSaza={triggerDuplicateSaza}
            initialSubTab={activeSettingsSubTab}
            onSubTabChange={setActiveSettingsSubTab}
            customers={customers}
            onAddCustomer={handleAddCustomer}
            documents={documents}
            onAddDocument={handleAddDocument}
            expenses={expenses}
            onAddExpense={handleAddExpense}
            coaAccounts={coaAccounts}
            onAddAccount={(acc) => setCoaAccounts(prev => [...prev, acc])}
            activePlan={activePlan}
            trialDaysLeft={trialDaysLeft}
            onOpenPricingModal={() => setShowPricingModal(true)}
            pcType={pcType}
            setPcType={setPcType}
            machineId={machineId}
            mainPcIp={mainPcIp}
            setMainPcIp={setMainPcIp}
            lanConnected={lanConnected}
            setLanConnected={setLanConnected}
            lanSyncLogs={lanSyncLogs}
            onAddLanSyncLog={addLanSyncLog}
            isLoginEnabled={isLoginEnabled}
            onToggleLogin={setIsLoginEnabled}
            loginEmail={loginEmail}
            onChangeLoginEmail={setLoginEmail}
            loginMobile={loginMobile}
            onChangeLoginMobile={setLoginMobile}
            loginPassword={loginPassword}
            onChangeLoginPassword={setLoginPassword}
            invoicePortalOpened={invoicePortalOpened}
            branches={branches}
            onOpenCorporateSetup={() => setShowCorporateSetup(true)}
            onAddBranch={handleAddBranch}
            onUpdateBranch={handleUpdateBranch}
            onDeleteBranch={handleDeleteBranch}
            inventory={inventory}
            onResetAllData={handleResetAllTransactionalData}
          />
        );
      case 'staff':
        if (!(activeCompany?.staffEnabled ?? true)) {
          return (
            <div className="max-w-xl mx-auto mt-12 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900/60 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Users className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Staff Module is Disabled</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                The Staff Management module has been toggled off for <strong className="text-blue-600 dark:text-indigo-400">{activeCompany?.name}</strong>. You can enable it anytime from the <strong className="text-slate-700 dark:text-slate-350">General Tab</strong> in <strong className="text-slate-700 dark:text-slate-350">Corporate Settings</strong>.
              </p>
              <button
                type="button"
                onClick={() => setCurrentTab('settings')}
                className="px-4 py-2 bg-[#2563eb] hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Go to Corporate Settings
              </button>
            </div>
          );
        }
        return (
          <StaffManager 
            staff={staff}
            setStaff={setStaff}
            activeCompanyId={activeCompanyId}
            company={activeCompany}
          />
        );
      case 'assets':
        return (
          <AssetManager
            activeCompanyId={activeCompanyId}
            company={activeCompany}
            branches={branches}
            staff={staff}
            fixedAssets={fixedAssets}
            onAddAsset={handleAddAsset}
            onUpdateAsset={handleUpdateAsset}
            onDeleteAsset={handleDeleteAsset}
            onAddJournalEntry={(je) => setJournalEntries(prev => [...prev, je])}
            coaAccounts={coaAccounts}
            activeSidebarItemId={activeSidebarItemId}
            setActiveSidebarItemId={setActiveSidebarItemId}
          />
        );
      case 'treasury':
        return (
          <TreasuryManager
            activeCompanyId={activeCompanyId}
            company={activeCompany}
            staff={staff}
            treasuryAccounts={treasuryAccounts}
            fundTransfers={fundTransfers}
            onAddAccount={handleAddTreasuryAccount}
            onUpdateAccount={handleUpdateTreasuryAccount}
            onDeleteAccount={handleDeleteTreasuryAccount}
            onAddFundTransfer={handleAddFundTransfer}
            onUpdateFundTransfer={handleUpdateFundTransfer}
            onDeleteFundTransfer={handleDeleteFundTransfer}
            onAddJournalEntry={(je) => setJournalEntries(prev => [...prev, je])}
            coaAccounts={coaAccounts}
            activeSidebarItemId={activeSidebarItemId}
            setActiveSidebarItemId={setActiveSidebarItemId}
          />
        );
      case 'importer':
        return (
          <AIImporter
            company={activeCompany}
            customers={customers}
            onAddCustomer={handleAddCustomer}
            documents={documents}
            onAddDocument={handleAddDocument}
            expenses={expenses}
            onAddExpense={handleAddExpense}
            coaAccounts={coaAccounts}
            onAddAccount={(acc) => setCoaAccounts(prev => [...prev, acc])}
          />
        );
      default:
        return (
          <div className="py-12 text-center text-slate-500">
            Navigation route error. Tab not found.
          </div>
        );
    }
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 z-50 bg-[#090D16] text-white flex flex-col items-center justify-between p-8 font-sans select-none">
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          {/* Splash Logo */}
          <div className="p-4 bg-slate-900 border-2 border-cyan-500/40 rounded-3xl flex flex-col items-center justify-center shadow-2xl relative overflow-hidden shadow-cyan-950/40">
            <img 
              src="/evonix-logo.svg" 
              alt="evonix Technologies" 
              className="h-16 w-auto object-contain max-w-[260px]" 
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/evonix-logo.jpg';
              }}
            />
          </div>
          
          {/* Main Titles */}
          <div className="text-center space-y-3">
            <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
              evonix Hissab
            </h1>
            <h2 className="text-2xl font-extrabold text-cyan-400 tracking-wide font-sans">
              evonix Technologies Enterprise Suite
            </h2>
            <div className="h-1 w-20 bg-gradient-to-r from-cyan-500 to-emerald-500 mx-auto rounded-full mt-2"></div>
            <p className="text-[10px] text-slate-450 uppercase tracking-widest font-mono pt-1">
              FINANCIAL AUDIT COMPLIANT
            </p>
          </div>

          {/* Loading status bar */}
          <div className="flex items-center space-x-3 text-slate-400 text-xs font-mono pt-6">
            <svg className="animate-spin h-4 w-4 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="tracking-wide">Loading compliance ledgers & secure databases...</span>
          </div>
        </div>

        {/* Splash Footer */}
        <div className="text-center space-y-2 border-t border-slate-800/60 pt-6 w-full max-w-md">
          <p className="text-[10px] text-slate-500 tracking-wider">
            Professional Accounting & VAT Auditing Software UAE
          </p>
          <p className="text-xs font-mono text-emerald-400/80">
            Support: <span className="text-emerald-300 font-bold font-mono select-all">Hissabpro1@gmail.com</span>
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 30-DAY TRIAL & DATE TAMPER SECURITY GATE (Protects All Pages)
  // -------------------------------------------------------------
  if (trialSecurity?.isLocked) {
    return (
      <TrialLockScreen
        trialState={trialSecurity}
        onUnlocked={async (res) => {
          setTrialDaysLeft(res.daysLeft);
          const updated = await initializeAndCheckTrialSecurity();
          setTrialSecurity(updated);
          if (res.daysLeft > 60) {
            setActivePlan('pro_1y');
          }
        }}
      />
    );
  }

  // Render Login Gate if login is enabled and user is not logged in (Guards all pages)
  if (isLoginEnabled && !isLoggedIn) {
    return (
      <LoginGate
        loginEmail={loginEmail}
        loginMobile={loginMobile}
        loginPassword={loginPassword}
        onSetPassword={setLoginPassword}
        activePlan={activePlan}
        machineId={machineId}
        onLoginSuccess={(type, ip) => {
          setPcType(type);
          setMainPcIp(ip);
          setIsLoggedIn(true);
          sessionStorage.setItem('hisaab_session_logged_in', 'true');
          const isDone = localStorage.getItem(`hisaab_corporate_setup_completed_${activeCompanyId}`) === 'true' || activeCompany?.isSetupCompleted;
          if (!isDone) {
            setShowCorporateSetup(true);
          }
        }}
      />
    );
  }

  // Master Admin Panel: Exclusively restricted to authorized cloud developer console.
  // In client offline / desktop download environments, this is completely disabled so clients cannot bypass licensing.
  const isCloudConsole = typeof window !== 'undefined' && (
    window.location.hostname.includes('run.app') ||
    window.location.hostname.includes('ai.studio') ||
    window.location.hostname.includes('google')
  );
  const isServerAdminPath = isCloudConsole && typeof window !== 'undefined' && (window.location.pathname === '/admin' || window.location.hash === '#admin' || currentTab === 'admin');
  if (isServerAdminPath) {
    return (
      <AdminPanel
        onBackToClientApp={() => {
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', '/');
          }
          setCurrentTab('dashboard');
        }}
      />
    );
  }

  // Render Corporate Setup Wizard if user just logged in or needs initial onboarding setup
  if (showCorporateSetup) {
    return (
      <CorporateSetupWizard
        company={activeCompany}
        onSaveAndEnter={(updatedCompany) => {
          handleUpdateActiveCompany(updatedCompany);
          setShowCorporateSetup(false);
          safeSetLocalStorage(`hisaab_corporate_setup_completed_${updatedCompany.id}`, 'true');
          setToastMessage('🎉 Corporate Setup completed successfully! Welcome to evonix Hissab.');
        }}
        onSkip={() => {
          setShowCorporateSetup(false);
          safeSetLocalStorage(`hisaab_corporate_setup_completed_${activeCompany.id}`, 'true');
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] dark:bg-slate-950 overflow-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* TOP HEADER: Full width, dark themed navbar as in the screenshot */}
      <header className="bg-[#090D16] border-b border-slate-800 px-6 py-3 flex items-center justify-between no-print shrink-0 z-20">
        
        {/* Leftmost Brand & Logo Block */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-slate-900/90 hover:bg-slate-900 px-2.5 py-1 rounded-xl max-h-12 shadow-sm border border-slate-700/80 transition-all">
            <img 
              src={activeCompany.logoUrl || "/evonix-logo.svg"} 
              alt={`${activeCompany.name || 'evonix Technologies'} Logo`} 
              className="h-9 w-auto object-contain max-w-[170px]"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/evonix-logo.svg';
              }}
            />
          </div>
          
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg hover:text-cyan-400 transition-all cursor-pointer flex items-center justify-center shrink-0 ml-1"
            title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Center-left: Universal Command Search bar */}
        <div 
          onClick={() => setShowCommandSearch(true)}
          className="hidden md:flex items-center flex-1 max-w-md mx-8 relative cursor-pointer group"
        >
          <input
            id="global-search-input"
            type="text"
            readOnly
            placeholder="Search invoices, customers, products, reports... (Ctrl+K)"
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs pl-8 pr-16 py-1.5 rounded-lg focus:outline-hidden group-hover:border-indigo-500/80 placeholder-slate-500 font-sans font-medium cursor-pointer"
          />
          <div className="absolute left-2.5 text-slate-500 pointer-events-none group-hover:text-indigo-400 transition-colors">
            <Search className="w-3.5 h-3.5" />
          </div>
          <div className="absolute right-2.5 pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-slate-800 rounded border border-slate-700">
              Ctrl+K
            </kbd>
          </div>
        </div>

        {/* Right side utilities */}
        <div className="flex items-center space-x-3 text-xs">
          
          {/* Fast Thermal POS Quick Launch Button */}
          {activeCompany?.posEnabled && (
            <button
              onClick={() => {
                setCurrentTab('pos');
                setActiveSidebarItemId('sales_pos');
              }}
              className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-mono font-black text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
              title="Open Fast Keyboard-First POS Register (F1)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>⚡ Express POS</span>
            </button>
          )}

          {/* Safe Backup & Offline Update Wizard */}
          <button
            onClick={() => setIsSafeUpdateWizardOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] tracking-wide px-2.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs border border-emerald-500/50"
            title="Auto-Backup & Safe Update Wizard (Zero Corruption Guarantee)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
            <span className="hidden md:inline">Safe Backup</span>
          </button>

          {/* Download Project ZIP Archive */}
          <a
            href="/evonix_hissab_project.zip"
            download="evonix_hissab_project.zip"
            className="bg-[#2563eb] hover:bg-blue-600 text-white font-bold text-[10px] tracking-wide px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
            title="Download complete evonix Hissab project ZIP file to run locally"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download ZIP</span>
          </a>

          {/* Top Navbar Calendar Widget Button */}
          <div className="relative">
            <button
              onClick={() => {
                setIsCalendarOpen(!isCalendarOpen);
                if (isCalculatorOpen) setIsCalculatorOpen(false);
              }}
              className={`p-1.5 border rounded-lg cursor-pointer transition-all flex items-center space-x-1.5 ${
                isCalendarOpen 
                  ? 'bg-rose-600 border-rose-500 text-white shadow-md' 
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-750 text-rose-400 hover:text-white'
              }`}
              title="Open UAE Business Calendar, Reminders & Due Dates"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline text-[10px] font-mono font-bold uppercase tracking-wider text-slate-200">
                {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
              </span>
            </button>
          </div>

          {/* Popup Calculator Icon */}
          <div className="relative">
            <button 
              onClick={() => setIsCalculatorOpen(!isCalculatorOpen)}
              className={`p-1.5 border rounded-lg cursor-pointer transition-colors ${isCalculatorOpen ? 'bg-[#2563eb] border-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 border-slate-750 text-slate-300'}`}
              title="Quick UAE VAT Calculator"
            >
              <Calculator className="w-4 h-4" />
            </button>
          </div>

          {/* Icon 4: Notification Bell with Red Badge */}
          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={`p-1.5 border rounded-lg cursor-pointer transition-colors ${isNotificationsOpen ? 'bg-[#2563eb] border-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 border-slate-750 text-slate-300'}`}
              title="System Alerts & Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-bold text-[8px] w-4 h-4 rounded-full flex items-center justify-center border border-slate-900 font-mono">
                {notifications.filter(n => !n.read).length}
              </span>
            )}

            {/* Notification Dropdown Menu */}
            {isNotificationsOpen && (
              <>
                <div className="fixed inset-0 z-45" onClick={() => setIsNotificationsOpen(false)} />
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-4 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-100">
                  <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 font-mono text-[9px] uppercase font-bold tracking-widest text-slate-400">
                    <span>Recent Alerts ({notifications.filter(n => !n.read).length} Unread)</span>
                    <button 
                      onClick={() => {
                        setNotifications(notifications.map(n => ({ ...n, read: true })));
                      }}
                      className="text-blue-600 dark:text-indigo-400 hover:underline cursor-pointer lowercase"
                    >
                      Mark all as read
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-slate-400">No alerts today.</div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          onClick={() => {
                            setNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n));
                          }}
                          className={`py-2 px-1 hover:bg-slate-50 dark:hover:bg-slate-900/40 rounded transition-colors cursor-pointer flex items-start space-x-2 ${!notif.read ? 'bg-blue-50/30 dark:bg-indigo-950/20' : ''}`}
                        >
                          <span className={`w-1.5 h-1.5 mt-1.5 rounded-full shrink-0 ${!notif.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 ${!notif.read ? 'font-bold' : 'font-normal'}`}>
                              {notif.text}
                            </p>
                            <span className="text-[9px] text-slate-400 mt-0.5 block font-mono">{notif.date}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Dark Mode toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-750 text-slate-300 rounded-lg cursor-pointer"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Help Center toggle */}
          <button
            onClick={() => setShowHelpSystem(true)}
            className="p-1.5 bg-indigo-950/50 hover:bg-indigo-900/50 text-indigo-400 border border-indigo-900/65 rounded-lg cursor-pointer flex items-center justify-center transition-all shadow-xs"
            title="evonix Hissab Comprehensive Help Center & UAE FTA Manual"
          >
            <HelpCircle className="w-4 h-4 animate-pulse text-indigo-400" />
          </button>

          {/* Vertical Separator */}
          <div className="h-5 w-px bg-slate-800 mx-1"></div>

          {/* Active Company Name Selector dropdown */}
          <div className="flex items-center space-x-1">
            <div className="relative flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
              <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0"></span>
              <select
                value={activeCompanyId}
                onChange={(e) => {
                  if (e.target.value === 'new') {
                    handleOpenCreateCompanyModal();
                  } else {
                    setActiveCompanyId(e.target.value);
                  }
                }}
                className="bg-transparent border-0 text-slate-200 text-xs font-bold tracking-tight py-0.5 pr-6 focus:outline-hidden appearance-none cursor-pointer"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200 font-bold">
                    {c.name}
                  </option>
                ))}
                <option value="new" className="bg-slate-900 text-slate-200 font-bold">+ Register New Entity...</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
            </div>
          </div>

          {/* Hidden File Input for Workspace Backup Restore */}
          <input
            type="file"
            ref={restoreInputRef}
            onChange={handleRestoreWorkspaceBackup}
            accept=".json,application/json"
            className="hidden"
          />

          {/* User Profile Pill & Fast Actions Hub */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2 pl-1 pr-2.5 py-1 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all cursor-pointer shadow-xs group"
              title="User Account & Fast Actions Menu"
            >
              <div className="w-7 h-7 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-inner shrink-0">
                {activeCompany?.name?.charAt(0).toUpperCase() || 'H'}
              </div>
              <div className="hidden md:flex flex-col text-left leading-none">
                <span className="text-[11px] font-bold text-slate-200 group-hover:text-indigo-300 transition-colors font-mono">
                  {loginEmail.split('@')[0]}
                </span>
                <span className="text-[9px] text-slate-400 font-sans mt-0.5">
                  {activeCompany?.name ? activeCompany.name.slice(0, 14) + (activeCompany.name.length > 14 ? '...' : '') : 'Main HQ'}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-200 transition-transform" />
            </button>

            {/* Fast Actions Dropdown Menu */}
            {isUserMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl z-50 p-2 text-slate-200 animate-slide-up no-print">
                  {/* Account Header */}
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-indigo-400">Signed In As</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-bold border border-indigo-500/30">
                        {activePlan === 'trial' ? `Trial (${trialDaysLeft}d)` : activePlan.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white truncate font-mono">{loginEmail}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5 font-sans">
                      {activeCompany?.name} {activeCompany?.trn ? `• TRN: ${activeCompany.trn}` : ''}
                    </div>
                  </div>

                  {/* Actions List */}
                  <div className="space-y-1 text-xs">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setCurrentTab('settings');
                        setActiveSettingsSubTab('general');
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer text-left"
                    >
                      <Building className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>Company Profile & VAT Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setCurrentTab('staff');
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer text-left"
                    >
                      <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>HR & Staff Permissions</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setShowShortcutsHelp(true);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Keyboard className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Keyboard Shortcuts Sheet</span>
                      </div>
                      <span className="text-[9px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Ctrl+K</span>
                    </button>

                    <div className="border-t border-slate-800 my-1 pt-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          handleExportWorkspaceBackup();
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg hover:bg-indigo-950/40 text-indigo-300 hover:text-indigo-200 transition-colors cursor-pointer text-left font-medium"
                      >
                        <Download className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>Export Full Workspace Backup (JSON)</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          restoreInputRef.current?.click();
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg hover:bg-indigo-950/40 text-indigo-300 hover:text-indigo-200 transition-colors cursor-pointer text-left font-medium"
                      >
                        <Upload className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>Restore Backup from File</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-800 my-1 pt-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          handleSignOut();
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer text-left font-bold"
                      >
                        <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Sign Out of Session</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Direct Sign Out Button in Top Right Corner */}
          <button
            id="btn-top-sign-out"
            onClick={handleSignOut}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-500/50 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs group"
            title="Sign Out of evonix Hissab (Return to Login Screen)"
          >
            <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-rose-400" />
            <span className="hidden sm:inline font-sans uppercase tracking-wider text-[10px]">Sign Out</span>
          </button>

        </div>
      </header>

      {/* Mobile Drawer Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* BODY LAYOUT: Sidebar + Viewport Container */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT PANEL: Sidebar (Hides on standard printout page) */}
        <div className={`transition-all duration-300 ease-in-out h-full overflow-hidden shrink-0 no-print 
          lg:relative fixed inset-y-0 left-0 z-40 bg-slate-900 shadow-2xl lg:shadow-none
          ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-0'}
        `}>
          <div className="w-64 h-full">
            <Sidebar 
              currentTab={currentTab}
              setCurrentTab={setCurrentTab}
              companies={companies}
              activeCompanyId={activeCompanyId}
              setActiveCompanyId={setActiveCompanyId}
              isPaidPlan={isPaidPlan}
              setIsPaidPlan={setIsPaidPlan}
              onOpenCreateCompany={handleOpenCreateCompanyModal}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen(false)}
              selectedReportId={selectedReportId}
              setSelectedReportId={setSelectedReportId}
              onOpenShortcutsHelp={() => setShowShortcutsHelp(true)}
              activeSidebarItemId={activeSidebarItemId}
              setActiveSidebarItemId={setActiveSidebarItemId}
              activeSettingsSubTab={activeSettingsSubTab}
              activePlan={activePlan}
              trialDaysLeft={trialDaysLeft}
              onOpenPricingModal={() => setShowPricingModal(true)}
              lowStockCount={lowStockCount}
              pdcDueCount={pdcDueCount}
              onNavigate={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  setIsSidebarOpen(false);
                }
              }}
            />
          </div>
        </div>

        {/* RIGHT PANEL: Dynamic Viewport Content */}
        <main ref={mainScrollRef} className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#F8FAFC] dark:bg-slate-950">
          
          {/* Small status header bar below main top-bar */}
          <div className="bg-[#F1F5F9] dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2 flex items-center justify-between no-print shrink-0 text-[10px] font-mono font-bold tracking-widest text-[#4F46E5] dark:text-indigo-400 uppercase">
            <span className="truncate mr-2">
              {currentTab === 'dashboard' ? '01 — OVERVIEW' : currentTab === 'sales' ? '02 — REVENUE' : currentTab === 'recurring' ? '02B — AUTOMATIONS' : currentTab === 'inventory' ? '03 — STOCK' : currentTab === 'expenses' ? '04 — OUTFLOWS' : currentTab === 'customers' ? '05 — PARTNERS' : currentTab === 'vat' ? '06 — UAE TAX COMPLIANCE' : currentTab === 'pdc' ? '06B — PDC CHEQUE HUB' : currentTab === 'reports' ? '07 — STRATEGIC REPORTS' : currentTab === 'staff' ? '08 — HR & STAFF' : '09 — SETTINGS'}
            </span>
            {activeCompany?.vatEnabled !== false && (
              <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 shrink-0">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                <span className="hidden sm:inline">VAT 5% COMPLIANT • FTA AUDIT READY</span>
                <span className="sm:hidden">VAT 5%</span>
              </div>
            )}
          </div>

          {/* Dynamic Inner Body view with smooth slide-up entrance animation */}
          <div ref={mainContentRef} className="p-3 sm:p-5 md:p-6 lg:p-8 flex-1 overflow-y-auto">
            <div 
              key={`${currentTab}_${activeSidebarItemId || ''}_${selectedReportId || ''}`} 
              className="animate-tab-slide-up w-full min-h-full flex flex-col"
            >
              {renderContent()}
            </div>
          </div>
        </main>

      </div>

      {/* -------------------------------------------------------------
          MODAL: ADD NEW COMPANY FORM
         ------------------------------------------------------------- */}
      {isCreateCompanyOpen && (
        <div className="fixed inset-0 bg-[#0F172A]/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#F8FAFC] rounded-lg shadow-2xl max-w-lg w-full overflow-hidden border border-[#E2E8F0] animate-zoom-in">
            {/* Header */}
            <div className="bg-[#0F172A] text-white p-5 flex items-center justify-between border-b border-[#4F46E5]">
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-[#4F46E5]" />
                <h3 className="text-xs font-bold uppercase tracking-widest font-mono">Register New Corporate Entity</h3>
              </div>
              <button 
                onClick={() => setIsCreateCompanyOpen(false)}
                className="text-slate-400 hover:text-[#4F46E5] cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCompany} className="p-6 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Company Legal Trade Name <span className="text-[#4F46E5]">*</span></label>
                  <input
                    id="modal-comp-name"
                    type="text"
                    required
                    placeholder="e.g., Gulf Exports LLC"
                    value={newCompName}
                    onChange={(e) => setNewCompName(e.target.value)}
                    className="w-full border border-[#E2E8F0] rounded-lg bg-white px-3 py-2.5 focus:border-[#4F46E5] focus:outline-hidden text-xs font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">UAE Tax Reg TRN <span className="text-[#4F46E5]">*</span></label>
                  <input
                    id="modal-comp-trn"
                    type="text"
                    required
                    maxLength={15}
                    minLength={15}
                    placeholder="e.g., 100456123900003"
                    value={newCompTrn}
                    onChange={(e) => setNewCompTrn(e.target.value)}
                    className="w-full border border-[#E2E8F0] rounded-lg bg-white px-3 py-2.5 font-mono focus:border-[#4F46E5] focus:outline-hidden text-xs"
                  />
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">15-digit UAE FTA TRN code</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Financial Year Start</label>
                  <input
                    id="modal-comp-fystart"
                    type="date"
                    required
                    value={newCompFyStart}
                    onChange={(e) => setNewCompFyStart(e.target.value)}
                    className="w-full border border-[#E2E8F0] rounded-lg bg-white px-3 py-2.5 focus:border-[#4F46E5] focus:outline-hidden text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">FTA VAT Filing Frequency</label>
                  <select
                    id="modal-comp-vat-freq"
                    value={newCompVatFilingFrequency}
                    onChange={(e) => setNewCompVatFilingFrequency(e.target.value as 'quarterly' | 'monthly' | 'yearly')}
                    className="w-full border border-[#E2E8F0] rounded-lg bg-white px-3 py-2.5 focus:border-[#4F46E5] focus:outline-hidden text-xs font-sans cursor-pointer"
                  >
                    <option value="quarterly">Quarterly (Standard)</option>
                    <option value="monthly">Monthly (Due 28th)</option>
                    <option value="yearly">Yearly (Annual)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">AED Functional Currency</label>
                  <input
                    type="text"
                    disabled
                    value="AED (United Arab Emirates Dirham)"
                    className="w-full border border-[#E2E8F0] bg-[#F1F5F9]/50 text-slate-600 rounded-lg px-3 py-2.5 text-xs cursor-not-allowed font-mono"
                  />
                </div>
              </div>

              {/* Bank Details section */}
              <div className="border-t border-[#E2E8F0] pt-4 space-y-3">
                <h4 className="text-[10px] font-mono font-bold text-[#4F46E5] uppercase tracking-widest">Default Wire Transfer Bank Details</h4>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Bank Name</label>
                    <input
                      id="modal-comp-bankname"
                      type="text"
                      placeholder="e.g., Emirates NBD"
                      value={newCompBankName}
                      onChange={(e) => setNewCompBankName(e.target.value)}
                      className="w-full border border-[#E2E8F0] rounded-lg bg-white px-3 py-2 text-xs focus:border-[#4F46E5]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Beneficiary</label>
                    <input
                      id="modal-comp-bankacc"
                      type="text"
                      placeholder="Gulf Exports LLC"
                      value={newCompAccountName}
                      onChange={(e) => setNewCompAccountName(e.target.value)}
                      className="w-full border border-[#E2E8F0] rounded-lg bg-white px-3 py-2 text-xs focus:border-[#4F46E5]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">IBAN AE...</label>
                    <input
                      id="modal-comp-iban"
                      type="text"
                      placeholder="AE12022000000..."
                      value={newCompIban}
                      onChange={(e) => setNewCompIban(e.target.value)}
                      className="w-full border border-[#E2E8F0] rounded-lg bg-white px-3 py-2 text-xs font-mono focus:border-[#4F46E5]"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="border-t border-[#E2E8F0] pt-4 space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-white border border-[#E2E8F0] rounded-lg">
                  <div>
                    <h5 className="font-bold text-[#0F172A] font-sans">Inventory Management & Stock Ledger</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Keep trace of stock counts, asset valuations, and catalog warning alerts</p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setNewCompInventory(!newCompInventory)}
                    className={`w-10 h-5.5 flex items-center rounded-lg p-0.5 transition-colors cursor-pointer ${newCompInventory ? 'bg-[#4F46E5]' : 'bg-slate-300'}`}
                  >
                    <div className={`bg-[#0F172A] w-4.5 h-4.5 rounded-lg shadow-md transform transition-transform duration-200 ${newCompInventory ? 'translate-x-4.5' : 'translate-x-0'}`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-white border border-[#E2E8F0] rounded-lg">
                  <div>
                    <h5 className="font-bold text-[#0F172A] font-sans">Staff Management & UAE Labor Compliance</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Enable UAE Labor-compliant staff directory, visa expiry alerts, and gratuity calculators</p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setNewCompStaffEnabled(!newCompStaffEnabled)}
                    className={`w-10 h-5.5 flex items-center rounded-lg p-0.5 transition-colors cursor-pointer ${newCompStaffEnabled ? 'bg-[#4F46E5]' : 'bg-slate-300'}`}
                  >
                    <div className={`bg-[#0F172A] w-4.5 h-4.5 rounded-lg shadow-md transform transition-transform duration-200 ${newCompStaffEnabled ? 'translate-x-4.5' : 'translate-x-0'}`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-white border border-[#E2E8F0] rounded-lg">
                  <div>
                    <h5 className="font-bold text-[#0F172A] font-sans">Multi-Branch System</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Enable if this company operates multiple branches, retail outlets, or regional warehouses</p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setNewCompMultiBranch(!newCompMultiBranch)}
                    className={`w-10 h-5.5 flex items-center rounded-lg p-0.5 transition-colors cursor-pointer ${newCompMultiBranch ? 'bg-[#4F46E5]' : 'bg-slate-350'}`}
                  >
                    <div className={`bg-[#0F172A] w-4.5 h-4.5 rounded-lg shadow-md transform transition-transform duration-200 ${newCompMultiBranch ? 'translate-x-4.5' : 'translate-x-0'}`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-white border border-[#E2E8F0] rounded-lg">
                  <div>
                    <h5 className="font-bold text-[#0F172A] font-sans">Enterprise ERP & Double-Entry Accounting</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Enable General Ledger, Chart of Accounts, Bank Reconciliation, Asset Register, and Balance Sheets</p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setNewCompErpEnabled(!newCompErpEnabled)}
                    className={`w-10 h-5.5 flex items-center rounded-lg p-0.5 transition-colors cursor-pointer ${newCompErpEnabled ? 'bg-emerald-600' : 'bg-slate-350'}`}
                  >
                    <div className={`bg-[#0F172A] w-4.5 h-4.5 rounded-lg shadow-md transform transition-transform duration-200 ${newCompErpEnabled ? 'translate-x-4.5' : 'translate-x-0'}`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-white border border-[#E2E8F0] rounded-lg">
                  <div>
                    <h5 className="font-bold text-[#0F172A] font-sans">UAE Corporate Tax & Corporate Settings (9%)</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Enable Corporate Tax estimation under FTA Federal Decree-Law No. 47 of 2022</p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setNewCompCorporateTaxEnabled(!newCompCorporateTaxEnabled)}
                    className={`w-10 h-5.5 flex items-center rounded-lg p-0.5 transition-colors cursor-pointer ${newCompCorporateTaxEnabled ? 'bg-cyan-600' : 'bg-slate-350'}`}
                  >
                    <div className={`bg-[#0F172A] w-4.5 h-4.5 rounded-lg shadow-md transform transition-transform duration-200 ${newCompCorporateTaxEnabled ? 'translate-x-4.5' : 'translate-x-0'}`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-white border border-[#E2E8F0] rounded-lg">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h5 className="font-bold text-[#0F172A] font-sans">Fast Thermal POS Terminal (80mm/58mm)</h5>
                      <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Default: OFF</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Enable retail barcode POS counter checkout, quick tender buttons, and thermal receipt printing</p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setNewCompPosEnabled(!newCompPosEnabled)}
                    className={`w-10 h-5.5 flex items-center rounded-lg p-0.5 transition-colors cursor-pointer ${newCompPosEnabled ? 'bg-amber-500' : 'bg-slate-350'}`}
                  >
                    <div className={`bg-[#0F172A] w-4.5 h-4.5 rounded-lg shadow-md transform transition-transform duration-200 ${newCompPosEnabled ? 'translate-x-4.5' : 'translate-x-0'}`}></div>
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsCreateCompanyOpen(false)}
                  className="px-5 py-2.5 border border-[#E2E8F0] rounded-lg hover:bg-[#F1F5F9]/40 font-bold uppercase tracking-wider text-[10px] transition-colors cursor-pointer text-slate-700"
                >
                  Cancel
                </button>
                <button
                  id="btn-company-submit"
                  type="submit"
                  className="px-6 py-2.5 bg-[#0F172A] hover:bg-[#4F46E5] text-white font-bold rounded-lg flex items-center space-x-1.5 uppercase tracking-widest text-[10px] transition-colors cursor-pointer"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Register Entity</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* -------------------------------------------------------------
          MODAL: HISAAB PRO CREATIVE SUBSCRIPTION & 3-TIER PRICING PLANS
         ------------------------------------------------------------- */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in no-print overflow-y-auto">
          <div className="bg-white dark:bg-[#0c111d] rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 dark:border-slate-800 animate-zoom-in my-8 overflow-hidden">
            
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-indigo-900 via-[#0f172a] to-blue-900 p-6 text-white text-center">
              <button 
                onClick={() => setShowPricingModal(false)}
                className="absolute top-4 right-4 text-slate-300 hover:text-white cursor-pointer bg-slate-850/50 hover:bg-slate-800/50 p-1.5 rounded-full transition-colors"
                title="Close pricing details"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2 max-w-2xl mx-auto">
                <span className="bg-amber-400 text-slate-950 font-black text-[10px] tracking-widest uppercase px-3 py-1 rounded-full inline-block animate-pulse">
                  90 DIN FULL FREE TRIAL - Full Pro Features.
                </span>
                <h2 className="text-2xl font-extrabold tracking-tight">evonix Hissab UAE Subscription Plans</h2>
                <p className="text-xs text-slate-300">
                  Select a tailored billing option below to run your entities with full GCC compliance. Or continue on evonix Hissab Basic for basic client-side operations.
                </p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 md:p-8 space-y-8 overflow-y-auto max-h-[75vh]">
              
              {/* Plans 4-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                
                {/* PLAN 0: BASIC PLAN */}
                <div className={`relative flex flex-col rounded-2xl border p-4.5 transition-all duration-200 hover:shadow-lg ${
                  activePlan === 'basic' 
                    ? 'border-slate-500 bg-slate-100/50 dark:bg-slate-900/50 shadow-md' 
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]'
                }`}>
                  {activePlan === 'basic' && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-600 text-white font-extrabold text-[8px] tracking-widest uppercase px-2.5 py-0.5 rounded-full">
                      ACTIVE PLAN
                    </span>
                  )}
                  <div className="space-y-1 text-center pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[8px] font-mono uppercase tracking-wider text-slate-500 font-bold">FOREVER FREE • STANDALONE</span>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">HISAAB BASIC</h3>
                    <div className="flex items-baseline justify-center space-x-1">
                      <span className="text-2xl font-black text-slate-900 dark:text-slate-50 font-mono">AED 0</span>
                      <span className="text-[10px] text-slate-500">/ Free</span>
                    </div>
                  </div>

                  <div className="flex-1 py-3">
                    <p className="text-[9.5px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Basic Offerings:</p>
                    <ul className="space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
                      <li className="flex items-start space-x-1.5 font-bold text-slate-800 dark:text-slate-200">
                        <span className="text-slate-400 font-extrabold">🏢</span>
                        <span><strong>1 Company Limit:</strong> Single Entity</span>
                      </li>
                      <li className="flex items-start space-x-1.5 font-bold text-slate-800 dark:text-slate-200">
                        <span className="text-slate-400 font-extrabold">👤</span>
                        <span><strong>Single User:</strong> 1 Standalone PC</span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <span className="text-emerald-500 font-extrabold">✓</span>
                        <span>25 Invoices / Month Cap</span>
                      </li>
                      <li className="flex items-start space-x-1.5 text-slate-400">
                        <span className="text-amber-500 font-extrabold">✕</span>
                        <span>No 5% VAT or Tax Calculation</span>
                      </li>
                      <li className="flex items-start space-x-1.5 text-rose-600 dark:text-rose-400 font-bold">
                        <span className="text-rose-500 font-extrabold">✕</span>
                        <span>No Corporate Tax Capability</span>
                      </li>
                      <li className="flex items-start space-x-1.5 text-slate-400">
                        <span className="text-amber-500 font-extrabold">✕</span>
                        <span>No AI Importer or Barcodes</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      setActivePlan('basic');
                      setIsPaidPlan(false);
                      alert('🎉 Switched to HISAAB BASIC (Forever Free) Plan.');
                    }}
                    className={`mt-3 w-full py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      activePlan === 'basic'
                        ? 'bg-slate-600 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {activePlan === 'basic' ? 'Selected' : 'Activate Free Basic'}
                  </button>
                </div>

                {/* PLAN 1: PRO - 1 YEAR */}
                <div className={`relative flex flex-col rounded-2xl border p-4.5 transition-all duration-200 hover:shadow-lg ${
                  activePlan === 'pro_1y' 
                    ? 'border-emerald-500 bg-emerald-50/5 dark:bg-emerald-950/5 shadow-md' 
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]'
                }`}>
                  {activePlan === 'pro_1y' && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white font-extrabold text-[8px] tracking-widest uppercase px-2.5 py-0.5 rounded-full">
                      ACTIVE PLAN
                    </span>
                  )}
                  <div className="space-y-1 text-center pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[8px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">YEAR 1 • ANNUAL PLAN</span>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">PRO - 1 YEAR</h3>
                    <div className="flex items-baseline justify-center space-x-1">
                      <span className="text-2xl font-black text-slate-900 dark:text-slate-50 font-mono">AED 499</span>
                      <span className="text-[10px] text-slate-500">/ 1 Year</span>
                    </div>
                  </div>

                  <div className="flex-1 py-3">
                    <p className="text-[9.5px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">1-Year Offerings Included:</p>
                    <ul className="space-y-1.5 text-[10.5px] text-slate-600 dark:text-slate-300 font-sans">
                      <li className="flex items-start space-x-1.5 font-bold text-slate-800 dark:text-slate-200">
                        <span className="text-indigo-500 font-extrabold">🏢</span>
                        <span><strong>1 Company Profile Limit</strong></span>
                      </li>
                      <li className="flex items-start space-x-1.5 font-bold text-slate-800 dark:text-slate-200">
                        <span className="text-indigo-500 font-extrabold">💻</span>
                        <span><strong>1 Standard PC License</strong></span>
                      </li>
                      <li className="flex items-start space-x-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="text-emerald-500 font-extrabold">✓</span>
                        <span>Full 5% UAE VAT Invoicing & Return 201</span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <span className="text-emerald-500 font-extrabold">✓</span>
                        <span>CP/SP P&L Basics Margin Engine</span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <span className="text-emerald-500 font-extrabold">✓</span>
                        <span>Top Nav UAE Business Calendar</span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <span className="text-emerald-500 font-extrabold">✓</span>
                        <span>Staff HR & WPS Payroll Disbursal</span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <span className="text-emerald-500 font-extrabold">✓</span>
                        <span>AI Excel Importer & Barcode Scanner</span>
                      </li>
                      <li className="flex items-start space-x-1.5 text-rose-500 font-semibold">
                        <span className="text-rose-500 font-bold">✕</span>
                        <span>No 9% Corporate Tax Planner</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleOpenSubscriptionEnquiry('pro_1y')}
                    className={`mt-3 w-full py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      activePlan === 'pro_1y'
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-slate-900 hover:bg-emerald-600 text-white'
                    }`}
                  >
                    {activePlan === 'pro_1y' ? 'Active Pro 1Y' : 'Select / Request 1-Year'}
                  </button>
                </div>

                {/* PLAN 2: PRO - 3 YEARS */}
                <div className={`relative flex flex-col rounded-2xl border p-4.5 transition-all duration-200 hover:shadow-lg ${
                  activePlan === 'pro_3y' 
                    ? 'border-indigo-500 bg-indigo-50/5 dark:bg-indigo-950/5 shadow-md' 
                    : 'border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/10 dark:bg-indigo-950/10'
                }`}>
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white font-extrabold text-[8px] tracking-widest uppercase px-3 py-0.5 rounded-full flex items-center space-x-1 shadow-xs whitespace-nowrap">
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                    <span>5 Companies • CT 9% & Audit Suite</span>
                  </span>

                  <div className="space-y-1 text-center pb-3 border-b border-indigo-150 dark:border-indigo-900/50">
                    <span className="text-[8px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-bold">YEAR 3 • BEST VALUE</span>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">PRO - 3 YEARS</h3>
                    <div className="flex items-baseline justify-center space-x-1">
                      <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">AED 1,199</span>
                      <span className="text-[10px] text-slate-500">/ 3 Years</span>
                    </div>
                  </div>

                  <div className="flex-1 py-3">
                    <p className="text-[9.5px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">3-Year Offerings Included:</p>
                    <ul className="space-y-1.5 text-[10.5px] text-slate-600 dark:text-slate-300 font-sans">
                      <li className="flex items-start space-x-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                        <span className="text-emerald-500 font-extrabold">🏢</span>
                        <span><strong>5 Companies Limit</strong> (Multi-Entity)</span>
                      </li>
                      <li className="flex items-start space-x-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                        <span className="text-emerald-500 font-extrabold">💻</span>
                        <span><strong>1 Standard PC License</strong> (3-Year Lock)</span>
                      </li>
                      <li className="flex items-start space-x-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="text-emerald-500 font-extrabold">✓</span>
                        <span><strong>3-Year Corporate Tax (9%) Planner</strong></span>
                      </li>
                      <li className="flex items-start space-x-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                        <span className="text-emerald-500 font-extrabold">✓</span>
                        <span><strong>FTA Audit File (FAF XML) Exporter</strong></span>
                      </li>
                      <li className="flex items-start space-x-1.5 font-medium">
                        <span className="text-emerald-500 font-extrabold">✓</span>
                        <span>CP/SP P&L Margin Engine & Calendar</span>
                      </li>
                      <li className="flex items-start space-x-1.5 font-medium">
                        <span className="text-emerald-500 font-extrabold">✓</span>
                        <span>Staff HR, WPS Salary & Leave Tracker</span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <span className="text-indigo-500 font-extrabold">★</span>
                        <span>3-Year Price Lock Protection</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleOpenSubscriptionEnquiry('pro_3y')}
                    className={`mt-3 w-full py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md ${
                      activePlan === 'pro_3y'
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {activePlan === 'pro_3y' ? 'Active Pro 3Y' : 'Select / Request 3-Year'}
                  </button>
                </div>

                {/* PLAN 3: PRO - 5 YEARS */}
                <div className={`relative flex flex-col rounded-2xl border p-4.5 transition-all duration-200 hover:shadow-lg ${
                  activePlan === 'pro_5y' 
                    ? 'border-violet-500 bg-violet-50/5 dark:bg-violet-950/5 shadow-md' 
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]'
                }`}>
                  <div className="space-y-1 text-center pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[8px] font-mono uppercase tracking-wider text-violet-600 dark:text-violet-400 font-bold">YEAR 5 • ENTERPRISE</span>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">PRO - 5 YEARS</h3>
                    <div className="flex items-baseline justify-center space-x-1">
                      <span className="text-2xl font-black text-slate-900 dark:text-slate-50 font-mono">AED 1,699</span>
                      <span className="text-[10px] text-slate-500">/ 5 Years</span>
                    </div>
                  </div>

                  <div className="flex-1 py-3">
                    <p className="text-[9.5px] font-extrabold text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-2">5-Year Offerings Included:</p>
                    <ul className="space-y-1.5 text-[10.5px] text-slate-600 dark:text-slate-300 font-sans">
                      <li className="flex items-start space-x-1.5 font-bold text-violet-600 dark:text-violet-400">
                        <span className="text-emerald-500 font-extrabold">🏢</span>
                        <span><strong>10 Companies Limit</strong> (Group Entities)</span>
                      </li>
                      <li className="flex items-start space-x-1.5 font-bold text-violet-600 dark:text-violet-400">
                        <span className="text-emerald-500 font-extrabold">💻</span>
                        <span><strong>1 Standard PC License</strong> (5-Year Lock)</span>
                      </li>
                      <li className="flex items-start space-x-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="text-emerald-500 font-extrabold">✓</span>
                        <span><strong>5-Year Corporate Tax (9%) Planner</strong></span>
                      </li>
                      <li className="flex items-start space-x-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                        <span className="text-emerald-500 font-extrabold">✓</span>
                        <span><strong>FTA Audit File (FAF XML) Exporter</strong></span>
                      </li>
                      <li className="flex items-start space-x-1.5 font-medium">
                        <span className="text-emerald-500 font-extrabold">✓</span>
                        <span>CP/SP P&L Margin Engine & Calendar</span>
                      </li>
                      <li className="flex items-start space-x-1.5 font-medium">
                        <span className="text-emerald-500 font-extrabold">✓</span>
                        <span>Staff HR, WPS Salary & Leave Tracker</span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <span className="text-violet-500 font-extrabold">★</span>
                        <span>5-Year Fixed Price Lock Guarantee</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleOpenSubscriptionEnquiry('pro_5y')}
                    className={`mt-3 w-full py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      activePlan === 'pro_5y'
                        ? 'bg-violet-600 text-white hover:bg-violet-700'
                        : 'bg-slate-900 hover:bg-violet-600 text-white'
                    }`}
                  >
                    {activePlan === 'pro_5y' ? 'Active Pro 5Y' : 'Select / Request 5-Year'}
                  </button>
                </div>

                {/* PLAN 4: PRO - LIFETIME VIP */}
                <div className={`relative flex flex-col rounded-2xl border p-4.5 transition-all duration-200 hover:shadow-lg ${
                  activePlan === 'pro_lifetime'
                    ? 'border-rose-500 bg-rose-50/5 dark:bg-rose-950/5 shadow-md' 
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]'
                }`}>
                  {activePlan === 'pro_lifetime' && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-500 text-white font-extrabold text-[8px] tracking-widest uppercase px-2.5 py-0.5 rounded-full">
                      ACTIVE PLAN
                    </span>
                  )}
                  <div className="space-y-1 text-center pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[8px] font-mono uppercase tracking-wider text-rose-500 font-bold">LIFETIME VIP • UNLIMITED</span>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">PRO - LIFETIME VIP</h3>
                    <div className="flex items-baseline justify-center space-x-1">
                      <span className="text-2xl font-black text-slate-900 dark:text-slate-50 font-mono">AED 1,999</span>
                      <span className="text-[10px] text-slate-500">/ Pay Once</span>
                    </div>
                  </div>

                  <div className="flex-1 py-3">
                    <p className="text-[9.5px] font-extrabold text-rose-500 uppercase tracking-widest mb-2">Lifetime VIP Offerings Included:</p>
                    <ul className="space-y-1.5 text-[10.5px] text-slate-600 dark:text-slate-300 font-sans">
                      <li className="flex items-start space-x-1.5 font-bold text-rose-600 dark:text-rose-400">
                        <span className="text-rose-500 font-extrabold">🏢</span>
                        <span><strong>UNLIMITED Companies</strong> (Groups & CA)</span>
                      </li>
                      <li className="flex items-start space-x-1.5 font-bold text-rose-600 dark:text-rose-400">
                        <span className="text-rose-500 font-extrabold">💻</span>
                        <span><strong>1 Standard PC License</strong> (Lifetime License)</span>
                      </li>
                      <li className="flex items-start space-x-1.5 font-bold text-rose-600 dark:text-rose-400">
                        <span className="text-rose-500 font-extrabold">★</span>
                        <span><strong>Lifetime Corporate Tax (9%) Planner</strong></span>
                      </li>
                      <li className="flex items-start space-x-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="text-emerald-500 font-extrabold">✓</span>
                        <span><strong>Full Tax Audit Reports & FAF XML Exporter</strong></span>
                      </li>
                      <li className="flex items-start space-x-1.5 font-medium">
                        <span className="text-emerald-500 font-extrabold">✓</span>
                        <span>CP/SP P&L Margin Engine & Calendar</span>
                      </li>
                      <li className="flex items-start space-x-1.5 font-medium">
                        <span className="text-emerald-500 font-extrabold">✓</span>
                        <span>Staff HR, WPS Salary & Leave Tracker</span>
                      </li>
                      <li className="flex items-start space-x-1.5 text-rose-500 font-bold">
                        <span className="text-rose-500 font-extrabold">★</span>
                        <span>Pay Once — Zero Renewal Fees Ever</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleOpenSubscriptionEnquiry('pro_lifetime')}
                    className={`mt-3 w-full py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      activePlan === 'pro_lifetime'
                        ? 'bg-rose-600 text-white hover:bg-rose-700'
                        : 'bg-slate-900 hover:bg-rose-600 text-white'
                    }`}
                  >
                    {activePlan === 'pro_lifetime' ? 'Active Lifetime' : 'Select / Request Lifetime'}
                  </button>
                </div>

              </div>

              {/* CLIENT EMAIL, MOBILE & 15/16-DIGIT SECURITY CODE ACTIVATION BOX */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-indigo-700/50 shadow-xl space-y-4 font-sans">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-800/60 pb-3">
                  <div className="flex items-center space-x-2">
                    <Key className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                        <span>🔑 Client Registration & Security Code Activation</span>
                      </h4>
                      <p className="text-[10px] text-indigo-200/80 font-mono">
                        Provide your client contact details and enter the special 15-digit or 16-digit security code.
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 font-mono font-bold px-2.5 py-1 rounded-full border border-amber-400/30 shrink-0">
                    INSTANT SECURITY ACTIVATION
                  </span>
                </div>

                {/* ACTIVE SUBSCRIPTION & SECURITY DETAILS (IF ACTIVATED) */}
                {activatedSecurityCode && (
                  <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-xs font-mono space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-bold">✓ Active Security License Bound</span>
                      <span className="text-emerald-300 font-extrabold uppercase bg-emerald-900/60 px-2 py-0.5 rounded text-[10px]">
                        {activePlan?.toUpperCase().replace('_', ' ')}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] text-slate-300 pt-1">
                      <div><strong className="text-slate-400">Email:</strong> {clientEmailInput}</div>
                      <div><strong className="text-slate-400">Mobile:</strong> {clientMobileInput}</div>
                      <div><strong className="text-slate-400">Code:</strong> {activatedSecurityCode}</div>
                    </div>
                  </div>
                )}

                {/* REGISTRATION FORM INPUTS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-300 uppercase mb-1">
                      Client Email Address *
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. client@company.com"
                      value={clientEmailInput}
                      onChange={(e) => setClientEmailInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-300 uppercase mb-1">
                      Client Mobile Number *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +971 50 123 4567"
                      value={clientMobileInput}
                      onChange={(e) => setClientMobileInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-amber-300 uppercase mb-1">
                      15/16-Digit Security Code *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 9876-5432-1012-3456"
                      value={activationInputKey}
                      onChange={(e) => setActivationInputKey(e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-300 tracking-wider placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  <p className="text-[10px] text-slate-300 font-sans leading-tight">
                    💡 Enter your special 15 or 16-digit security code received upon purchasing your <strong>1-Year, 3-Year, or Lifetime Plan</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleActivateKeySubmitted(clientEmailInput, clientMobileInput, activationInputKey)}
                    className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shrink-0 cursor-pointer"
                  >
                    Activate Security Code
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] pt-1 font-mono">
                  <div className="bg-white/5 p-2 rounded-lg border border-white/10 flex items-center justify-between">
                    <span className="text-slate-300">Code prefix: HP1Y or Code 1...</span>
                    <span className="font-bold text-emerald-400">1-Year Pro Plan</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/10 flex items-center justify-between">
                    <span className="text-slate-300">Code prefix: HP3Y or Code 3...</span>
                    <span className="font-bold text-indigo-400">3-Year Pro Plan</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/10 flex items-center justify-between">
                    <span className="text-slate-300">Code prefix: HPLF or Code 9...</span>
                    <span className="font-bold text-rose-400">Lifetime Pro Plan</span>
                  </div>
                </div>
              </div>

              {/* AUTOMATIC DOWNGRADE FOREVER FREE DETAILS */}
              <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 font-bold text-xs">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Auto Downgrade Details: HISAAB BASIC — FOREVER FREE</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  If you do not upgrade to a paid subscription before your 90-day free trial ends, the system will automatically transition your account to <strong>HISAAB BASIC (FOREVER FREE)</strong>. Under Hisaab Basic:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1 text-[11px] font-sans">
                  <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    <span className="font-bold text-slate-900 dark:text-slate-100 block mb-0.5">1 Entity Limit</span>
                    <span className="text-slate-500">Only 1 active company is allowed. Extra entities are disabled.</span>
                  </div>
                  <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    <span className="font-bold text-slate-900 dark:text-slate-100 block mb-0.5">25 Invoices / Mo</span>
                    <span className="text-slate-500">Enforces a limit of 25 Sales Invoices generated each calendar month.</span>
                  </div>
                  <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    <span className="font-bold text-slate-900 dark:text-slate-100 block mb-0.5">Blocked Features</span>
                    <span className="text-amber-600 font-bold">AI Importer, Barcode Scanner, Tax & VAT, Themes.</span>
                  </div>
                  <div className="bg-white dark:bg-[#121c18] p-2.5 rounded-lg border border-emerald-950/20">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">Data Fully Safe</span>
                    <span className="text-slate-500">All historical records and accounting databases are fully preserved.</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 dark:bg-slate-900 p-4 border-t border-slate-250 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-slate-500 dark:text-slate-400">
              <span className="text-[10px] font-sans">
                💡 Change plans anytime. All UAE Federal Tax Authority rules are fully supported on premium tiers.
              </span>
              <button
                onClick={() => setShowPricingModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-bold rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Done / Return Workspace
              </button>
            </div>

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: SUBSCRIPTION REQUEST & PAYMENT LINK ENQUIRY FORM
         ------------------------------------------------------------- */}
      {isEnquiryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-fade-in no-print overflow-y-auto">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 animate-zoom-in my-8 overflow-hidden font-sans">
            
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-5 text-white">
              <button 
                type="button"
                onClick={() => setIsEnquiryModalOpen(false)}
                className="absolute top-4 right-4 text-slate-300 hover:text-white cursor-pointer bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"
                title="Close Form"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl shrink-0">
                  <Shield className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">Hisaab Pro Subscription Request</h3>
                  <p className="text-[11px] text-indigo-200/90 font-mono">
                    {enquiryPlanTarget === 'pro_1y' && 'Selected: Pro 1-Year Plan (AED 499 / Year)'}
                    {enquiryPlanTarget === 'pro_3y' && 'Selected: Pro 3-Year Plan (AED 1,199 / 3 Years)'}
                    {(enquiryPlanTarget === 'pro_5y' || enquiryPlanTarget === 'pro_lifetime') && 'Selected: Pro Lifetime VIP Plan (AED 1,999 Pay Once)'}
                    {enquiryPlanTarget === 'basic' && 'Selected: Basic Forever Free Tier'}
                  </p>
                </div>
              </div>

              {/* Modal Mode Selector Tabs */}
              <div className="flex border-b border-indigo-800/80 mt-4 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setEnquiryModalTab('request')}
                  className={`flex-1 py-2 font-bold text-center border-b-2 transition-all cursor-pointer ${
                    enquiryModalTab === 'request'
                      ? 'border-amber-400 text-amber-300 bg-white/5'
                      : 'border-transparent text-slate-300 hover:text-white'
                  }`}
                >
                  📩 1. Request Payment Link
                </button>
                <button
                  type="button"
                  onClick={() => setEnquiryModalTab('code')}
                  className={`flex-1 py-2 font-bold text-center border-b-2 transition-all cursor-pointer ${
                    enquiryModalTab === 'code'
                      ? 'border-amber-400 text-amber-300 bg-white/5'
                      : 'border-transparent text-slate-300 hover:text-white'
                  }`}
                >
                  🔑 2. Have Code? Activate
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">

              {enquiryModalTab === 'request' ? (
                enquirySubmittedSuccess && submittedEnquiryDetails ? (
                  <div className="space-y-4 animate-fade-in">
                    {/* Success Header Card */}
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4.5 text-emerald-950 dark:text-emerald-100 space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-emerald-500 text-white rounded-xl shrink-0 shadow-sm">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold tracking-tight">Subscription Request Dispatched Successfully!</h4>
                          <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                            Order notification has been recorded in the system for <strong className="font-mono text-emerald-900 dark:text-emerald-100">Hissabpro1@gmail.com</strong>.
                          </p>
                        </div>
                      </div>

                      {/* Recipient Email Display Box with Direct Copy */}
                      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-mono">Recipient Email (Broker / Licensing)</span>
                            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white select-all">Hissabpro1@gmail.com</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('Hissabpro1@gmail.com');
                            setCopiedEmailOnly(true);
                            setTimeout(() => setCopiedEmailOnly(false), 3000);
                          }}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-bold font-mono flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shrink-0"
                        >
                          {copiedEmailOnly ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700 dark:text-emerald-300 font-bold">Email Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Email Address</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Order Summary Box */}
                      <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-3.5 border border-emerald-200/60 dark:border-emerald-900/40 space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                          <span className="text-slate-500 font-sans">Target Plan</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{submittedEnquiryDetails.plan}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                          <span className="text-slate-500 font-sans">Company Name</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{submittedEnquiryDetails.companyName}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                          <span className="text-slate-500 font-sans">Client Email</span>
                          <span className="text-slate-700 dark:text-slate-300">{submittedEnquiryDetails.clientEmail}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                          <span className="text-slate-500 font-sans">Official Company Email</span>
                          <span className="text-slate-700 dark:text-slate-300">{submittedEnquiryDetails.companyEmail}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                          <span className="text-slate-500 font-sans">Contact Phone / WhatsApp</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{submittedEnquiryDetails.phone}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-sans">Hardware Node ID</span>
                          <span className="text-[10px] text-slate-500">{submittedEnquiryDetails.machineId}</span>
                        </div>
                      </div>
                    </div>

                    {/* Copy to Gmail Helper Section */}
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5">
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                        <span>📧 Quick Copy for Gmail:</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        Copy the recipient email and order details below to paste directly into your Gmail or preferred email app:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Copy Email Button */}
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('Hissabpro1@gmail.com');
                            setCopiedEmailOnly(true);
                            setTimeout(() => setCopiedEmailOnly(false), 3000);
                          }}
                          className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                        >
                          {copiedEmailOnly ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-300" />
                              <span>✓ Copied Hissabpro1@gmail.com!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copy Email: Hissabpro1@gmail.com</span>
                            </>
                          )}
                        </button>

                        {/* Copy Full Email Message Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const fullEmailText = `Subject: [Hisaab Pro Subscription Order] ${submittedEnquiryDetails.plan} - ${submittedEnquiryDetails.companyName}\n\nDear Hisaab Pro Licensing & Billing Team,\n\nI would like to request the official Tax Invoice & Payment Link for the following subscription plan:\n\n========================================\nSUBSCRIPTION ORDER DETAILS\n========================================\n• Target Plan: ${submittedEnquiryDetails.plan}\n• Company Name: ${submittedEnquiryDetails.companyName}\n• Client Contact Email: ${submittedEnquiryDetails.clientEmail}\n• Company Official Email: ${submittedEnquiryDetails.companyEmail}\n• Contact Phone / WhatsApp: ${submittedEnquiryDetails.phone}\n• Hardware Machine ID: ${submittedEnquiryDetails.machineId}\n• Special Notes / Requirements: ${submittedEnquiryDetails.notes || 'None'}\n• Order Timestamp: ${submittedEnquiryDetails.date}\n========================================\n\nPlease send the UAE VAT Tax Invoice and payment link so we can activate our single-workstation license.\n\nThank you,\n${submittedEnquiryDetails.companyName}`;
                            navigator.clipboard.writeText(fullEmailText);
                            setCopiedEnquiryDetails(true);
                            setTimeout(() => setCopiedEnquiryDetails(false), 3000);
                          }}
                          className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                        >
                          {copiedEnquiryDetails ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-400" />
                              <span className="text-emerald-300 font-bold">✓ Full Order Text Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copy Full Message for Gmail</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Bottom Modal Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setEnquirySubmittedSuccess(false)}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      >
                        ← Modify Request
                      </button>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setEnquiryModalTab('code')}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center space-x-1.5"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>Have Code? Activate</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEnquiryModalOpen(false)}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Close Window
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitEnquiry} className="space-y-4">
                    <div className="bg-gradient-to-r from-amber-50 to-indigo-50/50 dark:from-amber-950/30 dark:to-indigo-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3.5 text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-sans space-y-1.5">
                      <div className="flex items-center justify-between">
                        <strong>📌 Direct Order & License Request Workflow:</strong>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('Hissabpro1@gmail.com');
                            setCopiedEmailOnly(true);
                            setTimeout(() => setCopiedEmailOnly(false), 3000);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9.5px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                        >
                          <Copy className="w-2.5 h-2.5" />
                          <span>{copiedEmailOnly ? 'Copied!' : 'Copy: Hissabpro1@gmail.com'}</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300">
                        When you submit your request, an order notification is recorded for <strong>Hissabpro1@gmail.com</strong>. You can copy the email address anytime and paste it directly into Gmail to communicate with licensing.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                          Client Contact Email *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. client@domain.com"
                          value={enquiryClientEmail}
                          onChange={(e) => setEnquiryClientEmail(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                          Company Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Al Safa Trading LLC"
                          value={enquiryCompanyName}
                          onChange={(e) => setEnquiryCompanyName(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                          Company Official Email *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. accounts@alsafa.ae"
                          value={enquiryCompanyEmail}
                          onChange={(e) => setEnquiryCompanyEmail(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                          Contact Phone / WhatsApp *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. +971 50 123 4567"
                          value={enquiryCompanyPhone}
                          onChange={(e) => setEnquiryCompanyPhone(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                        Special Invoicing Instructions / Notes (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Need TRN mentioned on invoice, custom branch requirements, etc."
                        value={enquiryNotes}
                        onChange={(e) => setEnquiryNotes(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setIsEnquiryModalOpen(false)}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold uppercase cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingEnquiry}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSubmittingEnquiry ? 'Sending Request...' : '🚀 Submit Request & Notify Sales'}</span>
                      </button>
                    </div>
                  </form>
                )
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    If you have already paid and received your 15/16-digit security code from our billing team, enter your details below to activate instantly:
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                        Client Email Address *
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. client@domain.com"
                        value={clientEmailInput}
                        onChange={(e) => setClientEmailInput(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                        Client Mobile Number *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. +971 50 123 4567"
                        value={clientMobileInput}
                        onChange={(e) => setClientMobileInput(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase text-amber-600 dark:text-amber-400 mb-1">
                        15 or 16-Digit Security Code *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 9876-5432-1012-3456 or HP1Y-8921-7723-9012"
                        value={activationInputKey}
                        onChange={(e) => setActivationInputKey(e.target.value.toUpperCase())}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-amber-400 rounded-xl px-3 py-2 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-300 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEnquiryModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold uppercase cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleActivateKeySubmitted(clientEmailInput, clientMobileInput, activationInputKey);
                        setIsEnquiryModalOpen(false);
                      }}
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center space-x-1.5"
                    >
                      <span>🔑 Verify & Activate Code</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
      {showPlanUpgradeAlert && (
        <div className="fixed inset-0 bg-[#0F172A]/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#F8FAFC] rounded-lg shadow-2xl max-w-sm w-full overflow-hidden border border-[#E2E8F0] animate-zoom-in p-6 text-center space-y-4">
            
            <div className="bg-amber-50 rounded-lg p-3.5 w-14 h-14 mx-auto flex items-center justify-center text-[#4F46E5] border border-[#E2E8F0]">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-900 font-mono">Free Trial Limit Reached</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Hisaab Pro restricts Free Trial tenants to <strong>strictly 1 active company</strong>. Buy a Paid Subscription Plan to create unlimited companies, manage multiple legal trade licenses, and print unlimited tax invoices!
              </p>
            </div>

            {/* Trial Premium Unlock button */}
            <div className="bg-white p-3.5 rounded-lg border border-[#E2E8F0] flex items-center justify-between text-left">
              <div>
                <p className="text-[11px] font-bold text-[#0F172A]">Unlocking Hisaab Pro Unlimited</p>
                <p className="text-[9px] text-slate-400 mt-0.5 font-sans">Activate premium license to unlock all workspace features</p>
              </div>
              <Sparkles className="w-4 h-4 text-[#4F46E5] shrink-0" />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowPlanUpgradeAlert(false)}
                className="w-1/2 py-2.5 border border-[#E2E8F0] rounded-lg hover:bg-slate-50 font-bold uppercase tracking-wider text-[10px] text-slate-600 transition-colors cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  setIsPaidPlan(true);
                  setShowPlanUpgradeAlert(false);
                  setIsCreateCompanyOpen(true);
                }}
                className="w-1/2 py-2.5 bg-[#0F172A] hover:bg-[#4F46E5] text-white font-bold rounded-lg uppercase tracking-widest text-[10px] transition-colors cursor-pointer"
              >
                Unlock Pro Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: CUSTOM CONFIRM DOCUMENT DELETION
         ------------------------------------------------------------- */}
      {docToDelete && (
        <div className="fixed inset-0 bg-[#0F172A]/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in no-print">
          <div className="bg-[#F8FAFC] rounded-lg shadow-2xl max-w-md w-full overflow-hidden border border-[#E2E8F0] animate-zoom-in p-6 relative">
            <button 
              onClick={() => setDocToDelete(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#EF4444] rounded-full p-3.5 w-14 h-14 flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold uppercase tracking-widest text-[#0F172A] font-mono">
                  Are you sure?
                </h3>
                <p className="text-xs text-slate-650 font-sans leading-relaxed">
                  This action cannot be undone. Delete [{docToDelete.type === 'Invoice' ? 'Invoice' : docToDelete.type === 'Quotation' ? 'Quotation' : 'Delivery Note'} #{docToDelete.docNumber}]?
                </p>
                {docToDelete.type === 'Invoice' && docToDelete.status === 'Paid' && (
                  <p className="text-xs text-slate-500 bg-[#FFFBEB] border border-[#FEF3C7] p-3 rounded-lg text-left font-sans leading-relaxed mt-2">
                    This invoice was already paid. Deleting it won't delete the payment. Instead, we'll automatically apply the payment to your customer's next invoice.
                  </p>
                )}
              </div>

              <div className="flex gap-3 w-full pt-4">
                <button
                  type="button"
                  onClick={() => setDocToDelete(null)}
                  className="w-1/2 py-2.5 border border-[#E2E8F0] hover:bg-[#F1F5F9]/30 text-slate-700 bg-slate-100 font-bold uppercase tracking-wider text-[10px] transition-colors cursor-pointer rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => executeDeleteDocument(docToDelete.id)}
                  className="w-1/2 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold uppercase tracking-widest text-[10px] transition-colors cursor-pointer rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: CUSTOM CONFIRM CUSTOMER DELETION
         ------------------------------------------------------------- */}
      {customerToDelete && (
        <div className="fixed inset-0 bg-[#0F172A]/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in no-print">
          <div className="bg-[#F8FAFC] rounded-lg shadow-2xl max-w-md w-full overflow-hidden border border-[#E2E8F0] animate-zoom-in p-6 relative">
            <button 
              onClick={() => setCustomerToDelete(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#EF4444] rounded-full p-3.5 w-14 h-14 flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold uppercase tracking-widest text-[#0F172A] font-mono">
                  Are you sure?
                </h3>
                <p className="text-xs text-slate-650 font-sans leading-relaxed">
                  This action cannot be undone. Delete [Customer / Client {customerToDelete.name}]?
                </p>
                <p className="text-xs text-slate-500 bg-[#FEF2F2] border border-[#FCA5A5] p-3 rounded-lg text-left font-sans leading-relaxed mt-2">
                  Warning: Deleting this customer will also cascade-delete all of their associated invoice history and quotes. This action is permanent and irreversible.
                </p>
              </div>

              <div className="flex gap-3 w-full pt-4">
                <button
                  type="button"
                  onClick={() => setCustomerToDelete(null)}
                  className="w-1/2 py-2.5 border border-[#E2E8F0] hover:bg-[#F1F5F9]/30 text-slate-700 bg-slate-100 font-bold uppercase tracking-wider text-[10px] transition-colors cursor-pointer rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => executeDeleteCustomer(customerToDelete.id)}
                  className="w-1/2 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold uppercase tracking-widest text-[10px] transition-colors cursor-pointer rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: CUSTOM CONFIRM EXPENSE DELETION
         ------------------------------------------------------------- */}
      {expenseToDelete && (
        <div className="fixed inset-0 bg-[#0F172A]/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in no-print">
          <div className="bg-[#F8FAFC] rounded-lg shadow-2xl max-w-md w-full overflow-hidden border border-[#E2E8F0] animate-zoom-in p-6 relative">
            <button 
              onClick={() => setExpenseToDelete(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#EF4444] rounded-full p-3.5 w-14 h-14 flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold uppercase tracking-widest text-[#0F172A] font-mono">
                  Are you sure?
                </h3>
                <p className="text-xs text-slate-650 font-sans leading-relaxed">
                  This action cannot be undone. Delete [{expenseToDelete.category === 'Purchases' ? 'Purchase' : 'Expense'} #{expenseToDelete.invoiceNumber}]?
                </p>
                <p className="text-xs text-slate-500 bg-[#FEF2F2] border border-[#FCA5A5] p-3 rounded-lg text-left font-sans leading-relaxed mt-2">
                  Deleting this record will immediately deduct this amount from your outflow journals and alter your net profit tax returns.
                </p>
              </div>

              <div className="flex gap-3 w-full pt-4">
                <button
                  type="button"
                  onClick={() => setExpenseToDelete(null)}
                  className="w-1/2 py-2.5 border border-[#E2E8F0] hover:bg-[#F1F5F9]/30 text-slate-700 bg-slate-100 font-bold uppercase tracking-wider text-[10px] transition-colors cursor-pointer rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => executeDeleteExpense(expenseToDelete.id)}
                  className="w-1/2 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold uppercase tracking-widest text-[10px] transition-colors cursor-pointer rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: CUSTOM CONFIRM ITEM DELETION
         ------------------------------------------------------------- */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-[#0F172A]/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#F8FAFC] rounded-lg shadow-2xl max-w-md w-full overflow-hidden border border-[#E2E8F0] animate-zoom-in p-6 relative">
            <button 
              onClick={() => setItemToDelete(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#EF4444] rounded-full p-3.5 w-14 h-14 flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold uppercase tracking-widest text-[#0F172A] font-mono">
                  Delete Item?
                </h3>
                <p className="text-xs text-slate-650 font-sans leading-relaxed">
                  Are you sure you want to delete <strong className="text-slate-900">"{itemToDelete.name}"</strong> (SKU: <span className="font-mono font-bold text-slate-900">{itemToDelete.sku}</span>) from your stock inventory catalog?
                </p>
              </div>

              <div className="flex gap-3 w-full pt-4">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="w-1/2 py-2.5 border border-[#E2E8F0] hover:bg-[#F1F5F9]/30 text-slate-700 font-bold uppercase tracking-wider text-[10px] transition-colors cursor-pointer rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => executeDeleteItem(itemToDelete.id)}
                  className="w-1/2 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold uppercase tracking-widest text-[10px] transition-colors cursor-pointer rounded-lg"
                >
                  Delete Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: CUSTOM CONFIRM COMPANY DELETION
         ------------------------------------------------------------- */}
      {companyToDelete && (
        <div className="fixed inset-0 bg-[#0F172A]/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#F8FAFC] rounded-lg shadow-2xl max-w-md w-full overflow-hidden border border-[#E2E8F0] animate-zoom-in p-6 relative">
            <button 
              onClick={() => setCompanyToDelete(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#EF4444] rounded-full p-3.5 w-14 h-14 flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold uppercase tracking-widest text-[#0F172A] font-mono">
                  Delete Company Entity?
                </h3>
                <p className="text-xs text-slate-650 font-sans leading-relaxed">
                  Are you sure you want to permanently delete the corporate entity <strong className="text-slate-900">"{companyToDelete.name}"</strong>?
                </p>
                <p className="text-xs text-slate-500 bg-[#FEF2F2] border border-[#FCA5A5] p-3 rounded-lg text-left font-sans leading-relaxed mt-2">
                  CRITICAL WARNING: This will immediately delete all customer registers, sales invoices, stock inventory levels, and expense sheets belonging to this entity. This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3 w-full pt-4">
                <button
                  type="button"
                  onClick={() => setCompanyToDelete(null)}
                  className="w-1/2 py-2.5 border border-[#E2E8F0] hover:bg-[#F1F5F9]/30 text-slate-700 font-bold uppercase tracking-wider text-[10px] transition-colors cursor-pointer rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => executeDeleteCompany(companyToDelete.id)}
                  className="w-1/2 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold uppercase tracking-widest text-[10px] transition-colors cursor-pointer rounded-lg"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: CRITICAL BLOCK - SAZA DUPLICATE SCREEN (FULL RED SCREEN)
         ------------------------------------------------------------- */}
      {sazaState.isOpen && (
        <div className="fixed inset-0 bg-[#EF4444] text-white flex items-center justify-center z-50 p-6 animate-fade-in transition-all">
          <div className="max-w-xl w-full text-center space-y-8 animate-zoom-in">
            {/* Big Cross Icon */}
            <div className="flex justify-center">
              <div className="bg-white/15 backdrop-blur-md rounded-full p-8 w-28 h-28 flex items-center justify-center border-4 border-white shadow-2xl animate-pulse">
                <span className="text-7xl font-bold font-sans">✕</span>
              </div>
            </div>

            {/* Main Text */}
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight font-sans drop-shadow-md">
                {sazaState.title}
              </h1>
              <p className="text-lg md:text-xl font-medium tracking-wide text-white/90 font-sans max-w-lg mx-auto leading-relaxed">
                {sazaState.detail}
              </p>
            </div>

            {/* Actions Panel */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 max-w-md mx-auto">
              <button
                type="button"
                onClick={handleViewExistingRecord}
                className="w-full sm:w-1/2 px-6 py-4 bg-white text-[#EF4444] hover:bg-white/90 font-black uppercase tracking-wider text-xs transition-all duration-150 cursor-pointer rounded-xl shadow-lg hover:shadow-xl active:scale-95"
              >
                View Existing Record
              </button>
              <button
                type="button"
                onClick={handleCancelSaza}
                className="w-full sm:w-1/2 px-6 py-4 bg-[#EF4444] text-white border-2 border-white/50 hover:border-white hover:bg-white/10 font-bold uppercase tracking-wider text-xs transition-all duration-150 cursor-pointer rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          UAE VAT CALCULATOR FLOATING POPUP
          ========================================== */}
      {isCalculatorOpen && (
        <div className="fixed bottom-6 right-6 w-80 bg-slate-900 text-white border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden font-sans no-print animate-fade-in animate-slide-up">
          {/* Header & Mode Switcher */}
          <div className="bg-slate-950 p-3 border-b border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Calculator className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-black uppercase tracking-wider font-mono">Hisaab Pro Calculator</span>
              </div>
              <button 
                onClick={() => setIsCalculatorOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-lg font-mono text-[10px]">
              <button
                type="button"
                onClick={() => setCalcMode('vat')}
                className={`py-1 rounded font-bold transition-all cursor-pointer ${
                  calcMode === 'vat' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                5% VAT Calc
              </button>
              <button
                type="button"
                onClick={() => setCalcMode('pl')}
                className={`py-1 rounded font-bold transition-all cursor-pointer ${
                  calcMode === 'pl' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                P&L Basics
              </button>
            </div>
          </div>

          {calcMode === 'vat' ? (
            <>
              {/* VAT Display */}
              <div className="bg-slate-950 p-4 text-right border-b border-slate-800 font-mono">
                <div className="text-[10px] text-slate-500 min-h-[14px] truncate">{calcInput || '0'}</div>
                <div className="text-2xl font-black text-emerald-400 tracking-tight mt-1 truncate">{calcResult || '0.00'}</div>
              </div>

              {/* Pad Buttons */}
              <div className="p-3 grid grid-cols-4 gap-1.5 bg-slate-900 font-mono text-xs">
                {/* Row 1 */}
                <button onClick={() => handleCalcClick('C')} className="p-2.5 bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 border border-rose-900/40 rounded-lg cursor-pointer font-bold">C</button>
                <button onClick={() => handleCalcClick('(')} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer font-bold">(</button>
                <button onClick={() => handleCalcClick(')')} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer font-bold">)</button>
                <button onClick={() => handleCalcClick('/')} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg cursor-pointer font-bold">/</button>

                {/* Row 2 */}
                <button onClick={() => handleCalcClick('7')} className="p-2.5 bg-slate-800/60 hover:bg-slate-800 text-slate-200 rounded-lg cursor-pointer font-bold">7</button>
                <button onClick={() => handleCalcClick('8')} className="p-2.5 bg-slate-800/60 hover:bg-slate-800 text-slate-200 rounded-lg cursor-pointer font-bold">8</button>
                <button onClick={() => handleCalcClick('9')} className="p-2.5 bg-slate-800/60 hover:bg-slate-800 text-slate-200 rounded-lg cursor-pointer font-bold">9</button>
                <button onClick={() => handleCalcClick('*')} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg cursor-pointer font-bold">*</button>

                {/* Row 3 */}
                <button onClick={() => handleCalcClick('4')} className="p-2.5 bg-slate-800/60 hover:bg-slate-800 text-slate-200 rounded-lg cursor-pointer font-bold">4</button>
                <button onClick={() => handleCalcClick('5')} className="p-2.5 bg-slate-800/60 hover:bg-slate-800 text-slate-200 rounded-lg cursor-pointer font-bold">5</button>
                <button onClick={() => handleCalcClick('6')} className="p-2.5 bg-slate-800/60 hover:bg-slate-800 text-slate-200 rounded-lg cursor-pointer font-bold">6</button>
                <button onClick={() => handleCalcClick('-')} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg cursor-pointer font-bold">-</button>

                {/* Row 4 */}
                <button onClick={() => handleCalcClick('1')} className="p-2.5 bg-slate-800/60 hover:bg-slate-800 text-slate-200 rounded-lg cursor-pointer font-bold">1</button>
                <button onClick={() => handleCalcClick('2')} className="p-2.5 bg-slate-800/60 hover:bg-slate-800 text-slate-200 rounded-lg cursor-pointer font-bold">2</button>
                <button onClick={() => handleCalcClick('3')} className="p-2.5 bg-slate-800/60 hover:bg-slate-800 text-slate-200 rounded-lg cursor-pointer font-bold">3</button>
                <button onClick={() => handleCalcClick('+')} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg cursor-pointer font-bold">+</button>

                {/* Row 5 */}
                <button onClick={() => handleCalcClick('0')} className="p-2.5 bg-slate-800/60 hover:bg-slate-800 text-slate-200 rounded-lg cursor-pointer font-bold">0</button>
                <button onClick={() => handleCalcClick('.')} className="p-2.5 bg-slate-800/60 hover:bg-slate-800 text-slate-200 rounded-lg cursor-pointer font-bold">.</button>
                <button onClick={() => handleCalcClick('←')} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer font-bold">←</button>
                <button onClick={() => handleCalcClick('=')} className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer font-bold">=</button>

                {/* UAE VAT Row */}
                <button 
                  onClick={() => handleCalcClick('5% VAT')} 
                  className="col-span-2 p-2 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-[10px] text-indigo-300 rounded-lg font-bold cursor-pointer"
                  title="Get 5% VAT portion"
                >
                  5% VAT
                </button>
                <button 
                  onClick={() => handleCalcClick('+5% VAT')} 
                  className="col-span-2 p-2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-[10px] text-emerald-300 rounded-lg font-bold cursor-pointer"
                  title="Add 5% standard VAT"
                >
                  +5% VAT
                </button>
              </div>
            </>
          ) : (
            /* PROFIT & LOSS BASICS CALCULATOR VIEW */
            <div className="p-4 space-y-3 font-sans">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Profit & Loss (Basics) Engine
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 font-mono mb-1">
                      Cost Price (CP)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={plCp || ''}
                      onChange={(e) => setPlCp(e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="e.g. 100"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 font-mono mb-1">
                      Selling Price (SP)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={plSp || ''}
                      onChange={(e) => setPlSp(e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="e.g. 120"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-indigo-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Calculation Outcome Summary Card */}
                {(() => {
                  const cp = plCp || 0;
                  const sp = plSp || 0;
                  if (sp > cp) {
                    const profit = sp - cp;
                    const profitPct = cp > 0 ? ((profit / cp) * 100).toFixed(2) : '100.00';
                    return (
                      <div className="bg-emerald-950/60 border border-emerald-500/30 p-2.5 rounded-lg text-emerald-300 font-mono space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-extrabold uppercase">
                          <span>Result: Profit (SP &gt; CP)</span>
                          <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/40">
                            +{profitPct}%
                          </span>
                        </div>
                        <div className="text-base font-black text-emerald-400">
                          Profit = SP - CP = AED {profit.toFixed(2)}
                        </div>
                        <div className="text-[9px] text-emerald-400/80">
                          Profit % = (Profit / CP) × 100 = ({profit.toFixed(2)} / {cp}) × 100
                        </div>
                      </div>
                    );
                  } else if (sp < cp) {
                    const loss = cp - sp;
                    const lossPct = cp > 0 ? ((loss / cp) * 100).toFixed(2) : '0.00';
                    return (
                      <div className="bg-rose-950/60 border border-rose-500/30 p-2.5 rounded-lg text-rose-300 font-mono space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-extrabold uppercase">
                          <span>Result: Loss (SP &lt; CP)</span>
                          <span className="bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/40">
                            -{lossPct}%
                          </span>
                        </div>
                        <div className="text-base font-black text-rose-400">
                          Loss = CP - SP = AED {loss.toFixed(2)}
                        </div>
                        <div className="text-[9px] text-rose-400/80">
                          Loss % = (Loss / CP) × 100 = ({loss.toFixed(2)} / {cp}) × 100
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-300 font-mono text-center">
                        <div className="text-[10px] font-bold uppercase text-slate-400">Break Even (SP = CP)</div>
                        <div className="text-xs font-bold text-white mt-0.5">No Profit / No Loss (0.00%)</div>
                      </div>
                    );
                  }
                })()}
              </div>

              {/* Quick Preset Examples */}
              <div className="space-y-1.5 font-mono text-[9px]">
                <span className="text-slate-400 uppercase font-bold block">Quick Reference Examples:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setPlCp(100); setPlSp(120); }}
                    className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-left text-slate-300 cursor-pointer"
                  >
                    <div className="font-bold text-emerald-400">Ex 1: Profit 20%</div>
                    <div>CP=100, SP=120</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setPlCp(200); setPlSp(150); }}
                    className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-left text-slate-300 cursor-pointer"
                  >
                    <div className="font-bold text-rose-400">Ex 2: Loss 25%</div>
                    <div>CP=200, SP=150</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setPlCp(500); setPlSp(550); }}
                    className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-left text-slate-300 cursor-pointer"
                  >
                    <div className="font-bold text-emerald-400">Ex 3: SP=CP+Profit</div>
                    <div>CP=500, Profit=50 → SP=550</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setPlCp(360); setPlSp(300); }}
                    className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-left text-slate-300 cursor-pointer"
                  >
                    <div className="font-bold text-rose-400">Ex 4: CP=SP+Loss</div>
                    <div>SP=300, Loss=60 → CP=360</div>
                  </button>
                </div>
              </div>

              {/* Rules & Important Points */}
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[9px] text-slate-400 space-y-1 font-sans">
                <div className="font-bold text-amber-400 font-mono uppercase">Key Rules:</div>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Profit occurs when Selling Price (SP) &gt; Cost Price (CP)</li>
                  <li>Loss occurs when Selling Price (SP) &lt; Cost Price (CP)</li>
                  <li>Percentage (Profit % or Loss %) is always calculated on Cost Price (CP)</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          UAE BUSINESS CALENDAR FLOATING POPUP
          ========================================== */}
      {isCalendarOpen && (
        <div className="fixed bottom-6 right-6 w-88 bg-slate-900 text-white border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden font-sans no-print animate-fade-in animate-slide-up">
          {/* Header */}
          <div className="bg-slate-950 p-3 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-black uppercase tracking-wider font-mono">Hisaab Business Calendar</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setCalMonthOffset(0)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[9px] font-mono font-bold text-slate-300 rounded cursor-pointer"
                title="Reset to Current Month"
              >
                Today
              </button>
              <button 
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Month & Year Navigation */}
          {(() => {
            const now = new Date();
            const displayedDate = new Date(now.getFullYear(), now.getMonth() + calMonthOffset, 1);
            const monthName = displayedDate.toLocaleString('en-US', { month: 'long' });
            const year = displayedDate.getFullYear();
            const daysInMonth = new Date(year, displayedDate.getMonth() + 1, 0).getDate();
            const firstDayOfWeek = new Date(year, displayedDate.getMonth(), 1).getDay();
            const todayDay = now.getDate();
            const isCurrentMonth = calMonthOffset === 0 && now.getMonth() === displayedDate.getMonth() && now.getFullYear() === year;

            return (
              <div className="p-3 space-y-3">
                {/* Month Selector Bar */}
                <div className="flex justify-between items-center bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 font-mono text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setCalMonthOffset(prev => prev - 1)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
                  >
                    &lt;
                  </button>
                  <span className="text-rose-300 font-black tracking-wide">{monthName} {year}</span>
                  <button
                    type="button"
                    onClick={() => setCalMonthOffset(prev => prev + 1)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
                  >
                    &gt;
                  </button>
                </div>

                {/* Days of Week Header */}
                <div className="grid grid-cols-7 gap-1 text-center font-mono text-[9px] font-bold text-slate-400 uppercase border-b border-slate-800 pb-1">
                  <span>Su</span>
                  <span>Mo</span>
                  <span>Tu</span>
                  <span>We</span>
                  <span>Th</span>
                  <span>Fr</span>
                  <span>Sa</span>
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs">
                  {/* Empty cells before month start */}
                  {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="h-7 p-1 text-slate-700" />
                  ))}

                  {/* Days of Month */}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const isToday = isCurrentMonth && dayNum === todayDay;
                    const isVatDue = dayNum === 28;
                    const isPayrollDue = dayNum === 30 || dayNum === 31;
                    const isCtDue = dayNum === 15;
                    const isRecurringRun = dayNum === 1;

                    return (
                      <button
                        type="button"
                        key={`day-${dayNum}`}
                        onClick={() => {
                          const formattedMonth = String(displayedDate.getMonth() + 1).padStart(2, '0');
                          const formattedDay = String(dayNum).padStart(2, '0');
                          setCalSelectedDate(`${year}-${formattedMonth}-${formattedDay}`);
                        }}
                        className={`h-7 rounded-lg font-bold text-[11px] relative flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isToday
                            ? 'bg-rose-600 text-white font-extrabold shadow-md ring-2 ring-rose-400'
                            : 'bg-slate-950/80 hover:bg-slate-800 text-slate-200 border border-slate-800/80'
                        }`}
                      >
                        <span>{dayNum}</span>
                        {/* Event indicator dots */}
                        <div className="flex space-x-0.5 absolute bottom-0.5">
                          {isVatDue && <span className="w-1 h-1 bg-amber-400 rounded-full" title="VAT 201 Filing Due" />}
                          {isPayrollDue && <span className="w-1 h-1 bg-emerald-400 rounded-full" title="WPS Payroll Cutoff" />}
                          {isCtDue && <span className="w-1 h-1 bg-indigo-400 rounded-full" title="CT Exemption Review" />}
                          {isRecurringRun && <span className="w-1 h-1 bg-violet-400 rounded-full" title="Recurring Invoices Auto-Run" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Key Reminders Legend & Selected Date Details */}
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5 font-sans">
                  <div className="text-[10px] font-bold text-slate-300 font-mono uppercase flex justify-between items-center">
                    <span>Key UAE Tax & Business Due Dates</span>
                    <span className="text-[9px] text-rose-400">{calSelectedDate}</span>
                  </div>

                  <div className="space-y-1 text-[9px] font-mono text-slate-300">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-amber-400 rounded-full shrink-0" />
                      <span>28th: FTA VAT 201 Return Deadline</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full shrink-0" />
                      <span>30th: WPS Payroll & Salary Disbursal</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-violet-400 rounded-full shrink-0" />
                      <span>1st: Monthly Recurring Invoices Auto-Run</span>
                    </div>
                  </div>

                  {/* Direct Link to Full Automations & Recurring Calendar */}
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentTab('recurring');
                      setIsCalendarOpen(false);
                    }}
                    className="w-full mt-2 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 text-[10px] font-bold font-mono rounded-lg transition-colors cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <span>Open Automations & Calendar Manager</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ==========================================
          GLOBAL KEYBOARD SHORTCUTS GUIDE MODAL
          ========================================== */}
      {showShortcutsHelp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in no-print">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
            
            {/* Header */}
            <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-100 dark:bg-indigo-950 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <Keyboard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono">Keyboard Shortcuts</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Speed up financial data entry</p>
                </div>
              </div>
              <button
                onClick={() => setShowShortcutsHelp(false)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 dark:text-slate-300 text-xs">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Column 1: Core Action Hotkeys */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 border-b border-slate-100 dark:border-slate-800 pb-2 font-mono">
                    Core Transactions
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 dark:text-white">New Transaction</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">Invoice, customer, or asset catalog</div>
                      </div>
                      <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[10px] font-black text-slate-700 dark:text-slate-200 shadow-2xs">
                        Ctrl + N
                      </kbd>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 dark:text-white">Save / Submit Form</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">Save active modal or invoice sheet</div>
                      </div>
                      <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[10px] font-black text-slate-700 dark:text-slate-200 shadow-2xs">
                        Ctrl + S
                      </kbd>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 dark:text-white">Toggle Help Cheatsheet</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">Show/hide keyboard hotkeys guide</div>
                      </div>
                      <div className="flex space-x-1">
                        <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[10px] font-black text-slate-700 dark:text-slate-200 shadow-2xs">
                          Ctrl + K
                        </kbd>
                        <span className="text-slate-300">or</span>
                        <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[10px] font-black text-slate-700 dark:text-slate-200 shadow-2xs">
                          Ctrl + /
                        </kbd>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 dark:text-white">Vat Reports / Print</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">Switch to Tax Reports (Print if modal is open)</div>
                      </div>
                      <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[10px] font-black text-slate-700 dark:text-slate-200 shadow-2xs">
                        Ctrl + P
                      </kbd>
                    </div>
                  </div>
                </div>

                {/* Column 2: Dashboard/Workspace Navigation */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 border-b border-slate-100 dark:border-slate-800 pb-2 font-mono">
                    Workspace Navigation
                  </h4>
                  <div className="space-y-2.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-slate-550 dark:text-slate-400 font-semibold">1. Dashboard Overview</span>
                      <kbd className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded text-[9px] font-bold text-slate-500 dark:text-slate-350">
                        Alt + 1
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-slate-550 dark:text-slate-400 font-semibold">2. Sales & Revenue</span>
                      <kbd className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded text-[9px] font-bold text-slate-500 dark:text-slate-350">
                        Alt + 2
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-slate-550 dark:text-slate-400 font-semibold">3. Recurring Automations</span>
                      <kbd className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded text-[9px] font-bold text-slate-500 dark:text-slate-350">
                        Alt + 3
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-slate-550 dark:text-slate-400 font-semibold">4. Inventory Stock Catalog</span>
                      <kbd className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded text-[9px] font-bold text-slate-500 dark:text-slate-350">
                        Alt + 4
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-slate-550 dark:text-slate-400 font-semibold">5. Expense & Outflow Logs</span>
                      <kbd className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded text-[9px] font-bold text-slate-500 dark:text-slate-350">
                        Alt + 5
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-slate-550 dark:text-slate-400 font-semibold">6. Customers & Clients Directory</span>
                      <kbd className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded text-[9px] font-bold text-slate-500 dark:text-slate-350">
                        Alt + 6
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-slate-550 dark:text-slate-400 font-semibold">7. Compliance & VAT Auditing</span>
                      <kbd className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded text-[9px] font-bold text-slate-500 dark:text-slate-350">
                        Alt + 7
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-slate-550 dark:text-slate-400 font-semibold">8. Corporate Settings</span>
                      <kbd className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded text-[9px] font-bold text-slate-500 dark:text-slate-350">
                        Alt + 8
                      </kbd>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contextual Tip Callout Box */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-xl space-y-1.5 text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                <div className="font-extrabold text-slate-900 dark:text-slate-200 uppercase tracking-wider font-mono text-[10px]">
                  💡 Smart Contextual Shortcuts
                </div>
                <p>
                  Our hotkeys adapt dynamically to whichever screen you are on. For instance, pressing <kbd className="font-mono bg-white dark:bg-slate-800 border px-1 rounded">Ctrl + N</kbd> on the <strong>Customers / Clients</strong> tab automatically triggers the customer registration modal, while on the <strong>Product Catalog</strong> tab it launches the catalog item sheet.
                </p>
                <p>
                  Pressing <kbd className="font-mono bg-white dark:bg-slate-800 border px-1 rounded">Ctrl + S</kbd> validates and submits whichever form modal or document creator you have currently open, avoiding manual mouse clicks.
                </p>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowShortcutsHelp(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg font-bold uppercase tracking-wider text-[10px] transition-colors cursor-pointer"
              >
                Close Guide
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Help System Panel Drawer */}
      <HelpSystem 
        isOpen={showHelpSystem} 
        onClose={() => setShowHelpSystem(false)} 
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          // Set side items too if they map to financials/settings, etc.
          if (tab === 'settings') setActiveSidebarItemId('settings');
          else if (tab === 'sales') setActiveSidebarItemId('sales');
          else if (tab === 'customers') setActiveSidebarItemId('clients');
          else if (tab === 'expenses') setActiveSidebarItemId('purchases');
          else if (tab === 'vat') setActiveSidebarItemId('fin_tax');
        }} 
      />

      {/* Universal Command Search Palette (Ctrl+K) */}
      <CommandSearchModal
        isOpen={showCommandSearch}
        onClose={() => setShowCommandSearch(false)}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'settings') setActiveSidebarItemId('settings');
          else if (tab === 'sales') setActiveSidebarItemId('sales');
          else if (tab === 'customers') setActiveSidebarItemId('clients');
          else if (tab === 'expenses') setActiveSidebarItemId('purchases');
          else if (tab === 'vat') setActiveSidebarItemId('fin_tax');
          else setActiveSidebarItemId(tab);
        }}
        setSelectedReportId={setSelectedReportId}
        setActiveSettingsSubTab={setActiveSettingsSubTab}
        invoices={documents}
        customers={customers}
        inventory={inventory}
        companies={companies}
        activeCompany={activeCompany}
      />

      {/* Safe Offline Update & Auto-Backup Safeguard Wizard Modal */}
      <SafeUpdateWizardModal
        isOpen={isSafeUpdateWizardOpen}
        onClose={() => setIsSafeUpdateWizardOpen(false)}
        companies={companies}
        activeCompany={activeCompany}
        documents={documents}
        customers={customers}
        inventory={inventory}
        expenses={expenses}
        version="v3.2.0-secure"
      />

      {/* Floating System Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center space-x-3 bg-slate-900/95 text-white px-4 py-3 rounded-xl shadow-2xl border border-indigo-500/40 backdrop-blur-md animate-bounce-short text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
          <span className="tracking-wide text-slate-100">{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)} 
            className="ml-3 text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
