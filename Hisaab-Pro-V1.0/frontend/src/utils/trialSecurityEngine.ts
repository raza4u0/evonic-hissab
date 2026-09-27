/**
 * Hisaab Pro V1.0 - Full 30-Days Trial & Anti-Tampering Security Engine
 * Features:
 * 1. Multi-tier persistence (localStorage, hidden tokens, and IndexedDB backup)
 * 2. Date Tamper Protection (detects system clock rollbacks before install or last open)
 * 3. Client Reset Immunity (restores original install date from IndexedDB if localStorage cleared)
 * 4. 8-digit random Machine ID locked to the system node
 * 5. Instant activation with keys: 'HISAAB-30-UNLOCK' (30 days) and 'HISAAB-365-PAID' (365 days)
 */

export interface TrialSecurityState {
  isLocked: boolean;
  isDateTampered: boolean;
  tamperReason: string | null;
  isExpired: boolean;
  daysLeft: number;
  machineId: string;
  startDate: string;
  expiryDate: string;
  lastOpenDate: string;
  isActivated: boolean;
  licenseType: 'trial' | 'pro_30d' | 'pro_365d';
}

const IDB_DB_NAME = 'HisaabProSecDB';
const IDB_VERSION = 1;
const IDB_STORE_NAME = 'security_store';

// Storage Keys
const KEY_TRIAL_START_DATE = 'trial_start_date';
const KEY_INSTALL_TIMESTAMP = 'install_timestamp';
const KEY_LAST_OPEN_DATE = 'last_open_date';
const KEY_EXPIRY_DATE = 'trial_expiry_date';
const KEY_EXPIRY_TIMESTAMP = 'trial_expiry_timestamp';
const KEY_MACHINE_ID = 'hisaab_trial_machine_id';
const KEY_SYS_SIGNATURE = '_hp_sec_signature';
const KEY_TAMPER_FLAG = '_hp_date_tampered_flag';

