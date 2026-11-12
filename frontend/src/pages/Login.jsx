import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Globe, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import { LoginForm } from '@/components/auth/LoginForm';
import { ZenLogo } from '@/components/common/ZenLogo';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';

function resolveSafeRedirect(rawRedirect) {
  if (!rawRedirect || typeof rawRedirect !== 'string') return '/';
  if (!rawRedirect.startsWith('/') || rawRedirect.startsWith('//')) return '/';
  return rawRedirect;
}

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const { showToast } = useToast();

  const redirectPath = resolveSafeRedirect(searchParams.get('redirect'));

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirectPath]);

  const handleSuccess = (user) => {
    showToast({
      title: `Welcome back, ${user?.fullName || 'shopper'}`,
      description: `Personalized prices loaded in ${user?.preferredCurrency || 'USD'}.`,
      tone: 'success',
    });
    navigate(redirectPath, { replace: true });
  };

  const handleContinueGuest = () => {
    const guestTarget =
      redirectPath && !redirectPath.startsWith('/account') ? redirectPath : '/results';
    navigate(guestTarget);
  };

  return (
    <section className="mx-auto max-w-[1160px] px-4 py-12 sm:px-6 lg:py-16">
      <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="space-y-6 lg:col-span-5 lg:pt-4">
          <Link to="/" aria-label="Zen Global Home" className="inline-flex items-center focus:outline-none">
            <ZenLogo size="lg" priority alt="Zen Global" />
          </Link>

          <div className="space-y-3">
            <h1 className="text-[34px] font-[680] leading-[1.08] tracking-[-0.03em] text-[#151923] sm:text-[40px]">
              Good to see you again.
            </h1>
            <p className="text-[16px] leading-relaxed text-[#4A5060]">
              Sign in to access your saved products, preferred currency, delivery country, and past PayPal order receipts.
            </p>
          </div>

          <div className="space-y-3 border-t border-[#E6E5E0] pt-6">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E6E5E0] bg-white text-[#465BE6]">
                <Wallet className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[13.5px] font-[600] text-[#151923]">
                  Independent country & currency controls
                </p>
                <p className="text-[12.5px] text-[#747987]">
                  Browse Tokyo, London, and US stores settled into your exact display currency.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E6E5E0] bg-white text-[#168B66]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[13.5px] font-[600] text-[#151923]">
                  Transparent delivered pricing
                </p>
                <p className="text-[12.5px] text-[#747987]">
                  Duties, international courier fees, and PayPal checkout verified upfront.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E6E5E0] bg-white text-[#465BE6]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[13.5px] font-[600] text-[#151923]">
                  Personalized AI shopping history
                </p>
                <p className="text-[12.5px] text-[#747987]">
                  Keep your saved shortlists, delivery addresses, and recent queries synced.
                </p>
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-[#E6E5E0] bg-white px-3.5 py-1.5 text-[12px] text-[#747987]">
            <Globe className="h-3.5 w-3.5 text-[#168B66]" />
            Guest discovery and AI shopping remain open without an account
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-[#E6E5E0] bg-white p-6 shadow-card sm:p-8">
            <div className="mb-6">
              <h2 className="text-[20px] font-[640] tracking-[-0.02em] text-[#151923]">
                Sign in to your account
              </h2>
              <p className="mt-1 text-[13px] text-[#747987]">
                Enter your email and password to restore your personalized marketplace.
              </p>
            </div>

            <LoginForm
              redirectPath={redirectPath}
              onSuccess={handleSuccess}
              onContinueGuest={handleContinueGuest}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

