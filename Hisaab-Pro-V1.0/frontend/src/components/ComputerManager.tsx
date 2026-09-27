import React, { useState, useMemo } from 'react';
import { 
  Monitor, 
  Laptop, 
  Printer, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Wrench, 
  ClipboardList, 
  Plus, 
  Search, 
  Barcode as BarcodeIcon, 
  CheckCircle2, 
  AlertTriangle, 
  Tag, 
  ShieldCheck, 
  Sparkles, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  RefreshCw, 
  FileText, 
  X, 
  Package, 
  ShoppingBag, 
  Zap, 
  ChevronRight,
  Phone,
  User,
  Clock,
  CheckCircle,
  Layers
} from 'lucide-react';
import { InventoryItem, Company } from '../types';
import BarcodeLabelModal from './BarcodeLabelModal';
import { BarcodeScannerModal, playBeepSound } from './BarcodeScannerModal';

export interface RepairJobCard {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  deviceType: 'Laptop' | 'Desktop PC' | 'Printer' | 'MacBook / iMac' | 'Other';
  deviceBrand: string;
  deviceModel: string;
  serialNumber: string;
  accessories: string; // e.g. Charger, Power Cable, Cartridge, Bag
  problemReported: string;
  diagnosticNotes: string;
  technicianName: string;
  estimatedCost: number;
  advancePaid: number;
  status: 'Received' | 'In Diagnosis' | 'Awaiting Parts' | 'Testing' | 'Ready for Pickup' | 'Delivered';
  receivedDate: string;
  completedDate?: string;
}

interface ComputerManagerProps {
  company: Company;
  inventory: InventoryItem[];
  onSaveItem: (item: Partial<InventoryItem>) => void;
  onDeleteItem: (id: string) => void;
  onBulkAddItems?: (items: Partial<InventoryItem>[]) => void;
  onCreateInvoiceWithItem?: (item: InventoryItem) => void;
}

type ITFilterCategory = 'ALL' | 'LAPTOP_DESKTOP' | 'PRINTERS' | 'TONERS' | 'COMPONENTS' | 'NETWORKING' | 'SERVICES' | 'JOB_CARDS';

export const POPULAR_COMPUTER_BRANDS = ['HP', 'Dell', 'Lenovo', 'Apple', 'Canon', 'Epson', 'Brother', 'Asus', 'Acer', 'Kingston', 'Logitech', 'Cisco', 'TP-Link'];

