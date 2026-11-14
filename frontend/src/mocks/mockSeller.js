/**
 * Mock Multi-Vendor Seller Repository & Store Management (Isolated Frontend Mock Layer)
 * Used in Mock Preview mode to simulate real merchant operations without live backend.
 */
import { MOCK_PRODUCTS } from './mockProducts.js';

const SELLER_STORES_KEY = 'zen_mock_seller_stores_v2';
const SELLER_PRODUCTS_KEY = 'zen_mock_seller_products_v2';
const SELLER_ORDERS_KEY = 'zen_mock_seller_orders_v2';

export const SELLER_STATUSES = {
  NOT_SUBMITTED: 'NOT_SUBMITTED',
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
};

export const ORDER_LIFECYCLE = {
  NEW: 'NEW',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  RETURN_REQUESTED: 'RETURN_REQUESTED',
  RETURNED: 'RETURNED',
};

const SEEDED_STORES = [
  {
    id: 'store-tokyo-optics',
    ownerId: 'usr-seller-tokyo',
    ownerEmail: 'seller@zen.global',
    businessName: 'Tokyo Optics & Artisanal Exports Co., Ltd.',
    businessType: 'Corporation (Kabushiki Kaisha)',
    ownerName: 'Kenji Sato',
    businessEmail: 'seller@zen.global',
    contactNumber: '+81 3 5555 0192',
    businessCountry: 'JP',
    registeredAddress: 'Shinjuku 3-Chome, Shinjuku-ku, Tokyo 160-0022, Japan',
    registrationNumber: 'JP-CORP-8829104',
    taxId: 'JP9010001029384',
    storeName: 'Tokyo Optics & Craft',
    storeSlug: 'tokyo-optics',
    storeDescription:
      'Premier Japanese authorized exporter. We curate legendary camera gear, precision audio, ceremonial Uji matcha, and handcrafted Kyoto leather planners for buyers worldwide.',
    storeLogo: '/images/products/running-shoes.jpg',
    primaryCategory: 'Electronics',
    productCategories: ['Electronics', 'Office & Stationery', 'Home & Kitchen', 'Sports & Outdoors'],
    merchantCurrency: 'JPY',
    shippingOrigin: 'JP',
    dispatchLocation: 'Tokyo Narita Airfreight Hub, Japan',
    dispatchTimeDays: 1,
    supportedDestinations: ['IN', 'US', 'GB', 'DE', 'SG', 'KR', 'AE', 'CA', 'AU'],
    verificationStatus: SELLER_STATUSES.APPROVED,
    adminNotes: 'Verified commercial registration and valid Japanese export credentials.',
    verifiedAt: '2026-09-15T09:00:00.000Z',
    documents: [
      { name: 'tokyo_corporate_registry.pdf', type: 'incorporation', uploadedAt: '2026-09-14T10:00:00.000Z' },
      { name: 'national_tax_certificate.pdf', type: 'tax', uploadedAt: '2026-09-14T10:05:00.000Z' },
    ],
    createdAt: '2026-09-14T08:30:00.000Z',
    metrics: {
      grossSalesMerchant: 1892000,
      completedOrders: 18,
      pendingOrders: 2,
      activeProducts: 4,
      settlementBalanceMerchant: 742000,
      payoutStatus: 'PENDING_CLEARANCE',
    },
  },
  {
    id: 'store-berlin-audio',
    ownerId: 'usr-seller-berlin',
    ownerEmail: 'pending.seller@zen.global',
    businessName: 'Berlin Sound & Engineering GmbH',
    businessType: 'Limited Liability (GmbH)',
    ownerName: 'Lukas Weber',
    businessEmail: 'pending.seller@zen.global',
    contactNumber: '+49 30 901820',
    businessCountry: 'DE',
    registeredAddress: 'Friedrichstraße 44, 10117 Berlin, Germany',
    registrationNumber: 'HRB 928371 B',
    taxId: 'DE814920192',
    storeName: 'Berlin Audio Works',
    storeSlug: 'berlin-audio-works',
    storeDescription: 'Handcrafted studio monitoring headphones and tube amplifiers from Berlin.',
    storeLogo: '/images/products/espresso-machine.jpg',
    primaryCategory: 'Electronics',
    productCategories: ['Electronics'],
    merchantCurrency: 'EUR',
    shippingOrigin: 'DE',
    dispatchLocation: 'Berlin-Brandenburg Air Logistics, Germany',
    dispatchTimeDays: 2,
    supportedDestinations: ['IN', 'US', 'GB', 'DE', 'SG'],
    verificationStatus: SELLER_STATUSES.PENDING_REVIEW,
    adminNotes: 'Application submitted; compliance review in progress.',
    verifiedAt: null,
    documents: [
      { name: 'handelsregister_auszug.pdf', type: 'incorporation', uploadedAt: '2026-11-10T14:20:00.000Z' },
    ],
    createdAt: '2026-11-10T14:15:00.000Z',
    metrics: {
      grossSalesMerchant: 0,
      completedOrders: 0,
      pendingOrders: 0,
      activeProducts: 0,
      settlementBalanceMerchant: 0,
      payoutStatus: 'UNAVAILABLE',
    },
  },
];

