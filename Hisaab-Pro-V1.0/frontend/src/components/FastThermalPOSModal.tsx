import React, { useState, useEffect, useRef, useMemo } from 'react';
import QRCode from 'qrcode';
import { 
  Zap, 
  Search, 
  Barcode as BarcodeIcon, 
  Trash2, 
  Plus, 
  Minus, 
  Printer, 
  Check, 
  RefreshCw, 
  User, 
  CreditCard, 
  DollarSign, 
  Layers, 
  Clock, 
  X, 
  ArrowLeft,
  Percent,
  Receipt,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Download,
  PauseCircle,
  PlayCircle,
  PlusCircle,
  Tag,
  Phone,
  Building2,
  Coins
} from 'lucide-react';
import { Company, Customer, InventoryItem, SalesDocument, DocumentItem, Staff } from '../types';
import { triggerPrint } from '../utils/printHelper';
import { generateAndDownloadPDF } from '../utils/pdfCanvasSanitizer';
import { BarcodeScannerModal, playBeepSound } from './BarcodeScannerModal';

interface FastThermalPOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  company?: Company;
  customers?: Customer[];
  inventory?: InventoryItem[];
  staff?: Staff[];
  documents?: SalesDocument[];
  onAddDocument: (doc: Omit<SalesDocument, 'id' | 'companyId'> & { id?: string }) => SalesDocument | void;
  onAddCustomer?: (cust: Omit<Customer, 'id' | 'companyId'>) => void;
  onDeductStock?: (itemId: string, qty: number) => void;
  onOpenCustomerModal?: () => void;
}

interface ParkedOrder {
  id: string;
  timestamp: string;
  timeStr: string;
  customer: Customer;
  items: DocumentItem[];
  discountPercent: number;
  paymentMode: 'Cash' | 'Card' | 'Split' | 'Credit';
  notes: string;
  grandTotal: number;
}

// Built-in starter quick products for companies with zero registered inventory
const DEFAULT_QUICK_PRESETS = [
  { id: 'quick_gen_1', name: 'General Retail Item', price: 10.00, sku: 'GEN-001', category: 'General' },
  { id: 'quick_gen_2', name: 'Express Snack / Drink', price: 5.00, sku: 'SNK-002', category: 'Beverage' },
  { id: 'quick_gen_3', name: 'Counter Beverage', price: 15.00, sku: 'BEV-003', category: 'Beverage' },
  { id: 'quick_gen_4', name: 'Quick Food / Bakery', price: 20.00, sku: 'FD-004', category: 'Food' },
  { id: 'quick_gen_5', name: 'Standard Service Fee', price: 50.00, sku: 'SRV-005', category: 'Services' },
  { id: 'quick_gen_6', name: 'Express Repair / Service', price: 100.00, sku: 'REP-006', category: 'Services' },
  { id: 'quick_gen_7', name: 'Delivery / Courier Fee', price: 25.00, sku: 'DLV-007', category: 'Logistics' },
  { id: 'quick_gen_8', name: 'Premium Package Item', price: 250.00, sku: 'PKG-008', category: 'General' }
];

