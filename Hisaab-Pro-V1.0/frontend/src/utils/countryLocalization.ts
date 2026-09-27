/**
 * Country & Regional Localization Engine for Hisaab Pro
 * Supporting GCC (UAE, KSA, Oman, Bahrain, Qatar, Kuwait) 
 * and Asia (Pakistan, India, Bangladesh, Nepal)
 */

export type SupportedCountry = 
  | 'UAE' 
  | 'KSA' 
  | 'Oman' 
  | 'Bahrain' 
  | 'Qatar' 
  | 'Kuwait' 
  | 'Pakistan' 
  | 'India' 
  | 'Bangladesh' 
  | 'Nepal';

export type ContinentRegion = 'GCC' | 'Asia';

export interface CountryConfig {
  code: SupportedCountry;
  name: string;
  nativeName: string;
  flag: string;
  continent: ContinentRegion;
  currency: string;
  currencyName: string;
  symbol: string;
  decimals: number;
  taxName: string;
  taxRate: number;
  vatEnabled: boolean;
  taxAuthority: string;
  taxAuthorityShort: string;
  taxIdLabel: string;
  taxIdShortLabel: string;
  taxIdPlaceholder: string;
  taxIdMinLength: number;
  taxIdMaxLength: number;
  taxIdRegex: RegExp;
  taxIdHelper: string;
  regionTypeName: string;
  regionLabel: string;
  regions: string[];
  defaultRegion: string;
  taxReturnFormName: string;
  taxInvoiceTitle: string;
  vendorRegisteredLabel: string;
  taxDescription: string;
  box1Label: string;
  box4Label: string;
  box9Label: string;
  desc: string;
}

