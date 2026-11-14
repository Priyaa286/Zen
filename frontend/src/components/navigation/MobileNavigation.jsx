import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  ChevronRight,
  Globe,
  LogOut,
  Package,
  ShoppingBag,
  Sparkles,
  Store,
  User,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { getAllCategories } from '@/data/categories';
import { ZenLogo } from '@/components/common/ZenLogo';
import { GlobalSearch } from './GlobalSearch';
import { drawerSlideDownVariants } from '@/animations/variants';
import { usePrefersReducedMotion } from '@/animations/animationUtils';
import { cn } from '@/utils/cn';

export function MobileNavigation({
  open,
  onClose,
  destinationCountry,
  preferredCurrency,
  supportedCountries,
  supportedCurrencies,
  onCountryChange,
  onCurrencyChange,
  useMockApi,
  onModeToggle,
  isAuthenticated,
  user,
  cartCount,
  savedCount,
  onOpenCart,
  onLogout,
}) {
  const prefersReduced = usePrefersReducedMotion();
  const categories = getAllCategories();

  // Prevent background scrolling while mobile navigation drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={drawerSlideDownVariants}
          initial={prefersReduced ? false : 'hidden'}
          animate="visible"
          exit={prefersReduced ? false : 'exit'}
          className="border-t border-[#E5E7EB] bg-white lg:hidden max-h-[82vh] overflow-y-auto shadow-lg"
        >
          <div className="zen-container space-y-5 py-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <Link to="/" onClick={onClose} aria-label="Zen Global Home" className="inline-flex items-center">
                <ZenLogo size="sm" alt="Zen Global" />
              </Link>
              <span className="text-[11px] font-[600] uppercase tracking-[0.12em] text-[#697586]">
                Global Marketplace
              </span>
            </div>

            <GlobalSearch compact onSubmitted={onClose} />

            {/* Primary Shortcuts */}
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/results"
                onClick={onClose}
                className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F7F8FA] px-3 py-2.5 text-[13px] font-[600] text-[#17202F]"
              >
                <span>Marketplace</span>
                <ChevronRight className="h-4 w-4 text-[#697586]" />
              </Link>
              <Link
                to="/assistant"
                onClick={onClose}
                className="flex items-center justify-between rounded-lg border border-[#465BE5]/30 bg-[#465BE5]/10 px-3 py-2.5 text-[13px] font-[600] text-[#465BE5]"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Assistant
                </span>
                <ChevronRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCart();
                }}
                className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-[13px] font-[600] text-[#17202F]"
              >
                <span className="inline-flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5 text-[#172554]" />
                  Cart
                </span>
                <span className="rounded-full bg-[#465BE5] px-2 py-0.5 text-[11px] font-[650] text-white">
                  {cartCount}
                </span>
              </button>
              <Link
                to={isAuthenticated ? '/account?tab=saved' : '/login'}
                onClick={onClose}
                className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-[13px] font-[600] text-[#17202F]"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Bookmark className="h-3.5 w-3.5 text-[#697586]" />
                  Wishlist
                </span>
                <span className="rounded-full bg-[#F1F3F6] px-2 py-0.5 text-[11px] font-[650] text-[#17202F]">
                  {savedCount}
                </span>
              </Link>
            </div>

            {/* Merchant shortcut */}
            <Link
              to="/sell"
              onClick={onClose}
              className="flex items-center justify-between rounded-lg border border-[#172554]/20 bg-[#172554]/5 px-3.5 py-2.5 text-[13px] font-[650] text-[#172554]"
            >
              <span className="inline-flex items-center gap-2">
                <Store className="h-4 w-4" />
                Sell on Zen Global (5% Platform Fee)
              </span>
              <ChevronRight className="h-4 w-4" />
            </Link>

            {/* Department Links */}
            <div className="space-y-2 border-t border-[#E5E7EB] pt-4">
              <p className="text-[11px] font-[650] uppercase tracking-[0.08em] text-[#697586]">
                Departments
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-[12.5px]">
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    to={`/results?category=${encodeURIComponent(cat.slug)}`}
                    onClick={onClose}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 font-medium text-[#17202F] hover:bg-[#F7F8FA]"
                  >
                    <span className="truncate">{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Destination & Currency Selectors */}
            <div className="space-y-3 rounded-lg border border-[#E5E7EB] bg-[#F7F8FA] p-3 text-[12.5px]">
              <div>
                <label className="text-[11px] font-[600] uppercase tracking-[0.06em] text-[#697586]">
                  Delivering to
                </label>
                <select
                  value={destinationCountry}
                  onChange={(e) => onCountryChange(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[13px] font-medium text-[#17202F]"
                >
                  {supportedCountries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} · {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-[600] uppercase tracking-[0.06em] text-[#697586]">
                  Display Currency
                </label>
                <select
                  value={preferredCurrency}
                  onChange={(e) => onCurrencyChange(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[13px] font-medium text-[#17202F]"
                >
                  {supportedCurrencies.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.code} ({curr.symbol}) · {curr.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* User Account or Auth Actions */}
            <div className="border-t border-[#E5E7EB] pt-4">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-[650] text-[#17202F]">
                        {user?.fullName || 'Zen Shopper'}
                      </p>
                      <p className="text-[11.5px] text-[#697586]">{user?.email}</p>
                    </div>
                    <Link
                      to="/account"
                      onClick={onClose}
                      className="text-[12px] font-[600] text-[#465BE5]"
                    >
                      Settings →
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white py-2 text-[12.5px] font-[550] text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    onClick={onClose}
                    className="flex-1 rounded-lg border border-[#E5E7EB] bg-white py-2 text-center text-[13px] font-[600] text-[#17202F]"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={onClose}
                    className="flex-1 rounded-lg bg-[#172554] py-2 text-center text-[13px] font-[600] text-white"
                  >
                    Get started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MobileNavigation;
