import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  HelpCircle,
  Menu,
  ShieldCheck,
  Store,
  ExternalLink,
  Coins,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';
import { ZenLogo } from '@/components/common/ZenLogo';
import { SellerBreadcrumbs } from './SellerBreadcrumbs';
import { SellerAccountMenu } from './SellerAccountMenu';
import { cn } from '@/utils/cn';

export function SellerHeader({ store, activeTab, onToggleMobileSidebar }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const notifRef = useRef(null);
  const helpRef = useRef(null);

  const isApproved = store?.verificationStatus === 'APPROVED';
  const curr = store?.merchantCurrency || 'JPY';

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (helpRef.current && !helpRef.current.contains(e.target)) {
        setShowHelp(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 h-14 w-full border-b border-[#E5E7EB] bg-white/95 backdrop-blur-sm">
      <div className="flex h-full items-center justify-between px-3 md:px-6 gap-3">
        {/* LEFT: Mobile Toggle + Official Zen Brand Logo + Merchant Business Centre */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="md:hidden rounded-lg p-1.5 text-[#697586] hover:bg-[#F7F8FA] hover:text-[#17202F] transition-colors"
            aria-label="Toggle navigation sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link
            to="/seller/dashboard"
            aria-label="Zen Global Merchant Business Centre"
            className="group flex items-center gap-2 focus:outline-none"
          >
            <ZenLogo size="xs" alt="Zen Global" />
            <span aria-hidden="true" className="h-3.5 w-px bg-[#E5E7EB]" />
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#172554]">
                Seller
              </span>
              <span className="hidden lg:inline text-[11px] text-[#697586] font-normal">
                Business Centre
              </span>
            </div>
          </Link>
        </div>

        {/* CENTER: Breadcrumbs */}
        <div className="hidden sm:flex flex-1 items-center justify-start max-w-md px-2">
          <SellerBreadcrumbs activeTab={activeTab} storeName={store?.storeName} />
        </div>

        {/* RIGHT: Notifications + Help + Account Menu */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Notifications Popover */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((prev) => !prev)}
              aria-label="Merchant notifications"
              className="relative rounded-lg p-2 text-[#697586] hover:bg-[#F7F8FA] hover:text-[#17202F] transition-colors"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#465BE5] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#465BE5]" />
              </span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-elevated">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-xs font-bold text-[#17202F]">Merchant Notifications</span>
                  <span className="text-[10px] text-[#465BE5] font-semibold">2 New</span>
                </div>
                <div className="divide-y divide-gray-100 text-xs">
                  <div className="py-2.5">
                    <p className="font-semibold text-[#17202F]">Disbursement Cleared</p>
                    <p className="text-[11px] text-[#697586]">
                      Batch SETTL-8821 for {curr} 840,000 has been transferred to your PayPal account.
                    </p>
                    <span className="text-[10px] text-gray-400">Today at 10:00 UTC</span>
                  </div>
                  <div className="py-2.5">
                    <p className="font-semibold text-[#17202F]">Order Pending Dispatch</p>
                    <p className="text-[11px] text-[#697586]">
                      Order #ORD-2026-8921 to India requires air waybill tracking dispatch.
                    </p>
                    <span className="text-[10px] text-gray-400">1 hour ago</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Help Popover */}
          <div ref={helpRef} className="relative">
            <button
              type="button"
              onClick={() => setShowHelp((prev) => !prev)}
              aria-label="Merchant help and documentation"
              className="rounded-lg p-2 text-[#697586] hover:bg-[#F7F8FA] hover:text-[#17202F] transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
            </button>

            {showHelp && (
              <div className="absolute right-0 top-10 z-50 w-72 rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-elevated text-xs space-y-2">
                <p className="font-bold text-[#17202F]">Merchant Help & Guidelines</p>
                <div className="space-y-1.5 text-[11.5px] text-[#697586]">
                  <p>• <strong>5% Platform Commission:</strong> Fixed fee deducted automatically upon order completion.</p>
                  <p>• <strong>72h Clearance Window:</strong> PayPal payments clear into weekly settlements 72h post-dispatch air waybill scan.</p>
                  <p>• <strong>Currency Rule:</strong> All merchant reports are locked to your base currency ({curr}).</p>
                </div>
              </div>
            )}
          </div>

          {/* Seller Account Menu */}
          <SellerAccountMenu store={store} />
        </div>
      </div>
    </header>
  );
}

