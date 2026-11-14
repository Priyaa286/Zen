import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  Check,
  GitCompareArrows,
  Lock,
  ShoppingBag,
  Star,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ProductImage } from '@/components/common/ProductImage';
import { useAppContext } from '@/context/AppContext';
import { useCartContext } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import {
  formatCurrency,
  formatExchangeRateInfo,
  formatOriginalMerchantPrice,
  getCountryName,
} from '@/utils/currencyFormatter';
import { cn } from '@/utils/cn';

function StockStatusTag({ availability, stockLabel }) {
  if (availability === 'out_of_stock') {
    return (
      <span className="rounded bg-white/95 px-2 py-0.5 text-[10.5px] font-medium text-red-700 border border-red-200 backdrop-blur-sm">
        {stockLabel || 'Out of stock'}
      </span>
    );
  }
  if (availability === 'limited_stock') {
    return (
      <span className="rounded bg-white/95 px-2 py-0.5 text-[10.5px] font-medium text-[#9A6A13] border border-[#D69A29]/45 backdrop-blur-sm">
        {stockLabel || 'Limited stock'}
      </span>
    );
  }
  return null;
}

export function ProductCard({ product }) {
  const navigate = useNavigate();
  const [addedToCart, setAddedToCart] = useState(false);
  const { preferredCurrency } = useAppContext();
  const {
    comparisonItems,
    toggleCompareProduct,
    selectProductForCheckout,
    addToCart,
  } = useCartContext();
  const { isAuthenticated, isProductSaved, toggleSaveProduct } = useAuth();
  const { showToast } = useToast();

  const isCompared = comparisonItems.some((item) => item.id === product.id);
  const isSaved = isProductSaved(product.id);
  const displayCurrency = product.targetCurrency || preferredCurrency;
  const isVerified = Boolean(product.merchant?.verified);
  const isBlocked =
    product.availability === 'out_of_stock' ||
    (isAuthenticated && product.shippingAvailable === false);

  const redirectGuestToLogin = (description) => {
    showToast({
      title: 'Sign in required',
      description,
      tone: 'info',
    });
    navigate('/login');
  };

  const handleToggleSave = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      redirectGuestToLogin('Please sign in to save items to your wishlist.');
      return;
    }
    try {
      const res = await toggleSaveProduct(product);
      if (res?.requiresAuth) {
        redirectGuestToLogin('Please sign in to save items to your wishlist.');
        return;
      }
      showToast({
        title: res?.saved ? 'Saved to wishlist' : 'Removed from wishlist',
        description: product.shortTitle || product.title,
        tone: res?.saved ? 'success' : 'info',
      });
    } catch (err) {
      showToast({
        title: 'Unable to update wishlist',
        description: err.message || 'Please try again.',
        tone: 'error',
      });
    }
  };

  const handleCompare = () => {
    const res = toggleCompareProduct(product);
    if (res.limitReached) {
      showToast({
        title: 'Comparison limit reached',
        description: 'You can compare up to 4 international offers side-by-side.',
        tone: 'warning',
      });
      return;
    }
    showToast({
      title: res.added ? 'Added to comparison' : 'Removed from comparison',
      description: product.shortTitle || product.title,
      tone: 'info',
    });
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      redirectGuestToLogin('Please sign in to add items to your cart.');
      return;
    }
    if (isBlocked) return;
    addToCart(product, 1, null, true);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1400);
    showToast({
      title: 'Added to global cart',
      description: `${product.shortTitle || product.title} (${product.merchant?.name})`,
      tone: 'success',
    });
  };

  const handleViewDetails = () => {
    navigate(`/product/${product.id}`, { state: { product } });
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      redirectGuestToLogin('Please sign in to buy items or view checkout totals.');
      return;
    }
    selectProductForCheckout(product, 1);
    navigate('/checkout');
  };

  const originalDisplay =
    product.originalPrice != null
      ? formatOriginalMerchantPrice(product.originalPrice, product.originalCurrency || 'USD')
      : 'Unavailable';

  const convertedDisplay =
    product.convertedPrice != null
      ? formatCurrency(product.convertedPrice, displayCurrency, { compact: true })
      : 'Unavailable';

  const shippingDisplay =
    product.shippingCost != null
      ? formatCurrency(product.shippingCost, displayCurrency, { compact: true })
      : 'Unavailable';

  const dutiesDisplay =
    product.estimatedDutiesAndTaxes != null
      ? formatCurrency(product.estimatedDutiesAndTaxes, displayCurrency, { compact: true })
      : 'Est. incl.';

  const fxInfoDisplay =
    product.exchangeRate != null
      ? formatExchangeRateInfo(
          product.exchangeRate,
          product.originalCurrency || 'USD',
          displayCurrency,
          product.exchangeRateTimestamp
        )
      : null;

  const totalDisplay =
    product.totalLandedCost != null
      ? formatCurrency(product.totalLandedCost, displayCurrency, { compact: true })
      : 'Unavailable';

  return (
    <article className="group flex flex-col justify-between rounded-lg border border-[#E5E7EB] bg-white p-3.5 transition-all duration-200 hover:-translate-y-1 hover:border-[#465BE5]/40 hover:shadow-card">
      <div>
        {/* Studio Product Image Surface */}
        <div className="relative overflow-hidden rounded-md border border-[#E5E7EB] bg-[#F1F3F6]">
          <button
            type="button"
            onClick={handleViewDetails}
            aria-label={`View details for ${product.title}`}
            className="block aspect-[4/3] w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#465BE5]"
          >
            <ProductImage
              src={product.imageUrl}
              alt={product.title}
              category={product.category}
              className="h-full w-full"
              imgClassName="transition-transform duration-300 ease-out group-hover:scale-[1.03]"
              fit="cover"
              loading="lazy"
              width={400}
              height={300}
            />
          </button>

          <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
            {product.category ? (
              <span className="rounded bg-white/95 px-2 py-0.5 text-[10.5px] font-[580] text-[#172554] border border-[#E5E7EB] backdrop-blur-sm">
                {product.category}
              </span>
            ) : null}
            <StockStatusTag
              availability={product.availability}
              stockLabel={product.stockLabel}
            />
          </div>

          <button
            type="button"
            onClick={handleToggleSave}
            aria-label={
              isSaved
                ? `Remove ${product.shortTitle || product.title} from wishlist`
                : `Save ${product.shortTitle || product.title} to wishlist`
            }
            aria-pressed={isSaved}
            className={cn(
              'absolute right-2.5 top-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-sm transition-colors',
              isSaved
                ? 'border-[#465BE6] bg-[#465BE6] text-white'
                : 'border-[#E5E7EB] bg-white/95 text-[#697586] hover:text-[#17202F]'
            )}
          >
            <motion.span
              key={isSaved ? 'saved' : 'unsaved'}
              initial={{ scale: 0.85 }}
              animate={{ scale: [0.85, 1.25, 1] }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex"
            >
              <Bookmark className={cn('h-3.5 w-3.5', isSaved ? 'fill-current' : '')} />
            </motion.span>
          </button>
        </div>

        {/* Merchant, Country Flag, Rating & Title */}
        <div className="pt-3.5">
          <div className="flex items-center justify-between gap-2 text-[12px]">
            <div className="flex min-w-0 items-center gap-1.5 text-[#697586]">
              {product.merchant?.country ? (
                <span className="shrink-0 rounded border border-[#E5E7EB] bg-[#F7F8FA] px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-[#172554]">
                  {product.merchant.country}
                </span>
              ) : null}
              <span className="truncate font-[580] text-[#17202F]">
                {product.merchant?.name}
              </span>
              {isVerified ? (
                <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#465BE6]" />
              ) : null}
            </div>

            {isVerified && product.rating != null ? (
              <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-[600] text-[#17202F] tabular-nums">
                <Star className="h-3 w-3 fill-[#D69A29] text-[#D69A29]" />
                {product.rating.toFixed(1)}
              </span>
            ) : null}
          </div>

          <h3 className="mt-2 text-[15px] font-[620] leading-snug tracking-[-0.015em] text-[#17202F]">
            <button
              type="button"
              onClick={handleViewDetails}
              className="block text-left transition-colors group-hover:text-[#465BE5] line-clamp-2 focus-visible:outline-none focus-visible:underline"
            >
              {product.shortTitle || product.title}
            </button>
          </h3>

          <p className="mt-1 text-[12px] text-[#697586]">
            {product.brand ? `${product.brand} · ` : ''}
            {isAuthenticated
              ? `Arrives ${product.deliveryEstimate || '5–8 business days'} · ${getCountryName(product.merchant?.country)}`
              : `Sold in ${getCountryName(product.merchant?.country)}`}
          </p>
        </div>
      </div>

      {/* Refined Retail Pricing Hierarchy */}
      <div className="mt-3.5 pt-3 border-t border-[#E5E7EB] space-y-2">
        {isAuthenticated ? (
          <div className="space-y-1.5 text-xs tabular-nums">
            {/* 1. Original merchant price */}
            <div className="flex items-baseline justify-between text-[#697586]">
              <span className="text-[11.5px]">Original price:</span>
              <span className="font-medium text-[#17202F]">{originalDisplay}</span>
            </div>

            {/* 2. Converted price */}
            <div className="flex items-baseline justify-between">
              <span className="text-[11.5px] text-[#697586]">Converted:</span>
              <span className="text-[13.5px] font-semibold text-[#17202F]">
                ≈ {convertedDisplay}
              </span>
            </div>

            {/* 3. Estimated delivered cost */}
            {product.totalLandedCost != null ? (
              <div className="flex items-baseline justify-between border-t border-[#F1F3F6] pt-1.5 mt-1">
                <div>
                  <span className="text-[11.5px] font-bold text-[#172554] block">Est. delivered cost</span>
                  <span className="text-[10px] text-[#697586]">
                    {shippingDisplay !== 'Unavailable' ? `Incl. ${shippingDisplay} ship` : 'Includes shipping & duties'}
                  </span>
                </div>
                <span className="text-[17px] font-[700] tracking-[-0.02em] text-[#172554]">
                  {totalDisplay}
                </span>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-2 tabular-nums">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11.5px] text-[#697586]">Seller price:</span>
              <span className="text-[17px] font-[700] tracking-[-0.02em] text-[#172554]">
                {originalDisplay}
              </span>
            </div>

            <Link
              to="/login"
              className="flex items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-[#F7F8FA] px-2.5 py-1.5 text-[11px] font-[550] text-[#465BE5] transition-colors hover:border-[#465BE5]/40 hover:bg-[#465BE5]/[0.04]"
            >
              <Lock className="h-3 w-3 shrink-0" />
              <span>Sign in for converted price &amp; delivery</span>
            </Link>
          </div>
        )}

        <div className="mt-3 flex items-center gap-1.5 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBlocked}
            onClick={handleAddToCart}
            className={cn(
              'flex-1 text-[12px] h-8.5 transition-colors',
              addedToCart
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100/70'
                : ''
            )}
          >
            {addedToCart ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 animate-in zoom-in-75 duration-150" />
                <span>Added ✓</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5 text-[#172554]" />
                <span>Add to cart</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCompare}
            aria-label={
              isCompared
                ? `Remove ${product.shortTitle || product.title} from comparison`
                : `Compare ${product.shortTitle || product.title}`
            }
            className={cn(
              'shrink-0 px-2 h-8.5',
              isCompared
                ? 'border-[#15976B]/45 bg-[#15976B]/[0.08] text-[#15976B] hover:bg-[#15976B]/12'
                : 'text-[#697586] hover:text-[#17202F]'
            )}
          >
            {isCompared ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <GitCompareArrows className="h-3.5 w-3.5" />
            )}
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={isBlocked}
            onClick={handleBuyNow}
            className="flex-1 bg-[#172554] text-[12px] h-8.5 hover:bg-[#1E3A8A]"
          >
            {isBlocked ? 'Unavailable' : 'Buy now'}
            {!isBlocked ? <ArrowRight className="h-3.5 w-3.5" /> : null}
          </Button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
