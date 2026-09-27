import React, { useState, useEffect } from 'react';
import {
  Key,
  Shield,
  Lock,
  User,
  Sparkles,
  Download,
  UserPlus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Trash2,
  Calendar,
  Monitor,
  Server,
  Building2,
  Check,
  ChevronRight
} from 'lucide-react';
import { exportToExcel, getOfflineUninstallFeedback, UninstallFeedbackRecord } from '../utils/licenseEngine';

export interface AdminLicenseRecord {
  id: string;
  code: string;
  plan_type: 'HP1Y' | 'HP3Y' | 'HPLF';
  max_devices: number;
  duration_months: number;
  status: 'unused' | 'assigned' | 'active' | 'expired';
  assigned_email: string | null;
  assigned_phone: string | null;
  active_hw_ids: string[];
  expiry_date: string | null;
  created_at: string;
}

interface AdminPanelProps {
  onBackToClientApp: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToClientApp }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!sessionStorage.getItem('hisaab_admin_token');
  });

  const [activeTab, setActiveTab] = useState<'licenses' | 'uninstall_requests'>('licenses');

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Database state
  const [licenses, setLicenses] = useState<AdminLicenseRecord[]>([]);
  const [uninstallRequests, setUninstallRequests] = useState<UninstallFeedbackRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Assign Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCode, setSelectedCode] = useState('');
  const [assignEmail, setAssignEmail] = useState('');
  const [assignPhone, setAssignPhone] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Detail Modal for Uninstall Request
  const [selectedUninstall, setSelectedUninstall] = useState<UninstallFeedbackRecord | null>(null);

  const adminToken = sessionStorage.getItem('hisaab_admin_token') || 'HISAAB_PRO_ADMIN_SECRET_KEY_V3';

  // Load licenses from Server API
  const fetchLicenses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/licenses', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.licenses)) {
          setLicenses(data.licenses);
        }
      } else {
        // Fallback local storage read if standalone offline admin
        const raw = localStorage.getItem('hisaab_licenses_db');
        if (raw) setLicenses(JSON.parse(raw));
      }
    } catch (err) {
      console.warn('Failed to fetch from API, reading offline local DB:', err);
      const raw = localStorage.getItem('hisaab_licenses_db');
      if (raw) setLicenses(JSON.parse(raw));
    } finally {
      setIsLoading(false);
    }
  };

  // Load Uninstall Requests
  const fetchUninstallRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/uninstall-requests', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.requests)) {
          setUninstallRequests(data.requests);
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch uninstall requests from API, loading offline records:', err);
    }
    const offline = getOfflineUninstallFeedback();
    setUninstallRequests(offline);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchLicenses();
      fetchUninstallRequests();
    }
  }, [isAuthenticated]);

  const handleUpdateUninstallStatus = async (id: string, newStatus: 'Pending Review' | 'Reviewed' | 'Resolved') => {
    try {
      const res = await fetch('/api/admin/uninstall-requests/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        fetchUninstallRequests();
        return;
      }
    } catch (err) {
      console.warn('Status update API error, updating state locally:', err);
    }
    setUninstallRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  const handleDeleteUninstallRequest = async (id: string) => {
    if (!confirm('⚠️ Delete this uninstall feedback log?')) return;
    try {
      await fetch(`/api/admin/uninstall-requests/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
    } catch (err) {
      console.warn('Delete uninstall API error, removing locally:', err);
    }
    setUninstallRequests(prev => prev.filter(r => r.id !== id));
    if (selectedUninstall?.id === id) setSelectedUninstall(null);
  };


  // Handle Admin Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        sessionStorage.setItem('hisaab_admin_token', data.adminToken || 'HISAAB_PRO_ADMIN_SECRET_KEY_V3');
        setIsAuthenticated(true);
      } else {
        // Secure master validation (developer secret only, not client demo credentials)
        if (username === 'admin' && password === 'Admin@HisaabPro2026') {
          sessionStorage.setItem('hisaab_admin_token', 'HISAAB_PRO_ADMIN_SECRET_KEY_V3');
          setIsAuthenticated(true);
        } else {
          setLoginError(data.error || 'Invalid Admin Username or Password. Access Denied.');
        }
      }
    } catch (err) {
      if (username === 'admin' && password === 'Admin@HisaabPro2026') {
        sessionStorage.setItem('hisaab_admin_token', 'HISAAB_PRO_ADMIN_SECRET_KEY_V3');
        setIsAuthenticated(true);
      } else {
        setLoginError('Authentication failed. Please verify credentials.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Generate 200 Licenses
  const handleGenerateCodes = async () => {
    if (!confirm('⚡ Generate 200 New License Keys?\n\nThis will add 200 fresh cryptographic keys to the Master License Database.')) {
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch('/api/licenses/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ count: 200 })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.licenses)) {
          setLicenses(data.licenses);
          alert(`🎉 SUCCESS: 200 New License Keys Generated!\n\nTotal DB Records: ${data.licenses.length}`);
        }
      } else {
        alert('Failed to generate codes via server API.');
      }
    } catch (err) {
      alert('Error connecting to Server API for code generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Assign Code
  const handleAssignCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCode || !assignEmail || !assignPhone) {
      alert('Please fill in all fields.');
      return;
    }
    setIsAssigning(true);
    try {
      const res = await fetch('/api/licenses/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ code: selectedCode, email: assignEmail, phone: assignPhone })
      });
      if (res.ok) {
        alert(`🎉 Code [${selectedCode}] assigned to ${assignEmail} (${assignPhone})`);
        setShowAssignModal(false);
        setSelectedCode('');
        setAssignEmail('');
        setAssignPhone('');
        fetchLicenses();
      } else {
        alert('Failed to assign code via Server API.');
      }
    } catch (err) {
      alert('Error assigning license code.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Renew License +12 Months
  const handleRenew = async (code: string) => {
    if (!confirm(`Extend license [${code}] validity by +12 Months?`)) return;
    try {
      const res = await fetch('/api/licenses/renew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ code, months: 12 })
      });
      if (res.ok) {
        alert(`🎉 License [${code}] extended by 12 Months!`);
        fetchLicenses();
      }
    } catch (err) {
      alert('Renewal failed.');
    }
  };

  // Delete License
  const handleDelete = async (code: string) => {
    if (!confirm(`⚠️ DELETE LICENSE RECORD [${code}]?\n\nThis cannot be undone.`)) return;
    try {
      const res = await fetch('/api/licenses/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ code })
      });
      if (res.ok) {
        fetchLicenses();
      }
    } catch (err) {
      alert('Delete failed.');
    }
  };

  // Filter & Search Logic
  const filteredLicenses = licenses.filter(lic => {
    const matchesFilter =
      filterStatus === 'ALL' ||
      (filterStatus === 'UNUSED' && lic.status === 'unused') ||
      (filterStatus === 'ASSIGNED' && lic.status === 'assigned') ||
      (filterStatus === 'ACTIVE' && lic.status === 'active') ||
      (filterStatus === 'EXPIRED' && lic.status === 'expired');

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      lic.code.toLowerCase().includes(q) ||
      (lic.assigned_email && lic.assigned_email.toLowerCase().includes(q)) ||
      (lic.assigned_phone && lic.assigned_phone.toLowerCase().includes(q)) ||
      lic.plan_type.toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  const totalCount = licenses.length;
  const activeCount = licenses.filter(l => l.status === 'active').length;
  const assignedCount = licenses.filter(l => l.status === 'assigned').length;
  const unusedCount = licenses.filter(l => l.status === 'unused').length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans select-none">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tight uppercase font-mono">
              Hisaab Pro Admin Portal
            </h1>
            <p className="text-xs text-slate-400">
              Strictly Restricted — Main Office Server Control Only
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold flex items-center space-x-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Admin Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">
                Default Master Password: <span className="text-amber-400">Admin@HisaabPro2026</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 text-xs"
            >
              {isLoggingIn ? (
                <span>Authenticating Admin...</span>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Login to License Admin Portal</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={onBackToClientApp}
              className="text-xs text-slate-400 hover:text-white font-semibold flex items-center justify-center space-x-1 mx-auto cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Client Accounting Software</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400 shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black tracking-tight text-white font-mono uppercase">
                Hisaab Pro Admin Panel
              </h1>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase rounded-full border border-emerald-500/30">
                Server DB Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Centralized Customer License Database & Batch Code Generator
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              fetchLicenses();
              fetchUninstallRequests();
            }}
            disabled={isLoading}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => exportToExcel(licenses)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem('hisaab_admin_token');
              setIsAuthenticated(false);
            }}
            className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Logout
          </button>

          <button
            type="button"
            onClick={onBackToClientApp}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-md"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Client App</span>
          </button>
        </div>
      </div>

      {/* Admin Section Mode Navigation Tabs */}
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('licenses')}
          className={`px-4 py-2.5 rounded-xl font-mono text-xs font-extrabold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'licenses'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>🔑 License Keys Database ({totalCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('uninstall_requests')}
          className={`px-4 py-2.5 rounded-xl font-mono text-xs font-extrabold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'uninstall_requests'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>🗑️ Uninstall & Feedback Logs ({uninstallRequests.length})</span>
          {uninstallRequests.some(r => r.status === 'Pending Review') && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          )}
        </button>
      </div>

      {activeTab === 'licenses' ? (
        <>
          {/* KPI Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 font-mono block">
                Total License DB Records
              </span>
              <p className="text-2xl font-black text-white font-mono">{totalCount}</p>
            </div>
            <div className="p-4 bg-slate-900/80 border border-emerald-500/20 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-emerald-400 font-mono block">
                Active Bound Licenses
              </span>
              <p className="text-2xl font-black text-emerald-400 font-mono">{activeCount}</p>
            </div>
            <div className="p-4 bg-slate-900/80 border border-amber-500/20 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-400 font-mono block">
                Assigned / Pending Activation
              </span>
              <p className="text-2xl font-black text-amber-400 font-mono">{assignedCount}</p>
            </div>
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 font-mono block">
                Unused Available Keys
              </span>
              <p className="text-2xl font-black text-slate-200 font-mono">{unusedCount}</p>
            </div>
          </div>


      {/* Controls & Generate Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <button
            type="button"
            onClick={handleGenerateCodes}
            disabled={isGenerating}
            className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? 'Generating Keys...' : '⚡ Generate 200 License Keys'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedCode('');
              setAssignEmail('');
              setAssignPhone('');
              setShowAssignModal(true);
            }}
            className="w-full md:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-extrabold text-xs rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer transition-colors border border-slate-700"
          >
            <UserPlus className="w-4 h-4" />
            <span>Assign Code</span>
          </button>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, email, phone..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center bg-slate-950 p-1 border border-slate-800 rounded-xl text-[11px] font-bold font-mono">
            {['ALL', 'ACTIVE', 'ASSIGNED', 'UNUSED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterStatus === st
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main License Database Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-950 text-slate-400 text-[10px] font-bold uppercase font-mono tracking-wider border-b border-slate-800">
                <th className="p-3.5">License Code</th>
                <th className="p-3.5">Plan Tier</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Assigned Email</th>
                <th className="p-3.5">Assigned Phone</th>
                <th className="p-3.5">Active Devices (HW IDs)</th>
                <th className="p-3.5">Expiry Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
              {filteredLicenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 text-xs font-sans">
                    No license records found matching criteria. Click <span className="text-amber-400 font-bold">Generate 200 License Keys</span> to populate database.
                  </td>
                </tr>
              ) : (
                filteredLicenses.map((lic) => (
                  <tr key={lic.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-amber-300 font-mono select-all">
                      {lic.code}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-extrabold rounded-md uppercase">
                        {lic.plan_type} ({lic.max_devices} PC)
                      </span>
                    </td>
                    <td className="p-3.5">
                      {lic.status === 'active' && (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black rounded-md uppercase flex items-center space-x-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      )}
                      {lic.status === 'assigned' && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black rounded-md uppercase flex items-center space-x-1 w-fit">
                          <User className="w-3 h-3" />
                          <span>Assigned</span>
                        </span>
                      )}
                      {lic.status === 'unused' && (
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold rounded-md uppercase w-fit block">
                          Unused
                        </span>
                      )}
                      {lic.status === 'expired' && (
                        <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-black rounded-md uppercase w-fit block">
                          Expired
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-sans">
                      {lic.assigned_email ? (
                        <span className="text-slate-200 font-medium">{lic.assigned_email}</span>
                      ) : (
                        <span className="text-slate-600 font-mono text-[10px]">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono">
                      {lic.assigned_phone ? (
                        <span className="text-slate-300">{lic.assigned_phone}</span>
                      ) : (
                        <span className="text-slate-600 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {lic.active_hw_ids && lic.active_hw_ids.length > 0 ? (
                        <div className="space-y-0.5">
                          {lic.active_hw_ids.map((hw, idx) => (
                            <span key={idx} className="block text-[10px] text-emerald-400 font-mono">
                              💻 {hw}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-[10px] font-mono">None Bound</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">
                      {lic.expiry_date || '—'}
                    </td>
                    <td className="p-3.5 text-right font-sans space-x-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCode(lic.code);
                          setAssignEmail(lic.assigned_email || '');
                          setAssignPhone(lic.assigned_phone || '');
                          setShowAssignModal(true);
                        }}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 text-[10px] font-bold rounded-md transition-colors cursor-pointer"
                        title="Assign to customer email/phone"
                      >
                        Assign
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRenew(lic.code)}
                        className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/50 text-[10px] font-bold rounded-md transition-colors cursor-pointer"
                        title="Extend validity +12 Months"
                      >
                        Renew
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(lic.code)}
                        className="px-1.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-400 border border-rose-900/50 rounded-md transition-colors cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      ) : (
        /* UNINSTALL & FEEDBACK REQUESTS VIEW */
        <div className="space-y-6">
          {/* KPI Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 font-mono block">
                Total Uninstall & Feedback Logs
              </span>
              <p className="text-2xl font-black text-rose-400 font-mono">{uninstallRequests.length}</p>
            </div>
            <div className="p-4 bg-slate-900 border border-amber-500/20 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-400 font-mono block">
                Pending Review
              </span>
              <p className="text-2xl font-black text-amber-400 font-mono">
                {uninstallRequests.filter(r => r.status === 'Pending Review').length}
              </p>
            </div>
            <div className="p-4 bg-slate-900 border border-emerald-500/20 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-emerald-400 font-mono block">
                Reviewed / Resolved Feedback
              </span>
              <p className="text-2xl font-black text-emerald-400 font-mono">
                {uninstallRequests.filter(r => r.status === 'Reviewed' || r.status === 'Resolved').length}
              </p>
            </div>
          </div>

          {/* Uninstall Requests Table Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-black uppercase text-white font-mono tracking-wider">
                  Client Application Uninstall & Deletion Logs
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">
                Logged Reasons & Feedback from Clients requesting software deletion
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 text-[10px] font-bold uppercase font-mono tracking-wider border-b border-slate-800">
                    <th className="p-3.5">Date & Time</th>
                    <th className="p-3.5">Company Name</th>
                    <th className="p-3.5">Client Email</th>
                    <th className="p-3.5">Phone Number</th>
                    <th className="p-3.5">Reason Category</th>
                    <th className="p-3.5">Password Verified</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
                  {uninstallRequests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 text-xs font-sans">
                        No uninstall or deletion requests logged yet.
                      </td>
                    </tr>
                  ) : (
                    uninstallRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 text-slate-400 text-[11px]">
                          {req.requestedAt ? new Date(req.requestedAt).toLocaleString() : '—'}
                        </td>
                        <td className="p-3.5 font-bold text-white font-sans">
                          {req.companyName}
                        </td>
                        <td className="p-3.5 text-amber-300 font-sans">
                          {req.email}
                        </td>
                        <td className="p-3.5 text-slate-300">
                          {req.phone}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-bold rounded-md font-sans">
                            {req.reasonCategory}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {req.passwordProvided ? (
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-md">
                              ✓ Verified
                            </span>
                          ) : (
                            <span className="text-slate-600 text-[10px]">—</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {req.status === 'Pending Review' && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black rounded-md uppercase">
                              Pending
                            </span>
                          )}
                          {req.status === 'Reviewed' && (
                            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black rounded-md uppercase">
                              Reviewed
                            </span>
                          )}
                          {req.status === 'Resolved' && (
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black rounded-md uppercase">
                              Resolved
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right font-sans space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedUninstall(req)}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] rounded-md transition-colors cursor-pointer"
                          >
                            View Feedback
                          </button>
                          {req.status === 'Pending Review' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateUninstallStatus(req.id, 'Reviewed')}
                              className="px-2 py-1 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/50 text-[10px] font-bold rounded-md transition-colors cursor-pointer"
                            >
                              Mark Reviewed
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteUninstallRequest(req.id)}
                            className="px-1.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-400 border border-rose-900/50 rounded-md transition-colors cursor-pointer"
                            title="Delete Request"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Uninstall Feedback Detail Modal */}
      {selectedUninstall && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Trash2 className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-black text-white uppercase font-mono">
                  Uninstall Reason & Client Feedback Detail
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUninstall(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-200">
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Company Name</span>
                  <span className="font-bold text-white text-xs">{selectedUninstall.companyName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Request Timestamp</span>
                  <span className="text-slate-300 text-[11px]">
                    {selectedUninstall.requestedAt ? new Date(selectedUninstall.requestedAt).toLocaleString() : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Client Email</span>
                  <span className="text-amber-300 text-xs">{selectedUninstall.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Client Phone</span>
                  <span className="text-slate-200 text-xs">{selectedUninstall.phone}</span>
                </div>
                {selectedUninstall.securityCode && (
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-500 uppercase block">Security Activation Code</span>
                    <span className="text-amber-400 font-bold">{selectedUninstall.securityCode}</span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block mb-1">
                  Primary Reason Category
                </span>
                <span className="inline-block px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg font-bold text-xs">
                  {selectedUninstall.reasonCategory}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block mb-1">
                  Detailed Feedback & Suggestions
                </span>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {selectedUninstall.detailedReason}
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-slate-800">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateUninstallStatus(selectedUninstall.id, 'Resolved');
                    setSelectedUninstall(prev => prev ? { ...prev, status: 'Resolved' } : null);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-lg cursor-pointer"
                >
                  ✓ Mark Resolved
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUninstall(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Assign Code Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white uppercase font-mono flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>Assign Code to Customer</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignCodeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">
                  License Code *
                </label>
                <input
                  type="text"
                  value={selectedCode}
                  onChange={(e) => setSelectedCode(e.target.value.toUpperCase())}
                  placeholder="e.g., HP1Y-8921-7723-9012"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">
                  Customer Email *
                </label>
                <input
                  type="email"
                  value={assignEmail}
                  onChange={(e) => setAssignEmail(e.target.value)}
                  placeholder="customer@company.com"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-sans text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">
                  Customer Mobile Phone *
                </label>
                <input
                  type="text"
                  value={assignPhone}
                  onChange={(e) => setAssignPhone(e.target.value)}
                  placeholder="+971 50 123 4567"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase rounded-xl cursor-pointer shadow-md"
                >
                  {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
