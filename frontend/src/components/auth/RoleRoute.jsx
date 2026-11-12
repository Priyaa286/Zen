import { Link, Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowRight, Store } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from '@/components/common/Loader';

/**
 * Role-Based Route Guard.
 * Enforces server-side assigned role requirements (BUYER, SELLER, ADMIN).
 * Prevents unauthorized access when users manipulate URLs or localStorage.
 */
export function RoleRoute({ children, allowedRoles = [] }) {
  const { user, role, isAuthenticated, isLoading, switchPersona } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Loader
        fullScreen
        label="Verifying credentials & marketplace privileges..."
        sublabel="Access Control Policy Enforcement"
      />
    );
  }

  if (!isAuthenticated) {
    const redirectTarget = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirectTarget)}`}
        replace
      />
    );
  }

  // If allowedRoles is specified, enforce it
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // If buyer is trying to access seller portal, provide helpful onboarding prompt
    if (allowedRoles.includes('SELLER')) {
      return (
        <div className="zen-container py-16">
          <div className="mx-auto max-w-lg rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-subtle">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Store className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-xl font-bold tracking-tight text-[#17202F]">
              Merchant Account Required
            </h2>
            <p className="mt-2 text-sm text-[#697586] leading-relaxed">
              You are currently signed in as a <span className="font-semibold text-[#17202F]">{role}</span> ({user?.email}).
              To access the merchant dashboard, publish inventory, and fulfill international shipments, register your store.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={async () => {
                  if (switchPersona) {
                    await switchPersona('seller@zen.global');
                  }
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#465BE5] px-5 text-sm font-semibold text-white shadow-subtle hover:bg-[#3848b8] transition-colors"
              >
                <Store className="h-4 w-4" />
                <span>Switch to Demo Merchant (Tokyo Optics)</span>
              </button>
              <Link
                to="/seller/register"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-5 text-sm font-medium text-[#17202F] hover:bg-[#F7F8FA] transition-colors"
              >
                <span>Register Store</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // Otherwise access denied
    return (
      <div className="zen-container py-16">
        <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-subtle">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-[#17202F]">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-[#697586] leading-relaxed">
            Your current account role (<span className="font-semibold text-[#17202F]">{role}</span>) does not have authorization to view this platform area.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              to="/"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[#172554] px-5 text-sm font-semibold text-white hover:bg-[#1E3A8A] transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

export default RoleRoute;

