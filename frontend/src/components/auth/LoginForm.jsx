import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useAppContext } from '@/context/AppContext';
import { validateLoginForm } from '@/utils/validators';
import { MOCK_DEMO_CREDENTIALS } from '@/mocks/mockAuth';

export function LoginForm({ redirectPath = '/', onSuccess, onContinueGuest }) {
  const { login, backendAuthSupported, googleOAuthConfigured } = useAuth();
  const { useMockApi } = useAppContext();

  const [form, setForm] = useState({
    email: '',
    password: '',
    rememberMe: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const registerHref =
    redirectPath && redirectPath !== '/' && redirectPath !== '/account'
      ? `/register?redirect=${encodeURIComponent(redirectPath)}`
      : '/register';

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
    if (serverError) setServerError(null);
  };

  const handleFillDemo = () => {
    if (!useMockApi) return;
    setForm({
      email: MOCK_DEMO_CREDENTIALS.email,
      password: MOCK_DEMO_CREDENTIALS.password,
      rememberMe: true,
    });
    setFieldErrors({});
    setServerError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isValid, errors } = validateLoginForm(form);
    if (!isValid) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setServerError(null);
    try {
      const user = await login({
        email: form.email,
        password: form.password,
        rememberMe: form.rememberMe,
      });
      onSuccess?.(user);
    } catch (err) {
      setServerError(err.message || 'Unable to sign in. Check your credentials and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {!useMockApi && !backendAuthSupported ? (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Backend authentication not yet connected</AlertTitle>
          <AlertDescription>
            Live API mode is active, and FastAPI authentication endpoints are pending integration.
            You can continue shopping as a guest or use Mock Preview mode to test account personalization.
          </AlertDescription>
        </Alert>
      ) : null}

      {serverError ? (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sign-in failed</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="login-email" className="block text-[12px] font-[550] text-[#151923]">
          Email address
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#747987]" />
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@domain.com"
            value={form.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            className="pl-9"
            aria-invalid={Boolean(fieldErrors.email)}
          />
        </div>
        {fieldErrors.email ? (
          <p className="text-[11.5px] font-medium text-red-600">{fieldErrors.email}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="login-password" className="block text-[12px] font-[550] text-[#151923]">
            Password
          </label>
          <Link
            to="/forgot-password"
            className="text-[12px] font-[550] text-[#465BE6] transition-colors hover:text-[#3549CC]"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#747987]" />
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={form.password}
            onChange={(e) => handleFieldChange('password', e.target.value)}
            className="pl-9 pr-10"
            aria-invalid={Boolean(fieldErrors.password)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-[#747987] transition-colors hover:bg-[#F8F7F4] hover:text-[#151923]"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {fieldErrors.password ? (
          <p className="text-[11.5px] font-medium text-red-600">{fieldErrors.password}</p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 pt-0.5">
        <label htmlFor="login-remember" className="flex cursor-pointer items-center gap-2.5">
          <Checkbox
            id="login-remember"
            checked={form.rememberMe}
            onCheckedChange={(checked) => handleFieldChange('rememberMe', Boolean(checked))}
          />
          <span className="text-[12.5px] text-[#4A5060]">Keep me signed in on this device</span>
        </label>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={submitting || (!useMockApi && !backendAuthSupported)}
      >
        {submitting ? 'Signing in...' : 'Sign in to Zen'}
        {!submitting ? <ArrowRight className="h-4 w-4" /> : null}
      </Button>

      {googleOAuthConfigured ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => {
            setServerError('Google OAuth requires live backend callback verification.');
          }}
        >
          Continue with Google
        </Button>
      ) : null}

      {useMockApi ? (
        <div className="rounded-lg border border-[#E6E5E0] bg-[#F8F7F4] p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-0.5">
              <p className="flex items-center gap-1.5 text-[11.5px] font-[580] text-[#151923]">
                <Sparkles className="h-3.5 w-3.5 text-[#465BE6]" />
                Demo account (Mock preview)
              </p>
              <p className="text-[11.5px] text-[#747987]">
                {MOCK_DEMO_CREDENTIALS.email} / {MOCK_DEMO_CREDENTIALS.password}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleFillDemo}>
              Use demo user
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-3 border-t border-[#E6E5E0] pt-4 text-center">
        <p className="text-[13px] text-[#4A5060]">
          New to Zen Global?{' '}
          <Link to={registerHref} className="font-[580] text-[#465BE6] hover:text-[#3549CC]">
            Create an account
          </Link>
        </p>
        {onContinueGuest ? (
          <button
            type="button"
            onClick={onContinueGuest}
            className="text-[12.5px] font-[520] text-[#747987] transition-colors hover:text-[#151923]"
          >
            Continue browsing as guest
          </button>
        ) : null}
      </div>
    </form>
  );
}

export default LoginForm;