const SEEDED_SELLER_ORDERS = [
  {
    orderId: 'ORD-JP-889101',
    parentOrderId: 'ZEN-ORDER-771920',
    storeId: 'store-tokyo-optics',
    buyerName: 'Aarav Sharma',
    buyerEmail: 'aarav@zen.global',
    destinationCountry: 'IN',
    shippingAddress: {
      fullName: 'Aarav Sharma',
      addressLine1: '42 Indiranagar 100ft Rd',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560038',
      countryCode: 'IN',
    },
    items: [
      {
        productId: 'prod-fujifilm-x100vi-jp',
        title: 'Fujifilm X100VI Digital Camera (Silver Limited Edition)',
        sku: 'FUJI-X100VI-SLV',
        quantity: 1,
        originalPrice: 268000,
        originalCurrency: 'JPY',
        convertedPrice: 151900,
        buyerCurrency: 'INR',
      },
    ],
    merchantCurrency: 'JPY',
    subtotalMerchant: 268000,
    shippingFeeMerchant: 12500,
    totalMerchant: 280500,
    status: ORDER_LIFECYCLE.SHIPPED,
    trackingCarrier: 'DHL Express International',
    trackingNumber: 'DHL-JP-9481029410',
    estimatedDeliveryDate: '2026-11-18',
    dispatchedAt: '2026-11-11T12:00:00.000Z',
    createdAt: '2026-11-10T09:30:00.000Z',
    auditTrail: [
      { status: ORDER_LIFECYCLE.NEW, timestamp: '2026-11-10T09:30:00.000Z', note: 'Order placed by buyer via PayPal Sandbox.' },
      { status: ORDER_LIFECYCLE.CONFIRMED, timestamp: '2026-11-10T10:15:00.000Z', note: 'Store confirmed export inventory availability.' },
      { status: ORDER_LIFECYCLE.PROCESSING, timestamp: '2026-11-10T14:00:00.000Z', note: 'Packed with export shock-proof packaging.' },
      { status: ORDER_LIFECYCLE.SHIPPED, timestamp: '2026-11-11T12:00:00.000Z', note: 'Handed to DHL Express Tokyo Hub. Airway bill generated.' },
    ],
  },
  {
    orderId: 'ORD-JP-889102',
    parentOrderId: 'ZEN-ORDER-771928',
    storeId: 'store-tokyo-optics',
    buyerName: 'Maya Chen',
    buyerEmail: 'maya@zen.global',
    destinationCountry: 'US',
    shippingAddress: {
      fullName: 'Maya Chen',
      addressLine1: '782 Market Street',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94103',
      countryCode: 'US',
    },
    items: [
      {
        productId: 'prod-uji-matcha-set-jp',
        title: 'Ceremonial Uji Matcha Starter Set with Hand-Carved Chasen',
        sku: 'KYOTO-TEA-001',
        quantity: 2,
        originalPrice: 14500,
        originalCurrency: 'JPY',
        convertedPrice: 96,
        buyerCurrency: 'USD',
      },
    ],
    merchantCurrency: 'JPY',
    subtotalMerchant: 29000,
    shippingFeeMerchant: 4200,
    totalMerchant: 33200,
    status: ORDER_LIFECYCLE.CONFIRMED,
    trackingCarrier: null,
    trackingNumber: null,
    estimatedDeliveryDate: null,
    createdAt: '2026-11-12T05:20:00.000Z',
    auditTrail: [
      { status: ORDER_LIFECYCLE.NEW, timestamp: '2026-11-12T05:20:00.000Z', note: 'Multi-package order placed by buyer.' },
      { status: ORDER_LIFECYCLE.CONFIRMED, timestamp: '2026-11-12T06:10:00.000Z', note: 'Merchant confirmed order readiness.' },
    ],
  },
  {
    orderId: 'ORD-JP-889103',
    parentOrderId: 'ZEN-ORDER-771940',
    storeId: 'store-tokyo-optics',
    buyerName: 'David Miller',
    buyerEmail: 'david@zen.global',
    destinationCountry: 'GB',
    shippingAddress: {
      fullName: 'David Miller',
      addressLine1: '12 Kensington High St',
      city: 'London',
      state: 'Greater London',
      postalCode: 'W8 4PT',
      countryCode: 'GB',
    },
    items: [
      {
        productId: 'prod-hobonichi-planner-jp',
        title: 'Japanese A5 Techo Leather Cover & Solid Brass Fountain Pen',
        sku: 'STATIONERY-JP-A5',
        quantity: 1,
        originalPrice: 18400,
        originalCurrency: 'JPY',
        convertedPrice: 98,
        buyerCurrency: 'GBP',
      },
    ],
    merchantCurrency: 'JPY',
    subtotalMerchant: 18400,
    shippingFeeMerchant: 3800,
    totalMerchant: 22200,
    status: ORDER_LIFECYCLE.NEW,
    trackingCarrier: null,
    trackingNumber: null,
    estimatedDeliveryDate: null,
    createdAt: '2026-11-12T11:45:00.000Z',
    auditTrail: [
      { status: ORDER_LIFECYCLE.NEW, timestamp: '2026-11-12T11:45:00.000Z', note: 'New international purchase awaiting merchant review.' },
    ],
  },
];

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // quota/restricted fallback
  }
}

function normalizeStoreRecord(store) {
  if (!store) return null;
  return {
    ...store,
    currency: store.currency || store.merchantCurrency || 'USD',
    merchantCurrency: store.currency || store.merchantCurrency || 'USD',
    originCountry: store.originCountry || store.shippingOrigin || store.businessCountry || 'US',
    shippingOrigin: store.originCountry || store.shippingOrigin || store.businessCountry || 'US',
    legalBusinessName: store.legalBusinessName || store.businessName || '',
    businessName: store.legalBusinessName || store.businessName || '',
    description: store.description || store.storeDescription || '',
    storeDescription: store.description || store.storeDescription || '',
  };
}

export function getMockSellerStores() {
  const existing = readJson(SELLER_STORES_KEY, null);
  if (!existing || existing.length === 0) {
    const normalized = SEEDED_STORES.map(normalizeStoreRecord);
    writeJson(SELLER_STORES_KEY, normalized);
    return normalized;
  }
  return existing.map(normalizeStoreRecord);
}

export function getStoreByOwnerEmail(email) {
  if (!email) return null;
  const stores = getMockSellerStores();
  return stores.find((s) => s.ownerEmail.toLowerCase() === String(email).toLowerCase()) || null;
}

export function getStoreById(storeId) {
  if (!storeId) return null;
  const stores = getMockSellerStores();
  return stores.find((s) => s.id === storeId) || null;
}

export function registerMockSellerStore(payload, ownerEmail, ownerId) {
  const stores = getMockSellerStores();
  const existing = stores.find((s) => s.ownerEmail.toLowerCase() === ownerEmail.toLowerCase());
  if (existing) {
    throw new Error('A seller store is already registered for this account.');
  }

  const rawStore = {
    id: `store-${Date.now()}`,
    ownerId: ownerId || `usr-${Date.now()}`,
    ownerEmail: ownerEmail.toLowerCase(),
    businessName: payload.legalBusinessName || payload.businessName,
    legalBusinessName: payload.legalBusinessName || payload.businessName,
    businessType: payload.businessType || 'Corporation',
    ownerName: payload.ownerName,
    businessEmail: payload.businessEmail || ownerEmail,
    contactNumber: payload.contactNumber,
    businessCountry: payload.businessCountry || payload.originCountry || 'US',
    registeredAddress: payload.businessAddress || payload.registeredAddress,
    registrationNumber: payload.registrationNumber || `REG-${Date.now()}`,
    taxId: payload.taxId || `TAX-${Date.now()}`,
    storeName: payload.storeName,
    storeSlug: (payload.slug || payload.storeSlug || payload.storeName)
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-'),
    slug: (payload.slug || payload.storeSlug || payload.storeName)
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-'),
    description: payload.description || payload.storeDescription,
    storeDescription: payload.description || payload.storeDescription,
    storeLogo: payload.storeLogo || '/images/products/running-shoes.jpg',
    primaryCategory: payload.primaryCategory || 'Electronics',
    productCategories: payload.productCategories || [payload.primaryCategory || 'Electronics'],
    currency: payload.currency || payload.storeCurrency || payload.merchantCurrency || 'USD',
    merchantCurrency: payload.currency || payload.storeCurrency || payload.merchantCurrency || 'USD',
    originCountry: payload.originCountry || payload.shippingOrigin || payload.businessCountry || 'US',
    shippingOrigin: payload.originCountry || payload.shippingOrigin || payload.businessCountry || 'US',
    dispatchLocation: payload.dispatchLocation || `${payload.businessCountry || 'Export'} Hub`,
    dispatchTimeDays: Number(payload.dispatchTimeDays) || 2,
    supportedDestinations: payload.supportedDestinations || ['IN', 'US', 'GB', 'DE', 'SG', 'JP', 'KR'],
    verificationStatus: SELLER_STATUSES.PENDING_REVIEW,
    adminNotes: 'Application submitted. Pending review by compliance team.',
    verifiedAt: null,
    bankDetails: payload.bankDetails,
    documents: payload.verificationDocuments || payload.documents || [
      { name: 'business_registration.pdf', type: 'incorporation', uploadedAt: new Date().toISOString() },
    ],
    createdAt: new Date().toISOString(),
    metrics: {
      grossSalesMerchant: 0,
      completedOrders: 0,
      pendingOrders: 0,
      activeProducts: 0,
      settlementBalanceMerchant: 0,
      payoutStatus: 'UNAVAILABLE',
    },
  };

  const newStore = normalizeStoreRecord(rawStore);
  stores.unshift(newStore);
  writeJson(SELLER_STORES_KEY, stores);
  return newStore;
}

