import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  PlusCircle,
  Boxes,
  Tags,
  ShoppingBag,
  Receipt,
  FileText,
  Wallet,
  LineChart,
  Globe2,
  Store,
  User,
  Truck,
  Lock,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export const SELLER_NAV_GROUPS = [
  {
    title: 'BUSINESS',
    items: [
      { id: 'overview', label: 'Overview', path: '/seller/dashboard', icon: LayoutDashboard },
      { id: 'sales', label: 'Sales & Revenue', path: '/seller/sales', icon: TrendingUp },
      { id: 'orders', label: 'Orders & Fulfillment', path: '/seller/orders', icon: ShoppingBag, badgeKey: 'orders' },
    ],
  },
  {
    title: 'PRODUCT MANAGEMENT',
    items: [
      { id: 'products', label: 'All Products', path: '/seller/products', icon: Package, badgeKey: 'products' },
      { id: 'products-new', label: 'Add New Product', path: '/seller/products/new', icon: PlusCircle, isAction: true },
      { id: 'inventory', label: 'Inventory', path: '/seller/inventory', icon: Boxes },
      { id: 'categories', label: 'Categories', path: '/seller/categories', icon: Tags },
    ],
  },
  {
    title: 'FINANCIALS',
    items: [
      { id: 'transactions', label: 'Transactions', path: '/seller/transactions', icon: Receipt },
      { id: 'revenue', label: 'Revenue Statement', path: '/seller/revenue', icon: FileText },
      { id: 'settlements', label: 'Settlements & Payouts', path: '/seller/settlements', icon: Wallet },
    ],
  },
  {
    title: 'GROWTH',
    items: [
      { id: 'analytics', label: 'Sales Analytics', path: '/seller/analytics', icon: LineChart },
      { id: 'corridors', label: 'Trade Corridors', path: '/seller/corridors', icon: Globe2 },
    ],
  },
  {
    title: 'SETTINGS',
    items: [
      { id: 'store-settings', label: 'Store Profile', path: '/seller/store-settings', icon: Store },
      { id: 'profile', label: 'Personal Profile', path: '/seller/profile', icon: User },
      { id: 'shipping', label: 'Shipping & Origins', path: '/seller/shipping', icon: Truck },
      { id: 'security', label: 'Account & Security', path: '/seller/security', icon: Lock },
    ],
  },
];

export function SellerNavigation({
  activeTab: propActiveTab,
  onSelectTab,
  productsCount = 0,
  ordersCount = 0,
  actionOrdersCount = 0,
}) {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const currentTab = propActiveTab || searchParams.get('tab') || 'overview';

  // Normalize aliases
  const resolvedTab =
    currentTab === 'analytics'
      ? 'sales'
      : currentTab === 'customers'
      ? 'corridors'
      : currentTab === 'settings'
      ? 'store-settings'
      : currentTab;

  return (
    <nav className="space-y-5 text-xs">
      {SELLER_NAV_GROUPS.map((group) => (
        <div key={group.title} className="space-y-1">
          <p className="px-3 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">
            {group.title}
          </p>

          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.id === 'overview' && (location.pathname === '/seller' || location.pathname === '/seller/dashboard') && !searchParams.get('tab')) ||
                (searchParams.get('tab') === item.id) ||
                (resolvedTab === item.id);

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => onSelectTab && onSelectTab(item.id)}
                  className={cn(
                    'group flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition-all text-left',
                    isActive
                      ? 'bg-blue-50/80 text-[#172554] font-semibold shadow-xs'
                      : item.isAction
                      ? 'text-[#465BE5] hover:bg-blue-50/40 hover:text-[#3848b8]'
                      : 'text-[#697586] hover:bg-[#F7F8FA] hover:text-[#17202F]'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        'h-4 w-4 transition-colors shrink-0',
                        isActive
                          ? 'text-[#465BE5]'
                          : item.isAction
                          ? 'text-[#465BE5]'
                          : 'text-[#9CA3AF] group-hover:text-[#17202F]'
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {/* Badges: Only meaningful badges (no clutter) */}
                  {item.isAction && (
                    <span className="rounded-full bg-blue-100/70 px-1.5 py-0.2 text-[9.5px] font-bold text-[#172554]">
                      + New
                    </span>
                  )}

                  {item.badgeKey === 'orders' && actionOrdersCount > 0 && (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[9.5px] font-bold text-amber-800 tabular-nums">
                      {actionOrdersCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
