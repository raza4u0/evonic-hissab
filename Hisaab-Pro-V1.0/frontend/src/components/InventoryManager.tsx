import React, { useState, useEffect, useRef } from 'react';
import { triggerPrint } from '../utils/printHelper';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  TrendingUp, 
  Coins, 
  Edit2, 
  Trash2, 
  X,
  FileCheck2,
  RefreshCw,
  Camera,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  QrCode,
  Volume2,
  VolumeX,
  FileText,
  AlertCircle,
  ImagePlus,
  Eye,
  Layers,
  Briefcase,
  Tag,
  Filter,
  FolderPlus,
  Printer,
  Download,
  ListFilter,
  Wrench,
  Award,
  ArrowLeft,
  Save,
  DollarSign,
  Boxes,
  BarChart2,
  PieChart,
  Sparkles,
  Copy,
  Sliders,
  Calculator,
  CheckCircle2,
  ArrowRight,
  Monitor
} from 'lucide-react';
import { InventoryItem, Company } from '../types';
import { safeSetLocalStorage } from '../utils/safeStorage';
import { INITIAL_SERVICES } from '../data/mockData';
import { BarcodeScannerModal, playBeepSound } from './BarcodeScannerModal';
import BarcodeLabelModal from './BarcodeLabelModal';
import SparePartsManager from './SparePartsManager';
import ComputerManager from './ComputerManager';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  activeCompanyId: string;
  company: Company;
  onAddItem: (item: Omit<InventoryItem, 'id' | 'companyId'>) => void;
  onUpdateItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onAdjustStock: (id: string, newQty: number) => void;
  activeSidebarItemId?: string;
  setActiveSidebarItemId?: (id: string) => void;
}

interface StockLog {
  id: string;
  itemId: string;
  itemName: string;
  sku: string;
  type: 'IN' | 'OUT' | 'OVERRIDE';
  qty: number;
  prevQty: number;
  newQty: number;
  date: string;
  refNo: string;
  reason: string;
}

type SubTab = 'STOCK' | 'COMPUTERS' | 'SPARE_PARTS' | 'CATEGORY' | 'SERVICES' | 'LIST' | 'SCANNER' | 'LOGS' | 'TRANSFER' | 'BARCODES' | 'ANALYTICS';

