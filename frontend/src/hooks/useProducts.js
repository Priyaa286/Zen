import { useCallback, useEffect, useRef, useState } from 'react';
import { searchProducts, getProductById } from '@/services/productService';
import { useAppContext } from '@/context/AppContext';

export function useProducts(initialParams = {}) {
  const { destinationCountry, preferredCurrency, useMockApi } = useAppContext();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ total: 0, source: 'mock' });
  const requestSeqRef = useRef(0);
  const hasMountedRef = useRef(false);

  const [filters, setFilters] = useState({
    query: initialParams.query || '',
    category: initialParams.category || 'ALL',
    subcategory: initialParams.subcategory || '',
    originCountry: initialParams.originCountry || 'ALL',
    availability: initialParams.availability || 'ALL',
    minBudget: initialParams.minBudget || '',
    maxBudget: initialParams.maxBudget || '',
    sortBy: initialParams.sortBy || 'landed_asc',
  });

  const runSearch = useCallback(
    async (overrideFilters = null) => {
      const active = overrideFilters || filters;
      const seq = ++requestSeqRef.current;
      setLoading(true);
      setError(null);
      try {
        const numericMinBudget =
          active.minBudget !== '' && active.minBudget !== null
            ? Number(active.minBudget)
            : null;
        const numericBudget =
          active.maxBudget !== '' && active.maxBudget !== null
            ? Number(active.maxBudget)
            : null;

        const res = await searchProducts({
          query: active.query,
          category: active.category && active.category !== 'ALL' ? active.category : null,
          subcategory: active.subcategory || null,
          originCountry: active.originCountry,
          availability: active.availability,
          minBudget: Number.isFinite(numericMinBudget) && numericMinBudget > 0 ? numericMinBudget : null,
          maxBudget: Number.isFinite(numericBudget) && numericBudget > 0 ? numericBudget : null,
          sortBy: active.sortBy,
          destinationCountry,
          preferredCurrency,
        });

        if (seq !== requestSeqRef.current) return;
        setProducts(res.products || []);
        setMeta({ total: res.total ?? res.products?.length ?? 0, source: res.source });
      } catch (err) {
        if (seq !== requestSeqRef.current) return;
        setError(err?.message || 'Could not load international products.');
      } finally {
        if (seq === requestSeqRef.current) {
          setLoading(false);
        }
      }
    },
    [filters, destinationCountry, preferredCurrency, useMockApi]
  );

  // Debounce typing inputs (query / maxBudget) while keeping initial load immediate
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      runSearch();
      return;
    }
    const timer = setTimeout(() => {
      runSearch();
    }, 280);
    return () => clearTimeout(timer);
  }, [runSearch]);

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      query: '',
      category: 'ALL',
      subcategory: '',
      originCountry: 'ALL',
      availability: 'ALL',
      minBudget: '',
      maxBudget: '',
      sortBy: 'landed_asc',
    });
  }, []);

  return {
    products,
    loading,
    error,
    meta,
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    refetch: runSearch,
  };
}

export function useProductDetail(productId) {
  const { destinationCountry, preferredCurrency, useMockApi } = useAppContext();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProduct = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getProductById(productId, {
        destinationCountry,
        preferredCurrency,
      });
      setProduct(data);
    } catch (err) {
      setError(err?.message || 'Unable to load product information.');
    } finally {
      setLoading(false);
    }
  }, [productId, destinationCountry, preferredCurrency, useMockApi]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  return { product, loading, error, refetch: loadProduct };
}

export default useProducts;
