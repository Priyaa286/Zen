import { useEffect, useState } from 'react';
import { CheckCircle2, Globe, MapPin, Sliders, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CountrySelector } from '@/components/currency/CountrySelector';
import { CurrencySelector } from '@/components/currency/CurrencySelector';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { useToast } from '@/context/ToastContext';

export function PreferencesSection() {
  const { user, updatePreferences } = useAuth();
  const {
    residenceCountry,
    deliveryCountry,
    preferredCurrency,
    displayPreferences,
    detectCountrySuggestion,
    formatConverted,
  } = useCurrency();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    residenceCountry: user?.residenceCountry || residenceCountry || 'US',
    preferredCurrency: user?.preferredCurrency || preferredCurrency || 'USD',
    defaultDeliveryCountry: user?.defaultDeliveryCountry || deliveryCountry || 'US',
    showOriginalPriceBadge: displayPreferences?.showOriginalPriceBadge ?? true,
    compactCurrencyFormat: displayPreferences?.compactCurrencyFormat ?? false,
  });
  const [detecting, setDetecting] = useState(false);
  const [locationHint, setLocationHint] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      residenceCountry: user?.residenceCountry || residenceCountry || 'US',
      preferredCurrency: user?.preferredCurrency || preferredCurrency || 'USD',
      defaultDeliveryCountry: user?.defaultDeliveryCountry || deliveryCountry || 'US',
      showOriginalPriceBadge: displayPreferences?.showOriginalPriceBadge ?? true,
      compactCurrencyFormat: displayPreferences?.compactCurrencyFormat ?? false,
    });
  }, [user, residenceCountry, deliveryCountry, preferredCurrency, displayPreferences]);

  const handleSuggestLocation = async () => {
    setDetecting(true);
    try {
      const suggestion = await detectCountrySuggestion();
      if (suggestion?.suggestedCountry) {
        setForm((prev) => ({
          ...prev,
          residenceCountry: suggestion.suggestedCountry,
          defaultDeliveryCountry: suggestion.suggestedCountry,
        }));
        setLocationHint(
          `Detected ${suggestion.suggestedCountry} for country settings. Preferred currency (${form.preferredCurrency}) stayed independent.`
        );
      } else {
        setLocationHint('Browser location could not be resolved; select your country manually.');
      }
    } finally {
      setDetecting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updatePreferences(form);
      showToast({
        title: 'Localization preferences updated',
        description: `Currency set to ${form.preferredCurrency}, default delivery to ${form.defaultDeliveryCountry}.`,
        tone: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Failed to save preferences',
        description: err.message || 'Please try again.',
        tone: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="space-y-6 rounded-xl border border-[#E6E5E0] bg-white p-6 shadow-subtle"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E6E5E0] pb-4">
        <div>
          <h2 className="text-[18px] font-[640] tracking-[-0.015em] text-[#151923]">
            Country &amp; Currency Preferences
          </h2>
          <p className="mt-0.5 text-[13px] text-[#747987]">
            Choose where you shop from and which currency you&apos;d like to see. Updating one won&apos;t overwrite the others.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleSuggestLocation} disabled={detecting}>
          <MapPin className="h-3.5 w-3.5" />
          {detecting ? 'Detecting...' : 'Suggest location'}
        </Button>
      </div>

      {locationHint ? (
        <p className="flex items-center gap-2 rounded-lg border border-[#168B66]/20 bg-[#F0F9F6] px-3.5 py-2.5 text-[12.5px] text-[#127253]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {locationHint}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-[#E6E5E0] bg-[#F8F7F4] p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[12px] font-[580] text-[#151923]">
            <Globe className="h-3.5 w-3.5 text-[#465BE6]" />
            Residence country
          </div>
          <CountrySelector
            id="pref-residence-country"
            value={form.residenceCountry}
            onChange={(val) => setForm((prev) => ({ ...prev, residenceCountry: val }))}
            helperText="Where you are based for account settings."
          />
        </div>

        <div className="rounded-lg border border-[#E6E5E0] bg-[#F8F7F4] p-4">
          <div className="mb-2 flex items-center justify-between gap-1.5 text-[12px] font-[580] text-[#151923]">
            <span className="flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-[#465BE6]" />
              Display currency
            </span>
            <span className="tabular-nums text-[11px] font-medium text-[#747987]">
              {formatConverted(420, form.preferredCurrency)}
            </span>
          </div>
          <CurrencySelector
            id="pref-preferred-currency"
            value={form.preferredCurrency}
            onChange={(val) => setForm((prev) => ({ ...prev, preferredCurrency: val }))}
            helperText="Used for converted prices and estimated delivered costs."
          />
        </div>

        <div className="rounded-lg border border-[#E6E5E0] bg-[#F8F7F4] p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[12px] font-[580] text-[#151923]">
            <MapPin className="h-3.5 w-3.5 text-[#168B66]" />
            Default delivery country
          </div>
          <CountrySelector
            id="pref-delivery-country"
            value={form.defaultDeliveryCountry}
            onChange={(val) => setForm((prev) => ({ ...prev, defaultDeliveryCountry: val }))}
            helperText="Estimates shipping, duties & transit ETA."
          />
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-[#E6E5E0] p-4">
        <div className="flex items-center gap-2 text-[13px] font-[580] text-[#151923]">
          <Sliders className="h-4 w-4 text-[#465BE6]" />
          Marketplace display options
        </div>

        <label htmlFor="pref-show-original" className="flex cursor-pointer items-start gap-2.5">
          <Checkbox
            id="pref-show-original"
            checked={form.showOriginalPriceBadge}
            onCheckedChange={(checked) =>
              setForm((prev) => ({ ...prev, showOriginalPriceBadge: Boolean(checked) }))
            }
            className="mt-0.5"
          />
          <div>
            <p className="text-[13px] font-[520] text-[#151923]">
              Always show original merchant price alongside converted quote
            </p>
            <p className="text-[12px] text-[#747987]">
              Keeps merchant base currency (e.g. JPY, USD, EUR) visible on every product card.
            </p>
          </div>
        </label>

        <label htmlFor="pref-compact-currency" className="flex cursor-pointer items-start gap-2.5">
          <Checkbox
            id="pref-compact-currency"
            checked={form.compactCurrencyFormat}
            onCheckedChange={(checked) =>
              setForm((prev) => ({ ...prev, compactCurrencyFormat: Boolean(checked) }))
            }
            className="mt-0.5"
          />
          <div>
            <p className="text-[13px] font-[520] text-[#151923]">
              Append ISO currency codes on converted figures
            </p>
            <p className="text-[12px] text-[#747987]">
              Displays explicit 3-letter ISO codes next to symbol totals for extra clarity.
            </p>
          </div>
        </label>
      </div>

      <div className="flex justify-end border-t border-[#E6E5E0] pt-4">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving preferences...' : 'Save preferences'}
        </Button>
      </div>
    </form>
  );
}

export default PreferencesSection;

