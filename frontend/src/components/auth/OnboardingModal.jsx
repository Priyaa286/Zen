import { useEffect, useState } from 'react';
import { CheckCircle2, Compass, Globe, MapPin, ShieldCheck, Wallet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CountrySelector } from '@/components/currency/CountrySelector';
import { CurrencySelector } from '@/components/currency/CurrencySelector';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { useToast } from '@/context/ToastContext';

export function OnboardingModal() {
  const { user, isAuthenticated, needsOnboarding, completeOnboarding } = useAuth();
  const {
    residenceCountry,
    deliveryCountry,
    preferredCurrency,
    detectCountrySuggestion,
    formatConverted,
  } = useCurrency();
  const { showToast } = useToast();

  const [selectedResidence, setSelectedResidence] = useState(residenceCountry || 'US');
  const [selectedCurrency, setSelectedCurrency] = useState(preferredCurrency || 'USD');
  const [selectedDelivery, setSelectedDelivery] = useState(deliveryCountry || 'US');
  const [locationHint, setLocationHint] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (needsOnboarding && user) {
      setSelectedResidence(user.residenceCountry || residenceCountry || 'US');
      setSelectedCurrency(user.preferredCurrency || preferredCurrency || 'USD');
      setSelectedDelivery(user.defaultDeliveryCountry || user.residenceCountry || deliveryCountry || 'US');
      setLocationHint(null);
    }
  }, [needsOnboarding, user, residenceCountry, preferredCurrency, deliveryCountry]);

  if (!isAuthenticated || !needsOnboarding) {
    return null;
  }

  const handleSuggestLocation = async () => {
    setDetecting(true);
    try {
      const suggestion = await detectCountrySuggestion();
      if (suggestion?.suggestedCountry) {
        setSelectedResidence(suggestion.suggestedCountry);
        setSelectedDelivery(suggestion.suggestedCountry);
        setLocationHint(
          `Detected ${suggestion.suggestedCountry}. Your preferred display currency (${selectedCurrency}) stays unchanged unless you update it below.`
        );
      } else {
        setLocationHint('Location permission declined or unavailable — please choose manually.');
      }
    } finally {
      setDetecting(false);
    }
  };

  const handleSaveOnboarding = async () => {
    setSaving(true);
    try {
      await completeOnboarding({
        residenceCountry: selectedResidence,
        preferredCurrency: selectedCurrency,
        defaultDeliveryCountry: selectedDelivery,
      });
      showToast({
        title: 'Preferences saved',
        description: `Shopping in ${selectedCurrency} with default delivery to ${selectedDelivery}.`,
        tone: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Could not save preferences',
        description: err.message || 'Please review your selections and try again.',
        tone: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const sampleConvertedPrice = formatConverted(420, selectedCurrency);

  return (
    <Dialog
      open={Boolean(isAuthenticated && needsOnboarding)}
      onOpenChange={(open) => {
        if (!open && !saving) {
          handleSaveOnboarding();
        }
      }}
    >
      <DialogContent className="max-w-xl bg-white p-6 sm:p-7">
        <DialogHeader>
          <div className="mb-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-[#E6E5E0] bg-[#F8F7F4] px-2.5 py-1 text-[11px] font-[580] text-[#465BE6]">
            <Compass className="h-3.5 w-3.5" />
            Set Up Your Preferences
          </div>
          <DialogTitle className="text-[22px] font-[680] tracking-[-0.02em] text-[#151923]">
            Choose your country, currency, and delivery destination
          </DialogTitle>
          <DialogDescription className="text-[13.5px] leading-relaxed text-[#4A5060]">
            Choose where you shop from and which currency you&apos;d like to see — for instance, living in Germany, viewing prices in USD, and shipping gifts to Japan. You can update these anytime.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="rounded-lg border border-[#E6E5E0] bg-[#F8F7F4] p-4">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[12.5px] font-[580] text-[#151923]">
                <Globe className="h-4 w-4 text-[#465BE6]" />
                1. Country of residence
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSuggestLocation}
                disabled={detecting}
              >
                <MapPin className="h-3.5 w-3.5" />
                {detecting ? 'Checking locale...' : 'Suggest from browser'}
              </Button>
            </div>
            <CountrySelector
              id="onboarding-residence-country"
              value={selectedResidence}
              onChange={setSelectedResidence}
              helperText="Used as your account profile jurisdiction."
            />
            {locationHint ? (
              <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-[#168B66]">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                {locationHint}
              </p>
            ) : null}
          </div>

          <div className="rounded-lg border border-[#E6E5E0] bg-white p-4">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[12.5px] font-[580] text-[#151923]">
                <Wallet className="h-4 w-4 text-[#465BE6]" />
                2. Preferred display currency
              </div>
              <span className="tabular-nums rounded-md bg-[#F1EFE9] px-2 py-0.5 text-[11.5px] font-medium text-[#151923]">
                Preview: {sampleConvertedPrice}
              </span>
            </div>
            <CurrencySelector
              id="onboarding-preferred-currency"
              value={selectedCurrency}
              onChange={setSelectedCurrency}
              helperText="All prices will show the seller's original currency alongside the converted total in this currency."
            />
          </div>

          <div className="rounded-lg border border-[#E6E5E0] bg-white p-4">
            <div className="mb-2.5 flex items-center gap-2 text-[12.5px] font-[580] text-[#151923]">
              <MapPin className="h-4 w-4 text-[#168B66]" />
              3. Default delivery country
            </div>
            <CountrySelector
              id="onboarding-delivery-country"
              value={selectedDelivery}
              onChange={setSelectedDelivery}
              helperText="Used to estimate shipping, import charges, and delivery times."
            />
          </div>
        </div>

        <DialogFooter className="flex-col-reverse items-stretch justify-between gap-2 border-t border-[#E6E5E0] pt-4 sm:flex-row sm:items-center">
          <span className="flex items-center gap-1.5 text-[11.5px] text-[#747987]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#168B66]" />
            You always review estimated costs before confirming PayPal payment
          </span>
          <Button type="button" size="lg" onClick={handleSaveOnboarding} disabled={saving}>
            {saving ? 'Saving defaults...' : 'Confirm & continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default OnboardingModal;

