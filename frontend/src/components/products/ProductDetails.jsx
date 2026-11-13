import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  Bookmark,
  CheckCircle2,
  Info,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ProductGallery } from '@/components/products/ProductGallery';
import {
  normalizeVariantGroups,
  ProductPricing,
} from '@/components/products/ProductPricing';
import { LandedCostSummary } from '@/components/products/LandedCostSummary';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCartContext } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import {
  formatExchangeRateInfo,
  getCountryName,
} from '@/utils/currencyFormatter';
import { cn } from '@/utils/cn';

function buildDefaultVariantMap(variants) {
  const groups = normalizeVariantGroups(variants);
  if (groups.length === 0) return null;
  const map = {};
  for (const group of groups) {
    map[group.name] = group.options[0];
  }
  return Object.keys(map).length > 0 ? map : null;
}

export function ProductDetails({
  product,
  shippingInfo,
  shippingLoading = false,
  destinationCountry,
  preferredCurrency,
  quantity,
  onQuantityChange,
  onBuyNow,
  onAskAssistant,
}) {
  const navigate = useNavigate();
  const { addToCart } = useCartContext();
  const { isAuthenticated, isProductSaved, toggleSaveProduct } = useAuth();
  const { showToast } = useToast();
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(() =>
    buildDefaultVariantMap(product?.variants)
  );

  useEffect(() => {
    setSelectedImageIdx(0);
    setSelectedVariant(buildDefaultVariantMap(product?.variants));
  }, [product?.id]);

  if (!product) return null;

  const isSaved = isProductSaved(product.id);
  const handleToggleSave = async () => {
    if (!isAuthenticated) {
      showToast({
        title: 'Sign in required',
        description: 'Please sign in to save items to your wishlist.',
        tone: 'info',
      });
      navigate('/login');
      return;
    }
    try {
      const res = await toggleSaveProduct(product);
      if (res?.requiresAuth) {
        showToast({
          title: 'Sign in required',
          description: 'Please sign in to save items to your wishlist.',
          tone: 'info',
        });
        navigate('/login');
        return;
      }
      showToast({
        title: res?.saved ? 'Saved to wishlist' : 'Removed from wishlist',
        description: product.shortTitle || product.title,
        tone: res?.saved ? 'success' : 'info',
      });
    } catch (err) {
      showToast({
        title: 'Could not update wishlist',
        description: err.message || 'Please try again.',
        tone: 'error',
      });
    }
  };

  const handleSelectVariantOption = (groupName, optionValue) => {
    setSelectedVariant((prev) => ({
      ...(prev || {}),
      [groupName]: optionValue,
    }));
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      showToast({
        title: 'Sign in required',
        description: 'Please sign in to add items to your cart.',
        tone: 'info',
      });
      navigate('/login');
      return;
    }
    addToCart(product, quantity, selectedVariant, true);
    showToast({
      title: 'Added to global cart',
      description: `${quantity} × ${product.shortTitle || product.title}`,
      tone: 'success',
    });
  };

  const images =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.imageUrl
        ? [product.imageUrl]
        : [];
  const activeImage = images[selectedImageIdx] || product.imageUrl || null;

  const displayCurrency = product.targetCurrency || preferredCurrency;
  const isOutOfStock = product.availability === 'out_of_stock';
  const isShippingBlocked =
    isOutOfStock ||
    (isAuthenticated &&
      (product.shippingAvailable === false ||
        (shippingInfo && shippingInfo.available === false)));
  const isVerified = Boolean(product.merchant?.verified);

  const shippingOption = shippingInfo?.defaultOption || shippingInfo?.options?.[0] || null;
  const shippingCostDisplay =
    shippingOption?.costInTargetCurrency ?? product.shippingCost ?? null;
  const deliveryDisplay =
    shippingOption?.etaLabel || product.deliveryEstimate || 'Unavailable';

  return (
    <div className="space-y-12">
      {/* Upper 12-Column Gallery & Purchase Workspace */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
        <ProductGallery
          images={images}
          activeImage={activeImage}
          selectedImageIdx={selectedImageIdx}
          onSelectImage={setSelectedImageIdx}
          productTitle={product.title}
          category={product.category}
        />

        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <ProductPricing
            product={product}
            destinationCountry={destinationCountry}
            selectedVariant={selectedVariant}
            onSelectVariantOption={handleSelectVariantOption}
            isAuthenticated={isAuthenticated}
          />

          {/* Landed Cost & Purchase Card */}
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-6 space-y-5">
            <LandedCostSummary
              product={product}
              quantity={quantity}
              displayCurrency={displayCurrency}
              shippingOption={shippingOption}
              shippingLoading={shippingLoading}
              shippingCostDisplay={shippingCostDisplay}
              deliveryDisplay={deliveryDisplay}
              isAuthenticated={isAuthenticated}
            />

            {isShippingBlocked ? (
              <Alert variant="destructive">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <AlertTitle>Unavailable for checkout</AlertTitle>
                  <AlertDescription>
                    {shippingInfo?.reason ||
                      product.unavailableReason ||
                      'This product is currently out of stock or cannot ship to your destination country.'}
                  </AlertDescription>
                </div>
              </Alert>
            ) : null}

            {/* Quantity + Add to Cart + Buy Now Row */}
            <div className="space-y-3 border-t border-[#E5E7EB] pt-4">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <div className="flex items-center justify-between sm:justify-start gap-3 rounded-md border border-[#E5E7EB] bg-[#F7F8FA] px-3 h-11">
                  <span className="text-xs font-medium text-[#697586]">Qty</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1 || isShippingBlocked}
                      aria-label="Decrease quantity"
                      className="rounded p-1 text-[#17202F] transition-colors hover:bg-[#E5E7EB] disabled:opacity-40"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-[#17202F] tabular-nums">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onQuantityChange(Math.min(10, quantity + 1))}
                      disabled={quantity >= 10 || isShippingBlocked}
                      aria-label="Increase quantity"
                      className="rounded p-1 text-[#17202F] transition-colors hover:bg-[#E5E7EB] disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled={isShippingBlocked}
                  onClick={handleAddToCart}
                  className="flex-1 min-w-[140px]"
                >
                  <ShoppingBag className="h-4 w-4 text-[#172554]" />
                  <span>Add to cart</span>
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  disabled={isShippingBlocked}
                  onClick={onBuyNow}
                  className="flex-1 min-w-[140px] bg-[#172554] hover:bg-[#1E3A8A]"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{isShippingBlocked ? 'Unavailable' : 'Buy now'}</span>
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onAskAssistant}
                  className="flex-1"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#465BE6]" />
                  <span>Ask Zen AI</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleToggleSave}
                  aria-pressed={isSaved}
                  className="px-4"
                >
                  <Bookmark
                    className={cn(
                      'h-3.5 w-3.5',
                      isSaved ? 'fill-[#465BE6] text-[#465BE6]' : 'text-[#697586]'
                    )}
                  />
                  <span>{isSaved ? 'Saved' : 'Save to wishlist'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Structural Details */}
      <div className="grid grid-cols-1 gap-8 border-t border-[#E5E7EB] pt-8 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2.5">
            <h2 className="text-base font-semibold text-[#17202F]">About this product</h2>
            <p className="text-sm leading-relaxed text-[#697586]">
              {product.description || 'Product description provided by the seller.'}
            </p>
          </div>

          {Array.isArray(product.highlights) && product.highlights.length > 0 ? (
            <div className="space-y-3 border-t border-[#E5E7EB] pt-6">
              <h3 className="text-sm font-semibold text-[#17202F]">
                Key details &amp; regional compatibility
              </h3>
              <ul className="space-y-2 text-sm text-[#697586]">
                {product.highlights.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#15976B]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-5 space-y-6">
          {/* Seller Details */}
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#17202F]">Seller details</h3>
            <dl className="divide-y divide-[#E5E7EB] text-xs tabular-nums">
              <div className="flex justify-between py-2">
                <dt className="text-[#697586]">Seller</dt>
                <dd className="font-medium text-[#17202F] flex items-center gap-1">
                  <span>{product.merchant?.name}</span>
                  {isVerified ? <BadgeCheck className="h-3.5 w-3.5 text-[#465BE6]" /> : null}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-[#697586]">{isAuthenticated ? 'Ships from' : 'Seller location'}</dt>
                <dd className="font-medium text-[#17202F]">
                  {product.merchant?.dispatchLocation ||
                    getCountryName(product.merchant?.country)}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-[#697586]">Seller verification</dt>
                <dd className="font-medium text-[#17202F]">
                  {isVerified ? 'Verified seller' : 'Standard listing'}
                </dd>
              </div>
              {product.weightKg ? (
                <div className="flex justify-between py-2">
                  <dt className="text-[#697586]">Approx. parcel weight</dt>
                  <dd className="font-medium text-[#17202F]">{product.weightKg} kg</dd>
                </div>
              ) : null}
            </dl>
          </div>

          {/* Customs & Price Notes */}
          {isAuthenticated ? (
            <div className="rounded-lg border border-[#E5E7EB] bg-[#F7F8FA] p-5 space-y-2.5">
              <h3 className="text-sm font-semibold text-[#17202F]">
                What to know about import fees
              </h3>
              <ul className="space-y-2 text-xs leading-relaxed text-[#697586]">
                <li>
                  · Indicative exchange rate:{' '}
                  <span className="font-medium text-[#17202F] tabular-nums">
                    {product.exchangeRate
                      ? formatExchangeRateInfo(
                          product.exchangeRate,
                          product.originalCurrency,
                          displayCurrency,
                          product.exchangeRateTimestamp
                        )
                      : 'Confirmed at checkout'}
                  </span>
                </li>
                <li>
                  · Some import charges may change when your package reaches customs.
                </li>
                <li>
                  · Your final total is calculated at checkout and requires your confirmation before PayPal processes payment.
                </li>
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
