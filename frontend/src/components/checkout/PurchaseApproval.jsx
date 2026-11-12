import { ShieldCheck } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/utils/currencyFormatter';
import { cn } from '@/utils/cn';

export function PurchaseApproval({
  approved,
  onApprovedChange,
  totalAmount,
  currency,
  disabled = false,
  shippingValid = false,
}) {
  const formattedTotal =
    typeof totalAmount === 'number' ? formatCurrency(totalAmount, currency) : 'the displayed amount';

  return (
    <section
      className={cn(
        'rounded-md border p-5 sm:p-6 transition-colors',
        approved
          ? 'border-[#168B66]/45 bg-[#168B66]/[0.03]'
          : 'border-[#E6E5E0] bg-white'
      )}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-[#E6E5E0] pb-3.5">
          <div>
            <p className="zen-eyebrow text-[#465BE6]">02 · Review &amp; Confirm</p>
            <h2 className="mt-1 text-[16px] font-[600] text-[#151923]">
              Confirm your order
            </h2>
          </div>
          <ShieldCheck
            className={cn(
              'h-4 w-4 shrink-0',
              approved ? 'text-[#168B66]' : 'text-[#747987]'
            )}
          />
        </div>

        <label
          htmlFor="zen-purchase-approval"
          className={cn(
            'flex items-start gap-3.5 rounded-md border bg-white p-4 cursor-pointer transition-colors',
            approved
              ? 'border-[#168B66]/50'
              : 'border-[#E6E5E0] hover:border-[#465BE6]/55',
            disabled && 'cursor-not-allowed opacity-60'
          )}
        >
          <Checkbox
            id="zen-purchase-approval"
            checked={approved}
            disabled={disabled}
            onCheckedChange={(checked) => onApprovedChange(Boolean(checked))}
            className="mt-0.5"
          />
          <span className="text-[13px] leading-relaxed text-[#151923]/85">
            I&apos;ve reviewed the itemised breakdown — item price, currency fee, shipping,
            estimated import duties, taxes, and handling fees — and{' '}
            <strong className="font-semibold text-[#151923] tabular-nums">
              confirm the total of {formattedTotal}
            </strong>{' '}
            before paying with PayPal.
          </span>
        </label>

        {!shippingValid && (
          <p className="text-[12px] text-[#9A6A13]">
            Complete all required shipping fields above to unlock PayPal payment after approval.
          </p>
        )}
      </div>
    </section>
  );
}

export default PurchaseApproval;
