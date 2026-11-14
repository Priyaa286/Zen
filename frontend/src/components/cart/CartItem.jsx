import { Minus, Plus, ShieldCheck, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductImage } from '@/components/common/ProductImage';
import {
  formatConvertedUserPrice,
  formatOriginalMerchantPrice,
  getCountryName,
} from '@/utils/currencyFormatter';

export function CartItem({
  item,
  lineEstimate,
  preferredCurrency = 'INR',
  onUpdateQuantity,
  onRemove,
  onCheckoutItem,
  onNavigate,
}) {
  const { cartKey, product, quantity, selectedVariant } = item;
  const originCountry = product?.merchant?.country || 'US';

  const variantEntries =
    selectedVariant && typeof selectedVariant === 'object'
      ? Object.entries(selectedVariant).filter(([, val]) => Boolean(val))
      : [];

  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-3.5 transition-colors hover:border-[#CBD5E1]">
      <div className="flex gap-3.5">
        <Link
          to={`/product/${encodeURIComponent(product.id)}`}
          onClick={onNavigate}
          className="h-20 w-20 shrink-0 overflow-hidden rounded-md border border-[#E5E7EB] bg-[#F1F3F6]"
        >
          <ProductImage
            src={product.imageUrl}
            alt={product.title}
            category={product.category}
            className="h-full w-full object-cover"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-[#697586]">
                <span className="rounded bg-[#F1F3F6] px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-[#172554]">
                  {originCountry}
                </span>
                <span>{product.merchant?.name || getCountryName(originCountry)}</span>
                <span>·</span>
                <span className="text-[#15976B] inline-flex items-center gap-0.5">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              </div>
              <Link
                to={`/product/${encodeURIComponent(product.id)}`}
                onClick={onNavigate}
                className="mt-0.5 block line-clamp-2 text-[13.5px] font-[600] leading-snug text-[#17202F] hover:text-[#465BE5]"
              >
                {product.shortTitle || product.title}
              </Link>
            </div>

            <button
              type="button"
              aria-label={`Remove ${product.shortTitle || product.title} from cart`}
              onClick={() => onRemove(cartKey)}
              className="rounded-md p-1 text-[#697586] transition-colors hover:bg-[#FEE2E2] hover:text-[#DC2626]"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {variantEntries.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {variantEntries.map(([key, val]) => (
                <span
                  key={key}
                  className="rounded bg-[#F1F3F6] px-2 py-0.5 text-[11px] font-medium text-[#17202F]"
                >
                  {key}: {val}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            {/* Quantity stepper */}
            <div className="inline-flex items-center rounded-md border border-[#E5E7EB] bg-[#F7F8FA]">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => onUpdateQuantity(cartKey, quantity - 1)}
                className="flex h-7 w-7 items-center justify-center text-[#17202F] hover:bg-[#E5E7EB]/60"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-8 text-center text-[12.5px] font-[600] tabular-nums text-[#17202F]">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => onUpdateQuantity(cartKey, quantity + 1)}
                className="flex h-7 w-7 items-center justify-center text-[#17202F] hover:bg-[#E5E7EB]/60"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Pricing: Original vs Converted */}
            <div className="text-right tabular-nums">
              <p className="text-[11px] text-[#697586]">
                Original:{' '}
                <span className="font-medium text-[#17202F]">
                  {formatOriginalMerchantPrice(
                    (product.originalPrice || 0) * quantity,
                    product.originalCurrency
                  )}
                </span>
              </p>
              {lineEstimate?.convertedSubtotal != null ? (
                <p className="text-[14px] font-[680] text-[#172554]">
                  {formatConvertedUserPrice(lineEstimate.convertedSubtotal, preferredCurrency, {
                    compact: true,
                  })}
                </p>
              ) : (
                <p className="text-[12px] font-medium text-[#465BE5]">
                  Calculated at checkout ({preferredCurrency})
                </p>
              )}
            </div>
          </div>

          {/* Per-item shipping & landed note */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E7EB] pt-2 text-[11.5px] text-[#697586]">
            <span>
              {lineEstimate?.totalLanded != null ? (
                <>
                  Est. delivered cost:{' '}
                  <strong className="font-[620] text-[#17202F] tabular-nums">
                    {formatConvertedUserPrice(lineEstimate.totalLanded, preferredCurrency, {
                      compact: true,
                    })}
                  </strong>{' '}
                  <span className="text-[#697586]">(incl. shipping &amp; est. duties)</span>
                </>
              ) : (
                <span>Shipping &amp; import charges calculated at checkout</span>
              )}
            </span>

            {onCheckoutItem ? (
              <button
                type="button"
                onClick={() => onCheckoutItem(item)}
                className="inline-flex items-center gap-1 font-[600] text-[#465BE5] hover:text-[#172554]"
              >
                <span>Checkout item</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

