import { formatCurrency, isValidMonetaryAmount } from './currencyFormatter';

export function formatPrice(amount, currency = 'INR', fallback = 'Price unavailable') {
  if (!isValidMonetaryAmount(amount)) {
    return fallback;
  }
  return formatCurrency(amount, currency);
}

export function formatExchangeRate(rate, fromCurrency, toCurrency) {
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
    return 'Exchange rate unavailable';
  }
  if (!fromCurrency || !toCurrency) {
    return `${rate.toFixed(4)}`;
  }
  const precision = rate >= 10 ? 2 : 4;
  return `1 ${fromCurrency.toUpperCase()} = ${rate.toFixed(precision)} ${toCurrency.toUpperCase()}`;
}
