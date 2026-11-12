import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Home as HomeIcon, Lock } from 'lucide-react';
import { useProductDetail } from '@/hooks/useProducts';
import { useAppContext } from '@/context/AppContext';
import { useCartContext } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { checkShipping } from '@/services/shippingService';
import { ProductDetails } from '@/components/products/ProductDetails';
import { DeliveryEstimate } from '@/components/checkout/DeliveryEstimate';
import { CurrencyDetails } from '@/components/checkout/CurrencyDetails';
import { Loader } from '@/components/common/Loader';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Button } from '@/components/common/Button';

export function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { destinationCountry, preferredCurrency, useMockApi } = useAppContext();
  const { selectProductForCheckout } = useCartContext();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const { product, loading, error, refetch } = useProductDetail(id);
  const [quantity, setQuantity] = useState(1);
  const [shippingInfo, setShippingInfo] = useState(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState(null);
  const [shippingAttempt, setShippingAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    if (!product) return;

    setShippingLoading(true);
    setShippingError(null);
    checkShipping({
      productId: product.id,
      originCountry: product.merchant?.country,
      destinationCountry,
      targetCurrency: preferredCurrency,
      quantity,
    })
      .then((res) => {
        if (active) setShippingInfo(res);
      })
      .catch((err) => {
        if (active) {
          setShippingInfo(null);
          setShippingError(err?.message || 'Unable to verify live shipping options.');
        }
      })
      .finally(() => {
        if (active) setShippingLoading(false);
      });

    return () => {
      active = false;
    };
  }, [product, destinationCountry, preferredCurrency, quantity, useMockApi, shippingAttempt]);

  const handleBuyNow = () => {
    if (!product) return;
    if (!isAuthenticated) {
      showToast({
        title: 'Sign in required',
        description: 'Please sign in to buy items or view checkout totals.',
        tone: 'info',
      });
      navigate('/login');
      return;
    }
    selectProductForCheckout(product, quantity);
    navigate('/checkout');
  };

  if (loading) {
    return (
      <Loader
        fullScreen
        label="Loading product details..."
        sublabel="Fetching merchant pricing, shipping routes & customs estimates"
      />
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 space-y-4">
        <ErrorMessage
          title="Product not available"
          message={error || "We couldn't find this product."}
          onRetry={refetch}
          action={
            <Button type="button" variant="outline" size="sm" onClick={() => navigate('/results')}>
              Back to Discover
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="zen-container space-y-8 py-8 sm:py-10">
      {/* Rich Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12.5px] text-[#697586]">
          <Link to="/" className="inline-flex items-center gap-1 hover:text-[#172554] transition-colors">
            <HomeIcon className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>
          <ChevronRight className="h-3 w-3 text-[#CBD5E1]" />
          <Link to="/results" className="hover:text-[#172554] transition-colors">
            Discover
          </Link>
          {product.categorySlug || product.category ? (
            <>
              <ChevronRight className="h-3 w-3 text-[#CBD5E1]" />
              <Link
                to={`/results?category=${encodeURIComponent(product.categorySlug || product.category)}`}
                className="hover:text-[#172554] transition-colors"
              >
                {product.category}
              </Link>
            </>
          ) : null}
          <ChevronRight className="h-3 w-3 text-[#CBD5E1]" />
          <span className="font-semibold text-[#17202F] truncate max-w-[200px] sm:max-w-xs">
            {product.shortTitle || product.title}
          </span>
        </nav>
        <span className="text-[11.5px] text-[#697586] tabular-nums">
          Item ref · {product.id}
        </span>
      </div>

      {shippingError && (
        <ErrorMessage
          title="Shipping check unavailable"
          message={shippingError}
          onRetry={() => setShippingAttempt((a) => a + 1)}
        />
      )}

      <ProductDetails
        product={product}
        shippingInfo={shippingInfo}
        shippingLoading={shippingLoading}
        destinationCountry={destinationCountry}
        preferredCurrency={preferredCurrency}
        quantity={quantity}
        onQuantityChange={setQuantity}
        onBuyNow={handleBuyNow}
        onAskAssistant={() =>
          navigate(
            `/assistant?prompt=${encodeURIComponent(
              `Tell me if ${product.shortTitle || product.title} from ${product.merchant?.name} is a good deal to ship to ${destinationCountry}.`
            )}`
          )
        }
      />

      {/* Shipping & FX Intelligence */}
      {isAuthenticated ? (
        <div className="grid grid-cols-1 gap-6 border-t border-[#E6E5E0] pt-8 lg:grid-cols-2">
          <DeliveryEstimate
            originCountry={product.merchant?.country}
            destinationCountry={destinationCountry}
            shippingOption={shippingInfo?.defaultOption}
            shippingAvailable={shippingInfo ? shippingInfo.available : product.shippingAvailable}
            unavailableReason={shippingInfo?.reason || product.unavailableReason}
          />
          <CurrencyDetails
            fromCurrency={product.originalCurrency}
            toCurrency={preferredCurrency}
            exchangeRate={product.exchangeRate}
            timestamp={new Date().toISOString()}
          />
        </div>
      ) : (
        <div className="border-t border-[#E6E5E0] pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#E5E7EB] bg-white p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#F1F3F6] text-[#465BE5]">
                <Lock className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-[#17202F]">
                  Delivery details &amp; currency conversion are locked for guests
                </h2>
                <p className="max-w-xl text-xs leading-relaxed text-[#697586]">
                  Products display the seller&apos;s native currency ({product.originalCurrency || 'USD'}) before sign-in. Sign in to view converted prices, live exchange rates, estimated delivery timelines, and import fees.
                </p>
              </div>
            </div>
            <Link
              to="/login"
              className="inline-flex h-9 items-center rounded-md bg-[#172554] px-4 text-xs font-semibold text-white hover:bg-[#1E3A8A]"
            >
              Sign in to view details
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default Product;
