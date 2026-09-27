import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Printer, 
  FileDown, 
  X, 
  Check, 
  Grid, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Settings2, 
  Eye, 
  Share2, 
  RotateCcw,
  FileText,
  FileCode,
  ExternalLink,
  Sliders,
  ChevronDown,
  Layers,
  ChevronLeft,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { triggerPrint, downloadStandaloneHTML, openCleanPrintWindow } from '../utils/printHelper';
import { generateAndDownloadPDF } from '../utils/pdfCanvasSanitizer';

export type PaperSize = 'A4' | 'A5' | 'Thermal';
export type MarginOption = 'normal' | 'narrow' | 'wide';

export interface PrintPreviewOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  docNumber?: string;
  targetId?: string;
  defaultPaperSize?: PaperSize;
  children?: React.ReactNode;
  extraActions?: React.ReactNode;
  onCustomPrint?: (paperSize: PaperSize, margin: MarginOption) => void;
  onCustomPdf?: (paperSize: PaperSize, margin: MarginOption) => void;
  onCustomHtml?: (paperSize: PaperSize, margin: MarginOption) => void;
  onShareWhatsApp?: () => void;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number | 'auto' | 'continuous';
  onItemsPerPageChange?: (val: number | 'auto' | 'continuous') => void;
  pageLayoutMode?: 'paginated' | 'continuous';
  onPageLayoutModeChange?: (mode: 'paginated' | 'continuous') => void;
}

