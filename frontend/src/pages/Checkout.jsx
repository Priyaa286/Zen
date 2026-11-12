import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useCartContext } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { calculateCheckout } from '@/services/paymentService';
import { validateShippingForm } from '@/utils/validators';
import { ShippingDetails } from '@/components/checkout/ShippingDetails';
import { CostBreakdown } from '@/components/checkout/CostBreakdown';
import { CurrencyDetails } from '@/components/checkout/CurrencyDetails';
import { DeliveryEstimate } from '@/components/checkout/DeliveryEstimate';
import { PurchaseApproval } from '@/components/checkout/PurchaseApproval';
import { PayPalButton } from '@/components/checkout/PayPalButton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Button } from '@/components/common/Button';
import { ZenLogo } from '@/components/common/ZenLogo';
import { cn } from '@/utils/cn';

function CheckoutStep({ number, label, done = false, active = false }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums',
          done
            ? 'bg-[#168B66] text-white'
            : active
            ? 'bg-[#465BE6] text-white'
            : 'border border-[#E6E5E0] bg-white text-[#747987]'
        )}
      >
        {done ? <Check className="h-3 w-3" /> : number}
      </span>
      <span
        className={cn(
          'font-medium',
          done || active ? 'text-[#151923]' : 'text-[#747987]'
        )}
      >
        {label}
      </span>
    </div>
  );
}

