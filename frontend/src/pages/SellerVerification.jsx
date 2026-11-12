import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  RefreshCw,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { useAppContext } from '@/context/AppContext';
import { getSellerStoreMe } from '@/services/sellerService';
import { reviewSellerApplication } from '@/services/adminService';

export function SellerVerification() {
  const { user, refreshUser } = useAuth();
  const { useMockApi } = useAppContext();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStoreStatus = async () => {
    setLoading(true);
    try {
      const data = await getSellerStoreMe(user?.email);
      setStore(data);
    } catch {
      setStore(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchStoreStatus();
    }
  }, [user?.email]);

  const status = store?.verificationStatus || user?.verificationStatus || 'PENDING_REVIEW';

  // Fast test helper for mock mode
  const handleSimulateApprove = async () => {
    if (!store?.id) return;
    setActionLoading(true);
    try {
      await reviewSellerApplication(store.id, {
        decision: 'APPROVED',
        adminNotes: 'Instantly approved via developer test suite.',
        actorEmail: 'admin@zen.global',
      });
      await refreshUser();
      await fetchStoreStatus();
      showToast({
        title: 'Store application approved!',
        description: 'You can now publish products and fulfill international orders.',
        tone: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Action failed',
        description: err?.message,
        tone: 'critical',
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] py-12">
      <div className="zen-container max-w-2xl">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 sm:p-10 shadow-subtle">
          {/* Header Status Icon */}
          <div className="text-center">
            {status === 'APPROVED' && (
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-9 w-9" />
              </div>
            )}
            {status === 'PENDING_REVIEW' && (
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Clock className="h-9 w-9 animate-pulse" />
              </div>
            )}
            {status === 'REJECTED' && (
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <AlertTriangle className="h-9 w-9" />
              </div>
            )}
            {status === 'SUSPENDED' && (
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <Ban className="h-9 w-9" />
              </div>
            )}

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#17202F]">
              {status === 'APPROVED' && 'Store Verified & Active'}
              {status === 'PENDING_REVIEW' && 'Merchant Verification In Progress'}
              {status === 'REJECTED' && 'Application Requires Additional Documentation'}
              {status === 'SUSPENDED' && 'Store Temporarily Suspended'}
            </h1>

            <p className="mt-2 text-sm text-[#697586] max-w-md mx-auto leading-relaxed">
              {status === 'APPROVED' &&
                'Your business entity and export documents have been authenticated. You have full access to publish listings and fulfill cross-border orders.'}
              {status === 'PENDING_REVIEW' &&
                'Our compliance specialists are verifying your corporate registry and bank details. Unverified merchants cannot publish live products or receive customer payments.'}
              {status === 'REJECTED' &&
                'Our compliance team was unable to verify your submitted documentation. Please review the notes below and resubmit.'}
              {status === 'SUSPENDED' &&
                'Your merchant account is temporarily suspended due to a compliance or fulfillment review. Please contact compliance@zen.global.'}
            </p>
          </div>

          {/* Details Card */}
          <div className="mt-8 rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-5 space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB]">
              <span className="text-[#697586]">Store Name</span>
              <span className="font-semibold text-[#17202F]">
                {store?.storeName || user?.storeName || 'Merchant Store'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB]">
              <span className="text-[#697586]">Legal Business</span>
              <span className="font-semibold text-[#17202F]">
                {store?.legalBusinessName || 'Corporate Entity'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB]">
              <span className="text-[#697586]">Warehouse Origin</span>
              <span className="font-semibold text-[#17202F]">
                {store?.originCountry || user?.residenceCountry || 'JP'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB]">
              <span className="text-[#697586]">Settlement Currency</span>
              <span className="font-semibold text-[#17202F]">
                {store?.currency || user?.preferredCurrency || 'JPY'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-[#697586]">Verification Status</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-full ${
                  status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : status === 'PENDING_REVIEW'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {status}
              </span>
            </div>

            {store?.adminNotes && (
              <div className="mt-3 rounded-lg bg-white p-3 border border-[#E5E7EB]">
                <p className="font-semibold text-[#17202F]">Compliance Review Notes:</p>
                <p className="mt-1 text-[#697586]">{store.adminNotes}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            {status === 'APPROVED' ? (
              <button
                type="button"
                onClick={() => navigate('/seller/dashboard')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#172554] px-6 text-sm font-semibold text-white shadow-subtle hover:bg-[#1E3A8A] transition-colors"
              >
                <span>Launch Seller Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : status === 'PENDING_REVIEW' ? (
              <div className="flex flex-col gap-2 w-full">
                <button
                  type="button"
                  onClick={fetchStoreStatus}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 text-xs font-semibold text-[#17202F] hover:bg-[#F7F8FA]"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Refresh Review Status</span>
                </button>

                {useMockApi && (
                  <button
                    type="button"
                    onClick={handleSimulateApprove}
                    disabled={actionLoading}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-subtle disabled:opacity-50"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>[Demo Helper] Instant Approve Store Application</span>
                  </button>
                )}
              </div>
            ) : (
              <Link
                to="/seller/register"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#172554] px-6 text-sm font-semibold text-white hover:bg-[#1E3A8A]"
              >
                <span>Resubmit Verification Documents</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SellerVerification;

