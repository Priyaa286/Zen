import {
  apiClient,
  API_ENDPOINTS,
  isMockApiEnabled,
  normalizeApiError,
  simulateMockLatency,
} from './api';
import { normalizeShippingOption } from './adapters';
import { MOCK_PRODUCTS, getMockShippingOptions } from '@/mocks';

/**
 * Check international shipping eligibility, carriers, rates, and ETA.
 * Endpoint: POST /api/shipping/check
 */
export async function checkShipping({
  productId,
  originCountry,
  destinationCountry = 'IN',
  targetCurrency = 'INR',
  quantity = 1,
}) {
  if (isMockApiEnabled()) {
    await simulateMockLatency(220);
    const product = MOCK_PRODUCTS.find((p) => p.id === productId) || null;
    return getMockShippingOptions({
      product,
      originCountry,
      destinationCountry,
      targetCurrency,
      quantity,
    });
  }

  try {
    const { data } = await apiClient.post(API_ENDPOINTS.SHIPPING_CHECK, {
      product_id: productId,
      origin_country: originCountry,
      destination_country: destinationCountry,
      target_currency: targetCurrency,
      quantity,
    });

    const rawOptions = Array.isArray(data?.options) ? data.options : [];
    const options = rawOptions.map(normalizeShippingOption).filter(Boolean);
    const defaultOpt = normalizeShippingOption(data?.default_option ?? data?.defaultOption) ?? options[0] ?? null;

    return {
      available: Boolean(data?.available ?? options.length > 0),
      reason: data?.reason ?? null,
      originCountry: (data?.origin_country ?? data?.originCountry ?? originCountry)?.toUpperCase(),
      destinationCountry: (data?.destination_country ?? data?.destinationCountry ?? destinationCountry)?.toUpperCase(),
      options,
      defaultOption: defaultOpt,
      source: 'live',
    };
  } catch (err) {
    throw normalizeApiError(err, 'Unable to verify international shipping availability.');
  }
}
