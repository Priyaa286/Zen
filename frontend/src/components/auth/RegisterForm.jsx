import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CountrySelector } from '@/components/currency/CountrySelector';
import { CurrencySelector } from '@/components/currency/CurrencySelector';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { useAppContext } from '@/context/AppContext';
import { validateRegisterForm } from '@/utils/validators';

export function RegisterForm({ redirectPath = '/account', onSuccess }) {
  const { register, backendAuthSupported } = useAuth();
  const { residenceCountry, preferredCurrency } = useCurrency();
  const { useMockApi } = useAppContext();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    residenceCountry: residenceCountry || 'US',
    preferredCurrency: preferredCurrency || 'USD',
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loginHref =
    redirectPath && redirectPath !== '/account'
      ? `/login?redirect=${encodeURIComponent(redirectPath)}`
      : '/login';

  const hasLength = form.password.length >= 8;
  const hasLetterAndDigit = /[A-Za-z]/.test(form.password) && /\d/.test(form.password);

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
    if (serverError) setServerError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isValid, errors } = validateRegisterForm(form);
    if (!isValid) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setServerError(null);
    try {
      const user = await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        residenceCountry: form.residenceCountry,
        preferredCurrency: form.preferredCurrency,
      });
      onSuccess?.(user);
    } catch (err) {
      setServerError(err.message || 'Unable to create account right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {!useMockApi && !backendAuthSupported ? (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Backend registration not yet connected</AlertTitle>
          <AlertDescription>
            Live API registration endpoints are not enabled on the server yet. Switch to Mock Preview
            mode or continue as a guest.
          </AlertDescription>
        </Alert>
      ) : null}

      {serverError ? (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Registration error</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="register-fullname" className="block text-[12px] font-[550] text-[#151923]">
          Full name
        </label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#747987]" />
          <Input
            id="register-fullname"
            type="text"
            autoComplete="name"
            placeholder="Alex Rivera"
            value={form.fullName}
            onChange={(e) => handleFieldChange('fullName', e.target.value)}
            className="pl-9"
            aria-invalid={Boolean(fieldErrors.fullName)}
          />
        </div>
        {fieldErrors.fullName ? (
          <p className="text-[11.5px] font-medium text-red-600">{fieldErrors.fullName}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="register-email" className="block text-[12px] font-[550] text-[#151923]">
          Email address
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#747987]" />
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="alex@domain.com"
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

      <div className="grid gap-3.5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="register-password" className="block text-[12px] font-[550] text-[#151923]">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#747987]" />
            <Input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="At least 8 characters"
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

        <div className="space-y-1.5">
          <label
            htmlFor="register-confirm-password"
            className="block text-[12px] font-[550] text-[#151923]"
          >
            Confirm password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#747987]" />
            <Input
              id="register-confirm-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repeat password"
              value={form.confirmPassword}
              onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
              className="pl-9"
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
            />
          </div>
          {fieldErrors.confirmPassword ? (
            <p className="text-[11.5px] font-medium text-red-600">{fieldErrors.confirmPassword}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px]">
        <span className={`inline-flex items-center gap-1 ${hasLength ? 'text-[#168B66]' : 'text-[#747987]'}`}>
          <CheckCircle2 className="h-3.5 w-3.5" />
          8+ characters
        </span>
        <span
          className={`inline-flex items-center gap-1 ${
            hasLetterAndDigit ? 'text-[#168B66]' : 'text-[#747987]'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Includes letter & number
        </span>
      </div>

      <div className="grid gap-3.5 pt-1 sm:grid-cols-2">
        <CountrySelector
          id="register-residence-country"
          label="Residence country"
          value={form.residenceCountry}
          onChange={(code) => handleFieldChange('residenceCountry', code)}
          helperText="Sets your tax & home profile."
        />
        <CurrencySelector
          id="register-preferred-currency"
          label="Preferred currency"
          value={form.preferredCurrency}
          onChange={(code) => handleFieldChange('preferredCurrency', code)}
          helperText="Independent from country."
        />
      </div>
      {(fieldErrors.residenceCountry || fieldErrors.preferredCurrency) ? (
        <p className="text-[11.5px] font-medium text-red-600">
          {fieldErrors.residenceCountry || fieldErrors.preferredCurrency}
        </p>
      ) : null}

      <div className="space-y-1.5 pt-1">
        <label htmlFor="register-terms" className="flex cursor-pointer items-start gap-2.5">
          <Checkbox
            id="register-terms"
            checked={form.acceptTerms}
            onCheckedChange={(checked) => handleFieldChange('acceptTerms', Boolean(checked))}
            className="mt-0.5"
          />
          <span className="text-[12px] leading-relaxed text-[#4A5060]">
            I accept the Zen Global Terms of Service and understand that import charges, taxes, and PayPal currency estimates are shown before checkout.
          </span>
        </label>
        {fieldErrors.acceptTerms ? (
          <p className="text-[11.5px] font-medium text-red-600">{fieldErrors.acceptTerms}</p>
        ) : null}
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={submitting || (!useMockApi && !backendAuthSupported)}
      >
        {submitting ? 'Creating account...' : 'Create Zen Global account'}
        {!submitting ? <ArrowRight className="h-4 w-4" /> : null}
      </Button>

      <div className="border-t border-[#E6E5E0] pt-4 text-center">
        <p className="text-[13px] text-[#4A5060]">
          Already have an account?{' '}
          <Link to={loginHref} className="font-[580] text-[#465BE6] hover:text-[#3549CC]">
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
}

export default RegisterForm;

