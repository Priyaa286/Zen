import { PackageSearch } from 'lucide-react';
import { cn } from '@/utils/cn';

export function EmptyState({
  icon: Icon = PackageSearch,
  title = "We couldn't find any matching products.",
  description = 'Try changing your search or clearing filters to see offers from sellers in other countries.',
  action,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-[#E6E5E0] bg-white px-6 py-16 text-center',
        className
      )}
    >
      <div className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-md border border-[#E6E5E0] bg-[#F8F7F4] text-[#747987]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold tracking-[-0.015em] text-[#151923]">{title}</h3>
      <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-[#747987]">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
