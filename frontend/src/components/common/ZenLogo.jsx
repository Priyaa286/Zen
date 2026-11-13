import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';

export const ZEN_LOGO_SVG = '/assets/branding/zen_logo.svg';
export const ZEN_LOGO_PNG = '/assets/branding/Zen.png';

const INTRINSIC_WIDTH = 1293;
const INTRINSIC_HEIGHT = 679;

const SIZE_HEIGHT_CLASSES = {
  xs: 'h-6',
  sm: 'h-7',
  header: 'h-8 sm:h-9',
  md: 'h-9',
  lg: 'h-11',
  xl: 'h-14',
};

/**
 * Centralized official Zen brand logo component.
 * Preserves original aspect ratio (1293:679) with object-contain,
 * SVG vector rendering by default, and automatic PNG fallback.
 */
export function ZenLogo({
  format = 'svg',
  variant = 'wordmark',
  size = 'md',
  surface = 'light',
  width,
  height,
  alt = 'Zen Global',
  className,
  imgClassName,
  priority = true,
  ...rest
}) {
  const preferredSrc = format === 'png' ? ZEN_LOGO_PNG : ZEN_LOGO_SVG;
  const [src, setSrc] = useState(preferredSrc);

  useEffect(() => {
    setSrc(preferredSrc);
  }, [preferredSrc]);

  const handleError = () => {
    if (src !== ZEN_LOGO_PNG) {
      setSrc(ZEN_LOGO_PNG);
    }
  };

  const hasCustomDimensions = width !== undefined || height !== undefined;

  const style = hasCustomDimensions
    ? {
        ...(width !== undefined ? { width } : {}),
        ...(height !== undefined ? { height } : {}),
        aspectRatio: `${INTRINSIC_WIDTH} / ${INTRINSIC_HEIGHT}`,
      }
    : {
        aspectRatio: `${INTRINSIC_WIDTH} / ${INTRINSIC_HEIGHT}`,
      };

  const sizeClass = hasCustomDimensions
    ? undefined
    : variant === 'icon'
    ? SIZE_HEIGHT_CLASSES[size === 'md' ? 'sm' : size] || SIZE_HEIGHT_CLASSES.sm
    : SIZE_HEIGHT_CLASSES[size] || SIZE_HEIGHT_CLASSES.md;

  const isDarkSurface = surface === 'dark';

  const logoElement = (
    <img
      src={src}
      onError={handleError}
      alt={alt}
      width={INTRINSIC_WIDTH}
      height={INTRINSIC_HEIGHT}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      style={style}
      className={cn(
        'block w-auto max-w-full shrink-0 select-none object-contain',
        sizeClass,
        imgClassName
      )}
      {...rest}
    />
  );

  if (variant === 'icon') {
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-lg px-1.5 py-0.5',
          isDarkSurface
            ? 'bg-white/95 ring-1 ring-white/20 shadow-xs'
            : 'border border-[#E5E7EB] bg-white',
          className
        )}
      >
        {logoElement}
      </span>
    );
  }

  if (isDarkSurface) {
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-lg bg-white/95 px-2.5 py-1 ring-1 ring-white/20 shadow-xs',
          className
        )}
      >
        {logoElement}
      </span>
    );
  }

  return (
    <span className={cn('inline-flex shrink-0 items-center', className)}>
      {logoElement}
    </span>
  );
}

export default ZenLogo;
