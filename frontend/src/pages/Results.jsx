import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, GitCompareArrows, Home as HomeIcon, RefreshCw, Sparkles, UserCheck, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ProductGridSkeleton } from '@/components/common/Loader';
import { SEOHead } from '@/components/common/SEOHead';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductComparison } from '@/components/products/ProductComparison';
import { ProductFilters } from '@/components/products/ProductFilters';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAppContext } from '@/context/AppContext';
import { useCartContext } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';
import { getCategoryBySlug } from '@/data/categories';
import { getCountryName } from '@/utils/currencyFormatter';

const VALID_ORIGINS = new Set(['ALL', 'US', 'GB', 'JP', 'DE', 'SG', 'KR']);
const ORIGIN_QUICK_TABS = [
  { code: 'ALL', label: 'All origins' },
  { code: 'US', label: 'United States' },
  { code: 'JP', label: 'Japan' },
  { code: 'SG', label: 'Singapore' },
  { code: 'DE', label: 'Germany' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'KR', label: 'South Korea' },
];

export function Results() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || searchParams.get('query') || '';
  const initialCategory = searchParams.get('category') || 'ALL';
  const initialSubcategory = searchParams.get('subcategory') || '';
  const rawOrigin = (searchParams.get('origin') || 'ALL').toUpperCase();
  const initialOrigin = VALID_ORIGINS.has(rawOrigin) ? rawOrigin : 'ALL';

  const [compareOpen, setCompareOpen] = useState(
    searchParams.get('compare') === 'open'
  );
  const {
    destinationCountry,
    preferredCurrency,
    supportedCountries,
    setDestinationCountry,
  } = useAppContext();
  const { isAuthenticated, user } = useAuth();
  const { comparisonItems } = useCartContext();

  const {
    products,
    loading,
    error,
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    refetch,
  } = useProducts({
    query: initialQuery,
    category: initialCategory,
    subcategory: initialSubcategory,
    originCountry: initialOrigin,
  });

  useEffect(() => {
    const paramQ = searchParams.get('q') || searchParams.get('query') || '';
    const paramCat = searchParams.get('category') || 'ALL';
    const paramSubcat = searchParams.get('subcategory') || '';
    const paramOrigin = (searchParams.get('origin') || 'ALL').toUpperCase();
    const safeOrigin = VALID_ORIGINS.has(paramOrigin) ? paramOrigin : 'ALL';

    setFilters((prev) => {
      if (
        prev.query === paramQ &&
        prev.category === paramCat &&
        prev.subcategory === paramSubcat &&
        prev.originCountry === safeOrigin
      ) {
        return prev;
      }
      return {
        ...prev,
        query: paramQ,
        category: paramCat,
        subcategory: paramSubcat,
        originCountry: safeOrigin,
      };
    });

    if (searchParams.get('compare') === 'open') {
      setCompareOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('compare');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setFilters, setSearchParams]);

  const activeCategoryMeta =
    filters.category && filters.category !== 'ALL'
      ? getCategoryBySlug(filters.category)
      : null;

  const handleUpdateFilterWithUrl = (key, value) => {
    if (key === 'category') {
      const next = new URLSearchParams(searchParams);
      if (value && value !== 'ALL') {
        next.set('category', value);
      } else {
        next.delete('category');
      }
      next.delete('subcategory');
      setSearchParams(next, { replace: true });
      setFilters((prev) => ({ ...prev, category: value, subcategory: '' }));
      return;
    }
    if (key === 'subcategory') {
      const next = new URLSearchParams(searchParams);
      if (value) {
        next.set('subcategory', value);
      } else {
        next.delete('subcategory');
      }
      setSearchParams(next, { replace: true });
      updateFilter('subcategory', value);
      return;
    }
    if (key === 'originCountry') {
      const next = new URLSearchParams(searchParams);
      if (value && value !== 'ALL') {
        next.set('origin', value);
      } else {
        next.delete('origin');
      }
      setSearchParams(next, { replace: true });
      updateFilter('originCountry', value);
      return;
    }
    if (key === 'query') {
      const next = new URLSearchParams(searchParams);
      if (value) {
        next.set('q', value);
      } else {
        next.delete('q');
      }
      setSearchParams(next, { replace: true });
      updateFilter('query', value);
      return;
    }
    updateFilter(key, value);
  };

  const handleResetAll = () => {
    setSearchParams({}, { replace: true });
    resetFilters();
  };

  const handleDestinationChange = (code) => {
    setDestinationCountry(code);
  };

  const pageTitle = activeCategoryMeta
    ? `${activeCategoryMeta.name} – International Products`
    : filters.query
    ? `Search "${filters.query}" – Global Products`
    : 'Discover International Products & Verified Merchants';

  const pageDesc = activeCategoryMeta
    ? `Explore authentic ${activeCategoryMeta.name.toLowerCase()} from Japan, USA, Germany, and the UK. Live currency conversion and upfront landed costs.`
    : filters.query
    ? `Browse international offers for "${filters.query}" across global sellers with PayPal checkout and calculated customs.`
    : 'Browse authentic international products across 15 curated departments from verified merchants worldwide. Upfront landed costs and PayPal checkout.';

  return (
    <div className="bg-[#F7F8FA] py-6 sm:py-10">
      <SEOHead
        title={pageTitle}
        description={pageDesc}
        canonical={
          filters.category && filters.category !== 'ALL'
            ? `/results?category=${encodeURIComponent(filters.category)}`
            : '/results'
        }
        keywords="international products, cross-border shopping, buy from japan, buy from usa, buy from germany, paypal buyer protection"
      />

      <div className="zen-container space-y-6">
        {/* Semantic Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] text-[#697586]">
          <Link to="/" className="inline-flex items-center gap-1 hover:text-[#172554] transition-colors">
            <HomeIcon className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>
          <ChevronRight className="h-3 w-3 text-[#CBD5E1]" />
          <Link to="/results" className="hover:text-[#172554] transition-colors">
            All Products
          </Link>
          {activeCategoryMeta ? (
            <>
              <ChevronRight className="h-3 w-3 text-[#CBD5E1]" />
              <Link
                to={`/results?category=${encodeURIComponent(activeCategoryMeta.slug)}`}
                className={filters.subcategory ? 'hover:text-[#172554]' : 'font-semibold text-[#17202F]'}
              >
                {activeCategoryMeta.name}
              </Link>
            </>
          ) : null}
          {filters.subcategory ? (
            <>
              <ChevronRight className="h-3 w-3 text-[#CBD5E1]" />
              <span className="font-semibold text-[#17202F]">{filters.subcategory}</span>
            </>
          ) : null}
        </nav>

        {/* Marketplace Header / Active Department Context */}
        <div className="flex flex-col gap-5 border-b border-[#E5E7EB] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="zen-eyebrow text-[#465BE5]">
              {activeCategoryMeta ? `Department · ${activeCategoryMeta.name}` : 'Global Marketplace'}
            </p>
            <h1 className="zen-page-title text-[28px] sm:text-[36px] text-[#17202F]">
              {activeCategoryMeta
                ? activeCategoryMeta.name
                : filters.query
                  ? `Results for "${filters.query}"`
                  : 'International Product Catalog'}
            </h1>
            <p className="text-[14px] leading-relaxed text-[#697586]">
              {activeCategoryMeta ? (
                <>{activeCategoryMeta.tagline} · </>
              ) : null}
              {isAuthenticated ? (
                <>
                  Calculated for{' '}
                  <strong className="font-[600] text-[#17202F]">
                    {getCountryName(destinationCountry)} ({destinationCountry})
                  </strong>{' '}
                  with FX, air freight, and customs shown in{' '}
                  <strong className="font-[600] text-[#17202F]">{preferredCurrency}</strong>.
                </>
              ) : (
                <>
                  Showing prices in each seller&apos;s local currency. Sign in to view currency conversion, delivery details, wishlist, and cart.
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {comparisonItems.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCompareOpen(true)}
              >
                <GitCompareArrows className="h-3.5 w-3.5 text-[#465BE5]" />
                Compare ({comparisonItems.length})
              </Button>
            ) : null}

            <Link to="/assistant">
              <Button size="sm">
                <Sparkles className="h-3.5 w-3.5" />
                Ask AI Assistant
              </Button>
            </Link>
          </div>
        </div>

        {/* Subcategory Pills when browsing a specific Department */}
        {activeCategoryMeta ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleUpdateFilterWithUrl('subcategory', '')}
              className={`rounded-full px-3 py-1 text-[12px] font-[550] transition-colors ${
                !filters.subcategory
                  ? 'bg-[#172554] text-white'
                  : 'border border-[#E5E7EB] bg-white text-[#697586] hover:text-[#17202F]'
              }`}
            >
              All {activeCategoryMeta.shortName || activeCategoryMeta.name}
            </button>
            {activeCategoryMeta.subcategories.map((sub) => {
              const active = filters.subcategory.toLowerCase() === sub.toLowerCase();
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => handleUpdateFilterWithUrl('subcategory', active ? '' : sub)}
                  className={`rounded-full px-3 py-1 text-[12px] font-[550] transition-colors ${
                    active
                      ? 'bg-[#465BE5] text-white'
                      : 'border border-[#E5E7EB] bg-white text-[#697586] hover:border-[#CBD5E1] hover:text-[#17202F]'
                  }`}
                >
                  {sub}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => handleUpdateFilterWithUrl('category', 'ALL')}
              className="inline-flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-[#F1F3F6] px-2.5 py-1 text-[11.5px] font-medium text-[#697586] hover:text-[#17202F]"
            >
              <X className="h-3 w-3" />
              All departments
            </button>
          </div>
        ) : null}

        {/* Guest/Personalization Banner */}
        {!isAuthenticated ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 text-[12.5px]">
            <span className="flex items-center gap-2 text-[#697586]">
              <UserCheck className="h-3.5 w-3.5 text-[#465BE5]" />
              Browsing as a guest — products show the seller&apos;s currency only. Sign in to view currency conversion, delivery details, wishlist, and cart.
            </span>
            <div className="flex items-center gap-2">
              <Link to="/login" className="font-[580] text-[#465BE5] hover:text-[#172554]">
                Sign in
              </Link>
              <span className="text-[#CBD5E1]">·</span>
              <Link to="/register" className="font-[580] text-[#17202F] hover:text-[#465BE5]">
                Create account
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#697586]">
            <span>
              Personalized for <strong className="font-[600] text-[#17202F]">{user?.fullName}</strong>{' '}
              (Residence: {user?.residenceCountry || destinationCountry} · Display: {preferredCurrency})
            </span>
            <Link to="/account?tab=saved" className="font-[580] text-[#465BE5] hover:text-[#172554]">
              View wishlist →
            </Link>
          </div>
        )}

        {/* Merchant Origin Quick-Filter Strip */}
        <div
          role="group"
          aria-label="Filter by country shipped from"
          className="flex flex-wrap items-center gap-1.5"
        >
          {ORIGIN_QUICK_TABS.map((origin) => {
            const active = filters.originCountry === origin.code;
            return (
              <button
                key={origin.code}
                type="button"
                onClick={() => handleUpdateFilterWithUrl('originCountry', origin.code)}
                className={`rounded-full px-3 py-1 text-[12px] font-[550] transition-colors ${
                  active
                    ? 'bg-[#172554] text-white'
                    : 'border border-[#E5E7EB] bg-white text-[#697586] hover:border-[#CBD5E1] hover:text-[#17202F]'
                }`}
              >
                {origin.code === 'ALL' ? origin.label : `${origin.code} · ${origin.label}`}
              </button>
            );
          })}
        </div>

        {/* Structured Filters */}
        <ProductFilters
          filters={filters}
          onUpdateFilter={handleUpdateFilterWithUrl}
          onReset={handleResetAll}
          destinationCountry={destinationCountry}
          supportedCountries={supportedCountries}
          onDestinationChange={handleDestinationChange}
          preferredCurrency={preferredCurrency}
          totalCount={products.length}
        />

        {/* Error State */}
        {error ? (
          <Alert variant="destructive">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <AlertTitle>Couldn&apos;t load available offers</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          </Alert>
        ) : null}

        {/* Product Grid */}
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : products.length === 0 ? (
          <div className="rounded-lg border border-[#E5E7EB] bg-white px-6 py-16 text-center">
            <p className="text-[16px] font-[600] text-[#17202F]">
              We couldn&apos;t find any matching products.
            </p>
            <p className="mx-auto mt-1.5 max-w-md text-[13.5px] text-[#697586]">
              Try clearing a category, country, or budget filter, or ask the Shopping Assistant to check sellers in other countries.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              <Button variant="outline" onClick={handleResetAll}>
                Reset all filters
              </Button>
              <Link to="/assistant">
                <Button>Ask AI Assistant</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <ProductComparison open={compareOpen} onOpenChange={setCompareOpen} />
      </div>
    </div>
  );
}

export default Results;