import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUPPORTED_COUNTRIES } from '@/utils/currencyFormatter';
import { cn } from '@/utils/cn';

export function CountrySelector({
  id,
  label,
  helperText,
  value,
  onChange,
  countries = SUPPORTED_COUNTRIES,
  disabled = false,
  className,
  triggerClassName,
  showIcon = true,
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
          aria-label={label || 'Select country'}
          className={cn('bg-white', triggerClassName)}
        >
          <div className="flex items-center gap-2 truncate">
            {showIcon ? <Globe className="h-3.5 w-3.5 shrink-0 text-[#747987]" /> : null}
            <SelectValue placeholder="Select country" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {countries.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <span className="flex items-center gap-2 text-xs">
                <span className="w-6 font-semibold text-[#151923]">{country.code}</span>
                <span className="text-[#747987]">{country.name}</span>
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

export default CountrySelector;

