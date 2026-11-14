import { AlertTriangle, CheckCircle2, Plane, ShieldCheck } from 'lucide-react';
import { getCountryName } from '@/utils/currencyFormatter';

export function DeliveryEstimate({
  originCountry,
  destinationCountry,
  shippingOption,
  shippingAvailable = true,
  unavailableReason,
}) {
  if (!shippingAvailable) {
    return (
      <section className="rounded-md border border-red-200 bg-red-50/40 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-red-900">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          International delivery unavailable
        </div>
        <p className="mt-2 text-xs leading-relaxed text-red-800">
          {unavailableReason ||
            `This item cannot currently ship from ${getCountryName(originCountry)} to ${getCountryName(destinationCountry)}.`}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-md border border-[#E6E5E0] bg-white p-5 space-y-4">
      <div className="flex items-center gap-2 text-sm font-[590] text-[#151923]">
        <Plane className="h-4 w-4 text-[#465BE6]" />
        <span>Shipping route</span>
      </div>

      <div className="flex items-center justify-between gap-2 rounded border border-[#E6E5E0] bg-[#F8F7F4] px-3.5 py-2.5 text-xs">
        <div className="flex items-center gap-2 font-medium text-[#151923]">
          <span className="rounded border border-[#E6E5E0] bg-white px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-[#151923]">
            {originCountry}
          </span>
          <span>{getCountryName(originCountry)}</span>
        </div>

        <div className="flex items-center gap-1.5 text-[#8F94A2]">
          <span className="h-px w-6 sm:w-10 bg-[#D0CEC6]" />
          <ShieldCheck className="h-3.5 w-3.5 text-[#465BE6] shrink-0" />
          <span className="h-px w-6 sm:w-10 bg-[#D0CEC6]" />
        </div>

        <div className="flex items-center gap-2 font-medium text-[#151923]">
          <span className="rounded border border-[#E6E5E0] bg-white px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-[#151923]">
            {destinationCountry}
          </span>
          <span>{getCountryName(destinationCountry)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs tabular-nums">
        <div className="border-l-2 border-[#E6E5E0] pl-3 space-y-0.5">
          <p className="text-[#747987]">Carrier &amp; tier</p>
          <p className="font-medium text-[#151923]">
            {shippingOption?.carrier || 'International Priority Courier'}
          </p>
          <p className="text-[#747987]">{shippingOption?.serviceName || 'Tracked air freight'}</p>
        </div>

        <div className="border-l-2 border-[#E6E5E0] pl-3 space-y-0.5">
          <p className="text-[#747987]">Estimated arrival</p>
          <p className="font-medium text-[#151923]">
            {shippingOption?.estimatedArrivalWindow || shippingOption?.etaLabel || 'Unavailable'}
          </p>
          <p className="text-[#747987]">
            {shippingOption?.etaLabel ? `${shippingOption.etaLabel} transit` : 'Customs included'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-[#168B66]">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        <span>Tracked airwaybill &amp; commercial customs invoice included.</span>
      </div>
    </section>
  );
}

export default DeliveryEstimate;
