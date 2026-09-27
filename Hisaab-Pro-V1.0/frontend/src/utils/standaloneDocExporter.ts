import { SalesDocument, Company, Customer } from '../types';

/**
 * Currency Formatter (Fixed 2 decimals)
 */
const formatAED = (amount: number | string | undefined | null): string => {
  const val = typeof amount === 'number' && !isNaN(amount) ? amount : (Number(amount) || 0);
  return `AED ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Amount to Words Converter (English & Arabic)
 */
const convertAmountToWords = (amount: number | undefined | null): { english: string; arabic: string } => {
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? Math.max(0, amount) : Math.max(0, Number(amount) || 0);

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const num = Math.floor(safeAmount);
  const fils = Math.round((safeAmount - num) * 100);
  
  const helper = (n: number): string => {
    if (n <= 0 || isNaN(n)) return '';
    if (n < 20) return units[n] || '';
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '');
    if (n < 1000) return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + helper(n % 100) : '');
    if (n < 1000000) return helper(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + helper(n % 1000) : '');
    if (n < 1000000000) return helper(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 !== 0 ? ' ' + helper(n % 1000000) : '');
    return n.toString();
  };
  
  const words = num === 0 ? 'Zero' : helper(num);
  const filsWords = fils > 0 ? ` and ${fils}/100 Fils` : '';
  
  return {
    english: `${words} UAE Dirhams${filsWords} Only`,
    arabic: ''
  };
};

/**
 * Downloads a string content as a file in the browser
 */
const triggerBrowserDownload = (content: string, fileName: string, contentType: string = 'text/html') => {
  const blob = new Blob([content], { type: `${contentType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

/**
 * Generates and downloads a clean, standalone, printable A4/A5 HTML file
 * for Invoices, Quotations, and Delivery Notes.
 */
export const downloadDocumentHTML = (
  doc: SalesDocument, 
  company: Company, 
  customer?: Customer,
  options?: {
    paperSize?: 'A4' | 'A5';
    autoPrint?: boolean;
    isPackingSlip?: boolean;
  }
) => {
  const pSize = options?.paperSize || 'A4';
  const isA5 = pSize === 'A5';
  const isPackingSlip = options?.isPackingSlip || false;
  const isVat = company.vatEnabled !== false;
  
  const docTitle = isPackingSlip 
    ? 'PACKING SLIP' 
    : doc.type === 'Invoice' 
    ? (isVat ? 'TAX INVOICE' : 'SALES INVOICE')
    : doc.type === 'Proforma' ? 'PROFORMA INVOICE'
    : doc.type === 'CreditNote' ? 'TAX CREDIT NOTE'
    : doc.type === 'Quotation' ? 'TAX QUOTATION'
    : 'DELIVERY NOTE';

  const amountWords = convertAmountToWords(doc.total);
  const subtotal = Number(doc.subtotal) || Number(doc.total) || 0;
  const vatTotal = Number(doc.vatTotal) || 0;
  const total = Number(doc.total) || 0;
  const paymentReceived = Number(doc.paymentReceived) || 0;
  const balanceDue = Math.max(0, total - paymentReceived);

  const fileName = `${doc.type}_${doc.docNumber || 'Doc'}_Printable.html`.replace(/[^a-zA-Z0-9._-]/g, '_');

  const itemsRows = (doc.items || []).map((item, idx) => {
    const qty = Number(item.qty) || 1;
    const rate = Number(item.rate) || 0;
    const itemVat = Number(item.vatAmount) || 0;
    const itemTotal = Number(item.total) || (qty * rate + itemVat);

    return `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace; color: #64748b;">${idx + 1}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 11px; color: #475569;">${item.sku || '-'}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: 700; color: #0f172a; font-size: 13px;">${item.name || 'Item'}</div>
          ${((item as any).notes || (item as any).description) && ((item as any).notes || (item as any).description) !== item.name ? `<div style="font-size: 11px; color: #475569; margin-top: 3px; line-height: 1.4;">${(item as any).notes || (item as any).description}</div>` : ''}
          ${item.serialNumber ? `<div style="font-size: 10px; font-family: monospace; color: #2563eb; margin-top: 2px;">S/N: ${item.serialNumber}</div>` : ''}
          ${item.partNumber ? `<div style="font-size: 10px; font-family: monospace; color: #4f46e5; margin-top: 2px;">P/N: ${item.partNumber}</div>` : ''}
          ${item.deviceSpecs ? `<div style="font-size: 10px; color: #64748b; margin-top: 2px;">${item.deviceSpecs}</div>` : ''}
          ${item.warranty ? `<div style="font-size: 10px; color: #059669; margin-top: 2px;">Warranty: ${item.warranty}</div>` : ''}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-family: monospace; font-weight: 700; color: #0f172a;">${qty}</td>
        ${!isPackingSlip && doc.type !== 'DeliveryNote' ? `
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; color: #334155;">${formatAED(rate)}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; color: #4f46e5;">${formatAED(itemVat)}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">${formatAED(itemTotal)}</td>
        ` : ''}
      </tr>
    `;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docTitle} - ${doc.docNumber} | ${company.name || 'evonix Technologies'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700;800&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #f1f5f9;
      color: #0f172a;
      line-height: 1.5;
      padding: 24px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* Fixed Floating Top Control Bar (Hidden on print) */
    .top-action-bar {
      position: sticky;
      top: 12px;
      z-index: 9999;
      background: #0f172a;
      color: #ffffff;
      padding: 10px 20px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      max-width: 900px;
      width: 100%;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
      margin-bottom: 20px;
    }

    .top-action-bar .btn-print {
      background: #2563eb;
      color: #ffffff;
      font-weight: 800;
      font-size: 13px;
      padding: 8px 18px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background 0.2s;
    }
    .top-action-bar .btn-print:hover {
      background: #1d4ed8;
    }

    .top-action-bar .doc-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #94a3b8;
    }

    /* Main Document Sheet Container */
    .doc-sheet {
      background: #ffffff;
      width: 100%;
      max-width: ${isA5 ? '148mm' : '210mm'};
      min-height: ${isA5 ? '210mm' : '297mm'};
      padding: ${isA5 ? '14mm 12mm' : '16mm 18mm'};
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      position: relative;
    }

    /* Table Styles */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }

    th {
      background: #0f172a;
      color: #ffffff;
      font-size: 10px;
      font-family: 'JetBrains Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 12px;
      font-weight: 700;
    }

    /* PRINT SPECIFIC STYLES - Exact A4 / A5 Fit */
    @media print {
      @page {
        size: ${isA5 ? 'A5 portrait' : 'A4 portrait'};
        margin: 10mm 12mm 10mm 12mm;
      }

      body {
        background: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
        color: #000000 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .no-print {
        display: none !important;
      }

      .doc-sheet {
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        min-height: auto !important;
      }

      tr {
        page-break-inside: avoid !important;
      }

      .page-break-avoid {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>

  <!-- Top Action Bar (Auto hidden when printing) -->
  <div class="top-action-bar no-print">
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-size: 16px;">📄</span>
      <div>
        <div style="font-weight: 800; font-size: 13px;">${docTitle} #${doc.docNumber}</div>
        <div class="doc-badge">Standard ${isA5 ? 'A5' : 'A4'} • Direct Browser Print Ready (Ctrl+P)</div>
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <button class="btn-print" onclick="window.print()">
        <span>🖨️</span>
        <span>Print Document (Ctrl+P)</span>
      </button>
    </div>
  </div>

  <!-- Printable Sheet -->
  <div class="doc-sheet">
    
    <!-- Top Header: Logo, Company & Document Meta -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #0f172a; gap: 20px;">
      
      <!-- Company Branding -->
      <div style="max-width: 60%;">
        ${company.logoUrl ? `<img src="${company.logoUrl}" alt="Logo" style="max-height: 48px; max-width: 180px; object-contain: contain; margin-bottom: 8px;">` : ''}
        <h1 style="font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; text-transform: uppercase;">
          ${company.name || 'evonix Technologies'}
        </h1>
        ${company.address ? `<p style="font-size: 11px; color: #475569; margin-top: 3px;">${company.address}</p>` : ''}
        <p style="font-size: 11px; color: #475569; font-family: 'JetBrains Mono', monospace; margin-top: 2px;">
          Phone: ${company.phone || 'N/A'} | Email: ${company.email || 'N/A'}
        </p>
        ${company.trn ? `
          <div style="display: inline-block; background: #f1f5f9; padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; margin-top: 6px;">
            <span style="font-size: 11px; font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #0f172a;">
              TRN: <span style="color: #4f46e5; letter-spacing: 1px;">${company.trn}</span>
            </span>
          </div>
        ` : ''}
      </div>

      <!-- Document Metadata -->
      <div style="text-align: right; min-width: 160px;">
        <h2 style="font-size: 20px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
          ${docTitle}
        </h2>
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #475569; margin-top: 6px; line-height: 1.6;">
          <p><strong>Number:</strong> <span style="color: #0f172a; font-weight: 800;">${doc.docNumber}</span></p>
          <p><strong>Date:</strong> ${doc.date}</p>
          ${doc.dueDate ? `<p><strong>Due Date:</strong> ${doc.dueDate}</p>` : ''}
          ${doc.lpoNumber ? `<p><strong>LPO No:</strong> ${doc.lpoNumber}</p>` : ''}
          ${doc.reference ? `<p><strong>Reference:</strong> ${doc.reference}</p>` : ''}
          ${doc.paymentTerms ? `<p><strong>Terms:</strong> ${doc.paymentTerms}</p>` : ''}
        </div>
      </div>
    </div>

    <!-- Bill To / Customer Information Block -->
    <div style="margin-top: 14px; padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; justify-content: space-between; align-items: flex-start; gap: 20px;">
      <div style="max-width: 65%;">
        <span style="font-size: 9px; font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">BILL TO / CUSTOMER</span>
        <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px;">
          ${customer?.name || 'Walk-in Cash Customer'}
        </div>
        ${customer?.address ? `<p style="font-size: 11px; color: #475569; margin-top: 2px;">${customer.address}</p>` : ''}
        <p style="font-size: 11px; color: #475569; font-family: 'JetBrains Mono', monospace; margin-top: 2px;">
          Phone: ${customer?.phone || 'N/A'} | Email: ${customer?.email || 'N/A'}
        </p>
      </div>

      <div style="text-align: right;">
        ${customer?.trn ? `
          <div style="display: inline-block; background: #ffffff; padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 10px; font-family: 'JetBrains Mono', monospace;">
            <strong>Customer TRN:</strong> <span style="font-weight: 800; color: #0f172a;">${customer.trn}</span>
          </div>
        ` : ''}
        <div style="margin-top: 4px; font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #64748b;">
          Place of Supply: <strong>${customer?.emirate || 'UAE'}</strong>
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <table>
      <thead>
        <tr>
          <th style="width: 35px; border-radius: 6px 0 0 0;">#</th>
          <th style="width: 100px;">SKU / Code</th>
          <th>Description</th>
          <th style="width: 50px; text-align: center;">Qty</th>
          ${!isPackingSlip && doc.type !== 'DeliveryNote' ? `
            <th style="width: 100px; text-align: right;">Rate</th>
            <th style="width: 90px; text-align: right;">VAT (5%)</th>
            <th style="width: 110px; text-align: right; border-radius: 0 6px 0 0;">Total</th>
          ` : ''}
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <!-- Financial Totals & Summary Block -->
    ${!isPackingSlip && doc.type !== 'DeliveryNote' ? `
      <div class="page-break-avoid" style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 14px; gap: 20px;">
        
        <!-- Left: Amount in Words & Bank Details -->
        <div style="max-width: 55%; font-size: 11px;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; margin-bottom: 10px;">
            <span style="font-size: 9px; font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #64748b; text-transform: uppercase;">AMOUNT IN WORDS:</span>
            <div style="font-weight: 700; color: #0f172a; margin-top: 2px;">
              ${amountWords.english}
            </div>
          </div>

          ${company.bankName || company.bankIban ? `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px;">
              <span style="font-size: 9px; font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #64748b; text-transform: uppercase;">BANK TRANSFER DETAILS:</span>
              <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #334155; margin-top: 3px; line-height: 1.5;">
                <p><strong>Bank:</strong> ${company.bankName || 'N/A'}</p>
                <p><strong>Beneficiary:</strong> ${company.bankAccountName || company.name}</p>
                <p><strong>IBAN:</strong> <span style="font-weight: 800; color: #0f172a;">${company.bankIban || 'N/A'}</span></p>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Right: Totals Box -->
        <div style="min-width: 240px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 14px; font-family: 'JetBrains Mono', monospace; font-size: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #475569;">
            <span>Subtotal (Excl. VAT):</span>
            <span style="font-weight: 700; color: #0f172a;">${formatAED(subtotal)}</span>
          </div>
          ${doc.discount ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #e11d48;">
              <span>Discount:</span>
              <span>-${formatAED(doc.discount)}</span>
            </div>
          ` : ''}
          ${isVat ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #4f46e5; border-bottom: 1px dashed #cbd5e1; padding-bottom: 6px;">
              <span>VAT (5% Standard):</span>
              <span style="font-weight: 700;">${formatAED(vatTotal)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; color: #0f172a; padding: 6px 0; border-bottom: 2px solid #0f172a;">
            <span>Grand Total:</span>
            <span>${formatAED(total)}</span>
          </div>

          ${doc.type === 'Invoice' ? `
            <div style="margin-top: 6px; font-size: 11px;">
              <div style="display: flex; justify-content: space-between; color: #059669; font-weight: 700; padding: 3px 0;">
                <span>Payment Received:</span>
                <span>${formatAED(paymentReceived)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: 800; padding: 4px 6px; background: ${balanceDue > 0 ? '#fff1f2' : '#f0fdf4'}; border-radius: 4px; color: ${balanceDue > 0 ? '#e11d48' : '#059669'}; margin-top: 4px;">
                <span>Balance Due:</span>
                <span>${formatAED(balanceDue)}</span>
              </div>
            </div>
          ` : ''}
        </div>

      </div>
    ` : ''}

    <!-- Signatures & Footer Declaration -->
    <div class="page-break-avoid" style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #cbd5e1;">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; text-align: center; gap: 20px;">
        <div style="width: 30%;">
          <div style="height: 35px; border-bottom: 1px dashed #94a3b8; display: flex; align-items: flex-end; justify-content: center; font-size: 11px; font-weight: 700; color: #0f172a;">
            ${doc.preparedBy || 'Accounts Officer'}
          </div>
          <span style="font-size: 9px; font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #64748b; text-transform: uppercase;">PREPARED BY</span>
        </div>

        <div style="width: 30%;">
          <div style="height: 35px; border-bottom: 1px dashed #94a3b8; display: flex; align-items: flex-end; justify-content: center; font-size: 11px; font-weight: 700; color: #0f172a;">
            ${company.invoiceSignatoryName || 'Authorized Signatory'}
          </div>
          <span style="font-size: 9px; font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #64748b; text-transform: uppercase;">AUTHORIZED SIGNATURE</span>
        </div>

        <div style="width: 30%;">
          <div style="height: 35px; border-bottom: 1px dashed #94a3b8; display: flex; align-items: flex-end; justify-content: center; font-size: 10px; color: #94a3b8; font-style: italic;">
            Stamp / Seal
          </div>
          <span style="font-size: 9px; font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #64748b; text-transform: uppercase;">CUSTOMER RECEIPT & STAMP</span>
        </div>
      </div>

      <!-- Legal Compliance Footnote -->
      <div style="margin-top: 16px; padding-top: 8px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 9px; font-family: 'JetBrains Mono', monospace; color: #64748b;">
        <span>${doc.footerNotes || company.footerNotes || 'Generated in compliance with UAE FTA VAT Federal Decree-Law.'}</span>
        <span>${company.name || 'evonix Technologies'} • Single Workstation ERP</span>
      </div>
    </div>

  </div>

  ${options?.autoPrint ? `
    <script>
      window.onload = function() {
        setTimeout(function() {
          window.print();
        }, 500);
      };
    </script>
  ` : ''}

</body>
</html>`;

  triggerBrowserDownload(html, fileName);
};

/**
 * Generates and downloads a clean, standalone, printable Receipt Voucher HTML file.
 */
export const downloadVoucherHTML = (
  doc: SalesDocument, 
  company: Company, 
  customer?: Customer,
  options?: {
    autoPrint?: boolean;
  }
) => {
  const amount = Number(doc.paymentReceived) || Number(doc.total) || 0;
  const amountWords = convertAmountToWords(amount);
  const fileName = `Receipt_Voucher_${doc.docNumber || 'REC'}.html`.replace(/[^a-zA-Z0-9._-]/g, '_');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt Voucher #${doc.docNumber} | ${company.name || 'evonix Technologies'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700;800&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #f1f5f9;
      color: #0f172a;
      padding: 24px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .top-action-bar {
      position: sticky;
      top: 12px;
      z-index: 9999;
      background: #0f172a;
      color: #ffffff;
      padding: 10px 20px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      max-width: 800px;
      width: 100%;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
      margin-bottom: 20px;
    }

    .btn-print {
      background: #059669;
      color: #ffffff;
      font-weight: 800;
      font-size: 13px;
      padding: 8px 18px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-print:hover { background: #047857; }

    .voucher-sheet {
      background: #ffffff;
      width: 100%;
      max-width: 200mm;
      padding: 16mm 18mm;
      border: 3px double #94a3b8;
      border-radius: 10px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    @media print {
      @page {
        size: A4 portrait;
        margin: 10mm 15mm;
      }
      body {
        background: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .no-print { display: none !important; }
      .voucher-sheet {
        border: 2px solid #0f172a !important;
        box-shadow: none !important;
        padding: 6mm 8mm !important;
        max-width: 100% !important;
      }
    }
  </style>
</head>
<body>

  <div class="top-action-bar no-print">
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-size: 18px;">🧾</span>
      <div>
        <div style="font-weight: 800; font-size: 13px;">Official Payment Receipt Voucher</div>
        <div style="font-size: 11px; color: #94a3b8; font-family: monospace;">Ref: Invoice #${doc.docNumber} • Press Ctrl+P to Print</div>
      </div>
    </div>
    <button class="btn-print" onclick="window.print()">
      <span>🖨️</span>
      <span>Print Voucher (Ctrl+P)</span>
    </button>
  </div>

  <div class="voucher-sheet">
    
    <!-- Voucher Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; border-bottom: 2px solid #0f172a; gap: 16px;">
      <div>
        ${company.logoUrl ? `<img src="${company.logoUrl}" alt="Logo" style="max-height: 42px; max-width: 160px; object-fit: contain; margin-bottom: 6px;">` : ''}
        <h1 style="font-size: 18px; font-weight: 900; color: #0f172a; text-transform: uppercase;">
          ${company.name || 'evonix Technologies'}
        </h1>
        <p style="font-size: 11px; color: #475569;">${company.address || 'United Arab Emirates'}</p>
        <p style="font-size: 11px; font-family: monospace; color: #475569;">
          Phone: ${company.phone || 'N/A'} | TRN: <strong>${company.trn || 'N/A'}</strong>
        </p>
      </div>

      <div style="text-align: right;">
        <span style="background: #0f172a; color: #ffffff; padding: 4px 10px; border-radius: 4px; font-weight: 900; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
          RECEIPT VOUCHER
        </span>
        <div style="font-family: monospace; font-size: 11px; color: #334155; margin-top: 8px; line-height: 1.6;">
          <p><strong>Voucher No:</strong> <span style="font-weight: 800; color: #059669;">REC-${doc.docNumber}</span></p>
          <p><strong>Date:</strong> ${doc.date}</p>
        </div>
      </div>
    </div>

    <!-- Voucher Details Table -->
    <div style="margin: 20px 0; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; font-size: 12px;">
      
      <div style="display: flex; border-bottom: 1px solid #e2e8f0; padding: 10px 14px; background: #f8fafc;">
        <div style="width: 160px; font-weight: 700; color: #475569;">Received From:</div>
        <div style="flex: 1; font-weight: 800; color: #0f172a; font-size: 13px;">${customer?.name || 'Cash Customer'}</div>
      </div>

      <div style="display: flex; border-bottom: 1px solid #e2e8f0; padding: 10px 14px; align-items: center;">
        <div style="width: 160px; font-weight: 700; color: #475569;">Amount Received:</div>
        <div style="flex: 1; display: flex; align-items: center; gap: 12px;">
          <span style="font-family: monospace; font-size: 15px; font-weight: 900; color: #059669; background: #ecfdf5; padding: 3px 10px; border-radius: 6px; border: 1px solid #a7f3d0;">
            ${formatAED(amount)}
          </span>
          <span style="font-size: 11px; color: #64748b;">(Full & Final Settlement)</span>
        </div>
      </div>

      <div style="display: flex; border-bottom: 1px solid #e2e8f0; padding: 10px 14px; background: #f8fafc;">
        <div style="width: 160px; font-weight: 700; color: #475569;">Amount in Words:</div>
        <div style="flex: 1; font-weight: 700; color: #0f172a; line-height: 1.4;">
          ${amountWords.english}
        </div>
      </div>

      <div style="display: flex; border-bottom: 1px solid #e2e8f0; padding: 10px 14px;">
        <div style="width: 160px; font-weight: 700; color: #475569;">Payment Method:</div>
        <div style="flex: 1; font-family: monospace; font-weight: 700; color: #0f172a;">
          ${doc.paymentMethod || 'Bank Transfer / Cash'}
        </div>
      </div>

      <div style="display: flex; padding: 10px 14px; background: #f8fafc;">
        <div style="width: 160px; font-weight: 700; color: #475569;">Being Payment For:</div>
        <div style="flex: 1; color: #334155;">
          ${doc.notes || `Settlement of Tax Invoice #${doc.docNumber} dated ${doc.date}.`}
        </div>
      </div>

    </div>

    <!-- Signatures -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; padding-top: 10px;">
      <div style="width: 40%; text-align: center;">
        <div style="height: 40px; border-bottom: 1px dashed #94a3b8; display: flex; align-items: flex-end; justify-content: center; font-size: 12px; font-weight: 700;">
          ${doc.preparedBy || 'Accounts Officer'}
        </div>
        <div style="font-size: 9px; font-family: monospace; font-weight: 700; color: #64748b; margin-top: 4px; text-transform: uppercase;">
          PREPARED & RECEIVED BY
        </div>
      </div>

      <div style="width: 40%; text-align: center;">
        <div style="height: 40px; border-bottom: 1px dashed #94a3b8; display: flex; align-items: flex-end; justify-content: center; font-size: 12px; font-weight: 700;">
          ${customer?.name ? customer.name.slice(0, 20) : 'Payer Signature'}
        </div>
        <div style="font-size: 9px; font-family: monospace; font-weight: 700; color: #64748b; margin-top: 4px; text-transform: uppercase;">
          CLIENT / PAYER SIGNATURE
        </div>
      </div>
    </div>

    <!-- Receipt Footer -->
    <div style="margin-top: 24px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 9px; font-family: monospace; color: #94a3b8; text-align: center;">
      This is a computerized official receipt voucher issued by ${company.name || 'evonix Technologies'}.
    </div>

  </div>

  ${options?.autoPrint ? `
    <script>
      window.onload = function() {
        setTimeout(function() {
          window.print();
        }, 500);
      };
    </script>
  ` : ''}

</body>
</html>`;

  triggerBrowserDownload(html, fileName);
};
