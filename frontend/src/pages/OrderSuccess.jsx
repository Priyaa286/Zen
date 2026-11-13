import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  FlaskConical,
  Receipt,
  RefreshCw,
  Truck,
  XCircle,
} from 'lucide-react';
import { useCartContext } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { getOrderById } from '@/services/orderService';
import { Button } from '@/components/common/Button';
import { Loader } from '@/components/common/Loader';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { ZenLogo } from '@/components/common/ZenLogo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatCurrency } from '@/utils/currencyFormatter';
import { SEOHead } from '@/components/common/SEOHead';

export function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { activeOrder, setActiveOrder, resetCheckoutState } = useCartContext();
  const { showToast } = useToast();

  const urlOrderId = searchParams.get('orderId');
  const initialOrder = location.state?.order || activeOrder || null;

  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(!initialOrder && Boolean(urlOrderId));
  const [error, setError] = useState(null);

  const fetchOrder = useCallback(
    async (id) => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const fetched = await getOrderById(id);
        setOrder(fetched);
        setActiveOrder(fetched);
      } catch (err) {
        setError(err?.message || 'Could not retrieve order verification details.');
      } finally {
        setLoading(false);
      }
    },
    [setActiveOrder]
  );

  useEffect(() => {
    if (location.state?.order) {
      setOrder(location.state.order);
      return;
    }
    if (urlOrderId && (!activeOrder || activeOrder.orderId !== urlOrderId)) {
      fetchOrder(urlOrderId);
    }
  }, [location.state?.order, urlOrderId, activeOrder, fetchOrder]);

  const handleCopy = async (label, value) => {
    if (!value) return;
    try {
      await navigator.clipboard?.writeText(String(value));
      showToast({
        title: `${label} copied`,
        description: String(value),
        tone: 'success',
        duration: 2400,
      });
    } catch {
      showToast({
        title: 'Copy unavailable',
        description: `Select manually: ${value}`,
        tone: 'info',
      });
    }
  };

  if (loading) {
    return (
      <Loader
        fullScreen
        label="Verifying PayPal order status..."
        sublabel="Confirming capture reference with backend"
      />
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 space-y-4">
        <ErrorMessage
          title="Order Details Unavailable"
          message={error || 'No recent order confirmation was found in this session.'}
          onRetry={urlOrderId ? () => fetchOrder(urlOrderId) : undefined}
          action={
            <Button type="button" variant="primary" size="sm" onClick={() => navigate('/assistant')}>
              Start Shopping
            </Button>
          }
        />
      </div>
    );
  }

  const status = String(order.status || 'PENDING').toUpperCase();
  const isCompleted = status === 'COMPLETED' || status === 'CAPTURED';
  const isPending = status === 'PENDING' || status === 'IN_PROGRESS';

  const handleContinueShopping = () => {
    resetCheckoutState(isCompleted);
    navigate('/assistant');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
      <SEOHead
        title="Order Confirmation & Receipt"
        robots="noindex, nofollow"
      />
      {order.isMock && (
        <Alert variant="warning">
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-[#C98A1C]" />
          <div>
            <AlertTitle>Mock Sandbox Preview order</AlertTitle>
            <AlertDescription>
              Generated in offline Mock Preview mode for flow verification. Configure{' '}
              <span className="font-medium text-[#151923]">VITE_USE_MOCK_API=false</span> with the
              FastAPI backend running for live PayPal capture verification.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Status Header Receipt */}
      <Card className="border-[#E6E5E0] p-6 sm:p-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex w-full items-center justify-between border-b border-[#E6E5E0] pb-4">
            <ZenLogo size="sm" alt="Zen Global" />
            <span className="zen-eyebrow text-[#747987]">Official Order Receipt</span>
          </div>

          <div
            className={
              isCompleted
                ? 'flex h-14 w-14 items-center justify-center rounded-full border border-[#168B66]/25 bg-[#168B66]/[0.08] text-[#168B66]'
                : isPending
                ? 'flex h-14 w-14 items-center justify-center rounded-full border border-[#C98A1C]/30 bg-[#C98A1C]/[0.1] text-[#C98A1C]'
                : 'flex h-14 w-14 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600'
            }
          >
            {isCompleted ? (
              <CheckCircle2 className="h-7 w-7" />
            ) : isPending ? (
              <Clock className="h-7 w-7" />
            ) : (
              <XCircle className="h-7 w-7" />
            )}
          </div>

          <div className="space-y-2">
            <Badge
              variant={isCompleted ? 'success' : isPending ? 'warning' : 'destructive'}
            >
              {isCompleted
                ? 'Payment Verified'
                : isPending
                ? 'Pending Verification'
                : 'Payment Failed'}
            </Badge>

            <h1 className="text-2xl font-semibold tracking-tight text-[#151923] sm:text-3xl">
              {isCompleted
                ? 'Order confirmed'
                : isPending
                ? 'Payment under review'
                : 'Payment could not be completed'}
            </h1>

            <p className="mx-auto max-w-lg text-sm leading-relaxed text-[#747987]">
              {order.statusReason ||
                (isCompleted
                  ? 'Your order is confirmed and has been sent to the seller for dispatch.'
                  : isPending
                  ? 'PayPal is still verifying this payment. Check status again in a moment.'
                  : 'No payment was taken. Return to checkout if you would like to try again.')}
            </p>
          </div>
        </div>

        {/* PayPal & Zen References */}
        <div className="mt-7 grid grid-cols-1 gap-3 border-t border-[#E6E5E0] pt-6 sm:grid-cols-2">
          <div className="flex items-start justify-between gap-2 rounded-md border border-[#E6E5E0] bg-[#F8F7F4] px-3.5 py-3 text-xs">
            <div className="min-w-0">
              <p className="zen-eyebrow text-[#747987]">
                Zen order reference
              </p>
              <p className="mt-1 break-all font-[550] text-xs text-[#151923] tabular-nums">
                {order.orderId || 'Unavailable'}
              </p>
            </div>
            {order.orderId && (
              <button
                type="button"
                onClick={() => handleCopy('Zen order ID', order.orderId)}
                aria-label="Copy Zen order ID"
                className="shrink-0 rounded p-1 text-[#747987] transition-colors hover:bg-white hover:text-[#151923]"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-start justify-between gap-2 rounded-md border border-[#E6E5E0] bg-[#F8F7F4] px-3.5 py-3 text-xs">
            <div className="min-w-0">
              <p className="zen-eyebrow text-[#747987]">
                PayPal transaction ID
              </p>
              <p className="mt-1 break-all font-[550] text-xs text-[#151923] tabular-nums">
                {order.paypalTransactionId || order.paypalOrderId || 'Pending'}
              </p>
            </div>
            {(order.paypalTransactionId || order.paypalOrderId) && (
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    'PayPal transaction ID',
                    order.paypalTransactionId || order.paypalOrderId
                  )
                }
                aria-label="Copy PayPal transaction ID"
                className="shrink-0 rounded p-1 text-[#747987] transition-colors hover:bg-white hover:text-[#151923]"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Order Summary Card */}
      <Card className="border-[#E6E5E0]">
        <CardHeader className="border-b border-[#E6E5E0] pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#151923]">
            <Receipt className="h-4 w-4 text-[#465BE6]" />
            Order details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-5 text-sm">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="space-y-0.5">
              <p className="font-semibold text-[#151923]">
                {order.productTitle || order.product?.title || 'International Order'}
              </p>
              <p className="text-xs text-[#747987] tabular-nums">
                Seller: {order.merchantName || order.product?.merchant?.name || 'Seller'} · Qty:{' '}
                {order.quantity}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="zen-eyebrow text-[#747987]">
                Total amount
              </p>
              <p className="text-xl font-semibold tracking-tight text-[#151923] tabular-nums">
                {order.totalAmount !== null
                  ? formatCurrency(order.totalAmount, order.currency)
                  : 'Unavailable'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 border-t border-[#E6E5E0] pt-4 sm:grid-cols-2 text-xs">
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 font-medium text-[#151923]">
                <Truck className="h-3.5 w-3.5 text-[#465BE6]" />
                Delivery estimate
              </p>
              <p className="text-[#747987]">
                {order.deliveryEstimate || '5–8 business days'}
              </p>
            </div>

            {order.shippingAddress && (
              <div className="space-y-1">
                <p className="font-medium text-[#151923]">Shipping destination</p>
                <p className="text-[#747987]">
                  {order.shippingAddress.fullName} · {order.shippingAddress.city},{' '}
                  {order.shippingAddress.countryCode}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        {isPending && order.orderId && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => fetchOrder(order.orderId)}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Order Status
          </Button>
        )}

        {!isCompleted && !isPending && (
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => navigate('/checkout')}
          >
            Return to Checkout
          </Button>
        )}

        <Button
          type="button"
          variant={isCompleted ? 'primary' : 'outline'}
          size="lg"
          onClick={handleContinueShopping}
        >
          <span>Continue Shopping</span>
          <ArrowRight className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => {
            resetCheckoutState(isCompleted);
            navigate('/results');
          }}
        >
          Browse Catalog
        </Button>
      </div>
    </div>
  );
}

export default OrderSuccess;
