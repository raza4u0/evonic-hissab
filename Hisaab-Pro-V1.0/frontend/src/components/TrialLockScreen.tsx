import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  Key, 
  Copy, 
  Check, 
  PhoneCall, 
  MessageSquare, 
  AlertCircle, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';
import { TrialSecurityState, activateTrialLicenseKey } from '../utils/trialSecurityEngine';

interface TrialLockScreenProps {
  trialState: TrialSecurityState;
  onUnlocked: (result: { daysLeft: number; newExpiry: string }) => void;
}

export default function TrialLockScreen({ trialState, onUnlocked }: TrialLockScreenProps) {
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedMachineId, setCopiedMachineId] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  const isTampered = trialState.isDateTampered;
  const whatsappNumber = '0300-XXXXXXX';
  const whatsappUrl = `https://wa.me/?text=Hello%2C%20I%20need%20to%20activate%20Hisaab%20Pro.%20My%20Machine%20ID%20is%3A%20${trialState.machineId}`;

  const handleCopyMachineId = () => {
    navigator.clipboard.writeText(trialState.machineId);
    setCopiedMachineId(true);
    setTimeout(() => setCopiedMachineId(false), 2500);
  };

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(whatsappNumber);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  const handleActivate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const keyToTest = licenseKeyInput.trim();
    if (!keyToTest) {
      setErrorMessage('Please enter a license key to activate.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await activateTrialLicenseKey(keyToTest);
      if (result.success) {
        setSuccessMessage(result.message);
        setTimeout(() => {
          onUnlocked({
            daysLeft: result.daysLeft,
            newExpiry: result.newExpiry
          });
        }, 800);
      } else {
        setErrorMessage(result.message);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Activation failed. Please check your key.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-slate-100 p-4 overflow-y-auto">
      {/* Background Subtle Gradient Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      <div className="relative w-full max-w-lg bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 animate-scale-up">
        
        {/* Status Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border transition-all">
            {isTampered ? (
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border-rose-500/30 flex items-center justify-center text-rose-500">
                <ShieldAlert className="w-9 h-9 animate-pulse" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-amber-500/30 flex items-center justify-center text-amber-500">
                <Lock className="w-9 h-9" />
              </div>
            )}
          </div>

          <div>
            {isTampered ? (
              <>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
                  Date Tampering Detected - Contact Support
                </h1>
                <p className="text-xs sm:text-sm text-rose-400 font-semibold mt-1">
                  Computer system date has been altered. Software access is locked.
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  The system clock on this computer was rolled back. Please restore the correct system time or activate with an authorized license key.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono leading-snug">
                  Your Free Trial Has Expired. Please Contact Support to Activate.
                </h1>
                <p className="text-xs sm:text-sm text-amber-400 font-semibold mt-1">
                  Your 30-day evaluation trial has ended. Please enter your license key to continue.
                </p>
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-950/40 border border-amber-800/60 rounded-full text-amber-300 text-[11px] font-mono mt-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>30 Days Free Trial Period Expired</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Machine ID Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Machine ID (System Hardware Code)</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              Hardware Locked
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-950 px-4 py-2.5 rounded-lg border border-slate-800">
            <span className="font-mono text-lg font-black tracking-widest text-indigo-300">
              {trialState.machineId}
            </span>

            <button
              type="button"
              onClick={handleCopyMachineId}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-md transition-colors font-mono cursor-pointer"
              title="Copy Machine ID"
            >
              {copiedMachineId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy ID</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-500">
            Send this 8-digit Machine ID via WhatsApp to receive your official license key.
          </p>
        </div>

        {/* WhatsApp Contact Box */}
        <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-emerald-300/80 font-mono">Official Activation WhatsApp</p>
              <p className="text-base font-black text-emerald-400 font-mono tracking-wide">
                WhatsApp: {whatsappNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-300 text-xs font-mono rounded-lg transition-colors cursor-pointer"
            >
              {copiedWhatsApp ? 'Copied' : 'Copy Number'}
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Contact</span>
            </a>
          </div>
        </div>

        {/* License Key Input & Activation Form */}
        <form onSubmit={handleActivate} className="space-y-3">
          <label className="block text-xs font-mono text-slate-300 font-semibold">
            Enter License Key
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Key className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={licenseKeyInput}
                onChange={(e) => setLicenseKeyInput(e.target.value.toUpperCase())}
                placeholder="e.g. HISAAB-30-UNLOCK or HISAAB-365-PAID"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg text-white font-mono text-xs uppercase tracking-wider outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !licenseKeyInput.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono text-xs font-bold rounded-lg transition-all shadow-md shrink-0 flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              {isLoading ? (
                <span>Checking...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Activate Key</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Keys Helper */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-slate-400 font-mono">
            <span>Supported keys:</span>
            <button
              type="button"
              onClick={() => setLicenseKeyInput('HISAAB-30-UNLOCK')}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded border border-slate-700 cursor-pointer"
            >
              HISAAB-30-UNLOCK (30 Days)
            </button>
            <button
              type="button"
              onClick={() => setLicenseKeyInput('HISAAB-365-PAID')}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700 cursor-pointer"
            >
              HISAAB-365-PAID (365 Days)
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-lg flex items-start space-x-2 text-rose-300 text-xs font-mono animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-lg flex items-start space-x-2 text-emerald-300 text-xs font-mono animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}
        </form>

      </div>
    </div>
  );
}
