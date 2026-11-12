import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Globe2, ShoppingBag, Sparkles, X } from 'lucide-react';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { Button } from '@/components/common/Button';
import { useCart } from '@/hooks/useCart';
import { useCurrency } from '@/hooks/useCurrency';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { calculateMockCheckout } from '@/mocks/mockCheckout';
import { getCountryName } from '@/utils/currencyFormatter';
import { drawerSlideRightVariants, modalOverlayVariants } from '@/animations/variants';
import { usePrefersReducedMotion } from '@/animations/animationUtils';

export function CartDrawer() {
  const navigate = useNavigate();
  const { useMockApi } = useAppContext();
  const { isAuthenticated } = useAuth();
  const { destinationCountry, preferredCurrency } = useCurrency();
  const {
    cartItems,
    cartCount,
    cartDrawerOpen,
    setCartDrawerOpen,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    selectProductForCheckout,
  } = useCart();

  const { estimatesByKey, summary, merchantCount } = useMemo(() => {
    const map = {};
    let hasFullEstimate = cartItems.length > 0;
    let itemsSubtotal = 0;
    let shippingTotal = 0;
    let dutiesTotal = 0;
    let landedTotal = 0;
    let totalUnits = 0;
    const origins = new Set();

    for (const item of cartItems) {
      const qty = Math.max(1, Number(item.quantity) || 1);
      totalUnits += qty;
      const p = item.product;
      origins.add(`${p?.merchant?.country || 'US'}::${p?.merchant?.name || 'Merchant'}`);

      let line = null;
      if (useMockApi) {
        const calc = calculateMockCheckout({
          product: p,
          quantity: qty,
          destinationCountry,
          targetCurrency: preferredCurrency,
        });
        if (calc?.shippingAvailable) {
          line = {
            convertedSubtotal: calc.breakdown.productPrice,
            shippingCost: calc.breakdown.shippingCharges,
            dutiesCost: Number(
              (calc.breakdown.estimatedDuties + calc.breakdown.estimatedTaxes).toFixed(2)
            ),
            totalLanded: calc.breakdown.totalPayable,
          };
        }
      } else if (
        p?.targetCurrency === preferredCurrency &&
        typeof p?.convertedPrice === 'number'
      ) {
        const sub = Number((p.convertedPrice * qty).toFixed(2));
        const ship = typeof p.shippingCost === 'number' ? p.shippingCost : null;
        const duty =
          typeof p.estimatedDutiesAndTaxes === 'number'
            ? Number((p.estimatedDutiesAndTaxes * qty).toFixed(2))
            : 0;
        const total = ship !== null ? Number((sub + ship + duty).toFixed(2)) : null;
        line = {
          convertedSubtotal: sub,
          shippingCost: ship,
          dutiesCost: duty,
          totalLanded: total,
        };
      }

      map[item.cartKey] = line;
      if (line && line.totalLanded != null) {
        itemsSubtotal += line.convertedSubtotal || 0;
        shippingTotal += line.shippingCost || 0;
        dutiesTotal += line.dutiesCost || 0;
        landedTotal += line.totalLanded || 0;
      } else {
        hasFullEstimate = false;
      }
    }

    return {
      estimatesByKey: map,
      merchantCount: origins.size,
      summary: {
        hasFullEstimate,
        itemsSubtotal: Number(itemsSubtotal.toFixed(2)),
        shippingTotal: Number(shippingTotal.toFixed(2)),
        dutiesTotal: Number(dutiesTotal.toFixed(2)),
        landedTotal: Number(landedTotal.toFixed(2)),
        totalUnits,
      },
    };
  }, [cartItems, destinationCountry, preferredCurrency, useMockApi]);

  if (!isAuthenticated || !cartDrawerOpen) {
    return null;
  }

  const handleCheckoutItem = (item) => {
    selectProductForCheckout(item.product, item.quantity);
    setCartDrawerOpen(false);
    navigate('/checkout');
  };

  const handleProceedPrimaryCheckout = () => {
    if (cartItems.length === 0) return;
    handleCheckoutItem(cartItems[0]);
  };

  const prefersReduced = usePrefersReducedMotion();

  return (
    <AnimatePresence>
      {cartDrawerOpen && (
        <div
          className="fixed inset-0 z-[60] flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Global Shopping Cart"
        >
          {/* Backdrop overlay */}
          <motion.div
            variants={modalOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-[#17202F]/45 backdrop-blur-[2px]"
            onClick={() => setCartDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <motion.aside
            variants={drawerSlideRightVariants}
            initial={prefersReduced ? false : 'hidden'}
            animate="visible"
            exit={prefersReduced ? false : 'exit'}
            className="relative z-10 flex h-full w-full max-w-[440px] flex-col bg-[#F7F8FA] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E5E7EB] bg-white px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-[18px] w-[18px] text-[#172554]" />
                  <h2 className="text-[16px] font-[680] tracking-tight text-[#17202F]">
                    Global Cart ({cartCount})
                  </h2>
                </div>
                <p className="mt-0.5 text-[11.5px] text-[#697586]">
                  Delivering to {getCountryName(destinationCountry)} ({destinationCountry}) · Currency{' '}
                  <strong className="font-[600] text-[#17202F]">{preferredCurrency}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {cartItems.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-[12px] font-medium text-[#697586] hover:text-[#DC2626]"
                  >
                    Clear
                  </button>
                ) : null}
                <button
                  type="button"
                  aria-label="Close shopping cart"
                  onClick={() => setCartDrawerOpen(false)}
                  className="rounded-md border border-[#E5E7EB] bg-white p-1.5 text-[#697586] hover:text-[#17202F]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {cartItems.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-[#E5E7EB] bg-white px-6 py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F3F6] text-[#172554]">
                    <Globe2 className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-[16px] font-[650] text-[#17202F]">
                    Your cart is empty
                  </h3>
                  <p className="mt-1.5 max-w-[280px] text-[13px] leading-relaxed text-[#697586]">
                    Browse electronics, fashion, coffee gear, K-beauty, or books with shipping and est. import fees shown upfront.
                  </p>
                  <div className="mt-5 flex flex-col gap-2 w-full max-w-[240px]">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => {
                        setCartDrawerOpen(false);
                        navigate('/results');
                      }}
                      className="bg-[#172554] text-[13px] hover:bg-[#1E3A8A]"
                    >
                      Browse catalogue
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCartDrawerOpen(false);
                        navigate('/assistant');
                      }}
                      className="gap-1.5 text-[13px]"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#465BE5]" />
                      Ask Shopping Assistant
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <CartItem
                      key={item.cartKey}
                      item={item}
                      lineEstimate={estimatesByKey[item.cartKey]}
                      preferredCurrency={preferredCurrency}
                      onUpdateQuantity={updateCartItemQuantity}
                      onRemove={removeFromCart}
                      onCheckoutItem={handleCheckoutItem}
                      onNavigate={() => setCartDrawerOpen(false)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Summary footer */}
            {cartItems.length > 0 ? (
              <CartSummary
                summary={summary}
                preferredCurrency={preferredCurrency}
                merchantCount={merchantCount}
                onProceedCheckout={handleProceedPrimaryCheckout}
                onContinueShopping={() => setCartDrawerOpen(false)}
              />
            ) : null}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

