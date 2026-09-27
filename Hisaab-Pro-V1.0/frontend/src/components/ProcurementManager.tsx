import React, { useState, useMemo, useRef } from 'react';
import { 
  FileCheck, 
  Box, 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  Eye, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Building2, 
  Truck, 
  Calendar, 
  DollarSign, 
  FileText, 
  ShieldCheck, 
  X, 
  ChevronRight, 
  AlertTriangle,
  Package,
  Layers,
  ArrowDownLeft,
  Share2,
  ShoppingBag
} from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem, GoodsReceivedNote, GoodsReceivedNoteItem, Company, Supplier, InventoryItem, Branch, Expense } from '../types';

interface ProcurementManagerProps {
  activeCompanyId: string;
  company?: Company;
  suppliers: Supplier[];
  inventory: InventoryItem[];
  branches: Branch[];
  purchaseOrders: PurchaseOrder[];
  goodsReceivedNotes: GoodsReceivedNote[];
  onAddPO: (po: Omit<PurchaseOrder, 'id'>) => void;
  onUpdatePO: (po: PurchaseOrder) => void;
  onDeletePO: (id: string) => void;
  onAddGRN: (grn: Omit<GoodsReceivedNote, 'id'>) => void;
  onUpdateGRN: (grn: GoodsReceivedNote) => void;
  onDeleteGRN: (id: string) => void;
  onAdjustStock?: (itemId: string, diff: number, reason: string) => void;
  onConvertToExpense?: (exp: Omit<Expense, 'id' | 'companyId'>) => void;
  activeSidebarItemId?: string;
  setActiveSidebarItemId?: (id: string) => void;
}

