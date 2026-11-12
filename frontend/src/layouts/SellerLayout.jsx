import { useState, useEffect } from 'react';
import { Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { SellerHeader } from '@/components/seller/SellerHeader';
import { SellerSidebar } from '@/components/seller/SellerSidebar';
import { SellerFooter } from '@/components/seller/SellerFooter';
import { useAuth } from '@/hooks/useAuth';
import { getSellerStoreMe, getSellerProducts, getSellerOrders } from '@/services/sellerService';

export function SellerLayout({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [store, setStore] = useState(null);
  const [productsCount, setProductsCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [actionOrdersCount, setActionOrdersCount] = useState(0);

  // Tab resolution
  const activeTab = searchParams.get('tab') || 'overview';

  useEffect(() => {
    let mounted = true;
    async function loadStoreMeta() {
      if (!user?.email) return;
      try {
        const storeData = await getSellerStoreMe(user.email);
        if (mounted && storeData) {
          setStore(storeData);
          if (storeData.id) {
            const [prods, ords] = await Promise.all([
              getSellerProducts(storeData.id),
              getSellerOrders(storeData.id),
            ]);
            if (mounted) {
              setProductsCount(prods?.length || 0);
              setOrdersCount(ords?.length || 0);
              const actionReq = (ords || []).filter((o) =>
                ['NEW', 'CONFIRMED', 'PROCESSING'].includes(o.status)
              ).length;
              setActionOrdersCount(actionReq);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load seller layout meta:', err);
      }
    }

    loadStoreMeta();
    return () => {
      mounted = false;
    };
  }, [user?.email]);

  const handleSelectTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#17202F]">
      {/* 1. Dedicated Seller Header (Sticky at top) */}
      <SellerHeader
        store={store}
        activeTab={activeTab}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
      />

      {/* 2. Fixed Desktop Sidebar + Mobile Drawer */}
      <SellerSidebar
        store={store}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        productsCount={productsCount}
        ordersCount={ordersCount}
        actionOrdersCount={actionOrdersCount}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 3. Main Dashboard Content (Offset by md:pl-64 on desktop, scrolls independently) */}
      <div className="md:pl-64 flex flex-col min-h-[calc(100vh-3.5rem)]">
        <main className="flex-1 px-4 py-6 md:px-8">
          <div className="mx-auto max-w-7xl">
            {children || <Outlet context={{ store, activeTab, onSelectTab: handleSelectTab }} />}
          </div>
        </main>

        {/* 4. Dedicated SaaS Seller Footer */}
        <SellerFooter />
      </div>
    </div>
  );
}

export default SellerLayout;
