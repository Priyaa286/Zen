import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  Store,
  X,
  HelpCircle,
} from 'lucide-react';
import { SellerNavigation } from './SellerNavigation';
import { cn } from '@/utils/cn';

export function SellerSidebar({
  store,
  activeTab,
  onSelectTab,
  productsCount = 0,
  ordersCount = 0,
  actionOrdersCount = 0,
  isMobileOpen = false,
  onCloseMobile,
}) {
  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between overflow-y-auto p-4 space-y-6">
      {/* Navigation Groups - Starts directly with BUSINESS */}
      <div>
        <SellerNavigation
          activeTab={activeTab}
          onSelectTab={(tabId) => {
            if (onSelectTab) onSelectTab(tabId);
            if (onCloseMobile) onCloseMobile();
          }}
          productsCount={productsCount}
          ordersCount={ordersCount}
          actionOrdersCount={actionOrdersCount}
        />
      </div>

      {/* Bottom: Anchored Marketplace & Support Links */}
      <div className="space-y-2.5 pt-4 border-t border-gray-100 text-xs mt-auto">
        <div className="rounded-lg bg-blue-50/50 p-2.5 border border-blue-100/60 text-[#172554]">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#697586]">Commission:</span>
            <span className="font-bold">5.0% flat</span>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-1">
            <span className="text-[#697586]">Escrow Release:</span>
            <span className="font-semibold text-emerald-700">72h Post-Dispatch</span>
          </div>
        </div>

        <Link
          to="/"
          className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold text-[#17202F] hover:bg-[#F7F8FA] transition-colors shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Store className="h-3.5 w-3.5 text-[#697586]" />
            <span>Buyer Marketplace</span>
          </div>
          <ExternalLink className="h-3 w-3 text-[#9CA3AF]" />
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Stationary Fixed Sidebar (Occupies full viewport below header) */}
      <aside className="hidden md:flex fixed left-0 top-14 bottom-0 w-64 flex-col justify-between border-r border-[#E5E7EB] bg-white z-30 overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-in Drawer with Backdrop */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-label="Close navigation drawer"
          />
          <div className="relative w-72 max-w-[80vw] bg-white shadow-2xl flex flex-col z-10 h-full">
            <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#17202F]">
                Merchant Navigation
              </span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="rounded-lg p-1 text-gray-400 hover:text-gray-600"
                aria-label="Close drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
