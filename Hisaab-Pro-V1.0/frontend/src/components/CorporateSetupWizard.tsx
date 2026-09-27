import React, { useState } from 'react';
import { 
  Building, 
  Settings, 
  Upload, 
  Image as ImageIcon, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  CreditCard, 
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  ArrowRight, 
  Check, 
  Percent, 
  ShieldCheck, 
  Package, 
  Printer, 
  Users, 
  GitBranch, 
  Laptop, 
  ShoppingBag, 
  Globe, 
  Hammer, 
  Key, 
  Wrench, 
  Utensils, 
  HeartPulse, 
  Gem, 
  Truck, 
  Layers, 
  Briefcase,
  X,
  Compass
} from 'lucide-react';
import { Company } from '../types';
import { 
  COUNTRIES_CONFIG, 
  SupportedCountry, 
  getCountryConfig 
} from '../utils/countryLocalization';

interface CorporateSetupWizardProps {
  company: Company;
  onSaveAndEnter: (updatedCompany: Company) => void;
  onSkip?: () => void;
  isModal?: boolean;
}

export const COUNTRY_OPTIONS: { code: SupportedCountry; name: string; nativeName: string; flag: string; region: string }[] = [
  { code: 'UAE', name: 'United Arab Emirates', nativeName: 'UAE (FTA Compliant)', flag: '🇦🇪', region: 'GCC' },
  { code: 'Pakistan', name: 'Pakistan', nativeName: 'Pakistan (FBR / PRA / SRB)', flag: '🇵🇰', region: 'Asia' },
  { code: 'KSA', name: 'Saudi Arabia', nativeName: 'Saudi Arabia (ZATCA)', flag: '🇸🇦', region: 'GCC' },
  { code: 'Bangladesh', name: 'Bangladesh', nativeName: 'Bangladesh (NBR / Mushak)', flag: '🇧🇩', region: 'Asia' },
  { code: 'India', name: 'India', nativeName: 'India (GST / GSTIN)', flag: '🇮🇳', region: 'Asia' },
  { code: 'Oman', name: 'Oman', nativeName: 'Oman (OTA / VATIN)', flag: '🇴🇲', region: 'GCC' },
  { code: 'Qatar', name: 'Qatar', nativeName: 'Qatar (GTA / TIN)', flag: '🇶🇦', region: 'GCC' },
  { code: 'Kuwait', name: 'Kuwait', nativeName: 'Kuwait (MOF Tax Free)', flag: '🇰🇼', region: 'GCC' },
  { code: 'Bahrain', name: 'Bahrain', nativeName: 'Bahrain (NBR / TRN)', flag: '🇧🇭', region: 'GCC' },
  { code: 'Nepal', name: 'Nepal', nativeName: 'Nepal (IRD / PAN)', flag: '🇳🇵', region: 'Asia' }
];

export const TIMEZONE_OPTIONS = [
  // South Asia
  { value: 'Asia/Karachi', label: 'Asia/Karachi (PKT - Pakistan Standard Time, UTC+5)', flag: '🇵🇰', group: 'South Asia' },
  { value: 'Asia/Dhaka', label: 'Asia/Dhaka (BST - Bangladesh Standard Time, UTC+6)', flag: '🇧🇩', group: 'South Asia' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST - India Standard Time, UTC+5:30)', flag: '🇮🇳', group: 'South Asia' },
  { value: 'Asia/Kathmandu', label: 'Asia/Kathmandu (NPT - Nepal Standard Time, UTC+5:45)', flag: '🇳🇵', group: 'South Asia' },
  { value: 'Asia/Colombo', label: 'Asia/Colombo (SLST - Sri Lanka, UTC+5:30)', flag: '🇱🇰', group: 'South Asia' },
  { value: 'Asia/Kabul', label: 'Asia/Kabul (AFT - Afghanistan, UTC+4:30)', flag: '🇦🇫', group: 'South Asia' },
  
  // GCC & Middle East
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST - UAE Gulf Standard Time, UTC+4)', flag: '🇦🇪', group: 'GCC & Middle East' },
  { value: 'Asia/Riyadh', label: 'Asia/Riyadh (AST - Saudi Arabia Standard Time, UTC+3)', flag: '🇸🇦', group: 'GCC & Middle East' },
  { value: 'Asia/Muscat', label: 'Asia/Muscat (GST - Oman Standard Time, UTC+4)', flag: '🇴🇲', group: 'GCC & Middle East' },
  { value: 'Asia/Qatar', label: 'Asia/Qatar (AST - Qatar Standard Time, UTC+3)', flag: '🇶🇦', group: 'GCC & Middle East' },
  { value: 'Asia/Kuwait', label: 'Asia/Kuwait (AST - Kuwait Standard Time, UTC+3)', flag: '🇰🇼', group: 'GCC & Middle East' },
  { value: 'Asia/Bahrain', label: 'Asia/Bahrain (AST - Bahrain Standard Time, UTC+3)', flag: '🇧🇭', group: 'GCC & Middle East' },
  
  // East Asia & Global
  { value: 'Asia/Bangkok', label: 'Asia/Bangkok (ICT - Thailand, Indochina, UTC+7)', flag: '🇹🇭', group: 'East Asia & Global' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT - Singapore / Malaysia, UTC+8)', flag: '🇸🇬', group: 'East Asia & Global' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST - Japan, UTC+9)', flag: '🇯🇵', group: 'East Asia & Global' },
  { value: 'Europe/London', label: 'Europe/London (BST/GMT - United Kingdom, UTC+0/+1)', flag: '🇬🇧', group: 'East Asia & Global' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT - US Eastern, UTC-5/-4)', flag: '🇺🇸', group: 'East Asia & Global' },
  { value: 'UTC', label: 'UTC (Universal Coordinated Time, UTC+0)', flag: '🌐', group: 'East Asia & Global' }
];

