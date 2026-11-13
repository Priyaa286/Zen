import { useState, useRef, useEffect } from 'react';
import {
  Store,
  Upload,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Lock,
  Building,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import {
  validateUploadFile,
  createLocalImagePreview,
  uploadAsset,
} from '@/services/uploadService';
import { getSellerStoreMe, updateSellerStore } from '@/services/sellerService';

export default function StoreSettings() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    storeName: '',
    businessName: '',
    description: '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    shippingOrigin: 'JP',
    merchantCurrency: 'JPY',
    website: '',
    returnPolicy: '',
    supportEmail: '',
  });

  // Images
  const [currentLogo, setCurrentLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [currentBanner, setCurrentBanner] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadStore() {
      if (!user?.email) return;
      try {
        const data = await getSellerStoreMe(user.email);
        if (mounted && data) {
          setStore(data);
          setFormData({
            storeName: data.storeName || 'Tokyo Optics & Craft',
            businessName: data.businessName || 'Tokyo Optics & Craft Co., Ltd.',
            description: data.description || 'Artisanal Japanese optical lenses, camera accessories, and handcrafted brass goods dispatched from Tokyo Narita Air Hub.',
            businessEmail: data.businessEmail || data.ownerEmail || 'contact@tokyo-optics.jp',
            businessPhone: data.businessPhone || '+81 3 5555 0192',
            businessAddress: data.businessAddress || '1-4-12 Ginza, Chuo-ku, Tokyo 104-0061, Japan',
            shippingOrigin: data.shippingOrigin || 'JP',
            merchantCurrency: data.merchantCurrency || 'JPY',
            website: data.website || 'https://tokyo-optics.jp',
            returnPolicy: data.returnPolicy || '14-day international returns accepted for unopened merchandise in original packaging. Return shipping covered for verified transit defects.',
            supportEmail: data.supportEmail || 'support@tokyo-optics.jp',
          });
          setCurrentLogo(data.logoUrl || null);
          setCurrentBanner(data.bannerUrl || null);
        }
      } catch (err) {
        console.error('Failed to load store profile:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadStore();
    return () => {
      mounted = false;
    };
  }, [user?.email]);

  // Clean previews on unmount
  useEffect(() => {
    return () => {
      if (logoPreview?.revoke) logoPreview.revoke();
      if (bannerPreview?.revoke) bannerPreview.revoke();
    };
  }, [logoPreview, bannerPreview]);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateUploadFile(file);
    if (!validation.valid) {
      showToast({ title: 'Invalid Image', description: validation.error, tone: 'critical' });
      return;
    }

    if (logoPreview?.revoke) logoPreview.revoke();
    const preview = createLocalImagePreview(file);
    setLogoPreview({ file, ...preview });
    showToast({ title: 'Store Logo Selected', description: `${file.name} ready to save.`, tone: 'info' });
  };

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateUploadFile(file);
    if (!validation.valid) {
      showToast({ title: 'Invalid Image', description: validation.error, tone: 'critical' });
      return;
    }

    if (bannerPreview?.revoke) bannerPreview.revoke();
    const preview = createLocalImagePreview(file);
    setBannerPreview({ file, ...preview });
    showToast({ title: 'Store Banner Selected', description: `${file.name} ready to save.`, tone: 'info' });
  };

  const handleSaveStore = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let finalLogo = currentLogo;
      let finalBanner = currentBanner;

      if (logoPreview?.file) {
        const uploadedLogo = await uploadAsset(logoPreview.file, { folder: 'stores' });
        finalLogo = uploadedLogo.url;
      }

      if (bannerPreview?.file) {
        const uploadedBanner = await uploadAsset(bannerPreview.file, { folder: 'stores' });
        finalBanner = uploadedBanner.url;
      }

      const payload = {
        ...formData,
        logoUrl: finalLogo,
        bannerUrl: finalBanner,
      };

      if (store?.id) {
        await updateSellerStore(store.id, payload);
      }

      setCurrentLogo(finalLogo);
      setCurrentBanner(finalBanner);
      setLogoPreview(null);
      setBannerPreview(null);

      showToast({
        title: 'Store Profile Updated',
        description: 'Business information and media assets have been saved.',
        tone: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Save Failed',
        description: err.message,
        tone: 'critical',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-[#465BE5]" />
      </div>
    );
  }

  const isApproved = store?.verificationStatus === 'APPROVED';
  const displayLogo = logoPreview?.previewUrl || currentLogo;
  const displayBanner = bannerPreview?.previewUrl || currentBanner;

  return (
    <div className="space-y-6">
      {/* Page Toolbar */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-3.5 shadow-subtle">
        <h1 className="text-xl font-bold tracking-tight text-[#17202F]">
          Store Profile
        </h1>
        <p className="mt-0.5 text-xs text-[#697586]">
          Manage public storefront branding, corporate credentials, and international return policies.
        </p>
      </div>

      <form onSubmit={handleSaveStore} className="space-y-6">
        {/* Media Assets: Banner & Logo */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-subtle space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-[#17202F]">Store Visual Identity</h2>
            <p className="text-xs text-[#697586] mt-0.5">
              Upload your official store logo and international storefront banner.
            </p>
          </div>

          {/* Banner */}
          <div>
            <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
              Storefront Banner (Recommended: 1200 x 300 px)
            </label>
            <div className="relative h-40 w-full rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] overflow-hidden flex items-center justify-center">
              {displayBanner ? (
                <img
                  src={displayBanner}
                  alt="Store banner"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-center text-[#9CA3AF]">
                  <ImageIcon className="h-8 w-8 text-[#CBD5E1]" />
                  <p className="text-xs font-medium">No banner uploaded yet</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="absolute bottom-3 right-3 rounded-lg bg-[#17202F]/80 text-white px-3 py-1.5 text-xs font-semibold backdrop-blur-xs hover:bg-[#17202F] transition-colors"
              >
                {displayBanner ? 'Change Banner' : 'Upload Banner'}
              </button>
            </div>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleBannerChange}
              className="hidden"
            />
          </div>

          {/* Logo */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
            <div className="relative h-20 w-20 shrink-0 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] overflow-hidden flex items-center justify-center shadow-subtle">
              {displayLogo ? (
                <img
                  src={displayLogo}
                  alt="Store logo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#172554] text-xl font-bold text-white uppercase">
                  {formData.storeName.charAt(0) || 'M'}
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-[#17202F]">Store Logo</p>
              <p className="text-[11px] text-[#697586] mt-0.5">
                Displays on checkout invoices, product badges, and merchant store listing.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  className="h-8 text-xs gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5 text-[#697586]" />
                  {displayLogo ? 'Replace Logo' : 'Upload Logo'}
                </Button>
                {displayLogo && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (logoPreview?.revoke) logoPreview.revoke();
                      setLogoPreview(null);
                      setCurrentLogo(null);
                    }}
                    className="h-8 text-xs text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleLogoChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Store Business Information */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-subtle space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-[#17202F]">Store Profile & Legal Credentials</h2>
            <p className="text-xs text-[#697586] mt-0.5">
              Verified legal business credentials and international customer contact channels.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                Store Display Name
              </label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 px-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#17202F]">
                  Registered Legal Entity Name
                </label>
                <span className="flex items-center gap-1 text-[10.5px] text-[#697586]">
                  <Lock className="h-3 w-3 text-gray-400" />
                  Verified
                </span>
              </div>
              <input
                type="text"
                readOnly
                disabled
                value={formData.businessName}
                className="w-full rounded-lg border border-[#E5E7EB] bg-gray-50 py-2 px-3 text-xs text-[#697586] cursor-not-allowed"
                title="Legal name verified via commercial registration documents"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                Business Description & Craftsmanship Story
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border border-[#E5E7EB] bg-white p-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                Business Inquiries Email
              </label>
              <input
                type="email"
                value={formData.businessEmail}
                onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 px-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                Business Contact Phone
              </label>
              <input
                type="tel"
                value={formData.businessPhone}
                onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 px-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                Physical Workshop / Business Address
              </label>
              <input
                type="text"
                value={formData.businessAddress}
                onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 px-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                Registered Country & Dispatch Hub
              </label>
              <input
                type="text"
                readOnly
                disabled
                value={formData.shippingOrigin === 'DE' ? 'Germany (DE)' : 'Japan (JP)'}
                className="w-full rounded-lg border border-[#E5E7EB] bg-gray-50 py-2 px-3 text-xs text-[#697586] cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                Store Base Currency
              </label>
              <input
                type="text"
                readOnly
                disabled
                value={`${formData.merchantCurrency} (${formData.merchantCurrency === 'JPY' ? 'Japanese Yen' : 'Euro'})`}
                className="w-full rounded-lg border border-[#E5E7EB] bg-gray-50 py-2 px-3 text-xs font-mono font-bold text-[#17202F] cursor-not-allowed"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                Official Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 px-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#17202F] mb-1.5">
                International Return & Warranty Policy
              </label>
              <textarea
                rows={3}
                value={formData.returnPolicy}
                onChange={(e) => setFormData({ ...formData, returnPolicy: e.target.value })}
                className="w-full rounded-lg border border-[#E5E7EB] bg-white p-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#172554] text-white hover:bg-[#1E3A8A] text-xs font-semibold h-9 px-5 gap-1.5 shadow-xs"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Save Store Profile</span>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

