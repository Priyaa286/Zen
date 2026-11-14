import { Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const DATE_RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'this_year', label: 'This year (2026)' },
  { value: 'custom', label: 'Custom range' },
];

export function DateRangeSelector({ value = '30d', onChange }) {
  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-[160px] bg-white border-[#E5E7EB] text-xs font-medium text-[#17202F] shadow-xs hover:bg-[#F7F8FA]">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-[#697586] shrink-0" />
            <SelectValue placeholder="Date range" />
          </div>
        </SelectTrigger>
        <SelectContent align="end">
          {DATE_RANGE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