export default function InventoryManager({
  inventory,
  activeCompanyId,
  company,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onAdjustStock,
  activeSidebarItemId,
  setActiveSidebarItemId
}: InventoryManagerProps) {
  // Guard clause if inventory is disabled
  if (!company || !company.inventoryEnabled) {
    return (
      <div className="max-w-md mx-auto text-center py-12 px-6 border border-[#E2E8F0] bg-white animate-fade-in">
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 w-16 h-16 mx-auto flex items-center justify-center text-[#4F46E5]">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-[#0F172A] font-mono mt-4">Inventory Tracking Disabled</h2>
        <p className="text-xs text-slate-500 leading-relaxed mt-2">
          The stock quantity catalog is currently hidden. If your business trades physical assets and requires stock alerts, please toggle <strong>Inventory Control</strong> to ON under Company Settings.
        </p>
      </div>
    );
  }

  const compInd = company?.industry || '';
  const isComputerIndustry = ['ComputerSalesAndService', 'Computer & IT'].includes(compInd) || compInd.toLowerCase().includes('computer') || compInd.toLowerCase().includes('printer');
  const isSparePartsIndustry = ['AutoSpareParts', 'CarSpareParts', 'BikeSpareParts', 'Auto Repair'].includes(compInd) || compInd.toLowerCase().includes('spare') || compInd.toLowerCase().includes('auto') || compInd.toLowerCase().includes('bike');

  const companyItems = inventory.filter(i => {
    if (i.companyId && i.companyId !== activeCompanyId) return false;
    const isCompItem = Boolean(i.itCategory || i.printerModelCompatibility || i.deviceSpecs || i.category === 'Computer & IT' || i.category === 'Printers' || i.category === 'IT Hardware');
    const isSpareItem = Boolean(i.vehicleType || i.partCategory || i.partNumber || i.oemNumber || i.category === 'Auto Parts' || i.category === 'Bike Parts');

    if (isComputerIndustry) {
      if (isSpareItem) return false;
    } else if (isSparePartsIndustry) {
      if (isCompItem) return false;
    } else {
      if (isCompItem || isSpareItem) return false;
    }
    return true;
  });

  const [activeSubTab, setActiveSubTab] = useState<SubTab>(
    isComputerIndustry ? 'COMPUTERS' : isSparePartsIndustry ? 'SPARE_PARTS' : 'STOCK'
  );

  useEffect(() => {
    if (activeSubTab === 'COMPUTERS' && !isComputerIndustry) {
      setActiveSubTab('STOCK');
    } else if (activeSubTab === 'SPARE_PARTS' && !isSparePartsIndustry) {
      setActiveSubTab('STOCK');
    }
  }, [isComputerIndustry, isSparePartsIndustry, activeSubTab]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockAdjustmentOpen, setIsStockAdjustmentOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  // Barcode Label Print Modal state
  const [isBarcodeLabelModalOpen, setIsBarcodeLabelModalOpen] = useState(false);
  const [barcodeModalSelectedItem, setBarcodeModalSelectedItem] = useState<InventoryItem | null>(null);

  const openLabelPrintModal = (item?: InventoryItem) => {
    setBarcodeModalSelectedItem(item || null);
    setIsBarcodeLabelModalOpen(true);
  };

  // New Category Creation Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatSub, setNewCatSub] = useState('');

  // Custom Categories & Dynamic Creation States
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [isAddingFilterCat, setIsAddingFilterCat] = useState(false);
  const [filterCatInput, setFilterCatInput] = useState('');

  // Custom Brands & Dynamic Creation States
  const [customBrands, setCustomBrands] = useState<string[]>([]);
  const [isAddingNewBrand, setIsAddingNewBrand] = useState(false);
  const [newBrandInput, setNewBrandInput] = useState('');
  const [isAddingFilterBrand, setIsAddingFilterBrand] = useState(false);
  const [filterBrandInput, setFilterBrandInput] = useState('');

  // Multi-Branch & Multi-Warehouse Transfer States
  const [sourceWarehouse, setSourceWarehouse] = useState('W01 - Dubai Central Logistics Hub');
  const [targetWarehouse, setTargetWarehouse] = useState('W02 - Abu Dhabi Branch Depot');
  const [transferRefNo, setTransferRefNo] = useState(`TRF-${Math.floor(100000 + Math.random() * 900000)}`);
  const [transferNote, setTransferNote] = useState('Inter-branch stock rebalancing & retail order fulfillment');
  const [transferSearch, setTransferSearch] = useState('');
  const [checkedTransferItemIds, setCheckedTransferItemIds] = useState<string[]>([]);
  const [transferQuantities, setTransferQuantities] = useState<Record<string, number>>({});
  const [activeTransferVoucher, setActiveTransferVoucher] = useState<any | null>(null);

  // Form states for Product CRUD
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [skuAutoMode, setSkuAutoMode] = useState<boolean>(true);
  const [brand, setBrand] = useState('');
  const [vatType, setVatType] = useState<'standard' | 'zero_rated' | 'exempt'>('standard');
  const [supplierName, setSupplierName] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [image, setImage] = useState('');
  const [barcode, setBarcode] = useState('');
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [salePrice, setSalePrice] = useState(0);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [minStockThreshold, setMinStockThreshold] = useState(1);
  const [internalNotes, setInternalNotes] = useState('');
  const [sellingUnit, setSellingUnit] = useState('piece');
  const [costUnit, setCostUnit] = useState('per piece');
  const [otherCosts, setOtherCosts] = useState(0);
  const [barcodeType, setBarcodeType] = useState<'EAN-13' | 'QR' | 'Code128'>('EAN-13');

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Product image file is too large (max 5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Form states for Quick Adjustment Modal
  const [adjustMode, setAdjustMode] = useState<'IN' | 'OUT' | 'OVERRIDE'>('IN');
  const [adjustmentQty, setAdjustmentQty] = useState(0);
  const [adjustmentRef, setAdjustmentRef] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('Manual Stock Count');

  // Stock Transaction Logs
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [logSearch, setLogSearch] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState<'ALL' | 'IN' | 'OUT' | 'OVERRIDE'>('ALL');

  // Scanner States
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannerMatchedItem, setScannerMatchedItem] = useState<InventoryItem | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isFormScannerOpen, setIsFormScannerOpen] = useState(false);
  const [unregisteredBarcode, setUnregisteredBarcode] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scannerAction, setScannerAction] = useState<'IN' | 'OUT'>('IN');
  const [scannerQty, setScannerQty] = useState(1);
  const [scannerRef, setScannerRef] = useState('');
  const [scannerReason, setScannerReason] = useState('Barcode Scan Activity');
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Video and stream reference for live camera scanner
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Bulk Price & Margin Adjuster States
  const [bulkTargetCategory, setBulkTargetCategory] = useState<string>('ALL');
  const [bulkPriceType, setBulkPriceType] = useState<'salePrice' | 'purchasePrice'>('salePrice');
  const [bulkAdjustType, setBulkAdjustType] = useState<'PERCENT_UP' | 'PERCENT_DOWN' | 'FIXED_UP' | 'FIXED_DOWN'>('PERCENT_UP');
  const [bulkAdjustValue, setBulkAdjustValue] = useState<number>(5);
  const [bulkAdjustSuccess, setBulkAdjustSuccess] = useState<string | null>(null);
  const [copiedRequisition, setCopiedRequisition] = useState(false);
  const [analyticsViewMode, setAnalyticsViewMode] = useState<'ALL' | 'VALUATION' | 'RESTOCK' | 'BULK_PRICE'>('ALL');

  // Synchronize sidebar active item
  useEffect(() => {
    if (!activeSidebarItemId) return;
    if (activeSidebarItemId === 'inv_add') {
      openAddModal();
    } else if (activeSidebarItemId === 'inv_computer_it') {
      setActiveSubTab('COMPUTERS');
    } else if (activeSidebarItemId === 'inv_spare_parts') {
      setActiveSubTab('SPARE_PARTS');
    } else if (activeSidebarItemId === 'inv_stock') {
      setActiveSubTab('STOCK');
    } else if (activeSidebarItemId === 'inv_barcodes') {
      openLabelPrintModal();
    } else if (activeSidebarItemId === 'inv_branches') {
      setActiveSubTab('TRANSFER');
    } else if (activeSidebarItemId === 'inv_category') {
      setActiveSubTab('CATEGORY');
    } else if (activeSidebarItemId === 'inv_services') {
      setActiveSubTab('SERVICES');
    } else if (activeSidebarItemId === 'inv_list') {
      setActiveSubTab('LIST');
    }
  }, [activeSidebarItemId]);

  const handleTabChange = (tab: SubTab, sidebarId?: string) => {
    setActiveSubTab(tab);
    if (sidebarId && setActiveSidebarItemId) {
      setActiveSidebarItemId(sidebarId);
    }
  };

  // Initialize custom categories from storage
  useEffect(() => {
    const saved = localStorage.getItem(`custom_categories_${activeCompanyId}`);
    if (saved) {
      try {
        setCustomCategories(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse custom categories', e);
      }
    } else {
      setCustomCategories([]);
    }

    const savedBrands = localStorage.getItem(`custom_brands_${activeCompanyId}`);
    if (savedBrands) {
      try {
        setCustomBrands(JSON.parse(savedBrands));
      } catch (e) {
        console.error('Failed to parse custom brands', e);
      }
    } else {
      setCustomBrands([]);
    }
  }, [activeCompanyId]);

  const handleAddCustomCategory = (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed) return;
    if (!customCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      safeSetLocalStorage(`custom_categories_${activeCompanyId}`, updated);
    }
  };

  const handleDeleteCustomCategory = (catToDelete: string) => {
    if (!catToDelete) return;

    const itemsInCat = companyItems.filter(i => (i.category || '') === catToDelete);
    const confirmMsg = itemsInCat.length > 0
      ? `Are you sure you want to delete category "${catToDelete}"? ${itemsInCat.length} item(s) in this category will have their category assignment cleared.`
      : `Are you sure you want to delete category "${catToDelete}"?`;

    if (!confirm(confirmMsg)) return;

    const updated = customCategories.filter(c => c.toLowerCase() !== catToDelete.toLowerCase());
    setCustomCategories(updated);
    safeSetLocalStorage(`custom_categories_${activeCompanyId}`, updated);

    // Clear category on reassigned items in inventory
    itemsInCat.forEach(item => {
      onUpdateItem({
        ...item,
        category: ''
      });
    });

    if (categoryFilter === catToDelete) {
      setCategoryFilter('ALL');
    }
    if (category === catToDelete) {
      setCategory('');
    }
  };

  const handleAddCustomBrand = (brandName: string) => {
    const trimmed = brandName.trim();
    if (!trimmed) return;
    if (!customBrands.some(b => b.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...customBrands, trimmed];
      setCustomBrands(updated);
      safeSetLocalStorage(`custom_brands_${activeCompanyId}`, updated);
    }
  };

  const handleDeleteCustomBrand = (brandToDelete: string) => {
    if (!brandToDelete) return;

    const itemsInBrand = companyItems.filter(i => (i.brand || '') === brandToDelete);
    const confirmMsg = itemsInBrand.length > 0
      ? `Are you sure you want to delete brand "${brandToDelete}"? ${itemsInBrand.length} item(s) will have their brand assignment cleared.`
      : `Are you sure you want to delete brand "${brandToDelete}"?`;

    if (!confirm(confirmMsg)) return;

    const updated = customBrands.filter(b => b.toLowerCase() !== brandToDelete.toLowerCase());
    setCustomBrands(updated);
    safeSetLocalStorage(`custom_brands_${activeCompanyId}`, updated);

    itemsInBrand.forEach(item => {
      onUpdateItem({
        ...item,
        brand: ''
      });
    });

    if (brandFilter === brandToDelete) {
      setBrandFilter('ALL');
    }
    if (brand === brandToDelete) {
      setBrand('');
    }
  };

  // Initialize logs on load
  useEffect(() => {
    const savedLogs = localStorage.getItem(`stock_movements_logs_${activeCompanyId}`);
    if (savedLogs) {
      try {
        setStockLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error('Failed to parse stock logs', e);
      }
    } else {
      setStockLogs([]);
    }
  }, [activeCompanyId]);

  // Handle camera toggle
  useEffect(() => {
    if (isCameraActive && activeSubTab === 'SCANNER') {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error('Failed to acquire camera stream', err);
          setScanMessage({ text: 'Unable to open camera stream. Using laser simulation instead.', type: 'info' });
          setIsCameraActive(false);
        });
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isCameraActive, activeSubTab]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Sound generator using Web Audio API
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.warn('Audio synthesis beep not supported', e);
    }
  };

  // Record logs in localStorage
  const logStockMovement = (
    item: InventoryItem,
    type: 'IN' | 'OUT' | 'OVERRIDE',
    qty: number,
    prevQty: number,
    newQty: number,
    refNo: string,
    reason: string
  ) => {
    const newLog: StockLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      itemId: item.id,
      itemName: item.name,
      sku: item.sku,
      type,
      qty,
      prevQty,
      newQty,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      refNo: refNo.trim() || 'N/A',
      reason: reason.trim() || (type === 'IN' ? 'Goods Received' : type === 'OUT' ? 'Goods Issued' : 'Manual Stock Audit Overwrite')
    };

    const updatedLogs = [newLog, ...stockLogs].slice(0, 100);
    setStockLogs(updatedLogs);
    safeSetLocalStorage(`stock_movements_logs_${activeCompanyId}`, updatedLogs);
  };

  // Helper check for service items
  const isServiceItem = (item: InventoryItem) => {
    const u = (item.sellingUnit || '').toLowerCase();
    const c = (item.category || '').toLowerCase();
    const sub = (item.subcategory || '').toLowerCase();
    return u === 'service' || u === 'hour' || u === 'job' || u === 'visit' || u === 'consultation' || u === 'project' ||
      c.includes('service') || c.includes('labor') || c.includes('repair') || c.includes('consult') || c.includes('maintenance') ||
      sub.includes('service') || sub.includes('labor');
  };

  // Filter items
  const filteredItems = companyItems
    .filter(i => {
      const query = search.trim().toLowerCase();
      if (!query) return true;
      const nameMatch = i.name?.toLowerCase().includes(query);
      const skuMatch = i.sku?.toLowerCase().includes(query);
      const barcodeMatch = i.barcode?.toLowerCase().includes(query);
      const brandMatch = i.brand?.toLowerCase().includes(query);
      const catMatch = i.category?.toLowerCase().includes(query) || i.subcategory?.toLowerCase().includes(query);
      const idMatch = i.id?.toLowerCase().includes(query);
      const priceMatch = i.salePrice?.toString().includes(query) || i.purchasePrice?.toString().includes(query);
      return nameMatch || skuMatch || barcodeMatch || brandMatch || catMatch || idMatch || priceMatch;
    })
    .filter(i => {
      if (categoryFilter === 'ALL') return true;
      return (i.category || 'Uncategorized') === categoryFilter;
    })
    .filter(i => {
      if (brandFilter === 'ALL') return true;
      return (i.brand || 'Uncategorized') === brandFilter;
    })
    .filter(i => {
      const isNegative = i.stockQuantity < 0;
      const isLowStock = i.stockQuantity <= i.minStockThreshold && i.stockQuantity > 0;
      const isOutOfStock = i.stockQuantity === 0;
      const isHealthy = i.stockQuantity > i.minStockThreshold;

      if (stockStatusFilter === 'ALL') return true;
      if (stockStatusFilter === 'NEGATIVE') return isNegative;
      if (stockStatusFilter === 'LOW_STOCK') return isLowStock;
      if (stockStatusFilter === 'OUT_OF_STOCK') return isOutOfStock || isNegative;
      if (stockStatusFilter === 'HEALTHY') return isHealthy;
      return true;
    });

  // Service items list
  const serviceItems = companyItems.filter(isServiceItem);

  const handleGenerateTenServices = () => {
    const existingSkus = new Set(companyItems.map(i => i.sku));
    let addedCount = 0;
    INITIAL_SERVICES.forEach(srv => {
      if (!existingSkus.has(srv.sku)) {
        onAddItem({
          name: srv.name,
          sku: srv.sku,
          brand: srv.brand,
          category: srv.category,
          subcategory: srv.subcategory,
          vatType: srv.vatType,
          vatRate: srv.vatRate,
          purchasePrice: srv.purchasePrice,
          salePrice: srv.salePrice,
          stockQuantity: 999,
          minStockThreshold: 1,
          barcode: srv.barcode,
          sellingUnit: srv.sellingUnit,
          supplierName: srv.supplierName,
          internalNotes: srv.internalNotes
        });
        addedCount++;
      }
    });
    alert(addedCount > 0 
      ? `✅ Successfully generated ${addedCount} standard service lists in catalog!` 
      : `ℹ️ All 10 standard service lists are already present in your catalog.`
    );
  };

  // Filtered Logs
  const filteredLogs = stockLogs
    .filter(log => {
      const query = logSearch.toLowerCase();
      return log.itemName.toLowerCase().includes(query) || log.sku.toLowerCase().includes(query) || log.refNo.toLowerCase().includes(query) || log.reason.toLowerCase().includes(query);
    })
    .filter(log => {
      if (logTypeFilter === 'ALL') return true;
      return log.type === logTypeFilter;
    });

  // Transfer checkbox selection helpers
  const transferAvailableItems = companyItems.filter(item => {
    const q = transferSearch.toLowerCase();
    return (item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q) || (item.category || '').toLowerCase().includes(q)) && item.stockQuantity > 0;
  });

  const isAllTransferChecked = transferAvailableItems.length > 0 && transferAvailableItems.every(i => checkedTransferItemIds.includes(i.id));

  const handleToggleCheckAllTransfer = () => {
    if (isAllTransferChecked) {
      setCheckedTransferItemIds([]);
    } else {
      const allIds = transferAvailableItems.map(i => i.id);
      setCheckedTransferItemIds(allIds);
      // Initialize quantities if not set
      const updatedQty = { ...transferQuantities };
      allIds.forEach(id => {
        if (!updatedQty[id]) {
          const item = companyItems.find(x => x.id === id);
          updatedQty[id] = Math.min(1, item?.stockQuantity || 1);
        }
      });
      setTransferQuantities(updatedQty);
    }
  };

  const handleToggleCheckTransferItem = (id: string) => {
    if (checkedTransferItemIds.includes(id)) {
      setCheckedTransferItemIds(prev => prev.filter(x => x !== id));
    } else {
      setCheckedTransferItemIds(prev => [...prev, id]);
      if (!transferQuantities[id]) {
        const item = companyItems.find(x => x.id === id);
        setTransferQuantities(prev => ({ ...prev, [id]: Math.min(1, item?.stockQuantity || 1) }));
      }
    }
  };

  const handleTransferQtyChange = (id: string, qtyVal: number) => {
    const item = companyItems.find(x => x.id === id);
    const maxStock = item?.stockQuantity || 0;
    const safeQty = Math.max(1, Math.min(qtyVal, maxStock));
    setTransferQuantities(prev => ({ ...prev, [id]: safeQty }));
  };

  const handleProcessStockTransfer = () => {
    if (sourceWarehouse === targetWarehouse) {
      alert('⚠️ Source Warehouse and Target Warehouse must be different!');
      return;
    }
    if (checkedTransferItemIds.length === 0) {
      alert('⚠️ Please select at least one item (check box) to transfer!');
      return;
    }

    const itemsToTransfer = checkedTransferItemIds.map(id => {
      const item = companyItems.find(x => x.id === id)!;
      const qty = transferQuantities[id] || 1;
      return { item, qty };
    });

    // Verify stock availability
    for (const { item, qty } of itemsToTransfer) {
      if (qty > item.stockQuantity) {
        alert(`❌ Insufficient stock for ${item.name}. Available: ${item.stockQuantity}, Requested: ${qty}`);
        return;
      }
    }

    // Process adjustments & create log entries
    const newLogs: StockLog[] = [];
    const transferSummaryItems: any[] = [];

    itemsToTransfer.forEach(({ item, qty }) => {
      const prev = item.stockQuantity;
      const next = prev - qty;
      onAdjustStock(item.id, next);

      const logEntry: StockLog = {
        id: 'log_trf_' + Date.now() + '_' + item.id,
        itemId: item.id,
        itemName: item.name,
        sku: item.sku,
        type: 'OUT',
        qty: qty,
        prevQty: prev,
        newQty: next,
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        refNo: transferRefNo,
        reason: `Inter-warehouse transfer: ${sourceWarehouse} -> ${targetWarehouse}`
      };
      newLogs.push(logEntry);

      transferSummaryItems.push({
        id: item.id,
        name: item.name,
        sku: item.sku,
        qty: qty,
        unit: item.sellingUnit || 'pcs',
        unitValue: item.salePrice || item.purchasePrice || 0,
        totalValue: (item.salePrice || item.purchasePrice || 0) * qty
      });
    });

    const updatedLogs = [...newLogs, ...stockLogs].slice(0, 100);
    setStockLogs(updatedLogs);
    safeSetLocalStorage(`stock_movements_logs_${activeCompanyId}`, updatedLogs);

    // Create Voucher for modal / print
    const voucherData = {
      refNo: transferRefNo,
      date: new Date().toLocaleDateString('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }),
      source: sourceWarehouse,
      target: targetWarehouse,
      note: transferNote,
      items: transferSummaryItems,
      totalUnits: transferSummaryItems.reduce((acc, i) => acc + i.qty, 0),
      totalValue: transferSummaryItems.reduce((acc, i) => acc + i.totalValue, 0)
    };

    setActiveTransferVoucher(voucherData);
    setCheckedTransferItemIds([]);
    setTransferRefNo(`TRF-${Math.floor(100000 + Math.random() * 900000)}`);
    alert(`✅ Stock Transfer Voucher ${voucherData.refNo} generated successfully! ${voucherData.totalUnits} units dispatched from ${sourceWarehouse} to ${targetWarehouse}.`);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setSkuAutoMode(true);
    setSku(`PRD-${Math.floor(1000 + Math.random() * 9000)}`);
    setBrand('');
    setVatType('standard');
    setSupplierName('');
    setBatchNumber('');
    setExpiryDate('');
    setWeightKg('');
    setCategory('');
    setSubcategory('');
    setImage('');
    setBarcode('');
    setPurchasePrice(0);
    setSalePrice(0);
    setStockQuantity(0);
    setMinStockThreshold(1);
    setInternalNotes('');
    setSellingUnit('piece');
    setCostUnit('per piece');
    setOtherCosts(0);
    setBarcodeType('Code128');
    setIsAddingNewCategory(false);
    setNewCategoryInput('');
    setIsAddingNewBrand(false);
    setNewBrandInput('');
    setIsModalOpen(true);
  };

  const openAddServiceModal = () => {
    setEditingItem(null);
    setName('');
    setSkuAutoMode(true);
    setSku(`SRV-${Math.floor(1000 + Math.random() * 9000)}`);
    setBrand('');
    setVatType('standard');
    setSupplierName('');
    setBatchNumber('');
    setExpiryDate('');
    setWeightKg('');
    setCategory('Services');
    setSubcategory('Professional Services');
    setImage('');
    setBarcode('');
    setPurchasePrice(0);
    setSalePrice(0);
    setStockQuantity(999);
    setMinStockThreshold(0);
    setInternalNotes('');
    setSellingUnit('service');
    setCostUnit('per service');
    setOtherCosts(0);
    setBarcodeType('QR');
    setIsAddingNewCategory(false);
    setNewCategoryInput('');
    setIsAddingNewBrand(false);
    setNewBrandInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setName(item.name);
    setSku(item.sku);
    setSkuAutoMode(false);
    setBrand(item.brand || '');
    setVatType(item.vatType || 'standard');
    setSupplierName(item.supplierName || '');
    setBatchNumber(item.batchNumber || '');
    setExpiryDate(item.expiryDate || '');
    setWeightKg(item.weightKg !== undefined ? item.weightKg : '');
    setCategory(item.category || '');
    setSubcategory(item.subcategory || '');
    setImage(item.image || '');
    setBarcode(item.barcode || '');
    setPurchasePrice(item.purchasePrice);
    setSalePrice(item.salePrice);
    setStockQuantity(item.stockQuantity);
    setMinStockThreshold(item.minStockThreshold !== undefined ? item.minStockThreshold : 1);
    setInternalNotes(item.internalNotes || '');
    setSellingUnit(item.sellingUnit || 'piece');
    setCostUnit(item.costUnit || 'per piece');
    setOtherCosts(item.otherCosts || 0);
    setBarcodeType(item.barcodeType || 'Code128');
    setIsAddingNewCategory(false);
    setNewCategoryInput('');
    setIsAddingNewBrand(false);
    setNewBrandInput('');
    setIsModalOpen(true);
  };

  const openAdjustmentModal = (item: InventoryItem) => {
    setAdjustingItem(item);
    setAdjustMode('IN');
    setAdjustmentQty(0);
    setAdjustmentRef('');
    setAdjustmentReason('Monthly Physical Stock Count');
    setIsStockAdjustmentOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (category.trim()) {
      handleAddCustomCategory(category.trim());
    }
    if (editingItem) {
      const updated: InventoryItem = {
        ...editingItem,
        name,
        sku,
        brand: brand.trim() || undefined,
        vatType,
        vatRate: vatType === 'standard' ? 5 : 0,
        supplierName: supplierName.trim() || undefined,
        batchNumber: batchNumber.trim() || undefined,
        expiryDate: expiryDate.trim() || undefined,
        weightKg: weightKg !== '' ? Number(weightKg) : undefined,
        category: category.trim() || undefined,
        subcategory: subcategory.trim() || undefined,
        image: image.trim() || undefined,
        barcode: barcode.trim() || undefined,
        purchasePrice: Number(purchasePrice),
        salePrice: Number(salePrice),
        stockQuantity: Number(stockQuantity),
        minStockThreshold: Number(minStockThreshold),
        internalNotes: internalNotes.trim() || undefined,
        sellingUnit,
        costUnit,
        otherCosts: Number(otherCosts),
        barcodeType
      };

      if (editingItem.stockQuantity !== Number(stockQuantity)) {
        logStockMovement(
          updated,
          'OVERRIDE',
          Math.abs(Number(stockQuantity) - editingItem.stockQuantity),
          editingItem.stockQuantity,
          Number(stockQuantity),
          'DIRECT_EDIT',
          'Stock count change during metadata modification'
        );
      }

      onUpdateItem(updated);
    } else {
      onAddItem({
        name,
        sku,
        brand: brand.trim() || undefined,
        vatType,
        vatRate: vatType === 'standard' ? 5 : 0,
        supplierName: supplierName.trim() || undefined,
        batchNumber: batchNumber.trim() || undefined,
        expiryDate: expiryDate.trim() || undefined,
        weightKg: weightKg !== '' ? Number(weightKg) : undefined,
        category: category.trim() || undefined,
        subcategory: subcategory.trim() || undefined,
        image: image.trim() || undefined,
        barcode: barcode.trim() || undefined,
        purchasePrice: Number(purchasePrice),
        salePrice: Number(salePrice),
        stockQuantity: Number(stockQuantity),
        minStockThreshold: Number(minStockThreshold),
        internalNotes: internalNotes.trim() || undefined,
        sellingUnit,
        costUnit,
        otherCosts: Number(otherCosts),
        barcodeType
      });

      setTimeout(() => {
        const matchingCreated = companyItems.find(i => i.sku === sku);
        if (matchingCreated && Number(stockQuantity) > 0) {
          logStockMovement(
            matchingCreated,
            'IN',
            Number(stockQuantity),
            0,
            Number(stockQuantity),
            'INIT',
            'Initial warehouse opening balance'
          );
        }
      }, 300);
    }
    setIsModalOpen(false);
  };

  const handleAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;

    const prevQty = adjustingItem.stockQuantity;
    let newQty = prevQty;
    const qtyChange = Number(adjustmentQty);

    if (adjustMode === 'IN') {
      newQty = prevQty + qtyChange;
    } else if (adjustMode === 'OUT') {
      newQty = Math.max(0, prevQty - qtyChange);
    } else {
      newQty = Math.max(0, qtyChange);
    }

    onAdjustStock(adjustingItem.id, newQty);
    logStockMovement(
      adjustingItem,
      adjustMode,
      qtyChange,
      prevQty,
      newQty,
      adjustmentRef,
      adjustmentReason
    );

    setIsStockAdjustmentOpen(false);
  };

  // Barcode / Laser scanning trigger
  const triggerScanValue = (code: string) => {
    const cleaned = code.trim();
    if (!cleaned) return;

    const matched = companyItems.find(
      item => (item.barcode && item.barcode.trim() === cleaned) || item.sku.toLowerCase() === cleaned.toLowerCase()
    );

    if (matched) {
      setScannerMatchedItem(matched);
      setUnregisteredBarcode(null);
      setScannerQty(1);
      setScannerRef('');
      setScannerReason('POS Laser Scan Activity');
      setScanMessage({ text: `Detected product: ${matched.name} (SKU: ${matched.sku})`, type: 'success' });
      if (soundEnabled) {
        playBeepSound();
      }
    } else {
      setScannerMatchedItem(null);
      setUnregisteredBarcode(cleaned);
      setScanMessage({ text: `Unknown Barcode/SKU: "${cleaned}". Click below to auto-add this product!`, type: 'error' });
    }
    setBarcodeInput('');
  };

  const handleScannerMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannerMatchedItem) return;

    const prevQty = scannerMatchedItem.stockQuantity;
    let newQty = prevQty;
    const qtyChange = Number(scannerQty);

    if (scannerAction === 'IN') {
      newQty = prevQty + qtyChange;
    } else {
      newQty = Math.max(0, prevQty - qtyChange);
    }

    onAdjustStock(scannerMatchedItem.id, newQty);
    logStockMovement(
      scannerMatchedItem,
      scannerAction,
      qtyChange,
      prevQty,
      newQty,
      scannerRef,
      scannerReason
    );

    setScannerMatchedItem(prev => prev ? { ...prev, stockQuantity: newQty } : null);
    setScanMessage({ text: `Successfully updated stock! New qty: ${newQty}`, type: 'success' });
    setScannerQty(1);
    setScannerRef('');
  };

  const clearLogsLedger = () => {
    if (confirm('Are you sure you want to delete all historical stock transaction logs for this company?')) {
      setStockLogs([]);
      localStorage.removeItem(`stock_movements_logs_${activeCompanyId}`);
    }
  };

  const formatAED = (amount: number) => {
    const currencyCode = company?.currency || 'AED';
    const symbol = company?.currencySymbol || currencyCode;
    const position = company?.symbolPosition || 'before';
    const decimals = ['BHD', 'OMR', 'KWD'].includes(currencyCode) ? 3 : 2;
    const formattedNum = amount.toLocaleString('en-US', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
    return position === 'before' ? `${symbol} ${formattedNum}` : `${formattedNum} ${symbol}`;
  };

  const [selectedIdx, setSelectedIdx] = useState<number>(-1);

  useEffect(() => {
    if (filteredItems.length > 0) {
      setSelectedIdx(0);
    } else {
      setSelectedIdx(-1);
    }
  }, [search, stockStatusFilter, categoryFilter]);

  // Extract all categories
  const categoriesList = Array.from(
    new Set([
      ...customCategories,
      ...companyItems.map(i => i.category).filter((c): c is string => Boolean(c && c.trim()))
    ])
  ).sort();

  // Extract all brands
  const brandsList = Array.from(
    new Set([
      ...customBrands,
      ...companyItems.map(i => i.brand).filter((b): b is string => Boolean(b && b.trim()))
    ])
  ).sort();

  const lowStockCount = companyItems.filter(i => i.stockQuantity <= i.minStockThreshold).length;

  if (isModalOpen) {
    return (
      <div className="w-full max-w-[1400px] mx-auto space-y-6 animate-fade-in font-sans pb-12 no-print">
        {/* Top Header Bar (Identical to Sales Invoice Form) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Catalog</span>
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
            <div>
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {editingItem ? 'Edit Product Item' : 'New Product / Service Onboarding'}
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure item specifications, selling price, purchase cost, UAE VAT tax status, and stock control
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 uppercase hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => {
                const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                handleSubmit(fakeEvent);
              }}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs uppercase tracking-wider shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{editingItem ? 'Save Item Changes' : 'Save & Onboard Product'}</span>
            </button>
          </div>
        </div>

        {/* Main Product Form Page Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: SKU & Photo Identity Header */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-mono flex items-center space-x-2">
                <Tag className="w-4 h-4" />
                <span>1. Item Identification & SKU Specification</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono font-bold">REQUIRED SPECS</span>
            </div>

            {/* SKU Badge & Auto/Manual Toggle Bar */}
            <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div 
                  onClick={() => image && setViewerImage(image)} 
                  className="w-14 h-14 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center font-mono font-bold text-indigo-300 text-sm shrink-0 overflow-hidden relative cursor-pointer group"
                  title={image ? "Click to expand product photo" : "No image uploaded"}
                >
                  {image ? (
                    <img src={image} alt="Product" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <Package className="w-7 h-7 text-indigo-400" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-300 font-bold block">Assigned SKU Code</span>
                  <span className="text-xl font-black font-mono tracking-wider text-white">{sku || 'PRD-NEW-AUTO'}</span>
                </div>
              </div>

              <div className="flex flex-col sm:items-end space-y-1.5 w-full sm:w-auto">
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-300 cursor-pointer select-none bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                  <input
                    type="checkbox"
                    checked={skuAutoMode}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setSkuAutoMode(isChecked);
                      if (isChecked) {
                        const prefix = category === 'Services' ? 'SRV' : 'PRD';
                        setSku(`${prefix}-${Math.floor(1000 + Math.random() * 9000)}`);
                      }
                    }}
                    className="rounded text-indigo-500 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Auto-generate SKU Code</span>
                </label>
                {skuAutoMode && (
                  <button
                    type="button"
                    onClick={() => {
                      const prefix = category === 'Services' ? 'SRV' : 'PRD';
                      setSku(`${prefix}-${Math.floor(1000 + Math.random() * 9000)}`);
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-200 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerate Code</span>
                  </button>
                )}
              </div>
            </div>

            {/* SKU & Photo Upload Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  SKU Code ({skuAutoMode ? 'Auto' : 'Manual'}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SKU-100293 or PRD-8821"
                  value={sku}
                  readOnly={skuAutoMode}
                  onChange={(e) => setSku(e.target.value)}
                  className={`w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs font-mono font-bold ${
                    skuAutoMode 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed' 
                      : 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Product Picture (Optional)
                </label>
                <div className="flex items-center space-x-2">
                  <label className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-dashed border-indigo-300 dark:border-indigo-800 hover:border-indigo-500 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-bold text-xs cursor-pointer transition-all">
                    <ImagePlus className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                    <span className="truncate">{image ? 'Change Photo' : 'Upload Product Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProductImageUpload}
                      className="hidden"
                    />
                  </label>
                  {image && (
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => setViewerImage(image)}
                        className="p-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 cursor-pointer"
                        title="Preview Image"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        className="p-2.5 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 cursor-pointer"
                        title="Remove Picture"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Item Description Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Item Description Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Godes Magnetic Car Holder OD-HD708"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Brand & Tax Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Brand / Manufacturer Grade
                  </label>
                  {!isAddingNewBrand && (
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNewBrand(true);
                          setNewBrandInput('');
                        }}
                        className="text-xs text-[#4F46E5] font-bold hover:underline flex items-center space-x-0.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New Brand</span>
                      </button>
                      {brand && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomBrand(brand)}
                          className="text-xs text-rose-600 font-bold hover:underline flex items-center space-x-0.5 cursor-pointer"
                          title={`Delete brand "${brand}"`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {!isAddingNewBrand ? (
                  <select
                    value={brand}
                    onChange={(e) => {
                      if (e.target.value === '__NEW_BRAND__') {
                        setIsAddingNewBrand(true);
                        setNewBrandInput('');
                      } else if (e.target.value === '__DELETE_BRAND__') {
                        handleDeleteCustomBrand(brand);
                      } else {
                        setBrand(e.target.value);
                      }
                    }}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 cursor-pointer font-bold"
                  >
                    <option value="">-- Select Brand / Manufacturer --</option>
                    {brandsList.map((brandOpt) => (
                      <option key={brandOpt} value={brandOpt}>
                        {brandOpt}
                      </option>
                    ))}
                    <option value="__NEW_BRAND__" className="font-bold text-[#4F46E5]">
                      + Create New Brand...
                    </option>
                    {brand && (
                      <option value="__DELETE_BRAND__" className="font-bold text-rose-600">
                        🗑️ Delete Selected Brand ("{brand}")...
                      </option>
                    )}
                  </select>
                ) : (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="New Brand / Manufacturer name..."
                      value={newBrandInput}
                      onChange={(e) => setNewBrandInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newBrandInput.trim()) {
                            const added = newBrandInput.trim();
                            handleAddCustomBrand(added);
                            setBrand(added);
                            setNewBrandInput('');
                            setIsAddingNewBrand(false);
                          }
                        }
                      }}
                      className="flex-1 border border-indigo-300 dark:border-indigo-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newBrandInput.trim()) {
                          const added = newBrandInput.trim();
                          handleAddCustomBrand(added);
                          setBrand(added);
                          setNewBrandInput('');
                        }
                        setIsAddingNewBrand(false);
                      }}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 cursor-pointer"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewBrand(false);
                        setNewBrandInput('');
                      }}
                      className="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  UAE VAT Tax Status
                </label>
                <select
                  value={vatType}
                  onChange={(e) => setVatType(e.target.value as any)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="standard">Standard 5% VAT (FTA Compliant)</option>
                  <option value="zero_rated">Zero-Rated (0% Export)</option>
                  <option value="exempt">Tax Exempt</option>
                </select>
              </div>
            </div>

            {/* Category, Selling Unit, Preferred Supplier */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  {!isAddingNewCategory && (
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNewCategory(true);
                          setNewCategoryInput('');
                        }}
                        className="text-xs text-[#4F46E5] font-bold hover:underline flex items-center space-x-0.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New Category</span>
                      </button>
                      {category && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomCategory(category)}
                          className="text-xs text-rose-600 font-bold hover:underline flex items-center space-x-0.5 cursor-pointer"
                          title={`Delete category "${category}"`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {!isAddingNewCategory ? (
                  <select
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setIsAddingNewCategory(true);
                        setNewCategoryInput('');
                      } else if (e.target.value === '__DELETE_CAT__') {
                        handleDeleteCustomCategory(category);
                      } else {
                        setCategory(e.target.value);
                      }
                    }}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="">-- Select Category --</option>
                    {categoriesList.map((catOption) => (
                      <option key={catOption} value={catOption}>
                        {catOption}
                      </option>
                    ))}
                    <option value="__NEW__" className="font-bold text-[#4F46E5]">
                      + Create New Category...
                    </option>
                    {category && (
                      <option value="__DELETE_CAT__" className="font-bold text-rose-600">
                        🗑️ Delete Selected Category ("{category}")...
                      </option>
                    )}
                  </select>
                ) : (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="New Category name..."
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newCategoryInput.trim()) {
                            const added = newCategoryInput.trim();
                            handleAddCustomCategory(added);
                            setCategory(added);
                            setNewCategoryInput('');
                            setIsAddingNewCategory(false);
                          }
                        }
                      }}
                      className="flex-1 border border-indigo-300 dark:border-indigo-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newCategoryInput.trim()) {
                          const added = newCategoryInput.trim();
                          handleAddCustomCategory(added);
                          setCategory(added);
                          setNewCategoryInput('');
                        }
                        setIsAddingNewCategory(false);
                      }}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 cursor-pointer"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewCategory(false);
                        setNewCategoryInput('');
                      }}
                      className="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Selling Unit
                </label>
                <select
                  value={sellingUnit}
                  onChange={(e) => setSellingUnit(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 bg-white dark:bg-slate-900 text-xs cursor-pointer font-medium"
                >
                  <option value="piece">Piece (Pcs)</option>
                  <option value="box">Box / Carton</option>
                  <option value="kg">Kilogram (KG)</option>
                  <option value="meter">Meter (M)</option>
                  <option value="set">Set / Pack</option>
                  <option value="service">Service (Unit)</option>
                  <option value="hour">Hour (Hr)</option>
                  <option value="liter">Liter (L)</option>
                  <option value="ton">Ton (MT)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Preferred Supplier / Vendor
                </label>
                <input
                  type="text"
                  placeholder="e.g. RMZ Trading LLC"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Costing, Pricing & Profit Margins */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-mono flex items-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <span>2. Pricing Structure, Landed Costs & Profit Margins</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono font-bold">AUTOMATED MARGIN & MARKUP CALC</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Purchase Cost (AED)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(Number(e.target.value))}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 bg-white dark:bg-slate-900 text-sm font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Landed Surcharge / Shipping (AED)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={otherCosts}
                  onChange={(e) => setOtherCosts(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 bg-white dark:bg-slate-900 text-sm font-mono font-bold text-slate-700 dark:text-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Selling Price (AED)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={salePrice}
                  onChange={(e) => setSalePrice(Number(e.target.value))}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 bg-white dark:bg-slate-900 text-sm font-mono font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Gross Profit & Margin
                </label>
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2 flex flex-col justify-center">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                    <span>Net Profit:</span>
                    <span>AED {(salePrice - (purchasePrice + (otherCosts || 0))).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] font-mono">
                    <span className="text-slate-500">Margin:</span>
                    <span className={`font-black px-1.5 py-0.2 rounded ${
                      (salePrice - (purchasePrice + (otherCosts || 0))) >= 0 
                        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60' 
                        : 'text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60'
                    }`}>
                      {salePrice > 0 ? (((salePrice - (purchasePrice + (otherCosts || 0))) / salePrice) * 100).toFixed(1) : '0.0'}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Stock Control & Inventory Thresholds */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider font-mono flex items-center space-x-2">
                <Boxes className="w-4 h-4" />
                <span>3. Stock Levels, Batch / Expiry & Threshold Controls</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono font-bold">AUTOMATED RE-ORDER & BATCH TRACKING</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Initial Stock Quantity
                </label>
                <input
                  type="number"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(Number(e.target.value))}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 bg-white dark:bg-slate-900 text-sm font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Re-Order Alert Threshold
                </label>
                <input
                  type="number"
                  value={minStockThreshold}
                  onChange={(e) => setMinStockThreshold(Number(e.target.value))}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 bg-white dark:bg-slate-900 text-sm font-mono font-bold text-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Unit Weight (KG)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 0.25"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 bg-white dark:bg-slate-900 text-sm font-mono"
                />
              </div>
            </div>

            {/* Batch / Lot Tracking and Expiry Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Batch / Lot Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. BATCH-2026-08A"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Product Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-200 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Internal Notes & Specifications
              </label>
              <textarea
                rows={3}
                placeholder="Supplier notes, specifications, or warranty details..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 bg-white dark:bg-slate-900 text-xs font-medium"
              />
            </div>
          </div>

          {/* Card 4: Barcode & Camera Scanner */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-mono flex items-center space-x-2">
                <QrCode className="w-4 h-4" />
                <span>4. Barcode & Optical Scan Engine</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono font-bold">EAN / CODE128</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Product Barcode / EAN Number
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="e.g. 629110001234"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="flex-1 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setIsFormScannerOpen(true)}
                    className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 cursor-pointer shrink-0 transition-colors"
                    title="Scan product barcode using camera"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Scan</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Barcode Symbology Format
                </label>
                <select
                  value={barcodeType}
                  onChange={(e) => setBarcodeType(e.target.value as any)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 bg-white dark:bg-slate-900 text-xs font-mono font-medium"
                >
                  <option value="EAN-13">EAN-13 (Standard Retail)</option>
                  <option value="Code128">Code 128 (Universal)</option>
                  <option value="QR">2D QR Code</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-end space-x-3 shadow-xs">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 uppercase hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs uppercase tracking-wider shadow-xs transition-colors cursor-pointer flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{editingItem ? 'Save Item Changes' : 'Onboard Product'}</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <h2 className="text-xl font-sans font-black tracking-tight text-[#0F172A]">Inventory & Catalog Suite</h2>
          <p className="text-xs text-slate-500">Products, Category Breakdown, Services Catalog & Barcode Scanner</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sub-tab Swapper */}
          <div className="bg-[#F1F5F9] dark:bg-slate-800 p-1 rounded-lg flex flex-wrap gap-1 text-xs">
            {isComputerIndustry && (
              <button
                onClick={() => handleTabChange('COMPUTERS', 'inv_computer_it')}
                className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeSubTab === 'COMPUTERS' 
                    ? 'bg-blue-600 text-white font-black shadow-xs' 
                    : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Computers & Printers</span>
              </button>
            )}

            {isSparePartsIndustry && (
              <button
                onClick={() => handleTabChange('SPARE_PARTS', 'inv_spare_parts')}
                className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeSubTab === 'SPARE_PARTS' 
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs' 
                    : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Auto & Bike Parts</span>
              </button>
            )}

            <button
              onClick={() => handleTabChange('STOCK', 'inv_stock')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                activeSubTab === 'STOCK' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-indigo-600" />
              <span>Products & Stock</span>
            </button>

            <button
              onClick={() => handleTabChange('CATEGORY', 'inv_category')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                activeSubTab === 'CATEGORY' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#4F46E5]" />
              <span>Category & Others</span>
            </button>

            <button
              onClick={() => handleTabChange('SERVICES', 'inv_services')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                activeSubTab === 'SERVICES' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-blue-600" />
              <span>Services List</span>
            </button>

            <button
              onClick={() => handleTabChange('LIST', 'inv_list')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                activeSubTab === 'LIST' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>Master List</span>
            </button>

            <button
              onClick={() => handleTabChange('SCANNER')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                activeSubTab === 'SCANNER' ? 'bg-[#4F46E5] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Laser Scanner</span>
            </button>

            <button
              onClick={() => handleTabChange('LOGS')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                activeSubTab === 'LOGS' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Logs</span>
            </button>

            <button
              onClick={() => handleTabChange('ANALYTICS')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                activeSubTab === 'ANALYTICS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Valuation & Restock</span>
            </button>

            {company?.multiBranchEnabled && (
              <button
                onClick={() => handleTabChange('TRANSFER')}
                className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                  activeSubTab === 'TRANSFER' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Boxes className="w-3.5 h-3.5 text-indigo-400" />
                <span>Multi-Warehouse Transfer</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => openLabelPrintModal()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer shadow-sm border border-indigo-500/30 shrink-0"
              title="Print product barcodes in batch (1, 20, 40, 50, 100 stickers)"
            >
              <Printer className="w-4 h-4 text-indigo-100" />
              <span>Print Labels</span>
            </button>

            <button
              onClick={openAddServiceModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Service</span>
            </button>

            <button
              id="btn-add-item-open"
              onClick={openAddModal}
              className="bg-[#0F172A] hover:bg-[#4F46E5] text-white px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Product</span>
            </button>
          </div>
        </div>
      </div>

      {/* Critical Low Stock Warning Alert Banner */}
      {lowStockCount > 0 && activeSubTab === 'STOCK' && (
        <div className="bg-[#FFF1F1] border border-rose-200 p-3.5 rounded-lg flex items-start space-x-3 text-xs animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-rose-950 uppercase font-sans tracking-wide">Critical low stock alerts active</h4>
            <p className="text-rose-800 mt-1">
              There are <strong>{lowStockCount} items</strong> in your physical catalog currently trading below their specified safety limits.
            </p>
          </div>
          <button
            onClick={() => setStockStatusFilter('LOW_STOCK')}
            className="bg-white hover:bg-rose-100/50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded font-bold text-[10px] uppercase font-mono tracking-wider transition-colors cursor-pointer self-center"
          >
            Filter Low Stock
          </button>
        </div>
      )}

      {/* STATS BENTO SUMMARY ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <div className="bg-[#F8FAFC] dark:bg-slate-900/60 p-3.5 border border-[#E2E8F0] dark:border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-mono tracking-widest font-bold">
            <span>Total Catalog SKUs</span>
            <Package className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-lg font-bold font-mono text-[#0F172A] dark:text-white mt-1">{companyItems.length} Items</p>
        </div>

        <div className="bg-[#F8FAFC] dark:bg-slate-900/60 p-3.5 border border-[#E2E8F0] dark:border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-mono tracking-widest font-bold">
            <span>Finalized Items</span>
            <Check className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {companyItems.filter(i => Boolean(i.sku && i.barcode && i.salePrice > 0)).length} / {companyItems.length}
            </p>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
              {companyItems.length > 0 ? Math.round((companyItems.filter(i => Boolean(i.sku && i.barcode && i.salePrice > 0)).length / companyItems.length) * 100) : 100}% Ready
            </span>
          </div>
        </div>

        <div className="bg-[#F8FAFC] dark:bg-slate-900/60 p-3.5 border border-[#E2E8F0] dark:border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-mono tracking-widest font-bold">
            <span>Asset Valuation</span>
            <Coins className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-lg font-bold font-mono text-[#0F172A] dark:text-white mt-1">
            {formatAED(companyItems.reduce((sum, item) => sum + (item.purchasePrice * item.stockQuantity), 0))}
          </p>
        </div>

        <div className="bg-[#F8FAFC] dark:bg-slate-900/60 p-3.5 border border-[#E2E8F0] dark:border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-mono tracking-widest font-bold">
            <span>Categories</span>
            <Layers className="w-4 h-4 text-[#4F46E5]" />
          </div>
          <p className="text-lg font-bold font-mono text-[#0F172A] dark:text-white mt-1">
            {categoriesList.length} Registered
          </p>
        </div>

        <div className="bg-[#F8FAFC] dark:bg-slate-900/60 p-3.5 border border-[#E2E8F0] dark:border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-mono tracking-widest font-bold">
            <span>Services</span>
            <Briefcase className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
            {serviceItems.length} Services
          </p>
        </div>
      </div>

      {/* SUB-TAB: COMPUTERS, PRINTERS & IT SOLUTIONS CENTER */}
      {activeSubTab === 'COMPUTERS' && (
        <ComputerManager
          company={company}
          inventory={companyItems}
          onSaveItem={(partialItem) => {
            if (partialItem.id && companyItems.some(i => i.id === partialItem.id)) {
              const existing = companyItems.find(i => i.id === partialItem.id)!;
              onUpdateItem({ ...existing, ...partialItem } as InventoryItem);
            } else {
              onAddItem(partialItem as any);
            }
          }}
          onDeleteItem={onDeleteItem}
          onBulkAddItems={(bulkItems) => {
            bulkItems.forEach(b => onAddItem(b as any));
          }}
        />
      )}

      {/* SUB-TAB: AUTO & BIKE SPARE PARTS CENTER */}
      {activeSubTab === 'SPARE_PARTS' && (
        <SparePartsManager
          company={company}
          inventory={companyItems}
          onSaveItem={(partialItem) => {
            if (partialItem.id && companyItems.some(i => i.id === partialItem.id)) {
              const existing = companyItems.find(i => i.id === partialItem.id)!;
              onUpdateItem({ ...existing, ...partialItem } as InventoryItem);
            } else {
              onAddItem(partialItem as any);
            }
          }}
          onDeleteItem={onDeleteItem}
          onBulkAddItems={(bulkItems) => {
            bulkItems.forEach(b => onAddItem(b as any));
          }}
        />
      )}

      {/* SUB-TAB 1: PRODUCTS & STOCK VIEW */}
      {activeSubTab === 'STOCK' && (
        <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl overflow-hidden">
          {/* Search Bar & Filters */}
          <div className="p-4 border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/80 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1">
              <div className="relative w-full max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="input-item-search"
                  type="text"
                  placeholder="Search by SKU, Barcode, or product name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-lg focus:border-[#4F46E5] focus:outline-hidden transition-colors"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center space-x-1.5 shrink-0">
                <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400">Category:</span>
                {!isAddingFilterCat ? (
                  <div className="flex items-center space-x-1">
                    <select
                      value={categoryFilter}
                      onChange={(e) => {
                        if (e.target.value === '__NEW_CAT__') {
                          setIsAddingFilterCat(true);
                          setFilterCatInput('');
                        } else {
                          setCategoryFilter(e.target.value);
                        }
                      }}
                      className="border border-[#E2E8F0] dark:border-slate-800 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-900 text-xs focus:outline-hidden text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                    >
                      <option value="ALL">All Categories</option>
                      {categoriesList.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="__NEW_CAT__" className="font-bold text-indigo-600">+ Create Category...</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingFilterCat(true);
                        setFilterCatInput('');
                      }}
                      className="p-1.5 bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold cursor-pointer"
                      title="Add New Category"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    {categoryFilter !== 'ALL' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomCategory(categoryFilter)}
                        className="p-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold cursor-pointer"
                        title={`Delete category "${categoryFilter}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <input
                      type="text"
                      placeholder="Category name..."
                      value={filterCatInput}
                      onChange={(e) => setFilterCatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (filterCatInput.trim()) {
                            handleAddCustomCategory(filterCatInput.trim());
                            setCategoryFilter(filterCatInput.trim());
                            setFilterCatInput('');
                          }
                          setIsAddingFilterCat(false);
                        }
                      }}
                      className="text-xs border border-indigo-300 rounded-lg px-2 py-1 bg-white dark:bg-slate-900 w-32 focus:ring-1 focus:ring-indigo-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (filterCatInput.trim()) {
                          handleAddCustomCategory(filterCatInput.trim());
                          setCategoryFilter(filterCatInput.trim());
                          setFilterCatInput('');
                        }
                        setIsAddingFilterCat(false);
                      }}
                      className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-[11px] font-bold hover:bg-indigo-700 cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingFilterCat(false)}
                      className="px-1.5 py-1 text-slate-500 hover:bg-slate-200 rounded-lg text-[11px] cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Brand / Manufacturer Filter */}
              <div className="flex items-center space-x-1.5 shrink-0">
                <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400">Brand:</span>
                {!isAddingFilterBrand ? (
                  <div className="flex items-center space-x-1">
                    <select
                      value={brandFilter}
                      onChange={(e) => {
                        if (e.target.value === '__NEW_BRAND__') {
                          setIsAddingFilterBrand(true);
                          setFilterBrandInput('');
                        } else {
                          setBrandFilter(e.target.value);
                        }
                      }}
                      className="border border-[#E2E8F0] dark:border-slate-800 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-900 text-xs focus:outline-hidden text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                    >
                      <option value="ALL">All Brands</option>
                      {brandsList.map(bName => (
                        <option key={bName} value={bName}>{bName}</option>
                      ))}
                      <option value="__NEW_BRAND__" className="font-bold text-amber-600">+ Create Brand...</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingFilterBrand(true);
                        setFilterBrandInput('');
                      }}
                      className="p-1.5 bg-amber-50 dark:bg-slate-800 hover:bg-amber-100 text-amber-600 rounded-lg text-xs font-bold cursor-pointer"
                      title="Add New Brand"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    {brandFilter !== 'ALL' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomBrand(brandFilter)}
                        className="p-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold cursor-pointer"
                        title={`Delete brand "${brandFilter}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <input
                      type="text"
                      placeholder="Brand name..."
                      value={filterBrandInput}
                      onChange={(e) => setFilterBrandInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (filterBrandInput.trim()) {
                            handleAddCustomBrand(filterBrandInput.trim());
                            setBrandFilter(filterBrandInput.trim());
                            setFilterBrandInput('');
                          }
                          setIsAddingFilterBrand(false);
                        }
                      }}
                      className="text-xs border border-amber-300 rounded-lg px-2 py-1 bg-white dark:bg-slate-900 w-32 focus:ring-1 focus:ring-amber-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (filterBrandInput.trim()) {
                          handleAddCustomBrand(filterBrandInput.trim());
                          setBrandFilter(filterBrandInput.trim());
                          setFilterBrandInput('');
                        }
                        setIsAddingFilterBrand(false);
                      }}
                      className="px-2 py-1 bg-amber-600 text-white rounded-lg text-[11px] font-bold hover:bg-amber-700 cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingFilterBrand(false)}
                      className="px-1.5 py-1 text-slate-500 hover:bg-slate-200 rounded-lg text-[11px] cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Stock Level Filter */}
              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-slate-400">Stock:</span>
                <select
                  value={stockStatusFilter}
                  onChange={(e) => setStockStatusFilter(e.target.value)}
                  className="border border-[#E2E8F0] dark:border-slate-800 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-900 text-xs focus:outline-hidden text-slate-700 dark:text-slate-300"
                >
                  <option value="ALL">All Levels</option>
                  <option value="HEALTHY">Healthy Stock</option>
                  <option value="LOW_STOCK">Low Stock Alert</option>
                  <option value="OUT_OF_STOCK">Zero Stock (0)</option>
                  <option value="NEGATIVE">Negative / Overdraft ({companyItems.filter(i => i.stockQuantity < 0).length})</option>
                </select>
              </div>
            </div>

            <span className="text-[10px] font-mono text-slate-400 shrink-0 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 px-2 py-1 rounded-lg">
              Showing {filteredItems.length} of {companyItems.length} SKUs
            </span>
          </div>

          {/* Cards / Grid view */}
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-8 max-w-2xl mx-auto my-8">
              <Package className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#0F172A] dark:text-white">No Products Found</h3>
              <p className="text-xs text-slate-500 mt-1">Register products and inventory items to manage stock and billing.</p>
              <button
                onClick={openAddModal}
                className="mt-4 px-4 py-2 bg-[#0F172A] text-white text-xs font-bold rounded-lg uppercase tracking-wider inline-flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Onboard First Product</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {filteredItems.map(item => {
                const isLow = item.stockQuantity <= item.minStockThreshold && item.stockQuantity > 0;
                const isOut = item.stockQuantity <= 0;
                return (
                  <div key={item.id} className="border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900/50 hover:border-indigo-400 transition-all shadow-xs flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start space-x-2.5">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              onClick={() => setViewerImage(item.image || null)}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-800 cursor-pointer shrink-0 hover:scale-105 transition-transform"
                              title="Click to view photo"
                            />
                          )}
                          <div>
                            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">SKU: {item.sku}</span>
                            <h4 className="font-bold text-sm text-[#0F172A] dark:text-white mt-0.5 line-clamp-1">{item.name}</h4>
                          </div>
                        </div>
                        {item.category && (
                          <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-2 py-0.5 rounded-full shrink-0">
                            {item.category}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase block font-bold">Selling Price</span>
                          <span className="font-bold font-mono text-emerald-600">{formatAED(item.salePrice)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase block font-bold">Cost Price</span>
                          <span className="font-medium font-mono text-slate-600 dark:text-slate-400">{formatAED(item.purchasePrice)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.stockQuantity < 0 ? 'bg-rose-600 animate-pulse' : isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        <span className={`font-mono font-bold ${item.stockQuantity < 0 ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800' : 'text-slate-700 dark:text-slate-300'}`}>
                          {item.stockQuantity} {item.sellingUnit || 'units'} {item.stockQuantity < 0 ? '(Overdraft)' : ''}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => openAdjustmentModal(item)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[10px] font-bold text-slate-700 dark:text-slate-300 rounded cursor-pointer"
                        >
                          ± Adjust
                        </button>
                        <button
                          onClick={() => openLabelPrintModal(item)}
                          className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer shadow-2xs"
                          title="Print Barcode Labels (Single / Batch 20, 40, 50, 100)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 cursor-pointer"
                          title="Edit Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${item.name}?`)) onDeleteItem(item.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: CATEGORY & OTHERS VIEW */}
      {activeSubTab === 'CATEGORY' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-slate-800 pb-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-[#4F46E5]" />
                  <span>Category Breakdown & Attributes</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Organize items into structured catalog categories and manage unit attributes</p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="e.g. Mobile Accessories, Furniture..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!newCatName.trim()) return;
                      handleAddCustomCategory(newCatName.trim());
                      setNewCatName('');
                    }
                  }}
                  className="text-xs border border-[#E2E8F0] dark:border-slate-800 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-900 w-64 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <button
                  onClick={() => {
                    if (!newCatName.trim()) return;
                    handleAddCustomCategory(newCatName.trim());
                    setNewCatName('');
                  }}
                  className="px-3.5 py-1.5 bg-[#4F46E5] text-white text-xs font-bold rounded-lg flex items-center space-x-1 cursor-pointer hover:bg-indigo-700 transition-all"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>+ Add Category</span>
                </button>
              </div>
            </div>

            {/* Category Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categoriesList.map(cat => {
                const itemsInCat = companyItems.filter(i => (i.category || 'Uncategorized') === cat);
                const totalUnits = itemsInCat.reduce((sum, i) => sum + i.stockQuantity, 0);
                const totalVal = itemsInCat.reduce((sum, i) => sum + (i.salePrice * i.stockQuantity), 0);
                const avgPrice = itemsInCat.length > 0 ? itemsInCat.reduce((sum, i) => sum + i.salePrice, 0) / itemsInCat.length : 0;

                return (
                  <div key={cat} className="border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/50 hover:border-indigo-500 transition-all relative group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
                          <Tag className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#0F172A] dark:text-white">{cat}</h4>
                          <span className="text-[10px] text-slate-400">{itemsInCat.length} SKUs Registered</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomCategory(cat);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title={`Delete Category "${cat}"`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block font-bold">Stock Quantity</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{totalUnits} units</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block font-bold">Category Valuation</span>
                        <span className="font-mono font-bold text-emerald-600">{formatAED(totalVal)}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">Avg Price: {formatAED(avgPrice)}</span>
                      <button
                        onClick={() => {
                          setCategoryFilter(cat);
                          handleTabChange('STOCK', 'inv_stock');
                        }}
                        className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Filter Items</span>
                        <Filter className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Brands & Manufacturers Card */}
            <div className="mt-8 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#E2E8F0] dark:border-slate-800 pb-3 mb-4 gap-2">
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A] dark:text-white flex items-center space-x-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Registered Brands & Manufacturers ({brandsList.length})</span>
                  </h4>
                  <p className="text-xs text-slate-500">Manage brand grades, OEM manufacturers, and filter catalog items by manufacturer</p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="e.g. Godes, RMZ, Anker..."
                    value={newBrandInput}
                    onChange={(e) => setNewBrandInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!newBrandInput.trim()) return;
                        handleAddCustomBrand(newBrandInput.trim());
                        setNewBrandInput('');
                      }
                    }}
                    className="text-xs border border-[#E2E8F0] dark:border-slate-800 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-900 w-56 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newBrandInput.trim()) return;
                      handleAddCustomBrand(newBrandInput.trim());
                      setNewBrandInput('');
                    }}
                    className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg flex items-center space-x-1 cursor-pointer hover:bg-amber-700 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Brand</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {brandsList.map(brandName => {
                  const brandItems = companyItems.filter(i => (i.brand || '') === brandName);
                  return (
                    <div
                      key={brandName}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 hover:border-amber-500 transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 overflow-hidden min-w-0">
                          <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="font-bold text-xs text-[#0F172A] dark:text-white truncate">{brandName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomBrand(brandName);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer shrink-0 ml-1"
                          title={`Delete Brand "${brandName}"`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between font-mono">
                        <span>{brandItems.length} SKUs</span>
                        <button
                          type="button"
                          onClick={() => {
                            setBrandFilter(brandName);
                            handleTabChange('STOCK', 'inv_stock');
                          }}
                          className="text-amber-600 font-bold hover:underline cursor-pointer"
                        >
                          Filter →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Attributes & Units Info Box */}
            <div className="mt-6 bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-4">
              <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Wrench className="w-4 h-4" />
                <span>Unit Models & Custom Attributes</span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Hisaab Pro supports dual selling/cost unit metrics (e.g. <strong>KG</strong>, <strong>Box</strong>, <strong>Piece</strong>, <strong>Meter</strong>, <strong>Hour</strong>, <strong>Service</strong>, <strong>Set</strong>). You can define individual cost units and re-order thresholds for each SKU inside the product form.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SERVICES LIST VIEW */}
      {activeSubTab === 'SERVICES' && (
        <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#E2E8F0] dark:border-slate-800 pb-4 mb-6 gap-3">
            <div>
              <h3 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <span>Services & Labor Catalog</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Non-depleting service offerings, billable labor rates, and professional fees</p>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <button
                onClick={handleGenerateTenServices}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer"
                title="Populate catalog with 10 standard UAE professional service offerings"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Generate 10 Services List</span>
              </button>
              <button
                onClick={openAddServiceModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add New Service</span>
              </button>
            </div>
          </div>

          {serviceItems.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 max-w-lg mx-auto">
              <Briefcase className="w-12 h-12 text-blue-500 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">No Service Items Registered</h4>
              <p className="text-xs text-slate-500 mt-1">
                Add consulting fees, installation charges, labor rates, or maintenance packages to invoice them seamlessly.
              </p>
              <div className="flex items-center justify-center space-x-3 mt-4">
                <button
                  onClick={openAddServiceModal}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  + Create First Service
                </button>
                <button
                  onClick={handleGenerateTenServices}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Generate 10 Service Lists</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceItems.map(item => (
                <div key={item.id} className="border border-blue-100 dark:border-slate-800 bg-blue-50/20 dark:bg-slate-900/40 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold text-blue-600 uppercase">Service SKU: {item.sku}</span>
                      <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full uppercase">
                        {item.sellingUnit || 'Service'}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-[#0F172A] dark:text-white mt-1">{item.name}</h4>
                    {item.internalNotes && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.internalNotes}</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block font-bold">Standard Rate</span>
                      <span className="text-sm font-bold font-mono text-blue-600">{formatAED(item.salePrice)}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 cursor-pointer"
                        title="Edit Service"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete service ${item.name}?`)) onDeleteItem(item.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Delete Service"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: MASTER ITEM LIST TABLE */}
      {activeSubTab === 'LIST' && (
        <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/80 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Master search all items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full max-w-md text-xs px-3 py-1.5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-lg"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => triggerPrint('inventory-list-table')}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold rounded-lg flex items-center space-x-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print List</span>
              </button>
            </div>
          </div>

          <div id="inventory-list-table" className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">SKU / Code</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Unit</th>
                  <th className="py-3 px-4 text-center">Stock Qty</th>
                  <th className="py-3 px-4 text-right">Cost (AED)</th>
                  <th className="py-3 px-4 text-right">Price (AED)</th>
                  <th className="py-3 px-4 text-right">Valuation</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredItems.map(item => {
                  const isSrv = isServiceItem(item);
                  const val = item.salePrice * item.stockQuantity;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">{item.sku}</td>
                      <td className="py-2.5 px-4 font-bold text-[#0F172A] dark:text-white">{item.name}</td>
                      <td className="py-2.5 px-4 text-slate-500">{item.category || '-'}</td>
                      <td className="py-2.5 px-4 text-center font-mono">{item.sellingUnit || 'piece'}</td>
                      <td className="py-2.5 px-4 text-center font-bold font-mono">
                        {isSrv ? (
                          <span className="text-blue-600">N/A</span>
                        ) : item.stockQuantity < 0 ? (
                          <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded font-extrabold text-xs inline-flex items-center space-x-1" title="Negative stock level (sold on zero stock)">
                            <span>{item.stockQuantity}</span>
                            <span className="text-[9px] font-sans font-normal uppercase">Overdraft</span>
                          </span>
                        ) : item.stockQuantity === 0 ? (
                          <span className="text-rose-500 font-bold">0</span>
                        ) : (
                          <span className={item.stockQuantity <= item.minStockThreshold ? 'text-amber-600 font-bold' : 'text-slate-800 dark:text-slate-200'}>
                            {item.stockQuantity}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-500">{formatAED(item.purchasePrice)}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600">{formatAED(item.salePrice)}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">{formatAED(val)}</td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => openLabelPrintModal(item)}
                            className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer shadow-2xs"
                            title="Print Barcode Label"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete ${item.name}?`)) onDeleteItem(item.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: SCANNER VIEW */}
      {activeSubTab === 'SCANNER' && (
        <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-[#4F46E5]" />
                <span>POS Laser & Barcode Scanner</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Scan product barcodes or SKUs to execute instant stock movements</p>
            </div>

            <button
              onClick={() => setIsCameraActive(!isCameraActive)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 cursor-pointer ${
                isCameraActive ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>{isCameraActive ? 'Stop Camera' : 'Start Camera Feed'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input / Scanner Controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Scan / Type SKU or Barcode:
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="e.g. PRD-1001 or 629110001234"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        triggerScanValue(barcodeInput);
                      }
                    }}
                    className="flex-1 border border-[#E2E8F0] dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                  />
                  <button
                    onClick={() => triggerScanValue(barcodeInput)}
                    className="px-4 py-2 bg-[#0F172A] text-white font-bold text-xs rounded-lg cursor-pointer"
                  >
                    Lookup
                  </button>
                </div>
              </div>

              {scanMessage && (
                <div className={`p-3 rounded-lg text-xs font-bold ${
                  scanMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {scanMessage.text}
                </div>
              )}

              {/* Unregistered Barcode Auto-Add Prompt */}
              {unregisteredBarcode && !scannerMatchedItem && (
                <div className="p-4 border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl space-y-3">
                  <div className="flex items-center space-x-2">
                    <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <h4 className="font-extrabold text-xs text-indigo-950 dark:text-indigo-200">New Unregistered Barcode Detected</h4>
                      <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400">Code: <strong className="text-indigo-700 dark:text-indigo-300 font-bold">{unregisteredBarcode}</strong></p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      openAddModal();
                      setBarcode(unregisteredBarcode);
                      setUnregisteredBarcode(null);
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase rounded-lg flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Auto-Create & Add Product with Barcode ({unregisteredBarcode})</span>
                  </button>
                </div>
              )}
              {scannerMatchedItem && (
                <form onSubmit={handleScannerMovementSubmit} className="border border-indigo-200 dark:border-slate-800 bg-indigo-50/30 dark:bg-slate-800/40 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-indigo-600">MATCHED ITEM</span>
                      <h4 className="font-bold text-sm text-[#0F172A] dark:text-white">{scannerMatchedItem.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">Current Stock: {scannerMatchedItem.stockQuantity} {scannerMatchedItem.sellingUnit || 'units'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Action Mode</label>
                      <select
                        value={scannerAction}
                        onChange={(e) => setScannerAction(e.target.value as 'IN' | 'OUT')}
                        className="w-full border border-slate-300 rounded px-2 py-1 bg-white dark:bg-slate-900"
                      >
                        <option value="IN">Stock IN (+)</option>
                        <option value="OUT">Stock OUT (-)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={scannerQty}
                        onChange={(e) => setScannerQty(Number(e.target.value))}
                        className="w-full border border-slate-300 rounded px-2 py-1 bg-white dark:bg-slate-900 font-bold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase rounded-lg cursor-pointer"
                  >
                    Execute Movement
                  </button>
                </form>
              )}
            </div>

            {/* Video Viewfinder */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-900 flex flex-col items-center justify-center min-h-[250px] relative overflow-hidden">
              {isCameraActive ? (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="text-center text-slate-500 space-y-2">
                  <QrCode className="w-12 h-12 mx-auto text-slate-600" />
                  <p className="text-xs">Camera scanner feed standby. Click "Start Camera Feed" to enable optical barcode reading.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: LOGS VIEW */}
      {activeSubTab === 'LOGS' && (
        <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/80 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search transaction logs..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full max-w-md text-xs px-3 py-1.5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-lg"
              />
            </div>

            <button
              onClick={clearLogsLedger}
              className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg cursor-pointer"
            >
              Clear Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Item Details</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-center">Balance Shift</th>
                  <th className="py-3 px-4">Ref No</th>
                  <th className="py-3 px-4">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-mono text-slate-500">{log.date}</td>
                    <td className="py-2.5 px-4">
                      <div className="font-bold text-[#0F172A] dark:text-white">{log.itemName}</div>
                      <div className="text-[9px] font-mono text-slate-400">SKU: {log.sku}</div>
                    </td>
                    <td className="py-2.5 px-4 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[9px] ${
                        log.type === 'IN' ? 'bg-emerald-100 text-emerald-800' : log.type === 'OUT' ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center font-bold font-mono">{log.qty}</td>
                    <td className="py-2.5 px-4 text-center font-mono text-slate-500">
                      {log.prevQty} &rarr; <span className="font-bold text-slate-800 dark:text-white">{log.newQty}</span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-400">{log.refNo}</td>
                    <td className="py-2.5 px-4 text-slate-500">{log.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 7: MULTI-BRANCH & WAREHOUSE TRANSFER DATA VIEW */}
      {activeSubTab === 'TRANSFER' && (
        !company?.multiBranchEnabled ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-xs max-w-2xl mx-auto my-8 animate-fade-in">
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/60 rounded-full flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
              <Boxes className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Multi-Branch System is Disabled</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Multi-Branch and Inter-Warehouse stock transfers are currently turned off for <strong className="text-indigo-600 dark:text-indigo-400">{company?.name}</strong>. Single location entities do not require inter-branch logistics. You can enable the Multi-Branch system anytime within <strong>Corporate Settings &rarr; Multi-Branch & Locations</strong>.
            </p>
          </div>
        ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 border border-indigo-900/50 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/30 uppercase tracking-widest">
                    GCC Multi-Branch Logistics
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    Batch Check/Uncheck Enabled
                  </span>
                </div>
                <h3 className="text-xl font-black text-white tracking-tight font-sans">
                  Inter-Branch & Multi-Warehouse Stock Transfer
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Transfer inventory seamlessly between central fulfillment centers, regional depots, and retail branches. Use checkboxes to select items, specify transfer quantities, and issue official dispatch vouchers.
                </p>
              </div>

              {activeTransferVoucher && (
                <button
                  onClick={() => setActiveTransferVoucher(null)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center space-x-1.5 cursor-pointer shrink-0"
                >
                  <Printer className="w-4 h-4" />
                  <span>View Latest Voucher ({activeTransferVoucher.refNo})</span>
                </button>
              )}
            </div>

            {/* Warehouse Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">
                  Source Warehouse / Branch *
                </label>
                <select
                  value={sourceWarehouse}
                  onChange={(e) => setSourceWarehouse(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-xs font-medium cursor-pointer focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="W01 - Dubai Central Logistics Hub">W01 - Dubai Central Logistics Hub</option>
                  <option value="W02 - Abu Dhabi Branch Depot">W02 - Abu Dhabi Branch Depot</option>
                  <option value="W03 - Sharjah Industrial Distribution Hub">W03 - Sharjah Industrial Distribution Hub</option>
                  <option value="W04 - Jebel Ali Free Zone Logistics Depot">W04 - Jebel Ali Free Zone Logistics Depot</option>
                  <option value="W05 - Ras Al Khaimah Retail Outlet">W05 - Ras Al Khaimah Retail Outlet</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">
                  Destination Warehouse / Branch *
                </label>
                <select
                  value={targetWarehouse}
                  onChange={(e) => setTargetWarehouse(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-xs font-medium cursor-pointer focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="W02 - Abu Dhabi Branch Depot">W02 - Abu Dhabi Branch Depot</option>
                  <option value="W01 - Dubai Central Logistics Hub">W01 - Dubai Central Logistics Hub</option>
                  <option value="W03 - Sharjah Industrial Distribution Hub">W03 - Sharjah Industrial Distribution Hub</option>
                  <option value="W04 - Jebel Ali Free Zone Logistics Depot">W04 - Jebel Ali Free Zone Logistics Depot</option>
                  <option value="W05 - Ras Al Khaimah Retail Outlet">W05 - Ras Al Khaimah Retail Outlet</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">
                  Transfer Ref No.
                </label>
                <input
                  type="text"
                  value={transferRefNo}
                  onChange={(e) => setTransferRefNo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-indigo-300 font-mono font-bold rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">
                  Transfer Note / Purpose
                </label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="e.g., Stock rebalancing"
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Transfer Item Selection Table with Checkbox */}
          <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm space-y-4">
            {/* Toolbar & Summary */}
            <div className="p-4 bg-[#F8FAFC] dark:bg-slate-900/80 border-b border-[#E2E8F0] dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search stock items to transfer..."
                    value={transferSearch}
                    onChange={(e) => setTransferSearch(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleToggleCheckAllTransfer}
                  className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold rounded-xl transition-all cursor-pointer hover:bg-indigo-100 flex items-center space-x-1.5 shrink-0"
                >
                  <input
                    type="checkbox"
                    checked={isAllTransferChecked}
                    onChange={() => {}} // Handled by parent button click
                    className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer pointer-events-none"
                  />
                  <span>{isAllTransferChecked ? 'Uncheck All Items' : 'Check All Items'}</span>
                </button>
              </div>

              {/* Transfer Metrics Badge */}
              <div className="flex items-center space-x-3 text-xs font-mono bg-white dark:bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
                <div>
                  <span className="text-slate-400">Selected: </span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{checkedTransferItemIds.length} items</span>
                </div>
                <div className="border-l border-slate-200 dark:border-slate-800 pl-3">
                  <span className="text-slate-400">Total Units: </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {checkedTransferItemIds.reduce((sum, id) => sum + (transferQuantities[id] || 1), 0)} pcs
                  </span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={isAllTransferChecked}
                        onChange={handleToggleCheckAllTransfer}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        title="Check or Uncheck All Items"
                      />
                    </th>
                    <th className="py-3 px-4">Product Name & SKU</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Available Stock ({sourceWarehouse.split('-')[0].trim()})</th>
                    <th className="py-3 px-4 text-center w-40">Qty to Transfer</th>
                    <th className="py-3 px-4 text-right">Unit Value (AED)</th>
                    <th className="py-3 px-4 text-right">Subtotal (AED)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transferAvailableItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-mono text-xs">
                        No in-stock inventory items found matching search.
                      </td>
                    </tr>
                  ) : (
                    transferAvailableItems.map(item => {
                      const isChecked = checkedTransferItemIds.includes(item.id);
                      const qty = transferQuantities[item.id] || 1;
                      const unitVal = item.salePrice || item.purchasePrice || 0;
                      const subtotal = unitVal * qty;

                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            isChecked
                              ? 'bg-indigo-50/50 dark:bg-indigo-950/20 font-medium'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleCheckTransferItem(item.id)}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-[#0F172A] dark:text-white flex items-center space-x-2">
                              <span>{item.name}</span>
                              {isChecked && (
                                <span className="bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 text-[9px] font-mono px-1.5 py-0.5 rounded font-bold">
                                  Checked
                                </span>
                              )}
                            </div>
                            <div className="text-[9px] font-mono text-slate-400">SKU: {item.sku}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded text-[10px]">
                              {item.category || 'General'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                            {item.stockQuantity} {item.sellingUnit || 'pcs'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min={1}
                              max={item.stockQuantity}
                              disabled={!isChecked}
                              value={qty}
                              onChange={(e) => handleTransferQtyChange(item.id, parseInt(e.target.value) || 1)}
                              className={`w-28 text-center text-xs px-2 py-1.5 font-mono font-bold border rounded-xl transition-all ${
                                isChecked
                                  ? 'bg-white dark:bg-slate-900 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 focus:ring-1 focus:ring-indigo-500'
                                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed'
                              }`}
                            />
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                            AED {unitVal.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {isChecked ? `AED ${subtotal.toFixed(2)}` : '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Execution Bar */}
            <div className="p-4 bg-[#F8FAFC] dark:bg-slate-900/80 border-t border-[#E2E8F0] dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                <span>Items Checked for Dispatch: </span>
                <strong className="text-indigo-600 dark:text-indigo-400 font-mono">
                  {checkedTransferItemIds.length} of {transferAvailableItems.length}
                </strong>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setCheckedTransferItemIds([])}
                  disabled={checkedTransferItemIds.length === 0}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Uncheck All
                </button>

                <button
                  type="button"
                  onClick={handleProcessStockTransfer}
                  disabled={checkedTransferItemIds.length === 0}
                  className="flex-1 sm:flex-initial px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Boxes className="w-4 h-4" />
                  <span>Execute Stock Transfer ({checkedTransferItemIds.length} Items)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        )
      )}

      {/* STOCK TRANSFER VOUCHER MODAL */}
      {activeTransferVoucher && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto no-print">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-auto space-y-0">
            {/* Modal Top Bar */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-indigo-400" />
                <h3 className="text-xs font-black uppercase tracking-widest font-mono text-white">
                  Official Goods Dispatch & Transfer Voucher
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => triggerPrint('printable-transfer-voucher')}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Voucher</span>
                </button>
                <button
                  onClick={() => setActiveTransferVoucher(null)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Voucher Content */}
            <div id="printable-transfer-voucher" className="p-6 space-y-6 text-slate-900 dark:text-slate-100 font-sans">
              <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {company.name}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">TRN: {company.trn || '100293847500003'}</p>
                  <p className="text-xs text-slate-500">{company.address}, UAE</p>
                </div>
                <div className="text-right font-mono">
                  <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-xs font-black rounded-lg uppercase">
                    Voucher #{activeTransferVoucher.refNo}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">Date: {activeTransferVoucher.date}</p>
                </div>
              </div>

              {/* Warehouse Route Card */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Source Location (FROM)</span>
                  <p className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{activeTransferVoucher.source}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Destination Location (TO)</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{activeTransferVoucher.target}</p>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <table className="w-full text-xs text-left border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 text-center">Qty Dispatched</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Total Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {activeTransferVoucher.items.map((item: any) => (
                      <tr key={item.id}>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{item.sku}</td>
                        <td className="py-2.5 px-3 font-bold">{item.name}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {item.qty} {item.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">AED {item.unitValue.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">AED {item.totalValue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-800/60 font-mono font-bold">
                    <tr>
                      <td colSpan={2} className="py-2.5 px-3 text-right uppercase">Total Transfer Summary:</td>
                      <td className="py-2.5 px-3 text-center text-indigo-600 dark:text-indigo-400">
                        {activeTransferVoucher.totalUnits} Units
                      </td>
                      <td colSpan={2} className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">
                        AED {activeTransferVoucher.totalValue.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Purpose & Signatures */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <p className="text-xs text-slate-500">
                  <strong>Notes / Purpose:</strong> {activeTransferVoucher.note}
                </p>

                <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs text-slate-500">
                  <div className="border-t border-slate-300 dark:border-slate-700 pt-2 font-mono">
                    Dispatch Supervisor Signature & Stamp
                  </div>
                  <div className="border-t border-slate-300 dark:border-slate-700 pt-2 font-mono">
                    Receiving Warehouse Manager Signature
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* SUB-TAB 8: INVENTORY VALUATION, HEALTH & SMART RESTOCK ANALYTICS */}
      {activeSubTab === 'ANALYTICS' && (() => {
        const physicalItems = companyItems.filter(i => !isServiceItem(i));
        const totalStockUnits = physicalItems.reduce((acc, i) => acc + Math.max(0, i.stockQuantity), 0);
        const totalCostValuation = physicalItems.reduce((acc, i) => acc + (i.purchasePrice * Math.max(0, i.stockQuantity)), 0);
        const totalRetailValuation = physicalItems.reduce((acc, i) => acc + (i.salePrice * Math.max(0, i.stockQuantity)), 0);
        const unrealizedProfit = totalRetailValuation - totalCostValuation;
        const overallMarginPercent = totalRetailValuation > 0 ? ((unrealizedProfit / totalRetailValuation) * 100) : 0;
        
        const lowStockItems = physicalItems.filter(i => i.stockQuantity > 0 && i.stockQuantity <= i.minStockThreshold);
        const outOfStockItems = physicalItems.filter(i => i.stockQuantity === 0);
        const overdraftItems = physicalItems.filter(i => i.stockQuantity < 0);
        const healthyStockItems = physicalItems.filter(i => i.stockQuantity > i.minStockThreshold);

        // Reorder list
        const reorderList = physicalItems.filter(i => i.stockQuantity <= i.minStockThreshold);
        const totalReorderUnits = reorderList.reduce((sum, i) => {
          const needed = Math.max(1, (i.minStockThreshold * 2) - Math.max(0, i.stockQuantity));
          return sum + needed;
        }, 0);
        const totalReorderEstimatedCost = reorderList.reduce((sum, i) => {
          const needed = Math.max(1, (i.minStockThreshold * 2) - Math.max(0, i.stockQuantity));
          return sum + (needed * i.purchasePrice);
        }, 0);

        // Bulk Adjust target items
        const targetBulkItems = bulkTargetCategory === 'ALL' 
          ? physicalItems 
          : physicalItems.filter(i => (i.category || 'Uncategorized') === bulkTargetCategory);

        const calculateAdjustedPrice = (currentPrice: number) => {
          if (bulkAdjustType === 'PERCENT_UP') {
            return Math.round((currentPrice * (1 + (bulkAdjustValue / 100))) * 100) / 100;
          } else if (bulkAdjustType === 'PERCENT_DOWN') {
            return Math.max(0, Math.round((currentPrice * (1 - (bulkAdjustValue / 100))) * 100) / 100);
          } else if (bulkAdjustType === 'FIXED_UP') {
            return Math.round((currentPrice + bulkAdjustValue) * 100) / 100;
          } else {
            return Math.max(0, Math.round((currentPrice - bulkAdjustValue) * 100) / 100);
          }
        };

        const handleApplyBulkAdjustment = () => {
          if (targetBulkItems.length === 0) {
            alert('No products found matching the selected category.');
            return;
          }
          const confirmMsg = `Are you sure you want to update ${bulkPriceType === 'salePrice' ? 'Selling Prices' : 'Purchase Costs'} for ${targetBulkItems.length} product(s) by ${bulkAdjustType.includes('PERCENT') ? `${bulkAdjustValue}%` : `AED ${bulkAdjustValue}`}?`;
          if (!confirm(confirmMsg)) return;

          let count = 0;
          targetBulkItems.forEach(item => {
            const currentVal = bulkPriceType === 'salePrice' ? item.salePrice : item.purchasePrice;
            const updatedVal = calculateAdjustedPrice(currentVal);
            onUpdateItem({
              ...item,
              [bulkPriceType]: updatedVal
            });
            count++;
          });

          setBulkAdjustSuccess(`Successfully updated ${count} products in the catalog!`);
          setTimeout(() => setBulkAdjustSuccess(null), 5000);
        };

        const handleCopyReorderSheet = () => {
          if (reorderList.length === 0) return;
          let text = `PURCHASE REQUISITION & RE-ORDER SHEET\nCompany: ${company.name}\nDate: ${new Date().toLocaleDateString('en-GB')}\nTotal Items: ${reorderList.length} | Est. Cost: AED ${totalReorderEstimatedCost.toFixed(2)}\n\n`;
          text += `SKU | Item Name | Current Stock | Min Threshold | Suggested Order Qty | Unit Cost (AED) | Total Cost (AED)\n`;
          text += `----------------------------------------------------------------------------------------------------\n`;
          reorderList.forEach(item => {
            const needed = Math.max(1, (item.minStockThreshold * 2) - Math.max(0, item.stockQuantity));
            const cost = needed * item.purchasePrice;
            text += `${item.sku} | ${item.name} | ${item.stockQuantity} ${item.sellingUnit || 'pcs'} | ${item.minStockThreshold} | ${needed} ${item.sellingUnit || 'pcs'} | AED ${item.purchasePrice.toFixed(2)} | AED ${cost.toFixed(2)}\n`;
          });
          navigator.clipboard.writeText(text);
          setCopiedRequisition(true);
          setTimeout(() => setCopiedRequisition(false), 3000);
        };

        return (
          <div className="space-y-6 animate-fade-in">
            {/* Top Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Stock Cost Valuation</span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                    <Coins className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                  AED {totalCostValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  Across {totalStockUnits.toLocaleString()} physical units on hand
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Potential Retail Revenue</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                  AED {totalRetailValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 font-medium">
                  Estimated full retail turnover value
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Unrealized Gross Margin</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                    <Calculator className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-black font-mono tracking-tight text-blue-600 dark:text-blue-400">
                  AED {unrealizedProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs font-bold font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                    {overallMarginPercent.toFixed(1)}% Gross Margin
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Catalog Health State</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                    {healthyStockItems.length} Healthy
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
                    {lowStockItems.length} Low
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400">
                    {outOfStockItems.length} Out
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 font-medium">
                  {overdraftItems.length > 0 ? `⚠️ ${overdraftItems.length} Overdraft negative stocks` : 'All physical stock levels aligned'}
                </p>
              </div>
            </div>

            {/* Smart Restock & Auto-Purchase Requisition Generator */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-5 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono font-bold text-[10px] uppercase rounded-md tracking-wider">
                      Procurement Assistant
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {reorderList.length} Products Requiring Restock
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mt-1 flex items-center space-x-2">
                    <Boxes className="w-5 h-5 text-amber-600" />
                    <span>Smart Restock & Auto Purchase Requisition Engine</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Automatically computes replenishment quantities based on defined minimum alert thresholds and standard buffer stock levels.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleCopyReorderSheet}
                    disabled={reorderList.length === 0}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Copy full purchase requisition table to clipboard"
                  >
                    {copiedRequisition ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedRequisition ? 'Copied to Clipboard!' : 'Copy PO Sheet'}</span>
                  </button>

                  <button
                    onClick={() => triggerPrint('printable-reorder-requisition')}
                    disabled={reorderList.length === 0}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Requisition Slip</span>
                  </button>
                </div>
              </div>

              {/* Requisition Table */}
              <div id="printable-reorder-requisition" className="p-4 overflow-x-auto">
                {reorderList.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Stock Levels are Healthy</p>
                    <p className="text-xs text-slate-500">No catalog items have fallen below their minimum re-order thresholds.</p>
                  </div>
                ) : (
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-3 px-4">SKU / Code</th>
                        <th className="py-3 px-4">Product Name</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4 text-center">Current Stock</th>
                        <th className="py-3 px-4 text-center">Min Threshold</th>
                        <th className="py-3 px-4 text-center text-amber-600">Suggested Order Qty</th>
                        <th className="py-3 px-4 text-right">Unit Cost</th>
                        <th className="py-3 px-4 text-right">Est. Cost (AED)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {reorderList.map(item => {
                        const needed = Math.max(1, (item.minStockThreshold * 2) - Math.max(0, item.stockQuantity));
                        const estCost = needed * item.purchasePrice;
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">{item.sku}</td>
                            <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">{item.name}</td>
                            <td className="py-2.5 px-4 text-slate-500">{item.category || '-'}</td>
                            <td className="py-2.5 px-4 text-center font-mono font-bold">
                              <span className={item.stockQuantity <= 0 ? 'text-rose-600' : 'text-amber-600'}>
                                {item.stockQuantity} {item.sellingUnit || 'pcs'}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono text-slate-500">
                              {item.minStockThreshold} {item.sellingUnit || 'pcs'}
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/30">
                              + {needed} {item.sellingUnit || 'pcs'}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                              AED {item.purchasePrice.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                              AED {estCost.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-800/70 font-mono font-bold border-t border-slate-200 dark:border-slate-800">
                      <tr>
                        <td colSpan={5} className="py-3 px-4 uppercase text-slate-600 dark:text-slate-400">
                          Total Procurement Requisition Summary:
                        </td>
                        <td className="py-3 px-4 text-center text-amber-600 dark:text-amber-400 font-black">
                          {totalReorderUnits} Units
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400">Total:</td>
                        <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 text-sm font-black">
                          AED {totalReorderEstimatedCost.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </div>

            {/* Interactive Bulk Price & Margin Adjuster */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-mono font-bold text-[10px] uppercase rounded-md tracking-wider">
                    Catalog Price Automation
                  </span>
                  {bulkAdjustSuccess && (
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs rounded-md animate-fade-in">
                      ✓ {bulkAdjustSuccess}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-1 flex items-center space-x-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  <span>Bulk Price & Margin Adjuster Tool</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Apply instant percentage markup, seasonal discounts, or flat AED adjustments across categories with interactive live preview.
                </p>
              </div>

              {/* Adjuster Configuration Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Target Category
                  </label>
                  <select
                    value={bulkTargetCategory}
                    onChange={(e) => setBulkTargetCategory(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer"
                  >
                    <option value="ALL">Entire Catalog (All Categories)</option>
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Price Type to Modify
                  </label>
                  <select
                    value={bulkPriceType}
                    onChange={(e) => setBulkPriceType(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer"
                  >
                    <option value="salePrice">Selling Price (Customer Rate)</option>
                    <option value="purchasePrice">Cost Price (Purchase Cost)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Adjustment Formula
                  </label>
                  <select
                    value={bulkAdjustType}
                    onChange={(e) => setBulkAdjustType(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer"
                  >
                    <option value="PERCENT_UP">+ Percentage Markup (+ %)</option>
                    <option value="PERCENT_DOWN">- Percentage Discount (- %)</option>
                    <option value="FIXED_UP">+ Flat AED Surcharge (+ AED)</option>
                    <option value="FIXED_DOWN">- Flat AED Reduction (- AED)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Adjustment Value ({bulkAdjustType.includes('PERCENT') ? '%' : 'AED'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={bulkAdjustValue}
                    onChange={(e) => setBulkAdjustValue(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Live Preview Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                    Live Impact Preview ({targetBulkItems.slice(0, 5).length} of {targetBulkItems.length} Matching Products)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Formula: {bulkAdjustType.includes('PERCENT') ? `${bulkAdjustType === 'PERCENT_UP' ? '+' : '-'}${bulkAdjustValue}%` : `${bulkAdjustType === 'FIXED_UP' ? '+' : '-'}AED ${bulkAdjustValue}`}
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-3 text-right">Current {bulkPriceType === 'salePrice' ? 'Selling Price' : 'Cost'}</th>
                        <th className="py-2.5 px-3 text-right text-indigo-600 dark:text-indigo-400">Projected New Price</th>
                        <th className="py-2.5 px-3 text-right">Shift (AED)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {targetBulkItems.slice(0, 6).map(item => {
                        const current = bulkPriceType === 'salePrice' ? item.salePrice : item.purchasePrice;
                        const projected = calculateAdjustedPrice(current);
                        const diff = projected - current;
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-mono font-bold text-slate-600 dark:text-slate-400">{item.sku}</td>
                            <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-500">AED {current.toFixed(2)}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              AED {projected.toFixed(2)}
                            </td>
                            <td className={`py-2 px-3 text-right font-mono font-bold ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {diff >= 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-slate-500">
                  Clicking apply will immediately commit updated prices for all {targetBulkItems.length} matching products.
                </p>
                <button
                  type="button"
                  onClick={handleApplyBulkAdjustment}
                  disabled={targetBulkItems.length === 0}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>Commit Price Adjustment ({targetBulkItems.length} Items)</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Stock Adjustment Modal */}
      {isStockAdjustmentOpen && adjustingItem && (
        <div className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-[#E2E8F0] dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-[#0F172A] dark:text-white uppercase tracking-wider">
                Quick Stock Adjustment: {adjustingItem.name}
              </h3>
              <button onClick={() => setIsStockAdjustmentOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustmentSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2 text-center">
                <button
                  type="button"
                  onClick={() => setAdjustMode('IN')}
                  className={`py-2 rounded-lg font-bold border ${adjustMode === 'IN' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-300 text-slate-700'}`}
                >
                  + Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustMode('OUT')}
                  className={`py-2 rounded-lg font-bold border ${adjustMode === 'OUT' ? 'bg-rose-600 text-white border-rose-600' : 'border-slate-300 text-slate-700'}`}
                >
                  - Issue Stock
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustMode('OVERRIDE')}
                  className={`py-2 rounded-lg font-bold border ${adjustMode === 'OVERRIDE' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-700'}`}
                >
                  Override Qty
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Quantity</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustmentQty}
                  onChange={(e) => setAdjustmentQty(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold font-mono text-sm bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Reference No / Invoice</label>
                <input
                  type="text"
                  placeholder="e.g. GRN-2026-90"
                  value={adjustmentRef}
                  onChange={(e) => setAdjustmentRef(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Reason / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Physical inventory count correction"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white dark:bg-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsStockAdjustmentOpen(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0F172A] text-white rounded-lg text-xs font-bold uppercase"
                >
                  Apply Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal for Product Form */}
      <BarcodeScannerModal
        isOpen={isFormScannerOpen}
        onClose={() => setIsFormScannerOpen(false)}
        onScan={(scanned) => {
          setBarcode(scanned);
          setIsFormScannerOpen(false);
        }}
        title="Scan Product Barcode"
        subtitle="Point camera at product barcode to automatically populate barcode field"
      />

      {/* Batch Barcode Label Printer Modal */}
      <BarcodeLabelModal
        isOpen={isBarcodeLabelModalOpen}
        onClose={() => setIsBarcodeLabelModalOpen(false)}
        company={company}
        inventory={companyItems}
        initialSelectedItem={barcodeModalSelectedItem}
      />

      {/* Lightbox / Full Product Picture Viewer Modal */}
      {viewerImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print" onClick={() => setViewerImage(null)}>
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-2xl p-3 border border-slate-700 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-white">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Product Image Preview</span>
              <button
                onClick={() => setViewerImage(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img src={viewerImage} alt="Full Product" className="w-full h-auto max-h-[75vh] object-contain rounded-xl mx-auto bg-black/40" />
          </div>
        </div>
      )}
    </div>
  );
}
