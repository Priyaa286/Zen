import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePrefersReducedMotion } from '@/animations/animationUtils';
import { cn } from '@/utils/cn';

export function SmoothCarousel({
  children,
  title,
  subtitle,
  action,
  className = '',
  itemClassName = '',
  showControls = true,
  gap = 16,
}) {
  const scrollRef = useRef(null);
  const prefersReduced = usePrefersReducedMotion();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const checkScrollability = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  };

  useEffect(() => {
    checkScrollability();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScrollability, { passive: true });
    window.addEventListener('resize', checkScrollability, { passive: true });

    return () => {
      el.removeEventListener('scroll', checkScrollability);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [children]);

  const scrollByAmount = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild?.firstElementChild?.clientWidth || 280;
    const amount = direction === 'left' ? -cardWidth * 1.5 : cardWidth * 1.5;

    el.scrollBy({
      left: amount,
      behavior: prefersReduced ? 'auto' : 'smooth',
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollByAmount('left');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollByAmount('right');
    }
  };

  // Drag to scroll for desktop & touch
  const handleMouseDown = (e) => {
    // Only drag with left mouse button and not on interactive buttons/links
    if (e.button !== 0 || e.target.closest('a, button, input, select')) return;
    const el = scrollRef.current;
    if (!el) return;
    setIsDragging(true);
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const el = scrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.3;
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={title || 'Product carousel'}
      onKeyDown={handleKeyDown}
      className={cn('relative w-full select-none', className)}
    >
      {(title || showControls) && (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            {title && (
              <h2 className="text-[20px] sm:text-[24px] font-[680] tracking-[-0.02em] text-[#17202F]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-1 text-[13.5px] text-[#697586]">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {action}
            {showControls && (
              <div className="flex items-center gap-1.5 ml-2">
                <button
                  type="button"
                  aria-label="Previous items"
                  disabled={!canScrollLeft}
                  onClick={() => scrollByAmount('left')}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#17202F] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#465BE5]/20',
                    canScrollLeft
                      ? 'hover:border-[#465BE5] hover:text-[#465BE5] cursor-pointer'
                      : 'opacity-40 cursor-not-allowed text-[#CBD5E1]'
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next items"
                  disabled={!canScrollRight}
                  onClick={() => scrollByAmount('right')}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#17202F] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#465BE5]/20',
                    canScrollRight
                      ? 'hover:border-[#465BE5] hover:text-[#465BE5] cursor-pointer'
                      : 'opacity-40 cursor-not-allowed text-[#CBD5E1]'
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scrolling horizontal strip with scroll snap */}
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        tabIndex={0}
        aria-live="polite"
        className={cn(
          'flex overflow-x-auto scroll-smooth scrollbar-none pb-2 pt-1 focus:outline-none',
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        )}
        style={{
          scrollSnapType: isDragging ? 'none' : 'x mandatory',
          gap: `${gap}px`,
        }}
      >
        {Array.isArray(children)
          ? children.map((child, index) => (
              <div
                key={child?.key || index}
                style={{ scrollSnapAlign: 'start' }}
                className={cn('shrink-0', itemClassName)}
              >
                {child}
              </div>
            ))
          : children}
      </div>
    </div>
  );
}

export default SmoothCarousel;

