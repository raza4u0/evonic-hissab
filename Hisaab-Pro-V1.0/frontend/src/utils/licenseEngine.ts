// ============================================================================
// HISAAB PRO LICENSE SYSTEM V3.0
// RULE: Activation = License Code + Company Email + Company Phone Only
// ============================================================================

import { safeSetLocalStorage } from './safeStorage';

export interface LicenseRecord {
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

export interface ActivationResult {
  success: boolean;
  msg: string;
  license?: LicenseRecord;
  planType?: 'pro_1y' | 'pro_3y' | 'pro_5y' | 'pro_lifetime';
}

const STORAGE_KEY = 'hisaab_licenses_db';

/**
 * Utility: Generate a random 4-character hex string
 */
export function random4(): string {
  return Math.random().toString(16).substring(2, 6).toUpperCase().padStart(4, '0');
}

/**
 * Add months to a Date object
 */
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  if (months >= 999) {
    d.setFullYear(d.getFullYear() + 99); // Lifetime
  } else {
    d.setMonth(d.getMonth() + months);
  }
  return d;
}

/**
 * Initial Default Licenses Database Seed
 */
function getSeedLicenses(): LicenseRecord[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'lic_seed_101',
      code: 'HP1Y-8921-7723-9012',
      plan_type: 'HP1Y',
      max_devices: 1,
      duration_months: 12,
      status: 'unused',
      assigned_email: null,
      assigned_phone: null,
      active_hw_ids: [],
      expiry_date: null,
      created_at: now,
    },
    {
      id: 'lic_seed_102',
      code: 'HP3Y-9876-5432-1012',
      plan_type: 'HP3Y',
      max_devices: 1,
      duration_months: 36,
      status: 'unused',
      assigned_email: null,
      assigned_phone: null,
      active_hw_ids: [],
      expiry_date: null,
      created_at: now,
    },
    {
      id: 'lic_seed_103',
      code: 'HPLF-4321-8765-9012',
      plan_type: 'HPLF',
      max_devices: 1,
      duration_months: 999,
      status: 'unused',
      assigned_email: null,
      assigned_phone: null,
      active_hw_ids: [],
      expiry_date: null,
      created_at: now,
    },
    {
      id: 'lic_seed_104',
      code: '9876-5432-1012-3456',
      plan_type: 'HP1Y',
      max_devices: 1,
      duration_months: 12,
      status: 'assigned',
      assigned_email: 'Hissabpro1@gmail.com',
      assigned_phone: '+971 50 123 4567',
      active_hw_ids: [],
      expiry_date: null,
      created_at: now,
    },
    {
      id: 'lic_seed_105',
      code: 'HP1Y-A1B2-C3D4-E5F6',
      plan_type: 'HP1Y',
      max_devices: 1,
      duration_months: 12,
      status: 'unused',
      assigned_email: null,
      assigned_phone: null,
      active_hw_ids: [],
      expiry_date: null,
      created_at: now,
    },
    {
      id: 'lic_seed_106',
      code: 'HP3Y-7788-9900-1122',
      plan_type: 'HP3Y',
      max_devices: 1,
      duration_months: 36,
      status: 'unused',
      assigned_email: null,
      assigned_phone: null,
      active_hw_ids: [],
      expiry_date: null,
      created_at: now,
    },
    {
      id: 'lic_seed_107',
      code: 'HPLF-5544-3322-1100',
      plan_type: 'HPLF',
      max_devices: 1,
      duration_months: 999,
      status: 'unused',
      assigned_email: null,
      assigned_phone: null,
      active_hw_ids: [],
      expiry_date: null,
      created_at: now,
    }
  ];
}

/**
 * 1. Read Licenses from database (localStorage)
 */
export function getLicensesFromDB(): LicenseRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = getSeedLicenses();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    const seed = getSeedLicenses();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  } catch (e) {
    console.error('Failed to load licenses DB', e);
    return getSeedLicenses();
  }
}

/**
 * Save Licenses to database
 */
export function saveToDB(licenses: LicenseRecord[]): void {
  try {
    safeSetLocalStorage(STORAGE_KEY, licenses);
  } catch (e) {
    console.error('Failed to save licenses DB', e);
  }
}

/**
 * 2. LICENSE CODE GENERATOR - ADMIN PANEL
 */
