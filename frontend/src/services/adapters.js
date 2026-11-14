/**
 * Frontend API Response Adapters
 * Normalizes backend responses (supporting snake_case or camelCase) into
 * Zen's documented frontend data model without fabricating missing values.
 */

function toFiniteNumberOrNull(val) {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
}

export function normalizeShippingOption(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const minDays = raw.minDays ?? raw.min_days ?? null;
  const maxDays = raw.maxDays ?? raw.max_days ?? null;

  return {
    id: raw.id ?? raw.option_id ?? 'ship-standard',
    carrier: raw.carrier ?? raw.carrier_name ?? 'International Courier',
    serviceName: raw.serviceName ?? raw.service_name ?? 'Tracked International Shipping',
    costUsd: toFiniteNumberOrNull(raw.costUsd ?? raw.cost_usd),
    costInTargetCurrency: toFiniteNumberOrNull(
      raw.costInTargetCurrency ?? raw.cost_in_target_currency ?? raw.cost
    ),
    currency: (raw.currency ?? raw.target_currency ?? null)?.toUpperCase() || null,
    minDays: toFiniteNumberOrNull(minDays),
    maxDays: toFiniteNumberOrNull(maxDays),
    etaLabel:
      raw.etaLabel ??
      raw.eta_label ??
      raw.estimated_delivery ??
      (minDays && maxDays ? `${minDays}–${maxDays} business days` : null),
    estimatedArrivalWindow:
      raw.estimatedArrivalWindow ?? raw.estimated_arrival_window ?? null,
    customsClearanceIncluded: Boolean(
      raw.customsClearanceIncluded ?? raw.customs_clearance_included ?? true
    ),
  };
}

export function normalizeShippingAddress(raw) {
  if (!raw || typeof raw !== 'object') return null;
  return {
    fullName: raw.fullName ?? raw.full_name ?? '',
    email: raw.email ?? '',
    phone: raw.phone ?? '',
    addressLine1: raw.addressLine1 ?? raw.address_line_1 ?? raw.address ?? '',
    city: raw.city ?? '',
    state: raw.state ?? '',
    postalCode: raw.postalCode ?? raw.postal_code ?? '',
    countryCode: (raw.countryCode ?? raw.country_code ?? '')?.toUpperCase() || '',
  };
}

