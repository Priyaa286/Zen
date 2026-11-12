import { Link } from 'react-router-dom';
import {
  CreditCard,
  Globe2,
  HelpCircle,
  Lock,
  Package,
  RefreshCw,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { ZenLogo } from '@/components/common/ZenLogo';
import { useAppContext } from '@/context/AppContext';
import { getCountryName } from '@/utils/currencyFormatter';

export function Footer() {
  const { destinationCountry, preferredCurrency, useMockApi } = useAppContext();

  return (
    <footer className="border-t border-[#E5E7EB] bg-white text-[#697586]">
      {/* Top Value Banner */}
      <div className="border-b border-[#E5E7EB] bg-[#F7F8FA]">
        <div className="zen-container py-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-8 text-[13px]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-[#E5E7EB] text-[#172554]">
                <Globe2 className="h-4 w-4" />
              </div>
              <div>
                <p className="font-[650] text-[#17202F]">6 Global Retail Hubs</p>
                <p className="text-[12px] text-[#697586]">USA, JP, DE, GB, KR, SG</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-[#E5E7EB] text-[#15976B]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="font-[650] text-[#17202F]">PayPal Protection</p>
                <p className="text-[12px] text-[#697586]">Confirmed before paying</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-[#E5E7EB] text-[#465BE5]">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <p className="font-[650] text-[#17202F]">Clear Landed Costs</p>
                <p className="text-[12px] text-[#697586]">Shipping + duties upfront</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-[#E5E7EB] text-[#D97706]">
                <Store className="h-4 w-4" />
              </div>
              <div>
                <p className="font-[650] text-[#17202F]">Verified Merchants</p>
                <p className="text-[12px] text-[#697586]">Fair 5% platform fee</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Multi-column Footer */}
      <div className="zen-container py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Brand & Mission column */}
          <div className="space-y-4 md:col-span-3">
            <Link to="/" aria-label="Zen Global Home" className="inline-flex items-center gap-2.5">
              <ZenLogo size="md" alt="Zen Global" />
              <span className="border-l border-[#E5E7EB] pl-2.5 text-[10.5px] font-[600] uppercase tracking-[0.14em] text-[#697586]">
                Global
              </span>
            </Link>
            <p className="text-[13px] leading-relaxed text-[#697586]">
              A world of products. One place to shop. Authentic merchandise from international merchants with transparent currency conversion, customs calculations, and secure PayPal checkout.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-[#F7F8FA] px-3 py-1 text-[11.5px] font-medium text-[#17202F]">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Delivering to <strong>{getCountryName(destinationCountry)}</strong> ({destinationCountry}) · <strong>{preferredCurrency}</strong>
              </span>
            </div>
          </div>

          {/* Links Columns */}
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 md:col-span-9 text-[13px]">
            {/* 1. About Zen */}
            <div>
              <p className="mb-3 text-[11px] font-[650] uppercase tracking-[0.08em] text-[#17202F]">
                About Zen
              </p>
              <ul className="space-y-2">
                <li>
                  <Link to="/results" className="hover:text-[#172554]">
                    Our Marketplace
                  </Link>
                </li>
                <li>
                  <Link to="/assistant" className="hover:text-[#172554]">
                    AI Shopping Assistant
                  </Link>
                </li>
                <li>
                  <Link to="/results?origin=US" className="hover:text-[#172554]">
                    United States Hub
                  </Link>
                </li>
                <li>
                  <Link to="/results?origin=JP" className="hover:text-[#172554]">
                    Japan Flagships
                  </Link>
                </li>
                <li>
                  <Link to="/results?origin=DE" className="hover:text-[#172554]">
                    Germany Design
                  </Link>
                </li>
                <li>
                  <Link to="/results?origin=KR" className="hover:text-[#172554]">
                    South Korea Direct
                  </Link>
                </li>
              </ul>
            </div>

            {/* 2. Customer Support */}
            <div>
              <p className="mb-3 text-[11px] font-[650] uppercase tracking-[0.08em] text-[#17202F]">
                Customer Support
              </p>
              <ul className="space-y-2">
                <li>
                  <Link to="/account?tab=orders" className="hover:text-[#172554]">
                    Track Orders
                  </Link>
                </li>
                <li>
                  <Link to="/account" className="hover:text-[#172554]">
                    Account &amp; Addresses
                  </Link>
                </li>
                <li>
                  <Link to="/account?tab=saved" className="hover:text-[#172554]">
                    Saved Wishlist
                  </Link>
                </li>
                <li>
                  <Link to="/checkout" className="hover:text-[#172554]">
                    Shipping &amp; Duties Info
                  </Link>
                </li>
                <li>
                  <Link to="/assistant?prompt=How does Zen estimate international shipping and import duties%3F" className="text-[#465BE5] hover:underline">
                    Customs &amp; Tax FAQ →
                  </Link>
                </li>
                <li>
                  <Link to="/assistant?prompt=What is the return and refund policy on Zen Global%3F" className="hover:text-[#172554]">
                    Returns &amp; Refunds
                  </Link>
                </li>
              </ul>
            </div>

            {/* 3. Sell on Zen */}
            <div>
              <p className="mb-3 text-[11px] font-[650] uppercase tracking-[0.08em] text-[#17202F]">
                Sell on Zen
              </p>
              <ul className="space-y-2">
                <li>
                  <Link to="/sell" className="font-[650] text-[#172554] hover:text-[#465BE5]">
                    Sell on Zen →
                  </Link>
                </li>
                <li>
                  <Link to="/seller/register" className="hover:text-[#172554]">
                    Register Store
                  </Link>
                </li>
                <li>
                  <Link to="/seller/dashboard" className="hover:text-[#172554]">
                    Seller Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/seller/verification" className="hover:text-[#172554]">
                    Merchant Verification
                  </Link>
                </li>
                <li>
                  <span className="inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-800 border border-emerald-200">
                    5% Fair Platform Fee
                  </span>
                </li>
              </ul>
            </div>

            {/* 4. Trust & Legal */}
            <div>
              <p className="mb-3 text-[11px] font-[650] uppercase tracking-[0.08em] text-[#17202F]">
                Trust &amp; Legal
              </p>
              <ul className="space-y-2">
                <li>
                  <span className="flex items-center gap-1 font-medium text-[#17202F]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#15976B]" />
                    PayPal Protection
                  </span>
                </li>
                <li>
                  <Link to="/checkout" className="hover:text-[#172554]">
                    Payment Security
                  </Link>
                </li>
                <li>
                  <span className="text-[#697586]">Privacy Policy</span>
                </li>
                <li>
                  <span className="text-[#697586]">Terms of Service</span>
                </li>
                <li>
                  <span className="text-[#697586]">Import Customs Policy</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Payment Badges */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#E5E7EB] pt-6 text-[12px]">
          <div className="flex flex-wrap items-center gap-3">
            <p>© {new Date().getFullYear()} Zen Global Technologies, Inc. All rights reserved.</p>
            <span className="text-[#CBD5E1]">·</span>
            <span className="inline-flex items-center gap-1 rounded bg-[#F1F3F6] px-2 py-0.5 text-[11px] font-medium text-[#697586]">
              {useMockApi ? '• Mock Sandbox Mode' : '• Live Commerce API'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[#697586]">
            <span className="font-medium text-[#17202F]">Payments processed securely by:</span>
            <span className="inline-flex items-center gap-1.5 rounded border border-[#CBD5E1] bg-white px-2.5 py-1 text-[11.5px] font-[650] text-[#003087]">
              PayPal
            </span>
            <span className="text-[11px] text-[#697586]">
              Visa · Mastercard · Amex · Discover · UnionPay
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;