export function updateMockSellerStore(storeId, updates) {
  const stores = getMockSellerStores();
  const idx = stores.findIndex((s) => s.id === storeId);
  if (idx === -1) throw new Error('Store not found.');
  stores[idx] = { ...stores[idx], ...updates, updatedAt: new Date().toISOString() };
  writeJson(SELLER_STORES_KEY, stores);
  return stores[idx];
}

// Products scoped to a seller
export function getMockSellerProducts(storeId) {
  const customProducts = readJson(SELLER_PRODUCTS_KEY, []);
  const store = getStoreById(storeId);
  const storeName = store ? store.storeName : '';
  const country = store ? store.shippingOrigin : 'JP';

  // Find products matching merchant name from catalog or custom created
  const baseCatalogMatches = MOCK_PRODUCTS.filter(
    (p) =>
      p.merchant?.country === country &&
      (storeName ? p.merchant?.name?.toLowerCase().includes(storeName.toLowerCase().split(' ')[0]) || p.merchant?.name === 'Tokyo Optics' : false)
  ).map((p) => ({
    ...p,
    storeId: storeId,
    sku: p.sku || `SKU-${p.id.slice(-6).toUpperCase()}`,
    status: p.availability === 'out_of_stock' ? 'OUT_OF_STOCK' : 'ACTIVE',
  }));

  const userCustom = customProducts.filter((p) => p.storeId === storeId);
  return [...userCustom, ...baseCatalogMatches];
}

