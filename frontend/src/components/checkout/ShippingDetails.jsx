import { Truck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUPPORTED_COUNTRIES, formatCurrency } from '@/utils/currencyFormatter';
import { cn } from '@/utils/cn';

export function ShippingDetails({
  form,
  errors = {},
  onChange,
  onCountryChange,
  shippingOptions = [],
  selectedShippingOptionId,
  onShippingOptionSelect,
  targetCurrency = 'INR',
  disabled = false,
}) {
  const handleInput = (field) => (e) => {
    onChange(field, e.target.value);
  };

  return (
    <section className="space-y-6 rounded-md border border-[#E6E5E0] bg-white p-5 sm:p-7">
      <div className="border-b border-[#E6E5E0] pb-4">
        <p className="zen-eyebrow text-[#465BE6]">01 · Recipient &amp; Destination</p>
        <h2 className="mt-1 text-[18px] font-[600] tracking-[-0.015em] text-[#151923]">
          Shipping details &amp; delivery tier
        </h2>
        <p className="mt-1 text-[13px] text-[#747987]">
          Required for international customs documentation and courier airwaybill dispatch.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="ship-fullName" className="text-xs font-medium text-[#151923]">
            Full name <span className="text-red-500">*</span>
          </label>
          <Input
            id="ship-fullName"
            value={form.fullName}
            onChange={handleInput('fullName')}
            disabled={disabled}
            placeholder="e.g., Aarav Sharma"
            className={errors.fullName ? 'border-red-400 focus-visible:ring-red-400/25' : ''}
          />
          {errors.fullName && (
            <p className="text-xs text-red-600">{errors.fullName}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="ship-email" className="text-xs font-medium text-[#151923]">
            Email for customs &amp; receipt <span className="text-red-500">*</span>
          </label>
          <Input
            id="ship-email"
            type="email"
            value={form.email}
            onChange={handleInput('email')}
            disabled={disabled}
            placeholder="you@example.com"
            className={errors.email ? 'border-red-400 focus-visible:ring-red-400/25' : ''}
          />
          {errors.email && (
            <p className="text-xs text-red-600">{errors.email}</p>
          )}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="ship-address" className="text-xs font-medium text-[#151923]">
            Street address <span className="text-red-500">*</span>
          </label>
          <Input
            id="ship-address"
            value={form.addressLine1}
            onChange={handleInput('addressLine1')}
            disabled={disabled}
            placeholder="Apartment, building, street name"
            className={errors.addressLine1 ? 'border-red-400 focus-visible:ring-red-400/25' : ''}
          />
          {errors.addressLine1 && (
            <p className="text-xs text-red-600">{errors.addressLine1}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="ship-city" className="text-xs font-medium text-[#151923]">
            City <span className="text-red-500">*</span>
          </label>
          <Input
            id="ship-city"
            value={form.city}
            onChange={handleInput('city')}
            disabled={disabled}
            placeholder="e.g., Bengaluru"
            className={errors.city ? 'border-red-400 focus-visible:ring-red-400/25' : ''}
          />
          {errors.city && <p className="text-xs text-red-600">{errors.city}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="ship-state" className="text-xs font-medium text-[#151923]">
            State / Province
          </label>
          <Input
            id="ship-state"
            value={form.state}
            onChange={handleInput('state')}
            disabled={disabled}
            placeholder="e.g., Karnataka"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="ship-postal" className="text-xs font-medium text-[#151923]">
            Postal / ZIP code <span className="text-red-500">*</span>
          </label>
          <Input
            id="ship-postal"
            value={form.postalCode}
            onChange={handleInput('postalCode')}
            disabled={disabled}
            placeholder="e.g., 560001"
            className={errors.postalCode ? 'border-red-400 focus-visible:ring-red-400/25' : ''}
          />
          {errors.postalCode && (
            <p className="text-xs text-red-600">{errors.postalCode}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#151923]">
            Destination country <span className="text-red-500">*</span>
          </label>
          <Select
            value={form.countryCode}
            onValueChange={onCountryChange}
            disabled={disabled}
          >
            <SelectTrigger aria-label="Destination country">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code} · {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.countryCode && (
            <p className="text-xs text-red-600">{errors.countryCode}</p>
          )}
        </div>
      </div>

      {/* Carrier / Delivery Selection */}
      {Array.isArray(shippingOptions) && shippingOptions.length > 0 && (
        <div className="space-y-3 border-t border-[#E6E5E0] pt-6">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-[#747987]">
            <Truck className="h-3.5 w-3.5 text-[#465BE6]" />
            <span>Delivery selection</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {shippingOptions.map((opt) => {
              const active = opt.id === selectedShippingOptionId;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onShippingOptionSelect?.(opt.id)}
                  className={cn(
                    'flex flex-col justify-between rounded-md border p-4 text-left transition-colors tabular-nums',
                    active
                      ? 'border-[#465BE6] bg-[#465BE6]/[0.03] ring-1 ring-[#465BE6]'
                      : 'border-[#E6E5E0] bg-white hover:border-[#D0CEC6]'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[13px] font-semibold text-[#151923]">
                        {opt.serviceName}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-[#747987]">{opt.carrier}</p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 text-[13px] font-semibold tabular-nums',
                        active ? 'text-[#465BE6]' : 'text-[#151923]'
                      )}
                    >
                      {opt.costInTargetCurrency !== null
                        ? formatCurrency(opt.costInTargetCurrency, targetCurrency)
                        : 'N/A'}
                    </span>
                  </div>
                  <p className="mt-3 border-t border-[#E6E5E0] pt-2.5 text-[11.5px] text-[#747987]">
                    Estimated arrival:{' '}
                    <span className="font-medium text-[#151923]">{opt.etaLabel}</span>{' '}
                    ({opt.estimatedArrivalWindow})
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

export default ShippingDetails;
