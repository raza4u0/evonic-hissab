// Quota-safe LocalStorage helper to prevent browser storage quota crashes & handle mobile/embedded WebView limits
// Zero-Crash Storage Engine with Memory Cache Fallback

const memoryFallbackStorage = new Map<string, string>();

function serializeData(data: any): string {
  if (data === undefined || data === null) return '';
  if (typeof data === 'string') {
    try {
      JSON.parse(data);
      return data;
    } catch {
      return JSON.stringify(data);
    }
  }
  return JSON.stringify(data);
}

/**
 * Safely writes data to localStorage with automatic quota management,
 * cache pruning, base64 payload stripping, and in-memory fallback.
 */
export function safeSetLocalStorage(key: string, data: any): boolean {
  try {
    const serialized = serializeData(data);
    localStorage.setItem(key, serialized);
    // Keep in memory fallback as well for seamless retrieval
    memoryFallbackStorage.set(key, serialized);
    return true;
  } catch (err) {
    console.warn(`[SafeStorage] QuotaExceededError when setting "${key}". Triggering storage eviction & optimization...`, err);
    try {
      // Step 1: Clear non-critical ephemeral caches, logs, queues
      const nonCriticalKeys = [
        'hisaab_print_history',
        'hisaab_feedback_logs',
        'hisaab_reminder_history',
        'hisaab_pro_offline_whatsapp_queue',
        'hisaab_lan_sync_logs',
        'hisaab_audit_logs',
        'hisaab_uninstall_requests',
        'hisaab_failed_login_attempts',
        'hisaab_auto_send_error'
      ];
      nonCriticalKeys.forEach(k => {
        if (k !== key) {
          try { localStorage.removeItem(k); } catch (e) {}
        }
      });

      // Step 2: Clear dynamic temporary keys (recent customer/item searches, stock logs)
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (
            k.startsWith('recent_') || 
            k.startsWith('stock_movements_logs_') || 
            k.startsWith('stock_logs_') || 
            k.startsWith('hisaab_cols_') ||
            k.startsWith('hisaab_temp_')
          )) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => {
          try { localStorage.removeItem(k); } catch (e) {}
        });
      } catch (e) {}

      // Step 3: Optimize and compress data payload by stripping non-essential heavy fields (base64 images/attachments)
      let optimizedData = data;
      if (key === 'hisaab_staff' && Array.isArray(data)) {
        optimizedData = data.map((s: any) => ({
          ...s,
          documents: (s.documents || []).map((d: any) => ({ ...d, fileData: '' })),
          salarySlips: (s.salarySlips || []).slice(0, 6)
        }));
      } else if (key === 'hisaab_documents' && Array.isArray(data)) {
        optimizedData = data.map((doc: any) => ({
          ...doc,
          attachments: (doc.attachments || []).map((att: any) => ({ ...att, fileData: '' })),
          signatureData: doc.signatureData && doc.signatureData.length > 5000 ? '' : doc.signatureData
        }));
      } else if (key === 'hisaab_expenses' && Array.isArray(data)) {
        optimizedData = data.map((exp: any) => ({
          ...exp,
          receiptImage: exp.receiptImage && exp.receiptImage.length > 5000 ? '' : exp.receiptImage,
          attachmentUrl: exp.attachmentUrl && exp.attachmentUrl.length > 5000 ? '' : exp.attachmentUrl
        }));
      } else if (key === 'hisaab_suppliers_directory' && Array.isArray(data)) {
        // Strip heavy avatar/attachment data from suppliers directory if any
        optimizedData = data.map((sup: any) => ({
          ...sup,
          logo: sup.logo && sup.logo.length > 5000 ? '' : sup.logo
        }));
      } else if (key === 'hisaab_feedback_logs' && Array.isArray(data)) {
        optimizedData = data.slice(0, 5);
      }

      const retryVal = serializeData(optimizedData);
      localStorage.setItem(key, retryVal);
      memoryFallbackStorage.set(key, retryVal);
      return true;
    } catch (fallbackErr) {
      console.warn(`[SafeStorage] LocalStorage is completely full. Saving key "${key}" to memory storage fallback.`, fallbackErr);
      try {
        memoryFallbackStorage.set(key, serializeData(data));
      } catch (memErr) {}
      return false;
    }
  }
}

/**
 * Safely reads from localStorage with memory fallback
 */
export function safeGetLocalStorage<T = any>(key: string, defaultValue: T): T {
  try {
    const val = localStorage.getItem(key);
    if (val !== null && val !== undefined) {
      try {
        return JSON.parse(val);
      } catch {
        return val as unknown as T;
      }
    }
  } catch (e) {
    console.warn(`[SafeStorage] Error reading from localStorage for key "${key}":`, e);
  }

  // Check memory fallback
  if (memoryFallbackStorage.has(key)) {
    try {
      const memVal = memoryFallbackStorage.get(key);
      if (memVal !== undefined) {
        try {
          return JSON.parse(memVal);
        } catch {
          return memVal as unknown as T;
        }
      }
    } catch (e) {}
  }

  return defaultValue;
}