export const PrintPreviewOverlay: React.FC<PrintPreviewOverlayProps> = ({
  isOpen,
  onClose,
  title = 'Document Print Preview',
  docNumber,
  targetId = 'printable-invoice-body',
  defaultPaperSize = 'A4',
  children,
  extraActions,
  onCustomPrint,
  onCustomPdf,
  onCustomHtml,
  onShareWhatsApp,
  totalPages = 1,
  currentPage = 1,
  onPageChange,
  itemsPerPage = 'auto',
  onItemsPerPageChange,
  pageLayoutMode = 'paginated',
  onPageLayoutModeChange,
}) => {
  const [paperSize, setPaperSize] = useState<PaperSize>(defaultPaperSize);
  const [margin, setMargin] = useState<MarginOption>('normal');
  const [showAlignmentGrid, setShowAlignmentGrid] = useState<boolean>(false);
  const [showMarginGuides, setShowMarginGuides] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(1);

  const previewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPaperSize(defaultPaperSize);
  }, [defaultPaperSize, isOpen]);

  useEffect(() => {
    if (currentPage) {
      setActiveSheetIndex(currentPage);
    }
  }, [currentPage]);

  if (!isOpen) return null;

  const handleExecutePrint = async () => {
    setIsPrinting(true);
    try {
      if (onCustomPrint) {
        onCustomPrint(paperSize, margin);
      } else {
        await triggerPrint(targetId, paperSize);
      }
    } catch (err) {
      console.error('Print execution error:', err);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleExecuteDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      if (onCustomPdf) {
        onCustomPdf(paperSize, margin);
      } else {
        const el = document.getElementById(targetId);
        if (el) {
          await generateAndDownloadPDF(el, `${title.replace(/\s+/g, '_')}_${docNumber || 'Doc'}`, {
            targetId,
            paperSize: paperSize.toLowerCase() as any,
            docTitle: `${title} #${docNumber || ''}`
          });
        }
      }
    } catch (err) {
      console.error('PDF Generation Error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExecuteDownloadHtml = () => {
    if (onCustomHtml) {
      onCustomHtml(paperSize, margin);
    } else {
      const rawTitle = title || 'Document';
      const cleanDocNo = docNumber ? `_${docNumber}` : '';
      downloadStandaloneHTML({
        elementOrId: targetId,
        fileName: `${rawTitle.replace(/\s+/g, '_')}${cleanDocNo}.html`,
        docTitle: `${rawTitle} ${docNumber ? `#${docNumber}` : ''}`,
        paperSize
      });
    }
  };

  const handleExecuteOpenPrintTab = () => {
    openCleanPrintWindow(targetId, paperSize, `${title} ${docNumber ? `#${docNumber}` : ''}`);
  };

  const resetView = () => {
    setZoomLevel(100);
    setShowAlignmentGrid(false);
    setShowMarginGuides(false);
    setMargin('normal');
  };

  // Dimensions helper text
  const paperSpecText = paperSize === 'A4'
    ? 'Standard ISO A4 (210 × 297 mm / 8.27 × 11.69 in)'
    : paperSize === 'A5'
    ? 'Compact ISO A5 (148 × 210 mm / 5.83 × 8.27 in)'
    : 'Thermal Receipt (80 mm / 3.15 in Roll)';

  // Paper container width class based on format
  const getPaperWidthStyle = () => {
    if (paperSize === 'A5') return 'max-w-[148mm] w-full min-h-[210mm]';
    if (paperSize === 'Thermal') return 'max-w-[80mm] w-full min-h-[160mm]';
    return 'max-w-[210mm] w-full min-h-[297mm]'; // A4
  };

  // Margin padding CSS (keeps virtual sheet exactly true to ISO dimensions without artificial shrinking)
  const getMarginPadding = () => {
    if (paperSize === 'Thermal') return 'p-1';
    return 'p-0';
  };

  const handlePageSelect = (page: number) => {
    setActiveSheetIndex(page);
    if (onPageChange) {
      onPageChange(page);
    }
    // Scroll sheet into view if available
    const sheetEl = document.getElementById(`doc-sheet-page-${page}`);
    if (sheetEl) {
      sheetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex flex-col font-sans text-slate-100 overflow-hidden animate-fade-in print:bg-white print:p-0 print:m-0">
      
      {/* 1. TOP CONTROL BAR / HEADER */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 shadow-lg z-20 no-print">
        
        {/* Title & Specs */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-black uppercase tracking-wide text-white">{title}</h2>
                {docNumber && (
                  <span className="bg-slate-800 text-indigo-400 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700">
                    #{docNumber}
                  </span>
                )}
                {/* Total Pages Badge */}
                <span className="bg-indigo-950/80 text-indigo-300 font-mono text-[10px] font-black px-2 py-0.5 rounded-full border border-indigo-500/40 flex items-center space-x-1 shadow-xs">
                  <Layers className="w-3 h-3 text-indigo-400" />
                  <span>{totalPages} {totalPages === 1 ? 'Page' : 'Pages'}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">{paperSpecText}</p>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper Size, Pagination Settings & Alignment Toolbar */}
        <div className="flex flex-wrap items-center gap-2 justify-center w-full md:w-auto">
          
          {/* Paper Size Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 shadow-inner">
            <button
              type="button"
              onClick={() => setPaperSize('A4')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1 ${
                paperSize === 'A4' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>A4</span>
              <span className="text-[9px] opacity-75 font-normal hidden sm:inline">(Standard)</span>
            </button>
            <button
              type="button"
              onClick={() => setPaperSize('A5')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1 ${
                paperSize === 'A5' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>A5</span>
              <span className="text-[9px] opacity-75 font-normal hidden sm:inline">(Compact)</span>
            </button>
            <button
              type="button"
              onClick={() => setPaperSize('Thermal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1 ${
                paperSize === 'Thermal' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>80mm</span>
              <span className="text-[9px] opacity-75 font-normal hidden sm:inline">(Thermal)</span>
            </button>
          </div>

          {/* Items Per Page / Multi-Page Setting Selector */}
          {onItemsPerPageChange && (
            <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Page Flow:</span>
              <select
                value={String(itemsPerPage)}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'auto' || val === 'continuous') {
                    onItemsPerPageChange(val);
                  } else {
                    onItemsPerPageChange(Number(val));
                  }
                }}
                className="bg-slate-900 border border-slate-700 text-indigo-300 text-xs font-bold rounded-lg px-2 py-1 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                title="Configure items pagination per page (e.g. 20 items across 2 pages)"
              >
                <option value="auto">Auto Smart Paging</option>
                <option value="8">8 Items / Page</option>
                <option value="10">10 Items / Page</option>
                <option value="12">12 Items / Page</option>
                <option value="15">15 Items / Page</option>
                <option value="20">20 Items / Page</option>
                <option value="continuous">Continuous Single Flow</option>
              </select>
            </div>
          )}

          {/* Alignment Tools Segment */}
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setShowAlignmentGrid(!showAlignmentGrid)}
              className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
                showAlignmentGrid ? 'bg-slate-800 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Alignment Grid (Verify column margins & header symmetry)"
            >
              <Grid className="w-4 h-4" />
              <span className="text-[10px] hidden sm:inline">Grid</span>
            </button>

            <button
              type="button"
              onClick={() => setShowMarginGuides(!showMarginGuides)}
              className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
                showMarginGuides ? 'bg-slate-800 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Margin Guidelines"
            >
              <Eye className="w-4 h-4" />
              <span className="text-[10px] hidden sm:inline">Margins</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono font-bold text-slate-300 w-10 text-center">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center space-x-2 shrink-0">
          
          {extraActions}

          {/* Download Standalone HTML (1-Click for Ctrl+P printing) */}
          <button
            type="button"
            onClick={handleExecuteDownloadHtml}
            className="px-3.5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer shadow-emerald-900/30 hover:scale-105"
            title="Download Standalone HTML (Open in any browser & press Ctrl+P to print)"
          >
            <FileCode className="w-4 h-4 text-emerald-200" />
            <span>HTML (Ctrl+P)</span>
          </button>

          {/* Open in Standalone Print Window */}
          <button
            type="button"
            onClick={handleExecuteOpenPrintTab}
            className="hidden sm:flex px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl shadow-md transition-all items-center space-x-1 cursor-pointer border border-slate-700"
            title="Open in Clean Print Tab (Immediate Ctrl+P)"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>Print Tab</span>
          </button>

          {/* Share on WhatsApp */}
          {onShareWhatsApp && (
            <button
              type="button"
              onClick={onShareWhatsApp}
              className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer shadow-[#25D366]/20"
              title="Share Document via WhatsApp (1-Click)"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.413 9.863-9.864.001-2.641-1.025-5.125-2.889-6.991C16.581 1.884 14.09 1.857 11.455 1.857c-5.437 0-9.863 4.414-9.866 9.865-.001 1.84.482 3.633 1.4 5.2l-.372 1.36 1.397-.366zm13.111-6.126c-.287-.144-1.702-.84-1.965-.936-.264-.096-.456-.144-.648.144-.192.288-.744.936-.912 1.128-.168.192-.336.216-.624.072-.288-.144-1.215-.447-2.316-1.428-.856-.764-1.433-1.706-1.6-1.994-.168-.288-.018-.444.126-.586.13-.128.288-.336.432-.504.144-.168.192-.288.288-.48.096-.192.048-.36-.024-.504-.072-.144-.648-1.56-.888-2.136-.233-.561-.47-.485-.648-.494-.168-.008-.36-.01-.552-.01s-.504.072-.768.36c-.264.288-1.008.984-1.008 2.4 0 1.416 1.032 2.784 1.176 2.976.144.192 2.031 3.102 4.921 4.349.687.296 1.224.474 1.643.607.69.219 1.32.188 1.817.114.553-.082 1.702-.696 1.944-1.368.24-.672.24-1.248.168-1.368-.072-.12-.264-.192-.552-.336z"/>
              </svg>
              <span>WhatsApp</span>
            </button>
          )}

          {/* Download PDF */}
          <button
            type="button"
            disabled={isGeneratingPdf}
            onClick={handleExecuteDownloadPdf}
            className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>{isGeneratingPdf ? 'Exporting...' : 'PDF'}</span>
          </button>

          {/* Main Print Trigger */}
          <button
            type="button"
            disabled={isPrinting}
            onClick={handleExecutePrint}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center space-x-2 cursor-pointer border border-indigo-400/30 hover:scale-105"
          >
            <Printer className="w-4 h-4" />
            <span>{isPrinting ? 'Printing...' : `Print (${paperSize})`}</span>
          </button>

          {/* Exit Modal Button */}
          <button
            type="button"
            onClick={onClose}
            className="hidden md:flex p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>

        </div>

      </header>

      {/* 2. SUB-BAR: MULTI-PAGE NAVIGATION & FORMAT INFO */}
      <div className="bg-slate-900/80 border-b border-slate-800/80 px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 z-10 no-print">
        
        {/* Document Format Info */}
        <div className="flex items-center space-x-2 text-[11px] text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span className="font-semibold text-slate-200">
            {paperSize === 'A4' ? 'A4 Standard (210×297mm)' : paperSize === 'A5' ? 'A5 Compact (148×210mm)' : '80mm POS Thermal Receipt'}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">Exact 1:1 Print Alignment • Ctrl+P Ready</span>
        </div>

        {/* Multi-Page Quick Jump Bar if > 1 page */}
        {totalPages > 1 && (
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
            <button
              type="button"
              disabled={activeSheetIndex <= 1}
              onClick={() => handlePageSelect(Math.max(1, activeSheetIndex - 1))}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold text-slate-200">
              Page <span className="text-indigo-400">{activeSheetIndex}</span> of {totalPages}
            </span>
            <button
              type="button"
              disabled={activeSheetIndex >= totalPages}
              onClick={() => handlePageSelect(Math.min(totalPages, activeSheetIndex + 1))}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <div className="hidden sm:flex items-center space-x-1 ml-2 border-l border-slate-800 pl-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  type="button"
                  onClick={() => handlePageSelect(pg)}
                  className={`w-5 h-5 rounded text-[10px] font-mono font-bold flex items-center justify-center transition cursor-pointer ${
                    activeSheetIndex === pg
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {pg}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Verification Status */}
        <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>Format: {paperSize} Ready ({totalPages} {totalPages === 1 ? 'Sheet' : 'Sheets'})</span>
          </span>
          <button
            type="button"
            onClick={resetView}
            className="hover:text-white flex items-center space-x-1 cursor-pointer text-[10px] font-sans"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Alignment</span>
          </button>
        </div>
      </div>

      {/* 3. MAIN DRAFTING CANVAS & VIRTUAL PAPER VIEWPORT */}
      <main className="flex-1 overflow-auto p-4 sm:p-8 bg-[#0B0F19] flex justify-center items-start relative select-none">
        
        {/* Paper Container Wrapper */}
        <div 
          ref={previewContainerRef}
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          className="transition-transform duration-200 ease-out flex justify-center w-full"
        >
          <div className={`relative bg-white text-slate-900 shadow-2xl rounded-sm transition-all duration-300 ${getPaperWidthStyle()} ${getMarginPadding()} border border-slate-200`}>
            
            {/* Visual Alignment Overlay Grid (Toggleable) */}
            {showAlignmentGrid && (
              <div className="absolute inset-0 pointer-events-none z-30 opacity-15 overflow-hidden rounded-sm">
                <div 
                  className="w-full h-full"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, #4f46e5 1px, transparent 1px),
                      linear-gradient(to bottom, #4f46e5 1px, transparent 1px)
                    `,
                    backgroundSize: paperSize === 'Thermal' ? '10mm 10mm' : '15mm 15mm'
                  }}
                />
              </div>
            )}

            {/* Printable Margin Guidelines (Toggleable) */}
            {showMarginGuides && (
              <div className="absolute inset-2 sm:inset-4 border border-dashed border-indigo-400/40 pointer-events-none z-30 rounded-xs flex flex-col justify-between p-1">
                <div className="flex justify-between items-center text-[8px] font-mono font-bold text-indigo-500/70 uppercase tracking-wider">
                  <span>Top Print Margin</span>
                  <span>{paperSize} Page Boundary</span>
                </div>
                <div className="flex justify-between items-center text-[8px] font-mono font-bold text-indigo-500/70 uppercase tracking-wider">
                  <span>Bottom Print Margin</span>
                  <span>Hisaab Pro Certified</span>
                </div>
              </div>
            )}

            {/* Paper Corner Badge */}
            <div className="absolute top-2 right-2 bg-indigo-50/90 text-indigo-700 text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-indigo-200/80 no-print z-20 shadow-xs">
              {paperSize} Sheet • {totalPages} {totalPages === 1 ? 'Page' : 'Pages'} ({zoomLevel}%)
            </div>

            {/* Render Target Document / Children */}
            <div className="relative z-10 w-full text-slate-900">
              {children ? children : (
                <div id="print-preview-content-placeholder">
                  {/* Fallback info if target is in DOM */}
                  <div className="p-4 text-center text-slate-400 text-xs font-mono">
                    Rendering target ID: <span className="font-bold text-indigo-600">#{targetId}</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </main>

      {/* 4. FOOTER STATUS BAR */}
      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-2 text-[11px] text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2 shrink-0 no-print">
        <div className="flex items-center space-x-2 font-mono">
          <span className="text-emerald-400 font-bold">✓ Multi-Page Engine Active</span>
          <span>•</span>
          <span>UAE FTA Compliant VAT Invoicing Standard ({totalPages} {totalPages === 1 ? 'Page' : 'Pages'})</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Alignment: True 1:1</span>
          <span>Paper: {paperSize}</span>
          <span className="text-indigo-400 font-bold font-mono">evonix Hissab</span>
        </div>
      </footer>

    </div>,
    window.document.body
  );
};

export default PrintPreviewOverlay;