export const COUNTRIES_CONFIG: Record<SupportedCountry, CountryConfig> = {
  UAE: {
    code: 'UAE',
    name: 'United Arab Emirates',
    nativeName: 'United Arab Emirates',
    flag: '🇦🇪',
    continent: 'GCC',
    currency: 'AED',
    currencyName: 'UAE Dirham',
    symbol: 'AED',
    decimals: 2,
    taxName: 'VAT',
    taxRate: 5,
    vatEnabled: true,
    taxAuthority: 'Federal Tax Authority (FTA)',
    taxAuthorityShort: 'FTA',
    taxIdLabel: 'Company Tax Registration Number (TRN)',
    taxIdShortLabel: 'TRN',
    taxIdPlaceholder: '15-digit FTA TRN (e.g. 100123456700003)',
    taxIdMinLength: 15,
    taxIdMaxLength: 15,
    taxIdRegex: /^\d{15}$/,
    taxIdHelper: '15-digit TRN issued by UAE Federal Tax Authority',
    regionTypeName: 'Emirate',
    regionLabel: 'UAE Emirate of Supply',
    regions: ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'],
    defaultRegion: 'Dubai',
    taxReturnFormName: 'VAT Return Form 201',
    taxInvoiceTitle: 'Tax Invoice',
    vendorRegisteredLabel: 'UAE Registered Vendor (FTA)',
    taxDescription: 'UAE VAT Standard 5.0%',
    box1Label: 'Box 1: Standard Rated Supplies (Sales)',
    box4Label: 'Box 4: Standard Rated Expenses (Purchases & OPEX)',
    box9Label: 'Box 9: Net VAT Payable / Recoverable Summary',
    desc: '5% Standard VAT • FTA Compliant'
  },
  KSA: {
    code: 'KSA',
    name: 'Saudi Arabia',
    nativeName: 'Kingdom of Saudi Arabia',
    flag: '🇸🇦',
    continent: 'GCC',
    currency: 'SAR',
    currencyName: 'Saudi Riyal',
    symbol: 'SAR',
    decimals: 2,
    taxName: 'VAT',
    taxRate: 15,
    vatEnabled: true,
    taxAuthority: 'Zakat, Tax and Customs Authority (ZATCA)',
    taxAuthorityShort: 'ZATCA',
    taxIdLabel: 'ZATCA VAT Registration Number',
    taxIdShortLabel: 'VAT No',
    taxIdPlaceholder: '15-digit ZATCA VAT ID (e.g. 300123456700003)',
    taxIdMinLength: 15,
    taxIdMaxLength: 15,
    taxIdRegex: /^\d{15}$/,
    taxIdHelper: '15-digit Tax ID starting and ending with 3 (ZATCA)',
    regionTypeName: 'Region',
    regionLabel: 'KSA Region of Supply',
    regions: ['Riyadh', 'Makkah', 'Eastern Province', 'Madinah', 'Asir', 'Tabuk', 'Qassim', 'Other KSA Regions'],
    defaultRegion: 'Riyadh',
    taxReturnFormName: 'Simplified VAT Return',
    taxInvoiceTitle: 'Tax Invoice (ZATCA Compliant)',
    vendorRegisteredLabel: 'KSA Registered Vendor (ZATCA)',
    taxDescription: 'Saudi Arabia VAT Standard 15.0%',
    box1Label: 'Section 1: Standard Rated Sales (15%)',
    box4Label: 'Section 4: Standard Rated Purchases (15%)',
    box9Label: 'Section 9: Net Tax Due / Refundable Summary',
    desc: '15% ZATCA VAT • Fatoora QR'
  },
  Oman: {
    code: 'Oman',
    name: 'Oman',
    nativeName: 'Sultanate of Oman',
    flag: '🇴🇲',
    continent: 'GCC',
    currency: 'OMR',
    currencyName: 'Omani Rial',
    symbol: 'OMR',
    decimals: 3,
    taxName: 'VAT',
    taxRate: 5,
    vatEnabled: true,
    taxAuthority: 'Oman Tax Authority (OTA)',
    taxAuthorityShort: 'OTA',
    taxIdLabel: 'Company VAT Identification Number (VATIN)',
    taxIdShortLabel: 'VATIN',
    taxIdPlaceholder: '8 to 12-digit Omani VATIN code',
    taxIdMinLength: 8,
    taxIdMaxLength: 12,
    taxIdRegex: /^\d{8,12}$/,
    taxIdHelper: '8 to 12-digit VATIN issued by Oman Tax Authority',
    regionTypeName: 'Governorate',
    regionLabel: 'Oman Governorate of Supply',
    regions: ['Muscat', 'Dhofar', 'Al Batinah', 'Musandam', 'Al Wusta', 'Al Sharqiyah', 'Other Governorates'],
    defaultRegion: 'Muscat',
    taxReturnFormName: 'VAT Return Form 401',
    taxInvoiceTitle: 'Tax Invoice (OTA Compliant)',
    vendorRegisteredLabel: 'Oman Registered Vendor (OTA)',
    taxDescription: 'Omani VAT Standard 5.0%',
    box1Label: 'Box 1: Standard Rated Supplies (5%)',
    box4Label: 'Box 4: Tax Recoverable on Expenses (5%)',
    box9Label: 'Box 9: Net Tax Payable / Refundable',
    desc: '5% VAT • 3 Decimals • Form 401'
  },
  Bahrain: {
    code: 'Bahrain',
    name: 'Bahrain',
    nativeName: 'Kingdom of Bahrain',
    flag: '🇧🇭',
    continent: 'GCC',
    currency: 'BHD',
    currencyName: 'Bahraini Dinar',
    symbol: 'BHD',
    decimals: 3,
    taxName: 'VAT',
    taxRate: 10,
    vatEnabled: true,
    taxAuthority: 'National Bureau for Revenue (NBR)',
    taxAuthorityShort: 'NBR',
    taxIdLabel: 'Company Tax Registration Number (TRN)',
    taxIdShortLabel: 'TRN',
    taxIdPlaceholder: '15-digit Bahraini TRN',
    taxIdMinLength: 15,
    taxIdMaxLength: 15,
    taxIdRegex: /^\d{15}$/,
    taxIdHelper: '15-digit TRN issued by Bahrain NBR',
    regionTypeName: 'Governorate',
    regionLabel: 'Bahrain Governorate',
    regions: ['Capital Governorate', 'Muharraq Governorate', 'Northern Governorate', 'Southern Governorate'],
    defaultRegion: 'Capital Governorate',
    taxReturnFormName: 'VAT Return Declaration',
    taxInvoiceTitle: 'Tax Invoice (NBR Compliant)',
    vendorRegisteredLabel: 'Bahrain Registered Vendor (NBR)',
    taxDescription: 'Bahraini VAT Standard 10.0%',
    box1Label: 'Section 1: Standard Rated Supplies (10%)',
    box4Label: 'Section 4: Tax Recoverable on Expenses (10%)',
    box9Label: 'Section 9: Net Tax Due / Refundable',
    desc: '10% VAT • 3 Decimals • NBR'
  },
  Qatar: {
    code: 'Qatar',
    name: 'Qatar',
    nativeName: 'State of Qatar',
    flag: '🇶🇦',
    continent: 'GCC',
    currency: 'QAR',
    currencyName: 'Qatari Riyal',
    symbol: 'QAR',
    decimals: 2,
    taxName: 'Tax',
    taxRate: 0,
    vatEnabled: false,
    taxAuthority: 'General Tax Authority (GTA)',
    taxAuthorityShort: 'GTA',
    taxIdLabel: 'Tax Identification Number (TIN)',
    taxIdShortLabel: 'TIN',
    taxIdPlaceholder: '10 to 15-digit Tax Card / TIN',
    taxIdMinLength: 10,
    taxIdMaxLength: 15,
    taxIdRegex: /^\d{10,15}$/,
    taxIdHelper: '10 to 15-digit Tax Identification Number',
    regionTypeName: 'Municipality',
    regionLabel: 'Qatar Municipality',
    regions: ['Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Other Municipalities'],
    defaultRegion: 'Doha',
    taxReturnFormName: 'Tax Declaration Form',
    taxInvoiceTitle: 'Commercial Invoice',
    vendorRegisteredLabel: 'Qatar Registered Vendor (GTA)',
    taxDescription: 'Qatari Standard 0.0%',
    box1Label: 'Standard Supplies (Sales)',
    box4Label: 'Standard Expenses & Purchases',
    box9Label: 'Tax Summary',
    desc: 'Tax Free Presets • Dhiraas GTA'
  },
  Kuwait: {
    code: 'Kuwait',
    name: 'Kuwait',
    nativeName: 'State of Kuwait',
    flag: '🇰🇼',
    continent: 'GCC',
    currency: 'KWD',
    currencyName: 'Kuwaiti Dinar',
    symbol: 'KWD',
    decimals: 3,
    taxName: 'Tax',
    taxRate: 0,
    vatEnabled: false,
    taxAuthority: 'Ministry of Finance',
    taxAuthorityShort: 'MOF',
    taxIdLabel: 'Commercial License / Tax ID',
    taxIdShortLabel: 'Lic. No',
    taxIdPlaceholder: 'Commercial License or Tax Number',
    taxIdMinLength: 6,
    taxIdMaxLength: 15,
    taxIdRegex: /^[0-9A-Za-z-]{6,15}$/,
    taxIdHelper: 'Commercial Registration or License ID',
    regionTypeName: 'Governorate',
    regionLabel: 'Kuwaiti Governorate',
    regions: ['Capital (Al Asimah)', 'Hawalli', 'Farwaniya', 'Jahra', 'Ahmadi', 'Mubarak Al-Kabeer'],
    defaultRegion: 'Capital (Al Asimah)',
    taxReturnFormName: 'Annual Tax Statement',
    taxInvoiceTitle: 'Commercial Invoice',
    vendorRegisteredLabel: 'Kuwait Registered Vendor (MOF)',
    taxDescription: 'Kuwaiti Standard 0.0%',
    box1Label: 'Standard Commercial Sales',
    box4Label: 'Commercial Operating Purchases',
    box9Label: 'Tax Position Statement',
    desc: 'Tax Free • 3 Decimals • KWD'
  },
  Pakistan: {
    code: 'Pakistan',
    name: 'Pakistan',
    nativeName: 'Islamic Republic of Pakistan',
    flag: '🇵🇰',
    continent: 'Asia',
    currency: 'PKR',
    currencyName: 'Pakistani Rupee',
    symbol: 'PKR',
    decimals: 2,
    taxName: 'Sales Tax / GST',
    taxRate: 18,
    vatEnabled: true,
    taxAuthority: 'Federal Board of Revenue (FBR)',
    taxAuthorityShort: 'FBR',
    taxIdLabel: 'National Tax Number / STRN (NTN)',
    taxIdShortLabel: 'NTN/STRN',
    taxIdPlaceholder: '7-digit NTN (e.g. 1234567-8) or 13-digit STRN',
    taxIdMinLength: 7,
    taxIdMaxLength: 15,
    taxIdRegex: /^[0-9A-Za-z-]{7,15}$/,
    taxIdHelper: '7-digit NTN or 13-digit STRN registered with FBR',
    regionTypeName: 'Province',
    regionLabel: 'Pakistan Province of Supply',
    regions: ['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Islamabad (ICT)', 'Gilgit-Baltistan', 'Azad Jammu & Kashmir'],
    defaultRegion: 'Punjab',
    taxReturnFormName: 'FBR Sales Tax Return (Annex-C)',
    taxInvoiceTitle: 'Sales Tax Invoice (FBR Annex-C Compliant)',
    vendorRegisteredLabel: 'FBR Active Taxpayer (ATL Pakistan)',
    taxDescription: 'Pakistan Federal Sales Tax 18.0% (FBR / PRA / SRB)',
    box1Label: 'Annexure-C: Standard Rated Domestic Supplies (18%)',
    box4Label: 'Annexure-A: Standard Rated Purchases & Input Tax (18%)',
    box9Label: 'Section 9: Net Sales Tax Payable / Refund Claim',
    desc: '18% FBR GST • NTN / STRN • Annex-C'
  },
  India: {
    code: 'India',
    name: 'India',
    nativeName: 'Republic of India',
    flag: '🇮🇳',
    continent: 'Asia',
    currency: 'INR',
    currencyName: 'Indian Rupee',
    symbol: '₹',
    decimals: 2,
    taxName: 'GST',
    taxRate: 18,
    vatEnabled: true,
    taxAuthority: 'Central Board of Indirect Taxes & Customs (CBIC) / GSTN',
    taxAuthorityShort: 'GSTN',
    taxIdLabel: 'GSTIN (GST Identification Number)',
    taxIdShortLabel: 'GSTIN',
    taxIdPlaceholder: '15-character GSTIN (e.g. 27AAAAA0000A1Z5)',
    taxIdMinLength: 10,
    taxIdMaxLength: 15,
    taxIdRegex: /^[0-9A-Za-z]{10,15}$/,
    taxIdHelper: '15-character GSTIN (State Code + PAN + Entity + Z + Check)',
    regionTypeName: 'State / UT',
    regionLabel: 'India State of Supply (Place of Supply)',
    regions: [
      'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat', 
      'Uttar Pradesh', 'West Bengal', 'Telangana', 'Rajasthan', 'Kerala', 
      'Punjab', 'Haryana', 'Madhya Pradesh', 'Bihar', 'Andhra Pradesh', 
      'Odisha', 'Assam', 'Other States/UTs'
    ],
    defaultRegion: 'Maharashtra',
    taxReturnFormName: 'GSTR-1 & GSTR-3B Tax Return Summary',
    taxInvoiceTitle: 'Tax Invoice (GST Compliant)',
    vendorRegisteredLabel: 'GSTIN Registered Taxpayer (GSTN)',
    taxDescription: 'India GST Standard 18.0% (CGST 9% + SGST 9% / IGST 18%)',
    box1Label: 'Table 4: Taxable Outward Supplies (CGST + SGST / IGST)',
    box4Label: 'Table 5: Eligible Input Tax Credit (ITC on Purchases)',
    box9Label: 'Table 6: Net GST Tax Payable & Cash Ledger Adjustment',
    desc: '18% GST (CGST+SGST/IGST) • GSTIN'
  },
  Bangladesh: {
    code: 'Bangladesh',
    name: 'Bangladesh',
    nativeName: 'People\'s Republic of Bangladesh',
    flag: '🇧🇩',
    continent: 'Asia',
    currency: 'BDT',
    currencyName: 'Bangladeshi Taka',
    symbol: 'BDT',
    decimals: 2,
    taxName: 'VAT',
    taxRate: 15,
    vatEnabled: true,
    taxAuthority: 'National Board of Revenue (NBR)',
    taxAuthorityShort: 'NBR',
    taxIdLabel: 'Business Identification Number (BIN)',
    taxIdShortLabel: 'BIN',
    taxIdPlaceholder: '9 or 13-digit BIN (e.g. 000123456-0101)',
    taxIdMinLength: 9,
    taxIdMaxLength: 15,
    taxIdRegex: /^[0-9A-Za-z-]{9,15}$/,
    taxIdHelper: '9 or 13-digit BIN issued by NBR Bangladesh',
    regionTypeName: 'Division',
    regionLabel: 'Bangladesh Division of Supply',
    regions: ['Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Sylhet', 'Barisal', 'Rangpur', 'Mymensingh'],
    defaultRegion: 'Dhaka',
    taxReturnFormName: 'NBR Mushak 9.1 VAT Return',
    taxInvoiceTitle: 'Tax Invoice (Mushak 6.3)',
    vendorRegisteredLabel: 'NBR Registered BIN Business',
    taxDescription: 'Bangladesh VAT Standard 15.0%',
    box1Label: 'Sub-Form 1: Standard Supplies Subject to 15% VAT',
    box4Label: 'Sub-Form 2: Local Purchases Eligible for Input Tax Rebate',
    box9Label: 'Sub-Form 5: Net VAT Payable to Government Treasury',
    desc: '15% NBR VAT • BIN • Mushak 6.3'
  },
  Nepal: {
    code: 'Nepal',
    name: 'Nepal',
    nativeName: 'Federal Democratic Republic of Nepal',
    flag: '🇳🇵',
    continent: 'Asia',
    currency: 'NPR',
    currencyName: 'Nepalese Rupee',
    symbol: 'NPR',
    decimals: 2,
    taxName: 'VAT',
    taxRate: 13,
    vatEnabled: true,
    taxAuthority: 'Inland Revenue Department (IRD)',
    taxAuthorityShort: 'IRD',
    taxIdLabel: 'Permanent Account Number (PAN)',
    taxIdShortLabel: 'PAN',
    taxIdPlaceholder: '9-digit IRD PAN (e.g. 100234567)',
    taxIdMinLength: 9,
    taxIdMaxLength: 10,
    taxIdRegex: /^\d{9,10}$/,
    taxIdHelper: '9-digit Permanent Account Number (PAN) issued by IRD',
    regionTypeName: 'Province',
    regionLabel: 'Nepal Province of Supply',
    regions: ['Bagmati (Kathmandu)', 'Koshi', 'Madhesh', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'],
    defaultRegion: 'Bagmati (Kathmandu)',
    taxReturnFormName: 'IRD VAT Return (Annex 5 & 13)',
    taxInvoiceTitle: 'Tax Invoice (IRD Approved)',
    vendorRegisteredLabel: 'IRD Registered PAN Vendor',
    taxDescription: 'Nepal VAT Standard 13.0%',
    box1Label: 'Section 1: Taxable Sales & Standard Output VAT (13%)',
    box4Label: 'Section 2: Taxable Purchases & Input VAT Credit (13%)',
    box9Label: 'Section 3: Net VAT Payable / (Credit Balance)',
    desc: '13% IRD VAT • 9-Digit PAN • कर बीजक'
  }
};

/**
 * Get country configuration by code with safe fallback to UAE
 */
export function getCountryConfig(code?: string): CountryConfig {
  if (code && code in COUNTRIES_CONFIG) {
    return COUNTRIES_CONFIG[code as SupportedCountry];
  }
  return COUNTRIES_CONFIG.UAE;
}

/**
 * Validate a tax ID according to country rules
 */
export function validateCountryTaxId(code: string | undefined, taxId: string): { isValid: boolean; message?: string } {
  const config = getCountryConfig(code);
  const cleanId = taxId.trim();
  
  if (!cleanId) {
    return { isValid: false, message: 'Tax ID is required.' };
  }

  if (cleanId.length < config.taxIdMinLength || cleanId.length > config.taxIdMaxLength) {
    return { 
      isValid: false, 
      message: `${config.taxIdShortLabel} must be ${config.taxIdMinLength === config.taxIdMaxLength ? config.taxIdMinLength : `${config.taxIdMinLength} to ${config.taxIdMaxLength}`} characters for ${config.name} (${config.taxAuthorityShort}).` 
    };
  }

  if (!config.taxIdRegex.test(cleanId)) {
    return { 
      isValid: false, 
      message: `Invalid format for ${config.taxIdShortLabel} in ${config.name}. ${config.taxIdHelper}.` 
    };
  }

  return { isValid: true };
}

/**
 * Format currency with country specific decimal rules
 */
export function formatCountryCurrency(
  val: number, 
  countryCode?: string, 
  currencyOverride?: string, 
  symbolOverride?: string,
  positionOverride?: 'before' | 'after'
): string {
  const config = getCountryConfig(countryCode);
  const currencyCode = currencyOverride || config.currency;
  const symbol = symbolOverride || config.symbol;
  const position = positionOverride || 'before';
  const decimals = ['BHD', 'OMR', 'KWD'].includes(currencyCode) ? 3 : 2;

  const formattedNum = val.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return position === 'before' ? `${symbol} ${formattedNum}` : `${formattedNum} ${symbol}`;
}

export const GCC_COUNTRIES: CountryConfig[] = [
  COUNTRIES_CONFIG.UAE,
  COUNTRIES_CONFIG.KSA,
  COUNTRIES_CONFIG.Oman,
  COUNTRIES_CONFIG.Bahrain,
  COUNTRIES_CONFIG.Qatar,
  COUNTRIES_CONFIG.Kuwait,
];

export const ASIA_COUNTRIES: CountryConfig[] = [
  COUNTRIES_CONFIG.Pakistan,
  COUNTRIES_CONFIG.India,
  COUNTRIES_CONFIG.Bangladesh,
  COUNTRIES_CONFIG.Nepal,
];

export const ALL_SUPPORTED_COUNTRIES: CountryConfig[] = [
  ...GCC_COUNTRIES,
  ...ASIA_COUNTRIES
];

export const COUNTRY_CITIES: Record<string, string[]> = {
  UAE: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Al Ain'],
  Pakistan: ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Peshawar', 'Quetta', 'Multan', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Sukkur', 'Bahawalpur', 'Sargodha', 'Abbottabad', 'Mardan', 'Gujrat', 'Mirpur'],
  KSA: ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Khobar', 'Tabuk', 'Jubail', 'Abha', 'Taif', 'Yanbu', 'Al Ahsa'],
  Oman: ['Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur', 'Seeb', 'Bawshar'],
  Qatar: ['Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Umm Salal'],
  Bahrain: ['Manama', 'Riffa', 'Muharraq', 'Hamad Town', 'A\'ali', 'Isa Town'],
  Kuwait: ['Kuwait City', 'Hawalli', 'Salmiya', 'Al Ahmadi', 'Al Farwaniyah', 'Jahra'],
  India: ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad', 'Pune', 'Surat', 'Jaipur', 'Lucknow', 'Chandigarh'],
  Bangladesh: ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Comilla'],
  Nepal: ['Kathmandu', 'Pokhara', 'Lalitpur', 'Bharatpur', 'Biratnagar', 'Birgunj'],
  UK: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow'],
  USA: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Dallas']
};

