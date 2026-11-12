import { ProductCard } from './ProductCard';
import { ProductGridSkeleton } from '@/components/common/Loader';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';

export function ProductGrid({
  products = [],
  loading = false,
  onResetFilters,
  onAskAssistant,
}) {
  if (loading) {
    return <ProductGridSkeleton count={6} />;
  }

  if (!products || products.length === 0) {
    return (
      <EmptyState
        title="We couldn't find any matching products."
        description="Try widening your budget, clearing origin filters, or asking the Shopping Assistant to check sellers in other countries."
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            {onResetFilters && (
              <Button type="button" variant="outline" onClick={onResetFilters}>
                Reset filters
              </Button>
            )}
            {onAskAssistant && (
              <Button type="button" variant="primary" onClick={onAskAssistant}>
                Ask Shopping Assistant
              </Button>
            )}
          </div>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export default ProductGrid;