export const SEED_COMPUTER_PRINTER_CATALOG: Partial<InventoryItem>[] = [
  // Laptops & Desktops
  {
    name: 'HP ProBook 450 G10 Business Laptop',
    sku: 'LAP-HP-PB450-01',
    category: 'Computers & Laptops',
    brand: 'HP',
    itCategory: 'laptop',
    serialNumber: '5CD3429188',
    deviceSpecs: 'Intel Core i7-1355U, 16GB DDR4, 512GB NVMe SSD, 15.6" FHD, Win 11 Pro',
    warranty: '1 Year Official HP Warranty',
    condition: 'new_sealed',
    purchasePrice: 2850,
    salePrice: 3450,
    stockQuantity: 6,
    minStockThreshold: 2,
    sellingUnit: 'Unit',
    barcode: '629810481011',
    barcodeType: 'Code128',
    internalNotes: 'Business-class enterprise notebook with fingerprint reader'
  },
  {
    name: 'Dell Latitude 5430 Ultra-Durable Laptop',
    sku: 'LAP-DELL-LAT5430',
    category: 'Computers & Laptops',
    brand: 'Dell',
    itCategory: 'laptop',
    serialNumber: '8VJ9210-DXB',
    deviceSpecs: 'Intel Core i5-1245U, 16GB RAM, 512GB SSD, 14.0" Anti-Glare FHD, Win 11 Pro',
    warranty: '1 Year Dell ProSupport GCC',
    condition: 'new_sealed',
    purchasePrice: 2400,
    salePrice: 2950,
    stockQuantity: 4,
    minStockThreshold: 1,
    sellingUnit: 'Unit',
    barcode: '629810481012',
    barcodeType: 'Code128'
  },
  {
    name: 'Apple MacBook Air 13.6" M2 Chip',
    sku: 'LAP-APL-MBA-M2',
    category: 'Computers & Laptops',
    brand: 'Apple',
    itCategory: 'laptop',
    serialNumber: 'C02GK929MD6R',
    deviceSpecs: 'Apple M2 8-Core CPU / 8-Core GPU, 8GB Unified RAM, 256GB SSD, Space Grey',
    warranty: '1 Year Apple Official Warranty',
    condition: 'new_sealed',
    purchasePrice: 3500,
    salePrice: 4100,
    stockQuantity: 3,
    minStockThreshold: 1,
    sellingUnit: 'Unit',
    barcode: '629810481013',
    barcodeType: 'Code128'
  },
  {
    name: 'Dell OptiPlex 7010 Micro Form Factor Desktop PC',
    sku: 'PC-DELL-OPT7010',
    category: 'Computers & Desktops',
    brand: 'Dell',
    itCategory: 'desktop',
    serialNumber: 'CN-0H7K82-901',
    deviceSpecs: 'Intel Core i7-13700T, 16GB DDR5, 512GB Gen4 SSD, Windows 11 Pro, Keyboard & Mouse included',
    warranty: '3 Years Dell ProSupport Next Business Day',
    condition: 'new_sealed',
    purchasePrice: 2650,
    salePrice: 3200,
    stockQuantity: 5,
    minStockThreshold: 2,
    sellingUnit: 'Set',
    barcode: '629810481014',
    barcodeType: 'Code128'
  },

  // Printers & Copiers
  {
    name: 'HP LaserJet Pro MFP 4103fdw All-in-One Laser Printer',
    sku: 'PRN-HP-4103FDW',
    category: 'Printers & Scanners',
    brand: 'HP',
    itCategory: 'printer',
    serialNumber: 'VNB3R92019',
    deviceSpecs: 'Print, Copy, Scan, Fax | Fast 40 ppm | Auto-Duplex | Wi-Fi & Ethernet | 50-sheet ADF',
    printerModelCompatibility: 'Uses HP 151A (W1510A) / HP 151X High Yield Toners',
    warranty: '1 Year HP On-Site Commercial Warranty',
    condition: 'new_sealed',
    purchasePrice: 1450,
    salePrice: 1850,
    stockQuantity: 4,
    minStockThreshold: 1,
    sellingUnit: 'Unit',
    barcode: '629810481021',
    barcodeType: 'Code128'
  },
  {
    name: 'Canon imageRUNNER 2625i Multi-Function Photocopier',
    sku: 'PRN-CAN-IR2625I',
    category: 'Printers & Scanners',
    brand: 'Canon',
    itCategory: 'printer',
    serialNumber: 'KNG8391204',
    deviceSpecs: 'Heavy Duty A3/A4 B&W Multi-Function Copier, 25 ppm, Duplex DADF, Network Ready, 7" Color Touchscreen',
    printerModelCompatibility: 'Uses Canon C-EXV 59 Black Genuine Toner (Yield 30,000 pages)',
    warranty: '1 Year Canon GCC Official Warranty',
    condition: 'new_sealed',
    purchasePrice: 5200,
    salePrice: 6500,
    stockQuantity: 2,
    minStockThreshold: 1,
    sellingUnit: 'Unit',
    barcode: '629810481022',
    barcodeType: 'Code128'
  },
  {
    name: 'Epson EcoTank L3250 Wi-Fi All-in-One Ink Tank Printer',
    sku: 'PRN-EPS-L3250',
    category: 'Printers & Scanners',
    brand: 'Epson',
    itCategory: 'printer',
    serialNumber: 'X9W8391022',
    deviceSpecs: 'Print, Scan, Copy | Ultra-Low Cost Printing | Wi-Fi Direct | Mobile Smart Panel App',
    printerModelCompatibility: 'Uses Epson 003 Genuine EcoTank 65ml Ink Bottles (Black, Cyan, Magenta, Yellow)',
    warranty: '2 Years or 30,000 Pages Epson Warranty',
    condition: 'new_sealed',
    purchasePrice: 550,
    salePrice: 699,
    stockQuantity: 8,
    minStockThreshold: 2,
    sellingUnit: 'Unit',
    barcode: '629810481023',
    barcodeType: 'Code128'
  },
  {
    name: 'Brother HL-L2370DW Wireless Compact Laser Printer',
    sku: 'PRN-BRO-L2370DW',
    category: 'Printers & Scanners',
    brand: 'Brother',
    itCategory: 'printer',
    serialNumber: 'U64928109',
    deviceSpecs: 'Monochrome Laser | 34 ppm | Automatic 2-sided Printing | Wireless & USB',
    printerModelCompatibility: 'Uses Brother TN-2480 High Yield Toner (3,000 Pages) / DR-2405 Drum Unit',
    warranty: '1 Year Brother GCC Warranty',
    condition: 'new_sealed',
    purchasePrice: 420,
    salePrice: 550,
    stockQuantity: 5,
    minStockThreshold: 2,
    sellingUnit: 'Unit',
    barcode: '629810481024',
    barcodeType: 'Code128'
  },

  // Toners, Inks & Cartridges
  {
    name: 'HP 76A Original Black LaserJet Toner Cartridge (CF276A)',
    sku: 'TNR-HP-76A',
    category: 'Toners & Inks',
    brand: 'HP',
    itCategory: 'toner',
    printerModelCompatibility: 'HP LaserJet Pro M404n, M404dn, M404dw, MFP M428dw, M428fdn, M428fdw',
    deviceSpecs: 'Standard Yield ~3,000 Pages (ISO/IEC 19752)',
    warranty: 'HP Premium Protection Warranty',
    condition: 'new_sealed',
    purchasePrice: 320,
    salePrice: 420,
    stockQuantity: 15,
    minStockThreshold: 4,
    sellingUnit: 'Piece',
    barcode: '192018046894',
    barcodeType: 'Code128'
  },
  {
    name: 'Canon 057 Black High-Capacity Laser Toner Cartridge',
    sku: 'TNR-CAN-057',
    category: 'Toners & Inks',
    brand: 'Canon',
    itCategory: 'toner',
    printerModelCompatibility: 'Canon i-SENSYS LBP223dw, LBP226dw, MF443dw, MF445dw, MF449x',
    deviceSpecs: 'Standard Yield ~3,100 Pages Genuine Cartridge',
    warranty: 'Genuine Canon GCC Guarantee',
    condition: 'new_sealed',
    purchasePrice: 280,
    salePrice: 375,
    stockQuantity: 10,
    minStockThreshold: 3,
    sellingUnit: 'Piece',
    barcode: '4549292137684',
    barcodeType: 'Code128'
  },
  {
    name: 'Epson 003 4-Color Genuine EcoTank Ink Multipack (CMYK)',
    sku: 'INK-EPS-003-SET',
    category: 'Toners & Inks',
    brand: 'Epson',
    itCategory: 'toner',
    printerModelCompatibility: 'Epson EcoTank L1110, L3110, L3150, L3210, L3250, L5190, L5290',
    deviceSpecs: 'Black 65ml (4,500 Pages) + Cyan, Magenta, Yellow 65ml (7,500 Pages)',
    warranty: 'Genuine Epson Seal Verified',
    condition: 'new_sealed',
    purchasePrice: 85,
    salePrice: 125,
    stockQuantity: 24,
    minStockThreshold: 6,
    sellingUnit: 'Set',
    barcode: '8715946654781',
    barcodeType: 'Code128'
  },
  {
    name: 'Brother TN-2480 High-Yield Black Toner Cartridge',
    sku: 'TNR-BRO-TN2480',
    category: 'Toners & Inks',
    brand: 'Brother',
    itCategory: 'toner',
    printerModelCompatibility: 'Brother HL-L2370DW, HL-L2375DW, DCP-L2535DW, MFC-L2715DW, MFC-L2750DW',
    deviceSpecs: 'High Yield ~3,000 Pages Genuine Brother Toner',
    warranty: 'Brother Original Warranty',
    condition: 'new_sealed',
    purchasePrice: 190,
    salePrice: 260,
    stockQuantity: 12,
    minStockThreshold: 3,
    sellingUnit: 'Piece',
    barcode: '4977766782357',
    barcodeType: 'Code128'
  },

  // Components & Storage
  {
    name: 'Kingston NV2 1TB PCIe 4.0 NVMe M.2 High-Speed SSD',
    sku: 'SSD-KNG-1TB-NV2',
    category: 'Storage & Components',
    brand: 'Kingston',
    itCategory: 'component',
    serialNumber: 'KNG-SN-9948201',
    deviceSpecs: 'PCIe 4.0 x4 NVMe M.2 2280 | Speeds up to 3500MB/s Read, 2100MB/s Write',
    warranty: '3 Years Limited Warranty',
    condition: 'new_sealed',
    purchasePrice: 195,
    salePrice: 275,
    stockQuantity: 18,
    minStockThreshold: 5,
    sellingUnit: 'Piece',
    barcode: '740617329910',
    barcodeType: 'Code128'
  },
  {
    name: 'Crucial 16GB DDR4 3200MHz SODIMM Laptop Memory RAM',
    sku: 'RAM-CRU-16GB-3200',
    category: 'Storage & Components',
    brand: 'Crucial',
    itCategory: 'component',
    deviceSpecs: '16GB DDR4-3200 CL22 1.2V 260-Pin SODIMM for Laptops & Mini PCs',
    warranty: 'Limited Lifetime Warranty',
    condition: 'new_sealed',
    purchasePrice: 120,
    salePrice: 175,
    stockQuantity: 14,
    minStockThreshold: 4,
    sellingUnit: 'Piece',
    barcode: '649528903563',
    barcodeType: 'Code128'
  },
  {
    name: 'Logitech MK270 Wireless Keyboard & Mouse Combo',
    sku: 'ACC-LOG-MK270',
    category: 'Peripherals & Accessories',
    brand: 'Logitech',
    itCategory: 'accessory',
    deviceSpecs: '2.4GHz Reliable Wireless | Spill-resistant design | Long battery life | USB Nano receiver',
    warranty: '1 Year Logitech GCC Warranty',
    condition: 'new_sealed',
    purchasePrice: 75,
    salePrice: 110,
    stockQuantity: 20,
    minStockThreshold: 5,
    sellingUnit: 'Set',
    barcode: '5099206041042',
    barcodeType: 'Code128'
  },
  {
    name: 'TP-Link Archer AX55 Dual-Band Wi-Fi 6 Gigabit Router',
    sku: 'NET-TPL-AX55',
    category: 'Networking',
    brand: 'TP-Link',
    itCategory: 'networking',
    serialNumber: '223B94819034',
    deviceSpecs: 'Next-Gen Gigabit Wi-Fi 6 (2402 Mbps on 5GHz + 574 Mbps on 2.4GHz) | 4 High-Gain Antennas | OFDMA & MU-MIMO',
    warranty: '2 Years Manufacturer Warranty',
    condition: 'new_sealed',
    purchasePrice: 260,
    salePrice: 350,
    stockQuantity: 8,
    minStockThreshold: 2,
    sellingUnit: 'Unit',
    barcode: '6935364010355',
    barcodeType: 'Code128'
  },

  // IT & Printer Professional Services
  {
    name: 'IT Service: Windows 11 Pro Clean Install, Drivers & Software Setup',
    sku: 'SRV-IT-OS-SETUP',
    category: 'Services & Repairs',
    itCategory: 'service',
    isServiceItem: true,
    serviceType: 'software',
    deviceSpecs: 'Full OS installation, genuine license activation, driver updates, antivirus & essential tools',
    warranty: '30 Days Software Guarantee',
    purchasePrice: 0,
    salePrice: 150,
    stockQuantity: 999,
    minStockThreshold: 0,
    sellingUnit: 'Job',
    internalNotes: 'Standard workshop software service'
  },
  {
    name: 'IT Service: Laptop Hardware Diagnostic & Screen/Battery Replacement Labor',
    sku: 'SRV-IT-LAP-REPAIR',
    category: 'Services & Repairs',
    itCategory: 'service',
    isServiceItem: true,
    serviceType: 'repair',
    deviceSpecs: 'Complete thermal paste re-pasting, fan cleaning, screen or battery installation service',
    warranty: '3 Months Repair Workmanship Warranty',
    purchasePrice: 0,
    salePrice: 180,
    stockQuantity: 999,
    minStockThreshold: 0,
    sellingUnit: 'Job',
    internalNotes: 'Hardware repair labor charge'
  },
  {
    name: 'Printer Service: Laser/Inkjet Deep Cleaning, Roller & Fuser Maintenance',
    sku: 'SRV-PRN-MAINT',
    category: 'Services & Repairs',
    itCategory: 'service',
    isServiceItem: true,
    serviceType: 'maintenance',
    printerModelCompatibility: 'Suitable for HP, Canon, Brother & Epson laser & tank printers',
    deviceSpecs: 'Pick-up roller chemical rejuvenation, paper jam removal, printhead purge & calibration',
    warranty: '30 Days Service Warranty',
    purchasePrice: 0,
    salePrice: 120,
    stockQuantity: 999,
    minStockThreshold: 0,
    sellingUnit: 'Job'
  },
  {
    name: 'IT Service: Annual Maintenance Contract (AMC) - Monthly Support per PC',
    sku: 'SRV-IT-AMC-MONTHLY',
    category: 'Services & Repairs',
    itCategory: 'service',
    isServiceItem: true,
    serviceType: 'amc',
    deviceSpecs: 'Proactive preventative monthly maintenance, scheduled backup, remote helpdesk & priority onsite visit',
    warranty: 'Continuous Active SLA',
    purchasePrice: 0,
    salePrice: 100,
    stockQuantity: 999,
    minStockThreshold: 0,
    sellingUnit: 'PC / Month'
  }
];

