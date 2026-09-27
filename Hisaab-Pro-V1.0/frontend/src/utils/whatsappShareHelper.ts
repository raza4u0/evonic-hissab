import { Company, Customer, SalesDocument } from '../types';

/**
 * Clean & format mobile/phone number to international format (Defaults to UAE +971 if local 05x or 9-digit)
 */
export const sanitizeWhatsAppPhone = (phoneRaw?: string): string => {
  if (!phoneRaw) return '';
  let digits = phoneRaw.replace(/[^0-9]/g, '');
  if (!digits) return '';

  if (digits.startsWith('00')) {
    digits = digits.substring(2);
  }

  // UAE local numbers (e.g. 0501234567 -> 971501234567)
  if (digits.startsWith('05') && digits.length === 10) {
    return '971' + digits.substring(1);
  }
  if (digits.startsWith('0') && (digits.length === 9 || digits.length === 10)) {
    return '971' + digits.substring(1);
  }
  // If 9 digits starting with 5 (e.g. 501234567)
  if (digits.length === 9 && digits.startsWith('5')) {
    return '971' + digits;
  }
  // If already starts with 971 or other country code
  return digits;
};

/**
 * Generate English WhatsApp message for Sales Document (Invoice, Quotation, Proforma, Credit Note, Delivery Note)
 */
