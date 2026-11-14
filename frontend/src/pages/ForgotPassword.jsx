import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ZenLogo } from '@/components/common/ZenLogo';
import { SEOHead } from '@/components/common/SEOHead';
import { useAuth } from '@/hooks/useAuth';
import { useAppContext } from '@/context/AppContext';
import { validateEmail } from '@/utils/validators';

export default function ForgotPassword() {
  const { requestPasswordReset, backendAuthSupported } = useAuth();
  const { useMockApi } = useAppContext();

  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentResult, setSentResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }

    setSubmitting(true);
    setServerError(null);
    try {
      const result = await requestPasswordReset({ email: email.trim() });
      setSentResult(result);
    } catch (err) {
      setServerError(err.message || 'Unable to process reset request right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-lg px-4 py-14 sm:px-6 lg:py-20">
      <SEOHead
        title="Reset Password"
        robots="noindex, nofollow"
      />
      <div className="rounded-2xl border border-[#E6E5E0] bg-white p-6 shadow-card sm:p-8">
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-[#E6E5E0] pb-4">
          <Link to="/" aria-label="Zen Global Home" className="inline-flex items-center focus:outline-none">
            <ZenLogo size="md" alt="Zen Global" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-[550] text-[#747987] transition-colors hover:text-[#151923]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </div>

        <h1 className="text-[24px] font-[680] tracking-[-0.025em] text-[#151923]">
          Forgot your password? We&apos;ll help you get back in.
        </h1>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#4A5060]">
          Enter the email address for your Zen account and we&apos;ll send instructions to reset your password.
        </p>

        {!useMockApi && !backendAuthSupported ? (
          <Alert variant="warning" className="mt-5">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Backend reset endpoint pending</AlertTitle>
            <AlertDescription>
              Live FastAPI password reset endpoints are not enabled yet. Switch to Mock Preview mode
              or continue browsing as a guest.
            </AlertDescription>
          </Alert>
        ) : null}

        {sentResult ? (
          <div className="mt-6 space-y-4 rounded-xl border border-[#168B66]/25 bg-[#F0F9F6] p-5">
            <div className="flex items-start gap-2.5 text-[#127253]">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="space-y-1">
                <p className="text-[14px] font-[620]">Reset request received</p>
                <p className="text-[13px] leading-relaxed">{sentResult.message}</p>
              </div>
            </div>
            <Button asChild className="w-full">
              <Link to="/login">Return to sign in</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            {serverError ? (
              <Alert variant="destructive" role="alert">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Unable to send instructions</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-1.5">
              <label htmlFor="reset-email" className="block text-[12px] font-[550] text-[#151923]">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#747987]" />
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                    if (serverError) setServerError(null);
                  }}
                  className="pl-9"
                  aria-invalid={Boolean(error)}
                />
              </div>
              {error ? <p className="text-[11.5px] font-medium text-red-600">{error}</p> : null}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting || (!useMockApi && !backendAuthSupported)}
            >
              {submitting ? 'Sending instructions...' : 'Send reset instructions'}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}