export function Checkout() {
  const navigate = useNavigate();
  const {
    destinationCountry,
    preferredCurrency,
    setDestinationCountry,
    useMockApi,
  } = useAppContext();

  const {
    selectedProduct,
    quantity,
    updateQuantity,
    shippingAddress,
    setShippingAddress,
    selectedShippingOptionId,
    setSelectedShippingOptionId,
    checkoutSummary,
    setCheckoutSummary,
    purchaseApproved,
    setPurchaseApproved,
    paymentStatus,
    setPaymentStatus,
    setActiveOrder,
  } = useCartContext();
  const { user, isAuthenticated, addSavedAddress, refreshOrders } = useAuth();

  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState(null);
  const [calcAttempt, setCalcAttempt] = useState(0);
  const [touchedFields, setTouchedFields] = useState(false);

  // Prefill empty shipping fields from authenticated user profile / default address
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const defaultAddr =
      user.savedAddresses?.find((addr) => addr.isDefault) || user.savedAddresses?.[0] || null;
    setShippingAddress((prev) => {
      const next = { ...prev };
      let changed = false;
      const fillIfBlank = (field, val) => {
        if (!next[field] && val) {
          next[field] = val;
          changed = true;
        }
      };
      fillIfBlank('fullName', defaultAddr?.fullName || user.fullName);
      fillIfBlank('email', defaultAddr?.email || user.email);
      fillIfBlank('phone', defaultAddr?.phone);
      fillIfBlank('addressLine1', defaultAddr?.addressLine1);
      fillIfBlank('city', defaultAddr?.city);
      fillIfBlank('state', defaultAddr?.state);
      fillIfBlank('postalCode', defaultAddr?.postalCode);
      return changed ? next : prev;
    });
  }, [isAuthenticated, user, setShippingAddress]);

  // Keep shipping country synced with global destination preference
  useEffect(() => {
    if (destinationCountry && shippingAddress.countryCode !== destinationCountry) {
      setShippingAddress((prev) => ({ ...prev, countryCode: destinationCountry }));
    }
  }, [destinationCountry, shippingAddress.countryCode, setShippingAddress]);

  // Fetch authoritative landed cost breakdown from backend (or mock service)
  useEffect(() => {
    if (!selectedProduct?.id) return;

    let active = true;
    setCalcLoading(true);
    setCalcError(null);

    calculateCheckout({
      productId: selectedProduct.id,
      quantity,
      destinationCountry,
      targetCurrency: preferredCurrency,
      shippingOptionId: selectedShippingOptionId,
      shippingAddress,
    })
      .then((res) => {
        if (!active) return;
        setCheckoutSummary(res);
      })
      .catch((err) => {
        if (!active) return;
        setCheckoutSummary(null);
        setCalcError(err?.message || 'Unable to calculate checkout breakdown.');
      })
      .finally(() => {
        if (active) setCalcLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    selectedProduct?.id,
    quantity,
    destinationCountry,
    preferredCurrency,
    selectedShippingOptionId,
    useMockApi,
    calcAttempt,
    setCheckoutSummary,
  ]);

  const validation = useMemo(
    () => validateShippingForm(shippingAddress),
    [shippingAddress]
  );

  const handleFieldChange = (field, value) => {
    setTouchedFields(true);
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleCountrySelect = (code) => {
    setTouchedFields(true);
    setDestinationCountry(code);
    setShippingAddress((prev) => ({ ...prev, countryCode: code }));
  };

  const handleOrderComplete = async (verifiedOrder) => {
    setActiveOrder(verifiedOrder);
    if (isAuthenticated) {
      addSavedAddress?.(shippingAddress).catch(() => {});
      await refreshOrders?.().catch(() => {});
    }
    navigate(`/order-success?orderId=${encodeURIComponent(verifiedOrder.orderId || '')}`, {
      state: { order: verifiedOrder },
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  if (!selectedProduct) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={ShoppingBag}
          title="No product selected for checkout"
          description="Pick an item from the catalogue or ask the Shopping Assistant for options to see full pricing and delivery details."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button type="button" variant="primary" onClick={() => navigate('/assistant')}>
                <Sparkles className="h-4 w-4" />
                Open Shopping Assistant
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/results')}>
                Browse catalogue
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  const isMerchantVerified = Boolean(selectedProduct.merchant?.verified);

  return (
    <div className="zen-container space-y-8 py-10">
      {/* Editorial Header + Step Indicator */}
      <div className="flex flex-col gap-5 border-b border-[#E6E5E0] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Link
            to={`/product/${selectedProduct.id}`}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#747987] transition-colors hover:text-[#151923]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to product details
          </Link>
          <div className="flex items-center gap-2.5 pt-1">
            <ZenLogo size="xs" alt="Zen Global" />
            <span aria-hidden="true" className="h-3.5 w-px bg-[#E6E5E0]" />
            <p className="zen-eyebrow text-[#747987]">Checkout &amp; PayPal</p>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#151923] sm:text-3xl">
            Review your order.
          </h1>
          <p className="text-sm text-[#747987]">
            Check the delivery details before continuing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <CheckoutStep number={1} label="Shipping" done={validation.isValid} active={!validation.isValid} />
          <span className="h-px w-4 bg-[#E6E5E0]" />
          <CheckoutStep
            number={2}
            label="Approve total"
            done={purchaseApproved}
            active={validation.isValid && !purchaseApproved}
          />
          <span className="h-px w-4 bg-[#E6E5E0]" />
          <CheckoutStep
            number={3}
            label="PayPal capture"
            done={paymentStatus === 'completed'}
            active={validation.isValid && purchaseApproved}
          />
        </div>
      </div>

      {calcError && (
        <ErrorMessage
          title="Checkout Calculation Error"
          message={calcError}
          onRetry={() => setCalcAttempt((c) => c + 1)}
        />
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Shipping Form, Logistics & Mandatory Approval */}
        <div className="space-y-6 lg:col-span-7">
          {/* Multi-Vendor Fulfillment Package Card */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F7F8FA] text-[#172554] border border-[#E5E7EB]">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#17202F]">
                    Merchant Package 1 of 1
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    Verified Merchant
                  </span>
                </div>
                <p className="text-xs text-[#697586] mt-0.5">
                  Direct dispatch from <span className="font-semibold text-[#17202F]">{selectedProduct?.merchant?.name || selectedProduct?.merchantName || 'Tokyo Optics & Craft'}</span> • Warehouse: <span className="font-semibold text-[#17202F]">{selectedProduct?.originCountry || 'JP'}</span>
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right text-xs border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E5E7EB]">
              <span className="text-[#697586]">Seller Currency</span>
              <p className="font-bold text-[#17202F] tabular-nums">
                {selectedProduct?.originalCurrency || 'JPY'} {selectedProduct?.originalPrice?.toLocaleString()}
              </p>
            </div>
          </div>

          <ShippingDetails
            form={shippingAddress}
            errors={touchedFields ? validation.errors : {}}
            onChange={handleFieldChange}
            onCountryChange={handleCountrySelect}
            shippingOptions={checkoutSummary?.availableShippingOptions || []}
            selectedShippingOptionId={
              selectedShippingOptionId || checkoutSummary?.shippingOption?.id
            }
            onShippingOptionSelect={(optId) => {
              setSelectedShippingOptionId(optId);
              setPurchaseApproved(false);
            }}
            targetCurrency={preferredCurrency}
            disabled={paymentStatus === 'creating_order' || paymentStatus === 'capturing'}
          />

          {checkoutSummary && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <DeliveryEstimate
                originCountry={checkoutSummary.originCountry}
                destinationCountry={checkoutSummary.destinationCountry}
                shippingOption={checkoutSummary.shippingOption}
                shippingAvailable={checkoutSummary.shippingAvailable}
                unavailableReason={checkoutSummary.unavailableReason}
              />
              <CurrencyDetails
                fromCurrency={checkoutSummary.originalCurrency}
                toCurrency={checkoutSummary.targetCurrency}
                exchangeRate={checkoutSummary.exchangeRate}
                timestamp={checkoutSummary.exchangeRateTimestamp}
                conversionFee={checkoutSummary.breakdown?.currencyConversionFee}
              />
            </div>
          )}

          <PurchaseApproval
            approved={purchaseApproved}
            onApprovedChange={(checked) => {
              if (!validation.isValid) {
                setTouchedFields(true);
              }
              setPurchaseApproved(checked);
            }}
            totalAmount={checkoutSummary?.breakdown?.totalPayable}
            currency={checkoutSummary?.targetCurrency || preferredCurrency}
            disabled={calcLoading || !checkoutSummary?.shippingAvailable}
            shippingValid={validation.isValid}
          />
        </div>

        {/* Right Column: Sticky Financial Statement & Restrained PayPal Settlement */}
        <div className="lg:sticky lg:top-24 lg:col-span-5 lg:self-start">
          <div className="overflow-hidden rounded-md border border-[#E6E5E0] bg-white">
            <CostBreakdown
              summary={checkoutSummary}
              product={selectedProduct}
              quantity={quantity}
              onQuantityChange={updateQuantity}
              loading={calcLoading}
              embedded
            />

            <PayPalButton
              summary={checkoutSummary}
              product={selectedProduct}
              quantity={quantity}
              destinationCountry={destinationCountry}
              preferredCurrency={preferredCurrency}
              shippingAddress={shippingAddress}
              approved={purchaseApproved}
              shippingValid={validation.isValid}
              useMockApi={useMockApi}
              paymentStatus={paymentStatus}
              onStatusChange={setPaymentStatus}
              onOrderComplete={handleOrderComplete}
              embedded={Boolean(checkoutSummary || calcLoading)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
