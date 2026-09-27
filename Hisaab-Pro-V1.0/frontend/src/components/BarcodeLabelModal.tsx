import React, { useState, useMemo } from 'react';
import { triggerPrint } from '../utils/printHelper';
import { 
  X, 
  Printer, 
  QrCode, 
  Check, 
  Search, 
  Sliders, 
  Layers, 
  Tag, 
  Sparkles,
  Grid,
  CheckSquare,
  Square,
  Copy,
  ArrowLeft,
  Ruler,
  FileText
} from 'lucide-react';
import { InventoryItem, Company } from '../types';

interface BarcodeLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
  inventory: InventoryItem[];
  initialSelectedItem?: InventoryItem | null;
}

export interface ThermalPreset {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  category: 'Retail' | 'Compact' | 'Shipping' | 'Custom';
  description: string;
}

export const THERMAL_PRESETS: ThermalPreset[] = [
  { id: '58x40', name: '58mm × 40mm', widthMm: 58, heightMm: 40, category: 'Retail', description: 'Standard GCC Supermarket & Retail Barcode Sticker' },
  { id: '50x25', name: '50mm × 25mm', widthMm: 50, heightMm: 25, category: 'Compact', description: 'Compact Tag for Small Electronics, Cosmetics & Jewellery' },
  { id: '40x30', name: '40mm × 30mm', widthMm: 40, heightMm: 30, category: 'Compact', description: 'Mini Product Price & Shelf Edge Tag' },
  { id: '80x50', name: '80mm × 50mm', widthMm: 80, heightMm: 50, category: 'Retail', description: 'Medium POS & Shelf Display Label' },
  { id: '100x50', name: '100mm × 50mm', widthMm: 100, heightMm: 50, category: 'Shipping', description: 'Warehouse Carton & Box Barcode Tag' },
  { id: '100x150', name: '100mm × 150mm (4"×6")', widthMm: 100, heightMm: 150, category: 'Shipping', description: 'Standard Logistics Shipping & Waybill Label' },
  { id: 'custom', name: 'Custom Thermal Size', widthMm: 58, heightMm: 40, category: 'Custom', description: 'Specify exact custom label width and height in mm' }
];

// Code 128 B Patterns Lookup Table (0 to 106)
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"                              // 100-106
];

