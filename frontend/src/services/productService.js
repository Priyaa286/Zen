import {
  apiClient,
  API_ENDPOINTS,
  isMockApiEnabled,
  normalizeApiError,
  simulateMockLatency,
} from './api';
import { normalizeProduct } from './adapters';
import { MOCK_PRODUCTS, calculateMockCheckout } from '@/mocks';
import { getAllCategories, getCategoryBySlug } from '@/data/categories';

function enrichMockProduct(raw, destinationCountry, targetCurrency) {
  const calc = calculateMockCheckout({
    product: raw,
    quantity: 1,
    destinationCountry,
    targetCurrency,
  });

  if (!calc || !calc.shippingAvailable) {
    return normalizeProduct(
      {
        ...raw,
        convertedPrice: null,
        targetCurrency,
        shippingCost: null,
        totalLandedCost: null,
        deliveryEstimate: raw.availability === 'out_of_stock' ? 'Out of stock' : 'Unavailable',
        shippingAvailable: false,
        unavailableReason: calc?.unavailableReason || 'Shipping unavailable',
      },
      'mock'
    );
  }

  return normalizeProduct(
    {
      ...raw,
      convertedPrice: calc.breakdown.productPrice,
      targetCurrency,
      exchangeRate: calc.exchangeRate,
      exchangeRateTimestamp: calc.exchangeRateTimestamp,
      shippingCost: calc.breakdown.shippingCharges,
      estimatedDutiesAndTaxes: Number(
        (calc.breakdown.estimatedDuties + calc.breakdown.estimatedTaxes).toFixed(2)
      ),
      totalLandedCost: calc.breakdown.totalPayable,
      deliveryEstimate: calc.shippingOption?.etaLabel,
      shippingAvailable: true,
      checkoutPreview: calc,
    },
    'mock'
  );
}

function matchesProductCategory(product, categoryFilter) {
  if (!categoryFilter || categoryFilter === 'ALL') return true;
  const normalizedFilter = String(categoryFilter).trim().toLowerCase();
  const catMeta = getCategoryBySlug(normalizedFilter);

  if (product.categorySlug && product.categorySlug.toLowerCase() === normalizedFilter) {
    return true;
  }
  const prodCategory = String(product.category || '').toLowerCase();
  if (catMeta) {
    if (prodCategory === catMeta.name.toLowerCase() || prodCategory === catMeta.shortName.toLowerCase()) {
      return true;
    }
    if (catMeta.slug === 'electronics') {
      return ['audio', 'peripherals', 'gaming', 'e-readers', 'accessories', 'cameras', 'laptops'].includes(prodCategory);
    }
    if (catMeta.slug === 'beauty-personal-care' && prodCategory === 'lifestyle') {
      return true;
    }
  }
  return prodCategory === normalizedFilter;
}

/**
 * Search international products across merchants.
 * Endpoint: POST /api/products/search
 */
