import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { OnboardingModal } from '@/components/auth/OnboardingModal';

export function MarketplaceLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F8FA] text-[#17202F]">
      <Navbar />
      <main className="flex-1">
        {children || <Outlet />}
      </main>
      <CartDrawer />
      <OnboardingModal />
      <Footer />
    </div>
  );
}

export default MarketplaceLayout;

