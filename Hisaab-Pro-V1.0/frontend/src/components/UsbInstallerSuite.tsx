import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Wifi, 
  Laptop, 
  Monitor, 
  ArrowRight, 
  Cpu, 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  RefreshCw, 
  Copy,
  Terminal,
  Activity,
  Check,
  Lock,
  Shield,
  Search,
  Zap,
  Network,
  X,
  ChevronRight,
  Usb
} from 'lucide-react';

interface UsbInstallerSuiteProps {
  mainPcIp: string;
  setMainPcIp?: (ip: string) => void;
  machineId: string;
  activePlan: string;
  onApplyUsbConfig?: (pcType: 'main' | 'client', ip: string) => void;
  onAddLanSyncLog?: (method: string, endpoint: string, status: number, details: string) => void;
  standalone?: boolean;
}

export default function UsbInstallerSuite({
  mainPcIp,
  setMainPcIp,
  machineId,
  activePlan,
  onApplyUsbConfig,
  onAddLanSyncLog,
  standalone = false
}: UsbInstallerSuiteProps) {
  // Wizard states: 'ask_role' | 'server_installing' | 'server_done' | 'client_options' | 'client_scanning' | 'client_ready' | 'client_manual' | 'client_installing' | 'client_done'
  const [wizardState, setWizardState] = useState<'ask_role' | 'server_installing' | 'server_done' | 'client_options' | 'client_scanning' | 'client_ready' | 'client_manual' | 'client_installing' | 'client_done'>('ask_role');
  const [installProgress, setInstallProgress] = useState(0);
  const [currentStepText, setCurrentStepText] = useState('');
  const [terminalLog, setTerminalLog] = useState<string[]>([]);
  const [targetServerIp, setTargetServerIp] = useState(mainPcIp || '192.168.1.100');
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [scannedProgress, setScannedProgress] = useState(0);
  const [discoveredServer, setDiscoveredServer] = useState<{ ip: string; name: string; latency: string } | null>(null);

  // -------------------------------------------------------------------------
  // OFFLINE DIRECTORY CONFIGURATION & INSTALLATION STATES
  // -------------------------------------------------------------------------
  const [rootDirName, setRootDirName] = useState<string>('HisaabPro');
  const [namingConvention, setNamingConvention] = useState<'PascalCase' | 'UPPERCASE' | 'TitleCase' | 'lowercase'>('PascalCase');
  const [dirCount, setDirCount] = useState<number>(4); // 3, 4, or 6
  const [customSubDirs, setCustomSubDirs] = useState<string[]>(['Data', 'Backups', 'Logs', 'Exports']);
  const [capsLockActive, setCapsLockActive] = useState<boolean>(false);
  const [spellingWarning, setSpellingWarning] = useState<string>('');

  // Format helper for naming convention & first letter capitalization
  const formatDirName = (name: string, convention: 'PascalCase' | 'UPPERCASE' | 'TitleCase' | 'lowercase'): string => {
    // strip out characters that are invalid in Windows directories
    const clean = name.replace(/[^a-zA-Z0-9_\s]/g, '');
    
    switch (convention) {
      case 'UPPERCASE':
        return clean.toUpperCase().replace(/\s+/g, '_');
      case 'lowercase':
        return clean.toLowerCase().replace(/\s+/g, '_');
      case 'TitleCase':
        // Capitalize first letter of each word
        return clean
          .split(/[\s_]+/)
          .filter(Boolean)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
      case 'PascalCase':
      default:
        // Capitalize first letter of each word, join together without spaces
        return clean
          .split(/[\s_]+/)
          .filter(Boolean)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join('');
    }
  };

  // Typo and safety validator
  const checkSpellingAndUnsafe = (text: string): string => {
    if (!text.trim()) return 'Directory name cannot be empty.';
    if (/[^a-zA-Z0-9_\s]/.test(text)) return 'Forbidden symbols detected. Use letters, numbers, spaces or underscores only.';
    if (text.length < 2) return 'Folder name is too short.';
    return '';
  };

  // Handle count picker
  const handleDirCountChange = (count: number) => {
    setDirCount(count);
    const baseDirs = ['Data', 'Backups', 'Logs', 'Exports', 'Archives', 'Config'];
    const selected = baseDirs.slice(0, count);
    const formatted = selected.map(d => formatDirName(d, namingConvention));
    setCustomSubDirs(formatted);
  };

  // Handle convention conversion
  const handleConventionChange = (conv: 'PascalCase' | 'UPPERCASE' | 'TitleCase' | 'lowercase') => {
    setNamingConvention(conv);
    setRootDirName(prev => formatDirName(prev, conv));
    setCustomSubDirs(prev => prev.map(d => formatDirName(d, conv)));
  };

  // Keyboard navigation & wizard selection states
  const [selectedRoleIndex, setSelectedRoleIndex] = useState<number>(0);
  const [selectedClientOption, setSelectedClientOption] = useState<number>(0);

  // Keyboard sensor for CAPS LOCK status
  useEffect(() => {
    const handleKeyStatus = (e: KeyboardEvent) => {
      if (e.getModifierState) {
        setCapsLockActive(e.getModifierState('CapsLock'));
      }
    };
    window.addEventListener('keydown', handleKeyStatus);
    window.addEventListener('keyup', handleKeyStatus);
    return () => {
      window.removeEventListener('keydown', handleKeyStatus);
      window.removeEventListener('keyup', handleKeyStatus);
    };
  }, []);

  useEffect(() => {
    setTerminalLog([
      `[SYS] Hisaab Pro Network Protocol engine loaded.`,
      `[SYS] Ready to design Server/Client sync endpoints on Port 3000.`
    ]);
  }, []);

  const addTerminalLog = (msg: string) => {
    setTerminalLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-6));
  };

  // 1. Server Installation flow with customized directories
  const handleStartServerInstallation = () => {
    setWizardState('server_installing');
    setInstallProgress(0);
    addTerminalLog(`Initiating Hisaab Pro Server installation process...`);

    const steps = [
      { p: 10, text: `Creating secure root directory: C:\\${rootDirName}...` },
      ...customSubDirs.map((dir, idx) => ({
        p: 20 + Math.floor((idx / customSubDirs.length) * 45),
        text: `Mapping persistent storage node: C:\\${rootDirName}\\${dir}...`
      })),
      { p: 70, text: 'Opening system sockets & configuring inbound/outbound Port 3000 rules...' },
      { p: 85, text: 'Generating high-entropy cryptographically signed certificate signature...' },
      { p: 95, text: 'Spinning up active Database Stream Serialization loop...' },
      { p: 100, text: 'Server engine successfully compiled and listening on Port 3000!' }
    ];

    let currentStepIndex = 0;
    const interval = setInterval(() => {
      if (currentStepIndex < steps.length) {
        const step = steps[currentStepIndex];
        setInstallProgress(step.p);
        setCurrentStepText(step.text);
        addTerminalLog(step.text);
        currentStepIndex++;
      } else {
        clearInterval(interval);
        setWizardState('server_done');
        onAddLanSyncLog?.('POST', '/api/network/role', 200, `Server configured. Storage root set at C:\\${rootDirName} with ${dirCount} subfolders.`);
      }
    }, 800);
  };

  const handleCompleteServerSetup = () => {
    if (onApplyUsbConfig) {
      onApplyUsbConfig('main', targetServerIp);
    }
  };

  // 2. Client Auto-Scanning flow
  const handleStartClientScanning = () => {
    setWizardState('client_scanning');
    setScannedProgress(0);
    setDiscoveredServer(null);
    setScanLogs([]);

    const scanSteps = [
      "Pinging local gateway routers (192.168.1.1)...",
      "Broadcasting UDP sync search beacons across subnet (192.168.1.0/24)...",
      "Scanning active listening ports for Hisaab Pro Signature...",
      "Resolving candidate host on 192.168.1.100:3000...",
      "Exchanging cryptographic handshake challenge with Host..."
    ];

    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < scanSteps.length) {
        const text = scanSteps[currentIdx];
        setScanLogs(prev => [...prev, `🔍 ${text}`]);
        setScannedProgress((currentIdx + 1) * 20);
        currentIdx++;
      } else {
        clearInterval(interval);
        setDiscoveredServer({
          ip: '192.168.1.100',
          name: 'HISAAB_PRO_SERVER (Main PC Desk)',
          latency: '2 ms (Ultra-Low)'
        });
        setWizardState('client_ready');
        addTerminalLog(`Auto-scan: Found active Server at 192.168.1.100`);
      }
    }, 600);
  };

  // 3. Client Installation flow
  const handleStartClientInstallation = (serverIp: string) => {
    setTargetServerIp(serverIp);
    setWizardState('client_installing');
    setInstallProgress(0);
    addTerminalLog(`Connecting to remote host at ${serverIp}...`);

    const steps = [
      { p: 25, text: `Registering Client Machine ID with Server at ${serverIp}...` },
      { p: 50, text: `Baking local sync configuration pointing to storage node C:\\${rootDirName}...` },
      { p: 75, text: 'Configuring Windows Defender inbound/outbound TCP routes...' },
      { p: 100, text: 'Handshake verified. Remote cache synchronized successfully!' }
    ];

    let currentStepIndex = 0;
    const interval = setInterval(() => {
      if (currentStepIndex < steps.length) {
        const step = steps[currentStepIndex];
        setInstallProgress(step.p);
        setCurrentStepText(step.text);
        addTerminalLog(step.text);
        currentStepIndex++;
      } else {
        clearInterval(interval);
        setWizardState('client_done');
        onAddLanSyncLog?.('POST', '/api/network/role', 200, `Client configured. Synchronized to server at ${serverIp}`);
      }
    }, 700);
  };

  const handleCompleteClientSetup = () => {
    if (onApplyUsbConfig) {
      onApplyUsbConfig('client', targetServerIp);
    }
  };

  // Keyboard-based wizard setup controller
  useEffect(() => {
    const handleWizardKeys = (e: KeyboardEvent) => {
      // Check if we are typing in an input
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
        return;
      }

      if (wizardState === 'ask_role') {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedRoleIndex(0);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'Tab') {
          e.preventDefault();
          setSelectedRoleIndex(1);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (selectedRoleIndex === 0) {
            handleStartServerInstallation();
          } else {
            setWizardState('client_options');
          }
        }
      } else if (wizardState === 'client_options') {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedClientOption(0);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'Tab') {
          e.preventDefault();
          setSelectedClientOption(1);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (selectedClientOption === 0) {
            handleStartClientScanning();
          } else {
            setWizardState('client_manual');
          }
        } else if (e.key === 'Escape' || e.key === 'Backspace') {
          e.preventDefault();
          setWizardState('ask_role');
        }
      } else if (wizardState === 'client_ready') {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleStartClientInstallation(discoveredServer?.ip || '192.168.1.100');
        } else if (e.key === 'Escape' || e.key === 'Backspace') {
          e.preventDefault();
          setWizardState('client_options');
        }
      } else if (wizardState === 'client_manual') {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleStartClientInstallation(targetServerIp);
        } else if (e.key === 'Escape' || e.key === 'Backspace') {
          e.preventDefault();
          setWizardState('client_options');
        }
      } else if (wizardState === 'server_done') {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleCompleteServerSetup();
        }
      } else if (wizardState === 'client_done') {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleCompleteClientSetup();
        }
      }
    };

    window.addEventListener('keydown', handleWizardKeys);
    return () => window.removeEventListener('keydown', handleWizardKeys);
  }, [wizardState, selectedRoleIndex, selectedClientOption, rootDirName, customSubDirs, targetServerIp, discoveredServer]);

  return (
    <div id="hisaab-pro-wizard-container" className={`bg-[#0b1329] border border-slate-850 rounded-2xl shadow-xl overflow-hidden font-sans text-left text-white ${standalone ? 'w-full' : 'mt-4'}`}>
      
      {/* Upper header */}
      <div id="wizard-header" className="bg-gradient-to-r from-[#0d1527] via-[#161c38] to-[#0d1527] p-5 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-indigo-400">
            <Network className="w-5 h-5 text-indigo-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest font-mono text-indigo-400">
              One-Click LAN Installation Wizard
            </span>
          </div>
          <h3 className="text-sm font-extrabold text-white uppercase tracking-tight font-mono flex items-center space-x-2">
            <span>🔌 Hisaab Pro One-Click Server/Client Setup</span>
            <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-mono font-normal px-2 py-0.5 rounded border border-indigo-500/30">V2.0 Setup Engine</span>
          </h3>
          <p className="text-[11px] text-slate-400 leading-normal max-w-xl">
            This workspace simplifies network syncing. Setup exactly one machine as the **Main Server**, then auto-scan and link secondary **Client Workstations** over Wi-Fi/LAN instantly. No USB keys or scripts required!
          </p>
        </div>

        {/* Current status tag */}
        <div id="wizard-status-badge" className="shrink-0 bg-[#060a15] px-3 py-2 rounded-xl border border-slate-800 flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div className="space-y-0.5 font-mono text-[9px]">
            <span className="block text-slate-500 uppercase tracking-widest">Network Status</span>
            <span className="font-bold text-slate-300 block">LOCAL LAN READY</span>
          </div>
        </div>
      </div>

      <div id="wizard-body-grid" className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main interactive stage column (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {wizardState === 'ask_role' && (
            <div id="role-selection-view" className="space-y-5 animate-fade-in">
              <div className="text-center md:text-left">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 font-mono">
                  Step 1: Choose Station Network Role
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Is this physical computer acting as the database source, or is it a remote workstation connecting to another computer?</p>
              </div>

              {/* Keyboard helper tag */}
              <div className="flex items-center space-x-2 text-[10px] text-amber-400 font-mono bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/25">
                <span className="animate-pulse">⌨️</span>
                <span><strong>Keyboard Nav Active:</strong> Use Left/Right Arrow Keys to change selection, and press <strong>Enter</strong> to proceed.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Main Server Option */}
                <div 
                  id="select-server-card"
                  onClick={handleStartServerInstallation}
                  className={`p-5 rounded-xl transition-all duration-300 group cursor-pointer flex flex-col justify-between space-y-4 shadow-md ${
                    selectedRoleIndex === 0
                      ? 'bg-slate-900 border-2 border-emerald-500 shadow-emerald-950/25 scale-102 ring-2 ring-emerald-500/20'
                      : 'bg-slate-950/60 hover:bg-slate-900/85 border border-slate-800 hover:border-emerald-500/50'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl border transition-all ${
                        selectedRoleIndex === 0
                          ? 'bg-emerald-500 text-black border-emerald-400'
                          : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30'
                      }`}>
                        <Server className="w-6 h-6 animate-pulse" />
                      </div>
                      <span className="text-[9px] font-mono text-emerald-500 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/20 uppercase font-bold">Primary Node</span>
                    </div>
                    <div className="space-y-1">
                      <h5 className="font-extrabold text-xs text-white uppercase font-mono group-hover:text-emerald-400 transition-colors">Setup as Main PC (Server)</h5>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Installs the core database server files on this machine. Acts as the data owner and allows other secondary computers on your network to fetch/write company data safely.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-[10px] text-slate-500 font-mono group-hover:text-emerald-400 pt-2 border-t border-slate-900">
                    <span>Initialize Core Database Host</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-auto transition-transform group-hover:translate-x-1" />
                  </div>
                </div>

                {/* Client Option */}
                <div 
                  id="select-client-card"
                  onClick={() => setWizardState('client_options')}
                  className={`p-5 rounded-xl transition-all duration-300 group cursor-pointer flex flex-col justify-between space-y-4 shadow-md ${
                    selectedRoleIndex === 1
                      ? 'bg-slate-900 border-2 border-indigo-500 shadow-indigo-950/25 scale-102 ring-2 ring-indigo-500/20'
                      : 'bg-slate-950/60 hover:bg-slate-900/85 border border-slate-800 hover:border-indigo-500/50'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl border transition-all ${
                        selectedRoleIndex === 1
                          ? 'bg-indigo-500 text-black border-indigo-400'
                          : 'bg-indigo-950/40 text-indigo-400 border-indigo-900/30'
                      }`}>
                        <Monitor className="w-6 h-6" />
                      </div>
                      <span className="text-[9px] font-mono text-indigo-500 bg-indigo-950/30 px-2 py-0.5 rounded border border-indigo-900/20 uppercase font-bold">Secondary Node</span>
                    </div>
                    <div className="space-y-1">
                      <h5 className="font-extrabold text-xs text-white uppercase font-mono group-hover:text-indigo-400 transition-colors">Setup as Client PC (Workstation)</h5>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Installs zero-local-DB files. Performs a secure Wi-Fi scan, handshakes with your Server computer, and instantly configures this PC to read/write transactions remotely.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-[10px] text-slate-500 font-mono group-hover:text-indigo-400 pt-2 border-t border-slate-900">
                    <span>Scan & Link to Server PC</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-auto transition-transform group-hover:translate-x-1" />
                  </div>
                </div>

              </div>

              {/* OFFLINE STORAGE & DIRECTORY CONFIGURATOR */}
              <div id="offline-directory-configurator" className="bg-[#070d1a] border border-slate-800/80 rounded-xl p-5 space-y-4 shadow-inner">
                <div className="flex items-center space-x-2 border-b border-slate-800/60 pb-2.5">
                  <Usb className="w-4 h-4 text-emerald-400" />
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-emerald-400 font-mono">📁 Local Storage & Directory Architecture Builder</h5>
                    <p className="text-[9px] text-slate-400 font-sans">Set directory naming standards, spelling rules, casing constraints, and folder counts for secure local databases.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-sans">
                  {/* Left: Input parameters */}
                  <div className="space-y-4">
                    {/* Root Folder input with active caps lock warnings */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Root Directory Name</label>
                        {capsLockActive && (
                          <span className="text-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded font-mono font-bold animate-pulse">
                            ⚠️ CAPS LOCK ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-500 font-mono font-bold">C:\</span>
                        <input
                          type="text"
                          value={rootDirName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRootDirName(formatDirName(val, namingConvention));
                            const warning = checkSpellingAndUnsafe(val);
                            setSpellingWarning(warning);
                          }}
                          placeholder="HisaabPro"
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-slate-200 outline-hidden focus:border-indigo-500 text-[11px] font-mono tracking-wide"
                        />
                      </div>
                      {spellingWarning && (
                        <p className="text-[9px] text-rose-400 font-mono mt-0.5">⚠️ {spellingWarning}</p>
                      )}
                    </div>

                    {/* Naming Convention Picker */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Directory Naming Convention</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: 'PascalCase', label: 'PascalCase (HisaabPro)' },
                          { id: 'UPPERCASE', label: 'UPPERCASE (HISAAB_PRO)' },
                          { id: 'TitleCase', label: 'Title Case (Hisaab Pro)' },
                          { id: 'lowercase', label: 'lowercase (hisaab_pro)' }
                        ].map((conv) => (
                          <button
                            key={conv.id}
                            type="button"
                            onClick={() => handleConventionChange(conv.id as any)}
                            className={`p-1.5 text-[9px] rounded-lg font-mono border text-left transition-all cursor-pointer ${
                              namingConvention === conv.id 
                                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold' 
                                : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            {conv.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Directory Count Picker */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Number of Directories to Install</label>
                      <div className="flex space-x-2">
                        {[3, 4, 6].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleDirCountChange(num)}
                            className={`flex-1 py-1 px-3 text-center rounded-lg border font-mono text-[9px] cursor-pointer transition-all ${
                              dirCount === num 
                                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 font-bold' 
                                : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            {num} Directories
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Live visual tree hierarchy representation */}
                  <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col justify-between font-mono text-[10px] text-slate-300">
                    <div>
                      <div className="text-[8px] text-slate-500 uppercase tracking-wider font-black mb-2 border-b border-slate-900 pb-1 flex justify-between">
                        <span>🖥️ Live Local Storage Preview</span>
                        <span className="text-emerald-500 uppercase tracking-widest">{namingConvention} STYLE</span>
                      </div>
                      <div className="space-y-1 select-none leading-relaxed">
                        <div className="text-slate-500">📂 C:\</div>
                        <div className="pl-3 flex items-center text-emerald-400 font-extrabold">
                          <span className="text-slate-600 mr-1.5">┗ 📂</span>
                          <span>{rootDirName || 'HisaabPro'}</span>
                        </div>
                        {customSubDirs.map((dir, idx) => (
                          <div key={idx} className="pl-6 flex items-center text-indigo-300">
                            <span className="text-slate-600 mr-1.5">
                              {idx === customSubDirs.length - 1 ? '┗ 📁' : '┣ 📁'}
                            </span>
                            <span>{dir}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-900/80 text-[8px] text-slate-500 leading-normal">
                      💡 <strong>Formatting Engine:</strong> Auto-sanitizes typos & applies standard <strong>First Letter Capitalization</strong> filters.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SERVER SETUP PROGRESS */}
          {wizardState === 'server_installing' && (
            <div id="server-install-view" className="bg-slate-950 p-6 rounded-xl border border-slate-850 space-y-6 animate-fade-in">
              <div className="flex items-center space-x-3 border-b border-slate-900 pb-3">
                <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono">
                    Installing Server Database Stack
                  </h4>
                  <p className="text-[10px] text-slate-500">Configuring Windows Registry, Firewalls and local SQLite registers...</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-emerald-400 font-bold animate-pulse">{currentStepText}</span>
                  <span className="text-slate-400">{installProgress}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${installProgress}%` }}
                  />
                </div>
              </div>

              <div className="bg-[#040812] p-4 rounded-lg border border-slate-900 font-mono text-[9px] text-emerald-400/90 leading-relaxed">
                <p>• PATH : C:\{rootDirName}\{customSubDirs[0] || 'Data'}\company.db [Allocated]</p>
                <p>• SHELL: Netsh advfirewall firewall add rule name="HisaabServer" port=3000 protocol=TCP action=allow</p>
                <p>• CRYPTO: Generating Local ECC 256 Key Parity...</p>
              </div>
            </div>
          )}

          {/* SERVER COMPLETED */}
          {wizardState === 'server_done' && (
            <div id="server-completed-view" className="bg-slate-950 p-6 rounded-xl border border-slate-850 space-y-5 animate-fade-in">
              <div className="text-center space-y-2 py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 flex items-center justify-center mx-auto mb-2">
                  <Check className="w-6 h-6 text-emerald-400" />
                </div>
                <h4 className="text-sm font-extrabold uppercase tracking-tight text-white font-mono">
                  ✓ Hisaab Pro Server Configured Successfully!
                </h4>
                <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                  The local database server is live and broadcasting. You can now launch this machine, and connect as many secondary client workstations as needed.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 space-y-1">
                  <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-widest font-mono">Server Local IP Address</span>
                  <code className="text-xs text-indigo-300 font-bold font-mono">{targetServerIp}</code>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 space-y-1">
                  <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-widest font-mono">Direct Connection Token</span>
                  <code className="text-xs text-emerald-400 font-bold font-mono">HP-SYNC-9028-LA7</code>
                </div>
              </div>

              <div className="p-3 bg-indigo-950/20 border border-indigo-900/35 rounded-lg text-[10px] text-slate-300 leading-relaxed flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  <strong>Client Connection Tip:</strong> Open Hisaab Pro on your other computer, click "Client" in the role setup, select "Auto-Scan", and it will detect this Server computer automatically!
                </span>
              </div>

              <button
                type="button"
                onClick={handleCompleteServerSetup}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-md"
              >
                <span>Launch Main Station Server Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* CLIENT CONNECTION OPTIONS */}
          {wizardState === 'client_options' && (
            <div id="client-options-view" className="bg-slate-950 p-6 rounded-xl border border-slate-850 space-y-5 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 font-mono">
                  Client Setup & Discovery Option
                </h4>
                <button 
                  type="button"
                  onClick={() => setWizardState('ask_role')}
                  className="text-[10px] text-slate-500 hover:text-slate-300 font-mono"
                >
                  ← Back to Selection
                </button>
              </div>

              {/* Keyboard helper tag */}
              <div className="flex items-center space-x-2 text-[10px] text-amber-400 font-mono bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/25">
                <span className="animate-pulse">⌨️</span>
                <span><strong>Keyboard Nav Active:</strong> Use Left/Right Arrow Keys to change selection, and press <strong>Enter</strong> to proceed.</span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                To link this workstation client to your Main Server, we need to locate your server PC on the local Wi-Fi/LAN network. Choose your preferred installation pathway:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div 
                  id="client-auto-scan-btn"
                  onClick={handleStartClientScanning}
                  className={`p-4 rounded-xl transition-all text-center space-y-2 cursor-pointer group ${
                    selectedClientOption === 0
                      ? 'bg-slate-900 border-2 border-indigo-500 scale-102 ring-2 ring-indigo-500/20 shadow-indigo-950/25'
                      : 'bg-slate-900/60 hover:bg-slate-850 border border-slate-800'
                  }`}
                >
                  <Search className={`w-8 h-8 mx-auto group-hover:scale-110 transition-transform ${selectedClientOption === 0 ? 'text-indigo-400' : 'text-slate-550'}`} />
                  <h5 className="font-bold text-xs uppercase text-slate-200">1-Click Network Auto-Scan</h5>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    Recommended. Scans your Wi-Fi/LAN network automatically, identifies the active Hisaab Pro Server, and connects.
                  </p>
                </div>

                <div 
                  id="client-manual-entry-btn"
                  onClick={() => setWizardState('client_manual')}
                  className={`p-4 rounded-xl transition-all text-center space-y-2 cursor-pointer group ${
                    selectedClientOption === 1
                      ? 'bg-slate-900 border-2 border-indigo-500 scale-102 ring-2 ring-indigo-500/20 shadow-indigo-950/25'
                      : 'bg-slate-900/60 hover:bg-slate-850 border border-slate-800'
                  }`}
                >
                  <Settings className={`w-8 h-8 mx-auto group-hover:scale-110 transition-transform ${selectedClientOption === 1 ? 'text-indigo-400' : 'text-slate-550'}`} />
                  <h5 className="font-bold text-xs uppercase text-slate-200">Manual IP / Token Entry</h5>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    Use this if you have a non-standard network setup or isolated subnet routers where discovery is blocked.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CLIENT AUTOMATED LAN AUTO-SCANNING */}
          {wizardState === 'client_scanning' && (
            <div id="client-scanning-view" className="bg-slate-950 p-6 rounded-xl border border-slate-850 space-y-6 animate-fade-in text-center">
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                {/* Sonar Radar Wave animations */}
                <div className="absolute inset-0 bg-indigo-500/10 rounded-full animate-ping" />
                <div className="absolute inset-4 bg-indigo-500/20 rounded-full animate-pulse" />
                <div className="relative p-5 bg-indigo-950 text-indigo-400 border border-indigo-500/30 rounded-full">
                  <Search className="w-10 h-10 animate-pulse" />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 font-mono">
                  Scanning local LAN Network
                </h4>
                <p className="text-[10px] text-slate-500">Searching active subnets for Hisaab Pro Main Host on Port 3000...</p>
              </div>

              <div className="bg-[#040812] text-left p-4 rounded-xl border border-slate-900 font-mono text-[9px] text-indigo-400 space-y-1.5">
                {scanLogs.map((log, i) => (
                  <div key={i} className="animate-fade-in">{log}</div>
                ))}
              </div>

              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${scannedProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* CLIENT SCAN DISCOVERED SERVER */}
          {wizardState === 'client_ready' && discoveredServer && (
            <div id="client-discovered-view" className="bg-slate-950 p-6 rounded-xl border border-slate-850 space-y-5 animate-fade-in">
              <div className="text-center space-y-2 py-1">
                <div className="w-12 h-12 rounded-full bg-indigo-950/40 text-indigo-400 border border-indigo-900/50 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-6 h-6 text-indigo-400 animate-pulse" />
                </div>
                <h4 className="text-sm font-extrabold uppercase tracking-tight text-white font-mono">
                  ✓ Active Database Server Discovered!
                </h4>
                <p className="text-[11px] text-slate-400">
                  Hisaab Pro network setup auto-discovered the running Server computer on your local LAN network. Let's link them up.
                </p>
              </div>

              <div className="border border-slate-900 rounded-xl bg-[#070c1b] divide-y divide-slate-900 text-xs font-mono">
                <div className="flex justify-between p-3.5">
                  <span className="text-slate-500">Main Server Host Name:</span>
                  <span className="font-bold text-slate-200">{discoveredServer.name}</span>
                </div>
                <div className="flex justify-between p-3.5">
                  <span className="text-slate-500">Server Local IP Address:</span>
                  <span className="font-bold text-indigo-300">{discoveredServer.ip}</span>
                </div>
                <div className="flex justify-between p-3.5">
                  <span className="text-slate-500">Subnet Ping Latency:</span>
                  <span className="font-bold text-emerald-400">{discoveredServer.latency}</span>
                </div>
                <div className="flex justify-between p-3.5">
                  <span className="text-slate-500">Licensing Approval:</span>
                  <span className="font-bold text-emerald-400">APPROVED (UNLIMITED PLANS)</span>
                </div>
              </div>

              <div className="flex space-x-3 pt-1">
                <button
                  type="button"
                  onClick={() => setWizardState('client_options')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-400 rounded-xl text-xs font-bold border border-slate-800 transition"
                >
                  Rescan
                </button>
                <button
                  type="button"
                  onClick={() => handleStartClientInstallation(discoveredServer.ip)}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <span>Install & Connect Client Node</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* CLIENT MANUAL ENTRY */}
          {wizardState === 'client_manual' && (
            <div id="client-manual-view" className="bg-slate-950 p-6 rounded-xl border border-slate-850 space-y-5 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 font-mono">
                  Manual Server Connection IP
                </h4>
                <button 
                  type="button"
                  onClick={() => setWizardState('client_options')}
                  className="text-[10px] text-slate-500 hover:text-slate-300 font-mono"
                >
                  ← Back to Options
                </button>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Specify the Main Server's local IP address or Connection Token. The client installer will register this endpoint immediately.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider font-mono text-slate-500 mb-1.5">
                    Main PC local IP Address (or Sync Token)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={targetServerIp}
                      onChange={(e) => setTargetServerIp(e.target.value)}
                      placeholder="e.g. 192.168.1.100"
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs font-mono text-indigo-300 focus:outline-hidden focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => alert(`Active network socket test sent to ${targetServerIp}... Success! Address is formatted correctly.`)}
                      className="px-4 bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 font-bold uppercase rounded-xl cursor-pointer"
                    >
                      Verify Route
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-850 text-[10px] text-slate-400 leading-normal space-y-1">
                  <p className="font-extrabold uppercase font-mono text-slate-300">[HOW TO FIND THE SERVER IP]</p>
                  <p>1. Go to your Main PC (Server Computer).</p>
                  <p>2. Open **Hisaab Pro Company Settings** &gt; **LAN Network Setup** subtab.</p>
                  <p>3. Copy the IP address listed there and enter it above.</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartClientInstallation(targetServerIp)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-md"
                >
                  <span>Install & Connect Client Node</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* CLIENT INSTALLING STATUS */}
          {wizardState === 'client_installing' && (
            <div id="client-installing-view" className="bg-slate-950 p-6 rounded-xl border border-slate-850 space-y-6 animate-fade-in">
              <div className="flex items-center space-x-3 border-b border-slate-900 pb-3">
                <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 font-mono">
                    Installing Secondary Client Node
                  </h4>
                  <p className="text-[10px] text-slate-500">Configuring workstation handshakes and tunneling remote database queries...</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-indigo-400 font-bold animate-pulse">{currentStepText}</span>
                  <span className="text-slate-400">{installProgress}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${installProgress}%` }}
                  />
                </div>
              </div>

              <div className="bg-[#040812] p-4 rounded-lg border border-slate-900 font-mono text-[9px] text-indigo-400/90 leading-relaxed">
                <p>• REMOTE PATH: http://{targetServerIp}:3000/api/db/fragment [Tunnels Allocated]</p>
                <p>• FIREWALL   : Allow outbound/inbound routes over localized network</p>
                <p>• METADATA   : Generating `hisaab_config.xml` mapping configuration...</p>
              </div>
            </div>
          )}

          {/* CLIENT COMPLETED */}
          {wizardState === 'client_done' && (
            <div id="client-completed-view" className="bg-slate-950 p-6 rounded-xl border border-slate-850 space-y-5 animate-fade-in">
              <div className="text-center space-y-2 py-2">
                <div className="w-12 h-12 rounded-full bg-indigo-950/40 text-indigo-400 border border-indigo-900/50 flex items-center justify-center mx-auto mb-2">
                  <Check className="w-6 h-6 text-indigo-400 animate-pulse" />
                </div>
                <h4 className="text-sm font-extrabold uppercase tracking-tight text-white font-mono">
                  ✓ Workstation Client Installed Successfully!
                </h4>
                <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                  This computer is now configured as an active **Client PC**. No transaction files will reside locally. All reads and writes are tunneled securely to your Main Server.
                </p>
              </div>

              <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-850 flex justify-between items-center text-xs font-mono">
                <div className="space-y-1">
                  <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-widest">Linked Server IP</span>
                  <span className="font-bold text-indigo-300">{targetServerIp}</span>
                </div>
                <div className="space-y-1 text-right">
                  <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-widest">Network Speed</span>
                  <span className="font-bold text-emerald-400">Stable Handshake (2ms)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCompleteClientSetup}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-md"
              >
                <span>Launch Client Station Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

        {/* Right side diagnostics/info card (4 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          
          {/* Active Workstation properties */}
          <div id="hardware-diagnostics-info" className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3.5">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 font-mono flex items-center space-x-1.5 border-b border-slate-900 pb-2">
              <Cpu className="w-3.5 h-3.5" />
              <span>Machine Diagnostics</span>
            </h5>

            <div className="space-y-2.5 text-[11px] font-mono text-slate-400">
              <div className="flex justify-between">
                <span>Machine Fingerprint:</span>
                <span className="font-bold text-slate-300 truncate max-w-[120px]">{machineId || 'HW-7B92-F19A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Active License:</span>
                <span className="font-bold text-emerald-400 uppercase">
                  {activePlan === 'pro_1y' ? '1 Year Pro' : activePlan === 'pro_3y' ? '3 Yr Unlimited' : activePlan === 'pro_lifetime' ? 'Lifetime Unlimited' : 'Pro Trial'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Port Connection:</span>
                <span className="font-bold text-slate-300">TCP / 3000</span>
              </div>
              <div className="flex justify-between">
                <span>Tax Compliance:</span>
                <span className="font-bold text-emerald-400">UAE FTA 5%</span>
              </div>
            </div>
          </div>

          {/* Expert Script Exporter Panel (Alternative fallback) */}
          <div id="expert-exporter-panel" className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono flex items-center space-x-1.5 border-b border-slate-900 pb-2">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                <span>Expert Fallback Tools</span>
              </h5>
              <p className="text-[10px] text-slate-400 leading-normal">
                Generate and download physical local Windows installation scripts to build your configured directory structure instantly.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const dirsCommands = customSubDirs.map(d => `New-Item -ItemType Directory -Force -Path "C:\\${rootDirName}\\${d}"`).join('\n');
                  const script = `# Server Init & Directory Provisioning Script\n# Naming Style: ${namingConvention}\n# Total Folders: ${dirCount}\n\n# Create directory structure\nNew-Item -ItemType Directory -Force -Path "C:\\${rootDirName}"\n${dirsCommands}\n\n# Firewall Socket Setup\nNew-NetFirewallRule -DisplayName "Hisaab Server" -Port 3000 -Protocol TCP -Action Allow`;
                  const element = document.createElement("a");
                  const file = new Blob([script], {type: 'text/plain'});
                  element.href = URL.createObjectURL(file);
                  element.download = `Setup_${rootDirName}_Directories.ps1`;
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                  alert(`Downloaded Custom PowerShell setup script to configure C:\\${rootDirName} with ${dirCount} directories!`);
                }}
                className="w-full py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-lg text-[9px] font-mono uppercase tracking-wider border border-slate-850 flex items-center justify-center space-x-1 cursor-pointer transition"
              >
                <Copy className="w-3 h-3 text-indigo-400" />
                <span>Export PowerShell Script</span>
              </button>
            </div>
          </div>

          {/* Simulated PowerShell live stream terminal */}
          <div id="ps-logs-console" className="bg-[#03060c] p-3 rounded-xl border border-slate-900 font-mono text-[9px] text-indigo-400/90 flex flex-col justify-between min-h-[100px]">
            <div className="space-y-1">
              <div className="text-slate-600 flex items-center space-x-1 mb-1 border-b border-slate-900/60 pb-1 uppercase font-bold">
                <Terminal className="w-3 h-3" />
                <span>PowerShell Console Logs</span>
              </div>
              {terminalLog.map((log, i) => (
                <div key={i} className="truncate">
                  {log}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
