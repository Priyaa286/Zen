import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass, Sparkles } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { SEOHead } from '@/components/common/SEOHead';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex min-h-[65vh] max-w-lg flex-col items-center justify-center space-y-5 px-4 py-16 text-center">
      <SEOHead
        title="404 – Page Not Found"
        description="The page you requested could not be found. Explore our international marketplace or ask our AI Shopping Assistant."
        robots="noindex, follow"
      />
      <div className="flex h-12 w-12 items-center justify-center rounded-md border border-[#E6E5E0] bg-white text-[#465BE6]">
        <Compass className="h-6 w-6" />
      </div>
      <div className="space-y-2">
        <p className="zen-eyebrow text-[#465BE6]">404</p>
        <h1 className="text-2xl font-semibold tracking-tight text-[#151923] sm:text-3xl">
          Page not found
        </h1>
        <p className="text-sm leading-relaxed text-[#747987]">
          We couldn&apos;t find that page. Head back home or open our Shopping Assistant to look for products.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" variant="outline" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
        <Button type="button" variant="primary" onClick={() => navigate('/assistant')}>
          <Sparkles className="h-4 w-4" />
          Open Shopping Assistant
        </Button>
      </div>
    </div>
  );
}

export default NotFound;
