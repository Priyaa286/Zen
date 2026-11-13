import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { convertCurrency, getExchangeRateQuote } from '@/services/currencyService';
import {
  SUPPORTED_COUNTRIES,
  SUPPORTED_CURRENCIES,
  formatConvertedUserPrice,
  formatExchangeRateInfo,
  formatOriginalMerchantPrice,
  getCountryDefaultCurrency,
  getCurrencyMeta,
} from '@/utils/currencyFormatter';

const CurrencyContext = createContext(null);

const PREFS_KEY = 'zen_user_preferences_v1';

function readStoredPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const TIMEZONE_COUNTRY_HINTS = [
  { match: 'Asia/Kolkata', country: 'IN' },
  { match: 'Asia/Calcutta', country: 'IN' },
  { match: 'Asia/Tokyo', country: 'JP' },
  { match: 'Asia/Singapore', country: 'SG' },
  { match: 'Europe/Berlin', country: 'DE' },
  { match: 'Europe/London', country: 'GB' },
  { match: 'America/New_York', country: 'US' },
  { match: 'America/Los_Angeles', country: 'US' },
  { match: 'America/Chicago', country: 'US' },
  { match: 'Asia/Dubai', country: 'AE' },
  { match: 'America/Toronto', country: 'CA' },
  { match: 'Australia/Sydney', country: 'AU' },
];