export const generateDocumentWhatsAppMessage = (
  doc: SalesDocument,
  company: Company,
  customer?: Customer
): { messageText: string; text: string; whatsAppUrl: string; url: string; sanitizedPhone: string } => {
  const currency = company.currency || 'AED';
  const docTypeName = 
    doc.type === 'Invoice' ? 'Tax Invoice' :
    doc.type === 'Quotation' ? 'Quotation' :
    doc.type === 'Proforma' ? 'Proforma Invoice' :
    doc.type === 'CreditNote' ? 'Credit Note' :
    doc.type === 'DeliveryNote' ? 'Delivery Note' : `${doc.type} Document`;

  const customerName = customer?.name || customer?.companyName || 'Valued Customer';
  const customerPhone = customer?.mobileNumber || customer?.phone || '';
  const sanitizedPhone = sanitizeWhatsAppPhone(customerPhone);

  const balanceDue = doc.type === 'Invoice' ? Math.max(0, doc.total - (doc.paymentReceived || 0)) : doc.total;

  const lines: string[] = [
    `*${company.name}*`,
    company.trn ? `*TRN:* ${company.trn}` : '',
    `━━━━━━━━━━━━━━━━━━━━`,
    `Dear *${customerName}*,`,
    ``,
    `Please find your official *${docTypeName}* details below:`,
    ``,
    `📄 *Doc No:* ${doc.docNumber}`,
    `📅 *Date:* ${doc.date}`,
    doc.dueDate ? `⏳ *Due Date:* ${doc.dueDate}` : '',
    `📦 *Items Count:* ${doc.items?.length || 0}`,
    ``,
    `💵 *Subtotal:* ${currency} ${doc.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    doc.vatTotal > 0 ? `📊 *VAT (5%):* ${currency} ${doc.vatTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '',
    `💰 *Grand Total:* *${currency} ${doc.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*`,
    doc.type === 'Invoice' && doc.paymentReceived && doc.paymentReceived > 0 
      ? `✅ *Paid:* ${currency} ${doc.paymentReceived.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n⚠️ *Balance Due:* *${currency} ${balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*` 
      : '',
    ``,
    company.bankIban ? `🏦 *Bank Transfer Details:*` : '',
    company.bankName ? `• Bank: ${company.bankName}` : '',
    company.bankAccountName ? `• Account Title: ${company.bankAccountName}` : '',
    company.bankIban ? `• IBAN: *${company.bankIban}*` : '',
    company.bankIban ? `` : '',
    `📥 *View / Download Official PDF:*`,
    `${window.location.origin}/#invoice-${doc.id}`,
    ``,
    `Thank you for doing business with us!`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📞 ${company.phone || ''} ${company.email ? `| ✉️ ${company.email}` : ''}`
  ].filter(line => line !== undefined && line !== null);

  const messageText = lines.join('\n');
  const whatsAppUrl = `https://api.whatsapp.com/send?${sanitizedPhone ? `phone=${sanitizedPhone}&` : ''}text=${encodeURIComponent(messageText)}`;

  return { messageText, text: messageText, whatsAppUrl, url: whatsAppUrl, sanitizedPhone };
};

/**
 * Generate English WhatsApp message for Customer Statement / Ledger
 */
export const generateCustomerStatementWhatsAppMessage = (
  customer: Customer,
  company: Company,
  totalSalesOrBalance: number,
  docsOrTotalPaid?: SalesDocument[] | number,
  outstandingBalanceParam?: number,
  unpaidCountParam?: number
): { messageText: string; text: string; whatsAppUrl: string; url: string; sanitizedPhone: string } => {
  const currency = company.currency || 'AED';
  const customerName = customer.name || customer.companyName || 'Valued Customer';
  const customerPhone = customer.mobileNumber || customer.phone || '';
  const sanitizedPhone = sanitizeWhatsAppPhone(customerPhone);

  let totalSales = 0;
  let totalPaid = 0;
  let outstandingBalance = 0;
  let unpaidInvoicesCount = 0;

  if (Array.isArray(docsOrTotalPaid)) {
    const docs = docsOrTotalPaid;
    const invoices = docs.filter(d => d.type === 'Invoice');
    totalSales = invoices.reduce((acc, d) => acc + (d.total || 0), 0);
    totalPaid = invoices.reduce((acc, d) => acc + (d.paymentReceived || 0), 0);
    outstandingBalance = totalSalesOrBalance !== undefined && totalSalesOrBalance !== 0 ? totalSalesOrBalance : Math.max(0, totalSales - totalPaid);
    unpaidInvoicesCount = invoices.filter(d => (d.total || 0) > (d.paymentReceived || 0)).length;
  } else if (typeof docsOrTotalPaid === 'number') {
    totalSales = totalSalesOrBalance;
    totalPaid = docsOrTotalPaid;
    outstandingBalance = outstandingBalanceParam !== undefined ? outstandingBalanceParam : (totalSales - totalPaid);
    unpaidInvoicesCount = unpaidCountParam || 0;
  } else {
    outstandingBalance = totalSalesOrBalance;
  }

  const lines: string[] = [
    `*${company.name}*`,
    `*STATEMENT OF ACCOUNT*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `Dear: *${customerName}*`,
    customer.trn ? `TRN: ${customer.trn}` : '',
    ``,
    `Here is a summary of your current account ledger:`,
    ``,
    totalSales > 0 ? `📈 *Total Billed:* ${currency} ${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '',
    totalPaid > 0 ? `✅ *Total Received:* ${currency} ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '',
    `🔴 *Outstanding Balance:* *${currency} ${outstandingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*`,
    unpaidInvoicesCount > 0 ? `📑 *Pending Invoices:* ${unpaidInvoicesCount} Invoices` : '',
    ``,
    company.bankIban ? `🏦 *Settlement Bank Details:*` : '',
    company.bankName ? `• Bank: ${company.bankName}` : '',
    company.bankAccountName ? `• Account: ${company.bankAccountName}` : '',
    company.bankIban ? `• IBAN: *${company.bankIban}*` : '',
    company.bankIban ? `` : '',
    `Kindly arrange the payment settlement at your earliest convenience.`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📞 ${company.phone || ''} ${company.email ? `| ✉️ ${company.email}` : ''}`
  ].filter(line => line !== undefined && line !== null && line !== '');

  const messageText = lines.join('\n');
  const whatsAppUrl = `https://api.whatsapp.com/send?${sanitizedPhone ? `phone=${sanitizedPhone}&` : ''}text=${encodeURIComponent(messageText)}`;

  return { messageText, text: messageText, whatsAppUrl, url: whatsAppUrl, sanitizedPhone };
};

/**
 * Trigger direct 1-click WhatsApp window open with fallback clipboard copy
 */
export const openDirectWhatsApp = (
  url: string,
  messageText?: string,
  docOrCustomerLabel?: string
) => {
  try {
    const win = window.open(url, '_blank');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      if (messageText) {
        navigator.clipboard.writeText(messageText);
        alert(`WhatsApp popup was blocked or mobile app is not active.\n\nThe formatted bilingual message for "${docOrCustomerLabel || 'document'}" has been COPIED to your clipboard!\nYou can paste it directly into WhatsApp.`);
      }
    }
  } catch (e) {
    if (messageText) {
      navigator.clipboard.writeText(messageText);
      alert(`The formatted message has been copied to your clipboard.`);
    }
  }
};
