import { ChevronRight, Store } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

const SECTION_MAP = {
  overview: { group: 'Business', label: 'Overview' },
  sales: { group: 'Business', label: 'Sales & Revenue' },
  products: { group: 'Business', label: 'Products & Inventory' },
  orders: { group: 'Business', label: 'Orders & Fulfillment' },
  transactions: { group: 'Financials', label: 'Transactions' },
  revenue: { group: 'Financials', label: 'Revenue Statement' },
  settlements: { group: 'Financials', label: 'Settlements & Payouts' },
  analytics: { group: 'Growth', label: 'Sales Analytics' },
  corridors: { group: 'Growth', label: 'Trade Corridors' },
  customers: { group: 'Growth', label: 'Trade Corridors' },
  shipping: { group: 'Settings', label: 'Shipping & Origins' },
  settings: { group: 'Settings', label: 'Store Settings' },
  verification: { group: 'Compliance', label: 'Seller Verification' },
  register: { group: 'Onboarding', label: 'Register Store' },
};

export function SellerBreadcrumbs({ activeTab: propTab, storeName = 'Tokyo Optics & Craft' }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Extract from query param or subpath
  let currentKey = propTab || searchParams.get('tab') || 'overview';
  if (location.pathname.includes('/seller/verification')) currentKey = 'verification';
  if (location.pathname.includes('/seller/register')) currentKey = 'register';
  if (location.pathname.includes('/seller/products')) currentKey = 'products';
  if (location.pathname.includes('/seller/orders')) currentKey = 'orders';
  if (location.pathname.includes('/seller/transactions')) currentKey = 'transactions';
  if (location.pathname.includes('/seller/revenue')) currentKey = 'revenue';
  if (location.pathname.includes('/seller/settlements')) currentKey = 'settlements';
  if (location.pathname.includes('/seller/analytics')) currentKey = 'analytics';
  if (location.pathname.includes('/seller/shipping')) currentKey = 'shipping';
  if (location.pathname.includes('/seller/settings')) currentKey = 'settings';

  const section = SECTION_MAP[currentKey] || { group: 'Business', label: 'Dashboard' };

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#697586]">
      <Link
        to="/seller/dashboard"
        className="flex items-center gap-1.5 font-medium text-[#697586] hover:text-[#17202F] transition-colors"
      >
        <Store className="h-3.5 w-3.5 text-[#465BE5]" />
        <span className="hidden sm:inline">Merchant Centre</span>
      </Link>

      <ChevronRight className="h-3 w-3 text-gray-400 shrink-0" />

      <span className="text-gray-400 font-normal hidden md:inline">
        {section.group}
      </span>

      <ChevronRight className="h-3 w-3 text-gray-400 shrink-0 hidden md:inline" />

      <span className="font-semibold text-[#17202F] truncate max-w-[160px] sm:max-w-xs">
        {section.label}
      </span>
    </nav>
  );
}