export function CurrencyProvider({ children }) {
  const stored = readStoredPrefs();
  const defaultCountry = import.meta.env.VITE_DEFAULT_COUNTRY || 'IN';
  const defaultCurrency = import.meta.env.VITE_DEFAULT_CURRENCY || 'INR';

  const [residenceCountry, setResidenceCountryState] = useState(
    (stored.residenceCountry || stored.destinationCountry || defaultCountry).toUpperCase()
  );
  const [deliveryCountry, setDeliveryCountryState] = useState(
    (stored.deliveryCountry || stored.destinationCountry || defaultCountry).toUpperCase()
  );
  const [preferredCurrency, setPreferredCurrencyState] = useState(
    (stored.preferredCurrency || defaultCurrency).toUpperCase()
  );
  const [displayPreferences, setDisplayPreferencesState] = useState(
    stored.displayPreferences || {
      showOriginalPriceBadge: true,
      compactCurrencyFormat: false,
    }
  );
  const [rateCache, setRateCache] = useState({});

  useEffect(() => {
    try {
      localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({
          residenceCountry,
          deliveryCountry,
          destinationCountry: deliveryCountry,
          preferredCurrency,
          displayPreferences,
        })
      );
    } catch {
      // Ignore storage errors
    }
  }, [residenceCountry, deliveryCountry, preferredCurrency, displayPreferences]);

  // Independent setters: never overwrite preferredCurrency silently when country changes
  const setResidenceCountry = useCallback((countryCode) => {
    const normalized = String(countryCode || 'IN').toUpperCase();
    setResidenceCountryState(normalized);
  }, []);

  const setDeliveryCountry = useCallback((countryCode) => {
    const normalized = String(countryCode || 'IN').toUpperCase();
    setDeliveryCountryState(normalized);
  }, []);

  const setPreferredCurrency = useCallback((currencyCode) => {
    const normalized = String(currencyCode || 'INR').toUpperCase();
    setPreferredCurrencyState(normalized);
  }, []);

  const setDisplayPreferences = useCallback((next) => {
    setDisplayPreferencesState((prev) => ({
      ...prev,
      ...(typeof next === 'function' ? next(prev) : next),
    }));
  }, []);

  const applyUserCurrencyPreferences = useCallback((prefs) => {
    if (!prefs || typeof prefs !== 'object') return;
    if (prefs.residenceCountry) {
      setResidenceCountryState(String(prefs.residenceCountry).toUpperCase());
    }
    if (prefs.defaultDeliveryCountry || prefs.deliveryCountry) {
      setDeliveryCountryState(
        String(prefs.defaultDeliveryCountry || prefs.deliveryCountry).toUpperCase()
      );
    }
    if (prefs.preferredCurrency) {
      setPreferredCurrencyState(String(prefs.preferredCurrency).toUpperCase());
    }
    if (
      prefs.showOriginalPriceBadge !== undefined ||
      prefs.compactCurrencyFormat !== undefined
    ) {
      setDisplayPreferencesState((prev) => ({
        ...prev,
        showOriginalPriceBadge:
          prefs.showOriginalPriceBadge ?? prev.showOriginalPriceBadge,
        compactCurrencyFormat:
          prefs.compactCurrencyFormat ?? prev.compactCurrencyFormat,
      }));
    }
  }, []);

  const convertFromOriginal = useCallback(
    async ({ amount, originalCurrency, targetCurrency = preferredCurrency }) => {
      const quote = await convertCurrency({
        amount,
        fromCurrency: originalCurrency,
        toCurrency: targetCurrency,
      });
      const cacheKey = `${quote.fromCurrency}->${quote.toCurrency}`;
      setRateCache((prev) => ({ ...prev, [cacheKey]: quote }));
      return quote;
    },
    [preferredCurrency]
  );

  const fetchRateMetadata = useCallback(
    async (fromCurrency, toCurrency = preferredCurrency) => {
      const quote = await getExchangeRateQuote({ fromCurrency, toCurrency });
      if (quote) {
        const cacheKey = `${quote.fromCurrency}->${quote.toCurrency}`;
        setRateCache((prev) => ({ ...prev, [cacheKey]: quote }));
      }
      return quote;
    },
    [preferredCurrency]
  );

  /**
   * User-initiated optional location suggestion.
   * Requests browser Geolocation permission and falls back to timezone region hint,
   * returning a suggestion ONLY without mutating residence, delivery, or currency.
   */
  const detectCountrySuggestion = useCallback(async () => {
    const inferFromLocale = () => {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        const tzMatch = TIMEZONE_COUNTRY_HINTS.find((h) => h.match === tz);
        if (tzMatch) return tzMatch.country;
        const lang = navigator.language || '';
        const region = lang.split('-')[1]?.toUpperCase();
        if (region && SUPPORTED_COUNTRIES.some((c) => c.code === region)) {
          return region;
        }
      } catch {
        // Ignore intl access errors
      }
      return null;
    };

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 4000,
            maximumAge: 60000,
          });
        });
        const detected = inferFromLocale();
        if (detected) {
          return {
            suggestedCountry: detected,
            suggestedCurrency: getCountryDefaultCurrency(detected),
            permissionGranted: true,
          };
        }
      } catch {
        // Permission denied or unavailable; do not force anything
        return {
          suggestedCountry: null,
          suggestedCurrency: null,
          permissionGranted: false,
        };
      }
    }

    const hint = inferFromLocale();
    return {
      suggestedCountry: hint,
      suggestedCurrency: hint ? getCountryDefaultCurrency(hint) : null,
      permissionGranted: false,
    };
  }, []);

  const formatOriginal = useCallback(
    (amount, originalCurrency, options = {}) =>
      formatOriginalMerchantPrice(amount, originalCurrency, options),
    []
  );

  const formatConverted = useCallback(
    (amount, currency = preferredCurrency, options = {}) =>
      formatConvertedUserPrice(amount, currency, {
        compact: displayPreferences.compactCurrencyFormat,
        ...options,
      }),
    [preferredCurrency, displayPreferences.compactCurrencyFormat]
  );

  const value = useMemo(
    () => ({
      residenceCountry,
      deliveryCountry,
      destinationCountry: deliveryCountry,
      preferredCurrency,
      preferredCurrencyMeta: getCurrencyMeta(preferredCurrency),
      displayPreferences,
      supportedCountries: SUPPORTED_COUNTRIES,
      supportedCurrencies: SUPPORTED_CURRENCIES,
      rateCache,
      setResidenceCountry,
      setDeliveryCountry,
      setDestinationCountry: setDeliveryCountry,
      setPreferredCurrency,
      setDisplayPreferences,
      applyUserCurrencyPreferences,
      convertFromOriginal,
      fetchRateMetadata,
      detectCountrySuggestion,
      formatOriginal,
      formatConverted,
      formatExchangeRateInfo,
    }),
    [
      residenceCountry,
      deliveryCountry,
      preferredCurrency,
      displayPreferences,
      rateCache,
      setResidenceCountry,
      setDeliveryCountry,
      setPreferredCurrency,
      setDisplayPreferences,
      applyUserCurrencyPreferences,
      convertFromOriginal,
      fetchRateMetadata,
      detectCountrySuggestion,
      formatOriginal,
      formatConverted,
    ]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrencyContext() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrencyContext must be used inside CurrencyProvider');
  }
  return ctx;
}

