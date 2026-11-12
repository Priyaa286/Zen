import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Globe2,
  PackageCheck,
  ShieldCheck,
  TrendingUp,
  Truck,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function BecomeSeller() {
  const { user, isAuthenticated, isSeller, sellerStatus } = useAuth();
  const navigate = useNavigate();

  const handleStartSelling = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/seller/register');
      return;
    }
    if (isSeller) {
      if (sellerStatus === 'APPROVED') {
        navigate('/seller/dashboard');
      } else {
        navigate('/seller/verification');
      }
      return;
    }
    navigate('/seller/register');
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[#E5E7EB] bg-white py-16 lg:py-24">
        <div className="zen-container">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-3.5 py-1 text-xs font-semibold text-blue-800">
                <Globe2 className="h-3.5 w-3.5" />
                <span>Zen Multi-Vendor Global Marketplace</span>
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#17202F] sm:text-5xl sm:leading-[1.15]">
                Sell to verified international buyers with zero cross-border friction.
              </h1>
              <p className="mt-4 text-base text-[#697586] sm:text-lg leading-relaxed">
                List products in your native currency. Zen automatically calculates customs duties, real-time foreign exchange, and landed cost for buyers worldwide—and protects your revenue via PayPal sandbox escrow.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={handleStartSelling}
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#172554] px-6 text-sm font-semibold text-white shadow-subtle hover:bg-[#1E3A8A] transition-all transform active:scale-[0.98]"
                >
                  <span>{isSeller ? 'Go to Seller Dashboard' : 'Open Merchant Store'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <Link
                  to="/"
                  className="inline-flex h-12 items-center rounded-xl border border-[#E5E7EB] bg-white px-6 text-sm font-medium text-[#17202F] hover:bg-[#F7F8FA] transition-colors"
                >
                  Explore Global Marketplace
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 flex flex-wrap items-center gap-6 pt-6 border-t border-[#E5E7EB] text-xs text-[#697586]">
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>5% transparent platform fee</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Local currency settlement</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Automated landed cost computation</span>
                </div>
              </div>
            </div>

            {/* Visual Value Proposition Card */}
            <div className="rounded-2xl border border-[#E5E7EB] bg-[#F7F8FA] p-6 lg:p-8 shadow-subtle">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#697586]">
                    Merchant Advantage
                  </p>
                  <p className="text-base font-bold text-[#17202F]">
                    Tokyo Optics & Craft Example
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Verified Exporter
                </span>
              </div>

              <div className="mt-6 space-y-4 text-sm">
                <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
                  <div className="flex justify-between items-center text-xs text-[#697586]">
                    <span>Seller Lists in Native Currency</span>
                    <span className="font-semibold text-[#17202F]">Japan (JPY)</span>
                  </div>
                  <p className="mt-1 text-lg font-bold text-[#17202F] tabular-nums">
                    ¥145,000 JPY
                  </p>
                  <p className="text-xs text-[#697586]">Original merchant price protected from FX fluctuations</p>
                </div>

                <div className="flex items-center justify-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-800">
                    <Zap className="h-4 w-4" />
                  </div>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                  <div className="flex justify-between items-center text-xs text-blue-900 font-medium">
                    <span>Buyer Views Fully Calculated Landed Cost</span>
                    <span>India (INR)</span>
                  </div>
                  <p className="mt-1 text-lg font-bold text-blue-950 tabular-nums">
                    ₹79,850 INR
                  </p>
                  <div className="mt-2 space-y-1 text-xs text-blue-800">
                    <div className="flex justify-between">
                      <span>Live FX Conversion</span>
                      <span>Included</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Express Air Shipping (Tokyo → Mumbai)</span>
                      <span>₹4,200</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Customs Duty & Tax</span>
                      <span>₹9,150</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-white p-3 text-center border border-[#E5E7EB]">
                <p className="text-xs text-[#697586]">
                  Seller receives net payout in <span className="font-semibold text-[#17202F]">JPY</span> directly to their corporate bank account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-16">
        <div className="zen-container">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold tracking-tight text-[#17202F] sm:text-3xl">
              Engineered for Global Commerce
            </h2>
            <p className="mt-3 text-sm text-[#697586]">
              Zen bridges international buyers and verified regional artisans with institutional-grade commerce infrastructure.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-subtle">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Globe2 className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#17202F]">
                Reach 10+ Global Corridors
              </h3>
              <p className="mt-2 text-sm text-[#697586] leading-relaxed">
                Connect your products directly to buyers in Japan, United States, Germany, India, United Kingdom, and beyond with localized languages and preferences.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-subtle">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#17202F]">
                Transparent 5% Platform Fee
              </h3>
              <p className="mt-2 text-sm text-[#697586] leading-relaxed">
                No monthly subscription barriers or hidden cross-border surcharge fees. You only pay a 5% commission on successfully completed orders.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-subtle">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                <Truck className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#17202F]">
                Automated Customs & Landed Cost
              </h3>
              <p className="mt-2 text-sm text-[#697586] leading-relaxed">
                Eliminate surprise customs fees for your customers. Our engine computes HS-code duties, import taxes, and air freight automatically at checkout.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-subtle">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#17202F]">
                Seller Protection & Escrow
              </h3>
              <p className="mt-2 text-sm text-[#697586] leading-relaxed">
                Funds are secured through PayPal Sandbox / Escrow. Payouts are guaranteed once valid tracking with international dispatch confirmation is verified.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-subtle">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <PackageCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#17202F]">
                Multi-Package Fulfillment
              </h3>
              <p className="mt-2 text-sm text-[#697586] leading-relaxed">
                When buyers purchase goods from multiple global merchants, each seller receives dedicated sub-orders with independent shipping labels and dispatch timelines.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-subtle">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#17202F]">
                Real-Time Analytics & Settlement
              </h3>
              <p className="mt-2 text-sm text-[#697586] leading-relaxed">
                Monitor sales volume, top geographic buyer regions, stock levels, and scheduled bank settlements from a single, modern merchant portal.
              </p>
            </div>
          </div>

          {/* CTA Banner */}
          <div className="mt-16 rounded-3xl bg-[#172554] p-8 sm:p-12 text-white text-center">
            <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to expand your store internationally?
            </h3>
            <p className="mt-3 text-sm sm:text-base text-blue-200 max-w-xl mx-auto">
              Join verified merchants from Japan, Germany, USA, and India. Registration takes less than 5 minutes.
            </p>
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={handleStartSelling}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-8 text-sm font-semibold text-[#172554] shadow-md hover:bg-blue-50 transition-colors"
              >
                <span>{isSeller ? 'Open Seller Dashboard' : 'Register Store Now'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default BecomeSeller;