export function createMockSellerProduct(storeId, productData) {
  const store = getStoreById(storeId);
  if (!store) throw new Error('Store not found.');
  if (store.verificationStatus !== SELLER_STATUSES.APPROVED) {
    throw new Error('Only approved, verified stores can publish products.');
  }

  const customProducts = readJson(SELLER_PRODUCTS_KEY, []);
  const newProduct = {
    id: `prod-${Date.now()}`,
    storeId,
    title: productData.title,
    shortTitle: productData.shortTitle || productData.title.slice(0, 40),
    brand: productData.brand || store.storeName,
    category: productData.category,
    categorySlug: (productData.category || 'electronics').toLowerCase().replace(/\s+/g, '-'),
    subcategory: productData.subcategory || '',
    sku: productData.sku || `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
    merchant: {
      id: storeId,
      name: store.storeName,
      country: store.shippingOrigin,
      verified: true,
      rating: 5.0,
      dispatchLocation: store.dispatchLocation,
    },
    originalPrice: Number(productData.originalPrice),
    originalCurrency: store.merchantCurrency || productData.originalCurrency || 'USD',
    baseShippingUsd: Number(productData.baseShippingUsd) || 15.0,
    estimatedDeliveryDays: productData.estimatedDeliveryDays || { min: 4, max: 7 },
    availability: Number(productData.stockQuantity) > 0 ? 'in_stock' : 'out_of_stock',
    stockQuantity: Number(productData.stockQuantity) || 10,
    stockLabel: Number(productData.stockQuantity) > 0 ? 'In Stock · Seller Direct' : 'Out of Stock',
    rating: 5.0,
    reviewCount: 0,
    weightKg: Number(productData.weightKg) || 0.5,
    dutyRate: Number(productData.dutyRate) || 0.1,
    taxRate: Number(productData.taxRate) || 0.18,
    imageUrl: productData.imageUrl || '/images/products/running-shoes.jpg',
    images: productData.images?.length > 0 ? productData.images : [productData.imageUrl || '/images/products/running-shoes.jpg'],
    description: productData.description || 'Authentic seller-listed merchandise.',
    highlights: productData.highlights || ['Direct manufacturer export', 'Standard international warranty included'],
    variants: productData.variants || [],
    dimensions: productData.dimensions || { length: 20, width: 15, height: 10, unit: 'cm' },
    returnPolicy: productData.returnPolicy || '14 days international return window.',
    status: productData.status || 'ACTIVE',
    createdAt: new Date().toISOString(),
    isMock: true,
    source: 'mock',
  };

  customProducts.unshift(newProduct);
  writeJson(SELLER_PRODUCTS_KEY, customProducts);
  return newProduct;
}

export function updateMockSellerProduct(productId, updates) {
  const customProducts = readJson(SELLER_PRODUCTS_KEY, []);
  const idx = customProducts.findIndex((p) => p.id === productId);
  if (idx !== -1) {
    customProducts[idx] = { ...customProducts[idx], ...updates, updatedAt: new Date().toISOString() };
    writeJson(SELLER_PRODUCTS_KEY, customProducts);
    return customProducts[idx];
  }
  // If editing an initial product from catalog, make a custom copy
  const base = MOCK_PRODUCTS.find((p) => p.id === productId);
  if (!base) throw new Error('Product not found.');
  const merged = { ...base, ...updates, updatedAt: new Date().toISOString() };
  customProducts.unshift(merged);
  writeJson(SELLER_PRODUCTS_KEY, customProducts);
  return merged;
}

export function deleteMockSellerProduct(productId) {
  const customProducts = readJson(SELLER_PRODUCTS_KEY, []);
  const filtered = customProducts.filter((p) => p.id !== productId);
  writeJson(SELLER_PRODUCTS_KEY, filtered);
  return { success: true };
}

function normalizeOrderRecord(o) {
  if (!o) return null;
  const id = o.id || o.orderId;
  const trackingCarrier = o.trackingCarrier || o.tracking?.carrier;
  const trackingNumber = o.trackingNumber || o.tracking?.trackingNumber;
  return {
    ...o,
    id,
    orderId: id,
    orderNumber: o.orderNumber || id,
    customerEmail: o.customerEmail || o.buyerEmail,
    itemsTotalOriginal: o.itemsTotalOriginal || o.subtotalMerchant || 0,
    currency: o.currency || o.merchantCurrency || 'JPY',
    tracking: o.tracking || (trackingCarrier ? {
      carrier: trackingCarrier,
      trackingNumber,
      originWarehouse: o.dispatchLocation || 'Tokyo Cargo Terminal',
      estimatedDeliveryDays: o.estimatedDeliveryDays || '3-5 business days',
    } : null),
  };
}

// Orders scoped to a seller
export function getMockSellerOrders(storeId) {
  const orders = readJson(SELLER_ORDERS_KEY, null);
  const pool = (!orders || orders.length === 0) ? SEEDED_SELLER_ORDERS : orders;
  if (!orders || orders.length === 0) {
    writeJson(SELLER_ORDERS_KEY, pool.map(normalizeOrderRecord));
  }
  const filtered = pool.filter((o) => !storeId || o.storeId === storeId);
  return filtered.map(normalizeOrderRecord);
}

export function updateMockOrderStatus(orderId, nextStatus, note = '') {
  const orders = readJson(SELLER_ORDERS_KEY, SEEDED_SELLER_ORDERS).map(normalizeOrderRecord);
  const idx = orders.findIndex((o) => o.orderId === orderId || o.id === orderId);
  if (idx === -1) throw new Error('Order not found.');

  const order = orders[idx];
  order.status = nextStatus;
  order.auditTrail = order.auditTrail || [];
  order.auditTrail.push({
    status: nextStatus,
    timestamp: new Date().toISOString(),
    note: note || `Status updated to ${nextStatus}`,
  });
  order.updatedAt = new Date().toISOString();

  orders[idx] = order;
  writeJson(SELLER_ORDERS_KEY, orders);
  return order;
}

export function addMockOrderTracking(orderId, { carrier, trackingNumber, originWarehouse, estimatedDeliveryDays, estimatedDeliveryDate }) {
  const orders = readJson(SELLER_ORDERS_KEY, SEEDED_SELLER_ORDERS).map(normalizeOrderRecord);
  const idx = orders.findIndex((o) => o.orderId === orderId || o.id === orderId);
  if (idx === -1) throw new Error('Order not found.');

  const order = orders[idx];
  order.status = ORDER_LIFECYCLE.SHIPPED;
  order.trackingCarrier = carrier;
  order.trackingNumber = trackingNumber;
  order.estimatedDeliveryDate = estimatedDeliveryDate || '3-5 business days';
  order.tracking = {
    carrier,
    trackingNumber,
    originWarehouse: originWarehouse || 'Tokyo Narita Air Hub',
    estimatedDeliveryDays: estimatedDeliveryDays || estimatedDeliveryDate || '3-5 business days',
  };
  order.dispatchedAt = new Date().toISOString();
  order.auditTrail = order.auditTrail || [];
  order.auditTrail.push({
    status: ORDER_LIFECYCLE.SHIPPED,
    timestamp: new Date().toISOString(),
    note: `Tracking added: ${carrier} (${trackingNumber}). Package dispatched.`,
  });

  orders[idx] = order;
  writeJson(SELLER_ORDERS_KEY, orders);
  return order;
}

export function getMockSellerAnalytics(storeId, dateRange = '30d') {
  const orders = getMockSellerOrders(storeId);
  const store = getStoreById(storeId);
  const curr = store?.merchantCurrency || 'JPY';

  const validOrders = orders.filter((o) => o.status !== ORDER_LIFECYCLE.CANCELLED);
  const totalRevenue = validOrders.reduce((sum, o) => sum + (o.subtotalMerchant || 0), 0);

  const deliveredCount = orders.filter((o) => o.status === ORDER_LIFECYCLE.DELIVERED).length;
  const inFlightCount = orders.filter((o) => [ORDER_LIFECYCLE.PROCESSING, ORDER_LIFECYCLE.SHIPPED].includes(o.status)).length;
  const newCount = orders.filter((o) => [ORDER_LIFECYCLE.NEW, ORDER_LIFECYCLE.CONFIRMED].includes(o.status)).length;

  const aov = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;
  const platformFees = Number((totalRevenue * 0.05).toFixed(2));
  const gatewayFees = Number((totalRevenue * 0.029 + validOrders.length * (curr === 'JPY' ? 40 : 0.35)).toFixed(2));
  const netRevenue = Number((totalRevenue - platformFees - gatewayFees).toFixed(2));

  return {
    merchantCurrency: curr,
    currency: curr,
    totalGrossRevenue: totalRevenue,
    grossSales: totalRevenue,
    netRevenue,
    orderVolume: orders.length,
    deliveredOrders: deliveredCount,
    activeFulfillments: inFlightCount,
    actionRequiredOrders: newCount,
    averageOrderValue: aov,
    platformFeeRate: 0.05,
    estimatedPlatformFees: platformFees,
    estimatedGatewayFees: gatewayFees,
    netSettlementBalance: Number((totalRevenue * 0.95).toFixed(2)),
    pendingSettlementBalance: inFlightCount > 0 ? Math.round(totalRevenue * 0.42) : 0,
    completedPayouts: Math.round(totalRevenue * 0.53),
    refunds: 0,
    activeProductsCount: store?.metrics?.activeProducts || 4,
    lowStockCount: 2,
    trends: {
      grossSalesDeltaPct: +14.8,
      netRevenueDeltaPct: +15.2,
      orderVolumeDeltaPct: +8.6,
      aovDeltaPct: +5.7,
    },
    topDestinationCountries: [
      { code: 'IN', name: 'India', share: '45%' },
      { code: 'US', name: 'United States', share: '30%' },
      { code: 'GB', name: 'United Kingdom', share: '15%' },
      { code: 'DE', name: 'Germany', share: '10%' },
    ],
  };
}

export function getMockSellerTransactions(storeId, filters = {}) {
  const store = getStoreById(storeId);
  const curr = store?.merchantCurrency || 'JPY';
  const orders = getMockSellerOrders(storeId);

  // Generate realistic transactions linked to existing store orders
  const baseTransactions = orders.map((order, idx) => {
    const gross = order.subtotalMerchant || (curr === 'JPY' ? 145000 : 1200);
    const platformFee = Number((gross * 0.05).toFixed(2));
    const gatewayFee = Number((gross * 0.029 + (curr === 'JPY' ? 40 : 0.35)).toFixed(2));
    const net = Number((gross - platformFee - gatewayFee).toFixed(2));
    const isCleared = [ORDER_LIFECYCLE.DELIVERED, ORDER_LIFECYCLE.SHIPPED].includes(order.status);

    return {
      id: `TXN-${order.id.replace('ORD-', '')}-${100 + idx}`,
      orderId: order.id,
      storeId: store?.id,
      timestamp: order.createdAt || new Date(Date.now() - (idx + 1) * 86400000 * 2).toISOString(),
      paymentProvider: 'PayPal Sandbox',
      providerCaptureId: `CAPTURE-PP-${98000 + idx}`,
      status: order.status === ORDER_LIFECYCLE.CANCELLED ? 'REFUNDED' : 'SUCCESS',
      type: 'PAYMENT_CAPTURE',
      buyerName: order.shippingAddress?.fullName || 'International Shopper',
      buyerEmail: order.buyerEmail || 'shopper@zen.global',
      buyerCountry: order.shippingAddress?.country || 'IN',
      buyerCurrency: order.buyerCurrency || (order.shippingAddress?.country === 'IN' ? 'INR' : 'USD'),
      buyerPaidAmount: order.totalBuyer || Math.round(gross * 0.58),
      merchantCurrency: curr,
      grossAmount: gross,
      platformFee,
      gatewayFee,
      netAmount: net,
      settlementStatus: isCleared ? 'CLEARED' : 'PENDING_CLEARANCE',
      settlementEstimatedDate: isCleared ? '2026-11-10T12:00:00.000Z' : '2026-11-16T12:00:00.000Z',
      itemsCount: Array.isArray(order.items) ? order.items.reduce((s, i) => s + (i.quantity || 1), 0) : 1,
      items: order.items || [],
      shippingMethod: order.shippingCarrier || 'DHL Express Global Priority',
    };
  });

  // Include 2 additional historical transactions to reflect full volume
  if (baseTransactions.length < 5) {
    const historicalGross = curr === 'JPY' ? 88000 : 750;
    const pf = Number((historicalGross * 0.05).toFixed(2));
    const gf = Number((historicalGross * 0.029 + (curr === 'JPY' ? 40 : 0.35)).toFixed(2));
    baseTransactions.push({
      id: 'TXN-2026-9044-105',
      orderId: 'ORD-2026-8801',
      storeId: store?.id,
      timestamp: '2026-10-28T14:20:00.000Z',
      paymentProvider: 'PayPal Sandbox',
      providerCaptureId: 'CAPTURE-PP-98105',
      status: 'SUCCESS',
      type: 'PAYMENT_CAPTURE',
      buyerName: 'Emily Watson',
      buyerEmail: 'emily.w@zen.global',
      buyerCountry: 'US',
      buyerCurrency: 'USD',
      buyerPaidAmount: 580,
      merchantCurrency: curr,
      grossAmount: historicalGross,
      platformFee: pf,
      gatewayFee: gf,
      netAmount: Number((historicalGross - pf - gf).toFixed(2)),
      settlementStatus: 'CLEARED',
      settlementEstimatedDate: '2026-11-01T14:20:00.000Z',
      itemsCount: 1,
      items: [{ title: 'Kyoto Leather Planner & Brass Pen Set', quantity: 1, unitPrice: historicalGross }],
      shippingMethod: 'FedEx International Priority',
    });
  }

  // Filter by search/status if provided
  let filtered = [...baseTransactions];
  if (filters.status && filters.status !== 'ALL') {
    filtered = filtered.filter((t) => t.status === filters.status);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.orderId.toLowerCase().includes(q) ||
        t.buyerName.toLowerCase().includes(q) ||
        t.buyerEmail.toLowerCase().includes(q)
    );
  }

  const totalVolume = baseTransactions.reduce((s, t) => s + (t.status === 'SUCCESS' ? t.grossAmount : 0), 0);
  const successfulVolume = totalVolume;
  const refundedVolume = baseTransactions
    .filter((t) => t.status === 'REFUNDED')
    .reduce((s, t) => s + t.grossAmount, 0);
  const totalProcessingFees = baseTransactions.reduce((s, t) => s + t.gatewayFee, 0);
  const totalPlatformFees = baseTransactions.reduce((s, t) => s + t.platformFee, 0);
  const netVolume = baseTransactions.reduce((s, t) => s + (t.status === 'SUCCESS' ? t.netAmount : 0), 0);

  return {
    merchantCurrency: curr,
    currency: curr,
    transactions: filtered,
    totalCount: filtered.length,
    summary: {
      totalVolume,
      successfulVolume,
      pendingVolume: 0,
      refundedVolume,
      totalProcessingFees,
      totalPlatformFees,
      netVolume,
      successfulCount: baseTransactions.filter((t) => t.status === 'SUCCESS').length,
      refundedCount: baseTransactions.filter((t) => t.status === 'REFUNDED').length,
    },
  };
}

export function getMockSellerRevenueStatement(storeId, dateRange = 'this_month') {
  const store = getStoreById(storeId);
  const curr = store?.merchantCurrency || 'JPY';
  const orders = getMockSellerOrders(storeId);

  const productGross = orders
    .filter((o) => o.status !== ORDER_LIFECYCLE.CANCELLED)
    .reduce((sum, o) => sum + (o.subtotalMerchant || 0), 0) || (curr === 'JPY' ? 1820000 : 15500);

  const shippingCollected = curr === 'JPY' ? 72000 : 620;
  const totalGross = productGross + shippingCollected;
  const platformFee = Number((totalGross * 0.05).toFixed(2));
  const gatewayFee = Number((totalGross * 0.029 + orders.length * (curr === 'JPY' ? 40 : 0.35)).toFixed(2));
  const totalDeductions = Number((platformFee + gatewayFee).toFixed(2));
  const netRevenue = Number((totalGross - totalDeductions).toFixed(2));

  const previouslyPaid = Math.round(netRevenue * 0.52);
  const inEscrow = Math.round(netRevenue * 0.31);
  const availableNextBatch = netRevenue - previouslyPaid - inEscrow;

  return {
    storeId: store?.id,
    storeName: store?.storeName || 'Merchant Store',
    currency: curr,
    merchantCurrency: curr,
    statementPeriod: dateRange === 'this_year' ? 'Jan 1 – Nov 12, 2026' : 'Oct 14 – Nov 12, 2026',
    grossSales: {
      productSales: productGross,
      shippingCollected,
      totalGross,
    },
    deductions: {
      customerRefunds: 0,
      sellerDiscounts: 0,
      platformCommissionRate: 0.05,
      platformCommission: platformFee,
      paymentProcessingFees: gatewayFee,
      totalDeductions,
    },
    netRevenue: {
      netMerchantRevenue: netRevenue,
      netMarginPercent: Number(((netRevenue / totalGross) * 100).toFixed(1)),
    },
    settlementReconciliation: {
      previouslyPaidOut: previouslyPaid,
      inTransitEscrow: inEscrow,
      availableForNextBatch: availableNextBatch,
      payoutSchedule: 'Weekly Batched Every Tuesday 00:00 UTC (72h post-dispatch hold)',
    },
  };
}

export function getMockSellerSalesAnalytics(storeId, dateRange = '30d') {
  const store = getStoreById(storeId);
  const curr = store?.merchantCurrency || 'JPY';

  const isJpy = curr === 'JPY';
  const mult = isJpy ? 1000 : 10;

  let timeline = [];
  let comparisonTimeline = [];

  if (dateRange === '7d') {
    timeline = [
      { date: 'Nov 06', label: '11/06', grossSales: 160 * mult, netRevenue: 147 * mult, orders: 3, aov: 53.3 * mult },
      { date: 'Nov 07', label: '11/07', grossSales: 240 * mult, netRevenue: 220 * mult, orders: 5, aov: 48 * mult },
      { date: 'Nov 08', label: '11/08', grossSales: 190 * mult, netRevenue: 174 * mult, orders: 4, aov: 47.5 * mult },
      { date: 'Nov 09', label: '11/09', grossSales: 140 * mult, netRevenue: 128 * mult, orders: 3, aov: 46.6 * mult },
      { date: 'Nov 10', label: '11/10', grossSales: 290 * mult, netRevenue: 266 * mult, orders: 6, aov: 48.3 * mult },
      { date: 'Nov 11', label: '11/11', grossSales: 220 * mult, netRevenue: 202 * mult, orders: 4, aov: 55 * mult },
      { date: 'Nov 12', label: '11/12', grossSales: 302 * mult, netRevenue: 278 * mult, orders: 5, aov: 60.4 * mult },
    ];
    comparisonTimeline = [
      { date: 'Oct 30', label: '10/30', grossSales: 140 * mult, netRevenue: 128 * mult, orders: 3 },
      { date: 'Oct 31', label: '10/31', grossSales: 180 * mult, netRevenue: 165 * mult, orders: 4 },
      { date: 'Nov 01', label: '11/01', grossSales: 160 * mult, netRevenue: 147 * mult, orders: 3 },
      { date: 'Nov 02', label: '11/02', grossSales: 120 * mult, netRevenue: 110 * mult, orders: 2 },
      { date: 'Nov 03', label: '11/03', grossSales: 240 * mult, netRevenue: 220 * mult, orders: 5 },
      { date: 'Nov 04', label: '11/04', grossSales: 190 * mult, netRevenue: 174 * mult, orders: 4 },
      { date: 'Nov 05', label: '11/05', grossSales: 250 * mult, netRevenue: 230 * mult, orders: 5 },
    ];
  } else if (dateRange === '90d') {
    timeline = [
      { date: 'W34', label: 'Aug 21', grossSales: 340 * mult, netRevenue: 312 * mult, orders: 7, aov: 48.5 * mult },
      { date: 'W36', label: 'Sep 04', grossSales: 410 * mult, netRevenue: 377 * mult, orders: 9, aov: 45.5 * mult },
      { date: 'W38', label: 'Sep 18', grossSales: 390 * mult, netRevenue: 358 * mult, orders: 8, aov: 48.7 * mult },
      { date: 'W40', label: 'Oct 02', grossSales: 480 * mult, netRevenue: 441 * mult, orders: 10, aov: 48 * mult },
      { date: 'W42', label: 'Oct 16', grossSales: 520 * mult, netRevenue: 478 * mult, orders: 11, aov: 47.2 * mult },
      { date: 'W44', label: 'Oct 30', grossSales: 610 * mult, netRevenue: 561 * mult, orders: 13, aov: 46.9 * mult },
      { date: 'W46', label: 'Nov 12', grossSales: 690 * mult, netRevenue: 634 * mult, orders: 14, aov: 49.2 * mult },
    ];
    comparisonTimeline = [
      { date: 'W20', label: 'May 29', grossSales: 290 * mult, netRevenue: 266 * mult, orders: 6 },
      { date: 'W22', label: 'Jun 12', grossSales: 350 * mult, netRevenue: 322 * mult, orders: 7 },
      { date: 'W24', label: 'Jun 26', grossSales: 320 * mult, netRevenue: 294 * mult, orders: 7 },
      { date: 'W26', label: 'Jul 10', grossSales: 410 * mult, netRevenue: 377 * mult, orders: 9 },
      { date: 'W28', label: 'Jul 24', grossSales: 440 * mult, netRevenue: 404 * mult, orders: 9 },
      { date: 'W30', label: 'Aug 07', grossSales: 510 * mult, netRevenue: 469 * mult, orders: 11 },
      { date: 'W32', label: 'Aug 21', grossSales: 580 * mult, netRevenue: 533 * mult, orders: 12 },
    ];
  } else if (dateRange === '12m' || dateRange === 'this_year') {
    timeline = [
      { date: 'Jan', label: 'Jan', grossSales: 890 * mult, netRevenue: 818 * mult, orders: 19, aov: 46.8 * mult },
      { date: 'Feb', label: 'Feb', grossSales: 940 * mult, netRevenue: 864 * mult, orders: 20, aov: 47 * mult },
      { date: 'Mar', label: 'Mar', grossSales: 1120 * mult, netRevenue: 1030 * mult, orders: 23, aov: 48.6 * mult },
      { date: 'Apr', label: 'Apr', grossSales: 1050 * mult, netRevenue: 966 * mult, orders: 22, aov: 47.7 * mult },
      { date: 'May', label: 'May', grossSales: 1240 * mult, netRevenue: 1140 * mult, orders: 26, aov: 47.6 * mult },
      { date: 'Jun', label: 'Jun', grossSales: 1390 * mult, netRevenue: 1278 * mult, orders: 29, aov: 47.9 * mult },
      { date: 'Jul', label: 'Jul', grossSales: 1480 * mult, netRevenue: 1361 * mult, orders: 31, aov: 47.7 * mult },
      { date: 'Aug', label: 'Aug', grossSales: 1560 * mult, netRevenue: 1435 * mult, orders: 32, aov: 48.7 * mult },
      { date: 'Sep', label: 'Sep', grossSales: 1680 * mult, netRevenue: 1545 * mult, orders: 35, aov: 48 * mult },
      { date: 'Oct', label: 'Oct', grossSales: 1820 * mult, netRevenue: 1674 * mult, orders: 38, aov: 47.8 * mult },
      { date: 'Nov', label: 'Nov', grossSales: 1892 * mult, netRevenue: 1740 * mult, orders: 39, aov: 48.5 * mult },
    ];
    comparisonTimeline = [
      { date: 'Jan', label: 'Jan', grossSales: 720 * mult, netRevenue: 662 * mult, orders: 15 },
      { date: 'Feb', label: 'Feb', grossSales: 780 * mult, netRevenue: 717 * mult, orders: 16 },
      { date: 'Mar', label: 'Mar', grossSales: 910 * mult, netRevenue: 837 * mult, orders: 19 },
      { date: 'Apr', label: 'Apr', grossSales: 890 * mult, netRevenue: 818 * mult, orders: 18 },
      { date: 'May', label: 'May', grossSales: 1020 * mult, netRevenue: 938 * mult, orders: 21 },
      { date: 'Jun', label: 'Jun', grossSales: 1150 * mult, netRevenue: 1058 * mult, orders: 24 },
      { date: 'Jul', label: 'Jul', grossSales: 1210 * mult, netRevenue: 1113 * mult, orders: 25 },
      { date: 'Aug', label: 'Aug', grossSales: 1290 * mult, netRevenue: 1186 * mult, orders: 27 },
      { date: 'Sep', label: 'Sep', grossSales: 1380 * mult, netRevenue: 1269 * mult, orders: 29 },
      { date: 'Oct', label: 'Oct', grossSales: 1520 * mult, netRevenue: 1398 * mult, orders: 32 },
      { date: 'Nov', label: 'Nov', grossSales: 1580 * mult, netRevenue: 1453 * mult, orders: 33 },
    ];
  } else {
    // Default 30d window
    timeline = [
      { date: 'Oct 14', label: '10/14', grossSales: 85 * mult, netRevenue: 78 * mult, orders: 2, aov: 42.5 * mult },
      { date: 'Oct 17', label: '10/17', grossSales: 120 * mult, netRevenue: 110 * mult, orders: 3, aov: 40 * mult },
      { date: 'Oct 20', label: '10/20', grossSales: 65 * mult, netRevenue: 60 * mult, orders: 1, aov: 65 * mult },
      { date: 'Oct 23', label: '10/23', grossSales: 160 * mult, netRevenue: 147 * mult, orders: 4, aov: 40 * mult },
      { date: 'Oct 26', label: '10/26', grossSales: 95 * mult, netRevenue: 87 * mult, orders: 2, aov: 47.5 * mult },
      { date: 'Oct 29', label: '10/29', grossSales: 210 * mult, netRevenue: 193 * mult, orders: 5, aov: 42 * mult },
      { date: 'Nov 01', label: '11/01', grossSales: 145 * mult, netRevenue: 133 * mult, orders: 3, aov: 48.3 * mult },
      { date: 'Nov 04', label: '11/04', grossSales: 180 * mult, netRevenue: 165 * mult, orders: 4, aov: 45 * mult },
      { date: 'Nov 07', label: '11/07', grossSales: 240 * mult, netRevenue: 220 * mult, orders: 5, aov: 48 * mult },
      { date: 'Nov 10', label: '11/10', grossSales: 290 * mult, netRevenue: 266 * mult, orders: 6, aov: 48.3 * mult },
      { date: 'Nov 12', label: '11/12', grossSales: 302 * mult, netRevenue: 278 * mult, orders: 5, aov: 60.4 * mult },
    ];
    comparisonTimeline = [
      { date: 'Sep 14', label: '09/14', grossSales: 70 * mult, netRevenue: 64 * mult, orders: 2 },
      { date: 'Sep 17', label: '09/17', grossSales: 95 * mult, netRevenue: 87 * mult, orders: 2 },
      { date: 'Sep 20', label: '09/20', grossSales: 55 * mult, netRevenue: 50 * mult, orders: 1 },
      { date: 'Sep 23', label: '09/23', grossSales: 130 * mult, netRevenue: 119 * mult, orders: 3 },
      { date: 'Sep 26', label: '09/26', grossSales: 80 * mult, netRevenue: 73 * mult, orders: 2 },
      { date: 'Sep 29', label: '09/29', grossSales: 175 * mult, netRevenue: 161 * mult, orders: 4 },
      { date: 'Oct 01', label: '10/01', grossSales: 125 * mult, netRevenue: 115 * mult, orders: 3 },
      { date: 'Oct 04', label: '10/04', grossSales: 155 * mult, netRevenue: 142 * mult, orders: 3 },
      { date: 'Oct 07', label: '10/07', grossSales: 200 * mult, netRevenue: 184 * mult, orders: 4 },
      { date: 'Oct 10', label: '10/10', grossSales: 245 * mult, netRevenue: 225 * mult, orders: 5 },
      { date: 'Oct 12', label: '10/12', grossSales: 260 * mult, netRevenue: 239 * mult, orders: 5 },
    ];
  }

  const totalGross = timeline.reduce((s, p) => s + p.grossSales, 0);
  const totalNet = timeline.reduce((s, p) => s + p.netRevenue, 0);
  const totalOrders = timeline.reduce((s, p) => s + p.orders, 0);

  const prevGross = comparisonTimeline.reduce((s, p) => s + p.grossSales, 0);
  const prevNet = comparisonTimeline.reduce((s, p) => s + p.netRevenue, 0);
  const prevOrders = comparisonTimeline.reduce((s, p) => s + p.orders, 0);

  const grossSalesDeltaPct = prevGross > 0 ? Number((((totalGross - prevGross) / prevGross) * 100).toFixed(1)) : 14.8;
  const netRevenueDeltaPct = prevNet > 0 ? Number((((totalNet - prevNet) / prevNet) * 100).toFixed(1)) : 15.2;
  const orderVolumeDeltaPct = prevOrders > 0 ? Number((((totalOrders - prevOrders) / prevOrders) * 100).toFixed(1)) : 8.6;
  const currentAov = totalOrders > 0 ? Math.round(totalGross / totalOrders) : 0;
  const prevAov = prevOrders > 0 ? Math.round(prevGross / prevOrders) : currentAov;
  const aovDeltaPct = prevAov > 0 ? Number((((currentAov - prevAov) / prevAov) * 100).toFixed(1)) : 5.7;

  const categoryBreakdown = [
    { category: 'Optics & Cameras', revenue: Math.round(totalGross * 0.48), sharePct: 48.0, itemsSold: 16 },
    { category: 'Electronics & Audio', revenue: Math.round(totalGross * 0.28), sharePct: 28.0, itemsSold: 12 },
    { category: 'Craft & Stationery', revenue: Math.round(totalGross * 0.16), sharePct: 16.0, itemsSold: 8 },
    { category: 'Home & Tea', revenue: Math.round(totalGross * 0.08), sharePct: 8.0, itemsSold: 4 },
  ];

  const topProducts = [
    {
      id: 'prod-tokyo-optics-1',
      title: 'Fujifilm X-T5 Mirrorless Camera Kit',
      category: 'Optics & Cameras',
      imageUrl: '/images/products/running-shoes.jpg',
      unitsSold: 12,
      grossRevenue: Math.round(totalGross * 0.44),
      sharePct: 44.0,
      stockRemaining: 8,
      status: 'IN_STOCK',
    },
    {
      id: 'prod-tokyo-optics-2',
      title: 'Sony FE 24-70mm f/2.8 GM II Lens',
      category: 'Optics & Cameras',
      imageUrl: '/images/products/espresso-machine.jpg',
      unitsSold: 9,
      grossRevenue: Math.round(totalGross * 0.26),
      sharePct: 26.0,
      stockRemaining: 3,
      status: 'LOW_STOCK',
    },
    {
      id: 'prod-tokyo-audio-1',
      title: 'Audio-Technica ATH-M50xBT2 Wireless',
      category: 'Electronics & Audio',
      imageUrl: '/images/products/desktop-synth.jpg',
      unitsSold: 14,
      grossRevenue: Math.round(totalGross * 0.18),
      sharePct: 18.0,
      stockRemaining: 18,
      status: 'IN_STOCK',
    },
    {
      id: 'prod-tokyo-craft-1',
      title: 'Kyoto Leather Planner & Brass Pen Set',
      category: 'Craft & Stationery',
      imageUrl: '/images/products/office-stationery.jpg',
      unitsSold: 11,
      grossRevenue: Math.round(totalGross * 0.12),
      sharePct: 12.0,
      stockRemaining: 2,
      status: 'LOW_STOCK',
    },
    {
      id: 'prod-tokyo-tea-1',
      title: 'Uji Ceremonial Matcha & Chasen Whisk',
      category: 'Home & Tea',
      imageUrl: '/images/products/ceremonial-matcha.jpg',
      unitsSold: 7,
      grossRevenue: Math.round(totalGross * 0.06),
      sharePct: 6.0,
      stockRemaining: 15,
      status: 'IN_STOCK',
    },
  ];

  return {
    storeId,
    currency: curr,
    merchantCurrency: curr,
    dateRange,
    summary: {
      grossSales: totalGross,
      netRevenue: totalNet,
      totalOrders,
      averageOrderValue: currentAov,
      periodGrowthGrossPct: grossSalesDeltaPct,
      periodGrowthNetPct: netRevenueDeltaPct,
      periodGrowthOrdersPct: orderVolumeDeltaPct,
      periodGrowthAovPct: aovDeltaPct,
    },
    timeline,
    comparisonTimeline,
    categoryBreakdown,
    topProducts,
  };
}

export function getMockSellerCustomerCorridors(storeId) {
  const store = getStoreById(storeId);
  const curr = store?.merchantCurrency || 'JPY';
  const isJpy = curr === 'JPY';
  const mult = isJpy ? 1000 : 10;

  return {
    originCountry: store?.shippingOrigin || 'JP',
    originLocation: store?.dispatchLocation || 'Tokyo Narita Airfreight Hub, Japan',
    currency: curr,
    merchantCurrency: curr,
    corridors: [
      {
        destinationCountry: 'IN',
        destinationName: 'India',
        flag: '🇮🇳',
        corridorCode: `${store?.shippingOrigin || 'JP'} → IN`,
        orderCount: 18,
        grossRevenue: 850 * mult,
        sharePct: 44.9,
        avgOrderValue: Math.round((850 * mult) / 18),
        primaryCarrier: 'DHL Express Global Priority',
        avgTransitDays: 3.8,
        customsClearanceRate: '99.4%',
        repeatCustomerPct: '28%',
      },
      {
        destinationCountry: 'US',
        destinationName: 'United States',
        flag: '🇺🇸',
        corridorCode: `${store?.shippingOrigin || 'JP'} → US`,
        orderCount: 12,
        grossRevenue: 590 * mult,
        sharePct: 31.2,
        avgOrderValue: Math.round((590 * mult) / 12),
        primaryCarrier: 'FedEx International Priority',
        avgTransitDays: 3.2,
        customsClearanceRate: '100%',
        repeatCustomerPct: '33%',
      },
      {
        destinationCountry: 'DE',
        destinationName: 'Germany',
        flag: '🇩🇪',
        corridorCode: `${store?.shippingOrigin || 'JP'} → DE`,
        orderCount: 5,
        grossRevenue: 270 * mult,
        sharePct: 14.3,
        avgOrderValue: Math.round((270 * mult) / 5),
        primaryCarrier: 'DHL Express Global Priority',
        avgTransitDays: 4.5,
        customsClearanceRate: '98.8%',
        repeatCustomerPct: '20%',
      },
      {
        destinationCountry: 'GB',
        destinationName: 'United Kingdom',
        flag: '🇬🇧',
        corridorCode: `${store?.shippingOrigin || 'JP'} → GB`,
        orderCount: 3,
        grossRevenue: 182 * mult,
        sharePct: 9.6,
        avgOrderValue: Math.round((182 * mult) / 3),
        primaryCarrier: 'DHL Express Global Priority',
        avgTransitDays: 4.1,
        customsClearanceRate: '99.1%',
        repeatCustomerPct: '22%',
      },
    ],
  };
}

export function exportSellerReportCsv(reportType, data, filename = 'seller_report.csv') {
  let csvContent = '';

  if (reportType === 'transactions') {
    const headers = ['Transaction ID', 'Order ID', 'Date', 'Status', 'Customer', 'Customer Country', 'Merchant Currency', 'Gross Amount', 'Platform Fee (5%)', 'Gateway Fee', 'Net Amount', 'Settlement Status'];
    const rows = (data?.transactions || []).map((t) => [
      t.id,
      t.orderId,
      t.timestamp,
      t.status,
      `"${t.buyerName.replace(/"/g, '""')}"`,
      t.buyerCountry,
      t.merchantCurrency,
      t.grossAmount,
      t.platformFee,
      t.gatewayFee,
      t.netAmount,
      t.settlementStatus,
    ]);
    csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  } else if (reportType === 'sales') {
    const headers = ['Date', 'Gross Sales', 'Net Revenue', 'Orders', 'AOV', 'Currency'];
    const rows = (data?.timeline || []).map((t) => [
      t.date,
      t.grossSales,
      t.netRevenue,
      t.orders,
      t.aov,
      data?.currency || 'JPY',
    ]);
    csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  } else {
    // Default key-value summary
    csvContent = Object.entries(data || {})
      .map(([k, v]) => `"${k}","${typeof v === 'object' ? JSON.stringify(v).replace(/"/g, '""') : v}"`)
      .join('\n');
  }

  // Trigger client browser download
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return csvContent;
}

