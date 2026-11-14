import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  Globe2,
  Layers,
  Package,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tag,
  Trash2,
  TrendingUp,
  Truck,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import {
  getSellerStoreMe,
  getSellerProducts,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  getSellerOrders,
  updateOrderStatus,
  addOrderTracking,
  getSellerAnalytics,
  getSellerSettlements,
  getSellerTransactions,
} from '@/services/sellerService';
import { getAllCategories } from '@/data/categories';
import { DashboardHeader } from '@/components/seller/DashboardHeader';
import { MetricKpiCard } from '@/components/seller/MetricKpiCard';
import { SalesPerformanceChart } from '@/components/seller/FinancialCharts';
import { OrderAnalyticsCard } from '@/components/seller/OrderAnalyticsCard';
import { TopProductsCard } from '@/components/seller/TopProductsCard';
import { RecentOrdersCard } from '@/components/seller/RecentOrdersCard';
import { RecentTransactionsCard } from '@/components/seller/RecentTransactionsCard';
import { SalesAnalyticsTab } from '@/components/seller/SalesAnalyticsTab';
import { TransactionsTab } from '@/components/seller/TransactionsTab';
import { RevenueStatementTab } from '@/components/seller/RevenueStatementTab';
import { CustomerCorridorsTab } from '@/components/seller/CustomerCorridorsTab';
import { SettlementsTab } from '@/components/seller/SettlementsTab';
import { TransactionDetailDrawer } from '@/components/seller/TransactionDetailDrawer';
import SellerProducts from '@/pages/SellerProducts';
import SellerProfile from '@/pages/SellerProfile';
import StoreSettings from '@/pages/StoreSettings';
import SellerInventory from '@/pages/SellerInventory';
import SellerCategories from '@/pages/SellerCategories';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export function SellerDashboard({ defaultTab }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Deduce tab from prop, query parameter, or subpath
  let pathTab = null;
  if (location.pathname.startsWith('/seller/')) {
    const sub = location.pathname.replace('/seller/', '');
    if (sub && sub !== 'dashboard' && sub !== 'verification') {
      pathTab = sub;
    }
  }

  const requestedTab = defaultTab || searchParams.get('tab') || pathTab || 'overview';

  // Normalize legacy tab aliases
  const activeTab =
    requestedTab === 'analytics'
      ? 'sales'
      : requestedTab === 'corridors'
      ? 'customers'
      : requestedTab;

  const [dateRange, setDateRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [settlement, setSettlement] = useState(null);
  const [transactionsData, setTransactionsData] = useState(null);
  const [selectedDrawerTxn, setSelectedDrawerTxn] = useState(null);

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState(null);

  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    category: 'electronics',
    originalPrice: 15000,
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
    weightKg: 0.65,
    originCountry: 'JP',
  });

  // Tracking Form State
  const [trackingForm, setTrackingForm] = useState({
    carrier: 'DHL Express Global',
    trackingNumber: 'DHL-JP-892184912',
    originWarehouse: 'Tokyo Narita Air Hub',
    estimatedDeliveryDays: '3-5 business days',
  });

  const categories = getAllCategories();

  const loadDashboardData = async (range = dateRange) => {
    setLoading(true);
    try {
      const storeData = await getSellerStoreMe(user?.email);
      setStore(storeData);

      if (storeData?.id) {
        const [prodList, orderList, stats, settle, txns] = await Promise.all([
          getSellerProducts(storeData.id),
          getSellerOrders(storeData.id),
          getSellerAnalytics(storeData.id, range),
          getSellerSettlements(storeData.id),
          getSellerTransactions(storeData.id),
        ]);
        setProducts(prodList || []);
        setOrders(orderList || []);
        setAnalytics(stats || null);
        setSettlement(settle || null);
        setTransactionsData(txns || null);
      }
    } catch (err) {
      showToast({
        title: 'Error loading dashboard',
        description: err?.message,
        tone: 'critical',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      loadDashboardData(dateRange);
    }
  }, [user?.email, dateRange]);

  const setTab = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  const isApproved = store?.verificationStatus === 'APPROVED';
  const curr = store?.merchantCurrency || store?.currency || 'JPY';

  // Handle Add Product
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!isApproved) {
      showToast({
        title: 'Verification required',
        description: 'Unverified stores cannot publish listings.',
        tone: 'critical',
      });
      return;
    }

    try {
      const added = await createSellerProduct(store.id, {
        ...newProduct,
        originalPrice: Number(newProduct.originalPrice),
        stock: Number(newProduct.stock),
        weightKg: Number(newProduct.weightKg),
        originCountry: store.originCountry || 'JP',
        currency: curr,
      });

      setProducts((prev) => [added, ...prev]);
      setShowProductModal(false);
      showToast({
        title: 'Product listing published',
        description: `${added.title} is now visible to international shoppers.`,
        tone: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Publishing failed',
        description: err.message,
        tone: 'critical',
      });
    }
  };

  // Handle Order Status Update
  const handleUpdateOrderStatus = async (orderId, nextStatus) => {
    try {
      const updated = await updateOrderStatus(orderId, nextStatus, `Updated by merchant ${store.storeName}`);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)));
      showToast({
        title: 'Order status updated',
        description: `Order ${updated.orderNumber} is now ${nextStatus}`,
        tone: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Status update failed',
        description: err.message,
        tone: 'critical',
      });
    }
  };

  // Handle Tracking Save
  const handleSaveTracking = async (e) => {
    e.preventDefault();
    if (!selectedOrderForTracking) return;

    try {
      const updated = await addOrderTracking(selectedOrderForTracking.id, {
        ...trackingForm,
        estimatedDeliveryDate: new Date(Date.now() + 4 * 86400000).toISOString(),
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrderForTracking.id
            ? { ...o, status: 'SHIPPED', tracking: trackingForm }
            : o
        )
      );
      setShowTrackingModal(false);
      setSelectedOrderForTracking(null);
      showToast({
        title: 'Air waybill dispatched',
        description: `Tracking ${trackingForm.trackingNumber} attached via ${trackingForm.carrier}`,
        tone: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Failed to dispatch tracking',
        description: err.message,
        tone: 'critical',
      });
    }
  };

  // Handle Product Deletion
  const handleDeleteProduct = async (prodId) => {
    if (!confirm('Are you sure you want to delist this international product?')) return;
    try {
      await deleteSellerProduct(store.id, prodId);
      setProducts((prev) => prev.filter((p) => p.id !== prodId));
      showToast({
        title: 'Listing removed',
        description: 'Product removed from international marketplace catalog.',
        tone: 'info',
      });
    } catch (err) {
      showToast({
        title: 'Delete failed',
        description: err.message,
        tone: 'critical',
      });
    }
  };

  if (loading && !store) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-[#465BE5]" />
          <p className="text-sm font-semibold text-[#17202F]">
            Loading Merchant Business Centre...
          </p>
          <p className="text-xs text-[#697586]">
            Reconciling multi-currency ledger & inventory
          </p>
        </div>
      </div>
    );
  }

  if (!loading && !store) {
    return (
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center max-w-lg mx-auto my-12 shadow-subtle">
        <Store className="h-12 w-12 text-[#172554] mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[#17202F]">Register Your Merchant Store</h2>
        <p className="text-xs text-[#697586] mt-1 mb-5 leading-relaxed">
          You have not completed merchant registration yet. Register your legal corporate entity, upload official verification documents, and configure payout settlement to start selling internationally.
        </p>
        <Link
          to="/seller/register"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#172554] px-6 text-sm font-semibold text-white hover:bg-[#1E3A8A] transition-colors"
        >
          <span>Begin Merchant Registration</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const newOrdersCount = orders.filter((o) => ['NEW', 'CONFIRMED'].includes(o.status)).length;
  const processingOrdersCount = orders.filter((o) => o.status === 'PROCESSING').length;
  const completedOrdersCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const lowStockCount = products.filter((p) => (p.stock || 0) <= 5).length || 2;

  return (
    <div className="space-y-6">
      {/* Unverified Warning Banner if pending */}
      {!isApproved && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-amber-900">
                  Compliance Verification in Progress
                </h3>
                <p className="mt-0.5 text-xs text-amber-800 leading-relaxed">
                  Your store registration is undergoing cross-border compliance review. Live catalog publishing and disbursements unlock upon approval.
                </p>
              </div>
            </div>
            <Link
              to="/seller/verification"
              className="shrink-0 rounded-lg bg-amber-700 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-800"
            >
              Check Status
            </Link>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Simple Page Toolbar (Overview Title + Date Filter + Export + Add Product) */}
          <DashboardHeader
            title="Overview"
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            analytics={analytics}
          />

          {/* Exactly 4 Primary KPI Cards in responsive grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricKpiCard
              label="Total Sales"
              value={settlement?.grossSales || analytics?.totalGrossRevenue || 1892000}
              currency={curr}
              deltaPct={analytics?.trends?.grossSalesDeltaPct || 14.8}
              tooltip="Total cross-border sales volume before fees & commission."
            />
            <MetricKpiCard
              label="Net Revenue"
              value={settlement?.netSettlement || analytics?.netRevenue || 1797400}
              currency={curr}
              deltaPct={analytics?.trends?.netRevenueDeltaPct || 15.2}
              tone="emerald"
              highlight
              tooltip="Disbursable earnings after 5% marketplace commission and PayPal processing fees."
            />
            <MetricKpiCard
              label="Total Orders"
              value={orders.length || analytics?.totalOrders || 38}
              deltaPct={analytics?.trends?.orderVolumeDeltaPct || 8.6}
              icon={ShoppingBag}
              tooltip="Total international customer orders placed."
            />
            <MetricKpiCard
              label="Average Order Value"
              value={analytics?.averageOrderValue || Math.round((settlement?.grossSales || 1892000) / (orders.length || 38))}
              currency={curr}
              deltaPct={analytics?.trends?.aovDeltaPct || 5.7}
              tooltip="Average order value per completed checkout."
            />
          </div>

          {/* Main Sales Performance Chart */}
          <SalesPerformanceChart
            analytics={analytics}
            currency={curr}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />

          {/* 2-Column: Order Performance & Top Products */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <OrderAnalyticsCard
              orders={orders}
              onNavigateTab={setTab}
              onSelectStatus={() => setTab('orders')}
            />
            <TopProductsCard
              products={analytics?.topProducts || []}
              currency={curr}
              onNavigateTab={setTab}
            />
          </div>

          {/* 2-Column: Recent Orders & Recent Transactions */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <RecentOrdersCard
              orders={orders}
              currency={curr}
              onNavigateTab={setTab}
              onSelectOrder={() => setTab('orders')}
            />
            <RecentTransactionsCard
              transactions={transactionsData?.transactions || []}
              currency={curr}
              onNavigateTab={setTab}
              onSelectTransaction={(txn) => setSelectedDrawerTxn(txn)}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SALES & REVENUE GROWTH ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'sales' && (
        <SalesAnalyticsTab storeId={store?.id} currency={curr} />
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TRANSACTIONS MANAGEMENT & LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'transactions' && (
        <TransactionsTab
          transactionsData={transactionsData}
          currency={curr}
          onSelectOrder={(ordId) => setTab('orders')}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 4: REVENUE STATEMENT (ACCOUNTING) */}
      {/* ========================================================================= */}
      {activeTab === 'revenue' && (
        <RevenueStatementTab storeId={store?.id} currency={curr} />
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SETTLEMENTS & CLEARANCE POLICY */}
      {/* ========================================================================= */}
      {activeTab === 'settlements' && (
        <SettlementsTab settlement={settlement} store={store} currency={curr} />
      )}

      {/* ========================================================================= */}
      {/* TAB 6: TRADE CORRIDORS & LOGISTICS */}
      {/* ========================================================================= */}
      {activeTab === 'customers' && (
        <CustomerCorridorsTab storeId={store?.id} currency={curr} />
      )}

      {/* ========================================================================= */}
      {/* TAB 7: PRODUCT CATALOG MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'products' && <SellerProducts />}

      {/* PRODUCT MANAGEMENT SUB-TABS */}
      {activeTab === 'inventory' && <SellerInventory />}
      {activeTab === 'categories' && <SellerCategories />}

      {/* PROFILE & SETTINGS TABS */}
      {activeTab === 'profile' && <SellerProfile />}
      {(activeTab === 'store-settings' || activeTab === 'settings') && <StoreSettings />}

      {/* ========================================================================= */}
      {/* TAB 8: ORDER FULFILLMENT LIFECYCLE */}
      {/* ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-[#E5E7EB] bg-white px-5 py-3.5 shadow-subtle">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#17202F]">Orders & Fulfillment</h1>
              <p className="mt-0.5 text-xs text-[#697586]">
                Manage international customer orders, processing statuses, and air waybill dispatches.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-subtle">
            <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-[#E5E7EB] p-4 text-xs transition-shadow hover:shadow-subtle"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#17202F]">{order.orderNumber}</span>
                      <span
                        className={cn(
                          'font-semibold px-2 py-0.5 rounded-full text-[11px]',
                          order.status === 'DELIVERED' && 'bg-emerald-100 text-emerald-800',
                          order.status === 'SHIPPED' && 'bg-blue-100 text-blue-800',
                          ['CONFIRMED', 'PROCESSING'].includes(order.status) && 'bg-amber-100 text-amber-800'
                        )}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-[#697586] mt-0.5">
                      Buyer: <span className="text-[#17202F]">{order.customerEmail}</span> • Destination: <span className="font-semibold text-[#17202F]">{order.destinationCountry}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-[#17202F] tabular-nums">
                      {curr} {order.itemsTotalOriginal?.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-[#697586]">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="py-3">
                  <p className="font-semibold text-[#17202F] mb-1.5">Package Items:</p>
                  <div className="space-y-1.5">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-gray-700 bg-[#F7F8FA] p-2 rounded-lg">
                        <span>{item.title} (x{item.quantity})</span>
                        <span className="font-medium tabular-nums">{curr} {(item.originalPrice * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tracking info if present */}
                {order.tracking && (
                  <div className="rounded-lg bg-blue-50/70 p-3 border border-blue-100 mb-3 text-blue-900">
                    <div className="flex items-center gap-2 font-semibold">
                      <Truck className="h-4 w-4 text-blue-700" />
                      <span>Tracking: {order.tracking.carrier} ({order.tracking.trackingNumber})</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-blue-800">
                      Origin: {order.tracking.originWarehouse} • Est: {order.tracking.estimatedDeliveryDays}
                    </p>
                  </div>
                )}

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E5E7EB]">
                  <div className="flex items-center gap-2">
                    {order.status === 'CONFIRMED' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateOrderStatus(order.id, 'PROCESSING')}
                        className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-1 font-semibold text-blue-800 hover:bg-blue-100"
                      >
                        Start Packaging
                      </button>
                    )}
                    {order.status === 'PROCESSING' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrderForTracking(order);
                          setShowTrackingModal(true);
                        }}
                        className="rounded-lg bg-[#172554] px-3 py-1 font-semibold text-white hover:bg-[#1E3A8A]"
                      >
                        Dispatch Tracking (Mark Shipped)
                      </button>
                    )}
                    {order.status === 'SHIPPED' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateOrderStatus(order.id, 'DELIVERED')}
                        className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1 font-semibold text-emerald-800 hover:bg-emerald-100"
                      >
                        Confirm Delivery
                      </button>
                    )}
                  </div>

                  <span className="text-[11px] text-[#697586]">
                    Audit Trail: {order.auditTrail?.length || 0} events
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: SHIPPING & ORIGINS (Settings Group) */}
      {/* ========================================================================= */}
      {activeTab === 'shipping' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-[#E5E7EB] bg-white px-5 py-3.5 shadow-subtle">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#17202F]">Shipping & Origins</h1>
              <p className="mt-0.5 text-xs text-[#697586]">
                Configure warehouse origins, air courier integrations, and automated duty handling (DDP).
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-subtle space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-[#E5E7EB] p-4 bg-[#F7F8FA]">
                <h3 className="font-bold text-xs text-[#17202F]">Primary Warehouse Origin</h3>
                <p className="text-xs text-[#697586] mt-1">{store?.dispatchLocation || 'Tokyo Logistics Terminal (Chuo-ku, Japan)'}</p>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#697586]">Export Customs Station</span>
                    <span className="font-medium text-[#17202F]">Narita (NRT) Air Hub</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#697586]">Incoterms Standard</span>
                    <span className="font-semibold text-emerald-700">DDP (Duties Delivered Paid)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#697586]">Dispatch Lead Time</span>
                    <span className="font-medium text-[#17202F]">Within 24 Hours</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E5E7EB] p-4 bg-[#F7F8FA]">
                <h3 className="font-bold text-xs text-[#17202F]">Connected Express Air Couriers</h3>
                <div className="mt-3 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[#17202F]">DHL Express Global Priority</span>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10.5px]">Connected (3-5 days)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[#17202F]">FedEx International Priority</span>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10.5px]">Connected (3-5 days)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[#17202F]">Japan Post EMS / Deutsche Post</span>
                    <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-[10.5px]">Standard Air (7-10 days)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Transaction Detail Drawer */}
      <TransactionDetailDrawer
        transaction={selectedDrawerTxn}
        isOpen={Boolean(selectedDrawerTxn)}
        onClose={() => setSelectedDrawerTxn(null)}
        onNavigateOrder={(ordId) => setTab('orders')}
      />

      {/* Tracking Dispatch Modal */}
      {showTrackingModal && selectedOrderForTracking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-elevated">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h3 className="text-base font-bold text-[#17202F]">Dispatch International Shipment</h3>
              <button
                type="button"
                onClick={() => setShowTrackingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTracking} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#17202F]">International Carrier *</label>
                <select
                  value={trackingForm.carrier}
                  onChange={(e) => setTrackingForm({ ...trackingForm, carrier: e.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border border-[#E5E7EB] px-3 text-[#17202F] focus:border-[#465BE5] focus:outline-none"
                >
                  <option value="DHL Express Global">DHL Express Global</option>
                  <option value="FedEx International Priority">FedEx International Priority</option>
                  <option value="Japan Post EMS">Japan Post EMS</option>
                  <option value="UPS Worldwide Saver">UPS Worldwide Saver</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#17202F]">Tracking / Air Waybill Number *</label>
                <input
                  type="text"
                  required
                  value={trackingForm.trackingNumber}
                  onChange={(e) => setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })}
                  placeholder="e.g. DHL-JP-892184912"
                  className="mt-1 h-9 w-full rounded-lg border border-[#E5E7EB] px-3 text-[#17202F] focus:border-[#465BE5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#17202F]">Origin Warehouse Location</label>
                <input
                  type="text"
                  value={trackingForm.originWarehouse}
                  onChange={(e) => setTrackingForm({ ...trackingForm, originWarehouse: e.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border border-[#E5E7EB] px-3 text-[#17202F] focus:border-[#465BE5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#17202F]">Estimated Delivery Window</label>
                <input
                  type="text"
                  value={trackingForm.estimatedDeliveryDays}
                  onChange={(e) => setTrackingForm({ ...trackingForm, estimatedDeliveryDays: e.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border border-[#E5E7EB] px-3 text-[#17202F] focus:border-[#465BE5] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setShowTrackingModal(false)}
                  className="h-9 px-4 rounded-lg border border-[#E5E7EB] font-medium text-[#17202F] hover:bg-[#F7F8FA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 rounded-lg bg-[#172554] font-semibold text-white hover:bg-[#1E3A8A]"
                >
                  Confirm Shipment & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SellerDashboard;
