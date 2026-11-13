import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/utils/cn';

const SHOPPING_IDEAS = [
  {
    eyebrow: 'Audio · United States',
    title: 'Sony WH-1000XM5 headphones from the US under ₹25,000',
    prompt: 'Sony WH-1000XM5 headphones from USA under ₹25,000',
  },
  {
    eyebrow: 'Sports & Footwear · Japan',
    title: 'Japanese running shoes from Tokyo under ₹16,000',
    prompt: 'Find ASICS running shoes from Japan under ₹16,000',
  },
  {
    eyebrow: 'Home & Kitchen · Germany',
    title: 'Compact espresso machines from Germany with estimated delivered cost',
    prompt: 'Find compact espresso machines from Germany',
  },
  {
    eyebrow: 'Beauty · Korea vs Singapore',
    title: 'Compare Korean skincare barrier serums from Seoul and Singapore',
    prompt: 'Compare Korean skincare barrier serum from South Korea vs Singapore',
  },
];

export function SuggestedPrompts({
  prompts = [],
  onSelect,
  disabled = false,
  variant = 'follow-up',
  destinationCountry = 'IN',
}) {
  if (variant === 'empty' && prompts.length === 0) {
    return (
      <div className="space-y-3">
        <span className="zen-eyebrow text-[#747987]">
          Try asking about
        </span>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {SHOPPING_IDEAS.map((item) => (
            <button
              key={item.prompt}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(item.prompt)}
              className="group flex items-start justify-between gap-3 rounded-md border border-[#E6E5E0] bg-white px-4 py-3 text-left transition-colors hover:border-[#465BE6]/55 disabled:opacity-50"
            >
              <div className="space-y-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#747987]">
                  {item.eyebrow} → {destinationCountry}
                </p>
                <p className="text-[13.5px] font-[520] leading-snug text-[#151923] group-hover:text-[#465BE6] transition-colors">
                  {item.title}
                </p>
              </div>
              <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-[#8F94A2] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#465BE6]" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(prompt)}
          className={cn(
            'group inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[#E6E5E0] bg-white px-3 py-1.5 text-left text-[12px] font-[460] text-[#747987] transition-colors hover:border-[#465BE6]/50 hover:text-[#151923] disabled:opacity-50'
          )}
        >
          <span>{prompt}</span>
          <ArrowUpRight className="h-3 w-3 shrink-0 text-[#8F94A2] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#465BE6]" />
        </button>
      ))}
    </div>
  );
}