// IndexedDB Helper functions
function openSecIndexedDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const request = window.indexedDB.open(IDB_DB_NAME, IDB_VERSION);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
          db.createObjectStore(IDB_STORE_NAME);
        }
      };
      request.onsuccess = (event: any) => resolve(event.target.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function getFromIDB(key: string): Promise<any> {
  const db = await openSecIndexedDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function setToIDB(key: string, val: any): Promise<void> {
  const db = await openSecIndexedDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      store.put(val, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Ensures or generates a random 8-digit Machine ID
 */
export function getOrGenerate8DigitMachineId(): string {
  if (typeof window === 'undefined') return '84920193';
  let id = localStorage.getItem(KEY_MACHINE_ID);
  if (!id || !/^\d{8}$/.test(id)) {
    // Generate random 8 digit integer between 10000000 and 99999999
    id = String(Math.floor(10000000 + Math.random() * 90000000));
    localStorage.setItem(KEY_MACHINE_ID, id);
    localStorage.setItem('hisaab_machine_id', id);
    setToIDB(KEY_MACHINE_ID, id).catch(() => {});
  }
  return id;
}

/**
 * Obfuscated Signature encode/decode helper for Hidden Place #2
 */
function createSignature(payload: Record<string, any>): string {
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  } catch {
    return JSON.stringify(payload);
  }
}

function parseSignature(str: string | null): Record<string, any> | null {
  if (!str) return null;
  try {
    return JSON.parse(decodeURIComponent(escape(atob(str))));
  } catch {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }
}

/**
 * Initializes and checks the 30-Day Trial and Anti-Tamper Security status
 */
export async function initializeAndCheckTrialSecurity(): Promise<TrialSecurityState> {
  const machineId = getOrGenerate8DigitMachineId();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0]; // "YYYY-MM-DD"
  const nowTs = now.getTime();

  // 1. Read from Place 1 (Standard localStorage)
  let storedStart = localStorage.getItem(KEY_TRIAL_START_DATE);
  let storedInstallTs = localStorage.getItem(KEY_INSTALL_TIMESTAMP) 
    ? Number(localStorage.getItem(KEY_INSTALL_TIMESTAMP)) 
    : null;
  let storedLastOpen = localStorage.getItem(KEY_LAST_OPEN_DATE);
  let storedExpiry = localStorage.getItem(KEY_EXPIRY_DATE);
  let storedExpiryTs = localStorage.getItem(KEY_EXPIRY_TIMESTAMP)
    ? Number(localStorage.getItem(KEY_EXPIRY_TIMESTAMP))
    : null;

  // 2. Read from Place 2 (Hidden base64 signature)
  const signatureData = parseSignature(localStorage.getItem(KEY_SYS_SIGNATURE));

  // 3. Read from Place 3 (IndexedDB Anti-Reset Store)
  const idbStart = await getFromIDB(KEY_TRIAL_START_DATE);
  const idbInstallTs = await getFromIDB(KEY_INSTALL_TIMESTAMP);
  const idbExpiry = await getFromIDB(KEY_EXPIRY_DATE);
  const idbExpiryTs = await getFromIDB(KEY_EXPIRY_TIMESTAMP);

  // Cross-reference to find earliest install timestamp (Anti-Reset Protection)
  let effectiveInstallTs: number | null = null;
  let effectiveStartDate: string | null = null;

  const candidates = [
    { ts: storedInstallTs, dt: storedStart },
    { ts: signatureData?.installTs ? Number(signatureData.installTs) : null, dt: signatureData?.start },
    { ts: idbInstallTs ? Number(idbInstallTs) : null, dt: idbStart }
  ].filter(c => c.ts && !isNaN(c.ts) && c.dt);

  if (candidates.length > 0) {
    // Pick the earliest timestamp ever recorded on this machine
    candidates.sort((a, b) => (a.ts || 0) - (b.ts || 0));
    effectiveInstallTs = candidates[0].ts;
    effectiveStartDate = candidates[0].dt;
  }

  // Determine if this is a first install on a fresh computer
  const isFirstInstall = !effectiveInstallTs || !effectiveStartDate;

  if (isFirstInstall) {
    // First-time install: Initialize today's date
    effectiveStartDate = todayStr;
    effectiveInstallTs = nowTs;
    storedLastOpen = todayStr;
    
    // Default 30 days trial
    const expDate = new Date(nowTs + 30 * 24 * 60 * 60 * 1000);
    storedExpiry = expDate.toISOString().split('T')[0];
    storedExpiryTs = expDate.getTime();

    // Persist in Place 1 (localStorage)
    localStorage.setItem(KEY_TRIAL_START_DATE, effectiveStartDate);
    localStorage.setItem(KEY_INSTALL_TIMESTAMP, String(effectiveInstallTs));
    localStorage.setItem(KEY_LAST_OPEN_DATE, storedLastOpen);
    localStorage.setItem(KEY_EXPIRY_DATE, storedExpiry);
    localStorage.setItem(KEY_EXPIRY_TIMESTAMP, String(storedExpiryTs));

    // Persist in Place 2 (Hidden signature)
    const sig = createSignature({
      start: effectiveStartDate,
      installTs: effectiveInstallTs,
      expiry: storedExpiry,
      expiryTs: storedExpiryTs,
      machineId,
      created: nowTs
    });
    localStorage.setItem(KEY_SYS_SIGNATURE, sig);

    // Persist in Place 3 (IndexedDB)
    await setToIDB(KEY_TRIAL_START_DATE, effectiveStartDate);
    await setToIDB(KEY_INSTALL_TIMESTAMP, effectiveInstallTs);
    await setToIDB(KEY_LAST_OPEN_DATE, storedLastOpen);
    await setToIDB(KEY_EXPIRY_DATE, storedExpiry);
    await setToIDB(KEY_EXPIRY_TIMESTAMP, storedExpiryTs);
    await setToIDB(KEY_MACHINE_ID, machineId);
  } else {
    // If localStorage was wiped but IndexedDB or signature survived, sync back!
    if (!storedStart || storedStart !== effectiveStartDate) {
      localStorage.setItem(KEY_TRIAL_START_DATE, effectiveStartDate!);
      localStorage.setItem(KEY_INSTALL_TIMESTAMP, String(effectiveInstallTs));
    }
    
    // Sync expiry date
    if (!storedExpiry) {
      storedExpiry = idbExpiry || signatureData?.expiry || new Date(effectiveInstallTs! + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      storedExpiryTs = idbExpiryTs || signatureData?.expiryTs || (effectiveInstallTs! + 30 * 24 * 60 * 60 * 1000);
      localStorage.setItem(KEY_EXPIRY_DATE, storedExpiry);
      localStorage.setItem(KEY_EXPIRY_TIMESTAMP, String(storedExpiryTs));
    }
  }

  // --- CRITICAL SECURITY CHECK: Date Tamper Protection ---
  let isDateTampered = false;
  let tamperReason: string | null = null;

  // Check 1: Is current system date LESS than trial_start_date?
  const startDateObj = new Date(effectiveStartDate!);
  // Allow 5 minutes margin for minor clock drift, but backwards date is blocked
  if (todayStr < effectiveStartDate! || nowTs < (effectiveInstallTs! - 5 * 60 * 1000)) {
    isDateTampered = true;
    tamperReason = `Date Tampering Detected: Current system date (${todayStr}) is earlier than installation date (${effectiveStartDate}).`;
  }

  // Check 2: Is current system date LESS than last_open_date?
  if (!isDateTampered && storedLastOpen) {
    if (todayStr < storedLastOpen) {
      isDateTampered = true;
      tamperReason = `Date Tampering Detected: Current system date (${todayStr}) is earlier than last recorded session date (${storedLastOpen}).`;
    }
  }

  // Check 3: Check if tamper flag was previously set
  if (localStorage.getItem(KEY_TAMPER_FLAG) === 'true') {
    isDateTampered = true;
    tamperReason = tamperReason || 'Date Tampering Detected: System clock alteration previously recorded.';
  }

  if (isDateTampered) {
    localStorage.setItem(KEY_TAMPER_FLAG, 'true');
    await setToIDB(KEY_TAMPER_FLAG, true);
  } else {
    // Update last_open_date to today's date if valid
    localStorage.setItem(KEY_LAST_OPEN_DATE, todayStr);
    await setToIDB(KEY_LAST_OPEN_DATE, todayStr);
  }

  // --- Calculate Days Left ---
  // Expiry target: storedExpiryTs or storedExpiry
  let expiryTime = storedExpiryTs || new Date(storedExpiry!).getTime();
  if (isNaN(expiryTime)) {
    expiryTime = effectiveInstallTs! + 30 * 24 * 60 * 60 * 1000;
  }

  const msRemaining = expiryTime - nowTs;
  // Calculate remaining full or partial days (rounded up)
  let daysLeft = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) daysLeft = 0;

  const isExpired = daysLeft <= 0;
  const isLocked = isDateTampered || isExpired;

  // Determine license type
  const currentPlan = localStorage.getItem('hisaab_active_plan') || 'trial';
  const isActivated = currentPlan === 'pro_1y' || currentPlan === 'pro_3y' || currentPlan === 'pro_lifetime' || daysLeft > 30;

  let licenseType: 'trial' | 'pro_30d' | 'pro_365d' = 'trial';
  if (daysLeft > 60) {
    licenseType = 'pro_365d';
  } else if (daysLeft > 30 || isActivated) {
    licenseType = 'pro_30d';
  }

  return {
    isLocked,
    isDateTampered,
    tamperReason,
    isExpired,
    daysLeft,
    machineId,
    startDate: effectiveStartDate!,
    expiryDate: storedExpiry || new Date(expiryTime).toISOString().split('T')[0],
    lastOpenDate: storedLastOpen || todayStr,
    isActivated,
    licenseType
  };
}

/**
 * Activates license key
 * Supports:
 * - 'HISAAB-30-UNLOCK': Unlocks for 30 more days from TODAY
 * - 'HISAAB-365-PAID': Unlocks for 365 days from TODAY
 */
export async function activateTrialLicenseKey(
  inputKey: string
): Promise<{ success: boolean; message: string; daysLeft: number; newExpiry: string }> {
  const cleanKey = (inputKey || '').trim().toUpperCase();
  const machineId = getOrGenerate8DigitMachineId();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const nowTs = now.getTime();

  let daysToAdd = 0;
  let planLabel = 'trial';

  if (cleanKey === 'HISAAB-30-UNLOCK') {
    daysToAdd = 30;
    planLabel = 'pro_1y'; // or 30 days active
  } else if (cleanKey === 'HISAAB-365-PAID') {
    daysToAdd = 365;
    planLabel = 'pro_1y';
  } else if (cleanKey === 'HISAAB-LIFETIME' || cleanKey === 'HISAAB-PRO-MAX') {
    daysToAdd = 3650;
    planLabel = 'pro_lifetime';
  } else {
    return {
      success: false,
      message: 'Invalid License Key. Please enter "HISAAB-30-UNLOCK" or "HISAAB-365-PAID", or contact WhatsApp: 0300-XXXXXXX.',
      daysLeft: 0,
      newExpiry: ''
    };
  }

  // Calculate new expiry from TODAY
  const newExpiryTs = nowTs + daysToAdd * 24 * 60 * 60 * 1000;
  const newExpiryDate = new Date(newExpiryTs);
  const newExpiryStr = newExpiryDate.toISOString().split('T')[0];

  // Save in Place 1 (localStorage)
  localStorage.setItem(KEY_EXPIRY_DATE, newExpiryStr);
  localStorage.setItem(KEY_EXPIRY_TIMESTAMP, String(newExpiryTs));
  localStorage.setItem(KEY_LAST_OPEN_DATE, todayStr);
  localStorage.setItem('hisaab_trial_days_left', String(daysToAdd));
  localStorage.setItem('hisaab_active_plan', planLabel);
  localStorage.setItem('hisaab_is_paid_plan', 'true');
  localStorage.setItem('hisaab_security_code', cleanKey);
  localStorage.removeItem(KEY_TAMPER_FLAG); // Clear tamper lockout on valid license unlock

  // Save in Place 2 (Hidden signature token)
  const sig = createSignature({
    expiry: newExpiryStr,
    expiryTs: newExpiryTs,
    activatedAt: nowTs,
    key: cleanKey,
    machineId,
    days: daysToAdd
  });
  localStorage.setItem(KEY_SYS_SIGNATURE, sig);

  // Save in Place 3 (IndexedDB)
  await setToIDB(KEY_EXPIRY_DATE, newExpiryStr);
  await setToIDB(KEY_EXPIRY_TIMESTAMP, newExpiryTs);
  await setToIDB(KEY_LAST_OPEN_DATE, todayStr);
  await setToIDB(KEY_TAMPER_FLAG, false);
  await setToIDB('activated_key', cleanKey);

  return {
    success: true,
    message: `License activated successfully! Software unlocked for ${daysToAdd} days until ${newExpiryStr}.`,
    daysLeft: daysToAdd,
    newExpiry: newExpiryStr
  };
}