export const TARGET_INDUSTRIES = [
  {
    id: 'Pharmacy & Healthcare',
    nameEn: 'Pharmacy, Medical Store & Healthcare',
    nameAr: 'Pharmacy & Medical Store',
    desc: 'Medical stores, retail pharmacies, drug batches, expiry date alerts, DRAP registration numbers & doctor prescriptions.',
    icon: HeartPulse,
    badgeColor: 'border-teal-500/40 bg-teal-500/10 text-teal-400',
    accentColor: '#14b8a6',
    suggestedModules: { inventory: true, pos: true, staff: true }
  },
  {
    id: 'Computer & IT',
    nameEn: 'Computer, IT & Printers',
    nameAr: 'IT & Hardware Services',
    desc: 'Laptops, desktops, printer toners, serial tracking & repair job cards.',
    icon: Laptop,
    badgeColor: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
    accentColor: '#2563eb',
    suggestedModules: { inventory: true, pos: false, staff: true }
  },
  {
    id: 'Retail Shop',
    nameEn: 'Retail Fashion & Apparel',
    nameAr: 'Retail & POS Counter',
    desc: 'Fast barcode counter POS, garments, shoes, sizes & thermal receipts.',
    icon: ShoppingBag,
    badgeColor: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
    accentColor: '#10b981',
    suggestedModules: { inventory: false, pos: true, staff: true }
  },
  {
    id: 'General Trading',
    nameEn: 'General Trading & Wholesale',
    nameAr: 'Wholesale & Distribution',
    desc: 'Import/export, multi-currency pricing, wholesale cartons & container docs.',
    icon: Globe,
    badgeColor: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
    accentColor: '#06b6d4',
    suggestedModules: { inventory: false, pos: false, staff: true }
  },
  {
    id: 'Construction',
    nameEn: 'Construction & Contracting',
    nameAr: 'Civil & Contracting',
    desc: 'Milestone invoicing, retention money, labor & materials, BOQ estimation.',
    icon: Hammer,
    badgeColor: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
    accentColor: '#f59e0b',
    suggestedModules: { inventory: false, pos: false, staff: true }
  },
  {
    id: 'Real Estate',
    nameEn: 'Real Estate & Properties',
    nameAr: 'Properties & Leasing',
    desc: 'Tenancy contracts, rental units, post-dated cheques (PDC) & commissions.',
    icon: Key,
    badgeColor: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400',
    accentColor: '#6366f1',
    suggestedModules: { inventory: false, pos: false, staff: true }
  },
  {
    id: 'Auto Repair',
    nameEn: 'Auto Garage & Workshop',
    nameAr: 'Garage & Spare Parts',
    desc: 'Vehicle plate numbers, chassis VIN, mechanic labor job cards & spare parts.',
    icon: Wrench,
    badgeColor: 'border-rose-500/40 bg-rose-500/10 text-rose-400',
    accentColor: '#f43f5e',
    suggestedModules: { inventory: true, pos: false, staff: true }
  },
  {
    id: 'Hardware Trading',
    nameEn: 'Hardware & Sanitary Ware',
    nameAr: 'Building Materials',
    desc: 'Sanitary fittings, electricals, plumbing, metric sizing & bulk pricing.',
    icon: Layers,
    badgeColor: 'border-orange-500/40 bg-orange-500/10 text-orange-400',
    accentColor: '#ea580c',
    suggestedModules: { inventory: true, pos: true, staff: true }
  },
  {
    id: 'Restaurant & Cafe',
    nameEn: 'Restaurant & Cafeteria',
    nameAr: 'Food & Beverage',
    desc: 'Table billing, kitchen order tickets (KOT), touch POS & fast deliveries.',
    icon: Utensils,
    badgeColor: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400',
    accentColor: '#eab308',
    suggestedModules: { inventory: false, pos: true, staff: true }
  },
  {
    id: 'Gold & Jewelry',
    nameEn: 'Gold & Jewelry Trading',
    nameAr: 'Jewelry & Bullion',
    desc: 'Purity karats (18K/21K/22K/24K), making charges & live gold gram weight.',
    icon: Gem,
    badgeColor: 'border-yellow-400/40 bg-yellow-400/10 text-yellow-300',
    accentColor: '#ca8a04',
    suggestedModules: { inventory: true, pos: true, staff: true }
  },
  {
    id: 'Logistics & Transport',
    nameEn: 'Logistics & Freight Cargo',
    nameAr: 'Cargo & Logistics',
    desc: 'Waybills, consignment numbers, fleet vehicles & cargo dispatch tracking.',
    icon: Truck,
    badgeColor: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
    accentColor: '#a855f7',
    suggestedModules: { inventory: false, pos: false, staff: true }
  },
  {
    id: 'Professional Services',
    nameEn: 'Consulting & Legal Services',
    nameAr: 'Advisory & Services',
    desc: 'Client retainers, service contracts, billing hours & advisory invoices.',
    icon: Briefcase,
    badgeColor: 'border-slate-500/40 bg-slate-500/10 text-slate-300',
    accentColor: '#64748b',
    suggestedModules: { inventory: false, pos: false, staff: true }
  }
];

export const BRAND_COLORS = [
  { name: 'Emerald', hex: '#10b981', ring: 'ring-emerald-500' },
  { name: 'Royal Blue', hex: '#2563eb', ring: 'ring-blue-500' },
  { name: 'Indigo', hex: '#4f46e5', ring: 'ring-indigo-500' },
  { name: 'Purple', hex: '#8b5cf6', ring: 'ring-purple-500' },
  { name: 'Teal', hex: '#0d9488', ring: 'ring-teal-500' },
  { name: 'Amber', hex: '#f59e0b', ring: 'ring-amber-500' },
  { name: 'Crimson', hex: '#e11d48', ring: 'ring-rose-500' },
  { name: 'Slate', hex: '#334155', ring: 'ring-slate-400' }
];

