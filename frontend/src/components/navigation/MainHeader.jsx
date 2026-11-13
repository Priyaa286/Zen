import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bookmark,
  ChevronDown,
  Globe,
  LogOut,
  Menu,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sliders,
  Store,
  User,
  X,
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useCartContext } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { MOCK_DEMO_ACCOUNTS } from '@/mocks/mockAuth';
import { ZenLogo } from '@/components/common/ZenLogo';
import { AnimatedBadgeCounter } from '@/components/motion/AnimatedCounter';
import { dropdownVariants } from '@/animations/variants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GlobalSearch } from './GlobalSearch';
import { CategoryNavigation } from './CategoryNavigation';
import { MobileNavigation } from './MobileNavigation';
import { cn } from '@/utils/cn';

export function MainHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const {
    destinationCountry,
    preferredCurrency,
    supportedCountries,
    supportedCurrencies,
    useMockApi,
    setDestinationCountry,
    setPreferredCurrency,
    toggleMockApi,
  } = useAppContext();

  const {
    comparisonItems,
    cartCount,
    setCartDrawerOpen,
  } = useCartContext();

  const {
    user,
    role,
    isSeller,
    isAdmin,
    isBuyer,
    sellerStatus,
    isAuthenticated,
    savedProducts,
    orders,
    logout,
    updatePreferences,
    switchPersona,
  } = useAuth();

  const urlQuery = new URLSearchParams(location.search).get('q') || '';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!profileOpen) return undefined;
    const handleOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [profileOpen]);

  const activeCountry =
    supportedCountries.find((c) => c.code === destinationCountry) || supportedCountries[0];
  const activeCurrency =
    supportedCurrencies.find((c) => c.code === preferredCurrency) || supportedCurrencies[0];

  const handlePersonaSwitch = async (email, label) => {
    try {
      await switchPersona(email);
      setProfileOpen(false);
      showToast({
        title: `Switched persona to ${label}`,
        description: `Active role is now ${email}`,
        tone: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Switch failed',
        description: err?.message,
        tone: 'critical',
      });
    }
  };

  const handleCountryChange = (code) => {
    setDestinationCountry(code);
    if (isAuthenticated) {
      updatePreferences({ defaultDeliveryCountry: code }).catch(() => {});
    }
    const match = supportedCountries.find((c) => c.code === code);
    showToast({
      title: `Delivery country set to ${match?.name || code}`,
      description: `Shipping & duties updated independently of ${preferredCurrency}.`,
      tone: 'info',
    });
  };

  const handleCurrencyChange = (currCode) => {
    setPreferredCurrency(currCode);
    if (isAuthenticated) {
      updatePreferences({ preferredCurrency: currCode }).catch(() => {});
    }
    showToast({
      title: `Display currency switched to ${currCode}`,
      tone: 'info',
    });
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    setMobileOpen(false);
    await logout();
    showToast({
      title: 'Signed out',
      description: 'You are now browsing as a guest.',
      tone: 'info',
    });
    navigate('/');
  };

  const handleModeToggle = () => {
    const next = !useMockApi;
    toggleMockApi(next);
    showToast({
      title: next ? 'Switched to Mock Preview mode' : 'Switched to Live FastAPI backend',
      description: next
        ? 'Using isolated frontend catalog, FX & sandbox simulator.'
        : 'Requests will connect directly to FastAPI services.',
      tone: next ? 'warning' : 'success',
    });
  };

  const handleCartClick = () => {
    if (!isAuthenticated) {
      showToast({
        title: 'Sign in required',
        description: 'Please sign in to view or add items to your cart.',
        tone: 'info',
      });
      navigate('/login');
      return;
    }
    setCartDrawerOpen(true);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-[#E5E7EB] bg-white/95 backdrop-blur-md transition-shadow duration-300',
        scrolled ? 'shadow-sm' : 'shadow-none'
      )}
    >
      {/* Row 1: Brand + Prominent Global Search + Account / Wishlist / Cart / Localization */}
      <div className="zen-container flex h-[64px] items-center justify-between gap-3 md:gap-4">
        {/* LEFT: Official Zen Brand Logo */}
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          aria-label="Zen Global Home"
          className="group flex shrink-0 items-center gap-2.5 focus:outline-none"
        >
          <ZenLogo
            size="header"
            priority
            alt="Zen Global"
            imgClassName="transition-transform duration-200 group-hover:scale-[1.02]"
          />
          <span
            aria-hidden="true"
            className="hidden h-3.5 w-px bg-[#E5E7EB] xl:inline-block"
          />
          <span className="hidden text-[10px] font-[600] uppercase tracking-[0.16em] text-[#697586] xl:inline-block">
            Global
          </span>
        </Link>

        {/* CENTER: Global Product Search Bar */}
        <div className="hidden md:flex flex-1 min-w-0 max-w-xl">
          <GlobalSearch initialValue={urlQuery} />
        </div>

        {/* RIGHT: Mode Toggle + Country/Currency + Account + Wishlist + Cart */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Desktop Mode Indicator (Single visible badge on desktop) */}
          <button
            type="button"
            onClick={handleModeToggle}
            title="Toggle between Mock Sandbox Preview and Live FastAPI backend"
            className="hidden lg:inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium text-[#697586] transition-colors hover:bg-[#F7F8FA] hover:text-[#17202F]"
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                useMockApi ? 'bg-[#D69A29]' : 'bg-[#15976B]'
              )}
            />
            <span>{useMockApi ? 'Mock' : 'Live'}</span>
          </button>

          {/* Paired Independent Destination & Currency Selectors */}
          <div className="hidden lg:flex h-8 items-center divide-x divide-[#E5E7EB] rounded-md border border-[#E5E7EB] bg-[#F7F8FA]">
            <Select value={destinationCountry} onValueChange={handleCountryChange}>
              <SelectTrigger
                aria-label="Destination country"
                className="h-full w-auto border-0 bg-transparent px-2.5 text-xs shadow-none focus:ring-0 focus:ring-offset-0 hover:bg-white rounded-l-md rounded-r-none"
              >
                <span className="sr-only">
                  <SelectValue />
                </span>
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <Globe className="h-3.5 w-3.5 text-[#697586] shrink-0" />
                  <span className="font-semibold tracking-[0.02em] text-[#17202F]">
                    {activeCountry?.code}
                  </span>
                  <span className="hidden 2xl:inline text-[#697586]">
                    {activeCountry?.name}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent align="end">
                {supportedCountries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <span className="flex items-center gap-2 text-xs">
                      <span className="w-5 font-semibold text-[#17202F]">
                        {country.code}
                      </span>
                      <span className="text-[#697586]">{country.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={preferredCurrency} onValueChange={handleCurrencyChange}>
              <SelectTrigger
                aria-label="Display currency"
                className="h-full w-auto border-0 bg-transparent px-2.5 text-xs shadow-none focus:ring-0 focus:ring-offset-0 hover:bg-white rounded-r-md rounded-l-none tabular-nums"
              >
                <span className="sr-only">
                  <SelectValue />
                </span>
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className="font-semibold text-[#17202F]">
                    {activeCurrency?.code}
                  </span>
                  <span className="text-[#697586]">{activeCurrency?.symbol}</span>
                </div>
              </SelectTrigger>
              <SelectContent align="end">
                {supportedCurrencies.map((curr) => (
                  <SelectItem key={curr.code} value={curr.code}>
                    <span className="flex items-center justify-between gap-3 text-xs tabular-nums">
                      <span className="font-semibold text-[#17202F]">{curr.code}</span>
                      <span className="text-[#697586]">{curr.symbol}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Wishlist shortcut */}
          <Link
            to={isAuthenticated ? '/account?tab=saved' : '/login'}
            onClick={(e) => {
              if (!isAuthenticated) {
                e.preventDefault();
                showToast({
                  title: 'Sign in required',
                  description: 'Please sign in to save items and view your wishlist.',
                  tone: 'info',
                });
                navigate('/login');
              }
            }}
            aria-label="Saved wishlist"
            className="hidden sm:inline-flex relative h-8 items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-2.5 text-[12px] font-medium text-[#17202F] transition-colors hover:bg-[#F7F8FA]"
          >
            <Bookmark className="h-3.5 w-3.5 text-[#697586]" />
            <span className="hidden xl:inline">Wishlist</span>
            {savedProducts.length > 0 ? (
              <AnimatedBadgeCounter
                count={savedProducts.length}
                className="rounded-full bg-[#F1F3F6] px-1.5 py-0.5 text-[10px] font-[650] tabular-nums text-[#172554]"
              />
            ) : null}
          </Link>

          {/* Shopping Cart Button -> Opens CartDrawer */}
          <button
            type="button"
            aria-label={`Shopping cart (${isAuthenticated ? cartCount : 0} items)`}
            onClick={handleCartClick}
            className="relative inline-flex h-8 items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-2.5 text-[12px] font-[600] text-[#17202F] transition-colors hover:border-[#465BE5]/50 hover:bg-[#F7F8FA]"
          >
            <ShoppingBag className="h-3.5 w-3.5 text-[#172554]" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 ? (
              <AnimatedBadgeCounter
                count={cartCount}
                className="inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-[#465BE5] px-1 text-[10.5px] font-[680] tabular-nums text-white"
              />
            ) : (
              <span className="inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-[#F1F3F6] px-1 text-[10.5px] font-[680] tabular-nums text-[#697586]">
                0
              </span>
            )}
          </button>

          {/* Account / Sign In */}
          {isAuthenticated ? (
            <div ref={profileMenuRef} className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-2.5 text-xs font-[580] text-[#17202F] transition-colors hover:bg-[#F7F8FA]"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#172554] text-[10px] font-semibold text-white">
                  {(user?.fullName || 'U').trim().charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[84px] truncate">
                  {user?.fullName?.split(' ')[0] || 'Account'}
                </span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 text-[#697586] transition-transform duration-200',
                    profileOpen ? 'rotate-180' : ''
                  )}
                />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    role="menu"
                    className="absolute right-0 top-10 z-50 w-56 origin-top-right rounded-xl border border-[#E5E7EB] bg-white p-1.5 shadow-elevated"
                  >
                    <div className="border-b border-[#E5E7EB] px-3 py-2">
                      <p className="truncate text-[13px] font-[600] text-[#17202F]">
                        {user?.fullName || 'Zen Member'}
                      </p>
                      <p className="truncate text-[11.5px] text-[#697586]">{user?.email}</p>
                    </div>

                    <div className="py-1">
                      {/* Merchant & Admin Role Shortcuts */}
                      {isSeller && (
                        <Link
                          to="/seller/dashboard"
                          role="menuitem"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-semibold text-[#172554] bg-blue-50/70 hover:bg-blue-100/70 transition-colors"
                        >
                          <Store className="h-3.5 w-3.5 text-[#172554]" />
                          <span>Merchant Dashboard</span>
                        </Link>
                      )}

                      {isAdmin && (
                        <Link
                          to="/admin"
                          role="menuitem"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-semibold text-purple-900 bg-purple-50/70 hover:bg-purple-100/70 transition-colors"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-purple-700" />
                          <span>Admin Compliance</span>
                        </Link>
                      )}

                      {!isSeller && !isAdmin && (
                        <>
                          <Link
                            to="/sell"
                            role="menuitem"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-medium text-[#17202F] hover:bg-[#F7F8FA]"
                          >
                            <Store className="h-3.5 w-3.5 text-[#697586]" />
                            <span>Sell on Zen</span>
                          </Link>
                          {useMockApi && (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={async () => {
                                setProfileOpen(false);
                                if (switchPersona) {
                                  await switchPersona('seller@zen.global');
                                  showToast({
                                    title: 'Switched to Merchant',
                                    description: 'Active store: Tokyo Optics & Craft (seller@zen.global)',
                                    tone: 'success',
                                  });
                                  navigate('/seller/dashboard');
                                }
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-semibold text-[#465BE5] hover:bg-blue-50 transition-colors"
                            >
                              <Store className="h-3.5 w-3.5 text-[#465BE5]" />
                              <span>Switch to Merchant (Tokyo Optics)</span>
                            </button>
                          )}
                        </>
                      )}

                      <Link
                        to="/account?tab=profile"
                        role="menuitem"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-medium text-[#17202F] hover:bg-[#F7F8FA]"
                      >
                        <User className="h-3.5 w-3.5 text-[#697586]" />
                        My Account
                      </Link>
                      <Link
                        to="/account?tab=saved"
                        role="menuitem"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-[12.5px] font-medium text-[#17202F] hover:bg-[#F7F8FA]"
                      >
                        <span className="flex items-center gap-2">
                          <Bookmark className="h-3.5 w-3.5 text-[#697586]" />
                          Saved items
                        </span>
                        <span className="tabular-nums rounded-full bg-[#F1F3F6] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#17202F]">
                          {savedProducts.length}
                        </span>
                      </Link>
                      <Link
                        to="/account?tab=orders"
                        role="menuitem"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-[12.5px] font-medium text-[#17202F] hover:bg-[#F7F8FA]"
                      >
                        <span className="flex items-center gap-2">
                          <Package className="h-3.5 w-3.5 text-[#697586]" />
                          Orders
                        </span>
                        <span className="tabular-nums rounded-full bg-[#F1F3F6] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#17202F]">
                          {orders.length}
                        </span>
                      </Link>
                      <Link
                        to="/account?tab=preferences"
                        role="menuitem"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-medium text-[#17202F] hover:bg-[#F7F8FA]"
                      >
                        <Sliders className="h-3.5 w-3.5 text-[#697586]" />
                        Preferences
                      </Link>
                    </div>

                    {/* Demo Persona Switcher when Mock Mode is Active */}
                    {useMockApi && (
                      <div className="border-t border-[#E5E7EB] pt-1 pb-1">
                        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#697586]">
                          Switch Demo Persona
                        </div>
                        <div className="space-y-0.5 px-1">
                          {MOCK_DEMO_ACCOUNTS.map((acc) => (
                            <button
                              key={acc.email}
                              type="button"
                              onClick={() => handlePersonaSwitch(acc.email, acc.label)}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1 text-left text-[11px] transition-colors ${
                                user?.email === acc.email
                                  ? 'bg-blue-100/70 font-bold text-[#172554]'
                                  : 'text-[#17202F] hover:bg-[#F7F8FA]'
                              }`}
                            >
                              <span className="truncate max-w-[130px]">{acc.label.split(' (')[0]}</span>
                              <span className="text-[9.5px] font-bold tracking-wider uppercase text-[#697586]">
                                {acc.role}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-[#E5E7EB] pt-1">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12.5px] font-medium text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1.5">
              <Link
                to="/login"
                className="inline-flex h-8 items-center rounded-md px-2.5 text-[12.5px] font-[550] text-[#17202F] transition-colors hover:bg-[#F7F8FA]"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="inline-flex h-8 items-center rounded-md bg-[#172554] px-3 text-[12.5px] font-[580] text-white transition-colors hover:bg-[#1E3A8A]"
              >
                Get started
              </Link>
            </div>
          )}

          {/* Mobile Drawer Trigger */}
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#E5E7EB] bg-white text-[#17202F] lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Compact Search Bar (< md) */}
      <div className="border-t border-[#E5E7EB] bg-white px-4 py-2 md:hidden">
        <GlobalSearch compact initialValue={urlQuery} />
      </div>

      {/* Row 2: Marketplace Category Navigation (md+) */}
      <CategoryNavigation comparisonCount={comparisonItems.length} />

      {/* Mobile Navigation Drawer */}
      <MobileNavigation
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        destinationCountry={destinationCountry}
        preferredCurrency={preferredCurrency}
        supportedCountries={supportedCountries}
        supportedCurrencies={supportedCurrencies}
        onCountryChange={handleCountryChange}
        onCurrencyChange={handleCurrencyChange}
        useMockApi={useMockApi}
        onModeToggle={handleModeToggle}
        isAuthenticated={isAuthenticated}
        user={user}
        cartCount={isAuthenticated ? cartCount : 0}
        savedCount={isAuthenticated ? savedProducts.length : 0}
        onOpenCart={handleCartClick}
        onLogout={handleLogout}
      />
    </header>
  );
}

