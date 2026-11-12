import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BookmarkCheck, Compass, Globe2 } from 'lucide-react';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ZenLogo } from '@/components/common/ZenLogo';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';

function resolveSafeRedirect(rawRedirect) {
  if (!rawRedirect || typeof rawRedirect !== 'string') return '/';
  if (!rawRedirect.startsWith('/') || rawRedirect.startsWith('//')) return '/';
  return rawRedirect;
}

export default function Register() {
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
      title: `Account created for ${user?.fullName || 'you'}`,
      description: 'Confirm your delivery destination and display preferences to begin.',
      tone: 'success',
    });
    navigate(redirectPath, { replace: true });
  };

  return (
    <section className="mx-auto max-w-[1160px] px-4 py-12 sm:px-6 lg:py-16">
      <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="space-y-6 lg:col-span-5 lg:pt-4">
          <Link to="/" aria-label="Zen Global Home" className="inline-flex items-center focus:outline-none">
            <ZenLogo size="lg" priority alt="Zen Global" />
          </Link>

          <div className="space-y-3">
            <h1 className="text-[32px] font-[680] leading-[1.1] tracking-[-0.03em] text-[#151923] sm:text-[38px]">
              Let&apos;s set up your Zen account.
            </h1>
            <p className="text-[15.5px] leading-relaxed text-[#4A5060]">
              Create an account in seconds to save international products, choose where you shop from and which currency you&apos;d like to see, and track your PayPal orders.
            </p>
          </div>

          <div className="space-y-3 border-t border-[#E6E5E0] pt-6 text-[13px] text-[#4A5060]">
            <div className="flex items-start gap-3">
              <Compass className="mt-0.5 h-4 w-4 shrink-0 text-[#465BE6]" />
              <span>
                Guided onboarding sets residence, display currency, and delivery defaults without
                cross-overwriting.
              </span>
            </div>
            <div className="flex items-start gap-3">
              <BookmarkCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#168B66]" />
              <span>
                Bookmark international products and compare prices in your preferred currency.
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-[#465BE6]" />
              <span>
                Shop across US, Japan, Singapore, Germany, and UK merchants from one trusted checkout.
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-[#E6E5E0] bg-white p-6 shadow-card sm:p-8">
            <div className="mb-5">
              <h2 className="text-[20px] font-[640] tracking-[-0.02em] text-[#151923]">
                Create your Zen account
              </h2>
              <p className="mt-1 text-[13px] text-[#747987]">
                You can customize delivery destinations separately right after sign-up.
              </p>
            </div>

            <RegisterForm redirectPath={redirectPath} onSuccess={handleSuccess} />
          </div>
        </div>
      </div>
    </section>
  );
}