export const FastThermalPOSModal: React.FC<FastThermalPOSModalProps> = ({
  isOpen,
  onClose,
  company,
  customers = [],
  inventory = [],
  staff = [],
  documents = [],
  onAddDocument,
  onAddCustomer,
  onDeductStock
}) => {
  if (!isOpen) return null;

  // Safe fallback company
  const safeCompany: Company = (company || {
    id: 'default_co',
    name: 'Hisaab Express POS Store',
    currency: 'AED',
    currencySymbol: 'AED',
    trn: '100234567890003',
    address: 'Deira Commercial Center, Dubai, United Arab Emirates',
    phone: '+971 4 200 0000',
    email: 'pos@hisaabpro.ae',
    vatEnabled: true,
    inventoryEnabled: true,
    invoicePrefix: 'POS-',
    nextInvoiceNumber: 1001,
    invoicePaperSize: 'Thermal',
    footerNotes: 'Thank you for shopping with us!'
  }) as Company;

  // Selected customer (defaults to Walk-in Cash Customer)
  const defaultWalkInCustomer: Customer = useMemo(() => {
    const found = customers.find(c => 
      (c.companyId === safeCompany.id || !c.companyId) && 
      (c.name.toLowerCase().includes('walk-in') || c.name.toLowerCase().includes('cash customer'))
    );
    if (found) return found;
    return {
      id: 'walk_in_pos_default',
      companyId: safeCompany.id,
      name: 'Walk-in Cash Customer',
      emirate: 'Dubai',
      phone: '0500000000',
      trn: '',
      address: 'Counter Sales, UAE'
    } as Customer;
  }, [customers, safeCompany.id]);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(defaultWalkInCustomer);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);

  // New quick customer form state
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmirate, setNewCustEmirate] = useState<'Dubai' | 'Sharjah' | 'Abu Dhabi' | 'Fujairah' | 'Ras Al Khaimah' | 'Ajman' | 'Umm Al Quwain'>('Dubai');
  const [newCustTrn, setNewCustTrn] = useState('');

  // Active cashier
  const [selectedStaffId, setSelectedStaffId] = useState<string>(() => {
    const activeStaff = staff.find(s => s.companyId === safeCompany.id && s.role === 'Staff');
    return activeStaff ? activeStaff.id : (staff[0]?.id || 'cashier_1');
  });

  // Cart line items
  const [cartItems, setCartItems] = useState<DocumentItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState<string>('Counter POS Sale');

  // Search & Barcode
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isBarcodeCameraOpen, setIsBarcodeCameraOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Custom / Manual Item Input Form State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickItemName, setQuickItemName] = useState('');
  const [quickItemPrice, setQuickItemPrice] = useState<number | ''>('');
  const [quickItemQty, setQuickItemQty] = useState<number>(1);

  // Parked / Held Orders
  const [parkedOrders, setParkedOrders] = useState<ParkedOrder[]>(() => {
    try {
      const saved = localStorage.getItem(`hisaab_pos_parked_${safeCompany.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showParkedModal, setShowParkedModal] = useState(false);

  // Payment Tender State: 'Cash' | 'Card' | 'Split' | 'Credit'
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Card' | 'Split' | 'Credit'>('Cash');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [cardTendered, setCardTendered] = useState<number>(0);
  const [thermalReceiptSize, setThermalReceiptSize] = useState<'80mm' | '58mm'>('80mm');

  // Checkout modal / Print receipt preview
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [completedDoc, setCompletedDoc] = useState<SalesDocument | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Save parked orders
  useEffect(() => {
    try {
      localStorage.setItem(`hisaab_pos_parked_${safeCompany.id}`, JSON.stringify(parkedOrders));
    } catch {
      // ignore
    }
  }, [parkedOrders, safeCompany.id]);

  // Sound feedback
  const playCashSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {
      // ignore
    }
  };

  // Currency helper
  const currency = safeCompany.currency || 'AED';
  const formatAED = (val: number) => {
    const symbol = safeCompany.currencySymbol || currency;
    return `${symbol} ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Effective catalog list: combine company items or fallback to default starter items if empty
  const effectiveCatalog: InventoryItem[] = useMemo(() => {
    const companyItems = inventory.filter(i => i.companyId === safeCompany.id || !i.companyId);
    if (companyItems.length > 0) {
      return companyItems;
    }
    // Return standard UAE starter quick items
    return DEFAULT_QUICK_PRESETS.map(p => ({
      id: p.id,
      companyId: safeCompany.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      vatType: 'standard' as const,
      vatRate: 5,
      purchasePrice: Number((p.price * 0.6).toFixed(2)),
      salePrice: p.price,
      stockQuantity: 999,
      minStockThreshold: 10,
      barcode: p.sku
    }));
  }, [inventory, safeCompany.id]);

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set<string>();
    effectiveCatalog.forEach(i => {
      if (i.category) cats.add(i.category);
    });
    return ['ALL', ...Array.from(cats)];
  }, [effectiveCatalog]);

  // Filtered inventory catalog
  const filteredInventory = useMemo(() => {
    const q = itemSearchQuery.trim().toLowerCase();
    return effectiveCatalog.filter(i => {
      if (selectedCategory !== 'ALL' && i.category !== selectedCategory) return false;
      if (!q) return true;
      const nameMatch = (i.name || '').toLowerCase().includes(q);
      const skuMatch = (i.sku || '').toLowerCase().includes(q);
      const barcodeMatch = (i.barcode || '').toLowerCase().includes(q);
      return nameMatch || skuMatch || barcodeMatch;
    });
  }, [effectiveCatalog, selectedCategory, itemSearchQuery]);

  // Calculations
  const grossSubtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    if (discountPercent <= 0) return 0;
    return (grossSubtotal * discountPercent) / 100;
  }, [grossSubtotal, discountPercent]);

  const netTaxableSubtotal = useMemo(() => {
    return Math.max(0, grossSubtotal - discountAmount);
  }, [grossSubtotal, discountAmount]);

  const vatTotal = useMemo(() => {
    // 5% standard UAE VAT
    return Number((netTaxableSubtotal * 0.05).toFixed(2));
  }, [netTaxableSubtotal]);

  const grandTotal = useMemo(() => {
    return Number((netTaxableSubtotal + vatTotal).toFixed(2));
  }, [netTaxableSubtotal, vatTotal]);

  // Balance & change calculation
  const totalPaid = useMemo(() => {
    if (paymentMode === 'Cash') return cashTendered;
    if (paymentMode === 'Card') return cardTendered;
    if (paymentMode === 'Split') return Number((cashTendered + cardTendered).toFixed(2));
    if (paymentMode === 'Credit') return 0;
    return cashTendered;
  }, [paymentMode, cashTendered, cardTendered]);

  const changeDue = useMemo(() => {
    if (paymentMode === 'Credit') return 0;
    return Math.max(0, totalPaid - grandTotal);
  }, [paymentMode, totalPaid, grandTotal]);

  const remainingBalance = useMemo(() => {
    if (paymentMode === 'Credit') return grandTotal;
    return Math.max(0, grandTotal - totalPaid);
  }, [paymentMode, grandTotal, totalPaid]);

  // Auto-set tender when grandTotal changes or mode switches
  useEffect(() => {
    if (paymentMode === 'Cash') {
      setCashTendered(grandTotal);
      setCardTendered(0);
    } else if (paymentMode === 'Card') {
      setCardTendered(grandTotal);
      setCashTendered(0);
    } else if (paymentMode === 'Split') {
      if (cashTendered === 0 && cardTendered === 0) {
        const half = Math.round(grandTotal / 2);
        setCashTendered(half);
        setCardTendered(Number((grandTotal - half).toFixed(2)));
      }
    } else if (paymentMode === 'Credit') {
      setCashTendered(0);
      setCardTendered(0);
    }
  }, [paymentMode, grandTotal]);

  // Focus search input on open
  useEffect(() => {
    const t = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 150);
    return () => clearTimeout(t);
  }, []);

  // Cart operations
  const handleAddItemToCart = (item: InventoryItem | { id?: string; name: string; sku?: string; salePrice: number; rate?: number }) => {
    playBeepSound();
    const rate = (item as any).salePrice !== undefined ? (item as any).salePrice : (item as any).rate || 0;
    const itemId = item.id || `custom_${Date.now()}`;
    const itemName = item.name;
    const sku = (item as any).sku || `SKU-${Date.now().toString().slice(-4)}`;

    setCartItems(prev => {
      const existingIdx = prev.findIndex(i => i.itemId === itemId || (i.name.toLowerCase() === itemName.toLowerCase() && i.rate === rate));
      if (existingIdx >= 0) {
        const updated = [...prev];
        const newQty = updated[existingIdx].qty + 1;
        const sub = Number((newQty * rate).toFixed(2));
        const vat = Number((sub * 0.05).toFixed(2));
        updated[existingIdx] = {
          ...updated[existingIdx],
          qty: newQty,
          subtotal: sub,
          vatAmount: vat,
          total: Number((sub + vat).toFixed(2))
        };
        return updated;
      } else {
        const sub = rate;
        const vat = Number((sub * 0.05).toFixed(2));
        const newItem: DocumentItem = {
          itemId: itemId,
          name: itemName,
          sku: sku,
          qty: 1,
          rate: rate,
          vatRate: 5,
          vatAmount: vat,
          subtotal: sub,
          total: Number((sub + vat).toFixed(2))
        };
        return [...prev, newItem];
      }
    });
  };

  // Add custom manual item directly
  const handleAddManualCustomItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = quickItemName.trim() || itemSearchQuery.trim() || 'Custom Counter Item';
    const rate = typeof quickItemPrice === 'number' ? quickItemPrice : (parseFloat(String(quickItemPrice)) || 10.00);
    const qty = Math.max(1, quickItemQty || 1);

    playBeepSound();
    const sub = Number((qty * rate).toFixed(2));
    const vat = Number((sub * 0.05).toFixed(2));

    const newItem: DocumentItem = {
      itemId: `manual_${Date.now()}`,
      name: name,
      sku: `CUST-${Date.now().toString().slice(-4)}`,
      qty: qty,
      rate: rate,
      vatRate: 5,
      vatAmount: vat,
      subtotal: sub,
      total: Number((sub + vat).toFixed(2))
    };

    setCartItems(prev => [...prev, newItem]);
    setQuickItemName('');
    setQuickItemPrice('');
    setQuickItemQty(1);
    setIsQuickAddOpen(false);
    setItemSearchQuery('');
  };

  // Quick Preset Add
  const handleAddPresetAmount = (amount: number, label?: string) => {
    handleAddItemToCart({
      id: `preset_${amount}_${Date.now()}`,
      name: label || `Quick Sale (AED ${amount.toFixed(2)})`,
      sku: `PRE-${amount}`,
      salePrice: amount
    });
  };

  const handleUpdateQty = (itemId: string | undefined, delta: number) => {
    if (!itemId) return;
    setCartItems(prev => {
      return prev.map(i => {
        if (i.itemId === itemId) {
          const nextQty = Math.max(1, i.qty + delta);
          const sub = Number((nextQty * i.rate).toFixed(2));
          const vat = Number((sub * 0.05).toFixed(2));
          return {
            ...i,
            qty: nextQty,
            subtotal: sub,
            vatAmount: vat,
            total: Number((sub + vat).toFixed(2))
          };
        }
        return i;
      });
    });
  };

  const handleSetExactQty = (itemId: string | undefined, val: number) => {
    if (!itemId) return;
    const safeQty = Math.max(1, isNaN(val) ? 1 : val);
    setCartItems(prev => {
      return prev.map(i => {
        if (i.itemId === itemId) {
          const sub = Number((safeQty * i.rate).toFixed(2));
          const vat = Number((sub * 0.05).toFixed(2));
          return {
            ...i,
            qty: safeQty,
            subtotal: sub,
            vatAmount: vat,
            total: Number((sub + vat).toFixed(2))
          };
        }
        return i;
      });
    });
  };

  const handleRemoveItem = (itemId: string | undefined) => {
    if (!itemId) return;
    setCartItems(prev => prev.filter(i => i.itemId !== itemId));
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    if (window.confirm('Clear all items from the current active POS register?')) {
      setCartItems([]);
      setDiscountPercent(0);
      setPaymentMode('Cash');
    }
  };

  // Hold / Park Order
  const handleParkCurrentOrder = () => {
    if (cartItems.length === 0) {
      alert('⚠️ Cart is empty! Nothing to park/hold.');
      return;
    }
    const newParked: ParkedOrder = {
      id: `park_${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customer: selectedCustomer,
      items: [...cartItems],
      discountPercent: discountPercent,
      paymentMode: paymentMode,
      notes: orderNotes,
      grandTotal: grandTotal
    };

    setParkedOrders(prev => [newParked, ...prev]);
    setCartItems([]);
    setDiscountPercent(0);
    setSelectedCustomer(defaultWalkInCustomer);
    setPaymentMode('Cash');
    alert(`✅ Order parked successfully! (Customer: ${selectedCustomer.name}, Total: AED ${grandTotal.toFixed(2)})`);
  };

  // Recall Parked Order
  const handleRecallOrder = (parked: ParkedOrder) => {
    if (cartItems.length > 0) {
      if (!window.confirm('Current cart has items. Overwrite and restore this parked order?')) {
        return;
      }
    }
    setCartItems(parked.items);
    setSelectedCustomer(parked.customer);
    setDiscountPercent(parked.discountPercent || 0);
    setPaymentMode(parked.paymentMode || 'Cash');
    setOrderNotes(parked.notes || 'Recalled POS Sale');
    setParkedOrders(prev => prev.filter(p => p.id !== parked.id));
    setShowParkedModal(false);
    playCashSound();
  };

  // Delete Parked Order
  const handleDeleteParked = (parkedId: string) => {
    setParkedOrders(prev => prev.filter(p => p.id !== parkedId));
  };

  // Barcode quick match
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const barcodeVal = itemSearchQuery.trim();
    if (!barcodeVal) return;

    const matched = effectiveCatalog.find(i => 
      ((i.barcode && i.barcode.toLowerCase() === barcodeVal.toLowerCase()) || 
       (i.sku && i.sku.toLowerCase() === barcodeVal.toLowerCase()) ||
       (i.name && i.name.toLowerCase() === barcodeVal.toLowerCase()))
    );

    if (matched) {
      handleAddItemToCart(matched);
      setItemSearchQuery('');
    } else {
      // If single item in filtered search, add it
      if (filteredInventory.length === 1) {
        handleAddItemToCart(filteredInventory[0]);
        setItemSearchQuery('');
      } else {
        // If query is a price or custom item name, offer instant quick add
        const numPrice = parseFloat(barcodeVal);
        if (!isNaN(numPrice) && numPrice > 0) {
          handleAddPresetAmount(numPrice, `Quick Sale (AED ${numPrice.toFixed(2)})`);
          setItemSearchQuery('');
        } else {
          // Open quick add modal with this name pre-filled
          setQuickItemName(barcodeVal);
          setQuickItemPrice(10);
          setIsQuickAddOpen(true);
        }
      }
    }
  };

  // Quick Customer Creation
  const handleCreateQuickCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      alert('Please provide customer name.');
      return;
    }
    const newCust: Customer = {
      id: `cust_${Date.now()}`,
      companyId: safeCompany.id,
      name: newCustName.trim(),
      phone: newCustPhone.trim() || '0500000000',
      emirate: newCustEmirate || 'Dubai',
      trn: newCustTrn.trim() || undefined,
      address: `${newCustEmirate}, UAE`
    };

    if (onAddCustomer) {
      onAddCustomer(newCust);
    }
    setSelectedCustomer(newCust);
    setShowQuickCustomerModal(false);
    setShowCustomerDropdown(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustTrn('');
  };

  // Direct checkout
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert('⚠️ Cart is empty! Scan or click items to start billing.');
      return;
    }

    if (paymentMode === 'Credit' && selectedCustomer.id === defaultWalkInCustomer.id) {
      alert('⚠️ Credit Sales require selecting a registered Customer account with valid contact information.');
      return;
    }

    setIsProcessing(true);

    try {
      // Calculate Sequence
      const companyDocs = documents.filter(d => d.companyId === safeCompany.id && d.type === 'Invoice');
      const nextRawNumber = companyDocs.reduce((max, d) => Math.max(max, d.rawNumber || 0), safeCompany.nextInvoiceNumber ? safeCompany.nextInvoiceNumber - 1 : 1000) + 1;
      const prefix = safeCompany.invoicePrefix || 'POS-';
      const docNumber = `${prefix}${nextRawNumber}`;

      const todayStr = new Date().toISOString().split('T')[0];
      const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // Build Sales Document
      const newDoc: Omit<SalesDocument, 'id'> & { id?: string } = {
        companyId: safeCompany.id,
        type: 'Invoice',
        docNumber,
        rawNumber: nextRawNumber,
        date: todayStr,
        dueDate: todayStr,
        customerId: selectedCustomer.id,
        items: cartItems,
        subtotal: netTaxableSubtotal,
        vatTotal: vatTotal,
        discount: discountAmount,
        total: grandTotal,
        status: paymentMode === 'Credit' ? 'Unpaid' : 'Paid',
        notes: `${orderNotes} | Cashier: ${staff.find(s => s.id === selectedStaffId)?.name || 'Counter Cashier'} | Mode: ${paymentMode} | Time: ${nowTimeStr}`,
        reference: `POS-REC-${Date.now().toString().slice(-6)}`,
        bankName: safeCompany.bankName,
        bankAccountName: safeCompany.bankAccountName,
        bankIban: safeCompany.bankIban,
        footerNotes: safeCompany.footerNotes || 'Thank you for your business! Goods sold subject to UAE FTA regulations.',
        trn: safeCompany.trn,
        paymentTerms: paymentMode === 'Credit' ? 'Net 30' : 'Immediate POS Counter',
        paymentMethod: paymentMode === 'Split' ? 'Part Cash / Part Card' : paymentMode,
        branch: safeCompany.branchName || 'Main Store Branch',
        staffId: selectedStaffId
      };

      // Save document
      const created = onAddDocument(newDoc);
      const finalDoc: SalesDocument = created || {
        ...newDoc,
        id: `doc_pos_${Date.now()}`
      };

      // Deduct stock for inventory items
      if (safeCompany.inventoryEnabled && onDeductStock) {
        cartItems.forEach(item => {
          if (item.itemId && !item.itemId.startsWith('custom_') && !item.itemId.startsWith('manual_') && !item.itemId.startsWith('preset_')) {
            onDeductStock(item.itemId, item.qty);
          }
        });
      }

      // Generate FTA QR Code
      const qrPayload = [
        `Seller: ${safeCompany.name}`,
        `TRN: ${safeCompany.trn || '100234567890003'}`,
        `Invoice: ${finalDoc.docNumber}`,
        `Date: ${finalDoc.date} ${nowTimeStr}`,
        `Total: AED ${finalDoc.total.toFixed(2)}`,
        `VAT: AED ${finalDoc.vatTotal.toFixed(2)}`
      ].join('\n');

      try {
        const qrUrl = await QRCode.toDataURL(qrPayload, { margin: 1, width: 140 });
        setQrCodeDataUrl(qrUrl);
      } catch (err) {
        console.error('QR Generation error:', err);
      }

      setCompletedDoc(finalDoc);
      setIsReceiptModalOpen(true);
      playCashSound();

      // Reset cart
      setCartItems([]);
      setDiscountPercent(0);
      setItemSearchQuery('');
    } catch (err) {
      console.error(err);
      alert('Error during checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Keyboard Shortcuts Handler inside POS
  useEffect(() => {
    const handlePosKeyDown = (e: KeyboardEvent) => {
      // Only process when POS modal is open and not in receipt preview
      if (isReceiptModalOpen) {
        if (e.key === 'Escape') {
          setIsReceiptModalOpen(false);
          setCompletedDoc(null);
        } else if (e.key === 'p' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          handlePrintThermalReceipt();
        }
        return;
      }

      if (e.key === 'F2') {
        e.preventDefault();
        setPaymentMode('Cash');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setPaymentMode('Card');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setPaymentMode('Credit');
      } else if (e.key === 'F6') {
        e.preventDefault();
        handleParkCurrentOrder();
      } else if (e.key === 'F7') {
        e.preventDefault();
        setPaymentMode('Split');
      } else if (e.key === 'F8') {
        e.preventDefault();
        handleClearCart();
      } else if (e.key === 'F9') {
        e.preventDefault();
        handleCheckout();
      } else if (e.key === 'F10' || (e.ctrlKey && e.key === 'b')) {
        e.preventDefault();
        setIsBarcodeCameraOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        if (showCustomerDropdown) {
          setShowCustomerDropdown(false);
        } else if (isQuickAddOpen) {
          setIsQuickAddOpen(false);
        } else if (showParkedModal) {
          setShowParkedModal(false);
        } else if (cartItems.length === 0) {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handlePosKeyDown);
    return () => window.removeEventListener('keydown', handlePosKeyDown);
  }, [isReceiptModalOpen, showCustomerDropdown, isQuickAddOpen, showParkedModal, cartItems.length, grandTotal, netTaxableSubtotal, vatTotal, paymentMode, selectedCustomer, selectedStaffId]);

  // Print Thermal Receipt
  const handlePrintThermalReceipt = () => {
    const receiptElement = document.getElementById('fast-pos-thermal-receipt');
    if (receiptElement) {
      triggerPrint(receiptElement, 'Thermal');
    }
  };

  // Download PDF Thermal Receipt
  const handleDownloadThermalPdf = async () => {
    const receiptElement = document.getElementById('fast-pos-thermal-receipt');
    if (!receiptElement || !completedDoc) return;
    setIsDownloadingPdf(true);
    try {
      await generateAndDownloadPDF(receiptElement, `Thermal_Receipt_${completedDoc.docNumber}`, {
        paperSize: 'thermal'
      });
    } catch (err) {
      console.error('PDF download error:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col font-sans select-none overflow-hidden text-slate-100">
      
      {/* -------------------------------------------------------------
          TOP BAR: POS TITLE, CASHIER, STATUS & HOTKEYS
         ------------------------------------------------------------- */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
            <Zap className="w-5 h-5 fill-slate-950 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-extrabold uppercase tracking-wider font-mono">
                Hisaab Express POS
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[9px] font-black border border-emerald-500/30 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block"></span>
                <span>LIVE REGISTER</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              {safeCompany.name} • TRN: <span className="text-slate-200 font-bold">{safeCompany.trn || '15-Digit Pending'}</span>
            </p>
          </div>
        </div>

        {/* Hotkey Guide Pills */}
        <div className="hidden xl:flex items-center space-x-1.5 font-mono text-[10px]">
          <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-300">
            <strong className="text-amber-400">F2</strong> Cash
          </span>
          <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-300">
            <strong className="text-sky-400">F3</strong> Card
          </span>
          <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-300">
            <strong className="text-purple-400">F7</strong> Split
          </span>
          <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-300">
            <strong className="text-rose-400">F4</strong> Credit
          </span>
          <button 
            type="button"
            onClick={handleParkCurrentOrder}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-amber-300 cursor-pointer"
          >
            <strong className="text-amber-400">F6</strong> Hold
          </button>
          <span className="px-2 py-1 bg-emerald-950/80 border border-emerald-500/40 rounded text-emerald-300 font-black animate-pulse">
            <strong className="text-emerald-400">F9</strong> CHECKOUT
          </span>
        </div>

        {/* Right Cashier, Parked Tickets & Close Button */}
        <div className="flex items-center space-x-2.5">
          {/* Parked Tickets Button */}
          <button
            type="button"
            onClick={() => setShowParkedModal(true)}
            className="relative px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-mono font-bold text-amber-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="View Held / Parked Tickets (F6)"
          >
            <PauseCircle className="w-3.5 h-3.5" />
            <span>Held Orders</span>
            {parkedOrders.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center">
                {parkedOrders.length}
              </span>
            )}
          </button>

          {/* Cashier Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-lg text-xs">
            <User className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-mono font-bold focus:outline-none cursor-pointer"
            >
              {staff.length > 0 ? (
                staff.filter(s => s.companyId === safeCompany.id).map(s => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                    {s.name} ({s.role})
                  </option>
                ))
              ) : (
                <option value="cashier_1" className="bg-slate-900 text-white">Main Counter Cashier</option>
              )}
            </select>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-900/50 hover:text-rose-300 text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
            title="Exit POS Mode (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* -------------------------------------------------------------
          MAIN 2-COLUMN LAYOUT: CATALOG / ITEMS (LEFT) + CART & CHECKOUT (RIGHT)
         ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* =============================================================
            LEFT COLUMN: ITEM SEARCH, BARCODE SCANNER, SPEED KEYS & CATALOG
           ============================================================= */}
        <div className="flex-1 flex flex-col bg-slate-900/50 border-r border-slate-800 overflow-hidden p-3 space-y-2.5">
          
          {/* Top Search & Barcode Row */}
          <div className="flex items-center space-x-2">
            <form onSubmit={handleBarcodeSubmit} className="flex-1 relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={itemSearchQuery}
                onChange={(e) => setItemSearchQuery(e.target.value)}
                placeholder="Scan Barcode or Search Item / SKU / Custom Price (Press Enter)..."
                className="w-full pl-9 pr-24 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] font-mono rounded-lg transition-colors cursor-pointer"
              >
                + ADD
              </button>
            </form>

            {/* Quick Custom Item Entry Button */}
            <button
              type="button"
              onClick={() => setIsQuickAddOpen(prev => !prev)}
              className="px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0 shadow-md shadow-indigo-600/20"
              title="Add Custom Price / Ad-hoc item"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">+ Custom Item</span>
            </button>

            {/* Camera Barcode Scanner Trigger */}
            <button
              type="button"
              onClick={() => setIsBarcodeCameraOpen(true)}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
              title="Open Barcode Camera Scanner (F10)"
            >
              <BarcodeIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Camera</span>
            </button>
          </div>

          {/* Quick Custom Item Inline Drawer (when toggled or triggered) */}
          {isQuickAddOpen && (
            <form onSubmit={handleAddManualCustomItem} className="bg-slate-950 border border-indigo-500/50 rounded-xl p-3 flex flex-wrap items-center gap-2 text-xs font-mono animate-fadeIn">
              <span className="text-indigo-400 font-bold text-[11px] flex items-center space-x-1">
                <Tag className="w-3.5 h-3.5" />
                <span>Quick Custom Item:</span>
              </span>
              <input
                type="text"
                value={quickItemName}
                onChange={(e) => setQuickItemName(e.target.value)}
                placeholder="Item Description / Service Name"
                className="flex-1 min-w-[150px] px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-400"
                autoFocus
              />
              <div className="flex items-center space-x-1">
                <span className="text-slate-400 text-[10px]">Price (AED):</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={quickItemPrice}
                  onChange={(e) => setQuickItemPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-20 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-amber-300 text-xs font-bold text-right focus:outline-none focus:border-indigo-400"
                  required
                />
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-slate-400 text-[10px]">Qty:</span>
                <input
                  type="number"
                  min="1"
                  value={quickItemQty}
                  onChange={(e) => setQuickItemQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-12 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs text-center focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg cursor-pointer"
              >
                + Add To Bill
              </button>
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(false)}
                className="text-slate-500 hover:text-white px-2 py-1"
              >
                ✕
              </button>
            </form>
          )}

          {/* Speed Preset Cash Keys (1-Touch Fast Keys) */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
            <span className="text-[10px] font-mono text-slate-500 font-bold uppercase shrink-0">Speed Keys:</span>
            {[5, 10, 15, 20, 50, 100, 200, 500].map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => handleAddPresetAmount(amt)}
                className="px-2.5 py-1 bg-slate-800/90 hover:bg-amber-500 hover:text-slate-950 text-slate-200 border border-slate-700/80 rounded-lg text-[10.5px] font-mono font-bold transition-all shrink-0 cursor-pointer shadow-sm"
              >
                + {amt} AED
              </button>
            ))}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-0.5 scrollbar-thin">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            {filteredInventory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 font-mono text-xs space-y-3">
                <ShoppingBag className="w-12 h-12 text-slate-600 stroke-[1.5]" />
                <div>
                  <p className="text-sm font-bold text-slate-400">No registered products match "{itemSearchQuery}"</p>
                  <p className="text-[11px] text-slate-500 mt-1">You can add it directly as a custom item or ring up speed keys above.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setQuickItemName(itemSearchQuery || 'Custom Item');
                    setQuickItemPrice(10);
                    setIsQuickAddOpen(true);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add "{itemSearchQuery || 'Custom Item'}" As New Item</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {filteredInventory.map(item => {
                  const inCart = cartItems.find(c => c.itemId === item.id || c.name.toLowerCase() === item.name.toLowerCase());
                  const isLowStock = safeCompany.inventoryEnabled && item.stockQuantity <= (item.minStockThreshold || 3);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleAddItemToCart(item)}
                      className={`relative group bg-slate-950/80 hover:bg-slate-900 border rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-all duration-150 hover:shadow-lg hover:scale-[1.02] active:scale-95 ${
                        inCart 
                          ? 'border-amber-500/80 bg-amber-500/5 ring-1 ring-amber-500/30' 
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {inCart && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-slate-950 font-mono font-black text-[10px] rounded-full flex items-center justify-center shadow-md">
                          {inCart.qty}
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-[9px] font-mono text-slate-500 font-bold uppercase truncate">
                            {item.sku || 'SKU'}
                          </span>
                          {safeCompany.inventoryEnabled && item.stockQuantity !== 999 && (
                            <span className={`text-[8.5px] font-mono px-1.5 py-0.2 rounded font-bold ${
                              item.stockQuantity <= 0
                                ? 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                                : isLowStock
                                ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              Stock: {item.stockQuantity}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-100 line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors">
                          {item.name}
                        </h4>
                      </div>

                      <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-baseline justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">+5% VAT</span>
                        <span className="text-xs font-extrabold text-amber-400 font-mono">
                          {formatAED(item.salePrice || 0)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* =============================================================
            RIGHT COLUMN: ACTIVE REGISTER CART, CUSTOMER & INSTANT CHECKOUT
           ============================================================= */}
        <div className="w-full md:w-[460px] lg:w-[480px] flex flex-col bg-slate-950 p-4 space-y-3 shrink-0 overflow-y-auto border-l border-slate-800/80">
          
          {/* Customer Selection Bar */}
          <div className="relative bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center space-x-1">
                <User className="w-3 h-3 text-amber-400" />
                <span>Customer Account</span>
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowQuickCustomerModal(true)}
                  className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                >
                  + New Customer
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomerDropdown(prev => !prev)}
                  className="text-[10px] font-mono text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                >
                  {showCustomerDropdown ? 'Close' : 'Switch'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-xs">{selectedCustomer.name}</div>
                <div className="text-[10px] font-mono text-slate-400">
                  {selectedCustomer.trn ? `TRN: ${selectedCustomer.trn}` : 'Simplified B2C (No TRN)'} • {selectedCustomer.phone || 'Counter Cash'}
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                {selectedCustomer.emirate || 'Dubai'}
              </span>
            </div>

            {/* Customer Dropdown search */}
            {showCustomerDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 p-2 space-y-2">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customer by name, TRN, or mobile..."
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  autoFocus
                />
                <div className="max-h-40 overflow-y-auto space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(defaultWalkInCustomer);
                      setShowCustomerDropdown(false);
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-xs text-amber-300 font-bold flex items-center justify-between"
                  >
                    <span>{defaultWalkInCustomer.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Default Counter</span>
                  </button>
                  {customers
                    .filter(c => c.companyId === safeCompany.id || !c.companyId)
                    .filter(c => {
                      if (!customerSearch) return true;
                      const q = customerSearch.toLowerCase();
                      return (c.name || '').toLowerCase().includes(q) || 
                             (c.trn || '').includes(q) || 
                             (c.phone || '').includes(q);
                    })
                    .map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(c);
                          setShowCustomerDropdown(false);
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold">{c.name}</div>
                          <div className="text-[9.5px] text-slate-400 font-mono">{c.trn ? `TRN: ${c.trn}` : c.phone}</div>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono">{c.emirate}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Cart Line Items Table */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col min-h-[180px]">
            <div className="bg-slate-950 px-3 py-2 border-b border-slate-800 flex items-center justify-between text-[10px] font-mono uppercase font-bold text-slate-400">
              <span>Item ({cartItems.length})</span>
              <div className="flex items-center space-x-6">
                <span>Qty</span>
                <span>Price</span>
                <span>Total</span>
                <button
                  type="button"
                  onClick={handleClearCart}
                  disabled={cartItems.length === 0}
                  className="text-rose-400 hover:text-rose-300 disabled:opacity-30 cursor-pointer"
                  title="Clear Cart (F8)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500 font-mono text-xs space-y-1.5">
                  <Receipt className="w-9 h-9 text-slate-700 stroke-[1.5]" />
                  <p className="font-bold text-slate-400">Register is empty</p>
                  <p className="text-[10px] text-slate-600">Scan barcode, click catalog items, or press "+ Custom Item" to start billing.</p>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div
                    key={`${item.itemId || item.name}_${idx}`}
                    className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex-1 pr-2 min-w-0">
                      <div className="font-bold text-slate-100 truncate text-[11px] font-sans">
                        {item.name}
                      </div>
                      <div className="text-[9.5px] text-slate-500">
                        {item.sku} • {formatAED(item.rate)} ea (+5% VAT)
                      </div>
                    </div>

                    {/* Qty Controls */}
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.itemId, -1)}
                        className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.qty}
                        onChange={(e) => handleSetExactQty(item.itemId, parseInt(e.target.value, 10))}
                        className="w-10 text-center bg-slate-900 border border-slate-700 rounded py-0.5 text-xs text-amber-300 font-bold focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.itemId, 1)}
                        className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="w-20 text-right font-extrabold text-slate-100 pl-2">
                      {formatAED(item.total)}
                    </div>

                    {/* Delete Item */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.itemId)}
                      className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Discount & Totals Breakdown Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-400">
              <span>Gross Taxable Subtotal:</span>
              <span className="text-slate-200 font-bold">{formatAED(grossSubtotal)}</span>
            </div>

            {/* Discount Selector */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center space-x-1">
                <Percent className="w-3 h-3 text-amber-400" />
                <span>Invoice Discount %:</span>
              </span>
              <div className="flex items-center space-x-1">
                {[0, 5, 10, 15].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDiscountPercent(pct)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      discountPercent === pct 
                        ? 'bg-amber-500 text-slate-950' 
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={discountPercent || ''}
                  onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  placeholder="0"
                  className="w-12 text-center bg-slate-950 border border-slate-700 rounded py-0.5 text-[10px] text-amber-300 font-bold focus:outline-none"
                />
              </div>
            </div>

            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-rose-400 text-[11px]">
                <span>Discount Deduction ({discountPercent}%):</span>
                <span>- {formatAED(discountAmount)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-emerald-400">
              <span>UAE FTA 5% Output VAT:</span>
              <span className="font-bold">+ {formatAED(vatTotal)}</span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-baseline justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block font-sans">
                  Total Payable
                </span>
                <span className="text-[9px] text-slate-400">5% Tax Inclusive</span>
              </div>
              <span className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                {formatAED(grandTotal)}
              </span>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono uppercase font-bold text-slate-400">
              Payment Tender Mode:
            </label>
            <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
              <button
                type="button"
                onClick={() => setPaymentMode('Cash')}
                className={`py-2 rounded-lg font-bold flex flex-col items-center justify-center space-y-0.5 transition-colors cursor-pointer ${
                  paymentMode === 'Cash'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span className="text-[10px]">F2 Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('Card')}
                className={`py-2 rounded-lg font-bold flex flex-col items-center justify-center space-y-0.5 transition-colors cursor-pointer ${
                  paymentMode === 'Card'
                    ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span className="text-[10px]">F3 Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('Split')}
                className={`py-2 rounded-lg font-bold flex flex-col items-center justify-center space-y-0.5 transition-colors cursor-pointer ${
                  paymentMode === 'Split'
                    ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="text-[10px]">F7 Split</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('Credit')}
                className={`py-2 rounded-lg font-bold flex flex-col items-center justify-center space-y-0.5 transition-colors cursor-pointer ${
                  paymentMode === 'Credit'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[10px]">F4 Credit</span>
              </button>
            </div>
          </div>

          {/* Tender Inputs & Change Due Indicator */}
          {paymentMode === 'Cash' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Cash Received:</span>
                <input
                  type="number"
                  step="any"
                  value={cashTendered || ''}
                  onChange={(e) => setCashTendered(Number(e.target.value) || 0)}
                  className="w-28 text-right bg-slate-950 border border-slate-700 rounded px-2 py-1 text-amber-300 font-bold focus:outline-none"
                />
              </div>

              {/* Quick Cash Presets */}
              <div className="flex items-center space-x-1 justify-end">
                {[grandTotal, Math.ceil(grandTotal / 10) * 10, Math.ceil(grandTotal / 50) * 50, 100, 200, 500].filter((v, i, a) => v >= grandTotal && a.indexOf(v) === i).slice(0, 4).map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCashTendered(preset)}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold cursor-pointer"
                  >
                    AED {preset}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold">
                <span className={changeDue > 0 ? 'text-emerald-400' : 'text-slate-400'}>
                  Change Return:
                </span>
                <span className="text-base text-emerald-400">
                  {formatAED(changeDue)}
                </span>
              </div>
            </div>
          )}

          {paymentMode === 'Split' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-2 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] text-slate-400 uppercase font-bold mb-0.5">Part Cash (AED)</label>
                  <input
                    type="number"
                    step="any"
                    value={cashTendered || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setCashTendered(val);
                      setCardTendered(Math.max(0, Number((grandTotal - val).toFixed(2))));
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-amber-300 font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 uppercase font-bold mb-0.5">Part Card (AED)</label>
                  <input
                    type="number"
                    step="any"
                    value={cardTendered || ''}
                    onChange={(e) => setCardTendered(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sky-300 font-bold focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800 font-bold">
                <span className="text-slate-400">Total Tendered: {formatAED(totalPaid)}</span>
                <span className={remainingBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                  {remainingBalance > 0 ? `Short: ${formatAED(remainingBalance)}` : 'Exact / Covered ✓'}
                </span>
              </div>
            </div>
          )}

          {/* Main Checkout Action Button */}
          <button
            type="button"
            disabled={cartItems.length === 0 || isProcessing}
            onClick={handleCheckout}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-mono font-black text-sm uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Printing & Posting...</span>
              </>
            ) : (
              <>
                <Receipt className="w-5 h-5" />
                <span>Complete POS Checkout (F9)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          MODAL: CAMERA BARCODE SCANNER OVERLAY
         ------------------------------------------------------------- */}
      {isBarcodeCameraOpen && (
        <BarcodeScannerModal
          isOpen={isBarcodeCameraOpen}
          onClose={() => setIsBarcodeCameraOpen(false)}
          onScan={(scannedCode) => {
            const matched = effectiveCatalog.find(i => 
              ((i.barcode && i.barcode.toLowerCase() === scannedCode.toLowerCase()) || 
               (i.sku && i.sku.toLowerCase() === scannedCode.toLowerCase()))
            );
            if (matched) {
              handleAddItemToCart(matched);
            } else {
              setItemSearchQuery(scannedCode);
            }
            setIsBarcodeCameraOpen(false);
          }}
        />
      )}

      {/* -------------------------------------------------------------
          MODAL: QUICK ADD CUSTOMER
         ------------------------------------------------------------- */}
      {showQuickCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <User className="w-4 h-4 text-indigo-400" />
                <span>Quick Register New POS Customer</span>
              </h3>
              <button onClick={() => setShowQuickCustomerModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuickCustomer} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Customer / Company Name *</label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Al Maya Supermarket LLC or John Doe"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Mobile Phone *</label>
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="050XXXXXXX"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Emirate</label>
                  <select
                    value={newCustEmirate}
                    onChange={(e) => setNewCustEmirate(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-400"
                  >
                    {['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'].map(em => (
                      <option key={em} value={em}>{em}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">15-Digit TRN (Optional for B2B)</label>
                <input
                  type="text"
                  maxLength={15}
                  value={newCustTrn}
                  onChange={(e) => setNewCustTrn(e.target.value.replace(/\D/g, ''))}
                  placeholder="100XXXXXXXXXXXX (15 Digits)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuickCustomerModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
                >
                  Save & Select Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: HELD / PARKED ORDERS LIST
         ------------------------------------------------------------- */}
      {showParkedModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <PauseCircle className="w-4 h-4 text-amber-400" />
                <span>Held / Parked Tickets</span>
              </h3>
              <button onClick={() => setShowParkedModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {parkedOrders.length === 0 ? (
              <div className="text-center py-8 text-slate-500 font-mono text-xs space-y-2">
                <PauseCircle className="w-10 h-10 text-slate-700 mx-auto stroke-[1.5]" />
                <p>No held tickets in queue.</p>
                <p className="text-[10px] text-slate-600">Press F6 during any active cart to park the order temporarily.</p>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2">
                {parkedOrders.map(parked => (
                  <div
                    key={parked.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-xs hover:border-amber-500/50 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-white flex items-center space-x-2">
                        <span>{parked.customer.name}</span>
                        <span className="text-[10px] text-slate-500">• {parked.timeStr}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {parked.items.length} item(s) • Total: <span className="text-amber-400 font-bold">{formatAED(parked.grandTotal)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteParked(parked.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg cursor-pointer"
                        title="Delete Ticket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRecallOrder(parked)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1 cursor-pointer"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Recall Ticket</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: COMPLETED RECEIPT & THERMAL PRINT PREVIEW
         ------------------------------------------------------------- */}
      {isReceiptModalOpen && completedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 font-sans overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            
            {/* Top Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-mono font-bold uppercase text-sm">Sale Completed Successfully</span>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={thermalReceiptSize}
                  onChange={(e) => setThermalReceiptSize(e.target.value as any)}
                  className="bg-slate-800 text-slate-200 text-xs font-mono rounded px-2 py-1 border border-slate-700 cursor-pointer"
                >
                  <option value="80mm">80mm Standard POS</option>
                  <option value="58mm">58mm Mini Thermal</option>
                </select>
                <button
                  onClick={() => {
                    setIsReceiptModalOpen(false);
                    setCompletedDoc(null);
                  }}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Thermal Receipt Paper Container */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-center max-h-[60vh] overflow-y-auto">
              <div 
                id="fast-pos-thermal-receipt" 
                data-paper-size="Thermal"
                data-thermal-width={thermalReceiptSize}
                className={`bg-white text-black p-4 font-mono text-xs shadow-md border border-slate-300 rounded ${
                  thermalReceiptSize === '58mm' ? 'w-[58mm] text-[10px]' : 'w-[80mm]'
                }`}
                style={{ fontFamily: 'Courier New, Courier, monospace', color: '#000000', backgroundColor: '#ffffff' }}
              >
                {/* Receipt Header */}
                <div className="text-center border-b border-dashed border-black pb-2 mb-2 space-y-0.5">
                  <h3 className="font-black text-sm uppercase">{safeCompany.name}</h3>
                  <p className="text-[10px]">TAX INVOICE</p>
                  <p className="text-[9px]">TRN: {safeCompany.trn || '100234567890003'}</p>
                  <p className="text-[9px]">{safeCompany.address || 'United Arab Emirates'}</p>
                  {safeCompany.phone && <p className="text-[9px]">Tel: {safeCompany.phone}</p>}
                </div>

                {/* Receipt Meta */}
                <div className="text-[9.5px] border-b border-dashed border-black pb-2 mb-2 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Receipt No:</span>
                    <span className="font-bold">{completedDoc.docNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date & Time:</span>
                    <span>{completedDoc.date} {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-bold truncate max-w-[120px]">{selectedCustomer.name}</span>
                  </div>
                  {selectedCustomer.trn && (
                    <div className="flex justify-between">
                      <span>Buyer TRN:</span>
                      <span>{selectedCustomer.trn}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Payment:</span>
                    <span className="font-bold">{completedDoc.paymentMethod}</span>
                  </div>
                </div>

                {/* Line Items Table */}
                <table className="w-full text-left text-[9.5px] mb-2 border-b border-dashed border-black pb-2">
                  <thead>
                    <tr className="border-b border-black text-[9px] font-bold">
                      <th className="py-1">Item</th>
                      <th className="py-1 text-center">Qty</th>
                      <th className="py-1 text-right">Price</th>
                      <th className="py-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dotted divide-slate-300">
                    {completedDoc.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-1 pr-1 text-[10px] leading-tight">
                          {it.name}
                        </td>
                        <td className="py-1 text-center">{it.qty}</td>
                        <td className="py-1 text-right">{it.rate.toFixed(2)}</td>
                        <td className="py-1 text-right font-bold">{it.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Receipt Totals */}
                <div className="text-[10px] space-y-1 border-b border-dashed border-black pb-2 mb-2">
                  <div className="flex justify-between">
                    <span>Subtotal (Net):</span>
                    <span>AED {completedDoc.subtotal.toFixed(2)}</span>
                  </div>
                  {completedDoc.discount > 0 && (
                    <div className="flex justify-between text-[9px]">
                      <span>Discount:</span>
                      <span>- AED {completedDoc.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>VAT (5%):</span>
                    <span>AED {completedDoc.vatTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black pt-1 border-t border-black">
                    <span>TOTAL (AED):</span>
                    <span>AED {completedDoc.total.toFixed(2)}</span>
                  </div>
                  {paymentMode === 'Cash' && changeDue > 0 && (
                    <div className="flex justify-between text-[9px] pt-0.5 text-slate-700">
                      <span>Cash Paid:</span>
                      <span>AED {cashTendered.toFixed(2)}</span>
                    </div>
                  )}
                  {paymentMode === 'Cash' && changeDue > 0 && (
                    <div className="flex justify-between text-[9px] font-bold text-slate-900">
                      <span>Change Given:</span>
                      <span>AED {changeDue.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* FTA Compliance QR Code */}
                <div className="flex flex-col items-center justify-center pt-1 text-center space-y-1">
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} alt="FTA QR" className="w-24 h-24 object-contain border border-slate-300 p-0.5 bg-white mx-auto" />
                  ) : (
                    <div className="w-24 h-24 border border-dashed border-slate-400 flex items-center justify-center text-[8px] mx-auto">
                      FTA QR CODE
                    </div>
                  )}
                  <p className="text-[8px] uppercase tracking-wider text-slate-600 font-bold">
                    UAE FTA E-Invoice Standard
                  </p>
                  <p className="text-[8px] text-slate-500">
                    {safeCompany.footerNotes || 'Thank you for your visit!'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsReceiptModalOpen(false);
                  setCompletedDoc(null);
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                ← Next Customer / Sale
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleDownloadThermalPdf}
                  disabled={isDownloadingPdf}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isDownloadingPdf ? 'Exporting...' : 'PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintThermalReceipt}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-black text-xs uppercase tracking-wider rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt (Ctrl+P)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
