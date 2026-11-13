/**
 * Mock Exchange Rates (Isolated Frontend Mock Layer)
 * Used ONLY when VITE_USE_MOCK_API is enabled for independent frontend development.
 * All rates are clearly tagged with `source: 'mock'`.
 */

export const MOCK_RATES_TO_USD = {
  USD: 1,
  INR: 84.5,
  EUR: 0.92,
  GBP: 0.78,
  JPY: 153.2,
  KRW: 1385.0,
  SGD: 1.34,
  AED: 3.6725,
  CAD: 1.39,
  AUD: 1.52,
};

export function getMockExchangeRate(fromCurrency = 'USD', toCurrency = 'INR') {
  const from = String(fromCurrency || 'USD').toUpperCase();
  const to = String(toCurrency || 'INR').toUpperCase();

  const fromPerUsd = MOCK_RATES_TO_USD[from];
  const toPerUsd = MOCK_RATES_TO_USD[to];

  if (!fromPerUsd || !toPerUsd) {
    return null;
  }

  const rate = toPerUsd / fromPerUsd;

  return {
    fromCurrency: from,
    toCurrency: to,
    rate: Number(rate.toFixed(6)),
    timestamp: new Date().toISOString(),
    provider: 'Zen Mock FX Feed',
    source: 'mock',
  };
}

export function convertMockAmount(amount, fromCurrency = 'USD', toCurrency = 'INR') {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
    return null;
  }

  const fx = getMockExchangeRate(fromCurrency, toCurrency);
  if (!fx) return null;

  return {
    originalAmount: Number(amount.toFixed(2)),
    convertedAmount: Number((amount * fx.rate).toFixed(2)),
    ...fx,
  };
}
