const CURRENCY_LOCALES = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
  KRW: 'ko-KR',
  SGD: 'en-SG',
  AED: 'en-AE',
  CAD: 'en-CA',
  AUD: 'en-AU',
};

const ZERO_DECIMAL_CURRENCIES = new Set(['JPY', 'KRW']);

export const SUPPORTED_CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

export const SUPPORTED_COUNTRIES = [
  { code: 'IN', name: 'India', defaultCurrency: 'INR', flag: '🇮🇳' },
  { code: 'US', name: 'United States', defaultCurrency: 'USD', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', defaultCurrency: 'GBP', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', defaultCurrency: 'EUR', flag: '🇩🇪' },
  { code: 'SG', name: 'Singapore', defaultCurrency: 'SGD', flag: '🇸🇬' },
  { code: 'KR', name: 'South Korea', defaultCurrency: 'KRW', flag: '🇰🇷' },
  { code: 'AE', name: 'United Arab Emirates', defaultCurrency: 'AED', flag: '🇦🇪' },
  { code: 'JP', name: 'Japan', defaultCurrency: 'JPY', flag: '🇯🇵' },
  { code: 'CA', name: 'Canada', defaultCurrency: 'CAD', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', defaultCurrency: 'AUD', flag: '🇦🇺' },
];

export function isValidCurrencyCode(currency) {
  if (!currency || typeof currency !== 'string') return false;
  return /^[A-Z]{3}$/.test(currency.trim().toUpperCase());
}

export function isSupportedCurrencyCode(currency) {
  if (!currency || typeof currency !== 'string') return false;
  const normalized = currency.trim().toUpperCase();
  return SUPPORTED_CURRENCIES.some((c) => c.code === normalized);
}

export function isSupportedCountryCode(countryCode) {
  if (!countryCode || typeof countryCode !== 'string') return false;
  const normalized = countryCode.trim().toUpperCase();
  return SUPPORTED_COUNTRIES.some((c) => c.code === normalized);
}

export function getCurrencyMeta(currencyCode) {
  const normalized = String(currencyCode || 'USD').trim().toUpperCase();
  return (
    SUPPORTED_CURRENCIES.find((c) => c.code === normalized) || {
      code: normalized,
      symbol: normalized,
      name: normalized,
    }
  );
}

export function getCountryDefaultCurrency(countryCode) {
  const match = SUPPORTED_COUNTRIES.find(
    (c) => c.code.toUpperCase() === String(countryCode || '').trim().toUpperCase()
  );
  return match?.defaultCurrency || 'USD';
}

export function isValidMonetaryAmount(amount) {
  return typeof amount === 'number' && Number.isFinite(amount) && amount >= 0;
}

export function formatCurrency(amount, currency = 'INR', options = {}) {
  if (!isValidMonetaryAmount(amount)) {
    return 'Unavailable';
  }

  const normalizedCurrency = isValidCurrencyCode(currency)
    ? currency.trim().toUpperCase()
    : 'USD';

  const locale = options.locale || CURRENCY_LOCALES[normalizedCurrency] || 'en-US';
  const defaultDecimals = ZERO_DECIMAL_CURRENCIES.has(normalizedCurrency) ? 0 : 2;
  const minimumFractionDigits =
    options.minimumFractionDigits ?? (options.compact ? 0 : defaultDecimals);
  const maximumFractionDigits =
    options.maximumFractionDigits ?? (options.compact ? 0 : defaultDecimals);

  let formatted;
  try {
    formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: normalizedCurrency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount);
  } catch {
    formatted = `${normalizedCurrency} ${amount.toFixed(defaultDecimals)}`;
  }

  if (options.includeCode && !formatted.includes(normalizedCurrency)) {
    return `${formatted} ${normalizedCurrency}`;
  }
  return formatted;
}

/**
 * Always preserves and labels the merchant's original currency (e.g., ¥268,000 JPY).
 */
export function formatOriginalMerchantPrice(amount, originalCurrency = 'USD', options = {}) {
  const code = isValidCurrencyCode(originalCurrency)
    ? originalCurrency.trim().toUpperCase()
    : 'USD';
  return formatCurrency(amount, code, {
    includeCode: true,
    ...options,
  });
}

/**
 * Formats a converted amount explicitly in the buyer's preferred display currency.
 */
export function formatConvertedUserPrice(amount, preferredCurrency = 'INR', options = {}) {
  const code = isValidCurrencyCode(preferredCurrency)
    ? preferredCurrency.trim().toUpperCase()
    : 'INR';
  return formatCurrency(amount, code, {
    includeCode: options.includeCode ?? false,
    ...options,
  });
}

export function formatExchangeRateInfo(rate, fromCurrency, toCurrency, timestamp = null) {
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
    return null;
  }
  const from = String(fromCurrency || 'USD').toUpperCase();
  const to = String(toCurrency || 'INR').toUpperCase();
  const decimals = rate >= 10 ? 2 : 4;
  let timeSuffix = '';
  if (timestamp) {
    const parsed = new Date(timestamp);
    if (!Number.isNaN(parsed.getTime())) {
      timeSuffix = ` · ${parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  }
  return `1 ${from} = ${rate.toFixed(decimals)} ${to}${timeSuffix}`;
}

export function getCountryName(countryCode) {
  if (!countryCode) return 'Unknown';
  const match = SUPPORTED_COUNTRIES.find(
    (c) => c.code.toUpperCase() === countryCode.toUpperCase()
  );
  return match ? match.name : countryCode.toUpperCase();
}

export function getCountryFlag(countryCode) {
  if (!countryCode) return '🌐';
  const match = SUPPORTED_COUNTRIES.find(
    (c) => c.code.toUpperCase() === countryCode.toUpperCase()
  );
  return match ? match.flag : '🌐';
}