// Helper to generate vector SVG Barcode (Code 128 compliant)
export function Code128SVG({ text, height = 36 }: { text: string; height?: number }) {
  const codeStr = (text || 'PRD-1001').trim();
  const charCodes: number[] = [104]; // Start B

  for (let i = 0; i < codeStr.length; i++) {
    const code = codeStr.charCodeAt(i) - 32;
    if (code >= 0 && code <= 95) {
      charCodes.push(code);
    } else {
      charCodes.push(0); // Fallback space
    }
  }

  // Calculate Checksum
  let checksum = charCodes[0];
  for (let i = 1; i < charCodes.length; i++) {
    checksum += charCodes[i] * i;
  }
  charCodes.push(checksum % 103);
  charCodes.push(106); // Stop Code

  // Build bar pattern
  let barsPattern = '';
  for (const codeIdx of charCodes) {
    const pattern = CODE128_PATTERNS[codeIdx] || CODE128_PATTERNS[0];
    barsPattern += pattern;
  }

  // Calculate total width units
  let totalUnits = 0;
  for (let i = 0; i < barsPattern.length; i++) {
    totalUnits += parseInt(barsPattern[i], 10);
  }

  const unitWidth = 1.6;
  const svgWidth = totalUnits * unitWidth;

  let currentX = 0;
  const rects: React.ReactNode[] = [];

  for (let i = 0; i < barsPattern.length; i++) {
    const w = parseInt(barsPattern[i], 10) * unitWidth;
    const isBlack = i % 2 === 0;
    if (isBlack) {
      rects.push(
        <rect
          key={i}
          x={currentX}
          y={0}
          width={w}
          height={height}
          fill="#000000"
        />
      );
    }
    currentX += w;
  }

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${height}`}
      className="w-full max-w-full h-auto mx-auto block overflow-visible"
      style={{ maxHeight: `${height}px` }}
      preserveAspectRatio="none"
    >
      {rects}
    </svg>
  );
}

export default function BarcodeLabelModal({
  isOpen,
  onClose,
  company,
  inventory,
  initialSelectedItem
}: BarcodeLabelModalProps) {
  if (!isOpen) return null;

  // State for items & quantities
  const [search, setSearch] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(
    initialSelectedItem ? [initialSelectedItem.id] : inventory.length > 0 ? [inventory[0].id] : []
  );

  // Label Quantities (Global or Per Item)
  const [quantityPreset, setQuantityPreset] = useState<number>(1);
  const [customQuantity, setCustomQuantity] = useState<number>(1);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  // Printer & Paper Mode
  const [paperType, setPaperType] = useState<'thermal' | 'a4_sheet'>('thermal');
  const [selectedThermalId, setSelectedThermalId] = useState<string>('58x40');
  const [customWidthMm, setCustomWidthMm] = useState<number>(58);
  const [customHeightMm, setCustomHeightMm] = useState<number>(40);

  // Label Customization Options
  const [headerText, setHeaderText] = useState<string>(
    company.name ? company.name.substring(0, 16).toUpperCase() : 'HISAAB PRO'
  );
  const [showHeader, setShowHeader] = useState<boolean>(true);
  const [showSku, setShowSku] = useState<boolean>(true);
  const [showBarcode, setShowBarcode] = useState<boolean>(true);
  const [showProductName, setShowProductName] = useState<boolean>(true);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showVatTag, setShowVatTag] = useState<boolean>(true);
  const [footerNote, setFooterNote] = useState<string>('5% VAT INCLUDED');
  const [density, setDensity] = useState<'compact' | 'standard' | 'large'>('standard');
  const [gridCols, setGridCols] = useState<number>(3); // 3, 4, 5 for A4 sheet

  // Find active preset
  const activePreset = THERMAL_PRESETS.find(p => p.id === selectedThermalId) || THERMAL_PRESETS[0];

  // Effective dimensions in mm
  const effectiveWidthMm = paperType === 'thermal'
    ? (selectedThermalId === 'custom' ? customWidthMm : activePreset.widthMm)
    : 70;
  const effectiveHeightMm = paperType === 'thermal'
    ? (selectedThermalId === 'custom' ? customHeightMm : activePreset.heightMm)
    : 45;

  // Filtered inventory list for multi-picker
  const filteredInventory = useMemo(() => {
    if (!search.trim()) return inventory;
    const q = search.toLowerCase();
    return inventory.filter(
      i => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || (i.barcode && i.barcode.toLowerCase().includes(q))
    );
  }, [inventory, search]);

  // Toggle selection
  const toggleItemSelect = (id: string) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedItemIds(filteredInventory.map(i => i.id));
  };

  const clearSelection = () => {
    setSelectedItemIds([]);
  };

  // Set quantity for all selected or current preset
  const handleQuantityPresetChange = (qty: number) => {
    setQuantityPreset(qty);
    setCustomQuantity(qty);
  };

  // Compute total labels count
  const effectiveQtyForId = (id: string) => {
    if (itemQuantities[id] !== undefined) return itemQuantities[id];
    return customQuantity > 0 ? customQuantity : quantityPreset;
  };

  const totalLabelsToPrint = selectedItemIds.reduce(
    (sum, id) => sum + effectiveQtyForId(id),
    0
  );

  // Selected items list
  const selectedItems = inventory.filter(i => selectedItemIds.includes(i.id));

  // Generate full sticker list for rendering
  const stickersToRender: Array<{ item: InventoryItem; index: number }> = [];
  selectedItems.forEach(item => {
    const count = effectiveQtyForId(item.id);
    for (let i = 0; i < count; i++) {
      stickersToRender.push({ item, index: i });
    }
  });

  const handleTriggerPrint = () => {
    triggerPrint('printable-barcode-sheet', paperType === 'a4_sheet' ? 'A4' : 'Thermal');
  };

  // Font sizing & spacing based on density / sticker dimensions
  const getLabelStyleClasses = () => {
    if (density === 'compact' || effectiveHeightMm <= 30) {
      return {
        headerTextSize: 'text-[9px]',
        barcodeHeight: 20,
        titleTextSize: 'text-[9px] line-clamp-1',
        priceTextSize: 'text-[9px]',
        footerTextSize: 'text-[7px]'
      };
    }
    if (density === 'large' || effectiveHeightMm >= 100) {
      return {
        headerTextSize: 'text-sm font-black',
        barcodeHeight: 48,
        titleTextSize: 'text-xs sm:text-sm font-black line-clamp-3',
        priceTextSize: 'text-xs sm:text-sm font-black',
        footerTextSize: 'text-[10px]'
      };
    }
    return {
      headerTextSize: 'text-[10px]',
      barcodeHeight: 28,
      titleTextSize: 'text-[10px] font-black line-clamp-2',
      priceTextSize: 'text-[10px]',
      footerTextSize: 'text-[8px]'
    };
  };

  const labelStyles = getLabelStyleClasses();

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 dark:bg-slate-950 overflow-y-auto p-3 sm:p-5 md:p-8 font-sans animate-fade-in no-print">
      {/* Dynamic CSS Print Styles for Precise Thermal Roll vs A4 Page Control */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-barcode-sheet, #printable-barcode-sheet * {
            visibility: visible !important;
          }
          .no-print {
            display: none !important;
          }

          ${paperType === 'thermal' ? `
            @page {
              size: ${effectiveWidthMm}mm ${effectiveHeightMm}mm;
              margin: 0mm;
            }
            #printable-barcode-sheet {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: ${effectiveWidthMm}mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }
            .thermal-label-page {
              width: ${effectiveWidthMm}mm !important;
              height: ${effectiveHeightMm}mm !important;
              max-width: ${effectiveWidthMm}mm !important;
              max-height: ${effectiveHeightMm}mm !important;
              page-break-after: always !important;
              break-after: page !important;
              box-sizing: border-box !important;
              overflow: hidden !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              align-items: center !important;
              text-align: center !important;
              padding: 2mm 3mm !important;
            }
          ` : `
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
            #printable-barcode-sheet {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 10px !important;
              background: white !important;
            }
          `}
        }
      `}</style>

      {/* Main Workspace Container */}
      <div className="w-full max-w-[1440px] mx-auto space-y-6 pb-16 no-print">
        {/* Top Header Workspace Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center space-x-3.5">
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors cursor-pointer flex items-center space-x-2 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Catalog</span>
            </button>
            <div className="h-7 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <Printer className="w-5 h-5" />
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Thermal Roll & Barcode Sticker Suite
                </h2>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border border-indigo-200 dark:border-indigo-800">
                  UAE / GCC Compliant
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Generate high-resolution barcode stickers for Zebra, TSC, Xprinter, Sunmi thermal roll printers or A4 sticker sheets
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 uppercase hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel / Close
            </button>
            <button
              type="button"
              onClick={handleTriggerPrint}
              disabled={stickersToRender.length === 0}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print {stickersToRender.length} Labels Now</span>
            </button>
          </div>
        </div>

        {/* Workspace Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Controls & Configuration Panel (5 Cols) */}
          <div className="lg:col-span-5 space-y-6 text-xs">
            {/* Step 1: Media & Paper Mode (Thermal Roll vs A4 Sticker Sheet) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <span className="flex items-center space-x-2">
                  <Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>1. Printer Paper & Roll Type</span>
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono font-extrabold bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  {paperType === 'thermal' ? `Thermal Roll (${effectiveWidthMm}×${effectiveHeightMm}mm)` : `A4 Sheet (${gridCols} Cols)`}
                </span>
              </label>

              {/* Mode Toggle Tabs */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaperType('thermal')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer transition-all ${
                    paperType === 'thermal'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Thermal Roll Printer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaperType('a4_sheet')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer transition-all ${
                    paperType === 'a4_sheet'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>A4 Sticker Sheet</span>
                </button>
              </div>

              {/* Thermal Preset Sizes Selector */}
              {paperType === 'thermal' ? (
                <div className="space-y-3 pt-1">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Ruler className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Standard Thermal Label Roll Sizes</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {THERMAL_PRESETS.map(preset => {
                      const isSelected = selectedThermalId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setSelectedThermalId(preset.id)}
                          className={`p-2.5 rounded-xl text-left border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-600 text-indigo-950 dark:text-indigo-200 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold font-mono text-xs">{preset.name}</span>
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {preset.category}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                            {preset.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Thermal Size MM Inputs */}
                  {selectedThermalId === 'custom' && (
                    <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-2 animate-fade-in">
                      <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 block uppercase">
                        Specify Custom Label Dimensions (mm)
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                            Label Width (mm)
                          </label>
                          <input
                            type="number"
                            min="20"
                            max="220"
                            value={customWidthMm}
                            onChange={(e) => setCustomWidthMm(Math.max(20, parseInt(e.target.value) || 20))}
                            className="w-full text-xs font-mono font-bold px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                            Label Height (mm)
                          </label>
                          <input
                            type="number"
                            min="15"
                            max="300"
                            value={customHeightMm}
                            onChange={(e) => setCustomHeightMm(Math.max(15, parseInt(e.target.value) || 15))}
                            className="w-full text-xs font-mono font-bold px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* A4 Grid Columns Options */
                <div className="space-y-2 pt-1">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    A4 Sheet Grid Layout
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { cols: 3, label: '3 Cols (30 Labels/Sheet)' },
                      { cols: 4, label: '4 Cols (40 Labels/Sheet)' },
                      { cols: 5, label: '5 Cols (50 Labels/Sheet)' }
                    ].map(g => (
                      <button
                        key={g.cols}
                        type="button"
                        onClick={() => setGridCols(g.cols)}
                        className={`py-2 px-2 text-xs font-bold rounded-xl border cursor-pointer text-center transition-all ${
                          gridCols === g.cols
                            ? 'bg-slate-900 text-white border-slate-900 dark:bg-indigo-600 dark:border-indigo-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Batch Quantity Presets */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <span className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>2. Label Batch Quantity</span>
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono font-extrabold bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  {totalLabelsToPrint} Labels Total
                </span>
              </label>

              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 5, 10, 20, 40, 50, 100, 120].map(qty => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => handleQuantityPresetChange(qty)}
                    className={`py-2 px-3 rounded-xl font-mono font-bold text-xs text-center border cursor-pointer transition-all ${
                      customQuantity === qty
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                    }`}
                  >
                    {qty}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 font-bold">Or Custom Print Units:</span>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuantityPresetChange(Math.max(1, customQuantity - 1))}
                    className="w-8 h-8 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-black rounded-lg flex items-center justify-center cursor-pointer text-slate-700 dark:text-slate-200 text-sm"
                    title="Decrease 1 label"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={customQuantity}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value) || 1);
                      setCustomQuantity(val);
                      setQuantityPreset(val);
                    }}
                    className="w-24 text-center text-xs font-bold font-mono px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:border-indigo-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuantityPresetChange(customQuantity + 1)}
                    className="w-8 h-8 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-black rounded-lg flex items-center justify-center cursor-pointer text-slate-700 dark:text-slate-200 text-sm"
                    title="Increase 1 label"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Step 3: Select Product(s) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>3. Select Product(s) ({selectedItemIds.length} Selected)</span>
                </label>
                <div className="flex items-center space-x-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-slate-400 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Search filter */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter product list by title, SKU, or barcode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                />
              </div>

              {/* Item picker list */}
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                {filteredInventory.map(item => {
                  const isSelected = selectedItemIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleItemSelect(item.id)}
                      className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 border border-indigo-200/60 dark:border-indigo-800/60'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0 pr-2">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <span className="font-bold block truncate text-xs">{item.name}</span>
                          <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                            SKU: {item.sku} {item.barcode ? `• Barcode: ${item.barcode}` : ''} • AED {item.salePrice.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">Qty:</span>
                          <input
                            type="number"
                            min="1"
                            value={itemQuantities[item.id] !== undefined ? itemQuantities[item.id] : customQuantity}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              setItemQuantities(prev => ({ ...prev, [item.id]: val }));
                            }}
                            title="Override quantity for this product"
                            className="w-14 text-center text-xs font-mono font-bold py-1 border border-indigo-200 dark:border-indigo-800 rounded-lg bg-white dark:bg-slate-900"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Label Customization & Content Formatting Options */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>4. Label Customization & Content Formatting</span>
              </label>

              {/* Text Density / Size Scaling Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Text Scale / Density
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'compact', label: 'Compact (Small Tags)' },
                    { id: 'standard', label: 'Standard (Default)' },
                    { id: 'large', label: 'Large (Shipping)' }
                  ].map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDensity(d.id as any)}
                      className={`py-1.5 px-2 text-[11px] font-bold rounded-lg border text-center transition-all ${
                        density === d.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Company / Brand Header</label>
                  <input
                    type="text"
                    value={headerText}
                    onChange={(e) => setHeaderText(e.target.value)}
                    maxLength={20}
                    className="w-full text-xs font-bold font-mono px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Footer / Compliance Note</label>
                  <input
                    type="text"
                    value={footerNote}
                    onChange={(e) => setFooterNote(e.target.value)}
                    maxLength={30}
                    placeholder="e.g. 5% VAT INCLUDED"
                    className="w-full text-xs font-bold font-mono px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl uppercase"
                  />
                </div>
              </div>

              {/* Toggle Content Fields */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={showHeader}
                    onChange={(e) => setShowHeader(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Show Brand Header</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={showSku}
                    onChange={(e) => setShowSku(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Show SKU Code</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={showBarcode}
                    onChange={(e) => setShowBarcode(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Show Vector Barcode</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={showProductName}
                    onChange={(e) => setShowProductName(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Show Product Title</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => setShowPrice(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Show Sale Price (AED)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={showVatTag}
                    onChange={(e) => setShowVatTag(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Show VAT / Footer Tag</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Live Sticker Sheet Preview Panel (7 Cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
                <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Sticker Sheet Live Preview ({stickersToRender.length} Labels)</span>
              </span>

              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-lg">
                Format: {paperType === 'thermal' ? `Thermal Roll (${effectiveWidthMm}×${effectiveHeightMm}mm)` : `A4 Sheet (${gridCols} Grid Cols)`}
              </span>
            </div>

            {/* Preview Container */}
            {stickersToRender.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 bg-slate-50/50 dark:bg-slate-950/50">
                <Printer className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">No Labels Selected for Print</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Select products from the left panel and pick your desired thermal size or A4 sheet count to render barcode stickers.
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 min-h-[480px] max-h-[720px] overflow-y-auto">
                <div
                  className={`grid gap-3 ${
                    paperType === 'thermal'
                      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                      : gridCols === 3
                      ? 'grid-cols-2 sm:grid-cols-3'
                      : gridCols === 4
                      ? 'grid-cols-2 sm:grid-cols-4'
                      : 'grid-cols-2 sm:grid-cols-5'
                  }`}
                >
                  {stickersToRender.slice(0, 100).map(({ item, index }) => {
                    const barcodeVal = item.barcode || item.sku || 'PRD-1001';
                    return (
                      <div
                        key={`${item.id}-${index}`}
                        className="border border-slate-300 bg-white rounded-xl p-3 flex flex-col justify-between items-center text-center shadow-xs hover:border-indigo-500 transition-colors relative overflow-hidden"
                        style={{
                          minHeight: paperType === 'thermal' ? `${Math.max(110, effectiveHeightMm * 2.2)}px` : '115px'
                        }}
                      >
                        {/* Top Header Row (Brand & SKU) */}
                        {(showHeader || showSku) && (
                          <div className={`w-full flex items-center justify-between font-mono font-black text-slate-900 mb-1 leading-none border-b border-slate-100 pb-1 ${labelStyles.headerTextSize}`}>
                            {showHeader ? <span>{headerText}</span> : <span />}
                            {showSku ? <span>{item.sku}</span> : <span />}
                          </div>
                        )}

                        {/* Barcode SVG Vector */}
                        {showBarcode && (
                          <div className="w-full my-1 px-1">
                            <Code128SVG text={barcodeVal} height={labelStyles.barcodeHeight} />
                            <span className="text-[8px] font-mono font-bold text-slate-700 tracking-widest block -mt-0.5">
                              {barcodeVal}
                            </span>
                          </div>
                        )}

                        {/* Product Name */}
                        {showProductName && (
                          <h5 className={`font-black text-slate-900 leading-tight uppercase font-sans my-0.5 px-0.5 ${labelStyles.titleTextSize}`}>
                            {item.name}
                          </h5>
                        )}

                        {/* Selling Price & Footer Note */}
                        <div className="w-full mt-1 flex flex-col items-center gap-0.5">
                          {showPrice && (
                            <div className={`font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 ${labelStyles.priceTextSize}`}>
                              AED {item.salePrice.toFixed(2)}
                            </div>
                          )}
                          {showVatTag && footerNote && (
                            <span className={`font-mono font-bold text-slate-500 uppercase tracking-tight ${labelStyles.footerTextSize}`}>
                              {footerNote}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {stickersToRender.length > 100 && (
                  <div className="text-center mt-4 text-xs font-mono text-slate-500">
                    + {stickersToRender.length - 100} more labels will be generated on additional thermal pages during browser print.
                  </div>
                )}
              </div>
            )}

            {/* Bottom Footer Action Row */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <span>
                {paperType === 'thermal'
                  ? `Configured for ${effectiveWidthMm}mm × ${effectiveHeightMm}mm continuous thermal roll labels.`
                  : 'Configured for A4 grid sticker paper.'}
              </span>
              <button
                type="button"
                onClick={handleTriggerPrint}
                disabled={stickersToRender.length === 0}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-md flex items-center justify-center space-x-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print All {stickersToRender.length} Labels Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Standalone Print Container for pure @media print execution */}
      <div id="printable-barcode-sheet" className="hidden print:block">
        {paperType === 'thermal' ? (
          /* Thermal Roll Printer Layout: Each sticker is its own thermal page with break-after */
          <div>
            {stickersToRender.map(({ item, index }) => {
              const barcodeVal = item.barcode || item.sku || 'PRD-1001';
              return (
                <div
                  key={`thermal-print-${item.id}-${index}`}
                  className="thermal-label-page border border-black bg-white"
                >
                  {/* Header Row */}
                  {(showHeader || showSku) && (
                    <div className="w-full flex items-center justify-between text-[10px] font-mono font-black text-black border-b border-black pb-0.5 mb-0.5">
                      {showHeader ? <span>{headerText}</span> : <span />}
                      {showSku ? <span>{item.sku}</span> : <span />}
                    </div>
                  )}

                  {/* Barcode SVG */}
                  {showBarcode && (
                    <div className="w-full my-0.5">
                      <Code128SVG text={barcodeVal} height={labelStyles.barcodeHeight + 4} />
                      <span className="text-[8px] font-mono font-bold text-black tracking-widest block">
                        {barcodeVal}
                      </span>
                    </div>
                  )}

                  {/* Product Title */}
                  {showProductName && (
                    <div className="font-black text-[10px] text-black leading-tight uppercase my-0.5 line-clamp-2">
                      {item.name}
                    </div>
                  )}

                  {/* Selling Price & Footer Note */}
                  <div className="w-full mt-auto flex flex-col items-center">
                    {showPrice && (
                      <div className="font-mono font-black text-[10px] text-black border border-black px-2 py-0.5 rounded-full">
                        AED {item.salePrice.toFixed(2)}
                      </div>
                    )}
                    {showVatTag && footerNote && (
                      <span className="text-[7px] font-mono font-bold text-black uppercase mt-0.5">
                        {footerNote}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* A4 Sticker Sheet Grid Layout */
          <div
            className={`grid gap-2 ${
              gridCols === 3
                ? 'grid-cols-3'
                : gridCols === 4
                ? 'grid-cols-4'
                : 'grid-cols-5'
            }`}
          >
            {stickersToRender.map(({ item, index }) => {
              const barcodeVal = item.barcode || item.sku || 'PRD-1001';
              return (
                <div
                  key={`a4-print-${item.id}-${index}`}
                  className="border border-black bg-white p-2 rounded flex flex-col justify-between items-center text-center page-break-inside-avoid"
                  style={{ minHeight: '115px', pageBreakInside: 'avoid' }}
                >
                  {/* Header Row */}
                  {(showHeader || showSku) && (
                    <div className="w-full flex items-center justify-between text-[11px] font-mono font-black text-black border-b border-black pb-0.5 mb-1">
                      {showHeader ? <span>{headerText}</span> : <span />}
                      {showSku ? <span>{item.sku}</span> : <span />}
                    </div>
                  )}

                  {/* Barcode SVG */}
                  {showBarcode && (
                    <div className="w-full my-1">
                      <Code128SVG text={barcodeVal} height={32} />
                      <span className="text-[9px] font-mono font-bold text-black tracking-widest block">
                        {barcodeVal}
                      </span>
                    </div>
                  )}

                  {/* Product Title */}
                  {showProductName && (
                    <div className="font-black text-[11px] text-black leading-tight uppercase my-0.5">
                      {item.name}
                    </div>
                  )}

                  {/* Selling Price */}
                  {showPrice && (
                    <div className="font-mono font-black text-[10px] text-black border border-black px-2 py-0.5 rounded-full mt-0.5">
                      AED {item.salePrice.toFixed(2)}
                    </div>
                  )}

                  {showVatTag && footerNote && (
                    <span className="text-[7px] font-mono font-bold text-black uppercase mt-0.5">
                      {footerNote}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
