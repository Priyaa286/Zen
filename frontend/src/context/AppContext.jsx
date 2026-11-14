import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { isMockApiEnabled, setRuntimeMockApi } from '@/services/api';
import { useCurrencyContext } from '@/context/CurrencyContext';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const {
    residenceCountry,
    deliveryCountry,
    preferredCurrency,
    supportedCountries,
    supportedCurrencies,
    displayPreferences,
    setResidenceCountry,
    setDeliveryCountry,
    setPreferredCurrency,
    setDisplayPreferences,
  } = useCurrencyContext();

  const [useMockApi, setUseMockApiState] = useState(isMockApiEnabled());

  const toggleMockApi = useCallback((nextValue) => {
    const resolved = typeof nextValue === 'boolean' ? nextValue : !isMockApiEnabled();
    setRuntimeMockApi(resolved);
    setUseMockApiState(resolved);
  }, []);

  const value = useMemo(
    () => ({
      appName: import.meta.env.VITE_APP_NAME || 'Zen',
      residenceCountry,
      destinationCountry: deliveryCountry,
      preferredCurrency,
      displayPreferences,
      useMockApi,
      supportedCountries,
      supportedCurrencies,
      setResidenceCountry,
      setDestinationCountry: setDeliveryCountry,
      setPreferredCurrency,
      setDisplayPreferences,
      toggleMockApi,
    }),
    [
      residenceCountry,
      deliveryCountry,
      preferredCurrency,
      displayPreferences,
      useMockApi,
      supportedCountries,
      supportedCurrencies,
      setResidenceCountry,
      setDeliveryCountry,
      setPreferredCurrency,
      setDisplayPreferences,
      toggleMockApi,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used inside AppProvider');
  }
  return ctx;
}
