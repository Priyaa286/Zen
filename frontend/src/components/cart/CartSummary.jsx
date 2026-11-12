import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { formatConvertedUserPrice } from '@/utils/currencyFormatter';

export function CartSummary({
  summary,
  preferredCurrency = 'INR',
  merchantCount = 1,
  onProceedCheckout,
  onContinueShopping,
  disabled = false,
}) {
  const {
    hasFullEstimate,
    itemsSubtotal,
    shippingTotal,
    dutiesTotal,
    landedTotal,
    totalUnits,
  } = summary;

  return (
    <div className="space-y-3 border-t border-[#E5E7EB] bg-white px-5 py-4">
      {merchantCount > 1 ? (
        <div className="rounded-md border border-[#465BE5]/25 bg-[#465BE5]/5 px-3 py-2 text-[12px] leading-relaxed text-[#17202F]">
          <strong className="font-[600] text-[#172554]">
            {merchantCount} international origins in cart.
          </strong>{' '}
          Proceeding starts PayPal checkout for your first shipment, or choose &ldquo;Checkout
          item&rdquo; on any specific merchant line above.
        </div>
      ) : null}

      {hasFullEstimate ? (
        <div className="space-y-1.5 text-[12.5px] tabular-nums">
          <div className="flex items-center justify-between text-[#697586]">
            <span>Items ({totalUnits})</span>
            <span className="font-medium text-[#17202F]">
              {formatConvertedUserPrice(itemsSubtotal, preferredCurrency, { compact: true })}
            </span>
          </div>
          <div className="flex items-center justify-between text-[#697586]">
            <span>Est. international shipping</span>
            <span className="font-medium text-[#17202F]">
              {formatConvertedUserPrice(shippingTotal, preferredCurrency, { compact: true })}
            </span>
          </div>
          <div className="flex items-center justify-between text-[#697586]">
            <span>Est. customs &amp; import duties</span>
            <span className="font-medium text-[#17202F]">
              {formatConvertedUserPrice(dutiesTotal, preferredCurrency, { compact: true })}
            </span>
          </div>
          <div className="flex items-baseline justify-between border-t border-[#E5E7EB] pt-2">
            <div>
              <span className="text-[13.5px] font-[650] text-[#17202F]">Estimated delivered cost</span>
              <p className="text-[11px] text-[#697586]">Processed via PayPal in {preferredCurrency}</p>
            </div>
            <span className="text-[18px] font-[700] tracking-tight text-[#172554]">
              {formatConvertedUserPrice(landedTotal, preferredCurrency, { compact: true })}
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-[#E5E7EB] bg-[#F7F8FA] px-3 py-2.5 text-[12px] text-[#697586]">
          Exchange rates, shipping, and est. import duties are calculated at checkout in{' '}
          <strong className="text-[#17202F]">{preferredCurrency}</strong>.
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          onClick={onContinueShopping}
          className="h-10 w-full text-[13px]"
        >
          Continue shopping
        </Button>
        <Button
          type="button"
          variant="primary"
          disabled={disabled}
          onClick={onProceedCheckout}
          className="h-10 w-full bg-[#172554] text-[13px] hover:bg-[#1E3A8A]"
        >
          Proceed to PayPal Checkout
        </Button>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#697586]">
        <ShieldCheck className="h-3.5 w-3.5 text-[#15976B]" />
        <span>PayPal Buyer Protection · You confirm every order before paying</span>
      </p>
    </div>
  );
}

