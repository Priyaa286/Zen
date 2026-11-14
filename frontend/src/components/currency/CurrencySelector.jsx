import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUPPORTED_CURRENCIES } from '@/utils/currencyFormatter';
import { cn } from '@/utils/cn';

export function CurrencySelector({
  id,
  label,
  helperText,
  value,
  onChange,
  currencies = SUPPORTED_CURRENCIES,
  disabled = false,
  className,
  triggerClassName,
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <label
          htmlFor={id}
          className="block text-[12px] font-[550] text-[#151923]"
        >
          {label}
        </label>
      ) : null}

      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          aria-label={label || 'Select currency'}
          className={cn('bg-white tabular-nums', triggerClassName)}
        >
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent>
          {currencies.map((curr) => (
            <SelectItem key={curr.code} value={curr.code}>
              <span className="flex items-center gap-2 text-xs tabular-nums">
                <span className="w-9 font-semibold text-[#151923]">{curr.code}</span>
                <span className="w-7 text-[#747987]">{curr.symbol}</span>
                <span className="text-[#747987]">{curr.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {helperText ? (
        <p className="text-[11.5px] leading-relaxed text-[#747987]">{helperText}</p>
      ) : null}
    </div>
  );
}

export default CurrencySelector;

