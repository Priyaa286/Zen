import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, Search, Sparkles, Tag, Trash2, X } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { useAuth } from '@/hooks/useAuth';
import { getSearchSuggestions } from '@/services/productService';
import { ProductImage } from '@/components/common/ProductImage';
import {
  formatConvertedUserPrice,
  formatOriginalMerchantPrice,
} from '@/utils/currencyFormatter';
import { cn } from '@/utils/cn';

const RECENT_SEARCHES_KEY = 'zen_recent_searches';
const MAX_RECENT = 5;

function getStoredRecentSearches() {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredRecentSearches(item) {
  try {
    const trimmed = item.trim();
    if (!trimmed) return;
    const existing = getStoredRecentSearches().filter(
      (s) => s.toLowerCase() !== trimmed.toLowerCase()
    );
    const updated = [trimmed, ...existing].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
}

function clearStoredRecentSearches() {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore localStorage errors
  }
}

export function GlobalSearch({
  initialValue = '',
  compact = false,
  className = '',
  onSubmitted,
}) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { destinationCountry, preferredCurrency } = useCurrency();
  const [query, setQuery] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState({ products: [], categories: [] });
  const [recentSearches, setRecentSearches] = useState(getStoredRecentSearches);
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!open && !trimmed) {
      return undefined;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await getSearchSuggestions({
          query: trimmed,
          destinationCountry,
          preferredCurrency,
          limit: 5,
        });
        setSuggestions(res || { products: [], categories: [] });
      } catch {
        setSuggestions({ products: [], categories: [] });
      } finally {
        setLoading(false);
      }
    }, 120);

    return () => {
      clearTimeout(timer);
      setLoading(false);
    };
  }, [query, open, destinationCountry, preferredCurrency]);

  useEffect(() => {
    if (!open) return undefined;
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const trimmed = query.trim();
    setOpen(false);
    if (trimmed) {
      saveStoredRecentSearches(trimmed);
      setRecentSearches(getStoredRecentSearches());
      navigate(`/results?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/results');
    }
    onSubmitted?.(trimmed);
  };

  const handleSelectRecent = (item) => {
    setQuery(item);
    setOpen(false);
    saveStoredRecentSearches(item);
    navigate(`/results?q=${encodeURIComponent(item)}`);
    onSubmitted?.(item);
  };

  const handleClearRecent = (e) => {
    e.stopPropagation();
    clearStoredRecentSearches();
    setRecentSearches([]);
  };

  const handleSelectProduct = (productId, title) => {
    if (title) saveStoredRecentSearches(title);
    setOpen(false);
    navigate(`/product/${encodeURIComponent(productId)}`);
    onSubmitted?.(query);
  };

  const handleSelectCategory = (slug) => {
    setOpen(false);
    navigate(`/results?category=${encodeURIComponent(slug)}`);
    onSubmitted?.(slug);
  };

  const handleAskAssistant = () => {
    const trimmed = query.trim();
    setOpen(false);
    if (trimmed) {
      navigate(`/assistant?prompt=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/assistant');
    }
    onSubmitted?.(trimmed);
  };

  const hasSuggestions =
    suggestions.products?.length > 0 || suggestions.categories?.length > 0;
  const showRecent = !query.trim() && recentSearches.length > 0;

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label="Global product search"
        className={cn(
          'flex w-full items-center rounded-lg border border-[#E5E7EB] bg-[#F7F8FA] transition-all focus-within:border-[#465BE5] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#465BE5]/15',
          compact ? 'h-9 px-2.5' : 'h-10 pl-3 pr-1.5'
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-[#697586]" />
        <input
          type="search"
          value={query}
          onFocus={() => {
            setRecentSearches(getStoredRecentSearches());
            setOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          placeholder="Search international products, brands, stores..."
          aria-label="Search international products, brands, and stores"
          className="w-full min-w-0 bg-transparent px-2.5 text-[13.5px] text-[#17202F] placeholder:text-[#697586] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery('')}
            className="mr-1 rounded p-1 text-[#697586] hover:text-[#17202F]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
        {!compact ? (
          <button
            type="submit"
            className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md bg-[#172554] px-3 text-[12px] font-[580] text-white transition-colors hover:bg-[#1E3A8A]"
          >
            <span>Search</span>
          </button>
        ) : null}
      </form>

      {open && (hasSuggestions || showRecent || query.trim().length > 0) ? (
        <div
          role="listbox"
          aria-label="Search suggestions"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-elevated"
        >
          {/* Recent Searches */}
          {showRecent ? (
            <div className="border-b border-[#E5E7EB] bg-white px-3.5 py-2.5">
              <div className="flex items-center justify-between pb-1.5">
                <span className="flex items-center gap-1.5 text-[11px] font-[600] uppercase tracking-[0.06em] text-[#697586]">
                  <Clock className="h-3 w-3" />
                  Recent Searches
                </span>
                <button
                  type="button"
                  onClick={handleClearRecent}
                  className="flex items-center gap-1 text-[11px] font-medium text-[#697586] hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleSelectRecent(term)}
                    className="inline-flex items-center gap-1 rounded-md border border-[#E5E7EB] bg-[#F7F8FA] px-2.5 py-1 text-[12px] font-medium text-[#17202F] transition-colors hover:border-[#465BE5] hover:text-[#465BE5]"
                  >
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Department Suggestions */}
          {suggestions.categories?.length > 0 ? (
            <div className="border-b border-[#E5E7EB] bg-[#F7F8FA]/80 px-3 py-2">
              <p className="mb-1.5 text-[10.5px] font-[600] uppercase tracking-[0.06em] text-[#697586]">
                Departments
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.categories.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => handleSelectCategory(cat.slug)}
                    className="inline-flex items-center gap-1 rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1 text-[12px] font-medium text-[#17202F] transition-colors hover:border-[#465BE5] hover:text-[#465BE5]"
                  >
                    <Tag className="h-3 w-3 text-[#465BE5]" />
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Product Suggestions */}
          {suggestions.products?.length > 0 ? (
            <div className="divide-y divide-[#E5E7EB]/70 max-h-72 overflow-y-auto">
              {suggestions.products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleSelectProduct(product.id, product.shortTitle || product.title)}
                  className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-[#F7F8FA]"
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-[#E5E7EB] bg-[#F1F3F6]">
                    <ProductImage
                      src={product.imageUrl}
                      alt={product.shortTitle || product.title}
                      category={product.category}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-[600] text-[#17202F]">
                      {product.shortTitle || product.title}
                    </p>
                    <p className="truncate text-[11.5px] text-[#697586]">
                      {product.merchant?.country} · {product.merchant?.name} ·{' '}
                      {product.category}
                    </p>
                  </div>
                  <div className="shrink-0 text-right tabular-nums">
                    {isAuthenticated ? (
                      <>
                        {product.totalLandedCost != null ? (
                          <p className="text-[12.5px] font-[650] text-[#172554]">
                            {formatConvertedUserPrice(product.totalLandedCost, preferredCurrency, {
                              compact: true,
                            })}
                          </p>
                        ) : null}
                        <p className="text-[10.5px] text-[#697586]">Est. delivered</p>
                      </>
                    ) : (
                      <>
                        {product.originalPrice != null ? (
                          <p className="text-[12.5px] font-[650] text-[#172554]">
                            {formatOriginalMerchantPrice(
                              product.originalPrice,
                              product.originalCurrency || 'USD'
                            )}
                          </p>
                        ) : null}
                        <p className="text-[10.5px] text-[#697586]">Seller price</p>
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim() && !loading ? (
            <div className="p-4 text-center text-[12.5px] text-[#697586]">
              No exact suggestions found. Press <strong>Enter</strong> to search all listings.
            </div>
          ) : null}

          {/* Footer Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E7EB] bg-[#F7F8FA] px-3.5 py-2.5">
            {query.trim() ? (
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center gap-1.5 text-[12px] font-[600] text-[#172554] hover:text-[#465BE5]"
              >
                <span>See all results for &ldquo;{query.trim()}&rdquo;</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span className="text-[12px] text-[#697586]">Quick search</span>
            )}

            <button
              type="button"
              onClick={handleAskAssistant}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#465BE5]/30 bg-[#465BE5]/10 px-2.5 py-1 text-[11.5px] font-[600] text-[#465BE5] transition-colors hover:bg-[#465BE5]/15"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ask AI Assistant</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default GlobalSearch;