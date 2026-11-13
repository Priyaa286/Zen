import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bookmark,
  Globe,
  LogOut,
  MapPin,
  Package,
  Search,
  Sliders,
  User,
  Wallet,
  Store,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ZenLogo } from '@/components/common/ZenLogo';
import { ProfileSection } from '@/components/account/ProfileSection';
import { PreferencesSection } from '@/components/account/PreferencesSection';
import { SavedProducts } from '@/components/account/SavedProducts';
import { OrderHistory } from '@/components/account/OrderHistory';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { useToast } from '@/context/ToastContext';
import { SEOHead } from '@/components/common/SEOHead';

const ACCOUNT_TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'preferences', label: 'Country & Currency', icon: Sliders },
  { id: 'saved', label: 'Saved Items', icon: Bookmark },
  { id: 'orders', label: 'Orders', icon: Package },
];

export default function AccountSettings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isSeller, switchPersona, savedProducts, orders, logout } = useAuth();
  const { residenceCountry, preferredCurrency, deliveryCountry } = useCurrency();
  const { showToast } = useToast();

  const handleSwitchToMerchant = async () => {
    try {
      await switchPersona('seller@zen.global');
      showToast({
        title: 'Switched to Merchant Account',
        description: 'Signed in as Tokyo Optics & Craft (seller@zen.global)',
        tone: 'success',
      });
      navigate('/seller/dashboard');
    } catch (err) {
      showToast({
        title: 'Switch failed',
        description: err.message,
        tone: 'critical',
      });
    }
  };

  const requestedTab = searchParams.get('tab') || 'profile';
  const activeTab = ACCOUNT_TABS.some((t) => t.id === requestedTab) ? requestedTab : 'profile';

  const handleSelectTab = (tabId) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const handleLogout = async () => {
    await logout();
    showToast({
      title: 'Signed out',
      description: 'You can continue browsing Zen Global as a guest.',
      tone: 'info',
    });
    navigate('/');
  };

  const searchHistory = Array.isArray(user?.searchHistory) ? user.searchHistory : [];

  return (
    <section className="mx-auto max-w-[1160px] px-4 py-8 sm:px-6 lg:py-10">
      <SEOHead
        title="Account Settings & Preferences"
        robots="noindex, nofollow"
      />
      <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-[#E6E5E0] bg-white p-6 shadow-subtle md:flex-row md:items-center">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <ZenLogo size="xs" alt="Zen Global" />
            <span aria-hidden="true" className="h-3.5 w-px bg-[#E6E5E0]" />
            <p className="text-[11px] font-[600] uppercase tracking-[0.08em] text-[#465BE6]">
              Global Account
            </p>
          </div>
          <h1 className="text-[26px] font-[680] tracking-[-0.025em] text-[#151923]">
            {user?.fullName || 'Your Account'}
          </h1>
          <p className="text-[13.5px] text-[#747987]">{user?.email}</p>

          <div className="flex flex-wrap items-center gap-2 pt-2 text-[12px]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E6E5E0] bg-[#F8F7F4] px-3 py-1 font-medium text-[#151923]">
              <Globe className="h-3.5 w-3.5 text-[#465BE6]" />
              Residence: {user?.residenceCountry || residenceCountry}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E6E5E0] bg-[#F8F7F4] px-3 py-1 font-medium text-[#151923]">
              <Wallet className="h-3.5 w-3.5 text-[#465BE6]" />
              Currency: {preferredCurrency}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E6E5E0] bg-[#F8F7F4] px-3 py-1 font-medium text-[#151923]">
              <MapPin className="h-3.5 w-3.5 text-[#168B66]" />
              Delivery: {deliveryCountry}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button asChild variant="outline" size="sm">
            <Link to="/assistant">Open AI Assistant</Link>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>
      </div>

      {/* Merchant Business Centre Quick Access & Switcher Banner */}
      <div className="mb-6 rounded-2xl border border-blue-200/80 bg-gradient-to-r from-blue-50/70 via-indigo-50/30 to-white p-5 shadow-subtle flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[#465BE5]">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#172554]">
                {isSeller
                  ? 'Merchant Business Centre Active'
                  : 'Zen Merchant Business Centre & Seller Portal'}
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100/80 px-2 py-0.5 text-[10.5px] font-semibold text-[#172554]">
                <ShieldCheck className="h-3 w-3 text-[#465BE5]" />
                Multi-Vendor
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[#475569] leading-relaxed max-w-xl">
              {isSeller
                ? 'Manage international listings, dispatch air freight tracking, and review multi-currency financial settlements.'
                : 'Experience the upgraded Shopify & Stripe style merchant management suite with live revenue analytics, transaction ledgers, and PayPal sandbox settlements.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {isSeller ? (
            <Button asChild size="sm" className="bg-[#172554] text-white hover:bg-[#1E3A8A] text-xs font-semibold gap-1.5">
              <Link to="/seller/dashboard">
                <span>Open Merchant Centre</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : (
            <>
              <Button
                type="button"
                size="sm"
                onClick={handleSwitchToMerchant}
                className="bg-[#465BE5] text-white hover:bg-[#3848b8] text-xs font-semibold gap-1.5 shadow-xs"
              >
                <Store className="h-3.5 w-3.5" />
                <span>Switch to Verified Merchant (Tokyo Optics)</span>
              </Button>
              <Button asChild variant="outline" size="sm" className="text-xs">
                <Link to="/seller/register">Register Store</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Account sections"
        className="mb-6 flex flex-wrap gap-2 border-b border-[#E6E5E0] pb-3"
      >
        {ACCOUNT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const badgeCount =
            tab.id === 'saved'
              ? savedProducts.length
              : tab.id === 'orders'
              ? orders.length
              : null;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSelectTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-[560] transition-colors ${
                isActive
                  ? 'bg-[#151923] text-white shadow-subtle'
                  : 'bg-white text-[#4A5060] hover:bg-[#F1EFE9] hover:text-[#151923]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {badgeCount !== null ? (
                <span
                  className={`tabular-nums rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#F1EFE9] text-[#151923]'
                  }`}
                >
                  {badgeCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="space-y-6">
        {activeTab === 'profile' ? (
          <>
            <ProfileSection />
            <div className="rounded-xl border border-[#E6E5E0] bg-white p-6 shadow-subtle">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E5E0] pb-3.5">
                <div>
                  <h3 className="flex items-center gap-2 text-[16px] font-[620] text-[#151923]">
                    <Search className="h-4 w-4 text-[#465BE6]" />
                    Recent Shopping Searches
                  </h3>
                  <p className="mt-0.5 text-[12.5px] text-[#747987]">
                    Click any saved search to pick up where you left off in the Shopping Assistant.
                  </p>
                </div>
              </div>
              {searchHistory.length === 0 ? (
                <p className="mt-4 text-[13px] text-[#747987]">
                  No recent queries logged yet. Try asking Zen to compare global electronics in{' '}
                  {preferredCurrency}.
                </p>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  {searchHistory.map((item) => (
                    <Link
                      key={item.id || item.query}
                      to={`/assistant?q=${encodeURIComponent(item.query)}`}
                      className="inline-flex items-center gap-2 rounded-full border border-[#E6E5E0] bg-[#F8F7F4] px-3.5 py-1.5 text-[12.5px] font-medium text-[#151923] transition-colors hover:border-[#465BE6] hover:bg-white"
                    >
                      <span>{item.query}</span>
                      <span className="text-[11px] text-[#747987]">
                        {item.targetCurrency || item.preferredCurrency} · {item.destinationCountry}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}

        {activeTab === 'preferences' ? <PreferencesSection /> : null}
        {activeTab === 'saved' ? <SavedProducts /> : null}
        {activeTab === 'orders' ? <OrderHistory /> : null}
      </div>
    </section>
  );
}
