import {
  apiClient,
  API_ENDPOINTS,
  isMockApiEnabled,
  normalizeApiError,
  simulateMockLatency,
} from './api';
import { convertMockAmount, getMockExchangeRate } from '@/mocks';

/**
 * Convert an amount directly from its original merchant currency to a target currency.
 * Always converts from the original merchant amount (never double-converts).
 * Endpoint: POST /api/currency/convert
 */
export async function convertCurrency({ amount, fromCurrency, toCurrency }) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
    throw normalizeApiError(new Error('Invalid monetary amount for currency conversion.'));
  }

  const from = String(fromCurrency || 'USD').toUpperCase();
  const to = String(toCurrency || 'INR').toUpperCase();

  if (from === to) {
    return {
      originalAmount: Number(amount.toFixed(2)),
      convertedAmount: Number(amount.toFixed(2)),
      fromCurrency: from,
      toCurrency: to,
      rate: 1,
      timestamp: new Date().toISOString(),
      provider: isMockApiEnabled() ? 'Zen Mock FX Feed' : 'Identity Rate',
      source: isMockApiEnabled() ? 'mock' : 'live',
    };
  }

  if (isMockApiEnabled()) {
    await simulateMockLatency(180);
    const res = convertMockAmount(amount, from, to);
    if (!res) {
      throw normalizeApiError(new Error(`Unsupported currency pair: ${from} -> ${to}`));
    }
    return res;
  }

  try {
    const { data } = await apiClient.post(API_ENDPOINTS.CURRENCY_CONVERT, {
      amount,
      from_currency: from,
      to_currency: to,
    });
    const convertedAmount = Number(data?.converted_amount ?? data?.convertedAmount);
    const rate = Number(data?.rate ?? data?.exchange_rate);
    if (!Number.isFinite(convertedAmount) || !Number.isFinite(rate) || rate <= 0) {
      throw new Error('Currency conversion service returned invalid numeric values.');
    }
    return {
      originalAmount: Number(data?.original_amount ?? data?.originalAmount ?? amount),
      convertedAmount,
      fromCurrency: (data?.from_currency ?? data?.fromCurrency ?? from).toUpperCase(),
      toCurrency: (data?.to_currency ?? data?.toCurrency ?? to).toUpperCase(),
      rate,
      timestamp: data?.timestamp ?? new Date().toISOString(),
      provider: data?.provider ?? 'Backend FX Service',
      source: 'live',
    };
  } catch (err) {
    throw normalizeApiError(err, 'Currency conversion service is unavailable.');
  }
}

/**
 * Retrieve indicative unit exchange rate between two ISO 4217 currencies.
 * Live mode uses POST /api/currency/convert with amount=1 (never hardcoded rates).
 */
export async function getExchangeRateQuote({ fromCurrency, toCurrency }) {
  const from = String(fromCurrency || 'USD').toUpperCase();
  const to = String(toCurrency || 'INR').toUpperCase();

  if (isMockApiEnabled()) {
    await simulateMockLatency(100);
    return getMockExchangeRate(from, to);
  }

  return convertCurrency({ amount: 1, fromCurrency: from, toCurrency: to });
}
