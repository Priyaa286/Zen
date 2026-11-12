import { useRef, useState } from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import {
  AlertCircle,
  FlaskConical,
  Lock,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/common/Button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  captureCheckoutOrder,
  createCheckoutOrder,
} from '@/services/paymentService';

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'sb';

function LivePayPalSdkCheckout({
  summary,
  product,
  quantity,
  destinationCountry,
  preferredCurrency,
  shippingAddress,
  approved,
  disabled,
  paymentStatus,
  onStatusChange,
  onOrderComplete,
  onError,
  onCancelMessage,
  userId = null,
}) {
  const orderIdsByPaypalRef = useRef(new Map());
  const activeOrderIdRef = useRef(null);
  const submittingRef = useRef(false);
  const settlementCurrency = summary?.breakdown?.paypalSettlementCurrency || 'USD';

  const isBusy =
    paymentStatus === 'creating_order' ||
    paymentStatus === 'capturing' ||
    paymentStatus === 'completed';

  return (
    <PayPalScriptProvider
      key={`${PAYPAL_CLIENT_ID}-${settlementCurrency}`}
      options={{
        clientId: PAYPAL_CLIENT_ID,
        currency: settlementCurrency,
        intent: 'capture',
      }}
    >
      <div className="space-y-3">
        {isBusy && paymentStatus !== 'completed' && (
          <Alert variant="info">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <AlertTitle>
                {paymentStatus === 'creating_order'
                  ? 'Creating verified backend order...'
                  : 'Verifying & capturing payment with PayPal...'}
              </AlertTitle>
              <AlertDescription>
                Please do not close or refresh this window.
              </AlertDescription>
            </div>
          </Alert>
        )}

        <PayPalButtons
          style={{
            layout: 'vertical',
            color: 'black',
            shape: 'rect',
            label: 'paypal',
            height: 44,
          }}
          disabled={disabled || !approved || isBusy}
          forceReRender={[
            summary?.checkoutSessionId,
            settlementCurrency,
            approved,
            disabled,
          ]}
          createOrder={async () => {
            if (submittingRef.current || paymentStatus === 'completed') {
              throw new Error('Checkout submission is already in progress.');
            }
            submittingRef.current = true;
            onError(null);
            onCancelMessage(null);
            onStatusChange('creating_order');
            try {
              const res = await createCheckoutOrder({
                checkoutSessionId: summary.checkoutSessionId,
                productId: product.id,
                quantity,
                destinationCountry,
                targetCurrency: preferredCurrency,
                shippingOptionId: summary.shippingOption?.id,
                shippingAddress,
                userApprovedAmount: approved,
              });
              activeOrderIdRef.current = res.orderId;
              orderIdsByPaypalRef.current.set(res.paypalOrderId, res.orderId);
              onStatusChange('awaiting_paypal');
              return res.paypalOrderId;
            } catch (err) {
              onStatusChange('failed');
              onError(err?.message || 'Unable to initialize PayPal order.');
              throw err;
            } finally {
              submittingRef.current = false;
            }
          }}
          onApprove={async (data) => {
            if (submittingRef.current) return;
            submittingRef.current = true;
            onError(null);
            onStatusChange('capturing');
            try {
              const matchedOrderId =
                orderIdsByPaypalRef.current.get(data.orderID) ?? activeOrderIdRef.current;
              const verifiedOrder = await captureCheckoutOrder({
                paypalOrderId: data.orderID,
                orderId: matchedOrderId,
                checkoutSummary: summary,
                product,
                shippingAddress,
                userId,
              });
              onStatusChange(
                verifiedOrder.status === 'COMPLETED' || verifiedOrder.status === 'CAPTURED'
                  ? 'completed'
                  : verifiedOrder.status === 'PENDING'
                  ? 'pending'
                  : 'failed'
              );
              onOrderComplete(verifiedOrder);
            } catch (err) {
              onStatusChange('failed');
              onError(err?.message || 'Backend payment capture verification failed.');
            } finally {
              submittingRef.current = false;
            }
          }}
          onCancel={() => {
            submittingRef.current = false;
            onStatusChange('cancelled');
            onCancelMessage(
              'PayPal checkout was cancelled before completion. No payment was captured.'
            );
          }}
          onError={(err) => {
            submittingRef.current = false;
            onStatusChange('failed');
            onError(
              err?.message ||
                'PayPal encountered an error initializing checkout. Verify your PayPal Sandbox client ID and backend connection.'
            );
          }}
        />
      </div>
    </PayPalScriptProvider>
  );
}