export function getMockSellerSettlements(storeId) {
  const store = getStoreById(storeId);
  const curr = store?.merchantCurrency || 'JPY';
  const isJpy = curr === 'JPY';
  const grossSales = isJpy ? 1892000 : 16200;
  const platformFee = Math.round(grossSales * 0.05);
  const netSettlement = grossSales - platformFee;
  const transferred = Math.round(netSettlement * 0.52);
  const pending = netSettlement - transferred;

  return {
    merchantCurrency: curr,
    currency: curr,
    grossSales,
    platformFeePercent: 0.05,
    platformFee,
    platformFeeDeduction: platformFee,
    refunds: 0,
    netSettlement,
    netSettlementBalance: pending,
    completedPayoutsTotal: transferred,
    pendingClearanceTotal: pending,
    payoutStatus: store?.verificationStatus === SELLER_STATUSES.APPROVED ? 'AWAITING_DISPATCH_CLEARANCE' : 'UNAVAILABLE_UNVERIFIED',
    settlementPolicyNotice:
      'PayPal buyer payments are captured on order placement. Merchant payout settlement is finalized 72 hours post-dispatch tracking confirmation.',
    settlementHistory: [
      {
        id: 'SETTL-8821',
        period: 'Nov 1 – Nov 7, 2026',
        amount: transferred,
        currency: curr,
        status: 'PAID',
        payoutMethod: 'PayPal Merchant Payout (Direct Deposit)',
        payoutReference: 'PP-PAYOUT-9021-BATCH',
        transferredAt: '2026-11-08T10:00:00.000Z',
        ordersIncluded: 11,
      },
      {
        id: 'SETTL-8822',
        period: 'Nov 8 – Nov 14, 2026',
        amount: pending,
        currency: curr,
        status: 'PROCESSING',
        payoutMethod: 'PayPal Merchant Payout (Direct Deposit)',
        payoutReference: 'PP-PAYOUT-9022-SCHEDULED',
        transferredAt: null,
        estimatedClearance: '2026-11-15T00:00:00.000Z',
        ordersIncluded: 7,
      },
    ],
  };
}
