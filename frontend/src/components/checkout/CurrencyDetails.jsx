import { ArrowLeftRight, Clock } from 'lucide-react';
import { formatExchangeRate } from '@/utils/formatPrice';

export function CurrencyDetails({
  fromCurrency,
  toCurrency,
  exchangeRate,
  timestamp,
  conversionFee,
}) {
  const formattedRate = formatExchangeRate(exchangeRate, fromCurrency, toCurrency);
  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <section className="rounded-md border border-[#E6E5E0] bg-white p-5 space-y-3.5">
      <div className="flex items-center gap-2 text-sm font-[590] text-[#151923]">
        <ArrowLeftRight className="h-4 w-4 text-[#465BE6]" />
        <span>Currency conversion details</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#E6E5E0] bg-[#F8F7F4] px-3.5 py-2.5 text-xs">
        <span className="text-[#747987]">Indicative exchange rate</span>
        <span className="font-semibold text-[#151923] tabular-nums">{formattedRate}</span>
      </div>

      <div className="flex items-center justify-between text-xs text-[#747987] tabular-nums">
        <span>Currency pair</span>
        <span className="font-medium text-[#151923]">
          {fromCurrency || '—'} → {toCurrency || '—'}
        </span>
      </div>

      {formattedTime && (
        <div className="flex items-center justify-between text-xs text-[#747987] tabular-nums">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Quoted at
          </span>
          <span>{formattedTime}</span>
        </div>
      )}

      {conversionFee === 0 ? (
        <p className="rounded border border-[#168B66]/25 bg-[#168B66]/[0.06] px-3 py-2 text-xs text-[#168B66]">
          Same currency — no conversion fee applies.
        </p>
      ) : (
        <p className="text-xs leading-relaxed text-[#747987]">
          Estimated currency fee is shown upfront in your order summary before you pay with PayPal.
        </p>
      )}
    </section>
  );
}

export default CurrencyDetails;
