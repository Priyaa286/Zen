import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Skeleton } from '@/components/ui/skeleton';
import { ZenLogo } from '@/components/common/ZenLogo';

export function Loader({
  label = 'Loading...',
  sublabel,
  fullScreen = false,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-center',
        fullScreen ? 'min-h-[55vh] px-4' : 'py-12 px-4',
        className
      )}
    >
      {fullScreen ? <ZenLogo size="sm" alt="Zen Global" className="opacity-90" /> : null}
      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#E6E5E0] bg-white text-[#465BE6]">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-[#151923]">{label}</p>
        {sublabel ? <p className="text-xs text-[#747987]">{sublabel}</p> : null}
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-[4/3] w-full rounded-md bg-[#F1EFE9]" />
      <div className="space-y-2.5 pt-1">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-32 bg-[#E6E5E0]" />
          <Skeleton className="h-3 w-12 bg-[#E6E5E0]" />
        </div>
        <Skeleton className="h-4 w-full bg-[#E6E5E0]" />
        <Skeleton className="h-4 w-3/4 bg-[#E6E5E0]" />
        <div className="pt-2 border-t border-[#E6E5E0] space-y-2">
          <Skeleton className="h-5 w-28 bg-[#E6E5E0]" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={idx} />
      ))}
    </div>
  );
}

export default Loader;