export async function searchProducts({
  query = '',
  destinationCountry = 'IN',
  preferredCurrency = 'INR',
  originCountry = 'ALL',
  category = 'ALL',
  subcategory = 'ALL',
  availability = 'ALL',
  minBudget = null,
  maxBudget = null,
  sortBy = 'relevance',
} = {}) {
  if (isMockApiEnabled()) {
    await simulateMockLatency(260);
    const trimmed = String(query || '').trim().toLowerCase();

    let list = MOCK_PRODUCTS.map((p) =>
      enrichMockProduct(p, destinationCountry, preferredCurrency)
    );

    if (category && category !== 'ALL') {
      list = list.filter((p) => matchesProductCategory(p, category));
    }

    if (subcategory && subcategory !== 'ALL') {
      const subLower = String(subcategory).toLowerCase();
      list = list.filter((p) => String(p.subcategory || '').toLowerCase() === subLower);
    }

    if (trimmed) {
      const terms = trimmed.split(/\s+/).filter(Boolean);
      list = list.filter((p) => {
        const hay = `${p.title} ${p.brand || ''} ${p.category || ''} ${p.subcategory || ''} ${p.merchant?.name || ''} ${p.merchant?.country || ''} ${p.tags.join(' ')}`.toLowerCase();
        return terms.every((t) => hay.includes(t)) || terms.some((t) => hay.includes(t));
      });
    }

    if (originCountry && originCountry !== 'ALL') {
      list = list.filter((p) => p.merchant?.country === originCountry.toUpperCase());
    }

    if (availability === 'IN_STOCK') {
      list = list.filter((p) => p.availability === 'in_stock' || p.availability === 'limited_stock');
    }

    if (typeof minBudget === 'number' && Number.isFinite(minBudget) && minBudget > 0) {
      list = list.filter((p) => p.totalLandedCost !== null && p.totalLandedCost >= minBudget);
    }

    if (typeof maxBudget === 'number' && Number.isFinite(maxBudget) && maxBudget > 0) {
      list = list.filter((p) => p.totalLandedCost !== null && p.totalLandedCost <= maxBudget);
    }

    if (sortBy === 'price_asc') {
      list.sort((a, b) => (a.convertedPrice ?? Infinity) - (b.convertedPrice ?? Infinity));
    } else if (sortBy === 'landed_asc') {
      list.sort((a, b) => (a.totalLandedCost ?? Infinity) - (b.totalLandedCost ?? Infinity));
    } else if (sortBy === 'rating_desc') {
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortBy === 'fastest') {
      list.sort(
        (a, b) =>
          (a.estimatedDeliveryDays?.min ?? 99) - (b.estimatedDeliveryDays?.min ?? 99)
      );
    }

    return {
      products: list,
      total: list.length,
      currency: preferredCurrency,
      destinationCountry,
      source: 'mock',
    };
  }

  try {
    const payload = {
      query,
      destination_country: destinationCountry,
      preferred_currency: preferredCurrency,
      origin_country: originCountry === 'ALL' ? null : originCountry,
      category: category === 'ALL' ? null : category,
      subcategory: subcategory === 'ALL' ? null : subcategory,
      in_stock_only: availability === 'IN_STOCK',
      min_budget: minBudget || null,
      max_budget: maxBudget || null,
      sort_by: sortBy,
    };
    const { data } = await apiClient.post(API_ENDPOINTS.PRODUCTS_SEARCH, payload);
    const items = Array.isArray(data?.products)
      ? data.products
      : Array.isArray(data)
      ? data
      : [];

    return {
      products: items.map((p) => normalizeProduct(p, 'live')).filter(Boolean),
      total: data?.total ?? items.length,
      currency: data?.currency ?? preferredCurrency,
      destinationCountry: data?.destination_country ?? destinationCountry,
      source: 'live',
    };
  } catch (err) {
    throw normalizeApiError(err, 'Failed to search international products.');
  }
}

/**
 * Instant search suggestions (Mock mode local index or Live backend search subset).
 */
export async function getSearchSuggestions({
  query = '',
  destinationCountry = 'IN',
  preferredCurrency = 'INR',
} = {}) {
  const trimmed = String(query || '').trim().toLowerCase();
  const categories = getAllCategories().filter(
    (c) =>
      !trimmed ||
      c.name.toLowerCase().includes(trimmed) ||
      c.keywords.some((k) => k.includes(trimmed))
  );

  if (!trimmed) {
    return {
      categories: categories.slice(0, 6),
      products: [],
    };
  }

  if (isMockApiEnabled()) {
    const res = await searchProducts({
      query: trimmed,
      destinationCountry,
      preferredCurrency,
      sortBy: 'rating_desc',
    });
    return {
      categories: categories.slice(0, 4),
      products: (res.products || []).slice(0, 5),
    };
  }

  try {
    const res = await searchProducts({
      query: trimmed,
      destinationCountry,
      preferredCurrency,
      sortBy: 'relevance',
    });
    return {
      categories: categories.slice(0, 4),
      products: (res.products || []).slice(0, 5),
    };
  } catch {
    return {
      categories: categories.slice(0, 4),
      products: [],
    };
  }
}

/**
 * Fetch detailed product data by ID.
 * Endpoint: GET /api/products/{id}
 */
export async function getProductById(
  id,
  { destinationCountry = 'IN', preferredCurrency = 'INR' } = {}
) {
  if (!id) {
    throw normalizeApiError(new Error('Product ID is required.'));
  }

  if (isMockApiEnabled()) {
    await simulateMockLatency(240);
    const found = MOCK_PRODUCTS.find((p) => p.id === id);
    if (!found) {
      throw normalizeApiError({ message: 'Product could not be found.' }, 'Product not found.');
    }
    return enrichMockProduct(found, destinationCountry, preferredCurrency);
  }

  try {
    const { data } = await apiClient.get(API_ENDPOINTS.PRODUCT_DETAIL(id), {
      params: {
        destination_country: destinationCountry,
        preferred_currency: preferredCurrency,
      },
    });
    const raw = data?.product ?? data;
    return normalizeProduct(raw, 'live');
  } catch (err) {
    throw normalizeApiError(err, 'Unable to load product details.');
  }
}
