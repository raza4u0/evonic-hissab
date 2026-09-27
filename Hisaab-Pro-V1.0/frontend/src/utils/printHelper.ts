import { generateAndDownloadPDF } from './pdfCanvasSanitizer';
import { safeSetLocalStorage, safeGetLocalStorage } from './safeStorage';

/**
 * Universal print helper for Hisaab Pro
 * Guarantees that the native system print dialog box opens reliably in all browser environments
 * including iframe embeds, preview tabs, desktop, and mobile browsers.
 */

const showPrintToast = (message: string, duration = 4000) => {
  try {
    let toast = document.getElementById('hisaab-print-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'hisaab-print-toast';
      toast.className = 'no-print';
      toast.style.position = 'fixed';
      toast.style.top = '20px';
      toast.style.right = '20px';
      toast.style.backgroundColor = '#0f172a';
      toast.style.color = '#ffffff';
      toast.style.padding = '12px 20px';
      toast.style.borderRadius = '12px';
      toast.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3)';
      toast.style.zIndex = '9999999';
      toast.style.fontSize = '12px';
      toast.style.fontWeight = 'bold';
      toast.style.fontFamily = 'ui-sans-serif, system-ui, sans-serif';
      toast.style.display = 'flex';
      toast.style.alignItems = 'center';
      toast.style.gap = '8px';
      toast.style.border = '1px solid #334155';
      toast.style.transition = 'all 0.3s ease';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span>🖨️</span> <span>${message}</span>`;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    setTimeout(() => {
      if (toast && document.body.contains(toast)) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          if (toast && document.body.contains(toast)) {
            toast.remove();
          }
        }, 300);
      }
    }, duration);
  } catch (e) {
    // ignore
  }
};

export const printElementInIframe = (element: HTMLElement, pageSize: 'A4' | 'A5' | 'Thermal' = 'A4'): boolean => {
  // Remove any previously existing print iframe
  const oldIframe = document.getElementById('hisaab-print-iframe');
  if (oldIframe) {
    try {
      oldIframe.remove();
    } catch (e) {
      // ignore
    }
  }

  const detectedPageSize = (element.getAttribute('data-paper-size') as 'A4' | 'A5' | 'Thermal') || pageSize;
  const isA5 = detectedPageSize === 'A5';
  const isThermal = detectedPageSize === 'Thermal';
  const is58mm = element.classList.contains('w-[58mm]') || element.getAttribute('data-thermal-width') === '58mm';
  const detectedMargin = element.getAttribute('data-margin') 
    || element.querySelector('[data-margin]')?.getAttribute('data-margin') 
    || 'normal';

  const a4PageMargin = detectedMargin === 'compact' 
    ? '5mm 6mm' 
    : detectedMargin === 'spacious' 
    ? '12mm 12mm' 
    : '8mm 8mm';

  const a4ContentPadding = detectedMargin === 'compact' 
    ? '3mm 4mm' 
    : detectedMargin === 'spacious' 
    ? '6mm 8mm' 
    : '4mm 6mm';

  const iframe = document.createElement('iframe');
  iframe.id = 'hisaab-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '-9999';

  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!iframeDoc) {
    return false;
  }

  // Extract all stylesheets and style blocks from main head
  const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(style => style.outerHTML)
    .join('\n');

  let pageMediaCss = '';
  if (isThermal) {
    pageMediaCss = `
      @media print {
        @page { size: ${is58mm ? '58mm auto' : '80mm auto'}; margin: 1mm; }
        html, body {
          width: ${is58mm ? '58mm' : '80mm'} !important;
          max-width: ${is58mm ? '58mm' : '80mm'} !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important; 
          color: #000000 !important; 
          font-size: ${is58mm ? '8.5px' : '9.5px'} !important;
          font-family: 'Courier New', Courier, monospace !important;
          -webkit-print-color-adjust: exact !important; 
          print-color-adjust: exact !important; 
        }
        .no-print, .no-print-bar { display: none !important; }
        #fast-pos-thermal-receipt, .printable-paper, #printable-invoice-body, #printable-area, #printable-voucher {
          width: 100% !important;
          max-width: 100% !important;
          padding: 1mm !important;
          border: none !important;
          box-shadow: none !important;
          box-sizing: border-box !important;
          color: #000000 !important;
          background: #ffffff !important;
        }
        table { font-size: ${is58mm ? '7.5px' : '8.5px'} !important; width: 100% !important; border-collapse: collapse !important; }
        thead { display: table-header-group !important; }
        tr { break-inside: avoid !important; page-break-inside: avoid !important; }
        th, td { padding: 1.5px 2px !important; }
        img { max-width: 100% !important; height: auto !important; }
      }
    `;
  } else if (isA5) {
    pageMediaCss = `
      @media print {
        @page { size: A5 portrait; margin: 6mm 8mm; }
        html, body {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white !important; 
          color: #0f172a !important; 
          font-size: 10px !important;
          -webkit-print-color-adjust: exact !important; 
          print-color-adjust: exact !important; 
        }
        .no-print, .no-print-bar { display: none !important; }
        .printable-paper, #printable-invoice-body, #printable-area, #printable-voucher, .multi-page-doc-sheet {
          width: 100% !important;
          max-width: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          box-sizing: border-box !important;
        }
        table { font-size: 9px !important; width: 100% !important; border-collapse: collapse !important; }
        thead { display: table-header-group !important; }
        tfoot { display: table-footer-group !important; }
        tr { break-inside: avoid !important; page-break-inside: avoid !important; }
        .break-inside-avoid, .page-break-avoid { break-inside: avoid !important; page-break-inside: avoid !important; }
        .multi-page-doc-sheet:not(:last-child) { break-after: page !important; page-break-after: always !important; }
        th, td { padding: 3px 5px !important; }
      }
    `;
  } else {
    pageMediaCss = `
      @media print {
        @page { size: A4 portrait; margin: 8mm 10mm; }
        html, body {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white !important; 
          color: #0f172a !important; 
          font-size: 11pt !important;
          -webkit-print-color-adjust: exact !important; 
          print-color-adjust: exact !important; 
        }
        .no-print, .no-print-bar, .no-print-hide { display: none !important; }
        .printable-paper, #printable-invoice-body, #printable-area, #printable-voucher, #quick-view-printable-doc, .quick-view-a4-sheet, .multi-page-doc-sheet {
          width: 100% !important;
          max-width: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          box-sizing: border-box !important;
        }
        table { width: 100% !important; border-collapse: collapse !important; margin: 8px 0 !important; }
        thead { display: table-header-group !important; }
        tfoot { display: table-footer-group !important; }
        tr { break-inside: avoid !important; page-break-inside: avoid !important; }
        th, td { padding: 6px 8px !important; }
        .break-inside-avoid, .page-break-avoid, .print-summary-block, .print-signature-block, .print-bank-block { 
          break-inside: avoid !important; 
          page-break-inside: avoid !important; 
        }
        .multi-page-doc-sheet:not(:last-child) { break-after: page !important; page-break-after: always !important; }
      }
    `;
  }

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${document.title || 'evonix Hissab - Printable Document'}</title>
        ${headStyles}
        <style>
          ${pageMediaCss}
          body { 
            background: white !important; 
            font-family: ${isThermal ? "'Courier New', Courier, monospace" : 'system-ui, -apple-system, sans-serif'}; 
            padding: 0 !important; 
            margin: 0 !important;
            color: #0f172a !important;
          }
          .no-print, .no-print-bar { display: none !important; }
        </style>
      </head>
      <body>
        <div>
          ${element.outerHTML}
        </div>
      </body>
    </html>
  `);
  iframeDoc.close();

  try {
    // Give iframe a moment to parse stylesheets and data-url images
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print delayed execution error:', err);
      }
    }, 150);
    return true;
  } catch (err) {
    console.warn('Iframe contentWindow.print failed:', err);
    return false;
  } finally {
    setTimeout(() => {
      try {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      } catch (e) {
        // ignore
      }
    }, 12000);
  }
};