export default function ComputerManager({
  company,
  inventory,
  onSaveItem,
  onDeleteItem,
  onBulkAddItems,
  onCreateInvoiceWithItem
}: ComputerManagerProps) {
  const [activeCategory, setActiveCategory] = useState<ITFilterCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK'>('ALL');
  
  // Barcode & Thermal modal
  const [barcodeModalItem, setBarcodeModalItem] = useState<InventoryItem | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Edit / Add Item Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<InventoryItem> | null>(null);

  // Copied feedback helper
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Service & Repair Job Cards State (stored in localStorage keyed by company)
  const jobCardsStorageKey = `hisaab_job_cards_${company.id}`;
  const [jobCards, setJobCards] = useState<RepairJobCard[]>(() => {
    try {
      const saved = localStorage.getItem(jobCardsStorageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default starter job cards
    return [
      {
        id: 'job-101',
        ticketNumber: 'JOB-2026-081',
        customerName: 'Al Futtaim Digital Works',
        customerPhone: '+971 50 123 4567',
        deviceType: 'Laptop',
        deviceBrand: 'HP',
        deviceModel: 'ProBook 450 G8',
        serialNumber: '5CD1298491',
        accessories: 'Original 65W Blue-Pin AC Adapter & Laptop Sleeve',
        problemReported: 'Display flickering intermittently, slow performance when booting Windows',
        diagnosticNotes: 'Screen flex cable loose, thermal paste dried up causing CPU throttling to 1.1GHz',
        technicianName: 'Farhan / Senior Tech',
        estimatedCost: 350,
        advancePaid: 100,
        status: 'Testing',
        receivedDate: '2026-09-18'
      },
      {
        id: 'job-102',
        ticketNumber: 'JOB-2026-082',
        customerName: 'Gulf Express Logistics LLC',
        customerPhone: '+971 55 987 6543',
        deviceType: 'Printer',
        deviceBrand: 'HP',
        deviceModel: 'LaserJet MFP M428fdw',
        serialNumber: 'VNB3B01924',
        accessories: 'Power cord only',
        problemReported: 'Paper jam error 13.00.00 repeated on tray 2; black vertical lines on printed invoices',
        diagnosticNotes: 'Pickup rollers worn out, drum wiper blade damaged; required roller kit & cleaning',
        technicianName: 'Sajid IT Support',
        estimatedCost: 280,
        advancePaid: 0,
        status: 'Ready for Pickup',
        receivedDate: '2026-09-19'
      }
    ];
  });

  const saveJobCards = (cards: RepairJobCard[]) => {
    setJobCards(cards);
    try {
      localStorage.setItem(jobCardsStorageKey, JSON.stringify(cards));
    } catch (e) {
      console.error(e);
    }
  };

  // Job Card Create/Edit Modal
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Partial<RepairJobCard> | null>(null);

  // Format AED Currency helper
  const formatAED = (amount: number) => `AED ${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Filter company items
  const filteredItems = useMemo(() => {
    return inventory.filter(item => {
      // Industry check: if specific computer category is set or general
      const itCat = item.itCategory || '';
      const isComputerRelated = 
        item.itCategory !== undefined || 
        (item.category && item.category.toLowerCase().includes('computer')) ||
        (item.category && item.category.toLowerCase().includes('laptop')) ||
        (item.category && item.category.toLowerCase().includes('printer')) ||
        (item.category && item.category.toLowerCase().includes('toner')) ||
        (item.category && item.category.toLowerCase().includes('service')) ||
        item.serialNumber ||
        item.deviceSpecs ||
        item.printerModelCompatibility;

      // Category filter
      if (activeCategory === 'LAPTOP_DESKTOP') {
        if (itCat !== 'laptop' && itCat !== 'desktop' && !item.name.toLowerCase().includes('laptop') && !item.name.toLowerCase().includes('desktop')) return false;
      } else if (activeCategory === 'PRINTERS') {
        if (itCat !== 'printer' && !item.name.toLowerCase().includes('printer') && !item.name.toLowerCase().includes('copier')) return false;
      } else if (activeCategory === 'TONERS') {
        if (itCat !== 'toner' && !item.name.toLowerCase().includes('toner') && !item.name.toLowerCase().includes('ink')) return false;
      } else if (activeCategory === 'COMPONENTS') {
        if (itCat !== 'component' && !item.name.toLowerCase().includes('ssd') && !item.name.toLowerCase().includes('ram')) return false;
      } else if (activeCategory === 'NETWORKING') {
        if (itCat !== 'networking' && itCat !== 'accessory' && !item.name.toLowerCase().includes('router') && !item.name.toLowerCase().includes('switch')) return false;
      } else if (activeCategory === 'SERVICES') {
        if (!item.isServiceItem && itCat !== 'service' && !item.name.toLowerCase().includes('service')) return false;
      }

      // Brand Filter
      if (brandFilter !== 'ALL') {
        if (item.brand?.toLowerCase() !== brandFilter.toLowerCase()) return false;
      }

      // Stock filter
      if (stockFilter === 'IN_STOCK' && item.stockQuantity <= 0 && !item.isServiceItem) return false;
      if (stockFilter === 'LOW_STOCK' && (item.stockQuantity > item.minStockThreshold || item.isServiceItem)) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchSku = item.sku?.toLowerCase().includes(q);
        const matchSN = item.serialNumber?.toLowerCase().includes(q);
        const matchSpecs = item.deviceSpecs?.toLowerCase().includes(q);
        const matchPrinter = item.printerModelCompatibility?.toLowerCase().includes(q);
        const matchBarcode = item.barcode?.toLowerCase().includes(q);
        const matchBrand = item.brand?.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchSN && !matchSpecs && !matchPrinter && !matchBarcode && !matchBrand) {
          return false;
        }
      }

      return true;
    });
  }, [inventory, activeCategory, brandFilter, stockFilter, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalHardwareStock = 0;
    let hardwareValue = 0;
    let totalLaptops = 0;
    let totalPrinters = 0;
    let totalToners = 0;
    let lowStockCount = 0;

    inventory.forEach(item => {
      if (!item.isServiceItem) {
        totalHardwareStock += (item.stockQuantity || 0);
        hardwareValue += ((item.stockQuantity || 0) * (item.salePrice || 0));
        if (item.stockQuantity <= item.minStockThreshold) {
          lowStockCount++;
        }
      }
      if (item.itCategory === 'laptop' || item.itCategory === 'desktop' || item.name.toLowerCase().includes('laptop')) {
        totalLaptops += (item.stockQuantity || 0);
      }
      if (item.itCategory === 'printer' || item.name.toLowerCase().includes('printer')) {
        totalPrinters += (item.stockQuantity || 0);
      }
      if (item.itCategory === 'toner' || item.name.toLowerCase().includes('toner') || item.name.toLowerCase().includes('ink')) {
        totalToners += (item.stockQuantity || 0);
      }
    });

    return {
      totalHardwareStock,
      hardwareValue,
      totalLaptops,
      totalPrinters,
      totalToners,
      lowStockCount,
      activeJobs: jobCards.filter(j => j.status !== 'Delivered').length
    };
  }, [inventory, jobCards]);

  // Handle Quick Pre-seed
  const handleSeedCatalog = () => {
    if (!onBulkAddItems) return;
    const existingSkus = new Set(inventory.map(i => i.sku.toLowerCase()));
    const itemsToAdd = SEED_COMPUTER_PRINTER_CATALOG.filter(s => !existingSkus.has((s.sku || '').toLowerCase()));
    if (itemsToAdd.length === 0) {
      alert('All Computer, Printer and Service starter items already exist in your catalog.');
      return;
    }
    onBulkAddItems(itemsToAdd);
    alert(`Successfully loaded ${itemsToAdd.length} specialized Computer, Printer, Toner & IT Service products into your catalog!`);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingItem({
      name: '',
      sku: `IT-${Date.now().toString().slice(-5)}`,
      category: 'Computers & IT',
      brand: 'HP',
      itCategory: 'laptop',
      condition: 'new_sealed',
      warranty: '1 Year Official Warranty',
      purchasePrice: 0,
      salePrice: 0,
      stockQuantity: 1,
      minStockThreshold: 1,
      sellingUnit: 'Unit',
      barcode: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      barcodeType: 'Code128'
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name?.trim()) return;
    onSaveItem(editingItem);
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Save Job Card
  const handleSaveJobCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob || !editingJob.customerName) return;

    if (editingJob.id) {
      saveJobCards(jobCards.map(j => j.id === editingJob.id ? { ...j, ...editingJob } as RepairJobCard : j));
    } else {
      const newCard: RepairJobCard = {
        id: `job-${Date.now()}`,
        ticketNumber: `JOB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        customerName: editingJob.customerName || '',
        customerPhone: editingJob.customerPhone || '',
        deviceType: editingJob.deviceType || 'Laptop',
        deviceBrand: editingJob.deviceBrand || '',
        deviceModel: editingJob.deviceModel || '',
        serialNumber: editingJob.serialNumber || '',
        accessories: editingJob.accessories || '',
        problemReported: editingJob.problemReported || '',
        diagnosticNotes: editingJob.diagnosticNotes || '',
        technicianName: editingJob.technicianName || 'Master Tech',
        estimatedCost: Number(editingJob.estimatedCost || 0),
        advancePaid: Number(editingJob.advancePaid || 0),
        status: editingJob.status || 'Received',
        receivedDate: editingJob.receivedDate || new Date().toISOString().split('T')[0]
      };
      saveJobCards([newCard, ...jobCards]);
    }
    setIsJobModalOpen(false);
    setEditingJob(null);
  };

  const handleDeleteJobCard = (id: string) => {
    if (window.confirm('Delete this repair job ticket?')) {
      saveJobCards(jobCards.filter(j => j.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* TOP HERO BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 text-white border border-indigo-900/50 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30 backdrop-blur-xs">
                <Monitor className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                  <span>Computer, IT & Printer Inventory Hub</span>
                  <span className="text-[11px] bg-blue-500/20 text-blue-300 font-mono px-2 py-0.5 rounded-full border border-blue-400/30">
                    IT & Printers Hub
                  </span>
                </h1>
                <p className="text-xs text-slate-300 mt-0.5">
                  Unified catalog for computers, laptops, printers, toners, IT repair job cards & serial numbers.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <BarcodeIcon className="w-4 h-4" />
              <span>Scan S/N or Barcode</span>
            </button>

            <button
              onClick={handleSeedCatalog}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-indigo-600/30"
              title="Add popular Dell/HP laptops, Canon/HP printers, toners, and services to your inventory"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>⚡ Load Starter Catalog</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-blue-500/30"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add IT Product / Service</span>
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/60 backdrop-blur-xs rounded-xl p-3 border border-slate-700/50">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Laptop className="w-3.5 h-3.5 text-blue-400" />
              <span>Laptops & PCs</span>
            </div>
            <div className="text-lg font-black font-mono text-white mt-0.5">{metrics.totalLaptops} Units</div>
            <div className="text-[9.5px] text-slate-400">Tracked with S/N</div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs rounded-xl p-3 border border-slate-700/50">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Printers & Copiers</span>
            </div>
            <div className="text-lg font-black font-mono text-white mt-0.5">{metrics.totalPrinters} Units</div>
            <div className="text-[9.5px] text-slate-400">Laser & Ink Tank</div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs rounded-xl p-3 border border-slate-700/50">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-cyan-400" />
              <span>Toners & Cartridges</span>
            </div>
            <div className="text-lg font-black font-mono text-white mt-0.5">{metrics.totalToners} Pcs</div>
            <div className="text-[9.5px] text-slate-400">HP, Canon, Brother</div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs rounded-xl p-3 border border-slate-700/50">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
              <span>Active Repair Tickets</span>
            </div>
            <div className="text-lg font-black font-mono text-amber-300 mt-0.5">{metrics.activeJobs} Jobs</div>
            <div className="text-[9.5px] text-slate-400">Workshop service queue</div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs rounded-xl p-3 border border-slate-700/50">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Low Stock Alerts</span>
            </div>
            <div className={`text-lg font-black font-mono mt-0.5 ${metrics.lowStockCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {metrics.lowStockCount} Items
            </div>
            <div className="text-[9.5px] text-slate-400">Needs restock</div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs rounded-xl p-3 border border-slate-700/50">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-purple-400" />
              <span>Total IT Valuation</span>
            </div>
            <div className="text-base font-black font-mono text-emerald-300 mt-0.5 truncate">{formatAED(metrics.hardwareValue)}</div>
            <div className="text-[9.5px] text-slate-400">{metrics.totalHardwareStock} Total Products</div>
          </div>
        </div>
      </div>

      {/* FILTER & CATEGORY TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
              activeCategory === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Products & IT ({inventory.length})
          </button>

          <button
            onClick={() => setActiveCategory('LAPTOP_DESKTOP')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeCategory === 'LAPTOP_DESKTOP'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Laptops & PCs</span>
          </button>

          <button
            onClick={() => setActiveCategory('PRINTERS')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeCategory === 'PRINTERS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Printers & Copiers</span>
          </button>

          <button
            onClick={() => setActiveCategory('TONERS')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeCategory === 'TONERS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Toners & Inks</span>
          </button>

          <button
            onClick={() => setActiveCategory('COMPONENTS')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeCategory === 'COMPONENTS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>SSDs & RAM</span>
          </button>

          <button
            onClick={() => setActiveCategory('NETWORKING')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeCategory === 'NETWORKING'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Networking</span>
          </button>

          <button
            onClick={() => setActiveCategory('SERVICES')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeCategory === 'SERVICES'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>IT & Repair Services</span>
          </button>

          <button
            onClick={() => setActiveCategory('JOB_CARDS')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeCategory === 'JOB_CARDS'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Repair Job Tickets ({jobCards.length})</span>
          </button>
        </div>

        {activeCategory === 'JOB_CARDS' && (
          <button
            onClick={() => {
              setEditingJob({
                deviceType: 'Laptop',
                status: 'Received',
                receivedDate: new Date().toISOString().split('T')[0],
                technicianName: 'Workshop Tech',
                estimatedCost: 150,
                advancePaid: 0
              });
              setIsJobModalOpen(true);
            }}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New Job Card</span>
          </button>
        )}
      </div>

      {/* SEARCH AND FILTERS (WHEN IN PRODUCT TABS) */}
      {activeCategory !== 'JOB_CARDS' && (
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Computer name, S/N, Specs, Printer compatibility, Barcode..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="sm:col-span-3">
            <select
              value={brandFilter}
              onChange={e => setBrandFilter(e.target.value)}
              className="w-full text-xs py-2 px-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-hidden focus:border-blue-500"
            >
              <option value="ALL">All Brands (HP, Dell, Canon...)</option>
              {POPULAR_COMPUTER_BRANDS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={stockFilter}
              onChange={e => setStockFilter(e.target.value as any)}
              className="w-full text-xs py-2 px-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-hidden focus:border-blue-500"
            >
              <option value="ALL">All Stock Status</option>
              <option value="IN_STOCK">In Stock Only</option>
              <option value="LOW_STOCK">Low Stock / Reorder Needed</option>
            </select>
          </div>
        </div>
      )}

      {/* CONTENT AREA: PRODUCT CATALOG */}
      {activeCategory !== 'JOB_CARDS' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3.5">Device / Product & Brand</th>
                  <th className="py-3 px-3.5">Serial Number (S/N) / Barcode</th>
                  <th className="py-3 px-3.5">Specs / Printer Compatibility</th>
                  <th className="py-3 px-3.5">Warranty & Condition</th>
                  <th className="py-3 px-3.5 text-center">Stock</th>
                  <th className="py-3 px-3.5 text-right">Cost</th>
                  <th className="py-3 px-3.5 text-right">Price (AED)</th>
                  <th className="py-3 px-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Monitor className="w-8 h-8 text-slate-300" />
                        <p className="font-semibold text-sm">No computer or printer products match your filter.</p>
                        <p className="text-xs">Click "+ Add IT Product" or "⚡ Load Starter Catalog" to get started instantly.</p>
                        <button
                          onClick={handleSeedCatalog}
                          className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Load Dell, HP, Canon Catalog
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(item => {
                    const isLowStock = !item.isServiceItem && item.stockQuantity <= item.minStockThreshold;
                    const isOutOfStock = !item.isServiceItem && item.stockQuantity <= 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="flex items-start space-x-2.5">
                            <span className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200/50 dark:border-blue-900/50 mt-0.5">
                              {item.itCategory === 'laptop' ? <Laptop className="w-4 h-4" /> :
                               item.itCategory === 'desktop' ? <Monitor className="w-4 h-4" /> :
                               item.itCategory === 'printer' ? <Printer className="w-4 h-4" /> :
                               item.itCategory === 'toner' ? <Tag className="w-4 h-4" /> :
                               item.itCategory === 'service' ? <Wrench className="w-4 h-4" /> :
                               item.itCategory === 'component' ? <HardDrive className="w-4 h-4" /> :
                               item.itCategory === 'networking' ? <Wifi className="w-4 h-4" /> :
                               <Package className="w-4 h-4" />}
                            </span>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                <span>{item.name}</span>
                                {item.isServiceItem && (
                                  <span className="text-[9px] bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold px-1.5 py-0.2 rounded-sm border border-purple-200">
                                    Service / Labor
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{item.brand || 'Universal'}</span>
                                <span>•</span>
                                <span>SKU: {item.sku}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3.5 font-mono">
                          {item.serialNumber ? (
                            <div className="flex items-center gap-1.5">
                              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                                S/N: {item.serialNumber}
                              </span>
                              <button
                                onClick={() => handleCopy(item.serialNumber!, `sn-${item.id}`)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                                title="Copy Serial Number"
                              >
                                {copiedId === `sn-${item.id}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          ) : item.barcode ? (
                            <div className="text-[10px] text-slate-500">
                              <span>Bar: {item.barcode}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">No S/N assigned</span>
                          )}
                        </td>

                        <td className="py-3 px-3.5 max-w-xs">
                          {item.deviceSpecs && (
                            <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate" title={item.deviceSpecs}>
                              {item.deviceSpecs}
                            </div>
                          )}
                          {item.printerModelCompatibility && (
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                              <span className="font-bold">Compatible:</span>
                              <span className="truncate" title={item.printerModelCompatibility}>{item.printerModelCompatibility}</span>
                            </div>
                          )}
                          {!item.deviceSpecs && !item.printerModelCompatibility && (
                            <span className="text-slate-400 text-[10px]">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="flex flex-col gap-0.5">
                            {item.warranty && (
                              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                <span>{item.warranty}</span>
                              </span>
                            )}
                            <span className="text-[9.5px] text-slate-500">
                              {item.condition === 'new_sealed' ? 'Factory Sealed New' :
                               item.condition === 'refurbished' ? 'Certified Refurbished' :
                               item.condition === 'used' ? 'Used / Tested' : (item.condition || 'Standard')}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3.5 text-center">
                          {item.isServiceItem ? (
                            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full">
                              Unlimited
                            </span>
                          ) : (
                            <div className="inline-flex flex-col items-center">
                              <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-md ${
                                isOutOfStock ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' :
                                isLowStock ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' :
                                'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                              }`}>
                                {item.stockQuantity} {item.sellingUnit || 'Unit'}
                              </span>
                              {isLowStock && (
                                <span className="text-[8.5px] text-rose-500 font-bold mt-0.5">Low Stock</span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3.5 text-right font-mono text-slate-500 text-[11px]">
                          {formatAED(item.purchasePrice)}
                        </td>

                        <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                          {formatAED(item.salePrice)}
                        </td>

                        <td className="py-3 px-3.5 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => setBarcodeModalItem(item)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                              title="Print Thermal Barcode / Serial Label"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {onCreateInvoiceWithItem && (
                              <button
                                onClick={() => onCreateInvoiceWithItem(item)}
                                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                                title="Create Sales Invoice with this Item"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                              title="Edit Item Details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to remove "${item.name}"?`)) {
                                  onDeleteItem(item.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENT AREA: REPAIR JOB CARDS */}
      {activeCategory === 'JOB_CARDS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobCards.map(job => {
              const statusColors: Record<string, string> = {
                'Received': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
                'In Diagnosis': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
                'Awaiting Parts': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300',
                'Testing': 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300',
                'Ready for Pickup': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold',
                'Delivered': 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
              };

              return (
                <div key={job.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                        {job.ticketNumber}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColors[job.status] || 'bg-slate-100 text-slate-700'}`}>
                        {job.status}
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{job.customerName}</span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{job.customerPhone}</span>
                      </div>
                    </div>

                    <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        {job.deviceType === 'Printer' ? <Printer className="w-3.5 h-3.5 text-emerald-500" /> : <Laptop className="w-3.5 h-3.5 text-blue-500" />}
                        <span>{job.deviceBrand} {job.deviceModel}</span>
                      </div>
                      {job.serialNumber && (
                        <div className="text-[10.5px] font-mono text-slate-500 mt-0.5">
                          S/N: {job.serialNumber}
                        </div>
                      )}
                      <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
                        <span className="font-bold text-slate-700 dark:text-slate-200">Fault: </span>
                        <span>{job.problemReported}</span>
                      </div>
                      {job.diagnosticNotes && (
                        <div className="mt-1 text-[10.5px] text-blue-700 dark:text-blue-300">
                          <span className="font-bold">Tech note: </span>{job.diagnosticNotes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Estimate</span>
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                        {formatAED(job.estimatedCost)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingJob(job);
                          setIsJobModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Update</span>
                      </button>

                      <button
                        onClick={() => handleDeleteJobCard(job.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        title="Delete Ticket"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PRODUCT */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold">
                  {editingItem.id ? 'Edit Computer / Printer Product' : 'Add New IT Product / Service'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Product / Device Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.name || ''}
                    onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                    placeholder="e.g., HP ProBook 450 G10 or HP 76A Toner Cartridge"
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Category Type
                  </label>
                  <select
                    value={editingItem.itCategory || 'laptop'}
                    onChange={e => setEditingItem({ 
                      ...editingItem, 
                      itCategory: e.target.value as any,
                      isServiceItem: e.target.value === 'service'
                    })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 cursor-pointer"
                  >
                    <option value="laptop">Laptop / Notebook</option>
                    <option value="desktop">Desktop PC / Workstation</option>
                    <option value="printer">Laser Printer / Copier</option>
                    <option value="toner">Toner / Ink Cartridge</option>
                    <option value="component">SSD / RAM / Storage</option>
                    <option value="networking">Networking (Router / Switch)</option>
                    <option value="accessory">Keyboard, Mouse & Monitor</option>
                    <option value="service">IT Repair & Maintenance Service</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Brand / Manufacturer
                  </label>
                  <input
                    type="text"
                    value={editingItem.brand || ''}
                    onChange={e => setEditingItem({ ...editingItem, brand: e.target.value })}
                    placeholder="e.g., HP, Dell, Canon, Epson, Kingston"
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Serial Number (S/N / Asset Tag)
                  </label>
                  <input
                    type="text"
                    value={editingItem.serialNumber || ''}
                    onChange={e => setEditingItem({ ...editingItem, serialNumber: e.target.value })}
                    placeholder="e.g., 5CD3429188"
                    className="w-full text-xs px-3 py-2 font-mono font-bold border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Barcode / SKU
                  </label>
                  <input
                    type="text"
                    value={editingItem.sku || ''}
                    onChange={e => setEditingItem({ ...editingItem, sku: e.target.value })}
                    placeholder="e.g., LAP-HP-001"
                    className="w-full text-xs px-3 py-2 font-mono border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Hardware Specs (CPU, RAM, SSD, Display)
                  </label>
                  <input
                    type="text"
                    value={editingItem.deviceSpecs || ''}
                    onChange={e => setEditingItem({ ...editingItem, deviceSpecs: e.target.value })}
                    placeholder="e.g., Core i7-1355U, 16GB DDR5, 512GB NVMe SSD, 15.6 Inch FHD"
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Printer Compatibility / Cartridge Model (For Toners & Printers)
                  </label>
                  <input
                    type="text"
                    value={editingItem.printerModelCompatibility || ''}
                    onChange={e => setEditingItem({ ...editingItem, printerModelCompatibility: e.target.value })}
                    placeholder="e.g., Compatible with HP LaserJet Pro M404, M428 Series / 3,000 pages yield"
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Warranty Duration
                  </label>
                  <input
                    type="text"
                    value={editingItem.warranty || ''}
                    onChange={e => setEditingItem({ ...editingItem, warranty: e.target.value })}
                    placeholder="e.g., 1 Year Official HP / 3 Months Testing"
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Condition
                  </label>
                  <select
                    value={editingItem.condition || 'new_sealed'}
                    onChange={e => setEditingItem({ ...editingItem, condition: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 cursor-pointer"
                  >
                    <option value="new_sealed">Brand New Factory Sealed</option>
                    <option value="refurbished">Certified Refurbished</option>
                    <option value="used">Used Clean / Tested</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Purchase Cost (AED)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.purchasePrice || 0}
                    onChange={e => setEditingItem({ ...editingItem, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 font-mono border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Selling Price (AED) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingItem.salePrice || 0}
                    onChange={e => setEditingItem({ ...editingItem, salePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 font-mono font-bold border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={editingItem.stockQuantity ?? 1}
                    onChange={e => setEditingItem({ ...editingItem, stockQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 font-mono border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Min Stock Threshold
                  </label>
                  <input
                    type="number"
                    value={editingItem.minStockThreshold ?? 1}
                    onChange={e => setEditingItem({ ...editingItem, minStockThreshold: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 font-mono border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all cursor-pointer shadow-md shadow-blue-600/20"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / UPDATE JOB CARD */}
      {isJobModalOpen && editingJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold">
                  {editingJob.id ? `Update Repair Ticket (${editingJob.ticketNumber})` : 'New Computer / Printer Repair Job Card'}
                </h3>
              </div>
              <button
                onClick={() => setIsJobModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJobCard} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingJob.customerName || ''}
                    onChange={e => setEditingJob({ ...editingJob, customerName: e.target.value })}
                    placeholder="e.g., Tariq Al Mansoori"
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Customer Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingJob.customerPhone || ''}
                    onChange={e => setEditingJob({ ...editingJob, customerPhone: e.target.value })}
                    placeholder="+971 50 123 4567"
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Device Type
                  </label>
                  <select
                    value={editingJob.deviceType || 'Laptop'}
                    onChange={e => setEditingJob({ ...editingJob, deviceType: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 cursor-pointer"
                  >
                    <option value="Laptop">Laptop / Notebook</option>
                    <option value="Desktop PC">Desktop PC / Workstation</option>
                    <option value="Printer">Laser / Inkjet Printer</option>
                    <option value="MacBook / iMac">MacBook / Apple Mac</option>
                    <option value="Other">Other Electronic Device</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Brand & Model
                  </label>
                  <input
                    type="text"
                    value={`${editingJob.deviceBrand || ''} ${editingJob.deviceModel || ''}`.trim()}
                    onChange={e => {
                      const parts = e.target.value.split(' ');
                      setEditingJob({ 
                        ...editingJob, 
                        deviceBrand: parts[0] || '', 
                        deviceModel: parts.slice(1).join(' ') 
                      });
                    }}
                    placeholder="e.g., HP LaserJet M404n or Dell Latitude"
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Serial Number (S/N)
                  </label>
                  <input
                    type="text"
                    value={editingJob.serialNumber || ''}
                    onChange={e => setEditingJob({ ...editingJob, serialNumber: e.target.value })}
                    placeholder="e.g., 5CD3429188"
                    className="w-full text-xs px-3 py-2 font-mono font-bold border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Job Status
                  </label>
                  <select
                    value={editingJob.status || 'Received'}
                    onChange={e => setEditingJob({ ...editingJob, status: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 cursor-pointer font-bold text-blue-600"
                  >
                    <option value="Received">Received</option>
                    <option value="In Diagnosis">In Diagnosis</option>
                    <option value="Awaiting Parts">Awaiting Parts</option>
                    <option value="Testing">Testing</option>
                    <option value="Ready for Pickup">Ready for Pickup</option>
                    <option value="Delivered">Delivered & Invoiced</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Accessories Received with Device
                  </label>
                  <input
                    type="text"
                    value={editingJob.accessories || ''}
                    onChange={e => setEditingJob({ ...editingJob, accessories: e.target.value })}
                    placeholder="e.g., Original Charger, Power cord, Laptop Bag, Toner cartridge"
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Problem Reported by Customer *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={editingJob.problemReported || ''}
                    onChange={e => setEditingJob({ ...editingJob, problemReported: e.target.value })}
                    placeholder="Describe fault (e.g., No Display, Roller paper jam, Windows crash...)"
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Diagnostic / Solution Notes
                  </label>
                  <textarea
                    rows={2}
                    value={editingJob.diagnosticNotes || ''}
                    onChange={e => setEditingJob({ ...editingJob, diagnosticNotes: e.target.value })}
                    placeholder="Technician actions, parts replaced, software installed..."
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Estimated Total Cost (AED)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingJob.estimatedCost || 0}
                    onChange={e => setEditingJob({ ...editingJob, estimatedCost: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 font-mono font-bold border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Advance Payment Received (AED)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingJob.advancePaid || 0}
                    onChange={e => setEditingJob({ ...editingJob, advancePaid: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 font-mono border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsJobModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-all cursor-pointer shadow-md shadow-amber-500/20"
                >
                  Save Job Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BARCODE / THERMAL LABEL */}
      {barcodeModalItem && (
        <BarcodeLabelModal
          isOpen={Boolean(barcodeModalItem)}
          company={company}
          inventory={inventory}
          initialSelectedItem={barcodeModalItem}
          onClose={() => setBarcodeModalItem(null)}
        />
      )}

      {/* SCANNER MODAL */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(code) => {
          setIsScannerOpen(false);
          playBeepSound();
          setSearchQuery(code);
        }}
      />
    </div>
  );
}
