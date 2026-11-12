import { useEffect, useState } from 'react';
import { CheckCircle2, Mail, MapPin, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CountrySelector } from '@/components/currency/CountrySelector';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { validateNonEmptyText } from '@/utils/validators';

export function ProfileSection() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [residenceCountry, setResidenceCountry] = useState(user?.residenceCountry || 'US');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setResidenceCountry(user.residenceCountry || 'US');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateNonEmptyText(fullName, 'Full name');
    if (err) {
      setError(err);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        residenceCountry,
      });
      showToast({
        title: 'Profile updated',
        description: 'Your identity and residence details have been saved.',
        tone: 'success',
      });
    } catch (submitErr) {
      setError(submitErr.message || 'Unable to save profile updates.');
    } finally {
      setSaving(false);
    }
  };

  const savedAddresses = Array.isArray(user?.savedAddresses) ? user.savedAddresses : [];

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-[#E6E5E0] bg-white p-6 shadow-subtle"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E6E5E0] pb-4">
          <div>
            <h2 className="text-[18px] font-[640] tracking-[-0.015em] text-[#151923]">
              Account Details
            </h2>
            <p className="mt-0.5 text-[13px] text-[#747987]">
              Update your name and country of residence separately from your display currency.
            </p>
          </div>
          <Badge variant="verified" className="gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified account
          </Badge>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="profile-fullname" className="block text-[12px] font-[550] text-[#151923]">
              Full name
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#747987]" />
              <Input
                id="profile-fullname"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (error) setError(null);
                }}
                className="pl-9"
              />
            </div>
            {error ? <p className="text-[11.5px] font-medium text-red-600">{error}</p> : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-email" className="block text-[12px] font-[550] text-[#151923]">
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#747987]" />
              <Input
                id="profile-email"
                value={user?.email || ''}
                disabled
                className="bg-[#F8F7F4] pl-9 text-[#747987]"
              />
            </div>
            <p className="text-[11.5px] text-[#747987]">Used to sign in and receive order receipts.</p>
          </div>
        </div>

        <div className="mt-4 max-w-md">
          <CountrySelector
            id="profile-residence-country"
            label="Country of residence"
            value={residenceCountry}
            onChange={setResidenceCountry}
            helperText="Changing residence never alters your preferred display currency automatically."
          />
        </div>

        <div className="mt-6 flex items-center justify-end border-t border-[#E6E5E0] pt-4">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving changes...' : 'Save profile'}
          </Button>
        </div>
      </form>

      <div className="rounded-xl border border-[#E6E5E0] bg-white p-6 shadow-subtle">
        <div className="flex items-center justify-between gap-2 border-b border-[#E6E5E0] pb-4">
          <div>
            <h3 className="text-[16px] font-[620] text-[#151923]">Saved Delivery Addresses</h3>
            <p className="mt-0.5 text-[12.5px] text-[#747987]">
              Filled in automatically at checkout.
            </p>
          </div>
          <span className="tabular-nums text-[12px] font-medium text-[#747987]">
            {savedAddresses.length} saved
          </span>
        </div>

        {savedAddresses.length === 0 ? (
          <p className="mt-4 text-[13px] text-[#747987]">
            No delivery addresses saved yet. Any address entered at checkout will be saved here for
            faster future purchases.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {savedAddresses.map((addr, idx) => (
              <div
                key={addr.id || `${addr.addressLine1}-${addr.postalCode}-${idx}`}
                className="rounded-lg border border-[#E6E5E0] bg-[#F8F7F4] p-4 text-[12.5px]"
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-[600] text-[#151923]">
                    <MapPin className="h-3.5 w-3.5 text-[#465BE6]" />
                    {addr.label || 'Delivery address'}
                  </span>
                  {addr.isDefault ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-[550] text-[#168B66]">
                      <CheckCircle2 className="h-3 w-3" />
                      Default
                    </span>
                  ) : null}
                </div>
                <p className="font-medium text-[#151923]">{addr.fullName}</p>
                <p className="text-[#4A5060]">{addr.addressLine1}</p>
                <p className="text-[#4A5060]">
                  {addr.city}
                  {addr.state ? `, ${addr.state}` : ''} {addr.postalCode} ({addr.countryCode})
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileSection;
