import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Award,
  BadgeCheck,
  GitCompareArrows,
  Lock,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ProductImage } from '@/components/common/ProductImage';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAppContext } from '@/context/AppContext';
import { useCartContext } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/utils/currencyFormatter';
import { formatPrice } from '@/utils/formatPrice';

export function ProductComparison({ open, onOpenChange, hideStickyBar = false }) {
  const navigate = useNavigate();
  const { preferredCurrency } = useAppContext();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const {
    comparisonItems,
    removeFromCompare,
    clearCompare,
    selectProductForCheckout,
  } = useCartContext();

  const lowestLandedId = useMemo(() => {
    if (!isAuthenticated) return null;
    const valid = comparisonItems.filter((p) => typeof p.totalLandedCost === 'number');
    if (valid.length < 2) return null;
    return valid.reduce((min, item) =>
      item.totalLandedCost < min.totalLandedCost ? item : min
    ).id;
  }, [comparisonItems, isAuthenticated]);

  if (comparisonItems.length === 0) {
    return null;
  }

  const handleCheckout = (product) => {
    if (!isAuthenticated) {
      onOpenChange(false);
      showToast({
        title: 'Sign in required',
        description: 'Please sign in to buy items or view checkout totals.',
        tone: 'info',
      });
      navigate('/login');
      return;
    }
    onOpenChange(false);
    selectProductForCheckout(product, 1);
    navigate('/checkout');
  };

  return (
    <>
      {/* Sticky Comparison Bar with smooth slide-up entrance */}
      <AnimatePresence>
        {!open && !hideStickyBar && (
          <motion.div
            initial={{ opacity: 0, y: 24, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-4 left-1/2 z-30 w-[94vw] max-w-4xl rounded-md border border-[#2B3040] bg-[#151923] px-4 py-2.5 text-white shadow-elevated"
          >
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 overflow-x-auto">
                <div className="flex items-center gap-2 shrink-0 pr-1 text-xs font-medium text-white">
                  <GitCompareArrows className="h-4 w-4 text-[#8DA2FB]" />
                  <span className="tabular-nums">Compare ({comparisonItems.length}/4)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {comparisonItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-1.5 rounded bg-white/10 px-2.5 py-1 text-xs"
                    >
                      <span className="max-w-[130px] truncate">{item.shortTitle || item.title}</span>
                      <button
                        type="button"
                        onClick={() => removeFromCompare(item.id)}
                        aria-label={`Remove ${item.title} from comparison`}
                        className="rounded p-0.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 justify-end">
                <button
                  type="button"
                  onClick={clearCompare}
                  className="px-2 py-1 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Clear
                </button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => onOpenChange(true)}
                >
                  Compare offers
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Matrix Modal */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompareArrows className="h-4 w-4 text-[#465BE6]" />
              Compare offers side by side
            </DialogTitle>
            <DialogDescription>
              {isAuthenticated
                ? `Compare seller prices, shipping, estimated import charges, and total delivered cost in ${preferredCurrency}.`
                : "Compare offers in each seller's local currency. Sign in to unlock currency conversion and delivery estimates."}
            </DialogDescription>
          </DialogHeader>

          {!isAuthenticated ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#E6E5E0] bg-[#F8F7F4] px-3 py-2 text-xs text-[#697586]">
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-[#465BE6]" />
                Currency conversion and delivery dates are hidden until you sign in.
              </span>
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  navigate('/login');
                }}
                className="font-semibold text-[#465BE6] hover:underline"
              >
                Sign in to unlock
              </button>
            </div>
          ) : null}

          <div className="overflow-x-auto pb-1">
            <table className="w-full min-w-[640px] border-collapse text-left text-xs sm:text-sm tabular-nums">
              <thead>
                <tr className="border-b border-[#E6E5E0]">
                  <th className="w-40 py-3 pr-4 text-[11px] font-semibold uppercase tracking-wider text-[#747987]">
                    Offer
                  </th>
                  {comparisonItems.map((item) => (
                    <th key={item.id} className="min-w-[180px] p-3 align-top">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <ProductImage
                            src={item.imageUrl}
                            alt={item.title}
                            className="h-16 w-20 rounded border border-[#E6E5E0] bg-[#F1EFE9]"
                          />
                          <button
                            type="button"
                            onClick={() => removeFromCompare(item.id)}
                            className="rounded p-1 text-[#8F94A2] hover:bg-[#F8F7F4] hover:text-red-600 transition-colors"
                            title="Remove"
                            aria-label={`Remove ${item.title}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-xs font-semibold text-[#151923] line-clamp-2">
                          {item.shortTitle || item.title}
                        </p>
                        {item.id === lowestLandedId && (
                          <Badge variant="success">
                            <Award className="h-3 w-3" />
                            Lowest est. total
                          </Badge>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E5E0]">
                <tr>
                  <td className="py-3 pr-4 font-medium text-[#747987]">Seller</td>
                  {comparisonItems.map((item) => (
                    <td key={item.id} className="p-3 font-medium text-[#151923]">
                      <span className="inline-flex items-center gap-1.5">
                        {item.merchant?.country ? (
                          <span className="rounded border border-[#E6E5E0] bg-[#F8F7F4] px-1.5 py-0.5 text-[10px] font-semibold text-[#151923]">
                            {item.merchant.country}
                          </span>
                        ) : null}
                        <span>{item.merchant?.name}</span>
                        {item.merchant?.verified && (
                          <BadgeCheck className="h-3.5 w-3.5 text-[#465BE6]" />
                        )}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-[#747987]">Seller price</td>
                  {comparisonItems.map((item) => (
                    <td key={item.id} className="p-3 font-medium text-[#151923]">
                      {formatPrice(item.originalPrice, item.originalCurrency)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-[#747987]">Converted price</td>
                  {comparisonItems.map((item) => (
                    <td key={item.id} className="p-3 text-[#747987]">
                      {isAuthenticated
                        ? item.convertedPrice !== null
                          ? formatCurrency(item.convertedPrice, item.targetCurrency || preferredCurrency)
                          : 'Unavailable'
                        : 'Sign in to view'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-[#747987]">Est. shipping</td>
                  {comparisonItems.map((item) => (
                    <td key={item.id} className="p-3 text-[#747987]">
                      {isAuthenticated
                        ? item.shippingCost !== null
                          ? formatCurrency(item.shippingCost, item.targetCurrency || preferredCurrency)
                          : 'Unavailable'
                        : 'Sign in to view'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-[#747987]">Est. duties &amp; tax</td>
                  {comparisonItems.map((item) => (
                    <td key={item.id} className="p-3 text-[#747987]">
                      {isAuthenticated
                        ? item.estimatedDutiesAndTaxes !== null
                          ? formatCurrency(
                              item.estimatedDutiesAndTaxes,
                              item.targetCurrency || preferredCurrency
                            )
                          : 'At checkout'
                        : 'Sign in to view'}
                    </td>
                  ))}
                </tr>
                <tr className="bg-[#F8F7F4]">
                  <td className="py-3 pr-4 font-semibold text-[#151923]">Estimated delivered cost</td>
                  {comparisonItems.map((item) => (
                    <td key={item.id} className="p-3 text-base font-semibold text-[#465BE6]">
                      {isAuthenticated ? (
                        item.totalLandedCost !== null ? (
                          formatCurrency(item.totalLandedCost, item.targetCurrency || preferredCurrency)
                        ) : (
                          'Unavailable'
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#697586]">
                          <Lock className="h-3 w-3" /> Sign in to view
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-[#747987]">Delivery ETA</td>
                  {comparisonItems.map((item) => (
                    <td key={item.id} className="p-3 text-[#747987]">
                      {isAuthenticated ? item.deliveryEstimate || 'Unavailable' : 'Sign in to view'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-[#747987]">Verified rating</td>
                  {comparisonItems.map((item) => (
                    <td key={item.id} className="p-3 text-[#151923]">
                      {item.merchant?.verified && item.rating !== null ? (
                        <span className="inline-flex items-center gap-1 font-medium">
                          <Star className="h-3.5 w-3.5 fill-[#C98A1C] text-[#C98A1C]" />
                          {item.rating.toFixed(1)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-[#747987]">Action</td>
                  {comparisonItems.map((item) => {
                    const blocked =
                      item.availability === 'out_of_stock' || item.shippingAvailable === false;
                    return (
                      <td key={item.id} className="p-3">
                        <div className="flex flex-col gap-1.5">
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            disabled={blocked}
                            onClick={() => handleCheckout(item)}
                            className="w-full"
                          >
                            {blocked ? 'Unavailable' : 'Buy now'}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              onOpenChange(false);
                              navigate(`/product/${item.id}`);
                            }}
                            className="w-full text-xs"
                          >
                            View details
                          </Button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ProductComparison;