/**
 * Open Print Popup Window (Tier 2 Fallback)
 */
export const openPrintPopupWindow = (element: HTMLElement, pageSize: 'A4' | 'A5' | 'Thermal' = 'A4'): boolean => {
  try {
    const printWin = window.open('', '_blank', 'width=900,height=900,scrollbars=yes,resizable=yes');
    if (!printWin) return false;

    const detectedPageSize = (element.getAttribute('data-paper-size') as 'A4' | 'A5' | 'Thermal') || pageSize;
    const isA5 = detectedPageSize === 'A5';

    const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(style => style.outerHTML)
      .join('\n');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${document.title || 'evonix Hissab - Printable A4 Document'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          ${headStyles}
          <style>
            @media print {
              @page { size: ${isA5 ? 'A5 portrait' : 'A4 portrait'}; margin: 8mm; }
              body { background: white !important; color: black !important; padding: 0 !important; margin: 0 !important; }
              .no-print { display: none !important; }
            }
            body { background-color: #f8fafc; font-family: ui-sans-serif, system-ui, sans-serif; padding: 20px; color: #0f172a; }
            .a4-wrapper { max-width: ${isA5 ? '148mm' : '210mm'}; margin: 0 auto; background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08); }
          </style>
        </head>
        <body>
          <div class="no-print" style="max-width: ${isA5 ? '148mm' : '210mm'}; margin: 0 auto 16px auto; display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: white; padding: 12px 20px; border-radius: 12px;">
            <div>
              <strong style="font-size: 14px; display: block;">Hisaab Pro Document Printer</strong>
              <span style="font-size: 11px; color: #94a3b8;">Format: Standard ${detectedPageSize} Printable Sheet</span>
            </div>
            <button onclick="window.print()" style="background: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; font-size: 12px; cursor: pointer;">
              🖨️ Print / Save PDF
            </button>
          </div>
          <div class="a4-wrapper">
            ${element.outerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                try { window.print(); } catch(e) {}
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    return true;
  } catch (err) {
    console.warn('Popup window print failed:', err);
    return false;
  }
};

export const recordPrintJob = (docName?: string) => {
  try {
    const history = safeGetLocalStorage<Array<{ timestamp: number; docName?: string }>>('hisaab_print_history', []);
    const now = Date.now();
    const updated = [{ timestamp: now, docName: docName || document.title || 'Print Job' }, ...(Array.isArray(history) ? history : [])].slice(0, 50);
    safeSetLocalStorage('hisaab_print_history', updated);
  } catch (e) {
    // ignore
  }
};

export const getPrintCountLast30Days = (): number => {
  try {
    const history = safeGetLocalStorage<Array<{ timestamp: number }>>('hisaab_print_history', []);
    if (!Array.isArray(history)) return 0;
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    return history.filter(item => item.timestamp >= thirtyDaysAgo).length;
  } catch (e) {
    return 0;
  }
};

export const triggerPrint = async (target?: HTMLElement | string, pageSize: 'A4' | 'A5' | 'Thermal' = 'A4') => {
  const elementId = typeof target === 'string' ? target : target?.id;
  recordPrintJob(elementId);
  showPrintToast('Preparing Document Print / PDF Export...');

  // 1. Locate Target Printable Element
  let targetEl: HTMLElement | null = null;
  if (target instanceof HTMLElement) {
    targetEl = target;
  } else if (typeof target === 'string' && target) {
    targetEl = document.getElementById(target);
  }

  if (!targetEl) {
    const candidates = [
      'fast-pos-thermal-receipt',
      'thermal-receipt-preview',
      'printable-invoice-body',
      'printable-statement-body',
      'printable-voucher',
      'printable-payment-voucher-area',
      'printable-vat-form',
      'printable-joining-form',
      'printable-leave-form',
      'printable-barcode-sheet',
      'bank-rec-certificate',
      'tax-report-printable-area',
      'einvoicing-notice-sheet',
      'official-software-certificate',
      'printable-transfer-voucher',
      'ai-importer-extracted-data',
      'inventory-list-table'
    ];
    for (const cand of candidates) {
      const el = document.getElementById(cand);
      if (el) {
        targetEl = el;
        break;
      }
    }
  }

  const detectedMargin = targetEl?.getAttribute('data-margin')
    || targetEl?.querySelector('[data-margin]')?.getAttribute('data-margin')
    || 'normal';

  const a4PageMargin = detectedMargin === 'compact'
    ? '5mm 6mm'
    : detectedMargin === 'spacious'
    ? '12mm 12mm'
    : '8mm 8mm';

  // Set dynamic page size style tag in document head for clean @media print formatting
  let pageStyleEl = document.getElementById('hisaab-dynamic-print-style');
  if (!pageStyleEl) {
    pageStyleEl = document.createElement('style');
    pageStyleEl.id = 'hisaab-dynamic-print-style';
    document.head.appendChild(pageStyleEl);
  }
  const isA5 = pageSize === 'A5';
  const isThermal = pageSize === 'Thermal';

  if (isThermal) {
    pageStyleEl.textContent = `
      @media print {
        @page { size: 80mm auto; margin: 2mm; }
        body { background: white !important; color: black !important; font-family: monospace !important; }
        .no-print { display: none !important; }
      }
    `;
  } else {
    pageStyleEl.textContent = `
      @media print {
        @page { size: ${isA5 ? 'A5 portrait' : 'A4 portrait'}; margin: ${isA5 ? '4mm' : a4PageMargin}; }
        body { background: white !important; color: black !important; }
        .no-print { display: none !important; }
      }
    `;
  }

  // 2. Try Tier 1: Iframe Print
  if (targetEl) {
    const iframeSuccess = printElementInIframe(targetEl, pageSize);
    if (iframeSuccess) return;

    // 3. Try Tier 2: Popup Window Print
    const popupSuccess = openPrintPopupWindow(targetEl, pageSize);
    if (popupSuccess) return;

    // 4. Try Tier 3: Direct A4 PDF Generation & Download
    showPrintToast('Print dialog restricted by iframe sandbox. Generating A4 PDF download...');
    try {
      const docTitle = targetEl.getAttribute('data-doc-name') || elementId || 'Hisaab_Pro_Document';
      await generateAndDownloadPDF(targetEl, docTitle, {
        targetId: targetEl.id,
        paperSize: pageSize.toLowerCase() as any
      });
      showPrintToast('🎉 A4 PDF Document Downloaded Successfully!');
      return;
    } catch (err) {
      console.error('Tier 3 PDF generation failed:', err);
    }
  }

  // Fallback: Main window print
  try {
    window.focus();
    window.print();
  } catch (err) {
    console.warn('Main window print failed, triggering fallback PDF download:', err);
    if (targetEl) {
      await generateAndDownloadPDF(targetEl, 'Hisaab_Pro_A4_Document', {
        targetId: targetEl.id,
        paperSize: pageSize.toLowerCase() as any
      });
    }
  }
};

/**
 * Generate fully standalone, self-contained HTML string with high-fidelity styles and print CSS
 */
export const generateStandaloneHtmlString = (
  element: HTMLElement,
  options: {
    docTitle?: string;
    paperSize?: 'A4' | 'A5' | 'Thermal';
  } = {}
): string => {
  const { docTitle = 'evonix Hissab Document', paperSize = 'A4' } = options;
  const isThermal = paperSize === 'Thermal';
  const isA5 = paperSize === 'A5';

  // Clone element to avoid modifying the active DOM
  const clone = element.cloneNode(true) as HTMLElement;

  // Clean out any no-print interactive controls
  clone.querySelectorAll('.no-print, .no-print-bar, .no-print-hide, button, input[type="checkbox"]').forEach(el => {
    // If it's a checkbox inside printable table, remove or replace with text
    if (el.tagName === 'BUTTON' || el.classList.contains('no-print') || el.classList.contains('no-print-bar')) {
      el.remove();
    }
  });

  const maxWidthClass = isThermal ? 'max-w-[80mm]' : isA5 ? 'max-w-[148mm]' : 'max-w-[210mm]';
  const marginPageRule = isThermal
    ? '@page { size: 80mm auto; margin: 2mm; }'
    : isA5
    ? '@page { size: A5 portrait; margin: 6mm 8mm; }'
    : '@page { size: A4 portrait; margin: 8mm 10mm; }';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+Arabic:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      background-color: #f1f5f9;
      color: #0f172a;
      font-family: 'Inter', 'Noto Sans Arabic', system-ui, -apple-system, sans-serif;
      padding: 20px 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }

    .print-nav-bar {
      width: 100%;
      max-width: ${isThermal ? '80mm' : isA5 ? '148mm' : '210mm'};
      background: #0f172a;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
    }

    .print-nav-title {
      font-weight: 800;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .print-nav-sub {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 2px;
    }

    .btn-print {
      background: #4f46e5;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s ease;
    }
    .btn-print:hover {
      background: #4338ca;
    }

    .paper-sheet-card {
      width: 100%;
      max-width: ${isThermal ? '80mm' : isA5 ? '148mm' : '210mm'};
      min-height: ${isThermal ? 'auto' : isA5 ? '210mm' : '297mm'};
      background: #ffffff;
      padding: ${isThermal ? '0' : '0'};
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      position: relative;
    }

    .font-mono { font-family: 'JetBrains Mono', monospace !important; }
    
    @media print {
      ${marginPageRule}
      body {
        background: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
        color: #0f172a !important;
        width: 100% !important;
      }
      .no-print, .print-nav-bar {
        display: none !important;
      }
      .paper-sheet-card, .multi-page-doc-sheet, #printable-invoice-body, #printable-area, #printable-voucher, #printable-thermal-receipt {
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
        max-width: ${isThermal ? '80mm' : '100%'} !important;
        width: ${isThermal ? '80mm' : '100%'} !important;
        padding: ${isThermal ? '2mm 3mm' : '0'} !important;
        margin: ${isThermal ? '0 auto' : '0'} !important;
      }
      .break-after-page {
        page-break-after: always !important;
        break-after: page !important;
      }
      .break-inside-avoid {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      table {
        page-break-inside: auto !important;
      }
      tr {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  </style>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div class="print-nav-bar no-print">
    <div>
      <div class="print-nav-title">
        <span>📄</span>
        <span>${docTitle}</span>
        <span style="font-size: 10px; background: rgba(99, 102, 241, 0.2); color: #a5b4fc; padding: 2px 8px; border-radius: 9999px; border: 1px solid rgba(99, 102, 241, 0.4);">${paperSize} Standard</span>
      </div>
      <div class="print-nav-sub">Ready to print • Press <strong>Ctrl + P</strong> (Cmd + P on Mac) or click button</div>
    </div>
    <button class="btn-print" onclick="window.print()">
      🖨️ Print Document (Ctrl+P)
    </button>
  </div>

  <div class="paper-sheet-card">
    ${clone.innerHTML}
  </div>

  <script>
    // Optional automatic prompt if user requested direct print flow
    if (window.location.search.includes('autoprint=true')) {
      window.onload = function() {
        setTimeout(function() {
          try { window.print(); } catch(e) {}
        }, 500);
      };
    }
  </script>
</body>
</html>`;
};

/**
 * Universal Standalone HTML Downloader
 * Saves a 100% self-contained, offline-printable HTML file to the user's computer.
 */
export const downloadStandaloneHTML = ({
  elementOrId,
  fileName = 'Document.html',
  docTitle,
  paperSize = 'A4'
}: {
  elementOrId: HTMLElement | string;
  fileName?: string;
  docTitle?: string;
  paperSize?: 'A4' | 'A5' | 'Thermal';
}): boolean => {
  try {
    let targetEl: HTMLElement | null = null;
    if (elementOrId instanceof HTMLElement) {
      targetEl = elementOrId;
    } else if (typeof elementOrId === 'string') {
      targetEl = document.getElementById(elementOrId);
    }

    if (!targetEl) {
      console.warn('Target element not found for HTML download:', elementOrId);
      return false;
    }

    const title = docTitle || fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
    const htmlString = generateStandaloneHtmlString(targetEl, {
      docTitle: title,
      paperSize
    });

    const blob = new Blob([htmlString], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.html') ? fileName : `${fileName}.html`;
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 200);

    showPrintToast('🎉 Standalone HTML Document Downloaded! Open and press Ctrl+P to print.');
    return true;
  } catch (err) {
    console.error('downloadStandaloneHTML failed:', err);
    return false;
  }
};

/**
 * Open Clean Print Window
 * Opens a dedicated popup tab with the standalone printable document for immediate Ctrl+P printing.
 */
export const openCleanPrintWindow = (
  elementOrId: HTMLElement | string,
  paperSize: 'A4' | 'A5' | 'Thermal' = 'A4',
  docTitle?: string
): boolean => {
  try {
    let targetEl: HTMLElement | null = null;
    if (elementOrId instanceof HTMLElement) {
      targetEl = elementOrId;
    } else if (typeof elementOrId === 'string') {
      targetEl = document.getElementById(elementOrId);
    }

    if (!targetEl) return false;

    const printWin = window.open('', '_blank', 'width=950,height=900,scrollbars=yes,resizable=yes');
    if (!printWin) return false;

    const htmlString = generateStandaloneHtmlString(targetEl, {
      docTitle: docTitle || 'Print Document',
      paperSize
    });

    printWin.document.open();
    printWin.document.write(htmlString);
    printWin.document.close();
    printWin.focus();

    setTimeout(() => {
      try {
        printWin.print();
      } catch (e) {
        // user can click the button
      }
    }, 400);

    return true;
  } catch (err) {
    console.warn('openCleanPrintWindow failed:', err);
    return false;
  }
};