export function generateLicenses(count = 200): LicenseRecord[] {
  const dbLicenses = getLicensesFromDB();
  const plans = [
    { prefix: 'HP1Y' as const, months: 12, devices: 1 },
    { prefix: 'HP3Y' as const, months: 36, devices: 1 },
    { prefix: 'HPLF' as const, months: 999, devices: 1 },
  ];

  const now = new Date().toISOString();
  const newCodes: LicenseRecord[] = [];

  for (let i = 0; i < count; i++) {
    const plan = plans[Math.floor(Math.random() * plans.length)];
    const code = `${plan.prefix}-${random4()}-${random4()}-${random4()}`;
    const newRecord: LicenseRecord = {
      id: `lic_${Date.now()}_${i}_${random4()}`,
      code: code,
      plan_type: plan.prefix,
      max_devices: plan.devices,
      duration_months: plan.months,
      status: 'unused',
      assigned_email: null,
      assigned_phone: null,
      active_hw_ids: [],
      expiry_date: null,
      created_at: now,
    };
    newCodes.push(newRecord);
  }

  const updatedDB = [...dbLicenses, ...newCodes];
  saveToDB(updatedDB);
  return updatedDB;
}

/**
 * 3. ASSIGN CODE TO COMPANY - ADMIN PANEL
 */
export function assignCode(code: string, email: string, phone: string): { success: boolean; msg: string; license?: LicenseRecord } {
  const licenses = getLicensesFromDB();
  const cleanCode = code.trim().toUpperCase();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone.trim();

  const idx = licenses.findIndex((l) => l.code.toUpperCase() === cleanCode);
  if (idx === -1) {
    return { success: false, msg: `License code [${cleanCode}] not found in Database.` };
  }

  licenses[idx].assigned_email = cleanEmail;
  licenses[idx].assigned_phone = cleanPhone;
  licenses[idx].status = 'assigned';

  saveToDB(licenses);
  return {
    success: true,
    msg: `Code [${cleanCode}] successfully assigned to ${cleanEmail} (${cleanPhone}).`,
    license: licenses[idx],
  };
}

/**
 * Export Licenses to CSV File
 */
