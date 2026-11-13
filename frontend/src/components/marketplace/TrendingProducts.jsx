import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchProducts } from '@/services/productService';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductGridSkeleton } from '@/components/common/Loader';

const TRENDING_DIVERSITY_IDS = [
  'prod-asics-kayano-jp',
  'prod-espresso-barista-de',
  'prod-kbeauty-serum-kr',
  'prod-barbour-field-uk',
  'prod-ultrabook-x14-us',
  'prod-travel-pack-us',
];

export function TrendingProducts() {
  const { destinationCountry, preferredCurrency, useMockApi } = useAppContext();
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    searchProducts({
      availability: 'IN_STOCK',
      sortBy: 'rating_desc',
      destinationCountry,
      preferredCurrency,
    })
      .then((res) => {
        if (!active) return;
        const catalog = res.products || [];
        // Prefer multi-category diverse cross-border highlights when available
        const prioritized = TRENDING_DIVERSITY_IDS.map((id) =>
          catalog.find((p) => p.id === id)
        ).filter(Boolean);

        const remaining = catalog.filter(
          (p) => !prioritized.some((picked) => picked.id === p.id)
        );
        const combined = [...prioritized, ...remaining].slice(0, 6);
        setItems(combined);
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [destinationCountry, preferredCurrency, useMockApi]);

  return (
    <section aria-labelledby="trending-globally-heading" className="zen-container py-12 sm:py-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="zen-eyebrow text-[#465BE5]">Popular Right Now</p>
          <h2
            id="trending-globally-heading"
            className="mt-1 text-[24px] sm:text-[30px] font-[680] tracking-[-0.025em] text-[#17202F]"
          >
            Popular international picks
          </h2>
          <p className="mt-1 text-[14px] text-[#697586]">
            {isAuthenticated ? (
              <>
                Estimated delivered cost to <strong className="text-[#17202F]">{destinationCountry}</strong>{' '}
                shown in <strong className="text-[#17202F]">{preferredCurrency}</strong>, alongside each seller&apos;s local price.
              </>
            ) : (
              <>
                Showing prices in each seller&apos;s local currency. Sign in to view currency conversion and delivery details.
              </>
            )}
          </p>
        </div>

        <Link
          to="/results"
          className="text-[13px] font-[600] text-[#465BE5] hover:text-[#172554]"
        >
          See all offers →
        </Link>
      </div>

      {loading ? (
        <ProductGridSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

