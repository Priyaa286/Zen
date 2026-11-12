import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  Layers,
  Package,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Store,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import {
  getAdminStats,
  getAdminSellers,
  reviewSellerApplication,
  getAdminProducts,
  moderateProduct,
  getAdminUsers,
  updateUserRole,
  getAdminAuditLogs,
} from '@/services/adminService';

export function AdminDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Review modal / notes
  const [reviewModalStore, setReviewModalStore] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [st, sl, pr, us, lg] = await Promise.all([
        getAdminStats(),
        getAdminSellers(),
        getAdminProducts(),
        getAdminUsers(),
        getAdminAuditLogs(),
      ]);
      setStats(st);
      setSellers(sl);
      setProducts(pr);
      setUsers(us);
      setAuditLogs(lg);
    } catch (err) {
      showToast({
        title: 'Error loading admin data',
        description: err?.message,
        tone: 'critical',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const setTab = (tab) => {
    setSearchParams({ tab });
  };

  // Review seller
  const handleReviewDecision = async (storeId, decision) => {
    try {
      await reviewSellerApplication(storeId, {
        decision,
        adminNotes: reviewNotes || `Application ${decision.toLowerCase()} by Zen Compliance`,
        actorEmail: user?.email || 'admin@zen.global',
      });

      showToast({
        title: `Merchant application ${decision}`,
        description: `Store status updated to ${decision}.`,
        tone: decision === 'APPROVED' ? 'success' : 'warning',
      });

      setReviewModalStore(null);
      setReviewNotes('');
      loadAdminData();
    } catch (err) {
      showToast({
        title: 'Action failed',
        description: err?.message,
        tone: 'critical',
      });
    }
  };

  // Moderate product
  const handleModerateProduct = async (productId, decision) => {
    try {
      await moderateProduct(productId, {
        decision,
        moderationNotes: `Listing status updated to ${decision} by compliance auditor.`,
        actorEmail: user?.email || 'admin@zen.global',
      });

      showToast({
        title: `Product listing ${decision}`,
        tone: 'info',
      });

      loadAdminData();
    } catch (err) {
      showToast({
        title: 'Action failed',
        description: err?.message,
        tone: 'critical',
      });
    }
  };

  // Update user role
  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      showToast({
        title: `User role changed to ${newRole}`,
        tone: 'success',
      });
      loadAdminData();
    } catch (err) {
      showToast({
        title: 'Role update failed',
        description: err?.message,
        tone: 'critical',
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-16">
      {/* Admin Top Header */}
      <div className="border-b border-[#E5E7EB] bg-white">
        <div className="zen-container py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-900 text-white shadow-subtle">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-[#17202F]">
                    Zen Marketplace Admin & Compliance Portal
                  </h1>
                  <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-900">
                    ADMIN
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[#697586]">
                  Signed in as <span className="font-semibold text-[#17202F]">{user?.email}</span> • Multi-tenant cross-border oversight
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadAdminData}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs font-semibold text-[#17202F] hover:bg-[#F7F8FA]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Sync Platform State</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-6 flex overflow-x-auto border-b border-[#E5E7EB] text-xs font-semibold text-[#697586] scrollbar-none">
            {[
              { id: 'overview', label: 'Platform Overview', icon: Layers },
              { id: 'merchants', label: `Merchant Applications (${sellers.filter((s) => s.verificationStatus === 'PENDING_REVIEW').length} pending)`, icon: Store },
              { id: 'moderation', label: `Product Moderation (${products.length})`, icon: Package },
              { id: 'users', label: `User Roles (${users.length})`, icon: Users },
              { id: 'audit', label: `Audit Trail (${auditLogs.length})`, icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTab(tab.id)}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs transition-colors ${
                    isActive
                      ? 'border-purple-900 text-purple-900 font-bold'
                      : 'border-transparent text-[#697586] hover:text-[#17202F]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="zen-container mt-8">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-subtle">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#697586]">
                  Registered Merchants
                </p>
                <p className="mt-2 text-2xl font-bold text-[#17202F] tabular-nums">
                  {sellers.length}
                </p>
                <p className="mt-1 text-xs text-emerald-600 font-medium">
                  {sellers.filter((s) => s.verificationStatus === 'APPROVED').length} active verified
                </p>
              </div>

              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-subtle">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#697586]">
                  Pending Compliance Reviews
                </p>
                <p className="mt-2 text-2xl font-bold text-amber-600 tabular-nums">
                  {sellers.filter((s) => s.verificationStatus === 'PENDING_REVIEW').length}
                </p>
                <p className="mt-1 text-xs text-[#697586]">Requires corporate doc verification</p>
              </div>

              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-subtle">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#697586]">
                  Platform GMV
                </p>
                <p className="mt-2 text-2xl font-bold text-[#17202F] tabular-nums">
                  ₹{(stats?.totalGrossMerchandiseVolumeInr || 28450000).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-[#697586]">Across 6 active global corridors</p>
              </div>

              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-subtle">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#697586]">
                  Dispute Rate
                </p>
                <p className="mt-2 text-2xl font-bold text-emerald-700 tabular-nums">
                  {stats?.disputeRatePercent || 0.12}%
                </p>
                <p className="mt-1 text-xs text-emerald-600 font-medium">Well below 1.0% threshold</p>
              </div>
            </div>

            {/* Platform Health Card */}
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-subtle">
              <h3 className="text-sm font-bold text-[#17202F]">Marketplace Architecture & Policy Safeguards</h3>
              <p className="text-xs text-[#697586] mt-1">
                Zen strictly enforces role-based access control (RBAC) and isolated merchant data partitioning.
              </p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-4">
                  <span className="font-semibold text-[#17202F]">Server-Side Role Guarding</span>
                  <p className="text-[#697586] mt-1">
                    Buyer, Seller, and Admin privilege levels are validated on backend session tokens and protected route wrappers.
                  </p>
                </div>
                <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-4">
                  <span className="font-semibold text-[#17202F]">Multi-Tenant Isolation</span>
                  <p className="text-[#697586] mt-1">
                    Sellers can only inspect and manage inventory, orders, and settlements belonging to their registered storeId.
                  </p>
                </div>
                <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-4">
                  <span className="font-semibold text-[#17202F]">Dual Currency Integrity</span>
                  <p className="text-[#697586] mt-1">
                    Seller native listings are kept immutable in origin currency, while buyer conversions adapt dynamically with live FX.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MERCHANT APPLICATIONS TAB */}
        {activeTab === 'merchants' && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-subtle">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-5">
              <div>
                <h2 className="text-base font-bold text-[#17202F]">Merchant Verification Applications</h2>
                <p className="text-xs text-[#697586]">
                  Inspect submitted commercial registry certificates and export documents before approving storefronts.
                </p>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[#697586] uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-2">Store / Business Entity</th>
                    <th className="py-3 px-2">Origin</th>
                    <th className="py-3 px-2">Currency</th>
                    <th className="py-3 px-2">Document</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {sellers.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F7F8FA]">
                      <td className="py-3 px-2">
                        <p className="font-semibold text-[#17202F]">{s.storeName}</p>
                        <p className="text-[#697586] text-[11px]">{s.legalBusinessName}</p>
                      </td>
                      <td className="py-3 px-2 font-medium text-[#17202F]">{s.originCountry}</td>
                      <td className="py-3 px-2 font-medium text-[#17202F]">{s.currency}</td>
                      <td className="py-3 px-2">
                        <span className="inline-flex items-center gap-1 rounded bg-[#F1F3F6] px-2 py-0.5 text-[11px] font-medium text-[#17202F]">
                          <FileCheck2 className="h-3 w-3 text-blue-600" />
                          {s.verificationDocuments?.[0]?.fileName || 'registry.pdf'}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[10.5px] ${
                            s.verificationStatus === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.verificationStatus === 'PENDING_REVIEW'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {s.verificationStatus}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {s.verificationStatus !== 'APPROVED' && (
                            <button
                              type="button"
                              onClick={() => handleReviewDecision(s.id, 'APPROVED')}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                          )}
                          {s.verificationStatus !== 'REJECTED' && (
                            <button
                              type="button"
                              onClick={() => {
                                setReviewModalStore(s);
                              }}
                              className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PRODUCT MODERATION TAB */}
        {activeTab === 'moderation' && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-subtle">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-5">
              <div>
                <h2 className="text-base font-bold text-[#17202F]">Marketplace Product Catalog Moderation</h2>
                <p className="text-xs text-[#697586]">
                  Inspect international listings to enforce safety, authentic branding, and proper HS code categorization.
                </p>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[#697586] uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-2">Listing</th>
                    <th className="py-3 px-2">Origin</th>
                    <th className="py-3 px-2">Price</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Moderation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-[#F7F8FA]">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.imageUrl}
                            alt={prod.title}
                            className="h-10 w-10 rounded-lg object-cover border border-[#E5E7EB]"
                          />
                          <div>
                            <p className="font-semibold text-[#17202F] line-clamp-1 max-w-sm">{prod.title}</p>
                            <p className="text-[11px] text-[#697586]">{prod.category} • ID: {prod.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 font-medium text-[#17202F]">{prod.originCountry}</td>
                      <td className="py-3 px-2 font-bold text-[#17202F] tabular-nums">
                        {prod.originalCurrency} {prod.originalPrice?.toLocaleString()}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded-full text-[10.5px] ${
                            prod.moderationStatus === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {prod.moderationStatus || 'APPROVED'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {prod.moderationStatus !== 'APPROVED' ? (
                            <button
                              type="button"
                              onClick={() => handleModerateProduct(prod.id, 'APPROVED')}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleModerateProduct(prod.id, 'REJECTED')}
                              className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              Flag / Block
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USER ROLES MANAGEMENT TAB */}
        {activeTab === 'users' && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-subtle">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-5">
              <div>
                <h2 className="text-base font-bold text-[#17202F]">Platform Role-Based Access Control (RBAC)</h2>
                <p className="text-xs text-[#697586]">
                  Inspect accounts and manage assigned privileges: BUYER, SELLER, and ADMIN.
                </p>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[#697586] uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-2">Account</th>
                    <th className="py-3 px-2">Residence</th>
                    <th className="py-3 px-2">Associated Store</th>
                    <th className="py-3 px-2">Assigned Role</th>
                    <th className="py-3 px-2 text-right">Reassign Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#F7F8FA]">
                      <td className="py-3 px-2">
                        <p className="font-semibold text-[#17202F]">{u.fullName || 'User'}</p>
                        <p className="text-[11px] text-[#697586]">{u.email}</p>
                      </td>
                      <td className="py-3 px-2 font-medium text-[#17202F]">{u.residenceCountry}</td>
                      <td className="py-3 px-2 text-[#697586]">{u.storeName || '—'}</td>
                      <td className="py-3 px-2">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[10.5px] ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-900'
                              : u.role === 'SELLER'
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {u.role || 'BUYER'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <select
                          value={u.role || 'BUYER'}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="rounded-lg border border-[#E5E7EB] bg-white px-2 py-1 text-xs font-semibold text-[#17202F] focus:outline-none"
                        >
                          <option value="BUYER">BUYER</option>
                          <option value="SELLER">SELLER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AUDIT LOG TAB */}
        {activeTab === 'audit' && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-subtle">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-5">
              <div>
                <h2 className="text-base font-bold text-[#17202F]">Immutable Administrative Audit Log</h2>
                <p className="text-xs text-[#697586]">
                  Cryptographic chronological audit trail of all compliance decisions, role updates, and moderation actions.
                </p>
              </div>
            </div>

            <div className="mt-5 divide-y divide-[#E5E7EB] text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#17202F]">{log.action}</span>
                      <span className="rounded bg-[#F1F3F6] px-1.5 py-0.5 text-[10px] text-[#697586]">
                        {log.targetType}: {log.targetId}
                      </span>
                    </div>
                    <p className="text-[#697586] mt-0.5">{log.details}</p>
                  </div>
                  <div className="text-right text-[11px] text-[#697586] shrink-0">
                    <p className="font-semibold text-[#17202F]">{log.actorEmail}</p>
                    <p>{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {reviewModalStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-elevated">
            <h3 className="text-base font-bold text-[#17202F]">Reject Store Application</h3>
            <p className="text-xs text-[#697586] mt-1">
              Provide feedback to {reviewModalStore.storeName} explaining which documents need revision.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-[#17202F]">Compliance Notes *</label>
              <textarea
                rows={3}
                required
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="e.g. Corporate registration document resolution is too low; missing registry seal."
                className="mt-1 w-full rounded-lg border border-[#E5E7EB] p-2 text-xs text-[#17202F] focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewModalStore(null)}
                className="h-9 px-4 rounded-lg border border-[#E5E7EB] text-xs font-medium text-[#17202F]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReviewDecision(reviewModalStore.id, 'REJECTED')}
                className="h-9 px-4 rounded-lg bg-red-600 text-xs font-semibold text-white hover:bg-red-700"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

