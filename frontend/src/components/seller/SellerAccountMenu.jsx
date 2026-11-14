import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  LogOut,
  Store,
  ShieldCheck,
  ExternalLink,
  User,
  Settings,
  Lock,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/utils/cn';

export function SellerAccountMenu({ store }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout, switchPersona, useMockApi } = useAuth();
  const { showToast } = useToast();

  const isApproved = store?.verificationStatus === 'APPROVED';
  const curr = store?.merchantCurrency || 'JPY';
  const profilePhoto = user?.profilePhoto || user?.avatarUrl;

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    showToast({
      title: 'Signed out of Merchant Centre',
      description: 'You are now browsing Zen as a guest.',
      tone: 'info',
    });
    navigate('/login');
  };

  const handleSwitchStore = async (email, storeName) => {
    setIsOpen(false);
    try {
      await switchPersona(email);
      showToast({
        title: `Switched Store: ${storeName}`,
        description: `Now managing ${storeName}`,
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

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-xs font-medium text-[#17202F] hover:bg-[#F7F8FA] transition-colors shadow-xs"
      >
        {profilePhoto ? (
          <img
            src={profilePhoto}
            alt={user?.fullName || store?.storeName || 'Merchant'}
            className="h-5 w-5 rounded-md object-cover border border-gray-200"
          />
        ) : (
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#172554] text-[10px] font-bold text-white uppercase">
            {user?.fullName?.charAt(0) || store?.storeName?.charAt(0) || 'M'}
          </span>
        )}
        <span className="font-semibold text-[#17202F] max-w-[120px] truncate hidden sm:inline">
          {store?.storeName || 'Merchant'}
        </span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-[#697586] transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 top-10 z-50 w-72 origin-top-right rounded-xl border border-[#E5E7EB] bg-white p-2 shadow-elevated"
        >
          {/* Identity Header */}
          <div className="rounded-lg bg-[#F7F8FA] p-3 text-xs border border-gray-100">
            <div className="flex items-center gap-2.5">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={user?.fullName || 'Profile'}
                  className="h-8 w-8 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#172554] text-xs font-bold text-white uppercase">
                  {user?.fullName?.charAt(0) || 'M'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#17202F] truncate">
                    {user?.fullName || 'Merchant Account'}
                  </span>
                  {isApproved && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.2 text-[9.5px] font-semibold text-emerald-700">
                      <ShieldCheck className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#697586] truncate">
                  {user?.email || store?.ownerEmail}
                </p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-[#697586]">
              <span className="font-medium text-[#17202F] truncate">{store?.storeName}</span>
              <span>{store?.shippingOrigin === 'DE' ? 'Germany' : 'Japan'}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="py-1">
            <Link
              to="/seller/profile"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[#17202F] hover:bg-[#F7F8FA] transition-colors"
            >
              <User className="h-3.5 w-3.5 text-[#697586]" />
              <span>View Profile</span>
            </Link>

            <Link
              to="/seller/store-settings"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[#17202F] hover:bg-[#F7F8FA] transition-colors"
            >
              <Store className="h-3.5 w-3.5 text-[#697586]" />
              <span>Store Settings</span>
            </Link>

            <Link
              to="/seller/security"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[#17202F] hover:bg-[#F7F8FA] transition-colors"
            >
              <Lock className="h-3.5 w-3.5 text-[#697586]" />
              <span>Account & Security</span>
            </Link>

            <Link
              to="/seller/help"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[#17202F] hover:bg-[#F7F8FA] transition-colors"
            >
              <HelpCircle className="h-3.5 w-3.5 text-[#697586]" />
              <span>Help & Support</span>
            </Link>

            {/* Switch Store Persona in Mock Mode */}
            {useMockApi && (
              <>
                <div className="my-1 border-t border-gray-100" />
                <div className="px-2 py-1 text-[10.5px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                  Demo Merchant Stores
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleSwitchStore('seller@zen.global', 'Tokyo Optics (JP)')}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-[#17202F] hover:bg-[#F7F8FA] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm">🇯🇵</span>
                    <span className="font-medium">Tokyo Optics & Craft</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold">Verified</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleSwitchStore('pending.seller@zen.global', 'Berlin Sound (DE)')}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-[#17202F] hover:bg-[#F7F8FA] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm">🇩🇪</span>
                    <span className="font-medium">Berlin Audio GmbH</span>
                  </span>
                  <span className="text-[10px] text-amber-700 font-semibold">Review</span>
                </button>
              </>
            )}

            <div className="my-1 border-t border-gray-100" />

            {/* Back to Customer Marketplace */}
            <Link
              to="/"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#17202F] hover:bg-[#F7F8FA] transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 text-[#697586]" />
              <span>Back to Marketplace</span>
            </Link>

            <div className="my-1 border-t border-gray-100" />

            {/* Logout */}
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