export function normalizeProduct(raw, source = 'live') {
  if (!raw || typeof raw !== 'object') return null;

  const merchantRaw = raw.merchant && typeof raw.merchant === 'object' ? raw.merchant : {};
  const merchantName = merchantRaw.name ?? raw.merchant_name ?? raw.merchantName ?? 'International Merchant';
  const merchantCountry =
    merchantRaw.country ?? raw.merchant_country ?? raw.merchantCountry ?? raw.origin_country ?? raw.originCountry ?? null;

  const minDays = raw.estimatedDeliveryDays?.min ?? raw.delivery_days_min ?? raw.min_delivery_days ?? null;
  const maxDays = raw.estimatedDeliveryDays?.max ?? raw.delivery_days_max ?? raw.max_delivery_days ?? null;

  const deliveryLabel =
    raw.deliveryEstimate ??
    raw.delivery_estimate ??
    raw.estimated_delivery ??
    (minDays && maxDays ? `${minDays}–${maxDays} business days` : null);

  const imageUrl = raw.imageUrl ?? raw.image_url ?? raw.image ?? (Array.isArray(raw.images) ? raw.images[0] : null) ?? null;

  return {
    id: String(raw.id ?? raw.product_id ?? raw.productId ?? ''),
    title: raw.title ?? raw.name ?? 'Unnamed Product',
    shortTitle: raw.shortTitle ?? raw.short_title ?? raw.title ?? raw.name ?? 'Unnamed Product',
    brand: raw.brand ?? null,
    category: raw.category ?? null,
    categorySlug: raw.categorySlug ?? raw.category_slug ?? null,
    subcategory: raw.subcategory ?? raw.sub_category ?? null,
    variants: Array.isArray(raw.variants) && raw.variants.length > 0 ? raw.variants : null,
    merchant: {
      name: merchantName,
      country: merchantCountry ? String(merchantCountry).toUpperCase() : null,
      verified: Boolean(merchantRaw.verified ?? raw.merchant_verified ?? false),
      rating: toFiniteNumberOrNull(merchantRaw.rating ?? raw.merchant_rating),
      dispatchLocation: merchantRaw.dispatchLocation ?? raw.dispatch_location ?? null,
    },
    originalPrice: toFiniteNumberOrNull(raw.originalPrice ?? raw.original_price ?? raw.price),
    originalCurrency: (raw.originalCurrency ?? raw.original_currency ?? raw.currency ?? null)?.toUpperCase() || null,
    convertedPrice: toFiniteNumberOrNull(raw.convertedPrice ?? raw.converted_price),
    targetCurrency: (raw.targetCurrency ?? raw.target_currency ?? null)?.toUpperCase() || null,
    exchangeRate: toFiniteNumberOrNull(raw.exchangeRate ?? raw.exchange_rate),
    exchangeRateTimestamp:
      raw.exchangeRateTimestamp ?? raw.exchange_rate_timestamp ?? null,
    shippingCost: toFiniteNumberOrNull(raw.shippingCost ?? raw.shipping_cost),
    estimatedDutiesAndTaxes: toFiniteNumberOrNull(
      raw.estimatedDutiesAndTaxes ?? raw.estimated_duties_and_taxes
    ),
    totalLandedCost: toFiniteNumberOrNull(raw.totalLandedCost ?? raw.total_landed_cost),
    deliveryEstimate: deliveryLabel,
    estimatedDeliveryDays:
      minDays !== null || maxDays !== null ? { min: minDays, max: maxDays } : raw.estimatedDeliveryDays ?? null,
    availability: raw.availability ?? raw.stock_status ?? 'unknown',
    stockLabel: raw.stockLabel ?? raw.stock_label ?? null,
    shippingAvailable: raw.shippingAvailable ?? raw.shipping_available ?? raw.availability !== 'out_of_stock',
    unavailableReason: raw.unavailableReason ?? raw.unavailable_reason ?? null,
    rating: toFiniteNumberOrNull(raw.rating),
    reviewCount: toFiniteNumberOrNull(raw.reviewCount ?? raw.review_count),
    weightKg: toFiniteNumberOrNull(raw.weightKg ?? raw.weight_kg),
    imageUrl,
    images: Array.isArray(raw.images) && raw.images.length > 0 ? raw.images : imageUrl ? [imageUrl] : [],
    description: raw.description ?? null,
    highlights: Array.isArray(raw.highlights) ? raw.highlights : [],
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    checkoutPreview: raw.checkoutPreview ?? null,
    source: raw.source ?? source,
  };
}

