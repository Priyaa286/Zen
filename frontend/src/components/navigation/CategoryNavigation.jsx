import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, LayoutGrid, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  getAllCategories,
  getOverflowNavCategories,
  getPrimaryNavCategories,
} from '@/data/categories';
import { dropdownVariants } from '@/animations/variants';
import { usePrefersReducedMotion } from '@/animations/animationUtils';
import { cn } from '@/utils/cn';

export function CategoryNavigation({ comparisonCount = 0 }) {
  const location = useLocation();
  const prefersReduced = usePrefersReducedMotion();
  const params = new URLSearchParams(location.search);
  const activeCategory = location.pathname === '/results' ? params.get('category') || '' : '';

  const [megaOpen, setMegaOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const navRef = useRef(null);

  const allCategories = getAllCategories();
  const primaryCategories = getPrimaryNavCategories();
  const overflowCategories = getOverflowNavCategories();

  useEffect(() => {
    setMegaOpen(false);
    setMoreOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!megaOpen && !moreOpen) return undefined;
    const handleOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMegaOpen(false);
        setMoreOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setMegaOpen(false);
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [megaOpen, moreOpen]);

  return (
    <div
      ref={navRef}
      className="relative hidden md:block border-t border-[#E5E7EB] bg-white"
    >
      <div className="zen-container flex h-10 items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-1 lg:gap-1.5">
          {/* All Categories Mega-Menu Trigger */}
          <button
            type="button"
            aria-expanded={megaOpen}
            aria-haspopup="true"
            onClick={() => {
              setMoreOpen(false);
              setMegaOpen((v) => !v);
            }}
            className={cn(
              'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-[600] transition-colors whitespace-nowrap',
              megaOpen
                ? 'bg-[#172554] text-white'
                : 'bg-[#F1F3F6] text-[#17202F] hover:bg-[#E5E7EB]'
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>All Categories</span>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                megaOpen ? 'rotate-180' : ''
              )}
            />
          </button>

          <span aria-hidden="true" className="mx-1 h-4 w-px shrink-0 bg-[#E5E7EB]" />

          {/* Primary Category Bar with Layout Animation */}
          <nav
            aria-label="Product categories"
            className="flex min-w-0 items-center gap-0.5 lg:gap-1"
          >
            {primaryCategories.map((cat, idx) => {
              const isActive = activeCategory === cat.slug;
              const visibilityClass =
                idx >= 7
                  ? 'hidden xl:inline-flex'
                  : idx >= 5
                    ? 'hidden lg:inline-flex'
                    : 'inline-flex';

              return (
                <Link
                  key={cat.slug}
                  to={`/results?category=${encodeURIComponent(cat.slug)}`}
                  className={cn(
                    visibilityClass,
                    'relative h-8 shrink-0 items-center rounded-md px-2 xl:px-2.5 text-[12.5px] whitespace-nowrap transition-colors',
                    isActive
                      ? 'font-[620] text-[#465BE5]'
                      : 'font-[500] text-[#697586] hover:bg-[#F7F8FA] hover:text-[#17202F]'
                  )}
                >
                  {isActive && !prefersReduced && (
                    <motion.span
                      layoutId="activeCategoryIndicator"
                      className="absolute inset-0 rounded-md bg-[#465BE5]/10 -z-10"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  {cat.shortName || cat.name}
                </Link>
              );
            })}
          </nav>

          {/* More Overflow Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              onClick={() => {
                setMegaOpen(false);
                setMoreOpen((v) => !v);
              }}
              className={cn(
                'inline-flex h-8 items-center gap-1 rounded-md px-2 text-[12.5px] font-[550] whitespace-nowrap transition-colors',
                moreOpen
                  ? 'bg-[#F1F3F6] text-[#172554]'
                  : 'text-[#697586] hover:bg-[#F7F8FA] hover:text-[#17202F]'
              )}
            >
              <span>More</span>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 transition-transform duration-200',
                  moreOpen ? 'rotate-180' : ''
                )}
              />
            </button>

            <AnimatePresence>
              {moreOpen && (
                <motion.div
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  role="menu"
                  aria-label="More marketplace categories"
                  className="absolute left-0 top-10 z-50 w-64 origin-top-left rounded-xl border border-[#E5E7EB] bg-white p-1.5 shadow-elevated"
                >
                  <div className="px-2.5 py-1.5 text-[10.5px] font-[650] uppercase tracking-[0.06em] text-[#697586]">
                    Specialized Departments
                  </div>
                  {overflowCategories.map((cat) => (
                    <Link
                      key={cat.slug}
                      role="menuitem"
                      to={`/results?category=${encodeURIComponent(cat.slug)}`}
                      className={cn(
                        'flex items-center justify-between rounded-lg px-2.5 py-2 text-[12.5px] transition-colors',
                        activeCategory === cat.slug
                          ? 'bg-[#465BE5]/10 font-[600] text-[#465BE5]'
                          : 'font-medium text-[#17202F] hover:bg-[#F7F8FA]'
                      )}
                    >
                      <span>{cat.name}</span>
                      <span className="text-[11px] text-[#697586]">Shop →</span>
                    </Link>
                  ))}
                  {/* Primary categories 6-9 inside More for lg/md viewports */}
                  <div className="xl:hidden border-t border-[#E5E7EB] mt-1 pt-1">
                    {primaryCategories.slice(5).map((cat) => (
                      <Link
                        key={cat.slug}
                        role="menuitem"
                        to={`/results?category=${encodeURIComponent(cat.slug)}`}
                        className={cn(
                          'flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[12.5px] lg:hidden',
                          activeCategory === cat.slug
                            ? 'bg-[#465BE5]/10 font-[600] text-[#465BE5]'
                            : 'font-medium text-[#17202F] hover:bg-[#F7F8FA]',
                          primaryCategories.indexOf(cat) >= 7 && 'lg:flex'
                        )}
                      >
                        <span>{cat.name}</span>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Single Merchant Shortcut & Quick AI Assistant & Compare */}
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/sell"
            className="hidden xl:inline-flex items-center gap-1 text-[12px] font-[550] text-[#697586] hover:text-[#172554] px-2 py-1 transition-colors"
          >
            <span>Sell on Zen</span>
          </Link>
          {comparisonCount > 0 ? (
            <Link
              to="/results?compare=open"
              className="inline-flex h-7 items-center rounded-md border border-[#465BE5]/30 bg-[#465BE5]/10 px-2.5 text-[11.5px] font-[600] text-[#465BE5] whitespace-nowrap"
            >
              Compare ({comparisonCount})
            </Link>
          ) : null}
          <Link
            to="/assistant"
            className={cn(
              'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-[600] whitespace-nowrap transition-colors',
              location.pathname === '/assistant'
                ? 'bg-[#465BE5] text-white'
                : 'bg-[#465BE5]/10 text-[#465BE5] hover:bg-[#465BE5]/15'
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Shopping Assistant</span>
          </Link>
        </div>
      </div>

      {/* Full 15-Category Mega-Menu Panel with Framer Motion slide & fade */}
      <AnimatePresence>
        {megaOpen && (
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? false : { opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-full z-50 border-b border-t border-[#E5E7EB] bg-white shadow-elevated"
          >
            <div className="zen-container py-5">
              <div className="mb-3 flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
                <div>
                  <p className="text-[13px] font-[650] text-[#17202F]">
                    Browse all 15 international departments
                  </p>
                  <p className="text-[11.5px] text-[#697586]">
                    Clear pricing, currency conversion &amp; PayPal protection across every category
                  </p>
                </div>
                <Link
                  to="/results"
                  className="text-[12px] font-[600] text-[#465BE5] hover:text-[#172554]"
                >
                  Explore full marketplace →
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-x-5 gap-y-3.5 lg:grid-cols-5">
                {allCategories.map((cat) => (
                  <div
                    key={cat.slug}
                    className={cn(
                      'rounded-lg border p-2.5 transition-colors',
                      activeCategory === cat.slug
                        ? 'border-[#465BE5] bg-[#465BE5]/5'
                        : 'border-[#E5E7EB] bg-[#F7F8FA]/50 hover:border-[#CBD5E1] hover:bg-white'
                    )}
                  >
                    <Link
                      to={`/results?category=${encodeURIComponent(cat.slug)}`}
                      className="block text-[13px] font-[650] text-[#172554] hover:text-[#465BE5]"
                    >
                      {cat.name}
                    </Link>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {cat.subcategories.slice(0, 3).map((sub) => (
                        <Link
                          key={sub}
                          to={`/results?category=${encodeURIComponent(cat.slug)}&subcategory=${encodeURIComponent(sub)}`}
                          className="rounded bg-white px-1.5 py-0.5 text-[11px] text-[#697586] ring-1 ring-[#E5E7EB] hover:text-[#17202F]"
                        >
                          {sub}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CategoryNavigation;