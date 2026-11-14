import { Link } from 'react-router-dom';
import { Globe2, Lock, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  formatCurrency,
  formatExchangeRateInfo,
  formatOriginalMerchantPrice,
} from '@/utils/currencyFormatter';

export function LandedCostSummary({
  product,
  quantity,
  displayCurrency,
  shippingOption,
  shippingLoading,
  shippingCostDisplay,
  deliveryDisplay,
  isAuthenticated = true,
}) {
  if (!isAuthenticated) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="zen-eyebrow text-[#697586]">
              Price in seller&apos;s currency ({product.originalCurrency || 'USD'})
            </p>
            <p className="mt-1.5 text-3xl font-[700] tracking-tight text-[#172554] tabular-nums">
              {product.originalPrice != null
                ? formatOriginalMerchantPrice(
                    product.originalPrice * quantity,
                    product.originalCurrency || 'USD'
                  )
                : 'Unavailable'}
            </p>
            <p className="mt-1 text-xs text-[#697586]">
              Listed in seller&apos;s store currency
              {quantity > 1 ? ` for ${quantity} units` : ''}
            </p>
          </div>
          <Badge variant="outline">Seller currency</Badge>
        </div>

        <div className="rounded-lg border border-[#E5E7EB] bg-[#F7F8FA] p-4 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#465BE5]" />
            <div className="space-y-1">
              <p className="text-[13px] font-[620] text-[#17202F]">
                Sign in to view currency conversion &amp; delivery details
              </p>
              <p className="text-[12px] leading-relaxed text-[#697586]">
                Converted price in {displayCurrency}, shipping fee, delivery window, duties &amp; tax, wishlist saving, and cart require an active account.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <Link
              to="/login"
              className="inline-flex h-8 items-center rounded-md bg-[#172554] px-3.5 text-[12px] font-[600] text-white hover:bg-[#1E3A8A]"
            >
              Sign in to unlock
            </Link>
            <Link
              to="/register"
              className="inline-flex h-8 items-center rounded-md border border-[#E5E7EB] bg-white px-3 text-[12px] font-[580] text-[#17202F] hover:border-[#CBD5E1]"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="zen-eyebrow text-[#697586]">
            Estimated delivered cost ({displayCurrency})
          </p>
          <p className="mt-1.5 text-3xl font-[700] tracking-tight text-[#172554] tabular-nums">
            {product.totalLandedCost !== null
              ? formatCurrency(product.totalLandedCost * quantity, displayCurrency)
              : 'Unavailable'}
          </p>
          <p className="mt-1 text-xs text-[#697586]">
            Includes item price, indicative exchange rate, shipping, and est. duties &amp; tax
          </p>
        </div>
        <Badge variant="accent">Itemised estimate</Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-[#E5E7EB] pt-4 sm:grid-cols-2 text-xs tabular-nums">
        <div className="space-y-0.5">
          <p className="text-[#697586]">Price in seller&apos;s currency</p>
          <p className="text-sm font-semibold text-[#17202F]">
            {formatOriginalMerchantPrice(product.originalPrice, product.originalCurrency)}
          </p>
        </div>

        <div className="space-y-0.5">
          <p className="text-[#697586]">Converted price (×{quantity})</p>
          <p className="text-sm font-semibold text-[#17202F]">
            {product.convertedPrice !== null
              ? formatCurrency(product.convertedPrice * quantity, displayCurrency)
              : 'Unavailable'}
          </p>
          {product.exchangeRate ? (
            <p className="text-[11px] text-[#697586]">
              {formatExchangeRateInfo(
                product.exchangeRate,
                product.originalCurrency,
                displayCurrency,
                product.exchangeRateTimestamp
              )}
            </p>
          ) : null}
        </div>

        <div className="space-y-0.5">
          <p className="text-[#697586]">Est. import duties &amp; tax (×{quantity})</p>
          <p className="text-sm font-semibold text-[#17202F]">
            {product.estimatedDutiesAndTaxes != null
              ? formatCurrency(product.estimatedDutiesAndTaxes * quantity, displayCurrency)
              : 'Included in quote'}
          </p>
        </div>

        <div className="flex items-start gap-2 pt-1">
          <Truck className="mt-0.5 h-3.5 w-3.5 text-[#465BE6] shrink-0" />
          <div>
            <p className="font-medium text-[#17202F]">
              Shipping:{' '}
              {shippingLoading
                ? 'Checking...'
                : shippingCostDisplay !== null
                  ? formatCurrency(shippingCostDisplay, displayCurrency)
                  : 'Unavailable'}
            </p>
            <p className="text-[#697586]">
              {shippingOption?.carrier || 'Tracked international air courier'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 pt-1 sm:col-span-2">
          <Globe2 className="mt-0.5 h-3.5 w-3.5 text-[#465BE6] shrink-0" />
          <div>
            <p className="font-medium text-[#17202F]">Delivery: {deliveryDisplay}</p>
            <p className="text-[#697586]">
              {shippingOption?.estimatedArrivalWindow || 'Customs documentation included'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

