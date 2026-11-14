import { AlertTriangle, BadgeCheck, Minus, Plus, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ProductImage } from '@/components/common/ProductImage';
import { formatCurrency, getCountryName } from '@/utils/currencyFormatter';
import { formatExchangeRate, formatPrice } from '@/utils/formatPrice';

function StatementLine({ num, label, sublabel, amount, currency }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-[13px]">
      <div className="min-w-0 flex items-baseline gap-2.5">
        <span className="text-[11px] font-medium text-[#8F94A2] tabular-nums">{num}</span>
        <div>
          <p className="text-[#151923]">{label}</p>
          {sublabel ? (
            <p className="mt-0.5 text-[11px] text-[#747987]">{sublabel}</p>
          ) : null}
        </div>
      </div>
      <span className="shrink-0 font-[550] text-[#151923] tabular-nums">
        {amount !== null && amount !== undefined
          ? formatCurrency(amount, currency)
          : 'Unavailable'}
      </span>
    </div>
  );
}

export function CostBreakdown({
  summary,
  product = null,
  quantity = 1,
  onQuantityChange,
  loading = false,
  embedded = false,
}) {
  if (loading) {
    return (
      <div className={embedded ? 'p-6 space-y-4' : 'rounded-md border border-[#E6E5E0] bg-white p-6 space-y-4'}>
        <div className="h-5 w-48 animate-pulse rounded bg-[#E6E5E0]" />
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-3.5 w-40 animate-pulse rounded bg-[#F1EFE9]" />
              <div className="h-3.5 w-20 animate-pulse rounded bg-[#F1EFE9]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const currency = summary.targetCurrency || 'INR';
  const b = summary.breakdown || {};

  return (
    <div className={embedded ? '' : 'rounded-md border border-[#E6E5E0] bg-white'}>
      {/* Statement Header */}
      <div className="border-b border-[#E6E5E0] px-6 py-4 bg-[#F8F7F4]">
        <div className="flex items-center justify-between gap-2">
          <p className="zen-eyebrow text-[#747987]">Here&apos;s how your total is calculated.</p>
          {summary.source !== 'mock' && <Badge variant="success">Live quote</Badge>}
        </div>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2 text-[12px] text-[#747987] tabular-nums">
          <span>
            {getCountryName(summary.originCountry)} ({summary.originCountry}) →{' '}
            {getCountryName(summary.destinationCountry)} ({summary.destinationCountry})
          </span>
          <span className="font-[550] text-[#151923]">
            {formatExchangeRate(summary.exchangeRate, summary.originalCurrency, currency)}
          </span>
        </div>
      </div>

      <div className="space-y-5 p-6">
        {/* Product Summary with Inline Quantity Stepper */}
        {product && (
          <div className="flex items-start gap-3.5 border-b border-[#E6E5E0] pb-5">
            <ProductImage
              src={product.imageUrl}
              alt={product.title}
              className="h-16 w-20 shrink-0 rounded border border-[#E6E5E0] bg-[#F1EFE9]"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5 text-[11.5px] text-[#747987]">
                <span className="font-[550] text-[#151923] truncate">
                  {product.merchant?.name}
                </span>
                {product.merchant?.verified ? (
                  <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#465BE6]" />
                ) : null}
              </div>
              <p className="line-clamp-2 text-[13.5px] font-[580] leading-snug text-[#151923]">
                {product.shortTitle || product.title}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="text-[11.5px] text-[#747987] tabular-nums">
                  Unit: {formatPrice(product.originalPrice, product.originalCurrency)}
                </span>
                {onQuantityChange ? (
                  <div className="inline-flex items-center gap-1 rounded border border-[#E6E5E0] bg-[#F8F7F4] px-1.5 py-0.5">
                    <button
                      type="button"
                      onClick={() => onQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                      className="rounded p-0.5 text-[#747987] transition-colors hover:bg-white hover:text-[#151923] disabled:opacity-40"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-semibold text-[#151923] tabular-nums">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onQuantityChange(quantity + 1)}
                      disabled={quantity >= 10}
                      className="rounded p-0.5 text-[#747987] transition-colors hover:bg-white hover:text-[#151923] disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <span className="text-[11.5px] text-[#747987] tabular-nums">
                    Qty {summary.quantity}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Itemized 6-Line Ledger + Line 7 Total */}
        <div className="divide-y divide-[#E6E5E0]">
          <StatementLine
            num="01"
            label={`Item price (×${summary.quantity})`}
            sublabel={`Price in seller's currency: ${formatPrice(summary.originalSubtotal, summary.originalCurrency)}`}
            amount={b.productPrice}
            currency={currency}
          />
          <StatementLine
            num="02"
            label="Currency conversion"
            sublabel="Estimated conversion fee"
            amount={b.currencyConversionFee}
            currency={currency}
          />
          <StatementLine
            num="03"
            label="Shipping"
            sublabel={`${summary.shippingOption?.carrier || 'Tracked international air'} · ${summary.shippingOption?.etaLabel || 'Delivery window pending'}`}
            amount={b.shippingCharges}
            currency={currency}
          />
          <StatementLine
            num="04"
            label="Import duties"
            sublabel="Estimated customs duty"
            amount={b.estimatedDuties}
            currency={currency}
          />
          <StatementLine
            num="05"
            label={b.taxLabel || 'Estimated taxes'}
            sublabel="Estimated import GST / VAT"
            amount={b.estimatedTaxes}
            currency={currency}
          />
          <StatementLine
            num="06"
            label={b.otherFeesLabel || 'Other fees'}
            sublabel="Customs handling & carrier documentation"
            amount={b.otherFees}
            currency={currency}
          />
        </div>

        {/* 07. Estimated Total */}
        <div className="border-t-2 border-[#151923] pt-4">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#747987]">
                07 · Estimated delivered total
              </p>
              <p className="mt-0.5 text-[11.5px] text-[#747987]">
                Includes item, currency fee, shipping &amp; est. import charges
              </p>
            </div>
            <p className="text-[26px] font-[650] tracking-[-0.03em] text-[#151923] tabular-nums">
              {b.totalPayable !== null && b.totalPayable !== undefined
                ? formatCurrency(b.totalPayable, currency)
                : 'Unavailable'}
            </p>
          </div>

          {b.paypalSettlementAmount &&
            b.paypalSettlementCurrency &&
            b.paypalSettlementCurrency !== currency && (
              <div className="mt-3 flex items-center justify-between border-t border-[#E6E5E0] pt-2.5 text-[11.5px] text-[#747987] tabular-nums">
                <span>PayPal Sandbox equivalent</span>
                <span className="font-[580] text-[#151923]">
                  {formatCurrency(b.paypalSettlementAmount, b.paypalSettlementCurrency)}
                </span>
              </div>
            )}
        </div>

        {/* Fee Uncertainty Disclosures */}
        {Array.isArray(summary.warnings) && summary.warnings.length > 0 && (
          <Alert variant="warning">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#C98A1C]" />
            <div className="space-y-1">
              <AlertTitle className="text-xs font-semibold">
                Important fee &amp; customs notes
              </AlertTitle>
              <AlertDescription className="space-y-1 text-xs">
                {summary.warnings.map((w, idx) => (
                  <p key={idx}>{w}</p>
                ))}
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="flex items-center gap-2 text-[11.5px] text-[#747987]">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#465BE6]" />
          <span>Your payment will be processed securely through PayPal.</span>
        </div>
      </div>
    </div>
  );
}

export default CostBreakdown;
