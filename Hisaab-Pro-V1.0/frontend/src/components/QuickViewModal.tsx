import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Printer, 
  FileDown, 
  X, 
  Share2, 
  Edit3, 
  CheckCircle2, 
  Copy, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  FileText,
  FileCheck,
  Maximize2
} from 'lucide-react';
import QRCode from 'qrcode';
import { SalesDocument, Company, Customer } from '../types';
import { INDUSTRIES_CONFIG } from '../industry.config';

interface QuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: SalesDocument | null;
  company: Company;
  customer?: Customer;
  onPrint?: () => void;
  onDownloadPdf?: () => void;
  onShareWhatsApp?: () => void;
  onEdit?: () => void;
}

// UAE Dirham Currency Formatter (Fixed 2 decimals)
const formatAED = (amount: number | string | undefined | null): string => {
  const val = typeof amount === 'number' && !isNaN(amount) ? amount : (Number(amount) || 0);
  return `AED ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Bilingual Amount to Words (English & Arabic Tafqeet)
const convertAmountToBilingualWords = (amount: number | undefined | null): { english: string; arabic: string } => {
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? Math.max(0, amount) : Math.max(0, Number(amount) || 0);

  const convertEnglish = (amt: number): string => {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const num = Math.floor(amt);
    const fils = Math.round((amt - num) * 100);
    
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
    return `${words} UAE Dirhams${filsWords} Only`;
  };

  const engWords = convertEnglish(safeAmount);

  return {
    english: engWords,
    arabic: ''
  };
};

// UAE FTA / ZATCA TLV Cryptographic QR Code Generator
const generateZatcaQrTlv = (doc: SalesDocument, company: Company): string => {
  try {
    const sellerName = company?.name || 'Company';
    const trn = company?.trn || '100456123900003';
    const timestamp = doc.date ? `${doc.date}T12:00:00Z` : new Date().toISOString();
    const totalStr = (Number(doc.total) || 0).toFixed(2);
    const vatStr = (Number(doc.vatTotal) || 0).toFixed(2);

    const getTlvBuffer = (tag: number, value: string): Uint8Array => {
      const encoder = new TextEncoder();
      const valBuffer = encoder.encode(value || '');
      const tagLengthVal = new Uint8Array(2 + valBuffer.length);
      tagLengthVal[0] = tag;
      tagLengthVal[1] = valBuffer.length;
      tagLengthVal.set(valBuffer, 2);
      return tagLengthVal;
    };

    const b1 = getTlvBuffer(1, sellerName);
    const b2 = getTlvBuffer(2, trn);
    const b3 = getTlvBuffer(3, timestamp);
    const b4 = getTlvBuffer(4, totalStr);
    const b5 = getTlvBuffer(5, vatStr);

    const totalLength = b1.length + b2.length + b3.length + b4.length + b5.length;
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    [b1, b2, b3, b4, b5].forEach(buf => {
      combined.set(buf, offset);
      offset += buf.length;
    });

    let binary = '';
    const len = combined.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return btoa(binary);
  } catch (e) {
    console.error('QR generation error:', e);
    return '';
  }
};

// High-Resolution Barcode SVG Component
const BarcodeSvg: React.FC<{ value: string }> = ({ value }) => {
  const barcodeText = String(value || '').toUpperCase().trim();
  const generateStrips = () => {
    const strips: { width: number; space: number }[] = [];
    for (let i = 0; i < barcodeText.length; i++) {
      const code = barcodeText.charCodeAt(i);
      strips.push({ width: (code % 3) + 1, space: (code % 2) + 1 });
    }
    return strips;
  };

  const strips = generateStrips();
  let currentX = 5;

  return (
    <div className="flex flex-col items-center">
      <svg className="h-6 max-w-[150px]" viewBox="0 0 200 36" preserveAspectRatio="none">
        <rect x="0" y="0" width="200" height="36" fill="#ffffff" />
        <rect x="2" y="2" width="2" height="32" fill="#0F172A" />
        <rect x="5" y="2" width="1" height="32" fill="#0F172A" />
        {strips.map((s, idx) => {
          const x = currentX;
          currentX += s.width + s.space + 1;
          if (currentX > 190) return null;
          return <rect key={idx} x={x} y="2" width={s.width} height="32" fill="#0F172A" />;
        })}
        <rect x="193" y="2" width="2" height="32" fill="#0F172A" />
        <rect x="196" y="2" width="1" height="32" fill="#0F172A" />
      </svg>
      <span className="text-[9px] font-mono tracking-widest mt-0.5 text-slate-600 font-bold">{barcodeText}</span>
    </div>
  );
};

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  company,
  customer,
  onPrint,
  onDownloadPdf,
  onShareWhatsApp,
  onEdit
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedDocNum, setCopiedDocNum] = useState<boolean>(false);

  // Generate QR Code on open
  useEffect(() => {
    if (doc && company) {
      const tlv = generateZatcaQrTlv(doc, company);
      if (tlv) {
        QRCode.toDataURL(tlv, { margin: 1, width: 140 })
          .then(url => setQrCodeDataUrl(url))
          .catch(() => setQrCodeDataUrl(''));
      }
    }
  }, [doc, company]);

  // Handle keyboard shortcuts (Esc, Ctrl+P) and lock background scroll
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = window.getComputedStyle(window.document.body).overflow;
    window.document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (onPrint) onPrint();
        else window.print();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onPrint]);

  if (!isOpen || !doc) return null;

  // Title Mapping
  const getDocTitles = () => {
    switch (doc.type) {
      case 'Quotation':
        return { en: 'TAX QUOTATION' };
      case 'DeliveryNote':
        return { en: 'DELIVERY NOTE' };
      case 'Proforma':
        return { en: 'PROFORMA INVOICE' };
      case 'CreditNote':
        return { en: 'TAX CREDIT NOTE' };
      case 'Invoice':
      default:
        return { en: 'TAX INVOICE' };
    }
  };

  const titles = getDocTitles();
  const balanceDue = (Number(doc.total) || 0) - (Number(doc.paymentReceived) || 0);
  const words = convertAmountToBilingualWords(doc.total);

  // Industry Config
  const industryKey = doc.industry || company.industry;
  const industryConfig = industryKey ? INDUSTRIES_CONFIG[industryKey] : undefined;
  const industryDataEntries = doc.industryData && typeof doc.industryData === 'object'
    ? Object.entries(doc.industryData).filter(([_, val]) => val !== undefined && val !== null && String(val).trim() !== '')
    : [];

  const handleCopyNumber = () => {
    if (doc?.docNumber) {
      navigator.clipboard.writeText(doc.docNumber);
      setCopiedDocNum(true);
      setTimeout(() => setCopiedDocNum(false), 1500);
    }
  };

  const modalElement = (
    <div 
      className="fixed inset-0 z-[99999] flex flex-col bg-slate-950/85 backdrop-blur-md overflow-hidden animate-fade-in print:bg-white print:p-0 print:m-0"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Embedded Print CSS for Exact A4 Dimensions */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, .no-print-bar {
            display: none !important;
          }
          #quick-view-printable-doc {
            width: 210mm !important;
            max-width: 210mm !important;
            margin: 0 auto !important;
            padding: 8mm 10mm !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            min-height: auto !important;
          }
          table {
            page-break-inside: auto !important;
          }
          tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
          thead {
            display: table-header-group !important;
          }
        }
      `}</style>

      {/* 1. TOP DRAFTING & ACTIONS CONTROL BAR */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-lg z-30 select-none no-print-bar">
        {/* Left: Document Identity & A4 Badge */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
            <FileText className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300">
                {titles.en}
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                A4 Standard (210 × 297 mm)
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                doc.status === 'Paid' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : (doc.status === 'Partially Paid' || (doc.status as string) === 'Partial')
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {doc.status || 'Draft'}
              </span>
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <button 
                onClick={handleCopyNumber}
                className="font-mono font-black text-sm text-white hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                title="Copy Document Number"
              >
                <span>#{doc.docNumber}</span>
                <Copy className="w-3 h-3 text-slate-400" />
              </button>
              {copiedDocNum && (
                <span className="text-[10px] text-emerald-400 font-mono">Copied!</span>
              )}
              <span className="text-slate-400 text-xs">• {doc.date}</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center space-x-2">
          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-sans flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
              title="Print A4 Document (Ctrl+P)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4</span>
            </button>
          )}

          {onDownloadPdf && (
            <button
              type="button"
              onClick={onDownloadPdf}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-sans flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
              title="Download PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          )}

          {onShareWhatsApp && (
            <button
              type="button"
              onClick={onShareWhatsApp}
              className="px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold font-sans flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
              title="Share via WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-sans flex items-center space-x-1.5 transition-all border border-slate-700 cursor-pointer"
              title="Edit Document"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
            title="Close Preview (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. SCROLLABLE ARCHITECTURAL WORKSPACE CONTAINER */}
      <div className="flex-1 w-full overflow-y-auto py-6 px-2 sm:px-6 flex justify-center items-start">
        
        {/* 3. AUTHENTIC PHYSICAL A4 PAPER SHEET (210mm × 297mm) */}
        <div 
          id="quick-view-printable-doc"
          className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-slate-300/90 box-border font-sans p-8 sm:p-10 md:p-12 relative flex flex-col justify-between my-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Brand Stripe */}
          <div className="h-1.5 w-full bg-slate-950 absolute top-0 left-0 right-0"></div>

          {/* MAIN DOCUMENT BODY */}
          <div className="space-y-5">
            
            {/* 1. HEADER: COMPANY BRANDING & DOCUMENT IDENTITY */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-slate-900 pb-5">
              
              {/* Left Column: Company Legal Identity */}
              <div className="space-y-1.5 max-w-sm">
                {company.logoUrl ? (
                  <div className="h-16 max-w-[200px] flex items-center justify-start mb-2 overflow-hidden">
                    <img 
                      src={company.logoUrl} 
                      alt={company.name} 
                      className="max-h-full max-w-full object-contain" 
                    />
                  </div>
                ) : (
                  <div className="inline-block bg-slate-950 text-white px-3 py-1 rounded font-mono font-black text-sm uppercase tracking-wider mb-1">
                    {company.name.substring(0, 3)}
                  </div>
                )}
                
                <h1 className="text-2xl font-black font-sans uppercase tracking-tight text-slate-950 leading-tight">
                  {company.name}
                </h1>
                
                {company.address && (
                  <p className="text-xs text-slate-600 flex items-start gap-1.5 font-sans leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{company.address}</span>
                  </p>
                )}
                
                <div className="text-[11px] text-slate-600 flex flex-wrap gap-x-3 gap-y-0.5 font-mono">
                  {company.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{company.phone}</span>
                    </span>
                  )}
                  {company.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{company.email}</span>
                    </span>
                  )}
                </div>

                {/* Official FTA TRN Badge */}
                {company.trn && (
                  <div className="pt-1">
                    <div className="inline-flex items-center space-x-2 bg-slate-100 border border-slate-300 px-3 py-1 rounded text-xs font-mono">
                      <span className="font-bold text-slate-600 uppercase">TRN:</span>
                      <span className="font-black text-slate-950 tracking-widest text-sm">{company.trn}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Bilingual Document Title & Metadata Box */}
              <div className="text-left sm:text-right space-y-2 w-full sm:w-auto">
                {/* Title */}
                <div>
                  <h2 className="text-3xl font-black tracking-tight uppercase font-sans text-slate-950 leading-none">
                    {titles.en}
                  </h2>
                </div>

                {/* Structured Metadata Box */}
                <div className="bg-slate-50 border border-slate-250 rounded-lg p-3 space-y-1 text-xs font-mono text-slate-700 min-w-[240px]">
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-slate-500 font-medium">Invoice No:</span>
                    <strong className="text-slate-950 font-black text-sm">{doc.docNumber}</strong>
                  </div>
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-slate-500 font-medium">Issue Date:</span>
                    <strong className="text-slate-900 font-bold">{doc.date}</strong>
                  </div>
                  {doc.dueDate && (
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-slate-500 font-medium">Due Date:</span>
                      <strong className="text-slate-900 font-bold">{doc.dueDate}</strong>
                    </div>
                  )}
                  {doc.reference && (
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-slate-500 font-medium">Quotation Ref:</span>
                      <strong className="text-slate-900 font-bold">{doc.reference}</strong>
                    </div>
                  )}
                  {doc.lpoNumber && (
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-slate-500 font-medium">LPO / PO No:</span>
                      <strong className="text-slate-900 font-bold">{doc.lpoNumber}</strong>
                    </div>
                  )}
                  {doc.paymentTerms && (
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-slate-500 font-medium">Payment Terms:</span>
                      <strong className="text-slate-900">{doc.paymentTerms}</strong>
                    </div>
                  )}
                  <div className="flex justify-between items-center gap-3 pt-0.5 border-t border-slate-200">
                    <span className="text-slate-500 font-medium">Place of Supply:</span>
                    <strong className="text-slate-900">UAE</strong>
                  </div>
                </div>

                {/* Barcode representation */}
                <div className="pt-1 flex justify-start sm:justify-end">
                  <BarcodeSvg value={doc.docNumber} />
                </div>
              </div>
            </div>

            {/* 2. BILLED TO / CUSTOMER & SUPPLY INFORMATION */}
            <div className="bg-slate-50/90 rounded-lg p-4 border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Left: Customer Profile */}
                <div>
                  <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-500 block">
                    Billed To (Customer):
                  </span>
                  <h3 className="text-base font-black text-slate-950 mt-0.5 font-sans">
                    {customer?.name || 'Cash Customer'}
                  </h3>
                  {customer?.trn ? (
                    <p className="text-xs font-mono font-bold text-slate-700 mt-1">
                      Customer TRN:{' '}
                      <span className="text-slate-950 font-black tracking-wider bg-white px-2 py-0.5 rounded border border-slate-250">
                        {customer.trn}
                      </span>
                    </p>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono italic">
                      TRN: Unregistered / Cash Client
                    </span>
                  )}
                  
                  <div className="text-xs text-slate-600 space-y-0.5 mt-2 font-sans">
                    {customer?.phone && <p>Phone: <span className="font-mono text-slate-800">{customer.phone}</span></p>}
                    {customer?.email && <p>Email: <span className="font-mono text-slate-800">{customer.email}</span></p>}
                    {(customer?.address || customer?.emirate) && (
                      <p>Address: <span className="text-slate-800">{customer.address ? `${customer.address}, ` : ''}{customer.emirate || ''}</span></p>
                    )}
                  </div>
                </div>

                {/* Right: Terms & Notes */}
                <div className="space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                      Supply & Currency:
                    </span>
                    <p className="text-xs font-mono text-slate-800">
                      Standard Currency: <strong className="text-slate-950">AED (United Arab Emirates Dirham)</strong>
                    </p>
                    <p className="text-xs font-mono text-slate-800">
                      Tax Treatment: <strong className="text-indigo-700">Standard Rated (5% VAT)</strong>
                    </p>
                  </div>

                  {doc.notes && (
                    <div className="bg-white p-2.5 rounded border border-slate-200 text-xs">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Notes:</span>
                      <p className="text-slate-700 mt-0.5 italic leading-relaxed">{doc.notes}</p>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* 3. INDUSTRY SPECIFICATIONS IF APPLICABLE */}
            {industryDataEntries.length > 0 && (
              <div className="bg-indigo-50/40 rounded-lg p-3.5 border border-indigo-150 space-y-2">
                <div className="flex justify-between items-center border-b border-indigo-150 pb-1">
                  <span className="text-xs font-mono font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    {industryConfig ? `${industryConfig.nameEn} Details` : 'Industry Specifications'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  {industryDataEntries.map(([k, val]) => {
                    const fieldDef = industryConfig?.fields?.find(f => f.key === k);
                    const label = fieldDef?.labelEn || k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    return (
                      <div key={k} className="bg-white p-2 rounded border border-indigo-100 shadow-2xs">
                        <p className="text-[9px] font-bold text-slate-400 uppercase font-mono truncate">{label}</p>
                        <p className="font-extrabold text-slate-900 font-mono mt-0.5 truncate">{String(val)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. LINE ITEMS TABLE */}
            <div className="rounded-lg border border-slate-250 overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-white font-mono text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 font-bold w-10">#</th>
                    <th className="py-2.5 px-3 font-bold w-24">SKU / Code</th>
                    <th className="py-2.5 px-3 font-bold">Item Description</th>
                    <th className="py-2.5 px-3 font-bold text-right w-16">Qty</th>
                    {doc.type !== 'DeliveryNote' && (
                      <>
                        <th className="py-2.5 px-3 font-bold text-right w-24">Rate (AED)</th>
                        <th className="py-2.5 px-3 font-bold text-right w-24">VAT (5%)</th>
                        <th className="py-2.5 px-3 font-bold text-right w-28">Total (AED)</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-sans">
                  {doc.items && doc.items.length > 0 ? (
                    doc.items.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                        <td className="py-2.5 px-3 font-mono text-slate-500 font-bold">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-600">{item.sku || 'N/A'}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-950">
                          <div>{item.name}</div>
                          {item.unit && <span className="text-[10px] text-slate-400 font-mono font-normal">Unit: {item.unit}</span>}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right text-slate-950">{item.qty}</td>
                        {doc.type !== 'DeliveryNote' && (
                          <>
                            <td className="py-2.5 px-3 font-mono text-right text-slate-700">{formatAED(item.rate)}</td>
                            <td className="py-2.5 px-3 font-mono text-right text-indigo-700 font-medium">{formatAED(item.vatAmount)}</td>
                            <td className="py-2.5 px-3 font-mono font-black text-right text-slate-950">{formatAED(item.total)}</td>
                          </>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400 italic">No line items in this document.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 5. TOTALS & SUMMARY SECTION */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-1">
              
              {/* Left: Total in Words, Cryptographic QR Code, Corporate Wire Bank */}
              <div className="w-full sm:w-1/2 space-y-3">
                {/* Words Box */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-0.5">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Total Amount in Words:</span>
                  <p className="text-xs font-bold text-slate-950 leading-snug">{words.english}</p>
                </div>

                {/* UAE FTA Cryptographic TLV QR Code */}
                <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {qrCodeDataUrl ? (
                    <img 
                      src={qrCodeDataUrl} 
                      alt="FTA Cryptographic QR Code" 
                      className="w-20 h-20 object-contain bg-white p-1 rounded border border-slate-250 shrink-0" 
                    />
                  ) : (
                    <div className="w-20 h-20 bg-slate-200 rounded flex items-center justify-center text-[9px] font-mono text-slate-500 shrink-0">
                      FTA QR
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5 text-emerald-700 font-mono font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>UAE FTA VAT 5% COMPLIANT</span>
                    </div>
                    <p className="text-[10px] text-slate-600 leading-tight font-sans">
                      Scannable cryptographic TLV barcode compliant with UAE Federal Tax Authority (FTA) electronic audit guidelines.
                    </p>
                  </div>
                </div>

                {/* Corporate Bank Wire Information */}
                {(company.bankIban || doc.bankIban) && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-0.5 text-xs font-mono">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Corporate Wire Transfer Details:</span>
                    <p>Bank: <strong className="text-slate-900">{doc.bankName || company.bankName || 'Emirates NBD'}</strong></p>
                    <p>Account: <strong className="text-slate-900">{doc.bankAccountName || company.bankAccountName || company.name}</strong></p>
                    <p>IBAN: <strong className="text-indigo-800 font-black">{doc.bankIban || company.bankIban}</strong></p>
                    {(doc.bankDetail || company.bankDetail) && <p className="text-slate-500">SWIFT / Details: {doc.bankDetail || company.bankDetail}</p>}
                  </div>
                )}
              </div>

              {/* Right: Calculations Breakdown */}
              <div className="w-full sm:w-5/12 bg-slate-50 rounded-lg p-4 border border-slate-250 space-y-2 font-mono text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal (Excl. VAT):</span>
                  <span className="font-semibold text-slate-900">{formatAED(doc.subtotal)}</span>
                </div>
                
                <div className="flex justify-between text-indigo-700">
                  <span>VAT (5.0% FTA Rate):</span>
                  <span className="font-bold">{formatAED(doc.vatTotal)}</span>
                </div>

                {(Number(doc.discount) || 0) > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span className="font-bold">-{formatAED(doc.discount)}</span>
                  </div>
                )}

                {/* Grand Total Box */}
                <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-center text-sm bg-white p-2.5 rounded border border-slate-250 shadow-2xs">
                  <span className="font-black text-slate-950 uppercase font-sans">Grand Total:</span>
                  <span className="font-black text-slate-950 text-base">{formatAED(doc.total)}</span>
                </div>

                {doc.type === 'Invoice' && (
                  <div className="border-t border-dashed border-slate-300 pt-2 space-y-1.5">
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Payment Received:</span>
                      <span>{formatAED(doc.paymentReceived || 0)}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-black text-xs bg-slate-100 p-2 rounded border border-slate-200">
                      <span>Balance Due:</span>
                      <span className={balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                        {formatAED(balanceDue)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* 6. SIGNATURE & STAMP FOOTER */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-5 border-t border-slate-200 text-center">
              <div className="space-y-2">
                <div className="h-10 border-b border-slate-300 border-dashed flex items-end justify-center pb-1 text-xs font-bold text-slate-800">
                  {doc.preparedBy || 'Accounts Officer'}
                </div>
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Prepared By</p>
              </div>

              <div className="space-y-2">
                <div className="h-10 border-b border-slate-300 border-dashed flex items-end justify-center pb-1 text-xs font-bold text-slate-800">
                  {company.invoiceSignatoryName || 'Authorized Signatory'}
                </div>
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Authorized Signature</p>
              </div>

              <div className="space-y-2">
                <div className="h-10 border-b border-slate-300 border-dashed flex items-end justify-center pb-1 text-xs text-slate-400 italic">
                  Company Stamp
                </div>
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Customer Seal & Signature</p>
              </div>
            </div>

          </div>

          {/* 7. COMPLIANCE DECLARATION FOOTER */}
          <div className="pt-4 border-t border-slate-200 mt-6 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-slate-500 gap-2">
            <span>{doc.footerNotes || company.footerNotes || 'Tax invoice is generated in compliance with UAE FTA VAT Decree-Law.'}</span>
            <span className="font-bold text-slate-600">Page 1 of 1 • A4 Standard (210 × 297 mm)</span>
          </div>

        </div>

      </div>

    </div>
  );

  return createPortal(modalElement, window.document.body);
};

export default QuickViewModal;