export default function CorporateSetupWizard({
  company,
  onSaveAndEnter,
  onSkip,
  isModal = false
}: CorporateSetupWizardProps) {
  // Step navigation: 1 = Country & Profile, 2 = Logo & Brand, 3 = Regional & Time, 4 = Target Industry, 5 = Bank & Launch
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Country & Jurisdictional Presets
  const initialCountryCode = (company.country || company.gccCountry || 'UAE') as SupportedCountry;
  const [selectedCountry, setSelectedCountry] = useState<SupportedCountry>(
    initialCountryCode in COUNTRIES_CONFIG ? initialCountryCode : 'UAE'
  );

  const countryConfig = getCountryConfig(selectedCountry);

  // Company Details
  const [name, setName] = useState<string>(company.name || 'Al Mansoor International Trading LLC');
  const [nameAr, setNameAr] = useState<string>(company.nameAr || '');
  const [trn, setTrn] = useState<string>(company.trn || '100234567800003');
  const [businessRegNo, setBusinessRegNo] = useState<string>(company.businessRegNo || 'CN-1092834');
  const [selectedRegion, setSelectedRegion] = useState<string>(countryConfig.defaultRegion);
  const [address, setAddress] = useState<string>(company.address || `${countryConfig.defaultRegion}, ${countryConfig.name}`);
  const [phone, setPhone] = useState<string>(company.phone || '+971 4 234 5678');
  const [email, setEmail] = useState<string>(company.email || 'info@company.com');
  const [fyStart, setFyStart] = useState<string>(company.fyStart || '2026-01-01');

  // Pharmacy & Medical Store Attributes
  const [pharmaLicenseNo, setPharmaLicenseNo] = useState<string>(company.pharmaLicenseNo || '');
  const [pharmaPharmacistName, setPharmaPharmacistName] = useState<string>(company.pharmaPharmacistName || '');
  const [pharmaShowBatchExpiry, setPharmaShowBatchExpiry] = useState<boolean>(company.pharmaShowBatchExpiry ?? true);
  const [pharmaDrapRegistered, setPharmaDrapRegistered] = useState<boolean>(company.pharmaDrapRegistered ?? true);

  // Logo & Branding
  const [logoUrl, setLogoUrl] = useState<string>(company.logoUrl || '');
  const [logoPosition, setLogoPosition] = useState<'left' | 'center' | 'right'>(company.logoPosition || 'left');
  const [logoSize, setLogoSize] = useState<'small' | 'medium' | 'large'>(company.logoSize || 'medium');
  const [themePrimaryColor, setThemePrimaryColor] = useState<string>(company.themePrimaryColor || '#10b981');
  const [tagline, setTagline] = useState<string>(company.tagline || 'Leading Commercial Supply & Distribution Solutions');

  // Regional & Settings & Time
  const getDefaultTimezone = (cntry: SupportedCountry): string => {
    switch (cntry) {
      case 'Pakistan': return 'Asia/Karachi';
      case 'UAE': return 'Asia/Dubai';
      case 'Bangladesh': return 'Asia/Dhaka';
      case 'India': return 'Asia/Kolkata';
      case 'KSA': return 'Asia/Riyadh';
      case 'Oman': return 'Asia/Muscat';
      case 'Qatar': return 'Asia/Qatar';
      case 'Kuwait': return 'Asia/Kuwait';
      case 'Bahrain': return 'Asia/Bahrain';
      case 'Nepal': return 'Asia/Kathmandu';
      default: return 'Asia/Dubai';
    }
  };

  const [timezone, setTimezone] = useState<string>(company.timezone || getDefaultTimezone(selectedCountry));
  const [dateFormat, setDateFormat] = useState<string>(company.dateFormat || 'DD/MM/YYYY');
  const [currency, setCurrency] = useState<string>(countryConfig.currency);
  const [currencySymbol, setCurrencySymbol] = useState<string>(countryConfig.symbol);
  const [taxRate, setTaxRate] = useState<number>(countryConfig.taxRate);
  const [taxName, setTaxName] = useState<string>(countryConfig.taxName);
  const [vatEnabled, setVatEnabled] = useState<boolean>(countryConfig.vatEnabled);
  const [corporateTaxEnabled, setCorporateTaxEnabled] = useState<boolean>(company.corporateTaxEnabled || false);

  // Operational feature toggles (Rule 5: Inventory OFF by default)
  const [inventoryEnabled, setInventoryEnabled] = useState<boolean>(company.inventoryEnabled ?? false);
  const [posEnabled, setPosEnabled] = useState<boolean>(company.posEnabled ?? false);
  const [staffEnabled, setStaffEnabled] = useState<boolean>(company.staffEnabled !== false);
  const [multiBranchEnabled, setMultiBranchEnabled] = useState<boolean>(company.multiBranchEnabled ?? false);

  // Target Industry
  const [targetIndustry, setTargetIndustry] = useState<string>(company.targetIndustry || company.industry || 'Computer & IT');

  // Banking & Invoicing
  const [bankName, setBankName] = useState<string>(company.bankName || (selectedCountry === 'Pakistan' ? 'Habib Bank Limited (HBL)' : selectedCountry === 'Bangladesh' ? 'BRAC Bank' : selectedCountry === 'India' ? 'HDFC Bank' : 'Emirates NBD'));
  const [bankAccountName, setBankAccountName] = useState<string>(company.bankAccountName || 'Al Mansoor International Trading');
  const [bankIban, setBankIban] = useState<string>(company.bankIban || (selectedCountry === 'Pakistan' ? 'PK36HABB0000001234567801' : 'AE120260001234567890123'));
  const [invoicePrefix, setInvoicePrefix] = useState<string>(company.invoicePrefix || 'INV-');
  const [quotationPrefix, setQuotationPrefix] = useState<string>(company.quotationPrefix || 'QTN-');
  const [deliveryPrefix, setDeliveryPrefix] = useState<string>(company.deliveryPrefix || 'DN-');
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState<number>(company.nextInvoiceNumber || 1001);

  // Country switch logic: Auto-tunes all jurisdictional standards
  const handleSelectCountry = (countryCode: SupportedCountry) => {
    setSelectedCountry(countryCode);
    const cfg = COUNTRIES_CONFIG[countryCode];
    if (!cfg) return;

    const newTz = getDefaultTimezone(countryCode);
    setTimezone(newTz);
    setCurrency(cfg.currency);
    setCurrencySymbol(cfg.symbol);
    setTaxRate(cfg.taxRate);
    setTaxName(cfg.taxName);
    setVatEnabled(cfg.vatEnabled);
    setSelectedRegion(cfg.defaultRegion);
    setDateFormat('DD/MM/YYYY');
    setAddress(`${cfg.defaultRegion}, ${cfg.name}`);
    
    // Suggest default banking institution
    if (countryCode === 'Pakistan') {
      setBankName('Habib Bank Limited (HBL)');
      setBankIban('PK36HABB0000001234567801');
      setPhone('+92 300 1234567');
      if (trn.startsWith('100')) setTrn('1234567-8');
    } else if (countryCode === 'Bangladesh') {
      setBankName('BRAC Bank Ltd');
      setBankIban('BD12BRAC0001234567890');
      setPhone('+880 17 1234 5678');
      if (trn.startsWith('100')) setTrn('000123456-0101');
    } else if (countryCode === 'India') {
      setBankName('HDFC Bank');
      setBankIban('HDFC0000128');
      setPhone('+91 98200 12345');
      if (trn.startsWith('100')) setTrn('27AAAAA0000A1Z5');
    } else if (countryCode === 'KSA') {
      setBankName('Al Rajhi Bank');
      setBankIban('SA1280000123456789012345');
      setPhone('+966 50 123 4567');
      if (trn.startsWith('100')) setTrn('300234567800003');
    } else {
      setBankName('Emirates NBD');
      setBankIban('AE120260001234567890123');
      setPhone('+971 4 234 5678');
    }
  };

  // Logo file upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Industry selection handler
  const handleSelectIndustry = (indId: string) => {
    setTargetIndustry(indId);
    const indConfig = TARGET_INDUSTRIES.find(t => t.id === indId);
    if (indConfig) {
      setThemePrimaryColor(indConfig.accentColor);
      if (indConfig.suggestedModules.pos !== undefined) {
        setPosEnabled(indConfig.suggestedModules.pos);
      }
      if (indConfig.suggestedModules.inventory !== undefined) {
        setInventoryEnabled(indConfig.suggestedModules.inventory);
      }
    }
  };

  // Save & Enter
  const handleFinalSave = () => {
    if (!name.trim()) {
      alert('Please enter your Company Legal Trade Name.');
      setCurrentStep(1);
      return;
    }

    const updatedCompany: Company = {
      ...company,
      name: name.trim(),
      nameAr: nameAr.trim() || undefined,
      trn: trn.trim(),
      businessRegNo: businessRegNo.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      fyStart,
      logoUrl: logoUrl || undefined,
      logoPosition,
      logoSize,
      themePrimaryColor,
      themeSecondaryColor: themePrimaryColor,
      tagline: tagline.trim(),
      country: selectedCountry,
      gccCountry: selectedCountry,
      currency,
      currencySymbol,
      taxRate,
      taxName,
      timezone,
      dateFormat,
      vatEnabled,
      corporateTaxEnabled,
      inventoryEnabled,
      posEnabled,
      staffEnabled,
      multiBranchEnabled,
      targetIndustry,
      industry: targetIndustry,
      pharmaLicenseNo: pharmaLicenseNo.trim(),
      pharmaPharmacistName: pharmaPharmacistName.trim(),
      pharmaShowBatchExpiry,
      pharmaDrapRegistered,
      bankName: bankName.trim(),
      bankAccountName: bankAccountName.trim(),
      bankIban: bankIban.trim(),
      invoicePrefix: invoicePrefix.trim() || 'INV-',
      quotationPrefix: quotationPrefix.trim() || 'QTN-',
      deliveryPrefix: deliveryPrefix.trim() || 'DN-',
      nextInvoiceNumber: Number(nextInvoiceNumber) || 1001,
      isSetupCompleted: true
    };

    onSaveAndEnter(updatedCompany);
  };

  return (
    <div className={`w-full ${isModal ? 'max-w-5xl mx-auto my-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl' : 'min-h-screen bg-[#070B13]'} flex flex-col font-sans text-slate-100`}>
      
      {/* Top Header / Progress Indicator */}
      <div className="bg-[#090F1C]/95 backdrop-blur-md border-b border-slate-800/90 px-6 sm:px-10 py-4.5 sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-emerald-500 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#070B13] rounded-[10px] flex items-center justify-center">
              <Building className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Corporate Setup Hub</span>
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  Standard Operating Setup
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select your business country, company credentials, logo, timezone, and specialized target industry.
            </p>
          </div>
        </div>

        {/* Wizard Step Tabs */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 self-start md:self-auto overflow-x-auto py-1">
          {[
            { num: 1, title: 'Country & Profile', icon: Globe },
            { num: 2, title: 'Logo & Brand', icon: ImageIcon },
            { num: 3, title: 'Regional & Time', icon: Clock },
            { num: 4, title: 'Target Industry', icon: Sparkles },
            { num: 5, title: 'Bank & Launch', icon: CreditCard }
          ].map(s => {
            const Icon = s.icon;
            const isActive = currentStep === s.num;
            const isDone = currentStep > s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setCurrentStep(s.num)}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                    : isDone
                    ? 'bg-slate-800 text-emerald-400 hover:bg-slate-750'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {isDone ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{s.title}</span>
                <span className="sm:hidden">{s.num}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Form Work Area */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8">
        
        {/* Step 1: Country & Business Legal Identity */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-indigo-400" />
                    <span>01. Operational Country & Legal Entity Profile</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Select your primary country to automatically apply official tax laws, currency, timezone, and document structures.
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
                  Step 1 of 5
                </span>
              </div>

              {/* Country Selection Grid */}
              <div className="mb-6">
                <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>Select Primary Country of Operation</span>
                  <span className="text-emerald-400 text-[10px] font-mono">Auto-Tuning Enabled</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {COUNTRY_OPTIONS.map(c => {
                    const isSelected = selectedCountry === c.code;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleSelectCountry(c.code)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/80 text-white shadow-lg shadow-indigo-600/10'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{c.flag}</span>
                          {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                        </div>
                        <div className="mt-2">
                          <div className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                            {c.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                            {c.nativeName}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Auto-Configuration Summary Banner */}
                <div className="mt-3.5 p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-300">
                      Configured for <strong className="text-white">{countryConfig.name}</strong>:
                    </span>
                  </div>
                  <div className="flex items-center flex-wrap gap-2 text-[10.5px] font-mono">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      Currency: {currency} ({currencySymbol})
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      Tax: {taxRate}% {taxName}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      Timezone: {timezone}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      Format: {dateFormat}
                    </span>
                  </div>
                </div>
              </div>

              {/* Company Details Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                
                {/* English Trade Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Company Trade Name (English) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Al Mansoor General Trading LLC"
                    className="w-full bg-slate-950 border border-slate-750 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white rounded-xl px-4 py-2.5 outline-hidden transition-all text-sm font-semibold"
                  />
                </div>

                {/* Business Branch / Secondary Subtitle */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Business Subtitle / Branch Description (English)</span>
                    <span className="text-slate-400 text-[10px]">Optional Subtitle</span>
                  </label>
                  <input
                    type="text"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="e.g. Retail Division / Medical Branch 01"
                    className="w-full bg-slate-950 border border-slate-750 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white rounded-xl px-4 py-2.5 outline-hidden transition-all text-sm font-medium"
                  />
                </div>

                {/* Tax ID / TRN / NTN / GSTIN */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>{countryConfig.taxIdLabel}</span>
                    <span className="text-slate-400 font-mono text-[10px]">{countryConfig.taxAuthorityShort}</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={trn}
                      onChange={(e) => setTrn(e.target.value)}
                      placeholder={countryConfig.taxIdPlaceholder}
                      className="w-full bg-slate-950 border border-slate-750 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-emerald-400 rounded-xl px-4 py-2.5 outline-hidden transition-all font-mono text-sm tracking-wider"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {countryConfig.taxIdHelper}
                  </p>
                </div>

                {/* Commercial Reg / License No */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Commercial License / Reg No.
                  </label>
                  <input
                    type="text"
                    value={businessRegNo}
                    onChange={(e) => setBusinessRegNo(e.target.value)}
                    placeholder="e.g. CN-1092834 / DED-8921"
                    className="w-full bg-slate-950 border border-slate-750 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white rounded-xl px-4 py-2.5 outline-hidden transition-all text-sm"
                  />
                </div>

                {/* Province / Emirate / State */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    {countryConfig.regionLabel}
                  </label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => {
                      setSelectedRegion(e.target.value);
                      setAddress(`${e.target.value}, ${countryConfig.name}`);
                    }}
                    className="w-full bg-slate-950 border border-slate-750 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white rounded-xl px-4 py-2.5 outline-hidden transition-all text-sm cursor-pointer"
                  >
                    {countryConfig.regions.map(r => (
                      <option key={r} value={r}>{r} - {countryConfig.name}</option>
                    ))}
                  </select>
                </div>

                {/* Financial Year Start */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Financial Year Start Date
                  </label>
                  <input
                    type="date"
                    value={fyStart}
                    onChange={(e) => setFyStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-750 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white rounded-xl px-4 py-2.5 outline-hidden transition-all text-sm"
                  />
                </div>

                {/* Official Business Address */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Official Business Address (Prints on Invoices)
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Office address, street, city and country"
                    className="w-full bg-slate-950 border border-slate-750 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white rounded-xl px-4 py-2.5 outline-hidden transition-all text-sm"
                  />
                </div>

                {/* Contact Phone & Email */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Official Contact Phone</span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+971 4 234 5678"
                    className="w-full bg-slate-950 border border-slate-750 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white rounded-xl px-4 py-2.5 outline-hidden transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Billing & Support Email</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="billing@company.com"
                    className="w-full bg-slate-950 border border-slate-750 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white rounded-xl px-4 py-2.5 outline-hidden transition-all text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Logo & Visual Brand Appearance */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-indigo-400" />
                    <span>02. Corporate Emblem, Colors & Visual Branding</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Upload your company logo and define your corporate accent styling across printouts.
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
                  Step 2 of 5
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-xs">
                {/* Logo Upload Box */}
                <div className="lg:col-span-6 space-y-4">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Company Logo (PNG, JPG, SVG)
                  </label>
                  
                  <div className="border-2 border-dashed border-slate-750 hover:border-indigo-500/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-slate-950/60 transition-all relative group">
                    {logoUrl ? (
                      <div className="space-y-4 flex flex-col items-center">
                        <div className="p-3 bg-white rounded-xl border border-slate-750 shadow-md">
                          <img
                            src={logoUrl}
                            alt="Uploaded Logo Preview"
                            className="max-h-24 max-w-[240px] object-contain"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs rounded-lg font-bold cursor-pointer transition-colors flex items-center space-x-1.5">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Change Logo</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setLogoUrl('')}
                            className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs rounded-lg font-bold transition-colors flex items-center space-x-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 flex flex-col items-center">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Click or drag logo here to upload</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Supports PNG, JPG, WebP up to 2MB</p>
                        </div>
                        <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-2">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Select Image File</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Logo Layout Controls */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Logo Position on Invoices
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['left', 'center', 'right'] as const).map(pos => (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => setLogoPosition(pos)}
                            className={`py-2 px-2 text-center text-xs font-bold rounded-xl border capitalize transition-all ${
                              logoPosition === pos
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Logo Print Size
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['small', 'medium', 'large'] as const).map(sz => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setLogoSize(sz)}
                            className={`py-2 px-2 text-center text-xs font-bold rounded-xl border capitalize transition-all ${
                              logoSize === sz
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Corporate Theme Accent & Tagline */}
                <div className="lg:col-span-6 space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Corporate Brand Color Palette
                    </label>
                    <div className="grid grid-cols-4 gap-2.5">
                      {BRAND_COLORS.map(color => (
                        <button
                          key={color.hex}
                          type="button"
                          onClick={() => setThemePrimaryColor(color.hex)}
                          className={`flex items-center space-x-2 p-2 rounded-xl border transition-all cursor-pointer ${
                            themePrimaryColor === color.hex
                              ? 'bg-slate-800 border-white/40 ring-2 ' + color.ring
                              : 'bg-slate-950 border-slate-800 hover:bg-slate-900'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="text-[11px] font-bold text-slate-300 truncate">
                            {color.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Corporate Tagline / Slogan
                    </label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="e.g. Excellence in Commercial Supplies & GCC Distribution"
                      className="w-full bg-slate-950 border border-slate-750 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white rounded-xl px-4 py-2.5 outline-hidden transition-all text-sm"
                    />
                  </div>

                  {/* Live Letterhead Header Card Preview */}
                  <div className="p-4 rounded-2xl bg-white text-slate-900 border border-slate-300 shadow-md">
                    <div className="text-[10px] font-mono uppercase font-black tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1 flex justify-between items-center">
                      <span>Official Document Header Preview</span>
                      <span className="text-emerald-700 font-bold">{countryConfig.name}</span>
                    </div>
                    <div className={`flex items-center justify-between gap-3 ${logoPosition === 'right' ? 'flex-row-reverse' : ''}`}>
                      <div className="flex items-center space-x-3">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-slate-600 text-xs">
                            LOGO
                          </div>
                        )}
                        <div>
                          <h3 className="font-black text-sm text-slate-900 leading-tight" style={{ color: themePrimaryColor }}>
                            {name || 'Company Name'}
                          </h3>
                          <p className="text-[11px] font-semibold text-slate-600 leading-tight">
                            {nameAr || tagline || 'Standard Business Invoice'}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{tagline}</p>
                        </div>
                      </div>
                      <div className="text-right text-[10px] text-slate-600 font-mono">
                        <div className="font-bold text-slate-900">{countryConfig.taxInvoiceTitle}</div>
                        {trn && <div className="text-emerald-700 font-bold">{countryConfig.taxIdShortLabel}: {trn}</div>}
                        <div>{selectedRegion}, {countryConfig.name}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Regional Standards, Asian Timezones & Operational Modules */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-400" />
                    <span>03. Timezone, Regional Formatting & Active Modules</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Select your corporate timezone (Pakistan, Dubai, Bangladesh, India, KSA, etc.) and toggle active features.
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
                  Step 3 of 5
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Timezone Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Corporate Timezone (Asia / GCC / Global)</span>
                    <span className="text-emerald-400 font-mono text-[10px]">Synchronized</span>
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-750 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white rounded-xl px-4 py-2.5 outline-hidden transition-all text-sm cursor-pointer font-medium"
                  >
                    <optgroup label="South Asia & Central Asia">
                      {TIMEZONE_OPTIONS.filter(t => t.group === 'South Asia').map(tz => (
                        <option key={tz.value} value={tz.value}>{tz.flag} {tz.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="GCC & Middle East">
                      {TIMEZONE_OPTIONS.filter(t => t.group === 'GCC & Middle East').map(tz => (
                        <option key={tz.value} value={tz.value}>{tz.flag} {tz.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="East Asia & Global">
                      {TIMEZONE_OPTIONS.filter(t => t.group === 'East Asia & Global').map(tz => (
                        <option key={tz.value} value={tz.value}>{tz.flag} {tz.label}</option>
                      ))}
                    </optgroup>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    All document dates, transaction audit logs, and POS clock will strictly follow this timezone.
                  </p>
                </div>

                {/* Date Format */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Standard Date Format
                  </label>
                  <select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-750 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white rounded-xl px-4 py-2.5 outline-hidden transition-all text-sm cursor-pointer font-mono"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (Standard - e.g. 23/09/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601 - e.g. 2026-09-23)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (US Format - e.g. 09/23/2026)</option>
                    <option value="DD-MM-YYYY">DD-MM-YYYY (Hyphenated - e.g. 23-09-2026)</option>
                  </select>
                </div>

                {/* Tax Compliance Card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Percent className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-white text-sm">{countryConfig.taxDescription}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {countryConfig.taxAuthorityShort}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Enforces {taxRate}% {taxName} calculations on sales documents, purchase entries, and periodic return forms.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={vatEnabled}
                      onChange={(e) => setVatEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Corporate Tax / Direct Tax Toggle */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-blue-400" />
                      <span className="font-bold text-white text-sm">Corporate Profit Tax (9%)</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Annual P&L
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Enable annual taxable income ledger tracking and year-end net corporate tax declarations.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={corporateTaxEnabled}
                      onChange={(e) => setCorporateTaxEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Modular Feature Toggles */}
                <div className="md:col-span-2 pt-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Operational Feature Modules</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Inventory Toggle (Rule 5: default OFF) */}
                    <div 
                      onClick={() => setInventoryEnabled(!inventoryEnabled)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        inventoryEnabled
                          ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/40 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Package className={`w-4 h-4 ${inventoryEnabled ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <span className={`w-2 h-2 rounded-full ${inventoryEnabled ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`} />
                      </div>
                      <div className="mt-3">
                        <p className="font-bold text-xs text-white">Inventory Management</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Strict SKU & warehouse stock check</p>
                      </div>
                    </div>

                    {/* Fast POS */}
                    <div 
                      onClick={() => setPosEnabled(!posEnabled)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        posEnabled
                          ? 'bg-amber-950/40 border-amber-500/60 ring-1 ring-amber-500/40 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Printer className={`w-4 h-4 ${posEnabled ? 'text-amber-400' : 'text-slate-500'}`} />
                        <span className={`w-2 h-2 rounded-full ${posEnabled ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
                      </div>
                      <div className="mt-3">
                        <p className="font-bold text-xs text-white">Express Thermal POS</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Fast counter billing & 80mm receipts</p>
                      </div>
                    </div>

                    {/* Staff & HR */}
                    <div 
                      onClick={() => setStaffEnabled(!staffEnabled)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        staffEnabled
                          ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/40 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Users className={`w-4 h-4 ${staffEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span className={`w-2 h-2 rounded-full ${staffEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                      </div>
                      <div className="mt-3">
                        <p className="font-bold text-xs text-white">Staff & HR Management</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">WPS payroll & staff permissions</p>
                      </div>
                    </div>

                    {/* Multi-Branch */}
                    <div 
                      onClick={() => setMultiBranchEnabled(!multiBranchEnabled)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        multiBranchEnabled
                          ? 'bg-purple-950/40 border-purple-500/60 ring-1 ring-purple-500/40 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <GitBranch className={`w-4 h-4 ${multiBranchEnabled ? 'text-purple-400' : 'text-slate-500'}`} />
                        <span className={`w-2 h-2 rounded-full ${multiBranchEnabled ? 'bg-purple-400 animate-pulse' : 'bg-slate-600'}`} />
                      </div>
                      <div className="mt-3">
                        <p className="font-bold text-xs text-white">Multi-Branch System</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Outlets, warehouses & inter-transfer</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Target Industry Selection */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <span>04. Target Industry Sector & Specialized Workflows</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Select your business specialization to enable domain-specific fields, terminology, and workflows.
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
                  Step 4 of 5
                </span>
              </div>

              {/* Industry Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {TARGET_INDUSTRIES.map(ind => {
                  const Icon = ind.icon;
                  const isSelected = targetIndustry === ind.id;
                  return (
                    <div
                      key={ind.id}
                      onClick={() => handleSelectIndustry(ind.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between ${
                        isSelected
                          ? 'bg-slate-800/95 border-indigo-500 ring-2 ring-indigo-500 shadow-xl shadow-indigo-500/10 scale-[1.01]'
                          : 'bg-slate-950 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/50'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div>
                        <div className="flex items-center space-x-3 mb-2.5">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                            style={{
                              backgroundColor: `${ind.accentColor}18`,
                              borderColor: `${ind.accentColor}40`,
                              color: ind.accentColor
                            }}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-white leading-snug">
                              {ind.nameEn}
                            </h3>
                            <p className="text-[11px] font-medium text-slate-400 leading-tight">
                              {ind.nameAr}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed mb-3">
                          {ind.desc}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                        <span className={`px-2 py-0.5 rounded-md border ${ind.badgeColor}`}>
                          {ind.id}
                        </span>
                        <span className="text-slate-500 group-hover:text-slate-300 transition-colors">
                          {isSelected ? '✓ Active Sector' : 'Click to select'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Specialized Pharmaceutical & Medical Store Attributes */}
              {(targetIndustry === 'Pharmacy & Healthcare' || targetIndustry === 'Pharmaceutical' || targetIndustry.toLowerCase().includes('pharm')) && (
                <div className="mt-6 p-5 rounded-2xl bg-teal-950/20 border border-teal-500/40 space-y-4">
                  <div className="flex items-center space-x-2.5 pb-3 border-b border-teal-500/20">
                    <HeartPulse className="w-5 h-5 text-teal-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Pharmacy & Medical Store Compliance Profile</span>
                        <span className="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-[10px] font-mono text-teal-300">
                          DRAP / Healthcare Ready
                        </span>
                      </h4>
                      <p className="text-xs text-slate-300">
                        Tailored for retail medical stores, wholesale pharmacies, doctor clinics, and drug distribution setups.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Drug Sale License (DSL) No.
                      </label>
                      <input
                        type="text"
                        value={pharmaLicenseNo}
                        onChange={(e) => setPharmaLicenseNo(e.target.value)}
                        placeholder="e.g. DSL-05-38472 / DHA-PH-8109"
                        className="w-full bg-slate-950 border border-slate-750 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-teal-300 rounded-xl px-4 py-2.5 outline-hidden transition-all text-sm font-mono"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Official state / provincial pharmacy drug sale license number printed on invoices.</p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Registered Pharmacist / Dispenser In-Charge
                      </label>
                      <input
                        type="text"
                        value={pharmaPharmacistName}
                        onChange={(e) => setPharmaPharmacistName(e.target.value)}
                        placeholder="e.g. Dr. Muhammad Farhan, Pharm-D"
                        className="w-full bg-slate-950 border border-slate-750 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white rounded-xl px-4 py-2.5 outline-hidden transition-all text-sm font-semibold"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Required for regulatory audit, narcotics verification, and legal prescription sale logs.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <label className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 cursor-pointer hover:border-slate-700">
                      <input
                        type="checkbox"
                        checked={pharmaShowBatchExpiry}
                        onChange={(e) => setPharmaShowBatchExpiry(e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 bg-slate-900 border-slate-700 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">Auto-Print Batch Number & Expiry (MM/YY)</span>
                        <span className="text-[11px] text-slate-400 block">Enables batch tracking and expiry date validation across customer invoices</span>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 cursor-pointer hover:border-slate-700">
                      <input
                        type="checkbox"
                        checked={pharmaDrapRegistered}
                        onChange={(e) => setPharmaDrapRegistered(e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 bg-slate-900 border-slate-700 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">DRAP / MOH Drug Regulatory Compliance</span>
                        <span className="text-[11px] text-slate-400 block">Enables drug generic formula display, dosage forms (Tab/Syp/Inj) & strip pricing</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Selected Industry Confirmation Banner */}
              <div className="mt-6 p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-white">Target Sector Selected: {targetIndustry}</span>
                    <p className="text-[11px] text-slate-300">
                      evonix Hissab will tailor invoice lines, item categories, and operational reporting specifically for this industry.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Banking Details, Invoicing Series & Final Launch */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-400" />
                    <span>05. Bank Details, Invoice Prefix & Final Launch</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Provide bank account settlement details, set your starting invoice numbering, and launch into the system.
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                  Final Step
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                {/* Bank Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. Emirates NBD / HBL / HDFC Bank"
                    className="w-full bg-slate-950 border border-slate-750 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white rounded-xl px-4 py-2.5 outline-hidden transition-all text-sm"
                  />
                </div>

                {/* Account Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Account Beneficiary Name
                  </label>
                  <input
                    type="text"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    placeholder="e.g. Al Mansoor International Trading"
                    className="w-full bg-slate-950 border border-slate-750 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white rounded-xl px-4 py-2.5 outline-hidden transition-all text-sm"
                  />
                </div>

                {/* IBAN / Account Number */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>IBAN / Bank Account Number</span>
                    <span className="text-slate-400 font-mono text-[10px]">{selectedCountry} Format</span>
                  </label>
                  <input
                    type="text"
                    value={bankIban}
                    onChange={(e) => setBankIban(e.target.value.toUpperCase())}
                    placeholder="e.g. AE120260001234567890123 / PK36HABB0000001234567801"
                    className="w-full bg-slate-950 border border-slate-750 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-emerald-400 rounded-xl px-4 py-2.5 outline-hidden transition-all text-sm font-mono tracking-wider"
                  />
                </div>

                {/* Invoice Prefix */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Tax Invoice Prefix
                  </label>
                  <input
                    type="text"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    placeholder="INV-"
                    className="w-full bg-slate-950 border border-slate-750 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white rounded-xl px-4 py-2.5 outline-hidden transition-all text-sm font-mono"
                  />
                </div>

                {/* Starting Number */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Starting Invoice Number
                  </label>
                  <input
                    type="number"
                    value={nextInvoiceNumber}
                    onChange={(e) => setNextInvoiceNumber(Number(e.target.value) || 1)}
                    placeholder="1001"
                    className="w-full bg-slate-950 border border-slate-750 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white rounded-xl px-4 py-2.5 outline-hidden transition-all text-sm font-mono"
                  />
                </div>

                {/* Quotation & Delivery prefixes */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Quotation Prefix
                  </label>
                  <input
                    type="text"
                    value={quotationPrefix}
                    onChange={(e) => setQuotationPrefix(e.target.value)}
                    placeholder="QTN-"
                    className="w-full bg-slate-950 border border-slate-750 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white rounded-xl px-4 py-2.5 outline-hidden transition-all text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Delivery Note Prefix
                  </label>
                  <input
                    type="text"
                    value={deliveryPrefix}
                    onChange={(e) => setDeliveryPrefix(e.target.value)}
                    placeholder="DN-"
                    className="w-full bg-slate-950 border border-slate-750 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white rounded-xl px-4 py-2.5 outline-hidden transition-all text-sm font-mono"
                  />
                </div>
              </div>

              {/* Ready Confirmation Summary Box */}
              <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-emerald-950/60 border border-indigo-500/40 flex flex-col md:flex-row items-center justify-between gap-5">
                <div className="space-y-1.5 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start space-x-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Corporate Configuration Verified & Ready</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Jurisdiction: <strong>{countryConfig.name}</strong> • Timezone: <strong>{timezone}</strong> • Sector: <strong>{targetIndustry}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleFinalSave}
                  className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm tracking-wide rounded-xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-2.5"
                >
                  <span>Save Configuration & Enter evonix Hissab</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step Navigation Controls */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              onSkip && (
                <button
                  type="button"
                  onClick={onSkip}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Skip for now
                </button>
              )
            )}
          </div>

          <div className="flex items-center space-x-3">
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center space-x-2"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSave}
                className="px-8 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center space-x-2"
              >
                <span>Save & Enter Portal</span>
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
