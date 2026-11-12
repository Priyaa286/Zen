import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookmarkX, GitCompareArrows, ShoppingBag, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { useCartContext } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';

export function SavedProducts() {
  const navigate = useNavigate();
  const { savedProducts, removeSavedProduct } = useAuth();
  const {
    preferredCurrency,
    convertFromOriginal,
    formatOriginal,
    formatConverted,
  } = useCurrency();
  const { comparisonItems, selectProductForCheckout } = useCartContext();
  const { showToast } = useToast();

  const handleRemove = async (productId, title) => {
    try {
      await removeSavedProduct(productId);
      showToast({
        title: 'Removed from saved items',
        description: title,
        tone: 'info',
      });
    } catch (err) {
      showToast({
        title: 'Could not remove item',
        description: err.message || 'Please try again.',
        tone: 'error',
      });
    }
  };

  const handleBuyNow = (product) => {
    selectProductForCheckout(product);
    navigate('/checkout');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#E6E5E0] bg-white p-6 shadow-subtle">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E5E0] pb-4">
          <div>
            <h2 className="text-[18px] font-[640] tracking-[-0.015em] text-[#151923]">
              Saved International Products
            </h2>
            <p className="mt-0.5 text-[13px] text-[#747987]">
              Live estimates converted to {preferredCurrency} with original merchant provenance preserved.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/results">
              Browse marketplace
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {savedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#F8F7F4] text-[#747987]">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-[15px] font-[600] text-[#151923]">No saved products yet</p>
            <p className="mt-1 max-w-sm text-[13px] text-[#747987]">
              Save products while browsing or chatting with our Shopping Assistant to keep track of prices in {preferredCurrency}.
            </p>
            <Button asChild className="mt-4">
              <Link to="/results">Browse catalogue</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {savedProducts.map((product) => {
              const convertedItemPrice =
                product.targetCurrency === preferredCurrency && product.convertedPrice
                  ? product.convertedPrice
                  : convertFromOriginal({
                      amount: product.originalPrice,
                      originalCurrency: product.originalCurrency,
                      targetCurrency: preferredCurrency,
                    }).convertedAmount;

              const landedFallback =
                product.targetCurrency === preferredCurrency && product.totalLandedCost
                  ? product.totalLandedCost
                  : Math.round((convertedItemPrice * 1.12 + 18) * 100) / 100;

              return (
                <div
                  key={product.id}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-[#E6E5E0] bg-[#FAF9F7] p-4"
                >
                  <div className="flex gap-3.5">
                    <Link
                      to={`/product/${product.id}`}
                      className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-[#E6E5E0] bg-white"
                    >
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="h-full w-full object-contain p-1.5"
                        />
                      ) : null}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className="text-[10.5px]">
                          {product.merchant?.name || product.merchantName || 'Verified merchant'} ·{' '}
                          {product.merchant?.country || product.merchantCountry || 'INTL'}
                        </Badge>
                      </div>
                      <Link
                        to={`/product/${product.id}`}
                        className="mt-1.5 line-clamp-2 block text-[14px] font-[600] leading-snug text-[#151923] hover:text-[#465BE6]"
                      >
                        {product.title}
                      </Link>
                      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[12px]">
                        <span className="tabular-nums font-medium text-[#747987]">
                          Seller price: {formatOriginal(product.originalPrice, product.originalCurrency)}
                        </span>
                        <span className="tabular-nums font-[640] text-[#151923]">
                          Est. delivered cost: {formatConverted(landedFallback, preferredCurrency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E6E5E0] pt-3">
                    <button
                      type="button"
                      onClick={() => handleRemove(product.id, product.title)}
                      className="inline-flex items-center gap-1.5 text-[12px] font-[520] text-[#747987] transition-colors hover:text-red-600"
                    >
                      <BookmarkX className="h-3.5 w-3.5" />
                      Remove
                    </button>

                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/product/${product.id}`}>Details</Link>
                      </Button>
                      <Button type="button" size="sm" onClick={() => handleBuyNow(product)}>
                        <ShoppingBag className="h-3.5 w-3.5" />
                        Buy now
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[#E6E5E0] bg-white p-6 shadow-subtle">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-[16px] font-[620] text-[#151923]">
              <GitCompareArrows className="h-4 w-4 text-[#465BE6]" />
              Active Product Comparison ({comparisonItems.length})
            </h3>
            <p className="mt-0.5 text-[12.5px] text-[#747987]">
              Compare available offers side by side by estimated delivered cost and delivery time.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/results?compare=1">
              {comparisonItems.length > 0 ? 'Open comparison table' : 'Select offers to compare'}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SavedProducts;
