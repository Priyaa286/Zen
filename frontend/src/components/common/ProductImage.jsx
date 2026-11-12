import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/utils/cn';

export function ProductImage({
  src,
  alt = 'Product photograph',
  className,
  imgClassName,
  fit = 'cover',
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-1.5 bg-[#F1EFE9] text-[#8F94A2]',
          className
        )}
        role="img"
        aria-label={alt}
      >
        <ImageOff className="h-5 w-5 stroke-[1.5]" />
        <span className="text-[11px] font-medium tracking-tight text-[#747987]">
          No photo provided
        </span>
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden bg-[#F1EFE9]', className)}>
      <img
        src={src}
        alt={alt}
        loading="eager"
        onError={() => setHasError(true)}
        className={cn(
          'h-full w-full transition-transform duration-500 ease-out',
          fit === 'contain' ? 'object-contain' : 'object-cover',
          imgClassName
        )}
      />
    </div>
  );
}

export default ProductImage;
