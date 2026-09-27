import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  Car, 
  Bike, 
  Search, 
  Plus, 
  Barcode as BarcodeIcon, 
  Printer, 
  Filter, 
  Tag, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  RefreshCw, 
  FileText, 
  SlidersHorizontal, 
  X, 
  ExternalLink,
  ChevronRight,
  Package,
  ShoppingBag,
  Zap,
  ArrowUpDown
} from 'lucide-react';
import { InventoryItem, Company } from '../types';
import BarcodeLabelModal from './BarcodeLabelModal';
import { BarcodeScannerModal, playBeepSound } from './BarcodeScannerModal';

interface SparePartsManagerProps {
  company: Company;
  inventory: InventoryItem[];
  onSaveItem: (item: Partial<InventoryItem>) => void;
  onDeleteItem: (id: string) => void;
  onBulkAddItems?: (items: Partial<InventoryItem>[]) => void;
  onCreateInvoiceWithItem?: (item: InventoryItem) => void;
  onOpenQuickPOSWithItem?: (item: InventoryItem) => void;
}

// Car & Bike Makes & Selection
const CAR_MAKES = ['Toyota', 'Honda', 'Nissan', 'Hyundai', 'Suzuki', 'Kia', 'Ford', 'Mitsubishi', 'BMW', 'Mercedes-Benz'];
const BIKE_MAKES = ['Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'United', 'Road Prince', 'Benelli', 'Bajaj'];

const PART_CATEGORIES = [
  'Engine & Internal Parts',
  'Brake System & Pads',
  'Suspension & Steering',
  'Clutch & Transmission',
  'Electrical, Sensors & Battery',
  'Body Panels, Mirrors & Lights',
  'Filters & Lubricants',
  'Cooling System & Radiators',
  'Exhaust System & Mufflers',
  'Tires, Tubes & Rims'
];

// 10 Real Pre-Loaded Demo Car & Bike Spare Parts
const INITIAL_DEMO_SPARE_PARTS: Partial<InventoryItem>[] = [
  {
    name: 'Front Ceramic Brake Pad Set',
    sku: 'SP-TY-04465',
    partNumber: '04465-02220',
    oemNumber: '04465-YZZE1',
    vehicleType: 'car',
    vehicleMake: 'Toyota',
    vehicleModel: 'Corolla / Altis / Yaris',
    modelYearFrom: '2014',
    modelYearTo: '2023',
    engineType: '1.6L / 1.8L VVTi (2ZR-FE)',
    partCategory: 'Brake System & Pads',
    brand: 'Toyota OEM / Akebono',
    shelfLocation: 'Rack A-01 / Bin 04',
    condition: 'new_oem',
    warranty: '6 Months Replacement',
    purchasePrice: 95.00,
    salePrice: 155.00,
    stockQuantity: 24,
    minStockThreshold: 5,
    barcode: '6291048044652',
    barcodeType: 'EAN-13',
    compatibilityNotes: 'Fits all Corolla 1.6/1.8 from 2014 to 2023. High heat dissipation ceramic formula.'
  },
  {
    name: 'High Performance Engine Oil Filter',
    sku: 'SP-TY-90915',
    partNumber: '90915-YZZD2',
    oemNumber: '90915-10003',
    vehicleType: 'car',
    vehicleMake: 'Toyota',
    vehicleModel: 'Camry / RAV4 / Corolla / Hilux',
    modelYearFrom: '2012',
    modelYearTo: '2024',
    engineType: '2.0L / 2.5L Dual VVT-i',
    partCategory: 'Filters & Lubricants',
    brand: 'Denso / Toyota Genuine',
    shelfLocation: 'Rack A-02 / Bin 12',
    condition: 'new_oem',
    warranty: 'Testing Warranty',
    purchasePrice: 16.00,
    salePrice: 32.00,
    stockQuantity: 48,
    minStockThreshold: 10,
    barcode: '6291048909153',
    barcodeType: 'EAN-13',
    compatibilityNotes: 'Anti-drainback silicone valve. Factory approved for 10,000 KM synthetic oil interval.'
  },
  {
    name: 'Laser Iridium Spark Plugs Set (4 Pcs)',
    sku: 'SP-NGK-IK20',
    partNumber: 'IK20TT-4704',
    oemNumber: '90919-01210',
    vehicleType: 'car',
    vehicleMake: 'Honda / Toyota / Nissan',
    vehicleModel: 'Civic / Corolla / Sunny / City',
    modelYearFrom: '2015',
    modelYearTo: '2024',
    engineType: '1.5L / 1.8L i-VTEC & VVTi',
    partCategory: 'Electrical, Sensors & Battery',
    brand: 'NGK / Denso Japan',
    shelfLocation: 'Rack B-01 / Bin 02',
    condition: 'new_oem',
    warranty: '1 Year / 40,000 KM',
    purchasePrice: 85.00,
    salePrice: 145.00,
    stockQuantity: 18,
    minStockThreshold: 4,
    barcode: '6291048470411',
    barcodeType: 'EAN-13',
    compatibilityNotes: '0.4mm Iridium tip with platinum ground disc for maximum ignition power.'
  },
  {
    name: 'Front Excel-G Gas Shock Absorber Pair',
    sku: 'SP-KYB-333338',
    partNumber: '333338-KYB',
    oemNumber: '48510-09P30',
    vehicleType: 'car',
    vehicleMake: 'Honda',
    vehicleModel: 'Civic X / Civic Rebirth',
    modelYearFrom: '2016',
    modelYearTo: '2022',
    engineType: '1.5L Turbo / 1.8L',
    partCategory: 'Suspension & Steering',
    brand: 'KYB Japan',
    shelfLocation: 'Rack C-03 / Heavy Shelf 01',
    condition: 'new_oem',
    warranty: '1 Year Full Warranty',
    purchasePrice: 280.00,
    salePrice: 420.00,
    stockQuantity: 8,
    minStockThreshold: 2,
    barcode: '6291048333338',
    barcodeType: 'EAN-13',
    compatibilityNotes: 'Nitrogen gas pressurized twin-tube system for GCC high temperature endurance.'
  },
  {
    name: 'Clutch Disc & Pressure Plate Kit',
    sku: 'SP-EXD-TYD035',
    partNumber: 'TYD035U-TYK02',
    oemNumber: '31250-12390',
    vehicleType: 'car',
    vehicleMake: 'Toyota',
    vehicleModel: 'Hilux / HiAce 2.5D / 2.7',
    modelYearFrom: '2010',
    modelYearTo: '2021',
    engineType: '2KD-FTV 2.5 Turbo Diesel / 2TR',
    partCategory: 'Clutch & Transmission',
    brand: 'Exedy Daikin Japan',
    shelfLocation: 'Rack D-02 / Bin 01',
    condition: 'aftermarket',
    warranty: '6 Months Warranty',
    purchasePrice: 340.00,
    salePrice: 495.00,
    stockQuantity: 6,
    minStockThreshold: 2,
    barcode: '6291048035022',
    barcodeType: 'EAN-13',
    compatibilityNotes: 'Heavy-duty commercial friction disc. Includes release bearing.'
  },
  {
    name: 'Motorcycle Clutch Plate Set (4 Pcs)',
    sku: 'SP-BK-22201',
    partNumber: '22201-166-000',
    oemNumber: 'CD70-CP-04',
    vehicleType: 'bike',
    vehicleMake: 'Honda',
    vehicleModel: 'CD 70 / CD Dream 70',
    modelYearFrom: '2005',
    modelYearTo: '2024',
    engineType: '70cc 4-Stroke Single OHC',
    partCategory: 'Clutch & Transmission',
    brand: 'Honda Genuine / F.C.C.',
    shelfLocation: 'Rack M-01 / Bin 12',
    condition: 'new_oem',
    warranty: 'Testing Warranty',
    purchasePrice: 22.00,
    salePrice: 38.00,
    stockQuantity: 60,
    minStockThreshold: 15,
    barcode: '6291048222018',
    barcodeType: 'EAN-13',
    compatibilityNotes: 'Special organic cork friction compound for smooth gear shifts without slippage.'
  },
  {
    name: 'Standard Cylinder & Piston Kit 56.5mm',
    sku: 'SP-BK-12100',
    partNumber: '12100-087-000',
    oemNumber: 'CG125-PK-01',
    vehicleType: 'bike',
    vehicleMake: 'Honda',
    vehicleModel: 'CG 125 / CG 125 Special / Deluxe',
    modelYearFrom: '2012',
    modelYearTo: '2024',
    engineType: '125cc OHV Euro 2',
    partCategory: 'Engine & Internal Parts',
    brand: 'Daido / Honda Genuine',
    shelfLocation: 'Rack M-02 / Bin 06',
    condition: 'new_oem',
    warranty: '3 Months Warranty',
    purchasePrice: 110.00,
    salePrice: 180.00,
    stockQuantity: 12,
    minStockThreshold: 3,
    barcode: '6291048121001',
    barcodeType: 'EAN-13',
    compatibilityNotes: 'Complete cylinder block, 56.5mm piston, piston rings, gudgeon pin & circlips.'
  },
  {
    name: 'Heavy Duty Chain & Sprocket Set 428-110L',
    sku: 'SP-BK-40530',
    partNumber: '40530-KCC-900',
    oemNumber: 'CS-428-110L',
    vehicleType: 'bike',
    vehicleMake: 'Honda / Yamaha',
    vehicleModel: 'CG 125 / YBR 125 / GS 150',
    modelYearFrom: '2015',
    modelYearTo: '2024',
    engineType: '125cc / 150cc',
    partCategory: 'Clutch & Transmission',
    brand: 'D.I.D Japan / KMC',
    shelfLocation: 'Rack M-03 / Bin 08',
    condition: 'aftermarket',
    warranty: '6 Months / 15,000 KM',
    purchasePrice: 45.00,
    salePrice: 75.00,
    stockQuantity: 28,
    minStockThreshold: 5,
    barcode: '6291048405307',
    barcodeType: 'EAN-13',
    compatibilityNotes: 'Solid bush chain with induction hardened front 15T and rear 38T sprockets.'
  },
  {
    name: 'Motorcycle Brake Shoe Assembly',
    sku: 'SP-BK-06430',
    partNumber: '06430-GBJ-J10',
    oemNumber: '43125-KGA-900',
    vehicleType: 'bike',
    vehicleMake: 'Honda',
    vehicleModel: 'CD 70 / CG 125 / Pridor 100',
    modelYearFrom: '2008',
    modelYearTo: '2024',
    engineType: '70cc / 100cc / 125cc',
    partCategory: 'Brake System & Pads',
    brand: 'Ask / Honda Genuine',
    shelfLocation: 'Rack M-04 / Bin 14',
    condition: 'new_oem',
    warranty: 'Testing Warranty',
    purchasePrice: 12.00,
    salePrice: 24.00,
    stockQuantity: 55,
    minStockThreshold: 12,
    barcode: '6291048064308',
    barcodeType: 'EAN-13',
    compatibilityNotes: 'Non-asbestos high friction brake lining with return springs included.'
  },
  {
    name: '12V 5Ah Maintenance Free AGM Gel Battery',
    sku: 'SP-BK-YTX5L',
    partNumber: 'YTX5L-BS',
    oemNumber: '12N5-3B-GEL',
    vehicleType: 'bike',
    vehicleMake: 'Suzuki / Yamaha / Honda',
    vehicleModel: 'GS 150 / YBR 125 / GR 150 / CB 150F',
    modelYearFrom: '2016',
    modelYearTo: '2024',
    engineType: '125cc / 150cc Self-Start',
    partCategory: 'Electrical, Sensors & Battery',
    brand: 'AGS / Yuasa Genuine',
    shelfLocation: 'Rack M-05 / Battery Stand',
    condition: 'new_oem',
    warranty: '6 Months Replacement Warranty',
    purchasePrice: 65.00,
    salePrice: 110.00,
    stockQuantity: 15,
    minStockThreshold: 4,
    barcode: '6291048050011',
    barcodeType: 'EAN-13',
    compatibilityNotes: 'Factory activated AGM sealed lead acid. Instant high cranking power for self-start.'
  }
];

export default function SparePartsManager({
  company,
  inventory,
  onSaveItem,
  onDeleteItem,
  onBulkAddItems,
  onCreateInvoiceWithItem,
  onOpenQuickPOSWithItem
}: SparePartsManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<'all' | 'car' | 'bike' | 'both'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [makeFilter, setMakeFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<InventoryItem> | null>(null);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [barcodeSelectedItem, setBarcodeSelectedItem] = useState<InventoryItem | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [copiedPartNo, setCopiedPartNo] = useState<string | null>(null);

  const [formVehicleType, setFormVehicleType] = useState<'car' | 'bike' | 'both' | 'heavy'>('car');
  const [formName, setFormName] = useState('');
  const [formPartNumber, setFormPartNumber] = useState('');
  const [formOemNumber, setFormOemNumber] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formVehicleMake, setFormVehicleMake] = useState('');
  const [formVehicleModel, setFormVehicleModel] = useState('');
  const [formModelYearFrom, setFormModelYearFrom] = useState('');
  const [formModelYearTo, setFormModelYearTo] = useState('');
  const [formEngineType, setFormEngineType] = useState('');
  const [formPartCategory, setFormPartCategory] = useState(PART_CATEGORIES[0]);
  const [formShelfLocation, setFormShelfLocation] = useState('');
  const [formCondition, setFormCondition] = useState<'new_oem' | 'aftermarket' | 'used_genuine' | 'reconditioned' | 'new_sealed' | 'refurbished' | 'used'>('new_oem');
  const [formWarranty, setFormWarranty] = useState('6 Months');
  const [formPurchasePrice, setFormPurchasePrice] = useState<number>(0);
  const [formSalePrice, setFormSalePrice] = useState<number>(0);
  const [formStockQuantity, setFormStockQuantity] = useState<number>(0);
  const [formMinStockThreshold, setFormMinStockThreshold] = useState<number>(2);
  const [formBarcode, setFormBarcode] = useState('');
  const [formBarcodeType, setFormBarcodeType] = useState<'EAN-13' | 'QR' | 'Code128'>('EAN-13');
  const [formCompatibilityNotes, setFormCompatibilityNotes] = useState('');

  const sparePartsList = useMemo(() => {
    return inventory.filter(item => {
      return (
        item.vehicleType !== undefined ||
        Boolean(item.partNumber) ||
        Boolean(item.oemNumber) ||
        Boolean(item.shelfLocation) ||
        (item.sku && item.sku.startsWith('SP-')) ||
        ['AutoSpareParts', 'CarSpareParts', 'BikeSpareParts'].includes(company.industry || '')
      );
    });
  }, [inventory, company.industry]);

  const uniqueLocations = useMemo(() => {
    const set = new Set<string>();
    sparePartsList.forEach(item => {
      if (item.shelfLocation && item.shelfLocation.trim()) {
        const clean = item.shelfLocation.split('/')[0].trim();
        if (clean) set.add(clean);
      }
    });
    return Array.from(set);
  }, [sparePartsList]);

  const metrics = useMemo(() => {
    const totalCount = sparePartsList.length;
    const totalStockValue = sparePartsList.reduce((acc, item) => acc + ((item.purchasePrice || 0) * (item.stockQuantity || 0)), 0);
    const totalRetailValue = sparePartsList.reduce((acc, item) => acc + ((item.salePrice || 0) * (item.stockQuantity || 0)), 0);
    const carPartsCount = sparePartsList.filter(item => item.vehicleType === 'car' || !item.vehicleType).length;
    const bikePartsCount = sparePartsList.filter(item => item.vehicleType === 'bike').length;
    const lowStockCount = sparePartsList.filter(item => (item.stockQuantity || 0) <= (item.minStockThreshold || 1)).length;
    const barcodedCount = sparePartsList.filter(item => Boolean(item.barcode && item.barcode.trim())).length;

    return {
      totalCount,
      totalStockValue,
      totalRetailValue,
      carPartsCount,
      bikePartsCount,
      lowStockCount,
      barcodedCount
    };
  }, [sparePartsList]);

  const filteredParts = useMemo(() => {
    return sparePartsList.filter(item => {
      if (vehicleTypeFilter === 'car' && item.vehicleType !== 'car') return false;
      if (vehicleTypeFilter === 'bike' && item.vehicleType !== 'bike') return false;
      if (vehicleTypeFilter === 'both' && item.vehicleType !== 'both') return false;

      if (categoryFilter !== 'all' && item.partCategory !== categoryFilter) return false;

      if (makeFilter !== 'all') {
        const matchMake = item.vehicleMake?.toLowerCase().includes(makeFilter.toLowerCase()) ||
                          item.vehicleModel?.toLowerCase().includes(makeFilter.toLowerCase()) ||
                          item.name.toLowerCase().includes(makeFilter.toLowerCase());
        if (!matchMake) return false;
      }

      if (stockStatusFilter === 'in_stock' && (item.stockQuantity || 0) <= (item.minStockThreshold || 1)) return false;
      if (stockStatusFilter === 'low_stock' && ((item.stockQuantity || 0) > (item.minStockThreshold || 1) || (item.stockQuantity || 0) <= 0)) return false;
      if (stockStatusFilter === 'out_of_stock' && (item.stockQuantity || 0) > 0) return false;

      if (selectedLocation !== 'all' && !item.shelfLocation?.toLowerCase().includes(selectedLocation.toLowerCase())) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesPartNo = item.partNumber?.toLowerCase().includes(q);
        const matchesOem = item.oemNumber?.toLowerCase().includes(q);
        const matchesBarcode = item.barcode?.toLowerCase().includes(q);
        const matchesMake = item.vehicleMake?.toLowerCase().includes(q);
        const matchesModel = item.vehicleModel?.toLowerCase().includes(q);
        const matchesShelf = item.shelfLocation?.toLowerCase().includes(q);
        const matchesSku = item.sku?.toLowerCase().includes(q);

        if (!matchesName && !matchesPartNo && !matchesOem && !matchesBarcode && !matchesMake && !matchesModel && !matchesShelf && !matchesSku) {
          return false;
        }
      }

      return true;
    });
  }, [sparePartsList, vehicleTypeFilter, categoryFilter, makeFilter, stockStatusFilter, selectedLocation, searchQuery]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPartNo(text);
    setTimeout(() => setCopiedPartNo(null), 2000);
  };

  const handleOpenAddModal = (defaultType: 'car' | 'bike' = 'car') => {
    setEditingItem(null);
    setFormVehicleType(defaultType);
    setFormName('');
    setFormPartNumber('');
    setFormOemNumber('');
    setFormSku(`SP-${defaultType.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormBrand('');
    setFormVehicleMake('');
    setFormVehicleModel('');
    setFormModelYearFrom('');
    setFormModelYearTo('');
    setFormEngineType('');
    setFormPartCategory(PART_CATEGORIES[0]);
    setFormShelfLocation(defaultType === 'car' ? 'Rack A-01 / Bin 01' : 'Rack M-01 / Bin 01');
    setFormCondition('new_oem');
    setFormWarranty('6 Months Replacement');
    setFormPurchasePrice(0);
    setFormSalePrice(0);
    setFormStockQuantity(10);
    setFormMinStockThreshold(3);
    setFormBarcode(`6291048${Math.floor(100000 + Math.random() * 900000)}`);
    setFormBarcodeType('EAN-13');
    setFormCompatibilityNotes('');
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormVehicleType(item.vehicleType || 'car');
    setFormName(item.name);
    setFormPartNumber(item.partNumber || '');
    setFormOemNumber(item.oemNumber || '');
    setFormSku(item.sku || '');
    setFormBrand(item.brand || '');
    setFormVehicleMake(item.vehicleMake || '');
    setFormVehicleModel(item.vehicleModel || '');
    setFormModelYearFrom(item.modelYearFrom || '');
    setFormModelYearTo(item.modelYearTo || '');
    setFormEngineType(item.engineType || '');
    setFormPartCategory(item.partCategory || PART_CATEGORIES[0]);
    setFormShelfLocation(item.shelfLocation || '');
    setFormCondition(item.condition || 'new_oem');
    setFormWarranty(item.warranty || '');
    setFormPurchasePrice(item.purchasePrice || 0);
    setFormSalePrice(item.salePrice || 0);
    setFormStockQuantity(item.stockQuantity || 0);
    setFormMinStockThreshold(item.minStockThreshold || 2);
    setFormBarcode(item.barcode || '');
    setFormBarcodeType(item.barcodeType || 'EAN-13');
    setFormCompatibilityNotes(item.compatibilityNotes || '');
    setIsAddEditModalOpen(true);
  };

  const handleGenerateBarcode = (type: 'EAN-13' | 'Code128') => {
    if (type === 'EAN-13') {
      const code = `6291048${Math.floor(100000 + Math.random() * 900000)}`;
      setFormBarcode(code);
      setFormBarcodeType('EAN-13');
    } else {
      const prefix = formVehicleType === 'bike' ? 'BK' : 'CR';
      const code = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
      setFormBarcode(code);
      setFormBarcodeType('Code128');
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const payload: Partial<InventoryItem> = {
      ...(editingItem?.id ? { id: editingItem.id } : {}),
      name: formName.trim(),
      sku: formSku.trim() || `SP-${Date.now().toString().slice(-6)}`,
      partNumber: formPartNumber.trim().toUpperCase(),
      oemNumber: formOemNumber.trim().toUpperCase(),
      vehicleType: formVehicleType,
      vehicleMake: formVehicleMake.trim(),
      vehicleModel: formVehicleModel.trim(),
      modelYearFrom: formModelYearFrom.trim(),
      modelYearTo: formModelYearTo.trim(),
      engineType: formEngineType.trim(),
      partCategory: formPartCategory,
      brand: formBrand.trim(),
      shelfLocation: formShelfLocation.trim().toUpperCase(),
      condition: formCondition,
      warranty: formWarranty.trim(),
      purchasePrice: Number(formPurchasePrice) || 0,
      salePrice: Number(formSalePrice) || 0,
      stockQuantity: Number(formStockQuantity) || 0,
      minStockThreshold: Number(formMinStockThreshold) || 1,
      barcode: formBarcode.trim(),
      barcodeType: formBarcodeType,
      compatibilityNotes: formCompatibilityNotes.trim()
    };

    onSaveItem(payload);
    setIsAddEditModalOpen(false);
  };

  const handleLoadDemoCatalog = () => {
    if (onBulkAddItems) {
      onBulkAddItems(INITIAL_DEMO_SPARE_PARTS);
    } else {
      INITIAL_DEMO_SPARE_PARTS.forEach(part => onSaveItem(part));
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner / Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 border border-indigo-900/40 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <Wrench className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black font-mono tracking-tight">
                  Spare Parts Inventory & Fitment Hub
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  Pro Engine
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-sans">
                Automotive & Motorcycle Spare Parts • OEM cross-references, bin locations, barcodes & POS invoicing
              </p>
            </div>
          </div>

          {/* Action Hub Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenAddModal('car')}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono rounded-xl transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <Car className="w-4 h-4" />
              <span>+ Add Car Part</span>
            </button>
            <button
              onClick={() => handleOpenAddModal('bike')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono rounded-xl transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <Bike className="w-4 h-4" />
              <span>+ Add Bike Part</span>
            </button>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold rounded-xl transition-all border border-slate-700 flex items-center space-x-1.5 cursor-pointer"
              title="Camera Barcode Scanner"
            >
              <BarcodeIcon className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Scan Barcode</span>
            </button>
            <button
              onClick={() => {
                setBarcodeSelectedItem(null);
                setIsBarcodeModalOpen(true);
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold rounded-xl transition-all border border-slate-700 flex items-center space-x-1.5 cursor-pointer"
              title="Print Shelf Stickers"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Print Labels</span>
            </button>
            {sparePartsList.length === 0 && (
              <button
                onClick={handleLoadDemoCatalog}
                className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-mono font-bold rounded-xl transition-all border border-amber-500/40 flex items-center space-x-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Load Demo Parts</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-5 pt-4 border-t border-indigo-900/50">
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Total Parts SKU</p>
            <p className="text-lg font-black font-mono text-white mt-0.5">{metrics.totalCount}</p>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
            <p className="text-[10px] uppercase font-mono tracking-wider text-indigo-400 flex items-center gap-1">
              <Car className="w-3 h-3" /> Car Parts
            </p>
            <p className="text-lg font-black font-mono text-indigo-300 mt-0.5">{metrics.carPartsCount}</p>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
            <p className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 flex items-center gap-1">
              <Bike className="w-3 h-3" /> Bike Parts
            </p>
            <p className="text-lg font-black font-mono text-emerald-300 mt-0.5">{metrics.bikePartsCount}</p>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
            <p className="text-[10px] uppercase font-mono tracking-wider text-amber-400">Low Stock Alert</p>
            <p className="text-lg font-black font-mono text-amber-300 mt-0.5">{metrics.lowStockCount}</p>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Stock Valuation</p>
            <p className="text-sm font-black font-mono text-emerald-400 mt-1">AED {metrics.totalStockValue.toFixed(2)}</p>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Barcoded Catalog</p>
            <p className="text-lg font-black font-mono text-sky-300 mt-0.5">
              {metrics.barcodedCount} / {metrics.totalCount}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search part name, OEM, Part No, Barcode, Rack..."
              className="w-full text-xs pl-9 pr-8 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono placeholder:font-sans focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Vehicle Type Switcher */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-stretch md:self-auto overflow-x-auto">
            <button
              onClick={() => setVehicleTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                vehicleTypeFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setVehicleTypeFilter('car')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center space-x-1.5 ${
                vehicleTypeFilter === 'car'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Car Parts ({metrics.carPartsCount})</span>
            </button>
            <button
              onClick={() => setVehicleTypeFilter('bike')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center space-x-1.5 ${
                vehicleTypeFilter === 'bike'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Bike Parts ({metrics.bikePartsCount})</span>
            </button>
            <button
              onClick={() => setVehicleTypeFilter('both')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                vehicleTypeFilter === 'both'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Universal
            </button>
          </div>
        </div>

        {/* Extended Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value as any)}
              className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white font-mono cursor-pointer"
            >
              <option value="all">Stock: All Statuses</option>
              <option value="in_stock">In Stock Items</option>
              <option value="low_stock">Low Stock Warning</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          <div>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white font-mono cursor-pointer"
            >
              <option value="all">Rack: All Locations</option>
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>Rack: {loc}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white font-mono cursor-pointer"
            >
              <option value="all">All Part Categories</option>
              {PART_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={makeFilter}
              onChange={(e) => setMakeFilter(e.target.value)}
              className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white font-mono cursor-pointer"
            >
              <option value="all">All Vehicle Makes</option>
              <optgroup label="Popular Car Makes">
                {CAR_MAKES.map(m => (
                  <option key={`car-${m}`} value={m}>Car: {m}</option>
                ))}
              </optgroup>
              <optgroup label="Popular Bike Makes">
                {BIKE_MAKES.map(m => (
                  <option key={`bike-${m}`} value={m}>Bike: {m}</option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* Spare Parts Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Spare Parts Inventory Catalog ({filteredParts.length} items found)
            </h2>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Showing {filteredParts.length} of {sparePartsList.length} registered parts
          </div>
        </div>

        {filteredParts.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mx-auto flex items-center justify-center">
              <Wrench className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
              No Spare Parts Found Matching Filters
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto font-sans">
              No spare parts match your query. Add a new part or load demo parts to start invoicing immediately.
            </p>
            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                onClick={() => handleOpenAddModal('car')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold rounded-xl transition-all shadow-sm"
              >
                + Add Car Spare Part
              </button>
              <button
                onClick={() => handleOpenAddModal('bike')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold rounded-xl transition-all shadow-sm"
              >
                + Add Bike Spare Part
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4 font-bold">Vehicle & Part Details</th>
                  <th className="py-3 px-3 font-bold">Part No & OEM</th>
                  <th className="py-3 px-3 font-bold">Vehicle Compatibility</th>
                  <th className="py-3 px-3 font-bold">Rack / Bin</th>
                  <th className="py-3 px-3 font-bold">Barcode</th>
                  <th className="py-3 px-3 font-bold">Stock</th>
                  <th className="py-3 px-3 font-bold">Price & Margin</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {filteredParts.map((item) => {
                  const isLow = (item.stockQuantity || 0) <= (item.minStockThreshold || 1);
                  const isOut = (item.stockQuantity || 0) <= 0;
                  const marginPct = (item.purchasePrice && item.purchasePrice > 0)
                    ? Math.round((((item.salePrice || 0) - item.purchasePrice) / item.purchasePrice) * 100)
                    : 0;

                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Name & Classification */}
                      <td className="py-3 px-4">
                        <div className="flex items-start space-x-2.5">
                          <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                            item.vehicleType === 'bike' 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' 
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400'
                          }`}>
                            {item.vehicleType === 'bike' ? <Bike className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white font-sans text-xs group-hover:text-indigo-600 transition-colors">
                              {item.name}
                            </p>
                            <div className="flex items-center space-x-1.5 mt-1">
                              <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded font-mono text-slate-500">
                                {item.partCategory || 'Spare Part'}
                              </span>
                              {item.brand && (
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                  {item.brand}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Part Number & OEM */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          {item.partNumber ? (
                            <div className="flex items-center space-x-1">
                              <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                                {item.partNumber}
                              </span>
                              <button
                                onClick={() => handleCopy(item.partNumber!)}
                                className="text-slate-400 hover:text-indigo-600 p-0.5"
                                title="Copy Part Number"
                              >
                                {copiedPartNo === item.partNumber ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">No Part #</span>
                          )}
                          {item.oemNumber && (
                            <p className="text-[10px] text-slate-500 font-mono">
                              OEM: <span className="text-slate-700 dark:text-slate-300 font-semibold">{item.oemNumber}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Vehicle Compatibility */}
                      <td className="py-3 px-3">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            {item.vehicleMake || 'All Makes'} {item.vehicleModel ? `• ${item.vehicleModel}` : ''}
                          </p>
                          {(item.modelYearFrom || item.modelYearTo) && (
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Years: {item.modelYearFrom || 'Any'} - {item.modelYearTo || 'Current'}
                            </p>
                          )}
                          {item.engineType && (
                            <p className="text-[9.5px] text-indigo-600 dark:text-indigo-400 truncate max-w-[160px]">
                              {item.engineType}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Rack / Bin Location */}
                      <td className="py-3 px-3">
                        {item.shelfLocation ? (
                          <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>{item.shelfLocation}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Unassigned</span>
                        )}
                      </td>

                      {/* Barcode */}
                      <td className="py-3 px-3">
                        {item.barcode ? (
                          <div className="space-y-0.5">
                            <span className="font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300 block">
                              {item.barcode}
                            </span>
                            <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1 py-0.2 rounded font-mono">
                              {item.barcodeType || 'EAN-13'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">No Barcode</span>
                        )}
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                            isOut
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                              : isLow
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                          }`}>
                            {item.stockQuantity ?? 0} In Stock
                          </span>
                          {isLow && !isOut && (
                            <p className="text-[9.5px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" /> Low Stock
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Price & Margin */}
                      <td className="py-3 px-3">
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white text-xs">
                            AED {(item.salePrice || 0).toFixed(2)}
                          </p>
                          <div className="flex items-center space-x-1.5 text-[9.5px] text-slate-500 mt-0.5">
                            <span>Cost: {(item.purchasePrice || 0).toFixed(2)}</span>
                            {marginPct > 0 && (
                              <span className="text-emerald-600 font-bold">+{marginPct}%</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Quick POS action */}
                          {onOpenQuickPOSWithItem && (
                            <button
                              onClick={() => onOpenQuickPOSWithItem(item)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 dark:text-emerald-400 rounded-lg transition-colors cursor-pointer"
                              title="Sell in POS"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Print Label */}
                          <button
                            onClick={() => {
                              setBarcodeSelectedItem(item);
                              setIsBarcodeModalOpen(true);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                            title="Print Barcode Tag"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Item */}
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                            title="Edit Spare Part"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Item */}
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${item.name}?`)) {
                                onDeleteItem(item.id);
                              }
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-400 rounded-lg transition-colors cursor-pointer"
                            title="Delete Spare Part"
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
        )}
      </div>

      {/* Add / Edit Spare Part Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <span className="p-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg">
                  <Wrench className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold font-mono">
                    {editingItem ? 'Edit Spare Part' : 'Add New Spare Part'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-sans">
                    Register part OEM code, vehicle compatibility, bin rack & barcode label
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
              
              {/* SECTION 1: VEHICLE TYPE & BASIC IDENTIFIERS */}
              <div className="space-y-3">
                <label className="block text-[11px] font-bold uppercase font-mono text-slate-500">
                  Step 1: Vehicle Type & Classification
                </label>
                
                {/* Vehicle Type Toggle Chips */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormVehicleType('car');
                      if (!formShelfLocation) setFormShelfLocation('Rack A-01 / Bin 01');
                    }}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center space-x-2 font-mono font-bold transition-all cursor-pointer ${
                      formVehicleType === 'car'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Car className="w-4 h-4" />
                    <span>Car Spare Part</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormVehicleType('bike');
                      if (!formShelfLocation) setFormShelfLocation('Rack M-01 / Bin 01');
                    }}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center space-x-2 font-mono font-bold transition-all cursor-pointer ${
                      formVehicleType === 'bike'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Bike className="w-4 h-4" />
                    <span>Bike Spare Part</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormVehicleType('both')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center space-x-2 font-mono font-bold transition-all cursor-pointer ${
                      formVehicleType === 'both'
                        ? 'bg-slate-800 text-white border-slate-700 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Universal</span>
                  </button>
                </div>
              </div>

              {/* Part Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Part Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Front Ceramic Brake Pad Set / Oil Filter Element"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-sans outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Part Category
                  </label>
                  <select
                    value={formPartCategory}
                    onChange={(e) => setFormPartCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono cursor-pointer"
                  >
                    {PART_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Brand / Manufacturer
                  </label>
                  <input
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="e.g. Toyota OEM, Denso, NGK, Bosch, Honda Genuine"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* SECTION 2: VEHICLE COMPATIBILITY */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <label className="block text-[11px] font-bold uppercase font-mono text-indigo-600 dark:text-indigo-400">
                  Step 2: Vehicle Compatibility & Fitment
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Vehicle Make
                    </label>
                    <input
                      type="text"
                      value={formVehicleMake}
                      onChange={(e) => setFormVehicleMake(e.target.value)}
                      placeholder="e.g. Toyota / Honda / Yamaha"
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Model
                    </label>
                    <input
                      type="text"
                      value={formVehicleModel}
                      onChange={(e) => setFormVehicleModel(e.target.value)}
                      placeholder="e.g. Corolla / CD 70 / Civic"
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Year Range
                    </label>
                    <div className="flex items-center space-x-1">
                      <input
                        type="text"
                        value={formModelYearFrom}
                        onChange={(e) => setFormModelYearFrom(e.target.value)}
                        placeholder="2018"
                        className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono text-xs text-center"
                      />
                      <span className="text-slate-400">-</span>
                      <input
                        type="text"
                        value={formModelYearTo}
                        onChange={(e) => setFormModelYearTo(e.target.value)}
                        placeholder="2024"
                        className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono text-xs text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Engine Spec
                    </label>
                    <input
                      type="text"
                      value={formEngineType}
                      onChange={(e) => setFormEngineType(e.target.value)}
                      placeholder="e.g. 1.8L VVTi / 70cc / 125cc"
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Fitment & Compatibility Notes
                  </label>
                  <input
                    type="text"
                    value={formCompatibilityNotes}
                    onChange={(e) => setFormCompatibilityNotes(e.target.value)}
                    placeholder="e.g. Also compatible with Altis Grande and Premio models with 2ZR-FE engine"
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-sans text-xs"
                  />
                </div>
              </div>

              {/* SECTION 3: PART CODES, LOCATION & BARCODE */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Part Number
                  </label>
                  <input
                    type="text"
                    value={formPartNumber}
                    onChange={(e) => setFormPartNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. 04465-02220 / 13780-01D00"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 font-mono font-bold uppercase outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    OEM Cross-Ref
                  </label>
                  <input
                    type="text"
                    value={formOemNumber}
                    onChange={(e) => setFormOemNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. 04465-YZZE1"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono uppercase outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 mr-1" />
                    <span>Rack / Bin Location</span>
                  </label>
                  <input
                    type="text"
                    value={formShelfLocation}
                    onChange={(e) => setFormShelfLocation(e.target.value.toUpperCase())}
                    placeholder="e.g. Rack A-02 / Bin 12"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Barcode Generation Block */}
              <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200 dark:border-indigo-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold font-mono text-indigo-800 dark:text-indigo-300 flex items-center">
                    <BarcodeIcon className="w-4 h-4 mr-1 text-indigo-500" />
                    <span>Barcode & Sticker Tag</span>
                  </label>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleGenerateBarcode('EAN-13')}
                      className="px-2 py-1 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-300 text-[10px] font-mono font-bold rounded hover:bg-indigo-50 cursor-pointer"
                    >
                      Auto EAN-13
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateBarcode('Code128')}
                      className="px-2 py-1 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-300 text-[10px] font-mono font-bold rounded hover:bg-indigo-50 cursor-pointer"
                    >
                      Auto Code-128
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    placeholder="e.g. 6291048044652"
                    className="flex-1 px-3 py-1.5 border border-indigo-200 dark:border-indigo-800 rounded-lg bg-white dark:bg-slate-900 font-mono text-xs font-bold text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-2 py-1.5 rounded border border-indigo-200 dark:border-indigo-800 shrink-0">
                    {formBarcodeType}
                  </span>
                </div>
              </div>

              {/* SECTION 4: CONDITION, WARRANTY, PRICING & STOCK */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Condition
                  </label>
                  <select
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-mono text-xs cursor-pointer"
                  >
                    <option value="new_oem">Brand New OEM</option>
                    <option value="aftermarket">Genuine Aftermarket</option>
                    <option value="used_genuine">Used Genuine / Scrap</option>
                    <option value="reconditioned">Reconditioned</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Warranty
                  </label>
                  <input
                    type="text"
                    value={formWarranty}
                    onChange={(e) => setFormWarranty(e.target.value)}
                    placeholder="e.g. 6 Months Replacement"
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Purchase Cost (AED)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formPurchasePrice}
                    onChange={(e) => setFormPurchasePrice(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Sale Price (AED) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formSalePrice}
                    onChange={(e) => setFormSalePrice(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={formStockQuantity}
                    onChange={(e) => setFormStockQuantity(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-mono text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Min Alert Threshold
                  </label>
                  <input
                    type="number"
                    value={formMinStockThreshold}
                    onChange={(e) => setFormMinStockThreshold(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingItem ? 'Save Changes' : 'Register Spare Part'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Label Print Modal */}
      {isBarcodeModalOpen && (
        <BarcodeLabelModal
          isOpen={isBarcodeModalOpen}
          onClose={() => {
            setIsBarcodeModalOpen(false);
            setBarcodeSelectedItem(null);
          }}
          company={company}
          inventory={inventory}
          initialSelectedItem={barcodeSelectedItem}
        />
      )}

      {/* Barcode Camera Scanner Modal */}
      {isScannerOpen && (
        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScan={(code) => {
            playBeepSound();
            setSearchQuery(code);
            setIsScannerOpen(false);
          }}
          title="Spare Part Barcode Scanner"
          subtitle="Scan part packaging or bin sticker for instant lookup"
        />
      )}
    </div>
  );
}