export const ProcurementManager: React.FC<ProcurementManagerProps> = ({
  activeCompanyId,
  company,
  suppliers,
  inventory,
  branches,
  purchaseOrders,
  goodsReceivedNotes,
  onAddPO,
  onUpdatePO,
  onDeletePO,
  onAddGRN,
  onUpdateGRN,
  onDeleteGRN,
  onAdjustStock,
  onConvertToExpense,
  activeSidebarItemId,
  setActiveSidebarItemId
}) => {
  const [activeTab, setActiveTab] = useState<'PO' | 'GRN'>(() => {
    if (activeSidebarItemId === 'pur_grn') return 'GRN';
    return 'PO';
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBranch, setSelectedBranch] = useState('ALL');

  // Modals & Document Previews
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isGRNModalOpen, setIsGRNModalOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [editingGRN, setEditingGRN] = useState<GoodsReceivedNote | null>(null);
  const [previewPO, setPreviewPO] = useState<PurchaseOrder | null>(null);
  const [previewGRN, setPreviewGRN] = useState<GoodsReceivedNote | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // PO Form State
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poSupplierName, setPoSupplierName] = useState('');
  const [poSupplierTrn, setPoSupplierTrn] = useState('');
  const [poSupplierPhone, setPoSupplierPhone] = useState('');
  const [poSupplierEmail, setPoSupplierEmail] = useState('');
  const [poSupplierAddress, setPoSupplierAddress] = useState('');
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [poExpectedDate, setPoExpectedDate] = useState('');
  const [poBranch, setPoBranch] = useState(branches[0]?.name || 'Dubai Main HQ');
  const [poPaymentTerms, setPoPaymentTerms] = useState('30 Days Net Credit');
  const [poNotes, setPoNotes] = useState('');
  const [poPreparedBy, setPoPreparedBy] = useState('Procurement Officer');
  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([
    { name: '', sku: '', qty: 1, rate: 0, vatRate: 5, vatAmount: 0, subtotal: 0, total: 0, unit: 'piece' }
  ]);

  // GRN Form State
  const [grnPoId, setGrnPoId] = useState('');
  const [grnSupplierId, setGrnSupplierId] = useState('');
  const [grnSupplierName, setGrnSupplierName] = useState('');
  const [grnSupplierTrn, setGrnSupplierTrn] = useState('');
  const [grnDeliveryNoteNo, setGrnDeliveryNoteNo] = useState('');
  const [grnVehicleNo, setGrnVehicleNo] = useState('');
  const [grnDate, setGrnDate] = useState(new Date().toISOString().split('T')[0]);
  const [grnWarehouseLocation, setGrnWarehouseLocation] = useState('Sharjah Logistics Warehouse');
  const [grnBranch, setGrnBranch] = useState(branches[0]?.name || 'Dubai Main HQ');
  const [grnReceivedBy, setGrnReceivedBy] = useState('Warehouse Keeper');
  const [grnInspectedBy, setGrnInspectedBy] = useState('QC Inspector');
  const [grnNotes, setGrnNotes] = useState('');
  const [grnItems, setGrnItems] = useState<GoodsReceivedNoteItem[]>([
    { name: '', sku: '', orderedQty: 1, receivedQty: 1, rejectedQty: 0, rate: 0, vatRate: 5, vatAmount: 0, subtotal: 0, total: 0, unit: 'piece', condition: 'Good', remarks: '' }
  ]);

  // Company filtered records
  const companyPOs = useMemo(() => {
    return purchaseOrders.filter(po => po.companyId === activeCompanyId);
  }, [purchaseOrders, activeCompanyId]);

  const companyGRNs = useMemo(() => {
    return goodsReceivedNotes.filter(grn => grn.companyId === activeCompanyId);
  }, [goodsReceivedNotes, activeCompanyId]);

  // KPIs
  const totalPOValue = useMemo(() => companyPOs.reduce((sum, p) => sum + p.total, 0), [companyPOs]);
  const openPOCount = useMemo(() => companyPOs.filter(p => p.status === 'Approved' || p.status === 'Sent' || p.status === 'Partially Received').length, [companyPOs]);
  const totalGRNValue = useMemo(() => companyGRNs.reduce((sum, g) => sum + g.total, 0), [companyGRNs]);
  const stockUpdatedGRNCount = useMemo(() => companyGRNs.filter(g => g.stockIncremented).length, [companyGRNs]);

  // Sync with sidebar selection
  React.useEffect(() => {
    if (activeSidebarItemId === 'pur_po') setActiveTab('PO');
    if (activeSidebarItemId === 'pur_grn') setActiveTab('GRN');
  }, [activeSidebarItemId]);

  // Open PO Form helper
  const handleOpenAddPO = () => {
    setEditingPO(null);
    setPoSupplierId('');
    setPoSupplierName('');
    setPoSupplierTrn('');
    setPoSupplierPhone('');
    setPoSupplierEmail('');
    setPoSupplierAddress('');
    setPoDate(new Date().toISOString().split('T')[0]);
    setPoExpectedDate(new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]);
    setPoBranch(branches[0]?.name || 'Dubai Main HQ');
    setPoPaymentTerms('30 Days Net Credit');
    setPoNotes('Standard commercial supply terms. Delivery accompanied by Delivery Note & Certificate of Origin.');
    setPoPreparedBy('Procurement Manager');
    setPoItems([{ name: '', sku: '', qty: 1, rate: 0, vatRate: 5, vatAmount: 0, subtotal: 0, total: 0, unit: 'piece' }]);
    setIsPOModalOpen(true);
  };

  const handleOpenEditPO = (po: PurchaseOrder) => {
    setEditingPO(po);
    setPoSupplierId(po.supplierId || '');
    setPoSupplierName(po.supplierName);
    setPoSupplierTrn(po.supplierTrn || '');
    setPoSupplierPhone(po.supplierPhone || '');
    setPoSupplierEmail(po.supplierEmail || '');
    setPoSupplierAddress(po.supplierAddress || '');
    setPoDate(po.date);
    setPoExpectedDate(po.expectedDeliveryDate || '');
    setPoBranch(po.branch || branches[0]?.name || '');
    setPoPaymentTerms(po.paymentTerms || '30 Days Net Credit');
    setPoNotes(po.notes || '');
    setPoPreparedBy(po.preparedBy || 'Procurement Manager');
    setPoItems(po.items && po.items.length > 0 ? po.items : [{ name: '', sku: '', qty: 1, rate: 0, vatRate: 5, vatAmount: 0, subtotal: 0, total: 0, unit: 'piece' }]);
    setIsPOModalOpen(true);
  };

  // Open GRN Form helper
  const handleOpenAddGRN = (fromPO?: PurchaseOrder) => {
    setEditingGRN(null);
    if (fromPO) {
      setGrnPoId(fromPO.id);
      setGrnSupplierId(fromPO.supplierId || '');
      setGrnSupplierName(fromPO.supplierName);
      setGrnSupplierTrn(fromPO.supplierTrn || '');
      setGrnDeliveryNoteNo(`DN-${Math.floor(10000 + Math.random() * 90000)}`);
      setGrnVehicleNo('DXB-TRK-771');
      setGrnDate(new Date().toISOString().split('T')[0]);
      setGrnWarehouseLocation(fromPO.deliveryLocation || 'Sharjah Logistics Central Warehouse');
      setGrnBranch(fromPO.branch || branches[0]?.name || '');
      setGrnReceivedBy('Tariq Mehmood (Storekeeper)');
      setGrnInspectedBy('Mohammed Farooq (QC Inspector)');
      setGrnNotes(`Received against Purchase Order ${fromPO.poNumber}. All packaging verified.`);
      
      const newItems: GoodsReceivedNoteItem[] = fromPO.items.map(it => ({
        itemId: it.itemId,
        name: it.name,
        sku: it.sku,
        orderedQty: it.qty,
        receivedQty: it.qty,
        rejectedQty: 0,
        rate: it.rate,
        vatRate: it.vatRate,
        vatAmount: it.vatAmount,
        subtotal: it.subtotal,
        total: it.total,
        unit: it.unit || 'piece',
        condition: 'Good',
        remarks: 'Inspected and accepted in full'
      }));
      setGrnItems(newItems);
    } else {
      setGrnPoId('');
      setGrnSupplierId('');
      setGrnSupplierName('');
      setGrnSupplierTrn('');
      setGrnDeliveryNoteNo('');
      setGrnVehicleNo('');
      setGrnDate(new Date().toISOString().split('T')[0]);
      setGrnWarehouseLocation('Dubai Main Receiving Bay');
      setGrnBranch(branches[0]?.name || 'Dubai Main HQ');
      setGrnReceivedBy('Warehouse Keeper');
      setGrnInspectedBy('QC Inspector');
      setGrnNotes('');
      setGrnItems([{ name: '', sku: '', orderedQty: 1, receivedQty: 1, rejectedQty: 0, rate: 0, vatRate: 5, vatAmount: 0, subtotal: 0, total: 0, unit: 'piece', condition: 'Good', remarks: '' }]);
    }
    setIsGRNModalOpen(true);
  };

  const handleOpenEditGRN = (grn: GoodsReceivedNote) => {
    setEditingGRN(grn);
    setGrnPoId(grn.poId || '');
    setGrnSupplierId(grn.supplierId || '');
    setGrnSupplierName(grn.supplierName);
    setGrnSupplierTrn(grn.supplierTrn || '');
    setGrnDeliveryNoteNo(grn.supplierDeliveryNoteNo || '');
    setGrnVehicleNo(grn.vehicleNo || '');
    setGrnDate(grn.date);
    setGrnWarehouseLocation(grn.warehouseLocation || '');
    setGrnBranch(grn.branch || branches[0]?.name || '');
    setGrnReceivedBy(grn.receivedBy);
    setGrnInspectedBy(grn.inspectedBy || '');
    setGrnNotes(grn.notes || '');
    setGrnItems(grn.items && grn.items.length > 0 ? grn.items : [{ name: '', sku: '', orderedQty: 1, receivedQty: 1, rejectedQty: 0, rate: 0, vatRate: 5, vatAmount: 0, subtotal: 0, total: 0, unit: 'piece', condition: 'Good', remarks: '' }]);
    setIsGRNModalOpen(true);
  };

  // Supplier pick auto-fill
  const handleSelectSupplierForPO = (supId: string) => {
    setPoSupplierId(supId);
    const sup = suppliers.find(s => s.id === supId);
    if (sup) {
      setPoSupplierName(sup.name);
      setPoSupplierTrn(sup.trn || '');
      setPoSupplierPhone(sup.phone || '');
      setPoSupplierEmail(sup.email || '');
      setPoSupplierAddress(sup.address || '');
    }
  };

  const handleSelectSupplierForGRN = (supId: string) => {
    setGrnSupplierId(supId);
    const sup = suppliers.find(s => s.id === supId);
    if (sup) {
      setGrnSupplierName(sup.name);
      setGrnSupplierTrn(sup.trn || '');
    }
  };

  // Item helpers for PO
  const handlePOItemChange = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const updated = [...poItems];
    const item = { ...updated[index], [field]: value };

    // Auto-fill from inventory
    if (field === 'name') {
      const found = inventory.find(i => i.name.toLowerCase() === String(value).toLowerCase());
      if (found) {
        item.itemId = found.id;
        item.sku = found.sku || '';
        item.rate = found.purchasePrice || found.salePrice || 0;
        item.unit = found.sellingUnit || 'piece';
      }
    }

    // Recompute
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const subtotal = qty * rate;
    const vatAmount = (subtotal * (item.vatRate || 5)) / 100;
    const total = subtotal + vatAmount;

    item.subtotal = Math.round(subtotal * 100) / 100;
    item.vatAmount = Math.round(vatAmount * 100) / 100;
    item.total = Math.round(total * 100) / 100;

    updated[index] = item;
    setPoItems(updated);
  };

  const handleAddPOItem = () => {
    setPoItems([...poItems, { name: '', sku: '', qty: 1, rate: 0, vatRate: 5, vatAmount: 0, subtotal: 0, total: 0, unit: 'piece' }]);
  };

  const handleRemovePOItem = (index: number) => {
    if (poItems.length === 1) return;
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  // Item helpers for GRN
  const handleGRNItemChange = (index: number, field: keyof GoodsReceivedNoteItem, value: any) => {
    const updated = [...grnItems];
    const item = { ...updated[index], [field]: value };

    if (field === 'name') {
      const found = inventory.find(i => i.name.toLowerCase() === String(value).toLowerCase());
      if (found) {
        item.itemId = found.id;
        item.sku = found.sku || '';
        item.rate = found.purchasePrice || 0;
        item.unit = found.sellingUnit || 'piece';
      }
    }

    const recQty = Number(item.receivedQty) || 0;
    const rate = Number(item.rate) || 0;
    const subtotal = recQty * rate;
    const vatAmount = (subtotal * (item.vatRate || 5)) / 100;
    const total = subtotal + vatAmount;

    item.subtotal = Math.round(subtotal * 100) / 100;
    item.vatAmount = Math.round(vatAmount * 100) / 100;
    item.total = Math.round(total * 100) / 100;

    updated[index] = item;
    setGrnItems(updated);
  };

  const handleAddGRNItem = () => {
    setGrnItems([...grnItems, { name: '', sku: '', orderedQty: 1, receivedQty: 1, rejectedQty: 0, rate: 0, vatRate: 5, vatAmount: 0, subtotal: 0, total: 0, unit: 'piece', condition: 'Good', remarks: '' }]);
  };

  const handleRemoveGRNItem = (index: number) => {
    if (grnItems.length === 1) return;
    setGrnItems(grnItems.filter((_, i) => i !== index));
  };

  // Save PO
  const handleSavePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplierName.trim()) {
      alert('Please enter or select a Supplier.');
      return;
    }
    const subtotal = poItems.reduce((acc, it) => acc + it.subtotal, 0);
    const vatTotal = poItems.reduce((acc, it) => acc + it.vatAmount, 0);
    const total = subtotal + vatTotal;

    if (editingPO) {
      const updated: PurchaseOrder = {
        ...editingPO,
        date: poDate,
        expectedDeliveryDate: poExpectedDate,
        supplierId: poSupplierId,
        supplierName: poSupplierName,
        supplierTrn: poSupplierTrn,
        supplierPhone: poSupplierPhone,
        supplierEmail: poSupplierEmail,
        supplierAddress: poSupplierAddress,
        branch: poBranch,
        paymentTerms: poPaymentTerms,
        notes: poNotes,
        preparedBy: poPreparedBy,
        items: poItems,
        subtotal: Math.round(subtotal * 100) / 100,
        vatTotal: Math.round(vatTotal * 100) / 100,
        total: Math.round(total * 100) / 100
      };
      onUpdatePO(updated);
      showToast(`Purchase Order ${updated.poNumber} updated successfully!`);
    } else {
      const nextNum = companyPOs.length + 1001;
      const newPO: Omit<PurchaseOrder, 'id'> = {
        companyId: activeCompanyId,
        poNumber: `PO-${nextNum}`,
        rawNumber: nextNum,
        date: poDate,
        expectedDeliveryDate: poExpectedDate,
        supplierId: poSupplierId,
        supplierName: poSupplierName,
        supplierTrn: poSupplierTrn,
        supplierPhone: poSupplierPhone,
        supplierEmail: poSupplierEmail,
        supplierAddress: poSupplierAddress,
        branch: poBranch,
        paymentTerms: poPaymentTerms,
        notes: poNotes,
        preparedBy: poPreparedBy,
        items: poItems,
        subtotal: Math.round(subtotal * 100) / 100,
        vatTotal: Math.round(vatTotal * 100) / 100,
        discount: 0,
        total: Math.round(total * 100) / 100,
        currency: company?.currency || 'AED',
        status: 'Approved'
      };
      onAddPO(newPO);
      showToast(`Purchase Order ${newPO.poNumber} created successfully!`);
    }
    setIsPOModalOpen(false);
  };

  // Save GRN
  const handleSaveGRN = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grnSupplierName.trim()) {
      alert('Please enter or select a Supplier.');
      return;
    }
    const subtotal = grnItems.reduce((acc, it) => acc + it.subtotal, 0);
    const vatTotal = grnItems.reduce((acc, it) => acc + it.vatAmount, 0);
    const total = subtotal + vatTotal;

    if (editingGRN) {
      const updated: GoodsReceivedNote = {
        ...editingGRN,
        poId: grnPoId,
        date: grnDate,
        supplierId: grnSupplierId,
        supplierName: grnSupplierName,
        supplierTrn: grnSupplierTrn,
        supplierDeliveryNoteNo: grnDeliveryNoteNo,
        vehicleNo: grnVehicleNo,
        warehouseLocation: grnWarehouseLocation,
        branch: grnBranch,
        receivedBy: grnReceivedBy,
        inspectedBy: grnInspectedBy,
        notes: grnNotes,
        items: grnItems,
        subtotal: Math.round(subtotal * 100) / 100,
        vatTotal: Math.round(vatTotal * 100) / 100,
        total: Math.round(total * 100) / 100
      };
      onUpdateGRN(updated);
      showToast(`GRN ${updated.grnNumber} updated successfully!`);
    } else {
      const nextNum = companyGRNs.length + 1001;
      const matchedPO = companyPOs.find(p => p.id === grnPoId);
      const newGRN: Omit<GoodsReceivedNote, 'id'> = {
        companyId: activeCompanyId,
        grnNumber: `GRN-${nextNum}`,
        rawNumber: nextNum,
        poId: grnPoId,
        poNumber: matchedPO?.poNumber || (grnPoId ? 'PO-REF' : undefined),
        date: grnDate,
        supplierId: grnSupplierId,
        supplierName: grnSupplierName,
        supplierTrn: grnSupplierTrn,
        supplierDeliveryNoteNo: grnDeliveryNoteNo,
        vehicleNo: grnVehicleNo,
        warehouseLocation: grnWarehouseLocation,
        branch: grnBranch,
        receivedBy: grnReceivedBy,
        inspectedBy: grnInspectedBy,
        notes: grnNotes,
        items: grnItems,
        subtotal: Math.round(subtotal * 100) / 100,
        vatTotal: Math.round(vatTotal * 100) / 100,
        total: Math.round(total * 100) / 100,
        status: 'Inspected',
        stockIncremented: false
      };
      onAddGRN(newGRN);

      // If matched PO, update its status
      if (matchedPO) {
        onUpdatePO({
          ...matchedPO,
          status: 'Partially Received',
          grnIds: [...(matchedPO.grnIds || []), `grn-${nextNum}`]
        });
      }
      showToast(`Goods Received Note ${newGRN.grnNumber} generated successfully!`);
    }
    setIsGRNModalOpen(false);
  };

  // Stock increment from GRN
  const handleApplyGRNStockUpdate = (grn: GoodsReceivedNote) => {
    if (grn.stockIncremented) {
      alert('Inventory stock has already been updated for this GRN voucher.');
      return;
    }
    if (!onAdjustStock) {
      alert('Stock adjustment handler is not attached.');
      return;
    }

    let updatedCount = 0;
    grn.items.forEach(it => {
      if (it.receivedQty > 0) {
        // Try finding matching item by ID or name
        let matched = inventory.find(i => i.id === it.itemId || i.name.toLowerCase() === it.name.toLowerCase());
        if (matched) {
          onAdjustStock(matched.id, it.receivedQty, `GRN Received: ${grn.grnNumber} (${it.receivedQty} ${it.unit || 'units'})`);
          updatedCount++;
        }
      }
    });

    onUpdateGRN({
      ...grn,
      status: 'Stock Updated',
      stockIncremented: true
    });

    showToast(`✅ Successfully incremented stock for ${updatedCount} products into inventory!`);
  };

  // Convert PO or GRN to Purchase Bill
  const handleConvertToPurchaseBill = (source: PurchaseOrder | GoodsReceivedNote, type: 'PO' | 'GRN') => {
    if (!onConvertToExpense) {
      alert('Purchase bill conversion handler not found.');
      return;
    }

    const isPO = type === 'PO';
    const po = isPO ? (source as PurchaseOrder) : null;
    const grn = !isPO ? (source as GoodsReceivedNote) : null;

    const purchaseItems = isPO 
      ? po!.items.map(it => ({
          name: it.name,
          qty: it.qty,
          rate: it.rate,
          vatRate: it.vatRate || 5,
          vatAmount: it.vatAmount,
          total: it.total
        }))
      : grn!.items.map(it => ({
          name: it.name,
          qty: it.receivedQty,
          rate: it.rate,
          vatRate: it.vatRate || 5,
          vatAmount: it.vatAmount,
          total: it.total
        }));

    const newExpense: Omit<Expense, 'id' | 'companyId'> = {
      date: isPO ? po!.date : grn!.date,
      supplierName: isPO ? po!.supplierName : grn!.supplierName,
      supplierTrn: isPO ? po!.supplierTrn : grn!.supplierTrn,
      invoiceNumber: isPO ? `BILL-${po!.poNumber}` : `BILL-${grn!.grnNumber}`,
      category: 'Purchases',
      amount: source.subtotal,
      vatAmount: source.vatTotal,
      total: source.total,
      status: 'Unpaid',
      vatRecoverability: 'Fully Recoverable',
      description: isPO 
        ? `Purchase bill converted from Purchase Order ${po!.poNumber}` 
        : `Purchase bill converted from Goods Received Note ${grn!.grnNumber} (DN: ${grn!.supplierDeliveryNoteNo || 'N/A'})`,
      items: purchaseItems
    };

    onConvertToExpense(newExpense);
    showToast(`Converted ${isPO ? po!.poNumber : grn!.grnNumber} into Purchase Bill successfully!`);
    if (setActiveSidebarItemId) {
      setActiveSidebarItemId('pur_manage');
    }
  };

  // Filtered PO list
  const filteredPOs = useMemo(() => {
    return companyPOs.filter(po => {
      const matchSearch = po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (po.branch && po.branch.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus = statusFilter === 'ALL' || po.status === statusFilter;
      const matchBranch = selectedBranch === 'ALL' || po.branch === selectedBranch;
      return matchSearch && matchStatus && matchBranch;
    });
  }, [companyPOs, searchQuery, statusFilter, selectedBranch]);

  // Filtered GRN list
  const filteredGRNs = useMemo(() => {
    return companyGRNs.filter(grn => {
      const matchSearch = grn.grnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        grn.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (grn.poNumber && grn.poNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (grn.supplierDeliveryNoteNo && grn.supplierDeliveryNoteNo.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus = statusFilter === 'ALL' || grn.status === statusFilter;
      const matchBranch = selectedBranch === 'ALL' || grn.branch === selectedBranch;
      return matchSearch && matchStatus && matchBranch;
    });
  }, [companyGRNs, searchQuery, statusFilter, selectedBranch]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-xl flex items-center space-x-3 text-sm font-semibold border border-emerald-500/30 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Procurement & Material Inward
            </span>
            <span className="text-slate-400 text-xs font-mono">Hisaab Pro V2.0</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Purchase Orders & Goods Received Notes (GRN)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            End-to-end B2B procurement workflow: PO Generation → Material Inspection → GRN Receipt → Stock Updating & Purchase Invoicing.
          </p>
        </div>

        {/* Tab & Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center space-x-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('PO')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all cursor-pointer ${
                activeTab === 'PO' 
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-extrabold' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Purchase Orders (Purchase & Pre-Procurement) ({companyPOs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('GRN')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all cursor-pointer ${
                activeTab === 'GRN' 
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm font-extrabold' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Box className="w-4 h-4" />
              <span>Goods Received Notes ({companyGRNs.length})</span>
            </button>
          </div>

          {activeTab === 'PO' ? (
            <button
              onClick={handleOpenAddPO}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Purchase Order</span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenAddGRN()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Goods Received Note (GRN)</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total PO Pipeline
            </span>
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <FileCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-xl font-black text-slate-900 dark:text-white">
              AED {totalPOValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{companyPOs.length} Active Purchase Orders</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pending Delivery
            </span>
            <span className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-xl font-black text-amber-600 dark:text-amber-400">
              {openPOCount} POs
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting physical receiving</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Goods Received
            </span>
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Box className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-xl font-black text-slate-900 dark:text-white">
              AED {totalGRNValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{companyGRNs.length} Inward GRN Vouchers</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Stock Inward Synchronized
            </span>
            <span className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-xl font-black text-blue-600 dark:text-blue-400">
              {stockUpdatedGRNCount} / {companyGRNs.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Catalog stock updated</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === 'PO' ? "Search PO #, supplier, branch..." : "Search GRN #, DN ref, PO #, supplier..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            {activeTab === 'PO' ? (
              <>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Approved">Approved</option>
                <option value="Partially Received">Partially Received</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </>
            ) : (
              <>
                <option value="Received">Received</option>
                <option value="Inspected">Inspected</option>
                <option value="Stock Updated">Stock Updated</option>
                <option value="Billed">Billed</option>
              </>
            )}
          </select>

          {/* Branch Filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Branches & Locations</option>
            {branches.map(b => (
              <option key={b.id} value={b.name}>{b.name} ({b.emirate})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table View */}
      {activeTab === 'PO' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Date / Delivery</th>
                  <th className="py-3 px-4">Supplier & TRN</th>
                  <th className="py-3 px-4">Delivery Branch</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Total (AED)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {filteredPOs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      <FileCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold">No Purchase Orders found</p>
                      <p className="text-[11px] text-slate-400 mt-1">Click "Create Purchase Order" above to issue your first supplier PO.</p>
                    </td>
                  </tr>
                ) : (
                  filteredPOs.map(po => (
                    <tr key={po.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {po.poNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-white">{po.date}</div>
                        {po.expectedDeliveryDate && (
                          <div className="text-[11px] text-slate-400">Exp: {po.expectedDeliveryDate}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{po.supplierName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">TRN: {po.supplierTrn || 'Unregistered'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-slate-600 dark:text-slate-300">
                          {po.branch || 'Headquarters'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full text-[11px] font-bold font-mono">
                          {po.items?.length || 0} items
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                        AED {po.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        <div className="text-[10px] text-slate-400 font-normal">VAT 5%: AED {po.vatTotal.toFixed(2)}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          po.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          po.status === 'Partially Received' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          po.status === 'Completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                          po.status === 'Sent' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
                          'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Issue GRN Button */}
                          <button
                            onClick={() => handleOpenAddGRN(po)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 dark:text-emerald-300 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Generate Goods Received Note (GRN) from this PO"
                          >
                            <Box className="w-3.5 h-3.5" />
                          </button>

                          {/* Convert to Purchase Bill */}
                          <button
                            onClick={() => handleConvertToPurchaseBill(po, 'PO')}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-300 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Convert to Purchase Bill"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          {/* Preview / Print */}
                          <button
                            onClick={() => setPreviewPO(po)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="View / Print PO"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEditPO(po)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Edit PO"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (confirm(`Delete Purchase Order ${po.poNumber}?`)) {
                                onDeletePO(po.id);
                                showToast(`Deleted Purchase Order ${po.poNumber}`);
                              }
                            }}
                            className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/50 dark:hover:bg-red-900/80 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Delete PO"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRN Table View */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4">GRN Number</th>
                  <th className="py-3 px-4">Date / PO Ref</th>
                  <th className="py-3 px-4">Supplier & Delivery Note</th>
                  <th className="py-3 px-4">Warehouse Location</th>
                  <th className="py-3 px-4 text-center">Items Received</th>
                  <th className="py-3 px-4 text-right">Inward Value (AED)</th>
                  <th className="py-3 px-4 text-center">Stock Synchronized</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {filteredGRNs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      <Box className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold">No Goods Received Notes found</p>
                      <p className="text-[11px] text-slate-400 mt-1">Click "Issue Goods Received Note" or convert from an active PO to register incoming inventory.</p>
                    </td>
                  </tr>
                ) : (
                  filteredGRNs.map(grn => (
                    <tr key={grn.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {grn.grnNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-white">{grn.date}</div>
                        {grn.poNumber && (
                          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                            PO: {grn.poNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{grn.supplierName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          DN: {grn.supplierDeliveryNoteNo || 'N/A'} {grn.vehicleNo ? `• Veh: ${grn.vehicleNo}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-slate-600 dark:text-slate-300">
                          {grn.warehouseLocation || grn.branch || 'Main Warehouse'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full text-[11px] font-bold font-mono">
                          {grn.items?.length || 0} items
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                        AED {grn.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {grn.stockIncremented ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Stock Inward</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleApplyGRNStockUpdate(grn)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-all cursor-pointer inline-flex items-center space-x-1"
                            title="Click to automatically increment product stock in Inventory Catalog"
                          >
                            <Package className="w-3 h-3" />
                            <span>Update Stock</span>
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Convert to Purchase Bill */}
                          <button
                            onClick={() => handleConvertToPurchaseBill(grn, 'GRN')}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-300 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Convert GRN to Purchase Bill"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          {/* Preview / Print */}
                          <button
                            onClick={() => setPreviewGRN(grn)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="View / Print GRN Voucher"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEditGRN(grn)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Edit GRN"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (confirm(`Delete Goods Received Note ${grn.grnNumber}?`)) {
                                onDeleteGRN(grn.id);
                                showToast(`Deleted GRN ${grn.grnNumber}`);
                              }
                            }}
                            className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/50 dark:hover:bg-red-900/80 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Delete GRN"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PO Form Modal */}
      {isPOModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {editingPO ? `Edit Purchase Order: ${editingPO.poNumber}` : 'Create New Purchase Order (PO)'}
                </h3>
                <p className="text-xs text-slate-500">GCC Compliant Supplier Purchase Order Generator</p>
              </div>
              <button 
                onClick={() => setIsPOModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePO} className="space-y-4">
              {/* Supplier & Order Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Select Supplier / Vendor *
                  </label>
                  <select
                    value={poSupplierId}
                    onChange={(e) => handleSelectSupplierForPO(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose Registered Supplier --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (TRN: {s.trn || 'N/A'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={poSupplierName}
                    onChange={(e) => setPoSupplierName(e.target.value)}
                    placeholder="Vendor Name"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Supplier 15-Digit TRN
                  </label>
                  <input
                    type="text"
                    value={poSupplierTrn}
                    onChange={(e) => setPoSupplierTrn(e.target.value)}
                    placeholder="100XXXXXXXXXXXX"
                    maxLength={15}
                    className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    PO Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={poDate}
                    onChange={(e) => setPoDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={poExpectedDate}
                    onChange={(e) => setPoExpectedDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Delivery Branch / Destination
                  </label>
                  <select
                    value={poBranch}
                    onChange={(e) => setPoBranch(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Retail Wholesale Carton Quick-Injector */}
              {(company?.industry === 'Retail Shop' || company?.industry === 'Retail') && (
                <div className="p-3 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-950 dark:text-rose-200">
                      <ShoppingBag className="w-3.5 h-3.5 text-rose-600" />
                      <span>Retail Wholesale Size-Run & Carton Packs</span>
                    </div>
                    <span className="text-[10px] text-rose-700 dark:text-rose-300 font-mono">1-Click Auto-Pack</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const shoeSizes = [
                          { size: 'EU 39', qty: 1 },
                          { size: 'EU 40', qty: 2 },
                          { size: 'EU 41', qty: 3 },
                          { size: 'EU 42', qty: 3 },
                          { size: 'EU 43', qty: 2 },
                          { size: 'EU 44', qty: 1 }
                        ];
                        const rate = 110; // wholesale pair rate
                        const newItems: PurchaseOrderItem[] = shoeSizes.map(s => {
                          const subtotal = s.qty * rate;
                          const vatAmount = subtotal * 0.05;
                          return {
                            name: `Men's Classic Leather Formal Shoes - Size ${s.size} (Black/Brown)`,
                            sku: `SHOE-${s.size.replace(/\s+/g, '')}-BLK`,
                            qty: s.qty,
                            rate,
                            vatRate: 5,
                            vatAmount,
                            subtotal,
                            total: subtotal + vatAmount,
                            unit: 'pair'
                          };
                        });
                        // replace empty first item or append
                        const baseItems = poItems.filter(i => i.name.trim() !== '');
                        setPoItems([...baseItems, ...newItems]);
                      }}
                      className="text-left p-2 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 hover:border-rose-400 hover:bg-rose-50 text-[11px] transition-all cursor-pointer"
                    >
                      <div className="font-bold text-slate-900 dark:text-slate-100">👠 Shoe Master Carton (12 Pairs)</div>
                      <div className="text-[9.5px] text-slate-500">Run: 1x39, 2x40, 3x41, 3x42, 2x43, 1x44</div>
                      <div className="font-mono text-rose-600 font-bold text-[10px]">AED 110/pr (AED 1,320+VAT)</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const sandalSizes = [
                          { size: 'EU 40', qty: 1 },
                          { size: 'EU 41', qty: 2 },
                          { size: 'EU 42', qty: 2 },
                          { size: 'EU 43', qty: 1 }
                        ];
                        const rate = 85;
                        const newItems: PurchaseOrderItem[] = sandalSizes.map(s => {
                          const subtotal = s.qty * rate;
                          const vatAmount = subtotal * 0.05;
                          return {
                            name: `Traditional Emirati Leather Naal / Sandals - Size ${s.size} (Camel/Tan)`,
                            sku: `NAAL-${s.size.replace(/\s+/g, '')}-CAMEL`,
                            qty: s.qty,
                            rate,
                            vatRate: 5,
                            vatAmount,
                            subtotal,
                            total: subtotal + vatAmount,
                            unit: 'pair'
                          };
                        });
                        const baseItems = poItems.filter(i => i.name.trim() !== '');
                        setPoItems([...baseItems, ...newItems]);
                      }}
                      className="text-left p-2 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 hover:border-rose-400 hover:bg-rose-50 text-[11px] transition-all cursor-pointer"
                    >
                      <div className="font-bold text-slate-900 dark:text-slate-100">👡 Arabic Naal Pack (6 Pairs)</div>
                      <div className="text-[9.5px] text-slate-500">Run: 1x40, 2x41, 2x42, 1x43 (Camel Tan)</div>
                      <div className="font-mono text-rose-600 font-bold text-[10px]">AED 85/pr (AED 510+VAT)</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const apparelSizes = [
                          { size: 'Size S', qty: 2 },
                          { size: 'Size M', qty: 3 },
                          { size: 'Size L', qty: 4 },
                          { size: 'Size XL', qty: 2 },
                          { size: 'Size 2XL', qty: 1 }
                        ];
                        const rate = 65;
                        const newItems: PurchaseOrderItem[] = apparelSizes.map(s => {
                          const subtotal = s.qty * rate;
                          const vatAmount = subtotal * 0.05;
                          return {
                            name: `Formal Dress Shirts / Cotton Kandora - ${s.size} (White/Navy)`,
                            sku: `CLOTH-${s.size.replace(/\s+/g, '')}`,
                            qty: s.qty,
                            rate,
                            vatRate: 5,
                            vatAmount,
                            subtotal,
                            total: subtotal + vatAmount,
                            unit: 'piece'
                          };
                        });
                        const baseItems = poItems.filter(i => i.name.trim() !== '');
                        setPoItems([...baseItems, ...newItems]);
                      }}
                      className="text-left p-2 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 hover:border-rose-400 hover:bg-rose-50 text-[11px] transition-all cursor-pointer"
                    >
                      <div className="font-bold text-slate-900 dark:text-slate-100">👔 Apparel Assorted Pack (12 Pcs)</div>
                      <div className="text-[9.5px] text-slate-500">Run: 2xS, 3xM, 4xL, 2xXL, 1x2XL</div>
                      <div className="font-mono text-rose-600 font-bold text-[10px]">AED 65/pc (AED 780+VAT)</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Items Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden mt-4">
                <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                  <span>Order Items & Pricing</span>
                  <button
                    type="button"
                    onClick={handleAddPOItem}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
                  {poItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs">
                      <div className="col-span-4">
                        <input
                          type="text"
                          required
                          placeholder="Item Description / SKU"
                          value={item.name}
                          onChange={(e) => handlePOItemChange(idx, 'name', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="Qty"
                          value={item.qty}
                          onChange={(e) => handlePOItemChange(idx, 'qty', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="Rate AED"
                          value={item.rate}
                          onChange={(e) => handlePOItemChange(idx, 'rate', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="col-span-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        AED {item.total?.toFixed(2) || '0.00'}
                        <span className="text-[10px] text-slate-400 block font-normal">+5% VAT</span>
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemovePOItem(idx)}
                          disabled={poItems.length === 1}
                          className="text-red-500 hover:text-red-700 disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Terms & Signatures */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Payment Terms & Notes
                  </label>
                  <textarea
                    rows={2}
                    value={poNotes}
                    onChange={(e) => setPoNotes(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Prepared By
                  </label>
                  <input
                    type="text"
                    value={poPreparedBy}
                    onChange={(e) => setPoPreparedBy(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Submit Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPOModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  {editingPO ? 'Update Purchase Order' : 'Save & Issue Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRN Form Modal */}
      {isGRNModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {editingGRN ? `Edit Goods Received Note: ${editingGRN.grnNumber}` : 'Issue Goods Received Note (GRN)'}
                </h3>
                <p className="text-xs text-slate-500">Material Inward Voucher & Quality Inspection Report</p>
              </div>
              <button 
                onClick={() => setIsGRNModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGRN} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Linked PO (Optional)
                  </label>
                  <select
                    value={grnPoId}
                    onChange={(e) => {
                      const found = companyPOs.find(p => p.id === e.target.value);
                      if (found) handleOpenAddGRN(found);
                    }}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Direct / Ad-hoc Inward --</option>
                    {companyPOs.map(p => (
                      <option key={p.id} value={p.id}>{p.poNumber} ({p.supplierName})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={grnSupplierName}
                    onChange={(e) => setGrnSupplierName(e.target.value)}
                    placeholder="Vendor Name"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Supplier Delivery Note Ref No. *
                  </label>
                  <input
                    type="text"
                    required
                    value={grnDeliveryNoteNo}
                    onChange={(e) => setGrnDeliveryNoteNo(e.target.value)}
                    placeholder="e.g. DN-88123"
                    className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Receiving Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={grnDate}
                    onChange={(e) => setGrnDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Vehicle / Carrier No.
                  </label>
                  <input
                    type="text"
                    value={grnVehicleNo}
                    onChange={(e) => setGrnVehicleNo(e.target.value)}
                    placeholder="DXB-TRK-102"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Warehouse / Storage Bay
                  </label>
                  <input
                    type="text"
                    value={grnWarehouseLocation}
                    onChange={(e) => setGrnWarehouseLocation(e.target.value)}
                    placeholder="Sharjah WH-44, Bay 3"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Inspection Grid */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden mt-4">
                <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                  <span>Material Inspection & Quantity Reconciliation</span>
                  <button
                    type="button"
                    onClick={handleAddGRNItem}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
                  {grnItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs">
                      <div className="col-span-3">
                        <input
                          type="text"
                          required
                          placeholder="Item Description"
                          value={item.name}
                          onChange={(e) => handleGRNItemChange(idx, 'name', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          placeholder="Ordered Qty"
                          value={item.orderedQty}
                          onChange={(e) => handleGRNItemChange(idx, 'orderedQty', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          required
                          placeholder="Received Qty"
                          value={item.receivedQty}
                          onChange={(e) => handleGRNItemChange(idx, 'receivedQty', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold"
                        />
                      </div>
                      <div className="col-span-2">
                        <select
                          value={item.condition}
                          onChange={(e) => handleGRNItemChange(idx, 'condition', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-[11px]"
                        >
                          <option value="Good">Good Condition</option>
                          <option value="Damaged">Damaged / Rejected</option>
                          <option value="Shortage">Shortage</option>
                          <option value="Excess">Excess</option>
                        </select>
                      </div>
                      <div className="col-span-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                        AED {item.total?.toFixed(2) || '0.00'}
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveGRNItem(idx)}
                          disabled={grnItems.length === 1}
                          className="text-red-500 hover:text-red-700 disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inspection Officers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Storekeeper / Received By
                  </label>
                  <input
                    type="text"
                    value={grnReceivedBy}
                    onChange={(e) => setGrnReceivedBy(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    QC Inspector Name
                  </label>
                  <input
                    type="text"
                    value={grnInspectedBy}
                    onChange={(e) => setGrnInspectedBy(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGRNModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  {editingGRN ? 'Update GRN Voucher' : 'Save & Confirm Material Inward'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bilingual Purchase Order Print Preview Modal */}
      {previewPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 text-slate-900 my-8">
            <div className="flex items-center justify-between border-b pb-4 mb-6 no-print">
              <span className="font-extrabold text-xs uppercase tracking-wider text-indigo-600">
                Official Bilingual Purchase Order Preview (GCC Standard)
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print PO</span>
                </button>
                <button
                  onClick={() => setPreviewPO(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Document Layout */}
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h2 className="text-xl font-black">{company?.name || 'evonix Technologies'}</h2>
                  <p className="text-xs text-slate-500">{company?.address || 'Sheikh Zayed Road, Business Bay, Dubai, UAE'}</p>
                  <p className="text-xs text-slate-500 font-mono font-bold">TRN: {company?.trn || '100234567890003'}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-indigo-700 tracking-wider">PURCHASE ORDER</span>
                  <div className="text-sm font-mono font-black mt-1">{previewPO.poNumber}</div>
                  <div className="text-xs text-slate-500">Date: {previewPO.date}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Vendor Details</span>
                  <div className="font-bold text-slate-900 mt-1">{previewPO.supplierName}</div>
                  <div className="text-slate-600 font-mono">TRN: {previewPO.supplierTrn || 'N/A'}</div>
                  <div className="text-slate-600">{previewPO.supplierAddress || 'UAE'}</div>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Delivery Instructions</span>
                  <div className="font-bold text-slate-900 mt-1">Destination: {previewPO.branch || 'Headquarters'}</div>
                  <div className="text-slate-600">Expected: {previewPO.expectedDeliveryDate || 'Immediate'}</div>
                  <div className="text-slate-600">Payment: {previewPO.paymentTerms}</div>
                </div>
              </div>

              {/* Items */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 text-center">Qty</th>
                    <th className="py-2 px-3 text-right">Unit Rate</th>
                    <th className="py-2 px-3 text-right">VAT 5%</th>
                    <th className="py-2 px-3 text-right">Total (AED)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {previewPO.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium">{it.name}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{it.qty} {it.unit || 'pcs'}</td>
                      <td className="py-2.5 px-3 text-right font-mono">AED {it.rate.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">AED {it.vatAmount.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">AED {it.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1.5 text-xs bg-slate-50 p-3 rounded-xl">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">AED {previewPO.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>VAT 5%:</span>
                    <span className="font-mono">AED {previewPO.vatTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-slate-900 border-t pt-1.5 text-sm">
                    <span>Gross Total:</span>
                    <span className="font-mono text-indigo-700">AED {previewPO.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t text-xs">
                <div className="border-t border-slate-300 pt-2">
                  <div className="font-bold">Prepared By</div>
                  <div className="text-slate-500">{previewPO.preparedBy || 'Procurement Manager'}</div>
                </div>
                <div className="border-t border-slate-300 pt-2 text-right">
                  <div className="font-bold">Authorized Approval</div>
                  <div className="text-slate-500">Managing Director</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bilingual Goods Received Note Print Preview Modal */}
      {previewGRN && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 text-slate-900 my-8">
            <div className="flex items-center justify-between border-b pb-4 mb-6 no-print">
              <span className="font-extrabold text-xs uppercase tracking-wider text-emerald-600">
                Official Bilingual Material Inward & GRN Inspection Report
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print GRN Voucher</span>
                </button>
                <button
                  onClick={() => setPreviewGRN(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h2 className="text-xl font-black">{company?.name || 'evonix Technologies'}</h2>
                  <p className="text-xs text-slate-500">Warehouse & Logistics Department</p>
                  <p className="text-xs text-slate-500 font-mono font-bold">TRN: {company?.trn || '100234567890003'}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-emerald-700 tracking-wider">GOODS RECEIVED NOTE</span>
                  <div className="text-sm font-mono font-black mt-1">{previewGRN.grnNumber}</div>
                  <div className="text-xs text-slate-500">Date: {previewGRN.date}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Supplier & Inward Shipment</span>
                  <div className="font-bold text-slate-900 mt-1">{previewGRN.supplierName}</div>
                  <div className="text-slate-600 font-mono">Delivery Note No: {previewGRN.supplierDeliveryNoteNo || 'N/A'}</div>
                  <div className="text-slate-600">Vehicle / Container: {previewGRN.vehicleNo || 'N/A'}</div>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Receiving Location & PO Reference</span>
                  <div className="font-bold text-slate-900 mt-1">Storage: {previewGRN.warehouseLocation || 'Main Hub'}</div>
                  <div className="text-slate-600 font-mono">PO Ref: {previewGRN.poNumber || 'Direct Supply'}</div>
                  <div className="text-slate-600">Stock Status: {previewGRN.stockIncremented ? 'Catalog Updated' : 'Pending Update'}</div>
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Item Description</th>
                    <th className="py-2 px-3 text-center">Ordered</th>
                    <th className="py-2 px-3 text-center">Received</th>
                    <th className="py-2 px-3 text-center">Condition</th>
                    <th className="py-2 px-3 text-right">Inward Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {previewGRN.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium">{it.name}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{it.orderedQty}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">{it.receivedQty}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          it.condition === 'Good' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {it.condition || 'Good'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">AED {it.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="grid grid-cols-2 gap-8 pt-8 border-t text-xs">
                <div className="border-t border-slate-300 pt-2">
                  <div className="font-bold">Storekeeper Signature</div>
                  <div className="text-slate-500">{previewGRN.receivedBy}</div>
                </div>
                <div className="border-t border-slate-300 pt-2 text-right">
                  <div className="font-bold">QC Inspection Sign-off</div>
                  <div className="text-slate-500">{previewGRN.inspectedBy || 'Quality Assurance'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