/**
 * Get the list of cities for a given country name or code
 */
export function getCountryCities(countryIdentifier?: string): string[] {
  if (!countryIdentifier) return COUNTRY_CITIES.UAE;
  const normalized = countryIdentifier.trim().toLowerCase();
  
  if (normalized.includes('pakistan') || normalized === 'pk') return COUNTRY_CITIES.Pakistan;
  if (normalized.includes('emirates') || normalized === 'uae' || normalized.includes('dubai') || normalized.includes('abu dhabi')) return COUNTRY_CITIES.UAE;
  if (normalized.includes('saudi') || normalized === 'ksa' || normalized.includes('arabia')) return COUNTRY_CITIES.KSA;
  if (normalized.includes('oman')) return COUNTRY_CITIES.Oman;
  if (normalized.includes('qatar')) return COUNTRY_CITIES.Qatar;
  if (normalized.includes('bahrain')) return COUNTRY_CITIES.Bahrain;
  if (normalized.includes('kuwait')) return COUNTRY_CITIES.Kuwait;
  if (normalized.includes('india')) return COUNTRY_CITIES.India;
  if (normalized.includes('bangladesh')) return COUNTRY_CITIES.Bangladesh;
  if (normalized.includes('nepal')) return COUNTRY_CITIES.Nepal;
  if (normalized.includes('kingdom') || normalized === 'uk' || normalized.includes('britain')) return COUNTRY_CITIES.UK;
  if (normalized.includes('united states') || normalized === 'usa' || normalized === 'us') return COUNTRY_CITIES.USA;

  // Fallback to UAE or config regions
  const config = getCountryConfig(countryIdentifier);
  if (config && config.regions && config.regions.length > 0) {
    return config.regions;
  }
  return COUNTRY_CITIES.UAE;
}
