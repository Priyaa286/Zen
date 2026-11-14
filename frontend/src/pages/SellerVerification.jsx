import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Ban,
  Building2,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  HelpCircle,
  Lock,
  RefreshCw,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { useAppContext } from '@/context/AppContext';
import { getSellerStoreMe, getSellerVerificationStatus } from '@/services/sellerService';
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

  const rawStatus = (store?.verificationStatus || store?.status || user?.verificationStatus || 'SUBMITTED').toUpperCase();
  const isApproved = Boolean(store?.isApproved || store?.is_approved || rawStatus === 'APPROVED');
  const status = isApproved ? 'APPROVED' : rawStatus;

  // Developer test helper for instant demonstration approval in staging
  const handleSimulateApprove = async () => {
    if (!store?.id) return;
    setActionLoading(true);
    try {
      await reviewSellerApplication(store.id, {
        action: 'APPROVE',
        decision: 'APPROVED',
        notes: 'Verified corporate entity filings and settlement banking credentials.',
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

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-[#172554]" />
          <p className="text-xs text-[#697586]">Checking verification status...</p>
        </div>
      </div>
    );
  }

  if (!loading && !store) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] py-12">
        <div className="zen-container max-w-lg">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-subtle">
            <Building2 className="h-12 w-12 text-[#172554] mx-auto mb-3" />
            <h1 className="text-xl font-bold tracking-tight text-[#17202F]">
              No Merchant Application Found
            </h1>
            <p className="mt-2 text-xs text-[#697586] leading-relaxed">
              You haven't submitted a store application for verification yet. Please complete merchant registration to submit your official filings and bank settlement details.
            </p>
            <div className="mt-6">
              <Link
                to="/seller/register"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#172554] px-6 text-sm font-semibold text-white hover:bg-[#1E3A8A] transition-colors"
              >
                <span>Register Your Store</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            {(status === 'SUBMITTED' || status === 'PENDING_REVIEW') && (
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Clock className="h-9 w-9 animate-pulse" />
              </div>
            )}
            {status === 'UNDER_REVIEW' && (
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <ShieldCheck className="h-9 w-9 animate-pulse" />
              </div>
            )}
            {status === 'ACTION_REQUIRED' && (
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                <AlertCircle className="h-9 w-9" />
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
              {(status === 'SUBMITTED' || status === 'PENDING_REVIEW') && 'Application Submitted for Verification'}
              {status === 'UNDER_REVIEW' && 'Merchant Verification In Progress'}
              {status === 'ACTION_REQUIRED' && 'Additional Documentation Required'}
              {status === 'REJECTED' && 'Application Requires Additional Documentation'}
              {status === 'SUSPENDED' && 'Store Temporarily Suspended'}
            </h1>

            <p className="mt-2 text-sm text-[#697586] max-w-md mx-auto leading-relaxed">
              {status === 'APPROVED' &&
                'Your business entity, corporate documents, and settlement account have been authenticated. You have full access to publish listings and fulfill cross-border orders.'}
              {(status === 'SUBMITTED' || status === 'PENDING_REVIEW') &&
                'Your onboarding application has been registered in the compliance queue. Compliance review will authenticate your incorporation certificate and settlement bank details.'}
              {status === 'UNDER_REVIEW' &&
                'A compliance specialist is actively reviewing your submitted corporate registry filings and settlement banking credentials.'}
              {status === 'ACTION_REQUIRED' &&
                'Our compliance team requires clearer or additional documentation before approving your international storefront. Please review the notes below.'}
              {status === 'REJECTED' &&
                'Our compliance team was unable to authenticate your submitted legal entity filings. Please review the reviewer notes and submit updated filings.'}
              {status === 'SUSPENDED' &&
                'Your merchant account is temporarily suspended due to a compliance or fulfillment review. Please contact compliance@zen.global.'}
            </p>
          </div>

          {/* Details Card */}
          <div className="mt-8 rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-5 space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB]">
              <span className="text-[#697586]">Storefront Name</span>
              <span className="font-semibold text-[#17202F]">
                {store?.storeName || store?.store_name || user?.storeName || 'Merchant Store'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB]">
              <span className="text-[#697586]">Legal Business Entity</span>
              <span className="font-semibold text-[#17202F]">
                {store?.legalBusinessName || store?.legal_business_name || store?.storeName || 'Corporate Entity'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB]">
              <span className="text-[#697586]">Warehouse & Export Origin</span>
              <span className="font-semibold text-[#17202F]">
                {store?.originCountry || store?.country || user?.residenceCountry || 'JP'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB]">
              <span className="text-[#697586]">Settlement Currency</span>
              <span className="font-semibold text-[#17202F]">
                {store?.settlementCurrency || store?.baseCurrency || store?.base_currency || user?.preferredCurrency || 'JPY'}
              </span>
            </div>
            {store?.bankAccountMasked && (
              <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB]">
                <span className="text-[#697586]">Settlement Bank Account</span>
                <span className="font-mono font-semibold text-[#17202F] flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-emerald-600" />
                  <span>{store.bankAccountMasked}</span>
                </span>
              </div>
            )}
            <div className="flex justify-between items-center py-1">
              <span className="text-[#697586]">Verification Status</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-full ${
                  status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : status === 'SUBMITTED' || status === 'PENDING_REVIEW'
                    ? 'bg-blue-100 text-blue-800'
                    : status === 'UNDER_REVIEW'
                    ? 'bg-amber-100 text-amber-800'
                    : status === 'ACTION_REQUIRED'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {status}
              </span>
            </div>

            {/* Uploaded Documents List */}
            {store?.verificationDocuments && store.verificationDocuments.length > 0 && (
              <div className="mt-3 border-t border-[#E5E7EB] pt-3">
                <p className="font-semibold text-[#17202F] mb-1.5">Submitted Verification Documents:</p>
                <div className="space-y-1.5">
                  {store.verificationDocuments.map((doc, idx) => (
                    <div
                      key={doc.id || idx}
                      className="flex items-center justify-between rounded-lg bg-white p-2.5 border border-[#E5E7EB]"
                    >
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium text-[#17202F] truncate max-w-[260px]">
                          {doc.fileName}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#697586] font-semibold bg-slate-100 px-2 py-0.5 rounded">
                        {doc.status || 'PENDING_REVIEW'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
            ) : status === 'SUBMITTED' || status === 'PENDING_REVIEW' || status === 'UNDER_REVIEW' ? (
              <div className="flex flex-col gap-2 w-full">
                <button
                  type="button"
                  onClick={fetchStoreStatus}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 text-xs font-semibold text-[#17202F] hover:bg-[#F7F8FA]"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Refresh Verification Status</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateApprove}
                  disabled={actionLoading}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-subtle disabled:opacity-50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Simulate Compliance Approval</span>
                </button>
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