export function normalizeCheckoutSummary(raw, source = 'live') {
  if (!raw || typeof raw !== 'object') return null;

  const b = raw.breakdown && typeof raw.breakdown === 'object' ? raw.breakdown : raw;

  return {
    checkoutSessionId: raw.checkoutSessionId ?? raw.checkout_session_id ?? raw.session_id ?? null,
    shippingAvailable: raw.shippingAvailable ?? raw.shipping_available ?? true,
    unavailableReason: raw.unavailableReason ?? raw.unavailable_reason ?? null,
    productId: raw.productId ?? raw.product_id ?? null,
    productTitle: raw.productTitle ?? raw.product_title ?? null,
    merchantName: raw.merchantName ?? raw.merchant_name ?? null,
    originCountry: (raw.originCountry ?? raw.origin_country ?? raw.merchantCountry ?? raw.merchant_country ?? 'JP')?.toUpperCase() || 'JP',
    destinationCountry: (raw.destinationCountry ?? raw.destination_country ?? 'IN')?.toUpperCase() || 'IN',
    quantity: toFiniteNumberOrNull(raw.quantity) ?? 1,
    originalCurrency: (raw.originalCurrency ?? raw.original_currency ?? 'JPY')?.toUpperCase() || 'JPY',
    originalUnitPrice: toFiniteNumberOrNull(raw.originalUnitPrice ?? raw.original_unit_price),
    originalSubtotal: toFiniteNumberOrNull(raw.originalSubtotal ?? raw.original_subtotal),
    targetCurrency: (raw.targetCurrency ?? raw.target_currency ?? null)?.toUpperCase() || null,
    exchangeRate: toFiniteNumberOrNull(raw.exchangeRate ?? raw.exchange_rate),
    exchangeRateTimestamp: raw.exchangeRateTimestamp ?? raw.exchange_rate_timestamp ?? null,
    breakdown: {
      productPrice: toFiniteNumberOrNull(b.productPrice ?? b.product_price ?? b.converted_product_price),
      currencyConversionFee: toFiniteNumberOrNull(
        b.currencyConversionFee ?? b.currency_conversion_fee ?? b.conversion_fee
      ),
      shippingCharges: toFiniteNumberOrNull(b.shippingCharges ?? b.shipping_charges ?? b.shipping_cost),
      estimatedDuties: toFiniteNumberOrNull(b.estimatedDuties ?? b.estimated_duties ?? b.import_duties),
      estimatedTaxes: toFiniteNumberOrNull(b.estimatedTaxes ?? b.estimated_taxes ?? b.taxes),
      taxLabel: b.taxLabel ?? b.tax_label ?? 'Estimated Import Taxes',
      otherFees: toFiniteNumberOrNull(b.otherFees ?? b.other_fees ?? b.disclosed_fees),
      otherFeesLabel: b.otherFeesLabel ?? b.other_fees_label ?? 'Disclosed Handling & Customs Fees',
      totalPayable: toFiniteNumberOrNull(b.totalPayable ?? b.total_payable ?? b.total_amount ?? b.final_amount),
      paypalSettlementCurrency:
        (b.paypalSettlementCurrency ?? b.paypal_settlement_currency ?? null)?.toUpperCase() || null,
      paypalSettlementAmount: toFiniteNumberOrNull(
        b.paypalSettlementAmount ?? b.paypal_settlement_amount
      ),
    },
    shippingOption: normalizeShippingOption(raw.shippingOption ?? raw.shipping_option),
    availableShippingOptions: Array.isArray(raw.availableShippingOptions ?? raw.available_shipping_options)
      ? (raw.availableShippingOptions ?? raw.available_shipping_options)
          .map(normalizeShippingOption)
          .filter(Boolean)
      : [],
    warnings: Array.isArray(raw.warnings) ? raw.warnings : [],
    isEstimated: raw.isEstimated ?? raw.is_estimated ?? true,
    source: raw.source ?? source,
  };
}

export function normalizeOrder(raw, source = 'live') {
  if (!raw || typeof raw !== 'object') return null;
  const rawStatusRaw = raw.status ?? raw.payment_status ?? raw.paymentStatus ?? null;
  const rawStatus = rawStatusRaw ? String(rawStatusRaw).toUpperCase() : 'UNKNOWN';

  return {
    orderId: raw.orderId ?? raw.order_id ?? raw.id ?? null,
    paypalOrderId: raw.paypalOrderId ?? raw.paypal_order_id ?? null,
    paypalTransactionId:
      raw.paypalTransactionId ?? raw.paypal_transaction_id ?? raw.capture_id ?? raw.captureId ?? null,
    status: rawStatus,
    statusReason: raw.statusReason ?? raw.status_reason ?? raw.message ?? null,
    product: raw.product ? normalizeProduct(raw.product, source) : null,
    productTitle: raw.productTitle ?? raw.product_title ?? raw.product?.title ?? null,
    merchantName: raw.merchantName ?? raw.merchant_name ?? raw.product?.merchant?.name ?? null,
    quantity: toFiniteNumberOrNull(raw.quantity) ?? 1,
    totalAmount: toFiniteNumberOrNull(raw.totalAmount ?? raw.total_amount ?? raw.amount),
    currency: (raw.currency ?? raw.target_currency ?? 'INR').toUpperCase(),
    settlementAmount: toFiniteNumberOrNull(raw.settlementAmount ?? raw.settlement_amount),
    settlementCurrency: (raw.settlementCurrency ?? raw.settlement_currency ?? null)?.toUpperCase() || null,
    deliveryEstimate: raw.deliveryEstimate ?? raw.delivery_estimate ?? null,
    shippingAddress: normalizeShippingAddress(raw.shippingAddress ?? raw.shipping_address),
    breakdown: raw.breakdown ?? null,
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    isMock: Boolean(raw.isMock ?? raw.source === 'mock'),
    source: raw.source ?? source,
  };
}