export function PayPalButton({
  summary,
  product,
  quantity,
  destinationCountry,
  preferredCurrency,
  shippingAddress,
  approved,
  shippingValid,
  useMockApi,
  paymentStatus,
  onStatusChange,
  onOrderComplete,
  embedded = false,
}) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [errorMsg, setErrorMsg] = useState(null);
  const [cancelMsg, setCancelMsg] = useState(null);

  const mockSubmittingRef = useRef(false);
  const isLocked = !approved || !shippingValid || !summary || !summary.shippingAvailable;
  const isSubmitting =
    paymentStatus === 'creating_order' ||
    paymentStatus === 'capturing' ||
    paymentStatus === 'completed';

  const handleMockSandboxFlow = async (simulatedOutcome) => {
    if (isLocked || isSubmitting || mockSubmittingRef.current) return;
    setErrorMsg(null);
    setCancelMsg(null);

    if (simulatedOutcome === 'CANCELLED') {
      onStatusChange('cancelled');
      const msg = 'Mock Sandbox: Checkout cancelled by buyer. No payment was captured.';
      setCancelMsg(msg);
      showToast({ title: 'Checkout cancelled', description: 'No payment was captured.', tone: 'warning' });
      return;
    }

    mockSubmittingRef.current = true;
    onStatusChange('creating_order');
    try {
      const created = await createCheckoutOrder({
        checkoutSessionId: summary.checkoutSessionId,
        productId: product.id,
        quantity,
        destinationCountry,
        targetCurrency: preferredCurrency,
        shippingOptionId: summary.shippingOption?.id,
        shippingAddress,
        userApprovedAmount: approved,
      });

      onStatusChange('capturing');
      const verifiedOrder = await captureCheckoutOrder({
        paypalOrderId: created.paypalOrderId,
        orderId: created.orderId,
        checkoutSummary: summary,
        product,
        shippingAddress,
        simulatedOutcome,
        userId: user?.id || null,
      });

      onStatusChange(
        verifiedOrder.status === 'COMPLETED' ? 'completed' : 'pending'
      );
      onOrderComplete(verifiedOrder);
    } catch (err) {
      onStatusChange('failed');
      const msg = err?.message || 'Mock Sandbox payment capture failed.';
      setErrorMsg(msg);
      showToast({ title: 'Payment simulation failed', description: msg, tone: 'error' });
    } finally {
      mockSubmittingRef.current = false;
    }
  };

  return (
    <div
      className={
        embedded
          ? 'border-t border-[#E6E5E0] bg-[#F8F7F4]/70 p-6 space-y-4'
          : 'rounded-md border border-[#E6E5E0] bg-white p-6 space-y-4'
      }
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-[#151923]" />
          <h4 className="text-[14px] font-[600] text-[#151923]">PayPal Checkout</h4>
        </div>
        <Badge variant={useMockApi ? 'warning' : 'info'}>
          {useMockApi ? 'Sandbox simulation' : 'Live PayPal SDK'}
        </Badge>
      </div>

      {isLocked && (
        <div className="flex items-start gap-2.5 rounded-md border border-[#E6E5E0] bg-white px-3.5 py-3 text-xs text-[#747987]">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8F94A2]" />
          <span>
            {!summary?.shippingAvailable
              ? 'International shipping is unavailable for this destination.'
              : !shippingValid
              ? 'Complete required shipping fields to continue.'
              : 'Confirm mandatory purchase approval to unlock PayPal authorization.'}
          </span>
        </div>
      )}

      {cancelMsg && (
        <Alert variant="warning">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <AlertTitle>Checkout cancelled</AlertTitle>
            <AlertDescription>{cancelMsg}</AlertDescription>
          </div>
        </Alert>
      )}

      {errorMsg && (
        <Alert variant="destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <AlertTitle>Payment error</AlertTitle>
            <AlertDescription>{errorMsg}</AlertDescription>
          </div>
        </Alert>
      )}

      {/* Live FastAPI + PayPal JS SDK Mode */}
      {!useMockApi && (
        <div className={isLocked ? 'pointer-events-none opacity-50' : ''}>
          <LivePayPalSdkCheckout
            summary={summary}
            product={product}
            quantity={quantity}
            destinationCountry={destinationCountry}
            preferredCurrency={preferredCurrency}
            shippingAddress={shippingAddress}
            approved={approved}
            disabled={isLocked}
            paymentStatus={paymentStatus}
            onStatusChange={onStatusChange}
            onOrderComplete={onOrderComplete}
            onError={setErrorMsg}
            onCancelMessage={setCancelMsg}
            userId={user?.id || null}
          />
        </div>
      )}

      {/* Honest Offline Sandbox Simulator */}
      {useMockApi && (
        <div className="space-y-3 rounded-md border border-[#E6E5E0] bg-white p-4">
          <div className="flex items-start gap-2.5 text-xs text-[#151923]">
            <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-[#C98A1C]" />
            <div className="space-y-1">
              <p className="font-[580]">
                Offline Sandbox Preview active
              </p>
              <p className="text-[#747987] leading-relaxed">
                Live capture verification connects via FastAPI (<code className="rounded bg-[#F8F7F4] px-1 py-0.5 text-[11px] font-medium text-[#151923]">/api/checkout/create</code> &amp; <code className="rounded bg-[#F8F7F4] px-1 py-0.5 text-[11px] font-medium text-[#151923]">/capture</code>). Switch to Live mode in the header when connected.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="default"
            size="lg"
            disabled={isLocked || isSubmitting}
            isLoading={isSubmitting}
            loadingText="Authorizing Sandbox Checkout..."
            onClick={() => handleMockSandboxFlow('COMPLETED')}
            className="w-full"
          >
            Preview PayPal Sandbox Checkout (Mock)
          </Button>

          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLocked || isSubmitting}
              onClick={() => handleMockSandboxFlow('PENDING')}
              className="h-8 text-[11px]"
            >
              Test Pending
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLocked || isSubmitting}
              onClick={() => handleMockSandboxFlow('CANCELLED')}
              className="h-8 text-[11px]"
            >
              Test Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLocked || isSubmitting}
              onClick={() => handleMockSandboxFlow('FAILED')}
              className="h-8 text-[11px]"
            >
              Test Failure
            </Button>
          </div>
        </div>
      )}

      <p className="text-center text-[11px] text-[#747987]">
        PayPal Buyer Protection · Your payment will be processed securely through PayPal.
      </p>
    </div>
  );
}

export default PayPalButton;
