export interface IndustryField {
  key: string;
  labelEn: string;
  labelAr: "",
  type?: 'text' | 'number' | 'select' | 'date' | 'checkbox';
  placeholder?: string;
  options?: Array<{ value: string; labelEn: string; labelAr: ""}>;
  defaultValue?: any;
  className?: string;
  step?: string;
}

export interface IndustryConfig {
  id: string;
  nameEn: string;
  nameAr: string;
  fields: IndustryField[];
  calculator?: {
    titleEn: string;
    titleAr: string;
    descriptionEn: string;
    descriptionAr: string;
    type: 'gold' | 'construction' | 'logistics' | 'transportation' | 'retail' | 'ecommerce' | 'tourism' | 'printing' | 'general' | 'other';
  };
}

export const INDUSTRIES_CONFIG: Record<string, IndustryConfig> = {
  'Retail Shop': {
    id: 'Retail Shop',
    nameEn: 'Retail Fashion, Shoes & Apparel Shop',
    nameAr: '',
    fields: [
      { key: 'retBarcode', labelEn: 'Item Barcode / SKU', labelAr: "" },
      { key: 'retBrand', labelEn: 'Brand / Label', labelAr: "" },
      {
        key: 'retCategory',
        labelEn: 'Product Category',
        labelAr: "",
        type: 'select',
        options: [
          { value: 'Men Footwear - Formal Shoes', labelEn: "Men's Formal Shoes", labelAr: "" },
          { value: 'Men Footwear - Arabic Sandals (Naal)', labelEn: 'Arabic Leather Sandals / Naal', labelAr: "" },
          { value: 'Men Footwear - Casual & Sneakers', labelEn: "Men's Casual & Sneakers", labelAr: "" },
          { value: 'Women Footwear - Heels & Sandals', labelEn: "Women's Heels & Sandals", labelAr: "" },
          { value: 'Women Footwear - Flats & Loafers', labelEn: "Women's Flats & Loafers", labelAr: "" },
          { value: 'Kids Footwear - Boys & Girls', labelEn: "Kids & Youth Footwear", labelAr: "" },
          { value: 'Men Clothing - Shirts & Trousers', labelEn: "Men's Shirts & Trousers", labelAr: "" },
          { value: 'Men Clothing - Arabic Kandora / Thobe', labelEn: 'Arabic Kandora / Dishdasha / Thobe', labelAr: "" },
          { value: 'Women Clothing - Abayas & Jalabiyas', labelEn: 'Abayas & Jalabiyas', labelAr: "" },
          { value: 'Women Clothing - Dresses & Tops', labelEn: "Women's Dresses & Tops", labelAr: "" },
          { value: 'Accessories - Belts, Wallets & Socks', labelEn: 'Leather Belts, Wallets & Socks', labelAr: "" }
        ],
        defaultValue: 'Men Footwear - Formal Shoes'
      },
      {
        key: 'retSize',
        labelEn: 'Size / Fit',
        labelAr: "",
        type: 'select',
        options: [
          { value: 'EU 38 / UK 5', labelEn: 'EU 38 (UK 5 / US 6)', labelAr: "" },
          { value: 'EU 39 / UK 6', labelEn: 'EU 39 (UK 6 / US 7)', labelAr: "" },
          { value: 'EU 40 / UK 6.5', labelEn: 'EU 40 (UK 6.5 / US 7.5)', labelAr: "" },
          { value: 'EU 41 / UK 7.5', labelEn: 'EU 41 (UK 7.5 / US 8.5)', labelAr: "" },
          { value: 'EU 42 / UK 8', labelEn: 'EU 42 (UK 8 / US 9)', labelAr: "" },
          { value: 'EU 43 / UK 9', labelEn: 'EU 43 (UK 9 / US 10)', labelAr: "" },
          { value: 'EU 44 / UK 9.5', labelEn: 'EU 44 (UK 9.5 / US 10.5)', labelAr: "" },
          { value: 'EU 45 / UK 10.5', labelEn: 'EU 45 (UK 10.5 / US 11.5)', labelAr: "" },
          { value: 'EU 46 / UK 11', labelEn: 'EU 46 (UK 11 / US 12)', labelAr: "" },
          { value: 'Size XS', labelEn: 'Clothing XS', labelAr: "" },
          { value: 'Size S', labelEn: 'Clothing S', labelAr: "" },
          { value: 'Size M', labelEn: 'Clothing M', labelAr: "" },
          { value: 'Size L', labelEn: 'Clothing L', labelAr: "" },
          { value: 'Size XL', labelEn: 'Clothing XL', labelAr: "" },
          { value: 'Size XXL', labelEn: 'Clothing 2XL', labelAr: "" },
          { value: 'Size 3XL', labelEn: 'Clothing 3XL', labelAr: "" },
          { value: 'Kandora Size 54', labelEn: 'Kandora Size 54', labelAr: "" },
          { value: 'Kandora Size 56', labelEn: 'Kandora Size 56', labelAr: "" },
          { value: 'Kandora Size 58', labelEn: 'Kandora Size 58', labelAr: "" },
          { value: 'Kandora Size 60', labelEn: 'Kandora Size 60', labelAr: "" },
          { value: 'Free Size', labelEn: 'Free Size', labelAr: "" }
        ],
        defaultValue: 'EU 42 / UK 8'
      },
      {
        key: 'retColor',
        labelEn: 'Color / Shade',
        labelAr: "",
        type: 'select',
        options: [
          { value: 'Black', labelEn: 'Black', labelAr: "" },
          { value: 'Brown', labelEn: 'Brown', labelAr: "" },
          { value: 'Tan / Camel', labelEn: 'Tan / Camel', labelAr: "" },
          { value: 'White', labelEn: 'White', labelAr: "" },
          { value: 'Navy Blue', labelEn: 'Navy Blue', labelAr: "" },
          { value: 'Beige / Cream', labelEn: 'Beige / Cream', labelAr: "" },
          { value: 'Grey / Charcoal', labelEn: 'Grey / Charcoal', labelAr: "" },
          { value: 'Burgundy / Maroon', labelEn: 'Burgundy / Maroon', labelAr: "" },
          { value: 'Olive Green', labelEn: 'Olive Green', labelAr: "" },
          { value: 'Multi-Color / Pattern', labelEn: 'Multi-Color / Pattern', labelAr: "" }
        ],
        defaultValue: 'Black'
      },
      { key: 'retMaterial', labelEn: 'Material / Upper Fabric', labelAr: "" },
      { key: 'retSeasonCollection', labelEn: 'Season / Collection', labelAr: "" },
      {
        key: 'retReturnPolicy',
        labelEn: 'Exchange / Return Validity',
        labelAr: "",
        type: 'select',
        options: [
          { value: '14-Days Exchange (Original Box & Tag)', labelEn: '14-Days Exchange (Original Box & Tag / UAE Law)', labelAr: "" },
          { value: '7-Days Exchange Only', labelEn: '7-Days Exchange Only (No Cash Refund)', labelAr: "" },
          { value: 'Final Clearance Sale (No Exchange)', labelEn: 'Final Clearance Sale (Non-Returnable)', labelAr: "" }
        ],
        defaultValue: '14-Days Exchange (Original Box & Tag)'
      },
      { key: 'retExchangeRef', labelEn: 'Original Invoice / Exchange Ref', labelAr: "" }
    ],
    calculator: {
      titleEn: 'Shoe & Apparel Retail Sizing Matrix & POS Compiler',
      titleAr: '',
      descriptionEn: 'Select shoes or clothing items with exact size, color, brand, and pair carton breakdowns to auto-compile retail sales invoices, exchange notes, and purchase orders.',
      descriptionAr: '',
      type: 'retail'
    }
  },
  Retail: {
    id: 'Retail',
    nameEn: 'Retail Fashion, Shoes & Apparel Shop',
    nameAr: '',
    fields: [
      { key: 'retBarcode', labelEn: 'Item Barcode / SKU', labelAr: "" },
      { key: 'retBrand', labelEn: 'Brand / Label', labelAr: "" },
      {
        key: 'retCategory',
        labelEn: 'Product Category',
        labelAr: "",
        type: 'select',
        options: [
          { value: 'Men Footwear - Formal Shoes', labelEn: "Men's Formal Shoes", labelAr: "" },
          { value: 'Men Footwear - Arabic Sandals (Naal)', labelEn: 'Arabic Leather Sandals / Naal', labelAr: "" },
          { value: 'Men Footwear - Casual & Sneakers', labelEn: "Men's Casual & Sneakers", labelAr: "" },
          { value: 'Women Footwear - Heels & Sandals', labelEn: "Women's Heels & Sandals", labelAr: "" },
          { value: 'Women Footwear - Flats & Loafers', labelEn: "Women's Flats & Loafers", labelAr: "" },
          { value: 'Kids Footwear - Boys & Girls', labelEn: "Kids & Youth Footwear", labelAr: "" },
          { value: 'Men Clothing - Shirts & Trousers', labelEn: "Men's Shirts & Trousers", labelAr: "" },
          { value: 'Men Clothing - Arabic Kandora / Thobe', labelEn: 'Arabic Kandora / Dishdasha / Thobe', labelAr: "" },
          { value: 'Women Clothing - Abayas & Jalabiyas', labelEn: 'Abayas & Jalabiyas', labelAr: "" },
          { value: 'Women Clothing - Dresses & Tops', labelEn: "Women's Dresses & Tops", labelAr: "" },
          { value: 'Accessories - Belts, Wallets & Socks', labelEn: 'Leather Belts, Wallets & Socks', labelAr: "" }
        ],
        defaultValue: 'Men Footwear - Formal Shoes'
      },
      {
        key: 'retSize',
        labelEn: 'Size / Fit',
        labelAr: "",
        type: 'select',
        options: [
          { value: 'EU 38 / UK 5', labelEn: 'EU 38 (UK 5 / US 6)', labelAr: "" },
          { value: 'EU 39 / UK 6', labelEn: 'EU 39 (UK 6 / US 7)', labelAr: "" },
          { value: 'EU 40 / UK 6.5', labelEn: 'EU 40 (UK 6.5 / US 7.5)', labelAr: "" },
          { value: 'EU 41 / UK 7.5', labelEn: 'EU 41 (UK 7.5 / US 8.5)', labelAr: "" },
          { value: 'EU 42 / UK 8', labelEn: 'EU 42 (UK 8 / US 9)', labelAr: "" },
          { value: 'EU 43 / UK 9', labelEn: 'EU 43 (UK 9 / US 10)', labelAr: "" },
          { value: 'EU 44 / UK 9.5', labelEn: 'EU 44 (UK 9.5 / US 10.5)', labelAr: "" },
          { value: 'EU 45 / UK 10.5', labelEn: 'EU 45 (UK 10.5 / US 11.5)', labelAr: "" },
          { value: 'EU 46 / UK 11', labelEn: 'EU 46 (UK 11 / US 12)', labelAr: "" },
          { value: 'Size XS', labelEn: 'Clothing XS', labelAr: "" },
          { value: 'Size S', labelEn: 'Clothing S', labelAr: "" },
          { value: 'Size M', labelEn: 'Clothing M', labelAr: "" },
          { value: 'Size L', labelEn: 'Clothing L', labelAr: "" },
          { value: 'Size XL', labelEn: 'Clothing XL', labelAr: "" },
          { value: 'Size XXL', labelEn: 'Clothing 2XL', labelAr: "" },
          { value: 'Size 3XL', labelEn: 'Clothing 3XL', labelAr: "" },
          { value: 'Kandora Size 54', labelEn: 'Kandora Size 54', labelAr: "" },
          { value: 'Kandora Size 56', labelEn: 'Kandora Size 56', labelAr: "" },
          { value: 'Kandora Size 58', labelEn: 'Kandora Size 58', labelAr: "" },
          { value: 'Kandora Size 60', labelEn: 'Kandora Size 60', labelAr: "" },
          { value: 'Free Size', labelEn: 'Free Size', labelAr: "" }
        ],
        defaultValue: 'EU 42 / UK 8'
      },
      {
        key: 'retColor',
        labelEn: 'Color / Shade',
        labelAr: "",
        type: 'select',
        options: [
          { value: 'Black', labelEn: 'Black', labelAr: "" },
          { value: 'Brown', labelEn: 'Brown', labelAr: "" },
          { value: 'Tan / Camel', labelEn: 'Tan / Camel', labelAr: "" },
          { value: 'White', labelEn: 'White', labelAr: "" },
          { value: 'Navy Blue', labelEn: 'Navy Blue', labelAr: "" },
          { value: 'Beige / Cream', labelEn: 'Beige / Cream', labelAr: "" },
          { value: 'Grey / Charcoal', labelEn: 'Grey / Charcoal', labelAr: "" },
          { value: 'Burgundy / Maroon', labelEn: 'Burgundy / Maroon', labelAr: "" },
          { value: 'Olive Green', labelEn: 'Olive Green', labelAr: "" },
          { value: 'Multi-Color / Pattern', labelEn: 'Multi-Color / Pattern', labelAr: "" }
        ],
        defaultValue: 'Black'
      },
      { key: 'retMaterial', labelEn: 'Material / Upper Fabric', labelAr: "" },
      { key: 'retSeasonCollection', labelEn: 'Season / Collection', labelAr: "" },
      {
        key: 'retReturnPolicy',
        labelEn: 'Exchange / Return Validity',
        labelAr: "",
        type: 'select',
        options: [
          { value: '14-Days Exchange (Original Box & Tag)', labelEn: '14-Days Exchange (Original Box & Tag / UAE Law)', labelAr: "" },
          { value: '7-Days Exchange Only', labelEn: '7-Days Exchange Only (No Cash Refund)', labelAr: "" },
          { value: 'Final Clearance Sale (No Exchange)', labelEn: 'Final Clearance Sale (Non-Returnable)', labelAr: "" }
        ],
        defaultValue: '14-Days Exchange (Original Box & Tag)'
      },
      { key: 'retExchangeRef', labelEn: 'Original Invoice / Exchange Ref', labelAr: "" }
    ],
    calculator: {
      titleEn: 'Shoe & Apparel Retail Sizing Matrix & POS Compiler',
      titleAr: '',
      descriptionEn: 'Select shoes or clothing items with exact size, color, brand, and pair carton breakdowns to auto-compile retail sales invoices, exchange notes, and purchase orders.',
      descriptionAr: '',
      type: 'retail'
    }
  },
  Transportation: {
    id: 'Transportation',
    nameEn: 'Transportation & Fleet Logistics',
    nameAr: '',
    fields: [
      { key: 'transTripNo', labelEn: 'Trip / Waybill No', labelAr: "" },
      { key: 'transVehicleNo', labelEn: 'Vehicle Plate / Fleet No', labelAr: "" },
      {
        key: 'transVehicleType',
        labelEn: 'Vehicle Category / Type',
        labelAr: "",
        type: 'select',
        options: [
          { value: 'Heavy Flatbed Trailer (40ft)', labelEn: 'Heavy Flatbed Trailer (40ft)', labelAr: "" },
          { value: 'Curtain Side Trailer (Box)', labelEn: 'Curtain Sider / Box Trailer', labelAr: "" },
          { value: 'Low Bed Heavy Equipment Trailer', labelEn: 'Low Bed Trailer (Heavy Equipment)', labelAr: "" },
          { value: 'Refrigerated Reefer Chiller', labelEn: 'Refrigerated Reefer (Chiller / Freezer)', labelAr: "" },
          { value: '7-Ton Medium Cargo Truck', labelEn: '7-Ton Medium Cargo Truck', labelAr: "" },
          { value: '3-Ton Pickup Truck', labelEn: '3-Ton Pickup Truck', labelAr: "" },
          { value: 'Tipper / Dumper Truck', labelEn: 'Tipper / Dumper Sand & Aggregate', labelAr: "" },
          { value: 'ISO Tanker (Liquid / Fuel)', labelEn: 'ISO Tanker (Liquid / Chemical / Fuel)', labelAr: "" }
        ],
        defaultValue: 'Heavy Flatbed Trailer (40ft)'
      },
      { key: 'transDriverName', labelEn: 'Assigned Driver Name', labelAr: "" },
      { key: 'transDriverMobile', labelEn: 'Driver Contact / Mobile', labelAr: "" },
      { key: 'transPickupLoc', labelEn: 'Origin / Loading Location', labelAr: "" },
      { key: 'transDropLoc', labelEn: 'Destination / Delivery Site', labelAr: "" },
      { key: 'transLoadingDate', labelEn: 'Loading / Dispatch Date', labelAr: "" },
      { key: 'transOffloadingDate', labelEn: 'Expected / POD Offload Date', labelAr: "" },
      { key: 'transConsignmentPOD', labelEn: 'Consignment / POD Ref', labelAr: "" },
      { key: 'transCargoType', labelEn: 'Cargo Nature / Goods', labelAr: "" },
      { key: 'transWeightTons', labelEn: 'Cargo Weight (Tons/KG)', labelAr: "" },
      { key: 'transDistanceKm', labelEn: 'Trip Distance (KM)', labelAr: "" },
      { key: 'transDetentionHours', labelEn: 'Waiting / Detention (Hours)', labelAr: "" },
      { key: 'transTollsSalik', labelEn: 'Tolls & Salik Gates (AED)', labelAr: "" }
    ],
    calculator: {
      titleEn: 'Transportation Trip Fare & Surcharge Dispatcher',
      titleAr: '',
      descriptionEn: 'Calculate point-to-point freight haulage, demurrage/detention waiting time, Salik/Darb road tolls, and fuel adjustment charges with instant invoice compilation.',
      descriptionAr: '',
      type: 'transportation'
    }
  },
  Construction: {
    id: 'Construction',
    nameEn: 'Contracting & Construction',
    nameAr: '',
    fields: [
      { key: 'conProjectName', labelEn: 'Project Name', labelAr: "" },
      { key: 'conPlotNo', labelEn: 'Plot Number', labelAr: "" },
      { key: 'conMunicipalityNo', labelEn: 'Approval No', labelAr: "" },
      { key: 'conSubcontractor', labelEn: 'Subcontractor Allocation', labelAr: "" },
      {
        key: 'conRetentionPct',
        labelEn: 'Retention %',
        labelAr: "",
        type: 'select',
        options: [
          { value: '0', labelEn: 'No Retention (0%)', labelAr: "" },
          { value: '5', labelEn: 'Standard 5% Retention', labelAr: "" },
          { value: '10', labelEn: 'High-Risk 10% Retention', labelAr: "" }
        ],
        defaultValue: '0'
      },
      { key: 'conRetentionAmt', labelEn: 'Retention Amount', labelAr: "" }
    ],
    calculator: {
      titleEn: 'Construction Retention Helper',
      titleAr: '',
      descriptionEn: 'In GCC Construction contracts, clients often withhold 5% or 10% of invoices until project handover. Use this to record certified retention amounts.',
      descriptionAr: '',
      type: 'construction'
    }
  },
  GoldJewelry: {
    id: 'GoldJewelry',
    nameEn: 'Gold & Jewellery',
    nameAr: '',
    fields: [
      {
        key: 'goldCarat',
        labelEn: 'Gold Purity',
        labelAr: "",
        type: 'select',
        options: [
          { value: '24K', labelEn: '24K Fine Gold (99.9%)', labelAr: "" },
          { value: '22K', labelEn: '22K Standard (91.6%)', labelAr: "" },
          { value: '21K', labelEn: '21K Traditional GCC (87.5%)', labelAr: "" },
          { value: '18K', labelEn: '18K Jeweller Standard (75.0%)', labelAr: "" }
        ],
        defaultValue: '21K'
      },
      { key: 'goldWeight', labelEn: 'Metal Weight (Grams)', labelAr: "" },
      { key: 'goldDailyRate', labelEn: 'Daily Market Rate (AED/g)', labelAr: "" },
      { key: 'goldMakingCharge', labelEn: 'Making Charges (AED)', labelAr: "" }
    ],
    calculator: {
      titleEn: 'Live Dubai Gold Price Integrator',
      titleAr: '',
      descriptionEn: 'Formula: (Weight × Daily Rate) + Making Charges. Click apply to automatically compile this custom jewellery line-item on your invoice.',
      descriptionAr: '',
      type: 'gold'
    }
  },
  Logistics: {
    id: 'Logistics',
    nameEn: 'Customs Clearance & Logistics',
    nameAr: '',
    fields: [
      { key: 'logBLNumber', labelEn: 'Bill of Lading (B/L) / Waybill No', labelAr: "" },
      { key: 'logContainerNo', labelEn: 'Container Details', labelAr: "" },
      { key: 'logCustomsDecNo', labelEn: 'Customs Declaration No', labelAr: "" },
      {
        key: 'logPortOfEntry',
        labelEn: 'Port of Discharge / Entry',
        labelAr: "",
        type: 'select',
        options: [
          { value: 'Jebel Ali Port, Dubai (DP World)', labelEn: 'Jebel Ali Port, Dubai (DP World)', labelAr: "" },
          { value: 'Khalifa Port, Abu Dhabi', labelEn: 'Khalifa Port, Abu Dhabi', labelAr: "" },
          { value: 'Sharjah Port Khalid', labelEn: 'Port Khalid, Sharjah', labelAr: "" },
          { value: 'Dubai Airport Cargo Village', labelEn: 'Dubai Airport Cargo Village', labelAr: "" },
          { value: 'Port Rashid, Dubai', labelEn: 'Port Rashid, Dubai', labelAr: "" }
        ],
        defaultValue: ''
      }
    ],
    calculator: {
      titleEn: 'GCC Ports Cargo Dispatcher',
      titleAr: '',
      descriptionEn: 'Manage, check, and track import-export parameters directly within the active customs declaration flow.',
      descriptionAr: '',
      type: 'logistics'
    }
  },
  ECommerce: {
    id: 'ECommerce',
    nameEn: 'E-Commerce & Digital Hub',
    nameAr: '',
    fields: [
      { key: 'ecoOrderID', labelEn: 'Platform Order ID', labelAr: "" },
      {
        key: 'ecoCourier',
        labelEn: 'Courier Partner',
        labelAr: "",
        type: 'select',
        options: [
          { value: 'DHL Express', labelEn: 'DHL Express (Global)', labelAr: "" },
          { value: 'Aramex', labelEn: 'Aramex (GCC/MENA)', labelAr: "" },
          { value: 'FedEx', labelEn: 'FedEx International', labelAr: "" },
          { value: 'Fetchr', labelEn: 'Fetchr (Last Mile)', labelAr: "" },
          { value: 'PostNL', labelEn: 'PostNL (Europe)', labelAr: "" },
          { value: 'Royal Mail', labelEn: 'Royal Mail (UK)', labelAr: "" }
        ],
        defaultValue: ''
      },
      { key: 'ecoWaybill', labelEn: 'Tracking / Waybill No', labelAr: "" },
      {
        key: 'ecoPaymentGateway',
        labelEn: 'Payment Gateway',
        labelAr: "",
        type: 'select',
        options: [
          { value: 'Stripe', labelEn: 'Stripe Gateway (EU/Global)', labelAr: "" },
          { value: 'Checkout.com', labelEn: 'Checkout.com (GCC Headquartered)', labelAr: "" },
          { value: 'Apple Pay / Wallet', labelEn: 'Apple Pay / Wallet', labelAr: "" },
          { value: 'PayPal', labelEn: 'PayPal Holdings', labelAr: "" },
          { value: 'Tabby / Tamara (BNPL)', labelEn: 'Tabby / Tamara (GCC BNPL)', labelAr: "" },
          { value: 'Adyen', labelEn: 'Adyen N.V. (EU)', labelAr: "" }
        ],
        defaultValue: ''
      },
      {
        key: 'ecoDestTax',
        labelEn: 'Destination Tax Territory',
        labelAr: "",
        type: 'select',
        options: [
          { value: 'None', labelEn: 'No Cross-Border Tax', labelAr: "" },
          { value: 'EU_DE', labelEn: 'Germany (EU OSS - 19% VAT)', labelAr: "" },
          { value: 'EU_FR', labelEn: 'France (EU OSS - 20% VAT)', labelAr: "" },
          { value: 'GCC_KSA', labelEn: 'Saudi Arabia (GCC - 15% VAT + 5% Duty)', labelAr: "" },
          { value: 'GCC_UAE', labelEn: 'United Arab Emirates (5% VAT)', labelAr: "" }
        ],
        defaultValue: 'None'
      }
    ],
    calculator: {
      titleEn: 'Cross-Border Shipping & EU/GCC Tax Integrator',
      titleAr: '',
      descriptionEn: 'Supports cross-border EU OSS (One Stop Shop) VAT or GCC Customs duty compliance rules automatically. Choose destination to calculate custom fee.',
      descriptionAr: '',
      type: 'ecommerce'
    }
  },
  TourismCarRental: {
    id: 'TourismCarRental',
    nameEn: 'Tourism, Travel & Car Rental',
    nameAr: '',
    fields: [
      { key: 'touBookingRef', labelEn: 'PNR Booking Reference', labelAr: "" },
      { key: 'touVehiclePlate', labelEn: 'Vehicle Plate / Room No', labelAr: "" },
      { key: 'touPassportID', labelEn: 'Passport / National ID', labelAr: "" },
      { key: 'touAgreementNo', labelEn: 'Agreement / Voucher No', labelAr: "" },
      {
        key: 'touChargeType',
        labelEn: 'Surcharge Type',
        labelAr: "",
        type: 'select',
        options: [
          { value: 'Salik', labelEn: 'Dubai Salik Toll (AED 4.00/gate)', labelAr: "" },
          { value: 'TourismDirham', labelEn: 'Dubai Tourism Dirham (AED 15.00/night)', labelAr: "" },
          { value: 'EUCityTax', labelEn: 'Europe Tourist City Tax (~AED 20.00/night)', labelAr: "" }
        ],
        defaultValue: 'Salik'
      },
      { key: 'touChargeQty', labelEn: 'Surcharge Qty', labelAr: "" }
    ],
    calculator: {
      titleEn: 'GCC Salik & Tourism Tax Surcharge Calculator',
      titleAr: '',
      descriptionEn: 'In the GCC & EU, tourist taxes and road toll charges are billed per unit. Easily calculate and inject these direct costs into the invoice.',
      descriptionAr: '',
      type: 'tourism'
    }
  },
  Grocery: {
    id: 'Grocery',
    nameEn: 'Grocery / Supermarket',
    nameAr: '',
    fields: [
      { key: 'simulatedWeight', labelEn: 'Measured Weight (KG)', labelAr: "" }
    ],
    calculator: {
      titleEn: 'Weighing Scale & Barcode Integration Hub',
      titleAr: '',
      descriptionEn: 'Weigh items dynamically and integrate them with barcode scanners for superfast GCC retail checkout.',
      descriptionAr: '',
      type: 'general'
    }
  },
  Mobile: {
    id: 'Mobile',
    nameEn: 'Mobile & Electronics',
    nameAr: '',
    fields: [
      { key: 'imeiNumber', labelEn: 'IMEI / Serial Tracker', labelAr: "" },
      {
        key: 'warrantyPlan',
        labelEn: 'Warranty Plan',
        labelAr: "",
        type: 'select',
        options: [
          { value: '', labelEn: 'No Warranty', labelAr: "" },
          { value: '6 Months Agency Warranty', labelEn: '6 Months Agency Warranty', labelAr: "" },
          { value: '12 Months Local Warranty', labelEn: '12 Months GCC Agency Warranty', labelAr: "" },
          { value: '24 Months ADCB Shield Premium', labelEn: '24 Months ADCB Extended Shield', labelAr: "" }
        ],
        defaultValue: ''
      },
      {
        key: 'installmentPlan',
        labelEn: 'Installment & EMI Options',
        labelAr: "",
        type: 'select',
        options: [
          { value: '', labelEn: 'Single Payment (No EMI)', labelAr: "" },
          { value: '3 Months via Tabby / Tamara', labelEn: '3 Months via Tabby/Tamara (0% Fee)', labelAr: "" },
          { value: '6 Months ADIB Card Installment', labelEn: '6 Months ADIB Credit Card EMI', labelAr: "" },
          { value: '12 Months ENBD Easy Payment', labelEn: '12 Months ENBD Easy Payment Plan', labelAr: "" }
        ],
        defaultValue: ''
      }
    ]
  },
  'General Trading': {
    id: 'General Trading',
    nameEn: 'General Trading & Retail',
    nameAr: '',
    fields: [
      {
        key: 'warehouseSource',
        labelEn: 'Warehouse Allocation',
        labelAr: "",
        type: 'select',
        options: [
          { value: '', labelEn: '-- Choose Warehouse --', labelAr: "" },
          { value: 'Jebel Ali Freezone WH 4 (JAFZA)', labelEn: 'Jebel Ali Freezone (JAFZA) WH 4', labelAr: "" },
          { value: 'Sharjah Industrial Area 3 Depot', labelEn: 'Sharjah Industrial Area 3 Depot', labelAr: "" },
          { value: 'Al Quoz Main Distribution Hub', labelEn: 'Al Quoz Main Distribution Hub', labelAr: "" }
        ],
        defaultValue: ''
      },
      { key: 'lpoNumber', labelEn: 'Purchase Order (PO/LPO) Number', labelAr: "" }
    ]
  },
  'General trading': {
    id: 'General trading',
    nameEn: 'General Trading & Retail',
    nameAr: '',
    fields: [
      {
        key: 'warehouseSource',
        labelEn: 'Warehouse Allocation',
        labelAr: "",
        type: 'select',
        options: [
          { value: '', labelEn: '-- Choose Warehouse --', labelAr: "" },
          { value: 'Jebel Ali Freezone WH 4 (JAFZA)', labelEn: 'Jebel Ali Freezone (JAFZA) WH 4', labelAr: "" },
          { value: 'Sharjah Industrial Area 3 Depot', labelEn: 'Sharjah Industrial Area 3 Depot', labelAr: "" },
          { value: 'Al Quoz Main Distribution Hub', labelEn: 'Al Quoz Main Distribution Hub', labelAr: "" }
        ],
        defaultValue: ''
      },
      { key: 'lpoNumber', labelEn: 'Purchase Order (PO/LPO) Number', labelAr: "" }
    ]
  },
  Restaurant: {
    id: 'Restaurant',
    nameEn: 'Restaurant & Cafe',
    nameAr: '',
    fields: [
      {
        key: 'restaurantTable',
        labelEn: 'Table Number / Dining Area',
        labelAr: "",
        type: 'select',
        options: [
          { value: 'Takeaway', labelEn: 'Takeaway', labelAr: "" },
          { value: 'Table 1', labelEn: 'Table 1', labelAr: "" },
          { value: 'Table 2', labelEn: 'Table 2', labelAr: "" },
          { value: 'Table 3', labelEn: 'Table 3', labelAr: "" },
          { value: 'VIP Cabin', labelEn: 'VIP Cabin', labelAr: "" },
          { value: 'Terrace Area', labelEn: 'Terrace Area', labelAr: "" },
          { value: 'Talabat Dispatch', labelEn: 'Talabat / Deliveroo Dispatch', labelAr: "" }
        ],
        defaultValue: 'Takeaway'
      },
      { key: 'restaurantKOT', labelEn: 'Immediate KOT Order', labelAr: "" }
    ]
  },
  Laundry: {
    id: 'Laundry',
    nameEn: 'Laundry & Dry Cleaning',
    nameAr: '',
    fields: [
      { key: 'laundryJobNo', labelEn: 'Job Card No', labelAr: "" },
      { key: 'laundryPickupDate', labelEn: 'Pickup Date', labelAr: "" },
      { key: 'laundryDeliveryDate', labelEn: 'Estimated Delivery', labelAr: "" },
      {
        key: 'laundryStatus',
        labelEn: 'Status Step',
        labelAr: "",
        type: 'select',
        options: [
          { value: 'Received', labelEn: 'Received', labelAr: "" },
          { value: 'Washing', labelEn: 'Washing / Dry Cleaning', labelAr: "" },
          { value: 'Ironing', labelEn: 'Ironing & Folding', labelAr: "" },
          { value: 'Ready', labelEn: 'Ready for Pickup', labelAr: "" },
          { value: 'Delivered', labelEn: 'Delivered', labelAr: "" }
        ],
        defaultValue: 'Received'
      }
    ]
  },
  Printing: {
    id: 'Printing',
    nameEn: 'Printing & Advertising',
    nameAr: '',
    fields: [
      { key: 'printJobNo', labelEn: 'Job Order No', labelAr: "" },
      {
        key: 'printDesignStatus',
        labelEn: 'Design Proof Status',
        labelAr: "",
        type: 'select',
        options: [
          { value: 'Pending Design Draft', labelEn: 'Pending Design Draft', labelAr: "" },
          { value: 'Proof Sent to Customer', labelEn: 'Proof Sent to Customer', labelAr: "" },
          { value: 'Customer Approved - READY', labelEn: 'Customer Approved (READY FOR PRESS)', labelAr: "" },
          { value: 'Rejected - Needs Revision', labelEn: 'Rejected (Needs Revision)', labelAr: "" }
        ],
        defaultValue: 'Pending Design Draft'
      },
      { key: 'printAdvancePaid', labelEn: 'Advance Deposit Paid', labelAr: "" }
    ],
    calculator: {
      titleEn: 'Custom Dimensions Calculator',
      titleAr: '',
      descriptionEn: 'Calculate printing area dynamically and manage balance due before print operations.',
      descriptionAr: '',
      type: 'printing'
    }
  },
  Service: {
    id: 'Service',
    nameEn: 'Professional Services',
    nameAr: '',
    fields: [
      { key: 'serviceTicketId', labelEn: 'Support Ticket ID', labelAr: "" },
      { key: 'serviceStaffAssign', labelEn: 'Assigned Specialist', labelAr: "" },
      { key: 'serviceVisitDate', labelEn: 'Scheduled Visit / Delivery', labelAr: "" }
    ]
  },
  Accounting: {
    id: 'Accounting',
    nameEn: 'Accounting & Bookkeeping',
    nameAr: '',
    fields: [
      { key: 'accTaxPeriod', labelEn: 'Audit / Tax Return Period', labelAr: "" }
    ]
  },
  'Real Estate': {
    id: 'Real Estate',
    nameEn: 'Real Estate / Property Management',
    nameAr: '',
    fields: [
      { key: 'realPropertyID', labelEn: 'Property ID / Unit Code', labelAr: "" },
      { key: 'realTenantName', labelEn: 'Active Tenant Name', labelAr: "" },
      { key: 'realEjariNo', labelEn: 'Ejari Contract / Tenancy No', labelAr: "" },
      { key: 'realMaintenanceStatus', labelEn: 'Handover / Maintenance State', labelAr: "" }
    ]
  },
  'Auto Repair': {
    id: 'Auto Repair',
    nameEn: 'Auto Repair & Garage',
    nameAr: '',
    fields: [
      { key: 'autoVIN', labelEn: 'Chassis / VIN Number', labelAr: "" },
      { key: 'autoPlateNo', labelEn: 'Vehicle License Plate', labelAr: "" },
      { key: 'autoMileage', labelEn: 'Odometer Mileage (KM)', labelAr: "" },
      { key: 'autoMechanic', labelEn: 'Assigned Mechanic', labelAr: "" }
    ]
  },
  Electrical: {
    id: 'Electrical',
    nameEn: 'Electrical Supplies & Contracting',
    nameAr: '',
    fields: [
      { key: 'elecVoltage', labelEn: 'Voltage / Phase Specs', labelAr: "" },
      { key: 'elecBrand', labelEn: 'Brand / Manufacturer', labelAr: "" },
      {
        key: 'elecApproval',
        labelEn: 'Authority Approval',
        labelAr: "",
        type: 'select',
        options: [
          { value: 'DEWA Approved', labelEn: 'DEWA Approved (Dubai)', labelAr: "" },
          { value: 'SEWA Approved', labelEn: 'SEWA Approved (Sharjah)', labelAr: "" },
          { value: 'ADDC Approved', labelEn: 'ADDC Approved (Abu Dhabi)', labelAr: "" },
          { value: 'FEWA / Etihad WE', labelEn: 'Etihad WE / FEWA Approved', labelAr: "" },
          { value: 'Standard GCC/CE', labelEn: 'Standard GCC / CE Compliant', labelAr: "" }
        ],
        defaultValue: 'DEWA Approved'
      },
      { key: 'elecRollSize', labelEn: 'Drum / Coil / Pack Size', labelAr: "" }
    ]
  },
  'Hardware Trading': {
    id: 'Hardware Trading',
    nameEn: 'Hardware & Building Materials Trading',
    nameAr: '',
    fields: [
      { key: 'hwBatchLot', labelEn: 'Batch / Heat / Lot No', labelAr: "" },
      { key: 'hwMaterialSpec', labelEn: 'Material Grade / Spec', labelAr: "" },
      { key: 'hwLpoRef', labelEn: 'Customer LPO / Delivery Ref', labelAr: "" },
      { key: 'hwYardLocation', labelEn: 'Depot / Yard Rack Location', labelAr: "" }
    ]
  },
  'Hardware trading': {
    id: 'Hardware trading',
    nameEn: 'Hardware & Building Materials Trading',
    nameAr: '',
    fields: [
      { key: 'hwBatchLot', labelEn: 'Batch / Heat / Lot No', labelAr: "" },
      { key: 'hwMaterialSpec', labelEn: 'Material Grade / Spec', labelAr: "" },
      { key: 'hwLpoRef', labelEn: 'Customer LPO / Delivery Ref', labelAr: "" },
      { key: 'hwYardLocation', labelEn: 'Depot / Yard Rack Location', labelAr: "" }
    ]
  },
  AutoSpareParts: {
    id: 'AutoSpareParts',
    nameEn: 'Auto & Bike Spare Parts (Car & Motorcycle)',
    nameAr: '',
    fields: [
      { key: 'spPartNo', labelEn: 'Part / OEM Number', labelAr: "" },
      {
        key: 'spVehicleType',
        labelEn: 'Vehicle Type',
        labelAr: "",
        type: 'select',
        options: [
          { value: 'Car', labelEn: 'Car / Passenger Vehicle', labelAr: "" },
          { value: 'Bike', labelEn: 'Motorcycle / Bike', labelAr: "" },
          { value: 'Heavy', labelEn: 'Truck / Commercial / Pickup', labelAr: "" },
          { value: 'Universal', labelEn: 'Universal / All Vehicles', labelAr: "" }
        ],
        defaultValue: 'Car'
      },
      { key: 'spVehicleMakeModel', labelEn: 'Applicable Make & Model', labelAr: "" },
      {
        key: 'spPartCategory',
        labelEn: 'Part Category',
        labelAr: "",
        type: 'select',
        options: [
          { value: 'Engine Parts', labelEn: 'Engine & Internal Components', labelAr: "" },
          { value: 'Brake System', labelEn: 'Brakes, Pads & Discs', labelAr: "" },
          { value: 'Suspension & Steering', labelEn: 'Suspension, Shocks & Steering', labelAr: "" },
          { value: 'Transmission & Clutch', labelEn: 'Clutch, Gearbox & Transmission', labelAr: "" },
          { value: 'Electrical & Ignition', labelEn: 'Electrical, Spark Plugs & Battery', labelAr: "" },
          { value: 'Body & Lighting', labelEn: 'Body Panels, Mirrors & Lights', labelAr: "" },
          { value: 'Filters & Lubricants', labelEn: 'Oil, Air & Fuel Filters', labelAr: "" },
          { value: 'Cooling & Exhaust', labelEn: 'Radiator, AC & Exhaust', labelAr: "" }
        ],
        defaultValue: 'Brake System'
      },
      { key: 'spShelfRack', labelEn: 'Warehouse Rack / Shelf / Bin', labelAr: "" },
      {
        key: 'spCondition',
        labelEn: 'Part Condition',
        labelAr: "",
        type: 'select',
        options: [
          { value: 'Brand New OEM', labelEn: 'Brand New OEM', labelAr: "" },
          { value: 'Genuine Aftermarket', labelEn: 'Genuine Aftermarket', labelAr: "" },
          { value: 'Used Genuine', labelEn: 'Used Original / Scrap', labelAr: "" },
          { value: 'Reconditioned', labelEn: 'Reconditioned / Refurbished', labelAr: "" }
        ],
        defaultValue: 'Brand New OEM'
      },
      { key: 'spWarranty', labelEn: 'Warranty Period', labelAr: "" }
    ]
  },
  CarSpareParts: {
    id: 'CarSpareParts',
    nameEn: 'Automotive & Car Spare Parts',
    nameAr: '',
    fields: [
      { key: 'spPartNo', labelEn: 'Part / OEM Number', labelAr: "" },
      { key: 'spVehicleMakeModel', labelEn: 'Car Make & Model', labelAr: "" },
      { key: 'spShelfRack', labelEn: 'Warehouse Rack / Shelf / Bin', labelAr: "" },
      { key: 'spWarranty', labelEn: 'Warranty Period', labelAr: "" }
    ]
  },
  BikeSpareParts: {
    id: 'BikeSpareParts',
    nameEn: 'Motorcycle & Bike Spare Parts',
    nameAr: '',
    fields: [
      { key: 'spPartNo', labelEn: 'Part / Model Number', labelAr: "" },
      { key: 'spVehicleMakeModel', labelEn: 'Bike Make & Model', labelAr: "" },
      { key: 'spShelfRack', labelEn: 'Bin / Shelf Location', labelAr: "" },
      { key: 'spWarranty', labelEn: 'Warranty Period', labelAr: "" }
    ]
  },
  ComputerSalesAndService: {
    id: 'ComputerSalesAndService',
    nameEn: 'Computer Sales, Service, Printers & IT Solutions',
    nameAr: '',
    fields: [
      {
        key: 'itItemCategory',
        labelEn: 'Device / Item Category',
        labelAr: "",
        type: 'select',
        options: [
          { value: 'Laptop', labelEn: 'Laptop & Notebook', labelAr: "" },
          { value: 'Desktop PC', labelEn: 'Desktop PC & Workstation', labelAr: "" },
          { value: 'Printer / Copier', labelEn: 'Laser Printer & Copier', labelAr: "" },
          { value: 'Toner & Ink', labelEn: 'Toner Cartridges & Ink', labelAr: "" },
          { value: 'Storage & RAM', labelEn: 'SSD, RAM & Components', labelAr: "" },
          { value: 'Networking', labelEn: 'Routers, Switches & Wi-Fi', labelAr: "" },
          { value: 'Peripherals', labelEn: 'Keyboard, Mouse & Monitors', labelAr: "" },
          { value: 'Repair Service', labelEn: 'Computer / Laptop Repair Service', labelAr: "" },
          { value: 'Printer Service', labelEn: 'Printer Repair & Maintenance', labelAr: "" },
          { value: 'AMC / IT Support', labelEn: 'Annual Maintenance Contract', labelAr: "" }
        ],
        defaultValue: 'Laptop'
      },
      { key: 'itSerialNumber', labelEn: 'Serial Number (S/N / Asset Tag)', labelAr: "" },
      { key: 'itDeviceSpecs', labelEn: 'Hardware Specs (CPU / RAM / SSD)', labelAr: "" },
      { key: 'itPrinterCompatibility', labelEn: 'Printer Model / Cartridge Yield', labelAr: "" },
      {
        key: 'itCondition',
        labelEn: 'Condition',
        labelAr: "",
        type: 'select',
        options: [
          { value: 'Brand New Sealed', labelEn: 'Brand New Factory Sealed', labelAr: "" },
          { value: 'Open Box / Demo', labelEn: 'Open Box / Demo Unit', labelAr: "" },
          { value: 'Certified Refurbished', labelEn: 'Certified Refurbished', labelAr: "" },
          { value: 'Used / Tested', labelEn: 'Used Clean / 100% Tested', labelAr: "" }
        ],
        defaultValue: 'Brand New Sealed'
      },
      { key: 'itWarranty', labelEn: 'Warranty Coverage', labelAr: "" },
      { key: 'itJobCardId', labelEn: 'Repair Job Ticket / RMA Ref', labelAr: "" }
    ]
  },
  'Pharmacy & Healthcare': {
    id: 'Pharmacy & Healthcare',
    nameEn: 'Pharmacy, Medical Store & Healthcare',
    nameAr: 'Pharmacy, Medical Store & Healthcare',
    fields: [
      { key: 'medBatchNo', labelEn: 'Batch No', labelAr: "" },
      { key: 'medExpiry', labelEn: 'Expiry Date (MM/YY)', labelAr: "" },
      {
        key: 'medDosage',
        labelEn: 'Dosage Form',
        labelAr: "",
        type: 'select',
        options: [
          { value: 'Tablets', labelEn: 'Tablets', labelAr: "" },
          { value: 'Syrup / Suspension', labelEn: 'Syrup / Suspension', labelAr: "" },
          { value: 'Capsules', labelEn: 'Capsules', labelAr: "" },
          { value: 'Injection / Ampoule', labelEn: 'Injection / Ampoule', labelAr: "" },
          { value: 'Ointment / Cream', labelEn: 'Ointment / Cream', labelAr: "" },
          { value: 'Drops (Eye/Ear)', labelEn: 'Drops (Eye/Ear)', labelAr: "" },
          { value: 'Sachet / Powder', labelEn: 'Sachet / Powder', labelAr: "" },
          { value: 'Inhaler / Resp', labelEn: 'Inhaler / Nebulizer', labelAr: "" },
          { value: 'Surgical / Disposable', labelEn: 'Surgical / Disposable Item', labelAr: "" }
        ],
        defaultValue: 'Tablets'
      },
      { key: 'medGeneric', labelEn: 'Generic / Formula Name', labelAr: "" },
      { key: 'medPackSize', labelEn: 'Pack / Strip Size', labelAr: "" },
      { key: 'medManufacturer', labelEn: 'Pharma Company / Brand', labelAr: "" },
      { key: 'medDrapReg', labelEn: 'Drug Reg No / DRAP No', labelAr: "" },
      {
        key: 'medRxStatus',
        labelEn: 'Prescription Status',
        labelAr: "",
        type: 'select',
        options: [
          { value: 'Rx - Prescription Required', labelEn: 'Rx - Prescription Required', labelAr: "" },
          { value: 'OTC - Over The Counter', labelEn: 'OTC - General Over The Counter', labelAr: "" },
          { value: 'Controlled / Narcotic', labelEn: 'Controlled Drug', labelAr: "" }
        ],
        defaultValue: 'Rx - Prescription Required'
      }
    ]
  },
  'Pharmacy & Medical Store': {
    id: 'Pharmacy & Medical Store',
    nameEn: 'Pharmacy, Medical Store & Healthcare',
    nameAr: 'Pharmacy, Medical Store & Healthcare',
    fields: [
      { key: 'medBatchNo', labelEn: 'Batch No', labelAr: "" },
      { key: 'medExpiry', labelEn: 'Expiry Date (MM/YY)', labelAr: "" },
      {
        key: 'medDosage',
        labelEn: 'Dosage Form',
        labelAr: "",
        type: 'select',
        options: [
          { value: 'Tablets', labelEn: 'Tablets', labelAr: "" },
          { value: 'Syrup / Suspension', labelEn: 'Syrup / Suspension', labelAr: "" },
          { value: 'Capsules', labelEn: 'Capsules', labelAr: "" },
          { value: 'Injection / Ampoule', labelEn: 'Injection / Ampoule', labelAr: "" },
          { value: 'Ointment / Cream', labelEn: 'Ointment / Cream', labelAr: "" },
          { value: 'Drops (Eye/Ear)', labelEn: 'Drops (Eye/Ear)', labelAr: "" },
          { value: 'Sachet / Powder', labelEn: 'Sachet / Powder', labelAr: "" },
          { value: 'Inhaler / Resp', labelEn: 'Inhaler / Nebulizer', labelAr: "" },
          { value: 'Surgical / Disposable', labelEn: 'Surgical / Disposable Item', labelAr: "" }
        ],
        defaultValue: 'Tablets'
      },
      { key: 'medGeneric', labelEn: 'Generic / Formula Name', labelAr: "" },
      { key: 'medPackSize', labelEn: 'Pack / Strip Size', labelAr: "" },
      { key: 'medManufacturer', labelEn: 'Pharma Company / Brand', labelAr: "" },
      { key: 'medDrapReg', labelEn: 'Drug Reg No / DRAP No', labelAr: "" },
      {
        key: 'medRxStatus',
        labelEn: 'Prescription Status',
        labelAr: "",
        type: 'select',
        options: [
          { value: 'Rx - Prescription Required', labelEn: 'Rx - Prescription Required', labelAr: "" },
          { value: 'OTC - Over The Counter', labelEn: 'OTC - General Over The Counter', labelAr: "" },
          { value: 'Controlled / Narcotic', labelEn: 'Controlled Drug', labelAr: "" }
        ],
        defaultValue: 'Rx - Prescription Required'
      }
    ]
  },
  Pharmaceutical: {
    id: 'Pharmaceutical',
    nameEn: 'Pharmaceutical & Medical Distribution',
    nameAr: 'Pharmaceutical & Medical Distribution',
    fields: [
      { key: 'medBatchNo', labelEn: 'Batch No', labelAr: "" },
      { key: 'medExpiry', labelEn: 'Expiry Date (MM/YY)', labelAr: "" },
      { key: 'medGeneric', labelEn: 'Generic / Chemical Formula', labelAr: "" },
      { key: 'medPackSize', labelEn: 'Master Shipper / Outer Pack', labelAr: "" },
      { key: 'medManufacturer', labelEn: 'Manufacturing Lab', labelAr: "" },
      { key: 'medDrapReg', labelEn: 'DRAP Registration No', labelAr: "" }
    ]
  },
  Other: {
    id: 'Other',
    nameEn: 'Other Business / Core Custom',
    nameAr: 'Other Business / Core Custom',
    fields: [
      { key: 'customTag1', labelEn: 'Custom Label 1', labelAr: "" },
      { key: 'customTag2', labelEn: 'Custom Label 2', labelAr: "" }
    ]
  }
};