export function normalizeUserPreferences(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      residenceCountry: 'IN',
      preferredCurrency: 'INR',
      defaultDeliveryCountry: 'IN',
      showOriginalPriceBadge: true,
      compactCurrencyFormat: false,
    };
  }
  const residence = (
    raw.residenceCountry ??
    raw.residence_country ??
    raw.country ??
    'IN'
  ).toUpperCase();
  const currency = (
    raw.preferredCurrency ??
    raw.preferred_currency ??
    raw.currency ??
    'INR'
  ).toUpperCase();
  const delivery = (
    raw.defaultDeliveryCountry ??
    raw.default_delivery_country ??
    raw.destinationCountry ??
    raw.destination_country ??
    residence
  ).toUpperCase();

  return {
    residenceCountry: residence,
    preferredCurrency: currency,
    defaultDeliveryCountry: delivery,
    showOriginalPriceBadge: Boolean(
      raw.showOriginalPriceBadge ?? raw.show_original_price_badge ?? true
    ),
    compactCurrencyFormat: Boolean(
      raw.compactCurrencyFormat ?? raw.compact_currency_format ?? false
    ),
  };
}

export function normalizeUser(raw, source = 'live') {
  if (!raw || typeof raw !== 'object') return null;
  const prefs = normalizeUserPreferences(raw.preferences ?? raw);

  return {
    id: String(raw.id ?? raw.user_id ?? raw.userId ?? ''),
    fullName: raw.fullName ?? raw.full_name ?? raw.name ?? '',
    email: String(raw.email ?? '').toLowerCase(),
    role: String(raw.role ?? raw.user_role ?? 'BUYER').toUpperCase(),
    storeId: raw.storeId ?? raw.store_id ?? null,
    storeName: raw.storeName ?? raw.store_name ?? null,
    verificationStatus: raw.verificationStatus ?? raw.verification_status ?? (String(raw.role).toUpperCase() === 'SELLER' ? 'PENDING_REVIEW' : null),
    residenceCountry: (raw.residenceCountry ?? raw.residence_country ?? prefs.residenceCountry).toUpperCase(),
    preferredCurrency: (raw.preferredCurrency ?? raw.preferred_currency ?? prefs.preferredCurrency).toUpperCase(),
    defaultDeliveryCountry: (
      raw.defaultDeliveryCountry ??
      raw.default_delivery_country ??
      prefs.defaultDeliveryCountry
    ).toUpperCase(),
    onboardingCompleted: Boolean(
      raw.onboardingCompleted ?? raw.onboarding_completed ?? true
    ),
    savedAddresses: Array.isArray(raw.savedAddresses ?? raw.saved_addresses)
      ? (raw.savedAddresses ?? raw.saved_addresses).map(normalizeShippingAddress).filter(Boolean)
      : [],
    preferences: prefs,
    createdAt: raw.createdAt ?? raw.created_at ?? null,
    isMock: Boolean(raw.isMock ?? source === 'mock'),
    source: raw.source ?? source,
  };
}