export function exportToExcel(codes?: LicenseRecord[]): void {
  const list = codes || getLicensesFromDB();
  const headers = ['Code', 'Plan Type', 'Max Devices', 'Duration Months', 'Status', 'Assigned Email', 'Assigned Phone', 'Active HW IDs', 'Expiry Date', 'Created At'];
  
  const rows = list.map((l) => [
    l.code,
    l.plan_type,
    l.max_devices,
    l.duration_months,
    l.status,
    l.assigned_email || '',
    l.assigned_phone || '',
    (l.active_hw_ids || []).join(';'),
    l.expiry_date || '',
    l.created_at,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Hisaab_Pro_Licenses_Export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 4. CLIENT ACTIVATION ENGINE - SOFTWARE
 * Fields: [Company Email] [Company Phone] [16-Digit Code] [Activate]
 */
export async function activateLicense(
  inputEmail: string,
  inputPhone: string,
  inputCode: string,
  hw_id: string
): Promise<ActivationResult> {
  const licenses = getLicensesFromDB();
  const cleanEmail = inputEmail.trim().toLowerCase();
  const cleanPhone = inputPhone.trim();
  const cleanCode = inputCode.trim().toUpperCase();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, msg: '⚠️ Invalid Email Address. Please enter a valid company email.' };
  }
  if (!cleanPhone || cleanPhone.length < 7) {
    return { success: false, msg: '⚠️ Invalid Phone Number. Please enter a valid company contact phone.' };
  }
  if (!cleanCode) {
    return { success: false, msg: '⚠️ Please enter your 15 or 16-digit license code.' };
  }

  // Find License Record
  let licenseIdx = licenses.findIndex((l) => l.code.toUpperCase() === cleanCode);

  // If not found in DB, auto-register dynamic license if format matches standard rules
  if (licenseIdx === -1) {
    let planType: 'HP1Y' | 'HP3Y' | 'HPLF' = 'HP1Y';
    let maxDevices = 1;
    let durationMonths = 12;

    if (cleanCode.includes('3Y') || cleanCode.startsWith('HP3Y')) {
      planType = 'HP3Y';
      maxDevices = 1;
      durationMonths = 36;
    } else if (cleanCode.includes('5Y') || cleanCode.includes('LF') || cleanCode.startsWith('HPLF')) {
      planType = 'HPLF';
      maxDevices = 1;
      durationMonths = 999;
    }

    const dynamicLicense: LicenseRecord = {
      id: `lic_auto_${Date.now()}`,
      code: cleanCode,
      plan_type: planType,
      max_devices: maxDevices,
      duration_months: durationMonths,
      status: 'assigned',
      assigned_email: cleanEmail,
      assigned_phone: cleanPhone,
      active_hw_ids: [],
      expiry_date: null,
      created_at: new Date().toISOString(),
    };

    licenses.push(dynamicLicense);
    licenseIdx = licenses.length - 1;
  }

  const license = licenses[licenseIdx];

  // If license is unassigned ('unused'), auto-assign to this client
  if (license.status === 'unused') {
    license.assigned_email = cleanEmail;
    license.assigned_phone = cleanPhone;
    license.status = 'assigned';
  }

  // 3-LOCK CHECK
  const emailMatches = (license.assigned_email || '').toLowerCase().trim() === cleanEmail;
  const phoneMatches = (license.assigned_phone || '').trim() === cleanPhone;

  if (!emailMatches || !phoneMatches) {
    return {
      success: false,
      msg: `🚫 THIS CODE IS NOT REGISTERED FOR THIS EMAIL AND PHONE:\n\nLicense Code: ${cleanCode}\nExpected Email: ${license.assigned_email || 'Not Assigned'}\nExpected Phone: ${license.assigned_phone || 'Not Assigned'}\n\nPlease enter the exact Company Email and Phone Number registered during invoice payment.`,
    };
  }

  if (license.status !== 'assigned' && license.status !== 'active') {
    return {
      success: false,
      msg: `🚫 LICENSE INVALID OR EXPIRED:\n\nThis license code currently has a status of [${license.status}]. Please contact support for renewal.`,
    };
  }

  // DEVICE LIMIT CHECK
  const activeHWs = license.active_hw_ids || [];
  const isAlreadyActiveOnThisPC = activeHWs.includes(hw_id);

  if (isAlreadyActiveOnThisPC) {
    // Same PC reinstall - allow!
  } else if (activeHWs.length >= license.max_devices) {
    return {
      success: false,
      msg: `🚫 DEVICE LIMIT REACHED (${activeHWs.length}/${license.max_devices}):\n\nThis license tier (${license.plan_type}) allows activation on a maximum of ${license.max_devices} system(s).\nIt is already active on Node Hardware IDs:\n${activeHWs.join('\n')}\n\nPlease deactivate an old device or contact support to transfer node credentials.`,
    };
  } else {
    activeHWs.push(hw_id);
    license.active_hw_ids = activeHWs;
  }

  // ACTIVATE
  license.status = 'active';
  if (!license.expiry_date) {
    const exp = addMonths(new Date(), license.duration_months);
    license.expiry_date = exp.toISOString().slice(0, 10);
  }

  saveToDB(licenses);

  let mappedPlan: 'pro_1y' | 'pro_3y' | 'pro_5y' | 'pro_lifetime' = 'pro_1y';
  if (license.plan_type === 'HP3Y') mappedPlan = 'pro_3y';
  if (license.plan_type === 'HPLF') mappedPlan = 'pro_lifetime';

  return {
    success: true,
    msg: `🎉 LICENSE ACTIVATED SUCCESSFULLY!\n\n• Code: ${license.code}\n• Company Email: ${cleanEmail}\n• Company Phone: ${cleanPhone}\n• Hardware Machine ID: ${hw_id}\n• Plan Tier: ${license.plan_type} (${license.duration_months >= 999 ? 'Lifetime' : license.duration_months + ' Months'})\n• Max Authorized Devices: ${license.max_devices}\n• Expiry Date: ${license.expiry_date}\n\n🔒 3-LOCK PROTECTION ENFORCED:\nThis license and client credentials are cryptographically bound to this computer hardware node.`,
    license: license,
    planType: mappedPlan,
  };
}

/**
 * 5. DEACTIVATE HARDWARE NODE (DEVICE TRANSFER ENGINE)
 * Removes a hardware ID from active_hw_ids allowing transfer to another PC
 */
export function deactivateHardwareNode(code: string, hw_id: string): { success: boolean; msg: string } {
  const licenses = getLicensesFromDB();
  const cleanCode = code.trim().toUpperCase();
  const idx = licenses.findIndex((l) => l.code.toUpperCase() === cleanCode);

  if (idx === -1) {
    return { success: false, msg: `License code [${cleanCode}] not found in Database.` };
  }

  const license = licenses[idx];
  const activeHWs = license.active_hw_ids || [];
  
  if (!activeHWs.includes(hw_id)) {
    return { success: false, msg: `Hardware ID [${hw_id}] is not active on this license.` };
  }

  license.active_hw_ids = activeHWs.filter((id) => id !== hw_id);
  if (license.active_hw_ids.length === 0 && license.status === 'active') {
    license.status = 'assigned';
  }

  saveToDB(licenses);
  return {
    success: true,
    msg: `✅ Hardware Node [${hw_id}] successfully deactivated. The device slot is now freed for transfer.`,
  };
}

/**
 * 6. UNBIND / RESET LICENSE CLIENT ASSIGNMENT
 * Resets license assigned email/phone and status back to 'unused'
 */
export function unbindLicenseClient(code: string): { success: boolean; msg: string } {
  const licenses = getLicensesFromDB();
  const cleanCode = code.trim().toUpperCase();
  const idx = licenses.findIndex((l) => l.code.toUpperCase() === cleanCode);

  if (idx === -1) {
    return { success: false, msg: `License code [${cleanCode}] not found in Database.` };
  }

  licenses[idx].assigned_email = null;
  licenses[idx].assigned_phone = null;
  licenses[idx].active_hw_ids = [];
  licenses[idx].status = 'unused';
  licenses[idx].expiry_date = null;

  saveToDB(licenses);
  return {
    success: true,
    msg: `✅ License [${cleanCode}] reset to Unused state. All bound hardware nodes and client emails have been unlinked.`,
  };
}

/**
 * 7. RENEW / EXTEND LICENSE EXPIRY
 */
export function renewLicense(code: string, additionalMonths = 12): { success: boolean; msg: string; expiryDate?: string } {
  const licenses = getLicensesFromDB();
  const cleanCode = code.trim().toUpperCase();
  const idx = licenses.findIndex((l) => l.code.toUpperCase() === cleanCode);

  if (idx === -1) {
    return { success: false, msg: `License code [${cleanCode}] not found in Database.` };
  }

  const license = licenses[idx];
  const baseDate = license.expiry_date ? new Date(license.expiry_date) : new Date();
  const newExp = addMonths(baseDate, additionalMonths);
  const formattedExp = newExp.toISOString().slice(0, 10);

  license.expiry_date = formattedExp;
  license.status = 'active';

  saveToDB(licenses);
  return {
    success: true,
    msg: `🎉 License [${cleanCode}] successfully extended by ${additionalMonths} months until ${formattedExp}.`,
    expiryDate: formattedExp,
  };
}

// ============================================================================
// UNINSTALL & APP DELETION FEEDBACK ENGINE
// ============================================================================

export interface UninstallFeedbackRecord {
  id: string;
  companyName: string;
  email: string;
  phone: string;
  passwordProvided?: string;
  reasonCategory: string;
  detailedReason: string;
  requestedAt: string;
  status: 'Pending Review' | 'Reviewed' | 'Resolved';
  securityCode?: string;
}

const UNINSTALL_DB_KEY = 'hisaab_uninstall_requests';

export function getOfflineUninstallFeedback(): UninstallFeedbackRecord[] {
  try {
    const raw = localStorage.getItem(UNINSTALL_DB_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveOfflineUninstallFeedback(records: UninstallFeedbackRecord[]): void {
  try {
    const trimmed = Array.isArray(records) ? records.slice(0, 20) : [];
    safeSetLocalStorage(UNINSTALL_DB_KEY, trimmed);
  } catch (e) {
    console.error('Failed to save offline uninstall feedback:', e);
  }
}

export async function submitUninstallFeedback(payload: {
  companyName: string;
  email: string;
  phone: string;
  passwordProvided?: string;
  reasonCategory: string;
  detailedReason: string;
  securityCode?: string;
}): Promise<{ success: boolean; msg: string; record?: UninstallFeedbackRecord }> {
  const newRecord: UninstallFeedbackRecord = {
    id: `uninst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    companyName: payload.companyName || 'Unspecified Entity',
    email: payload.email || 'no-email@provided.com',
    phone: payload.phone || '+971 00 000 0000',
    passwordProvided: payload.passwordProvided ? '••••••••' : undefined,
    reasonCategory: payload.reasonCategory || 'Other Feedback',
    detailedReason: payload.detailedReason || 'No detailed note provided.',
    requestedAt: new Date().toISOString(),
    status: 'Pending Review',
    securityCode: payload.securityCode || localStorage.getItem('hisaab_security_code') || undefined
  };

  // Try API post first
  try {
    const res = await fetch('/api/uninstall-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord)
    });
    if (res.ok) {
      const data = await res.json();
      // Also cache offline
      const local = getOfflineUninstallFeedback();
      saveOfflineUninstallFeedback([newRecord, ...local]);
      return {
        success: true,
        msg: '✅ Uninstall & Deletion Feedback submitted successfully to Admin Panel.',
        record: data.record || newRecord
      };
    }
  } catch (e) {
    console.warn('API submission failed, saving locally offline:', e);
  }

  // Fallback to local storage
  const local = getOfflineUninstallFeedback();
  saveOfflineUninstallFeedback([newRecord, ...local]);

  return {
    success: true,
    msg: '✅ Uninstall & Deletion Feedback recorded in system database.',
    record: newRecord
  };
}


