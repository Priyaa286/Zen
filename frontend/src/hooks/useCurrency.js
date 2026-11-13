import { useCurrencyContext } from '@/context/CurrencyContext';

export function useCurrency() {
  return useCurrencyContext();
}

export default useCurrency;

